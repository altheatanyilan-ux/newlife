/* smoke270 — planning the week: as many goals as it holds, and the week in
   periods.

   The claims.

   NO CAP. The goals step starts with three rows and is not limited to them:
   "another goal" adds a row, a fourth and fifth are kept and shown
   everywhere the goals are, and × takes a goal off (its work stays put).

   PERIODS. The last step can split the week into periods — a span of its
   days, a name if you like, and the focus for those days. They are saved,
   survive a reload, show in the recap, and on every day a period covers,
   Today's week card says which period it is and what it is for. A day in
   no period shows the periods without a "now".

   Run: NODE_PATH=node_modules node smoke270.js */
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
  await p.evaluate(() => { const wk = weekStart(today()); S.weekPlans = S.weekPlans || {}; delete S.weekPlans[wk]; saveNow(); location.hash = '#/today'; });
  await p.waitForTimeout(600);
  await p.evaluate(() => openWeeklyPlan(today())); await p.waitForTimeout(400);
  for(let i = 0; i < 2; i++){ await p.click('#wpNext'); await p.waitForTimeout(220); }

  console.log('\n1. as many goals as the week holds');
  is('it starts with three rows', await p.$$eval('[data-wpout]', n => n.length), 3);
  for(const [i, t] of [[0, 'the essay'], [1, 'the move'], [2, 'the garden']]) await p.fill(`[data-wpout="${i}"]`, t);
  await p.click('#wpMoreGoal'); await p.waitForTimeout(200);
  yes('"another goal" adds a fourth, with the caret in it', await p.evaluate(() =>
    document.querySelectorAll('[data-wpout]').length === 4 && document.activeElement?.dataset.wpout === '3'));
  await p.keyboard.type('the tax return');
  await p.click('#wpMoreGoal'); await p.waitForTimeout(200);
  await p.keyboard.type('a letter to Anna');
  is('  and a fifth', await p.$$eval('[data-wpout]', n => n.map(x => x.value)),
    ['the essay', 'the move', 'the garden', 'the tax return', 'a letter to Anna']);
  await p.click('[data-wpgoaldel="2"]'); await p.waitForTimeout(200);
  is('× takes one off, and the rest keep what was typed', await p.$$eval('[data-wpout]', n => n.map(x => x.value)),
    ['the essay', 'the move', 'the tax return', 'a letter to Anna']);

  console.log('\n2. the week in stages');
  await p.click('#wpNext'); await p.waitForTimeout(220);
  is('straight after the goals, a step of its own', await p.$eval('.modal h2', h => h.textContent), 'The week in stages');
  await p.click('#wpAddPeriod'); await p.waitForTimeout(200);
  const d = await p.evaluate(() => { const wk = weekStart(today()); return [0,1,2,3,4,5,6].map(n => addDays(wk, n)); });
  yes('"a stage" adds one, from the start of the week, three days long', await p.evaluate(d =>
    document.querySelector('[data-wpperfrom="0"]').value === d[0] && document.querySelector('[data-wpperto="0"]').value === d[2], d));
  await p.fill('[data-wppername="0"]', 'the sprint');
  await p.fill('[data-wpperfocus="0"]', 'the essay, before anything else');
  await p.click('#wpAddPeriod'); await p.waitForTimeout(200);
  yes('  the next one starts where the last ended', await p.evaluate(d =>
    document.querySelector('[data-wpperfrom="1"]').value === d[3], d));
  await p.selectOption('[data-wpperto="1"]', d[6]); await p.waitForTimeout(200);
  await p.fill('[data-wpperfocus="1"]', 'the move, and rest');
  for(let i = 0; i < 2; i++){ await p.click('#wpNext'); await p.waitForTimeout(220); }
  is('the last step', await p.$eval('.modal h2', h => h.textContent), 'And the shape of it');
  await p.fill('#wpTheme', 'two halves');
  await p.click('#wpNext'); await p.waitForTimeout(500);
  const saved = await p.evaluate(async () => { await saveNow(); await load(); const wp = weekPlan(weekStart(today()));
    return {goals: weekGoalsNamed(wp).map(o => o.text), pers: wp.periods.map(x => [x.from, x.to, x.name, x.focus])}; });
  is('five goals… now four, all kept', saved.goals, ['the essay', 'the move', 'the tax return', 'a letter to Anna']);
  is('the periods survive a reload', saved.pers, [[d[0], d[2], 'the sprint', 'the essay, before anything else'], [d[3], d[6], '', 'the move, and rest']]);

  console.log('\n3. Today says which part of the week it is');
  const T = await p.evaluate(() => today());
  const want = d.indexOf(T) <= 2 ? 'the essay, before anything else' : 'the move, and rest';
  await p.evaluate(async () => { S.settings.planSection = 'week'; S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); await new Promise(r => setTimeout(r, 900));
    const s = document.querySelector('#t-plan'); if(s) s.open = true; });
  const card = await p.evaluate(() => ({now: document.querySelector('.wk-carry .wk-period.now')?.textContent.replace(/\s+/g, ' ').trim() || '',
    strip: [...document.querySelectorAll('.wk-carry .wk-period-strip span')].map(n => n.textContent.trim()),
    goals: document.querySelectorAll('.wk-carry .wk-goals > div').length}));
  yes('the week card says the period today is in, and its focus', card.now.includes(want) && /^now/.test(card.now), card.now);
  is('  with the whole week in periods beside it', card.strip.length, 2);
  is('  and all four goals', card.goals, 4);
  /* a day in no period: take the second one out */
  const none = await p.evaluate(async T => { const wp = weekPlan(weekStart(T));
    wp.periods = wp.periods.filter(x => !(x.from <= T && T <= x.to)); await saveNow(); rerender();
    await new Promise(r => setTimeout(r, 700));
    return {now: !!document.querySelector('.wk-carry .wk-period.now'), strip: document.querySelectorAll('.wk-carry .wk-period-strip span').length}; }, T);
  yes('a day in no period has no "now", and still sees the periods', !none.now && none.strip === 1, none);

  console.log('\n4. nothing broke on the way');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
