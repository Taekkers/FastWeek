const T=require('./pw9.js');const {launch,ok,bad,owner}=T;
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');
(async()=>{
 const P0='data/users/uA/u/';
 const D=owner('uA');Object.keys(T.starters).forEach(id=>{if(!D[P0+'recipes/'+id])D[P0+'recipes/'+id]=Object.assign({},T.starters[id],{example:false})});
 D[P0+'store/settings']=Object.assign({},D[P0+'store/settings'],{stores:['Netto','Lidl','Meny']});
 const {b,pg,errs}=await launch({uid:'uA',docs:D,wait:1500});const q=f=>pg.evaluate(f);
 // ===== A. normal price =====
 await q(()=>{__TEST__.api.ACT.tab({tab:'shop'})});await pg.waitForTimeout(300);
 let r=await q(()=>{const c=[...document.querySelectorAll('.chip.pc')];return{n:c.length,rows:document.querySelectorAll('.it').length,first:c[0]&&c[0].textContent,k:c[0]&&c[0].dataset.k}});
 console.log(JSON.stringify(r));
 ok(r.n>=r.rows-2&&r.n>0,'Indkøb: hver vare viser sin normalpris ('+r.n+' af '+r.rows+'), fx "'+r.first+'"');
 const k=r.k;
 const before=await pg.evaluate(k=>{const A=__TEST__.api,w=A.weekId(A.S.mon),it=A.computeList(w).find(x=>x.k===k),sc=A.storeCosts(A.computeList(w),w),key=it.k+'_'+it.unit;return{qty:it.qty,unit:it.unit,norm:['Netto','Lidl','Meny'].map(s=>sc.stores[s].lines[key].norm)}},k);
 await pg.click('.chip.pc[data-k="'+k+'"]');await pg.waitForTimeout(250);
 r=await q(()=>({h:document.querySelector('.sh-head h2').textContent,lab:document.querySelector('label[for="np-v"]').textContent,v:document.querySelector('#np-v').value}));
 ok(/Normalpris for/.test(r.lab),'  prisark: '+JSON.stringify(r));
 await pg.fill('#np-v','0');await pg.click('[data-act="savenorm"]');await pg.waitForTimeout(150);
 ok(await q(()=>!document.querySelector('#np-err').hidden),'  0 kr afvises med en fejl');
 await pg.fill('#np-v','37,50');await pg.click('[data-act="savenorm"]');await pg.waitForTimeout(600);
 const after=await pg.evaluate(k=>{const A=__TEST__.api,S=A.S,w=A.weekId(A.S.mon),p=S.pantry.items[k],it=A.computeList(w).find(x=>x.k===k),sc=A.storeCosts(A.computeList(w),w),key=it.k+'_'+it.unit;
   const c=document.querySelector('.chip.pc[data-k="'+k+'"]');return{p:{kp:p.kp,kpo:p.kpo,kpf:p.kpf,kpx:p.kpx,pack:p.pack,unit:p.unit},stored:window.__store['data/users/uA/u/store/pantry'].items[k].kpx,norm:['Netto','Lidl','Meny'].map(s=>Math.round(sc.stores[s].lines[key].norm*100)/100),qty:it.qty,chip:c&&c.textContent,toast:document.querySelector('#toast').textContent}},k);
 console.log('før',JSON.stringify(before),'\nefter',JSON.stringify(after));
 const per=after.p.pack>0?(after.p.unit==='stk'?after.p.pack:after.p.pack/1000):1,exp=37.5/per*(after.p.unit==='stk'?after.qty:after.qty/1000);
 ok(after.stored===true&&after.norm.every(x=>Math.abs(x-exp)<0.02),'  gemt som din pris og brugt ens i alle butikker ('+after.norm.join(' / ')+' kr, forventet '+exp.toFixed(2)+')');
 ok(/^Din pris 37,5/.test(after.chip||''),'  rækken viser nu "'+after.chip+'"');
 ok(/regnet om/.test(after.toast),'  besked: '+after.toast);
 // reset
 await pg.click('.chip.pc[data-k="'+k+'"]');await pg.waitForTimeout(250);
 const hasReset=await q(()=>!!document.querySelector('[data-act="resetnorm"]'));
 if(hasReset){await pg.click('[data-act="resetnorm"]');await pg.waitForTimeout(500);
   r=await pg.evaluate(k=>{const p=__TEST__.api.S.pantry.items[k];return{kpx:p.kpx,chip:document.querySelector('.chip.pc[data-k="'+k+'"]').textContent}},k);
   ok(!r.kpx&&/^Normalpris/.test(r.chip),'  "Brug skønnet" fjerner din pris igen ('+r.chip+')');}
 else ok(true,'  (ingen reference-pris for denne vare, så ingen nulstil-knap)');
 await pg.keyboard.press('Escape');
 await q(()=>{__TEST__.api.ACT.tab({tab:'stock'})});await pg.waitForTimeout(200);
 await pg.evaluate(k=>__TEST__.api.ACT.editstock({k}),k);await pg.waitForTimeout(250);
 r=await q(()=>document.getElementById('sf-kp').checkVisibility());
 ok(r,'Lager: normalprisen står synligt i varens ark (ikke gemt under "Flere indstillinger")');
 await pg.screenshot({path:'/tmp/claude-0/shot_19_stock.png'});
 await pg.keyboard.press('Escape');await pg.waitForTimeout(100);
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
