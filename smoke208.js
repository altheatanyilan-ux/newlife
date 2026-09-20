/* smoke208 — planning a week you could not have planned without thinking.

   The old weekly plan was one box: a theme, three sentences, a row of hours.
   You could fill it in in forty seconds and it would change nothing, because
   nothing it asked for was a decision. A theme is a mood. Three sentences
   with no work under them are three wishes.

   What a week actually needs deciding is three things.

   WHICH PARTS OF A LIFE GET IT. Said out loud, list by list, with what is
   open in each and what moved last week in front of you — because letting
   something lie by accident is how a year goes past, and letting it lie on
   purpose is a plan.

   WHAT IS BEING CARRIED, AND WHAT WOULD FINISH IT. A goal that names work
   already written down can be counted; a goal that names nothing cannot. So
   the work goes under the goal, and every day of the week can say how much of
   it has gone.

   AND WHAT WOULD MAKE IT A WIN. Written with the goals still on the screen,
   so it is about them.

   The claims below are mostly about the second of those, because it is the
   one carrying data — a goal holding task ids has to survive a redraw, a
   change of which list it is drawn from, a save, and a reload, and each of
   those is a place the ids could quietly be dropped.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const step = async (p, n) => p.evaluate(async n => {
  for(let i = 0; i < n; i++){ document.querySelector('#wpNext').click();
    await new Promise(r => setTimeout(r, 250)); }
}, n);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  /* a piece of last week to look back at, and some work to put under a goal */
  await p.evaluate(async () => {
    planState();
    const wk = weekStart(today()), last = addDays(wk, -7);
    S.weekPlans = S.weekPlans || {};
    S.weekPlans[last] = {theme:'the quiet one', outcomes:[
      {id:'og1', text:'close the books', linkType:'', linkId:null, taskIds:['w-1','w-2']}],
      energyBudget:{}, aims:{}, focus:[], win:'the books are closed', guard:'', setAt:last};
    const list = planLists()[0].id, other = (planLists()[1] || planLists()[0]).id;
    [['w-1','march takings', list, true], ['w-2','april takings', list, false],
     ['w-3','chase the supplier', list, false], ['w-4','read one chapter', other, false]]
      .forEach(([id, text, listId, done]) => {
        if(findTaskRef(id)) return;
        const t = planTaskDefaults({id, text, listId});
        t.done = done; if(done) t.doneAt = addDays(weekStart(today()), -3);
        S.tasks.push(t);
      });
    saveNow();
  });

  console.log('\n1. last week is in front of you before you plan this one');
  const look = await p.evaluate(async () => {
    openWeeklyPlan(today());
    await new Promise(r => setTimeout(r, 500));
    const t = document.querySelector('.modal').textContent.replace(/\s+/g, ' ');
    return {t, steps: /step 1 of 5/.test(t)};
  });
  yes('planning the week is a flow, not a box', look.steps, look.t.slice(0, 90));
  yes('  showing what last week said it was carrying',
    /close the books/.test(look.t), look.t.slice(0, 200));
  yes('  and how much of it actually went', /1 of 2 done/.test(look.t), look.t.slice(0, 300));
  yes('  and what you said would make it a win',
    /the books are closed/.test(look.t), look.t.slice(0, 300));

  console.log('\n2. each part of a life, and what it is owed');
  await step(p, 1);
  const aspects = await p.evaluate(async () => {
    const rows = [...document.querySelectorAll('.wp-aspect')];
    const names = rows.map(n => n.querySelector('b').textContent);
    const boxes = rows.map(n => !!n.querySelector('[data-wpaim]'));
    const stars = rows.map(n => !!n.querySelector('[data-wpfocus]'));
    const said = document.querySelector('.modal').textContent.replace(/\s+/g, ' ');
    return {names, all: boxes.every(Boolean) && stars.every(Boolean), said,
      lists: planLists().map(l => l.name)};
  });
  is('every list you keep is asked about', aspects.names, aspects.lists);
  yes('  each with somewhere to say what progress you want', aspects.all);
  yes('  and what is open in it, so the answer is not from memory',
    /\d+ open/.test(aspects.said), aspects.said.slice(0, 200));
  const starred = await p.evaluate(async () => {
    const first = document.querySelector('[data-wpfocus]');
    const id = first.dataset.wpfocus;
    document.querySelector(`[data-wpaim="${id}"]`).value = 'the accounts finally straight';
    first.click();
    await new Promise(r => setTimeout(r, 400));
    const wp = weekPlan(weekStart(today()));
    return {focus: wp.focus.slice(), aim: wp.aims[id], id,
      lit: !!document.querySelector(`[data-wpfocus="${id}"]`).classList.contains('on')};
  });
  is('starring one marks where the week goes', starred.focus, [starred.id]);
  yes('  and it shows as starred', starred.lit);
  /* starring redraws the row, and a half-typed aim beside it must survive */
  is('  without losing what you were typing beside it',
    starred.aim, 'the accounts finally straight');

  console.log('\n3. a goal carries the work that would finish it');
  await step(p, 1);
  const goal = await p.evaluate(async () => {
    const box = document.querySelector('[data-wpout="0"]');
    box.value = 'the books, closed';
    box.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 400));
    const sel = document.querySelector('[data-wplink="0"]');
    const opts = [...sel.options].map(o => o.value);
    sel.value = 'list:' + planLists()[0].id;
    sel.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 400));
    const offered = [...document.querySelectorAll('[data-wptask="0"]')].map(c => c.value);
    return {opts, offered, summary: document.querySelector('.wp-under summary').textContent.trim()};
  });
  yes('a goal can be put under a list or under a project',
    goal.opts.some(v => v.startsWith('list:')) && goal.opts.some(v => v.startsWith('project:')),
    JSON.stringify(goal.opts.slice(0, 4)));
  yes('  and then offers that list’s open work',
    goal.offered.includes('w-2') && goal.offered.includes('w-3'), JSON.stringify(goal.offered));
  /* and only that list's: a goal put under the bar's accounts offering the
     reading list is the whole sorting undone */
  yes('    and not another list\u2019s',
    !goal.offered.includes('w-4'), JSON.stringify(goal.offered));
  /* the point of the whole step: a goal you can count */
  yes('  work already finished is not offered again',
    !goal.offered.includes('w-1'), JSON.stringify(goal.offered));
  yes('  and it says nothing is under it yet', /nothing under it/.test(goal.summary), goal.summary);
  const put = await p.evaluate(async () => {
    for(const id of ['w-2', 'w-3']){
      const c = document.querySelector(`[data-wptask="0"][value="${id}"]`);
      c.checked = true; c.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 150));
    }
    const wp = weekPlan(weekStart(today()));
    return {ids: wp.outcomes[0].taskIds.slice(),
      summary: document.querySelector('.wp-under summary').textContent.trim(),
      prog: weekGoalProgress(wp.outcomes[0])};
  });
  is('putting work under it writes it down', put.ids, ['w-2', 'w-3']);
  yes('  and the goal says how much it is carrying', /2 things under it/.test(put.summary), put.summary);
  is('  which is a number, not a wish', put.prog, {done:0, total:2, lost:0});

  console.log('\n4. and what a win would be');
  await step(p, 1);
  const win = await p.evaluate(async () => {
    const t = document.querySelector('.modal').textContent.replace(/\s+/g, ' ');
    document.querySelector('#wpWin').value = 'both months reconciled and signed off';
    document.querySelector('#wpGuard').value = 'wednesday is gone to the inspection';
    return {t, goalShown: /the books, closed/.test(t)};
  });
  yes('the win is written with the goals still on the screen', win.goalShown, win.t.slice(0, 220));

  console.log('\n5. and it is all still there afterwards');
  await step(p, 2);
  const saved = await p.evaluate(async () => {
    await saveNow(); await load();
    const wp = weekPlan(weekStart(today()));
    return {win: wp.win, guard: wp.guard, focus: wp.focus.length,
      aims: Object.values(wp.aims).filter(Boolean),
      goal: wp.outcomes[0].text, under: wp.outcomes[0].taskIds.slice(),
      set: !!wp.setAt, closed: !document.querySelector('.modal')};
  });
  yes('the flow closes on the last step', saved.closed);
  is('  the win survives a reload', saved.win, 'both months reconciled and signed off');
  is('  and what would take it away', saved.guard, 'wednesday is gone to the inspection');
  is('  and what each part of a life is owed', saved.aims, ['the accounts finally straight']);
  is('  and the goal', saved.goal, 'the books, closed');
  is('  and the work under it', saved.under, ['w-2', 'w-3']);
  yes('  and the week is marked as planned', saved.set);

  console.log('\n6. the week answers back on any day of it');
  const shown = await p.evaluate(async () => {
    /* finishing one of the two, the way a week goes */
    const r = findTaskRef('w-2'); r.task.done = true; r.task.doneAt = today();
    await saveNow();
    location.hash = '#/today';
    rerender();
    await new Promise(r => setTimeout(r, 1500));
    const card = document.querySelector('.wk-carry');
    return {there: !!card, said: card ? card.textContent.replace(/\s+/g, ' ').trim() : '',
      button: !!document.querySelector('#planNextWeek')};
  });
  yes('today carries the week’s goals', shown.there, shown.said);
  yes('  with how much of each has gone', /1\/2/.test(shown.said), shown.said);
  yes('  and what a win would be', /both months reconciled/.test(shown.said), shown.said);
  /* The button used to appear on Sundays only. It is there every day now,
     and this run cannot prove that: the suite has no control of the clock,
     and the day it runs on decides which branch is taken. Asserted only
     where it is decidable \u2014 that the button is there at all. */
  yes('  and the week can be planned from here', shown.button);

  console.log('\n7. nothing broke on the way');
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
