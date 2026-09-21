/* smoke210 — the page keeps your place.

   Two different ways of losing it, both reported, both fixed here.

   TICKING SOMETHING THREW YOU TO THE TOP. Almost every edit in this house
   ends in a redraw: the page is emptied and written again. The redraw did
   put the scroll back — once, the instant the new page was written, which is
   too early. Anything that changes the page's height after that moment (a
   font arriving, a chart tweening open, a reveal, an engraving) lands after
   the restore, and if the page happened to be shorter at that instant the
   browser had already clamped the position and nothing corrected it. So you
   tick a task near the bottom of a long day and find yourself back at the
   top, hunting for where you were.

   AND COMING BACK OUT OF SOMETHING THREW YOU TO THE TOP. The scroll of each
   page was remembered, and handed back only when you arrived by the
   browser's own Back button — which nobody uses inside an app with its own
   "← back" on the page. Every in-app way out landed at the top of a long
   list. The memory was there; it would not hand it over.

   The second is the more interesting rule. Coming back OUT is not the same
   as arriving: #/jazz from #/jazz/P0.1 is stepping out of something you were
   inside, and should return you to it; #/jazz from #/today is a fresh visit,
   and should start at the top. That distinction is what these claims are
   mostly about, because getting it wrong in the other direction — always
   restoring — is its own annoyance.

   THREE OF THE DEFENCES HERE ARE UNPROVEN, and are named rather than left
   looking covered. The restore is repeated over the third of a second it
   takes layout to settle; in every case below a single frame turns out to
   be enough, so cutting the later attempts changes nothing. The position is
   taken again at the moment of leaving rather than relying on the debounced
   scroll listener, and the listener records against the page on the screen
   rather than the address in the bar — both of those are races, and the
   timings here do not lose them. All three stay: a race that does not bite
   on this machine on this afternoon is not a race that does not exist, and
   the browser Back button was landing at the top intermittently before
   them.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);
/* a few pixels of settle is not losing your place; a screenful is */
const near = (n, a, b, tol = 40) => Math.abs(a - b) <= tol ? ok(n) : no(n, `${a} vs ${b}`);
/* the viewport, read back off the measurements rather than hard-coded */
const window_h = m => m.midHeight;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:700}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  /* a day long enough to have a bottom worth being at */
  const ready = await p.evaluate(async () => {
    planState();
    const list = planLists()[0].id;
    for(let i = 0; i < 40; i++){ const id = 's210-' + i;
      if(findTaskRef(id)) continue;
      S.tasks.push(planTaskDefaults({id, text:'a thing to do number ' + i, listId:list, day:today()})); }
    saveNow();
    location.hash = '#/today'; rerender();
    await new Promise(r => setTimeout(r, 1500));
    document.querySelectorAll('details.section').forEach(d => d.open = true);
    await new Promise(r => setTimeout(r, 500));
    return {rows: document.querySelectorAll('[data-tcheck]').length,
      h: document.documentElement.scrollHeight, view: innerHeight};
  });
  yes('the day is long enough to have somewhere to be lost from',
    ready.rows > 20 && ready.h > ready.view * 2, JSON.stringify(ready));

  console.log('\n1. ticking something does not throw you to the top');
  const tick = await p.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    window.scrollTo({top: Math.round((h - innerHeight) * 0.6), behavior:'instant'});
    await new Promise(r => setTimeout(r, 400));
    const from = Math.round(window.scrollY);
    const box = [...document.querySelectorAll('[data-tcheck]')]
      .find(n => { const r = n.getBoundingClientRect(); return r.top > 40 && r.top < innerHeight - 40; });
    if(!box) return {from, note:'nothing in view to tick'};
    const id = box.dataset.tcheck;
    box.click();
    await new Promise(r => setTimeout(r, 1500));
    return {from, after: Math.round(window.scrollY), id,
      done: !!(findTaskRef(id) || {}).done};
  });
  yes('there was something in view to tick', !tick.note, tick.note || '');
  yes('  and it was ticked', tick.done === true);
  near('  and the page stayed where it was', tick.after, tick.from);
  /* the restore has to outlast the layout, not just beat it once */
  const settled = await p.evaluate(() => Math.round(window.scrollY));
  near('    and was still there once everything had settled', settled, tick.from);

  /* Where restoring once, early, is not enough. A redraw empties the page
     and writes it again, and on a page whose content arrives late — an
     engraving, a chart, a font — the document is briefly SHORTER than the
     position being restored. The browser clamps the scroll to whatever fits,
     which at that instant is the top, and the position is gone before the
     page grows back. Restoring again as layout settles is the whole fix, and
     this is the case that shows it: the height is measured mid-redraw and it
     really is short. */
  const late = await p.evaluate(async () => {
    const bar = (n, body) => `<measure number="${n}">${body}</measure>`;
    const run = o => ['C','D','E','F'].map(s =>
      `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>4</duration><voice>1</voice><type>quarter</type></note>`).join('');
    const head = `<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
      <work><work-title>A Tall One</work-title></work>
      <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
      <part id="P1">${Array.from({length: 24}, (_, i) =>
        bar(i + 1, (i ? '' : head) + run(5))).join('')}</part></score-partwise>`;
    location.hash = '#/score';
    await new Promise(r => setTimeout(r, 1300));
    await takeScoreFile(new File([xml], 'A Tall One.musicxml'));
    await new Promise(r => setTimeout(r, 4500));
    /* one bar to a line, so the engraving is far taller than the window */
    const x = scores().find(v => v.title === 'A Tall One');
    x.barsPerLine = 1;
    await scoreRedraw(x);
    await new Promise(r => setTimeout(r, 4000));
    const tall = document.documentElement.scrollHeight;
    window.scrollTo({top: Math.round((tall - innerHeight) * 0.6), behavior:'instant'});
    await new Promise(r => setTimeout(r, 400));
    const from = Math.round(window.scrollY);
    rerender();
    /* measured the instant the page is rewritten, before the engraving lands */
    const midHeight = document.documentElement.scrollHeight;
    const midScroll = Math.round(window.scrollY);
    await new Promise(r => setTimeout(r, 4000));
    return {tall, from, midHeight, midScroll, after: Math.round(window.scrollY),
      end: document.documentElement.scrollHeight};
  });
  /* It does not take much: the engraving keeps its own scroll inside a box,
     so the page is only a little taller than the window. A small drop is
     enough, because the clamp is not proportional — what will not fit is
     simply thrown away. */
  yes('a score room taller than the window', late.tall > window_h(late) && late.from > 50,
    JSON.stringify(late));
  yes('  goes short when it is redrawn', late.midHeight < late.tall,
    `${late.midHeight} of ${late.tall}`);
  yes('    short enough that the browser throws the position away',
    late.midScroll < late.from / 2, `${late.midScroll} was ${late.from}`);
  near('  and it is put back once the engraving lands', late.after, late.from);

  console.log('\n2. coming out of something returns you to it');
  const inOut = await p.evaluate(async () => {
    location.hash = '#/jazz';
    await new Promise(r => setTimeout(r, 1600));
    const rungs = [...document.querySelectorAll('[data-jzopen]')];
    const deep = rungs[Math.floor(rungs.length * 0.7)];
    deep.scrollIntoView({block:'center'});
    await new Promise(r => setTimeout(r, 400));
    const from = Math.round(window.scrollY);
    deep.click();
    await new Promise(r => setTimeout(r, 2600));
    const inside = Math.round(window.scrollY);
    document.querySelector('#jzBack').click();
    await new Promise(r => setTimeout(r, 1700));
    return {from, inside, after: Math.round(window.scrollY), id: deep.dataset.jzopen};
  });
  yes('going into one starts at the top of it', inOut.inside < 60, String(inOut.inside));
  near('  and coming out puts you back where you pressed', inOut.after, inOut.from);
  yes('    which was a long way down', inOut.from > 700, String(inOut.from));

  console.log('\n3. but arriving somewhere new still starts at the top');
  const fresh = await p.evaluate(async () => {
    /* leave for another room entirely, then come to this one */
    location.hash = '#/today'; await new Promise(r => setTimeout(r, 1500));
    location.hash = '#/jazz';  await new Promise(r => setTimeout(r, 1600));
    return Math.round(window.scrollY);
  });
  is('a fresh visit begins at the beginning', fresh, 0);

  console.log('\n4. and the browser’s own Back still works');
  const back = await p.evaluate(async () => {
    const rungs = [...document.querySelectorAll('[data-jzopen]')];
    const deep = rungs[Math.floor(rungs.length * 0.6)];
    deep.scrollIntoView({block:'center'});
    await new Promise(r => setTimeout(r, 400));
    const from = Math.round(window.scrollY);
    deep.click();
    await new Promise(r => setTimeout(r, 2400));
    history.back();
    await new Promise(r => setTimeout(r, 1800));
    return {from, after: Math.round(window.scrollY)};
  });
  near('pressing Back returns you to the spot too', back.after, back.from);

  console.log('\n5. nothing broke on the way');
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
