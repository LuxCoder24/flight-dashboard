// Directed by: Nathan | Written by: Claude (Sonnet 5.5, Anthropic) | Date: 2026-10-19
// Change log: 2026-10-19 v0.3.1 Claude, directed by Nathan: copied into the project folder, header added. Logic unchanged.
// Change log: 2026-10-19 v0.5 GPT-6 (OpenAI), directed by Nathan: multi selection, view switching and helicopter checks.
// Tests for the pure logic in /home/claude/window-jet/index.html
// Usage: node test_windowjet.js /path/to/index.html
var fs = require('fs');
var html = fs.readFileSync(process.argv[2], 'utf8');
var m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.log('FAIL: no script block'); process.exit(1); }

var mod = { exports: {} };
// Run the script the way a CommonJS module would; the DOM section is skipped because document is undefined.
new Function('module', m[1])(mod);
var A = mod.exports, fails = 0, passes = 0;
function ok(cond, name) { if (cond) { passes++; } else { fails++; console.log('FAIL: ' + name); } }
function near(a, b, tol) { return Math.abs(a - b) <= tol; }

var cfg = { HOME_LAT: 38.0, HOME_LON: -77.0, WINDOW_HEADING: 190, FOV_DEG: 140, MAX_DIST_NM: 6, MAX_ALT_FT: 12000 };
var now = 1000000;
function mk(eastNm, northNm, altFt, track, gs, vr) {
  var lat = cfg.HOME_LAT + northNm * 1852 / 111320;
  var lon = cfg.HOME_LON + eastNm * 1852 / (111320 * Math.cos(cfg.HOME_LAT * Math.PI / 180));
  return { hex: 'x' + eastNm + northNm, callsign: 'T', alt: altFt, gs: gs || 0, track: track || 0, vr: vr || 0, lat: lat, lon: lon, _t: now };
}

// --- angle helpers
ok(A.norm180(190 - 350) === -160, 'norm180 wrap');
ok(A.norm360(-10) === 350, 'norm360 wrap');

// --- geometry: plane due south of home sits at azimuth 180, 10 deg left of a 190 window => rel = -10
var s = A.evaluate(mk(0, -3, 3000, 0, 0, 0), now, cfg);
ok(near(s.az, 180, 0.5), 'south az ~180, got ' + s.az);
ok(near(s.rel, -10, 0.5), 'south rel ~-10, got ' + s.rel);
ok(s.inFov, 'south in FOV');
ok(near(s.distNm, 3, 0.05), 'distance ~3 nm, got ' + s.distNm);
// elevation: 3000 ft = 914 m over 3 nm (5556 m) => atan(0.1645) = 9.35 deg
ok(near(s.el, 9.35, 0.2), 'elevation ~9.35, got ' + s.el);

// west of home (az 270) => rel +80, must be RIGHT of centre when facing south; east (az 90) => rel -100, left
ok(A.evaluate(mk(-3, 0, 2000, 0, 0, 0), now, cfg).rel > 0, 'west is right of centre');
ok(A.evaluate(mk(3, 0, 2000, 0, 0, 0), now, cfg).rel < 0, 'east is left of centre');
// plane due north is behind the window => out of FOV
ok(!A.evaluate(mk(0, 3, 2000, 0, 0, 0), now, cfg).inFov, 'north is outside FOV');

// --- sprite direction: heading west (270) moves right; heading east (90) moves left
ok(A.spriteDir(270, 190, 1) === 1, 'westbound goes right');
ok(A.spriteDir(90, 190, 1) === -1, 'eastbound goes left');
ok(A.spriteDir(190, 190, -1) === -1, 'head-on keeps previous direction');
ok(A.spriteDir(10, 190, 1) === 1, 'moving directly away keeps previous direction');

// --- dead reckoning: westbound 160 kt for 30 s should move ~1.33 nm west (rel az increases)
var p = mk(3, -2, 2000, 270, 160, 0);
var e0 = A.evaluate(p, now, cfg), e1 = A.evaluate(p, now + 30000, cfg);
ok(e1.rel > e0.rel, 'westbound plane drifts right over time');
ok(near(e1.lat, e0.lat, 1e-4), 'westbound keeps latitude');
// altitude gain from vertical rate: 2000 fpm for 30 s = +1000 ft
var c = mk(0, -3, 2000, 270, 0, 2000);
ok(near(A.evaluate(c, now + 30000, cfg).altFt, 3000, 1), 'altitude dead-reckons with vrate');
// dead reckoning is capped at 60 s
ok(near(A.evaluate(c, now + 600000, cfg).altFt, 4000, 1), 'dead reckoning capped at 60 s');

// --- normalize
ok(A.normalize({ lat: 1, lon: 1, alt_baro: 'ground' }, now) === null, 'ground aircraft dropped');
ok(A.normalize({ lon: 1, alt_baro: 100 }, now) === null, 'missing lat dropped');
var n = A.normalize({ hex: 'abc', flight: 'UAL123  ', t: 'B738', alt_baro: 2500, gs: 180.5, track: 271, baro_rate: -900, lat: 38.1, lon: -77.1, seen_pos: 2 }, now);
ok(n && n.callsign === 'UAL123', 'callsign trimmed');
ok(n && n._t === now - 2000, 'seen_pos applied');
ok(n && n.vr === -900, 'baro_rate read');
var n2 = A.normalize({ lat: 1, lon: 1, alt_geom: 1200, geom_rate: 500 }, now);
ok(n2 && n2.alt === 1200 && n2.vr === 500, 'falls back to geometric altitude and rate');

// --- pick: nearest wins; sticky current stays; out-of-range and too-high excluded
var near1 = mk(0, -2, 2000), far1 = mk(0, -5, 2000), high = mk(0, -1, 30000), behind = mk(0, 1, 1000), toofar = mk(0, -9, 1000);
near1.hex = 'near'; far1.hex = 'far'; high.hex = 'high'; behind.hex = 'behind'; toofar.hex = 'toofar';
var list = [far1, near1, high, behind, toofar];
ok(A.pick(list, now, cfg, null).ac.hex === 'near', 'nearest candidate chosen');
ok(A.pick(list, now, cfg, 'far').ac.hex === 'far', 'current aircraft is kept while valid');
ok(A.pick([high, behind, toofar], now, cfg, null) === null, 'no candidates gives null');

// --- pitch + stats
ok(A.pitchDeg(2400, 160) > 0 && A.pitchDeg(-2400, 160) < 0, 'pitch sign follows vertical rate');
ok(Math.abs(A.pitchDeg(99999, 60)) <= 22, 'pitch clamped');
var st = A.formatStats(3000, 160, 2400, 'metric');
ok(st.alt === 910 && st.spd === 296 && near(st.vr, 12.2, 0.05), 'metric stats: ' + JSON.stringify(st));
var sa = A.formatStats(3040, 160, 2430, 'aviation');
ok(sa.alt === 3000 && sa.spd === 160 && sa.vr === 2450, 'aviation stats: ' + JSON.stringify(sa));

// --- route parsing
var r = A.parseRoute({ response: { flightroute: { airline: { name: 'X Air' }, origin: { iata_code: 'DCA', municipality: 'Washington' }, destination: { icao_code: 'KORD', name: 'Chicago O Hare' } } } });
ok(r && r.airline === 'X Air' && r.origin.code === 'DCA' && r.dest.code === 'KORD', 'route parsed');
ok(A.parseRoute({ response: 'unknown callsign' }) === null, 'unknown callsign gives null');

// --- demo flight should be a valid candidate for part of its loop (same maths as the page)
var inView = 0, total = 0;
for (var t = 0; t < 70; t += 1) {
  var eastNm = 3.6 - (160 / 3600) * t, southNm = 1.4;
  var d = mk(eastNm, -southNm, 900 + t * 40, 270, 160, 2400);
  var ev = A.evaluate(d, now, cfg); total++;
  if (A.isCandidate(ev, cfg)) { inView++; }
}
ok(inView > 20, 'demo plane is visible for a decent part of its loop (' + inView + '/' + total + ')');

// --- v0.2: simulator maths and time scale
var simCfg = { HOME_LAT: 38.0, HOME_LON: -77.0 };
ok(A.DEMO_PRESETS.length === 6, 'six presets');
var P = A.DEMO_PRESETS[0]; P = JSON.parse(JSON.stringify(P)); P.hex = 'h'; P.callsign = 'DMA123';
var r0 = A.simRaw(P, 0, 1, simCfg), r60 = A.simRaw(P, 60, 1, simCfg);
// westbound: longitude decreases; 150 kt for 60 s = 2.5 nm
ok(r60.lon < r0.lon, 'westbound sim moves west');
ok(near(r0._eNm - r60._eNm, 2.5, 0.01), 'sim covers 2.5 nm in 60 s at 150 kt, got ' + (r0._eNm - r60._eNm));
ok(near(r60.alt_baro - r0.alt_baro, 2400, 0.5), 'sim climbs 2400 ft in 60 s at 2400 fpm');
ok(A.simAlive(r0, 0), 'fresh sim alive');
ok(!A.simAlive(A.simRaw(P, 800, 1, simCfg), 1000), 'old sim removed (age)');
ok(!A.simAlive(A.simRaw(P, 800, 1, simCfg), 800) , 'sim that flew 33 nm away is removed (distance)');
// time scale: with _k = 3, 10 real seconds of dead reckoning equals 30 s of flight
var base = A.normalize(A.simRaw(P, 0, 3, simCfg), now);
var base1 = A.normalize(A.simRaw(P, 0, 1, simCfg), now);
var ev3 = A.evaluate(base, now + 10000, cfg), ev1 = A.evaluate(base1, now + 30000, cfg);
ok(near(ev3.lon, ev1.lon, 1e-6) && near(ev3.altFt, ev1.altFt, 0.01), 'time scale k=3 matches 3x real time');
ok(A.normalize({ lat: 1, lon: 1, alt_baro: 100 }, now)._k === 1, 'real data always has k=1');
// every preset must actually cross the window view at some point in its life (otherwise its button is useless)
for (var pi = 0; pi < A.DEMO_PRESETS.length; pi++) {
  var pr = JSON.parse(JSON.stringify(A.DEMO_PRESETS[pi])); pr.hex = 'p' + pi; pr.callsign = 'X' + pi;
  var seen = 0;
  for (var age = 0; age < 400; age += 2) {
    var raw = A.simRaw(pr, age, 1, cfg);
    if (!A.simAlive(raw, age)) { break; }
    var e2 = A.evaluate(A.normalize(raw, now), now, { HOME_LAT: cfg.HOME_LAT, HOME_LON: cfg.HOME_LON, WINDOW_HEADING: 190, FOV_DEG: 140, MAX_DIST_NM: 6, MAX_ALT_FT: 12000 });
    if (A.isCandidate(e2, cfg)) { seen++; }
  }
  ok(seen >= 10, 'preset "' + pr.label + '" is visible for ' + (seen * 2) + ' s');
}

// v0.5: multi view shares the focus filters, orders by distance and caps at three.
var mid = mk(0, -3, 1500), fourth = mk(0, -4, 1000);
mid.hex = 'mid'; fourth.hex = 'fourth';
var multiList = [far1, high, mid, behind, near1, fourth, toofar];
var many = A.pickMany(multiList, now, cfg);
ok(many.length === 3, 'multi capped at three');
ok(many.map(function (f) { return f.ac.hex; }).join(',') === 'near,mid,fourth', 'three nearest eligible aircraft in distance order');
ok(A.pickMany([high, behind, toofar], now, cfg).length === 0, 'multi excludes invalid candidates');
ok(A.pickMany([near1], now, cfg).length === 1, 'multi handles one aircraft');
ok(multiList.length === 7 && multiList[0] === far1, 'multi selection does not mutate input');
ok(!A.multiView('auto', 0) && !A.multiView('auto', 1), 'auto focuses with zero or one');
ok(A.multiView('auto', 2) && A.multiView('auto', 3), 'auto switches to multi for two or three');
ok(!A.multiView('single', 3), 'single override keeps focus');
ok(A.multiView('multi', 1), 'multi override keeps multi with one aircraft');
ok(A.isHelicopter('H60') && A.isHelicopter('r44') && A.isHelicopter('EC35'), 'recognises supported helicopter types case insensitively');
ok(!A.isHelicopter('A320') && !A.isHelicopter('B738'), 'jets retain jet icon');
ok(!A.isHelicopter('') && !A.isHelicopter(null) && !A.isHelicopter('UNKNOWN'), 'unknown types default to aircraft icon');

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
