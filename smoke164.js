/* smoke164 — the word under a card that landed the other way up.

   A card's caption is two lines when it is reversed: its name, and the word
   "reversed" under that. The board reserves a fixed band of room beneath each
   card for the caption, and its own height is that band plus the last row —
   and the wrapper hides vertical overflow, because a board wider than the room
   it is in must scroll sideways without also growing a vertical scrollbar.

   So the band being a few pixels short did not push anything down. It cut the
   last line in half, in every spread, and only when a card was reversed, which
   is exactly the case where that line is the whole point. This pins the room:
   every caption, in every spread in the library, with the longest names the
   deck has and the reversed line under them, ends inside the board. */
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
  const p = await b.newPage({viewport:{width:1340, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1600); }

  console.log('\n1. a reversed card says so, in two lines');
  const cap = await p.evaluate(() => {
    const key = Object.keys(TAROT)[0];
    const host = document.createElement('div');
    host.id = 'capProbe';
    host.style.cssText = 'position:fixed;left:0;top:0;width:400px;z-index:99999';
    host.innerHTML = `<div class="tc-capslot">${tarotCaptionHTML({card: key, rev: true})}</div>
      <div class="tc-capslot">${tarotCaptionHTML({card: key, rev: false})}</div>`;
    document.body.appendChild(host);
    const [rev, up] = [...host.querySelectorAll('.tc-capslot')];
    const r = rev.querySelector('.tc-cap-rev');
    const out = {rev: !!r, word: r && r.textContent.trim(), upright: !!up.querySelector('.tc-cap-rev'),
      h: r && Math.round(r.getBoundingClientRect().height)};
    host.remove();
    return out;
  });
  yes('a reversed card carries the word', cap.rev);
  is('  and the word is "reversed"', cap.word, 'reversed');
  yes('  on a line with height to it', cap.h >= 8, String(cap.h));
  yes('an upright one carries nothing', !cap.upright);

  console.log('\n2. every spread leaves room for it, at the longest names the deck has');
  const bad2 = await p.evaluate(() => {
    /* the four or five longest names in the deck: these are what wrap, and a
       wrapped name plus the reversed line is the tallest a caption gets */
    const longest = Object.entries(TAROT).map(([k, c]) => [k, c.n])
      .sort((a, b) => b[1].length - a[1].length).slice(0, 6);
    const out = [];
    for(const sp of SPREAD_LIBRARY){
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:0;top:0;width:1100px;z-index:99999';
      host.innerHTML = tarotBoardHTML(sp);
      document.body.appendChild(host);
      host.querySelectorAll('.tc-capslot').forEach((c, i) => {
        const [key, name] = longest[i % longest.length];
        c.innerHTML = tarotCaptionHTML({card: key, rev: true});
        const n = c.querySelector('.tc-cap-name'); if(n) n.textContent = name;
      });
      const board = host.querySelector('.tc-board').getBoundingClientRect();
      const slots = [...host.querySelectorAll('.tc-slot')];
      let over = 0, hit = 0;
      slots.forEach(s => {
        const c = s.querySelector('.tc-capslot'); if(!c) return;
        const r = c.getBoundingClientRect();
        over = Math.max(over, Math.round(r.bottom - board.bottom));
        /* the crossed card of a Celtic cross deliberately lies over the one
           beneath it, and its caption gets a plate to sit on for that reason */
        if(s.classList.contains('cross')) return;
        slots.forEach(o => {
          if(o === s || o.classList.contains('cross')) return;
          const card = o.querySelector('.tc-hole, .tc'); if(!card) return;
          const b2 = card.getBoundingClientRect();
          if(r.bottom > b2.top + 1 && r.top < b2.bottom - 1 && r.right > b2.left + 1 && r.left < b2.right - 1)
            hit = Math.max(hit, Math.round(r.bottom - b2.top));
        });
      });
      if(over > 0 || hit > 0) out.push(`${sp.name}: ${over > 0 ? `${over}px past the board` : ''}${
        hit > 0 ? ` ${hit}px over the next row` : ''}`.trim());
      host.remove();
    }
    return out;
  });
  is('no caption is cut off by the board', bad2, []);

  console.log('\n3. the board hides what runs past it, which is why the room has to be right');
  is('the wrapper hides vertical overflow', await p.evaluate(() =>
    getComputedStyle(document.createElement('div')) && (() => {
      const d = document.createElement('div'); d.className = 'tc-boardwrap';
      document.body.appendChild(d);
      const v = getComputedStyle(d).overflowY; d.remove(); return v;
    })()), 'hidden');

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke164  ${bad} FAILED` : '\nsmoke164  all good');
  process.exit(bad ? 1 : 0);
})();
