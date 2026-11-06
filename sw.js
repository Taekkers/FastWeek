/* FastWeek service worker: works offline in the shop, and shows push notifications. */
var V='fastweek-v10';
var SHELL=['./','index.html','config.js','platform-web.js','ocr.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
var CDN=['https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(V).then(function(c){
    return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}).concat(CDN.map(function(u){return c.add(new Request(u,{mode:'cors'})).catch(function(){})})));
  }).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
function networkFirst(req){
  return fetch(req).then(function(r){if(r&&r.ok){var cp=r.clone();caches.open(V).then(function(c){c.put(req,cp)})}return r}).catch(function(){return caches.match(req).then(function(m){return m||(req.mode==='navigate'?caches.match('index.html'):Response.error())})});
}
function staleWhileRevalidate(req){
  return caches.match(req).then(function(m){
    var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque')){var cp=r.clone();caches.open(V).then(function(c){c.put(req,cp)})}return r}).catch(function(){return m});
    return m||net;
  });
}
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var u=new URL(req.url);
  if(u.origin===location.origin){e.respondWith(networkFirst(req));return}
  if(u.hostname==='www.gstatic.com'&&u.pathname.indexOf('/firebasejs/')===0||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'||u.hostname==='cdn.jsdelivr.net'){e.respondWith(staleWhileRevalidate(req));return}
});
self.addEventListener('push',function(e){
  var d={};try{d=e.data?e.data.json():{}}catch(x){try{d={body:e.data.text()}}catch(y){}}
  var title=d.title||'FastWeek';
  e.waitUntil(self.registration.showNotification(title,{body:d.body||'Tid til at lave ugens madplan og tjekke indkøbslisten.',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:d.tag||'fastweek',data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var url=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){if('focus' in cs[i])return cs[i].focus()}
    return self.clients.openWindow?self.clients.openWindow(url):null;
  }));
});
