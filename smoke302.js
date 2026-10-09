/* smoke302 — the inner life: the testing checklist of the specification.

   Data integrity (add-only guards, backup round trip, sealed things), honest
   emptiness, copy review, and the privacy rules for the optional model.

   Run: NODE_PATH=node_modules node smoke302.js */
const {chromium} = require('playwright');
const path = require('path');
const fs = require('fs');
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

  console.log('\n1. the migration registers every store');
  const reg = await p.evaluate(() => ({
    stores: ['practiceLog', 'strengths', 'strengthSnapshots', 'strengthRankHistory', 'affirmations', 'beliefs', 'bets', 'retreats', 'negativeValues', 'masterValues', 'zoneItems', 'flowClues', 'breaks', 'habitsToDrop', 'alignmentChecks', 'convergence'].filter(k => !ARRAY_STORES.includes(k)),
    meta: ['purpose', 'purposeImprint', 'valuesImprint', 'museState', 'zogTarget', 'journeyOverride', 'zogStreak'].filter(k => !META_KEYS.includes(k)),
    ver: db.verno}));
  is('every new array store and meta key is registered', [reg.stores, reg.meta], [[], []]);
  is('the database is at version 24', reg.ver, 24);
  const seeded = await p.evaluate(() => { masterValuesSeed(); const xs = lifeArray('masterValues'); return [xs.length > 50, xs.every(x => x.userAdded === false)]; });
  is('the master list is seeded with userAdded false on every row', seeded, [true, true]);

  console.log('\n2. add-only collections reject mutation');
  const guard = await p.evaluate(async () => {
    const out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const b = beliefNew({text: 'I always run out of time'}); b.challenges.push({id: uid(), at: new Date().toISOString(), reframe: 'original', evidenceFor: [], evidenceAgainst: []});
    const n = negValueNew('ruthless'); n.releases = [{id: uid(), at: new Date().toISOString(), whatShifted: 'original'}];
    const bet = betNew({title: 'Write', hypothesis: 'h'}); bet.verdicts = [{id: uid(), at: new Date().toISOString(), call: 'mine', why: 'original'}];
    const h = lifeArray('strengthRankHistory'); h.push({id: uid(), at: new Date().toISOString(), names: ['a'], reason: 'original'});
    const pl = practiceLogAdd('affirmation', {minutes: 5});
    saveNow(); await wait(600);
    b.challenges[0].reframe = 'edited'; n.releases[0].whatShifted = 'edited'; bet.verdicts[0].why = 'edited'; h[0].reason = 'edited'; pl.minutes = 99;
    await persist();
    out.belief = byId(S.beliefs, b.id).challenges[0].reframe; out.release = byId(negValues(), n.id).releases[0].whatShifted;
    out.verdict = byId(betsAll(), bet.id).verdicts[0].why; out.rank = lifeArray('strengthRankHistory')[0].reason; out.log = lifeArray('practiceLog').find(r => r.id === pl.id).minutes;
    // deletion is refused too
    lifeArray('practiceLog').splice(lifeArray('practiceLog').findIndex(r => r.id === pl.id), 1); await persist();
    out.logBack = lifeArray('practiceLog').some(r => r.id === pl.id);
    return out; });
  is('a belief challenge, a release, a verdict, a ranking and a practice row each restore', [guard.belief, guard.release, guard.verdict, guard.rank, guard.log, guard.logBack], ['original', 'original', 'original', 'original', 5, true]);

  console.log('\n3. a backup round trip keeps every new store');
  const rt = await p.evaluate(async () => {
    purposeSave('statement', 'to make hard things easy to see'); purposeState().genius.push({text: 'g', at: new Date().toISOString(), note: '', via: 'direct'});
    zoneInvAdd('writing', 'excellence'); flowClues().push({id: uid(), activity: 'teaching', whatWasHappening: '', whatILoved: '', challenge: '', at: new Date().toISOString(), occurredAt: today(), entryId: null});
    breakAdd({kind: 'travel', startAt: today(), endAt: today(), place: 'Lisbon'}); retreatStepSet('weekly', 'declutter', {answer: 'cables'});
    convIgnored().phrases.push('stylistic phrase'); lifeArray('alignmentChecks').push({id: uid(), at: new Date().toISOString(), auto: {clarity: 20}, obstruction: null, override: {}, notes: {}, inputs: {}});
    S.museState = {lastReadingAt: '', override: 40, overrideNote: 'flat', raisedAt: '', dismissedAt: ''}; S.zogTarget = {minutes: 45, setAt: today()}; S.journeyOverride = {state: 'testing', note: 'n', at: new Date().toISOString()};
    const names = ['practiceLog', 'strengths', 'beliefs', 'bets', 'retreats', 'negativeValues', 'masterValues', 'zoneItems', 'flowClues', 'breaks', 'alignmentChecks', 'convergence'];
    const before = {}; names.forEach(k => before[k] = JSON.parse(JSON.stringify(S[k] || []))); const metaBefore = JSON.parse(JSON.stringify({purpose: S.purpose, museState: S.museState, zogTarget: S.zogTarget, journeyOverride: S.journeyOverride}));
    await flushSave();
    const data = {}; for(const t of textTables()) data[t.name] = await t.toArray();
    await importBackup({version: 1, data});
    const norm = a => JSON.stringify((a || []).slice().sort((x, y) => String(x.id).localeCompare(String(y.id))));
    const diff = names.filter(k => norm(S[k]) !== norm(before[k]));
    const mdiff = Object.keys(metaBefore).filter(k => JSON.stringify(S[k]) !== JSON.stringify(metaBefore[k]));
    return {diff, mdiff, challenges: S.beliefs.reduce((n, b) => n + (b.challenges || []).length, 0), versions: S.purpose.genius.length}; });
  is('every new array store and meta key comes back identical', [rt.diff, rt.mdiff], [[], []]);
  yes('and the add-only children and version lists with them', rt.challenges >= 1 && rt.versions >= 1, rt);

  console.log('\n4. entries are copies where records hold their own');
  const dl = await p.evaluate(() => { const e = lifeEntryNew({type: 'reflection', title: 'What the bet showed', body: 'it was mine'}); const bet = betNew({title: 'T', hypothesis: 'h'});
    bet.verdicts.push({id: uid(), at: new Date().toISOString(), call: 'mine', why: 'it was mine', entryId: e.id}); saveNow();
    S.entries.splice(S.entries.indexOf(e), 1); return [betsAll().find(b => b.id === bet.id).verdicts[0].why, S.entries.some(x => x.id === e.id)]; });
  is('deleting the entry leaves the verdict and its words', dl, ['it was mine', false]);
  const ren = await p.evaluate(() => { const s = strengthNew({name: 'Curiosity'}); const v = S.values[0]; s.links.valueIds = [v.id]; const old = v.name; v.name = 'Renamed'; const pe = newPerson('Ana'); S.people.push(pe); const ok1 = s.links.valueIds[0] === v.id && !!byId(S.values, s.links.valueIds[0]); v.name = old; return ok1; });
  yes('renaming something does not break a link, because links are by id', ren);

  console.log('\n5. sealed things stay sealed');
  const sl = await p.evaluate(() => {
    const mk = (extra, body) => lifeEntryNew({type: 'letter', title: 'sealed ' + body, body, occurredAt: addDays(today(), -365), extra: Object.assign({openedAt: '', reply: ''}, extra)});
    const L = mk({sealedUntil: addDays(today(), 100)}, 'zebrafish secret'), C = mk({sealedUntil: addDays(today(), 100), type: 'commitment', commitment: {toWhat: 'x', givingUp: 'y', whatWouldBreakIt: 'z'}}, 'zebrafish pledge');
    const otd = onThisDay().some(e => e.id === L.id || e.id === C.id), otd2 = onThisDayRich().items.some(x => x.e.id === L.id || x.e.id === C.id);
    const tape = (typeof tapeItems === 'function' ? tapeItems(addDays(today(), -400), today()) : []).some(it => /zebrafish/.test((it.title || '') + (it.body || '')));
    _convCache = null; const conv = convergeCorpus().some(d => /zebrafish/.test(d.text));
    return {otd, otd2, tape, conv}; });
  is('absent from On this day, the Timeline and the convergence corpus until their date', [sl.otd, sl.otd2, sl.tape, sl.conv], [false, false, false, false]);
  await p.evaluate(() => { openSearch(); document.querySelector('#palQ').value = 'zebrafish'; document.querySelector('#palQ').dispatchEvent(new Event('input')); });
  await p.waitForTimeout(300);
  yes('and absent from search', await p.evaluate(() => !/zebrafish/.test(document.querySelector('#palRes').textContent)));
  await p.evaluate(() => document.querySelectorAll('.modal-back, .modal').forEach(n => n.remove()));

  console.log('\n6. honest emptiness');
  const em = await p.evaluate(() => {
    const save = S.visions; S.visions = [];
    const orbit = typeof solarBlindSpots === 'function' ? solarBlindSpots() : null; S.visions = save;
    const hp = happinessPanelHTML(addDays(today(), -400), addDays(today(), -399));
    return {orbit, hp}; });
  yes('with fewer than five classified sittings the happiness panel does not draw its bars', !/hp-bars/.test(em.hp), em.hp.slice(0, 80));
  await p.evaluate(() => { for(let i = 0; i < 5; i++){ const t = new Date(); t.setDate(t.getDate() - 20 - i); t.setHours(9, 0, 0, 0); logTime({categoryId: timeAllCategories()[0].id, startTime: t.toISOString(), minutes: 40, felt: 'happy'}); } });
  yes('with five classified sittings the bars draw, but the cross-tab waits for four cells of thirty minutes', await p.evaluate(() => { const h = happinessPanelHTML(addDays(today(), -40), addDays(today(), -10)); return /hp-bars/.test(h) && !/Happy inside the zone/.test(h); }));
  yes('with fewer than thirty qualifying entries the convergence report explains itself', await p.evaluate(() => { const b = document.createElement('div'); S.entries = S.entries.filter(e => e.type === 'media'); convergeRender(b); return /needs a corpus/.test(b.textContent) && !b.querySelector('.cv-row'); }));
  yes('an alignment reading with no data is dropped with its reason', await p.evaluate(() => { const r = alignmentRead(); return Object.keys(r.drop).length > 0 && Object.values(r.drop).every(x => x.length > 5); }));
  yes('no retreat is offered for a period with no substance', await p.evaluate(() => !retreatRaised('weekly', '2018-03-04') && !retreatRaised('monthly', '2018-03-30') && !retreatRaised('seasonal', '2018-03-28') && !retreatRaised('annual', '2018-12-28')));

  console.log('\n7. privacy: what the model never sees');
  const pr = await p.evaluate(() => { const mk = (type, body) => lifeEntryNew({type, title: '', body, occurredAt: today()});
    const items = [mk('belief', 'secretbelief'), mk('memento', 'secretmemento'), mk('resistance', 'secretresistance'), mk('reflection', 'ordinaryreflection')];
    const sealed = lifeEntryNew({type: 'letter', body: 'sealedtext', extra: {sealedUntil: addDays(today(), 30), openedAt: '', reply: ''}});
    const allowed = items.concat(sealed).filter(aiMayRead).map(e => e.body);
    const p2 = JSON.stringify(gatherPatterns({days: 30}));
    return {allowed, leak: /secretbelief|secretmemento|secretresistance|sealedtext/.test(p2), note: AI_EXCLUSION_NOTE}; });
  is('belief, memento and resistance entries and sealed letters are excluded; an ordinary reflection is not', pr.allowed, ['ordinaryreflection']);
  yes('and the pattern payload carries none of their words', !pr.leak);
  yes('the exclusion is stated in Settings', await (async () => { await go('#/settings'); return p.evaluate(() => /never sent/.test(document.body.textContent)); })());

  console.log('\n8. copy review: the words the new screens must not use');
  const screens = ['#/purpose', '#/purpose/strengths', '#/purpose/demons', '#/purpose/vision', '#/purpose/real', '#/purpose/genius', '#/purpose/converge', '#/purpose/zone', '#/retreat'];
  const hits = [];
  for(const h of screens){ await go(h); await p.waitForTimeout(250);
    const t = await p.evaluate(() => document.querySelector('#main, main, .page') ? document.querySelector('#main, main, .page').innerText : document.body.innerText);
    const m = t.match(/\b(score|grade|failure|behind|should have|overdue)\b/ig); if(m) hits.push([h, [...new Set(m.map(x => x.toLowerCase()))]]); }
  is('no new screen uses score, grade, failure, behind, should have or overdue', hits, []);
  await p.evaluate(() => { demons = null; });
  await go('#/purpose/demons'); await p.evaluate(() => { S._demTab = 'resistance'; rerender(); }); await p.waitForTimeout(300);
  const ev = await p.evaluate(() => document.querySelector('#dmBody').innerText);
  yes('the resistance log has no evaluative language, even empty', !/\b(bad|wrong|lazy|weak|fail|should|must|guilty|ashamed|score)\w*/i.test(ev), ev.match(/\b(bad|wrong|lazy|weak|fail|should|must|guilty|ashamed|score)\w*/i));
  const noComposite = fs.readdirSync(path.join(__dirname, 'src')).filter(f => /^19-purpose-/.test(f)).some(f => /alignmentScore|alignmentTotal|compositeAlign|overallAlignment/i.test(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8')));
  yes('no composite alignment figure exists anywhere in the code', !noComposite);

  console.log('\n9. every new duty has a Settings override');
  const duties = await p.evaluate(() => ['finitude_sitting', 'zog_hour', 'purpose_review', 'affirmation_practice', 'contemplation_practice', 'purpose_visualisation', 'values_imprint', 'strengths_retake', 'break_nature', 'break_travel', 'break_three-day', 'break_long', 'retreat_weekly', 'retreat_monthly', 'retreat_seasonal', 'retreat_annual'].filter(id => !_allDuties().some(d => d.id === id)));
  is('all sixteen are registered', duties, []);
  await go('#/settings'); await p.waitForTimeout(500);
  yes('and they are listed in Settings with their toggles', await p.evaluate(() => ['retreat_weekly', 'break_three-day', 'finitude_sitting'].every(id => !!document.querySelector(`[data-dutytog="${id}"]`))));

  console.log('\n9b. printable sheets');
  await go('#/purpose/sheets'); await p.waitForTimeout(400);
  is('thirteen sheets, one for each set of questions', await p.evaluate(() => document.querySelectorAll('.sh-sheet').length), 13);
  yes('the assessment carries the course\'s instruction and twenty questions', await p.evaluate(() => { const s = SHEETS.find(x => x.id === 'assessment'); return /do not worry if your answers overlap/i.test(s.intro) && s.groups[0].qs.length === 20; }));
  yes('printing is local: a print-only page is built and nothing is fetched', await p.evaluate(() => { window.print = () => {}; let net = 0; const f = window.fetch; window.fetch = (...a) => { net++; return f(...a); }; sheetPrint('bigleap'); const ok1 = !!document.querySelector('#ppPrintOnly h1') && document.body.classList.contains('pp-printing'); window.fetch = f; document.body.classList.remove('pp-printing'); document.getElementById('ppPrintOnly').remove(); return ok1 && net === 0; }));
  is('the assessment goes into the Questions journal as open questions, once', await p.evaluate(() => { const n0 = S.entries.filter(e => e.type === 'question').length; sheetsToQuestions(); document.querySelector('#shqYes').click(); const n1 = S.entries.filter(e => e.type === 'question').length; sheetsToQuestions(); return [n1 - n0, !!document.querySelector('#shqYes')]; }), [20, false]);
  await p.evaluate(() => document.querySelectorAll('.modal-back, .modal').forEach(n => n.remove()));

  console.log('\n10. nothing threw');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
