import { useState, useEffect } from "react";
import { getDailyChallenge, getWeeklyBonus, isChallengeClaimedToday, claimChallenge } from "../utils/challengeEngine.js";
import { getWeekStart } from "./WeeklyRecap.jsx";

const STAT_COLORS = {
  STR: "#ef4444",
  END: "#22c55e",
  WIS: "#a855f7",
  INT: "#06b6d4",
  CON: "#f59e0b",
  VIT: "#ec4899",
};

const WEEKLY_CHALLENGE_KEY = "iron_sovereign_weekly_challenge";
const DAILY_CHALLENGE_STORAGE_KEY = "iron_sovereign_daily_challenge";

function calcTimeLeft() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function isWeeklyClaimedThisWeek(weekStart) {
  try {
    const raw = localStorage.getItem(WEEKLY_CHALLENGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.weekStart === weekStart && parsed.claimed === true;
  } catch (_) {
    return false;
  }
}

function claimWeeklyBonus(weekStart) {
  try {
    localStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify({ weekStart, claimed: true }));
  } catch (_) {
    // localStorage unavailable
  }
}

function getClaimedDates() {
  try {
    const raw = localStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.claimedDates) ? parsed.claimedDates : [];
  } catch (_) {
    return [];
  }
}

export default function DailyChallenge({ onClaim }) {
  const [challenge] = useState(() => getDailyChallenge());
  const [weeklyBonus] = useState(() => getWeeklyBonus(getWeekStart()));
  const [claimed, setClaimed] = useState(() => isChallengeClaimedToday());
  const [weeklyClaimed, setWeeklyClaimed] = useState(() => isWeeklyClaimedThisWeek(getWeekStart()));
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft());

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const statColor = STAT_COLORS[challenge.stat] || "#e2b714";
  const weeklyStatColor = STAT_COLORS[weeklyBonus.stat] || "#a855f7";

  // Build 7-day history strip: today first, then 6 days back
  const today = new Date().toISOString().slice(0, 10);
  const claimedDates = getClaimedDates();
  const historyDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });

  function handleClaimDaily() {
    claimChallenge(challenge.date);
    setClaimed(true);
    if (onClaim) onClaim({ xp: challenge.xp, stat: challenge.stat });
  }

  function handleClaimWeekly() {
    claimWeeklyBonus(getWeekStart());
    setWeeklyClaimed(true);
    if (onClaim) onClaim({ xp: weeklyBonus.xp, stat: weeklyBonus.stat });
  }

  return (
    <div style={{
      background: "#0f1320",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20,
      padding: 20,
      fontFamily: "'Courier New', monospace",
    }}>

      {/* SECTION 1 — Header row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
      }}>
        <span style={{
          fontSize: 9,
          fontWeight: 900,
          color: "#e2b714",
          textTransform: "uppercase",
          letterSpacing: 3,
        }}>
          ⚡ DAILY CHALLENGE
        </span>
        <span style={{
          fontSize: 8,
          background: "rgba(255,255,255,0.04)",
          color: "#6b7280",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: "3px 8px",
        }}>
          Resets in {timeLeft}
        </span>
      </div>

      {/* SECTION 2 — Challenge card */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${statColor}30`,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
      }}>
        {/* Row 1: icon + name/desc */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 32, flexShrink: 0 }}>{challenge.icon}</span>
          <div>
            <div style={{
              fontSize: 14,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -0.3,
            }}>
              {challenge.name}
            </div>
            <div style={{
              fontSize: 10,
              color: "#9ca3af",
              marginTop: 3,
              lineHeight: 1.4,
            }}>
              {challenge.desc}
            </div>
          </div>
        </div>

        {/* Row 2: stat + xp badges */}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <span style={{
            background: `${statColor}15`,
            color: statColor,
            border: `1px solid ${statColor}30`,
            borderRadius: 8,
            padding: "3px 8px",
            fontSize: 8,
            fontWeight: 900,
            textTransform: "uppercase",
          }}>
            {challenge.stat}
          </span>
          <span style={{
            background: "rgba(226,183,20,0.1)",
            color: "#e2b714",
            border: "1px solid rgba(226,183,20,0.25)",
            borderRadius: 8,
            padding: "3px 8px",
            fontSize: 8,
            fontWeight: 900,
          }}>
            +{challenge.xp} XP
          </span>
        </div>
      </div>

      {/* SECTION 3 — Claim button or claimed state */}
      {!claimed ? (
        <button
          onClick={handleClaimDaily}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#e2b714",
            color: "#000",
            border: "none",
            borderRadius: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            fontWeight: 900,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          ⚡ Complete &amp; Claim +{challenge.xp} XP
        </button>
      ) : (
        <div style={{
          width: "100%",
          padding: "10px 0",
          background: "rgba(34,197,94,0.1)",
          color: "#22c55e",
          border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: 10,
          textAlign: "center",
          fontSize: 10,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 12,
          boxSizing: "border-box",
        }}>
          &#10003; Challenge Claimed Today
        </div>
      )}

      {/* SECTION 4 — Weekly bonus */}
      <div style={{ marginTop: 4 }}>
        <div style={{
          fontSize: 8,
          color: "#a855f7",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 8,
        }}>
          WEEKLY BONUS
        </div>
        <div style={{
          background: "rgba(168,85,247,0.05)",
          border: "1px solid rgba(168,85,247,0.2)",
          borderRadius: 10,
          padding: 12,
        }}>
          {/* Icon + name/desc row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{weeklyBonus.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: "#fff", fontWeight: 900 }}>
                {weeklyBonus.name}
              </div>
              <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>
                {weeklyBonus.desc}
              </div>
            </div>
          </div>

          {/* Badges row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <span style={{
              background: `${weeklyStatColor}15`,
              color: weeklyStatColor,
              border: `1px solid ${weeklyStatColor}30`,
              borderRadius: 8,
              padding: "3px 8px",
              fontSize: 8,
              fontWeight: 900,
              textTransform: "uppercase",
            }}>
              {weeklyBonus.stat}
            </span>
            <span style={{
              background: "rgba(168,85,247,0.1)",
              color: "#a855f7",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: 8,
              padding: "3px 8px",
              fontSize: 8,
              fontWeight: 900,
            }}>
              +{weeklyBonus.xp} XP
            </span>
          </div>

          {/* Weekly claim button or claimed badge */}
          {!weeklyClaimed ? (
            <button
              onClick={handleClaimWeekly}
              style={{
                width: "100%",
                padding: "8px 0",
                background: "rgba(168,85,247,0.2)",
                color: "#a855f7",
                border: "1px solid rgba(168,85,247,0.4)",
                borderRadius: 8,
                fontFamily: "'Courier New', monospace",
                fontSize: 9,
                fontWeight: 900,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              ⭐ Claim Weekly Bonus +{weeklyBonus.xp} XP
            </button>
          ) : (
            <div style={{
              width: "100%",
              padding: "8px 0",
              background: "rgba(34,197,94,0.08)",
              color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 8,
              textAlign: "center",
              fontSize: 9,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 1,
              boxSizing: "border-box",
            }}>
              &#10003; Weekly Bonus Claimed
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5 — 7-day history strip */}
      <div style={{ marginTop: 12 }}>
        <div style={{
          fontSize: 8,
          color: "#4b5563",
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 6,
        }}>
          STREAK HISTORY
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {historyDays.map((dateStr) => {
            const isToday = dateStr === today;
            const wasClaimed = claimedDates.includes(dateStr);

            let bg, color, borderColor, symbol;
            if (wasClaimed) {
              bg = "rgba(226,183,20,0.15)";
              color = "#e2b714";
              borderColor = "rgba(226,183,20,0.3)";
              symbol = "✓";
            } else if (isToday) {
              bg = "rgba(255,255,255,0.04)";
              color = "#374151";
              borderColor = "rgba(255,255,255,0.06)";
              symbol = "○";
            } else {
              bg = "rgba(239,68,68,0.08)";
              color = "#4b5563";
              borderColor = "rgba(239,68,68,0.1)";
              symbol = "✗";
            }

            return (
              <div
                key={dateStr}
                title={dateStr}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  textAlign: "center",
                  lineHeight: "28px",
                  fontSize: 11,
                  background: bg,
                  color,
                  border: `1px solid ${borderColor}`,
                  flexShrink: 0,
                }}
              >
                {symbol}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
