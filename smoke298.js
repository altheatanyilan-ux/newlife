/* smoke298 — the purpose spine.

   Phase 1 of the Inner Life specification: the purpose sheet and its imprint,
   the add-only practice log, vision restored, strengths, the affirmation and
   finitude practices, the gap question and the integrity fixes. Later phases
   append their own sections below.

   Run: NODE_PATH=node_modules node smoke298.js */
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

  console.log('\n1. the sheet, empty and written');
  await go('#/purpose');
  const empty = await p.evaluate(() => ({labels: [...document.querySelectorAll('.pp-q .sc')].map(n => n.textContent), btn: !!document.querySelector('#ppBuild'),
    digits: /\d/.test((document.querySelector('.pp-empty') || {textContent: ''}).textContent)}));
  is('five labelled questions and no number', empty.labels.length, 5);
  yes('and the way in is a button, not a form', empty.btn && !empty.digits, empty);
  await p.evaluate(() => { const s = purposeState(); s.mode = 'edit'; rerender(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('[data-ppk="statement"] textarea').value = 'to teach people to see clearly'; document.querySelector('[data-ppsave="statement"]').click(); });
  await p.waitForTimeout(300);
  is('the statement is written', await p.evaluate(() => purposeText('statement')), 'to teach people to see clearly');
  await p.evaluate(() => { purposeSave('statement', 'to teach people to see clearly.'); });
  is('a full stop is a correction, not a version', await p.evaluate(() => purposeState().statement.length), 1);
  await p.evaluate(() => { purposeSave('statement', 'to write books that help ordinary people understand money and find calm'); });
  is('a reworded statement is a new version', await p.evaluate(() => purposeState().statement.length), 2);
  is('and the old wording is still readable', await p.evaluate(() => purposeState().statement[0].text.startsWith('to teach')), true);
  const flags = await p.evaluate(() => purposeVagueIn('to facilitate a process and help people').map(x => x[0]));
  yes('vague words are flagged by whole word', flags.includes('facilitate') && flags.includes('help people') && !flags.includes('process '), flags);

  console.log('\n2. the strict ninety-day imprint');
  const imp = await p.evaluate(() => { const T = today(); const out = [];
    S.purposeImprint = {target: 90, startedOn: '', lastDay: '', run: 0, bestRun: 0, restarts: 0};
    out.push(imprintAdvance('purpose', addDays(T, -3)).run);
    out.push(imprintAdvance('purpose', addDays(T, -2)).run);
    out.push(imprintAdvance('purpose', addDays(T, -1)).run);
    out.push(imprintAdvance('purpose', addDays(T, -1)).changed);   // same day twice
    const r = imprintAdvance('purpose', addDays(T, 1));           // a day missed
    out.push(r.run, r.restarted, S.purposeImprint.restarts, S.purposeImprint.bestRun);
    return out; });
  is('three consecutive days count up; the same day twice changes nothing', imp.slice(0, 4), [1, 2, 3, false]);
  is('a missed day restarts at one, records the restart and keeps the best run', imp.slice(4), [1, true, 1, 3]);
  const guard = await p.evaluate(async () => { const row = practiceLogAdd('affirmation', {minutes: 5}); saveNow(); await new Promise(r => setTimeout(r, 600));
    const id = row.id; S.practiceLog.find(r => r.id === id).minutes = 99; await persist();
    const after = S.practiceLog.find(r => r.id === id); const ok1 = after && after.minutes === 5;
    S.practiceLog = S.practiceLog.filter(r => r.id !== id); await persist();
    return {changed: ok1, removed: !!S.practiceLog.find(r => r.id === id)}; });
  yes('a practice-log row cannot be edited once written', guard.changed, guard);
  yes('or removed', guard.removed, guard);

  console.log('\n3. the screening');
  await p.evaluate(() => { S.habits.length = 0; S.visions.length = 0; S.habits.push({id: 'h1', name: 'Walk', archived: false, negative: false, freq: {type: 'daily'}}); saveNow(); });
  await p.evaluate(() => { purposeState().mode = 'read'; });
  await go('#/purpose'); await p.evaluate(() => rerender()); await p.waitForTimeout(300);
  const scr = await p.evaluate(() => ({rows: [...document.querySelectorAll('.pp-open-row')].map(n => n.textContent), text: (document.querySelector('.pp-screen') || {textContent: ''}).textContent}));
  yes('a habit that names nothing is listed, with a link', scr.rows.some(t => /Walk/.test(t)), scr);
  yes('in words that do not scold', /not mistakes/.test(scr.text) && !/fail|behind|should have/.test(scr.text), scr.text);
  await p.evaluate(() => { document.querySelector('[data-ppref="h1|statement"]').click(); });
  await p.waitForTimeout(300);
  is('putting it to the statement screens it', await p.evaluate(() => purposeScreened(byId(S.habits, 'h1'))), true);

  console.log('\n4. strengths');
  await p.evaluate(() => { S.strengths.length = 0; S.strengthRankHistory.length = 0; });
  await go('#/purpose/strengths');
  await p.evaluate(() => { document.querySelector('#stPasteBox').value = 'Curiosity\nA hunger to know\n\nHonesty - tells the truth\n\nLove of learning'; document.querySelector('#stPasteGo').click(); });
  await p.waitForTimeout(300);
  is('a pasted list is split on blank lines', await p.evaluate(() => S.strengths.map(s => s.name)), ['Curiosity', 'Honesty', 'Love of learning']);
  is('the description after the name is kept as the survey text', await p.evaluate(() => [S.strengths[0].surveyText, S.strengths[1].surveyText]), ['A hunger to know', 'tells the truth']);
  await p.evaluate(() => { strengthMove(S.strengths[2].id, 0); });
  is('moving one re-ranks and writes a history row', await p.evaluate(() => [S.strengths[0].name, S.strengthRankHistory.length >= 4]), ['Love of learning', true]);
  const sg = await p.evaluate(async () => { saveNow(); await new Promise(r => setTimeout(r, 600)); const h = S.strengthRankHistory[0]; h.reason = 'tampered'; await persist(); return S.strengthRankHistory[0].reason !== 'tampered'; });
  yes('the ranking history cannot be rewritten', sg);
  await p.evaluate(() => { const s = S.strengths[0]; verSave(s.gloss, 'curious about everything'); verSave(s.gloss, 'a wide and restless curiosity about how things work', {force: true}); });
  is('a gloss keeps its earlier wording', await p.evaluate(() => S.strengths[0].gloss.length), 2);
  yes('a strength with no links says so', await p.evaluate(async () => { rerender(); await new Promise(r => setTimeout(r, 300)); return /nothing in the house currently points/.test(document.querySelector('.st-card').textContent); }));
  const q1 = await p.evaluate(() => { const s = S.strengths[0]; return [strengthCloser(s, '2026-06-10'), strengthCloser(s, '2026-06-10'), strengthCloser(s, '2026-06-11')]; });
  yes('the morning question is chosen reproducibly and rotates', q1[0] === q1[1] && q1[0] !== q1[2], q1);
  await p.evaluate(() => { S.strengthRankHistory[S.strengthRankHistory.length - 1].at = new Date(Date.now() - 400 * 864e5).toISOString(); });
  is('the retake is due once the last ranking is a year old', await p.evaluate(() => strengthsRetakeDue()), true);

  console.log('\n5. vision, restored');
  await p.evaluate(() => { S.visions.length = 0; });
  is('with no vision, the Theatre has nothing to rotate', await p.evaluate(() => thRotation().length), 0);
  await p.evaluate(() => { S.values.length || null; });
  const nv = await p.evaluate(() => { const v = visionNew('A house by the sea'); return v.id; });
  await go('#/purpose/vision/' + nv);
  await p.evaluate(() => { document.querySelector('#vsFm').value = 'I wake in the house by the sea and the light is already on the water, and I know the work is done.'.repeat(2);
    document.querySelector('#vsCr').value = 'I rent a small flat and have not yet written the first chapter.'; document.querySelector('#vsSave').click(); });
  await p.waitForTimeout(400);
  const vis = await p.evaluate(id => { const v = byId(S.visions, id); return {tension: structuralTension(v) > 0, rot: thRotation().length, tg: thTensionTargets().map(x => x.id)}; }, nv);
  yes('a written vision has structural tension', vis.tension, vis);
  is('and joins the Theatre rotation', vis.rot, 1);
  yes('and is a target for structural tension', vis.tg.includes(nv));
  const blind = await p.evaluate(id => { const out = {}; const keep = S.visions.slice(); S.visions.length = 0; const vid = S.valueOrder[0]; out.none = vid ? valueServed(vid) : null; S.visions.push(...keep); out.some = vid ? valueServed(vid) : null; return out; }, nv);
  yes('with no vision no value is a blind spot; with one and no link it is', blind.none !== false && (blind.some === false || blind.some === null), blind);
  yes('the empty-state of structural tension no longer names the Projects page', await p.evaluate(() => { S.visions.length = 0; S.projects.length = 0; const h = theatrePanelHTML('tension'); return !/Projects page/.test(h) && /Purpose/.test(h); }));

  console.log('\n6. the gap question');
  await p.evaluate(() => { if(!S.values.length){ const id = uid(); S.values.push({id, name: 'Wisdom', color: '#7f916a', tagline: '', fields: {}}); S.valueOrder.push(id); } S.valueSnapshots.length = 0; });
  await p.evaluate(() => { openSnapshotModal(); }); await p.waitForTimeout(500);
  const gap = await p.evaluate(() => { const r = document.querySelector('[data-sv]'); const id = r.dataset.sv; r.value = 75; r.dispatchEvent(new Event('input'));
    const box = document.querySelector(`[data-svm="${id}"]`); const shown = !box.hidden, num = document.querySelector(`[data-svmn="${id}"]`).textContent;
    r.value = 95; r.dispatchEvent(new Event('input')); const hiddenAt95 = box.hidden; r.value = 75; r.dispatchEvent(new Event('input'));
    document.querySelector(`[data-svmt="${id}"]`).value = 'a place to publish\na wise friend'; document.querySelector('#snapSave').click(); return {shown, num, hiddenAt95, id}; });
  await p.waitForTimeout(500);
  yes('below ninety the missing-points field offers the real arithmetic', gap.shown && gap.num === '7.5' && gap.hiddenAt95, gap);
  is('named missing points are kept on the snapshot', await p.evaluate(id => S.valueSnapshots[0].missingPoints[id].map(x => x.text), gap.id), ['a place to publish', 'a wise friend']);
  const goal = await p.evaluate(id => { const sn = S.valueSnapshots[0], mp = sn.missingPoints[id][0]; const g = purposeMakeGoal({text: mp.text, valueId: id}); mp.goalId = g.id; return {title: g.title, ref: g.purposeRef, found: !!perfGoals().find(x => x.id === g.id)}; }, gap.id);
  yes('a missing point becomes a goal with the value already linked', goal.found && goal.ref.includes('values'), goal);

  console.log('\n7. the affirmation practice');
  await p.evaluate(() => { S.affirmations.length = 0; window.__plBefore = practiceOn(today()).filter(r => r.kind === 'affirmation').length; S.entries = S.entries.filter(e => e.type !== 'affirmation'); S.purposeImprint = {target: 90, startedOn: '', lastDay: '', run: 0, bestRun: 0, restarts: 0}; });
  const aff = await p.evaluate(() => { const a = affirmationNew('I am here to teach clearly'); const b = affirmationNew('I finish what I begin'); a.lastUsedAt = '2026-06-09T00:00:00Z';
    const next1 = affirmationNext().id === b.id;                                  // never used goes first
    b.lastUsedAt = '2026-06-10T00:00:00Z'; const next2 = affirmationNext().id === a.id;   // then least recently used
    return {next1, next2}; });
  yes('rotation is least recently used', aff.next1 && aff.next2, aff);
  await p.evaluate(() => { ppAffirmAfter(affirmationsAll()[0], {actual: 5, complete: true, planned: 5}); }); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#affKeep').click()); await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({entry: S.entries.filter(e => e.type === 'affirmation').length, log: practiceOn(today()).filter(r => r.kind === 'affirmation').length - window.__plBefore, run: S.purposeImprint.run, day: theatre().days.includes(today()), uses: affirmationsAll()[0].uses}));
  is('an affirmation files an entry, a practice-log row, advances the imprint and marks the 21-day tracker', [after.entry, after.log, after.run, after.day], [1, 1, 1, true]);
  yes('and the affirmation screen carries no number', await p.evaluate(() => !/\d/.test(ppAffirmMainHTML({text: 'I am here'}).replace(/class="[^"]*"/g, ''))));
  const rec = await p.evaluate(() => thRecipe('resistant', 15));
  yes('the resistant recipe pairs the focus wheel with affirmation, and still has exactly one chief aim', rec.includes('affirm') && rec.filter(k => k === 'aim').length === 1, rec);

  console.log('\n8. finitude');
  await p.evaluate(() => { S.entries = S.entries.filter(e => e.type !== 'memento'); });
  await p.evaluate(() => { ppFinitudeAfter('urgency', {actual: 10, complete: true, planned: 10}); }); await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelector('#finNote').value = 'the second email account'; document.querySelector('#finInt').click(); }); await p.waitForTimeout(300);
  const fin = await p.evaluate(() => ({memento: S.entries.filter(e => e.type === 'memento').length, intention: checkin().intention, sess: stillness().sessions[0].kind,
    duty: dutyDone('finitude_sitting', today()), sidebar: journalsShown().some(j => j.type === 'memento'), kinds: STILL_KINDS.map(k => k[0])}));
  is('a finitude sitting files a Memento and can become the day\'s intention', [fin.memento, fin.intention], [1, 'the second email account']);
  yes('is a fifth stillness kind and counts as a stillness session', fin.kinds.length === 5 && fin.sess === 'finitude', fin);
  yes('the duty reads its completion from the entry', fin.duty === true, fin);
  yes('Memento stays out of the journals sidebar', fin.sidebar === false);
  const otd = await p.evaluate(() => { const old = '2025-' + today().slice(5); S.entries.push({id: uid(), type: 'memento', title: 'm', body: 'x', occurredAt: old, createdAt: old, links: {}, extra: {}}); return onThisDay().some(e => e.type === 'memento'); });
  is('and out of On this day', otd, false);

  console.log('\n9. the integrity fixes');
  const f = await p.evaluate(() => ({
    routes: DUTIES.filter(d => ['stillness_practice', 'study_deck', 'ls_recall'].includes(d.id)).map(d => d.route),
  }));
  is('the three dead duty routes land in rooms that exist', f.routes, ['#/today', '#/study', '#/studio']);
  yes('the evening energy step says what it is', await p.evaluate(() => { const h = String(flowEvening); return /The day.s energy/.test(h); }));
  const thanks = await p.evaluate(() => { const r = theatre(); r.thanks.length = 0; S.entries = S.entries.filter(e => !(e.extra && e.extra.thanksId));
    saveThanks(['one'], null); S._thMore = true; saveThanks(['two'], null);
    return {rec: r.thanks.length, lines: r.thanks[0].lines, entries: S.entries.filter(e => e.extra && e.extra.thanksId).length, body: S.entries.filter(e => e.extra && e.extra.thanksId)[0].body}; });
  is('giving thanks twice in a day leaves the tracker and the Lived Record in agreement', [thanks.rec, thanks.entries, thanks.lines], [1, 1, ['one', 'two']]);
  const aimHtml = await p.evaluate(() => { purposeSave('statement', 'to teach people to see clearly'); return theatrePanelHTML('aim'); });
  yes('the chief aim renders the purpose statement', /to teach people to see clearly/.test(aimHtml) && /aimSave/.test(aimHtml));
  yes('the spine heads the script, scripting and scene practices', await p.evaluate(() => ['script', 'scripting', 'scene'].every(k => /pp-spine/.test(theatrePanelHTML(k)))));

  console.log('\n10. nothing threw');
  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} failing` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
