/* smoke237 — Repertoire: sync a recording, and the score follows it.

   WHAT IS CLAIMED. A piece has a Recordings tab. "Sync a recording" takes
   an audio file from your own files, follows it in a Worker, and keeps a
   sync map on the score: every bar played placed in the audio, the repeats
   as they were taken, the key and tuning, how sure each bar is. The audio
   is kept on this device only — its own store, left out of the backup and
   out of the two-machine file — and the map exported as JSON carries times
   and bar numbers, never sound. "Listen along" plays the recording with
   the bar being played lit on the page; a press on a bar of the strip
   starts there. A map loaded onto the piece has no audio until its file is
   chosen again, and a map made for another score is refused. Deleting a
   recording can be undone, and its audio goes only once the undo has run
   out. A bar split by a repeat sign (the last beats of a section, then its
   upbeat) plays for what it holds, not a padded bar.

   HOW. The recording is the piece played on the house's own grand piano
   (the Salamander samples) through an OfflineAudioContext, with its tempo
   pulled about (a ramp down, a ramp up, a held phrase end), so the true
   time of every bar is known from the player's own tempo map.

   HOW IT COULD BE WRONG AND STILL PASS. The piano is clean and close; a
   concert hall recording is harder (test-sync-accuracy.js measures that).

   Run: NODE_PATH=node_modules node smoke237.js */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

/* A chorale on two staves: a chord a bar in the left hand, a moving tune in
   the right, sixteen bars at ♩=92 with the first eight repeated. */
const STEP = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
const pitch = m => { const names = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'], alt = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  const pc = m % 12, oct = Math.floor(m / 12) - 1; return `<pitch><step>${names[pc]}</step>${alt[pc] ? '<alter>1</alter>' : ''}<octave>${oct}</octave></pitch>`; };
const n = (m, d, staff, chord) => `<note>${chord ? '<chord/>' : ''}${pitch(m)}<duration>${d}</duration><voice>${staff}</voice><staff>${staff}</staff></note>`;
const CHORDS = [[48, 55, 64], [53, 57, 65], [55, 59, 62], [57, 60, 64], [50, 57, 65], [55, 59, 65], [48, 55, 64], [52, 56, 62],
  [45, 57, 60], [53, 57, 60], [50, 54, 60], [55, 59, 62], [48, 55, 64], [53, 57, 65], [55, 59, 65], [48, 55, 60]];
const TUNES = [[72, 71, 72, 74], [77, 76, 74, 72], [71, 72, 74, 71], [72, 76, 74, 72], [74, 72, 77, 76], [74, 71, 74, 77], [76, 74, 72, 79], [80, 76, 74, 71],
  [72, 69, 72, 76], [77, 72, 69, 72], [74, 78, 81, 78], [79, 74, 71, 74], [76, 79, 76, 72], [72, 77, 81, 77], [79, 77, 74, 71], [72, 67, 64, 60]];
const CHORALE = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Chorale in C</work-title></work>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${CHORDS.map((c, i) =>
  `<measure number="${i + 1}">${i === 0 ? `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves>
    <clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>
    <direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>92</per-minute></metronome></direction-type><sound tempo="92"/></direction>` : ''}
  ${TUNES[i].map(m => n(m, 1, 1)).join('')}<backup><duration>4</duration></backup>${c.map((m, j) => n(m, 4, 2, j > 0)).join('')}
  ${i === 7 ? '<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>' : ''}</measure>`).join('')}</part></score-partwise>`;
/* the same notes, another piece: its map is not this one's */
const OTHER = CHORALE.replace('Chorale in C', 'Another Chorale').replace(/<measure number="16">[\s\S]*?<\/measure>/, '');
/* a split bar: a pickup of one beat, a first ending of three beats back to it, a second ending of three */
const SPLIT = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">
<measure number="0" implicit="yes"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>${n(67, 1, 1)}</measure>
<measure number="1">${n(72, 4, 1)}</measure>
<measure number="2"><barline location="left"><ending number="1" type="start"/></barline>${n(74, 3, 1)}<barline location="right"><ending number="1" type="stop"/><repeat direction="backward"/></barline></measure>
<measure number="3"><barline location="left"><ending number="2" type="start"/></barline>${n(76, 3, 1)}<barline location="right"><ending number="2" type="discontinue"/></barline></measure>
<measure number="4"><barline location="left"><repeat direction="forward"/></barline>${n(79, 1, 1)}</measure>
<measure number="5">${n(77, 4, 1)}</measure>
<measure number="6">${n(76, 3, 1)}<barline location="right"><repeat direction="backward"/></barline></measure>
<measure number="7">${n(72, 4, 1)}</measure></part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1300, height:1000}, acceptDownloads: true});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const take = (xml, name) => p.evaluate(async ([xml, name]) => (await takeScoreFile(new File([xml], name))).id, [xml, name]);
  const open = async id => { await p.evaluate(id => { const u = scoreUi(); u.focus = null; u.side = 'marks'; location.hash = '#/score/' + id; }, id); await p.waitForTimeout(3000); };

  console.log('\n1. a bar split by a repeat sign plays for what it holds');
  const SP = await p.evaluate(xml => { const tl = musicXmlTimeline(xml); return {lens: tl.measures.map(m => m.len), order: tl.order, length: tl.length}; }, SPLIT);
  is('the pickup, the three-beat endings and the one-beat upbeat after the double bar keep their lengths; full bars stay full',
    SP.lens, [1, 4, 3, 3, 1, 4, 3, 4]);
  is('  and it plays pickup, 1, first ending, back to the pickup, 1, second ending, then the repeated section', SP.order, [0, 1, 2, 0, 1, 3, 4, 5, 6, 4, 5, 6, 7]);
  is('  so the whole is as long as the notes (no silent beats at the repeats)', SP.length, 1 + 4 + 3 + 1 + 4 + 3 + 2 * (1 + 4 + 3) + 4);

  console.log('\n2. the recording: the chorale on the grand piano, its tempo pulled about');
  const ids = {chorale: await take(CHORALE, 'Chorale in C.musicxml'), other: await take(OTHER, 'Another Chorale.musicxml'), copy: await take(CHORALE, 'Chorale again.musicxml')};
  const R = await p.evaluate(async xml => {
    await grandPianoLoad();
    const tl = musicXmlTimeline(xml);
    const L = tl.length;   /* 24 bars played: 8, 8 again, then 8 */
    /* slower through the repeat, a push in the second half, a broad close */
    const overrides = [{q0: 16, q1: 32, start: 92, end: 70}, {q0: 32, q1: 48, start: 76, end: 112}, {q0: 80, q1: L, start: 100, end: 64}];
    const seconds = 3.5 + 0.08 + (() => { const pl = scorePlayer(tl, {overrides}); return pl.secs(0, L); })();
    const sr = 22050, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new OAC(1, Math.ceil(sr * seconds), sr);
    const pl = scorePlayer(tl, {overrides});
    pl.start(ctx);
    const buf = await ctx.startRendering();
    /* 1.5 s of room before the music, as a real file has */
    const lead = 1.5, d = buf.getChannelData(0), N = d.length + Math.round(lead * sr);
    const pcm = new Int16Array(N); for(let i = 0; i < d.length; i++) pcm[i + Math.round(lead * sr)] = Math.max(-32767, Math.min(32767, Math.round(d[i] * 30000)));
    const wav = new ArrayBuffer(44 + N * 2), v = new DataView(wav);
    const w4 = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w4(0, 'RIFF'); v.setUint32(4, 36 + N * 2, true); w4(8, 'WAVE'); w4(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w4(36, 'data'); v.setUint32(40, N * 2, true);
    new Int16Array(wav, 44).set(pcm);
    window.__wav = new File([wav], 'Chorale — my run-through.wav', {type: 'audio/wav'});
    const truth = tl.perf.map(pm => lead + 0.08 + pl.secs(0, pm.q0));
    let peak = 0; for(let i = 0; i < d.length; i += 7) peak = Math.max(peak, Math.abs(d[i]));
    return {seconds: +(seconds + lead).toFixed(2), bars: tl.perf.length, truth, peak: +peak.toFixed(2), tempo: [0, 8, 16, 22].map(i => Math.round(60 * 4 / (truth[i + 1] - truth[i])))};
  }, CHORALE);
  yes(`${R.seconds} s of piano, ${R.bars} bars played (the first eight twice)`, R.bars === 24 && R.peak > 0.05, R);
  ok(`  the tempo runs ♩=${R.tempo.join(' → ')} across it`);

  console.log('\n3. the Recordings tab');
  await open(ids.chorale);
  await p.click('[data-scside="recordings"]'); await p.waitForTimeout(500);
  const T0 = await p.evaluate(() => { const s = document.getElementById('scSide');
    return {tab: !!document.querySelector('[data-scside="recordings"].on'), add: !!s.querySelector('[data-syadd]'),
      priv: (s.querySelector('.sy-private') || {}).textContent || '', empty: !!s.querySelector('.empty')}; });
  yes('a piece has a Recordings tab, with "Sync a recording" and nothing in it yet', T0.tab && T0.add && T0.empty, T0);
  yes('  it says the file stays on this device and is never uploaded', /stays on this device/.test(T0.priv) && /never uploaded/.test(T0.priv), T0.priv);
  const stepsSeen = [];
  const t0 = Date.now();
  await p.evaluate(id => { window.__steps = []; const x = scoreById(id);
    const mo = new MutationObserver(() => { const t = document.querySelector('.sy-job-t'); if(t && window.__steps[window.__steps.length - 1] !== t.textContent) window.__steps.push(t.textContent); });
    mo.observe(document.getElementById('scSide'), {subtree: true, childList: true, characterData: true});
    window.__syncDone = syncRecordingAdd(x, window.__wav); }, ids.chorale);
  await p.waitForTimeout(150);
  const J = await p.evaluate(() => ({job: !!document.querySelector('.sy-job'), bar: !!document.querySelector('.sy-prog'), add: document.querySelector('[data-syadd]').disabled}));
  yes('while it listens: the file, what it is doing and how far along, and no second sync started', J.job && J.bar && J.add, J);
  await p.evaluate(() => window.__syncDone);
  const took = (Date.now() - t0) / 1000;
  stepsSeen.push(...await p.evaluate(() => window.__steps));
  yes(`  it says what it is doing as it goes (${stepsSeen.length} steps)`, stepsSeen.length >= 3 && stepsSeen.some(s => /score|bar/i.test(s)), stepsSeen);
  const M = await p.evaluate(async ([id, truth]) => {
    const x = scoreById(id), r = x.recordings[0]; if(!r) return {none: true, job: (_syncJobs.get(id) || {}).error};
    const bars = syncBars(r.map);
    const errs = bars.map((bb, i) => bb.t == null ? null : Math.round((bb.t - truth[i]) * 1000));
    const row = await db.scoreAudio.get(r.id);
    return {n: bars.length, reading: r.map.reading, errs, conf: r.map.overallConfidence, key: [r.map.transposition, Math.round(r.map.tuningOffsetCents)],
      audio: !!(row && row.blob && row.blob.size > 1000), scoreId: row && row.scoreId, dur: r.duration, name: r.name, bpm: r.bpm, cells: document.querySelectorAll('.sy-strip .sy-cell').length,
      legend: (document.querySelector('.sy-legend') || {}).textContent || '', facts: (document.querySelector('.sy-facts') || {}).textContent || ''};
  }, [ids.chorale, R.truth]);
  if(M.none){ no('a recording was kept', M.job); }
  else {
    const within = ms => M.errs.filter(e => e != null && Math.abs(e) <= ms).length;
    yes(`synced in ${took.toFixed(1)} s: a map of ${M.n} bars, with the repeat taken as written`, M.n === 24 && M.reading && M.reading.how === 'as written'
      && M.reading.order.join() === [0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].join(), {n: M.n, reading: M.reading});
    yes(`  every bar within 100 ms of where it was played (${within(50)}/24 within 50 ms; errors ${M.errs.join(' ')} ms)`, within(100) === 24, M.errs);
    is('  in the written key and at A = 440', [M.key[0], Math.abs(M.key[1]) < 10], [0, true]);
    yes('  the audio is kept on this device, filed under the piece', M.audio && M.scoreId === ids.chorale, M);
    yes(`  the card: name, length, repeats, tempo, key — "${M.facts.replace(/\s+/g, ' ').trim()}"`, M.name === 'Chorale — my run-through' && /taken as written/.test(M.facts)
      && /♩ ≈ \d+/.test(M.facts) && /written key/.test(M.facts), M);
    yes(`  one cell a bar in the strip, and a legend in words — "${M.legend.replace(/\s+/g, ' ').trim()}"`, M.cells === 24 && /\d+ sure/.test(M.legend), M.legend);
  }

  console.log('\n4. private: the audio never leaves');
  const P = await p.evaluate(async id => {
    const rows = await readAllStores();
    const json = JSON.stringify(rows);
    const x = scoreById(id);
    return {stores: Object.keys(rows).includes('scoreAudio'), binary: BINARY_STORES.includes('scoreAudio'), mapKept: /"recordings"/.test(json) && json.includes(x.recordings[0].map.id),
      big: json.length};
  }, ids.chorale);
  yes('the backup and the two-machine file leave the audio out; the map goes with the piece', !P.stores && P.binary && P.mapKept, P);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-syexport]')]);
  const exported = require('fs').readFileSync(await dl.path(), 'utf8');
  const E = JSON.parse(exported);
  yes(`the exported map is JSON of bar times (${(exported.length / 1024).toFixed(1)} KB), named for the piece — ${dl.suggestedFilename()}`,
    E.kind === 'life-instrument-sync-maps' && E.maps.length === 1 && E.maps[0].reading && E.maps[0].syncPoints.length > 24 && /Chorale/.test(dl.suggestedFilename()), E.kind);
  yes('  and carries no sound: no blob, no samples, nothing base64', !/blob|pcm|data:|"audio"/i.test(exported) && exported.length < 200000, exported.length);

  console.log('\n5. listening along');
  await p.evaluate(() => { document.querySelector('[data-sylisten]').click(); });
  await p.waitForTimeout(3200);
  const L = await p.evaluate(() => { const hl = document.querySelector('#scStage > .plx-hl'), L = _syncListen;
    return {on: !!L, btn: document.querySelector('[data-sylisten]').textContent, lit: !!hl && !hl.hidden, where: (document.querySelector('#scPlayRow [data-plxwhere]') || {}).textContent,
      at: L ? audioToScoreTime(L.rec.map, L.offset + L.ctx.currentTime - L.t0) : null}; });
  yes(`"Listen along" plays it and lights the bar being played on the page (${L.where}; the map says m. ${L.at && L.at.measure})`, L.on && L.lit && /Stop/.test(L.btn) && L.at && L.at.measure >= 1, L);
  await p.evaluate(() => { const c = document.querySelectorAll('.sy-strip .sy-cell')[12]; c.click(); });
  await p.waitForTimeout(900);
  const L2 = await p.evaluate(() => { const L = _syncListen; return {m: L ? audioToScoreTime(L.rec.map, L.offset + L.ctx.currentTime - L.t0).measure : null,
    where: (document.querySelector('#scPlayRow [data-plxwhere]') || {}).textContent}; });
  yes(`a press on bar 13 of the strip starts there — the second time through bar 5 (${L2.where})`, L2.m === 13 && /m\. 5/.test(L2.where), L2);
  await p.evaluate(() => document.querySelector('[data-sylisten]').click());
  await p.waitForTimeout(300);
  const L3 = await p.evaluate(() => ({on: !!_syncListen, lit: (() => { const hl = document.querySelector('#scStage > .plx-hl'); return !!hl && !hl.hidden; })(),
    btn: document.querySelector('[data-sylisten]').textContent}));
  yes('  ■ Stop stops it, and the page goes dark', !L3.on && !L3.lit && /Listen along/.test(L3.btn), L3);
  await p.evaluate(() => document.querySelector('[data-sylisten]').click()); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('#scPlayRow [data-plxgo]').click()); await p.waitForTimeout(1500);
  const L4 = await p.evaluate(() => ({listen: !!_syncListen, playing: !!document.querySelector('#scPlayRow .plx-bar')._plx.player && document.querySelector('#scPlayRow .plx-bar')._plx.player.running}));
  yes('  pressing the score\'s own ▶ Play gives the recording way', !L4.listen && L4.playing, L4);
  await p.evaluate(() => scorePlayStopAll());

  console.log('\n6. a map on its own');
  await open(ids.copy);
  await p.click('[data-scside="recordings"]'); await p.waitForTimeout(400);
  await p.evaluate(([id, json]) => syncMapLoad(scoreById(id), json), [ids.copy, exported]);
  await p.waitForTimeout(700);
  const I = await p.evaluate(id => { const x = scoreById(id); const card = document.querySelector('.sy-rec');
    return {n: x.recordings.length, miss: card && !card.querySelector('.sy-missing').hidden, listen: card && card.querySelector('[data-sylisten]').disabled}; }, ids.copy);
  yes('a map loaded onto the same score is kept — and says its audio is not here, and cannot be played', I.n === 1 && I.miss && I.listen, I);
  await p.evaluate(async id => { const x = scoreById(id); await syncReattach(x, x.recordings[0].id, window.__wav); }, ids.copy);
  await p.waitForTimeout(700);
  const I2 = await p.evaluate(id => { const x = scoreById(id); const card = document.querySelector('.sy-rec');
    return {miss: !card.querySelector('.sy-missing').hidden, listen: card.querySelector('[data-sylisten]').disabled, name: x.recordings[0].name}; }, ids.copy);
  yes('  choosing its file again brings it back', !I2.miss && !I2.listen && /my run-through/.test(I2.name), I2);
  const wrongLen = await p.evaluate(async id => { const x = scoreById(id); const before = document.querySelectorAll('.toast').length;
    const shortWav = new File([window.__wav.slice(0, 44 + 22050 * 2 * 8)], 'short.wav', {type: 'audio/wav'});
    await syncReattach(x, x.recordings[0].id, shortWav); return [...document.querySelectorAll('.toast')].map(t => t.textContent).slice(-1)[0] || ''; }, ids.copy);
  yes('  a different recording is refused: its length says it is not the one', /Choose the same recording/.test(wrongLen), wrongLen);
  const other = await p.evaluate(([id, json]) => { syncMapLoad(scoreById(id), json); return {n: scoreById(id).recordings.length, said: [...document.querySelectorAll('.toast')].map(t => t.textContent).slice(-1)[0]}; }, [ids.other, exported]);
  yes('a map made for another score is refused', other.n === 0 && /another score/.test(other.said), other);

  console.log('\n7. deleting');
  await open(ids.chorale);
  await p.click('[data-scside="recordings"]'); await p.waitForTimeout(400);
  const rid = await p.evaluate(id => scoreById(id).recordings[0].id, ids.chorale);
  await p.click('[data-sydel]'); await p.waitForTimeout(900);
  const D1 = await p.evaluate(async ([id, rid]) => ({n: scoreById(id).recordings.length, audio: !!(await db.scoreAudio.get(rid))}), [ids.chorale, rid]);
  yes('× takes it off the piece at once, but the audio waits out the undo', D1.n === 0 && D1.audio, D1);
  await p.evaluate(() => { const b = [...document.querySelectorAll('.toast-act')].pop(); if(b) b.click(); });
  await p.waitForTimeout(12000);
  const D2 = await p.evaluate(async ([id, rid]) => ({n: scoreById(id).recordings.length, audio: !!(await db.scoreAudio.get(rid))}), [ids.chorale, rid]);
  yes('  Undo brings it back whole, audio and all, even after the undo time', D2.n === 1 && D2.audio, D2);
  await p.click('[data-sydel]'); await p.waitForTimeout(11500);
  const D3 = await p.evaluate(async ([id, rid]) => ({n: scoreById(id).recordings.length, audio: !!(await db.scoreAudio.get(rid))}), [ids.chorale, rid]);
  yes('  left alone, the audio is gone once the undo has run out', D3.n === 0 && !D3.audio, D3);

  console.log('\n8. a file that is not audio');
  await p.evaluate(id => syncRecordingAdd(scoreById(id), new File(['this is not a recording'], 'notes.txt', {type: 'text/plain'})), ids.chorale);
  await p.waitForTimeout(400);
  const X = await p.evaluate(() => ({err: (document.querySelector('.sy-job.err .sy-job-t') || {}).textContent || '', add: !document.querySelector('[data-syadd]').disabled}));
  yes('is said plainly, and another can be tried', /cannot read that file as audio/.test(X.err) && X.add, X);
  await p.evaluate(() => document.querySelector('[data-syjobclose]').click());

  console.log('\n9. on a phone');
  await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(800);
  await p.evaluate(([id, json]) => syncMapLoad(scoreById(id), json), [ids.chorale, exported]); await p.waitForTimeout(700);
  const W = await p.evaluate(() => { const s = document.getElementById('scSide'); const r = s.getBoundingClientRect();
    const over = [...s.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > innerWidth + 1; }).map(e => e.className).slice(0, 4);
    return {doc: document.documentElement.scrollWidth, w: innerWidth, over, cells: s.querySelectorAll('.sy-cell').length}; });
  yes('nothing runs off a 390-pixel screen', W.doc <= W.w + 1 && !W.over.length && W.cells > 20, W);

  console.log('');
  if(errs.length){ bad += errs.length; errs.forEach(e => console.log('  FAIL ' + e)); }
  console.log(bad ? `${bad} FAILED` : 'all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
