/* Free cookbook reading: OCR in the browser (Tesseract.js, Danish) + a simple ingredient parser.
   Nothing is uploaded: the photo is read on the phone. Results always need a quick check. */
(function(root){
'use strict';
var UNIT={kg:['g',1000],g:['g',1],gr:['g',1],gram:['g',1],l:['ml',1000],liter:['ml',1000],dl:['ml',100],cl:['ml',10],ml:['ml',1],di:['ml',100],mi:['ml',1],spsk:['ml',15],tsk:['ml',5],
  stk:['stk',1],fed:['stk',1],bdt:['stk',1],bundt:['stk',1],'dåse':['stk',1],'dåser':['stk',1],'dase':['stk',1],'daase':['stk',1],'däse':['stk',1],'dåsen':['stk',1],ds:['stk',1],pk:['stk',1],pakke:['stk',1],pakker:['stk',1],skive:['stk',1],skiver:['stk',1],
  'håndfuld':['stk',1],'håndfulde':['stk',1],handfuld:['stk',1],'händfuld':['stk',1],drys:['stk',1],stilk:['stk',1],stilke:['stk',1],kvist:['stk',1],kviste:['stk',1],
  knivspids:null,knsp:null,nip:null};
var SKIP=/^(vand|salt og peber|friskkværnet peber|friskkvaernet peber|salt og friskkværnet peber)\b/;
function toNum(s){
  s=String(s).trim();var m;
  if((m=s.match(/^(\d+)\s+(\d)\/(\d+)$/)))return +m[1]+(+m[2])/(+m[3]);
  if((m=s.match(/^(\d+)\/(\d+)$/)))return (+m[1])/(+m[2]);
  return parseFloat(s.replace(',','.'));
}
function normFractions(s){
  return s.replace(/(\d)\s*½/g,'$1.5').replace(/(\d)\s*¼/g,'$1.25').replace(/(\d)\s*¾/g,'$1.75').replace(/½/g,'0.5').replace(/¼/g,'0.25').replace(/¾/g,'0.75').replace(/⅓/g,'0.33').replace(/⅔/g,'0.67');
}
function cleanName(n){
  n=n.replace(/\s+(\+|eller)\s.*$/,'').replace(/^[^A-Za-zÆØÅæøåÄÖÜäöü]+/,'').replace(/^(øko|oko|økologisk[e]?|okologisk[e]?)\s+/i,'').replace(/\s+til\s+(stegning|servering|pynt|anretning|vending)\b.*$/i,'').replace(/\([^)]*\)/g,' ').replace(/\s[–—-]\s.*$/,'').replace(/,.*$/,'').replace(/[.;:]+$/,'').replace(/^(af|evt\.?|ca\.?)\s+/i,'').replace(/\s+/g,' ').trim().toLowerCase();
  return n;
}
var STOP=/^(og|en|et|i|med|til|af|fint|groft|evt|eller|ca|lidt|gerne|samt)(\s|$)/;
var UNITW=/^(spsk|tsk|sk|dl|di|cl|ml|kg|g|gr|dåse|dase|daase|fed|bdt|bundt|stk|pk|pakke|skiver?)\.?\s+(?=[A-Za-zæøåÆØÅ])/i;
function parseLine(line,inSec){
  var s=line.replace(/^[\s•·*▪●○\-–—|]+/,'').trim().replace(/^(ca\.?|cirka|evt\.?|eventuelt|gerne)\s+(?=[\d½¼¾])/i,'');
  /* OCR misreads in the amount: "l" or "I" for 1, "O" for 0 */
  s=s.replace(/^([0-9oOsSlI]{1,3})(?=\s*g\s+[a-zæøå])/,function(x){return /\d/.test(x)||x.length>1?x.replace(/[oO]/g,'0').replace(/[sS]/g,'5').replace(/[lI]/g,'1'):x}).replace(/^[lI|](?=\s*(?:\d|[½¼¾]|dl|di|cl|ml|kg|g|spsk|tsk|dåse|dase|fed|stk|bdt)\b)/,'1').replace(/^(\d+)[oO](?=\d|\s|g\b)/,'$10');
  /* italic g read as £/€ or 8/9/q after the number ("400 £g pasta", "150 8 sorte oliven"); ½ read as %, f, 72, Y2 */
  s=s.replace(/^(\d{1,4})\s*[£€]\s*g?\s+(?=[A-Za-zæøåÆØÅ])/,'$1 g ').replace(/^(\d{2,4})\s+(?:[389qg]|gs|g\.)\s+(?=[a-zæøå])/,'$1 g ');
  /* "3003 kyllingebryst" = 300 g: a round amount with the g read as 3, 8 or 9 glued to it */
  s=s.replace(/^((?:[1-9]\d?)?[05]0)[389]\s+(?=[a-zæøå]{3})/,'$1 g ');
  s=s.replace(/^(?:174|172|1%)\s+(?=(?:dl|l|tsk|spsk|kg|bundt|bdt|dåse)\b)/i,'1½ ');
  s=s.replace(/^(?:74|14|12|få|fa|Y2|V2|y2)\s+(?=(?:dl|l|tsk|spsk|kg|øko|oko|økologisk|citron|citroner|lime|appelsin|bundt|bdt|dåse|pk|pakke|liter)\b)/i,'½ ');
  s=s.replace(/^(?:%2|%|f|Y2|V2|y2|72|½)\s+(?=(?:dl|l|tsk|spsk|kg|øko|oko|økologisk|citron|citroner|lime|appelsin|bundt|bdt|dåse|pk|pakke|liter|løg|rødløg|agurk|peberfrugt|squash|kål|hvidkål|spidskål|blomkål|broccoli)\b)/i,'½ ');
  /* the amount was lost but the unit is there ("sk. tomatpuré", "dåse kidneybønner"): keep the ingredient with amount 1 */
  if(inSec&&UNITW.test(s)&&!/^\d/.test(s)){var um=s.match(UNITW);s='1 '+(um[1].toLowerCase()==='sk'?'spsk':um[1])+' '+s.slice(um[0].length)}
  /* OCR often reads the half sign as a percent sign: "1% dl" and "11% dl" both mean 1½ dl */
  s=s.replace(/^%[:.]?\s*(?=(?:dl|di|cl|ml|l|kg|g|spsk|tsk)\b)/i,'½ ');
  s=normFractions(s.replace(/^(\d)\d?%\s*(?=(?:dl|di|cl|ml|l|kg|g|spsk|tsk)\b)/i,'$1½ '));
  var m=s.match(/^(\d+\s+\d\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*([A-Za-zæøåäöüÆØÅ]+\.?)?\s*(.*)$/);
  if(!m){
    /* inside the ingredient list: a short line without amount ("olie til stegning", "friske krydderurter") */
    if(!inSec)return null;
    var letters=(s.match(/[A-Za-zÆØÅæøå]/g)||[]),caps=(s.match(/[A-ZÆØÅ]/g)||[]).length;
    if(letters.length>=4&&caps/letters.length>.6)return null;          /* a heading such as DRESSING */
    if(/-\s*$/.test(s))return null;
    if(/^[A-ZÆØÅ]{3,}\b/.test(s))return null;                        /* starts with a word in capitals: rest of a heading */
    var nm0=cleanName(s);
    if(/^(finthakket|hakket|groft hakket|presset|revet|fintrevet|i tern|i skiver|i både|skåret|udblødt|optøet|smeltet|til servering|til pynt)$/.test(nm0))return null;
    if(nm0.length<3||nm0.length>32||!/^[a-zæøåäöü][a-zæøåäöü\s-]*$/.test(nm0)||nm0.split(' ').length>3||SKIP.test(nm0))return null;
    if(STOP.test(nm0)||/^(ingredien|fremgang|tilbered|tid\b|personer|portioner)/.test(nm0))return null;
    return{n:nm0,q:1,u:'stk',guess:true};
  }
  var q=toNum(m[1]);if(!(q>0)||q>5000)return null;
  var u=(m[2]||'').toLowerCase().replace(/\.$/,''),rest=m[3]||'';
  var conv,gl;
  if(u&&!Object.prototype.hasOwnProperty.call(UNIT,u)&&(gl=u.match(/^(dl|cl|ml|kg|spsk|tsk)([a-zæøå]{3,})$/))){rest=(gl[2]+' '+rest).trim();u=gl[1]}
  if(u&&Object.prototype.hasOwnProperty.call(UNIT,u)){
    conv=UNIT[u];if(conv===null)return null;
  }else{
    if(u)rest=(m[2]+' '+rest).trim();
    conv=['stk',1];
  }
  /* two columns read as one line ("400 g pasta Kog pastaen efter ..."): the ingredient ends where a capitalised sentence starts */
  var cut=rest.match(/^(.*?\S)\s+[A-ZÆØÅ][a-zæøå]+/);
  if(cut&&cut[1].split(/\s+/).length<=4&&!/[A-ZÆØÅ]/.test(cut[1].slice(1)))rest=cut[1];
  var name=cleanName(rest);
  name=name.replace(/(\D)\d(\D)/g,'$1$2').trim();
  name=name.replace(/(\s+[a-zæøå])+$/,'').trim();
  var junk=/[^a-zæøåäöüé\s-]/.test(name);if(junk)name=name.replace(/[^a-zæøåäöüé\s-]+/g,' ').replace(/\s+/g,' ').trim();   /* stray signs: kept only if it then matches a known food */
  if((name.length<3&&!/^(æg|is)$/.test(name))||name.length>40||/^\d+$/.test(name)||STOP.test(name))return null;
  if(SKIP.test(name))return null;
  if(/^(personer|person|pers|portioner|portion|port|minutter|minut|min|timer|time)$/.test(name))return null;
  /* step text in the method section: long sentence */
  if(name.split(' ').length>6||/[.!?]\s*[A-ZÆØÅ]/.test(rest))return null;
  var qq=q*conv[1];
  var o={n:name,q:conv[0]==='stk'?Math.round(qq*2)/2||1:Math.round(qq*10)/10,u:conv[0]};if(junk)o.junk=true;return o;
}
function loose(s){
  return String(s||'').toLowerCase().replace(/aa/g,'a').replace(/ae/g,'a').replace(/oe/g,'o').replace(/[øöòóô@]/g,'o').replace(/[æäàáâ]/g,'a').replace(/[åãā]/g,'a').replace(/[üúùû]/g,'u').replace(/[éèêë]/g,'e').replace(/[^a-z]/g,'');
}
function lev(a,b){
  if(a===b)return 0;if(Math.abs(a.length-b.length)>1)return 2;
  var m=a.length,n=b.length,d=[],i,j;
  for(i=0;i<=m;i++){d[i]=[i]}for(j=1;j<=n;j++)d[0][j]=j;
  for(i=1;i<=m;i++)for(j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[m][n];
}
function shape(s){return loose(s).replace(/rn/g,'m').replace(/cl/g,'d').replace(/[i1]/g,'l').replace(/[e0]/g,'o').replace(/4/g,'a').replace(/5/g,'s').replace(/8/g,'b')}
function lev2(a,b){
  if(a===b)return 0;if(Math.abs(a.length-b.length)>2)return 3;
  var m=a.length,n=b.length,d=[],i,j;
  for(i=0;i<=m;i++){d[i]=[i]}for(j=1;j<=n;j++)d[0][j]=j;
  for(i=1;i<=m;i++)for(j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[m][n];
}
function fixNames(ings,known){
  if(!known||!known.length)return ings.filter(function(g){return (!g.guess||g.n.split(' ').length>=2)&&!g.junk});
  var idx=known.map(function(k){return{k:k,l:loose(k),s:shape(k)}});
  ings.forEach(function(g){
    var l=loose(g.n),hit=null,i;
    for(i=0;i<idx.length;i++){if(idx[i].l===l){hit=idx[i];break}}
    if(!hit&&l.length>=3){var sh=shape(g.n);for(i=0;i<idx.length;i++){if(idx[i].s===sh){hit=idx[i];break}}}
    if(!hit&&l.length>=5){var sh2=shape(g.n),bd=9;for(i=0;i<idx.length;i++){if(idx[i].s.length<5)continue;var d2=lev2(idx[i].s,sh2),lm=sh2.length>=7?2:1;if(d2<=lm&&d2<bd){bd=d2;hit=idx[i]}}}
    if(!hit&&l.length>=5){var bd=9;for(i=0;i<idx.length;i++){var L2=idx[i].l;if(L2.length<5)continue;var dd=lev2(L2,l),lim=l.length>=9?2:1;if(dd<=lim&&dd<bd){bd=dd;hit=idx[i]}}}
    /* "bulgur køle af", "kyllingebryst kog bulguren": text from the next column glued on; keep the known food at the start */
    if(!hit&&g.n.split(' ').length>=2){var wd=g.n.split(' ');for(var pl=Math.min(3,wd.length-1);pl>=1&&!hit;pl--){var pre=loose(wd.slice(0,pl).join(' '));for(i=0;i<idx.length;i++){if(idx[i].l===pre&&pre.length>=3){hit=idx[i];break}}}}
    if(hit){g.n=hit.k.toLowerCase();g.known=true}
  });
  /* a line without amount is only kept when it is a known food or reads like one (two words or more) */
  ings=ings.filter(function(g){return (!g.guess||g.known||g.n.split(' ').length>=2)&&(!g.junk||g.known)});
  ings.forEach(function(g){
    if(g.u!=='stk'||g.q<5)return;
    var m=g.n.match(/^g([a-zæøå]{3,})$/),l0=loose(g.n),j;
    if(!m)return;
    for(j=0;j<idx.length;j++){if(idx[j].l===l0)return}
    var l1=loose(m[1]);
    for(j=0;j<idx.length;j++){if(idx[j].l===l1){g.n=idx[j].k.toLowerCase();g.u='g';return}}
  });
  return ings;
}
function findPage(lines){
  var cand=lines.slice(0,2).concat(lines.slice(-3)),i,m,n;
  for(i=0;i<cand.length;i++){
    /* a line that is only the page number: "47", "— 47 —", "Side 47". "3." and "3)" are step numbers, not pages. */
    m=cand[i].match(/^[^\w.)]*(?:side\s+)?(\d{1,3})\s*[^\w.)]*$/i);
    if(m){n=+m[1];if(n>=1&&n<=999)return n}
  }
  for(i=0;i<cand.length;i++){
    /* "47 · Hverdagsretter" or "Hverdagsretter · 47" in a running head or foot */
    m=cand[i].match(/^(\d{1,3})\s*[·•|–—]\s*[A-Za-zÆØÅæøå]/)||cand[i].match(/[A-Za-zÆØÅæøå]\s*[·•|–—]\s*(\d{1,3})$/);
    if(m){n=+m[1];if(n>=1&&n<=999)return n}
  }
  return 0;
}
function isIngHead(l){var w=loose(l);return (w.length<16||(w.length<34&&/^[il]?n?gredi[eao]ns[eao]r/.test(w)))&&/^[il]?n?gredi[eao]n/.test(w)}
function isMethodHead(l){var w=loose(l);return w.length<22&&(/^fr[ea]mgang/.test(w)||/^sa+dan(gor|gar)/.test(w)||/^(tilberedning|metode|instruktion|trin1|saadangoer)/.test(w))}
/* several OCR passes of the same photo: one list, the first pass decides the order, a real amount beats a guessed one */
function mergeIngs(lists){
  var out=[];
  lists.forEach(function(list,pi){list.forEach(function(g){
    var l=loose(g.n),hit=null;
    for(var i=0;i<out.length;i++){var o=loose(out[i].n),sh=Math.min(o.length,l.length)/Math.max(o.length,l.length);if(o===l||(l.length>=6&&o.length>=6&&lev(o,l)<=1&&o.slice(0,3)===l.slice(0,3))){hit=i;break}}
    if(hit===null){if(pi>0&&g.guess)return;out.push(g)}
    else if((out[hit].guess&&!g.guess)||(/[^a-zæøåäöü\s-]/.test(out[hit].n)&&!/[^a-zæøåäöü\s-]/.test(g.n))||(out[hit].u==='stk'&&g.u!=='stk'&&!g.guess&&out[hit].q===g.q))out[hit]=g;
  })});
  return out;
}
function parseMulti(texts,known){
  var parts=texts.map(function(t){return parseText(t,known)}),best=parts[0];
  parts.forEach(function(p){if(!best.name&&p.name)best.name=p.name;if(!best.page&&p.page)best.page=p.page;if(!best.minutes&&p.minutes)best.minutes=p.minutes;if(!best.servings&&p.servings)best.servings=p.servings});
  return{name:best.name,minutes:best.minutes,servings:best.servings,page:best.page,ingredients:fixNames(mergeIngs(parts.map(function(p){return p.ingredients})),known)};
}
function parseText(text,known){
  var lines=String(text||'').split(/\r?\n/).map(function(l){return l.trim()}).filter(Boolean);
  var all=lines.join('\n');
  var iStart=-1,iEnd=lines.length;
  lines.forEach(function(l,i){if(iStart<0&&isIngHead(l))iStart=i});
  if(iStart>=0){for(var j=iStart+1;j<lines.length;j++){if(isMethodHead(lines[j])){iEnd=j;break}}}
  var body=iStart>=0?lines.slice(iStart+1,iEnd):lines;
  var ings=[],seen={};
  body.forEach(function(l){var g=parseLine(l,iStart>=0);if(!g)return;
    var same=ings.filter(function(x){return x.n===g.n&&x.u===g.u})[0];
    if(same){if(!g.guess){if(same.guess){same.q=g.q;same.guess=false}else same.q=Math.round((same.q+g.q)*100)/100}return}
    seen[g.n]=1;ings.push(g)});
  /* "salt og peber" without an amount: still part of the dish, listed with a pinch so the list is complete */
  body.forEach(function(l){var w=l.toLowerCase();if(w.split(/\s+/).length>6||/^\s*[\d½¼¾]/.test(w))return;
    if(/\bsalt\b/.test(w)&&!seen.salt){seen.salt=1;ings.push({n:'salt',q:1,u:'g',guess:true,known:true})}
    if(/\bpeber\b(?!frugt)/.test(w)&&!/peberfrugt/.test(w)&&!seen.peber){seen.peber=1;ings.push({n:'peber',q:1,u:'g',guess:true,known:true})}});
  var head=iStart>=0?lines.slice(0,iStart):lines.slice(0,6),title='';
  for(var k=0;k<head.length;k++){
    var h=head[k];
    if(/\d{3,}/.test(h)||/^(ingredienser|side|tid|til\s+\d|\d)/i.test(h))continue;
    if((h.match(/[A-Za-zÆØÅæøå]/g)||[]).length<4||h.length>60)continue;
    title=h;break;
  }
  title=title.replace(/^[^A-Za-zÆØÅæøå0-9]*[a-zæøå|]\s+(?=[A-ZÆØÅ]{2})/,'').replace(/^[^A-Za-zÆØÅæøå0-9]+/,'');
  if(title&&title===title.toUpperCase())title=title.charAt(0)+title.slice(1).toLowerCase();
  var mm,minutes=null,servings=0;
  if((mm=all.match(/(\d{1,3})\s*(?:min\b|minutter)/i)))minutes=+mm[1];
  else if((mm=all.match(/(\d+(?:[.,]5)?)\s*(?:time|timer)\b/i)))minutes=Math.round(parseFloat(mm[1].replace(',','.'))*60);
  if((mm=all.match(/(\d{1,2})\s*(?:personer|pers\b|portioner|port\b)/i)))servings=+mm[1];
  return{name:title,minutes:minutes,servings:servings||0,page:findPage(lines),ingredients:fixNames(ings,known)};
}
/* common Danish ingredients: used to correct misread words */
var COMMON='salt,peber,bulgur,fetaost,græskarkerner,cherrytomater,oliven,sorte oliven,agurk,ananas,appelsin,asparges,aubergine,avocado,bacon,bagepulver,balsamico,banan,basilikum,bladselleri,blomkål,blåbær,bouillon,broccoli,brød,bulgur,butterdej,citron,chili,chiliflager,cremefraiche,dild,eddike,estragon,feta,fløde,forårsløg,frikadellefars,gær,grønkål,gulerødder,gulerod,hakket oksekød,hakket svinekød,hakket kalkun,hakkede tomater,havregryn,hasselnødder,honning,hvedemel,hvidløg,hvidvin,hytteost,ingefær,kanel,kapers,karry,kartofler,kidneybønner,kikærter,kokosmælk,koriander,kyllingebryst,kyllingelår,kylling,laks,laksfilet,lime,linser,løg,majs,mango,mel,mozzarella,muskatnød,mælk,mynte,nudler,oksekød,oksefond,olie,olivenolie,oregano,ost,paprika,parmesan,pasta,peberfrugt,persille,pinjekerner,piskefløde,porre,purløg,radiser,rejer,ris,rosmarin,rucola,rugbrød,rødbeder,rødløg,rødvin,rørsukker,sennep,selleri,skinke,smør,sojasauce,spidskål,spidskommen,spinat,squash,sukker,svinekød,tomater,tomatpuré,timian,torsk,tortillas,tun,valnødder,vaniljesukker,yoghurt,æble,æg,ærter'.split(',');
function commonKnown(k){var seen={},out=[];(k||[]).concat(COMMON).forEach(function(n){n=String(n||'').trim();var l=n.toLowerCase();if(n&&!seen[l]){seen[l]=1;out.push(n)}});return out}
/* ---- browser part ---- */
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej({code:'unavailable'})};document.head.appendChild(s)})}
function prep(file,rot,max){
  rot=rot||0;max=max||3200;
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),im=new Image();
    im.onload=function(){
      var long=Math.max(im.width,im.height),s=long>max?max/long:long<1600?Math.min(2,1600/long):1;
      var w0=Math.round(im.width*s),h0=Math.round(im.height*s),side=rot===90||rot===270;
      var c=document.createElement('canvas');c.width=side?h0:w0;c.height=side?w0:h0;
      var x=c.getContext('2d');
      /* photo taken sideways or upside down: turn it before reading */
      if(rot){x.translate(c.width/2,c.height/2);x.rotate(rot*Math.PI/180);x.drawImage(im,-w0/2,-h0/2,w0,h0);x.setTransform(1,0,0,1,0,0)}
      else x.drawImage(im,0,0,w0,h0);
      URL.revokeObjectURL(url);
      try{var d=x.getImageData(0,0,c.width,c.height),p=d.data,lo=255,hi=0,i,g;
        for(i=0;i<p.length;i+=4){g=(p[i]*.3+p[i+1]*.59+p[i+2]*.11);p[i]=p[i+1]=p[i+2]=g;if(g<lo)lo=g;if(g>hi)hi=g}
        var k=hi>lo+20?255/(hi-lo):1;for(i=0;i<p.length;i+=4){g=(p[i]-lo)*k;p[i]=p[i+1]=p[i+2]=g<0?0:g>255?255:g}
        x.putImageData(d,0,0)}catch(e){}
      c.toBlob(function(b){b?res(b):rej({code:'image_rejected'})},'image/png');
    };
    im.onerror=function(){URL.revokeObjectURL(url);rej({code:'image_rejected'})};im.src=url;
  });
}
var worker=null;
function getWorker(){
  if(worker)return worker;
  worker=(root.Tesseract?Promise.resolve():loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js')).then(function(){
    return root.Tesseract.createWorker('dan');
  }).catch(function(e){worker=null;throw(e&&e.code?e:{code:'unavailable'})});
  return worker;
}
/* Page segmentation: 3 = normal columns, 11 = sparse text (finds the lines when photo blocks, tinted panels or uneven light confuse the layout) */
function recog(w,blob,psm){
  var p;try{p=Promise.resolve(w.setParameters({tessedit_pageseg_mode:String(psm)}))}catch(e){p=Promise.resolve()}
  return p.catch(function(){}).then(function(){return w.recognize(blob)});
}
/* How good does one reading look? Number of ingredient lines the parser understands, then Tesseract's own confidence. */
function quality(text,conf,known){var n=parseText(text,known).ingredients.filter(function(g){return !g.guess}).length;return n*100+(conf||0)}
function readRecipe(files,signal,known,onStep){
  var texts=[];known=commonKnown(known);
  var step=function(t){if(onStep)try{onStep(t)}catch(e){}};
  var stop=function(){if(signal&&signal.aborted)throw{code:'cancelled'}};
  return getWorker().then(function(w){
    var chain=Promise.resolve();
    files.forEach(function(f,fi){
      var mine=[];
      chain=chain.then(function(){
        stop();step('Læser billede'+(files.length>1?' '+(fi+1)+' af '+files.length:'')+'…');
        /* 6 = one block of text: keeps an amount and its ingredient on the same line, also in a two-column list (best for close-ups) */
        return prep(f,0).then(function(b){return recog(w,b,6).then(function(r){return{b:b,r:r}})})
          /* phones can run out of memory on a big photo: try once more with a smaller copy */
          .catch(function(e){if(e&&e.code==='cancelled')throw e;step('Prøver med et mindre billede…');return prep(f,0,1800).then(function(b){return recog(w,b,6).then(function(r){return{b:b,r:r}})})});
      }).then(function(o){
        stop();
        var q0=quality(o.r.data.text,o.r.data.confidence,known);
        if(q0>=300)return o;
        /* few lines understood: read the normal page layout too before deciding the photo is turned */
        return recog(w,o.b,3).then(function(r3){
          var q3=quality(r3.data.text,r3.data.confidence,known);o.r3=r3;
          if(Math.max(q0,q3)>=300)return o;
          step('Prøver at dreje billedet…');
          var best={q:Math.max(q0,q3),o:o},rots=[90,270,180],i=0;
          var next=function(){
            if(i>=rots.length)return best.o;
            var rot=rots[i++];stop();
            return prep(f,rot).then(function(b){return recog(w,b,6).then(function(r){var q=quality(r.data.text,r.data.confidence,known);if(q>=300&&q>best.q+150)best={q:q,o:{b:b,r:r}};return next()})});
          };
          return next();
        });
      }).then(function(o){
        mine.push(o.r.data.text);stop();
        step('Læser igen med anden opsætning…');
        /* 3 = normal page layout with columns; 11 = scattered text. Each finds lines the others miss; the parser merges them. */
        return (o.r3?Promise.resolve(o.r3):recog(w,o.b,3)).then(function(r){mine.push(r.data.text);
          if(parseMulti(mine,known).ingredients.length>=8)return;
          stop();return recog(w,o.b,11).then(function(r2){mine.push(r2.data.text)},function(){});
        },function(){});
      }).then(function(){texts=texts.concat(mine)});
    });
    return chain;
  }).then(function(){
    var out=parseMulti(texts,known);out.raw=texts.join('\n----\n');return out;
  });
}
var api={readRecipe:readRecipe,quality:quality,parseText:parseText,parseMulti:parseMulti,commonKnown:commonKnown,parseLine:parseLine,loose:loose,findPage:findPage,prep:prep};
root.UgekurvOCR=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
