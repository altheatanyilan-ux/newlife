/* ============================================================
   SONGWRITING STUDIO — WHAT IS KEPT

   One object, S.songwriting, saved as a row of the meta store like the
   other studios (06-db.js META_KEYS). It carries a version number, and
   sngMigrate brings any older shape up to the current one without
   dropping a field it does not know: a migration here only ever adds.

   v1: {v, profile {lowNote, highNote, dailyTime, onboarded}, owDates[],
        outputs {exId: {text {field: value}, savedAt, versions [{text,
        savedAt}], selfCheck, reflection, done}}, seeds[], songs[],
        grooves[], melodies[], presets[], listening[], sessions[],
        badges[], lab {last Chord Lab settings}, capstone {step: done}}

   Voice memos are Blobs, kept in their own store (sngAudio) and never in
   this object: a Blob through JSON is an empty object, and a backup is
   text. Like the other recordings in the house, they stay on this device.
   ============================================================ */
const SNG_VERSION = 1;
function sngDefaults(){
  return {v: SNG_VERSION, profile: {lowNote: 'C3', highNote: 'C5', dailyTime: 'morning', onboarded: false},
    owDates: [], outputs: {}, seeds: [], songs: [], grooves: [], melodies: [], presets: [], listening: [], sessions: [], badges: [],
    lab: {}, capstone: {}};
}
function sngMigrate(st){
  const d = sngDefaults();
  if(!st || typeof st !== 'object') return d;
  /* the prototype's localStorage shape (sng_v1) kept the 42-day ring on the
     profile; it moves out beside the rest, nothing else changes */
  if(st.profile && Array.isArray(st.profile.owDates) && !Array.isArray(st.owDates)) st.owDates = st.profile.owDates.slice();
  Object.keys(d).forEach(k => { if(st[k] === undefined) st[k] = d[k]; });
  st.profile = Object.assign({}, d.profile, st.profile || {});
  ['owDates', 'seeds', 'songs', 'grooves', 'melodies', 'presets', 'listening', 'sessions', 'badges'].forEach(k => { if(!Array.isArray(st[k])) st[k] = []; });
  if(!st.outputs || typeof st.outputs !== 'object') st.outputs = {};
  Object.values(st.outputs).forEach(o => { if(o && !Array.isArray(o.versions)) o.versions = []; if(o && (!o.text || typeof o.text !== 'object')) o.text = {}; });
  st.songs.forEach(sngSongDefaults);
  st.v = Math.max(+st.v || 0, SNG_VERSION);
  return st;
}
function sngState(){
  if(!S.songwriting || S.songwriting.v !== SNG_VERSION || !S.songwriting._ok){
    S.songwriting = sngMigrate(S.songwriting);
    Object.defineProperty(S.songwriting, '_ok', {value: true, enumerable: false, configurable: true});
  }
  return S.songwriting;
}
function sngSongDefaults(s){
  s.id = s.id || uid(); s.title = s.title || 'Untitled'; s.brief = s.brief || '';
  s.status = s.status || 'draft';
  s.sections = Array.isArray(s.sections) ? s.sections : [];
  s.sections.forEach(sec => { sec.id = sec.id || uid(); sec.type = sec.type || 'verse'; sec.lines = Array.isArray(sec.lines) ? sec.lines : [];
    sec.lines.forEach(l => { if(typeof l === 'string') return; l.text = l.text || ''; }); if(!sec.feel) sec.feel = 'stable'; });
  s.plot = s.plot || {type: 1, steps: ['', '', '']};
  s.boxes = Array.isArray(s.boxes) ? s.boxes : ['', '', ''];
  s.rewrite = s.rewrite || {};
  s.pov = s.pov || ''; s.tense = s.tense || '';
  s.createdAt = s.createdAt || new Date().toISOString(); s.updatedAt = s.updatedAt || s.createdAt;
  return s;
}

/* ---------- the parts of it the tools write ---------- */
function sngSaveOutput(exId, text, extra){
  const st = sngState(), cur = st.outputs[exId];
  const versions = cur ? (cur.versions || []).concat(cur.savedAt ? [{text: cur.text, savedAt: cur.savedAt}] : []).slice(-20) : [];
  st.outputs[exId] = Object.assign({}, cur || {}, extra || {}, {exerciseId: exId, text: Object.assign({}, text), savedAt: new Date().toISOString(), versions});
  sngLogSession('exercise', exId);
  sngBadgeCheck(); saveNow();
  return st.outputs[exId];
}
function sngSeed(seed){
  const st = sngState();
  const s = Object.assign({id: uid(), type: 'line', content: '', tags: [], source: '', createdAt: new Date().toISOString()}, seed);
  s.content = String(s.content || '').trim();
  if(!s.content && !s.audioId && !s.data) return null;
  st.seeds.unshift(s); saveNow();
  return s;
}
function sngLogSession(what, ref){
  const st = sngState(), d = today();
  const last = st.sessions[st.sessions.length - 1];
  if(last && last.date === d && last.what === what && last.ref === ref) return;
  st.sessions.push({date: d, what, ref: ref || null, at: new Date().toISOString()});
  if(st.sessions.length > 2000) st.sessions.splice(0, st.sessions.length - 2000);
}
function sngMarkOw(){
  const st = sngState(), d = today();
  if(!st.owDates.includes(d)) st.owDates.push(d);
  sngLogSession('object-writing'); sngBadgeCheck(); saveNow();
}
const sngExercise = id => { for(const s of SNG_STAGES){ const e = s.exercises.find(x => x.id === id); if(e) return Object.assign({stage: s.id}, e); } return null; };
const sngStageDone = st => (id => { const s = SNG_STAGES.find(x => x.id === id); return s ? s.exercises.every(e => st.outputs[e.id]) : false; });
function sngStagePct(id){ const st = sngState(), s = SNG_STAGES.find(x => x.id === id); if(!s) return 0;
  return Math.round(100 * s.exercises.filter(e => st.outputs[e.id]).length / s.exercises.length); }
/* the next exercise not yet done, in path order */
function sngNextExercise(){ const st = sngState(); for(const s of SNG_STAGES) for(const e of s.exercises) if(!st.outputs[e.id]) return Object.assign({stage: s.id}, e); return null; }
function sngBadgeCheck(){
  const st = sngState(), got = new Set(st.badges), done = sngStageDone(st);
  const finished = st.songs.filter(s => s.status === 'finished').length;
  const capstones = st.songs.filter(s => s.capstone && s.status === 'finished').length;
  SNG_BADGES.forEach(b => {
    if(got.has(b.id)) return;
    const c = b.condition; let ok = false;
    if(/^\d+\.\d+$/.test(c)) ok = !!st.outputs[c];
    else if(c === '14-day-ow') ok = st.owDates.length >= 14;
    else if(c === '42-day-ow') ok = st.owDates.length >= 42;
    else if(/^stage-\d+$/.test(c)) ok = done(+c.split('-')[1]);
    else if(/^capstone-\d+$/.test(c)) ok = capstones >= +c.split('-')[1] || (c === 'capstone-3' && finished >= 3);
    if(ok){ st.badges.push(b.id); if(typeof toast === 'function') toast(`${esc(b.icon)} Badge: ${esc(b.name)} — ${esc(b.desc)}`, 5000); }
  });
}

/* ---------- voice memos, on this device ---------- */
async function sngAudioPut(blob){ const id = uid(); try { await db.sngAudio.put({id, blob, at: new Date().toISOString()}); return id; } catch(e){ return null; } }
async function sngAudioGet(id){ try { const r = await db.sngAudio.get(id); return r ? r.blob : null; } catch(e){ return null; } }
async function sngAudioDrop(id){ if(id) try { await db.sngAudio.delete(id); } catch(e){} }
/* recording from the microphone: MediaRecorder where there is one. From
   file:// Chrome allows the microphone after asking; where it is refused
   (or there is no recorder), a file can be chosen instead. */
async function sngRecord(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('This browser cannot record here — choose an audio file instead.');
  const stream = await navigator.mediaDevices.getUserMedia({audio: true});
  const rec = new MediaRecorder(stream), chunks = [];
  rec.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise(res => { rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, {type: rec.mimeType || 'audio/webm'})); }; });
  rec.start();
  return {stop(){ if(rec.state !== 'inactive') rec.stop(); return done; }, get state(){ return rec.state; }};
}
