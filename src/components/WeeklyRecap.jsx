// Weekly Boss Recap — shown once after the weekly reset (Monday first load).
// Props: weekData, hunterRank, onClose
// weekData: { totalXP, daysActive, questsDone, weightChange, topStat, topStatXP }

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function shouldShowRecap() {
  try {
    const saved = JSON.parse(localStorage.getItem("iron_sovereign_weekly_recap") || "{}");
    const thisWeek = getWeekStart();
    return saved.weekStart !== thisWeek || !saved.shown;
  } catch {
    return true;
  }
}

export function markRecapShown() {
  localStorage.setItem("iron_sovereign_weekly_recap", JSON.stringify({
    weekStart: getWeekStart(),
    shown: true,
  }));
}

const RANK_COLORS = {
  S: "#e2b714", A: "#f97316", B: "#a855f7",
  C: "#06b6d4", D: "#22c55e", E: "#6b7280",
};

const STAT_COLORS = {
  STR: "#ef4444", END: "#22c55e", WIS: "#a855f7",
  INT: "#06b6d4", CON: "#f59e0b", VIT: "#ec4899",
};

export default function WeeklyRecap({ weekData, hunterRank, onClose }) {
  const { totalXP = 0, daysActive = 0, questsDone = 0, weightChange = 0, topStat = "STR", topStatXP = 0 } = weekData || {};
  const rankColor = RANK_COLORS[hunterRank?.rank] || "#6b7280";
  const topStatColor = STAT_COLORS[topStat] || "#e2b714";
  const defeated = totalXP > 200;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9000, padding: 20,
    }}>
      <div style={{
        background: "#0f1320", border: "1px solid rgba(226,183,20,0.2)",
        borderRadius: 24, padding: 32, maxWidth: 420, width: "100%",
        boxShadow: "0 0 60px rgba(226,183,20,0.15)",
        fontFamily: "'Courier New', monospace",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{defeated ? "⚔️" : "🛡️"}</div>
          <div style={{
            fontSize: 24, fontWeight: 900, letterSpacing: -1,
            color: defeated ? "#e2b714" : "#6b7280",
            textShadow: defeated ? "0 0 20px rgba(226,183,20,0.4)" : "none",
          }}>
            WEEK {defeated ? "CONQUERED" : "SURVIVED"}
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4, textTransform: "uppercase", letterSpacing: 3 }}>
            Weekly Battle Report
          </div>
        </div>

        {/* XP banner */}
        <div style={{
          background: "rgba(226,183,20,0.08)", border: "1px solid rgba(226,183,20,0.2)",
          borderRadius: 14, padding: "16px 20px", textAlign: "center", marginBottom: 16,
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#e2b714", lineHeight: 1 }}>{totalXP}</div>
          <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 3, marginTop: 4 }}>Total XP Earned</div>
          {topStat && topStatXP > 0 && (
            <div style={{ fontSize: 9, color: topStatColor, marginTop: 6, fontWeight: 700 }}>
              🏆 Best stat: {topStat} +{topStatXP} XP
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Days Active", value: `${daysActive}/7`, icon: "📅", color: "#22c55e" },
            { label: "Quests Done", value: questsDone,        icon: "⚔️", color: "#f59e0b" },
            { label: "Weight Δ",    value: weightChange !== 0 ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} lbs` : "—", icon: "⚖️", color: weightChange < 0 ? "#22c55e" : weightChange > 0 ? "#ef4444" : "#6b7280" },
          ].map(s => (
            <div key={s.label} style={{
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "12px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: "#6b7280", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Hunter rank */}
        {hunterRank && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: `${rankColor}10`, border: `1px solid ${rankColor}30`,
            borderRadius: 12, padding: "10px 14px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 24 }}>{hunterRank.icon}</span>
            <div>
              <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: 2 }}>Current Rank</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: rankColor }}>{hunterRank.rank}-Rank — {hunterRank.label}</div>
            </div>
          </div>
        )}

        {/* Motivational line */}
        <div style={{ fontSize: 10, color: "#6b7280", fontStyle: "italic", textAlign: "center", marginBottom: 20 }}>
          {defeated
            ? "\"Another week falls. The Iron Sovereign does not rest — it evolves.\""
            : "\"Survival is the first victory. Next week, you conquer.\""}
        </div>

        <button onClick={onClose} style={{
          width: "100%", padding: "14px 0",
          background: "#e2b714", color: "#000",
          border: "none", borderRadius: 12,
          fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 900,
          cursor: "pointer", textTransform: "uppercase", letterSpacing: 2,
        }}>
          Enter the New Week ⚔️
        </button>
      </div>
    </div>
  );
}
