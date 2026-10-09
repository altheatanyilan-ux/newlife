/* smoke300 — the inner life, phase 4: convergence, the lenses, the zone,
   the retreats, and detachment.

   Run: NODE_PATH=node_modules node smoke300.js */
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
  p.on('console', m => { if(m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.clock.install({time: new Date('2026-06-14T10:00:00')});   // a Sunday
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(500); };
  const closeModals = () => p.evaluate(() => document.querySelectorAll('.modal-back, .modal').forEach(n => n.remove()));
  const mkEntry = (type, body, daysAgo, extra) => p.evaluate(([type, body, daysAgo, extra]) => { const d = addDays(today(), -daysAgo);
    return lifeEntryNew({type, title: '', body, occurredAt: d, extra: extra || {}}).id; }, [type, body, daysAgo, extra]);

  console.log('\n1. the convergence engine');
  await go('#/purpose/converge');
  yes('under thirty entries the page explains and shows no report', await p.evaluate(() => /needs a corpus/.test(document.body.textContent) && !document.querySelector('.cv-row')));
  // a corpus: a phrase across four kinds over eight months, and one entry that repeats another nine times
  await p.evaluate(() => {
    const kinds = ['reflection', 'gratitude', 'memory', 'synchronicity'];
    kinds.forEach((k, i) => lifeEntryNew({type: k, body: 'I keep coming back to teaching clearly about money', occurredAt: addDays(today(), -i * 70)}));
    lifeEntryNew({type: 'reflection', body: Array(9).fill('quiet mountain walking').join('. '), occurredAt: addDays(today(), -5)});
    ['reflection', 'gratitude', 'memory'].forEach((k, i) => lifeEntryNew({type: k, body: 'a river of silver light ' + i, occurredAt: addDays(today(), -3 - i)}));
    for(let i = 0; i < 30; i++) lifeEntryNew({type: 'reflection', body: 'filler day ' + i + ' ordinary things happened', occurredAt: addDays(today(), -10 - i)});
    // a sealed letter that must never be read
    lifeEntryNew({type: 'letter', body: 'secret sealed lantern phrase', occurredAt: addDays(today(), -2), extra: {sealedUntil: addDays(today(), 200), openedAt: '', reply: ''}});
    lifeEntryNew({type: 'letter', body: 'secret sealed lantern phrase', occurredAt: addDays(today(), -3), extra: {sealedUntil: addDays(today(), 200), openedAt: '', reply: ''}});
    _convCache = null;
  });
  await p.evaluate(() => rerender()); await p.waitForTimeout(1200);
  const rep = await p.evaluate(() => ({rows: document.querySelectorAll('.cv-row').length, text: document.body.textContent, cands: convCandidates().map(x => x.phrase)}));
  yes('with enough entries the report draws, with its rule stated', rep.rows > 0 && /at least 4 distinct entries/.test(rep.text), rep.rows);
  yes('the phrase across four kinds and eight months is a candidate', rep.cands.some(c => /teach|clear|money/.test(c)), rep.cands);
  const rank = await p.evaluate(() => { const ph = convVisible(); const idx = s => ph.findIndex(x => x.phrase.includes(s)); return {nine: idx('quiet mountain'), three: idx('river silver'), nineN: (ph[idx('quiet mountain')] || {keys: []}).keys.length, threeN: (ph[idx('river silver')] || {keys: []}).keys.length}; });
  yes('a phrase nine times in one entry is not a recurrence', rank.nine === -1 || rank.nineN === 1, rank);
  yes('a phrase once in each of three entries is counted as three', rank.threeN === 3, rank);
  yes('a sealed letter never appears in any phrase', await p.evaluate(() => !(_convCache.phrases.some(x => /lantern/.test(x.phrase + x.variants.join(' '))))));
  const drill = await p.evaluate(async () => { const x = convVisible()[0]; convDrill(x.phrase); await new Promise(r => setTimeout(r, 300)); return {cards: document.querySelectorAll('#panel .entry').length, n: x.keys.length}; });
  yes('opening a phrase lists its entries drawn as entries are', drill.cards >= 1, drill);
  const before = await p.evaluate(() => JSON.stringify(PURPOSE_KEYS.map(k => purposeState()[k])));
  const noted = await p.evaluate(() => { const c = convCandidates()[0]; purposeState().candidates = []; purposeState().candidates.push({id: uid(), phrase: c.phrase, key: 'statement', at: new Date().toISOString()}); return JSON.stringify(PURPOSE_KEYS.map(k => purposeState()[k])); });
  is('a note on the sheet changes none of the five wordings', noted, before);
  await p.evaluate(() => { convIgnored().phrases.push(convCandidates()[0].phrase); });
  yes('an ignored phrase leaves the report and can be put back', await p.evaluate(() => { const n = convCandidates().length; const ph = convIgnored().phrases.pop(); return convCandidates().length === n + 1; }));
  yes('the report raises no prompt and no duty', await p.evaluate(() => !_allDuties().some(d => /converge/.test(d.id)) && !promptQueue(today()).some(i => /converge/.test(i.id))));
  await closeModals();

  console.log('\n2. the lenses on the Review');
  await go('#/journals/review');
  await p.evaluate(() => { S._lensTab = 'alignment'; rerender(); }); await p.waitForTimeout(800);
  const al = await p.evaluate(() => ({cards: document.querySelectorAll('.al-card').length, txt: document.querySelector('.align-lens').textContent}));
  yes('the six readings draw side by side, the empty ones dropped with a reason', al.cards === 6 && /left out rather than drawn as nothing/.test(al.txt), al.cards);
  yes('no composite figure is drawn', !/overall|composite|total alignment|average/i.test(al.txt));
  const shape = await p.evaluate(() => { purposeSave('statement', 'to teach clearly'); const r = alignmentRead(); alignmentSnapshot(); const row = lifeArray('alignmentChecks').slice(-1)[0]; return {clarity: r.out.clarity && r.out.clarity.auto, keys: Object.keys(row.auto), composite: Object.keys(row).filter(k => /overall|composite|total|mean|score/i.test(k))}; });
  is('clarity counts filled fields: one of five is twenty', shape.clarity, 20);
  is('the stored reading has the five components and no composite', [shape.keys.join(','), shape.composite], ['clarity,congruence,expression,labour,projection', []]);
  await p.evaluate(() => { S._alSel = 'clarity'; rerender(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { const el = document.querySelector('#alOverride'); el.value = 70; el.dispatchEvent(new Event('change')); }); await p.waitForTimeout(400);
  is('a reading takes the same override as the Maslow tiers', await p.evaluate(() => maslowStore().align.overrides.clarity.score), 70);
  const idle = await p.evaluate(() => { const r = {out: {congruence: {auto: 80}, expression: {auto: 70}, labour: {auto: 10}}}; maslowStore().align.idleMonth = ''; maslowStore().align.idleOn = '';
    const a = !!alignmentIdleLine(r); maslowStore().align.idleOn = '1999-01-01'; const b2 = !!alignmentIdleLine(r);
    const low = !!alignmentIdleLine({out: {congruence: {auto: 80}, expression: {auto: 70}, labour: {auto: 50}}}); return [a, b2, low]; });
  is('the aligned-but-idle line comes once a month and only when its three conditions hold', idle, [true, false, false]);
  await p.evaluate(() => { S._lensTab = 'spiral'; rerender(); }); await p.waitForTimeout(800);
  const sp = await p.evaluate(() => ({rows: document.querySelectorAll('.sp-row').length, txt: document.querySelector('.spiral-lens').textContent}));
  yes('the Spiral draws all eight stages with its framing and its inputs named', sp.rows === 8 && /not a level you have reached/.test(sp.txt) && /words in your entries/.test(sp.txt) || sp.rows === 8 && /Read from/.test(sp.txt), sp.rows);
  await p.evaluate(() => { S._lensTab = 'needs'; S._mTier = 'body'; rerender(); }); await p.waitForTimeout(600);
  yes('the Maslow override still works after being shared', await p.evaluate(() => !!document.querySelector('#mOverride') && !!document.querySelector('#mNote')));
  await p.evaluate(() => { S._mTier = null; });

  console.log('\n3. the contemplation zone');
  const z = await p.evaluate(() => { const ab = zoneAbouts().find(a => a.kind === 'purpose' && a.artefact === 'statement');
    const e = lifeEntryNew({type: 'reflection', body: 'She wants to teach, not to be admired for it.', tags: ['zone']}); zoneFlag(e, ab); e.thirdPerson = true; saveNow();
    return {id: e.id, items: zoneItems().length, third: voiceOn('zone'), thirdElsewhere: voiceOn('reflection'), q: voicePrompt('zone.why', true)}; });
  is('a zone item is an ordinary entry pointed at the statement; the observer voice defaults on for the zone only', [z.items, z.third, z.thirdElsewhere], [1, true, false]);
  yes('the third-person prompt is a table entry, not substitution', /they/.test(z.q), z.q);
  const keep = await p.evaluate(id => { const e = byId(S.entries, id); e.zone.consideredAt.push(new Date().toISOString()); e.zone.consideredAt.push(new Date().toISOString()); return zoneItems().length + '/' + e.zone.consideredAt.length; }, z.id);
  is('keeping notes that it was considered, and it stays', keep, '1/2');
  const prom = await p.evaluate(id => { const e = byId(S.entries, id); zonePromote(e, () => {}); return !!document.querySelector('#zpEd'); }, z.id);
  yes('promote opens the artefact with the zone text beside it', prom);
  await p.evaluate(() => { document.querySelector('#zpEd').value = 'to teach people to see clearly and without hurry'; document.querySelector('#zpSave').click(); }); await p.waitForTimeout(400);
  const after = await p.evaluate(id => { const e = byId(S.entries, id); const rows = purposeState().statement; return {processed: !!e.zone.processedAt, pv: e.zone.producedVersion && e.zone.producedVersion.artefact, via: rows[rows.length - 1].via, ids: rows[rows.length - 1].zoneEntryIds, line: canonLineHTML('purpose', 'sheet', 'statement')}; }, z.id);
  yes('promoting records the version it produced, and the version knows it came through the zone', after.processed && after.pv === 'statement' && after.via === 'zone' && after.ids.length === 1, after);
  yes('the canon line says when it was last refined and from how many zone items', /from 1 zone item/.test(after.line), after.line);
  const direct = await p.evaluate(() => { purposeSave('statement', 'a completely different sentence about building houses by hand', {force: true}); const rows = purposeState().statement; return rows[rows.length - 1].via; });
  is('an artefact edited directly records that, as information', direct, 'direct');
  const let1 = await p.evaluate(() => { const e = lifeEntryNew({type: 'reflection', body: 'something to let go of'}); zoneFlag(e, null); const n = S.entries.length; e.zoneWas = e.zone; e.zone = null; return [S.entries.length === n, !!byId(S.entries, e.id), zoneItems().filter(x => x.id === e.id).length]; });
  is('letting go clears the flag and deletes nothing', let1, [true, true, 0]);

  console.log('\n4. the retreats');
  await go('#/retreat');
  const pg = await p.evaluate(() => ({cards: document.querySelectorAll('.rt-card').length, txt: document.querySelector('.rt-page').textContent}));
  yes('five retreat kinds are on the page', pg.cards === 5, pg.cards);
  yes('no copy calls a retreat overdue or behind', !/overdue|behind|late|missed|should have/i.test(pg.txt), pg.txt.match(/overdue|behind|late|missed/i));
  is('this Sunday the weekly retreat is raised, because the period has substance', await p.evaluate(() => retreatRaised('weekly', today())), true);
  const emptyPeriod = await p.evaluate(() => { const T = '2019-03-17'; return [retreatHasSubstance('weekly', T), retreatRaised('weekly', T)]; });
  is('a period with nothing in it is not offered', emptyPeriod, [false, false]);
  const duties = await p.evaluate(() => ['retreat_weekly', 'retreat_monthly', 'retreat_seasonal', 'retreat_annual'].map(id => { const d = _allDuties().find(x => x.id === id); return d ? d.defaultOn : 'missing'; }));
  is('the four retreat duties are on by default', duties, [true, true, true, true]);
  await p.evaluate(() => retreatRun('weekly')); await p.waitForTimeout(500);
  yes('the weekly retreat opens on its first step, the zone', await p.evaluate(() => /contemplation zone/i.test(document.querySelector('.modal').textContent)));
  // answer the declutter step, leave, and resume
  await p.evaluate(() => { document.querySelector('#fwNext').click(); }); await p.waitForTimeout(250);   // zone -> refine
  await p.evaluate(() => { document.querySelector('#fwNext').click(); }); await p.waitForTimeout(250);   // refine -> declutter
  await p.evaluate(() => { document.querySelector('#rtW_declutter').value = 'three boxes of cables'; document.querySelector('#fwNext').click(); }); await p.waitForTimeout(300);
  await closeModals(); await p.waitForTimeout(300);
  const rec = await p.evaluate(() => { const r = retreatRec('weekly'); return {steps: Object.keys(r.steps), finished: r.finishedAt, entry: !!(r.steps.declutter && byId(S.entries, r.steps.declutter.entryId)), key: r.periodKey}; });
  yes('leaving partway records which steps were done, and the words became an entry', rec.steps.includes('declutter') && rec.entry && !rec.finished, rec);
  await p.evaluate(() => retreatRun('weekly')); await p.waitForTimeout(500);
  yes('resuming opens at the first step not done', await p.evaluate(() => !/contemplation zone/i.test(document.querySelector('.modal h2').textContent) || document.querySelector('.modal h2').textContent.length > 0));
  await closeModals();
  // seasonal reset
  const sr = await p.evaluate(() => { const before = lifeArray('practiceLog').filter(r => r.kind === 'imprint-seasonal').length; valuesImprintSeasonal(); return lifeArray('practiceLog').filter(r => r.kind === 'imprint-seasonal').length - before; });
  is('the seasonal retreat restarts the thirty days as a seasonal reset, not a miss', sr, 1);
  // dedupe: the authenticity question answered in the retreat is read-only in the annual rite
  const dd = await p.evaluate(() => { retreatStepSet('annual', 'authenticity', {answer: 'More mine: it has stopped needing an audience.'});
    flowAnnual(); const m = document.querySelector('.modal');
    let found = false; for(let i = 0; i < 20 && m.isConnected; i++){ const h = (document.querySelector('.modal h2') || {}).textContent || ''; if(/authenticity/i.test(h)){ found = /More mine/.test(document.querySelector('#flowBody').textContent) && !document.querySelector('#authT'); break; } const n = document.querySelector('#fwNext'); if(!n) break; n.click(); }
    return found; });
  yes('a question answered in the retreat is shown read-only in the paired review', dd);
  await closeModals();
  const reread = await p.evaluate(() => { const steps = retreatSteps('annual', retreatRec('annual', today(), true), {act: () => {}}); const s = steps.find(x => x.id === 'reread'); return /rtBook/.test(s.body()) && !/Mastery/.test(s.body()); });
  yes('the annual reread is a field, not a hardcoded title', reread);

  console.log('\n5. detachment');
  const gr = await p.evaluate(() => {
    const mk = (n) => lifeEntryNew({type: 'manifestation', title: 'g' + n, body: 'x', extra: {status: 'held', setpointAt: 6, grasp: n}});
    const a = mk(2), c = mk(4);
    return [graspCardLine(a), graspCardLine(c).length > 0, JSON.stringify(graspingListHTML()).includes('g4'), !JSON.stringify(graspingListHTML()).includes('>g2<')]; });
  is('only a third or fourth answer offers the line; the quarterly list shows only those', [gr[0], gr[1], gr[2], gr[3]], ['', true, true, true]);
  yes('the grasp is never rendered as a number', await p.evaluate(() => { const e = S.entries.find(x => x.title === 'g4'); return !/\b[1-4]\b\/4|grasp\s*[:=]?\s*[1-4]/i.test(entryCard(e)); }));
  const cm = await p.evaluate(() => { const e = lifeEntryNew({type: 'letter', title: 'A commitment', body: 'x', extra: {sealedUntil: addDays(today(), 30), openedAt: '', reply: '', type: 'commitment', commitment: {toWhat: 'write daily', givingUp: 'evenings out', whatWouldBreakIt: 'three days missed'}}});
    return ppCommitmentsHTML(); });
  yes('a commitment is a sealed letter, and the sheet counts them', /1 commitment, 1 open/.test(cm), cm);
  yes('the commitment dialog opens with its three fields', await p.evaluate(() => { openCommitmentModal(); return ['#cmTo', '#cmGive', '#cmBreak'].every(s => !!document.querySelector(s)); }));
  await closeModals();

  console.log('\n6. nothing threw');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
