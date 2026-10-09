/* smoke289 — Phase 2 of the execution overhaul: one clock.

   The clock is the focus timer's. Pressing the pill, or a room asking for the
   clock, opens a sitting with a label and no target; the day's record is
   written from the sitting (the part under way is the pill's live row, each
   finished part a row written when it ends); nothing keeps the two in line on
   a timer of its own.

   1. A clock from the pill is a sitting: one running clock, one live row that
      mirrors it, a record of its own kind ('clock') that the focus figures do
      not count, an entry on stop with the label, category and source it was
      given, and the right minutes.
   2. Starting another stops the first (the hour is on one thing); a room does
      not start a second clock, and does not end a sitting held on a break; a
      room stops only the clock it started.
   3. A pause ends a part and writes it (the pause itself a break entry); resuming opens the next; a mark
      (Return) does the same; the parts add up to the sitting, with the pause
      left out.
   4. Under a minute is not a sitting — nothing is written.
   5. Reload in the middle of a sitting: the same sitting, the same single
      live row, nothing doubled, and ending it afterwards gives the same entry.
   6. No minute-by-minute rewrite: while a sitting runs, minutes pass and the
      finished entries are not touched.

   Run: NODE_PATH=node_modules node smoke289.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 900}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.clock.install({time: new Date('2026-06-10T10:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove());
    timeState(); S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset();
    timeSettings().autoTrack = true; });
  /* time jumps rather than being played through frame by frame: the timer reads absolute times, and a minute of animation frames is thousands of callbacks */
  const fwd = async ms => { for(let left = ms; left > 0; left -= 60000) await p.clock.fastForward(Math.min(left, 60000)); await p.clock.runFor(50); };
  const entries = () => p.evaluate(() => S.timeEntries.slice().sort((a, b) => a.startTime < b.startTime ? -1 : 1).map(e => ({what: e.what, cat: e.categoryId, src: e.source, feat: e.feature,
    mins: Math.round(timeMinutes(e) * 10) / 10, run: !e.endTime, sit: !!e.focusSit, from: timeClockOf(e.startTime), to: e.endTime ? timeClockOf(e.endTime) : null})));

  console.log('\n1. the pill’s clock is a sitting');
  await p.evaluate(() => { startTimer({what: 'reading the paper', categoryId: 'reading', tags: ['news']}); });
  const s1 = await p.evaluate(() => ({running: FocusTimer.state().running, meta: FocusTimer.state().meta, mode: FocusTimer.state().mode,
    live: !!timeRunning() && !!timeRunning().focusSit, rows: S.timeEntries.length}));
  is('one sitting is running, as a stopwatch, with the label it was given', [s1.running, s1.mode, s1.meta && s1.meta.what, s1.meta && s1.meta.categoryId], [true, 'stopwatch', 'reading the paper', 'reading']);
  is('and the pill’s clock is its live row — the only row', [s1.live, s1.rows], [true, 1]);
  await fwd(5 * 60 * 1000);
  await p.evaluate(() => { window.__stopped = stopTimer(); });
  const e1 = await entries();
  is('stopping writes one entry: five minutes, the label, the category, started by hand', e1.map(e => [e.what, e.cat, e.src, e.mins, e.run]), [['reading the paper', 'reading', 'timer', 5, false]]);
  const r1 = await p.evaluate(() => ({rec: planState().focusSessions.map(r => [r.type, !!r.meta]), focusFigure: focusMinutesOn(today()), idle: FocusTimer.state().idle,
    handedBack: !!(window.__stopped && window.__stopped.what === 'reading the paper' && !window.__stopped.dropped), tags: S.timeEntries[0].tags}));
  is('its record is of its own kind, so the focus figures do not count it', [r1.rec, r1.focusFigure], [[['clock', true]], 0]);
  yes('the clock is idle again, the entry was handed back to the pill, and kept the tags', r1.idle && r1.handedBack && r1.tags.join() === 'news', r1);

  console.log('\n2. one hour, one thing');
  await p.evaluate(() => { S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset(); startTimer({what: 'first thing', categoryId: 'work'}); });
  await fwd(3 * 60 * 1000);
  await p.evaluate(() => { startTimer({what: 'second thing', categoryId: 'study'}); });
  const s2 = await p.evaluate(() => ({running: S.timeEntries.filter(e => !e.endTime).map(e => e.what), done: S.timeEntries.filter(e => e.endTime).map(e => [e.what, Math.round(timeMinutes(e))])}));
  is('starting a second closes the first and writes it', [s2.running, s2.done], [['second thing'], [['first thing', 3]]]);
  const room = await p.evaluate(() => ({refused: timeAutoStart({categoryId: 'meditation', feature: 'stillness', what: 'sitting'}), stays: S.timeEntries.filter(e => !e.endTime).map(e => e.what)}));
  is('a room does not start a second clock while one runs', [room.refused, room.stays], [null, ['second thing']]);
  await p.evaluate(() => { window.__noStop = timeAutoStop('stillness'); });
  is('and does not stop a clock it did not start', await p.evaluate(() => [window.__noStop, !!timeRunning()]), [null, true]);
  await p.evaluate(() => { stopTimer(); });
  await p.evaluate(() => { window.__mine = timeAutoStart({categoryId: 'meditation', feature: 'stillness', what: 'a sitting'}); });
  const mine = await p.evaluate(() => ({made: !!window.__mine, src: window.__mine && window.__mine.source, feat: window.__mine && window.__mine.feature, meta: FocusTimer.state().meta && FocusTimer.state().meta.feature}));
  is('with nothing running a room does start one, marked as its own', [mine.made, mine.src, mine.feat, mine.meta], [true, 'auto', 'stillness', 'stillness']);
  await fwd(4 * 60 * 1000);
  await p.evaluate(() => { window.__done = timeAutoStop('stillness'); });
  is('and stops it, writing four minutes of meditation', await p.evaluate(() => [window.__done && Math.round(timeMinutes(window.__done)), S.timeEntries.filter(e => e.feature === 'stillness').map(e => [e.categoryId, e.source])]), [4, [['meditation', 'auto']]]);
  await p.evaluate(() => { FocusTimer.reset(); S.timeEntries.length = 0; planState().focusSessions.length = 0;
    FocusTimer.start(null, 'focus'); });
  await fwd(2 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); });
  is('a sitting held on a break is not ended by a room asking for the clock', await p.evaluate(() => [timeAutoStart({categoryId: 'meditation', feature: 'stillness', what: 'x'}), FocusTimer.state().idle]), [null, false]);
  await p.evaluate(() => { FocusTimer.stop(true); });

  console.log('\n3. pause, resume and mark');
  await p.evaluate(() => { S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset(); startTimer({what: 'writing the chapter', categoryId: 'writing'}); });
  await fwd(10 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); });
  const mid = await entries();
  is('a pause writes the part before it, and the live row is closed', mid.map(e => [e.mins, e.run]), [[10, false]]);
  await fwd(5 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.start(); });
  await fwd(7 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.stop(true); });
  const end = await entries();
  is('resuming opens a new part; ending writes it; the pause is a break of its own between them', end.map(e => [e.what, e.mins, e.run]), [['writing the chapter', 10, false], ['a break', 5, false], ['writing the chapter', 7, false]]);
  is('all of it is the one sitting, and the work adds up to 17 with the break outside it', await p.evaluate(() => [new Set(S.timeEntries.map(e => e.focusSit)).size,
    Math.round(S.timeEntries.filter(e => e.kind !== 'break').reduce((n, e) => n + timeMinutes(e), 0))]), [1, 17]);

  console.log('\n4. under a minute is not a sitting');
  await p.evaluate(() => { S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset(); startTimer({what: 'a wrong turn'}); });
  await fwd(20 * 1000);
  await p.evaluate(() => { window.__gone = stopTimer(); });
  is('nothing is written, and the pill is told so', await p.evaluate(() => [S.timeEntries.length, planState().focusSessions.length, !!(window.__gone && window.__gone.dropped)]), [0, 0, true]);

  console.log('\n5. nothing is rewritten on a timer');
  await p.evaluate(() => { S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset(); startTimer({what: 'long stretch'}); });
  await fwd(2 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); }); await fwd(1000); await p.evaluate(() => { FocusTimer.start(); });
  await p.evaluate(() => { const fin = S.timeEntries.find(e => e.endTime); fin.__sentinel = 'untouched'; window.__calls = 0; const f = window.timeSyncFocus; window.timeSyncFocus = function(){ window.__calls++; return f.apply(this, arguments); }; });
  await fwd(20 * 60 * 1000);
  is('twenty minutes of running: the sync was not called, and the finished entry is the very same object', await p.evaluate(() => [window.__calls, S.timeEntries.find(e => e.endTime).__sentinel]), [0, 'untouched']);
  await p.evaluate(() => { FocusTimer.stop(true); });

  console.log('\n6. reload in the middle of a sitting');
  await p.evaluate(() => { S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset(); startTimer({what: 'across a reload', categoryId: 'piano'}); });
  await fwd(3 * 60 * 1000);
  const before = await p.evaluate(async () => { await saveNow(); await flushSave(); return {key: FocusTimer.state().startedAt, rows: S.timeEntries.length}; });
  await p.reload(); await p.waitForTimeout(2500);
  const after = await p.evaluate(() => ({running: FocusTimer.state().running, key: FocusTimer.state().startedAt, what: FocusTimer.state().meta && FocusTimer.state().meta.what,
    live: S.timeEntries.filter(e => !e.endTime).map(e => e.focusSit), rows: S.timeEntries.length}));
  is('the same sitting is running, with its label', [after.running, after.key === before.key, after.what], [true, true, 'across a reload']);
  is('there is exactly one live row, and it is that sitting’s', [after.live.length, after.live[0] === before.key], [1, true]);

  console.log('\n7. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
