import { useState } from 'react';

const STAT_COLORS = {
  STR: '#ef4444', END: '#22c55e', WIS: '#a855f7',
  INT: '#06b6d4', CON: '#f59e0b', VIT: '#ec4899', AGI: '#3b82f6',
};

const SOURCE_ICONS = {
  liftosaur: '⚔️', cronometer: '🥩', renpho: '⚖️', fitbit: '❤️',
};

const SOURCE_LABELS = {
  liftosaur: 'Liftosaur', cronometer: 'Cronometer', renpho: 'Renpho', fitbit: 'Fitbit',
};

const STAT_KEYS = ['STR', 'END', 'WIS', 'INT', 'CON', 'VIT', 'AGI'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ImportReceipt({ receipt, onClose }) {
  const [hovered, setHovered] = useState(false);
  if (!receipt) return null;

  const {
    source, timestamp, dateRange = [], totalRows = 0,
    newDaysProcessed = 0, daysSkippedFinalized = 0,
    todayReprocessed = false, xpAwarded = {}, totalXP = 0,
  } = receipt;

  const missingStats = STAT_KEYS.filter(k => !xpAwarded[k] || xpAwarded[k] === 0);
  const showWarning = missingStats.length > 0 && missingStats.length < STAT_KEYS.length;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div style={{
        background: '#06080f', border: '1px solid #e2b714', borderRadius: 14,
        padding: '28px 32px', minWidth: 380, maxWidth: 480, width: '100%',
        boxShadow: '0 0 40px rgba(226,183,20,0.18), 0 8px 40px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(226,183,20,0.25)' }}>
          <span style={{ fontSize: 28 }}>{SOURCE_ICONS[source] ?? '📦'}</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#e2b714', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Import Complete</p>
            <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginTop: 2 }}>
              {SOURCE_LABELS[source] ?? source} · {formatTimestamp(timestamp)}
            </p>
          </div>
        </div>

        {/* Summary */}
        <p style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Import Summary</p>
        {[
          { label: 'Date Range', value: `${formatDate(dateRange[0])} – ${formatDate(dateRange[1])}` },
          { label: 'Total Rows', value: totalRows.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{label}</span>
            <span style={{ fontSize: 11, color: '#d1d5db', fontWeight: 600 }}>{value}</span>
          </div>
        ))}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '14px 0' }} />

        {/* Processing */}
        <p style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Processing Results</p>
        {[
          { icon: '✅', label: 'New days processed', value: newDaysProcessed, color: '#d1d5db' },
          { icon: '⏭️', label: 'Days skipped (locked)', value: daysSkippedFinalized, color: '#6b7280' },
          { icon: '🔄', label: 'Today reprocessed', value: todayReprocessed ? 'Yes' : 'No', color: todayReprocessed ? '#22c55e' : '#6b7280' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, width: 20, textAlign: 'center' }}>{icon}</span>
            <span style={{ fontSize: 11, color: '#9ca3af', flex: 1 }}>{label}</span>
            <span style={{ fontSize: 11, color, fontWeight: 600 }}>{value}</span>
          </div>
        ))}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '14px 0' }} />

        {/* XP Grid */}
        <p style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>XP Awarded</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {STAT_KEYS.map(stat => {
            const amount = xpAwarded[stat] ?? 0;
            const color = STAT_COLORS[stat];
            return (
              <div key={stat} style={{ background: '#0f1320', borderRadius: 7, padding: '8px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: 3 }}>{stat}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: amount > 0 ? color : '#374151' }}>
                  {amount > 0 ? `+${amount}` : '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total XP */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(226,183,20,0.07)', border: '1px solid rgba(226,183,20,0.22)', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: '#e2b714', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Total XP</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#e2b714' }}>+{totalXP.toLocaleString()}</span>
        </div>

        {/* Warning */}
        {showWarning && (
          <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 7, padding: '8px 12px', marginTop: 10, fontSize: 10, color: '#d97706', lineHeight: 1.5 }}>
            ⚠ No data for {missingStats.join(', ')}. Import the matching source to earn full XP.
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'block', width: '100%', marginTop: 18, padding: '10px 0',
            background: hovered ? 'rgba(226,183,20,0.08)' : 'transparent',
            border: `1px solid ${hovered ? '#e2b714' : 'rgba(226,183,20,0.35)'}`,
            borderRadius: 8, color: '#e2b714', fontFamily: "'Courier New', monospace",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
