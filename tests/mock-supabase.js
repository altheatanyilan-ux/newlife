/* A stand-in for the parts of Supabase the cloud copy uses, for tests: password auth with refresh,
   the three tables with row level security by user, and the li_commit function.
   Run: node tests/mock-supabase.js [port]   (or require it and call start()) */
const http = require('http');
const crypto = require('crypto');

function start(port = 0, opts = {}){
  const users = new Map();          // email -> {id, password}
  const byToken = new Map();        // access token -> {id, exp}
  const refresh = new Map();        // refresh token -> user id
  const heads = [], parts = [], profiles = [];
  const stats = {requests: 0, bytesIn: 0, maxBody: 0, expired401: 0};
  const ttl = opts.ttlSeconds || 3600;

  const session = u => {
    const access = 'tok-' + crypto.randomBytes(8).toString('hex'), rt = 'rt-' + crypto.randomBytes(8).toString('hex');
    byToken.set(access, {id: u.id, exp: Date.now() + ttl * 1000}); refresh.set(rt, u.id);
    return {access_token: access, refresh_token: rt, expires_in: ttl, expires_at: Math.floor(Date.now() / 1000) + ttl, user: {id: u.id, email: u.email}};
  };
  const send = (res, code, body) => { res.writeHead(code, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*'}); res.end(body === undefined ? '' : JSON.stringify(body)); };
  const filt = (rows, q) => { let out = rows; for(const [k, v] of q.entries()){
    if(['select', 'order', 'limit'].includes(k)) continue;
    const m = /^eq\.(.*)$/.exec(v); if(!m) continue;
    out = out.filter(r => String(r[k]) === m[1]); } return out; };
  const pick = (rows, q) => { const sel = (q.get('select') || '*'); const cols = sel === '*' ? null : sel.split(',');
    let out = rows.map(r => { if(!cols) return Object.assign({}, r); const o = {}; cols.forEach(c => { o[c] = r[c]; }); return o; });
    const ord = q.get('order'); if(ord){ const [c, d] = ord.split('.'); out.sort((a, b) => (a[c] > b[c] ? 1 : -1) * (d === 'desc' ? -1 : 1)); }
    return out; };

  const server = http.createServer((req, res) => {
    const chunks = []; req.on('data', c => chunks.push(c));
    req.on('end', () => {
      stats.requests++; const raw = Buffer.concat(chunks); stats.bytesIn += raw.length; stats.maxBody = Math.max(stats.maxBody, raw.length);
      const u = new URL(req.url, 'http://x'), q = u.searchParams, path = u.pathname;
      if(req.method === 'OPTIONS') return send(res, 204);
      let body = null; if(raw.length){ try { body = JSON.parse(raw.toString('utf8')); } catch(e){} }
      const hasKey = !!req.headers.apikey; if(!hasKey) return send(res, 401, {message: 'No API key'});
      // ---- auth
      if(path === '/auth/v1/signup'){
        if(!body || !body.email || !body.password) return send(res, 400, {msg: 'email and password required'});
        if(users.has(body.email)) return send(res, 422, {msg: 'User already registered'});
        const user = {id: crypto.randomUUID(), email: body.email, password: body.password}; users.set(body.email, user);
        return send(res, 200, opts.confirm ? {id: user.id, email: user.email} : session(user));
      }
      if(path === '/auth/v1/token'){
        const g = q.get('grant_type');
        if(g === 'password'){ const user = users.get(body && body.email); if(!user || user.password !== body.password) return send(res, 400, {error_description: 'Invalid login credentials'}); return send(res, 200, session(user)); }
        if(g === 'refresh_token'){ const id = refresh.get(body && body.refresh_token); if(!id) return send(res, 400, {error_description: 'Invalid Refresh Token'});
          const user = [...users.values()].find(x => x.id === id); return send(res, 200, session(user)); }
      }
      // ---- rest (row level security: only the bearer's own rows)
      const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const tok = byToken.get(auth);
      if(!tok || tok.exp < Date.now()){ stats.expired401++; return send(res, 401, {message: 'JWT expired'}); }
      const uid = tok.id;
      const table = (path.match(/^\/rest\/v1\/(li_\w+)$/) || [])[1];
      const T = {li_heads: heads, li_parts: parts, li_profile: profiles}[table];
      if(path === '/rest/v1/rpc/li_commit'){
        const a = body, cur = heads.find(h => h.user_id === uid && h.unit === a.p_unit);
        if(!cur){ if(a.p_expect !== 0) return send(res, 200, false); heads.push({user_id: uid, unit: a.p_unit, gen: a.p_gen, nparts: a.p_nparts, print: a.p_print, device: a.p_device, updated_at: new Date().toISOString()}); }
        else { if(cur.gen !== a.p_expect) return send(res, 200, false); Object.assign(cur, {gen: a.p_gen, nparts: a.p_nparts, print: a.p_print, device: a.p_device, updated_at: new Date().toISOString()}); }
        for(let i = parts.length - 1; i >= 0; i--) if(parts[i].user_id === uid && parts[i].unit === a.p_unit && parts[i].gen !== a.p_gen) parts.splice(i, 1);
        return send(res, 200, true);
      }
      if(!T) return send(res, 404, {message: 'no such table'});
      const mine = T.filter(r => r.user_id === uid);
      if(req.method === 'GET') return send(res, 200, pick(filt(mine, q), q));
      if(req.method === 'POST'){
        const rows = Array.isArray(body) ? body : [body];
        for(const r of rows){ const row = Object.assign({}, r, {user_id: uid});
          if(table === 'li_profile'){ const i = profiles.findIndex(p => p.user_id === uid); if(i >= 0) profiles[i] = Object.assign(profiles[i], row); else profiles.push(row); }
          else T.push(row); }
        return send(res, 201);
      }
      if(req.method === 'DELETE'){ const del = new Set(filt(mine, q)); for(let i = T.length - 1; i >= 0; i--) if(del.has(T[i])) T.splice(i, 1); return send(res, 204); }
      send(res, 405, {message: 'method'});
    });
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve({
    url: 'http://127.0.0.1:' + server.address().port, close: () => new Promise(r => server.close(r)),
    heads, parts, profiles, users, byToken, stats,
    expireAll(){ byToken.forEach(t => { t.exp = 0; }); }})));
}
module.exports = {start};
if(require.main === module) start(+process.argv[2] || 54321).then(s => console.log('mock supabase on ' + s.url));
