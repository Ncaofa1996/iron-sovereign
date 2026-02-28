// XP Engine — Idempotent CSV import processing with three-state day model
// STATES: UNPROCESSED → MUTABLE (today) → FINALIZED (yesterday+)

import { parseLiftosaur, parseCronometer, parseRenpho, parseFitbit, today } from './csvParsers.js';
import { calculateDayXP } from './xpFormulas.js';

const LEDGER_KEY = 'iron_sovereign_xp_ledger';
const IMPORT_LOG_KEY = 'iron_sovereign_import_log';

// Source → which stats it can award
const SOURCE_STATS = {
  liftosaur: ['STR', 'END'],
  cronometer: ['WIS'],
  renpho: ['CON'],
  fitbit: ['VIT', 'AGI', 'END'],
  manual: ['INT'],
};

// ── Ledger I/O ────────────────────────────────────────────────
export function loadLedger() {
  try {
    return JSON.parse(localStorage.getItem(LEDGER_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveLedger(ledger) {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch (err) {
    console.error('Ledger save failed:', err);
  }
}

// ── Finalize stale mutable days ───────────────────────────────
// Any day that was "mutable" (i.e. was today's date) but is now in the past
// gets locked as finalized on the next upload.
export function finalizeStaleDay(ledger) {
  const todayStr = today();
  let changed = false;
  for (const [dateStr, entry] of Object.entries(ledger)) {
    if (entry.state === 'mutable' && dateStr < todayStr) {
      entry.state = 'finalized';
      entry.finalized_at = new Date().toISOString();
      changed = true;
    }
  }
  return changed;
}

// ── Empty ledger entry ────────────────────────────────────────
function emptyEntry(state, date) {
  return {
    state,
    sources_processed: [],
    xp_awarded: { STR: 0, END: 0, WIS: 0, INT: 0, CON: 0, VIT: 0, AGI: 0 },
    total_xp: 0,
    last_processed: null,
    ...(state === 'finalized' ? { finalized_at: new Date().toISOString() } : {}),
  };
}

// ── Main import function ──────────────────────────────────────
// source: 'liftosaur' | 'cronometer' | 'renpho' | 'fitbit'
// rows: array of CSV row objects (already parsed from text)
// config: { calorieTarget, proteinTarget }
// Returns an importReceipt object
export function processImport(source, rows, config = {}) {
  const ledger = loadLedger();
  finalizeStaleDay(ledger);

  const todayStr = today();
  const parsers = {
    liftosaur: parseLiftosaur,
    cronometer: parseCronometer,
    renpho: parseRenpho,
    fitbit: parseFitbit,
  };

  const parser = parsers[source];
  if (!parser) throw new Error(`Unknown source: ${source}`);

  const dailyData = parser(rows); // Map<dateStr, metrics>
  const sourceStats = SOURCE_STATS[source] || [];

  let newDaysProcessed = 0;
  let daysSkippedFinalized = 0;
  let todayReprocessed = false;
  const xpAwarded = { STR: 0, END: 0, WIS: 0, INT: 0, CON: 0, VIT: 0, AGI: 0 };
  const dateRange = ['9999-99-99', '0000-00-00'];

  for (const [dateStr, metrics] of dailyData) {
    // Track date range
    if (dateStr < dateRange[0]) dateRange[0] = dateStr;
    if (dateStr > dateRange[1]) dateRange[1] = dateStr;

    // Skip future dates (timezone edge cases)
    if (dateStr > todayStr) continue;

    const existing = ledger[dateStr];
    const alreadyHasSource = existing?.sources_processed?.includes(source);
    const isFinalized = existing?.state === 'finalized';

    // FINALIZED + already has this source WITH actual XP → skip completely
    // If previous import yielded 0 XP (e.g. wrong file uploaded to wrong zone),
    // allow reimport so a correct file can overwrite the empty entry.
    const sourceHasXp = sourceStats.some(stat => (existing?.xp_awarded?.[stat] || 0) > 0);
    if (isFinalized && alreadyHasSource && sourceHasXp) {
      daysSkippedFinalized++;
      continue;
    }

    // Determine XP for this source's contribution to the day
    const dayMetrics = { [source]: metrics };
    const dayXP = calculateDayXP(dayMetrics, config);

    if (!existing) {
      // UNPROCESSED → process and finalize (if past) or mark mutable (if today)
      const state = dateStr === todayStr ? 'mutable' : 'finalized';
      const entry = emptyEntry(state, dateStr);
      // Apply only this source's stats
      for (const stat of sourceStats) {
        entry.xp_awarded[stat] = dayXP[stat] || 0;
        xpAwarded[stat] = (xpAwarded[stat] || 0) + (dayXP[stat] || 0);
      }
      entry.total_xp = Object.values(entry.xp_awarded).reduce((a, b) => a + b, 0);
      entry.sources_processed.push(source);
      entry.last_processed = new Date().toISOString();
      ledger[dateStr] = entry;
      newDaysProcessed++;
      if (dateStr === todayStr) todayReprocessed = true;

    } else if (!isFinalized) {
      // MUTABLE (today) → wipe this source's stats and recalculate
      if (dateStr === todayStr) todayReprocessed = true;
      for (const stat of sourceStats) {
        existing.xp_awarded[stat] = dayXP[stat] || 0;
        xpAwarded[stat] = (xpAwarded[stat] || 0) + (dayXP[stat] || 0);
      }
      existing.total_xp = Object.values(existing.xp_awarded).reduce((a, b) => a + b, 0);
      if (!existing.sources_processed.includes(source)) {
        existing.sources_processed.push(source);
      }
      existing.last_processed = new Date().toISOString();
      newDaysProcessed++;

    } else {
      // FINALIZED + does NOT have this source yet → LATE SOURCE: reopen for this source only
      for (const stat of sourceStats) {
        existing.xp_awarded[stat] = dayXP[stat] || 0;
        xpAwarded[stat] = (xpAwarded[stat] || 0) + (dayXP[stat] || 0);
      }
      existing.total_xp = Object.values(existing.xp_awarded).reduce((a, b) => a + b, 0);
      existing.sources_processed.push(source);
      existing.last_processed = new Date().toISOString();
      // Re-finalize immediately (it was already past, just adding a new source)
      existing.finalized_at = new Date().toISOString();
      newDaysProcessed++;
    }
  }

  saveLedger(ledger);

  // Build receipt
  const receipt = {
    source,
    timestamp: new Date().toISOString(),
    dateRange: dateRange[0] === '9999-99-99' ? [] : dateRange,
    totalRows: rows.length,
    newDaysProcessed,
    daysSkippedFinalized,
    todayReprocessed,
    xpAwarded,
    totalXP: Object.values(xpAwarded).reduce((a, b) => a + b, 0),
  };

  // Append to import log
  const importLog = JSON.parse(localStorage.getItem(IMPORT_LOG_KEY) || '[]');
  importLog.push(receipt);
  localStorage.setItem(IMPORT_LOG_KEY, JSON.stringify(importLog));

  return receipt;
}

// ── Manual daily log (INT, Bible, Book, Language) ─────────────
export function submitManualLog(intLog, config = {}) {
  const ledger = loadLedger();
  finalizeStaleDay(ledger);

  const todayStr = today();
  if (!ledger[todayStr]) {
    ledger[todayStr] = emptyEntry('mutable', todayStr);
  }

  const intXP = calculateDayXP({ intLog }, config).INT;
  ledger[todayStr].xp_awarded.INT = intXP;
  ledger[todayStr].total_xp = Object.values(ledger[todayStr].xp_awarded).reduce((a, b) => a + b, 0);
  ledger[todayStr].last_processed = new Date().toISOString();
  if (!ledger[todayStr].sources_processed.includes('manual')) {
    ledger[todayStr].sources_processed.push('manual');
  }

  saveLedger(ledger);
  return intXP;
}

// ── Derived state ─────────────────────────────────────────────

// Get cumulative XP totals per stat across all days
export function getCharacterXPTotals() {
  const ledger = loadLedger();
  const totals = { STR: 0, END: 0, WIS: 0, INT: 0, CON: 0, VIT: 0, AGI: 0 };
  for (const entry of Object.values(ledger)) {
    if (entry.xp_awarded) {
      for (const [stat, xp] of Object.entries(entry.xp_awarded)) {
        if (totals[stat] !== undefined) totals[stat] += xp;
      }
    }
  }
  return totals;
}

// Get XP history array for charting (last N days)
export function getXPHistory(days = 30) {
  const ledger = loadLedger();
  return Object.entries(ledger)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days)
    .map(([date, entry]) => ({
      date: date.slice(5),
      fullDate: date,
      STR: entry.xp_awarded?.STR || 0,
      END: entry.xp_awarded?.END || 0,
      WIS: entry.xp_awarded?.WIS || 0,
      INT: entry.xp_awarded?.INT || 0,
      CON: entry.xp_awarded?.CON || 0,
      VIT: entry.xp_awarded?.VIT || 0,
      AGI: entry.xp_awarded?.AGI || 0,
      total: Object.values(entry.xp_awarded || {}).reduce((a, b) => a + b, 0),
    }));
}

// Get import log
export function getImportLog(limit = 10) {
  try {
    const log = JSON.parse(localStorage.getItem(IMPORT_LOG_KEY) || '[]');
    return log.slice(-limit).reverse();
  } catch {
    return [];
  }
}

// Clear all ledger data (danger zone)
export function clearLedger() {
  localStorage.removeItem(LEDGER_KEY);
  localStorage.removeItem(IMPORT_LOG_KEY);
}
