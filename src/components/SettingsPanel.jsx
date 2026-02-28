import { useRef, useCallback } from "react";

const DEFAULTS = {
  name: "Iron Sovereign",
  startDate: "2023-01-01",
  startWeight: 248,
  proteinTarget: 200,
  stepTarget: 8000,
  sleepTarget: 7,
  timezone: "America/Chicago",
};

const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Los_Angeles",
  "America/Denver",
  "UTC",
];

const S = {
  label: { display: "block", color: "#6b7280", fontSize: 10, marginBottom: 4, fontFamily: "'Courier New', monospace", letterSpacing: "0.5px" },
  input: { background: "#0a0e1a", border: "1px solid #374151", borderRadius: 6, color: "#e5e7eb", padding: "6px 10px", fontFamily: "'Courier New', monospace", fontSize: 12, width: "100%", boxSizing: "border-box" },
  field: { marginBottom: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { color: "#e2b714", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Courier New', monospace", marginBottom: 12 },
  divider: { border: "none", borderTop: "1px solid #1a1f2e", margin: "20px 0" },
  row: { display: "flex", alignItems: "center", gap: 8 },
  suffix: { color: "#6b7280", fontSize: 10, fontFamily: "'Courier New', monospace", whiteSpace: "nowrap" },
  btn: { background: "rgba(226,183,20,0.12)", border: "1px solid rgba(226,183,20,0.3)", borderRadius: 6, color: "#e2b714", cursor: "pointer", padding: "6px 14px", fontSize: 11, fontFamily: "'Courier New', monospace" },
  btnDanger: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "6px 14px", fontSize: 11, fontFamily: "'Courier New', monospace" },
};

export default function SettingsPanel({ open, onClose, settings, updateSetting, addToast }) {
  const debounceRef = useRef(null);

  const handleChange = useCallback((key, value) => {
    updateSetting(key, value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      addToast("system", "Settings saved");
    }, 800);
  }, [updateSetting, addToast]);

  const handleExport = () => {
    const json = JSON.stringify(settings, null, 2);
    const url = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.href = url;
    a.download = "iron_sovereign_settings_backup.json";
    a.click();
  };

  const handleReset = () => {
    Object.entries(DEFAULTS).forEach(([k, v]) => updateSetting(k, v));
    addToast("system", "Settings reset to defaults");
  };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1199 }}
        />
      )}

      <div style={{
        position: "fixed", right: 0, top: 0, height: "100vh", width: 380,
        background: "#0b0f1a", borderLeft: "1px solid rgba(255,255,255,0.08)",
        zIndex: 1200, display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1f2e", flexShrink: 0 }}>
          <span style={{ color: "#e5e7eb", fontSize: 14, fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
            Settings
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px", fontFamily: "'Courier New', monospace" }}>
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* Profile */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Profile</div>
            <div style={S.field}>
              <label style={S.label}>Name</label>
              <input type="text" value={settings.name} onChange={e => handleChange("name", e.target.value)} style={S.input} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Start Date</label>
              <input type="date" value={settings.startDate} onChange={e => handleChange("startDate", e.target.value)} style={S.input} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Start Weight</label>
              <div style={S.row}>
                <input type="number" value={settings.startWeight} onChange={e => handleChange("startWeight", Number(e.target.value))} style={S.input} />
                <span style={S.suffix}>(lbs)</span>
              </div>
            </div>
          </div>

          <hr style={S.divider} />

          {/* Targets */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Targets</div>
            <div style={S.field}>
              <label style={S.label}>Daily Protein</label>
              <div style={S.row}>
                <input type="number" value={settings.proteinTarget} onChange={e => handleChange("proteinTarget", Number(e.target.value))} style={S.input} />
                <span style={S.suffix}>(g/day)</span>
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Daily Steps</label>
              <div style={S.row}>
                <input type="number" value={settings.stepTarget} onChange={e => handleChange("stepTarget", Number(e.target.value))} style={S.input} />
                <span style={S.suffix}>(steps)</span>
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Sleep Target</label>
              <div style={S.row}>
                <input type="number" value={settings.sleepTarget} onChange={e => handleChange("sleepTarget", Number(e.target.value))} style={S.input} />
                <span style={S.suffix}>(hrs)</span>
              </div>
            </div>
          </div>

          <hr style={S.divider} />

          {/* Timezone */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Timezone</div>
            <div style={S.field}>
              <label style={S.label}>Timezone</label>
              <select value={settings.timezone} onChange={e => handleChange("timezone", e.target.value)} style={S.input}>
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <hr style={S.divider} />

          {/* Preferences */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Preferences</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize:12, color:"#9ca3af", fontFamily:"'Courier New', monospace" }}>Sound Effects</span>
              <button
                onClick={() => handleChange("soundEnabled", !settings.soundEnabled)}
                style={{
                  background: settings.soundEnabled ? "rgba(226,183,20,0.15)" : "rgba(0,0,0,0.3)",
                  border: `1px solid ${settings.soundEnabled ? "rgba(226,183,20,0.4)" : "#374151"}`,
                  color: settings.soundEnabled ? "#e2b714" : "#6b7280",
                  padding: "4px 14px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                }}
              >
                {settings.soundEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <hr style={S.divider} />

          {/* Danger Zone */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Danger Zone</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={handleExport} style={S.btn}>Export Settings</button>
              <button onClick={handleReset} style={S.btnDanger}>Reset to Defaults</button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
