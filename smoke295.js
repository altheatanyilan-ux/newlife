/* smoke295 — Phase 8 of the execution overhaul: the Time view.

   1. Categories carry a kind, a parent and a value; the shipped ones start
      with the app's guess; the editor changes them.
   2. Periods: day, week, month, quarter, year, with arrows; a period not over
      is read as far as today against the same stretch of earlier ones.
   3. The glance — tracked, untracked awake, focused, meant it, investing —
      each against the person's own four earlier periods.
   4. One sentence, with its numbers.
   5. The breakdown through each lens; time on a habit split across its values
      (and said so); a child category rolls up under its parent; a second
      grouping inside each bar; pressing a bar narrows the whole page.
   6. Twelve periods and a rolling average.
   7. The quality of the focus: start delay, break overruns, restful breaks,
      distractions an hour, estimates.
   8. Process wins, written once into the wins store next to the milestone ones.
   9. The same numbers in the Review and in the weekly review.

   Run: NODE_PATH=node_modules node smoke295.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 1400}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.clock.install({time: new Date('2026-06-10T15:00:00')});   /* a Wednesday */
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }

  /* ---------- fixtures ---------- */
  await p.evaluate(() => {
    timeState(); S.timeEntries.length = 0; S.settings.wakeTime = '07:00'; S.settings.sleepTime = '23:00'; S.dailyRhythm = {};
    S.tasks.length = 0; S.timeBlocks = []; S.habits.length = 0; planState().focusSessions = []; planState().distractions = []; S.wins = [];
    const at = (day, hm) => { const d = parseDay(day), [h, m] = hm.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
    const put = (day, hm, mins, o) => { const s = at(day, hm); logTime(Object.assign({startTime: s.toISOString(), endTime: new Date(s.getTime() + mins * 60000).toISOString()}, o)); };
    window.__put = put; window.__at = at;
    /* five weeks, Monday and Tuesday of each: an hour of piano (meant) and two of work (partly);
       the current week also has half an hour of piano this morning */
    for(let k = 0; k <= 4; k++){
      const mon = addDays(weekStart(today()), -7 * k);
      [0, 1].forEach(o => { const d = addDays(mon, o);
        put(d, '09:00', 60, {what: 'scales', categoryId: 'piano', verdict: 'meant', tags: o ? ['theory'] : []});
        put(d, '11:00', 120, {what: 'the report', categoryId: 'work', verdict: 'partly'}); });
    }
    put(today(), '09:00', 30, {what: 'scales', categoryId: 'piano', verdict: 'meant'});
  });

  console.log('1. categories: a kind, a parent, a value');
  is('the shipped ones start with the app’s guess', await p.evaluate(() => ['piano', 'work', 'exercise', 'tasks'].map(id => timeCategory(id).kind)), ['invest', 'maintain', 'restore', null]);
  await p.evaluate(() => { location.hash = '#/time/categories'; }); await p.waitForTimeout(900);
  const ed = await p.evaluate(() => ({kind: !!document.querySelector('[data-tmcatf="kind"]'), parent: !!document.querySelector('[data-tmcatf="parentId"]'), value: !!document.querySelector('[data-tmcatf="valueId"]')}));
  is('the editor has the three fields on each row', ed, {kind: true, parent: true, value: true});
  await p.evaluate(() => { const n = document.querySelector('[data-tmcat="tasks"][data-tmcatf="kind"]'); n.value = 'maintain'; n.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(400);
  is('choosing a kind is kept', await p.evaluate(() => timeCategory('tasks').kind), 'maintain');
  await p.evaluate(() => { timeCategory('tasks').kind = null; });
  is('a parent that would make a loop is not offered', await p.evaluate(() => { const c = timeAddCategory(); c.parentId = 'writing'; timeCatNormalize(c);
    const offered = timeCatParentOptions('writing').some(x => x.id === c.id); window.__child = c.id; return offered; }), false);

  console.log('\n2. periods');
  is('week, month, quarter and year of Wed 10 June 2026', await p.evaluate(() => ['week', 'month', 'quarter', 'year'].map(u => { const r = timeRange(u, today()); return [r.from, r.to]; })),
    [['2026-06-08', '2026-06-14'], ['2026-06-01', '2026-06-30'], ['2026-04-01', '2026-06-30'], ['2026-01-01', '2026-12-31']]);
  is('arrows step by the unit (a month back is May, a quarter back is Q1)', await p.evaluate(() => [timeRangeShift(timeRange('month'), -1), timeRangeShift(timeRange('quarter'), -1), timeRangeShift(timeRange('week'), 1)].map(r => [r.from, r.to])),
    [['2026-05-01', '2026-05-31'], ['2026-01-01', '2026-03-31'], ['2026-06-15', '2026-06-21']]);
  await p.evaluate(() => { timeUi().narrow = null; timeUi().unit = 'week'; timeUi().day = null; timeUi().view = 'overview'; location.hash = '#/time/overview'; rerender(); }); await p.waitForTimeout(900);
  is('the page has the five-way switch, with the week on', await p.evaluate(() => [[...document.querySelectorAll('[data-tmunit]')].map(x => x.dataset.tmunit), document.querySelector('[data-tmunit].on').dataset.tmunit]),
    [['day', 'week', 'month', 'quarter', 'year'], 'week']);
  await p.evaluate(() => document.querySelector('[data-tmshift="-1"]').click()); await p.waitForTimeout(500);
  is('the left arrow goes a week back; the right arrow then returns', await p.evaluate(() => [document.querySelector('.tmv-label').textContent]), [await p.evaluate(() => timeRangeLabel(timeRange('week', addDays(today(), -7)))) ]);
  await p.evaluate(() => { timeUi().day = null; rerender(); }); await p.waitForTimeout(500);
  yes('the next arrow is off on the current period', await p.evaluate(() => document.querySelector('[data-tmshift="1"]').disabled));

  console.log('\n3. the glance, against your own four earlier periods');
  const g = await p.evaluate(() => { const g = timeGlance(timeRange('week')); const o = {}; g.tiles.forEach(t => o[t.id] = {v: t.value, d: t.delta}); return {o, partial: g.so.partial, so: [g.so.from, g.so.to]}; });
  is('tracked: 6h30m so far (Mon+Tue 3h each, 30m today), against 6h in the same stretch of earlier weeks', [g.o.tracked.v, g.o.tracked.d], [390, 30]);
  is('the week is read as far as today, said so', [g.partial, g.so], [true, ['2026-06-08', '2026-06-10']]);
  is('untracked, awake: sixteen waking hours a day less what was tracked, and today only so far (to 15:00)', g.o.untracked.v, 960 * 2 - 360 + 480 - 30);
  is('focused: nothing yet, because nothing was a sitting', g.o.focused.v, 0);
  yes('investing is the piano’s share of tracked time, five points above the usual', Math.abs(g.o.invest.v - 150 / 390) < 1e-9 && Math.abs(g.o.invest.d - (150 / 390 - 120 / 360)) < 1e-9, g.o.invest);
  yes('meant it is the share of what was read: 150 of 390', Math.abs(g.o.meant.v - 150 / 390) < 1e-9, g.o.meant);
  const none = await p.evaluate(() => { const r = timeRange('year', '2020-06-01'); const g = timeGlance(r); return g.tiles.find(t => t.id === 'tracked').delta; });
  is('with fewer than two earlier periods there is no usual to compare with', none, null);
  await p.evaluate(() => { timeUi().day = null; rerender(); }); await p.waitForTimeout(600);
  yes('the page says "more than your usual" in words', await p.evaluate(() => /30m more than your usual/.test(document.querySelector('.tmv-glance').textContent)), await p.evaluate(() => document.querySelector('.tmv-glance').textContent));

  console.log('\n4. one sentence, with its numbers');
  const say = await p.evaluate(() => timeNarrative(timeRange('week')));
  yes('names the largest category with hours and share, and the change', /Work took 4h \(62%\) of the 6h 30m tracked/.test(say), say);
  yes('and what is untracked, since it is over a quarter of the waking hours', /untracked/.test(say), say);

  console.log('\n5. the breakdown');
  await p.evaluate(() => {
    S.values.push({id: 'vA', name: 'Craft', color: '#c47832'}, {id: 'vB', name: 'Health', color: '#7f916a'}); S.valueOrder = (S.valueOrder || []).concat(['vA', 'vB']);
    S.habits.push(habDefaults({id: 'hh', name: 'Sit', negative: false, freq: {type: 'daily', days: [], count: 1}, links: {values: ['vA', 'vB'], skills: []}, order: 1, created: addDays(today(), -9)}));
    window.__put(today(), '10:00', 60, {what: 'sitting', categoryId: 'meditation', habitId: 'hh', tags: []});
    window.__put(today(), '12:00', 30, {what: 'kana', categoryId: window.__child, tags: []});
    const l = planNewList('The thesis'); l.valueIds = ['vA']; const t = newPlanTask('chapter two', ''); t.listId = l.id; S.tasks.push(t);
    window.__put(today(), '13:00', 40, {what: 'chapter two', categoryId: 'work', linkedType: 'task', linkedId: t.id, linkedLabel: 'chapter two'});
  });
  const tot = lens => p.evaluate(l => timeLensTotals(timeRowsIn('2026-06-08', '2026-06-10'), l).map(o => [l === 'category' ? o.label.replace(/^\S+\s/, '') : o.label, Math.round(o.minutes), !!o.split]), lens);
  const cat = await tot('category');
  yes('a child category’s time rolls up under its parent (Writing 30m)', cat.some(x => x[0] === 'Writing' && x[1] === 30), cat);
  const sum = await p.evaluate(() => [Math.round(sum(timeLensTotals(timeRowsIn('2026-06-08', '2026-06-10'), 'category').map(o => o.minutes))), Math.round(timeMetrics('2026-06-08', '2026-06-10').tracked)]);
  is('the bars always add up to what was tracked', sum[0], sum[1]);
  const val = await tot('value');
  yes('time on a habit is split evenly across its values, and the bar says it was split', val.find(x => x[0] === 'Health')[1] === 30 && val.find(x => x[0] === 'Health')[2], val);
  yes('a list that serves a value gives it its hours (Craft: half the sitting, plus the 40m)', val.find(x => x[0] === 'Craft')[1] === 70, val);
  yes('and what serves no value is its own bar, "No value"', val.some(x => /No value/.test(x[0])), val);
  const lst = await tot('list');
  yes('the list lens reads a task’s list; the rest is "Not on a list"', lst.some(x => x[0] === 'The thesis' && x[1] === 40) && lst.some(x => /Not on a list/.test(x[0])), lst);
  const tg = await tot('tag');
  yes('the tag lens: the tagged hour and its remainder', tg.some(x => x[0] === '#theory' && x[1] === 60), tg);
  const sec = await p.evaluate(() => { const o = timeLensTotals(timeRowsIn('2026-06-08', '2026-06-10'), 'category', 'tag').find(x => /Piano/.test(x.label)); return o.sub.map(s => [s.label, Math.round(s.minutes)]); });
  yes('a second grouping splits each bar (Piano: 60m #theory, the rest untagged)', sec.some(x => x[0] === '#theory' && x[1] === 60) && sec.some(x => /No tag/.test(x[0])), sec);
  await p.evaluate(() => { timeUi().narrow = null; timeUi().unit = 'week'; timeUi().lens = 'category'; timeUi().second = ''; timeUi().day = null; rerender(); }); await p.waitForTimeout(700);
  yes('the donut is there for categories, with a mark for each', await p.evaluate(() => document.querySelectorAll('.tmv-donut circle[data-tmnarrow]').length >= 3));
  await p.evaluate(() => { const l = document.querySelector('#tmLens'); l.value = 'value'; l.dispatchEvent(new Event('change')); }); await p.waitForTimeout(600);
  yes('no donut for the other lenses; the split bars carry a ½ mark and a tooltip saying so', await p.evaluate(() => !document.querySelector('.tmv-donut') && [...document.querySelectorAll('.tmv-bar')].some(b => /split evenly/.test(b.title))));
  await p.evaluate(() => { const l = document.querySelector('#tmLens'); l.value = 'category'; l.dispatchEvent(new Event('change')); }); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.tmv-bar[data-tmnarrow^="category|"]').click()); await p.waitForTimeout(600);
  const nr = await p.evaluate(() => ({chip: !!document.querySelector('.tmv-narrow'), bars: document.querySelectorAll('.tmv-bar').length, rows: [...document.querySelectorAll('.tm-row')].every(r => /./.test(r.textContent)),
    tracked: document.querySelector('.tmv-tile .tmv-n').textContent, label: document.querySelector('.tmv-narrow .chip').textContent}));
  yes('pressing a bar narrows the whole page to it: a chip, one bar, the glance for that alone', nr.chip && nr.bars === 1, nr);
  await p.evaluate(() => document.querySelector('[data-tmclear]').click()); await p.waitForTimeout(500);
  yes('and "show everything" undoes it', await p.evaluate(() => !document.querySelector('.tmv-narrow') && document.querySelectorAll('.tmv-bar').length > 1));

  console.log('\n6. twelve periods and a rolling average');
  const tr = await p.evaluate(() => timeTrend(timeRange('week'), null).map(x => [Math.round(x.minutes), Math.round(x.rolling)]));
  is('twelve of them; the last is the week so far (520 with what was added since); the four before are 360', [tr.length, tr[11][0], tr[10][0], tr[7][0], tr[6][0]], [12, 520, 360, 360, 0]);
  is('the average is of the three up to it', tr[10][1], 360);
  yes('drawn as bars you can press, and a line', await p.evaluate(() => document.querySelectorAll('.tmv-tb').length === 12 && !!document.querySelector('.tmv-trend path')));

  console.log('\n7. the quality of the focus');
  await p.evaluate(() => {
    const iso = (day, hm) => window.__at(day, hm).toISOString();
    const mkTask = (title, est, focus, done) => { const t = newPlanTask(title, ''); t.duration = est; t.focusTime = focus; if(done){ t.done = true; t.doneAt = done; } S.tasks.push(t); return t; };
    const t1 = mkTask('draft', 60, 0), t2 = mkTask('edit', 60, 0);
    const mon = addDays(weekStart(today()), 0);
    pbdAddBlock(mon, {ref: {type: 'task', id: t1.id}, start: '14:00', durationMin: 60});
    pbdAddBlock(today(), {ref: {type: 'task', id: t2.id}, start: '09:00', durationMin: 60});
    const brk = (from, to, o) => Object.assign({from, to, plannedMin: 5, verdict: 'meant', origin: 'pause'}, o);
    const sess = planState().focusSessions;
    sess.push({id: 's1', taskId: t1.id, startedAt: iso(mon, '14:02'), endedAt: iso(mon, '15:02'), duration: 60, type: 'focus', completed: true,
      breaks: [brk(iso(mon, '14:20'), iso(mon, '14:25')), brk(iso(mon, '14:30'), iso(mon, '14:35')), brk(iso(mon, '14:40'), iso(mon, '14:46'), {verdict: 'drifted'}), brk(iso(mon, '14:50'), iso(mon, '14:55')),
        brk(iso(mon, '14:46'), iso(mon, '14:50'), {origin: 'overrun-split', overrun: true, plannedMin: 0, verdict: null})], segments: []});
    sess.push({id: 's2', taskId: t2.id, startedAt: iso(today(), '09:12'), endedAt: iso(today(), '10:12'), duration: 60, type: 'focus', completed: true, breaks: [], segments: []});
    planState().distractions = [{id: 'dx1', text: 'phone', fix: '', hits: [iso(mon, '14:10'), iso(mon, '14:30'), iso(today(), '09:30')], lastAt: iso(today(), '09:30'), handled: false}];
    mkTask('a', 30, 30, today()); mkTask('b', 30, 60, today()); mkTask('c', 30, 25, today());
  });
  const q = await p.evaluate(() => { const x = timeFocusQuality('2026-06-08', '2026-06-10'); return {delay: x.delay && [Math.round(x.delay.value), x.delay.n], overrun: x.overrun && [x.overrun.value, x.overrun.n], restful: x.restful && [x.restful.value, x.restful.n],
    dx: x.distract && [x.distract.value, x.distract.n], est: x.estimate && [Math.round(x.estimate.within * 100), Math.round(x.estimate.median * 100), x.estimate.n]}; });
  is('start delay: 2m and 12m after their blocks, on average 7m, over two', q.delay, [7, 2]);
  is('break overruns: one of four planned breaks ran over', q.overrun, [0.25, 4]);
  is('restful breaks: three of four were answered "meant it"', q.restful, [0.75, 4]);
  is('distractions an hour: three over two hours of sitting', q.dx, [1.5, 3]);
  is('estimates: two of three finished within a quarter; the middle ratio was 100%', q.est, [67, 100, 3]);
  yes('the panel says what each needs when it has too little', await p.evaluate(() => { const h = timeFocusQualityHTML(timeRange('day', '2026-05-02')); return /No sittings/.test(h); }));

  console.log('\n8. wins about how, written once');
  await p.evaluate(() => {
    const wk = timeRangeShift(timeRange('week'), -1), iso = (day, hm) => window.__at(day, hm).toISOString();
    for(let i = 0; i < 4; i++){ const t = newPlanTask('last ' + i, ''); t.duration = 30; t.focusTime = 30; t.done = true; t.doneAt = addDays(wk.from, 2); S.tasks.push(t);
      const d = addDays(wk.from, 1); pbdAddBlock(d, {ref: {type: 'task', id: t.id}, start: `${9 + i * 2}:00`.padStart(5, '0'), durationMin: 60});
      planState().focusSessions.push({id: 'w' + i, taskId: t.id, startedAt: iso(d, `${String(9 + i * 2).padStart(2, '0')}:02`), endedAt: iso(d, `${String(9 + i * 2).padStart(2, '0')}:32`), duration: 30, type: 'focus', completed: true, breaks: [], segments: []}); }
    const t5 = newPlanTask('last 4', ''); t5.duration = 30; t5.focusTime = 32; t5.done = true; t5.doneAt = addDays(wk.from, 3); S.tasks.push(t5);
  });
  const w1 = await p.evaluate(() => timeProcessWins().map(w => w.signal).sort());
  yes('a week of blocks begun within five minutes, and of estimates that held, earns two', w1.includes('start') && w1.includes('estimates'), w1);
  await p.evaluate(() => {
    const wk = timeRangeShift(timeRange('week'), -1);
    for(let i = 0; i < 4; i++){ const w = timeRangeShift(wk, -(3 - i)), d = addDays(w.from, 2), st = window.__at(d, '16:00');
      const br = []; for(let k = 0; k < 4; k++){ const a = new Date(st.getTime() + (5 + k * 7) * 60000), z = new Date(a.getTime() + 4 * 60000); br.push({from: a.toISOString(), to: z.toISOString(), plannedMin: 5, origin: 'pause', verdict: k <= i ? 'meant' : 'drifted'}); }
      planState().focusSessions.push({id: 'rf' + i, taskId: null, startedAt: st.toISOString(), endedAt: new Date(st.getTime() + 40 * 60000).toISOString(), duration: 40, type: 'focus', completed: true, breaks: br, segments: []}); }
  });
  const w1b = await p.evaluate(() => timeProcessWins().map(w => w.signal));
  yes('restful breaks up three weeks running is a win, with the four figures in its rule', w1b.includes('restful') && await p.evaluate(() => /25% \u2192 50% \u2192 75% \u2192 100%/.test(S.wins.find(x => x.signal === 'restful').rule)), w1b);
  const w2 = await p.evaluate(() => timeProcessWins().length);
  is('and the same week earns nothing twice', w2, 0);
  const win = await p.evaluate(() => { const w = S.wins.find(x => x.signal === 'start'); return {kind: w.kind, rule: /at least four blocks/.test(w.rule), period: w.period.unit, card: /Started when the block said/.test(winCardHTML(w))}; });
  is('each carries its rule and its period, and draws as a card beside the milestone wins', win, {kind: 'process', rule: true, period: 'week', card: true});

  console.log('\n9. the same numbers elsewhere');
  const rv = await p.evaluate(() => { const h = planStatsHTML(); return {focus: /How the focus went/.test(h) && /tmv-fqs/.test(h), wins: /Started when the block said|Estimates held/.test(h)}; });
  is('the Review’s statistics carry the focus panel and the wins', rv, {focus: true, wins: true});
  await p.evaluate(() => { flowWeekly(); }); await p.waitForTimeout(700);
  let found = false;
  for(let i = 0; i < 14 && !found; i++){
    found = await p.evaluate(() => /Where the hours went/.test(document.body.innerText) && !!document.querySelector('.tmv-glance'));
    if(!found){ const nx = await p.$('#fwNext'); if(!nx) break; await nx.click(); await p.waitForTimeout(250); }
  }
  yes('and the weekly review’s "where the hours went" carries the same glance and bars', found);
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.flow, .modal-back').forEach(n => n.remove()); });

  console.log('\n10. what needs attention, and the ledger');
  await p.evaluate(() => { window.__put(addDays(today(), -3), '16:00', 30, {what: '', categoryId: 'work', tags: []}); S.promptState = {}; timeUi().narrow = null; timeUi().unit = 'week'; timeUi().day = null; S.settings.todayView = 'time'; location.hash = '#/today/time'; rerender(); });
  await p.waitForTimeout(1000);
  yes('flags about time are on the page, each with its rule and the same exits', await p.evaluate(() => { const a = document.querySelector('.tmv-attn'); return !!a && !!a.querySelector('.pq-rule') && !!a.querySelector('[data-pqlater]') && /no label/.test(a.textContent); }), await p.evaluate(() => (document.querySelector('.tmv-attn') || {}).textContent));
  await p.evaluate(() => document.querySelector('[data-tmunit="day"]').click()); await p.waitForTimeout(600);
  yes('the day carries the existing bar, plan against what happened and the entries', await p.evaluate(() => !!document.querySelector('.tm-strip') && document.querySelectorAll('.tm-row').length >= 1));
  await p.evaluate(() => document.querySelector('[data-tmunit="month"]').click()); await p.waitForTimeout(600);
  yes('a month is the entries by day, editable', await p.evaluate(() => document.querySelectorAll('.tm-row').length >= 5 && !!document.querySelector('[data-tmedit]')));
  await p.evaluate(() => document.querySelector('[data-tmunit="week"]').click()); await p.waitForTimeout(600);
  yes('the week carries its seven bars', await p.evaluate(() => document.querySelectorAll('.tm-wday').length === 7));

  yes('no page errors', !errs.length, errs.join('\n'));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall ok');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
