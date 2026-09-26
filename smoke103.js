/* smoke103 — the clock, and a Compass drawn from measured time. The clock used
   to be a panel on Today; it floats over every room now, so what was "is it on
   the page" is "is it on every page". What it records has not changed, which is
   the half of this file that matters: a sitting of seconds is not a session, a
   sitting of a quarter of an hour is, and the break inside it is written down
   with what the break was for. */
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
  const p = await b.newPage({viewport:{width:1400, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const draw = async () => { await p.evaluate(() => rerender()); await p.waitForTimeout(700); };
  const onToday = async () => { await p.evaluate(() => { setTodayView('do'); if(location.hash === '#/today') rerender(); else location.hash = '#/today'; }); await p.waitForTimeout(900); };
  const onCompass = async () => { await p.evaluate(() => { if(location.hash === '#/compass') rerender(); else location.hash = '#/compass'; }); await p.waitForTimeout(1200); };

  console.log('\n1. the timer is not somewhere you go to — it is everywhere');
  await onToday();
  yes('the clock is on the page', !!(await p.$('#focusDock')));
  /* the dial is in the sidebar and the words about the sitting are on Today,
     so both are true at once */
  yes('and the words about the sitting are still a section of Today', !!(await p.$('#t-focus')));
  yes('and Today offers to jump to them', await p.evaluate(() =>
    [...document.querySelectorAll('[data-jump]')].some(x => /focus/.test(x.textContent))));
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);
  yes('and it is still there in the next room', !!(await p.$('#focusDock')));
  /* Planning used to carry a lesser timer of its own — one that could start
     and stop and could not take a note of anything. It is gone, not merely
     relabelled: there is one clock and it is the floating one. */
  yes('Planning no longer has a timer of its own',
      await p.evaluate(() => !document.querySelector('#plFocusBtn')
        && !document.querySelector('.ft-wrap') && typeof openFocusTimer === 'undefined'));

  console.log('\n2. a task becomes the subject by being dragged into it');
  const tid = await p.evaluate(() => {
    const t = {id: uid(), text: 'write the grant section', day: today(), done: false, doneAt: null,
      notes: '', order: 0, createdAt: new Date().toISOString(), links: {projects: [], skills: []}};
    planTaskDefaults(t); S.tasks.push(t); saveNow(); return t.id;
  });
  await onToday();
  await p.evaluate(() => { const d = document.querySelector('#t-tasks'); if(d) d.open = true; });
  await p.waitForTimeout(500);
  const dropped = await p.evaluate(id => {
    const from = document.querySelector(`[data-taskrow="${id}"]`);
    const to = document.querySelector('[data-focusdrop]');
    if(!from || !to) return 'missing';
    const dt = new DataTransfer();
    const ev = (el, type) => el.dispatchEvent(new DragEvent(type, {bubbles:true, cancelable:true, dataTransfer:dt}));
    ev(from, 'dragstart'); ev(to, 'dragover'); ev(to, 'drop'); ev(from, 'dragend');
    return FocusTimer.state().taskId;
  }, tid);
  is('dropping a task on the clock makes it the session’s subject', dropped, tid);
  await draw();
  yes('and the clock says which task it is on',
      await p.evaluate(() => /grant section/.test(document.querySelector('#focusDock').textContent)));

  console.log('\n3. pausing is a break, and the break takes a note');
  await p.evaluate(() => FocusTimer.start(undefined, 'focus'));
  await draw();
  yes('the clock is running', await p.evaluate(() => FocusTimer.state().running));
  await p.evaluate(() => FocusTimer.pause());
  await draw();
  yes('pausing opens a break', await p.evaluate(() => FocusTimer.state().onBreak));
  yes('and asks what it is for', !!(await p.$('#fpBreakNote')));
  await p.fill('#fpBreakNote', 'tea, and answering Mara');
  await p.waitForTimeout(600);
  is('what is typed is kept on the break',
     await p.evaluate(() => FocusTimer.state().breakNote), 'tea, and answering Mara');
  await p.evaluate(() => FocusTimer.start(undefined, 'focus'));
  await draw();
  yes('resuming closes it', await p.evaluate(() => !FocusTimer.state().onBreak));

  console.log('\n4. a sitting that lasted no time is not written down');
  await p.evaluate(() => FocusTimer.stop(true));
  const shortOne = await p.evaluate(id => planState().focusSessions.some(s => s.taskId === id), tid);
  yes('seconds of work do not become a logged session', !shortOne);

  console.log('\n4b. one that lasted a while is — with its start, its end and its breaks');
  /* the timer measures real elapsed time, so give it some: the page clock is
     wound forward rather than the test sitting through twenty minutes */
  await p.clock.install();
  await p.evaluate(id => { FocusTimer.setTask(id); FocusTimer.start(undefined, 'focus'); }, tid);
  await p.clock.fastForward('08:00');            // eight minutes of work
  await p.evaluate(() => FocusTimer.pause());
  await p.evaluate(() => FocusTimer.noteBreak('tea, and answering Mara'));
  await p.clock.fastForward('03:00');            // three minutes of break
  await p.evaluate(() => FocusTimer.start(undefined, 'focus'));
  await p.clock.fastForward('05:00');            // five more of work
  const rec = await p.evaluate(() => {
    FocusTimer.stop(true);
    const st = planState();
    const s = st.focusSessions[st.focusSessions.length - 1];
    return s ? {taskId: s.taskId, minutes: s.duration, hasStart: !!s.startedAt, hasEnd: !!s.endedAt,
      breaks: (s.breaks || []).length, note: (s.breaks || [])[0]?.note || ''} : null;
  });
  yes('a session was written', !!rec, 'none');
  if(rec){
    is('  against the task it was on', rec.taskId, tid);
    yes('  with an exact start and an exact end', rec.hasStart && rec.hasEnd);
    yes('  and the minutes worked, not the minutes elapsed', rec.minutes >= 12 && rec.minutes <= 14, `${rec.minutes}m`);
    is('  the break it contained', rec.breaks, 1);
    is('  including what the break was for', rec.note, 'tea, and answering Mara');
  }
  await p.clock.runFor(0);

  console.log('\n5. the record of how a task was done, read off its sittings');
  await p.evaluate(id => {
    const st = planState(), now = Date.now();
    st.focusSessions.push({id: uid(), taskId: id, type: 'focus', duration: 45,
      startedAt: new Date(now - 3 * 3600e3).toISOString(), endedAt: new Date(now - 2.2 * 3600e3).toISOString(),
      completed: true, breaks: [{from: new Date(now - 2.6 * 3600e3).toISOString(), to: new Date(now - 2.5 * 3600e3).toISOString(), note: 'a walk'}]});
    saveNow();
  }, tid);
  const wr = await p.evaluate(id => taskWorkRecord(id), tid);
  yes('there is a record', !!wr);
  yes('  it knows when the work first started', !!wr.startedAt);
  yes('  and when it last stopped', !!wr.finishedAt);
  yes('  how long was actually worked', wr.minutes > 0, String(wr.minutes));
  yes('  over how many sittings', wr.sessions >= 2, String(wr.sessions));
  yes('  and what the breaks were for', wr.breakNotes.includes('a walk'), wr.breakNotes.join(' | '));

  /* The clock is a floating gadget now, and an open one stands over the
     bottom-left of whatever room you are in — which is where the Compass draws
     its chart. Fold it back to its circle before measuring anything by
     coordinate, the same way a person would. */
  await p.evaluate(() => setFocusDockShut(true)); await p.waitForTimeout(400);

  console.log('\n6. the Compass draws the measured hours, and no longer asks about wasted ones');
  await p.evaluate(() => {
    for(let i = 0; i < 7; i++){
      const d = addDays(today(), -i), r = rhythmDay(d);
      r.wakeTime = '07:00'; r.sleepTime = '23:00';
      planState().focusSessions.push({id: uid(), taskId: null, type: 'focus', duration: 120, completed: true, breaks: [],
        startedAt: new Date(parseDay(d).getTime() + 9 * 3600e3).toISOString(),
        endedAt: new Date(parseDay(d).getTime() + 11 * 3600e3).toISOString()});
    }
    saveNow();
  });
  await onCompass();
  is('the figure is about hours made use of',
     await p.evaluate(() => document.querySelector('.time-pie .sc').textContent), 'Hours made use of');
  yes('the word "wasted" is nowhere on the page',
      await p.evaluate(() => !/wasted/i.test(document.body.innerText)));
  yes('and there is no button asking you to claim hours by hand',
      await p.evaluate(() => !document.querySelector('#wkClaim')));
  const pie = await p.evaluate(() => {
    const keys = [...document.querySelectorAll('.tp-key .n')].map(n => n.textContent);
    return {pct: document.querySelector('.tp-big')?.textContent, keys};
  });
  /* computed from the data rather than assumed: earlier sections have already
     put work on today, so a hard-coded percentage only tests the fixture */
  const want = await p.evaluate(() => { const sp = timeSplit(timeSpanDays());
    return {pct: Math.round(sp.worked / (sp.awake || sp.worked) * 100) + '%',
      worked: sp.worked.toFixed(1) + 'h', rest: sp.rest.toFixed(1) + 'h'}; });
  is('the share is computed from both measured quantities', pie.pct, want.pct);
  yes('  and both are shown', pie.keys.includes(want.worked) && pie.keys.includes(want.rest),
      `${pie.keys.join(' ')} vs ${want.worked}/${want.rest}`);

  /* Section 7 used to be here: the sleep chart, when it was a dot-and-line
     drawing with an SVG the pointer moved over. It is stacked bars now, one
     row to a day, with a readout that follows the row — a different drawing
     with different markup, and smoke178 tests it end to end, including the
     things this section cared about: that it fills its width, that the scale
     is the whole day rather than a fixed 4am-to-4am window, that there is a
     line saying which day you are on, and that it answers a pointer. Keeping
     a copy here that asserts the old markup only taught this file to crash. */

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke103  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
