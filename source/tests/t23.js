const T=require('./pw9.js');const {launch,ok,owner}=T;
(async()=>{
 const {b,pg,errs}=await launch({uid:'uA',docs:owner('uA'),wait:1500});const q=f=>pg.evaluate(f);
 await q(()=>__TEST__.api.ACT.newrec());await pg.waitForTimeout(250);
 await pg.fill('#rf-name','Stor testret');
 const N=30;
 for(let i=0;i<N;i++){const rows=await q(()=>document.querySelectorAll('#rf-ings .ingw').length);if(rows<=i){await pg.click('[data-act="ingadd"]');}
   const row=pg.locator('#rf-ings .ingw').nth(i);await row.locator('.i-n').fill('ingrediens '+(i+1));await row.locator('.i-q').fill(String(i+1));}
 let r=await q(()=>({rows:document.querySelectorAll('#rf-ings .ingw').length,btn:(()=>{const b=document.querySelector('[data-act="ingadd"]');b.scrollIntoView();const rc=b.getBoundingClientRect();return rc.top>=0&&rc.bottom<=innerHeight})()}));
 ok(r.rows===N&&r.btn,'Ny ret: '+N+' ingrediensrækker, knappen "Tilføj" kan stadig nås');
 await pg.click('[data-act="saverec"]');await pg.waitForTimeout(700);
 r=await q(()=>{const st=window.__store,k=Object.keys(st).find(k=>/\/recipes\//.test(k)&&st[k].name==='Stor testret');return{saved:!!k,n:k?st[k].ing.length:0,toast:(document.querySelector('#toast')||{}).textContent}});
 console.log(JSON.stringify(r));
 ok(r.saved&&r.n===N,'Alle '+N+' ingredienser gemmes ('+r.n+')');
 ok(errs.length===0,'ingen JS-fejl '+errs.slice(0,2).join('|'));
 await b.close();T.done();
})();
