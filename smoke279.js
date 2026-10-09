/* smoke279 — focus sittings and the time tracker say the same thing.

   The claims.

   ALWAYS COUNTED. A focus sitting goes to the time tracker as sittings of its
   own even with "walking into a room starts it" turned off — that switch is
   about rooms, and a sitting is started by hand. Starting one while another
   clock runs stops that clock first, and says so.

   ONE ACCOUNT. The sitting's record is written every minute it runs, and the
   tracker's entries for it are read off that record: one entry per unbroken
   stretch of work (a pause ends one), with exactly the record's times — and
   while it runs, the part under way is the tracker's live clock. The day's
   focus minutes and the tracker's focus minutes agree.

   ONE TASK A SITTING. Moving the clock to another task part-way through
   closes the sitting and opens the next, so each sitting, and each entry, is
   on the task it was spent on.

   A RELOAD LOSES NOTHING. A sitting running when the page went away carries
   on after it, on the same live clock — no second one. A countdown that ran
   out while the page was closed is written down as finished, ending when it
   ran out, and its entry in the tracker ends there too, not at the reload.

   YOUR WORD WINS. An entry corrected in the tracker is left as corrected; one
   deleted there is not put back.

   Run: NODE_PATH=node_modules node smoke279.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
const FILE = 'file://' + path.join(__dirname, 'index.html');

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];

  /* ---------- the live parts, on a controlled clock ---------- */
  const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.clock.install();
  await p.goto(FILE); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const calm = () => p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil, .dx-flashcard, .toast').forEach(n => n.remove()); });
  await calm();
  const ids = await p.evaluate(() => {
    const mk = n => { const t = newPlanTask(n, today(), {listId: 'inbox'}); S.tasks.push(t); return t.id; };
    S.planning.distractions = []; if(timeRunning()) stopTimer();
    return {a: mk('Chapter three'), b: mk('The index'), c: mk('Letters')};
  });
  const entriesFor = sit => p.evaluate(sit => S.timeEntries.filter(e => e.focusSit === sit)
    .sort((a, b) => a.startTime < b.startTime ? -1 : 1)
    .map(e => ({from: e.startTime, to: e.endTime, mins: Math.round(timeMinutes(e) * 10) / 10, task: e.linkedId, what: e.what, kind: e.kind})), sit);

  console.log('\n1. always counted, whatever the rooms do');
  await p.evaluate(id => { timeSettings().autoTrack = false; FocusTimer.reset(); FocusTimer.setMode('stopwatch'); FocusTimer.setTask(id); FocusTimer.start(); }, ids.a);
  await p.waitForTimeout(200);
  const sit1 = await p.evaluate(() => FocusTimer.state().startedAt);
  yes('with "walking into a room starts it" off, the sitting still has a live clock', await p.evaluate(sit => { const e = timeRunning(); return !!e && e.focusSit === sit && e.feature === 'focus'; }, sit1));
  await p.clock.fastForward('03:00'); await p.waitForTimeout(200);
  const rec3 = await p.evaluate(sit => { const r = planState().focusSessions.find(x => x.startedAt === sit); return r && r.duration; }, sit1);
  yes('the sitting\'s record is written as it runs, not only when it stops', rec3 === 3, rec3);

  console.log('\n2. one entry per unbroken stretch, on the record\'s own times');
  await p.evaluate(() => FocusTimer.pause()); await p.clock.fastForward('02:00');
  await p.evaluate(() => FocusTimer.start()); await p.clock.fastForward('04:00'); await p.waitForTimeout(200);
  await p.evaluate(() => FocusTimer.stop()); await p.waitForTimeout(300);
  const e1 = await entriesFor(sit1);
  const parts1 = await p.evaluate(sit => focusRecordParts(planState().focusSessions.find(x => x.startedAt === sit)).map(q => ({from: q.from, to: q.to})), sit1);
  const w1 = e1.filter(x => x.kind !== 'break');
  yes('two entries of work: the stretch before the pause and the one after it', w1.length === 2 && Math.abs(w1[0].mins - 3) < .05 && Math.abs(w1[1].mins - 4) < .05, e1);
  yes('  and the pause between them is its own entry, a break of two minutes', e1.length === 3 && e1[1].kind === 'break' && Math.abs(e1[1].mins - 2) < .05, e1);
  yes('  with exactly the record\'s times', JSON.stringify(e1.map(x => ({from: x.from, to: x.to}))) === JSON.stringify(parts1), {e1, parts1});
  yes('  the work on the task', w1.every(x => x.task === ids.a && x.what === 'Chapter three'));
  yes('  and no clock left running', await p.evaluate(() => !timeRunning()));

  console.log('\n3. another clock gives way');
  await p.evaluate(() => { startTimer({what: 'reading the paper', source: 'timer'}); });
  await p.clock.fastForward('05:00');
  await p.evaluate(id => { FocusTimer.setMode('stopwatch'); FocusTimer.setTask(id); FocusTimer.start(); }, ids.b);
  await p.waitForTimeout(300);
  const took = await p.evaluate(() => ({hand: S.timeEntries.find(e => e.what === 'reading the paper'), run: timeRunning(),
    toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' ')}));
  yes('starting a sitting stops the clock that was running, and says so', took.hand && took.hand.endTime && took.run && took.run.feature === 'focus'
    && /reading the paper.*stopped/.test(took.toast), took);
  await calm();

  console.log('\n4. one task a sitting');
  await p.clock.fastForward('05:00'); await p.waitForTimeout(100);
  const sitB = await p.evaluate(() => FocusTimer.state().startedAt);
  await p.evaluate(id => FocusTimer.setTask(id), ids.c); await p.waitForTimeout(200);
  const sitC = await p.evaluate(() => FocusTimer.state().startedAt);
  yes('moving the clock to another task closes this sitting and opens the next', sitC !== sitB && await p.evaluate(() => FocusTimer.state().running));
  await p.clock.fastForward('04:00'); await p.waitForTimeout(100);
  await p.evaluate(() => FocusTimer.stop()); await p.waitForTimeout(300);
  const rB = await p.evaluate(s => planState().focusSessions.find(x => x.startedAt === s), sitB);
  const rC = await p.evaluate(s => planState().focusSessions.find(x => x.startedAt === s), sitC);
  yes('  each sitting is on its own task', rB && rC && rB.taskId === ids.b && rC.taskId === ids.c && rB.duration === 5 && rC.duration === 4, {rB, rC});
  const eB = await entriesFor(sitB), eC = await entriesFor(sitC);
  yes('  and so is each entry in the tracker', eB.length === 1 && eB[0].task === ids.b && Math.abs(eB[0].mins - 5) < .05
    && eC.length === 1 && eC[0].task === ids.c && Math.abs(eC[0].mins - 4) < .05, {eB, eC});

  console.log('\n5. the day\'s two accounts agree');
  const agree = await p.evaluate(() => focusTimeAgreement(today()));
  yes('focus minutes on the records = focus minutes in the tracker', Math.abs(agree.worked - agree.tracked) < 0.1 && agree.worked >= 16, agree);

  console.log('\n6. your word wins');
  const fixed = await p.evaluate(sit => {
    const e = S.timeEntries.find(x => x.focusSit === sit);
    openTimeEntryModal(e.id);
    document.querySelector('#teTags').value = 'drafting';
    document.querySelector('#teSave').click();
    e.categoryId = null;       /* as corrected in the tracker */
    const end = e.endTime;
    timeSyncFocus(planState().focusSessions.find(x => x.startedAt === sit), {});
    return {edited: e.edited, kept: e.endTime === end && e.categoryId === null && e.tags.includes('drafting')};
  }, sitC);
  yes('an entry corrected in the tracker is left as corrected when the record is squared again', fixed.edited && fixed.kept, fixed);
  const gone = await p.evaluate(sit => {
    const e = S.timeEntries.find(x => x.focusSit === sit);
    openTimeEntryModal(e.id); document.querySelector('#teDel').click();
    timeSyncFocus(planState().focusSessions.find(x => x.startedAt === sit), {});
    return S.timeEntries.filter(x => x.focusSit === sit).length;
  }, sitB);
  yes('  and one deleted there is not put back', gone === 0, gone);
  await calm();

  /* ---------- a reload, for real, on the real clock ---------- */
  console.log('\n7. a reload loses nothing');
  const q = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  q.on('pageerror', e => errs.push('pageerror (reload): ' + e.message));
  await q.goto(FILE); await q.waitForTimeout(1500);
  if(await q.$('#frGo')){ await q.click('#frGo'); await q.waitForTimeout(1800); }
  await q.evaluate(() => { closeModals(); S.planning.distractions = []; if(timeRunning()) stopTimer(); });
  /* a stopwatch sitting six minutes in, with its live clock, as a page leaves them */
  const live = await q.evaluate(() => {
    const t = newPlanTask('The proofs', today(), {listId: 'inbox'}); S.tasks.push(t);
    FocusTimer.reset(); FocusTimer.setMode('stopwatch'); FocusTimer.setTask(t.id); FocusTimer.start();
    const s = planState().timerLive;
    const back = 6 * 60000;
    s.since -= back; s.startedAt = new Date(Date.parse(s.startedAt) - back).toISOString();
    const e = timeRunning(); e.startTime = s.startedAt; e.focusSit = s.startedAt; e.focusFrom = s.startedAt;
    saveNow();
    return {sit: s.startedAt, entry: e.id, task: t.id};
  });
  await q.waitForTimeout(1200);
  await q.reload(); await q.waitForTimeout(2200);
  const after = await q.evaluate(sit => { const s = FocusTimer.state(); const runs = S.timeEntries.filter(e => !e.endTime);
    return {running: s.running, same: s.startedAt === sit, mins: Math.round(s.elapsed / 60), runs: runs.map(e => ({id: e.id, sit: e.focusSit}))}; }, live.sit);
  yes('the sitting carries on after the reload, six minutes in', after.running && after.same && after.mins === 6, after);
  yes('  on the same live clock, and only one', after.runs.length === 1 && after.runs[0].id === live.entry, after.runs);
  await q.evaluate(() => FocusTimer.stop()); await q.waitForTimeout(400);
  const agr2 = await q.evaluate(() => focusTimeAgreement(today()));
  yes('  and when it stops, the two accounts still agree', Math.abs(agr2.worked - agr2.tracked) < 0.1, agr2);

  /* a 25-minute countdown that ran out ten minutes before the page came back */
  const gone2 = await q.evaluate(() => {
    planState().timer.focusDuration = 25;
    FocusTimer.reset(); FocusTimer.setMode('countdown'); FocusTimer.setLength(25); FocusTimer.start();
    const s = planState().timerLive;
    const back = 35 * 60000;
    s.since -= back; s.endsAt -= back; s.startedAt = new Date(Date.parse(s.startedAt) - back).toISOString();
    const e = timeRunning(); e.startTime = s.startedAt; e.focusSit = s.startedAt; e.focusFrom = s.startedAt;
    saveNow();
    return {sit: s.startedAt, ends: new Date(s.endsAt).toISOString()};
  });
  await q.waitForTimeout(1200);
  await q.reload(); await q.waitForTimeout(2400);
  const fin = await q.evaluate(g => { const r = planState().focusSessions.find(x => x.startedAt === g.sit);
    const es = S.timeEntries.filter(e => e.focusSit === g.sit);
    return {idle: FocusTimer.state().idle, rec: r && {dur: r.duration, done: r.completed, end: r.endedAt},
      entries: es.map(e => ({end: e.endTime, mins: Math.round(timeMinutes(e))})), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' ')}; }, gone2);
  yes('a countdown that ran out while closed is written down as finished, twenty-five minutes', fin.idle && fin.rec && fin.rec.dur === 25 && fin.rec.done === true, fin);
  yes('  ending when it ran out, not at the reload', fin.rec && Math.abs(Date.parse(fin.rec.end) - Date.parse(gone2.ends)) < 2000, {rec: fin.rec, ends: gone2.ends});
  yes('  and its entry in the tracker ends there too', fin.entries.length === 1 && Math.abs(Date.parse(fin.entries[0].end) - Date.parse(gone2.ends)) < 2000 && fin.entries[0].mins === 25, fin.entries);
  yes('  and it says so', /finished while the page was closed/.test(fin.toast), fin.toast);

  console.log('\n8. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
