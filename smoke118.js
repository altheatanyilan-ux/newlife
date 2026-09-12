/* smoke118 — one filter, in one place, that can ask what the saved-filter
   builder could ask */
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
  const p = await b.newPage({viewport:{width:1500, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { location.hash = '#/planning'; planSetView('list'); }); await p.waitForTimeout(1700);
  const shown = () => p.evaluate(() => [...document.querySelectorAll('.pt-row')]
    .map(r => r.querySelector('.pt-text')?.textContent.trim()).filter(Boolean));

  console.log('\n1. there is one filter, and it is at the top');
  yes('the top filter is there', !!(await p.$('#plSideFilter')));
  yes('  the one in the header bar is gone', !(await p.$('#plFilterBtn')));
  yes('  and the saved-filter section at the foot is gone', !(await p.$('#plNewFilter')));
  yes('  with no saved filters listed either', !(await p.$('[data-plsel^="smartlist:"]')));

  console.log('\n2. it asks everything the saved-filter builder asked');
  await p.click('#plSideFilter'); await p.waitForTimeout(700);
  const rows = await p.$$eval('#modals .field label', n => n.map(l => l.textContent.trim()));
  for(const r of ['Text','Lists','Tags','Priority','When','Done or not','Steps'])
    yes(`  it asks about ${r.toLowerCase()}`, rows.includes(r), rows.join(' / '));
  yes('every date word is offered, not just two', await p.evaluate(() =>
    [...document.querySelectorAll('[data-fr]')].map(b => b.dataset.fr).join(',') === ',overdue,today,tomorrow,next7days,noDate'));

  console.log('\n3. each row takes more than one answer');
  await p.click('[data-fp="3"]'); await p.click('[data-fp="2"]');
  await p.waitForTimeout(200);
  is('two priorities can be on at once', await p.evaluate(() =>
    document.querySelectorAll('[data-fp].on').length), 2);
  yes('  and nothing is applied until Apply', await p.evaluate(() => !S._planFilter || !S._planFilter.priorities));
  await p.click('#pfApply'); await p.waitForTimeout(1200);
  is('applying keeps both', await p.evaluate(() => (S._planFilter.priorities || []).slice().sort().join(',')), '2,3');
  is('  and the badge counts the axes, not the choices',
     await p.evaluate(() => document.querySelector('#plSideFilter .pl-n')?.textContent), '2');

  console.log('\n4. it actually narrows the list');
  const withFilter = await shown();
  await p.evaluate(() => { S._planFilter = {}; rerender(); }); await p.waitForTimeout(1100);
  const without = await shown();
  yes('fewer rows than unfiltered', withFilter.length < without.length, `${withFilter.length} of ${without.length}`);
  yes('  and every row left really matches', await p.evaluate(() => {
    S._planFilter = {priorities:[3], completion:'active'}; rerender();
    return [...document.querySelectorAll('.pt-row')].every(r => {
      const t = planTaskById(r.dataset.ptrow); return t && t.priority === 3 && !t.done; });
  }));

  console.log('\n4b. a text search is one of the axes');
  const word = await p.evaluate(() => { S._planFilter = {}; rerender();
    const t = planOwnTasks().find(x => (x.text || '').split(' ').length > 1);
    return t ? t.text.split(' ')[0] : null; });
  await p.waitForTimeout(900);
  if(word){
    await p.evaluate(w => { S._planFilter = {search: w}; rerender(); }, word);
    await p.waitForTimeout(1000);
    yes('every row carries the word', (await shown()).every(t => t.toLowerCase().includes(word.toLowerCase())),
        (await shown()).join(' | '));
  }

  console.log('\n5. the header says what the filter is doing, one chip per axis');
  await p.evaluate(() => { S._planFilter = {priorities:[3], tags:[], lists:[], dateRange:'overdue', completion:'active'}; rerender(); });
  await p.waitForTimeout(1100);
  const chips = await p.$$eval('.pf-chip.on', n => n.map(c => c.textContent.replace('×','').trim()));
  yes('a chip for the priority', chips.some(c => /High/i.test(c)), chips.join(' | '));
  yes('  one for the date word', chips.some(c => /overdue/.test(c)), chips.join(' | '));
  yes('  and one for done-or-not', chips.some(c => /not done/.test(c)), chips.join(' | '));
  await p.click('[data-pfclear="dateRange"]'); await p.waitForTimeout(1000);
  yes('a chip clears just its own axis', await p.evaluate(() =>
    !S._planFilter.dateRange && (S._planFilter.priorities || []).length === 1));

  console.log('\n6. clear all empties it');
  await p.click('#plSideFilter'); await p.waitForTimeout(700);
  await p.click('#pfClear'); await p.waitForTimeout(1100);
  is('nothing is being filtered on', await p.evaluate(() => planFilterCount(S._planFilter)), 0);
  yes('  and the badge is gone', !(await p.$('#plSideFilter .pl-n')));

  console.log('\n7. the dialog opens showing what is already set');
  await p.evaluate(() => { S._planFilter = {priorities:[1], lists:[], tags:[], dateRange:'today', completion:'any'}; rerender(); });
  await p.waitForTimeout(1000);
  await p.click('#plSideFilter'); await p.waitForTimeout(700);
  yes('the priority is lit', await p.evaluate(() => document.querySelector('[data-fp="1"]').classList.contains('on')));
  yes('  the date word is lit', await p.evaluate(() => document.querySelector('[data-fr="today"]').classList.contains('on')));
  yes('  and so is either-done', await p.evaluate(() => document.querySelector('[data-fc="any"]').classList.contains('on')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke118  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
