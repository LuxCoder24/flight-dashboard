# plane-dashboard (WindowJet)

A DIY replica of [JetClock](https://jetclock.io) (a live "what plane is above me" display). It runs on a Galaxy Tab mounted on the wall between two windows, and shows the plane flying past as a small animation, with big, clean flight info underneath.

Owner: Nathan. Planes departing DCA (Washington National) fly past his window, which faces about 190 degrees (almost due south).

Last updated: 2026-10-19 by GPT-6 (OpenAI), directed by Nathan.
Change: v0.6 adds a separate map edition with an adjustable viewing wedge and map tests.

## Status (v0.6, map edition v0.1)

| Part | State |
|---|---|
| Map edition (`map.html`) | Separate geographic map with a selectable viewing wedge, demo/live modes and aircraft details. 35 geometry and 40 page checks pass; desktop map preview inspected. |
| Demo mode (fake planes, button controls) | Works. 56 simulated-browser checks pass; desktop browser preview inspected. Tablet still untested. |
| Live mode (real planes) | Uses the relay below. The map edition has not been tested against real feeds; current deployed configuration was not inspected in this session. See `docs/FINDINGS.md`. |
| Relay (`worker/`) | Deployed by Nathan but both upstream feeds failed. Local diagnostics update awaits redeployment. 25 mock tests pass in the latest session. Current deployment configuration has not been rechecked. Setup: `docs/RELAY_SETUP.md`. |
| Route lookup (origin and destination) | Works from a browser (tested 2026-10-19). |
| Runs on the real tablet | Not tried yet. |

## Quick start

1. Open `index.html` in a browser. With no options in the address it starts in demo mode: a fake plane appears and a button bar lets you spawn more.
2. If your browser will not open a local file with options, host it (GitHub Pages is the plan) and add options after the address, for example `?units=aviation`.

Options (add to the page address, join with `&`):

| Option | Meaning | Default |
|---|---|---|
| `view=auto` | Auto switch between focus and up to three aircraft; also accepts `single` and `multi` | auto |
| `demo=1` | Force demo mode | on when no `lat`/`lon` given |
| `lat=..&lon=..` | Your window's coordinates. Giving these switches to live mode. | none |
| `heading=190` | Compass direction the window faces, degrees | 190 |
| `fov=140` | Width of the slice of sky the window shows, degrees | 140 |
| `dist=6` | Ignore planes farther than this, nautical miles | 6 |
| `alt=12000` | Ignore planes higher than this, feet | 12000 |
| `units=aviation` | Show ft, kt, fpm instead of metric (m, km/h, m/s) | metric |
| `api=https://...` | Address of the relay Worker for live data (https only) | the built-in feeds, which browsers block |
| `debug=1` | Show a debug log on screen | off |

## Hosted versions

- Window edition: https://luxcoder24.github.io/flight-dashboard/
- Map edition: https://luxcoder24.github.io/flight-dashboard/map.html

The map link is the publication target for this session; see the latest LOG.md entry for confirmed deployment status. Opening the map without options starts the demo. To use live data, preserve the `lat`, `lon` and `api` options from the tablet bookmark while changing its path to `/flight-dashboard/map.html`. Keep coordinates in the bookmark only.

## Map edition

Use **Map view** in the window page, or open `map.html` on the same hosted website. The link carries the current location and relay options. For the tablet bookmark, replace `index.html` with `map.html` (or append `map.html` after the website's trailing slash), keeping the existing address options.

1. Tap **Choose zone**, then tap your viewpoint on the map.
2. Adjust **Facing direction**, **View width** and **Viewing reach**. The shaded wedge is the actual pickup area. North stays at the top of the map.
3. Tap an aircraft for callsign, type, altitude and speed. All airborne aircraft within the wedge are shown, with no three-aircraft cap or altitude ceiling. Aircraft behind the viewpoint are excluded.
4. Tap **Keep zone in this link**, then bookmark the resulting address to retain the viewpoint and wedge. Merely moving the map does not change the pickup zone. Drag to pan; use +, minus and Fit zone to navigate.

No coordinates are saved in project files. No location means a three-aircraft demo around a public airport placeholder. Live data uses the same `api=` relay as the window edition; the deployed relay must allow the hosting origin. Moving the viewpoint changes the live query centre. Old query responses are ignored after a zone change and fixes older than 60 seconds are hidden.

Map options: `heading=190`, `fov=140` (20 to 180 degrees), `radius=10` (reach in km by default; nm with `units=aviation`), and `zoom=11`. Reach is limited to 44 km or 24 nm to leave margin inside the relay's 25 nm search cap after coordinate rounding. `demo=1` forces the demo. `tiles=0` disables basemap requests for automated tests.

The geographic basemap needs internet and HTTP/HTTPS hosting. Opening the file directly shows a coordinate grid, aircraft and the wedge, with a basemap-unavailable message. Basemap failures do not disable the aircraft controls. The map uses visible OpenStreetMap attribution, only viewport tiles, default browser caching and an origin-only Referer so bookmark coordinates are not sent in that header. Source: https://operations.osmfoundation.org/policies/tiles/ (checked 2026-10-19). No offline map download is provided.

## Aircraft views

Auto is selected by default: one eligible aircraft uses single focus; two or more use multi aircraft. Multi shows at most the three nearest aircraft inside the same window, distance and altitude filters. Each has a callsign in the sky and a matching colour on its information card. Single focus keeps the current aircraft while it remains eligible.

Use the Auto, Single focus or Multi aircraft buttons to change the choice. `?view=single` or `?view=multi` locks the initial view; `?view=auto` restores automatic switching. With no aircraft the idle clock returns. Helicopters in the supported type-code list use a rotor silhouette in both views; unknown types keep the standard aircraft icon. This list is a heuristic, not a complete aircraft database.

## Files

| File | What it is |
|---|---|
| `map.html` | Separate single-file, ES5 map edition with adjustable viewing wedge. |
| `tests/test_map.js` | 35 map geometry and filtering checks. |
| `tests/map_dom_test.js` | 40 map control and relay-wiring checks. |
| `docs/previews/map-wedge-v0.1.png` | Desktop demo preview, public placeholder location. |
| `index.html` | The whole app in one file (HTML, CSS, JavaScript). GitHub Pages needs it at the root. |
| `AGENTS.md` | Read this first if you are an LLM or coding agent picking the project up. |
| `LOG.md` | Dated log of sessions, decisions and handoffs. Append only. |
| `CHANGELOG.md` | Version history. |
| `docs/FINDINGS.md` | What has been verified, how, and what is still unverified, with sources. |
| `docs/RELAY_SETUP.md` | Step by step: deploy the relay and point the tablet at it. |
| `worker/worker.js` | The relay: a small Cloudflare Worker. `worker/wrangler.jsonc` is its config. |
| `worker/test_worker.mjs` | Tests for the relay with a mocked feed (25 checks, nothing to install). |
| `tests/test_windowjet.js` | Unit tests for the logic (61 checks). |
| `tests/dom_test.js` | Runs the page in a simulated browser and clicks every demo button (56 checks). |

## Running the tests

```
node tests/test_windowjet.js index.html

# one-time: install jsdom somewhere outside this folder
mkdir -p ~/jsdom-env && cd ~/jsdom-env && npm init -y && npm install jsdom
# then, from this folder:
node tests/dom_test.js ~/jsdom-env/node_modules/jsdom index.html
```

The map tests use the same jsdom installation:

```
node tests/test_map.js map.html
node tests/map_dom_test.js ~/jsdom-env/node_modules/jsdom map.html
```

The relay tests need nothing installed: `node worker/test_worker.mjs`.

Expected as of v0.6: 61 window logic, 56 window page, 25 relay, 35 map logic and 40 map page checks passed, 0 failed. These tests cannot show how the page looks. They only check logic and wiring.

## Hardware and hosting plan

- Display: Samsung Galaxy Tab A6 (exact model and Android version not yet confirmed), wall mounted.
- Hosting: GitHub Pages at https://luxcoder24.github.io/flight-dashboard/ (static, free, live as of 2026-10-19). GitHub Pages cannot run server code.
- Live data: needs a relay because the plane feeds do not allow requests from web pages. The relay is a Cloudflare Worker (`worker/worker.js`), deployed but returning upstream failures; see the latest LOG entry for the diagnostic redeployment step. See `docs/RELAY_SETUP.md`.

## Working on this with more than one LLM

Read `AGENTS.md`. Short version: sign every edit (who directed, who wrote, date), add a dated change log entry, tag facts as verified or unverified, run both test files before handing over, and append to `LOG.md`.
