/* ============================================================
   THE STUDY DECK — rebuilt on Anki's model.

   What was here was a card with a front and a back and SM-2 bolted to it,
   kept in one blob. What is here is Anki's own shape, because the point is
   that a deck somebody built in Anki arrives and behaves exactly as they
   meant it to:

     note types  — fields, card templates (front, back, and the browser's
                   short forms), the CSS they share; standard, cloze, or
                   image occlusion
     notes       — the facts: one value per field, tags, a GUID that stays
                   the same across every copy of the deck in the world
     cards       — what is studied: one per template (or per cloze number)
                   that renders to something, each with its own schedule
     decks       — "Parent::Child" names, each with a preset of options;
                   filtered decks borrow cards and give them back
     presets     — the deck options: limits, steps, FSRS or SM-2, burying,
                   leeches, the timer
     revlog      — every answer ever given, add-only
     media       — images and sounds, as Blobs, looked up at render time

   The scheduling numbers are Anki's too: a card's type (0 new, 1 learning,
   2 review, 3 relearning) and queue (−3 buried by you, −2 buried by the
   scheduler, −1 suspended, 0 new, 1 learning today, 2 review, 3 learning
   across days, 4 preview); due as a position for new cards, a second for
   intraday learning and a day number for everything else. A day starts at
   four in the morning unless you say otherwise.

   STORAGE. These are the heaviest rows in the house and the busiest. They
   are loaded when the deck is first opened, held in memory, and written
   back row by row, a moment after they change — never through the state
   snapshot every other room uses. The backup carries them all the same.

   THE OLD DECK. The first time the new one opens, every card of the old one
   becomes a note (Basic, or Cloze), its review history becomes revlog rows,
   and its schedule carries over. The old blob is left exactly where it was,
   marked as moved, so nothing can be lost by the move.
   ============================================================ */

const SD = {loaded: false, loading: null, noteTypes: new Map(), notes: new Map(), cards: new Map(), decks: new Map(),
  presets: new Map(), revlog: [], misc: new Map(), byNote: new Map(), lastId: 0, dirty: {}, saveTimer: null, saving: null,
  subs: new Set()};
const SD_TABLES = {noteTypes: 'sdNoteTypes', notes: 'sdNotes', cards: 'sdCards', decks: 'sdDecks', presets: 'sdPresets', misc: 'sdMisc'};

/* ids are milliseconds, as Anki's are, and never repeat */
function sdId(){ const t = Date.now(); SD.lastId = t > SD.lastId ? t : SD.lastId + 1; return SD.lastId; }
function sdGuid(){
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~';
  let s = ''; const r = new Uint8Array(10); (self.crypto || window.crypto).getRandomValues(r);
  r.forEach(v => s += a[v % a.length]); return s;
}
function sdOn(fn){ SD.subs.add(fn); return () => SD.subs.delete(fn); }
function sdChanged(what){ SD.subs.forEach(f => { try { f(what); } catch(e){} }); }

/* ---------- load ---------- */
async function sdLoad(){
  if(SD.loaded) return SD;
  if(SD.loading) return SD.loading;
  SD.loading = (async () => {
    const rows = {};
    for(const [k, t] of Object.entries(SD_TABLES)) rows[k] = await db[t].toArray();
    const rev = await db.sdRevlog.toArray();
    rows.noteTypes.forEach(r => SD.noteTypes.set(r.id, r));
    rows.notes.forEach(r => SD.notes.set(r.id, r));
    rows.cards.forEach(r => { SD.cards.set(r.id, r); sdIndexCard(r); });
    rows.decks.forEach(r => SD.decks.set(r.id, r));
    rows.presets.forEach(r => SD.presets.set(r.id, r));
    rows.misc.forEach(r => SD.misc.set(r.id, r));
    SD.revlog = rev.sort((a, b) => a.id - b.id);
    [...SD.notes.keys(), ...SD.cards.keys(), ...SD.decks.keys(), ...SD.noteTypes.keys(), ...SD.presets.keys()]
      .forEach(id => { if(typeof id === 'number' && id > SD.lastId) SD.lastId = id; });
    if(SD.revlog.length) SD.lastId = Math.max(SD.lastId, SD.revlog[SD.revlog.length - 1].id);
    sdEnsureBasics();
    await sdMigrateOld();
    SD.loaded = true;
    if(typeof sdRestoreTodayPresets === 'function') sdRestoreTodayPresets();
    if(typeof sdTakePending === 'function' && S.sdPending && S.sdPending.length) setTimeout(sdTakePending, 0);
    sdChanged('load');
    return SD;
  })();
  try { return await SD.loading; } finally { SD.loading = null; }
}
/* a restored backup replaces everything; the cache is thrown away and read again */
function sdReset(){
  SD.loaded = false; ['noteTypes', 'notes', 'cards', 'decks', 'presets', 'misc', 'byNote'].forEach(k => SD[k] = new Map());
  SD.revlog = []; SD.dirty = {};
}
function sdIndexCard(c){ const l = SD.byNote.get(c.noteId); if(l){ if(!l.includes(c.id)) l.push(c.id); } else SD.byNote.set(c.noteId, [c.id]); }
function sdUnindexCard(c){ const l = SD.byNote.get(c.noteId); if(l){ const i = l.indexOf(c.id); if(i > -1) l.splice(i, 1); } }

/* ---------- save: the rows that changed, a moment after they changed ---------- */
function sdTouch(kind, row){
  const table = SD_TABLES[kind] || kind;
  (SD.dirty[table] = SD.dirty[table] || new Map()).set(row.id, row);
  sdSaveSoon();
}
function sdDrop(kind, id){
  const table = SD_TABLES[kind] || kind;
  (SD.dirty[table] = SD.dirty[table] || new Map()).set(id, null);
  sdSaveSoon();
}
function sdSaveSoon(){ clearTimeout(SD.saveTimer); SD.saveTimer = setTimeout(() => { sdFlush(); }, 250); }
async function sdFlush(){
  clearTimeout(SD.saveTimer);
  if(SD.saving) await SD.saving;
  const work = SD.dirty; SD.dirty = {};
  const tables = Object.keys(work);
  if(!tables.length) return;
  SD.saving = (async () => {
    try {
      await db.transaction('rw', tables.map(t => db[t]), async tx => {
        for(const t of tables){
          const table = tx[t] || tx.table(t), puts = [], dels = [];
          work[t].forEach((row, id) => { if(row) puts.push(JSON.parse(JSON.stringify(row))); else dels.push(id); });
          if(puts.length) await table.bulkPut(puts);
          if(dels.length) await table.bulkDelete(dels);
        }
      });
    } catch(e){
      console.warn('study deck save failed; will retry', e);
      /* put back what did not reach the disk, unless it changed again since */
      tables.forEach(t => { const m = SD.dirty[t] = SD.dirty[t] || new Map(); work[t].forEach((v, k) => { if(!m.has(k)) m.set(k, v); }); });
      setTimeout(sdSaveSoon, 2000);
    }
  })();
  await SD.saving; SD.saving = null;
}
addEventListener('pagehide', () => { if(Object.keys(SD.dirty).length) sdFlush(); });
async function sdRevlogAdd(entry){
  /* add-only: a review, once written, is never rewritten */
  entry.id = entry.id && !SD.revlog.some(r => r.id === entry.id) ? entry.id : sdId();
  SD.revlog.push(entry);
  try { await db.sdRevlog.put(Object.assign({}, entry)); } catch(e){ console.warn('revlog write failed', e); }
  return entry;
}
async function sdRevlogBulk(list){
  list.forEach(e => SD.revlog.push(e));
  SD.revlog.sort((a, b) => a.id - b.id);
  for(let i = 0; i < list.length; i += 5000) await db.sdRevlog.bulkPut(list.slice(i, i + 5000).map(e => Object.assign({}, e)));
}

/* ---------- the collection's own settings ---------- */
function sdMisc(id, init){
  let r = SD.misc.get(id);
  if(!r){ r = Object.assign({id}, typeof init === 'function' ? init() : init || {}); SD.misc.set(id, r); sdTouch('misc', r); }
  return r;
}
function sdSettings(){
  const s = sdMisc('settings', () => ({dayStartHour: 4, learnAheadMin: 20, timeboxMin: 0, theme: 'auto', reveal: 'fade',
    sounds: false, swipe: {left: 1, right: 3, up: 4, down: 2}, focus: false, fontScale: 1, created: Date.now(),
    crtDay: null, nextPos: 1, newSpread: 'mix', lastDeck: null, collapsed: {}, gamepad: false, markdown: false,
    typeIgnoreCase: false, typeIgnoreAccents: false, typeIgnorePunct: false, numericTolerance: 0.02, symbols: {'->': '→', '<-': '←', '=>': '⇒', '!=': '≠', '<=': '≤', '>=': '≥', '...': '…'},
    autoDisperse: false, pace: [], lookup: true}));
  if(s.crtDay == null){ s.crtDay = sdAbsDay(Date.now(), s.dayStartHour); sdTouch('misc', s); }
  return s;
}
/* a day, counted locally, starting at the collection's hour */
function sdAbsDay(ms, hour){
  const d = new Date(ms - (hour == null ? 4 : hour) * 3600000);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
}
function sdToday(){ const s = sdSettings(); return sdAbsDay(Date.now(), s.dayStartHour) - s.crtDay; }
function sdDayToDate(day){ const s = sdSettings(); const abs = day + s.crtDay; const d = new Date(abs * 86400000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), s.dayStartHour); }
function sdDayOfMs(ms){ const s = sdSettings(); return sdAbsDay(ms, s.dayStartHour) - s.crtDay; }
function sdNowSec(){ return Math.floor(Date.now() / 1000); }
function sdDayISO(day){ const d = sdDayToDate(day); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

/* ---------- decks ---------- */
const SD_DECK_COLOURS = ['#8a6a5e', '#c4484e', '#7f6a8e', '#6b7f8e', '#7f916a', '#c9a96e', '#5c7c8a', '#b0705e', '#6e6e78'];
function sdDeckDefaults(d){
  d.name = String(d.name || 'Default').split('::').map(x => x.trim()).filter(Boolean).join('::') || 'Default';
  d.presetId = d.presetId || 1;
  d.description = d.description || '';
  d.isFiltered = !!d.isFiltered;
  if(d.isFiltered) d.filter = Object.assign({search: '', limit: 100, order: 'random', reschedule: true, previewAgain: 60, previewHard: 600, previewGood: 0, search2: '', limit2: 0, order2: 'due'}, d.filter || {});
  d.color = d.color || SD_DECK_COLOURS[Math.abs(sdHash(d.name)) % SD_DECK_COLOURS.length];
  d.zoom = +d.zoom || 1;
  d.mod = d.mod || Date.now();
  return d;
}
function sdHash(s){ let h = 0; for(const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }
function sdDecks(){ return [...SD.decks.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'})); }
function sdDeckByName(name){ const n = String(name).toLowerCase(); return sdDecks().find(d => d.name.toLowerCase() === n) || null; }
function sdDeckParentName(name){ const i = name.lastIndexOf('::'); return i > -1 ? name.slice(0, i) : null; }
function sdDeckLeaf(name){ const i = name.lastIndexOf('::'); return i > -1 ? name.slice(i + 2) : name; }
function sdDeckChildren(id){
  const d = SD.decks.get(id); if(!d) return [];
  const pre = d.name + '::';
  return sdDecks().filter(x => x.name.startsWith(pre) && !x.name.slice(pre.length).includes('::'));
}
/* a deck and everything under it */
function sdDeckAndBelow(id){
  const d = SD.decks.get(id); if(!d) return [];
  const pre = d.name + '::';
  return sdDecks().filter(x => x.id === id || x.name.startsWith(pre)).map(x => x.id);
}
function sdEnsureDeck(name, extra){
  const nm = String(name || 'Default').split('::').map(x => x.trim()).filter(Boolean).join('::');
  let d = sdDeckByName(nm);
  if(d) return d;
  /* the parents come into being with the child, as Anki's do */
  const parent = sdDeckParentName(nm); if(parent) sdEnsureDeck(parent);
  d = sdDeckDefaults(Object.assign({id: sdId(), name: nm}, extra || {}));
  SD.decks.set(d.id, d); sdTouch('decks', d);
  return d;
}
function sdRenameDeck(id, name){
  const d = SD.decks.get(id); if(!d) return false;
  const nm = String(name).split('::').map(x => x.trim()).filter(Boolean).join('::');
  if(!nm || (sdDeckByName(nm) && sdDeckByName(nm).id !== id)) return false;
  const old = d.name, pre = old + '::';
  sdDecks().forEach(x => { if(x.name.startsWith(pre)){ x.name = nm + '::' + x.name.slice(pre.length); x.mod = Date.now(); sdTouch('decks', x); } });
  d.name = nm; d.mod = Date.now(); sdTouch('decks', d);
  const parent = sdDeckParentName(nm); if(parent) sdEnsureDeck(parent);
  return true;
}
/* deleting a deck deletes its cards (and notes left with no cards); returns an undo */
function sdDeleteDeck(id){
  const ids = sdDeckAndBelow(id);
  const cards = [...SD.cards.values()].filter(c => ids.includes(c.deckId) || ids.includes(c.odid));
  const decks = ids.map(i => SD.decks.get(i)).filter(Boolean);
  const notes = [];
  cards.forEach(c => { SD.cards.delete(c.id); sdUnindexCard(c); sdDrop('cards', c.id); });
  new Set(cards.map(c => c.noteId)).forEach(nid => { if(!(SD.byNote.get(nid) || []).length){ const n = SD.notes.get(nid); if(n){ notes.push(n); SD.notes.delete(nid); sdDrop('notes', nid); } } });
  decks.forEach(d => { SD.decks.delete(d.id); sdDrop('decks', d.id); });
  if(!SD.decks.size) sdEnsureDeck('Default');
  sdChanged('decks');
  return () => { decks.forEach(d => { SD.decks.set(d.id, d); sdTouch('decks', d); }); notes.forEach(n => { SD.notes.set(n.id, n); sdTouch('notes', n); });
    cards.forEach(c => { SD.cards.set(c.id, c); sdIndexCard(c); sdTouch('cards', c); }); sdChanged('decks'); };
}

/* ---------- deck options ---------- */
function sdPresetDefaults(p){
  return Object.assign({name: 'Default', newPerDay: 20, revPerDay: 200, learnSteps: [1, 10], relearnSteps: [10],
    graduatingIvl: 1, easyIvl: 4, startingEase: 2.5, easyBonus: 1.3, ivlModifier: 1, hardIvl: 1.2, lapseNewIvl: 0, minIvl: 1,
    maxIvl: 36500, leechThreshold: 8, leechAction: 'tag', buryNew: false, buryReview: false, buryInterday: false,
    newGather: 'deck', newSort: 'gather', revSort: 'due', newMix: 'mix', interdayMix: 'mix', newIgnoreRevLimit: false,
    algorithm: 'fsrs', desiredRetention: 0.9, weights: null, shortTerm: true, fuzz: true, easyDays: [1, 1, 1, 1, 1, 1, 1],
    loadBalance: true, timer: {show: false, maxAnswerSec: 60, warnSec: 0, autoRevealSec: 0, autoActionSec: 0, autoAction: 'again'},
    autoplay: true, replayQuestion: true, rescheduleOnChange: false, mod: Date.now()}, p || {});
}
function sdPreset(id){ return SD.presets.get(id) || SD.presets.get(1) || sdPresetDefaults({id: 1}); }
function sdDeckPreset(deckId){ const d = SD.decks.get(deckId); return sdPreset(d ? d.presetId : 1); }

/* ---------- note types ---------- */
const SD_BASIC_CSS = `.card {
  font-family: "EB Garamond", "Noto Serif SC", Georgia, serif;
  font-size: 26px;
  text-align: center;
  color: var(--sd-ink, #2b2622);
  background-color: transparent;
  line-height: 1.45;
}`;
const SD_CLOZE_CSS = SD_BASIC_CSS + `
.cloze { font-weight: 600; color: var(--sd-accent, #3f6f8f); }
.nightMode .cloze { color: #8fb8d8; }`;
function sdBuiltinTypes(){
  const f = (name, ord) => ({name, ord, sticky: false, rtl: false, font: '', size: 0, pinned: false});
  const t = (name, ord, qfmt, afmt) => ({name, ord, qfmt, afmt, bqfmt: '', bafmt: '', deckOverride: null});
  return [
    {name: 'Basic', kind: 'standard', fields: [f('Front', 0), f('Back', 1)],
      templates: [t('Card 1', 0, '{{Front}}', '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}')], css: SD_BASIC_CSS},
    {name: 'Basic (and reversed card)', kind: 'standard', fields: [f('Front', 0), f('Back', 1)],
      templates: [t('Card 1', 0, '{{Front}}', '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}'), t('Card 2', 1, '{{Back}}', '{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}')], css: SD_BASIC_CSS},
    {name: 'Basic (optional reversed card)', kind: 'standard', fields: [f('Front', 0), f('Back', 1), f('Add Reverse', 2)],
      templates: [t('Card 1', 0, '{{Front}}', '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}'), t('Card 2', 1, '{{#Add Reverse}}{{Back}}{{/Add Reverse}}', '{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}')], css: SD_BASIC_CSS},
    {name: 'Basic (type in the answer)', kind: 'standard', fields: [f('Front', 0), f('Back', 1)],
      templates: [t('Card 1', 0, '{{Front}}\n\n{{type:Back}}', '{{Front}}\n\n<hr id=answer>\n\n{{type:Back}}')], css: SD_BASIC_CSS},
    {name: 'Cloze', kind: 'cloze', fields: [f('Text', 0), f('Back Extra', 1)],
      templates: [t('Cloze', 0, '{{cloze:Text}}', '{{cloze:Text}}<br>\n{{Back Extra}}')], css: SD_CLOZE_CSS},
    {name: 'Image Occlusion', kind: 'io', fields: [f('Occlusion', 0), f('Image', 1), f('Header', 2), f('Back Extra', 3), f('Comments', 4)],
      templates: [t('Image Occlusion', 0, '{{#Header}}<div>{{Header}}</div>{{/Header}}\n{{image-occlusion:Occlusion}}',
        '{{#Header}}<div>{{Header}}</div>{{/Header}}\n{{image-occlusion:Occlusion}}\n<div>{{Back Extra}}</div>')], css: SD_BASIC_CSS + '\n.card { font-family: "Nunito Sans", sans-serif; font-size: 18px; }'}
  ];
}
function sdNoteTypeDefaults(nt){
  nt.kind = ['standard', 'cloze', 'io'].includes(nt.kind) ? nt.kind : 'standard';
  nt.fields = (nt.fields || []).map((f, i) => Object.assign({sticky: false, rtl: false, font: '', size: 0, pinned: false}, f, {ord: i}));
  nt.templates = (nt.templates || []).map((t, i) => Object.assign({bqfmt: '', bafmt: '', deckOverride: null}, t, {ord: i}));
  nt.css = nt.css == null ? SD_BASIC_CSS : nt.css;
  nt.sortField = +nt.sortField || 0;
  nt.jsEnabled = !!nt.jsEnabled;
  nt.mod = nt.mod || Date.now();
  return nt;
}
function sdNoteTypeByName(name){ return [...SD.noteTypes.values()].find(n => n.name === name) || null; }
function sdEnsureBasics(){
  if(!SD.presets.size){ const p = sdPresetDefaults({id: 1}); SD.presets.set(1, p); sdTouch('presets', p); }
  if(!SD.noteTypes.size) sdBuiltinTypes().forEach(t => { const nt = sdNoteTypeDefaults(Object.assign({id: sdId()}, t)); SD.noteTypes.set(nt.id, nt); sdTouch('noteTypes', nt); });
  if(!SD.decks.size) sdEnsureDeck('Default');
  sdSettings();
  sdMisc('flags', () => ({names: ['Red', 'Orange', 'Green', 'Blue', 'Pink', 'Turquoise', 'Purple'], colours: ['#c0504d', '#d98b3a', '#6a9a55', '#4a7fb5', '#c77bb0', '#4fa3a0', '#8a6fb5']}));
}

/* ---------- notes and their cards ---------- */
function sdFieldMap(note){ const nt = SD.noteTypes.get(note.noteTypeId); const m = {}; (nt ? nt.fields : []).forEach((f, i) => m[f.name] = note.fields[i] || ''); return m; }
function sdStripHTML(h){ return String(h || '').replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '').replace(/<br\s*\/?>|<div>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim(); }
function sdSortField(note){ const nt = SD.noteTypes.get(note.noteTypeId); return sdStripHTML(note.fields[nt ? nt.sortField : 0] || ''); }
function sdChecksum(note){ const s = sdStripHTML(note.fields[0] || ''); let h = 0x811c9dc5; for(const ch of s){ h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193); } return h >>> 0; }
function sdNewNote(noteTypeId, fields, tags, extra){
  const nt = SD.noteTypes.get(noteTypeId);
  const n = Object.assign({id: sdId(), guid: sdGuid(), noteTypeId, fields: (fields || []).slice(), tags: (tags || []).slice(),
    mod: Date.now(), created: Date.now(), extra: {}}, extra || {});
  while(nt && n.fields.length < nt.fields.length) n.fields.push('');
  n.sfld = sdSortField(n); n.csum = sdChecksum(n);
  return n;
}
/* which template ordinals a note should have cards for, right now */
function sdWantedOrds(note){
  const nt = SD.noteTypes.get(note.noteTypeId); if(!nt) return [];
  if(nt.kind === 'cloze') return sdClozeNumbers(note, nt).map(n => n - 1);
  if(nt.kind === 'io') return sdIoNumbers(note).map(n => n - 1);
  return nt.templates.filter(t => sdTemplateNonEmpty(t.qfmt, note, nt, t)).map(t => t.ord);
}
function sdAddNote(note, deckId){
  SD.notes.set(note.id, note); sdTouch('notes', note);
  const made = sdGenerateCards(note, deckId);
  sdChanged('notes');
  return made;
}
/* adding a note, or editing one, makes whatever cards it now has a template for */
function sdGenerateCards(note, deckId){
  const nt = SD.noteTypes.get(note.noteTypeId); if(!nt) return [];
  const have = new Set((SD.byNote.get(note.id) || []).map(id => SD.cards.get(id)).filter(Boolean).map(c => c.ord));
  const made = [];
  sdWantedOrds(note).forEach(ord => {
    if(have.has(ord)) return;
    const tpl = nt.kind === 'standard' ? nt.templates[ord] : nt.templates[0];
    const dk = tpl && tpl.deckOverride && SD.decks.has(tpl.deckOverride) ? tpl.deckOverride : (deckId || sdSettings().lastDeck || [...SD.decks.keys()][0]);
    const c = sdNewCard(note.id, dk, ord);
    SD.cards.set(c.id, c); sdIndexCard(c); sdTouch('cards', c); made.push(c);
  });
  return made;
}
function sdNewCard(noteId, deckId, ord){
  const s = sdSettings();
  const pos = s.nextPos++; sdTouch('misc', s);
  return {id: sdId(), noteId, deckId, ord, type: 0, queue: 0, due: pos, ivl: 0, factor: 0, reps: 0, lapses: 0, left: 0,
    odue: 0, odid: 0, flags: 0, mod: Date.now(), memory: null, lastReview: null, step: 0};
}
function sdCardsOf(noteId){ return (SD.byNote.get(noteId) || []).map(id => SD.cards.get(id)).filter(Boolean).sort((a, b) => a.ord - b.ord); }
function sdSaveNote(note){
  note.mod = Date.now(); note.sfld = sdSortField(note); note.csum = sdChecksum(note);
  SD.notes.set(note.id, note); sdTouch('notes', note);
  const first = sdCardsOf(note.id)[0];
  sdGenerateCards(note, first ? (first.odid || first.deckId) : null);
  sdChanged('notes');
}
function sdDeleteNotes(ids){
  const notes = [], cards = [];
  ids.forEach(id => { const n = SD.notes.get(id); if(!n) return; notes.push(n); sdCardsOf(id).forEach(c => { cards.push(c); SD.cards.delete(c.id); sdUnindexCard(c); sdDrop('cards', c.id); }); SD.notes.delete(id); sdDrop('notes', id); });
  sdChanged('notes');
  return () => { notes.forEach(n => { SD.notes.set(n.id, n); sdTouch('notes', n); }); cards.forEach(c => { SD.cards.set(c.id, c); sdIndexCard(c); sdTouch('cards', c); }); sdChanged('notes'); };
}
/* cards whose front now renders to nothing — the Empty Cards tool */
function sdEmptyCards(){
  const out = [];
  SD.notes.forEach(n => { const want = new Set(sdWantedOrds(n)); sdCardsOf(n.id).forEach(c => { if(!want.has(c.ord)) out.push(c); }); });
  return out;
}

/* ---------- tags ---------- */
function sdNormTag(t){ return String(t || '').trim().replace(/\s+/g, '_').replace(/^#/, ''); }
function sdAllTags(){ const m = new Map(); SD.notes.forEach(n => (n.tags || []).forEach(t => m.set(t.toLowerCase(), (m.get(t.toLowerCase()) || 0) + 1))); return m; }
function sdTagMeta(){ return sdMisc('tagMeta', () => ({colours: {}, collapsed: {}})); }

/* ---------- the old deck, moved in once ---------- */
async function sdMigrateOld(){
  const old = S && S.study;
  if(!old || !Array.isArray(old.cards) || !old.cards.length || old.migratedTo === 'sd2') return;
  const basic = sdNoteTypeByName('Basic'), cloze = sdNoteTypeByName('Cloze');
  const deckIds = {};
  const byId = new Map((old.decks || []).map(d => [d.id, d]));
  const nameOf = d => { const chain = []; let x = d, guard = 0; while(x && guard++ < 10){ chain.unshift(x.name || 'Deck'); x = x.parentId ? byId.get(x.parentId) : null; } return chain.join('::'); };
  (old.decks || []).forEach(d => { const nd = sdEnsureDeck(nameOf(d), {color: d.color, description: d.about || ''}); deckIds[d.id] = nd.id; });
  const today = sdToday(), revs = [];
  old.cards.forEach(oc => {
    const isCloze = oc.type === 'cloze' && oc.clozeAnswer;
    let fields;
    if(isCloze){
      /* a sentence with a hole in it becomes an Anki cloze: the hole is c1 */
      const text = String(oc.front || '');
      const filled = /_{2,}|\[\s*\.\.\.\s*\]|…/.test(text) ? text.replace(/_{2,}|\[\s*\.\.\.\s*\]|…/, `{{c1::${oc.clozeAnswer}}}`) : `${text} {{c1::${oc.clozeAnswer}}}`;
      fields = [filled, oc.back || ''];
    } else {
      const img = oc.imageData ? `<img src="${oc.imageData}">` : '';
      fields = [(oc.type === 'image_recall' ? img : '') + (oc.front || '') + (oc.type !== 'image_recall' ? img : ''), oc.back || ''];
    }
    const nt = isCloze ? cloze : basic;
    const tags = (oc.tags || []).map(sdNormTag).filter(Boolean);
    if(oc.type && oc.type !== 'text_recall' && oc.type !== 'cloze') tags.push('type::' + oc.type);
    if(oc.status === 'graduated') tags.push('graduated');
    const note = sdNewNote(nt.id, fields, tags, {extra: {sourceType: oc.sourceType, sourceId: oc.sourceId, sourceLabel: oc.sourceLabel,
      sourceGo: oc.sourceGo, reference: oc.reference, familyId: oc.familyId, familyRole: oc.familyRole, involvement: oc.involvement,
      oldId: oc.id, clozeOptions: oc.clozeOptions || null}, created: Date.parse(oc.createdAt) || Date.now()});
    SD.notes.set(note.id, note); sdTouch('notes', note);
    const c = sdNewCard(note.id, deckIds[oc.deckId] || [...SD.decks.keys()][0], 0);
    /* the schedule it had: reviewed cards stay review cards, due when they were due */
    if((+oc.reps || 0) > 0 && oc.due){
      const dueDay = sdDayOfMs(Date.parse(oc.due + 'T12:00:00') || Date.now());
      c.type = 2; c.queue = 2; c.ivl = Math.max(1, Math.round(+oc.interval || 1)); c.due = Math.max(dueDay, today - 365);
      c.factor = Math.round((+oc.ease || 2.5) * 1000); c.reps = +oc.reps || 0;
      c.lastReview = oc.lastReviewed ? Date.parse(oc.lastReviewed) : null;
    }
    if(oc.status === 'suspended') c.queue = -1;
    if(oc.status === 'inbox'){ c.queue = -1; note.tags.push('inbox'); }
    SD.cards.set(c.id, c); sdIndexCard(c); sdTouch('cards', c);
    /* its history, as reviews */
    (oc.history || []).forEach((h, i) => {
      const at = Date.parse(h.date || h.at || '') || null; if(!at) return;
      const g = h.grade || h.key; const ease = g === 'again' || g === 1 ? 1 : g === 'hard' || g === 3 ? 2 : g === 'easy' || g === 5 ? 4 : 3;
      revs.push({id: at + i, cardId: c.id, ease, ivl: +h.interval || 0, lastIvl: 0, factor: Math.round((+h.ease || 2.5) * 1000), time: 8000, type: i === 0 ? 0 : 1});
    });
  });
  if(revs.length){ const used = new Set(); revs.forEach(r => { while(used.has(r.id)) r.id++; used.add(r.id); }); await sdRevlogBulk(revs); }
  /* FSRS needs a memory state; the history just moved in is enough to rebuild it */
  if(typeof sdRebuildMemory === 'function') try { await sdRebuildMemory(); } catch(e){ console.warn('memory rebuild after migration', e); }
  old.migratedTo = 'sd2'; old.migratedAt = new Date().toISOString();
  if(typeof saveNow === 'function') saveNow();
  await sdFlush();
}

/* ---------- the rest of the house asks the deck things ---------- */
/* Every card's schedule is answered from the same counts the deck list uses. */
function sdDueCount(){
  if(!SD.loaded) return (S.sdSummary && S.sdSummary.due) || 0;
  const t = sdToday(), now = sdNowSec(), s = sdSettings();
  let n = 0; SD.cards.forEach(c => { if((c.queue === 2 || c.queue === 3) && c.due <= t) n++; else if(c.queue === 1 && c.due <= now + s.learnAheadMin * 60) n++; });
  return n;
}
function sdSummarise(){
  if(!SD.loaded) return;
  const newN = [...SD.cards.values()].filter(c => c.queue === 0).length;
  S.sdSummary = {due: sdDueCount(), cards: SD.cards.size, notes: SD.notes.size, newCards: newN, at: Date.now(), decks: sdDecks().filter(d => !d.isFiltered).map(d => [d.id, d.name])};
}
