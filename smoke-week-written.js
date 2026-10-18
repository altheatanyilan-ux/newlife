/* smoke-week-written — the weekly review is the week as it was written */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const q = s => p.evaluate(s);
  const ids = await q(() => {
    const T = today(), wk = weekStart(T), pl = weekPlan(wk);
    const t1 = commitQuickTask('draft the intro', {listId: 'inbox'}), t2 = commitQuickTask('collect the figures', {listId: 'inbox'});
    pl.theme = 'finish the paper'; pl.outcomes = [{id: 'g1', text: 'Draft the paper', linkType: '', linkId: null, taskIds: [t1.id, t2.id]}, {id: 'g2', text: '', taskIds: []}];
    pl.wins = [{id: 'w1', text: 'Two sections written', why: 'it proves the thing is moving', evidence: [{id: 'e1', text: 'wrote the methods on Tuesday', at: T}]}];
    pl.risks = [{id: 'r1', text: 'a meeting eats Thursday', prevent: 'decline the optional one'}];
    pl.threads = [{id: 'th1', text: 'read one paper', kind: 'do', days: [wk, addDays(wk, 2)], done: {[wk]: true}}];
    setTaskDone(t1.id, true); S.reviews.weekNotes = undefined; saveNow();
    return {wk, t1: t1.id, t2: t2.id};
  });
  /* force this week regardless of the weekday the smoke runs on */
  await q(() => { flowWeekly(); }); await p.waitForTimeout(600);
  const thisWk = await q(() => weekStart(today()));
  const later = await p.$(`[data-wwwk="${thisWk}"]`); if(later) await later.click();
  const first = await q(() => ({title: document.querySelector('.modal h2').textContent, steps: document.querySelector('.modal .mono').textContent, text: document.querySelector('#wwBody').textContent}));
  yes('the review opens on what was written, in three or four steps, not a dozen', /What you wrote down/.test(first.title) && /of [3-5]$/.test(first.steps.trim()), first);
  yes('the goals, win, evidence, threat and thread are all there as written', ['Draft the paper', 'draft the intro', 'collect the figures', 'Two sections written', 'wrote the methods on Tuesday', 'a meeting eats Thursday', 'decline the optional one', 'read one paper', 'finish the paper'].every(t => first.text.includes(t)), first.text);
  yes('and no statistics: no percentages, no hours', !/%|\bhours?\b/.test(first.text));
  await q(() => { document.querySelector('#flowBody').dispatchEvent(new Event('x')); });
  await p.click('[data-wwv="g:g1|partly"]'); await p.fill('[data-wwn="g:g1"]', 'only the intro got done');
  await p.click('[data-wwcarry="g1"]'); await p.waitForTimeout(300);
  const st = await q(() => { const n = wwNotes(weekStart(today()), false), np = weekPlanSeen(addDays(weekStart(today()), 7)); return {v: n.verdicts['g:g1'], note: n.notes['g:g1'], carried: n.carried.g1, next: (np.outcomes || []).map(o => [o.text, (o.taskIds || []).length])}; });
  yes('a verdict and a line are kept with the week', st.v === 'partly' && st.note === 'only the intro got done', st);
  yes('a goal is carried on with only the work still open', st.carried && JSON.stringify(st.next.filter(x => x[0])) === JSON.stringify([['Draft the paper', 1]]), st);
  await p.click('#fwNext'); await p.waitForTimeout(200);
  await p.fill('#wwKeep', 'the morning block'); await p.fill('#wwChange', 'fewer meetings');
  await p.click('#fwNext'); await p.waitForTimeout(200);
  const kept = await q(() => { const n = wwNotes(weekStart(today()), false); return [n.keep, n.change]; });
  yes('what I would keep and change are kept', JSON.stringify(kept) === JSON.stringify(['the morning block', 'fewer meetings']), kept);
  yes('the review has no step for habits, hours or congruence', !(await q(() => /habits held|congruence|Where the hours/.test(document.querySelector('.modal').textContent))));
  await q(() => { document.querySelector('.modal .close').click(); });
  await q(() => { S.settings.weeklyNumbers = true; flowWeekly(); }); await p.waitForTimeout(500);
  yes('the numbers come back when asked for', await q(() => /of (1\d|[89])$/.test(document.querySelector('.modal .mono').textContent.trim())));
  await q(() => { S.settings.weeklyNumbers = false; document.querySelector('.modal .close').click(); });
  await q(() => { flowWeekly(); }); await p.waitForTimeout(400);
  const later2 = await p.$(`[data-wwwk="${thisWk}"]`); if(later2) await later2.click();
  for(let i = 0; i < 3; i++){ await p.click('#wwBody [data-wwwk]'); await p.waitForTimeout(100); }
  yes('a week with nothing written says so, and offers the plan', await q(() => /Nothing was written down/.test(document.querySelector('#wwBody').textContent) && !!document.querySelector('[data-wwplan]')));
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
