# Iron Sovereign — Fitness RPG Dashboard

> **For AI assistants:** Marcel is not a coder. He directs, brainstorms, and reviews — you write all the code. Read this document fully before making any changes. It contains everything you need to understand the codebase, conventions, and how to contribute effectively.

---

## What Is This App?

Iron Sovereign is a personal fitness dashboard styled as a video-game RPG. It turns Marcel's real-world health data into a character progression system:

- **Lifting data** (Liftosaur CSV) → STR / END stats + XP
- **Nutrition data** (Cronometer CSV) → WIS / CON stats
- **Body composition** (Renpho CSV) → VIT stat
- **Activity data** (Fitbit CSV) → INT stat

The app runs locally in a browser at `http://localhost:5173`. There is no backend — all data lives in the browser's `localStorage`. Marcel double-clicks a desktop icon to launch it; no terminal is ever opened.

---

## How to Start the App

**From desktop:** Double-click `Iron Sovereign` on the Linux desktop — this runs `launch.sh`, which starts the Vite dev server and opens the browser automatically.

**From terminal (for development/debugging):**
```bash
cd ~/fitness-dashboard
npm run dev
```

**Build for production:**
```bash
npm run build
```

---

## Tech Stack

| Tool | Role |
|------|------|
| React 18 | UI framework (functional components + hooks only) |
| Vite | Dev server + build tool |
| Recharts | Charts (BarChart, AreaChart, RadarChart) |
| localStorage | All persistence — no database, no backend |
| CSS-in-JS (inline) | All styling — **no CSS files, no classNames** |

---

## Project Structure

```
fitness-dashboard/
├── public/
│   ├── icon.svg              # Iron crown app icon
│   ├── manifest.json         # PWA manifest (installable on phone)
│   ├── sw.js                 # Service worker (offline cache)
│   └── lan-access.json       # Written by launch.sh — current LAN IP for phone access
├── src/
│   ├── main.jsx              # React entry point + service worker registration
│   ├── IronSovereignV2.jsx   # MAIN FILE — entire app (~1,600 lines)
│   │
│   ├── components/
│   │   ├── Confetti.jsx        # Canvas confetti burst (achievements/level-up)
│   │   ├── DataManager.jsx     # Ledger table + JSON backup/restore (Command Hub)
│   │   ├── DayDetailPanel.jsx  # Slide-in panel: XP breakdown for one day (Journey tab)
│   │   ├── DragDropZone.jsx    # Drag-and-drop CSV import zone
│   │   ├── ImportLog.jsx       # Import history list
│   │   ├── ImportReceipt.jsx   # Modal shown after CSV import
│   │   ├── LevelUpOverlay.jsx  # Full-screen cinematic level-up animation
│   │   ├── MacroCalc.jsx       # TDEE calculator + macro sliders (modal)
│   │   ├── NotificationCenter.jsx  # Bell icon dropdown + unread badge
│   │   ├── QuestBuilder.jsx    # Quest list with add/edit/delete
│   │   ├── SettingsPanel.jsx   # Slide-in settings panel (right edge)
│   │   ├── Toast.jsx           # Re-exports from useToast.jsx
│   │   ├── WorkoutLogger.jsx   # Live workout logging tab (Log Workout)
│   │   ├── XPHistoryChart.jsx  # Stacked bar chart — last 14 days of XP
│   │   └── XPPopup.jsx         # Floating "+45 STR XP" popup animations
│   │
│   ├── engine/
│   │   ├── xpEngine.js         # Core XP logic: import processing, ledger, history
│   │   └── workoutLogger.js    # Converts logged sets → Liftosaur-format rows
│   │
│   ├── hooks/
│   │   ├── usePersistence.js   # localStorage hooks for character, battle log, quests
│   │   ├── useSettings.js      # Settings (name, targets, timezone) → iron_sovereign_settings
│   │   ├── useToast.jsx        # Toast context provider + useToast() hook
│   │   └── useXPLedger.js      # Loads XP totals, history, import log from xpEngine
│   │
│   └── utils/
│       ├── animations.js       # Injects global CSS keyframes into <head> once
│       └── responsive.js       # Injects mobile media query styles into <head> once
│
├── index.html                  # App shell (dark bg, icon, manifest link)
├── vite.config.js              # host: true (LAN access), port 5173
├── launch.sh                   # Desktop launcher: detects LAN IP, starts server, opens browser
└── package.json
```

---

## The Main File: IronSovereignV2.jsx

This is the heart of the app. It is ~1,600 lines and contains almost all application logic. It is structured as:

```jsx
export default function IronSovereignV2() {
  return (
    <ToastProvider>
      <IronSovereignV2Inner />
    </ToastProvider>
  );
}

function IronSovereignV2Inner() {
  // All state, hooks, callbacks, and render logic lives here
}
```

### State Declaration Order (important — hooks must stay in this order)

1. Persistence hooks (`useCharacterPersistence`, `useBattleLogPersistence`, etc.)
2. Phase 2 state (PWA install prompt, LAN URL)
3. Batch 3 state (settings, selectedDay, showMacroCalc, showNotifs)
4. Phase 5 state (XP popups, level-up overlay, confetti)
5. Quest state (`dailyQuests`)
6. Streaks state
7. Battle log state (`battleLog` — **`useNotifBadge` must be called AFTER this**)
8. Notification badge (`useNotifBadge(battleLog)`)
9. Nutrition log state
10. `addLog` callback
11. Daily log input states
12. Import states
13. useEffects (animations, PWA install prompt, LAN IP fetch, level-up detection)
14. All other callbacks

> **Warning for AI:** Never call `useNotifBadge(battleLog)` before `battleLog` is declared. JavaScript `const` is not hoisted — this will cause a black screen (temporal dead zone ReferenceError).

### Tabs

The app has 8 tabs:

| ID | Label | Content |
|----|-------|---------|
| `battle` | ⚔️ Battle | Current encounter, HP/MANA combat log, active buffs |
| `character` | 📊 Character | Stats (STR/END/WIS/INT/CON/VIT), radar chart, gear |
| `gear` | 🎒 Armory | Equipment slots, pets |
| `quests` | 📜 Quests | Daily quests (QuestBuilder), boss fights |
| `spellbook` | ✨ Spells | Spell casting, achievements |
| `journey` | 🗺️ Journey | Weight chart, XP history (clickable), nutrition log |
| `hub` | ⚙️ Command Hub | CSV imports (drag-drop), settings, data manager |
| `log` | ⚡ Log Workout | Live workout logger with rest timer |

---

## Styling Rules (Critical — AI must follow these)

1. **No CSS files** — Every style is an inline JS object: `style={{ color: "#e2b714" }}`
2. **No classNames** — Except for the few injected in `animations.js` and `responsive.js`
3. **Font:** `'Courier New', monospace` everywhere
4. **Color palette:**
   - App background: `#06080f`
   - Card background: `#0f1320`
   - Section background: `#1a1f2e`
   - Gold accent: `#e2b714`
   - Borders (dim): `rgba(255,255,255,0.06)`
5. **Stat colors:** STR `#ef4444` · END `#22c55e` · WIS `#a855f7` · INT `#06b6d4` · CON `#f59e0b` · VIT `#ec4899`
6. **Button pattern:** `{ background: "rgba(226,183,20,0.12)", border: "1px solid rgba(226,183,20,0.3)", borderRadius: 6, color: "#e2b714", cursor: "pointer", padding: "6px 14px", fontSize: 11, fontFamily: "'Courier New', monospace" }`
7. **Never add imports for CSS** — it will break the build

---

## localStorage Keys

| Key | Content |
|-----|---------|
| `iron_sovereign_xp_ledger` | Main XP ledger (date → state/sources/xp_awarded) |
| `iron_sovereign_import_log` | History of CSV imports |
| `iron_sovereign_character` | HP, MANA, attrs, weight, streaks, phase, gear, etc. |
| `iron_sovereign_battle_log` | Last 50 battle log entries |
| `iron_sovereign_nutrition_log` | Daily nutrition log history |
| `iron_sovereign_daily_quests` | Quest done/undone state |
| `iron_sovereign_settings` | User settings (name, targets, timezone) |
| `iron_sovereign_workouts` | Last 7 workout sessions |
| `iron_sovereign_notif_last_read` | Timestamp of last notification read |
| `iron_sovereign_pwa_dismissed` | Whether install banner was dismissed |

---

## Data Flow: CSV Import

```
User drops CSV file
  → DragDropZone / file input
    → processFile(source, file) in IronSovereignV2.jsx
      → Papa.parse (CSV → rows array)
        → processImport(source, rows, config) in xpEngine.js
          → XP calculated per stat per day
          → Ledger updated in localStorage
            → addToast() + spawnPopup() + addLog() for feedback
              → useXPLedger() hook recalculates totals reactively
```

**Sources and their stat mappings:**
- `liftosaur` → STR (volume) + END (sets)
- `cronometer` → WIS (protein quality) + CON (calorie adherence)
- `renpho` → VIT (body composition)
- `fitbit` → INT (steps/activity)

---

## Key Engine Functions (src/engine/xpEngine.js)

| Function | Description |
|----------|-------------|
| `loadLedger()` | Load full XP ledger from localStorage |
| `saveLedger(ledger)` | Write updated ledger back |
| `processImport(source, rows, config)` | Main CSV processor — idempotent |
| `getXPHistory(days)` | Last N days of XP for charts |
| `getCharacterXPTotals()` | Cumulative XP per stat |
| `getImportLog(limit)` | Recent import history |
| `clearLedger()` | Wipe all XP data (danger zone) |

---

## HUD Bar (Top of Screen)

Left: Character identity (name, level, class, evolution stage)

Center: HP bar + MANA bar + phase selector

Right (icon buttons):
- 📋 Daily log toggle
- 🧮 Macro calculator
- 🔔 Notification center (with unread badge)
- ⚙️ Settings panel

---

## Overlay Components (always mounted, conditionally visible)

| Component | Trigger | z-index |
|-----------|---------|---------|
| `ImportReceipt` | After CSV import | 500 |
| `XPPopup` | Quest/import XP gain | 2000 |
| `LevelUpOverlay` | When level increases | 2100 |
| `Confetti` | Level-up / achievements | canvas |
| `PWA install banner` | First visit + Chrome | 500 |
| `SettingsPanel` | ⚙️ button | 1200 (slide-in) |
| `NotificationCenter` | 🔔 button | 1050 |
| `MacroCalc` | 🧮 button | 1300 |
| `DayDetailPanel` | Click XP chart bar | 1100 |

---

## How to Add New Features (Guide for AI)

1. **New component:** Create `src/components/MyComponent.jsx`, all inline styles, no CSS
2. **New hook:** Create `src/hooks/useMyHook.js` (no JSX = `.js` extension is fine)
3. **Wire into app:** Edit `IronSovereignV2.jsx`:
   - Add import at top (lines 1–29)
   - Add state after existing state (respect hook ordering — see above)
   - Add render JSX in the correct tab section
   - Add to overlay stack before the footer if it's a modal/panel
4. **Always run build check:** `npm run build` — must show `✓ built` with no errors
5. **File size limit:** Keep each component under 300 lines. If larger, split into sub-components.

---

## What Marcel Does vs What AI Does

| Marcel | AI |
|--------|----|
| Describes the feature in plain English | Writes all code |
| Reviews the result visually in browser | Reads files before editing |
| Decides priority and direction | Proposes implementation plans |
| Tests interactions by clicking | Runs `npm run build` to verify |
| Reports bugs ("it's black", "button doesn't work") | Diagnoses and fixes root cause |

---

## Known Constraints

- **No server** — everything is `localhost`. No API calls to external services.
- **No database** — localStorage only. Max ~5MB per origin.
- **No TypeScript** — plain JavaScript + JSX.
- **No CSS modules / Tailwind / styled-components** — inline styles only.
- **Single-page app** — no routing library; tab switching is a state variable.
- **Vite only runs in dev mode** — there is no production server. `npm run build` creates a `dist/` folder but it is not deployed anywhere.

---

## Running on iPhone (Same WiFi)

1. `launch.sh` detects the desktop's LAN IP and writes it to `public/lan-access.json`
2. The app fetches this file and displays the phone URL in Command Hub → Configuration
3. Open that URL on iPhone Safari → Share → Add to Home Screen for app-like experience
4. `vite.config.js` has `host: true` so the server listens on all network interfaces

---

## Inspirations

Iron Sovereign draws from four sources. All multiplayer features have been re-imagined as solo mechanics.

### [Solo Leveling](https://en.wikipedia.org/wiki/Solo_Leveling)
The manhwa/anime that popularized the "status screen RPG" aesthetic. The core inspiration for Iron Sovereign's visual language: dark UI, gold accents, rank tiers, and the idea that daily real-world activity produces visible stat growth on a character sheet. The *Hunter rank* system (E→D→C→B→A→S) is on the roadmap.

### [FitRPG (fitrpg/fitrpg-ionic)](https://github.com/fitrpg/fitrpg-ionic)
An open-source fitness RPG that converts Fitbit data (steps, sleep, distance, workouts) into character attributes (STR, DEX, END, VIT). Iron Sovereign uses the same fitness-data-to-stat pipeline concept, extended to support Liftosaur, Cronometer, Renpho, and Apple Health. FitRPG introduced the concept of timed quests with failure penalties — a feature on Iron Sovereign's roadmap.

### [Habitica](https://habitica.com/)
The gold standard for gamified habit tracking. Key mechanics borrowed or planned:
- **Positive & negative habits** — good habits grant XP, bad habits cost HP
- **Three task layers** — Dailies, Habits, and To-Dos (Iron Sovereign uses Quests as the unified layer)
- **Boss HP bars** — boss quests visually drain a boss's HP bar as you complete goals (planned)
- **Equipment drop system** — completing quests has a chance to drop gear items (planned)
- **Pet evolution** — pets level up when fed and evolve into mounts (Iron Sovereign has pets, evolution is planned)
- **Class spells** — class-specific abilities tied to your dominant stat (planned)
- **Custom rewards** — user-defined IRL rewards with MANA cost (planned)

### [RPG Fitness / Gamified Fitness Apps (2025)](https://www.workoutquestapp.com/top-gamified-fitness-apps-of-2025)
The broader ecosystem of fitness RPGs in 2025 (Fitscape, LevelUP, INFITNITE) contributed several concepts:
- **Dungeon system** — timed multi-stage challenges with room-by-room rewards (planned)
- **Skill point allocation on level-up** — choose which stat to boost when you level (planned)
- **Chapter-based story missions** — a narrative arc where fitness goals drive a storyline (planned)
- **Character classes** affecting stat growth rates (Iron Sovereign's tier system is the foundation)

---

## Roadmap (Inspired Features)

Features inspired by the above apps, not yet built:

| Feature | Inspiration | Priority |
|---------|-------------|----------|
| ~~Hunter rank advancement (E→S class)~~ | ~~Solo Leveling~~ | ✅ v3.4 |
| Bad habit tracker → HP damage | Habitica | High |
| Timed quests with failure penalties | FitRPG | High |
| Boss HP bar visualization | Habitica | Medium |
| ~~Skill point allocation on level-up~~ | ~~FitRPG / Fitscape~~ | ✅ v3.4 |
| ~~Quest drop system (random gear)~~ | ~~Habitica~~ | ✅ v3.4 |
| Custom MANA-cost personal rewards | Habitica | Medium |
| Dungeon run system (multi-stage) | Fitscape / LevelUP | Medium |
| Pet evolution → mounts | Habitica | Low |
| Class spells (Warrior/Mage/Rogue/Healer) | Habitica | Low |
| Seasonal events (monthly themed quests) | Habitica | Low |
| Freeze day (MANA cost, no penalty) | Habitica | Low |
| Chapter story missions | INFITNITE | Low |
| Shadow archives (boss trophy hall) | Solo Leveling | Low |

---

## Version History

| Version | Description |
|---------|-------------|
| V1 | Basic stat display, manual data entry |
| V2.0 | CSV import engine, XP ledger, RPG theming |
| V2.1 | Toast notifications, drag-drop CSV, workout logger, PWA |
| V2.2 | Settings panel, data manager, notification center, macro calc, quest builder, day detail panels, global animations, mobile responsive styles |
| V2.3 | New gear/pets/spells: 14 gear items, 4 pets, 4 spells |
| V2.4 | LootChest cinematic overlay on boss encounter defeats |
| V2.5 | Quest tier system (Daily/Weekly/Boss), 22 default quests, streak dashboard |
| V2.6 | RPG SVG icon pack (41 icons): quests, spells, encounters, gear |
| V2.7 | Weekly summary XP card, weekly quest 7-day auto-reset |
| V2.8 | Sound effects, armor rating, flavor text, spell effects, gear compare, macro chart, PRs, Phoenix Saga chain quests, workout chart, BF% chart, confetti burst |
| V2.9 | Full iOS mobile view: responsive grids, safe-area insets, viewport-fit=cover |
| V3.0 | Apple Health CSV support, XP engine 0-XP reimport fix |
| V3.1 | GitHub infrastructure: labels, issue templates, PR template, CI workflow |
| V3.2 | Tracking + RPG Mechanics: weigh-in streak, calorie deficit tracker, water counter, bodyweight trend line, prestige system, raid boss events, debuff system, gear durability |
| V3.3 | UI/QoL: Today at a Glance, 84-day activity heatmap, milestone notes, export CSV, import diff panel, light/dark theme, push notification reminders |
| V3.4 | Hunter Rank (E→S, weight-based, S=185 lbs goal), Skill Points on level-up, Gear Drops from quests |
