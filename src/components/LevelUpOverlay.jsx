import { useEffect } from "react";

let levelStylesInjected = false;
function injectLevelStyles() {
  if (levelStylesInjected || typeof document === "undefined") return;
  levelStylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes levelPulse {
      0%   { box-shadow: 0 0 0 0 rgba(226,183,20,0.7); }
      70%  { box-shadow: 0 0 0 30px rgba(226,183,20,0); }
      100% { box-shadow: 0 0 0 0 rgba(226,183,20,0); }
    }
    @keyframes levelIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes levelShimmer {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// Props: { show, level, className, onDismiss }
// 'className' here means the RPG class name (e.g. "Warrior", "Paladin")
export default function LevelUpOverlay({ show, level, className, onDismiss }) {
  injectLevelStyles();

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "radial-gradient(ellipse at center, rgba(226,183,20,0.12) 0%, rgba(0,0,0,0.92) 60%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        animation: "levelIn 0.4s ease forwards",
      }}
    >
      <div style={{ textAlign: "center", fontFamily: "'Courier New', monospace" }}>
        {/* Outer ring */}
        <div style={{
          width: 180, height: 180, borderRadius: "50%",
          border: "3px solid #e2b714",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 32px",
          animation: "levelPulse 1.2s ease infinite",
          background: "rgba(226,183,20,0.05)",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#e2b714", fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", marginBottom: 4 }}>LEVEL</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{level}</div>
          </div>
        </div>

        <div style={{ fontSize: 32, fontWeight: 900, color: "#e2b714", letterSpacing: 6, textTransform: "uppercase", marginBottom: 12, animation: "levelShimmer 1.5s ease infinite" }}>
          LEVEL UP!
        </div>

        {className && (
          <div style={{ fontSize: 14, color: "#9ca3af", letterSpacing: 3, textTransform: "uppercase" }}>
            {className}
          </div>
        )}

        <div style={{ marginTop: 32, fontSize: 9, color: "#374151", letterSpacing: 2 }}>
          CLICK TO CONTINUE
        </div>
      </div>
    </div>
  );
}
