import { useMemo } from "react";
import { estimateInsulinSensitivity, getGutHealthBuff, getMetabolicDescriptor } from "../utils/metabolicHealth.js";

const C = {
  gold: "#e2b714",
  border: "rgba(255,255,255,0.06)",
  cardInner: "rgba(0,0,0,0.3)",
};

/**
 * MetabolicIntelligence Component
 * Visualizes Insulin Sensitivity and Gut Health based on Hyman's principles.
 */
export default function MetabolicIntelligence({ metrics, fiberGrams }) {
  const score = useMemo(() => estimateInsulinSensitivity(metrics), [metrics]);
  const descriptor = useMemo(() => getMetabolicDescriptor(score), [score]);
  const gutBuff = useMemo(() => getGutHealthBuff(fiberGrams), [fiberGrams]);

  const statusColors = {
    OPTIMAL: "#22c55e",
    GOOD: "#4ade80",
    NORMAL: "#e2b714",
    WARNING: "#f59e0b",
    CRITICAL: "#ef4444",
  };

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
        🧪 Metabolic Intelligence (Hyman)
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Insulin Sensitivity Card */}
        <div style={{ background: C.cardInner, border: `1px solid ${statusColors[descriptor.status]}33`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700 }}>INSULIN SENSITIVITY</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: statusColors[descriptor.status], margin: "4px 0" }}>{score}%</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{descriptor.label}</div>
          <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4 }}>{descriptor.desc}</div>
        </div>

        {/* Gut Health Card */}
        <div style={{ background: C.cardInner, border: `1px solid ${gutBuff.color}33`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700 }}>GUT HEALTH (FIBER)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: gutBuff.color, margin: "4px 0" }}>{fiberGrams}g</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{gutBuff.label}</div>
          <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4 }}>{gutBuff.desc}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 8, color: "#374151", textAlign: "center", fontStyle: "italic" }}>
        * Insulin sensitivity estimated via Body Fat, Visceral Fat, Steps, and Muscle Mass.
      </div>
    </div>
  );
}
