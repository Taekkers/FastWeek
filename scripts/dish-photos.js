/* Finder et foto af hver ret ved at søge på rettens fulde navn (billedsøgning), og gemmer link til fotoet på retten.
   Køres af GitHub Actions (.github/workflows/dish-photos.yml).
     MODE=apply    (standard) går alle brugeres retter igennem og gemmer foto på dem, der mangler et. Kræver FIREBASE_SERVICE_ACCOUNT.
     MODE=preview  søger kun for startretterne i data/starter.json og skriver out/preview.json + billederne i out/img/ (intet gemmes i databasen).
   Fotoet ejes af den side, det kommer fra. Appen viser altid sidens navn og et link til siden. */
'use strict';
var fs = require('fs'), path = require('path');
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
// billedbureauer (vandmærker), sociale medier og video: aldrig
var BAD = /(shutterstock|istockphoto|gettyimages|alamy|dreamstime|123rf|depositphotos|stock\.adobe|adobestock|vecteezy|freepik|canstockphoto|bigstock|pond5|fbsbx|facebook|instagram|tiktok|youtube|ytimg|twimg|x\.com|twitter|wikimedia|wikipedia|amazon|ebay|aliexpress|temu)/i;
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
function dec(s) { return String(s || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'); }

async function get(url, opt) {
  opt = opt || {};
  var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, opt.timeout || 12000);
  try { return await fetch(url, { headers: Object.assign({ 'User-Agent': UA, 'Accept-Language': 'da-DK,da;q=0.9,en;q=0.6' }, opt.headers || {}), redirect: 'follow', signal: ctl.signal }); }
  finally { clearTimeout(t); }
}
async function bing(q) {
  var r = await get('https://www.bing.com/images/async?q=' + encodeURIComponent(q) + '&first=0&count=35&mmasync=1&setlang=da&cc=DK&adlt=strict');
  if (!r.ok) throw new Error('bing ' + r.status);
  var t = await r.text(), out = [], re = /\sm="(\{[^"]*\})"/g, m;
  while ((m = re.exec(t))) { try { var j = JSON.parse(dec(m[1])); if (j.murl) out.push({ u: j.murl, p: j.purl || '', t: j.t || '' }); } catch (e) {} }
  return out;
}
async function ddg(q) {
  var r = await get('https://duckduckgo.com/?q=' + encodeURIComponent(q) + '&iax=images&ia=images');
  var h = await r.text(), v = (h.match(/vqd=["']?([\d-]+)/) || [])[1];
  if (!v) throw new Error('ddg vqd');
  var r2 = await get('https://duckduckgo.com/i.js?l=dk-da&o=json&q=' + encodeURIComponent(q) + '&vqd=' + v + '&f=,,,,,&p=1', { headers: { Referer: 'https://duckduckgo.com/' } });
  var j = await r2.json();
  return (j.results || []).map(function (x) { return { u: x.image, p: x.url, t: x.title, w: x.width, h: x.height }; });
}
/* størrelse direkte fra filens hoved: JPEG, PNG, WebP */
function dims(b) {
  if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    var k = b.toString('ascii', 12, 16);
    if (k === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (k === 'VP8L') { var n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
    if (k === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    var i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      var mk = b[i + 1], len = b.readUInt16BE(i + 2);
      if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}
async function check(u) {
  try {
    var r = await get(u, { timeout: 10000 });       // ingen Referer: sådan henter appen det også
    if (!r.ok) return null;
    var ct = r.headers.get('content-type') || '';
    if (!/^image\/(jpeg|jpg|png|webp)/i.test(ct)) return null;
    var b = Buffer.from(await r.arrayBuffer());
    if (b.length < 20000 || b.length > 8e6) return null;
    var d = dims(b); if (!d || d.w < 500 || d.h < 320) return null;
    var ar = d.w / d.h; if (ar < 0.66 || ar > 2.1) return null;
    return { w: d.w, h: d.h, buf: b, ct: ct };
  } catch (e) { return null; }
}
/* Søg på rettens fulde navn. "opskrift" holder søgningen på mad (ikke vandløb, steder eller råvarer). */
async function find(name, skip, log) {
  skip = skip || [];
  var q = String(name).trim() + ' opskrift', list = [];
  try { list = await bing(q); } catch (e) { log && log('  bing: ' + e.message); }
  if (list.length < 3) { try { list = list.concat(await ddg(q)); } catch (e) { log && log('  ddg: ' + e.message); } }
  var seen = {}, tried = 0;
  for (var i = 0; i < list.length && tried < 10; i++) {
    var c = list[i];
    if (!c.u || !/^https:\/\//.test(c.u) || seen[c.u] || skip.indexOf(c.u) > -1) continue;
    seen[c.u] = 1;
    if (BAD.test(c.u) || BAD.test(c.p || '')) continue;
    if (/\.(svg|gif)(\?|$)/i.test(c.u)) continue;
    tried++;
    var ok = await check(c.u);
    if (ok) return { u: c.u, p: /^https?:\/\//.test(c.p || '') ? c.p : '', h: host(c.p || c.u), t: String(c.t || '').slice(0, 120), w: ok.w, hh: ok.h, buf: ok.buf, ct: ok.ct, q: q };
  }
  return null;
}

async function preview(root, log) {
  var st = JSON.parse(fs.readFileSync(path.join(root, 'data/starter.json'), 'utf8'));
  var out = path.join(root, 'out'); fs.mkdirSync(path.join(out, 'img'), { recursive: true });
  var res = [], n = 0;
  for (var id of Object.keys(st)) {
    var name = st[id].name, f = await find(name, [], log);
    n++;
    if (f) { var ext = /png/.test(f.ct) ? 'png' : /webp/.test(f.ct) ? 'webp' : 'jpg'; fs.writeFileSync(path.join(out, 'img', id + '.' + ext), f.buf); delete f.buf; }
    res.push({ id: id, name: name, photo: f });
    log((f ? 'OK   ' : 'INGEN') + ' ' + name + (f ? '  ->  ' + f.h + '  ' + f.u.slice(0, 110) : ''));
    await sleep(1200);
  }
  fs.writeFileSync(path.join(out, 'preview.json'), JSON.stringify(res, null, 1));
  log('Fundet: ' + res.filter(function (x) { return x.photo; }).length + ' af ' + n);
}

async function apply(env, log) {
  var admin = require('firebase-admin');
  if (!env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT mangler.');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)) });
  var db = admin.firestore(), FV = admin.firestore.FieldValue;
  var max = Number(env.MAX_LOOKUPS || 80), done = 0, found = 0;
  var cols = await db.doc('data/users').listCollections();
  for (var c of cols) {
    var snap = await c.doc('u').collection('recipes').get();
    for (var d of snap.docs) {
      if (done >= max) break;
      var r = d.data() || {};
      if (!r.name) continue;
      if (r.img && (r.img.data || r.img.id)) continue;            // eget foto
      if (r.photo && !r.photoReq) continue;                         // allerede slået op
      done++;
      var f = await find(r.name, Array.isArray(r.photoSkip) ? r.photoSkip : [], log);
      var v = f ? { u: f.u, p: f.p, h: f.h, at: Date.now() } : { none: 1, at: Date.now() };
      await d.ref.update({ photo: v, photoReq: FV.delete() });
      if (f) found++;
      log((f ? 'OK   ' : 'INGEN') + ' ' + r.name + (f ? '  ->  ' + f.h : ''));
      await sleep(1200);
    }
  }
  log('Slået op: ' + done + ', fundet: ' + found);
}

async function main() {
  var env = process.env, log = console.log, root = path.join(__dirname, '..');
  if ((env.MODE || 'apply') === 'preview') return preview(root, log);
  return apply(env, log);
}
if (require.main === module) main().catch(function (e) { console.error(e && e.stack || e); process.exit(1); });
module.exports = { find: find, dims: dims, bing: bing };
