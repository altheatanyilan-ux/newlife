/* smoke132 — the estimate is the button: press it and sit down for that long */
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
  const p = await b.newPage({viewport:{width:1500, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  console.log('\n1. a length reads as a length, and adds up from the steps');
  is('forty-five minutes reads as 45m', await p.evaluate(() => fmtEst(45)), '45m');
  is('  ninety as an hour and a half', await p.evaluate(() => fmtEst(90)), '1h 30m');
  is('  a round hour without the zero', await p.evaluate(() => fmtEst(60)), '1h');
  is('  and nothing as nothing', await p.evaluate(() => fmtEst(0)), '');
  const t = await p.evaluate(() => {
    const x = {id:uid(), text:'Write the section', listId:'inbox', day:today(), done:false, order:0,
      duration:30, priority:'', subtasks:[], links:{}, notes:''};
    S.tasks.push(x); saveNow(); return x.id;
  });
  is('a task with no steps uses its own figure', await p.evaluate(i => taskEstOf(byId(S.tasks, i)), t), 30);
  await p.evaluate(i => { const x = byId(S.tasks, i);
    x.subtasks = [{id:uid(), title:'Outline', isCompleted:false, minutes:10},
                  {id:uid(), title:'Draft', isCompleted:false, minutes:25}];
    saveNow(); }, t);
  is('  once it has steps, the steps are the total', await p.evaluate(i => taskEstOf(byId(S.tasks, i)), t), 35);
  is('  and its own figure is left where it was',
     await p.evaluate(i => byId(S.tasks, i).duration, t), 30);
  await p.evaluate(i => { byId(S.tasks, i).subtasks.forEach(s => s.minutes = 0); saveNow(); }, t);
  is('  steps with no lengths fall back to the whole', await p.evaluate(i => taskEstOf(byId(S.tasks, i)), t), 30);
  await p.evaluate(i => { const x = byId(S.tasks, i); x.subtasks[0].minutes = 10; x.subtasks[1].minutes = 25; saveNow(); }, t);

  console.log('\n2. the row shows the length, not a timer icon');
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1500);
  yes('the old timer icon is gone', !(await p.$('[data-tfocus]')));
  const chip = await p.$(`[data-test="${t}"]`);
  yes('there is a chip on the row', !!chip);
  is('  saying how long', await p.evaluate(i => document.querySelector(`[data-test="${i}"]`).textContent.trim(), t), '35m');
  yes('  and saying it is the sum of the steps', /added up from the steps/.test(
    await p.evaluate(i => document.querySelector(`[data-test="${i}"]`).title, t)));

  console.log('\n3. pressing it starts a countdown of exactly that long');
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); planState().timer.focusDuration = 25; saveNow(); });
  await p.evaluate(i => { document.querySelector(`[data-tsubs="${i}"]`)?.click(); }, t);
  await p.waitForTimeout(500);
  await p.evaluate(i => document.querySelector(`[data-test="${i}"]`).click(), t);
  await p.waitForTimeout(1300);
  const st = await p.evaluate(() => FocusTimer.state());
  is('the timer is running', st.running, true);
  is('  on that task', st.taskId, t);
  is('  counting down, not up', st.mode, 'countdown');
  is('  and set to the estimate', await p.evaluate(() => planState().timer.focusDuration), 35);
  yes('  with about that much left', st.left > 34 * 60 && st.left <= 35 * 60, String(st.left));
  yes('  and the chip says it is running', await p.evaluate(i =>
    document.querySelector(`[data-test="${i}"]`)?.classList.contains('on'), t));

  console.log('\n4. a step has its own length, and its own way in');
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); });
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1300);
  await p.evaluate(i => { document.querySelector(`[data-tsubs="${i}"]`)?.click(); }, t);
  await p.waitForTimeout(600);
  const subChips = await p.$$eval('.sub-row [data-subest]', n => n.map(x => x.textContent.trim()));
  yes('each step carries one', subChips.includes('10m') && subChips.includes('25m'), subChips.join(' | '));
  const sid = await p.evaluate(i => byId(S.tasks, i).subtasks[1].id, t);
  await p.evaluate(s => document.querySelector(`[data-subest$="|${s}"]`).click(), sid);
  await p.waitForTimeout(1300);
  const st2 = await p.evaluate(() => FocusTimer.state());
  is('pressing a step starts the timer', st2.running, true);
  is('  for the step\'s own length', await p.evaluate(() => planState().timer.focusDuration), 25);
  is('  on the parent task', st2.taskId, t);
  yes('  with the step written into the work note', /Draft/.test(st2.notes || ''), String(st2.notes));

  console.log('\n5. with no estimate, the chip asks for one');
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); });
  const t2 = await p.evaluate(() => {
    const x = {id:uid(), text:'Something unmeasured', listId:'inbox', day:today(), done:false, order:1,
      duration:0, priority:'', subtasks:[], links:{}, notes:''};
    S.tasks.push(x); saveNow(); return x.id;
  });
  await p.evaluate(() => rerender()); await p.waitForTimeout(1200);
  const c2 = await p.evaluate(i => { const el = document.querySelector(`[data-test="${i}"]`);
    return el && {text: el.textContent.trim(), none: el.classList.contains('none')}; }, t2);
  yes('it shows a way to set one', c2 && c2.none && /est/.test(c2.text), JSON.stringify(c2));
  await p.evaluate(i => document.querySelector(`[data-test="${i}"]`).click(), t2);
  await p.waitForTimeout(800);
  yes('  and pressing it asks rather than starting a stray sitting',
      !!(await p.$('.overlay')) && !(await p.evaluate(() => FocusTimer.state().running)));
  const opt = await p.$('[data-pc="45"]');
  if(opt){ await opt.click(); await p.waitForTimeout(1000);
    is('  choosing one records it', await p.evaluate(i => byId(S.tasks, i).duration, t2), 45); }
  else no('  a length could be chosen', 'no chooser option found');

  console.log('\n6. a length once set can be changed');
  /* every press went to the timer, so a wrong estimate was permanent */
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(1300);
  /* make sure the steps are showing rather than toggling them shut */
  await p.evaluate(i => { const r = findTaskRef(i);
    if(!subsOpen(i, r.task)) document.querySelector(`[data-tsubs="${i}"]`)?.click(); }, t);
  await p.waitForTimeout(700);
  const sid2 = await p.evaluate(i => byId(S.tasks, i).subtasks[0].id, t);
  const pen = await p.$(`[data-subestedit$="|${sid2}"]`);
  yes('a step with a length has a pencil beside it', !!pen,
      JSON.stringify(await p.evaluate(i => ({ subs: byId(S.tasks, i).subtasks.map(x => ({t:x.title, m:x.minutes})),
        rows: document.querySelectorAll('.sub-row').length,
        pens: document.querySelectorAll('[data-subestedit]').length }), t)));
  await p.evaluate(s => document.querySelector(`[data-subestedit$="|${s}"]`).click(), sid2);
  await p.waitForTimeout(800);
  yes('  pressing it asks for a new length rather than starting a sitting',
      !!(await p.$('.overlay')) && !(await p.evaluate(() => FocusTimer.state().running)));
  const o = await p.$('[data-pc="45"]');
  if(o){ await o.click(); await p.waitForTimeout(1000);
    is('  and the step takes the new one', await p.evaluate(i => byId(S.tasks, i).subtasks[0].minutes, t), 45);
    is('  so the task\'s total moves with it', await p.evaluate(i => taskEstOf(byId(S.tasks, i)), t), 70); }
  else no('  a new length could be chosen', 'no chooser option');

  /* a task whose steps hold the figures has nothing of its own to edit */
  yes('a rolled-up task shows no pencil of its own',
      !(await p.$(`[data-testedit="${t}"]`)));
  yes('  but one with its own figure does', await p.evaluate(i => {
    const x = byId(S.tasks, i); x.subtasks = []; x.duration = 20; saveNow(); rerender(); return true; }, t) &&
    (await p.waitForTimeout(900), !!(await p.$(`[data-testedit="${t}"]`))));
  await p.evaluate(i => document.querySelector(`[data-testedit="${i}"]`).click(), t);
  await p.waitForTimeout(800);
  const o2 = await p.$('[data-pc="60"]');
  if(o2){ await o2.click(); await p.waitForTimeout(1000);
    is('  and its length can be changed too', await p.evaluate(i => byId(S.tasks, i).duration, t), 60); }
  else no('  a new length could be chosen for the task', 'no chooser option');

  console.log('\n7. and any length can be given, not only the ones on the list');
  const parsed = await p.evaluate(() => ['90','1h30','2h','45m','1.5h','','nonsense','75 minutes'].map(x => [x, parseEst(x)]));
  const want = {'90':90, '1h30':90, '2h':120, '45m':45, '1.5h':90, '':0, 'nonsense':0, '75 minutes':75};
  parsed.forEach(([txt, got]) => is(`  "${txt}" reads as ${want[txt]}`, got, want[txt]));
  await p.evaluate(i => document.querySelector(`[data-testedit="${i}"]`).click(), t);
  await p.waitForTimeout(800);
  const presets = await p.$$eval('.overlay [data-pc]', n => n.length);
  yes('the list of lengths is a long one', presets >= 18, `${presets} to choose from`);
  yes('  reaching a whole working day', await p.evaluate(() =>
    [...document.querySelectorAll('.overlay [data-pc]')].some(b => b.textContent.trim() === '8h')));
  yes('  and anything else can be typed', !!(await p.$('.overlay #pcNew')));
  await p.fill('.overlay #pcNew', '1h20');
  await p.click('.overlay #pcAdd'); await p.waitForTimeout(1000);
  is('  a typed length is taken', await p.evaluate(i => byId(S.tasks, i).duration, t), 80);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke132  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
