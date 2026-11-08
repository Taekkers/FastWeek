/* Normalpriser pr. butik for appens standardvarer. MODE=probe viser kun, hvordan kildesiderne ser ud (udvikling). */
'use strict';
var UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
async function get(u){var r=await fetch(u,{headers:{'User-Agent':UA,'Accept-Language':'da-DK,da;q=0.9'},redirect:'follow'});return{status:r.status,url:r.url,ct:r.headers.get('content-type'),text:await r.text()}}
async function probe2(){
  var r=await get('https://prej.dk/produkt/lurpak-smoer-saltet-9'),t=r.text;
  var body=t.slice(t.indexOf('<body'));
  var i=body.indexOf('365discount');console.log('#### BUTIKSLISTE:\n'+body.slice(Math.max(0,i-2500),i+6000));
  var j=t.indexOf('application/ld+json');if(j>-1)console.log('#### LDJSON:\n'+t.slice(j,j+2500));
  var sm=await get('https://prej.dk/sitemap-index.xml');console.log('#### SITEMAP-INDEX '+sm.status+'\n'+sm.text.slice(0,1500));
  var locs=(sm.text.match(/<loc>([^<]+)<\/loc>/g)||[]).map(function(x){return x.replace(/<\/?loc>/g,'')});
  for(var u of locs.slice(0,6)){var x=await get(u);var ps=(x.text.match(/<loc>([^<]+)<\/loc>/g)||[]);console.log('#### '+u+' '+x.status+' '+ps.length+' urls, fx '+ps.slice(0,5).join(' ').replace(/<\/?loc>/g,''))}
  for(var q of ['https://prej.dk/sog?q=smoer','https://prej.dk/?q=smoer','https://prej.dk/api/search?q=smoer','https://prej.dk/soeg/smoer']){var y=await get(q);console.log('#### '+q+' -> '+y.status+' '+y.ct+' '+(y.text.match(/\/produkt\/[a-z0-9-]+/g)||[]).length+' produktlinks')}
}
async function probe(){
  var urls=['https://prej.dk/soeg?q=hakket%20oksek%C3%B8d','https://prej.dk/search?q=hakket%20oksek%C3%B8d','https://prej.dk/produkt/lurpak-smoer-saltet-9','https://prej.dk/kategori/koed','https://prej.dk/robots.txt','https://prej.dk/sitemap.xml','https://api.digital.rema1000.dk/api/v3/products?search=hakket%20oksek%C3%B8d'];
  for(var u of urls){
    try{var r=await get(u);console.log('\n#### '+u+' -> '+r.status+' '+r.ct+' '+r.text.length+' bytes, final '+r.url);
      var t=r.text;
      var links=(t.match(/\/produkt\/[a-z0-9-]+/g)||[]).slice(0,15);console.log('produkt-links: '+links.join(' '));
      var api=(t.match(/https?:\/\/[a-z0-9.-]*api[a-z0-9.-]*[^"'\s]{0,80}/gi)||[]).slice(0,10);console.log('api-urls: '+api.join(' '));
      var nd=t.indexOf('__NEXT_DATA__');if(nd>-1)console.log('NEXT_DATA: '+t.slice(nd,nd+1500));
      var i=t.search(/[0-9],[0-9]{2}\s*kr/);if(i>-1)console.log('omkring pris: '+t.slice(Math.max(0,i-1500),i+1500).replace(/\s+/g,' '));
      if(/robots|sitemap/.test(u))console.log(t.slice(0,1500));
      if(/rema1000/.test(u))console.log(t.slice(0,1500));
    }catch(e){console.log('#### '+u+' FEJL '+e.message)}
  }
}
if(require.main===module)(process.env.MODE==='probe'?probe2():Promise.reject(new Error('kun probe endnu'))).catch(function(e){console.error(e);process.exit(1)});
