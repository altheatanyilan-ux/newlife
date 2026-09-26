/* ============================================================
   HEARING THE PIANO — ear and reading (Jazz Studio › Ear and reading).

   Three drills that need the house to hear you:

   THE AURAL TEST (audition preparation). A short phrase is played twice;
   then it listens while you play it back, and shows what you got right —
   aligned note by note (19-listen-a-dsp.js, ldAlign), so one wrong note
   does not make the rest look wrong. The phrases grow with your stage:
   three or four notes by step in one key at first, then longer, with
   leaps, then chromatic neighbours and eighth notes.

   SIGHT-READING. A short melody you have not seen — over changes, as a
   lead sheet, from the middle stages — is shown for a set time; then a bar
   of clicks, and it listens while you play it, and scores the notes and the
   time.

   PLAY WHAT YOU SING. Sing a phrase; the house hears your voice (a YIN
   pitch detector, below — the singing voice, one note at a time); then
   play it on the piano; the two lines are compared, by note name, because
   the voice and the hands rarely sit in the same octave.

   Nothing is recorded except while you sing, and that is analysed and
   dropped at once.
   ============================================================ */

function drState(){
  const j = jazzState();
  const e = j.ear = j.ear && typeof j.ear === 'object' ? j.ear : {};
  e.tab = ['aural', 'sight', 'sing'].includes(e.tab) ? e.tab : 'aural';
  e.aural = Array.isArray(e.aural) ? e.aural : []; e.sight = Array.isArray(e.sight) ? e.sight : []; e.sing = Array.isArray(e.sing) ? e.sing : [];
  e.settings = Object.assign({sightSeconds: 20, sightBpm: 72}, e.settings || {});
  return e;
}
const _dr = {phase: 'idle', phrase: null, heard: [], unsub: null, timer: null, sung: null};
function drStageN(){ try { const s = jazzNowStage(); return s ? (String(s.id) === 'P0' ? 0 : +s.id || 0) : 0; } catch(e){ return 0; } }
function drRng(seed){ let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

/* ---------- a phrase for the stage ---------- */
function drPhrase(stage, seed){
  const r = drRng(seed || Date.now());
  const n = Math.min(9, 3 + Math.floor(stage / 2) + (r() < 0.5 ? 0 : 1));
  const tonic = stage <= 1 ? 0 : Math.floor(r() * 12);
  const scale = stage >= 5 && r() < 0.4 ? [0, 2, 3, 5, 7, 9, 10] : [0, 2, 4, 5, 7, 9, 11];
  const base = 60 + ((tonic + 6) % 12) - 6;
  let deg = 0;
  const notes = [base];
  for(let i = 1; i < n; i++){
    const leap = stage >= 3 && r() < 0.3 ? (r() < 0.5 ? 2 : 3) : 1;
    const dir = r() < 0.5 ? -1 : 1;
    deg = Math.max(-3, Math.min(9, deg + dir * leap));
    const oct = Math.floor(deg / 7), d = ((deg % 7) + 7) % 7;
    let p = base + 12 * oct + scale[d];
    if(stage >= 6 && r() < 0.15) p += r() < 0.5 ? 1 : -1;   /* a chromatic neighbour */
    notes.push(p);
  }
  /* rhythm: quarters, then some eighths */
  const durs = notes.map((_, i) => stage >= 4 && i < n - 1 && r() < 0.35 ? 0.5 : 1);
  durs[n - 1] = 2;
  return {notes, durs, tonic, bpm: 84 + stage * 3};
}
/* the phrase, on the grand (or a plain tone if the grand has not loaded) */
function drPlay(ph, times, gapBeats){
  const ctx = typeof jazzAudioCtx === 'function' ? jazzAudioCtx() : null; if(!ctx) return 0;
  try { ctx.resume && ctx.resume(); } catch(e){}
  const beat = 60 / ph.bpm, len = ph.durs.reduce((s, d) => s + d, 0);
  let t = ctx.currentTime + 0.15;
  for(let k = 0; k < times; k++){
    let at = t;
    ph.notes.forEach((m, i) => { const d = ph.durs[i] * beat;
      if(!(typeof grandPianoNote === 'function' && grandPianoNote(ctx, ctx.destination, m, at, d * 0.95, 0.65))){
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
        g.gain.setValueAtTime(0.18, at); g.gain.exponentialRampToValueAtTime(0.001, at + d * 0.95); o.connect(g); g.connect(ctx.destination); o.start(at); o.stop(at + d); }
      at += d; });
    t = at + (gapBeats || 2) * beat;
  }
  return (t - ctx.currentTime) * 1000;
}
/* ---------- YIN: the pitch of one voice ---------- */
function drYin(x, sr, from, N, thr){
  const W = N >> 1, d = new Float32Array(W);
  for(let tau = 1; tau < W; tau++){ let s = 0; for(let i = 0; i < W; i++){ const v = x[from + i] - x[from + i + tau]; s += v * v; } d[tau] = s; }
  let run = 0; d[0] = 1;
  for(let tau = 1; tau < W; tau++){ run += d[tau]; d[tau] = run ? d[tau] * tau / run : 1; }
  const minTau = Math.floor(sr / 1100), maxTau = Math.min(W - 1, Math.floor(sr / 70));
  for(let tau = minTau; tau < maxTau; tau++){
    if(d[tau] < (thr || 0.15)){
      while(tau + 1 < maxTau && d[tau + 1] < d[tau]) tau++;
      const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a + c - 2 * b;
      const t = den ? tau + (a - c) / (2 * den) : tau;
      return {hz: sr / t, clarity: 1 - b};
    }
  }
  return null;
}
/* sung notes: a pitch that holds within half a semitone for a tenth of a second or more */
function drSungNotes(pcm, sr){
  const N = 2048, hop = 256, out = [], frames = [];
  let e0 = 0; for(let i = 0; i < pcm.length; i += 8) e0 += pcm[i] * pcm[i]; const rmsAll = Math.sqrt(e0 / (pcm.length / 8));
  for(let f = 0; f + N < pcm.length; f += hop){
    let e = 0; for(let i = f; i < f + N; i += 4) e += pcm[i] * pcm[i];
    const rms = Math.sqrt(e / (N / 4));
    if(rms < Math.max(0.004, rmsAll * 0.35)){ frames.push(null); continue; }
    const p = drYin(pcm, sr, f, N, 0.15);
    frames.push(p && p.hz > 70 && p.hz < 1100 ? 69 + 12 * Math.log2(p.hz / 440) : null);
  }
  /* a median of five, then runs */
  const med = frames.map((_, i) => { const w = frames.slice(Math.max(0, i - 2), i + 3).filter(v => v != null); if(w.length < 3) return null; w.sort((a, b) => a - b); return w[w.length >> 1]; });
  let cur = null;
  const minF = Math.ceil(0.1 * sr / hop);
  med.forEach((m, i) => {
    if(m != null && cur && Math.abs(m - cur.mean) <= 0.5){ cur.vals.push(m); cur.mean = cur.vals.reduce((s, v) => s + v, 0) / cur.vals.length; return; }
    if(cur && cur.vals.length >= minF) out.push({pitch: Math.round(cur.mean), t: +(cur.i * hop / sr).toFixed(2), dur: +(cur.vals.length * hop / sr).toFixed(2), cents: Math.round((cur.mean - Math.round(cur.mean)) * 100)});
    cur = m != null ? {i, vals: [m], mean: m} : null;
  });
  if(cur && cur.vals.length >= minF) out.push({pitch: Math.round(cur.mean), t: +(cur.i * hop / sr).toFixed(2), dur: +(cur.vals.length * hop / sr).toFixed(2), cents: Math.round((cur.mean - Math.round(cur.mean)) * 100)});
  /* the same note sung twice in a row with no gap is one note held */
  return out.filter((n, i) => !(i > 0 && out[i - 1].pitch === n.pitch && n.t - (out[i - 1].t + out[i - 1].dur) < 0.03));
}

/* ---------- the page ---------- */
function jazzEarHTML(){
  const e = drState(), act = listenActive();
  const tabs = [['aural', 'Aural test'], ['sight', 'Sight-reading'], ['sing', 'Play what you sing']];
  return `<div class="dr-page">
    <div class="jz-crumbs"><a href="#/jazz">Jazz Studio</a> <span>›</span> <span>Ear and reading</span></div>
    <h1 class="serif">Ear and reading</h1>
    <p class="li-lede">Three drills that listen to you play. Stage ${drStageN()} sets how hard they are.
      ${act ? `<span class="faint"><span class="li-dot"></span> ${act === 'midi' ? 'Reading the MIDI keyboard.' : 'Listening through the microphone.'}</span>` : ''}</p>
    <div class="jz-view-tabs" role="tablist">${tabs.map(([k, n]) => `<button class="jz-view-tab${e.tab === k ? ' on' : ''}" data-drtab="${k}" role="tab" aria-selected="${e.tab === k}">${n}</button>`).join('')}</div>
    <section class="li-card dr-card" id="drBody">${({aural: drAuralHTML, sight: drSightHTML, sing: drSingHTML})[e.tab]()}</section>
    ${drHistoryHTML(e)}
  </div>`;
}
function drHistoryHTML(e){
  const rows = e[e.tab].slice(0, 8);
  if(!rows.length) return '';
  return `<section class="li-card"><h2 class="serif">Lately</h2><div class="dr-hist">${rows.map(r => `<div class="dr-hrow"><span class="mono faint">${esc((r.at || '').slice(5, 16).replace('T', ' '))}</span>
    <span>${r.n} notes</span><b>${r.accuracy}%</b>${r.timing != null ? `<span class="faint">timing ${r.timing}</span>` : ''}<span class="faint">stage ${r.stage}</span></div>`).join('')}</div></section>`;
}
function drAuralHTML(){
  const ph = _dr.phrase && _dr.phrase.kind === 'aural' ? _dr.phrase : null;
  return `<p>A phrase is played twice. Then play it back — from the same note, in the same octave if you can.</p>
    <div class="li-row"><button class="btn primary" id="drGo">${_dr.phase === 'idle' || !ph ? 'Play me a phrase' : _dr.phase === 'listen' ? 'I’m done' : 'Playing…'}</button>
      ${ph ? '<button class="btn ghost" id="drAgain">Hear it again</button>' : ''}
      <span class="dr-say" id="drSay">${_dr.phase === 'listen' ? `<span class="li-dot"></span> Your turn — ${ph.notes.length} notes.` : ''}</span></div>
    <div id="drOut">${_dr.result && _dr.result.kind === 'aural' ? drResultHTML(_dr.result) : ''}</div>`;
}
function drSightHTML(){
  const e = drState();
  return `<p>A short melody you have not seen. You have ${e.settings.sightSeconds} seconds to read it; then a bar of clicks at ♩ = ${e.settings.sightBpm}, and it listens while you play.</p>
    <div class="li-row"><button class="btn primary" id="drGo">${_dr.phase === 'idle' ? 'Show me one' : _dr.phase === 'read' ? 'Start now' : _dr.phase === 'listen' ? 'Stop' : '…'}</button>
      <label>reading time <select class="sel sm" id="drSecs">${[10, 20, 30, 60].map(v => `<option value="${v}"${v === e.settings.sightSeconds ? ' selected' : ''}>${v} s</option>`).join('')}</select></label>
      <label>♩ = <input class="inp sm mono" id="drBpm" type="number" min="40" max="160" value="${e.settings.sightBpm}"></label>
      <span class="dr-say" id="drSay"></span></div>
    <div class="jz-stage-box"><div class="jz-score dr-score" id="drScore"></div></div>
    <div id="drOut">${_dr.result && _dr.result.kind === 'sight' ? drResultHTML(_dr.result) : ''}</div>`;
}
function drSingHTML(){
  return `<p>Sing a phrase — a few notes, on "la" or "doo". Then play the same on the piano. The house compares the two by note name.</p>
    <div class="li-row">
      <button class="btn primary" id="drSing">${_dr.phase === 'sing' ? '■ Done singing' : '● Sing'}</button>
      <button class="btn" id="drPlayIt"${_dr.sung && _dr.sung.length ? '' : ' disabled'}>${_dr.phase === 'play' ? '■ Done playing' : 'Now play it'}</button>
      <span class="dr-say" id="drSay"></span></div>
    <div class="dr-lines">${_dr.sung ? `<div><span class="sc">You sang</span> ${_dr.sung.length ? _dr.sung.map(n => `<span class="li-note" title="${n.cents > 0 ? '+' : ''}${n.cents} cents">${listenNoteName(n.pitch)}</span>`).join('') : '<span class="faint">no clear notes — sing a little louder, one note at a time</span>'}</div>` : ''}</div>
    <div id="drOut">${_dr.result && _dr.result.kind === 'sing' ? drResultHTML(_dr.result) : ''}</div>`;
}
function drResultHTML(r){
  return `<div class="dr-result">
    <div class="lf-big"><b>${r.accuracy}%</b><span>${r.kind === 'sing' ? 'the same notes' : 'right'}</span></div>
    ${r.timing != null ? `<div class="lf-big"><b>${r.timing}</b><span>timing</span></div>` : ''}
    <div class="dr-rows">${r.rows.map(x => `<span class="dr-n ${x.ok ? 'ok' : x.played == null ? 'miss' : 'bad'}" title="${x.ok ? 'right' : x.played == null ? 'missed' : 'played ' + listenNoteName(x.played)}">${listenNoteName(x.expected)}${!x.ok && x.played != null ? `<small>${listenNoteName(x.played)}</small>` : ''}</span>`).join('')}
      ${r.extra && r.extra.length ? `<span class="faint">and ${r.extra.length} extra</span>` : ''}</div>
    ${r.say ? `<p class="faint">${esc(r.say)}</p>` : ''}</div>`;
}
function bindJazzEar(root){
  const e = drState();
  $$('[data-drtab]', root).forEach(b => b.onclick = () => { drReset(); e.tab = b.dataset.drtab; saveNow(); rerender(); });
  const go = root.querySelector('#drGo');
  if(e.tab === 'aural'){
    if(go) go.onclick = () => _dr.phase === 'listen' ? drFinish(root) : drAural(root);
    const ag = root.querySelector('#drAgain'); if(ag) ag.onclick = () => { if(_dr.phrase) drPlay(_dr.phrase, 1); };
  }
  if(e.tab === 'sight'){
    root.querySelector('#drSecs').onchange = ev => { e.settings.sightSeconds = +ev.target.value; saveNow(); };
    root.querySelector('#drBpm').onchange = ev => { e.settings.sightBpm = Math.max(40, Math.min(160, +ev.target.value || 72)); saveNow(); };
    if(go) go.onclick = () => _dr.phase === 'idle' ? drSight(root) : _dr.phase === 'read' ? drSightPlay(root) : _dr.phase === 'listen' ? drFinish(root) : null;
    if(_dr.phrase && _dr.phrase.kind === 'sight') jazzEngrave(root.querySelector('#drScore'), _dr.phrase.xml);
  }
  if(e.tab === 'sing'){
    root.querySelector('#drSing').onclick = () => drSing(root);
    root.querySelector('#drPlayIt').onclick = () => _dr.phase === 'play' ? drFinish(root) : drSingPlay(root);
  }
  addEventListener('hashchange', drReset, {once: true});
}
function drReset(){
  if(_dr.unsub){ _dr.unsub(); _dr.unsub = null; }
  clearTimeout(_dr.timer); clearInterval(_dr.tick);
  if(_dr.mic){ const m = _dr.mic; _dr.mic = null; m.stop(); }
  _dr.phase = 'idle'; _dr.heard = [];
}
async function drEnsureListening(){
  if(listenActive()) return true;
  try { await listenStart(); return true; } catch(e){ toast(e.message || 'Could not start listening.'); return false; }
}
function drSay(root, html){ const el = root.querySelector('#drSay'); if(el) el.innerHTML = html; }
/* ---------- the aural test ---------- */
async function drAural(root){
  if(!await drEnsureListening()) return;
  drReset();
  const ph = _dr.phrase = Object.assign(drPhrase(drStageN()), {kind: 'aural'});
  _dr.result = null; _dr.phase = 'play'; rerender();
  const ms = drPlay(ph, 2, 2);
  _dr.timer = setTimeout(() => {
    _dr.phase = 'listen'; _dr.heard = []; _dr.listenFrom = listenNow();
    _dr.unsub = listenOn(ev => { if(ev.onset < _dr.listenFrom) return; _dr.heard.push(ev);
      clearTimeout(_dr.timer);
      /* done when the phrase's worth has been played and a moment has passed */
      _dr.timer = setTimeout(() => drFinish(root), _dr.heard.length >= ph.notes.length ? 1400 : 4000); });
    rerender();
    _dr.timer = setTimeout(() => drFinish(root), 12000);
  }, ms + 200);
}
/* ---------- sight-reading ---------- */
function drSightXml(stage, seed){
  const r = drRng(seed || Date.now());
  const key = stage <= 1 ? {fifths: 0, mode: 'major', tonic: 0} : [{fifths: 0, tonic: 0}, {fifths: -1, tonic: 5}, {fifths: 1, tonic: 7}, {fifths: -2, tonic: 10}, {fifths: 2, tonic: 2}, {fifths: -3, tonic: 3}][Math.floor(r() * (stage >= 4 ? 6 : 3))];
  key.mode = 'major';
  const scale = [0, 2, 4, 5, 7, 9, 11];
  const base = 60 + ((key.tonic + 5) % 12) - 5;
  const notes = []; let t = 0, deg = 0;
  const pat = stage >= 4 ? [[12], [6, 6], [12], [18, 6], [24]] : stage >= 2 ? [[12], [12], [6, 6], [24]] : [[12], [24]];
  while(t < 4 * 48 - 12){
    const p = pat[Math.floor(r() * pat.length)].filter(() => true);
    for(const d0 of p){
      let d = Math.min(d0, 4 * 48 - t); if(d <= 0) break;
      if((t % 48) + d > 48) d = 48 - (t % 48);
      deg = Math.max(-2, Math.min(8, deg + (r() < 0.5 ? -1 : 1) * (stage >= 3 && r() < 0.3 ? 2 : 1)));
      const oct = Math.floor(deg / 7), dd = ((deg % 7) + 7) % 7;
      notes.push({id: 's' + notes.length, pitch: base + 12 * oct + scale[dd], start: t, dur: d, staff: 1, voice: 1, vel: 0.7});
      t += d;
    }
  }
  const last = notes[notes.length - 1]; last.dur = 4 * 48 - last.start; last.pitch = base;
  /* from stage 3, the changes over it: I vi ii V, or ii V I I */
  const chords = [];
  if(stage >= 3){
    const prog = r() < 0.5 ? [[0, 'maj7'], [9, 'm7'], [2, 'm7'], [7, '7']] : [[2, 'm7'], [7, '7'], [0, 'maj7'], [0, 'maj7']];
    prog.forEach(([iv, name], i) => { const root = (key.tonic + iv) % 12; const sh = CP_SHAPES.find(x => x[0] === name);
      chords.push({start: i * 48, dur: 48, root, name, kind: sh[3], tones: sh[1], bass: null, unsure: false}); });
    const center = key.fifths + 2;
    chords.forEach(c => { c.rootF = cpSpellNear(c.root, center); const nm = cpFifthsName(c.rootF); c.rootStep = nm.step; c.rootAlter = nm.alter; });
  }
  const kobj = {fifths: key.fifths, mode: 'major', tonic: key.tonic, name: ''};
  cpSpellAll(notes, kobj, chords);
  const model = {bpm: drState().settings.sightBpm, ts: [4, 4], compound: false, beatDiv: 12, barDiv: 48, perBar: 4, measures: 4, key: kobj, swing: {on: false}, notes, chords, pedal: [], mode: 'lead', title: 'Sight-reading'};
  return {xml: cpToMusicXML(model, {title: 'Sight-reading', chords: chords.length > 0}), model};
}
function drSight(root){
  drReset();
  const e = drState();
  const s = drSightXml(drStageN());
  _dr.phrase = {kind: 'sight', xml: s.xml, model: s.model, notes: s.model.notes.map(n => n.pitch)};
  _dr.result = null; _dr.phase = 'read'; rerender();
  let left = e.settings.sightSeconds;
  drSay(document, `${left} s to read it`);
  _dr.tick = setInterval(() => { left--; drSay(document, `${left} s to read it`); if(left <= 0){ clearInterval(_dr.tick); drSightPlay(document); } }, 1000);
}
async function drSightPlay(root){
  clearInterval(_dr.tick);
  if(!await drEnsureListening()) return;
  const e = drState(), ph = _dr.phrase, beat = 60 / e.settings.sightBpm;
  _dr.phase = 'listen';
  const go = document.querySelector('#drGo'); if(go) go.textContent = 'Stop';
  const ctx = typeof jazzAudioCtx === 'function' ? jazzAudioCtx() : null;
  const lead = 0.2;
  _dr.t0 = listenNow() + lead + 4 * beat;   /* bar 1, beat 1 */
  if(ctx){ const c0 = ctx.currentTime + lead; for(let k = 0; k < 4 + 16; k++){ const t = c0 + k * beat, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = k % 4 === 0 ? 1500 : 1000; g.gain.setValueAtTime(k < 4 ? 0.3 : 0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.06); } }
  drSay(document, '<span class="li-dot"></span> One bar of clicks, then play.');
  _dr.heard = [];
  _dr.unsub = listenOn(ev => { if(ev.onset >= _dr.t0 - beat * 0.5) _dr.heard.push(ev); });
  _dr.timer = setTimeout(() => drFinish(document), (lead + 4 * beat + 16 * beat + 1.2) * 1000);
}
/* ---------- play what you sing ---------- */
async function drSing(root){
  if(_dr.phase === 'sing'){
    const m = _dr.mic; _dr.mic = null; _dr.phase = 'idle';
    const got = await m.stop();
    _dr.sung = drSungNotes(got.pcm, got.sr);
    drState(); rerender(); return;
  }
  drReset();
  try { if(listenActive() === 'mic') await listenStop(); _dr.mic = await txMicRecord(); }
  catch(e){ toast(e.message || 'The microphone could not be opened.'); return; }
  _dr.phase = 'sing'; _dr.sung = null; _dr.result = null; rerender();
}
async function drSingPlay(root){
  if(!_dr.sung || !_dr.sung.length) return;
  if(!await drEnsureListening()) return;
  _dr.phase = 'play'; _dr.heard = []; _dr.result = null;
  _dr.unsub = listenOn(ev => _dr.heard.push(ev));
  rerender();
  drSay(document, '<span class="li-dot"></span> Play what you sang, then press Done.');
}
/* ---------- the verdict, for all three ---------- */
function drFinish(root){
  const e = drState(), ph = _dr.phrase, tab = e.tab;
  if(_dr.unsub){ _dr.unsub(); _dr.unsub = null; }
  clearTimeout(_dr.timer); clearInterval(_dr.tick);
  const played = _dr.heard.slice().sort((a, b) => a.onset - b.onset);
  let res;
  if(tab === 'sing'){
    const al = ldAlign(_dr.sung.map(n => n.pitch), played.map(x => x.pitch), 'pitch-class');
    res = {kind: 'sing', accuracy: Math.round(al.accuracy * 100), rows: al.rows, extra: al.extra, n: _dr.sung.length,
      say: al.accuracy === 1 ? 'The same notes, by name.' : 'Where the lines differ, the sung note is shown with what was played under it.'};
  } else if(tab === 'aural'){
    const exact = ldAlign(ph.notes, played.map(x => x.pitch), 'exact'), pc = ldAlign(ph.notes, played.map(x => x.pitch), 'pitch-class');
    const use = pc.accuracy > exact.accuracy ? pc : exact;
    res = {kind: 'aural', accuracy: Math.round(use.accuracy * 100), rows: use.rows, extra: use.extra, n: ph.notes.length,
      say: use === pc && pc.accuracy > exact.accuracy ? 'Judged by note name: some of it was in another octave.' : ''};
    /* the rhythm, as proportions: how the gaps between your notes compare with the phrase's */
    const got = use.rows.filter(r => r.ok && r.at != null);
    if(got.length >= 3){
      const beat = 60 / ph.bpm, want = [], had = [];
      for(let i = 1; i < got.length; i++){ const a = ph.notes.indexOf(got[i - 1].expected), b = ph.notes.indexOf(got[i].expected);
        if(a < 0 || b <= a) continue; want.push(ph.durs.slice(a, b).reduce((s, d) => s + d, 0) * beat); had.push(played[got[i].at].onset - played[got[i - 1].at].onset); }
      if(want.length >= 2){ const k = had.reduce((s, x) => s + x, 0) / want.reduce((s, x) => s + x, 0);
        const err = want.map((w, i) => Math.abs(had[i] / k - w) / w); const m = err.reduce((s, x) => s + x, 0) / err.length;
        res.timing = Math.max(0, Math.round(100 * (1 - m / 0.5))); res.say = (res.say ? res.say + ' ' : '') + `Rhythm ${res.timing >= 80 ? 'close to the phrase' : 'freer than the phrase'} (at ${Math.round(ph.bpm * k ** -1)} to the beat).`; }
    }
  } else {
    const beat = 60 / e.settings.sightBpm, want = ph.model.notes;
    const al = ldAlign(want.map(n => n.pitch), played.map(x => x.pitch), 'exact');
    const offs = al.rows.filter(r => r.ok && r.at != null).map(r => { const i = al.rows.indexOf(r); return Math.round((played[r.at].onset - (_dr.t0 + want[i].start / 12 * beat)) * 1000); });
    res = {kind: 'sight', accuracy: Math.round(al.accuracy * 100), rows: al.rows, extra: al.extra, n: want.length, timing: lfTimingScore(offs, 150),
      say: offs.length ? `On average ${Math.abs(Math.round(lfMean(offs)))} ms ${lfMean(offs) < 0 ? 'early' : 'late'}.` : ''};
  }
  e[tab].unshift({at: new Date().toISOString(), accuracy: res.accuracy, timing: res.timing != null ? res.timing : null, n: res.n, stage: drStageN()});
  e[tab] = e[tab].slice(0, 200);
  saveNow();
  _dr.result = res; _dr.phase = 'idle';
  if(typeof sound === 'function') sound(res.accuracy >= 90 ? 'success' : 'click');
  rerender();
}
