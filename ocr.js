/* Free cookbook reading: OCR in the browser (Tesseract.js, Danish) + a simple ingredient parser.
   Nothing is uploaded: the photo is read on the phone. Results always need a quick check. */
(function(root){
'use strict';
var UNIT={kg:['g',1000],g:['g',1],gr:['g',1],gram:['g',1],l:['ml',1000],liter:['ml',1000],dl:['ml',100],cl:['ml',10],ml:['ml',1],spsk:['ml',15],tsk:['ml',5],
  stk:['stk',1],fed:['stk',1],bdt:['stk',1],bundt:['stk',1],'dåse':['stk',1],'dåser':['stk',1],'dase':['stk',1],'daase':['stk',1],'däse':['stk',1],'dåsen':['stk',1],ds:['stk',1],pk:['stk',1],pakke:['stk',1],pakker:['stk',1],skive:['stk',1],skiver:['stk',1],
  knivspids:null,knsp:null,nip:null};
var SKIP=/^(salt|peber|vand|salt og peber|friskkværnet peber|friskkvaernet peber)\b/;
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
  n=n.replace(/\([^)]*\)/g,' ').replace(/\s[–—-]\s.*$/,'').replace(/,.*$/,'').replace(/[.;:]+$/,'').replace(/^(af|evt\.?|ca\.?)\s+/i,'').replace(/\s+/g,' ').trim().toLowerCase();
  return n;
}
function parseLine(line){
  var s=line.replace(/^[\s•·*▪●○\-–—]+/,'').trim();
  /* OCR often reads the half sign as a percent sign: "1% dl" and "11% dl" both mean 1½ dl */
  s=normFractions(s.replace(/^(\d)\d?%\s*(?=(?:dl|cl|ml|l|kg|g|spsk|tsk)\b)/i,'$1½ '));
  var m=s.match(/^(\d+\s+\d\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*([A-Za-zæøåäöüÆØÅ]+\.?)?\s*(.*)$/);
  if(!m)return null;
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
  var name=cleanName(rest);
  if(name.length<2||name.length>40||/^\d+$/.test(name))return null;
  if(SKIP.test(name))return null;
  /* step text in the method section: long sentence */
  if(name.split(' ').length>6||/[.!?]\s*[A-ZÆØÅ]/.test(rest))return null;
  var qq=q*conv[1];
  return{n:name,q:conv[0]==='stk'?Math.round(qq*2)/2||1:Math.round(qq*10)/10,u:conv[0]};
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
function fixNames(ings,known){
  if(!known||!known.length)return ings;
  var idx=known.map(function(k){return{k:k,l:loose(k)}});
  ings.forEach(function(g){
    var l=loose(g.n),hit=null,i;
    for(i=0;i<idx.length;i++){if(idx[i].l===l){hit=idx[i];break}}
    if(!hit&&l.length>=6){for(i=0;i<idx.length;i++){if(idx[i].l.length>=6&&lev(idx[i].l,l)<=1){hit=idx[i];break}}}
    if(hit)g.n=hit.k.toLowerCase();
  });
  return ings;
}
function parseText(text,known){
  var lines=String(text||'').split(/\r?\n/).map(function(l){return l.trim()}).filter(Boolean);
  var all=lines.join('\n');
  var iStart=-1,iEnd=lines.length;
  lines.forEach(function(l,i){if(iStart<0&&/^ingredienser\b/i.test(l))iStart=i});
  if(iStart>=0){for(var j=iStart+1;j<lines.length;j++){if(/^(fremgangsm|sådan gør|saadan goer|tilberedning|metode|instruktion|trin\s*1)/i.test(lines[j])){iEnd=j;break}}}
  var body=iStart>=0?lines.slice(iStart+1,iEnd):lines;
  var ings=[],seen={};
  body.forEach(function(l){var g=parseLine(l);if(g&&!seen[g.n]){seen[g.n]=1;ings.push(g)}});
  var head=iStart>=0?lines.slice(0,iStart):lines.slice(0,6),title='';
  for(var k=0;k<head.length;k++){
    var h=head[k];
    if(/\d{3,}/.test(h)||/^(ingredienser|side|tid|til\s+\d|\d)/i.test(h))continue;
    if((h.match(/[A-Za-zÆØÅæøå]/g)||[]).length<4||h.length>60)continue;
    title=h;break;
  }
  if(title&&title===title.toUpperCase())title=title.charAt(0)+title.slice(1).toLowerCase();
  var mm,minutes=null,servings=0;
  if((mm=all.match(/(\d{1,3})\s*(?:min\b|minutter)/i)))minutes=+mm[1];
  else if((mm=all.match(/(\d+(?:[.,]5)?)\s*(?:time|timer)\b/i)))minutes=Math.round(parseFloat(mm[1].replace(',','.'))*60);
  if((mm=all.match(/(\d{1,2})\s*(?:personer|pers\b|portioner|port\b)/i)))servings=+mm[1];
  return{name:title,minutes:minutes,servings:servings||0,ingredients:fixNames(ings,known)};
}
/* ---- browser part ---- */
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej({code:'unavailable'})};document.head.appendChild(s)})}
function prep(file){
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),im=new Image();
    im.onload=function(){
      var long=Math.max(im.width,im.height),s=long>2400?2400/long:long<1400?Math.min(2,1400/long):1;
      var c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
      var x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
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
function readRecipe(files,signal,known){
  var text='';
  return getWorker().then(function(w){
    var chain=Promise.resolve();
    files.forEach(function(f){
      chain=chain.then(function(){
        if(signal&&signal.aborted)throw{code:'cancelled'};
        return prep(f).then(function(b){return w.recognize(b)}).then(function(r){text+=r.data.text+'\n'});
      });
    });
    return chain;
  }).then(function(){
    var out=parseText(text,known);out.raw=text;return out;
  });
}
var api={readRecipe:readRecipe,parseText:parseText,parseLine:parseLine,loose:loose};
root.UgekurvOCR=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
