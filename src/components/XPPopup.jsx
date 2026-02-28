import { useState, useCallback } from "react";

// Inject animation styles once
let xpStylesInjected = false;
function injectXPStyles() {
  if (xpStylesInjected || typeof document === "undefined") return;
  xpStylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes floatUp {
      0%   { opacity: 1; transform: translateY(0) scale(1); }
      70%  { opacity: 1; transform: translateY(-50px) scale(1.05); }
      100% { opacity: 0; transform: translateY(-80px) scale(0.9); }
    }
  `;
  document.head.appendChild(style);
}

// Hook: useXPPopup
// Returns { popups, spawnPopup }
// spawnPopup(text, color, anchorEl?) — anchorEl is optional DOM ref for position
export function useXPPopup() {
  const [popups, setPopups] = useState([]);

  const spawnPopup = useCallback((text, color) => {
    const id = Date.now() + Math.random();
    // Random X offset so multiple popups don't stack
    const x = 40 + Math.random() * 120;
    const y = Math.random() * 40;
    setPopups(prev => [...prev.slice(-8), { id, text, color, x, y }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1600);
  }, []);

  return { popups, spawnPopup };
}

// Component: XPPopup
// Place inside the main app, near the top of the content area
// It renders as position:fixed overlay so it appears anywhere
export default function XPPopup({ popups }) {
  injectXPStyles();
  if (!popups || popups.length === 0) return null;
  return (
    <div style={{ position: "fixed", bottom: "30%", right: 24, pointerEvents: "none", zIndex: 800 }}>
      {popups.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          right: p.x,
          bottom: p.y,
          fontFamily: "'Courier New', monospace",
          fontWeight: 900,
          fontSize: 15,
          color: p.color,
          textShadow: `0 0 10px ${p.color}80`,
          whiteSpace: "nowrap",
          animation: "floatUp 1.6s ease forwards",
          userSelect: "none",
        }}>
          {p.text}
        </div>
      ))}
    </div>
  );
}
