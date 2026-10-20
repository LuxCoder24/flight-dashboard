/*
 * WindowJet relay: a small Cloudflare Worker that lets the WindowJet web page get live plane positions.
 *
 * Why it exists: the public ADS-B feeds (adsb.lol, adsb.one, ...) do not send CORS headers, so a web page
 * on github.io cannot call them directly (tested 2026-10-19, see docs/FINDINGS.md). This Worker calls the
 * feed from the server side and adds the header for the page's origin.
 *
 * Request:  GET /v2/point/{lat}/{lon}/{radius_nm}
 * Response: the feed's JSON, passed through unchanged, with CORS headers for ALLOWED_ORIGINS.
 *
 * Privacy: the latitude and longitude are rounded to 2 decimals (about 1 km) before being sent upstream,
 * so the feed never sees your exact position. The page filters by your exact position itself.
 *
 * Directed by: Nathan | Written by: Claude (Sonnet 5.5, Anthropic) | Date: 2026-10-19
 *
 * CHANGE LOG
 * 2026-10-19  v0.1  Claude, directed by Nathan
 *             Initial version. Tested with a mocked fetch in Node (worker/test_worker.mjs).
 *             NEVER DEPLOYED OR RUN AGAINST THE REAL FEEDS when this was written: the build sandbox
 *             could not reach them. In-memory cache is best effort (one copy per Worker instance).
 */

var ALLOWED_ORIGINS = ['https://luxcoder24.github.io'];
var UPSTREAMS = ['https://api.adsb.lol', 'https://api.adsb.one'];   // tried in this order
var MAX_RADIUS_NM = 25;
var CACHE_MS = 4000;       // identical requests inside this window reuse the last answer
var TIMEOUT_MS = 6000;     // per upstream attempt
var USER_AGENT = 'WindowJet-relay/0.1 (personal hobby project)';

var cache = {};            // key -> { t: ms, body: string, source: string }

function corsHeaders(origin) {
  var h = { 'Vary': 'Origin' };
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type';
    h['Access-Control-Expose-Headers'] = 'X-Relay-Source';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}

function reply(body, status, origin, extra) {
  var headers = corsHeaders(origin), k;
  headers['Content-Type'] = 'application/json; charset=utf-8';
  headers['Cache-Control'] = 'no-store';
  if (extra) { for (k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) { headers[k] = extra[k]; } } }
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status: status, headers: headers });
}

function round2(x) { return (Math.round(x * 100) / 100).toFixed(2); }

async function fetchUpstream(base, path, why) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
  try {
    var res = await fetch(base + path, {
      headers: { 'Accept': 'application/json', 'User-Agent': USER_AGENT },
      signal: controller.signal
    });
    if (!res.ok) { why.push(base.replace('https://api.', '') + ': HTTP ' + res.status); return null; }
    var text = await res.text();
    var json;
    try { json = JSON.parse(text); } catch (pe) { why.push(base.replace('https://api.', '') + ': not JSON'); return null; }   // feed sent HTML or junk
    if (!json || typeof json !== 'object') { why.push(base.replace('https://api.', '') + ': not JSON'); return null; }
    return text;
  } catch (e) {
    why.push(base.replace('https://api.', '') + ': ' + (e && e.name === 'AbortError' ? 'timeout' : 'network error'));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request) {
    var origin = request.headers.get('Origin') || '';

    // Browsers from other websites are refused. Requests with no Origin (address bar, curl) are allowed.
    if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
      return reply({ error: 'origin not allowed' }, 403, origin);
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      return reply({ error: 'method not allowed' }, 405, origin, { 'Allow': 'GET, OPTIONS' });
    }

    var url = new URL(request.url);
    var m = /^\/v2\/point\/(-?\d{1,3}(?:\.\d+)?)\/(-?\d{1,3}(?:\.\d+)?)\/(\d{1,3}(?:\.\d+)?)\/?$/.exec(url.pathname);
    if (!m) { return reply({ error: 'not found. use /v2/point/{lat}/{lon}/{radius_nm}' }, 404, origin); }

    var lat = parseFloat(m[1]), lon = parseFloat(m[2]), radius = parseFloat(m[3]);
    if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && radius > 0)) {
      return reply({ error: 'bad coordinates or radius' }, 400, origin);
    }
    radius = Math.min(radius, MAX_RADIUS_NM);

    var path = '/v2/point/' + round2(lat) + '/' + round2(lon) + '/' + radius;
    var now = Date.now(), hit = cache[path];
    if (hit && now - hit.t < CACHE_MS) {
      return reply(hit.body, 200, origin, { 'X-Relay-Source': hit.source + ' (cached)' });
    }

    var why = [];
    for (var i = 0; i < UPSTREAMS.length; i++) {
      var body = await fetchUpstream(UPSTREAMS[i], path, why);
      if (body !== null) {
        var source = UPSTREAMS[i].replace('https://api.', '');
        cache[path] = { t: Date.now(), body: body, source: source };
        return reply(body, 200, origin, { 'X-Relay-Source': source });
      }
    }
    return reply({ error: 'all upstream feeds failed', details: why }, 502, origin);
  }
};
