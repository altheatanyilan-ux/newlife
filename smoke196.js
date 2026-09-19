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

  console.log('\n8. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
