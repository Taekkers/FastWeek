const T=require('./pw9.js');const {launch,ok,bad,owner}=T;
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');
(async()=>{
 const P0='data/users/uA/u/';
 const D=owner('uA');Object.keys(T.starters).forEach(id=>{if(!D[P0+'recipes/'+id])D[P0+'recipes/'+id]=Object.assign({},T.starters[id],{example:false})});
 D[P0+'store/settings']=Object.assign({},D[P0+'store/settings'],{stores:['Netto','Lidl','Meny']});
 const {b,pg,errs}=await launch({uid:'uA',docs:D,wait:1500});const q=f=>pg.evaluate(f);
 // (A. Normalpris-knappen er fjernet igen i version 9: se t20.js for hyldepriser pr. butik)
 // ===== B. photo from search =====
 const rid=await q(()=>{const A=__TEST__.api,id=Object.keys(A.S.recipes)[2];A.S.recipes[id]=Object.assign({},A.S.recipes[id],{photo:{u:'https://cdn.example.dk/kylling.jpg',p:'https://www.valdemarsro.dk/kylling/',h:'valdemarsro.dk',at:1}});return id});
 r=await pg.evaluate(id=>{const A=__TEST__.api;const d=new DOMParser().parseFromString(A.heroHtml(id,A.S.recipes[id]),'text/html');return{img:(d.querySelector('img')||{}).getAttribute&&d.querySelector('img').getAttribute('src'),cr:(d.querySelector('.credit')||{}).textContent,href:d.querySelector('.credit a')&&d.querySelector('.credit a').getAttribute('href')}},rid);
 ok(r.img==='https://cdn.example.dk/kylling.jpg'&&/valdemarsro\.dk/.test(r.cr)&&r.href==='https://www.valdemarsro.dk/kylling/','Retfoto: vises med kilde og link: '+JSON.stringify(r.cr));
 await pg.evaluate(id=>{__TEST__.api.ACT.nextimg({id})},rid);await pg.waitForTimeout(400);
 r=await pg.evaluate(id=>{const x=window.__store['data/users/uA/u/recipes/'+id];return{req:x.photoReq,skip:x.photoSkip}},rid);
 ok(r.req===true&&r.skip.includes('https://cdn.example.dk/kylling.jpg'),'  "Find et andet" beder om et nyt foto og springer det gamle over');
 r=await q(()=>{const A=__TEST__.api,id=Object.keys(A.S.recipes)[4];const r0=Object.assign({},A.S.recipes[id]);delete r0.photo;return new DOMParser().parseFromString(A.heroHtml(id,r0),'text/html').body.textContent});
 ok(/hentes automatisk inden for en time/.test(r),'  ret uden foto endnu: "hentes automatisk inden for en time"');
 // ===== C. read text shown =====
 await q(()=>{const A=__TEST__.api;A.S.sample.json=function(p,o){if(o&&o.onStep)o.onStep('Prøver at dreje billedet…');return new Promise(r=>setTimeout(()=>r({name:'Test',ingredients:[{n:'pasta',q:200,u:'g'}],raw:'INGREDIENSER\n200 g pasta\n----\nlinje to'}),300))};A.ACT.newrec()});
 await pg.waitForTimeout(250);
 await q(()=>{const d=document.querySelector('#rf-file').closest('details');if(d)d.open=true});
 await pg.setInputFiles('#rf-file',[{name:'a.png',mimeType:'image/png',buffer:PNG}]);await pg.waitForTimeout(120);
 r=await q(()=>document.querySelector('#rf-st').innerText);
 ok(/dreje/.test(r),'Læsning viser hvad den laver: '+JSON.stringify(r.split('\n')[0]));
 await pg.waitForTimeout(500);
 r=await q(()=>{const d=document.querySelector('#rf-st details.raw');return{has:!!d,txt:d&&d.querySelector('pre').textContent}});
 ok(r.has&&/200 g pasta/.test(r.txt),'  "Vis den læste tekst" med kopiknap findes efter læsning');
 ok(errs.length===0,'ingen JS-fejl '+errs.slice(0,3).join(' | '));
 await b.close();T.done();
})();
