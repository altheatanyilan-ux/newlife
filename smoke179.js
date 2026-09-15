/* smoke179 — the planning page opens on the right thing, in the right shape.

   Two complaints, and they turn out to be the same one: the page was arranged
   for the moment after you have decided what you are looking at, and the two
   things you do BEFORE that were in the wrong places.

   Every selection opened on the matrix, deliberately — picking a list is
   asking "what is in here, and what should I touch first", and the matrix
   answers the second half. That reasoning holds for a list and breaks for a
   date. Today, Tomorrow and the next seven days are not asking what to touch
   first; the answer to that is the order the day is already in. They are
   asking what is there, and the matrix takes a day and sorts it into four
   boxes when what you wanted was the day.

   And the search box lived at the top of the sidebar, above the lists. So
   searching — which you do before you have chosen a list — sat inside the
   column of lists, and pushed every list a box-height below the content
   beside it. It is on the line the new-task button is on now, which is where
   the other before-you-choose control already was, and the lists start level
   with the content.

   One thing worth naming: pressing a date and arriving at the page with that
   date already chosen have to agree. The saved view preference is a memory of
   some other list, and letting it decide on arrival is how a page tells you
   two different things about the same selection depending on how you got there. */
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
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1400, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1900); }
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);

  console.log('\n1. a date opens as a day, a list opens as a matrix');
  for(const id of ['today', 'tomorrow', 'next7']){
    await p.evaluate(x => planSetSpan(x), id); await p.waitForTimeout(700);
    is(`  ${id} opens in the list`, await p.evaluate(() => planView()), 'list');
  }
  await p.evaluate(() => { const l = planLists()[0]; if(l) planSetSel('list', l.id); });
  await p.waitForTimeout(700);
  is('a list of your own still opens on the matrix',
    await p.evaluate(() => planView()), 'eisenhower');
  /* and choosing a view by hand still wins for as long as you are here */
  await p.evaluate(() => planSetView('calendar')); await p.waitForTimeout(600);
  is('  and a view chosen by hand is respected', await p.evaluate(() => planView()), 'calendar');
  await p.evaluate(() => planSetSpan('today')); await p.waitForTimeout(700);
  is('  until you pick a date again', await p.evaluate(() => planView()), 'list');

  console.log('\n2. arriving agrees with pressing');
  /* the saved preference is a memory of some other list; it must not decide
     what a date looks like the next time the page is opened */
  await p.evaluate(() => { planState().prefs.view = 'eisenhower'; saveNow(); location.hash = '#/values'; });
  await p.waitForTimeout(900);
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1400);
  const arrived = await p.evaluate(() => ({sel: planSel(), view: planView(),
    saved: planState().prefs.view}));
  yes('  the page was left remembering the matrix', arrived.saved === 'eisenhower');
  yes('  the date was still the selection', arrived.sel.kind === 'smart'
    && ['today','tomorrow','next7'].includes(arrived.sel.id), JSON.stringify(arrived.sel));
  is('  and it comes back as a day, not a matrix', arrived.view, 'list');

  console.log('\n3. searching and adding share the top line');
  const top = await p.evaluate(() => {
    const s = document.querySelector('.pl-top #plSearch');
    const a = document.querySelector('.pl-top .ctx-add');
    const t = n => n ? Math.round(n.getBoundingClientRect().top) : null;
    return {search: !!s, add: !!a,
      sameLine: s && a ? Math.abs(t(s) - t(a)) < 14 : false,
      stillInSidebar: !!document.querySelector('.pl-side #plSearch')};
  });
  yes('the search box is at the top of the content', top.search);
  yes('  beside the new-task button', top.add && top.sameLine);
  yes('  and no longer inside the column of lists', !top.stillInSidebar);
  /* it still has to work from there */
  await p.fill('.pl-top #plSearch', 'zzzznothing'); await p.waitForTimeout(700);
  is('  and it still searches', await p.evaluate(() => S._planQ), 'zzzznothing');
  await p.fill('.pl-top #plSearch', ''); await p.waitForTimeout(600);

  console.log('\n4. and the two columns start on the same line');
  const rows = await p.evaluate(() => {
    const side = document.querySelector('.pl-side .pl-scroll > *');
    const main = document.querySelector('.pl-header');
    const t = n => n ? Math.round(n.getBoundingClientRect().top) : null;
    return {side: t(side), main: t(main),
      chevronInFlow: getComputedStyle(document.querySelector('.pl-collapse')).position};
  });
  yes('the lists begin level with the content beside them',
    rows.side != null && Math.abs(rows.side - rows.main) < 10,
    `sidebar ${rows.side}, content ${rows.main}`);
  /* the gap was the collapse chevron, sitting above the lists in the flow */
  is('  and the chevron is no longer pushing them down', rows.chevronInFlow, 'absolute');

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke179  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
