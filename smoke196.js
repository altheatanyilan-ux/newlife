/* smoke196 — the metronome.

   It is in the score room because the room shows you a score and cannot play
   it. A metronome is the one thing that turns reading into practising: it
   makes "slowly" a number rather than a feeling, and it hears the thing you
   cannot hear yourself doing, which is speeding up in the easy bar and
   slowing down in the hard one.

   Two claims carry it.

   IT DOES NOT DRIFT. The obvious build is setInterval at 60000/bpm and it is
   wrong: that timer runs on the main thread and slips every time anything
   else happens — a render, a save, a scroll — and it slips one way. Inside a
   minute it is audibly not the tempo asked for, which is worse than no
   metronome because you will have trusted it. So a short timer only looks
   ahead and every click is booked at an exact time on the audio clock, which
   is a different clock and does not slip.

   AND IT BELONGS TO THE PIECE. The tempo is stored on the score, because
   coming back tomorrow to find the click at somebody else's number is a small
   wrong thing that happens every single time. The beats in a bar are read off
   the notation rather than assumed to be four. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* a waltz, so the accent has somewhere to be that is not every fourth beat */
const part = (id, bars, beats) => `    <part id="${id}">
      <measure number="1"><attributes><divisions>1</divisions><key><fifths>-1</fifths></key>
        <time><beats>${beats}</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef></attributes>
        ${Array.from({length:beats},()=>'<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>').join('')}</measure>
${Array.from({length: bars-1}, (_,i)=>`      <measure number="${i+2}">${Array.from({length:beats},()=>'<note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>').join('')}</measure>`).join('\n')}
    </part>`;
const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>In Three</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
${part('P1', 12, 3)}
</score-partwise>`;

/* D major, a chord, an off-beat and a rest — everything the layers have to
   have an opinion about */
const KEYED = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>In D</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1"><attributes><divisions>2</divisions><key><fifths>2</fifths><mode>major</mode></key>
      <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><chord/><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><chord/><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note>
      <note><pitch><step>C</step><alter>1</alter><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note>
      <note><rest/><duration>2</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(1300);
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'In Three.musicxml')); }, XML);
  await p.waitForTimeout(5000);

  console.log('\n1. it reads the bar off the score');
  is('three four, from the notation', await p.evaluate(() => scoreTimeSignature()), {beats:3, unit:4});
  await p.evaluate(() => document.querySelector('#scMore').click());
  await p.waitForTimeout(1500);
  const ctrl = await p.evaluate(() => ({
    play: !!document.querySelector('#scMetro'), bpm: document.querySelector('#scBpmIn')?.value,
    per: document.querySelector('#scPer')?.value, tap: !!document.querySelector('#scTap'),
    pulse: !!document.querySelector('#scPulse')}));
  yes('the controls are there', ctrl.play && ctrl.tap && ctrl.pulse, JSON.stringify(ctrl));
  is('  and the beats in a bar are three, not the usual four', ctrl.per, '3');

  console.log('\n2. it does not drift, and the main thread cannot make it');
  /* The measurement is of the time each click was BOOKED on the audio clock,
     not of when the page heard about it: the listener runs on the main thread
     and is late whenever anything else is busy, while the sound is not.
     Measuring the listener would be measuring the wrong clock and would pass
     for a setInterval too.

     And the whole run happens while the main thread is being blocked for a
     tenth of a second at a time, which is a render or a save — the condition
     under which a timer-driven metronome slips, always in one direction. */
  const run = await p.evaluate(async () => {
    ScoreMetronome.setBpm(120); ScoreMetronome.setPerBar(3);
    ScoreMetronome.start();
    await new Promise(r => setTimeout(r, 200));
    const beats = [];
    const off = ScoreMetronome.onBeat(x => beats.push({when: x.when, strong: x.strong}));
    /* jam the thread the way a busy page would */
    const jam = setInterval(() => { const until = performance.now() + 110;
      while(performance.now() < until){} }, 260);
    await new Promise(r => setTimeout(r, 6500));
    clearInterval(jam);
    off(); ScoreMetronome.stop();
    const gaps = beats.slice(1).map((x, i) => (x.when - beats[i].when) * 1000);
    return {n: beats.length, gaps: gaps.map(g => Math.round(g)),
      strongs: beats.map(x => x.strong), stopped: !ScoreMetronome.running};
  });
  yes('it clicked a dozen times', run.n >= 10, String(run.n));
  /* 120 to the minute is 500ms, and EVERY gap has to be that — not their
     average, which a drifting timer also passes */
  const worst = Math.max(...run.gaps.map(g => Math.abs(g - 500)));
  yes('  every gap is the tempo asked for, under load', worst <= 8, `worst ${worst}ms off 500`);
  /* drift is cumulative, so the end is where a timer gives itself away */
  yes('  and the last is as good as the first',
    Math.abs(run.gaps[run.gaps.length - 1] - 500) <= 8, JSON.stringify(run.gaps.slice(-3)));
  const span = run.gaps.reduce((a, c) => a + c, 0);
  yes('  so a dozen beats take a dozen beats\' worth of time',
    Math.abs(span - run.gaps.length * 500) <= 12, `${span}ms for ${run.gaps.length} beats`);
  yes('stopping stops it', run.stopped);

  console.log('\n3. the accent is where the bar starts');
  /* every third beat in three four, which is the whole reason the room reads
     the time signature rather than assuming four */
  const marks = run.strongs.map(s => s ? 1 : 0);
  const firstStrong = marks.indexOf(1);
  yes('there is a downbeat', firstStrong > -1, JSON.stringify(marks));
  yes('  and it comes round every three',
    marks.every((v, i) => i < firstStrong || v === ((i - firstStrong) % 3 === 0 ? 1 : 0)),
    JSON.stringify(marks));
  const inFour = await p.evaluate(async () => {
    ScoreMetronome.setBpm(240); ScoreMetronome.setPerBar(4); ScoreMetronome.start();
    const beats = [];
    const off = ScoreMetronome.onBeat(x => beats.push(x.strong ? 1 : 0));
    await new Promise(r => setTimeout(r, 2600));
    off(); ScoreMetronome.stop();
    return beats; });
  const f = inFour.indexOf(1);
  yes('told four, it counts four',
    f > -1 && inFour.every((v, i) => i < f || v === ((i - f) % 4 === 0 ? 1 : 0)), JSON.stringify(inFour));

  console.log('\n4. tap tempo');
  const tapped = await p.evaluate(async () => {
    scoreTapReset();
    const seen = [];
    for(let i = 0; i < 5; i++){ seen.push(scoreTapTempo()); await new Promise(r => setTimeout(r, 500)); }
    return seen; });
  is('one tap is not a tempo', tapped[0], null);
  yes('  half a second apart is a hundred and twenty',
    tapped.slice(1).every(v => Math.abs(v - 120) <= 6), JSON.stringify(tapped));
  /* a tap long after the last one starts the count again rather than being
     averaged into it — otherwise the first tempo you ever set is permanent */
  const restart = await p.evaluate(async () => {
    scoreTapReset();
    await new Promise(r => setTimeout(r, 10));
    scoreTapTempo(); await new Promise(r => setTimeout(r, 250)); scoreTapTempo();
    const fast = scoreTapTempo();
    await new Promise(r => setTimeout(r, 3000));
    const after = scoreTapTempo();
    return {fast, after, count: scoreTapCount()}; });
  is('a tap after a long silence starts again', [restart.after, restart.count], [null, 1]);

  console.log('\n5. the tempo belongs to the piece');
  const kept = await p.evaluate(() => {
    const x = scores()[0];
    const el = document.querySelector('#scBpmIn');
    el.value = '132'; el.dispatchEvent(new Event('change'));
    return {onScore: x.metronome.bpm, onMetro: ScoreMetronome.bpm}; });
  is('setting it writes it on the score', [kept.onScore, kept.onMetro], [132, 132]);
  const reopened = await p.evaluate(() => { const x = scores()[0];
    /* the same thing the next visit does: build the record again from the save */
    scoreDefaults(x); return x.metronome.bpm; });
  is('  and it is still there when the piece is opened again', reopened, 132);
  is('  a tempo nobody could play is refused rather than accepted',
    await p.evaluate(() => ScoreMetronome.setBpm(9000)), 300);

  console.log('\n6. it is not the house\'s chimes');
  /* Turning off the interface sounds says you do not want to be pinged at. It
     does not say you do not want a metronome, and a metronome that goes quiet
     because the page's click did is a bug you would never guess the cause of. */
  const apart = await p.evaluate(async () => {
    SoundManager.setSound(false);
    const started = ScoreMetronome.start();
    const heard = await new Promise(r => { let n = 0;
      const off = ScoreMetronome.onBeat(() => { n++; });
      setTimeout(() => { off(); r(n); }, 1200); });
    ScoreMetronome.stop();
    return {started, heard, houseOff: !SoundManager.state().soundEnabled};
  });
  yes('the house is muted', apart.houseOff);
  yes('  and the metronome still runs', apart.started && apart.heard > 0, JSON.stringify(apart));

  console.log('\n7. it stops when you leave');
  const left = await p.evaluate(async () => {
    ScoreMetronome.start();
    const was = ScoreMetronome.running;
    location.hash = '#/today';
    await new Promise(r => setTimeout(r, 900));
    return {was, now: ScoreMetronome.running}; });
  is('a click does not follow you out of the room', [left.was, left.now], [true, false]);

  console.log('\n8. what the notation says, flattened');
  /* Everything the layers, the chord reading, the fingerings and the cursor
     need comes from one place, so there is one thing to repair if the
     engraver is ever swapped out rather than five. */
  await p.evaluate(() => { location.hash = '#/score'; scoreUi().id = null; rerender(); });
  await p.waitForTimeout(1300);
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'In D.musicxml')); }, KEYED);
  await p.waitForTimeout(5000);
  const read = await p.evaluate(() => scoreNotes().map(n =>
    ({m:n.measure, midi:n.midi, letter:noteLetter(n), beat:+n.beat.toFixed(2), rest:n.rest})));
  is('every note, with its pitch and its place in the bar',
    read.map(n => [n.letter, n.beat]),
    [['D',0],['F♯',0],['A',0],['G',1],['B',2],['C♯',2.5],['',3]]);
  is('  a chord is three notes at one moment', read.filter(n => n.beat === 0).length, 3);
  is('  and a rest is a moment with no pitch in it',
    [read[6].rest, read[6].midi], [true, null]);
  /* the accidental is worked out from the pitch rather than read off a field
     whose enumeration puts "none" at two */
  is('sharps and flats are spelled', [read[1].letter, read[5].letter], ['F♯', 'C♯']);

  console.log('\n9. the key, and the degrees counted from it');
  const key = await p.evaluate(() => ({k: scoreKey(), name: scoreKeyName(),
    root: keyRootOf(scoreKey().fifths, scoreKey().minor)}));
  is('two sharps is D major', [key.k.fifths, key.k.minor], [2, false]);
  is('  named as such', key.name, 'D major');
  is('  and D is where the counting starts', key.root, 2);
  /* a minor key counts from its own tonic, not its relative major's: in D
     minor the answer is D, not F */
  is('a minor key counts from its own tonic',
    await p.evaluate(() => keyRootOf(-1, true)), 2);
  is('  while its relative major counts from F',
    await p.evaluate(() => keyRootOf(-1, false)), 5);

  console.log('\n10. the layers over the notation');
  const off = await p.evaluate(() => ({
    ov: scores().find(x => x.title === 'In D').overlays,
    drawn: document.querySelectorAll('.sc-lab').length}));
  yes('they start off, because the notation is the thing',
    !off.ov.names && !off.ov.degrees && !off.ov.beats, JSON.stringify(off.ov));
  is('  so nothing is written over it', off.drawn, 0);
  const on = await p.evaluate(() => {
    const x = scores().find(y => y.title === 'In D');
    x.overlays.names = x.overlays.degrees = x.overlays.beats = true;
    saveNow(); scoreLayersPaint(x);
    return {names: [...document.querySelectorAll('.sc-lab-name')].map(n => n.textContent),
      degs: [...document.querySelectorAll('.sc-lab-deg')].map(n => n.textContent),
      beats: [...document.querySelectorAll('.sc-lab-beat')].map(n => n.textContent)};
  });
  is('the letter of every note', on.names, ['D','F♯','A','G','B','C♯']);
  is('  its degree in the key it is in', on.degs, ['1','3','5','4','6','7']);
  /* not the degrees it would have in C, which is what reading the key off the
     wrong place gives you — D would be a 2 and F sharp a sharp 4 */
  yes('    counted from D rather than from C', on.degs[0] === '1' && on.degs[1] === '3',
    JSON.stringify(on.degs));
  is('  and the count under the bar, with the "and" between', on.beats, ['1','2','3','+','4']);
  /* the labels are measured in staff spaces, so the engraving can be any size
     and they stay where they belong rather than sitting on the notes */
  /* The gap between a note's letter and its degree, not the degree's distance
     from the left edge of the page: the page-edge distance doubles with the
     zoom whatever the offset is made of, so it would pass just as happily
     with the offset nailed at nine pixels — which is the bug. */
  const scaled = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'In D');
    const at = () => { const d = document.querySelector('.sc-lab-deg'),
        n = document.querySelector('.sc-lab-name');
      return {gap: parseFloat(d.style.left) - parseFloat(n.style.left),
        size: parseFloat(d.style.fontSize)}; };
    x.zoom = 1; await scoreRedraw(x); scoreLayersPaint(x);
    const small = at();
    x.zoom = 2; await scoreRedraw(x); scoreLayersPaint(x);
    const big = at();
    x.zoom = 1; await scoreRedraw(x); scoreLayersPaint(x);
    return {small, big};
  });
  yes('a bigger engraving gets bigger labels', scaled.big.size > scaled.small.size * 1.6,
    JSON.stringify(scaled));
  yes('  standing further out, so they still clear the notes',
    scaled.big.gap > scaled.small.gap * 1.6, JSON.stringify(scaled));
  /* through the buttons, because pressing them is how you put a layer down
     and setting the field by hand would not notice a button that had stopped
     writing to it */
  const gone = await p.evaluate(async () => {
    for(const k of ['names','degrees','beats']){
      const b = document.querySelector(`[data-sclayer="${k}"]`);
      if(b) b.click();
      await new Promise(r => setTimeout(r, 0));
    }
    const x = scores().find(y => y.title === 'In D');
    return {drawn: document.querySelectorAll('.sc-lab').length, ov: x.overlays};
  });
  is('and every one of them can be put down again', gone.drawn, 0);
  yes('  the buttons are what put them down', !gone.ov.names && !gone.ov.degrees && !gone.ov.beats,
    JSON.stringify(gone.ov));

  console.log('\n11. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
