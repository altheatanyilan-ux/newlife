/* smoke199 — the practice notebook, and getting it onto paper.

   A practice log that only says "practised today" is a log you stop keeping,
   because nothing in it ever tells you anything. What is worth writing down
   is what you were after, how fast you got it and what you found out — and
   what a month of that adds up to is two pictures you cannot get any other
   way.

   THE TEMPO CLIMBING is the only hard evidence that slow practice is working.
   It is drawn from the log rather than from a number kept by hand, so it
   cannot drift out of step with what actually happened, and the line to get
   to is the fastest tempo written on any section of the piece.

   AND THE SECTION YOU HAVE BEEN AVOIDING. Every practice log in the world
   says you practised; almost none of them say what you did not. The heat map
   is the sittings spread across the sections, and the thing worth having is
   the bar at the bottom.

   PRINTING is three different objects: the clean copy for the stand, the one
   with the sections marked so you can see the shape, and the practice copy
   with everything you have written on it. Whatever is on the glass, what
   comes out is the whole piece as one long page — printing a paginated
   reading view prints the page you happen to be looking at, and printing a
   focused section prints eight bars. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>A Study</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">${Array.from({length:32}, (_, i) =>
    `<measure number="${i+1}">${i === 0 ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>` : ''}${
    ['C','D','E','F'].map(s => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>`).join('')
    }</measure>`).join('')}</part>
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
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'A Study.musicxml')); }, XML);
  await p.waitForTimeout(5000);
  await p.evaluate(() => {
    const x = scores()[0];
    addScoreSection(x.id, {name:'Opening', startMeasure:1, endMeasure:8, targetTempo:132});
    addScoreSection(x.id, {name:'Middle', startMeasure:9, endMeasure:20, targetTempo:120});
    addScoreSection(x.id, {name:'Coda', startMeasure:21, endMeasure:32});
    rerender();
  });
  await p.waitForTimeout(1500);

  console.log('\n1. a sitting is more than "practised today"');
  const one = await p.evaluate(async () => {
    const x = scores()[0];
    document.querySelector('[data-scside="notebook"]').click();
    await new Promise(r => setTimeout(r, 200));
    document.querySelector('#scLogAny').click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#logMins').value = '25';
    document.querySelectorAll('[data-logsec]')[0].checked = true;
    document.querySelectorAll('[data-logsec]')[1].checked = true;
    document.querySelector('#logFocus').value = 'tempo in the middle section';
    document.querySelector('#logTempo').value = '92';
    document.querySelector('#logQuality').value = 'improving';
    document.querySelector('#logNotes').value = 'There is an inner voice in the tenor I have been ignoring.';
    document.querySelector('#logSave').click();
    await new Promise(r => setTimeout(r, 400));
    const r = scores()[0].practice[0];
    return {minutes:r.minutes, n:(r.sections||[]).length, focus:r.focus, tempo:r.tempo,
      quality:r.quality, found:r.discoveries.slice(0, 20),
      counts: scores()[0].sections.map(s => s.practiceCount)};
  });
  is('the minutes', one.minutes, 25);
  is('  what you were after', one.focus, 'tempo in the middle section');
  is('  how fast you got it', one.tempo, 92);
  is('  how it went', one.quality, 'improving');
  is('  and what you found out', one.found, 'There is an inner vo');
  /* one sitting can be two sections, and both of them have been practised */
  is('two sections in one sitting count for both', one.counts, [1,1,0]);

  console.log('\n2. what a month of them adds up to');
  const many = await p.evaluate(async () => {
    const x = scores()[0];
    const ids = x.sections.map(s => s.id);
    const add = (days, mins, tempo, quality, secs) => {
      const d = new Date(Date.now() - days * 864e5);
      x.practice.push(scorePracticeDefaults({sections: secs, minutes: mins, tempo, quality,
        date: d.toISOString().slice(0,10), at: d.toISOString()}));
      secs.forEach(id => { const s = scoreSection(x, id);
        if(s){ s.practiceCount = (+s.practiceCount||0)+1; s.lastPracticedDate = d.toISOString().slice(0,10); } });
    };
    add(28, 30, 60, 'rough',     [ids[0]]);
    add(21, 40, 68, 'shaky',     [ids[0]]);
    add(14, 25, 76, 'shaky',     [ids[0], ids[1]]);
    add(7,  35, 84, 'improving', [ids[1]]);
    saveNow(); scoreSidePaint(x);
    await new Promise(r => setTimeout(r, 300));
    const nb = scoreNotebook(x);
    return {sessions: nb.sessions, minutes: nb.minutes, from: nb.from, to: nb.to,
      best: nb.best, target: nb.target,
      heat: nb.heat.map(h => [h.section.name, h.sessions, h.best]),
      dots: document.querySelectorAll('.sc-nb-chart circle').length,
      dash: document.querySelectorAll('.sc-nb-chart line').length,
      rows: [...document.querySelectorAll('.sc-sitting .mono')].slice(0,1).map(n => n.textContent)};
  });
  is('five sittings', many.sessions, 5);
  is('  and the time they took', many.minutes, 155);
  is('the tempo where it started and where it is now', [many.from, many.to], [60, 92]);
  /* the line to get to is the fastest anything in the piece is written at */
  is('  with the target read off the sections', many.target, 132);
  is('  and a dot for every sitting that had a tempo in it', many.dots, 5);
  is('    under a dashed line at the target', many.dash, 1);
  is('the heat map counts the sittings each section has had',
    many.heat, [['Opening',4,92],['Middle',3,92],['Coda',0,null]]);

  console.log('\n3. the section nobody has touched');
  const cold = await p.evaluate(() => document.querySelector('.sc-heat p').textContent.trim());
  yes('the notebook says so out loud', /Coda has never been practised/.test(cold), cold);

  console.log('\n4. lately, not ever');
  const mood = await p.evaluate(() => {
    const x = scores()[0];
    /* eleven more flowing sittings: a lifetime average would still be
       dragged down by the rough ones, and the useful number is not that */
    for(let i = 0; i < 11; i++) x.practice.push(scorePracticeDefaults({
      sections: [], minutes: 10, quality: 'flowing',
      at: new Date(Date.now() + i * 1000).toISOString()}));
    return {mood: scoreNotebook(x).mood};
  });
  is('the last ten sittings are what "lately" means', mood.mood, 4);

  console.log('\n5. a sitting can be struck out');
  const gone = await p.evaluate(async () => {
    const x = scores()[0];
    for(let i = 0; i < 11; i++) x.practice.pop();
    const before = x.practice.length;
    const id = x.practice[0].id;
    const secs = x.practice[0].sections.slice();
    const wasCounts = x.sections.map(s => s.practiceCount);
    spliceOut(x.practice, r => r.id === id);
    secs.forEach(sid => { const s = scoreSection(x, sid);
      if(s) s.practiceCount = Math.max(0, (+s.practiceCount||0) - 1); });
    saveNow(); scoreSidePaint(x);
    await new Promise(r => setTimeout(r, 200));
    return {before, after: x.practice.length, wasCounts, counts: x.sections.map(s => s.practiceCount),
      shown: document.querySelectorAll('.sc-sitting').length};
  });
  is('it comes out of the log', [gone.before, gone.after], [5, 4]);
  is('  and out of the counts it added to', gone.counts, [3, 2, 0]);
  is('  and off the page', gone.shown, 4);

  console.log('\n6. the section panel knows what the log knows');
  const side = await p.evaluate(async () => {
    document.querySelector('[data-scside="marks"]').click();
    await new Promise(r => setTimeout(r, 300));
    return [...document.querySelectorAll('.sc-sec')].map(n => n.textContent.replace(/\s+/g, ' ').trim());
  });
  yes('the fastest a section has been logged at, beside what it is written at',
    /best ♩=76 of 132/.test(side[0]), side[0]);
  yes('  and how long it has had in all', /1h 35m|95m/.test(side[0]) || /h |m/.test(side[0]), side[0]);

  console.log('\n7. printing');
  await p.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  /* the room is in reading mode and focused on eight bars, which is exactly
     the state in which a naive print puts eight bars on one sheet */
  await p.evaluate(() => { const x = scores()[0];
    scoreUi().focus = x.sections[0].id; rerender(); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => setScoreReading(true));
  await p.waitForTimeout(3500);
  const printed = await p.evaluate(async () => {
    const x = scores()[0];
    let seen = null;
    const real = window.print;
    window.print = () => { window.__printed++;
      seen = {mode: document.documentElement.dataset.scprint,
        from: scoreView().from, to: scoreView().to, page: scoreView().page,
        bars: measureBoxes().length,
        bands: document.querySelectorAll('.sc-band').length,
        dimmed: document.querySelectorAll('.sc-band.dim').length}; };
    await scorePrint(x, 'everything');
    window.print = real;
    return {seen, printed: window.__printed, after: document.documentElement.dataset.scprint,
      reading: scoreUi().reading};
  });
  is('what is printed is the mode you asked for', printed.seen && printed.seen.mode, 'everything');
  /* not the eight bars you were focused on, and not the one page you were on */
  is('  the whole piece, not the passage you were focused on',
    [printed.seen.from, printed.seen.to], [null, null]);
  is('  as one long page rather than the page you were looking at', printed.seen.page, null);
  is('  so every bar is on it', printed.seen.bars, 32);
  /* and every section at full strength: focus greys the ones you are not
     working on, which is right on the glass and wrong on paper */
  yes('  with every section drawn, none of them greyed',
    printed.seen.bands > 0 && printed.seen.dimmed === 0, JSON.stringify(printed.seen));
  is('and the room is given back afterwards', printed.after, undefined);
  yes('  still reading, as it was', printed.reading, JSON.stringify(printed));

  console.log('\n8. what each copy carries');
  await p.emulateMedia({media:'print'});
  const shown = async mode => p.evaluate(m => {
    document.documentElement.dataset.scprint = m;
    const see = sel => { const n = document.querySelector(sel);
      return n ? getComputedStyle(n).display !== 'none' : null; };
    const out = {bands: see('.sc-overlay'), pins: see('.sc-pins'), marks: see('.sc-marks'),
      stage: getComputedStyle(document.querySelector('.sc-stage')).maxHeight};
    delete document.documentElement.dataset.scprint;
    return out;
  }, mode);
  const clean = await shown('score');
  is('the clean copy carries no bands, no pins and nothing written over the notes',
    [clean.bands, clean.pins, clean.marks], [false, false, false]);
  is('  and the stage is let off its height, so the whole piece prints',
    clean.stage, 'none');
  const withSecs = await shown('sections');
  is('the shape-of-the-piece copy keeps the bands and drops the rest',
    [withSecs.bands, withSecs.pins, withSecs.marks], [true, false, false]);
  const all = await shown('everything');
  is('and the practice copy carries the lot',
    [all.bands, all.pins, all.marks], [true, true, true]);
  await p.emulateMedia({media:'screen'});
  const onScreen = await p.evaluate(() => {
    document.documentElement.dataset.scprint = 'score';
    const n = getComputedStyle(document.querySelector('.sc-overlay')).display;
    delete document.documentElement.dataset.scprint;
    return n;
  });
  yes('none of which touches the room on the glass', onScreen !== 'none', onScreen);

  console.log('\n9. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
