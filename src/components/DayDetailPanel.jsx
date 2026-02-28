import { useEffect } from 'react';
import { loadLedger } from '../engine/xpEngine.js';

const STATS = ['STR', 'END', 'WIS', 'INT', 'CON', 'VIT'];

const STAT_COLORS = {
  STR: '#ef4444',
  END: '#22c55e',
  WIS: '#a855f7',
  INT: '#06b6d4',
  CON: '#f59e0b',
  VIT: '#ec4899',
};

const FONT = "'Courier New', monospace";

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function XPBar({ stat, xp, maxXp }) {
  const color = STAT_COLORS[stat];
  const pct = maxXp > 0 ? Math.round((xp / maxXp) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontFamily: FONT, fontSize: 11, color, width: 28, flexShrink: 0 }}>{stat}</span>
      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: xp > 0 ? color : 'transparent', borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontFamily: FONT, fontSize: 11, color: xp > 0 ? color : '#4b5563', width: 38, textAlign: 'right', flexShrink: 0 }}>
        {xp} XP
      </span>
    </div>
  );
}

export default function DayDetailPanel({ date, onClose }) {
  const entry = date ? loadLedger()[date] : null;

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!date) return null;

  const stats = entry?.stats ?? {};
  const totalXP = entry?.totalXP ?? Object.values(stats).reduce((s, v) => s + (v || 0), 0);
  const sources = entry?.sources ?? [];
  const finalized = entry?.finalized ?? false;

  const maxXp = Math.max(1, ...STATS.map(s => stats[s] || 0));

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    zIndex: 1099,
  };

  const panelStyle = {
    position: 'fixed', top: 0, right: 0, height: '100vh', width: 420,
    background: '#0b0f1a', borderLeft: '1px solid rgba(226,183,20,0.2)',
    zIndex: 1100, display: 'flex', flexDirection: 'column',
    fontFamily: FONT, boxShadow: '-8px 0 40px rgba(0,0,0,0.7)',
    animation: 'slideInRight 0.22s ease',
  };

  const headerStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  };

  const sectionStyle = {
    background: '#1a1f2e', borderRadius: 8, padding: '14px 16px', marginBottom: 12,
  };

  const sectionLabelStyle = {
    fontSize: 9, color: '#4b5563', letterSpacing: '0.15em',
    textTransform: 'uppercase', marginBottom: 12,
  };

  return (
    <>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      <div style={overlayStyle} onClick={onClose} />
      <div style={panelStyle}>

        {/* Header */}
        <div style={headerStyle}>
          <span style={{ fontSize: 10, color: '#e2b714', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Day Detail
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
            color: '#6b7280', cursor: 'pointer', padding: '2px 8px', fontFamily: FONT, fontSize: 14,
          }}>
            x
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* Date + status row */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#e5e7eb', marginBottom: 6 }}>
              {formatDate(date)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10 }}>
              <span style={{ color: finalized ? '#22c55e' : '#f59e0b' }}>
                {finalized ? '● FINALIZED' : '● DRAFT'}
              </span>
              <span style={{ color: '#4b5563' }}>|</span>
              <span style={{ color: '#e2b714', fontWeight: 700 }}>Total XP: {totalXP}</span>
            </div>
          </div>

          {!entry ? (
            <div style={{ ...sectionStyle, textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>[ ]</div>
              <div style={{ fontSize: 11, color: '#4b5563' }}>No data logged for this date.</div>
            </div>
          ) : (
            <>
              {/* XP Breakdown */}
              <div style={sectionStyle}>
                <div style={sectionLabelStyle}>XP Breakdown</div>
                {STATS.map(stat => (
                  <XPBar key={stat} stat={stat} xp={stats[stat] || 0} maxXp={maxXp} />
                ))}
              </div>

              {/* Sources */}
              {sources.length > 0 && (
                <div style={sectionStyle}>
                  <div style={sectionLabelStyle}>Sources Processed</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {sources.map(src => (
                      <span key={src} style={{
                        background: 'rgba(226,183,20,0.1)', border: '1px solid rgba(226,183,20,0.25)',
                        borderRadius: 4, padding: '3px 8px', fontSize: 10, color: '#e2b714',
                      }}>
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
