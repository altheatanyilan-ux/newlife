/* smoke145 — three things the timer and the readings were missing in real use:
   a way to tick off the work from the clock you finished it at, a reading that
   remembers what the cards mean, and a draw that stays on the day it was for. */
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
  const p = await b.newPage({viewport:{width:1500, height:1300}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.clock.install({time: new Date('2026-09-13T09:00:00')});
  await p.goto(FILE); await p.clock.runFor(2000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.clock.runFor(2500); }
  const go = async h => { await p.evaluate(x => { if(location.hash === x) rerender(); else location.hash = x; }, h);
    await p.clock.runFor(1700); await p.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove())); };
  await go('#/today');

  /* The clock is a floating gadget now and carries only the clock, the task
     and the two notes — the tick box that used to sit on it went with the
     panel. What it did has not gone anywhere: crossing the work off, wherever
     you cross it off, is still the end of the sitting. That is what these
     three sections are actually about, so they cross it off from the list. */
  await p.evaluate(() => setFocusDockShut(false)); await p.clock.runFor(500);

  console.log('\n1. crossing the work off is the end of the sitting');
  const id = await p.evaluate(() => {
    const r = document.querySelector('.task-row'); const i = r.dataset.taskrow;
    const t = findTaskRef(i); t.task.done = false; t.task.duration = 15;
    t.task.subtasks = [{id:'s-one', title:'the tricky bit', isCompleted:false, minutes:10}];
    planState().focusSessions = []; saveNow(); rerender(); return i; });
  await p.clock.runFor(400);
  await p.evaluate(i => focusOnTask(i, 0, ''), id); await p.clock.runFor(1400);
  yes('the sitting names the task it is timing',
      await p.evaluate(() => !!document.querySelector('#t-focus .tf-on b')?.textContent));
  await p.clock.runFor(6 * 60 * 1000);
  await p.evaluate(i => setTaskDone(i, true), id);
  await p.clock.runFor(1200);
  const A = await p.evaluate(i => ({idle: FocusTimer.state().idle, done: findTaskRef(i).done,
    spent: taskSpentOn(i), sessions: (planState().focusSessions || []).length,
    burst: !!document.querySelector('.fw-burst'), note: !!document.querySelector('.fw-note b')?.textContent}), id);
  is('  ticking it ends the sitting', A.idle, true);
  is('  the task is crossed off', A.done, true);
  is('  the minutes are kept against it', A.spent, 6);
  yes('  and the fireworks go up, with a sentence', A.burst && A.note);

  console.log('\n2. a step is a thing you finish too');
  await p.evaluate(i => { const t = findTaskRef(i); t.task.done = false;
    t.task.subtasks[0].isCompleted = false; planState().focusSessions = []; saveNow(); rerender(); }, id);
  await p.clock.runFor(400);
  await p.evaluate(i => focusOnTask(i, 0, '', 's-one'), id); await p.clock.runFor(1400);
  is('the sitting says which step it is on',
     await p.evaluate(() => document.querySelector('#t-focus .tf-stepname')?.textContent), 'the tricky bit');
  await p.clock.runFor(3 * 60 * 1000);
  await p.evaluate(i => setSubDone(i, 's-one', true), id);
  await p.clock.runFor(1200);
  const B = await p.evaluate(i => ({idle: FocusTimer.state().idle, sub: findTaskRef(i).task.subtasks[0].isCompleted,
    task: findTaskRef(i).done, spent: subSpentOn(i, 's-one'), burst: !!document.querySelector('.fw-burst')}), id);
  is('  ticking the step ends the sitting', B.idle, true);
  is('  the step is done', B.sub, true);
  is('  but the task itself is not', B.task, false);
  is('  and the step carries the minutes', B.spent, 3);
  yes('  fireworks for the step as well', B.burst);
  /* ticking some other step of the same task is not the end of anything */
  await p.evaluate(i => { const t = findTaskRef(i);
    t.task.subtasks.push({id:'s-two', title:'the easy bit', isCompleted:false, minutes:5});
    t.task.subtasks[0].isCompleted = false; saveNow(); rerender(); }, id);
  await p.clock.runFor(400);
  await p.evaluate(i => focusOnTask(i, 0, '', 's-one'), id); await p.clock.runFor(1200);
  await p.evaluate(i => setSubDone(i, 's-two', true), id); await p.clock.runFor(800);
  is('a different step of the same task leaves the clock running',
     await p.evaluate(() => FocusTimer.state().idle), false);
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.setTask(null); }); await p.clock.runFor(600);

  console.log('\n3. a task living in a project reaches the clock whole');
  const pid = await p.evaluate(() => {
    const pr = (S.projects || [])[0], ph = pr && (pr.phases || [])[0]; if(!ph) return null;
    ph.tasks = ph.tasks || [];
    ph.tasks.push({id:'pt-x', text:'A task inside a project', day:today(), done:false, duration:20, subtasks:[]});
    saveNow(); rerender(); return `${pr.id}:${ph.id}:pt-x`; });
  yes('there is a project to put one in', !!pid);
  if(pid){
    await p.evaluate(i => focusOnTask(i, 0, ''), pid); await p.clock.runFor(1400);
    is('  the sitting names it', await p.evaluate(() => document.querySelector('#t-focus .tf-on b')?.textContent),
       'A task inside a project');
    await p.clock.runFor(2 * 60 * 1000);
    await p.evaluate(i => setTaskDone(i, true), pid);
    await p.clock.runFor(1200);
    const C = await p.evaluate(i => ({idle: FocusTimer.state().idle, done: findTaskRef(i).done,
      spent: taskSpentOn(i)}), pid);
    is('  ticking it ends the sitting too', C.idle, true);
    is('  it is crossed off', C.done, true);
    is('  and the minutes are its own', C.spent, 2);
  }

  console.log('\n4. a kept reading remembers what the cards mean');
  const eid = await p.evaluate(() => {
    S.entries = (S.entries || []).filter(e => e.type !== 'divination');
    const e = divinationSave({system:'tarot', spread:'three', question:'What am I not seeing?',
      title:'Three cards', cards:[{card:0, rev:false, pos:'What is behind'},
                                  {card:13, rev:true, pos:'Where you are'}],
      reading:'my own note'});
    return e.id; });
  await go('#/journals/divination');
  const card = await p.evaluate(i => {
    const n = document.querySelector(`[data-entry="${i}"]`); return n ? n.textContent : ''; }, eid);
  yes('the note typed at the time is still there', /my own note/.test(card));
  /* the meaning kept with a reading is the long one now: the card's essence,
     its themes and what it says the way up it landed — not a dictionary line */
  yes('  and so is the first card\'s own meaning',
      /standing at the edge of something/.test(card), card.slice(0, 260));
  yes('  with the line it is carried by', /The leap into the unknown/.test(card));
  yes('  the reversed card gives its reversed reading',
      /Hanging on/.test(card) && /reversed/i.test(card));
  yes('  each card says which position it fell in', /What is behind/.test(card) && /Where you are/.test(card));
  yes('  and its themes', /beginnings/.test(card));
  yes('  with the long reading one click away', await p.evaluate(i =>
    !!document.querySelector(`[data-entry="${i}"] .dv-read-more`), eid));
  /* the meaning is read from the deck, not copied — so it cannot go stale */
  is('the entry stores only the card number', await p.evaluate(i =>
    JSON.stringify(S.entries.find(e => e.id === i).extra.divination.cards[0]),
    eid), JSON.stringify({card:0, rev:false, pos:'What is behind'}));

  console.log('\n5. a hexagram keeps its judgement too');
  const hid = await p.evaluate(() => divinationSave({system:'iching', question:'And now?',
    title:'The Creative', lines:[{v:1,moving:false},{v:1,moving:false},{v:1,moving:false},
                                 {v:1,moving:false},{v:1,moving:false},{v:1,moving:false}],
    hexagram:{i:1, n:'The Creative'}, reading:''}).id);
  await go('#/journals/divination');
  const hx = await p.evaluate(i => document.querySelector(`[data-entry="${i}"]`)?.textContent || '', hid);
  yes('the hexagram\'s judgement is kept with it', /Sublime success/.test(hx), hx.slice(0, 160));
  yes('  and its image', /movement of heaven/.test(hx));

  console.log('\n6. a draw taken on Today stays on Today');
  await go('#/today');
  await p.evaluate(() => { const d = document.querySelector('#t-still'); if(d) d.open = true; });
  await p.clock.runFor(500);
  const still = await p.evaluate(() => document.querySelector('#t-still')?.textContent || '');
  yes('the stillness section shows what was drawn today', /drawn today/.test(still), still.slice(0, 120));
  yes('  naming the cards', /The Fool/.test(still));
  yes('  and giving their meaning', /standing at the edge of something/.test(still));
  yes('  the hexagram is there as well', /The Creative/.test(still));
  /* it is a way back into the record, not a dead card */
  const opens = await p.evaluate(() => {
    const n = document.querySelector('[data-dvopen]'); return !!n && typeof n.onclick === 'function'; });
  yes('  and pressing one opens it in the record', opens);
  await p.evaluate(() => document.querySelector('[data-dvopen]').click());
  await p.clock.runFor(1500);
  is('  which is where it lands', await p.evaluate(() => location.hash), '#/journals/divination');
  /* yesterday's draw is yesterday's: today's list does not accumulate */
  await p.evaluate(() => { S.entries.filter(e => e.type === 'divination')
    .forEach(e => e.occurredAt = '2020-01-01'); saveNow(); });
  await go('#/today');
  await p.evaluate(() => { const d = document.querySelector('#t-still'); if(d) d.open = true; });
  await p.clock.runFor(500);
  yes('nothing drawn today means nothing shown', await p.evaluate(() =>
    !document.querySelector('#t-still .dv-today')));

  console.log('\n7. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke145  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
