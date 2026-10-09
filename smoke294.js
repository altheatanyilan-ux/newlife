/* smoke294 — Phase 7 of the execution overhaul: one prompt queue.

   1. Duties, nudges, reminders, the block prompts and review chips are one
      ranked queue on Today; five show, the rest are a count.
   2. Every row says the rule that raised it.
   3. The same three exits on every kind: later (30 min), not today, off —
      and an off kind comes back in Settings.
   4. Dismissals last the period only (a day, or the week for the weekly ones).
   5. The missing nudges: tomorrow unplanned, a habit near a milestone, a
      milestone overdue, a person named in a time label.
   6. The flags, each with its rule: unlabelled time, estimate drift, break
      overruns rising, top two missed three days, protected time used, a
      skill in focus with no hours, a reflection put off.
   7. A habit with a time of day sends a browser notification, once.

   Run: NODE_PATH=node_modules node smoke294.js */
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
  await p.clock.install({time: new Date('2026-06-10T19:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const reset = () => p.evaluate(() => { closeModals(); document.querySelectorAll('.toast').forEach(n => n.remove());
    S.tasks.length = 0; S.timeEntries.length = 0; S.timeBlocks = []; S.habits.length = 0; S.plans = {}; S.people.length = 0; S.interactions.length = 0;
    S.skills.length = 0; S.promptState = {}; S.settings.nudgeDisabled = {}; S.settings.trackingNudgeMinutes = 0; S.settings.todayView = 'do';
    planState().focusSessions = []; planState().kolb = {}; dayPlan(addDays(today(), 1)).planned = true; });
  const ids = () => p.evaluate(() => promptQueue(today()).map(x => x.id));
  const item = id => p.evaluate(id => promptQueue(today()).find(x => x.id === id || x.id.startsWith(id + ':')) || null, id).then(x => x && {id: x.id, msg: x.msg, rule: x.rule});
  await reset();

  console.log('\n1. the missing nudges, each with its rule');
  await p.evaluate(() => { dayPlan(addDays(today(), 1)).planned = false; dayPlan(addDays(today(), 1)).intentions = ['', '', '']; });
  let r = await item('tomorrow-unplanned');
  yes('after 18:00 with nothing written for tomorrow: "Tomorrow has no plan yet", with its rule', r && /no plan/.test(r.msg) && /18:00/.test(r.rule), r);
  await p.evaluate(() => { dayPlan(addDays(today(), 1)).intentions = ['write the chapter', '', '']; });
  is('written intentions put it away', (await ids()).includes('tomorrow-unplanned'), false);

  await p.evaluate(() => { const h = habDefaults({id: 'hm', name: 'Stretch', negative: false, freq: {type: 'daily', days: [], count: 1}, links: {values: [], skills: []}, order: 1, created: addDays(today(), -40)});
    h.milestones = [{days: 21}, {days: 30}]; S.habits.push(h);
    for(let i = 1; i <= 19; i++){ const d = addDays(today(), -i); S.habitLog[d] = S.habitLog[d] || {}; S.habitLog[d]['hm'] = {level: 'full', status: 'completed'}; }
    S.habitLog[today()] = S.habitLog[today()] || {}; S.habitLog[today()]['hm'] = {level: 'full', status: 'completed'}; });
  r = await item('hab-mile');
  yes('a habit a day from its 21-day mark is named, with the count', r && /1 day to Stretch/.test(r.msg) && /20 of 21/.test(r.rule), r);

  await p.evaluate(() => { const l = planNewList('The thesis'); planAddMilestone(l.id, {name: 'First draft in', date: addDays(today(), -2)}); });
  r = await item('ms');
  yes('a milestone whose date went by is flagged overdue, with its rule', r && /First draft in/.test(r.msg) && /overdue/.test(r.msg) && /not marked/.test(r.rule), r);

  await p.evaluate(() => { S.people.push({id: 'pm', name: 'Maya Lin', created: today()});
    logTime({what: 'Coffee with Maya', categoryId: 'work', startTime: new Date(Date.now() - 3 * 3600000).toISOString(), endTime: new Date(Date.now() - 2 * 3600000).toISOString()}); });
  r = await item('person');
  yes('a person named in a time label with nothing logged: "Log an interaction with Maya Lin?"', r && /Maya Lin/.test(r.msg) && /Coffee with Maya/.test(r.rule), r);
  await p.evaluate(() => { S.interactions.push({id: uid(), personId: 'pm', date: today(), kind: 'met', note: ''}); });
  is('and an interaction logged since puts it away', (await ids()).some(x => x.startsWith('person:')), false);
  await reset();

  console.log('\n2. the flags, each with its rule');
  /* unlabelled time */
  await p.evaluate(() => { logTime({what: '', categoryId: 'work', startTime: new Date(Date.now() - 50 * 3600000).toISOString(), endTime: new Date(Date.now() - 49 * 3600000).toISOString()}); });
  r = await item('unlabelled');
  yes('an entry with no words over a day old: "1 stretch of time with no label", fixed inline by the button', r && /no label/.test(r.msg) && /over a day old/.test(r.rule), r);
  /* drift */
  await p.evaluate(() => { for(let i = 0; i < 3; i++){ const t = newPlanTask('long ' + i, '', {duration: 20}); t.done = true; t.doneAt = new Date().toISOString(); t.focusTime = 45; S.tasks.push(t); } });
  r = await item('drift');
  yes('tasks finished above 150% of their estimate: counted, with the first as the example', r && /3 tasks/.test(r.msg) && /150%/.test(r.rule), r);
  /* break overruns rising */
  await p.evaluate(() => { const mk = (n) => ({type: 'focus', startedAt: new Date(Date.now() - (5 - n) * 3600000).toISOString(), endedAt: new Date(Date.now() - (5 - n) * 3600000 + 1800000).toISOString(),
      breaks: [{from: new Date(Date.now() - (5 - n) * 3600000 + 600000).toISOString(), to: new Date(Date.now() - (5 - n) * 3600000 + 600000 + (n + 1) * 2 * 60000).toISOString(), overrun: true}]});
    planState().focusSessions = [mk(1), mk(2), mk(3)]; });
  r = await item('overruns');
  yes('three sittings with a longer overrun each time: the numbers are in the rule', r && /Breaks are running over/.test(r.msg) && /4m → 6m → 8m/.test(r.rule), r);
  /* top two missed */
  await p.evaluate(() => { const t1 = newPlanTask('A', ''), t2 = newPlanTask('B', ''); S.tasks.push(t1, t2);
    for(let i = 1; i <= 3; i++){ const pl = dayPlan(addDays(today(), -i)); pl.intentionRefs = [{type: 'task', id: t1.id}, {type: 'task', id: t2.id}, null]; pl.intentions = ['A', 'B', '']; } });
  r = await item('top-two-missed');
  yes('the top two undone three days running', r && /three days running/.test(r.msg) && /last three days/.test(r.rule), r);
  /* protected block used */
  await p.evaluate(() => { pbdAddBlock(today(), {kind: 'protect', label: 'Deep work', start: '08:00', durationMin: 120});
    const s = new Date(); s.setHours(8, 30, 0, 0); logTime({what: 'Email', categoryId: 'work', startTime: s.toISOString(), endTime: new Date(s.getTime() + 45 * 60000).toISOString()}); });
  r = await item('protect-used');
  yes('something else ran inside protected time: named, with the hours', r && /Deep work/.test(r.msg) && /Email/.test(r.rule) && /08:00/.test(r.rule), r);
  /* skill in focus with no hours */
  await p.evaluate(() => { S.skills.push({id: 'sk1', name: 'Counterpoint', horizon: 'focus', created: addDays(today(), -60)}); });
  r = await item('skill-idle');
  yes('a skill in focus with no hours in seven days', r && /Counterpoint/.test(r.msg) && /seven days/.test(r.rule), r);
  /* reflection put off */
  await p.evaluate(() => { planState().kolb = {'skill:sk1': {skipped: true}}; });
  r = await item('kolb');
  yes('a reflection put off is raised, with why', r && /put off/.test(r.msg) && /skipped/.test(r.rule), r);

  console.log('\n3. the queue: ranked, five at a time, every row says why');
  const q = await p.evaluate(() => { const box = document.createElement('div'); document.body.appendChild(box); box.innerHTML = pqHTML(today());
    const rows = [...box.querySelectorAll('.pq-row')]; const out = {rows: rows.length, n: +box.querySelector('.pq-n').textContent, more: (box.querySelector('.pq-more') || {}).textContent || '',
      allRules: rows.every(x => (x.querySelector('.pq-rule') || {}).textContent.length > 8), exits: rows.every(x => x.querySelector('[data-pqlater]') && x.querySelector('[data-pqnot]') && x.querySelector('[data-pqoff]'))};
    box.remove(); return out; });
  yes('five rows at most, the rest a count', q.rows === 5 && q.n >= 9 && /more/.test(q.more), q);
  yes('each row carries its rule, and the same three exits', q.allRules && q.exits, q);
  const order = await p.evaluate(() => promptQueue(today()).map(x => x.rank));
  yes('ranked: lower rank first', order.every((x, i) => !i || order[i - 1] <= x), order);

  console.log('\n4. the same three exits, for every kind');
  for(const id of ['drift', 'overruns', 'unlabelled']){
    await p.evaluate(id => { const it = promptQueue(today()).find(x => x.id === id); pqLater(it); }, id);
    yes(`${id}: later hides it for thirty minutes`, !(await ids()).includes(id));
    await p.clock.fastForward(31 * 60 * 1000);
    yes(`${id}: and it returns after them`, (await ids()).includes(id));
  }
  await p.evaluate(() => { pqNotToday(promptQueue(today()).find(x => x.id === 'top-two-missed')); });
  yes('not today hides a daily one…', !(await ids()).includes('top-two-missed'));
  await p.clock.setSystemTime(new Date('2026-06-11T19:00:00'));
  await p.evaluate(() => { for(let i = 1; i <= 3; i++){ const pl = dayPlan(addDays(today(), -i)); const ex = dayPlan(addDays(today(), -4)); pl.intentionRefs = ex.intentionRefs || pl.intentionRefs; } });
  yes('…and only for the day: it is raised again the next day if still true', (await ids()).includes('top-two-missed'), await ids());
  await p.evaluate(() => { pqNotToday(promptQueue(today()).find(x => x.id === 'drift')); });
  await p.clock.setSystemTime(new Date('2026-06-12T19:00:00'));
  yes('a weekly one skipped stays skipped through the week', !(await ids()).includes('drift'));
  await p.clock.setSystemTime(new Date('2026-06-17T19:00:00'));
  yes('and comes back in the next', await p.evaluate(() => pqState().skip.drift !== 'w' + weekStart(today())));
  await p.clock.setSystemTime(new Date('2026-06-10T19:00:00'));
  await p.evaluate(() => { pqState().snooze = {}; });
  await p.evaluate(() => { pqOff(promptQueue(today()).find(x => x.id === 'overruns')); });
  yes('off stops raising it', !(await ids()).includes('overruns'));
  await p.evaluate(() => { pqOn('overruns'); });
  yes('and Settings → Prompts turns it back on', (await ids()).includes('overruns'));
  await p.evaluate(() => { pqState().off['skill-idle'] = true; });
  yes('turning off a kind in Settings stops every item of it (skill-idle:sk1)', !(await ids()).some(x => x.startsWith('skill-idle')));
  const set = await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = pqSettingsHTML(); return {rows: d.querySelectorAll('[data-pqtog]').length, off: d.querySelector('[data-pqtog="skill-idle"]').classList.contains('on')}; });
  is('Settings lists the kinds, with the turned-off one shown off', set, {rows: 15, off: false});
  await reset();

  console.log('\n5. Today: one place, with a count; the old banners are gone');
  await p.evaluate(() => { logTime({what: '', categoryId: 'work', startTime: new Date(Date.now() - 50 * 3600000).toISOString(), endTime: new Date(Date.now() - 49 * 3600000).toISOString()});
    S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(900);
  const td = await p.evaluate(() => ({pq: !!document.querySelector('#todayAutoPrompts #pq'), n: (document.querySelector('#pq .pq-n') || {}).textContent, old: !!document.querySelector('.nudge-slot'), dd: !!document.querySelector('#ddPanel')}));
  yes('Today shows the one queue with its count, and neither the nudge slot nor the pending panel', td.pq && +td.n >= 1 && !td.old && !td.dd, td);
  await p.evaluate(() => { document.querySelector('#pq [data-pqnot]').click(); });
  await p.waitForTimeout(200);
  yes('"not today" on Today takes the row off at once', await p.evaluate(() => !document.querySelector('#pq .pq-row') || !/no label/.test(document.querySelector('#pq').textContent)));
  await reset();

  console.log('\n6. a habit block sends a notification, once');
  await p.evaluate(() => { window.__notes = []; window.Notification = function(t, o){ window.__notes.push([t, o && o.body]); }; window.Notification.permission = 'granted';
    S.habits.push(habDefaults({id: 'hn', name: 'Scales', at: 19, min: 'two minutes', negative: false, freq: {type: 'daily', days: [], count: 1}, links: {values: [], skills: []}, order: 1, created: addDays(today(), -5)})); });
  await p.evaluate(() => pqHabitNotify()); await p.evaluate(() => pqHabitNotify());
  is('at its hour: one notification, with the minimum', await p.evaluate(() => window.__notes), [['Scales', 'The minimum: two minutes']]);
  await p.evaluate(() => { window.__notes.length = 0; window.Notification.permission = 'denied'; pqState().sent = {}; pqHabitNotify(); });
  is('without permission: none', await p.evaluate(() => window.__notes.length), 0);

  console.log('\nbackup: promptState is in the saved keys');
  yes('S.promptState is persisted', await p.evaluate(() => META_KEYS.includes('promptState')));
  yes('no page errors', !errs.length, errs.join('\n'));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall ok');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
