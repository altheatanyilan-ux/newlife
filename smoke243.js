/* smoke243 — lists as projects.

   The claims.

   A PROJECT IS A LIST. After the move, every project has a Planning list
   with its own id, in the Projects folder; its phases are the list's
   sections; its tasks are ordinary Planning tasks, each exactly once, with
   the same counts done and open as before.

   NOTHING IS LOST. A copy of the projects and tasks is kept first; the old
   phase task arrays are left untouched; ids keep resolving — nods,
   links.projects, the finance stream, the project's page.

   IT IS ONE TASK, NOT TWO. Planning no longer shows a moved project's tasks
   twice; ticking a task in Planning ticks it on the project page and back.

   BOTH WAYS. Renaming the list renames the project; a phase added on the
   project page is a section in Planning; "make this a project" turns an
   ordinary list into one. The move runs again without adding anything. */
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);
const noDexie = h => h.replace(/\/\* ---- dexie \(inlined[\s\S]*?\/\* ---- end dexie ---- \*\//, '');

async function boot(p, url){ await p.goto(url); await p.waitForTimeout(1300); if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); } await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove())); }
/* projects in the shape they had before the move: tasks inside phases, no marks */
const seedOld = () => {
  const L = {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []};
  const mk = (name, phases) => ({id: 'prj_' + name.replace(/\W/g, '').toLowerCase(), name, description: '', tags: [], status: 'active', priority: 'P2', startDate: '2026-09-01', targetDate: '2026-12-01',
    phases: phases.map(([pn, tasks], i) => ({id: 'ph_' + name.slice(0, 3).toLowerCase() + i, name: pn, startDate: '2026-09-0' + (i + 1), endDate: '', tasks: tasks.map(([t, d, due], j) => ({id: 'pt_' + name.slice(0, 3).toLowerCase() + i + j, text: t, done: !!d, dueDate: due || null}))})),
    resources: [], linkedSkills: [], linkedVisionEra: null, notes: '', link: '', income: {model: '', current: 400, target: 1000, milestones: []}, createdAt: '2026-09-01'});
  const a = mk('Garden Book', [['Research', [['Read three books', true], ['Visit the botanic garden', false, '2026-10-02']]], ['Draft', [['Outline', false], ['Chapter one', false]]]]);
  const b = mk('Kitchen Shelf', [['Build', [['Buy timber', true], ['Cut and sand', true], ['Mount', false]]]]);
  /* a task already in S.tasks with the same id as a phase task: the move must not clobber it */
  S.tasks.push(Object.assign(newTask('an unrelated task that shares an id', ''), {id: 'pt_gar10'}));
  S.projects.push(a, b);
  S.nods.push({id: 'nod1', projectId: a.id, date: today(), text: 'a small step'});
  S.entries.push({id: 'e_prj', type: 'reflection', title: 'about the garden book', body: '', occurredAt: today(), createdAt: new Date().toISOString(), links: Object.assign({}, L, {projects: [a.id]}), tags: [], extra: {}});
  return [a.id, b.id];
};

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  for(const [label, html] of [['Dexie', null], ['the built-in fallback', noDexie]]){
    console.log(`\n— on ${label}`);
    const ctx = await b.newContext({viewport: {width: 1300, height: 950}}); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    let url = FILE;
    if(html){ const f = path.join(os.tmpdir(), 'smoke243-fallback.html'); fs.writeFileSync(f, html(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'))); url = 'file://' + f; }
    await boot(p, url);
    /* write the old shape straight to the database, as a site from before the move would have */
    const ids = await p.evaluate(async src => {
      const seed = new Function('return ' + src)();
      S.projects = S.projects.filter(x => x.movedTo); /* only the ones this test makes are unmoved */
      const ids = seed();
      const ratio = ids.map(id => { const pr = S.projects.find(x => x.id === id); const all = pr.phases.flatMap(ph => ph.tasks); return [all.filter(t => t.done).length, all.length]; });
      await saveNow(); await flushSave();
      return {ids, ratio};
    }, seedOld.toString());
    await boot(p, url);   /* the move runs at load, from what is on disk */
    const r = await p.evaluate(({ids}) => {
      const out = {};
      out.lists = ids.map(id => { const l = planList(id); return l && [l.folderId, l.projectId, l.sections.map(s => s.id)]; });
      out.phases = ids.map(id => S.projects.find(x => x.id === id).phases.map(ph => ph.id));
      out.tasks = ids.map(id => S.tasks.filter(t => t.listId === id).map(t => [t.text, t.sectionId, t.done]).sort((a, b) => a[0].localeCompare(b[0])));
      out.ratio = ids.map(id => { const x = projectTaskRatio(S.projects.find(y => y.id === id)); return [x.done, x.total]; });
      out.untouched = S.projects.find(x => x.id === ids[0]).phases[0].tasks.length === 2;
      out.snapshot = !!(S.projectsPremigration && S.projectsPremigration.projects.some(x => x.id === ids[0] && !x.movedTo));
      out.clash = S.tasks.filter(t => t.id === 'pt_gar10').map(t => t.text);
      out.mapped = S.tasks.filter(t => t.fromProject && t.fromProject.taskId === 'pt_gar10').map(t => t.id !== 'pt_gar10');
      out.dupes = allTaskRefs().filter(x => x.kind === 'project' && ids.includes(x.project.id)).length;
      out.nod = S.nods.filter(n => n.projectId === ids[0]).length && !!planList(S.nods.find(n => n.id === 'nod1').projectId);
      out.link = !!planList(S.entries.find(e => e.id === 'e_prj').links.projects[0]);
      out.moved = ids.map(id => !!S.projects.find(x => x.id === id).movedTo);
      return out;
    }, ids);
    is('each project has a list with its own id, in the Projects folder, its phases as sections', r.lists, ids.ids.map((id, i) => ['projects', id, r.phases[i]]));
    is('every phase task is a Planning task, once, in its phase', r.tasks.map(t => t.length), [4, 3]);
    is('  with the same done and total counts', r.ratio, ids.ratio);
    yes('the old phase task arrays are left as they were', r.untouched);
    yes('a copy of the projects and tasks was kept before the move', r.snapshot);
    is('a task that shared an id kept it; the moved one got a new id, and the mapping is recorded', [r.clash, r.mapped], [['an unrelated task that shares an id'], [true]]);
    is('Planning shows each task once, not a second project row', r.dupes, 0);
    yes('nods and links.projects still resolve', r.nod && r.link);
    const again = await p.evaluate(() => { const n = S.tasks.length; const m = projectListsSync(); return [m, S.tasks.length - n]; });
    is('running the move again adds nothing', again, [0, 0]);
    if(label !== 'Dexie'){ await ctx.close(); continue; }

    console.log('\n   both ways');
    const both = await p.evaluate(async ids => {
      const l = planList(ids[0]); l.name = 'The Garden Book'; projectListsSync();
      const renamed = S.projects.find(x => x.id === ids[0]).name;
      /* tick in Planning, read on the project page */
      const t = S.tasks.find(x => x.listId === ids[0] && x.text === 'Outline'); t.done = true; t.doneAt = today();
      const ratio = projectTaskRatio(S.projects.find(x => x.id === ids[0]));
      await saveNow();
      return {renamed, ratio: [ratio.done, ratio.total]};
    }, ids.ids);
    is('renaming the list renames the project', both.renamed, 'The Garden Book');
    is('a task ticked in Planning counts on the project', both.ratio, [2, 4]);
    await p.evaluate(id => { location.hash = '#/projects'; setTimeout(() => openProjectPanel(id), 400); }, ids.ids[0]); await p.waitForTimeout(1200);
    const panel = await p.evaluate(() => ({tasks: [...document.querySelectorAll('#panel .task .task-text')].map(x => x.textContent.trim()), checked: [...document.querySelectorAll('#panel [data-tdone]')].filter(c => c.checked).length}));
    yes('the project page shows the same tasks, ticked where they are', panel.tasks.includes('Read three books') && panel.checked >= 1, JSON.stringify(panel));
    await p.fill('#panel .quick-task', 'Water the seedlings'); await p.press('#panel .quick-task', 'Enter'); await p.waitForTimeout(500);
    const added = await p.evaluate(id => S.tasks.filter(t => t.listId === id && t.text === 'Water the seedlings').map(t => !!t.sectionId), ids.ids[0]);
    is('a task added on the project page is a Planning task in its phase', added, [true]);
    const ph = await p.evaluate(async id => { document.querySelector('#panel #phAdd').click(); await new Promise(r => setTimeout(r, 400));
      const pr = S.projects.find(x => x.id === id), last = pr.phases[pr.phases.length - 1]; return !!planList(id).sections.find(s => s.id === last.id); }, ids.ids[0]);
    yes('a phase added on the project page is a section in Planning', ph);
    await p.evaluate(() => { document.querySelectorAll('.overlay,#panel').forEach(n => n.remove()); });
    const mk = await p.evaluate(() => { const l = planNewList('Tax return'); l.sections.push({id: uid(), name: 'Gather', sortOrder: 0, isCollapsed: false});
      const t = Object.assign(newTask('Find the P60', ''), {listId: l.id, sectionId: l.sections[0].id}); planTaskDefaults(t); S.tasks.push(t);
      const pr = planListMakeProject(l.id); return {id: pr && pr.id === l.id, phases: pr.phases.map(x => x.name), ratio: projectTaskRatio(pr).total, folder: l.folderId, shop: planMoveListToShop(l.id), still: !!planList(l.id)}; });
    is('"make this a project": same id, its sections as phases, its tasks counted, in the Projects folder', [mk.id, mk.phases, mk.ratio, mk.folder], [true, ['Gather'], 1, 'projects']);
    is('a project’s list cannot be dissolved into the shopping list', [mk.shop, mk.still], [0, true]);
    await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(900);
    yes('Planning lists the Projects folder', await p.evaluate(() => [...document.querySelectorAll('[data-plfolder]')].some(f => /Projects/.test(f.textContent))));
    await ctx.close();
  }
  if(errs.length) console.log('\nerrors:\n  ' + errs.slice(0, 10).join('\n  '));
  yes('no errors on the page', !errs.length, errs.length + ' errors');
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
