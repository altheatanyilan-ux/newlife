/* smoke293 — Phase 6 of the execution overhaul: one planning object, and the board.

   1. Blocks are references with a length (estimate + margin, a buffer after);
      older blocks are read into that shape.
   2. How a task shows is worked out, not stored: ink, pencil, window — and a
      ghost on the day it would best go, with its reason, moving off a full day.
   3. The day's capacity: planned against the waking hours less what is already
      spoken for and the reserve, a cap of 75%, the rule shown, never a refusal.
   4. The board: drag to an hour (day + hour, never the due date), to the tray
      (day only), back to the right (both off, undoable); an unestimated task is
      asked how long; a long one is offered a split; a resize asks once about the
      estimate.
   5. Plan in sixty seconds, re-plan from here, protected time, and the day's
      intentions as references with a top two.

   Run: NODE_PATH=node_modules node smoke293.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

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
    const pr = planState().prefs = planState().prefs || {}; delete pr.board; pr.focusMargin = 25; });
  const mk = o => p.evaluate(o => { const t = newPlanTask(o.text, o.day || '', {duration: o.mins}); S.tasks.push(t);
    if(o.do) taskSetDoRange(t, o.do, ''); saveNow(); return t.id; }, o);
  await reset();

  console.log('\n1. blocks are references with a length');
  await p.evaluate(() => { S.timeBlocks = [{id: 'old1', date: today(), start: '09:00', end: '10:30', kind: 'task', taskId: 'tX', habitId: null, label: 'Old', catId: null, notes: ''}]; pbdMigrate(); });
  is('an older block is read into the new shape', await p.evaluate(() => { const b = S.timeBlocks[0]; return [b.ref, b.durationMin, b.marginMin, b.bufferMin, b.state, b.source]; }),
    [{type: 'task', id: 'tX'}, 90, 0, 0, 'ink', 'dragged']);
  is('a block is the estimate plus its margin, then a buffer after (40m → 50m + 15m; 20m → 25m + 15m)', await p.evaluate(() => [pbdPadded(40), pbdPadded(20)].map(x => [x.durationMin, x.marginMin, x.bufferMin, x.total])), [[50, 10, 15, 65], [25, 5, 15, 40]]);
  await reset();

  console.log('\n2. ink, pencil, window — and the ghost');
  const tInk = await mk({text: 'Inked', mins: 30, do: await p.evaluate(() => today())});
  const tPen = await mk({text: 'Pencilled', mins: 30, do: await p.evaluate(() => today())});
  const tWin = await mk({text: 'Windowed', mins: 60, day: await p.evaluate(() => addDays(today(), 4))});
  await p.evaluate(id => { pbdAddBlock(today(), {ref: {type: 'task', id}, start: '10:00', durationMin: 40}); }, tInk);
  is('a do-date and an hour is ink; a do-date alone is pencil; a due date alone is a window', await p.evaluate(ids => ids.map(id => pbdPlacement(pbdTask(id), id).state), [tInk, tPen, tWin]), ['ink', 'pencil', 'window']);
  const g1 = await p.evaluate(id => { const g = pbdGhost(pbdTask(id), id); return {day: g.day, daysEarly: daysBetween(g.day, addDays(today(), 4)), reason: g.reason}; }, tWin);
  yes('the ghost is a day before the due date, with its reason', g1.daysEarly === 1 && /one day earlier/.test(g1.reason), g1);
  await p.evaluate(() => { const d = addDays(today(), 3); for(let i = 0; i < 6; i++) pbdAddBlock(d, {kind: 'meal', label: 'x', start: pbdHM(480 + i * 120), durationMin: 100}); });
  /* those are anchors, so the day is spoken for; make real work fill the day beyond its cap too */
  await p.evaluate(() => { const d = addDays(today(), 3); for(let i = 0; i < 8; i++){ const t = newPlanTask('filler ' + i, '', {duration: 90}); S.tasks.push(t); taskSetDoRange(t, d, ''); } });
  const g2 = await p.evaluate(id => { const g = pbdGhost(pbdTask(id), id); return {gap: daysBetween(g.day, addDays(today(), 4)), cap3: pbdCapacity(addDays(today(), 3)).over, reason: g.reason}; }, tWin);
  yes('with the day before it over its cap, the ghost moves off it, and says so', g2.cap3 && g2.gap !== 1, g2);
  is('a repeat or an overdue due date puts the ghost on today, not in the past', await p.evaluate(() => { const t = newPlanTask('late', addDays(today(), -2), {duration: 30}); S.tasks.push(t); const g = pbdGhost(t, t.id); return [g.day === today(), !!g.overdue]; }), [true, true]);
  await reset();

  console.log('\n3. capacity');
  await p.evaluate(() => { S.habits.push(habDefaults({id: 'hh', name: 'Stretch', at: 8, negative: false, freq: {type: 'daily', days: [], count: 1}, links: {values: [], skills: []}, order: 1, created: today()})); });
  const c0 = await p.evaluate(() => { const c = pbdCapacity(today()); return {awake: c.awake, anchors: c.anchors, free: c.free, text: c.text}; });
  is('960 awake, 15 for the stretch, 45 reserve → 900 free', [c0.awake, c0.anchors, c0.free, c0.text], [960, 15, 900, 'Nothing planned yet']);
  const c1 = await p.evaluate(() => { for(let i = 0; i < 5; i++) pbdAddBlock(today(), {kind: 'task', label: 'w' + i, start: pbdHM(540 + i * 100), durationMin: 85, bufferMin: 15, ref: {type: 'task', id: 'q' + i}}); const c = pbdCapacity(today()); return [c.planned, c.pct, c.over, c.text]; });
  is('five 85+15 blocks: 500 of 900 = 56%, room to breathe', c1, [500, 56, false, 'Planned 56% — room to breathe']);
  const c2 = await p.evaluate(() => { for(let i = 5; i < 8; i++) pbdAddBlock(today(), {kind: 'task', label: 'w' + i, start: pbdHM(600), durationMin: 85, bufferMin: 15, ref: {type: 'task', id: 'q' + i}}); const c = pbdCapacity(today()); return [c.pct, c.over, /past the 75% cap/.test(c.text), /cap is 75%/.test(c.rule)]; });
  is('past the cap it says so and shows the rule — and nothing was refused', c2, [89, true, true, true]);
  await reset();

  console.log('\n4. the board');
  const day = await p.evaluate(() => today());
  const tA = await mk({text: 'Email Sam', mins: 15, day: await p.evaluate(() => addDays(today(), 3))});
  const tB = await mk({text: 'Read the paper', mins: 0});
  const tC = await mk({text: 'Draft budget', mins: 120});
  await p.evaluate(() => { pbdOpen(today()); }); await p.waitForTimeout(400);
  const geo = () => p.evaluate(() => { const t = document.querySelector('[data-pbtrack]').getBoundingClientRect(); const pane = document.querySelector('[data-pbpane]').getBoundingClientRect(); const tray = document.querySelector('[data-pbtray]').getBoundingClientRect();
    return {x: t.left + t.width / 2, top: t.top, h: t.height, wake: +document.querySelector('[data-pbtrack]').dataset.wake, px: PBD_PX, paneX: pane.left + 40, paneY: pane.top + 300, trayX: tray.left + 60, trayY: tray.top + 20}; });
  const rowXY = id => p.evaluate(id => { const r = document.querySelector(`.pbd-row[data-pbtask="${id}"]`).getBoundingClientRect(); return {x: r.left + 40, y: r.top + 14}; }, id);
  const drag = async (from, to) => { await p.mouse.move(from.x, from.y); await p.mouse.down(); await p.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, {steps: 4}); await p.mouse.move(to.x, to.y, {steps: 6}); await p.mouse.up(); await p.waitForTimeout(250); };
  let g = await geo();
  const hourY = h => { const box = document.querySelector('[data-pbtrack]'); return 0; };
  const yAt = (min) => g.top + (min - g.wake) * g.px;
  await drag(await rowXY(tA), {x: g.x, y: yAt(600)});            // 10:00
  const aBlk = await p.evaluate(id => { const b = pbdBlocksFor(id)[0]; const t = pbdTask(id); return b && {start: b.start, dur: b.durationMin, margin: b.marginMin, buf: b.bufferMin, doDay: t.doDay, due: t.day, src: b.source, ref: b.ref}; }, tA);
  yes('dragged to ten: a block with the margin and the buffer, the do-date is today and the due date has not moved',
    aBlk && aBlk.start >= '09:55' && aBlk.start <= '10:05' && aBlk.dur === 20 && aBlk.margin === 5 && aBlk.buf === 15 && aBlk.doDay === day && aBlk.due !== day && aBlk.src === 'dragged', aBlk);
  is('and the due date really is three days on', await p.evaluate(id => pbdTask(id).day === addDays(today(), 3), tA), true);
  await drag(await rowXY(tB), {x: g.x, y: yAt(660)});            // unestimated
  yes('an unestimated task asks how long', await p.evaluate(() => !!document.querySelector('[data-pbest]')));
  await p.evaluate(() => document.querySelector('[data-pbest="30"]').click()); await p.waitForTimeout(250);
  is('the pick is saved as its estimate, and the block follows (30 → 40 with margin)', await p.evaluate(id => [pbdTask(id).duration, pbdBlocksFor(id)[0] && pbdBlocksFor(id)[0].durationMin], tB), [30, 40]);
  g = await geo();
  await drag(await rowXY(tC), {x: g.x, y: yAt(780)});            // 120m
  yes('a long task is offered a split', await p.evaluate(() => !!document.querySelector('[data-pbsplit]')));
  await p.evaluate(() => document.querySelector('[data-pbsplit="split"]').click()); await p.waitForTimeout(300);
  is('split into four 30-minute blocks, in a row', await p.evaluate(id => pbdBlocksFor(id).sort((a, b) => a.start < b.start ? -1 : 1).map(b => b.durationMin), tC), [30, 30, 30, 30]);
  /* resize once */
  g = await geo();
  const rz = await p.evaluate(id => { const b = pbdBlocksFor(id)[0]; const r = document.querySelector(`[data-pbblk="${b.id}"] .pbd-rz`).getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + 3, id: b.id}; }, tA);
  await p.mouse.move(rz.x, rz.y); await p.mouse.down(); await p.mouse.move(rz.x, rz.y + 20, {steps: 4}); await p.mouse.move(rz.x, rz.y + 36, {steps: 4}); await p.mouse.up(); await p.waitForTimeout(300);
  const rs = await p.evaluate(id => ({dur: pbdBlocksFor(id)[0].durationMin, toast: [...document.querySelectorAll('.toast')].map(t => t.textContent.trim())}), tA);
  yes('resized longer, and asked once whether the estimate should follow', rs.dur > 20 && rs.toast.some(t => /Make the estimate/.test(t)), rs);
  await p.evaluate(() => { [...document.querySelectorAll('.toast-act')].find(b => /update it/.test(b.textContent)).click(); }); await p.waitForTimeout(200);
  yes('"update it" changes the estimate', await p.evaluate(id => pbdTask(id).duration > 15, tA));
  /* to the tray */
  const tD = await mk({text: 'For the tray', mins: 25});
  await p.evaluate(() => pbdRender()); await p.waitForTimeout(200);
  g = await geo();
  await drag(await rowXY(tD), {x: g.trayX, y: g.trayY});
  is('onto the tray: the day and no hour', await p.evaluate(id => [pbdTask(id).doDay === today(), pbdBlocksFor(id).length, pbdPlacement(pbdTask(id), id).state], tD), [true, 0, 'pencil']);
  /* back to the pane: both off, undoable */
  const blkXY = await p.evaluate(id => { const b = pbdBlocksFor(id)[0]; const r = document.querySelector(`[data-pbblk="${b.id}"]`).getBoundingClientRect(); return {x: r.left + 30, y: r.top + 8}; }, tB);
  g = await geo();
  await drag(blkXY, {x: g.paneX, y: g.paneY});
  is('back to the right-hand side: the block and the do-date are gone', await p.evaluate(id => [pbdBlocksFor(id).length, pbdTask(id).doDay || ''], tB), [0, '']);
  await p.evaluate(() => { [...document.querySelectorAll('.toast-act')].find(b => /undo/.test(b.textContent)).click(); }); await p.waitForTimeout(250);
  is('and undo puts both back', await p.evaluate(id => [pbdBlocksFor(id).length, pbdTask(id).doDay === today()], tB), [1, true]);

  console.log('\n5. sixty seconds, re-plan, protected time, intentions');
  await p.evaluate(() => { pbdClose(); }); await reset();
  const t1 = await mk({text: 'First', mins: 40, do: day}), t2 = await mk({text: 'Second', mins: 30, do: day}), t3 = await mk({text: 'Third', mins: 20, do: day});
  await p.evaluate(() => { dayPlan(today()).energyHigh = '09:00'; dayPlan(today()).energyLow = '12:00'; pbdAddBlock(today(), {kind: 'protect', label: 'Writing time', start: '09:00', durationMin: 90}); saveNow(); });
  const lay = await p.evaluate(ids => { dayPlan(today()).intentions = ['First', '', '']; pbdSetIntentionRef(dayPlan(today()), 0, {type: 'task', id: ids[0]}); dayPlan(today()).topTwo = [0, 1];
    return pbdLayout(today(), ids, 420).map(x => [pbdTask(x.id).title || pbdTask(x.id).text, pbdHM(x.start), pbdHM(x.start + x.durationMin)]); }, [t1, t2, t3]);
  yes('auto-placement never fills the protected block (09:00–10:30)', lay.every(([, a, z]) => z <= '09:00' || a >= '10:30'), lay);
  const first = lay.find(x => x[0] === 'First');
  yes('the top-two task goes in the high-energy window, after the protected time', first && first[1] >= '10:30' && first[2] <= '12:00', lay);
  await p.evaluate(() => { pbdOpen(today()); }); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('[data-pb60]').click(); }); await p.waitForTimeout(300);
  yes('"Plan in 60 seconds" lists what is pencilled and the layout', await p.evaluate(() => document.querySelectorAll('[data-sx]').length === 3 && document.querySelectorAll('.pbd-layrow').length === 3));
  await p.evaluate(() => { document.querySelector('[data-st]').click(); document.querySelector('[data-sa]').click(); }); await p.waitForTimeout(300);
  is('accepting writes the blocks (three, each with its buffer)', await p.evaluate(() => pbdBlocksOn(today()).filter(b => b.kind === 'task').map(b => b.bufferMin)), [15, 15, 15]);
  is('and the top two become the day’s intentions, as references', await p.evaluate(() => { const pl = dayPlan(today()); return [pbdIntentionRef(pl, 0) && pbdIntentionRef(pl, 0).type, !!pl.intentions[0]]; }), ['task', true]);
  is('ticking the task ticks the intention', await p.evaluate(id => { const pl = dayPlan(today()); const before = pbdIntentionDone(pl, 0); setTaskDone(pbdIntentionRef(pl, 0).id, true); return [before, pbdIntentionDone(pl, 0)]; }, t1), [false, true]);
  /* re-plan from here */
  await p.evaluate(() => { pbdClose(); }); await reset();
  const r1 = await mk({text: 'Missed', mins: 30, do: day}), r2 = await mk({text: 'Later', mins: 30, do: day});
  await p.evaluate(([a, b]) => { pbdAddBlock(today(), {ref: {type: 'task', id: a}, start: '07:00', durationMin: 30, bufferMin: 15}); pbdAddBlock(today(), {ref: {type: 'task', id: b}, start: '16:00', durationMin: 30, bufferMin: 15}); saveNow(); pbdOpen(today()); }, [r1, r2]);
  await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('[data-pbreplan]').click(); }); await p.waitForTimeout(300);
  const rp = await p.evaluate(([a, b]) => ({missed: pbdBlocksFor(a).map(x => x.start), later: pbdBlocksFor(b).map(x => x.start), now: new Date().getHours() * 60 + new Date().getMinutes()}), [r1, r2]);
  yes('the block still ahead stays; the one that went by is fitted into the hours left', rp.later[0] === '16:00' && rp.missed.length === 1 && pbdMinOK(rp.missed[0]) > rp.now, rp);
  function pbdMinOK(hm){ const [h, m] = hm.split(':').map(Number); return h * 60 + m; }

  console.log('\n6. the week');
  await p.evaluate(() => { PB.mode = 'week'; PB.scale = 'days'; pbdRender(); }); await p.waitForTimeout(300);
  is('seven columns, each with its own gauge', await p.evaluate(() => [document.querySelectorAll('.pbd-col').length, document.querySelectorAll('.pbd-col .pbd-gauge').length]), [7, 7]);
  await p.evaluate(() => { PB.scale = 'hours'; pbdRender(); }); await p.waitForTimeout(200);
  is('and zooms to hours', await p.evaluate(() => document.querySelectorAll('.pbd-col [data-pbtrack]').length), 7);
  await p.evaluate(() => { const wk = weekPlan(weekStart(PB.day)); wk.periods = [{id: 'pp', from: weekStart(PB.day), to: addDays(weekStart(PB.day), 2), name: 'The deadline', focus: 'ship it', taskIds: []}]; pbdRender(); });
  yes('a stage of the week shades its days', await p.evaluate(() => document.querySelectorAll('.pbd-period').length === 3 && /The deadline/.test(document.querySelector('.pbd-period').textContent)));

  console.log('\n6b. Today: the live block, plan against what happened, the pickers');
  await p.evaluate(() => { pbdClose(); }); await reset();
  const L1 = await mk({text: 'Live one', mins: 30, do: day}), L2 = await mk({text: 'Gone one', mins: 30, do: day}), L3 = await mk({text: 'Next one', mins: 30, do: day});
  await p.evaluate(([a, b, c]) => { pbdAddBlock(today(), {ref: {type: 'task', id: a}, start: '10:00', durationMin: 40, marginMin: 10, bufferMin: 15});
    pbdAddBlock(today(), {ref: {type: 'task', id: b}, start: '08:00', durationMin: 30, bufferMin: 15});
    pbdAddBlock(today(), {ref: {type: 'task', id: c}, start: '10:50', durationMin: 30, bufferMin: 15});
    planState().dxFlash = false; S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); saveNow(); }, [L1, L2, L3]);
  await p.waitForTimeout(900);
  const live = await p.evaluate(() => ({strip: !!document.querySelector('.today-blocks-strip .tb-strip-bar'), bars: document.querySelectorAll('.today-blocks-strip .tb-bar').length,
    start: !!document.querySelector('[data-pqid^="block-start:"] [data-pqgo]'),
    text: (document.getElementById('pq') || {}).textContent || ''}));
  yes('Today draws the day\u2019s hours and, at the block\u2019s time, offers "Start: Live one (30m)"', live.strip && live.bars === 3 && /Start: Live one/.test(live.text) && /\(30m\)/.test(live.text), live);
  yes('and the block that went by asks whether it happened', /Gone one/.test(live.text) && /did this happen/.test(live.text), live.text);
  await p.evaluate(() => { document.querySelector('[data-pqid^="block-start:"] [data-pqgo]').click(); }); await p.waitForTimeout(500);
  is('Start opens a sitting on that task (with its card)', await p.evaluate(id => { const s = FocusTimer.state(); return [s.running, s.taskId === id]; }, L1), [true, true]);
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-pqid^="block-ask:"] [data-pqact]')].find(x => /did not/.test(x.textContent)); b.click(); }); await p.waitForTimeout(300);
  is('"it did not" takes the block off the strip and leaves the work on the day, where it was', await p.evaluate(id => [pbdBlocksFor(id).length, pbdTask(id).doDay === today(), pbdPlacement(pbdTask(id), id).state], L2), [0, true, 'pencil']);
  await p.clock.fastForward(45 * 60 * 1000); await p.clock.runFor(100);
  await p.evaluate(() => { pbdLiveRepaint(); });
  const longRow = await p.evaluate(() => (document.getElementById('pq') || {}).textContent || '');
  yes('a sitting that runs past its block offers to push the rest, or drop one', /has run past its time/.test(longRow) && /push the rest/.test(longRow) && /drop one/.test(longRow), longRow);
  await p.evaluate(() => { [...document.querySelectorAll('[data-pqid^="block-long:"] [data-pqact]')].find(x => /push the rest/.test(x.textContent)).click(); });
  is('push the rest moves what follows fifteen minutes later', await p.evaluate(id => pbdBlocksFor(id)[0].start, L3), '11:05');
  await p.evaluate(() => { FocusTimer.stop(true); document.getElementById('fzClose')?.remove(); document.querySelectorAll('.toast').forEach(n => n.remove()); });
  const pv = await p.evaluate(() => { const tmp = document.createElement('div'); tmp.innerHTML = pbdPlanVsActualHTML(today()); return {rows: tmp.querySelectorAll('.pvb-track').length, plan: tmp.querySelectorAll('.pvb-b.plan').length, did: tmp.querySelectorAll('.pvb-b.did').length, key: /meant it/.test(tmp.textContent)}; });
  is('plan against what happened: the blocks in outline, the tracked time filled, a key for the readings', pv, {rows: 2, plan: 2, did: 1, key: true});
  await p.evaluate(() => { S.settings.todayView = 'do'; localStorage.removeItem('x'); });
  /* the pickers */
  const html = await p.evaluate(id => { const pl = dayPlan(today()); pl.intentions = ['one', 'two', 'three']; const h = pbdIntentionOptionsHTML(pl, 0, today()); const d = document.createElement('div'); d.innerHTML = h; return {sel: !!d.querySelector('[data-intref]'), has: [...d.querySelectorAll('option')].some(o => o.value === 'task:' + id), top: d.querySelectorAll('[data-inttop]').length}; }, L1);
  is('each of the day\u2019s three can point at a task or a week goal, and be a top two', html, {sel: true, has: true, top: 1});
  is('the instant look at where a due date fits', await p.evaluate(id => /^Fits .*\./.test(pbdFitsText(pbdTask(id), addDays(today(), 4))), L1), true);
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForTimeout(700);
  is('the board\u2019s numbers are in the settings', await p.evaluate(() => [document.getElementById('sPbBuf').value, document.getElementById('sPbCap').value, document.getElementById('sPbRes').value]), ['15', '75', '45']);
  await p.evaluate(() => { const n = document.getElementById('sPbCap'); n.value = 60; n.dispatchEvent(new Event('change')); });
  is('and the cap follows them', await p.evaluate(() => pbdCapacity(today()).capPct), 60);

  console.log('\n7. nothing broke on the way');
  await p.evaluate(() => pbdClose());
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
