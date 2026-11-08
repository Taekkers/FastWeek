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
console.log(fail?'FAILS '+fail:'ALL PASS');process.exit(fail?1:0);
