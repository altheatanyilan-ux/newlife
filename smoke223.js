/* smoke223 — the day's plan: four to six things, chosen by rules.

   generateDailyPlan is pure, so it is tested here on made-up students
   rather than on whatever this browser happens to hold.

   WHAT IS CLAIMED. The number of exercises follows the time (three or four
   in an hour, five or six in two, never more than seven) and the total never
   passes it. Nothing practised yesterday comes back today. A low-comfort
   exercise comes round more often than a comfortable one. Every day has a
   harmony exercise, a coordination or rhythm exercise and an improvising
   one. Keys come three or four a day round the cycle of fourths, the easy
   ones first, all twelve in three or four days. The fast track plans only
   fast-track exercises. The ready prompt appears when the core is done, the
   day-ten and day-fourteen messages when their days come. And the page:
   the plan card, swap, Start Practice and its sequence, and the summary.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  /* a student, made up: Stage 2, two weeks of nothing yet */
  await p.evaluate(() => {
    window.mk = (o) => Object.assign({currentStageId: 2, trackMode: 'full', exerciseProgress: {},
      stageStartDate: '2026-03-01', dailyMinutesTarget: 120, practiceHistory: [], listening: null}, o || {});
  });

  console.log('\n1. the time decides how many');
  const T = await p.evaluate(() => [45, 60, 90, 120, 180, 300].map(m => {
    const d = generateDailyPlan(mk({dailyMinutesTarget: m}), {date: '2026-03-05'});
    return {m, n: d.exercises.length, total: d.totalEstimatedMinutes};
  }));
  const at = m => T.find(t => t.m === m);
  yes('an hour is three or four exercises', [3, 4].includes(at(60).n), at(60));
  yes('two hours is five or six', [5, 6].includes(at(120).n), at(120));
  yes('never more than seven', T.every(t => t.n <= 7), T);
  yes('and the total never passes the time', T.every(t => t.total <= t.m), T);
  yes('  while using most of it', T.every(t => t.total >= t.m * 0.75), T);

  console.log('\n2. rotation');
  const Y = await p.evaluate(() => {
    const first = generateDailyPlan(mk(), {date: '2026-03-05'}).exercises.filter(r => !r.synthetic).map(r => r.exerciseId);
    const next = generateDailyPlan(mk({practiceHistory: [{date: '2026-03-05', exerciseIds: first, minutesPracticed: 100}]}),
      {date: '2026-03-06'}).exercises.map(r => r.exerciseId);
    return {first, next, repeated: next.filter(id => first.includes(id))};
  });
  is('nothing practised yesterday comes back today', Y.repeated, []);
  /* fourteen simulated days, one exercise uncomfortable and the rest easy */
  const R = await p.evaluate(() => {
    const ids = jazzStage('2').subs.filter(id => jazzTierOf(id) === 'fast-track' && jazzIsPlayable(jazzExercise(id)) && !jazzIsCoordination(jazzExercise(id)) && !jazzIsCreative(jazzExercise(id)));
    const low = ids[2];
    const prog = {}; ids.forEach(id => prog[id] = {completedKeys: 4, totalKeys: 12, lastPracticed: '2026-02-28', comfortLevel: id === low ? 1 : 5, keys: ['C', 'F', 'Bb', 'Eb'], timesPractised: 1});
    const hist = []; const count = {};
    for(let d = 1; d <= 14; d++){
      const date = `2026-03-${String(d).padStart(2, '0')}`;
      const plan = generateDailyPlan(mk({exerciseProgress: prog, practiceHistory: hist.slice(-7), dailyMinutesTarget: 60}), {date});
      const done = plan.exercises.filter(r => !r.synthetic).map(r => r.exerciseId);
      done.forEach(id => { count[id] = (count[id] || 0) + 1; if(prog[id]){ prog[id].lastPracticed = date; prog[id].timesPractised++; } });
      hist.push({date, exerciseIds: done, minutesPracticed: 60});
    }
    const others = ids.filter(id => id !== low).map(id => count[id] || 0);
    return {low, lowN: count[low] || 0, othersMax: Math.max(...others), othersMean: others.reduce((a, b) => a + b, 0) / others.length};
  });
  yes('the uncomfortable exercise comes round more often than the comfortable ones', R.lowN > R.othersMean, R);
  yes('  but never two days running (at most seven times in fourteen)', R.lowN <= 7, R);

  console.log('\n3. balance, every day');
  const B = await p.evaluate(() => {
    const out = [];
    for(let d = 1; d <= 10; d++){
      const plan = generateDailyPlan(mk({dailyMinutesTarget: [60, 120][d % 2]}), {date: `2026-03-${String(d).padStart(2, '0')}`});
      out.push(plan.exercises.map(r => r.slot));
    }
    const p0 = generateDailyPlan(mk({currentStageId: 0, dailyMinutesTarget: 30}), {date: '2026-03-02'});
    return {out, p0: p0.exercises.map(r => r.slot + (r.synthetic ? '*' : ''))};
  });
  yes('every day has harmony, coordination and improvising',
    B.out.every(s => s.includes('harmonic') && s.includes('coordination') && s.includes('creative')), B.out);
  yes('  even on Stage 0, which has no coordination exercise yet (a rhythm drill stands in)',
    B.p0.includes('harmonic') && B.p0.some(x => /^coordination/.test(x)) && B.p0.some(x => /^creative/.test(x)), B.p0);
  const W = await p.evaluate(() => { const d = generateDailyPlan(mk(), {date: '2026-03-05'});
    return {warm: d.warmUp, cool: d.coolDown}; });
  yes('a warm-up in today\'s keys', /major scales in today's practice keys/.test(W.warm.description) && W.warm.estimatedMinutes === 5, W.warm);
  yes('  and a cool-down tune from the stage', /Real Book tune/.test(W.cool.description) && !!W.cool.tuneId, W.cool);

  console.log('\n4. keys, round the cycle of fourths');
  const K = await p.evaluate(() => {
    const days = [0, 1, 2].map(t => jazzPlanKeys({keys: [], timesPractised: t}, 4));
    const marked = jazzPlanKeys({keys: ['C', 'F', 'Bb', 'Eb'], timesPractised: 0}, 4);
    const plan = generateDailyPlan(mk(), {date: '2026-03-05'});
    const h = plan.exercises.find(r => r.slot === 'harmonic'), c = plan.exercises.find(r => r.slot === 'coordination');
    return {days, union: [...new Set(days.flat())].length, marked, h: h.keys, c: c.keys, focus: h.todayFocus, n: plan.exercises.filter(r => r.keys.length).map(r => r.keys.length)};
  });
  is('day one starts with the beginner-friendly keys', K.days[0], ['C', 'F', 'Bb', 'Eb']);
  is('  and the three days go on round the circle', K.days.slice(1), [['Ab', 'Db', 'Gb', 'B'], ['E', 'A', 'D', 'G']]);
  is('  all twelve in three days', K.union, 12);
  is('keys already marked come last', K.marked, ['Ab', 'Db', 'Gb', 'B']);
  yes('three or four keys an exercise, never all twelve', K.n.every(n => n === 3 || n === 4), K.n);
  is('the coordination exercise uses the harmony exercise\'s keys', K.c, K.h);
  yes('and the focus names them', /^Keys of /.test(K.focus), K.focus);

  console.log('\n5. the fast track');
  const F = await p.evaluate(() => {
    const d = generateDailyPlan(mk({trackMode: 'fast-track'}), {date: '2026-03-05'});
    return d.exercises.filter(r => !r.synthetic).map(r => r.tier).concat(d.exercises.filter(r => r.slot === 'enrichment').map(() => 'ENRICHMENT'));
  });
  yes('plans only fast-track exercises, and no enrichment', F.length && F.every(t => t === 'fast-track'), F);

  console.log('\n6. ready, and the two-week cycle');
  const C = await p.evaluate(() => {
    const all = {}; jazzStage('2').subs.forEach(id => all[id] = {completedKeys: jazzExUnits(id), totalKeys: jazzExUnits(id), lastPracticed: '2026-03-01', comfortLevel: 5, keys: JAZZ_KEY_NAMES.slice(), timesPractised: 5});
    const ready = generateDailyPlan(mk({exerciseProgress: all}), {date: '2026-03-05'}).readyForNext;
    const notYet = generateDailyPlan(mk(), {date: '2026-03-05'}).readyForNext;
    const d10 = generateDailyPlan(mk({stageStartDate: '2026-03-01'}), {date: '2026-03-10'}).cycle;
    const d14 = generateDailyPlan(mk({stageStartDate: '2026-03-01'}), {date: '2026-03-14'}).cycle;
    const d6 = generateDailyPlan(mk({stageStartDate: '2026-03-01'}), {date: '2026-03-06'}).cycle;
    return {ready, notYet, d10: d10.note && d10.note.kind, d14: d14.note && d14.note.kind, d14n: d14.note && d14.note.needsWork.length,
      d6: d6.note, d6day: d6.day};
  });
  is('everything core in twelve keys and comfortable asks "Ready for Stage 3?"', C.ready && C.ready.said, 'Ready for Stage 3?');
  is('  and not before', C.notYet, null);
  is('day ten with the core far from done suggests another cycle', C.d10, 'extend');
  yes('day fourteen sums up what is yours and what is not', C.d14 === 'summary' && C.d14n > 0, C);
  is('  and day six says nothing', [C.d6day, C.d6], [6, null]);

  console.log('\n7. the page');
  await p.evaluate(() => { const j = jazzPlanState(); j.stages = {}; j.sessions = []; j.session = null; j.dayPlan = null;
    jazzState().settings.track = 'full'; delete jazzState().settings.budget;
    jazzStartStage('2', 'standard'); location.hash = '#/jazz/plan'; });
  await p.waitForTimeout(1600);
  const P = await p.evaluate(() => ({
    head: (document.querySelector('.jzd-head') || {}).textContent || '',
    rows: document.querySelectorAll('.jzd-row').length,
    badges: document.querySelectorAll('.jzd-row .jz-tier').length,
    types: document.querySelectorAll('.jzd-row .jzd-type').length,
    warm: !!document.querySelector('.jzd-side'), toggle: !!document.querySelector('[data-jztrack]'),
    prog: [...document.querySelectorAll('.jzd-prog > div > span')].map(s => s.textContent)}));
  yes('"Day 1 of Stage 2" and the stage\'s name head the card', /Day 1 of Stage 2/.test(P.head) && /Most of the Music/.test(P.head), P.head);
  yes('  each row with its type and its tier', P.rows >= 4 && P.badges === P.rows && P.types === P.rows, P);
  yes('  a warm-up, a cool-down, the track toggle', P.warm && P.toggle);
  is('  and the progress summary\'s four lines', P.prog, ['Stage Progress', 'Fast-Track Progress', 'Days in Stage', 'Keys Mastered This Stage']);
  const before = await p.evaluate(() => jazzDayPlan().exercises.map(r => r.exerciseId));
  const swapAt = await p.evaluate(() => [...document.querySelectorAll('[data-jzswap]')].map(b => +b.dataset.jzswap)[0]);
  await p.click(`[data-jzswap="${swapAt}"]`); await p.waitForTimeout(700);
  const after = await p.evaluate(() => jazzDayPlan().exercises.map(r => r.exerciseId));
  yes('swap puts another exercise in the row', after[swapAt] !== before[swapAt], [before[swapAt], after[swapAt]]);
  const sameTier = await p.evaluate(i => { const r = jazzDayPlan().exercises[i]; return jazzTierOf(r.exerciseId) === r.tier; }, swapAt);
  yes('  of the same tier', sameTier);
  await p.evaluate(() => { location.hash = '#/jazz'; }); await p.waitForTimeout(400);
  await p.evaluate(() => { location.hash = '#/jazz/plan'; }); await p.waitForTimeout(1200);
  is('  and the swap is still there after leaving and coming back', await p.evaluate(() => jazzDayPlan().exercises.map(r => r.exerciseId)), after);
  await p.click('#jzPlanStart'); await p.waitForTimeout(500);
  if(await p.$('#jsSkip')){ await p.click('#jsSkip'); }
  await p.waitForTimeout(1500);
  const S1 = await p.evaluate(() => ({hash: location.hash, bar: (document.querySelector('.jzd-seq') || {}).textContent || ''}));
  yes('Start Practice opens the first row', S1.hash === '#/jazz/' + after[0], S1.hash);
  yes('  with a bar saying where you are in the plan', /1 of \d/.test(S1.bar) && /next/.test(S1.bar), S1.bar);
  await p.click('.jzd-seq [data-jzseq]:last-child'); await p.waitForTimeout(1500);
  yes('  and "next" moves on to the second', await p.evaluate(a => location.hash.endsWith(a) || /2 of/.test((document.querySelector('.jzd-seq') || {}).textContent || ''), after[1]));
  await p.evaluate(() => jazzAbandonSession());

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
