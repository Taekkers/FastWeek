const T=require('./pw9.js');const {launch,ok,owner}=T;const fs=require('fs');
(async()=>{
 const P0='data/users/uA/u/';const D=owner('uA');const ids=Object.keys(D).filter(k=>k.startsWith(P0+'recipes/'));
 const rid=ids[0].split('/').pop();D[ids[0]]=Object.assign({},D[ids[0]],{img:{data:'data:image/jpeg;base64,'+fs.readFileSync('/tmp/claude-0/dish.jpg').toString('base64')}});
 const {b,pg,errs}=await launch({uid:'uA',docs:D,wait:1500});const q=f=>pg.evaluate(f);
 await pg.evaluate(id=>__TEST__.api.openRecipe(id),rid);await pg.waitForTimeout(300);
 await pg.click('.hero-img .art.wide');await pg.waitForTimeout(250);
 let r=await q(()=>{const b=document.querySelector('#lb'),i=b&&b.querySelector('img');const rc=i&&i.getBoundingClientRect();return{open:!!b,w:rc&&Math.round(rc.width),vw:innerWidth,cap:b&&b.querySelector('.lb-cap').textContent,focus:document.activeElement&&document.activeElement.className}});
 ok(r.open&&r.w>=r.vw*0.85,'Tryk på billedet forstørrer det ('+r.w+' af '+r.vw+' px bredt), fokus på Luk: '+r.focus);
 await pg.screenshot({path:'/tmp/claude-0/shot_22_lb.png'});
 await pg.keyboard.press('Escape');await pg.waitForTimeout(150);
 r=await q(()=>({lb:!!document.querySelector('#lb'),sheet:!!document.querySelector('#sheet').firstChild}));
 ok(!r.lb&&r.sheet,'Escape lukker billedet, og retten er stadig åben');
 await pg.click('.hero-img .art.wide');await pg.waitForTimeout(150);await pg.click('#lb .lb-in');await pg.waitForTimeout(150);
 ok(await q(()=>!document.querySelector('#lb')),'Tryk på det store billede lukker det');
 // a dish without photo: the drawing is enlarged
 const rid2=ids[1].split('/').pop();
 await pg.evaluate(id=>__TEST__.api.openRecipe(id),rid2);await pg.waitForTimeout(250);
 await pg.click('.hero-img .art.wide');await pg.waitForTimeout(150);
 ok(await q(()=>!!document.querySelector('#lb svg')),'Uden foto forstørres tegningen');
 ok(errs.length===0,'ingen JS-fejl '+errs.slice(0,2).join('|'));
 await b.close();T.done();
})();
