/* smoke261 — syncing a recording that plays quick notes and bends the tempo.

   The claims.

   THE SCORE AS A BASELINE. The engine is handed, bar by bar, the score's
   own notes — where each falls in the bar, how long, how loud — with the
   bar's written tempo and its tempo words (rit., accel.), so it can play
   the score through as a reference and follow it, rather than following
   the recording's harmony alone.

   TWO WAYS, AND THE ONE THE RECORDING AGREES WITH. For a score played once
   through, the engine places the bars both ways — along the coarse
   harmonic path, and along the score-reference path with its rubato plan —
   and keeps the placement whose frames fit the harmony of the beats they
   fall in better. The two fits and the choice are in the diagnostics.

   THE RESULT. A 16-bar piece rendered here on the grand piano, with
   running sixteenths in bars 5–12, an accelerando into bar 12 and a
   marked rit. to half tempo at the end: at least 85% of its downbeats are
   found within 100 ms of where they were played.

   The ten real performances are measured by test-sync-accuracy.js
   (docs/sync/phase2-accuracy.md); this is the smoke that the path is
   wired through the Worker in the built page.

   Run: NODE_PATH=node_modules node smoke261.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const STEP = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'], ALT = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
const pitch = m => `<pitch><step>${STEP[m % 12]}</step>${ALT[m % 12] ? '<alter>1</alter>' : ''}<octave>${Math.floor(m / 12) - 1}</octave></pitch>`;
const n = (m, d, v = 1, extra = '') => `<note>${pitch(m)}<duration>${d}</duration><voice>${v}</voice>${extra}</note>`;
/* C major, 4/4, ♩=96: a melody in quarters, then running sixteenths, then the close under a rit. */
const HARM = [[60, 48], [65, 53], [67, 55], [60, 48], [57, 45], [62, 50], [67, 55], [60, 48], [64, 52], [65, 53], [62, 50], [67, 55], [60, 48], [65, 53], [67, 55], [60, 48]];
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 12, 11, 9, 7, 5, 4, 2];
function xml(){
  const bars = HARM.map(([top, bass], b) => {
    const k = b + 1;
    let rh = '';
    if(k >= 5 && k <= 12) rh = SCALE.map(s => n(top + s, 1)).join('');
    else rh = [0, 4, 7, 4].map(s => n(top + s, 4)).join('');
    const lh = [0, 7, 12, 7].map(s => n(bass - 12 + s, 4, 2)).join('');
    return `<measure number="${k}">${k === 1 ? '<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>96</per-minute></metronome></direction-type><sound tempo="96"/></direction>' : ''}${
      k === 13 ? '<direction><direction-type><words>rit.</words></direction-type></direction>' : ''}${rh}<backup><duration>16</duration></backup>${lh}</measure>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bars}</part></score-partwise>`;
}
/* how it was played: ♩=96 with a player's small give, pressing on to ♩=118
   through the sixteenths, then a rit. to ♩=48 over the last four bars */
function beatDurs(){
  const d = [];
  for(let b = 0; b < 64; b++){
    const bar = Math.floor(b / 4) + 1;
    let bpm = 96 * (1 + 0.035 * Math.sin(b * 1.7));
    if(bar >= 9 && bar <= 12) bpm = 96 + (118 - 96) * ((b - 32) / 16);
    if(bar >= 13) bpm = 104 - (104 - 48) * Math.pow((b - 48) / 15, 1.3);
    d.push(60 / bpm);
  }
  return d;
}

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  const R = await p.evaluate(async ([x, durs]) => {
    const score = syncScoreFromMusicXml(x);
    const bar1 = score.bars[0], bar13 = score.bars[12];
    /* the performance, rendered to the plan above on the grand */
    await grandPianoLoad();
    const T = [0.6]; durs.forEach((d, i) => T.push(T[i] + d));
    const at = q => { const i = Math.min(63, Math.floor(q)); return T[i] + (q - i) * durs[i]; };
    const tl = musicXmlTimeline(x), sr = 22050, len = T[64] + 2.5;
    const ctx = new OfflineAudioContext(1, Math.ceil(sr * len), sr);
    tl.events.forEach(e => { const t0 = at(e.q), t1 = at(e.q + e.d);
      grandPianoNote(ctx, ctx.destination, e.midi, t0, Math.max(0.05, (t1 - t0) * 0.95), 0.55 + 0.1 * Math.sin(e.q), null, 0.6); });
    const pcm = (await ctx.startRendering()).getChannelData(0);
    const res = await syncAlign({pcm, sr}, score, {});
    const pts = res.syncMap.syncPoints.filter(s => s.chorus === 1 && s.beat === 1);
    const errs = []; for(let m = 1; m <= 16; m++){ const s = pts.find(y => y.measure === m); errs.push(s ? Math.round((s.time - T[(m - 1) * 4]) * 1000) : null); }
    return {notes: [bar1.notes && bar1.notes.length, bar13.notes && bar13.notes.length], bpm: bar1.bpm, word: bar13.tempoWord,
      pick: res.diagnostics.pick, inWorker: res.inWorker, errs};
  }, [xml(), beatDurs()]);

  console.log('\n1. the score as a baseline');
  yes('each bar carries its own notes (bar 1: 8, bar 13: 8), its tempo (♩=96) and its words (rit. at bar 13)',
    R.notes[0] === 8 && R.notes[1] === 8 && R.bpm === 96 && R.word === 'rit', R);

  console.log('\n2. two ways, and the one the recording agrees with');
  const pk = R.pick;
  yes('both placements are measured: the harmony along each, the attacks found', pk && pk.old && pk.ref && typeof pk.old.chroma === 'number' && typeof pk.ref.chroma === 'number', pk);
  yes('  and the one kept is the one the harmony fits better', pk && pk.used === (pk.ref.chroma > pk.old.chroma ? 'reference' : 'coarse'), pk);
  yes('  in the Worker, as in the room', R.inWorker === true);

  console.log('\n3. the result');
  const good = R.errs.filter(e => e != null && Math.abs(e) <= 100).length;
  yes(`${good} of 16 downbeats within 100 ms (running sixteenths, an accelerando, a rit. to half tempo)`, good >= 14, R.errs);
  yes('  and every one within 250 ms', R.errs.every(e => e != null && Math.abs(e) <= 250), R.errs);

  yes('no page errors', !errs.length, errs);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
