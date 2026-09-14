/* smoke171 — the main room, and the bar.

   The ground floor of the house, and the floor where everything is a thing
   you MAKE something with: an instrument, a desk, a shelf, a counter. The
   sanctuary above is all cloth and cushions. That contrast is the only thing
   telling you which floor you are on once you stop reading the labels.

   Two things have to hold.

   Every object is a door into the part of the instrument it is a picture of,
   and the room fills from the record: a book on the shelf is a book you
   logged, a note on the wall is a coincidence you wrote down, a bottle on the
   bar is a drink you named. Nothing in here is decoration pretending to be
   progress — that is the whole difference between this and a wallpaper.

   And the bar actually makes something. You draw one card and the card's own
   keywords decide what goes in the glass, through a table of flavours: the
   Star gives you something floral and the Ten of Swords gives you something
   bitter, every time, for a reason you can read back. If the recipe ever
   stops being derived from the card, the ceremony is a random generator
   wearing a costume. */
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
  const p = await b.newPage({viewport:{width:1340, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  /* Back to the room from wherever the last door led, and wait for it to be
     drawn rather than guessing at a delay. Setting a hash you are already on
     fires nothing, so the room is asked for explicitly. */
  const room = async () => {
    await p.evaluate(() => { if(location.hash === '#/house/main') rerender(); else location.hash = '#/house/main'; });
    await p.waitForSelector('.zone-piano', {state:'attached'});
    await p.waitForTimeout(450);
  };
  /* a door is pressed by pressing a thing that is drawn, not the group, since
     an SVG group has no surface of its own */
  const press = async sel => {
    await p.waitForSelector(sel, {state:'attached'});
    await p.evaluate(s => document.querySelector(s).closest('[data-room]')
      .dispatchEvent(new MouseEvent('click', {bubbles:true})), sel);
    await p.waitForTimeout(700);
    return p.evaluate(() => location.hash);
  };

  await p.evaluate(() => {
    /* a clean shelf to count, and the books are written the way an import
       writes them — with no links object at all, which is exactly the shape
       that used to take the Library down */
    S.entries = S.entries.filter(e => e.type !== 'media' && e.type !== 'synchronicity');
    for(let i = 0; i < 14; i++) S.entries.push({id:'mb'+i, type:'media', occurredAt: today(), title:'A book'});
    for(let i = 0; i < 9; i++)  S.entries.push({id:'sy'+i, type:'synchronicity', occurredAt: today(), body:'x'});
    saveNow();
  });
  await room();

  console.log('\n1. the room is on the ground floor, and it is one drawing');
  is('the main room draws', await p.evaluate(() => document.querySelector('.house-stage').dataset.zone), 'main');
  const shape = await p.evaluate(() => { const st = document.querySelector('.house-stage');
    return {svg: st.querySelectorAll('svg').length, canvas: st.querySelectorAll('canvas').length,
      ext: [...st.querySelectorAll('[src],[href]')].length}; });
  yes('  it is drawn, not fetched', shape.svg > 0 && shape.ext === 0, `${shape.svg} svg, ${shape.ext} external`);
  is('  no canvas', shape.canvas, 0);

  console.log('\n2. every object is a door into the thing it is a picture of');
  const doors = await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')].map(n => n.dataset.room));
  for(const k of ['library','writing','piano','band','medicine','crystals','drinks','nook','synch'])
    yes(`  you can reach the ${k}`, doors.includes(k), doors.join(' '));
  yes('  and every one of them takes a keyboard', await p.evaluate(() =>
    [...document.querySelectorAll('.house-room [data-room]')]
      .every(n => n.getAttribute('tabindex') === '0' && n.getAttribute('aria-label'))));

  for(const [sel, want, said] of [
    ['.zone-books .rm-shelf-box',  '#/journals/library',       'the shelf opens the library'],
    ['.zone-piano .hm-piano-body', '#/skills',                 'the piano opens your skills'],
    ['.zone-band .hm-drum',        '#/projects',               'the band opens your projects'],
    ['.obj-medicine .hm-drawer',   '#/values',                 'the medicine cupboard opens your values'],
    ['.zone-nook .hm-chair-back',  '#/journals/reflection',    'the nook opens the reflections'],
    ['.zone-synch .hm-board',      '#/journals/synchronicity', 'the wall opens the coincidences'],
  ]){ await room(); is(said, await press(sel), want); }
  await room();
  yes('the desk opens the writing studio', /^#\/content/.test(await press('.zone-desk .hm-desk')));
  await room();
  await press('.obj-crystals .hm-crystal');
  yes('the crystals open the charm casting', await p.evaluate(() => !!document.querySelector('.overlay')));
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n3. the room fills from the record, rather than pretending to');
  await room();
  const filled = await p.evaluate(() => ({
    books: document.querySelectorAll('.zone-books .rm-book').length,
    notes: document.querySelectorAll('.hm-pin-note').length}));
  is('  fourteen logged books is fourteen books on the shelf', filled.books, 14);
  /* those fourteen were written with no links object at all. Reading one
     straight through used to throw, and the Library became the error page. */
  yes('    and an entry with no links at all does not take a page down',
    await p.evaluate(async () => { location.hash = '#/journals/library';
      await new Promise(r => setTimeout(r, 700));
      return !document.querySelector('#main').textContent.includes('did not draw'); }));
  is('  and nine coincidences is nine notes on the wall', filled.notes, 9);
  await p.evaluate(() => { S.entries = S.entries.filter(e => e.type !== 'media'); saveNow(); });
  await room();
  is('  a shelf with nothing logged is a bare shelf',
    await p.evaluate(() => document.querySelectorAll('.zone-books .rm-book').length), 0);

  console.log('\n4. the bar makes something, and makes it out of the card');
  await room();
  await press('.obj-drinks .hm-machine');
  yes('the bar opens the ceremony', await p.$('.drink-rite') !== null);
  is('  four things to start with', await p.evaluate(() =>
    [...document.querySelectorAll('[data-dbase]')].map(n => n.dataset.dbase)),
    ['tea','coffee','cocktail','herbal']);
  /* the recipe is derived, not picked: the same card must give the same
     ingredients, and a different card different ones */
  const brew = await p.evaluate(() => {
    const mk = (name, words) => drinkRecipe({system:'tarot', id:name, name, words, line:''}, 'tea');
    return {star: mk('The Star', 'hope faith wish guide light').ingredients.map(x => x.name),
      again: mk('The Star', 'hope faith wish guide light').ingredients.map(x => x.name),
      swords: mk('Ten of Swords', 'exhaustion ruin disaster').ingredients.map(x => x.name),
      empty: mk('Nothing', 'qqqq zzzz').ingredients.map(x => x.name)};
  });
  is('  the Star is floral', brew.star, ['chamomile','elderflower']);
  is('  and it is the same floral every time', brew.again, brew.star);
  is('  the Ten of Swords is bitter', brew.swords, ['bitter orange']);
  yes('  and a card that matches nothing still fills the glass', brew.empty.length === 1, brew.empty.join(' '));

  await p.click('[data-dbase="cocktail"]');
  await p.click('#dkTarot'); await p.waitForTimeout(600);
  yes('a draw offers a name you can change', await p.$('#dkName') !== null);
  await p.fill('#dkName', 'The Long Way Round');
  await p.fill('#dkNote', 'Made it the night before the interview.');
  await p.click('#dkKeep'); await p.waitForTimeout(900);
  const kept = await p.evaluate(() => (S.entries || []).filter(e => e.type === 'drink')
    .map(e => ({name: e.title, base: e.extra.drink.base, note: e.body,
      from: e.extra.drink.inspiredBy.system, n: e.extra.drink.ingredients.length})));
  is('  and it goes on the menu with what it was made of', kept.length, 1);
  is('    named as you named it', kept[0] && kept[0].name, 'The Long Way Round');
  is('    on the base you chose', kept[0] && kept[0].base, 'cocktail');
  is('    remembering the card it came from', kept[0] && kept[0].from, 'tarot');
  yes('    and what you said about it', kept[0] && /interview/.test(kept[0].note));
  /* the bottle on the shelf is the drink you named */
  await room();
  yes('  and a bottle appears on the bar for it',
    await p.evaluate(() => document.querySelectorAll('.hm-bottle').length) === 7,
    String(await p.evaluate(() => document.querySelectorAll('.hm-bottle').length)));

  console.log('\n5. it costs one paint and then nothing');
  const loops = await p.evaluate(() => Animator.stats().loops.map(l => l.id));
  yes('  no loop of its own', !loops.some(id => /house|room|bar/i.test(id)), loops.join(' '));
  const moving = await p.evaluate(() => [...document.querySelectorAll('.house-stage *')]
    .map(n => getComputedStyle(n).animationName).filter(a => a && a !== 'none'));
  yes('  and only the candlelight moves unasked',
    moving.every(a => /rmFlame/.test(a)), moving.join(' ') || 'nothing at all');

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke171  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
