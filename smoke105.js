/* smoke105 — a task can be dragged into place in every Planning view, not
   only on Today. The drag is driven with the events a browser actually sends,
   because the whole bug being fixed here was a handler that was never bound. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* one drag, dispatched as the four events a real one produces. The pointer's
   vertical position decides above or below, and DragEvent has no way to set it
   from script, so it is stubbed for the length of the gesture. */
const DRAG = `(fromSel, toSel, atFraction) => {
  const from = document.querySelector(fromSel), to = document.querySelector(toSel);
  if(!from || !to) return 'missing: ' + (from ? toSel : fromSel);
  const dt = new DataTransfer();
  const fire = (el, type) => el.dispatchEvent(new DragEvent(type, {bubbles:true, cancelable:true, dataTransfer:dt}));
  const box = to.getBoundingClientRect();
  Object.defineProperty(DragEvent.prototype, 'clientY', {configurable:true,
    get(){ return box.top + box.height * atFraction; }});
  fire(from, 'dragstart'); fire(to, 'dragover'); fire(to, 'drop'); fire(from, 'dragend');
  delete DragEvent.prototype.clientY;
  return 'ok';
}`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1500, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.waitForTimeout(1200);

  const drag = (from, to, at = 0.85) => p.evaluate(([f, t, a]) => eval(DRAGSRC)(f, t, a),
    [from, to, at]);
  await p.evaluate(src => { window.DRAGSRC = src; }, DRAG);

  /* one list of our own, with an order we can name, so the assertions are
     about the drag and not about the seed */
  const setUp = async (view) => {
    await p.evaluate(v => {
      let l = planLists().find(x => x.name === 'Reorder bench');
      if(!l){ l = {id: uid(), name: 'Reorder bench', color: 'var(--sage)', folderId: null,
        sortOrder: 99, sections: [], kanbanColumns: DEFAULT_KANBAN(), defaultView: null, isArchived: false};
        planState().lists.push(l); }
      S.tasks = S.tasks.filter(t => t.listId !== l.id);
      ['alpha','beta','gamma','delta'].forEach((n, i) => {
        const t = newPlanTask(n, today(), {listId: l.id});
        t.order = i; t.quadrant = 1; t.kanbanColumn = 'todo'; t.dueTime = '';
        S.tasks.push(t);
      });
      planState().prefs.sort = 'dueDate'; planState().prefs.sortDir = 'asc';
      S._planView = v; S._planRoom = 'tasks'; S._planSel = {kind:'list', id: l.id};
      saveNow();
      if(location.hash === '#/planning') rerender(); else location.hash = '#/planning';
    }, view);
    await p.waitForTimeout(1300);
  };
  /* the names in the order the view is showing them */
  const shown = sel => p.evaluate(s => [...document.querySelectorAll(s)]
    .map(n => (n.dataset.ptrow || n.dataset.ptcard || n.dataset.ptgrip))
    .map(id => (S.tasks.find(t => t.id === id) || {}).text), sel);
  const idOf = name => p.evaluate(n => S.tasks.find(t => t.text === n).id, name);

  console.log('\n1. the list view: alpha goes below gamma');
  await setUp('list');
  let before = await shown('.pt-loose [data-ptrow]');
  is('it starts in the order it was made in', before.join(','), 'alpha,beta,gamma,delta');
  /* setUp rebuilds the four tasks each time, so the ids have to be read again
     after it, not once at the top */
  let aId = await idOf('alpha'), gId = await idOf('gamma');
  is('the drag lands', await drag(`[data-ptrow="${aId}"]`, `[data-ptrow="${gId}"]`, 0.85), 'ok');
  await p.waitForTimeout(900);
  is('alpha sits under gamma now', (await shown('.pt-loose [data-ptrow]')).join(','), 'beta,gamma,alpha,delta');
  is('and the sort says so, rather than quietly ignoring the drag',
     await p.evaluate(() => planState().prefs.sort), 'custom');
  is('  the menu shows it too', await p.evaluate(() => document.querySelector('#plSort').value), 'custom');

  console.log('\n1b. and it survives a redraw, because it was written down');
  await p.evaluate(() => rerender()); await p.waitForTimeout(1000);
  is('still in the arranged order', (await shown('.pt-loose [data-ptrow]')).join(','), 'beta,gamma,alpha,delta');

  console.log('\n1c. dropping on the upper half puts it above');
  is('the drag lands', await drag(`[data-ptrow="${aId}"]`, `[data-ptrow="${gId}"]`, 0.15), 'ok');
  await p.waitForTimeout(900);
  is('alpha is above gamma', (await shown('.pt-loose [data-ptrow]')).join(','), 'beta,alpha,gamma,delta');

  console.log('\n2. the matrix: a card can be moved within its quadrant');
  await setUp('eisenhower');
  aId = await idOf('alpha'); gId = await idOf('gamma');
  is('all four are in the same quadrant', (await shown('.pe-quad[data-pequad="1"] [data-ptcard]')).join(','),
     'alpha,beta,gamma,delta');
  is('the drag lands', await drag(`.pe-quad [data-ptcard="${aId}"]`, `.pe-quad [data-ptcard="${gId}"]`, 0.85), 'ok');
  await p.waitForTimeout(900);
  is('and it moved, without leaving the quadrant',
     (await shown('.pe-quad[data-pequad="1"] [data-ptcard]')).join(','), 'beta,gamma,alpha,delta');
  is('  the quadrant is unchanged', await p.evaluate(i => S.tasks.find(t => t.id === i).quadrant, aId), 1);

  console.log('\n2b. a card dropped into another quadrant still changes quadrant');
  /* the drop that means "belongs elsewhere" must not be eaten by the drop that
     means "goes above this one" */
  await p.evaluate(i => { S.tasks.find(t => t.text === 'delta').quadrant = 3; saveNow(); rerender(); });
  await p.waitForTimeout(1000);
  const dId = await idOf('delta');
  is('the drag lands', await drag(`.pe-quad [data-ptcard="${aId}"]`, `.pe-quad[data-pequad="3"] [data-ptcard="${dId}"]`, 0.85), 'ok');
  await p.waitForTimeout(900);
  is('alpha changed quadrant instead of being reordered',
     await p.evaluate(i => S.tasks.find(t => t.id === i).quadrant, aId), 3);

  console.log('\n3. the board: a card can be moved within its column');
  await setUp('kanban');
  aId = await idOf('alpha'); gId = await idOf('gamma');
  is('all four are in the same column', (await shown('.pk-col[data-pkcol="todo"] [data-ptcard]')).join(','),
     'alpha,beta,gamma,delta');
  is('the drag lands', await drag(`.pk-cards [data-ptcard="${aId}"]`, `.pk-cards [data-ptcard="${gId}"]`, 0.85), 'ok');
  await p.waitForTimeout(900);
  is('and it moved down the column',
     (await shown('.pk-col[data-pkcol="todo"] [data-ptcard]')).join(','), 'beta,gamma,alpha,delta');
  is('  without leaving the column', await p.evaluate(i => S.tasks.find(t => t.id === i).kanbanColumn, aId), 'todo');

  console.log('\n4. the calendar: pills in one day can be put in an order');
  await setUp('calendar');
  aId = await idOf('alpha'); gId = await idOf('gamma');
  await p.evaluate(() => { planState().prefs.calMode = 'week'; saveNow(); rerender(); });
  await p.waitForTimeout(1100);
  is('the four sit in today’s column', (await shown('.pc-allday [data-ptcard]')).join(','),
     'alpha,beta,gamma,delta');
  is('the drag lands', await drag(`.pc-allday [data-ptcard="${aId}"]`, `.pc-allday [data-ptcard="${gId}"]`, 0.85), 'ok');
  await p.waitForTimeout(900);
  is('and the day reads in the new order', (await shown('.pc-allday [data-ptcard]')).join(','),
     'beta,gamma,alpha,delta');
  is('  still on the same day', await p.evaluate(i => S.tasks.find(t => t.id === i).day,
     aId), await p.evaluate(() => today()));

  console.log('\n5. the timeline: the name is the handle, the bar still means dates');
  await setUp('timeline');
  aId = await idOf('alpha'); gId = await idOf('gamma');
  const tlBefore = await shown('.pl-tlrows [data-ptgrip]');
  is('the rows start in order', tlBefore.slice(0, 4).join(','), 'alpha,beta,gamma,delta');
  is('the drag lands', await drag(`[data-ptgrip="${aId}"]`, `[data-ptgrip="${gId}"]`, 0.85), 'ok');
  await p.waitForTimeout(900);
  is('the rows rearranged', (await shown('.pl-tlrows [data-ptgrip]')).slice(0, 4).join(','),
     'beta,gamma,alpha,delta');
  const dayBefore = await p.evaluate(i => S.tasks.find(t => t.id === i).day, aId);
  is('and the date was not touched by a reorder', dayBefore, await p.evaluate(() => today()));

  console.log('\n6. what the drop means is decided by where it lands');
  /* a task dragged onto a list in the sidebar still moves list, and one
     dragged onto a section header still joins the section */
  await setUp('list');
  aId = await idOf('alpha');
  const other = await p.evaluate(() => planLists().find(l => l.name !== 'Reorder bench').id);
  is('the drag lands', await drag(`[data-ptrow="${aId}"]`, `[data-plsel="list:${other}"]`, 0.5), 'ok');
  await p.waitForTimeout(900);
  is('dropping on a list in the sidebar still moves it there',
     await p.evaluate(i => S.tasks.find(t => t.id === i).listId, aId), other);

  console.log('\n7. dragging onto itself does nothing at all');
  await setUp('list');
  aId = await idOf('alpha');
  const stateBefore = await p.evaluate(() => S.tasks.map(t => t.id + ':' + t.order).join('|'));
  await drag(`[data-ptrow="${aId}"]`, `[data-ptrow="${aId}"]`, 0.85);
  await p.waitForTimeout(700);
  is('nothing was renumbered',
     await p.evaluate(() => S.tasks.map(t => t.id + ':' + t.order).join('|')), stateBefore);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke105  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
