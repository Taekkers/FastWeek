/* FastWeek web platform layer: login (name + code), Firestore, shared JSON files, push, OCR.
   It gives the app the same small API as inside Claude: window.claude.use('db'|'user'|'assets'|'sample'). */
(function(){
'use strict';
var CFG=window.UGEKURV_CONFIG||{},FB=CFG.firebase||{};
var placeholder=!FB.apiKey||/^(DIN|YOUR|INDSAET|xxx)/i.test(FB.apiKey)||!FB.projectId||/^(DIN|YOUR|xxx)/i.test(FB.projectId);
var isIos=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function standalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return '&#'+c.charCodeAt(0)+';'})}
var overlay=null;
function mount(html){
  if(!overlay){overlay=document.createElement('div');overlay.id='login';document.body.appendChild(overlay)}
  overlay.innerHTML=html;overlay.hidden=false;
}
function hideLogin(){if(overlay)overlay.hidden=true}
/* ---------- setup missing ---------- */
if(placeholder||!window.firebase){
  window.UGEKURV_WEB={name:'',signOut:function(){},push:{status:function(){return Promise.resolve({state:'unsupported',msg:'Appen er ikke sat op endnu.'})}}};
  document.addEventListener('DOMContentLoaded',function(){
    mount('<div class="lg-card"><div class="lg-brand">Fast<i>Week</i></div><h1>Appen er ikke sat op endnu</h1><p>'+(window.firebase?'Åbn filen <b>config.js</b> og indsæt dine Firebase-oplysninger.':'Firebase kunne ikke indlæses. Tjek din internetforbindelse og prøv igen.')+'</p><p class="lg-fine">Se README.md for trin-for-trin guide.</p></div>');
  });
  return;
}
/* ---------- Firebase ---------- */
firebase.initializeApp(FB);
var auth=firebase.auth(),fs=firebase.firestore();
try{fs.settings({ignoreUndefinedProperties:true})}catch(e){}
try{var pr=fs.enablePersistence({synchronizeTabs:true});if(pr&&pr.catch)pr.catch(function(){})}catch(e){}
function sha(str){
  if(window.crypto&&crypto.subtle&&window.TextEncoder){
    return crypto.subtle.digest('SHA-256',new TextEncoder().encode(str)).then(function(b){return [].map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2)}).join('')});
  }
  var h=5381;for(var i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return Promise.resolve(('00000000'+(h>>>0).toString(16)).slice(-8).repeat(4));
}
function normName(n){return String(n||'').trim().replace(/\s+/g,' ').toLowerCase()}
function emailFor(name){return sha('ugekurv|'+normName(name)).then(function(h){return h.slice(0,32)+'@ugekurv.app'})}
var ERR={
  'auth/email-already-in-use':'Navnet er optaget. Vælg et andet, eller log ind.',
  'auth/weak-password':'Koden skal være mindst 6 tegn.',
  'auth/user-not-found':'Forkert navn eller kode.','auth/wrong-password':'Forkert navn eller kode.','auth/invalid-credential':'Forkert navn eller kode.','auth/invalid-login-credentials':'Forkert navn eller kode.',
  'auth/too-many-requests':'For mange forsøg. Vent lidt og prøv igen.',
  'auth/network-request-failed':'Ingen forbindelse. Tjek nettet og prøv igen.',
  'auth/operation-not-allowed':'Login med navn og kode er ikke slået til i Firebase. Se README.',
  'auth/invalid-api-key':'Firebase-nøglen i config.js er forkert.'
};
var mode='in',busy=false;
function showLogin(msg){
  var up=mode==='up';
  mount('<form class="lg-card" id="lg-form" autocomplete="on"><div class="lg-brand">Fast<i>Week</i></div>'+
    '<h1>'+(up?'Opret din bruger':'Log ind')+'</h1>'+
    '<p>'+(up?'Vælg et navn og en kode. Du får din egen madplan, dit eget lager og dine egne retter.':'Log ind for at se din egen ugeplan, dit lager og dine indkøb.')+'</p>'+
    '<label for="lg-n">Navn</label><input id="lg-n" name="username" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" required>'+
    '<label for="lg-p">Kode (mindst 6 tegn)</label><input id="lg-p" name="password" type="password" minlength="6" autocomplete="'+(up?'new-password':'current-password')+'" required>'+
    '<div class="lg-err" id="lg-e" role="alert">'+(msg?esc(msg):'')+'</div>'+
    '<button class="lg-btn" id="lg-b" type="submit">'+(up?'Opret bruger':'Log ind')+'</button>'+
    '<button class="lg-alt" id="lg-t" type="button">'+(up?'Har du en bruger? Log ind':'Ny her? Opret en bruger')+'</button>'+
    (up?'<p class="lg-fine">Der bruges ingen e-mail. Koden kan ikke nulstilles, så skriv den ned.</p>':'')+'</form>');
  var f=document.getElementById('lg-form');
  document.getElementById('lg-t').onclick=function(){mode=up?'in':'up';showLogin()};
  f.onsubmit=function(ev){ev.preventDefault();submit(up)};
}
function submit(up){
  if(busy)return;
  var n=document.getElementById('lg-n').value,p=document.getElementById('lg-p').value,e=document.getElementById('lg-e'),b=document.getElementById('lg-b');
  n=n.trim();if(n.length<2){e.textContent='Skriv et navn på mindst 2 tegn.';return}
  if(p.length<6){e.textContent='Koden skal være mindst 6 tegn.';return}
  busy=true;b.disabled=true;e.textContent='';
  emailFor(n).then(function(mail){
    return up?auth.createUserWithEmailAndPassword(mail,p).then(function(c){return c.user.updateProfile({displayName:n}).catch(function(){})}):auth.signInWithEmailAndPassword(mail,p);
  }).then(function(){busy=false}).catch(function(err){
    busy=false;b.disabled=false;var c=err&&err.code;e.textContent=ERR[c]||('Noget gik galt'+(c?' ('+c+')':'')+'. Prøv igen.');
  });
}
var authFirst=true,authRes;
var authReady=new Promise(function(r){authRes=r});
auth.onAuthStateChanged(function(u){
  if(u){hideLogin();if(authFirst){authFirst=false;authRes(u)}}
  else if(authFirst){showLogin()}
  else{location.reload()}
});
/* ---------- db layer (same shape as inside Claude) ---------- */
function wrapDoc(ref){
  return{id:ref.id,
    get:function(){return ref.get()},
    set:function(d){return ref.set(d)},
    update:function(d){return ref.set(d,{merge:true})},
    delete:function(){return ref.delete()},
    onSnapshot:function(cb,err){return ref.onSnapshot(cb,err||function(){})}};
}
var STATIC={offers:'data/offers.json',ref:'data/ref.json',starter:'data/starter.json'};
function staticCol(name){
  return{onSnapshot:function(cb,err){
    var live=true,t0=Date.now();
    function go(force){
      fetch(STATIC[name]+(force?'?t='+Date.now():''),{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.json()}).then(function(j){
        if(!live)return;
        cb({docs:Object.keys(j).map(function(k){return{id:k,data:function(){return JSON.parse(JSON.stringify(j[k]))}}})});
      }).catch(function(e){if(live&&err)err(e)});
    }
    function vis(){if(!document.hidden&&Date.now()-t0>3600e3){t0=Date.now();go(true)}}
    document.addEventListener('visibilitychange',vis);go(false);
    return function(){live=false;document.removeEventListener('visibilitychange',vis)};
  }};
}
var dbApi={
  doc:function(p){return wrapDoc(fs.doc(p))},
  collection:function(p){
    if(STATIC[p])return staticCol(p);
    var c=fs.collection(p);
    return{onSnapshot:function(cb,err){return c.onSnapshot(cb,err||function(){})},doc:function(id){return wrapDoc(c.doc(id))}};
  }
};
/* ---------- push ---------- */
function u8(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var r=atob(s),a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a}
function pushSupported(){return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window}
function swReady(){return Promise.race([navigator.serviceWorker.ready,new Promise(function(_,rej){setTimeout(function(){rej(new Error('sw-timeout'))},4000)})])}
function subDoc(sub){return authReady.then(function(u){return sha(sub.endpoint).then(function(h){return fs.doc('data/users/'+u.uid+'/u/push/'+h.slice(0,24))})})}
var push={
  status:function(){
    if(!CFG.vapidPublicKey)return Promise.resolve({state:'unsupported',msg:'Notifikationer er ikke sat op endnu (VAPID-nøgle mangler i config.js).'});
    if(isIos&&!standalone())return Promise.resolve({state:'needhome'});
    if(!pushSupported())return Promise.resolve({state:'unsupported',msg:'Din browser understøtter ikke notifikationer.'});
    if(Notification.permission==='denied')return Promise.resolve({state:'denied'});
    return swReady().then(function(r){return r.pushManager.getSubscription()}).then(function(s){return{state:s&&Notification.permission==='granted'?'on':'off'}},function(){return{state:'unsupported',msg:'Notifikationer kræver, at appen er åbnet fra sin https-adresse. Prøv at genindlæse siden.'}});
  },
  enable:function(){
    if(!pushSupported())return Promise.reject(new Error('Din browser understøtter ikke notifikationer.'));
    return Notification.requestPermission().then(function(perm){
      if(perm!=='granted')throw new Error('Notifikationer blev ikke tilladt.');
      return swReady();
    }).then(function(reg){
      return reg.pushManager.getSubscription().then(function(s){return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(CFG.vapidPublicKey)})});
    }).then(function(sub){
      var j=sub.toJSON();
      return subDoc(j).then(function(d){return d.set({endpoint:j.endpoint,keys:j.keys,ts:Date.now(),ua:navigator.userAgent.slice(0,90)})});
    });
  },
  disable:function(){
    return swReady().then(function(r){return r.pushManager.getSubscription()}).then(function(sub){
      if(!sub)return;var j=sub.toJSON();
      return subDoc(j).then(function(d){return d.delete().catch(function(){})}).then(function(){return sub.unsubscribe()});
    });
  },
  test:function(){return swReady().then(function(r){return r.showNotification('FastWeek',{body:'Sådan ser en påmindelse ud. God madlavning!',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'ugekurv-test',data:{url:'./'}})})}
};
function syncPush(){
  if(!CFG.vapidPublicKey||!pushSupported()||Notification.permission!=='granted')return;
  swReady().then(function(r){return r.pushManager.getSubscription()}).then(function(sub){
    if(!sub)return;var j=sub.toJSON();
    return subDoc(j).then(function(d){return d.set({endpoint:j.endpoint,keys:j.keys,ts:Date.now(),ua:navigator.userAgent.slice(0,90)})});
  }).catch(function(){});
}
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
/* ---------- free cookbook reading in the browser (OCR) ---------- */
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('script'))};document.head.appendChild(s)})}
var sample={
  limits:function(){return Promise.resolve({images:true})},
  json:function(prompt,opts){
    opts=opts||{};var files=[].slice.call(opts.images||[]),sig=opts.signal;
    return (window.UgekurvOCR?Promise.resolve():loadScript('ocr.js?v=12')).then(function(){
      if(sig&&sig.aborted)throw{code:'cancelled'};
      var W=window.UGEKURV_WEB,known=W&&W.known?W.known():[],key=W&&W.aiKey?W.aiKey():'';
      var tess=function(){return window.UgekurvOCR.readRecipe(files,sig,known,opts.onStep)};
      if(!key)return tess();
      /* AI reading first; if Gemini cannot be reached or the key is wrong, the built-in reader takes over */
      return window.UgekurvOCR.readWithGemini(files,key,sig,known,opts.onStep).catch(function(e){
        if(e&&(e.code==='cancelled'||e.name==='AbortError'))throw{code:'cancelled'};
        if(opts.onStep)opts.onStep('Gemini svarede ikke ('+((e&&e.code)==='bad_key'?'nøglen virker ikke':(e&&e.code)==='rate_limited'?'dagens kvote er brugt':'ingen forbindelse')+'). Bruger den indbyggede læser…');
        return tess().then(function(o){o.warn=(e&&e.code)||'unavailable';return o});
      });
    });
  }
};
/* ---------- public ---------- */
window.UGEKURV_WEB={
  get name(){var u=auth.currentUser;return (u&&u.displayName)||''},
  signOut:function(){
    /* remove this device from the user's push list first, so the next person on the same phone does not get their reminders */
    var done=function(){auth.signOut()};
    if(!CFG.vapidPublicKey||!pushSupported()||Notification.permission!=='granted'){done();return}
    Promise.race([swReady().then(function(r){return r.pushManager.getSubscription()}).then(function(sub){if(!sub)return;return subDoc(sub.toJSON()).then(function(d){return d.delete()})}),new Promise(function(r){setTimeout(r,2500)})]).then(done,done);
  },
  push:push
};
window.claude={use:function(n){
  if(n==='db')return authReady.then(function(){return dbApi});
  if(n==='user')return authReady.then(function(u){return{id:function(){return Promise.resolve(u.uid)},can:function(){return true},isOwner:function(){return false},canEdit:function(){return false}}});
  if(n==='assets')return Promise.resolve(null);
  if(n==='sample')return Promise.resolve(sample);
  return Promise.resolve(null);
}};
authReady.then(syncPush);
})();
