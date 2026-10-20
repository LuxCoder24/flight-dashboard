# AGENTS.md: start here if you are an LLM or coding agent

This file is tool neutral. Any assistant (Claude, ChatGPT, Gemini, a local model, a coding agent) should be able to continue the project from this file alone, plus `LOG.md` and `docs/FINDINGS.md`.

Last updated: 2026-10-20 by GPT-6 (OpenAI), directed by Nathan.
Change: v0.10 clears idle trails, uses ADSB.lol listed itineraries and refreshes the display with simple icons; prior rules retained.

## 1. Read order

1. This file.
2. `LOG.md`: read the last two entries to see what happened most recently.
3. `docs/FINDINGS.md`: what is verified and what is not. Do not assume anything marked UNVERIFIED.
4. `README.md` and then `index.html` (the header comment has the change log).

## 2. The project in one paragraph

WindowJet is a single-file web page (`index.html`) for a wall-mounted Samsung Galaxy Tab. It shows the aircraft nearest to a window, as seen through that window: a plane sprite is drawn at its true position in the sky (left to right across the window), and below it are the callsign, airline, route, altitude, speed, vertical rate and aircraft type in big type. Nathan wants a clean, large design, not 200 facts. It replicates the idea of the JetClock app/device (jetclock.io). It has demo and live modes, plus a geographic setup map (`map.html`) that configures the main display viewing wedge. The relay in `worker/` was deployed by Nathan; see the relay sessions in LOG.md for its last known failure and diagnostic handoff. Current production configuration was not inspected during the map session.

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

## 4a. Separate map edition

`map.html` is also a self-contained ES5 page with no external libraries or fonts. Geographic tile images are the only basemap dependency. Keep the original window edition intact. Map geometry helpers are exported above the document guard for tests. `inZone` uses current dead-reckoned position, great-circle distance and bearing relative to the wedge heading. Aircraft behind the viewpoint or with a fix older than 60 seconds are excluded. Live requests use the viewpoint as the centre of a padded radius query; zone-generation tracking rejects old responses after edits. `radius` is metric km by default, nm in aviation mode. `heading` and `fov` control the wedge. Saving updates browser localStorage (key windowjet.map.view.v1) and the page address, never a project file. Saved preferences normally win over old bookmark options; useurl=1 bypasses them and demo=1 always forces demo. Validate saved records with savedOptions before use; storage exceptions must preserve functionality and report the bookmark fallback. Hamburger controls/views and the header hide after 15 seconds idle, while the hamburger and attribution remain available. All runtime location preferences stay in the browser and out of source/logs.

Tile service requirements and source are in README and FINDINGS. Automated map tests use `tiles=0` to avoid real tile requests. Basemap access from file URLs is disabled because the tile service expects a web Referer. Tests need jsdom; use an ephemeral dependency directory outside Drive if syncing interferes, as README's existing installation instructions already allow. Do not add node_modules to this synced project.

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
| `parseRoute(json)` | Legacy adsbdb parser retained for tests; not the current live lookup. |
| `parseLolRoute(raw)` | Read all airport stops from ADSB.lol standing data; label as a listed itinerary. |
| `simRaw`, `simAlive`, `DEMO_PRESETS` | Demo simulator. Positions are nautical miles east (`e0`) and north (`n0`) of home. |

Screen mapping: `x = (0.5 + rel / FOV_DEG) * skyWidth`, `y = (0.90 - el / EL_MAX_DEG * 0.80) * skyHeight` (clamped to 8 to 90 percent of the height). The plane is drawn at its true sky position and moves by dead reckoning every animation frame, so it glides between data updates.

Browser side: `poll()` fetches (or in demo mode calls `demoTick()`), `handleList()` normalizes, `frame()` runs every animation frame (re-picks twice a second, updates text twice a second), `ensureRoutes()` serializes callsign-only standing-data lookups, caches for 15 minutes and delays errors (a 404 is cached as "no route"), `buildDemoBar()` makes the demo buttons.

Modes: no `lat`/`lon` in the address means demo mode. Giving `lat` and `lon` means live mode. Live mode tries each entry in `API_BASES` in turn, moving to the next after a failure. `?api=https://...` replaces `API_BASES` with the relay (https only), so the relay address lives in the tablet bookmark and not in this public file.

Relay (`worker/worker.js`, a Cloudflare Worker): serves `GET /v2/point/{lat}/{lon}/{radius}`; refuses browsers from any origin other than `https://luxcoder24.github.io` (403) but allows requests with no Origin (address bar, curl); rounds coordinates to 2 decimals before calling the feed (privacy); clamps the radius to 25 nm; tries `api.adsb.lol` then `api.adsb.one`; treats HTTP errors, timeouts (6 s) and non-JSON as failures; returns 502 if both fail; keeps a 4 second best-effort in-memory cache; adds `X-Relay-Source`. To change the allowed website, edit `ALLOWED_ORIGINS` and deploy again.

## 6. Tests

```
node tests/test_windowjet.js index.html          # expect: 77 passed, 0 failed
node tests/dom_test.js <path-to-jsdom> index.html  # expect: 90 passed, 0 failed
node worker/test_worker.mjs                        # expect: 25 passed, 0 failed (needs nothing installed)
node tests/test_map.js map.html                     # expect: 55 passed, 0 failed
node tests/map_dom_test.js <path-to-jsdom> map.html  # expect: 79 passed, 0 failed
```

`jsdom` must be installed first (see `README.md`). jsdom has no layout engine, so these tests prove logic and wiring, not appearance. If you add features, add tests, and update the expected counts here and in `README.md`.

## 7. Current state and next steps (as of 2026-10-19)

State: v0.10 prepared: clock trails clear, simple flat aircraft/helicopter icons, refreshed typography and ADSB.lol listed itineraries. The public static UAL2224 route file returned 200 with CORS wildcard and PHX-IAH-DCA; dated active legs remain unverified. Main display uses the validated saved map wedge and reach, no legacy altitude ceiling, 60-second freshness and up to three aircraft. Setup is map.html, reached through the hamburger. Both pages retain failure cooldown and hidden-tab polling pause from v0.9.1 (published c4ee62d541181bd77b2c111b45e5b760ae1672ff). Nathan's screenshot showed adsb.lol 429 and adsb.one 403 inside relay 502; upstream recovery remains unverified. No Worker deployment occurred here. Demo is the default without a location, unless validated saved browser preferences supply live mode; demo=1 always forces simulation. View choices remain Auto, single focus and multi, with at most three aircraft. Hosted at https://luxcoder24.github.io/flight-dashboard/ . Test counts: 77 window logic, 90 window page, 25 relay mocks, 55 map logic and 79 map page, total 326. Check latest LOG.md for publication status. All real location preferences stay in the browser and out of source, docs and logs.

Next steps, in priority order:

1. **Redeploy the diagnostic CORS relay** (written in v0.4; see latest LOG entry). Design: a Cloudflare Worker that takes `GET /v2/point/:lat/:lon/:radius`, fetches it from adsb.lol (fall back to adsb.one) server side, returns the JSON with an `Access-Control-Allow-Origin` header limited to Nathan's GitHub Pages origin, and caches for 4 seconds in memory (the adsb.one docs state a limit of 1 request per second). Nathan already created the account and deployed the initial relay. Inspect the diagnostic `details` response after redeployment. Also check the feeds' terms for server-to-server use first (UNVERIFIED). Then Nathan adds `&api=<worker address>` to the tablet bookmark; no code change is needed.
2. **Test live on the real tablet** with `?debug=1`: confirm the real JSON field names (`ac`, `flight`, `alt_baro`, `gs`, `track`, `baro_rate`, `t` are written from the documented ADSBExchange v2 format and have never been seen from the live feed), and confirm the layout and old-browser support.
3. **Keep the screen awake** on the tablet. Ideas (all UNVERIFIED on this device): Android's stay-awake-while-charging developer option, or a kiosk browser.
4. **Visual polish** once Nathan has seen it on the tablet (spacing, text sizes, plane drawing).
5. **Optional:** DCA runway-flow logic (which way departures fly depends on the runway in use). Verify how DCA flows work from sources before coding anything.

Open questions for Nathan: the exact tablet model plus its Android and Chrome versions, whether the tablet is mounted portrait or landscape, and whether he wants the plane photo or other extras (he leans toward fewer facts).

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

2026-10-19, GPT-6 (OpenAI), directed by Nathan: v0.8.1 fixes ground-flag normalization and clarifies window idle limits. Route-feed comparisons are recorded in docs/FINDINGS.md; provider disagreement is not a verified current itinerary.

2026-10-19 v0.9, GPT-6 (OpenAI), directed by Nathan: map.html is the viewing-zone setup tool. Save the wedge, then use Open display. index.html reads the same local saved record, overriding old bookmark location/heading/reach; useurl=1 remains an explicit bypass and demo=1 stays simulated. Saved zones remove the legacy altitude ceiling, use a padded feed radius capped at 25 nm, and reject fixes older than 60 seconds. Setup links carry zone/reach for browsers with blocked storage. Main display remains Auto/single/multi with up to three aircraft. Live callsign-route matches are shown as Route unverified instead of a confident itinerary; demo routes remain visible.

2026-10-19 v0.9.1, GPT-6 (OpenAI), directed by Nathan: both pages pause position polling while hidden and share a browser-persisted cooldown after failures. Delays grow from 30 seconds to five minutes; a direct or relay-wrapped HTTP 429 starts at least one minute, with a longer readable Retry-After honoured. Successful responses clear cooldown. Normal successful polling remains five seconds. This reduces traffic but does not establish that upstream access has recovered. No Worker deployment or account changes.

2026-10-19 v0.10, GPT-6 (OpenAI), directed by Nathan: idle transitions clear trail data/opacities and CSS hides trails in clock mode. Main display refreshed with simple flat aircraft/helicopter silhouettes, quieter sky, thinner dividers and clearer type. Live routes now read ADSB.lol's public standing-data JSON, preserving every stop and labelling it Listed itinerary; not a verified dated leg. Callsign-only lookup is serialized (at least 15 seconds apart), cached for 15 minutes, 404 cached, errors delay retries 60 seconds and respect the shared feed cooldown. No coordinates sent to the route service.

2026-10-19, GPT-6 (OpenAI), directed by Nathan: TEMPORARY MAINTENANCE enabled in both pages at Nathan's request. Browser initialization and live polling stop; saved preferences stay intact. Resume by changing MAINTENANCE_ENABLED true to false in index.html and map.html. v0.10 changes remain behind the screen. Tests: node tests/maintenance_test.js <path-to-jsdom>, expect 12 passed. Normal DOM suites disable maintenance only in their fixtures.

2026-10-20, GPT-6 (OpenAI), directed by Nathan: maintenance disabled in index.html and map.html at Nathan's request. Saved viewing zone remains intact. tests/maintenance_test.js now verifies both the optional enabled screen and the resumed production default, 12 checks. Live relay recovery is being checked using public airport coordinates, not the saved private viewpoint.

2026-10-20, GPT-6 (OpenAI), directed by Nathan: Force retry in the display and setup menus makes one immediate position-feed request during cooldown. Pending requests cannot overlap; automatic cooldown remains after failure. Hidden in demo. Full verification: 338 checks, including 12 maintenance, passed.
