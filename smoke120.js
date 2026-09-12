/* smoke120 — the focus panel: countdown or stopwatch, a length, the task still
   readable, and a note on the sitting itself */
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
  const today_ = async () => { await p.evaluate(() => { if(location.hash === '#/today') rerender(); else location.hash = '#/today'; });
    await p.waitForTimeout(1500); };
  await today_();
  const face = () => p.evaluate(() => document.querySelector('.fp-time')?.textContent);

  console.log('\n1. which kind of sitting is asked before it starts');
  const modes = await p.$$eval('[data-fpmode]', n => n.map(x => x.dataset.fpmode));
  is('two kinds', modes.join(','), 'countdown,stopwatch');
  yes('each says what it is', await p.evaluate(() =>
    [...document.querySelectorAll('.fp-mwhy')].every(n => n.textContent.length > 8)));
  is('countdown to begin with', await p.evaluate(() => FocusTimer.state().mode), 'countdown');
  yes('  and it is the one marked', await p.evaluate(() =>
    document.querySelector('[data-fpmode="countdown"]').classList.contains('on')));

  console.log('\n2. a countdown has a length you can set');
  yes('the length row is there', !!(await p.$('.fp-len')));
  await p.click('[data-fplen="45"]'); await p.waitForTimeout(800);
  is('choosing 45 sets it', await p.evaluate(() => planState().timer.focusDuration), 45);
  is('  and the clock says so before it starts', await face(), '45:00');
  await p.fill('#fpLen', '12'); await p.evaluate(() => document.querySelector('#fpLen').dispatchEvent(new Event('change')));
  await p.waitForTimeout(900);
  is('any number can be typed', await p.evaluate(() => planState().timer.focusDuration), 12);
  is('  and the clock follows', await face(), '12:00');
  await p.evaluate(() => FocusTimer.setLength(999)); await p.waitForTimeout(300);
  is('  a silly number is clamped', await p.evaluate(() => planState().timer.focusDuration), 240);
  await p.evaluate(() => { FocusTimer.setLength(25); rerender(); }); await p.waitForTimeout(900);

  console.log('\n3. a countdown counts down and stops itself');
  await p.click('#fpGo'); await p.waitForTimeout(400);
  await p.clock.fastForward('01:00'); await p.waitForTimeout(500);
  is('a minute in, a minute is gone', await face(), '24:00');
  await p.click('#fpStop'); await p.waitForTimeout(900);

  console.log('\n4. a stopwatch counts up, and has no length to set');
  await p.click('[data-fpmode="stopwatch"]'); await p.waitForTimeout(800);
  is('the mode changed', await p.evaluate(() => FocusTimer.state().mode), 'stopwatch');
  yes('  and there is no length to choose', !(await p.$('.fp-len')));
  await p.click('#fpGo'); await p.waitForTimeout(400);
  await p.clock.fastForward('03:20'); await p.waitForTimeout(600);
  is('it counts up', await face(), '03:20');
  /* the clock is stubbed but the wait before fast-forwarding is real, so the
     count is a second or so past the fast-forward — the point is that it is
     counting the sitting, not that it is exact to the tick */
  const el = await p.evaluate(() => FocusTimer.state().elapsed);
  yes('  which the timer agrees with', Math.abs(el - 200) <= 3, `${el}s`);
  yes('  and it did not finish itself', await p.evaluate(() => FocusTimer.state().running));
  yes('the kind cannot be changed mid-sitting', await p.evaluate(() =>
    document.querySelector('[data-fpmode="countdown"]').disabled));
  is('  nor by asking the timer directly', await p.evaluate(() => FocusTimer.setMode('countdown')), false);

  console.log('\n5. the sitting takes a note of what it was for');
  yes('there is somewhere to write it', !!(await p.$('#fpDid')));
  await p.fill('#fpDid', 'the second draft'); await p.waitForTimeout(600);
  await p.clock.fastForward('10:00'); await p.waitForTimeout(500);
  await p.click('#fpStop'); await p.waitForTimeout(1000);
  const s = await p.evaluate(() => planState().focusSessions.slice(-1)[0]);
  is('the sitting was written down', !!s, true);
  is('  for as long as it actually ran', s.duration, 13);
  is('  marked as a stopwatch', s.mode, 'stopwatch');
  is('  and carrying the note', s.note, 'the second draft');

  console.log('\n6. a task in the timer is still readable');
  const tid = await p.evaluate(() => {
    const t = S.tasks.find(x => x.day === today()) || S.tasks[0];
    t.subtasks = [{id:uid(), title:'read the file', isCompleted:false, completedAt:null, sortOrder:0},
                  {id:uid(), title:'draft the reply', isCompleted:false, completedAt:null, sortOrder:1}];
    t.desc = 'the note I left myself'; saveNow();
    FocusTimer.setTask(t.id); rerender(); return t.id;
  });
  await p.waitForTimeout(1100);
  yes('its steps are on the panel', await p.evaluate(() => !!document.querySelector('#t-focus .sub-wrap .sub-row')));
  is('  both of them', await p.$$eval('#t-focus .sub-wrap .sub-row', n => n.length), 2);
  yes('  and what was written about it', await p.evaluate(() =>
    /the note I left myself/.test(document.querySelector('#t-focus').textContent)));
  yes('  with a caret to fold them away', !!(await p.$('#t-focus .fp-caret')));
  /* the steps are live, not a picture of the task */
  const doneBefore = await p.evaluate(i => byId(S.tasks, i).subtasks.filter(x => x.isCompleted).length, tid);
  await p.click('#t-focus .sub-wrap [data-subcheck]'); await p.waitForTimeout(900);
  is('a step can be ticked from the timer',
     await p.evaluate(i => byId(S.tasks, i).subtasks.filter(x => x.isCompleted).length, tid), doneBefore + 1);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke120  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
