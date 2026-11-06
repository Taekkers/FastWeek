/* Sender en ugentlig påmindelse til alle, der har slået notifikationer til.
   Køres af GitHub Actions (se github-workflow/weekly-push.yml). Kræver:
     FIREBASE_SERVICE_ACCOUNT  hele JSON-filen fra Firebase (Service accounts -> Generate new private key)
     VAPID_PRIVATE_KEY         den private nøgle fra tools/vapid.html
     VAPID_SUBJECT             f.eks. mailto:din@mail.dk
   Valgfrit: VAPID_PUBLIC_KEY (ellers læses den fra config.js), PUSH_TITLE, PUSH_BODY, DRY_RUN=1 (send intet, tæl kun). */
'use strict';
var fs = require('fs'), path = require('path');

function publicKey(env, root) {
  if (env.VAPID_PUBLIC_KEY) return env.VAPID_PUBLIC_KEY.trim();
  try {
    var t = fs.readFileSync(path.join(root, 'config.js'), 'utf8');
    var m = t.match(/vapidPublicKey\s*:\s*["']([A-Za-z0-9_-]{80,100})["']/);
    if (m) return m[1];
  } catch (e) {}
  return '';
}

async function run(deps) {
  var admin = deps.admin, webpush = deps.webpush, env = deps.env || process.env, log = deps.log || console.log;
  var root = deps.root || path.join(__dirname, '..');
  var dry = env.DRY_RUN === '1' || env.DRY_RUN === 'true';
  var pub = publicKey(env, root);
  if (!env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT mangler (GitHub: Settings -> Secrets and variables -> Actions).');
  if (!env.VAPID_PRIVATE_KEY || !pub) throw new Error('VAPID_PRIVATE_KEY eller den offentlige nøgle mangler.');
  if (!/^(mailto:|https:\/\/)/.test(env.VAPID_SUBJECT || '')) throw new Error('VAPID_SUBJECT skal starte med mailto: eller https://');
  var cred = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  if (!admin.apps || !admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(cred) });
  var db = admin.firestore();
  webpush.setVapidDetails(env.VAPID_SUBJECT, pub, env.VAPID_PRIVATE_KEY);
  var payload = JSON.stringify({
    title: env.PUSH_TITLE || 'FastWeek',
    body: env.PUSH_BODY || 'Ugens tilbud er klar. Tid til at lave madplan og tjekke indkøbslisten.',
    url: './', tag: 'fastweek-uge'
  });
  // Hver bruger ligger i data/users/<uid>/u/push/<enhed>. Vi går brugerne igennem uden at bruge indekser.
  var cols = await db.doc('data/users').listCollections();
  var sent = 0, removed = 0, failed = 0, devices = 0, users = 0;
  for (var i = 0; i < cols.length; i++) {
    var snap = await cols[i].doc('u').collection('push').get();
    if (snap.empty) continue;
    users++;
    for (var j = 0; j < snap.docs.length; j++) {
      var d = snap.docs[j], s = d.data();
      if (!s || !s.endpoint || !s.keys) continue;
      devices++;
      if (dry) continue;
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 60 * 60 * 24 });
        sent++;
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) { await d.ref.delete(); removed++; }
        else { failed++; log('Fejl ved afsendelse (' + (e && e.statusCode) + '): ' + (e && e.body ? String(e.body).slice(0, 120) : e && e.message)); }
      }
    }
  }
  log((dry ? '[TØRKØRSEL] ' : '') + 'Brugere med notifikationer: ' + users + ', enheder: ' + devices + ', sendt: ' + sent + ', fjernet (udløbet): ' + removed + ', fejlet: ' + failed);
  return { users: users, devices: devices, sent: sent, removed: removed, failed: failed };
}

module.exports = { run: run, publicKey: publicKey };

if (require.main === module) {
  var deps = { admin: require('firebase-admin'), webpush: require('web-push') };
  run(deps).then(function (r) { if (r.failed && !r.sent && r.devices) process.exit(1); }, function (e) { console.error(e.message); process.exit(1); });
}
