/* smoke130 — the Planning sidebar, and a timer on every task */
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
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const plan = async () => { await p.evaluate(() => { if(location.hash === '#/planning') rerender(); else location.hash = '#/planning'; }); await p.waitForTimeout(1500); };
  await plan();

  console.log('\n1. the sidebar loses All and the focus timer, and the filter goes to the foot');
  yes('"All" is gone', !(await p.$('[data-plsel="smart:all"]')));
  yes('  and so is the focus timer, which is no longer a place', !(await p.$('#plFocusBtn')));
  yes('the filter is in the foot', await p.evaluate(() => !!document.querySelector('.pl-foot #plSideFilter')));
  yes('  not at the top', await p.evaluate(() => !document.querySelector('.pl-scroll #plSideFilter')));
  yes('  and it still opens', await p.evaluate(() => typeof openPlanQuickFilter === 'function'));
  /* the lists come up to meet the search */
  const order = await p.$$eval('#plSide .pl-scroll > *', n => n.map(x => x.id || x.className.split(' ')[0]));
  const iSearch = order.indexOf('plSearch'), iLists = order.indexOf('plLists');
  yes('the lists sit near the top', iLists - iSearch <= 3, order.join(' → '));
  yes('  with only the dated row between them', order[iSearch + 1] === 'pl-group' && order[iSearch + 2] === 'pl-head', order.join(' → '));

  console.log('\n2. a remembered selection on All lands somewhere that exists');
  await p.evaluate(() => { S._planSel = {kind:'smart', id:'all'}; rerender(); }); await p.waitForTimeout(900);
  const sel = await p.evaluate(() => planSel());
  yes('it is not left on All', sel.id !== 'all', JSON.stringify(sel));
  yes('  and something in the sidebar is lit',
      await p.evaluate(() => !!document.querySelector('#plSide .pl-item.on')));

  console.log('\n3. every task carries its estimate, wherever it is drawn');
  await p.evaluate(() => { S._planSel = {kind:'smart', id:'today'}; S._planView = 'list'; rerender(); });
  await p.waitForTimeout(1000);
  const rows = await p.$$eval('.pt-row', n => n.length);
  const timers = await p.$$eval('.pt-row [data-test]', n => n.length);
  yes('the Planning list row has one', rows > 0 && timers === rows, `${timers} chips on ${rows} rows`);
  await p.evaluate(() => { S._planView = 'eisenhower'; rerender(); }); await p.waitForTimeout(1000);
  const cards = await p.$$eval('.pk-card', n => n.length);
  const cardT = await p.$$eval('.pk-card [data-test]', n => n.length);
  yes('  so does the matrix card', cards > 0 && cardT === cards, `${cardT} chips on ${cards} cards`);
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1400);
  const trows = await p.$$eval('.task-row', n => n.length);
  const tT = await p.$$eval('.task-row [data-test]', n => n.length);
  yes('  and the Today row', trows > 0 && tT === trows, `${tT} chips on ${trows} rows`);

  console.log('\n4. pressing it puts the task on today and starts the sitting there');
  /* a chip with no estimate asks for a length instead of starting, so give
     this one a length before pressing it */
  const tid = await p.evaluate(() => {
    const el = document.querySelector('.task-row [data-test]'); const id = el.dataset.test;
    const r = findTaskRef(id); if(r && !taskEstOf(r.task)){ r.task.duration = 20; saveNow(); rerender(); }
    return id; });
  await p.waitForTimeout(900);
  await p.evaluate(() => FocusTimer.reset());
  await p.evaluate(i => document.querySelector(`.task-row [data-test="${i}"]`).click(), tid);
  await p.waitForTimeout(1200);
  const st = await p.evaluate(() => FocusTimer.state());
  is('the timer is running', st.running, true);
  is('  on that task', st.taskId, tid);
  yes('  and its own button says so', await p.evaluate(i =>
    !!document.querySelector(`[data-test="${i}"].on`), tid));

  /* pressed from Planning: the task joins today's list and you land on Today,
     at the full timer rather than a lesser one in a side panel. Joining today
     is the DO date moving, not the deadline: sitting down with a thing says
     when you are doing it and nothing at all about when it is owed, and
     moving the deadline would make every task you ever touched read as due
     today. */
  await p.evaluate(() => FocusTimer.reset());
  /* give it a deadline five days out, so there is something to check is left
     alone — a task with no deadline cannot show that one was not moved */
  const away = await p.evaluate(() => {
    const t = (S.tasks || []).find(x => !x.done);
    if(!t) return null;
    t.day = addDays(today(), 5); t.doDay = ''; saveNow(); return t.id;
  });
  /* "All" now redirects to the dated view, and this task is deliberately not
     on today — so look at it in the list it actually lives in */
  const awayList = await p.evaluate(i => byId(S.tasks, i).listId, away);
  await p.evaluate(l => { S._planSel = {kind:'list', id:l}; S._planView = 'list';
    location.hash = '#/planning'; rerender(); }, awayList);
  await p.waitForTimeout(1400);
  await p.evaluate(i => { const t = byId(S.tasks, i); if(!taskEstOf(t)){ t.duration = 15; saveNow(); rerender(); } }, away);
  await p.waitForTimeout(900);
  const btn = await p.$(`[data-test="${away}"]`);
  yes('the task is reachable in Planning', !!btn, String(away));
  if(btn){
    await btn.click(); await p.waitForTimeout(1400);
    is('  it is put on today', await p.evaluate(i => byId(S.tasks, i).doDay, away),
       await p.evaluate(() => today()));
    is('  and is still owed when it was owed', await p.evaluate(i => byId(S.tasks, i).day, away),
       await p.evaluate(() => addDays(today(), 5)));
    is('  and we are taken to Today', await p.evaluate(() => parseHash().name), 'today');
    yes('  where the full timer is, with its work note and break log',
        !!(await p.$('#fpDid')) || await p.evaluate(() => !!document.querySelector('.fp-card')));
    yes('  and no lesser timer opens in a panel', !(await p.$('.focus-panel')));
    is('  the sitting is on that task', await p.evaluate(() => FocusTimer.state().taskId), away);
  }
  yes('the side-panel timer is gone from the app entirely',
      await p.evaluate(() => typeof openFocusTimer === 'undefined'));

  console.log('\n5. a task that has been sat with is in progress');
  const pid = await p.evaluate(() => (S.tasks || [])[0]?.id);
  is('with nothing logged, it is not', await p.evaluate(i => taskIsInProgress(i), pid), false);
  await p.evaluate(i => {
    planState().focusSessions = planState().focusSessions || [];
    planState().focusSessions.push({id:uid(), type:'focus', taskId:i, duration:25,
      startedAt:new Date().toISOString(), endedAt:new Date().toISOString(), breaks:[]});
    saveNow();
  }, pid);
  is('  once a sitting is logged, it is', await p.evaluate(i => taskIsInProgress(i), pid), true);
  is('  and the time is readable', await p.evaluate(i => taskFocusMinutes(i), pid), 25);
  /* The Board filed a sat-with task under In progress on its own, and a column
     chosen by hand beat that inference. The Board has since been retired — it
     arranged tasks by a status the matrix already arranges them by — so the
     only place "in progress" is still said is on the row, which is where it is
     read. The inference itself is tested above, on taskIsInProgress. */
  await p.evaluate(i => { const t = byId(S.tasks, i); t.listId = planState().lists.find(l => l.id !== 'inbox').id;
    t.day = ''; saveNow(); }, pid);
  const lid = await p.evaluate(i => byId(S.tasks, i).listId, pid);
  await p.evaluate(l => { S._planSel = {kind:'list', id:l}; S._planView = 'list'; location.hash = '#/planning'; rerender(); }, lid);
  await p.waitForTimeout(1200);
  yes('the row says it is in progress, without being told', await p.evaluate(i =>
    !!document.querySelector(`[data-ptrow="${i}"] .pt-wip`), pid));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke130  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
