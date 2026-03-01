/**
 * Muscle Group Mapping for Iron Sovereign
 * Based on common Liftosaur exercise names.
 * Categorizes exercises into primary muscle groups for volume tracking (Nippard model).
 */

export const MUSCLE_GROUPS = {
  CHEST: ["bench press", "incline bench", "chest press", "fly", "pushup", "dips"],
  BACK: ["pull up", "lat pulldown", "row", "deadlift", "face pull", "chin up"],
  SHOULDERS: ["overhead press", "lateral raise", "overhead press", "military press", "shoulder press"],
  QUADS: ["squat", "leg press", "leg extension", "lunge"],
  HAMSTRINGS: ["deadlift", "leg curl", "rdl", "stiff leg deadlift"],
  BICEPS: ["curl", "hammer curl"],
  TRICEPS: ["triceps extension", "pushdown", "skull crusher"],
  ABS: ["crunch", "plank", "leg raise"],
  CALVES: ["calf raise"],
};

export const STAT_MAPPING = {
  STR: ["CHEST", "BACK", "SHOULDERS"],
  END: ["QUADS", "HAMSTRINGS", "CALVES"],
  CON: ["ABS"],
};

/**
 * Detects the muscle group for a given exercise name.
 * @param {string} exerciseName
 * @returns {string|null}
 */
export function getMuscleGroup(exerciseName) {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase();
  
  for (const [group, keywords] of Object.entries(MUSCLE_GROUPS)) {
    if (keywords.some(k => name.includes(k))) return group;
  }
  
  return "OTHER";
}
