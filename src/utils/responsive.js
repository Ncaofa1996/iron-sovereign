export function injectResponsiveStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("iron-sovereign-responsive")) return;

  const style = document.createElement("style");
  style.id = "iron-sovereign-responsive";
  style.textContent = `
@media (max-width: 768px) {
  .iron-grid-2 { grid-template-columns: 1fr !important; }

  button { min-height: 44px !important; }

  input[type="number"], input[type="text"], select {
    min-height: 44px !important;
    font-size: 16px !important;
  }

  .iron-tab-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .iron-tab-bar::-webkit-scrollbar { display: none; }

  .iron-card { padding: 12px !important; }

  .iron-hud { padding: 8px 12px !important; }

  /* Safe area insets for iPhone notch/home-bar */
  body {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  /* Ensure select elements also have good tap targets */
  select {
    min-height: 44px !important;
    font-size: 16px !important;
  }
  /* Checkboxes bigger on mobile */
  input[type="checkbox"] {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
  }
}

@media (max-width: 640px) {
  /* Minimum font sizes — override tiny inline fonts */
  span, div, p, label {
    min-font-size: 10px;
  }
  /* PWA install banner should wrap on mobile */
  .pwa-banner {
    white-space: normal !important;
    max-width: 90vw !important;
  }
}

@media (max-width: 480px) {
  body { font-size: 12px; }

  .iron-hud-secondary { display: none !important; }
}
`;
  document.head.appendChild(style);
}
