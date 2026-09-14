/* smoke160 — the day, in two states of mind. Doing the day and looking at it
   are different things to be doing, and putting them on one scroll meant that
   reaching the check-in required scrolling past the task list — being asked to
   reflect while looking at the work. Two views, one at a time, with the switch
   remembered; and the things that belong to neither (the date, a letter of
   yours that has come due, the hour you went to sleep) staying out of both. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1340, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1600); }
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1200);

  /* which view a section is in, whether or not that view is showing */
  const where = id => p.evaluate(i => {
    const n = document.getElementById(i);
    if(!n) return null;
    const v = n.closest('.today-view');
    return v ? v.dataset.view : 'neither';
  }, id);
  /* .t-sec is the fold-memory class and only goes on a <details>; the focus
     panel is a <section>, because it is never folded away. Both are sections
     of the day, so both count here. */
  const shown = () => p.evaluate(() =>
    [...document.querySelectorAll('.today-view:not([hidden]) .t-sec, .today-view:not([hidden]) #t-focus')]
      .map(n => n.id));
  const jumps = () => p.evaluate(() =>
    [...document.querySelectorAll('[data-jump]')].map(n => n.dataset.jump));

  console.log('\n1. there are two of them, and one is showing');
  is('two views', await p.evaluate(() => document.querySelectorAll('.today-view').length), 2);
  is('  exactly one of them at a time',
    await p.evaluate(() => document.querySelectorAll('.today-view:not([hidden])').length), 1);
  is('  and the switch says which', await p.evaluate(() =>
    document.querySelector('.today-switch button.on')?.textContent.trim()), 'Execution');

  console.log('\n2. doing the day');
  for(const id of ['t-plan','t-focus','t-tasks','t-habits','t-tonight'])
    is(`${id} is execution`, await where(id), 'do');
  is('  and that is what is on the screen', await shown(),
    ['t-plan','t-focus','t-tasks','t-habits','t-tonight']);
  is('  with an index of exactly those', await jumps(),
    ['t-plan','t-focus','t-tasks','t-habits','t-tonight']);

  console.log('\n3. looking at it');
  for(const id of ['t-checkin','t-theatre','t-still','t-unfinished'])
    is(`${id} is inward`, await where(id), 'in');
  await p.click('[data-tview="in"]'); await p.waitForTimeout(800);
  is('the switch turns the page over', await shown(), ['t-checkin','t-theatre','t-still']);
  yes('  and the index turns with it',
    (await jumps()).every(j => ['t-checkin','t-theatre','t-still','t-unfinished'].includes(j)));

  console.log('\n4. what belongs to neither stays out of both');
  /* the hour you woke and the hour you slept bracket the whole day, and a
     letter that has come due is time-sensitive: none of them may be behind a
     switch that happens to be the other way round */
  is('the hour you woke', await p.evaluate(() =>
    document.querySelector('.day-edge.waking')?.closest('.today-view') ? 'inside' : 'outside'), 'outside');
  is('the hour you slept', await p.evaluate(() =>
    document.querySelector('.day-edge.sleeping')?.closest('.today-view') ? 'inside' : 'outside'), 'outside');
  const letters = await p.evaluate(() => {
    /* force a letter due and re-render, then look at where it lands */
    const e = {id:'smk-l', type:'letter', title:'To myself', createdAt:'2020-01-01T00:00:00',
      occurredAt:'2020-01-01', body:'x', extra:{sealedUntil:'2020-01-02'}};
    S.entries.unshift(e); rerender();
    const n = document.getElementById('t-letters');
    const out = !n ? 'ABSENT' : (n.closest('.today-view') ? 'inside' : 'outside');
    S.entries.shift(); rerender();
    return out;
  });
  await p.waitForTimeout(600);
  is('a letter that has come due', letters, 'outside');

  console.log('\n5. which half you were in is a preference');
  is('it is written down', await p.evaluate(() => S.settings.todayView), 'in');
  await p.evaluate(() => rerender()); await p.waitForTimeout(700);
  is('  and survives a redraw', await p.evaluate(() =>
    document.querySelector('.today-switch button.on')?.textContent.trim()), 'Looking inward');
  await p.evaluate(() => { location.hash = '#/values'; }); await p.waitForTimeout(700);
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1100);
  is('  and leaving the room and coming back', await p.evaluate(() =>
    document.querySelector('.today-switch button.on')?.textContent.trim()), 'Looking inward');

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke160  ${bad} FAILED` : '\nsmoke160  all good');
  process.exit(bad ? 1 : 0);
})();
