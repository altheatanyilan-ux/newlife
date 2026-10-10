/* smoke-tree-ics — the Knowledge Tree × iCanStudy amendments (A-01 … A-13, N-01 … N-09).
   Run: NODE_PATH=node_modules node smoke-tree-ics.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 900}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept('typed'));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const E = (fn, arg) => p.evaluate(fn, arg);
  await E(() => { document.querySelectorAll('.toast,.overlay').forEach(n => n.remove());
    window.mk = (o) => { o = Object.assign({title: 'P' + Math.random().toString(36).slice(2, 7), kind: 'point', status: 'active'}, o); if(o.kind !== 'root' && !o.parentId && window.R) o.parentId = window.R.id; const r = treeSavePage(o); if(r.error) throw new Error(r.error); return r.node; };
    window.R = mk({title: 'Law of tort', kind: 'root'}); });

  console.log('\nFoundation. the schema, added and safe to run twice');
  is('the new stores exist', await E(() => ['treeChunks', 'treeQuestions', 'treeRetrievals', 'treeMistakes', 'treePageRevisions', 'treeKolb'].every(k => Array.isArray(S[k]))), true);
  const mig = await E(() => { const a = icsEnsure(), b = icsEnsure(); return [a.migrated, b.migrated, S.treePrefs.icsSchema, S.treePrefs.ladder]; });
  is('a second run changes nothing', mig.slice(0, 3), [false, false, 2]);
  is('the retrieval ladder is seeded', mig[3], [0, 1, 3, 7, 16, 50, 120, 365]);
  is('an older page gains the fields without losing its words', await E(() => { const n = mk({title: 'Old page', body: 'kept as written'}); delete n.importance; delete n.mastery; S.treePrefs.icsSchema = 1; const r = icsEnsure(); return [r.migrated, n.importance, n.mastery, n.backbone, n.body]; }), [true, null, null, false, 'kept as written']);

  console.log('\nA-01. Open in Studio');
  const br = await E(() => { const b = mk({title: 'Remoteness of damage', kind: 'branch', parentId: R.id}); const pt = mk({title: 'The Wagon Mound rule', kind: 'point', parentId: b.id}); const pr = mk({title: 'Pruned branch', kind: 'branch', parentId: R.id}); treeSetStatus(pr.id, 'pruned'); return {b: b.id, pt: pt.id, pr: pr.id, root: R.id, bs: b.slug, ps: pt.slug, rs: R.slug, prs: pr.slug}; });
  is('only a live branch can be opened', await E(a => [icsCanOpenInStudio(treeNode(a.b)), icsCanOpenInStudio(treeNode(a.pt)), icsCanOpenInStudio(treeNode(a.root)), icsCanOpenInStudio(treeNode(a.pr))], br), [true, false, false, false]);
  await E(a => { location.hash = '#/tree/p/' + a.bs; }, br); await p.waitForTimeout(500);
  yes('a branch page shows the button', await E(() => !!document.querySelector('[data-act="open-in-studio"]')));
  await E(a => { location.hash = '#/tree/p/' + a.ps; }, br); await p.waitForTimeout(400);
  yes('a point page does not', await E(() => !document.querySelector('[data-act="open-in-studio"]')));
  await E(a => { location.hash = '#/tree/p/' + a.rs; }, br); await p.waitForTimeout(400);
  yes('nor does a root', await E(() => !document.querySelector('[data-act="open-in-studio"]')));
  await E(a => { location.hash = '#/tree/p/' + a.bs; }, br); await p.waitForTimeout(500);
  const boards0 = await E(() => (S.lsBoards || []).length);
  await p.click('[data-act="open-in-studio"]'); await p.waitForTimeout(400);
  is('with no board yet it asks, and makes nothing until told', await E(() => [(S.lsBoards || []).length, !!document.querySelector('[data-x=yes]')]), [boards0, true]);
  await p.click('[data-x=yes]'); await p.waitForTimeout(900);
  yes('after yes it opens the branch\'s board', await E(a => location.hash.startsWith('#/studio/') && (S.lsBoards || []).some(x => x.branchId === a.b), br));
  await E(a => { location.hash = '#/tree/p/' + a.bs; }, br); await p.waitForTimeout(500);
  await p.click('[data-act="open-in-studio"]'); await p.waitForTimeout(600);
  yes('with a board it goes straight there', await E(() => location.hash.startsWith('#/studio/') && !document.querySelector('[data-x=yes]')));
  is('no recall duty when there is no board', await E(() => { const keep = S.lsBoards; S.lsBoards = []; const d = DUTIES.find(x => x.id === 'ls_recall'); const due = d.recurrence.check(today()); S.lsBoards = keep; return due; }), false);
  yes('a board with no branch can be found again from the picker', await E(() => { S.lsBoards.push({id: 'detached1', branchId: null, name: 'Untitled', isHome: false, mode: 'harvest', viewport: {x: 0, y: 0, zoom: 1}, createdAt: new Date().toISOString()}); location.hash = '#/studio'; return true; }) && (await p.waitForTimeout(600), await E(() => !!document.querySelector('a[href="#/studio/detached1"]'))));
  await E(() => { S.lsBoards = S.lsBoards.filter(x => x.id !== 'detached1'); });

  console.log('\nA-02. the stored weeks are shown');
  await E(() => { S.treePrefs.summaries = [{weekKey: '2026-W40', pagesTended: 9, positionsSet: 2, gapsOpen: 31}, {weekKey: '2026-W41', pagesTended: 14, positionsSet: 1, gapsOpen: 27}, {weekKey: 'junk'}, {weekKey: '2026-W39', pagesTended: 4}, null, 'x', {week: '2026-09-21', newPages: 3}]; });
  const wk = await E(() => icsWithDeltas(icsRecentSummaries(8)).map(w => [w.weekKey, w.deltas.pagesTended, w.deltas.gapsOpen]));
  is('newest first, the malformed skipped, an old record read by its date', wk.map(x => x[0]), ['2026-W41', '2026-W40', '2026-W39', '2026-W39']);
  is('deltas are worked out between neighbours', wk[0].slice(1), [5, -4]);
  is('a week lacking a field has no delta', await E(() => icsWithDeltas(icsRecentSummaries(8))[2].deltas.positionsSet), null);
  is('the ISO week of 10 October 2026', await E(() => icsIsoWeekKey(new Date(2026, 9, 10))), '2026-W41');
  await E(() => { location.hash = '#/tree'; }); await p.waitForTimeout(600);
  yes('Tree Home folds the history under This week, closed', await E(() => { const d = document.querySelector('#trWeeksHist'); return !!d && !d.open; }));
  yes('a missing figure is a dash, not a zero', await E(() => /—/.test(document.querySelector('#trWeeksHist').textContent)));
  const shown = await E(() => { const before = JSON.stringify(S.treePrefs.summaries); icsWeeksHistoryHTML(); return before === JSON.stringify(S.treePrefs.summaries); });
  yes('showing it writes nothing', shown);
  yes('no page errors so far', errs.length === 0, errs);

  console.log('\nA-03. did you mean');
  const nm = await E(() => { const e = mk({title: 'Encoding', kind: 'branch', parentId: R.id}); const src = mk({title: 'Source page', body: 'See [[Encodng]] for more.'}); return {e: e.id, src: src.id, slug: src.slug, text: src.body}; });
  is('edit distance, transposition, early exit', await E(() => [icsEditDistance('Encodng', 'Encoding'), icsEditDistance('teh', 'the'), icsEditDistance('aaaa', 'bbbb', 2) > 2], 0), [1, 1, true]);
  is('similarity ignores case', await E(() => icsSimilarity('Duty of care', 'duty of care')), 1);
  is('a near match is offered; a far one is not', await E(() => [icsNearMatches('Encodng').map(x => x.title)[0], icsNearMatches('Zzzzzzzz').length]), ['Encoding', 0]);
  await E(a => { location.hash = '#/tree/p/' + a.slug; }, nm); await p.waitForTimeout(500);
  yes('the red link carries a ? hint', await E(() => !!document.querySelector('.tr-redwrap [data-trhint="Encodng"]')));
  yes('and the link is still red', await E(() => !!document.querySelector('.tr-link.red')));
  const gapsBefore = await E(() => treeGaps().red.some(r => r.title === 'Encodng'));
  yes('a red link with suggestions still counts as a gap', gapsBefore);
  await p.click('[data-trhint="Encodng"]'); await p.waitForTimeout(300);
  await p.click('[data-act="alias"]'); await p.waitForTimeout(500);
  const aft = await E(a => ({text: treeNode(a.src).body, alias: S.treeAliases.some(x => x.nodeId === a.e && x.alias === 'encodng'), red: treeGaps().red.some(r => r.title === 'Encodng')}), nm);
  is('accepting adds an alias and leaves the source text byte for byte', [aft.text === nm.text, aft.alias, aft.red], [true, true, false]);

  console.log('\nA-04. earlier versions of a page');
  const rv = await E(() => { const q = mk({title: 'Negligence', body: 'first'}); const id = q.id; const n0 = icsRevisionsFor(id).length;
    treeSavePage({id, body: 'second'}); const a = icsRevisionsFor(id).length;
    treeSavePage({id, body: 'second'}); const b2 = icsRevisionsFor(id).length;
    treeSavePage({id, body: 'third'}); const c = icsRevisionsFor(id).length, top = icsRevisionsFor(id)[0].text;
    const oldest = icsRevisionsFor(id)[icsRevisionsFor(id).length - 1]; icsRestoreRevision(oldest.id);
    return {n0, a, b2, c, top, body: treeNode(id).body, after: icsRevisionsFor(id).length, id}; });
  is('a changed text keeps exactly one version; an unchanged save keeps none', [rv.n0, rv.a, rv.b2], [0, 1, 1]);
  is('newest first, holding the text as it was before', [rv.c, rv.top], [2, 'second']);
  is('restoring appends: the old text is current and the list grew', [rv.body, rv.after], ['first', 3]);
  is('a rename is a version too, and the title is not restored over a rename', await E(a => { const id = a.id; const was = treeNode(id).title; treeSavePage({id, title: was + ' renamed'}); const rev = icsRevisionsFor(id)[0]; const t0 = rev.fields.title; icsRestoreRevision(rev.id); return [t0 === was, treeNode(id).title === was + ' renamed']; }, rv), [true, true]);
  is('a saved version cannot be edited or removed', await E(a => { const r = icsRevisionsFor(a.id)[0]; try { r.text = 'x'; } catch(e){} return [Object.isFrozen(r), r.text !== 'x']; }, rv), [true, true]);
  is('position immutability is untouched', await E(a => { const r = treeAddPosition(a.id, 'I hold this', 70); try { r.position.statement = 'changed'; } catch(e){} return treePositionsOf(a.id)[0].statement; }, rv), 'I hold this');
  await E(a => { location.hash = '#/tree/p/' + treeNode(a.id).slug; }, rv); await p.waitForTimeout(500);
  yes('the page shows its earlier versions, folded', await E(() => { const d = document.querySelector('#trHistory'); return !!d && !d.open && +d.querySelector('[data-count]').textContent >= 3; }));
  const exp = await E(a => { const blob = JSON.parse(JSON.stringify({kind: 'life-instrument-knowledge-tree', version: 1, data: Object.fromEntries(TREE_STORES.map(k => [k, S[k]]))})); const r = treeImport(blob); return [!!blob.data.treePageRevisions.length, r.added.treePageRevisions]; }, rv);
  is('versions travel in the export, and import adds nothing twice', exp, [true, 0]);

  console.log('\nA-05. gaps of encoding');
  const gp = await E(() => {
    const has = (id, t) => icsHasGap(id, t);
    const isl = mk({title: 'Island', whyImportant: 'because'}); const o = {isl: has(isl.id, 'island')};
    const other = mk({title: 'Other'}); treeAddGraft(isl.id, other.id, 'extends', 'both turn on reliance'); o.islAfter = has(isl.id, 'island');
    const br = mk({title: 'Crowded', kind: 'branch', parentId: R.id}); for(let i = 0; i < 5; i++) mk({title: 'kid' + i, parentId: br.id}); o.crowd = has(br.id, 'unchunked-children');
    const stub = mk({title: 'Stubby', status: 'stub'}); o.stub = [has(stub.id, 'no-why-important'), has(stub.id, 'never-retrieved'), has(stub.id, 'island')];
    o.noWhy = has(mk({title: 'Plain'}).id, 'no-why-important');
    icsRegisterGapRule({type: 'boom', label: 'b', hint: '', test(){ throw new Error('x'); }}); o.survives = Array.isArray(icsCollectGaps());
    ICS_GAP_RULES.pop();
    o.counts = typeof icsGapCountsByType().island; o.tot = treeGaps().total >= treeGaps().red.length;
    return o; });
  is('an island is a gap until a graft joins it', [gp.isl, gp.islAfter], [true, false]);
  is('five loose children are a gap', gp.crowd, true);
  is('a stub is never asked why it matters, nor whether it was retrieved, nor called an island', gp.stub, [false, false, false]);
  is('a rule that throws does not stop the others', gp.survives, true);
  is('a page with no reason written is prompted', gp.noWhy, true);
  await E(() => { location.hash = '#/tree/gaps'; }); await p.waitForTimeout(600);
  yes('the Gaps page groups them by type with a hint', await E(() => !!document.querySelector('.tr-encgaps .tr-gaptype') && !!document.querySelector('.tr-encgaps .tr-hint')));
  yes('the tile keeps a single total, with the breakdown on hover', await E(() => { location.hash = '#/tree'; return true; }) && (await p.waitForTimeout(500), await E(() => /\d+ /.test(document.querySelector('a.tr-tile[href="#/tree/gaps"]').title))));

  /* the sections of later amendments are added below, in the order they are built */
  yes('no page errors', errs.length === 0, errs);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close(); process.exit(bad ? 1 : 0);
})();
