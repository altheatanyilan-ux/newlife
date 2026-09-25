/* test-sync — Recording sync, Phase 1: unit tests for the sync map.

   The functions are plain data in, plain data out, so they are tested
   here directly under Node: the real source files are loaded into one
   context, as the build joins them, with nothing of the page around them.

   WHAT IS CLAIMED.
   1. A place in the music is one number and back again: chorus, measure
      and beat (fractional beats too, and bars of changing metre).
   2. scoreToAudioTime interpolates between sync points, on the beat and
      between beats, and carries the edge tempo past the ends.
   3. audioToScoreTime is its inverse inside the form, and says
      'unmapped' in an intro, an ending, and outside the points; it names
      the head or the solo from the performance order.
   4. getTempoCurve gives the tempo played between points — a steady
      tempo, a ritardando, a smoothed curve.
   5. Points that would run backwards are left out, so the map is always
      invertible; a tempo lurch of more than 40% is found unless it is a
      fermata.
   6. Unrolling: repeats, 1st/2nd endings, D.C. al Fine, D.S. al Coda
      from the road map; the tune database's charts in the order their
      form says (Autumn Leaves AABC, So What AABA in eights, a blues as
      written), split bars and bar counts in parentheses.
   7. Export carries the map and never anything else hung on it.

   Run: node test-sync.js */
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({console, Math, JSON, Date, addEventListener(){}, window: {}, document: {addEventListener(){}}});
for(const f of ['19-jazz-p-tunedb.js', '19-jazz-q-tunes.js', '19-score-play.js', '19-sync-a-map.js']){
  try { vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'), ctx, {filename: f}); }
  catch(e){ if(f !== '19-score-play.js') throw e; /* its page wiring; the road map is declared above it */ }
}
const X = s => vm.runInContext(s, ctx);
const G = new Proxy({}, {get: (_, k) => X(k)});
let bad = 0, n = 0;
const ok  = (m, x='') => { n++; console.log(`  ok   ${m}${x ? '  — ' + x : ''}`); };
const no  = (m, g='') => { n++; bad++; console.log(`  FAIL ${m}${g !== '' ? '  — ' + g : ''}`); };
const yes = (m, c, g='') => c ? ok(m) : no(m, typeof g === 'string' ? g : JSON.stringify(g));
const near = (a, b, e = 1e-6) => a != null && b != null && Math.abs(a - b) <= e;

/* a map: 8 bars of 4/4 a chorus, played at 120 (half a second a beat)
   with a 4-second intro, three choruses, then 5 seconds of applause */
function steadyMap(){
  const m = G.syncMapNew({pieceId: 'p1', recordingId: 'r1', form: {measures: 8, beats: 4}});
  const beat = 0.5, intro = 4;
  for(let c = 1; c <= 3; c++) for(let bar = 1; bar <= 8; bar++)
    m.syncPoints.push({chorus: c, measure: bar, beat: 1, time: intro + ((c - 1) * 32 + (bar - 1) * 4) * beat, confidence: 0.9});
  /* the last downbeat after the last bar, where the head out ends */
  m.syncPoints.push({chorus: 4, measure: 1, beat: 1, time: intro + 96 * beat, confidence: 0.9});
  const end = intro + 96 * beat;
  m.performanceOrder = [
    {label: 'Intro', type: 'unmapped', chorus: null, audioStart: 0, audioEnd: intro},
    {label: 'Head', type: 'head', chorus: 1, audioStart: intro, audioEnd: intro + 16},
    {label: 'Solo 1', type: 'solo', chorus: 2, audioStart: intro + 16, audioEnd: intro + 32},
    {label: 'Head out', type: 'head', chorus: 3, audioStart: intro + 32, audioEnd: end},
    {label: 'Applause', type: 'unmapped', chorus: null, audioStart: end, audioEnd: end + 5}];
  return m;
}

console.log('\n1. a place in the music as one number');
{
  const m = G.syncMapNew({form: {measures: 8, beats: 4}});
  yes('bar 1 beat 1 of chorus 1 is the top', G.syncPos(m, 1, 1, 1) === 0);
  yes('bar 3 beat 2.5 of chorus 2 is 32 + 8 + 1.5 beats in', G.syncPos(m, 2, 3, 2.5) === 41.5);
  yes('a measure past the end of the chorus runs on into the next', G.syncPos(m, 1, 9, 1) === G.syncPos(m, 2, 1, 1));
  const back = G.syncPlace(m, 41.5);
  yes('and back again: chorus 2, bar 3, beat 2.5', back.chorus === 2 && back.measure === 3 && back.beat === 2.5, back);
  const w = G.syncMapNew({form: {measures: 4, beats: 4, measureBeats: [4, 3, 3, 4]}});
  yes('a bar of 3/4 among bars of 4/4 is three beats long', G.syncPos(w, 1, 3, 1) === 7 && G.syncPos(w, 2, 1, 1) === 14);
  const p = G.syncPlace(w, 9.5);
  yes('  and a place inside it reads back as its own beat', p.measure === 3 && p.beat === 3.5, p);
}

console.log('\n2. scoreToAudioTime');
{
  const m = steadyMap();
  yes('a sync point is heard at its own time', near(G.scoreToAudioTime(m, 2, 5, 1), 4 + (32 + 16) * 0.5));
  yes('between points it is interpolated: beat 3 of bar 1 is a second in', near(G.scoreToAudioTime(m, 1, 1, 3), 5));
  yes('fractional beats: the "and" of 2 is three quarters of a second in', near(G.scoreToAudioTime(m, 1, 1, 2.5), 4.75));
  yes('the beat can be left out: the downbeat', near(G.scoreToAudioTime(m, 1, 2), 6));
  yes('past the last point the last tempo carries on', near(G.scoreToAudioTime(m, 4, 1, 3), 4 + 98 * 0.5));
  /* a rubato map: the points are not evenly spaced */
  const r = G.syncMapNew({form: {measures: 2, beats: 4}});
  r.syncPoints = [{chorus: 1, measure: 1, beat: 1, time: 10}, {chorus: 1, measure: 2, beat: 1, time: 12},
    {chorus: 1, measure: 2, beat: 3, time: 14}, {chorus: 2, measure: 1, beat: 1, time: 15}];
  yes('rubato: beat 2 of bar 2 is halfway between its two points', near(G.scoreToAudioTime(r, 1, 2, 2), 13));
  yes('  and beat 4 of bar 2 is halfway to the next chorus', near(G.scoreToAudioTime(r, 1, 2, 4), 14.5));
  yes('the points can come in any order', (() => { const s = G.syncMapNew(r); s.syncPoints.reverse(); return near(G.scoreToAudioTime(s, 1, 2, 2), 13); })());
  yes('a map with no points says nothing', G.scoreToAudioTime(G.syncMapNew({}), 1, 1, 1) === null);
}

console.log('\n3. audioToScoreTime');
{
  const m = steadyMap();
  const a = G.audioToScoreTime(m, 4 + 16 + 5.25);
  yes('10.5 beats into the solo is chorus 2, bar 3, beat 3.5', a.chorus === 2 && a.measure === 3 && a.beat === 3.5 && a.sectionType === 'solo', a);
  yes('the head is the head', G.audioToScoreTime(m, 4.1).sectionType === 'head' && G.audioToScoreTime(m, 40).sectionType === 'head');
  const i = G.audioToScoreTime(m, 2);
  yes('the intro is unmapped, and says so', i.sectionType === 'unmapped' && i.chorus === null && i.label === 'Intro', i);
  yes('the applause after the last chord is unmapped', G.audioToScoreTime(m, 53).sectionType === 'unmapped');
  yes('a time past everything is unmapped', G.audioToScoreTime(m, 500).sectionType === 'unmapped');
  let worst = 0;
  for(let c = 1; c <= 3; c++) for(let bar = 1; bar <= 8; bar++) for(const b of [1, 1.25, 2.5, 3, 4.75]){
    const t = G.scoreToAudioTime(m, c, bar, b), back = G.audioToScoreTime(m, t);
    worst = Math.max(worst, Math.abs(G.syncPos(m, back.chorus, back.measure, back.beat) - G.syncPos(m, c, bar, b)));
  }
  yes('the two directions are inverses, beat for beat, across three choruses', worst < 1e-6, worst);
  const r = G.syncMapNew({form: {measures: 2, beats: 4}});
  r.syncPoints = [{chorus: 1, measure: 1, beat: 1, time: 10}, {chorus: 1, measure: 2, beat: 1, time: 12}, {chorus: 1, measure: 2, beat: 3, time: 14}, {chorus: 2, measure: 1, beat: 1, time: 15}];
  const q = G.audioToScoreTime(r, 14.5);
  yes('with no performance order, inside the points is the form', q.measure === 2 && q.beat === 4 && q.sectionType === 'head', q);
  yes('  and before the first point is unmapped', G.audioToScoreTime(r, 9).sectionType === 'unmapped');
}

console.log('\n4. getTempoCurve');
{
  const m = steadyMap();
  const tc = G.getTempoCurve(m);
  yes('a steady 120 reads 120 all the way', tc.length === 24 && tc.every(x => near(x.bpm, 120)), tc.slice(0, 2));
  yes('each stretch says where it starts', tc[8].chorus === 2 && tc[8].measure === 1 && near(tc[8].start, 20));
  /* a ritardando: each bar 10% longer than the one before */
  const r = G.syncMapNew({form: {measures: 4, beats: 4}});
  let t = 0, d = 2;
  for(let bar = 1; bar <= 4; bar++){ r.syncPoints.push({chorus: 1, measure: bar, beat: 1, time: t}); t += d; d *= 1.1; }
  r.syncPoints.push({chorus: 2, measure: 1, beat: 1, time: t});
  const rc = G.getTempoCurve(r);
  yes('a ritardando: 120, 109, 99, 90', rc.map(x => Math.round(x.bpm)).join() === '120,109,99,90', rc.map(x => x.bpm));
  const sm = G.getTempoCurve(r, {smooth: 4});
  yes('smoothed over a bar either side, it still slows, but more gently',
    sm[0].bpm < rc[0].bpm && sm[3].bpm > rc[3].bpm && sm[0].bpm > sm[3].bpm, sm.map(x => x.bpm));
}

console.log('\n5. a map that can always be inverted');
{
  const m = G.syncMapNew({form: {measures: 4, beats: 4}});
  m.syncPoints = [{chorus: 1, measure: 1, beat: 1, time: 0}, {chorus: 1, measure: 2, beat: 1, time: 2},
    {chorus: 1, measure: 1, beat: 3, time: 3} /* backwards */, {chorus: 1, measure: 3, beat: 1, time: 4}];
  yes('a point that would run the music backwards is left out', G.syncTrack(m).P.length === 3);
  yes('  and the map is still one-to-one', near(G.scoreToAudioTime(m, 1, 2, 3), 3));
  const j = G.syncMapNew({form: {measures: 4, beats: 4}});
  j.syncPoints = [0, 2, 4, 7, 9].map((time, k) => ({chorus: 1 + Math.floor(k / 4), measure: k % 4 + 1, beat: 1, time}));
  const pr = G.syncMapProblems(j);
  yes('a bar 50% longer than the one before is a lurch', pr.some(p => p.why === 'tempo jump' && p.measure === 3), pr);
  yes('  unless that bar has a fermata', !G.syncMapProblems(j, new Set([3])).some(p => p.why === 'tempo jump' && p.measure === 3));
}

console.log('\n6. unrolling');
{
  const R = info => Array.from(G.plxRoadMap(info)).join(',');
  const bars = k => [...Array(k)].map(() => ({}));
  let b = bars(4); b[3].back = 2;
  yes('a repeat: 0-3 twice', R(b) === '0,1,2,3,0,1,2,3');
  b = bars(6); b[0].fwd = true; b[3].ending = [1]; b[3].back = 2; b[4].ending = [2]; b[4].endingStop = true;
  yes('1st and 2nd endings', R(b) === '0,1,2,3,0,1,2,4,5', R(b));
  b = bars(6); b[2].fine = true; b[5].dacapo = true;
  yes('D.C. al Fine', R(b) === '0,1,2,3,4,5,0,1,2', R(b));
  b = bars(8); b[1].segno = 'segno'; b[3].tocoda = 'coda'; b[5].dalsegno = 'segno'; b[6].coda = 'coda';
  yes('D.S. al Coda', R(b) === '0,1,2,3,4,5,1,2,3,6,7', R(b));
  b = bars(5); b[1].fwd = true; b[2].back = 3;
  yes('a repeat played three times', R(b) === '0,1,2,1,2,1,2,3,4', R(b));

  const N = info => Array.from(G.syncRoadMapNoRepeats(info)).join(',');
  b = bars(6); b[0].fwd = true; b[3].ending = [1]; b[3].back = 2; b[3].endingStop = true; b[4].ending = [2]; b[4].endingStop = true;
  yes('without the repeat: straight through, the first ending left out', N(b) === '0,1,2,4,5', N(b));
  b = bars(8); b[2].back = 2; b[3].fine = true; b[7].dacapo = true;
  yes('  a D.C. al Fine is still taken, the repeat is not', N(b) === '0,1,2,3,4,5,6,7,0,1,2,3', N(b));
  b = bars(10); b[0].fwd = true; b[3].back = 2; b[4].fwd = true; b[6].ending = [1]; b[6].back = 2; b[6].endingStop = true; b[7].ending = [2]; b[7].endingStop = true;
  const rd = Array.from(G.syncRoadMapReadings(b)).map(r => r.how + ':' + Array.from(r.order).join(''));
  yes('every combination of repeats: all, the first alone skipped, the second alone skipped, none',
    rd.join(' | ') === 'as written:0123012345645789 | skipping the repeat at bar 4:012345645789 | skipping the repeat at bar 7:0123012345789 | without the repeats:012345789', rd);
  const tune = id => X(`REAL_BOOK_TUNE_DATABASE.find(t => t.id === ${JSON.stringify(id)})`);
  const al = G.syncUnrollChart(tune('autumn-leaves'));
  yes('Autumn Leaves: its three written sections become the 32 bars of AABC', al.measures === 32 && al.how === 'first section repeated'
    && al.sections.map(s => s.label + s.length).join() === 'A8,A8,B8,C8' && !al.mismatch, {how: al.how, s: al.sections});
  yes('  bar 9 is the A again: Am7', al.bars[8].chords[0].text === 'Am7');
  yes('  and bar 27 is split, Em7 then Eb7, two beats each',
    al.bars[26].chords.map(c => c.text + ':' + c.beats + '@' + c.at).join() === 'Em7:2@0,Eb7:2@2', al.bars[26].chords);
  const sw = G.syncUnrollChart(tune('so-what'));
  yes('So What: sixteen, eight and eight bars from the numbers in parentheses', sw.measures === 32 && sw.bars[15].chords[0].text === 'Dm7'
    && sw.bars[16].chords[0].text === 'Ebm7' && sw.bars[24].chords[0].text === 'Dm7');
  yes('  lettered AABA by the form', sw.sections.map(s => s.label + s.start).join() === 'A1,A9,B17,A25', sw.sections);
  const ap = G.syncUnrollChart(tune('au-privave'));
  yes('Au Privave: a blues as written, 12 bars', ap.measures === 12 && ap.how === 'as written' && !ap.mismatch);
  yes('  with its chords by beat, 48 of them, C7 on the last two', (() => { const pb = G.syncChordsPerBeat(ap);
    return pb.length === 48 && pb[46].chord.text === 'C7' && pb[44].chord.text === 'Gm7'; })());
  const vamp = G.syncUnrollChart({chordProgression: 'A: Go7(vamp)|Fm FINE B: F7|Gbo7|F#7|Bb7 D.C. al FINE', timeSignature: '4/4'});
  yes('a chart that says D.C. al FINE is played A, B, then A to the Fine', vamp.bars.map(x => x.chords[0].text).join() === 'Go7,Fm,F7,Gbo7,F#7,Bb7,Go7,Fm',
    vamp.bars.map(x => x.chords[0] && x.chords[0].text));
  const mfv = G.syncUnrollChart(tune('my-funny-valentine'));
  yes('a chart that cannot be made to fit its bar count says so', mfv.mismatch === true && mfv.measures > 0, {how: mfv.how, n: mfv.measures});
  const w = G.syncUnrollChart({chordProgression: 'Dm7|G7|CM7|CM7', timeSignature: '3/4'});
  yes('a waltz is three beats a bar', w.beats === 3 && G.syncChordsPerBeat(w).length === 12);
  const f = G.syncMapNew({form: G.syncFormOf(al)});
  yes('the unrolled chart is the map\'s form', f.form.measures === 32 && f.form.beats === 4);
}

console.log('\n7. export and import');
{
  const m = steadyMap();
  m.audioBuffer = {huge: true}; m.blob = 'audio bytes';
  const js = G.syncMapExport([m]);
  yes('export is the map only — no audio, nothing hung on it', !/audio bytes|huge/.test(js) && /"syncPoints"/.test(js));
  const back = G.syncMapImport(js)[0];
  yes('and it comes back whole', back.syncPoints.length === m.syncPoints.length && back.performanceOrder.length === 5
    && near(G.scoreToAudioTime(back, 2, 3, 2.5), G.scoreToAudioTime(m, 2, 3, 2.5)));
  let threw = false; try { G.syncMapImport('{"maps":[]}'); } catch(e){ threw = true; }
  yes('a file that is not sync maps is refused', threw);
}

console.log(bad ? `\n${bad} of ${n} FAILED` : `\nall ${n} good`);
process.exit(bad ? 1 : 0);
