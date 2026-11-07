const {chromium}=require('playwright');const fs=require('fs');
const html=fs.readFileSync('ugekurv9.html','utf8');
const L='../live11/';const rd=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ALL=['Bilka','Netto','Rema 1000','Coop 365','Lidl'];
const pantry=rd(L+'store/pantry.json');
const settingsLive=rd(L+'store/settings.json');
const offers=rd('fixtures/offers_W46_old.json');const offersNew=rd('../mig9/shared/offers_2026-W46.json');
const MS='../mig9/shared/';const refItems=rd(MS+'ref_items.json');const refStores=rd(MS+'ref_stores.json');
const starters={};fs.readdirSync(MS).filter(f=>f.startsWith('starter_')).forEach(f=>{starters[f.slice(8,-5)]=rd(MS+f)});
const recipes={};fs.readdirSync(L+'recipes').forEach(f=>{recipes[f.replace('.json','')]=rd(L+'recipes/'+f)});
const SHIM=`(function(){
 var store=__DOCS__;var UID=__UID__,RO=__RO__;var subs=[];
 var clone=function(x){return x===undefined?undefined:JSON.parse(JSON.stringify(x))};
 function merge(a,b){var o=clone(a)||{};Object.keys(b).forEach(function(k){var v=b[k];if(v&&typeof v==='object'&&!Array.isArray(v)&&o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k]))o[k]=merge(o[k],v);else o[k]=clone(v)});return o}
 function notify(){subs.slice().forEach(function(s){s.fire()})}
 window.__writes=[];
 function docRef(p){return{id:p.split('/').pop(),
  get:function(){return Promise.resolve({exists:p in store,data:function(){return clone(store[p])}})},
  set:function(d){if(RO)return Promise.reject({code:'invalid_argument'});window.__writes.push(p);store[p]=clone(d);notify();return Promise.resolve()},
  update:function(d){if(RO)return Promise.reject({code:'invalid_argument'});if(!(p in store))return Promise.reject({code:'invalid_argument'});window.__writes.push(p);store[p]=merge(store[p],d);notify();return Promise.resolve()},
  delete:function(){if(RO)return Promise.reject({code:'invalid_argument'});window.__writes.push(p);delete store[p];notify();return Promise.resolve()},
  onSnapshot:function(cb){var s={fire:function(){cb({exists:p in store,id:p.split('/').pop(),data:function(){return clone(store[p])}})}};subs.push(s);setTimeout(s.fire,0);return function(){}}}}
 function col(n){return{doc:function(id){return docRef(n+'/'+id)},
  onSnapshot:function(cb){var s={fire:function(){var docs=Object.keys(store).filter(function(k){return k.indexOf(n+'/')===0&&k.slice(n.length+1).indexOf('/')<0}).map(function(k){return{id:k.slice(n.length+1),data:function(){return clone(store[k])}}});cb({docs:docs})}};subs.push(s);setTimeout(s.fire,0);return function(){}}}}
 window.__store=store;window.__notify=notify;
 window.claude={use:function(n){
  if(n==='db')return Promise.resolve({doc:docRef,collection:col});
  if(n==='user')return Promise.resolve({can:function(){return !RO},id:function(){return Promise.resolve(UID)}});
  if(n==='sample')return Promise.resolve({limits:function(){return Promise.resolve({images:true})},json:function(){return Promise.reject({code:'unavailable'})}});
  if(n==='assets')return Promise.resolve({upload:function(b){return Promise.resolve({id:'asset1',url:'blob:x',sizeBytes:b.size,contentType:b.type})},delete:function(){return Promise.resolve()}});
  return Promise.reject(new Error('no '+n))}};
})();`;
function shared(){
  const d={};
  d['offers/2026-W46']=offers;
  d['ref/stores']=refStores;
  d['ref/items']=refItems;
  Object.keys(starters).forEach(id=>{d['starter/'+id]=JSON.parse(JSON.stringify(starters[id]))});
  return d;
}
function owner(uid){
  const P='data/users/'+uid+'/u/',d={};
  d[P+'store/pantry']=pantry;
  const s=Object.assign({},settingsLive);delete s.pidx;delete s.pvdate;s.stores=ALL.slice();d[P+'store/settings']=s;
  Object.keys(recipes).forEach(id=>{d[P+'recipes/'+id]=recipes[id]});
  ['2026-W45','2026-W46'].forEach(w=>{d[P+'plans/'+w]=rd('../live10/plans/'+w+'.json');d[P+'lists/'+w]=rd(L+'lists/'+w+'.json')});
  d[P+'prefs/2026-W46']=rd(L+'prefs/2026-W46.json');
  return d;
}
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
const bad=/undefined|NaN|\[object|>null</;
async function launch(opts={}){
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:opts.w||390,height:opts.h||844},deviceScaleFactor:1,colorScheme:opts.dark?'dark':'light'});
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push('pageerror '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load resource/.test(m.text()))errs.push('console '+m.text())});
  await pg.route('**/*',r=>{const u=r.request().url();if(u.startsWith('https://fonts.'))return r.abort();return r.continue()});
  const docs=Object.assign({},shared(),opts.docs||{});
  const shim=SHIM.replace('__DOCS__',()=>JSON.stringify(docs)).replace('__UID__',JSON.stringify(opts.uid||'uA')).replace('__RO__',opts.ro?'true':'false');
  const full=html.replace('<script>\n','<script>window.__TEST__={boot:true};'+shim+'</script>\n<script>\n');
  await pg.setContent(full,{waitUntil:'domcontentloaded'});await pg.waitForTimeout(opts.wait||800);
  return{b,pg,errs};
}
module.exports={offersNew,starters,refItems,launch,ok,bad,owner,shared,ALL,recipes,pantry,fails:()=>fail,done:()=>process.exit(fail?1:0)};
