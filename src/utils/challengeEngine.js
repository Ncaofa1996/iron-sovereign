// challengeEngine.js — Deterministic daily challenge generator for Iron Sovereign

const CHALLENGE_POOL = [
  // STR
  { id: "ch_str1", name: "Iron Rep Count",   desc: "Log 100+ total reps today",                  xp: 30, stat: "STR", icon: "🏋️" },
  { id: "ch_str2", name: "Heaviest Set",      desc: "Log your max weight lift today",              xp: 35, stat: "STR", icon: "⚔️" },
  { id: "ch_str3", name: "5-Set Finisher",    desc: "Complete 5 working sets in one session",     xp: 25, stat: "STR", icon: "🔥" },
  { id: "ch_str4", name: "Press the Ceiling", desc: "Hit a new 1RM on any pressing movement",     xp: 50, stat: "STR", icon: "💪" },

  // END
  { id: "ch_end1", name: "Step Sovereign",    desc: "Hit 12,000 steps today",                     xp: 30, stat: "END", icon: "🚶" },
  { id: "ch_end2", name: "Cardio Surge",      desc: "Log any cardio session today",               xp: 20, stat: "END", icon: "⚡" },
  { id: "ch_end3", name: "Endurance Trial",   desc: "Log 45+ min of movement today",              xp: 35, stat: "END", icon: "🏃" },
  { id: "ch_end4", name: "Double Session",    desc: "AM and PM activity logged today",            xp: 45, stat: "END", icon: "🌅" },

  // WIS
  { id: "ch_wis1", name: "Protein Precision", desc: "Hit exactly 200g protein ±5g",              xp: 30, stat: "WIS", icon: "🥩" },
  { id: "ch_wis2", name: "Calorie Lock",       desc: "Hit calorie target within 2%",              xp: 35, stat: "WIS", icon: "🎯" },
  { id: "ch_wis3", name: "Macro Mastery",      desc: "Hit both protein AND calorie goals",        xp: 45, stat: "WIS", icon: "📊" },
  { id: "ch_wis4", name: "Clean Plate",        desc: "Log all meals under 2500 kcal",             xp: 25, stat: "WIS", icon: "🍽️" },

  // INT
  { id: "ch_int1", name: "Scripture Study",   desc: "Complete Bible reading today",               xp: 20, stat: "INT", icon: "📖" },
  { id: "ch_int2", name: "Scholar's Hour",    desc: "Read for 30+ min from your book",            xp: 25, stat: "INT", icon: "📚" },
  { id: "ch_int3", name: "Language Drill",    desc: "Complete language study session",            xp: 20, stat: "INT", icon: "🌐" },
  { id: "ch_int4", name: "INT Trifecta",      desc: "Bible + Book + Language all in one day",    xp: 50, stat: "INT", icon: "🧠" },

  // CON
  { id: "ch_con1", name: "Streak Defender",   desc: "Log daily data without missing today",      xp: 15, stat: "CON", icon: "🛡️" },
  { id: "ch_con2", name: "Iron Consistency",  desc: "Complete workout AND log nutrition",         xp: 40, stat: "CON", icon: "⚜️" },
  { id: "ch_con3", name: "Hydration Protocol",desc: "Hit water intake goal today",               xp: 20, stat: "CON", icon: "💧" },
  { id: "ch_con4", name: "No Excuses",        desc: "Submit daily log before 10 PM",             xp: 25, stat: "CON", icon: "📋" },

  // VIT
  { id: "ch_vit1", name: "Recovery Night",    desc: "Log 8h+ sleep tonight",                     xp: 30, stat: "VIT", icon: "😴" },
  { id: "ch_vit2", name: "Weight Check-In",   desc: "Log your weight today",                     xp: 15, stat: "VIT", icon: "⚖️" },
  { id: "ch_vit3", name: "Mobility Session",  desc: "Log stretching or mobility work",           xp: 20, stat: "VIT", icon: "🧘" },
  { id: "ch_vit4", name: "7.5h Guardian",     desc: "Hit 7.5h+ sleep AND log it",                xp: 35, stat: "VIT", icon: "🌙" },
];

const WEEKLY_BONUS_POOL = [
  { id: "wb1", name: "Week of Iron",    desc: "Log 5 workouts this week",         xp: 100, stat: "STR", icon: "⚔️" },
  { id: "wb2", name: "Protein Emperor", desc: "200g+ protein 6 of 7 days",        xp: 90,  stat: "WIS", icon: "🥩" },
  { id: "wb3", name: "Step Legend",     desc: "70,000+ steps this week",          xp: 100, stat: "END", icon: "🚶" },
  { id: "wb4", name: "Sleep Guardian",  desc: "7.5h+ sleep 5 nights this week",   xp: 80,  stat: "VIT", icon: "😴" },
  { id: "wb5", name: "Trifecta Week",   desc: "INT Trifecta 5 days this week",    xp: 90,  stat: "INT", icon: "🧠" },
  { id: "wb6", name: "Perfect Log",     desc: "Submit daily log all 7 days",      xp: 120, stat: "CON", icon: "📋" },
];

const STORAGE_KEY = "iron_sovereign_daily_challenge";

/**
 * Deterministic hash of a date string.
 * Sums all charCodeAt values and returns a non-negative integer.
 * @param {string} dateStr - e.g. "2026-02-28"
 * @returns {number}
 */
function hashDate(dateStr) {
  let sum = 0;
  for (let i = 0; i < dateStr.length; i++) {
    sum += dateStr.charCodeAt(i);
  }
  return sum;
}

/**
 * Returns the deterministic daily challenge for a given date.
 * @param {string} [dateStr] - YYYY-MM-DD, defaults to today
 * @returns {{ id:string, name:string, desc:string, xp:number, stat:string, icon:string, date:string, type:string, expiresAt:string }}
 */
export function getDailyChallenge(dateStr = new Date().toISOString().slice(0, 10)) {
  const index = hashDate(dateStr) % CHALLENGE_POOL.length;
  return {
    ...CHALLENGE_POOL[index],
    date: dateStr,
    type: "daily",
    expiresAt: new Date(dateStr + "T23:59:59").toISOString(),
  };
}

/**
 * Returns the deterministic weekly bonus challenge for a given week.
 * @param {string} weekStartStr - YYYY-MM-DD of the Monday that starts the week
 * @returns {{ id:string, name:string, desc:string, xp:number, stat:string, icon:string, weekStart:string, type:string }}
 */
export function getWeeklyBonus(weekStartStr) {
  const index = hashDate(weekStartStr) % WEEKLY_BONUS_POOL.length;
  return {
    ...WEEKLY_BONUS_POOL[index],
    weekStart: weekStartStr,
    type: "weekly_bonus",
  };
}

/**
 * Returns true if today's challenge has already been claimed.
 * Reads from localStorage key "iron_sovereign_daily_challenge".
 * @returns {boolean}
 */
export function isChallengeClaimedToday() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { claimedDates } = JSON.parse(raw);
    return Array.isArray(claimedDates) && claimedDates.includes(today);
  } catch (_) {
    return false;
  }
}

/**
 * Marks a challenge date as claimed and persists to localStorage.
 * @param {string} dateStr - YYYY-MM-DD date to claim
 * @returns {{ claimedDates: string[] }} updated claimed state
 */
export function claimChallenge(dateStr) {
  let claimedDates = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.claimedDates)) {
        claimedDates = parsed.claimedDates;
      }
    }
  } catch (_) {
    // start fresh on parse error
  }

  if (!claimedDates.includes(dateStr)) {
    claimedDates = [...claimedDates, dateStr];
  }

  const updated = { claimedDates };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {
    // localStorage unavailable — return in-memory state
  }

  return updated;
}

export { CHALLENGE_POOL };
