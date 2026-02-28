import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, ReferenceLine
} from "recharts";
import { processImport, submitManualLog } from "./engine/xpEngine.js";
import { parseRenpho } from "./engine/csvParsers.js";
import { useXPLedger } from "./hooks/useXPLedger.js";
import { useCharacterPersistence, useBattleLogPersistence, useNutritionLogPersistence } from "./hooks/usePersistence.js";
// Quest defaults used for state init + migration — defined at module level for stable ref
const QUEST_DEFAULTS_ALL = [
  // ── DAILY ──────────────────────────────────────────────────────
  { id: "q1",  name: "Protein Crusader",  desc: "Hit 200g protein",               xp: 5,   stat: "WIS", done: false, type: "daily", svgIcon: "/icons/biceps.svg" },
  { id: "q2",  name: "Iron Devotion",     desc: "Complete 5/3/1 session",          xp: 5,   stat: "STR", done: false, type: "daily", svgIcon: "/icons/weight-lifting-up.svg" },
  { id: "q3",  name: "Circuit Breaker",   desc: "8+ hourly circuits",              xp: 5,   stat: "END", done: false, type: "daily", svgIcon: "/icons/muscle-up.svg" },
  { id: "q4",  name: "The Grind",         desc: "AM + PM cardio",                  xp: 3,   stat: "END", done: false, type: "daily", svgIcon: "/icons/sprint.svg" },
  { id: "q5",  name: "AMRAP Beast",       desc: "10+ reps on AMRAP",               xp: 3,   stat: "STR", done: false, type: "daily", svgIcon: "/icons/weight-lifting-up.svg" },
  { id: "q6",  name: "Macro Architect",   desc: "Cal within ±5% target",           xp: 3,   stat: "WIS", done: false, type: "daily" },
  { id: "q7",  name: "Iron Trifecta",     desc: "Protein + cals + 10k steps",      xp: 10,  stat: "CON", done: false, type: "daily", svgIcon: "/icons/champions.svg" },
  { id: "q8",  name: "Sleep Guardian",    desc: "Log 7.5h+ sleep",                 xp: 5,   stat: "VIT", done: false, type: "daily" },
  { id: "q9",  name: "Step Sovereign",    desc: "Reach 10,000 steps",              xp: 5,   stat: "INT", done: false, type: "daily", svgIcon: "/icons/run.svg" },
  { id: "q10", name: "MANA Ritual",       desc: "INT Trifecta: Bible+Book+Lang",   xp: 8,   stat: "INT", done: false, type: "daily" },
  { id: "q11", name: "Siege the Scale",   desc: "Log your weight today",           xp: 3,   stat: "VIT", done: false, type: "daily", svgIcon: "/icons/weight.svg" },
  { id: "q12", name: "Recovery Rite",     desc: "Stretching or mobility session",  xp: 3,   stat: "VIT", done: false, type: "daily", svgIcon: "/icons/progression.svg" },
  // ── WEEKLY ─────────────────────────────────────────────────────
  { id: "qw1", name: "The Unbroken",        desc: "7-day workout streak",                xp: 50,  stat: "STR", done: false, type: "weekly", svgIcon: "/icons/champions.svg" },
  { id: "qw2", name: "Protein Emperor",     desc: "200g protein 7 days straight",        xp: 40,  stat: "WIS", done: false, type: "weekly", svgIcon: "/icons/biceps.svg" },
  { id: "qw3", name: "Shadow Protocol",     desc: "Log daily data every day this week",  xp: 35,  stat: "CON", done: false, type: "weekly", svgIcon: "/icons/progression.svg" },
  { id: "qw4", name: "Cardio Sovereign",    desc: "70k+ steps in 7 days",               xp: 40,  stat: "END", done: false, type: "weekly", svgIcon: "/icons/run.svg" },
  { id: "qw5", name: "Sleep Knight",        desc: "7.5h+ sleep 5 nights this week",     xp: 30,  stat: "VIT", done: false, type: "weekly" },
  { id: "qw6", name: "Macro Perfectionist", desc: "Within 5% calories 5 of 7 days",     xp: 30,  stat: "WIS", done: false, type: "weekly" },
  // ── BOSS ───────────────────────────────────────────────────────
  { id: "qb1", name: "Slay the Heavy Shadow",      desc: "Reach 220 lbs — The Heavy Shadow falls",      xp: 100, stat: "STR", done: false, type: "boss", bossTarget: 220, svgIcon: "/icons/burning-skull.svg" },
  { id: "qb2", name: "Defeat the Birthday Dragon", desc: "Reach 212 lbs — The Birthday Dragon falls",   xp: 100, stat: "STR", done: false, type: "boss", bossTarget: 212, svgIcon: "/icons/dragon-head.svg" },
  { id: "qb3", name: "Break the Vanguard Line",    desc: "Reach 207 lbs — The Vacation Vanguard falls", xp: 100, stat: "END", done: false, type: "boss", bossTarget: 207, svgIcon: "/icons/direwolf.svg" },
  { id: "qb4", name: "Enter Onederland",           desc: "Reach 200 lbs — The Plateau Warden falls",    xp: 150, stat: "CON", done: false, type: "boss", bossTarget: 200, svgIcon: "/icons/ogre.svg" },
  { id: "qb5", name: "Slay the Iron Bull",         desc: "Log 5 strength sessions this week",           xp: 75,  stat: "STR", done: false, type: "boss", svgIcon: "/icons/bull.svg" },
  { id: "qb6", name: "Tame the Sleep Bear",        desc: "Log 7.5h+ sleep every night for 7 days",     xp: 60,  stat: "VIT", done: false, type: "boss", svgIcon: "/icons/bear-face.svg" },
];
import ImportReceipt from "./components/ImportReceipt.jsx";
import XPHistoryChart from "./components/XPHistoryChart.jsx";
import ImportLog from "./components/ImportLog.jsx";
import DragDropZone from "./components/DragDropZone.jsx";
import { ToastProvider, useToast } from "./hooks/useToast.jsx";
import XPPopup, { useXPPopup } from "./components/XPPopup.jsx";
import LevelUpOverlay from "./components/LevelUpOverlay.jsx";
import Confetti from "./components/Confetti.jsx";
import WorkoutLogger from "./components/WorkoutLogger.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import { useSettings } from "./hooks/useSettings.js";
import DayDetailPanel from "./components/DayDetailPanel.jsx";
import DataManager from "./components/DataManager.jsx";
import NotificationCenter, { useNotifBadge } from "./components/NotificationCenter.jsx";
import MacroCalc from "./components/MacroCalc.jsx";
import QuestBuilder from "./components/QuestBuilder.jsx";
import LootChest from "./components/LootChest.jsx";
import { injectGlobalAnimations } from "./utils/animations.js";
import { injectResponsiveStyles } from "./utils/responsive.js";
import { playSounds } from "./utils/sounds.js";

// Stat color map (used by XP popups and toasts)
const STAT_COLORS = { STR: "#ef4444", END: "#22c55e", WIS: "#a855f7", INT: "#06b6d4", CON: "#f59e0b", VIT: "#ec4899" };

// ═══════════════════════════════════════════════════════════════
// IRON SOVEREIGN V2 — INTERACTIVE EDITION
// Full GUI: CSV imports, daily log, clickable quests, gear mgmt
// ═══════════════════════════════════════════════════════════════

// ── CONSTANTS ──────────────────────────────────────────────────
const TIERS = [
  { name: "Novice", min: 0, max: 29, color: "#6b7280" },
  { name: "Apprentice", min: 30, max: 89, color: "#6b7280" },
  { name: "Journeyman", min: 90, max: 149, color: "#22c55e" },
  { name: "Adept", min: 150, max: 209, color: "#22c55e" },
  { name: "Expert", min: 210, max: 269, color: "#3b82f6" },
  { name: "Master", min: 270, max: 329, color: "#3b82f6" },
  { name: "Champion", min: 330, max: 389, color: "#a855f7" },
  { name: "Legend", min: 390, max: 449, color: "#a855f7" },
  { name: "Mythic", min: 450, max: 509, color: "#f59e0b" },
  { name: "Titan", min: 510, max: 559, color: "#f59e0b" },
  { name: "Iron Sovereign", min: 560, max: 600, color: "#ef4444" },
];

const CLASS_MAP = {
  "STR+END": { name: "Warrior", icon: "⚔️", evolve: ["Warrior", "Champion", "Warlord", "Titan"] },
  "STR+CON": { name: "Juggernaut", icon: "🛡️", evolve: ["Juggernaut", "Colossus", "Ironclad", "Deity"] },
  "STR+WIS": { name: "Paladin", icon: "✝️", evolve: ["Paladin", "Crusader", "Templar", "Saint"] },
  "END+WIS": { name: "Monk", icon: "🧘", evolve: ["Monk", "Disciple", "Ascendant", "Sage"] },
  "WIS+INT": { name: "Scholar", icon: "📖", evolve: ["Scholar", "Sage", "Arcanist", "Archmage"] },
  "CON+VIT": { name: "Guardian", icon: "🏰", evolve: ["Guardian", "Bulwark", "Fortress", "Eternal"] },
  "STR+INT": { name: "Battlemage", icon: "🔮", evolve: ["Battlemage", "Spellsword", "Arcane Knight", "Sovereign"] },
  "END+CON": { name: "Sentinel", icon: "👁️", evolve: ["Sentinel", "Warden", "Vanguard", "Overseer"] },
  "WIS+CON": { name: "Templar", icon: "⚜️", evolve: ["Templar", "Inquisitor", "Archon", "Divinity"] },
  "INT+VIT": { name: "Druid", icon: "🌿", evolve: ["Druid", "Shaman", "Oracle", "Primarch"] },
};

const SPELLS = [
  { id: "surge",    name: "Anabolic Surge",   cost: 40, icon: "🔥", svgIcon: "/icons/fire-spell-cast.svg",   iconFilter: "sepia(1) saturate(10) hue-rotate(10deg)",  desc: "2× STR XP on next workout sync",      type: "str_buff" },
  { id: "shield",   name: "Metabolic Shield", cost: 30, icon: "🛡️", svgIcon: "/icons/bolt-shield.svg",       iconFilter: "sepia(1) saturate(8) hue-rotate(195deg)",  desc: "Absorb next calorie overshoot",        type: "cal_shield" },
  { id: "wind",     name: "Second Wind",      cost: 50, icon: "✨", svgIcon: "/icons/health-potion.svg",     iconFilter: "sepia(1) saturate(8) hue-rotate(110deg)",  desc: "Restore 30 HP instantly",              type: "heal" },
  { id: "flow",     name: "Cognitive Flow",   cost: 25, icon: "🧠", svgIcon: "/icons/concentration-orb.svg", iconFilter: "sepia(1) saturate(8) hue-rotate(250deg)",  desc: "1.5× INT XP for next check-in",        type: "int_buff" },
  { id: "aegis",    name: "Iron Aegis",       cost: 35, icon: "⚜️", svgIcon: "/icons/barrier.svg",           iconFilter: "sepia(1) saturate(8) hue-rotate(170deg)",  desc: "Next HP loss reduced by 50%",          type: "dmg_reduce" },
  { id: "momentum", name: "Momentum",         cost: 20, icon: "💨", svgIcon: "/icons/afterburn.svg",         iconFilter: "sepia(1) saturate(10) hue-rotate(18deg)",  desc: "+50% END XP on next cardio sync",      type: "end_buff" },
  { id: "focus",    name: "Deep Focus",       cost: 25, icon: "🔮", svgIcon: "/icons/crystal-ball.svg",      iconFilter: "sepia(1) saturate(8) hue-rotate(225deg)",  desc: "+50% WIS XP on next nutrition sync",   type: "wis_buff" },
  { id: "cry",      name: "Battle Cry",       cost: 45, icon: "⚔️", svgIcon: "/icons/lightning-shout.svg",   iconFilter: "sepia(1) saturate(8) hue-rotate(15deg)",   desc: "STR +10 bonus, active 24h",            type: "str_aura" },
];

const ENCOUNTER_FLAVORS = {
  "The Heavy Shadow":      ["A remnant of old habits. Shed it.", "It grows when you ignore it.", "Old weight, old shame. Cut it loose."],
  "The Birthday Dragon":   ["Born from the Mar 21st deadline.", "Breathes fire on weak resolve.", "Its scales are made of missed sessions."],
  "The Vacation Vanguard": ["May 1st approaches. Travel light.", "It waits at the departure gate.", "Pack light. Fight hard."],
  "The Plateau Warden":    ["Gatekeeper of Onederland. Many fell here.", "It feeds on stagnation.", "The plateau is a test of will."],
  "The 200lb Gatekeeper":  ["The final guardian. 10% BF or nothing.", "Sovereign status awaits beyond.", "The last wall. Tear it down."],
};

const PHOENIX_SAGA = [
  { id:"ph1", name:"The Phoenix Awakens", desc:"Lose 10 lbs from your start weight milestone",          xp:75,  stat:"VIT", icon:"🔥" },
  { id:"ph2", name:"The Phoenix Runs",    desc:"Reach 10,000 steps for 30 consecutive days",            xp:75,  stat:"INT", icon:"🏃" },
  { id:"ph3", name:"The Phoenix Burns",   desc:"Reach sub-25% body fat",                                xp:100, stat:"END", icon:"⚡" },
];

function parseBonus(bonusStr) {
  const result = {};
  for (const m of (bonusStr || "").matchAll(/([A-Z]+) \+(\d+)/g)) result[m[1]] = parseInt(m[2]);
  return result;
}

const RAID_DEFAULTS = [
  { id:"raid1", name:"The Cardio Titan",  desc:"Hit step goal 5 days this week",    xp:200, stat:"AGI", type:"raid", done:false, icon:"⚡" },
  { id:"raid2", name:"The Iron Chef",     desc:"Log 200g+ protein 5 days this week", xp:200, stat:"WIS", type:"raid", done:false, icon:"🥩" },
  { id:"raid3", name:"The Forge Master",  desc:"Complete 3 workouts this week",      xp:250, stat:"STR", type:"raid", done:false, icon:"🔨" },
];
const DEBUFF_TYPES = {
  atrophy:     { name:"Atrophy",      icon:"💀", color:"#ef4444", desc:"No workout 2+ days — STR halved" },
  malnourished:{ name:"Malnourished", icon:"🦴", color:"#f97316", desc:"Low protein 2+ days — WIS halved" },
  exhausted:   { name:"Exhausted",    icon:"😵", color:"#8b5cf6", desc:"Poor sleep 2+ days — VIT halved" },
};

const GEAR_SLOTS = [
  { slot: "weapon", label: "Weapon", icon: "⚔️" },
  { slot: "offhand", label: "Off-Hand", icon: "🛡️" },
  { slot: "head", label: "Helm", icon: "🪖" },
  { slot: "body", label: "Armor", icon: "🥋" },
  { slot: "hands", label: "Gloves", icon: "🧤" },
  { slot: "feet", label: "Boots", icon: "🥾" },
  { slot: "neck", label: "Amulet", icon: "📿" },
  { slot: "ring1", label: "Ring I", icon: "💍" },
  { slot: "ring2", label: "Ring II", icon: "💍" },
  { slot: "back", label: "Cape", icon: "🦸" },
];

const RARITY = {
  Common: { color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.3)" },
  Uncommon: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" },
  Rare: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)" },
  Epic: { color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.3)" },
  Legendary: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  Mythic: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)" },
};

const INIT_GEAR = [
  { slot: "weapon", name: "Training Barbell", rarity: "Common", bonus: "STR +2", condition: "Started training", earned: true },
  { slot: "weapon", name: "Iron Longsword", rarity: "Uncommon", bonus: "STR +3", condition: "Bench 185+", earned: true },
  { slot: "weapon", name: "Battle Axe of the 225 Club", rarity: "Rare", bonus: "STR +5, CON +2", condition: "Bench 225 lb", earned: true },
  { slot: "weapon", name: "Arcane Greatsword", rarity: "Legendary", bonus: "STR +7, INT +5, +10% XP", condition: "Level 40+", earned: false },
  { slot: "weapon", name: "Sovereign's Blade", rarity: "Mythic", bonus: "ALL +12, +15% XP", condition: "Iron Sovereign tier", earned: false, prestige: true },
  { slot: "body", name: "Novice Vest", rarity: "Common", bonus: "CON +1", condition: "Starter", earned: true },
  { slot: "body", name: "Iron Breastplate", rarity: "Uncommon", bonus: "CON +3", condition: "30 workouts", earned: true },
  { slot: "body", name: "Midnight Plate", rarity: "Epic", bonus: "STR +5, CON +5", condition: "Squat 225+", earned: true },
  { slot: "head", name: "Iron Headband", rarity: "Common", bonus: "STR +1", condition: "5 workouts", earned: true },
  { slot: "head", name: "Battle Crown", rarity: "Epic", bonus: "STR +5, CON +3", condition: "50+ PRs", earned: false },
  { slot: "feet", name: "Training Shoes", rarity: "Common", bonus: "END +1", condition: "Starter", earned: true },
  { slot: "feet", name: "Endurance Treads", rarity: "Rare", bonus: "END +3, VIT +1", condition: "30 days 10k steps", earned: true },
  { slot: "neck", name: "Copper Amulet", rarity: "Common", bonus: "VIT +1", condition: "Starter", earned: true },
  { slot: "neck", name: "Pendant of Recovery", rarity: "Rare", bonus: "VIT +3, +10% Recovery XP", condition: "7 nights 7.5h+", earned: false },
  { slot: "ring1", name: "Ring of Discipline", rarity: "Rare", bonus: "WIS +3", condition: "30-day cal adherence", earned: false },
  { slot: "ring2", name: "Ring of Endurance", rarity: "Rare", bonus: "END +3, VIT +2", condition: "60 days steps logged", earned: true },
  { slot: "offhand", name: "Basic Shield", rarity: "Common", bonus: "CON +1", condition: "Starter", earned: true },
  { slot: "offhand", name: "Tome of Knowledge", rarity: "Rare", bonus: "INT +4, MANA +20", condition: "3 books completed", earned: false },
  { slot: "hands", name: "Lifting Straps", rarity: "Uncommon", bonus: "STR +2", condition: "5k sets", earned: true },
  { slot: "back", name: "Iron Cape", rarity: "Uncommon", bonus: "STR +2, END +1", condition: "10k weekly volume", earned: true },
  { slot: "back", name: "Phoenix Protocol Cloak", rarity: "Legendary", bonus: "ALL +5", condition: "Lost 150+ lbs", earned: true },
  // ── NEW GEAR ────────────────────────────────────────────────
  { slot: "weapon", name: "Deadlift Devastator", rarity: "Rare", bonus: "STR +5, END +2", condition: "Pull 315+", earned: false },
  { slot: "weapon", name: "Dumbbell of Destiny", rarity: "Epic", bonus: "STR +6, CON +4", condition: "10,000 dumbbell reps", earned: false },
  { slot: "head", name: "Crown of Consistency", rarity: "Epic", bonus: "WIS +6", condition: "30-day daily log streak", earned: false },
  { slot: "head", name: "Titan's Brow", rarity: "Legendary", bonus: "STR +8, CON +5", condition: "Level 35+", earned: false },
  { slot: "body", name: "Cardio Shell", rarity: "Rare", bonus: "END +5, VIT +2", condition: "1M lifetime steps", earned: false },
  { slot: "body", name: "Protein Veil", rarity: "Epic", bonus: "WIS +6, CON +4", condition: "90-day protein streak", earned: false },
  { slot: "feet", name: "Thunderstep Boots", rarity: "Epic", bonus: "END +6, INT +3", condition: "500k steps in a month", earned: false },
  { slot: "feet", name: "Phantom Stride", rarity: "Rare", bonus: "END +4, VIT +2", condition: "100 consecutive 10k days", earned: false },
  { slot: "hands", name: "Grip of the Iron Lord", rarity: "Legendary", bonus: "STR +7", condition: "Bench 275+", earned: false },
  { slot: "neck", name: "Heart of the Phoenix", rarity: "Mythic", bonus: "VIT +10, ALL +3", condition: "200 lbs lost", earned: false },
  { slot: "ring1", name: "Signet of Sovereignty", rarity: "Legendary", bonus: "ALL +5", condition: "Iron Sovereign tier", earned: false, prestige: true },
  { slot: "ring2", name: "Ring of the Vanguard", rarity: "Epic", bonus: "END +5, CON +3", condition: "Level 30+", earned: false },
  { slot: "back", name: "Cloak of Discipline", rarity: "Epic", bonus: "WIS +7, CON +3", condition: "100-day cal adherence", earned: false },
  { slot: "offhand", name: "Tome of Ancient Strength", rarity: "Epic", bonus: "STR +4, INT +4", condition: "5,000 sets + 25 books", earned: false },
  // ── MONSTER LOOT ─────────────────────────────────────────────────────────────
  { slot: "weapon", name: "Shadow Fang",              rarity: "Epic",      bonus: "STR +7, END +3",  condition: "Defeat The Heavy Shadow (220 lbs)",     earned: false, svgIcon: "/icons/broadsword.svg" },
  { slot: "weapon", name: "Dragonbone Greataxe",      rarity: "Legendary", bonus: "STR +9, VIT +4",  condition: "Defeat The Birthday Dragon (212 lbs)",  earned: false, svgIcon: "/icons/battle-axe.svg" },
  { slot: "body",   name: "Warden's Iron Plate",      rarity: "Legendary", bonus: "STR +7, CON +8",  condition: "Enter Onederland (200 lbs)",             earned: false, svgIcon: "/icons/abdominal-armor.svg" },
  { slot: "feet",   name: "Vanguard Trek Boots",      rarity: "Rare",      bonus: "END +5, INT +3",  condition: "Defeat The Vacation Vanguard (207 lbs)", earned: false, svgIcon: "/icons/steeltoe-boots.svg" },
  { slot: "ring1",  name: "Shadow Signet",            rarity: "Epic",      bonus: "STR +5, END +5",  condition: "Defeat The Heavy Shadow (220 lbs)",     earned: false, svgIcon: "/icons/big-diamond-ring.svg" },
  { slot: "head",   name: "Crown of the Sovereign",   rarity: "Mythic",    bonus: "ALL +8, +20% XP", condition: "Reach Iron Sovereign tier",             earned: false, svgIcon: "/icons/crown.svg", prestige: true },
  { slot: "hands",  name: "Ironclad Fists",           rarity: "Rare",      bonus: "STR +5, CON +3",  condition: "1,000 push-ups",                        earned: false, svgIcon: "/icons/boxing-glove.svg" },
  { slot: "back",   name: "Cloak of the Burning Eye", rarity: "Epic",      bonus: "STR +6, WIS +4",  condition: "Level 28+",                             earned: false, svgIcon: "/icons/burning-eye.svg" },
];

const INIT_PETS = [
  { name: "Iron Companion", icon: "🐕", bonus: "STR +5", condition: "Complete 5/3/1 cycle", earned: true },
  { name: "Recovery Sprite", icon: "🦋", bonus: "VIT +5, +5% Recovery XP", condition: "30 nights 7.5h+", earned: false },
  { name: "Scholar Owl", icon: "🦉", bonus: "INT +5, +10% INT XP", condition: "25 chapters read", earned: false },
  { name: "Mana Fox", icon: "🦊", bonus: "MANA +15, +10% regen", condition: "10 books OR 90-day lang streak", earned: false },
  { name: "Dragon Hatchling", icon: "🐉", bonus: "STR +8, VIT +8", condition: "Level 50", earned: false },
  { name: "Shadow Wolf", icon: "🐺", bonus: "END +8, +10% Cardio XP", condition: "1,000 mi steps", earned: false },
  { name: "Crimson Dragon", icon: "🔴", bonus: "STR +10, ALL +5", condition: "Level 50", earned: false },
  { name: "Ancient Tortoise", icon: "🐢", bonus: "CON +8, VIT +6", condition: "365 days tracked", earned: false },
  { name: "Phoenix Hatchling", icon: "🔥", bonus: "ALL +4, +10% XP", condition: "Complete Phoenix Saga", earned: false },
  { name: "Storm Hawk", icon: "🦅", bonus: "END +8, INT +4", condition: "1,000 miles lifetime steps", earned: false },
];

const INIT_ACHIEVEMENTS = [
  { name: "First Set", desc: "Log first workout", rarity: "Common", earned: true },
  { name: "Century Club", desc: "100 sets logged", rarity: "Common", earned: true },
  { name: "Thousand Sets", desc: "1,000 sets", rarity: "Uncommon", earned: true },
  { name: "Five Thousand", desc: "5,000 sets", rarity: "Rare", earned: true },
  { name: "Ten Thousand", desc: "10,000 sets", rarity: "Epic", earned: false, progress: "9,334/10,000" },
  { name: "The 225 Club", desc: "Bench 225 lb", rarity: "Rare", earned: true },
  { name: "Push-Up Titan", desc: "10,000 push-ups", rarity: "Epic", earned: true },
  { name: "Pull-Up Master", desc: "1,000 pull-ups", rarity: "Rare", earned: true },
  { name: "First 10 Lost", desc: "Lose 10 lbs", rarity: "Common", earned: true },
  { name: "Half Century", desc: "Lose 50 lbs", rarity: "Uncommon", earned: true },
  { name: "Century Down", desc: "Lose 100 lbs", rarity: "Rare", earned: true },
  { name: "The 150 Club", desc: "Lose 150 lbs", rarity: "Epic", earned: true },
  { name: "The Phoenix", desc: "Lose 170 lbs", rarity: "Legendary", earned: true },
  { name: "Sub-25 BF%", desc: "Under 25% body fat", rarity: "Rare", earned: true },
  { name: "Sub-20 BF%", desc: "Under 20% body fat", rarity: "Epic", earned: false, progress: "24.1% → 20%" },
  { name: "Sub-15 BF%", desc: "Under 15% body fat", rarity: "Legendary", earned: false },
  { name: "Elite Heart", desc: "RHR under 55", rarity: "Epic", earned: true },
  { name: "Iron HRV", desc: "HRV over 100ms", rarity: "Legendary", earned: true },
  { name: "Legacy Sword", desc: "170 lb lost. Still going.", rarity: "Mythic", earned: true },
];

const PHASES = [
  { id: "diet_break", label: "Diet Break", cal: 2500, color: "#22c55e" },
  { id: "phase1_cut", label: "Phase 1 Cut", cal: 2000, color: "#f59e0b" },
  { id: "phase2_cut", label: "Phase 2 Cut", cal: 1800, color: "#ef4444" },
  { id: "phase3_recomp", label: "Phase 3 Recomp", cal: 2200, color: "#3b82f6" },
];

// ── HELPERS ────────────────────────────────────────────────────
function getTier(p) { return TIERS.find(t => p >= t.min && p <= t.max) || TIERS[0]; }
function getLevel(p) {
  const t = [0,30,60,90,120,150,180,210,240,270,300,330,360,390,420,450,468,486,504,522,540,548,556,564,572,580,584,588,592,596,600];
  for (let i = t.length - 1; i >= 0; i--) { if (p >= t[i]) return i + 1; } return 1;
}
function getClassInfo(a) {
  const s = Object.entries(a).sort((x, y) => y[1] - x[1]);
  const k = s.slice(0, 2).map(x => x[0]).sort().join("+");
  return CLASS_MAP[k] || CLASS_MAP["STR+END"];
}
function getEvo(lv) { return lv >= 40 ? 3 : lv >= 25 ? 2 : lv >= 15 ? 1 : 0; }
function ts() { return new Date().toLocaleTimeString().slice(0, 5); }
function parseCSVRows(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.replace(/"/g, "").trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
}

// ── STYLES ─────────────────────────────────────────────────────
const S = {
  card: { background: "#0f1320", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 },
  cardInner: { background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 10, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 3, marginTop: 0, marginBottom: 12 },
  label: { fontSize: 9, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, display: "block" },
  input: { width: "100%", padding: "8px 10px", background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e5e7eb", fontSize: 13, fontFamily: "'Courier New', monospace", outline: "none", boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 10px", background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e5e7eb", fontSize: 12, fontFamily: "'Courier New', monospace", outline: "none", cursor: "pointer", boxSizing: "border-box", appearance: "auto" },
  btn: { padding: "10px 16px", background: "#e2b714", color: "#000", border: "none", borderRadius: 10, fontWeight: 900, fontSize: 11, cursor: "pointer", fontFamily: "'Courier New', monospace", textTransform: "uppercase", letterSpacing: 1 },
  btnSm: { padding: "6px 12px", background: "rgba(226,183,20,0.15)", color: "#e2b714", border: "1px solid rgba(226,183,20,0.3)", borderRadius: 8, fontWeight: 900, fontSize: 9, cursor: "pointer", fontFamily: "'Courier New', monospace", textTransform: "uppercase", letterSpacing: 1 },
  btnDanger: { padding: "6px 12px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontWeight: 900, fontSize: 9, cursor: "pointer", fontFamily: "'Courier New', monospace" },
  checkbox: { width: 18, height: 18, cursor: "pointer", accentColor: "#e2b714" },
  fileZone: { padding: 16, background: "rgba(0,0,0,0.3)", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, textAlign: "center", cursor: "pointer", transition: "all 0.2s" },
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT — ToastProvider wraps the inner component
// ═══════════════════════════════════════════════════════════════
export default function IronSovereignV2() {
  return (
    <ToastProvider>
      <IronSovereignV2Inner />
    </ToastProvider>
  );
}

function IronSovereignV2Inner() {
  // ── Persistence & XP Ledger ────────────────────────────────
  const [savedChar, setSavedChar] = useCharacterPersistence();
  const [savedBattleLog, setSavedBattleLog] = useBattleLogPersistence();
  const [savedNutritionLog, setSavedNutritionLog] = useNutritionLogPersistence();
  const { xpHistory, importLog, refresh: refreshLedger } = useXPLedger();
  const { addToast } = useToast();

  // ── Core State ─────────────────────────────────────────────
  const [tab, setTab] = useState("battle");
  const [importReceipt, setImportReceipt] = useState(null);
  const [hp, setHp] = useState(savedChar.hp ?? 85);
  const [mana, setMana] = useState(savedChar.mana ?? 92);
  const maxMana = 120;
  const [isDead, setIsDead] = useState(false);
  const [activeBuffs, setActiveBuffs] = useState([]);
  const [activePet, setActivePet] = useState(0);
  const [phase, setPhase] = useState("phase1_cut");
  const [gear, setGear] = useState(INIT_GEAR);
  const [pets] = useState(INIT_PETS);
  const [achievements] = useState(INIT_ACHIEVEMENTS);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedGearSlot, setSelectedGearSlot] = useState(null);

  // ── Daily Log State ────────────────────────────────────────
  const [dailyWeight, setDailyWeight] = useState("");
  const [dailyProtein, setDailyProtein] = useState("");
  const [dailyCals, setDailyCals] = useState("");
  const [dailySleep, setDailySleep] = useState("");
  const [dailySteps, setDailySteps] = useState("");
  const [dailyWorkedOut, setDailyWorkedOut] = useState(false);
  const [intBible, setIntBible] = useState(false);
  const [intBook, setIntBook] = useState(false);
  const [intLang, setIntLang] = useState(false);
  const [showDailyLog, setShowDailyLog] = useState(false);

  // ── Import State ───────────────────────────────────────────
  const [imports, setImports] = useState({
    liftosaur: { status: "none", rows: 0, lastSync: null },
    cronometer: { status: "none", rows: 0, lastSync: null },
    renpho: { status: "none", rows: 0, lastSync: null },
    fitbit: { status: "none", rows: 0, lastSync: null },
  });
  const [importedData, setImportedData] = useState({ liftosaur: [], cronometer: [], renpho: [], fitbit: [] });
  const fileRefs = { liftosaur: useRef(), cronometer: useRef(), renpho: useRef(), fitbit: useRef() };
  const [importLoading, setImportLoading] = useState({ liftosaur: false, cronometer: false, renpho: false, fitbit: false });
  const [hubDragActive, setHubDragActive] = useState(false);

  // ── Stats State (editable overrides) ───────────────────────
  const [attrs, setAttrs] = useState({ STR: 65, END: 63, WIS: 67, INT: 49, CON: 61, VIT: 74 });
  const [weight, setWeight] = useState(220);
  const [bodyFat, setBodyFat] = useState(24.1);
  const [leanMass, setLeanMass] = useState(155.6);
  const [rhr, setRhr] = useState(53);
  const [hrv, setHrv] = useState(117);
  const [totalSets, setTotalSets] = useState(9334);
  const [proteinAvg, setProteinAvg] = useState(191);
  const [dayCount, setDayCount] = useState(1097);
  const [editingStat, setEditingStat] = useState(null);

  // ── Phase 2: PWA install ───────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(
    !localStorage.getItem("iron_sovereign_pwa_dismissed")
  );
  const [lanUrl, setLanUrl] = useState(null);

  // ── Batch 3: Settings, panels, overlays ───────────────────
  const { settings, updateSetting } = useSettings();
  const [selectedDay, setSelectedDay] = useState(null);
  const [showMacroCalc, setShowMacroCalc] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  // ── Phase 5: XP Animations ────────────────────────────────
  const { popups, spawnPopup } = useXPPopup();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [pendingLootChest, setPendingLootChest] = useState(null);
  const prevLevelRef = useRef(null);
  const prevWeightRef = useRef(null);
  const allDailiesDoneRef = useRef(false);

  // ── Quest State (persisted + tiered: daily / weekly / boss) ──
  const [dailyQuests, setDailyQuests] = useState(() => {
    try {
      const saved = localStorage.getItem("iron_sovereign_daily_quests");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Add any new default quests not yet in saved state; sync non-persisted fields (svgIcon)
        const defaultMap = Object.fromEntries(QUEST_DEFAULTS_ALL.map(q => [q.id, q]));
        const existingIds = new Set(parsed.map(q => q.id));
        const missing = QUEST_DEFAULTS_ALL.filter(q => !existingIds.has(q.id));
        const merged = parsed.map(q => ({ ...q, svgIcon: defaultMap[q.id]?.svgIcon }));
        return missing.length > 0 ? [...merged, ...missing] : merged;
      }
    } catch {}
    return QUEST_DEFAULTS_ALL;
  });

  // ── Streaks ────────────────────────────────────────────────
  const [streaks, setStreaks] = useState({ workout: 4, protein: 3, trifecta: 0, sleep: 0, steps: 0, cals: 0, weigh: 0 });

  const [flavorIdx, setFlavorIdx] = useState(0);
  const [logFilter, setLogFilter] = useState("all");
  const [compareItem, setCompareItem] = useState(null);
  const [prs, setPrs] = useState(() => { try { return JSON.parse(localStorage.getItem("iron_sovereign_prs")) || {}; } catch { return {}; } });
  const [editingPr, setEditingPr] = useState(null);
  const [chainProgress, setChainProgress] = useState(() => { try { return JSON.parse(localStorage.getItem("iron_sovereign_chain_quests")) || [false, false, false]; } catch { return [false, false, false]; } });
  const [macroHistory, setMacroHistory] = useState([]);
  const [bfHistory, setBfHistory] = useState([]);

  // ── Mobile Responsive ──────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  // ── New Feature State ──────────────────────────────────────
  const [dailyWater, setDailyWater] = useState(0);

  const [weightHistory, setWeightHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("iron_sovereign_weight_history")) || []; }
    catch { return []; }
  });

  const [raidQuests, setRaidQuests] = useState(() => {
    try { return JSON.parse(localStorage.getItem("iron_sovereign_raid_quests")) || RAID_DEFAULTS; }
    catch { return RAID_DEFAULTS; }
  });

  const [activeDebuffs, setActiveDebuffs] = useState([]);

  const [durability, setDurability] = useState(() => {
    try { return JSON.parse(localStorage.getItem("iron_sovereign_durability")) || {}; }
    catch { return {}; }
  });

  const [prestigeUnlocked, setPrestigeUnlocked] = useState(() => {
    try { return JSON.parse(localStorage.getItem("iron_sovereign_prestige")) || false; }
    catch { return false; }
  });

  const [showPrestigeOverlay, setShowPrestigeOverlay] = useState(false);

  // ── Battle Log ─────────────────────────────────────────────
  const [battleLog, setBattleLog] = useState([
    { id: 1, type: "system", msg: "Iron Sovereign V2 Interactive initialized.", time: "BOOT" },
    { id: 2, type: "buff", msg: "🐕 Iron Companion deployed. STR +5 passive.", time: "00:01" },
    { id: 3, type: "combat", msg: "⚔️ Liftosaur sync: 9,334 sets processed. +65 STR.", time: "00:02" },
    { id: 4, type: "system", msg: "📊 Cronometer sync: 191g avg protein. WIS calibrated.", time: "00:03" },
    { id: 5, type: "buff", msg: "🛡️ Phoenix Protocol Cloak equipped. ALL stats +5.", time: "00:04" },
    { id: 6, type: "detriment", msg: "⚠️ Fiber intake 23g vs 38g target. INT debuff active.", time: "00:05" },
    { id: 7, type: "combat", msg: "💀 The Birthday Dragon spotted. 8 lbs to defeat.", time: "00:06" },
  ]);

  // ── Notification badge (needs battleLog defined above) ─────
  const { count: notifCount, markRead } = useNotifBadge(battleLog);

  // ── Nutrition Log History ──────────────────────────────────
  const [nutritionLog, setNutritionLog] = useState([]);

  const addLog = useCallback((type, msg) => {
    setBattleLog(prev => [{ id: Date.now(), type, msg, time: ts() }, ...prev].slice(0, 20));
  }, []);

  // ── Computed ───────────────────────────────────────────────
  const totalPower = Object.values(attrs).reduce((a, b) => a + b, 0);
  const tier = getTier(totalPower);
  const level = getLevel(totalPower);
  const classInfo = getClassInfo(attrs);
  const evoStage = getEvo(level);
  const currentPhase = PHASES.find(p => p.id === phase);
  const lbsLost = 385 - weight;

  const encounter = useMemo(() => {
    if (weight > 220) return { name: "The Heavy Shadow",    target: 220, type: "Mob",       icon: "👻", svgIcon: "/icons/burning-skull.svg", glowColor: "#ef4444", iconFilter: "sepia(1) saturate(10) hue-rotate(300deg)", flavor: "A remnant of old habits. Shed it." };
    if (weight > 212) return { name: "The Birthday Dragon", target: 212, type: "Mini-Boss", icon: "🐲", svgIcon: "/icons/dragon-head.svg",   glowColor: "#3b82f6", iconFilter: "sepia(1) saturate(8) hue-rotate(210deg)",  flavor: "Born from March 21st deadline. " + (weight - 212) + " lbs stand between you and victory." };
    if (weight > 207) return { name: "The Vacation Vanguard", target: 207, type: "Enemy",   icon: "🏖️", svgIcon: "/icons/direwolf.svg",      glowColor: "#22c55e", iconFilter: "sepia(1) saturate(8) hue-rotate(110deg)",  flavor: "May 1st approaches. Travel light." };
    if (weight > 200) return { name: "The Plateau Warden",  target: 200, type: "Boss",      icon: "⚔️", svgIcon: "/icons/ogre.svg",          glowColor: "#f59e0b", iconFilter: "sepia(1) saturate(6) hue-rotate(5deg)",    flavor: "The gatekeeper of Onederland. Many have fallen here." };
    return                    { name: "The 200lb Gatekeeper", target: 185, type: "World Boss", icon: "👑", svgIcon: "/icons/troll.svg",        glowColor: "#a855f7", iconFilter: "sepia(1) saturate(8) hue-rotate(265deg)",  flavor: "The final guardian. 10% body fat or nothing." };
  }, [weight]);

  const hpRemaining = Math.max(0, weight - encounter.target);
  const maxEnemyHp = weight > 220 ? 20 : weight > 212 ? 12 : weight > 207 ? 10 : weight > 200 ? 15 : 20;
  const enemyHpPct = Math.max(5, (hpRemaining / maxEnemyHp) * 100);

  const radarData = [
    { stat: "STR ⚔️", value: attrs.STR, fullMark: 100 },
    { stat: "END 🛡️", value: attrs.END, fullMark: 100 },
    { stat: "WIS 📖", value: attrs.WIS, fullMark: 100 },
    { stat: "INT 🧠", value: attrs.INT, fullMark: 100 },
    { stat: "CON 💪", value: attrs.CON, fullMark: 100 },
    { stat: "VIT ❤️", value: attrs.VIT, fullMark: 100 },
  ];

  const journeyData = [
    { month: "Mar 23", weight: 385 }, { month: "Jun 23", weight: 355 },
    { month: "Sep 23", weight: 330 }, { month: "Dec 23", weight: 305 },
    { month: "Mar 24", weight: 280 }, { month: "Jun 24", weight: 260 },
    { month: "Sep 24", weight: 245 }, { month: "Dec 24", weight: 232 },
    { month: "Mar 25", weight: 225 }, { month: "Jun 25", weight: 228 },
    { month: "Sep 25", weight: 222 }, { month: "Dec 25", weight: 218 },
    { month: "Now", weight }, { month: "Jun 26", weight: 200 },
    { month: "Oct 26", weight: 185 },
  ];

  // Best gear per slot
  const equippedGear = useMemo(() => {
    const eq = {};
    const rarityOrder = ["Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"];
    GEAR_SLOTS.forEach(s => {
      const candidates = gear.filter(g => g.slot === s.slot && g.earned);
      candidates.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
      eq[s.slot] = candidates[0] || null;
    });
    return eq;
  }, [gear]);

  const armorRating = useMemo(() => {
    let total = 0;
    Object.values(equippedGear).forEach(g => {
      if (!g) return;
      for (const m of (g.bonus || "").matchAll(/\+(\d+)/g)) total += parseInt(m[1]);
    });
    return total;
  }, [equippedGear]);

  const weightTrend = useMemo(() => {
    if (weightHistory.length < 2) return [];
    return weightHistory.map((entry, i) => {
      const win = weightHistory.slice(Math.max(0, i - 6), i + 1);
      const avg = win.reduce((s, e) => s + e.weight, 0) / win.length;
      return { ...entry, avg: Math.round(avg * 10) / 10 };
    });
  }, [weightHistory]);

  const weeklyDeficit = useMemo(() => {
    const recent = macroHistory.slice(0, 7);
    if (!recent.length || !settings.tdee) return null;
    const totalCals = recent.reduce((s, d) => s + (d.cals || 0), 0);
    const deficit = settings.tdee * recent.length - totalCals;
    return { deficit: Math.round(deficit), days: recent.length, lbsLostEst: (deficit / 3500).toFixed(2) };
  }, [macroHistory, settings.tdee]);

  // ── ACTIONS ────────────────────────────────────────────────
  const castSpell = useCallback((spell) => {
    if (mana < spell.cost) {
      addLog("detriment", `❌ Insufficient MANA for ${spell.name}! Need ${spell.cost}, have ${mana}.`);
      return;
    }
    setMana(prev => prev - spell.cost);
    if (spell.type === "heal") {
      setHp(prev => Math.min(100, prev + 30));
      addLog("buff", `✨ CAST: ${spell.name}! HP restored by 30.`);
    } else {
      setActiveBuffs(prev => [...prev, { ...spell, ts: Date.now() }]);
      addLog("buff", `✨ CAST: ${spell.name}! ${spell.desc}`);
    }
    addToast("buff", `✨ ${spell.name} cast! ${spell.desc}`);
    if (settings.soundEnabled) playSounds.spellCast();
  }, [mana, addLog, addToast, settings.soundEnabled]);

  const toggleQuest = useCallback((id) => {
    setDailyQuests(prev => prev.map(q => {
      if (q.id !== id) return q;
      const newDone = !q.done;
      if (newDone) {
        addLog("combat", `✅ Quest Complete: ${q.name} (+${q.xp} ${q.stat} XP)`);
        setMana(m => Math.min(maxMana, m + 3));
        addToast("buff", `✅ ${q.name} complete! +${q.xp} ${q.stat} XP`);
        spawnPopup(`+${q.xp} ${q.stat} XP`, STAT_COLORS[q.stat] || "#e2b714");
        // Boss quest completion → Gold loot chest
        if (q.type === "boss") {
          const lootItem = INIT_GEAR.find(g => g.rarity === "Legendary" && !g.earned) || INIT_GEAR.find(g => g.rarity === "Epic" && !g.earned) || INIT_GEAR[0];
          setPendingLootChest({ tier: "gold", item: lootItem });
          addLog("buff", `👑 BOSS QUEST COMPLETE! Gold loot chest unlocked!`);
        }
      }
      return { ...q, done: newDone };
    }));
  }, [addLog, maxMana, addToast, spawnPopup]);

  const submitDailyLog = useCallback(() => {
    const w = parseFloat(dailyWeight);
    const p = parseFloat(dailyProtein);
    const c = parseFloat(dailyCals);
    const sl = parseFloat(dailySleep);
    const st = parseFloat(dailySteps);
    const entries = [];

    if (!isNaN(w) && w > 0) {
      const diff = weight - w;
      const prevW = weight;
      setWeight(w);
      // Push to weight history
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
      setWeightHistory(prev => {
        const filtered = prev.filter(e => e.date !== todayStr);
        return [...filtered, { date: todayStr, weight: w }].sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
      });
      // Prestige trigger at 200 lbs
      if (!prestigeUnlocked && w <= 200) {
        setPrestigeUnlocked(true);
        setShowPrestigeOverlay(true);
        setGear(prev => prev.map(g => g.prestige ? { ...g, earned: true } : g));
        addLog("buff", "👑 IRON SOVEREIGN PRESTIGE ACHIEVED! Sovereign gear unlocked!");
        if (settings.soundEnabled) playSounds.levelUp();
      }
      if (diff > 0) {
        addLog("combat", `⚔️ Weight logged: ${w} lbs (−${diff.toFixed(1)} lbs damage to enemy!)`);
        setHp(prev => Math.min(100, prev + Math.round(diff * 3)));
        // Boss defeat detection — check if weight crossed a threshold downward
        const bossThresholds = [
          { target: 220, tier: "bronze", itemName: "Deadlift Devastator" },
          { target: 212, tier: "silver", itemName: "Midnight Plate" },
          { target: 207, tier: "silver", itemName: "Endurance Treads" },
          { target: 200, tier: "gold",   itemName: "Arcane Greatsword" },
        ];
        for (const b of bossThresholds) {
          if (prevW > b.target && w <= b.target) {
            setGear(prev => prev.map(g => g.name === b.itemName ? { ...g, earned: true } : g));
            setPendingLootChest({ tier: b.tier, item: INIT_GEAR.find(g => g.name === b.itemName) || INIT_GEAR[0] });
            addLog("buff", `🎁 BOSS DEFEATED! Loot chest dropped — ${b.tier.toUpperCase()} CACHE!`);
            addToast("achievement", `🎁 Boss defeated! Loot chest incoming!`);
            break;
          }
        }
      } else if (diff < 0) {
        addLog("detriment", `⚠️ Weight logged: ${w} lbs (+${Math.abs(diff).toFixed(1)} lbs — enemy healed)`);
        setHp(prev => Math.max(0, prev - 5));
      }
      entries.push(`Weight: ${w}`);
    }

    if (!isNaN(p) && p > 0) {
      if (p >= 200) {
        addLog("buff", `🥩 Protein: ${p.toFixed(0)}g — TARGET HIT! WIS +2, Streak advances.`);
        setStreaks(prev => ({ ...prev, protein: prev.protein + 1 }));
        setMana(m => Math.min(maxMana, m + 5));
        if (activeBuffs.find(b=>b.type==="wis_buff")) { setActiveBuffs(p=>p.filter(b=>b.type!=="wis_buff")); addLog("buff","🔮 Deep Focus: WIS sharpened by precision nutrition!"); }
      } else if (p >= 180) {
        addLog("system", `🥩 Protein: ${p.toFixed(0)}g — Close! ${(200 - p).toFixed(0)}g short.`);
      } else {
        addLog("detriment", `⚠️ Protein: ${p.toFixed(0)}g — MISSED. HP −10`);
          const dmgA = activeBuffs.find(b => b.type === "dmg_reduce");
          if (dmgA) { setActiveBuffs(p => p.filter(b => b.type !== "dmg_reduce")); addLog("buff", "⚜️ Iron Aegis absorbed 50% damage!"); }
          setHp(prev => Math.max(0, prev - (dmgA ? 5 : 10)));
      }
      entries.push(`Protein: ${p.toFixed(0)}g`);
    }

    if (!isNaN(c) && c > 0) {
      const target = currentPhase.cal;
      const diff = Math.abs(c - target);
      const pct = (diff / target) * 100;
      if (pct <= 5) {
        addLog("buff", `🎯 Calories: ${c.toFixed(0)} kcal — Within 5% of ${target} target!`);
        setStreaks(prev => ({ ...prev, cals: (prev.cals || 0) + 1 }));
      } else if (c > target) {
        const hasShield = activeBuffs.some(b => b.type === "cal_shield");
        if (hasShield) {
          addLog("buff", `🛡️ Metabolic Shield absorbed calorie overshoot! ${c.toFixed(0)} kcal logged.`);
          setActiveBuffs(prev => prev.filter(b => b.type !== "cal_shield"));
          setStreaks(prev => ({ ...prev, cals: 0 }));
        } else {
          addLog("detriment", `⚠️ Calories: ${c.toFixed(0)} kcal — Over target by ${(c - target).toFixed(0)}. HP −5`);
          const dmgB = activeBuffs.find(b => b.type === "dmg_reduce");
          if (dmgB) { setActiveBuffs(p => p.filter(b => b.type !== "dmg_reduce")); addLog("buff", "⚜️ Iron Aegis absorbed 50% damage!"); }
          setHp(prev => Math.max(0, prev - (dmgB ? 3 : 5)));
          setStreaks(prev => ({ ...prev, cals: 0 }));
        }
      } else {
        addLog("system", `📊 Calories: ${c.toFixed(0)} kcal — Under target by ${(target - c).toFixed(0)}.`);
      }
      entries.push(`Calories: ${c.toFixed(0)}`);
    }

    if (!isNaN(sl) && sl > 0) {
      if (sl >= 7.5) {
        addLog("buff", `😴 Sleep: ${sl.toFixed(1)}h — Quality rest! MANA +15, VIT +1`);
        setMana(m => Math.min(maxMana, m + 15));
        setStreaks(prev => ({ ...prev, sleep: (prev.sleep || 0) + 1 }));
      } else if (sl >= 6) {
        addLog("system", `😴 Sleep: ${sl.toFixed(1)}h — Adequate. MANA +5`);
        setMana(m => Math.min(maxMana, m + 5));
      } else {
        addLog("detriment", `⚠️ Sleep: ${sl.toFixed(1)}h — Poor recovery. HP −5`);
          const dmgC = activeBuffs.find(b => b.type === "dmg_reduce");
          if (dmgC) { setActiveBuffs(p => p.filter(b => b.type !== "dmg_reduce")); addLog("buff", "⚜️ Iron Aegis absorbed 50% damage!"); }
          setHp(prev => Math.max(0, prev - (dmgC ? 3 : 5)));
        setStreaks(prev => ({ ...prev, sleep: 0 }));
      }
      entries.push(`Sleep: ${sl.toFixed(1)}h`);
    }

    if (!isNaN(st) && st > 0) {
      if (st >= 10000) {
        addLog("buff", `🚶 Steps: ${st.toLocaleString()} — 10K target smashed!`);
        setStreaks(prev => ({ ...prev, steps: (prev.steps || 0) + 1 }));
        if (activeBuffs.find(b=>b.type==="end_buff")) { setActiveBuffs(p=>p.filter(b=>b.type!=="end_buff")); addLog("buff","💨 Momentum: END surge from step goal!"); }
      } else {
        addLog("system", `🚶 Steps: ${st.toLocaleString()} — ${(10000 - st).toLocaleString()} to 10K`);
        setStreaks(prev => ({ ...prev, steps: 0 }));
      }
      entries.push(`Steps: ${st.toLocaleString()}`);
    }

    if (dailyWorkedOut) {
      addLog("combat", `💪 Workout logged! STR +3, Workout streak advances.`);
      setStreaks(prev => ({ ...prev, workout: prev.workout + 1 }));
      if (activeBuffs.find(b=>b.type==="str_buff")) { setActiveBuffs(p=>p.filter(b=>b.type!=="str_buff")); setMana(p=>Math.min(maxMana,p+20)); addLog("buff","🔥 Anabolic Surge: STR XP bonus activated!"); }
      entries.push("Workout: ✅");
    }

    if (!dailyWorkedOut) {
      setDurability(prev => {
        const next = { ...prev };
        ["weapon", "body"].forEach(slot => {
          const g = equippedGear[slot];
          if (g) next[g.name] = Math.max(0, (prev[g.name] ?? 100) - 10);
        });
        return next;
      });
    }

    // INT check-in — also write to XP ledger
    const intCount = [intBible, intBook, intLang].filter(Boolean).length;
    if (intCount > 0) {
      const digits = `${intBible ? 1 : 0}${intBook ? 1 : 0}${intLang ? 1 : 0}`;
      const intXP = submitManualLog({ bible: intBible, book: intBook, lang: intLang });
      refreshLedger();
      if (intCount === 3) {
        addLog("buff", `📖 INT Trifecta! (${digits}) — +${intXP} INT XP logged, MANA +20`);
        setStreaks(prev => ({ ...prev, trifecta: prev.trifecta + 1 }));
        setMana(m => Math.min(maxMana, m + 20));
      } else {
        addLog("system", `📖 INT Check-in: ${digits} — +${intXP} INT XP logged`);
        setMana(m => Math.min(maxMana, m + intCount * 5));
      }
      entries.push(`INT: ${digits}`);
    }

    // Water goal
    if (dailyWater >= (settings.waterTarget || 8)) {
      setMana(p => Math.min(maxMana, p + 10));
      addLog("buff", `💧 Hydration goal met (${dailyWater} glasses) — +10 MANA`);
    } else if (dailyWater > 0) {
      addLog("system", `💧 Water logged: ${dailyWater}/${settings.waterTarget || 8} glasses`);
    }

    if (entries.length > 0) {
      setNutritionLog(prev => [{ date: new Date().toLocaleDateString(), entries }, ...prev].slice(0, 30));
      addLog("system", `📋 Daily log submitted: ${entries.length} entries recorded.`);
      addToast("system", `📋 Daily log: ${entries.slice(0, 3).join(" · ")}${entries.length > 3 ? " ..." : ""}`);
    }

    // Check death
    if (hp <= 0) setIsDead(true);

    setFlavorIdx(prev => prev + 1);
    if (dailyProtein || dailyCals) {
      const d = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" });
      setMacroHistory(prev => [{ date:d, protein:parseInt(dailyProtein)||0, cals:parseInt(dailyCals)||0 }, ...prev].slice(0,14));
    }

    setActiveDebuffs([]);
    setDailyWater(0);
    localStorage.setItem("iron_sovereign_last_submit", new Date().toISOString());

    // Reset form
    setDailyWeight(""); setDailyProtein(""); setDailyCals("");
    setDailySleep(""); setDailySteps(""); setDailyWorkedOut(false);
    setIntBible(false); setIntBook(false); setIntLang(false);
    setShowDailyLog(false);
  }, [dailyWeight, dailyProtein, dailyCals, dailySleep, dailySteps, dailyWorkedOut, intBible, intBook, intLang, weight, currentPhase, activeBuffs, hp, addLog, maxMana, addToast, dailyWater, settings.waterTarget, prestigeUnlocked, equippedGear]);

  // ── CSV Import Handler ─────────────────────────────────────
  const processFile = useCallback((source, file) => {
    if (!file) return;
    setImportLoading(prev => ({ ...prev, [source]: true }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSVRows(ev.target.result);
        setImportedData(prev => ({ ...prev, [source]: rows }));
        setImports(prev => ({ ...prev, [source]: { status: "success", rows: rows.length, lastSync: new Date().toLocaleString() } }));

        // ── Run XP Engine (idempotent, three-state day model) ──
        const phaseConfig = { calorieTarget: currentPhase.cal, proteinTarget: 200 };
        const receipt = processImport(source, rows, phaseConfig);
        setImportReceipt(receipt);
        refreshLedger();

        // Battle log summary + toast + XP popups
        addLog("system", `📥 ${source.toUpperCase()}: ${rows.length.toLocaleString()} rows → +${receipt.totalXP} XP (${receipt.newDaysProcessed} new days, ${receipt.daysSkippedFinalized} locked)`);
        addToast("xp", `📥 ${source.toUpperCase()}: +${receipt.totalXP} XP from ${receipt.newDaysProcessed} new days`);
        if (receipt.xpByStat) {
          Object.entries(receipt.xpByStat).forEach(([stat, xp]) => {
            if (xp > 0) spawnPopup(`+${xp} ${stat} XP`, STAT_COLORS[stat] || "#e2b714");
          });
        }

        // Auto-extract display stats from source data
        if (source === "cronometer" && rows.length > 0) {
          const proteins = rows.map(r => parseFloat(r["Protein (g)"])).filter(v => !isNaN(v));
          const cals = rows.map(r => parseFloat(r["Energy (kcal)"])).filter(v => !isNaN(v));
          if (proteins.length) {
            const avg = Math.round(proteins.reduce((a, b) => a + b, 0) / proteins.length);
            setProteinAvg(avg);
            addLog("buff", `📊 Cronometer: ${avg}g avg protein over ${proteins.length} days.`);
          }
          if (cals.length) {
            const avg = Math.round(cals.reduce((a, b) => a + b, 0) / cals.length);
            addLog("system", `📊 Cronometer: ${avg} kcal avg over ${cals.length} days.`);
          }
        }

        if (source === "liftosaur" && rows.length > 0) {
          setTotalSets(rows.length);
          addLog("combat", `⚔️ Liftosaur: ${rows.length.toLocaleString()} sets imported.`);
        }

        if (source === "renpho" && rows.length > 0) {
          const last = rows[rows.length - 1];
          const w = parseFloat(last["Weight(lb)"] || last["Weight"] || last["weight"]);
          const bf = parseFloat(last["Body Fat(%)"] || last["Body Fat"] || last["bodyfat"]);
          const lm = parseFloat(last["Lean Mass(lb)"] || last["Lean Mass"] || last["muscle"]);
          if (!isNaN(w)) { setWeight(Math.round(w * 10) / 10); addLog("combat", `⚖️ Renpho: Weight ${w.toFixed(1)} lbs`); }
          if (!isNaN(bf)) {
            setBodyFat(Math.round(bf * 10) / 10);
            setBfHistory(prev => [...prev, {
              date: new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" }),
              bf: Math.round(bf * 10) / 10
            }].slice(-12));
          }
          if (!isNaN(lm)) { setLeanMass(Math.round(lm * 10) / 10); }
          // Weigh-in streak
          setStreaks(prev => ({ ...prev, weigh: (prev.weigh || 0) + 1 }));
          // Populate weight history from renpho data
          const renphoMap = parseRenpho(rows);
          const newWEntries = [];
          for (const [dateStr, m] of renphoMap) {
            if (m.weightLbs) newWEntries.push({ date: dateStr, weight: Math.round(m.weightLbs * 10) / 10 });
          }
          if (newWEntries.length) {
            setWeightHistory(prev => {
              const merged = [...prev, ...newWEntries]
                .sort((a, b) => a.date.localeCompare(b.date))
                .filter((e, i, arr) => i === 0 || e.date !== arr[i - 1].date);
              return merged.slice(-90);
            });
            addLog("buff", `📈 Weight history updated: ${newWEntries.length} days added.`);
          }
        }

        if (source === "fitbit" && rows.length > 0) {
          const hdrs = Object.keys(rows[0] || {});
          const isAppleHealth = hdrs.some(h =>
            h.toLowerCase().includes('active calorie') || h.toLowerCase().includes('exercise minute')
          );
          if (isAppleHealth) {
            const stepsCol = hdrs.find(h => h.toLowerCase().includes('steps'));
            const sleepCol  = hdrs.find(h => h.toLowerCase().includes('sleep'));
            const cleanNum = v => parseFloat((v || '').toString().replace(/,/g, '').trim()) || 0;
            const parseSleepH = v => {
              const m = (v || '').toString().match(/(?:(\d+)h\s*)?(?:(\d+)m)?/);
              if (!m || (!m[1] && !m[2])) return 0;
              return parseInt(m[1] || 0) + parseInt(m[2] || 0) / 60;
            };
            const stepVals  = stepsCol ? rows.map(r => cleanNum(r[stepsCol])).filter(v => v > 0) : [];
            const sleepVals = sleepCol  ? rows.map(r => parseSleepH(r[sleepCol])).filter(v => v > 0) : [];
            if (stepVals.length) {
              const avgSteps = Math.round(stepVals.reduce((a, b) => a + b, 0) / stepVals.length);
              addLog("buff", `🍎 Apple Health: avg ${avgSteps.toLocaleString()} steps/day over ${stepVals.length} days.`);
            }
            if (sleepVals.length) {
              const avgSleep = (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1);
              addLog("buff", `🍎 Apple Health: avg ${avgSleep}h sleep/night over ${sleepVals.length} nights.`);
            }
          }
        }
      } catch (err) {
        setImports(prev => ({ ...prev, [source]: { status: "error", rows: 0, lastSync: null } }));
        addLog("detriment", `❌ ${source.toUpperCase()} import failed: ${err.message}`);
      } finally {
        setImportLoading(prev => ({ ...prev, [source]: false }));
      }
    };
    reader.readAsText(file);
  }, [addLog, currentPhase, refreshLedger, addToast, spawnPopup]);

  const handleFileImport = useCallback((source, e) => {
    const file = e.target.files[0];
    processFile(source, file);
  }, [processFile]);

  // ── Hub Global Drop (auto-detects source from CSV header) ──
  const handleHubDragOver = useCallback((e) => {
    e.preventDefault();
    setHubDragActive(true);
  }, []);

  const handleHubDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setHubDragActive(false);
    }
  }, []);

  const handleHubDrop = useCallback((e) => {
    e.preventDefault();
    setHubDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      // Read first 500 bytes to detect source from column headers
      const slice = file.slice(0, 500);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const header = ev.target.result.toLowerCase();
        let src = null;
        if (header.includes("energy") && header.includes("protein")) src = "cronometer";
        else if (header.includes("weight(lb)") || header.includes("body fat(%)")) src = "renpho";
        else if (header.includes("exercise name") || header.includes("set order")) src = "liftosaur";
        else if (header.includes("steps") || header.includes("heart rate")) src = "fitbit";
        if (src) processFile(src, file);
        else addLog("detriment", `❌ Cannot identify CSV source for: ${file.name}`);
      };
      reader.readAsText(slice);
    });
  }, [processFile, addLog]);

  // ── Inject global animations + responsive styles once ───────
  useEffect(() => { injectGlobalAnimations(); injectResponsiveStyles(); }, []);

  // ── Mobile resize listener ──────────────────────────────────
  useEffect(() => {
    const _mq = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", _mq);
    return () => window.removeEventListener("resize", _mq);
  }, []);

  // ── PWA install prompt capture ─────────────────────────────
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── LAN IP for phone access (written by launch.sh on each start) ───
  useEffect(() => {
    fetch("/lan-access.json")
      .then(r => r.json())
      .then(d => { if (d.url) setLanUrl(d.url); })
      .catch(() => {});
  }, []);

  // ── Level-up detection ─────────────────────────────────────
  useEffect(() => {
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      setShowLevelUp(true);
      setConfettiTrigger(t => t + 1);
      if (settings.soundEnabled) playSounds.levelUp();
      addToast("achievement", `⬆️ LEVEL UP! Now Level ${level} — ${classInfo.evolve[evoStage]}`);
      addLog("buff", `⬆️ LEVEL UP! Now Level ${level} — ${classInfo.evolve[evoStage]}`);
    }
    prevLevelRef.current = level;
  }, [level]); // eslint-disable-line

  // ── Quest persistence sync ─────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem("iron_sovereign_daily_quests", JSON.stringify(dailyQuests)); } catch {}
  }, [dailyQuests]);

  // ── Quest auto-reset (daily each day, weekly every 7 days) ─
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const lastDaily = localStorage.getItem("iron_sovereign_daily_quest_reset");
    const lastWeekly = localStorage.getItem("iron_sovereign_weekly_quest_reset");
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weeklyExpired = !lastWeekly || Date.now() - new Date(lastWeekly).getTime() > weekMs;
    setDailyQuests(prev => {
      // Migrate: add type field to legacy quests lacking it
      let next = prev.map(q => ({
        ...q,
        type: q.type || (q.id.startsWith("qw") ? "weekly" : q.id.startsWith("qb") ? "boss" : "daily"),
      }));
      if (lastDaily !== todayStr) {
        next = next.map(q => (!q.type || q.type === "daily") ? { ...q, done: false } : q);
        localStorage.setItem("iron_sovereign_daily_quest_reset", todayStr);
      }
      if (weeklyExpired) {
        next = next.map(q => q.type === "weekly" ? { ...q, done: false } : q);
        localStorage.setItem("iron_sovereign_weekly_quest_reset", new Date().toISOString());
      }
      return next;
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    const dailies = dailyQuests.filter(q => (q.type||"daily") === "daily");
    const allDone = dailies.length > 0 && dailies.every(q => q.done);
    if (allDone && !allDailiesDoneRef.current) {
      allDailiesDoneRef.current = true;
      setConfettiTrigger(t => t + 1);
      addLog("buff", "🏆 ALL DAILY QUESTS COMPLETE — Maximum discipline achieved!");
      if (settings.soundEnabled) playSounds.allDailiesComplete();
    } else if (!allDone) { allDailiesDoneRef.current = false; }
  }, [dailyQuests]); // eslint-disable-line

  useEffect(() => { localStorage.setItem("iron_sovereign_prs", JSON.stringify(prs)); }, [prs]);
  useEffect(() => { localStorage.setItem("iron_sovereign_chain_quests", JSON.stringify(chainProgress)); }, [chainProgress]);

  // Debuff check when streaks change
  useEffect(() => {
    const lastSubmit = localStorage.getItem("iron_sovereign_last_submit");
    if (!lastSubmit) return;
    const daysSince = Math.floor((Date.now() - new Date(lastSubmit).getTime()) / 86400000);
    if (daysSince < 2) { setActiveDebuffs([]); return; }
    const debuffs = [];
    if (!(streaks.workout)) debuffs.push(DEBUFF_TYPES.atrophy);
    if (!(streaks.protein)) debuffs.push(DEBUFF_TYPES.malnourished);
    if (!(streaks.sleep))   debuffs.push(DEBUFF_TYPES.exhausted);
    setActiveDebuffs(debuffs);
  }, [streaks]); // eslint-disable-line

  useEffect(() => { localStorage.setItem("iron_sovereign_weight_history", JSON.stringify(weightHistory)); }, [weightHistory]);
  useEffect(() => { localStorage.setItem("iron_sovereign_durability", JSON.stringify(durability)); }, [durability]);
  useEffect(() => { localStorage.setItem("iron_sovereign_prestige", JSON.stringify(prestigeUnlocked)); }, [prestigeUnlocked]);
  useEffect(() => { localStorage.setItem("iron_sovereign_raid_quests", JSON.stringify(raidQuests)); }, [raidQuests]);

  useEffect(() => {
    const lastReset = localStorage.getItem("iron_sovereign_weekly_quest_reset");
    if (!lastReset) return;
    const elapsed = Date.now() - new Date(lastReset).getTime();
    if (elapsed >= 7 * 86400000) setRaidQuests(RAID_DEFAULTS);
  }, []); // eslint-disable-line

  // ── Install handler ────────────────────────────────────────
  const handleInstallApp = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setShowInstallBanner(false);
      localStorage.setItem("iron_sovereign_pwa_dismissed", "1");
      addLog("system", "📱 Iron Sovereign installed as app!");
      addToast("system", "📱 Iron Sovereign installed!");
    }
  }, [installPrompt, addLog, addToast]);

  const handleEditStat = useCallback((key, val) => {
    const v = parseInt(val);
    if (!isNaN(v) && v >= 0 && v <= 100) {
      setAttrs(prev => ({ ...prev, [key]: v }));
    }
    setEditingStat(null);
  }, []);

  // ── Tabs ───────────────────────────────────────────────────
  const tabs = [
    { id: "battle", label: "⚔️ Battle" },
    { id: "character", label: "📊 Character" },
    { id: "gear", label: "🎒 Armory" },
    { id: "quests", label: "📜 Quests" },
    { id: "spellbook", label: "✨ Spells" },
    { id: "journey", label: "🗺️ Journey" },
    { id: "hub", label: "⚙️ Command Hub" },
    { id: "log", label: "⚡ Log Workout" },
  ];

  // ═══════════════════════════════════════════════════════════
  // DEATH SCREEN
  // ═══════════════════════════════════════════════════════════
  if (isDead) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", padding: 20 }}>
        <div style={{ maxWidth: 480, textAlign: "center", background: "linear-gradient(135deg, #1a0000, #200505)", border: "2px solid #dc2626", borderRadius: 32, padding: 48, boxShadow: "0 0 120px rgba(220,38,38,0.2)" }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>💀</div>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>METABOLIC COLLAPSE</h1>
          <p style={{ color: "#dc2626", fontSize: 11, textTransform: "uppercase", letterSpacing: 4, marginBottom: 24 }}>System Failure Detected</p>
          <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, marginBottom: 32, fontStyle: "italic" }}>
            "Dr. Hyman detects severe systemic burnout. The protein mandate was ignored too many times. Your metabolic furnace has gone cold."
          </p>
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 16, padding: 20, marginBottom: 32, textAlign: "left" }}>
            <p style={{ color: "#dc2626", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>Recovery Protocol Required</p>
            <div style={{ color: "#d1d5db", fontSize: 13, lineHeight: 2 }}>
              <div>• 7 consecutive days hitting 200g protein</div>
              <div>• Calories within ±10% of target for 5 days</div>
              <div>• 8 hours sleep for 3 consecutive nights</div>
            </div>
          </div>
          <button onClick={() => { setHp(60); setIsDead(false); setMana(prev => Math.max(0, prev - 40)); addLog("system", "💀 System Reset initiated. HP restored to 60. −40 MANA penalty."); }}
            style={{ ...S.btn, width: "100%", padding: "16px 0", background: "#dc2626", color: "#fff", fontSize: 14 }}>
            Initiate System Reset (−40 MANA)
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#06080f", color: "#e5e7eb", fontFamily: "'Courier New', monospace" }}>

      {/* ── IMPORT RECEIPT MODAL ─────────────────────────── */}
      <ImportReceipt receipt={importReceipt} onClose={() => setImportReceipt(null)} />

      {/* ── ANIMATED OVERLAYS (Phase 5) ──────────────────── */}
      <XPPopup popups={popups} />
      <LevelUpOverlay
        show={showLevelUp}
        level={level}
        className={classInfo.evolve[evoStage]}
        onDismiss={() => setShowLevelUp(false)}
      />
      <Confetti trigger={confettiTrigger} />
      {pendingLootChest && (
        <LootChest
          chest={pendingLootChest}
          onClose={() => {
            addLog("buff", `🎁 Loot claimed: ${pendingLootChest.item?.name} (${pendingLootChest.item?.rarity}) equipped!`);
            if (settings.soundEnabled) playSounds.lootDrop(); setPendingLootChest(null);
          }}
        />
      )}
      {showPrestigeOverlay && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", zIndex:9999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Courier New',monospace", padding:24 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>👑</div>
          <div style={{ fontSize:20, fontWeight:900, color:"#e2b714", letterSpacing:4, textTransform:"uppercase", marginBottom:8 }}>IRON SOVEREIGN</div>
          <div style={{ fontSize:13, color:"#c9d1d9", marginBottom:6 }}>PRESTIGE ACHIEVED</div>
          <div style={{ fontSize:11, color:"#6b7280", marginBottom:24, textAlign:"center", maxWidth:300, lineHeight:1.6 }}>
            You broke the 200lb wall. Three Sovereign items have been added to your armory.
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap", justifyContent:"center" }}>
            {["Sovereign's Blade","Crown of the Sovereign","Signet of Sovereignty"].map(n => (
              <div key={n} style={{ padding:"6px 12px", background:"rgba(226,183,20,0.1)", border:"1px solid rgba(226,183,20,0.4)", borderRadius:8, fontSize:10, color:"#e2b714" }}>{n}</div>
            ))}
          </div>
          <button onClick={() => setShowPrestigeOverlay(false)}
            style={{ background:"#e2b714", color:"#0f1320", border:"none", fontFamily:"'Courier New',monospace", fontWeight:900, fontSize:14, padding:"12px 32px", borderRadius:6, cursor:"pointer", letterSpacing:2 }}>
            CLAIM YOUR CROWN
          </button>
        </div>
      )}

      {/* ── PWA INSTALL BANNER (Phase 2) ─────────────────── */}
      {showInstallBanner && installPrompt && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#0f1320", border: "1px solid rgba(226,183,20,0.3)", borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, zIndex: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", fontFamily: "'Courier New', monospace", whiteSpace: isMobile ? "normal" : "nowrap", maxWidth: isMobile ? "90vw" : undefined }}>
          <span style={{ fontSize: 24 }}>📱</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>Install Iron Sovereign</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>Add to desktop for quick access</div>
          </div>
          <button onClick={handleInstallApp} style={{ padding: "8px 14px", background: "#e2b714", color: "#000", border: "none", borderRadius: 8, fontWeight: 900, fontSize: 10, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: 1 }}>Install</button>
          <button onClick={() => { setShowInstallBanner(false); localStorage.setItem("iron_sovereign_pwa_dismissed", "1"); }} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
      )}

      {/* ── TOP HUD BAR ──────────────────────────────────── */}
      <div style={{ background: "linear-gradient(180deg, #0c1019, #06080f)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #e2b714, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#000", position: "relative" }}>
              M
              <div style={{ position: "absolute", top: -6, right: -6, background: "#3b82f6", color: "#fff", fontSize: 9, fontWeight: 900, padding: "2px 5px", borderRadius: 6, border: "2px solid #06080f" }}>{level}</div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>MARCEL</div>
              <div style={{ fontSize: 10, color: "#e2b714", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                {classInfo.icon} {classInfo.evolve[evoStage]} • {tier.name}
              </div>
            </div>
          </div>

          {/* HP + MANA + Phase */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 130 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 900, color: "#ef4444", marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 }}>
                <span>❤️ HP</span><span>{hp}/100</span>
              </div>
              <div style={{ height: 6, background: "#1f2937", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${hp}%`, background: hp > 50 ? "linear-gradient(90deg, #22c55e, #16a34a)" : hp > 25 ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #ef4444, #dc2626)", borderRadius: 4, transition: "width 0.5s" }} />
              </div>
            </div>
            <div style={{ width: 130 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 900, color: "#60a5fa", marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 }}>
                <span>⚡ MANA</span><span>{mana}/{maxMana}</span>
              </div>
              <div style={{ height: 6, background: "#1f2937", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(mana / maxMana) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #6366f1)", borderRadius: 4, transition: "width 0.5s" }} />
              </div>
            </div>
            {/* Phase selector in HUD */}
            <select value={phase} onChange={e => { setPhase(e.target.value); addLog("system", `⚙️ Phase changed to: ${PHASES.find(p => p.id === e.target.value)?.label}`); }}
              style={{ ...S.select, width: "auto", padding: "4px 8px", fontSize: 9, background: "rgba(0,0,0,0.4)", border: `1px solid ${currentPhase.color}40`, color: currentPhase.color }}>
              {PHASES.map(p => <option key={p.id} value={p.id}>{p.label} ({p.cal} kcal)</option>)}
            </select>
          </div>

          {/* Buffs + Pet + Quick Actions */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {activeBuffs.map(b => (
              <div key={b.ts} title={b.name} style={{ padding: "4px 8px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, fontSize: 14, cursor: "help" }}>{b.icon}</div>
            ))}
            {pets.filter(p => p.earned)[activePet] && (
              <div title={pets.filter(p => p.earned)[activePet]?.name} style={{ padding: "4px 8px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 14 }}>
                {pets.filter(p => p.earned)[activePet]?.icon}
              </div>
            )}
            {/* Daily Log quick button */}
            <button onClick={() => setShowDailyLog(!showDailyLog)} title="Daily Log"
              style={{ ...S.btnSm, background: showDailyLog ? "rgba(226,183,20,0.3)" : "rgba(226,183,20,0.1)", fontSize: 14, padding: "4px 10px", lineHeight: 1 }}>
              📋
            </button>
            {/* Macro Calc */}
            <button onClick={() => setShowMacroCalc(true)} title="Macro Calculator"
              style={{ ...S.btnSm, background: "rgba(168,85,247,0.1)", fontSize: 14, padding: "4px 10px", lineHeight: 1 }}>
              🧮
            </button>
            {/* Notification bell */}
            <button onClick={() => { setShowNotifs(true); markRead(); }} title="Notifications"
              style={{ ...S.btnSm, background: "rgba(59,130,246,0.1)", fontSize: 14, padding: "4px 10px", lineHeight: 1, position: "relative" }}>
              🔔
              {notifCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 8, fontWeight: 900, padding: "1px 4px", borderRadius: 8, border: "2px solid #06080f", lineHeight: 1.4 }}>{notifCount > 99 ? "99+" : notifCount}</span>
              )}
            </button>
            {/* Settings gear */}
            <button onClick={() => setShowSettings(true)} title="Settings"
              style={{ ...S.btnSm, background: "rgba(226,183,20,0.1)", fontSize: 14, padding: "4px 10px", lineHeight: 1 }}>
              ⚙️
            </button>
          </div>

          {/* Power */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#6b7280" }}>Day {dayCount.toLocaleString()} • −{lbsLost} lbs</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: tier.color }}>⚡ {totalPower} POWER</div>
          </div>
        </div>
      </div>

      {/* ── DAILY LOG PANEL (collapsible) ────────────────── */}
      {showDailyLog && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ background: "linear-gradient(135deg, #0f1320, #0c1019)", border: "1px solid rgba(226,183,20,0.15)", borderRadius: "0 0 20px 20px", padding: 20, borderTop: "2px solid #e2b714" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ ...S.sectionTitle, color: "#e2b714", margin: 0 }}>📋 Daily Battle Log</h3>
              <button onClick={() => setShowDailyLog(false)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>⚖️ Weight (lbs)</label>
                <input type="number" step="0.1" placeholder="220.0" value={dailyWeight} onChange={e => setDailyWeight(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>🥩 Protein (g)</label>
                <input type="number" placeholder="200" value={dailyProtein} onChange={e => setDailyProtein(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>🔥 Calories (kcal)</label>
                <input type="number" placeholder={String(currentPhase.cal)} value={dailyCals} onChange={e => setDailyCals(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>😴 Sleep (hrs)</label>
                <input type="number" step="0.1" placeholder="7.5" value={dailySleep} onChange={e => setDailySleep(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>🚶 Steps</label>
                <input type="number" placeholder="10000" value={dailySteps} onChange={e => setDailySteps(e.target.value)} style={S.input} />
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"rgba(6,182,212,0.04)", border:"1px solid rgba(6,182,212,0.15)", borderRadius:8, marginBottom:10 }}>
              <span style={{ fontSize:16 }}>💧</span>
              <span style={{ fontSize:11, color:"#9ca3af", flex:1 }}>Water — {settings.waterTarget || 8} glass goal</span>
              <button onClick={() => setDailyWater(p => Math.max(0, p - 1))}
                style={{ background:"#1e2a3a", border:"1px solid #374151", color:"#c9d1d9", width:30, height:30, borderRadius:6, cursor:"pointer", fontFamily:"'Courier New',monospace", fontSize:18, lineHeight:1 }}>−</button>
              <span style={{ fontSize:20, fontWeight:900, color: dailyWater >= (settings.waterTarget || 8) ? "#06b6d4" : "#c9d1d9", minWidth:28, textAlign:"center" }}>{dailyWater}</span>
              <button onClick={() => setDailyWater(p => p + 1)}
                style={{ background:"#1e2a3a", border:"1px solid #374151", color:"#c9d1d9", width:30, height:30, borderRadius:6, cursor:"pointer", fontFamily:"'Courier New',monospace", fontSize:18, lineHeight:1 }}>+</button>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: dailyWorkedOut ? "#22c55e" : "#6b7280" }}>
                <input type="checkbox" checked={dailyWorkedOut} onChange={e => setDailyWorkedOut(e.target.checked)} style={S.checkbox} />
                💪 Worked Out
              </label>
              <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 2 }}>INT Check-in:</span>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: intBible ? "#f59e0b" : "#6b7280" }}>
                <input type="checkbox" checked={intBible} onChange={e => setIntBible(e.target.checked)} style={S.checkbox} />
                📖 Bible
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: intBook ? "#f59e0b" : "#6b7280" }}>
                <input type="checkbox" checked={intBook} onChange={e => setIntBook(e.target.checked)} style={S.checkbox} />
                📚 Book
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: intLang ? "#f59e0b" : "#6b7280" }}>
                <input type="checkbox" checked={intLang} onChange={e => setIntLang(e.target.checked)} style={S.checkbox} />
                🌐 Language
              </label>
              {[intBible, intBook, intLang].filter(Boolean).length === 3 && (
                <span style={{ fontSize: 10, fontWeight: 900, color: "#f59e0b", animation: "pulse 1s infinite" }}>⭐ TRIFECTA!</span>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={submitDailyLog} style={{ ...S.btn, padding: "10px 32px" }}>
                ⚡ Submit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB NAV ──────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#080b14" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", overflowX: "auto", padding: "0 20px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: tab === t.id ? "2px solid #e2b714" : "2px solid transparent", color: tab === t.id ? "#e2b714" : "#6b7280", fontSize: 11, fontWeight: 900, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.2s" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>

        {/* ═══ BATTLE TAB ═══════════════════════════════════ */}
        {tab === "battle" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 20, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Encounter */}
              <div style={{ ...S.card, padding: 32, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0f1320, #0a0d16)" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle, rgba(239,68,68,0.05), transparent)", pointerEvents: "none" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "4px 12px", borderRadius: 20, fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", border: "1px solid rgba(239,68,68,0.2)" }}>{encounter.type}</span>
                  <span style={{ fontSize: 9, color: currentPhase.color, fontFamily: "monospace", fontWeight: 700 }}>{currentPhase.label.toUpperCase().replace(/ /g, "_")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
                  <div style={{ position: "relative", flexShrink: 0, width: 64, height: 64 }}>
                    <div style={{ position: "absolute", inset: -8, background: `radial-gradient(circle, ${encounter.glowColor}55, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />
                    <img src={encounter.svgIcon} width={64} height={64} alt="" style={{ mixBlendMode: "screen", filter: encounter.iconFilter, position: "relative" }} />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: -1, margin: 0 }}>{encounter.name}</h2>
                </div>
                <p style={{ color: "#6b7280", fontSize: 12, fontStyle: "italic", marginBottom: 20, marginTop: 4 }}>"{(ENCOUNTER_FLAVORS[encounter.name] || [encounter.flavor])[flavorIdx % (ENCOUNTER_FLAVORS[encounter.name]?.length || 1)]}"</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 900, marginBottom: 6, textTransform: "uppercase", letterSpacing: 2 }}>
                  <span style={{ color: "#ef4444" }}>Enemy Health</span>
                  <span style={{ color: "#fff" }}>{hpRemaining} lbs to defeat</span>
                </div>
                <div style={{ height: 20, background: "#111827", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", padding: 3 }}>
                  <div style={{ height: "100%", width: `${enemyHpPct}%`, background: "linear-gradient(90deg, #dc2626, #f97316)", borderRadius: 10, transition: "width 1s", boxShadow: "0 0 15px rgba(239,68,68,0.4)", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.15), transparent)", borderRadius: 10 }} />
                  </div>
                </div>
                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
                  {[
                    { label: "Weight", value: `${weight} lbs`, color: "#ef4444", sub: `${bodyFat}% BF` },
                    { label: "Protein", value: `${proteinAvg}g avg`, color: "#a855f7", sub: `Target: 200g` },
                    { label: "Calories", value: `${currentPhase.cal} kcal`, color: "#f59e0b", sub: currentPhase.label },
                  ].map(s => (
                    <div key={s.label} style={S.cardInner}>
                      <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: "#4b5563", marginTop: 2 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak Dashboard */}
              <div style={{ ...S.card, padding: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>🔥 Active Streaks</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)", gap: 8 }}>
                  {[
                    { label: "Workout", value: streaks.workout,  icon: "🏋️" },
                    { label: "Protein", value: streaks.protein,  icon: "🥩" },
                    { label: "Sleep",   value: streaks.sleep || 0, icon: "😴" },
                    { label: "Steps",   value: streaks.steps || 0, icon: "🚶" },
                    { label: "INT",     value: streaks.trifecta, icon: "📖" },
                    { label: "Weigh-in", value: streaks.weigh || 0, icon: "⚖️" },
                  ].map(s => {
                    const v = s.value || 0;
                    const flameColor = v >= 14 ? "#ef4444" : v >= 7 ? "#e2b714" : v >= 3 ? "#22c55e" : "#6b7280";
                    return (
                      <div key={s.label} style={{ background: "#0f1320", border: `1px solid ${flameColor}33`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: flameColor, lineHeight: 1 }}>{v}</div>
                        <div style={{ fontSize: 8, color: "#6b7280", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                        {v >= 3 && <div style={{ fontSize: 8, color: flameColor, marginTop: 2 }}>🔥</div>}
                      </div>
                    );
                  })}
                  <div style={{ background: "#0f1320", border: `1px solid ${"#6b7280"}33`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2, fontFamily: "'Courier New', monospace" }}>Precision</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#e2b714", fontFamily: "'Courier New', monospace" }}>{streaks.cals||0}</div>
                    <div style={{ fontSize: 9, color: "#6b7280", fontFamily: "'Courier New', monospace" }}>🎯 cal streak</div>
                  </div>
                </div>
              </div>
              {activeDebuffs.length > 0 && (
                <div style={{ ...S.card, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.03)", marginTop:10 }}>
                  <div style={{ fontSize:9, color:"#ef4444", fontWeight:900, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>⚠️ ACTIVE DEBUFFS</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {activeDebuffs.map((d, i) => (
                      <div key={i} style={{ padding:"8px 14px", background:"rgba(239,68,68,0.06)", border:`1px solid ${d.color}44`, borderRadius:10, textAlign:"center" }}>
                        <div style={{ fontSize:22 }}>{d.icon}</div>
                        <div style={{ fontSize:10, fontWeight:900, color:d.color, marginTop:2 }}>{d.name}</div>
                        <div style={{ fontSize:9, color:"#6b7280", marginTop:2 }}>{d.desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:9, color:"#6b7280", marginTop:8 }}>Submit daily log to clear all debuffs.</div>
                </div>
              )}
            </div>

            {/* Battle Log */}
            <div style={{ background: "#0a0d16", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, overflow: "hidden", height: isMobile ? undefined : 560, maxHeight: isMobile ? 300 : 560, overflowY: "auto" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 3 }}>⚡ Chronos Log</span>
                <span style={{ fontSize: 9, color: "#374151" }}>{battleLog.length} events</span>
              </div>
              <div style={{ padding: 12, overflowY: "auto", height: "calc(100% - 44px)", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" }}>
                  {["all","combat","buff","system","detriment"].map(f => (
                    <button key={f} onClick={() => setLogFilter(f)}
                      style={{ background: logFilter===f ? "rgba(226,183,20,0.15)" : "none",
                        border:`1px solid ${logFilter===f ? "rgba(226,183,20,0.4)" : "#374151"}`,
                        color: logFilter===f ? "#e2b714" : "#6b7280",
                        fontSize:9, padding:"2px 8px", borderRadius:3, cursor:"pointer",
                        fontFamily:"'Courier New', monospace", fontWeight:logFilter===f?900:400,
                        letterSpacing:1, textTransform:"uppercase" }}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                {battleLog.filter(l => logFilter === "all" || l.type === logFilter).map(l => {
                  const colors = { combat: "#3b82f6", buff: "#22c55e", detriment: "#ef4444", system: "#6b7280" };
                  const c = colors[l.type] || "#6b7280";
                  return (
                    <div key={l.id} style={{ padding: 8, background: `${c}08`, border: `1px solid ${c}20`, borderRadius: 8, fontSize: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.5, marginBottom: 2 }}>
                        <span style={{ color: c, textTransform: "uppercase", letterSpacing: 1, fontSize: 8, fontWeight: 900 }}>{l.type}</span>
                        <span style={{ color: "#4b5563" }}>{l.time}</span>
                      </div>
                      <div style={{ color: c, fontWeight: 700, lineHeight: 1.4 }}>{l.msg}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CHARACTER TAB ════════════════════════════════ */}
        {tab === "character" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            {/* Radar + Editable Stats */}
            <div style={S.card}>
              <h3 style={{ ...S.sectionTitle, marginBottom: 16 }}>Attribute Matrix <span style={{ fontSize: 8, color: "#374151" }}>(click values to edit)</span></h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1f2937" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Stats" dataKey="value" stroke="#e2b714" fill="#e2b714" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
                {Object.entries(attrs).map(([key, val]) => {
                  const colors = { STR: "#ef4444", END: "#22c55e", WIS: "#a855f7", INT: "#06b6d4", CON: "#f59e0b", VIT: "#ec4899" };
                  return (
                    <div key={key} style={{ textAlign: "center", cursor: "pointer" }}
                      onClick={() => setEditingStat(editingStat === key ? null : key)}>
                      <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 900, letterSpacing: 2 }}>{key}</div>
                      {editingStat === key ? (
                        <input type="number" defaultValue={val} autoFocus min={0} max={100}
                          onBlur={e => handleEditStat(key, e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleEditStat(key, e.target.value); }}
                          style={{ ...S.input, width: 60, textAlign: "center", fontSize: 18, fontWeight: 900, padding: 4, margin: "0 auto", display: "block" }}
                          onClick={e => e.stopPropagation()} />
                      ) : (
                        <div style={{ fontSize: 20, fontWeight: 900, color: colors[key] }}>{val}</div>
                      )}
                      <div style={{ height: 3, background: "#1f2937", borderRadius: 2, marginTop: 4 }}>
                        <div style={{ height: "100%", width: `${val}%`, background: colors[key], borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Character sheet + editable metrics */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #e2b714, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: "3px solid #1f2937" }}>
                    {classInfo.icon}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff" }}>MARCEL</h2>
                    <div style={{ fontSize: 11, color: "#e2b714", fontWeight: 700 }}>Level {level} {classInfo.evolve[evoStage]}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{tier.name} Tier • Day {dayCount.toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 900, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                    <span>Level Progress</span><span>{totalPower} / 390 (next tier)</span>
                  </div>
                  <div style={{ height: 8, background: "#1f2937", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, ((totalPower - 330) / (390 - 330)) * 100)}%`, background: "linear-gradient(90deg, #e2b714, #f59e0b)", borderRadius: 6 }} />
                  </div>
                </div>

                {/* Editable key metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {[
                    { label: "Weight", value: weight, unit: " lbs", setter: setWeight, sub: `${bodyFat}% BF` },
                    { label: "Lean Mass", value: leanMass, unit: " lbs", setter: setLeanMass, sub: "Muscle" },
                    { label: "Sets Logged", value: totalSets, unit: "", setter: setTotalSets, sub: "Lifetime" },
                    { label: "Protein Avg", value: proteinAvg, unit: "g", setter: setProteinAvg, sub: "Daily avg" },
                    { label: "RHR", value: rhr, unit: " bpm", setter: setRhr, sub: rhr < 55 ? "Elite" : "Good" },
                    { label: "HRV", value: hrv, unit: " ms", setter: setHrv, sub: hrv > 100 ? "Elite" : "Good" },
                  ].map(m => (
                    <div key={m.label} style={{ ...S.cardInner, cursor: "pointer" }}
                      onClick={() => setEditingStat(editingStat === m.label ? null : m.label)}>
                      <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{m.label}</div>
                      {editingStat === m.label ? (
                        <input type="number" step="0.1" defaultValue={m.value} autoFocus
                          onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) m.setter(v); setEditingStat(null); }}
                          onKeyDown={e => { if (e.key === "Enter") { const v = parseFloat(e.target.value); if (!isNaN(v)) m.setter(v); setEditingStat(null); } }}
                          style={{ ...S.input, fontSize: 16, fontWeight: 900, padding: 4 }}
                          onClick={e => e.stopPropagation()} />
                      ) : (
                        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginTop: 2 }}>{typeof m.value === "number" ? m.value.toLocaleString() : m.value}{m.unit}</div>
                      )}
                      <div style={{ fontSize: 9, color: "#4b5563" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Class evolution */}
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>Class Evolution Path</h3>
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                  {classInfo.evolve.map((name, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 10, fontWeight: 900, background: i <= evoStage ? "rgba(226,183,20,0.15)" : "rgba(0,0,0,0.3)", border: `1px solid ${i <= evoStage ? "rgba(226,183,20,0.3)" : "rgba(255,255,255,0.05)"}`, color: i <= evoStage ? "#e2b714" : "#4b5563" }}>
                        {i === evoStage ? "▶ " : ""}{name}
                      </div>
                      {i < classInfo.evolve.length - 1 && <span style={{ color: "#374151", fontSize: 10 }}>→</span>}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, padding:"10px 16px", background:"rgba(226,183,20,0.06)", border:"1px solid rgba(226,183,20,0.15)", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"#6b7280", textTransform:"uppercase", letterSpacing:2, fontFamily:"'Courier New', monospace" }}>⚔️ Gear Power</span>
                  <span style={{ fontSize:22, fontWeight:900, color:"#e2b714", fontFamily:"'Courier New', monospace" }}>{armorRating}<span style={{ fontSize:9, color:"#6b7280", marginLeft:4 }}>pts</span></span>
                </div>
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:9, color:"#e2b714", fontWeight:900, letterSpacing:3, textTransform:"uppercase", marginBottom:8, fontFamily:"'Courier New', monospace" }}>🏆 Personal Records</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                    {[
                      { key:"bench",    label:"Bench",    unit:"lbs", def:225 },
                      { key:"squat",    label:"Squat",    unit:"lbs", def:225 },
                      { key:"deadlift", label:"Deadlift", unit:"lbs", def:315 },
                      { key:"ohp",      label:"OHP",      unit:"lbs", def:115 },
                      { key:"pullups",  label:"Pull-ups", unit:"reps", def:15 },
                      { key:"steps",    label:"Step PR",  unit:"k",   def:18 },
                    ].map(pr => (
                      <div key={pr.key} onClick={() => setEditingPr(editingPr===pr.key ? null : pr.key)}
                        style={{ padding:"8px 10px", background:"rgba(0,0,0,0.3)", borderRadius:8, cursor:"pointer",
                          border:`1px solid ${editingPr===pr.key ? "rgba(226,183,20,0.4)" : "rgba(255,255,255,0.04)"}`,
                          fontFamily:"'Courier New', monospace" }}>
                        <div style={{ fontSize:8, color:"#6b7280", textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>{pr.label}</div>
                        {editingPr === pr.key ? (
                          <input type="number" autoFocus defaultValue={prs[pr.key]||pr.def}
                            onBlur={e => { setPrs(p=>({ ...p, [pr.key]: parseInt(e.target.value)||pr.def })); setEditingPr(null); }}
                            onKeyDown={e => { if(["Enter","Escape"].includes(e.key)) e.target.blur(); }}
                            style={{ width:"100%", background:"transparent", border:"none", color:"#e2b714", fontFamily:"'Courier New', monospace", fontSize:16, fontWeight:900, outline:"none" }} />
                        ) : (
                          <div style={{ fontSize:16, fontWeight:900, color:"#fff" }}>{prs[pr.key]||pr.def}<span style={{ fontSize:8, color:"#6b7280", marginLeft:2 }}>{pr.unit}</span></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {prestigeUnlocked && (
                  <div style={{ marginTop:12, padding:"10px 16px", background:"linear-gradient(135deg,rgba(226,183,20,0.1),rgba(239,68,68,0.06))", border:"1px solid rgba(226,183,20,0.35)", borderRadius:10, textAlign:"center" }}>
                    <div style={{ fontSize:10, color:"#e2b714", fontWeight:900, letterSpacing:3, textTransform:"uppercase" }}>⚔️ IRON SOVEREIGN ⚔️</div>
                    <div style={{ fontSize:9, color:"#6b7280", marginTop:3 }}>Prestige Unlocked — 200lb Wall Broken</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ GEAR TAB ════════════════════════════════════ */}
        {tab === "gear" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: 20 }}>
            <div style={S.card}>
              <h3 style={{ ...S.sectionTitle, marginBottom: 16 }}>Equipped Gear</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {GEAR_SLOTS.map(s => {
                  const g = equippedGear[s.slot];
                  const r = g ? RARITY[g.rarity] : null;
                  const isSelected = selectedGearSlot === s.slot;
                  return (
                    <div key={s.slot} onClick={() => setSelectedGearSlot(isSelected ? null : s.slot)}
                      style={{ background: r ? r.bg : "rgba(0,0,0,0.3)", border: `2px solid ${isSelected ? "#e2b714" : r ? r.border : "rgba(255,255,255,0.05)"}`, borderRadius: 10, padding: 10, textAlign: "center", minHeight: 72, display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                      <div style={{ fontSize: 8, fontWeight: 900, color: r ? r.color : "#374151", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                      {g && <div style={{ fontSize: 7, color: r.color, marginTop: 2, fontWeight: 700 }}>{g.name.split(" ").slice(0, 2).join(" ")}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Active Pet Selector */}
              <div style={{ marginTop: 16, padding: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12 }}>
                <label style={{ ...S.label, color: "#f59e0b" }}>🐾 Active Companion</label>
                <select value={activePet} onChange={e => { setActivePet(parseInt(e.target.value)); addLog("buff", `🐾 Companion changed to: ${pets.filter(p => p.earned)[parseInt(e.target.value)]?.name}`); }}
                  style={{ ...S.select, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                  {pets.filter(p => p.earned).map((p, i) => (
                    <option key={p.name} value={i}>{p.icon} {p.name} — {p.bonus}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Gear catalog - filterable by selected slot */}
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ ...S.sectionTitle, margin: 0 }}>
                    {selectedGearSlot ? `${GEAR_SLOTS.find(s => s.slot === selectedGearSlot)?.icon} ${GEAR_SLOTS.find(s => s.slot === selectedGearSlot)?.label} Options` : "Full Gear Catalog"}
                  </h3>
                  {selectedGearSlot && (
                    <button onClick={() => setSelectedGearSlot(null)} style={S.btnSm}>Show All</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                  {gear.filter(g => !selectedGearSlot || g.slot === selectedGearSlot).map((g, i) => {
                    const r = RARITY[g.rarity];
                    const isEquipped = equippedGear[g.slot]?.name === g.name;
                    return (
                      <div key={i} onClick={() => { if (g.earned) setCompareItem(prev => prev?.name===g.name ? null : g); }} style={{ padding: 10, background: g.earned ? r.bg : "rgba(0,0,0,0.2)", border: `1px solid ${compareItem?.name===g.name ? "#e2b714" : isEquipped ? "#e2b714" : g.earned ? r.border : "rgba(255,255,255,0.03)"}`, borderRadius: 10, opacity: g.earned ? 1 : 0.4, cursor: g.earned ? "pointer" : "default", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: g.earned ? r.color : "#4b5563" }}>{g.name}</span>
                          <span style={{ fontSize: 8, color: r.color, fontWeight: 700 }}>{g.rarity}</span>
                        </div>
                        <div style={{ fontSize: 9, color: "#9ca3af" }}>{g.bonus}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                          <span style={{ fontSize: 8, color: "#4b5563" }}>{g.earned ? (isEquipped ? "⭐ Equipped" : "✅ Owned") : `🔒 ${g.condition}`}</span>
                          {g.svgIcon ? (
                            <img src={g.svgIcon} width={20} height={20} alt="" style={{ mixBlendMode: "screen", filter: "sepia(1) saturate(6) hue-rotate(15deg)", opacity: g.earned ? 0.9 : 0.4 }} />
                          ) : (
                            <span style={{ fontSize: 8, color: "#374151" }}>{GEAR_SLOTS.find(s => s.slot === g.slot)?.icon}</span>
                          )}
                        </div>
                        {g.earned && (() => {
                          const dur = durability[g.name] ?? 100;
                          return (
                            <div style={{ marginTop:5 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                                <span style={{ fontSize:8, color: dur === 0 ? "#ef4444" : "#6b7280", letterSpacing:1, textTransform:"uppercase" }}>
                                  {dur === 0 ? "⚠️ BROKEN" : `Durability ${dur}%`}
                                </span>
                                {dur < 100 && (
                                  <button onClick={e => {
                                    e.stopPropagation();
                                    if (mana < 20) { addLog("detriment","❌ Need 20 MANA to repair"); return; }
                                    setMana(p => p - 20);
                                    setDurability(prev => ({ ...prev, [g.name]: Math.min(100, (prev[g.name] ?? 0) + 30) }));
                                    addLog("buff", `🔧 Repaired ${g.name} (+30% durability)`);
                                  }} style={{ fontSize:8, background:"rgba(226,183,20,0.1)", border:"1px solid rgba(226,183,20,0.3)", color:"#e2b714", padding:"1px 6px", borderRadius:3, cursor:"pointer", fontFamily:"'Courier New',monospace" }}>
                                    Repair 20🔮
                                  </button>
                                )}
                              </div>
                              <div style={{ height:3, background:"#1a1f2e", borderRadius:2 }}>
                                <div style={{ height:"100%", width:`${dur}%`, background: dur > 50 ? "#22c55e" : dur > 20 ? "#e2b714" : "#ef4444", borderRadius:2 }} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {compareItem && (() => {
                const equipped = equippedGear[compareItem.slot];
                const newB = parseBonus(compareItem.bonus), oldB = equipped ? parseBonus(equipped.bonus) : {};
                const keys = [...new Set([...Object.keys(newB), ...Object.keys(oldB)])];
                return (
                  <div style={{ marginTop:10, padding:14, background:"rgba(226,183,20,0.04)", border:"1px solid rgba(226,183,20,0.2)", borderRadius:10, fontFamily:"'Courier New', monospace" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:9, color:"#e2b714", fontWeight:900, letterSpacing:2 }}>COMPARE</span>
                      <button onClick={()=>setCompareItem(null)} style={{ background:"none", border:"none", color:"#6b7280", cursor:"pointer", fontFamily:"'Courier New', monospace", fontSize:14 }}>✕</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:6, fontSize:10, alignItems:"center" }}>
                      <div style={{ color:"#9ca3af", textAlign:"left" }}>{equipped ? equipped.name : "—"}</div>
                      <div style={{ color:"#374151", textAlign:"center", fontSize:9 }}>vs</div>
                      <div style={{ color:"#e2b714", fontWeight:900, textAlign:"right" }}>{compareItem.name}</div>
                      {keys.map(k => {
                        const diff = (newB[k]||0)-(oldB[k]||0);
                        return [
                          <div key={k+"l"} style={{ color:"#6b7280" }}>{k} +{oldB[k]||0}</div>,
                          <div key={k+"d"} style={{ textAlign:"center", color: diff>0?"#22c55e":diff<0?"#ef4444":"#374151", fontWeight:900 }}>{diff>0?"+":""}{diff}</div>,
                          <div key={k+"r"} style={{ color:"#fff", fontWeight:700, textAlign:"right" }}>{k} +{newB[k]||0}</div>,
                        ];
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Pets */}
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>🐾 Pet Companions</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {pets.map((p, i) => {
                    const isActive = pets.filter(x => x.earned).indexOf(p) === activePet && p.earned;
                    return (
                      <div key={p.name}
                        onClick={() => { if (p.earned) { const idx = pets.filter(x => x.earned).indexOf(p); setActivePet(idx); addLog("buff", `🐾 ${p.name} deployed! ${p.bonus}`); } }}
                        style={{ padding: 12, background: isActive ? "rgba(245,158,11,0.12)" : p.earned ? "rgba(245,158,11,0.05)" : "rgba(0,0,0,0.2)", border: `2px solid ${isActive ? "#f59e0b" : p.earned ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)"}`, borderRadius: 12, textAlign: "center", opacity: p.earned ? 1 : 0.4, cursor: p.earned ? "pointer" : "default", transition: "all 0.2s" }}>
                        <div style={{ fontSize: 32, marginBottom: 4 }}>{p.icon}</div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: p.earned ? "#fff" : "#4b5563" }}>{p.name}</div>
                        <div style={{ fontSize: 9, color: p.earned ? "#f59e0b" : "#374151", marginTop: 2 }}>{p.bonus}</div>
                        {!p.earned && <div style={{ fontSize: 8, color: "#374151", marginTop: 4 }}>🔒 {p.condition}</div>}
                        {isActive && <div style={{ fontSize: 8, color: "#f59e0b", marginTop: 4, fontWeight: 900 }}>⭐ ACTIVE</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ QUESTS TAB ══════════════════════════════════ */}
        {tab === "quests" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            <div>
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, color: "#e2b714", marginBottom: 16 }}>📜 Main Quest Line</h3>
                {[
                  { name: "Prologue: The Awakening", target: "385 → Start", status: "complete" },
                  { name: "Act I: The Descent", target: "385 → 300 lbs", status: "complete" },
                  { name: "Act II: The Crucible", target: "300 → 250 lbs", status: "complete" },
                  { name: "Act III: The Refinement", target: "250 → 215 lbs", status: "complete" },
                  { name: "Act IV: Diet Break Interlude", target: "Feb 2-23 Recovery", status: "complete" },
                  { name: "Act V: The Phoenix Phase", target: "200 lbs @ 15% BF", status: "active" },
                  { name: "Act VI: The Final Cut", target: "185 lbs @ 10% BF", status: "locked" },
                  { name: "Epilogue: The Ascension", target: "Strategic Bulk Jan 2027", status: "locked" },
                ].map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 6, background: q.status === "active" ? "rgba(226,183,20,0.08)" : "rgba(0,0,0,0.2)", border: `1px solid ${q.status === "active" ? "rgba(226,183,20,0.2)" : "rgba(255,255,255,0.03)"}`, borderRadius: 10, opacity: q.status === "locked" ? 0.35 : 1 }}>
                    <span style={{ fontSize: 14 }}>{q.status === "complete" ? "✅" : q.status === "active" ? "🔥" : "🔒"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: q.status === "active" ? "#e2b714" : q.status === "complete" ? "#22c55e" : "#4b5563" }}>{q.name}</div>
                      <div style={{ fontSize: 9, color: "#6b7280" }}>{q.target}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...S.card, marginTop:16 }}>
                <h3 style={{ ...S.sectionTitle, color:"#f59e0b", marginBottom:14, fontFamily:"'Courier New', monospace" }}>🔥 Phoenix Saga</h3>
                {PHOENIX_SAGA.map((step, i) => {
                  const done = chainProgress[i], locked = i > 0 && !chainProgress[i-1];
                  return (
                    <div key={step.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", marginBottom:6,
                      background: done ? "rgba(34,197,94,0.06)" : locked ? "rgba(0,0,0,0.15)" : "rgba(245,158,11,0.06)",
                      border:`1px solid ${done ? "rgba(34,197,94,0.2)" : locked ? "rgba(255,255,255,0.03)" : "rgba(245,158,11,0.2)"}`,
                      borderRadius:10, opacity:locked ? 0.4 : 1, fontFamily:"'Courier New', monospace" }}>
                      <input type="checkbox" checked={done} disabled={locked}
                        onChange={() => !locked && setChainProgress(prev => { const n=[...prev]; n[i]=!n[i]; return n; })}
                        style={{ accentColor:"#f59e0b", width:16, height:16, flexShrink:0, cursor:locked?"not-allowed":"pointer" }} />
                      <span style={{ fontSize:20, flexShrink:0 }}>{step.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:900, color:done?"#22c55e":locked?"#4b5563":"#f59e0b" }}>{step.name}</div>
                        <div style={{ fontSize:9, color:"#6b7280" }}>{step.desc}</div>
                      </div>
                      <span style={{ fontSize:10, color:"#e2b714", fontWeight:700, flexShrink:0 }}>+{step.xp} {step.stat}</span>
                    </div>
                  );
                })}
                <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:8 }}>
                  {PHOENIX_SAGA.map((_,i) => (
                    <div key={i} style={{ width:10, height:10, borderRadius:"50%",
                      background: chainProgress[i] ? "#22c55e" : i===chainProgress.filter(Boolean).length ? "#f59e0b" : "#1e2a3a",
                      border:`1px solid ${chainProgress[i] ? "#22c55e" : "#374151"}` }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Daily Quests via QuestBuilder */}
              <div style={S.card}>
                <QuestBuilder
                  quests={dailyQuests}
                  currentWeight={weight}
                  onQuestToggle={toggleQuest}
                  onResetAll={() => setDailyQuests(prev => prev.map(q => ({ ...q, done: false })))}
                  onSave={(quest) => setDailyQuests(prev => {
                    const idx = prev.findIndex(q => q.id === quest.id);
                    if (idx >= 0) { const next = [...prev]; next[idx] = quest; return next; }
                    return [...prev, quest];
                  })}
                  onDelete={(id) => setDailyQuests(prev => prev.filter(q => q.id !== id))}
                />
              </div>

              <div style={{ ...S.card, marginTop:16, border:"1px solid rgba(249,115,22,0.25)" }}>
                <h3 style={{ ...S.sectionTitle, color:"#f97316", marginBottom:14 }}>⚡ Weekly Raid Bosses
                  <span style={{ fontSize:9, color:"#6b7280", fontWeight:400, marginLeft:8 }}>resets weekly · mark done when achieved</span>
                </h3>
                {raidQuests.map(q => (
                  <div key={q.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", marginBottom:8,
                    background: q.done ? "rgba(34,197,94,0.04)" : "rgba(249,115,22,0.04)",
                    border:`1px solid ${q.done ? "rgba(34,197,94,0.2)" : "rgba(249,115,22,0.2)"}`,
                    borderRadius:10, opacity: q.done ? 0.6 : 1 }}>
                    <input type="checkbox" checked={q.done}
                      style={{ accentColor:"#f97316", width:18, height:18, cursor:"pointer", flexShrink:0 }}
                      onChange={() => {
                        const nowDone = !q.done;
                        setRaidQuests(prev => prev.map(r => r.id === q.id ? { ...r, done: nowDone } : r));
                        if (nowDone) {
                          addLog("buff", `⚡ RAID BOSS DEFEATED: ${q.name} (+${q.xp} ${q.stat} XP!)`);
                          spawnPopup(`+${q.xp} ${q.stat}`, STAT_COLORS[q.stat] || "#f97316");
                          addToast("achievement", `⚡ Raid Boss down: ${q.name}!`);
                        }
                      }} />
                    <span style={{ fontSize:22, flexShrink:0 }}>{q.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:900, color: q.done ? "#22c55e" : "#f97316" }}>{q.name}</div>
                      <div style={{ fontSize:10, color:"#6b7280" }}>{q.desc}</div>
                    </div>
                    <span style={{ fontSize:11, color:"#e2b714", fontWeight:700, background:"rgba(226,183,20,0.1)", padding:"3px 10px", borderRadius:4, flexShrink:0 }}>+{q.xp} {q.stat}</span>
                  </div>
                ))}
              </div>

              {/* Boss fights */}
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, color: "#ef4444", marginBottom: 12 }}>💀 Boss Fights</h3>
                {[
                  { name: "The Birthday Dragon", target: "212 lbs by Mar 21", hp: `${Math.max(0, weight - 212)} lbs`, active: weight > 212 },
                  { name: "The Vacation Vanguard", target: "207 lbs by May 1", hp: `${Math.max(0, weight - 207)} lbs`, active: weight <= 212 && weight > 207 },
                  { name: "The Two Hundred", target: "Sub-200 lbs", hp: `${Math.max(0, weight - 200)} lbs`, active: weight <= 207 && weight > 200 },
                  { name: "The Ten Percent", target: "10% body fat", hp: `${bodyFat}% BF`, active: weight <= 200 },
                ].map((b, i) => (
                  <div key={i} style={{ padding: 10, marginBottom: 6, background: b.active ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.2)", border: `1px solid ${b.active ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.03)"}`, borderRadius: 10, opacity: b.active ? 1 : 0.5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: b.active ? "#ef4444" : "#6b7280" }}>{b.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 900, color: "#ef4444" }}>{b.hp}</span>
                    </div>
                    <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{b.target}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SPELLBOOK TAB ═══════════════════════════════ */}
        {tab === "spellbook" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
            <div style={S.card}>
              <h3 style={{ ...S.sectionTitle, color: "#60a5fa", marginBottom: 20 }}>✨ Arcane Metabolic Spellbook</h3>
              {activeBuffs.length > 0 && (
                <div style={{ marginBottom:14, padding:10, background:"rgba(59,130,246,0.05)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10 }}>
                  <div style={{ fontSize:9, color:"#60a5fa", fontWeight:900, letterSpacing:2, textTransform:"uppercase", marginBottom:8, fontFamily:"'Courier New', monospace" }}>⚡ ACTIVE BUFFS</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {activeBuffs.map((b,i) => {
                      const hrs = Math.max(0, 24 - Math.floor((Date.now() - b.ts) / 3600000));
                      return (
                        <span key={i} style={{ background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.3)", color:"#60a5fa", fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:700, fontFamily:"'Courier New', monospace" }}>
                          {b.icon} {b.name} — {hrs}h
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SPELLS.map(s => (
                  <button key={s.id} onClick={() => castSpell(s)} disabled={mana < s.cost}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, background: mana >= s.cost ? "rgba(59,130,246,0.05)" : "rgba(0,0,0,0.2)", border: `1px solid ${mana >= s.cost ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.03)"}`, borderRadius: 14, cursor: mana >= s.cost ? "pointer" : "not-allowed", opacity: mana >= s.cost ? 1 : 0.4, fontFamily: "inherit", color: "inherit", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {s.svgIcon ? (
                        <img src={s.svgIcon} width={34} height={34} alt="" style={{ mixBlendMode: "screen", filter: s.iconFilter, flexShrink: 0 }} />
                      ) : (
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</span>
                      )}
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{s.desc}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#60a5fa" }}>{s.cost}</div>
                      <div style={{ fontSize: 8, color: "#6b7280", textTransform: "uppercase" }}>MANA</div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: 14, background: "rgba(0,0,0,0.3)", borderRadius: 12 }}>
                <div style={{ ...S.sectionTitle, marginBottom: 8 }}>MANA Regeneration Sources</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10 }}>
                  {[
                    { src: "Sleep ≥ 7.5h", mana: "+15" }, { src: "HRV ≥ 7d avg", mana: "+10" },
                    { src: "RHR ≤ 7d avg", mana: "+5" }, { src: "Chapter read", mana: "+15" },
                    { src: "Language 30m", mana: "+15" }, { src: "Daily passive", mana: "+10" },
                  ].map(r => (
                    <div key={r.src} style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af" }}>
                      <span>{r.src}</span><span style={{ color: "#60a5fa", fontWeight: 700 }}>{r.mana}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Manual MANA/HP adjust */}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button onClick={() => setMana(m => Math.min(maxMana, m + 10))} style={S.btnSm}>+10 MANA</button>
                <button onClick={() => setHp(h => Math.min(100, h + 10))} style={{ ...S.btnSm, color: "#22c55e", borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.1)" }}>+10 HP</button>
                <button onClick={() => { setHp(h => Math.max(0, h - 20)); if (hp <= 20) setIsDead(true); }} style={S.btnDanger}>−20 HP</button>
                <button onClick={() => setMana(maxMana)} style={{ ...S.btnSm, fontSize: 8 }}>Full MANA</button>
              </div>
            </div>

            {/* Achievements */}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ ...S.sectionTitle, margin: 0 }}>🏆 Achievements</h3>
                <span style={{ fontSize: 10, color: "#e2b714", fontWeight: 900 }}>{achievements.filter(a => a.earned).length}/{achievements.length}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: 460, overflowY: "auto" }}>
                {achievements.map((a, i) => {
                  const r = RARITY[a.rarity];
                  return (
                    <div key={i} style={{ padding: 10, background: a.earned ? r.bg : "rgba(0,0,0,0.2)", border: `1px solid ${a.earned ? r.border : "rgba(255,255,255,0.03)"}`, borderRadius: 10, opacity: a.earned ? 1 : 0.4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: a.earned ? r.color : "#4b5563" }}>{a.name}</span>
                        <span style={{ fontSize: 8, color: r.color }}>{a.rarity}</span>
                      </div>
                      <div style={{ fontSize: 9, color: "#6b7280" }}>{a.desc}</div>
                      {a.progress && <div style={{ fontSize: 8, color: "#f59e0b", marginTop: 2 }}>📊 {a.progress}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ JOURNEY TAB ═════════════════════════════════ */}
        {tab === "journey" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={S.card}>
              <h3 style={{ ...S.sectionTitle, marginBottom: 16 }}>🗺️ The Transformation Arc — 385 → 185</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={journeyData}>
                  <defs>
                    <linearGradient id="wG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e2b714" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#e2b714" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[180, 390]} tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="weight" stroke="#e2b714" strokeWidth={2} fill="url(#wG)" dot={{ fill: "#e2b714", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Summary Card */}
            {(() => {
              const last7 = xpHistory.slice(0, 7);
              const totalXP = last7.reduce((sum, d) => sum + (d.total || 0), 0);
              const daysActive = last7.filter(d => (d.total || 0) > 0).length;
              const bestDay = last7.reduce((best, d) => (!best || (d.total || 0) > (best.total || 0)) ? d : best, null);
              const byStats = last7.reduce((acc, d) => {
                Object.entries(d).forEach(([k, v]) => {
                  if (["STR","END","WIS","INT","CON","VIT"].includes(k)) acc[k] = (acc[k] || 0) + v;
                });
                return acc;
              }, {});
              return (
                <div style={{ ...S.card, padding: 18 }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: "#e2b714", textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>📈 This Week</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 36, fontWeight: 900, color: "#e2b714", lineHeight: 1 }}>{totalXP}</div>
                      <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: 2 }}>total xp</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      <div>{daysActive}/7 days active</div>
                      {bestDay && <div style={{ color: "#e2b714" }}>Best: {bestDay.date} — {bestDay.total} XP</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(byStats).filter(([,v]) => v > 0).map(([stat, xp]) => (
                      <span key={stat} style={{ background: (STAT_COLORS[stat] || "#6b7280") + "22", color: STAT_COLORS[stat] || "#9ca3af", border: `1px solid ${STAT_COLORS[stat] || "#6b7280"}44`, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
                        {stat} +{xp}
                      </span>
                    ))}
                    {Object.keys(byStats).length === 0 && <span style={{ fontSize: 11, color: "#4b5563" }}>No XP data this week — import a CSV to begin</span>}
                  </div>
                </div>
              );
            })()}

            {weeklyDeficit && (
              <div style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:9, color:"#22c55e", fontWeight:900, letterSpacing:2, textTransform:"uppercase" }}>🔥 Weekly Deficit</div>
                  <div style={{ fontSize:26, fontWeight:900, color:"#22c55e", marginTop:4 }}>{weeklyDeficit.deficit.toLocaleString()}<span style={{ fontSize:10, color:"#6b7280", marginLeft:4 }}>kcal</span></div>
                  <div style={{ fontSize:10, color:"#6b7280" }}>{weeklyDeficit.days} days tracked vs {(settings.tdee||2500).toLocaleString()} TDEE</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:9, color:"#6b7280", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Est. fat lost</div>
                  <div style={{ fontSize:32, fontWeight:900, color:"#e2b714" }}>{weeklyDeficit.lbsLostEst}</div>
                  <div style={{ fontSize:9, color:"#6b7280" }}>lbs this week</div>
                </div>
              </div>
            )}

            {weightTrend.length > 1 && (
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom:12 }}>⚖️ Bodyweight Trend
                  <span style={{ fontSize:9, color:"#6b7280", fontWeight:400, marginLeft:8 }}>actual (faint) · 7-day avg (solid)</span>
                </h3>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={weightTrend} margin={{ top:4, right:4, bottom:4, left:-20 }}>
                    <defs>
                      <linearGradient id="wtG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e2b714" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#e2b714" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill:"#6b7280", fontSize:9, fontFamily:"'Courier New',monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={["auto","auto"]} tick={{ fill:"#6b7280", fontSize:9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:"#0f1320", border:"1px solid #374151", fontFamily:"'Courier New',monospace", fontSize:11 }} labelStyle={{ color:"#e2b714" }} />
                    <Area type="monotone" dataKey="weight" stroke="#e2b714" strokeWidth={1} strokeOpacity={0.4} fill="url(#wtG)" dot={false} name="Weight (lbs)" />
                    <Area type="monotone" dataKey="avg" stroke="#e2b714" strokeWidth={2.5} fill="none" dot={false} name="7-day avg" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {macroHistory.length > 0 && (
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom:12 }}>🥩 Protein Intake
                  <span style={{ fontSize:9, color:"#6b7280", fontWeight:400, marginLeft:8 }}>last {macroHistory.length} days · target 200g</span>
                </h3>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={[...macroHistory].reverse()} margin={{ top:4, right:4, bottom:4, left:-20 }}>
                    <XAxis dataKey="date" tick={{ fill:"#6b7280", fontSize:9, fontFamily:"'Courier New', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"#6b7280", fontSize:9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:"#0f1320", border:"1px solid #374151", fontFamily:"'Courier New', monospace", fontSize:11 }} labelStyle={{ color:"#e2b714" }} />
                    <ReferenceLine y={200} stroke="#e2b714" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value:"200g", fill:"#e2b714", fontSize:8 }} />
                    <Bar dataKey="protein" fill="#a855f7" radius={[3,3,0,0]} name="Protein (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {xpHistory.filter(d=>(d.STR||0)+(d.END||0)>0).length > 0 && (
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom:12 }}>💪 Workout XP — Last 28 Days</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={xpHistory.slice(0,28).reverse().map(d=>({ date:d.date, STR:d.STR||0, END:d.END||0 }))} margin={{ top:4, right:4, bottom:4, left:-20 }}>
                    <XAxis dataKey="date" tick={{ fill:"#6b7280", fontSize:8, fontFamily:"'Courier New', monospace" }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fill:"#6b7280", fontSize:9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:"#0f1320", border:"1px solid #374151", fontFamily:"'Courier New', monospace", fontSize:11 }} labelStyle={{ color:"#e2b714" }} />
                    <Bar dataKey="STR" stackId="a" fill="#ef4444" name="STR XP" />
                    <Bar dataKey="END" stackId="a" fill="#22c55e" radius={[3,3,0,0]} name="END XP" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* XP History Chart — click a bar to see day detail */}
            <div style={S.card}>
              <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>⚡ XP History — Daily Breakdown <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 400 }}>click bar for detail</span></h3>
              <XPHistoryChart xpHistory={xpHistory} onDayClick={setSelectedDay} />
            </div>
            {selectedDay && <DayDetailPanel date={selectedDay} onClose={() => setSelectedDay(null)} />}

            {/* Nutrition log history */}
            {nutritionLog.length > 0 && (
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>📋 Recent Daily Logs</h3>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {nutritionLog.map((log, i) => (
                    <div key={i} style={{ padding: 8, marginBottom: 4, background: "rgba(0,0,0,0.2)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 900 }}>{log.date}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{log.entries.join(" • ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bfHistory.length > 1 && (
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom:12 }}>📉 Body Fat % Trend
                  <span style={{ fontSize:9, color:"#6b7280", fontWeight:400, marginLeft:8 }}>from Renpho imports</span>
                </h3>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={bfHistory} margin={{ top:4, right:4, bottom:4, left:-20 }}>
                    <defs>
                      <linearGradient id="bfG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill:"#6b7280", fontSize:9, fontFamily:"'Courier New', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis domain={["auto","auto"]} tick={{ fill:"#6b7280", fontSize:9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:"#0f1320", border:"1px solid #374151", fontFamily:"'Courier New', monospace", fontSize:11 }} labelStyle={{ color:"#e2b714" }} />
                    <Area type="monotone" dataKey="bf" stroke="#ec4899" strokeWidth={2} fill="url(#bfG)" dot={{ fill:"#ec4899", r:3 }} name="BF %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Milestones */}
            <div style={S.card}>
              <h3 style={{ ...S.sectionTitle, marginBottom: 16 }}>⏳ Key Milestones</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { date: "Mar 21", label: "Birthday Dragon", target: "212 lbs", icon: "🐲", active: weight > 212 },
                  { date: "May 1", label: "Vacation", target: "207 lbs", icon: "🏖️", active: weight <= 212 && weight > 207 },
                  { date: "Jun 28", label: "Goal 1", target: "200 lbs @ 15%", icon: "⚔️", active: false },
                  { date: "Oct 4", label: "Goal 2", target: "185 lbs @ 10%", icon: "👑", active: false },
                ].map((m, i) => (
                  <div key={i} style={{ padding: 14, background: m.active ? "rgba(226,183,20,0.08)" : "rgba(0,0,0,0.2)", border: `1px solid ${m.active ? "rgba(226,183,20,0.2)" : "rgba(255,255,255,0.03)"}`, borderRadius: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{m.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: m.active ? "#e2b714" : "#9ca3af" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{m.date} • {m.target}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ COMMAND HUB TAB ═════════════════════════════ */}
        {tab === "hub" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, position: "relative" }}
            onDragOver={handleHubDragOver}
            onDragLeave={handleHubDragLeave}
            onDrop={handleHubDrop}
          >
            {/* Global drag-over overlay */}
            {hubDragActive && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(226,183,20,0.04)", border: "2px dashed rgba(226,183,20,0.5)", borderRadius: 16, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", backdropFilter: "blur(1px)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 52 }}>📂</div>
                  <div style={{ color: "#e2b714", fontWeight: 900, fontSize: 15, marginTop: 10, letterSpacing: 1 }}>Drop CSV — source auto-detected</div>
                  <div style={{ color: "#6b7280", fontSize: 10, marginTop: 4 }}>Liftosaur · Cronometer · Renpho · Apple Health</div>
                </div>
              </div>
            )}
            {/* CSV Import Hub */}
            <div style={S.card}>
              <h3 style={{ ...S.sectionTitle, color: "#e2b714", marginBottom: 20 }}>📥 Data Import Hub</h3>
              <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 16, lineHeight: 1.5 }}>
                Import CSV files from your tracking apps. Data auto-processes and updates your stats, battle log, and encounter status.
              </p>
              {[
                { key: "liftosaur", label: "Liftosaur", icon: "⚔️", desc: "Workout sets & exercises", accept: ".csv" },
                { key: "cronometer", label: "Cronometer", icon: "🥩", desc: "Nutrition & macros", accept: ".csv" },
                { key: "renpho", label: "Renpho", icon: "⚖️", desc: "Body composition", accept: ".csv" },
                { key: "fitbit", label: "Apple Health / Fitbit", icon: "🍎", desc: "Steps, sleep, active minutes", accept: ".csv" },
              ].map(src => {
                const imp = imports[src.key];
                return (
                  <DragDropZone
                    key={src.key}
                    source={src.key}
                    label={src.label}
                    icon={src.icon}
                    desc={src.desc}
                    accept={src.accept}
                    status={imp.status}
                    rows={imp.rows}
                    lastSync={imp.lastSync}
                    isLoading={importLoading[src.key]}
                    onFile={processFile}
                  />
                );
              })}
            </div>

            {/* Settings & Configuration */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>⚙️ Configuration</h3>

                {/* Launch controls */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  <button
                    onClick={() => window.open("http://localhost:5173", "_blank")}
                    style={{ ...S.btnSm, background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>
                    🌐 Open in Browser
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    style={{ ...S.btnSm, background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                    🔄 Reload App
                  </button>
                  {installPrompt && (
                    <button onClick={handleInstallApp}
                      style={{ ...S.btnSm, background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}>
                      📱 Install App
                    </button>
                  )}
                </div>

                {/* Phone / LAN access */}
                {lanUrl && (
                  <div style={{ marginBottom: 16, padding: "10px 12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>📱 PHONE ACCESS (same WiFi)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#22c55e", flex: 1 }}>{lanUrl}</span>
                      <button
                        onClick={() => navigator.clipboard?.writeText(lanUrl).catch(() => {})}
                        style={{ ...S.btnSm, padding: "3px 8px", fontSize: 10, background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                        Copy
                      </button>
                    </div>
                    <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4 }}>Open on iPhone → tap Share → Add to Home Screen</div>
                  </div>
                )}

                {/* Phase selector */}
                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>🎯 Active Phase</label>
                  <select value={phase} onChange={e => { setPhase(e.target.value); addLog("system", `⚙️ Phase → ${PHASES.find(p => p.id === e.target.value)?.label}`); }}
                    style={S.select}>
                    {PHASES.map(p => <option key={p.id} value={p.id}>{p.label} — {p.cal} kcal/day</option>)}
                  </select>
                </div>

                {/* Day count */}
                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>📅 Journey Day Count</label>
                  <input type="number" value={dayCount} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setDayCount(v); }}
                    style={S.input} />
                </div>

                {/* Manual stat adjustments */}
                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>📊 Quick Stat Adjustments</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {Object.entries(attrs).map(([key, val]) => {
                      const colors = { STR: "#ef4444", END: "#22c55e", WIS: "#a855f7", INT: "#06b6d4", CON: "#f59e0b", VIT: "#ec4899" };
                      return (
                        <div key={key}>
                          <div style={{ fontSize: 9, fontWeight: 900, color: colors[key], marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>{key}</div>
                          <input type="number" min={0} max={100} value={val}
                            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) setAttrs(prev => ({ ...prev, [key]: v })); }}
                            style={{ ...S.input, padding: "6px 8px", fontSize: 14, fontWeight: 900, textAlign: "center" }} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HP / MANA */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={S.label}>❤️ Current HP</label>
                    <input type="number" min={0} max={100} value={hp}
                      onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) { setHp(Math.max(0, Math.min(100, v))); if (v <= 0) setIsDead(true); } }}
                      style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>⚡ Current MANA</label>
                    <input type="number" min={0} max={maxMana} value={mana}
                      onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setMana(Math.max(0, Math.min(maxMana, v))); }}
                      style={S.input} />
                  </div>
                </div>
              </div>

              {/* Import Audit Log */}
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>📋 Import History</h3>
                <ImportLog importLog={importLog} />
              </div>

              {/* Import Data Preview */}
              <div style={S.card}>
                <h3 style={{ ...S.sectionTitle, marginBottom: 12 }}>📊 Import Preview</h3>
                {Object.entries(importedData).every(([, d]) => d.length === 0) ? (
                  <p style={{ fontSize: 11, color: "#374151", textAlign: "center", padding: 20 }}>No data imported yet. Use the Import Hub above.</p>
                ) : (
                  Object.entries(importedData).filter(([, d]) => d.length > 0).map(([key, data]) => (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "#e2b714", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>{key}</div>
                      <div style={{ maxHeight: 120, overflowY: "auto", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 8 }}>
                        <div style={{ fontSize: 9, color: "#6b7280" }}>
                          {data.length} rows • Columns: {Object.keys(data[0] || {}).slice(0, 5).join(", ")}{Object.keys(data[0] || {}).length > 5 ? "..." : ""}
                        </div>
                        {data.slice(0, 3).map((row, i) => (
                          <div key={i} style={{ fontSize: 9, color: "#4b5563", marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: 4 }}>
                            {Object.entries(row).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(" • ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reset */}
              <div style={{ ...S.card, background: "rgba(239,68,68,0.03)", borderColor: "rgba(239,68,68,0.1)" }}>
                <h3 style={{ ...S.sectionTitle, color: "#ef4444", marginBottom: 12 }}>⚠️ Danger Zone</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => { setHp(100); setMana(maxMana); setActiveBuffs([]); addLog("system", "🔄 Full HP/MANA reset."); }} style={S.btnDanger}>Reset HP + MANA</button>
                  <button onClick={() => { setStreaks({ workout: 0, protein: 0, trifecta: 0 }); addLog("system", "🔄 All streaks reset to 0."); }} style={S.btnDanger}>Reset Streaks</button>
                  <button onClick={() => { setBattleLog([{ id: Date.now(), type: "system", msg: "🔄 Battle log cleared.", time: ts() }]); }} style={S.btnDanger}>Clear Log</button>
                  <button onClick={() => setIsDead(true)} style={{ ...S.btnDanger, background: "rgba(239,68,68,0.2)" }}>Trigger Death Screen</button>
                </div>
              </div>
            </div>

            {/* ── Data Manager (full-width, spans both columns) ── */}
            <div style={{ gridColumn: "1 / -1" }}>
              <DataManager addToast={addToast} addLog={addLog} />
            </div>
          </div>
        )}

        {/* ═══ WORKOUT LOGGER TAB ════════════════════════════ */}
        {tab === "log" && (
          <WorkoutLogger
            processFile={processFile}
            addLog={addLog}
            currentPhase={currentPhase}
          />
        )}

      </div>

      {/* ── BATCH 3 OVERLAYS ─────────────────────────────── */}
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        updateSetting={updateSetting}
        addToast={addToast}
      />
      {showNotifs && (
        <NotificationCenter
          entries={battleLog}
          onClose={() => setShowNotifs(false)}
        />
      )}
      {showMacroCalc && (
        <MacroCalc
          open={showMacroCalc}
          onClose={() => setShowMacroCalc(false)}
          settings={settings}
          cronData={importedData?.cronometer}
        />
      )}

      {/* ── FOOTER ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "20px auto 0", padding: "8px 16px", background: "#0a0d16", borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 9, color: "#374151", fontFamily: "monospace" }}>
        <div style={{ display: "flex", gap: 16, overflow: "hidden", whiteSpace: "nowrap" }}>
          <span>{">"} IRON SOVEREIGN V2 INTERACTIVE</span>
          <span>{">"} {currentPhase.label.toUpperCase()}: {currentPhase.cal} KCAL TARGET</span>
          <span>{">"} HP {hp}/100 • MANA {mana}/{maxMana}</span>
          <span>{">"} {Object.entries(imports).filter(([, v]) => v.status === "success").length}/4 SOURCES SYNCED</span>
        </div>
        <span style={{ color: "#e2b714", fontWeight: 700, marginLeft: 16 }}>V2.1.0</span>
      </div>
    </div>
  );
}
