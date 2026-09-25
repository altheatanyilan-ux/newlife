/* sync-band — a band that plays the chart, on real instruments, and
   remembers exactly when every beat fell.

   Used by the recording-sync accuracy harness (test-sync-accuracy.js).
   The engine is given only the audio and the chart, the way it will be
   with a real recording; this file knows the answer.

   THE SOUND. Every note is a recording of that instrument playing that
   note: the CC0 libraries in vendor/orchestra (Versilian's VSCO-2 CE,
   VCSL and Virtuosity Drums, Karoryfer's Swirly Drums, D. Smolken's
   double bass — see vendor/orchestra/LICENSE.md). A sample is moved by
   at most a semitone and a half to the note wanted, corrected by its own
   measured tuning; a held note longer than its recording loops a stretch
   of its sustain with crossfades; a line (the bass, a horn) cuts its last
   note when the next begins; the room is a stereo Freeverb; the master is
   a soft limiter.

   THE PLAYING, meant to be as awkward as the real thing:
   - walking bass on the double bass: roots on the chord changes,
     chromatic approaches into them, chord and scale tones between; a
     two-feel on a ballad or a first chorus;
   - comping on the Steinway (or the vibraphone): rootless voicings,
     Charleston, reverse Charleston, pushes that land the next bar's chord
     an eighth early;
   - heads on tenor saxophone, or trumpet and tenor in octaves; solos of
     swung eighths with scale and chromatic notes, some anticipating the
     next chord across the barline; staccato samples for short notes,
     vibrato ones for long notes in a ballad;
   - drums: ride pattern, hi-hat foot on 2 and 4, feathered kick, snare
     comping and ghost notes, crash on the first downbeat of a chorus; on
     a ballad, brushes stirring on the snare with taps on 2 and 4;
   - players ±12 ms off the grid, tempo drift, swing, rubato with
     phrase-end ritardandos, a slowing last chorus;
   - intros (a drum count, a vamp on the turnaround, a free piano intro),
     endings (a held chord, a tag, a fade), applause;
   - the whole band transposed and detuned by a few cents.

   Usable from Node (module.exports) and a page (window.syncBand). The
   caller supplies the decoded samples (see loadBank in the harness). */
(function(root){
'use strict';
function rng(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---- the chord's notes, on their own terms (not the engine's templates) ---- */
function chordShape(c){
  const q = String(c.q || ''), Q = c.quality || 'maj';
  const third = Q === 'min' || Q === 'hd' || Q === 'dim' ? 3 : Q === 'sus' ? 5 : 4;
  const fifth = Q === 'hd' || Q === 'dim' || /b5/.test(q) ? 6 : Q === 'aug' || /#5|\+/.test(q) ? 8 : 7;
  const seventh = Q === 'dim' ? 9 : Q === 'dom' || Q === 'hd' || Q === 'sus' ? 10
    : Q === 'maj' ? (/^6|^69/.test(q) ? 9 : 11) : Q === 'min' ? (/M7|maj7/.test(q) ? 11 : /^m6/.test(q) ? 9 : 10) : 10;
  const ninth = /b9|alt/.test(q) ? 1 : /#9/.test(q) ? 3 : 2;
  const thirteenth = /b13|alt/.test(q) ? 8 : 9;
  const scale = Q === 'min' ? [0, 2, 3, 5, 7, 9, 10] : Q === 'hd' ? [0, 1, 3, 5, 6, 8, 10] : Q === 'dim' ? [0, 2, 3, 5, 6, 8, 9, 11]
    : Q === 'dom' ? (/alt|b9|#9/.test(q) ? [0, 1, 3, 4, 6, 8, 10] : [0, 2, 4, 5, 7, 9, 10]) : Q === 'sus' ? [0, 2, 5, 7, 9, 10] : [0, 2, 4, 6, 7, 9, 11];
  return {root: c.root, bass: c.bass != null ? c.bass : c.root, third, fifth, seventh, ninth, thirteenth, scale};
}
const pcOf = m => ((m % 12) + 12) % 12;
const inRange = (pc, lo, hi, near) => { let best = null; for(let m = lo; m <= hi; m++) if(pcOf(m) === pcOf(pc)){ if(best == null || Math.abs(m - near) < Math.abs(best - near)) best = m; } return best; };

/* ============================================================
   THE PERFORMANCE: events and the truth
   ============================================================ */
/**
 * @param {object} chart — syncUnrollChart output: {bars:[{beats, chords:[{root, bass, quality, q, beats, at}]}], beats}
 * @param {object} plan  — {seed, bpm, choruses, heads, style: 'swing'|'ballad', swing, drift, rubato: ['first','middle','last'],
 *   intro: {type, bars, times, seconds}, ending: {type, seconds, tagBars, tagTimes, cutAt}, transpose, cents, applause,
 *   horns: ['tenor-sax'] | ['trumpet','tenor-sax'], comp: 'piano'|'vibraphone', twoFeel}
 * @returns {{events, duration, truth}}
 */
function perform(chart, plan){
  const R = rng(plan.seed || 1);
  const beatsIn = b => Math.round(b.beats || chart.beats || 4);
  const bpc = chart.bars.reduce((a, b) => a + beatsIn(b), 0);
  const perBeat = [];
  chart.bars.forEach((b, m) => { const n = beatsIn(b);
    for(let k = 0; k < n; k++){ const c = b.chords.find(x => k >= x.at - 1e-9 && k < x.at + x.beats - 1e-9) || (perBeat.length ? perBeat[perBeat.length - 1].chord : b.chords[0]);
      perBeat.push({m, k, n, chord: c, first: k === 0, change: !perBeat.length || perBeat[perBeat.length - 1].chord !== c}); } });
  const firstChord = (perBeat.find(x => x.chord) || {}).chord || {root: 0, quality: 'maj'};
  perBeat.forEach(x => { if(!x.chord) x.chord = firstChord; });
  const shapes = perBeat.map(x => chordShape(x.chord));
  const T = plan.transpose || 0, cents = plan.cents || 0;
  const ev = [];
  const pitch = m => m + T + cents / 100;
  const note = (inst, t, dur, midi, vel, o = {}) => ev.push(Object.assign({inst, t, dur, midi: pitch(midi), vel}, o));
  const hit = (inst, t, vel, o = {}) => ev.push(Object.assign({inst, t, vel, hit: true}, o));

  /* ---- the grid ---- */
  const beats = [];
  let t = 0.6 + R() * 0.5, drift = 1;
  const base = plan.bpm;
  const beatDur = (rub, phraseEnd) => {
    let d = 60 / (base * drift);
    if(rub){ d *= 1 + 0.16 * Math.sin(t * 0.9 + (plan.seed || 1)) + 0.08 * Math.sin(t * 2.3); if(phraseEnd) d *= 1.25; }
    return d;
  };
  const per = chart.beats || 4;
  const intro = plan.intro || {type: 'none'};
  if(intro.type === 'drums'){
    for(let q = 0; q < (intro.bars || 2) * per; q++){ beats.push({t, kind: 'count', j: -1, k: q % per}); t += beatDur(false); }
  } else if(intro.type === 'vamp'){
    const vb = (intro.bars || 4) * per;
    for(let q = 0; q < vb * (intro.times || 2); q++){ beats.push({t, kind: 'vamp', j: bpc - vb + (q % vb)}); t += beatDur(false); }
  } else if(intro.type === 'rubato'){
    const n = 6, secs = intro.seconds || 8;
    for(let q = 0; q < n; q++){ beats.push({t, kind: 'free', j: q % 2 ? bpc - per : 0, dur: secs / n}); t += secs / n; }
  }
  const nCh = plan.choruses, heads = plan.heads || 1;
  const choruses = [];
  for(let c = 0; c < nCh; c++){
    const type = c < heads || c >= nCh - heads ? 'head' : 'solo';
    const rub = (plan.rubato || []).includes(c === 0 ? 'first' : c === nCh - 1 ? 'last' : 'middle');
    const ch = {type, rubato: rub, beats: []};
    for(let j = 0; j < bpc; j++){
      if(perBeat[j].first && !rub){ drift *= 1 + (R() - 0.5) * (plan.drift || 0.012); drift = Math.max(0.94, Math.min(1.06, drift)); }
      const phraseEnd = rub && (perBeat[j].m % 4 === 3) && perBeat[j].k >= perBeat[j].n - 2;
      let d = beatDur(rub, phraseEnd);
      if(c === nCh - 1 && plan.ending && plan.ending.type !== 'fade' && j >= bpc - 8) d *= 1 + 0.03 * (j - (bpc - 8));
      ch.beats.push(t); beats.push({t, kind: 'chorus', chorus: c, j, rubato: rub, type}); t += d;
    }
    choruses.push(ch);
  }
  const formEnd = t;
  const ending = plan.ending || {type: 'fermata'};
  if(ending.type === 'tag'){
    const tb = (ending.tagBars || 4) * per;
    for(let r = 0; r < (ending.tagTimes || 2); r++) for(let q = 0; q < tb; q++){ beats.push({t, kind: 'tag', j: bpc - tb + q}); t += beatDur(false) * (1 + 0.02 * r); }
  }
  const fermataAt = t;
  const lastStart = choruses[nCh - 1].beats[0];
  const cutAt = ending.type === 'fade' ? lastStart + (ending.cutAt || 0.6) * (formEnd - lastStart) : Infinity;
  const holdSecs = ending.type === 'fade' ? 0 : (ending.seconds || 4);
  const applause = plan.applause ? 3 : 0;
  const duration = (ending.type === 'fade' ? cutAt : fermataAt + holdSecs) + applause + 0.8;

  /* ---- the players ---- */
  const J = () => (R() - 0.5) * 0.024;
  const style = plan.style || 'swing';
  const sw = plan.swing || 0.64;
  const horns = plan.horns || ['tenor-sax'];
  const comp = plan.comp || 'piano';
  const hornRange = {'tenor-sax': [46, 76], 'trumpet': [55, 82], 'trombone': [41, 65]};
  let bassNote = 40, hornNote = 64, soloist = 0;
  const hornInst = (h, dur, rub) => h === 'tenor-sax' ? (dur < 0.22 ? 'tenor-sax-stac' : rub && dur > 0.8 ? 'tenor-sax-vib' : 'tenor-sax')
    : h === 'trumpet' ? (dur < 0.22 ? 'trumpet-stac' : 'trumpet') : h === 'trombone' ? (dur < 0.22 ? 'trombone-stac' : 'trombone') : h;
  beats.forEach((b, idx) => {
    const next = beats[idx + 1], bt = next ? next.t - b.t : 60 / base;
    if(b.t >= cutAt) return;
    if(b.kind === 'count'){
      hit('ride', b.t + J(), 0.55, {pan: 0.35});
      if(b.k % 2 === 1) hit('hihat-pedal', b.t + J(), 0.7, {pan: -0.3});
      if(b.k === per - 1) hit('snare', b.t + J(), 0.7);
      return;
    }
    const j = b.j, pb = perBeat[j], sh = shapes[j], chordStart = pb.change || pb.first;
    const rub = b.rubato || b.kind === 'free';
    const drums = b.kind !== 'free' && !(b.kind === 'chorus' && rub);
    /* bass */
    if(b.kind !== 'free' && !(rub && style === 'ballad')){
      const two = style === 'ballad' || (plan.twoFeel && b.chorus === 0);
      if(!two || pb.k % 2 === 0){
        let target;
        const nj = (j + 1) % perBeat.length, nsh = shapes[nj], nextChange = perBeat[nj].change;
        if(chordStart || pb.k === 0) target = inRange(sh.bass, 31, 52, bassNote);
        else if(nextChange && R() < 0.55) target = inRange(nsh.bass, 31, 52, bassNote) + (R() < 0.5 ? 1 : -1);
        else { const iv = [sh.third, sh.fifth, sh.seventh, sh.scale[1 + Math.floor(R() * (sh.scale.length - 1))]][Math.floor(R() * 4)];
          target = inRange(sh.root + iv, 31, 52, bassNote + (R() < 0.5 ? 2 : -2)); }
        bassNote = target;
        note('bass-pizz', b.t + J(), bt * (two ? 1.9 : 0.95), target, 0.55 + 0.25 * R() + (pb.k === 0 ? 0.1 : 0), {line: 'bass'});
      }
    } else if(pb.k === 0 || chordStart){
      /* a free intro or rubato head: the piano's left hand has the bass */
      note('piano', b.t + (b.kind === 'free' ? 0 : J()), (b.dur || bt) * 2.2, inRange(sh.bass, 36, 50, 43), 0.5);
    }
    /* comping */
    const voicing = (s2, lo) => [s2.third, s2.seventh, R() < 0.6 ? s2.ninth : s2.fifth, R() < 0.5 ? s2.thirteenth : s2.fifth]
      .concat(R() < 0.25 ? [0] : []).map((iv, k) => inRange(s2.root + iv, lo + (k % 2) * 2, 74, 60 + k * 3));
    if(rub){
      if(pb.k === 0 || chordStart){ voicing(sh, 52).forEach((m, k) => note(comp, b.t + k * 0.035 + Math.abs(J()), (b.dur || bt) * 2.4, m, 0.35 + 0.1 * R())); }
    } else if(pb.k === 0){
      const pat = Math.floor(R() * 5);
      const hits = pat === 0 ? [0] : pat === 1 ? [0, 1 + sw] : pat === 2 ? [1 + sw, 3] : pat === 3 ? [0, 2] : [pb.n - 1 + sw];
      hits.forEach(h => {
        const push = h >= pb.n - 1 + sw - 1e-6;
        const s2 = push ? shapes[(j + pb.n) % perBeat.length] : shapes[Math.min(perBeat.length - 1, j + Math.floor(h))] || sh;
        const v = [s2.third, s2.seventh, R() < 0.6 ? s2.ninth : s2.fifth].map((iv, k) => inRange(s2.root + iv, 53, 72, 58 + k * 4));
        const at = b.t + h * bt + J(), vel = 0.28 + 0.2 * R();
        v.forEach(m => note(comp, at, bt * (h < 1 ? 1.3 : push ? 1.6 : 0.7), m, vel));
      });
    }
    /* horns */
    if(b.kind === 'chorus'){
      if(b.type === 'head'){
        if(R() < 0.8){
          const pick = pb.k === 0 ? [sh.third, sh.seventh, sh.fifth, 0] : sh.scale;
          const iv = pick[Math.floor(R() * pick.length)];
          const [lo, hi] = hornRange[horns[0]] || [55, 79];
          hornNote = inRange(sh.root + iv, lo + 8, hi - 2, hornNote + (R() < 0.5 ? 3 : -3));
          const long = R() < 0.4 ? 2 : 1, dur = bt * long * 0.92;
          const at = b.t + J();
          horns.forEach((h, k) => note(hornInst(h, dur, rub), at + k * 0.006, dur, hornNote - 12 * k, rub ? 0.55 : 0.7, {line: 'horn' + k, pan: 0.3 - 0.5 * k}));
        }
      } else {
        const h = horns[soloist % horns.length];
        const [lo, hi] = hornRange[h] || [55, 79];
        for(let e = 0; e < 2; e++){
          if(R() < 0.14) continue;
          let iv;
          const r = R();
          if(e === 0 && pb.k === 0 && r < 0.6) iv = [sh.third, sh.seventh, sh.fifth, 0][Math.floor(R() * 4)];
          else if(r < 0.12) iv = null;
          else iv = sh.scale[Math.floor(R() * sh.scale.length)];
          let m;
          if(iv == null) m = hornNote + (R() < 0.5 ? 1 : -1);
          else {
            const s2 = e === 1 && pb.k === pb.n - 1 && R() < 0.3 ? shapes[(j + 1) % perBeat.length] : sh;
            m = inRange(s2.root + (s2 === sh ? iv : s2.third), lo, hi, hornNote + (R() < 0.5 ? 2 : -2));
          }
          hornNote = Math.max(lo, Math.min(hi, m));
          const at = b.t + (e ? sw * bt : 0) + J(), dur = bt * (e ? 1 - sw : sw) * 0.95;
          note(hornInst(h, dur, rub), at, dur, hornNote, 0.55 + 0.25 * R(), {line: 'solo', pan: 0.25});
        }
        if(j === bpc - 1) soloist++;
      }
    }
    /* drums */
    if(drums && b.kind !== 'free'){
      if(style === 'ballad'){
        if(pb.k % 2 === 0) hit('brush-stir', b.t + J(), 0.55 + 0.2 * R(), {pan: -0.1});
        if(pb.k % 2 === 1) hit('brush-tap', b.t + J(), 0.5 + 0.2 * R(), {pan: -0.1});
        if(pb.k === 0 && pb.m % 4 === 0 && R() < 0.3) hit('ride', b.t + J(), 0.3, {pan: 0.35});
      } else {
        hit(plan.ride || 'ride', b.t + J(), 0.55 + 0.25 * R() + (pb.k % 2 ? 0.1 : 0), {pan: 0.35});
        if(pb.k % 2 === 1){ hit('hihat-pedal', b.t + J(), 0.65, {pan: -0.3}); hit(plan.ride || 'ride', b.t + sw * bt + J(), 0.35 + 0.2 * R(), {pan: 0.35}); }
        hit('kick', b.t + J(), 0.18 + 0.08 * R());
        if(R() < 0.16) hit(R() < 0.6 ? 'snare-ghost' : 'snare', b.t + sw * bt + J(), 0.25 + 0.3 * R(), {pan: -0.05});
        if(b.kind === 'chorus' && j === 0 && b.chorus > 0 && R() < 0.5) hit('crash', b.t + J(), 0.45, {pan: -0.4});
      }
    }
  });
  /* the held last chord */
  if(ending.type !== 'fade'){
    const sh = shapes[0], root = inRange(sh.root, 31, 45, 38);
    note('bass-pizz', fermataAt, holdSecs, root, 0.8);
    [sh.third, sh.seventh, sh.ninth, sh.fifth].forEach((iv, k) => note(comp, fermataAt + k * 0.05, holdSecs * 0.85, inRange(sh.root + iv, 55, 74, 62 + k * 3), 0.5));
    horns.forEach((h, k) => note(h === 'tenor-sax' ? 'tenor-sax-vib' : h, fermataAt + 0.05, holdSecs * 0.8, inRange(sh.root + sh.ninth, 62, 76, 70) - 12 * k, 0.6));
    if(style !== 'ballad'){ hit('crash', fermataAt, 0.7, {pan: -0.4}); for(let q = 0; q < 8; q++) hit('ride', fermataAt + 0.1 + q * 0.09, 0.35 - q * 0.03, {pan: 0.35}); }
    else hit('brush-stir', fermataAt, 0.6);
  }
  if(applause){
    const a0 = ending.type === 'fade' ? cutAt : fermataAt + holdSecs;
    ev.push({inst: '@applause', t: a0, dur: applause, vel: 0.5, hit: true});
  }
  if(ending.type === 'fade') ev.push({inst: '@fade', t: Math.max(0, cutAt - 8), dur: 8, hit: true});
  const heard = cutAt;
  return {events: ev.filter(e => e.t < duration), duration, truth: {
    duration, beatsPerChorus: bpc, transpose: T, cents,
    formStart: choruses[0].beats[0], formEnd: Math.min(formEnd, heard),
    choruses: choruses.map(c => ({type: c.type, rubato: c.rubato, beats: c.beats.filter(x => x < heard)})),
    barStarts: chart.bars.reduce((a, b, i) => (a.push(i ? a[i - 1] + beatsIn(chart.bars[i - 1]) : 0), a), []),
  }};
}

/* ============================================================
   A SCORE, PLAYED: a MusicXML timeline with human rubato
   ============================================================ */
/* The instruments for each part, by the part's position in a quartet
   texture (first violin, second, viola, cello). In the orchestra each part
   is doubled the way an arranger would: the tune in violins and flute,
   the second violins with oboe, violas with clarinet (and horn on the
   long notes), the bass in cellos, basses an octave down, and bassoon. */
const QUARTET = [[{inst: 'violin-solo', pan: -0.45}], [{inst: 'violin-solo', pan: -0.15, cents: 6, lag: 0.006}], [{inst: 'violas', pan: 0.15, gain: 0.9}], [{inst: 'celli', pan: 0.45}]];
const ORCHESTRA = [
  [{inst: 'violins', pan: -0.45}, {inst: 'flute', pan: -0.05, gain: 0.6, lo: 60}],
  [{inst: 'violins', pan: -0.2, gain: 0.85}, {inst: 'oboe', pan: 0.05, gain: 0.55, lo: 58}],
  [{inst: 'violas', pan: 0.15}, {inst: 'clarinet', pan: 0.1, gain: 0.55, lo: 50}, {inst: 'horn', pan: 0.3, gain: 0.45, longOnly: 0.9}],
  [{inst: 'celli', pan: 0.35}, {inst: 'basses', pan: 0.45, octave: -1, gain: 0.8, lo: 28}, {inst: 'bassoon', pan: 0.2, gain: 0.5, lo: 34}]];
/**
 * @param {object} tl — musicXmlTimeline output (events in performance order, q in quarters)
 * @param {object} plan — {seed, bpm, ensemble: 'quartet'|'orchestra', phrase (bars), rubato (0–1), cents, transpose}
 * @returns {{events, duration, truth: {barTimes, order, beatTimes}}}
 */
function performScore(tl, plan){
  const R = rng(plan.seed || 1);
  const order = tl.order, lens = order.map(k => (tl.measures[k] && tl.measures[k].len) || 4);
  const barQ = []; let q = 0; lens.forEach(l => { barQ.push(q); q += l; });
  const totalQ = q;
  /* the tempo, a quarter at a time */
  const nQ = Math.ceil(totalQ) + 2, qd = new Float64Array(nQ);
  const base = 60 / (plan.bpm || tl.bpm || 96), phrase = plan.phrase || 4, rub = plan.rubato == null ? 1 : plan.rubato;
  let drift = 1;
  for(let i = 0; i < nQ; i++){
    let bar = 0; while(bar + 1 < barQ.length && barQ[bar + 1] <= i) bar++;
    const inBar = (i - barQ[bar]) / lens[bar], pos = ((bar % phrase) + inBar) / phrase;
    if(i % 4 === 0){ drift *= 1 + (R() - 0.5) * 0.03 * rub; drift = Math.max(0.9, Math.min(1.1, drift)); }
    /* a little faster into the middle of a phrase, broadening at its end;
       more at the end of a section of two phrases, most at the very end */
    let f = drift * (1 - 0.05 * rub * Math.sin(Math.PI * pos));
    const lastBarOfPhrase = bar % phrase === phrase - 1, lastBarOfSection = bar % (2 * phrase) === 2 * phrase - 1;
    if(lastBarOfPhrase && inBar >= 0.5) f *= 1 + rub * (lastBarOfSection ? 0.28 : 0.14) * (inBar - 0.4) * 2;
    if(bar >= order.length - 2) f *= 1 + rub * 0.25 * (bar - (order.length - 2) + inBar);
    qd[i] = base * f;
  }
  const at = new Float64Array(nQ + 1); for(let i = 0; i < nQ; i++) at[i + 1] = at[i] + qd[i];
  const T0 = 0.8 + R() * 0.4;
  const time = x => { const i = Math.max(0, Math.min(nQ - 1, Math.floor(x))); return T0 + at[i] + (x - i) * qd[i]; };
  /* the notes */
  const scheme = plan.ensemble === 'orchestra' ? ORCHESTRA : QUARTET;
  const T = plan.transpose || 0, cents = plan.cents || 0;
  const ev = [];
  const pj = tl.parts.map((_, pi) => (pi === 0 ? -0.004 : pi === tl.parts.length - 1 ? 0.006 : 0));
  (tl.events || []).forEach(e => {
    if(e.chord || e.perc || e.midi == null) return;
    const roles = scheme[Math.min(scheme.length - 1, e.part)] || scheme[0];
    const t = time(e.q) + pj[e.part] + (R() - 0.5) * 0.016;
    const end = time(e.q + (e.held || e.d));
    const dur = Math.max(0.06, (end - t) * 0.96);
    /* the dynamic: the score's, swelling to the middle of each phrase */
    let bar = 0; while(bar + 1 < barQ.length && barQ[bar + 1] <= e.q) bar++;
    const pos = ((bar % phrase) + (e.q - barQ[bar]) / lens[bar]) / phrase;
    const vel = Math.max(0.15, Math.min(1, (e.vel || 0.55) * (0.85 + 0.3 * Math.sin(Math.PI * pos)) + (R() - 0.5) * 0.08));
    roles.forEach(r => {
      if(r.longOnly && dur < r.longOnly) return;
      let m = e.midi + T + 12 * (r.octave || 0);
      if(r.lo && m < r.lo) return;
      let inst = r.inst;
      if(dur < 0.2 && /^violin/.test(inst)) inst = 'violins-spic';
      ev.push({inst, t: t + (r.lag || 0), dur, midi: m + (cents + (r.cents || 0)) / 100, vel: vel * (r.gain || 1), pan: r.pan});
    });
  });
  const beatTimes = []; for(let i = 0; i <= Math.floor(totalQ); i++) beatTimes.push(time(i));
  const duration = time(totalQ) + 3.5;
  return {events: ev, duration, truth: {barTimes: barQ.map(time), order: order.slice(), beatTimes, endTime: time(totalQ)}};
}

/* ============================================================
   THE SOUND: events → stereo audio, from the samples
   ============================================================ */
const PANS = {'bass-pizz': 0, piano: -0.2, vibraphone: -0.25, 'tenor-sax': 0.25, trumpet: 0.3, trombone: 0.35};
const SUSTAINED = /^(tenor-sax|trumpet|trombone|violins|violin-solo|violas|celli|basses|flute|oboe|clarinet|bassoon|horn|tuba|piccolo|organ)(?!.*-(stac|pizz|spic))/;
/**
 * @param {object} bank — {inst: {kind, notes:[{midi, layer, tune, pcm}], hits:[{layer, rr, pcm}], layers}} at `sr`
 * @param {Array} events — from perform()
 * @param {{sr, duration, seed, reverb}} o
 * @returns {{left: Float32Array, right: Float32Array, mono: Float32Array, sr}}
 */
function render(bank, events, o){
  const sr = o.sr, n = Math.ceil(o.duration * sr), R = rng((o.seed || 1) * 7 + 3);
  const L = new Float32Array(n), Rt = new Float32Array(n);
  const rrNext = {};
  /* the lines: a note is cut when the next of its line begins */
  const byLine = {};
  events.forEach(e => { if(e.line){ (byLine[e.line] = byLine[e.line] || []).push(e); } });
  Object.values(byLine).forEach(list => { list.sort((a, b) => a.t - b.t); for(let i = 0; i + 1 < list.length; i++) list[i].cut = list[i + 1].t + 0.03; });
  const add = (pcm, rate, t0, gain, pan, cutAt, sustainLen) => {
    const i0 = Math.round(t0 * sr);
    const need = Math.round((cutAt != null ? cutAt - t0 : pcm.length / rate / sr + 1) * sr);
    const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    const len = pcm.length;
    /* looping a held note longer than its recording: the middle of its
       sustain, crossfaded into itself */
    const loopA = Math.floor(len * 0.45), loopB = Math.floor(len * 0.85), span = loopB - loopA;
    const xf = Math.min(Math.floor(0.08 * sr), Math.floor(span / 3));
    const canLoop = !!sustainLen && span > 2 * xf && need * rate > len - 2;
    const rel = Math.round(0.09 * sr);
    let pos = 0;
    for(let k = 0; k < need && i0 + k < n; k++){
      if(canLoop){ while(pos >= loopB) pos -= span; }
      else if(pos >= len - 2) break;
      if(i0 + k >= 0){
        let v;
        if(canLoop && pos > loopB - xf){ const w = (pos - (loopB - xf)) / xf; v = sample(pcm, pos) * (1 - w) + sample(pcm, pos - span) * w; }
        else v = sample(pcm, pos);
        let env = 1;
        if(cutAt != null){ const left = need - k; if(left < rel) env = left / rel; }
        L[i0 + k] += v * gl * env; Rt[i0 + k] += v * gr * env;
      }
      pos += rate;
    }
  };
  function sample(pcm, p){ const i = Math.floor(p), f = p - i; const a = pcm[i] || 0, b = pcm[i + 1] || 0; return a + (b - a) * f; }
  for(const e of events){
    if(e.inst === '@applause'){
      for(let q = 0; q < 380; q++){ const t0 = e.t + R() * e.dur, i0 = Math.round(t0 * sr), len = Math.round(0.02 * sr), g = 0.05 * (0.4 + R());
        for(let k = 0; k < len && i0 + k < n; k++){ const v = (R() * 2 - 1) * g * Math.exp(-k / (0.006 * sr)); const pn = R(); L[i0 + k] += v * (1 - pn); Rt[i0 + k] += v * pn; } }
      continue;
    }
    if(e.inst === '@fade') continue;
    const inst = bank[e.inst];
    if(!inst) continue;
    const pan = e.pan != null ? e.pan : (PANS[e.inst.replace(/-(stac|vib|harmon)$/, '')] || 0);
    if(e.hit || inst.kind === 'hits'){
      const layers = inst.layers || 1, li = Math.min(layers - 1, Math.floor((e.vel || 0.5) * layers));
      const pool = inst.hits.filter(h => h.layer === li);
      const key = e.inst + ':' + li; rrNext[key] = ((rrNext[key] || 0) + 1 + Math.floor(R() * 2)) % Math.max(1, pool.length);
      const h = pool[rrNext[key]] || inst.hits[0];
      const g = 0.35 + 0.65 * (e.vel || 0.5);
      add(h.pcm, 1, e.t, g * (inst.gain || 1), pan, null, 0);
      continue;
    }
    /* pitched: the layer for the velocity, the nearest note, its own tuning */
    const layers = inst.layers || 1, li = layers > 1 && e.vel > 0.62 ? layers - 1 : 0;
    let best = null, bd = Infinity;
    for(const s of inst.notes){ const d = Math.abs(s.midi - e.midi) + (s.layer === li ? 0 : 3); if(d < bd){ bd = d; best = s; } }
    if(!best) continue;
    const rate = Math.pow(2, (e.midi - (best.midi + best.tune / 100)) / 12);
    const sustained = SUSTAINED.test(e.inst);
    const end = e.cut != null ? Math.min(e.t + e.dur + (sustained ? 0.05 : 0.6), e.cut) : e.t + e.dur + (sustained ? 0.08 : e.inst === 'piano' || e.inst === 'vibraphone' ? 0.25 : 0.6);
    const g = (0.25 + 0.75 * Math.pow(e.vel || 0.5, 1.3)) * (layers > 1 && li === 0 && e.vel > 0.62 ? 1.2 : 1);
    add(best.pcm, rate, e.t, g * (inst.gain || 1), pan, end, sustained ? 1 : 0);
  }
  /* the fade */
  const fade = events.find(e => e.inst === '@fade');
  if(fade){ const a = Math.round(fade.t * sr), b = Math.round((fade.t + fade.dur) * sr);
    for(let i = a; i < n; i++){ const g = i < b ? 1 - (i - a) / (b - a) : 0; L[i] *= g; Rt[i] *= g; } }
  /* the room */
  freeverb(L, Rt, sr, o.reverb == null ? 0.16 : o.reverb);
  /* a noise floor, then a soft limiter */
  let pk = 0;
  for(let i = 0; i < n; i++){ L[i] += (R() - 0.5) * 3e-4; Rt[i] += (R() - 0.5) * 3e-4; pk = Math.max(pk, Math.abs(L[i]), Math.abs(Rt[i])); }
  const pre = 1.6 / (pk || 1);
  const mono = new Float32Array(n);
  for(let i = 0; i < n; i++){ L[i] = 0.72 * Math.tanh(L[i] * pre); Rt[i] = 0.72 * Math.tanh(Rt[i] * pre); mono[i] = 0.5 * (L[i] + Rt[i]); }
  return {left: L, right: Rt, mono, sr};
}
/* Freeverb (Jezar): eight combs and four allpasses a side */
function freeverb(L, R, sr, wet){
  if(!wet) return;
  const sc = sr / 44100, spread = 23;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], apT = [556, 441, 341, 225];
  const mk = (len) => ({b: new Float32Array(Math.max(2, Math.round(len * sc))), i: 0, f: 0});
  const side = off => ({c: combT.map(x => mk(x + off)), a: apT.map(x => mk(x + off))});
  const S = [side(0), side(spread)];
  const fb = 0.84, damp = 0.25, g = 0.015;
  for(let n = 0; n < L.length; n++){
    const inp = (L[n] + R[n]) * g;
    for(let s = 0; s < 2; s++){
      let out = 0;
      for(const c of S[s].c){ const y = c.b[c.i]; c.f = y * (1 - damp) + c.f * damp; c.b[c.i] = inp + c.f * fb; if(++c.i >= c.b.length) c.i = 0; out += y; }
      for(const a of S[s].a){ const y = a.b[a.i]; a.b[a.i] = out + y * 0.5; if(++a.i >= a.b.length) a.i = 0; out = y - out; }
      if(s === 0) L[n] += out * wet * 3; else R[n] += out * wet * 3;
    }
  }
}

const api = {perform, performScore, render, rng, chordShape};
if(typeof module !== 'undefined' && module.exports) module.exports = api;
else root.syncBand = api;
})(typeof window !== 'undefined' ? window : this);
