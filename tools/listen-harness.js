#!/usr/bin/env node
/* ============================================================
   listen-harness — how well the Verify Engine hears a piano.

   The engine (src/19-listen-a-dsp.js) is loaded as it is, and fed piano
   played from real recordings of real pianos: the Salamander grand the
   site already carries (vendor/salamander) and, as a second instrument
   with a different sound, the piano in vendor/orchestra. Each note is the
   nearest recorded key moved to pitch, at its velocity, with its damper
   when the key comes up — or the pedal, when the pedal is down — and the
   whole thing goes through a small room (a reverb) and a little room noise,
   because a phone on a music desk hears a room, not a line out.

   Two sets:

   A. VOICINGS. Hundreds of 2–5 note voicings in the middle of the
      keyboard (shells, closed and drop-2 four-note chords, five-note
      spreads), a chord a second, some under the pedal so the last one is
      still ringing. Half the time the exercise asks for exactly what was
      played; the rest of the time it asks for something slightly
      different — one note a semitone off, one note fewer, one note more —
      and the right answer is "not yet". The score is the share of
      pass/fail decisions that were right, at Standard strictness.

   B. REPERTOIRE. The opening of each ASAP performance (a pianist's actual
      key presses and pedalling, from tools/sync-testset), with the engine
      told, a moment before each chord, which notes that chord has — as an
      exercise would. Note-level precision, recall and F1 with a ±50 ms
      onset tolerance, split by register (bass below C3, middle to C5,
      treble above) and by whether the pedal was down. And the same audio
      with no expectations at all, as a baseline for plain transcription.

   Latency is what it would be live: how long after the onset the look is
   taken, plus one hop for the onset to be recognised, plus the measured
   time the arithmetic takes.

   Run: node tools/listen-harness.js [--quick] [--json out.json]
   Needs an ffmpeg (imageio-ffmpeg's, or one on the PATH) to unpack the
   samples; they are cached in the system's temp directory.
   ============================================================ */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const LD = require(path.join(ROOT, 'src', '19-listen-a-dsp.js'));
const midiRead = require(path.join(ROOT, 'tools', 'midi-read.js'));
const SR = 44100;
const ARGS = process.argv.slice(2);
const QUICK = ARGS.includes('--quick');
const JSON_OUT = ARGS.includes('--json') ? ARGS[ARGS.indexOf('--json') + 1] : null;
const CACHE = path.join(os.tmpdir(), 'listen-harness-cache');
fs.mkdirSync(CACHE, {recursive: true});
let FF = 'ffmpeg';
try { FF = cp.execSync('python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim() || FF; } catch(e){}

/* ---------- a seeded random, so a run is repeatable ---------- */
let seed = 20260926;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];

/* ---------- the pianos ---------- */
function decode(file){
  const key = path.join(CACHE, file.replace(/[\/\\:]/g, '_') + '.f32');
  if(!fs.existsSync(key)) cp.execFileSync(FF, ['-v', 'error', '-y', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', key]);
  const b = fs.readFileSync(key);
  const x = new Float32Array(b.buffer, b.byteOffset, b.length / 4).slice();
  /* an mp3 starts with the encoder's own silence (about 25 ms); a key
     does not, and the truth would be late by that much */
  let peak = 0; for(let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  let s = 0; while(s < x.length && Math.abs(x[s]) < peak * 0.003) s++;
  return x.subarray(Math.max(0, s - Math.round(0.001 * SR)));
}
const NAME_PC = {C: 0, Cs: 1, Ds: 3, D: 2, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11};
function salamander(){
  const dir = path.join(ROOT, 'vendor', 'salamander'), keys = new Map();
  fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).forEach(f => {
    const m = f.match(/^([A-G]s?)(\d)\.mp3$/); if(!m) return;
    keys.set(12 * (+m[2] + 1) + NAME_PC[m[1]], decode(path.join(dir, f)));
  });
  return {name: 'Salamander grand (Yamaha C5)', keys, layers: null, lo: 21, hi: 108};
}
function orchestraPiano(){
  const dir = path.join(ROOT, 'vendor', 'orchestra');
  const idx = JSON.parse(fs.readFileSync(path.join(dir, 'instruments.json'), 'utf8')).instruments.piano;
  if(!idx) return null;
  const keys = new Map(), layers = new Map();
  (idx.notes || []).forEach(n => {
    if(n.rr) return;
    const pcm = decode(path.join(dir, n.file));
    if(!layers.has(n.midi)) layers.set(n.midi, []);
    layers.get(n.midi).push({layer: n.layer || 0, pcm, tune: n.tune || 0});
  });
  layers.forEach((ls, m) => { ls.sort((a, b) => a.layer - b.layer); keys.set(m, ls[ls.length - 1].pcm); });
  /* its lowest recorded key is B♭1; below that a note would be a stretched
     copy, not a piano, so the tests keep to what was recorded */
  const ks = [...keys.keys()];
  return {name: 'Steinway B (VCSL)', keys, layers, lo: Math.min(...ks), hi: Math.max(...ks) + 2};
}

/* one note into the mix: the nearest recorded key, moved to pitch */
function addNote(out, piano, midi, t, held, vel){
  let k = null;
  for(const x of piano.keys.keys()) if(k == null || Math.abs(x - midi) < Math.abs(k - midi)) k = x;
  let src = piano.keys.get(k), tune = 0;
  if(piano.layers){ const ls = piano.layers.get(k); const L = ls[Math.min(ls.length - 1, Math.floor(vel * ls.length))]; src = L.pcm; tune = L.tune || 0; }
  const rate = Math.pow(2, (midi - k) / 12 - tune / 1200);
  const gain = 1.1 * Math.pow(Math.max(0.03, vel), 1.35) * 0.35;
  const cutoff = Math.min(18000, 700 + 17500 * Math.pow(vel, 1.6)), a = Math.exp(-2 * Math.PI * cutoff / SR);
  const start = Math.round(t * SR), undamped = midi >= 90, tau = midi < 40 ? 0.07 : 0.045;
  const end = t + Math.max(0.05, held);
  const len = Math.min(Math.floor((src.length - 2) / rate), Math.round((undamped ? 12 : (end - t) + tau * 8) * SR));
  let y = 0;
  for(let i = 0; i < len; i++){
    const o = start + i; if(o >= out.length) break;
    const p = i * rate, j = p | 0, f = p - j;
    const x = src[j] * (1 - f) + src[j + 1] * f;
    y = (1 - a) * x + a * y;
    let g = gain;
    const tt = i / SR + t;
    if(!undamped && tt > end) g *= Math.exp(-(tt - end) / tau);
    out[o] += y * g;
  }
}
/* the room: a small Schroeder reverb, then noise and a trace of mains hum */
function room(x){
  const combs = [1116, 1188, 1277, 1356].map(d => ({d, buf: new Float32Array(d), i: 0, fb: 0.72}));
  const aps = [556, 441].map(d => ({d, buf: new Float32Array(d), i: 0}));
  const out = new Float32Array(x.length);
  for(let n = 0; n < x.length; n++){
    let s = 0;
    for(const c of combs){ const v = c.buf[c.i]; c.buf[c.i] = x[n] + v * c.fb; c.i = (c.i + 1) % c.d; s += v; }
    s *= 0.25;
    for(const ap of aps){ const v = ap.buf[ap.i]; const w = s + v * 0.5; ap.buf[ap.i] = w; ap.i = (ap.i + 1) % ap.d; s = v - 0.5 * w; }
    out[n] = x[n] * 0.85 + s * 0.22;
  }
  let b0 = 0, b1 = 0, b2 = 0;
  for(let n = 0; n < out.length; n++){
    const w = rnd() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913;
    out[n] += (b0 + b1 + b2 + w * 0.1848) * 0.0009 + Math.sin(2 * Math.PI * 50 * n / SR) * 0.0004;
  }
  return out;
}

/* ---------- running the engine over a take ---------- */
function run(audio, schedule, eoBase, aopts){
  const an = LD.ldCreate(SR, aopts || {});
  const got = [];
  let si = 0, ms = 0, evals = 0;
  const CH = 512;
  for(let i = 0; i < audio.length; i += CH){
    const t = i / SR;
    while(schedule && si < schedule.length && schedule[si].at <= t){ an.expect(schedule[si].notes, Object.assign({}, eoBase, schedule[si].eo || {})); si++; }
    const t0 = process.hrtime.bigint();
    const r = an.push(audio.subarray(i, i + CH));
    const dt = Number(process.hrtime.bigint() - t0) / 1e6;
    r.forEach(e => { if(e.type === 'notes'){ got.push(e); evals++; ms += dt; } });
  }
  an.flush().forEach(e => { if(e.type === 'notes') got.push(e); });
  return {got, computeMs: evals ? ms / evals : 0, tuning: an.tuning()};
}

/* ---------- A. voicings ---------- */
function voicing(){
  const kind = pick(['shell', 'shell', 'four', 'drop2', 'five', 'dyad']);
  const root = 48 + Math.floor(rnd() * 22);
  const q = pick([[0, 4, 7, 11], [0, 3, 7, 10], [0, 4, 7, 10], [0, 3, 6, 10], [0, 4, 7, 9], [0, 3, 7, 11]]);
  let ns;
  if(kind === 'dyad') ns = [root, root + q[pick([1, 3])]];
  else if(kind === 'shell') ns = [root, root + q[1] + (rnd() < 0.5 ? 12 : 0), root + q[3]].sort((a, b) => a - b);
  else if(kind === 'four') ns = q.map(x => root + x);
  else if(kind === 'drop2'){ const c = q.map(x => root + 12 + x); c[2] -= 12; ns = c.sort((a, b) => a - b); }
  else ns = [root, root + q[1], root + q[3], root + 14, root + 19 + (rnd() < 0.5 ? 0 : -2)];
  ns = [...new Set(ns)].filter(m => m >= 45 && m <= 88).sort((a, b) => a - b);
  return ns.length >= 2 ? ns : voicing();
}
function setA(piano, n){
  const trials = [], events = [];
  let t = 0.8;
  for(let i = 0; i < n; i++){
    const played = voicing();
    let expected = played.slice(), truth = true, how = 'as asked';
    const r = rnd();
    if(r < 0.2){ const j = Math.floor(rnd() * expected.length); const step = rnd() < 0.5 ? 1 : -1;
      if(!played.includes(expected[j] + step)){ expected[j] += step; truth = false; how = 'one note a semitone off'; } }
    else if(r < 0.35 && expected.length >= 3){ const extraN = expected.length; expected = played.slice(); const add = played[1] + (rnd() < 0.5 ? 1 : 2);
      if(!played.includes(add)){ expected.push(add); expected.sort((a, b) => a - b); truth = false; how = 'a note left out'; } void extraN; }
    else if(r < 0.5 && played.length >= 3){ expected = played.filter((_, j) => j !== 1 + Math.floor(rnd() * (played.length - 2))); truth = false; how = 'a note too many'; }
    const pedal = rnd() < 0.3, vel = 0.35 + rnd() * 0.55, gap = 0.7 + rnd() * 0.6;
    const spread = rnd() < 0.3 ? 0.012 : 0.004;
    played.forEach(m => events.push({t: t + rnd() * spread, midi: m, vel: Math.min(1, vel * (0.85 + rnd() * 0.3)), held: pedal ? gap + 0.9 : gap * (0.6 + rnd() * 0.3)}));
    trials.push({t, played, expected, truth, how, pedal});
    t += gap;
  }
  const audio = new Float32Array(Math.ceil((t + 2) * SR));
  events.forEach(e => addNote(audio, piano, e.midi, e.t, e.held, e.vel));
  const mixed = room(audio);
  const schedule = trials.map(x => ({at: x.t - 0.12, notes: x.expected}));
  const res = run(mixed, schedule, {mode: 'exact', strictness: 'standard'});
  let right = 0, fn = 0, fp = 0, none = 0;
  const byHow = {};
  trials.forEach(x => {
    const ev = res.got.filter(e => Math.abs(e.t - x.t) <= 0.06).sort((a, b) => Math.abs(a.t - x.t) - Math.abs(b.t - x.t))[0];
    const pass = !!(ev && ev.verify && ev.verify.pass);
    if(!ev) none++;
    const ok = pass === x.truth;
    if(ok) right++; else if(x.truth) fn++; else fp++;
    const h = byHow[x.how] = byHow[x.how] || {n: 0, right: 0}; h.n++; if(ok) h.right++;
  });
  return {trials: trials.length, accuracy: right / trials.length, falseFail: fn, falsePass: fp, noOnset: none, byHow, computeMs: res.computeMs, tuning: res.tuning};
}

/* ---------- B. repertoire ---------- */
function steps(notes){
  const out = [];
  notes.forEach(n => { const s = out[out.length - 1]; if(s && n.t - s.t <= 0.035) s.notes.push(n); else out.push({t: n.t, notes: [n]}); });
  return out;
}
const regOf = m => m < 48 ? 'bass' : m <= 72 ? 'middle' : 'treble';
function setB(piano, c, secs){
  const dir = path.join(ROOT, 'tools', 'sync-testset');
  const midi = midiRead.read(fs.readFileSync(path.join(dir, c.performance)));
  const first = midi.notes.length ? midi.notes[0].t : 0;
  const notes = midi.notes.filter(n => n.t - first <= secs).map(n => Object.assign({}, n, {t: n.t - first + 0.6, off: n.off - first + 0.6}));
  const ped = midi.pedal.map(p => ({t: p.t - first + 0.6, down: p.down}));
  const pedalAt = t => { let d = false; for(const p of ped){ if(p.t > t) break; d = p.down; } return d; };
  const evs = midiRead.pianoEvents({notes, pedal: ped, duration: secs + 1});
  const audio = new Float32Array(Math.ceil((secs + 3) * SR));
  evs.forEach(e => addNote(audio, piano, e.midi, e.t, e.dur, e.vel));
  const mixed = room(audio);
  const st = steps(notes);
  const tally = () => ({tp: 0, fn: 0, fp: 0});
  const out = {expect: {all: tally(), reg: {bass: tally(), middle: tally(), treble: tally()}, pedal: {on: tally(), off: tally()}},
               free: {all: tally(), reg: {bass: tally(), middle: tally(), treble: tally()}, pedal: {on: tally(), off: tally()}}, onsetErr: []};
  for(const kind of ['expect', 'free']){
    const schedule = kind === 'expect' ? st.map(s => ({at: s.t - 0.08, notes: s.notes.map(n => n.midi)})) : null;
    const res = run(mixed, schedule, {mode: 'exact', strictness: 'standard'});
    out[kind].computeMs = res.computeMs; out[kind].tuning = res.tuning;
    const T = out[kind];
    const used = new Set();
    /* each played note: was it reported, within ±50 ms of when it was played? */
    notes.forEach(n => {
      const hit = res.got.find((e, ei) => Math.abs(e.t - n.t) <= 0.05 && e.notes.some(x => x.pitch === n.midi) && !used.has(ei + ':' + n.midi));
      const add = (k, g) => { T.all[k]++; T.reg[regOf(n.midi)][k]++; T.pedal[pedalAt(n.t) ? 'on' : 'off'][k]++; void g; };
      if(hit){ used.add(res.got.indexOf(hit) + ':' + n.midi); add('tp'); if(kind === 'expect') out.onsetErr.push(hit.t - n.t); }
      else add('fn');
    });
    /* each reported note that answers no played note is a false one */
    res.got.forEach((e, ei) => e.notes.forEach(x => {
      if(used.has(ei + ':' + x.pitch)) return;
      const near = notes.some(n => n.midi === x.pitch && Math.abs(e.t - n.t) <= 0.05);
      if(near) return;
      T.all.fp++; T.reg[regOf(x.pitch)].fp++; T.pedal[pedalAt(e.t) ? 'on' : 'off'].fp++;
    }));
  }
  /* the chords in the middle of the keyboard, as pass/fail decisions */
  return out;
}
const prf = x => { const p = x.tp + x.fp ? x.tp / (x.tp + x.fp) : 0, r = x.tp + x.fn ? x.tp / (x.tp + x.fn) : 0; return {p, r, f: p + r ? 2 * p * r / (p + r) : 0, n: x.tp + x.fn}; };
const pct = v => (100 * v).toFixed(1) + '%';
const addT = (a, b) => { a.tp += b.tp; a.fn += b.fn; a.fp += b.fp; };

module.exports = {salamander, orchestraPiano, voicing, addNote, room, run, rnd, SR, setA, setB, LD};
if(require.main === module) (async () => {
  const pianos = [salamander(), orchestraPiano()].filter(Boolean);
  const report = {when: new Date().toISOString(), pianos: [], sr: SR};
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'sync-testset', 'manifest.json'), 'utf8'));
  const cases = manifest.cases.filter(c => c.kind === 'asap').slice(0, QUICK ? 3 : 20);
  for(const piano of pianos){
    const P = {name: piano.name};
    const A = setA(piano, QUICK ? 120 : 400);
    P.voicings = A;
    console.log(`\n${piano.name}\n  A. voicings: ${pct(A.accuracy)} right over ${A.trials} (false fails ${A.falseFail}, false passes ${A.falsePass}, no onset ${A.noOnset}) · compute ${A.computeMs.toFixed(1)} ms · tuning read ${A.tuning} ¢`);
    Object.entries(A.byHow).forEach(([k, v]) => console.log(`     ${k.padEnd(26)} ${pct(v.right / v.n)} of ${v.n}`));
    const tot = {expect: {all: {tp: 0, fn: 0, fp: 0}, reg: {}, pedal: {}}, free: {all: {tp: 0, fn: 0, fp: 0}, reg: {}, pedal: {}}};
    ['expect', 'free'].forEach(k => { ['bass', 'middle', 'treble'].forEach(r => tot[k].reg[r] = {tp: 0, fn: 0, fp: 0}); ['on', 'off'].forEach(r => tot[k].pedal[r] = {tp: 0, fn: 0, fp: 0}); });
    const errs = []; let cms = 0;
    P.pieces = [];
    for(const c of cases){
      const B = setB(piano, c, QUICK ? 15 : 30);
      ['expect', 'free'].forEach(k => { addT(tot[k].all, B[k].all); Object.keys(B[k].reg).forEach(r => addT(tot[k].reg[r], B[k].reg[r])); Object.keys(B[k].pedal).forEach(r => addT(tot[k].pedal[r], B[k].pedal[r])); });
      errs.push(...B.onsetErr); cms = Math.max(cms, B.expect.computeMs);
      const e = prf(B.expect.all), f = prf(B.free.all);
      P.pieces.push({id: c.id, expect: e, free: f});
      console.log(`  B. ${c.id.padEnd(18)} told what to expect: F1 ${pct(e.f)} (P ${pct(e.p)} R ${pct(e.r)}, ${e.n} notes) · not told: F1 ${pct(f.f)}`);
    }
    P.repertoire = {expect: {}, free: {}};
    ['expect', 'free'].forEach(k => {
      P.repertoire[k].all = prf(tot[k].all);
      P.repertoire[k].reg = {}; Object.keys(tot[k].reg).forEach(r => P.repertoire[k].reg[r] = prf(tot[k].reg[r]));
      P.repertoire[k].pedal = {}; Object.keys(tot[k].pedal).forEach(r => P.repertoire[k].pedal[r] = prf(tot[k].pedal[r]));
    });
    const me = errs.length ? errs.reduce((s, v) => s + v, 0) / errs.length : 0;
    const mae = errs.length ? errs.reduce((s, v) => s + Math.abs(v), 0) / errs.length : 0;
    P.onset = {meanMs: +(me * 1000).toFixed(1), meanAbsMs: +(mae * 1000).toFixed(1)};
    P.latencyMs = +(105 + 512 / SR * 1000 + cms).toFixed(0);
    console.log(`  all pieces, told: F1 ${pct(P.repertoire.expect.all.f)} · bass ${pct(P.repertoire.expect.reg.bass.f)} middle ${pct(P.repertoire.expect.reg.middle.f)} treble ${pct(P.repertoire.expect.reg.treble.f)} · pedal on ${pct(P.repertoire.expect.pedal.on.f)} off ${pct(P.repertoire.expect.pedal.off.f)}`);
    console.log(`  all pieces, not told: F1 ${pct(P.repertoire.free.all.f)} · onset error mean ${P.onset.meanMs} ms, |mean| ${P.onset.meanAbsMs} ms · latency ≈ ${P.latencyMs} ms`);
    report.pianos.push(P);
  }
  if(JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 1));
})();
