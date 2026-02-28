// CSV Parsers — one per data source
// All parsers return Map<"YYYY-MM-DD", metrics>

const TIMEZONE = "America/Chicago";

export function toLocalDate(utcStr) {
  const d = new Date(utcStr);
  if (isNaN(d)) return null;
  return d.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

// ── Liftosaur ────────────────────────────────────────────────
// Columns: Date, Exercise Name, Reps, Weight, Sets Completed, Notes
// One row per set — aggregate by day
export function parseLiftosaur(rows) {
  const map = new Map();
  for (const row of rows) {
    const rawDate = row["Date"] || row["date"] || "";
    const dateStr = toLocalDate(rawDate) || rawDate.slice(0, 10);
    if (!dateStr) continue;

    const reps = parseFloat(row["Reps"] || row["reps"] || 0) || 0;
    const weight = parseFloat(row["Weight"] || row["weight"] || row["Weight (lbs)"] || 0) || 0;
    const volume = reps * weight;

    if (!map.has(dateStr)) {
      map.set(dateStr, { totalVolumeLbs: 0, setCount: 0, exerciseSet: new Set(), hasWorkout: false });
    }
    const day = map.get(dateStr);
    day.totalVolumeLbs += volume;
    day.setCount += 1;
    day.hasWorkout = true;
    const exercise = row["Exercise Name"] || row["Exercise"] || row["exercise"] || "";
    if (exercise) day.exerciseSet.add(exercise);
  }
  // Convert Set to count
  for (const [, day] of map) {
    day.exerciseCount = day.exerciseSet.size;
    delete day.exerciseSet;
  }
  return map;
}

// ── Cronometer ───────────────────────────────────────────────
// Columns: Date, Energy (kcal), Protein (g), Fat (g), Carbohydrates (g), Fiber (g)
export function parseCronometer(rows) {
  const map = new Map();
  for (const row of rows) {
    const rawDate = row["Date"] || row["date"] || "";
    const dateStr = rawDate.slice(0, 10);
    if (!dateStr) continue;

    const calories = parseFloat(row["Energy (kcal)"] || row["Calories"] || row["calories"] || 0) || 0;
    const protein = parseFloat(row["Protein (g)"] || row["Protein"] || row["protein"] || 0) || 0;
    const fat = parseFloat(row["Fat (g)"] || row["Fat"] || 0) || 0;
    const carbs = parseFloat(row["Carbohydrates (g)"] || row["Carbs"] || 0) || 0;
    const fiber = parseFloat(row["Fiber (g)"] || row["Fiber"] || 0) || 0;

    if (!map.has(dateStr)) {
      map.set(dateStr, { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, dayCount: 0 });
    }
    const day = map.get(dateStr);
    // Cronometer exports one row per day summary — but guard against multi-row days
    day.calories += calories;
    day.protein += protein;
    day.fat += fat;
    day.carbs += carbs;
    day.fiber += fiber;
    day.dayCount += 1;
  }
  return map;
}

// ── Renpho ───────────────────────────────────────────────────
// Columns: Time, Weight(lb), BMI, Body Fat(%), Muscle Mass(lb), etc.
// One row per weigh-in — use the last reading of the day
export function parseRenpho(rows) {
  const map = new Map();
  for (const row of rows) {
    const rawDate = row["Time"] || row["Date"] || row["date"] || "";
    const dateStr = toLocalDate(rawDate) || rawDate.slice(0, 10);
    if (!dateStr) continue;

    const weightLbs =
      parseFloat(row["Weight(lb)"] || row["Weight (lb)"] || row["Weight"] || 0) || null;
    const bodyFatPct =
      parseFloat(row["Body Fat(%)"] || row["Body Fat (%)"] || row["Body Fat"] || 0) || null;
    const muscleMassLbs =
      parseFloat(row["Muscle Mass(lb)"] || row["Lean Mass(lb)"] || row["Muscle Mass"] || 0) || null;
    const visceralFat =
      parseFloat(row["Visceral Fat"] || row["Visceral Fat Level"] || 0) || null;

    // Last weigh-in of day wins (rows assumed chronological)
    map.set(dateStr, { weightLbs, bodyFatPct, muscleMassLbs, visceralFat });
  }
  return map;
}

// ── Apple Health (internal helper) ───────────────────────────
// Apple Health CSV export format:
//   Date column: M/D/YY (e.g. "1/28/26")
//   Column names contain units in parens: "Steps" (steps), "Sleep", "Exercise Minutes"
//   Numbers use comma separators: "10,940"
//   Sleep is text: "6h 54m"
//   One summary row per day + additional workout-only rows (mostly empty)
function parseAppleHealthAsFitbit(rows, headers) {
  const map = new Map();

  // Find columns by partial name match (case-insensitive) — handles PapaParse quote-stripping variants
  const findCol = (partial) =>
    headers.find(h => h.toLowerCase().includes(partial.toLowerCase()));

  const colSteps    = findCol('steps');
  const colSleep    = findCol('sleep');
  const colExercise = findCol('exercise minute');

  const cleanNum = (val) =>
    parseFloat((val || '').toString().replace(/,/g, '').trim()) || 0;

  const parseSleep = (val) => {
    if (!val) return 0;
    const match = val.toString().match(/(?:(\d+)h\s*)?(?:(\d+)m)?/);
    if (!match || (!match[1] && !match[2])) return 0;
    return (parseInt(match[1] || 0)) + (parseInt(match[2] || 0) / 60);
  };

  // Parse M/D/YY → YYYY-MM-DD
  const parseAppleDate = (raw) => {
    const parts = (raw || '').toString().trim().split('/');
    if (parts.length !== 3) return null;
    const [m, d, y] = parts;
    const year = parseInt(y) < 100 ? 2000 + parseInt(y) : parseInt(y);
    const mi = parseInt(m), di = parseInt(d);
    if (isNaN(year) || isNaN(mi) || isNaN(di)) return null;
    return `${year}-${String(mi).padStart(2,'0')}-${String(di).padStart(2,'0')}`;
  };

  for (const row of rows) {
    const dateStr = parseAppleDate(row['Date'] || row['date']);
    if (!dateStr) continue;

    const steps          = colSteps    ? cleanNum(row[colSteps])    : 0;
    const exerciseMinutes = colExercise ? cleanNum(row[colExercise]) : 0;
    const sleepHours     = colSleep    ? parseSleep(row[colSleep])  : 0;

    if (!map.has(dateStr)) {
      map.set(dateStr, { steps: 0, activeMinutes: 0, caloriesBurned: 0, sleepMinutes: 0, sleepHours: 0 });
    }
    const day = map.get(dateStr);
    // Use max — summary row has the real totals; workout-only rows have 0s
    if (steps > 0)          day.steps         = Math.max(day.steps, steps);
    if (exerciseMinutes > 0) day.activeMinutes = Math.max(day.activeMinutes, exerciseMinutes);
    if (sleepHours > 0) {
      day.sleepHours  = Math.max(day.sleepHours, sleepHours);
      day.sleepMinutes = day.sleepHours * 60;
    }
  }
  return map;
}

// ── Fitbit / Apple Health ─────────────────────────────────────
// Auto-detects format from column names and delegates accordingly.
// Fitbit columns: Activities Date, Steps, Minutes Very Active, Minutes Fairly Active
// Apple Health columns: Date (M/D/YY), "Steps" (steps), "Exercise Minutes", "Sleep"
export function parseFitbit(rows) {
  const map = new Map();
  if (!rows.length) return map;

  const headers = Object.keys(rows[0]);
  // Detect Apple Health by presence of "Active Calories" or "Exercise Minutes" columns
  const isAppleHealth = headers.some(h =>
    h.toLowerCase().includes('active calorie') ||
    h.toLowerCase().includes('exercise minute')
  );
  if (isAppleHealth) return parseAppleHealthAsFitbit(rows, headers);

  // Standard Fitbit daily activity summary
  for (const row of rows) {
    const rawDate =
      row["Activities Date"] || row["Date"] || row["date"] || row["Start Time"] || "";
    const dateStr = toLocalDate(rawDate) || rawDate.slice(0, 10);
    if (!dateStr) continue;

    const steps = parseFloat(row["Steps"] || row["steps"] || 0) || 0;
    const veryActive = parseFloat(row["Minutes Very Active"] || 0) || 0;
    const fairlyActive = parseFloat(row["Minutes Fairly Active"] || 0) || 0;
    const activeMinutes = veryActive + fairlyActive;
    const caloriesBurned = parseFloat(row["Calories Burned"] || row["Calories"] || 0) || 0;

    // Sleep — may be a separate export merged in
    const sleepMinutes =
      parseFloat(row["Minutes Asleep"] || row["Sleep Duration (min)"] || 0) || 0;
    const sleepHours = sleepMinutes > 0 ? sleepMinutes / 60 : null;

    if (!map.has(dateStr)) {
      map.set(dateStr, { steps: 0, activeMinutes: 0, caloriesBurned: 0, sleepMinutes: 0, sleepHours: null });
    }
    const day = map.get(dateStr);
    day.steps += steps;
    day.activeMinutes += activeMinutes;
    day.caloriesBurned += caloriesBurned;
    if (sleepMinutes > 0) {
      day.sleepMinutes += sleepMinutes;
      day.sleepHours = day.sleepMinutes / 60;
    }
  }
  return map;
}
