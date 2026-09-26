# GeoSpark 3

A mobile-first geography progression game (PWA, also wrapped for Android as a TWA in `GeoSparkTWA/`).

Current game version: `0.6.0`

## Versioning

Each gameplay/content update bumps **all three**:
1. `APP_VERSION` in `src/app.js`
2. the visible `GeoSpark vX.Y.Z` labels in `index.html`
3. `CACHE_NAME` in `sw.js`

Do not change the manifest `id` (`/geospark3/`) — it is the app's install identity.

## Characters

Chosen at passport creation and switchable any time from the menu (progress is shared).

| | Historian | Backpacker | Pilot |
|---|---|---|---|
| Passive | 25s timer | 4 hearts, +1 heart per 10 correct | Double points, Tailwind bonus (+50, +2 AM) under 4s |
| Ability (per run) | Recall ×2: remove two wrong answers | Ask a Local ×3: clue (first letter, length, region) | Autopilot ×1: skip a question, keep the streak |
| Trade-off | Half streak bonus | Standard scoring | 12s timer, 2 hearts |
| Question bias | Capitals and cities | Flags | Map questions from level 1 |

## Modes

- **Journey**: 6 cumulative stages × 10 levels × 10 questions. Runs save automatically and resume after exit or app close.
- **Challenge**: timed arcade run (75s / 60s / 45s by character).
- **Learning**: browse all 245 territories; a "Missed" tab appears after a run.
- **Stamp Book**: 18 achievement stamps, each Bronze/Silver/Gold, paying 50/150/400 AirMiles.
- **Zen**: no timer, no hearts. Unlock by completing Stage 3 or spending 1,500 AirMiles.

## Failure rules

Running out of hearts triggers **Last Chance** once per run (answer correctly to revive with 1 heart). If that fails, only the current level's question progress resets — no level or currency loss. Every completed level returns 1 heart.

## Progression

1. Europe
2. South America + Europe
3. Asia + previous
4. US States + previous
5. Africa + previous
6. Global Master

## Persistence

`localStorage` key `geospark3.passport` (passport version 2). Version 1 saves migrate automatically (levels are rescaled to the shared 10-level pacing). Per-territory stats drive adaptive question weighting and the mastery stamps.

## Data and assets

- Geography: modular JSON in `data/` (195 countries + 50 US states).
- Flags: bundled 160px WebP in `assets/flags/` — countries from `svg-country-flags` (public domain), US states rendered from `us-state-flags` (ISC). No external CDN, so flags work offline.
- `europe_map.json` and `world_globe.json` load in the background after the menu is ready.

## PWA

Standalone portrait manifest; the service worker precaches the shell, data and every flag.
