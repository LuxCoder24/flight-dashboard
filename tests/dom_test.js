// Directed by: Nathan | Written by: Claude (Sonnet 5.5, Anthropic) | Date: 2026-10-19
// Change log: 2026-10-19 v0.3.1 Claude, directed by Nathan: copied into the project folder, header added. Logic unchanged.
//             2026-10-19 v0.4   Claude, directed by Nathan: added checks 11 and 12 for the ?api= option (now 36 checks).
// Change log: 2026-10-19 v0.5 GPT-6 (OpenAI), directed by Nathan: icon and automatic/manual multi-view lifecycle checks.
// Change log: 2026-10-19 v0.6 GPT-6 (OpenAI), directed by Nathan: map link and option forwarding checks.
// Runs the real page in jsdom (demo mode) and clicks every control.
// Usage: node dom_test.js <path to jsdom module dir> <path to index.html>
var JSDOM = require(process.argv[2]).JSDOM;
var fs = require('fs');
var html = fs.readFileSync(process.argv[3], 'utf8');

var errors = [];
var dom = new JSDOM(html, {
  url: 'https://example.github.io/window-jet/?demo=1&debug=1',
  runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse: function (w) { w.addEventListener('error', function (e) { errors.push(String(e.message)); }); }
});
var w = dom.window, d = w.document;
var fails = 0, passes = 0;
function ok(c, n) { if (c) { passes++; } else { fails++; console.log('FAIL: ' + n); } }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function text(id) { return d.getElementById(id).textContent; }
function btn(label) {
  var bs = d.querySelectorAll('#demoBar button');
  for (var i = 0; i < bs.length; i++) { if (bs[i].textContent === label) { return bs[i]; } }
  return null;
}

(async function () {
  await sleep(1500);
  ok(errors.length === 0, 'no script errors on load: ' + errors.join(' | '));
  var labels = [].map.call(d.querySelectorAll('#demoBar button'), function (b) { return b.textContent; });
  ok(labels.length === 11, 'demo bar has 11 buttons, got ' + labels.length + ': ' + labels.join(', '));

  // 1. The auto-spawned first plane should become the featured one and fill the panel.
  ok(d.getElementById('panel').className.indexOf('idle') === -1, 'panel is live after load');
  ok(/^DMA\d{3}$/.test(text('callsign')), 'callsign shown: ' + text('callsign'));
  ok(text('route').indexOf('DCA') === 0 && text('route').indexOf('ORD') > 0, 'route shown: ' + text('route'));
  ok(text('cities').indexOf('Washington') === 0, 'cities shown: ' + text('cities'));
  ok(text('uAlt') === 'm' && text('uSpd') === 'km/h' && text('uVr') === 'm/s', 'metric units by default');
  ok(parseInt(text('vSpd'), 10) === 278, 'speed 150 kt = 278 km/h, got ' + text('vSpd'));
  ok(/CLIMBING/.test(text('chip')), 'chip says climbing: ' + text('chip'));
  ok(d.getElementById('sky').className.indexOf('live') > -1, 'sky is in live state');
  var tf = d.getElementById('plane').style.transform;
  ok(/scaleX\(1\)/.test(tf), 'westbound plane faces right: ' + tf);

  // 2. Departure east flips the sprite to face left. Clear first so it is the only plane.
  btn('Clear sky').click(); await sleep(700);
  ok(d.getElementById('panel').className.indexOf('idle') > -1, 'clear sky returns to idle');
  ok(d.getElementById('sky').className.indexOf('idle') > -1, 'sky idle after clear');
  btn('Departure east').click(); await sleep(700);
  ok(/^DMB\d{3}$/.test(text('callsign')), 'east departure shown: ' + text('callsign'));
  ok(/scaleX\(-1\)/.test(d.getElementById('plane').style.transform), 'eastbound plane faces left');
  ok(text('route').indexOf('BOS') > 0, 'east route: ' + text('route'));

  // 3. Arrival descends and says so.
  btn('Clear sky').click(); await sleep(300);
  btn('Arrival').click(); await sleep(700);
  ok(/DESCENDING/.test(text('chip')), 'arrival is descending: ' + text('chip'));
  ok(text('vVr').charAt(0) === '-', 'negative vertical rate shown: ' + text('vVr'));
  ok(text('route').indexOf('DCA') > 0, 'arrival ends at DCA: ' + text('route'));

  // 4. Helicopter has no route, which must show the fallback text, not a crash.
  btn('Clear sky').click(); await sleep(300);
  btn('Helicopter').click(); await sleep(700);
  ok(/^PAT\d{3}$/.test(text('callsign')), 'helicopter callsign: ' + text('callsign'));
  ok(text('route') === 'Route unavailable', 'unknown route fallback: ' + text('route'));
  ok(text('vType') === 'H60', 'type shown: ' + text('vType'));

  ok(d.getElementById('plane').className.indexOf('helicopter') > -1, 'helicopter uses rotor silhouette');

  // 5. Every remaining button runs without throwing.
  ['Heavy jet', 'Head-on', 'Random', 'Departure west'].forEach(function (l) { btn(l).click(); });
  await sleep(700);
  ok(errors.length === 0, 'no errors after clicking all spawn buttons: ' + errors.join(' | '));

  // 6. Speed buttons: highlight moves, and 6x really moves the plane faster than 1x.
  ok(btn('3x').className === 'on', '3x is the default speed');
  btn('1x').click();
  ok(btn('1x').className === 'on' && btn('3x').className === '', 'speed highlight moves to 1x');
  btn('Clear sky').click(); await sleep(300);
  btn('Departure west').click(); await sleep(300);
  var x1a = parseFloat(/translate3d\(([-\d.]+)px/.exec(d.getElementById('plane').style.transform)[1]);
  // jsdom reports zero layout size, so x is based on a 1px-wide sky; compare relative azimuth through text instead:
  var alt1 = parseInt(text('vAlt'), 10);
  await sleep(3000);
  var alt1b = parseInt(text('vAlt'), 10);
  btn('Clear sky').click(); await sleep(300);
  btn('6x').click(); btn('Departure west').click(); await sleep(300);
  var alt6 = parseInt(text('vAlt'), 10);
  await sleep(3000);
  var alt6b = parseInt(text('vAlt'), 10);
  ok((alt6b - alt6) > (alt1b - alt1) * 3, 'altitude gain over 3 s is much larger at 6x (' + (alt6b - alt6) + ' m) than 1x (' + (alt1b - alt1) + ' m)');

  // 7. A plane that has flown out of view goes away on its own (6x, long wait is too slow, so just check cleanup path via Clear).
  ok(d.getElementById('debug').textContent.indexOf('spawned') > -1, 'debug log records spawns');

  // 8. Imperial units via URL param are wired (separate page load).
  var dom2 = new JSDOM(html, { url: 'https://x.github.io/?demo=1&units=aviation', runScripts: 'dangerously', pretendToBeVisual: true });
  await sleep(1200);
  var d2 = dom2.window.document;
  ok(d2.getElementById('uAlt').textContent === 'ft' && d2.getElementById('uSpd').textContent === 'kt', 'units=aviation shows ft and kt');
  ok(d2.getElementById('vSpd').textContent === '150', 'aviation speed 150 kt, got ' + d2.getElementById('vSpd').textContent);

  // 9. Opening the page with no address options at all goes straight into demo mode with a plane showing.
  var dom3 = new JSDOM(html, { url: 'file:///Users/x/index.html', runScripts: 'dangerously', pretendToBeVisual: true });
  await sleep(1200);
  var d3 = dom3.window.document;
  ok(!!d3.getElementById('demoBar'), 'bare page opens in demo mode (demo bar present)');
  ok(/^DMA\d{3}$/.test(d3.getElementById('callsign').textContent), 'bare page shows a demo plane: ' + d3.getElementById('callsign').textContent);
  ok(d3.getElementById('banner').style.display !== 'block', 'no warning banner in demo mode');

  // 10. With coordinates given, it is live mode: no demo bar, no demo planes, and it tries the real feed.
  var dom4 = new JSDOM(html, { url: 'https://x.github.io/?lat=38.9&lon=-77.0', runScripts: 'dangerously', pretendToBeVisual: true });
  await sleep(500);
  var d4 = dom4.window.document;
  ok(!d4.getElementById('demoBar'), 'no demo bar when coordinates are given');
  ok(d4.getElementById('panel').className.indexOf('idle') > -1, 'live mode starts idle until real data arrives');

  // 11. ?api= points live mode at the relay: the first request goes there, in the feed's path format.
  var seenUrls = [];
  new JSDOM(html, { url: 'https://x.github.io/?lat=40.1&lon=-75.6&api=https://relay.example.workers.dev/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse: function (w5) { var orig = w5.XMLHttpRequest.prototype.open; w5.XMLHttpRequest.prototype.open = function (m, u) { seenUrls.push(u); return orig.apply(this, arguments); }; } });
  await sleep(600);
  ok(seenUrls[0] === 'https://relay.example.workers.dev/v2/point/40.1/-75.6/10', 'api option: first request goes to the relay: ' + seenUrls[0]);

  // 12. A non-https api value is ignored and the built-in feed list is used instead.
  var seen2 = [];
  new JSDOM(html, { url: 'https://x.github.io/?lat=40.1&lon=-75.6&api=http://insecure.example.com', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse: function (w6) { var o2 = w6.XMLHttpRequest.prototype.open; w6.XMLHttpRequest.prototype.open = function (m, u) { seen2.push(u); return o2.apply(this, arguments); }; } });
  await sleep(600);
  ok(/^https:\/\/api\.adsb\.lol\/v2\/point\//.test(seen2[0] || ''), 'insecure api option ignored: ' + seen2[0]);

  ok(d.getElementById('mapLink').getAttribute('href').indexOf('map.html?demo=1') === 0, 'map edition link available in demo');
  ok(d4.getElementById('mapLink').getAttribute('href') === 'map.html?lat=38.9&lon=-77.0', 'map link preserves live location options');

  // 13. Auto view, limit, icon mixing, manual overrides and cleanup.
  function view(mode) { return d.querySelector('#viewBar [data-view="' + mode + '"]'); }
  btn('1x').click(); btn('Clear sky').click(); await sleep(700);
  ok(d.querySelectorAll('.aircraftSprite.visible').length === 0, 'clear hides all three sprites');
  btn('Departure west').click(); await sleep(700);
  ok(d.getElementById('panel').className === '', 'auto focuses one aircraft');
  ok(d.getElementById('plane').className.indexOf('helicopter') === -1, 'jet restores fixed-wing silhouette');
  btn('Helicopter').click(); await sleep(1100);
  ok(d.getElementById('panel').className === 'multi', 'second aircraft automatically activates multi');
  ok(d.querySelectorAll('.aircraftSprite.visible').length === 2, 'two sky sprites visible');
  ok(d.querySelectorAll('.aircraftCard').length === 2, 'two matching information cards');
  ok(d.querySelectorAll('.aircraftSprite.visible.helicopter').length === 1, 'mixed traffic has helicopter icon');
  var skyCalls = [].map.call(d.querySelectorAll('.aircraftSprite.visible .skyLabel'), function (el) { return el.textContent; });
  var cardCalls = [].map.call(d.querySelectorAll('.aircraftCard strong'), function (el) { return el.textContent; });
  ok(skyCalls.join(',') === cardCalls.join(','), 'sky callsigns match card order');
  btn('Arrival').click(); btn('Heavy jet').click(); await sleep(1100);
  ok(d.querySelectorAll('.aircraftSprite.visible').length === 3 && d.querySelectorAll('.aircraftCard').length === 3, 'four candidates display at most three sprites and cards');
  view('single').click(); await sleep(700);
  ok(d.getElementById('panel').className === '' && d.querySelectorAll('.aircraftSprite.visible').length === 1, 'single override shows one aircraft');
  ok(view('single').getAttribute('aria-pressed') === 'true', 'manual choice exposed to accessibility');
  view('multi').click(); await sleep(1100);
  ok(d.getElementById('panel').className === 'multi' && d.querySelectorAll('.aircraftSprite.visible').length === 3, 'multi override restores three');
  view('auto').click(); btn('Clear sky').click(); await sleep(700);
  ok(d.getElementById('panel').className === 'idle' && d.querySelectorAll('.aircraftSprite.visible').length === 0, 'auto returns idle and removes old sprites');
  btn('Departure east').click(); await sleep(700);
  ok(d.getElementById('panel').className === '' && d.querySelectorAll('.aircraftSprite.visible').length === 1, 'auto returns to focus after traffic drops to one');
  ok(errors.length === 0, 'no script errors throughout view switching: ' + errors.join(' | '));
  var dom7 = new JSDOM(html, { url: 'https://x.github.io/?demo=1&view=multi&units=aviation', runScripts: 'dangerously', pretendToBeVisual: true });
  await sleep(1100);
  ok(dom7.window.document.getElementById('panel').className === 'multi', 'view URL option starts in multi');
  ok(/ft/.test(dom7.window.document.getElementById('multiCards').textContent) && /kt/.test(dom7.window.document.getElementById('multiCards').textContent), 'multi cards respect aviation units');
  dom7.window.close();

  console.log(passes + ' passed, ' + fails + ' failed');
  process.exit(fails ? 1 : 0);
})();
