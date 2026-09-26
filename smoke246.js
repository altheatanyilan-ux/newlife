/* smoke246 — the worked examples: a tutorial by example, in every room.

   The claims.

   A NEW HOUSE opens with them: the starter set and the examples come in
   together on first run, and every room has something in it that shows what
   it is for — the Lived Record (a reflection, a dream, a decision with a
   review date, a sealed letter, a quote, the Library), Planning (a list with a
   milestone, both dates, subtasks, a reminder, a thing to buy), the clock,
   People, Repertoire, the Knowledge Tree, the Study Deck, Brand Strategy,
   Songwriting, the Japanese and Jazz Studios. Every room draws with them in
   it, without an error.

   THEY ARE MARKED. Each is titled "Example ·", and #example lists them.

   THEY COME OUT CLEANLY. Settings → Worked examples takes every one out —
   including the Knowledge Tree positions, which are otherwise add-only —
   and leaves a position, an entry and a task of your own exactly as they
   were, across a reload. Adding them again puts them back once, not twice.

   AN EXISTING HOUSE is offered them once, and never given them unasked.

   A BROWSER DRIVEN BY A TEST (navigator.webdriver) is not given them on
   first run, so every other suite still starts from the empty rooms it
   expects. */
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke246-'));
const url = 'file://' + path.join(__dirname, 'index.html');

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const watch = p => { p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if(m.type() === 'error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/i.test(m.text())) errs.push('console: ' + m.text()); }); };

  console.log('\n1. a new house');
  /* a person, not a test: the examples are only given unasked to a browser nobody is driving */
  const human = () => Object.defineProperty(Navigator.prototype, 'webdriver', {get: () => false, configurable: true});
  const ctx = await b.newContext({viewport: {width: 1300, height: 900}}); await ctx.addInitScript(human); const p = await ctx.newPage(); watch(p);
  await p.goto(url); await p.waitForTimeout(1300);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2500); }
  await p.waitForFunction(() => S.settings && S.settings.tutorialApplied, null, {timeout: 15000}).catch(() => {});
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const C = await p.evaluate(() => {
    const T = x => (x || []).filter(r => r && r.seeded === 'tutorial');
    const ent = T(S.entries);
    return {n: tutorialCount(), starter: starterCount() > 0, types: [...new Set(ent.map(e => e.type))].sort(),
      titled: ent.filter(e => e.type !== 'quote').every(e => /^Example · /.test(e.title)), tagged: ent.every(e => e.tags.includes('example')),
      tasks: T(S.tasks).length, list: T(S.planning.lists).length, ms: (S.planning.lists.find(l => l.seeded === 'tutorial') || {milestones: []}).milestones.length,
      people: T(S.people).length, ix: T(S.interactions).length, time: T(S.timeEntries).length, scores: T(S.scores).length,
      tree: T(S.treeNodes).length, pos: T(S.treePositions).length, grafts: T(S.treeGrafts).length, brand: T(S.brand.accounts).length,
      songs: T(S.songwriting.songs).length, islands: T(S.japanese.islands).length, jerr: T(S.japanese.errors).length,
      deck: (S.settings.tutorialDeckNotes || []).length, jazz: Object.values(S.jazz.progress).reduce((s, r) => s + T(r.logs).length, 0),
      subtasks: (S.tasks.find(t => t.seedKey === 't-t1') || {subtasks: []}).subtasks.length,
      both: !!(S.tasks.find(t => t.seedKey === 't-t1') || {}).doDay && !!(S.tasks.find(t => t.seedKey === 't-t1') || {}).day,
      decision: !!(S.entries.find(e => e.seedKey === 't-dec') || {extra: {}}).extra.reviewOn,
      sealed: typeof letterIsSealed === 'function' && letterIsSealed(S.entries.find(e => e.seedKey === 't-letter'))};
  });
  yes('the starter set and the examples come in together on first run', C.starter && C.n > 60, C);
  is('the Lived Record has one of nearly every kind', C.types, ['brand', 'decision', 'dream', 'gratitude', 'intuition', 'letter', 'manifestation', 'media', 'memory', 'progress', 'question', 'quote', 'reflection', 'synchronicity', 'visualization']);
  yes('every example says it is one: titled and tagged', C.titled && C.tagged);
  yes('Planning: a list with a milestone, tasks with both dates and subtasks', C.list === 1 && C.ms === 1 && C.tasks >= 6 && C.subtasks === 3 && C.both, C);
  yes('People with their interactions; sittings on the clock', C.people === 3 && C.ix >= 5 && C.time === 6, C);
  yes('a score, the Tree (pages, positions, a graft), a deck, a brand account', C.scores === 1 && C.tree === 4 && C.pos === 3 && C.grafts === 1 && C.deck === 6 && C.brand === 1, C);
  yes('a song, a Japanese island and its errors, a jazz sitting', C.songs === 1 && C.islands === 1 && C.jerr === 2 && C.jazz === 1, C);
  yes('the decision comes back for review; the letter is sealed', C.decision && C.sealed, C);

  console.log('\n2. every room draws with them in it');
  const pid = await p.evaluate(() => { sngState().profile.onboarded = true;   /* the studio asks its three questions first */
    return S.people.find(x => x.seeded === 'tutorial').id; });
  const rooms = ['#/today', '#/journals', '#/journals/timeline', '#/journals/library', '#/planning', '#/people', '#/people/' + pid, '#/identity', '#/projects', '#/score', '#/tree',
    '#/study', '#/content/brand', '#/songwriting', '#/songwriting/songs', '#/songwriting/seeds', '#/japanese', '#/japanese/islands', '#/jazz', '#/time', '#/tag/example'];
  const drawn = [];
  for(const r of rooms){
    const before = errs.length;
    await p.evaluate(h => { location.hash = h; }, r); await p.waitForTimeout(900);
    const t = await p.evaluate(() => document.querySelector('#page, main, .page') ? (document.querySelector('#page') || document.querySelector('.page')).innerText : document.body.innerText);
    drawn.push({r, example: /Example ·|Examples::|example/i.test(t), errs: errs.length - before});
  }
  yes('no room fails to draw', drawn.every(d => !d.errs), drawn.filter(d => d.errs));
  const shown = drawn.filter(d => d.example).map(d => d.r);
  const want = ['#/journals', '#/journals/library', '#/planning', '#/people/' + pid, '#/score', '#/tree', '#/content/brand', '#/songwriting/songs', '#/songwriting/seeds', '#/japanese/islands', '#/tag/example'];
  yes('the examples show in the rooms that hold them', want.every(r => shown.includes(r)), want.filter(r => !shown.includes(r)));
  const sid = await p.evaluate(() => S.scores.find(x => x.seeded === 'tutorial').id);
  await p.evaluate(id => { scoreUi().focus = null; location.hash = '#/score/' + id; }, sid);
  await p.waitForSelector('#scCanvas svg', {timeout: 20000}).catch(() => {});
  await p.waitForTimeout(800);
  const sc = await p.evaluate(() => ({svg: !!document.querySelector('#scCanvas svg'), secs: document.querySelectorAll('.sc-sec').length, pins: document.querySelectorAll('.sc-pin').length}));
  yes('the example score engraves, with its four sections and its two bar notes', sc.svg && sc.secs === 4 && sc.pins === 2, sc);
  await p.screenshot({path: path.join(DIR, 'score.png')});
  await p.evaluate(() => { location.hash = '#/tree'; }); await p.waitForTimeout(700);
  await p.screenshot({path: path.join(DIR, 'tree.png')});
  await p.evaluate(() => { location.hash = '#/journals'; }); await p.waitForTimeout(700);
  await p.screenshot({path: path.join(DIR, 'journals.png')});

  console.log('\n3. they come out cleanly');
  const mine = await p.evaluate(async () => {
    const e = {id: 'mine-e', type: 'reflection', title: 'My own', body: 'mine', occurredAt: today(), createdAt: new Date().toISOString(), media: [], links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, people: [], places: [], emotions: [], tags: [], confidence: '', extra: {}};
    S.entries.push(e);
    S.tasks.push(newPlanTask('My own task', ''));
    const pg = treeSavePage({title: 'My own root', kind: 'root'}).node;
    treeAddPosition(pg.id, 'Mine, held at 55', 55);
    await saveNow(); await flushSave();
    return pg.id;
  });
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForTimeout(900);
  const st = await p.evaluate(() => ({say: (document.querySelector('#tutState') || {}).textContent, add: (document.querySelector('#sTutAdd') || {}).disabled, del: (document.querySelector('#sTutDel') || {}).disabled}));
  yes('Settings says how many examples are in, and offers to take them out', /example record/.test(st.say || '') && st.add && !st.del, st);
  await p.click('#sTutDel'); await p.waitForTimeout(400);
  const confirm = await p.$('.overlay .btn.danger, .modal .btn.danger, [data-confirm]');
  if(confirm){ await confirm.click(); }
  await p.waitForTimeout(1500);
  await p.evaluate(async () => { await saveNow(); await flushSave(); });
  await p.waitForTimeout(8500);   /* past the undo window, so the delete is written */
  await p.evaluate(async () => { await saveNow(); await flushSave(); });
  await p.goto(url); await p.waitForTimeout(2200);
  const after = await p.evaluate(id => ({n: tutorialCount(), starter: starterCount() > 0, mineE: !!S.entries.find(e => e.id === 'mine-e'), mineT: !!S.tasks.find(t => t.text === 'My own task'),
    minePos: treePositionsOf(id).map(x => x.confidence), treeLeft: S.treeNodes.filter(n => /^Example/.test(n.title)).length, posLeft: S.treePositions.filter(x => x.seeded === 'tutorial').length,
    deckNotes: (S.settings.tutorialDeckNotes || []).length}), mine);
  is('every example is gone after a reload — Tree positions too — and yours are exactly as they were', after, {n: 0, starter: true, mineE: true, mineT: true, minePos: [55], treeLeft: 0, posLeft: 0, deckNotes: 0});
  const again = await p.evaluate(async () => { await applyTutorial(); const a = tutorialCount(); await applyTutorial(); return {a, b: tutorialCount()}; });
  yes('adding them again puts them back once, not twice', again.a > 60 && again.a === again.b, again);

  console.log('\n4. a house with things in it is offered them, once');
  const ctx2 = await b.newContext({viewport: {width: 1200, height: 800}}); await ctx2.addInitScript(human); const q = await ctx2.newPage(); watch(q);
  await q.goto(url); await q.waitForTimeout(1300);
  await q.evaluate(async () => { S.settings.starterDeclined = true; S.settings.tutorialOffered = false; S.settings.tutorialApplied = null;
    S.entries.push({id: 'x', type: 'reflection', title: 'mine', body: '', occurredAt: today(), createdAt: new Date().toISOString(), media: [], links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, people: [], places: [], emotions: [], tags: [], confidence: '', extra: {}});
    await saveNow(); await flushSave(); });
  await q.goto(url); await q.waitForTimeout(1500);
  if(await q.$('#frGo')){ await q.click('#frGo'); await q.waitForTimeout(1500); }
  await q.waitForTimeout(5000);
  const off = await q.evaluate(() => ({offered: !!S.settings.tutorialOffered, n: tutorialCount(), toast: [...document.querySelectorAll('.toast, #toast, .toasts *')].some(t => /worked examples/i.test(t.textContent))}));
  yes('it is offered once, with a button, and nothing is added unasked', off.offered && off.n === 0 && off.toast, off);
  await ctx2.close();

  console.log('\n5. a test harness gets the empty rooms');
  const ctx3 = await b.newContext(); const r = await ctx3.newPage(); watch(r);
  await r.goto(url); await r.waitForTimeout(1300);
  if(await r.$('#frGo')){ await r.click('#frGo'); await r.waitForTimeout(2500); }
  const H = await r.evaluate(() => ({ex: tutorialCount(), starter: starterCount() > 0}));
  is('the starter set, as before, and no examples', H, {ex: 0, starter: true});
  await ctx3.close();

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}  (screenshots in ${DIR})`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
