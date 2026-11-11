/* Normalpris (hyldepris) pr. butik for ALLE varer, brugerne har: lager og retternes ingredienser.
   Kilde: Prej's API (api.prej.app), som samler kædernes egne kataloger. Kræver GitHub-hemmeligheden PREJ_API_KEY.
   Gratis-nøglen giver 25 kald i døgnet. Derfor:
     1) Hver vare søges op én gang (1 kald pr. vare). Produkt-id'erne, der passer, gemmes.
     2) Derefter opdateres priserne for ALLE kendte varer hver nat med "batch"-kald (op til 500 produkter pr. kald).
   Resultat: data/users/<id>/u/store/prices = { items: { <vare>: { u: 'g'|'ml'|'stk', v: { Netto: kr pr. kg/l/stk, ... } } }, at }
   Egne varer på indkøbslisten (Ekstra, fx "kaffe") får u: 'pk' og v: { Netto: kr for en typisk pakke, ... } (q/qu: pakkens størrelse),
   så appen kan sammenligne butikkerne for dem også.
   Kun hyldepriser: tilbud (is_offer), tilbudsaviser (source=flyer) og AI-matchede priser springes over.
   Coop-kæderne og Løvbjerg udgiver ikke hyldepriser online; for dem bruger appen sit skøn. */
'use strict';
var fs=require('fs'),path=require('path');
var CHAIN={netto:'Netto',rema1000:'Rema 1000',fotex:'Føtex',bilka:'Bilka',bilkatogo:'Bilka',meny:'Meny',spar:'Spar',lidl:'Lidl','365discount':'Coop 365',superbrugsen:'SuperBrugsen',kvickly:'Kvickly'};
var BUDGET=Number(process.env.DAILY_CALLS||24),VER=2;   /* VER: raise when the matching improves, so items not found are searched again */
function norm(s){return String(s||'').toLowerCase().replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa').replace(/[éèêë]/g,'e').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()}
/* same as the app's slug() */
function slug(s){return String(s||'').toLowerCase().trim().replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x'}
var NOT=/\b(chips|snack|sauce|dressing|marinade|pesto|suppe|pulver|krydderi|drik|juice|saft|is|kage|kager|slik|chokolade|dip|spread|fyld|paalaeg|toast|pizza|wrap|burger|nuggets|paneret|frossen|frosne|syltet|mos|kids|baby|hund|kat|shampoo|saebe|creme|olie til|aroma|essens|smagt|smag)\b/;
var EXTRA={maelk:{q:'letmælk',must:['maelk']},floede:{q:'piskefløde',must:['floede']},madlavningsfloede:{q:'madlavningsfløde',must:['floede']},
  pasta:{q:'spaghetti',must:[]},ris:{q:'jasminris',must:['ris']},mel:{q:'hvedemel',must:['mel']},
  'hakket-oksekoed':{must:['hakket','okse']},'hakket-kylling':{must:['hakket','kylling']},'hakket-svine-og-kalvekoed':{q:'hakket svine kalvekød',must:['hakket','svin','kalv']},
  'hel-kylling':{must:['hel','kylling']},laksfilet:{q:'laksefilet',must:['laks']},torskefilet:{must:['torsk']},aeg:{q:'æg 10 stk',must:['aeg']},
  'hakkede-tomater':{must:['hakkede','tomat']},cremefraiche:{q:'creme fraiche',must:['creme','fraiche'],ok:1},'blandet-salat':{q:'salatblanding',must:['salat']},
  bouillonterning:{q:'bouillon terninger',must:['bouillon'],ok:1},fishsauce:{q:'fiskesauce',must:['fisk','sauce'],ok:1},burgerboller:{q:'burgerboller',must:['burgerbolle']},tomatpur:{q:'tomatpuré',must:['tomatpur']},kidneyboenner:{must:['kidney']},kikaerter:{must:['kikaert']}};
function want(u){return u==='g'?'kg':u==='ml'?'l':'stk'}
/* Products that are this item, and per chain the cheapest shelf price in kr per kg / l / stk */
function pick(item,key,products){
  if(item.unit==='pk')return pickPack(item,key,products);
  var ex=EXTRA[key]||{},nsp=function(x){return x.replace(/ /g,'')},must=(ex.must?ex.must:norm(item.name).split(' ').filter(function(w){return w.length>2}));
  if(!must.length)must=[norm(item.name)];
  var w=want(item.unit),out={},ids=[];
  (products||[]).forEach(function(pr){
    var n=norm(pr.name);
    if(!must.every(function(m){return (' '+n+' ').indexOf(m)>-1||nsp(n).indexOf(nsp(m))>-1}))return;
    if(!ex.ok&&NOT.test(n)&&!NOT.test(norm(item.name)))return;
    if(/\b(oeko|okologisk|oekologisk|frilands)\b/.test(n)&&!/\b(oeko|oekologisk|frilands)\b/.test(norm(item.name)))return;
    var hit=false;
    (pr.prices||[]).forEach(function(p){
      var st=CHAIN[p.chain_slug];if(!st||p.is_offer||p.source==='flyer'||p.ai_matched||!(p.unit_price>0))return;
      var lab=String(p.unit_price_label||'').toLowerCase(),u=/kr\/kg/.test(lab)?'kg':/kr\/(l|liter)\b/.test(lab)?'l':/kr\/stk/.test(lab)?'stk':'';
      var v=p.unit_price/100;
      /* a pack of pieces priced per kg (fx 4 burgerboller, 10 æg): price per piece from the pack */
      if(u!==w&&w==='stk'){var cm=String(pr.quantity_label||pr.name||'').match(/(\d+)\s*(?:stk|x\b)/i);if(cm&&p.price>0){v=p.price/100/Number(cm[1]);u='stk'}}
      if(u!==w)return;
      if(item.kp>0&&(v<item.kp*0.35||v>item.kp*3.2))return;
      hit=true;if(!(st in out)||v<out[st])out[st]=Math.round(v*100)/100;
    });
    if(hit&&ids.length<20)ids.push(pr.id);
  });
  /* a price far from the other chains' is a different product (fx a luxury variant): drop it */
  var vs=Object.keys(out).map(function(s){return out[s]}).sort(function(a,b){return a-b});
  if(vs.length>=3){var med=vs[Math.floor(vs.length/2)];Object.keys(out).forEach(function(s){if(out[s]>med*2.5||out[s]<med/2.5)delete out[s]})}
  return{sp:out,ids:ids};
}
/* An own item on the shopping list ("kaffe", "toiletpapir"): no amount, so compare a typical pack.
   Per chain the cheapest shelf price per kg / l / stk among products named so (whole words), times the typical pack size. */
function packQty(pr){
  var m=String(pr.quantity_label||'').concat(' ',pr.name||'').toLowerCase().replace(',','.').match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|l|ltr|cl|ml|stk|rl|ruller|pk|x)\b/);
  if(!m)return null;var v=parseFloat(m[1]),u=m[2];
  if(u==='g'||u==='gr')return{q:v/1000,u:'kg'};if(u==='kg')return{q:v,u:'kg'};
  if(u==='ml')return{q:v/1000,u:'l'};if(u==='cl')return{q:v/100,u:'l'};if(u==='l'||u==='ltr')return{q:v,u:'l'};
  return{q:v,u:'stk'};
}
function pickPack(item,key,products){
  var must=norm(item.name).split(' ').filter(function(w){return w.length>1});if(!must.length)return{sp:{},ids:[]};
  var rows=[],ids=[];
  (products||[]).forEach(function(pr){
    var n=' '+norm(pr.name)+' ';
    if(!must.every(function(m){return new RegExp(' '+m+'(e|r|er|n|en|ne|s|et|erne)? ').test(n)}))return;   /* whole words: not "kaffefløde" for "kaffe" */
    if(NOT.test(n)&&!NOT.test(norm(item.name)))return;
    if(/\b(oeko|okologisk|oekologisk)\b/.test(n)&&!/\b(oeko|oekologisk)\b/.test(norm(item.name)))return;
    var pq=packQty(pr),hit=false;
    (pr.prices||[]).forEach(function(p){
      var st=CHAIN[p.chain_slug];if(!st||p.is_offer||p.source==='flyer'||p.ai_matched)return;
      var lab=String(p.unit_price_label||'').toLowerCase(),u=/kr\/kg/.test(lab)?'kg':/kr\/(l|liter)\b/.test(lab)?'l':/kr\/stk/.test(lab)?'stk':'';
      var v=p.unit_price>0?p.unit_price/100:0;
      if(!u&&pq&&p.price>0){u=pq.u;v=p.price/100/pq.q}
      if(!u||!(v>0))return;
      hit=true;rows.push({st:st,u:u,v:v,q:pq&&pq.u===u?pq.q:0});
    });
    if(hit&&ids.length<20)ids.push(pr.id);
  });
  if(!rows.length)return{sp:{},ids:ids};
  var cnt={};rows.forEach(function(r){cnt[r.u]=(cnt[r.u]||0)+1});
  var du=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]})[0];
  var qs=rows.filter(function(r){return r.u===du&&r.q>0}).map(function(r){return r.q}).sort(function(a,b){return a-b});
  if(!qs.length)return{sp:{},ids:ids};
  var tq=qs[Math.floor(qs.length/2)],per={};
  rows.forEach(function(r){if(r.u!==du)return;if(!(r.st in per)||r.v<per[r.st])per[r.st]=r.v});
  var out={};Object.keys(per).forEach(function(st){out[st]=Math.round(per[st]*tq*100)/100});
  var vs=Object.keys(out).map(function(s){return out[s]}).sort(function(a,b){return a-b});
  if(vs.length>=3){var med=vs[Math.floor(vs.length/2)];Object.keys(out).forEach(function(st){if(out[st]>med*2.5||out[st]<med/2.5)delete out[st]})}
  return{sp:out,ids:ids,q:tq,qu:du};
}
var calls=0;
async function api(q,key){
  if(calls>=BUDGET)throw Object.assign(new Error('budget'),{quota:true});
  calls++;
  var r=await fetch('https://api.prej.app'+q,{headers:{Authorization:'Bearer '+key,'User-Agent':'FastWeek (privat madplan-app)'}});
  var j=await r.json().catch(function(){return{}});
  if(r.status===429)throw Object.assign(new Error('kvote brugt'),{quota:true});
  if(!r.ok)throw new Error('HTTP '+r.status+' '+JSON.stringify(j).slice(0,200));
  return j;
}
function listOf(j){return j.products||j.data||j.items||[]}
/* every item any user has: stock + the ingredients of their dishes, and the app's standard items */
function isoWeekId(d){d=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));var day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);
  var y=d.getUTCFullYear(),w=Math.ceil(((d-Date.UTC(y,0,1))/864e5+1)/7);return y+'-W'+String(w).padStart(2,'0')}
var thisWeek=isoWeekId(new Date(Date.now()-7*864e5));   /* last week too, in case the list is still in use */
async function gatherItems(db,ref){
  var items={},users=[];
  Object.keys(ref.items||{}).forEach(function(k){var r=ref.items[k];items[k]={name:r.name,unit:r.unit,kp:r.kp||0}});
  var cols=await db.doc('data/users').listCollections();
  for(var c of cols){
    var mine={};users.push({id:c.id,mine:mine});
    var pan=await c.doc('u').collection('store').doc('pantry').get();
    var it=(pan.exists&&pan.data().items)||{};
    Object.keys(it).forEach(function(k){var p=it[k];if(!p||!p.name||p.leftover)return;mine[k]=p.unit;if(!items[k])items[k]={name:p.name,unit:p.unit,kp:p.kp||0}});
    var rs=await c.doc('u').collection('recipes').get();
    rs.docs.forEach(function(d){(d.data().ing||[]).forEach(function(g){var k=slug(g.n);if(!k)return;if(!mine[k])mine[k]=g.u;if(!items[k])items[k]={name:g.n,unit:g.u,kp:0}})});
    /* own items on this and next week's shopping lists */
    var ls=await c.doc('u').collection('lists').get();
    ls.docs.forEach(function(d){if(d.id<thisWeek)return;(d.data().extra||[]).forEach(function(x){
      var term=x.id==='slik'?'slik':String(x.name||'').toLowerCase().replace(/\s+/g,' ').trim(),k=slug(term);
      if(!term||term.length<2||mine[k])return;if(items[k]&&items[k].unit!=='pk')return;
      mine[k]='pk';if(!items[k])items[k]={name:term,unit:'pk',kp:0}})});
  }
  return{items:items,users:users};
}
async function run(){
  var key=process.env.PREJ_API_KEY;
  if(!key){console.log('PREJ_API_KEY mangler. Se README: "Normalpris pr. butik". Intet ændret.');return}
  var admin=require('firebase-admin');
  if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))});
  var db=admin.firestore(),ref=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data/ref.json'),'utf8'));
  ref.items=(ref.items&&ref.items.items)||ref.items||{};
  var g=await gatherItems(db,ref),cacheRef=db.doc('pricecache/state'),cs=await cacheRef.get(),cache=(cs.exists&&cs.data().items)||{};
  var keys=Object.keys(g.items);console.log('Varer i alt: '+keys.length+' (brugere: '+g.users.length+')');
  var done={};
  /* 1) refresh every item we already know the products for: up to 500 products per call */
  var known=keys.filter(function(k){return cache[k]&&cache[k].ids&&cache[k].ids.length});
  var allIds=[];known.forEach(function(k){cache[k].ids.forEach(function(id){if(allIds.indexOf(id)<0)allIds.push(id)})});
  var byId={};
  try{for(var i=0;i<allIds.length;i+=500){var j=await api('/v1/products/batch?ids='+allIds.slice(i,i+500).join(','),key);listOf(j).forEach(function(p){byId[p.id]=p})}}
  catch(e){console.log('Opdatering stoppet: '+e.message)}
  known.forEach(function(k){var ps=cache[k].ids.map(function(id){return byId[id]}).filter(Boolean);if(!ps.length)return;var r=pick(g.items[k],k,ps);cache[k].sp=r.sp;if(r.q){cache[k].q=r.q;cache[k].qu=r.qu}cache[k].at=new Date().toISOString().slice(0,10);done[k]=1});
  console.log('Opdateret med batch: '+Object.keys(done).length+' varer ('+allIds.length+' produkter, '+calls+' kald)');
  /* 2) search new items (and ones not found for 30 days) with the calls that are left */
  var todo=keys.filter(function(k){var c=cache[k];return !c||(!c.ids.length&&((c.v||1)<VER||!c.tried||Date.now()-c.tried>30*864e5))});
  var used={};g.users.forEach(function(u){Object.keys(u.mine).forEach(function(k){used[k]=(used[k]||0)+1})});
  todo.sort(function(a,b){return (used[b]||0)-(used[a]||0)||(ref.items[b]?1:0)-(ref.items[a]?1:0)});   /* what people actually use first */
  var found=0,tried=0;
  for(var k of todo){
    var it=g.items[k],q=(EXTRA[k]&&EXTRA[k].q)||it.name;
    try{var j2=await api('/v1/products?q='+encodeURIComponent(q)+'&limit=100&grocery=1&exclude_border_trade=1',key);}
    catch(e){if(e.quota)break;console.log('FEJL '+it.name+': '+e.message);continue}
    tried++;var r=pick(it,k,listOf(j2));
    cache[k]={name:it.name,unit:it.unit,ids:r.ids,sp:r.sp,at:new Date().toISOString().slice(0,10),tried:Date.now(),v:VER};if(r.q){cache[k].q=r.q;cache[k].qu=r.qu}
    if(Object.keys(r.sp).length){found++;done[k]=1}
    console.log((Object.keys(r.sp).length?'NY   ':'INGEN')+' '+it.name+'  '+Object.keys(r.sp).map(function(s){return s+' '+r.sp[s]}).join(' · '));
    await new Promise(function(res){setTimeout(res,600)});
  }
  var left=keys.filter(function(k){return !cache[k]}).length;
  console.log('Søgt: '+tried+', fundet: '+found+'. Mangler at blive søgt: '+left+' varer (ca. '+Math.ceil(left/(BUDGET-1))+' nætter mere).');
  await cacheRef.set({items:cache,at:Date.now()});
  /* 3) each user gets the prices for their own items, privately */
  for(var u of g.users){
    var o={};Object.keys(u.mine).forEach(function(k){var c=cache[k];if(c&&c.sp&&Object.keys(c.sp).length&&c.unit===u.mine[k]){o[k]={u:c.unit,v:c.sp};if(c.q){o[k].q=c.q;o[k].qu=c.qu}}});
    await db.doc('data/users/'+u.id+'/u/store/prices').set({items:o,at:new Date().toISOString().slice(0,10),src:'Prej (kædernes egne kataloger)'});
    console.log('Bruger '+u.id.slice(0,6)+'…: priser for '+Object.keys(o).length+' af '+Object.keys(u.mine).length+' varer');
  }
}
module.exports={pick:pick,pickPack:pickPack,packQty:packQty,norm:norm,slug:slug,isoWeekId:isoWeekId};
if(require.main===module)run().catch(function(e){console.error(e);process.exit(1)});
