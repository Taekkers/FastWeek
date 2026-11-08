/* Normalpriser pr. butik for appens standardvarer (data/ref.json -> items[k].sp).
   Kilde: Prej's API (api.prej.app), som samler kædernes egne kataloger. Kræver en gratis nøgle i GitHub-hemmeligheden PREJ_API_KEY.
   Gratis-nøglen giver 25 kald i døgnet, så scriptet slår højst 24 varer op pr. kørsel og tager de ældste først.
   Kun hyldepriser tæller: tilbud (is_offer), tilbudsaviser (source=flyer) og AI-matchede priser springes over.
   Coop-kæderne og Løvbjerg udgiver ikke hyldepriser online; for dem bliver appens skøn stående. */
'use strict';
var fs=require('fs'),path=require('path');
var ROOT=path.join(__dirname,'..'),REF=path.join(ROOT,'data/ref.json');
var CHAIN={netto:'Netto',rema1000:'Rema 1000',fotex:'Føtex',bilka:'Bilka',bilkatogo:'Bilka',meny:'Meny',spar:'Spar',lidl:'Lidl','365discount':'Coop 365',superbrugsen:'SuperBrugsen',kvickly:'Kvickly'};
var MAX=Number(process.env.MAX_ITEMS||24);
function norm(s){return String(s||'').toLowerCase().replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()}
/* Ord, der betyder, at det er en anden vare end den, vi leder efter */
var NOT=/\b(chips|snack|sauce|dressing|marinade|pesto|suppe|pulver|krydderi|smag|drik|juice|saft|is|kage|slik|chokolade|dip|spread|salat med|fyld|pålæg|paalaeg|toast|pizza|wrap|burger|nuggets|panering|paneret|frost|frossen|frosne|tørret|toerret|syltet|mos|puré|pure|kids|baby|hund|kat|shampoo|sæbe|saebe)\b/;
var EXTRA={ /* søgeord og ord, der skal med, hvor varens navn alene ikke er nok */
  maelk:{q:'letmælk',must:['maelk']},floede:{q:'piskefløde',must:['floede']},madlavningsfloede:{q:'madlavningsfløde',must:['floede']},
  pasta:{q:'spaghetti',must:[]},ris:{q:'jasminris',must:['ris']},mel:{q:'hvedemel',must:['mel']},smoer:{q:'smør',must:['smoer']},
  'hakket-oksekoed':{q:'hakket oksekød',must:['hakket','okse']},'hakket-kylling':{q:'hakket kylling',must:['hakket','kylling']},
  'hakket-svine-og-kalvekoed':{q:'hakket svine kalvekød',must:['hakket','svin','kalv']},kyllingebryst:{q:'kyllingebryst',must:['kyllingebryst']},
  'hel-kylling':{q:'hel kylling',must:['hel','kylling']},laksfilet:{q:'laksefilet',must:['laks']},torskefilet:{q:'torskefilet',must:['torsk']},
  aeg:{q:'æg 10 stk',must:['aeg']},'hakkede-tomater':{q:'hakkede tomater',must:['hakkede','tomat']},tomatpur:{q:'tomatpuré',must:['tomatpur']},
  kokosmaelk:{q:'kokosmælk',must:['kokosmaelk']},kidneyboenner:{q:'kidneybønner',must:['kidney']},kikaerter:{q:'kikærter',must:['kikaert']}};
function itemsToDo(ref,state){
  var ks=Object.keys(ref.items||{});
  ks.sort(function(a,b){return ((state[a]&&state[a].at)||'').localeCompare((state[b]&&state[b].at)||'')});
  return ks.slice(0,MAX);
}
/* Fra et søgesvar: billigste hyldepris pr. kæde i kr pr. kg / liter / stk, kun for produkter, der ligner varen */
function pick(item,key,res){
  var ex=EXTRA[key]||{},must=(ex.must&&ex.must.length?ex.must:norm(item.name).split(' ').filter(function(w){return w.length>2}));
  var want=item.unit==='g'?'kg':item.unit==='ml'?'l':'stk',out={},used={};
  (res.products||[]).forEach(function(pr){
    var n=norm(pr.name);
    if(!must.every(function(w){return n.indexOf(w)>-1}))return;
    if(NOT.test(n)&&!NOT.test(norm(item.name)))return;
    if(/\b(oeko|okologisk|oekologisk|frilands)\b/.test(n))return;          /* almindelig vare; økologi/frilands har egne priser i appen */
    (pr.prices||[]).forEach(function(p){
      var st=CHAIN[p.chain_slug];if(!st)return;
      if(p.is_offer||p.source==='flyer'||p.ai_matched)return;
      var lab=String(p.unit_price_label||'').toLowerCase();
      var u=/kr\/kg/.test(lab)?'kg':/kr\/l\b|kr\/liter/.test(lab)?'l':/kr\/stk/.test(lab)?'stk':'';
      if(u!==want||!(p.unit_price>0))return;
      var v=p.unit_price/100;
      /* sanity: within a wide band around the app's own price, so a different product (fx kokosmælk for mælk) cannot sneak in */
      if(item.kp>0&&(v<item.kp*0.35||v>item.kp*3.2))return;
      if(!(st in out)||v<out[st]){out[st]=Math.round(v*100)/100;used[st]=pr.name}
    });
  });
  return{sp:out,from:used};
}
async function api(pathq,key){
  var r=await fetch('https://api.prej.app'+pathq,{headers:{Authorization:'Bearer '+key,'User-Agent':'FastWeek (privat madplan-app)'}});
  var j=await r.json().catch(function(){return{}});
  if(r.status===429)throw Object.assign(new Error('kvote brugt'),{quota:true,body:j});
  if(!r.ok)throw new Error('HTTP '+r.status+' '+JSON.stringify(j).slice(0,200));
  return{j:j,left:r.headers.get('x-ratelimit-remaining-day')};
}
async function update(){
  var key=process.env.PREJ_API_KEY;
  if(!key){console.log('PREJ_API_KEY mangler. Hent en gratis nøgle på https://prej.dk/api og læg den som hemmelighed i GitHub (Settings > Secrets and variables > Actions > New repository secret, navn PREJ_API_KEY). Intet ændret.');return false}
  var ref=JSON.parse(fs.readFileSync(REF,'utf8')),state=ref.stores.spState||{},n=0,changed=false;
  for(var k of itemsToDo(ref,state)){
    var it=ref.items[k],q=(EXTRA[k]&&EXTRA[k].q)||it.name;
    try{
      var r=await api('/v1/products?q='+encodeURIComponent(q)+'&limit=40&exclude_border_trade=1',key);
      var got=pick(it,k,r.j);n++;
      state[k]={at:new Date().toISOString().slice(0,10),n:Object.keys(got.sp).length};
      if(Object.keys(got.sp).length){it.sp=got.sp;it.spAt=state[k].at;changed=true}
      console.log((Object.keys(got.sp).length?'OK   ':'INGEN')+' '+it.name+'  '+Object.keys(got.sp).map(function(s){return s+' '+got.sp[s]}).join(' · ')+'   (kvote tilbage: '+r.left+')');
    }catch(e){if(e.quota){console.log('Dagens kvote er brugt. Fortsætter i morgen.');break}console.log('FEJL '+it.name+': '+e.message)}
    await new Promise(function(r){setTimeout(r,700)});
  }
  ref.stores.spState=state;ref.stores.spNote='Normalpriser pr. butik fra kædernes egne kataloger via Prej (api.prej.app). Coop-kæderne og Løvbjerg udgiver ikke hyldepriser online.';
  fs.writeFileSync(REF,JSON.stringify(ref,null,1));
  console.log('Slået op: '+n+(changed?', ref.json opdateret':''));
  return changed;
}
module.exports={pick:pick,norm:norm};
if(require.main===module)update().catch(function(e){console.error(e);process.exit(1)});
