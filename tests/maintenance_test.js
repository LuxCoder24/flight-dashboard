// 2026-10-20 GPT-6 (OpenAI), directed by Nathan: verify maintenance toggle and resumed defaults.
var fs=require('fs'),JSDOM=require(process.argv[2]).JSDOM,passed=0,failed=0;
function ok(v,n){if(v){passed++;}else{failed++;console.log('FAIL: '+n);}}
['index.html','map.html'].forEach(function(path){
 var html=fs.readFileSync(path,'utf8'),requests=0,timers=0;
 var dom=new JSDOM(html.replace('/* MAINTENANCE_ENABLED */ false','/* MAINTENANCE_ENABLED */ true'),{url:'https://example.github.io/'+path+'?lat=38&lon=-77',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:function(w){w.XMLHttpRequest=function(){requests++;};w.setInterval=function(){timers++;};w.localStorage.setItem('sentinel','keep');}});
 ok(dom.window.document.querySelector('h1').textContent==='Under maintenance',path+' maintenance can be enabled');ok(requests===0,path+' maintenance sends no feed requests');ok(timers===0,path+' maintenance starts no polling timers');ok(dom.window.localStorage.getItem('sentinel')==='keep',path+' maintenance preserves storage');dom.window.close();
 var active=new JSDOM(html,{url:'https://example.github.io/'+path+'?demo=1&useurl=1&tiles=0',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:function(w){w.XMLHttpRequest=function(){requests++;};}});
 ok(!active.window.document.querySelector('main[role="main"] h1'),path+' default maintenance is off');ok(!!active.window.document.getElementById(path==='index.html'?'app':'map'),path+' normal display is present');active.window.close();
});console.log(passed+' passed, '+failed+' failed');process.exitCode=failed?1:0;
