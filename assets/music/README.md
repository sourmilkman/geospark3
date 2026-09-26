# Music

Tom's tracks, used with these exact names:

- `menu.mp3` — menus, Learning, Stamp Book, results, Zen
- `gameplay.mp3` — Journey and Challenge

## Gapless loop format

Each file = one bar-aligned loop **plus a 2 s copy of the loop's start appended to the end**.
The game plays two copies and hands off at the loop point (see `MUSIC_TRACKS` in `src/app.js`),
because the browser's built-in `loop` leaves a short silent gap.

| File | Loop length (s) | Total (s) |
|---|---|---|
| menu.mp3 | 146.0767 | 148.11 |
| gameplay.mp3 | 108.2282 | 110.26 |

If you replace a track: trim it to whole bars, append its first 2 s, export 128 kbps MP3 at about -16 LUFS
(true peak ≤ -3 dB), then update the `loop` value in `MUSIC_TRACKS`.
