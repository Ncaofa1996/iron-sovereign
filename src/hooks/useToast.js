import { useState, useCallback, createContext, useContext, useRef } from "react";

const ToastContext = createContext(null);

// Toast types and their visual config
export const TOAST_TYPES = {
  xp:          { color: "#e2b714", icon: "⚡", border: "rgba(226,183,20,0.5)" },
  buff:        { color: "#22c55e", icon: "✨", border: "rgba(34,197,94,0.5)" },
  detriment:   { color: "#ef4444", icon: "⚠️", border: "rgba(239,68,68,0.5)" },
  system:      { color: "#3b82f6", icon: "📊", border: "rgba(59,130,246,0.5)" },
  achievement: { color: "#a855f7", icon: "🏆", border: "rgba(168,85,247,0.5)" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration || 4000;
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastRenderer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// Internal renderer (not exported as API)
function ToastRenderer({ toasts, onDismiss }) {
  // Inject keyframes once
  if (typeof document !== "undefined" && !document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(60px) scale(0.95); }
        to   { opacity: 1; transform: translateX(0)   scale(1);    }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateX(0)   scale(1);    }
        to   { opacity: 0; transform: translateX(60px) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      display: "flex", flexDirection: "column-reverse", gap: 10,
      zIndex: 9999, pointerEvents: "none",
    }}>
      {toasts.map(toast => {
        const cfg = TOAST_TYPES[toast.type] || TOAST_TYPES.system;
        return (
          <div key={toast.id} style={{
            width: 340, background: "#0f1320",
            border: "1px solid rgba(255,255,255,0.06)",
            borderLeft: `3px solid ${cfg.color}`,
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex", alignItems: "flex-start", gap: 10,
            fontFamily: "'Courier New', monospace",
            boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}`,
            animation: "toastIn 0.25s ease forwards",
            pointerEvents: "all",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
            <div style={{ flex: 1, fontSize: 11, color: "#e5e7eb", lineHeight: 1.5, wordBreak: "break-word" }}>
              {toast.message}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
