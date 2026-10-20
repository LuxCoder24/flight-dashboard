// Directed by Nathan | Written by GPT-6 (OpenAI) | 2026-10-19
// Change log: 2026-10-19 v0.2 GPT-6 (OpenAI), directed by Nathan: persistence and idle drawer lifecycle.
// Change log: initial map controls, wedge filtering, bookmarks and relay integration checks.
var fs=require('fs'),JSDOM=require(process.argv[2]).JSDOM,html=fs.readFileSync(process.argv[3]||'map.html','utf8');
var passes=0,fails=0;
function ok(v,n){if(v){passes++;}else{fails++;console.log('FAIL: '+n);}}
function load(search,feed,storage){
 var errors=[],urls=[],timers=[],timeouts={},nextTimer=0;
 var dom=new JSDOM(html,{url:'https://example.github.io/flight-dashboard/map.html?tiles=0&'+search,runScripts:'dangerously',pretendToBeVisual:true,beforeParse:function(w){
  w.addEventListener('error',function(e){errors.push(e.message);});
  w.setInterval=function(fn){timers.push(fn);return timers.length;};
  w.setTimeout=function(fn,ms){timeouts[++nextTimer]={fn:fn,ms:ms};return nextTimer;};
  w.clearTimeout=function(id){delete timeouts[id];};
  if(storage&&storage.blocked){Object.defineProperty(w,'localStorage',{get:function(){throw new Error('Storage blocked');}});}
  else if(storage&&typeof storage.raw==='string'){w.localStorage.setItem('windowjet.map.view.v1',storage.raw);}
  w.XMLHttpRequest=function(){this.open=function(m,url){urls.push(url);};this.send=function(){this.status=feed&&feed.status||200;this.readyState=4;this.responseText=JSON.stringify(feed&&feed.body||{ac:[]});this.onreadystatechange();};};
 }});
 return {w:dom.window,d:dom.window.document,errors:errors,urls:urls,tick:function(){timers.forEach(function(fn){fn();});},idle:function(){Object.keys(timeouts).forEach(function(id){var t=timeouts[id];if(t&&t.ms===15000){delete timeouts[id];t.fn();}});},close:function(){dom.window.close();}};
}
function el(s,id){return s.d.getElementById(id);}
function change(s,id,value){el(s,id).value=String(value);el(s,id).dispatchEvent(new s.w.Event('input',{bubbles:true}));el(s,id).dispatchEvent(new s.w.Event('change',{bubbles:true}));}
var s=load('');
ok(s.errors.length===0,'no load errors');ok(el(s,'edition').textContent.indexOf('DEMO')===0,'bare map defaults demo');ok(s.urls.length===0,'demo makes no feed requests');ok(el(s,'count').textContent==='3','three demo aircraft inside default forward wedge');ok(s.d.querySelectorAll('.marker').length===3,'demo markers appear');ok(el(s,'zoneShape').getAttribute('d').indexOf('M')===0&&/Z$/.test(el(s,'zoneShape').getAttribute('d')),'viewing wedge drawn as closed path');ok(el(s,'radiusValue').textContent==='10 km','metric reach default');
s.d.querySelector('.marker').click();ok(el(s,'selectedCall').textContent!=='Tap an aircraft','select marker shows callsign');ok(/km\/h/.test(el(s,'selectedStats').textContent),'metric stats');ok(s.d.querySelectorAll('.marker.selected').length===1,'selection highlighted');var stable=s.d.querySelector('.marker');stable.focus();s.tick();ok(s.d.querySelector('.marker')===stable,'poll updates reuse marker buttons');ok(s.d.activeElement===stable,'poll preserves keyboard focus');
change(s,'radius',1);ok(el(s,'count').textContent==='0','short reach excludes demo traffic');ok(el(s,'selectedCall').textContent==='Tap an aircraft','selection clears outside wedge');change(s,'radius',10);
change(s,'heading',0);ok(el(s,'headingValue').textContent==='0°','heading slider includes north');change(s,'fov',40);ok(el(s,'fovValue').textContent==='40°','width slider updates');
el(s,'chooseZone').click();ok(el(s,'chooseZone').getAttribute('aria-pressed')==='true','choose zone armed');
var map=el(s,'map');map.dispatchEvent(new s.w.MouseEvent('mousedown',{bubbles:true,clientX:600,clientY:350}));s.w.dispatchEvent(new s.w.MouseEvent('mouseup',{bubbles:true,clientX:600,clientY:350}));ok(el(s,'chooseZone').getAttribute('aria-pressed')==='false','zone placed with map tap');el(s,'saveZone').click();var params=new s.w.URL(s.w.location.href).searchParams;ok(params.has('lat')&&params.has('lon'),'saved link also contains viewpoint');ok(params.get('heading')==='0'&&params.get('fov')==='40'&&params.get('radius')==='10','wedge settings saved');ok(params.get('demo')==='1','saved demo remains demo');ok(el(s,'saveZone').textContent.indexOf('Saved')===0,'bookmark confirmation');ok(el(s,'windowLink').getAttribute('href').indexOf('heading=0')!==-1,'window link keeps chosen direction');
var before=el(s,'zoneShape').getAttribute('d');el(s,'zoomIn').click();ok(el(s,'zoneShape').getAttribute('d')!==before,'zoom changes map geometry');el(s,'zoomOut').click();el(s,'fitZone').click();ok(s.errors.length===0,'controls do not throw');ok(s.d.querySelectorAll('#tiles img').length===0,'test mode never requests basemap tiles');s.close();
var raw=[{hex:'ahead',flight:'FRONT',lat:37.96,lon:-77,alt_baro:3000,gs:0},{hex:'behind',flight:'BACK',lat:38.04,lon:-77,alt_baro:3000,gs:0},{hex:'ground',lat:37.96,lon:-77,alt_baro:'ground'}];
s=load('lat=38&lon=-77&heading=180&fov=80&api=https%3A%2F%2Frelay.example',{body:{ac:raw}});ok(el(s,'edition').textContent==='LIVE','coordinates enable live mode');ok(s.urls[0]==='https://relay.example/v2/point/38/-77/7','relay receives zone centre and padded radius');ok(el(s,'count').textContent==='1','live excludes behind and grounded aircraft');ok(s.d.querySelector('.marker').getAttribute('aria-label')==='FRONT aircraft','correct live aircraft displayed');ok(!el(s,'restartDemo'),'live has no demo button');ok(el(s,'feedStatus').textContent.indexOf('Live positions')===0,'live success status');change(s,'heading',0);ok(s.d.querySelector('.marker').getAttribute('aria-label')==='BACK aircraft','rotating wedge selects aircraft in new direction');ok(s.errors.length===0,'live wiring no errors');s.close();
s=load('demo=1&units=aviation&radius=8');ok(el(s,'radiusValue').textContent==='8 nm','aviation reach');s.d.querySelector('.marker').click();ok(/ft.*kt/.test(el(s,'selectedStats').textContent),'aviation stats');ok(el(s,'radius').max==='24','radius reserves relay rounding margin');s.close();
s=load('lat=38&lon=-77&api=http%3A%2F%2Finsecure.example',{status:502,body:{error:'failed'}});ok(s.urls[0].indexOf('https://api.adsb.lol/')===0,'insecure relay ignored');ok(/Feed unavailable/.test(el(s,'feedStatus').textContent),'feed failures surfaced');ok(el(s,'count').textContent==='0','failed feed not a false positive');s.close();
// v0.2: one saved browser view survives a bare URL and an old bookmark.
s=load('lat=38&lon=-77&heading=180&fov=80&zoom=9&api=https%3A%2F%2Frelay.example',{body:{ac:raw}});
ok(el(s,'settingsPanel').getAttribute('aria-hidden')==='true','settings start collapsed');
el(s,'menuButton').click();ok(el(s,'menuButton').getAttribute('aria-expanded')==='true'&&el(s,'settingsPanel').style.display==='block','hamburger opens settings');
ok(el(s,'settingsPanel').contains(el(s,'radius'))&&el(s,'settingsPanel').contains(el(s,'zoomIn'))&&el(s,'settingsPanel').contains(el(s,'focusViewLink')),'existing map settings and views live inside drawer');
ok(/view=single/.test(el(s,'focusViewLink').href)&&/view=multi/.test(el(s,'multiViewLink').href)&&/view=auto/.test(el(s,'windowLink').href),'all window views have dedicated links');
change(s,'heading',210);change(s,'fov',60);change(s,'radius',12);el(s,'zoomIn').click();
var m=el(s,'map');m.dispatchEvent(new s.w.MouseEvent('mousedown',{bubbles:true,clientX:400,clientY:300}));s.w.dispatchEvent(new s.w.MouseEvent('mousemove',{bubbles:true,clientX:500,clientY:350}));s.w.dispatchEvent(new s.w.MouseEvent('mouseup',{bubbles:true,clientX:500,clientY:350}));
el(s,'saveZone').click();var stored=s.w.localStorage.getItem('windowjet.map.view.v1'),record=JSON.parse(stored),shape=el(s,'zoneShape').getAttribute('d');
ok(record.heading===210&&record.fov===60&&record.radius===12,'browser stores wedge preferences');
ok(record.zoom===10&&(record.mapLat!==record.lat||record.mapLon!==record.lon),'browser stores zoom and independent pan position');
ok(record.api==='https://relay.example'&&record.demo===false,'browser stores live mode and relay');
ok(el(s,'saveZone').textContent==='Saved on this device','browser save confirmation');
el(s,'radius').focus();s.idle();ok(s.d.body.className==='uiHidden'&&el(s,'settingsPanel').style.display==='none','15-second idle closes drawer and hides controls');
ok(el(s,'menuButton').getAttribute('aria-expanded')==='false'&&el(s,'settingsPanel').getAttribute('aria-hidden')==='true','idle accessibility state matches visibility');
ok(s.d.activeElement===el(s,'menuButton'),'closing idle drawer returns focus to hamburger');
ok(s.w.getComputedStyle(el(s,'attribution')).display!=='none'&&el(s,'zoneShape').getAttribute('d')===shape&&s.d.querySelectorAll('#markers .marker').length===1,'idle preserves attribution, viewing wedge and aircraft');
el(s,'map').dispatchEvent(new s.w.MouseEvent('mousedown',{bubbles:true,clientX:100,clientY:100}));s.w.dispatchEvent(new s.w.MouseEvent('mouseup',{bubbles:true,clientX:100,clientY:100}));ok(s.d.body.className==='','map interaction wakes controls');
el(s,'menuButton').click();ok(el(s,'settingsPanel').style.display==='block','hamburger reopens after idle');s.d.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));ok(el(s,'settingsPanel').style.display==='none','Escape closes drawer');s.close();
s=load('',{body:{ac:raw}},{raw:stored});
ok(el(s,'heading').value==='210'&&el(s,'fov').value==='60'&&el(s,'radius').value==='12','bare URL restores saved wedge');
ok(el(s,'zoneShape').getAttribute('d')===shape,'bare URL restores exact map pan and zoom');
ok(el(s,'edition').textContent==='LIVE'&&s.urls[0]==='https://relay.example/v2/point/38/-77/8','bare URL restores live relay query');
ok(/restored/.test(el(s,'saveStatus').textContent),'restored preference status');
ok(/heading=210/.test(el(s,'focusViewLink').href)&&/api=/.test(el(s,'focusViewLink').href),'view links retain saved heading and feed');s.close();
s=load('lat=38.1&lon=-77.1&heading=190',{body:{ac:raw}},{raw:stored});ok(el(s,'heading').value==='210'&&s.urls[0].indexOf('/38/-77/')!==-1,'saved view wins over old bookmark defaults');s.close();
s=load('lat=39&lon=-76&heading=90&useurl=1',{body:{ac:[]}},{raw:stored});ok(el(s,'heading').value==='90'&&s.urls[0].indexOf('/39/-76/')!==-1,'explicit useurl bypasses saved view');ok(s.w.localStorage.getItem('windowjet.map.view.v1')===stored,'one-time override does not overwrite saved preferences');s.close();
s=load('demo=1',null,{raw:stored});ok(el(s,'edition').textContent.indexOf('DEMO')===0&&s.urls.length===0,'explicit demo disables saved live requests');s.close();
s=load('',null,{raw:'not json'});ok(s.errors.length===0&&el(s,'edition').textContent.indexOf('DEMO')===0,'corrupt storage safely falls back');s.close();
s=load('',null,{raw:JSON.stringify({version:1,heading:210})});ok(s.errors.length===0&&el(s,'heading').value==='190','incomplete saved preferences safely ignored');s.close();
s=load('',null,{blocked:true});el(s,'saveZone').click();ok(s.errors.length===0&&/Bookmark/.test(el(s,'saveStatus').textContent),'blocked storage offers bookmark fallback without crashing');ok(el(s,'saveZone').textContent==='Saved in link','fallback does not claim browser persistence');s.close();
s=load('',{body:{ac:[]}},{raw:stored});el(s,'forgetView').click();ok(s.w.localStorage.getItem('windowjet.map.view.v1')===null,'saved preference removal works');ok(/forgotten/.test(el(s,'saveStatus').textContent),'forget confirmation');s.close();

console.log(passes+' passed, '+fails+' failed');process.exitCode=fails?1:0;
