import { useState, useCallback, useRef, useEffect } from "react";
import { EXERCISE_LIST, TEMPLATES, buildLiftosaurRows, saveWorkoutHistory, loadWorkoutHistory } from "../engine/workoutLogger.js";
import { processImport } from "../engine/xpEngine.js";

// ── Rest Timer using Web Audio API (no audio files) ──────────
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) { /* audio not available */ }
}

function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef();

  const start = useCallback(() => {
    setRemaining(duration);
    setRunning(true);
  }, [duration]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(null);
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          playBeep();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const pct = remaining != null ? ((duration - remaining) / duration) * 100 : 0;

  return (
    <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
      <div style={{ fontSize: 9, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 3, marginBottom: 10 }}>Rest Timer</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Duration buttons */}
        {[60, 90, 120, 180].map(d => (
          <button key={d} onClick={() => { setDuration(d); setRemaining(null); setRunning(false); clearInterval(intervalRef.current); }}
            style={{ padding: "5px 10px", background: duration === d ? "rgba(226,183,20,0.2)" : "rgba(0,0,0,0.4)", border: `1px solid ${duration === d ? "rgba(226,183,20,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, color: duration === d ? "#e2b714" : "#6b7280", fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 900 }}>
            {fmt(d)}
          </button>
        ))}
        {/* Timer display */}
        {remaining != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ flex: 1, height: 4, background: "#1f2937", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #22c55e, #e2b714)", borderRadius: 4, transition: "width 1s linear" }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, color: remaining <= 10 ? "#ef4444" : "#e2b714", minWidth: 48 }}>{fmt(remaining)}</span>
          </div>
        )}
        {!running ? (
          <button onClick={start} style={{ padding: "6px 14px", background: "#e2b714", color: "#000", border: "none", borderRadius: 8, fontWeight: 900, fontSize: 10, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: 1 }}>
            Start
          </button>
        ) : (
          <button onClick={stop} style={{ padding: "6px 14px", background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontWeight: 900, fontSize: 10, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase" }}>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main WorkoutLogger Component ─────────────────────────────
export default function WorkoutLogger({ processFile, addLog, currentPhase }) {
  const [exercises, setExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState(loadWorkoutHistory);
  const searchRef = useRef();

  const filteredExercises = EXERCISE_LIST.filter(e =>
    e.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  const totalVolume = exercises.reduce((total, ex) =>
    total + ex.sets.filter(s => s.completed).reduce((s, set) => s + (set.reps || 0) * (set.weight || 0), 0), 0
  );

  const addExercise = useCallback((name) => {
    setExercises(prev => [...prev, {
      id: Date.now(),
      name,
      sets: [{ id: Date.now() + 1, reps: 10, weight: 135, completed: false }],
    }]);
    setSearchQuery("");
    setShowSearch(false);
  }, []);

  const loadTemplate = useCallback((templateName) => {
    const tmpl = TEMPLATES[templateName];
    if (!tmpl) return;
    setExercises(tmpl.exercises.map((ex, i) => ({
      id: Date.now() + i,
      name: ex.name,
      sets: ex.sets.map((s, j) => ({ id: Date.now() + i * 100 + j, reps: s.reps, weight: s.weight, completed: false })),
    })));
    setReceipt(null);
  }, []);

  const addSet = useCallback((exId) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 135 };
      return { ...ex, sets: [...ex.sets, { id: Date.now(), reps: last.reps, weight: last.weight, completed: false }] };
    }));
  }, []);

  const updateSet = useCallback((exId, setId, field, value) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) };
    }));
  }, []);

  const removeSet = useCallback((exId, setId) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      const newSets = ex.sets.filter(s => s.id !== setId);
      return newSets.length > 0 ? { ...ex, sets: newSets } : null;
    }).filter(Boolean));
  }, []);

  const removeExercise = useCallback((exId) => {
    setExercises(prev => prev.filter(ex => ex.id !== exId));
  }, []);

  const finishWorkout = useCallback(() => {
    const rows = buildLiftosaurRows(exercises);
    if (rows.length === 0) {
      addLog("detriment", "No completed sets to log. Check at least one set.");
      return;
    }
    const phaseConfig = { calorieTarget: currentPhase?.cal || 2000, proteinTarget: 200 };
    const result = processImport("liftosaur", rows, phaseConfig);
    const hist = saveWorkoutHistory(exercises, totalVolume);
    setHistory(hist);
    setReceipt({ rows: rows.length, totalXP: result.totalXP, volume: totalVolume });
    addLog("combat", `Workout complete! ${rows.length} sets logged, +${result.totalXP} XP, ${Math.round(totalVolume).toLocaleString()} lbs volume.`);
  }, [exercises, addLog, currentPhase, totalVolume]);

  const S = {
    card: { background: "#0f1320", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 },
    input: { padding: "7px 10px", background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e5e7eb", fontSize: 13, fontFamily: "'Courier New', monospace", outline: "none", width: "100%" },
    btn: { padding: "10px 16px", background: "#e2b714", color: "#000", border: "none", borderRadius: 10, fontWeight: 900, fontSize: 11, cursor: "pointer", fontFamily: "'Courier New', monospace", textTransform: "uppercase", letterSpacing: 1 },
    btnSm: { padding: "5px 10px", background: "rgba(226,183,20,0.12)", color: "#e2b714", border: "1px solid rgba(226,183,20,0.25)", borderRadius: 8, fontWeight: 900, fontSize: 9, cursor: "pointer", fontFamily: "'Courier New', monospace", textTransform: "uppercase", letterSpacing: 1 },
    btnDanger: { padding: "4px 8px", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, fontSize: 9, cursor: "pointer", fontFamily: "'Courier New', monospace" },
    label: { fontSize: 9, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, display: "block" },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
      {/* ── Left column: Active workout ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Volume header */}
        <div style={{ ...S.card, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={S.label}>Total Volume</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#e2b714" }}>{Math.round(totalVolume).toLocaleString()} <span style={{ fontSize: 12, color: "#6b7280" }}>lbs</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={S.label}>Completed Sets</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>{exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0)}</div>
          </div>
          {totalVolume > 0 && (
            <button onClick={finishWorkout} style={{ ...S.btn, background: "#22c55e" }}>
              Finish Workout
            </button>
          )}
        </div>

        {/* Receipt */}
        {receipt && (
          <div style={{ ...S.card, background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)", padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#22c55e", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Workout Complete!</div>
            <div style={{ display: "flex", gap: 24 }}>
              <div><div style={S.label}>Sets Logged</div><div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{receipt.rows}</div></div>
              <div><div style={S.label}>XP Earned</div><div style={{ fontSize: 20, fontWeight: 900, color: "#e2b714" }}>+{receipt.totalXP}</div></div>
              <div><div style={S.label}>Volume</div><div style={{ fontSize: 20, fontWeight: 900, color: "#3b82f6" }}>{Math.round(receipt.volume).toLocaleString()} lbs</div></div>
            </div>
          </div>
        )}

        {/* Templates */}
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 10 }}>Quick Templates</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.keys(TEMPLATES).map(t => (
              <button key={t} onClick={() => loadTemplate(t)} style={S.btnSm}>{t}</button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        {exercises.map((ex) => (
          <div key={ex.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{ex.name}</div>
              <button onClick={() => removeExercise(ex.id)} style={S.btnDanger}>Remove</button>
            </div>

            {/* Set headers */}
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 36px 36px", gap: 6, marginBottom: 6 }}>
              <div style={S.label}>Set</div>
              <div style={S.label}>Reps</div>
              <div style={S.label}>Weight (lbs)</div>
              <div style={S.label}>Done</div>
              <div />
            </div>

            {ex.sets.map((set, idx) => (
              <div key={set.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 36px 36px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <div style={{ fontSize: 11, color: set.completed ? "#22c55e" : "#4b5563", fontWeight: 900 }}>{idx + 1}</div>
                <input
                  type="number" value={set.reps} min={0} max={999}
                  onChange={e => updateSet(ex.id, set.id, "reps", parseInt(e.target.value) || 0)}
                  style={{ ...S.input, padding: "6px 8px", textAlign: "center", fontSize: 14, fontWeight: 900, opacity: set.completed ? 0.6 : 1 }}
                />
                <input
                  type="number" value={set.weight} min={0} max={9999} step={5}
                  onChange={e => updateSet(ex.id, set.id, "weight", parseFloat(e.target.value) || 0)}
                  style={{ ...S.input, padding: "6px 8px", textAlign: "center", fontSize: 14, fontWeight: 900, opacity: set.completed ? 0.6 : 1 }}
                />
                <input
                  type="checkbox" checked={set.completed}
                  onChange={e => updateSet(ex.id, set.id, "completed", e.target.checked)}
                  style={{ width: 20, height: 20, cursor: "pointer", accentColor: "#22c55e" }}
                />
                <button onClick={() => removeSet(ex.id, set.id)} style={S.btnDanger}>-</button>
              </div>
            ))}

            <button onClick={() => addSet(ex.id)} style={{ ...S.btnSm, marginTop: 6 }}>+ Add Set</button>
          </div>
        ))}

        {/* Add exercise search */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowSearch(s => !s)} style={{ ...S.btn, width: "100%", background: "rgba(226,183,20,0.12)", color: "#e2b714", border: "1px solid rgba(226,183,20,0.25)" }}>
            + Add Exercise
          </button>
          {showSearch && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0f1320", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, zIndex: 50, marginTop: 6, padding: 12 }}>
              <input
                ref={searchRef} autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                style={{ ...S.input, marginBottom: 8 }}
              />
              {filteredExercises.map(name => (
                <div key={name} onClick={() => addExercise(name)}
                  style={{ padding: "8px 10px", cursor: "pointer", color: "#e5e7eb", fontSize: 12, borderRadius: 8, transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(226,183,20,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {name}
                </div>
              ))}
              {filteredExercises.length === 0 && searchQuery && (
                <div onClick={() => addExercise(searchQuery)} style={{ padding: "8px 10px", cursor: "pointer", color: "#e2b714", fontSize: 12, borderRadius: 8, background: "rgba(226,183,20,0.06)" }}>
                  + Add "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right column: Timer + History ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <RestTimer />

        {/* Workout History */}
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>Recent Workouts</div>
          {history.length === 0 ? (
            <p style={{ fontSize: 11, color: "#374151", textAlign: "center", padding: 16 }}>No workouts logged yet.</p>
          ) : history.map((w, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{w.date}</span>
                <span style={{ fontSize: 10, color: "#e2b714", fontWeight: 700 }}>{Math.round(w.volume).toLocaleString()} lbs</span>
              </div>
              {w.exercises.slice(0, 3).map((e, j) => (
                <div key={j} style={{ fontSize: 9, color: "#6b7280" }}>{e.name} - {e.sets}x{e.topWeight > 0 ? e.topWeight + "lb" : "BW"}</div>
              ))}
              {w.exercises.length > 3 && <div style={{ fontSize: 9, color: "#374151" }}>+{w.exercises.length - 3} more</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
