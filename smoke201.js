/* smoke201 — the Japanese Studio, second draft.

   Five rooms in a line. A grammar point is drilled until the transformation
   is mechanical, then used to say something true about your own life; that
   becomes an island, in both registers, with the vocabulary it needs beside
   it; the island is pushed to speed against a shrinking clock; and
   translation, separately, keeps the structural knowledge honest. Everything
   that goes wrong anywhere lands in one notebook.

   THE DRILL RUNS WITHOUT A MICROPHONE. On a page served from a file, or with
   the microphone refused, there is no recorder and no recogniser — and the
   exercise is a clock, a topic and a box to write down what you said, which
   is how it was done for thirty years before any of this existed. A drill
   that needed permission to start would be a drill nobody ran.

   THE DELAY ON A TRANSLATION IS A TIMESTAMP, NOT A COUNTDOWN. A countdown
   dies with the tab, which is to say it never survives the one night it
   exists for.

   AND NOTHING IN THE ROOM HAS AN OPINION ABOUT YOUR JAPANESE. Every
   correction comes from you. An error starts with what you tried and an empty
   space, and the notebook will not make a card out of it until you have gone
   and found out what should have been there. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource|Permission|NotAllowed|not-allowed|network/i.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  await p.evaluate(() => { location.hash = '#/japanese'; }); await p.waitForTimeout(1200);

  console.log('\n1. five rooms');
  const tabs = await p.evaluate(() => [...document.querySelectorAll('[data-jatab]')].map(n => n.dataset.jatab));
  is('the five tabs', tabs, ['drill','islands','translate','grammar','errors']);
  await p.evaluate(() => { location.hash = '#/japanese/grammar'; }); await p.waitForTimeout(700);
  is('  and the one you are in is in the address', await p.evaluate(() => jaUi().tab), 'grammar');
  /* the three the second draft took out, for asking you to grade a week you
     had not yet had */
  const gone = await p.evaluate(() => ({
    strands: typeof jaStrandTrouble, ai: typeof jaAiWarning, mix: typeof jaPartnerMix}));
  is('the strand audit and the machine ratio are gone',
    [gone.strands, gone.ai, gone.mix], ['undefined','undefined','undefined']);

  console.log('\n2. a grammar point, and the drill that makes it mechanical');
  const gram = await p.evaluate(async () => {
    const j = jaState2();
    const g = jaGrammarDefaults({name:'たら conditional', jlpt:'N4',
      formation:'past tense + ら', myNotes:'たら is concrete; ば is hypothetical.',
      drills:[{prompt:'行く', answer:'行ったら'},
        {prompt:'高い', answer:'高かったら'},
        {prompt:'静か', answer:'静かだったら'}]});
    j.grammar.push(g);
    saveNow(); rerender();
    await new Promise(r => setTimeout(r, 400));
    return {id: g.id, shown: document.querySelectorAll('.ja-gram').length, status: g.status};
  });
  is('it is on the page', gram.shown, 1);
  is('  and has not been drilled yet', gram.status, 'not_started');
  /* the buttons on a card are the only way into it. they used to fade in
     under the pointer, so on a fresh page a grammar point was a title with no
     way in until you happened to click somewhere inside the section — read as
     a card that did nothing. nothing is hidden now: seen without touching the
     page at all, which is what a screen reader and a stylus see too */
  const ways = await p.evaluate(() => {
    const card = document.querySelector('.ja-gram');
    const tools = card.querySelector('.ja-tools');
    const shown = n => { const r = n.getBoundingClientRect();
      return +getComputedStyle(n).opacity > .05 && r.width > 0 && r.height > 0; };
    return {row: shown(tools),
      labels: [...tools.querySelectorAll('button')].filter(shown).map(b => b.textContent.trim())};
  });
  yes('the way into it is on the card, without hovering or clicking first',
    ways.row, JSON.stringify(ways));
  is('  all four of them, and the way to throw it away',
    ways.labels, ['the chart', 'drill it', 'use it', 'to the deck', '\u00d7']);
  const ran = await p.evaluate(async id => {
    openJaGrammarDrill(id);
    await new Promise(r => setTimeout(r, 300));
    const answer = async text => {
      document.querySelector('#jdAns').value = text;
      document.querySelector('#jdCheck').click();
      await new Promise(r => setTimeout(r, 1300));
    };
    /* the middle one wrong on purpose, and the last one with spaces in it,
       which is a typing accident rather than a Japanese mistake */
    await answer('行ったら');
    await answer('高いたら');
    await answer(' 静かだったら 。');
    const g = byId(jaState2().grammar, id);
    const said = document.querySelector('#jaDrillBox h2').textContent;
    document.querySelector('#jdDone').click();
    return {said, score: g.score, status: g.status, drilled: g.lastDrilled === today()};
  }, gram.id);
  is('two of the three', ran.score, {right:2, total:3});
  is('  and it says so', ran.said, '2 of 3');
  /* whitespace and the full stop are typing, not Japanese */
  yes('  a trailing space and a full stop are forgiven', ran.score.right === 2, JSON.stringify(ran));
  is('the drill decides where the point stands, rather than a field you update', ran.status, 'shaky');
  yes('  and when it was last drilled', ran.drilled, JSON.stringify(ran));

  console.log('\n3. using it about your own life makes an island');
  const bridged = await p.evaluate(async id => {
    openJaGrammarApply(id);
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#gaPrompt').value = 'What would you do if you moved to Tokyo?';
    document.querySelector('#gaBody').value = '東京に引っ越したら、まず日本語学校に入りたいです。';
    document.querySelector('#gaIsland').click();
    await new Promise(r => setTimeout(r, 500));
    const j = jaState2();
    const i = j.islands[j.islands.length - 1];
    const g = byId(j.grammar, id);
    document.querySelectorAll('.modal-wrap, .overlay').forEach(n => n.remove());
    return {topic: i.topic, ja: i.japaneseTeineigo.slice(0, 6), status: i.status,
      kept: g.prompts.length, id: i.id};
  }, gram.id);
  is('the answer becomes a draft island', [bridged.topic, bridged.status],
    ['What would you do if you moved to Tokyo?', 'drafting']);
  is('  with the Japanese you wrote in it', bridged.ja, '東京に引っ越');
  is('  and the prompt kept on the point', bridged.kept, 1);

  console.log('\n4. an island has two registers and keeps the English');
  const isl = await p.evaluate(async id => {
    const i = byId(jaState2().islands, id);
    const v1 = i.version;
    Object.assign(i, {englishDraft:'I run a bar in Singapore.',
      japaneseTeineigo:'シンガポールでバーを経営しています。',
      japaneseTameguchi:'シンガポールでバーやってる。',
      correctionNotes:'Tutor changed 組み合わせた to 融合した.'});
    i.chunks = [
      jaChunkDefaults({japanese:'経営する', reading:'けいえいする', meaning:'to run a business', ready:true}, i.id),
      jaChunkDefaults({japanese:'組み合わせる', meaning:'to combine'}, i.id),
      jaChunkDefaults({japanese:'漢方', meaning:'Chinese medicine'}, i.id)];
    saveNow();
    return {v1, ready: jaIslandReady(i), keepsEnglish: i.englishDraft};
  }, bridged.id);
  is('one of three chunks can be produced', [isl.ready.ready, isl.ready.total, isl.ready.pct], [1, 3, 33]);
  /* the draft is kept forever: your Japanese will get better and this will be
     rewritten, and what must not be lost is what you were trying to say */
  is('  and the English draft is still there', isl.keepsEnglish, 'I run a bar in Singapore.');
  const bumped = await p.evaluate(async id => {
    /* the island is a page now, and a page you sit and work at has no Save
       on it: what you type is what is kept */
    location.hash = '#/japanese/islands/' + id;
    await new Promise(r => setTimeout(r, 900));
    const was = byId(jaState2().islands, id).version;
    const box = document.querySelector('#isTeineigo');
    box.value = 'シンガポールでバーをやっています。';
    box.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r => setTimeout(r, 700));
    return {was, now: byId(jaState2().islands, id).version,
      onItsOwnPage: !!document.querySelector('.ja-islandpage'),
      noSave: !document.querySelector('#isSave'),
      said: byId(jaState2().islands, id).japaneseTeineigo.slice(0, 8)};
  }, bridged.id);
  yes('an island is a page of its own, with no Save on it',
    bumped.onItsOwnPage && bumped.noSave, JSON.stringify(bumped));
  is('  and what you type is what is kept', bumped.said, 'シンガポールでバ');
  is('rewriting the Japanese bumps the version, so an old recording is visibly of something else',
    [bumped.was, bumped.now], [1, 2]);

  console.log('\n5. the topics you are not ready to be asked about');
  await p.evaluate(() => { location.hash = '#/japanese/islands'; }); await p.waitForTimeout(800);
  const over = await p.evaluate(() => ({
    rows: [...document.querySelectorAll('.ja-orow')].map(n => n.textContent.replace(/\s+/g, ' ').trim()),
    worstFirst: jaTopicOverview().filter(r => r.total).map(r => r.pct)}));
  yes('every topic with vocabulary on it is listed', over.rows.length >= 1, JSON.stringify(over.rows));
  yes('  worst first, which is the order that answers the question',
    over.worstFirst.every((v, i, a) => !i || a[i-1] <= v), JSON.stringify(over.worstFirst));
  const sent = await p.evaluate(async () => {
    const before = studyState().cards.filter(c => c.status === 'inbox').length;
    document.querySelector('#jaChunksToDeck').click();
    await new Promise(r => setTimeout(r, 500));
    const i = jaState2().islands.find(v => (v.chunks || []).length);
    return {before, after: studyState().cards.filter(c => c.status === 'inbox').length,
      sent: i.chunks.filter(c => c.sentToDeck).map(c => c.japanese),
      ready: i.chunks.filter(c => c.ready).map(c => c.japanese)};
  });
  is('the two you cannot produce go to the deck', sent.sent.length, 2);
  /* and the one you can does not: a card for a phrase you already reach for
     is a card you will answer right forever */
  is('  and the one you can does not', sent.ready, ['経営する']);
  yes('  two cards in the inbox', sent.after - sent.before === 2, JSON.stringify(sent));

  console.log('\n6. the stepping stones');
  const stones = await p.evaluate(() => ({
    shelves: document.querySelectorAll('.ja-shelf').length,
    stones: document.querySelectorAll('.ja-stone').length,
    fillers: jaStones('filler').length}));
  is('five shelves', stones.shelves, 5);
  yes('  shipped with something on every one of them', stones.stones >= 12, JSON.stringify(stones));
  yes('  including the ones that buy you a second', stones.fillers >= 3, String(stones.fillers));
  /* the cross is inside the chip that opens the editor, so a press on it has
     to stop there — otherwise it throws the phrase away and then opens an
     editor for a phrase that is no longer anywhere */
  const dropped = await p.evaluate(async () => {
    const was = jaStones('filler').length;
    const id = jaStones('filler')[0].id;
    document.querySelector(`[data-jastonedel="${id}"]`).click();
    await new Promise(r => setTimeout(r, 600));
    return {was, now: jaStones('filler').length, editor: !!document.querySelector('#stText')};
  });
  is('a press on the cross takes one off the shelf', [dropped.was - dropped.now], [1]);
  yes('  and does not then open an editor for it', !dropped.editor, JSON.stringify(dropped));

  console.log('\n7. the drill, with no microphone at all');
  await p.evaluate(() => { location.hash = '#/japanese/drill'; }); await p.waitForTimeout(800);
  const drill = await p.evaluate(async () => {
    ja432Begin({topic:'Jazz piano', chunks:['組み合わせる'], grammar:['たら conditional']});
    ja432Open();
    await ja432Run();
    return {can: ja432().can, phase: ja432().phase,
      clock: document.querySelector('.ja-clock').textContent,
      says: document.querySelector('.ja-rec').textContent.trim(),
      topic: document.querySelector('.ja-topic').textContent.trim()};
  });
  yes('there is no recorder here, and it runs anyway', drill.can.audio === false, JSON.stringify(drill));
  yes('  the clock is the four minutes', /^[34]:\d\d$/.test(drill.clock), drill.clock);
  yes('  and it says why there is no red dot', /no microphone/.test(drill.says), drill.says);
  is('  with the topic in front of you', drill.topic, 'Jazz piano');
  const staged = await p.evaluate(async () => {
    const out = [];
    for(let i = 0; i < 3; i++){
      document.querySelector('#jaEnd').click();
      await new Promise(r => setTimeout(r, 250));
      out.push(ja432().phase);
      const now = document.querySelector('#jaNow');
      if(now){ now.click(); await new Promise(r => setTimeout(r, 300)); }
    }
    return {out, deliveries: ja432().deliveries.map(d => [d.stage, d.target]),
      done: ja432().phase};
  });
  is('three stages, each ending into a breath', staged.out, ['breath','breath','done']);
  is('  four minutes, then three, then two', staged.deliveries, [[1,4],[2,3],[3,2]]);
  const saved = await p.evaluate(async () => {
    document.querySelector('#jaAudit').click();
    await new Promise(r => setTimeout(r, 600));
    const s = jaState2().sessions[0];
    return {topic: s.topic, n: s.deliveries.length, targets: s.targetChunks,
      auditOpen: !!document.querySelector('#jaSaid'), running: !!document.getElementById('jaRun')};
  });
  is('the sitting is written down', [saved.topic, saved.n], ['Jazz piano', 3]);
  is('  with what you set out to deploy', saved.targets, ['組み合わせる']);
  yes('  and the audit is open', saved.auditOpen && !saved.running, JSON.stringify(saved));

  console.log('\n8. the audit');
  const audit = await p.evaluate(async () => {
    const ta = document.querySelector('#jaSaid');
    const said0 = 'ジャズピアノを始めたのは去年からで、progression がわからなかった。';
    ta.value = said0;
    ta.selectionStart = ta.value.indexOf('progression');
    ta.selectionEnd = ta.selectionStart + 11;
    document.querySelector('[data-jamark="english"]').click();
    await new Promise(r => setTimeout(r, 200));
    const s = jaState2().sessions[0];
    document.querySelector('[data-jaused]').checked = true;
    document.querySelector('#jaPause').value = 'mostly_boundary';
    document.querySelector('#jaQual').value = 'good';
    /* a minute exactly for the last delivery, so words a minute is the word
       count and nothing has to be divided; and a number on the first, which
       is what a gain is measured from */
    s.deliveries[2].seconds = 60;
    s.deliveries[0].wpm = 80;
    const before = jaState2().errors.length;
    document.querySelector('#jaToBook').click();
    await new Promise(r => setTimeout(r, 200));
    /* the number follows the text as it is corrected, so it is read here,
       while the audit is still open and before anything is saved */
    ta.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r => setTimeout(r, 600));
    const asked = document.querySelectorAll('[data-jawpm]').length;
    const pills = [...document.querySelectorAll('#jaWpmRow .ja-wpm')]
      .map(n => n.textContent.replace(/\s+/g, ' ').trim());
    /* and then a last correction with no pause after it, so the save has to
       count it again rather than keeping what the live count left behind */
    const shorter = 'ジャズピアノを始めたのは去年からです。';
    ta.value = shorter;
    document.querySelector('#jaAuditSave').click();
    await new Promise(r => setTimeout(r, 600));
    const after = jaState2().sessions[0];
    const err = jaState2().errors[0];
    return {marks: s.marks.map(m => [m.kind, m.text]), pause: after.pauseLocation,
      said: after.transcript.slice(0, 8),
      quality: after.quality, wpm: after.deliveries.map(d => d.wpm),
      asked, pills, words: jaWordCount(said0), shortWords: jaWordCount(shorter),
      gain: jaSessionGain(after), errs: jaState2().errors.length - before,
      errTried: err && err.tried, errSource: err && err.source,
      chunkNowReady: (byId(jaState2().islands, jaState2().islands[0].id) || {}) && true};
  });
  /* what you typed, not what the machine heard: the two are kept apart on
     purpose, and this is the one that is yours */
  is('what you say you said is what is kept', audit.said, 'ジャズピアノを始');
  is('a selection plus a name for what is wrong with it', audit.marks, [['english','progression']]);
  is('  and it goes in the notebook, with the sitting on it',
    [audit.errs, audit.errTried, audit.errSource], [1, 'progression', '432']);
  is('where the pauses fell, which nobody can measure for you', audit.pause, 'mostly_boundary');
  is('  and how it went', audit.quality, 'good');
  /* nobody counts their own words. the number comes off the text and the
     seconds the stage actually ran, and the last stage follows the transcript
     rather than the recogniser, because the transcript is the accurate one */
  is('nobody is asked for a number', audit.asked, 0);
  yes('  it is a real count of words, not of characters',
    audit.words > 5 && audit.words < 20, String(audit.words));
  /* the number follows the text while you are still correcting it */
  is('  and it follows the transcript as you type',
    audit.pills[2], `stage 3 ${audit.words}`);
  /* and again on the way out, for the correction with no pause after it */
  yes('  and again on the last correction, unpaused',
    audit.wpm[2] === audit.shortWords && audit.shortWords !== audit.words,
    JSON.stringify([audit.wpm[2], audit.shortWords, audit.words]));
  /* a stage nobody heard is blank. nought would be a claim that you said
     nothing, and what happened is that there was no microphone */
  is('a stage nobody heard is left blank rather than called nought',
    [audit.wpm[1], audit.pills.length], [null, 3]);
  yes('  and it reads as a dash', /stage 2 \u2014/.test(audit.pills[1]), JSON.stringify(audit.pills));
  is('  and what that means: the third is faster than the first',
    audit.gain.pct, Math.round((audit.shortWords - 80) / 80 * 100));

  console.log('\n9. a text, a day’s wait, and back again');
  await p.evaluate(() => { location.hash = '#/japanese/translate'; }); await p.waitForTimeout(800);
  const tr = await p.evaluate(async () => {
    document.querySelector('#jaTrNew').click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#trTitle').value = 'Tokyo friend visit';
    document.querySelector('#trJa').value = '先月、東京に住んでいる友達を訪ねました。';
    document.querySelector('#trEn').value = 'Last month I visited a friend living in Tokyo.';
    document.querySelector('#trSave').click();
    await new Promise(r => setTimeout(r, 600));
    const t = jaState2().translations[0];
    const refused = openJaTr2(t.id);
    return {state: jaTranslationState(t), locked: refused === null,
      hours: Math.round(jaUnlockIn(t) / 3600000),
      shown: document.querySelector('.ja-tr').textContent.replace(/\s+/g, ' ').trim(),
      id: t.id};
  });
  is('it locks for a day', [tr.state, tr.hours], ['locked', 24]);
  yes('  and the second pass is refused until it opens', tr.locked, JSON.stringify(tr));
  /* both texts hidden, so the wait cannot be defeated by looking */
  yes('  with neither text on the page', !/先月/.test(tr.shown), tr.shown);
  const unlocked = await p.evaluate(async id => {
    const t = byId(jaState2().translations, id);
    /* the lock is a timestamp, so moving it is all it takes — a countdown
       would have died with the tab and never been here at all */
    t.unlocksAt = new Date(Date.now() - 1000).toISOString();
    saveNow(); rerender();
    await new Promise(r => setTimeout(r, 500));
    openJaTr2(id);
    await new Promise(r => setTimeout(r, 400));
    const box = document.querySelector('#tbJa');
    const frozen = document.querySelector('.ja-frozen').textContent.trim();
    box.value = '先月、東京に住んでいる友達に会いに行きました。';
    document.querySelector('#tbGo').click();
    await new Promise(r => setTimeout(r, 500));
    return {state: jaTranslationState(byId(jaState2().translations, id)), frozen,
      compare: document.querySelectorAll('.ja-compare .ja-frozen').length};
  }, tr.id);
  is('when it opens, the second pass runs', unlocked.state, 'done');
  /* only the English: showing the original would make it a copying task */
  is('  showing your English and not the original', unlocked.frozen,
    'Last month I visited a friend living in Tokyo.');
  is('  and then both, side by side', unlocked.compare, 2);
  const div = await p.evaluate(async id => {
    openJaTrCompare(id);
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#trDivAdd').click();
    await new Promise(r => setTimeout(r, 200));
    document.querySelector('[data-jadivf="original"]').value = '訪ねました';
    document.querySelector('[data-jadivf="original"]').dispatchEvent(new Event('input'));
    document.querySelector('[data-jadivf="mine"]').value = '会いに行きました';
    document.querySelector('[data-jadivf="mine"]').dispatchEvent(new Event('input'));
    document.querySelector('[data-jadivf="note"]').value = 'Both work; 訪ねる is more literary.';
    document.querySelector('[data-jadivf="note"]').dispatchEvent(new Event('input'));
    const before = jaState2().errors.length;
    document.querySelector('[data-jadivbook]').click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#trCmpSave').click();
    await new Promise(r => setTimeout(r, 400));
    const e = jaState2().errors[0];
    return {added: jaState2().errors.length - before, tried: e.tried, fixed: e.corrected,
      source: e.source, divs: byId(jaState2().translations, id).divergences.length};
  }, tr.id);
  is('a divergence you named goes to the notebook', [div.added, div.source], [1, 'translation']);
  is('  with both halves of it', [div.tried, div.fixed],
    ['会いに行きました', '訪ねました']);
  is('  and stays on the exercise', div.divs, 1);

  console.log('\n10. the notebook, and what it will not do');
  await p.evaluate(() => { location.hash = '#/japanese/errors'; }); await p.waitForTimeout(800);
  const book = await p.evaluate(async () => {
    const j = jaState2();
    /* three of one, two of another and one on its own: the counts have to
       differ or an ordering claim proves nothing, and the one that happened
       once is not a pattern yet */
    ['conditional confusion','conditional confusion','conditional confusion',
     'hearsay','hearsay','particle drift'].forEach((tag, i) =>
      j.errors.push(jaErrorDefaults({tried:`x${i}`, corrected:`y${i}`, errorType:'grammar',
        patternTag:tag, source:'manual'})));
    saveNow(); rerender();
    await new Promise(r => setTimeout(r, 500));
    const rows = [...document.querySelectorAll('.ja-prow')].map(n => n.textContent.replace(/\s+/g, ' ').trim());
    const open = j.errors.filter(e => !e.corrected.trim()).length;
    const openSaid = document.querySelector('.ja-open');
    return {rows, open, openSaid: openSaid && openSaid.textContent.trim(),
      sources: [...new Set(j.errors.map(e => e.source))].sort()};
  });
  const at = t => book.rows.findIndex(r => r.includes(t));
  yes('what keeps happening is counted, commonest first',
    at('conditional confusion') === 0 && at('hearsay') > 0, JSON.stringify(book.rows));
  yes('  with how often, so the two are told apart',
    /conditional confusion\D*3\b/.test(book.rows[0] || ''), JSON.stringify(book.rows));
  /* once is not a pattern; it is a thing that happened */
  is('  and something that happened once is not called one', at('particle drift'), -1);
  is('  and it is fed by every room', book.sources, ['432','manual','translation']);
  yes('  with the ones you have not answered yet called out',
    /no correction written in yet/.test(book.openSaid || ''), book.openSaid);
  const refused = await p.evaluate(() => {
    const e = jaState2().errors.find(v => !v.corrected.trim());
    const before = studyState().cards.filter(c => c.status === 'inbox').length;
    const made = jaErrorToDeck(e.id);
    return {made, grew: studyState().cards.filter(c => c.status === 'inbox').length - before};
  });
  /* the room has no opinion about your Japanese: it will not invent the
     answer, and it will not make a card that has no answer on it */
  is('an entry with no correction cannot become a card', [refused.made, refused.grew], [false, 0]);
  const carded = await p.evaluate(() => {
    const e = jaState2().errors.find(v => v.corrected.trim());
    const before = studyState().cards.filter(c => c.status === 'inbox').length;
    const made = jaErrorToDeck(e.id);
    return {made, grew: studyState().cards.filter(c => c.status === 'inbox').length - before, flagged: e.sentToStudyDeck};
  });
  is('one with a correction can', [carded.made, carded.grew, carded.flagged], [true, 1, true]);

  console.log('\n11. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
