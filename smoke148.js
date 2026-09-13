/* smoke148 — Today as a bento box: the clock and the day's list in one glance,
   the reflective half in pairs, and one column again on a narrow screen */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const rects = () => {
  const r = id => { const e = document.getElementById(id); if(!e) return null;
    const b = e.getBoundingClientRect();
    return {t:Math.round(b.top), b:Math.round(b.bottom), l:Math.round(b.left), r:Math.round(b.right)}; };
  return {focus:r('t-focus'), plan:r('t-plan'), tasks:r('t-tasks'), checkin:r('t-checkin'),
    habits:r('t-habits'), theatre:r('t-theatre'), still:r('t-still'),
    vh:innerHeight, hscroll: document.documentElement.scrollWidth > innerWidth + 1};
};

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const open = async (w, h, many = true) => {
    const p = await b.newPage({viewport:{width:w, height:h}});
    p.on('pageerror', e => errs.push(`${w}x${h} pageerror: ` + e.message));
    p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push(`${w}x${h} console: ` + m.text()); });
    await p.goto(FILE); await p.waitForTimeout(1000);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2100); }
    await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1500);
    if(many){ await p.evaluate(() => { for(let i=0;i<18;i++)
      S.tasks.push(Object.assign(newTask('Task number ' + i, today()), {duration:20}));
      saveNow(); rerender(); }); await p.waitForTimeout(900); }
    await p.evaluate(() => { ['t-plan','t-tasks'].forEach(i => { const d = document.getElementById(i); if(d) d.open = true; }); });
    await p.waitForTimeout(600);
    return p;
  };

  console.log('\n1. the clock and the list, in one glance');
  let p = await open(1440, 900);
  let m = await p.evaluate(rects);
  yes('the list is to the right of the clock, not below it',
      m.tasks.l >= m.focus.r - 2, `focus ${m.focus.l}-${m.focus.r}, tasks ${m.tasks.l}-${m.tasks.r}`);
  is('  the plan is in that column too', m.plan.l, m.tasks.l);
  yes('  and the clock stands beside both', m.focus.t <= m.plan.t + 2 && m.focus.b >= m.tasks.b - 2);
  yes('both are on screen without scrolling', m.focus.t >= 0 && m.tasks.b <= m.vh,
      `tasks bottom ${m.tasks.b}, screen ${m.vh}`);
  /* the two columns are near enough equal — neither is a sliver */
  const wF = m.focus.r - m.focus.l, wT = m.tasks.r - m.tasks.l;
  yes('  neither column is a sliver', Math.min(wF, wT) / Math.max(wF, wT) > 0.8, `${wF} vs ${wT}`);
  yes('  and nothing runs off the side', !m.hscroll);

  console.log('\n2. a long list scrolls inside its own compartment');
  const sc = await p.evaluate(() => { const t = document.getElementById('t-tasks');
    return {rows:document.querySelectorAll('#t-tasks .task-row').length,
      scrolls:t.scrollHeight > t.clientHeight + 1, client:t.clientHeight, full:t.scrollHeight}; });
  yes('there are more rows than fit', sc.rows >= 20, `${sc.rows} rows`);
  yes('  the compartment scrolls rather than growing', sc.scrolls, `${sc.client} of ${sc.full}`);
  /* and the page itself is not what moved */
  m = await p.evaluate(rects);
  yes('  the band still ends above the fold', m.tasks.b <= m.vh, `${m.tasks.b} vs ${m.vh}`);
  /* the heading stays put while the rows go by */
  const stuck = await p.evaluate(() => {
    const t = document.getElementById('t-tasks'), s = t.querySelector('summary');
    const before = Math.round(s.getBoundingClientRect().top);
    t.scrollTop = 300;
    return {before, after: Math.round(s.getBoundingClientRect().top), moved: t.scrollTop};
  });
  yes('  and its heading is pinned while they do', stuck.moved > 0 && stuck.after === stuck.before,
      `${stuck.before} → ${stuck.after}`);
  await p.close();

  console.log('\n3. the reflective half goes in pairs');
  p = await open(1440, 900, false);
  m = await p.evaluate(rects);
  yes('the check-in and the habits share a row', m.habits.l >= m.checkin.r - 2);
  yes('  the theatre and the stillness share the next', m.still.l >= m.theatre.r - 2);
  yes('  and the pairs are stacked, not interleaved', m.theatre.t >= m.checkin.t);
  is('the index offers them in the order the page has them',
     await p.evaluate(() => [...document.querySelectorAll('[data-jump]')].map(n => n.dataset.jump).join(',')),
     't-focus,t-plan,t-tasks,t-checkin,t-habits,t-theatre,t-still,t-tonight');
  await p.close();

  console.log('\n4. a narrow screen is the single column it always was');
  p = await open(880, 1100, false);
  m = await p.evaluate(rects);
  is('the clock and the list share a left edge', m.tasks.l, m.focus.l);
  yes('  the clock is above the list', m.focus.b <= m.tasks.t + 2);
  yes('  the pairs stack too', m.habits.t >= m.checkin.b - 2 && m.still.t >= m.theatre.b - 2);
  yes('  nothing runs off the side', !m.hscroll);
  yes('  and nothing is trapped in a scroller', await p.evaluate(() => {
    const t = document.getElementById('t-tasks');
    return getComputedStyle(t).overflowY !== 'auto' || t.scrollHeight <= t.clientHeight + 1; }));
  await p.close();

  console.log('\n5. the day\'s own grid does not disturb the Review dashboard');
  /* .bento is the Review tab's twelve-column grid; the day's band is .daybox,
     and the two must not read each other's rules */
  p = await b.newPage({viewport:{width:1440, height:900}});
  p.on('pageerror', e => errs.push('review pageerror: ' + e.message));
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2100); }
  await p.evaluate(() => { location.hash = '#/journals/review'; rerender(); }); await p.waitForTimeout(1800);
  const cols = await p.evaluate(() => { const n = document.querySelector('.rv-dash .bento');
    return n ? getComputedStyle(n).gridTemplateColumns.split(' ').length : -1; });
  is('the Review grid still has its twelve columns', cols, 12);
  is('  and Today\'s band is not one of them',
     await p.evaluate(() => document.querySelectorAll('.rv-dash .daybox').length), 0);
  await p.close();

  console.log('\n6. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke148  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
