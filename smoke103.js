/* smoke103 — the focus panel, and a Compass drawn from measured time */
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
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const draw = async () => { await p.evaluate(() => rerender()); await p.waitForTimeout(700); };
  const onToday = async () => { await p.evaluate(() => { if(location.hash === '#/today') rerender(); else location.hash = '#/today'; }); await p.waitForTimeout(900); };
  const onCompass = async () => { await p.evaluate(() => { if(location.hash === '#/compass') rerender(); else location.hash = '#/compass'; }); await p.waitForTimeout(1200); };

  console.log('\n1. the timer is on Today, not somewhere you go to');
  await onToday();
  yes('there is a focus panel on the page', !!(await p.$('#t-focus')));
  yes('and it is in the page index', await p.evaluate(() =>
    [...document.querySelectorAll('[data-jump]')].some(x => /focus/.test(x.textContent))));
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);
  yes('Planning no longer opens a second one',
      await p.evaluate(() => { const b = document.querySelector('#plFocusBtn'); return !!b && /↗/.test(b.textContent); }));

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
  is('dropping a task on the panel makes it the session’s subject', dropped, tid);
  await draw();
  yes('and the panel says which task it is on',
      await p.evaluate(() => /grant section/.test(document.querySelector('#t-focus').textContent)));

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

  console.log('\n7. the sleep chart is readable');
  const chart = await p.evaluate(() => {
    const svg = document.querySelector('.wk-svg'); if(!svg) return null;
    const r = svg.getBoundingClientRect();
    const page = document.querySelector('.week-shape').getBoundingClientRect();
    const ticks = [...document.querySelectorAll('.wk-tick')].map(t => t.textContent);
    return {w: Math.round(r.width), pageW: Math.round(page.width), ticks,
      cols: document.querySelectorAll('.wk-col').length,
      readout: document.querySelector('.wk-col title')?.textContent || ''};
  });
  yes('it fills the width it is given rather than a third of it',
      chart && chart.w > chart.pageW * 0.85, chart ? `${chart.w} of ${chart.pageW}` : 'no chart');
  yes('the scale is fitted to the readings, not a fixed 4am–4am',
      chart && !chart.ticks.includes('4am') && chart.ticks.length >= 4, (chart?.ticks || []).join(' '));
  is('every day is a strip you can point at', chart && chart.cols, 7);
  yes('and pointing at one reads out that day',
      /woke/.test(chart.readout) && /slept/.test(chart.readout), chart.readout);
  yes('  including how much of it was worked', /worked/.test(chart.readout), chart.readout);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke103  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
