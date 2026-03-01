/**
 * Metabolic Health Intelligence (Hyman Model)
 * 
 * Provides logic for estimating insulin sensitivity, metabolic flexibility,
 * and gut health buffs based on cross-referenced fitness and nutrition data.
 */

/**
 * Estimates Insulin Sensitivity Score (0-100)
 * Logic:
 * - Negative: High Body Fat, High Visceral Fat, Low Step Count
 * - Positive: Low Body Fat, Low Visceral Fat, High Step Count, High Muscle Mass
 * 
 * @param {Object} metrics { bodyFatPct, visceralFat, steps, muscleMassLbs, weightLbs }
 * @returns {number} Score from 0 to 100
 */
export function estimateInsulinSensitivity(metrics) {
  const { bodyFatPct = 25, visceralFat = 10, steps = 5000, muscleMassLbs = 150, weightLbs = 200 } = metrics;
  
  let score = 50; // Neutral baseline

  // 1. Body Composition Impact (±25 points)
  if (bodyFatPct < 15) score += 15;
  else if (bodyFatPct < 20) score += 8;
  else if (bodyFatPct > 30) score -= 10;
  else if (bodyFatPct > 35) score -= 20;

  // 2. Visceral Fat Impact (The "Hyman" Root Cause) (±15 points)
  if (visceralFat <= 5) score += 15;
  else if (visceralFat <= 9) score += 10;
  else if (visceralFat >= 13) score -= 10;
  else if (visceralFat >= 15) score -= 15;

  // 3. Movement / GLUT4 Translocation (±10 points)
  if (steps >= 12000) score += 10;
  else if (steps >= 10000) score += 5;
  else if (steps < 4000) score -= 10;

  // 4. Muscle Mass / Glucose Sink (±10 points)
  const muscleRatio = muscleMassLbs / weightLbs;
  if (muscleRatio > 0.80) score += 10;
  else if (muscleRatio > 0.75) score += 5;
  else if (muscleRatio < 0.65) score -= 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculates Gut Health "Buff" based on fiber intake.
 * @param {number} fiberGrams 
 * @returns {Object} { label, power, color }
 */
export function getGutHealthBuff(fiberGrams) {
  if (fiberGrams >= 40) return { label: "Symbiotic Titan", power: 1.2, color: "#22c55e", desc: "Optimal microbiome diversity." };
  if (fiberGrams >= 30) return { label: "Microbiome Guardian", power: 1.1, color: "#4ade80", desc: "High fiber intake achieved." };
  if (fiberGrams >= 25) return { label: "Fiber Initiate", power: 1.05, color: "#86efac", desc: "Meeting minimum fiber requirements." };
  return { label: "Dysbiosis Risk", power: 1.0, color: "#94a3b8", desc: "Low fiber intake." };
}

/**
 * Interprets the Insulin Sensitivity score into RPG-style descriptors.
 */
export function getMetabolicDescriptor(score) {
  if (score >= 90) return { label: "Metabolic Sovereign", desc: "Peak metabolic flexibility.", status: "OPTIMAL" };
  if (score >= 75) return { label: "Insulin Sensitive", desc: "Efficient glucose clearing.", status: "GOOD" };
  if (score >= 50) return { label: "Metabolic Neutral", desc: "Standard metabolic function.", status: "NORMAL" };
  if (score >= 30) return { label: "Insulin Resistant", desc: "Elevated metabolic stress.", status: "WARNING" };
  return { label: "Metabolic Crisis", desc: "High risk of metabolic syndrome.", status: "CRITICAL" };
}
