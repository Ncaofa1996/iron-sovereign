import { useState, useMemo } from "react";

const STAT_COLORS = {
  STR: "#ef4444",
  END: "#22c55e",
  WIS: "#a855f7",
  INT: "#06b6d4",
  CON: "#f59e0b",
  VIT: "#ec4899",
};

const TYPE_META = {
  daily:  { label: "DAILY",  color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  weekly: { label: "WEEKLY", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  boss:   { label: "BOSS",   color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const FONT = "'Courier New', monospace";
const EMPTY_FORM = { name: "", desc: "", xp: 10, stat: "STR", type: "daily" };

function getDaysToWeeklyReset() {
  try {
    const last = localStorage.getItem("iron_sovereign_weekly_quest_reset");
    if (!last) return 7;
    const elapsed = Date.now() - new Date(last).getTime();
    const remaining = Math.max(0, 7 - Math.floor(elapsed / (24 * 60 * 60 * 1000)));
    return remaining;
  } catch { return 7; }
}

export default function QuestBuilder({ quests, onQuestToggle, onResetAll, onSave, onDelete, currentWeight }) {
  const [mode, setMode] = useState("normal"); // "normal" | "add" | "edit"
  const [editingQuest, setEditingQuest] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [hoveredId, setHoveredId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "daily" | "weekly" | "boss"

  const daysToReset = useMemo(() => getDaysToWeeklyReset(), []);

  // Filter quests and hide boss quests whose target is already beaten
  const visibleQuests = useMemo(() => {
    return quests.filter(q => {
      if (filter !== "all" && (q.type || "daily") !== filter) return false;
      // Hide boss quests whose target weight is already beaten (and not yet done)
      if ((q.type || "daily") === "boss" && q.bossTarget && currentWeight <= q.bossTarget && !q.done) return false;
      return true;
    });
  }, [quests, filter, currentWeight]);

  const completedCount = visibleQuests.filter(q => q.done).length;
  const totalXpEarned = visibleQuests.filter(q => q.done).reduce((sum, q) => sum + (q.xp || 0), 0);

  function openAdd() { setForm(EMPTY_FORM); setEditingQuest(null); setMode("add"); }
  function openEdit(quest) {
    setForm({ name: quest.name, desc: quest.desc || "", xp: quest.xp || 10, stat: quest.stat || "STR", type: quest.type || "daily" });
    setEditingQuest(quest);
    setMode("edit");
  }
  function cancelForm() { setMode("normal"); setEditingQuest(null); setForm(EMPTY_FORM); }

  function handleSave() {
    if (!form.name.trim()) return;
    if (mode === "edit" && editingQuest) {
      onSave({ ...editingQuest, name: form.name.trim(), desc: form.desc.trim(), xp: Number(form.xp), stat: form.stat, type: form.type });
    } else {
      onSave({ id: "custom_" + Date.now(), name: form.name.trim(), desc: form.desc.trim(), xp: Number(form.xp), stat: form.stat, type: form.type, done: false });
    }
    cancelForm();
  }

  function handleDeleteClick(id) {
    if (confirmDeleteId === id) { onDelete(id); setConfirmDeleteId(null); }
    else { setConfirmDeleteId(id); setTimeout(() => setConfirmDeleteId(null), 1500); }
  }

  const s = {
    container: { fontFamily: FONT, color: "#c9d1d9" },
    filterRow: { display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" },
    filterBtn: (active) => ({
      background: active ? "rgba(226,183,20,0.18)" : "none",
      border: `1px solid ${active ? "rgba(226,183,20,0.5)" : "#374151"}`,
      color: active ? "#e2b714" : "#6b7280",
      fontSize: 10, padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontFamily: FONT,
      fontWeight: active ? 900 : 400, letterSpacing: 1, textTransform: "uppercase",
    }),
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "8px 12px", background: "#0f1320", borderRadius: 6, border: "1px solid #1e2a3a" },
    headerText: { fontSize: 13, color: "#e2b714" },
    resetBtn: { background: "none", border: "1px solid #374151", color: "#9ca3af", fontSize: 11, padding: "3px 8px", borderRadius: 4, cursor: "pointer", fontFamily: FONT },
    questRow: (done) => ({ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 6, background: "#0f1320", borderRadius: 6, border: "1px solid #1e2a3a", opacity: done ? 0.55 : 1, position: "relative" }),
    checkbox: { width: 18, height: 18, cursor: "pointer", accentColor: "#e2b714", flexShrink: 0 },
    questName: (done) => ({ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: done ? "#6b7280" : "#c9d1d9", textDecoration: done ? "line-through" : "none", flexShrink: 0 }),
    questDesc: { fontSize: 11, color: "#6b7280", flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    xpBadge: { background: "#1e2a3a", color: "#e2b714", fontSize: 11, padding: "2px 6px", borderRadius: 4, flexShrink: 0 },
    statBadge: (stat) => ({ background: STAT_COLORS[stat] + "22", color: STAT_COLORS[stat] || "#9ca3af", fontSize: 11, padding: "2px 6px", borderRadius: 4, flexShrink: 0, fontWeight: 700 }),
    typeBadge: (type) => {
      const t = TYPE_META[type] || TYPE_META.daily;
      return { background: t.bg, color: t.color, fontSize: 9, padding: "2px 6px", borderRadius: 4, flexShrink: 0, fontWeight: 900, letterSpacing: 1 };
    },
    iconBtn: (color) => ({ background: "none", border: "none", cursor: "pointer", color: color || "#6b7280", fontSize: 14, padding: "2px 4px", lineHeight: 1 }),
    addBtn: { width: "100%", background: "none", border: "1px dashed #e2b714", color: "#e2b714", fontFamily: FONT, fontSize: 13, padding: "10px", borderRadius: 6, cursor: "pointer", marginTop: 6 },
    form: { background: "#0f1320", border: "1px solid #e2b714", borderRadius: 6, padding: "12px 14px", marginTop: 8 },
    formRow: { display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" },
    label: { fontSize: 11, color: "#9ca3af", marginBottom: 3, display: "block" },
    input: { background: "#1e2a3a", border: "1px solid #374151", color: "#c9d1d9", fontFamily: FONT, fontSize: 13, padding: "6px 8px", borderRadius: 4, width: "100%", boxSizing: "border-box" },
    saveBtn: { background: "#e2b714", color: "#0f1320", border: "none", fontFamily: FONT, fontWeight: 700, fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" },
    cancelBtn: { background: "none", border: "1px solid #374151", color: "#6b7280", fontFamily: FONT, fontSize: 13, padding: "8px 12px", borderRadius: 4, cursor: "pointer" },
    resetNote: { fontSize: 9, color: "#6b7280", marginLeft: "auto", letterSpacing: 0 },
  };

  const FILTER_TABS = [
    { key: "all",    label: "ALL" },
    { key: "daily",  label: "DAILY" },
    { key: "weekly", label: "WEEKLY" },
    { key: "boss",   label: "BOSS" },
  ];

  return (
    <div style={s.container}>
      {/* Filter tabs */}
      <div style={s.filterRow}>
        {FILTER_TABS.map(f => (
          <button key={f.key} style={s.filterBtn(filter === f.key)} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        {filter === "weekly" && (
          <span style={{ ...s.resetNote, alignSelf: "center", marginLeft: 8 }}>
            Resets in {daysToReset}d
          </span>
        )}
      </div>

      {/* Header row */}
      <div style={s.header}>
        <span style={s.headerText}>
          ⚡ Quests &nbsp;•&nbsp; {completedCount}/{visibleQuests.length} &nbsp;•&nbsp; +{totalXpEarned} XP
        </span>
        <button style={s.resetBtn} onClick={onResetAll}>Reset All</button>
      </div>

      {/* Quest list */}
      {visibleQuests.map((quest) => {
        const qtype = quest.type || "daily";
        return (
          <div
            key={quest.id}
            style={s.questRow(quest.done)}
            onMouseEnter={() => setHoveredId(quest.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <input
              type="checkbox"
              style={s.checkbox}
              checked={!!quest.done}
              onChange={() => onQuestToggle(quest.id)}
            />
            <span style={s.typeBadge(qtype)}>{TYPE_META[qtype]?.label || "DAILY"}</span>
            {quest.svgIcon && (
              <img src={quest.svgIcon} width={18} height={18} alt="" style={{ mixBlendMode: "screen", filter: qtype === "boss" ? "sepia(1) saturate(10) hue-rotate(300deg)" : qtype === "weekly" ? "sepia(1) saturate(8) hue-rotate(240deg)" : "sepia(1) saturate(8) hue-rotate(20deg)", flexShrink: 0, opacity: quest.done ? 0.3 : 0.85 }} />
            )}
            <span style={s.questName(quest.done)}>{quest.name}</span>
            {quest.desc && <span style={s.questDesc}>{quest.desc}</span>}
            <span style={s.xpBadge}>+{quest.xp || 0} XP</span>
            {quest.stat && <span style={s.statBadge(quest.stat)}>{quest.stat}</span>}
            {hoveredId === quest.id && (
              <span style={{ display: "flex", gap: 2, marginLeft: "auto", flexShrink: 0 }}>
                <button style={s.iconBtn("#e2b714")} title="Edit" onClick={() => openEdit(quest)}>✏️</button>
                <button
                  style={s.iconBtn(confirmDeleteId === quest.id ? "#ef4444" : "#6b7280")}
                  title="Delete"
                  onClick={() => handleDeleteClick(quest.id)}
                >
                  {confirmDeleteId === quest.id ? "Confirm?" : "🗑️"}
                </button>
              </span>
            )}
          </div>
        );
      })}

      {visibleQuests.length === 0 && (
        <div style={{ textAlign: "center", color: "#6b7280", fontSize: 12, padding: "16px 0" }}>
          {filter === "boss" ? "No active boss quests — keep cutting!" : "No quests in this category."}
        </div>
      )}

      {mode === "normal" && (
        <button style={s.addBtn} onClick={openAdd}>+ Add Quest</button>
      )}

      {(mode === "add" || mode === "edit") && (
        <div style={s.form}>
          <div style={s.formRow}>
            <div style={{ flex: 2, minWidth: 140 }}>
              <label style={s.label}>Quest Name *</label>
              <input style={s.input} type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
            </div>
            <div style={{ flex: 3, minWidth: 160 }}>
              <label style={s.label}>Description</label>
              <input style={s.input} type="text" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Optional description" />
            </div>
          </div>
          <div style={s.formRow}>
            <div style={{ flex: 1, minWidth: 80 }}>
              <label style={s.label}>XP Reward</label>
              <input style={s.input} type="number" value={form.xp} min={1} max={200} onChange={(e) => setForm({ ...form, xp: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: 80 }}>
              <label style={s.label}>Stat</label>
              <select style={s.input} value={form.stat} onChange={(e) => setForm({ ...form, stat: e.target.value })}>
                {Object.keys(STAT_COLORS).map((stat) => (
                  <option key={stat} value={stat} style={{ color: STAT_COLORS[stat] }}>{stat}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 90 }}>
              <label style={s.label}>Type</label>
              <select style={s.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="boss">Boss</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <button style={s.saveBtn} onClick={handleSave}>Save</button>
              <button style={s.cancelBtn} onClick={cancelForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
