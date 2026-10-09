/* smoke297 — the planning board's second pass, and the Time view as a board.

   1. Dragging shows exactly when the block will start (and end) before it is let go,
      and the drop lands where the line said.
   2. A task's estimate is edited on the right-hand side, without leaving the board.
   3. The week view shows what was planned for tomorrow on tomorrow alone.
   4. Plan in sixty seconds always opens, above the board, from every way in; it is
      offered first, and "Re-plan from here" takes its place once the day is laid out.
   5. A habit has an estimate; the plan lays habits first and the work around them.
   6. The Time view is a board: planned and tracked side by side, each block with its
      from and to, and each planned block set against the time spent on it.

   Run: NODE_PATH=node_modules node smoke297.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
const SHOTS = process.env.SHOTS || '';

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 1000}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.clock.install({time: new Date('2026-06-10T10:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const reset = () => p.evaluate(() => { document.getElementById('pbd')?.remove(); document.body.classList.remove('pbd-open'); PB = null;
    closeModals(); document.querySelectorAll('.toast').forEach(n => n.remove());
    S.tasks.length = 0; S.timeBlocks = []; S.habits.length = 0; S.plans = {}; S.dailyRhythm = {}; S.settings.wakeTime = '07:00'; S.settings.sleepTime = '23:00';
    timeState(); S.timeEntries.length = 0;
    const pr = planState().prefs = planState().prefs || {}; delete pr.board; pr.focusMargin = 25; });
  const mk = o => p.evaluate(o => { const t = newPlanTask(o.text, o.day || '', {duration: o.mins}); S.tasks.push(t);
    if(o.do) taskSetDoRange(t, o.do, ''); saveNow(); return t.id; }, o);
  const shot = async n => { if(SHOTS) await p.screenshot({path: path.join(SHOTS, n + '.png')}); };
  await reset();
  const T = await p.evaluate(() => today()), TMR = await p.evaluate(() => addDays(today(), 1));

  console.log('\n1. dragging says when it will start');
  const a = await mk({text: 'Write the report', mins: 40});
  await p.evaluate(() => pbdOpen(today())); await p.waitForTimeout(300);
  const geo = () => p.evaluate(() => { const t = document.querySelector('[data-pbtrack]').getBoundingClientRect(); return {x: t.left + t.width / 2, top: t.top, wake: +document.querySelector('[data-pbtrack]').dataset.wake, px: PBD_PX}; });
  const g = await geo();
  const row = await p.evaluate(id => { const r = document.querySelector(`.pbd-row[data-pbtask="${id}"]`).getBoundingClientRect(); return {x: r.left + 30, y: r.top + 12}; }, a);
  await p.mouse.move(row.x, row.y); await p.mouse.down(); await p.mouse.move(row.x + 100, row.y + 40, {steps: 4});
  const y14 = g.top + (14 * 60 - g.wake) * g.px + 1;       // 14:00
  await p.mouse.move(g.x, y14, {steps: 8});
  const live = await p.evaluate(() => ({line: (document.querySelector('.pbd-drop b') || {}).textContent || '', ghost: (document.querySelector('.pbd-floating') || {}).textContent || '', h: (document.querySelector('.pbd-drop') || {style: {}}).style.height}));
  yes('a line on the strip says when it starts and ends', /^14:00 – 14:50$/.test(live.line), live);
  yes('and the floating label carries the start', /14:00/.test(live.ghost), live);
  await shot('drag');
  await p.mouse.up(); await p.waitForTimeout(250);
  is('the drop lands where the line said', await p.evaluate(id => pbdBlocksFor(id)[0].start, a), '14:00');
  is('and the line is gone once it is let go', await p.evaluate(() => document.querySelectorAll('.pbd-drop').length), 0);
  /* an overlap is said */
  const a2 = await mk({text: 'Second thing', mins: 30});
  await p.evaluate(() => pbdRender());
  const row2 = await p.evaluate(id => { const r = document.querySelector(`.pbd-row[data-pbtask="${id}"]`).getBoundingClientRect(); return {x: r.left + 30, y: r.top + 12}; }, a2);
  const g2 = await geo();
  await p.mouse.move(row2.x, row2.y); await p.mouse.down(); await p.mouse.move(row2.x + 100, row2.y + 40, {steps: 4}); await p.mouse.move(g2.x, g2.top + (14 * 60 + 10 - g2.wake) * g2.px, {steps: 8});
  yes('dropping over another block says what it overlaps', await p.evaluate(() => /overlaps Write the report/.test(document.querySelector('.pbd-drop b').textContent)), await p.evaluate(() => (document.querySelector('.pbd-drop b') || {}).textContent));
  await p.mouse.move(row2.x, row2.y, {steps: 4}); await p.mouse.up();
  await reset();

  console.log('\n2. the estimate is edited on the right');
  const e1 = await mk({text: 'Needs a length', mins: 0}), e2 = await mk({text: 'Has one', mins: 30});
  await p.evaluate(() => pbdOpen(today())); await p.waitForTimeout(300);
  yes('every row has its estimate in a box', await p.evaluate(() => document.querySelectorAll('.pbd-row .pbd-esti').length === 2));
  await p.fill(`[data-pbest-in="${e1}"]`, '1h30'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  is('typing 1h30 and pressing Enter saves 90 minutes', await p.evaluate(id => pbdTask(id).duration, e1), 90);
  is('and the box now says it', await p.evaluate(id => document.querySelector(`[data-pbest-in="${id}"]`).value, e1), '1h 30m');
  await p.fill(`[data-pbest-in="${e2}"]`, '45'); await p.locator(`[data-pbest-in="${e2}"]`).blur(); await p.waitForTimeout(250);
  is('a bare number is minutes', await p.evaluate(id => pbdTask(id).duration, e2), 45);
  await p.fill(`[data-pbest-in="${e2}"]`, 'soon'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  is('words that are not a length change nothing', await p.evaluate(id => pbdTask(id).duration, e2), 45);
  /* pressing in the box does not start a drag */
  const bx = await p.evaluate(id => { const r = document.querySelector(`[data-pbest-in="${id}"]`).getBoundingClientRect(); return {x: r.left + 10, y: r.top + 6}; }, e2);
  await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(150);
  yes('clicking in the box focuses it', await p.evaluate(id => document.activeElement && document.activeElement.dataset.pbestIn === id, e2));
  /* a block still as long as the old estimate follows */
  await p.evaluate(id => { pbdAddBlock(today(), {ref: {type: 'task', id}, start: '13:00', durationMin: pbdPadded(45, pbdTask(id)).durationMin}); pbdRender(); }, e2);
  await p.fill(`[data-pbest-in="${e2}"]`, '20'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  is('its block follows the new estimate (20m + 25% = 25m)', await p.evaluate(id => pbdBlocksFor(id)[0].durationMin, e2), 25);
  await reset();

  console.log('\n3. the week does not repeat tomorrow');
  const w = await mk({text: 'Planned for tomorrow', mins: 30, do: TMR});
  const w2 = await mk({text: 'Ticked while planning', mins: 20});
  await p.evaluate(ids => pbdOpen(addDays(today(), 1), {extra: ids}), [w2]); await p.waitForTimeout(300);
  is('on the day it was opened for, both are in the tray', await p.evaluate(() => document.querySelectorAll('.pbd-tray .pbd-chip.pencil').length), 2);
  await p.evaluate(() => { PB.mode = 'week'; pbdRender(); }); await p.waitForTimeout(250);
  const cols = await p.evaluate(() => [...document.querySelectorAll('.pbd-col')].map(c => [c.dataset.pbday, c.querySelectorAll('.pbd-tray .pbd-chip.pencil').length]));
  is('in the week, only tomorrow holds them', cols.filter(c => c[1]).map(c => [c[0], c[1]]), [[TMR, 2]]);
  is('and every other day says nothing is waiting', await p.evaluate(() => [...document.querySelectorAll('.pbd-col')].filter(c => c.dataset.pbday !== addDays(today(), 1)).every(c => c.querySelector('.pbd-empty'))), true);
  const gauges = await p.evaluate(() => [...document.querySelectorAll('.pbd-col')].map(c => [c.dataset.pbday, c.querySelector('.pbd-gauge span').textContent]));
  yes('and the gauge on the other days is empty', gauges.filter(g => g[0] !== TMR).every(g => /Nothing planned/.test(g[1])), gauges);
  await reset();

  console.log('\n4. sixty seconds: always opens, above the board, first');
  const s1 = await mk({text: 'Pencilled one', mins: 30, do: T}), s2 = await mk({text: 'Pencilled two', mins: 30, do: T});
  await p.evaluate(() => pbdOpen(today())); await p.waitForTimeout(300);
  yes('before the day is laid out, "Plan in 60 seconds" is the button, and Re-plan is not', await p.evaluate(() => !!document.querySelector('[data-pb60]') && !document.querySelector('[data-pbreplan]')));
  await p.evaluate(() => document.querySelector('[data-pb60]').click()); await p.waitForTimeout(250);
  const top = await p.evaluate(() => { const m = document.querySelector('.pbd-sixty .modal'); const r = m.getBoundingClientRect(); const u = document.elementFromPoint(r.left + r.width / 2, r.top + 40); return {inside: !!(u && u.closest('.pbd-sixty')), cls: document.querySelector('.pbd-sixty').className}; });
  yes('the dialog is on top of the board', top.inside && /above-board/.test(top.cls), top);
  await shot('sixty');
  await p.evaluate(() => document.querySelector('[data-sa]').click()); await p.waitForTimeout(300);
  yes('once it is done, "Re-plan from here" takes its place', await p.evaluate(() => !document.querySelector('[data-pb60]') && !!document.querySelector('[data-pbreplan]')));
  await reset();
  /* from the opener, with nothing pencilled, in one turn */
  await mk({text: 'Overdue', mins: 30, day: await p.evaluate(() => addDays(today(), -2))});
  await p.evaluate(() => pbdOpen(today(), {sixty: true}));
  yes('opened with sixty: true, the dialog is there at once, no waiting', await p.evaluate(() => !!document.querySelector('.pbd-sixty [data-sa]')));
  yes('with nothing pencilled it offers what is due, and says so', await p.evaluate(() => /due by the day/.test(document.querySelector('.pbd-sixty').textContent) && document.querySelectorAll('.pbd-sixty [data-sx]').length === 1));
  await reset();
  await p.evaluate(() => pbdOpen(today(), {sixty: true}));
  yes('with nothing at all it still opens, and says what to do', await p.evaluate(() => /No work is pencilled/.test(document.querySelector('.pbd-sixty').textContent)));
  is('and a toast from the board is above the board too', await p.evaluate(() => { toast('x'); return getComputedStyle(document.querySelector('.toast-wrap')).zIndex; }), '170');
  await reset();
  /* from Plan tomorrow */
  const pt = await mk({text: 'Tomorrow task', mins: 30});
  await p.evaluate(() => { planMyDay(addDays(today(), 1)); }); await p.waitForTimeout(400);
  const stepped = await p.evaluate(() => { for(let i = 0; i < 6 && !document.querySelector('#pbSixty'); i++){ const n = document.querySelector('#pmNext'); if(!n) break; n.click(); } return !!document.querySelector('#pbSixty'); });
  if(stepped){
    await p.evaluate(() => document.querySelector('#pbSixty').click());
    yes('from Plan tomorrow, the board and the dialog arrive together', await p.evaluate(() => !!document.getElementById('pbd') && !!document.querySelector('.pbd-sixty [data-sa]')));
  } else no('could not reach the hours step of Plan tomorrow');
  await reset();

  console.log('\n5. habits have an estimate, and come first');
  const hid = await p.evaluate(() => { const h = Object.assign(habDefaults({id: uid(), name: 'Stretch', freq: {type: 'daily'}, createdAt: today(), timeOfDay: 'morning', log: {}, milestones: []}), {estimateMin: 20}); S.habits.push(h); saveNow(); return h.id; });
  const hid2 = await p.evaluate(() => { const h = habDefaults({id: uid(), name: 'Read', freq: {type: 'daily'}, createdAt: today(), timeOfDay: 'evening', durationTarget: 30, log: {}, milestones: []}); S.habits.push(h); saveNow(); return h.id; });
  is('a habit’s estimate is its own figure, else its target', await p.evaluate(ids => ids.map(id => habEstimateMin(byId(S.habits, id))), [hid, hid2]), [20, 30]);
  is('a habit you are breaking has none', await p.evaluate(() => habEstimateMin({negative: true, estimateMin: 10})), 0);
  const cap0 = await p.evaluate(() => { const c = pbdCapacity(today()); return {habits: c.habits, rule: /habits still to place/.test(c.rule)}; });
  is('the day’s capacity sets their time aside first', cap0, {habits: 50, rule: true});
  const tk = await mk({text: 'Big task', mins: 60, do: T});
  await p.evaluate(() => pbdOpen(today())); await p.waitForTimeout(300);
  yes('the tray lists the habits first', await p.evaluate(() => /habits first · 2/.test(document.querySelector('.pbd-trayh').textContent) && document.querySelectorAll('.pbd-chip.habit').length === 2));
  await p.evaluate(() => document.querySelector('[data-pb60]').click()); await p.waitForTimeout(250);
  const lay = await p.evaluate(() => [...document.querySelectorAll('.pbd-layrow')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
  yes('the layout puts the evening habit in the evening and the morning one first', /Stretch/.test(lay[0]) && lay.some(l => /Read/.test(l) && /^(18|19|2\d):/.test(l)), lay);
  yes('the habits section is listed before the work', await p.evaluate(() => { const t = document.querySelector('.pbd-sixty').textContent; return t.indexOf('habits first') < t.indexOf('pencilled for the day'); }));
  await shot('habits');
  await p.evaluate(() => document.querySelector('[data-sa]').click()); await p.waitForTimeout(300);
  is('accepting writes the habits as blocks that point at them', await p.evaluate(() => S.timeBlocks.filter(b => b.ref && b.ref.type === 'habit').map(b => byId(S.habits, b.ref.id).name).sort()), ['Read', 'Stretch']);
  is('they are drawn as fixed ground, and counted once', await p.evaluate(() => [document.querySelectorAll('.pbd-anchor.k-habit').length, pbdCapacity(today()).habits]), [2, 0]);
  yes('the work is laid around them, never over them', await p.evaluate(() => { const an = pbdAnchors(today()).filter(a => a.kind === 'habit'); return pbdBlocksOn(today()).filter(b => b.kind === 'task').every(b => { const a0 = pbdMin(b.start), z0 = a0 + b.durationMin; return an.every(x => z0 <= x.from || a0 >= x.to); }); }));
  await reset();

  console.log('\n6. the Time view as a board');
  await p.evaluate(() => {
    const at = (day, hm) => { const d = parseDay(day), [h, m] = hm.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
    const put = (day, hm, mins, o) => { const s = at(day, hm); logTime(Object.assign({startTime: s.toISOString(), endTime: new Date(s.getTime() + mins * 60000).toISOString()}, o)); };
    const t = newPlanTask('Draft budget', '', {duration: 60}); S.tasks.push(t); window.__bt = t.id;
    pbdAddBlock(today(), {ref: {type: 'task', id: t.id}, start: '08:00', durationMin: 60});
    const t2 = newPlanTask('Call the bank', '', {duration: 30}); S.tasks.push(t2); window.__bt2 = t2.id;
    pbdAddBlock(today(), {ref: {type: 'task', id: t2.id}, start: '09:30', durationMin: 30});
    pbdAddBlock(today(), {kind: 'meal', label: 'lunch', start: '12:00', durationMin: 45});
    put(today(), '08:10', 75, {what: 'Draft budget', categoryId: 'work', linkedType: 'task', linkedId: t.id, verdict: 'meant'});
    put(today(), '09:30', 10, {what: 'tea', categoryId: 'work', kind: 'break'});
    saveNow(); });
  await p.evaluate(() => { location.hash = '#/time'; }); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelector('[data-tmunit="day"]').click()); await p.waitForTimeout(500);
  const tb = await p.evaluate(() => ({board: !!document.querySelector('.tmb'), plan: document.querySelectorAll('.tmb-b.plan').length, did: document.querySelectorAll('.tmb-b.did').length, cols: document.querySelectorAll('.tmb-sub').length,
    first: (document.querySelector('.tmb-b.did .tmb-t') || {}).textContent, head: (document.querySelector('.tmb-dh') || {}).textContent}));
  yes('the day is a board with a planned column and a tracked column', tb.board && tb.cols === 2, tb);
  yes('planned blocks and tracked blocks are both drawn', tb.plan >= 3 && tb.did === 2, tb);
  yes('a tracked block says from when to when', /08:10–09:25/.test(tb.first || ''), tb.first);
  yes('and the heading totals plan against tracked', /plan 1h 30m/.test(tb.head) && /tracked 1h 15m/.test(tb.head), tb.head);
  const where = await p.evaluate(() => { const pl = [...document.querySelectorAll('.tmb-b.plan.work')].find(b => /Draft budget/.test(b.textContent)), di = [...document.querySelectorAll('.tmb-b.did')].find(b => /Draft budget/.test(b.textContent));
    return {pl: parseFloat(pl.style.top), di: parseFloat(di.style.top), plh: parseFloat(pl.style.height), dih: parseFloat(di.style.height)}; });
  yes('on the same hours: tracked starts ten minutes (9px) below planned, and is fifteen minutes (13.5px) longer', Math.abs(where.di - where.pl - 9) < 1 && Math.abs(where.dih - where.plh - 13.5) < 1, where);
  const cmp = await p.evaluate(() => [...document.querySelectorAll('.tmb-cr:not(.head)')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
  yes('each planned block is set against the time spent on it', cmp.length === 2 && /Draft budget/.test(cmp[0]) && /08:10–09:25/.test(cmp[0]) && /15m over/.test(cmp[0]) && /no time on it|still to come/.test(cmp[1]), cmp);
  await shot('time-day');
  await p.evaluate(() => document.querySelector('[data-tmunit="week"]').click()); await p.waitForTimeout(500);
  const wk = await p.evaluate(() => ({days: document.querySelectorAll('.tmb-day').length, did: document.querySelectorAll('.tmb-b.did').length}));
  yes('the week is seven of them side by side', wk.days === 7 && wk.did === 2, wk);
  await shot('time-week');
  await p.evaluate(() => document.querySelector('[data-tmunit="month"]').click()); await p.waitForTimeout(500);
  yes('a month has no hours, so each week’s plan sits beside its tracked time', await p.evaluate(() => document.querySelectorAll('.tmb-wr').length >= 2));
  await p.evaluate(() => { document.querySelector('[data-tmunit="day"]').click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.tmb-b.did').click()); await p.waitForTimeout(400);
  yes('clicking a tracked block opens that sitting', await p.evaluate(() => !!document.querySelector('.overlay .modal')));

  console.log('\n7. nothing broke on the way');
  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
