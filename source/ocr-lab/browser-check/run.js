/* Runs the app's photo reading (ocr.js + the real Tesseract.js from the CDN, Danish model) in Chromium and WebKit
   on a look-alike cookbook page. Used from .github/workflows/ocr-check.yml. */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium,webkit}=require('playwright');
const ROOT=path.join(__dirname,'..','..','..');
const files={'/ocr_live.js':path.join(ROOT,'ocr.js'),'/ocr_next.js':path.join(__dirname,'ocr_next.js'),
  '/look_2048.jpg':path.join(__dirname,'look_2048.jpg'),'/look_4032.jpg':path.join(__dirname,'look_4032.jpg')};
const srv=http.createServer((q,r)=>{const f=files[q.url.split('?')[0]];if(q.url==='/'){r.writeHead(200,{'content-type':'text/html'});return r.end('<!doctype html><meta charset=utf-8><input type=file id=f>')}
  if(!f){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript; charset=utf-8':'image/jpeg'});fs.createReadStream(f).pipe(r)});
(async()=>{
  await new Promise(r=>srv.listen(8099,r));
  for(const [ename,eng] of [['chromium',chromium],['webkit',webkit]]){
    const b=await eng.launch();
    for(const ver of ['live','next']){
      for(const img of ['look_2048.jpg','look_4032.jpg']){
        const pg=await b.newPage();const logs=[];pg.on('console',m=>logs.push(m.text()));pg.on('pageerror',e=>logs.push('PAGEERROR '+e.message));
        await pg.goto('http://localhost:8099/');
        await pg.addScriptTag({url:'/ocr_'+ver+'.js'});
        await pg.setInputFiles('#f',path.join(__dirname,img));
        const t0=Date.now();
        const r=await pg.evaluate(()=>{const steps=[];return window.UgekurvOCR.readRecipe([document.getElementById('f').files[0]],null,[],t=>steps.push(t))
          .then(o=>({name:o.name,servings:o.servings,ing:o.ingredients.map(g=>g.q+' '+g.u+' '+g.n),raw:String(o.raw||'').slice(0,900),steps}),e=>({err:String(e&&(e.code||e.message)||e)}))}).catch(e=>({err:'evaluate: '+e.message}));
        console.log('\n==== '+ename+' | ocr.js '+ver+' | '+img+' | '+Math.round((Date.now()-t0)/1000)+' s');
        if(r.err)console.log('FEJL: '+r.err);
        else{console.log('titel: '+r.name+' | pers: '+r.servings+' | trin: '+r.steps.join(' > '));console.log('ingredienser ('+r.ing.length+'): '+r.ing.join(', '));console.log('læst tekst (start):\n'+r.raw)}
        if(logs.length)console.log('konsol: '+logs.slice(0,5).join(' | '));
        await pg.close();
      }
    }
    await b.close();
  }
  /* production: the live page and the ocr.js it serves, in WebKit with an iPhone profile */
  const {devices}=require('playwright');
  const wb=await webkit.launch();const ctx=await wb.newContext(devices['iPhone 13']);const pg=await ctx.newPage();
  const resp=await pg.goto('https://taekkers.github.io/FastWeek/',{waitUntil:'load'});
  const h=await (await pg.request.get('https://taekkers.github.io/FastWeek/ocr.js?v=8')).headers();
  console.log('\n==== live site: status '+resp.status()+' | ocr.js content-type: '+h['content-type']+' | cache-control: '+h['cache-control']);
  await pg.evaluate(()=>{const i=document.createElement('input');i.type='file';i.id='f';document.body.appendChild(i)});
  await pg.addScriptTag({url:'https://taekkers.github.io/FastWeek/ocr.js?v=8'});
  for(const img of ['look_2048.jpg','look_4032.jpg']){
    await pg.setInputFiles('#f',path.join(__dirname,img));const t0=Date.now();
    const r=await pg.evaluate(()=>{const steps=[];return window.UgekurvOCR.readRecipe([document.getElementById('f').files[0]],null,[],t=>steps.push(t)).then(o=>({ing:o.ingredients.map(g=>g.q+' '+g.u+' '+g.n),steps}),e=>({err:String(e&&(e.code||e.message)||e)}))});
    console.log('live ocr.js, iPhone-profil, '+img+', '+Math.round((Date.now()-t0)/1000)+' s: '+(r.err?'FEJL '+r.err:r.ing.length+' ingredienser: '+r.ing.join(', ')));
  }
  await wb.close();
  srv.close();
})().catch(e=>{console.error(e);process.exit(1)});
