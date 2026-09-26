/* ============================================================
   THE STUDY DECK — Anki files in and out.

   IN. An .apkg (a deck) or .colpkg (a whole collection) is a zip. Which
   database is inside says which Anki wrote it:
     collection.anki2 only             Legacy 1 (schema 11, JSON config)
     + collection.anki21               Legacy 2 (read the .anki21)
     + collection.anki21b              Latest   (schema 18, zstd-compressed,
                                       note types / decks / options in
                                       their own tables, protobuf configs)
   The "meta" file, when present, says so outright. The database is opened
   with SQLite compiled to WebAssembly (sql.js), in a Worker, so a deck of
   fifty thousand cards and hundreds of megabytes of media does not freeze
   the page; the media is streamed into the database in batches.

   What is read: note types (fields, templates, CSS, cloze or not), decks
   and their options, notes (GUID, fields split on \x1f, tags), cards with
   their full schedule (type, queue, due, interval, ease, reps, lapses,
   flags, FSRS memory when Anki kept it), the review log, and the media.
   Re-importing an updated shared deck matches notes by GUID and asks.

   OUT. Your decks as .apkg in the Legacy 2 format (collection.anki21, a
   dummy collection.anki2, the media map and numbered media) so they go
   back into Anki; a full-fidelity JSON; CSV.
   ============================================================ */

/* ---------- the importer's libraries, in a Worker ---------- */
function sdImportWorkerSrc(){
  const L = sdLibs();
  if(!L.sqljs || !L.wasm || !L.fflate) throw new Error('The importer is not built into this copy (run npm install, then build).');
  return `
var module = {exports: {}}, exports = module.exports;
${L.fflate}
var fflate = module.exports && module.exports.unzipSync ? module.exports : self.fflate;
module = {exports: {}}; exports = module.exports;
${L.fzstd || ''}
var fzstd = module.exports && module.exports.decompress ? module.exports : self.fzstd;
module = undefined; exports = undefined;
${L.sqljs}
var WASM_B64 = ${JSON.stringify(L.wasm)};
${sdImportWorkerBody.toString()}
sdImportWorkerBody();`;
}
/* runs inside the Worker */
function sdImportWorkerBody(){
  function b64(s){ var bin = atob(s), u = new Uint8Array(bin.length); for(var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  var SQL = null;
  function sql(){ if(SQL) return Promise.resolve(SQL); return initSqlJs({wasmBinary: b64(WASM_B64).buffer}).then(function(s){ SQL = s; return s; }); }
  function isZstd(u){ return u && u.length > 4 && u[0] === 0x28 && u[1] === 0xB5 && u[2] === 0x2F && u[3] === 0xFD; }
  function unz(u){ return isZstd(u) ? fzstd.decompress(u) : u; }
  /* the smallest protobuf reader: varints, lengths, and the fields we need */
  function pb(buf){
    var out = {}, i = 0;
    function varint(){ var r = 0, s = 0, b; do { b = buf[i++]; r += (b & 0x7f) * Math.pow(2, s); s += 7; } while(b & 0x80); return r; }
    while(i < buf.length){
      var key = varint(), f = Math.floor(key / 8), w = key & 7, v;
      if(w === 0) v = varint();
      else if(w === 2){ var l = varint(); v = buf.subarray(i, i + l); i += l; }
      else if(w === 1){ v = new DataView(buf.buffer, buf.byteOffset + i, 8).getFloat64(0, true); i += 8; }
      else if(w === 5){ v = new DataView(buf.buffer, buf.byteOffset + i, 4).getFloat32(0, true); i += 4; }
      else break;
      (out[f] = out[f] || []).push(v);
    }
    return out;
  }
  var td = new TextDecoder();
  var str = function(v){ return v ? td.decode(v) : ''; };
  function rows(db, q){ try { var r = db.exec(q); if(!r.length) return []; var cols = r[0].columns; return r[0].values.map(function(v){ var o = {}; cols.forEach(function(c, k){ o[c] = v[k]; }); return o; }); } catch(e){ return []; } }
  self.onmessage = function(e){
    var m = e.data; if(m.type !== 'import') return;
    var post = function(stage, f){ self.postMessage({type: 'progress', stage: stage, f: f}); };
    try {
      post('Unzipping', 0.02);
      var files = fflate.unzipSync(new Uint8Array(m.bytes));
      var names = Object.keys(files);
      var format = files['collection.anki21b'] ? 'latest' : files['collection.anki21'] ? 'legacy2' : files['collection.anki2'] ? 'legacy1' : null;
      if(files.meta){ var mv = pb(files.meta); var ver = mv[1] && mv[1][0]; if(ver === 3) format = 'latest'; else if(ver === 2 && files['collection.anki21']) format = 'legacy2'; }
      if(!format) throw new Error('No Anki collection in that file.');
      var dbBytes = format === 'latest' ? unz(files['collection.anki21b']) : format === 'legacy2' ? files['collection.anki21'] : files['collection.anki2'];
      post('Reading the database', 0.1);
      sql().then(function(SQL){
        var db = new SQL.Database(dbBytes);
        var col = rows(db, 'select * from col')[0] || {};
        var out = {format: format, crt: col.crt || 0, noteTypes: [], decks: [], dconf: [], notes: [], cards: [], revlog: [], warnings: []};
        if(format === 'latest'){
          /* schema 18: note types, fields, templates, decks, deck options in their own tables */
          rows(db, 'select id, name, mtime_secs, config from notetypes').forEach(function(nt){
            var cfg = pb(nt.config || new Uint8Array());
            var kind = cfg[1] && cfg[1][0] === 1 ? 'cloze' : 'standard';
            var css = str(cfg[3] && cfg[3][0]);
            var fields = rows(db, 'select ord, name, config from fields where ntid = ' + nt.id + ' order by ord').map(function(f){ return {name: f.name, ord: f.ord}; });
            var tmpls = rows(db, 'select ord, name, config from templates where ntid = ' + nt.id + ' order by ord').map(function(t){
              var c = pb(t.config || new Uint8Array()); return {name: t.name, ord: t.ord, qfmt: str(c[1] && c[1][0]), afmt: str(c[2] && c[2][0]), bqfmt: str(c[3] && c[3][0]), bafmt: str(c[4] && c[4][0])}; });
            /* the original stock kind (image occlusion is 6) */
            var orig = cfg[9] && cfg[9][0];
            out.noteTypes.push({ankiId: nt.id, name: nt.name, kind: orig === 6 ? 'io' : kind, css: css, fields: fields, templates: tmpls, sortField: (cfg[2] && cfg[2][0]) || 0});
          });
          rows(db, 'select id, name, common, kind from decks').forEach(function(d){
            var k = pb(d.kind || new Uint8Array()); var normal = k[1] ? pb(k[1][0]) : null; var filtered = k[2] ? pb(k[2][0]) : null;
            out.decks.push({ankiId: d.id, name: String(d.name).replace(/\x1f/g, '::'), conf: normal && normal[1] ? normal[1][0] : 1, filtered: !!filtered, description: normal && normal[3] ? str(normal[3][0]) : ''});
          });
          rows(db, 'select id, name, config from deck_config').forEach(function(c){
            var p = pb(c.config || new Uint8Array());
            var steps = function(f){ return (p[f] || []).length && p[f][0] instanceof Uint8Array ? Array.from(new Float32Array(p[f][0].slice().buffer)) : (p[f] || []); };
            out.dconf.push({ankiId: c.id, name: c.name, learnSteps: steps(1), relearnSteps: steps(2), newPerDay: p[9] ? p[9][0] : 20, revPerDay: p[10] ? p[10][0] : 200,
              desiredRetention: p[37] ? p[37][0] : null, leechThreshold: p[22] ? p[22][0] : 8});
          });
        } else {
          /* schema 11: JSON in the col row */
          var models = JSON.parse(col.models || '{}'), decks = JSON.parse(col.decks || '{}'), dconf = JSON.parse(col.dconf || '{}');
          Object.keys(models).forEach(function(k){ var mdl = models[k];
            out.noteTypes.push({ankiId: +mdl.id, name: mdl.name, kind: mdl.type === 1 ? 'cloze' : 'standard', css: mdl.css || '', sortField: mdl.sortf || 0,
              fields: (mdl.flds || []).map(function(f){ return {name: f.name, ord: f.ord, sticky: !!f.sticky, rtl: !!f.rtl, font: f.font || '', size: f.size || 0}; }),
              templates: (mdl.tmpls || []).map(function(t){ return {name: t.name, ord: t.ord, qfmt: t.qfmt || '', afmt: t.afmt || '', bqfmt: t.bqfmt || '', bafmt: t.bafmt || '', did: t.did || null}; })}); });
          Object.keys(decks).forEach(function(k){ var d = decks[k]; out.decks.push({ankiId: +d.id, name: d.name, conf: d.conf || 1, filtered: !!d.dyn, description: d.desc || ''}); });
          Object.keys(dconf).forEach(function(k){ var c = dconf[k];
            out.dconf.push({ankiId: +c.id, name: c.name, learnSteps: (c['new'] || {}).delays || [1, 10], relearnSteps: (c.lapse || {}).delays || [10],
              newPerDay: (c['new'] || {}).perDay || 20, revPerDay: (c.rev || {}).perDay || 200, graduatingIvl: ((c['new'] || {}).ints || [1, 4])[0], easyIvl: ((c['new'] || {}).ints || [1, 4])[1],
              startingEase: ((c['new'] || {}).initialFactor || 2500) / 1000, easyBonus: (c.rev || {}).ease4 || 1.3, ivlModifier: (c.rev || {}).ivlFct || 1, maxIvl: (c.rev || {}).maxIvl || 36500,
              hardIvl: (c.rev || {}).hardFactor || 1.2, lapseNewIvl: (c.lapse || {}).mult || 0, minIvl: (c.lapse || {}).minInt || 1, leechThreshold: (c.lapse || {}).leechFails || 8,
              leechAction: (c.lapse || {}).leechAction === 0 ? 'suspend' : 'tag', buryNew: !!(c['new'] || {}).bury, buryReview: !!(c.rev || {}).bury,
              desiredRetention: c.desiredRetention || null, weights: c.fsrsWeights && c.fsrsWeights.length ? c.fsrsWeights : null}); });
        }
        post('Reading notes', 0.25);
        out.notes = rows(db, 'select id, guid, mid, mod, tags, flds from notes').map(function(n){ return {ankiId: n.id, guid: n.guid, mid: n.mid, mod: n.mod, tags: String(n.tags || '').trim().split(/\s+/).filter(Boolean), fields: String(n.flds).split('\x1f')}; });
        post('Reading cards', 0.4);
        out.cards = rows(db, 'select id, nid, did, ord, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data from cards').map(function(c){
          var mem = null; try { var d = c.data ? JSON.parse(c.data) : null; if(d && d.s != null) mem = {s: d.s, d: d.d}; } catch(e){}
          return {ankiId: c.id, nid: c.nid, did: c.did, ord: c.ord, type: c.type, queue: c.queue, due: c.due, ivl: c.ivl, factor: c.factor, reps: c.reps, lapses: c.lapses, left: c.left, odue: c.odue, odid: c.odid, flags: c.flags, memory: mem}; });
        if(m.withSchedule){ post('Reading the review log', 0.5);
          out.revlog = rows(db, 'select id, cid, ease, ivl, lastIvl, factor, time, type from revlog').map(function(r){ return {ankiId: r.id, cid: r.cid, ease: r.ease, ivl: r.ivl, lastIvl: r.lastIvl, factor: r.factor, time: r.time, type: r.type}; }); }
        db.close();
        /* media: a JSON map (legacy) or a protobuf list (latest); numbered files at the zip's root */
        post('Reading media', 0.6);
        var media = [];
        if(files.media){
          var raw = unz(files.media), map = null;
          try { map = JSON.parse(td.decode(raw)); } catch(e){ map = null; }
          if(map) Object.keys(map).forEach(function(k){ if(files[k]) media.push({name: map[k], idx: k}); });
          else { var entries = pb(raw)[1] || []; entries.forEach(function(en, i){ var e2 = pb(en); var nm = str(e2[1] && e2[1][0]); if(files[String(i)]) media.push({name: nm, idx: String(i)}); }); }
        }
        out.mediaCount = media.length;
        self.postMessage({type: 'data', data: out});
        /* the media, in batches, each file decompressed if it needs to be */
        var batch = [], size = 0;
        media.forEach(function(md, i){
          var bytes = unz(files[md.idx]);
          batch.push({name: md.name, bytes: bytes}); size += bytes.length;
          if(size > 8e6 || batch.length >= 200 || i === media.length - 1){
            self.postMessage({type: 'media', files: batch, done: i + 1, total: media.length}, batch.map(function(b){ return b.bytes.buffer; }));
            batch = []; size = 0;
          }
        });
        self.postMessage({type: 'done'});
      }).catch(function(err){ self.postMessage({type: 'error', message: String(err && err.message || err)}); });
    } catch(err){ self.postMessage({type: 'error', message: String(err && err.message || err)}); }
  };
}

/* ---------- the import itself, on the page ---------- */
async function sdImportAnki(file, opts, progress){
  const o = Object.assign({withSchedule: true, noteTypeMerge: 'id', onUpdate: 'newer', deckPrefix: ''}, opts);
  const url = URL.createObjectURL(new Blob([sdImportWorkerSrc()], {type: 'text/javascript'}));
  const w = new Worker(url);
  const bytes = await file.arrayBuffer();
  const summary = {file: file.name, date: Date.now(), format: null, notesAdded: 0, notesUpdated: 0, notesSkipped: 0, cards: 0, revlog: 0, media: 0, warnings: [], conflicts: []};
  return new Promise((resolve, reject) => {
    let data = null;
    const mediaDone = [];
    w.onmessage = async e => {
      const m = e.data;
      if(m.type === 'progress') progress && progress(m.stage, m.f);
      else if(m.type === 'error'){ w.terminate(); URL.revokeObjectURL(url);
        reject(new Error(/zstd|protobuf|anki21b/i.test(m.message) ? m.message + ' — try exporting from Anki with “Support older Anki versions” ticked.' : m.message)); }
      else if(m.type === 'data'){ data = m.data; summary.format = data.format; progress && progress('Importing notes', 0.65);
        try { await sdApplyImport(data, o, summary, progress); } catch(err){ w.terminate(); reject(err); } }
      else if(m.type === 'media'){
        const job = (async () => { for(const f of m.files){ await sdMediaPut(f.name, new Blob([f.bytes], {type: sdMime(f.name)})); summary.media++; } progress && progress(`Importing media (${m.done} of ${m.total})`, 0.85 + 0.13 * m.done / m.total); })();
        mediaDone.push(job);
      }
      else if(m.type === 'done'){ await Promise.all(mediaDone); w.terminate(); URL.revokeObjectURL(url);
        await sdFlush(); progress && progress('Done', 1);
        const log = sdMisc('imports', () => ({list: []})); log.list.push(Object.assign({}, summary, {conflicts: summary.conflicts.length})); sdTouch('misc', log);
        sdSummarise(); sdChanged('import'); resolve(summary); }
    };
    w.onerror = e => { reject(new Error(e.message || 'The importer failed.')); };
    w.postMessage({type: 'import', bytes, withSchedule: o.withSchedule}, [bytes]);
  });
}
function sdMime(n){ const e = String(n).split('.').pop().toLowerCase();
  return {png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', mp3: 'audio/mpeg', ogg: 'audio/ogg', oga: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4', webm: 'audio/webm', mp4: 'video/mp4', opus: 'audio/ogg'}[e] || 'application/octet-stream'; }
async function sdApplyImport(data, o, summary, progress){
  /* note types: matched by Anki id (or created) */
  const ntMap = new Map();
  data.noteTypes.forEach(t => {
    let nt = o.noteTypeMerge === 'id' ? [...SD.noteTypes.values()].find(x => x.ankiId === t.ankiId) : null;
    if(nt && JSON.stringify(nt.fields.map(f => f.name)) !== JSON.stringify(t.fields.map(f => f.name))) nt = null;   /* a changed shape gets its own copy */
    if(!nt){
      nt = sdNoteTypeDefaults({id: sdId(), ankiId: t.ankiId, name: t.name + (sdNoteTypeByName(t.name) ? ' (imported)' : ''), kind: t.kind, css: t.css, fields: t.fields, templates: t.templates.map(x => Object.assign({}, x, {deckOverride: null})), sortField: t.sortField});
      SD.noteTypes.set(nt.id, nt); sdTouch('noteTypes', nt);
    }
    ntMap.set(t.ankiId, nt);
  });
  /* presets and decks */
  const presetMap = new Map();
  data.dconf.forEach(c => {
    const p = sdPresetDefaults(Object.assign({id: sdId(), name: c.name + ' (imported)', ankiId: c.ankiId}, Object.fromEntries(Object.entries(c).filter(([k, v]) => v != null && k !== 'ankiId' && k !== 'name'))));
    p.learnSteps = (p.learnSteps || []).map(Number); p.relearnSteps = (p.relearnSteps || []).map(Number);
    if(!c.desiredRetention) p.desiredRetention = 0.9;
    const same = [...SD.presets.values()].find(x => x.ankiId === c.ankiId);
    if(same){ presetMap.set(c.ankiId, same.id); return; }
    SD.presets.set(p.id, p); sdTouch('presets', p); presetMap.set(c.ankiId, p.id);
  });
  const deckMap = new Map();
  data.decks.forEach(d => {
    if(d.filtered) return;
    if(d.ankiId === 1 && !data.cards.some(c => c.did === 1)) return;
    const name = (o.deckPrefix ? o.deckPrefix + '::' : '') + d.name;
    const nd = sdEnsureDeck(name, {ankiId: d.ankiId, description: d.description});
    if(presetMap.has(d.conf) && nd.presetId === 1) { nd.presetId = presetMap.get(d.conf); sdTouch('decks', nd); }
    deckMap.set(d.ankiId, nd.id);
  });
  const fallbackDeck = () => sdEnsureDeck((o.deckPrefix ? o.deckPrefix + '::' : '') + 'Imported').id;
  /* the collection's day zero, so review due days line up with ours */
  const ankiCrtDay = data.crt ? sdAbsDay(data.crt * 1000, sdSettings().dayStartHour) : sdSettings().crtDay;
  const dayShift = ankiCrtDay - sdSettings().crtDay;
  /* notes: by GUID */
  const byGuid = new Map(); SD.notes.forEach(n => byGuid.set(n.guid, n));
  const noteMap = new Map();
  let i = 0;
  for(const n of data.notes){
    const nt = ntMap.get(n.mid); if(!nt){ summary.warnings.push(`A note of an unknown type (${n.mid}) was skipped.`); continue; }
    const have = byGuid.get(n.guid);
    if(have){
      const theirs = n.mod * 1000, mine = have.mod || 0;
      const changed = JSON.stringify(have.fields) !== JSON.stringify(n.fields) || have.tags.join(' ') !== n.tags.join(' ');
      if(!changed || o.onUpdate === 'mine' || (o.onUpdate === 'newer' && mine >= theirs)){ summary.notesSkipped++; noteMap.set(n.ankiId, have); }
      else if(o.onUpdate === 'ask'){ summary.conflicts.push({noteId: have.id, theirs: n.fields, theirTags: n.tags}); noteMap.set(n.ankiId, have); }
      else { have.fields = n.fields.slice(); have.tags = n.tags.slice(); have.mod = theirs; sdTouch('notes', have); summary.notesUpdated++; noteMap.set(n.ankiId, have); }
      continue;
    }
    const note = {id: sdId(), guid: n.guid, noteTypeId: nt.id, fields: n.fields.slice(), tags: n.tags.slice(), mod: n.mod * 1000, created: n.ankiId, extra: {ankiId: n.ankiId}};
    while(note.fields.length < nt.fields.length) note.fields.push('');
    note.sfld = sdSortField(note); note.csum = sdChecksum(note);
    SD.notes.set(note.id, note); sdTouch('notes', note); byGuid.set(n.guid, note); noteMap.set(n.ankiId, note); summary.notesAdded++;
    if(++i % 2000 === 0){ progress && progress(`Importing notes (${i})`, 0.65 + 0.1 * i / data.notes.length); await new Promise(r => setTimeout(r, 0)); }
  }
  /* cards, with their schedule, or as new */
  const cardMap = new Map(), s = sdSettings(), nowSec = sdNowSec();
  i = 0;
  for(const c of data.cards){
    const note = noteMap.get(c.nid); if(!note) continue;
    const existing = sdCardsOf(note.id).find(x => x.ord === c.ord);
    if(existing){ cardMap.set(c.ankiId, existing); continue; }
    const card = {id: sdId(), noteId: note.id, deckId: deckMap.get(c.odid || c.did) || deckMap.get(c.did) || fallbackDeck(), ord: c.ord, type: 0, queue: 0, due: s.nextPos++,
      ivl: 0, factor: 0, reps: 0, lapses: 0, left: 0, odue: 0, odid: 0, flags: c.flags & 7, mod: Date.now(), memory: null, lastReview: null, step: 0, ankiId: c.ankiId};
    if(o.withSchedule && c.type > 0){
      card.type = c.type; card.ivl = c.ivl; card.factor = c.factor; card.reps = c.reps; card.lapses = c.lapses; card.left = c.left; card.memory = c.memory;
      const due = c.odid ? c.odue : c.due;
      if(c.type === 2 || c.queue === 3){ card.due = due + dayShift; card.queue = c.queue === 3 ? 3 : 2; }
      else if(c.type === 1 || c.type === 3){ card.due = due > 1e8 ? due : nowSec; card.queue = due > 1e8 ? 1 : 3; if(card.queue === 3) card.due = due + dayShift; }
      if(c.queue === -1) card.queue = -1;
    } else if(!o.withSchedule){ card.due = s.nextPos++; }
    else card.due = c.due;
    if(c.queue === -1 && o.withSchedule) card.queue = -1;
    SD.cards.set(card.id, card); sdIndexCard(card); sdTouch('cards', card); cardMap.set(c.ankiId, card); summary.cards++;
    if(++i % 3000 === 0){ progress && progress(`Importing cards (${i})`, 0.75 + 0.05 * i / data.cards.length); await new Promise(r => setTimeout(r, 0)); }
  }
  sdTouch('misc', s);
  /* the review log */
  if(o.withSchedule && data.revlog.length){
    const have = new Set(SD.revlog.map(r => r.id)), add = [];
    data.revlog.forEach(r => { const c = cardMap.get(r.cid); if(!c || have.has(r.ankiId)) return;
      add.push({id: r.ankiId, cardId: c.id, ease: r.ease, ivl: r.ivl, lastIvl: r.lastIvl, factor: r.factor, time: r.time, type: r.type}); });
    add.forEach(r => { const c = SD.cards.get(r.cardId); if(c && (!c.lastReview || r.id > c.lastReview) && r.ease > 0) c.lastReview = r.id; });
    await sdRevlogBulk(add); summary.revlog = add.length;
    progress && progress('Rebuilding memory from history', 0.82);
    await sdRebuildMemory([...new Set(add.map(r => r.cardId))].filter(id => { const c = SD.cards.get(id); return c && !c.memory; }));
  }
  /* notes without any card now (a note type with templates that render
     nothing) get theirs generated */
  noteMap.forEach(n => { if(!sdCardsOf(n.id).length) sdGenerateCards(n, fallbackDeck()); });
  await sdFlush();
}

/* ---------- CSV / TSV / plain text ---------- */
function sdParseDelimited(text){
  const first = text.split(/\r?\n/).find(l => l && !l.startsWith('#')) || '';
  const sep = /\t/.test(first) ? '\t' : /;/.test(first) && !/,/.test(first) ? ';' : /,/.test(first) ? ',' : '\t';
  const headers = {}; text.split(/\r?\n/).filter(l => l.startsWith('#')).forEach(l => { const m = l.match(/^#(\w+):(.*)$/); if(m) headers[m[1]] = m[2].trim(); });
  const rows = []; let row = [], cell = '', q = false;
  const body = text.split(/\r?\n/).filter(l => !l.startsWith('#')).join('\n');
  for(let i = 0; i < body.length; i++){
    const ch = body[i];
    if(q){ if(ch === '"' && body[i + 1] === '"'){ cell += '"'; i++; } else if(ch === '"') q = false; else cell += ch; }
    else if(ch === '"' && cell === '') q = true;
    else if(ch === (headers.separator === 'Tab' ? '\t' : sep)){ row.push(cell); cell = ''; }
    else if(ch === '\n'){ row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if(cell || row.length){ row.push(cell); rows.push(row); }
  return {rows: rows.filter(r => r.some(c => c.trim())), headers, sep};
}
function sdImportCsv(rows, map, opts){
  /* map: column index → 'f:<n>' | 'tags' | 'deck' | '' */
  const nt = SD.noteTypes.get(opts.noteTypeId), deck = SD.decks.get(opts.deckId);
  let added = 0, dupes = 0;
  const existing = new Set([...SD.notes.values()].filter(n => n.noteTypeId === nt.id).map(n => sdStripHTML(n.fields[0]).toLowerCase()));
  rows.forEach(r => {
    const fields = nt.fields.map(() => ''), tags = (opts.tags || []).slice(); let dk = deck;
    r.forEach((v, i) => { const m = map[i]; if(!m) return; if(m === 'tags') v.split(/\s+/).filter(Boolean).forEach(t => tags.push(sdNormTag(t)));
      else if(m === 'deck') dk = sdEnsureDeck(v.trim() || deck.name); else if(m.startsWith('f:')) fields[+m.slice(2)] = opts.html ? v : sdEsc(v).replace(/\n/g, '<br>'); });
    if(!sdStripHTML(fields[0])) return;
    if(existing.has(sdStripHTML(fields[0]).toLowerCase()) && opts.dupes === 'skip'){ dupes++; return; }
    const n = sdNewNote(nt.id, fields, tags); if(sdAddNote(n, dk.id).length) added++;
  });
  sdSummarise();
  return {added, dupes};
}

/* ---------- out: .apkg (Legacy 2), JSON, CSV ---------- */
async function sdSqlJs(){
  if(sdSqlJs.SQL) return sdSqlJs.SQL;
  const L = sdLibs(); if(!L.sqljs) throw new Error('SQLite is not built into this copy.');
  const mod = {exports: {}};
  new Function('module', 'exports', L.sqljs)(mod, mod.exports);
  const init = mod.exports || (typeof initSqlJs !== 'undefined' ? initSqlJs : null);
  const bin = Uint8Array.from(atob(L.wasm), c => c.charCodeAt(0));
  sdSqlJs.SQL = await (typeof init === 'function' ? init : init.default)({wasmBinary: bin.buffer});
  return sdSqlJs.SQL;
}
function sdFflate(){
  if(sdFflate.lib) return sdFflate.lib;
  const mod = {exports: {}}; new Function('module', 'exports', sdLibs().fflate)(mod, mod.exports);
  return (sdFflate.lib = mod.exports.zipSync ? mod.exports : self.fflate);
}
async function sdExportApkg(deckIds, withSchedule){
  const SQL = await sdSqlJs(), ff = sdFflate();
  const ids = new Set(deckIds.flatMap(id => sdDeckAndBelow(id)));
  const cards = [...SD.cards.values()].filter(c => ids.has(c.odid || c.deckId));
  const noteIds = new Set(cards.map(c => c.noteId)), notes = [...noteIds].map(i => SD.notes.get(i)).filter(Boolean);
  const nts = new Set(notes.map(n => n.noteTypeId));
  const db = new SQL.Database();
  db.run(`CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null);
    CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);
    CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null);
    CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
    CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);`);
  const s = sdSettings(), crt = Math.floor(sdDayToDate(0).getTime() / 1000);
  const models = {}, decks = {}, dconf = {};
  nts.forEach(id => { const t = SD.noteTypes.get(id);
    models[t.ankiId || t.id] = {id: t.ankiId || t.id, name: t.name, type: t.kind === 'cloze' || t.kind === 'io' ? 1 : 0, mod: Math.floor((t.mod || Date.now()) / 1000), usn: -1, sortf: t.sortField, did: null, tags: [], vers: [], req: [],
      flds: t.fields.map(f => ({name: f.name, ord: f.ord, sticky: !!f.sticky, rtl: !!f.rtl, font: f.font || 'Arial', size: f.size || 20, media: []})),
      tmpls: t.templates.map(x => ({name: x.name, ord: x.ord, qfmt: x.qfmt, afmt: x.afmt, bqfmt: x.bqfmt || '', bafmt: x.bafmt || '', did: null, bfont: '', bsize: 0})),
      css: t.css, latexPre: '\\documentclass[12pt]{article}\n\\begin{document}\n', latexPost: '\\end{document}', latexsvg: false}; });
  const deckOut = [...ids].map(i => SD.decks.get(i)).filter(d => d && !d.isFiltered);
  decks[1] = {id: 1, name: 'Default', conf: 1, desc: '', dyn: 0, collapsed: false, newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0], mod: 0, usn: -1, extendNew: 0, extendRev: 0};
  deckOut.forEach(d => { const p = sdPreset(d.presetId); decks[d.ankiId || d.id] = {id: d.ankiId || d.id, name: d.name, conf: p.ankiId || p.id, desc: d.description || '', dyn: 0, collapsed: false,
    newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0], mod: Math.floor(d.mod / 1000), usn: -1, extendNew: 0, extendRev: 0};
    dconf[p.ankiId || p.id] = {id: p.ankiId || p.id, name: p.name, mod: 0, usn: -1, maxTaken: 60, autoplay: p.autoplay, timer: 0, replayq: true, dyn: false,
      new: {delays: p.learnSteps, ints: [p.graduatingIvl, p.easyIvl, 7], initialFactor: Math.round(p.startingEase * 1000), order: 1, perDay: p.newPerDay, bury: p.buryNew},
      rev: {perDay: p.revPerDay, ease4: p.easyBonus, ivlFct: p.ivlModifier, maxIvl: p.maxIvl, hardFactor: p.hardIvl, bury: p.buryReview},
      lapse: {delays: p.relearnSteps, mult: p.lapseNewIvl, minInt: p.minIvl, leechFails: p.leechThreshold, leechAction: p.leechAction === 'suspend' ? 0 : 1},
      desiredRetention: p.desiredRetention, fsrsWeights: p.weights || []}; });
  if(!dconf[1]) dconf[1] = Object.assign({}, Object.values(dconf)[0] || {}, {id: 1, name: 'Default'});
  db.run('INSERT INTO col VALUES (1,?,?,?,11,0,0,0,?,?,?,?,?)', [crt, Date.now(), Date.now(), JSON.stringify({nextPos: s.nextPos, schedVer: 2}), JSON.stringify(models), JSON.stringify(decks), JSON.stringify(dconf), '{}']);
  const ins = db.prepare('INSERT INTO notes VALUES (?,?,?,?,-1,?,?,?,?,0,"")');
  notes.forEach(n => { const t = SD.noteTypes.get(n.noteTypeId); ins.run([n.extra && n.extra.ankiId || n.id, n.guid, t.ankiId || t.id, Math.floor((n.mod || Date.now()) / 1000), ' ' + n.tags.join(' ') + ' ', n.fields.join('\x1f'), sdSortField(n), sdChecksum(n)]); });
  ins.free();
  const insc = db.prepare('INSERT INTO cards VALUES (?,?,?,?,?,-1,?,?,?,?,?,?,?,?,0,0,?,?)');
  cards.forEach(c => { const n = SD.notes.get(c.noteId), d = SD.decks.get(c.odid || c.deckId);
    const sched = withSchedule && c.type !== 0;
    const due = !sched ? c.due : c.queue === 1 ? c.due : (c.odid ? c.odue : c.due);
    insc.run([c.ankiId || c.id, n.extra && n.extra.ankiId || n.id, d.ankiId || d.id, c.ord, Math.floor(c.mod / 1000), sched ? c.type : 0, sched ? (c.queue === 4 ? 1 : c.queue < -1 ? sdNaturalQueue(c) : c.queue) : 0,
      due, sched ? c.ivl : 0, sched ? c.factor || 2500 : 0, sched ? c.reps : 0, sched ? c.lapses : 0, sched ? c.left : 0, c.flags & 7,
      sched && c.memory ? JSON.stringify({s: c.memory.s, d: c.memory.d}) : '{}']); });
  insc.free();
  if(withSchedule){ const cids = new Set(cards.map(c => c.id)); const insr = db.prepare('INSERT INTO revlog VALUES (?,?,-1,?,?,?,?,?,?)');
    SD.revlog.forEach(r => { if(!cids.has(r.cardId)) return; const c = SD.cards.get(r.cardId); insr.run([r.id, c.ankiId || c.id, r.ease, r.ivl, r.lastIvl, r.factor || 0, r.time, r.type]); }); insr.free(); }
  const bytes = db.export(); db.close();
  /* the media the notes use */
  const used = new Set(); notes.forEach(n => n.fields.forEach(f => { f.replace(/src=["']([^"':]+)["']/gi, (m, x) => used.add(decodeURIComponent(x))); f.replace(/\[sound:([^\]]+)\]/g, (m, x) => used.add(x)); }));
  const files = {'collection.anki21': bytes, 'collection.anki2': await sdDummyAnki2(SQL)};
  const map = {}; let k = 0;
  for(const name of used){ const rows = await db2media(name); if(!rows) continue; files[String(k)] = new Uint8Array(await rows.blob.arrayBuffer()); map[String(k)] = name; k++; }
  files.media = new TextEncoder().encode(JSON.stringify(map));
  return new Blob([ff.zipSync(files, {level: 6})], {type: 'application/zip'});
}
async function db2media(name){ const r = await db.sdMedia.where('filename').equals(name).toArray(); return r[0] || null; }
async function sdDummyAnki2(SQL){
  /* older Anki needs a collection.anki2 to be there; it only says to update */
  const d = new SQL.Database();
  d.run(`CREATE TABLE col (id integer primary key, crt integer, mod integer, scm integer, ver integer, dty integer, usn integer, ls integer, conf text, models text, decks text, dconf text, tags text);
    CREATE TABLE notes (id integer primary key, guid text, mid integer, mod integer, usn integer, tags text, flds text, sfld integer, csum integer, flags integer, data text);
    CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer, mod integer, usn integer, type integer, queue integer, due integer, ivl integer, factor integer, reps integer, lapses integer, left integer, odue integer, odid integer, flags integer, data text);
    CREATE TABLE revlog (id integer primary key, cid integer, usn integer, ease integer, ivl integer, lastIvl integer, factor integer, time integer, type integer); CREATE TABLE graves (usn integer, oid integer, type integer);`);
  const out = d.export(); d.close(); return out;
}
function sdExportJson(deckIds){
  const ids = deckIds ? new Set(deckIds.flatMap(id => sdDeckAndBelow(id))) : null;
  const cards = [...SD.cards.values()].filter(c => !ids || ids.has(c.odid || c.deckId));
  const nids = new Set(cards.map(c => c.noteId)), cids = new Set(cards.map(c => c.id));
  const notes = [...SD.notes.values()].filter(n => nids.has(n.id));
  return JSON.stringify({studyDeck: 2, exportedAt: new Date().toISOString(), noteTypes: [...new Set(notes.map(n => n.noteTypeId))].map(i => SD.noteTypes.get(i)),
    decks: [...SD.decks.values()].filter(d => !ids || ids.has(d.id)), presets: [...SD.presets.values()], notes, cards, revlog: SD.revlog.filter(r => cids.has(r.cardId)), settings: sdSettings()}, null, 1);
}
function sdExportCsv(deckIds){
  const ids = new Set(deckIds.flatMap(id => sdDeckAndBelow(id)));
  const nids = new Set([...SD.cards.values()].filter(c => ids.has(c.odid || c.deckId)).map(c => c.noteId));
  const q = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  return '#separator:Comma\n#html:true\n#tags column:' + (Math.max(0, ...[...nids].map(i => SD.notes.get(i).fields.length)) + 1) + '\n' +
    [...nids].map(i => { const n = SD.notes.get(i); return n.fields.map(q).concat(q(n.tags.join(' '))).join(','); }).join('\n');
}
function sdDownload(blob, name){ const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000); }
function sdExportDialog(deckId){
  const d = SD.decks.get(deckId);
  openModal(`<h2 class="serif">Export ${esc(d ? d.name : 'everything')}</h2>
    <div class="sx-cs"><label><input type="radio" name="ex" value="apkg" checked> Anki deck (.apkg, opens in Anki)</label><label><input type="radio" name="ex" value="json"> Full backup (.json)</label><label><input type="radio" name="ex" value="csv"> Plain text (.csv)</label></div>
    <label class="sx-chk"><input type="checkbox" id="exSched" checked> include scheduling and review history</label>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="exOk">Export</button></div>`, 'narrow');
  document.getElementById('exOk').onclick = async () => {
    const k = document.querySelector('input[name=ex]:checked').value, sched = document.getElementById('exSched').checked, ids = d ? [d.id] : sdDecks().filter(x => !x.name.includes('::')).map(x => x.id);
    const base = (d ? d.name : 'Study Deck').replace(/::/g, ' - ').replace(/[^\w\- ]/g, '');
    try {
      if(k === 'apkg') sdDownload(await sdExportApkg(ids, sched), base + '.apkg');
      else if(k === 'json') sdDownload(new Blob([sdExportJson(d ? ids : null)], {type: 'application/json'}), base + '.json');
      else sdDownload(new Blob([sdExportCsv(ids)], {type: 'text/csv'}), base + '.csv');
      closeModals(); toast('Exported.');
    } catch(e){ toast(e.message, 6000); }
  };
}
/* a full-fidelity JSON back in */
async function sdImportJson(text){
  const o = JSON.parse(text); if(o.studyDeck !== 2) throw new Error('That is not a Study Deck backup.');
  const has = (map, x) => map.has(x.id);
  o.noteTypes.forEach(x => { if(!has(SD.noteTypes, x)){ SD.noteTypes.set(x.id, x); sdTouch('noteTypes', x); } });
  o.presets.forEach(x => { if(!has(SD.presets, x)){ SD.presets.set(x.id, x); sdTouch('presets', x); } });
  o.decks.forEach(x => { if(!has(SD.decks, x) && !sdDeckByName(x.name)){ SD.decks.set(x.id, x); sdTouch('decks', x); } });
  let n = 0; o.notes.forEach(x => { if(!has(SD.notes, x)){ SD.notes.set(x.id, x); sdTouch('notes', x); n++; } });
  o.cards.forEach(x => { if(!has(SD.cards, x)){ if(!SD.decks.has(x.deckId)) x.deckId = sdDeckByName(((o.decks.find(d => d.id === x.deckId) || {}).name) || 'Default') ? sdDeckByName((o.decks.find(d => d.id === x.deckId) || {}).name).id : sdEnsureDeck('Imported').id;
    SD.cards.set(x.id, x); sdIndexCard(x); sdTouch('cards', x); } });
  const have = new Set(SD.revlog.map(r => r.id)); await sdRevlogBulk(o.revlog.filter(r => !have.has(r.id)));
  await sdFlush(); return n;
}

/* ---------- the import page ---------- */
function sdImportRoute(root){
  root.innerHTML = `<div class="page sx-page">${sdNav('import')}
    <h1 class="serif">Import</h1>
    <section class="sx-drop" id="imDrop" tabindex="0"><p><b>Drop an Anki deck here</b> — .apkg or .colpkg, from any Anki version — or a .csv / .txt / .json.</p>
      <input type="file" id="imFile" accept=".apkg,.colpkg,.csv,.tsv,.txt,.json"><div class="faint">Everything is read on this device. Nothing is uploaded.</div></section>
    <section class="sx-card2" id="imOpts" hidden>
      <label class="sx-chk"><input type="checkbox" id="imSched" checked> include scheduling and review history (off: import as new cards)</label>
      <label class="sx-opt"><span>Note types</span><select class="sel" id="imNt"><option value="id">merge with the same note type when it has the same fields</option><option value="copy">always make copies</option></select></label>
      <label class="sx-opt"><span>Notes already here (same GUID)</span><select class="sel" id="imUpd"><option value="newer">keep whichever was changed more recently</option><option value="mine">keep mine</option><option value="theirs">take theirs</option><option value="ask">ask me about each</option></select></label>
      <label class="sx-opt"><span>Put its decks inside</span><input class="inp" id="imPrefix" placeholder="(top level)"></label>
      <button class="btn primary" id="imGo">Import</button>
    </section>
    <div class="sx-import-prog" id="imProg" hidden><span id="imStage"></span><i id="imBar"></i></div>
    <div id="imOut"></div>
    <section class="sx-card2"><h3>History</h3>${(sdMisc('imports', () => ({list: []})).list || []).slice(-8).reverse().map(x => `<div class="faint">${new Date(x.date).toLocaleString()} · ${esc(x.file)} · ${x.format || ''} · ${x.notesAdded} notes added, ${x.notesUpdated} updated, ${x.cards} cards, ${x.media} media</div>`).join('') || '<p class="faint">Nothing imported yet.</p>'}</section>
  </div>`;
  const inp = root.querySelector('#imFile'), drop = root.querySelector('#imDrop');
  let file = null;
  const pick = f => { file = f; if(!f) return; if(/\.(apkg|colpkg)$/i.test(f.name)){ root.querySelector('#imOpts').hidden = false; drop.querySelector('p').innerHTML = `<b>${esc(f.name)}</b> · ${(f.size / 1048576).toFixed(1)} MB`; }
    else if(/\.json$/i.test(f.name)) f.text().then(async t => { try { const n = await sdImportJson(t); toast(`${n} notes restored.`); sdSummarise(); } catch(e){ toast(e.message, 6000); } });
    else f.text().then(t => sdCsvDialog(t, f.name)); };
  inp.onchange = () => pick(inp.files[0]);
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); pick(e.dataTransfer.files[0]); };
  root.querySelector('#imGo').onclick = async () => {
    if(!file) return;
    const prog = root.querySelector('#imProg'); prog.hidden = false;
    const stage = root.querySelector('#imStage'), bar = root.querySelector('#imBar');
    try {
      const sum = await sdImportAnki(file, {withSchedule: root.querySelector('#imSched').checked, noteTypeMerge: root.querySelector('#imNt').value,
        onUpdate: root.querySelector('#imUpd').value, deckPrefix: root.querySelector('#imPrefix').value.trim()}, (t, f) => { stage.textContent = t; bar.style.width = Math.round(f * 100) + '%'; });
      root.querySelector('#imOut').innerHTML = `<section class="sx-card2 sx-summary"><h3 class="serif">Imported</h3>
        <div class="sx-sumgrid"><div><b>${sum.notesAdded}</b>notes added</div><div><b>${sum.notesUpdated}</b>updated</div><div><b>${sum.notesSkipped}</b>unchanged</div><div><b>${sum.cards}</b>cards</div><div><b>${sum.media}</b>media files</div><div><b>${sum.revlog}</b>reviews</div></div>
        <p class="faint">${esc(sum.format === 'latest' ? 'Latest Anki format' : sum.format === 'legacy2' ? 'Anki 2.1 (legacy 2)' : 'Anki 2.0 (legacy 1)')}</p>
        ${sum.warnings.length ? `<ul class="faint">${sum.warnings.slice(0, 10).map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
        ${sum.conflicts.length ? `<p>${sum.conflicts.length} notes differ from yours. <button class="btn sm" id="imConf">Go through them</button></p>` : ''}
        <a class="btn primary" href="#/study">To the decks</a></section>`;
      const cb = root.querySelector('#imConf'); if(cb) cb.onclick = () => sdConflicts(sum.conflicts);
    } catch(e){ stage.textContent = e.message; stage.classList.add('li-err'); console.warn(e); }
  };
}
function sdConflicts(list){
  let i = 0;
  const show = () => {
    if(i >= list.length){ closeModals(); toast('Done.'); return; }
    const c = list[i], n = SD.notes.get(c.noteId); if(!n){ i++; show(); return; }
    const nt = SD.noteTypes.get(n.noteTypeId);
    openModal(`<h2 class="serif">${i + 1} of ${list.length}</h2><table class="sx-rtable"><tr><th></th><th>Yours</th><th>Theirs</th></tr>
      ${nt.fields.map((f, k) => `<tr><td>${esc(f.name)}</td><td>${sdSanitize(n.fields[k] || '')}</td><td>${sdSanitize(c.theirs[k] || '')}</td></tr>`).join('')}</table>
      <div class="row" style="gap:8px;justify-content:flex-end"><button class="btn" id="cfMine">Keep mine</button><button class="btn primary" id="cfTheirs">Take theirs</button></div>`, 'wide');
    document.getElementById('cfMine').onclick = () => { i++; show(); };
    document.getElementById('cfTheirs').onclick = () => { n.fields = c.theirs.slice(); n.tags = c.theirTags.slice(); sdSaveNote(n); i++; show(); };
  };
  show();
}
function sdCsvDialog(text, name){
  const {rows, headers} = sdParseDelimited(text);
  if(!rows.length){ toast('Nothing in that file.'); return; }
  const cols = Math.max(...rows.map(r => r.length));
  const nts = [...SD.noteTypes.values()];
  let nt = nts.find(t => t.name === headers.notetype) || sdNoteTypeByName('Basic');
  const draw = () => openModal(`<h2 class="serif">Import ${esc(name)}</h2><p class="faint">${rows.length} rows, ${cols} columns.</p>
    <div class="sx-row"><label>Note type <select class="sel" id="csvNt">${nts.map(t => `<option value="${t.id}"${t.id === nt.id ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
      <label>Deck <select class="sel" id="csvDeck">${sdDecks().filter(d => !d.isFiltered).map(d => `<option value="${d.id}"${d.name === headers.deck ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label></div>
    <table class="sx-rtable"><tr>${Array.from({length: cols}, (_, i) => `<th><select class="sel sm" data-csvmap="${i}"><option value="">(skip)</option>${nt.fields.map((f, k) => `<option value="f:${k}"${k === i ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}
      <option value="tags"${headers['tags column'] == i + 1 ? ' selected' : ''}>Tags</option><option value="deck"${headers['deck column'] == i + 1 ? ' selected' : ''}>Deck</option></select></th>`).join('')}</tr>
      ${rows.slice(0, 5).map(r => `<tr>${Array.from({length: cols}, (_, i) => `<td>${esc((r[i] || '').slice(0, 60))}</td>`).join('')}</tr>`).join('')}</table>
    <label class="sx-chk"><input type="checkbox" id="csvHtml"${headers.html === 'true' ? ' checked' : ''}> the fields are HTML</label>
    <label class="sx-chk"><input type="checkbox" id="csvSkip" checked> skip rows whose first field is already a note</label>
    <label class="sx-opt"><span>Tags for every note</span><input class="inp" id="csvTags"></label>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" onclick="closeModals()">Cancel</button><button class="btn primary" id="csvGo">Import</button></div>`, 'wide');
  draw();
  const bind = () => {
    document.getElementById('csvNt').onchange = e => { nt = SD.noteTypes.get(+e.target.value); closeModals(); draw(); bind(); };
    document.getElementById('csvGo').onclick = () => {
      const map = {}; document.querySelectorAll('[data-csvmap]').forEach(s => map[+s.dataset.csvmap] = s.value);
      const r = sdImportCsv(rows, map, {noteTypeId: nt.id, deckId: +document.getElementById('csvDeck').value, html: document.getElementById('csvHtml').checked,
        dupes: document.getElementById('csvSkip').checked ? 'skip' : 'keep', tags: document.getElementById('csvTags').value.split(/\s+/).map(sdNormTag).filter(Boolean)});
      closeModals(); toast(`${r.added} notes added${r.dupes ? `, ${r.dupes} duplicates skipped` : ''}.`);
    };
  };
  bind();
}
