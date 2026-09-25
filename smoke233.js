/* smoke233 — Focus mode, on every page; and on Planning, the desk.

   WHAT IS CLAIMED. Every page has a focus mode — the ⛶ at the top, or Z —
   that takes it full screen with nothing else on the glass: no sidebar, no
   bar of tabs along the bottom of a phone, no top bar, no Back, no +, no
   corner clock, no time pill. Esc, the corner, or the browser leaving full
   screen brings it all back.

   On Planning (and on Today's execution half) focus mode is a desk instead of
   the page: the stopwatch, today's tasks and the Focus section. What you are
   doing in a sitting, what a pause is for and what a countdown's rest is for
   are each written in a box that takes as many lines as you give it, and
   every one of them is kept, line breaks and all. "the whole page" swaps back
   to the page itself, still in focus mode.

   Run: NODE_PATH=node_modules node smoke233.js */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const CHROME = ['.sidebar', '.topbar', '.back-btn', '.mobile-nav', '.fab-wrap', '#focusDock', '#timeDock'];
const shown = (p, sels) => p.evaluate(sels => sels.filter(s => { const n = document.querySelector(s);
  return n && getComputedStyle(n).display !== 'none' && !n.hidden; }), sels);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1400, height:900}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  /* the clock is moved on by hand, so a sitting of minutes takes a moment */
  await p.evaluate(() => { const real = Date.now.bind(Date); window._skew = 0; Date.now = () => real() + window._skew;
    S.settings.todayView = 'do'; saveNow(); location.hash = '#/values'; });
  await p.waitForTimeout(1200);

  console.log('\n1. any page');
  const T0 = await p.evaluate(() => { const n = document.querySelector('#btnFocusMode');
    return {there: !!n, title: n && n.title, inBar: !!(n && n.closest('.topbar'))}; });
  yes('the top bar has a ⛶ focus mode button, which says its key', T0.there && T0.inBar && /Focus mode/.test(T0.title) && /\(Z\)/.test(T0.title), T0);
  const before = await shown(p, CHROME);
  await p.click('#btnFocusMode'); await p.waitForTimeout(700);
  const F1 = await p.evaluate(() => ({on: document.documentElement.classList.contains('page-focus'),
    fs: !!document.fullscreenElement, page: !!document.querySelector('#main .page'), desk: !!document.querySelector('.pf-desk'),
    left: Math.round(document.querySelector('#main').getBoundingClientRect().left),
    exit: (document.querySelector('#pfExit') || {}).textContent || '', swap: !!document.querySelector('#pfSwap')}));
  yes('pressed on Values: focus mode, full screen, and the page is still the page', F1.on && F1.fs && F1.page && !F1.desk, F1);
  is('  nothing else on the glass — no sidebar, top bar, Back, +, clock or time pill', await shown(p, CHROME), []);
  yes('  (they were there before)', before.includes('.sidebar') && before.includes('.topbar'), before);
  yes('  the page takes the sidebar\'s width, and the corner says how to leave (no desk swap here)',
    F1.left === 0 && /leave focus mode/.test(F1.exit) && /Esc/.test(F1.exit) && !F1.swap, F1);
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  const F2 = await p.evaluate(() => ({on: document.documentElement.classList.contains('page-focus'), fs: !!document.fullscreenElement,
    exit: !!document.querySelector('#pfExit')}));
  yes('Esc brings everything back, and leaves full screen', !F2.on && !F2.fs && !F2.exit, F2);
  yes('  the sidebar and the top bar are back', (await shown(p, ['.sidebar', '.topbar'])).length === 2);
  await p.keyboard.press('z'); await p.waitForTimeout(500);
  const Z1 = await p.evaluate(() => document.documentElement.classList.contains('page-focus'));
  await p.keyboard.press('z'); await p.waitForTimeout(500);
  const Z2 = await p.evaluate(() => document.documentElement.classList.contains('page-focus'));
  yes('Z goes in and Z comes out', Z1 && !Z2, {Z1, Z2});
  await p.keyboard.press('z'); await p.waitForTimeout(500);
  await p.evaluate(() => document.exitFullscreen()); await p.waitForTimeout(600);
  yes('the browser leaving full screen by itself takes focus mode with it',
    await p.evaluate(() => !document.documentElement.classList.contains('page-focus')));

  console.log('\n2. the desk');
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1200);
  await p.click('#btnFocusMode'); await p.waitForTimeout(800);
  const D = await p.evaluate(() => ({desk: !!document.querySelector('.pf-desk'), planPage: !!document.querySelector('.pl-top'),
    clock: !!document.querySelector('#pfClock .fd-card #fpGo'), ring: Math.round((document.querySelector('#pfClock .fp-ring') || {getBoundingClientRect: () => ({width: 0})}).getBoundingClientRect().width),
    dockEmpty: !document.querySelector('#focusDock').children.length,
    tasks: [...document.querySelectorAll('#t-tasks [data-tcheck]')].length, want: tasksForDay(today()).length,
    focus: !!document.querySelector('.pf-focuscol #t-focus'), cols: getComputedStyle(document.querySelector('.pf-grid')).gridTemplateColumns.split(' ').length,
    swap: (document.querySelector('#pfSwap') || {}).textContent || ''}));
  yes('Planning in focus mode is the desk, not the page', D.desk && !D.planPage, D);
  yes('  the stopwatch, large, with the only start button (the corner clock is empty)', D.clock && D.ring >= 220 && D.dockEmpty, D);
  yes('  today\'s tasks, all of them, and the Focus section — three columns', D.tasks === D.want && D.tasks > 0 && D.focus && D.cols === 3, D);
  yes('  and a way to the whole page', /the whole page/.test(D.swap), D.swap);

  console.log('\n3. a sitting, in as many lines as it takes');
  await p.click('#pfClock #fpGo'); await p.waitForTimeout(700);
  const W = await p.evaluate(() => { const t = document.querySelector('#fpDid');
    return {tag: t && t.tagName, running: FocusTimer.state().running, ph: t && t.placeholder}; });
  yes('start on the desk\'s clock: it runs, and "what are you actually doing?" is a box of lines, not a line', W.running && W.tag === 'TEXTAREA', W);
  const said = 'the second draft\n- the opening paragraph\n- the tricky transition';
  await p.fill('#fpDid', said); await p.waitForTimeout(500);
  const H = await p.evaluate(() => { const t = document.querySelector('#fpDid'); return {h: t.getBoundingClientRect().height, sh: t.scrollHeight}; });
  yes('  it grows to show everything written in it', H.h >= H.sh - 2 && H.h > 70, H);
  await p.evaluate(() => { window._skew += 3 * 60000; });
  await p.click('#pfClock #fpGo'); await p.waitForTimeout(700);
  const B = await p.evaluate(() => ({tag: (document.querySelector('#fpBreakNote') || {}).tagName, onBreak: FocusTimer.state().onBreak,
    hint: (document.querySelector('.fd-deskhint') || {}).textContent || ''}));
  yes('pause: "what is this break for?" is a box of lines too', B.onBreak && B.tag === 'TEXTAREA' && /break/.test(B.hint), B);
  const why = 'the phone rang\nthen tea';
  await p.fill('#fpBreakNote', why); await p.waitForTimeout(500);
  await p.click('#pfClock #fpGo'); await p.waitForTimeout(500);
  await p.evaluate(() => { window._skew += 2 * 60000; });
  await p.click('#pfClock #fpStop'); await p.waitForTimeout(700);
  const R = await p.evaluate(() => { const s = focusSessions().slice(-1)[0] || {};
    const row = [...document.querySelectorAll('.fl-row')].pop();
    return {note: s.note, br: (s.breaks || []).map(x => x.note), dur: s.duration,
      shown: row ? row.querySelector('.fl-did').innerText : '', ws: row ? getComputedStyle(row.querySelector('.fl-did')).whiteSpace : ''}; });
  is('finished: the sitting keeps every line of what it was', R.note, said);
  is('  and the break keeps every line of what it was for', R.br, [why]);
  yes('  the day\'s record on the desk shows them as lines', R.shown === said && R.ws === 'pre-wrap', R);

  console.log('\n4. a rest between rounds');
  await p.evaluate(() => { FocusTimer.reset(); FocusTimer.setMode('countdown'); FocusTimer.setLength(25); FocusTimer.start(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { window._skew += 26 * 60000; }); await p.waitForTimeout(1600);
  const Rst = await p.evaluate(() => ({phase: FocusTimer.state().phase, tag: (document.querySelector('#fpRest') || {}).tagName,
    did: !!document.querySelector('#fpDid')}));
  yes('a countdown done, a rest begins: it asks what the rest is for, in a box of lines', Rst.phase !== 'focus' && Rst.tag === 'TEXTAREA' && !Rst.did, Rst);
  await p.fill('#fpRest', 'a walk round the block\nno phone'); await p.waitForTimeout(500);
  await p.evaluate(() => { document.activeElement.blur(); FocusTimer.stop(); }); await p.waitForTimeout(500);
  const RR = await p.evaluate(() => { const s = focusSessions().slice(-1)[0] || {};
    return {rests: (s.breaks || []).filter(x => x.rest).map(x => [x.rest, x.note]),
      shown: [...document.querySelectorAll('.fl-breaks li')].map(li => li.innerText.replace(/\s+/g, ' ')).find(t => /rest/.test(t)) || ''}; });
  is('  the rest is kept on the sitting it followed, every line of it', RR.rests, [['short', 'a walk round the block\nno phone']]);
  yes('  and the record says it was a rest', /rest/.test(RR.shown) && /a walk round the block/.test(RR.shown), RR.shown);
  await p.evaluate(() => { FocusTimer.reset(); FocusTimer.setMode('stopwatch'); });

  console.log('\n5. the list on the desk');
  const first = await p.evaluate(() => { const r = tasksForDay(today()).find(x => !x.done); return r && {id: r.id, text: r.text}; });
  await p.click(`#t-tasks [data-test="${first.id}"]`); await p.waitForTimeout(800);
  const E = await p.evaluate(() => ({on: (document.querySelector('#t-focus .tf-on b') || {}).textContent || '', running: FocusTimer.state().running,
    task: FocusTimer.state().taskId}));
  yes('a task\'s time pressed in the list sits down with it: the Focus section names it and the clock runs',
    E.running && E.task === first.id && E.on === first.text, E);
  await p.click(`#t-tasks [data-tcheck="${first.id}"]`); await p.waitForTimeout(900);
  const K = await p.evaluate(id => ({done: findTaskRef(id).done, idle: FocusTimer.state().idle,
    said: document.querySelector('#t-tasks .pf-sh .mono').textContent, desk: !!document.querySelector('.pf-desk')}), first.id);
  yes('ticked off in the list: done, the sitting ends, the count moves, and the desk stays', K.done && K.idle && /^1 of/.test(K.said) && K.desk, K);

  console.log('\n6. the whole page, and Today');
  await p.click('#pfSwap'); await p.waitForTimeout(800);
  const P1 = await p.evaluate(() => ({plan: !!document.querySelector('.pl-top'), desk: !!document.querySelector('.pf-desk'),
    on: document.documentElement.classList.contains('page-focus'), swap: document.querySelector('#pfSwap').textContent,
    side: getComputedStyle(document.querySelector('.sidebar')).display}));
  yes('"the whole page": Planning itself, still in focus mode, still no sidebar', P1.plan && !P1.desk && P1.on && P1.side === 'none' && /just the work/.test(P1.swap), P1);
  await p.click('#pfSwap'); await p.waitForTimeout(700);
  yes('  "just the work" brings the desk back', await p.evaluate(() => !!document.querySelector('.pf-desk')));
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1200);
  const T1 = await p.evaluate(() => ({desk: !!document.querySelector('.pf-desk'), on: document.documentElement.classList.contains('page-focus')}));
  yes('Today\'s execution half in focus mode is the same desk', T1.desk && T1.on, T1);
  await p.evaluate(() => { setTodayView('in'); }); await p.waitForTimeout(800);
  const T2 = await p.evaluate(() => ({desk: !!document.querySelector('.pf-desk'), today: !!document.querySelector('.today-page'), swap: !!document.querySelector('#pfSwap')}));
  yes('  looking inward, it is Today itself, full screen', !T2.desk && T2.today && !T2.swap, T2);
  await p.evaluate(() => { setTodayView('do'); }); await p.waitForTimeout(600);
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  const L = await p.evaluate(() => ({on: document.documentElement.classList.contains('page-focus'), today: !!document.querySelector('.today-page'),
    dock: document.querySelector('#focusDock').children.length, desk: !!document.querySelector('.pf-desk')}));
  yes('leaving: Today is Today again and the clock is back in its corner', !L.on && L.today && !L.desk && L.dock > 0, L);

  console.log('\n7. on a phone');
  await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(600);
  const PB = await p.evaluate(() => { const r = document.querySelector('#btnFocusMode').getBoundingClientRect(), t = document.querySelector('.topbar').getBoundingClientRect();
    return {vis: r.width > 0, left: Math.round(t.left), right: Math.round(t.right)}; });
  yes('the ⛶ fits in the phone\'s top bar', PB.vis && PB.left >= 0 && PB.right <= 390, PB);
  await p.click('#btnFocusMode'); await p.waitForTimeout(800);
  const PH = await p.evaluate(() => ({over: document.documentElement.scrollWidth - innerWidth, desk: !!document.querySelector('.pf-desk'),
    nav: getComputedStyle(document.querySelector('.mobile-nav')).display, cols: getComputedStyle(document.querySelector('.pf-grid')).gridTemplateColumns.split(' ').length,
    card: Math.round(document.querySelector('#pfClock .fd-card').getBoundingClientRect().width)}));
  yes('in focus mode the tabs along the bottom go, and the desk is one column that fits', PH.desk && PH.nav === 'none' && PH.over <= 1 && PH.cols === 1 && PH.card > 300, PH);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  yes('  and come back after', await p.evaluate(() => getComputedStyle(document.querySelector('.mobile-nav')).display !== 'none'));

  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
