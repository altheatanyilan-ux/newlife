/* smoke272 — the morning card, and the veil before every practice.

   The claims.

   THE MORNING CARD COMES FIRST. On the first open of a day (a return, not a
   first-ever visit), before the bedtime and waking questions, one tarot card
   is offered: six questions to choose from and a line for your own. The
   question is held up under the full-screen veil while the cards are
   shuffled; then the card is turned, with what it says; keeping it files it
   with the readings (spread "morning", with the question). Only then is the
   sleep question asked. The same day, it does not come again; a first-ever
   visit does not get it; and it can be switched off, and on, in Settings.

   THE VEIL BEFORE EVERY PRACTICE. The charms before they are thrown, an
   oracle card before it is turned, and a sitting or a round of breathing
   before it starts all open on the same full-screen moment, with the
   question in it where one was written.

   Run: NODE_PATH=node_modules node smoke272.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1280, height: 900}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }

  console.log('\n1. a first-ever visit does not get it');
  const first = await p.evaluate(() => ({card: !!document.querySelector('#mcAsk'), marked: S.settings.morningCardOn === today()}));
  yes('no card on the first visit, and the day is marked', !first.card && first.marked, first);

  console.log('\n2. the next morning, the card comes first');
  await p.evaluate(async () => { closeModals(); const T = today();
    S.settings.lastSeenAt = Date.now() - 30 * 3600000; S.settings.morningCardOn = addDays(T, -1);
    S.settings.wakeAskedOn = addDays(T, -1); const c = checkin(T); delete c.wakeAt;
    await saveNow(); location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(1100);
  const ask = await p.evaluate(() => ({card: !!document.querySelector('#mcAsk:not([hidden])'), greet: !!document.querySelector('#mgBed'),
    qs: [...document.querySelectorAll('[data-mcq]')].map(n => n.textContent.trim())}));
  yes('the card is asked first', ask.card && !ask.greet, ask);
  is('  with six questions to choose from', ask.qs.length, 6);
  await p.click('[data-mcq="2"]');
  yes('  choosing one marks it', await p.evaluate(() => document.querySelector('[data-mcq="2"]').classList.contains('on')));
  await p.fill('#mcOwn', 'What am I not seeing about the move?');
  await p.click('#mcDraw'); await p.waitForTimeout(700);
  const veil = await p.evaluate(() => { const v = document.querySelector('.dv-veil'); return v ? {text: v.textContent.replace(/\s+/g, ' '),
    fixed: getComputedStyle(v).position === 'fixed'} : null; });
  yes('drawing opens the full-screen veil, holding your own question', veil && veil.fixed && /not seeing about the move/.test(veil.text), veil);
  await p.click('.dv-veil .dv-skip'); await p.waitForTimeout(1200);
  const shown = await p.evaluate(() => ({name: document.querySelector('.mc-name')?.textContent.trim(), up: !!document.querySelector('#mcOut .tc.up'),
    asked: document.querySelector('.mc-asked')?.textContent}));
  yes('then the card is turned, named, with the question above it', shown.name && shown.up && /not seeing about the move/.test(shown.asked || ''), shown);
  await p.fill('#mcText', 'slow down before deciding');
  await p.click('#mcKeep'); await p.waitForTimeout(900);
  const kept = await p.evaluate(() => { const e = S.entries.filter(x => x.type === 'divination').pop();
    return e && {spread: e.extra.divination.spread, q: e.extra.divination.question, body: e.body, cards: e.extra.divination.cards.length}; });
  is('keeping it files it with the readings', kept, {spread: 'morning', q: 'What am I not seeing about the move?', body: 'slow down before deciding', cards: 1});
  yes('  and only then comes the sleep question', await p.evaluate(() => !!document.querySelector('#mgBed')));
  await p.evaluate(() => closeModals());

  console.log('\n3. once a day');
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(900);
  yes('opening Today again the same day: no card', await p.evaluate(() => !document.querySelector('#mcAsk')));
  await p.evaluate(() => { S.settings.morningCardOn = addDays(today(), -1); S.settings.morningCardOff = true; rerender(); }); await p.waitForTimeout(900);
  yes('switched off, it does not come', await p.evaluate(() => !document.querySelector('#mcAsk')));
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForTimeout(900);
  const tog = await p.$('#sMorningCard');
  yes('  and Settings has the switch', !!tog);
  if(tog){ await tog.click(); await p.waitForTimeout(200); }
  yes('  which turns it back on', await p.evaluate(() => !S.settings.morningCardOff));
  await p.evaluate(() => { S.settings.morningCardOn = today(); closeModals(); });

  console.log('\n4. the veil before every practice');
  const veiled = async (label, open, press) => {
    await p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil').forEach(n => n.remove()); });
    await p.evaluate(open); await p.waitForTimeout(500);
    await press(); await p.waitForTimeout(600);
    const v = await p.evaluate(() => { const n = document.querySelector('.dv-veil'); return n ? {t: n.textContent.replace(/\s+/g, ' '), fixed: getComputedStyle(n).position === 'fixed'} : null; });
    yes(label, v && v.fixed, v);
    await p.evaluate(() => document.querySelectorAll('.dv-veil').forEach(n => n.remove()));
    return v;
  };
  const cc = await veiled('the charms, before they are thrown', () => openCharmCast(), async () => { await p.fill('#ccQ', 'Which way now?'); await p.click('#ccGo'); });
  yes('  with the question in it', cc && /Which way now\?/.test(cc.t), cc && cc.t);
  await veiled('an oracle card, before it is turned', () => openOracle(), async () => { await p.click('#orDraw'); });
  await veiled('a sitting, before the clock starts', () => { closeModals(); S.settings.todayView = 'in'; location.hash = '#/today'; rerender();
      setTimeout(() => { const d = document.getElementById('t-sacred'); if(d) d.open = true; if(typeof setSacredView === 'function') setSacredView('controls'); }, 400); },
    async () => { await p.waitForTimeout(900); await p.evaluate(() => { const b = document.querySelector('#stBegin'); b && b.scrollIntoView(); b && b.click(); }); });

  console.log('\n5. nothing broke on the way');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
