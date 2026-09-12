/* smoke117 — the name opens the task; renaming has a button of its own */
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
  const p = await b.newPage({viewport:{width:1500, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const editing = () => p.evaluate(() => document.querySelectorAll('.ed.editing, .task-row input, .pt-row input, .pk-card input').length);

  console.log('\n1. Today: the name opens the task');
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1800);
  yes('there are task rows', !!(await p.$('.task-row .task-text')));
  /* the name is the largest thing on the row, so it should do the thing you
     mostly want, which is to look at the task */
  const nameW = await p.evaluate(() => {
    const t = document.querySelector('.task-row .task-text'), r = t.closest('.task-row');
    return Math.round(t.getBoundingClientRect().width / r.getBoundingClientRect().width * 100);
  });
  yes('and it takes most of the row', nameW > 40, nameW + '% of the row');
  await p.click('.task-row .task-text'); await p.waitForTimeout(1200);
  yes('clicking it opens the task', !!(await p.$('#panel')));
  is('  rather than starting a rename', await editing(), 0);
  await p.evaluate(() => closePanel()); await p.waitForTimeout(600);

  console.log('\n2. renaming is its own small button');
  yes('every row carries a pencil', await p.evaluate(() =>
    document.querySelectorAll('.task-row').length === document.querySelectorAll('.task-row .task-pen').length));
  /* Ask a row the pointer is demonstrably not over. Moving the mouse away and
     then reading the first row is not the same thing: where the pointer lands
     is a guess, and a hovered row is *supposed* to show its pencil. */
  await p.mouse.move(5, 5); await p.waitForTimeout(300);
  const resting = await p.evaluate(() => {
    const r = [...document.querySelectorAll('.task-row')].find(x => !x.matches(':hover'));
    if(!r) return null;
    return getComputedStyle(r.querySelector('.task-pen')).opacity;
  });
  is('  which stays out of the way until wanted', resting, '0');
  await p.hover('.task-row'); await p.waitForTimeout(350);
  is('  and appears on hover', await p.evaluate(() =>
    getComputedStyle(document.querySelector('.task-row .task-pen')).opacity), '1');
  await p.click('.task-row .task-pen'); await p.waitForTimeout(600);
  yes('clicking it starts the rename', (await editing()) > 0);
  yes('  and no panel opened', !(await p.$('#panel')));
  /* the field stands where the name stood — inlineTaskEdit replaces it — so
     what proves the right thing is being renamed is that the name is gone and
     the box carries its text */
  const swapped = await p.evaluate(() => { const r = document.querySelector('.task-row');
    const i = r.querySelector('input.task-inline');
    return {box: !!i, nameGone: !r.querySelector('.task-text'), value: i ? i.value : null}; });
  yes('  the name became the box', swapped.box && swapped.nameGone, JSON.stringify(swapped));
  yes('  carrying what the task is called', (swapped.value || '').length > 0, JSON.stringify(swapped));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);

  console.log('\n3. Planning rows behave the same way');
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1800);
  await p.evaluate(() => { planSetView('list'); }); await p.waitForTimeout(1300);
  const row = await p.$('.pt-row .pt-text');
  if(!row) no('a planning row exists', 'no .pt-row');
  else {
    await p.click('.pt-row .pt-text'); await p.waitForTimeout(1100);
    yes('the name opens the task', !!(await p.$('#panel')));
    is('  and starts no rename', await editing(), 0);
    await p.evaluate(() => closePanel()); await p.waitForTimeout(600);
    await p.hover('.pt-row'); await p.waitForTimeout(300);
    await p.click('.pt-row .task-pen'); await p.waitForTimeout(600);
    yes('the pencil renames', await p.evaluate(() => !!document.querySelector('.pt-row input.task-inline')));
    yes('  putting the box where the name was',
        await p.evaluate(() => { const r = document.querySelector('.pt-row');
          return !!r.querySelector('input.task-inline') && !r.querySelector('.pt-text'); }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  }

  console.log('\n4. and matrix cards');
  await p.evaluate(() => { planSetView('eisenhower'); }); await p.waitForTimeout(1400);
  const card = await p.$('.pk-card .pk-text');
  if(!card) no('a matrix card exists', 'no .pk-card');
  else {
    await p.click('.pk-card .pk-text'); await p.waitForTimeout(1100);
    yes('the name opens the task', !!(await p.$('#panel')));
    is('  and starts no rename', await editing(), 0);
    await p.evaluate(() => closePanel()); await p.waitForTimeout(600);
    await p.hover('.pk-card'); await p.waitForTimeout(300);
    await p.click('.pk-card .task-pen'); await p.waitForTimeout(600);
    yes('the pencil renames', await p.evaluate(() => !!document.querySelector('.pk-card input.task-inline')));
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  }

  console.log('\n5. a rename still saves without confirming anything');
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1700);
  const id = await p.evaluate(() => document.querySelector('.task-row').dataset.taskrow);
  await p.hover('.task-row'); await p.waitForTimeout(300);
  await p.click('.task-row .task-pen'); await p.waitForTimeout(500);
  await p.keyboard.press('Control+A');
  await p.keyboard.type('A task renamed with the pencil');
  await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
  is('the new name is on the task',
     await p.evaluate(i => findTaskRef(i)?.task.text, id), 'A task renamed with the pencil');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke117  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
