/* smoke248 — habits you can say more in, habits that retire, a wider room,
   the Today index on a line of its own, and four periods for Repertoire.

   The claims.

   REPERTOIRE has four periods and only four: Baroque, Classical, Romantic,
   20th century. A piece that was called something the room no longer offers
   is moved to the nearest of the four, and what it was called before is kept
   beside it (periodWas), never thrown away.

   A HABIT'S BOXES are multi-line: in the form, "Why it matters" and every
   other text field is a textarea that grows as you write, and a new line
   typed in one is kept. In the habit's own panel every written field edits
   as a multi-line box too.

   TODAY: in Execution and in Looking inward the index to the page's sections
   sits on its own line, under the switch between the views.

   THE HABITS VIEW uses the page's width: inside Today the room is not held
   to 640px, the dashboard has several cards to a row, and the parts of the
   day sit side by side.

   RETIRING. A habit kept 21 days in a row is offered retirement, on its card
   and in its panel; one made today is not, even one being broken (which
   counts unrecorded days as clean). "Not yet" puts the offer away for three
   weeks. Retiring takes it off every daily list and count, puts it under
   "Yours now" with the run it took and what you wrote, keeps its history,
   and "track it again" brings it back with nothing lost.

   Run: NODE_PATH=node_modules node smoke248.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
const url = 'file://' + path.join(__dirname, 'index.html');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport: {width: 1440, height: 900}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto(url); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }
  await p.evaluate(() => document.querySelectorAll('.overlay,.modal-bg').forEach(n => n.remove()));

  console.log('\n1. Repertoire: four periods');
  const P = await p.evaluate(() => {
    const old = scoreDefaults({title: 'Reflets', composer: 'Debussy', period: 'impressionist'});
    const jazz = scoreDefaults({title: 'Blue Monk', composer: 'Monk', period: 'jazz'});
    const folk = scoreDefaults({title: 'A folk tune', period: 'traditional'});
    return {keys: SCORE_PERIODS.map(v => v[0]), names: SCORE_PERIODS.map(v => v[1]),
      old: [old.period, old.periodWas], jazz: [jazz.period, jazz.periodWas], folk: [folk.period, folk.periodWas],
      guess: [scorePeriodGuess('J. S. Bach'), scorePeriodGuess('Mozart'), scorePeriodGuess('Chopin'), scorePeriodGuess('Debussy'), scorePeriodGuess('Bill Evans')]};
  });
  is('the four, in the order they happened', P.names, ['Baroque', 'Classical', 'Romantic', '20th century']);
  is('an old "Impressionist" piece becomes 20th century, the old name kept beside it', P.old, ['twentieth', 'impressionist']);
  is('  so does jazz', P.jazz, ['twentieth', 'jazz']);
  is('  one with no place among the four is left unset, its old name kept', P.folk, [null, 'traditional']);
  is('the composer guess answers in the four', P.guess, ['baroque', 'classical', 'romantic', 'twentieth', 'twentieth']);

  console.log('\n2. a habit\'s boxes take as much as you have to say');
  await p.evaluate(() => { location.hash = '#/today/habits'; }); await wait(1200);
  await p.evaluate(() => openHabitModal()); await wait(400);
  const F = await p.evaluate(() => {
    const m = document.querySelector('.modal');
    const ids = ['hName', 'hIdentity', 'hWhy', 'hMin', 'hIdeal', 'hCue', 'hEnv', 'hPrompt'];
    return {tags: ids.map(id => (m.querySelector('#' + id) || {}).tagName || 'missing'),
      textInputs: [...m.querySelectorAll('input')].filter(i => !i.type || i.type === 'text').map(i => i.id)};
  });
  is('name, identity, why, both sizes, cue, set-up and prompt are all multi-line boxes', F.tags, Array(8).fill('TEXTAREA'));
  is('no single-line text field is left in the form', F.textInputs, []);
  const why = 'Because the day goes better.\nAnd because I said I would.';
  await p.fill('#hName', 'Walk at dusk'); await p.fill('#hWhy', why);
  const grown = await p.evaluate(() => { const t = document.querySelector('#hWhy'); return t.offsetHeight > 40; });
  yes('  the why box has grown to fit two lines', grown);
  await p.click('#hSave'); await wait(500);
  const saved = await p.evaluate(() => { const h = S.habits.find(x => x.name === 'Walk at dusk'); return h ? {why: h.why, created: !!h.createdAt} : null; });
  is('  the new line is kept, and the habit knows when it was made', saved, {why, created: true});
  await p.evaluate(() => openHabitPanel(S.habits.find(x => x.name === 'Walk at dusk').id)); await wait(500);
  const PN = await p.evaluate(() => {
    const pan = document.querySelector('.hb-panel');
    const multi = k => { const e = pan.querySelector(`[data-path$=".${k}"]`); return e ? e.dataset.multi : 'missing'; };
    return {name: pan.querySelector('#hpName').tagName, fields: ['identity', 'why', 'cue', 'environment', 'preRitual', 'postRitual', 'min', 'ideal', 'reward'].map(multi)};
  });
  is('in the panel the name is a growing box and every written field edits multi-line', PN, {name: 'TEXTAREA', fields: Array(9).fill('1')});
  await p.evaluate(() => { closePanel && closePanel(); });

  console.log('\n3. Today: the index on its own line');
  for(const v of ['do', 'in']){
    await p.evaluate(v => { location.hash = '#/today/' + v; }, v); await wait(1100);
    const L = await p.evaluate(() => { const sw = document.querySelector('.today-bar .today-switch'), j = document.querySelector('.today-bar .today-jump');
      if(!sw || !j) return null; const a = sw.getBoundingClientRect(), c = j.getBoundingClientRect(); return {below: c.top >= a.bottom - 1, left: Math.round(c.left - a.left)}; });
    yes(`${v === 'do' ? 'Execution' : 'Looking inward'}: the section index is on the line under the view switch`, L && L.below && Math.abs(L.left) < 4, L);
  }

  console.log('\n4. the Habits view uses the width');
  await p.evaluate(() => {
    const T = today();
    const mk = (name, neg, days, born) => { const h = habitDefaults(); h.name = name; h.negative = neg; h.createdAt = addDays(T, -born) + 'T08:00:00.000Z'; habDefaults(h); S.habits.push(h);
      for(let i = 0; i < days; i++){ const d = addDays(T, -i); S.habitLog[d] = S.habitLog[d] || {}; S.habitLog[d][h.id] = neg ? {status: 'resisted', level: 'ideal'} : {level: 'ideal', status: 'completed'}; } return h; };
    mk('Morning pages', false, 25, 30); mk('Piano, twenty minutes', false, 25, 30); mk('Read a chapter', false, 4, 30);
    mk('No phone after ten', true, 0, 0); mk('Stretch before bed', false, 10, 30);
    S._habView = 'dashboard'; planState().prefs.habitView = 'dashboard'; saveNow();
    location.hash = '#/today/tasks'; });
  await wait(600); await p.evaluate(() => { location.hash = '#/today/habits'; }); await wait(1300);
  const W = await p.evaluate(() => { const r = document.querySelector('.pl-habits-room'), g = document.querySelector('.hb-grid');
    const cols = g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0; return {w: r ? Math.round(r.getBoundingClientRect().width) : 0, cols}; });
  yes('the room is as wide as the page, not 640px', W.w > 1000, W);
  yes('  with at least three cards to a row', W.cols >= 3, W);
  await p.evaluate(() => habSetView('today')); await wait(700);
  const TD = await p.evaluate(() => { const c = document.querySelector('.hb-tcols'); return c ? {w: Math.round(c.getBoundingClientRect().width), cols: getComputedStyle(c).gridTemplateColumns.split(' ').length} : null; });
  yes('  and the parts of the day sit side by side', TD && TD.w > 1000 && TD.cols >= 3, TD);
  await p.evaluate(() => habSetView('dashboard')); await wait(700);

  console.log('\n5. retiring a habit');
  const R0 = await p.evaluate(() => {
    const by = n => S.habits.find(h => h.name === n);
    const offer = n => !!document.querySelector(`[data-hbcard="${by(n).id}"] [data-hbretire]`);
    return {ready: ['Morning pages', 'Piano, twenty minutes', 'Read a chapter', 'No phone after ten', 'Stretch before bed'].map(n => habRetireReady(by(n))),
      cardOffer: offer('Morning pages'), noOffer: offer('Read a chapter')};
  });
  is('offered at 21 days in a row, not at 4 or 10, and not to a habit being broken that was made today', R0.ready, [true, true, false, false, false]);
  yes('  the offer is on the card', R0.cardOffer && !R0.noOffer, R0);
  /* not yet */
  await p.click(`[data-hbretirelater="${await p.evaluate(() => S.habits.find(h => h.name === 'Piano, twenty minutes').id)}"]`); await wait(500);
  const NY = await p.evaluate(() => { const h = S.habits.find(x => x.name === 'Piano, twenty minutes'); const after = h.retireAskAfter, ready = habRetireReady(h); h.retireAskAfter = today(); const inThree = habRetireReady(h); h.retireAskAfter = after; return {after, ready, inThree}; });
  yes('"not yet" puts it away for three weeks, and it asks again after', !NY.ready && NY.inThree && NY.after === (await p.evaluate(() => addDays(today(), 21))), NY);
  /* retire through the panel */
  const hid = await p.evaluate(() => S.habits.find(h => h.name === 'Morning pages').id);
  await p.evaluate(id => openHabitPanel(id), hid); await wait(500);
  yes('the panel makes the same offer', await p.evaluate(() => !!document.querySelector('.hb-panel [data-hbretire]')));
  await p.click('.hb-panel [data-hbretire]'); await wait(400);
  await p.fill('#hrNote', 'I sit down with the notebook before I have thought about it.\nIt is simply the morning now.');
  await p.click('#hrGo'); await wait(700);
  const RT = await p.evaluate(id => { const h = S.habits.find(x => x.id === id);
    return {archived: h.archived, retired: !!h.retired, run: h.retired && h.retired.run, note: h.retired && h.retired.note.includes('\n'),
      due: habDueOn().some(x => x.id === id), listed: habList().some(x => x.id === id),
      logs: Object.values(S.habitLog).filter(l => l[id]).length,
      yours: !!document.querySelector(`.hb-yours [data-hbopen="${id}"]`), card: !!document.querySelector(`[data-hbcard="${id}"]`),
      archivedList: !!document.querySelector(`.hb-arch [data-hbrestore="${id}"]`)}; }, hid);
  yes('retired: off the daily lists and the dashboard', RT.archived && RT.retired && !RT.due && !RT.listed && !RT.card, RT);
  yes('  under "Yours now", with the run it took and what you wrote', RT.yours && RT.run >= 21 && RT.note, RT);
  yes('  its history is all still there, and it is not among the merely archived', RT.logs === 25 && !RT.archivedList, RT);
  /* a month later it asks: still yours? */
  const LOOK = await p.evaluate(id => { const h = S.habits.find(x => x.id === id); return [habRetiredDue(h), habRetiredDue(h, addDays(today(), 31))]; }, hid);
  is('a month on it asks whether it is still yours', LOOK, [false, true]);
  /* back */
  await p.click(`.hb-yours [data-hbunretire="${hid}"]`); await wait(600);
  const BK = await p.evaluate(id => { const h = S.habits.find(x => x.id === id);
    return {archived: h.archived, retired: h.retired, history: (h.retirements || []).length, back: !!(h.retirements || [])[0]?.back, listed: habList().some(x => x.id === id),
      logs: Object.values(S.habitLog).filter(l => l[id]).length}; }, hid);
  is('"track it again" brings it back with nothing lost, and remembers it was once retired', BK, {archived: false, retired: null, history: 1, back: true, listed: true, logs: 25});

  /* survives a reload */
  await p.evaluate(() => { const h = S.habits.find(x => x.name === 'Morning pages'); habRetire(h, 'again'); saveNow(); });
  await wait(600); await p.reload(); await p.waitForTimeout(1500);
  const RL = await p.evaluate(() => { const h = S.habits.find(x => x.name === 'Morning pages'); return {retired: !!(h && h.retired), note: h && h.retired && h.retired.note, n: (h.retirements || []).length}; });
  is('a retirement survives a reload', RL, {retired: true, note: 'again', n: 2});

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
