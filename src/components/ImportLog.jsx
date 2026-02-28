const SOURCE_ICONS = { liftosaur: '⚔️', cronometer: '🥩', renpho: '⚖️', fitbit: '❤️' };
const SOURCE_LABELS = { liftosaur: 'Liftosaur', cronometer: 'Cronometer', renpho: 'Renpho', fitbit: 'Fitbit' };

function relativeTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Row({ entry, isLast }) {
  const { source, timestamp, totalRows, newDaysProcessed, daysSkippedFinalized, totalXP } = entry;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.03)',
      fontFamily: "'Courier New', monospace",
    }}>
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>
        {SOURCE_ICONS[source] ?? '📦'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#d1d5db', fontWeight: 600 }}>
          {SOURCE_LABELS[source] ?? source}
        </div>
        <div style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>
          {relativeTime(timestamp)} · {(totalRows ?? 0).toLocaleString()} rows
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: '#22c55e' }}>+{newDaysProcessed ?? 0} new</div>
        <div style={{ fontSize: 9, color: '#4b5563', marginTop: 1 }}>{daysSkippedFinalized ?? 0} skipped</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 48 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2b714' }}>+{(totalXP ?? 0)}</div>
        <div style={{ fontSize: 8, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>XP</div>
      </div>
    </div>
  );
}

export default function ImportLog({ importLog }) {
  if (!importLog?.length) {
    return (
      <p style={{ fontSize: 11, color: '#374151', textAlign: 'center', padding: 20, fontFamily: "'Courier New', monospace" }}>
        No imports yet.
      </p>
    );
  }
  return (
    <div style={{ background: '#0f1320', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: "'Courier New', monospace" }}>
        Recent Imports
      </div>
      {importLog.slice(0, 10).map((entry, i, arr) => (
        <Row key={`${entry.source}-${entry.timestamp}-${i}`} entry={entry} isLast={i === arr.length - 1} />
      ))}
    </div>
  );
}
