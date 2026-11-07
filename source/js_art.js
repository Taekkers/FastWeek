/* ---------- dish art: drawn plates (no external images) ---------- */
var _gid=0;
function hashStr(s){var h=2166136261;s=String(s||'');for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){var a=seed>>>0||1;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
var TABLES={linen:['#EADFCB','#D9C9AC'],sage:['#C9D6C6','#AFC1AC'],clay:['#E2C2A8','#CE9F80'],slate:['#46514C','#2F3835'],stone:['#DAD4C8','#C3BAA8'],wheat:['#ECD59C','#DDB96B'],plum:['#CBB7C4','#B297A9']};
function artKey(r){
  var n=String((r&&r.name)||'').toLowerCase(),prot=(r&&r.prot)||'',ing=((r&&r.ing)||[]).map(function(g){return String(g.n).toLowerCase()}).join(' ');
  var has=function(s){return ing.indexOf(s)>-1};
  if(/burger/.test(n))return{k:'burger',veg:/veget/.test(n)||prot==='vegetar'};
  if(/shakshuka/.test(n))return{k:'shak'};
  if(/pytt/.test(n))return{k:'hash'};
  if(/fritter/.test(n))return{k:'fritter'};
  if(/quesadilla/.test(n))return{k:'quesa'};
  if(/ovnbagt blomkål|bagt blomkål|blomkål.*ovn/.test(n))return{k:'roast'};
  if(/boller|frikadelle|kødbolle/.test(n))return{k:'balls'};
  if(/enchilada/.test(n))return{k:'enchilada'};
  if(/taco|wrap|fajita|quesadilla/.test(n))return{k:'taco'};
  if(/lasagne/.test(n))return{k:'lasagne'};
  if(/salat/.test(n))return{k:'salad'};
  if(/suppe/.test(n))return{k:'soup',sauce:has('hakkede tomater')?'red':has('røde linser')?'gold':'cream',crout:/rugbrød/.test(ing)||/crouton/.test(n)};
  if(/wok|nudl/.test(n))return{k:'wok'};
  if(/boller|frikadelle|kødbolle/.test(n))return{k:'balls'};
  if(/torsk|kuller|rødspætte/.test(n))return{k:'fish',cod:true};
  if(/laks|fisk/.test(n)||prot==='fisk')return{k:'fish',cod:has('torskefilet')};
  if(/pasta|spaghetti|penne|tagliatelle/.test(n))return{k:'pasta',sauce:(has('hakkede tomater')||has('tomatpuré'))&&!/svamp/.test(n)?'red':'cream',meat:has('hakket')||has('salsiccia')||has('bacon')};
  if(/bagt kylling|hel kylling|helstegt|steg/.test(n)||has('hel kylling'))return{k:'chicken'};
  if(/kål|gryde.*(okse|hakket)|hakket/.test(n)&&(prot==='okse'||prot==='svin'))return{k:'skillet'};
  if(/dahl|gryde|linse|kikærte/.test(n))return{k:'bowl',naan:has('naanbrød')};
  if(/karry|kokosris|ris\b/.test(n)||has('ris'))return{k:'rice',egg:/spejlæg/.test(n)||has('æg')&&/kokosris/.test(n),chick:prot==='kylling'};
  if(/marry|kylling/.test(n))return{k:'pasta',sauce:'cream',meat:true};
  if(prot==='okse'||prot==='svin')return{k:'skillet'};
  if(prot==='vegetar'||prot==='aeg')return{k:'bowl'};
  return{k:'plain'};
}
var TABLE_FOR={pasta:'wheat',rice:'clay',fish:'slate',burger:'linen',taco:'clay',lasagne:'stone',soup:'sage',salad:'sage',chicken:'wheat',skillet:'stone',bowl:'plum',enchilada:'linen',wok:'slate',balls:'clay',plain:'linen'};
function dots(R,n,cx,cy,rad,fn){var o='';for(var i=0;i<n;i++){var a=R()*6.2832,d=Math.sqrt(R())*rad;o+=fn(cx+Math.cos(a)*d,cy+Math.sin(a)*d,R)}return o}
function leaf(x,y,a,s,c){return '<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="'+(3.2*s).toFixed(1)+'" ry="'+(1.6*s).toFixed(1)+'" transform="rotate('+a.toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="'+c+'"/>'}
function sceneInner(a,R){
  var k=a.k,o='';
  if(k==='pasta'){
    var cream=a.sauce!=='red';
    for(var i=0;i<7;i++){var rx=10+i*3.8,ry=8+i*3.1;o+='<ellipse cx="60" cy="60" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+'" transform="rotate('+(i*37+R()*20).toFixed(0)+' 60 60)" fill="none" stroke="'+(i%2?'#E9C466':'#F0D07C')+'" stroke-width="3.1" stroke-linecap="round" stroke-dasharray="'+(18+R()*20).toFixed(0)+' '+(3+R()*5).toFixed(0)+'"/>'}
    o+='<ellipse cx="60" cy="60" rx="14" ry="12" fill="'+(cream?'#F3E3B7':'#C23B25')+'"/><ellipse cx="57" cy="57" rx="8" ry="6" fill="'+(cream?'#FAF0D2':'#D9503A')+'"/>';
    o+=dots(R,a.meat?9:5,60,60,12,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(a.meat?2.1:1.4)+'" fill="'+(cream?'#B9866A':'#7A3320')+'"/>'});
    o+=dots(R,10,60,60,14,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r=".9" fill="#FFF6D6"/>'});
    o+=leaf(66,53,-30,1.7,'#3F8A4B')+leaf(55,66,40,1.5,'#4C9A55')+leaf(63,66,200,1.2,'#2F7A40');
  }else if(k==='rice'){
    o+='<ellipse cx="46" cy="62" rx="19" ry="17" fill="#EFEBDD"/>';
    o+=dots(R,70,46,62,17,function(x,y,R){return '<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="2.1" ry="1" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#FFFEF8" stroke="#E5DFC9" stroke-width=".3"/>'});
    o+='<path d="M64 44c10-5 24 0 25 13 1 13-9 22-21 20-12-2-18-14-12-24 2-4 5-7 8-9z" fill="#E08E2B"/><path d="M68 50c7-3 15 1 16 9 1 8-6 14-14 12-8-1-11-9-8-15 1-3 3-5 6-6z" fill="#EDA23F"/>';
    o+=dots(R,a.chick?5:4,76,60,10,function(x,y,R){return a.chick?'<rect x="'+(x-2.6).toFixed(1)+'" y="'+(y-2).toFixed(1)+'" width="5.4" height="4.2" rx="1.6" transform="rotate('+(R()*80).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#F6E4BE"/>':'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.3" fill="#F26B21"/>'});
    o+=dots(R,5,76,60,11,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="1.5" fill="#6BAA4E"/>'});
    if(a.egg)o+='<ellipse cx="58" cy="46" rx="9" ry="7" fill="#FFFDF5" stroke="#EDE6D2" stroke-width=".5"/><circle cx="58" cy="46" r="3.4" fill="#F5B72C"/><circle cx="57" cy="45" r="1" fill="#FFE08A"/>';
    o+=leaf(70,50,-20,1.5,'#3F8A4B')+leaf(82,64,30,1.4,'#4C9A55')+leaf(74,70,100,1.3,'#2F7A40');
  }else if(k==='fish'){
    var cod=!!a.cod,c1=cod?'#F4F0E4':'#F27F58',c2=cod?'#E3DCC8':'#F9B196',c3=cod?'#D8CFB6':'#D95F3B';
    o+='<g transform="rotate(-14 60 58)"><rect x="32" y="45" width="56" height="24" rx="10" fill="'+c3+'"/><rect x="32" y="44" width="56" height="21" rx="10" fill="'+c1+'"/>';
    for(var j=0;j<6;j++)o+='<path d="M'+(40+j*8)+' 47q4 8 -2 16" fill="none" stroke="'+c2+'" stroke-width="1.8" stroke-linecap="round"/>';
    o+='</g>';
    o+='<g>'+dots(R,16,42,78,11,function(x,y,R){return leaf(x,y,R()*180,1.4+R(),R()<.5?'#5C9A48':'#7DB85A')})+'</g>';
    o+='<ellipse cx="82" cy="77" rx="6" ry="4.3" fill="#E8C46F"/><ellipse cx="73" cy="82" rx="5.5" ry="4" fill="#EFCF80"/><ellipse cx="88" cy="70" rx="4" ry="3" fill="#E1B95C"/>';
    o+='<path d="M76 38a9 9 0 0 1 18 0z" transform="rotate(20 85 40)" fill="#F4D547"/><path d="M78 38a7 7 0 0 1 14 0z" transform="rotate(20 85 40)" fill="#FBE98A"/>';
    o+='<path d="M45 40l3-9M49 40l1-10M53 41l-2-9" stroke="#3F8A4B" stroke-width="1" stroke-linecap="round"/>';
  }else if(k==='burger'){
    o+='<rect x="32" y="71" width="56" height="9" rx="4.5" fill="#CF9446"/><rect x="32" y="64" width="56" height="9" rx="3" fill="'+(a.veg?'#8E2F46':'#5A3828')+'"/>';
    o+='<path d="M31 64h58l-3 6-6-3-6 7-6-7-6 7-6-7-6 7-6-7z" fill="#F2C230"/>';
    o+='<path d="M30 60q5-6 10 0t10 0t10 0t10 0t10 0t8 0v6H30z" fill="#6DB048"/><rect x="36" y="56" width="48" height="4" rx="2" fill="#D6402F"/>';
    o+='<path d="M31 56c0-18 12-26 29-26s29 8 29 26z" fill="#DDA054"/><path d="M38 40c6-7 16-9 25-8" stroke="#F0C27E" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    o+=dots(R,12,60,44,20,function(x,y,R){return y<54?'<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="1.6" ry=".8" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#FFF2D2"/>':''});
    o+='<g stroke="#F0CC55" stroke-width="2.6" stroke-linecap="round"><path d="M92 86l6-10M97 87l4-10M87 88l7-9"/></g>';
  }else if(k==='taco'){
    o+='<g transform="translate(60 62) scale(.78) translate(-60 -60)">';
    [[44,66,-8],[76,60,8]].forEach(function(t){
      o+='<g transform="rotate('+t[2]+' '+t[0]+' '+t[1]+')"><path d="M'+(t[0]-24)+' '+t[1]+'a24 24 0 0 1 48 0z" fill="#E9C06B"/><path d="M'+(t[0]-21)+' '+t[1]+'a21 21 0 0 1 42 0z" fill="#F3D78E"/>';
      o+='<path d="M'+(t[0]-20)+' '+(t[1]-2)+'q4-9 8-2t8-1t8 1t8-2t8 2v4h-40z" fill="#6DB048"/>';
      o+=dots(R,5,t[0],t[1]-6,12,function(x,y){return '<rect x="'+(x-2.4).toFixed(1)+'" y="'+(y-1.8).toFixed(1)+'" width="5" height="3.6" rx="1.4" fill="#F1DDB5"/>'});
      o+=dots(R,4,t[0],t[1]-6,11,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="1.9" fill="#D6402F"/>'});
      o+=dots(R,5,t[0],t[1]-6,12,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="1.1" fill="#F6C437"/>'});
      o+='<ellipse cx="'+(t[0]+6)+'" cy="'+(t[1]-7)+'" rx="5" ry="3" fill="#8DBB45"/></g>';
    });
    o+='<path d="M86 82a9 9 0 0 0 16 0z" transform="rotate(-10 94 84)" fill="#9BC53D"/></g>';
  }else if(k==='lasagne'){
    o+='<path d="M30 52l12-9h50l-12 9z" fill="#F1C14C"/><rect x="30" y="52" width="50" height="8" fill="#EFC24E"/><path d="M80 52l12-9v26l-12 9z" fill="#D9A23A"/>';
    var bands=[['#F1C14C',8],['#B5412D',7],['#F2E0A8',4],['#FAF2DA',5],['#B5412D',7],['#F2E0A8',4],['#FAF2DA',3],['#E8D18F',4]],y=52;
    bands.forEach(function(b){o+='<rect x="30" y="'+y+'" width="50" height="'+b[1]+'" fill="'+b[0]+'"/>';y+=b[1]});
    o=o.replace('<rect x="30" y="52" width="50" height="8" fill="#EFC24E"/>','');
    o+=dots(R,14,56,50,18,function(x,y,R){return '<ellipse cx="'+x.toFixed(1)+'" cy="'+(y*0.2+42).toFixed(1)+'" rx="2.4" ry="1" fill="#C98322"/>'}).replace(/cy="(\d+\.\d)"/g,'cy="$1"');
    o+=leaf(52,46,-10,2,'#3F8A4B')+leaf(58,48,40,1.6,'#4C9A55');
    o+='<path d="M80 52l12-9v26l-12 9z" fill="rgba(0,0,0,.08)"/>';
  }else if(k==='soup'||k==='bowl'){
    var broth=k==='bowl'?'#D9702C':a.sauce==='red'?'#D2552B':a.sauce==='gold'?'#E3A83B':'#EDDFC0';
    o+='<circle cx="60" cy="60" r="34" fill="#C9D1CB"/><circle cx="60" cy="60" r="31" fill="#EEF0EA"/><circle cx="60" cy="60" r="27.5" fill="'+broth+'"/><circle cx="52" cy="52" r="12" fill="rgba(255,255,255,.14)"/>';
    if(k==='bowl'){
      o+=dots(R,10,60,60,22,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.8" fill="#EDCB8A"/>'});
      o+=dots(R,7,60,60,21,function(x,y,R){return '<rect x="'+(x-2).toFixed(1)+'" y="'+(y-2).toFixed(1)+'" width="4" height="4" rx=".8" transform="rotate('+(R()*80).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#F28A2E"/>'});
      o+='<path d="M52 66q8-8 18-2" stroke="#FAF7EC" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="62" cy="58" r="4.5" fill="#FAF7EC"/>';
      if(a.naan)o+='<path d="M86 84l-4-16a20 20 0 0 1 14 12z" fill="#E7C98C" stroke="#CFA45E" stroke-width=".8"/>';
    }else{
      o+=dots(R,12,60,60,21,function(x,y,R){var t=R();return t<.4?'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.8" fill="#F28A2E"/>':t<.7?'<rect x="'+(x-2.4).toFixed(1)+'" y="'+(y-1.8).toFixed(1)+'" width="5" height="3.6" rx="1.4" fill="#F4E3BE"/>':'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="1.8" fill="#6BAA4E"/>'});
      o+='<path d="M46 62q10-10 24-2" stroke="#FFF9EA" stroke-width="3" fill="none" stroke-linecap="round"/>';
      if(a.crout)o+=dots(R,5,60,60,19,function(x,y,R){return '<rect x="'+(x-3).toFixed(1)+'" y="'+(y-3).toFixed(1)+'" width="6" height="6" rx="1" transform="rotate('+(R()*80).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#5B3C27"/>'});
    }
    o+=leaf(66,56,-20,1.6,'#3F8A4B')+leaf(56,66,35,1.4,'#4C9A55')+leaf(70,66,160,1.2,'#2F7A40');
  }else if(k==='salad'){
    o+=dots(R,26,60,60,24,function(x,y,R){return leaf(x,y,R()*180,2+R()*1.6,['#6DB048','#8CC85E','#4F9440','#A7D273'][Math.floor(R()*4)])});
    o+=dots(R,5,60,60,18,function(x,y,R){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4" fill="none" stroke="#9E3F7C" stroke-width="1.2"/>'});
    o+=dots(R,5,60,58,16,function(x,y,R){return '<rect x="'+(x-5).toFixed(1)+'" y="'+(y-2.4).toFixed(1)+'" width="10" height="4.8" rx="2.4" transform="rotate('+(R()*140-70).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#E6BE80"/>'});
    o+=dots(R,16,60,60,22,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r=".9" fill="#FFF3D2"/>'});
    o+='<path d="M82 78a8 8 0 0 0 14 0z" fill="#9BC53D"/>';
  }else if(k==='chicken'){
    o+='<ellipse cx="60" cy="58" rx="22" ry="16" transform="rotate(-12 60 58)" fill="#B96A22"/><ellipse cx="58" cy="54" rx="18" ry="11" transform="rotate(-12 58 54)" fill="#D58B33"/><ellipse cx="52" cy="50" rx="8" ry="4" transform="rotate(-20 52 50)" fill="rgba(255,236,190,.55)"/>';
    o+='<ellipse cx="41" cy="72" rx="8" ry="4" transform="rotate(35 41 72)" fill="#C77A2E"/><ellipse cx="78" cy="70" rx="8" ry="4" transform="rotate(-30 78 70)" fill="#C77A2E"/>';
    o+=dots(R,6,60,66,26,function(x,y,R){return '<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="5.2" ry="4" fill="'+(R()<.5?'#E8B54B':'#EFC766')+'"/>'});
    o+=dots(R,4,60,60,28,function(x,y,R){return '<rect x="'+(x-5).toFixed(1)+'" y="'+(y-1.6).toFixed(1)+'" width="10" height="3.2" rx="1.6" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#F28A2E"/>'});
    o+=leaf(62,42,-30,1.6,'#3F8A4B')+leaf(48,64,30,1.6,'#4C9A55')+leaf(72,60,10,1.4,'#2F7A40');
  }else if(k==='skillet'){
    o+='<circle cx="60" cy="60" r="34" fill="#4A4F52"/><circle cx="60" cy="60" r="30.5" fill="#6A7074"/><circle cx="60" cy="60" r="28" fill="#8F8671"/>';
    o+=dots(R,24,60,60,26,function(x,y,R){return '<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="7" ry="2.4" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="'+(R()<.5?'#A9D07E':'#C4E09B')+'"/>'});
    o+=dots(R,18,60,60,24,function(x,y,R){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(2+R()*1.6).toFixed(1)+'" fill="'+(R()<.7?'#7B4A2D':'#9A6339')+'"/>'});
    o+=dots(R,6,60,60,22,function(x,y){return '<rect x="'+(x-1.8).toFixed(1)+'" y="'+(y-1.8).toFixed(1)+'" width="3.6" height="3.6" rx=".8" fill="#F28A2E"/>'});
    o+='<path d="M64 62q6-6 14 0t6 8q-8 4-16 0z" fill="rgba(246,204,80,.85)"/>';
    o+='<rect x="92" y="56" width="22" height="8" rx="4" fill="#4A4F52"/>';
  }else if(k==='enchilada'){
    o+='<rect x="26" y="36" width="68" height="48" rx="9" fill="#E9E7DF" stroke="#D3CFC3" stroke-width="1"/><rect x="31" y="41" width="58" height="38" rx="6" fill="#B33A25"/>';
    for(var e=0;e<3;e++)o+='<rect x="'+(35+e*18)+'" y="46" width="14" height="28" rx="7" fill="#EBC278"/><rect x="'+(36+e*18)+'" y="46" width="6" height="28" rx="3" fill="rgba(255,244,214,.45)"/>';
    o+='<path d="M33 54q10-6 20 0t18 2t16-3v12q-10 6-20 0t-18-2t-16 3z" fill="rgba(246,201,70,.88)"/>';
    o+=dots(R,5,60,60,22,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.2" fill="#5E9F2E" stroke="#3F7C1F" stroke-width=".6"/>'});
    o+=leaf(50,52,-20,1.6,'#3F8A4B')+leaf(70,66,30,1.5,'#4C9A55');
  }else if(k==='wok'){
    for(var w=0;w<8;w++)o+='<path d="M'+(36+R()*10)+' '+(48+w*3.6)+'q'+(10+R()*6)+' '+(-9+R()*5)+' '+(22+R()*6)+' 0t'+(20+R()*6)+' 0" fill="none" stroke="#EBD08E" stroke-width="3" stroke-linecap="round"/>';
    o+=dots(R,6,60,60,22,function(x,y,R){return '<rect x="'+(x-4).toFixed(1)+'" y="'+(y-1.4).toFixed(1)+'" width="8" height="2.8" rx="1.4" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#F28A2E"/>'});
    o+=dots(R,5,60,60,22,function(x,y,R){return '<rect x="'+(x-3.6).toFixed(1)+'" y="'+(y-1.4).toFixed(1)+'" width="7.2" height="2.8" rx="1.4" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#D6402F"/>'});
    o+=dots(R,6,60,60,22,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.4" fill="#4F9440"/>'});
    o+=dots(R,5,60,60,20,function(x,y,R){return '<rect x="'+(x-2.6).toFixed(1)+'" y="'+(y-2).toFixed(1)+'" width="5.2" height="4" rx="1.6" transform="rotate('+(R()*80).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#F6E4BE"/>'});
  }else if(k==='balls'){
    o+='<circle cx="54" cy="58" r="22" fill="#E3B13A"/><circle cx="54" cy="58" r="18" fill="#EDC155"/>';
    o+=dots(R,6,54,58,13,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="5" fill="#8A5A3A"/><circle cx="'+(x-1.4).toFixed(1)+'" cy="'+(y-1.4).toFixed(1)+'" r="1.8" fill="#B07E58"/>'});
    o+='<ellipse cx="84" cy="62" rx="10" ry="11" fill="#EFEBDD"/>'+dots(R,24,84,62,9,function(x,y,R){return '<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="2" ry=".9" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#FFFEF8"/>'});
    o+=dots(R,4,54,58,18,function(x,y){return '<rect x="'+(x-2).toFixed(1)+'" y="'+(y-2).toFixed(1)+'" width="4" height="4" rx=".8" fill="#F28A2E"/>'});
    o+=leaf(50,48,-20,1.6,'#3F8A4B')+leaf(60,70,30,1.4,'#4C9A55');
  }else if(k==='shak'){
    o+='<circle cx="60" cy="60" r="34" fill="#3E4447"/><circle cx="60" cy="60" r="30.5" fill="#575E62"/><circle cx="60" cy="60" r="28" fill="#C23B25"/><circle cx="51" cy="49" r="10" fill="rgba(255,255,255,.1)"/><rect x="92" y="56" width="22" height="8" rx="4" fill="#3E4447"/>';
    o+=dots(R,12,60,60,25,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.1" fill="#E0674B"/>'});
    [[49,52],[71,55],[57,73]].forEach(function(e){var jx=(R()-.5)*3,jy=(R()-.5)*3;o+='<ellipse cx="'+e[0]+'" cy="'+e[1]+'" rx="9" ry="7.6" transform="rotate('+(R()*60-30).toFixed(0)+' '+e[0]+' '+e[1]+')" fill="#FFFDF5" stroke="#EDE6D2" stroke-width=".5"/><circle cx="'+(e[0]+jx).toFixed(1)+'" cy="'+(e[1]+jy).toFixed(1)+'" r="3.6" fill="#F5B72C"/><circle cx="'+(e[0]+jx-1).toFixed(1)+'" cy="'+(e[1]+jy-1).toFixed(1)+'" r="1" fill="#FFE08A"/>'});
    o+=dots(R,4,60,60,22,function(x,y){return '<rect x="'+(x-2.4).toFixed(1)+'" y="'+(y-1.8).toFixed(1)+'" width="4.8" height="3.6" rx="1.4" fill="#4F9440"/>'});
    o+=leaf(44,62,30,1.6,'#3F8A4B')+leaf(78,70,-20,1.5,'#4C9A55')+leaf(64,44,70,1.4,'#2F7A40');
  }else if(k==='hash'){
    o+='<circle cx="60" cy="60" r="31" fill="#E8D3A0"/>';
    o+=dots(R,38,60,60,28,function(x,y,R){var t=R(),c=t<.5?'#E3C27C':t<.78?'#F28A2E':'#D6402F';return '<rect x="'+(x-2.7).toFixed(1)+'" y="'+(y-2.7).toFixed(1)+'" width="5.4" height="5.4" rx="1.2" transform="rotate('+(R()*80).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="'+c+'" stroke="rgba(0,0,0,.09)" stroke-width=".4"/>'});
    o+='<ellipse cx="62" cy="56" rx="15" ry="12" transform="rotate(-12 62 56)" fill="#FFFDF5" stroke="#EDE6D2" stroke-width=".6"/><circle cx="63" cy="55" r="5.4" fill="#F5B72C"/><circle cx="61" cy="53" r="1.5" fill="#FFE08A"/>';
    o+=dots(R,6,60,62,24,function(x,y,R){return leaf(x,y,R()*180,1.4,'#4C9A55')});
  }else if(k==='fritter'){
    [[45,50],[75,52],[60,76]].forEach(function(c){
      o+='<circle cx="'+(c[0]+1)+'" cy="'+(c[1]+1.5)+'" r="15.5" fill="rgba(0,0,0,.12)"/><circle cx="'+c[0]+'" cy="'+c[1]+'" r="15" fill="#C98A3A"/><circle cx="'+c[0]+'" cy="'+c[1]+'" r="13.2" fill="#E3B25C"/>';
      o+=dots(R,9,c[0],c[1],11,function(x,y,R){return R()<.5?'<rect x="'+(x-2).toFixed(1)+'" y="'+(y-.8).toFixed(1)+'" width="4" height="1.7" rx=".8" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#8EBB4F"/>':'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="1.4" fill="#F6C437"/>'});
    });
    o+=leaf(60,62,10,1.8,'#4C9A55');
  }else if(k==='roast'){
    o+='<rect x="22" y="34" width="76" height="54" rx="7" fill="#AEB4B1"/><rect x="25" y="37" width="70" height="48" rx="5" fill="#D9DCD8"/>';
    [[38,50],[58,46],[78,52],[44,68],[66,68],[84,70]].forEach(function(c){
      o+='<circle cx="'+c[0]+'" cy="'+c[1]+'" r="8.5" fill="#EBDDB8"/><circle cx="'+(c[0]-5)+'" cy="'+(c[1]+3)+'" r="6" fill="#F1E6C6"/><circle cx="'+(c[0]+5)+'" cy="'+(c[1]+2)+'" r="6.4" fill="#E8D8AE"/>';
      o+=dots(R,3,c[0],c[1],6,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.2" fill="#C98A3A" opacity=".8"/>'});
    });
    o+=dots(R,12,60,62,28,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.4" fill="#E7C77E" stroke="#D2AE5E" stroke-width=".4"/>'});
    o+='<path d="M30 60q10-8 20 0t20 0t18-2" stroke="#FBF8EE" stroke-width="3" fill="none" stroke-linecap="round"/>';
    o+=leaf(50,56,-30,1.6,'#3F8A4B')+leaf(76,62,20,1.5,'#4C9A55')+leaf(64,78,70,1.4,'#2F7A40');
  }else if(k==='quesa'){
    for(var q=0;q<3;q++){
      var ang=q*120+(R()*20-10);
      o+='<g transform="translate(60 62) rotate('+ang.toFixed(0)+') translate(0 -3)"><path d="M0 0L0 -31A31 31 0 0 1 26.8 -15.5z" fill="#C98A3A"/><path d="M0 0L-1.2 -28.6A28.6 28.6 0 0 1 24.6 -14.3z" fill="#EBC278" transform="translate(1.2 -.2)"/>';
      o+='<path d="M3 -4L3 -27" stroke="#F2C230" stroke-width="3.4" stroke-linecap="round"/><path d="M6 -8l14 -9M6 -15l9 -5" stroke="#B9782E" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>';
      o+=dots(R,3,3,-17,6,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="1.6" fill="'+(R()<.5?'#8B2E2A':'#F6C437')+'"/>'})+'</g>';
    }
    o+=leaf(60,58,-20,1.7,'#3F8A4B');
  }else{
    o+='<circle cx="60" cy="60" r="20" fill="#E8E2D2"/><path d="M52 52h16M52 60h16M52 68h10" stroke="#BDB49C" stroke-width="2.4" stroke-linecap="round"/>';
  }
  return o;
}
/* ---- per-dish variation: colours and bits come from the ingredients, table/plate/sides are seeded by the dish ---- */
var VEGRE=[[/gulerod/,'#F28A2E'],[/peberfrugt/,'#D6402F'],[/butternut|græskar/,'#E9922F'],[/rødbed/,'#8E2F46'],[/tomat/,'#D6402F'],[/majs/,'#F6C437'],[/broccoli/,'#3F8A4B'],[/spinat|pak choi|asparges/,'#2F6B3A'],[/squash|agurk/,'#9CC261'],[/sukkerært|ært/,'#79B547'],[/champignon|svamp/,'#CDB89A'],[/blomkål/,'#F1E9D0'],[/porre|spidskål|fennikel|selleri/,'#B7D580'],[/kidney/,'#8B2E2A'],[/kartofl/,'#E3C27C'],[/rødløg/,'#9E3F7C'],[/avocado/,'#8DBB45']];
var TKEYS=Object.keys(TABLES);
var PLATES=[['#FBFAF6','#F3F0E6','#E4DFD1'],['#F7EBD2','#F0E0BC','#DCCBA3'],['#E4EDF1','#D2E1E9','#AFC6D3'],['#E3B196','#D89B7B','#C0825F'],['#D8E1D0','#C8D5BD','#A9BCA0'],['#3B4345','#2F3739','#59666A']];
var CLOTHS=['#F6F1E6','#EADBC6','#D3E1E7','#EBD3D0','#DFE6D3'];
function shade(h,a){var n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,t=a<0?0:255,p=Math.abs(a);r=Math.round((t-r)*p+r);g=Math.round((t-g)*p+g);b=Math.round((t-b)*p+b);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1).toUpperCase()}
function feat(r,seed){
  var nm=String((r&&r.name)||'').toLowerCase(),ing=((r&&r.ing)||[]).map(function(g){return String(g.n).toLowerCase()}),all=ing.join(' | ')+' | '+nm,V=rng(seed^0x51ed);
  var has=function(re){return re.test(all)},pr=(r&&r.prot)||'',vc=[],i,k=0;
  ing.forEach(function(n){if(/hakkede|puré|soltørrede|ketchup|salsa/.test(n))return;for(var j=0;j<VEGRE.length;j++)if(VEGRE[j][0].test(n)){if(vc.indexOf(VEGRE[j][1])<0)vc.push(VEGRE[j][1]);break}});
  var fb=['#F28A2E','#D6402F','#79B547','#F2C230','#9E3F7C'];
  while(vc.length<3&&k++<30){var c=fb[Math.floor(V()*fb.length)];if(vc.indexOf(c)<0)vc.push(c)}
  var hm=[[/dild/,'#8DB05A'],[/koriander/,'#4E9A4A'],[/basilikum/,'#2F7A40'],[/mynte/,'#58A872'],[/persille/,'#3F8A4B']],herb=null;
  for(i=0;i<hm.length;i++)if(has(hm[i][0])){herb=hm[i][1];break}
  if(!herb)herb=['#3F8A4B','#4C9A55','#5B9F3C'][Math.floor(V()*3)];
  var cur=has(/hakkede tomater|tomatpur/)?'#D4672B':has(/teriyaki|soja/)&&!has(/karry/)?'#8A5330':has(/karry/)&&!has(/kokosmælk/)?'#E8B030':has(/kokosmælk/)?'#EBC04F':has(/fløde|cremefr|flødeost|mælk/)?'#EFD9A0':'#E08E2B';
  var sh=(V()-.5)*.16,pk=pr==='kylling'?'chick':pr==='fisk'?'fish':pr==='okse'?'beef':pr==='svin'?'pork':has(/kikærte/)?'chickpea':has(/røde linser/)?'rlentil':has(/linse/)?'lentil':has(/kidney|bønner/)?'bean':null;
  var tk=TKEYS[Math.floor(V()*TKEYS.length)],pi=Math.floor(V()*PLATES.length);
  if(tk==='slate'&&pi===5)pi=0;if(tk==='clay'&&pi===3)pi=1;if(tk==='plum'&&pi===5)pi=2;
  var dip=has(/guacamole/)||(has(/avocado/)&&/burger|taco|quesadilla|enchilada/.test(nm))?'guac':has(/salsa/)?'salsa':has(/yoghurt|cremefr/)?'yog':null;
  var side=has(/citron/)?'lemon':has(/lime/)?'lime':has(/rugbrød/)?'rye':has(/naan/)?'naan':has(/cherrytomat/)?'cherry':has(/parmesan/)?'parm':has(/rød chili|jalapeno/)?'chili':null;
  return{vc:vc.slice(0,4),herb:herb,cur:[cur,shade(cur,.22)],sh:sh,pk:pk,tk:tk,plate:PLATES[pi],rim:Math.floor(V()*4),cloth:CLOTHS[Math.floor(V()*CLOTHS.length)],dip:dip,side:side,
    sesame:has(/sesam/),jal:has(/jalapeno/),avo:has(/avocado/),cuke:has(/agurk/),beet:has(/rødbed/),lime:has(/lime/),gswirl:Math.floor(V()*3),pat:Math.floor(V()*4)}
}
function recolor(o,f,a){
  var s=f.sh,m={'#F28A2E':f.vc[0],'#D6402F':f.vc[1]||f.vc[0],'#6BAA4E':f.vc[2]||f.vc[0],'#E08E2B':f.cur[0],'#EDA23F':f.cur[1],'#D9702C':shade(f.cur[0],f.sh*1.6),
    '#3F8A4B':f.herb,'#4C9A55':shade(f.herb,.14),'#2F7A40':shade(f.herb,-.2),
    '#C23B25':shade('#C23B25',s),'#D9503A':shade('#D9503A',s),'#F3E3B7':shade('#F3E3B7',s),'#FAF0D2':shade('#FAF0D2',s),
    '#D2552B':shade('#D2552B',s),'#E3A83B':shade('#E3A83B',s),'#EDDFC0':shade('#EDDFC0',s),'#B33A25':shade('#B33A25',s)};
  if(a.k!=='salad')m['#4F9440']=f.vc[2]||f.vc[0];
  if(a.k==='bowl'||a.k==='soup'){m['#C9D1CB']=f.plate[2];m['#EEF0EA']=f.plate[0]}
  if(a.k==='burger'){m['#5A3828']=f.pk==='chick'?'#C9893C':f.pk==='fish'?'#D9A25A':'#5A3828';m['#8E2F46']=f.beet?'#8E2F46':'#8A5B34'}
  return o.replace(/#[0-9A-Fa-f]{6}/g,function(c){return m[c.toUpperCase()]||c});
}
function bits(R,n,cx,cy,rad,t){
  return dots(R,n,cx,cy,rad,function(x,y,R){
    var X=x.toFixed(1),Y=y.toFixed(1),rot=(R()*80).toFixed(0),tr=' transform="rotate('+rot+' '+X+' '+Y+')"';
    if(t==='chick')return '<rect x="'+(x-2.8).toFixed(1)+'" y="'+(y-2.1).toFixed(1)+'" width="5.6" height="4.2" rx="1.6"'+tr+' fill="#F6E4BE" stroke="#DDC48E" stroke-width=".4"/>';
    if(t==='fish')return '<rect x="'+(x-3).toFixed(1)+'" y="'+(y-2).toFixed(1)+'" width="6" height="4" rx="1.8"'+tr+' fill="#F58B66"/><path d="M'+(x-1.6).toFixed(1)+' '+Y+'h3.2" stroke="#FBC0A8" stroke-width=".7"'+tr+'/>';
    if(t==='beef')return '<circle cx="'+X+'" cy="'+Y+'" r="'+(1.7+R()*.9).toFixed(1)+'" fill="#6B3F26"/>';
    if(t==='pork')return '<ellipse cx="'+X+'" cy="'+Y+'" rx="3.2" ry="2"'+tr+' fill="#E3A08A"/>';
    if(t==='chickpea')return '<circle cx="'+X+'" cy="'+Y+'" r="2.4" fill="#E7C77E" stroke="#D2AE5E" stroke-width=".4"/>';
    if(t==='rlentil')return '<circle cx="'+X+'" cy="'+Y+'" r="1.5" fill="#E07A2C"/>';
    if(t==='lentil')return '<circle cx="'+X+'" cy="'+Y+'" r="1.6" fill="#7A6A3A"/>';
    return '<ellipse cx="'+X+'" cy="'+Y+'" rx="2.6" ry="1.7"'+tr+' fill="#8B2E2A"/>';
  });
}
function extras(a,f,R){
  var o='',k=a.k,pk=f.pk;
  /* protein / pulses that the base drawing does not already have */
  var area={rice:[76,60,10],bowl:[60,60,19],soup:[60,60,19],wok:[60,60,19]}[k];
  if(area&&pk&&!(k==='rice'&&pk==='chick')&&!(k==='bowl'&&(pk==='chickpea'||pk==='lentil'||pk==='rlentil')))o+=bits(R,pk==='lentil'||pk==='rlentil'?14:6,area[0],area[1],area[2],pk);
  if(k==='burger'){
    if(f.avo)o+='<path d="M30 62q-7 1-4 8q7 3 11-3z" fill="#8DBB45"/><path d="M31 63q-4 1-2 5q4 1 6-2z" fill="#C6DC7A"/>';
    if(f.jal)o+='<circle cx="44" cy="58" r="3.3" fill="none" stroke="#4E8F25" stroke-width="1.5"/><circle cx="74" cy="58.5" r="3.3" fill="none" stroke="#5E9F2E" stroke-width="1.5"/>';
    if(f.cuke)o+='<ellipse cx="60" cy="61.5" rx="21" ry="2.2" fill="#A8D08D"/><ellipse cx="60" cy="61" rx="21" ry="1" fill="#CBE5B2"/>';
  }else if(f.sesame&&k!=='fish'){
    o+=dots(R,9,60,60,22,function(x,y,R){return '<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="1.4" ry=".7" transform="rotate('+(R()*180).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="#FFF6D6"/>'});
  }
  /* dip bowl on the cloth */
  if(f.dip){
    var dc=f.dip==='guac'?'#8DB84A':f.dip==='salsa'?'#C8402A':'#FBF8EE';
    o+='<circle cx="21.5" cy="100" r="10.5" fill="#000" opacity=".14"/><circle cx="20" cy="98" r="10" fill="#FBFAF6" stroke="#DDD7C7" stroke-width=".8"/><circle cx="20" cy="98" r="7.4" fill="'+dc+'"/><circle cx="17.5" cy="95.5" r="2.6" fill="rgba(255,255,255,.3)"/>';
    if(f.dip==='yog')o+=leaf(21,98,-20,1.4,f.herb)+leaf(18,100,30,1.2,shade(f.herb,.14));
    else o+=dots(R,5,20,98,5.5,function(x,y){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r=".9" fill="'+(f.dip==='guac'?'#D6402F':'#5E9F2E')+'"/>'});
  }
  /* side item on the cloth */
  var sd=f.side;
  if(sd==='lemon'||sd==='lime'){var c1=sd==='lemon'?'#F6D84E':'#8DBB45',c2=sd==='lemon'?'#FBEB93':'#C6E082';o+='<g transform="rotate(-15 97 97)"><path d="M86 94a12 12 0 0 0 22 0z" fill="'+c1+'"/><path d="M89 94a9 9 0 0 0 16 0z" fill="'+c2+'"/><path d="M97 94v8M92 94l3 7M102 94l-3 7" stroke="'+c1+'" stroke-width=".8"/></g>'}
  else if(sd==='rye'){o+='<g transform="rotate(12 96 96)"><rect x="84" y="88" width="24" height="16" rx="5" fill="#4C3322"/><rect x="86" y="90" width="20" height="12" rx="3.5" fill="#6A4A32"/></g>'}
  else if(sd==='naan'){o+='<ellipse cx="96" cy="96" rx="13" ry="9" transform="rotate(-18 96 96)" fill="#CFA45E"/><ellipse cx="96" cy="96" rx="11.5" ry="7.6" transform="rotate(-18 96 96)" fill="#E7C98C"/><circle cx="92" cy="94" r="1.2" fill="#B8873F"/><circle cx="99" cy="98" r="1.2" fill="#B8873F"/>'}
  else if(sd==='cherry'){o+='<circle cx="90" cy="98" r="4.4" fill="#D6402F"/><circle cx="99" cy="95" r="4.4" fill="#C4301F"/><circle cx="96" cy="103" r="4.4" fill="#E04B35"/><circle cx="88.8" cy="96.6" r="1.1" fill="#F7A99B"/><path d="M99 91l2-3" stroke="#3F8A4B" stroke-width="1.4" stroke-linecap="round"/>'}
  else if(sd==='parm'){o+='<path d="M86 103l5-10 4 5 5-9 6 14z" fill="#F4E6B0"/><path d="M91 103l3-6 3 4z" fill="#FBF3CE"/>'}
  else if(sd==='chili'){o+='<path d="M85 99q10-11 23-5q-6 11-23 5z" fill="#C8301F"/><path d="M108 94l3-3" stroke="#3F8A4B" stroke-width="1.6" stroke-linecap="round"/>'}
  else if(!f.dip||R()<.5){o+='<path d="M88 102q6-9 12-14" stroke="'+shade(f.herb,-.2)+'" stroke-width="1" fill="none" stroke-linecap="round"/>'+leaf(93,97,-40,2.2,f.herb)+leaf(99,92,10,2,shade(f.herb,.14))+leaf(90,100,70,1.8,shade(f.herb,-.1))}
  return o;
}
var ROT={pasta:1,rice:1,skillet:1,balls:1,chicken:1,fish:1,wok:1,salad:1,soup:1,bowl:1,shak:1,hash:1,fritter:1,quesa:1},FLIP={rice:1,balls:1,chicken:1,fish:1,skillet:1,shak:1,fritter:1,roast:1};
function artSVG(r,wide){
  var a=artKey(r),seed=hashStr((r&&(r.id||r.name))||'x'),R=rng(seed+a.k.length*7),id='pg'+(++_gid);
  var f=feat(r,seed),tb=TABLES[f.tk],dark=f.tk==='slate';
  var vb=wide?'-30 3.75 180 112.5':'0 0 120 120',bg=wide?'<rect x="-120" y="-120" width="400" height="400" fill="url(#'+id+')"/>':'<rect width="120" height="120" fill="url(#'+id+')"/>';
  var s='<svg viewBox="'+vb+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+tb[0]+'"/><stop offset="1" stop-color="'+tb[1]+'"/></linearGradient></defs>'+bg;
  var pg='',x,y;
  if(f.pat===1){for(y=-30;y<150;y+=17)pg+='M-40 '+y+'H170';pg='<path d="'+pg+'" stroke="#000" stroke-opacity=".07" stroke-width="1.3" fill="none"/>'}
  else if(f.pat===2){for(x=-120;x<200;x+=20)pg+='M'+x+' -20l150 150';pg='<path d="'+pg+'" stroke="#fff" stroke-opacity=".16" stroke-width="7" fill="none"/>'}
  else if(f.pat===3){for(x=-30;x<160;x+=14)for(y=-10;y<140;y+=14)pg+='<circle cx="'+(x+((y/14)&1)*7)+'" cy="'+y+'" r="1.5"/>';pg='<g fill="#000" opacity=".06">'+pg+'</g>'}
  s+=pg;
  /* cloth + cutlery */
  var cl=dark?'#566259':f.cloth;
  s+='<g transform="rotate('+(-14+(seed%9))+' 10 100)"><rect x="-30" y="84" width="70" height="40" rx="3" fill="'+cl+'" opacity=".8"/><rect x="-30" y="92" width="70" height="2" fill="'+(dark?'#6F7C72':'#C9BFA8')+'" opacity=".7"/></g>';
  s+='<g transform="translate(106 28) rotate(8)" fill="'+(dark?'#B8C0BB':'#9AA09C')+'"><rect x="-1.6" y="14" width="3.2" height="52" rx="1.6"/><rect x="-5" y="-6" width="10" height="22" rx="4"/></g>';
  /* plate */
  var pt=f.plate,rim=f.rim;
  s+='<circle cx="62" cy="64" r="46" fill="#000" opacity=".16"/><circle cx="60" cy="60" r="46" fill="'+pt[0]+'"/><circle cx="60" cy="60" r="41" fill="none" stroke="'+pt[2]+'" stroke-width="1.6"/><circle cx="60" cy="60" r="36" fill="'+pt[1]+'"/>';
  if(rim===1)s+='<circle cx="60" cy="60" r="44" fill="none" stroke="'+pt[2]+'" stroke-width=".8"/>';
  else if(rim===2)s+='<circle cx="60" cy="60" r="43.6" fill="none" stroke="'+f.vc[0]+'" stroke-width="1.3" stroke-dasharray="1.4 3.4" stroke-linecap="round"/>';
  else if(rim===3)s+='<circle cx="60" cy="60" r="43.4" fill="none" stroke="'+(f.vc[1]||f.herb)+'" stroke-width="2.6" opacity=".55"/>';
  var T=rng(seed^0x9e3779b1),turn=ROT[a.k]?Math.round((T()-.5)*100):0,flip=FLIP[a.k]&&T()<.5;
  s+='<g transform="'+(flip?'translate(120 0) scale(-1 1) ':'')+(turn?'rotate('+turn+' 60 60)':'')+'">'+recolor(sceneInner(a,R),f,a)+'</g>'+extras(a,f,rng(seed^0x2c1b));
  return s+'</svg>';
}
function ownImg(r){return !!(r&&r.img&&(r.img.id||r.img.data))}
function imgSrc(r){if(!r)return '';if(r.img&&r.img.data&&/^data:image\/(jpeg|png|webp);base64,/.test(r.img.data))return r.img.data;if(r.img&&r.img.id)return '/_blob/'+encodeURIComponent(r.img.id);if(r.wimg&&r.wimg.u&&!r.noweb&&/^https:\/\/upload\.wikimedia\.org\//.test(r.wimg.u))return r.wimg.u;return ''}
function artHtml(r,id,wide){
  var src=imgSrc(r);
  return src?'<img src="'+esc(src)+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fb="'+esc(id||'')+'">':artSVG(Object.assign({id:id},r||{}),wide);
}
