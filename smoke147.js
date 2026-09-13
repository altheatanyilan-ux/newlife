/* smoke147 — the two arithmetics of a sitting. An estimate is of the job,
   not of each visit to it, so a second sitting counts down what is still
   owed; and the minutes are written down as they are worked rather than
   only when the clock is finally stopped. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1400, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1400);

  const len = () => p.evaluate(() => planState().timer.focusDuration);
  const mode = () => p.evaluate(() => FocusTimer.state().mode);

  console.log('\n1. a task nobody has sat with starts at its whole estimate');
  const fresh = await p.evaluate(() => { const t = newPlanTask('Untouched', today(), {duration: 45});
    S.tasks.push(t); saveNow(); return t.id; });
  is('the estimate is what was set', await p.evaluate(i => taskEstOf(planTaskById(i)), fresh), 45);
  is('  nothing spent on it yet', await p.evaluate(i => taskSpentOn(i), fresh), 0);
  await p.evaluate(i => focusOnTask(i, 45), fresh); await p.waitForTimeout(800);
  is('  the sitting is the full length', await len(), 45);
  is('  and it counts down', await mode(), 'countdown');
  await p.evaluate(() => FocusTimer.stop());

  console.log('\n2. a task already sat with counts down what is left');
  const part = await p.evaluate(() => { const t = newPlanTask('Half done', today(), {duration: 60});
    S.tasks.push(t);
    planState().focusSessions.push({id: uid(), type: 'focus', taskId: t.id, subId: null,
      duration: 25, startedAt: new Date().toISOString()});
    saveNow(); return t.id; });
  is('25 of the 60 are on the record', await p.evaluate(i => taskSpentOn(i), part), 25);
  is('  so 35 are owed', await p.evaluate(i => focusLeftOn(i, 60), part), 35);
  await p.evaluate(i => focusOnTask(i, 60), part); await p.waitForTimeout(800);
  is('  and the sitting is 35, not 60', await len(), 35);
  is('  still a countdown', await mode(), 'countdown');
  yes('  running on that task', await p.evaluate(i => { const s = FocusTimer.state();
    return s.running && s.taskId === i; }, part));
  await p.evaluate(() => FocusTimer.stop());

  console.log('\n3. once the estimate is spent there is nothing to count down');
  await p.evaluate(i => { planState().focusSessions.push({id: uid(), type: 'focus', taskId: i,
    subId: null, duration: 40, startedAt: new Date().toISOString()}); saveNow(); }, part);
  is('the estimate is over-run', await p.evaluate(i => taskSpentOn(i) > taskEstOf(planTaskById(i)), part), true);
  is('  nothing is left', await p.evaluate(i => focusLeftOn(i, 60), part), 0);
  await p.evaluate(i => focusOnTask(i, 60), part); await p.waitForTimeout(800);
  is('  so the sitting counts up instead of inventing time', await mode(), 'stopwatch');
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.setMode('countdown'); });

  console.log('\n4. a step is measured against its own figure, not the task\'s');
  const withStep = await p.evaluate(() => {
    const t = newPlanTask('Has steps', today(), {duration: 0});
    t.subtasks = [{id: uid(), title: 'First step', minutes: 30, isCompleted: false},
                  {id: uid(), title: 'Second step', minutes: 30, isCompleted: false}];
    S.tasks.push(t);
    planState().focusSessions.push({id: uid(), type: 'focus', taskId: t.id, subId: t.subtasks[0].id,
      duration: 10, startedAt: new Date().toISOString()});
    saveNow(); return {id: t.id, a: t.subtasks[0].id, c: t.subtasks[1].id};
  });
  is('the first step has 10 against it', await p.evaluate(x => subSpentOn(x.id, x.a), withStep), 10);
  is('  so it owes 20', await p.evaluate(x => focusLeftOn(x.id, 30, x.a), withStep), 20);
  is('  the untouched step still owes all 30', await p.evaluate(x => focusLeftOn(x.id, 30, x.c), withStep), 30);
  await p.evaluate(x => focusOnTask(x.id, 30, 'First step', x.a), withStep); await p.waitForTimeout(800);
  is('  sitting down with the first step gives 20', await len(), 20);
  await p.evaluate(() => FocusTimer.stop());
  await p.evaluate(x => focusOnTask(x.id, 30, 'Second step', x.c), withStep); await p.waitForTimeout(800);
  is('  and with the second, 30', await len(), 30);
  await p.evaluate(() => FocusTimer.stop());

  console.log('\n5. the button says what pressing it will do');
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1400);
  const title = await p.evaluate(i => document.querySelector(`[data-test="${i}"]`)?.getAttribute('title') || '', part);
  yes('an over-run task warns that it will count up', /counts up/.test(title), title);

  console.log('\n6. the minutes are written down as they are worked');
  /* A timer paused and forgotten used to lose the whole afternoon, and a
     task's own figure was wrong for exactly as long as you were sitting
     with it — which is when you are looking at it. */
  await p.clock.install();
  const live = await p.evaluate(() => { const t = newPlanTask('Worked on now', today(), {duration: 30});
    S.tasks.push(t); saveNow(); return t.id; });
  await p.evaluate(i => { FocusTimer.reset(); FocusTimer.setMode('countdown'); FocusTimer.setLength(30);
    FocusTimer.setTask(i, null); FocusTimer.start(); }, live);
  await p.clock.runFor(7 * 60 * 1000);
  is('nothing is written while it runs', await p.evaluate(i => taskSpentOn(i), live), 0);
  await p.evaluate(() => FocusTimer.pause()); await p.clock.runFor(200);
  is('pausing writes down what has been done', await p.evaluate(i => taskSpentOn(i), live), 7);
  is('  on the sitting\'s own row', await p.evaluate(i => focusSessionsFor(i).length, live), 1);
  is('  and the task carries it as well', await p.evaluate(i => planTaskById(i).focusTime, live), 7);
  await p.evaluate(() => FocusTimer.start()); await p.clock.runFor(5 * 60 * 1000);
  await p.evaluate(() => FocusTimer.pause()); await p.clock.runFor(200);
  is('resuming and pausing again adds to the same row', await p.evaluate(i => taskSpentOn(i), live), 12);
  is('  rather than opening a second one', await p.evaluate(i => focusSessionsFor(i).length, live), 1);
  is('  and nothing is counted twice', await p.evaluate(i => planTaskById(i).focusTime, live), 12);
  is('  what is left of the estimate follows it', await p.evaluate(i => focusLeftOn(i, 30), live), 18);
  await p.evaluate(() => FocusTimer.start()); await p.clock.runFor(3 * 60 * 1000);
  await p.evaluate(() => FocusTimer.stop()); await p.clock.runFor(200);
  is('stopping closes the same row', await p.evaluate(i => focusSessionsFor(i).length, live), 1);
  is('  with the whole sitting on it', await p.evaluate(i => taskSpentOn(i), live), 15);
  await p.evaluate(i => { FocusTimer.reset(); FocusTimer.setTask(i, null); FocusTimer.start(); }, live);
  await p.clock.runFor(4 * 60 * 1000);
  await p.evaluate(() => FocusTimer.stop()); await p.clock.runFor(200);
  is('a later sitting is a new row', await p.evaluate(i => focusSessionsFor(i).length, live), 2);
  is('  and the total is both of them', await p.evaluate(i => taskSpentOn(i), live), 19);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke147  all good');
  await b.close();
  process.exitCode = bad ? 1 : 0;
})();
