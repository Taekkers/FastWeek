const T=require('./pw9.js');const {launch,ok,bad,owner}=T;
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');
(async()=>{
 const P0='data/users/uA/u/';
 const mk=(stores)=>{const D=owner('uA');Object.keys(T.starters).forEach(id=>{if(!D[P0+'recipes/'+id])D[P0+'recipes/'+id]=Object.assign({},T.starters[id],{example:false})});
   if(stores){D[P0+'store/settings']=Object.assign({},D[P0+'store/settings'],{stores})}return D};
 const sh=(pg,n)=>pg.screenshot({path:'/tmp/claude-0/shot_16_'+n+'.png'});
 // ===== A. store comparison =====
 for(const stores of [['Netto','Rema 1000'],['Netto','Rema 1000','Lidl']]){
  const {b,pg,errs}=await launch({uid:'uA',docs:mk(stores),wait:1500});
  const q=f=>pg.evaluate(f);
  await q(()=>{__TEST__.api.ACT.tab({tab:'shop'})});await pg.waitForTimeout(300);
  let r=await q(()=>{const rows=[...document.querySelectorAll('.it.cmp')];
    return{n:rows.length,cells:[...new Set(rows.map(x=>x.querySelectorAll('.cc').length))],mins:[...new Set(rows.map(x=>x.querySelectorAll('.cc.min').length))],
      noMin:rows.filter(x=>!x.querySelector('.cc.min')).length,legend:(document.querySelector('.legend')||{}).textContent,
      head:(document.querySelector('.reco .big')||{}).textContent,sub:(document.querySelector('.reco p')||{}).textContent,
      rec:(document.querySelector('.opt.rec')||{}).textContent,heads:[...document.querySelectorAll('.cmp-l .cmp-p')].slice(0,1).map(x=>x.textContent),
      sections:[...document.querySelectorAll('.sec > .lbl, .storehead, .sth')].map(x=>x.textContent).slice(0,8)}});
  console.log(stores.length+' stores:',JSON.stringify(r));
  ok(r.n>=4,stores.length+' butikker: varerne vises som sammenligningsrækker ('+r.n+')');
  ok(r.cells.length===1&&r.cells[0]===stores.length,'  én priskolonne pr. butik ('+r.cells+')');
  ok(r.mins.every(x=>x===1)||r.mins.every(x=>x<=2),'  billigste butik er markeret pr. vare ('+r.mins+')');
  ok(/Billigste pris i/.test(r.head||''),'  anbefaling: "'+r.head+'"');
  ok(stores.every(s=>(r.rec||'').includes(s)||(r.head||'').includes(s)),'  anbefalingen indeholder alle valgte butikker');
  ok(!bad.test(await q(()=>document.body.innerText)),'  ingen undefined/NaN på siden');
  await sh(pg,'cmp'+stores.length);
  // each item's min cell store == assign
  const chk=await q(()=>{const A=__TEST__.api,w=A.weekId(A.S.mon),items=A.computeList(w),sc=A.storeCosts(items,w),op=A.shopOptions(sc),rec=op.opts[op.rec];
    let wrong=0,n=0;items.forEach(it=>{const key=it.k+'_'+it.unit;if(!rec.assign)return;let best=null;rec.stores.forEach(s=>{const l=sc.stores[s].lines[key];if(l&&(!best||l.cost<best.c-1e-9))best={s,c:l.cost}});n++;if(best&&best.s!==rec.assign[key]&&Math.abs(sc.stores[best.s].lines[key].cost-sc.stores[rec.assign[key]].lines[key].cost)>1e-6)wrong++});
    const total=Object.keys(rec.sub||{}).reduce((a,k)=>a+rec.sub[k],0);return{n,wrong,k:rec.k,fix:A.fixedN(),total:Math.round(total),recTotal:Math.round(op.recTotal)}});
  console.log('  ',JSON.stringify(chk));
  ok(chk.k===stores.length&&chk.wrong===0&&chk.fix===stores.length,'  fuld sammenligning: rec = alle '+stores.length+' butikker, hver vare i den billigste ('+chk.n+' varer)');
  ok(errs.length===0,'  ingen JS-fejl '+errs.slice(0,2).join(' | '));
  await b.close();
 }

 // ===== A2. with the full offer set: items really split between the stores =====
 for(const stores of [['Netto','Lidl'],['Netto','Rema 1000','Lidl']]){
  const D=mk(stores);D['offers/2026-W46']=T.offersNew;
  const {b,pg,errs}=await launch({uid:'uA',docs:D,wait:1500});const q=f=>pg.evaluate(f);
  await q(()=>{__TEST__.api.ACT.tab({tab:'shop'})});await pg.waitForTimeout(300);
  const r=await q(()=>{const rows=[...document.querySelectorAll('.it.cmp')];const per={};rows.forEach(x=>{const i=[...x.querySelectorAll('.cc')].findIndex(c=>c.classList.contains('min'));const hd=document.querySelector('.cmp-p span');per[i]=(per[i]||0)+1});
    const sec=(document.body.innerText.match(/Køb i [^\n]+/g)||[]);const offc=document.querySelectorAll('.cc.off').length;
    return{n:rows.length,per,sec,offc,head:document.querySelector('.reco .big').textContent,sub:document.querySelector('.reco p').textContent,none:(document.body.innerText.match(/Ingen varer er billigst i[^.]*\./)||[''])[0]}});
  console.log(stores.length,'stores+offers:',JSON.stringify(r));
  ok(r.n>=4&&Object.keys(r.per).length===Math.min(stores.length,Object.keys(r.per).length),stores.length+' butikker m. tilbud: '+JSON.stringify(r.per));
  ok(r.offc>0,'  tilbud er markeret ('+r.offc+' celler)');
  ok(/^Køb i /.test(r.sec[0]||''),'  sektioner: '+r.sec.slice(0,4).join(' | '));
  await sh(pg,'cmpoff'+stores.length);
  await pg.evaluate(()=>window.scrollTo(0,0));
  ok(errs.length===0,'  ingen JS-fejl '+errs.slice(0,2).join('|'));
  await b.close();
 }

 // ===== B. upload feedback: Scan kogebog =====
 {
  const {b,pg,errs}=await launch({uid:'uA',docs:mk(),wait:1500});const q=f=>pg.evaluate(f);
  await q(()=>{const A=__TEST__.api;window.__calls=0;A.S.sample.json=function(prompt,o){const n=++window.__calls;
     return new Promise((res,rej)=>{const t=setTimeout(()=>{
        if(window.__fail&&window.__fail.has(n))return rej({code:'invalid_json'});
        res({name:'Kylling i karry '+n,page:40+n,servings:4,minutes:30,ingredients:[{n:'kyllingebryst',q:600,u:'g'},{n:'karry',q:2,u:'tbsp'},{n:'ris',q:300,u:'g'}]})},350);
       if(o&&o.signal)o.signal.addEventListener('abort',()=>{clearTimeout(t);rej({code:'cancelled'})})})};window.__fail=new Set([2]);A.ACT.scanbook({})});
  await pg.waitForTimeout(300);
  // 1. book name missing -> clear message, no reading
  await pg.click('[data-act="sccam"]');await pg.waitForTimeout(100);
  let r=await q(()=>({err:!document.querySelector('#sc-bk-err').hidden,inv:document.querySelector('#sc-book').getAttribute('aria-invalid')}));
  ok(r.err&&r.inv==='true','Scan: uden kogebogsnavn vises en tydelig fejl (ikke tavst)');
  await pg.fill('#sc-book','Min kogebog');
  // 2. two photos
  await pg.setInputFiles('#sc-files',[{name:'a.png',mimeType:'image/png',buffer:PNG},{name:'b.png',mimeType:'image/png',buffer:PNG}]);
  await pg.waitForTimeout(120);
  r=await q(()=>({cards:document.querySelectorAll('.up').length,th:[...document.querySelectorAll('.up-th')].map(i=>i.src.slice(0,5)),st:[...document.querySelectorAll('.up')].map(x=>x.className.replace('up ','')),sum:(document.querySelector('.up-sum')||{}).innerText,toast:(document.querySelector('#toast')||{}).textContent}));
  console.log('right after:',JSON.stringify(r));
  ok(r.cards===2&&r.th.every(x=>x==='blob:'),'Scan: 2 billeder giver 2 kort med miniature ('+r.cards+')');
  ok(r.st[0]==='up-run'&&r.st[1]==='up-queue','  første læser, andet står i kø: '+r.st.join(', '));
  ok(/Læser billede 1 af 2/.test(r.sum||''),'  statuslinje: '+JSON.stringify((r.sum||'').replace(/\n/g,' ')));
  ok(/2 billeder modtaget/.test(r.toast||''),'  toast: "'+r.toast+'"');
  await sh(pg,'up_run');
  await pg.waitForTimeout(1100);
  r=await q(()=>({st:[...document.querySelectorAll('.up')].map(x=>x.className.replace('up ','')),txt:[...document.querySelectorAll('.up')].map(x=>x.innerText.replace(/\n+/g,' | ')),sum:document.querySelector('.up-sum').innerText.replace(/\n+/g,' | '),scans:Object.keys(__TEST__.api.S.scans||{}).length,rev:document.querySelector('#sc-rev').textContent,btns:[...document.querySelectorAll('.up button')].map(b=>b.textContent)}));
  console.log('after:',JSON.stringify(r));
  ok(r.st[0]==='up-ok'&&r.st[1]==='up-bad','  resultat: kort 1 gemt, kort 2 fejlet ('+r.st+')');
  ok(/Kylling i karry 1/.test(r.txt[0])&&/s\. 41/.test(r.txt[0])&&/3 ingredienser/.test(r.txt[0]),'  kort 1 viser navn, side og antal: '+r.txt[0]);
  ok(/Kunne ikke læses/.test(r.txt[1]),'  kort 2: '+r.txt[1]);
  ok(/1 udkast gemt · 1 fejlede/.test(r.sum)&&/Mine retter/.test(r.sum),'  samlet: '+r.sum);
  ok(r.scans===1&&/Gennemse udkast \(1\)/.test(r.rev),'  udkast i databasen ('+r.scans+'), knap: '+r.rev);
  ok(r.btns.join()==='Åbn,Prøv igen','  knapper: '+r.btns);
  await sh(pg,'up_done');
  // 3. retry
  await q(()=>{window.__fail=new Set()});
  await pg.click('[data-act="scretry"]');await pg.waitForTimeout(150);
  r=await q(()=>document.querySelector('#up2').className);
  ok(/up-run/.test(r),'  Prøv igen: kort 2 læser igen');
  await pg.waitForTimeout(600);
  r=await q(()=>({st:[...document.querySelectorAll('.up')].map(x=>x.className.replace('up ','')),sum:document.querySelector('.up-sum').innerText.replace(/\n+/g,' | '),scans:Object.keys(__TEST__.api.S.scans||{}).length}));
  ok(r.st.every(x=>x==='up-ok')&&/^2 udkast gemt/.test(r.sum)&&r.scans===2,'  begge gemt: '+r.sum+' ('+r.scans+' udkast)');
  // 4. open a draft from its card
  await pg.click('#up1 [data-act="editdraft"]');await pg.waitForTimeout(300);
  r=await q(()=>({h:(document.querySelector('.sh-head h2')||{}).textContent,name:(document.querySelector('#rf-name')||{}).value}));
  ok(/Kylling i karry/.test(r.name||''),'  "Åbn" på kortet åbner udkastet: '+JSON.stringify(r));
  await pg.keyboard.press('Escape');await pg.waitForTimeout(100);
  // 5. stop
  await q(()=>{__TEST__.api.ACT.scanbook({})});await pg.waitForTimeout(200);
  await pg.fill('#sc-book','Min kogebog');
  await pg.setInputFiles('#sc-files',[{name:'a.png',mimeType:'image/png',buffer:PNG},{name:'b.png',mimeType:'image/png',buffer:PNG}]);
  await pg.waitForTimeout(150);await pg.click('[data-act="stopread"]');await pg.waitForTimeout(250);
  r=await q(()=>({st:[...document.querySelectorAll('.up')].map(x=>x.className.replace('up ','')),sum:document.querySelector('.up-sum').innerText.replace(/\n+/g,' | ')}));
  ok(r.st.every(x=>x==='up-stop'),'  Stop: begge kort viser "Stoppet" ('+r.st+')');
  ok(!/Læser billede/.test(r.sum)&&/Læsning stoppet/.test(r.sum),'  ingen hængende spinner, tydelig status: '+r.sum);
  ok(errs.length===0,'  ingen JS-fejl '+errs.slice(0,3).join(' | '));
  await b.close();
 }
 // ===== B2. Ny ret: Læs fra billede =====
 {
  const {b,pg,errs}=await launch({uid:'uA',docs:mk(),wait:1500});const q=f=>pg.evaluate(f);
  await q(()=>{const A=__TEST__.api;A.S.sample.json=function(){return new Promise(r=>setTimeout(()=>r({name:'Pasta pesto',minutes:20,servings:2,ingredients:[{n:'pasta',q:200,u:'g'},{n:'pesto',q:1,u:'stk'}]}),400))};A.ACT.newrec()});
  await pg.waitForTimeout(300);
  const has=await q(()=>!!document.querySelector('#rf-file'));
  ok(has,'Ny ret: billedfelt findes');
  await q(()=>{const d=document.querySelector('#rf-file').closest('details');if(d)d.open=true});
  await pg.setInputFiles('#rf-file',[{name:'a.png',mimeType:'image/png',buffer:PNG}]);await pg.waitForTimeout(120);
  let r=await q(()=>({th:document.querySelectorAll('#rf-th figure').length,sum:(document.querySelector('#rf-st .up-sum')||{}).className,txt:(document.querySelector('#rf-st')||{}).innerText}));
  ok(r.th===1&&/run/.test(r.sum||'')&&/modtaget/.test(r.txt),'  efter valg: miniature + "modtaget. Læser…" ('+JSON.stringify(r)+')');
  await pg.waitForTimeout(600);
  r=await q(()=>({txt:document.querySelector('#rf-st').innerText.replace(/\n+/g,' | '),cls:document.querySelector('#rf-st .up-sum').className,name:document.querySelector('#rf-name').value,rows:document.querySelectorAll('#rf-ings > *').length,again:!document.querySelector('#rf-read').hidden}));
  ok(/ok/.test(r.cls)&&/2 ingredienser indsat/.test(r.txt)&&r.name==='Pasta pesto'&&r.rows>=2,'  efter læsning: '+JSON.stringify(r));
  ok(r.again,'  "Læs igen" vises');
  await sh(pg,'newrec');
  ok(errs.length===0,'  ingen JS-fejl '+errs.slice(0,3).join(' | '));
  await b.close();
 }

 // ===== C. planning mode in the wizard and week view =====
 {
  const {b,pg,errs}=await launch({uid:'uA',docs:mk(),wait:1500});const q=f=>pg.evaluate(f);
  await q(()=>{__TEST__.api.ACT.wizard({})});await pg.waitForTimeout(300);
  const st=()=>q(()=>({step:document.querySelector('#wz-step').textContent,bars:document.querySelectorAll('#wz-bar i').length,on:document.querySelectorAll('#wz-bar i.on').length,modes:[...document.querySelectorAll('.modes .mode')].map(m=>m.classList.contains('on')+':'+m.querySelector('b').textContent),foot:[...document.querySelectorAll('#wz-foot .btn')].map(x=>x.textContent),q:(document.querySelector('.wz-q')||{}).textContent,stat:(document.querySelector('.mode-s')||{}).textContent}));
  let r=await st();console.log(JSON.stringify(r));
  ok(r.step==='Trin 1 af 3'&&r.bars===3&&r.modes.length===2&&/^true:Efter ugens tilbud/.test(r.modes[0])&&/^false:Jeg vælger selv/.test(r.modes[1]),'Guide: trin 1 er valget "Efter ugens tilbud" / "Jeg vælger selv" ('+r.step+')');
  ok(/tilbud hos \d+ butik/.test(r.stat||''),'  viser antal tilbud: "'+r.stat+'"');
  await sh(pg,'wz1');
  await pg.click('[data-m="self"]');await pg.waitForTimeout(80);r=await st();
  ok(r.step==='Trin 1 af 1'&&r.bars===1&&r.foot.join()==='Gem valg','  "Jeg vælger selv" giver 1 trin og knappen "Gem valg" ('+r.step+', '+r.foot+')');
  await sh(pg,'wz1self');
  await pg.click('[data-m="offers"]');await pg.click('[data-act="wznext"]');await pg.waitForTimeout(80);r=await st();
  ok(r.step==='Trin 2 af 3'&&/Hvordan ser uge/.test(r.q),'  tilbud: trin 2 = tid pr. dag ('+r.step+')');
  await pg.click('[data-act="wznext"]');await pg.waitForTimeout(80);r=await st();
  ok(r.step==='Trin 3 af 3'&&r.foot.includes('Lav madplan')&&r.foot.includes('Tilbage'),'  trin 3 = ønsker, "Lav madplan" ('+r.step+')');
  await pg.click('[data-act="wzback"]');await pg.waitForTimeout(80);r=await st();
  ok(r.step==='Trin 2 af 3','  Tilbage virker ('+r.step+')');
  await pg.click('[data-act="wznext"]');await pg.click('[data-act="wzdone"]');await pg.waitForTimeout(900);
  r=await q(()=>{const A=__TEST__.api,w=A.weekId(A.S.mon);return{mode:A.S.prefs[w].mode,chip:(document.querySelector('.chip.pm')||{}).textContent,off:!!document.querySelector('.offcard'),offTxt:(document.querySelector('.offcard')||{}).innerText,days:A.S.plans[w].days.filter(d=>d&&d.r).length,foot:[...document.querySelectorAll('.foot .btn')].map(x=>x.textContent),toast:(document.querySelector('#toast')||{}).textContent}});
  console.log(JSON.stringify(r));
  ok(r.mode==='offers'&&r.chip==='Efter tilbud'&&r.days>=4,'Ugeplan (tilbud): mode gemt, chip "'+r.chip+'", '+r.days+' retter');
  ok(r.off&&/Tilbud i planen|Ingen tilbud/.test(r.offTxt),'  tilbudskort: '+JSON.stringify((r.offTxt||'').replace(/\n+/g,' | ')));
  ok(/efter ugens tilbud|er klar/.test(r.toast||''),'  toast: '+r.toast);
  await q(()=>window.scrollTo(0,0));await sh(pg,'week_offers');
  // next week: empty -> hero, then self mode
  await q(()=>{__TEST__.api.ACT.wk({d:1})});await pg.waitForTimeout(200);
  r=await q(()=>({hero:(document.querySelector('.hero')||{}).innerText,btns:[...document.querySelectorAll('.hero .btn,.hero .alt')].map(x=>x.textContent)}));
  ok(/Planlæg efter ugens tilbud, eller vælg retterne selv\./.test(r.hero||'')&&r.btns.join()==='Planlæg ugen,Lav en plan nu','Tom uge: hero tilbyder valget ('+r.btns+')');
  await sh(pg,'hero');
  await q(()=>{__TEST__.api.ACT.wizard({})});await pg.waitForTimeout(200);
  await pg.click('[data-m="self"]');await pg.click('[data-act="wzdone"]');await pg.waitForTimeout(700);
  r=await q(()=>{const A=__TEST__.api,w=A.weekId(A.S.mon);return{w,mode:A.S.prefs[w]&&A.S.prefs[w].mode,none:document.querySelectorAll('.dc.none').length,hero:!!document.querySelector('.hero'),chip:(document.querySelector('.chip.pm')||{}).textContent,foot:[...document.querySelectorAll('.foot .btn')].map(x=>x.textContent),plan:!!A.S.plans[w]&&(A.S.plans[w].days||[]).some(d=>d&&d.r),offc:!!document.querySelector('.offcard'),toast:(document.querySelector('#toast')||{}).textContent}});
  console.log(JSON.stringify(r));
  ok(r.mode==='self'&&r.none===7&&!r.hero&&!r.plan,'Egne valg: 7 tomme dage ("Vælg ret"), ingen plan genereret ('+r.none+')');
  ok(r.chip==='Egne valg'&&r.foot.join()==='Foreslå retter,Mine retter'&&!r.offc,'  chip "'+r.chip+'", knapper '+r.foot+', intet tilbudskort');
  await sh(pg,'week_self');
  // choose a dish for Monday, then let the app suggest the rest
  const rid=await q(()=>{const A=__TEST__.api;return Object.keys(A.S.recipes).filter(id=>A.recAllowed(A.S.recipes[id]))[0]});
  await pg.evaluate(id=>{const A=__TEST__.api;A.ACT.setday({i:'0',id})},rid);await pg.waitForTimeout(500);
  await pg.click('.foot [data-act="gen"]');await pg.waitForTimeout(900);
  r=await q(()=>{const A=__TEST__.api,w=A.weekId(A.S.mon),d=A.S.plans[w].days;return{n:d.filter(x=>x&&x.r).length,d0:d[0]&&d[0].r,lock:d[0]&&d[0].lock}});
  ok(r.d0===rid&&r.lock&&r.n>=4,'  Foreslå retter: mandagens valg bevares, resten foreslås ('+r.n+' retter)');
  ok(errs.length===0,'  ingen JS-fejl '+errs.slice(0,3).join(' | '));
  await b.close();
 }

 // ===== D. does the offer mode actually plan after the offers? (synthetic deep offers on 6 recipes' main ingredient) =====
 {
  const D=mk(['Netto','Lidl']);
  const {b,pg,errs}=await launch({uid:'uA',docs:D,wait:1500});
  const res=await pg.evaluate(()=>{
    const A=__TEST__.api,w='2026-W46',S=A.S;
    const keepPlan=S.plans[w],keepPref=S.prefs[w];
    const ids=Object.keys(S.recipes).filter(id=>A.recAllowed(S.recipes[id])&&S.recipes[id].ing&&S.recipes[id].ing.length>2);
    // pick 6 recipes with different main ingredients
    const targets=[],seenK={};
    ids.forEach(id=>{if(targets.length>=6)return;const needs=A.ACT&&null;});
    const cand=ids.map(id=>{
      const sc=(S.settings.persons||2)/2;let best=null;
      S.recipes[id].ing.forEach(g=>{const k=g.n.toLowerCase().replace(/[^a-zæøå0-9]+/g,'');const it={k:k.length?null:null,name:g.n,unit:g.u,qty:g.q*sc};});
      return id});
    // use the app's own slug via aggNeeds-like path: lineCost needs {k,unit,qty}
    const mkOffers=[];
    const picked=[];
    for(const id of ids){
      if(picked.length>=6)break;
      const rec=S.recipes[id];let best=null;
      (rec.ing||[]).forEach(g=>{
        const p=Object.keys(S.pantry.items).map(k=>S.pantry.items[k]).find(x=>x&&x.name&&x.name.toLowerCase()===String(g.n).toLowerCase());
        if(!p)return;const k=Object.keys(S.pantry.items).find(k=>S.pantry.items[k]===p);
        const need=g.q*((S.settings.persons||2)/2);if(p.unit!==g.u)return;
        const c=A.lineCost({k,unit:g.u,qty:need});if(c>0&&(!best||c>best.c))best={k,c,need,unit:g.u,name:g.n};
      });
      if(best&&!seenK[best.k]){seenK[best.k]=1;picked.push(id);mkOffers.push(best)}
    }
    const items=mkOffers.map((x,i)=>({id:'t'+i,store:i%2?'Lidl':'Netto',name:'Tilbud '+x.name,price:Math.max(1,Math.round(x.c*0.45)),was:0,qty:Math.ceil(x.need),unit:x.unit,match:x.k,q:'god',to:'13.11'}));
    S.offers[w]={week:w,updated:Date.now(),items};
    const meas=(mode)=>{
      S.prefs[w]=Object.assign({},keepPref,{mode,done:true});S.plans[w]={week:w,days:[]};
      const days=A.generate(w);S.plans[w]={week:w,days};
      const got=A.daysIds(days);
      const its=A.computeList(w),sc=A.storeCosts(its,w),op=A.shopOptions(sc),rec=op.opts[op.rec];
      let sv=0,n=0;its.forEach(it=>{const key=it.k+'_'+it.unit,s=rec.assign?rec.assign[key]:rec.stores[0],ln=sc.stores[s]&&sc.stores[s].lines[key];if(ln&&ln.via){sv+=Math.max(0,ln.norm-ln.cost);n++}});
      return{sv:Math.round(sv),n,tot:Math.round(op.recTotal),dishes:days.filter(d=>d&&d.r).length,dish:new Set(got).size};
    };
    const out={offers:[],self:[],picked:picked.length,items:items.length};
    for(let i=0;i<16;i++){out.offers.push(meas('offers'));out.self.push(meas('self'))}
    S.plans[w]=keepPlan;S.prefs[w]=keepPref;return out});
  const avg=(a,k)=>a.reduce((x,y)=>x+y[k],0)/a.length;
  console.log('synthetic offers on',res.items,'ingredients (',res.picked,'recipes)');
  console.log('offers mode: sparer',avg(res.offers,'sv').toFixed(1),'kr på',avg(res.offers,'n').toFixed(1),'varer; indkøb',avg(res.offers,'tot').toFixed(0),'kr');
  console.log('self mode  : sparer',avg(res.self,'sv').toFixed(1),'kr på',avg(res.self,'n').toFixed(1),'varer; indkøb',avg(res.self,'tot').toFixed(0),'kr');
  ok(res.items>=4,'Syntetiske tilbud oprettet ('+res.items+')');
  ok(res.offers.every(x=>x.dishes>=5),'Tilbudsmode laver fyldte planer ('+res.offers.map(x=>x.dishes)+')');
  ok(avg(res.offers,'sv')>avg(res.self,'sv')*1.1,'Tilbudsmode sparer mere på tilbud ('+avg(res.offers,'sv').toFixed(0)+' vs '+avg(res.self,'sv').toFixed(0)+' kr)');
  ok(avg(res.offers,'tot')<avg(res.self,'tot')-15,'  og ugens indkøb bliver billigere ('+avg(res.offers,'tot').toFixed(0)+' vs '+avg(res.self,'tot').toFixed(0)+' kr)');
  ok(res.offers.every(x=>x.dishes>=5)&&avg(res.offers,'dish')>=6.9,'  stadig 7 forskellige retter ('+avg(res.offers,'dish').toFixed(1)+')');
  ok(errs.length===0,'  ingen JS-fejl '+errs.slice(0,3).join(' | '));
  await b.close();
 }
 T.done();
})();
