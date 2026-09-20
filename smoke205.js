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

   AND THE READING YOU TYPE IS SET OVER THE RIGHT CHARACTERS. Generating
   readings was tried and taken out: a reading you type is a reading you have
   thought about, and thinking about it is most of the reason for writing the
   phrase down. But once the reading is there, putting it over the right
   characters is not a language problem at all — it is an alignment problem,
   and alignment is exact where generation is a guess.

   組み合わせる and くみあわせる. The kana in the phrase are anchors: み and
   わせる must appear in the reading, in that order. Find them, and what falls
   between belongs to the kanji between them. Nothing is looked up.

   It refuses rather than guesses. If the anchors are not there in order —
   a typo, a reading of something else, a phrase with no kana to hold on to —
   there is no alignment and the phrase is left plain, because furigana in
   the wrong place is worse than furigana on the line below: you will read it. */
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

  console.log('\n1. the reading you typed, over the characters it belongs to');
  const fit = await p.evaluate(() => {
    const say = (a, b) => { const al = jaAlign(a, b);
      return al ? al.map(p => p.reading ? `${p.text}[${p.reading}]` : p.text).join('') : null; };
    return {
      /* the kana in the phrase are the anchors, and what falls between them
         belongs to the kanji between them */
      broken: say('組み合わせる', 'くみあわせる'),
      /* a run of kanji is one group: nothing says where けい stops */
      run: say('経営する', 'けいえいする'),
      /* a phrase that ends in kanji takes the rest of the reading */
      ends: say('飲み物', 'のみもの'),
      /* katakana in the phrase, hiragana in the reading: the same thing */
      kata: say('バーの仕事', 'ばーのしごと'),
      /* and a whole sentence, with the particles as anchors */
      sentence: say('日本語を勉強しています', 'にほんごをべんきょうしています'),
      /* nothing is looked up, so a reading nobody would have guessed works */
      odd: say('今日', 'きょう'),
    };
  });
  is('the kana are anchors and the kanji take what falls between',
    fit.broken, '組[く]み合[あ]わせる');
  is('  a run of kanji is one group', fit.run, '経営[けいえい]する');
  is('  a phrase ending in kanji takes the rest', fit.ends, '飲[の]み物[もの]');
  is('  katakana and hiragana are the same thing here', fit.kata, 'バーの仕事[しごと]');
  is('  and the particles of a sentence are anchors too',
    fit.sentence, '日本語[にほんご]を勉強[べんきょう]しています');
  /* the point of typing it rather than generating it: nothing needs to know
     that 今日 is きょう */
  is('  nothing is looked up, so an irregular reading needs no table',
    fit.odd, '今日[きょう]');
  const jaFitsIn = (a, b) => fitsIn[a + '|' + b];
  const fitsIn = await p.evaluate(() => ({
    'お茶|ごちゃ': jaRubyFits('お茶', 'ごちゃ'),
    'お茶|おちゃ': jaRubyFits('お茶', 'おちゃ'),
  }));
  const refuse = await p.evaluate(() => ({
    wrong: jaRubyFits('組み合わせる', 'まちがった'),
    allKana: jaRubyFits('ひらがなだけ', 'ひらがなだけ'),
    short: jaRubyFits('経営する', 'する'),
    plain: jaRubyHTML('組み合わせる', 'まちがった'),
    right: jaRubyHTML('食べる', 'たべる'),
  }));
  yes('a reading that is of something else does not line up', !refuse.wrong);
  /* a phrase that STARTS with kana isolates the anchor check: there is no
     later kana to fail to find, so if the opening kana are not matched
     against the reading, the kanji after them silently swallows the lot */
  yes('  and so does one whose opening kana are wrong',
    !jaFitsIn('お茶', 'ごちゃ') && jaFitsIn('お茶', 'おちゃ'), 'お茶 / ごちゃ');
  yes('  nor does one with nothing to write over', !refuse.allKana);
  yes('  nor one with no reading left for the kanji', !refuse.short);
  /* furigana in the wrong place is worse than furigana on the line below */
  is('  and where it does not line up the phrase is left plain',
    refuse.plain, '組み合わせる');
  yes('  where it does, the reading sits over the character',
    /<ruby>食<rt>た<\/rt><\/ruby>べる/.test(refuse.right), refuse.right);

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
    await new Promise(r => setTimeout(r, 500));
    const before = document.querySelector('[data-jachunkruby]').innerHTML.trim();
    const rd = row.querySelector('[data-jachunkf="reading"]');
    rd.value = 'くみあわせる';
    rd.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r => setTimeout(r, 500));
    const c = byId(jaState2().islands, id).chunks[0];
    return {fields, before, over: document.querySelector('[data-jachunkruby]').innerHTML,
      stored: c.japanese, reading: c.reading};
  }, made.id);
  /* one field. The reading is worked out and the meaning was only ever there
     to put on the front of a flashcard */
  /* the English is the cue when these become flashcards: a production card
     whose front is the Japanese is a card you answer by recognising, and
     recognising is not the skill an island needs */
  is('the phrase, how it is said, and what it means',
    chunk.fields, ['japanese', 'reading', 'meaning']);
  /* nothing is set over anything until there is a reading to set */
  is('  and nothing is written over the kanji until you say how it is said',
    chunk.before, '');
  yes('  then it appears over the characters as you type it',
    /<ruby>\u7d44<rt>\u304f<\/rt><\/ruby>\u307f<ruby>\u5408<rt>\u3042<\/rt><\/ruby>\u308f\u305b\u308b/.test(chunk.over),
    chunk.over);
  is('  and both are kept as typed', [chunk.stored, chunk.reading],
    ['\u7d44\u307f\u5408\u308f\u305b\u308b', '\u304f\u307f\u3042\u308f\u305b\u308b']);
  const mismatch = await p.evaluate(async id => {
    const rd = document.querySelector('[data-jachunkf="reading"]');
    rd.value = '\u307e\u3061\u304c\u3063\u305f';
    rd.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r => setTimeout(r, 600));
    return {over: document.querySelector('[data-jachunkruby]').textContent.trim(),
      kept: byId(jaState2().islands, id).chunks[0].reading};
  }, made.id);
  /* it says so rather than spreading the reading over the characters anyway */
  yes('a reading that does not line up is said so, not forced on',
    /does not line up/.test(mismatch.over), mismatch.over);
  is('  and what you typed is still kept, because it is yours',
    mismatch.kept, '\u307e\u3061\u304c\u3063\u305f');

  console.log('\n5. the stepping stones, and which voice they are in');
  const stones = await p.evaluate(async () => {
    location.hash = '#/japanese/islands';
    await new Promise(r => setTimeout(r, 1200));
    const all = jaState2().stones;
    const by = {};
    all.forEach(v => { const k = v.shelf + '/' + v.register; by[k] = (by[k] || 0) + 1; });
    return {n: all.length, by,
      shelves: [...new Set(all.map(v => v.shelf))].sort(),
      registers: [...new Set(all.map(v => v.register))].sort(),
      /* every one of them says how it is pronounced */
      unread: all.filter(v => !v.reading).length,
      /* and what it does, so the shelf can be glanced at rather than studied */
      unnoted: all.filter(v => !v.note).length,
      groups: document.querySelectorAll('.ja-stonegroup').length,
      voices: [...new Set([...document.querySelectorAll('.ja-stonevoice')].map(n => n.textContent.trim()))]};
  });
  yes('there are a good many of them', stones.n >= 80, String(stones.n));
  is('  on all five shelves', stones.shelves,
    ['aizuchi', 'filler', 'gear', 'repair', 'simple']);
  /* the voice matters most on this shelf: a stepping stone is said under
     pressure without thinking, and one in the wrong register is a pause
     followed by an apology */
  is('  in three voices', stones.registers, ['casual', 'either', 'formal']);
  yes('  with both a formal and a casual one on every shelf',
    ['aizuchi','filler','gear','repair','simple'].every(k =>
      stones.by[k + '/formal'] && stones.by[k + '/casual']), JSON.stringify(stones.by));
  is('  every one of them with a reading', stones.unread, 0);
  is('  and every one with what it does', stones.unnoted, 0);
  yes('  and the shelves are grouped by voice rather than mixed',
    stones.groups >= 10 && stones.voices.some(v => /formal/.test(v))
      && stones.voices.some(v => /casual/.test(v)), JSON.stringify(stones.voices));
  const topUp = await p.evaluate(async () => {
    const j = jaState2();
    const was = j.stones.length;
    const mine = j.stones[0];
    mine.note = 'my own note on it';
    /* two thrown away, and one of the shipped ones rewritten */
    j.stones.splice(1, 2);
    saveNow();
    const after = jaAddShippedStones();
    rerender();
    await new Promise(r => setTimeout(r, 600));
    return {was, added: after, now: j.stones.length,
      keptMine: (j.stones.find(v => v.id === mine.id) || {}).note,
      /* no phrase is on the same shelf twice. The same words on two
         different shelves is not a duplicate: そうですね is a filler while
         you think and an aizuchi while somebody else talks */
      dupes: j.stones.length - new Set(j.stones.map(v => v.shelf + '|' + v.text)).size};
  });
  is('topping up adds back only what is missing', [topUp.added, topUp.now], [2, topUp.was]);
  /* a phrase you have written a note on is yours, and topping up leaves it */
  is('  leaving what you have written on your own alone', topUp.keptMine, 'my own note on it');
  is('  and putting nothing in twice', topUp.dupes, 0);

  console.log('\n6. and it is all still there tomorrow');
  /* The save pass walks META_KEYS and ARRAY_STORES rather than the state, so
     a room keeping its things under a key in neither list is a room whose
     things are written on every change and stored by nothing. It works all
     session and is empty the next morning, and nothing in the app can see
     the difference, because everything reads the state. Four rooms were in
     exactly that position: every stepping stone, island, card and correction
     was thrown away on reload. The only way to test it is to reload. */
  const before = await p.evaluate(async () => {
    const j = jaState2();
    j.stones.push({id:'stone-test', shelf:'filler', text:'\u306a\u3093\u3068\u3044\u3046\u304b',
      reading:'\u306a\u3093\u3068\u3044\u3046\u304b', note:'a test stone', order:999});
    studyState().decks.push({id:'deck-test', name:'A test deck'});
    S.habitAccounts = Object.assign(S.habitAccounts || {}, {testAccount: 7});
    saveNow();
    await new Promise(r => setTimeout(r, 900));
    return {stones: j.stones.length, decks: studyState().decks.length};
  });
  await p.reload(); await p.waitForTimeout(2200);
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const after = await p.evaluate(() => ({
    stone: !!(jaState2().stones || []).find(v => v.id === 'stone-test'),
    stones: (jaState2().stones || []).length,
    islands: jaState2().islands.length,
    chunk: ((jaState2().islands.find(i => (i.chunks || []).length) || {}).chunks || [{}])[0].japanese,
    deck: !!(studyState().decks || []).find(d => d.id === 'deck-test'),
    account: (S.habitAccounts || {}).testAccount,
  }));
  yes('a stepping stone is still there after a reload', after.stone, JSON.stringify(after));
  yes('  and so are the islands, with what was written in them',
    after.islands >= 2 && after.chunk === '\u7d44\u307f\u5408\u308f\u305b\u308b', JSON.stringify(after));
  yes('  and the study deck', after.deck);
  is('  and the habit accounts', after.account, 7);

  console.log('\n7. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
