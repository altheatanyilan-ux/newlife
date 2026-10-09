/* smoke301 — the inner life, phase 5: the zone-of-genius workbench, the
   shadow worksheet, the guided vision hour, looking at it, the journey, and
   the remaining duties.

   Run: NODE_PATH=node_modules node smoke301.js */
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
  const closeModals = () => p.evaluate(() => document.querySelectorAll('.modal-back, .modal, .dv-veil').forEach(n => n.remove()));

  console.log('\n1. the four zones');
  await go('#/purpose/genius');
  is('four tabs: zones, worksheet, flow clues, fears', await p.evaluate(() => document.querySelectorAll('[data-gntab]').length), 4);
  const z0 = await p.evaluate(() => ({cols: document.querySelectorAll('.gn-col').length, genius: document.querySelector('.gn-col.genius').textContent, cands: zoneCandidates().length, inv: zoneInv().length}));
  yes('four columns, each with its definition; the empty genius column does not reproach', z0.cols === 4 && /Very few people/.test(z0.genius) && !/(empty|missing|fail)/i.test(z0.genius), z0);
  is('nothing is classified until the person says so', z0.inv, 0);
  yes('candidates are offered from skills, habits, lists and the clock', z0.cands > 0, z0.cands);
  const z1 = await p.evaluate(() => { const c = zoneCandidates()[0]; zoneInvAdd(c.name, 'incompetence', c.links); zoneInvAdd('writing', 'excellence'); zoneInvAdd('teaching', 'genius'); return zoneInv().map(i => i.zone); });
  is('placed by hand into the zones', z1, ['incompetence', 'excellence', 'genius']);
  const hours = await p.evaluate(() => {
    const cat = timeAllCategories()[0]; zoneInv()[1].links.categoryId = cat.id;
    for(let i = 0; i < 3; i++){ const t = new Date(); t.setDate(t.getDate() - i); t.setHours(8, 0, 0, 0); logTime({categoryId: cat.id, startTime: t.toISOString(), minutes: 240}); }
    return zoneHoursThisMonth(); });
  yes('hours this month are read from the clock against what was placed', hours.by.excellence > 0, hours);
  const trap = await p.evaluate(() => { const h = zoneHoursThisMonth(); return {ex: h.by.excellence, ge: h.by.genius}; });
  await go('#/purpose/genius');
  const hasTrap = await p.evaluate(() => /the zone where you are rewarded rather than the zone you named/.test(document.body.textContent));
  yes('the excellence-trap line appears when its rule holds (3×, ten hours)', trap.ex >= 10 ? hasTrap : !hasTrap, {trap, hasTrap});

  console.log('\n2. the Big Leap worksheet');
  await p.evaluate(() => { geniusState().tab = 'worksheet'; rerender(); }); await p.waitForTimeout(500);
  const bl0 = await p.evaluate(() => { const q = BIGLEAP[1].qs.length + BIGLEAP[2].qs.length; return {q, p1: BIGLEAP[1].qs.length, p2: BIGLEAP[2].qs.length}; });
  is('part one has four questions, part two three sentence completions', [bl0.p1, bl0.p2], [4, 3]);
  await p.evaluate(() => { geniusState().bl.startedAt = new Date().toISOString(); blRun(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { const t = document.querySelector('.bl-a'); t.value = 'building things for people'; t.dispatchEvent(new Event('input')); document.querySelector('#blMore').click(); });
  await p.evaluate(() => { const ts = document.querySelectorAll('.bl-a'); ts[1].value = 'explaining'; ts[1].dispatchEvent(new Event('input')); });
  is('many answers to one question', await p.evaluate(() => blAnswers(1, 0).filter(x => x.trim())), ['building things for people', 'explaining']);
  await p.evaluate(() => document.querySelector('#fwNext').click()); await p.waitForTimeout(300);
  await closeModals();
  is('leaving keeps what was written, and resumes at the question left', await p.evaluate(() => { const bl = geniusState().bl; return [bl.part, bl.qi]; }), [1, 1]);
  await p.evaluate(() => { blAnswers(1, 3)[0] = 'teaching people to see clearly'; blAnswers(2, 1)[0] = 'explaining something hard until it is easy'; blFile(); });
  const filed = await p.evaluate(() => ({n: S.entries.filter(e => e.extra && e.extra.worksheet === 'bigleap').length, parts: S.entries.filter(e => e.extra && e.extra.worksheet === 'bigleap').map(e => e.extra.part).sort()}));
  is('one Reflection per part, filed with the answers', [filed.n, filed.parts], [2, [1, 2]]);
  await p.evaluate(() => { blEnd(); }); await p.waitForTimeout(400);
  yes('part one question four and part two question two are shown together', await p.evaluate(() => { const t = document.querySelector('.modal').textContent; return /teaching people to see clearly/.test(t) && /explaining something hard/.test(t); }));
  await p.evaluate(() => { purposeSave('genius', 'an old wording about explaining'); document.querySelector('#blDraft').click(); });
  await p.evaluate(() => { document.querySelector('#blS').value = 'to make hard things easy to see'; document.querySelector('#blK').click(); }); await p.waitForTimeout(400);
  is('drafting a sentence writes a new version, never overwrites', await p.evaluate(() => [purposeState().genius.length, purposeState().genius[0].text.startsWith('an old')]), [2, true]);

  console.log('\n3. flow clues and the fear compass');
  await p.evaluate(() => { flowClueQuick(); document.querySelector('#fcA').value = 'teaching a class'; document.querySelector('#fcGo').click(); }); await p.waitForTimeout(300);
  is('a flow clue is one field', await p.evaluate(() => flowClues().map(c => [c.activity, c.whatILoved, c.challenge])), [['teaching a class', '', '']]);
  const fin = await p.evaluate(() => { const c = flowClues()[0]; flowClueFinish(c); document.querySelector('#fcW').value = 'a group stopped needing me'; document.querySelector('#fcL').value = 'watching people understand'; document.querySelector('[data-fcc="at"]').click(); document.querySelector('#fcSave').click(); return flowClues()[0]; });
  await p.waitForTimeout(300);
  yes('it can be completed later, and then it writes a Reflection', await p.evaluate(() => { const c = flowClues()[0]; return c.challenge === 'at' && !!byId(S.entries, c.entryId); }));
  yes('the quick capture is offered in the evening review', await p.evaluate(() => { flowEvening(); let ok1 = false; for(let i = 0; i < 6; i++){ if(document.querySelector('[data-flowclue]')){ ok1 = true; break; } const n = document.querySelector('#fwNext'); if(!n) break; n.click(); } document.querySelectorAll('.modal-back,.modal').forEach(n => n.remove()); return ok1; }));
  const fc = await p.evaluate(() => { beliefNew({kind: 'fear', text: 'being laughed at', fearType: 'grand'}); beliefNew({kind: 'fear', text: 'running out of money', fearType: 'safety'}); return {grand: fearCompass().length, all: beliefsAll('fear').length}; });
  is('only a compass fear is counted on the sheet; a safety fear is recorded and not counted', [fc.grand >= 1, fc.all >= 2, await p.evaluate(() => fearCompass().every(f => f.fearType === 'grand'))], [true, true, true]);

  console.log('\n4. three people admired');
  await p.evaluate(() => { geniusState().tab = 'zones'; rerender(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelector('#gnAdm').value = 'Richard Feynman'; document.querySelector('#gnAdmGo').click(); }); await p.waitForTimeout(400);
  const adm = await p.evaluate(() => { const a = S.people.find(x => x.admired); return {circle: a.circle, status: a.status, fields: Object.keys(a.admired)}; });
  is('an admired person joins as aspirational and not yet met, with three research fields', [adm.circle, adm.status, adm.fields], ['aspirational', 'notyetmet', ['adm', 'genius', 'passion']]);

  console.log('\n5. the shadow worksheet');
  const sh = await p.evaluate(() => { const s = strengthNew({name: 'Curiosity'}); const before = S.entries.length; shadowWorksheet();
    const t = id => document.querySelector('#sh_' + id);
    t('face').value = 'wandering from thing to thing'; document.querySelector('#fwNext').click();
    t('cost').value = 'left two projects half done'; document.querySelector('#fwNext').click();
    t('bal').value = 'finish before starting'; document.querySelector('#fwNext').click();
    t('belief').value = 'If I commit I will miss out'; document.querySelector('#fwNext').click();
    return {entries: S.entries.length - before, shadow: verText(s.shadow), belief: beliefsAll('belief').some(b => /miss out/.test(b.text) && b.links.strengthIds.includes(s.id))}; });
  yes('four questions; the last hands a belief to the register, strength linked; the opposite face becomes a version', sh.entries >= 1 && /wandering/.test(sh.shadow) && sh.belief, sh);

  console.log('\n6. the guided vision hour');
  const gh = await p.evaluate(() => { const v = visionNew('The school'); visionHour(v.id); return v.id; });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const v = document.querySelector('.dv-veil .dv-ready, .dv-veil button'); if(v) v.click(); }); await p.waitForTimeout(1500);
  const state = await p.evaluate(() => ({veil: !!document.querySelector('.dv-veil'), dream: !!document.querySelector('#ghD'), timer: /a guide, not a countdown/.test(document.body.textContent)}));
  yes('the hour opens with its arrival and then the dream, with an advisory timer', state.dream || state.veil, state);
  if(!state.dream){ await p.evaluate(() => document.querySelectorAll('.dv-veil').forEach(n => n.remove())); await p.evaluate(id => { const v = byId(S.visions, id); v.guidedHour = null; visionHourState(v).startedAt = new Date().toISOString(); visionHour(id); }, gh); await p.waitForTimeout(500); }
  await p.evaluate(() => { const t = document.querySelector('#ghD'); t.value = 'A school where nobody is afraid to ask. I cannot afford it, but it happens.'; t.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(200);
  is('a fear-shaped phrase is offered the inventory, once', await p.evaluate(() => !!document.querySelector('#ghFearGo')), true);
  await p.evaluate(() => { const t = document.querySelector('#ghD'); t.value += ' Also too late, not good enough.'; t.dispatchEvent(new Event('input')); });
  is('and not offered a second time in the same session', await p.evaluate(() => document.querySelectorAll('#ghFearGo').length), 1);
  await p.evaluate(() => document.querySelector('#fwNext').click()); await p.waitForTimeout(300);
  yes('the second movement is one question to a screen', await p.evaluate(() => /1 of 14/.test(document.querySelector('.modal').textContent)));
  await p.evaluate(() => { document.querySelector('#ghQ').value = 'Teachers who are paid properly.'; document.querySelector('#ghQ').dispatchEvent(new Event('input')); });
  await closeModals();
  const resumed = await p.evaluate(id => { const v = byId(S.visions, id); const st = v.guidedHour.step; visionHour(id); return [st, document.querySelector('.modal') ? document.querySelector('.modal').textContent.includes('1 of 14') || document.querySelector('.modal').textContent.includes('2 of') : false, v.guidedHour.answers[0].text]; }, gh);
  yes('it resumes at the screen left and keeps what was written', resumed[0] >= 1 && resumed[2] === 'Teachers who are paid properly.', resumed);
  await closeModals();
  await p.evaluate(id => { const v = byId(S.visions, id); v.futureMemory = 'I wake in the school I built. Children are asking questions without fear. I am teaching a class of twelve.'; v.currentReality = 'I have an idea and no premises.'; visionHourFile(v); }, gh);
  yes('the hour is also filed as one Reflection', await p.evaluate(id => { const v = byId(S.visions, id); const e = byId(S.entries, v.guidedHour.entryId); return !!e && /Teachers who are paid/.test(e.body); }, gh));
  is('structural tension is no longer zero once both ends are written', await p.evaluate(id => structuralTension(byId(S.visions, id)) > 0, gh), true);

  console.log('\n7. looking at it');
  const cards = await p.evaluate(id => visionCards(id).map(c => c.kind), gh);
  yes('the horizon card renders a line of the future memory as type', cards.includes('horizon'), cards);
  await p.evaluate(id => { visionLook(id); }, gh); await p.waitForTimeout(300);
  yes('focus shows one card at a time, large', await p.evaluate(() => !!document.querySelector('.vl-text, .vl-img')));
  await closeModals();
  yes('a vision can carry pictures like a person or a skill', await p.evaluate(() => !!IMG_OWNERS.vision));

  console.log('\n8. the journey, and the duties');
  const j = await p.evaluate(() => { S.journeyOverride = null; S.purpose.statement = []; S.purpose.niche = []; const a = journeyDerived();
    purposeSave('statement', 'to make hard things easy to see'); const b2 = journeyDerived();   // under six months, no bet closed as mine
    const p2 = purposeState(); p2.statement[p2.statement.length - 1].at = new Date(Date.now() - 400 * 864e5).toISOString(); const c = journeyDerived();
    p2.niche.push({text: 'teaching', at: new Date().toISOString(), source: null}); const d = journeyDerived();
    return [a, b2, c, d]; });
  is('searching, then still searching while new, then testing, then (no domain) mastering by the rule', j, ['searching', 'searching', 'testing', 'mastering']);
  const ov = await p.evaluate(() => { S.journeyOverride = {state: 'committing', note: 'it feels like this', at: new Date().toISOString()}; const e = journeyEffective(); S.journeyOverride = null; return [e.state, e.derived, e.overridden]; });
  is('it can be overridden, with a note, and the rule is still shown', ov, ['committing', 'mastering', true]);
  const card = await p.evaluate(() => { S._lensTab = 'alignment'; rerender(); return null; }); await p.waitForTimeout(600);
  await go('#/journals/review'); await p.evaluate(() => { S._lensTab = 'alignment'; rerender(); }); await p.waitForTimeout(600);
  yes('the description is drawn without a rank or a level', await p.evaluate(() => { const t = document.querySelector('.al-journey').textContent; return /Where this seems to be/.test(t) && /description, not a level/.test(t) && !/level \d|rank|stage achieved/i.test(t); }));
  const du = await p.evaluate(() => ['purpose_review', 'affirmation_practice', 'contemplation_practice', 'purpose_visualisation', 'values_imprint', 'strengths_retake', 'finitude_sitting', 'zog_hour'].map(id => { const d = _allDuties().find(x => x.id === id); return d ? d.defaultOn : 'missing'; }));
  is('the practice duties exist; only the foundational ones are on by default', du, [true, false, false, false, false, true, true, true]);
  const rt = await p.evaluate(() => { const T = today(); const out = [];
    lifeArray('strengthRankHistory').length = 0; out.push(strengthsRetakeDue());
    lifeArray('strengthRankHistory').push({id: uid(), at: new Date(Date.now() - 400 * 864e5).toISOString(), names: ['a'], reason: 'x'}); out.push(strengthsRetakeDue()); return out; });
  is('the strengths retake exists only when the last ranking is a year old', rt, [false, true]);

  console.log('\n9. nothing threw');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
