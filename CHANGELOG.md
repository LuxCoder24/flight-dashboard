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
