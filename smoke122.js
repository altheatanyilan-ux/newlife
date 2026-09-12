/* smoke122 — Finance: a stream tied to a project shows up, a stream can be
   written down for later, and a stream can be a shelf of parts */
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
  const p = await b.newPage({viewport:{width:1500, height:1300}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const fin = async () => { await p.evaluate(() => { if(location.hash === '#/finance') rerender(); else location.hash = '#/finance'; });
    await p.waitForTimeout(1700); };
  await fin();
  const cards = () => p.$$eval('.stream-card .serif', n => n.map(x => x.textContent.trim()));

  console.log('\n1. a stream tied to a project appears on Finance');
  const pid = await p.evaluate(() => S.projects[0].id);
  const pname = await p.evaluate(i => byId(S.projects, i).name, pid);
  const before = (await cards()).length;
  await p.click('#streamAdd'); await p.waitForTimeout(600);
  await p.selectOption('#stProj', pid);
  /* deliberately no figures: that is how you start, and it is the only state a
     project not begun yet can be in */
  await p.click('#stSave'); await p.waitForTimeout(1600);
  is('a card appeared', (await cards()).length, before + 1);
  yes('  named after the project', (await cards()).includes(pname), (await cards()).join(' | '));
  yes('  even with no figures filled in', await p.evaluate(i =>
    !byId(S.projects, i).income.current && !byId(S.projects, i).income.target, pid));
  yes('  and it links through to the project',
      !!(await p.$(`.stream-card a[href="#/projects/${pid}"]`)));
  yes('  the project knows it is a stream', await p.evaluate(i => byId(S.projects, i).income.isStream === true, pid));
  /* the link is the point: the plan is worked out in one room, the earnings read in the other */
  await p.click(`.stream-card a[href="#/projects/${pid}"]`); await p.waitForTimeout(1600);
  yes('following it lands on the project', await p.evaluate(() => location.hash.includes('/projects')));
  await fin();

  console.log('\n2. a stream can be written down for later');
  yes('there is a button for it', !!(await p.$('#streamFuture')));
  await p.click('#streamFuture'); await p.waitForTimeout(600);
  yes('  the form says what it is for', /stops taking up room in your head/.test(await p.textContent('#modals')));
  await p.fill('#stName', 'A course, one day');
  await p.fill('#stTarget', '400');
  await p.click('#stSave'); await p.waitForTimeout(1600);
  const fut = await p.evaluate(() => S.incomeStreams.find(x => x.name === 'A course, one day'));
  is('it is marked as future', fut.status, 'future');
  yes('it is listed under "not counted yet"',
      await p.evaluate(() => /Not counted yet/.test(document.querySelector('#main').textContent)));
  yes('  and shown there', (await cards()).includes('A course, one day'), (await cards()).join(' | '));
  const totals = await p.evaluate(() => portfolioTotals());
  yes('but its target is not in the totals', totals.totalTargetBase < 400 ||
      !totals.streams.some(x => x.name === 'A course, one day'),
      JSON.stringify({t: totals.totalTargetBase, n: totals.streams.map(x => x.name)}));

  console.log('\n3. a stream can be a shelf of parts');
  const sid = await p.evaluate(() => {
    const st = {id: uid(), name: 'Digital products', model:'', current: 0, target: 0,
      earning:'passive', status:'earning'};
    migrateIncomeShape(st); S.incomeStreams.push(st); saveNow(); return st.id;
  });
  await fin();
  yes('every stream offers to be split', await p.evaluate(() =>
    document.querySelectorAll('[data-subadd]').length === document.querySelectorAll('.stream-card').length));
  await p.evaluate(i => {
    const st = byId(S.incomeStreams, i);
    st.subs = [{id:uid(), name:'The templates', current:120, target:300},
               {id:uid(), name:'The course', current:80, target:700}];
    saveNow();
  }, sid);
  await fin();
  const rolled = await p.evaluate(i => { const st = byId(S.incomeStreams, i);
    return {cur: streamCurrent(st), tgt: streamTarget(st), own: st.current}; }, sid);
  is('the stream earns what its parts earn', rolled.cur, 200);
  is('  and hopes for what they hope for', rolled.tgt, 1000);
  is('  while its own field is left alone', rolled.own, 0);
  yes('the parts are on the card', await p.evaluate(() =>
    [...document.querySelectorAll('.substream')].length >= 2));
  yes('  and the total is shown rather than an editable zero', await p.evaluate(() =>
    /Added up from the parts/.test(document.querySelector('#main').textContent)));
  const t2 = await p.evaluate(() => portfolioTotals().totalCurrentBase);
  yes('the portfolio counts the parts, not the empty parent', t2 >= 200, String(t2));

  console.log('\n3b. splitting a stream that already earns keeps what it earned');
  const sid2 = await p.evaluate(() => {
    const st = {id: uid(), name:'Freelance', model:'', current: 900, target: 1500, earning:'active', status:'earning'};
    migrateIncomeShape(st); S.incomeStreams.push(st); saveNow(); return st.id;
  });
  await fin();
  await p.evaluate(i => { document.querySelector(`[data-subadd="incomeStreams.#${i}"]`).click(); }, sid2);
  await p.waitForTimeout(1200);
  const kept = await p.evaluate(i => { const st = byId(S.incomeStreams, i);
    return {n: st.subs.length, cur: streamCurrent(st), tgt: streamTarget(st)}; }, sid2);
  is('the first part inherits the figures', kept.cur, 900);
  is('  and the target with them', kept.tgt, 1500);
  is('  as one part', kept.n, 1);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke122  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
