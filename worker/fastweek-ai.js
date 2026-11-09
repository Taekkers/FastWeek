/* FastWeek: lille Cloudflare Worker, der læser kogebogsbilleder med Google Gemini og henter opskrifter fra et link.
   Gemini-nøglen ligger kun her (som hemmelighed GEMINI_KEY) og kommer aldrig ud i appen.
   Kun brugere, der er logget ind i FastWeek (gyldigt Firebase-login), og kun fra appens egen adresse, kan bruge den.
   Se README.md, "Billedlæsning: sådan sættes serveren op". */
const PROJECT = 'fastweek-f6d0f';                                   // Firebase-projektets id (config.js -> projectId)
const ORIGINS = ['https://taekkers.github.io'];                     // hvor appen ligger
const JWKS = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const MAX_BYTES = 12 * 1024 * 1024;

let keyCache = { at: 0, keys: {} };

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function reply(status, obj, origin) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...(origin ? cors(origin) : {}) } });
}
function b64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function googleKey(kid) {
  const now = Date.now();
  if (!keyCache.keys[kid] || now - keyCache.at > 3600e3) {
    const r = await fetch(JWKS);
    if (!r.ok) throw new Error('jwks ' + r.status);
    const j = await r.json(), keys = {};
    for (const k of j.keys || []) {
      keys[k.kid] = await crypto.subtle.importKey('jwk', { kty: k.kty, n: k.n, e: k.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    }
    keyCache = { at: now, keys };
  }
  return keyCache.keys[kid];
}
/* Firebase-login: tjek signatur, udsteder, projekt og udløb */
async function verifyLogin(token, project) {
  const p = String(token || '').split('.');
  if (p.length !== 3) return null;
  let head, body;
  try { head = JSON.parse(new TextDecoder().decode(b64url(p[0]))); body = JSON.parse(new TextDecoder().decode(b64url(p[1]))); } catch (e) { return null; }
  if (head.alg !== 'RS256' || !head.kid) return null;
  const key = await googleKey(head.kid);
  if (!key) return null;
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(p[2]), new TextEncoder().encode(p[0] + '.' + p[1]));
  if (!ok) return null;
  const now = Math.floor(Date.now() / 1000);
  if (body.aud !== project || body.iss !== 'https://securetoken.google.com/' + project) return null;
  if (!(body.exp > now) || !(body.iat <= now + 300) || !body.sub) return null;
  return body.sub;
}

/* Finds a schema.org Recipe in a page's HTML (JSON-LD, the format most recipe sites use for Google). */
function findRecipe(html){
  var out=null,re=/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi,m;
  function isRec(o){var t=o&&o['@type'];return t==='Recipe'||(Array.isArray(t)&&t.indexOf('Recipe')>-1)}
  function walk(o,d){if(!o||out||d>6)return;if(Array.isArray(o)){o.forEach(function(x){walk(x,d+1)});return}if(typeof o!=='object')return;
    if(isRec(o)){out=o;return}if(o['@graph'])walk(o['@graph'],d+1);if(o.mainEntity)walk(o.mainEntity,d+1)}
  while((m=re.exec(html))&&!out){var t=m[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g,'');try{walk(JSON.parse(t),0)}catch(e){try{walk(JSON.parse(t.replace(/[\u0000-\u001f]+/g,' ')),0)}catch(e2){}}}
  if(!out)return null;
  var txt=function(v){return String(v==null?'':v).replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#(\d+);/g,function(_,n){return String.fromCharCode(+n)}).replace(/\s+/g,' ').trim()};
  var ings=[].concat(out.recipeIngredient||out.ingredients||[]).map(txt).filter(Boolean);
  var dur=function(s){var m=/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i.exec(String(s||''));return m?((+m[1]||0)*1440+(+m[2]||0)*60+(+m[3]||0)):0};
  var y=[].concat(out.recipeYield||[]).map(txt).join(' '),sv=(/(\d+)/.exec(y)||[])[1];
  var img=out.image;img=Array.isArray(img)?img[0]:img;img=img&&typeof img==='object'?img.url:img;
  return {name:txt(out.name),servings:sv?+sv:0,minutes:dur(out.totalTime)||(dur(out.prepTime)+dur(out.cookTime)),ingredients:ings,image:typeof img==='string'?img:''};
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', aelig: 'æ', oslash: 'ø', aring: 'å', AElig: 'Æ', Oslash: 'Ø', Aring: 'Å', frac12: '½', frac14: '¼', frac34: '¾', ndash: '–', mdash: '—', deg: '°' };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] != null ? ENT[e] : m));
}
/* the page as plain text (when the page has no recipe in the standard format) */
function pageText(html) {
  let h = html.replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|template|head|nav|footer|form|select|button)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr|li|p|h\d|tr|div)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  h = decode(h).replace(/[ \t\f\v\r]+/g, ' ').replace(/\n\s*/g, '\n').replace(/\n{2,}/g, '\n').trim();
  return h.slice(0, 24000);
}
function okUrl(u) {
  let x; try { x = new URL(u); } catch (e) { return null; }
  if (!/^https?:$/.test(x.protocol)) return null;
  const h = x.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':')) return null;
  return x;
}
async function recipeFromUrl(req, origin) {
  let body = {}; try { body = await req.json(); } catch (e) {}
  const u = okUrl(String(body.url || '').trim());
  if (!u) return reply(400, { error: { code: 400, site: 1, message: 'Det ligner ikke et link til en webside' } }, origin);
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 12000);
  let r;
  try {
    r = await fetch(u.href, { redirect: 'follow', signal: ctl.signal, headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'da-DK,da;q=0.9,en;q=0.6' } });
  } catch (e) { clearTimeout(timer); return reply(502, { error: { code: 502, site: 1, message: 'Siden svarede ikke' } }, origin); }
  clearTimeout(timer);
  if (!r.ok) return reply(502, { error: { code: 502, site: 1, message: 'Siden svarede med fejl ' + r.status } }, origin);
  if (!/html|xml/i.test(r.headers.get('Content-Type') || 'text/html')) return reply(415, { error: { code: 415, site: 1, message: 'Linket peger ikke på en webside' } }, origin);
  const html = (await r.text()).slice(0, 4000000);
  const host = new URL(r.url || u.href).hostname.replace(/^www\./, '');
  const title = decode(((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '').replace(/\s+/g, ' ').trim());
  const rec = findRecipe(html);
  let image = rec && rec.image;
  if (!image) { const m = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html) || /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html); image = m ? decode(m[1]) : ''; }
  try { image = image ? new URL(image, r.url || u.href).href : ''; } catch (e) { image = ''; }
  if (rec && rec.ingredients.length) return reply(200, { recipe: rec, title, host, image, url: r.url || u.href }, origin);
  const text = pageText(html);
  if (text.length < 80) return reply(422, { error: { code: 422, site: 1, message: 'Siden indeholder ingen opskrift, der kan læses' } }, origin);
  return reply(200, { text, title, host, image, url: r.url || u.href }, origin);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origin = req.headers.get('Origin') || '';
    const allowed = ORIGINS.concat(String(env.EXTRA_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
    if (req.method === 'GET' && url.pathname === '/') return new Response('FastWeek billedlæsning kører (version 2: også links)' + (env.GEMINI_KEY ? '' : ' (mangler GEMINI_KEY)'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    if (!allowed.includes(origin)) return reply(403, { error: { code: 403, message: 'Ukendt adresse' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (req.method !== 'POST') return reply(405, { error: { code: 405, message: 'Kun POST' } }, origin);
    const m = url.pathname.match(/^\/models\/(gemini-[a-z0-9.\-]+):generateContent$/);
    const isRec = url.pathname === '/recipe-from-url';
    if (!m && !isRec) return reply(404, { error: { code: 404, message: 'Ukendt adresse' } }, origin);
    if (!env.GEMINI_KEY && !isRec) return reply(500, { error: { code: 500, message: 'Serveren mangler GEMINI_KEY' } }, origin);
    if (+(req.headers.get('Content-Length') || 0) > MAX_BYTES) return reply(413, { error: { code: 413, message: 'Billedet er for stort' } }, origin);
    const auth = req.headers.get('Authorization') || '';
    let uid = null;
    try { uid = await verifyLogin(auth.replace(/^Bearer\s+/i, ''), env.FIREBASE_PROJECT || PROJECT); } catch (e) { return reply(503, { error: { code: 503, message: 'Kunne ikke tjekke login' } }, origin); }
    if (!uid) return reply(401, { error: { code: 401, message: 'Ikke logget ind', status: 'LOGIN_REQUIRED' } }, origin);
    if (isRec) return recipeFromUrl(req, origin);
    const g = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m[1] + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY }, body: req.body
    });
    return new Response(g.body, { status: g.status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
  }
};
