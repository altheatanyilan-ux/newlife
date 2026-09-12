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

  console.log('\n3. every other page keeps its add button');
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
