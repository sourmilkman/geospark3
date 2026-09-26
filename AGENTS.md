# GeoSpark 3 — agent notes

## What this is
Mobile-first geography quiz PWA (vanilla JS, no build step). Served from GitHub Pages at `/geospark3/`. `GeoSparkTWA/` is the Android Trusted Web Activity wrapper (Gradle).

## Files
- `index.html` — all screens as `<section class="screen">`; only one visible at a time via `setScreen()`.
- `src/app.js` — everything: passport (save), characters, question generation, timer, badges, globe.
- `src/styles.css` — design tokens in `:root`; v0.6.0 additions are at the end.
- `sw.js` — cache-first service worker; precaches shell, data and `assets/flags/*.webp`.
- `data/*.json` — `{name, cc, capital, city, continent}`; `cc` is the unique key (US states are `us-xx`).

## Conventions
- Bump version in 3 places (see README). Never change manifest `id`.
- Owner works on Windows PC and Android; the main HTML must stay `index.html`.
- Taps use `onPress()` (pointerup + keyboard click). Post-answer delays go through `schedule()` so leaving a run cancels them.
- `state.answered` guards against double answers; check it in any new input path.
- Distractors must be the same kind as the answer (country vs US state) — use `pickDistractors()`.
- Stats are keyed by `cc`. Badges are data-driven in `BADGES`; add one by giving `id, name, icon, category, desc, tiers|tiersFn, value()`.
- `window.__geospark` exposes state for automated tests.

## Testing
Serve the folder (`python3 -m http.server`) and drive it with Playwright at 412×915; check no console errors, a Journey run per character, Last Chance, resume after reload, and the Stamp Book.

## Open decisions
- Contested/multiple capitals (Bolivia, South Africa, Eswatini, Nauru, Israel/Palestine) currently accept a single answer.
- Reverse question modes (country → pick the flag) from v1 not yet restored.
