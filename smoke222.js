/* smoke222 — core, enrichment, and the fast track through them.

   WHAT IS CLAIMED. Every exercise has exactly one of the three tiers. Core
   is the Siskind curriculum's own exercises (and Stage 0's foundations);
   enrichment is the other books, the v3 document's additions, and every
   worksheet and listening assignment. The fast track is a strict subset of
   core, eight to ten a main-line stage, never a worksheet, a listening or a
   page of pure theory, with a coordination and an improvising exercise
   wherever the stage has one. Stages too thin in Siskind (4, 5, 11) are
   topped up from their own playable exercises rather than left with holes.
   getExercisesByTier and classifyExercises say the same thing as the page,
   and a tier you set yourself survives a reload.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }

  console.log('\n1. every exercise has one tier');
  const T = await p.evaluate(() => {
    const ids = jazzStages().flatMap(s => s.subs);
    const tiers = {}; ids.forEach(id => { const t = jazzTierOf(id); tiers[t] = (tiers[t] || 0) + 1; });
    const bad = ids.filter(id => !['core', 'enrichment', 'fast-track'].includes(jazzTierOf(id)));
    const book = id => (jazzExercise(id).ref || {}).book || '';
    return {n: ids.length, tiers, bad,
      /* the rule itself, checked on the exercises the rule is sure about */
      siskindNotCore: ids.filter(id => /^Siskind/.test(book(id)) && !jazzExercise(id).isV3
        && !['WORKSHEET', 'LISTEN'].includes(jazzExercise(id).type)
        && !JAZZ_TIER_ENRICH_NAME.test(jazzExercise(id).name) && !jazzTierIsCore(jazzTierOf(id))),
      worksheetsCore: ids.filter(id => ['WORKSHEET', 'LISTEN'].includes(jazzExercise(id).type) && jazzTierIsCore(jazzTierOf(id))),
      voiceCore: ids.filter(id => /^V/.test(jazzExercise(id).stage) && jazzTierIsCore(jazzTierOf(id)))};
  });
  is('no exercise without a tier', T.bad, []);
  yes('all three tiers are used', T.tiers.core && T.tiers.enrichment && T.tiers['fast-track'], T.tiers);
  is('every Siskind exercise is core (or essential)', T.siskindNotCore, []);
  is('no worksheet or listening is core', T.worksheetsCore, []);
  is('the voice track is enrichment, as the rule says', T.voiceCore, []);

  console.log('\n2. the fast track, stage by stage');
  const F = await p.evaluate(() => JAZZ_TIER_MAIN.map(sid => {
    const s = jazzStage(sid);
    const ft = s.subs.filter(id => jazzTierOf(id) === 'fast-track');
    const ex = ft.map(jazzExercise);
    const hasCoord = s.subs.some(id => jazzTierIsCore(jazzTierOf(id)) && jazzIsCoordination(jazzExercise(id)));
    const hasCrea = s.subs.some(id => jazzTierIsCore(jazzTierOf(id)) && jazzIsCreative(jazzExercise(id)));
    return {sid, n: ft.length, playableCore: s.subs.filter(id => jazzTierIsCore(jazzTierOf(id)) && jazzIsPlayable(jazzExercise(id))).length,
      forbidden: ex.filter(e => ['WORKSHEET', 'LISTEN'].includes(e.type) || (e.type === 'THEORY' && !jazzHasScore(e))).map(e => e.id),
      coordOk: !hasCoord || ex.some(jazzIsCoordination), creaOk: !hasCrea || ex.some(jazzIsCreative),
      inOrder: JSON.stringify(ft) === JSON.stringify(s.subs.filter(id => ft.includes(id)))};
  }));
  is('eight to ten on every main-line stage that has eight to choose from',
    F.filter(f => f.playableCore >= 8 && (f.n < 8 || f.n > 10)).map(f => `${f.sid}:${f.n}`), []);
  is('  and every playable core exercise on a thinner one', F.filter(f => f.playableCore < 8 && f.n !== f.playableCore).map(f => f.sid), []);
  is('  never a worksheet, a listening or a page of pure theory', F.filter(f => f.forbidden.length).map(f => `${f.sid}:${f.forbidden}`), []);
  is('  a coordination exercise wherever the stage has one', F.filter(f => !f.coordOk).map(f => f.sid), []);
  is('  and an improvising one wherever the stage has one', F.filter(f => !f.creaOk).map(f => f.sid), []);
  is('  kept in the curriculum\'s order', F.filter(f => !f.inOrder).map(f => f.sid), []);
  const thin = F.filter(f => ['4', '5', '11'].includes(f.sid)).map(f => f.n);
  yes('Stages 4, 5 and 11 are topped up rather than left empty', thin.every(n => n > 0), thin);
  const ft4 = await p.evaluate(() => getExercisesByTier(4, 'fast-track').map(r => r.id));
  yes('  Stage 4 reaches eight', ft4.length >= 8, ft4.join(' '));

  console.log('\n3. the functions the brief names');
  const A = await p.evaluate(() => {
    const r = jazzExerciseRecord('2.1');
    const core2 = getExercisesByTier(2, 'core').map(x => x.id);
    const ft2 = getExercisesByTier(2, 'fast-track').map(x => x.id);
    const en2 = getExercisesByTier(2, 'enrichment').map(x => x.id);
    const cl = classifyExercises(jazzStage('2').subs.map(jazzExerciseRecord));
    return {r, fields: Object.keys(r).sort(), subset: ft2.every(id => core2.includes(id)),
      partition: core2.length + en2.length === jazzStage('2').subs.length,
      agree: cl.every(x => x.tier === jazzTierOf(x.id)), clN: cl.length,
      subsections: [...new Set(jazzStage('2').subs.map(jazzSubsectionOf))]};
  });
  is('the data model has the brief\'s fields', A.fields, ['description', 'estimatedMinutes', 'id', 'isOriginalCurriculum',
    'keysRequired', 'practiceTips', 'prerequisiteIds', 'source', 'stageId', 'subsection', 'tier', 'title', 'type']);
  is('  2.1 reads as the brief\'s example does', [A.r.stageId, A.r.subsection, A.r.type, A.r.tier, A.r.keysRequired, A.r.isOriginalCurriculum],
    [2, '2A', 'NOTATION', 'fast-track', 12, true]);
  yes('  its source says which book and unit', /^siskind-b1-u\d+$/.test(A.r.source), A.r.source);
  yes('  and it stands on the stage before it', A.r.prerequisiteIds.length > 0, A.r.prerequisiteIds);
  yes('getExercisesByTier: the fast track is inside core', A.subset);
  yes('  and core and enrichment are the whole stage', A.partition);
  yes('classifyExercises agrees with the page', A.agree && A.clN > 20, A.clN);
  yes('the stage is lettered into subsections', A.subsections.length >= 4 && A.subsections[0] === '2A', A.subsections);

  console.log('\n4. a tier of your own, kept');
  await p.evaluate(() => { location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(1500);
  await p.selectOption('#jzTierSet', 'enrichment'); await p.waitForTimeout(600);
  await p.evaluate(async () => { await saveNow(); await load(); });
  const O = await p.evaluate(() => ({tier: jazzTierOf('2.1'), mine: jazzTierOverrides()['2.1'],
    badge: !!document.querySelector('.jz-tierrow .jz-tier-enrichment')}));
  is('setting a tier on the exercise page sticks through a reload', [O.tier, O.mine], ['enrichment', 'enrichment']);
  await p.evaluate(() => { location.hash = '#/jazz'; }); await p.waitForTimeout(300);
  await p.evaluate(() => { location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(1500);
  await p.click('#jzTierReset'); await p.waitForTimeout(600);
  is('  and "back to the rule" undoes it', await p.evaluate(() => [jazzTierOf('2.1'), jazzTierOverrides()['2.1'] || null]), ['fast-track', null]);

  console.log('\n5. on the roadmap');
  await p.evaluate(() => { jazzStartStage('2', 'standard'); location.hash = '#/jazz'; }); await p.waitForTimeout(1500);
  const R = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('[data-jzstage="2"] button.jz-sub')];
    const tiers = rows.map(r => (r.querySelector('.jz-tier') || {className: ''}).className.replace(/.*jz-tier-/, ''));
    return {n: rows.length, badges: rows.filter(r => r.querySelector('.jz-tier')).length, tiers};
  });
  is('every row wears its tier', R.badges, R.n);
  const rank = {'fast-track': 0, core: 1, enrichment: 2};
  yes('  and the stage you are on lists fast-track, then core, then enrichment',
    R.tiers.every((t, i) => i === 0 || rank[t] >= rank[R.tiers[i - 1]]), R.tiers.join(' '));
  await p.click('[data-jztrack="fast-track"]'); await p.waitForTimeout(1200);
  const FT = await p.evaluate(() => ({rows: document.querySelectorAll('[data-jzstage="2"] button.jz-sub').length,
    said: (document.querySelector('[data-jzstage="2"] .jz-subsbar') || {}).textContent || '',
    weeks: (document.querySelector('[data-jzstage="2"] .jz-weeks') || {}).textContent || ''}));
  is('the fast track shows only the essentials', FT.rows, 8);
  yes('  and says how many are mastered', /0 of 8 fast-track exercises mastered/.test(FT.said), FT.said);
  yes('  with the rest hidden, not removed', /show all \(\d+ more\)/.test(FT.said), FT.said);
  yes('  and the stage in about half the time', /3 weeks on the fast track/.test(FT.weeks), FT.weeks);
  await p.click('[data-jzshowall="2"]'); await p.waitForTimeout(900);
  is('"show all" brings the rest back', await p.evaluate(() => document.querySelectorAll('[data-jzstage="2"] button.jz-sub').length), R.n);
  await p.click('[data-jztrack="full"]'); await p.waitForTimeout(900);

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
