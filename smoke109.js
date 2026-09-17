/* smoke109 — a list runs towards dates that are not tasks, and they are drawn
   on a scale above whichever view is open */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);
const near = (n,a,b,tol) => Math.abs(a-b) <= tol ? ok(n, `${a.toFixed(1)} vs ${b.toFixed(1)}`)
  : no(n, `got ${a}, want about ${b} (±${tol})`);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1500, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const draw = async () => { await p.evaluate(() => { if(location.hash === '#/planning') rerender(); else location.hash = '#/planning'; });
    await p.waitForTimeout(1300); };

  const listId = await p.evaluate(() => {
    const l = planLists().find(x => x.id !== 'inbox') || planLists()[0];
    S._planSel = {kind:'list', id: l.id}; S._planRoom = 'tasks'; S._planView = 'eisenhower';
    l.milestones = []; saveNow(); return l.id;
  });
  await draw();

  console.log('\n1. an empty list says what a milestone is for');
  yes('the strip is there even with nothing on it', !!(await p.$('.pl-ms')));
  yes('  and explains itself', /shipping date|deposit|hearing/.test(await p.textContent('.pl-ms')));
  yes('  with a way to add one', !!(await p.$('#plMsAdd')));

  console.log('\n2. adding one');
  await p.click('#plMsAdd');
  await p.waitForTimeout(900);
  yes('the form opens straight away', !!(await p.$('#msName')));
  /* every other place a date is asked for opens a calendar; checking the two
     attributes are present would pass on a picker that never opened */
  yes('  the date field carries a picker', !!(await p.$('#msDate[data-dp]')) && !!(await p.$('[data-dpfor="msDate"]')));
  await p.click('[data-dpfor="msDate"]');
  await p.waitForTimeout(600);
  yes('  and it actually opens', !!(await p.$('.dp-pop')));
  yes('    with a month of days in it', await p.evaluate(() => document.querySelectorAll('.dp-cell[data-dpd]').length) >= 28);
  await p.evaluate(() => [...document.querySelectorAll('.dp-cell[data-dpd]')][14].click());
  await p.waitForTimeout(500);
  yes('    and choosing one writes it into the field', /^\d{4}-\d{2}-\d{2}$/.test(await p.inputValue('#msDate')),
      await p.inputValue('#msDate'));
  await p.fill('#msName', 'Hearing');
  await p.fill('#msDate', await p.evaluate(() => addDays(today(), 9)));
  await p.fill('#msNote', 'court 3');
  await p.click('#msSave');
  await p.waitForTimeout(1200);
  const saved = await p.evaluate(id => planList(id).milestones.map(m => ({n: m.name, d: m.date, note: m.note})), listId);
  is('it is kept on the list, not on a task', saved.length, 1);
  is('  with its name', saved[0].n, 'Hearing');
  is('  its note', saved[0].note, 'court 3');
  is('  and no task was created', await p.evaluate(() => S.tasks.filter(t => t.text === 'Hearing').length), 0);

  console.log('\n3. it is above every view, not inside one');
  await p.evaluate(id => { planList(id).milestones.push(
    {id: uid(), name: 'First draft', date: addDays(today(), -6), done: true, note: ''},
    {id: uid(), name: 'Filing deadline', date: addDays(today(), 34), done: false, note: ''},
    {id: uid(), name: 'Deposit due', date: addDays(today(), -2), done: false, note: ''});
    saveNow(); rerender(); }, listId);
  await p.waitForTimeout(1200);
  for(const v of ['eisenhower','list','kanban','calendar','timeline']){
    await p.evaluate(x => { S._planView = x; rerender(); }, v);
    await p.waitForTimeout(1000);
    const seen = await p.evaluate(() => {
      const strip = document.querySelector('.pl-ms');
      const body = document.querySelector('#plBody');
      return {strip: !!strip, pins: document.querySelectorAll('.pl-ms [data-plms]').length,
        aboveBody: !!(strip && body && (strip.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING))};
    });
    yes(`${v}: the strip is there`, seen.strip);
    is(`  with all four dates`, seen.pins, 4);
    yes(`  and above the workspace, not in it`, seen.aboveBody);
  }

  console.log('\n4. the strip is a scale, not a list');
  await p.evaluate(() => { S._planView = 'eisenhower'; rerender(); });
  await p.waitForTimeout(1100);
  const geom = await p.evaluate(() => {
    const line = document.querySelector('.pl-msline').getBoundingClientRect();
    const at = el => { const r = el.getBoundingClientRect();
      return (r.x + r.width / 2 - line.x) / line.width * 100; };
    const pins = [...document.querySelectorAll('.pl-mspin')].map(el => ({name: el.querySelector('.pl-mslabel').textContent, at: at(el)}));
    return {pins, now: at(document.querySelector('.pl-msnow')), width: line.width};
  });
  is('the pins read in date order', geom.pins.map(x => x.name).join(','),
     'First draft,Deposit due,Hearing,Filing deadline');
  yes('  the earliest sits left of the latest', geom.pins[0].at < geom.pins[3].at);
  /* the dates run -6 to +34, so 40 days, padded either side by round(40×0.12)
     = 5: a 50-day window from -11. Today is 11/50 along it and the Hearing,
     at +9, is 20/50. Those are the numbers the drawing has to reproduce if it
     is a scale rather than four things in a row. */
  near('today is placed by its date, not in the middle', geom.now, 100 * 11 / 50, 3);
  near('  and a milestone by its own', geom.pins[2].at, 100 * 20 / 50, 3);
  yes('the whole thing is wide enough to read', geom.width > 500, String(geom.width));

  console.log('\n5. met, and overdue, look different');
  const state = await p.evaluate(() => [...document.querySelectorAll('.pl-mspin')].map(el =>
    ({name: el.querySelector('.pl-mslabel').textContent, cls: el.className})));
  yes('the one that was met is marked done', /done/.test(state.find(s => s.name === 'First draft').cls));
  yes('the one past its date is marked late', /late/.test(state.find(s => s.name === 'Deposit due').cls));
  yes('  and one still ahead is neither',
      !/done|late/.test(state.find(s => s.name === 'Hearing').cls), state.find(s => s.name === 'Hearing').cls);
  yes('the count says how many are still ahead', /3 ahead/.test(await p.textContent('.pl-ms')));

  /* Section 6 was here: the Timeline view drew the same milestones on its own
     scale, in a lane above the Gantt bars. The Timeline has since been retired
     along with the Board — it drew bars against dates the milestone strip
     draws above every view, which is the strip sections 1 to 5 are about. */

  console.log('\n7. clicking one opens it');
  await p.evaluate(() => { S._planView = 'list'; rerender(); });
  await p.waitForTimeout(1100);
  /* pressing the pin itself filters the list to that milestone; the pencil on
     it is the door into the form, and it is its own door on purpose */
  await p.evaluate(() => document.querySelector('.pl-mspin [data-plms]')?.click());
  await p.waitForTimeout(800);
  yes('the pencil on the pin opens the form', !!(await p.$('#msName')));
  /* the first pin is "First draft", which was already met, so the toggle
     un-marks it — either way the switch has to be written down */
  await p.click('#msDone'); await p.click('#msSave');
  await p.waitForTimeout(1100);
  is('the met switch is written down',
     await p.evaluate(id => planList(id).milestones.find(m => m.name === 'First draft').done, listId), false);

  /* Today, Tomorrow and the next seven days used to have no strip at all,
     because a milestone belongs to a list and they are not lists. They are a
     window instead: every list's dates, narrowed to the days they name. The
     one smart view that is still not about a period — Done — keeps nothing
     above it, because "everything I have finished" has no dates to draw. */
  console.log('\n8. a dated view is a window, and the view that is not stays bare');
  await p.evaluate(() => { planSetSel('smart', 'today'); });
  await p.waitForTimeout(1300);
  yes('Today has a strip, of whatever falls in it', !!(await p.$('.pl-ms')));
  await p.evaluate(() => { planSetSel('smart', 'done'); });
  await p.waitForTimeout(1300);
  yes('  nothing above Done', !(await p.$('.pl-ms')));

  console.log('\n9. a folder shows the dates of every list inside it');
  const folder = await p.evaluate(() => {
    const f = planState().folders[0]; if(!f) return null;
    const ls = planLists().filter(l => l.folderId === f.id);
    if(ls.length < 2) return null;
    ls[0].milestones = [{id: uid(), name: 'A', date: addDays(today(), 3), done: false, note: ''}];
    ls[1].milestones = [{id: uid(), name: 'B', date: addDays(today(), 8), done: false, note: ''}];
    saveNow(); planSetSel('folder', f.id); return f.id;
  });
  await p.waitForTimeout(1300);
  if(!folder) no('a folder with two lists exists', 'no folder to test with');
  else {
    is('both lists’ dates are on the one strip',
       await p.evaluate(() => document.querySelectorAll('.pl-ms [data-plms]').length), 2);
    yes('  in date order', await p.evaluate(() =>
      [...document.querySelectorAll('.pl-mslabel')].map(n => n.textContent).join(',') === 'A,B'));
  }

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke109  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
