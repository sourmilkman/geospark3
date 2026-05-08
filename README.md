# GeoSpark 3

GeoSpark is now a multi-mode mobile-first geography progression game.

Current game version: `0.4.2`

## Versioning

Each gameplay/content update should bump `APP_VERSION` in `src/app.js`, the visible labels in `index.html`, and the service worker `CACHE_NAME` in `sw.js`.

## Modes

- Journey: campaign progression through 6 cumulative stages.
- Challenge: timed arcade play, unlocked from the start.
- Learning: reference mode for browsing flags, capitals, cities, and regions.
- Zen: no timer, no lives, no game over. Unlock by completing Stage 3 or spending 5,000 AirMiles.

## Progression

1. Europe
2. South America + Europe
3. Asia + Europe + South America
4. US States + all previous
5. Africa + all previous
6. Global Master

## Persistence

The passport is stored in `localStorage` under `geospark3.passport` and tracks name, archetype, stages, stamps, currencies, unlocks, and high score.

## Data

Geography content is modular JSON in `data/`, so stage pools can be extended without changing the mode controller.

## PWA

The app includes a standalone portrait manifest, supplied 192/512 icons, and a service worker that caches the shell plus JSON geography data for offline play.
