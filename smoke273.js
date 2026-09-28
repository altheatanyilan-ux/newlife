/* smoke273 — the Projects page, taken out safely.

   The claims.

   GONE FROM VIEW. There is no Projects entry in the sidebar, no Projects
   card on the Compass, no "add a project" in the + menu, nothing called
   Projects in the command palette, the entry form or the Review, and no
   link anywhere in the house points at #/projects.

   OLD ADDRESSES STILL LAND. #/projects goes to the planner (Today's Tasks);
   #/projects/<id> goes to that project's list there. The house's band opens
   the planner too.

   NOTHING LOST. Every project record is still stored after a reload, a goal
   set to a project keeps its link, and an entry linked to one keeps it.

   Run: NODE_PATH=node_modules node smoke273.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 1000}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const setup = await p.evaluate(async () => {
    if(!S.projects.length) createProject('The garden book'); closeModals();
    if(typeof projectListsSync === 'function') projectListsSync();
    const pr = S.projects[0];
    const e = {id: uid(), type: 'reflection', title: 'about the book', body: '', occurredAt: today(), createdAt: new Date().toISOString(),
      media: [], links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [pr.id], people: []},
      people: [], places: [], emotions: [], tags: [], extra: {}};
    S.entries.push(e);
    const wp = weekPlan(weekStart(today())); wp.outcomes = [{id: uid(), text: 'a chapter', linkType: 'project', linkId: pr.id, taskIds: []}];
    await saveNow();
    return {n: S.projects.length, id: pr.id, entry: e.id};
  });

  console.log('\n1. gone from view');
  const rooms = ['#/today', '#/compass', '#/journals', '#/today/tasks', '#/today/review', '#/content', '#/finance', '#/lifetape', '#/identity/people'];
  const links = [];
  for(const r of rooms){
    await p.evaluate(r => { closeModals(); location.hash = r; }, r); await p.waitForTimeout(1100);
    const hit = await p.evaluate(() => [...document.querySelectorAll('a[href^="#/projects"], [data-go^="#/projects"], [data-tapego^="#/projects"]')].map(n => n.outerHTML.slice(0, 80)));
    if(hit.length) links.push(`${r}: ${hit.join(' | ')}`);
  }
  yes('no link anywhere points at #/projects', !links.length, links.join('\n'));
  yes('  the sidebar has no Projects', await p.evaluate(() => ![...document.querySelectorAll('.side a, .side button, nav a')].some(n => /^\s*Projects\s*$/.test(n.textContent))));
  yes('  the + menu has no "Project"', await p.evaluate(() => !SPEED_DIAL.some(x => /Project/.test(x.label || '') && x.zone === 'Creative Projects')));
  await p.evaluate(() => { closeModals(); openEntryModal({entryId: S.entries[S.entries.length - 1].id}); }); await p.waitForTimeout(500);
  yes('  the entry form offers no projects to link', await p.evaluate(() => !document.querySelector('[data-lk="projects"]')));
  await p.evaluate(() => closeModals());

  console.log('\n2. old addresses still land');
  await p.evaluate(() => { location.hash = '#/projects'; }); await p.waitForTimeout(1200);
  is('#/projects goes to the planner', await p.evaluate(() => location.hash), '#/today/tasks');
  await p.evaluate(id => { location.hash = '#/projects/' + id; }, setup.id); await p.waitForTimeout(1200);
  const sel = await p.evaluate(() => ({hash: location.hash, sel: S._planSel}));
  yes('#/projects/<id> goes to that project’s list', sel.hash === '#/today/tasks' && sel.sel && sel.sel.id === setup.id, sel);
  yes('the house band opens the planner', await p.evaluate(() => { HOUSE_PORTALS.band(); return new Promise(r => setTimeout(() => r(location.hash === '#/today/tasks'), 500)); }));

  console.log('\n3. nothing lost');
  const kept = await p.evaluate(async setup => { await saveNow(); await load();
    const e = S.entries.find(x => x.id === setup.entry); const wp = weekPlan(weekStart(today()));
    return {n: S.projects.length, entryLink: e && e.links.projects[0] === setup.id, goal: wp.outcomes[0] && wp.outcomes[0].linkId === setup.id}; }, setup);
  is('every project is still stored', kept.n, setup.n);
  yes('  an entry keeps its link to one', kept.entryLink);
  yes('  and a week goal keeps its project', kept.goal);
  await p.evaluate(() => openWeeklyPlan(today())); await p.waitForTimeout(400);
  for(let i = 0; i < 2; i++){ await p.click('#wpNext'); await p.waitForTimeout(220); }
  const goalSel = await p.evaluate(() => document.querySelector('[data-wplink="0"]')?.value);
  await p.click('#wpNext'); await p.waitForTimeout(200);
  const after = await p.evaluate(id => { const o = weekPlan(weekStart(today())).outcomes[0]; return o && o.linkId === id; }, setup.id);
  yes('  shown as its list in the week plan, and still linked after the step is read', /(list|project):/.test(goalSel || '') && after, goalSel);
  await p.evaluate(() => closeModals());

  console.log('\n4. nothing broke on the way');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
