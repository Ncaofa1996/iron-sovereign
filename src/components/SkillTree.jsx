import { useState } from "react";

const STAT_COLORS = {
  STR: "#ef4444", END: "#22c55e", WIS: "#a855f7",
  INT: "#06b6d4", CON: "#f59e0b", VIT: "#ec4899",
};

export const SKILL_NODES = [
  // STR
  { id:"str_1", stat:"STR", tier:1, name:"Iron Grip",     desc:"Your grip never falters.",             cost:1, amount:10,  prereq:null    },
  { id:"str_2", stat:"STR", tier:2, name:"Battle Fury",   desc:"Explosive force on every rep.",        cost:2, amount:20,  prereq:"str_1" },
  { id:"str_3", stat:"STR", tier:3, name:"Titan's Fist",  desc:"The iron bends to your will.",         cost:3, amount:35,  prereq:"str_2" },
  // END
  { id:"end_1", stat:"END", tier:1, name:"Iron Lungs",    desc:"You outlast the burn.",                cost:1, amount:10,  prereq:null    },
  { id:"end_2", stat:"END", tier:2, name:"Marathon Soul", desc:"Miles feel like warm-ups.",            cost:2, amount:20,  prereq:"end_1" },
  { id:"end_3", stat:"END", tier:3, name:"Indomitable",   desc:"You do not stop. Ever.",               cost:3, amount:35,  prereq:"end_2" },
  // WIS
  { id:"wis_1", stat:"WIS", tier:1, name:"Calorie Sage",  desc:"You know your macros cold.",           cost:1, amount:10,  prereq:null    },
  { id:"wis_2", stat:"WIS", tier:2, name:"Macro Mastery", desc:"Protein and cals perfectly aligned.",  cost:2, amount:20,  prereq:"wis_1" },
  { id:"wis_3", stat:"WIS", tier:3, name:"Nutritionist",  desc:"Food is your weapon.",                 cost:3, amount:35,  prereq:"wis_2" },
  // INT
  { id:"int_1", stat:"INT", tier:1, name:"Scholar",       desc:"Mind sharpened daily.",                cost:1, amount:10,  prereq:null    },
  { id:"int_2", stat:"INT", tier:2, name:"Deep Study",    desc:"Knowledge compounds.",                 cost:2, amount:20,  prereq:"int_1" },
  { id:"int_3", stat:"INT", tier:3, name:"Arcane Mind",   desc:"You think in systems.",                cost:3, amount:35,  prereq:"int_2" },
  // CON
  { id:"con_1", stat:"CON", tier:1, name:"Iron Will",     desc:"Nothing breaks you.",                  cost:1, amount:10,  prereq:null    },
  { id:"con_2", stat:"CON", tier:2, name:"Forge-Hardened",desc:"Adversity is fuel.",                   cost:2, amount:20,  prereq:"con_1" },
  { id:"con_3", stat:"CON", tier:3, name:"Phoenix Body",  desc:"You rise from every setback.",         cost:3, amount:35,  prereq:"con_2" },
  // VIT
  { id:"vit_1", stat:"VIT", tier:1, name:"Rest Master",   desc:"Sleep is your weapon.",                cost:1, amount:10,  prereq:null    },
  { id:"vit_2", stat:"VIT", tier:2, name:"Deep Sleep",    desc:"Recovery doubled overnight.",          cost:2, amount:20,  prereq:"vit_1" },
  { id:"vit_3", stat:"VIT", tier:3, name:"Eternal Vigor", desc:"HP never runs empty.",                 cost:3, amount:35,  prereq:"vit_2" },
];

const STAT_ORDER = ["STR","END","WIS","INT","CON","VIT"];

// Calculate stat boost total from unlocked nodes
export function calcSkillTreeBoosts(unlockedIds) {
  const boosts = {};
  SKILL_NODES.forEach(n => {
    if (unlockedIds.has(n.id)) {
      boosts[n.stat] = (boosts[n.stat] || 0) + n.amount;
    }
  });
  return boosts;
}

export default function SkillTree({ skillPoints, unlockedNodes, onUnlock }) {
  const [tooltip, setTooltip] = useState(null); // node id

  const canUnlock = (node) => {
    if (unlockedNodes.has(node.id)) return false;
    if (skillPoints < node.cost) return false;
    if (node.prereq && !unlockedNodes.has(node.prereq)) return false;
    return true;
  };

  const getNodeState = (node) => {
    if (unlockedNodes.has(node.id)) return "unlocked";
    if (canUnlock(node)) return "available";
    return "locked";
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: skillPoints > 0 ? "#e2b714" : "#6b7280", textTransform: "uppercase", letterSpacing: 3 }}>
          🌳 SKILL TREE {skillPoints > 0 ? `— ${skillPoints} point${skillPoints !== 1 ? "s" : ""} available` : "— no points to spend"}
        </div>
        <div style={{ fontSize: 8, color: "#4b5563" }}>
          {unlockedNodes.size}/{SKILL_NODES.length} unlocked
        </div>
      </div>

      {/* Tree grid: 6 columns (stats), 3 rows (tiers) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
        {STAT_ORDER.map(stat => {
          const statColor = STAT_COLORS[stat];
          const nodes = SKILL_NODES.filter(n => n.stat === stat).sort((a, b) => a.tier - b.tier);
          const totalBoost = nodes.filter(n => unlockedNodes.has(n.id)).reduce((s, n) => s + n.amount, 0);
          return (
            <div key={stat} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {/* Stat label */}
              <div style={{ fontSize: 9, fontWeight: 900, color: statColor, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                {stat}
                {totalBoost > 0 && <span style={{ fontSize: 8, color: statColor, opacity: 0.7 }}> +{totalBoost}</span>}
              </div>

              {nodes.map((node, idx) => {
                const state = getNodeState(node);
                const isUnlocked = state === "unlocked";
                const isAvailable = state === "available";
                const isTooltipShown = tooltip === node.id;

                return (
                  <div key={node.id} style={{ position: "relative", width: "100%" }}>
                    {/* Connector line above (except first) */}
                    {idx > 0 && (
                      <div style={{
                        width: 2, height: 8, margin: "0 auto -4px",
                        background: unlockedNodes.has(nodes[idx-1].id) ? statColor : "rgba(255,255,255,0.1)",
                        borderRadius: 1,
                      }} />
                    )}

                    {/* Node button */}
                    <button
                      onClick={() => { if (isAvailable) onUnlock(node); }}
                      onMouseEnter={() => setTooltip(node.id)}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        width: "100%",
                        padding: "8px 4px",
                        background: isUnlocked
                          ? `${statColor}22`
                          : isAvailable
                          ? `${statColor}11`
                          : "rgba(0,0,0,0.2)",
                        border: `1px solid ${isUnlocked ? statColor : isAvailable ? `${statColor}55` : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 8,
                        cursor: isAvailable ? "pointer" : "default",
                        textAlign: "center",
                        transition: "all 0.15s",
                        boxShadow: isUnlocked ? `0 0 8px ${statColor}33` : "none",
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      <div style={{ fontSize: isUnlocked ? 16 : 12, marginBottom: 2 }}>
                        {isUnlocked ? "✦" : isAvailable ? "◇" : "◈"}
                      </div>
                      <div style={{ fontSize: 7, fontWeight: 900, color: isUnlocked ? statColor : isAvailable ? `${statColor}aa` : "#374151", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {node.name.split(" ").map((w, i) => <span key={i}>{w}<br/></span>)}
                      </div>
                      {!isUnlocked && (
                        <div style={{ fontSize: 7, color: isAvailable ? "#e2b714" : "#374151", marginTop: 3 }}>
                          {node.cost}pt · +{node.amount}
                        </div>
                      )}
                      {isUnlocked && (
                        <div style={{ fontSize: 7, color: statColor, marginTop: 2 }}>+{node.amount}</div>
                      )}
                    </button>

                    {/* Tooltip */}
                    {isTooltipShown && (
                      <div style={{
                        position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
                        background: "#1a1f2e", border: `1px solid ${statColor}44`, borderRadius: 8,
                        padding: "8px 10px", zIndex: 100, width: 130, pointerEvents: "none",
                        boxShadow: `0 4px 20px rgba(0,0,0,0.6)`,
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: statColor, marginBottom: 3 }}>{node.name}</div>
                        <div style={{ fontSize: 8, color: "#9ca3af", marginBottom: 4, lineHeight: 1.4 }}>{node.desc}</div>
                        <div style={{ fontSize: 8, color: "#e2b714" }}>+{node.amount} {node.stat}</div>
                        {!isUnlocked && (
                          <div style={{ fontSize: 8, color: isAvailable ? "#22c55e" : "#ef4444", marginTop: 3 }}>
                            {isAvailable ? `✓ Costs ${node.cost} pt` : node.prereq ? "⚠ Unlock tier above first" : `✗ Need ${node.cost - skillPoints} more pts`}
                          </div>
                        )}
                        {isUnlocked && <div style={{ fontSize: 8, color: "#22c55e", marginTop: 3 }}>✦ Unlocked</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center" }}>
        {[["✦ Unlocked","#22c55e"], ["◇ Available","#e2b714"], ["◈ Locked","#4b5563"]].map(([label, color]) => (
          <div key={label} style={{ fontSize: 8, color, display: "flex", alignItems: "center", gap: 3 }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
