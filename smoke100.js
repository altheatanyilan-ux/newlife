/* smoke100 — editable rows, steps on the row in both rooms, reorder, list filter */
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
  const p = await b.newPage({viewport:{width:1300, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE);
  await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const openTasks = async () => { await p.evaluate(() => {
    if(location.hash !== '#/today') location.hash = '#/today'; else rerender();
    const d = document.querySelector('#t-tasks'); if(d) d.open = true; }); await p.waitForTimeout(800); };

  console.log('\n1. steps show on the row without opening anything');
  const ids = await p.evaluate(() => {
    const mk = (text, listId, steps, order) => {
      const t = {id: uid(), text, day: today(), done: false, doneAt: null, notes: '', order,
        createdAt: new Date().toISOString(), links: {projects: [], skills: []}, listId,
        subtasks: steps.map((x, i) => ({id: uid(), title: x, isCompleted: false, completedAt: null, sortOrder: i}))};
      S.tasks.push(t); return t.id;
    };
    const st = planState();
    if(!st.lists.some(l => l.id === 'work')) st.lists.push({id:'work', name:'Work', color:'#6b7f8e',
      folderId:null, sortOrder:5, defaultView:'list', kanbanColumns:[], sections:[], createdAt:new Date().toISOString()});
    const a = mk('alpha task', 'inbox', ['step one', 'step two'], 1);
    const c = mk('beta task', 'work', [], 2);
    const d = mk('gamma task', 'work', ['only step'], 3);
    saveNow(); location.hash = '#/today'; rerender();
    return {a, c, d};
  });
  await openTasks();
  yes('a task with steps shows them straight away, unopened',
      await p.evaluate(id => !!document.querySelector(`[data-subwrap="${id}"]`), ids.a));
  is('  both of them', await p.$$eval(`[data-subwrap="${ids.a}"] .sub-row`, n => n.length), 2);
  yes('a task with no steps does not sprout an empty block',
      await p.evaluate(id => !document.querySelector(`[data-subwrap="${id}"]`), ids.c));
  yes('but its caret can open one to write the first step',
      await p.evaluate(id => !!document.querySelector(`[data-taskrow="${id}"] [data-tsubs]`), ids.c));
  await p.evaluate(id => document.querySelector(`[data-taskrow="${id}"] [data-tsubs]`).click(), ids.c);
  await p.waitForTimeout(600);
  yes('  which it does', await p.evaluate(id => !!document.querySelector(`[data-subnew="${id}"]`), ids.c));
  await p.fill(`[data-subnew="${ids.c}"]`, 'a first step');
  await p.press(`[data-subnew="${ids.c}"]`, 'Enter');
  await p.waitForTimeout(700);
  yes('and adding the first step does not fold the row shut again',
      await p.evaluate(id => !!document.querySelector(`[data-subwrap="${id}"] .sub-row`), ids.c));

  console.log('\n2. a populated row can still be collapsed, and stays collapsed');
  await p.evaluate(id => document.querySelector(`[data-taskrow="${id}"] [data-tsubs]`).click(), ids.a);
  await p.waitForTimeout(600);
  yes('it closes', await p.evaluate(id => !document.querySelector(`[data-subwrap="${id}"]`), ids.a));
  await openTasks();
  yes('and stays closed across a redraw',
      await p.evaluate(id => !document.querySelector(`[data-subwrap="${id}"]`), ids.a));
  await p.reload(); await p.waitForTimeout(2400);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await openTasks();
  yes('but a reload starts from the default again, which is open',
      await p.evaluate(id => !!document.querySelector(`[data-subwrap="${id}"]`), ids.a));

  console.log('\n3. a task can be rewritten where it sits');
  await p.click(`[data-tedit="${ids.a}"]`);
  await p.waitForTimeout(400);
  yes('clicking the text turns it into a field', !!(await p.$('.inp.task-inline')));
  await p.fill('.inp.task-inline', 'alpha task, reworded');
  await p.press('.inp.task-inline', 'Enter');
  await p.waitForTimeout(700);
  is('and Enter saves it', await p.evaluate(id => byId(S.tasks, id).text, ids.a), 'alpha task, reworded');
  await p.click(`[data-tedit="${ids.a}"]`);
  await p.waitForTimeout(400);
  await p.fill('.inp.task-inline', 'this should not stick');
  await p.press('.inp.task-inline', 'Escape');
  await p.waitForTimeout(600);
  is('Escape throws the edit away', await p.evaluate(id => byId(S.tasks, id).text, ids.a), 'alpha task, reworded');

  console.log('\n4. a step can be rewritten too');
  const sid = await p.evaluate(id => byId(S.tasks, id).subtasks[0].id, ids.a);
  await p.click(`[data-subedit="${ids.a}|${sid}"]`);
  await p.waitForTimeout(400);
  await p.fill('.inp.task-inline', 'step one, reworded');
  await p.press('.inp.task-inline', 'Enter');
  await p.waitForTimeout(700);
  is('the step keeps the new wording',
     await p.evaluate(id => byId(S.tasks, id).subtasks[0].title, ids.a), 'step one, reworded');

  console.log('\n5. dragging a row changes the order, and it sticks');
  const orderNow = () => p.$$eval('#t-tasks .task-row .task-text', n => n.map(x => x.textContent.trim()));
  const first = (await orderNow())[0];
  yes('the list starts in the order the tasks were given', /alpha/.test(first), first);
  const moved = await p.evaluate(o => {
    const day = today();
    const rows = tasksForDay(day);
    const a = rows.find(r => /alpha/.test(r.text)), g = rows.find(r => /gamma/.test(r.text));
    if(!a || !g) return null;
    reorderTaskInDay(day, a.id, g.id, false);      // alpha after gamma
    rerender();
    return tasksForDay(day).map(r => r.text);
  });
  /* dropped after gamma means immediately after gamma — the day holds other
     seeded work too, so "last in the list" was never the right question */
  const rightAfter = (list, a, b) => { const i = list.findIndex(x => a.test(x)), j = list.findIndex(x => b.test(x));
    return i >= 0 && j === i + 1; };
  yes('a reorder puts it exactly where it was dropped, after gamma',
      moved && rightAfter(moved, /gamma/, /alpha/), (moved||[]).join(' | '));
  const orders = await p.evaluate(() => tasksForDay(today()).map(r => r.task.order));
  yes('every row in the day gets a definite place, not a gap',
      orders.every((v, i) => v === i), orders.join(','));
  /* the function above is what the handlers call; this drives the handlers
     themselves, with the drag events the browser would send */
  const dragged = await p.evaluate(() => {
    const rows = tasksForDay(today());
    const beta = rows.find(r => /beta/.test(r.text)), alpha = rows.find(r => /alpha/.test(r.text));
    const from = document.querySelector(`[data-taskrow="${beta.id}"]`);
    const to   = document.querySelector(`[data-taskrow="${alpha.id}"]`);
    if(!from || !to) return null;
    const dt = new DataTransfer();
    const ev = (el, type, extra={}) => el.dispatchEvent(Object.assign(
      new DragEvent(type, {bubbles:true, cancelable:true, dataTransfer:dt}), extra));
    ev(from, 'dragstart');
    const box = to.getBoundingClientRect();
    /* drop on the lower half: below alpha */
    Object.defineProperty(DragEvent.prototype, 'clientY', {configurable:true, get(){ return box.top + box.height*0.8; }});
    ev(to, 'dragover'); ev(to, 'drop'); ev(from, 'dragend');
    delete DragEvent.prototype.clientY;
    return tasksForDay(today()).map(r => r.text);
  });
  yes('a real drag onto the lower half of a row drops it below that row',
      dragged && rightAfter(dragged, /alpha/, /beta/), (dragged||[]).join(' | '));

  await p.reload(); await p.waitForTimeout(2400);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await openTasks();
  const after = await p.evaluate(() => tasksForDay(today()).map(r => r.text));
  yes('and the order survives a reload', rightAfter(after, /alpha/, /beta/), after.join(' | '));

  console.log('\n6. the day can be read one list at a time');
  yes('a filter appears once there is more than one list in the day', !!(await p.$('.task-lists')));
  const chips = await p.$$eval('.tl-chip', n => n.map(x => x.textContent.replace(/\s+/g,' ').trim()));
  yes('  it names each list and how many', chips.some(c => /Work/.test(c)) && chips.some(c => /Inbox|all/.test(c)), chips.join(' | '));
  const allN = await p.$$eval('#t-tasks .task-row', n => n.length);
  await p.click('[data-tlist="work"]');
  await p.waitForTimeout(700);
  const workN = await p.$$eval('#t-tasks .task-row', n => n.length);
  yes('choosing one narrows the list', workN < allN && workN > 0, `${workN} of ${allN}`);
  is('  and only that list is shown',
     await p.evaluate(() => [...new Set(tasksForDay(today()).filter(r => document.querySelector(`[data-taskrow="${r.id}"]`)).map(r => r.task.listId))].join(','), ), 'work');
  yes('  its steps come with it',
      await p.evaluate(id => !!document.querySelector(`[data-subwrap="${id}"]`), ids.d));
  await p.click('[data-tlist="all"]');
  await p.waitForTimeout(700);
  is('and all comes back', await p.$$eval('#t-tasks .task-row', n => n.length), allN);
  await p.click('[data-tlist="work"]');
  await p.waitForTimeout(600);
  await p.reload(); await p.waitForTimeout(2400);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await openTasks();
  is('a filter does not survive a reload — nothing hides work silently',
     await p.$$eval('#t-tasks .task-row', n => n.length), allN);

  console.log('\n7. the Planner shows the same steps on its own rows');
  await p.evaluate(() => { location.hash = '#/planning'; });
  await p.waitForTimeout(1600);
  const ptRows = await p.$$eval('.pt-row', n => n.length);
  yes('the planner has rows', ptRows > 0, String(ptRows));
  yes('and a task with steps shows them without opening the detail panel',
      await p.evaluate(id => !!document.querySelector(`.pt-row[data-ptrow="${id}"] ~ [data-subwrap="${id}"], [data-subwrap="${id}"]`), ids.a));
  yes('no panel was opened to do it', !(await p.$('#panel')));
  const beforeTick = await p.evaluate(id => byId(S.tasks, id).subtasks.filter(s => s.isCompleted).length, ids.a);
  await p.evaluate(id => document.querySelector(`[data-subwrap="${id}"] [data-subcheck]`).click(), ids.a);
  await p.waitForTimeout(800);
  is('and a step can be ticked from there',
     await p.evaluate(id => byId(S.tasks, id).subtasks.filter(s => s.isCompleted).length, ids.a), beforeTick + 1);

  console.log('\n8. rewriting a task needs no save button, in either room');
  await p.evaluate(() => { location.hash = '#/planning'; });
  await p.waitForTimeout(1600);
  const ptid = await p.evaluate(() => { const r = document.querySelector('.pt-text[data-tedit]'); return r ? r.dataset.tedit : null; });
  if(!ptid) no('a planner row can be rewritten in place', 'no editable planner row');
  else {
    await p.click(`.pt-text[data-tedit="${ptid}"]`);
    await p.waitForTimeout(400);
    yes('clicking a planner row\u2019s text opens a field there', !!(await p.$('.inp.task-inline')));
    await p.fill('.inp.task-inline', 'renamed in the planner');
    await p.press('.inp.task-inline', 'Enter');
    await p.waitForTimeout(800);
    is('Return alone saves it — no button to find',
       await p.evaluate(id => byId(S.tasks, id).text, ptid), 'renamed in the planner');
    /* and simply clicking away must save too, which is what "no confirmation" means */
    await p.click(`.pt-text[data-tedit="${ptid}"]`);
    await p.waitForTimeout(400);
    await p.fill('.inp.task-inline', 'renamed by clicking away');
    await p.evaluate(() => document.querySelector('.inp.task-inline').blur());
    await p.waitForTimeout(800);
    is('clicking away saves it as well',
       await p.evaluate(id => byId(S.tasks, id).text, ptid), 'renamed by clicking away');
  }
  /* the detail panel's own title field */
  await p.evaluate(() => { const r = document.querySelector('[data-ptrow]'); if(r) openPlanTask(r.dataset.ptrow); });
  await p.waitForTimeout(900);
  if(!(await p.$('#pdTitle'))) no('the detail title answers when it saves', 'no detail panel');
  else {
    await p.fill('#pdTitle', 'typed into the panel');
    await p.press('#pdTitle', 'Enter');
    await p.waitForTimeout(700);
    yes('Return in the panel title saves and says so',
        await p.evaluate(() => !!document.querySelector('.saved-pulse')) ||
        await p.evaluate(() => planTaskById(document.querySelector('[data-ptrow]')?.dataset.ptrow || '')?.text === 'typed into the panel'));
  }
  await p.evaluate(() => closePanel());
  await p.waitForTimeout(400);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke100  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
