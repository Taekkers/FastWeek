/* FastWeek: lille Cloudflare Worker, der læser kogebogsbilleder med Google Gemini.
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

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origin = req.headers.get('Origin') || '';
    const allowed = ORIGINS.concat(String(env.EXTRA_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
    if (req.method === 'GET' && url.pathname === '/') return new Response('FastWeek billedlæsning kører' + (env.GEMINI_KEY ? '' : ' (mangler GEMINI_KEY)'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    if (!allowed.includes(origin)) return reply(403, { error: { code: 403, message: 'Ukendt adresse' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (req.method !== 'POST') return reply(405, { error: { code: 405, message: 'Kun POST' } }, origin);
    const m = url.pathname.match(/^\/models\/(gemini-[a-z0-9.\-]+):generateContent$/);
    if (!m) return reply(404, { error: { code: 404, message: 'Ukendt adresse' } }, origin);
    if (!env.GEMINI_KEY) return reply(500, { error: { code: 500, message: 'Serveren mangler GEMINI_KEY' } }, origin);
    if (+(req.headers.get('Content-Length') || 0) > MAX_BYTES) return reply(413, { error: { code: 413, message: 'Billedet er for stort' } }, origin);
    const auth = req.headers.get('Authorization') || '';
    let uid = null;
    try { uid = await verifyLogin(auth.replace(/^Bearer\s+/i, ''), env.FIREBASE_PROJECT || PROJECT); } catch (e) { return reply(503, { error: { code: 503, message: 'Kunne ikke tjekke login' } }, origin); }
    if (!uid) return reply(401, { error: { code: 401, message: 'Ikke logget ind', status: 'LOGIN_REQUIRED' } }, origin);
    const g = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m[1] + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY }, body: req.body
    });
    return new Response(g.body, { status: g.status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
  }
};
