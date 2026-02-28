import { useState, useRef } from "react";

// ── Helpers ──────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function estimateRows(bytes) {
  return Math.max(1, Math.round(bytes / 80)).toLocaleString();
}

// ── CSS keyframes injected once ──────────────────────────────
let injected = false;
function injectStyles() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulseBorder {
      from { opacity: 0.5; box-shadow: 0 0 0 0 rgba(226,183,20,0.4); }
      to   { opacity: 1;   box-shadow: 0 0 0 6px rgba(226,183,20,0); }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════
// DragDropZone — replaces static file zone with full drag support
// Props:
//   source    – 'liftosaur' | 'cronometer' | 'renpho' | 'fitbit'
//   label     – display name
//   icon      – emoji
//   desc      – subtitle text
//   accept    – file accept string e.g. ".csv"
//   status    – 'none' | 'success' | 'error'
//   rows      – imported row count (shown on success)
//   lastSync  – timestamp string
//   isLoading – spinner active
//   onFile    – (source: string, file: File) => void
// ═══════════════════════════════════════════════════════════════
export default function DragDropZone({
  source, label, icon, desc, accept,
  status, rows, lastSync, isLoading,
  onFile,
}) {
  injectStyles();

  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const inputRef = useRef();

  const showPreview = (file) => {
    setFilePreview({
      name: file.name,
      size: formatSize(file.size),
      estRows: estimateRows(file.size),
    });
    setTimeout(() => setFilePreview(null), 4000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the element entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    showPreview(file);
    onFile(source, file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showPreview(file);
    onFile(source, file);
    e.target.value = ""; // reset so same file can be re-imported
  };

  // ── Derived styles ─────────────────────────────────────────
  const borderColor = isDragging
    ? "rgba(226,183,20,0.7)"
    : status === "success" ? "rgba(34,197,94,0.35)"
    : status === "error"   ? "rgba(239,68,68,0.35)"
    : "rgba(255,255,255,0.1)";

  const bgColor = isDragging
    ? "rgba(226,183,20,0.06)"
    : "rgba(0,0,0,0.3)";

  return (
    <div style={{ marginBottom: 12, position: "relative" }}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {/* Drop zone */}
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: 14,
          background: bgColor,
          border: `2px dashed ${borderColor}`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: isLoading ? "default" : "pointer",
          transition: "background 0.15s, border-color 0.15s",
          position: "relative",
          userSelect: "none",
          animation: isDragging ? "pulseBorder 0.9s ease-in-out infinite alternate" : "none",
        }}
      >
        {/* Source icon */}
        <span style={{ fontSize: 26, flexShrink: 0, opacity: isLoading ? 0.5 : 1 }}>{icon}</span>

        {/* Labels */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 900,
            color: isDragging ? "#e2b714" : "#fff",
            transition: "color 0.15s",
          }}>
            {label}
          </div>

          {filePreview ? (
            <div style={{
              fontSize: 10, color: "#e2b714", marginTop: 2,
              animation: "slideDown 0.2s ease",
            }}>
              {filePreview.name} &bull; {filePreview.size} &bull; ~{filePreview.estRows} rows
            </div>
          ) : (
            <div style={{
              fontSize: 10,
              color: isDragging ? "rgba(226,183,20,0.8)" : "#6b7280",
              marginTop: 2,
              transition: "color 0.15s",
            }}>
              {isDragging ? "Release to import \u2193" : desc}
            </div>
          )}
        </div>

        {/* Status / Spinner */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: 18, height: 18,
                border: "2px solid rgba(226,183,20,0.25)",
                borderTop: "2px solid #e2b714",
                borderRadius: "50%",
                animation: "spin 0.65s linear infinite",
              }} />
              <span style={{ fontSize: 8, color: "#e2b714", fontWeight: 900, letterSpacing: 1 }}>PARSING</span>
            </div>
          ) : status === "none" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#374151" }}>↓ drop or click</div>
            </div>
          ) : status === "success" ? (
            <div>
              <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 900 }}>✅ {(rows || 0).toLocaleString()} rows</div>
              <div style={{ fontSize: 8, color: "#4b5563", marginTop: 2 }}>{lastSync}</div>
            </div>
          ) : (
            <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 900 }}>❌ Error</span>
          )}
        </div>
      </div>
    </div>
  );
}
