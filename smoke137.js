/* smoke137 — the top of Today: no add-bar, and the clock before the plan */
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
  const go = async h => { await p.evaluate(x => { if(location.hash === x) rerender(); else location.hash = x; }, h);
    await p.waitForTimeout(1400); await p.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove())); };
  await go('#/today');

  console.log('\n1. Today no longer carries a row of add buttons');
  yes('the bar is gone', await p.evaluate(() => !document.querySelector('#ctxAdd')));
  /* and nothing it offered is stranded: each has its own place on the page */
  yes('  a task is still written in the task list itself',
      await p.evaluate(() => !!document.querySelector('#t-tasks .quick-task, #t-tasks input[data-quicktask], #t-tasks .row input')));
  yes('  the intention is still asked for in the check-in',
      await p.evaluate(() => /Today's intention/.test(document.querySelector('#t-checkin')?.textContent || '')));
  yes('  an unfinished thought still has its section',
      await p.evaluate(() => !!document.querySelector('#t-unfinished')));
  yes('  and the speed dial still reaches a note and a dump',
      await p.evaluate(() => { openSpeedDial(); const t = document.querySelector('#speedDial').textContent;
        closeSpeedDial(); return /Quick note/.test(t) && /Unfinished thought/.test(t); }));

  console.log('\n2. the focus clock sits above the plan');
  const order = await p.evaluate(() => [...document.querySelectorAll('#main .page > [id^="t-"]')].map(n => n.id));
  const iF = order.indexOf('t-focus'), iP = order.indexOf('t-plan'), iT = order.indexOf('t-tasks');
  yes('focus, then the plan, then the tasks', iF >= 0 && iF < iP && iP < iT, order.join(' → '));
  const jumps = await p.evaluate(() => [...document.querySelectorAll('.today-jump [data-jump]')].map(b => b.dataset.jump));
  yes('  and the jump links read in the same order as the page',
      jumps.filter(j => order.includes(j)).join(',') === order.filter(o => jumps.includes(o)).join(','),
      jumps.join(' → '));

  console.log('\n3. the focus clock has three hands');
  const hands = await p.evaluate(() => ({
    hour: !!document.querySelector('.fc-hour'), min: !!document.querySelector('.fc-min'), sec: !!document.querySelector('.fc-sec')}));
  yes('an hour hand, a minute hand and a second hand', hands.hour && hands.min && hands.sec, JSON.stringify(hands));
  /* the hour hand must be the short one, or it reads as a second minute hand */
  const lens = await p.evaluate(() => {
    const L = sel => { const l = document.querySelector(sel + ' line');
      return Math.abs(+l.getAttribute('y1') - +l.getAttribute('y2')); };
    return {hour: L('.fc-hour'), min: L('.fc-min'), sec: L('.fc-sec')}; });
  yes('  and the hour hand is the shortest of the three', lens.hour < lens.min && lens.min < lens.sec, JSON.stringify(lens));
  /* a sitting of two and a half hours, put through the real face-drawing
     code: the hour hand should be a quarter of the way round while the minute
     hand is back at the top */
  const ang = await p.evaluate(() => {
    const html = focusClockHTML(9000, .5, '#888', FocusTimer.state(), true);
    const box = document.createElement('div'); box.innerHTML = html;
    const deg = sel => +box.querySelector(sel).getAttribute('style').match(/rotate\(([-\d.]+)deg\)/)[1];
    return {hour: deg('.fc-hour'), min: deg('.fc-min'), sec: deg('.fc-sec')};
  });
  is('  two and a half hours puts the hour hand at 75°', ang.hour, 75);
  is('  with the minute hand back at the top', ang.min, 180);
  is('  and the second hand on the twelve', ang.sec, 0);
  const ang12 = await p.evaluate(() => {
    const box = document.createElement('div');
    box.innerHTML = focusClockHTML(43200, .5, '#888', FocusTimer.state(), true);
    return +box.querySelector('.fc-hour').getAttribute('style').match(/rotate\(([-\d.]+)deg\)/)[1];
  });
  is('  and twelve hours brings it right round', ang12, 0);

  console.log('\n4. every other page keeps its add button');
  for(const [hash, page] of [['#/planning','Planning'], ['#/people','People'], ['#/projects','Projects']]){
    await go(hash);
    yes(`${page} still has one`, await p.evaluate(() => !!document.querySelector('#ctxAdd')));
  }
  await go('#/today');
  yes('and coming back to Today still has none', await p.evaluate(() => !document.querySelector('#ctxAdd')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke137  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
