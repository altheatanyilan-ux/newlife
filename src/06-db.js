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
  reminders:      'id, date, done',
  visionEras:     'id, order',
  tasks:          'id, day, done',
  boards:         'id',
  people:         'id, tier',
  streams:        'id, status',
  events:         'id, day',
  accounts:       'id, type',
  txns:           'id, date, category, accountId',
  budgets:        'id, category',
  finGoals:       'id',
  chapters:       'id, startDate',
  turns:          'id, chapterId, date',
  threadsN:       'id',
  interactions:   'id, personId, date',
  mediaQueue:     'id',
  mediaLists:     'id',
  mediaRecs:      'id',
  compost:        'id',
  incomeStreams:  'id',
  spendCategories:'id',
  /* One row per score, and the engraved notation lives in it. They are the
     heaviest rows in the database by a long way — a few hundred kilobytes of
     MusicXML each — which is why the room says out loud what the library is
     costing rather than letting it grow silently. */
  scores:         'id, title',
  /* One row a sitting. They are small and there will be thousands of them, so
     they get a store rather than a meta key: a meta key is one JSON blob
     rewritten in full on every save, and this is the store that grows fastest
     in the house. */
  timeEntries:    'id, startTime, categoryId',
  /* Recordings from the 4/3/2 drill, as Blobs. Deliberately NOT in the state
     snapshot: that pass runs everything through JSON to work out what
     changed, and a Blob through JSON is an empty object. These rows are
     written and read directly. */
  jaAudio:        'id',
  /* Recordings from the Jazz Studio — the drone takes, the sing-then-play
     pairs, the self-transcription sessions and the COREA originals and
     copies (Curriculum v3, Section 4B). Blobs, for the same reason as the
     row above: written and read directly, never through the state. */
  jazzAudio:      'id',
};
/* keys of S that are single objects/arrays without their own identity — kept as rows in `meta` */
/* Every top-level key of S that is an object rather than an array has to be
   named here, or it is simply never written: persist() serialises exactly
   META_KEYS plus ARRAY_STORES plus the two day-keyed stores, and anything
   outside that list is rebuilt from defaults on the next load. Several
   rooms had grown state that nobody had added — the Planning lists and
   folders, the Content pipeline and its vault, the writing history behind
   the streak, the running log, the week and month plans, the position
   history and the day's rhythm — all of it discarded on every reload. A new
   object on S is not saved until its name appears in this line. */
/* Every key here is a whole-object row in the meta store, and the save pass
   walks THIS LIST rather than the state. A key that is in neither this nor
   ARRAY_STORES is a key nothing writes to the database: the room using it
   works perfectly all session and is empty the next morning, and nothing in
   the app can see the difference because everything reads the state. Four
   rooms were in that position at once — the Japanese Studio, the Study Deck,
   the habit accounts and the marks the exchange keeps — and every stone,
   island, card and correction any of them held was thrown away on reload.
   build.js refuses to build a state key that is saved by nothing now, so it
   cannot happen quietly again. */
const META_KEYS = ['settings','rehearsal','reviews','valueOrder','valueOrderHistory','places','journals','negLast','finance','plans','reviewLog',
  'planning','content','contentVault','wsDaily','wsRead','runLog','weekPlans','monthPlans','monthReviews','position','dailyRhythm','stillness','reviewEntries','reviewPrefs','time','musicianship','japanese','study','habitAccounts','sync','jazz'];
const ARRAY_STORES = ['stages','threads','tensions','values','valueSnapshots','visions','skills','projects','nods','ideas','habits','entries','reminders','visionEras','tasks','boards','people','events','accounts','txns','budgets','finGoals','chapters','turns','threadsN','interactions','mediaQueue','mediaLists','mediaRecs','compost','incomeStreams','spendCategories','scores','timeEntries'];

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
  /* ---- the version number has to match Dexie's ----
     Dexie does not store its version number in IndexedDB as you wrote it: its
     own source rounds `versionNumber * 10`, so Dexie's version(11) is really
     IndexedDB version 110. MiniDexie stands in for Dexie under the same
     database name, and which of the two a build contains depends on nothing
     more than whether whoever ran build.js had npm install'ed first — the CI
     deploy does, a bare checkout does not.

     So the two numbered the same database differently, and a database written
     by one could not be opened by the other at all: IndexedDB refuses to go
     backwards, the open rejects with a VersionError, and the app never starts.
     Multiplying by ten here makes them agree. An existing MiniDexie database
     at 11 upgrades to 110 and keeps everything; one Dexie wrote at 110 opens
     as it stands. */
  _idbVersion(){ return Math.round(this._version * 10); }
  _createStores(d){
    for(const [name, spec] of Object.entries(this._schema)){
      const [pk, ...idx] = spec.split(',').map(s => s.trim());
      if(!d.objectStoreNames.contains(name)){
        const st = d.createObjectStore(name, {keyPath: pk});
        idx.forEach(i => st.createIndex(i, i));
      }
    }
  }
  _openAt(version){
    return new Promise((res, rej) => {
      const r = version == null ? indexedDB.open(this.name) : indexedDB.open(this.name, version);
      r.onupgradeneeded = () => this._createStores(r.result);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blocked'));
    });
  }
  _open(){
    if(this._db) return Promise.resolve(this._db);
    if(this._opening) return this._opening;
    this._opening = (async () => {
      let d;
      try { d = await this._openAt(this._idbVersion()); }
      catch(err){
        /* Someone's database is newer than this build expects. Refusing to
           open is the one response that cannot be right — it loses them the
           whole app to protect a number. Take it as it is. */
        if(!err || err.name !== 'VersionError') throw err;
        d = await this._openAt(null);
      }
      /* whichever way it opened, a store this build needs may not be there
         yet; that is the one thing worth a version bump of its own */
      const missing = Object.keys(this._schema).filter(n => !d.objectStoreNames.contains(n));
      if(missing.length){ const next = d.version + 1; d.close(); d = await this._openAt(next); }
      this._db = d; d.onversionchange = () => d.close();
      return d;
    })();
    return this._opening;
  }
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
db.version(15).stores(DB_SCHEMA);   // v8 finance rebuild, v9 chronicle chapters/turns/threads + interactions, v10 library + writing studio stores, v11 income streams + spend categories, v12 scores, v13 time entries, v14 speaking recordings, v15 jazz recordings

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
/* eras: the ordered list the tree, the panels, and the add dialogs read */
const ERA_PALETTE = ['#7f916a','#6b7f8e','#b08968','#a0727e','#d4a44c','#8a7f9e','#c47832','#8a8d8f'];
function erasList(){ return [...(S.visionEras||[])].sort((a,b)=>a.order-b.order).map(e => Object.assign(e, {label:e.name, desc:e.subtitle})); }
const LEVEL_LABELS = ['Beginner','Novice','Competent','Proficient','Expert','Master'];
const RESOURCE_TYPES = ['book','video','course','article','tool'];
/* ---------- every entry has a links object ----------
   Thirty-odd places in the house read e.links.values or e.links.threads
   straight through, because everything this app writes carries the object.
   An entry that arrives without one — through an import, or out of a version
   old enough to predate a field — then takes down whichever page reads it
   first with a TypeError, and the page becomes the error floor. Guarding one
   call site fixes one page; filling the gap on load fixes all of them, and
   costs one pass over the entries at boot. */
const ENTRY_LINK_KEYS = ['stages','substages','threads','values','visions','skills','projects','people'];
function migrateEntryLinks(){
  (S.entries || []).forEach(e => {
    if(!e || typeof e !== 'object') return;
    if(!e.links || typeof e.links !== 'object') e.links = {};
    ENTRY_LINK_KEYS.forEach(k => { if(!Array.isArray(e.links[k])) e.links[k] = []; });
  });
}
function migrateSkillLevels(){
  S.skills.forEach(s => {
    if(!Array.isArray(s.levels) || !s.levels.length){ const rub = Array.isArray(s.rubric) && s.rubric.length ? s.rubric : ['','','','','']; s.levels = rub.map((d,i) => ({number:i+1, label:LEVEL_LABELS[i] || `Level ${i+1}`, description:d||'', criteria:[], resources:[], estimatedTime:'', targetDate:null})); }
    /* A criterion is an observable behaviour, so it is something you either can
       or cannot yet do — it wants a tick, not just a line of text. They were
       stored as bare strings; each becomes an object that can carry one. */
    s.levels.forEach((l,i) => { l.number = i+1; l.resources = l.resources||[]; l.estimatedTime = l.estimatedTime||''; if(l.targetDate===undefined) l.targetDate = null; if(!l.label) l.label = `Level ${i+1}`; if(l.description===undefined) l.description = '';
      l.criteria = (l.criteria||[]).map(c => typeof c === 'string' ? {id:uid(), text:c, done:false}
        : {id:c.id||uid(), text:c.text||'', done:!!c.done, metAt:c.metAt||null}); });
    if(s.currentLevel === undefined) s.currentLevel = s.level ?? (s.planned ? 0 : 1);
    s.currentLevel = Math.min(s.currentLevel, s.levels.length);
    if(!Array.isArray(s.milestones)){ s.milestones = []; if(s.target && s.target > s.currentLevel) s.milestones.push({levelTarget:s.target, by:s.targetDate||null, note:''}); }
    delete s.rubric; delete s.level; delete s.target; delete s.targetDate;
  });
}
/* ---------- abilities ----------
   A skill is rarely one thing. "Japanese" is reading, listening, speaking and
   writing, and they do not move together: you can read a newspaper and still
   not order lunch. One level for the whole skill has to average that away,
   which is exactly the information you wanted.

   So a skill can be broken into abilities, and an ability carries a rubric of
   its own — the same shape as the skill's levels, because it is the same kind
   of thing at a smaller grain. A skill with no abilities behaves exactly as it
   always did; nothing is created until you name the first one. */
function skillAbilities(s){
  if(!Array.isArray(s.abilities)) s.abilities = [];
  return s.abilities;
}
function newAbility(name = '', levelCount = 3){
  return {id:uid(), name, note:'', currentLevel:1, order:Date.now(),
    levels: Array.from({length: levelCount}, (_, i) => ({number:i+1,
      label: LEVEL_LABELS[i] || `Level ${i + 1}`, description:'', criteria:[]}))};
}
function abilityLevelCount(a){ return (a.levels || []).length || 1; }
/* An ability's own reading, 0..1 — its level within its own ladder. */
function abilityProgress(a){
  const n = abilityLevelCount(a);
  return n ? Math.max(0, Math.min(1, (a.currentLevel || 0) / n)) : 0;
}
/* The skill's reading, rolled up. With no abilities it is the skill's own
   level, as before. With abilities it is their mean, because a bundle is only
   as far along as its parts are on average — and the weakest one is named
   separately rather than hidden inside the average. */
function skillProgress(s){
  const abs = (s.abilities || []).filter(a => a.name || (a.levels || []).length);
  if(abs.length) return sum(abs.map(abilityProgress)) / abs.length;
  const n = skillLevelCount(s);
  return n ? Math.max(0, Math.min(1, (s.currentLevel || 0) / n)) : 0;
}
function weakestAbility(s){
  const abs = (s.abilities || []).filter(a => a.name);
  if(abs.length < 2) return null;
  return abs.slice().sort((a, b) => abilityProgress(a) - abilityProgress(b))[0];
}
function migrateSkillAbilities(){
  (S.skills || []).forEach(s => {
    if(!Array.isArray(s.abilities)){ s.abilities = []; return; }
    s.abilities.forEach((a, i) => {
      a.id = a.id || uid(); a.name = a.name || ''; a.note = a.note || '';
      if(a.order == null) a.order = i;
      a.levels = (Array.isArray(a.levels) && a.levels.length ? a.levels : newAbility().levels)
        .map((l, li) => ({number: li + 1, label: l.label || `Level ${li + 1}`,
          description: l.description || '',
          criteria: (l.criteria || []).map(c => typeof c === 'string'
            ? {id:uid(), text:c, done:false, metAt:null}
            : {id:c.id || uid(), text:c.text || '', done:!!c.done, metAt:c.metAt || null})}));
      a.currentLevel = Math.max(0, Math.min(+a.currentLevel || 0, a.levels.length));
    });
  });
}
function skillLevelCount(s){ return (s.levels||[]).length || 1; }
function skillLevelLabel(s, n){ const l = (s.levels||[])[n-1]; return l ? l.label : `Level ${n}`; }
function skillMilestones(s){ return [...(s.milestones||[])].sort((a,b)=>(a.by||'9999')<(b.by||'9999')?-1:1); }
function nextMilestone(s){ return skillMilestones(s).find(m => m.levelTarget > s.currentLevel) || null; }
function skillTargetLevel(s){ const ms = (s.milestones||[]).filter(m => m.levelTarget > s.currentLevel); return ms.length ? Math.max(...ms.map(m=>m.levelTarget)) : null; }
function milestonesDueSoon(days=30){ const T = today(); const out = []; S.skills.forEach(s => (s.milestones||[]).forEach(m => { if(!m.by || m.levelTarget <= s.currentLevel) return; const d = daysBetween(T, m.by.slice(0,10)); if(d <= days) out.push({skill:s, m, days:d}); })); return out.sort((a,b)=>a.days-b.days); }
const fmtMonth = d => { if(!d) return ''; const x = parseDay(d.slice(0,10)); return `${MONTHS[x.getMonth()].slice(0,3)} ${x.getFullYear()}`; };
function migrateProjects(){
  S.projects.forEach(p => {
    if(p.description === undefined) p.description = p.desc || ''; delete p.desc;
    if(p.status === 'shipped') p.status = 'completed';
    /* asked of the table the app actually draws from, not a copy of it made
       here once: this list had gone stale and did not know about 'future',
       so every project in that state was quietly reset to an idea */
    if(!(typeof PSTATUS === 'object' && PSTATUS && PSTATUS[p.status])) p.status = 'idea';
    if(!p.priority) p.priority = 'P3'; if(p.startDate === undefined) p.startDate = (p.createdAt||today()).slice(0,10); if(p.targetDate === undefined) p.targetDate = '';
    p.phases = Array.isArray(p.phases) ? p.phases : []; p.phases.forEach(ph => { ph.id = ph.id||uid(); ph.tasks = ph.tasks||[]; ph.startDate = ph.startDate||''; ph.endDate = ph.endDate||''; ph.tasks.forEach(t => { t.id = t.id||uid(); t.done = !!t.done; if(t.dueDate===undefined) t.dueDate = null; }); });
    p.resources = Array.isArray(p.resources) ? p.resources : []; p.linkedSkills = Array.isArray(p.linkedSkills) ? p.linkedSkills : []; if(p.linkedVisionEra === undefined) p.linkedVisionEra = null; if(p.notes === undefined) p.notes = ''; p.tags = p.tags||[]; p.income = p.income||{model:'',current:0,target:0,milestones:[]};
  });
}
function projectTasks(p){ return (p.phases||[]).flatMap(ph => ph.tasks||[]); }
function projectTaskRatio(p){ const t = projectTasks(p); return {done:t.filter(x=>x.done).length, total:t.length}; }
function migrateLifeline(){
  const y = new Date().getFullYear(); const eras = erasList(); if(!eras.length) return;
  eras.forEach(e => { if(e.stageRef === undefined) e.stageRef = null; });
  if(!eras.some(e => e.type === 'present')){
    let cur = eras.find(e => (e.startYear==null || e.startYear <= y) && (e.endYear==null || e.endYear >= y) && !(e.type==='past'));
    if(!cur) cur = eras.find(e => e.type !== 'past') || eras[0];
    eras.forEach(e => { e.type = e === cur ? 'present' : (e.order < cur.order ? 'past' : 'future'); });
  } else { let seen = false; eras.forEach(e => { if(e.type === 'present'){ if(seen) e.type = 'future'; seen = true; } else if(!['past','future'].includes(e.type)) e.type = seen ? 'future' : 'past'; }); }
  const present = eras.find(e => e.type === 'present');
  if(present && !present.stageRef){ const st = S.stages.find(s => { const m = (s.years||'').match(/(\d{4})\s*[–-]\s*(\d{4})?/); return m && +m[1] <= y && (!m[2] || +m[2] >= y); }); if(st) present.stageRef = st.id; }
  S.visions.forEach(v => { if(!v.status) v.status = v.confidence === 'lived' ? 'completed' : 'pending'; if(v.status === 'completed' && !v.completedAt) v.completedAt = v.createdAt || today(); if(v.phase === undefined) v.phase = 'in-progress'; if(v.progress === undefined) v.progress = v.status === 'completed' ? 100 : 0; if(v.startedAt === undefined) v.startedAt = v.createdAt || ''; if(v.successCriteria === undefined) v.successCriteria = ''; if(v.reflection === undefined) v.reflection = ''; if(v.archived === undefined) v.archived = false; if(!Array.isArray(v.peopleNeeded)) v.peopleNeeded = []; });
  if(!S.journals.some(j => j.type === 'lifeevent')) S.journals.push({type:'lifeevent', name:'Life events'});
}
function migrateEras(){ if(Array.isArray(S.visionEras) && S.visionEras.length) return; const old = Array.isArray(S.eras) ? S.eras : []; S.visionEras = old.map((e,i) => ({id:e.id, name:e.label||e.name||'Era', subtitle:e.desc||e.subtitle||'', startYear:null, endYear:null, color:ERA_PALETTE[i%ERA_PALETTE.length], order:i})); delete S.eras; }
/* Tables whose rows are binary. A JSON backup cannot carry a Blob — it
   serialises to an empty object — so these are left out of an export rather
   than written into it as husks, and left alone by a restore rather than
   cleared and replaced by them. That is not a gap in the backup so much as an
   honest statement of what a text file can hold; the recordings stay where
   they are, and a restore does not silently delete them. */
const BINARY_STORES = ['jaAudio', 'jazzAudio'];
const textTables = () => db.tables.filter(t => !BINARY_STORES.includes(t.name));
async function readAllStores(){ const rows = {}; for(const t of textTables()) rows[t.name] = await t.toArray(); return rows; }
async function writeAllStores(rows){
  /* the same rule as persist: serialise before the write, so what is recorded
     as written is what was written and not whatever the state became meanwhile */
  const shot = {}; for(const k of Object.keys(rows)) shot[k] = JSON.stringify(rows[k]);
  await db.transaction('rw', textTables(), async tx => { for(const t of textTables()){ const table = tx[t.name] || tx.table(t.name); await table.clear(); if(rows[t.name]?.length) await table.bulkPut(rows[t.name]); } });
  lastWritten = shot;
}

/* ---------- save: only stores whose contents changed ---------- */
let lastWritten = {}; let saving = null; let queued = null;
/* A pass writes only the stores whose contents changed, which means it has to
   remember what it wrote. It used to work that out AFTER the write — and
   stateToStores hands back the live arrays, not copies, so a change made while
   the transaction was in the air got recorded as already written. The next
   pass then compared the new state against itself, found nothing dirty, and
   skipped it. A reorder made at the wrong moment was silently dropped.
   So: take one snapshot, write that snapshot, and record that snapshot. What
   goes to the disk and what we claim went to the disk are the same thing. */
async function persist(){
  const rows = stateToStores(S);
  const shot = {}; for(const k of Object.keys(rows)) shot[k] = JSON.stringify(rows[k]);
  const dirty = Object.keys(rows).filter(k => shot[k] !== lastWritten[k]);
  if(!dirty.length) return;
  const frozen = {}; dirty.forEach(k => frozen[k] = JSON.parse(shot[k]));
  await db.transaction('rw', dirty.map(k => db[k]), async tx => { for(const k of dirty){ const table = tx[k] || tx.table(k); await table.clear(); if(frozen[k].length) await table.bulkPut(frozen[k]); } });
  dirty.forEach(k => lastWritten[k] = shot[k]);
}
/* A save that arrives while one is already running has to wait for its turn,
   and the promise it is handed must be the one that settles when ITS OWN
   change has reached the disk. Returning the in-flight promise instead was a
   quiet lie: `await saveNow()` came back before the change was written, so a
   reload straight after a reorder could read back the order from before it.
   The queued save is one slot, not a queue — every waiter joins the same next
   pass, because a pass writes the whole of the state anyway. */
function saveNow(){
  if(saving){
    if(!queued){ let go; const p = new Promise(res => { go = res; }); queued = {promise:p, go}; }
    return queued.promise;
  }
  saving = persist()
    .catch(err => { console.error('save failed', err); toast('Saving failed — export a backup from Settings to be safe.', 6000); })
    .finally(() => {
      saving = null;
      const q = queued; queued = null;
      /* the waiters are released by the pass that actually carries their
         change, not by the one that was already in the air when they asked */
      if(q) saveNow().then(q.go, q.go);
    });
  return saving;
}
const save = debounce(saveNow, 400);
/* wait until nothing at all is in the air, however many passes that takes */
async function flushSave(){ while(saving || queued) await (queued ? queued.promise : saving); }

/* ---------- load, with one-time migration from older stores ---------- */
async function readLegacyBlobDB(){
  return new Promise(res => { try { const r = indexedDB.open('lifeinstrument'); r.onupgradeneeded = () => { r.transaction.abort(); res(null); }; r.onsuccess = () => { const d = r.result; if(!d.objectStoreNames.contains('kv')){ d.close(); res(null); return; } const q = d.transaction('kv','readonly').objectStore('kv').get(KEY); q.onsuccess = () => { d.close(); res(q.result || null); }; q.onerror = () => { d.close(); res(null); }; }; r.onerror = () => res(null); r.onblocked = () => res(null); } catch(e){ res(null); } });
}
async function load(){
  await db.open();
  const metaCount = await db.meta.count();
  if(metaCount){ S = storesToState(await readAllStores()); lastWritten = {}; const before = stateToStores(S); for(const k of Object.keys(before)) lastWritten[k] = JSON.stringify(before[k]); migrate(); saveNow(); return; }   // anything migrate() added is dirty and gets written
  // migration source 1: the interim single-blob IndexedDB database
  const blob = await readLegacyBlobDB();
  if(blob){ S = blob; migrate(); await writeAllStores(stateToStores(S)); try { indexedDB.deleteDatabase('lifeinstrument'); } catch(e){} setTimeout(() => toast('Your data was migrated into the new database.', 5000), 600); return; }
  // migration source 2: the original localStorage key
  let raw = null; try { raw = localStorage.getItem(KEY); } catch(e){}
  if(raw){ try { S = JSON.parse(raw); migrate(); await writeAllStores(stateToStores(S)); try { localStorage.removeItem(KEY); } catch(e){} setTimeout(() => toast('Your data was migrated from browser storage into the new database.', 5000), 600); return; } catch(e){ console.warn('localStorage migration failed', e); } }
  S = seed(); migrate(); await writeAllStores(stateToStores(S));
}
async function resetAll(){ S = seed(); migrate(); await writeAllStores(stateToStores(S)); }
async function storageInfo(){ try { const e = await navigator.storage?.estimate?.(); if(e) return {usage:e.usage||0, quota:e.quota||0}; } catch(err){} return null; }
const fmtBytes = n => n > 1e9 ? (n/1e9).toFixed(2)+' GB' : n > 1e6 ? (n/1e6).toFixed(1)+' MB' : (n/1e3).toFixed(0)+' KB';

/* ============================================================
   Backup — export / import through the database
   ============================================================ */
const LAST_BACKUP_KEY = 'lastBackupDate';
async function exportToJSON(){
  await flushSave();
  const data = {}; for(const t of textTables()) data[t.name] = await t.toArray();
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
  const rows = {}; for(const t of textTables()) rows[t.name] = Array.isArray(obj.data[t.name]) ? obj.data[t.name] : [];
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
