const T=require('./pw9.js');const {launch,ok,bad,owner}=T;
(async()=>{
 const D=owner('uA');const P0='data/users/uA/u/';
 Object.keys(T.starters).forEach(id=>{if(!D[P0+'recipes/'+id])D[P0+'recipes/'+id]=Object.assign({},T.starters[id],{example:false})});
 const {b,pg,errs}=await launch({uid:'uA',docs:D,wait:1500});
 const sh=(n)=>pg.screenshot({path:'/tmp/claude-0/shot_15_'+n+'.png'});
 const q=(f)=>pg.evaluate(f);

 // ===== A. side menu =====
 let r=await q(()=>({tabs:!!document.querySelector('#tabs,.tab'),btn:!!document.querySelector('#menubtn'),cur:document.querySelector('#cur').textContent,pad:getComputedStyle(document.body).paddingBottom}));
 ok(!r.tabs&&r.btn,'bottom tab bar is gone, hamburger button is there');
 ok(r.cur==='Ugeplan','header shows current section: '+r.cur+' (body bottom padding '+r.pad+')');
 await sh('week');
 await pg.click('#menubtn');await pg.waitForTimeout(350);
 r=await q(()=>({open:!!document.querySelector('#menu .dr'),lock:document.body.classList.contains('lock'),exp:document.querySelector('#menubtn').getAttribute('aria-expanded'),items:[...document.querySelectorAll('#menu .dr-i')].map(e=>e.innerText.trim()),on:(document.querySelector('#menu .dr-i.on')||{}).innerText,w:document.querySelector('#menu .dr').getBoundingClientRect().width}));
 ok(r.open&&r.lock&&r.exp==='true','menu opens, page locked, aria-expanded=true');
 ok(r.items.join('|').replace(/\d+$/gm,'').includes('Ugeplan|Lager|Indkøb|Mine retter|Scan kogebog|Favoritter|Indstillinger'),'menu items: '+r.items.join(' | '));
 ok(r.on==='Ugeplan','current section highlighted; drawer width '+r.w);
 await sh('menu');
 await pg.keyboard.press('Escape');await pg.waitForTimeout(100);
 r=await q(()=>({open:!!document.querySelector('#menu .dr'),lock:document.body.classList.contains('lock'),exp:document.querySelector('#menubtn').getAttribute('aria-expanded')}));
 ok(!r.open&&!r.lock&&r.exp==='false','Escape closes the menu and unlocks the page');
 await pg.click('#menubtn');await pg.waitForTimeout(100);await pg.mouse.click(370,400);await pg.waitForTimeout(100);
 ok(!(await q(()=>!!document.querySelector('#menu .dr'))),'tap on the dimmed area closes the menu');
 await pg.click('#menubtn');await pg.waitForTimeout(100);
 await q(()=>{const d=document.querySelector('.dr');const mk=(t,x)=>new Touch({identifier:1,target:d,clientX:x,clientY:300});
   d.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[mk(0,250)]}));d.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[mk(0,120)]}))});
 await pg.waitForTimeout(100);
 ok(!(await q(()=>!!document.querySelector('#menu .dr'))),'swipe left on the menu closes it');
 for(const [go,exp] of [['stock','Lager'],['shop','Indkøb'],['week','Ugeplan']]){
   await pg.click('#menubtn');await pg.click('#menu [data-go="'+go+'"]');await pg.waitForTimeout(150);
   r=await q(()=>({cur:document.querySelector('#cur').textContent,open:!!document.querySelector('#menu .dr'),lock:document.body.classList.contains('lock')}));
   ok(r.cur===exp&&!r.open&&!r.lock,'menu -> '+exp+' switches the view and closes the menu');
 }
 for(const [go,title] of [['gear','Indstillinger'],['recs','Mine retter'],['scan','Scan kogebog'],['favs','Favoritter']]){
   await pg.click('#menubtn');await pg.click('#menu [data-go="'+go+'"]');await pg.waitForTimeout(250);
   r=await q(()=>({t:(document.querySelector('.sh-head h2')||{}).textContent,open:!!document.querySelector('#menu .dr'),lock:document.body.classList.contains('lock')}));
   ok(r.t&&!r.open&&r.lock,'menu -> '+go+' opens the sheet "'+r.t+'" (menu closed, page locked)');
   if(go==='gear')await sh('gear');
   await pg.keyboard.press('Escape');await pg.waitForTimeout(100);
   ok(!(await q(()=>document.body.classList.contains('lock'))),'  sheet closed, page unlocked');
 }
 const nm=await q(()=>({b:document.querySelector('#toast')&&getComputedStyle(document.querySelector('#toast')).bottom}));

 // ===== C. Indkøb: bought items at the bottom =====
 await q(()=>{const A=__TEST__.api;A.ACT.tab({tab:'shop'})});await pg.waitForTimeout(200);
 let n0=await q(()=>document.querySelectorAll('[data-chk]').length);
 if(n0<4){await q(()=>{const A=__TEST__.api;try{A.generate()}catch(e){}});await pg.waitForTimeout(600);n0=await q(()=>document.querySelectorAll('[data-chk]').length)}
 console.log('shopping rows:',n0);
 ok(n0>=4,'shopping list has items ('+n0+')');
 const names0=await q(()=>[...document.querySelectorAll('.it .it-n')].map(e=>e.textContent));
 await sh('shop_before');
 // tick the first two items
 const tick=names0.slice(0,2);console.log('ticking',JSON.stringify(names0.slice(0,4)));
 for(const nme of tick){await pg.click('label.it:has(.it-n:text-is("'+nme+'")) input');await pg.waitForTimeout(600)}
 r=await q(()=>{const b=document.querySelector('.bought');const all=[...document.querySelectorAll('label.it')];const bi=b?all.filter(e=>b.contains(e)).map(e=>e.querySelector('.it-n').textContent):[];
   const openOnes=all.filter(e=>!b||!b.contains(e));const lastOpenIdx=all.indexOf(openOnes[openOnes.length-1]),firstDoneIdx=b?all.indexOf(all.filter(e=>b.contains(e))[0]):-1;
   return{has:!!b,label:b&&b.querySelector('.lbl').textContent,bought:bi,checkedOutside:openOnes.filter(e=>e.classList.contains('on')).length,order:firstDoneIdx>lastOpenIdx,btn:!!document.querySelector('[data-act="tostock"]')}});
 ok(r.has&&/^Købt \(2\)/.test(r.label)&&tick.every(t=>r.bought.includes(t)),'ticked items moved to "'+r.label+'": '+r.bought.join(', '));
 ok(r.checkedOutside===0&&r.order,'no ticked item left above, "Købt" is below everything still to buy');
 ok(r.btn,'"Læg afkrydsede på lageret" still there');
 await sh('shop_after');
 // untick one -> returns to its group
 await pg.click('.bought label.it:first-child input');await pg.waitForTimeout(250);
 r=await q(()=>({label:(document.querySelector('.bought')||{querySelector:()=>({textContent:'(none)'})}).querySelector('.lbl').textContent}));
 ok(/^Købt \(1\)/.test(r.label),'unticking brings it back ('+r.label+')');
 // tick everything
 await q(()=>{document.querySelectorAll('label.it:not(.on) input').forEach(i=>{});});
 const total=await q(()=>document.querySelectorAll('[data-chk]').length);
 for(let i=0;i<total;i++){const el=await pg.$('label.it:not(.on) input');if(!el)break;await el.click();await pg.waitForTimeout(80)}
 r=await q(()=>({hint:/Alt fra madplanen er krydset af/.test(document.querySelector('#view').innerText),open:document.querySelectorAll('label.it:not(.on)').length}));
 ok(r.open===0&&r.hint,'everything ticked -> message "Alt fra madplanen er krydset af"');
 await sh('shop_all');

 // ===== B. Lager: used-up items under "Mangler" =====
 const info=await q(()=>{const A=__TEST__.api,S=A.S,ks=Object.keys(S.pantry.items),zero=ks.filter(k=>!(A.curQty(S.pantry.items[k])>0));
   return{n:ks.length,zero:zero.length,names:zero.slice(0,3).map(k=>S.pantry.items[k].name)}});
 console.log('pantry:',JSON.stringify(info));
 // make two items used up so the test does not depend on the demo data
 const z=await q(()=>{const A=__TEST__.api,S=A.S,ks=Object.keys(S.pantry.items);ks.slice(0,6).forEach(k=>{S.pantry.items[k].qty=500;S.pantry.items[k].unit='g'});ks.slice(6).forEach(k=>{S.pantry.items[k].qty=0});return ks.slice(6,8).map(k=>S.pantry.items[k].name)});
 await pg.click('#menubtn');await pg.click('#menu [data-go="stock"]');await pg.waitForTimeout(200);
 r=await q(()=>{const g=document.querySelector('#goneBox');return{has:!!g,open:g&&g.open,label:g&&g.querySelector('summary').innerText,rows:g?g.querySelectorAll('.li').length:0,above:g?[...document.querySelectorAll('#stockList .li')].filter(e=>!g.contains(e)).length:0}});
 ok(r.has&&!r.open&&/^Mangler \(\d+\)/i.test(r.label)&&r.rows>=2&&r.above>0,'Lager: '+r.above+' items on hand first, "'+r.label.trim()+'" collapsed at the bottom with '+r.rows+' rows');
 const visHidden=await q(()=>{const g=document.querySelector('#goneBox .li');return g?(g.checkVisibility?(g.checkVisibility()?1:0):g.offsetHeight):-1});
 ok(visHidden===0,'closed "Mangler" shows no rows');
 await sh('stock');
 await pg.click('#goneBox summary');await pg.waitForTimeout(150);
 ok(await q(()=>document.querySelector('#goneBox').open),'tap on Mangler opens it');
 await sh('stock_open');
 await pg.fill('#sq',z[0].slice(0,4));await pg.waitForTimeout(150);
 r=await q(()=>({txt:document.querySelector('#stockList').innerText,open:document.querySelector('#goneBox')&&document.querySelector('#goneBox').open}));
 ok(new RegExp(z[0],'i').test(r.txt),'search still finds a used-up item ('+z[0]+')');
 await pg.fill('#sq','');

 // ===== D. Ny ret form =====
 await q(()=>__TEST__.api.openRecipe(''));await pg.waitForTimeout(200);
 r=await q(()=>{const vis=id=>{const e=document.getElementById(id);if(!e)return null;return e.checkVisibility()};
   return{name:vis('rf-name'),book:vis('rf-book'),page:vis('rf-page'),kind:vis('rf-kind'),min:vis('rf-min'),ing:vis('rf-ings'),
     rate:vis('rf-rate'),url:vis('rf-url'),prot:vis('rf-prot'),again:vis('rf-again'),fav:vis('rf-fav'),rest:vis('rf-rest'),method:vis('rf-method'),more:document.querySelector('#rf-more').open,
     h:document.querySelector('.sh-body').scrollHeight,all:[...document.querySelectorAll('.sh-body label,.sh-body summary .lbl')].map(e=>e.textContent.trim()).filter(Boolean).slice(0,30)}});
 ok(r.name&&r.book&&r.page&&r.kind&&r.min&&r.ing,'essentials visible: Navn, Kogebog, Side, Type, Minutter, Ingredienser');
 ok(!r.rate&&!r.url&&!r.prot&&!r.again&&!r.fav&&!r.rest&&!r.method&&!r.more,'the rest is folded under "Flere valg"');
 console.log('form height closed:',r.h);
 await sh('form_closed');
 await pg.click('#rf-more summary');await pg.waitForTimeout(150);
 r=await q(()=>{const vis=id=>document.getElementById(id).checkVisibility();return{rate:vis('rf-rate'),url:vis('rf-url'),prot:vis('rf-prot'),again:vis('rf-again'),fav:vis('rf-fav'),rest:vis('rf-rest'),method:vis('rf-method'),h:document.querySelector('.sh-body').scrollHeight}});
 ok(r.rate&&r.url&&r.prot&&r.again&&r.fav&&r.rest&&r.method,'"Flere valg" opens with all seven fields');
 console.log('form height open:',r.h);
 await sh('form_open');
 // save a new dish using fields from both parts
 await pg.fill('#rf-name','Test-ret Ø');await pg.fill('#rf-book','Testbogen');await pg.fill('#rf-page','12');await pg.fill('#rf-min','25');
 await pg.selectOption('#rf-rate','4');await pg.check('#rf-fav');await pg.fill('#rf-method','Trin ét\nTrin to');
 await pg.fill('#rf-ings .i-n >> nth=0','pasta');await pg.fill('#rf-ings .i-q >> nth=0','200');
 await pg.click('[data-act="saverec"]');await pg.waitForTimeout(500);
 const sv=await q(()=>{const S=__TEST__.api.S,id=Object.keys(S.recipes).find(k=>S.recipes[k].name==='Test-ret Ø');const x=S.recipes[id];return x&&{book:x.book,page:x.page,min:x.minutes,rate:x.rating,fav:x.fav,method:x.method,ing:x.ing.length}});
 ok(sv&&sv.book==='Testbogen'&&sv.page===12&&sv.min===25&&sv.rate===4&&sv.fav===true&&/Trin ét/.test(sv.method)&&sv.ing>=1,'saving works with the folded fields: '+JSON.stringify(sv));

 // ===== E. errors =====
 ok(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 await b.close();T.done();
})().catch(e=>{console.error(e);process.exit(1)});
