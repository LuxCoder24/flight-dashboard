# Project log

Append only. Newest at the bottom. Format is in `AGENTS.md` section 8. Before you start, read the last entry. After you finish, add one.

---

## 2026-10-19 18:45 to 19:30 (America/New_York): Session 1, from idea to demo
Who: Claude (Sonnet 5.5, Anthropic), directed by Nathan

Did:
- Looked up JetClock (jetclock.io) to confirm what it is. It identifies aircraft above you in real time and shows them on a desk unit or tablet, with extras like weather and ISS tracking.
- Researched free data sources (see `docs/FINDINGS.md`).
- Built `index.html` v0.1 (live-data page plus demo), v0.2 (demo control bar), v0.3 (demo is the default without coordinates), v0.3.1 (header pointer).
- Wrote the test files and set up this folder with README, AGENTS, CHANGELOG, LOG and FINDINGS.
- Nathan opened v0.2 with no address options (how he opened it, file or hosted, is not known): it showed the location warning and "Data trouble: HTTP 0". I tested the feeds from a real browser on his Mac to find out why: all four plane feeds are blocked by CORS.

Verified:
- 49 unit checks and 34 simulated-browser (jsdom) checks pass on v0.3.1.
- Route lookup (adsbdb) works from a browser origin. Position feeds do not (CORS).

Not verified:
- Anything on the real tablet (appearance, old-browser support, screen staying awake).
- The live JSON field names of the position feeds (the build sandbox was blocked from the network, and the browser test was blocked by CORS before any body came back).
- Terms of use for calling the position feeds from a server.
- How the page looks at all: only a simulated browser without layout has run it. Nathan has seen a screenshot of the idle screen only.

Decisions:
- D1: Static single-file page on GitHub Pages, because it is cheapest and most stable. Correction made to Nathan's plan: GitHub Pages is static hosting, not a server, so live data needs a separate relay.
- D2: Draw the plane at its true sky position (azimuth and elevation through a 140 degree field of view centred on 190 degrees) rather than a generic left-to-right animation. Direction on screen follows the real track: looking south, west is right.
- D3: Metric units by default (Nathan's standing preference), aviation units via `?units=aviation`.
- D4: One plane at a time, big type, few facts (Nathan's request).
- D5: Demo mode is the default when no coordinates are given, because live mode cannot work yet and Nathan asked for fake plane info for the demo.
- D6: ES5 only, no libraries, for the old tablet.
- D7: Nathan gave his window coordinates in chat. They are deliberately NOT stored in `index.html` or any doc, because the page may be on public GitHub Pages. He passes them in the page address (`?lat=...&lon=...`). To see the demo with his real position, use `?demo=1&lat=..&lon=..`.

Delivery problem: copying these files into the Google Drive folder `plane-dashboard` failed at the time with "device disk full" (nothing was written). The files were delivered through the chat instead. Resolved at 19:27 ET: after Nathan freed disk space on his Mac, all 8 files were copied into the Drive folder successfully (Claude Sonnet 5.5, directed by Nathan).

Next:
- Build the CORS relay (needs Nathan to make a free Cloudflare account) and get his window coordinates. Details in `AGENTS.md` section 7.
- Look at the demo on the real tablet and report how it looks.

---

## 2026-10-19 19:35 to 20:05 (America/New_York): Relay and v0.4
Who: Claude (Sonnet 5.5, Anthropic), directed by Nathan

Did:
- Nathan put the page on GitHub Pages (https://luxcoder24.github.io/flight-dashboard/) and asked how to proceed with live data.
- Checked that the site loads (page title WindowJet; the checker only sees text, not JavaScript output).
- Read Cloudflare's current docs for creating a Worker. They describe a Git route and a command line route (Wrangler), with no dashboard code editor mentioned.
- Wrote `worker/worker.js`, `worker/wrangler.jsonc`, `worker/test_worker.mjs`.
- `index.html` v0.4: `?api=` option. `tests/dom_test.js`: checks 11 and 12.
- Wrote `docs/RELAY_SETUP.md`. Updated README, AGENTS, CHANGELOG, FINDINGS and this log.

Verified:
- 49 unit, 36 page (jsdom) and 25 relay (mocked feed) checks pass.
- `wrangler deploy --dry-run` succeeded in the sandbox (wrangler 4.151.2, upload 3.76 KiB). Installing wrangler took 214 MB.
- `index.html` contains none of Nathan's coordinates (searched).

Not verified:
- Deploying the relay; the relay against the real feeds (the sandbox network was blocked); `wrangler login` (not in the docs read) and whether `deploy` prints the address; whether Cloudflare signup asks for a card; whether the feeds accept traffic from Cloudflare and their server-side terms; the page on the real tablet; how anything looks.

Decisions:
- D8: Relay on Cloudflare Workers (free plan).
- D9: The relay address is passed with `?api=` in the bookmark, so nothing in the public file changes per user.
- D10: The relay refuses browsers on other websites (403) but allows requests with no Origin, so Nathan can test it in the address bar.
- D11: Coordinates are rounded to 2 decimals (about 1 km) before going to the feed.
- D12: 4 second in-memory cache, best effort. The Cloudflare Cache API was not used (not needed for one tablet, and its behaviour on workers.dev addresses was not checked).

Next:
- Nathan uploads v0.4 `index.html` to the GitHub repo, creates a free Cloudflare account and deploys the relay (`docs/RELAY_SETUP.md`), then opens the bookmark with `debug=1` and reports what the debug log shows.

---

## 2026-10-19 19:58 to 20:10 (America/New_York): Relay deployed, feeds failed
Who: Claude (Sonnet 5.5, Anthropic), directed by Nathan

Did:
- Nathan deployed the relay as windowjet-relay on a workers.dev address (Production toggle on the Domains tab had to be switched on; not confirmed in docs). Testing it with made-up coordinates returned `{"error":"all upstream feeds failed"}`, the relay's own 502.
- worker.js: 502 now carries `details` (reason per feed). Not yet redeployed.

Verified:
- The relay runs and answers (TESTED by Nathan). 25 mock checks pass; details field checked once by hand with a mock.

Not verified:
- WHY both feeds failed (could be 403 blocking of Cloudflare traffic, a wrong path, or something else). Needs the redeployed relay's `details`.

Next:
- Nathan redeploys the new worker.js, reloads the test URL and reports `details`. Also useful: open the feed URL directly in his browser to see whether it works at all.

## 2026-10-19 20:07 (America/New_York): Project familiarisation
Who: GPT-6 (OpenAI), directed by Nathan
Did: Read AGENTS.md, the session log, FINDINGS, README, index.html, worker.js, CHANGELOG and relay setup notes. Checked available recent chat titles; no earlier WindowJet chat appeared in that list. No standalone memory file was found in the checked locations. Appended this log entry and CHANGELOG entry, and signed the required comment-only index.html header update.
Verified: Logic tests: 49 passed, 0 failed. Relay mock tests: 25 passed, 0 failed.
Not verified: Page tests could not start because jsdom was absent at the README's suggested installation path. No live feeds, deployment, visual layout or tablet checks performed.
Decisions: Treat the latest prior LOG entry as the current handoff: relay deployed but upstream requests failed, with detailed diagnostics present locally and awaiting redeployment. README and AGENTS status text predates that entry. No functional changes made during familiarisation.
Next: Redeploy the diagnostic relay and inspect its details response to establish why the feeds fail; then verify live operation and tablet appearance.

## 2026-10-19 20:37 (America/New_York): Helicopters and automatic multi-aircraft views
Who: GPT-6 (OpenAI), directed by Nathan
Did: index.html: helicopter SVG and conservative type-code recognition; nearest-three selection; automatic focus/multi switching; manual Auto, Single focus and Multi aircraft controls; view URL option; labelled sprites and compact matching-colour cards; focus trail cleanup on mode changes. Tests: added selection, icon, view lifecycle, cap, callsign matching and units coverage. AGENTS.md and README.md: behaviour, counts and relay handoff corrections. CHANGELOG.md and index header: signed v0.5 entry. docs/FINDINGS.md: verified results and limitations. Restored exact previously captured files atomically when Google Drive eviction caused read timeouts; no prior log entries removed. Test dependencies installed temporarily outside Drive after the initial in-folder attempt; the in-folder dependency installation was removed. Route lookups remain triggered by entering the displayed selection, preventing repeated requests on every selection tick.
Verified: 61 logic checks and 54 jsdom page checks passed. ES5 syntax parser check passed. Desktop browser showed a helicopter and two planes with information cards before the final smaller-sprite/colour refinement.
Not verified: Tablet layout and performance, final cosmetic refinement in a browser, live data and helicopter type coverage. Relay rerun attempted but blocked by ETIMEDOUT reading worker/test_worker.mjs; earlier 25-pass result remains historical. No deployment performed.
Decisions: Nathan requested automatic switching during implementation. Auto is the default; one eligible aircraft uses sticky focus and two or more use up to three nearest eligible aircraft. Manual overrides are available. Unknown type codes keep the standard icon. Positions remain tied to window geometry, so nearby aircraft may overlap.
Next: Preview the final v0.5 on the tablet and upload index.html when ready. Redeploy the diagnostic relay and inspect details for upstream failures. Rerun relay tests when Drive files are readable.

## 2026-10-19 21:02 (America/New_York): Verify files after Google Drive crash
Who: GPT-6 (OpenAI), directed by Nathan
Did: Checked all expected project files, v0.5 feature markers and complete HTML. Updated index.html header, CHANGELOG.md and this append-only log with a signed verification entry. No application behaviour changed.
Verified: 61 logic, 54 jsdom page and 25 relay mock checks passed, zero failures. ES5 syntax check passed. App, tests, relay and updated docs were readable; no temporary .restore files remained.
Not verified: docs/RELAY_SETUP.md failed two bounded local reads; it exists but content could not be checked. Cloud sync completion, live feeds, deployment and tablet behaviour were not checked.
Decisions: Leave the unreadable older setup guide untouched. The requested v0.5 code and logs are intact locally; a cloud read timeout alone does not establish corruption.
Next: Let Google Drive recover and confirm sync; retry the setup guide when it is available. Continue tablet testing and diagnostic relay deployment when ready.

## 2026-10-19 21:17 (America/New_York): Separate map edition with a viewing wedge
Who: GPT-6 (OpenAI), directed by Nathan
Did: Added map.html, a separate ES5 map with a geographic basemap, adjustable viewpoint and forward viewing wedge, direction/width/reach controls, aircraft selection and details, helicopter icons, demo/live relay modes, dragging/zoom, URL-based zone saving, stale-fix removal and rejection of obsolete responses. index.html links to the map carrying existing bookmark options. Added tests/test_map.js and tests/map_dom_test.js; tests/dom_test.js now checks navigation to the map. Updated README.md, AGENTS.md, CHANGELOG.md and docs/FINDINGS.md. Captured docs/previews/map-wedge-v0.1.png using the public demo location. No home coordinates were stored.
Verified: 35 map logic and 40 map page checks passed. Existing suites: 61 window logic, 56 window page and 25 relay mock checks passed. Both pages passed ES5 parsing. Desktop browser showed geographic tiles, the forward wedge, simulated aircraft and helicopter details. OpenStreetMap tile policy read and cited in FINDINGS and README.
Not verified: New map live feeds, tablet touch/performance, cloud sync and deployment. No accounts, credentials or relay configuration changed.
Decisions: Nathan clarified that selection must be a wedge in front of the viewpoint, replacing the initially proposed circle before delivery. Default direction/width match the window edition. All airborne aircraft in the map wedge are eligible regardless of altitude; no three-aircraft cap applies. Reach is limited to 44 km or 24 nm to fit within relay search limits after coordinate rounding. Coordinates and settings persist only in the page address when saved. Map tiles use normal browser caching and an origin-only Referer; tests disable tile access. Bare file URLs use a grid fallback; host the page for the geographic basemap. Temporary test dependencies remain outside the Drive project.
Next: Upload map.html and the updated index.html to the existing GitHub Pages site, then open the Map view link using the tablet's existing live bookmark. Place the viewpoint, adjust the wedge, save and bookmark the resulting address. Confirm real tablet gestures and live selection.

## 2026-10-19 21:22 (America/New_York): Prepare GitHub Pages publication
Who: GPT-6 (OpenAI), directed by Nathan
Did: Nathan requested uploading the map version for tablet testing. Inspected the connected GitHub account and LuxCoder24/flight-dashboard. Read the remote main head and index.html before preparing the upload. Added the signed publication note to index.html, CHANGELOG.md, README.md, AGENTS.md and this log. Publication result will be appended after the upload and verification.
Verified: Connected account is LuxCoder24. Repository metadata reports push permission. The remote index is the earlier v0.4 base, with no later window/map edits seen there. Fresh publication rerun passed: 61 window logic, 56 window page, 25 relay, 35 map logic and 40 map page checks, zero failures.
Not verified: Write permission has not yet been exercised; GitHub Pages deployment and live tablet behaviour have not yet been checked in this session.
Decisions: Use the connected GitHub tool, preserve history and advance main only from the inspected parent. Upload the map plus its tested companion project files, excluding local machine files and test dependencies. No credentials are requested or written. Publishing the Worker source does not deploy a Cloudflare Worker.
Next: Complete tests, create and publish one source commit, verify the hosted map, then record the outcome and provide the tablet link.

## 2026-10-19 21:26 (America/New_York): Map published and public page verified
Who: GPT-6 (OpenAI), directed by Nathan
Did: Published the map and companion project source, tests and documentation to main in LuxCoder24/flight-dashboard using the existing GitHub connection. Source commit: 85e0bcd1befb4eaf339e28fb15f64eafb8fd7e13, parent 2684f67e0f0afe34d19a91c9649114742b239279. Included the existing Worker source for a complete project handoff; this did not deploy or modify the Cloudflare service. Updated index.html header, README.md, AGENTS.md, CHANGELOG.md, docs/FINDINGS.md and this log with the publication outcome.
Verified: All 217 checks passed in a fresh rerun: 61 window logic, 56 window page, 25 relay mock, 35 map logic and 40 map page. The old remote index matched the original project baseline exactly before replacement. Main advanced without force, map.html read back identically, and https://luxcoder24.github.io/flight-dashboard/map.html loaded in a desktop browser with the wedge controls and simulated aircraft. GitHub's Pages workflow built and deployed the source commit.
Not verified: Real tablet layout/touch support and the new map with live aircraft. No private bookmark or home position was used in publication verification.
Decisions: Existing connected GitHub access was sufficient; Nathan did not need to upload files or supply credentials. Use the existing tablet live bookmark and the new Map view link to preserve its location and relay options. Direct map URL without options opens the demo.
Next: On the tablet, refresh the existing live page and tap Map view, then adjust the viewpoint/wedge and bookmark the saved link. This publication-result entry is being synced in a documentation-only follow-up commit.

## 2026-10-19 22:45 (America/New_York): Persistent map views and hamburger controls
Who: GPT-6 (OpenAI), directed by Nathan
Did: map.html v0.2: Save view now writes validated browser preferences for the viewpoint, wedge, pan/zoom, units, mode and relay, and restores them on reopening. Added old-bookmark precedence, useurl bypass, explicit demo override, Forget saved view and honest storage-failure messages. Reworked the map to fill the screen; moved existing map controls and Map/Auto/Single/Multi view links into a hamburger drawer. Drawer/header/hints hide after 15 seconds without input, with keyboard focus handling; hamburger and map attribution remain. tests/test_map.js and tests/map_dom_test.js cover the new lifecycle. Updated index.html header, README.md, AGENTS.md, CHANGELOG.md and docs/FINDINGS.md. Captured docs/previews/map-menu-v0.2.png at the public demo placeholder.
Verified: New map suites pass 50 logic and 70 page checks; both HTML scripts parse as ES5. Desktop browser showed the settings drawer and the clean idle map after the real idle timer. Full regression passed: 61 window logic, 56 window page and 25 relay checks, in addition to the 50 map logic and 70 map page checks, for 262 total with zero failures. Publication outcome follows.
Not verified: Persistence/touch on the real tablet or after its browser data is cleared. Browser preference records from real user locations were never copied into project files or logs. No private bookmarks or live credentials used in tests.
Decisions: Nathan requested browser persistence, idle UI hiding and a hamburger containing existing settings/views. Saving is explicit. Stored view wins over old bookmark defaults; deliberate URL override and demo mode remain possible. Storage errors keep the map functional and give a truthful bookmark fallback. Browser-only preferences do not sync between devices. Publish this follow-up to the same map URL for tablet use.
Next: Finish the full regression run, publish the map update and verify the hosted menu/save controls.
