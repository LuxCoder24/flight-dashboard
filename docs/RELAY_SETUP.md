# Relay setup: getting live planes onto the page

Last updated: 2026-10-19 by Claude (Sonnet 5.5, Anthropic), directed by Nathan.

## What this is and why

The public plane feeds do not let web pages call them directly (CORS, tested 2026-10-19, see `FINDINGS.md`). The relay in `worker/worker.js` is a tiny Cloudflare Worker: it fetches the feed from a server and adds the header that lets `https://luxcoder24.github.io` read it. About 100 lines, no secrets, no database.

Status: written and tested against a mock feed (25 checks) and it compiles under Cloudflare's own tool (`wrangler deploy --dry-run`, wrangler 4.151.2, 2026-10-19). It has never been deployed and never run against the real feeds.

## Before you start

1. The page is live at https://luxcoder24.github.io/flight-dashboard/ (checked 2026-10-19; the checker only saw the page's text, so the JavaScript parts are unconfirmed).
2. Upload the newest `index.html` (v0.4 or later) to the GitHub repo. The `?api=` option is new in v0.4, so an older page ignores it.
3. A free Cloudflare account (cloudflare.com). Nathan creates it himself. Never share passwords or tokens in chat or in files.

## Option A: Wrangler (Cloudflare's command line tool)

Needs Node.js (`node -v` should print a version) and about 250 MB of free disk space (installing Wrangler measured 214 MB on 2026-10-19). Run it from a normal folder, not from inside Google Drive, so the download is not synced.

1. Copy the `worker` folder out of the Drive folder, for example to the Desktop.
2. In Terminal: `cd ~/Desktop/worker`
3. `npx wrangler login` opens a browser so you can approve access. (UNVERIFIED: the Cloudflare pages I read did not list this command, but it is the usual way. If it does not exist, search the Wrangler commands page.)
4. `npx wrangler deploy` uploads the Worker. The command exists in the docs (https://developers.cloudflare.com/workers/wrangler/commands/workers/). UNVERIFIED: whether it prints the Worker's address, and whether it first asks you to pick a `workers.dev` name. Expect an address like `https://windowjet-relay.<your-name>.workers.dev`.
5. Delete the copied folder afterwards if you want the disk space back.

## Option B: connect GitHub to Cloudflare (no install, no disk space)

From Cloudflare's docs (https://developers.cloudflare.com/workers/get-started/dashboard/): in the dashboard open **Workers & Pages**, choose **Create application**, import a Git repository, connect your Git provider, configure the project and choose **Deploy**; afterwards the Worker is reachable on a `workers.dev` address. For this project:

1. Create a new GitHub repo (for example `windowjet-relay`) and upload `worker.js` and `wrangler.jsonc` to its root. They contain no secrets and no personal data.
2. In Cloudflare follow the steps above and pick that repo.
UNVERIFIED: which fields the screen shows and what to type in them (leaving the defaults is the first thing to try), and where the final address appears.

## Test the relay

Open this in a browser (made-up coordinates, so nothing personal is sent): `<your worker address>/v2/point/40.12/-75.65/10`

- A page of JSON means it works. UNVERIFIED: what the real feed's JSON looks like. It should be a large block of text with an `ac` list, possibly empty.
- `{"error":"all upstream feeds failed"}` (HTTP 502) means the Worker ran but neither feed answered it. Try again later. If it persists, the feeds may be refusing traffic from Cloudflare, which would need a different source (UNVERIFIED either way).

## Point the tablet at it

Bookmark on the tablet (fill in the three blanks; keep `debug=1` for the first run):

`https://luxcoder24.github.io/flight-dashboard/?lat=<your latitude>&lon=<your longitude>&api=<your worker address>&debug=1`

Your coordinates go only in this bookmark, never into a file (the page is public).

## Troubleshooting

| What you see | What it likely means |
|---|---|
| "Data trouble: HTTP 0" | The tablet could not reach the relay at all: wrong address, or no internet. Check the `api=` value starts with `https://`. |
| "HTTP 403" | The relay refused the page's origin. The page must be at `https://luxcoder24.github.io`. If you host it elsewhere, edit `ALLOWED_ORIGINS` in `worker.js` and deploy again. |
| "HTTP 502" | The relay worked but both feeds failed. Wait and retry. |
| Idle screen with "0 aircraft within 10 nm" and a green dot | Everything works; no planes are in range right now. |
| Plane data but nothing is shown | A plane must be inside the view (heading plus or minus 70 degrees), within 6 nm and under 12,000 ft. Try `&dist=10&alt=20000`. |

## Limits, privacy and cost

- Cloudflare's free Workers plan allows 100,000 requests a day and 10 ms of CPU time per request (https://developers.cloudflare.com/workers/platform/pricing/). One tablet polling every 5 seconds makes about 17,280 requests a day. Whether 10 ms of CPU is enough for this Worker is likely but untested. Whether signup asks for a card is UNVERIFIED.
- The relay rounds your coordinates to 2 decimals (about 1 km) before asking the feed, so the feed never sees your exact position. Cloudflare does see the request. Any live feed has to know roughly where you are.
- Only browsers on `https://luxcoder24.github.io` are served. Someone who knows the Worker address could still call it directly (for example with curl). The worst case is using up the free daily allowance.
