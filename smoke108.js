/* smoke108 — Projects grows an inventory with filters, and a Future project */
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
  const p = await b.newPage({viewport:{width:1500, height:1400}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const go = async () => { await p.evaluate(() => { if(location.hash === '#/projects') rerender(); else location.hash = '#/projects';
    document.querySelectorAll('.toast,.toast-wrap').forEach(n => n.remove()); }); await p.waitForTimeout(1400); };
  await go();

  console.log('\n1. there is an inventory, and it holds everything');
  yes('the section exists', !!(await p.$('#pInv')));
  is('one row per project', await p.evaluate(() => document.querySelectorAll('#pInv .inv-row').length),
     await p.evaluate(() => S.projects.length));
  yes('  with the count said out loud', /of \d+ shown/.test(await p.textContent('#pInv .mono')));

  console.log('\n2. a Future project can be written down');
  const before = await p.evaluate(() => S.projects.length);
  yes('there is a button for it', !!(await p.$('#pInvFuture')));
  await p.click('#pInvFuture');
  await p.waitForTimeout(1200);
  is('it makes one', await p.evaluate(() => S.projects.length), before + 1);
  is('  with the future status', await p.evaluate(() => S.projects[S.projects.length - 1].status), 'future');
  await p.evaluate(() => { const q = S.projects[S.projects.length - 1];
    q.name = 'Learn to sail'; q.description = 'One day, a small boat.'; q.tags = ['water']; saveNow(); closePanel(); });
  await go();

  console.log('\n3. it is in the inventory, and out of the pipeline');
  yes('the inventory lists it',
      await p.evaluate(() => [...document.querySelectorAll('#pInv .inv-name b')].some(n => n.textContent === 'Learn to sail')));
  yes('the cards grid does not',
      await p.evaluate(() => ![...document.querySelectorAll('#pcards .hd h3')].some(n => n.textContent === 'Learn to sail')));
  /* the board is where a status is changed, so it must be reachable there */
  await p.evaluate(() => { S.settings.projectView = 'kanban'; saveNow(); rerender(); });
  await p.waitForTimeout(1200);
  yes('the board gives it a column of its own', !!(await p.$('[data-kcol="future"]')));
  yes('  with the project in it', await p.evaluate(() =>
    !![...document.querySelectorAll('[data-kcol="future"] .kcard')].find(c => /Learn to sail/.test(c.textContent))));
  await p.evaluate(() => { S.settings.projectView = 'cards'; saveNow(); rerender(); });
  await p.waitForTimeout(1200);

  console.log('\n4. the filters narrow it');
  const rows = () => p.evaluate(() => [...document.querySelectorAll('#pInv .inv-name b')].map(n => n.textContent));
  await p.selectOption('#pinvStatus', 'future');
  await p.waitForTimeout(900);
  is('by status, down to the one', (await rows()).join(','), 'Learn to sail');
  await p.selectOption('#pinvStatus', 'all'); await p.waitForTimeout(900);
  await p.fill('#pinvq', 'sail'); await p.waitForTimeout(900);
  is('by search, the same one', (await rows()).join(','), 'Learn to sail');
  await p.fill('#pinvq', 'water'); await p.waitForTimeout(900);
  is('  a tag counts as searchable text', (await rows()).join(','), 'Learn to sail');
  await p.fill('#pinvq', 'small boat'); await p.waitForTimeout(900);
  is('  so does the description', (await rows()).join(','), 'Learn to sail');
  yes('a clear button appears once something is set', !!(await p.$('#pinvClear')));
  await p.click('#pinvClear'); await p.waitForTimeout(900);
  is('and clearing brings everything back',
     await p.evaluate(() => document.querySelectorAll('#pInv .inv-row').length),
     await p.evaluate(() => S.projects.length));

  console.log('\n4b. the shape filter asks questions the status cannot');
  await p.evaluate(() => { const a = S.projects.find(x => x.status !== 'future');
    a.targetDate = addDays(today(), -5); saveNow(); rerender(); });
  await p.waitForTimeout(1100);
  await p.selectOption('#pinvShape', 'late'); await p.waitForTimeout(900);
  const late = await rows();
  is('past its date finds the one that is', late.length, 1);
  await p.selectOption('#pinvShape', 'nodate'); await p.waitForTimeout(900);
  yes('no date set excludes it', !(await rows()).includes(late[0]), (await rows()).join(','));
  await p.selectOption('#pinvShape', 'all'); await p.waitForTimeout(900);

  console.log('\n5. a project can be moved without opening it');
  const target = await p.evaluate(() => S.projects.find(x => x.name === 'Learn to sail').id);
  await p.selectOption(`[data-setpst="${target}"]`, 'active');
  await p.waitForTimeout(1100);
  is('the status changed', await p.evaluate(i => byId(S.projects, i).status, target), 'active');
  yes('  and no panel opened over it', !(await p.$('#panel')), 'the select opened the project');
  yes('  it is now in the cards grid', await p.evaluate(() =>
    [...document.querySelectorAll('#pcards .hd h3')].some(n => n.textContent === 'Learn to sail')));

  console.log('\n6. clicking the row itself still opens the project');
  await p.click(`#pInv [data-popen="${target}"] .inv-name`);
  await p.waitForTimeout(1100);
  yes('the panel opened', !!(await p.$('#panel')));
  await p.evaluate(() => closePanel());

  console.log('\n7. an old install with an unknown status is not left blank');
  await p.evaluate(() => { S.projects[0].status = 'somethingelse'; saveNow(); });
  await go();
  is('it is read as not started', await p.evaluate(() => S.projects[0].status), 'idea');
  yes('  and the page still drew', !!(await p.$('#pInv')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke108  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
