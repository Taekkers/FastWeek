const T=require('./pw9.js');const {launch,ok,bad,owner}=T;
(async()=>{
 const P0='data/users/uA/u/';
 const mk=(stores,off)=>{const D=owner('uA');Object.keys(T.starters).forEach(id=>{if(!D[P0+'recipes/'+id])D[P0+'recipes/'+id]=Object.assign({},T.starters[id],{example:false})});
   if(stores)D[P0+'store/settings']=Object.assign({},D[P0+'store/settings'],{stores});if(off)D['offers/2026-W46']=T.offersNew;return D};
 // ===== A. order: cheapest first, "Nemmest" =====
 for(const stores of [['Bilka','Netto','Rema 1000','Coop 365','Lidl'],['Netto','Bilka','Lidl'],['Meny','Netto']]){
  const {b,pg,errs}=await launch({uid:'uA',docs:mk(stores,true),wait:1500});const q=f=>pg.evaluate(f);
  await q(()=>{__TEST__.api.ACT.tab({tab:'shop'})});await pg.waitForTimeout(300);
  const r=await q(()=>{const A=__TEST__.api,w=A.weekId(A.S.mon),sc=A.storeCosts(A.computeList(w),w),op=A.shopOptions(sc);
    const exp=A.activeStores().slice().sort((a,b)=>sc.stores[a].total-sc.stores[b].total||sc.stores[b].n-sc.stores[a].n||a.localeCompare(b,'da'));
    const tiles=[...document.querySelectorAll('.stores > .sto:not(.pair) > b')].map(x=>x.textContent);
    const tots=tiles.map(s=>sc.stores[s].total);
    const optStores=op.opts.map(o=>o.stores.slice());
    const sortedOpt=optStores.every(st=>st.every((s,i)=>i===0||sc.stores[st[i-1]].total<=sc.stores[s].total+1e-9));
    const cols=[...document.querySelectorAll('.cmp-l .cmp-p')].slice(0,1).map(x=>[...x.children].map(y=>y.textContent));
    const heads=[...document.querySelectorAll('.storehead b')].map(x=>x.textContent.replace('Køb i ',''));
    const badges=[...document.querySelectorAll('.best')].map(x=>x.textContent);
    return{exp,tiles,tots:tots.map(Math.round),sortedOpt,cols,heads,badges,body:document.body.innerText.includes('Anbefalet'),recHead:(document.querySelector('.reco .big')||{}).textContent}});
  console.log(stores.length+' butikker',JSON.stringify(r));
  ok(JSON.stringify(r.tiles)===JSON.stringify(r.exp),stores.length+' butikker: fliserne står billigste først ('+r.tiles.join(' < ')+')');
  ok(r.sortedOpt,'  butikkerne i hver valgmulighed står billigste først');
  const rank=s=>r.exp.indexOf(s);
  ok(r.heads.every((s,i)=>i===0||rank(r.heads[i-1])<rank(s)),'  "Køb i"-sektionerne i samme rækkefølge ('+r.heads.join(', ')+')');
  ok(!r.body&&(r.badges.length===0||r.badges.every(x=>x==='Billigst'||x==='Nemmest')),'  "Anbefalet" er væk; mærker: '+r.badges.join(', '));
  if(stores.length<=3)ok(r.cols.length===0||JSON.stringify(r.cols[0].map(x=>x))===JSON.stringify(r.exp.map(s=>({'Rema 1000':'Rema','Coop 365':'365','SuperBrugsen':'SuperB.','Løvbjerg':'Løvbj.'}[s]||s))),'  kolonnerne i sammenligningen: '+JSON.stringify(r.cols[0]||[]));
  ok(errs.length===0,'  ingen JS-fejl '+errs.slice(0,2).join('|'));
  await pg.screenshot({path:'/tmp/claude-0/shot_17_order'+stores.length+'.png'});
  await b.close();
 }
 T.done();
})();
