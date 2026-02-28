// Seasonal events — calendar-based, 4 seasons per year.
// Returns a banner element and the active event config.

const SEASONS = [
  {
    id: "winter_siege",
    name: "Winter Siege",
    months: [11, 0, 1], // Dec, Jan, Feb
    icon: "❄️",
    color: "#60a5fa",
    gradient: "linear-gradient(135deg, rgba(96,165,250,0.15), rgba(16,42,80,0.4))",
    border: "rgba(96,165,250,0.3)",
    tagline: "The citadel holds — or falls. Defend with iron.",
    bonus: "Strength quests grant +15 XP this season",
    quests: [
      { id:"se_w1", name:"Winter Iron",    desc:"Complete 5 strength sessions this week",       xp:60,  stat:"STR", done:false, type:"seasonal", icon:"❄️" },
      { id:"se_w2", name:"Frost Guard",    desc:"Hit protein goal 6 of 7 days",                 xp:45,  stat:"WIS", done:false, type:"seasonal", icon:"🛡️" },
      { id:"se_w3", name:"Blizzard Run",   desc:"Log 50k+ steps this week",                     xp:50,  stat:"END", done:false, type:"seasonal", icon:"🌨️" },
    ],
  },
  {
    id: "spring_reborn",
    name: "Spring Reborn",
    months: [2, 3, 4], // Mar, Apr, May
    icon: "🌱",
    color: "#4ade80",
    gradient: "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(20,60,30,0.4))",
    border: "rgba(74,222,128,0.3)",
    tagline: "New growth, new power. The Phoenix rises.",
    bonus: "Endurance quests grant +15 XP this season",
    quests: [
      { id:"se_sp1", name:"Spring Stride",  desc:"Hit 10k steps 5 days this week",              xp:50,  stat:"END", done:false, type:"seasonal", icon:"🌱" },
      { id:"se_sp2", name:"Rebirth Protocol",desc:"Log data every day this week",                xp:40,  stat:"CON", done:false, type:"seasonal", icon:"🌿" },
      { id:"se_sp3", name:"Bloom Session",  desc:"3 full workouts logged this week",             xp:55,  stat:"STR", done:false, type:"seasonal", icon:"🌸" },
    ],
  },
  {
    id: "summer_conquest",
    name: "Summer Conquest",
    months: [5, 6, 7], // Jun, Jul, Aug
    icon: "☀️",
    color: "#fb923c",
    gradient: "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(80,30,10,0.4))",
    border: "rgba(251,146,60,0.3)",
    tagline: "The heat of battle drives you forward. Conquer.",
    bonus: "Volume PRs grant double XP this season",
    quests: [
      { id:"se_su1", name:"Solar Forge",    desc:"Log your heaviest lift of the month",         xp:65,  stat:"STR", done:false, type:"seasonal", icon:"☀️" },
      { id:"se_su2", name:"Heatwave",       desc:"70k+ steps in 7 days",                        xp:55,  stat:"END", done:false, type:"seasonal", icon:"🔥" },
      { id:"se_su3", name:"Iron Summer",    desc:"Hit calorie target 5 of 7 days",              xp:45,  stat:"WIS", done:false, type:"seasonal", icon:"🏆" },
    ],
  },
  {
    id: "harvest_hunt",
    name: "Harvest Hunt",
    months: [8, 9, 10], // Sep, Oct, Nov
    icon: "🍂",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(60,35,5,0.4))",
    border: "rgba(245,158,11,0.3)",
    tagline: "Claim your gains before the long winter returns.",
    bonus: "Nutrition consistency grants +15 XP this season",
    quests: [
      { id:"se_h1", name:"Harvest Protocol",desc:"200g+ protein 7 days straight",               xp:60,  stat:"WIS", done:false, type:"seasonal", icon:"🍂" },
      { id:"se_h2", name:"Autumn Press",    desc:"Log 4 strength sessions this week",            xp:50,  stat:"STR", done:false, type:"seasonal", icon:"🍁" },
      { id:"se_h3", name:"Hunter's March",  desc:"7.5h+ sleep 5 nights this week",              xp:40,  stat:"VIT", done:false, type:"seasonal", icon:"🌙" },
    ],
  },
];

export function getActiveSeason() {
  const month = new Date().getMonth(); // 0-11
  return SEASONS.find(s => s.months.includes(month)) || SEASONS[0];
}

// Banner shown at the top of Battle tab
export default function SeasonalEventBanner({ onViewQuests }) {
  const season = getActiveSeason();
  if (!season) return null;

  return (
    <div style={{
      background: season.gradient,
      border: `1px solid ${season.border}`,
      borderRadius: 14,
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 32, flexShrink: 0 }}>{season.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 8, fontWeight: 900, color: season.color, textTransform: "uppercase", letterSpacing: 3 }}>
            Seasonal Event
          </span>
          <span style={{ fontSize: 8, background: `${season.color}22`, color: season.color, border: `1px solid ${season.color}44`, borderRadius: 10, padding: "1px 7px", fontWeight: 900 }}>
            ACTIVE
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{season.name}</div>
        <div style={{ fontSize: 9, color: "#9ca3af", fontStyle: "italic", marginTop: 2 }}>"{season.tagline}"</div>
        <div style={{ fontSize: 8, color: season.color, marginTop: 4, fontWeight: 700 }}>⚡ {season.bonus}</div>
      </div>
      <button
        onClick={onViewQuests}
        style={{
          flexShrink: 0, padding: "8px 14px",
          background: `${season.color}22`, color: season.color,
          border: `1px solid ${season.color}44`, borderRadius: 10,
          fontFamily: "'Courier New', monospace", fontSize: 9, fontWeight: 900,
          cursor: "pointer", textTransform: "uppercase", letterSpacing: 1,
          whiteSpace: "nowrap",
        }}
      >
        View Quests
      </button>
    </div>
  );
}
