/* smoke205 — islands that are places, and readings nobody has to type.

   AN ISLAND IS A PAGE. It was a modal, and a modal is a box floating over
   something else: the right shape for a question and the wrong shape for a
   place you sit and work. An island holds two full texts, a paragraph of
   what a tutor changed and why, a list of vocabulary, and now a set of
   smaller islands. None of that fits in a box, and all of it wants an
   address you can come back to and a browser Back that means something.

   AND THERE IS NO SAVE ON IT, because a page you sit at should not have one
   and there is nowhere for unsaved work to be lost to.

   ISLANDS INSIDE ISLANDS. "My work" is not one monologue. It is the bar, the
   hours, why I left the last job, the regular who comes in on Thursdays —
   each its own thing to be able to say, and each useless as a heading under
   one enormous text. A smaller island is an island: same shape, same
   registers, same chunks. One field says which one it is inside, which means
   setting one adrift is clearing a field rather than a migration, and
   throwing away a parent sets its children adrift rather than taking them
   with it.

   A CHUNK IS JAPANESE AND NOTHING ELSE. It used to want the reading and an
   English meaning too: three fields for one phrase, two of which are either
   work a machine can do or work that does not need doing.

   AND THE READING IS WORKED OUT. Perfect Japanese readings need a
   morphological analyser and ten megabytes of dictionary, because readings
   belong to words and not to characters. What is here instead is the
   structure that covers ordinary vocabulary: a word list first for
   everything irregular, then okurigana matching — 食.べる identifies both
   the reading and where the word ends — then on readings for runs of kanji.
   The conjugations matter and are handled: 飲み物 is のみもの, not いんみもの,
   because a verb's tail stays in its own consonant row.

   It says when it does not know. A character not in the table comes back
   unread rather than guessed at, because a wrong reading written down
   confidently is worse than none: you will learn it. */
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
  const p = await (await b.newContext({viewport:{width:1500, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. the reading, worked out');
  const read = await p.evaluate(() => {
    const say = t => jaFurigana(t);
    return {
      /* a word whose reading is not the sum of its parts */
      irregular: say('今日'),
      /* okurigana picks the reading and marks where the word ends */
      okuri: say('食べる'),
      /* a run of kanji takes on readings, in order */
      compound: say('経営'),
      /* conjugated: the tail is み, not the dictionary む */
      inflected: say('飲み物'),
      /* and the sound change before て: 降って, not 降る */
      onbin: say('雨が降っている'),
      /* an い-adjective through か: 高.い is the kun, 高かった the text */
      adj: say('高かった'),
      /* a kanji among other kanji takes its on reading, alone its kun.
         教室 is a word; the 内 after it is on its own, and what decides
         between ない and うち is only that there is a kanji beside it */
      inWord: say('教室内'),
      alone: say('内'),
      /* kana and anything else pass through untouched */
      kana: say('ひらがなはそのまま'),
      sentence: say('日本語を勉強しています'),
    };
  });
  is('a word with its own reading', read.irregular, 'きょう');
  is('  okurigana says which reading and where the word ends', read.okuri, 'たべる');
  is('  a run of kanji takes on readings', read.compound, 'けいえい');
  /* the case that makes or breaks this: running text is conjugated */
  is('  a conjugated tail still finds its verb', read.inflected, 'のみもの');
  is('  and so does a sound change before て', read.onbin, 'あめがふっている');
  is('  an adjective inflects through its own row', read.adj, 'たかかった');
  /* 内 is うち alone and ない against another kanji, and reading it うち in
     both is how 教室内 comes out きょうしつうち */
  is('the same character reads differently by what is beside it',
    [read.inWord, read.alone], ['きょうしつない', 'うち']);
  is('  kana pass through untouched', read.kana, 'ひらがなはそのまま');
  is('  and a whole sentence comes out whole', read.sentence, 'にほんごをべんきょうしています');
  const honest = await p.evaluate(() => {
    /* a character the table has no reading for */
    const odd = '鬱憤';
    return {sure: jaFuriganaSure('食べる'), notSure: jaFuriganaSure(odd),
      /* left as it is rather than guessed at */
      said: jaFurigana(odd),
      ruby: jaRubyHTML('食べる')};
  });
  yes('it knows when it knows', honest.sure);
  yes('  and says so when it does not', !honest.notSure, JSON.stringify(honest));
  is('  leaving what it cannot read alone rather than guessing', honest.said, '鬱憤');
  yes('  and the reading can sit over the word rather than beside it',
    /<ruby>食<rt>た<\/rt><\/ruby>べる/.test(honest.ruby), honest.ruby);

  console.log('\n2. an island is a page');
  await p.evaluate(() => { location.hash = '#/japanese/islands'; }); await p.waitForTimeout(1000);
  const made = await p.evaluate(async () => {
    document.querySelector('#jaIslandNew').click();
    await new Promise(r => setTimeout(r, 900));
    return {hash: location.hash, page: !!document.querySelector('.ja-islandpage'),
      modal: !!document.querySelector('.modal-wrap'),
      noSave: !document.querySelector('#isSave'),
      id: jaState2().islands[jaState2().islands.length - 1].id};
  });
  yes('it opens as a page, not a box over one', made.page && !made.modal, JSON.stringify(made));
  yes('  at an address of its own', /#\/japanese\/islands\/./.test(made.hash), made.hash);
  yes('  with no Save on it', made.noSave);
  const typed = await p.evaluate(async id => {
    const t = document.querySelector('#isTopic');
    t.value = 'my work at the bar';
    t.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r => setTimeout(r, 600));
    return byId(jaState2().islands, id).topic;
  }, made.id);
  is('  and what you type is kept as you type it', typed, 'my work at the bar');

  console.log('\n3. islands inside islands');
  const sub = await p.evaluate(async parent => {
    document.querySelector('#isSubAdd').click();
    await new Promise(r => setTimeout(r, 900));
    const kid = jaState2().islands[jaState2().islands.length - 1];
    const t = document.querySelector('#isTopic');
    t.value = 'the Thursday regular';
    t.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r => setTimeout(r, 500));
    return {kid: kid.id, parentOf: kid.parentId, sameParent: kid.parentId === parent,
      hash: location.hash,
      /* it is an island, not a second kind of thing: same fields */
      hasRegisters: !!document.querySelector('#isTeineigo') && !!document.querySelector('#isTameguchi'),
      saysWhereItIs: (document.querySelector('.ja-isle-in') || {textContent:''}).textContent.trim()};
  }, made.id);
  yes('one made inside another knows where it is', sub.sameParent, JSON.stringify(sub));
  yes('  and is an island like any other, with both registers', sub.hasRegisters);
  yes('  and says what it is inside', /my work at the bar/.test(sub.saysWhereItIs), sub.saysWhereItIs);
  const shelf = await p.evaluate(async () => {
    location.hash = '#/japanese/islands';
    await new Promise(r => setTimeout(r, 1000));
    return {cards: [...document.querySelectorAll('.ja-islands .ja-island-t')].map(n => n.textContent.trim()),
      says: document.body.textContent.replace(/\s+/g, ' ')};
  });
  /* a sub-island belongs on its parent's page, not loose in the archipelago */
  yes('the smaller one is not loose among the islands',
    shelf.cards.includes('my work at the bar') && !shelf.cards.includes('the Thursday regular'),
    JSON.stringify(shelf.cards));
  yes('  and the one holding it says how many are inside', /1 inside/.test(shelf.says));
  const adrift = await p.evaluate(async id => {
    location.hash = '#/japanese/islands/' + id;
    await new Promise(r => setTimeout(r, 900));
    document.querySelector('[data-jaislandout]').click();
    await new Promise(r => setTimeout(r, 800));
    const all = jaState2().islands;
    return {parent: (byId(all, jaState2().islands.find(v => v.topic === 'the Thursday regular').id) || {}).parentId,
      loose: [...document.querySelectorAll('.ja-islands .ja-island-t')].map(n => n.textContent.trim())};
  }, made.id);
  /* the same record, one field cleared — not a copy, not a migration */
  is('setting one adrift makes it an island in its own right', adrift.parent, null);

  console.log('\n4. a chunk is Japanese and nothing else');
  const chunk = await p.evaluate(async id => {
    location.hash = '#/japanese/islands/' + id;
    await new Promise(r => setTimeout(r, 900));
    document.querySelector('#isChunkAdd').click();
    await new Promise(r => setTimeout(r, 500));
    const row = document.querySelector('.ja-chunk');
    const fields = [...row.querySelectorAll('input.inp')].map(n => n.dataset.jachunkf);
    const jp = row.querySelector('[data-jachunkf="japanese"]');
    jp.value = '組み合わせる';
    jp.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r => setTimeout(r, 600));
    const c = byId(jaState2().islands, id).chunks[0];
    return {fields, said: document.querySelector('[data-jachunkread]').textContent.trim(),
      stored: c.japanese, reading: c.reading};
  }, made.id);
  /* one field. The reading is worked out and the meaning was only ever there
     to put on the front of a flashcard */
  is('there is one thing to type, and it is the Japanese', chunk.fields, ['japanese']);
  is('  the reading appears beside it as you type', chunk.said, 'くみあわせる');
  /* and it is not stored: an uncorrected reading follows the Japanese as the
     Japanese is edited, rather than going stale beside it */
  is('  worked out rather than written down', [chunk.stored, chunk.reading], ['組み合わせる', '']);
  const corrected = await p.evaluate(async id => {
    document.querySelector('[data-jachunkread]').click();
    await new Promise(r => setTimeout(r, 500));
    const open = !!document.querySelector('#crRead');
    document.querySelector('#crRead').value = 'くみあわせる！';
    document.querySelector('#crSave').click();
    await new Promise(r => setTimeout(r, 700));
    const c = byId(jaState2().islands, id).chunks[0];
    return {open, kept: c.reading, mine: !!document.querySelector('.ja-read.mine')};
  }, made.id);
  yes('a reading you correct is offered, not demanded', corrected.open);
  is('  and what you write is kept', corrected.kept, 'くみあわせる！');
  yes('  and the row says it is yours now', corrected.mine);
  const putBack = await p.evaluate(async id => {
    document.querySelector('[data-jachunkread]').click();
    await new Promise(r => setTimeout(r, 500));
    document.querySelector('#crAuto').click();
    document.querySelector('#crSave').click();
    await new Promise(r => setTimeout(r, 700));
    const c = byId(jaState2().islands, id).chunks[0];
    /* and now the Japanese changes: an uncorrected reading has to follow it */
    const jp = document.querySelector('[data-jachunkf="japanese"]');
    jp.value = '経営する';
    jp.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r => setTimeout(r, 600));
    return {afterPutBack: c.reading, mine: !!document.querySelector('.ja-read.mine'),
      said: document.querySelector('[data-jachunkread]').textContent.trim()};
  }, made.id);
  /* taking the worked-out one back does not freeze it as a correction: a
     reading nobody has changed follows the Japanese as the Japanese is
     edited, rather than going stale beside it */
  is('  putting the worked-out one back stops it being yours', putBack.afterPutBack, '');
  yes('  and an unchanged reading follows the Japanese when it changes',
    putBack.said === 'けいえいする' && !putBack.mine, JSON.stringify(putBack));

  console.log('\n5. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
