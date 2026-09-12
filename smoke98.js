/* smoke98 — steps under a task, and taking a task off a day without losing it */
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
  const p = await b.newPage({viewport:{width:1280, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(2200);
  /* A fresh profile is asked about theme and sound before anything else, and
     the rest of boot waits behind that dialog. Take the defaults and get on
     with it, the way a first-time user would. */
  await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  const draw = async () => { await p.evaluate(() => rerender()); await p.waitForTimeout(700); };
  const openTasks = async () => { await p.evaluate(() => {
    if(location.hash !== '#/today') location.hash = '#/today';
    const d = document.querySelector('#t-tasks'); if(d) d.open = true; }); await p.waitForTimeout(700); };

  console.log('\n1. a task on today, with no steps yet');
  const tid = await p.evaluate(() => {
    const t = {id: uid(), text: 'file the quarterly thing', day: today(), done: false, doneAt: null,
      notes: '', order: Date.now(), createdAt: new Date().toISOString(), links: {projects: [], skills: []}};
    S.tasks.push(t); saveNow(); location.hash = '#/today'; rerender(); return t.id;
  });
  await openTasks();
  const row = `[data-taskrow="${tid}"]`;
  yes('the task is on Today', !!(await p.$(row)));
  yes('it offers a way to break it down', !!(await p.$(`${row} [data-tsubs]`)));
  is('and shows no count until there are steps', await p.$$eval('.task-subcount', n => n.length), 0);

  console.log('\n2. adding steps under it');
  await p.click(`${row} [data-tsubs]`);
  await p.waitForTimeout(600);
  yes('it opens', !!(await p.$(`[data-subwrap="${tid}"]`)));
  yes('with a field ready for the first step', !!(await p.$(`[data-subnew="${tid}"]`)));
  for(const step of ['pull the numbers', 'write the summary', 'send it']){
    await p.fill(`[data-subnew="${tid}"]`, step);
    await p.press(`[data-subnew="${tid}"]`, 'Enter');
    await p.waitForTimeout(550);
  }
  is('three steps went in', await p.evaluate(id => byId(S.tasks, id).subtasks.length, tid), 3);
  is('and they are all shown', await p.$$eval(`[data-subwrap="${tid}"] .sub-row`, n => n.length), 3);
  is('in the order they were written',
     await p.$$eval(`[data-subwrap="${tid}"] .sub-text`, n => n.map(x => x.textContent).join('|')),
     'pull the numbers|write the summary|send it');
  yes('the field stays ready for the next one, so a breakdown is one sitting',
      await p.evaluate(id => document.activeElement === document.querySelector(`[data-subnew="${id}"]`), tid));
  is('the row now carries the progress', await p.$eval(`${row} .task-subcount`, n => n.textContent), '0/3');

  console.log('\n3. ticking a step');
  await p.click(`[data-subwrap="${tid}"] .sub-row:first-child [data-subcheck]`);
  await p.waitForTimeout(600);
  is('the count moves', await p.$eval(`${row} .task-subcount`, n => n.textContent), '1/3');
  is('and it is recorded on the task itself',
     await p.evaluate(id => byId(S.tasks, id).subtasks.filter(s => s.isCompleted).length, tid), 1);
  yes('the step is struck through',
      await p.$eval(`[data-subwrap="${tid}"] .sub-row:first-child`, n => n.classList.contains('done')));
  yes('but the parent task is not silently completed — finishing a step is not finishing the task',
      await p.evaluate(id => byId(S.tasks, id).done === false, tid));

  console.log('\n4. the steps survive a reload, and the open/closed state does not');
  await p.reload(); await p.waitForTimeout(2400);
  await openTasks();
  is('the steps are still on the task',
     await p.evaluate(id => byId(S.tasks, id).subtasks.length, tid), 3);
  is('one of them still done',
     await p.evaluate(id => byId(S.tasks, id).subtasks.filter(s => s.isCompleted).length, tid), 1);
  is('the row shows the count without being opened', await p.$eval(`${row} .task-subcount`, n => n.textContent), '1/3');
  /* This used to assert the opposite. Steps are now shown on the row by
     request — the point of writing them down is seeing them beside the task —
     so a reload starts from open, and the caret is only how you fold one away. */
  yes('and the steps are on the row without anything being opened',
      await p.evaluate(id => !!document.querySelector(`[data-subwrap="${id}"]`), tid));

  console.log('\n5. removing a step');
  await p.evaluate(id => {
    const rows = document.querySelectorAll(`[data-subwrap="${id}"] .sub-row [data-subdel]`);
    rows[rows.length - 1].click();
  }, tid);
  await p.waitForTimeout(600);
  is('it goes', await p.evaluate(id => byId(S.tasks, id).subtasks.length, tid), 2);
  is('and the count follows', await p.$eval(`${row} .task-subcount`, n => n.textContent), '1/2');

  console.log('\n6. “not today” takes it off the day and keeps the task');
  const before = await p.evaluate(() => S.tasks.length);
  yes('the row offers it', !!(await p.$(`${row} [data-tdefer]`)));
  await p.click(`${row} [data-tdefer]`);
  await p.waitForTimeout(700);
  is('nothing was deleted', await p.evaluate(() => S.tasks.length), before);
  is('the task simply has no day now', await p.evaluate(id => byId(S.tasks, id).day, tid), '');
  yes('so it is off Today', !(await p.$(row)));
  yes('and it is in the unscheduled list, ready for another day',
      await p.evaluate(id => unscheduledTasks().some(r => r.id === id), tid));
  yes('its steps came with it', await p.evaluate(id => byId(S.tasks, id).subtasks.length === 2, tid));
  yes('the change can be taken back',
      await p.evaluate(() => [...document.querySelectorAll('.toast')].some(t => /put it back/i.test(t.textContent))));

  console.log('\n7. and “pull in” really does find it again');
  const pullable = await p.evaluate(id => {
    const day = addDays(today(), 2);
    return allTaskRefs().filter(r => !r.done && r.day !== day).some(r => r.id === id);
  }, tid);
  yes('it is offered when planning a different day', pullable);
  await p.evaluate(id => { setTaskDay(id, addDays(today(), 2)); }, tid);
  await draw();
  is('and putting it on that day works', await p.evaluate(id => byId(S.tasks, id).day, tid), await p.evaluate(() => addDays(today(), 2)));

  console.log('\n8. the × still deletes for good, with its undo');
  await p.evaluate(id => { setTaskDay(id, today()); location.hash = '#/today'; rerender(); }, tid);
  await openTasks();
  await p.click(`${row} [data-tdel]`);
  await p.waitForTimeout(500);
  const gone = await p.evaluate(() => !!document.querySelector('.toast'));
  yes('deleting asks or offers an undo, as it always did', gone);
  await p.waitForTimeout(6500);
  is('and the task really is gone', await p.evaluate(id => !!byId(S.tasks, id), tid), false);

  console.log('\n9. a task made inside a project has no subtasks array, and must not break');
  const pref = await p.evaluate(() => {
    const p0 = (S.projects || [])[0];
    if(!p0 || !(p0.phases || []).length) return null;
    const t = {id: uid(), text: 'a project task with no subtasks key', day: today(), done: false};
    p0.phases[0].tasks = p0.phases[0].tasks || [];
    p0.phases[0].tasks.push(t);
    saveNow(); location.hash = '#/today'; rerender();
    return allTaskRefs().find(r => r.task === t).id;
  });
  if(!pref) no('a project task can be broken into steps', 'no project with a phase to test against');
  else {
    await openTasks();
    yes('it renders', await p.evaluate(id => !!document.querySelector(`[data-taskrow="${id}"]`), pref));
    await p.evaluate(id => document.querySelector(`[data-taskrow="${id}"] [data-tsubs]`).click(), pref);
    await p.waitForTimeout(600);
    await p.fill(`[data-subnew="${pref}"]`, 'a step on a project task');
    await p.press(`[data-subnew="${pref}"]`, 'Enter');
    await p.waitForTimeout(600);
    is('and a step can be added to it',
       await p.evaluate(id => findTaskRef(id).task.subtasks.length, pref), 1);
  }

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke98  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
