/* smoke182 — Today's buttons on one line, and the sacred space in two views.

   Three complaints, one screenshot:

     "make these three lines of buttons one line instead"
     "make the height of the sacred space longer so that the sacred space can
      be viewed in one go, no scrolling needed"
     "all the text and buttons under the picture for sacred space — make it a
      different view; this means at one time one view appears — either the
      house image or the text & buttons"

   The third line of buttons turned out not to be a row of buttons at all. The
   Back button is coded never to appear on the home page — `show = history
   .length > 1 && (name !== homeRoute() || !!$('#panel'))` — and it appeared
   there anyway, because `.back-btn{…display:inline-flex…}` out-specifies the
   UA stylesheet's `[hidden]{display:none}`. The element was given `hidden`
   and stayed on screen. This trap had been patched one element at a time for
   years (.field, .stack, .speed-dial, .today-view, .solar-tip…), each patch
   the same bug found again; there is one rule for all of them now, so section
   1 checks a few of the others still hide too.

   The other two lines — the view switch and the section jumps — were two
   sticky rows at two different tops, asking the same question at two scales.
   They share a line.

   And the sacred space was the house drawing with everything you can do in it
   stacked underneath: four ways to be still, their options, the begin button,
   the week's minutes, the recent sittings, five divination doors. Taller than
   a screen either way round, so you could never see the room you had come to
   sit in and the thing you wanted to do in it at the same time, and never see
   all of either. Two views. */
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
  /* the section's open state is a saved preference, so setting .open by hand is
     undone by the next redraw — the jump button is how the app opens it */
  const openSacred = async () => {
    await p.evaluate(() => { const j = document.querySelector('.today-jump button[data-jump="t-sacred"]');
      if(j) j.click(); });
    await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelector('#t-sacred')?.scrollIntoView({block:'start'}));
    await p.waitForTimeout(600);
  };
  const box = s => p.evaluate(sel => { const n = document.querySelector(sel); if(!n) return null;
    const r = n.getBoundingClientRect();
    return {x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height)}; }, s);

  console.log('\n1. hidden means hidden');
  /* go somewhere else and come back, so the Back button has a reason to exist
     and then stops having one */
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1300);
  const away = await box('.back-btn');
  yes('away from home the Back button is there', away && away.w > 0, JSON.stringify(away));
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1600);
  const home = await p.evaluate(() => ({hidden: document.querySelector('#backBtn').hidden,
    w: Math.round(document.querySelector('#backBtn').getBoundingClientRect().width),
    display: getComputedStyle(document.querySelector('#backBtn')).display}));
  yes('home again, the code asks for it to go', home.hidden);
  is('  and it goes', home.display, 'none');
  is('  taking its width with it', home.w, 0);
  /* the same rule, on the elements that had each needed their own patch */
  const others = await p.evaluate(() => {
    const mk = cls => { const n = document.createElement('div'); n.className = cls; n.hidden = true;
      n.textContent = 'x'; document.body.appendChild(n);
      const d = getComputedStyle(n).display; n.remove(); return d; };
    return {field: mk('field'), stack: mk('stack'), row: mk('row'), entry: mk('entry')};
  });
  is('  and it is one rule for every element, not a list of them',
     Object.values(others), ['none','none','none','none']);

  console.log('\n2. the view switch and the jumps share a line');
  await p.evaluate(() => { setTodayView('in'); rerender(); }); await p.waitForTimeout(1300);
  const bar = await box('.today-bar'), sw = await box('.today-switch'), jump = await box('.today-jump');
  yes('there is one bar holding both', bar && sw && jump, JSON.stringify({bar, sw, jump}));
  yes('  the jumps sit beside the switch, not under it', jump.x > sw.x + sw.w - 4,
      `switch ends ${sw.x + sw.w}, jumps start ${jump.x}`);
  yes('  on the same line', Math.abs((jump.y + jump.h/2) - (sw.y + sw.h/2)) < 10,
      `switch mid ${sw.y + sw.h/2}, jumps mid ${jump.y + jump.h/2}`);
  yes('  and the bar is no taller than one row of buttons', bar.h < 60, bar.h + 'px');
  /* both still do what they did */
  await p.click('.today-switch button[data-tview="do"]'); await p.waitForTimeout(1100);
  is('  the switch still switches', await p.evaluate(() => S.settings.todayView), 'do');
  await p.evaluate(() => { setTodayView('in'); rerender(); }); await p.waitForTimeout(1300);
  await p.click('.today-jump button[data-jump="t-sacred"]'); await p.waitForTimeout(1200);
  yes('  and the jumps still jump',
      await p.evaluate(() => document.querySelector('#t-sacred').open));

  console.log('\n3. the sacred space is the room, or what to do in it — never both');
  await p.evaluate(() => { document.querySelectorAll('.t-sec').forEach(d => { if(d.id !== 't-sacred') d.open = false; }); });
  await openSacred();
  const first = await p.evaluate(() => ({view: S._sacredView || 'house',
    stage: !document.querySelector('.sacred-stage').hidden,
    rest: !document.querySelector('.sacred-rest').hidden,
    tabs: document.querySelectorAll('.sacred-switch button').length}));
  is('it opens on the house', first.view, 'house');
  yes('  the room is showing', first.stage);
  yes('  and everything that was stacked under it is not', !first.rest);
  is('  two views to choose between', first.tabs, 2);
  await p.click('.sacred-switch button[data-sview="doing"]'); await p.waitForTimeout(1300);
  await openSacred();
  const second = await p.evaluate(() => ({view: S._sacredView,
    stage: !document.querySelector('.sacred-stage').hidden,
    rest: !document.querySelector('.sacred-rest').hidden,
    begin: !!document.querySelector('#stBegin'),
    doors: document.querySelectorAll('.still-util button').length}));
  is('  the other view is what to do here', second.view, 'doing');
  yes('  which shows the practices', second.rest && second.begin && second.doors >= 5,
      JSON.stringify(second));
  yes('  and not the room', !second.stage);
  /* the practice controls still work from there */
  await p.click('.still-tabs button[data-stkind="breath"]'); await p.waitForTimeout(1100);
  is('  and they still do what they did', await p.evaluate(() => stillness().prefs.kind), 'breath');
  yes('  without losing the view you were on', await p.evaluate(() => S._sacredView === 'doing'));

  console.log('\n4. and each view fits on a screen');
  /* Measured on a shorter window — 1400x1000 is roomy enough that even the old
     stacked arrangement very nearly fitted, so a test run only there would pass
     whether or not the views were ever split. What is asserted is the section's
     own height, not where it happens to have been scrolled to: a section twice
     the height of the window can always be scrolled until one end of it is on
     screen. */
  const short = await b.newContext({viewport:{width:1280, height:760}});
  const q = await short.newPage();
  q.on('pageerror', e => errs.push('pageerror(short): ' + e.message));
  await q.goto(FILE); await q.waitForTimeout(1000);
  if(await q.$('#frGo')){ await q.click('#frGo'); await q.waitForTimeout(2000); }
  await q.evaluate(() => { setTodayView('in'); location.hash = '#/today'; }); await q.waitForTimeout(1600);
  await q.evaluate(() => { const j = document.querySelector('.today-jump button[data-jump="t-sacred"]');
    if(j) j.click(); }); await q.waitForTimeout(900);
  await q.evaluate(() => document.querySelectorAll('.t-sec').forEach(d => { if(d.id !== 't-sacred') d.open = false; }));
  await q.waitForTimeout(500);
  for(const [view, label] of [['house','the house'], ['doing','what to do here']]){
    await q.evaluate(v => setSacredView(v), view); await q.waitForTimeout(1200);
    const fit = await q.evaluate(() => {
      const sec = document.querySelector('#t-sacred');
      const body = sec.querySelector('.stillness');
      const head = sec.querySelector('summary').getBoundingClientRect().height;
      return {sec: Math.round(head + body.scrollHeight), vh: innerHeight,
        hscroll: document.documentElement.scrollWidth - document.documentElement.clientWidth};
    });
    yes(`${label}: the section is shorter than the window`,
        fit.sec <= fit.vh, `${fit.sec}px in a ${fit.vh}px window`);
    is('  and nothing hangs off the side', fit.hscroll, 0);
  }
  /* the room is as big as the space allows rather than a thumbnail in it */
  await q.evaluate(() => setSacredView('house')); await q.waitForTimeout(1200);
  const room = await q.evaluate(() => { const n = document.querySelector('.sacred-stage .room-wrap');
    const r = n.getBoundingClientRect(); return {w: Math.round(r.width), h: Math.round(r.height)}; });
  yes('the room is drawn at the width it is given', room.w > 800, JSON.stringify(room));
  yes('  and no taller than the window has room for', room.h < 760, room.h + 'px');
  await short.close();

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke182  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
