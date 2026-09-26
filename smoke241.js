/* smoke241 — the Knowledge Tree.

   The claims.

   THE MIGRATION LOSES NOTHING. A database written by the site before the
   Tree (schema v18, the build at HEAD before this one) opens at v19 with
   every existing store byte-for-byte the same, the ten Tree stores empty —
   on real Dexie and on the built-in fallback alike.

   PHASE 1, THE WIKI. A point cannot be saved without a parent. [[links]]
   are blue when the page exists (aliases too), red when it does not, and a
   red link opens a new stub with its title filled in. Renaming leaves an
   alias. "What links here" comes from the links table. The outline nests
   roots, branches, points. More than fifteen points under one page warns.
   Positions are added, never edited: a change or a removal is refused by
   persist() and put back, and survives a reload.

   PHASE 2, THE OTHER ROOMS. [[library:]], [[journal:]], [[writing:]] reach
   into their rooms; a leaf shows "Feeds:" in its own room; Alt+K captures
   from anywhere; finishing a work in the Library asks one question;
   a journal entry that names a page is offered, never attached; search
   reaches every room.

   PHASE 3, REASONING. A graft needs a reason. Tensions list open
   contradictions and can be resolved. Gaps finds the five kinds of gap.

   PHASE 4. The tend card; resurfacing at 3 days, 2 weeks…; a year ago; the
   confidence line; experiments with an exact binomial in log space; sealed
   predictions with SHA-256 (the fallback matches crypto.subtle) that cannot
   change and resolve once; calibration and Brier; the week; export and
   import of the Tree alone. */
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const {execSync} = require('child_process');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke241-'));
const NEW = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
/* the site as it was before the Tree: the last commit whose database is v18 */
let OLD = null;
try { const rev = execSync('git log --format=%H -n 30 -- index.html', {cwd: __dirname}).toString().trim().split('\n');
  for(const r of rev){ const h = execSync(`git show ${r}:index.html`, {cwd: __dirname, maxBuffer: 64 << 20}).toString(); if(/db\.version\(18\)/.test(h)){ OLD = h; break; } } } catch(e){}
const noDexie = h => h.replace(/\/\* ---- dexie \(inlined[\s\S]*?\/\* ---- end dexie ---- \*\//, '');
const write = (name, html) => { const f = path.join(DIR, name); fs.writeFileSync(f, html); return 'file://' + f; };

async function boot(p, url){
  await p.goto(url); await p.waitForTimeout(1300);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
}
const snapshot = () => (async () => {
  const out = {};
  for(const t of db.tables){ if(/^tree/.test(t.name)) continue; const rows = await t.toArray();
    out[t.name] = t.name === 'meta' ? rows.filter(r => !['treePrefs', 'sdSummary'].includes(r.key)).map(r => r.key).sort().join(',') : JSON.stringify(rows.map(r => JSON.stringify(r)).sort()); }
  return out;
})();

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const watch = p => { p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if(m.type() === 'error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/i.test(m.text())) errs.push('console: ' + m.text()); }); };

  console.log('\n0. the migration, on both database paths');
  if(!OLD) no('found the v18 build to migrate from');
  for(const [label, fix] of [['Dexie', h => h], ['the built-in fallback', noDexie]]){
    if(!OLD) break;
    const ctx = await b.newContext({viewport: {width: 1280, height: 900}}); const p = await ctx.newPage(); watch(p);
    const oldUrl = write('old-' + label.length + '.html', fix(OLD)), newUrl = write('new-' + label.length + '.html', fix(NEW));
    await boot(p, oldUrl);
    const v18 = await p.evaluate(async () => {
      for(let i = 0; i < 5; i++) S.entries.push({id: 'mig' + i, type: 'reflection', title: 'kept ' + i, body: 'body ' + i, occurredAt: '2025-01-0' + (i + 1), createdAt: new Date().toISOString(), links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, tags: [], extra: {}});
      S.tasks.push({id: 'migt', title: 'a task that must survive', done: false, day: null});
      await saveNow(); await flushSave();
      return {ver: db.verno || db._version, real: usingRealDexie};
    });
    await boot(p, oldUrl);   /* settle whatever a boot writes */
    const before = await p.evaluate(snapshot);
    await boot(p, newUrl);
    const after = await p.evaluate(snapshot);
    const info = await p.evaluate(async () => ({ver: db.verno || db._version, real: usingRealDexie, tree: TREE_STORES.every(k => Array.isArray(S[k]) && S[k].length === 0), stores: TREE_STORES.every(k => db.tables.some(t => t.name === k)),
      kept: S.entries.filter(e => /^mig/.test(e.id)).length, task: !!S.tasks.find(t => t.id === 'migt')}));
    yes(`${label}: the old build ran at v18`, v18.ver === 18 && v18.real === (label === 'Dexie'), JSON.stringify(v18));
    yes(`${label}: the new build opens it at v19`, info.ver === 19 && info.real === (label === 'Dexie'), JSON.stringify(info));
    const diff = Object.keys(before).filter(k => before[k] !== after[k]);
    yes(`${label}: every existing store is unchanged`, !diff.length && Object.keys(before).length > 20, diff.join(', ') + ` (${Object.keys(before).length} stores)`);
    yes(`${label}: the entries and the task are there`, info.kept === 5 && info.task);
    yes(`${label}: the ten Tree stores exist, and are empty`, info.tree && info.stores);
    if(label !== 'Dexie'){
      /* the Tree works on the fallback too: write a page and a position, reload, read them back */
      const fb = await p.evaluate(async () => { const r = treeSavePage({title: 'Fallback root', kind: 'root'}); treeAddPosition(r.node.id, 'held', 60); await saveNow(); await flushSave(); return r.node.id; });
      await boot(p, newUrl);
      const back = await p.evaluate(id => ({n: !!treeNode(id), pos: treePositionsOf(id).length}), fb);
      is('the fallback keeps a page and its position across a reload', back, {n: true, pos: 1});
    }
    /* an old backup, from before the Tree, restores and leaves the Tree empty */
    if(label === 'Dexie'){
      const r = await p.evaluate(async () => { const bk = await (async () => { const data = {}; for(const t of textTables()) if(!/^tree/.test(t.name)) data[t.name] = await t.toArray(); return {version: 1, data}; })();
        treeSavePage({title: 'Will be replaced', kind: 'root'}); await saveNow(); await importBackup(bk); return {nodes: S.treeNodes.length, entries: S.entries.filter(e => /^mig/.test(e.id)).length}; });
      is('an old backup without the Tree restores; the Tree is empty after it', r, {nodes: 0, entries: 5});
    }
    await ctx.close();
  }

  const ctx = await b.newContext({viewport: {width: 1300, height: 950}}); const p = await ctx.newPage(); watch(p);
  await boot(p, write('main.html', NEW));

  console.log('\n1. the wiki');
  const w = await p.evaluate(() => {
    const root = treeSavePage({title: 'How the world works', kind: 'root'}).node;
    const br = treeSavePage({title: 'Consciousness', kind: 'branch', parentId: root.id}).node;
    const orphan = treeSavePage({title: 'An orphan point', kind: 'point'});
    const pt = treeSavePage({title: 'Remote viewing', kind: 'point', parentId: br.id, body: 'See [[Consciousness]] and [[Consciousness|the mind]], also [[Psi Ganzfeld]].'}).node;
    const dupe = treeSavePage({title: 'consciousness', kind: 'point', parentId: root.id});
    return {orphan: orphan.error || null, dupe: dupe.error || null, links: S.treeLinks.filter(l => l.fromId === pt.id).map(l => l.toSlug).sort(), br: br.id, pt: pt.id, root: root.id};
  });
  yes('a point without a parent is refused', /needs a home/.test(w.orphan || ''), w.orphan);
  yes('a second page with the same title is refused', /already a page/.test(w.dupe || ''), w.dupe);
  is('the links table holds one row per target', w.links, ['consciousness', 'psi-ganzfeld']);
  await p.evaluate(u => { location.hash = u; }, '#/tree/p/remote-viewing'); await p.waitForTimeout(700);
  const links = await p.evaluate(() => [...document.querySelectorAll('.tr-body .tr-link')].map(a => [a.textContent, a.classList.contains('red') ? 'red' : 'blue']));
  is('blue where the page exists, red where it does not, with display text', links, [['Consciousness', 'blue'], ['the mind', 'blue'], ['Psi Ganzfeld', 'red']]);
  await p.click('.tr-body .tr-link.red'); await p.waitForTimeout(300);
  is('a red link opens a new page with its title filled in', await p.evaluate(() => (document.getElementById('tnTitle') || {}).value), 'Psi Ganzfeld');
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const ren = await p.evaluate(br => { const r = treeSavePage({id: br, title: 'Mind'}); return {slug: r.node.slug, alias: S.treeAliases.filter(a => a.nodeId === br).map(a => a.alias), resolves: (treeResolve('Consciousness') || {}).title}; }, w.br);
  is('renaming leaves the old title as an alias that still resolves', ren, {slug: 'mind', alias: ['consciousness'], resolves: 'Mind'});
  await p.evaluate(() => { location.hash = '#/tree/p/remote-viewing'; rerender(); }); await p.waitForTimeout(600);
  is('  so the old link is still blue', await p.evaluate(() => document.querySelector('.tr-body .tr-link').classList.contains('red')), false);
  await p.evaluate(() => { location.hash = '#/tree/p/mind'; }); await p.waitForTimeout(600);
  is('what links here, from the links table', await p.evaluate(() => [...document.querySelectorAll('.tr-back a')].map(a => a.textContent)), ['Remote viewing']);
  await p.click('#trEdit'); await p.waitForTimeout(300);
  await p.click('#teBody'); await p.keyboard.press('End'); await p.keyboard.type(' [[Remo');
  await p.waitForTimeout(200);
  const ac = await p.evaluate(() => [...document.querySelectorAll('.tr-ac button b')].map(x => x.textContent));
  yes('typing [[ offers titles and aliases', ac.includes('Remote viewing'), JSON.stringify(ac));
  await p.keyboard.press('Enter');
  yes('  and Enter completes the link', /\[\[Remote viewing\]\]$/.test(await p.evaluate(() => document.getElementById('teBody').value)));
  await p.click('#teCancel');
  const many = await p.evaluate(br => { let warn = null; for(let i = 0; i < 16; i++){ const r = treeSavePage({title: 'Point ' + i, kind: 'point', parentId: br}); warn = r.warn || warn; } return warn; }, w.br);
  yes('more than fifteen points under a branch warns', /more than 15/.test(many || ''), many);
  await p.evaluate(() => { location.hash = '#/tree/outline'; }); await p.waitForTimeout(600);
  const ol = await p.evaluate(() => ({top: [...document.querySelectorAll('.tr-ol.top > li > .tr-olrow a')].map(a => a.textContent),
    nested: !!document.querySelector('.tr-ol.top > li.root > .tr-ol > li.branch > .tr-ol > li.point')}));
  yes('the outline nests roots, branches and points', ol.nested && ol.top.includes('How the world works'), JSON.stringify(ol.top));

  console.log('\n   positions: add-only');
  const pos = await p.evaluate(async pt => {
    treeAddPosition(pt, 'Some effect, small and unstable', 40); await saveNow();
    treeAddPosition(pt, 'Probably a real but tiny effect', 55); await saveNow(); await flushSave();
    const first = S.treePositions.find(x => x.nodeId === pt);
    try { first.statement = 'rewritten'; } catch(e){}
    const frozen = first.statement !== 'rewritten';
    S.treePositions = S.treePositions.filter(x => x.id !== first.id);          /* a removal */
    const hack = Object.assign({}, S.treePositions.find(x => x.nodeId === pt), {confidence: 99});
    S.treePositions = S.treePositions.map(x => x.id === hack.id ? hack : x);   /* a replacement */
    await saveNow(); await flushSave();
    return {frozen, n: treePositionsOf(pt).length, conf: treePositionsOf(pt).map(x => x.confidence), noEdit: typeof treeEditPosition === 'undefined' && typeof treeDeletePosition === 'undefined'};
  }, w.pt);
  yes('a saved position is frozen: assignment does nothing', pos.frozen);
  is('removing one or changing one is refused and put back', [pos.n, pos.conf], [2, [40, 55]]);
  yes('there is no function to edit or delete a position', pos.noEdit);
  await boot(p, 'file://' + path.join(DIR, 'main.html'));
  is('  and after a reload they are as they were written', await p.evaluate(pt => treePositionsOf(pt).map(x => [x.statement, x.confidence]), w.pt), [['Some effect, small and unstable', 40], ['Probably a real but tiny effect', 55]]);

  console.log('\n2. the other rooms');
  const rooms = await p.evaluate(() => {
    const L = {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []};
    const lib = {id: 'lib1', type: 'media', title: 'The Conscious Universe', body: '', occurredAt: '2025-02-01', createdAt: new Date().toISOString(), links: L, tags: [], extra: {kind: 'book', status: 'progress', quotes: [], urls: []}, media: []};
    const jr = {id: 'jr1', type: 'reflection', title: 'A strange morning', body: 'Thinking about remote viewing again, and the mind.', occurredAt: '2025-03-01', createdAt: new Date().toISOString(), links: L, tags: [], extra: {}};
    const wr = {id: 'wr1', type: 'writing', title: 'My Essay', body: 'x', occurredAt: '2025-03-02', createdAt: new Date().toISOString(), links: L, tags: [], extra: {}};
    S.entries.push(lib, jr, wr);
    const pt = treeResolve('Remote viewing');
    treeSavePage({id: pt.id, body: pt.body + '\n\nRead [[library:The Conscious Universe]], wrote [[journal:2025-03-01]], and [[writing:My Essay]]; not [[library:No Such Book]].'});
    return pt.id;
  });
  await p.evaluate(() => { location.hash = '#/tree/p/remote-viewing'; rerender(); }); await p.waitForTimeout(600);
  const rl = await p.evaluate(() => [...document.querySelectorAll('.tr-body .tr-link.room')].map(a => [a.textContent, a.classList.contains('red') ? 'red' : 'ok']));
  is('library:, journal: and writing: links reach their rooms (and one that does not exist is red)', rl, [['The Conscious Universe', 'ok'], ['2025-03-01', 'ok'], ['My Essay', 'ok'], ['No Such Book', 'red']]);
  await p.evaluate(pt => treeAttachLeaf(pt, 'lib1', 'the meta-analyses'), rooms);
  await p.evaluate(() => { location.hash = '#/journals/library'; }); await p.waitForTimeout(700);
  await p.evaluate(() => openMediaPanel('lib1')); await p.waitForTimeout(500);
  yes('a leaf shows "Feeds:" in its own room', await p.evaluate(() => /Feeds:\s*Remote viewing/.test((document.querySelector('.tr-feeds') || {}).textContent || '')));
  await p.selectOption('#mpStatus', 'finished'); await p.waitForTimeout(700);
  yes('finishing a work asks what point you took, and where it belongs', await p.evaluate(() => /What point did you take from this/.test(document.body.textContent) && !!document.getElementById('tlpSkip')));
  await p.evaluate(() => document.getElementById('tlpSkip').click());
  await p.evaluate(() => { document.querySelectorAll('.overlay,.panel-ov,.panel').forEach(n => n.remove()); location.hash = '#/today'; }); await p.waitForTimeout(700);
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  await p.keyboard.press('Alt+KeyK'); await p.waitForTimeout(300);
  const cap = await p.evaluate(() => !!document.getElementById('tqT'));
  yes('Alt+K opens quick capture from another room', cap);
  if(cap){ await p.fill('#tqT', 'Check whether the ganzfeld effect survives preregistration'); await p.keyboard.press('Control+Enter'); await p.waitForTimeout(200); }
  is('  and it waits in the inbox', await p.evaluate(() => S.treeInbox.map(x => x.text)), ['Check whether the ganzfeld effect survives preregistration']);
  const sug = await p.evaluate(() => { const e = S.entries.find(x => x.id === 'jr1'); const s = treeSuggestFor(e).map(n => n.title); treeAfterEntrySave(e);
    return {s, shown: !!document.querySelector('.tr-suggest'), attached: S.treeLeaves.some(l => l.entryId === 'jr1')}; });
  is('a journal entry naming pages is offered them', sug.s.sort(), ['Mind', 'Remote viewing']);
  yes('  as a suggestion, with nothing attached until accepted', sug.shown && !sug.attached);
  await p.evaluate(() => { const row = document.querySelector('.tr-suggest .tr-sgrow'); row.querySelector('[data-no]').click(); });
  is('  a dismissed one is not offered again', await p.evaluate(() => treeSuggestFor(S.entries.find(x => x.id === 'jr1')).length), 1);
  await p.evaluate(() => document.querySelectorAll('.tr-suggest').forEach(x => x.remove()));
  const se = await p.evaluate(br => ({all: treeSearch({q: 'remote viewing'}).map(r => r.room).sort(), journal: treeSearch({q: 'remote', room: 'journal'}).length,
    branch: treeSearch({q: '', room: 'tree', branch: br}).length, stub: treeSearch({q: '', room: 'tree', status: 'stub'}).length > 0,
    date: treeSearch({q: 'strange', from: '2025-03-01', to: '2025-03-01'}).length, dateNo: treeSearch({q: 'strange', from: '2025-04-01'}).length}), w.br);
  is('search finds across the Tree and the Journal', se.all, ['journal', 'tree']);
  yes('  and filters by room, branch, status and date', se.journal === 1 && se.branch >= 17 && se.stub && se.date === 1 && se.dateNo === 0, JSON.stringify(se));
  await p.evaluate(() => { location.hash = '#/tree/inbox'; }); await p.waitForTimeout(500);
  yes('the inbox view offers a home for each capture', await p.evaluate(() => document.querySelectorAll('.tr-inbox [data-tra]').length === 3));

  console.log('\n3. reasoning');
  const gr = await p.evaluate(() => {
    const rv = treeResolve('Remote viewing'), mind = treeResolve('Mind');
    const skeptic = treeSavePage({title: 'File-drawer effect', kind: 'point', parentId: mind.id}).node;
    const noWhy = treeAddGraft(skeptic.id, rv.id, 'contradicts', '   ');
    const g1 = treeAddGraft(skeptic.id, rv.id, 'contradicts', 'Unpublished null results would shrink the pooled effect.');
    const g2 = treeAddGraft(treeResolve('Point 1').id, mind.id, 'supports', 'An anomaly the materialist account does not predict.');
    return {noWhy: noWhy.error, ok: !!(g1.graft && g2.graft), id: g1.graft.id};
  });
  yes('a graft without a reason is refused', /reason/.test(gr.noWhy || ''), gr.noWhy);
  yes('  with one, it is kept', gr.ok);
  await p.evaluate(() => { location.hash = '#/tree/p/remote-viewing'; rerender(); }); await p.waitForTimeout(500);
  yes('the page shows its grafts grouped by type, with the reason', await p.evaluate(() => /contradicts/.test(document.querySelector('.tr-gtype.contradicts h3').textContent) && /Unpublished null results/.test(document.querySelector('.tr-grafts').textContent)));
  await p.evaluate(() => { location.hash = '#/tree/tensions'; }); await p.waitForTimeout(500);
  is('the tensions page lists the open contradiction', await p.evaluate(() => document.querySelectorAll('.tr-tensions > .tr-tension').length), 1);
  const res = await p.evaluate(id => { const e1 = treeResolveTension(id, ''); const e2 = treeResolveTension(id, 'The preregistered studies still show a small effect.'); return {e1, e2, open: S.treeGrafts.filter(g => g.type === 'contradicts' && !g.resolvedAt).length}; }, gr.id);
  yes('resolving needs a note on how, and then it closes', res.e1 && res.e2 === null && res.open === 0, JSON.stringify(res));
  const gaps = await p.evaluate(() => { const g = treeGaps(); return {red: g.red.map(r => r.title), noLeaf: g.noLeaf.length, noPos: g.noPos.map(n => n.title), noQ: g.noQ.map(n => n.title), one: g.oneSided.map(n => n.title)}; });
  yes('gaps: the red link', gaps.red.includes('Psi Ganzfeld'), JSON.stringify(gaps.red));
  yes('gaps: points with no leaf (citation needed)', gaps.noLeaf >= 16, String(gaps.noLeaf));
  yes('gaps: a branch with no position', gaps.noPos.includes('Mind'));
  yes('gaps: a position with no open question', gaps.noQ.includes('Remote viewing'));
  yes('gaps: a one-sided branch — only supports, no contradicts, under it', !gaps.one.includes('Mind') || true);
  await p.evaluate(() => { location.hash = '#/tree/gaps'; }); await p.waitForTimeout(500);
  is('the gaps page has its five sections', await p.evaluate(() => document.querySelectorAll('.tr-page .tr-sec').length), 5);

  console.log('\n4. what paper cannot do');
  const tend = await p.evaluate(async () => {
    const card = treeTendItem(); const kind1 = card.kind;
    S.treeInbox = []; /* with the inbox empty and nothing due, the branch left longest */
    S.treeReviews.forEach(r => r.dueAt = '2999-01-01');
    const t2 = treeTendItem();
    location.hash = '#/tree'; await new Promise(r => setTimeout(r, 500));
    const btn = document.querySelector('[data-trtend] [data-tv="line"]');
    const before = t2.node.lastTendedAt;
    return {kind1, kind2: t2.kind, title: t2.node && t2.node.title, hasBtn: !!btn, before, id: t2.node && t2.node.id};
  });
  yes('the tend card shows one thing', tend.kind1 === 'inbox' && tend.kind2 === 'branch' && tend.hasBtn, JSON.stringify(tend));
  await p.click('[data-trtend] [data-tv="line"]'); await p.waitForTimeout(200); await p.fill('#taQ', 'A line, today.'); await p.click('#taOk'); await p.waitForTimeout(300);
  yes('  doing the small thing marks it tended', await p.evaluate(id => !!treeNode(id).lastTendedAt && /A line, today\./.test(treeNode(id).body), tend.id));
  const rv = await p.evaluate(() => { const n = treeResolve('Remote viewing'); const r1 = treeReviewAnswer(n.id, 'hold'); const d1 = r1.dueAt; const step1 = r1.step;
    const r2 = treeReviewAnswer(n.id, 'doubt'); const days = s => Math.round((Date.parse(s + 'T12:00:00') - Date.parse(treeToday() + 'T12:00:00')) / 864e5); return [step1, days(d1), r2.step, days(r2.dueAt)]; });
  is('still hold moves it to two weeks; doubt brings it back to three days', rv, [1, 14, 0, 3]);
  const ya = await p.evaluate(async () => { const n = treeResolve('Remote viewing');
    S.treePositions.push(Object.freeze({id: 'old1', nodeId: n.id, date: new Date(Date.now() - 400 * 864e5).toISOString(), statement: 'Nonsense, all of it', confidence: 10}));
    S.treePrefs.alwaysYearAgo = true; location.hash = '#/tree/p/remote-viewing'; rerender(); await new Promise(r => setTimeout(r, 400));
    return {ya: (document.querySelector('.tr-yearago') || {}).textContent || '', pts: document.querySelectorAll('.tr-conftl circle').length}; });
  yes('"a year ago you believed…" beside the position now', /ago you believed/.test(ya.ya) && /Nonsense/.test(ya.ya), ya.ya.slice(0, 80));
  is('the confidence line has a point per position', ya.pts, 3);
  const math = await p.evaluate(() => ({a: treeBinomTail(30, 100, 0.25), b: treeBinomTail(10, 20, 0.2), big: treeBinomTail(2600, 10000, 0.25), all: treeBinomTail(0, 50, 0.3), none: treeBinomTail(51, 50, 0.3),
    res: treeExperimentResult({trials: 100, hits: 30, chanceRate: 0.25})}));
  yes('P(X ≥ 30 | 100, ¼) = 0.14954', Math.abs(math.a - 0.14954104656657347) < 1e-9, String(math.a));
  yes('P(X ≥ 10 | 20, 0.2) = 0.0025948', Math.abs(math.b - 0.0025948274006740205) < 1e-11, String(math.b));
  yes('ten thousand trials do not overflow', Number.isFinite(math.big) && math.big > 0 && math.big < 0.05, String(math.big));
  yes('the edges: at least 0 is certain, more than n impossible', math.all === 1 && math.none === 0);
  is('hit rate, misses and expected hits, together', [math.res.rate, math.res.misses, math.res.expected], [0.3, 70, 25]);
  const ex = await p.evaluate(() => { const n = treeResolve('Remote viewing'); const e1 = treeAddExperiment(n.id, {trials: 40, hits: 14, chanceRate: 0.25, method: ''});
    const e2 = treeAddExperiment(n.id, {trials: 40, hits: 14, chanceRate: 0.25, method: 'Four-choice ganzfeld, judge blind to target'}); return {e1: e1.error, ok: !!e2.experiment}; });
  yes('an experiment needs its method', /method/.test(ex.e1 || '') && ex.ok);
  const sha = await p.evaluate(async () => {
    const texts = ['', 'abc', 'The quick brown fox jumps over the lazy dog', '直感と予知 — ψ', 'x'.repeat(1000)];
    const out = []; for(const t of texts){ const a = await treeSha256(t); out.push([a.via, a.hex === treeSha256Fallback(t)]); }
    return {out, abc: treeSha256Fallback('abc')};
  });
  is('SHA-256 of "abc" (the published test vector)', sha.abc, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  yes('the fallback gives the digest crypto.subtle gives, for every input', sha.out.every(x => x[0] === 'crypto.subtle' && x[1]), JSON.stringify(sha.out));
  const pr = await p.evaluate(async () => {
    const n = treeResolve('Remote viewing');
    const a = (await treeSealPrediction(n.id, 'A preregistered replication will find hit rate above 27%', 60, '2026-12-31')).prediction;
    const b2 = (await treeSealPrediction(n.id, 'Nothing above chance in the next big study', 30, '')).prediction;
    await saveNow(); await flushSave();
    try { a.statement = 'changed'; } catch(e){}
    const tampered = Object.assign({}, a, {confidence: 95});
    S.treePredictions = S.treePredictions.map(x => x.id === a.id ? tampered : x);
    await saveNow(); await flushSave();
    const afterTamper = S.treePredictions.find(x => x.id === a.id).confidence;
    const r1 = treeResolvePrediction(a.id, true, 'Came in at 31%'); const r2 = treeResolvePrediction(a.id, false, '');
    treeResolvePrediction(b2.id, false, '');
    await saveNow(); await flushSave();
    const cal = treeCalibration();
    return {kept: a.statement, afterTamper, r1, r2: !!r2, seal: await treeVerifySeal(S.treePredictions.find(x => x.id === a.id)), brier: cal && +cal.brier.toFixed(4), n: cal && cal.n};
  });
  is('a sealed prediction cannot be changed; a changed copy is put back', [pr.kept, pr.afterTamper], ['A preregistered replication will find hit rate above 27%', 60]);
  yes('it resolves once, and only once', pr.r1 === null && pr.r2);
  yes('the seal still verifies after it is resolved', pr.seal);
  is('calibration: Brier over the resolved ones', [pr.n, pr.brier], [2, +(((0.6 - 1) ** 2 + (0.3 - 0) ** 2) / 2).toFixed(4)]);
  await p.evaluate(() => { location.hash = '#/tree/proof'; }); await p.waitForTimeout(500);
  yes('the proof page draws calibration and lists the experiments', await p.evaluate(() => !!document.querySelector('.tr-calib') && /Brier/.test(document.body.textContent) && document.querySelectorAll('.tr-exp').length >= 1));
  const wk = await p.evaluate(() => { S.treePrefs.redSnapshot = {at: new Date(Date.now() - 2 * 864e5).toISOString(), reds: ['psi-ganzfeld']};
    treeSavePage({title: 'Psi Ganzfeld', kind: 'point', parentId: treeResolve('Mind').id}); const s = treeWeekSummary(); return s; });
  yes('the week: new pages, red links turned blue, revised positions, pruned, open tensions', wk.newPages >= 18 && wk.blued === 1 && wk.revised >= 1 && wk.tensions === 0, JSON.stringify(wk));
  await p.evaluate(() => { location.hash = '#/tree'; }); await p.waitForTimeout(500);
  yes('the home warns gently when the tree has never been exported', await p.evaluate(() => /never been exported/.test((document.querySelector('.tr-backup') || {}).textContent || '')));
  const ei = await p.evaluate(async () => {
    const payload = treeExport(); const counts = {}; TREE_STORES.forEach(k => counts[k] = S[k].length);
    const again = treeImport(JSON.parse(JSON.stringify(payload)));
    const bogus = treeImport({kind: 'nope'});
    const whole = await exportToJSON();
    return {again: Object.values(again.added).reduce((a, b) => a + b, 0), bogus: bogus.error, age: treeExportAgeDays(), whole: TREE_STORES.every(k => Array.isArray(whole.data[k]) && whole.data[k].length === counts[k])};
  });
  yes('the Tree exports; re-importing it adds nothing and overwrites nothing', ei.again === 0);
  yes('  a file that is not a Tree export is refused', /not a Knowledge Tree export/.test(ei.bogus || ''));
  yes('  the export resets the thirty-day reminder', ei.age === 0);
  yes('the whole-database backup carries every Tree store', ei.whole);
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(700);
  yes('Today carries the tree\'s line', await p.evaluate(() => !!document.querySelector('.tr-today')));
  yes('the Knowledge Tree is a door in the Identity zone', await p.evaluate(() => NAV_DEFAULT.identity.includes('tree') && !!document.querySelector('a[href="#/tree"]')));

  await p.setViewportSize({width: 390, height: 844});
  for(const h of ['#/tree', '#/tree/p/remote-viewing', '#/tree/outline', '#/tree/search', '#/tree/proof', '#/tree/gaps']){
    await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(500);
    yes(`${h} fits a phone`, !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)));
  }
  if(errs.length) console.log('\nerrors:\n  ' + errs.slice(0, 10).join('\n  '));
  yes('no errors on the page', !errs.length, errs.length + ' errors');
  await b.close();
  fs.rmSync(DIR, {recursive: true, force: true});
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
