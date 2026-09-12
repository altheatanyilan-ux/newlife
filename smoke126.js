/* smoke126 — the evening review closes the day without asking for one line */
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

  console.log('\n1. walking the evening review');
  await p.evaluate(() => flowEvening()); await p.waitForTimeout(900);
  const titles = [];
  for(let i = 0; i < 15; i++){
    if(!(await p.$('#fwNext'))) break;
    titles.push(await p.evaluate(() => document.querySelector('.modal h2').textContent.trim()));
    const last = (await p.evaluate(() => document.querySelector('#fwNext').textContent.trim())) === 'Close the review';
    await p.click('#fwNext'); await p.waitForTimeout(700);
    if(last) break;
  }
  yes('it is not asked for one line', !titles.some(t => /one line/i.test(t)), titles.join(' | '));
  yes('  and no field for it is drawn anywhere', !(await p.$('#fwLine')));
  is('six steps remain', titles.length, 6);
  yes('  the rings still open it', /rings/i.test(titles[0]), titles[0]);
  yes('  and tomorrow still closes it', /Plan tomorrow/i.test(titles[titles.length-1]), titles[titles.length-1]);

  console.log('\n2. finishing it still closes the day');
  /* marking the day closed was the one thing only that step did */
  yes('the day is stamped closed', !!(await p.evaluate(() => dayReview(today()).closedAt)),
      String(await p.evaluate(() => dayReview(today()).closedAt)));
  yes('  the review is recorded as done', await p.evaluate(() => !!S.reviews.lastEvening));
  yes('  and the flow is gone from the screen', !(await p.$('#fwNext')));

  console.log('\n3. a reflection is still writable, the ordinary way');
  /* the step also pushed a reflection entry. That was never the only way to
     write one — Journals and ⌘N make every kind of entry — so check the
     ordinary road still works, and that the step is not quietly making them */
  const before = await p.evaluate(() => S.entries.filter(e => e.type === 'reflection').length);
  await p.evaluate(() => flowEvening()); await p.waitForTimeout(800);
  for(let i = 0; i < 15; i++){
    if(!(await p.$('#fwNext'))) break;
    const last = (await p.evaluate(() => document.querySelector('#fwNext').textContent.trim())) === 'Close the review';
    await p.click('#fwNext'); await p.waitForTimeout(600);
    if(last) break;
  }
  is('walking the review writes no reflection of its own',
     await p.evaluate(() => S.entries.filter(e => e.type === 'reflection').length), before);
  await p.evaluate(() => EntryActions.quickNote()); await p.waitForTimeout(900);
  yes('but one can still be written by hand', !!(await p.$('.modal')));
  await p.evaluate(() => { const t = document.querySelector('.modal textarea'); if(t){
    t.value = 'Written the ordinary way.'; t.dispatchEvent(new Event('input', {bubbles:true})); } });
  await p.waitForTimeout(400);
  const save = await p.$('.modal .btn.primary');
  if(save){ await save.click(); await p.waitForTimeout(1100); }
  is('  and it lands as a reflection',
     await p.evaluate(() => S.entries.filter(e => e.type === 'reflection').length), before + 1);
  await p.evaluate(() => closeModals());

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke126  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
