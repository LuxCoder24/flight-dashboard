# Findings: what is verified and what is not

Last updated: 2026-10-19 by Claude (Sonnet 5.5, Anthropic), directed by Nathan.

Tags: **TESTED** means someone ran it and saw the result. **SOURCE** means a web page says so but nobody tested it here. **UNVERIFIED** means an assumption.

## 1. Tested on 2026-10-19

### F1. The public plane-position feeds are blocked from web pages (CORS). TESTED.
Method: the built-in browser in the Claude desktop app on Nathan's Mac ran `fetch()` from the page `https://example.com` (an ordinary cross-origin site, standing in for a github.io page) against a point query near 38.85, -77.04 with a 10 nautical mile radius (public coordinates, not Nathan's).

| Feed | Result |
|---|---|
| `https://api.adsb.lol/v2/point/{lat}/{lon}/{radius}` | Blocked: no Access-Control-Allow-Origin header |
| `https://api.adsb.one/v2/point/{lat}/{lon}/{radius}` | Blocked: same |
| `https://opendata.adsb.fi/api/v2/lat/{lat}/lon/{lon}/dist/{dist}` | Blocked: same |
| `https://api.airplanes.live/v2/point/{lat}/{lon}/{radius}` | Blocked: same |
| `https://opensky-network.org/api/states/all?...` | Blocked: the header allows only `https://opensky-network.org` |

Meaning: a static page (GitHub Pages) cannot call these directly. It needs a relay that fetches server side and adds the header. Caveat: no response body was ever returned to the browser, so the real JSON field names of these feeds are still UNVERIFIED.

### F2. The route lookup (adsbdb) works from a web page. TESTED.
`GET https://api.adsbdb.com/v0/callsign/UAL1` returned HTTP 200 from the `https://example.com` origin. Fields seen in the response: `response.flightroute.callsign`, `callsign_icao`, `callsign_iata`, `airline` (`name`, `icao`, `iata`, `country`, `country_iso`, `callsign`), and `origin` (`country_iso_name`, `country_name`, `elevation`, `iata_code`, `icao_code`, `latitude`, `longitude`, `municipality`, ...). The test output was cut off partway through `origin`, so the `destination` fields are assumed to match `origin` (UNVERIFIED but very likely).

### F3. The build sandbox could not reach the feeds. TESTED.
Calls to adsb.lol and adsbdb from the cloud sandbox returned HTTP 403 from its proxy. So nothing server to server has been tested yet. This matters for the relay plan.

### F4. Code tests. TESTED.
49 unit checks and 34 jsdom checks pass on v0.3.1. jsdom has no layout, so appearance on a real screen has never been checked (only one screenshot of the idle screen was seen).

### F5. The GitHub Pages site is up. TESTED (partially).
https://luxcoder24.github.io/flight-dashboard/ returned a page titled WindowJet on 2026-10-19 (fetched as text, so JavaScript-built parts such as the clock and demo buttons were not seen).

### F6. The relay compiles under Cloudflare's own tool. TESTED.
`npx wrangler deploy --dry-run` succeeded in the build sandbox with `worker.js` and `wrangler.jsonc` (wrangler 4.151.2: upload 3.76 KiB, gzip 1.56 KiB, no bindings). Installing wrangler into a project took 214 MB of `node_modules`. Nothing was deployed.

### F7. The relay logic passes mock tests. TESTED against a mock only.
25 checks in `worker/test_worker.mjs`: CORS for the allowed origin only, refusal of other origins, preflight, bad paths and methods, coordinate rounding, radius clamp, fallback to the second feed on error, timeout or HTML, 502 when both fail, caching. The feed was a mock, so real feed behaviour is untested.

## 2. Documented by sources, not tested

- **adsb.one API**: `/v2/point/[lat]/[lon]/[radius]` returns aircraft within a radius up to 250 nm, in the ADSBExchange v2 format, rate limited to 1 request per second. Source: https://github.com/airplanes-live/api-archive (archived read-only on 2026-04-29, so it may be outdated).
- **airplanes.live API**: same style of endpoint, 1 request per second, and its guide says non-commercial access requires contacting them. Source: https://airplanes.live/api-guide/
- **adsb.lol**: free, community run, no key needed, `v2` endpoints including point and closest. Sources: https://pypi.org/project/skysnoop/ and https://github.com/filbot/flight-display/wiki (third party descriptions). Its own terms and rate limits have not been read (UNVERIFIED).
- **adsbdb**: blocks a client after 512 requests (for 60 s) and 1024 requests (for 300 s). Route data is credited to David Taylor and Jim Mason and may not be copied or incorporated elsewhere without permission. Source: https://www.adsbdb.com/ and https://github.com/mrjackwills/adsbdb
- **ADS-B does not carry origin or destination.** Routes come from a callsign lookup. Source (a blog quoting a forum answer, so secondary): https://wiert.me/2025/10/28/some-ads-b-api-link-notes-hoping-to-be-able-to-get-from-to-airport-data-from-it/
- **JetClock**: features at https://jetclock.io/features/expand. Desk unit listing: https://shop.app/products/8348062482697/jetclock-desk. A reviewer there mentions tweakable filtering options for busy airspace.
- **Galaxy Tab A 10.1 (2016)**: launched on Android 6.0, upgradable to 8.1 according to https://www.gsmarena.com/samsung_galaxy_tab_a_10_1_(2016)-reviews-8090p12.php. Another source (iFixit) lists Android 5.1.1 for other "Tab A6" sizes, so the exact model matters. Which Chrome version runs on Nathan's tablet is UNVERIFIED.

- **Cloudflare Workers**: a Worker needs the keys `name`, `main` and `compatibility_date` (https://developers.cloudflare.com/workers/wrangler/configuration/). The free plan allows 100,000 requests a day and 10 ms of CPU time per invocation (https://developers.cloudflare.com/workers/platform/pricing/). The current dashboard guide (https://developers.cloudflare.com/workers/get-started/dashboard/) describes a Git route and does not mention an in-dashboard code editor. `wrangler deploy [<PATH>]` is documented at https://developers.cloudflare.com/workers/wrangler/commands/workers/. The `wrangler login` command, whether deploy prints the Worker's address, whether first use asks to register a `workers.dev` name, and whether signup needs a credit card were NOT found in the pages read (UNVERIFIED).

## 3. Unverified assumptions inside `index.html`

- The position feed returns JSON with an `ac` array whose records use `hex`, `flight`, `r`, `t`, `alt_baro` (a number, or the string "ground"), `gs`, `track`, `baro_rate`, `geom_rate`, `alt_geom`, `lat`, `lon`, `seen_pos`. Written from the documented ADSBExchange v2 format, never seen live.
- adsb.lol and adsb.one will tolerate this page's request rate (one request every 5 seconds).
- The page runs in the tablet's browser (ES5 only, no libraries).
- Nothing in the page can keep the tablet screen awake.
- The visual layout (text sizes, spacing, button bar) looks right on a real tablet screen.
- The relay, once deployed, can reach adsb.lol or adsb.one (feeds may refuse traffic from cloud providers) and their terms allow server-side use of this kind. Not checked.
- Ten milliseconds of CPU time per request (free plan) is enough for the relay. Likely, untested.

## 4. Open questions for Nathan

1. ~~His window's latitude and longitude.~~ Given in chat on 2026-10-19. Deliberately not stored in any file (the page may be public); it goes in the page address.
2. ~~GitHub username and repo.~~ Settled: user `luxcoder24`, repo `flight-dashboard`, page at https://luxcoder24.github.io/flight-dashboard/ (the relay allows only that origin).
3. The exact tablet model, Android version and Chrome version.
4. Portrait or landscape mounting.
5. Any extra facts he does want (he has said he prefers few).

## 5. v0.5 view verification (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- TESTED: ES5 syntax parser check passed. 61 logic checks and 54 jsdom page checks pass, including multi selection, three-aircraft cap, automatic/manual view switching, icon changes, matching callsigns and aviation-unit cards.
- TESTED: desktop browser preview showed a helicopter alongside two planes with individual information cards. Multi sprites were subsequently reduced in size and callsigns colour-matched to the cards; that final cosmetic refinement has not been visually rechecked.
- UNVERIFIED: real tablet appearance and performance, live helicopter type coverage and real-feed behaviour. Helicopter recognition is an explicit conservative type-code heuristic, not a claim that the feed supplies a helicopter-category field.
- TESTED: Google Drive returned ETIMEDOUT reading locally evicted project files. Exact earlier captured contents were restored atomically; test dependencies were installed temporarily outside Drive to avoid sync interference. The relay test rerun failed to start because its file could not be read; the previous 25-pass result is historical.
- Correction to older status text: Nathan's deployed relay returned upstream failures according to the prior LOG entry. This session did not redeploy or investigate the feeds.

## 6. Map edition v0.1 (2026-10-19)
Written by GPT-6 (OpenAI), directed by Nathan.
- SOURCE: OpenStreetMap Standard tile policy requires HTTPS tile URLs, visible attribution, browser identification and Referer, normal caching, and no bulk/offline prefetch. Browser defaults meet the caching requirement. Source read: https://operations.osmfoundation.org/policies/tiles/ . The map requests only current viewport tiles and sends an origin-only Referer; no bookmark query string is included in that header.
- TESTED: 35 map logic and 40 jsdom map page checks pass, including front/behind wedge filtering, north wrap, reach, stale positions, projection, zone placement, saved URL settings, metric/aviation units, relay calls, and keyboard focus preservation. Tests disable tile requests. Both HTML scripts parse as ES5.
- TESTED: desktop browser loaded geographic OpenStreetMap tiles and showed the wedge, three simulated aircraft, helicopter selection and metric details. Saved docs/previews/map-wedge-v0.1.png uses the public airport demo placeholder, not a home location.
- TESTED: existing suites pass: 61 window logic, 56 window page and 25 relay mock checks. No relay changes were made.
- UNVERIFIED: the new map's live operation against real feeds, touch gestures/performance on the tablet, cloud sync completion and deployment. Reach is capped below the relay limit to allow coordinate-rounding margin; exact feed inclusion at boundary positions remains dependent on the upstream.
- Design: Nathan clarified that pickup should be a forward-facing wedge rather than a circle. The viewport can be moved independently of the viewpoint; the wedge controls determine selection. Map mode has no window altitude ceiling or three-aircraft cap. Unknown aircraft types retain the normal aircraft icon.
