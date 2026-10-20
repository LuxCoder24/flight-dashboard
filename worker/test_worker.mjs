// Directed by: Nathan | Written by: Claude (Sonnet 5.5, Anthropic) | Date: 2026-10-19
// Tests the relay with a mocked fetch. Uses made-up coordinates only.
// Usage: node worker/test_worker.mjs   (run from the plane-dashboard folder, or anywhere: paths are relative to this file)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

var here = path.dirname(fileURLToPath(import.meta.url));
var tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'relay-test-')), 'worker.mjs');
fs.copyFileSync(path.join(here, 'worker.js'), tmp);
var worker = (await import(pathToFileURL(tmp).href)).default;

var passes = 0, fails = 0;
function ok(c, n) { if (c) { passes++; } else { fails++; console.log('FAIL: ' + n); } }

var calls = [], behaviour = {};
globalThis.fetch = async function (url) {
  calls.push(String(url));
  var host = String(url).split('/')[2];
  var b = behaviour[host] || 'ok';
  if (b === 'throw') { throw new Error('network down'); }
  if (b === 'http500') { return new Response('oops', { status: 500 }); }
  if (b === 'html') { return new Response('<html>blocked</html>', { status: 200 }); }
  return new Response(JSON.stringify({ ac: [{ hex: 'abc123', flight: 'TEST1 ', lat: 40.1, lon: -75.6, alt_baro: 2500 }], src: host }), { status: 200 });
};
function req(p, opts) { return new Request('https://relay.example.workers.dev' + p, opts || {}); }
var GOOD = 'https://luxcoder24.github.io';

// 1. happy path, allowed origin, coordinates rounded before going upstream
calls = [];
var r = await worker.fetch(req('/v2/point/40.123456/-75.654321/10', { headers: { Origin: GOOD } }));
var j = await r.json();
ok(r.status === 200, 'happy path 200');
ok(r.headers.get('Access-Control-Allow-Origin') === GOOD, 'CORS header for allowed origin');
ok(r.headers.get('Vary') === 'Origin', 'Vary: Origin set');
ok(j.ac && j.ac[0].hex === 'abc123', 'feed JSON passed through unchanged');
ok(calls.length === 1 && calls[0] === 'https://api.adsb.lol/v2/point/40.12/-75.65/10', 'upstream URL has rounded coordinates: ' + calls[0]);
ok(r.headers.get('X-Relay-Source') === 'adsb.lol', 'source header: ' + r.headers.get('X-Relay-Source'));

// 2. other websites are refused and nothing goes upstream
calls = [];
r = await worker.fetch(req('/v2/point/41.01/-76.01/10', { headers: { Origin: 'https://evil.example.com' } }));
ok(r.status === 403 && calls.length === 0, 'foreign origin refused without calling the feed');
ok(!r.headers.get('Access-Control-Allow-Origin'), 'no CORS header for foreign origin');

// 3. no Origin (address bar, curl) is allowed but gets no CORS header
r = await worker.fetch(req('/v2/point/42.01/-77.01/10'));
ok(r.status === 200 && !r.headers.get('Access-Control-Allow-Origin'), 'no-Origin request works, no CORS header');

// 4. preflight
r = await worker.fetch(req('/v2/point/42.01/-77.01/10', { method: 'OPTIONS', headers: { Origin: GOOD } }));
ok(r.status === 204 && r.headers.get('Access-Control-Allow-Methods') === 'GET, OPTIONS', 'preflight answered');

// 5. bad paths, bad methods, bad numbers
ok((await worker.fetch(req('/nope'))).status === 404, 'unknown path 404');
ok((await worker.fetch(req('/v2/point/42.01/-77.01/10', { method: 'POST' }))).status === 405, 'POST refused');
ok((await worker.fetch(req('/v2/point/123.0/-77.01/10'))).status === 400, 'latitude 123 refused');
ok((await worker.fetch(req('/v2/point/42.0/-77.01/0'))).status === 400, 'radius 0 refused');

// 6. radius is clamped
calls = [];
await worker.fetch(req('/v2/point/43.01/-78.01/999'));
ok(calls[0] === 'https://api.adsb.lol/v2/point/43.01/-78.01/25', 'radius clamped to 25: ' + calls[0]);

// 7. falls back to the second feed when the first fails (three failure styles)
for (var mode of ['throw', 'http500', 'html']) {
  behaviour = { 'api.adsb.lol': mode };
  calls = [];
  r = await worker.fetch(req('/v2/point/44.0' + mode.length + '/-79.01/10', { headers: { Origin: GOOD } }));
  j = await r.json();
  ok(r.status === 200 && j.src === 'api.adsb.one' && calls.length === 2, 'fallback works when first feed fails by ' + mode);
  ok(r.headers.get('X-Relay-Source') === 'adsb.one', 'fallback source header (' + mode + ')');
}

// 8. both feeds down gives 502 with CORS headers so the page can read the error
behaviour = { 'api.adsb.lol': 'throw', 'api.adsb.one': 'http500' };
r = await worker.fetch(req('/v2/point/45.01/-80.01/10', { headers: { Origin: GOOD } }));
ok(r.status === 502 && r.headers.get('Access-Control-Allow-Origin') === GOOD, 'both feeds down: 502 with CORS');

// 9. identical requests inside the cache window do not hit the feed again
behaviour = {};
calls = [];
await worker.fetch(req('/v2/point/46.01/-81.01/10'));
r = await worker.fetch(req('/v2/point/46.01/-81.01/10'));
ok(calls.length === 1, 'second identical request served from cache (feed called ' + calls.length + ' time)');
ok((r.headers.get('X-Relay-Source') || '').indexOf('cached') > -1, 'cached marker present');

// 10. nearby coordinates that round the same share one cache entry
calls = [];
await worker.fetch(req('/v2/point/47.014/-82.014/10'));
await worker.fetch(req('/v2/point/47.011/-82.012/10'));
ok(calls.length === 1, 'coordinates that round to the same 2 decimals share a cache entry');

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
