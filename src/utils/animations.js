// animations.js
// Injects global CSS keyframes once into document.head.
// Call injectGlobalAnimations() at app startup (in a useEffect).

const KEYFRAMES_CSS = `
@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes floatUp {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-80px) scale(0.9); }
}

@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(226,183,20,0); }
  50%       { box-shadow: 0 0 12px 4px rgba(226,183,20,0.35); }
}

@keyframes shakeX {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

@keyframes fadeScale {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes scanline {
  from { background-position: 0 0; }
  to   { background-position: 0 100%; }
}

@keyframes damageFlash {
  0%   { background: rgba(239, 68, 68, 0.25); }
  100% { background: transparent; }
}

@keyframes healPulse {
  0%   { background: rgba(34, 197, 94, 0.2); }
  100% { background: transparent; }
}

@keyframes pressDown {
  0%   { transform: scale(1); }
  50%  { transform: scale(0.97); }
  100% { transform: scale(1); }
}

@keyframes cardHover {
  from { transform: translateY(0); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
  to   { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.5); }
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(60px) scale(0.95); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulseBorder {
  from { opacity: 0.5; box-shadow: 0 0 0 0 rgba(226,183,20,0.4); }
  to   { opacity: 1;   box-shadow: 0 0 0 6px rgba(226,183,20,0); }
}

/* Hover effects on interactive cards */
.iron-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* Button active press feedback */
button:active {
  transform: scale(0.97);
  transition: transform 0.1s ease;
}
`;

/**
 * Injects the Iron Sovereign global CSS keyframes into document.head.
 * Safe to call multiple times — idempotent via style tag ID check.
 * Call this at app startup inside a useEffect with no dependencies.
 */
export function injectGlobalAnimations() {
  if (typeof document === "undefined") return;
  if (document.getElementById("iron-sovereign-animations")) return;

  const style = document.createElement("style");
  style.id = "iron-sovereign-animations";
  style.textContent = KEYFRAMES_CSS;
  document.head.appendChild(style);
}

// Reusable inline style snippets for common animations
export const PRESS_STYLE = "pressDown 0.1s ease";         // for button active state
export const HOVER_CARD_STYLE = "cardHover 0.15s ease forwards"; // for card hover state
