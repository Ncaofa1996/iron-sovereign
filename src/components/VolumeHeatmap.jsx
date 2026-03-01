import { useMemo } from "react";

const C = {
  gold:         "#e2b714",
  appBg:        "#06080f",
  cardBg:       "#0f1320",
  sectionBg:    "#1a1f2e",
  border:       "rgba(255,255,255,0.06)",
  STR: "#ef4444", END: "#22c55e", WIS: "#a855f7",
  INT: "#06b6d4", CON: "#f59e0b", VIT: "#ec4899",
};

/**
 * VolumeHeatmap Component
 * Displays weekly volume (sets) per muscle group.
 * Follows Nippard's 10-20 sets/week hypertrophy guidelines.
 * 
 * Props:
 *   weeklyVolume - { CHEST: 12, BACK: 15, ... }
 */
export default function VolumeHeatmap({ weeklyVolume = {} }) {
  const groups = [
    { id: "CHEST", label: "Chest", color: C.STR },
    { id: "BACK", label: "Back", color: C.STR },
    { id: "SHOULDERS", label: "Shoulders", color: C.STR },
    { id: "QUADS", label: "Quads", color: C.END },
    { id: "HAMSTRINGS", label: "Hamstrings", color: C.END },
    { id: "BICEPS", label: "Biceps", color: C.STR },
    { id: "TRICEPS", label: "Triceps", color: C.STR },
    { id: "ABS", label: "Abs", color: C.CON },
    { id: "CALVES", label: "Calves", color: C.END },
  ];

  const renderGroup = (group) => {
    const sets = weeklyVolume[group.id] || 0;
    // Nippard target: 10-20 sets. 20 is "max" for the bar.
    const pct = Math.min(100, (sets / 20) * 100);
    const isOptimal = sets >= 10 && sets <= 20;
    const isOverreaching = sets > 20;

    return (
      <div key={group.id} style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>
          <span style={{ color: "#fff" }}>{group.label.toUpperCase()}</span>
          <span style={{ color: isOverreaching ? "#ef4444" : isOptimal ? "#22c55e" : C.gold }}>
            {sets} SETS {isOptimal && "✓"}
          </span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ 
            height: "100%", 
            width: `${pct}%`, 
            background: group.color,
            boxShadow: isOptimal ? `0 0 8px ${group.color}aa` : "none",
            transition: "width 0.5s ease-out"
          }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, fontFamily: "'Courier New', monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: 11, color: C.gold, letterSpacing: 2 }}>WEEKLY VOLUME (NIPPARD)</h4>
        <div style={{ fontSize: 9, color: "#6b7280" }}>TARGET: 10-20 SETS</div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        {groups.map(renderGroup)}
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 9, color: "#4b5563", fontStyle: "italic" }}>
        * Stimulus → Recovery → Adaptation. Ensure 2-3x frequency per muscle.
      </div>
    </div>
  );
}
