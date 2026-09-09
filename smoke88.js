/* The Planning room: the data it shares, the sentence it reads, the five
   views, the timer, the habits it does not duplicate, and the numbers. */
const { chromium } = require('playwright');
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1500,height:1100});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(2600);
  const go = async () => { await page.evaluate(() => { location.hash = '#/planning'; rerender(); });
    await page.waitForTimeout(1100);
    await page.evaluate(() => document.querySelectorAll('.toast,.toast-wrap').forEach(n => n.remove())); };
  await go();

  console.log('\n1. the room exists and is furnished');
  const seed = await page.evaluate(() => ({nav: !!document.querySelector('[data-page="planning"]'),
    tasks: S.tasks.length, lists: S.planning.lists.length, folders: S.planning.folders.length,
    tags: S.planning.tags.length, sections: S.planning.lists.reduce((a,l)=>a+l.sections.length,0),
    rows: document.querySelectorAll('.pt-row').length, smart: document.querySelectorAll('[data-plsel^="smart:"]').length}));
  ok('a nav entry', seed.nav, 'no Planning in the sidebar');
  ok('seeded with lists, folders, tags and sections',
     seed.lists >= 6 && seed.folders === 2 && seed.tags === 5 && seed.sections >= 5, JSON.stringify(seed));
  ok('and with tasks', seed.tasks >= 15, 'saw ' + seed.tasks);
  ok('every smart view is offered', seed.smart >= 8, 'saw ' + seed.smart);

  console.log('\n2. the sentence, read as a task');
  const parsed = await page.evaluate(() => {
    const p = parseQuickTask('Prepare contract review tomorrow at 2pm #work !high ^Work ~2h / bring the red folder');
    return {text:p.text, day:p.day, time:p.dueTime, prio:p.priority, tags:p.tags, list:p.listName, dur:p.duration, desc:p.desc,
      tomorrow: addDays(today(), 1)};
  });
  ok('the title has the tokens taken out of it', parsed.text === 'Prepare contract review', parsed.text);
  ok('tomorrow at 2pm', parsed.day === parsed.tomorrow && parsed.time === '14:00', JSON.stringify(parsed));
  ok('#tag, !priority, ^list, ~duration', parsed.tags[0] === 'work' && parsed.prio === 3
     && parsed.list === 'Work' && parsed.dur === 120, JSON.stringify(parsed));
  ok('and the note after the slash', parsed.desc === 'bring the red folder', parsed.desc);
  const more = await page.evaluate(() => ['*daily', '*every 3 days', 'next monday', 'in 2 weeks', 'friday 9am', 'Jan 15']
    .map(s => { const p = parseQuickTask('x ' + s); return {s, rec:p.recurrence?.pattern, iv:p.recurrence?.interval, day:p.day, t:p.dueTime}; }));
  ok('recurrence and the date words', more[0].rec === 'daily' && more[1].rec === 'daily' && more[1].iv === 3
     && more[2].day && more[3].day && more[4].t === '09:00' && more[5].day, JSON.stringify(more));

  console.log('\n3. adding one, and the preview before it lands');
  await page.fill('.pq-input', 'Ring the bank monday !med #call ~30m');
  await page.waitForTimeout(350);
  const prev = await page.evaluate(() => Array.from(document.querySelectorAll('.qp-chip')).map(c => c.textContent.trim()));
  ok('what it understood is shown back', prev.length >= 3, JSON.stringify(prev));
  const before = await page.evaluate(() => S.tasks.length);
  await page.keyboard.press('Enter'); await page.waitForTimeout(800);
  const made = await page.evaluate(() => { const t = S.tasks.find(x => x.text === 'Ring the bank');
    return t ? {p:t.priority, tags:t.tags, dur:t.duration, day:!!t.day} : null; });
  ok('Enter commits it, parsed', made && made.p === 2 && made.tags.includes('call') && made.dur === 30 && made.day,
     JSON.stringify(made));
  ok('and the count went up', await page.evaluate(() => S.tasks.length) === before + 1, 'count unchanged');

  console.log('\n4. the five views');
  const views = {};
  for(const v of ['list','calendar','kanban','eisenhower','timeline']){
    await page.evaluate(x => planSetView(x), v); await page.waitForTimeout(700);
    views[v] = await page.evaluate(() => ({view: planView(),
      list: document.querySelectorAll('.pt-row').length, cal: document.querySelectorAll('.pc-cell').length,
      board: document.querySelectorAll('.pk-col').length, quad: document.querySelectorAll('.pe-quad').length,
      bars: document.querySelectorAll('.pl-gbar').length}));
  }
  ok('list shows rows', views.list.list > 0, JSON.stringify(views.list));
  ok('calendar shows a month of cells', views.calendar.cal >= 28, JSON.stringify(views.calendar));
  ok('the board has columns', views.kanban.board === 3, JSON.stringify(views.kanban));
  ok('the matrix has four quadrants', views.eisenhower.quad === 4, JSON.stringify(views.eisenhower));
  ok('the timeline draws bars', views.timeline.bars > 0, JSON.stringify(views.timeline));
  /* the header toolbar and the gantt bar once shared a class, and the second
     rule tore the toolbar out of the page */
  const barPos = await page.evaluate(() => { const b = document.querySelector('.pl-bar');
    return b ? {pos: getComputedStyle(b).position, inHeader: !!b.closest('.pl-header')} : null; });
  ok('the sort row is still inside the header', barPos && barPos.inHeader && barPos.pos === 'static', JSON.stringify(barPos));

  console.log('\n5. the day timeline places a task at its hour, its height its length');
  await page.evaluate(() => { const t = S.tasks.find(x => !x.done);
    t.day = today(); t.dueTime = '09:00'; t.duration = 90; planSetSel('smart','today');
    S.planning.prefs.calMode = 'day'; planSetView('calendar'); });
  await page.waitForTimeout(900);
  const block = await page.evaluate(() => { const b = document.querySelector('.pc-block');
    return b ? {top: Math.round(parseFloat(b.style.top)), h: Math.round(parseFloat(b.style.height))} : null; });
  ok('09:00 sits nine hours down, 90 minutes stands 1.5 hours tall',
     block && block.top === 9 * 46 && block.h === Math.round(1.5 * 46), JSON.stringify(block));

  console.log('\n6. completing, and what a repeat does next');
  await page.evaluate(() => { planSetView('list'); planSetSel('smart','all'); });
  await page.waitForTimeout(800);
  const rep = await page.evaluate(() => {
    const t = S.tasks.find(x => x.recurrence && x.recurrence.pattern === 'daily' && !x.done);
    const n0 = S.tasks.length, was = t.day;
    planSetDone(t, true);
    const next = S.tasks.find(x => x.text === t.text && !x.done);
    return {grew: S.tasks.length === n0 + 1, was, next: next?.day, done: t.done, stillRepeats: !!next?.recurrence};
  });
  ok('finishing a repeat books the next one', rep.grew && rep.next > rep.was && rep.stillRepeats, JSON.stringify(rep));
  const after = await page.evaluate(() => {
    const t = S.tasks.find(x => x.recurrence?.pattern === 'after_completion') ||
      Object.assign(S.tasks.find(x => !x.done && !x.recurrence),
        {recurrence:{pattern:'after_completion', interval:10, daysOfWeek:[], endDate:null, endAfter:null}, day: addDays(today(), -30)});
    return {next: planNextDue(t), tenOut: addDays(today(), 10)};
  });
  ok('"after it is done" counts from today, not from the date it missed',
     after.next === after.tenOut, JSON.stringify(after));

  console.log('\n7. it shares the habits, it does not copy them');
  const hab = await page.evaluate(() => {
    if(!S.habits.length) S.habits.push({id:'hx', name:'Walk', icon:'◍', color:'#7f916a', dimension:'physical',
      kind:'expenditure', timeOfDay:'morning', freq:{type:'daily',days:[],count:1}, order:0, archived:false,
      negative:false, min:'', ideal:'', prompt:'', stackAfter:null, links:{values:[],skills:[]}});
    const h = S.habits[0], T = today();
    delete (S.habitLog[T] || {})[h.id];
    planSetSel('smart','habits'); return {id:h.id, before: !!habitDone(h, T)};
  });
  await page.waitForTimeout(900);
  ok('the habits view renders cards', await page.evaluate(() => document.querySelectorAll('.ph-card').length) > 0, 'no cards');
  await page.evaluate(() => document.querySelector('[data-phtick]')?.click());
  await page.waitForTimeout(600);
  const shared = await page.evaluate(() => { const T = today();
    return {log: !!S.habitLog[T]?.[S.habits[0].id], stores: !!S.habitLog && !S.planning.habits}; });
  ok('ticking writes to the habit log the rings already use', shared.log, 'nothing written to S.habitLog');
  ok('and there is no second habit store', shared.stores, 'S.planning.habits exists — habits were duplicated');

  console.log('\n8. the timer runs, logs, and links');
  const timer = await page.evaluate(async () => {
    const t = S.tasks.find(x => !x.done);
    FocusTimer.setTask(t.id);
    const linkedBeforeStart = FocusTimer.state().taskId === t.id;
    FocusTimer.start();
    await new Promise(r => setTimeout(r, 1300));
    const s = FocusTimer.state();
    FocusTimer.stop(false);
    return {linkedBeforeStart, running: s.running, counted: s.left < 25 * 60, phase: s.phase};
  });
  ok('a task chosen before the start is kept', timer.linkedBeforeStart, 'the link was dropped');
  ok('and it counts down', timer.running && timer.counted, JSON.stringify(timer));

  console.log('\n9. the soundscapes were added to the one that already existed');
  const snd = await page.evaluate(() => ({kinds: AMBIENT_KINDS.map(k => k.id),
    global: !!document.querySelector('#btnAmbient')}));
  ['brown','rain','ocean','piano','musicbox'].forEach(k =>
    ok('the old ' + k + ' is still there', snd.kinds.includes(k), JSON.stringify(snd.kinds)));
  ok('and six more joined them', ['pink','white','fire','cafe','forest','library'].every(k => snd.kinds.includes(k)),
     JSON.stringify(snd.kinds));
  ok('through the same global toggle', snd.global, 'no #btnAmbient');

  console.log('\n10. the statistics');
  await page.evaluate(() => planSetSel('smart','stats')); await page.waitForTimeout(900);
  const stats = await page.evaluate(() => ({tiles: document.querySelectorAll('.ps-tile').length,
    bars: document.querySelectorAll('.ps-bar').length, heat: document.querySelectorAll('.ph-heatgrid').length,
    score: planProductivityScore(today())}));
  ok('tiles, bars, a heatmap and a score', stats.tiles >= 6 && stats.bars > 0 && stats.heat > 0
     && stats.score >= 0 && stats.score <= 100, JSON.stringify(stats));

  console.log('\n11. the keyboard, and the keyboard staying out of the way');
  await page.evaluate(() => planSetSel('smart', 'today'));      // off Statistics, which has no add line
  await go();
  const vk = [];
  for(const [k, want] of [['2','calendar'],['3','kanban'],['4','eisenhower'],['5','timeline'],['1','list']]){
    await page.keyboard.press(k); await page.waitForTimeout(420);
    vk.push(await page.evaluate(() => planView()) === want);
  }
  ok('1–5 switch views', vk.every(Boolean), vk.join(','));
  await page.keyboard.press('n'); await page.waitForTimeout(400);
  ok('n reaches for the add line', await page.evaluate(() => document.activeElement?.classList.contains('pq-input')), 'focus elsewhere');
  await page.keyboard.type('milk and 3 eggs');
  await page.waitForTimeout(400);
  const typed = await page.evaluate(() => ({v: planView(), val: document.querySelector('.pq-input').value}));
  ok('typing a 3 into the box does not jump to the board',
     typed.v === 'list' && typed.val === 'milk and 3 eggs', JSON.stringify(typed));

  console.log('\n12. what the other rooms can see');
  await page.evaluate(() => { const t = S.tasks.find(x => !x.done);
    t.links.projects = [S.projects[0].id]; t.links.skills = [S.skills[0].id]; saveNow(); });
  const seen = {};
  for(const [route, open] of [['#/projects', 'openProjectPanel(S.projects[0].id)'], ['#/skills', 'openSkillPanel(S.skills[0].id)']]){
    await page.evaluate(h => { location.hash = h; rerender(); }, route); await page.waitForTimeout(800);
    await page.evaluate(o => eval(o), open); await page.waitForTimeout(700);
    seen[route] = await page.evaluate(() => document.querySelectorAll('#panel .pl-lrow').length);
    await page.evaluate(() => closePanel()); await page.waitForTimeout(300);
  }
  ok('a linked task shows on its project and its skill',
     seen['#/projects'] > 0 && seen['#/skills'] > 0, JSON.stringify(seen));
  await page.evaluate(() => { location.hash = '#/today'; rerender(); }); await page.waitForTimeout(900);
  ok('Today points at the whole list', await page.evaluate(() => !!document.querySelector('a[href="#/planning/today"]')), 'no link');

  console.log('\n13. the old readers of S.tasks still work');
  const old = {};
  for(const r of ['#/today','#/projects','#/people','#/compass']){
    await page.evaluate(h => { location.hash = h; rerender(); }, r); await page.waitForTimeout(700);
    old[r] = await page.evaluate(() => !!document.querySelector('.page'));
  }
  ok('every room that reads tasks still renders', Object.values(old).every(Boolean), JSON.stringify(old));
  const shape = await page.evaluate(() => { const t = S.tasks[0];
    return {text: 'text' in t, day: 'day' in t, done: 'done' in t, priority: 'priority' in t, subtasks: Array.isArray(t.subtasks)}; });
  ok('a task kept its three old fields and grew the new ones',
     shape.text && shape.day && shape.done && shape.priority && shape.subtasks, JSON.stringify(shape));

  console.log('\n14. nothing threw');
  ok('no page or console errors', errors.length === 0, errors.join(' | '));

  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
