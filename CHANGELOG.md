# Changelog

Every entry: version, date, who wrote it, who directed it. Newest at the bottom. The same entries are in the header comment of `index.html`.

## v0.1 (2026-10-19)
Written by Claude (Sonnet 5.5, Anthropic), directed by Nathan.
- Initial single-file page: polls a public ADS-B API, picks the nearest aircraft inside the window's field of view, animates it at its true sky position, shows callsign, route, altitude, speed, vertical rate and aircraft type.
- Demo mode (`?demo=1`). Written in ES5 for an old Galaxy Tab A6.

## v0.2 (2026-10-19)
Written by Claude (Sonnet 5.5, Anthropic), directed by Nathan.
- Demo control bar: buttons for departure west, departure east, arrival, heavy jet, helicopter, head-on, random, clear sky, and a 1x/3x/6x fast-forward.
- Aircraft records gained an optional `_k` time scale, used only by the simulator.
- Fix found in testing: simulated planes start just inside the edge of the window's view so they appear right after a click.

## v0.3 (2026-10-19)
Written by Claude (Sonnet 5.5, Anthropic), directed by Nathan.
- Demo mode (fake planes only) is now the default whenever no `lat`/`lon` is given, so the page works when simply opened.
- Reason: browser testing showed the public ADS-B feeds block requests from web pages (CORS), so live data needs a relay that is not built yet.

## v0.3.1 (2026-10-19)
Written by Claude (Sonnet 5.5, Anthropic), directed by Nathan.
- Header comment only: pointer to the project docs. No code change.
- Project folder set up: README, AGENTS, LOG, CHANGELOG, docs/FINDINGS, tests.
- Docs rule added: home coordinates are never stored in files (AGENTS.md rule 11).

## v0.4 (2026-10-19)
Written by Claude (Sonnet 5.5, Anthropic), directed by Nathan.
- `index.html`: new `?api=https://...` option points live mode at the relay Worker (https only). Not yet tried against a deployed relay.
- New `worker/` folder: `worker.js` (the relay, v0.1), `wrangler.jsonc`, `test_worker.mjs` (25 mock checks). Compiles under `wrangler deploy --dry-run`. Never deployed.
- `tests/dom_test.js`: two new checks for the `?api=` option (36 total).
- New `docs/RELAY_SETUP.md` (deploy steps for Nathan, with what is verified and what is not).
- README, AGENTS, FINDINGS and LOG updated.

## Familiarisation, docs and comment only (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- Read the project documentation, page code and relay code, and checked available past-chat titles for relevant context.
- Recorded the review and verification limits in LOG.md; added the required index.html header entry. No application behaviour changed.

## v0.5 (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- index.html: inline helicopter silhouette for recognised type codes, up to three nearest eligible aircraft with labelled sprites and matching information cards, automatic focus/multi switching, manual view controls and `?view=auto|single|multi`. Single focus remains sticky. ES5, metric defaults and demo mode retained.
- tests/test_windowjet.js and tests/dom_test.js: selection, classification, automatic/manual mode, three-aircraft cap, cleanup, labels and units checks. Totals: 61 logic and 54 page checks pass.
- AGENTS.md and README.md: new behaviour, expected counts and current relay handoff. docs/FINDINGS.md: verified checks, heuristic limitations and Drive read failures. LOG.md: full session handoff. index.html header records all changed files through this entry.
- Restored exact captured project file contents after Drive evicted local files; no unrelated content changes intended. Temporary test tools were installed for verification.

## Post-crash verification, docs and comment only (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- Checked saved project files after the Google Drive crash. App, tests and updated docs are readable; no recovery files remain. docs/RELAY_SETUP.md still times out locally and was not edited.
- Reran tests: 61 logic, 54 page and 25 relay checks passed, zero failures. ES5 syntax passed. Added this entry, index.html header entry and LOG.md handoff; no application behaviour changes.

## v0.6: separate map edition v0.1 (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- New map.html: single-file ES5 geographic map, selectable viewpoint, heading, width and reach controls defining a forward viewing wedge. Shows all airborne aircraft in the wedge; tap for details. Includes helicopter symbols, demo/live modes, dragging and zoom controls, URL-based zone persistence, stale-fix cleanup and protection from responses for an old zone.
- index.html: Map view link carries bookmark options. Window edition otherwise unchanged. Header change log updated.
- New tests/test_map.js (35 checks) and tests/map_dom_test.js (40 checks). tests/dom_test.js adds two map-link checks (56 total); existing 61 window logic and 25 relay checks pass. Both pages pass ES5 syntax checks.
- README.md and AGENTS.md describe the separate edition, controls, limits and tests. docs/FINDINGS.md records tile-policy sources, verification and limitations. LOG.md records this session. docs/previews/map-wedge-v0.1.png is a desktop screenshot of the demo at the public airport placeholder, captured by GPT-6 (OpenAI), directed by Nathan.

## GitHub Pages publication (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- Prepared map.html, the companion window edition, tests and project documentation for publication to LuxCoder24/flight-dashboard using the connected GitHub tool.
- index.html header, README.md, AGENTS.md and LOG.md record the deployment handoff. No application behaviour changes. See LOG.md for the verified publication outcome.
- Publication confirmed: source commit 85e0bcd1befb4eaf339e28fb15f64eafb8fd7e13 reached main and the hosted map loaded with its controls and demo aircraft. README, AGENTS, FINDINGS and LOG record the verified result.

## v0.7 / map edition v0.2 (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- map.html: Save view now persists validated viewpoint/wedge, pan/zoom, units, mode and relay preferences in the current browser and restores them on reopening, including old bookmarks. Added deliberate URL override, safe storage-failure fallback and preference removal.
- Map fills the screen. The hamburger contains the existing map controls and all map/window view links. Header, hints and drawer hide after 15 seconds without input; map activity or the hamburger wakes controls. Attribution stays visible and keyboard focus is returned safely when the drawer closes.
- tests/test_map.js: 50 checks. tests/map_dom_test.js: 70 checks, including reload restoration, stale bookmark priority, live relay restoration, malformed/blocked storage, idle/wake behaviour, focus and view navigation. Existing window/relay suites retained (61, 56, 25).
- index.html header, README.md, AGENTS.md, docs/FINDINGS.md and LOG.md updated. Captured docs/previews/map-menu-v0.2.png by GPT-6 (OpenAI), directed by Nathan, using the public demo placeholder. No real location saved in project files.
- Publication verified: commit 5acc488cd5cb1307ae0ee011304fd248c08f965c deployed successfully to the existing GitHub Pages map URL. Public browser verified hamburger controls, Save view and all view links. All 262 checks passed.

## v0.8: window-view controls correction (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- index.html: the window edition now has the same hamburger and 15-second idle behaviour as the map. View buttons, Map view link, demo controls and diagnostics moved into a drawer; Escape and focus handling included. The wall shows a short live-feed retry message, while the menu preserves HTTP status and any relay details. No Worker source/configuration changes.
- tests/dom_test.js now has 73 checks covering window drawer, idle/wake, diagnostics and feed recovery. Full totals: 61 window logic, 73 window page, 25 relay, 50 map logic and 70 map page checks; both pages pass ES5 parsing.
- README.md, AGENTS.md, docs/FINDINGS.md and LOG.md updated. Captured docs/previews/window-menu-v0.8.png by GPT-6 (OpenAI), directed by Nathan, using fake demo aircraft at the public placeholder.
- Service diagnosis remains inconclusive: the configured Worker rejected the diagnostic Python client with a Cloudflare 403, while the user's screenshot shows 502. Direct adsb.lol returned 200 but no browser CORS header; adsb.one returned 403. These results do not prove why the tablet relay failed.
- Publication verified: 9ef3ccae83b95d5ad0579e2d75887c1a145e03c8 deployed successfully and the public window menu was checked. A legitimate public-page test using fabricated coordinates received three airborne aircraft and Live feed connected from the configured relay; the earlier 502 was not reproduced in that test. No server configuration was changed.

## v0.8.1 (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- index.html rejects explicit ground flags even with numeric geometric altitude; idle text explains window distance, altitude and direction filters.
- tests/test_windowjet.js adds a ground-flag regression; tests/dom_test.js checks the idle explanation. README.md and AGENTS.md update counts and note scope.
- docs/FINDINGS.md and LOG.md record public callsign comparisons, route disagreement and the unresolved screenshot discrepancy. No route provider or filtering limits changed.

## v0.9 (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- Corrected product intent: map.html configures the main display's viewing zone. Updated setup wording and display links; links carry reach for storage fallback.
- index.html consumes the same validated browser preferences and checks for changes on focus/storage/visibility. Saved zones use their full reach, no altitude ceiling, geodesic wedge bounds and 60-second freshness, with a padded feed query. Existing explicit URL bypass and forced demo stay available.
- Live route lookup results are unverified and no longer displayed as authoritative origin/destination; demo route examples stay intact.
- tests/test_windowjet.js, tests/dom_test.js and tests/map_dom_test.js cover shared zone configuration. README.md, AGENTS.md, docs/FINDINGS.md and LOG.md document this correction and test counts.

### v0.9 publication notes (2026-10-19, documentation/header only)
GPT-6 (OpenAI), directed by Nathan: index.html header, AGENTS.md and LOG.md record successful GitHub Pages deployment of f15b321 and HTTP 200 readback of the updated window/setup source. No application script change.

## v0.9.1 (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- index.html and map.html share a coordinate-free browser cooldown after feed errors, pause live polling in hidden tabs, and show retry countdowns. The window display prevents overlapping position requests.
- Backoff starts at 30 seconds and doubles up to five minutes. Direct or relay-reported HTTP 429 waits at least one minute. A longer readable Retry-After is honoured. Success clears cooldown; refresh and zone changes do not bypass an active stored cooldown.
- tests/test_windowjet.js, tests/test_map.js, tests/dom_test.js and tests/map_dom_test.js cover delay calculation, cooldown traffic suppression, recovery and hidden-map polling. Updated AGENTS.md, README.md, docs/FINDINGS.md and LOG.md. Worker code unchanged.
