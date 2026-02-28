/**
 * checkAchievements(achievements, stats) -> { updated: achievement[], newlyEarned: string[] }
 *
 * Checks all dynamic unlock conditions and returns:
 * - updated: the full achievements array with earned flags set
 * - newlyEarned: array of achievement names that just became earned this call
 *
 * stats: { totalSets, bodyFat, lbsLost, level, weight, streaks, questsDone }
 *   streaks: { workout, protein, sleep, steps, cals, weigh, trifecta }
 *
 * The function is pure — it never mutates the input array.
 * Achievement identity is keyed by the `name` field (INIT_ACHIEVEMENTS has no separate id).
 */

/**
 * @typedef {Object} Achievement
 * @property {string} name
 * @property {string} desc
 * @property {string} rarity
 * @property {boolean} earned
 * @property {string} [progress]
 */

/**
 * @typedef {Object} AchievementStats
 * @property {number} totalSets
 * @property {number} bodyFat
 * @property {number} lbsLost
 * @property {number} level
 * @property {number} weight
 * @property {{ workout: number, protein: number, sleep: number, steps: number, cals: number, weigh: number, trifecta: number }} streaks
 * @property {number} questsDone
 */

/**
 * Map of achievement name -> predicate function that receives stats and returns true when earned.
 * Add new entries here to extend unlock conditions without changing the checker logic.
 *
 * @type {Record<string, (stats: AchievementStats) => boolean>}
 */
const UNLOCK_CONDITIONS = {
  // Sets milestones
  "Ten Thousand": (stats) => stats.totalSets >= 10000,

  // Body fat milestones — use strict less-than to match the original useEffect
  "Sub-20 BF%": (stats) => stats.bodyFat < 20,
  "Sub-15 BF%": (stats) => stats.bodyFat < 15,

  // Weight loss milestone
  "Legacy Sword": (stats) => stats.lbsLost >= 170,

  // Level milestone — no matching entry exists in INIT_ACHIEVEMENTS yet, but the
  // condition is registered so it will fire automatically if one is added later.
  "Level 10 Sovereign": (stats) => stats.level >= 10,

  // Workout streak milestone — same forward-compat reasoning as above.
  "Iron Discipline": (stats) =>
    stats.streaks != null && stats.streaks.workout >= 7,
};

/**
 * Evaluates all dynamic unlock conditions against the provided stats.
 * Only achievements that are currently not earned are tested.
 *
 * @param {Achievement[]} achievements - The current achievements array (not mutated).
 * @param {AchievementStats} stats - Current player stats snapshot.
 * @returns {{ updated: Achievement[], newlyEarned: string[] }}
 */
export function checkAchievements(achievements, stats) {
  if (!Array.isArray(achievements)) {
    return { updated: [], newlyEarned: [] };
  }

  const newlyEarned = [];

  const updated = achievements.map((achievement) => {
    // Already earned — nothing to do.
    if (achievement.earned) return achievement;

    const condition = UNLOCK_CONDITIONS[achievement.name];

    // No registered condition for this achievement — leave it unchanged.
    if (typeof condition !== "function") return achievement;

    const shouldEarn = condition(stats);

    if (shouldEarn) {
      newlyEarned.push(achievement.name);
      return { ...achievement, earned: true };
    }

    return achievement;
  });

  return { updated, newlyEarned };
}
