import W from './fastweek-ai.js';
const {subtle}=crypto;let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
const kp=await subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const other=await subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await subtle.exportKey('jwk',kp.publicKey);jwk.kid='k1';
const enc=o=>Buffer.from(typeof o==='string'?o:JSON.stringify(o)).toString('base64url');
async function tok(over={},key=kp.privateKey,kid='k1'){const now=Math.floor(Date.now()/1000);
  const h=enc({alg:'RS256',kid,typ:'JWT'}),b=enc({iss:'https://securetoken.google.com/fastweek-f6d0f',aud:'fastweek-f6d0f',sub:'u1',iat:now-10,exp:now+3600,...over});
  const s=await subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(h+'.'+b));return h+'.'+b+'.'+Buffer.from(s).toString('base64url')}
let sent=null,jw=0;
globalThis.fetch=async(u,o)=>{if(/jwk/.test(u)){jw++;return new Response(JSON.stringify({keys:[jwk]}))}
  sent={u,key:o.headers['x-goog-api-key'],body:await new Response(o.body).text()};return new Response('{"candidates":[]}',{status:200})};
const env={GEMINI_KEY:'AQ.secret'};const O='https://taekkers.github.io',U='https://w.example/models/gemini-flash-latest:generateContent';
const req=(t,extra={})=>new Request(extra.url||U,{method:extra.method||'POST',headers:{Origin:extra.origin||O,'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:(extra.method||'POST')==='POST'?'{"contents":[]}':undefined});
let r=await W.fetch(new Request('https://w.example/',{method:'GET'}),env);ok(r.status===200&&/kører/.test(await r.text()),'GET / sundhedstjek');
r=await W.fetch(req(null,{method:'OPTIONS'}),env);ok(r.status===204&&r.headers.get('Access-Control-Allow-Origin')===O&&/authorization/.test(r.headers.get('Access-Control-Allow-Headers')),'CORS-forespørgsel fra appen godkendes');
r=await W.fetch(req(await tok(),{origin:'https://evil.example'}),env);ok(r.status===403&&!sent,'Anden adresse afvises');
r=await W.fetch(req(null),env);ok(r.status===401&&!sent,'Uden login afvises');
r=await W.fetch(req('abc.def.ghi'),env);ok(r.status===401&&!sent,'Ugyldigt login afvises');
r=await W.fetch(req(await tok({exp:Math.floor(Date.now()/1000)-5})),env);ok(r.status===401&&!sent,'Udløbet login afvises');
r=await W.fetch(req(await tok({aud:'andet-projekt',iss:'https://securetoken.google.com/andet-projekt'})),env);ok(r.status===401&&!sent,'Login fra et andet Firebase-projekt afvises');
r=await W.fetch(req(await tok({},other.privateKey)),env);ok(r.status===401&&!sent,'Falsk signatur afvises');
r=await W.fetch(req(await tok(),{url:'https://w.example/models/text-bison:generateContent'}),env);ok(r.status===404&&!sent,'Kun Gemini-modeller');
r=await W.fetch(req(await tok()),{});ok(r.status===500&&!sent,'Mangler nøgle → tydelig fejl');
r=await W.fetch(req(await tok()),env);const body=await r.text();
ok(r.status===200&&sent&&sent.key==='AQ.secret'&&/gemini-flash-latest:generateContent$/.test(sent.u)&&sent.body==='{"contents":[]}'&&r.headers.get('Access-Control-Allow-Origin')===O,'Gyldigt login → sendes videre til Google med nøglen');
ok(!/AQ\.secret/.test(body)&&![...r.headers.values()].some(v=>/AQ\.secret/.test(v)),'Nøglen kommer aldrig retur til appen');
ok(jw===1,'Googles login-nøgler hentes én gang og genbruges ('+jw+')');
// --- opskrift fra et link
const PAGE_LD='<html><head><title>Lasagne | Valdemarsro</title><meta property="og:image" content="/img/lasagne.jpg"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"x"},{"@type":["Recipe"],"name":"Lasagne &amp; mornay","recipeYield":["4","4 pers."],"totalTime":"PT3H","recipeIngredient":["2 løg, finthakket","400 g hakket oksekød","1½ dl fløde","salt og friskkværnet peber"]}]}</script></head><body>…</body></html>';
const PAGE_TXT='<html><head><title>Mormors boller</title><script>var x=1</script></head><body><nav>Menu</nav><h1>Mormors boller</h1><p>Ingredienser</p><ul><li>50 g gær</li><li>5 dl mælk</li><li>1 kg hvedemel</li></ul><p>Fremgangsmåde: Rør gæren ud i mælken og ælt dejen godt igennem i ti minutter.</p><footer>Cookies</footer></body></html>';
let pages={};
globalThis.fetch=async(u,o)=>{if(/jwk/.test(u))return new Response(JSON.stringify({keys:[jwk]}));
  if(/generativelanguage/.test(u)){sent={u};return new Response('{}')}
  const p=pages[u];if(!p)return new Response('nope',{status:404,headers:{'Content-Type':'text/html'}});
  sent={u,ua:o.headers['User-Agent']};const r=new Response(p,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});Object.defineProperty(r,'url',{value:u});return r};
const RU='https://w.example/recipe-from-url';
const rreq=(t,b)=>new Request(RU,{method:'POST',headers:{Origin:O,'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:JSON.stringify(b)});
pages['https://www.valdemarsro.dk/lasagne/']=PAGE_LD;pages['https://mormor.dk/boller']=PAGE_TXT;
sent=null;r=await W.fetch(rreq(null,{url:'https://www.valdemarsro.dk/lasagne/'}),env);ok(r.status===401&&!sent,'Link: uden login afvises');
r=await W.fetch(rreq(await tok(),{url:'https://www.valdemarsro.dk/lasagne/'}),env);let j=await r.json();
ok(r.status===200&&j.recipe&&j.recipe.name==='Lasagne & mornay'&&j.recipe.servings===4&&j.recipe.minutes===180&&j.recipe.ingredients.length===4&&j.recipe.ingredients[2]==='1½ dl fløde','Link med opskrift i standardformat: navn, personer, tid og ingredienser');
ok(j.image==='https://www.valdemarsro.dk/img/lasagne.jpg'&&j.host==='valdemarsro.dk'&&/Mozilla/.test(sent.ua),'Billede og kilde med');
r=await W.fetch(rreq(await tok(),{url:'https://mormor.dk/boller'}),env);j=await r.json();
ok(r.status===200&&!j.recipe&&/50 g gær\n5 dl mælk\n1 kg hvedemel/.test(j.text)&&!/var x|Menu|Cookies/.test(j.text)&&j.title==='Mormors boller','Side uden standardformat: ren tekst uden menu, scripts og bund');
r=await W.fetch(rreq(await tok(),{url:'https://mormor.dk/findes-ikke'}),env);j=await r.json();ok(r.status===502&&j.error.site,'Side der ikke findes → forståelig fejl');
for(const bad of ['javascript:alert(1)','http://localhost/x','http://192.168.1.1/','ftp://x.dk/a','ikke et link']){r=await W.fetch(rreq(await tok(),{url:bad}),env);if(r.status!==400){ok(false,'Afviser '+bad);}}
ok(true,'Ugyldige og lokale adresser afvises');
r=await W.fetch(rreq(await tok(),{url:'https://www.valdemarsro.dk/lasagne/'}),{});ok(r.status===200,'Links virker også uden Gemini-nøgle');
console.log(fail?'FAILS '+fail:'ALL PASS');process.exit(fail?1:0);
