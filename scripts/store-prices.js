/* Normalpriser pr. butik for appens standardvarer. MODE=probe viser kun, hvordan kildesiderne ser ud (udvikling). */
'use strict';
var UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
async function get(u){var r=await fetch(u,{headers:{'User-Agent':UA,'Accept-Language':'da-DK,da;q=0.9'},redirect:'follow'});return{status:r.status,url:r.url,ct:r.headers.get('content-type'),text:await r.text()}}
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
if(require.main===module)(process.env.MODE==='probe'?probe():Promise.reject(new Error('kun probe endnu'))).catch(function(e){console.error(e);process.exit(1)});
