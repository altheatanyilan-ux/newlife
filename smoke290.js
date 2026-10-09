/* smoke290 — Phase 3 of the execution overhaul: stretches with a kind, a
   break that is a stretch of its own, and the reading on a stretch.

   1. A pause opens a break stretch: asked in one line, answered by a chip;
      the chip names it, files it under its category and sets how long it was
      meant to be; resuming writes it as an entry of kind 'break' beside the
      work, so the work and the breaks add up to the span of the sitting.
   2. A break held past its planned length asks "still the same?"; ending it
      splits it into the planned part and the overrun, each its own entry,
      the overrun able to be something else, and carrying an optional reason.
   3. A reading — meant | partly | drifted — is said once, by stretch, and is
      never overwritten; a skipped one is recorded as skipped; one given
      afterwards from the day's list survives the record being read again.
   4. "now:" switches the stretch's kind (work → admin) without the clock
      stopping; the stretches are entries of their own kind.
   5. The Focus section shows the chips, the planned length and the verdict
      row; the dial counts a planned break down and shows the overrun in rose.
   6. A distraction tagged to a breaking habit writes its urge log with the
      time, the sitting, and whether I was back within the break.
   7. The break chips are yours: settings editor, kept across a reload; the
      focus figures leave breaks out.

   Run: NODE_PATH=node_modules node smoke290.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 900}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.clock.install({time: new Date('2026-06-10T10:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const clean = () => p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove());
    timeState(); S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset(); timeSettings().autoTrack = true; });
  await clean();
  const fwd = async ms => { for(let left = ms; left > 0; left -= 60000) await p.clock.fastForward(Math.min(left, 60000)); await p.clock.runFor(50); };
  const rows = () => p.evaluate(() => S.timeEntries.slice().sort((a, b) => a.startTime < b.startTime ? -1 : 1).map(e => ({what: e.what, cat: e.categoryId, kind: e.kind,
    mins: Math.round(timeMinutes(e) * 10) / 10, chip: e.chipId, verdict: e.verdict, over: !!e.overrun, origin: e.origin, run: !e.endTime})));

  console.log('\n1. a pause opens a break, and a chip answers it');
  await p.evaluate(() => { startTimer({what: 'the essay', categoryId: 'writing'}); });
  await fwd(10 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); });
  const s1 = await p.evaluate(() => { const s = FocusTimer.state(); return {onBreak: s.onBreak, planned: s.breakPlanned, left: s.breakLeft, chip: s.breakChip}; });
  is('a break is open, planned at the default five minutes, with no chip yet', [s1.onBreak, s1.planned, s1.chip], [true, 5, null]);
  await p.evaluate(() => { FocusTimer.setBreakChip('walk'); });
  const s1b = await p.evaluate(() => { const s = FocusTimer.state(); return {planned: s.breakPlanned, chip: s.breakChip, note: s.breakNote, sugg: s.breakSuggest}; });
  is('the walk chip names it, plans ten minutes and suggests "meant"', [s1b.planned, s1b.chip, s1b.note, s1b.sugg], [10, 'walk', 'walk', 'meant']);
  await fwd(8 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.start(); });
  await fwd(6 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.stop(true); });
  let r = await rows();
  is('work, the walk, work — the walk an entry of its own kind in its category', r.map(e => [e.what, e.kind, e.cat, e.mins]),
    [['the essay', 'work', 'writing', 10], ['walk', 'break', 'exercise', 8], ['the essay', 'work', 'writing', 6]]);
  is('the figures: focus agrees with the work alone, the breaks left out', await p.evaluate(() => focusTimeAgreement(today())), {worked: 0, tracked: 0});

  console.log('\n2. a break held past its length');
  await clean();
  await p.evaluate(() => { startTimer({what: 'the proof', categoryId: 'study'}); });
  await fwd(5 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); FocusTimer.setBreakChip('stretch'); });   // three minutes
  await fwd(2 * 60 * 1000);
  is('inside its length: no question asked, minutes left shown', await p.evaluate(() => { const s = FocusTimer.state(); return [s.overrunAsked, s.breakOver, s.breakLeft > 0]; }), [false, 0, true]);
  await fwd(4 * 60 * 1000);
  const s2 = await p.evaluate(() => { const s = FocusTimer.state(); return {asked: s.overrunAsked, over: s.breakOver, left: s.breakLeft}; });
  yes('past it: "still the same?" is asked and the overrun is counted', s2.asked && s2.over >= 2 && s2.left < 0, s2);
  await p.evaluate(() => { FocusTimer.answerOverrun('phone'); FocusTimer.noteOverrun('a message from the group'); });
  await p.evaluate(() => { FocusTimer.start(); });
  await fwd(4 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.stop(true); });
  r = await rows();
  is('the break is split: the stretch as planned, then the overrun as something else', r.filter(e => e.kind === 'break').map(e => [e.what, e.chip, e.cat, e.mins, e.over, e.origin]),
    [['stretch', 'stretch', 'exercise', 3, false, 'pause'], ['phone', 'phone', 'rest', 3, true, 'overrun-split']].map(x => x));
  is('and the reason for the overrun is on the entry as a note', await p.evaluate(() => (S.timeEntries.find(e => e.overrun).notes || []).map(n => n.text)), ['a message from the group']);

  console.log('\n3. readings');
  await clean();
  await p.evaluate(() => { startTimer({what: 'reading the paper', categoryId: 'reading'}); });
  await fwd(6 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); FocusTimer.setBreakChip('phone'); });
  await fwd(2 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.start(); });
  const u = await p.evaluate(() => FocusTimer.unread().map(x => [x.kind, x.suggest]));
  is('the break just ended is the one thing waiting to be read, and the chip suggests "drifted"', u, [['break', 'drifted']]);
  const id = await p.evaluate(() => FocusTimer.unread()[0].id);
  is('saying it is kept', await p.evaluate(id => [FocusTimer.setVerdict(id, 'partly'), FocusTimer.setVerdict(id, 'meant'), FocusTimer.unread().length], id), [true, false, 0]);
  await fwd(4 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.stop(true); });
  r = await rows();
  is('and it is on the break’s entry, once, as said', r.filter(e => e.kind === 'break').map(e => e.verdict), ['partly']);
  is('the work stretches have been read by nobody', r.filter(e => e.kind === 'work').map(e => e.verdict), [null, null]);
  const eid = await p.evaluate(() => S.timeEntries.find(e => e.kind === 'work').id);
  is('a stretch is read afterwards from the day’s list', await p.evaluate(id => [timeSetVerdict(id, 'meant'), timeSetVerdict(id, 'drifted')], eid), [true, false]);
  await p.evaluate(() => { const rec = planState().focusSessions[0]; timeSyncFocus(rec, {}); });
  is('and survives the record being read in again', await p.evaluate(id => S.timeEntries.find(e => e.id === id).verdict, eid), 'meant');
  await clean();
  await p.evaluate(() => { startTimer({what: 'x'}); });
  await fwd(3 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); }); await fwd(2 * 60 * 1000); await p.evaluate(() => { FocusTimer.start(); });
  const sk = await p.evaluate(() => { const id = FocusTimer.unread()[0].id; return [FocusTimer.skipVerdict(id), FocusTimer.unread().length, FocusTimer.setVerdict(id, 'meant')]; });
  is('skipping is recorded and it is not asked again (it can still be said)', sk, [true, 0, true]);
  await p.evaluate(() => { FocusTimer.stop(true); });

  console.log('\n4. now: switches the kind, the clock keeps running');
  await clean();
  await p.evaluate(() => { startTimer({what: 'the report', categoryId: 'work'}); });
  await fwd(7 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.switchTo({kind: 'admin'}); });
  const s4 = await p.evaluate(() => { const s = FocusTimer.state(); return [s.running, s.curKind]; });
  is('still running, now admin', s4, [true, 'admin']);
  await fwd(5 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.switchTo({kind: 'break', id: 'snack', categoryId: 'meal', minutes: 10}); });
  is('switching to a break chip pauses into that break', await p.evaluate(() => { const s = FocusTimer.state(); return [s.onBreak, s.breakChip, s.breakPlanned]; }), [true, 'snack', 10]);
  await fwd(4 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.switchTo({kind: 'work'}); });
  await fwd(3 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.stop(true); });
  r = await rows();
  is('work 7, admin 5, snack 4, work 3 — each its own kind', r.map(e => [e.kind, e.mins]), [['work', 7], ['admin', 5], ['break', 4], ['work', 3]]);

  console.log('\n5. what the page shows');
  await clean();
  await p.evaluate(() => { startTimer({what: 'on the page', categoryId: 'work'}); });
  await fwd(3 * 60 * 1000);
  await p.evaluate(() => { location.hash = '#/today'; });
  await p.waitForTimeout(600);
  await p.evaluate(() => { FocusTimer.pause(); });
  await p.waitForTimeout(500);
  const ui = await p.evaluate(() => ({chips: document.querySelectorAll('#fpBreak [data-fpbchip]').length, label: (document.querySelector('#fpBreak label') || {}).textContent,
    meta: (document.getElementById('fpBMeta') || {}).textContent}));
  yes('the Focus section asks "Break — what are you doing?" with the chips beneath', ui.chips >= 6 && /Break — what are you doing/.test(ui.label || ''), ui);
  yes('and says how long the break was meant to be', /meant to be 5 min/.test(ui.meta || ''), ui.meta);
  await p.click('#fpBreak [data-fpbchip="walk"]'); await p.waitForTimeout(400);
  is('pressing a chip sets it', await p.evaluate(() => [FocusTimer.state().breakChip, document.querySelector('#fpBreak [data-fpbchip="walk"]').classList.contains('on')]), ['walk', true]);
  const dial = await p.evaluate(() => (document.querySelector('.fp-time') || {}).textContent);
  yes('the dial counts the planned break down', /^\d\d:\d\d$/.test(dial || ''), dial);
  await fwd(12 * 60 * 1000); await p.waitForTimeout(500);
  const over = await p.evaluate(() => ({time: (document.querySelector('.fp-time') || {}).textContent, ask: !!document.getElementById('fpOver'),
    stroke: (document.querySelector('.fp-ring .ft-arc') || {style: {}}).style.stroke}));
  yes('past the length the dial shows "+" and turns rose, and asks if it is still the same', /^\+/.test(over.time || '') && /rose/.test(over.stroke || '') && over.ask, over);
  await p.click('#fpOver [data-fpover="same"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { FocusTimer.start(); });
  await p.waitForTimeout(500);
  const v = await p.evaluate(() => ({row: !!document.getElementById('fpVerdict'), q: (document.querySelector('#fpVerdict .tf-vq') || {}).textContent, btns: document.querySelectorAll('#fpVerdict [data-fpverdict]').length,
    sugg: (document.querySelector('#fpVerdict .suggest') || {}).textContent}));
  yes('after the return, the verdict row asks about the break in the words for a break (the overrun first, then the walk as planned)', v.row && /chosen and restful/.test(v.q || '') && v.btns === 3, v);
  await p.click('#fpVerdict [data-fpverdict="drifted"]'); await p.waitForTimeout(400);
  is('one tap answers the overrun; the walk is still to ask', await p.evaluate(() => FocusTimer.unread().length), 1);
  await p.waitForTimeout(300);
  const v2 = await p.evaluate(() => ({q: (document.querySelector('#fpVerdict .tf-vq') || {}).textContent, sugg: (document.querySelector('#fpVerdict .suggest') || {}).textContent}));
  yes('the planned part of the walk is asked next, with its usual reading marked', /chosen and restful/.test(v2.q || '') && v2.sugg === 'meant it', v2);
  await p.click('#fpVerdict .suggest'); await p.waitForTimeout(400);
  is('pressing the suggested one answers it, and nothing is left to ask', await p.evaluate(() => [!!document.getElementById('fpVerdict'), FocusTimer.unread().length]), [false, 0]);
  const now = await p.evaluate(() => document.querySelectorAll('#fpNow [data-fpnow]').length);
  is('the "now:" row is there with two kinds, work and admin', now, 2);
  await p.evaluate(() => { FocusTimer.stop(true); });

  console.log('\n6. a distraction tagged to a habit I am breaking');
  await clean();
  const hid = await p.evaluate(() => { const h = habDefaults({id: uid(), name: 'Doomscrolling', negative: true, order: 99, created: today()});
    S.habits.push(h); return h.id; });
  await p.evaluate(id => { startTimer({what: 'deep work'}); }, hid);
  await fwd(4 * 60 * 1000);
  await p.evaluate(id => { const x = dxNote('phone buzzing → other room'); x.habitId = id; dxLogUrge(x, new Date().toISOString()); }, hid);
  await p.evaluate(() => { FocusTimer.pause(); FocusTimer.setBreakChip('stretch'); });
  await fwd(1 * 60 * 1000);
  await p.evaluate(() => { dxNote('phone buzzing'); });
  await fwd(5 * 60 * 1000);
  await p.evaluate(() => { dxNote('phone buzzing'); });
  const ur = await p.evaluate(id => S.habits.find(h => h.id === id).urgeLog.map(u => [u.outcome, u.source, u.returned, u.standing, !!u.sitting, !!u.at]), hid);
  is('stayed at work → resisted; back inside the break → resisted; ran past it → did not win', ur.reverse(),
    [['resisted', 'distraction', true, 'none', true, true], ['resisted', 'distraction', true, 'within', true, true], ['slipped', 'distraction', false, 'over', true, true]]);
  await p.evaluate(() => { FocusTimer.stop(true); });

  console.log('\n7. the chips are yours');
  await clean();
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForTimeout(800);
  const st = await p.evaluate(() => ({rows: document.querySelectorAll('#sBreakChips [data-bchip]').length, min: (document.getElementById('sBreakMin') || {}).value}));
  is('the clock settings list the eight shipped chips and the default length', [st.rows, st.min], [8, '5']);
  await p.evaluate(() => { const r = document.querySelector('#sBreakChips [data-bchip="walk"] [data-bf="label"]'); r.value = 'a long walk'; r.dispatchEvent(new Event('change')); });
  await p.evaluate(() => { document.getElementById('sBreakAdd').click(); }); await p.waitForTimeout(500);
  await p.evaluate(async () => { await saveNow(); await flushSave(); });
  await p.reload(); await p.waitForTimeout(2500);
  is('a renamed chip and an added one are kept across a reload', await p.evaluate(() => [timeBreakChips().length, timeBreakChips().find(c => c.id === 'walk').label]), [9, 'a long walk']);
  await p.evaluate(() => { timeBreakChips().splice(0, timeBreakChips().length, ...TIME_BREAK_CHIPS.map(c => Object.assign({}, c))); saveNow(); });

  console.log('\n8. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
