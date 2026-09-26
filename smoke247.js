/* smoke247 — Piano input, phases 3–6: feedback, transcription, compose, drills.

   The claims.

   LIVE FEEDBACK (phase 3). Under an exercise, "Play it" judges each step as
   it is played: noteheads marked green, a wrong try marked and its wrong
   notes drawn as ghosts where they would sit, the cursor waiting for the
   right notes, the keyboard showing what is expected and what was played,
   and a scorecard at the end with a loop of the worst bars. Attempts are
   kept key by key; three clean ones at Standard mark the key as got and
   suggest raising the comfort. Play-along follows the click and scores the
   timing; a sequence is judged by alignment; free playing is described,
   not judged. A flashcard turns over when it hears the chord. The plan
   reads what was heard.

   TRANSCRIPTION (phase 4). Real performances (the ASAP test set, played
   through the house's sampled grand) are transcribed with nothing
   expected; note F1 at ±50 ms is reported, and on the moderate-tempo,
   lightly pedalled ones it is at least 85%.

   COMPOSE (phase 5). A take becomes notation: the beat (with the click, or
   found — on steady performances the beat tracker lands on the beat or a
   level of it), swing written as straight eighths with "Swing", the hands
   split, the key and spelling, chord symbols including rootless voicings,
   MusicXML that engraves, .mxl and MIDI that read back. The room draws it,
   takes a hand correction and counts it, and keeps it as an exercise.

   DRILLS (phase 6). The aural test, sight-reading and play-what-you-sing
   score a perfect answer as perfect; the voice detector finds sung notes. */
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const mr = require('./tools/midi-read.js');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke247-'));
const url = 'file://' + path.join(__dirname, 'index.html');

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const watch = p => { p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if(m.type() === 'error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/i.test(m.text())) errs.push('console: ' + m.text()); }); };
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}}); const p = await ctx.newPage(); watch(p);
  await p.goto(url); await p.waitForTimeout(1300);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => { document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); _li.active = 'midi'; });
  const play = (notes, dt) => p.evaluate(({notes, dt}) => { const t = listenNow() + (dt || 0); notes.forEach(m => { const ev = {pitch: m, onset: t, offset: null, velocity: 0.7, confidence: 1, source: 'midi'}; listenEmit(ev); listenMidiVerify(ev); }); }, {notes, dt});

  console.log('\n1. live feedback on an exercise');
  const id = await p.evaluate(() => { const st = jazzStages().find(s => String(s.id) === '2'); return st.subs.find(x => /ii-V-I Root/.test(jazzExercise(x).name)) || st.subs[0]; });
  await p.evaluate(id => { jazzUi().key = 'C'; location.hash = '#/jazz/' + id; }, id); await p.waitForTimeout(3500);
  const P0 = await p.evaluate(() => ({panel: !!document.querySelector('#lfPanel'), mode: document.querySelector('#lfMode').value, strict: document.querySelector('#lfStrict').value}));
  yes('the Play it strip is under the engraving, set for the exercise', P0.panel && P0.mode === 'exact', P0);
  await p.evaluate(() => { document.querySelector('#lfStrict').value = 'standard'; document.querySelector('#lfStrict').dispatchEvent(new Event('change')); });
  const attempt = async (wrongAt) => {
    await p.click('#lfGo'); await p.waitForTimeout(250);
    const steps = await p.evaluate(() => _lf.steps.map(s => s.notes));
    for(let k = 0; k < steps.length; k++){
      if(k === wrongAt){ await play(steps[k].map((m, i) => i === 1 ? m + 1 : m)); await p.waitForTimeout(170); }
      await play(steps[k]); await p.waitForTimeout(170);
    }
    await p.waitForTimeout(400);
    return p.evaluate(() => ({ok: document.querySelectorAll('.lf-m.ok').length, retry: document.querySelectorAll('.lf-m.retry').length, ghost: document.querySelectorAll('.lf-ghost').length,
      kbd: !!document.querySelector('.lf-keys'), card: document.querySelector('#lfCard').innerText, loop: !!document.querySelector('#lfLoop'), running: _lf.running, steps: _lf.steps.length}));
  };
  const A1 = await attempt(1);
  yes('each step is marked as it is played; the wrong try is marked, its wrong note drawn as a ghost', A1.ok >= 8 && A1.retry >= 1 && A1.ghost >= 1 && A1.kbd, A1);
  yes('the scorecard: accuracy, the bar with the error, and a loop of it', /67%|66%/.test(A1.card) && /bar 2/.test(A1.card) && A1.loop && !A1.running, A1.card);
  await p.screenshot({path: path.join(DIR, 'feedback.png')});
  await p.click('#lfLoop'); await p.waitForTimeout(250);
  is('"Loop the tricky bit" plays only that bar again', await p.evaluate(() => _lf.steps.map(s => s.num)), [2]);
  await play(await p.evaluate(() => _lf.steps[0].notes)); await p.waitForTimeout(500);
  for(let r = 0; r < 3; r++){ const A = await attempt(-1); if(r === 2) yes('three clean attempts at Standard mark the key as got, and suggest raising the comfort', /100%/.test(A.card) && /marked as yours/.test(A.card), A.card); }
  const H = await p.evaluate(id => { const out = {got: !!jazzRecord(id).keys.C, heard: jazzRecord(id).heard.length, summary: lfHeardSummary(id)};
    /* the plan: an exercise on the active stage whose last heard attempt in C failed does not count C as got */
    const aid = jazzActiveStage().subs[0], r = jazzRecord(aid, true); r.keys.C = true; r.heard = [{key: 'C', mode: 'exact', pass: false, accuracy: 50, strictness: 'standard'}];
    const pr = jazzStudentState().exerciseProgress[aid]; out.plan = {heard: !!pr.heard, keys: pr.keys}; delete r.keys.C; r.heard = []; return out; }, id);
  yes('the attempts are kept, key by key, and the plan reads them: a key that failed when heard comes round again', H.got && H.heard === 5 && H.summary.attempts === 5 && H.plan.heard && !H.plan.keys.includes('C'), H);
  await p.click('#lfComfort'); await p.waitForTimeout(200);
  is('raising the comfort is one press', await p.evaluate(id => jazzComfortOf(id) >= 3, id), true);

  /* play along: the click moves the cursor; the timing is scored */
  await p.evaluate(() => { document.querySelector('[data-lfhow="along"]').click(); document.querySelector('#lfBpm').value = 120; document.querySelector('#lfBpm').dispatchEvent(new Event('change')); });
  await p.click('#lfGo'); await p.waitForTimeout(100);
  await p.evaluate(() => { const s = _lf; s.steps.forEach((st, k) => { const t = s.stepTime(st) + (k === 1 ? 0.03 : 0); setTimeout(() => { st.notes.forEach(m => { const ev = {pitch: m, onset: t, offset: null, velocity: .7, confidence: 1, source: 'midi'}; listenEmit(ev); listenMidiVerify(ev); }); }, Math.max(0, (t - listenNow()) * 1000)); }); });
  await p.waitForFunction(() => !_lf.running, null, {timeout: 20000});
  const AL = await p.evaluate(() => ({card: document.querySelector('#lfCard').innerText, offs: _lf.results.map(r => r.offsetMs)}));
  yes('play-along: every step on time is right, and the timing is scored from the onsets', /100%/.test(AL.card) && AL.offs.every(o => o != null && Math.abs(o) < 60), AL);

  /* pure pieces: swing ratio, evenness, rhythm report, free playing, lead-sheet chords */
  const U = await p.evaluate(() => {
    const beat = 0.5, t0 = 10; const on = []; for(let k = 0; k < 8; k++){ on.push(t0 + k * beat, t0 + k * beat + beat * 2 / 3); }
    const grid = lfGrid(0, 0.5, 2, 4, [0, 1.5]); const onsets = grid.map((g, i) => g.t + (g.label === '&2' ? -0.035 : 0.004));
    return {swing: lfSwingRatio(on, beat, t0), say: lfSwingSay(2.0, 2), even: lfEvenness([0, .25, .5, .75, 1, 1.25]).cv, rhythm: lfRhythmReport(onsets, grid, 150).say,
      free: lfFreeReport([60, 62, 64, 66, 67].map((p, i) => ({pitch: p, onset: i * 0.5})), [0, 2, 4, 5, 7, 9, 11]),
      chord: lfChordSymbolCheck({pc: 7, tones: [0, 4, 7, 10]}, [53, 59, 64]).pass, chordBad: lfChordSymbolCheck({pc: 7, tones: [0, 4, 7, 10]}, [53, 58]).pass,
      earned: lfKeyEarned([{key: 'F', pass: true, strictness: 'standard', timing: 90}, {key: 'F', pass: true, strictness: 'standard', timing: 85}, {key: 'F', pass: true, strictness: 'lenient', timing: 90}], 'F')};
  });
  yes('the swing ratio of a 2:1 line reads 2:1', Math.abs(U.swing - 2) < 0.05 && /2\.0:1/.test(U.say), U);
  yes('an even scale reads as even', U.even < 0.02, U.even);
  is('a comping pattern: which beat you rush, and by how much', U.rhythm, 'You rush the “and” of 2 by 35 ms on average.');
  yes('free playing is described: inside the mode, range', U.free.n === 5 && U.free.outside === 1 && U.free.span === 7, U.free);
  yes('a lead-sheet chord passes on its guide tones, fails without them', U.chord && !U.chordBad);
  yes('a lenient pass does not count towards the key', U.earned === false);

  console.log('\n2. a flashcard turns over when it hears the chord');
  await p.evaluate(id => { jazzUi().flash = {cards: [{exerciseId: id, key: 'F'}], at: 0, shown: false, got: {nailed: 0, struggled: 0, couldnt: 0}, from: Date.now()}; location.hash = '#/jazz/cards'; }, id);
  await p.waitForTimeout(1200);
  const want = await p.evaluate(() => _li.expect && _li.expect.notes);
  yes('the card listens for the first chord of its answer', Array.isArray(want) && want.length >= 3, want);
  const chords = await p.evaluate(id => { const x = jazzScoreFor(id, jazzExercise(id), 'F', {}); const xml = x.documents ? x.documents[0].mxl : x;
    return lfSteps(anParse(xml).notes.map(n => ({midi: n.midi, on: n.on, num: n.num, at: n.at, dur: n.dur, id: n.id}))).filter(s => s.notes.length > 1).map(s => s.notes); }, id);
  for(const c of chords){ await play(c); await p.waitForTimeout(180); }
  await p.waitForTimeout(600);
  const FL = await p.evaluate(() => ({shown: jazzUi().flash && jazzUi().flash.shown, heard: (document.querySelector('.jz-heard') || {}).textContent || ''}));
  yes('…and turns over, saying how long it took', FL.shown && /Heard it/.test(FL.heard), FL);

  console.log('\n3. transcription, told nothing');
  await p.evaluate(async () => { grandPianoLoad(); for(let i = 0; i < 120 && _grand.state !== 'ready'; i++) await new Promise(r => setTimeout(r, 100)); });
  const TX = {};
  for(const cid of ['bach-846', 'mozart-12-1', 'haydn-32-1', 'chopin-10-3']){
    const m = mr.read(fs.readFileSync(path.join(__dirname, `tools/sync-testset/asap/${cid}/performance.mid`)));
    const seg = m.notes.filter(n => n.t < 20).map(n => ({midi: n.midi, t: n.t, off: n.off, vel: n.vel / 127}));
    const pedal = m.pedal.filter(x => x.t < 22);
    TX[cid] = await p.evaluate(async ({seg, pedal}) => {
      const sr = 44100, ctx = new OfflineAudioContext(1, sr * 22, sr);
      const held = n => { let d = false; pedal.forEach(q => { if(q.t <= n.off) d = q.down; }); if(!d) return n.off; const up = pedal.find(q => q.t > n.off && !q.down); return up ? up.t : n.off + 2; };
      seg.forEach(n => grandPianoNote(ctx, ctx.destination, n.midi, n.t + 0.5, n.off - n.t, n.vel, held(n) - n.t, 0.5));
      const pcm = (await ctx.startRendering()).getChannelData(0);
      let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5; for(let i = 0; i < pcm.length; i++) pcm[i] += rnd() * 0.0006;   /* a quiet room */
      const r = await txTranscribe(pcm, sr, {cents: 0, templates: null, inharm: null});
      const truth = seg.map(n => ({p: n.midi, t: n.t + 0.5})), used = new Set(); let tp = 0;
      r.notes.forEach(x => { const k = truth.findIndex((y, i) => !used.has(i) && y.p === x.pitch && Math.abs(y.t - x.onset) <= 0.05); if(k >= 0){ used.add(k); tp++; } });
      const P = tp / Math.max(1, r.notes.length), R = tp / truth.length;
      return {F: +(2 * P * R / Math.max(1e-9, P + R)).toFixed(3), P: +P.toFixed(3), R: +R.toFixed(3), n: truth.length, ms: r.ms, where: r.where};
    }, {seg, pedal});
    console.log(`  ---  ${cid}: F1 ${TX[cid].F} (P ${TX[cid].P}, R ${TX[cid].R}, ${TX[cid].n} notes, ${TX[cid].ms} ms in the ${TX[cid].where})`);
  }
  const moderate = (TX['bach-846'].F + TX['mozart-12-1'].F + TX['haydn-32-1'].F) / 3;
  yes(`on moderate-tempo, lightly pedalled playing, note F1 is at least 85% (${(moderate * 100).toFixed(1)}%)`, moderate >= 0.85);
  yes('it runs in a Worker, well under the length of the take', Object.values(TX).every(t => t.where === 'worker' && t.ms < 20000), TX);
  const MIDI = await p.evaluate(() => { const m = cpClean([{pitch: 60, onset: 0.5, offset: 1}, {pitch: 64, onset: 1, offset: 1.5}], {bpm: 120, click: true, t0: 0.5}); m.pedal = [{div: 0, down: true}, {div: 24, down: false}];
    const bytes = cpToMidi(m); const back = txReadMidi(bytes); return {n: back.notes.length, pedal: back.pedal.length, p: back.notes.map(x => x.pitch)}; });
  is('a MIDI file (the local helper\'s, or any) reads back, pedal and all', MIDI, {n: 2, pedal: 2, p: [60, 64]});

  console.log('\n4. compose');
  const BT = [];
  for(const cid of ['bach-846', 'mozart-12-1', 'haydn-32-1']){
    const m = mr.read(fs.readFileSync(path.join(__dirname, `tools/sync-testset/asap/${cid}/performance.mid`)));
    const ann = fs.readFileSync(path.join(__dirname, `tools/sync-testset/asap/${cid}/annotations.txt`), 'utf8').trim().split('\n').map(l => +l.split('\t')[0]).filter(t => t < 29);
    const ev = m.notes.filter(n => n.t < 30).map(n => ({pitch: n.midi, onset: n.t, offset: n.off, velocity: n.vel / 127}));
    const r = await p.evaluate(({ev, ann}) => { const model = cpClean(ev, {free: true, ts: [4, 4]});
      const f = truth => { const est = model.beats.filter(b => b >= truth[0] - 0.2 && b < 29); const used = new Set(); let tp = 0;
        est.forEach(b => { const k = truth.findIndex((t, i) => !used.has(i) && Math.abs(t - b) <= 0.07); if(k >= 0){ used.add(k); tp++; } });
        const P = tp / Math.max(1, est.length), R = tp / truth.length; return P + R ? 2 * P * R / (P + R) : 0; };
      const half = []; ann.forEach((t, i) => { half.push(t); if(ann[i + 1]) half.push((t + ann[i + 1]) / 2); });
      return {F: Math.max(f(ann), f(half), f(ann.filter((_, i) => i % 2 === 0)), f(ann.filter((_, i) => i % 2 === 1))), bpm: model.bpm}; }, {ev, ann});
    BT.push(r); console.log(`  ---  ${cid}: beat F ${r.F.toFixed(2)} at the best metrical level, ♩ = ${r.bpm}`);
  }
  yes('free tempo: on steady performances the beats land on the beat, or on a level of it', BT.every(r => r.F >= 0.9), BT);
  const C = await p.evaluate(() => {
    const P = 0.5, t0 = 1.0, ev = [];
    [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60, 62].forEach((m, i) => { const on = t0 + (Math.floor(i / 2) + (i % 2 ? 0.66 : 0)) * P; ev.push({pitch: m, onset: on, offset: on + 0.2, velocity: 0.7}); });
    const sw = cpClean(ev, {bpm: 120, click: true, t0});
    const x = cpToMusicXML(sw);
    const ch = []; [[38, [53, 57, 60, 64]], [43, [53, 57, 59, 64]], [36, [52, 55, 59, 62]]].forEach(([bs, v], k) => { const on = 0.5 + k * 2; ch.push({pitch: bs, onset: on, offset: on + 1.9}); v.forEach(q => ch.push({pitch: q + 12, onset: on + 0.01, offset: on + 1.9})); ch.push({pitch: 76, onset: on, offset: on + 1.9}); });
    const cm = cpClean(ch, {bpm: 120, click: true, t0: 0.5, chords: true});
    const hands = cpClean([{pitch: 48, onset: 0.5, offset: 2}, {pitch: 55, onset: 0.5, offset: 2}, {pitch: 64, onset: 0.5, offset: 2}, {pitch: 76, onset: 0.5, offset: 1}, {pitch: 62, onset: 1, offset: 1.5}], {bpm: 120, click: true, t0: 0.5});
    const fKey = cpClean([65, 67, 69, 70, 72, 74, 76, 77].map((m, i) => ({pitch: m, onset: i * 0.5, offset: i * 0.5 + 0.45})), {bpm: 120, click: true, t0: 0});
    const zip = cpToMxl(x, 'swing'), crc = zip.length > 100 && String.fromCharCode(zip[0], zip[1]) === 'PK';
    return {swing: sw.swing.on && sw.notes.every(n => n.dur === 6) && /<words[^>]*>Swing<\/words>/.test(x), ratio: sw.swing.ratio,
      chords: cm.chords.map(c => c.symbol).join(' '), lh: hands.notes.filter(n => n.staff === 2).map(n => n.pitch).sort(), rh: hands.notes.filter(n => n.staff === 1).map(n => n.pitch).sort(),
      key: fKey.key.name, bflat: fKey.notes.find(n => n.pitch === 70).step + fKey.notes.find(n => n.pitch === 70).alter, mxl: crc, xmlOk: !new DOMParser().parseFromString(x, 'application/xml').getElementsByTagName('parsererror').length};
  });
  yes('a swung line is written as straight eighths with "Swing" over it', C.swing && Math.abs(C.ratio - 1.94) < 0.1, C);
  is('rootless voicings over the bass read as the chords they are', C.chords, 'Dm9 G13 Cmaj9');
  yes('the hands split where a hand would, not at a fixed line', JSON.stringify(C.lh) === '[48,55]' && C.rh.includes(62) && C.rh.includes(64), C);
  yes('the key is found, and B flat is spelled B flat in F', C.key === 'F' && C.bflat === 'B-1', C);
  yes('the MusicXML is well formed and the .mxl is a zip', C.xmlOk && C.mxl, C);
  /* the room */
  await p.evaluate(() => { const ev = [], P = 0.5; [[50, 53, 57, 60, 74], [43, 47, 53, 57, 71], [48, 52, 55, 59, 72], [48, 52, 55, 59, 72]].forEach((ch, k) => ch.forEach(m => ev.push({pitch: m, onset: 1 + k * 4 * P, offset: 1 + k * 4 * P + 1.9, velocity: 0.6})));
    cpAddTake({source: 'midi', events: ev, pedal: [], bpm: 120, ts: '4/4', free: false, t0: 1.0, seconds: 9}); location.hash = '#/jazz/compose'; });
  await p.waitForTimeout(3500);
  const R0 = await p.evaluate(() => ({svg: !!document.querySelector('#cpScore svg'), takes: document.querySelectorAll('[data-cpdel]').length, meta: document.querySelector('.cp-piece .li-row .faint.mono').textContent}));
  yes('a take becomes a piece, engraved with its key, time and tempo', R0.svg && R0.takes === 1 && /C · 4\/4 · ♩=120 · 4 bars/.test(R0.meta), R0);
  await p.click('[data-cpmode="lead"]'); await p.waitForTimeout(3000);
  const R1 = await p.evaluate(() => ({harm: (cpPiece().xml.match(/<harmony/g) || []).length, svg: !!document.querySelector('#cpScore svg')}));
  yes('as a lead sheet, with the chords read off the left hand', R1.harm === 3 && R1.svg, R1);
  await p.click('[data-cpmode="piano"]'); await p.waitForTimeout(3000);
  const where = await p.evaluate(() => { const box = document.querySelector('#cpScore'), o = box.querySelector('svg').getBoundingClientRect(); const q = lfPositions(box._jzOsmd).find(x => x.midi === 74); return {x: o.left + q.x, y: o.top + q.y}; });
  await p.mouse.click(where.x, where.y); await p.waitForTimeout(200);
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(2500);
  const R2 = await p.evaluate(() => ({edits: cpPiece().edits.length, has75: cpModel(cpPiece()).notes.some(n => n.pitch === 75), say: document.querySelector('#cpTools').innerText}));
  yes('a note is clicked and moved up; the correction is counted', R2.edits === 1 && R2.has75 && /1 of \d+ notes corrected by hand/.test(R2.say), R2);
  await p.click('#cpEx'); await p.waitForTimeout(3200);
  yes('kept as an exercise, the Play it strip checks you on it', await p.evaluate(() => !!document.querySelector('#lfPanel[data-lfid^="cmp:"]')));
  const before = await p.evaluate(() => (S.scores || []).length);
  await p.click('#cpToRep'); await p.waitForTimeout(800);
  is('saved to Repertoire as a score', await p.evaluate(() => (S.scores || []).length), before + 1);
  await p.screenshot({path: path.join(DIR, 'compose.png')});
  await p.evaluate(() => { window.confirm = () => true; location.hash = '#/jazz/compose'; }); await p.waitForTimeout(2500);
  await p.click('[data-cpdel]'); await p.waitForTimeout(500);
  is('"Delete take" removes it', await p.evaluate(() => cpState().takes.length), 0);

  console.log('\n5. ear and reading');
  await p.evaluate(() => { location.hash = '#/jazz/ear'; }); await p.waitForTimeout(1000);
  await p.click('#drGo');
  const ph = await p.evaluate(() => _dr.phrase);
  await p.waitForFunction(() => _dr.phase === 'listen', null, {timeout: 30000});
  await p.evaluate(ph => { let t = listenNow(); ph.notes.forEach((m, i) => { listenEmit({pitch: m, onset: t, offset: null, velocity: .7, confidence: 1, source: 'midi'}); t += ph.durs[i] * 60 / ph.bpm; }); }, ph);
  await p.waitForFunction(() => _dr.phase === 'idle' && _dr.result, null, {timeout: 20000});
  const E1 = await p.evaluate(() => _dr.result);
  yes('the aural test: a phrase played back right is 100%, rhythm included', E1.accuracy === 100 && E1.timing >= 90, E1);
  await p.click('[data-drtab="sight"]'); await p.waitForTimeout(500);
  await p.click('#drGo'); await p.waitForTimeout(2500);
  yes('sight-reading shows a melody it has not shown before', await p.evaluate(() => !!document.querySelector('#drScore svg')));
  await p.click('#drGo'); await p.waitForTimeout(200);
  await p.evaluate(() => { const beat = 60 / drState().settings.sightBpm; _dr.phrase.model.notes.forEach(n => { const t = _dr.t0 + n.start / 12 * beat; setTimeout(() => listenEmit({pitch: n.pitch, onset: t, offset: null, velocity: .7, confidence: 1, source: 'midi'}), Math.max(0, (t - listenNow()) * 1000)); }); });
  await p.waitForFunction(() => _dr.phase === 'idle' && _dr.result && _dr.result.kind === 'sight', null, {timeout: 40000});
  const E2 = await p.evaluate(() => _dr.result);
  yes('sight-reading: played as written, in time, is 100%', E2.accuracy === 100 && E2.timing >= 90, E2);
  const Y = await p.evaluate(() => { const sr = 44100, seq = [57, 60, 62, 64, 67], pcm = new Float32Array(sr * 3); let ph = 0;
    seq.forEach((m, k) => { const f = 440 * Math.pow(2, (m - 69) / 12) * Math.pow(2, 0.2 / 12); for(let i = Math.round(k * 0.55 * sr); i < Math.round((k * 0.55 + 0.45) * sr); i++){ ph += 2 * Math.PI * f * (1 + 0.004 * Math.sin(i / sr * 30)) / sr; pcm[i] = 0.3 * Math.sin(ph) + 0.12 * Math.sin(2 * ph) + 0.05 * Math.sin(3 * ph); } });
    return drSungNotes(pcm, sr).map(n => n.pitch); });
  is('play what you sing: a sung line (a little sharp, with vibrato) is heard note by note', Y, [57, 60, 62, 64, 67]);

  console.log('\n6. elsewhere');
  const sid = await p.evaluate(() => S.scores[0].id);
  await p.evaluate(id => { scoreUi().side = 'recordings'; location.hash = '#/score/' + id; }, sid); await p.waitForTimeout(2500);
  yes('Repertoire offers to record a performance with the microphone, as its rubato profile', await p.evaluate(() => !!document.querySelector('[data-symic]')));
  const wav = await p.evaluate(async () => { const pcm = new Float32Array(44100).map((_, i) => Math.sin(i / 10) * 0.5); const blob = txWav(pcm, 44100); const buf = await blob.arrayBuffer();
    const ctx = new OfflineAudioContext(1, 44100, 44100); const au = await ctx.decodeAudioData(buf); return {len: au.length, sr: au.sampleRate}; });
  is('a take is written as a WAV any browser can read back', wav, {len: 44100, sr: 44100});
  await p.evaluate(() => { location.hash = '#/jazz/piano'; }); await p.waitForTimeout(1000);
  yes('the piano input page counts how much Compose needed correcting', await p.evaluate(() => /How much Compose needed correcting/.test(document.body.innerText)));

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}  (screenshots in ${DIR})`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
