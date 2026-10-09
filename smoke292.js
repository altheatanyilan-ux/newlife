/* smoke292 — Phase 5 of the execution overhaul: the life of a sitting.

   1. Before: a sitting begun from the screen brings up one card — the
      minimum (filled in from the first open step, later from where you left
      off), what should be true in the room (a list that remembers its ticks),
      what to clear first (the cheat sheet, merged in), the week's stake if it
      has one. "Same as last time" is one tap; skipping is recorded; a sitting
      begun by code does not bring it up.
   2. During: an estimate counts down with a margin on top; when it runs out
      the clock carries on as overtime, counted against the estimate; a
      stopwatch can chime softly every half hour.
   3. After: a card asks where to pick up (required unless the task is done),
      whether the minimum was met, and how the focus was; that line is the
      next sitting's minimum; skipping is recorded.
   4. Every third sitting on the same skill or project offers a reflection,
      filed as a journal entry on it.

   Run: NODE_PATH=node_modules node smoke292.js */
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
  const clean = () => p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast,.dx-flashcard').forEach(n => n.remove());
    timeState(); S.timeEntries.length = 0; planState().focusSessions.length = 0; FocusTimer.reset(); S.tasks.length = 0;
    planState().distractions = []; planState().dxFlash = true; planState().kolb = {}; planState().preflight = {env: [], ran: 0};
    (planState().prefs = planState().prefs || {}).softChime = false; delete planState().prefs.focusMargin; S.settings.todayView = 'do'; });
  await clean();
  const mkTask = (o) => p.evaluate(o => { const t = newPlanTask(o.text, today(), {duration: o.mins, subtasks: o.subs || [], links: {projects: [], skills: o.skill ? [o.skill] : [], content: []}});
    S.tasks.push(t); saveNow(); return t.id; }, o);
  await p.evaluate(() => { if(!S.skills.length) S.skills.push({id: 'sk-292', name: 'Essay writing', hours: 0, planned: false}); });
  const skill = await p.evaluate(() => S.skills[0].id);

  console.log('\n1. the card before a sitting');
  const t1 = await mkTask({text: 'Draft the essay', mins: 40, subs: [{id: 'st1', title: 'Outline the argument', isCompleted: false}], skill});
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(600);
  await p.evaluate(id => { focusOnTask(id, 40); }, t1); await p.waitForTimeout(1200);
  const card = await p.evaluate(() => { const c = document.getElementById('dxFlash'); return c && {goal: c.querySelector('[data-fzgoal]').value, from: c.querySelector('label .k').textContent, begin: c.querySelector('[data-dxgo]').textContent, skip: !!c.querySelector('[data-fzskip]')}; });
  yes('it comes up, with the first open step as the minimum', card && card.goal === 'Outline the argument' && /first open step/.test(card.from) && card.begin === 'Begin' && card.skip, card);
  const run1 = await p.evaluate(() => { const s = FocusTimer.state(); return [s.running, s.left, s.margin, s.planned]; });
  is('and the clock is already running: 40m + 10m margin as a 50 minute countdown', [run1[0], run1[1] > 2990 && run1[1] <= 3000, run1[2], run1[3]], [true, true, 10, 3000]);
  yes('the Focus section says so', await p.evaluate(() => /40m \+ 10m margin/.test(document.querySelector('#t-focus .fp-head').textContent)), await p.evaluate(() => document.querySelector('#t-focus .fp-head').textContent));
  await p.evaluate(() => { const i = document.querySelector('#dxFlash [data-fzenvadd]'); i.value = 'phone in the other room'; i.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'})); });
  await p.evaluate(() => { document.querySelector('#dxFlash [data-fzenv]').click(); });
  await p.evaluate(() => { const i = document.querySelector('#dxFlash [data-fzgoal]'); i.value = 'two paragraphs of the argument'; });
  await p.click('#dxFlash [data-dxgo]'); await p.waitForTimeout(500);
  await fwd(2 * 60 * 1000);
  const rec1 = await p.evaluate(() => { const r = planState().focusSessions[0]; return r && {goal: r.goal, pf: r.preflight && [r.preflight.skipped, r.preflight.goal, r.preflight.env.map(e => [e.label, e.ticked])], planned: r.planned, margin: r.margin}; });
  is('the record keeps what was set: the goal, the list and its tick, the plan and margin', rec1, {goal: 'two paragraphs of the argument', pf: [false, 'two paragraphs of the argument', [['phone in the other room', true]]], planned: 50, margin: 10});
  yes('and the Focus section shows the minimum', await p.evaluate(() => /two paragraphs/.test((document.querySelector('.tf-goal') || {}).textContent || '')));
  await p.evaluate(() => { FocusTimer.stop(true); document.querySelectorAll('.toast').forEach(n => n.remove()); });
  await p.waitForTimeout(1300);
  yes('ending it brings up where to pick up, and Done waits for a line', await p.evaluate(() => { const c = document.getElementById('fzClose'); return !!c && c.querySelector('[data-pcdone]').disabled; }));
  await p.evaluate(() => { const c = document.getElementById('fzClose'); const i = c.querySelector('[data-pcup]'); i.value = 'the second paragraph, starting from the objection'; i.dispatchEvent(new Event('input'));
    c.querySelector('[data-pcmet="yes"]').click(); c.querySelector('[data-pcq="4"]').click(); c.querySelector('[data-pcdone]').click(); });
  await p.waitForTimeout(700);
  is('what was said is kept on the sitting', await p.evaluate(() => { const c = planState().focusSessions[0].closeout; return [c.pickUp, c.goalMet, c.quality]; }), ['the second paragraph, starting from the objection', true, 4]);
  await p.evaluate(id => { focusOnTask(id, 40); }, t1); await p.waitForTimeout(1200);
  const card2 = await p.evaluate(() => { const c = document.getElementById('dxFlash'); return c && {goal: c.querySelector('[data-fzgoal]').value, from: c.querySelector('label .k').textContent, begin: c.querySelector('[data-dxgo]').textContent,
    ticked: c.querySelector('[data-fzenv]').checked}; });
  yes('the next sitting\'s minimum is where you left off, the list remembers its tick, and "same as last time" is the button', card2 && /the second paragraph/.test(card2.goal) && /left off/.test(card2.from) && /same as last time/.test(card2.begin) && card2.ticked, card2);
  await p.click('#dxFlash [data-fzskip]'); await p.waitForTimeout(500);
  is('skipping is recorded', await p.evaluate(() => { const s = FocusTimer.state(); return [s.preflight && s.preflight.skipped, s.goal]; }), [true, '']);
  await p.evaluate(() => { FocusTimer.stop(true); document.getElementById('fzClose')?.remove(); }); await p.waitForTimeout(100);

  console.log('\n2. the week\'s stake and a sitting begun by code');
  await clean();
  const t2 = await mkTask({text: 'Another thing', mins: 20});
  await p.evaluate(() => { weekPlan(weekStart(today())).stake = 'no coffee until it is sent'; });
  await p.evaluate(id => { focusOnTask(id, 20); }, t2); await p.waitForTimeout(1200);
  yes('with a stake this week, the card shows it, marked as only yours', await p.evaluate(() => { const c = document.getElementById('dxFlash'); return !!c && /no coffee until it is sent/.test(c.textContent) && /only you see this/.test(c.textContent); }));
  await p.evaluate(() => { document.getElementById('dxFlash')?.remove(); FocusTimer.stop(true); weekPlan(weekStart(today())).stake = ''; document.querySelectorAll('#fzClose').forEach(n => n.remove()); });
  await p.evaluate(() => { FocusTimer.reset(); FocusTimer.start(null, 'focus'); }); await p.waitForTimeout(1200);
  yes('a sitting begun by code, not from the screen, does not', await p.evaluate(() => !document.getElementById('dxFlash')));
  await p.evaluate(() => { FocusTimer.stop(true); });

  console.log('\n3. overtime');
  await clean();
  await p.evaluate(() => { planState().dxFlash = false; });
  const t3 = await mkTask({text: 'Short job', mins: 4});
  await p.evaluate(id => { delete planState().prefs.focusMargin; planState().prefs.focusMargin = 0; focusOnTask(id, 4); }, t3); await p.waitForTimeout(300);
  await fwd(5 * 60 * 1000);
  const ot = await p.evaluate(() => { const s = FocusTimer.state(); return {running: s.running, phase: s.phase, ot: Math.round(s.overtime / 10) * 10, mode: s.mode, time: (document.querySelector('.fp-time') || {}).textContent}; });
  yes('the countdown ran out and the clock carried on, as a sitting still on its task', ot.running && ot.phase === 'focus' && ot.ot >= 50 && ot.ot <= 70, ot);
  yes('the dial reads "+" and the overtime', /^\+0\d:\d\d$/.test(ot.time || ''), ot.time);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(n => n.remove()); });
  await fwd(2 * 60 * 1000);
  await p.evaluate(() => { FocusTimer.pause(); }); await fwd(30 * 1000); await p.evaluate(() => { FocusTimer.start(); });
  is('a pause and a resume in overtime carry on, they do not start the countdown again', await p.evaluate(() => { const s = FocusTimer.state(); return [s.phase, s.overtime > 150 && s.overtime < 240, s.mode]; }), ['focus', true, 'stopwatch']);
  await p.evaluate(() => { FocusTimer.stop(true); });
  const rec3 = await p.evaluate(() => { const r = planState().focusSessions[0]; return [r.planned, Math.round(r.duration), r.mode]; });
  is('the record holds the plan and what it really took, counted against the estimate', rec3, [4, 7, 'countdown']);
  is('the task\'s focus time is the whole of it', await p.evaluate(id => planTaskById(id).focusTime, t3), 7);

  console.log('\n4. the soft chime');
  await clean();
  await p.evaluate(() => { planState().dxFlash = false; planState().prefs.softChime = true; FocusTimer.reset(); FocusTimer.setMode('stopwatch'); FocusTimer.start(null, 'focus'); });
  await fwd(31 * 60 * 1000);
  const ch = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()));
  yes('at thirty minutes it says so and offers a short break', ch.some(t => /30 minutes in/.test(t) && /take one/.test(t)), ch);
  await p.evaluate(() => { [...document.querySelectorAll('.toast-act')].find(b => /take one/.test(b.textContent)).click(); });
  is('and "take one" pauses into a break', await p.evaluate(() => FocusTimer.state().onBreak), true);
  await p.evaluate(() => { FocusTimer.stop(true); planState().prefs.softChime = false; FocusTimer.setMode('countdown'); });
  await p.evaluate(() => { document.getElementById('fzClose')?.remove(); });

  console.log('\n5. every third sitting on a skill');
  await clean();
  await p.evaluate(() => { planState().dxFlash = false; });
  const t5 = await mkTask({text: 'Practise the essay', mins: 30, skill});
  const sit = async () => { await p.evaluate(id => { FocusTimer.reset(); FocusTimer.setMode('stopwatch'); FocusTimer.setTask(id); FocusTimer.start(); }, t5);
    await fwd(3 * 60 * 1000); await p.evaluate(() => FocusTimer.stop(true)); await p.waitForTimeout(1200);
    await p.evaluate(() => { const c = document.getElementById('fzClose'); if(c) c.querySelector('[data-pcskip]').click(); }); await p.waitForTimeout(900); };
  await sit(); await sit();
  yes('after two there is no reflection', await p.evaluate(() => !document.getElementById('fzKolb')));
  await sit();
  const kc = await p.evaluate(() => { const c = document.getElementById('fzKolb'); return c && {n: c.querySelectorAll('textarea').length, t: c.querySelector('.dx-fc-h').textContent}; });
  yes('the third offers a reflection with its four questions', kc && kc.n === 4 && /3 sittings on/.test(kc.t), kc);
  await p.evaluate(() => { const c = document.getElementById('fzKolb'); c.querySelector('[data-kq="experience"]').value = 'three short sittings'; c.querySelector('[data-kq="rule"]').value = 'start with the objection'; c.querySelector('[data-kdone]').click(); });
  await p.waitForTimeout(500);
  const en = await p.evaluate(sk => { const e = S.entries.find(x => (x.tags || []).includes('kolb')); return e && {type: e.type, skills: e.links.skills, body: /three short sittings/.test(e.body) && /start with the objection/.test(e.body)}; }, skill);
  is('it is filed as a reflection on the skill', en, {type: 'reflection', skills: [skill], body: true});
  await sit(); await sit();
  yes('and two more sittings do not ask again', await p.evaluate(() => !document.getElementById('fzKolb')));
  await sit();
  yes('the sixth does', await p.evaluate(() => !!document.getElementById('fzKolb')));
  await p.evaluate(() => { document.getElementById('fzKolb').querySelector('[data-kskip]').click(); });
  is('and "not now" is recorded as skipped', await p.evaluate(sk => Object.values(planState().kolb).map(k => !!k.skipped || !!k.done), skill), [true]);

  console.log('\n6. settings, and kept across a reload');
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForTimeout(800);
  const st = await p.evaluate(() => ({on: !!document.getElementById('sPfOn'), m: (document.getElementById('sPfMargin') || {}).value, chime: !!document.getElementById('sPfChime'), stake: !!document.getElementById('sPfStake')}));
  is('the clock settings carry the card, the margin, the chime, the list and the stake', st, {on: true, m: '25', chime: true, stake: true});
  await p.evaluate(() => { planState().preflight.env = [{id: 'e1', label: 'water', ticked: true}]; planState().prefs.focusMargin = 30; saveNow(); });
  await p.evaluate(async () => { await saveNow(); await flushSave(); });
  await p.reload(); await p.waitForTimeout(2500);
  is('the list, its tick and the margin survive', await p.evaluate(() => [fzState().env.map(e => [e.label, e.ticked]), fzMarginPct()]), [[['water', true]], 30]);

  console.log('\n7. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
