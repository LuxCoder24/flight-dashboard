# plane-dashboard (WindowJet)

A DIY replica of [JetClock](https://jetclock.io) (a live "what plane is above me" display). It runs on a Galaxy Tab mounted on the wall between two windows, and shows the plane flying past as a small animation, with big, clean flight info underneath.

Owner: Nathan. Planes departing DCA (Washington National) fly past his window, which faces about 190 degrees (almost due south).

Last updated: 2026-10-19 by Claude (Sonnet 5.5, Anthropic), directed by Nathan.

## Status (v0.3.1)

| Part | State |
|---|---|
| Demo mode (fake planes, button controls) | Works. Tested in a simulated browser only (jsdom), never looked at on a real screen. |
| Live mode (real planes) | Not working. Browsers block the public plane feeds (CORS). Needs a small relay. See `docs/FINDINGS.md`. |
| Route lookup (origin and destination) | Works from a browser (tested 2026-10-19). |
| Runs on the real tablet | Not tried yet. |

## Quick start

1. Open `index.html` in a browser. With no options in the address it starts in demo mode: a fake plane appears and a button bar lets you spawn more.
2. If your browser will not open a local file with options, host it (GitHub Pages is the plan) and add options after the address, for example `?units=aviation`.

Options (add to the page address, join with `&`):

| Option | Meaning | Default |
|---|---|---|
| `demo=1` | Force demo mode | on when no `lat`/`lon` given |
| `lat=..&lon=..` | Your window's coordinates. Giving these switches to live mode. | none |
| `heading=190` | Compass direction the window faces, degrees | 190 |
| `fov=140` | Width of the slice of sky the window shows, degrees | 140 |
| `dist=6` | Ignore planes farther than this, nautical miles | 6 |
| `alt=12000` | Ignore planes higher than this, feet | 12000 |
| `units=aviation` | Show ft, kt, fpm instead of metric (m, km/h, m/s) | metric |
| `debug=1` | Show a debug log on screen | off |

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app in one file (HTML, CSS, JavaScript). GitHub Pages needs it at the root. |
| `AGENTS.md` | Read this first if you are an LLM or coding agent picking the project up. |
| `LOG.md` | Dated log of sessions, decisions and handoffs. Append only. |
| `CHANGELOG.md` | Version history. |
| `docs/FINDINGS.md` | What has been verified, how, and what is still unverified, with sources. |
| `tests/test_windowjet.js` | Unit tests for the logic (49 checks). |
| `tests/dom_test.js` | Runs the page in a simulated browser and clicks every demo button (34 checks). |

## Running the tests

```
node tests/test_windowjet.js index.html

# one-time: install jsdom somewhere outside this folder
mkdir -p ~/jsdom-env && cd ~/jsdom-env && npm init -y && npm install jsdom
# then, from this folder:
node tests/dom_test.js ~/jsdom-env/node_modules/jsdom index.html
```

Expected as of v0.3.1: 49 passed and 34 passed, 0 failed. These tests cannot show how the page looks. They only check logic and wiring.

## Hardware and hosting plan

- Display: Samsung Galaxy Tab A6 (exact model and Android version not yet confirmed), wall mounted.
- Hosting: GitHub Pages for the page (static, free). GitHub Pages cannot run server code.
- Live data: needs a relay (for example a Cloudflare Worker) because the plane feeds do not allow requests from web pages. Not built yet.

## Working on this with more than one LLM

Read `AGENTS.md`. Short version: sign every edit (who directed, who wrote, date), add a dated change log entry, tag facts as verified or unverified, run both test files before handing over, and append to `LOG.md`.
