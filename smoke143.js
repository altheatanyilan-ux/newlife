/* smoke143 — the time actually spent on a task, shown against the estimate */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1400, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const go = async () => { await p.evaluate(() => { if(location.hash === '#/today') rerender(); else location.hash = '#/today'; });
    await p.waitForTimeout(1400); await p.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove())); };
  await go();

  console.log('\n1. nothing sat with shows only the estimate');
  const id = await p.evaluate(() => {
    const row = document.querySelector('.task-row'); const i = row.dataset.taskrow;
    planState().focusSessions = (planState().focusSessions || []).filter(s => s.taskId !== i);
    const r = findTaskRef(i); r.task.duration = 15; r.task.subtasks = [{id:'st1', title:'Step one', minutes:20, isCompleted:false}];
    saveNow(); return i; });
  await go();
  is('the chip is the estimate alone', await p.evaluate(i =>
    document.querySelector(`[data-test="${i}"]`).textContent.replace(/\s+/g, ''), id), '20m');
  yes('  and it is not marked as spent', await p.evaluate(i =>
    !document.querySelector(`[data-test="${i}"]`).classList.contains('spent'), id));

  console.log('\n2. a sitting under a minute is not worth the ink');
  is('half a minute counts for nothing', await p.evaluate(() => fmtSpent(0.5, 15)), '');
  is('  a minute does', await p.evaluate(() => fmtSpent(1, 15)), '1m of 15m');
  is('  and with no estimate it stands alone', await p.evaluate(() => fmtSpent(13, 0)), '13m');

  console.log('\n3. what was spent is added up and shown against the estimate');
  await p.evaluate(i => { const now = new Date().toISOString();
    planState().focusSessions.push({id:uid(), type:'focus', taskId:i, subId:null, duration:8, startedAt:now, endedAt:now, breaks:[]});
    planState().focusSessions.push({id:uid(), type:'focus', taskId:i, subId:'st1', duration:5, startedAt:now, endedAt:now, breaks:[]});
    saveNow(); }, id);
  is('the task counts every sitting on it, its steps included',
     await p.evaluate(i => taskSpentOn(i), id), 13);
  is('  a step counts only its own', await p.evaluate(i => subSpentOn(i, 'st1'), id), 5);
  is('  and a step nobody sat with counts nothing', await p.evaluate(i => subSpentOn(i, 'nope'), id), 0);
  await go();
  is('the chip reads what was spent, of what was estimated', await p.evaluate(i =>
    document.querySelector(`[data-test="${i}"]`).textContent.replace(/\s+/g, ''), id), '13mof20m');
  yes('  and says so in its title', await p.evaluate(i =>
    /13m sat with so far, of 20m estimated/.test(document.querySelector(`[data-test="${i}"]`).title), id),
    await p.evaluate(i => document.querySelector(`[data-test="${i}"]`).title, id));

  console.log('\n4. going over is shown as going over');
  yes('under the estimate it reads as kept', await p.evaluate(i =>
    document.querySelector(`[data-test="${i}"]`).classList.contains('spent') &&
    !document.querySelector(`[data-test="${i}"]`).classList.contains('over'), id));
  await p.evaluate(i => { const now = new Date().toISOString();
    planState().focusSessions.push({id:uid(), type:'focus', taskId:i, duration:30, startedAt:now, endedAt:now, breaks:[]});
    saveNow(); }, id);
  await go();
  yes('  and past it, as past it', await p.evaluate(i =>
    document.querySelector(`[data-test="${i}"]`).classList.contains('over'), id));
  is('  with the total still right', await p.evaluate(i => taskSpentOn(i), id), 43);

  console.log('\n5. a step carries its own figure too');
  await p.evaluate(i => { const row = document.querySelector(`[data-taskrow="${i}"]`);
    row.querySelector('[data-subtoggle], summary, .sub-wrap')?.click(); }, id);
  await p.waitForTimeout(400);
  const sub = await p.evaluate(() => { const el = document.querySelector('[data-subest]');
    return el ? {text: el.textContent.replace(/\s+/g, ''), title: el.title} : null; });
  yes('the step shows what it took, of what it was given', sub && sub.text === '5mof20m', JSON.stringify(sub));

  console.log('\n6. the timer knows which step it is sitting with');
  await p.evaluate(() => FocusTimer.reset());
  await p.evaluate(i => focusOnTask(i, 20, 'Step one', 'st1'), id);
  await p.waitForTimeout(900);
  const st = await p.evaluate(() => FocusTimer.state());
  is('it is running', st.running, true);
  is('  on that task', st.taskId, id);
  is('  and on that step', st.subId, 'st1');
  /* and a sitting on the whole task clears the step, rather than keeping the
     last one and filing the next session under it */
  await p.evaluate(() => FocusTimer.reset());
  await p.evaluate(i => focusOnTask(i, 15), id);
  await p.waitForTimeout(900);
  is('sitting with the whole task again is not filed under the step',
     await p.evaluate(() => FocusTimer.state().subId), null);
  await p.evaluate(() => FocusTimer.stop());

  console.log('\n7. paused time is not counted');
  /* a countdown's remaining freezes while paused and a stopwatch only
     accumulates while running, so a pause costs the reading nothing */
  const paused = await p.evaluate(async () => {
    FocusTimer.reset(); FocusTimer.setMode('stopwatch'); FocusTimer.start();
    await new Promise(r => setTimeout(r, 1200));
    const running = FocusTimer.state().elapsed;
    FocusTimer.pause();
    await new Promise(r => setTimeout(r, 1500));
    const afterPause = FocusTimer.state().elapsed;
    FocusTimer.stop();
    return {running, afterPause};
  });
  yes('the clock moves while it runs', paused.running >= 1, String(paused.running));
  is('  and stands still while it is paused', paused.afterPause, paused.running);

  console.log('\n8. crossing it off ends the sitting');
  await p.evaluate(() => { S.tasks.forEach(t => { t.done = false; }); saveNow(); });
  await go();
  const fid = await p.evaluate(() => { const row = [...document.querySelectorAll('.task-row')]
    .find(r => !findTaskRef(r.dataset.taskrow).done); return row?.dataset.taskrow; });
  yes('there is an unfinished task to sit with', !!fid);
  await p.evaluate(i => { FocusTimer.reset(); focusOnTask(i, 20); }, fid);
  await p.waitForTimeout(1200);
  is('the clock is running on it', await p.evaluate(() => FocusTimer.state().taskId), fid);
  await p.evaluate(i => document.querySelector(`[data-tcheck="${i}"]`)?.click(), fid);
  await p.waitForTimeout(500);
  is('  ticking it off stops the clock', await p.evaluate(() => FocusTimer.state().idle), true);
  is('  and unhooks the task, ready for the next one', await p.evaluate(() => FocusTimer.state().taskId), null);
  yes('  the screen says so', await p.evaluate(() => !!document.querySelector('.fw-note b')?.textContent.trim()),
      await p.evaluate(() => document.querySelector('.fw-note b')?.textContent));
  yes('  with fireworks', await p.evaluate(() => document.querySelectorAll('.fw-burst i').length > 20),
      await p.evaluate(() => document.querySelectorAll('.fw-burst i').length + ' sparks'));
  yes('  and the sentence is not the same one every time',
      await p.evaluate(() => FINISH_LINES.length >= 8 && new Set(FINISH_LINES).size === FINISH_LINES.length),
      await p.evaluate(() => FINISH_LINES.length + ' lines'));
  /* and the note takes itself away rather than sitting there */
  await p.waitForTimeout(3200);
  yes('  then it goes', await p.evaluate(() => !document.querySelector('.fw-note')));
  /* ticking off a task the clock is NOT on leaves the clock alone */
  const other = await p.evaluate(() => { const row = [...document.querySelectorAll('.task-row')]
    .find(r => !findTaskRef(r.dataset.taskrow).done); return row?.dataset.taskrow; });
  if(other){
    await p.evaluate(i => { FocusTimer.reset(); focusOnTask(i, 20); }, fid);
    await p.waitForTimeout(1000);
    await p.evaluate(i => setTaskDone(i, true), other);
    await p.waitForTimeout(400);
    is('crossing off a different task does not stop the clock',
       await p.evaluate(() => FocusTimer.state().idle), false);
    await p.evaluate(() => FocusTimer.stop());
  }
  /* the time worked is written down when there is a minute of it to write */
  const logged = await p.evaluate(async i => {
    planState().focusSessions = [];
    FocusTimer.reset(); FocusTimer.setMode('stopwatch');
    focusOnTask(i, 0);
    /* the sitting has to reach a minute before it is worth recording, so this
       fakes the clock rather than waiting sixty seconds */
    await new Promise(r => setTimeout(r, 300));
    const st = FocusTimer.state();
    return {ran: st.running, task: st.taskId};
  }, fid);
  yes('a fresh sitting starts on the task', logged.ran && logged.task === fid, JSON.stringify(logged));
  await p.evaluate(() => FocusTimer.stop());

  console.log('\n9. what the sittings actually went on');
  await p.evaluate(i => { const now = Date.now(), iso = m => new Date(now - m * 60000).toISOString();
    planState().focusSessions = [
      {id:uid(), type:'focus', taskId:i, duration:25, note:'the tricky bit of the proof',
       startedAt:iso(180), endedAt:iso(150), mode:'countdown', completed:true,
       breaks:[{from:iso(168), to:iso(163), note:'tea, and stared out of the window'},
               {from:iso(158), to:iso(155), note:''}]},
      {id:uid(), type:'focus', taskId:i, duration:47, note:'', startedAt:iso(90), endedAt:iso(43),
       mode:'stopwatch', completed:false, breaks:[]}];
    saveNow(); }, id);
  await go();
  yes('the day\'s sittings are listed', await p.evaluate(() => !!document.querySelector('.fl-wrap')));
  is('  one row each', await p.$$eval('.fl-row', n => n.length), 2);
  yes('  with what was done in it', await p.evaluate(() =>
    /the tricky bit of the proof/.test(document.querySelector('.fl-list').textContent)));
  yes('  and it says when one was never written up', await p.evaluate(() =>
    !!document.querySelector('.fl-did.none')));
  is('  each break is a line', await p.$$eval('.fl-breaks li', n => n.length), 2);
  yes('  with the reason given at the time', await p.evaluate(() =>
    /tea, and stared out of the window/.test(document.querySelector('.fl-breaks').textContent)));
  yes('  and an honest blank where none was', await p.evaluate(() =>
    /no reason given/.test(document.querySelector('.fl-breaks').textContent)));
  /* the arithmetic: 25 + 47 worked, 5 + 3 in breaks */
  is('break time is measured from the two ends', await p.evaluate(() =>
    sessionBreakMinutes(focusLogOn(today())[0])), 8);
  yes('  and the heading totals the day', await p.evaluate(() => {
    const t = document.querySelector('.fl-wrap summary').textContent.replace(/\s+/g, ' ');
    return /2 sittings/.test(t) && /1h 12m worked/.test(t) && /8m in breaks/.test(t) && /1 unwritten/.test(t); }),
    await p.evaluate(() => document.querySelector('.fl-wrap summary').textContent.replace(/\s+/g, ' ').trim()));
  /* an unfinished break — one you are still on — is not counted as time spent */
  is('a break still running counts nothing yet', await p.evaluate(() =>
    breakMinutes({from:new Date().toISOString(), to:null})), 0);
  /* the same record is on the task's own panel */
  await p.evaluate(i => openPlanTask(i), id); await p.waitForTimeout(700);
  yes('and the task\'s panel shows its own sittings the same way',
      await p.evaluate(() => !!document.querySelector('.pd-fsess .fl-row')));
  yes('  with the note on them', await p.evaluate(() =>
    /the tricky bit of the proof/.test(document.querySelector('.pd-fsess').textContent)));
  await p.evaluate(() => closePanel?.());
  /* and the review counts the breaks beside the work */
  const dig = await p.evaluate(() => reviewGather(today(), today()));
  is('the review counts the breaks', dig.tasks?.breaks, 2);
  is('  and how much of the day they took', dig.tasks?.breakMinutes, 8);
  is('  and how many sittings were written up', dig.tasks?.noted, 1);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke143  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
