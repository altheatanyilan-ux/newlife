/* ============================================================
   CURRICULUM v3, SECTION 4A — THE LEAD-SHEET FLASHCARDS.

   The twelve-key cards ask for a pattern in a key. These ask what a lead
   sheet asks, in the three ways the document sets out:

     Mode A  Symbol Recognition — a chord symbol, seconds to play it;
             scored on the notes, a time bonus and a streak multiplier,
             the symbols growing with the stage (Stage 1: basic triads;
             Stage 12: upper structures).
     Mode B  Progression Reading — four or eight bars of a real tune, a
             metronome, and you comp through them in time; graded on the
             chord quality, the time, and how far the hands moved.
     Mode C  Form Identification — a whole lead sheet with its section
             letters taken off; you mark where each section starts, and the
             chart's own labels (or the database's form) say if you were right.

   The notes come from a MIDI keyboard when one is plugged in, from the
   keys on the screen, or from the computer keyboard. On an acoustic piano
   the card asks how it went instead.
   ============================================================ */

/* ---------- the symbols, by stage ---------- */
const JAZZ_LEAD_TIERS = [
  {from: 0, said: 'basic triads', q: ['', 'm', 'dim', 'aug']},
  {from: 2, said: 'seventh chords', q: ['maj7', 'm7', '7', 'm7b5', 'o7']},
  {from: 3, said: 'sixths and ninths', q: ['6', 'm6', '69', '9', 'm9', 'maj9']},
  {from: 4, said: 'altered dominants', q: ['7b9', '7#9', '7alt', '13', '7b13', '7#11']},
  {from: 5, said: 'the colours substitution brings', q: ['7#5', 'maj7#11', 'm(maj7)', '7sus4']},
  {from: 7, said: 'minor-key colours', q: ['m11', 'm69', 'maj7#5', '7b9b13']},
  {from: 8, said: 'slash chords', slash: true},
  {from: 10, said: 'modal colours', q: ['maj13', '13#11', 'm11', '7sus4b9']},
  {from: 12, said: 'upper structures', q: ['13#11', '7#9b13', '7b9#11', '13b9', '7#9#11']}];
const JAZZ_LEAD_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const jzlPick = a => a[Math.floor(Math.random() * a.length)];

/* the main-line stage as a number: 0 for the prelude, 9 for the DT track */
function jzlStageN(id){
  if(id == null){ const now = jazzNowStage(); id = now && now.id; }
  if(id === 'P0') return 0;
  if(/^\d+$/.test(String(id))) return +id;
  if(id === 'DT') return 9;
  const now = jazzNowStage();
  return now && /^\d+$/.test(String(now.id)) ? +now.id : 0;
}
const jazzLeadTiersFor = n => JAZZ_LEAD_TIERS.filter(t => t.from <= n);

/* a note name by letter, so a third is a third: the third of E is G♯, not A♭ */
const JZL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], JZL_LPC = [0, 2, 4, 5, 7, 9, 11];
function jzlSpell(root, semis, steps){
  const li = JZL_LETTERS.indexOf(root[0]);
  const L = JZL_LETTERS[((li + steps) % 7 + 7) % 7];
  const pc = ((JAZZ_TUNE_PC[root] + semis) % 12 + 12) % 12;
  let d = ((pc - JZL_LPC[JZL_LETTERS.indexOf(L)]) % 12 + 12) % 12;
  if(d > 6) d -= 12;
  return L + (d === 1 ? '#' : d === -1 ? 'b' : d === 2 ? '##' : d === -2 ? 'bb' : '');
}
function jzlSlash(){
  const kind = jzlPick(['third', 'fifth', 'below']);
  if(kind === 'below'){
    const bass = jzlPick(['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb']);
    return `${jzlSpell(bass, -2, 6)}/${bass}`;
  }
  const r = jzlPick(['C', 'D', 'Eb', 'E', 'F', 'G', 'Ab', 'A', 'Bb']);
  const minor = kind === 'fifth' && Math.random() < 0.4;
  return `${r}${minor ? 'm' : ''}/${kind === 'third' ? jzlSpell(r, 4, 2) : jzlSpell(r, 7, 4)}`;
}
/**
 * A chord symbol to play, from the pool the stage has reached.
 * Half the time from the newest tier, so a stage's own sound comes up most.
 * first: the opening card of the audiation drill — "start with Cmaj7".
 * opt.floor: the lowest stage the pool is drawn as (the audiation drill
 * starts at seventh chords, so it passes 2).
 */
function jazzLeadSymbol(stageId, first, opt){
  if(first) return 'Cmaj7';
  const n = Math.max(jzlStageN(stageId), (opt && opt.floor) || 0);
  const tiers = jazzLeadTiersFor(n);
  const tier = Math.random() < 0.5 ? tiers[tiers.length - 1] : jzlPick(tiers);
  if(tier.slash) return jzlSlash();
  return jzlPick(JAZZ_LEAD_ROOTS) + jzlPick(tier.q);
}

/* the chord's tones, spelled from its root */
function jazzLeadToneNames(spec){
  if(!spec) return [];
  const steps = t => ({0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4, 8: 4, 10: 6, 11: 6, 13: 1, 14: 1, 15: 1, 17: 3, 18: 3, 20: 5, 21: 5})[t];
  const root = spec.root;
  const names = spec.tones.map(t => {
    const st = t === 9 ? (spec.tones.includes(3) && spec.tones.includes(6) && !spec.tones.includes(7) ? 6 : 5) : steps(t);
    return st == null ? JZ_NOTE_NAMES[(spec.pc + t) % 12] : jzlSpell(root, t % 12, st);
  });
  return names.map(x => x.replace(/##/, '𝄪').replace(/bb$/, '𝄫').replace(/#/, '♯').replace(/(.)b/, '$1♭'));
}

/* a pitch class named as this chord spells it: the third of F♯ is A♯ */
function jzlNamer(spec){
  const names = jazzLeadToneNames(spec), map = {};
  if(spec) spec.tones.forEach((t, i) => { map[(spec.pc + t) % 12] = names[i]; });
  return pc => map[pc] || JZ_NOTE_NAMES[pc];
}

/* ---------- grading one voicing ----------
   The tones that make the chord what it is must be there, and nothing
   that contradicts it may be. The tensions a jazz pianist adds without
   being asked (a ninth on a dominant, a ninth and eleventh on a minor
   seventh) are allowed; on a bare triad nothing extra is. */
function jazzLeadCheck(midis, spec){
  if(!spec) return {ok: false, score: 0, missing: [], wrong: []};
  const have = new Set(midis.map(m => ((m % 12) + 12) % 12));
  const need = spec.required.map(t => (spec.pc + t) % 12);
  const q = spec.sym ? jazzParseChord(spec.sym) : null;
  const quality = q ? q.quality : '';
  const t = spec.tones;
  let allow = [];
  if(t.length > 3 || /6|9|11|13/.test(q ? q.q : '')){
    if(quality === 'maj') allow = [2, 6, 9];
    else if(quality === 'min') allow = [2, 5];
    else if(quality === 'hd') allow = [2, 5, 8];
    else if(quality === 'dim') allow = [2, 5, 8, 11];
    else if(quality === 'sus') allow = [2, 9];
    else if(quality === 'dom') allow = q && q.altered ? (/alt/.test(q.q) ? [1, 3, 6, 8] : [2, 9]) : [2, 9];
  }
  const okPcs = new Set(spec.pcs.concat(allow.map(a => (spec.pc + a) % 12)));
  if(spec.bassPc != null) okPcs.add(spec.bassPc);
  const name = jzlNamer(spec);
  const missing = need.filter(pc => !have.has(pc)).map(name);
  const wrong = [...have].filter(pc => !okPcs.has(pc)).map(pc => JZ_NOTE_NAMES[pc]);
  /* a slash chord is about its bass: the lowest note has to be it */
  let bassOk = true;
  if(spec.bassPc != null && midis.length){ bassOk = (Math.min(...midis) % 12) === spec.bassPc;
    if(!bassOk) missing.push(`${String(spec.sym).split('/')[1].replace(/b/, '♭').replace(/#/, '♯')} in the bass`); }
  const of = need.length + (spec.bassPc != null ? 1 : 0);
  const found = need.length - need.filter(pc => !have.has(pc)).length + (spec.bassPc != null && bassOk ? 1 : 0);
  return {ok: !missing.length && !wrong.length && midis.length > 0, score: of ? found / of : 0, missing, wrong};
}
/* Mode A's points: the notes, a time bonus for a right answer, and the
   streak's multiplier (×1.25 a card in a row, up to ×2) */
function jazzLeadPoints(check, left, limit, streak){
  const notes = Math.round(100 * Math.max(0, check.score - 0.25 * check.wrong.length));
  const bonus = check.ok ? Math.round(50 * Math.max(0, left) / limit) : 0;
  const mult = 1 + 0.25 * Math.min(streak || 0, 4);
  return {notes, bonus, mult, points: Math.round((notes + bonus) * mult)};
}

/* ---------- Mode B's grading ----------
   beats: jazzChartBeats of the excerpt. events: {m, on, t} with t on the
   audio clock, already corrected for the output latency. t0: the audio
   time of the excerpt's first beat. */
function jzlQuality(spec, pcs){
  if(!spec) return {ok: false, missing: [], against: []};
  const has = t => pcs.has((spec.pc + t) % 12);
  const T = spec.tones;
  const third = T.find(t => t === 3 || t === 4);
  const seventh = T.find(t => t === 10 || t === 11) ?? (T.includes(9) && T.includes(6) ? 9 : null);
  const need = [], against = [];
  if(third != null){ need.push(third); if(!T.includes(15) && spec.bassPc == null) against.push(third === 3 ? 4 : 3); }
  else if(T.includes(5)) need.push(5);
  if(seventh != null){ need.push(seventh); against.push(seventh === 11 ? 10 : 11); }
  else if(T.includes(9)) against.push(10);               /* a sixth chord with a flat seventh is a dominant */
  if(T.includes(6) && !T.includes(7) && !T.includes(18)){ need.push(6); against.push(7); }
  const spell = jzlNamer(spec), name = t => spell((spec.pc + t) % 12);
  const missing = need.filter(t => !has(t)).map(name), bad = against.filter(t => has(t)).map(t => JZ_NOTE_NAMES[(spec.pc + t) % 12]);
  return {ok: pcs.size > 0 && !missing.length && !bad.length, missing, against: bad};
}
function jazzLeadGradeB(beats, events, t0, spb){
  const wins = [];
  beats.forEach((b, k) => { const last = wins[wins.length - 1];
    if(!last || b.first || b.sym !== last.sym) wins.push({sym: b.sym, bar: b.bar, from: k, to: k + 1}); else last.to = k + 1; });
  const ons = events.filter(e => e.on).sort((a, b) => a.t - b.t);
  const attacks = [];
  ons.forEach(e => { const a = attacks[attacks.length - 1];
    if(a && e.t - a.t < 0.08) a.notes.push(e.m); else attacks.push({t: e.t, notes: [e.m]}); });
  const end = t0 + beats.length * spb;
  /* a chord's window starts half a beat early, so an anticipation counts for the chord it anticipates */
  const rows = wins.filter(w => w.sym).map(w => {
    const ws = t0 + (w.from - 0.5) * spb, we = t0 + (w.to - 0.5) * spb;
    const inWin = attacks.filter(a => a.t >= ws && a.t < we);
    const pcs = new Set([].concat(...inWin.map(a => a.notes.map(m => m % 12))));
    const q = jzlQuality(jazzChordSpec(w.sym), pcs);
    return {sym: w.sym, bar: w.bar, played: inWin.length > 0, ok: q.ok, missing: q.missing, against: q.against,
      heard: [...pcs].map(pc => JZ_NOTE_NAMES[pc]),
      voicing: inWin.length ? inWin[0].notes.slice().sort((a, b) => a - b) : null};
  });
  const harm = rows.length ? rows.filter(r => r.ok).length / rows.length : 0;
  /* time: each attack against the nearest place a comping chord falls —
     on the beat, or on its "and", straight or swung */
  const inside = attacks.filter(a => a.t >= t0 - 0.5 * spb && a.t < end);
  const grid = [0, 0.5, 0.62, 0.67, 1];
  const devs = inside.map(a => { const x = (a.t - t0) / spb, frac = x - Math.floor(x);
    let best = null; grid.forEach(g => { const d = frac - g; if(best == null || Math.abs(d) < Math.abs(best)) best = d; });
    return best * spb; });
  const meanAbs = devs.length ? sum(devs.map(Math.abs)) / devs.length : null;
  const lean = devs.length ? sum(devs) / devs.length : 0;
  const rhythm = meanAbs == null ? 0 : Math.max(0, Math.min(1, 1 - Math.max(0, meanAbs - 0.02) / (0.2 * spb)));
  /* the voice leading: how far each voice moved from one chord's voicing to the next */
  const vs = rows.map(r => r.voicing).filter(Boolean);
  const moves = [];
  for(let i = 1; i < vs.length; i++){
    const a = vs[i - 1].filter(m => m >= 48), b = vs[i].filter(m => m >= 48);
    const k = Math.min(a.length, b.length); if(!k) continue;
    const A = a.slice(-k), B = b.slice(-k);
    moves.push(sum(A.map((m, j) => Math.abs(m - B[j]))) / k);
  }
  const avgMove = moves.length ? sum(moves) / moves.length : null;
  const vl = avgMove == null ? (vs.length ? 1 : 0) : Math.max(0, Math.min(1, 1 - Math.max(0, avgMove - 2) / 5));
  return {rows, harm, rhythm, vl, attacks: inside.length,
    meanDevMs: meanAbs == null ? null : Math.round(meanAbs * 1000), leanMs: Math.round(lean * 1000),
    avgMove: avgMove == null ? null : Math.round(avgMove * 10) / 10};
}

/* ---------- the tunes each mode draws from ----------
   Stages 0–2 the beginner tunes; 3–4 the intermediate too; from 5, all. */
const jazzLeadLevels = n => n <= 2 ? ['beginner'] : n <= 4 ? ['beginner', 'intermediate'] : ['beginner', 'intermediate', 'advanced'];
function jazzLeadTunePool(n){
  const lv = jazzLeadLevels(n);
  return jazzTuneIndex().rows.filter(r => r.tune && lv.includes(r.tune.difficulty) && !jazzTuneAnalysis(r.tune).chart.prose);
}
/* four or eight bars from a phrase's start, every bar with a chord in it */
function jazzLeadExcerpt(n, bars, avoid){
  const pool = jazzLeadTunePool(n).filter(r => r.id !== avoid);
  const order = pool.slice().sort(() => Math.random() - 0.5);
  for(const r of order){
    const chart = jazzTuneAnalysis(r.tune).chart;
    const starts = [];
    for(let i = 0; i + bars <= chart.bars.length; i += 4)
      if(chart.bars.slice(i, i + bars).every(b => b.chords.length)) starts.push(i);
    if(!starts.length) continue;
    const i = jzlPick(starts);
    return {id: r.id, from: chart.bars[i].n, to: chart.bars[i + bars - 1].n};
  }
  return null;
}
const jzlExcerptBars = x => { const t = x && jazzTune(x.id); if(!t) return [];
  return jazzTuneAnalysis(t).chart.bars.filter(b => b.n >= x.from && b.n <= x.to); };
/* Mode C's lead sheet, and where its sections start. The database writes
   most standards condensed — an AABA tune as its A and its B, once each —
   so when the chart's letters are the form's letters, the sheet is laid out
   in the order of the form (A A B A), which is what a whole lead sheet
   shows. Otherwise the chart's own letters stand; a chart with no letters
   is divided evenly by its form. A section under four bars is a sketch,
   not a section, and that tune is left out. */
function jazzLeadFormSheet(t){
  const chart = jazzTuneAnalysis(t).chart;
  if(chart.prose || !chart.bars.length) return null;
  const secs = chart.sections.filter(s => s.bars.length);
  const form = (/\b([A-D]{2,5})\b/.exec(String(t.form || '')) || [])[1] || null;
  const lay = list => { let n = 0; const bars = [], starts = [];
    list.forEach(({letter, bars: bs}) => { starts.push({bar: n + 1, letter});
      bs.forEach((b, i) => bars.push(Object.assign({}, b, {n: ++n}, i === 0 && b.repeat ? {repeat: false} : {}))); });
    return {bars, starts}; };
  let out = null;
  if(secs.length >= 2 && secs.every(s => /^[A-D]\d?$/.test(s.label))){
    if(secs.some(s => s.bars.length < 4)) return null;
    const seq = secs.map(s => s.label[0]).join('');
    const same = form && [...new Set(seq)].sort().join('') === [...new Set(form)].sort().join('');
    if(form && same && seq !== form && seq.length < form.length){
      /* each letter of the form takes the chart's next section of that
         letter, or repeats the last one it had (an A2 stays the last A) */
      let next = 0; const last = {};
      const list = form.split('').map(L => {
        if(secs[next] && secs[next].label[0] === L){ last[L] = secs[next].bars; next++; }
        return {letter: L, bars: last[L] || secs.find(x => x.label[0] === L).bars}; });
      const laid = lay(list);
      /* laid out, a standard is thirty-two bars; one that is not was not
         condensed the way this assumes, and keeps its own letters */
      if(laid.bars.length === 32) out = Object.assign(laid, {source: 'expanded', form, written: seq});
    }
    if(!out) out = Object.assign(lay(secs.map(s => ({letter: s.label[0], bars: s.bars}))), {source: 'labels', form: seq});
  } else if(form && secs.length === 1 && [8, 16].includes(chart.bars.length / form.length)){
    const len = chart.bars.length / form.length;
    out = {bars: chart.bars, starts: form.split('').map((L, i) => ({bar: i * len + 1, letter: L})), source: 'form', form};
  }
  return out && out.bars.length >= 12 ? out : null;
}
function jazzLeadFormPool(n){
  return jazzLeadTunePool(n).filter(r => jazzLeadFormSheet(r.tune));
}
/* Mode C's check: the starts found, missed and invented, and the letters */
function jazzLeadCheckForm(truth, marks){
  const real = new Map(truth.starts.map(s => [s.bar, s.letter]));
  const mine = Object.keys(marks || {}).map(Number);
  const found = mine.filter(b => real.has(b));
  const extra = mine.filter(b => !real.has(b));
  const missed = [...real.keys()].filter(b => !mine.includes(b));
  const letters = found.filter(b => marks[b] === real.get(b)).length;
  return {found: found.length, of: real.size, extra: extra.length, missed, letters,
    score: real.size ? Math.max(0, (found.length - extra.length * 0.5) / real.size) : 0};
}

/* ---------- the state ---------- */
function jazzLeadState(){
  const j = jazzState();
  j.leadcards = j.leadcards && typeof j.leadcards === 'object' ? j.leadcards : {};
  const L = j.leadcards;
  L.log = Array.isArray(L.log) ? L.log : [];
  L.best = L.best && typeof L.best === 'object' ? L.best : {};
  L.settings = Object.assign({seconds: 8, cards: 10, self: false, bars: 4, bpm: 90, on24: false, band: false, overlay: false},
    L.settings || {});
  return L;
}
const jazzLeadUi = () => S._jlead = S._jlead || {stage: null, A: {phase: 'setup'}, B: {phase: 'setup'}, C: {phase: 'setup'}};
function jazzLeadLog(entry){
  const L = jazzLeadState();
  L.log.unshift(Object.assign({day: today(), at: Date.now()}, entry));
  L.log = L.log.slice(0, 400);
  saveNow();
}

/* ---------- the notes coming in ---------- */
let _jzlMidi = null, _jzlSink = null, _jzlCleanup = null;
async function jazzMidiConnect(){
  if(_jzlMidi) return _jzlMidi;
  if(!navigator.requestMIDIAccess) throw new Error('This browser does not offer Web MIDI — the keys on the screen, or the computer keyboard, will do.');
  const acc = await navigator.requestMIDIAccess();
  const hook = input => { input.onmidimessage = e => {
    const [st, n, v] = e.data, c = st & 0xf0;
    const ts = e.timeStamp && e.timeStamp > 1 ? e.timeStamp : performance.now();
    if(c === 0x90 && v > 0){ if(_jzlSink) _jzlSink(n, true, ts, 'midi'); }
    else if(c === 0x80 || c === 0x90){ if(_jzlSink) _jzlSink(n, false, ts, 'midi'); } }; };
  acc.inputs.forEach(hook);
  acc.onstatechange = () => acc.inputs.forEach(hook);
  _jzlMidi = acc;
  return acc;
}
const jazzMidiNames = () => _jzlMidi ? [..._jzlMidi.inputs.values()].map(i => i.name) : [];
/* the computer keyboard as a piano: A W S E D F T G Y H U J K O L P ; from middle C, Z and X for the octave */
const JZL_QWERTY = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k', 'o', 'l', 'p', ';'];
function jzlListen(onNote){
  if(_jzlCleanup) _jzlCleanup();
  _jzlSink = onNote;
  const held = new Map();
  let octave = 0;
  const kd = e => {
    if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = (e.key || '').toLowerCase();
    if(k === 'z' || k === 'x'){ octave = Math.max(-2, Math.min(1, octave + (k === 'x' ? 1 : -1))); toast(`The keys start at C${4 + octave}.`, 1200); return; }
    const i = JZL_QWERTY.indexOf(k);
    if(i < 0) return;
    e.preventDefault();
    if(e.repeat || held.has(k)) return;
    const m = 60 + 12 * octave + i; held.set(k, m);
    jazzPlayMidis([m]); onNote(m, true, performance.now(), 'keys');
  };
  const ku = e => { const k = (e.key || '').toLowerCase(); if(!held.has(k)) return;
    const m = held.get(k); held.delete(k); onNote(m, false, performance.now(), 'keys'); };
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  const off = [];
  /* an acoustic piano through the microphone, when it is listening (19-listen-b-live.js) */
  if(typeof listenOn === 'function') off.push(listenOn(ev => { if(ev.source !== 'mic') return;
    onNote(ev.pitch, true, ev.onset * 1000, 'mic'); setTimeout(() => onNote(ev.pitch, false, performance.now(), 'mic'), 400); }));
  _jzlCleanup = () => { removeEventListener('keydown', kd); removeEventListener('keyup', ku); _jzlSink = null;
    off.forEach(f => { try { f(); } catch(e){} }); _jzlCleanup = null; };
  return f => off.push(f);
}
/* where the notes can come from, and a button to plug in */
function jzlInputHTML(){
  const names = jazzMidiNames();
  return `<div class="jzl-input">
    ${names.length ? `<span class="mono jzl-midi on">MIDI: ${esc(names.join(', '))}</span>`
      : `<button class="btn sm ghost" data-jzlmidi>🎹 connect a MIDI keyboard</button>`}
    ${typeof listenActive === 'function' && listenActive() === 'mic' ? '<span class="mono jzl-midi on"><span class="li-dot"></span> hearing the piano</span>'
      : typeof listenStart === 'function' ? '<button class="btn sm ghost" data-jzlmic>🎤 listen to an acoustic piano</button>' : ''}
    <span class="faint">or press the keys on the screen, or use the computer keyboard —
      <span class="mono">A W S E D F T G Y H U J K</span> from middle C, <span class="mono">Z</span>/<span class="mono">X</span> for the octave.</span></div>`;
}
function jzlBindInput(host, then){
  const mic = host.querySelector('[data-jzlmic]');
  if(mic) mic.onclick = async () => { try { await listenStart({source: 'mic'}); toast('Listening through the microphone. Nothing leaves this device.'); } catch(e){ toast(e.message || 'The microphone could not be opened.'); } then && then(); };
  const b = host.querySelector('[data-jzlmidi]');
  if(b) b.onclick = async () => {
    try { await jazzMidiConnect(); const n = jazzMidiNames();
      toast(n.length ? `Listening to ${n.join(', ')}.` : 'MIDI is on, but no keyboard is plugged in yet.'); }
    catch(e){ toast(e.message || 'MIDI is not available here.'); }
    then && then();
  };
}

/* ---------- the page ---------- */
function jazzCardTabsHTML(active){
  const tabs = [['keys', 'Twelve keys', '#/jazz/cards'], ['A', 'A · Symbols', '#/jazz/cards/A'],
    ['B', 'B · Progressions', '#/jazz/cards/B'], ['C', 'C · Form', '#/jazz/cards/C']];
  return `<div class="jz-view-tabs" role="tablist">${tabs.map(([k, l, h]) =>
    `<button class="jz-view-tab${k === active ? ' on' : ''}" role="tab" aria-selected="${k === active}" data-jzgo="${h}">${esc(l)}</button>`).join('')}</div>`;
}
const JAZZ_LEAD_SAID = {
  A: 'A chord symbol, and seconds to play it. Points for the notes, a bonus for speed, and a multiplier for a run of right answers. The symbols grow with your stage — Stage 1, basic triads; Stage 12, upper structures.',
  B: 'Four or eight bars from a real tune, with a metronome. Comp through the changes in time. Graded on the chord quality, the time, and how smoothly the voices move.',
  C: 'A whole lead sheet with its section letters taken off. Tap the bar where each section starts, and give it its letter.'};
function jazzLeadCardsHTML(mode){
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Flashcards</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    ${jazzCardTabsHTML(mode)}
    <p class="page-blurb">${esc(JAZZ_LEAD_SAID[mode])} <span class="faint">Curriculum v3, Section 4A.</span></p>
    <div id="jzlHost" data-mode="${esc(mode)}"></div>`;
}
function jzlStageSelectHTML(n){
  const st = jazzStages().filter(s => /^(P0|\d+)$/.test(String(s.id)));
  return `<select class="sel" data-jzlstage>${st.map(s => { const k = jzlStageN(s.id);
    return `<option value="${esc(String(s.id))}" ${k === n ? 'selected' : ''}>Stage ${k} — ${esc(s.name)}</option>`; }).join('')}</select>`;
}
function bindJazzLeadCards(root, mode){
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  const host = root.querySelector('#jzlHost');
  if(!host) return;
  const u = jazzLeadUi();
  /* a clock or a count-in cannot be picked up again after leaving the page */
  if(u[mode].phase === 'card' || u[mode].phase === 'running') u[mode].phase = mode === 'A' ? 'setup' : 'ready';
  const draw = {A: jzlDrawA, B: jzlDrawB, C: jzlDrawC}[mode];
  draw(host);
  addEventListener('hashchange', () => { if(_jzlCleanup) _jzlCleanup(); }, {once: true});
}
const jzlSetStage = (host, redraw) => { const s = host.querySelector('[data-jzlstage]');
  if(s) s.onchange = () => { jazzLeadUi().stage = s.value; redraw(); }; };

/* ---------- Mode A ---------- */
function jzlDrawA(host){
  const u = jazzLeadUi(), A = u.A, L = jazzLeadState(), st = L.settings;
  const n = jzlStageN(u.stage);
  const redraw = () => jzlDrawA(host);
  if(_jzlCleanup) _jzlCleanup();
  if(A.phase === 'setup' || !A.cards){
    const tiers = jazzLeadTiersFor(n);
    const best = L.best['A' + n];
    host.innerHTML = `<div class="jz-setup">
      <div class="sc">The symbols of</div>${jzlStageSelectHTML(n)}
      <p class="faint jzl-pool">${tiers.map((t, i) => `<span class="${i === tiers.length - 1 ? 'on' : ''}">${esc(t.said)}</span>`).join(' · ')}</p>
      <div class="sc" style="margin-top:12px">Seconds a card</div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${[4, 6, 8, 12, 20].map(s =>
        `<button class="btn sm ${st.seconds === s ? 'primary' : 'ghost'}" data-jzlsec="${s}">${s}</button>`).join('')}</div>
      <div class="sc" style="margin-top:12px">How many</div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${[10, 20, 30].map(c =>
        `<button class="btn sm ${st.cards === c ? 'primary' : 'ghost'}" data-jzlcards="${c}">${c}</button>`).join('')}</div>
      <div class="sc" style="margin-top:12px">Playing it on</div>
      ${jzlInputHTML()}
      <label class="jz-gate mono"><input type="checkbox" data-jzlself ${st.self ? 'checked' : ''}> an acoustic piano — I will say how it went</label>
      ${best ? `<p class="mono faint">Your best at Stage ${n}: ${best} points.</p>` : ''}
      <div class="row" style="margin-top:14px"><button class="btn primary" data-jzlgo>Deal ${st.cards} symbols</button></div></div>
      ${jzlHistoryHTML('A')}`;
    jzlSetStage(host, redraw);
    jzlBindInput(host, redraw);
    $$('[data-jzlsec]', host).forEach(b => b.onclick = () => { st.seconds = +b.dataset.jzlsec; saveNow(); redraw(); });
    $$('[data-jzlcards]', host).forEach(b => b.onclick = () => { st.cards = +b.dataset.jzlcards; saveNow(); redraw(); });
    host.querySelector('[data-jzlself]').onchange = e => { st.self = e.target.checked; saveNow(); };
    host.querySelector('[data-jzlgo]').onclick = () => {
      const cards = [];
      while(cards.length < st.cards){ const s = jazzLeadSymbol(n); if(s !== cards[cards.length - 1]) cards.push(s); }
      Object.assign(A, {phase: 'card', cards, at: 0, points: 0, streak: 0, bestStreak: 0, right: 0, n, results: []});
      try { if(typeof timeAutoStart === 'function') timeAutoStart({categoryId: 'piano', feature: 'jazz', what: 'lead-sheet flashcards',
        linkedType: 'skill', linkedId: null, linkedLabel: 'Jazz piano'}); } catch(e){}
      sound('success'); redraw();
    };
    return;
  }
  if(A.phase === 'done'){
    const best = L.best['A' + A.n] || 0;
    host.innerHTML = `<div class="jz-card jzl-card">
      <p class="jzl-total serif">${A.points} points</p>
      <p class="mono" style="text-align:center">${A.right} of ${A.cards.length} right · longest run ${A.bestStreak}${A.newBest ? ' · a new best' : best ? ` · best ${best}` : ''}</p>
      <div class="jzl-results">${A.results.map(r => `<span class="jzl-res ${r.ok ? 'ok' : 'miss'}" title="${esc(r.said || '')}">${esc(jazzPrettyChord(r.sym))} <b class="mono">${r.points}</b></span>`).join('')}</div>
      <div class="row" style="gap:8px;justify-content:center;margin-top:14px">
        <button class="btn primary" data-jzlagain>Again</button><button class="btn ghost" data-jzlsetup>Change the settings</button></div></div>`;
    host.querySelector('[data-jzlagain]').onclick = () => { A.phase = 'setup'; A.cards = null; host.innerHTML = ''; jzlDrawA(host);
      host.querySelector('[data-jzlgo]').click(); };
    host.querySelector('[data-jzlsetup]').onclick = () => { A.phase = 'setup'; A.cards = null; redraw(); };
    return;
  }
  const sym = A.cards[A.at], spec = jazzChordSpec(sym);
  const limit = st.seconds;
  const self = st.self;
  const head = `<div class="row between" style="align-items:baseline;gap:8px">
      <span class="mono faint">card ${A.at + 1} of ${A.cards.length}</span>
      <span class="mono">${A.points} pts${A.streak ? ` · run ${A.streak} ×${(1 + 0.25 * Math.min(A.streak, 4)).toFixed(2)}` : ''}</span>
      <button class="tbtn" data-jzlquit>stop</button></div>`;
  const finish = () => {
    A.phase = 'done';
    const key = 'A' + A.n;
    A.newBest = A.points > (L.best[key] || 0);
    if(A.newBest) L.best[key] = A.points;
    jazzLeadLog({mode: 'A', stage: A.n, points: A.points, right: A.right, of: A.cards.length, run: A.bestStreak, seconds: limit});
    try { if(typeof timeAutoStop === 'function') timeAutoStop('jazz'); } catch(e){}
    sound('success'); redraw();
  };
  const next = () => { A.at++; A.phase = A.at >= A.cards.length ? 'done' : 'card'; A.last = null;
    if(A.phase === 'done') finish(); else redraw(); };
  if(A.phase === 'reveal'){
    const r = A.last;
    const vo = jazzCompVoicing(spec, 60);
    host.innerHTML = `<div class="jz-card jzl-card">${head}
      <div class="jzl-sym serif">${esc(jazzPrettyChord(sym))}</div>
      ${r.self && r.check == null ? `<p class="jz-chow">Did you have it?</p>`
        : `<p class="jzl-verdict ${r.check.ok ? 'ok' : 'miss'}">${r.check.ok ? '✓ That is the chord.'
          : r.timeout && !r.picked.length ? '✗ Time ran out.'
          : `✗ ${r.check.missing.length ? `Missing ${esc(r.check.missing.join(', '))}. ` : ''}${r.check.wrong.length ? `Not in it: ${esc(r.check.wrong.join(', '))}.` : ''}`}</p>
          <p class="mono jzl-pts">notes ${r.pts.notes} + time ${r.pts.bonus} × ${r.pts.mult.toFixed(2)} = <b>${r.pts.points}</b></p>`}
      ${jazzKeyboardHTML(48, 77, vo, r.picked, 'jzlKb')}
      <p class="mono" style="text-align:center">${esc(jazzLeadToneNames(spec).join(' '))} <span class="faint">— one voicing lit</span></p>
      <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">
        ${r.self && r.check == null ? `<button class="btn ghost danger" data-jzlself="0">✗ Missed</button>
          <button class="btn ghost" data-jzlself="0.5">~ Some of it</button><button class="btn primary" data-jzlself="1">✓ Had it</button>`
        : '<button class="btn primary" data-jzlnext>Next →</button>'}
        <button class="tbtn" data-jzlhear>▶ hear it</button></div></div>`;
    jazzPlayChord(sym);
    host.querySelector('[data-jzlhear]').onclick = () => jazzPlayChord(sym);
    host.querySelector('[data-jzlquit]').onclick = finish;
    const nb = host.querySelector('[data-jzlnext]'); if(nb) nb.onclick = next;
    $$('[data-jzlself]', host).forEach(b => b.onclick = () => {
      const v = +b.dataset.jzlself;
      const check = {ok: v === 1, score: v, missing: [], wrong: []};
      const pts = jazzLeadPoints(check, r.left, limit, A.streak);
      r.check = check; r.pts = pts; jzlTally(A, sym, check, pts); redraw();
    });
    /* space or enter moves on */
    const off = jzlListen(() => {});
    const kd = e => { if((e.key === 'Enter' || e.key === ' ') && host.querySelector('[data-jzlnext]')){ e.preventDefault(); next(); } };
    addEventListener('keydown', kd); off(() => removeEventListener('keydown', kd));
    return;
  }
  /* the card itself, with the clock running */
  const picked = [], down = new Set(), group = new Set();
  host.innerHTML = `<div class="jz-card jzl-card">${head}
    <div class="jzl-timer"><i data-jzlt></i></div>
    <div class="jzl-sym serif">${esc(jazzPrettyChord(sym))}</div>
    ${self ? '<p class="jz-chint mono">play it on the piano, then say so</p>' : jazzKeyboardHTML(48, 77, [], [], 'jzlKb')}
    <p class="mono faint jzl-heard" data-jzlheard>${self ? '' : 'the notes you play appear here'}</p>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">
      ${self ? '<button class="btn primary lg" data-jzldone>I played it</button>'
        : '<button class="btn primary" data-jzlsubmit>That is my voicing</button><button class="tbtn" data-jzlclear>clear</button>'}</div></div>`;
  const t0 = performance.now();
  let raf = 0, over = false;
  const bar = host.querySelector('[data-jzlt]');
  const leftNow = () => Math.max(0, limit - (performance.now() - t0) / 1000);
  const heard = () => { const el = host.querySelector('[data-jzlheard]'); if(el) el.textContent = picked.length
    ? picked.slice().sort((a, b) => a - b).map(jazzMidiName).join(' ') : ''; };
  const settle = (notes, timeout) => {
    if(over) return; over = true; cancelAnimationFrame(raf);
    const left = leftNow();
    if(self && !timeout){ A.last = {self: true, check: null, left, picked: []}; A.phase = 'reveal'; redraw(); return; }
    const check = notes.length ? jazzLeadCheck(notes, spec) : {ok: false, score: 0, missing: [], wrong: []};
    const pts = jazzLeadPoints(check, left, limit, A.streak);
    A.last = {check, pts, left, picked: notes.slice(), timeout};
    jzlTally(A, sym, check, pts);
    A.phase = 'reveal'; sound(check.ok ? 'success' : 'click'); redraw();
  };
  const tick = () => { const left = leftNow(); if(bar) bar.style.width = `${left / limit * 100}%`;
    if(bar) bar.classList.toggle('low', left < limit * 0.25);
    if(left <= 0){ settle(picked.slice(), true); return; } raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  const off = jzlListen((m, on, ts, from) => {
    if(over) return;
    if(on){ down.add(m); group.add(m); if(!picked.includes(m)) picked.push(m);
      const k = host.querySelector(`[data-kbm="${m}"]`); if(k) k.classList.add('on'); heard(); return; }
    down.delete(m);
    /* a chord is played when the hands come off it */
    if(!down.size && group.size >= Math.min(3, spec ? spec.required.length : 3)){ settle([...group], false); }
  });
  off(() => { over = true; cancelAnimationFrame(raf); });
  host.querySelector('[data-jzlquit]').onclick = () => { over = true; cancelAnimationFrame(raf); finish(); };
  if(self){ host.querySelector('[data-jzldone]').onclick = () => settle([], false); return; }
  $$('[data-kbm]', host).forEach(b => b.onclick = () => { const m = +b.dataset.kbm;
    const at = picked.indexOf(m); if(at >= 0) picked.splice(at, 1); else { picked.push(m); jazzPlayMidis([m]); }
    b.classList.toggle('on', at < 0); heard(); });
  host.querySelector('[data-jzlsubmit]').onclick = () => settle(picked.slice(), false);
  host.querySelector('[data-jzlclear]').onclick = () => { picked.length = 0; group.clear();
    $$('[data-kbm].on', host).forEach(k => k.classList.remove('on')); heard(); };
}
function jzlTally(A, sym, check, pts){
  A.points += pts.points;
  if(check.ok){ A.right++; A.streak++; A.bestStreak = Math.max(A.bestStreak, A.streak); } else A.streak = 0;
  A.results.push({sym, ok: check.ok, points: pts.points, said: check.ok ? 'right' : check.missing.concat(check.wrong).join(', ')});
}
function jzlHistoryHTML(mode){
  const log = jazzLeadState().log.filter(x => x.mode === mode).slice(0, 8);
  if(!log.length) return '';
  const line = x => mode === 'A' ? `Stage ${x.stage} · ${x.right}/${x.of} right · ${x.points} pts · run ${x.run}`
    : mode === 'B' ? `${esc(x.title || x.tune)} ${x.from}–${x.to} · ${x.bpm} bpm · chords ${Math.round(x.harm * 100)}% · time ${Math.round(x.rhythm * 100)}% · voice leading ${Math.round(x.vl * 100)}%${x.self ? ' (your own rating)' : ''}`
    : `${esc(x.title || x.tune)} · ${x.found}/${x.of} starts${x.extra ? `, ${x.extra} extra` : ''} · letters ${x.letters}/${x.found}`;
  return `<div class="jzl-hist"><span class="sc">The last few</span>${log.map(x =>
    `<div class="mono"><span class="faint">${esc(fmtDate(x.day, 'short'))}</span> ${line(x)}</div>`).join('')}</div>`;
}

/* ---------- Mode B ---------- */
function jzlBarsHTML(t, bars, overlay, marksIn){
  const marks = overlay ? jazzTuneBarMarks(t) : {};
  return `<div class="jt-chart jzl-chart"><div class="jt-bars">${bars.map(b => {
    const mk = marks[b.n] || [];
    return `<div class="jt-bar${b.repeat ? ' rep' : ''}${marksIn && marksIn[b.n] ? ' ' + marksIn[b.n] : ''}" data-bar="${b.n}">
      <span class="jt-bn mono">${b.n}</span>
      <div class="jt-chords">${b.repeat && b.chords.length ? '<span class="jt-sim">%</span>'
        : b.chords.map(c => `<span class="jt-ch${c.optional ? ' opt' : ''}" style="flex:${c.beats || 1}">${esc(jazzPrettyChord(c.text))}</span>`).join('')}</div>
      ${mk.length ? `<span class="jt-marks">${mk.map(k => `<i class="${JAZZ_TUNE_PATTERNS[k].dashed ? 'dash' : ''}" style="--c:${JAZZ_TUNE_PATTERNS[k].color}"></i>`).join('')}</span>` : ''}
    </div>`; }).join('')}</div></div>`;
}
function jzlDrawB(host){
  const u = jazzLeadUi(), B = u.B, L = jazzLeadState(), st = L.settings;
  const n = jzlStageN(u.stage);
  const redraw = () => jzlDrawB(host);
  if(_jzlCleanup) _jzlCleanup();
  if(!B.ex || B.ex.n !== n || B.ex.bars !== st.bars || !jazzTune(B.ex.id)){
    const x = jazzLeadExcerpt(n, st.bars, B.ex && B.ex.id);
    B.ex = x ? Object.assign(x, {n, bars: st.bars}) : null; B.phase = 'ready'; B.result = null;
  }
  if(!B.ex){ host.innerHTML = '<div class="empty">No tune at this level has a clean run of bars to read. Try another stage.</div>'; return; }
  const t = jazzTune(B.ex.id), bars = jzlExcerptBars(B.ex);
  const per = /3\/4/.test(t.timeSignature || '') ? 3 : 4;
  const style = t.category === 'bossa' ? 'bossa' : per === 3 ? 'waltz' : 'swing';
  const legend = st.overlay ? jazzPatternLegendHTML(t) : '';
  const res = B.result;
  const pc = v => `${Math.round(v * 100)}%`;
  host.innerHTML = `<div class="jz-setup">
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:end">
        <label class="pd-q"><span class="k">the tunes of</span>${jzlStageSelectHTML(n)}</label>
        <label class="pd-q"><span class="k">bars</span><span class="row" style="gap:4px">${[4, 8].map(k =>
          `<button class="btn sm ${st.bars === k ? 'primary' : 'ghost'}" data-jzlbars="${k}">${k}</button>`).join('')}</span></label>
        <label class="pd-q"><span class="k">tempo <b class="mono" data-jzlbpmv>${st.bpm}</b></span>
          <input type="range" min="40" max="220" step="2" value="${st.bpm}" data-jzlbpm></label></div>
      <div class="row" style="gap:10px;flex-wrap:wrap;margin-top:6px">
        <label class="jz-gate mono"><input type="checkbox" data-jzlopt="on24" ${st.on24 ? 'checked' : ''}> click on 2 and 4 only</label>
        <label class="jz-gate mono"><input type="checkbox" data-jzlopt="band" ${st.band ? 'checked' : ''}> bass and drums under me</label>
        <label class="jz-gate mono"><input type="checkbox" data-jzlopt="overlay" ${st.overlay ? 'checked' : ''}> show the analysis colours</label></div>
      ${jzlInputHTML()}</div>
    <div class="row between" style="align-items:baseline;margin-top:10px">
      <span><a class="jt-title serif" href="#/jazz/tune/${esc(B.ex.id)}">${esc(t.title)}</a>
        <span class="mono faint">bars ${B.ex.from}–${B.ex.to} · ${esc(t.key)} · ${esc(t.difficulty)}</span></span>
      <button class="tbtn" data-jzlnew>another excerpt</button></div>
    ${jzlBarsHTML(t, bars, st.overlay)}
    ${legend}
    <div class="jzl-count serif" data-jzlcount></div>
    ${jazzKeyboardHTML(48, 77, [], [], 'jzlKb')}
    <div class="row" style="gap:8px;justify-content:center;margin-top:8px">
      <button class="btn primary" data-jzlrun>${B.phase === 'running' ? '■ Stop' : '▶ Count me in'}</button></div>
    <div data-jzlres>${res ? jzlResultBHTML(res, pc) : ''}</div>
    ${jzlHistoryHTML('B')}`;
  jzlSetStage(host, () => { B.ex = null; redraw(); });
  jzlBindInput(host, redraw);
  $$('[data-jzlbars]', host).forEach(b => b.onclick = () => { st.bars = +b.dataset.jzlbars; saveNow(); redraw(); });
  const bpm = host.querySelector('[data-jzlbpm]');
  bpm.oninput = () => { st.bpm = +bpm.value; host.querySelector('[data-jzlbpmv]').textContent = st.bpm; };
  bpm.onchange = () => saveNow();
  $$('[data-jzlopt]', host).forEach(c => c.onchange = () => { st[c.dataset.jzlopt] = c.checked; saveNow();
    if(c.dataset.jzlopt === 'overlay') redraw(); });
  host.querySelector('[data-jzlnew]').onclick = () => { B.ex = Object.assign(jazzLeadExcerpt(n, st.bars, B.ex.id) || B.ex, {n, bars: st.bars}); B.result = null; redraw(); };
  bindJzlSelfB(host, B, t);
  /* the run */
  const events = [];
  let ctx = null, gain = null, band = null, timers = [], t0 = 0, perf0 = 0, c0 = 0, running = false;
  const stop = () => { running = false; timers.forEach(clearTimeout); timers = [];
    if(band){ band.stop(); band = null; } if(gain){ try { gain.disconnect(); } catch(e){} gain = null; }
    $$('.jt-bar.now', host).forEach(x => x.classList.remove('now'));
    const r = host.querySelector('[data-jzlrun]'); if(r) r.textContent = '▶ Count me in';
    const c = host.querySelector('[data-jzlcount]'); if(c) c.textContent = ''; B.phase = 'ready'; };
  const off = jzlListen((m, on, ts) => {
    const k = host.querySelector(`[data-kbm="${m}"]`); if(k) k.classList.toggle('on', on);
    if(running) events.push({m, on, ts});
  });
  off(stop);
  $$('[data-kbm]', host).forEach(b => {
    const press = e => { e.preventDefault(); const m = +b.dataset.kbm; jazzPlayMidis([m]); b.classList.add('on');
      if(running) events.push({m, on: true, ts: performance.now()}); };
    const lift = () => { const m = +b.dataset.kbm; b.classList.remove('on'); if(running) events.push({m, on: false, ts: performance.now()}); };
    b.onpointerdown = press; b.onpointerup = lift; b.onpointerleave = () => b.classList.contains('on') && lift();
  });
  host.querySelector('[data-jzlrun]').onclick = () => {
    if(running){ stop(); return; }
    ctx = jazzAudioCtx(); if(!ctx){ toast('This browser has no sound.'); return; }
    ctx.resume && ctx.resume();
    events.length = 0; B.result = null; host.querySelector('[data-jzlres]').innerHTML = '';
    const spb = 60 / st.bpm;
    const beats = jazzChartBeats({bars}, per, 0, null);
    gain = ctx.createGain(); gain.gain.value = 0.9; gain.connect(ctx.destination);
    c0 = ctx.currentTime; perf0 = performance.now();
    t0 = c0 + 0.2 + per * spb;
    for(let k = 0; k < per; k++) jzVoiceClick(ctx, gain, t0 - (per - k) * spb, k === 0);
    beats.forEach((b, k) => { if(!st.on24 || k % 2 === 1) jzVoiceClick(ctx, gain, t0 + k * spb, !st.on24 && b.beat === 0); });
    if(st.band){ band = jazzBand({bars}, {bpm: st.bpm, style, loop: false, countIn: false, at: t0,
      layers: {bass: true, piano: false, drums: true}}); band.start(ctx); }
    const at = s => Math.max(0, (s - ctx.currentTime) * 1000);
    const count = host.querySelector('[data-jzlcount]');
    for(let k = 0; k < per; k++) timers.push(setTimeout(() => { if(count) count.textContent = String(k + 1); }, at(t0 - (per - k) * spb)));
    bars.forEach((b, i) => timers.push(setTimeout(() => { if(count) count.textContent = '';
      $$('.jt-bar.now', host).forEach(x => x.classList.remove('now'));
      const el = host.querySelector(`.jt-bar[data-bar="${b.n}"]`); if(el) el.classList.add('now'); }, at(t0 + i * per * spb))));
    const lat = ctx.outputLatency || ctx.baseLatency || 0;
    timers.push(setTimeout(() => {
      const ev = events.map(e => ({m: e.m, on: e.on, t: c0 + (e.ts - perf0) / 1000 - lat}));
      stop();
      if(!ev.some(e => e.on)){ B.phase = 'self'; B.result = {self: true}; redraw(); return; }
      const g = jazzLeadGradeB(beats, ev, t0, spb);
      B.result = g;
      jazzLeadLog({mode: 'B', tune: B.ex.id, title: t.title, from: B.ex.from, to: B.ex.to, bpm: st.bpm, stage: n,
        harm: g.harm, rhythm: g.rhythm, vl: g.vl, self: false});
      sound(g.harm > 0.7 ? 'success' : 'click'); redraw();
    }, at(t0 + beats.length * spb + 0.35)));
    running = true; B.phase = 'running';
    host.querySelector('[data-jzlrun]').textContent = '■ Stop';
  };
}
function jzlResultBHTML(res, pc){
  if(res.self && res.saved) return `<div class="jzl-grade"><span class="sc">How it went, by your own account</span>
    <div class="jzl-meters">${[['the right chords', res.harm], ['in time', res.rhythm], ['smooth voice leading', res.vl]].map(([k, v]) =>
      `<div class="jzl-meter"><span>${k}</span><i><b style="width:${pc(v)}"></b></i><span class="mono">${pc(v)}</span></div>`).join('')}</div></div>`;
  if(res.self) return `<div class="jzl-grade"><span class="sc">No notes came in — how did it go?</span>
    ${[['harm', 'Did you play the right chord qualities?', ['every one', 'most', 'a few']],
       ['rhythm', 'Did you stay in time?', ['with the click', 'wobbled', 'lost it']],
       ['vl', 'Did the voices move by step?', ['smoothly', 'some leaps', 'jumped about']]].map(([k, q, opts]) =>
      `<div class="jzl-q"><span>${q}</span><span class="row" style="gap:4px">${opts.map((o, i) =>
        `<button class="tbtn" data-jzlrate="${k}" data-v="${[1, 0.6, 0.2][i]}">${o}</button>`).join('')}</span></div>`).join('')}
    <button class="btn sm primary" data-jzlsaveself disabled>Keep it</button></div>`;
  const dev = res.meanDevMs == null ? '' : ` — ${res.meanDevMs} ms from the grid on average${Math.abs(res.leanMs) > 15 ? `, ${res.leanMs < 0 ? 'ahead of' : 'behind'} the beat` : ''}`;
  return `<div class="jzl-grade"><span class="sc">How it went</span>
    <div class="jzl-meters">
      <div class="jzl-meter"><span>chord quality</span><i><b style="width:${pc(res.harm)}"></b></i><span class="mono">${pc(res.harm)}</span></div>
      <div class="jzl-meter"><span>in time</span><i><b style="width:${pc(res.rhythm)}"></b></i><span class="mono">${pc(res.rhythm)}</span></div>
      <div class="jzl-meter"><span>voice leading</span><i><b style="width:${pc(res.vl)}"></b></i><span class="mono">${pc(res.vl)}</span></div></div>
    <p class="mono faint">${res.attacks} chords played${dev}${res.avgMove != null ? ` · the voices moved ${res.avgMove} semitones a change` : ''}</p>
    <div class="jzl-rows">${res.rows.map(r => `<span class="jzl-res ${r.ok ? 'ok' : 'miss'}" title="${esc(r.played ? `heard ${r.heard.join(' ')}` : 'nothing played')}">
      <span class="mono faint">${r.bar}</span> ${esc(jazzPrettyChord(r.sym))} ${r.ok ? '✓' : r.played
        ? `<small>${r.missing.length ? `no ${esc(r.missing.join(' '))}` : ''}${r.against.length ? ` ${esc(r.against.join(' '))} against it` : ''}</small>` : '<small>—</small>'}</span>`).join('')}</div></div>`;
}
function bindJzlSelfB(host, B, t){
  const res = B.result;
  if(!res || !res.self || res.saved) return;
  const got = {};
  $$('[data-jzlrate]', host).forEach(b => b.onclick = () => {
    got[b.dataset.jzlrate] = +b.dataset.v;
    $$(`[data-jzlrate="${b.dataset.jzlrate}"]`, host).forEach(x => x.classList.toggle('on', x === b));
    host.querySelector('[data-jzlsaveself]').disabled = Object.keys(got).length < 3;
  });
  host.querySelector('[data-jzlsaveself]').onclick = () => {
    Object.assign(res, got, {saved: true});
    const st = jazzLeadState().settings;
    jazzLeadLog({mode: 'B', tune: B.ex.id, title: t.title, from: B.ex.from, to: B.ex.to, bpm: st.bpm, stage: B.ex.n,
      harm: got.harm, rhythm: got.rhythm, vl: got.vl, self: true});
    jzlDrawB(host);
  };
}

/* ---------- Mode C ---------- */
function jzlDrawC(host){
  const u = jazzLeadUi(), C = u.C;
  const n = jzlStageN(u.stage);
  const redraw = () => jzlDrawC(host);
  if(_jzlCleanup) _jzlCleanup();
  if(!C.id || C.n !== n || !jazzTune(C.id)){
    const pool = jazzLeadFormPool(n).filter(r => r.id !== C.id);
    C.id = pool.length ? jzlPick(pool).id : null; C.n = n; C.marks = {}; C.checked = null;
  }
  if(!C.id){ host.innerHTML = '<div class="empty">No tune at this level has a form the database knows.</div>'; return; }
  const t = jazzTune(C.id), truth = jazzLeadFormSheet(t);
  const chart = {bars: truth.bars};
  const letters = ['A', 'B', 'C', 'D'].slice(0, Math.max(3, ...truth.starts.map(s => 'ABCD'.indexOf(s.letter) + 1)));
  const res = C.checked;
  const real = new Map(truth.starts.map(s => [s.bar, s.letter]));
  const cls = {};
  chart.bars.forEach(b => {
    const mine = C.marks[b.n], was = real.get(b.n);
    cls[b.n] = [mine ? 'jzl-mark' : '', res && was ? (mine ? (mine === was ? 'jzl-ok' : 'jzl-half') : 'jzl-missed') : '',
      res && mine && !was ? 'jzl-extra' : ''].filter(Boolean).join(' ');
  });
  host.innerHTML = `<div class="jz-setup">
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:end">
        <label class="pd-q"><span class="k">the tunes of</span>${jzlStageSelectHTML(n)}</label>
        <button class="tbtn" data-jzlnew>another tune</button>
        <button class="tbtn" data-jzlhear>▶ hear it</button></div>
      <p class="faint" style="margin:8px 0 0">Tap the bar where a section starts; tap again to change its letter (${letters.join(' → ')} → none).</p></div>
    <div class="row between" style="align-items:baseline;margin-top:10px">
      <span><span class="serif jt-title">${esc(t.title)}</span> <span class="mono faint">${chart.bars.length} bars · ${esc(t.key)}</span></span>
      ${res ? '' : '<button class="btn sm primary" data-jzlcheck>Check</button>'}</div>
    <div class="jzl-form">${jzlBarsHTML(t, chart.bars, false, cls)}</div>
    ${res ? `<div class="jzl-grade"><span class="sc">The form</span>
      <p class="serif" style="font-size:1.1rem;margin:4px 0">${esc(truth.starts.map(s => s.letter).join(''))}
        <span class="mono faint" style="font-size:.72rem">— ${truth.source === 'labels' ? 'from the chart’s own section letters'
          : truth.source === 'expanded' ? `the database writes each section once (${esc(truth.written)}); this sheet lays them out in the order of its form, ${esc(truth.form)}`
          : `from the database’s form, ${esc(t.form)}, over even sections`}</span></p>
      <p class="mono">${res.found} of ${res.of} section starts found${res.extra ? `, ${res.extra} marked where none starts` : ''}${
        res.found ? ` · the letter right on ${res.letters} of ${res.found}` : ''}${res.missed.length ? ` · missed bar ${res.missed.join(', ')}` : ''}</p>
      <div class="row" style="gap:8px"><button class="btn sm primary" data-jzlnext>Next tune</button>
        <button class="tbtn" data-jzlretry>try this one again</button></div></div>` : ''}
    ${jzlHistoryHTML('C')}`;
  jzlSetStage(host, () => { C.id = null; redraw(); });
  $$('.jzl-form .jt-bar', host).forEach(b => b.onclick = () => {
    if(C.checked) return;
    const k = +b.dataset.bar, cur = C.marks[k];
    const i = cur ? letters.indexOf(cur) + 1 : 0;
    if(i >= letters.length) delete C.marks[k]; else C.marks[k] = letters[i];
    sound('click'); redraw();
  });
  /* a mark carries its letter where the section label would sit */
  $$('.jzl-form .jt-bar', host).forEach(b => { const k = +b.dataset.bar;
    const mine = C.marks[k], was = res ? real.get(k) : null;
    if(mine || was) b.insertAdjacentHTML('beforeend', `<span class="jzl-letter mono">${esc(mine || '')}${was && was !== mine ? `<i>${esc(was)}</i>` : ''}</span>`); });
  const ch = host.querySelector('[data-jzlcheck]');
  if(ch) ch.onclick = () => { C.checked = jazzLeadCheckForm(truth, C.marks);
    jazzLeadLog({mode: 'C', tune: C.id, title: t.title, stage: n, found: C.checked.found, of: C.checked.of,
      extra: C.checked.extra, letters: C.checked.letters});
    sound(C.checked.score >= 1 ? 'success' : 'click'); redraw(); };
  const nx = host.querySelector('[data-jzlnext]');
  if(nx) nx.onclick = () => { C.n = null; redraw(); };
  const rt = host.querySelector('[data-jzlretry]');
  if(rt) rt.onclick = () => { C.marks = {}; C.checked = null; redraw(); };
  host.querySelector('[data-jzlnew]').onclick = () => { C.n = null; redraw(); };
  let band = null;
  const hb = host.querySelector('[data-jzlhear]');
  hb.onclick = () => {
    if(band && band.running){ band.stop(); band = null; hb.textContent = '▶ hear it'; $$('.jt-bar.now', host).forEach(x => x.classList.remove('now')); return; }
    const per = /3\/4/.test(t.timeSignature || '') ? 3 : 4;
    band = jazzBand(chart, {bpm: 150, loop: false, style: t.category === 'bossa' ? 'bossa' : per === 3 ? 'waltz' : 'swing',
      onBar: k => { $$('.jt-bar.now', host).forEach(x => x.classList.remove('now'));
        const el = host.querySelector(`.jzl-form .jt-bar[data-bar="${k}"]`); if(el) el.classList.add('now'); },
      onEnd: () => { hb.textContent = '▶ hear it'; }});
    band.start(); hb.textContent = '■ stop';
  };
  const off = jzlListen(() => {});
  off(() => { if(band){ band.stop(); band = null; } });
}
