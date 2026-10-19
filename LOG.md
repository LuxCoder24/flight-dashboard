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

Delivery problem: copying these files into the Google Drive folder `plane-dashboard` failed at the time with "device disk full" (nothing was written). The files were delivered through the chat instead. If this log is in the Drive folder, the copy was completed later.

Next:
- Build the CORS relay (needs Nathan to make a free Cloudflare account) and get his window coordinates. Details in `AGENTS.md` section 7.
- Look at the demo on the real tablet and report how it looks.
