/* tools/sync-accuracy-node — the jazz half of the recording-sync harness, run straight under Node (no browser) for quick iteration on the engine. The full harness, classical and jazz, in the production path, is test-sync-accuracy.js.

   Six tunes, each played by a band on REAL recorded instruments
   (tools/sync-band.js, samples in vendor/orchestra — CC0 libraries, see
   the licence there): double bass, Steinway, tenor saxophone, trumpet,
   a jazz kit with brushes. What makes it hard is in sync-band.js. The
   exact time of every beat is known. The engine is then given nothing
   but the audio and the chart, exactly as it will be in the page, and
   its map is checked bar by bar.

   Reported per tune: key and tuning found; the choruses found against
   the choruses played; intro and ending found; for every downbeat the
   error in milliseconds, with the share inside the targets (±50 ms for
   a head with drums, ±100 ms for rubato and solos); how long it took;
   and the engine's own per-bar confidence beside the true error, so it
   can be seen whether the confidence can be trusted.

   The samples are decoded once with ffmpeg (any ffmpeg; `pip install
   imageio-ffmpeg` gives one) into tools/.cache/.

   Run: node test-sync-accuracy.js [tune-id ...] [--write] [--bars]
   --write puts the per-bar log and the report in docs/sync/, and a
   listening excerpt of each performance in docs/sync/audio/. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const cp = require('child_process');
const band = require('./sync-band.js');
const OUT_SR = 22050;
const ctx = vm.createContext({console, Math, JSON, Date, performance, addEventListener(){}, window: {}, document: {addEventListener(){}}});
for(const f of ['19-jazz-p-tunedb.js', '19-jazz-q-tunes.js', '19-score-play.js', '19-sync-a-map.js', '19-sync-b-engine.js', '19-sync-c-worker.js']){
  try { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, {filename: f}); }
  catch(e){ if(f !== '19-score-play.js') throw e; }
}
const X = s => vm.runInContext(s, ctx);
const engine = X('syncEngineModule()');

/* ---------- the instruments, decoded once ---------- */
function ffmpeg(){
  const ok = p => { try { cp.execFileSync(p, ['-version'], {stdio: 'ignore'}); return p; } catch(e){ return null; } };
  let p = ok('ffmpeg');
  if(!p) try { p = ok(cp.execSync('python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim()); } catch(e){}
  return p;
}
const FF = ffmpeg();
function loadBank(sr){
  const dir = path.join(__dirname, '..', 'vendor', 'orchestra'), idx = JSON.parse(fs.readFileSync(path.join(dir, 'instruments.json'), 'utf8'));
  const cache = path.join(__dirname, '.cache', 'orchestra-' + sr);
  const bank = {};
  for(const [id, e] of Object.entries(idx.instruments)){
    const read = file => {
      const c = path.join(cache, file.replace(/\.mp3$/, '.f32'));
      if(!fs.existsSync(c)){
        if(!FF) throw new Error('ffmpeg is needed once, to decode the samples (pip install imageio-ffmpeg).');
        fs.mkdirSync(path.dirname(c), {recursive: true});
        fs.writeFileSync(c, cp.execFileSync(FF, ['-v', 'error', '-i', path.join(dir, file), '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], {maxBuffer: 1 << 27}));
      }
      const b = fs.readFileSync(c); return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
    };
    bank[id] = {kind: e.kind, layers: e.layers, notes: (e.notes || []).map(n => Object.assign({}, n, {pcm: read(n.file)})),
      hits: (e.hits || []).map(h => Object.assign({}, h, {pcm: read(h.file)}))};
  }
  return bank;
}
let BANK = null;

/* There Will Never Be Another You is in the Real Book's contents but was
   not analysed in the tune database, so its changes are given here, as a
   user would add them (standard changes, in E♭). */
const TWNBAY = {id: 'there-will-never-be-another-you', title: 'There Will Never Be Another You', key: 'Eb', form: 'AB', measures: 32,
  timeSignature: '4/4', tempo: 'Medium Up',
  chordProgression: 'A: EbM7|EbM7|Dm7b5|G7b9|Cm7|Cm7|Bbm7|Eb7|AbM7|Db7|EbM7|Cm7|F7|F7|Fm7|Bb7 ' +
    'B: EbM7|EbM7|Dm7b5|G7b9|Cm7|Cm7|Bbm7|Eb7|AbM7|Db7|EbM7|Am7b5 D7|EbM7 C7|F7 Bb7|EbM7|Fm7 Bb7'};

const CASES = [
  {id: 'autumn-leaves', note: 'medium swing, in G minor (chart in E minor: +3), turnaround vamp intro, tag ending — about five minutes',
    plan: {seed: 11, bpm: 132, choruses: 5, heads: 1, style: 'swing', transpose: 3, cents: 8, intro: {type: 'vamp', bars: 4, times: 2},
      ending: {type: 'tag', tagBars: 4, tagTimes: 2, seconds: 4}, applause: true}},
  {id: 'there-will-never-be-another-you', tune: TWNBAY, note: 'medium up, two-bar drum intro, held last chord',
    plan: {seed: 23, bpm: 184, choruses: 5, heads: 1, style: 'swing', transpose: 0, cents: -12, intro: {type: 'drums', bars: 2}, ending: {type: 'fermata', seconds: 4}}},
  {id: 'au-privave', note: 'bebop blues at 210, head played twice at each end, no intro',
    plan: {seed: 37, bpm: 210, choruses: 10, heads: 2, style: 'swing', transpose: 0, cents: 0, swing: 0.6, intro: {type: 'none'}, ending: {type: 'fermata', seconds: 3}, applause: true, horns: ['trumpet', 'tenor-sax']}},
  {id: 'billies-bounce', note: 'blues at 190 (the database chart, 13 bars as written), heads twice, a bar of drums first, 20 cents sharp',
    plan: {seed: 41, bpm: 190, choruses: 9, heads: 2, style: 'swing', transpose: 0, cents: 20, intro: {type: 'drums', bars: 1}, ending: {type: 'fermata', seconds: 3}}},
  {id: 'my-funny-valentine', note: 'ballad: free piano intro, rubato head (no bass or drums), a chorus in time with brushes, rubato head out, a whole tone down, 30 cents sharp',
    plan: {seed: 53, bpm: 64, choruses: 3, heads: 1, style: 'ballad', rubato: ['first', 'last'], transpose: -2, cents: 30, intro: {type: 'rubato', seconds: 9},
      ending: {type: 'fermata', seconds: 6}, applause: true}},
  {id: 'so-what', note: 'modal, sixteen bars of one chord at a time, free intro, fades out part way through the last chorus, 42 cents sharp',
    plan: {seed: 67, bpm: 136, choruses: 5, heads: 1, style: 'swing', transpose: 0, cents: 42, twoFeel: true, intro: {type: 'rubato', seconds: 10},
      ending: {type: 'fade', cutAt: 0.7}}},
];

function tuneOf(c){ return c.tune || X(`REAL_BOOK_TUNE_DATABASE.find(t => t.id === ${JSON.stringify(c.id)})`); }
const fmt = (x, d = 0) => x == null || isNaN(x) ? '—' : x.toFixed(d);
const pct = (a, n) => n ? Math.round(100 * a / n) + '%' : '—';

function runCase(c){
  const tune = tuneOf(c);
  const u = X(`syncUnrollChart(${JSON.stringify(tune)})`);
  const score = JSON.parse(JSON.stringify(X(`syncScoreFromTune(${JSON.stringify(tune)})`)));
  const t0 = Date.now();
  BANK = BANK || loadBank(OUT_SR);
  const play = band.perform(u, c.plan);
  const audio = band.render(BANK, play.events, {sr: OUT_SR, duration: play.duration, seed: c.plan.seed});
  const perf = {pcm: audio.mono, sr: OUT_SR, truth: play.truth, audio};
  const synthMs = Date.now() - t0;
  const progress = [];
  const t1 = Date.now();
  const r = engine.run(perf.pcm, perf.sr, score, Object.assign({progress: (text) => { if(progress[progress.length - 1] !== text) progress.push(text); }}, process.env.SYNC_OPTS ? JSON.parse(process.env.SYNC_OPTS) : {}));
  const ms = Date.now() - t1;
  const map = X('syncMapNew')({form: r.form, transposition: r.transposition, tuningOffsetCents: r.tuningOffsetCents,
    performanceOrder: r.performanceOrder, syncPoints: r.syncPoints, overallConfidence: r.overallConfidence});
  const s2a = X('scoreToAudioTime');
  const truth = perf.truth;
  const bars = u.measures, barStart = truth.barStarts;
  /* the engine's chorus k is the performance's chorus k */
  const rows = [];
  truth.choruses.forEach((ch, ci) => {
    for(let b = 0; b < bars; b++){
      const tt = ch.beats[barStart[b]];
      if(tt == null) continue;
      const est = ci < r.diagnostics.choruses ? s2a(map, ci + 1, b + 1, 1) : null;
      const pb = r.perBar.find(p => p.chorus === ci + 1 && p.measure === b + 1);
      const rub = ch.rubato, drums = !rub && c.plan.style !== 'ballad';
      const tol = ch.type === 'head' && drums ? 0.05 : 0.1;
      rows.push({chorus: ci + 1, measure: b + 1, type: ch.type, rubato: rub, truth: +tt.toFixed(3), est: est == null ? null : +est.toFixed(3),
        err: est == null ? null : Math.round((est - tt) * 1000), tol: tol * 1000, within: est != null && Math.abs(est - tt) <= tol,
        confidence: pb ? pb.confidence : 0, interpolated: pb ? !!pb.interpolated : false});
    }
  });
  const errs = rows.filter(x => x.err != null).map(x => Math.abs(x.err)).sort((a, b) => a - b);
  const q = p => errs.length ? errs[Math.min(errs.length - 1, Math.floor(p * (errs.length - 1)))] : null;
  const sure = rows.filter(x => x.confidence >= 0.6), unsure = rows.filter(x => x.confidence < 0.6);
  const meanErr = a => { const e = a.filter(x => x.err != null).map(x => Math.abs(x.err)); return e.length ? e.reduce((p, q) => p + q, 0) / e.length : null; };
  const byType = k => rows.filter(x => (k === 'head-drums' ? x.type === 'head' && x.tol === 50 : k === 'rubato' ? x.rubato : x.type === 'solo' && !x.rubato));
  const introT = r.performanceOrder.find(e => e.label === 'Intro');
  const endT = r.performanceOrder.find(e => e.label === 'Ending');
  const pitchErr = (r.transposition * 100 + r.tuningOffsetCents) - (truth.transpose * 100 + truth.cents);
  return {id: c.id, title: tune.title, note: c.note, chart: {how: u.how, measures: u.measures, mismatch: u.mismatch},
    audioSeconds: +perf.truth.duration.toFixed(1), synthMs, engineMs: ms, analyseMs: r.analyseMs, alignMs: r.alignMs,
    key: {found: r.transposition, played: truth.transpose, tuningFound: r.tuningOffsetCents, tuningPlayed: truth.cents,
      pitchErrorCents: Math.round(pitchErr), ok: Math.abs(pitchErr) <= 20},
    structure: {choruses: r.diagnostics.choruses, played: truth.choruses.length,
      introEnd: introT ? introT.audioEnd : 0, formStart: +truth.formStart.toFixed(2), formEnd: +truth.formEnd.toFixed(2),
      endingStart: endT ? endT.audioStart : null, order: r.performanceOrder.map(e => e.label).join(' · ')},
    beat: {mode: r.diagnostics.beatMode ? 'beat grid' : 'rubato (chroma warping)', bpm: r.diagnostics.bpm, confidence: r.diagnostics.beatConfidence},
    errors: {median: q(0.5), p90: q(0.9), max: errs.length ? errs[errs.length - 1] : null, n: errs.length,
      within: pct(rows.filter(x => x.within).length, rows.length),
      headDrums: pct(byType('head-drums').filter(x => x.within).length, byType('head-drums').length),
      solo: pct(byType('solo').filter(x => x.within).length, byType('solo').length),
      rubato: pct(byType('rubato').filter(x => x.within).length, byType('rubato').length)},
    confidence: {overall: r.overallConfidence, sureBars: sure.length, sureMeanErr: meanErr(sure), unsureBars: unsure.length, unsureMeanErr: meanErr(unsure),
      interpolated: rows.filter(x => x.interpolated).length},
    retried: !!r.retried, alternate: r.alternate || null, progress, diagnostics: r.diagnostics, rows};
}

const want = process.argv.slice(2).filter(a => !a.startsWith('--'));
const write = process.argv.includes('--write');
const results = [];
for(const c of CASES){
  if(want.length && !want.includes(c.id)) continue;
  const r = runCase(c);
  results.push(r);
  console.log(`\n${r.title} — ${r.note}`);
  console.log(`  chart: ${r.chart.measures} bars (${r.chart.how}${r.chart.mismatch ? ', does not match the tune\'s bar count' : ''}); audio ${r.audioSeconds}s`);
  console.log(`  key: ${r.key.found >= 0 ? '+' : ''}${r.key.found} semitones, ${r.key.tuningFound} cents (played ${r.key.played >= 0 ? '+' : ''}${r.key.played}, ${r.key.tuningPlayed}) — ${r.key.ok ? 'right' : 'WRONG'}`);
  console.log(`  structure: ${r.structure.choruses} choruses found, ${r.structure.played} played; form ${r.structure.formStart}–${r.structure.formEnd}s; ${r.structure.order}`);
  console.log(`  beat: ${r.beat.mode}, ♩=${r.beat.bpm}, confidence ${r.beat.confidence}, agreement ${JSON.stringify(r.diagnostics.gridAgreement)}`);
  console.log(`  downbeat error: median ${fmt(r.errors.median)} ms, 90% ${fmt(r.errors.p90)} ms, worst ${fmt(r.errors.max)} ms over ${r.errors.n} bars`);
  console.log(`  within target: all ${r.errors.within} · heads with drums (±50) ${r.errors.headDrums} · solos (±100) ${r.errors.solo} · rubato (±100) ${r.errors.rubato}`);
  console.log(`  confidence: overall ${r.confidence.overall}; ${r.confidence.sureBars} bars ≥0.6 (mean error ${fmt(r.confidence.sureMeanErr)} ms), ${r.confidence.unsureBars} below (mean error ${fmt(r.confidence.unsureMeanErr)} ms); ${r.confidence.interpolated} interpolated`);
  console.log(`  time: ${(r.engineMs / 1000).toFixed(1)}s (analysis ${(r.analyseMs / 1000).toFixed(1)}s, alignment ${(r.alignMs / 1000).toFixed(1)}s)${r.retried ? ' — retried: ' + (r.alternate || 'second key') : ''}`);
  if(process.argv.includes('--bars')) r.rows.forEach(x => console.log(`    c${x.chorus} m${x.measure} ${x.type}${x.rubato ? ' rubato' : ''} truth ${x.truth} est ${x.est} err ${x.err} conf ${x.confidence}${x.interpolated ? ' interp' : ''}`));
}
if(write){
  const dir = path.join(__dirname, '..', 'docs', 'sync');
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'phase2-accuracy.json'), JSON.stringify({engine: engine.VERSION, run: new Date().toISOString(), results}, null, 1));
  console.log('\nper-bar log written to docs/sync/phase2-accuracy.json');
}
