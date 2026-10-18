/* ============================================================
   THE CLOUD COPY — the same life on every device, through Supabase.

   The house stays exactly what it is: one HTML file, with its data in the
   browser's own database, working with no signal. This only adds a place
   where a copy lives, so a phone, a laptop and a tablet see the same life.

   IT IS THE SAME EXCHANGE THE FOLDER SYNC USES (19-sync.js) with a different
   courier. The store is the unit (settings are one unit per key); a unit
   carries a fingerprint; a device remembers the fingerprints from its last
   exchange; what moved on one side is taken or sent, and only what moved on
   BOTH sides is put to you. No clocks are compared.

   WHAT SUPABASE HOLDS. Three small tables (supabase/schema.sql), each private
   to the signed-in user by row level security:
     li_heads    one row per unit: which generation is current, its fingerprint
     li_parts    the unit's text, in parts of about a megabyte and a half so no
                 single request is huge, under a generation number
     li_profile  whether the data is encrypted, and the salt for the key
   A unit is written as new parts first and then made current by ONE atomic
   call (li_commit), which refuses if somebody else committed in the meantime.
   A half-written unit is therefore never read, and two devices cannot silently
   overwrite each other.

   ENCRYPTION is optional and happens here, in the browser, before anything is
   sent: AES-GCM with a key derived from a passphrase (PBKDF2). With it on,
   Supabase holds only ciphertext and cannot read the journals. The price is
   honest: a forgotten passphrase is unrecoverable, because nobody else holds it.

   NOTHING HERE IS NEEDED TO USE THE HOUSE. Not signed in, none of this runs.
   The session and the keys live in this browser only (localStorage), never in
   the data, so a backup or a sync file never carries a login.
   ============================================================ */

/* build.js replaces the null with {url, key} from the SUPABASE_URL and
   SUPABASE_ANON_KEY environment variables (Netlify's), so a hosted copy is
   already pointed at its project. The anon key is meant to be public: the
   row level security in schema.sql is what keeps each person's data theirs. */
const CLOUD_BUILD = /*__LI_CLOUD__*/null;
const CLOUD_CFG_KEY = 'li.cloud.config', CLOUD_SESSION_KEY = 'li.cloud.session', CLOUD_AUTO_KEY = 'li.cloud.auto', CLOUD_PASS_KEY = 'li.cloud.pass';
const CLOUD_PART_BYTES = 1500000;
const CLOUD_LOCAL_KEYS = new Set(['cloud', 'sync']);   /* settings keys that describe this device's exchanges, not the life */

const cloudLS = {
  get(k, d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} },
  del(k){ try { localStorage.removeItem(k); } catch(e){} }
};
function cloudConfig(){
  const mine = cloudLS.get(CLOUD_CFG_KEY, null);
  const c = (mine && mine.url && mine.key) ? mine : CLOUD_BUILD;
  return c && c.url && c.key ? {url: String(c.url).replace(/\/+$/, ''), key: String(c.key)} : null;
}
const cloudSession = () => cloudLS.get(CLOUD_SESSION_KEY, null);
const cloudSignedIn = () => !!(cloudSession() && cloudSession().refresh_token);
const cloudAutoOn = () => cloudLS.get(CLOUD_AUTO_KEY, true) !== false;
/* the marks from the last exchange with the cloud — in the state like the folder
   sync's, but their own: the two couriers do not share what they have seen */
function cloudState(){
  const s = S.cloud = S.cloud || {};
  s.base = (s.base && typeof s.base === 'object') ? s.base : {};
  s.at = s.at || null;
  s.user = s.user || '';
  return s;
}

/* ---------- talking to Supabase ---------- */
class CloudError extends Error { constructor(msg, status, code){ super(msg); this.status = status; this.code = code; } }
async function cloudFetch(path, {method = 'GET', body, headers = {}, auth = true, retry = true, raw = false} = {}){
  const c = cloudConfig(); if(!c) throw new CloudError('Supabase is not set up on this device.', 0, 'config');
  const h = Object.assign({apikey: c.key}, headers);
  if(auth){
    const t = await cloudToken(); if(!t) throw new CloudError('You are signed out.', 401, 'signed-out');
    h.Authorization = 'Bearer ' + t;
  }
  if(body !== undefined && !h['Content-Type']) h['Content-Type'] = 'application/json';
  let res;
  try { res = await fetch(c.url + path, {method, headers: h, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))}); }
  catch(e){ throw new CloudError('Could not reach Supabase — offline? Nothing is lost; it will try again.', 0, 'network'); }
  if(res.status === 401 && auth && retry){ await cloudRefresh(true); return cloudFetch(path, {method, body, headers, auth, retry: false, raw}); }
  if(!res.ok){
    let j = null; try { j = await res.json(); } catch(e){}
    const msg = (j && (j.msg || j.message || j.error_description || j.error || j.hint)) || `Supabase said ${res.status}.`;
    throw new CloudError(msg, res.status, j && (j.code || j.error_code));
  }
  if(raw) return res;
  if(res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
/* a token that is about to lapse is renewed first; one that has is renewed on the 401 */
async function cloudToken(){
  const s = cloudSession(); if(!s) return null;
  if(s.expires_at && s.expires_at * 1000 - Date.now() < 60000) await cloudRefresh(false);
  const n = cloudSession(); return n && n.access_token;
}
let cloudRefreshing = null;
async function cloudRefresh(force){
  if(cloudRefreshing) return cloudRefreshing;
  const s = cloudSession(); if(!s || !s.refresh_token) return null;
  cloudRefreshing = (async () => {
    try {
      const r = await cloudFetch('/auth/v1/token?grant_type=refresh_token', {method: 'POST', body: {refresh_token: s.refresh_token}, auth: false});
      cloudStoreSession(r); return r;
    } catch(e){
      /* a refused refresh token is a real sign-out; a network failure is not */
      if(e.status === 400 || e.status === 401 || e.status === 403) cloudLS.del(CLOUD_SESSION_KEY);
      throw e;
    } finally { cloudRefreshing = null; }
  })();
  return cloudRefreshing;
}
function cloudStoreSession(r){
  if(!r || !r.access_token) return false;
  cloudLS.set(CLOUD_SESSION_KEY, {access_token: r.access_token, refresh_token: r.refresh_token,
    expires_at: r.expires_at || (Math.floor(Date.now() / 1000) + (r.expires_in || 3600)),
    user: r.user ? {id: r.user.id, email: r.user.email} : (cloudSession() || {}).user});
  return true;
}
async function cloudSignIn(email, password){
  const r = await cloudFetch('/auth/v1/token?grant_type=password', {method: 'POST', body: {email, password}, auth: false});
  cloudStoreSession(r); return r;
}
/* Supabase may require the address to be confirmed first; then there is no session yet */
async function cloudSignUp(email, password){
  const r = await cloudFetch('/auth/v1/signup', {method: 'POST', body: {email, password}, auth: false});
  if(r && r.access_token){ cloudStoreSession(r); return {signedIn: true}; }
  return {signedIn: false, confirm: true};
}
function cloudSignOut(){
  cloudLS.del(CLOUD_SESSION_KEY); cloudLS.del(CLOUD_PASS_KEY); cloudKey = null;
  const st = cloudState(); st.base = {}; st.at = null; st.user = ''; saveNow();
}

/* ---------- bytes, text and the key ---------- */
function cloudB64(buf){
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let s = '';
  for(let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
function cloudUnb64(t){ const s = atob(t), u = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
async function cloudPipe(bytes, stream){
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}
const cloudCanZip = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
let cloudKey = null;               /* the derived AES key, in memory only */
async function cloudDerive(pass, saltB64){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', salt: cloudUnb64(saltB64), iterations: 250000, hash: 'SHA-256'}, base,
    {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
}
async function cloudSeal(bytes){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, cloudKey, bytes));
  const out = new Uint8Array(12 + ct.length); out.set(iv, 0); out.set(ct, 12); return out;
}
async function cloudOpen(bytes){
  return new Uint8Array(await crypto.subtle.decrypt({name: 'AES-GCM', iv: bytes.subarray(0, 12)}, cloudKey, bytes.subarray(12)));
}
/* A part is text with a one-letter prefix saying how to read it:
   j: plain JSON · z: gzip · e: encrypted (gzip first when it can) */
async function cloudEncode(value, encrypt){
  const json = JSON.stringify(value === undefined ? null : value);
  let bytes = new TextEncoder().encode(json), z = false;
  if(cloudCanZip()){ try { bytes = await cloudPipe(bytes, new CompressionStream('gzip')); z = true; } catch(e){} }
  if(encrypt){
    if(!cloudKey) throw new CloudError('The passphrase is needed first.', 0, 'passphrase');
    return 'e' + (z ? 'z' : 'j') + ':' + cloudB64(await cloudSeal(bytes));
  }
  return z ? 'z:' + cloudB64(bytes) : 'j:' + json;
}
async function cloudDecode(text){
  const k = text.slice(0, text.indexOf(':')), body = text.slice(k.length + 1);
  if(k === 'j') return JSON.parse(body);
  let bytes = cloudUnb64(body);
  if(k[0] === 'e'){
    if(!cloudKey) throw new CloudError('The passphrase is needed first.', 0, 'passphrase');
    try { bytes = await cloudOpen(bytes); } catch(e){ throw new CloudError('That passphrase does not open this data.', 0, 'passphrase'); }
    if(k[1] === 'j') return JSON.parse(new TextDecoder().decode(bytes));
  }
  return JSON.parse(new TextDecoder().decode(await cloudPipe(bytes, new DecompressionStream('gzip'))));
}

/* ---------- units: heads, parts, atomic commit ---------- */
const cloudQ = s => encodeURIComponent(s);
async function cloudHeads(){
  const rows = await cloudFetch('/rest/v1/li_heads?select=unit,gen,nparts,print,device,updated_at&limit=5000');
  const out = {}; (rows || []).forEach(r => { out[r.unit] = r; }); return out;
}
async function cloudProfile(){
  const rows = await cloudFetch('/rest/v1/li_profile?select=enc,salt,verify');
  return rows && rows[0] ? rows[0] : null;
}
/* an array is cut into parts by size; anything else is one part */
function cloudSplit(value){
  if(!Array.isArray(value)) return [value];
  const parts = []; let cur = [], size = 0;
  for(const row of value){
    const n = JSON.stringify(row).length + 1;
    if(cur.length && size + n > CLOUD_PART_BYTES){ parts.push(cur); cur = []; size = 0; }
    cur.push(row); size += n;
  }
  parts.push(cur);
  return parts;
}
async function cloudReadUnit(unit, head){
  const rows = await cloudFetch(`/rest/v1/li_parts?select=part,data&unit=eq.${cloudQ(unit)}&gen=eq.${head.gen}&order=part.asc`);
  if(!rows || rows.length !== head.nparts) throw new CloudError(`The cloud copy of "${syncUnitName(unit)}" is incomplete — try again in a moment.`, 0, 'partial');
  const decoded = []; for(const r of rows) decoded.push(await cloudDecode(r.data));
  return decoded.length === 1 && !Array.isArray(decoded[0]) ? decoded[0] : [].concat(...decoded);
}
/* Returns true when the unit is now the cloud's current one, false when somebody
   else committed first (the next exchange sees theirs and plans again). */
async function cloudWriteUnit(unit, value, print, expectGen, encrypt){
  const gen = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  const parts = cloudSplit(value), rows = [];
  for(let i = 0; i < parts.length; i++) rows.push({unit, gen, part: i, data: await cloudEncode(parts[i], encrypt)});
  /* in batches of about four megabytes, so a big unit is a few requests */
  let batch = [], size = 0;
  const flush = async () => { if(batch.length) await cloudFetch('/rest/v1/li_parts', {method: 'POST', body: batch, headers: {Prefer: 'return=minimal'}}); batch = []; size = 0; };
  for(const r of rows){ if(batch.length && size + r.data.length > 4000000) await flush(); batch.push(r); size += r.data.length; }
  await flush();
  const ok = await cloudFetch('/rest/v1/rpc/li_commit', {method: 'POST', body: {p_unit: unit, p_gen: gen, p_expect: expectGen || 0,
    p_nparts: rows.length, p_print: print, p_device: syncDevice().name}});
  if(!ok){ try { await cloudFetch(`/rest/v1/li_parts?unit=eq.${cloudQ(unit)}&gen=eq.${gen}`, {method: 'DELETE'}); } catch(e){} }
  return ok === true;
}

/* ---------- the passphrase ---------- */
async function cloudUnlock(pass, profile){
  if(!profile || !profile.enc) { cloudKey = null; return true; }
  const k = await cloudDerive(pass, profile.salt);
  const was = cloudKey; cloudKey = k;
  try { const v = await cloudDecode(profile.verify); if(v === 'li-ok'){ return true; } } catch(e){}
  cloudKey = was; return false;
}
async function cloudMakeProfile(pass){
  const salt = cloudB64(crypto.getRandomValues(new Uint8Array(16)));
  cloudKey = await cloudDerive(pass, salt);
  const verify = await cloudEncode('li-ok', true);
  await cloudFetch('/rest/v1/li_profile', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates,return=minimal'}, body: {enc: true, salt, verify}});
  return {enc: true, salt, verify};
}

/* ---------- the exchange ---------- */
let cloudBusy = false, cloudLastRun = 0, cloudPending = null;
function cloudDownload(name, obj){
  const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(obj)], {type: 'application/json'}));
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
/* opts: first ('cloud' | 'mine') answers the first-time question; choices answers clashes;
   quiet = no toasts; progress(done, total) */
let cloudBusyP = null;
async function cloudRun(opts){
  const o = opts || {};
  /* an exchange already in the air: a background run just steps aside; one you asked for waits its turn */
  if(cloudBusy){ if(o.quiet) return {ok: false, why: 'busy'}; await cloudBusyP.catch(() => {}); }
  cloudBusyP = cloudRunInner(o);
  return cloudBusyP;
}
async function cloudRunInner(o){
  if(!cloudConfig()) return {ok: false, why: 'Supabase is not set up on this device.'};
  if(!cloudSignedIn()) return {ok: false, why: 'signed out'};
  cloudBusy = true;
  try {
    const base0 = Object.assign({}, cloudState().base);
    const profile = await cloudProfile();
    if(profile && profile.enc && !cloudKey){
      const pass = cloudLS.get(CLOUD_PASS_KEY, null);
      if(!(pass && await cloudUnlock(pass, profile))) return {ok: false, passphrase: true, profile};
    }
    await flushSave();
    /* what belongs to this device alone — the marks from this very exchange, and the
       folder sync's — is not part of the life and never travels */
    const everything = await readAllStores();
    const ours = Object.assign({}, everything, {meta: (everything.meta || []).filter(r => !CLOUD_LOCAL_KEYS.has(r.key))});
    const mine = (everything.meta || []).filter(r => CLOUD_LOCAL_KEYS.has(r.key));
    const heads = await cloudHeads();
    const encrypt = !!(profile && profile.enc);
    const unitsNow = syncUnits(ours), printsNow = syncPrints(unitsNow);
    /* what the cloud says it has, in the shape the planner reads */
    const theirs = {prints: {}, data: {meta: []}, device: ''};
    Object.keys(heads).forEach(u => {
      theirs.prints[u] = heads[u].print;
      if(u.indexOf('meta:') === 0) theirs.data.meta.push({key: u.slice(5), value: null}); else theirs.data[u] = [];
    });
    theirs.device = Object.values(heads).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0]?.device || 'the cloud';
    const empty = !Object.keys(heads).length;
    const never = !Object.keys(base0).length;
    /* the first time this device meets a cloud that already holds a life: say which wins */
    if(!empty && never && !o.first) return {ok: false, firstTime: true, theirs, heads};
    let plan = syncPlan(ours, theirs, o.first ? {} : base0);
    let choices = o.choices || null;
    if(o.first === 'cloud'){ choices = {}; plan.clash.forEach(k => { choices[k] = 'theirs'; }); }
    if(o.first === 'mine'){
      /* this device's copy replaces everything the cloud holds for the units it has */
      choices = {}; plan.clash.forEach(k => { choices[k] = 'mine'; });
      plan = {take: [], push: Object.keys(unitsNow).filter(k => printsNow[k] !== theirs.prints[k]), same: [], clash: plan.clash};
      plan.push.push(...plan.clash); plan.clash = [];
    }
    /* the cloud's side of whatever will be taken or asked about */
    const want = [...plan.take, ...plan.clash];
    const fill = async k => {
      const v = await cloudReadUnit(k, heads[k]);
      if(k.indexOf('meta:') === 0){ const row = theirs.data.meta.find(r => r.key === k.slice(5)); if(row) row.value = v; } else theirs.data[k] = v;
    };
    let done = 0; const total = want.length + plan.push.length + plan.clash.length;
    for(const k of want){ await fill(k); if(o.progress) o.progress(++done, total); }
    if(plan.clash.length && !choices) return {ok: false, needs: plan.clash, plan, theirs, ours};
    /* a copy of this side is kept before anything of it is replaced */
    const replacing = plan.clash.some(k => (choices || {})[k] === 'theirs') || (o.first === 'cloud' && Object.keys(unitsNow).length);
    if(replacing && !o.noBackup) cloudDownload(`before-cloud-${today()}.json`, syncPayload(ours));
    const merged = syncApply(ours, theirs, plan, choices);
    merged.meta = (merged.meta || []).concat(mine);
    const took = plan.take.length + plan.clash.filter(k => (choices || {})[k] === 'theirs').length;
    /* what goes up: what only this side moved, and any clash answered "mine".
       Fingerprinted and sent BEFORE the merged rows are made the live state —
       migrate() touches those very objects, and a fingerprint taken after it
       would not be the one the cloud was given. */
    const toPush = [...plan.push, ...plan.clash.filter(k => (choices || {})[k] !== 'theirs')];
    const mergedUnits = syncUnits(Object.assign({}, merged, {meta: merged.meta.filter(r => !CLOUD_LOCAL_KEYS.has(r.key))})), mergedPrints = syncPrints(mergedUnits);
    const baseNow = Object.assign({}, base0);
    const lost = [];
    for(const k of Object.keys(mergedPrints)){ if(!toPush.includes(k)) baseNow[k] = mergedPrints[k]; }
    for(const k of toPush){
      const ok = await cloudWriteUnit(k, mergedUnits[k], mergedPrints[k], heads[k] ? heads[k].gen : 0, encrypt);
      if(ok) baseNow[k] = mergedPrints[k]; else lost.push(k);
      if(o.progress) o.progress(++done, total);
    }
    if(took){ await writeAllStores(merged); S = storesToState(merged); migrate(); }
    /* the state may have been replaced above, so the marks are written to the one that is live now */
    const st = cloudState();
    st.base = baseNow; st.at = new Date().toISOString(); st.user = (cloudSession().user || {}).email || '';
    cloudLastRun = Date.now();
    saveNow();
    return {ok: true, took, gave: toPush.length - lost.length, settled: plan.clash.length, retry: lost.length, empty, units: {took: plan.take, gave: toPush}};
  } catch(e){
    return {ok: false, why: e && e.message || String(e), code: e && e.code};
  } finally { cloudBusy = false; }
}

/* ---------- running it by itself ----------
   After a change (a few seconds after the last one), when the page comes back
   to the front, and once at the start. A clash is never answered for you: the
   run stops and a toast offers the question. */
let cloudTimer = null, cloudRunning = false;
function cloudChanged(){
  if(cloudBusy || !cloudSignedIn() || !cloudAutoOn() || !cloudConfig()) return;
  clearTimeout(cloudTimer); cloudTimer = setTimeout(() => cloudAuto('changed'), +cloudLS.get('li.cloud.delay', 15000) || 15000);
}
async function cloudAuto(why){
  if(cloudBusy || cloudRunning || !cloudSignedIn() || !cloudAutoOn() || !cloudConfig() || navigator.onLine === false) return;
  if(why === 'back' && Date.now() - cloudLastRun < 60000) return;
  cloudRunning = true;
  try {
    const r = await cloudRun({quiet: true});
    cloudAfter(r, true);
  } finally { cloudRunning = false; }
}
/* what to say about a run, and what to ask. `quiet` runs speak only when something needs you. */
function cloudAfter(r, quiet){
  if(!r) return r;
  if(r.ok){
    if(r.took){ try { rerender(); } catch(e){} }
    if(!quiet) toast(r.took || r.gave ? `Cloud: took ${r.took}, sent ${r.gave}${r.settled ? `, settled ${r.settled}` : ''}.` : 'Cloud: nothing had moved.');
    if(r.retry && quiet) setTimeout(() => cloudAuto('retry'), 3000);
    return r;
  }
  if(r.needs){ toast('Cloud: something changed here and elsewhere — it needs your say.', 9000, {label: 'decide', fn: () => cloudClash(r)}); return r; }
  if(r.firstTime){ if(quiet) toast('Cloud: this device meets a life already in the cloud — choose which to keep.', 9000, {label: 'choose', fn: () => cloudFirstTime(r)}); else cloudFirstTime(r); return r; }
  if(r.passphrase){ if(quiet) toast('Cloud: the passphrase is needed on this device.', 9000, {label: 'enter it', fn: () => cloudAskPassphrase()}); else cloudAskPassphrase(); return r; }
  if(r.why === 'busy') return r;
  if(!quiet || r.code === 'signed-out') toast(r.why || 'Cloud sync did not work.', 6000);
  return r;
}
function cloudClash(r){
  openSyncClash(r, async choices => { cloudAfter(await cloudRun({choices}), false); cloudRepaint(); });
}
function cloudFirstTime(r){
  const n = Object.keys(r.heads || {}).length;
  const m = openModal(`<h2>This device meets a life in the cloud</h2>
    <p>The cloud already holds ${n} part${n === 1 ? '' : 's'} of a life, and this device has its own. They have never been put together, so say which to keep.</p>
    <div class="row" style="flex-direction:column;gap:10px;margin-top:12px;align-items:stretch">
      <button class="btn primary" id="clTake"><b>Use the cloud’s copy here</b><br><span class="faint sm">This device’s own data is saved to a file first, then replaced. The right choice for a new phone or a fresh browser.</span></button>
      <button class="btn" id="clMerge"><b>Put them together, part by part</b><br><span class="faint sm">Parts that differ are listed and you choose each.</span></button>
      <button class="btn ghost danger" id="clGive"><b>Replace the cloud with this device’s copy</b><br><span class="faint sm">What the cloud holds is overwritten. Only if this device is the real one.</span></button>
    </div>`, 'narrow');
  const go = async opts => { m.remove(); const r = await cloudRun(opts); cloudAfter(r, false); cloudRepaint(); };
  m.querySelector('#clTake').onclick = () => go({first: 'cloud'});
  m.querySelector('#clMerge').onclick = () => { m.remove(); cloudMergeAll(); };
  m.querySelector('#clGive').onclick = () => { if(confirm('Replace everything the cloud holds with this device’s copy?')) go({first: 'mine'}); };
}
/* "part by part" on a first meeting: every part that differs is a clash to answer */
async function cloudMergeAll(){
  const st = cloudState(); st.base = {__merge: '1'};   /* any mark at all, so it is not "first" again; no part matches it */
  cloudAfter(await cloudRun({}), false); cloudRepaint();
}
function cloudAskPassphrase(then){
  const m = openModal(`<h2>The passphrase</h2>
    <p class="muted">This cloud copy is encrypted. The passphrase is never sent anywhere; it opens the data in this browser.</p>
    <label class="pd-q"><span class="k">passphrase</span><input class="inp" type="password" id="clPass" autocomplete="current-password"></label>
    <label class="row" style="gap:8px;margin-top:8px"><input type="checkbox" id="clRem" checked> <span class="faint sm">remember it on this device</span></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px"><button class="btn primary" id="clOk">Open</button></div>
    <p class="faint sm" id="clErr" style="color:var(--rose)"></p>`, 'narrow');
  m.querySelector('#clPass').focus();
  const go = async () => {
    const pass = m.querySelector('#clPass').value; if(!pass) return;
    const profile = await cloudProfile().catch(() => null);
    if(await cloudUnlock(pass, profile)){ if(m.querySelector('#clRem').checked) cloudLS.set(CLOUD_PASS_KEY, pass); m.remove(); cloudAfter(await cloudRun({}), false); cloudRepaint(); if(then) then(); }
    else m.querySelector('#clErr').textContent = 'That passphrase does not open it.';
  };
  m.querySelector('#clOk').onclick = go;
  m.querySelector('#clPass').onkeydown = e => { if(e.key === 'Enter') go(); };
}
let cloudBooted = false;
function cloudBoot(){
  if(!cloudConfig() || !cloudSignedIn()) return;
  setTimeout(() => cloudAuto('boot'), 2500);
  if(cloudBooted) return; cloudBooted = true;
  document.addEventListener('visibilitychange', () => { if(!document.hidden) cloudAuto('back'); });
  window.addEventListener('online', () => cloudAuto('back'));
}

/* ---------- the room (in Settings) ---------- */
function cloudRepaint(){ const n = document.getElementById('cloudSec'); if(n && n.parentNode){ const t = document.createElement('div'); t.innerHTML = cloudSectionHTML(); n.replaceWith(t.firstElementChild); bindCloudSection(document); } }
function cloudSaid(){
  const st = cloudState(); if(!st.at) return 'never';
  const d = daysSince(timeDayOf(st.at));
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}
function cloudSectionHTML(){
  const cfg = cloudConfig(), ses = cloudSession(), inn = cloudSignedIn();
  const head = `<div class="row between" style="align-items:baseline"><span class="sc" style="margin:0">The cloud copy (Supabase)</span>
      <span class="mono faint">${inn ? `signed in · last exchange: ${esc(cloudSaid())}` : cfg ? 'signed out' : 'not set up'}</span></div>`;
  if(!cfg) return `<section class="section rv sy-sec" id="cloudSec">${head}
    <p class="muted" style="font-size:.85rem">Keeps the same life on every device through your own Supabase project. Nothing is sent until you sign in.
      Paste the project’s URL and its public <b>anon</b> key (Project settings → API). A hosted copy built with them is already set up.</p>
    <label class="pd-q"><span class="k">project URL</span><input class="inp" id="clUrl" placeholder="https://abcdxyz.supabase.co"></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">anon (public) key</span><input class="inp" id="clKey" placeholder="eyJ…"></label>
    <div class="row" style="margin-top:10px"><button class="btn sm primary" id="clSaveCfg">Save</button></div></section>`;
  if(!inn) return `<section class="section rv sy-sec" id="cloudSec">${head}
    <p class="muted" style="font-size:.85rem">Sign in to keep this device in step with the others. The first time on a new device it asks which copy to keep.</p>
    <div class="row" style="gap:10px;flex-wrap:wrap">
      <label class="pd-q" style="flex:1;min-width:14rem"><span class="k">email</span><input class="inp" id="clEmail" type="email" autocomplete="username"></label>
      <label class="pd-q" style="flex:1;min-width:14rem"><span class="k">password</span><input class="inp" id="clPw" type="password" autocomplete="current-password"></label></div>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn sm primary" id="clIn">Sign in</button><button class="btn sm" id="clUp">Create the account</button>
      <span class="grow"></span>${cloudLS.get(CLOUD_CFG_KEY, null) ? '<button class="tbtn" id="clForgetCfg">use a different project</button>' : ''}</div>
    <p class="faint sm" id="clMsg" style="margin-top:6px"></p></section>`;
  return `<section class="section rv sy-sec" id="cloudSec">${head}
    <p class="muted" style="font-size:.85rem">Signed in as <b>${esc((ses.user || {}).email || '')}</b>. This device ${cloudAutoOn() ? 'keeps itself in step automatically — a few seconds after a change, and when you come back to it' : 'exchanges only when you press the button'}.
      It works exactly the same offline.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn sm primary" id="clNow">Exchange now</button>
      <label class="row" style="gap:6px;align-items:center"><input type="checkbox" id="clAuto" ${cloudAutoOn() ? 'checked' : ''}><span class="faint sm">automatic</span></label>
      <span class="grow"></span><button class="tbtn" id="clOut">sign out</button></div>
    <div id="clEnc" style="margin-top:12px"><span class="faint sm">checking encryption…</span></div>
    <p class="faint sm" id="clMsg" style="margin-top:6px"></p></section>`;
}
async function cloudEncHTML(){
  try {
    const p = await cloudProfile();
    return p && p.enc
      ? `<span class="chip on">end-to-end encrypted</span> <span class="faint sm">Supabase holds only ciphertext. A forgotten passphrase cannot be recovered.</span>
         <button class="tbtn" id="clEncOff">turn encryption off</button>`
      : `<div class="faint sm" style="margin-bottom:6px">Optional: encrypt everything in this browser before it is sent, so Supabase cannot read it. The passphrase is never stored by anyone but you — forget it and the cloud copy is lost (this device’s copy is not).</div>
         <div class="row" style="gap:8px;flex-wrap:wrap"><input class="inp" type="password" id="clNewPass" placeholder="a passphrase" autocomplete="new-password" style="max-width:16rem"><button class="btn sm" id="clEncOn">Encrypt the cloud copy</button></div>`;
  } catch(e){ return `<span class="faint sm">${esc(e.message || 'could not read the cloud profile')}</span>`; }
}
function bindCloudSection(root){
  const sec = root.querySelector('#cloudSec'); if(!sec) return;
  const say = t => { const n = sec.querySelector('#clMsg'); if(n) n.textContent = t || ''; };
  const $q = s => sec.querySelector(s);
  if($q('#clSaveCfg')) $q('#clSaveCfg').onclick = () => {
    const url = $q('#clUrl').value.trim(), key = $q('#clKey').value.trim();
    if(!/^https?:\/\//.test(url) || key.length < 20) { toast('That needs a project URL and the anon key.'); return; }
    cloudLS.set(CLOUD_CFG_KEY, {url, key}); cloudRepaint(); };
  if($q('#clForgetCfg')) $q('#clForgetCfg').onclick = () => { cloudLS.del(CLOUD_CFG_KEY); cloudRepaint(); };
  const creds = () => ({email: $q('#clEmail').value.trim(), pw: $q('#clPw').value});
  if($q('#clIn')) $q('#clIn').onclick = async () => {
    const {email, pw} = creds(); if(!email || !pw){ say('An email and a password.'); return; }
    say('Signing in…');
    try { await cloudSignIn(email, pw); cloudBoot(); cloudRepaint(); cloudAfter(await cloudRun({}), false); cloudRepaint(); }
    catch(e){ say(e.message); } };
  if($q('#clUp')) $q('#clUp').onclick = async () => {
    const {email, pw} = creds(); if(!email || pw.length < 6){ say('An email and a password of at least six characters.'); return; }
    say('Creating…');
    try { const r = await cloudSignUp(email, pw);
      if(r.signedIn){ cloudBoot(); cloudRepaint(); cloudAfter(await cloudRun({}), false); cloudRepaint(); }
      else say('Created. Supabase has sent a link to confirm the address — open it, then sign in here.'); }
    catch(e){ say(e.message); } };
  if($q('#clOut')) $q('#clOut').onclick = () => { cloudSignOut(); toast('Signed out. This device keeps its data.'); cloudRepaint(); };
  if($q('#clAuto')) $q('#clAuto').onchange = e => { cloudLS.set(CLOUD_AUTO_KEY, e.target.checked); cloudRepaint(); };
  if($q('#clNow')) $q('#clNow').onclick = async () => {
    const b = $q('#clNow'); b.disabled = true; b.textContent = 'Exchanging…';
    const r = await cloudRun({progress: (d, t) => { b.textContent = `Exchanging… ${d}/${t}`; }});
    cloudAfter(r, false); cloudRepaint(); };
  const enc = $q('#clEnc');
  if(enc){
    cloudEncHTML().then(h => { if(!enc.isConnected) return; enc.innerHTML = h;
      const on = enc.querySelector('#clEncOn'), off = enc.querySelector('#clEncOff');
      if(on) on.onclick = async () => {
        const pass = enc.querySelector('#clNewPass').value;
        if(pass.length < 8){ toast('A passphrase of at least eight characters.'); return; }
        if(!confirm('Encrypt the cloud copy? Every part is re-sent, encrypted. If you forget the passphrase the cloud copy cannot be read by anyone.')) return;
        say('Encrypting…');
        try { await cloudMakeProfile(pass); cloudLS.set(CLOUD_PASS_KEY, pass); await cloudReupload(); say('Done — the cloud copy is encrypted.'); cloudRepaint(); }
        catch(e){ say(e.message); } };
      if(off) off.onclick = async () => {
        if(!confirm('Turn encryption off? The cloud copy is re-sent as plain text.')) return;
        say('Re-sending…');
        try { const was = cloudKey; await cloudFetch('/rest/v1/li_profile', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates,return=minimal'}, body: {enc: false, salt: null, verify: null}});
          cloudKey = null; cloudLS.del(CLOUD_PASS_KEY); await cloudReupload(); say('Done — the cloud copy is plain again.'); cloudRepaint(); }
        catch(e){ say(e.message); } };
    });
  }
}
/* every unit sent again under whatever the profile now says (encryption on or off) */
async function cloudReupload(){
  const profile = await cloudProfile(), enc = !!(profile && profile.enc);
  await flushSave();
  const all = await readAllStores(), ours = Object.assign({}, all, {meta: (all.meta || []).filter(r => !CLOUD_LOCAL_KEYS.has(r.key))});
  const units = syncUnits(ours), prints = syncPrints(units), heads = await cloudHeads();
  const st = cloudState(); const base = {};
  for(const k of Object.keys(units)){
    const ok = await cloudWriteUnit(k, units[k], prints[k], heads[k] ? heads[k].gen : 0, enc);
    if(ok) base[k] = prints[k];
  }
  st.base = Object.assign({}, st.base, base); st.at = new Date().toISOString(); saveNow();
}
