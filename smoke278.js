/* smoke278 — one sitting, several things: Return logs each stretch.

   The claims.

   RETURN LOGS A STRETCH. In "what are you actually doing?", Return logs what
   was written as one stretch of the sitting — from the last mark (or the
   start) to now — and the clock keeps running. The box empties for the next
   thing and keeps the caret; the stretch is listed above it with its times
   and length, and "since" says when the current one began. Shift+Return is
   still a new line; Return on an empty box logs nothing.

   THE TIMES ARE THE CLOCK'S. A stretch's length is the work in it: a break
   inside it is not counted.

   IT IS KEPT AS IT GOES. Each stretch is on the sitting's record at once,
   and in the time tracker the sitting's entry is cut at the same place, so
   every stretch is its own entry with its own times and its words as a note.

   THE END OF THE SITTING IS THE LAST STRETCH. Whatever is written when the
   sitting stops becomes its last stretch, so the stretches account for the
   whole sitting; the day's ledger lists them in order. A stretch's words can
   be corrected with a press. A sitting nobody marked keeps its one note, as
   before. And a countdown that runs out just after a mark is still a
   finished sitting, not one "ended early".

   Run: NODE_PATH=node_modules node smoke278.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 1000}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.clock.install();
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const calm = () => p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil, .dx-flashcard, .toast').forEach(n => n.remove()); });
  await calm();

  await p.evaluate(() => {
    const t = newPlanTask('Write the grant', today(), {listId: 'inbox'}); S.tasks.push(t);
    timeSettings().autoTrack = true; if(timeRunning()) stopTimer();
    S.planning.distractions = [];
    FocusTimer.reset(); FocusTimer.setMode('stopwatch'); FocusTimer.setTask(t.id);
    S.settings.todayView = 'do'; location.hash = '#/today';
  });
  await p.waitForTimeout(900);
  await p.evaluate(() => setPageFocus(true)); await p.waitForTimeout(900);
  await p.evaluate(() => FocusTimer.start()); await p.waitForTimeout(600); await calm();
  const did = '.pf-desk #fpDid';
  const stretches = () => p.evaluate(() => FocusTimer.stretches().map(x => ({t: x.text, m: x.minutes})));

  console.log('\n1. Return logs a stretch, and the clock keeps running');
  await p.clock.fastForward('12:00'); await p.waitForTimeout(300);
  await p.click(did); await p.keyboard.type('emails to the committee'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  is('the first stretch: what it was, and the twelve minutes since the start', await stretches(), [{t: 'emails to the committee', m: 12}]);
  const after = await p.evaluate(() => { const d = document.querySelector('.pf-desk #fpDid');
    return {running: FocusTimer.state().running, empty: d.value === '', caret: document.activeElement === d, notes: FocusTimer.state().notes,
      list: [...document.querySelectorAll('.pf-desk .tf-stretches li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()),
      since: document.querySelector('.pf-desk #fpSince').textContent}; });
  yes('  the clock is still running', after.running);
  yes('  the box is empty for the next thing, with the caret still in it', after.empty && after.caret && after.notes === '', after);
  yes('  and the stretch is listed above it, with its times and length', after.list.length === 1 && /\d\d:\d\d–\d\d:\d\d 12m emails to the committee/.test(after.list[0]), after.list);
  const markAt = await p.evaluate(() => clockOf(FocusTimer.stretchSince()));
  yes('  "since" says when the next stretch began', after.since.includes(markAt), after.since);
  const rec1 = await p.evaluate(() => { const r = planState().focusSessions.slice(-1)[0]; return r && (r.segments || []).map(x => x.text); });
  is('it is on the sitting\'s record at once', rec1, ['emails to the committee']);
  const te1 = await p.evaluate(() => S.timeEntries.filter(e => e.feature === 'focus' && e.endTime).map(e => ({mins: Math.round(timeMinutes(e)), notes: (e.notes || []).map(n => n.text)})));
  yes('and in the time tracker the sitting\'s entry is cut there, carrying the words', te1.some(e => e.mins === 12 && e.notes.includes('emails to the committee')), te1);
  yes('  with a fresh entry running on for the next stretch', await p.evaluate(() => { const e = timeRunning(); return !!e && e.feature === 'focus' && e.linkedLabel === 'Write the grant'; }));

  console.log('\n2. a break inside a stretch is not counted in it');
  await p.clock.fastForward('05:00');
  await p.evaluate(() => FocusTimer.pause()); await p.clock.fastForward('03:00'); await p.evaluate(() => FocusTimer.start());
  await p.clock.fastForward('10:00'); await p.waitForTimeout(300);
  await p.click(did); await p.keyboard.type('the outline'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  is('five minutes, a three-minute break, ten minutes: a fifteen-minute stretch', (await stretches())[1], {t: 'the outline', m: 15});

  console.log('\n3. Shift+Return is a new line; Return on nothing logs nothing');
  await p.click(did); await p.keyboard.type('first page'); await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift');
  await p.keyboard.type('and the budget line'); await p.waitForTimeout(400);
  const ml = await p.evaluate(() => ({v: document.querySelector('.pf-desk #fpDid').value, n: FocusTimer.stretches().length}));
  yes('Shift+Return makes a new line, and no stretch', ml.v === 'first page\nand the budget line' && ml.n === 2, ml);
  await p.evaluate(() => { const d = document.querySelector('.pf-desk #fpDid'); d.value = ''; d.dispatchEvent(new Event('input')); });
  await p.click(did); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  yes('Return on an empty box logs nothing', (await stretches()).length === 2);
  await p.keyboard.type('first page'); await p.waitForTimeout(400);

  console.log('\n4. a stretch\'s words can be corrected');
  await p.click('.pf-desk .tf-stretches li:first-child [data-fpstredit]'); await p.waitForTimeout(150);
  await p.keyboard.press('Control+A'); await p.keyboard.type('emails to the grant committee'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  const fixed = await p.evaluate(() => ({live: FocusTimer.stretches()[0].text,
    rec: planState().focusSessions.slice(-1)[0].segments[0].text,
    entry: (S.timeEntries.find(e => e.focusFrom === FocusTimer.stretches()[0].from)?.notes || []).map(n => n.text)}));
  yes('corrected in the sitting, on its record and on its time entry',
    fixed.live === 'emails to the grant committee' && fixed.rec === fixed.live && fixed.entry.includes(fixed.live), fixed);
  yes('  and what was being typed in the box is untouched', await p.evaluate(() => document.querySelector('.pf-desk #fpDid').value === 'first page'));

  console.log('\n5. the end of the sitting is its last stretch');
  await p.clock.fastForward('07:00'); await p.waitForTimeout(200);
  await p.evaluate(() => FocusTimer.stop()); await p.waitForTimeout(600);
  const rec = await p.evaluate(() => { const r = planState().focusSessions.slice(-1)[0];
    return {dur: r.duration, segs: r.segments.map(x => ({t: x.text, m: x.minutes})), sum: r.segments.reduce((a, x) => a + x.minutes, 0),
      contiguous: r.segments.every((x, i) => !i || x.from === r.segments[i - 1].to), first: r.segments[0].from === r.startedAt}; });
  is('what was written when it stopped is the last stretch', {t: rec.segs[2].t, m: Math.round(rec.segs[2].m)}, {t: 'first page', m: 7});
  yes('the stretches follow each other with no gaps, from the start', rec.contiguous && rec.first, rec);
  yes('  and add up to the sitting', Math.abs(rec.sum - rec.dur) <= 1, rec);
  const te = await p.evaluate(() => S.timeEntries.filter(e => e.feature === 'focus').map(e => ({mins: Math.round(timeMinutes(e)), notes: (e.notes || []).map(n => n.text).join('|')})));
  yes('in the time tracker, one entry per stretch (the break between two of them)', te.length === 4 && te.map(x => x.notes).join(' / ').includes('first page'), te);
  await p.evaluate(() => { S.settings.todayView = 'do'; rerender(); }); await p.waitForTimeout(500);
  const ledger = await p.evaluate(() => [...document.querySelectorAll('.fl-stretches')].pop()?.textContent.replace(/\s+/g, ' ').trim() || '');
  yes('the day\'s ledger lists the stretches in order', /emails to the grant committee.*the outline.*first page/.test(ledger), ledger);

  console.log('\n6. a sitting nobody marked keeps its one note');
  await p.evaluate(() => { FocusTimer.reset(); FocusTimer.setMode('stopwatch'); FocusTimer.start(); rerender(); }); await p.waitForTimeout(500); await calm();
  await p.fill(did, 'just the one thing'); await p.waitForTimeout(500);
  await p.clock.fastForward('06:00');
  await p.evaluate(() => FocusTimer.stop()); await p.waitForTimeout(400);
  const one = await p.evaluate(() => { const r = planState().focusSessions.slice(-1)[0]; return {note: r.note, segs: (r.segments || []).length}; });
  is('its note, and no stretches', one, {note: 'just the one thing', segs: 0});

  console.log('\n7. a countdown that ends just after a mark is still finished');
  await p.evaluate(() => { FocusTimer.reset(); FocusTimer.setMode('countdown'); FocusTimer.setLength(25); FocusTimer.start(); rerender(); });
  await p.waitForTimeout(400); await calm();
  await p.clock.fastForward('24:40'); await p.waitForTimeout(200);
  await p.evaluate(() => FocusTimer.markStretch('the last paragraph'));
  await p.clock.fastForward('00:30'); await p.waitForTimeout(600);
  const fin = await p.evaluate(() => { const r = planState().focusSessions.slice(-1)[0]; return {completed: r.completed, segs: r.segments.map(x => x.text)}; });
  yes('marked complete, with its stretch', fin.completed === true && fin.segs[0] === 'the last paragraph', fin);

  console.log('\n8. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
