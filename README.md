# 🌍 GeoSpark

**Geography trivia that learns you.**

An installable PWA geography quiz game with adaptive difficulty, multiple game stages, and a self-improving learning system.

## Features

- **7 Game Stages** that unlock as you level up:
  - 🏳️ **Flags** (Level 1) — Identify countries by flag and vice versa
  - 🏛️ **Capitals** (Level 5) — Match countries to capitals
  - 🌍 **Continents** (Level 10) — Place countries on the right continent
  - 🌍 **African Countries** (Level 15) — Deep dive into African flags and capitals
  - 🔍 **Lesser Known** (Level 20) — Obscure countries from every continent
  - 🗺️ **Maps** (Level 25) — Tap countries on interactive continent maps
  - 🇺🇸 **US States** (Level 30) — Tap states and Canadian provinces on maps

- **Adaptive Difficulty** — The game tracks which countries you struggle with and serves them more often. Mastered countries fade to the background. Timer shrinks as you level up. Higher levels use same-continent distractors.

- **87 Countries** across 6 difficulty tiers with inline SVG flags (PC) or native emoji flags (mobile)

- **Sound Effects** — Web Audio API synthesized sounds for taps, correct/wrong answers, timeouts, level-ups, and game over

- **Learning Page** — Browse all countries grouped by continent with flags and capitals

- **Debug Tools** — Admin panel with passcode-protected level jumping for testing

- **PWA** — Installable as a standalone app with offline support via service worker

## How to Play

Open `index.html` in any modern browser. Works on both desktop and mobile.

To install as a PWA, serve over HTTPS (e.g. via [Netlify Drop](https://app.netlify.com/drop)) and use "Add to Home Screen".

## Admin Codes

Access via Learn page → Debug Tools:

| Code | Level |
|------|-------|
| `0005` | Level 5 (Capitals) |
| `0010` | Level 10 (Continents) |
| `0015` | Level 15 (African Countries) |
| `0020` | Level 20 (Lesser Known) |
| `0025` | Level 25 (Maps) |
| `0030` | Level 30 (US States) |
| `1337` | All levels |

## Tech

- Single HTML game shell, zero dependencies
- Inline SVG flags for cross-platform rendering
- Web Audio API for sound synthesis
- `requestAnimationFrame` timer for smooth performance
- `localStorage` for player profile persistence
- PWA manifest and same-origin service worker
