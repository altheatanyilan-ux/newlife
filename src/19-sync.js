/* ============================================================
   THE SAME LIFE ON TWO MACHINES.

   The first question is whether this needs an account, and the honest answer
   is: not to me, but to something. Two devices cannot both see the same data
   out of thin air. Either they talk directly, which needs both of them awake
   at the same moment on the same network, or something in the middle holds
   the data — and whatever holds it has to know which data is yours, which is
   what a login is.

   So this room does not ask you to make an account here, does not have a
   server, and never sends your life anywhere. It writes one file. You put
   that file in a folder you already sync — iCloud Drive, Dropbox, Drive,
   Syncthing, a USB stick — and the thing that already knows who you are does
   the carrying. Your login is the one you already have.

   WHAT MAKES THIS HARDER THAN COPYING A FILE is that both sides change. A
   backup restored over the top is not sync; it is the newer machine throwing
   away whatever the older one did. So the exchange is per store rather than
   per file: practising on the tablet touches `scores`, tidying tasks on the
   laptop touches `tasks`, and those two are not in conflict — both are taken,
   and nobody is asked anything. Only a store that moved on BOTH sides since
   the last exchange is a real conflict, and a real conflict is put to you
   rather than guessed at.

   HOW EACH SIDE KNOWS WHAT MOVED is a fingerprint per store, recorded at the
   end of every successful exchange. Ours differing from that mark means we
   changed it; theirs differing from it means they did. No clocks are compared,
   which matters: two machines' clocks disagree by minutes, and a sync that
   trusts the later timestamp silently loses whichever one is running slow.

   AND NOTHING IS APPLIED WITHOUT A BACKUP first, written beside the sync file
   in the same folder. It is the cheapest insurance there is.
   ============================================================ */

const SYNC_FILE = 'life-instrument.sync.json';
const SYNC_VERSION = 1;
const SYNC_HANDLE_KEY = 'syncFolder';

/* ---------- this machine ----------
   A name so the file can say who wrote it last, and an id so a device never
   mistakes its own writing for somebody else's. Both in localStorage rather
   than in the state, because they must NOT travel in the file. */
const SYNC_ID_KEY = 'li.sync.device';
function syncDevice(){
  let v = null;
  try { v = JSON.parse(localStorage.getItem(SYNC_ID_KEY) || 'null'); } catch(e){}
  if(!v || !v.id){
    v = {id: uid(), name: syncGuessName()};
    try { localStorage.setItem(SYNC_ID_KEY, JSON.stringify(v)); } catch(e){}
  }
  return v;
}
function syncRenameDevice(name){
  const v = syncDevice();
  v.name = String(name || '').trim().slice(0, 40) || v.name;
  try { localStorage.setItem(SYNC_ID_KEY, JSON.stringify(v)); } catch(e){}
  return v;
}
/* a first guess, so nobody has to name their laptop before they can begin */
function syncGuessName(){
  const ua = (navigator.userAgent || '');
  if(/iPad/i.test(ua)) return 'iPad';
  if(/iPhone/i.test(ua)) return 'iPhone';
  if(/Android/i.test(ua)) return 'the Android';
  if(/Mac OS X/i.test(ua)) return 'the Mac';
  if(/Windows/i.test(ua)) return 'the PC';
  if(/Linux/i.test(ua)) return 'the Linux box';
  return 'this machine';
}

/* ---------- what the state is made of, in pieces small enough to merge ----------
   A store is the unit, except for `meta` — everything from the settings to
   the daily rhythm lives in that one store, so a change to a sound setting
   would collide with a change to a month plan. Each meta key is its own unit
   instead, which makes a genuine conflict rare enough to be worth asking
   about when it happens. */
function syncUnits(rows){
  const out = {};
  (rows.meta || []).forEach(r => { out['meta:' + r.key] = r.value; });
  Object.keys(rows).forEach(k => { if(k !== 'meta') out[k] = rows[k]; });
  return out;
}
/* and back again */
function syncUnitsToRows(units){
  const rows = {meta: []};
  Object.keys(units).forEach(k => {
    if(k.indexOf('meta:') === 0) rows.meta.push({key: k.slice(5), value: units[k]});
    else rows[k] = units[k];
  });
  return rows;
}
/* A fingerprint of one unit. Not a cryptographic hash — this only has to tell
   "the same" from "not the same", and it runs over a megabyte of Chopin on
   every exchange, so it is a cheap rolling one over the serialised form. */
function syncPrint(v){
  const s = JSON.stringify(v === undefined ? null : v);
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for(let i = 0; i < s.length; i++){
    const c = s.charCodeAt(i);
    h1 = ((h1 ^ c) * 16777619) >>> 0;
    h2 = ((h2 + c) * 2654435761) >>> 0;
  }
  return s.length.toString(36) + '-' + h1.toString(36) + h2.toString(36);
}
const syncPrints = units => { const out = {};
  Object.keys(units).forEach(k => out[k] = syncPrint(units[k])); return out; };

/* ---------- the marks from the last exchange ----------
   In the state, so they travel with a restored backup and a device that has
   been through an exchange does not think every store changed. */
function syncState(){
  const s = S.sync = S.sync || {};
  s.base = (s.base && typeof s.base === 'object') ? s.base : {};
  s.at = s.at || null;
  s.with = s.with || '';
  s.auto = !!s.auto;
  return s;
}

/* ---------- the folder ----------
   A directory handle is structured-cloneable, so IndexedDB can keep it across
   sessions; the browser still asks once per session before it will be used,
   which is the browser's decision and not one to work around. */
async function syncSaveHandle(h){
  try { await db.meta.put({key: SYNC_HANDLE_KEY, value: h}); return true; }
  catch(e){ console.warn('the folder could not be remembered', e); return false; }
}
async function syncLoadHandle(){
  try { const r = await db.meta.get(SYNC_HANDLE_KEY); return (r && r.value) || null; }
  catch(e){ return null; }
}
async function syncForgetFolder(){
  try { await db.meta.delete(SYNC_HANDLE_KEY); } catch(e){}
}
const syncCanFolder = () => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
/* Asking is not the same as having: a handle remembered from last week needs
   permission again this session, and a browser will only grant it inside a
   gesture — so this is only ever called from a press. */
async function syncPermission(h, write){
  if(!h || !h.queryPermission) return true;
  const opts = {mode: write ? 'readwrite' : 'read'};
  let st = await h.queryPermission(opts);
  if(st === 'granted') return true;
  st = await h.requestPermission(opts);
  return st === 'granted';
}
async function syncPickFolder(){
  if(!syncCanFolder()) return null;
  let h = null;
  try { h = await window.showDirectoryPicker({id:'life-instrument-sync', mode:'readwrite'}); }
  catch(e){ return null; }                    /* they changed their mind */
  if(!h) return null;
  await syncSaveHandle(h);
  return h;
}

/* ---------- reading and writing the file ---------- */
async function syncReadFrom(h){
  try {
    const f = await h.getFileHandle(SYNC_FILE);
    const text = await (await f.getFile()).text();
    const obj = JSON.parse(text);
    return syncValid(obj) ? obj : null;
  } catch(e){ return null; }                  /* no file yet is not an error */
}
async function syncWriteTo(h, payload, name){
  const f = await h.getFileHandle(name || SYNC_FILE, {create:true});
  const w = await f.createWritable();
  await w.write(JSON.stringify(payload));
  await w.close();
  return true;
}
function syncValid(o){
  return !!(o && typeof o === 'object' && o.version === SYNC_VERSION
    && o.data && typeof o.data === 'object');
}
function syncPayload(rows){
  const units = syncUnits(rows);
  const d = syncDevice();
  return {version: SYNC_VERSION, at: new Date().toISOString(),
    device: d.name, deviceId: d.id, prints: syncPrints(units), data: rows};
}

/* ---------- the exchange itself ----------
   Returns a plan rather than acting: what would be taken, what would be
   pushed, and what genuinely collides. Nothing is written until the plan is
   applied, so the page can show it first. */
function syncPlan(ours, theirs, base){
  const a = syncUnits(ours), b = syncUnits(theirs && theirs.data ? theirs.data : {});
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const pa = syncPrints(a), pb = (theirs && theirs.prints) || syncPrints(b);
  const plan = {take: [], push: [], same: [], clash: []};
  keys.forEach(k => {
    const mine = pa[k], yours = pb[k], mark = base[k];
    if(mine === yours){ plan.same.push(k); return; }
    const iMoved = mark === undefined ? !(k in b) || mine !== mark : mine !== mark;
    const theyMoved = mark === undefined ? !(k in a) || yours !== mark : yours !== mark;
    if(iMoved && theyMoved) plan.clash.push(k);
    else if(theyMoved) plan.take.push(k);
    else plan.push.push(k);
  });
  return plan;
}
/* How big a unit is, in things rather than bytes — "142 tasks" is a number
   anybody can weigh a choice against; "38 KB" is not. */
function syncCount(v){
  if(Array.isArray(v)) return v.length;
  if(v && typeof v === 'object') return Object.keys(v).length;
  return v == null ? 0 : 1;
}
const SYNC_UNIT_NAMES = {
  meta:'settings', habitLog:'the habit log', checkins:'the check-ins',
  timeEntries:'tracked time', scores:'scores', tasks:'tasks', projects:'projects',
  people:'people', skills:'skills', entries:'journal entries', nods:'nods',
  habits:'habits', visions:'visions', values:'values', ideas:'ideas',
  txns:'transactions', events:'events', interactions:'interactions'};
function syncUnitName(k){
  if(k.indexOf('meta:') === 0) return SYNC_UNIT_NAMES[k.slice(5)] || k.slice(5);
  return SYNC_UNIT_NAMES[k] || k;
}
/* Applying it. `choices` says what to do with each clash: 'mine' or 'theirs',
   and anything unanswered stays as it is, which is the safe direction. */
function syncApply(ours, theirs, plan, choices){
  const a = syncUnits(ours), b = syncUnits(theirs && theirs.data ? theirs.data : {});
  const out = Object.assign({}, a);
  plan.take.forEach(k => { if(k in b) out[k] = b[k]; else delete out[k]; });
  plan.clash.forEach(k => { if((choices || {})[k] === 'theirs' && k in b) out[k] = b[k]; });
  return syncUnitsToRows(out);
}

/* ---------- one whole exchange ----------
   Reads, plans, and either finishes or hands back the clashes to be answered.
   Two passes at most: the first returns {needs:[...]} when something collides,
   the second is given the answers and finishes. */
async function syncRun(opts){
  const o = opts || {};
  const st = syncState();
  const h = o.handle || await syncLoadHandle();
  if(!h) return {ok:false, why:'no folder'};
  if(!await syncPermission(h, true)) return {ok:false, why:'no permission'};
  await flushSave();
  const ours = await readAllStores();
  const theirs = await syncReadFrom(h);
  /* nothing there yet: this device is the first, and the file is simply ours */
  if(!theirs){
    await syncWriteTo(h, syncPayload(ours));
    st.base = syncPrints(syncUnits(ours));
    st.at = new Date().toISOString(); st.with = 'a new file';
    saveNow();
    return {ok:true, first:true, took:0, gave:Object.keys(st.base).length};
  }
  const plan = syncPlan(ours, theirs, st.base);
  if(plan.clash.length && !o.choices)
    return {ok:false, needs: plan.clash, plan, theirs, ours};
  /* a backup of this side before anything is taken, beside the sync file */
  if(plan.take.length || plan.clash.length){
    try { await syncWriteTo(h, {version:SYNC_VERSION, at:new Date().toISOString(),
      device: syncDevice().name, note:'taken before an exchange', data: ours},
      `before-sync-${syncDevice().name.replace(/[^\w-]+/g, '-')}-${today()}.json`); }
    catch(e){ console.warn('the safety copy could not be written', e); }
  }
  const merged = syncApply(ours, theirs, plan, o.choices);
  if(plan.take.length || plan.clash.length){
    await writeAllStores(merged);
    S = storesToState(merged); migrate();
  }
  const payload = syncPayload(merged);
  await syncWriteTo(h, payload);
  st.base = payload.prints;
  st.at = payload.at;
  st.with = theirs.device || 'another machine';
  saveNow();
  return {ok:true, took: plan.take.length, gave: plan.push.length,
    settled: plan.clash.length, plan};
}

/* ---------- the file fallback ----------
   Safari and every iPhone have no folder picker. The exchange is the same;
   only the carrying is by hand. You open the sync file from wherever it is,
   the same merge runs, and the merged file is given back to be put where it
   came from. Slower, and it loses nothing. */
async function syncFromFile(file, choices){
  const st = syncState();
  let theirs = null;
  try { theirs = JSON.parse(await file.text()); } catch(e){ return {ok:false, why:'not a sync file'}; }
  if(!syncValid(theirs)) return {ok:false, why:'not a sync file'};
  await flushSave();
  const ours = await readAllStores();
  const plan = syncPlan(ours, theirs, st.base);
  if(plan.clash.length && !choices) return {ok:false, needs: plan.clash, plan, theirs, ours};
  const merged = syncApply(ours, theirs, plan, choices);
  if(plan.take.length || plan.clash.length){
    await writeAllStores(merged);
    S = storesToState(merged); migrate();
  }
  const payload = syncPayload(merged);
  st.base = payload.prints; st.at = payload.at;
  st.with = theirs.device || 'another machine';
  saveNow();
  return {ok:true, took: plan.take.length, gave: plan.push.length,
    settled: plan.clash.length, payload, plan};
}
/* handing the merged file back */
function syncDownload(payload){
  const blob = new Blob([JSON.stringify(payload)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = SYNC_FILE;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- the room ---------- */
function syncSaid(){
  const st = syncState();
  if(!st.at) return 'never';
  const d = daysSince(timeDayOf(st.at));
  return `${d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`}${
    st.with ? `, with ${st.with}` : ''}`;
}
function syncSectionHTML(){
  const st = syncState();
  const d = syncDevice();
  return `<section class="section rv sy-sec" id="syncSec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">The same life on two machines</span>
      <span class="mono faint">last exchange: ${esc(syncSaid())}</span></div>
    <p class="muted" style="font-size:.85rem">No account here, and nothing of yours goes to anybody’s
      server — this writes one file. Put that file in a folder something already syncs for you
      (iCloud Drive, Dropbox, Drive, Syncthing, even a stick you carry) and the thing that already
      knows who you are does the carrying.</p>
    <label class="pd-q" style="max-width:20rem"><span class="k">what to call this machine</span>
      <input class="inp" id="syName" value="${esc(d.name)}" maxlength="40"></label>
    ${syncCanFolder() ? `<div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn sm" id="syPick">Choose the folder</button>
        <button class="btn sm primary" id="syNow">Exchange now</button>
        <span class="grow"></span>
        <button class="tbtn" id="syForget">forget the folder</button>
      </div>
      <p class="faint sm" style="margin-top:6px">The browser asks once each session before it will
        touch the folder again. That is its decision, not this room’s.</p>`
      : `<p class="faint sm" style="margin-top:10px">This browser has no folder picker — Safari and
        every iPhone are in this boat — so the carrying is by hand. It merges exactly the same way.</p>`}
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn sm ghost" id="syOpen">Merge a sync file by hand…</button>
      <input type="file" id="syFile" accept="application/json,.json" style="display:none">
      <button class="tbtn" id="sySave">write this machine’s file out</button>
    </div>
    <p class="faint sm" style="margin-top:8px">Room by room rather than all at once: practising on the
      tablet and tidying tasks on the laptop are not a disagreement, and both are kept without asking.
      Only something changed in both places is put to you — and a copy of this side is written
      beside the file before anything is taken.</p>
  </section>`;
}
function bindSyncSection(root){
  const name = root.querySelector('#syName');
  if(name) name.onchange = () => { syncRenameDevice(name.value); toast('Named.'); };
  const say = r => {
    if(!r || !r.ok) return;
    if(r.first) toast('Written. Open this file on the other machine and it will find its way.');
    else if(!r.took && !r.settled) toast(r.gave ? 'Sent. Nothing to take.' : 'Nothing had moved.');
    else toast(`Took ${r.took} thing${r.took === 1 ? '' : 's'}${
      r.settled ? `, settled ${r.settled}` : ''}.`);
    sound('success'); rerender();
  };
  const run = async opts => {
    const r = await syncRun(opts).catch(e => ({ok:false, why: e && e.message}));
    if(r.needs){ openSyncClash(r, choices => run(Object.assign({}, opts, {choices})).then(say)); return null; }
    if(!r.ok && r.why) toast(r.why === 'no folder' ? 'Choose a folder first.'
      : r.why === 'no permission' ? 'The browser did not let this page into that folder.' : r.why);
    return r;
  };
  const pick = root.querySelector('#syPick');
  if(pick) pick.onclick = async () => {
    const h = await syncPickFolder();
    if(!h) return;
    say(await run({handle: h}));
  };
  const now = root.querySelector('#syNow');
  if(now) now.onclick = async () => say(await run({}));
  const forget = root.querySelector('#syForget');
  if(forget) forget.onclick = async () => { await syncForgetFolder(); toast('Forgotten.'); };
  const file = root.querySelector('#syFile');
  const open = root.querySelector('#syOpen');
  if(open && file){
    open.onclick = () => file.click();
    file.onchange = async () => {
      const f = file.files && file.files[0]; file.value = '';
      if(!f) return;
      const go = async choices => {
        const r = await syncFromFile(f, choices).catch(e => ({ok:false, why: e && e.message}));
        if(r.needs){ openSyncClash(r, go); return; }
        if(!r.ok){ toast(r.why || 'That did not work.'); return; }
        syncDownload(r.payload);
        say(r);
      };
      go(null);
    };
  }
  const out = root.querySelector('#sySave');
  if(out) out.onclick = async () => { await flushSave();
    syncDownload(syncPayload(await readAllStores()));
    toast('Written. Put it where the other machine can reach it.'); };
}
/* What to do when both sides moved the same thing. Listed rather than
   guessed at, with how much is on each side, because "142 tasks here, 3
   there" answers the question on its own most of the time. */
function openSyncClash(r, then){
  const a = syncUnits(r.ours), b = syncUnits(r.theirs.data || {});
  const m = openModal(`<h2>⚠ Both sides moved these</h2>
    <p>Everything else has already been worked out. These ${r.needs.length === 1 ? 'one has' : 'have'}
      changed here <em>and</em> on ${esc(r.theirs.device || 'the other machine')} since the last exchange,
      so nothing is taken until you say which to keep.</p>
    <div class="sy-clash">${r.needs.map(k => `<div class="sy-row" data-syclash="${esc(k)}">
      <span class="sy-name">${esc(syncUnitName(k))}</span>
      <label class="sy-opt"><input type="radio" name="sy-${esc(k)}" value="mine" checked>
        <span>keep this machine’s <b class="mono">${syncCount(a[k])}</b></span></label>
      <label class="sy-opt"><input type="radio" name="sy-${esc(k)}" value="theirs">
        <span>take ${esc(r.theirs.device || 'theirs')}’ <b class="mono">${syncCount(b[k])}</b></span></label>
    </div>`).join('')}</div>
    <p class="faint sm">Whichever you keep, a copy of this machine’s side is written beside the sync
      file first, so nothing here can be lost by getting this wrong.</p>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn sm ghost" id="syCancel">Not now</button>
      <button class="btn primary" id="syGo">Go on</button></div>`, 'wide');
  m.querySelector('#syCancel').onclick = () => m.remove();
  m.querySelector('#syGo').onclick = () => {
    const choices = {};
    r.needs.forEach(k => { const on = m.querySelector(`input[name="sy-${k}"]:checked`);
      choices[k] = on ? on.value : 'mine'; });
    m.remove();
    then(choices);
  };
  return m;
}
