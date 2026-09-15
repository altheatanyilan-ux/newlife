/* smoke153 — Finance in rectangles. A stream with three parts and a paragraph
   about what it is for ran to twice the length of one that says "Book.", and
   a row of cards ending at three different heights reads as unfinished. Each
   card now has a ceiling of about a screenful, a heading pinned to the top of
   it, and scrolls inside itself; cards in a row are levelled with each other.
   Same bargain as Today's sections. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const LONG = 'A retainer with three agencies, invoiced monthly, plus whatever overflow work comes through the door. '.repeat(8);

const cards = () => {
  const h = n => Math.round(n.getBoundingClientRect().height);
  const rows = [...document.querySelectorAll('.fin-cards')].map(g => [...g.children].map(h));
  return {rows,
    streams: [...document.querySelectorAll('.fin-cards > .stream-card')].map(c => ({
      h: h(c), scrolls: c.scrollHeight > c.clientHeight + 1, ch: c.clientHeight, sh: c.scrollHeight})),
    scenarios: [...document.querySelectorAll('.scenario-rail > .scenario-card')].map(c => ({
      h: h(c), scrolls: c.scrollHeight > c.clientHeight + 1})),
    vh: innerHeight, hscroll: document.documentElement.scrollWidth > innerWidth + 1};
};

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const open = async (w, h) => {
    const p = await b.newPage({viewport:{width:w, height:h}});
    p.on('pageerror', e => errs.push(`${w}x${h} pageerror: ` + e.message));
    p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push(`${w}x${h} console: ` + m.text()); });
    await p.goto(FILE); await p.waitForTimeout(1000);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2100); }
    await p.evaluate(() => { location.hash = '#/finance'; rerender(); }); await p.waitForTimeout(1600);
    /* one stream made deliberately long and one deliberately short, so the
       ceiling and the levelling both have something to do */
    await p.evaluate(long => {
      const list = incomeStreamList();
      if(list[0]) list[0].income.model = long;
      if(list[1]) list[1].income.model = 'Book.';
      saveNow(); rerender();
    }, LONG);
    await p.waitForTimeout(1000);
    return p;
  };

  console.log('\n1. a row of cards ends where the row ends');
  let p = await open(1500, 1000);
  let m = await p.evaluate(cards);
  yes('there are rows of cards to look at', m.rows.length > 0 && m.rows[0].length > 1,
      m.rows.map(r => r.join('/')).join('  |  '));
  yes('  every card in a row is exactly as tall as the others',
      m.rows.every(r => new Set(r).size === 1), m.rows.map(r => r.join(', ')).join('  |  '));
  yes('  and the two lives are level too',
      m.scenarios.length > 1 && new Set(m.scenarios.map(s => s.h)).size === 1,
      m.scenarios.map(s => s.h).join(', '));
  yes('  nothing runs off the side', !m.hscroll);

  console.log('\n2. the ceiling is about a screenful, with room under it');
  yes('no card is taller than the screen', m.streams.every(s => s.h <= m.vh) &&
      m.scenarios.every(s => s.h <= m.vh), m.streams.map(s => s.h).join(', ') + ` of ${m.vh}`);
  yes('  and none is the whole of it either — there is wiggle room',
      m.streams.every(s => s.h <= m.vh * 0.8), m.streams.map(s => s.h).join(', '));
  yes('  a card with more in it than that scrolls inside itself',
      m.streams.some(s => s.scrolls), m.streams.map(s => `${s.ch}/${s.sh}`).join(', '));

  console.log('\n3. the heading stays where you can see it');
  const head = await p.evaluate(() => {
    const c = [...document.querySelectorAll('.fin-cards > .stream-card')].find(x => x.scrollHeight > x.clientHeight + 1);
    if(!c) return {found:false};
    const h = c.querySelector('.fin-head');
    c.scrollTop = 0; const before = Math.round(h.getBoundingClientRect().top);
    c.scrollTop = 120; const after = Math.round(h.getBoundingClientRect().top);
    const bg = getComputedStyle(h).backgroundColor;
    return {found:true, moved: c.scrollTop, pinned: before === after,
      opaque: bg !== 'rgba(0, 0, 0, 0)' && (!bg.startsWith('rgba') || parseFloat(bg.split(',')[3]) === 1), bg};
  });
  yes('a card that scrolls was found', head.found && head.moved > 0);
  yes('  its name is pinned while the card moves under it', head.pinned);
  yes('  and nothing shows through the name', head.opaque, head.bg);
  /* the page below a card does not move when the card does */
  const still = await p.evaluate(() => {
    const rail = document.querySelector('.scenario-rail');
    const was = Math.round(rail.getBoundingClientRect().top);
    const c = [...document.querySelectorAll('.fin-cards > .stream-card')].find(x => x.scrollHeight > x.clientHeight + 1);
    /* report rather than throw if the ceiling ever goes: a suite that dies
       here stops testing everything after it */
    if(!c) return {was, now: was, none: true};
    c.scrollTop = c.scrollHeight;
    return {was, now: Math.round(rail.getBoundingClientRect().top)};
  });
  yes('  and the page below it does not move', !still.none && still.now === still.was,
      still.none ? 'nothing scrolled, so nothing was proved' : `${still.was} → ${still.now}`);

  console.log('\n4. a short pair is levelled but not turned into a scroller');
  const shortRow = m.rows.find(r => r.length === 2 && r[0] < 400);
  yes('the gap page\'s two small cards are the same height',
      !!shortRow && new Set(shortRow).size === 1, (shortRow || []).join(', ') || 'no short row found');
  yes('  and neither of them scrolls', await p.evaluate(() =>
    [...document.querySelectorAll('.fin-cards')].flatMap(g => [...g.children])
      .filter(c => !c.classList.contains('stream-card'))
      .every(c => c.scrollHeight <= c.clientHeight + 1)));
  await p.close();

  console.log('\n5. a narrow screen keeps the cards whole');
  p = await open(680, 1100);
  m = await p.evaluate(cards);
  yes('no card is a scroller', m.streams.every(s => !s.scrolls) && m.scenarios.every(s => !s.scrolls),
      m.streams.map(s => `${s.ch}/${s.sh}`).join(', '));
  yes('  and a long one is as long as it is', m.streams.some(s => s.h > 400),
      m.streams.map(s => s.h).join(', '));
  yes('  nothing runs off the side', !m.hscroll);
  await p.close();

  console.log('\n6. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke153  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
