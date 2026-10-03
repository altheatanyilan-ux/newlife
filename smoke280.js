/* smoke280 — the week in stages, and planning a day from them.

   The claims.

   A STEP OF ITS OWN. Planning the week has six steps now; the fourth, straight
   after the goals and the work under them, is "The week in stages". With no
   stages yet it offers to cut the week into one, two or three runs of days,
   as even as seven allows; a strip of the seven days says which stage has
   each.

   EACH STAGE ITS SHARE OF THE WORK. Under every stage is the week's work —
   what was put under its goals, each row saying which goal — to be ticked for
   those days. A task can be in two stages, and the row says so. Other open
   work can be found by name and ticked in; a new task written in the same
   box and Entered goes into the Inbox and the stage. The step says how much
   of the week's work is in no stage yet. Naming a stage after ticking loses
   nothing, and it all survives a reload.

   A DAY IS PLANNED FROM ITS STAGE. Planning a day that falls in a stage opens
   its third step on that stage — its name, its days, its focus and its work —
   then the rest of the week's work, and only then whatever else has no day.
   A task already on the day is shown as placed; ticking one puts it on the
   day. A day in another stage shows that stage's work.

   TODAY SAYS WHICH STAGE. The week card's "now" line says which stage of how
   many, and how much of its work is done, with what is still open.

   AND A PLAN FROM BEFORE still opens: a period written without any work
   keeps what it had and simply has none under it.

   Run: NODE_PATH=node_modules node smoke280.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 1000}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  /* a Tuesday, so tomorrow is still in the first of three stages */
  await p.clock.install({time: new Date('2026-10-06T10:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.toast').forEach(n => n.remove()); });

  const ids = await p.evaluate(() => {
    const mk = text => { const t = newPlanTask(text, '', {listId: 'inbox'}); t.day = ''; t.doDay = ''; S.tasks.push(t); return t.id; };
    const o = {a: mk('Draft the essay'), b: mk('Edit the essay'), c: mk('Pack the kitchen'), d: mk('Book the van'),
      e: mk('Renew the passport'), f: mk('Water the plants')};
    const wk = weekStart(today()); S.weekPlans = S.weekPlans || {}; delete S.weekPlans[wk];
    const wp = weekPlan(wk);
    wp.outcomes = [{id: uid(), text: 'the essay', linkType: '', linkId: null, taskIds: [o.a, o.b]},
                   {id: uid(), text: 'the move', linkType: '', linkId: null, taskIds: [o.c, o.d]}];
    saveNow(); location.hash = '#/today';
    return o;
  });
  await p.waitForTimeout(600);
  await p.evaluate(() => openWeeklyPlan(today())); await p.waitForTimeout(400);
  for(let i = 0; i < 3; i++){ await p.click('#wpNext'); await p.waitForTimeout(220); }

  console.log('\n1. a step of its own, straight after the goals');
  const s4 = await p.evaluate(() => ({h: document.querySelector('.modal h2').textContent,
    step: [...document.querySelectorAll('.modal .mono')].map(n => n.textContent).find(t => /step \d of \d/.test(t)),
    splits: [...document.querySelectorAll('[data-wpsplit]')].map(n => n.textContent.trim())}));
  is('step 4 of 6 is "The week in stages"', [s4.h, s4.step], ['The week in stages', 'step 4 of 6']);
  is('  with no stages yet, it offers to cut the week', s4.splits, ['one stage — the whole week', 'two stages', 'three stages']);
  await p.click('[data-wpsplit="3"]'); await p.waitForTimeout(250);
  const wk = await p.evaluate(() => { const w = weekStart(today()); return [0,1,2,3,4,5,6].map(n => addDays(w, n)); });
  is('three stages, as even as seven allows', await p.evaluate(() => weekPlan(weekStart(today())).periods.map(x => [x.from, x.to])),
    [[wk[0], wk[2]], [wk[3], wk[4]], [wk[5], wk[6]]]);
  is('  and the strip gives every day its stage', await p.$$eval('.wp-weekstrip .wp-wstage', n => n.map(x => x.textContent)),
    ['Stage 1', 'Stage 1', 'Stage 1', 'Stage 2', 'Stage 2', 'Stage 3', 'Stage 3']);
  yes('  the focus box of the first has the caret', await p.evaluate(() => document.activeElement?.dataset.wpperfocus === '0'));
  yes('it says how much of the week’s work is in no stage yet', /4 of the week’s things are in no stage yet/.test(await p.$eval('.wp-unplaced', n => n.textContent)));

  console.log('\n2. each stage its share of the work');
  const rows1 = await p.$$eval('[data-wpplist] ', ls => [...ls[0].querySelectorAll('[data-wpprow]')].map(r => ({id: r.dataset.wpprow, goal: r.querySelector('.wp-pgoal')?.textContent || ''})));
  is('under a stage, the week’s work, each row with its goal', rows1.map(r => [r.id, r.goal]),
    [[ids.a, '◆ the essay'], [ids.b, '◆ the essay'], [ids.c, '◆ the move'], [ids.d, '◆ the move']]);
  await p.fill('[data-wppername="0"]', 'the essay push');
  await p.fill('[data-wpperfocus="0"]', 'the essay, before anything else');
  const tick = async (stage, id) => { await p.click(`.wp-stage:nth-child(${stage}) [data-wpptask][value="${id}"]`); await p.waitForTimeout(220); };
  await tick(1, ids.a); await tick(1, ids.b); await tick(2, ids.c); await tick(2, ids.b);
  const st = await p.evaluate(() => weekPlan(weekStart(today())).periods.map(x => ({name: x.name, focus: x.focus, t: x.taskIds})));
  is('ticking gives the work to the stage', st.map(x => x.t), [[ids.a, ids.b], [ids.c, ids.b], []]);
  is('  and what was typed into the stage is kept across it', [st[0].name, st[0].focus], ['the essay push', 'the essay, before anything else']);
  const also = await p.evaluate(id => document.querySelector(`.wp-stage:nth-child(2) [data-wpprow="${id}"] .wp-palso`)?.textContent || '', ids.b);
  is('a task in two stages says where else it is', also, 'also the essay push');
  await p.fill('.wp-stage:nth-child(2) [data-wppfind]', 'passport'); await p.waitForTimeout(250);
  const found = await p.$$eval('.wp-stage:nth-child(2) [data-wppfound] [data-wpprow]', r => r.map(x => x.dataset.wpprow));
  is('other open work is found by name', found, [ids.e]);
  await p.click(`.wp-stage:nth-child(2) [data-wppfound] [value="${ids.e}"]`); await p.waitForTimeout(250);
  yes('  and ticked into the stage', await p.evaluate(id => weekPlan(weekStart(today())).periods[1].taskIds.includes(id), ids.e));
  await p.fill('.wp-stage:nth-child(2) [data-wppfind]', 'Call the removals ~20m'); await p.press('.wp-stage:nth-child(2) [data-wppfind]', 'Enter'); await p.waitForTimeout(300);
  const nt = await p.evaluate(() => { const t = S.tasks.find(x => x.text === 'Call the removals'); const P = weekPlan(weekStart(today()));
    return t && {inbox: (t.listId || 'inbox') === 'inbox', mins: t.duration, inStage: P.periods[1].taskIds.includes(t.id),
      caret: document.activeElement?.dataset.wppfind === P.periods[1].id, empty: document.activeElement?.value === ''}; });
  is('a new task written there goes into the Inbox and the stage, the grammar read', nt, {inbox: true, mins: 20, inStage: true, caret: true, empty: true});
  yes('what is in no stage is now just the van', /1 of the week’s things is in no stage yet: Book the van/.test(await p.$eval('.wp-unplaced', n => n.textContent)));

  console.log('\n3. the recap, and a reload');
  await p.click('#wpNext'); await p.waitForTimeout(220);
  is('then what would make it a win', await p.$eval('.modal h2', h => h.textContent), 'What would make this a win?');
  await p.click('#wpNext'); await p.waitForTimeout(220);
  const recap = await p.$eval('.plan-recap', n => n.textContent.replace(/\s+/g, ' '));
  yes('the recap lists the stages, with how much work each has', /In stages/.test(recap) && /the essay push/.test(recap) && /2 things/.test(recap) && /4 things/.test(recap), recap);
  await p.click('#wpNext'); await p.waitForTimeout(400);
  const saved = await p.evaluate(async () => { await saveNow(); await load(); return weekPlan(weekStart(today())).periods.map(x => [x.name, x.taskIds.length]); });
  is('the stages and their work survive a reload', saved, [['the essay push', 2], ['', 4], ['', 0]]);

  console.log('\n4. a day is planned from its stage');
  const tom = wk[2];
  await p.evaluate(([id, d]) => { findTaskRef(id).task.doDay = d; saveNow(); }, [ids.b, tom]);
  await p.evaluate(d => planMyDay(d), tom); await p.waitForTimeout(400);
  for(let i = 0; i < 2; i++){ await p.click('#pmNext'); await p.waitForTimeout(200); }
  const s3 = await p.evaluate(() => {
    const groups = [...document.querySelectorAll('.plan-week-pick .pick-group')];
    return {h: document.querySelector('.modal h2').textContent,
      label: groups[0]?.querySelector('.pick-glabel')?.textContent.replace(/\s+/g, ' ').trim(),
      focus: groups[0]?.querySelector('.plan-stage-focus')?.textContent || '',
      stage: [...(groups[0]?.querySelectorAll('.pick-row') || [])].map(r => r.dataset.pickrow || 'placed:' + r.querySelector('b').textContent),
      rest: [...(groups[1]?.querySelectorAll('.pick-row') || [])].map(r => r.dataset.pickrow),
      pile: [...document.querySelectorAll('.pick-group:not(.plan-stage) [data-pickdel]')].map(x => x.dataset.pickdel)};
  });
  is('the third step asks what from the week the day is for', s3.h, 'What from the week is tomorrow’s?'.replace('’', "'"));
  yes('  opening on the stage the day is in, with its focus', /^the essay push · Mon–Wed/.test(s3.label) && s3.focus === 'the essay, before anything else', s3);
  is('  and its work, a task already on the day shown as placed', s3.stage, [ids.a, 'placed:Edit the essay']);
  yes('then the rest of the week’s work', [ids.c, ids.d, ids.e].every(id => s3.rest.includes(id)) && !s3.rest.includes(ids.a), s3.rest);
  yes('and only after them, what else has no day — without the week’s work in it twice', s3.pile.includes(ids.f) && !s3.pile.includes(ids.a) && !s3.pile.includes(ids.c), s3.pile);
  await p.click(`.plan-stage [data-pick2="${ids.a}"]`); await p.waitForTimeout(100);
  for(let i = 0; i < 3; i++){ await p.click('#pmNext'); await p.waitForTimeout(200); }
  is('ticking one puts it on the day', await p.evaluate(id => findTaskRef(id).task.doDay, ids.a), tom);
  await p.evaluate(d => planMyDay(d), wk[3]); await p.waitForTimeout(400);
  for(let i = 0; i < 2; i++){ await p.click('#pmNext'); await p.waitForTimeout(200); }
  const thu = await p.evaluate(() => [...document.querySelectorAll('.plan-stage .pick-row')].map(r => r.dataset.pickrow).filter(Boolean));
  yes('a day in the second stage opens on that stage’s work', thu.includes(ids.c) && thu.includes(ids.e) && !thu.includes(ids.a), thu);
  await p.evaluate(() => closeModals());

  console.log('\n5. Today says which stage it is');
  await p.evaluate(async () => { S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); await new Promise(r => setTimeout(r, 900));
    const s = document.querySelector('#t-plan'); if(s) s.open = true; });
  /* switch to the "This week" tab which shows the week carry with stage info */
  const weekTab = await p.$('[data-plansec="week"]');
  if(weekTab){ await weekTab.click(); await p.waitForTimeout(300); }
  const now = await p.evaluate(() => document.querySelector('.wk-carry .wk-period.now')?.textContent.replace(/\s+/g, ' ').trim() || '');
  yes('"now · stage 1 of 3", its days and name, and how much of its work is done', /^now · stage 1 of 3 · Mon–Wed · the essay push · 0 of 2 done/.test(now), now);
  yes('  with what is still open', /Draft the essay · Edit the essay/.test(now), now);
  await p.evaluate(async id => { setTaskDone(id, true); rerender(); await new Promise(r => setTimeout(r, 600)); }, ids.a);
  yes('finishing one counts it', /1 of 2 done/.test(await p.evaluate(() => document.querySelector('.wk-carry .wk-period.now')?.textContent || '')));

  console.log('\n6. a plan from before still opens');
  const old = await p.evaluate(() => { const wk2 = addDays(weekStart(today()), 14);
    S.weekPlans[wk2] = {theme: '', outcomes: [], periods: [{id: 'p-old', from: wk2, to: addDays(wk2, 2), name: 'old', focus: 'as it was'}]};
    const x = weekPlan(wk2).periods[0]; return [x.name, x.focus, x.taskIds]; });
  is('a period written without work keeps what it had, with none under it', old, ['old', 'as it was', []]);

  console.log('\n7. nothing broke on the way');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
