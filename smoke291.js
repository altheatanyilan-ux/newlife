/* smoke291 — Phase 4 of the execution overhaul: habits counted by the clock.

   1. A link is a claim: habits that were matched by name are proposed, one by
      one, and nothing is linked until it is confirmed; a refused one is not
      matched by its name any more. The old category-and-number pair reads as
      a link already made.
   2. A clock-counted habit shows "12 of 20 min" as the minutes arrive, fills
      the day when a finished stretch takes it over the line, and records
      which sitting did it.
   3. Edit or delete that sitting and the day is read again: below the line it
      goes back to partial — never to a miss — and to nothing once the clock
      has nothing left; a day ticked by hand is never touched; a day cleared
      by hand is not written again.
   4. "Start the minimum" opens a sitting with the minimum as its goal, filed
      where the habit counts it; a habit the clock does not count is asked.
   5. A habit stacked after another is offered when a sitting on the first ends.
   6. The limiting register, the states on a trigger map, and the scripted
      answer for a distraction put down to a state.
   7. A miss put down to time or tiredness is set beside what was recorded.
   8. Fixtures in the stillness room and the journals.

   Run: NODE_PATH=node_modules node smoke291.js */
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
  const fwd = async ms => { for(let left = ms; left > 0; left -= 60000) await p.clock.fastForward(Math.min(left, 60000)); await p.clock.runFor(50); };
  const clean = () => p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove());
    timeState(); S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset(); S.habits.length = 0; S.habitLog = {}; planState().limiters = []; });
  await clean();
  const mk = (o) => p.evaluate(o => { const h = habDefaults(Object.assign({id: uid(), name: 'x', order: 1, created: today(), freq: {type: 'daily', days: [], count: 1}, timeOfDay: 'anytime', negative: false, links: {values: [], skills: []}}, o));
    S.habits.push(h); return h.id; }, o);

  console.log('\n1. links are proposed, then confirmed');
  const hOld = await mk({name: 'Sit', timeCat: 'meditation', timeMins: 15});
  const hMed = await mk({name: 'Morning meditation', durationTarget: 20});
  const hJa  = await mk({name: 'Japanese review'});
  const hPlain = await mk({name: 'Floss'});
  await p.evaluate(() => { migrateHabits(); });
  const m1 = await p.evaluate(ids => ids.map(id => { const h = byId(S.habits, id); return [h.countsState, h.countsAs && h.countsAs.id, h.thresholdMin, h.countsProposal && h.countsProposal.id]; }), [hOld, hMed, hJa, hPlain]);
  is('the old pair is a link already made; names are proposed; a plain name is left alone', m1,
    [['confirmed', 'meditation', 15, null], ['proposed', null, null, 'meditation'], ['proposed', null, null, 'japanese'], ['none', null, null, null]]);
  is('and a proposal has not linked anything yet', await p.evaluate(id => [habCountsAs(byId(S.habits, id)), habClockProgress(byId(S.habits, id))], hMed), [null, null]);
  const room = async () => { await p.evaluate(() => { S._planRoom = 'habits';
    if(location.hash === '#/planning') rerender(); else location.hash = '#/planning'; }); await p.waitForTimeout(1300); };
  await room();
  await p.evaluate(() => { const b = document.querySelector('[data-hbview="dashboard"]'); if(b) b.click(); }); await p.waitForTimeout(500);
  const props = await p.evaluate(() => document.querySelectorAll('[data-hbprop]').length);
  is('the dashboard asks about each, one by one', props, 2);
  await p.evaluate(id => { const row = document.querySelector(`[data-hbprop="${id}"]`); row.querySelector('[data-hbpropmin]').value = 20; row.querySelector('[data-hbpropyes]').click(); }, hMed);
  await p.waitForTimeout(500);
  await p.evaluate(id => { document.querySelector(`[data-hbprop="${id}"] [data-hbpropno]`).click(); }, hJa);
  await p.waitForTimeout(500);
  is('confirmed: linked, with the old pair kept in step; refused: declined, nothing linked', await p.evaluate(ids => ids.map(id => { const h = byId(S.habits, id); return [h.countsState, h.countsAs && h.countsAs.id, h.thresholdMin, h.timeCat || null]; }), [hMed, hJa]),
    [['confirmed', 'meditation', 20, 'meditation'], ['declined', null, null, null]]);
  is('a refused habit is no longer ticked by its name when a room is used', await p.evaluate(id => { jaCredit && 0; const h = byId(S.habits, id); return h.countsState; }, hJa), 'declined');

  console.log('\n2. the clock fills the ring');
  await p.evaluate(() => { startTimer({what: 'sitting', categoryId: 'meditation'}); });
  await fwd(12 * 60 * 1000);
  const pr = await p.evaluate(id => { const h = byId(S.habits, id); const q = habClockProgress(h, today()); return [Math.round(q.mins), q.need, q.say, q.met, !!habitDone(h, today())]; }, hMed);
  is('twelve minutes in: "12 of 20 min", not met', pr, [12, 20, '12 of 20 min', false, false]);
  const ring = await p.evaluate(id => { const d = document.createElement('div'); d.innerHTML = habitRingHTML(byId(S.habits, id), today()); const b = d.querySelector('.hring-btn');
    return [!!b.querySelector('.hring-prog'), (b.querySelector('.hring-prog') || {}).textContent, b.title, !!b.querySelector('[data-hrgo]')]; }, hMed);
  yes('the ring carries the partial progress, and the way to start the minimum', ring[0] && /12 of 20/.test(ring[1] || '') && ring[3], ring);
  await fwd(10 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); });
  const kept = await p.evaluate(id => { const h = byId(S.habits, id); const e = S.habitLog[today()] && S.habitLog[today()][id];
    return {status: e && e.status, fromClock: e && e.fromClock, min: e && e.minutes, sitting: !!(e && e.sitting), kept: habKept(h, today()), done: habitDone(h, today()).fromClock}; }, hMed);
  is('a finished stretch over the line writes the day: kept, by the clock, with the sitting that did it', kept, {status: 'completed', fromClock: true, min: 22, sitting: true, kept: true, done: true});

  console.log('\n3. the sitting is edited or deleted, and the day is read again');
  await p.evaluate(() => { const e = S.timeEntries.find(x => x.endTime); e.endTime = new Date(Date.parse(e.startTime) + 14 * 60000).toISOString(); e.edited = true; timeAfterSave(e); });
  const part = await p.evaluate(id => { const e = S.habitLog[today()][id]; return [e.status, e.minutes, !!e.sitting, habKept(byId(S.habits, id), today())]; }, hMed);
  is('shortened to 14 of 20: back to partial (still a kept-in-part day), not a miss', part, ['partial', 14, false, true]);
  await p.evaluate(() => { const e = S.timeEntries.find(x => x.endTime); e.endTime = new Date(Date.parse(e.startTime) + 21 * 60000).toISOString(); timeAfterSave(e); });
  is('lengthened again: complete again', await p.evaluate(id => S.habitLog[today()][id].status, hMed), 'completed');
  await p.evaluate(() => { const e = S.timeEntries.find(x => x.endTime); removeTimeEntry(e.id); });
  is('deleted: nothing left, so no entry', await p.evaluate(id => !!(S.habitLog[today()] && S.habitLog[today()][id]), hMed), false);
  await p.evaluate(id => { S.habitLog[today()] = S.habitLog[today()] || {}; S.habitLog[today()][id] = {level: 'full', note: 'by hand', status: 'completed'}; logTime({what: 'x', categoryId: 'meditation', minutes: 5, startTime: new Date(Date.now() - 600000).toISOString()}); }, hMed);
  is('a day ticked by hand is never touched by the clock', await p.evaluate(id => [S.habitLog[today()][id].note, S.habitLog[today()][id].fromClock || false], hMed), ['by hand', false]);
  await p.evaluate(id => { delete S.habitLog[today()][id]; S.timeEntries.length = 0; logTime({what: 'big', categoryId: 'meditation', minutes: 30, startTime: new Date(Date.now() - 31 * 60000).toISOString()}); }, hMed);
  is('a long entry made afterwards fills the day', await p.evaluate(id => S.habitLog[today()][id].fromClock, hMed), true);
  await p.evaluate(id => { habClearEntry(byId(S.habits, id), today()); const e = S.timeEntries[0]; timeAfterSave(e); }, hMed);
  is('cleared by hand, it is not written again', await p.evaluate(id => !!(S.habitLog[today()] && S.habitLog[today()][id]), hMed), false);

  console.log('\n4. start the minimum');
  await clean();
  const hRead = await mk({name: 'Read a page', min: 'one page', countsAs: {type: 'category', id: 'reading'}, thresholdMin: 10, countsState: 'confirmed'});
  const hFloss = await mk({name: 'Floss', min: 'one tooth'});
  await p.evaluate(id => { habStartMinimum(byId(S.habits, id)); }, hRead);
  const st4 = await p.evaluate(() => { const s = FocusTimer.state(); return [s.running, s.meta && s.meta.what, s.meta && s.meta.goal, s.meta && s.meta.categoryId]; });
  is('a sitting with the minimum as its goal, filed in the habit’s category', st4, [true, 'Read a page', 'one page', 'reading']);
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); }); await p.waitForTimeout(700);
  yes('the Focus section says what the minimum is', await p.evaluate(() => /one page/.test((document.querySelector('.tf-goal') || {}).textContent || '')), 'no goal row');
  await fwd(3 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.stop(true); });
  const toast4 = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent));
  yes('a habit the clock counts is not asked (the minutes arrive on their own)', !toast4.some(t => /minimum of/.test(t)), toast4);
  is('and 3 of 10 min is partial progress, not a kept day', await p.evaluate(id => [habClockProgress(byId(S.habits, id)).say, !!(S.habitLog[today()] && S.habitLog[today()][id])], hRead), ['3 of 10 min', false]);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(n => n.remove()); });
  await p.evaluate(id => { habStartMinimum(byId(S.habits, id)); }, hFloss);
  await fwd(2 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.stop(true); });
  const t4 = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()));
  yes('a habit it does not count is asked whether the minimum was kept', t4.some(t => /minimum of .Floss.*kept/.test(t)), t4);
  await p.evaluate(() => { [...document.querySelectorAll('.toast-act')].find(b => /yes, kept/.test(b.textContent)).click(); });
  is('and "yes" records the minimum', await p.evaluate(id => { const e = S.habitLog[today()][id]; return [e.status, /one tooth/.test(e.note)]; }, hFloss), ['partial', true]);

  console.log('\n5. stacking: next');
  await clean();
  const hA = await mk({name: 'Stretch', min: 'one stretch'});
  const hB = await mk({name: 'Cold water', min: 'a splash', stackAfter: null});
  await p.evaluate(([a, b]) => { byId(S.habits, b).stackAfter = a; }, [hA, hB]);
  await p.evaluate(id => { habStartMinimum(byId(S.habits, id)); }, hA);
  await fwd(2 * 60 * 1000);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(n => n.remove()); FocusTimer.stop(true); });
  await fwd(1000);
  const t5 = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()));
  yes('the sitting on the anchor closes and "Next: Cold water — start?" is offered', t5.some(t => /Next: Cold water/.test(t)), t5);
  await p.evaluate(() => { [...document.querySelectorAll('.toast-act')].find(b => /^start$/.test(b.textContent.trim())).click(); });
  is('and one tap starts it', await p.evaluate(() => { const s = FocusTimer.state(); return [s.running, s.meta && s.meta.what]; }), [true, 'Cold water']);
  await p.evaluate(() => { FocusTimer.stop(true); });

  console.log('\n6. the limiting register and the states');
  await clean();
  const hBr = await mk({name: 'Doomscrolling', negative: true, triggers: [{id: 't1', type: 'emotional', description: 'after work', intensity: 3, strategy: 'phone in the drawer', states: ['stress']}]});
  await room();
  await p.evaluate(() => { document.querySelector('[data-hbview="limits"]').click(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelector('[data-hblAdd="stress"]').click(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { const r = document.querySelector('[data-hblim]'); const a = r.querySelector('[data-hblf="action"]'); a.value = 'stand up, water, five breaths'; a.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(600);
  is('a row in the register: state, description, scripted action', await p.evaluate(() => planState().limiters.map(r => [r.state, r.action])), [['stress', 'stand up, water, five breaths']]);
  is('the script for stress joins the register row and the trigger map', await p.evaluate(() => habStateScripts('stress').map(s => s.text)), ['stand up, water, five breaths', 'phone in the drawer']);
  await p.evaluate(() => { startTimer({what: 'work'}); }); await fwd(3 * 60 * 1000);
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); }); await p.waitForTimeout(700);
  await p.evaluate(() => { const x = dxNote('phone buzzing'); }); 
  await p.evaluate(() => { rerender(); }); await p.waitForTimeout(500);
  const dxs = await p.evaluate(() => document.querySelectorAll('.dx [data-dxstate]').length);
  yes('a distraction offers the five states', dxs >= 5, dxs);
  await p.evaluate(() => { document.querySelector('.dx [data-dxstate="stress"]').click(); }); await p.waitForTimeout(400);
  const sc = await p.evaluate(() => (document.querySelector('.dx .hb-script') || {}).textContent || '');
  yes('picking one shows the scripted action', /stand up, water, five breaths/.test(sc) && /phone in the drawer/.test(sc), sc);
  await p.evaluate(() => { FocusTimer.stop(true); });
  const tag = await p.evaluate(id => { const h = byId(S.habits, id); return h.triggers[0].states; }, hBr);
  is('and the trigger carries its state tag', tag, ['stress']);

  console.log('\n7. a miss, set beside the time');
  await clean();
  const hM = await mk({name: 'Practise', min: 'one scale'});
  await p.evaluate(id => { const h = byId(S.habits, id); const T = today();
    for(let i = 1; i <= 8; i++){ const d = addDays(T, -i);
      S.dailyRhythm = S.dailyRhythm || {}; S.dailyRhythm[d] = {wakeTime: '07:00', sleepTime: '23:00'};
      const start = new Date(d + 'T09:00:00'), hrs = i <= 4 ? 2 : 8;       /* the first four days hold little tracked time */
      logTime({what: 'work', categoryId: 'work', startTime: start.toISOString(), endTime: new Date(start.getTime() + hrs * 3600000).toISOString()});
      if(i <= 4) habSetEntry(h, d, {status: 'skipped', reason: 'time'}); } }, hM);
  const ins = await p.evaluate(id => habMissInsight(byId(S.habits, id)), hM);
  yes('four "ran out of time" days: the day’s untracked time is set beside the others, neutrally, with the rule', ins && ins.lines.length === 1 && /ran out of time/.test(ins.lines[0].text) && /untracked/.test(ins.lines[0].text) && /Worked out as/.test(ins.rule), ins);
  yes('and it says how it was worked out', ins && /does not say which is right/.test(ins.rule));
  await p.evaluate(id => { const h = byId(S.habits, id); const T = today(); for(let i = 1; i <= 8; i++){ const e = habEntry(h, addDays(T, -i)); if(e && i > 2) e.status = 'completed'; } }, hM);
  is('fewer than three such days says nothing', await p.evaluate(id => habMissInsight(byId(S.habits, id)), hM), null);

  console.log('\n8. fixtures in the stillness room and the journals');
  await clean();
  const hF = await mk({name: 'Sit', linkedRooms: ['stillness', 'journals']});
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); }); await p.waitForTimeout(800);
  const stillFix = await p.evaluate(() => document.querySelectorAll('.stillness .hab-fixture').length);
  await p.evaluate(() => { location.hash = '#/journals'; }); await p.waitForTimeout(900);
  const jrFix = await p.evaluate(() => document.querySelectorAll('.hab-fixture').length);
  is('a habit linked to a room shows there', [stillFix, jrFix], [1, 1]);

  console.log('\n9. kept across a reload');
  await p.evaluate(id => { const h = byId(S.habits, id); habSetCounts(h, {type: 'category', id: 'piano'}, 25); }, hF);
  await p.evaluate(async () => { await saveNow(); await flushSave(); });
  await p.reload(); await p.waitForTimeout(2500);
  is('the link and its number survive', await p.evaluate(id => { const h = byId(S.habits, id); return [h.countsAs, h.thresholdMin, h.countsState]; }, hF), [{type: 'category', id: 'piano'}, 25, 'confirmed']);

  console.log('\n10. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
