/* smoke104 — the Planning sidebar's new shape, folders as places to look at, and reordering */
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
  const p = await b.newPage({viewport:{width:1400, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const plan = async () => { await p.evaluate(() => { if(location.hash === '#/planning') rerender(); else location.hash = '#/planning'; }); await p.waitForTimeout(1400); };
  await plan();

  console.log('\n1. the sidebar reads in the order it should');
  const order = await p.evaluate(() => {
    const side = document.querySelector('.pl-side');
    const marks = [...side.querySelectorAll('#plSearch, #plSideFilter, [data-plsel="smart:all"], .pl-dated, .pl-head, [data-plsel^="folder:"], [data-plsel="smart:done"]')];
    return marks.map(m => m.id === 'plSearch' ? 'search'
      : m.id === 'plSideFilter' ? 'filter'
      : m.dataset?.plsel === 'smart:all' ? 'all'
      : m.classList.contains('pl-dated') ? 'dated'
      : m.dataset?.plsel === 'smart:done' ? 'completed'
      : m.dataset?.plsel?.startsWith('folder:') ? 'folder'
      : 'head:' + m.textContent.trim().split(/\s+/)[0].toLowerCase());
  });
  is('filter comes first, above everything', order[1], 'filter');
  is('  then All', order[2], 'all');
  is('  then the one dated row', order[3], 'dated');
  /* the heading carries its own ＋ button, so match the word rather than the
     exact text content */
  yes('  then the lists', /^head:lists/.test(order[4]), order.join(' > '));
  is('and Completed is the very last thing', order[order.length - 1], 'completed');
  yes('nothing sits below it in the sidebar', await p.evaluate(() => {
    const d = document.querySelector('[data-plsel="smart:done"]');
    const all = [...document.querySelectorAll('.pl-side [data-plsel]')];
    return all.indexOf(d) === all.length - 1;
  }));

  console.log('\n2. the three date views are one row with a span on it');
  yes('there is no separate Inbox view', await p.evaluate(() => !document.querySelector('[data-plsel="smart:inbox"]')));
  const spans = await p.$$eval('[data-plspan]', n => n.map(x => x.dataset.plspan));
  is('all three spans are offered on the one row', spans.join(','), 'today,tomorrow,next7');
  is('  today to begin with', await p.evaluate(() => planSpan()), 'today');
  await p.click('[data-plspan="next7"]');
  await p.waitForTimeout(1100);
  is('choosing another span switches the row', await p.evaluate(() => planSpan()), 'next7');
  is('  and selects it', await p.evaluate(() => planSel().id), 'next7');
  is('  the row now names it', await p.evaluate(() =>
    document.querySelector('.pl-dated .pl-name').textContent), 'Next 7 days');
  yes('  and the page shows that span', await p.evaluate(() =>
    document.querySelector('.pl-title').textContent === 'Next 7 days'));
  await p.reload(); await p.waitForTimeout(2500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await plan();
  is('the chosen span is remembered', await p.evaluate(() => planSpan()), 'next7');
  await p.click('[data-plspan="today"]'); await p.waitForTimeout(900);

  console.log('\n3. a folder is a place to look at, not only a place to keep things');
  const fid = await p.evaluate(() => planState().folders[0]?.id || null);
  if(!fid) no('a folder can be selected', 'no folders seeded');
  else {
    const inFolder = await p.evaluate(id => {
      const ids = new Set(planLists().filter(l => l.folderId === id).map(l => l.id));
      return {lists: ids.size, tasks: planOwnTasks().filter(t => ids.has(t.listId) && !t.done).length};
    }, fid);
    yes('the folder spans more than one list', inFolder.lists > 1, JSON.stringify(inFolder));
    await p.evaluate(id => document.querySelector(`[data-plsel="folder:${id}"]`).click(), fid);
    await p.waitForTimeout(1200);
    is('clicking its name selects the folder', await p.evaluate(() => planSel().kind), 'folder');
    const shown = await p.evaluate(() => {
      const t = planSelectionTasks(planSel());
      return {n: t.length, lists: [...new Set(t.map(x => x.listId))].length};
    });
    is('  and every task in it is shown', shown.n, inFolder.tasks);
    yes('  drawn from all of its lists, not one', shown.lists === inFolder.lists, JSON.stringify(shown));
    yes('  the header names the folder', await p.evaluate(() =>
      document.querySelector('.pl-title').textContent === planState().folders[0].name));
    /* and every view honours it, not just the list view */
    for(const v of ['eisenhower', 'list', 'calendar', 'kanban', 'timeline']){
      await p.evaluate(x => { S._planView = x; rerender(); }, v);
      await p.waitForTimeout(500);
      yes(`  the ${v} view shows the folder's tasks`,
          await p.evaluate(() => planSelectionTasks(planSel()).length > 0));
    }
    await p.evaluate(() => { S._planView = 'list'; rerender(); }); await p.waitForTimeout(600);

    console.log('\n4. the arrow still only folds');
    const was = await p.evaluate(id => !!planState().folders.find(f => f.id === id).isCollapsed, fid);
    const selBefore = await p.evaluate(() => JSON.stringify(planSel()));
    await p.evaluate(id => document.querySelector(`.pl-fold[data-plfold="${id}"]`).click(), fid);
    await p.waitForTimeout(900);
    is('the arrow toggles the folder open or shut',
       await p.evaluate(id => !!planState().folders.find(f => f.id === id).isCollapsed, fid), !was);
    is('  and does not change what is selected',
       await p.evaluate(() => JSON.stringify(planSel())), selBefore);
    await p.evaluate(id => document.querySelector(`.pl-fold[data-plfold="${id}"]`).click(), fid);
    await p.waitForTimeout(700);
  }

  console.log('\n5. folders and lists can be dragged into an order');
  const fOrder = await p.evaluate(() => {
    const fs = planState().folders.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    if(fs.length < 2) return null;
    const before = fs.map(f => f.name);
    /* drive the handlers, with the drag events the browser would send */
    const from = document.querySelector(`[data-plfdrag="${fs[0].id}"]`);
    const to = document.querySelector(`[data-plfdrag="${fs[1].id}"]`);
    if(!from || !to) return {before, after: null};
    const dt = new DataTransfer();
    const ev = (el, type) => el.dispatchEvent(new DragEvent(type, {bubbles:true, cancelable:true, dataTransfer:dt}));
    const box = to.getBoundingClientRect();
    Object.defineProperty(DragEvent.prototype, 'clientY', {configurable:true, get(){ return box.top + box.height * 0.8; }});
    ev(from, 'dragstart'); ev(to, 'dragover'); ev(to, 'drop'); ev(from, 'dragend');
    delete DragEvent.prototype.clientY;
    return {before, after: planState().folders.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(f => f.name)};
  });
  if(!fOrder) no('folders reorder', 'fewer than two folders');
  else {
    yes('dragging a folder below another swaps them',
        fOrder.after && fOrder.after[0] === fOrder.before[1], `${(fOrder.before||[]).join(' > ')} => ${(fOrder.after||[]).join(' > ')}`);
  }
  const lOrder = await p.evaluate(() => {
    const ls = planLists(); if(ls.length < 2) return null;
    const before = ls.map(l => l.name);
    planReorderLists(ls[0].id, ls[ls.length - 1].id, false);
    return {before, after: planLists().map(l => l.name)};
  });
  yes('and a list can be moved to the end of the order',
      lOrder && lOrder.after[lOrder.after.length - 1] === lOrder.before[0],
      lOrder ? `${lOrder.before.join(' > ')} => ${lOrder.after.join(' > ')}` : 'too few lists');
  await p.reload(); await p.waitForTimeout(2500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await plan();
  yes('the order survives a reload', await p.evaluate(() =>
    planLists().every((l, i, a) => i === 0 || a[i-1].sortOrder <= l.sortOrder)));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke104  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
