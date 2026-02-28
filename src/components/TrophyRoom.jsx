import { useState } from "react";

const STAT_COLORS = {
  STR: "#ef4444",
  END: "#22c55e",
  WIS: "#a855f7",
  INT: "#06b6d4",
  CON: "#f59e0b",
  VIT: "#ec4899",
};

const FILTER_TABS = ["ALL", "EARNED", "LOCKED", "MILESTONE", "STREAK", "BOSS"];

function getStatColor(stat) {
  return STAT_COLORS[stat] || "#e2b714";
}

export default function TrophyRoom({ achievements, onClose }) {
  const [activeFilter, setActiveFilter] = useState("ALL");

  const earned = achievements.filter(a => a.earned).length;
  const total = achievements.length;

  const filtered = achievements.filter(a => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "EARNED") return a.earned === true;
    if (activeFilter === "LOCKED") return a.earned === false;
    return a.type === activeFilter.toLowerCase();
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0f1320",
          border: "1px solid rgba(226,183,20,0.2)",
          borderRadius: 24,
          padding: 28,
          maxWidth: 560,
          width: "100%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Courier New', monospace",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 32 }}>🏆</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                TROPHY ROOM
              </div>
              <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: 3 }}>
                Achievement Gallery
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              fontSize: 9,
              color: "#e2b714",
              border: "1px solid rgba(226,183,20,0.3)",
              borderRadius: 20,
              padding: "4px 10px",
            }}>
              {earned}/{total} Achieved
            </div>
            <button
              onClick={onClose}
              style={{
                fontSize: 22,
                color: "#6b7280",
                background: "none",
                border: "none",
                cursor: "pointer",
                lineHeight: 1,
                padding: 0,
                fontFamily: "'Courier New', monospace",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 8,
                  fontWeight: 900,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontFamily: "'Courier New', monospace",
                  background: isActive ? "rgba(226,183,20,0.15)" : "rgba(255,255,255,0.04)",
                  color: isActive ? "#e2b714" : "#6b7280",
                  border: isActive ? "1px solid rgba(226,183,20,0.3)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Achievement grid */}
        <div style={{
          overflowY: "auto",
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          alignContent: "start",
        }}>
          {filtered.map(achievement => {
            const statColor = getStatColor(achievement.stat);
            if (achievement.earned) {
              return (
                <div
                  key={achievement.id}
                  style={{
                    background: `${statColor}10`,
                    border: `1px solid ${statColor}30`,
                    borderRadius: 12,
                    padding: 12,
                    textAlign: "center",
                    boxShadow: `0 0 12px ${statColor}20`,
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{achievement.icon}</div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 900,
                    color: statColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 3,
                  }}>
                    {achievement.name}
                  </div>
                  <div style={{ fontSize: 8, color: "#9ca3af", lineHeight: 1.4, marginBottom: 6 }}>
                    {achievement.desc}
                  </div>
                  <span style={{
                    fontSize: 8,
                    background: "rgba(226,183,20,0.1)",
                    color: "#e2b714",
                    border: "1px solid rgba(226,183,20,0.2)",
                    borderRadius: 8,
                    padding: "2px 8px",
                    display: "inline-block",
                  }}>
                    +{achievement.xp} XP
                  </span>
                  <div style={{ fontSize: 7, color: statColor, marginTop: 4 }}>✦ EARNED</div>
                </div>
              );
            }

            return (
              <div
                key={achievement.id}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                  opacity: 0.5,
                }}
              >
                <div style={{ fontSize: 24, filter: "grayscale(1)", marginBottom: 4 }}>
                  {achievement.icon}
                </div>
                <div style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: "#4b5563",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  {achievement.name}
                </div>
                <div style={{ fontSize: 8, color: "#374151", lineHeight: 1.4 }}>
                  {achievement.desc}
                </div>
                <div style={{ fontSize: 7, color: "#374151", marginTop: 4 }}>◈ LOCKED</div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "32px 0",
              fontSize: 10,
              color: "#4b5563",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}>
              No achievements found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
