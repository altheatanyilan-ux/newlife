/* smoke192 — the Japanese Studio.

   The room is built on one distinction: knowing more Japanese and being able
   to say the Japanese you already know are different skills, and only the
   second is what anybody means by fluent. So nothing here teaches new
   material. It takes what you have and pushes it for speed.

   Three claims are load-bearing.

   THE SHRINKING CLOCK. One talk, four minutes then three then two. The
   semantic content is held constant on purpose, which means anything that
   improves between the first delivery and the third is the machinery and not
   the material — which is why de Jong and Perfetti found the gains carried
   over to topics the speakers had never rehearsed.

   WHERE THE PAUSES FALL. The single strongest diagnostic there is. Natives
   pause between clauses, to plan the next one; learners pause inside them,
   because the sentence is still being assembled. A shift from one to the
   other is grammar becoming automatic, and it is the only measurement here
   that is worth more than the effort of taking it.

   AND WHAT A MACHINE CANNOT TEACH YOU. Sustained practice against an AI
   produces a register machines like and people do not — rigid, over-explicit,
   one intent per sentence. In a language that runs on omitted subjects and
   aizuchi that is a real cost, so the ratio is watched and said out loud. */
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
  const ctx = await b.newContext({viewport:{width:1400, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. one room, and the way in from the garden');
  await p.evaluate(() => { location.hash = '#/japanese'; }); await p.waitForTimeout(1700);
  yes('the page is there', await p.evaluate(() => !!document.querySelector('.ja-page')));
  /* It had five tabs and now has none. Four of them were about knowing more
     Japanese, which is the thing this room is explicitly not for, and a room
     you have to choose a tab in before you can start is a room you open less
     often. Everything on the page is the one that was left. */
  is('  nothing to choose between before you can start',
    await p.evaluate(() => document.querySelectorAll('[data-jatab]').length), 0);
  is('  and all six sections are simply there',
    await p.evaluate(() => [...document.querySelectorAll('.ja-sec > .row > .sc')].map(x => x.textContent.trim())),
    ['4 / 3 / 2','Islands','Scenarios','Shadowing','Error log','The four strands']);
  is('the herb garden opens it', await p.evaluate(() => { const was = location.hash;
    HOUSE_PORTALS.herbs(); const to = location.hash; location.hash = was; return to; }), '#/japanese');
  is('  and the scenarios arrive in order of how often they happen',
    await p.evaluate(() => jaState().scenarios.slice(0, 3).map(s => s.name)),
    ['Self-introduction','Convenience store','Restaurant']);

  console.log('\n2. the shrinking clock, and what it is measuring');
  const gain = await p.evaluate(() => {
    jaState().sessions.push({id:'s192a', date:today(), topic:'s192 my job', sessionType:'practice',
      partnerType:'solo', pauseLocation:'mostly_mid_clause', notes:'', errorsLogged:0,
      deliveries:[{duration:4, wpm:78, pauseCount:14, quality:'rough'},
                  {duration:3, wpm:95, pauseCount:9,  quality:'okay'},
                  {duration:2, wpm:112, pauseCount:5, quality:'good'}]});
    saveNow();
    return jaSessionGain(jaState().sessions.find(s => s.id === 's192a'));
  });
  is('it reads the first delivery and the last', [gain.first, gain.last], [78, 112]);
  is('  and says how much faster the third was', gain.pct, 44);
  const noGain = await p.evaluate(() => jaSessionGain({deliveries:[{wpm:null},{wpm:null},{wpm:null}]}));
  is('a session with no word counts claims nothing', noGain, null);
  await p.evaluate(() => rerender()); await p.waitForTimeout(1300);
  const drawn = await p.evaluate(() => ({takes: document.querySelectorAll('.ja-take').length,
    gain: (document.querySelector('.ja-gain') || {}).textContent}));
  is('three takes on the page', drawn.takes, 3);
  yes('  with the gain said plainly', /78 → 112/.test(drawn.gain || ''), drawn.gain);

  console.log('\n3. where the pauses fall');
  const pause = await p.evaluate(() => {
    const j = jaState();
    j.sessions = j.sessions.filter(s => s.id === 's192a');
    const mk = (id, where) => j.sessions.push({id, date:today(), topic:'x', pauseLocation:where,
      sessionType:'practice', partnerType:'solo', deliveries:[]});
    mk('s192b', 'mostly_boundary'); mk('s192c', 'mostly_boundary');
    saveNow();
    return {share: jaMidClauseShare(addDays(today(), -7), today()),
      none: jaMidClauseShare('1990-01-01', '1990-01-07')};
  });
  /* one mid-clause and two boundary is a third of the way up the wrong end */
  yes('the share is the mix, not a count', Math.abs(pause.share - (1 / 3)) < 0.01, String(pause.share));
  is('  and a period with nothing in it says nothing rather than zero', pause.none, null);
  /* and on the page it is said per session rather than as a share, because
     the reading belongs to the sitting it was taken in */
  await p.evaluate(() => rerender()); await p.waitForTimeout(1300);
  const chips = await p.evaluate(() => [...document.querySelectorAll('.ja-pause')].map(n =>
    ({cls: n.className, txt: n.textContent.trim()})));
  is('every session wears its own reading', chips.length, 3);
  yes('  the mid-clause one is marked as such',
    chips.some(c => /ja-p-mostly_mid_clause/.test(c.cls) && /Mostly mid-clause/.test(c.txt)), JSON.stringify(chips));
  yes('  and the two at boundaries as that',
    chips.filter(c => /ja-p-mostly_boundary/.test(c.cls)).length === 2, JSON.stringify(chips));

  console.log('\n4. what a machine cannot teach you');
  const mix = await p.evaluate(() => {
    const j = jaState();
    j.sessions = [];
    for(let i = 0; i < 5; i++) j.sessions.push({id:'ai' + i, date:addDays(today(), -i), topic:'x',
      partnerType:'ai', sessionType:'practice', deliveries:[]});
    saveNow();
    const before = {mix: jaPartnerMix(4), warn: !!jaAiWarning()};
    j.sessions.push({id:'h1', date:today(), topic:'x', partnerType:'human', sessionType:'practice', deliveries:[]});
    j.sessions.push({id:'h2', date:today(), topic:'x', partnerType:'human', sessionType:'practice', deliveries:[]});
    saveNow();
    return {before, after: {mix: jaPartnerMix(4), warn: !!jaAiWarning()}};
  });
  is('five machine sessions and no people is all machine', mix.before.mix.aiShare, 1);
  yes('  which is said out loud', mix.before.warn);
  yes('two human sessions bring it under the line',
    mix.after.mix.aiShare < 0.8 && !mix.after.warn, JSON.stringify(mix.after));
  /* solo recording is neither: it is not a conversation, so it does not count
     towards a ratio that is about who you are talking to */
  is('  and solo work is not counted as either', mix.after.mix.aiShare,
    await p.evaluate(() => { jaState().sessions.push({id:'solo1', date:today(), topic:'x',
      partnerType:'solo', sessionType:'practice', deliveries:[]}); saveNow(); return jaPartnerMix(4).aiShare; }));

  console.log('\n5. Nation\'s rule, said as a complaint rather than a score');
  const strands = await p.evaluate(() => ({
    starved: jaStrandTrouble({input:30, output:30, study:30, fluency:10}),
    heavy:   jaStrandTrouble({input:20, output:15, study:40, fluency:25}),
    fine:    jaStrandTrouble({input:25, output:25, study:25, fluency:25})}));
  yes('a starved fluency strand is named', strands.starved.some(s => /Fluency/.test(s)), JSON.stringify(strands.starved));
  yes('  and so is too much deliberate study', strands.heavy.some(s => /Language-focused/.test(s)), JSON.stringify(strands.heavy));
  is('a balanced week is left alone', strands.fine, []);

  console.log('\n6. the four rooms that were taken out, and what became of what was in them');
  const gone = await p.evaluate(() => ['jaLadderHTML','jaGrammarHTML','jaTranslationsHTML',
    'jaVocabHTML','jaWritingHTML','jaProgressHTML','jaChunkCards','openJaGrammar','openJaChunk',
    'openJaWriting','openJaTranslation'].filter(n => typeof window[n] === 'function'));
  is('none of their code is still shipped', gone, []);
  /* A closed room is not a reason to delete somebody's writing. The grammar
     notes, the chunks and the pieces stay in the save exactly as they were —
     nothing reads them any more, and nothing throws them away either. */
  const kept = await p.evaluate(() => {
    const j = jaState();
    j.grammar = [{id:'g1', name:'ている', myNotes:'the one that keeps catching me'}];
    j.chunks = [{id:'c1', japanese:'予定を決める'}];
    j.writing = [{id:'w1', topic:'my weekend'}];
    saveNow();
    const again = jaState();
    return {grammar: (again.grammar || []).length, chunks: (again.chunks || []).length,
      writing: (again.writing || []).length, notes: (again.grammar || [])[0]?.myNotes};
  });
  is('what was written in them is left alone', [kept.grammar, kept.chunks, kept.writing], [1, 1, 1]);
  is('  word for word', kept.notes, 'the one that keeps catching me');
  /* the hours those rooms used to add are not still being counted */
  is('and nothing claims time in a room that no longer exists',
    await p.evaluate(() => { const j = jaState();
      j.sessions = []; j.shadowing = [];
      j.writing = [{id:'w2', date:today(), topic:'x'}, {id:'w3', date:today(), topic:'y'}];
      j.translations = [{id:'t1', date:today()}];
      return jaHours(addDays(today(), -7), today()); }), 0);

  console.log('\n7. an error becomes something you have to produce');
  const carded = await p.evaluate(() => {
    const before = (S.study?.cards || []).length;
    const e = {id:'s192e', date:today(), intendedMeaning:'to decide on a plan',
      actualJapanese:'予定を決めるをします', correctedNatural:'予定を決めます',
      errorType:'conjugation', patternTag:'て-form', sourceType:'other', sourceId:null,
      sentToStudyDeck:false, createdAt:new Date().toISOString()};
    jaState().errors.push(e);
    suggestStudyCard({type:'production', sourceType:'error_log', sourceId:e.id,
      front:`Say this in Japanese:\n\n${e.intendedMeaning}`, back:e.correctedNatural,
      sourceLabel:'Speaking Lab', tags:['conjugation']});
    const made = (S.study.cards || []).slice(-1)[0];
    return {grew: S.study.cards.length === before + 1, type: made.type, deck: made.deckId,
      status: made.status, front: made.front, back: made.back};
  });
  yes('a card is made', carded.grew);
  is('  that asks you to produce it', carded.type, 'production');
  is('  filed with the corrections', carded.deck, 'ja_corrections');
  is('  and waiting to be looked at', carded.status, 'inbox');
  yes('the meaning is the prompt and the Japanese is the answer',
    /decide on a plan/.test(carded.front) && carded.back === '予定を決めます', JSON.stringify(carded));

  console.log('\n8. an island becomes something you have to deliver');
  /* the card is the whole monologue, because half an island is no island —
     the point of it is that it comes out without you assembling it */
  const island = await p.evaluate(() => {
    const j = jaState();
    const i = {id:'s192i', topic:'Why I am learning Japanese', englishDraft:'because…',
      japaneseText:'日本語を勉強している理由は…', status:'memorizing', lastPracticed:null,
      pitchMarked:false, linkedChunks:[], nativeVerified:false, version:1,
      createdAt:new Date().toISOString()};
    j.islands.push(i);
    saveNow(); rerender();
    return i.id;
  });
  await p.waitForTimeout(1200);
  const carded2 = await p.evaluate(id => {
    document.querySelector(`[data-jaislandcard="${id}"]`).click();
    const made = (S.study.cards || []).filter(x => x.sourceId === id);
    return {n: made.length, type: made[0]?.type, status: made[0]?.status,
      front: made[0]?.front, back: made[0]?.back};
  }, island);
  is('one card', carded2.n, 1);
  is('  that asks you to produce it', carded2.type, 'production');
  is('  and waits to be looked at', carded2.status, 'inbox');
  yes('the topic is the prompt and the whole monologue is the answer',
    /Why I am learning Japanese/.test(carded2.front || '') && carded2.back === '日本語を勉強している理由は…',
    JSON.stringify(carded2));

  console.log('\n9. hours land on the Japanese skill, if there is one');
  const credit = await p.evaluate(() => {
    S.skills = (S.skills || []).filter(s => !/japanese/i.test(s.name || ''));
    const before = S.skills.length;
    jaCredit(60);
    const invented = S.skills.length !== before;
    S.skills.push({id:uid(), name:'Japanese', hours:1, cat:'craft'});
    jaCredit(90);
    const sk = jaSkill();
    return {invented, gained: Math.round((sk.hours - 1) * 100) / 100, when: sk.lastPracticed};
  });
  yes('practising invents no skill', !credit.invented);
  is('  an hour and a half is an hour and a half', credit.gained, 1.5);
  is('  practised today', credit.when, await p.evaluate(() => today()));

  console.log('\n10. the week, in the review');
  /* give it its own session with a pause reading on it: section 4 replaced the
     sessions with partner-type fixtures that carry none, and a check that
     passes on whatever the previous section happened to leave behind is not a
     check of anything */
  const lines = await p.evaluate(() => {
    jaState().sessions.push({id:'s192r', date:today(), topic:'x', pauseLocation:'mostly_boundary',
      sessionType:'practice', partnerType:'human', deliveries:[{duration:4, wpm:90, quality:'good'}]});
    saveNow();
    return jaReviewLines(addDays(today(), -7), today()); });
  yes('it counts the sessions', lines.some(l => /speaking session/.test(l)), JSON.stringify(lines));
  yes('  and says where the pauses are falling', lines.some(l => /paus/i.test(l)), JSON.stringify(lines));
  const quiet = await p.evaluate(() => { const keep = S.japanese; delete S.japanese;
    const said = jaReviewLines(addDays(today(), -7), today()); const made = !!S.japanese;
    S.japanese = keep; return {said, made}; });
  is('a studio nobody has opened has nothing to say', quiet.said, []);
  yes('  and is not opened on their behalf by the asking', !quiet.made);

  console.log('\n11. every section draws');
  await p.evaluate(() => { location.hash = '#/japanese'; rerender(); }); await p.waitForTimeout(1300);
  const secs = await p.evaluate(() => [...document.querySelectorAll('.ja-sec')].map(n =>
    ({name: (n.querySelector('.sc') || {}).textContent || '?', len: n.textContent.trim().length})));
  is('  six of them', secs.length, 6);
  secs.forEach(x => yes(`  ${x.name.trim()}`, x.len > 60, String(x.len)));

  console.log('\n12. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
