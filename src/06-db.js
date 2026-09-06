/* ============================================================
   db.js — Dexie database schema and persistence layer
   ------------------------------------------------------------
   The app keeps its working model in memory (`S`) so every room can
   render synchronously. All persistence goes through the Dexie
   database declared here: load() hydrates S from the object stores,
   saveNow() writes back only the stores that changed.

   Real Dexie is used when the build inlined it (npm install && npm run
   build). Without it, MiniDexie below provides the same API subset over
   raw IndexedDB: version().stores(), table.get/put/bulkPut/toArray/
   clear/delete/count, transaction('rw', tables, fn) and db.tables.
   ============================================================ */
const DB_NAME = 'lifeinstrument-db';
const DB_SCHEMA = {          // primary key first, then indexes — Dexie syntax
  meta:           'key',
  stages:         'id, num',
  threads:        'id, status',
  tensions:       'id, threadId',
  values:         'id',
  valueSnapshots: 'id, date',
  visions:        'id, era, parentId, confidence',
  skills:         'id, cat',
  projects:       'id, status',
  nods:           'id, projectId, date',
  ideas:          'id',
  habits:         'id, dimension',
  habitLog:       'day',
  checkins:       'day',
  entries:        'id, type, occurredAt, createdAt',
};
/* keys of S that are single objects/arrays without their own identity — kept as rows in `meta` */
const META_KEYS = ['settings','theatre','reviews','valueOrder','valueOrderHistory','people','places','journals','eras','negLast'];
const ARRAY_STORES = ['stages','threads','tensions','values','valueSnapshots','visions','skills','projects','nods','ideas','habits','entries'];

/* ---------- MiniDexie: Dexie-compatible subset over IndexedDB ---------- */
class MiniTable {
  constructor(db, name, tx){ this.db = db; this.name = name; this._tx = tx || null; }
  async _store(mode){ if(this._tx) return this._tx.objectStore(this.name); const idb = await this.db._open(); return idb.transaction(this.name, mode).objectStore(this.name); }
  _req(r){ return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
  async get(key){ return this._req((await this._store('readonly')).get(key)); }
  async put(obj){ return this._req((await this._store('readwrite')).put(obj)); }
  async bulkPut(arr){ const st = await this._store('readwrite'); const ps = arr.map(o => this._req(st.put(o))); await Promise.all(ps); }
  async delete(key){ return this._req((await this._store('readwrite')).delete(key)); }
  async bulkDelete(keys){ const st = await this._store('readwrite'); await Promise.all(keys.map(k => this._req(st.delete(k)))); }
  async clear(){ return this._req((await this._store('readwrite')).clear()); }
  async toArray(){ return this._req((await this._store('readonly')).getAll()); }
  async count(){ return this._req((await this._store('readonly')).count()); }
  where(index){ const t = this; return { equals: v => ({ toArray: async () => t._req((await t._store('readonly')).index(index).getAll(v)) }) }; }
}
class MiniDexie {
  constructor(name){ this.name = name; this._schema = null; this._version = 1; this._db = null; this.tables = []; }
  version(n){ this._version = n; return { stores: schema => { this._schema = schema; this.tables = Object.keys(schema).map(k => { const t = new MiniTable(this, k); this[k] = t; return t; }); return this; } }; }
  _open(){ if(this._db) return Promise.resolve(this._db); if(this._opening) return this._opening;
    this._opening = new Promise((res, rej) => { const r = indexedDB.open(this.name, this._version);
      r.onupgradeneeded = () => { const d = r.result; for(const [name, spec] of Object.entries(this._schema)){ const [pk, ...idx] = spec.split(',').map(s => s.trim()); if(!d.objectStoreNames.contains(name)){ const st = d.createObjectStore(name, {keyPath: pk}); idx.forEach(i => st.createIndex(i, i)); } } };
      r.onsuccess = () => { this._db = r.result; this._db.onversionchange = () => this._db.close(); res(this._db); }; r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked')); });
    return this._opening; }
  open(){ return this._open(); }
  async transaction(mode, tables, fn){ const idb = await this._open(); const names = (Array.isArray(tables) ? tables : [tables]).map(t => typeof t === 'string' ? t : t.name); const tx = idb.transaction(names, mode === 'r' ? 'readonly' : 'readwrite');
    const scope = {}; names.forEach(n => scope[n] = new MiniTable(this, n, tx)); scope.table = n => scope[n];
    const done = new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('aborted')); });
    let result; try { result = await fn(scope); } catch(e){ try { tx.abort(); } catch(_){} throw e; }
    await done; return result; }
  delete(){ return new Promise((res, rej) => { if(this._db){ this._db.close(); this._db = null; this._opening = null; } const r = indexedDB.deleteDatabase(this.name); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); }
}
const DexieImpl = (typeof Dexie !== 'undefined') ? Dexie : MiniDexie;
const usingRealDexie = DexieImpl !== MiniDexie;

/* ---------- the database ---------- */
const db = new DexieImpl(DB_NAME);
db.version(1).stores(DB_SCHEMA);

/* ---------- S <-> stores ---------- */
function stateToStores(state){
  const out = {};
  out.meta = META_KEYS.filter(k => state[k] !== undefined).map(k => ({key: k, value: state[k]}));
  ARRAY_STORES.forEach(k => out[k] = Array.isArray(state[k]) ? state[k] : []);
  out.habitLog = Object.entries(state.habitLog || {}).map(([day, log]) => ({day, log}));
  out.checkins = Object.entries(state.checkins || {}).map(([day, v]) => ({day, ...v}));
  return out;
}
function storesToState(rows){
  const state = {};
  (rows.meta || []).forEach(r => state[r.key] = r.value);
  ARRAY_STORES.forEach(k => state[k] = rows[k] || []);
  state.habitLog = {}; (rows.habitLog || []).forEach(r => state.habitLog[r.day] = r.log);
  state.checkins = {}; (rows.checkins || []).forEach(({day, ...v}) => state.checkins[day] = v);
  return state;
}
async function readAllStores(){ const rows = {}; for(const t of db.tables) rows[t.name] = await t.toArray(); return rows; }
async function writeAllStores(rows){
  await db.transaction('rw', db.tables, async tx => { for(const t of db.tables){ const table = tx[t.name] || tx.table(t.name); await table.clear(); if(rows[t.name]?.length) await table.bulkPut(rows[t.name]); } });
  lastWritten = {}; for(const k of Object.keys(rows)) lastWritten[k] = JSON.stringify(rows[k]);
}

/* ---------- save: only stores whose contents changed ---------- */
let lastWritten = {}; let saving = null; let savePending = false;
async function persist(){
  const rows = stateToStores(S); const dirty = Object.keys(rows).filter(k => JSON.stringify(rows[k]) !== lastWritten[k]);
  if(!dirty.length) return;
  await db.transaction('rw', dirty.map(k => db[k]), async tx => { for(const k of dirty){ const table = tx[k] || tx.table(k); await table.clear(); if(rows[k].length) await table.bulkPut(rows[k]); } });
  dirty.forEach(k => lastWritten[k] = JSON.stringify(rows[k]));
}
function saveNow(){
  if(saving){ savePending = true; return saving; }
  saving = persist().catch(err => { console.error('save failed', err); toast('Saving failed — export a backup from Settings to be safe.', 6000); }).finally(() => { saving = null; if(savePending){ savePending = false; saveNow(); } });
  return saving;
}
const save = debounce(saveNow, 400);
function flushSave(){ return saving ? saving.then(() => saving || Promise.resolve()) : Promise.resolve(); }

/* ---------- load, with one-time migration from older stores ---------- */
async function readLegacyBlobDB(){
  return new Promise(res => { try { const r = indexedDB.open('lifeinstrument'); r.onupgradeneeded = () => { r.transaction.abort(); res(null); }; r.onsuccess = () => { const d = r.result; if(!d.objectStoreNames.contains('kv')){ d.close(); res(null); return; } const q = d.transaction('kv','readonly').objectStore('kv').get(KEY); q.onsuccess = () => { d.close(); res(q.result || null); }; q.onerror = () => { d.close(); res(null); }; }; r.onerror = () => res(null); r.onblocked = () => res(null); } catch(e){ res(null); } });
}
async function load(){
  await db.open();
  const metaCount = await db.meta.count();
  if(metaCount){ S = storesToState(await readAllStores()); migrate(); lastWritten = {}; const rows = stateToStores(S); for(const k of Object.keys(rows)) lastWritten[k] = JSON.stringify(rows[k]); return; }
  // migration source 1: the interim single-blob IndexedDB database
  const blob = await readLegacyBlobDB();
  if(blob){ S = blob; migrate(); await writeAllStores(stateToStores(S)); try { indexedDB.deleteDatabase('lifeinstrument'); } catch(e){} setTimeout(() => toast('Your data was migrated into the new database.', 5000), 600); return; }
  // migration source 2: the original localStorage key
  let raw = null; try { raw = localStorage.getItem(KEY); } catch(e){}
  if(raw){ try { S = JSON.parse(raw); migrate(); await writeAllStores(stateToStores(S)); try { localStorage.removeItem(KEY); } catch(e){} setTimeout(() => toast('Your data was migrated from browser storage into the new database.', 5000), 600); return; } catch(e){ console.warn('localStorage migration failed', e); } }
  S = seed(); await writeAllStores(stateToStores(S));
}
async function resetAll(){ S = seed(); await writeAllStores(stateToStores(S)); }
async function storageInfo(){ try { const e = await navigator.storage?.estimate?.(); if(e) return {usage:e.usage||0, quota:e.quota||0}; } catch(err){} return null; }
const fmtBytes = n => n > 1e9 ? (n/1e9).toFixed(2)+' GB' : n > 1e6 ? (n/1e6).toFixed(1)+' MB' : (n/1e3).toFixed(0)+' KB';

/* ============================================================
   Backup — export / import through the database
   ============================================================ */
const LAST_BACKUP_KEY = 'lastBackupDate';
async function exportToJSON(){
  await flushSave();
  const data = {}; for(const t of db.tables) data[t.name] = await t.toArray();
  const payload = {version: 1, exportedAt: new Date().toISOString(), data};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `backup-${today()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  try { localStorage.setItem(LAST_BACKUP_KEY, today()); } catch(e){}
  $('#backupBanner')?.remove();
  return payload;
}
function validateBackup(obj){
  if(!obj || typeof obj !== 'object') return 'That file is not a backup.';
  if(obj.version === undefined) return 'That file has no version field — it is not a Life Instrument backup.';
  if(!obj.data || typeof obj.data !== 'object') return 'That file has no data section.';
  const missing = ['meta','stages','entries','visions','values','habits'].filter(k => !Array.isArray(obj.data[k]));
  if(missing.length) return `Backup is missing expected stores: ${missing.join(', ')}.`;
  return null;
}
function normaliseBackup(obj){
  if(obj && obj.data === undefined && Array.isArray(obj.stages) && Array.isArray(obj.entries)){ // legacy whole-state export
    const s = {...obj}; delete s._about; delete s.exportedAt; return {version: 0, exportedAt: obj.exportedAt || '', data: stateToStores(s)};
  }
  return obj;
}
async function importBackup(obj){
  const rows = {}; for(const t of db.tables) rows[t.name] = Array.isArray(obj.data[t.name]) ? obj.data[t.name] : [];
  await writeAllStores(rows);
  S = storesToState(rows); migrate();
}
function daysSinceBackup(){ let d = null; try { d = localStorage.getItem(LAST_BACKUP_KEY); } catch(e){} return d ? daysSince(d) : null; }
function backupBanner(){
  $('#backupBanner')?.remove();
  const n = daysSinceBackup(); const firstOpen = S?.settings?.firstOpen;
  const due = n === null ? (firstOpen && daysSince(firstOpen) > 14) : n > 14;
  if(!due || sessionStorage.getItem('backupBannerDismissed') === today()) return;
  const b = el(`<div class="backup-banner" id="backupBanner"><span>💾 Last backup: ${n === null ? 'never' : n + ' days ago'} — consider exporting</span><span class="row"><button class="btn sm" id="bbExport">Export backup</button><button class="tbtn" id="bbDismiss" title="not today">×</button></span></div>`);
  $('#main').prepend(b);
  b.querySelector('#bbExport').onclick = () => exportToJSON().then(() => toast('Backup exported.'));
  b.querySelector('#bbDismiss').onclick = () => { try { sessionStorage.setItem('backupBannerDismissed', today()); } catch(e){} b.remove(); };
}
const RECOVERY_TEXT = 'To restore your data on a new device: open this website in the same browser, go to Settings, click Import Backup, and select your exported .json file.';
function showRecoveryInfo(){ openModal(`<h2>Restoring from a backup</h2><p class="prose" style="font-size:1rem;line-height:1.7">${RECOVERY_TEXT}</p><p class="muted" style="font-size:.85rem">Backups are plain JSON and include your photos. Keep them somewhere you trust: a cloud folder, an external drive, an email to yourself.</p>`, 'narrow'); }
