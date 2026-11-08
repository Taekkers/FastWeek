(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var DAY=864e5;
var DAYS=['Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag','Søndag'];
var DS=['Man','Tir','Ons','Tor','Fre','Lør','Søn'];
var MON=['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
var STORES=['Bilka','Netto','Rema 1000','Coop 365','Lidl','Føtex','SuperBrugsen','Kvickly','Meny','Spar','Løvbjerg'];
var CATS=['Frugt & grønt','Kød & fisk','Mejeri & æg','Kolonial','Frost','Andet'];
var UNITS=['g','ml','stk'];
var PROTS=[['','Ingen/andet'],['okse','Okse'],['kylling','Kylling'],['svin','Svin'],['fisk','Fisk'],['vegetar','Vegetar'],['aeg','Æg']];
var ASK=[['fisk','Fisk'],['kylling','Fjerkræ'],['okse','Oksekød'],['svin','Svinekød'],['vegetar','Vegetar']];
var LOW_MAX=660,KALLOW=70;
var PIDX0={'Bilka':1.11,'Netto':1.054,'Rema 1000':1,'Coop 365':1.09,'Lidl':0.989,'Føtex':1.14,'SuperBrugsen':1.184,'Kvickly':1.172,'Meny':1.252,'Spar':1.196,'Løvbjerg':1.15};
var KID_W=.6;
var PAIR_MIN=25;
var DEF={persons:2,adults:2,kids:0,budget:0,budgetPer:'week',veg:false,quick:false,allergens:[],friWeekend:false,candy:true,oko:true,free:true,okoVeg:false,welfare:true,drive:40,stores:STORES.slice(),example:false};
var LINK='<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
var CHECK='<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
var CAM='<svg viewBox="0 0 24 24"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg>';
var PLATE='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/></svg>';

/* ---------- helpers ---------- */
var slug=function(s){return String(s||'').toLowerCase().trim().replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x'};
var nf=function(n,d){return Number(n).toLocaleString('da-DK',{maximumFractionDigits:d==null?1:d})};
var kr=function(n){n=Number(n)||0;return n.toLocaleString('da-DK',{minimumFractionDigits:(Math.round(n*100)%100?2:0),maximumFractionDigits:2})+' kr'};
var num=function(v){var n=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(n)?n:0};
var r1=function(n){return Math.round(n*10)/10};
var dec=function(n){return String(n).replace('.',',')};
function fq(q,u){q=Number(q)||0;if(u==='g'&&q>=1000)return nf(q/1000,2)+' kg';if(u==='ml'&&q>=1000)return nf(q/1000,2)+' l';return nf(q,1)+' '+u}
function pq(p,q){return p.leftover?nf(q,1)+' port.':fq(q,p.unit)}
var uid=function(){return Math.random().toString(36).slice(2,9)};
function parseYmd(s){var p=String(s).split('-').map(Number);return new Date(Date.UTC(p[0],p[1]-1,p[2]))}
function ymd(d){return d.toISOString().slice(0,10)}
function todayStr(){var n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')}
function addDays(s,n){return ymd(new Date(parseYmd(s).getTime()+n*DAY))}
function mondayOf(s){var d=parseYmd(s);var wd=(d.getUTCDay()+6)%7;return ymd(new Date(d.getTime()-wd*DAY))}
function isoWeek(s){var d=parseYmd(s);var day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day+3);var y=d.getUTCFullYear();var f=new Date(Date.UTC(y,0,4));var fd=(f.getUTCDay()+6)%7;f.setUTCDate(f.getUTCDate()-fd+3);return[y,1+Math.round((d-f)/(7*DAY))]}
function weekId(mon){var w=isoWeek(mon);return w[0]+'-W'+String(w[1]).padStart(2,'0')}
function daysBetween(a,b){var x=(parseYmd(b)-parseYmd(a))/DAY;return isFinite(x)?x:999}
function fmtDate(d){var x=parseYmd(d);return x.getUTCDate()+'. '+MON[x.getUTCMonth()]}
function wdIdx(s){return (parseYmd(s).getUTCDay()+6)%7}
function monOfWeek(w){var m=String(w).match(/^(\d{4})-W(\d{2})$/);if(!m)return mondayOf(todayStr());return addDays(mondayOf(m[1]+'-01-04'),(Number(m[2])-1)*7)}
/* Old settings had one switch (welfare). It now has two: oekologi and frilands. Old settings had "persons"; it is now adults + kids (a child counts KID_W). */
function normSettings(d){
  var s=Object.assign({},DEF,d||{});
  if(d&&d.oko===undefined&&d.free===undefined&&d.welfare!==undefined){s.oko=!!d.welfare;s.free=!!d.welfare}
  s.oko=!!s.oko;s.free=!!s.free;s.okoVeg=!!s.okoVeg;s.welfare=s.oko||s.free;
  var ad=(d&&d.adults!=null)?d.adults:((d&&d.persons>0)?Math.round(d.persons):DEF.adults);
  s.adults=Math.min(12,Math.max(1,Math.round(num(ad))||1));
  s.kids=Math.min(10,Math.max(0,Math.round(num(s.kids))||0));
  s.persons=r1(s.adults+KID_W*s.kids);
  delete s.zip;delete s.area;
  s.budget=Math.max(0,Math.round(num(s.budget)));
  s.budgetPer=s.budgetPer==='month'?'month':'week';
  delete s.stopVal;
  s.veg=!!s.veg;s.quick=!!s.quick;
  s.allergens=(Array.isArray(s.allergens)?s.allergens:[]).filter(function(k){return ALG[k]});
  return s;
}
function hhLabel(x){x=x||S.settings;var a=x.adults,k=x.kids;return a+(a===1?' voksen':' voksne')+(k?' og '+k+(k===1?' barn':' børn'):'')}

/* ---------- allergens and diet (guessed from the ingredient names) ---------- */
var ALG={
  gluten:{n:'Gluten',re:/hvede|(?:^|[^a-zæøå])rug|(?:^|[^a-zæøå])byg|havre|mel(?![a-zæøå])|pasta|spaghetti|penne|fusilli|farfalle|tagliatelle|lasagne|nudler|noodle|brød|bolle|tortilla|wrap|naan|pita|couscous|bulgur|semulje|rasp|panko|kiks|(?:^|[^a-zæøå])toast(?:brød)?(?![a-zæøå])|pizzabund|dej(?![a-zæøå])|(?:^|[^a-zæøå])soja(?![a-zæøå])|soja ?sauce|soyasauce|teriyaki|hoisin/,no:/kartoffelmel|majsmel|rismel|mandelmel|kikærtemel|karamel|karrypasta|currypasta|tomatpasta|chilipasta|kødbolle|fiskebolle|risnudler|glasnudler|majsstivelse/g},
  maelk:{n:'Laktose',re:/mælk|fløde|smør|(?:^|[^a-zæøå])ost|[a-zæøå]{3,}ost(?![a-zæøå])|parmesan|mozzarella|cheddar|feta|mascarpone|ricotta|gouda|emmental|halloumi|yoghurt|cremefraiche|creme fraiche|skyr|ghee|budding/,no:/kokosmælk|kokosfløde|mandelmælk|havremælk|sojamælk|risdrik|jordnøddesmør|nøddesmør|cashewsmør|kakaosmør|peanutbutter|sesamsmør|kokosyoghurt|sojayoghurt|havreyoghurt|mandelyoghurt|plantesmør|vegansk[a-zæøå]*/g},
  aeg:{n:'Æg',re:/(?:^|[^a-zæøå])æg(?![a-zæøå])|(?:høns|ande|vagtel|kylling|frilands)e?æg|æggeblomme|æggehvide|ægge|mayonnaise|remoulade/},
  nodder:{n:'Nødder',re:/mandl|mandel|valnød|hasselnød|cashew|pistac|pekan|macadamia|paranød|nøddemix|nødder|nøddeblanding/,no:/muskatnød|kokosnød|jordnød/g},
  jordnodder:{n:'Jordnødder',re:/jordnød|peanut/},
  soja:{n:'Soja',re:/soja|tofu|edamame|teriyaki|miso(?![a-zæøå])|tempeh|hoisin/},
  fisk:{n:'Fisk',re:/fisk|laks|torsk|(?:^|[^a-zæøå])tun(?![a-zæøå])|(?:^|[^a-zæøå])sej(?![a-zæøå])|makrel|sild|rødspætte|ansjos|fishsauce|fish sauce|skrubbe|sardin|hellefisk|kuller|(?:^|[^a-zæøå])ørred|havtaske|kaviar/},
  skaldyr:{n:'Skaldyr',re:/rejer|(?:^|[^a-zæøå])reje(?![a-zæøå])|krabbe|hummer|musling|østers|blæksprutte|calamari|skaldyr|krebs/},
};
var ALG_KEYS=Object.keys(ALG);
var MEATRE=/bacon|kød|kylling|svin|okse|skinke|pølse|salsiccia|medister|frikadelle|laks|torsk|(?:^|[^a-zæøå])tun(?![a-zæøå])|fisk|rejer|sild|makrel|ansjos|fishsauce|fish sauce|kalv|(?:^|[^a-zæøå])lam(?![a-zæøå])|flæsk|leverpostej/;
function algOf(name){
  var t=String(name||'').toLowerCase().replace(/[éèêë]/g,'e').replace(/[îï]/g,'i').replace(/ç/g,'c'),out=[];
  ALG_KEYS.forEach(function(k){var a=ALG[k],x=a.no?t.replace(a.no,' '):t;if(a.re.test(x))out.push(k)});
  return out;
}
function recAlg(r){var set={};((r&&r.ing)||[]).forEach(function(g){algOf(g.n).forEach(function(k){set[k]=1})});return ALG_KEYS.filter(function(k){return set[k]})}
function recBad(r){var want=S.settings.allergens||[];if(!want.length||!r)return [];return recAlg(r).filter(function(k){return want.indexOf(k)>-1})}
function isVeg(r){
  if(!r)return false;
  if(r.prot==='okse'||r.prot==='kylling'||r.prot==='svin'||r.prot==='fisk')return false;
  return !(r.ing||[]).some(function(g){return MEATRE.test(String(g.n||'').toLowerCase())});
}
function recAllowed(r){if(!r)return false;if(S.settings.veg&&!isVeg(r))return false;return !recBad(r).length}
var GEN_WHY='';

/* ---------- budget ---------- */
function weekBudget(){var b=Number(S.settings.budget)||0;return b>0?(S.settings.budgetPer==='month'?b/4.33:b):0}
function minIdx(){return Math.min.apply(null,activeStores().map(pidx))||1}
function daysIds(days){var o=[];(days||[]).forEach(function(d){if(!d||!d.r||d.lo||d.done)return;o.push(d.r);if(d.dbl)o.push(d.r)});return o}
/* Rough cost of what has to be bought for these dishes (stock considered), at the cheapest chosen store, without offers. */
function planEst(ids,mi){
  var needs=aggNeeds(ids),tot=0;
  Object.keys(needs).forEach(function(key){
    var n=needs[key],p=pan(n.k),same=p&&p.unit===n.unit;
    var b=buyCalc(same?curQty(p):0,same?reserve(p):0,same?(p.pack||0):0,n.need,n.unit);
    if(b)tot+=lineCost({k:n.k,unit:n.unit,qty:b.qty});
  });
  return tot*(mi||minIdx());
}

/* From Thursday the app looks at next week; before that at the current week. */
function targetMon(){var t=todayStr(),m=mondayOf(t);return wdIdx(t)>=3?addDays(m,7):m}

/* ---------- state ---------- */
var S={tab:'week',mon:targetMon(),recipes:{},scans:{},pantry:{items:{}},settings:Object.assign({},DEF),plans:{},offers:{},lists:{},prefs:{},
  ready:{},q:'',nodb:false,slow:false,ro:false,sample:null,imgOK:false,ctl:null,assets:null,sel:'',wz:null,skip:{},wzChecked:false,
  ref:{stores:{},items:{}},starter:{},praw:{},brands:{},bnames:{},uid:'',hasSettings:null,hasPantry:null,onb:false};
var db=null,raf=0,UB='';
function udoc(p){return db.doc(UB+p)}
function ucol(p){return db.collection(UB+p)}
var isWeekend=function(i){return i>=5||(i===4&&S.settings.friWeekend)};
var wid=function(){return weekId(S.mon)};
var pan=function(k){return (S.pantry.items||{})[k]};

/* ---------- writes ---------- */
function up(ref,data){return ref.update(data).catch(function(e){if(e&&e.code==='invalid_argument')return ref.set(data);throw e})}
function save(fn){return Promise.resolve().then(fn).catch(function(e){console.error(e);toast('Kunne ikke gemme. Prøv igen.')})}
var tt=0;
function toast(m){var t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},2800)}

/* ---------- stock model ---------- */
function curQty(p){var q=Number(p.qty)||0;if(p.use>0&&p.at){var d=daysBetween(p.at,todayStr());if(d>0)q=Math.max(0,q-p.use*d/7)}return q}
function reserve(p){var m=p.rule||'under';if(m==='under')return p.min||0;if(m==='days')return (p.use||0)*(p.days||0)/7;return 0}
function isLow(p){if(p.leftover)return false;var m=p.rule||'under',c=curQty(p);if(m==='never')return false;if(m==='out')return c<=1e-6;var r=reserve(p);return r>0&&c<r-1e-9}
function qpatch(q){return{qty:r1(Math.max(0,q)),at:todayStr()}}
function ruleOf(p){p=p||{};return{rule:p.rule||'under',min:p.min||0,days:p.days||2,use:p.use||0,pack:p.pack||0}}
function ruleSummary(r,u){
  if(r.rule==='never')return 'Ingen automatisk køb';
  if(r.rule==='out')return 'Køb når den er brugt op';
  if(r.rule==='days')return r.use>0?'Køb når der er under '+nf(r.days,1)+' dage tilbage':'Angiv forbrug pr. uge';
  return r.min>0?'Køb når under '+fq(r.min,u||'g'):'Ingen grænse sat';
}

/* ---------- kalorier (overslag) ---------- */
function kcalOf(r){
  var tot=0,miss=0;
  ((r&&r.ing)||[]).forEach(function(g){
    var p=pan(slug(g.n)),kc=p&&p.kc>=0&&p.kc!=null&&p.kc!==''?Number(p.kc):null;
    if(kc==null){miss++;return}
    tot+=g.u==='stk'?g.q*kc:g.q*kc/100;
  });
  return{k:Math.round(tot/2+KALLOW),miss:miss};
}

/* ---------- offers and store prices ---------- */
function words(s){return String(s||'').toLowerCase().replace(/[^a-zæøå0-9 ]+/g,' ').split(/\s+/).filter(Boolean)}
function nameMatch(itemName,offerName){
  var iw=words(itemName),ow=words(offerName);if(!iw.length||!ow.length)return false;
  return iw.every(function(w){return ow.some(function(o){return o.indexOf(w)===0||(o.length>=5&&w.indexOf(o)===0)})});
}
/* Kød, fisk og æg kan koebes oekologisk (kpo) eller som frilands / 3 hjerter (kpf). Brugeren vaelger hvilke der accepteres. */
function accQ(){return{oko:!!S.settings.oko,god:!!S.settings.free}}
function qprices(p){if(!p)return{oko:0,god:0};var o=p.kpo>0?p.kpo:0,f=p.kpf>0?p.kpf:0;if(!o&&!f&&p.kpg>0){o=p.kpg;f=p.kpg}return{oko:o,god:f}}
/* Fruit and vegetables have their own organic choice. Without an organic shelf price the estimate is the normal price + 40 %. */
var OKOV=1.4,OKO_RE=/(^|[^a-zæøå])(øko|økologisk|økologiske|øgo|änglamark|oekologisk)/i;
function isVegP(p){return !!p&&p.cat==='Frugt & grønt'}
function offQ(o){return o.q||(OKO_RE.test(o.name||'')?'oko':'')}
function qbest(p){if(isVegP(p)){if(!S.settings.okoVeg)return null;var vp=p.kpo>0?p.kpo:(p.kp||0)*OKOV;return vp>0?{q:'oko',price:vp}:null}var a=accQ(),qp=qprices(p),b=null;if(a.oko&&qp.oko>0)b={q:'oko',price:qp.oko};if(a.god&&qp.god>0&&(!b||qp.god<b.price))b={q:'god',price:qp.god};return b}
function qual(k){return !!qbest(pan(k))}
function qname(q){return q==='oko'?'Økologi':'Frilands'}
function qualOk(o,it){if(!qual(it.k))return true;var q=offQ(o);if(isVegP(pan(it.k)))return q==='oko';var a=accQ();return (q==='oko'&&a.oko)||(q==='god'&&a.god)}
function offerMatch(o,it){if(!qualOk(o,it))return false;if(o.match)return slug(o.match)===it.k;return nameMatch(it.name,o.name)}
function rawMatch(o,it){if(o.match)return slug(o.match)===it.k;return nameMatch(it.name,o.name)}
/* ---------- foretrukne mærker pr. vare ---------- */
function bnorm(s){return String(s==null?'':s).toLowerCase().replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/é/g,'e').replace(/\s+/g,' ').trim()}
function brandsOf(k){var b=(S.brands||{})[k];return Array.isArray(b)?b.filter(function(x){return typeof x==='string'&&x.trim()}):[]}
function brandLabel(k){var b=brandsOf(k);return b.length?b[0]+(b.length>1?' +'+(b.length-1):''):''}
function parseBrands(t){var seen={},out=[];String(t==null?'':t).split(/\s*(?:,|;|\n|\s+eller\s+)\s*/i).forEach(function(x){x=x.replace(/\s+/g,' ').trim().slice(0,30);var n=bnorm(x);if(x&&!seen[n]&&out.length<4){seen[n]=1;out.push(x)}});return out}
/* the brand must be a whole word (or words) in the offer name ("Rose" matches "Rose hakket kylling", not "Rosenkål") */
function brandIn(name,b){var n=bnorm(name),t=bnorm(b),L=/[a-z0-9æøå]/;if(!t)return false;var i=n.indexOf(t);while(i>-1){if((i===0||!L.test(n.charAt(i-1)))&&!L.test(n.charAt(i+t.length)))return true;i=n.indexOf(t,i+1)}return false}
function brandOk(o,it){var bs=brandsOf(it.k);if(!bs.length)return true;return bs.some(function(b){return brandIn(o.name,b)})}
var BGEN=/^(dansk|danske|dansk-|oekologisk|økologisk|økologiske|oeko|øko|frilands|frilandsæg|hel|hele|hakket|fersk|friske?|spisemodne|grønne|røde|gule|nye|store|små|lille|stor|skiver|stykke|portioner?|pose|pakke|skummet|skummet-|eller|let|sød)$/;
/* guess the brand from an offer name: the words before the product words ("Salling Princip kartofler" -> "Salling Princip") */
function brandGuess(o,it){
  var nm=String(o.name||'').split(',')[0].replace(/\s+/g,' ').trim(),w=nm.split(' ');
  var st=bnorm(it.name).split(/[\s-]+/).filter(function(x){return x.length>=4}).map(function(x){return x.slice(0,4)});
  var out=[];
  for(var i=0;i<w.length&&i<3;i++){
    var x=bnorm(w[i]);
    if(!x||/\d/.test(x)||BGEN.test(x)||st.some(function(s){return x.indexOf(s)>-1}))break;
    out.push(w[i]);
  }
  return out.join(' ');
}
function brandSuggest(k,name,w){
  var it={k:k,name:name},m={};
  activeOffers(w).forEach(function(o){
    if(!rawMatch(o,it))return;var g=brandGuess(o,it);if(!g)return;
    var key=bnorm(g),x=m[key]=m[key]||{n:g,s:[]};if(x.s.indexOf(o.store)<0)x.s.push(o.store)});
  return Object.keys(m).map(function(q){return m[q]}).sort(function(a,b){return b.s.length-a.s.length||a.n.localeCompare(b.n,'da')});
}
function ppu(p){if(!p)return 0;var b=qbest(p);return b?b.price:(p.kp||0)}
/* Normal shelf price level per store, relative to Rema 1000 (Madprisluppen basket, ~100 everyday items). */
/* Normal shelf price in each chain (data/ref.json items[k].sp, kr per kg / l / stk, from the chains' own catalogues).
   Where a chain has no published shelf price (Coop chains, Løvbjerg) the chain's price level (pidx) is used: an estimate. */
function spOf(k,s){var r=S.ref&&S.ref.items&&S.ref.items[k];return r&&r.sp&&r.sp[s]>0?r.sp[s]:0}
function realP(k,s){var p=pan(k);return !!(p&&!qbest(p)&&spOf(k,s)>0&&ppu(p)>0)}
function pfac(k,s){return realP(k,s)?spOf(k,s)/ppu(pan(k)):pidx(s)}
function hasSP(){var it=(S.ref&&S.ref.items)||{};for(var k in it){if(it[k]&&it[k].sp&&Object.keys(it[k].sp).length)return true}return false}
function pidx(s){var m=(S.ref&&S.ref.stores&&S.ref.stores.pidx)||PIDX0,v=+m[s];return v>0?v:(PIDX0[s]||1)}
function activeStores(){var a=(S.settings.stores||[]).filter(function(s){return STORES.indexOf(s)>-1});return a.length?a:STORES.slice()}
function lineCost(it){var p=pan(it.k);if(!p||p.unit!==it.unit)return 0;var u=ppu(p);if(!(u>0))return 0;return it.unit==='stk'?it.qty*u:it.qty/1000*u}
function activeOffers(w){var as=activeStores();return ((S.offers[w]||{}).items||[]).filter(function(o){return as.indexOf(o.store)>-1})}
function ofactor(o,it){if(o.qty>0&&o.unit===it.unit)return Math.max(1,Math.ceil(it.qty/o.qty-1e-9));return it.packs||1}
function bestOfferAt(it,w,store,loose){
  var best=null;activeOffers(w).forEach(function(o){
    if(store&&o.store!==store)return;
    if(!brandOk(o,it))return;
    if(!(loose?rawMatch(o,it):offerMatch(o,it)))return;
    var f=ofactor(o,it),c=o.price*f;if(!best||c<best.cost)best={o:o,cost:c,f:f,sv:o.was>o.price?(o.was-o.price)*f:0};
  });
  return best;
}
function bestOffer(it,w){return bestOfferAt(it,w,null)}
/* Price per store: the normal estimate, or the offer where it is cheaper. */
function storeCosts(items,w){
  var res={},unpriced=0,norm=0,skipped=0,looked=0,priced=0;
  var AS=activeStores();
  AS.forEach(function(s){res[s]={store:s,total:0,n:0,save:0,lines:{}}});
  items.forEach(function(it){
    var c0=lineCost(it),key=it.k+'_'+it.unit;
    if(!(c0>0)){unpriced++;return}
    norm+=c0;priced++;if(pan(it.k)&&pan(it.k).pv)looked++;
    AS.forEach(function(s){
      var n0=c0*pfac(it.k,s),bo=bestOfferAt(it,w,s),c=n0,via=null;
      if(bo&&bo.cost<n0-.005){c=bo.cost;via=bo;res[s].n++;res[s].save+=n0-c}
      res[s].total+=c;res[s].lines[key]={cost:c,norm:n0,via:via,est:!realP(it.k,s)};
      if(!via&&qual(it.k)){var lo=bestOfferAt(it,w,s,true);if(lo&&lo.cost<n0-.005)skipped++}
    });
  });
  return{stores:res,norm:norm,unpriced:unpriced,skipped:skipped,looked:looked,priced:priced};
}
/* Stores ordered by what the whole list costs there: cheapest first. */
function byCost(sc,arr){return arr.slice().sort(function(a,b){var x=sc.stores[a],y=sc.stores[b];return x.total-y.total||y.n-x.n||String(a).localeCompare(String(b),'da')})}
/* Best set of k stores: every line is bought where it is cheapest within the set. */
function bestSet(sc,k){
  var st=activeStores();if(k<1||st.length<k)return null;
  var keys=Object.keys(sc.stores[st[0]].lines),best=null;
  var cur=[];
  (function rec(start){
    if(cur.length===k){
      var tot=0;
      keys.forEach(function(key){var m=Infinity;cur.forEach(function(s){var c=sc.stores[s].lines[key].cost;if(c<m)m=c});tot+=m});
      if(!best||tot<best.total-1e-9)best={stores:cur.slice(),total:tot};
      return;
    }
    for(var i=start;i<st.length;i++){cur.push(st[i]);rec(i+1);cur.pop()}
  })(0);
  if(!best)return null;
  best.stores=byCost(sc,best.stores);
  var single=st.map(function(s){return sc.stores[s]}).sort(function(x,y){return x.total-y.total})[0];
  best.base=single.store;best.baseTotal=single.total;best.save=Math.max(0,single.total-best.total);best.assign={};best.sub={};
  best.stores.forEach(function(s){best.sub[s]=0});
  keys.forEach(function(key){
    var pick=best.stores[0],pc=sc.stores[pick].lines[key].cost;
    best.stores.forEach(function(s){var c=sc.stores[s].lines[key].cost;if(c<pc-1e-9){pick=s;pc=c}});
    best.assign[key]=pick;best.sub[pick]+=pc;
  });
  best.a=best.stores[0];best.b=best.stores[1];
  return best;
}
function bestPair(sc){return activeStores().length<2?null:bestSet(sc,2)}
/* One store or several? The options are the cheapest single store and the best 2 and 3 stores.
   Each extra store has to save at least MIN_EXTRA kr, otherwise the recommendation stays with fewer stores. */
var MIN_EXTRA=20;
/* The user picked exactly 2 or 3 stores: then every item is compared across those stores. */
function fixedN(){var n=(S.settings.stores||[]).filter(function(s){return STORES.indexOf(s)>-1}).length;return n>=2&&n<=3?n:0}
function shopOptions(sc){
  var act=activeStores(),sv=MIN_EXTRA,fix=fixedN();
  var tot=act.map(function(s){return sc.stores[s]}).sort(function(a,b){return a.total-b.total||b.n-a.n});
  var opts=[{k:1,stores:[tot[0].store],total:tot[0].total,save:0,extra:0,sel:tot[0].store,assign:null,sub:null,net:0}];
  if(act.length>=2){var p2=bestSet(sc,2);if(p2&&(p2.save>=1||fix===2)){p2.k=2;p2.sel='pair';p2.extra=p2.save;opts.push(p2)}}
  if(act.length>=3){var p3=bestSet(sc,3),prev=opts[opts.length-1];if(p3&&(p3.total<prev.total-1||fix===3)){p3.k=3;p3.sel='trio';p3.extra=Math.max(0,prev.total-p3.total);opts.push(p3)}}
  var rec=0,bn=0;
  opts.forEach(function(o,i){o.net=o.save-sv*(o.k-1);if(i>0&&o.net>bn+1e-9){bn=o.net;rec=i}});
  if(fix)opts.forEach(function(o,i){if(o.k===fix&&i>0)rec=i});
  return{opts:opts,rec:rec,recTotal:opts[rec].total,sv:sv,cheapest:opts[opts.length-1]};
}
/* Shared price reference (ref/items) is laid over the user's own stock items, unless the user set the price or kcal herself. */
function applyRef(){
  var raw=S.praw||{},ref=(S.ref&&S.ref.items)||{},o={};
  Object.keys(raw).forEach(function(k){var p=raw[k],r=ref[k];
    if(r&&(!r.unit||!p.unit||r.unit===p.unit)){p=Object.assign({},p);
      if(!p.kpx){if(r.kp>=0)p.kp=r.kp;['kpg','kpo','kpf'].forEach(function(f){if(r[f]!=null)p[f]=r[f];else delete p[f]});if(r.pv)p.pv=r.pv;else delete p.pv}
      if(!p.kcx&&r.kc!=null)p.kc=r.kc;
      if(!p.cat&&r.cat)p.cat=r.cat}
    o[k]=p});
  S.pantry={items:o};
}
/* ---------- needs, shopping list, waste, coverage ---------- */
function aggNeeds(ids){
  var sc=(S.settings.persons||2)/2,m={};
  ids.forEach(function(id){var r=S.recipes[id];if(!r)return;(r.ing||[]).forEach(function(g){var k=slug(g.n),key=k+'|'+g.u;m[key]=m[key]||{k:k,name:g.n,unit:g.u,need:0};m[key].need+=g.q*sc})});
  return m;
}
/* A double-portion day counts twice; a leftover day counts nothing. */
function planIds(w,includeDone){
  var p=S.plans[w],out=[];
  ((p&&p.days)||[]).forEach(function(d){if(!d||!d.r||d.lo||(!includeDone&&d.done))return;out.push(d.r);if(d.dbl)out.push(d.r)});
  return out;
}
function buyCalc(stock,min,pack,need,unit){
  var after=stock-need;if(after>=min-1e-9)return null;
  var buy=min-after,packs,qty;
  if(pack>0){packs=Math.ceil(buy/pack-1e-9);qty=packs*pack}
  else{packs=1;qty=unit==='stk'?Math.ceil(buy-1e-9):Math.ceil(buy/50-1e-9)*50}
  return{buy:buy,packs:packs,qty:qty,excess:qty-buy};
}
function computeList(w){
  var needs=aggNeeds(planIds(w,false)),out=[],seen={};
  Object.keys(needs).forEach(function(key){
    var n=needs[key],p=pan(n.k),same=p&&p.unit===n.unit;
    var stock=same?curQty(p):0,min=same?reserve(p):0,pack=same?(p.pack||0):0;
    var b=buyCalc(stock,min,pack,n.need,n.unit);seen[n.k]=1;
    if(b)out.push({k:n.k,name:n.name,unit:n.unit,need:n.need,stock:stock,pack:pack,packs:b.packs,qty:b.qty,reason:stock<n.need-1e-9?'need':'low',cat:(p&&p.cat)||'Andet'});
  });
  Object.keys(S.pantry.items||{}).forEach(function(k){
    if(seen[k])return;var p=S.pantry.items[k];if(p.leftover||!isLow(p))return;
    var mode=p.rule||'under',cq=curQty(p),pack=p.pack||0,b;
    if(mode==='out'){b={packs:1,qty:pack>0?pack:(p.unit==='stk'?1:100)}}
    else{b=buyCalc(cq,reserve(p),pack,0,p.unit)}
    if(b)out.push({k:k,name:p.name,unit:p.unit,need:0,stock:cq,pack:pack,packs:b.packs,qty:b.qty,reason:mode==='out'?'out':'low',cat:p.cat||'Andet'});
  });
  return out;
}
function wasteOf(ids){
  var needs=aggNeeds(ids),pen=0,rest=[];
  Object.keys(needs).forEach(function(key){
    var n=needs[key],p=pan(n.k);if(!p||p.unit!==n.unit||!(p.pack>0))return;
    var b=buyCalc(curQty(p),reserve(p),p.pack,n.need,n.unit);if(!b)return;
    var frac=b.excess/p.pack;pen+=(p.perish?1:.25)*frac;
    if(p.perish&&frac>=.2)rest.push({name:p.name,qty:b.excess,unit:p.unit});
  });
  return{pen:pen,rest:rest};
}
function coverage(ids){
  var needs=aggNeeds(ids),lines=0,cov=0,buy=0;
  Object.keys(needs).forEach(function(key){
    var n=needs[key],p=pan(n.k),st=p&&p.unit===n.unit?curQty(p):0;
    lines++;cov+=n.need>0?Math.min(1,st/n.need):1;if(st<n.need-1e-9)buy++;
  });
  return{lines:lines,cov:cov,buy:buy};
}
/* Madspild: how much of what is at home does the plan use? Things that go off soon count most. */
function stockUse(ids,exp){
  var needs=aggNeeds(ids),pi=S.pantry.items||{},w=0,miss=0,used=[],left=[];
  Object.keys(pi).forEach(function(k){
    var p=pi[k];if(p.leftover||STAPLE[k])return;
    var st=curQty(p);if(!(st>1e-6))return;
    var urgent=!!(exp&&exp[k]),soft=!!p.perish,n=needs[k+'|'+p.unit],nd=n?n.need:0,den=Math.min(st,p.pack>0?p.pack:st),fr=Math.min(1,nd/den);
    w+=(urgent?1.8:(soft?1:.3))*fr;
    if(fr>=.25)used.push({k:k,name:p.name,urgent:urgent||soft,fr:fr});
    else if(urgent||soft){miss+=urgent?1.5:.6;left.push({k:k,name:p.name,urgent:urgent})}
  });
  return{w:w,miss:miss,used:used,left:left};
}
function recCov(r){
  var sc=(S.settings.persons||2)/2,ing=r.ing||[];if(!ing.length)return 0;var s=0;
  ing.forEach(function(g){var p=pan(slug(g.n)),st=p&&p.unit===g.u?curQty(p):0;s+=Math.min(1,st/(g.q*sc))});
  return s/ing.length;
}

/* ---------- ugens ønsker (prefs) ---------- */
function defDays(mon){
  var out=[];for(var i=0;i<7;i++)out.push({m:'cook',t:isWeekend(i)?999:(S.settings.quick?30:45)});return out;
}
function prevPrefs(w){
  var keys=Object.keys(S.prefs).filter(function(k){return k<w&&S.prefs[k]}).sort();
  return keys.length?S.prefs[keys[keys.length-1]]:null;
}
/* A double portion on Sunday means Monday next week is leftovers. */
function carryIn(w){var pw=S.plans[weekId(addDays(monOfWeek(w),-7))],d=pw&&pw.days&&pw.days[6];return d&&d.r&&d.dbl&&!d.off&&!d.lo&&!d.f?d.r:''}
function getPrefs(w){
  var saved=S.prefs[w],pv=prevPrefs(w),d=defDays();
  var days=d.map(function(x,i){var s=saved&&saved.days&&saved.days[i];return{m:(s&&s.m)||x.m,t:(s&&Number(s.t))||x.t}});
  var prot={};ASK.forEach(function(a){var v=saved&&saved.prot?saved.prot[a[0]]:'auto';prot[a[0]]=(v===0||v===1||v===2||v===3)?v:'auto'});
  var mode=(saved&&saved.mode)||(pv&&pv.mode)||'offers';
  return{days:days,prot:prot,low:saved?!!saved.low:!!(pv&&pv.low),done:!!(saved&&saved.done),carry:carryIn(w),mode:mode==='self'?'self':'offers'};
}
/* effective kind per day: cook | dbl | off | lo (leftovers) */
function effModes(P){
  var out=[];
  for(var i=0;i<7;i++){
    if(i===0&&P.carry)out.push('lo');
    else if(i>0&&out[i-1]==='dbl')out.push('lo');
    else out.push(P.days[i].m);
  }
  return out;
}
function prefsSummary(P){
  var eff=effModes(P),bits=[],dbl=eff.filter(function(m){return m==='dbl'}).length,off=eff.filter(function(m){return m==='off'}).length;
  if(P.low)bits.push('Kaloriefattigt');
  ASK.forEach(function(a){var v=P.prot[a[0]];if(v===0)bits.push(a[1]+': ingen');else if(v>0)bits.push(a[1]+' '+v+'×')});
  if(dbl)bits.push(dbl===1?'1 dobbelt portion':dbl+' dobbelte');
  if(off)bits.push(off===1?'1 dag uden mad':off+' dage uden mad');
  var shortDays=P.days.filter(function(d,i){return eff[i]!=='off'&&eff[i]!=='lo'&&d.t===30}).length;
  if(shortDays)bits.push(shortDays===1?'1 hurtig aften':shortDays+' hurtige aftener');
  return bits;
}

/* ---------- smag: favoritter og vurderinger -> hvilke retter passer bedst ---------- */
var STAPLE={salt:1,peber:1,olie:1,'løg':1,'hvidløg':1,'smør':1,mel:1,sukker:1,vand:1,bouillonterning:1,'mælk':1,'fløde':1,'madlavningsfløde':1,ris:1,pasta:1,kartofler:1};
var TAGMAP=[['italiensk',/pasta|spaghetti|lasagne|risotto|pizza|bolognese|salsiccia|mozzarella|parmesan/],['asiatisk',/teriyaki|wok|soja|nudl|sesam|fishsauce|ingefær|kokosris|karrypasta|pak choi/],['mexicansk',/taco|tortilla|enchilada|burrito|fajita|quesadilla|salsa|chili con|jalapeno/],['indisk',/karry|dahl|naan|masala|linse/],['suppe',/suppe/],['gryde',/gryde|dahl|stuvning/],['ovn',/ovn|bagt|fad\b|pakker/],['salat',/salat/],['pasta',/pasta|spaghetti|lasagne|penne/],['ris',/\bris\b|kokosris/],['wrap',/taco|wrap|burger|tortilla|quesadilla/],['dansk',/frikadelle|boller|æggekage|pytt|flæsk|rugbrød/]];
function tagsOf(r){
  if(r.tags&&r.tags.length)return r.tags;
  var s=(String(r.name||'')+' '+(r.ing||[]).map(function(g){return g.n}).join(' ')).toLowerCase(),t=[];
  TAGMAP.forEach(function(x){if(x[1].test(s))t.push(x[0])});return t;
}
function featOf(r){
  var m=r.minutes||40,f=['p:'+(r.prot==='aeg'?'vegetar':(r.prot||'andet')),'k:'+(r.kind||'hverdag'),'m:'+(m<=30?'quick':m<=50?'mid':'long')];
  tagsOf(r).forEach(function(t){f.push('t:'+t)});
  (r.ing||[]).forEach(function(g){var n=String(g.n).toLowerCase();if(!STAPLE[n])f.push('i:'+n)});
  return f;
}
function likeW(r){var w=0;if(r.fav)w+=2;if(r.again==='yes')w+=1;else if(r.again==='no')w-=2;return w}
/* score per recipe in -1..1: how close it is to what the user likes (favourites, ratings, repeat flags). 0 for all if nothing is known yet. */
function tasteModel(){
  var ids=Object.keys(S.recipes),F={},df={},N=ids.length||1,out={},prof={},any=false;
  ids.forEach(function(id){F[id]=featOf(S.recipes[id]);var seen={};F[id].forEach(function(f){if(!seen[f]){seen[f]=1;df[f]=(df[f]||0)+1}})});
  var idf=function(f){return Math.log(1+N/(df[f]||1))};
  ids.forEach(function(id){var w=likeW(S.recipes[id]);if(!w)return;any=true;var fs=F[id],n=Math.sqrt(fs.length);fs.forEach(function(f){prof[f]=(prof[f]||0)+w*idf(f)/n})});
  if(!any){ids.forEach(function(id){out[id]=0});return{score:out,prof:prof,any:false}}
  var raw={},lo=1e9,hi=-1e9;
  ids.forEach(function(id){var fs=F[id],n=Math.sqrt(fs.length),v=0;fs.forEach(function(f){v+=(prof[f]||0)*idf(f)});v/=n;raw[id]=v;if(v<lo)lo=v;if(v>hi)hi=v});
  var mid=(hi+lo)/2,half=(hi-lo)/2||1,nl=0;ids.forEach(function(id){if(likeW(S.recipes[id]))nl++});var conf=Math.min(1,nl/4);ids.forEach(function(id){out[id]=(raw[id]-mid)/half*conf});
  return{score:out,prof:prof,any:true};
}
var FEATLAB={'p:okse':'oksekød','p:kylling':'kylling','p:svin':'svinekød','p:fisk':'fisk','p:vegetar':'vegetar','m:quick':'hurtige retter','m:long':'retter med tid','k:weekend':'weekendmad'};
function tasteLabels(model){
  var arr=Object.keys(model.prof).filter(function(f){return model.prof[f]>0&&(FEATLAB[f]||f.indexOf('t:')===0)}).sort(function(a,b){return model.prof[b]-model.prof[a]});
  return arr.slice(0,4).map(function(f){return FEATLAB[f]||f.slice(2)});
}

/* ---------- plan generator (stock first, with the week's wishes) ---------- */
function offerHits(r,w){var c=0;(r.ing||[]).forEach(function(g){var it={k:slug(g.n),name:g.n};if(activeOffers(w).some(function(o){return offerMatch(o,it)}))c++});return c}
function ctxFor(w){
  var t=todayStr(),exp={},per={},P=getPrefs(w);
  Object.keys(S.pantry.items||{}).forEach(function(k){var p=S.pantry.items[k];if(p.expires&&curQty(p)>0&&daysBetween(t,p.expires)<=5)exp[k]=1;if(p.perish&&!p.leftover&&curQty(p)>1e-6)per[k]=1});
  var hits={},cov={},kc={},ak={},last={},mon=monOfWeek(w);Object.keys(S.recipes).forEach(function(id){var r=S.recipes[id];hits[id]=offerHits(r,w);cov[id]=recCov(r);kc[id]=kcalOf(r).k;ak[id]=artKey(r).k});
  /* last time each dish was planned or made (other weeks), so dishes and favourites do not come every week */
  Object.keys(S.plans).forEach(function(pw){if(pw===w)return;var pl=S.plans[pw],m0=monOfWeek(pw);((pl&&pl.days)||[]).forEach(function(d,j){if(!d||!d.r||d.lo||d.off)return;var dt=addDays(m0,j);if(!last[d.r]||dt>last[d.r])last[d.r]=dt})});
  Object.keys(S.recipes).forEach(function(id){var m=S.recipes[id].made;if(m&&m.last&&(!last[id]||m.last>last[id]))last[id]=m.last});
  var tm=tasteModel();
  return{exp:exp,per:per,hits:hits,cov:cov,kc:kc,ak:ak,P:P,last:last,mon:mon,taste:tm.score,tasteAny:tm.any,quick:!!S.settings.quick};
}
function fit(r,i,ctx,id){
  var P=ctx.P,s=0,wk=isWeekend(i),dp=P.days[i]||{m:'cook',t:45};
  if(wk)s+=r.kind==='weekend'?3:(P.low?-1:-6);
  else s+=r.kind==='hverdag'?3:-4;
  var m=r.minutes||40,tmax=dp.t||999;
  if(m>tmax)s-=2+(m-tmax)/10;else s+=m<=30?1.5:m<=45?.5:0;
  if(ctx.quick&&!wk&&m>30)s-=3;
  if(dp.m==='dbl')s+=r.rest?3:-7;
  if(P.low){var k=ctx.kc[id]||600;s+=k>LOW_MAX?-(6+(k-LOW_MAX)/40):(LOW_MAX-k)/220}
  var lu=ctx.last[id]?Math.abs(daysBetween(ctx.last[id],addDays(ctx.mon,i))):null;
  if(r.again==='no')s-=16;
  else if(r.again==='yes')s+=lu==null?1.4:(lu<=14?0:Math.min(1.4,.6+(lu-14)/12));
  var mw=(r.made&&r.made.wd&&r.made.wd[i])||0;s+=Math.min(2,mw*.7);
  if(lu!=null){var fx=r.fav?1:0;s-=lu<=9?9+fx:lu<=14?4+fx:lu<=21?2+fx*.5:lu<=28?1:0}
  s+=(ctx.taste[id]||0)*3+(r.fav?1:0);
  var ex=0;(r.ing||[]).forEach(function(g){if(ctx.exp[slug(g.n)])ex++});
  s+=Math.min(5,ex*2.5)*(1.3-i/10);
  var pe=0;(r.ing||[]).forEach(function(g){var k=slug(g.n);if(ctx.per[k]&&!ctx.exp[k])pe++});s+=Math.min(2.5,pe*.9);
  s+=Math.min(2.5,(ctx.hits[id]||0)*.6);
  var c=ctx.cov[id]||0;s+=8*c+(c>=.99?3:0);
  return s;
}
function generate(w){
  var ids=Object.keys(S.recipes),old=((S.plans[w]||{}).days)||[],ctx=ctxFor(w),P=ctx.P;
  var fixed=[0,1,2,3,4,5,6].map(function(i){var d=old[i];return d&&(d.r||d.f)&&!d.lo&&(d.lock||d.done)?d:null});
  var kind=[],i;
  var dblAt=function(j){return fixed[j]?!!fixed[j].dbl:(kind[j]==='slot'&&P.days[j].m==='dbl')};
  for(i=0;i<7;i++){
    if(fixed[i])kind[i]='fixed';
    else if(i===0&&P.carry)kind[i]='lo';
    else if(i>0&&dblAt(i-1))kind[i]='lo';
    else if(P.days[i].m==='off')kind[i]='off';
    else kind[i]='slot';
  }
  var free=[0,1,2,3,4,5,6].filter(function(j){return kind[j]==='slot'});
  var used={};fixed.forEach(function(d){if(d&&d.r)used[d.r]=1});
  var okR=function(id){return recAllowed(S.recipes[id])};
  var pool=ids.filter(function(id){return !used[id]&&S.recipes[id].again!=='no'&&okR(id)});
  if(pool.length<free.length)pool=ids.filter(function(id){return !used[id]&&okR(id)});
  GEN_WHY=(!pool.length&&free.length&&ids.some(function(id){return !used[id]}))?'filter':(pool.length<free.length?'few':'');
  if(!pool.length||!free.length)return null;
  var VEG=!!S.settings.veg,BUD=weekBudget(),MI=minIdx();
  var OFFM=P.mode==='offers'?offerModel(w,pool.concat(fixed.map(function(d){return d&&d.r}))):null;
  function score(arr){
    var s=0,live=[],cnt={},sty={},fc=0;
    arr.forEach(function(id,j){
      if(!id)return;var fx=kind[j]==='fixed'&&fixed[j];sty[ctx.ak[id]]=(sty[ctx.ak[id]]||0)+1;
      s+=fit(S.recipes[id],j,ctx,id);
      var p=S.recipes[id].prot;if(p)cnt[p]=(cnt[p]||0)+1;if(p==='aeg')cnt.vegetar=(cnt.vegetar||0)+1;if(S.recipes[id].fav)fc++;
      if(!(fx&&fx.done)){live.push(id);if(kind[j]==='fixed'?(fx&&fx.dbl):(kind[j]==='slot'&&P.days[j].m==='dbl'))live.push(id)}
    });
    s-=wasteOf(live).pen*1.5;
    if(OFFM)s+=OFW*planOfferValue(arr.filter(function(x,j){return x&&kind[j]!=='lo'}),OFFM).v;
    var cv=coverage(live);if(cv.lines){s+=14*cv.cov/cv.lines;s-=.8*cv.buy}
    var su=stockUse(live,ctx.exp);s+=5*Math.min(su.w,6);s-=4*Math.min(su.miss,6);
    if(BUD>0){var est=planEst(live,MI);s-=3*est/BUD;if(est>BUD)s-=(est-BUD)/BUD*60}
    for(var j=1;j<7;j++){var a=(S.recipes[arr[j-1]]||{}).prot,b=(S.recipes[arr[j]]||{}).prot;if(a&&a===b)s-=2}
    if(!VEG)ASK.forEach(function(pa){var p=pa[0],t=P.prot[p],c=cnt[p]||0;
      if(t==='auto'){if(c>2)s-=(c-2)*4}
      else{s-=7*Math.abs(c-t);if(t===0)s-=8*c}});
    if(S.settings.welfare){var meat=(cnt.okse||0)+(cnt.kylling||0)+(cnt.svin||0);if(meat>4)s-=(meat-4)*4}
    if(fc>2)s-=(fc-2)*5;
    s+=Math.min(2,(cnt.vegetar||0))*.8;
    Object.keys(sty).forEach(function(k){if(sty[k]>1)s-=(sty[k]-1)*2.5});
    return s;
  }
  var best=null,bs=-1e9;
  for(var rs=0;rs<8;rs++){
    var sh=pool.slice().sort(function(){return Math.random()-.5});
    var cur=['','','','','','',''];fixed.forEach(function(d,j){if(d)cur[j]=d.r||''});
    free.forEach(function(j,n){cur[j]=sh[n]||''});
    var cs=score(cur);if(cs>bs){bs=cs;best=cur.slice()}
    for(var it=0;it<600;it++){
      var a1=free[Math.floor(Math.random()*free.length)],nx=cur.slice();
      if(Math.random()<.5&&free.length>1){var b1=free[Math.floor(Math.random()*free.length)];if(b1===a1)continue;var tmp=nx[a1];nx[a1]=nx[b1];nx[b1]=tmp}
      else{var cand=pool[Math.floor(Math.random()*pool.length)];if(nx.indexOf(cand)>-1)continue;nx[a1]=cand}
      var ns=score(nx),T=1.2*(1-it/600);
      if(ns>=cs||Math.random()<Math.exp((ns-cs)/Math.max(T,.01))){cur=nx;cs=ns}
      if(cs>bs){bs=cs;best=cur.slice()}
    }
  }
  var out=[];
  for(i=0;i<7;i++){
    if(kind[i]==='fixed')out.push(fixed[i]);
    else if(kind[i]==='off')out.push({r:'',off:true,done:false,lock:false});
    else if(kind[i]==='lo'){
      var pv=out[i-1];
      if(i===0)out.push({r:P.carry,lo:true,from:-1,done:!!(old[0]&&old[0].lo&&old[0].done),lock:false});
      else out.push(pv&&pv.r&&pv.dbl?{r:pv.r,lo:true,from:i-1,done:!!(old[i]&&old[i].lo&&old[i].done),lock:false}:{r:'',done:false,lock:false});
    }else{
      var d={r:best[i],done:false,lock:false};if(P.days[i].m==='dbl'&&best[i])d.dbl=true;
      out.push(d);
      /* a double day whose recipe is empty cannot have leftovers */
    }
  }
  /* second pass: leftovers need a double day before them */
  for(i=1;i<7;i++){if(out[i].lo&&!(out[i-1].r&&out[i-1].dbl))out[i]={r:'',done:false,lock:false}}
  if(out[0]&&out[0].lo&&out[0].from===-1&&!P.carry)out[0]={r:'',done:false,lock:false};
  return out;
}

/* ---------- planning after the week's offers ----------
   For every recipe: how much its ingredients save on offer, for every set of stores (1-3, or exactly the chosen 2-3).
   A plan is worth the best store set: savings minus MIN_EXTRA per extra store. */
function subsetsOf(AS,fix){
  if(fix&&AS.length===fix)return [AS.slice()];
  var out=[],K=Math.min(3,AS.length);
  (function rec(st,cur){if(cur.length)out.push(cur.slice());if(cur.length===K)return;for(var i=st;i<AS.length;i++){cur.push(AS[i]);rec(i+1,cur);cur.pop()}})(0,[]);
  return out;
}
var OFM={key:'',rec:{}},OFW=.35;
function offerModel(w,ids){
  var AS=activeStores(),offs=activeOffers(w);if(!offs.length)return null;
  var key=w+'|'+offs.length+'|'+AS.join(',')+'|'+Object.keys(S.pantry.items||{}).length+'|'+(S.settings.persons||2);
  if(OFM.key!==key)OFM={key:key,rec:{},subs:subsetsOf(AS,fixedN())};
  var subs=OFM.subs;
  ids.forEach(function(id){
    if(!id||OFM.rec[id]||!S.recipes[id])return;
    var needs=aggNeeds([id]),lines=[];
    Object.keys(needs).forEach(function(nk){
      var n=needs[nk],p=pan(n.k),it={k:n.k,name:n.name,unit:n.unit,qty:n.need,packs:1};
      if(p&&p.unit===n.unit&&curQty(p)>=n.need)return;
      var c0=lineCost(it);if(!(c0>0))return;
      var row=AS.map(function(s){var bo=bestOfferAt(it,w,s);return bo?Math.max(0,c0*pfac(it.k,s)-bo.cost):0});
      if(row.some(function(v){return v>0}))lines.push(row);
    });
    OFM.rec[id]=subs.map(function(sub){var t=0;lines.forEach(function(row){var m=0;sub.forEach(function(s){var v=row[AS.indexOf(s)];if(v>m)m=v});t+=m});return t});
  });
  return{subs:subs,rec:OFM.rec,AS:AS};
}
function planOfferValue(ids,m){
  var best=-1,bi=0,fx=fixedN();
  m.subs.forEach(function(sub,j){var t=0;ids.forEach(function(id){t+=(m.rec[id]||[])[j]||0});t-=fx?0:MIN_EXTRA*(sub.length-1);if(t>best){best=t;bi=j}});
  return{v:Math.max(0,best),stores:m.subs[bi]};
}

/* ---------- tilbud: hvilken butik har flest af varerne ---------- */
function routeLine(items,w){
  var per={};
  items.forEach(function(it){activeOffers(w).forEach(function(o){if(offerMatch(o,it)){(per[o.store]=per[o.store]||{})[it.k+'_'+it.unit]=1}})});
  var arr=Object.keys(per).map(function(s){return{store:s,n:Object.keys(per[s]).length}}).sort(function(a,b){return b.n-a.n});
  if(!arr.length)return null;
  var first=arr[0],have=per[first.store],second=null;
  arr.slice(1).forEach(function(x){var extra=Object.keys(per[x.store]).filter(function(k){return !have[k]}).length;if(extra>=3&&(!second||extra>second.extra))second={store:x.store,extra:extra}});
  return{first:first,second:second,total:items.length};
}
