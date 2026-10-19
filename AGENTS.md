# AGENTS.md: start here if you are an LLM or coding agent

This file is tool neutral. Any assistant (Claude, ChatGPT, Gemini, a local model, a coding agent) should be able to continue the project from this file alone, plus `LOG.md` and `docs/FINDINGS.md`.

Last updated: 2026-10-19 by Claude (Sonnet 5.5, Anthropic), directed by Nathan.

## 1. Read order

1. This file.
2. `LOG.md`: read the last two entries to see what happened most recently.
3. `docs/FINDINGS.md`: what is verified and what is not. Do not assume anything marked UNVERIFIED.
4. `README.md` and then `index.html` (the header comment has the change log).

## 2. The project in one paragraph

WindowJet is a single-file web page (`index.html`) for a wall-mounted Samsung Galaxy Tab. It shows the aircraft nearest to a window, as seen through that window: a plane sprite is drawn at its true position in the sky (left to right across the window), and below it are the callsign, airline, route, altitude, speed, vertical rate and aircraft type in big type. Nathan wants a clean, large design, not 200 facts. It replicates the idea of the JetClock app/device (jetclock.io). It has a demo mode with fake planes and a live mode that needs a data relay that does not exist yet.

## 3. Rules for every contributor (human or LLM)

These come from Nathan. Follow all of them.

1. **Sign every edit.** Say who directed it (Nathan), who wrote it (your model name, vendor, and version if you know it), and the date (YYYY-MM-DD).
2. **Keep a dated change log.** Add an entry to the header comment of `index.html` (and to `CHANGELOG.md`) for every change to a file. Docs-only or comment-only changes get an entry too, marked as such.
3. **Append to `LOG.md`** at the end of every working session (format in section 8).
4. **Facts: cite or flag.** Any important fact (API behavior, rate limits, device specs, rules) needs a source or an explicit UNVERIFIED tag. Nathan prefers no answer to a wrong answer. Never invent API field names, limits or terms.
5. **Be honest.** If Nathan is wrong, say so politely. Do not just agree. Report test failures and things you could not test.
6. **Write plainly.** No em dashes in written replies or docs. Friendly, professional tone, a little humor is welcome.
7. **Metric by default** (m, km/h, m/s, Celsius). Aviation units (ft, kt, fpm) are available through `?units=aviation`.
8. **Do not create accounts or handle credentials for Nathan.** He creates accounts (GitHub, Cloudflare) himself. Never put keys or secrets in this folder.
9. **Keep storage in this folder.** It lives in Google Drive. If two assistants might edit at once, check the last `LOG.md` entry first to avoid overwriting each other.
10. **Run both test files** (section 6) before you hand over, and report the counts.
11. **Keep Nathan's home coordinates out of every file.** The page may be hosted publicly. He supplies them in the page address (`?lat=...&lon=...`) from the tablet's bookmark. Never write them into `index.html`, the docs, tests or the log. For tests, use made-up coordinates.

## 4. Constraints on `index.html`

- **Single file, no build step.** Everything (HTML, CSS, JS) stays in `index.html`.
- **ES5 JavaScript only**: `var`, `function`, no arrow functions, no `let`/`const`, no template literals, no `?.` or `??`. Reason: the tablet is old (Galaxy Tab A6, launched 2016) and its browser may be old. Which Chrome version it runs is UNVERIFIED.
- **No external libraries or fonts**, so it works offline-ish and loads fast.
- The pure logic sits above a line that says `if (typeof document === 'undefined') { return; }` so that Node can load it for tests. Keep new pure logic above that line and export it in the `api` object.
- Do not break demo mode. It is the only mode that can currently be shown working.

## 5. How the code works

Config: the `CONFIG` object at the top of the script (URL options override it). Key values: `HOME_LAT/HOME_LON` (placeholders until Nathan supplies his), `WINDOW_HEADING` (190), `FOV_DEG` (140), `MAX_DIST_NM` (6), `MAX_ALT_FT` (12000), `EL_MAX_DEG` (25), `RADIUS_NM` (10), `POLL_MS` (5000), `UNITS`, `API_BASES`, `ROUTE_API`.

Pure functions (unit tested):

| Function | Job |
|---|---|
| `normalize(raw, now)` | Turn one API record into a clean aircraft, or null (on the ground, no position, no altitude). Adds `_t` (time of fix) and `_k` (simulator time scale, always 1 for real data). |
| `evaluate(ac, now, cfg)` | Dead-reckon the aircraft to now (capped at 60 s, times `_k`), then compute distance, azimuth `az`, elevation `el`, relative bearing `rel = norm180(az - heading)`, and `inFov`. |
| `isCandidate(ev, cfg)` | In the field of view, within max distance and altitude, above 0 ft. |
| `pick(list, now, cfg, currentHex)` | Choose the aircraft to show: keep the current one while it stays valid, otherwise the nearest. |
| `spriteDir(track, heading, prev)` | +1 moves right on screen, -1 moves left. Looking out a south-facing window, west is on the right, so a westbound plane moves right. Near head-on or tail-on keeps the previous direction. |
| `pitchDeg(vr, gs)` | Nose tilt for the sprite, exaggerated 1.5 times, clamped to plus or minus 22 degrees. |
| `formatStats(...)` | Metric or aviation numbers for the panel. |
| `parseRoute(json)` | Read an adsbdb route response. |
| `simRaw`, `simAlive`, `DEMO_PRESETS` | Demo simulator. Positions are nautical miles east (`e0`) and north (`n0`) of home. |

Screen mapping: `x = (0.5 + rel / FOV_DEG) * skyWidth`, `y = (0.90 - el / EL_MAX_DEG * 0.80) * skyHeight` (clamped to 8 to 90 percent of the height). The plane is drawn at its true sky position and moves by dead reckoning every animation frame, so it glides between data updates.

Browser side: `poll()` fetches (or in demo mode calls `demoTick()`), `handleList()` normalizes, `frame()` runs every animation frame (re-picks twice a second, updates text twice a second), `ensureRoute()` looks up the route by callsign and caches it (a 404 is cached as "no route"), `buildDemoBar()` makes the demo buttons.

Modes: no `lat`/`lon` in the address means demo mode. Giving `lat` and `lon` means live mode. Live mode tries each entry in `API_BASES` in turn, moving to the next after a failure.

## 6. Tests

```
node tests/test_windowjet.js index.html          # expect: 49 passed, 0 failed
node tests/dom_test.js <path-to-jsdom> index.html  # expect: 34 passed, 0 failed
```

`jsdom` must be installed first (see `README.md`). jsdom has no layout engine, so these tests prove logic and wiring, not appearance. If you add features, add tests, and update the expected counts here and in `README.md`.

## 7. Current state and next steps (as of 2026-10-19)

State: v0.3.1. Demo mode done. Live mode blocked: the public plane-position feeds (adsb.lol, adsb.one, adsb.fi, airplanes.live) send no CORS header, so a web page cannot call them (tested 2026-10-19; details in `docs/FINDINGS.md`). The route lookup (adsbdb) does work from a browser.

Next steps, in priority order:

1. **Build a CORS relay.** Proposed: a Cloudflare Worker that takes `GET /v2/point/:lat/:lon/:radius`, fetches it from adsb.lol (fall back to adsb.one) server side, returns the JSON with an `Access-Control-Allow-Origin` header limited to Nathan's GitHub Pages origin, and caches for about 5 seconds (the adsb.one docs state a limit of 1 request per second). Blocked on Nathan creating a free Cloudflare account and deploying the script himself. Also check the feeds' terms for server-to-server use first (UNVERIFIED). Then set `CONFIG.API_BASES` to the Worker URL.
2. **Test live on the real tablet** with `?debug=1`: confirm the real JSON field names (`ac`, `flight`, `alt_baro`, `gs`, `track`, `baro_rate`, `t` are written from the documented ADSBExchange v2 format and have never been seen from the live feed), and confirm the layout and old-browser support.
3. **Keep the screen awake** on the tablet. Ideas (all UNVERIFIED on this device): Android's stay-awake-while-charging developer option, or a kiosk browser.
4. **Visual polish** once Nathan has seen it on the tablet (spacing, text sizes, plane drawing).
5. **Optional:** DCA runway-flow logic (which way departures fly depends on the runway in use). Verify how DCA flows work from sources before coding anything.

Open questions for Nathan: his GitHub username and repo name (his window coordinates were given in chat on 2026-10-19 and are kept out of the files on purpose, see rule 11), the exact tablet model plus its Android and Chrome versions, whether the tablet is mounted portrait or landscape, and whether he wants the plane photo or other extras (he leans toward fewer facts).

## 8. LOG.md entry format

Append at the end of `LOG.md`:

```
## YYYY-MM-DD HH:MM (time zone): <short title>
Who: <model, vendor>, directed by Nathan
Did: <what changed, file by file>
Verified: <what you actually tested and the result>
Not verified: <what you could not test>
Decisions: <choices made and why>
Next: <what should happen next>
```

## 9. Handoff checklist

- [ ] Both test files run, counts reported.
- [ ] `index.html` header change log updated, edit signed.
- [ ] `CHANGELOG.md` updated.
- [ ] `docs/FINDINGS.md` updated if you learned or tested anything about APIs or devices.
- [ ] `LOG.md` entry appended.
- [ ] Section 7 of this file updated if the state or next steps changed.
