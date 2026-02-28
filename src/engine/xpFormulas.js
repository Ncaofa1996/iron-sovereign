// XP Formulas — convert raw daily metrics into stat XP values
// Each function returns a number (XP), capped to a reasonable maximum.

// ── STR — from Liftosaur ──────────────────────────────────────
// totalVolumeLbs: total weight * reps across all sets that day
// setCount: number of sets logged
export function calcSTR(liftosaurMetrics) {
  if (!liftosaurMetrics?.hasWorkout) return 0;
  const { totalVolumeLbs = 0, setCount = 0 } = liftosaurMetrics;
  let xp = 0;
  // Log-scale of volume: 10k lbs ≈ 40 XP, 30k lbs ≈ 67 XP, 80k lbs ≈ 95 XP
  if (totalVolumeLbs > 0) {
    xp += Math.round(Math.log10(Math.max(totalVolumeLbs, 1)) * 23);
  }
  // Set count tier bonus
  if (setCount >= 30) xp += 20;
  else if (setCount >= 20) xp += 12;
  else if (setCount >= 10) xp += 6;
  // Workout completion base
  xp += 15;
  return Math.min(150, Math.max(0, xp));
}

// ── END — from Liftosaur + Fitbit ────────────────────────────
export function calcEND(liftosaurMetrics, fitbitMetrics) {
  let xp = 0;
  // Active minutes from Fitbit
  const activeMinutes = fitbitMetrics?.activeMinutes || 0;
  xp += Math.min(60, Math.round(activeMinutes * 0.8));
  // Workout completion bonus (if also did strength — signals capacity)
  if (liftosaurMetrics?.hasWorkout) xp += 10;
  // Step count bonus (high steps = good endurance base)
  const steps = fitbitMetrics?.steps || 0;
  if (steps >= 15000) xp += 15;
  else if (steps >= 10000) xp += 8;
  return Math.min(120, Math.max(0, xp));
}

// ── WIS — from Cronometer ────────────────────────────────────
// Calorie and protein adherence
export function calcWIS(cronometerMetrics, calorieTarget = 2000, proteinTarget = 200) {
  if (!cronometerMetrics) return 0;
  const { calories = 0, protein = 0 } = cronometerMetrics;
  let xp = 0;

  // Calorie adherence: within 5% = full points, within 10% = partial
  const calDiff = Math.abs(calories - calorieTarget) / calorieTarget;
  if (calDiff <= 0.05) xp += 40;
  else if (calDiff <= 0.10) xp += 20;
  else if (calDiff <= 0.20) xp += 8;

  // Protein adherence
  if (protein >= proteinTarget) xp += 40;
  else if (protein >= proteinTarget * 0.9) xp += 25;
  else if (protein >= proteinTarget * 0.75) xp += 10;

  // Combo bonus — hit BOTH targets
  if (calDiff <= 0.05 && protein >= proteinTarget) xp += 20;

  return Math.min(120, Math.max(0, xp));
}

// ── INT — from manual daily log ───────────────────────────────
// intLog: { bible: bool, book: bool, lang: bool }
export function calcINT(intLog) {
  if (!intLog) return 0;
  const count = [intLog.bible, intLog.book, intLog.lang].filter(Boolean).length;
  const base = count * 15;
  const trifectaBonus = count === 3 ? 30 : 0;
  return Math.min(75, base + trifectaBonus);
}

// ── CON — from Renpho ────────────────────────────────────────
// Rewards consistent weigh-ins and body composition progress
export function calcCON(renphoMetrics, previousRenpho = null) {
  if (!renphoMetrics?.weightLbs) return 0;
  let xp = 15; // base for completing a weigh-in
  const { bodyFatPct, muscleMassLbs, visceralFat } = renphoMetrics;

  // Healthy body fat range bonus
  if (bodyFatPct !== null) {
    if (bodyFatPct < 15) xp += 30;
    else if (bodyFatPct < 20) xp += 20;
    else if (bodyFatPct < 25) xp += 10;
  }

  // Week-over-week improvement bonus (if previous available)
  if (previousRenpho?.bodyFatPct && bodyFatPct < previousRenpho.bodyFatPct) {
    xp += 15; // dropping body fat
  }
  if (previousRenpho?.muscleMassLbs && muscleMassLbs > previousRenpho.muscleMassLbs) {
    xp += 10; // gaining muscle
  }

  // Low visceral fat bonus
  if (visceralFat !== null && visceralFat <= 10) xp += 10;

  return Math.min(80, Math.max(0, xp));
}

// ── VIT — from Fitbit (sleep + HRV + RHR) ───────────────────
export function calcVIT(fitbitMetrics) {
  if (!fitbitMetrics) return 0;
  let xp = 0;
  const { sleepHours = 0 } = fitbitMetrics;

  // Sleep scoring
  if (sleepHours >= 8) xp += 60;
  else if (sleepHours >= 7.5) xp += 50;
  else if (sleepHours >= 7) xp += 35;
  else if (sleepHours >= 6) xp += 20;
  // below 6 = 0 sleep XP

  return Math.min(80, Math.max(0, xp));
}

// ── AGI — from Fitbit steps ───────────────────────────────────
export function calcAGI(fitbitMetrics, stepTarget = 10000) {
  const steps = fitbitMetrics?.steps || 0;
  let xp = Math.round(steps / 200); // 10k steps = 50 XP
  if (steps >= stepTarget) xp += 20; // target bonus
  if (steps >= stepTarget * 1.5) xp += 10; // overachiever
  return Math.min(100, Math.max(0, xp));
}

// ── Master: all stats for one day ────────────────────────────
// dayMetrics: { liftosaur, cronometer, renpho, fitbit, intLog, previousRenpho }
export function calculateDayXP(dayMetrics, config = {}) {
  const calorieTarget = config.calorieTarget || 2000;
  const proteinTarget = config.proteinTarget || 200;
  return {
    STR: calcSTR(dayMetrics.liftosaur),
    END: calcEND(dayMetrics.liftosaur, dayMetrics.fitbit),
    WIS: calcWIS(dayMetrics.cronometer, calorieTarget, proteinTarget),
    INT: calcINT(dayMetrics.intLog),
    CON: calcCON(dayMetrics.renpho, dayMetrics.previousRenpho),
    VIT: calcVIT(dayMetrics.fitbit),
    AGI: calcAGI(dayMetrics.fitbit),
  };
}
