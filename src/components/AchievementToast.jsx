import { useState, useEffect } from "react";

const STAT_COLORS = {
  STR: "#ef4444",
  END: "#22c55e",
  WIS: "#a855f7",
  INT: "#06b6d4",
  CON: "#f59e0b",
  VIT: "#ec4899",
};

const MOTIVATIONAL_LINES = {
  milestone: "The iron remembers every rep.",
  streak:    "Proof carved in iron.",
  boss:      "Another seal broken.",
};
const DEFAULT_LINE = "Legacy etched in sweat.";

export default function AchievementToast({ achievement, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const statColor =
    STAT_COLORS[achievement?.stat] || "#e2b714";

  const motivationalLine =
    MOTIVATIONAL_LINES[achievement?.type] || DEFAULT_LINE;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 9500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* Card */}
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          background: "#0f1320",
          border: `1px solid ${statColor}44`,
          borderRadius: 24,
          padding: 32,
          boxShadow: `0 0 60px ${statColor}30, 0 0 120px ${statColor}15`,
          textAlign: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.85)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Header label */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: statColor,
            textTransform: "uppercase",
            letterSpacing: 4,
            marginBottom: 16,
            textShadow: `0 0 12px ${statColor}`,
          }}
        >
          ACHIEVEMENT UNLOCKED
        </div>

        {/* Icon wrapper */}
        <div
          style={{
            borderRadius: "50%",
            width: 80,
            height: 80,
            margin: "0 auto 16px",
            background: `${statColor}10`,
            border: `2px solid ${statColor}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 30px ${statColor}40, inset 0 0 20px ${statColor}10`,
          }}
        >
          <span style={{ fontSize: 40 }}>{achievement?.icon}</span>
        </div>

        {/* Achievement name */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          {achievement?.name}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
            fontStyle: "italic",
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {achievement?.desc}
        </div>

        {/* XP + Stat badge row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              background: "rgba(226,183,20,0.1)",
              color: "#e2b714",
              border: "1px solid rgba(226,183,20,0.3)",
              borderRadius: 10,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            +{achievement?.xp} XP
          </span>
          <span
            style={{
              background: `${statColor}15`,
              color: statColor,
              border: `1px solid ${statColor}30`,
              borderRadius: 10,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {achievement?.stat}
          </span>
        </div>

        {/* Motivational line */}
        <div
          style={{
            fontSize: 9,
            color: "#4b5563",
            fontStyle: "italic",
            marginTop: 12,
            marginBottom: 20,
          }}
        >
          {motivationalLine}
        </div>

        {/* Claim button */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 0",
            background: statColor,
            color: "#000",
            border: "none",
            borderRadius: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Claim Achievement
        </button>
      </div>
    </div>
  );
}
