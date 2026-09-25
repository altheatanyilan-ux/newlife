/* ============================================================
   THE BAND, FURTHER — flashcards with a band, call and response, a tune
   played as a performance, and the singer's range.

   BAND MODE on the flashcards is "play it in E flat" asked the way a
   bandleader asks it: the key is called — big, and out loud if you like —
   the drums count a reaction window, and the band comes in on the downbeat
   whether you are ready or not. It plays the progression, the answer is
   turned over, you say whether you had it, and after one bar of drums the
   next key is called. The drums never stop between cards, so the drill
   stays in time. Three clean answers in a row shorten the window for that
   exercise — two bars, then one, then two beats — and every answer keeps
   the window it was given, so the exercise can say how it has come down.

   CALL AND RESPONSE: for a lick or a sung pattern, the band plays and the
   room plays the phrase (two bars, piano — or a soft voice on the Voice
   Track); then two bars of band alone for you to play it back. The notes
   are hidden until you ask ("Show me"), because the ear is doing the work.

   A TUNE is played as a performance: the head, N choruses of solos, the
   head out — with the melody (if the tune carries one) shown or hidden and
   heard or not, independently; trading fours with the drums in the solos;
   and the section and chorus always said, so the form is never lost.

   THE SINGER: comping on, a starting note before the count, the guide
   melody fading, and a range kept once, so a key that would take a pattern
   out of it is said before it is sung, with the octave or the nearest key
   that fits.
   ============================================================ */

const JZBC_WINDOWS = [8, 4, 2];                 /* two bars, one, two beats */
const JZBC_SAY = {C: 'C', Db: 'D flat', D: 'D', Eb: 'E flat', E: 'E', F: 'F', Gb: 'G flat', G: 'G', Ab: 'A flat', A: 'A', Bb: 'B flat', B: 'B'};

/* ---------- band mode: the settings ---------- */
function jazzBandCardSettings(){
  const st = jazzState().settings;
  /* filled in where it is, so whoever holds it holds the real one */
  const b = st.band = st.band && typeof st.band === 'object' ? st.band : {};
  const want = {on: false, bpm: 100, window: 'auto', speak: true, times: 1};
  Object.keys(want).forEach(k => { if(b[k] === undefined) b[k] = want[k]; });
  b.on = !!b.on; b.speak = b.speak !== false;
  b.bpm = clamp(Math.round(+b.bpm || 100), 40, 320);
  b.window = b.window === 'auto' || JZBC_WINDOWS.includes(+b.window) ? (b.window === 'auto' ? 'auto' : +b.window) : 'auto';
  b.times = clamp(+b.times || 1, 1, 4);
  return b;
}
/* the window this exercise has earned: two bars until three clean answers
   in a row, then one, then two beats */
function jazzReactionWindow(id){
  const b = jazzBandCardSettings();
  if(b.window !== 'auto') return b.window;
  const r = jazzRecord(id);
  return JZBC_WINDOWS.includes(+r.bandWindow) ? +r.bandWindow : 8;
}
function jazzBandGraded(id, result, beats, bpm){
  const r = jazzRecord(id, true);
  if(result === 'nailed'){
    r.bandStreak = (+r.bandStreak || 0) + 1;
    if(r.bandStreak >= 3){
      const now = JZBC_WINDOWS.includes(+r.bandWindow) ? +r.bandWindow : 8;
      const next = JZBC_WINDOWS[Math.min(JZBC_WINDOWS.length - 1, JZBC_WINDOWS.indexOf(now) + 1)];
      r.bandWindow = next; r.bandStreak = 0;
    }
  } else r.bandStreak = 0;
  saveNow();
}
/* how the window has come down, from the answers that carried one */
function jazzReactionTrend(id){
  const list = jazzState().flashes.filter(f => f.exerciseId === id && +f.reactionWindowBeats > 0)
    .slice().sort((a, b) => String(a.at).localeCompare(String(b.at)));
  if(list.length < 2) return null;
  const a = list[0], z = list[list.length - 1];
  const days = Math.max(0, Math.round((new Date(z.at) - new Date(a.at)) / 864e5));
  return {from: +a.reactionWindowBeats, to: +z.reactionWindowBeats, days,
    said: `Reaction window: ${a.reactionWindowBeats} beats → ${z.reactionWindowBeats} beats over ${
      days < 14 ? `${days} day${days === 1 ? '' : 's'}` : `${Math.round(days / 7)} weeks`}`};
}
function jazzReactionTrendHTML(id){
  const t = jazzReactionTrend(id);
  return t ? `<div class="jzb-reading mono jzbc-trend">${esc(t.said)}</div>` : '';
}

/* the setup, on the flashcards page */
function jazzBandCardsSetupHTML(){
  const b = jazzBandCardSettings();
  return `<div class="sc" style="margin-top:14px">🥁 Band mode</div>
    <label class="jz-gate mono"><input type="checkbox" id="jzbcOn" ${b.on ? 'checked' : ''}>
      the key is called, the band comes in, you play — then the answer</label>
    ${b.on ? `<div class="row jzbc-set" style="gap:10px;flex-wrap:wrap;margin-top:6px">
      <label class="mono jzb-f">♩ = <input class="inp sm mono" type="number" id="jzbcBpm" min="40" max="320" value="${b.bpm}"></label>
      <label class="mono jzb-f" title="how long the drums play between the key being called and the band coming in">reaction window
        <select class="sel sm" id="jzbcWin">${[['auto', 'as earned (2 bars → 1 → 2 beats)'], [8, '2 bars'], [4, '1 bar'], [2, '2 beats']].map(([v, l]) =>
          `<option value="${v}" ${String(b.window) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="mono jzb-f">the band plays it <select class="sel sm" id="jzbcTimes">${[1, 2, 4].map(n =>
        `<option value="${n}" ${b.times === n ? 'selected' : ''}>${n === 1 ? 'once' : n + ' times'}</option>`).join('')}</select></label>
      <label class="mono jzb-f"><input type="checkbox" id="jzbcSpeak" ${b.speak ? 'checked' : ''}> say the key aloud</label>
    </div>` : ''}`;
}
function bindJazzBandCardsSetup(root){
  const b = jazzBandCardSettings();
  const on = root.querySelector('#jzbcOn');
  if(on) on.onchange = () => { b.on = on.checked; saveNow(); rerender(); };
  const bpm = root.querySelector('#jzbcBpm');
  if(bpm) bpm.onchange = () => { b.bpm = clamp(Math.round(+bpm.value || 100), 40, 320); bpm.value = b.bpm; saveNow(); };
  const win = root.querySelector('#jzbcWin');
  if(win) win.onchange = () => { b.window = win.value === 'auto' ? 'auto' : +win.value; saveNow(); };
  const times = root.querySelector('#jzbcTimes');
  if(times) times.onchange = () => { b.times = +times.value; saveNow(); };
  const sp = root.querySelector('#jzbcSpeak');
  if(sp) sp.onchange = () => { b.speak = sp.checked; saveNow(); };
}

/* ---------- band mode: one card after another, in time ----------
   The card's run is one timeline: a bar of drums, the key called and the
   reaction window (drums), then the band through the progression. When it
   ends the drums go on, a bar at a time, until you have graded yourself;
   the next card's run then starts on the next bar line. */
const _jzbc = {run: null, drums: null, ctx: null};
function jzbcDrumBars(bars, bpb){
  return [...Array(bars)].map((_, i) => ({i, k: 0, number: 0, q0: i * bpb, len: bpb, beats: bpb, beatType: 4, changes: [{at: 0, sym: 'C'}]}));
}
/* a timeline of drums alone, `beats` long (a window can be half a bar) */
function jzbcDrumsTimeline(beats, bpm, style){
  const bars = [{i: 0, k: 0, number: 0, q0: 0, len: beats, beats, beatType: 4, changes: [{at: 0, sym: 'C'}]}];
  const ev = jzbDrums(bars, style || 'swing', jzbRand('lead' + beats)).map(n => Object.assign({}, n,
    {part: 2, staff: 1, voice: '2', inBar: n.q, perf: 0, perc: true, kit: true}));
  return {parts: [{name: 'You', inst: 'piano', staves: 2}, {name: 'Bass', inst: 'acoustic_bass'}, {name: 'Drums', inst: 'drums'}, {name: 'Comping', inst: 'piano'}],
    measures: [], perf: [{i: 0, k: 0, number: 0, q0: 0, len: beats, beats: Math.min(beats, 4), beatType: 4, chorus: -1}],
    events: ev, tempos: [{q: 0, bpm}], length: beats, choruses: [], playable: true};
}
/* one card: a bar of drums, the window, the progression — as one timeline */
function jzbcCardTimeline(card, b){
  const ex = jazzExercise(card.exerciseId) || {};
  const s = Object.assign(jzbDefaults(card.exerciseId, ex), {bpm: b.bpm, comping: 'off', hearMyPart: 0});
  const body = jazzBackingTimeline({id: card.exerciseId, keys: [...Array(b.times)].map(() => card.key), settings: s, interval: card.interval});
  const win = jazzReactionWindow(card.exerciseId);
  const lead = 4 + win;
  const drums = jzbDrums(jzbcDrumBars(Math.ceil(lead / 4), 4), s.drumStyle === 'off' ? 'swing' : s.drumStyle, jzbRand('c' + card.key))
    .filter(n => n.q < lead - 1e-6)
    .map(n => ({q: n.q, d: n.d, midi: n.midi, vel: n.vel, part: 2, staff: 1, voice: '2', inBar: n.q % 4, perf: 0, perc: true, kit: true}));
  const perf = [{i: 0, k: 0, number: 0, q0: 0, len: lead, beats: 4, beatType: 4, chorus: -1}]
    .concat(body.perf.map(p => Object.assign({}, p, {i: p.i + 1, q0: p.q0 + lead})));
  const events = drums.concat(body.events.map(e => Object.assign({}, e, {q: e.q + lead, perf: e.perf + 1})))
    .sort((a, c) => a.q - c.q || a.part - c.part);
  return {tl: Object.assign({}, body, {perf, events, length: body.length + lead, tempos: [{q: 0, bpm: b.bpm}]}),
    lead, win, callAt: 4, settings: s, straight: s.drumStyle === 'bossa' || s.drumStyle === 'straight'};
}
function jzbcSpeak(key){
  try { if(!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(JZBC_SAY[key] || key); u.rate = 1.05;
    speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){}
}
/* start a card's run on the next bar line of the drums that are keeping time */
async function jzbcPlayCard(root){
  const f = jazzUi().flash; if(!f) return;
  const card = f.cards[f.at]; const b = jazzBandCardSettings();
  try { if(typeof instrumentsLoad === 'function') await instrumentsLoad(['piano', 'acoustic_bass']); } catch(e){}
  const built = jzbcCardTimeline(card, b);
  const ctx = typeof plxAudioCtx === 'function' ? plxAudioCtx() : null; if(!ctx) return;
  _jzbc.ctx = ctx;
  const beat = 60 / b.bpm, bar = 4 * beat;
  let at = ctx.currentTime + 0.12;
  const d = _jzbc.drums;
  if(d && d.player && d.player.running){ const into = Math.max(0, at - d.at); at = d.at + Math.ceil(into / bar - 1e-6) * bar; }
  const player = scorePlayer(built.tl, {bpm: b.bpm, swing: built.straight ? 0 : jzbSwing(0.62, b.bpm), countIn: 0, at,
    volumes: {0: 0, 1: 1, 2: 0.9, 3: 0.75}, muted: new Set(['p:0'])});
  if(!player.start()) { toast('This browser cannot make sound.'); return; }
  /* the drums that were keeping time stop where this run begins */
  if(d){ const stopIn = Math.max(0, (at - ctx.currentTime) * 1000 - 20); setTimeout(() => { try { d.player.stop(); } catch(e){} }, stopIn); _jzbc.drums = null; }
  const run = {card, player, at, end: at + built.tl.length * beat, win: built.win, bpm: b.bpm, phase: 'lead'};
  _jzbc.run = run;
  const ms = t => Math.max(0, (t - ctx.currentTime) * 1000);
  /* the key called at the start of the window, the band on its downbeat */
  setTimeout(() => { if(_jzbc.run !== run) return; run.phase = 'call'; jzbcPaint(root); if(b.speak) jzbcSpeak(card.key); }, ms(at + built.callAt * beat));
  setTimeout(() => { if(_jzbc.run !== run) return; run.phase = 'band'; jzbcPaint(root); }, ms(at + built.lead * beat));
  /* the drums that keep time after it are booked before it ends, from its
     last bar line, so there is no gap and no drift */
  setTimeout(() => { if(_jzbc.run === run) jzbcKeepTime(run); }, Math.max(0, ms(run.end) - 450));
  setTimeout(() => { if(_jzbc.run === run && run.phase !== 'answer') jzbcAnswer(root); }, ms(run.end));
  jzbcPaint(root);
}
function jzbcKeepTime(run){
  if(_jzbc.drums && _jzbc.drums.at === run.end) return;
  const tl = jzbcDrumsTimeline(4, run.bpm);
  const player = scorePlayer(tl, {bpm: run.bpm, swing: jzbSwing(0.62, run.bpm), loop: true, countIn: 0, at: run.end, volumes: {2: 0.8}});
  if(player.start()) _jzbc.drums = {player, at: run.end};
}
/* the progression is over: the answer, and the drums keep time until you grade */
function jzbcAnswer(root){
  const run = _jzbc.run; if(!run || run.phase === 'answer') return;
  run.phase = 'answer';
  jzbcKeepTime(run);
  const f = jazzUi().flash; if(f) f.shown = true;
  jzbcPaint(root);
}
function jzbcStopAll(){
  const r = _jzbc.run; _jzbc.run = null;
  if(r) try { r.player.stop(); } catch(e){}
  if(_jzbc.drums) try { _jzbc.drums.player.stop(); } catch(e){}
  _jzbc.drums = null;
  try { if('speechSynthesis' in window) speechSynthesis.cancel(); } catch(e){}
}
addEventListener('hashchange', () => { if(_jzbc.run || _jzbc.drums) jzbcStopAll(); });

function jazzBandCardHTML(){
  const f = jazzUi().flash, card = f.cards[f.at];
  const ex = jazzExercise(card.exerciseId);
  if(!ex) return '<div class="empty">That exercise is no longer in the book.</div>';
  return `<div class="jz-card jzbc">
    <div class="row between" style="align-items:baseline">
      <span class="mono faint">card ${f.at + 1} of ${f.cards.length} · 🥁 band mode</span>
      <button class="tbtn" id="jzQuit">stop</button></div>
    <div class="jz-cbar"><i style="width:${Math.round(f.at / f.cards.length * 100)}%"></i></div>
    <p class="jz-cprompt serif">${esc(ex.ask || ex.name)}</p>
    <p class="jz-ckey serif jzbc-key" id="jzbcKey">${esc(jazzPretty(card.key))}</p>
    <p class="jzbc-phase mono" id="jzbcPhase">…</p>
    <div id="jzbcAnswer" hidden>
      <p class="jz-cask mono">${esc(jazzCardSaid(ex, card))}</p>
      ${jazzAccuracyHTML(ex)}
      <div class="jz-stage-box"><div class="jz-score" id="jzCardScore"></div></div>
      <p class="jz-chow">Did you have it?</p>
      <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn ghost danger" data-jzbcg="couldnt">✗ Couldn’t</button>
        <button class="btn ghost" data-jzbcg="struggled">~ Struggled</button>
        <button class="btn primary" data-jzbcg="nailed">✓ Nailed it</button>
      </div></div>
    <div class="row" style="justify-content:center;margin-top:18px" id="jzbcStartRow">
      <button class="btn primary lg" id="jzbcStart">▶ Count me in</button></div>
    <p class="jz-chint mono">the band comes in on the downbeat — be playing</p>
  </div>`;
}
function jzbcPaint(root){
  const run = _jzbc.run, f = jazzUi().flash;
  if(!f || !root.isConnected) return;
  const ph = root.querySelector('#jzbcPhase'), ans = root.querySelector('#jzbcAnswer'), start = root.querySelector('#jzbcStartRow');
  const keyEl = root.querySelector('#jzbcKey');
  if(start) start.hidden = !!run;
  if(!run) return;
  const words = {lead: 'the drums…', call: `${run.win === 8 ? 'two bars' : run.win === 4 ? 'one bar' : 'two beats'} — get your hands there`, band: 'the band is in — play', answer: 'the answer'};
  if(ph) ph.textContent = words[run.phase] || '';
  if(keyEl) keyEl.classList.toggle('call', run.phase === 'call');
  if(ans){
    const show = run.phase === 'answer';
    if(show && ans.hidden){
      ans.hidden = false;
      const card = f.cards[f.at], ex = jazzExercise(card.exerciseId);
      const x = jazzScoreFor(card.exerciseId, ex, card.key, {interval: card.interval});
      const xml = x && x.documents ? (x.documents[0] || {}).mxl : x;
      if(xml) jazzEngrave(root.querySelector('#jzCardScore'), xml);
    }
  }
}
function bindJazzBandCard(root){
  const ui = jazzUi(), f = ui.flash;
  const card = f.cards[f.at];
  const quit = root.querySelector('#jzQuit');
  if(quit) quit.onclick = () => { jzbcStopAll(); jazzEndSession(); };
  const go = root.querySelector('#jzbcStart');
  if(go) go.onclick = () => { sound('click'); jzbcPlayCard(root); };
  $$('[data-jzbcg]', root).forEach(b => b.onclick = () => {
    const run = _jzbc.run; if(!run || run.phase !== 'answer') return;
    const how = b.dataset.jzbcg;
    jazzGrade(card.exerciseId, card.key, how, null, {reactionWindowBeats: run.win, bpm: run.bpm, band: true});
    jazzBandGraded(card.exerciseId, how, run.win, run.bpm);
    f.got[how] = (f.got[how] || 0) + 1;
    sound(how === 'nailed' ? 'success' : 'click');
    f.at++; f.shown = false;
    _jzbc.run = null;
    if(f.at >= f.cards.length){ jzbcStopAll(); jazzEndSession(true); return; }
    rerender();
  });
  /* after a grade the next card comes in by itself, a bar of drums later */
  if(!_jzbc.run && _jzbc.drums){ const s = root.querySelector('#jzbcStartRow'); if(s) s.hidden = true; jzbcPlayCard(root); }
  else jzbcPaint(root);
}

/* ============================================================
   A TUNE, PLAYED AS A PERFORMANCE
   ============================================================ */
const JZBT_CHORUSES = [1, 2, 3, 4, 6, 8];
function jazzTunePlaySettings(t){
  const st = jazzTunesState();
  const all = st.tuneUi.play = st.tuneUi.play && typeof st.tuneUi.play === 'object' ? st.tuneUi.play : {};
  const style = typeof jzxStyleOf === 'function' ? jzxStyleOf(t) : 'swing';
  const ballad = /ballad/i.test(t.tempo || '');
  const d = {bpm: typeof jazzTempoOf === 'function' ? jazzTempoOf(t) : 120, choruses: 2, trading: false,
    bassStyle: style === 'bossa' ? 'two_feel' : ballad ? 'two_feel' : 'walking',
    drumStyle: style === 'bossa' ? 'bossa' : ballad ? 'ballad' : 'swing', comping: 'charleston',
    melody: 0.6, showMelody: true, countIn: 1, swingRatio: 0.62};
  all[t.id] = Object.assign(d, all[t.id] || {});
  return all[t.id];
}
/* the chart's bars in the shape the band reads: the chords that change in
   each bar, moved to the key it is played in */
function jzbtBars(t, key){
  const chart = jazzParseChart(t.chordProgression || '');
  const bpb = /^3\//.test(t.timeSignature || '') ? 3 : 4;
  const semis = typeof jazzTuneShift === 'function' ? jazzTuneShift(t, key) : 0;
  const beats = jazzChartBeats(chart, bpb, semis, key);
  const bars = [];
  beats.forEach(b => {
    let bar = bars.find(x => x.number === b.bar);
    if(!bar){ bar = {number: b.bar, len: bpb, beats: bpb, beatType: 4, changes: []}; bars.push(bar); }
    if(b.sym && (b.first || !bar.changes.length) && !bar.changes.some(c => Math.abs(c.at - b.beat) < 1e-6))
      bar.changes.push({at: b.beat, sym: b.sym});
  });
  let last = null;
  bars.forEach(b => { if(!b.changes.length && last) b.changes.push({at: 0, sym: last});
    else if(b.changes.length && b.changes[0].at > 0 && last) b.changes.unshift({at: 0, sym: last});
    if(b.changes.length) last = b.changes[b.changes.length - 1].sym; });
  return {bars: bars.filter(b => b.changes.length), bpb, semis, chart};
}
/* the form, bar by bar: A1 A2 B A3, from the chart's own labels, else the
   tune's form letters over its bars, else a blues */
function jzbtForm(t, bars, chart){
  const out = new Array(bars.length).fill('');
  const secs = (chart && chart.sections) || [];
  if(secs.some(x => x.label)){
    let i = 0; const seen = {};
    secs.forEach(sec => { const l = sec.label || ''; const letter = l.replace(/\d+$/, '') || l;
      seen[letter] = (seen[letter] || 0) + 1;
      const name = l ? (/\d$/.test(l) ? l : (secs.filter(x => (x.label || '').replace(/\d+$/, '') === letter).length > 1 ? letter + seen[letter] : l)) : '';
      sec.bars.forEach(() => { if(i < out.length) out[i++] = name; }); });
    return out;
  }
  const letters = String(t.form || '').replace(/[^A-Z]/g, '').split('');
  if(letters.length && bars.length % letters.length === 0){
    const each = bars.length / letters.length, seen = {};
    letters.forEach((l, j) => { seen[l] = (seen[l] || 0) + 1;
      const name = letters.filter(x => x === l).length > 1 ? l + seen[l] : l;
      for(let k = 0; k < each; k++) out[j * each + k] = name; });
    return out;
  }
  return out.map(() => bars.length === 12 ? 'Blues' : '');
}
/* the whole performance: the head, the solos, the head out */
function jazzTuneTimeline(t, key, s){
  const {bars, bpb, semis, chart} = jzbtBars(t, key);
  if(!bars.length) return null;
  const form = jzbtForm(t, bars, chart);
  const plan = ['head'].concat([...Array(Math.max(1, s.choruses))].map(() => 'solo'), ['head_out']);
  let mel = null;
  if(t.melodyMusicXml){ try { mel = musicXmlTimeline(t.melodyMusicXml); } catch(e){ mel = null; } }
  const perf = [], events = [], choruses = [];
  let Q = 0;
  plan.forEach((kind, ci) => {
    const base = perf.length;
    const sb = bars.map((b, j) => ({i: base + j, k: j, number: b.number, q0: Q + j * bpb, len: bpb, beats: bpb, beatType: 4, changes: b.changes}));
    sb.forEach((b, j) => {
      const soloN = plan.slice(0, ci + 1).filter(x => x === 'solo').length;
      const trade = kind === 'solo' && s.trading ? (Math.floor(j / 4) % 2 === 1 ? 'drums' : 'you') : null;
      perf.push(Object.assign({}, b, {chorus: ci, kind, section: form[j], soloN, trade}));
    });
    const rnd = jzbRand(`${t.id}|${key}|${ci}`);
    const barOf = q => sb[Math.min(sb.length - 1, Math.max(0, Math.floor((q - Q) / bpb)))];
    const add = (list, part, extra, keep) => list.forEach(n => { const b = barOf(n.q);
      if(keep && !keep(perf[b.i])) return;
      events.push(Object.assign({q: n.q, d: n.d || 0.25, midi: n.midi, vel: n.vel, part, staff: 1, voice: String(part),
        inBar: n.q - b.q0, perf: b.i}, extra || {})); });
    const band = p => p.trade !== 'drums';
    add(jzbBass(sb, s.bassStyle, rnd), 1, null, band);
    add(jzbDrums(sb, s.drumStyle, rnd), 2, {perc: true, kit: true});
    /* four bars of drums alone: busier — the snare and the kick answering */
    if(s.trading && kind === 'solo') sb.forEach(b => { if(perf[b.i].trade !== 'drums') return;
      for(let x = 0; x < bpb * 2; x++){ if(rnd() < 0.45) events.push({q: b.q0 + x / 2, d: 0.2, midi: rnd() < 0.7 ? 38 : 36, vel: 0.35 + rnd() * 0.3,
        part: 2, staff: 1, voice: '2', inBar: x / 2, perf: b.i, perc: true, kit: true}); } });
    add(jzbComp(sb, s.comping, rnd), 3, null, band);
    /* the melody in the head, moved to the key */
    if(mel && kind !== 'solo') mel.events.forEach(e => { if(e.chord || e.perf >= sb.length) return;
      events.push(Object.assign({}, e, {q: sb[e.perf].q0 + e.inBar, midi: e.midi + semis, part: 0, perf: sb[e.perf].i})); });
    choruses.push({kind, q0: Q, q1: Q + bars.length * bpb, key});
    Q += bars.length * bpb;
  });
  events.sort((a, b) => a.q - b.q || a.part - b.part || a.midi - b.midi);
  return {parts: [{name: 'Melody', inst: 'flute', staves: 1}, {name: 'Bass', inst: 'acoustic_bass'}, {name: 'Drums', inst: 'drums'}, {name: 'Comping', inst: 'piano'}],
    measures: [], perf, events, tempos: [{q: 0, bpm: s.bpm}], length: Q, choruses, playable: true, form, bpb, hasMelody: !!mel};
}
const _jzbt = {run: null};
function jazzTunePlayHTML(t){
  const s = jazzTunePlaySettings(t);
  const opt = (list, v) => list.map(([k, l]) => `<option value="${k}" ${String(k) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const mel = !!t.melodyMusicXml;
  return `<div class="jzb jzbt" id="jzbt">
    <div class="jzb-h"><span class="sc">🎺 Play the tune — head · solos · head out</span><span class="grow"></span>
      <span class="mono faint">${mel ? 'with its melody' : 'no melody in it: the band plays the changes in the head'}</span></div>
    <div class="jzb-row">
      <button class="btn sm primary jzb-go" id="jzbtGo">▶ Play the tune</button>
      <label class="mono jzb-f">♩ = <input class="inp sm mono" type="number" id="jzbtBpm" min="40" max="360" value="${s.bpm}"></label>
      <label class="mono jzb-f">choruses of solos <select class="sel sm" id="jzbtCh">${opt(JZBT_CHORUSES.map(n => [n, String(n)]), s.choruses)}</select></label>
      <label class="mono jzb-f" title="in the solos, four bars for you, four for the drums alone — keep the form in your head through them"><input type="checkbox" id="jzbtTrade" ${s.trading ? 'checked' : ''}> trade fours</label>
    </div>
    <div class="jzb-row">
      <label class="mono jzb-f">bass <select class="sel sm" id="jzbtBass">${opt(JZB_BASS, s.bassStyle)}</select></label>
      <label class="mono jzb-f">drums <select class="sel sm" id="jzbtDrums">${opt(JZB_DRUMS, s.drumStyle)}</select></label>
      <label class="mono jzb-f">comping <select class="sel sm" id="jzbtComp">${opt(JZB_COMP, s.comping)}</select></label>
      <label class="mono jzb-f">count-in <select class="sel sm" id="jzbtCount">${opt([[0, 'none'], [1, '1 bar'], [2, '2 bars']], s.countIn)}</select></label>
    </div>
    ${mel ? `<div class="jzb-row">
      <label class="mono jzb-f" title="heard: the melody's sound, whatever is shown">melody heard <select class="sel sm" id="jzbtMel">${opt([[0.8, 'full'], [0.3, 'quietly, as a guide'], [0, 'not at all']], s.melody)}</select></label>
      <label class="mono jzb-f" title="shown: the melody's notes, whatever is heard"><input type="checkbox" id="jzbtShow" ${s.showMelody ? 'checked' : ''}> melody shown</label>
    </div>
    <div class="jzbt-mel" id="jzbtMelBox" ${s.showMelody ? '' : 'hidden'}></div>` : ''}
    <div class="jzb-show jzbt-show" id="jzbtShow" hidden>
      <div class="jzb-key serif" id="jzbtSec"></div>
      <div class="jzb-where mono" id="jzbtWhere"></div></div>
  </div>`;
}
function jzbtStop(){
  const r = _jzbt.run; _jzbt.run = null; if(!r) return;
  if(r.raf) cancelAnimationFrame(r.raf);
  try { r.player.stop(); } catch(e){}
  if(!r.root.isConnected) return;
  const go = r.root.querySelector('#jzbtGo'); if(go){ go.textContent = '▶ Play the tune'; go.classList.remove('on'); }
  const sh = r.root.querySelector('#jzbtShow'); if(sh) sh.hidden = true;
  $$('.jt-bar.now', r.root).forEach(b => b.classList.remove('now'));
}
addEventListener('hashchange', () => { if(_jzbt.run) jzbtStop(); });
async function jzbtStart(root, t){
  jzbtStop();
  if(typeof _jzBand !== 'undefined' && _jzBand){ try { _jzBand.stop(); } catch(e){} }
  const s = jazzTunePlaySettings(t), key = jazzTuneKeyNow(t);
  const tl = jazzTuneTimeline(t, key, s);
  if(!tl){ toast('This tune has no changes to play.'); return false; }
  const go = root.querySelector('#jzbtGo');
  if(go){ go.textContent = 'Loading sounds…'; go.classList.add('loading'); }
  try { if(typeof instrumentsLoad === 'function') await instrumentsLoad(['piano', 'acoustic_bass'].concat(tl.hasMelody ? ['flute'] : [])); } catch(e){}
  if(go) go.classList.remove('loading');
  if(!root.isConnected) return false;
  if(typeof scorePlayStopAll === 'function') scorePlayStopAll();
  const straight = s.drumStyle === 'bossa' || s.drumStyle === 'straight';
  const player = scorePlayer(tl, {bpm: s.bpm, swing: straight ? 0 : jzbSwing(s.swingRatio, s.bpm), countIn: s.countIn,
    volumes: {0: s.melody || 0, 1: 1, 2: 0.9, 3: 0.75}, muted: new Set(s.melody > 0 ? [] : ['p:0']),
    onEnd: () => { if(_jzbt.run && _jzbt.run.player === player) jzbtStop(); }});
  if(!player.start()){ toast('This browser cannot make sound.'); return false; }
  const r = {t, root, player, tl, raf: 0, lastBar: -1};
  _jzbt.run = r;
  if(go){ go.textContent = '■ Stop'; go.classList.add('on'); }
  const sh = root.querySelector('#jzbtShow'); if(sh) sh.hidden = false;
  const frame = () => {
    if(_jzbt.run !== r) return;
    if(!r.root.isConnected){ jzbtStop(); return; }
    const pm = player.perfAt(player.position());
    if(pm && pm.i !== r.lastBar){
      r.lastBar = pm.i;
      const sec = root.querySelector('#jzbtSec'), where = root.querySelector('#jzbtWhere');
      const said = pm.kind === 'head' ? 'Head' : pm.kind === 'head_out' ? 'Head out' : `Solos · chorus ${pm.soloN} of ${s.choruses}`;
      if(sec) sec.textContent = [pm.section, pm.trade === 'drums' ? '🥁 drums' : pm.trade === 'you' ? 'you' : ''].filter(Boolean).join(' · ') || `bar ${pm.number}`;
      if(where) where.textContent = `${said} · bar ${pm.k + 1} of ${tl.form.length}`;
      $$('.jt-bar.now', root).forEach(b => b.classList.remove('now'));
      const bar = root.querySelector(`.jt-bar[data-bar="${pm.number}"]`); if(bar) bar.classList.add('now');
    }
    r.raf = requestAnimationFrame(frame);
  };
  r.raf = requestAnimationFrame(frame);
  return true;
}
async function jzbtMelodyPaint(root, t){
  const box = root.querySelector('#jzbtMelBox'); if(!box || box.hidden || !t.melodyMusicXml) return;
  const key = jazzTuneKeyNow(t), semis = typeof jazzTuneShift === 'function' ? jazzTuneShift(t, key) : 0;
  let xml = t.melodyMusicXml;
  try { if(semis && typeof transposeMusicXml === 'function') xml = transposeMusicXml(xml, semis); } catch(e){}
  box.innerHTML = ''; jazzEngrave(box, xml);
}
function bindJazzTunePlay(root, t){
  const box = root.querySelector('#jzbt'); if(!box) return;
  const s = jazzTunePlaySettings(t);
  const $b = q => box.querySelector(q);
  const live = () => _jzbt.run && _jzbt.run.t.id === t.id;
  const again = () => { saveNow(); if(live()) jzbtStart(root, t); };
  $b('#jzbtGo').onclick = () => { sound('click'); if(live()) jzbtStop(); else jzbtStart(root, t); };
  $b('#jzbtBpm').onchange = () => { const v = +$b('#jzbtBpm').value; if(!(v >= 40 && v <= 360)){ $b('#jzbtBpm').value = s.bpm; return; }
    s.bpm = Math.round(v); saveNow(); if(live()) _jzbt.run.player.set('bpm', s.bpm); };
  $b('#jzbtCh').onchange = () => { s.choruses = +$b('#jzbtCh').value; again(); };
  $b('#jzbtTrade').onchange = () => { s.trading = $b('#jzbtTrade').checked; again(); };
  [['#jzbtBass', 'bassStyle'], ['#jzbtDrums', 'drumStyle'], ['#jzbtComp', 'comping']].forEach(([q, k]) => { $b(q).onchange = () => { s[k] = $b(q).value; again(); }; });
  $b('#jzbtCount').onchange = () => { s.countIn = +$b('#jzbtCount').value; saveNow(); };
  const mel = $b('#jzbtMel');
  if(mel) mel.onchange = () => { s.melody = +mel.value; saveNow();
    if(live()){ const p = _jzbt.run.player; p.set('volumes', {0: s.melody, 1: 1, 2: 0.9, 3: 0.75}); p.set('muted', new Set(s.melody > 0 ? [] : ['p:0'])); } };
  const show = $b('#jzbtShow');
  if(show) show.onchange = () => { s.showMelody = show.checked; saveNow(); const mb = $b('#jzbtMelBox'); if(mb){ mb.hidden = !s.showMelody; jzbtMelodyPaint(root, t); } };
  jzbtMelodyPaint(root, t);
}
