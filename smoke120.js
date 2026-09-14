/* smoke120 — the clock, now that it is a gadget rather than a room.

   It began in Planning, as somewhere you went. Going somewhere is the wrong
   shape for a timer: the whole point is that it runs while you are looking at
   the thing you are doing. It moved to Today, and Today is still somewhere you
   go — the moment the work was in the Writing Studio or a project's page the
   clock was on another screen again, and a clock you cannot see is a clock you
   forget to stop.

   So it floats over every room, folded to a circle until it is wanted, and it
   lives outside #main — which is rebuilt on nearly every edit — so that a
   redraw cannot stop it or eat a half-typed note.

   And it holds only what a sitting is: the clock, the task, what you are
   actually doing, and what the break was for. The mode chooser, the length
   presets, the estimate, the tick box, the steps, the description, the record
   and the log are all gone from it. None of that is lost — it is reference
   material, and reference material is on the pages that have room for it. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1500, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.clock.install();
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const go = async h => { await p.evaluate(x => { if(location.hash === x) rerender(); else location.hash = x; }, h);
    await p.waitForTimeout(1400); };
  const face = () => p.evaluate(() => document.querySelector('#focusDock .fp-time')?.textContent);
  /* the clock starts the instant an estimate is pressed, so by the time the
     face is read a second has gone: assert the minute, not the tick */
  const secs = async () => { const t = await face(); if(!t) return null;
    const [m, s2] = t.split(':').map(Number); return m * 60 + s2; };
  const near = (n, want, why, tol = 3) =>
    Math.abs(n - want) <= tol ? ok(n === want ? why : `${why}  (${n}s of ${want}s)`)
                              : no(why, `got ${n}s, want about ${want}s`);
  const open = async () => { await p.evaluate(() => setFocusDockShut(false)); await p.waitForTimeout(500); };
  await go('#/today');

  console.log('\n1. it is over every room, not in one of them');
  yes('the clock is on the page', !!(await p.$('#focusDock')));
  is('  fixed to the window', await p.evaluate(() =>
    getComputedStyle(document.querySelector('#focusDock')).position), 'fixed');
  yes('  and outside the part of the page that is redrawn',
    await p.evaluate(() => !document.querySelector('#main #focusDock')));
  const same = await p.evaluate(() => { const a = document.querySelector('#focusDock');
    rerender(); return a === document.querySelector('#focusDock'); });
  yes('  so a redraw leaves the very same element standing', same);
  for(const room of ['#/values', '#/projects', '#/writing', '#/planning']){
    await go(room);
    yes(`  still there in ${room}`, !!(await p.$('#focusDock')));
  }
  await go('#/today');

  console.log('\n2. folded to a circle until it is wanted');
  yes('it starts folded', await p.evaluate(() => focusDockShut()));
  const bub = await p.evaluate(() => { const n = document.querySelector('#focusDock .fd-bubble');
    if(!n) return null; const r = n.getBoundingClientRect();
    return {w: Math.round(r.width), h: Math.round(r.height),
      round: getComputedStyle(n).borderRadius,
      bottom: Math.round(innerHeight - r.bottom), left: Math.round(r.left),
      sidebar: Math.round(document.querySelector('.sidebar').getBoundingClientRect().right)}; });
  yes('as a circle', bub && bub.w === bub.h && bub.w <= 56 && /50%/.test(bub.round), JSON.stringify(bub));
  yes('  in the bottom corner', bub && bub.bottom <= 26, bub && String(bub.bottom));
  yes('  clear of the navigation rather than on top of it', bub && bub.left >= bub.sidebar,
    bub && `${bub.left} vs ${bub.sidebar}`);
  yes('  and there is no card while it is folded', !(await p.$('#focusDock .fd-card')));
  await p.click('#focusDock #fdOpen'); await p.waitForTimeout(600);
  yes('pressing it opens the card', !!(await p.$('#focusDock .fd-card')));
  await p.click('#focusDock #fdShut'); await p.waitForTimeout(600);
  yes('  and the − folds it back', !!(await p.$('#focusDock .fd-bubble')));
  is('  which is remembered', await p.evaluate(() => S.settings.focusDock), 'shut');
  await go('#/values');
  yes('  on the next room too', !!(await p.$('#focusDock .fd-bubble')));
  await go('#/today');

  console.log('\n3. started from the clock, a sitting counts up');
  await open();
  yes('there is nothing to set before it starts',
    !(await p.$('#focusDock .fp-mode')) && !(await p.$('#focusDock .fp-len'))
    && !(await p.$('[data-fpmode]')) && !(await p.$('[data-fplen]')));
  await p.click('#focusDock #fpGo'); await p.waitForTimeout(400);
  is('it is a stopwatch', await p.evaluate(() => FocusTimer.state().mode), 'stopwatch');
  await p.clock.fastForward('03:20'); await p.waitForTimeout(600);
  is('  and it counts up', await face(), '03:20');
  const el = await p.evaluate(() => FocusTimer.state().elapsed);
  yes('  which the timer agrees with', Math.abs(el - 200) <= 3, `${el}s`);
  yes('  and it does not finish itself', await p.evaluate(() => FocusTimer.state().running));

  console.log('\n4. the sitting takes a note of what it was for');
  yes('there is somewhere to write it', !!(await p.$('#focusDock #fpDid')));
  await p.fill('#focusDock #fpDid', 'the second draft'); await p.waitForTimeout(600);
  is('  and it reaches the timer', await p.evaluate(() => FocusTimer.state().notes), 'the second draft');
  /* the half-typed note must survive everything that redraws the page */
  await p.evaluate(() => rerender()); await p.waitForTimeout(600);
  is('  a redraw of the page does not eat it',
    await p.evaluate(() => document.querySelector('#focusDock #fpDid')?.value), 'the second draft');
  await p.clock.fastForward('10:00'); await p.waitForTimeout(500);
  await p.click('#focusDock #fpStop'); await p.waitForTimeout(1000);
  const s = await p.evaluate(() => planState().focusSessions.slice(-1)[0]);
  is('the sitting was written down', !!s, true);
  is('  for as long as it actually ran', s.duration, 13);
  is('  marked as a stopwatch', s.mode, 'stopwatch');
  is('  and carrying the note', s.note, 'the second draft');

  console.log('\n5. pausing is a break, and the break takes its own note');
  await p.click('#focusDock #fpGo'); await p.waitForTimeout(500);
  await p.clock.fastForward('02:00'); await p.waitForTimeout(400);
  await p.click('#focusDock #fpGo'); await p.waitForTimeout(600);
  yes('pausing opens a break', await p.evaluate(() => FocusTimer.state().onBreak));
  yes('  and asks what it is for', !!(await p.$('#focusDock #fpBreakNote')));
  await p.fill('#focusDock #fpBreakNote', 'tea, and answering Mara'); await p.waitForTimeout(600);
  is('  what is typed is kept on the break',
    await p.evaluate(() => FocusTimer.state().breakNote), 'tea, and answering Mara');
  await p.click('#focusDock #fpGo'); await p.waitForTimeout(600);
  yes('resuming closes it', await p.evaluate(() => !FocusTimer.state().onBreak));
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); }); await p.waitForTimeout(500);

  console.log('\n6. a length is chosen by pressing an estimate, not by asking the clock');
  const tid = await p.evaluate(() => {
    const t = S.tasks.find(x => x.day === today()) || S.tasks[0];
    t.duration = 45; t.subtasks = []; t.done = false;
    planState().focusSessions = []; saveNow(); rerender(); return t.id;
  });
  await p.waitForTimeout(900);
  await p.evaluate(i => focusOnTask(i, 45), tid); await p.waitForTimeout(1400);
  is('pressing an estimate counts that estimate down',
    await p.evaluate(() => FocusTimer.state().mode), 'countdown');
  near(await secs(), 45 * 60, '  starting at the estimate');
  yes('  and it opens the clock rather than leaving it a circle',
    !!(await p.$('#focusDock .fd-card')));
  is('  which says what it is on', await p.evaluate(() =>
    document.querySelector('#focusDock .fd-on b')?.textContent),
    await p.evaluate(i => findTaskRef(i).text, tid));
  await p.clock.fastForward('01:00'); await p.waitForTimeout(500);
  near(await secs(), 44 * 60, '  a minute in, a minute is gone');
  /* the second sitting counts down what is left, not the whole estimate again */
  await p.click('#focusDock #fpStop'); await p.waitForTimeout(900);
  await p.evaluate(i => focusOnTask(i, 45), tid); await p.waitForTimeout(1400);
  near(await secs(), 44 * 60, 'a later sitting counts down what is still owed');
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); }); await p.waitForTimeout(400);

  console.log('\n7. everything the panel carried besides the clock is gone from it');
  await open();
  const gone = await p.evaluate(() => {
    const d = document.querySelector('#focusDock');
    return {mode: !!d.querySelector('[data-fpmode]'), len: !!d.querySelector('[data-fplen]'),
      tick: !!d.querySelector('[data-fpdone]'), est: !!d.querySelector('.task-est'),
      steps: !!d.querySelector('.sub-wrap'), desc: !!d.querySelector('.fp-desc'),
      record: !!d.querySelector('.fp-rec'), log: !!d.querySelector('.fl-wrap')};
  });
  for(const [k, v] of Object.entries(gone)) is(`no ${k} on the clock`, v, false);
  yes('and the panel is not on Today either', !(await p.$('#t-focus')));
  yes('nor anywhere else in the app',
    await p.evaluate(() => typeof focusPanelHTML === 'undefined'));

  console.log('\n8. a task reaches it by being dragged on, folded or open');
  await p.evaluate(() => { FocusTimer.setTask(null); setFocusDockShut(true); }); await p.waitForTimeout(500);
  const dropped = await p.evaluate(i => {
    const to = document.querySelector('#focusDock [data-focusdrop]');
    if(!to) return 'no target';
    const dt = new DataTransfer();
    window._taskDrag = i;
    to.dispatchEvent(new DragEvent('dragover', {bubbles:true, cancelable:true, dataTransfer:dt}));
    to.dispatchEvent(new DragEvent('drop', {bubbles:true, cancelable:true, dataTransfer:dt}));
    window._taskDrag = null;
    return FocusTimer.state().taskId;
  }, tid);
  is('the circle is a drop target too', dropped, tid);
  await p.waitForTimeout(500);
  yes('  and a task dropped on it opens it', !!(await p.$('#focusDock .fd-card')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\nsmoke120  ${bad} FAILED` : '\nsmoke120  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
