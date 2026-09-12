/* smoke125 — planning tomorrow: the waiting step shows undated work, by list */
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
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  /* a house with two lists, some undated work in each, and one task that has
     already been given a day */
  const set = await p.evaluate(() => {
    const st = planState();
    const a = planNewList('Writing'), c = planNewList('Errands');
    const mk = (text, listId, day) => { const t = {id: uid(), text, listId, day: day || '', done:false,
      order:0, priority:'', subtasks:[], links:{}, notes:''}; S.tasks.push(t); return t.id; };
    const ids = {
      w1: mk('Draft the opening', a.id),
      w2: mk('Read the Maltz chapter', a.id),
      e1: mk('Post the parcel', c.id),
      dated: mk('Already has a day', c.id, addDays(today(), 1)),
      done: mk('Finished long ago', c.id)
    };
    byId(S.tasks, ids.done).done = true;
    saveNow();
    return {ids, writing: a.id, errands: c.id, wName: a.name, eName: c.name};
  });
  await p.waitForTimeout(500);

  console.log('\n1. the step asks about what has no day on it');
  await p.evaluate(() => planMyDay(addDays(today(), 1))); await p.waitForTimeout(900);
  const next = async () => { await p.click('#pmNext'); await p.waitForTimeout(600); };
  await next(); await next();   // step 1 -> 2 -> 3
  const heading = await p.evaluate(() => document.querySelector('.modal h2').textContent.trim());
  is('we are on the waiting step', heading, 'Anything waiting?');
  const shown = await p.$$eval('.modal .pick-row b', n => n.map(x => x.textContent.trim()));
  yes('undated work is offered', shown.includes('Draft the opening') && shown.includes('Post the parcel'), shown.join(' | '));
  yes('  a task that already carries a day is not', !shown.includes('Already has a day'), shown.join(' | '));
  yes('  nor is one already finished', !shown.includes('Finished long ago'), shown.join(' | '));
  yes('  and nothing is pre-ticked, since nothing here was chosen before',
      await p.evaluate(() => [...document.querySelectorAll('.modal [data-pick2]')].every(c => !c.checked)));

  console.log('\n2. they are gathered under the list each one lives in');
  const groups = await p.$$eval('.modal .pick-group', gs => gs.map(g => ({
    label: g.querySelector('.pick-glabel').firstChild.textContent.trim(),
    count: +g.querySelector('.pick-glabel .mono').textContent,
    rows: [...g.querySelectorAll('.pick-row b')].map(x => x.textContent.trim())
  })));
  yes('there is a group per list', groups.length >= 2, JSON.stringify(groups.map(g=>g.label)));
  const w = groups.find(g => g.label === set.wName), e = groups.find(g => g.label === set.eName);
  yes('  one named after the writing list', !!w, JSON.stringify(groups.map(g=>g.label)));
  is('  holding both of its tasks', w?.rows.length, 2);
  yes('  and the errands list holds only its undated one',
      e && e.rows.length === 1 && e.rows[0] === 'Post the parcel', JSON.stringify(e));
  yes('  each group says how many', w?.count === 2 && e?.count === 1, JSON.stringify({w:w?.count, e:e?.count}));

  console.log('\n3. ticking one parks it, and the dated one is left alone');
  await p.evaluate(i => document.querySelector(`.modal [data-pick2="${i}"]`).click(), set.ids.w1);
  await p.waitForTimeout(400);
  await next(); await next();   // through habits, to the last step
  await p.click('#pmNext'); await p.waitForTimeout(1200);
  const tomorrow = await p.evaluate(() => addDays(today(), 1));
  is('the ticked task is given the day', await p.evaluate(i => byId(S.tasks, i).day, set.ids.w1), tomorrow);
  is('  the unticked one keeps no day', await p.evaluate(i => byId(S.tasks, i).day, set.ids.w2), '');
  is('  and the already-dated one still has the day it had',
     await p.evaluate(i => byId(S.tasks, i).day, set.ids.dated), tomorrow);

  console.log('\n4. with nothing undated left, the step says so');
  /* project tasks live in phases, not in S.tasks — date those too, or the
     pool is not actually empty */
  await p.evaluate(() => { S.tasks.forEach(t => { if(!t.day) t.day = addDays(today(), 3); });
    (S.projects||[]).forEach(pr => (pr.phases||[]).forEach(ph => (ph.tasks||[]).forEach(t => {
      if(!t.day) t.day = addDays(today(), 3); }))); saveNow(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => planMyDay(addDays(today(), 1))); await p.waitForTimeout(900);
  await next(); await next();
  yes('it says everything is already placed', await p.evaluate(() =>
    /already placed/.test(document.querySelector('.modal').textContent)),
    await p.evaluate(() => document.querySelector('.modal .empty')?.textContent || 'no empty note'));
  await p.evaluate(() => closeModals());

  console.log('\n5. what you said mattered is shown before the work is chosen');
  /* a skill in focus, an active project and a piece being written never appear
     in a list of tasks, so a week could pass without an hour going to any of
     them and nothing in this flow would have said so */
  await p.evaluate(() => planMyDay(addDays(today(), 1))); await p.waitForTimeout(900);
  await p.click('#pmNext'); await p.waitForTimeout(600);
  await p.click('#pmNext'); await p.waitForTimeout(700);
  yes('they are on the waiting step', !!(await p.$('.plan-focus')));
  yes('  headed by what it is asking', await p.evaluate(() =>
    /What you said mattered/.test(document.querySelector('.plan-focus').textContent)));
  yes('  and why it is asking it', await p.evaluate(() =>
    /worth an hour of/.test(document.querySelector('.plan-focus').textContent)));
  const rows = await p.$$eval('.pf-row', n => n.map(x => ({
    name: x.querySelector('.pf-name').textContent.trim(),
    cold: x.querySelector('.pf-cold').textContent.trim(),
    go: x.getAttribute('href')})));
  yes('there is something in it', rows.length > 0, JSON.stringify(rows.slice(0,3)));
  yes('  each says how long since it was last touched',
      rows.every(r => /never|today|ago|yesterday|day|week|month/.test(r.cold)), JSON.stringify(rows.slice(0,3)));
  yes('  and each leads somewhere', rows.every(r => /^#\//.test(r.go || '')), JSON.stringify(rows.slice(0,3)));
  /* skills in focus, active projects and pieces mid-draft, and nothing else */
  const kinds = await p.evaluate(() => {
    const names = [...document.querySelectorAll('.pf-name')].map(x => x.textContent.trim());
    return {
      hasFocusSkill: focusSkills().some(s => names.includes(s.name)),
      noIdleProject: !S.projects.filter(x => x.status !== 'active').some(x => names.includes(x.name)),
    }; });
  yes('a skill in focus is among them', kinds.hasFocusSkill);
  yes('  and a project that is not active is not', kinds.noIdleProject);
  /* the coldest first: that is the one the question is really for */
  const colds = await p.evaluate(() => [...document.querySelectorAll('.pf-row')].map(x => {
    const t = x.querySelector('.pf-cold').textContent;
    if(/never/.test(t)) return 1e6;
    const m = t.match(/(\d+)/); return m ? +m[1] : 0; }));
  yes('  and the coldest is at the top', colds.length < 2 || colds[0] >= colds[colds.length-1],
      JSON.stringify(colds));
  await p.evaluate(() => closeModals());

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke125  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
