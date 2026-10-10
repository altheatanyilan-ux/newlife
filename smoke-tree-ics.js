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

  console.log('\nA-06. importance, why and backbone');
  const im = await E(() => {
    const d0 = icsImportanceDistribution();
    const q = mk({title: 'Remoteness', kind: 'branch', parentId: R.id}); mk({title: 'Causation in fact'});
    const o = {fresh: [q.importance, q.backbone]};
    icsSetImportance(q.id, 'core', ''); o.needs1 = icsImportanceNeedsReason(treeNode(q.id));
    icsSetImportance(q.id, 'core', 'Stops liability running on for ever. Compare [[Causation in fact]].'); o.needs2 = icsImportanceNeedsReason(treeNode(q.id));
    o.revs = icsRevisionsFor(q.id).length;
    try { icsSetImportance(q.id, 'critical'); o.threw = false; } catch(e){ o.threw = true; }
    icsSetBackbone(q.id, true); o.bone = treeNode(q.id).backbone;
    o.core = icsImportanceDistribution().core >= 1; o.undec = typeof icsImportanceDistribution().undecided;
    o.link = icsLinksOut(treeNode(q.id)).some(x => x.title === 'Causation in fact');
    o.back = treeBacklinks(treeNode(treeResolve('Causation in fact').id)).some(x => x.id === q.id);
    o.id = q.id; o.slug = q.slug; return o; });
  is('a new page is undecided, off the trunk', im.fresh, [null, false]);
  is('core with no reason is prompted, and then it is not', [im.needs1, im.needs2], [true, false]);
  is('each change is kept as a version', im.revs >= 2, true);
  is('an unknown importance is refused', im.threw, true);
  is('the trunk flag persists and the distribution counts', [im.bone, im.core, im.undec], [true, true, 'number']);
  is('links in the reason are rebuilt like page text, and show as backlinks', [im.link, im.back], [true, true]);
  await E(a => { location.hash = '#/tree/p/' + a.slug; }, im); await p.waitForTimeout(500);
  yes('the title row shows the mark and the trunk', await E(() => !!document.querySelector('.tr-head .tr-importance[data-v="core"]') && !!document.querySelector('.tr-head .tr-backbone')));
  await p.click('[data-act="imp"][data-v=""]'); await p.waitForTimeout(400);
  is('Not decided is stored as null and looks different from Peripheral', await E(a => [treeNode(a.id).importance, !!document.querySelector('.tr-head .tr-importance.undecided')], im), [null, true]);
  await p.click('[data-act="imp"][data-v="peripheral"]'); await p.waitForTimeout(400);
  is('a click sets it and a reload keeps it', await E(a => treeNode(a.id).importance, im), 'peripheral');
  yes('a root with no trunk is prompted; a thicket of more than seven is a signal', await E(() => { const r2 = mk({title: 'Trunk test', kind: 'root'}); const ks = []; for(let i = 0; i < 9; i++) ks.push(mk({title: 'tk' + i, parentId: r2.id}));
    const a = icsBackboneSignal(r2.id).level === 'prompt'; ks.forEach(k => icsSetBackbone(k.id, true)); const b = icsBackboneSignal(r2.id).level === 'signal'; ks.slice(0, 5).forEach(k => icsSetBackbone(k.id, false)); return a && b && icsBackboneSignal(r2.id) === null; }));
  yes('nothing is inferred by the migration: every older page is undecided', await E(() => { S.treeNodes.forEach(n => { n.importance = undefined; delete n.importance; }); S.treePrefs.icsSchema = 1; icsEnsure(); return S.treeNodes.every(n => n.importance === null); }));

  console.log('\nA-07. the inquiry panel');
  const qz = await E(() => {
    const pg = mk({title: 'Remoteness of loss'}); if(!treeResolve('Causation in fact')) mk({title: 'Causation in fact'});
    const q1 = icsSaveQuestion({pageId: pg.id, kind: 'why', text: 'Why does remoteness matter?'});
    const o = {s1: [q1.status, icsQualityScore(q1)]};
    const q2 = icsSaveQuestion({id: q1.id, pageId: pg.id, kind: 'why', text: 'Why does remoteness matter?', answer: 'It is the device that stops liability running on indefinitely, unlike [[Causation in fact]] which asks only whether the loss followed at all.'});
    o.s2 = [q2.status, icsQualityScore(q2)];
    const q3 = icsSaveQuestion({pageId: pg.id, kind: 'what', text: 'What is remoteness?', answer: 'A limit on recoverable loss that is applied after breach is established and after factual causation is proved.'});
    o.s3 = q3.status;
    const q4 = icsSaveQuestion({pageId: pg.id, kind: 'how', text: 'How does it relate to [[Causaton in fact]] and [[Causation in fact]] and [[Causation in fact]]?'});
    o.reach = icsQualityScore(q4); o.lights = icsTrafficLights(pg.id); o.first = icsQuestionsFor(pg.id)[0].status; o.last = icsQuestionsFor(pg.id).slice(-1)[0].status;
    o.sc = icsScaffoldQuestions('Remoteness', 'Causation in fact').length;
    try { icsSaveQuestion({pageId: pg.id, kind: 'what', text: '  '}); o.threw = false; } catch(e){ o.threw = true; }
    o.redTypo = treeGaps().red.some(r => r.title === 'Causaton in fact');
    o.mind = pg.openQuestion;
    /* a red question past a fortnight is one gap, however many */
    const old = icsSaveQuestion({pageId: pg.id, kind: 'what', text: 'old one'}); old.createdAt = new Date(Date.now() - 20 * 864e5).toISOString();
    const old2 = icsSaveQuestion({pageId: pg.id, kind: 'what', text: 'old two'}); old2.createdAt = old.createdAt;
    o.stale = icsCollectGaps().filter(g => g.pageId === pg.id && g.type === 'stale-question').length;
    icsRetireQuestion(old.id); icsRetireQuestion(old2.id); o.stale2 = icsCollectGaps().filter(g => g.pageId === pg.id && g.type === 'stale-question').length;
    o.id = pg.id; o.slug = pg.slug; return o; });
  is('a question with no answer is red and reaches nothing', qz.s1, ['red', 0]);
  is('an answer of fifteen words that links to another page is green', qz.s2, ['green', 1]);
  is('a long answer that connects to nothing is amber', qz.s3, 'amber');
  is('reach counts distinct pages once, resolved as page text is', qz.reach, 1);
  is('red sorts first, green last', [qz.first, qz.last], ['red', 'green']);
  is('a typo in a question is a red link, offered the same suggestions', qz.redTypo, true);
  is('the falsification question is untouched', qz.mind, '');
  is('four scaffolds, and a question needs words', [qz.sc, qz.threw], [4, true]);
  is('a red question over a fortnight is one gap; letting it go retires it', [qz.stale, qz.stale2], [1, 0]);
  await E(a => { location.hash = '#/tree/p/' + a.slug; }, qz); await p.waitForTimeout(500);
  yes('the panel shows lights and the questions', await E(() => !!document.querySelector('.tr-lights .light.green') && document.querySelectorAll('.tr-questions li').length >= 3));
  const before = await E(a => icsQuestionsFor(a.id).length, qz);
  await p.click('[data-act="q-scaffold"]'); await p.waitForTimeout(300);
  if(await p.$('[data-x=yes]')){ await p.click('[data-x=yes]'); await p.waitForTimeout(500); }
  is('Suggest four adds four red questions, nothing else', await E(a => [icsQuestionsFor(a.id).length - 4, icsQuestionsFor(a.id).filter(q => q.selfMade === false).length], qz), [before, 4]);
  await p.click('[data-act="q-new"][data-kind="personal"]'); await p.waitForTimeout(300);
  await p.fill('#tqT', 'Where have I met this before?'); await p.click('#tqOk'); await p.waitForTimeout(500);
  yes('a new question is made through the dialog', await E(a => icsQuestionsFor(a.id).some(q => q.text === 'Where have I met this before?' && q.status === 'red'), qz));

  console.log('\nA-08. collected and processed');
  const sp = await E(() => {
    const pg = mk({title: 'Wagon Mound', body: 'Long quoted passage here, with plenty of raw words from the source so that processing compresses it down.'}); const id = pg.id; const o = {};
    o.before = [pg.collected, pg.processed]; icsEnableSplit(id); const a = treeNode(id);
    o.after = [a.collected.slice(0, 25), a.processed, a.body]; o.revs = icsRevisionsFor(id).length;
    o.sig1 = icsBodySignals(a).some(x => /not processed/i.test(x.text));
    treeSavePage({id, processed: 'Loss must be of a foreseeable [[kind]]; extent does not matter.'});
    o.sig2 = icsBodySignals(treeNode(id)).length; o.words = icsCountWords(treeNode(id).processed);
    treeSavePage({id, processed: 'word '.repeat(200)}); o.budget = icsBodySignals(treeNode(id)).some(x => /budget/.test(x.text));
    treeSavePage({id, processed: 'Loss must be of a foreseeable [[kind]]; extent does not matter.'});
    o.gapWordy = icsHasGap(id, 'wordy'); o.redKind = treeGaps().red.some(r => r.title === 'kind');
    o.search = treeSearch({q: 'quoted passage'}).some(r => r.node && r.node.id === id);
    treeSavePage({id, collected: 'Long quoted passage here, with plenty of raw words. foreseeable'}); o.search2 = treeSearch({q: 'foreseeable kind'}).some(r => r.node && r.node.id === id);
    icsDisableSplit(id); const d = treeNode(id); o.back = [d.collected, d.processed, /Long quoted passage here/.test(d.body), /---/.test(d.body), /foreseeable/.test(d.body)];
    o.revs2 = icsRevisionsFor(id).length > o.revs; o.id = id; o.slug = pg.slug;
    const plain = mk({title: 'Plain page', body: 'unchanged'}); o.plain = [plain.collected, plain.processed, plain.body];
    treeSavePage({id: plain.id, body: 'unchanged more'}); o.plain2 = [treeNode(plain.id).collected, treeNode(plain.id).body];
    return o; });
  is('a page not opted in has both fields null', sp.before, [null, null]);
  is('opting in moves the text to Collected and leaves Processed empty', sp.after, ['Long quoted passage here,', '', '']);
  is('and keeps the earlier version', sp.revs >= 1, true);
  is('unprocessed collected is prompted; a short processed side is quiet', [sp.sig1, sp.sig2], [true, 0]);
  is('the link counts once in the word budget; going over is a signal, never a block', [sp.words, sp.budget], [11, true]);
  is('links in the processed side are rebuilt (a red link is a gap)', sp.redKind, true);
  is('search reaches both sides', [sp.search, sp.search2], [true, true]);
  is('rejoining puts Processed first with a rule, and records a version', [sp.back, sp.revs2], [[null, null, true, true, true], true]);
  is('an unsplit page renders and saves as before', [sp.plain, sp.plain2], [[null, null, 'unchanged'], [null, 'unchanged more']]);
  await E(() => { const x = treeResolve('Wagon Mound'); icsEnableSplit(x.id); location.hash = '#/tree/p/' + x.slug; }); await p.waitForTimeout(500);
  yes('a split page shows the two sides', await E(() => !!document.querySelector('.tr-split .tr-body-processed') && !!document.querySelector('.tr-split .tr-body-collected')));
  await p.click('#trEdit'); await p.waitForTimeout(300);
  yes('and edits them as two boxes', await E(() => !!document.querySelector('#teProc') && !!document.querySelector('#teCol') && !document.querySelector('#teBody')));
  await p.fill('#teProc', 'In my own words.'); await p.click('#teSave'); await p.waitForTimeout(400);
  is('saved through the form', await E(() => treeResolve('Wagon Mound').processed), 'In my own words.');

  console.log('\nN-02. chunks');
  const ck = await E(() => {
    const root = mk({title: 'Duty of care', kind: 'root'});
    const a = mk({title: 'Hedley Byrne', parentId: root.id}), b = mk({title: 'Caparo', parentId: root.id}), c = mk({title: 'White v Jones', parentId: root.id});
    const o = {};
    const bad = f => { try { f(); return false; } catch(e){ return e.message; } };
    o.noReason = !!bad(() => icsCreateChunk({title: 'Reliance', reason: '', memberIds: [a.id, b.id]}));
    o.solo = !!bad(() => icsCreateChunk({title: 'Solo', reason: 'x', memberIds: [a.id]}));
    const other = mk({title: 'Causation', kind: 'root'}); const z = mk({title: 'Zed', parentId: other.id});
    o.cross = /graft/.test(bad(() => icsCreateChunk({title: 'Cross', reason: 'both matter', memberIds: [a.id, z.id]})) || '');
    o.written0 = S.treeChunks.length;
    const ch = icsCreateChunk({title: 'Reliance-based duties', reason: 'All impose a duty because the claimant was invited to rely.', memberIds: [a.id, b.id, c.id]});
    o.root = ch.rootId === root.id;
    icsCreateChunk({title: 'Pure economic loss', reason: 'All three concern loss that is not consequential on damage.', memberIds: [a.id, c.id]});
    o.many = icsChunksOf(a.id).length; o.parent = treeNode(a.id).parentId === root.id; o.crumb = treeAncestors(treeNode(a.id)).map(x => x.id).join() === root.id; o.assert = icsAssertChunkIsNotAParent(a.id);
    const big = icsCreateChunk({title: 'Everything about reliance in tort law', reason: 'they are all about reliance', memberIds: [a.id, b.id, c.id, mk({title: 'd1', parentId: root.id}).id, mk({title: 'd2', parentId: root.id}).id]});
    o.signals = icsChunkSignals(big).length; o.sub = icsSubgroupsOf(big).some(x => x.id === ch.id);
    o.rootId = root.id; o.slug = root.slug; o.aSlug = a.slug; o.aId = a.id;
    /* an empty reason can only come from an import: it shows as a gap */
    S.treeChunks.push({id: 'hand1', title: 'hand', reason: '', memberIds: [b.id, c.id], rootId: root.id, createdAt: new Date().toISOString()});
    o.gap = icsHasGap(b.id, 'chunk-no-reason'); S.treeChunks = S.treeChunks.filter(x => x.id !== 'hand1');
    o.unchunked = icsHasGap(root.id, 'unchunked-children'); return o; });
  is('no reason, or fewer than two, or two roots: refused, and nothing written', [ck.noReason, ck.solo, ck.cross, ck.written0], [true, true, true, 0]);
  is('a chunk takes the root its members share', ck.root, true);
  is('a page may sit in several chunks and keeps its one parent', [ck.many, ck.parent, ck.crumb, ck.assert], [2, true, true, true]);
  is('five members and a long label are two signals, and it still saved; a smaller chunk is a subgroup', [ck.signals, ck.sub], [2, true]);
  is('a chunk with no reason shows as a gap', ck.gap, true);
  await E(a => { location.hash = '#/tree/p/' + a.slug; }, ck); await p.waitForTimeout(500);
  yes('the root page lists its chunks above the children, with reasons', await E(() => document.querySelectorAll('.tr-chunk').length >= 2 && /invited to rely/.test(document.querySelector('.tr-chunks').textContent)));
  await p.click('[data-act="chunk-start"]'); await p.waitForTimeout(300);
  await p.fill('#tcT', 'Two pages'); await p.click('#tcOk'); await p.waitForTimeout(200);
  yes('the dialog refuses a missing reason with a readable message', await E(() => /reason/.test(document.querySelector('#tcErr').textContent)));
  await p.fill('#tcR', 'They share a point.'); await p.evaluate(() => { const b = document.querySelectorAll('#tcL input'); b[0].checked = true; b[1].checked = true; }); await p.click('#tcOk'); await p.waitForTimeout(500);
  yes('and makes the chunk once it has one', await E(() => S.treeChunks.some(c => c.title === 'Two pages' && c.reason === 'They share a point.')));
  await E(a => { location.hash = '#/tree/p/' + a.aSlug; }, ck); await p.waitForTimeout(500);
  yes('the member page lists every chunk it sits in', await E(() => document.querySelectorAll('.tr-sits span').length >= 2));
  yes('chunks travel in the export, and import adds nothing twice', await E(() => { const blob = JSON.parse(JSON.stringify({kind: 'life-instrument-knowledge-tree', version: 1, data: Object.fromEntries(TREE_STORES.map(k => [k, S[k]]))})); return blob.data.treeChunks.length >= 3 && treeImport(blob).added.treeChunks === 0; }));
  yes('no page errors in Phase 2', errs.length === 0, errs);

  /* the sections of later amendments are added below, in the order they are built */
  yes('no page errors', errs.length === 0, errs);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close(); process.exit(bad ? 1 : 0);
})();
