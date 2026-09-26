/* smoke240 — the Study Deck, rebuilt to Anki's shape.

   The claims.

   NOTHING IS LOST IN THE MOVE. The old S.study cards become notes and cards
   (a sentence with a hole becomes a cloze), their history becomes review-log
   rows, their schedule carries over, and the old blob stays where it was.

   ANKI'S MODEL. Notes, note types, cards per template, decks with presets,
   an add-only review log; FSRS by default (the reference library, inlined),
   SM-2 on request; the queue in Anki's order.

   CARDS RUN IN A SANDBOX. A card is drawn in an iframe with scripts allowed
   but no same-origin, under a CSP with a nonce, and a card's own script is
   stripped unless its note type is trusted.

   THE BROWSER FINDS. deck:, tag:, is:, prop:, field:value, plain text.

   STATS AND TOOLS. Every graph has its table; every workload tool shows a
   before/after and can be undone; the optimiser fits weights to history.

   ANKI FILES BOTH WAYS. An .apkg written here reads back with the same
   notes, matched by GUID and not duplicated.

   THE REST OF THE HOUSE STILL REACHES IT. addStudyCard, suggestStudyCard,
   the due count in the house and the deck list in the time tracker. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}, acceptDownloads: true});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type() === 'error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource|Content Security Policy/i.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. the move from the old Study Deck');
  const mig = await p.evaluate(async () => {
    const d = new Date(); const iso = x => new Date(d.getTime() + x * 864e5).toISOString().slice(0, 10);
    S.study = {decks: [{id: 'd1', name: 'Words'}, {id: 'd2', name: 'Verbs', parentId: 'd1'}], cards: [
      {id: 'c1', deckId: 'd1', type: 'text_recall', front: 'la mer', back: 'the sea', status: 'active', reps: 3, interval: 6, ease: 2.5, due: iso(2), lastReviewed: iso(-4),
        history: [{date: iso(-20), grade: 'good'}, {date: iso(-14), grade: 'good'}, {date: iso(-4), grade: 'easy'}]},
      {id: 'c2', deckId: 'd2', type: 'cloze', front: 'Je ___ français.', clozeAnswer: 'parle', back: '', status: 'active', reps: 0},
      {id: 'c3', deckId: 'd1', type: 'text_recall', front: 'le ciel', back: 'the sky', status: 'suspended', reps: 0}]};
    sdReset(); await sdLoad();
    const notes = [...SD.notes.values()], cards = [...SD.cards.values()];
    const cl = notes.find(n => /\{\{c1::parle\}\}/.test(n.fields[0]));
    const c1 = cards.find(c => SD.notes.get(c.noteId).fields[0] === 'la mer');
    return {notes: notes.length, cards: cards.length, cloze: !!cl && SD.noteTypes.get(cl.noteTypeId).kind, reviewed: c1 && [c1.type, c1.queue, c1.ivl],
      revlog: SD.revlog.length, susp: cards.filter(c => c.queue === -1).length, kept: Array.isArray(S.study.cards) && S.study.cards.length, marked: S.study.migratedTo,
      decks: sdDecks().map(x => x.name).filter(n => n !== 'Default')};
  });
  is('three old cards became three notes and three cards', [mig.notes, mig.cards], [3, 3]);
  is('  the sentence with a hole is an Anki cloze', mig.cloze, 'cloze');
  is('  the reviewed card is a review card, its interval kept', mig.reviewed, [2, 2, 6]);
  is('  its three reviews are in the log', mig.revlog, 3);
  is('  the suspended card is still suspended', mig.susp, 1);
  is('  the deck and its child, by name', mig.decks, ['Words', 'Words::Verbs']);
  yes('the old blob is left where it was, marked as moved', mig.kept === 3 && mig.marked === 'sd2', JSON.stringify([mig.kept, mig.marked]));

  console.log('\n2. the deck list and a deck');
  await p.evaluate(() => { location.hash = '#/study'; }); await p.waitForTimeout(900);
  const list = await p.evaluate(() => ({rows: document.querySelectorAll('.sx-deck').length, nav: [...document.querySelectorAll('.sx-nav a')].map(a => a.textContent),
    heat: !!document.querySelector('.sx-heatmap'), counts: [...document.querySelectorAll('.sx-deck')].map(r => r.querySelector('.sx-dname').textContent)}));
  yes('the decks are listed, with their children', list.rows >= 2, JSON.stringify(list.counts));
  is('Decks, Add, Browse, Stats, Import, Tools', list.nav, ['Decks', 'Add', 'Browse', 'Stats', 'Import', 'Tools']);
  yes('the year of reviews as a heatmap', list.heat);

  console.log('\n3. a review');
  const deckId = await p.evaluate(() => { const d = sdEnsureDeck('Smoke');
    for(let i = 0; i < 4; i++) addStudyCard({front: `front ${i}`, back: `back ${i}`, deckId: d.id});
    return d.id; });
  await p.evaluate(id => { location.hash = '#/study/review/' + id; }, deckId); await p.waitForTimeout(1200);
  const q = await p.evaluate(() => { const f = document.getElementById('sxCard'); return {sandbox: f.getAttribute('sandbox'), doc: f.srcdoc,
    counts: document.getElementById('sxCounts').textContent.trim(), show: !!document.getElementById('sxShow')}; });
  is('the card is in a sandbox: scripts, no same-origin', q.sandbox, 'allow-scripts');
  yes('  under a CSP with a nonce', /Content-Security-Policy/.test(q.doc) && /nonce-/.test(q.doc));
  yes('  showing the front', /front \d/.test(q.doc));
  yes('new, learning, due counts at the top', /^\d+\s+\d+\s+\d+$/.test(q.counts), q.counts);
  const before = await p.evaluate(() => SD.revlog.length);
  await p.keyboard.press('Space'); await p.waitForTimeout(500);
  const shown = await p.evaluate(() => ({doc: document.getElementById('sxCard').srcdoc, btns: [...document.querySelectorAll('.sx-ans')].map(b => b.querySelector('.nm').textContent),
    ivls: [...document.querySelectorAll('.sx-ans .ivl')].map(x => x.textContent)}));
  yes('Space shows the answer', /back \d/.test(shown.doc));
  is('  four buttons', shown.btns, ['Again', 'Hard', 'Good', 'Easy']);
  yes('  each with the interval it would give', shown.ivls.every(Boolean), JSON.stringify(shown.ivls));
  await p.keyboard.press('3'); await p.waitForTimeout(700);
  const after = await p.evaluate(() => ({n: SD.revlog.length, last: SD.revlog[SD.revlog.length - 1]}));
  is('Good (3) writes one review', after.n - before, 1);
  yes('  with the memory FSRS gave it', after.last && after.last.s > 0 && after.last.d > 0, JSON.stringify(after.last));
  await p.keyboard.press('Control+z'); await p.waitForTimeout(600);
  is('Ctrl+Z takes the answer back', await p.evaluate(() => SD.revlog.length), before);

  console.log('\n4. the scheduler');
  const sch = await p.evaluate(() => {
    const L = sdFsrsLib();
    const c = [...SD.cards.values()].find(x => x.type === 2);
    const pv = sdPreviewAll(c);
    const pre = sdDeckPreset(c.deckId);
    const sm = sdSm2(Object.assign({}, c, {factor: 2500}), 3, Object.assign({}, pre, {algorithm: 'sm2'}), new Date());
    return {lib: !!(L && L.fsrs), ivls: [1, 2, 3, 4].map(r => pv[r].type === 2 ? pv[r].ivl : 0), sm2: sm && sm.ivl > c.ivl, r: sdRetrievability(Object.assign({}, c, {memory: {s: 10, d: 5}, lastReview: Date.now() - 10 * 864e5}))};
  });
  yes('ts-fsrs is inlined and loads', sch.lib);
  yes('Hard ≤ Good ≤ Easy for a review card', sch.ivls[1] <= sch.ivls[2] && sch.ivls[2] <= sch.ivls[3], JSON.stringify(sch.ivls));
  yes('SM-2 lengthens the interval on Good', sch.sm2);
  yes('retrievability after its stability is about 90%', Math.abs(sch.r - 0.9) < 0.01, String(sch.r));

  console.log('\n5. templates');
  const tpl = await p.evaluate(() => {
    const c = [...SD.cards.values()].find(x => /\{\{c1::parle/.test(SD.notes.get(x.noteId).fields[0]));
    const r = sdRenderCard(c, {});
    const bt = sdNoteTypeByName('Basic');
    const n = sdNewNote(bt.id, ['<b>ok</b><script>alert(1)</script><img src=x onerror=alert(2)>', 'x'], []);
    const clean = sdSanitize(n.fields[0], false);
    return {q: r.q, a: r.a, clean, diff: sdTypeDiff ? sdTypeDiff('parle', 'parel') : ''};
  });
  const qText = tpl.q.replace(/<[^>]+>/g, '');
  yes('a cloze question hides the answer', /\[\.\.\.\]|\[…\]/.test(qText) && !/parle/.test(qText), qText.slice(0, 200));
  yes('  and the answer shows it', /parle/.test(tpl.a));
  yes('a card\'s own script and event handlers are stripped', /<b>ok<\/b>/.test(tpl.clean) && !/script|onerror/.test(tpl.clean), tpl.clean);
  yes('type-in answers are compared letter by letter', typeof tpl.diff === 'string' && tpl.diff.length > 0);

  console.log('\n6. the browser');
  await p.evaluate(() => { location.hash = '#/study/browse'; }); await p.waitForTimeout(900);
  const br = await p.evaluate(() => ({rows: document.querySelectorAll('.sx-table tbody tr').length, want: sdSearchCards(sdBrowseState().q).length, q: sdBrowseState().q,
    deck: sdSearchCards('deck:Smoke').length, isnew: sdSearchCards('deck:Smoke is:new').length, susp: sdSearchCards('is:suspended').length,
    text: sdSearchCards('"la mer"').length, field: sdSearchCards('front:front*').length, not: sdSearchCards('deck:Smoke -front:"front 1"').length,
    prop: sdSearchCards('prop:ivl>=5').length}));
  yes('the table shows what the search finds (Anki starts at the current deck)', br.rows === Math.min(300, br.want) && br.rows > 0, `${br.rows} rows for ${br.q}`);
  is('deck:Smoke finds its four', br.deck, 4);
  is('  and is:new within it', br.isnew, 4);
  is('is:suspended', br.susp, 1);
  is('"la mer" as text', br.text, 1);
  is('front:front* by field', br.field, 4);
  is('a negation', br.not, 3);
  is('prop:ivl>=5', br.prop, 1);

  console.log('\n7. statistics');
  await p.evaluate(() => { location.hash = '#/study/stats'; }); await p.waitForTimeout(1000);
  const st = await p.evaluate(() => ({heads: [...document.querySelectorAll('.sx-stat h2')].map(h => h.textContent), charts: document.querySelectorAll('.sx-chart').length,
    tables: document.querySelectorAll('.sx-numbers').length, nan: /NaN|undefined|Infinity/.test(document.querySelector('.sx-statspage').textContent),
    ret: !!document.querySelector('.sx-ret')}));
  yes('today, future due, reviews, card counts, intervals, true retention, hours, buttons, added', ['Today', 'Future due', 'Reviews', 'Card counts', 'Intervals', 'True retention', 'Hours', 'Answer buttons', 'Added'].every(h => st.heads.includes(h)), JSON.stringify(st.heads));
  yes('every chart has its numbers', st.charts > 3 && st.tables >= st.charts, `${st.charts} charts, ${st.tables} tables`);
  yes('no NaN or undefined anywhere', !st.nan);
  await p.selectOption('#sxStDeck', String(deckId)); await p.waitForTimeout(500);
  yes('one deck at a time', await p.evaluate(() => sdStatsState().deck) === deckId);

  console.log('\n8. the tools');
  const tl = await p.evaluate(async () => {
    /* forty review cards, all due today */
    const d = sdEnsureDeck('Busy'); const t = sdToday();
    for(let i = 0; i < 40; i++){ const r = addStudyCard({front: 'busy ' + i, back: 'b', deckId: d.id}); const c = r.cards[0];
      Object.assign(c, {type: 2, queue: 2, ivl: 10 + i, due: t, memory: {s: 10 + i, d: 5}, lastReview: Date.now() - (10 + i) * 864e5}); sdTouch('cards', c); }
    return d.id;
  });
  await p.evaluate(id => { sdUi().tools = {deck: id}; location.hash = '#/study/tools'; }, tl); await p.waitForTimeout(900);
  const pre = await p.evaluate(async () => {
    const box = document.querySelector('[data-sxtool="postpone"]'); box.open = true;
    box.querySelector('[name=n]').value = '15';
    box.querySelector('[data-sxpreview]').click(); await new Promise(r => setTimeout(r, 100));
    const out = box.querySelector('.sx-toolout').textContent;
    const dueBefore = sdToolCards(sdUi().tools.deck).filter(c => c.due <= sdToday()).length;
    box.querySelector('[data-sxapply]').click(); await new Promise(r => setTimeout(r, 200));
    const dueAfter = sdToolCards(sdUi().tools.deck).filter(c => c.due <= sdToday()).length;
    const log = sdMisc('scheduleLog').runs.slice(-1)[0];
    document.querySelector('.sx-undo button').click(); await new Promise(r => setTimeout(r, 300));
    const dueUndo = sdToolCards(sdUi().tools.deck).filter(c => c.due <= sdToday()).length;
    return {out, dueBefore, dueAfter, log: log && log.tool, dueUndo, tools: [...document.querySelectorAll('.sx-tool summary b')].map(x => x.textContent)};
  });
  yes('Postpone previews how many move, before and after', /15 cards would move/.test(pre.out), pre.out.slice(0, 80));
  is('  applied, fifteen fewer due today', pre.dueBefore - pre.dueAfter, 15);
  is('  written in the schedule log', pre.log, 'Postpone');
  is('  and undone', pre.dueUndo, pre.dueBefore);
  yes('postpone, advance, flatten, balance, easy days, a break, siblings, reschedule, Hard misuse, optimiser, simulator, check',
    ['Postpone', 'Advance', 'Flatten', 'Load balance', 'Easy days', 'Schedule a break', 'Disperse siblings', 'Reschedule from history', 'Remedy Hard misuse', 'Optimise the memory model', 'Simulator', 'Check the collection'].every(n => pre.tools.includes(n)), JSON.stringify(pre.tools));
  const more = await p.evaluate(async () => {
    const plans = {};
    for(const k of ['advance', 'flatten', 'balance', 'easydays', 'holiday', 'siblings']){
      const cards = sdToolCards(null); const f = {n: 5, days: 14, cap: 10, d0: 1, d1: 1, d2: 1, d3: 1, d4: 1, d5: 0, d6: 0, from: sdDayISO(sdToday()), to: sdDayISO(sdToday() + 3), spread: 3};
      plans[k] = SD_TOOLS[k].plan(cards, f).size;
    }
    const sim = sdSimulate(null, {retention: 0.9, newPer: 5, days: 30, secs: 8});
    const chk = sdCheckCollection();
    return {plans, sim: [sim.perDay.length, sim.reviews > 0, sim.memorised.every(Number.isFinite)], chk};
  });
  yes('flatten caps a day of forty at ten', more.plans.flatten >= 30, JSON.stringify(more.plans));
  yes('a break moves what falls in it', more.plans.holiday >= 40, JSON.stringify(more.plans));
  is('the simulator runs its days, with reviews and a finite memory', more.sim, [30, true, true]);
  yes('the collection check finds nothing wrong', /All well/.test(more.chk[0]), JSON.stringify(more.chk));

  console.log('\n9. the optimiser');
  const opt = await p.evaluate(async () => {
    /* a learner whose memory is weaker than the defaults think: the fit should lower the loss */
    const L = sdFsrsLib(), F = sdFsrsMath(L.default_w.map((x, i) => i < 4 ? x * 0.4 : x));
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const d = sdEnsureDeck('Synthetic'), rows = []; let id = Date.now() - 400 * 864e5;
    for(let k = 0; k < 160; k++){
      const r = addStudyCard({front: 'syn ' + k, back: 's', deckId: d.id}); const c = r.cards[0];
      let day = 0, m = F.init(3); rows.push({id: id++, cardId: c.id, ease: 3, ivl: 1, lastIvl: 0, factor: 0, time: 5000, type: 0});
      for(let j = 0; j < 5; j++){ const gap = Math.max(1, Math.round(F.ivl(m.s, 0.9) * (0.6 + rnd()))); day += gap;
        const g = rnd() < F.R(gap, m.s) ? 3 : 1; m = F.step(m, g, gap);
        rows.push({id: id + day * 864e5 + j, cardId: c.id, ease: g, ivl: gap, lastIvl: 0, factor: 0, time: 5000, type: 1}); }
      id += 1000;
    }
    const shift = rows.map(r => Object.assign({}, r, {id: r.id - 0}));
    SD.revlog.push(...shift); SD.revlog.sort((a, b) => a.id - b.id);
    const set = sdTrainingSet(null, false);
    const before = sdEvaluate(sdPresetWeights(sdPreset(1)), set).logLoss;
    let said = '';
    const w = await sdOptimise(null, s => said = s);
    const afterL = w ? sdEvaluate(w, set).logLoss : before;
    /* take the synthetic rows back out of memory; nothing was written to disk for them */
    const ids = new Set(shift.map(r => r.id)); SD.revlog = SD.revlog.filter(r => !ids.has(r.id));
    return {n: set.length, before, after: afterL, len: w ? w.length : 0, said};
  });
  yes('it learns from the histories with a known start', opt.n >= 160, String(opt.n));
  yes('the fitted weights predict better than the defaults', opt.after < opt.before, `${opt.before.toFixed(4)} → ${opt.after.toFixed(4)}`);
  yes('  and it says so plainly', /Log loss/.test(opt.said), opt.said);

  console.log('\n10. Anki files, both ways');
  const rt = await p.evaluate(async id => {
    const blob = await sdExportApkg([id], true);
    const notes = SD.notes.size, cards = SD.cards.size;
    const sum = await sdImportAnki(new File([blob], 'smoke.apkg'), {withSchedule: true, onUpdate: 'newer'});
    return {size: blob.size, zip: blob.type, notes0: notes, notes1: SD.notes.size, cards0: cards, cards1: SD.cards.size, sum: {added: sum.notesAdded, skipped: sum.notesSkipped, updated: sum.notesUpdated, format: sum.format}};
  }, deckId);
  yes('an .apkg is written', rt.size > 1000 && rt.zip === 'application/zip', `${rt.size} bytes`);
  is('  and read back: the same four notes, matched by GUID, none added', [rt.sum.added, rt.sum.skipped + rt.sum.updated], [0, 4]);
  is('  so the collection is unchanged', [rt.notes1 - rt.notes0, rt.cards1 - rt.cards0], [0, 0]);

  console.log('\n11. the rest of the house');
  const house = await p.evaluate(async () => {
    const s = suggestStudyCard({front: 'from the journal', back: 'x', sourceType: 'journal'});
    const inbox = studyInboxNotes().length;
    await sdFlush();
    const json = await exportToJSON();
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return {due: sdDueCount(), summary: !!S.sdSummary && S.sdSummary.cards === SD.cards.size, deckLinks: TIME_LINK_SOURCES.deck().length,
      inbox, suggested: !!s.id, backup: ['sdNotes', 'sdCards', 'sdRevlog', 'sdDecks'].every(k => JSON.stringify(data).includes(k)),
      today: typeof studyTodayHTML === 'function', lines: Array.isArray(studyReviewLines ? studyReviewLines() : [])};
  });
  yes('the due count is there for the house', Number.isFinite(house.due));
  yes('a summary is kept in S for the rooms that should not load the deck', house.summary);
  yes('the time tracker lists the decks', house.deckLinks >= 3, String(house.deckLinks));
  yes('a suggestion from another room lands in the inbox', house.suggested && house.inbox >= 1);
  yes('a backup carries the Study Deck', house.backup);
  yes('Today\'s and the review\'s hooks are still there', house.today && house.lines);

  console.log('\n12. it keeps');
  await p.evaluate(async () => { await sdFlush(); });
  const n0 = await p.evaluate(() => [SD.notes.size, SD.cards.size]);
  await p.reload(); await p.waitForTimeout(1200);
  const n1 = await p.evaluate(async () => { await sdLoad(); return [SD.notes.size, SD.cards.size]; });
  is('after a reload, every note and card is still there', n1, n0);

  for(const w of [390]){
    await p.setViewportSize({width: w, height: 844});
    for(const h of ['#/study', '#/study/stats', '#/study/tools', '#/study/browse']){
      await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(700);
      const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      yes(`${h} fits a phone`, !over);
    }
  }
  if(errs.length){ console.log('\nerrors:\n  ' + errs.slice(0, 10).join('\n  ')); }
  yes('no errors on the page', !errs.length, errs.length + ' errors');
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
