// Directed by Nathan | Written by GPT-6 (OpenAI) | 2026-10-19
// Change log: initial map geometry, wedge, freshness, unit and input checks.
var fs=require('fs'),html=fs.readFileSync(process.argv[2]||'map.html','utf8'),mod={exports:{}};
new Function('module',html.match(/<script>([\s\S]*)<\/script>/)[1])(mod);
var A=mod.exports,passes=0,fails=0,now=1000000;
function ok(v,n){if(v){passes++;}else{fails++;console.log('FAIL: '+n);}}
function near(a,b,t){return Math.abs(a-b)<t;}
var home={lat:38,lon:-77},zone={lat:38,lon:-77,radius:10000,heading:190,fov:100};
function ac(heading,meters){var p=A.destination(home,heading,meters);return {lat:p.lat,lon:p.lon,alt:2000,gs:0,vr:0,track:0,time:now};}
[3,11,17].forEach(function(z){var p=A.project(home.lat,home.lon,z),q=A.unproject(p.x,p.y,z);ok(near(home.lat,q.lat,1e-7)&&near(home.lon,q.lon,1e-7),'projection round trip zoom '+z);});
ok(near(A.distance(home,home),0,.01),'same point zero distance');
ok(near(A.distance(home,A.destination(home,190,5000)),5000,.01),'great circle distance matches destination');
ok(near(A.bearing(home,A.destination(home,190,5000)),190,.001),'bearing matches destination');
ok(A.inZone(ac(190,5000),zone,now),'ahead inside wedge');
ok(!A.inZone(ac(10,5000),zone,now),'behind excluded even inside range');
ok(!A.inZone(ac(251,5000),zone,now),'outside right edge excluded');
ok(!A.inZone(ac(129,5000),zone,now),'outside left edge excluded');
ok(A.inZone(ac(141,5000),zone,now)&&A.inZone(ac(239,5000),zone,now),'both inner wedge edges included');
ok(!A.inZone(ac(190,10001),zone,now),'out of reach excluded');
ok(A.inZone(ac(190,9999),zone,now),'just inside reach included');
var northZone={lat:38,lon:-77,radius:10000,heading:0,fov:60};
ok(A.inZone(ac(350,5000),northZone,now)&&A.inZone(ac(10,5000),northZone,now),'north facing wedge wraps zero degrees');
ok(!A.inZone(ac(180,5000),northZone,now),'north wedge excludes south');
var high=ac(190,5000);high.alt=40000;ok(A.inZone(high,zone,now),'no window altitude ceiling on map');
var stale=ac(190,5000);stale.time=now-61000;ok(!A.inZone(stale,zone,now),'stale fix removed after 60 seconds');
var climbing=ac(190,5000);climbing.vr=600;ok(A.position(climbing,now+30000).alt===2300,'altitude advances');
ok(A.position(climbing,now+120000).alt===2600,'reckoning capped at 60 seconds');
var moving=ac(190,5000);moving.gs=100;moving.track=90;ok(A.position(moving,now+10000).lon>moving.lon,'eastbound position moves east');
ok(A.normalize({lat:1,lon:1,alt_baro:'ground',alt_geom:100},now)===null,'ground rejected even with geometric altitude');
ok(A.normalize({lat:91,lon:1,alt_baro:100},now)===null,'invalid latitude rejected');
ok(A.normalize({lat:1,lon:181,alt_baro:100},now)===null,'invalid longitude rejected');
ok(A.normalize({lat:1,lon:1,alt_baro:0},now)===null,'zero altitude rejected');
ok(A.normalize({lat:1,lon:1},now)===null,'missing altitude rejected');
var n=A.normalize({lat:38,lon:-77,alt_geom:1000,flight:' TEST1 ',seen_pos:5,t:'H60'},now);
ok(n.callsign==='TEST1'&&n.time===now-5000&&n.type==='H60','normalization fields and fix age');
ok(A.helicopter('H60')&&A.helicopter('r44')&&!A.helicopter('A320'),'helicopter heuristic');
ok(A.radiusMeters(10,false)===10000,'metric reach conversion');
ok(A.radiusMeters(10,true)===18520,'aviation reach conversion');
ok(A.radiusMeters(100,false)===44000&&A.radiusMeters(100,true)===44448,'reach clamped below relay cap');
ok(A.radiusMeters(-4,false)===1000,'reach minimum');
ok(A.query('?api=https%3A%2F%2Fx.example%2Fa%3Fb%3Dc&heading=0').api==='https://x.example/a?b=c','encoded query values parsed');
ok(A.query('?bad=%ZZ&heading=90').heading==='90','malformed option ignored');
var dateline={lat:0,lon:179.99},p=A.destination(dateline,90,10000);ok(p.lon<0&&near(A.distance(dateline,p),10000,.01),'destination wraps dateline');
var edge=A.project(90,180,11);ok(isFinite(edge.y),'projection clamps polar latitude');
console.log(passes+' passed, '+fails+' failed');process.exitCode=fails?1:0;
