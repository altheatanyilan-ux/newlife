/* smoke266 — planning the week, steps 4 and 5.

   The claims.

   ONE AT A TIME, EACH WITH ITS REASON. Step 4 asks what would make the week a
   win as a list, one item to a row, and right under each item a box for why
   it is significant; then what could take it away, one to a row, each with a
   box for how you would prevent it. There is always an empty row waiting at
   the end: Enter in an item goes to its reason, and writing in the empty row
   puts another under it. × takes a row out.

   NOTHING LOST. A week planned before, with its win and its threat as one
   sentence each, opens with those sentences as the first rows; the old
   sentence stays on the plan as a summary of the list.

   STEP 5 has no hours to fill in any more — and hours given before are left
   where they were, not deleted.

   SHOWN. The recap, and the week's card on Today, list the wins with their
   reasons and the threats with what you will do.

   Run: NODE_PATH=node_modules node smoke266.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport: {width: 1280, height: 900}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  /* a week planned the old way: one sentence each, and hours */
  await p.evaluate(() => { const wk = weekStart(today()); S.weekPlans = S.weekPlans || {};
    S.weekPlans[wk] = {theme: 'Clear the desk', outcomes: [{id: uid(), text: 'Finish the essay', linkType: '', linkId: null, taskIds: []}],
      energyBudget: {physical: 5, mental: 10}, setAt: today(), win: 'The draft is with the editor', guard: 'The trip on Thursday'}; saveNow();
    location.hash = '#/today'; });
  await p.waitForTimeout(700);
  await p.evaluate(() => openWeeklyPlan(today())); await p.waitForTimeout(400);
  /* past the goals and the week's stages */
  for(let i = 0; i < 4; i++){ await p.click('#wpNext'); await p.waitForTimeout(220); }
  is('step 5 is "What would make this a win?"', await p.$eval('.modal h2', h => h.textContent), 'What would make this a win?');

  console.log('\n1. nothing lost');
  const first = await p.evaluate(() => ({win: document.querySelector('[data-wpwin="0"]').value, risk: document.querySelector('[data-wprisk="0"]').value,
    rowsW: document.querySelectorAll('[data-wpwin]').length, rowsR: document.querySelectorAll('[data-wprisk]').length}));
  is('the old sentences are the first rows, with an empty one waiting under each list', first,
    {win: 'The draft is with the editor', risk: 'The trip on Thursday', rowsW: 2, rowsR: 2});
  yes('  and each row has its reason box right under it', !!(await p.$('[data-wpwhy="0"]')) && !!(await p.$('[data-wpprev="0"]')));

  console.log('\n2. one at a time, each with its reason');
  await p.fill('[data-wpwhy="0"]', 'It is the first thing I have finished this year');
  await p.fill('[data-wpwin="1"]', 'Two long walks'); await p.press('[data-wpwin="1"]', 'Enter'); await p.waitForTimeout(250);
  const g = await p.evaluate(() => ({rows: document.querySelectorAll('[data-wpwin]').length, focus: document.activeElement && document.activeElement.getAttribute('data-wpwhy')}));
  is('writing in the empty row adds it and puts a new empty row under it', g.rows, 3);
  is('  Enter goes straight to its "why is this significant?"', g.focus, '1');
  await p.keyboard.type('Thinking happens on them');
  await p.fill('[data-wprisk="1"]', 'Late nights'); await p.press('[data-wprisk="1"]', 'Enter'); await p.waitForTimeout(250);
  is('the same for what could take it away, into "how I would prevent it"', await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-wpprev')), '1');
  await p.keyboard.type('Laptop shut at eleven');
  await p.fill('[data-wpprev="0"]', 'Write on the train');
  await p.fill('[data-wpwin="2"]', 'A throwaway win'); await p.dispatchEvent('[data-wpwin="2"]', 'change'); await p.waitForTimeout(250);
  await p.click('[data-wpdel="win:2"]'); await p.waitForTimeout(250);
  is('× takes a row out', await p.$$eval('[data-wpwin]', r => r.map(x => x.value)), ['The draft is with the editor', 'Two long walks', '']);

  console.log('\n3. the last step, and the plan saved');
  await p.click('#wpNext'); await p.waitForTimeout(300);
  const s5 = await p.evaluate(() => ({h: document.querySelector('.modal h2').textContent, energy: document.querySelectorAll('[data-wpenergy]').length,
    hoursText: /Hours you mean to give each/.test(document.querySelector('.modal').textContent),
    recap: document.querySelector('.plan-recap') ? document.querySelector('.plan-recap').textContent : ''}));
  yes('the last step no longer asks for hours in each dimension', s5.h === 'And the shape of it' && !s5.energy && !s5.hoursText, s5);
  yes('  the recap lists the wins with their reasons, and the threats with what you will do',
    /Two long walks/.test(s5.recap) && /Thinking happens on them/.test(s5.recap) && /Laptop shut at eleven/.test(s5.recap), s5.recap);
  await p.click('#wpNext'); await p.waitForTimeout(400);
  const P = await p.evaluate(() => { const x = S.weekPlans[weekStart(today())];
    return {wins: x.wins.map(w => [w.text, w.why]), risks: x.risks.map(r => [r.text, r.prevent]), win: x.win, guard: x.guard, energy: x.energyBudget}; });
  is('the wins are kept, each with why', P.wins, [['The draft is with the editor', 'It is the first thing I have finished this year'], ['Two long walks', 'Thinking happens on them']]);
  is('the threats are kept, each with its answer', P.risks, [['The trip on Thursday', 'Write on the train'], ['Late nights', 'Laptop shut at eleven']]);
  is('the old sentence is kept as a summary', [P.win, P.guard], ['The draft is with the editor; Two long walks', 'The trip on Thursday; Late nights']);
  is('hours given before are left where they were', P.energy, {physical: 5, mental: 10});

  console.log('\n4. on Today');
  await p.evaluate(() => { S.settings.todayView = 'do'; S.settings.planSection = 'week'; saveNow(); location.hash = '#/today'; rerender(); }); await p.waitForTimeout(700);
  const card = await p.evaluate(() => { const c = document.querySelector('.wk-carry'); return c ? c.textContent.replace(/\s+/g, ' ') : ''; });
  yes('the week\'s card lists the wins with why, and the threats with the answer',
    /Two long walks/.test(card) && /Thinking happens on them/.test(card) && /Late nights/.test(card) && /Laptop shut at eleven/.test(card), card);

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
