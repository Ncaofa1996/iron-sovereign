import { useState, useCallback } from 'react';

const LEDGER_KEY = 'iron_sovereign_xp_ledger';
const IMPORT_LOG_KEY = 'iron_sovereign_import_log';

// Hook for reading the XP ledger and derived stats
export function useXPLedger() {
  const [ledger, setLedger] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LEDGER_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const refresh = useCallback(() => {
    try {
      setLedger(JSON.parse(localStorage.getItem(LEDGER_KEY) || '{}'));
    } catch {
      setLedger({});
    }
  }, []);

  // Total XP per stat across all finalized + mutable days
  const xpTotals = Object.values(ledger).reduce((acc, entry) => {
    if (entry?.xp_awarded) {
      Object.entries(entry.xp_awarded).forEach(([stat, xp]) => {
        acc[stat] = (acc[stat] || 0) + xp;
      });
    }
    return acc;
  }, { STR: 0, END: 0, WIS: 0, INT: 0, CON: 0, VIT: 0, AGI: 0 });

  // XP history for charting — last 30 days sorted ascending
  const xpHistory = Object.entries(ledger)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, entry]) => ({
      date: date.slice(5), // MM-DD
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

  // Import audit log — most recent first
  const importLog = (() => {
    try {
      return JSON.parse(localStorage.getItem(IMPORT_LOG_KEY) || '[]').slice(-20).reverse();
    } catch {
      return [];
    }
  })();

  // Stats about the ledger
  const ledgerStats = {
    totalDays: Object.keys(ledger).length,
    finalizedDays: Object.values(ledger).filter(e => e.state === 'finalized').length,
    mutableDays: Object.values(ledger).filter(e => e.state === 'mutable').length,
    totalXP: Object.values(xpTotals).reduce((a, b) => a + b, 0),
  };

  return { ledger, xpTotals, xpHistory, importLog, ledgerStats, refresh };
}
