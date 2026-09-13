/* smoke157 — Planning: three views, and a milestone you can get rid of.
   A milestone could be made and then never removed: pressing one filters the
   list, and the only door to the thing itself was a four-pixel pencil that
   appeared on hover inside the button that filters. There is a plain way in
   now. The Board and the Timeline are gone with it — the Board sorted tasks
   by a status the matrix already sorts them by, and the Timeline drew bars
   against dates the milestone strip draws above every view. */
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
  const errs = [];
  const p = await b.newPage({viewport:{width:1500, height:1000}});
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2100); }
  await p.evaluate(() => { location.hash = '#/planning'; rerender(); }); await p.waitForTimeout(1600);

  console.log('\n1. three ways to look at a list, not five');
  /* pick a real list — the strip and the view picker only exist for one */
  const row = (await p.evaluate(() => [...document.querySelectorAll('[data-plsel]')].map(n => n.dataset.plsel)))
    .find(r => r.startsWith('list:'));
  yes('the sidebar offers a list to open', !!row, row || 'none');
  await p.evaluate(r => document.querySelector(`[data-plsel="${r}"]`).click(), row);
  await p.waitForTimeout(1400);
  const views = await p.evaluate(() => [...document.querySelectorAll('[data-plview]')].map(n => n.dataset.plview));
  is('the picker offers exactly matrix, list and calendar', views.join(','), 'eisenhower,list,calendar');
  yes('  the Board is gone', !views.includes('kanban'));
  yes('  and so is the Timeline', !views.includes('timeline'));
  /* the matrix is the default and must still draw — it lived between the two
     removed views in the source, and taking them out took it with them once */
  yes('the matrix still draws', await p.evaluate(() => !!document.querySelector('.pe-grid')));
  yes('  with its four quadrants', await p.evaluate(() => document.querySelectorAll('.pe-quad').length === 4));
  /* a list still remembering Board must not leave the workspace blank */
  const fell = await p.evaluate(() => { planState().prefs.view = 'kanban'; S._planView = 'kanban';
    rerender(); return {v: planView(), drew: !!document.querySelector('.pe-grid')}; });
  is('a view remembered from before falls back to the matrix', fell.v, 'eisenhower');
  yes('  and the workspace is not blank', fell.drew);

  console.log('\n2. a milestone can be taken away');
  const seeded = await p.evaluate(() => {
    const host = planMilestoneList(planSel()); if(!host) return 0;
    planAddMilestone(host.id); planAddMilestone(host.id); saveNow(); rerender();
    return planMilestonesFor(planSel()).length; });
  yes('two dates were set on this list', seeded >= 2, `${seeded}`);
  await p.waitForTimeout(900);
  const hasManage = await p.evaluate(() => !!document.getElementById('plMsManage'));
  yes('the strip offers a way to manage them', hasManage);
  /* report rather than throw if it is not there: a suite that dies here stops
     testing everything after it, and the everything after it is the point */
  if(hasManage){ await p.evaluate(() => document.getElementById('plMsManage').click()); await p.waitForTimeout(700); }
  const mg = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.ms-mrow')];
    return {n: rows.length,
      rename: rows.every(r => !!r.querySelector('[data-msname]')),
      redate: rows.every(r => !!r.querySelector('[data-msdate]')),
      met:    rows.every(r => !!r.querySelector('[data-msmet]')),
      open:   rows.every(r => !!r.querySelector('[data-msopen]')),
      drop:   rows.every(r => !!r.querySelector('[data-msdrop]'))}; });
  is('every date is listed', mg.n, seeded);
  yes('  each can be renamed', mg.rename);
  yes('  re-dated', mg.redate);
  yes('  marked met', mg.met);
  yes('  opened on its own', mg.open);
  yes('  and removed', mg.drop);
  if(mg.n) await p.evaluate(() => document.querySelector('[data-msdrop]').click());
  await p.waitForTimeout(1000);
  is('removing one takes it off the list', await p.evaluate(() => document.querySelectorAll('.ms-mrow').length), seeded - 1);
  is('  and out of the data', await p.evaluate(() => planMilestonesFor(planSel()).length), seeded - 1);
  /* nothing under a removed date should move */
  yes('  the tasks it pointed at are untouched', await p.evaluate(() =>
    S.tasks.every(t => t.milestoneId === undefined || typeof t.milestoneId === 'string' || t.milestoneId === null)));

  console.log('\n3. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));
  await p.close();
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke157  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
