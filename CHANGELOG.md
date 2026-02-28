# Changelog

All notable changes to Iron Sovereign are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [v3.3] — 2026-02-28
### Added
- **Today at a Glance** — 5-stat summary card at top of Battle tab (weight, calories, protein, water, workout status)
- **84-day Activity Heatmap** — GitHub-style contribution grid in Journey tab (gold = weight logged, green = macros logged, bright green = both)
- **Milestone Notes** — text log with optional ⭐ flag in Journey tab, persisted to localStorage (max 100 entries)
- **Export Ledger CSV** — downloads all logged data (date/cals/protein/weight/steps/sleep) from Journey tab
- **Import Diff panel** — shown in Command Hub after each CSV import: XP entry count, date range, per-stat XP totals
- **Light/Dark theme toggle** — CSS `invert(1) hue-rotate(180deg)` filter approach, toggled in Settings
- **Daily Reminder notifications** — Notification API permission request + once-per-day reminder at configured time
- **PWA manifest shortcuts** — defined constant for Daily Log, Journey, Quests shortcuts (ready for VitePWA integration)
- Settings: `theme`, `notifEnabled`, `notifTime` added to DEFAULTS
- localStorage: `iron_sovereign_milestone_notes`, `iron_sovereign_last_notif`

---

## [v3.2] — 2026-02-27
### Added
- **Weigh-in Streak** — 7th streak card (⚖️), incremented on each Renpho import
- **Calorie Deficit Tracker** — weeklyDeficit useMemo (TDEE − actual calories) + projected lbs lost card in Journey tab
- **Water Counter** — +/− tap buttons in daily log, turns cyan at target, +10 MANA on goal hit
- **Bodyweight Trend Line** — 90-day weight history with 7-day rolling average chart in Journey tab
- **Prestige System** — weight ≤ 200 lbs triggers full-screen overlay + unlocks 3 Sovereign gear items
- **Raid Boss Events** — 3 weekly challenges (200–250 XP) in Quests tab, weekly auto-reset
- **Debuff System** — Atrophy/Malnourished/Exhausted debuffs appear in Battle tab after 2+ days without a log; cleared on submit
- **Gear Durability** — earned gear degrades 10% on missed workout days; repair costs 20 MANA (+30%)
- QuestBuilder: `raid` type added to TYPE_META and FILTER_TABS
- Settings: `tdee` and `waterTarget` added to SettingsPanel Targets section
- localStorage: `iron_sovereign_weight_history`, `iron_sovereign_durability`, `iron_sovereign_prestige`, `iron_sovereign_raid_quests`, `iron_sovereign_last_submit`

---

## [v3.1] — 2026-02-26
### Added
- GitHub repository: https://github.com/Ncaofa1996/iron-sovereign
- Labels: bug · feature · enhancement · ui/ux · performance · refactor · blocked
- Issue templates: bug_report.md, feature_request.md
- PR template with build checklist
- CI workflow: GitHub Actions runs `npm ci` + `npm run build` on push/PR to main
- PR-based merge flow established (feat/fix branches → squash merge)
- DeepWiki indexing: https://deepwiki.com/Ncaofa1996/iron-sovereign

---

## [v3.0] — 2026-02-25
### Added
- **Apple Health CSV support** — `parseAppleHealthAsFitbit()` handles M/D/YY dates, comma-number formatting, "6h 54m" sleep, multi-row-per-day aggregation
- Command Hub label updated to "Apple Health / Fitbit" with 🍎 icon
### Fixed
- XP engine 0-XP reimport bug — days that previously got 0 XP are now always re-importable

---

## [v2.9] — 2026-02
### Added
- Full iOS mobile view: `isMobile` state + resize listener
- Responsive grid layouts for all 6 critical sections (battle, character, daily log, gear, quests, spellbook)
- Streak cards: 6 → 3 columns on mobile
- viewport-fit=cover, safe-area insets, 24px touch targets for checkboxes

---

## [v2.8] — 2026-01
### Added
- Sound effects via Web Audio API (quest complete, level-up, loot drop, spell cast, all-dailies confetti) — toggle in Settings
- Armor rating useMemo (calculated from equipped gear)
- Rotating encounter flavor text
- Combat log filter chips (All / Buff / Detriment / System)
- Spell buff consumption + active buffs display
- Gear comparison panel (side-by-side stat diff)
- Macro history chart (nutrition trends over time)
- Personal Records panel (bench/squat/deadlift/OHP/pullups/steps)
- Phoenix Saga chain quests (5-stage narrative quest arc)
- Workout XP chart (strength training volume over time)
- Calorie precision streak tracking
- Body Fat % trend chart
- All-dailies confetti burst on completing every daily quest

---

## [v2.6] — 2025-12
### Added
- 41 RPG SVG icons in `public/icons/` for quests, spells, encounters, and gear
- Icons rendered with `mixBlendMode: "screen"` + CSS filter colorization

---

## [v2.5] — 2025-12
### Added
- Quest tier system: DAILY / WEEKLY / BOSS types with filter tabs
- 22 default quests (12 daily + 6 weekly + 4 boss), up from 6
- 7-day auto-reset for weekly quests (localStorage key: `iron_sovereign_weekly_quest_reset`)
- Streak dashboard: 6-card display (Workout/Protein/Sleep/Steps/INT/Cals) with flame color scaling
- Weekly Summary "This Week" XP card in Journey tab

---

## [v2.4] — 2025-11
### Added
- LootChest component (`src/components/LootChest.jsx`) — cinematic overlay on boss weight threshold crossings and boss quest completion
- Boss weight thresholds: 220 lbs (Bronze), 212 lbs (Silver), 207 lbs (Silver), 200 lbs (Gold)

---

## [v2.3] — 2025-11
### Added
- 14 new gear items including Mythic "Heart of the Phoenix" and Legendary "Grip of the Iron Lord"
- 4 new pets: Crimson Dragon, Ancient Tortoise, Phoenix Hatchling, Storm Hawk
- 4 new spells: Iron Aegis, Momentum, Deep Focus, Battle Cry (8 spells total)

---

## [v2.2] — 2025-10
### Added
- Settings panel (slide-in, right edge)
- Data manager (ledger table + JSON backup/restore)
- Notification center (bell icon with unread badge)
- Macro calculator modal
- Quest builder
- Day detail panels (click XP chart bar)
- Global CSS keyframe animations
- Mobile responsive styles

---

## [v2.1] — 2025-09
### Added
- Toast notification system
- Drag-and-drop CSV import zone
- Workout logger tab (live logging with rest timer)
- PWA manifest + service worker (installable on iPhone)

---

## [v2.0] — 2025-08
### Added
- CSV import engine (Liftosaur, Cronometer, Renpho, Fitbit)
- XP ledger (localStorage, idempotent imports)
- RPG theming: dark UI, gold accents, character stats

---

## [V1] — 2025-07
### Added
- Basic fitness stat display
- Manual data entry
