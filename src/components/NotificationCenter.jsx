import { useState, useMemo } from 'react';

const TYPE_COLOR = {
  combat: '#e2b714',
  buff: '#22c55e',
  detriment: '#ef4444',
  system: '#3b82f6',
};

const TYPE_ICON = {
  combat: '⚔️',
  buff: '✨',
  detriment: '⚠️',
  system: '📊',
};

export function useNotifBadge(entries) {
  const [lastRead, setLastRead] = useState(() => {
    return Number(localStorage.getItem('iron_sovereign_notif_last_read') || 0);
  });

  const count = useMemo(() => {
    const raw = entries.filter(e => e.id > lastRead).length;
    return Math.min(raw, 99);
  }, [entries, lastRead]);

  const markRead = () => {
    const now = Date.now();
    localStorage.setItem('iron_sovereign_notif_last_read', String(now));
    setLastRead(now);
  };

  return { count, markRead };
}

export default function NotificationCenter({ entries, onClose }) {
  const [filter, setFilter] = useState('all');
  const lastRead = Number(localStorage.getItem('iron_sovereign_notif_last_read') || 0);

  const filtered = useMemo(() => {
    const limited = entries.slice(0, 50);
    if (filter === 'all') return limited;
    if (filter === 'warnings') return limited.filter(e => e.type === 'detriment');
    return limited.filter(e => e.type === filter);
  }, [entries, filter]);

  const grouped = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    const today = [], yesterday = [], older = [];
    for (const e of filtered) {
      if (e.id >= todayStart) today.push(e);
      else if (e.id >= yesterdayStart) yesterday.push(e);
      else older.push(e);
    }
    return { today, yesterday, older };
  }, [filtered]);

  const markAllRead = () => {
    localStorage.setItem('iron_sovereign_notif_last_read', String(Date.now()));
    window.dispatchEvent(new Event('iron_sovereign_notif_updated'));
  };

  const pills = [
    { key: 'all', label: 'All' },
    { key: 'combat', label: 'Combat' },
    { key: 'buff', label: 'Buffs' },
    { key: 'warnings', label: 'Warnings' },
  ];

  const renderEntry = (entry) => {
    const isUnread = entry.id > lastRead;
    return (
      <div key={entry.id} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: isUnread ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontFamily: "'Courier New', monospace",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: TYPE_COLOR[entry.type] || '#888',
        }} />
        <span style={{ fontSize: 14, flexShrink: 0 }}>
          {TYPE_ICON[entry.type] || '📋'}
        </span>
        <span style={{
          flex: 1, fontSize: 12, color: '#c0c8d8',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {entry.msg}
        </span>
        <span style={{ fontSize: 11, color: '#555', flexShrink: 0, marginLeft: 4 }}>
          {entry.time}
        </span>
      </div>
    );
  };

  const renderGroup = (label, items) => {
    if (!items.length) return null;
    return (
      <div key={label}>
        <div style={{
          padding: '6px 12px', fontSize: 10, color: '#555',
          textTransform: 'uppercase', letterSpacing: 1,
          fontFamily: "'Courier New', monospace",
          background: '#0f1320',
        }}>
          {label}
        </div>
        {items.map(renderEntry)}
      </div>
    );
  };

  const hasEntries = filtered.length > 0;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1049,
      }} />

      <div style={{
        position: 'fixed', top: 60, right: 20,
        width: 340, maxHeight: 480,
        background: '#0b0f1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 1050,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Courier New', monospace",
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: 13, color: '#e2b714', fontWeight: 'bold' }}>
            🔔 Notifications
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={markAllRead} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4, color: '#888', fontSize: 10, padding: '2px 8px',
              cursor: 'pointer', fontFamily: "'Courier New', monospace",
            }}>
              Mark all read
            </button>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#888',
              fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '2px 4px',
            }}>
              ×
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{
          display: 'flex', gap: 6, padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {pills.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 11,
              cursor: 'pointer', border: 'none',
              fontFamily: "'Courier New', monospace",
              background: filter === key ? '#e2b714' : 'rgba(255,255,255,0.08)',
              color: filter === key ? '#0b0f1a' : '#888',
              fontWeight: filter === key ? 'bold' : 'normal',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Entry list */}
        <div style={{ overflowY: 'auto', maxHeight: 340, flex: 1 }}>
          {hasEntries ? (
            <>
              {renderGroup('Today', grouped.today)}
              {renderGroup('Yesterday', grouped.yesterday)}
              {renderGroup('Older', grouped.older)}
            </>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 120, color: '#555', fontSize: 13,
            }}>
              No notifications yet
            </div>
          )}
        </div>
      </div>
    </>
  );
}
