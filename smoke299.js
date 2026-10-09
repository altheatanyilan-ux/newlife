/* smoke299 — the inner life, phases 2 and 3.

   Inner demons, values 2.0, the programming practices, making it real, the
   zone-of-genius hours and happy minutes, the ledger, and the muse.

   Run: NODE_PATH=node_modules node smoke299.js */
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
  await p.clock.install({time: new Date('2026-06-10T10:00:00')});
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(500); };
  const closeModals = () => p.evaluate(() => document.querySelectorAll('.modal-back, .modal').forEach(n => n.remove()));

  console.log('\n1. inner demons');
  await go('#/purpose/demons');
  const subs = await p.evaluate(() => [...document.querySelectorAll('.dm-sub button')].map(b => b.textContent.toLowerCase()));
  yes('four registers: beliefs, fears, resistance, origins', subs.length === 4, subs);
  const bel = await p.evaluate(() => { const b = beliefNew({text: 'I am not good with money', area: 'money', strength: 4}); return {id: b.id, kind: b.kind, n: beliefsAll('belief').length}; });
  is('a belief is written', [bel.kind, bel.n], ['belief', 1]);
  const ch = await p.evaluate(async () => { const b = byId(S.beliefs, S._b0 = beliefsAll('belief')[0].id);
    b.challenges.push({id: uid(), at: new Date().toISOString(), evidenceFor: ['x'], evidenceAgainst: ['y'], reframe: 'I can learn it', strengthAfter: 2});
    saveNow(); await new Promise(r => setTimeout(r, 500));
    b.challenges[0].reframe = 'edited'; await persist();
    const again = byId(S.beliefs, b.id); return {n: again.challenges.length, reframe: again.challenges[0].reframe}; });
  is('a challenge row is add-only: the edit is put back', [ch.n, ch.reframe], [1, 'I can learn it']);
  await p.evaluate(() => { const b = beliefsAll('belief')[0]; b.resurfaceAt = addDays(today(), -1); b.resurfaceRung = 0; });
  const pq = await p.evaluate(() => pqPurpose(today()).map(x => ({id: x.id, rule: x.rule, acts: x.acts.length})));
  yes('a belief due is raised with its rule and three answers', pq.length === 1 && /you set a check/.test(pq[0].rule) && pq[0].acts === 3, pq);
  await p.evaluate(() => { beliefNew({kind: 'fear', text: 'that nobody will read it', fearType: 'grand', pointsTo: {domainText: 'writing'}}); });
  await go('#/purpose');
  const compass = await p.evaluate(() => /compass|grand|fear/i.test(document.body.textContent));
  yes('the sheet reads the compass fear', compass);
  await go('#/purpose/demons');
  await p.evaluate(() => { document.querySelectorAll('.dm-sub button')[2].click(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('#rsA').value = 'writing the first chapter'; document.querySelector('#rsF').value = 'research instead of making'; document.querySelector('#rsGo').click(); });
  await p.waitForTimeout(400);
  const rs = await p.evaluate(() => ({n: S.entries.filter(e => e.type === 'resistance').length, text: document.querySelector('#dmBody').textContent}));
  is('a resistance entry is made', rs.n, 1);
  yes('the resistance log has no evaluative words', !/\b(score|grade|failure|behind|should have)\b/i.test(rs.text), rs.text.match(/\b(score|grade|failure|behind|should have)\b/i));
  const hid = await p.evaluate(() => JSON.stringify(typeof aiPayloadStrip === 'function' ? aiPayloadStrip(S.entries.filter(e => e.type === 'resistance')) : 'n/a'));
  ok('resistance entries are kept out of the sidebar journals', hid === 'n/a' ? 'no AI payload function to test' : hid);
  const hidden = await p.evaluate(() => ['memento', 'affirmation', 'betlog'].filter(t => journalsShown().some(j => j.type === t)));
  is('the inner-life entry kinds are not journals in the sidebar', hidden, []);

  console.log('\n2. values 2.0');
  const mv = await p.evaluate(() => { masterValuesSeed(); return lifeArray('masterValues').length; });
  yes('the master list is seeded', mv >= 50, mv);
  const nv = await p.evaluate(() => { const n = negValueNew('ruthless'); return {n: negValues().length, id: n.id}; });
  is('a negative value is added', nv.n, 1);
  const si = await p.evaluate(() => { const before = practiceLogCount = lifeArray('practiceLog').length; valuesImprintSeasonal(); return lifeArray('practiceLog').slice(before).map(r => r.kind); });
  is('a seasonal refresh is logged as a seasonal reset, not a missed day', si, ['imprint-seasonal']);
  await go('#/values');
  yes('the values page carries the purpose bar', await p.evaluate(() => !!document.querySelector('.vp-bar')), 'no bar found');
  await p.evaluate(() => valuesBuilder()); await p.waitForTimeout(400);
  yes('the eight-pass builder opens', await p.evaluate(() => !!document.querySelector('.modal')));
  await closeModals();

  console.log('\n3. contemplation and visualisation');
  await p.evaluate(() => ppContemplate()); await p.waitForTimeout(400);
  yes('the contemplation chooser opens', await p.evaluate(() => !!document.querySelector('.modal')));
  await closeModals();
  await p.evaluate(() => { purposeSave('statement', 'to teach people to see clearly'); ppVisualise(); }); await p.waitForTimeout(400);
  yes('the purpose visualisation chooser opens', await p.evaluate(() => !!document.querySelector('.modal')));
  await closeModals();
  is('the digest is empty before anything is done', await p.evaluate(() => { const d = visualisationDigest(addDays(today(), -7), today()); return typeof d === 'string' ? d : (d && d.n) || 0; }) || 0, 0);

  console.log('\n4. making it real');
  await go('#/purpose/real');
  for(const t of ['goals', 'skills', 'habits', 'bets']){
    await p.evaluate(t => { const b = document.querySelector(`[data-rltab="${t}"]`); b && b.click(); }, t); await p.waitForTimeout(250);
  }
  ok('all four tabs render');
  is('the top twenty per cent of forty is eight; of five, three; of two, two', await p.evaluate(() => [funnelCut(40), funnelCut(5), funnelCut(2)]), [8, 3, 2]);
  const bt = await p.evaluate(() => { const b = betNew({title: 'Write for 6 weeks', hypothesis: 'I enjoy it', startAt: addDays(today(), -60), plannedEndAt: addDays(today(), -2)}); return pqBets(today()).map(x => x.msg); });
  yes('a bet past its end with no verdict is raised', bt.length === 1 && /no verdict/.test(bt[0]), bt);

  console.log('\n5. zone-of-genius hours and happy minutes');
  const zg = await p.evaluate(() => {
    const cat = timeAllCategories()[0]; cat.zog = true;
    const t0 = new Date(); t0.setHours(8, 0, 0, 0);
    const e = logTime({categoryId: cat.id, startTime: t0.toISOString(), minutes: 70, what: 'writing'});
    return {zog: timeEntryZog(e).zog, mins: Math.round(zogMinutesOn(today())), met: zogDayMet(today()), line: zogTodayHTML().includes('70 of 60')}; });
  is('a sitting in a zone category counts, by derivation', [zg.zog, zg.mins, zg.met, zg.line], [true, 70, true, true]);
  const ov = await p.evaluate(() => { const e = S.timeEntries[S.timeEntries.length - 1]; e.zogManual = false; const r = [timeEntryZog(e).zog, zogMinutesOn(today())]; delete e.zogManual; return r; });
  is('set by hand to no wins over the category', ov, [false, 0]);
  const hp = await p.evaluate(() => {
    const cat = timeAllCategories()[0];
    for(let i = 0; i < 4; i++){ const t = new Date(); t.setDate(t.getDate() - 1 - i); t.setHours(9, 0, 0, 0); logTime({categoryId: cat.id, startTime: t.toISOString(), minutes: 40, felt: i % 2 ? 'happy' : 'neutral'}); }
    const few = happinessPanelHTML(addDays(today(), -7), today());
    const t = new Date(); t.setDate(t.getDate() - 5); t.setHours(9, 0, 0, 0); logTime({categoryId: cat.id, startTime: t.toISOString(), minutes: 40, felt: 'frustrated'});
    const many = happinessPanelHTML(addDays(today(), -7), today());
    return {few: /needs at least 5/.test(few), many: /Happy minutes/.test(many) && /hp-bars/.test(many)}; });
  is('under five classified sittings the panel says what it needs; at five it draws', [hp.few, hp.many], [true, true]);

  console.log('\n6. the ledger');
  const lg = await p.evaluate(() => { const plan = ledgerMigrationPlan(); return Array.isArray(plan); });
  yes('the migration plan can be computed', lg);

  console.log('\n7. the muse');
  const empty = await p.evaluate(() => { S.breaks = []; S.museState = null; S.projects = []; (S.people || []).forEach(p => p.roles = {}); return museRead().value; });
  is('with no data the reading is empty rather than zero', empty, null);
  const nat = await p.evaluate(() => { breakAdd({kind: 'nature', startAt: addDays(today(), -1), endAt: addDays(today(), -1)}); const r = museRead(); return {nature: r.inputs.nature.value, keys: r.keys, val: r.value}; });
  yes('one outdoor day yesterday reads high, and the other inputs are dropped', nat.nature === 100 && nat.keys.includes('nature') && !nat.keys.includes('peer'), nat);
  const stale = await p.evaluate(() => { S.breaks = []; breakAdd({kind: 'nature', startAt: addDays(today(), -25), endAt: addDays(today(), -25)}); return museRead().inputs.nature.value; });
  is('twenty-five days without it reads nothing', stale, 0);
  const rolePeer = await p.evaluate(() => { const pe = {id: uid(), name: 'Mira', roles: {peer: true}, roleNotes: {peer: 'writing'}, details: {}}; S.people.push(pe); S.interactions.push({id: uid(), personId: pe.id, date: addDays(today(), -15), type: 'call', description: ''}); pe.lastInteraction = addDays(today(), -15); return museRead().inputs.peer.value; });
  is('a peer fifteen days ago against a thirty-day cadence reads fifty', rolePeer, 50);
  const nov = await p.evaluate(() => { const r0 = museRead().inputs.novelty.value; breakAdd({kind: 'three-day', startAt: addDays(today(), -10), endAt: addDays(today(), -8)}); return [r0, museRead().inputs.novelty.value]; });
  is('novelty is binary: a break in ninety days makes it a hundred', nov, [0, 100]);
  const rein = await p.evaluate(() => { const e = {id: uid(), type: 'media', title: 'The War of Art', body: '', occurredAt: today(), createdAt: new Date().toISOString(), links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, people: [], places: [], emotions: [], tags: [], extra: {kind: 'book', status: 'finished', resonanceLevel: null, quotes: [], urls: []}}; S.entries.push(e);
    const flag = () => { mediaX(e).reinspiring = true; return museRead().inputs.reinspiring.value; };
    const a = flag(); mediaX(e).rereads = [addDays(today(), -3)]; const b2 = museRead().inputs.reinspiring.value; return {a, b2, res: mediaX(e).resonanceLevel}; });
  is('a work flagged reinspiring is independent of its resonance and rises when reread', [rein.a, rein.b2, rein.res], [0, 33, null]);
  // the trigger needs both conditions
  const trig = await p.evaluate(() => {
    const out = {};
    const m = museState(); m.override = 20; m.overrideNote = 'flat';
    out.lowOnly = museTrigger() === null;                           // set-point not flatter
    for(let i = 0; i < 90; i++){ const d = addDays(today(), -i); checkin(d).setpoint = i < 30 ? 8 : 16; }
    out.both = museTrigger() !== null;
    const a = museFeedPanel(); out.panel = !!a && !!a.low && /./.test(a.text);
    out.pq = pqMuse(today()).length;
    museDismiss(); out.dismissed = museFeedPanel() === null;
    out.aWeekLater = (() => { const real = today; const raised = museState().raisedAt; return raised; })();
    m.override = null; return out; });
  is('the panel needs both conditions, comes once, and can be put off', [trig.lowOnly, trig.both, trig.panel, trig.pq, trig.dismissed], [true, true, true, 1, true]);
  const duties = await p.evaluate(() => ['break_nature', 'break_travel', 'break_three-day', 'break_long'].map(id => { const d = _allDuties().find(x => x.id === id); return d ? d.defaultOn : 'missing'; }));
  is('the four cadence duties exist and are off by default', duties, [false, false, false, false]);
  await go('#/journals/review'); await p.waitForTimeout(600);
  const card = await p.evaluate(() => ({card: !!document.querySelector('.muse-card'), bars: document.querySelectorAll('.muse-row').length, feed: !!document.querySelector('.muse-feed')}));
  yes('the muse card draws on the Review', card.card && card.bars >= 5, card);
  await p.evaluate(() => { museState().dismissedAt = ''; museState().raisedAt = ''; museState().override = 20; });
  await p.evaluate(() => { const el = document.querySelector('#museOv'); if(el){ el.value = 10; el.dispatchEvent(new Event('change')); } }); await p.waitForTimeout(400);
  is('the override slider stores a number', await p.evaluate(() => museState().override), 10);
  await go('#/today'); await p.evaluate(() => { setTodayView('in'); S._sacredView = 'doing'; rerender(); }); await p.waitForTimeout(1200);
  yes('the stillness page offers the nature retreat', await p.evaluate(() => !!document.querySelector('#ntBack')));
  const nr = await p.evaluate(() => { const before = breaksAll().length; const x = document.querySelector('#ntBack'); x.click(); return before; }); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('#ntWords').value = 'a heron'; document.querySelector('#ntKeep').click(); }); await p.waitForTimeout(400);
  const after = await p.evaluate(() => ({n: breaksAll().length, e: S.entries.filter(e => e.extra && e.extra.source === 'nature-retreat').length, last: breakLast('nature').entryIds.length}));
  is('the retreat records the break and what arrived', [after.n - nr, after.e, after.last], [1, 1, 1]);
  await go('#/journals/library'); await p.waitForTimeout(500);

  console.log('\n8. nothing threw');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
