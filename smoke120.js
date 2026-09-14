/* smoke120 — the clock, now that it is a gadget rather than a room.

   It began in Planning, as somewhere you went. Going somewhere is the wrong
   shape for a timer: the whole point is that it runs while you are looking at
   the thing you are doing. It moved to Today, and Today is still somewhere you
   go — the moment the work was in the Writing Studio or a project's page the
   clock was on another screen again, and a clock you cannot see is a clock you
   forget to stop.

   So it stands in the foot of the sidebar, which was empty, and takes its
   shape from it: the sidebar open, it is the clock; the sidebar narrowed to
   its icons, it is one more icon-sized thing — a circle that still says how
   many minutes you are in. One switch for both rather than two that can
   disagree, and the page's own words are never under it. It lives outside
   #main — which is rebuilt on nearly every edit — and outside the sidebar,
   which is rebuilt whenever the navigation changes, so that a redraw of
   either cannot stop it or eat a half-typed note.

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
  const open = async () => { await p.evaluate(() => setFocusDockShut(false)); await p.waitForTimeout(600); };
  await go('#/today');

  console.log('\n1. it is beside every room, not in one of them');
  yes('the clock is on the page', !!(await p.$('#focusDock')));
  is('  fixed to the window', await p.evaluate(() =>
    getComputedStyle(document.querySelector('#focusDock')).position), 'fixed');
  yes('  and outside both the parts of the page that are redrawn',
    await p.evaluate(() => !document.querySelector('#main #focusDock')
      && !document.querySelector('.sidebar #focusDock')));
  const same = await p.evaluate(() => { const a = document.querySelector('#focusDock');
    rerender(); renderNav(); return a === document.querySelector('#focusDock'); });
  yes('  so a redraw of either leaves the very same element standing', same);
  for(const room of ['#/values', '#/projects', '#/writing', '#/planning']){
    await go(room);
    yes(`  still there in ${room}`, !!(await p.$('#focusDock')));
  }
  await go('#/today');

  console.log('\n2. it takes its shape from the sidebar it stands in');
  const where = () => p.evaluate(() => {
    const d = document.querySelector('#focusDock'), r = d.getBoundingClientRect();
    const sb = document.querySelector('.sidebar').getBoundingClientRect();
    const links = [...document.querySelectorAll('.sidebar .nav a')];
    const last = links.length ? links[links.length - 1].getBoundingClientRect() : null;
    const bub = d.querySelector('.fd-bubble');
    return {card: !!d.querySelector('.fd-card'), bubble: !!bub,
      w: Math.round(r.width), h: Math.round(r.height),
      round: bub ? getComputedStyle(bub).borderRadius : '',
      bubW: bub ? Math.round(bub.getBoundingClientRect().width) : 0,
      bubH: bub ? Math.round(bub.getBoundingClientRect().height) : 0,
      inSidebar: r.left >= sb.left - 1 && r.right <= sb.right + 1,
      bottom: Math.round(innerHeight - r.bottom),
      clearsLinks: !last || last.bottom <= r.top + 1}; });
  /* the sidebar starts open */
  await p.evaluate(() => setFocusDockShut(false)); await p.waitForTimeout(700);
  let m = await where();
  yes('the sidebar open, it is the clock', m.card && !m.bubble);
  yes('  standing inside the sidebar, not over the page', m.inSidebar, JSON.stringify(m));
  yes('  at the foot of it', m.bottom <= 26, String(m.bottom));
  yes('  with the room names stopping above it rather than under it', m.clearsLinks);
  await p.click('#sbToggle'); await p.waitForTimeout(700);
  m = await where();
  yes('the sidebar narrowed, it is a circle', m.bubble && !m.card);
  yes('  a real circle, the size of an icon', m.bubW === m.bubH && m.bubW <= 48 && /50%/.test(m.round),
    JSON.stringify(m));
  yes('  still inside the sidebar', m.inSidebar, JSON.stringify(m));
  is('  and the clock agrees it is folded', await p.evaluate(() => focusDockShut()), true);
  await p.click('#focusDock #fdOpen'); await p.waitForTimeout(700);
  yes('pressing the circle opens the sidebar, and the clock with it',
    await p.evaluate(() => !document.documentElement.classList.contains('sb-collapsed'))
    && !!(await p.$('#focusDock .fd-card')));
  await go('#/values');
  yes('  and it is the same in the next room', !!(await p.$('#focusDock .fd-card')));
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

  console.log('\n8. a task reaches it by being dragged on, narrow or wide');
  await p.evaluate(() => { FocusTimer.setTask(null); setFocusDockShut(true); }); await p.waitForTimeout(700);
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
  await p.waitForTimeout(700);
  yes('  and a task dropped on it opens it', !!(await p.$('#focusDock .fd-card')));

  console.log('\n9. where there is no sidebar, it floats clear of what replaced it');
  await p.setViewportSize({width: 420, height: 820}); await p.waitForTimeout(500);
  await p.evaluate(() => paintFocusDock(true)); await p.waitForTimeout(500);
  const phone = await p.evaluate(() => {
    const d = document.querySelector('#focusDock'), r = d.getBoundingClientRect();
    const bar = document.querySelector('.mobile-nav');
    return {bubble: !!d.querySelector('.fd-bubble'), left: Math.round(r.left),
      clearsBar: !bar || r.bottom <= bar.getBoundingClientRect().top + 1,
      onScreen: r.left >= 0 && r.right <= innerWidth}; });
  yes('it is the circle on a phone', phone.bubble, JSON.stringify(phone));
  yes('  above the bar the navigation became', phone.clearsBar, JSON.stringify(phone));
  yes('  and inside the screen', phone.onScreen, JSON.stringify(phone));
  await p.setViewportSize({width: 1500, height: 1200}); await p.waitForTimeout(500);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\nsmoke120  ${bad} FAILED` : '\nsmoke120  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
