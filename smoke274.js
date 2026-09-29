/* smoke274 — the week's milestones on Today are the Tasks view's line of time.

   The claims.

   THE SAME LINE. The milestones at the top of Today are drawn as the Tasks
   view draws them above a list: a scale of dates, today marked on it, and a
   pin for each date carrying its name, how far away it is and how much is
   still left under it. Not a row of buttons.

   A PRESS DOES WHAT IT DOES IN TASKS. Pressing a pin on Today opens the
   Tasks view on the list the date belongs to, narrowed to the work under
   that date — the same list, the same filter and the same lit pin as
   choosing that list in Tasks and pressing the date there. It works from
   every Today view, the Tasks view itself included. The pencil opens the
   milestone; a skill's level due this week is on the line and goes to the
   skill.

   AND IT FITS. At phone width the line stays inside the page.

   Run: NODE_PATH=node_modules node smoke274.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 1000}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil').forEach(n => n.remove()); });

  const ids = await p.evaluate(() => {
    const l = {id: uid(), name: 'The book', color: '#8a6fb0', folderId: null, sortOrder: 5,
      defaultView: 'list', sections: [], createdAt: new Date().toISOString()};
    planState().lists.push(l);
    const m = planAddMilestone(l.id, {name: 'Proofs to the printer', date: addDays(today(), 3)});
    const m2 = planAddMilestone(l.id, {name: 'Cover signed off', date: addDays(today(), 6)});
    S.tasks.push(newPlanTask('Check the index', '', {listId: l.id, milestoneId: m.id}),
                 newPlanTask('Fix the captions', '', {listId: l.id, milestoneId: m.id}),
                 newPlanTask('Write the blurb', '', {listId: l.id}));
    const sk = S.skills[0];
    if(sk){ sk.milestones = sk.milestones || [];
      sk.milestones.push({id: uid(), levelTarget: (sk.currentLevel || 0) + 1, by: addDays(today(), 2)}); }
    saveNow();
    return {list: l.id, m: m.id, m2: m2.id, skill: sk ? sk.id : null};
  });

  const shown = async () => p.evaluate(() => {
    const room = document.querySelector('#todayRoom');
    return {hash: location.hash, sel: S._planSel, filter: (S._planFilter || {}).milestone || null,
      text: room ? room.textContent : '',
      lit: [...document.querySelectorAll('#todayRoom .pl-mspin.on')].map(n => n.dataset.plmsfilter)};
  });

  console.log('\n1. the same line of time the Tasks view draws');
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); }); await p.waitForTimeout(900);
  /* it rests folded (section 6); opened here, it stays open while the page is used */
  await p.evaluate(() => { document.querySelector('.today-ms').open = true; }); await p.waitForTimeout(300);
  const top = await p.evaluate(() => { const box = document.querySelector('.today-ms');
    return box && {line: !!box.querySelector('.pl-msline .pl-msrail'), now: !!box.querySelector('.pl-msnow'),
      ticks: box.querySelectorAll('.pl-mstick').length,
      pins: [...box.querySelectorAll('.pl-mspin')].map(n => (n.textContent + ' | ' + n.title).replace(/\s+/g, ' ').trim()),
      go: [...box.querySelectorAll('.pl-mspin[data-msgo]')].map(n => n.textContent.replace(/\s+/g, ' ').trim()),
      h: Math.round(box.querySelector('.pl-msline').getBoundingClientRect().height),
      oneLine: [...box.querySelectorAll('.pl-mspin .pl-mslabel')].every(l => l.getBoundingClientRect().height < 20),
      oldRow: !!box.querySelector('.today-ms-item')}; });
  yes('Today has a milestones line with a rail and today marked on it', top && top.line && top.now, top);
  yes('  with dates along it', top && top.ticks >= 3, top);
  yes('  a pin for the date in three days, with what is left under it (in its tooltip)',
      top && top.pins.some(t => /Proofs to the printer/.test(t) && /2 of 2 still to do/.test(t) && /in 3 days/.test(t)), top && top.pins);
  yes('  compact: each name on one line, beside how far away it is', top && top.oneLine, top);
  yes('  so the whole line is short \u2014 well under the old 170px and more', top && top.h <= 130, top && top.h);
  yes('  and the other date that week', top && top.pins.some(t => /Cover signed off/.test(t)), top && top.pins);
  if(ids.skill) yes('  and the skill level due this week', top && top.go.length === 1, top && top.go);
  yes('  and no longer the row of buttons', top && !top.oldRow);

  console.log('\n2. a press does what it does in Tasks');
  /* first, the way it works inside Tasks: choose the list, press the date */
  await p.evaluate(l => { S.settings.todayView = 'tasks'; location.hash = '#/today/tasks'; }, ids.list); await p.waitForTimeout(900);
  await p.evaluate(l => { planSetSel('list', l); rerender(); }, ids.list); await p.waitForTimeout(700);
  await p.click(`#todayRoom [data-plmsfilter="${ids.m}"] .pl-mslabel`); await p.waitForTimeout(700);
  const inTasks = await shown();
  yes('(inside Tasks: the list, narrowed to the date, its pin lit)',
      inTasks.filter === ids.m && inTasks.lit.includes(ids.m) && /Check the index/.test(inTasks.text) && !/Write the blurb/.test(inTasks.text), inTasks);
  /* now from Today, starting somewhere else entirely */
  await p.evaluate(() => { planSetSel('smart', 'today'); S._planFilter = {}; S.settings.todayView = 'do'; location.hash = '#/today'; }); await p.waitForTimeout(900);
  await p.click(`.today-ms [data-plmsfilter="${ids.m}"] .pl-mslabel`); await p.waitForTimeout(1100);
  const fromToday = await shown();
  yes('from Today it opens the Tasks view', fromToday.hash === '#/today/tasks', fromToday.hash);
  yes('  on the list the date belongs to', fromToday.sel && fromToday.sel.kind === 'list' && fromToday.sel.id === ids.list, fromToday.sel);
  yes('  narrowed to that date', fromToday.filter === ids.m, fromToday.filter);
  yes('  with its pin lit, as in Tasks', fromToday.lit.includes(ids.m), fromToday.lit);
  yes('  showing the work under it', /Check the index/.test(fromToday.text) && /Fix the captions/.test(fromToday.text));
  yes('  and not the rest of the list', !/Write the blurb/.test(fromToday.text));
  yes('  exactly what pressing it inside Tasks shows', fromToday.filter === inTasks.filter
      && JSON.stringify(fromToday.lit) === JSON.stringify(inTasks.lit));
  /* already on the Tasks view: the line at the top still works */
  await p.click(`.today-ms [data-plmsfilter="${ids.m2}"] .pl-mslabel`); await p.waitForTimeout(900);
  const again = await shown();
  yes('from the top of the Tasks view itself, too', again.filter === ids.m2 && again.lit.includes(ids.m2), again);
  /* from the review view */
  await p.evaluate(() => { S.settings.todayView = 'review'; location.hash = '#/today/review'; }); await p.waitForTimeout(900);
  await p.click(`.today-ms [data-plmsfilter="${ids.m}"] .pl-mslabel`); await p.waitForTimeout(1100);
  const fromReview = await shown();
  yes('and from the Review view', fromReview.hash === '#/today/tasks' && fromReview.filter === ids.m, fromReview);

  console.log('\n3. the pencil and the skill');
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today'; }); await p.waitForTimeout(900);
  await p.hover(`.today-ms [data-plmsfilter="${ids.m}"]`);
  await p.click(`.today-ms [data-plms="${ids.m}"]`); await p.waitForTimeout(600);
  yes('the pencil opens the milestone', await p.evaluate(() => /Proofs to the printer/.test(
    [...document.querySelectorAll('#modals input')].map(i => i.value).join(' ')) && location.hash === '#/today'));
  await p.evaluate(() => closeModals());
  console.log('\n4. it fits a phone');
  await p.setViewportSize({width: 390, height: 860});
  await p.evaluate(() => { closeModals(); S.settings.todayView = 'do'; location.hash = '#/today'; }); await p.waitForTimeout(1000);
  const fit = await p.evaluate(() => { const box = document.querySelector('.today-ms'); if(!box) return null;
    const r = box.getBoundingClientRect();
    const pins = [...box.querySelectorAll('.pl-mspin')].map(n => n.getBoundingClientRect());
    return {inside: r.right <= innerWidth + 1, pinsIn: pins.every(q => q.left >= -1 && q.right <= innerWidth + 1),
      scroll: document.documentElement.scrollWidth <= innerWidth + 1}; });
  yes('the line and its pins stay inside the window at 390px', fit && fit.inside && fit.pinsIn && fit.scroll, fit);
  await p.screenshot({path: '/tmp/smoke274-phone.png'});
  await p.setViewportSize({width: 1400, height: 1000}); await p.waitForTimeout(600);
  await p.screenshot({path: '/tmp/smoke274-desk.png', clip: {x: 0, y: 0, width: 1400, height: 420}});

  /* last, because the skill page opens a panel over whatever comes next */
  if(ids.skill){
    await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); }); await p.waitForTimeout(900);
    await p.click('.today-ms [data-msgo] .pl-mslabel'); await p.waitForTimeout(900);
    yes('a skill pin goes to the skill', await p.evaluate(() => /skills/.test(location.hash)), await p.evaluate(() => location.hash));
  }

  console.log('\n6. it rests folded');
  /* the skill page left a panel open; start again from a fresh load, which
     also shows the fold is kept with everything else */
  await p.evaluate(() => { saveNow(); S.settings.todayView = 'do'; });
  await p.waitForTimeout(600);
  /* a real reload: going to the same page with only the #hash changed is not one */
  await p.goto('file://' + path.join(__dirname, 'index.html') + '#/today'); await p.reload(); await p.waitForTimeout(1600);
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil').forEach(n => n.remove());
    S.settings.todayView = 'do'; if(location.hash !== '#/today') location.hash = '#/today'; rerender(); }); await p.waitForTimeout(900);
  const folded = await p.evaluate(() => { const d = document.querySelector('.today-ms'); const r = d.getBoundingClientRect();
    return {open: d.open, h: r.height,
      next: (d.querySelector('.today-ms-next')?.offsetParent ? d.querySelector('.today-ms-next').textContent : '').replace(/\s+/g, ' ').trim()}; });
  yes('it rests folded, to one line, when the house is opened', folded.open === false && folded.h < 60, folded);
  /* the skill level is due in two days, the proofs in three: the next date is the skill's */
  yes('  folded, it still says which date is next', ids.skill ? /next: .+, in 2 days/.test(folded.next) : /next: Proofs to the printer, in 3 days/.test(folded.next), folded.next);
  await p.evaluate(() => { S.settings.todayView = 'tasks'; location.hash = '#/today/tasks'; }); await p.waitForTimeout(1000);
  yes('it is folded in the other views', await p.evaluate(() => document.querySelector('.today-ms') && !document.querySelector('.today-ms').open));
  await p.evaluate(() => { location.hash = '#/today'; S.settings.todayView = 'do'; }); await p.waitForTimeout(900);
  await p.click('.today-ms-sum'); await p.waitForTimeout(400);
  yes('a press on its heading opens it', await p.evaluate(() => document.querySelector('.today-ms').open));
  await p.evaluate(() => rerender()); await p.waitForTimeout(600);
  yes('  and it stays open while the page is used (a redraw does not snap it shut)', await p.evaluate(() => document.querySelector('.today-ms').open));
  await p.click('.today-ms-sum'); await p.waitForTimeout(400);
  yes('another press folds it again', await p.evaluate(() => !document.querySelector('.today-ms').open));
  await p.click('.today-ms-sum'); await p.waitForTimeout(400);
  await p.click(`.today-ms [data-plmsfilter="${ids.m}"] .pl-mslabel`); await p.waitForTimeout(1100);
  yes('  and its pins still open their work', await p.evaluate(m => location.hash === '#/today/tasks' && (S._planFilter || {}).milestone === m, ids.m));
  /* left open, and the house opened again: folded */
  await p.evaluate(() => { saveNow(); S.settings.todayView = 'do'; }); await p.waitForTimeout(500);
  /* a real reload: going to the same page with only the #hash changed is not one */
  await p.goto('file://' + path.join(__dirname, 'index.html') + '#/today'); await p.reload(); await p.waitForTimeout(1600);
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil').forEach(n => n.remove());
    S.settings.todayView = 'do'; if(location.hash !== '#/today') location.hash = '#/today'; rerender(); }); await p.waitForTimeout(900);
  yes('left open, it is folded again the next time the house is opened', await p.evaluate(() => !document.querySelector('.today-ms').open));

  console.log('\n5. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
