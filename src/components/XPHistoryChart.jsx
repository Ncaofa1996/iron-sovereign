import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const STAT_COLORS = {
  STR: '#ef4444', END: '#22c55e', WIS: '#a855f7',
  INT: '#06b6d4', CON: '#f59e0b', VIT: '#ec4899', AGI: '#3b82f6',
};

const STAT_KEYS = ['STR', 'END', 'WIS', 'INT', 'CON', 'VIT', 'AGI'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div style={{
      background: '#06080f', border: '1px solid rgba(226,183,20,0.35)', borderRadius: 8,
      padding: '10px 14px', fontFamily: "'Courier New', monospace", fontSize: 11,
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    }}>
      <div style={{ color: '#e2b714', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map(entry => entry.value > 0 ? (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: entry.color, marginBottom: 2 }}>
          <span>{entry.name}</span>
          <span style={{ fontWeight: 700 }}>+{entry.value}</span>
        </div>
      ) : null)}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, color: '#e2b714', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>TOTAL</span>
        <span>+{total}</span>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 8 }}>
      {STAT_KEYS.map(stat => (
        <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: STAT_COLORS[stat] }} />
          <span style={{ fontSize: 9, color: '#6b7280', fontFamily: "'Courier New', monospace", letterSpacing: '0.1em' }}>{stat}</span>
        </div>
      ))}
    </div>
  );
}

export default function XPHistoryChart({ xpHistory, onDayClick = null }) {
  if (!xpHistory?.length) {
    return (
      <div style={{ background: '#0f1320', borderRadius: 12, padding: 24, textAlign: 'center', fontFamily: "'Courier New', monospace", fontSize: 11, color: '#374151' }}>
        No XP history yet. Import CSV files to start tracking.
      </div>
    );
  }

  const data = xpHistory.slice(-14);

  return (
    <div style={{ background: '#0f1320', borderRadius: 12, padding: '20px 16px 12px', border: '1px solid rgba(255,255,255,0.06)', cursor: onDayClick ? 'pointer' : 'default' }}>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: 9, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
        XP History — Last 14 Days
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%" onClick={(data) => { if (onDayClick && data?.activePayload?.[0]) { onDayClick(data.activePayload[0].payload.date); } }}>
          <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 9, fontFamily: "'Courier New', monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 9, fontFamily: "'Courier New', monospace" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226,183,20,0.08)' }} />
          {STAT_KEYS.map((stat, i) => (
            <Bar key={stat} dataKey={stat} stackId="xp" fill={STAT_COLORS[stat]}
              radius={i === STAT_KEYS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <Legend />
    </div>
  );
}
