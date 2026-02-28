import { useEffect } from "react";
import Confetti from "./Confetti.jsx";

const RARITY_COLORS = {
  Common:    { color: "#9ca3af", glow: "rgba(156,163,175,0.3)", bg: "rgba(156,163,175,0.08)" },
  Uncommon:  { color: "#22c55e", glow: "rgba(34,197,94,0.4)",   bg: "rgba(34,197,94,0.08)" },
  Rare:      { color: "#3b82f6", glow: "rgba(59,130,246,0.4)",  bg: "rgba(59,130,246,0.08)" },
  Epic:      { color: "#a855f7", glow: "rgba(168,85,247,0.4)",  bg: "rgba(168,85,247,0.08)" },
  Legendary: { color: "#f59e0b", glow: "rgba(245,158,11,0.5)",  bg: "rgba(245,158,11,0.08)" },
  Mythic:    { color: "#ef4444", glow: "rgba(239,68,68,0.5)",   bg: "rgba(239,68,68,0.1)" },
};

const TIER_META = {
  bronze: { label: "BRONZE CHEST", color: "#f59e0b", icon: "📦" },
  silver: { label: "SILVER CACHE", color: "#9ca3af", icon: "🎁" },
  gold:   { label: "GOLD VAULT",   color: "#e2b714", icon: "💰" },
  mythic: { label: "MYTHIC HOARD", color: "#ef4444", icon: "👑" },
};

const SLOT_ICONS = {
  weapon: "⚔️", offhand: "🛡️", head: "🪖", body: "🥋",
  hands: "🧤", feet: "🥾", neck: "📿", ring1: "💍", ring2: "💍", back: "🦸",
};

let chestStylesInjected = false;
function injectChestStyles() {
  if (chestStylesInjected || typeof document === "undefined") return;
  chestStylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes chestIn {
      from { opacity: 0; transform: scale(0.8) translateY(30px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes chestGlow {
      0%, 100% { box-shadow: 0 0 20px var(--chest-glow); }
      50%       { box-shadow: 0 0 50px var(--chest-glow); }
    }
    @keyframes chestShimmer {
      0%, 100% { opacity: 0.85; }
      50%       { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// Props: { chest: { item, tier }, onClose }
// item = gear object (slot, name, rarity, bonus, condition)
// tier = "bronze" | "silver" | "gold" | "mythic"
export default function LootChest({ chest, onClose }) {
  injectChestStyles();

  const { item, tier = "gold" } = chest;
  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.Rare;
  const tierMeta = TIER_META[tier] || TIER_META.gold;

  return (
    <>
      <Confetti trigger={1} />
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 2200,
          background: "radial-gradient(ellipse at center, rgba(20,10,0,0.85) 0%, rgba(6,8,15,0.97) 70%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontFamily: "'Courier New', monospace",
        }}
      >
        {/* Card — stop propagation so clicking inside doesn't close */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 440, maxWidth: "92vw",
            background: "#0f1320",
            border: `2px solid ${rarity.color}`,
            borderRadius: 20,
            padding: 32,
            textAlign: "center",
            "--chest-glow": rarity.glow,
            animation: "chestIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards, chestGlow 2s ease infinite 0.5s",
          }}
        >
          {/* Tier banner */}
          <div style={{
            fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase",
            color: tierMeta.color, marginBottom: 8,
            animation: "chestShimmer 1.8s ease infinite",
          }}>
            {tierMeta.icon} {tierMeta.label}
          </div>

          {/* Header */}
          <div style={{ fontSize: 22, fontWeight: 900, color: "#e2b714", letterSpacing: 3, marginBottom: 24 }}>
            ⚔️ LOOT ACQUIRED
          </div>

          {/* Item card */}
          <div style={{
            background: rarity.bg,
            border: `1px solid ${rarity.color}55`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 24,
          }}>
            {/* Slot icon + name */}
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {SLOT_ICONS[item.slot] || "⚔️"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 6 }}>
              {item.name}
            </div>

            {/* Rarity badge */}
            <div style={{
              display: "inline-block",
              background: `${rarity.color}22`,
              border: `1px solid ${rarity.color}55`,
              color: rarity.color,
              fontSize: 10, fontWeight: 900, letterSpacing: 2,
              padding: "3px 10px", borderRadius: 6, marginBottom: 12,
              textTransform: "uppercase",
            }}>
              {item.rarity}
            </div>

            {/* Bonus */}
            <div style={{ fontSize: 14, color: "#e2b714", fontWeight: 700, marginBottom: 6 }}>
              {item.bonus}
            </div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>
              {item.condition}
            </div>
          </div>

          {/* Claim button */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              background: "#e2b714",
              color: "#000",
              border: "none",
              borderRadius: 10,
              padding: "14px 0",
              fontFamily: "'Courier New', monospace",
              fontWeight: 900,
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            ⚔️ Claim Reward
          </button>

          <div style={{ marginTop: 12, fontSize: 9, color: "#374151", letterSpacing: 2 }}>
            CLICK ANYWHERE TO DISMISS
          </div>
        </div>
      </div>
    </>
  );
}
