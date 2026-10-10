/* smoke296 — Phase 9 of the execution overhaul: learning, goals, reviews and export.

   1. The new stores are in the saved state and survive a reload.
   2. Learned estimates: ten sittings behind a list replace the fixed margin; fewer
      do not; the category stands in for a thin list; off puts the fixed one back.
   3. Time intentions: four at most; progress; the rule when one is slipping or over;
      rings; suggestions with their reasons.
   4. Performance goals: one for the year, three and three; read in words by process;
      the persona line is offered to the self-image script; a sealed commitment.
   5. Reviews: the system review (due, in the queue, written once), the weekly
      small-gains step, the risk worksheet on a decision.
   6. Export: CSV, ICS, the week on a sheet.

   Run: NODE_PATH=node_modules node smoke296.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport: {width: 1300, height: 1400}});
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.clock.install({time: new Date('2026-06-10T15:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }

  await p.evaluate(() => {
    timeState(); S.timeEntries.length = 0; S.tasks.length = 0; S.timeBlocks = []; S.habits.length = 0; planState().focusSessions = []; planState().distractions = [];
    S.settings.wakeTime = '07:00'; S.settings.sleepTime = '23:00'; S.dailyRhythm = {}; S.wins = []; S.timeIntentions = []; S.perfGoals = []; S.plans = {}; S.promptState = {};
    const at = (day, hm) => { const d = parseDay(day), [h, m] = hm.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
    window.__at = at;
    window.__put = (day, hm, mins, o) => { const s = at(day, hm); logTime(Object.assign({startTime: s.toISOString(), endTime: new Date(s.getTime() + mins * 60000).toISOString()}, o)); };
  });

  console.log('1. the new stores');
  is('timeIntentions, perfGoals and sysReview are saved with the rest', await p.evaluate(() => [ARRAY_STORES.includes('timeIntentions'), ARRAY_STORES.includes('perfGoals'), META_KEYS.includes('sysReview'), DB_SCHEMA.timeIntentions != null, DB_SCHEMA.perfGoals != null]), [true, true, true, true, true]);
  yes('the database is at version 23 or later', (await p.evaluate(() => db.verno || 23)) >= 23);

  console.log('\n2. learned estimates');
  await p.evaluate(() => {
    const l = planNewList('Thesis'); window.__list = l.id;
    const mk = (title, est, focus, listId, cat) => { const t = newPlanTask(title, ''); t.listId = listId; t.duration = est; t.focusTime = focus; t.done = true; t.doneAt = today(); if(cat) t.timeCategory = cat; S.tasks.push(t); return t; };
    window.__mk = mk;
    for(let i = 0; i < 3; i++){ const t = mk('done ' + i, 30, 60, l.id); for(let k = 0; k < 3; k++) planState().focusSessions.push({id: uid(), taskId: t.id, startedAt: window.__at(addDays(today(), -i - 1), `0${8 + k}:00`).toISOString(), endedAt: window.__at(addDays(today(), -i - 1), `0${8 + k}:20`).toISOString(), duration: 20, type: 'focus', breaks: []}); }
    learnedReset();
  });
  is('nine sittings are not enough: no learned margin, the fixed quarter is used', await p.evaluate(() => { const t = newPlanTask('next', ''); t.listId = window.__list; t.duration = 40; return [learnedMargin(t), pbdPadded(40, t).marginMin]; }), [null, 10]);
  await p.evaluate(() => { const t = S.tasks[0]; planState().focusSessions.push({id: uid(), taskId: t.id, startedAt: window.__at(addDays(today(), -5), '10:00').toISOString(), endedAt: window.__at(addDays(today(), -5), '10:20').toISOString(), duration: 20, type: 'focus', breaks: []}); learnedReset(); });
  const L = await p.evaluate(() => { const t = newPlanTask('next', ''); t.listId = window.__list; t.duration = 40; const m = learnedMargin(t); return {frac: m && m.frac, from: m && m.from, n: m && m.n, margin: pbdPadded(40, t).marginMin, label: m && m.label}; });
  is('ten sittings: the list says tasks take twice their estimate, so the margin is a hundred per cent (capped), from the list', [L.frac, L.from, L.n, L.margin], [1, 'list', 10, 40]);
  yes('and says why in words', /200% of estimate over 10 sittings/.test(L.label), L.label);
  is('the countdown of a sitting uses it too (40m + 40m margin)', await p.evaluate(async () => { const t = newPlanTask('count', ''); t.listId = window.__list; t.duration = 40; S.tasks.push(t); focusOnTask(t.id, 40); const s = FocusTimer.state(); const r = [Math.round(s.planned / 60), s.margin]; FocusTimer.stop(true); FocusTimer.reset(); document.querySelectorAll('.dx-flashcard').forEach(n => n.remove()); return r; }), [80, 40]);
  is('a thin list leans on its category when the category has the evidence', await p.evaluate(() => {
    const l2 = planNewList('Other'); const cat = 'reading';
    for(let i = 0; i < 3; i++){ const t = window.__mk('c' + i, 20, 30, l2.id, cat); for(let k = 0; k < 4; k++) planState().focusSessions.push({id: uid(), taskId: t.id, startedAt: window.__at(addDays(today(), -i - 2), `1${k}:00`).toISOString(), endedAt: window.__at(addDays(today(), -i - 2), `1${k}:10`).toISOString(), duration: 10, type: 'focus', breaks: []}); }
    learnedReset(); const t = newPlanTask('x', ''); t.listId = 'inbox'; t.timeCategory = cat; t.duration = 20; const m = learnedMargin(t); return [m && m.from, m && Math.round(m.frac * 100)]; }), ['category', 50]);
  is('turned off, the fixed margin comes back', await p.evaluate(() => { (planState().prefs = planState().prefs || {}).learnMargin = false; learnedReset(); const t = newPlanTask('x', ''); t.listId = window.__list; t.duration = 40; const r = [learnedMargin(t), pbdPadded(40, t).marginMin]; planState().prefs.learnMargin = true; learnedReset(); return r; }), [null, 10]);
  yes('Settings shows the table with the count behind each', await p.evaluate(() => { const h = learnedSettingsHTML(); return /Thesis/.test(h) && /10 sittings/.test(h) && /margin 100%/.test(h); }));
  yes('and the weekly review gets a planning-accuracy line', await p.evaluate(() => /Planning accuracy: 0 of 6 finished tasks took within a quarter/.test(learnedAccuracyLine(weekStart(today()), addDays(weekStart(today()), 6)))), await p.evaluate(() => learnedAccuracyLine(weekStart(today()), addDays(weekStart(today()), 6))));

  console.log('\n3. time intentions');
  await p.evaluate(() => { for(let i = 0; i < 3; i++) window.__put(addDays(weekStart(today()), i), '09:00', 60, {what: 'scales', categoryId: 'piano'}); window.__put(today(), '12:00', 90, {what: 'the report', categoryId: 'work'}); });
  const I = await p.evaluate(() => {
    const a = timeIntentionAdd({targetType: 'category', targetId: 'piano', direction: 'min', amountMin: 900, period: 'week'});
    const b = timeIntentionAdd({targetType: 'category', targetId: 'work', direction: 'max', amountMin: 100, period: 'week'});
    const c = timeIntentionAdd({targetType: 'category', targetId: 'exercise', direction: 'min', amountMin: 60, period: 'day'});
    const d = timeIntentionAdd({targetType: 'category', targetId: 'reading', direction: 'min', amountMin: 60, period: 'week'});
    const e = timeIntentionAdd({targetType: 'category', targetId: 'meal', direction: 'min', amountMin: 60, period: 'week'});
    return {fifth: e, n: timeIntentionsActive().length, pa: Math.round(timeIntentionProgress(a).mins), pb: Math.round(timeIntentionProgress(b).mins), ra: timeIntentionRisk(a), rb: timeIntentionRisk(b), rc: timeIntentionRisk(c)};
  });
  is('four at most: the fifth is refused', [I.fifth, I.n], [null, 4]);
  is('progress is the time that fell under it, this week', [I.pa, I.pb], [180, 90]);
  yes('a floor falling behind says so, with the pace it needs (day 3 of 7: 3h of 15h, an even pace is 6h 26m)', I.ra && /behind/.test(I.ra.msg) && /day 3 of 7/.test(I.ra.rule) && /3h/.test(I.ra.rule) && /6h 26m|6h26m/.test(I.ra.rule), I.ra);
  yes('a ceiling near its limit says so at four fifths (1h30 of 1h40)', I.rb && /close to its limit/.test(I.rb.msg), I.rb);
  is('a daily floor is quiet until six in the evening, and then under half raises it (it is 15:00)', I.rc, null);
  const q = await p.evaluate(() => { S.promptState = {}; return promptQueue(today()).filter(x => x.id.startsWith('intent:')).map(x => [x.msg, !!x.rule]); });
  is('the flags reach the queue, each with its rule (the floor, the ceiling, and the reading that had nothing)', q.map(x => x[1]), [true, true, true]);
  yes('the flags are on the Time view’s attention strip too', await p.evaluate(() => timeAttentionItems().some(x => x.id.startsWith('intent:'))));
  yes('rings are drawn for the active ones on the glance', await p.evaluate(() => (timeGlanceHTML(timeRange('week'), null).match(/tmv-ring"/g) || []).length === 4));
  const sg = await p.evaluate(() => { timeIntentions().length = 0; const l = planList(window.__list); l.targetHoursPerWeek = 5;
    S.habits.push(habDefaults({id: 'hs', name: 'Scales', negative: false, countsAs: {type: 'category', id: 'piano'}, thresholdMin: 20, countsState: 'confirmed', freq: {type: 'daily', days: [], count: 1}, links: {values: [], skills: []}, order: 1, created: today()}));
    return timeIntentionSuggestions().map(s => [s.targetType, s.targetId === window.__list ? 'list' : s.targetId, s.amountMin, s.period, /hours a week|counts at/.test(s.reason)]); });
  is('suggestions come with reasons: a list’s hours a week, a habit’s minutes', sg, [['list', 'list', 300, 'week', true], ['category', 'piano', 20, 'day', true]]);
  await p.evaluate(() => { S.settings.todayView = 'time'; location.hash = '#/today/time/goals'; rerender(); }); await p.waitForTimeout(900);
  yes('the page lists the suggestions and offers to take them', await p.evaluate(() => document.querySelectorAll('[data-tmi-sug]').length === 2 && !!document.querySelector('#tmiNew')));
  await p.evaluate(() => document.querySelector('[data-tmi-sug]').click()); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#tiSave').click()); await p.waitForTimeout(500);
  is('taking one opens it filled in; saving adds it', await p.evaluate(() => [timeIntentionsActive().length, timeIntentions()[0].targetType, timeIntentions()[0].amountMin]), [1, 'list', 300]);

  console.log('\n4. performance goals');
  const G = await p.evaluate(() => {
    const mk = (lvl, t) => { const g = perfNormalize({level: lvl, title: t, persona: 'I am someone who begins when it is time.', signals: ['delay', 'topTwo', 'planFull'], targets: {delay: 5}}); perfGoals().push(g); return g; };
    const y = mk('year', 'Work calmly'); const m1 = mk('month', 'Begin on time'); mk('month', 'two'); mk('month', 'three'); mk('fortnight', 'f1');
    return {year: perfActive('year').length, month: perfActive('month').length, canMonth: perfActive('month').length < PERF_LEVELS.month.max, id: m1.id, yid: y.id}; });
  is('one for the year, three for thirty days', [G.year, G.month, G.canMonth], [1, 3, false]);
  await p.evaluate(() => { const g = perfGoals().find(x => x.title === 'Begin on time'); g.startDate = addDays(today(), -3);
    const mkBlock = (d, hm, delay, id) => { const t = newPlanTask('t' + id, ''); S.tasks.push(t); pbdAddBlock(d, {ref: {type: 'task', id: t.id}, start: hm, durationMin: 30}); planState().focusSessions.push({id: uid(), taskId: t.id, startedAt: window.__at(d, `${hm.slice(0, 2)}:${String(delay).padStart(2, '0')}`).toISOString(), endedAt: window.__at(d, `${hm.slice(0, 2)}:30`).toISOString(), duration: 20, type: 'focus', breaks: []}); };
    for(let i = 0; i < 4; i++) mkBlock(addDays(today(), -20 + i), '09:00', 12, 'a' + i);
    for(let i = 0; i < 4; i++) mkBlock(addDays(today(), -4 + i), '09:00', 3, 'b' + i);
    mkBlock('2026-06-01', '09:00', 12, 'c0'); mkBlock('2026-06-02', '09:00', 12, 'c1'); });
  const R = await p.evaluate(() => { const g = perfGoals().find(x => x.title === 'Begin on time'); return perfReading(g).map(r => [r.sig.id, r.now && Math.round(r.now.value), r.before && Math.round(r.before.value), r.dir, r.within]); });
  is('start delay is read in words: 3m now, 11m when it began, better, within the aim of 5', R.find(x => x[0] === 'delay'), ['delay', 3, 11, 'better', true]);
  yes('and never in hours', await p.evaluate(() => !/hour|\bh\b/.test(timeGoalsHTML().match(/tmg-sigs[\s\S]*?<\/div><\/div>/)[0].replace(/an hour/g, ''))));
  yes('the Morning Theatre offers the persona line, and adds it only when pressed', await p.evaluate(() => { S.rehearsal.script = 'I am calm.'; const h = perfPersonaOfferHTML(); const before = /data-persona-add/.test(h) && !S.rehearsal.script.includes('begins when it is time');
    const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d); d.querySelector('[data-persona-add]').click(); d.remove(); return before && S.rehearsal.script.includes('I am someone who begins when it is time.'); }));
  yes('once added, it is not offered again', await p.evaluate(() => !/data-persona-add/.test(perfPersonaOfferHTML())));
  const seal = await p.evaluate(() => { const g = perfGoals().find(x => x.title === 'Begin on time'); openPerfCommitment(g.id); document.querySelector('#pcSeal').click(); const e = S.entries.find(x => x.id === g.letterId);
    return {sealed: !!e && e.extra.sealedUntil === g.endDate, goal: e && e.extra.goalId === g.id, hidden: e && letterIsSealed(e)}; });
  is('a commitment is a letter sealed until the goal ends, linked both ways', seal, {sealed: true, goal: true, hidden: true});

  console.log('\n5. reviews');
  is('a system review is not due until there are two weeks to read, then is, then is not after it is made', await p.evaluate(() => {
    const out = []; S.sysReview = undefined; window.__keepSess = planState().focusSessions; planState().focusSessions = [];
    out.push(!!sysReviewDue(today()));
    planState().focusSessions.push({id: 'f1', taskId: null, startedAt: window.__at(addDays(today(), -20), '09:00').toISOString(), endedAt: window.__at(addDays(today(), -20), '09:30').toISOString(), duration: 30, type: 'focus', breaks: []});
    out.push(!!sysReviewDue(today())); sysState().last = addDays(today(), -3); out.push(!!sysReviewDue(today())); sysState().last = addDays(today(), -15); out.push(!!sysReviewDue(today())); return out; }), [false, true, false, true]);
  const sq = await p.evaluate(() => { S.promptState = {}; const it = promptQueue(today()).find(x => x.id.startsWith('sysreview')); return it && [it.msg, /15 days ago/.test(it.rule)]; });
  is('it is in the queue, with its rule', sq, ['The system review is due.', true]);
  await p.evaluate(() => openSystemReview()); await p.waitForTimeout(600);
  const steps = [];
  for(let i = 0; i < 6 && await p.$('#fwNext'); i++){
    steps.push(await p.evaluate(() => document.querySelector('.modal h2').textContent.trim()));
    if(i === 1) await p.fill('#sysNew', 'phone in the other room');
    if(i === 3) await p.fill('#sysNote', 'keep the card, drop the chime');
    const last = (await p.evaluate(() => document.querySelector('#fwNext').textContent.trim())) === 'Close the review';
    await p.click('#fwNext'); await p.waitForTimeout(400); if(last) break;
  }
  is('four steps: what changed, the experiments, the techniques, what you make of it', steps, ['What changed.', 'The experiments you are running.', 'The techniques still in use.', 'What you make of it.']);
  const sr = await p.evaluate(() => { const s = sysState(); return {last: s.last, ex: s.experiments.map(x => x.text), log: s.log.length, note: s.log[0] && s.log[0].note, tech: s.log[0] && s.log[0].techniques.length}; });
  is('written once, with the experiment begun and the note kept', sr, {last: '2026-06-10', ex: ['phone in the other room'], log: 1, note: 'keep the card, drop the chime', tech: 8});
  is('and it leaves the queue', await p.evaluate(() => !promptQueue(today()).some(x => x.id.startsWith('sysreview'))), true);
  const mg = await p.evaluate(() => {
    planState().focusSessions = window.__keepSess.concat(planState().focusSessions);
    const from = weekStart(today()), to = addDays(from, 6); window.__dbg = JSON.stringify([from, timeFocusQuality(from, to).delay, timeFocusQuality(addDays(from, -7), addDays(from, -1)).delay, S.timeBlocks.length]);
    const q = (S.reviews.marginal = S.reviews.marginal || {});
    const tmp = document.createElement('div'); tmp.innerHTML = marginalStepHTML(from, to); document.body.appendChild(tmp);
    const boxes = tmp.querySelectorAll('[data-mg]'); if(boxes[0]) boxes[0].checked = true; tmp.querySelector('#mgNote').value = 'closed the laptop at six';
    marginalStepSave(tmp, from); tmp.remove(); const s = q[weekStart(from)]; return {gains: boxes.length, noticed: s.noticed.length, note: s.note, dbg: window.__dbg}; });
  yes('the weekly step offers what the rules saw (the delay fell), and keeps what was ticked and the line added', mg.gains >= 1 && mg.noticed >= 1 && mg.note === 'closed the laptop at six', mg);
  const dr = await p.evaluate(() => { openDecisionModal(); const m = document.querySelector('.modal'); m.querySelector('#dTitle').value = 'Take the contract';
    m.querySelector('[data-dr="wrong"]').value = 'It eats the mornings'; m.querySelector('[data-dr="likely"]').value = 'possible'; m.querySelector('#dSave').click();
    const e = S.entries.filter(x => x.type === 'decision').pop(); return {risk: e.extra.risk, shown: /It eats the mornings/.test(decisionRiskShow(e.extra))}; });
  is('a decision can carry a risk worksheet, kept and shown with it', dr, {risk: {wrong: 'It eats the mornings', likely: 'possible'}, shown: true});
  yes('a decision with no risk written has none', await p.evaluate(() => { openDecisionModal(); const m = document.querySelector('.modal'); m.querySelector('#dTitle').value = 'Plain'; m.querySelector('#dSave').click(); return S.entries.filter(x => x.type === 'decision').pop().extra.risk === undefined; }));

  console.log('\n6. export');
  const ex = await p.evaluate(() => {
    window.__put(today(), '16:00', 20, {what: 'a "quoted", thing', categoryId: 'work', tags: ['x']});
    const t = newPlanTask('Write, then "send"', ''); t.day = addDays(today(), 3); t.doDay = addDays(today(), 1); t.duration = 45; S.tasks.push(t);
    pbdAddBlock(today(), {ref: {type: 'task', id: t.id}, start: '10:30', durationMin: 60});
    const csv = exportTimeCSV().split('\r\n'), tcsv = exportTasksCSV(), ics = exportICSText(), hab = exportHabitsCSV();
    return {head: csv[0], quoted: csv.some(r => r.includes('"a ""quoted"", thing"')), tq: tcsv.includes('"Write, then ""send"""'), thead: tcsv.split('\r\n')[0], hhead: hab.split('\r\n')[0],
      vev: (ics.match(/BEGIN:VEVENT/g) || []).length, block: /DTSTART:20260610T103000/.test(ics) && /DTEND:20260610T113000/.test(ics), dated: /DTSTART;VALUE=DATE:20260613/.test(ics) && /DTSTART;VALUE=DATE:20260611/.test(ics), crlf: ics.includes('\r\n') && ics.startsWith('BEGIN:VCALENDAR'), fold: ics.split('\r\n').every(l => l.length <= 75)}; });
  is('time CSV has its columns and quotes what needs it', [ex.head.split(',').length, ex.quoted], [15, true]);
  yes('tasks CSV quotes commas and quotes', ex.tq && /^id,title,list,done/.test(ex.thead), ex.thead);
  yes('habits CSV has its header', /^habit,date,level/.test(ex.hhead));
  yes('ICS holds the block at its hour and the task as a do-day and a due day, in valid lines', ex.block && ex.dated && ex.crlf && ex.fold && ex.vev >= 3, ex);
  const pw = await p.evaluate(() => { const h = printWeekHTML(today()); return {days: (h.match(/class="pw-day"/g) || []).length, block: /Write, then &quot;send&quot;|Write, then "send"/.test(h) && /10:30/.test(h)}; });
  is('the week on a sheet: seven days, with the block at its hour', pw, {days: 7, block: true});
  const dl = await Promise.all([p.waitForEvent('download'), p.evaluate(() => { exportRun('time'); })]);
  yes('the download is a file named for the day', /^2026-06-10-time-entries\.csv$/.test(dl[0].suggestedFilename()), dl[0].suggestedFilename());
  yes('Settings has the export card', await p.evaluate(() => /Take it with you/.test(exportSettingsHTML())));

  console.log('\nand it all survives a reload');
  await p.evaluate(() => saveNow()); await p.waitForTimeout(600);
  const kept = await p.evaluate(async () => { await saveNow(); return {i: timeIntentions().length, g: perfGoals().length, s: sysState().log.length}; });
  await p.reload(); await p.waitForTimeout(2500);
  const after = await p.evaluate(() => ({i: (S.timeIntentions || []).length, g: (S.perfGoals || []).length, s: ((S.sysReview || {}).log || []).length}));
  is('intentions, goals and the system review are back', after, kept);
  yes('no page errors', !errs.length, errs.join('\n'));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall ok');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
