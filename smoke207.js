/* smoke207 — three small corrections, each of them about a question that was
   being asked at the wrong moment.

   WHAT AN HOUR ON A TASK COUNTS AS. The week's report said "Tasks: 11h",
   which is not a fact about anybody's week. A task belongs to some part of a
   life — the accounts, the language, the piece — and it is the task that
   knows, not the clock. So the task carries it, and the clock reads it.

   WHAT A SITTING WAS HUNG ON. The sitting log asked, of every entry, which
   project and which person it belonged to. Two selects, filled in by nobody,
   because the entries that genuinely carry a link get it from the room that
   started them. They are gone — and what an entry already carries is still
   carried, which is the part worth testing, because dropping the fields and
   dropping the data are one careless line apart.

   AND WHAT IS STILL A QUESTION. The pile of undated work you pick tomorrow's
   day from is half things already done and things quietly abandoned, and
   both of them ask again every night forever. Now they can be thrown out
   from where you are looking at them.
 */
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
  const p = await (await b.newContext({viewport:{width:1400, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. a task says which part of a life it belongs to');
  const made = await p.evaluate(async () => {
    planState(); timeState();
    const t = planTaskDefaults({id:'t-cat-1', text:'reconcile the bar takings',
      listId: planLists()[0].id});
    S.tasks.push(t);
    saveNow();
    return {has: 'timeCategory' in t, starts: t.timeCategory};
  });
  yes('every task has somewhere to put it', made.has === true);
  is('  and starts without one', made.starts, null);
  const picker = await p.evaluate(async () => {
    openPlanTask('t-cat-1');
    await new Promise(r => setTimeout(r, 700));
    const sel = document.querySelector('#pdTimeCat');
    if(!sel) return {there:false};
    const names = [...sel.options].map(o => o.value);
    sel.value = 'work';
    sel.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 400));
    return {there:true, names, wrote: findTaskRef('t-cat-1').task.timeCategory,
      blank: names[0]};
  });
  yes('the task panel asks what it counts as', picker.there === true);
  yes('  offering the categories the clock already knows',
    picker.names.includes('work') && picker.names.includes('study'),
    JSON.stringify(picker.names));
  is('  and choosing one writes it down', picker.wrote, 'work');
  is('  with a way back to none of them', picker.blank, '');
  /* a field in neither META_KEYS nor ARRAY_STORES is never written, which is
     how four rooms lost everything once — so this is checked, not assumed */
  const kept = await p.evaluate(async () => {
    await saveNow(); await load();
    return (findTaskRef('t-cat-1') || {task:{}}).task.timeCategory;
  });
  is('  and it is still there after a reload', kept, 'work');

  console.log('\n2. so the report says what the work was');
  const filed = await p.evaluate(async () => {
    const before = timeRunning();
    if(before) stopTimer();
    FocusTimer.setTask('t-cat-1');
    FocusTimer.start();
    await new Promise(r => setTimeout(r, 700));
    const on = timeRunning();
    const said = on ? timeCategory(on.categoryId).name : null;
    FocusTimer.stop && FocusTimer.stop();
    timeAutoStop('focus');
    return {cat: on && on.categoryId, said, what: on && on.what};
  });
  is('an hour sat with the task is filed under what the task said', filed.cat, 'work');
  is('  so the week reads it as that, not as "Tasks"', filed.said, 'Work');
  /* a task that has not been told still has to go somewhere */
  const plain = await p.evaluate(async () => {
    const t = planTaskDefaults({id:'t-cat-2', text:'something unclassified',
      listId: planLists()[0].id});
    S.tasks.push(t);
    FocusTimer.setTask('t-cat-2');
    FocusTimer.start();
    await new Promise(r => setTimeout(r, 700));
    const on = timeRunning();
    FocusTimer.stop && FocusTimer.stop();
    timeAutoStop('focus');
    return on && on.categoryId;
  });
  is('  and one that has not been told still lands somewhere', plain, 'tasks');

  console.log('\n3. the sitting log stops asking what nobody answered');
  const form = await p.evaluate(async () => {
    const e = logTime({what:'a section, slowly', categoryId:'piano', minutes:30,
      linkedType:'score', linkedId:'sc-1', linkedLabel:'the Chopin'});
    const m = openTimeEntryModal(e.id);
    await new Promise(r => setTimeout(r, 400));
    const fields = [...m.querySelectorAll('input,select,textarea')].map(n => n.id).filter(Boolean);
    /* and save it back through the form, changing something else */
    m.querySelector('#teWhat').value = 'a section, slower';
    m.querySelector('#teSave').click();
    await new Promise(r => setTimeout(r, 500));
    const after = byId(S.timeEntries, e.id);
    return {fields, what: after.what, type: after.linkedType,
      id: after.linkedId, label: after.linkedLabel};
  });
  yes('the form no longer asks what to hang the sitting on',
    !form.fields.some(f => /Link|Hang|Which/i.test(f)), JSON.stringify(form.fields));
  yes('  it asks only for the thing, the day, the clock, the category and tags',
    form.fields.join(',') === 'teWhat,teDay,teFrom,teTo,teMins,teCat,teTags',
    form.fields.join(','));
  is('  editing one still changes what you edited', form.what, 'a section, slower');
  /* the careless line: taking the fields out and taking the data with them */
  is('  and the link it already carried is untouched',
    [form.type, form.id, form.label], ['score', 'sc-1', 'the Chopin']);

  console.log('\n4. the undated pile is not a life sentence');
  const pile = await p.evaluate(async () => {
    document.querySelectorAll('.overlay').forEach(n => n.remove());
    const list = planLists()[0].id;
    ['gone-1','stay-1'].forEach((id, i) => {
      if(findTaskRef(id)) return;
      S.tasks.push(planTaskDefaults({id, text: i ? 'still worth doing' : 'already done, actually',
        listId: list}));
    });
    saveNow();
    planMyDay(addDays(today(), 1));
    await new Promise(r => setTimeout(r, 600));
    /* three presses of Next to reach the step that offers the waiting work */
    for(let i = 0; i < 2; i++){ document.querySelector('#pmNext').click();
      await new Promise(r => setTimeout(r, 300)); }
    const rows = [...document.querySelectorAll('[data-pickrow]')].map(n => n.dataset.pickrow);
    return {rows, crosses: document.querySelectorAll('[data-pickdel]').length,
      offered: rows.includes('gone-1') && rows.includes('stay-1')};
  });
  yes('the waiting work is offered', pile.offered, JSON.stringify(pile.rows));
  is('  with a way out of the pile on every row', pile.crosses, pile.rows.length);
  const thrown = await p.evaluate(async () => {
    const x = document.querySelector('[data-pickdel="gone-1"]');
    x.click();
    await new Promise(r => setTimeout(r, 500));
    return {gone: !findTaskRef('gone-1'),
      stayed: !!findTaskRef('stay-1'),
      ticked: !!document.querySelector('[data-pickrow="gone-1"].on'),
      undo: [...document.querySelectorAll('.toast-act')].map(n => n.textContent)};
  });
  yes('one thrown away is gone from the planner, not just from the pile', thrown.gone);
  yes('  and the one beside it is untouched', thrown.stayed);
  yes('  and throwing it away did not also tick it for tomorrow', !thrown.ticked);
  /* every delete in the house is undoable until the little bar goes away, and
     a delete reached from a new place is not allowed to be the exception */
  yes('  and it is offered back', thrown.undo.includes('Undo'), JSON.stringify(thrown.undo));
  const back = await p.evaluate(async () => {
    [...document.querySelectorAll('.toast-act')].filter(n => n.textContent === 'Undo')[0].click();
    await new Promise(r => setTimeout(r, 500));
    const here = !!findTaskRef('gone-1');
    /* and thrown out again, for the claims below */
    document.querySelectorAll('.toast').forEach(n => n.remove());
    deleteTaskRef('gone-1', null);
    await new Promise(r => setTimeout(r, 500));
    document.querySelectorAll('.toast').forEach(n => n.remove());
    return {here, gone: !findTaskRef('gone-1')};
  });
  yes('  and pressing it brings the task back', back.here === true);
  yes('    after which it can be thrown out for good', back.gone === true);
  /* and it does not come back the next night, which is the whole point */
  const again = await p.evaluate(async () => {
    document.querySelectorAll('.overlay').forEach(n => n.remove());
    planMyDay(addDays(today(), 1));
    await new Promise(r => setTimeout(r, 600));
    for(let i = 0; i < 2; i++){ document.querySelector('#pmNext').click();
      await new Promise(r => setTimeout(r, 300)); }
    const rows = [...document.querySelectorAll('[data-pickrow]')].map(n => n.dataset.pickrow);
    document.querySelectorAll('.overlay').forEach(n => n.remove());
    return rows;
  });
  yes('  and it is not offered again tomorrow night', !again.includes('gone-1'),
    JSON.stringify(again));
  yes('    while the one you kept still is', again.includes('stay-1'),
    JSON.stringify(again));

  console.log('\n5. nothing broke on the way');
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
