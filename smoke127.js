/* smoke127 — every selection in Planning opens on the matrix, old lists too.

   Two things have moved under this test since it was written, and both made it
   quieter rather than louder, which is the worse failure of the two:

   The board and timeline views were retired. This test parked on 'kanban'
   between selections so that a click which changed nothing would show up as a
   failure — but planView() now maps a retired view onto the matrix, so parking
   there WAS the matrix, and every "opens on the matrix" assertion passed
   whether or not the click did anything. It parks on the calendar now, which
   is a view that still exists. The same retirement is why section 3 asked for
   a board and could never get one; it asks for the calendar.

   And a date opens as a day now, not as a matrix (smoke179): Today, Tomorrow
   and the next seven days are asking what is there, and the matrix takes a day
   and sorts it into four boxes when what you wanted was the day. So the dated
   row is held to the opposite rule, on purpose, rather than excluded. */
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
  await p.evaluate(() => { location.hash = '#/planning'; rerender(); }); await p.waitForTimeout(1600);

  /* park on a view that is not the matrix, so a selection that changes
     nothing is visible as a failure rather than passing by accident — and it
     has to be a view that still exists, or planView() quietly hands back the
     matrix and the parking does nothing */
  const pickAndRead = async sel => {
    await p.evaluate(() => { S._planView = 'calendar'; rerender(); }); await p.waitForTimeout(500);
    await p.evaluate(v => document.querySelector(`[data-plsel="${v}"]`).click(), sel);
    await p.waitForTimeout(700);
    return p.evaluate(() => planView());
  };

  console.log('\n1. a fresh house: every row in the sidebar');
  const rows = await p.$$eval('[data-plsel]', n => n.map(x => x.dataset.plsel));
  yes('there are lists, folders, tags and smart lists to try',
      rows.some(r => r.startsWith('list:')) && rows.some(r => r.startsWith('folder:')) &&
      rows.some(r => r.startsWith('tag:')) && rows.some(r => r.startsWith('smart:')), rows.join(' '));
  const wrong = [], dated = [];
  for(const r of rows){
    const v = await pickAndRead(r);
    /* the one dated row is the exception, and it is an exception with a reason:
       a day is asking what is there, not what to touch first */
    const isDate = r.startsWith('smart:') && ['today','tomorrow','next7'].includes(r.slice(6));
    if(isDate){ if(v !== 'list') dated.push(`${r}→${v}`); }
    else if(v !== 'eisenhower') wrong.push(`${r}→${v}`);
  }
  is('every list, folder and tag opens on the matrix', wrong.length, 0);
  if(wrong.length) console.log('      ' + wrong.join(', '));
  is('  and the dated row opens as a day', dated.length, 0);
  if(dated.length) console.log('      ' + dated.join(', '));

  console.log('\n2. a house built before the matrix became the default');
  /* the page's own default was brought across when that changed; each list
     also carries one, and those were left behind — so a folder opened on the
     matrix while an older list opened on the plain list */
  const id = await p.evaluate(() => {
    const l = planState().lists.find(x => x.id !== 'inbox');
    l.defaultView = 'list';
    delete planState().prefs.matrixFirstLists;   // never migrated
    saveNow(); return l.id;
  });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2800);
  is('the old per-list default is brought across',
     await p.evaluate(i => planList(i).defaultView, id), 'eisenhower');
  await p.evaluate(() => { location.hash = '#/planning'; rerender(); }); await p.waitForTimeout(1400);
  is('  so selecting that list opens on the matrix', await pickAndRead('list:' + id), 'eisenhower');
  yes('  and it is marked done, so it happens once',
      await p.evaluate(() => planState().prefs.matrixFirstLists === true));

  console.log('\n3. a view chosen on purpose is not overwritten');
  const id2 = await p.evaluate(() => {
    const l = planState().lists.find(x => x.id !== 'inbox');
    l.defaultView = 'calendar';                   // deliberately not the matrix
    delete planState().prefs.matrixFirstLists;    // and the migration runs again
    saveNow(); return l.id;
  });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2800);
  is('a calendar stays a calendar', await p.evaluate(i => planList(i).defaultView, id2), 'calendar');
  await p.evaluate(() => { location.hash = '#/planning'; rerender(); }); await p.waitForTimeout(1400);
  is('  and selecting it honours that', await pickAndRead('list:' + id2), 'calendar');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke127  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
