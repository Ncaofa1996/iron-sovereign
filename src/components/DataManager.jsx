import { useState, useEffect, useRef } from "react";
import { loadLedger, saveLedger } from "../engine/xpEngine.js";

const STATS = ["STR", "END", "WIS", "INT", "CON", "VIT"];
const SC = { STR:"#ef4444", END:"#22c55e", WIS:"#a855f7", INT:"#06b6d4", CON:"#f59e0b", VIT:"#ec4899", AGI:"#94a3b8" };
const ALL_SOURCES = ["liftosaur","cronometer","renpho","fitbit"];
const PAGE_SIZE = 10;
const MONO = "'Courier New', monospace";

const COLS = "110px 100px 1fr 70px 40px 40px 40px 40px 40px 40px";

function badge(state) {
  const gold = state === "mutable";
  const dim  = state === "finalized";
  return {
    display:"inline-block", padding:"2px 8px", borderRadius:99, fontSize:10,
    fontWeight:"bold", letterSpacing:0.5,
    background: gold ? "#3d2e00" : dim ? "#374151" : "#1a1f2e",
    color:       gold ? "#e2b714" : dim ? "#9ca3af" : "#4b5563",
    border: `1px solid ${gold ? "#e2b714" : "transparent"}`,
  };
}

function btn(variant) {
  const isConfirm = variant === "confirm";
  const isDanger  = variant === "danger";
  return {
    fontFamily:MONO, fontSize:11, padding:"4px 10px", borderRadius:4,
    border:"1px solid", cursor:"pointer", marginRight:6, background: isConfirm ? "#dc2626" : "transparent",
    borderColor: isConfirm || isDanger ? (isConfirm ? "#dc2626" : "#ef4444") : "#4b5563",
    color: isConfirm ? "#fff" : isDanger ? "#ef4444" : "#9ca3af",
  };
}

function computeStats(ledger) {
  const entries = Object.values(ledger);
  const usedSources = new Set();
  entries.forEach(e => (e.sources_processed||[]).forEach(s => { if (ALL_SOURCES.includes(s)) usedSources.add(s); }));
  return {
    totalDays: entries.length,
    finalized: entries.filter(e => e.state === "finalized").length,
    totalXP:   entries.reduce((s,e) => s + (e.total_xp||0), 0),
    sourceCount: usedSources.size,
  };
}

export default function DataManager({ addToast, addLog }) {
  const [ledger, setLedger]             = useState({});
  const [page, setPage]                 = useState(0);
  const [expandedDate, setExpandedDate] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showBackup, setShowBackup]     = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { setLedger(loadLedger()); }, []);

  useEffect(() => {
    if (!confirmDelete) return;
    const h = () => setConfirmDelete(null);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, [confirmDelete]);

  const entries    = Object.entries(ledger).sort(([a],[b]) => b.localeCompare(a));
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageRows   = entries.slice(page * PAGE_SIZE, (page+1) * PAGE_SIZE);
  const summary    = computeStats(ledger);

  function save(updated) { saveLedger(updated); setLedger({...updated}); }

  function reprocess(dateStr, e) {
    e.stopPropagation();
    const u = {...ledger, [dateStr]: {...ledger[dateStr], state:"unprocessed"}};
    save(u);
    addToast?.(`${dateStr} marked as unprocessed.`, "info");
    addLog?.(`Re-process: ${dateStr}`);
  }

  function deleteRow(dateStr, e) {
    e.stopPropagation();
    if (confirmDelete === dateStr) {
      const u = {...ledger}; delete u[dateStr];
      save(u);
      setConfirmDelete(null);
      if (expandedDate === dateStr) setExpandedDate(null);
      addToast?.(`Deleted ${dateStr}.`, "warning");
      addLog?.(`Deleted: ${dateStr}`);
    } else {
      setConfirmDelete(dateStr);
    }
  }

  function exportBackup() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("iron_sovereign_"));
    const data = {};
    keys.forEach(k => { try { data[k] = JSON.parse(localStorage.getItem(k)); } catch { data[k] = localStorage.getItem(k); } });
    const date = new Date().toISOString().slice(0,10);
    const url  = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], {type:"application/json"}));
    const a    = document.createElement("a");
    a.href = url; a.download = `iron_sovereign_backup_${date}.json`; a.click();
    URL.revokeObjectURL(url);
    addToast?.("Backup exported.", "success");
  }

  function importBackup(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        Object.entries(data).forEach(([k,v]) => localStorage.setItem(k, typeof v==="string" ? v : JSON.stringify(v)));
        addToast?.("Backup restored. Reloading...", "success");
        setTimeout(() => window.location.reload(), 1500);
      } catch { addToast?.("Import failed: invalid JSON.", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const mono = {fontFamily:MONO, color:"#c9d1d9", fontSize:13};
  const card = {background:"#1a1f2e", border:"1px solid #2a3040", borderRadius:6, padding:"10px 18px", flex:"1 1 120px", minWidth:120, textAlign:"center"};

  return (
    <div style={mono}>
      <div style={{color:"#e2b714", fontSize:15, fontWeight:"bold", marginBottom:12, letterSpacing:1}}>DATA MANAGER</div>

      {/* Stats strip */}
      <div style={{display:"flex", gap:10, marginBottom:16, flexWrap:"wrap"}}>
        {[
          {label:"Days Logged",  value: summary.totalDays.toLocaleString()},
          {label:"Finalized",    value: summary.finalized.toLocaleString()},
          {label:"Total XP",     value: summary.totalXP.toLocaleString()},
          {label:"Sources",      value: `${summary.sourceCount}/4`},
        ].map(({label,value}) => (
          <div key={label} style={card}>
            <span style={{color:"#e2b714", fontSize:20, fontWeight:"bold", display:"block"}}>{value}</span>
            <span style={{color:"#6b7280", fontSize:11, marginTop:3, display:"block"}}>{label}</span>
          </div>
        ))}
      </div>

      {/* Ledger table */}
      <div style={{background:"#0f1320", border:"1px solid #2a3040", borderRadius:8, overflow:"hidden", marginBottom:16}}>
        <div style={{display:"grid", gridTemplateColumns:COLS, background:"#1a1f2e", padding:"8px 12px", borderBottom:"1px solid #2a3040", color:"#6b7280", fontSize:11, fontWeight:"bold", letterSpacing:0.5, gap:4, alignItems:"center"}}>
          <span>Date</span><span>State</span><span>Sources</span><span>XP</span>
          {STATS.map(s => <span key={s} style={{color:SC[s], textAlign:"right"}}>{s}</span>)}
        </div>

        {pageRows.length === 0 && (
          <div style={{padding:"20px", textAlign:"center", color:"#4b5563"}}>No ledger entries yet.</div>
        )}

        {pageRows.map(([dateStr, entry]) => {
          const isExp = expandedDate === dateStr;
          const xp    = entry.xp_awarded || {};
          const srcs  = entry.sources_processed || [];
          return (
            <div key={dateStr} style={{borderBottom:"1px solid #1a1f2e", cursor:"pointer", background: isExp ? "#0d1119" : "transparent"}}>
              <div style={{display:"grid", gridTemplateColumns:COLS, padding:"8px 12px", gap:4, alignItems:"center"}}
                   onClick={() => setExpandedDate(d => d===dateStr ? null : dateStr)}>
                <span style={{color:"#c9d1d9"}}>{dateStr}</span>
                <span><span style={badge(entry.state)}>{entry.state}</span></span>
                <span style={{display:"flex", flexWrap:"wrap", gap:3}}>
                  {srcs.length===0 ? <span style={{color:"#4b5563"}}>—</span>
                    : srcs.map(s => <span key={s} style={{display:"inline-block", background:"#1a1f2e", border:"1px solid #2a3040", borderRadius:4, padding:"1px 5px", fontSize:10, color:"#94a3b8", marginRight:3}}>{s}</span>)}
                </span>
                <span style={{color:"#e2b714", textAlign:"right"}}>{(entry.total_xp||0).toLocaleString()}</span>
                {STATS.map(s => <span key={s} style={{color: xp[s] ? SC[s] : "#3a4050", textAlign:"right", fontSize:12}}>{xp[s]||0}</span>)}
              </div>

              {isExp && (
                <div style={{background:"#0a0d17", borderTop:"1px solid #1a1f2e", padding:"12px 16px"}}>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))", gap:8, marginBottom:10}}>
                    {[...STATS,"AGI"].map(s => (
                      <div key={s} style={{background:"#1a1f2e", border:`1px solid ${SC[s]||"#2a3040"}22`, borderRadius:6, padding:"6px 10px", textAlign:"center"}}>
                        <div style={{color:SC[s]||"#94a3b8", fontWeight:"bold", fontSize:16}}>{xp[s]||0}</div>
                        <div style={{color:"#6b7280", fontSize:10, marginTop:2}}>{s} XP</div>
                      </div>
                    ))}
                  </div>
                  <div style={{color:"#6b7280", fontSize:11, marginBottom:8}}>
                    Sources: <span style={{color:"#9ca3af"}}>{srcs.length ? srcs.join(", ") : "none"}</span>
                  </div>
                  <div style={{display:"flex", gap:6}} onClick={e => e.stopPropagation()}>
                    {entry.state==="mutable" && (
                      <button style={btn("default")} onClick={e => reprocess(dateStr,e)}>Re-process</button>
                    )}
                    <button style={btn(confirmDelete===dateStr ? "confirm" : "danger")} onClick={e => deleteRow(dateStr,e)}>
                      {confirmDelete===dateStr ? "Confirm Delete?" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"10px 12px", background:"#1a1f2e", borderTop:"1px solid #2a3040"}}>
          <button style={{fontFamily:MONO, fontSize:12, padding:"4px 14px", borderRadius:4, border:"1px solid #2a3040", background:"transparent", color: page===0 ? "#3a4050" : "#9ca3af", cursor: page===0 ? "default" : "pointer"}} disabled={page===0} onClick={() => setPage(p => Math.max(0,p-1))}>&#8592; Prev</button>
          <span style={{color:"#6b7280", fontSize:11}}>Page {page+1} of {totalPages}</span>
          <button style={{fontFamily:MONO, fontSize:12, padding:"4px 14px", borderRadius:4, border:"1px solid #2a3040", background:"transparent", color: page>=totalPages-1 ? "#3a4050" : "#9ca3af", cursor: page>=totalPages-1 ? "default" : "pointer"}} disabled={page>=totalPages-1} onClick={() => setPage(p => Math.min(totalPages-1,p+1))}>Next &#8594;</button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div style={{background:"#0f1320", border:"1px solid #2a3040", borderRadius:8, overflow:"hidden"}}>
        <div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 14px", cursor:"pointer", background:"#1a1f2e", color:"#9ca3af", fontSize:13, userSelect:"none"}} onClick={() => setShowBackup(v=>!v)}>
          <span style={{color:"#e2b714"}}>{showBackup ? "▼" : "▶"}</span>
          <span>Backup &amp; Restore</span>
        </div>
        {showBackup && (
          <div style={{padding:"14px 16px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
            <button style={{fontFamily:MONO, fontSize:12, padding:"7px 16px", borderRadius:5, border:"1px solid #e2b714", background:"transparent", color:"#e2b714", cursor:"pointer"}} onClick={exportBackup}>Export JSON Backup</button>
            <button style={{fontFamily:MONO, fontSize:12, padding:"7px 16px", borderRadius:5, border:"1px solid #4b5563", background:"transparent", color:"#9ca3af", cursor:"pointer"}} onClick={() => fileInputRef.current?.click()}>Import Backup</button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" style={{display:"none"}} onChange={importBackup} />
            <span style={{color:"#4b5563", fontSize:11, marginTop:6, width:"100%"}}>Export saves all iron_sovereign_ localStorage keys. Import restores and reloads.</span>
          </div>
        )}
      </div>
    </div>
  );
}
