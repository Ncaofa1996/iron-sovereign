import { useState, useEffect } from "react";

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};

const QUICK_REF = [
  { food: "Chicken breast", serving: "4oz", protein: 36, calories: 186 },
  { food: "Greek yogurt", serving: "1 cup", protein: 17, calories: 100 },
  { food: "Eggs", serving: "2 large", protein: 12, calories: 148 },
  { food: "Whey protein", serving: "1 scoop", protein: 25, calories: 120 },
  { food: "Ground beef 93%", serving: "4oz", protein: 28, calories: 200 },
];

const inputStyle = {
  background: "#0a0e1a",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#e5e7eb",
  padding: "6px 10px",
  fontFamily: "'Courier New', monospace",
  fontSize: 12,
};

const sectionStyle = {
  background: "#1a1f2e",
  borderRadius: 10,
  padding: "16px",
  marginBottom: 16,
};

const labelStyle = {
  color: "#9ca3af",
  fontSize: 11,
  fontFamily: "'Courier New', monospace",
  marginBottom: 4,
  display: "block",
};

const sectionTitleStyle = {
  color: "#e2b714",
  fontFamily: "'Courier New', monospace",
  fontSize: 12,
  fontWeight: "bold",
  letterSpacing: "0.08em",
  marginBottom: 12,
  textTransform: "uppercase",
};

export default function MacroCalc({ open, onClose, settings, cronData }) {
  const [weight, setWeight] = useState(settings?.startWeight || 220);
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(10);
  const [age, setAge] = useState(30);
  const [activity, setActivity] = useState("moderate");
  const [proteinPct, setProteinPct] = useState(35);
  const [carbPct, setCarbPct] = useState(40);
  const [fatPct, setFatPct] = useState(25);
  const [calTarget, setCalTarget] = useState(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const weightKg = weight / 2.205;
  const heightCm = (feet * 12 + parseFloat(inches || 0)) * 2.54;
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
  const effectiveCals = calTarget !== null ? calTarget : tdee;

  const proteinG = Math.round((effectiveCals * proteinPct / 100) / 4);
  const carbG = Math.round((effectiveCals * carbPct / 100) / 4);
  const fatG = Math.round((effectiveCals * fatPct / 100) / 9);

  const handleProteinChange = (val) => {
    const p = Math.min(70, Math.max(10, Number(val)));
    const remaining = 100 - p;
    const c = Math.min(70, Math.max(10, carbPct));
    const f = Math.max(10, remaining - c);
    const cAdjusted = Math.max(10, remaining - f);
    setProteinPct(p);
    setCarbPct(cAdjusted);
    setFatPct(f);
  };

  const handleCarbChange = (val) => {
    const c = Math.min(70, Math.max(10, Number(val)));
    const f = Math.max(10, 100 - proteinPct - c);
    setCarbPct(c);
    setFatPct(f);
  };

  const handleFatChange = (val) => {
    const f = Math.min(70, Math.max(10, Number(val)));
    const newFat = f;
    const remaining = 100 - proteinPct - newFat;
    setCarbPct(Math.max(10, remaining));
    setFatPct(newFat);
  };

  const cronAvgCals = (() => {
    if (!cronData) return null;
    const rows = Array.isArray(cronData) ? cronData : [];
    const cals = rows.map((r) => parseFloat(r.calories || r.Calories || 0)).filter(Boolean);
    if (!cals.length) return null;
    return Math.round(cals.reduce((a, b) => a + b, 0) / cals.length);
  })();

  const fmt = (n) => n.toLocaleString();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          background: "#0b0f1a",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.1)",
          maxHeight: "90vh",
          overflowY: "auto",
          fontFamily: "'Courier New', monospace",
          animation: "fadeScale 0.2s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ color: "#e5e7eb", fontSize: 16, fontWeight: "bold" }}>Macro Calculator</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer", padding: "0 4px", fontFamily: "'Courier New', monospace" }}
          >
            x
          </button>
        </div>

        {/* Section 1: TDEE */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>TDEE Calculator</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Weight (lbs)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Height</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" value={feet} onChange={(e) => setFeet(Number(e.target.value))} style={{ ...inputStyle, width: 60 }} />
              <span style={{ color: "#9ca3af", fontSize: 11 }}>ft</span>
              <input type="number" value={inches} onChange={(e) => setInches(Number(e.target.value))} style={{ ...inputStyle, width: 60 }} />
              <span style={{ color: "#9ca3af", fontSize: 11 }}>in</span>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Activity Level</label>
            <select value={activity} onChange={(e) => setActivity(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="sedentary">Sedentary (desk job, no exercise)</option>
              <option value="light">Light (1-3 days/week)</option>
              <option value="moderate">Moderate (3-5 days/week)</option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="very">Very Active (physical job + exercise)</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: "#0a0e1a", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(226,183,20,0.3)", textAlign: "center" }}>
              <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 4 }}>BMR</div>
              <div style={{ color: "#e2b714", fontSize: 18, fontWeight: "bold" }}>{fmt(bmr)}</div>
              <div style={{ color: "#6b7280", fontSize: 10 }}>kcal</div>
            </div>
            <div style={{ flex: 1, background: "#0a0e1a", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(226,183,20,0.3)", textAlign: "center" }}>
              <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 4 }}>TDEE</div>
              <div style={{ color: "#e2b714", fontSize: 18, fontWeight: "bold" }}>{fmt(tdee)}</div>
              <div style={{ color: "#6b7280", fontSize: 10 }}>kcal</div>
            </div>
          </div>
        </div>

        {/* Section 2: Target Macros */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Target Macros</div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Calorie Target</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                value={calTarget !== null ? calTarget : tdee}
                onChange={(e) => setCalTarget(Number(e.target.value))}
                style={{ ...inputStyle, width: 120 }}
              />
              <button onClick={() => setCalTarget(tdee)} style={{ ...inputStyle, cursor: "pointer", padding: "6px 10px", color: "#e2b714", borderColor: "rgba(226,183,20,0.4)" }}>
                Use TDEE
              </button>
              {cronAvgCals && (
                <button onClick={() => setCalTarget(cronAvgCals)} style={{ ...inputStyle, cursor: "pointer", padding: "6px 10px", color: "#60a5fa", borderColor: "rgba(96,165,250,0.4)" }}>
                  Cron avg ({cronAvgCals})
                </button>
              )}
            </div>
          </div>

          {[
            { label: "Protein", pct: proteinPct, g: proteinG, color: "#f87171", onChange: handleProteinChange },
            { label: "Carbs", pct: carbPct, g: carbG, color: "#60a5fa", onChange: handleCarbChange },
            { label: "Fat", pct: fatPct, g: fatG, color: "#fbbf24", onChange: handleFatChange },
          ].map(({ label, pct, g, color, onChange }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color, fontSize: 11, fontFamily: "'Courier New', monospace" }}>{label} {pct}%</span>
                <span style={{ color: "#9ca3af", fontSize: 11, fontFamily: "'Courier New', monospace" }}>{g}g/day</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                value={pct}
                onChange={(e) => onChange(e.target.value)}
                style={{ width: "100%", accentColor: color }}
              />
            </div>
          ))}

          <div style={{ background: "#0a0e1a", borderRadius: 8, padding: "10px 14px", border: "1px solid #374151", textAlign: "center", fontSize: 13, letterSpacing: "0.05em" }}>
            <span style={{ color: "#f87171" }}>P: {proteinG}g</span>
            <span style={{ color: "#6b7280", margin: "0 8px" }}>|</span>
            <span style={{ color: "#60a5fa" }}>C: {carbG}g</span>
            <span style={{ color: "#6b7280", margin: "0 8px" }}>|</span>
            <span style={{ color: "#fbbf24" }}>F: {fatG}g</span>
            <span style={{ color: "#6b7280", margin: "0 8px" }}>|</span>
            <span style={{ color: "#e5e7eb" }}>{fmt(effectiveCals)} kcal</span>
          </div>
        </div>

        {/* Section 3: Quick Reference */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Quick Reference</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'Courier New', monospace" }}>
            <thead>
              <tr>
                {["Food", "Serving", "Protein", "Calories"].map((h) => (
                  <th key={h} style={{ color: "#e2b714", textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #374151", fontWeight: "normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QUICK_REF.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={{ color: "#e5e7eb", padding: "5px 8px" }}>{row.food}</td>
                  <td style={{ color: "#9ca3af", padding: "5px 8px" }}>{row.serving}</td>
                  <td style={{ color: "#f87171", padding: "5px 8px" }}>{row.protein}g</td>
                  <td style={{ color: "#6b7280", padding: "5px 8px" }}>{row.calories}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
