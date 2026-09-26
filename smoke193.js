/* smoke193 — the small stopwatch (and, until the Study Deck was rebuilt,
   the two decks that came out and a deck you can ask an AI for — those
   halves are in smokes-retired/smoke193-decks.js).

   Three deliveries in one sitting, and what they have in common is that all
   three are subtraction or its opposite: less furniture standing around doing
   nothing, fewer places keeping the same fact twice, and one new way in that
   removes the only real cost of a spaced-repetition deck — typing the cards.

   THE CLOCK, IDLE, IS A DIAL. The gadget used to take its shape from the
   sidebar alone: sidebar open, clock open. So a panel with two idle buttons on
   it sat in the corner of every page all day announcing that nothing was
   running, which is a lot of furniture for a fact nobody asked for. Now the
   shape follows the work: it opens for a sitting, and for a press, and a press
   is a peek that ends when you fold it away or when the sitting does.

   THE TWO PIANO DECKS. The Piano Studio kept its own record of a piece and a
   concept, so a second copy of both living in a flashcard queue was the same
   thing written down in two places — and two records of one fact is one record
   and one lie waiting to happen. They go. (The studio itself went shortly
   afterwards.) What was filed in them does not: the decks are removed and the
   cards move to the first deck, because retiring a room is not a reason to
   burn what was in it.

   A DECK FROM ANYWHERE. A model will write two hundred cards on Ottoman tax
   law at two in the morning; the cost has always been typing them in. So the
   deck has a written format, the room hands you the prompt that asks for it,
   and the import is forgiving about everything except the two things it cannot
   guess — a card with no front, and a gap-fill with no gap. Those it names and
   leaves out, because a wrong card in the deck is worse than one that never
   arrived. Nothing is written until you have seen what it found. */
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
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  /* what the gadget is showing, and what the sidebar is doing under it */
  const dock = () => p.evaluate(() => {
    const d = document.getElementById('focusDock');
    return {bubble: !!d.querySelector('.fd-bubble'), card: !!d.querySelector('.fd-card'),
      fold: !!d.querySelector('#fpFold'), stop: !!d.querySelector('#fpStop'),
      narrow: document.documentElement.classList.contains('sb-collapsed')};
  });

  console.log('\n1. with nothing running the clock is a dial, whatever the sidebar is doing');
  await p.evaluate(() => { document.documentElement.classList.remove('sb-collapsed');
    S._fdPeek = false; FocusTimer.stop(); paintFocusDock(true); });
  await p.waitForTimeout(600);
  const idleWide = await dock();
  yes('the sidebar is at its full width', !idleWide.narrow);
  yes('  and the clock is still only the dial', idleWide.bubble && !idleWide.card, JSON.stringify(idleWide));

  console.log('\n2. it opens for a sitting, and closes again when the sitting ends');
  await p.evaluate(() => { FocusTimer.start(); paintFocusDock(true); }); await p.waitForTimeout(600);
  const running = await dock();
  yes('a sitting opens it', running.card && !running.bubble, JSON.stringify(running));
  yes('  with the button that ends the sitting on it', running.stop);
  yes('  the sidebar was not narrowed to do it', !running.narrow);
  await p.evaluate(() => { FocusTimer.stop(); paintFocusDock(true); }); await p.waitForTimeout(600);
  const after = await dock();
  yes('ending it folds the clock away again', after.bubble && !after.card, JSON.stringify(after));
  /* A task parked on the clock is the clock in use, even before the sitting
     starts: it is holding something you put there deliberately, and the name
     on it is the way back to that task. Finishing empties it of both, so no
     parked task is left behind to keep the panel standing open. */
  const parked = await p.evaluate(() => {
    const t = {id: uid(), text:'s193 the one being timed', day: today(), done:false, doneAt:null,
      notes:'', order:0, createdAt:new Date().toISOString(), links:{projects:[], skills:[]}};
    planTaskDefaults(t); S.tasks.push(t); saveNow();
    FocusTimer.setTask(t.id); paintFocusDock(true);
    const held = {card: !!document.querySelector('.fd-card'),
      name: (document.querySelector('.fd-onname') || {}).textContent,
      jump: !!document.querySelector('[data-fdjump]'), idle: FocusTimer.state().idle};
    FocusTimer.stop(); paintFocusDock(true);
    return {held, after: {bubble: !!document.querySelector('.fd-bubble'), task: FocusTimer.state().taskId}};
  });
  yes('a task parked on it opens it, although nothing is running yet',
    parked.held.card && parked.held.idle, JSON.stringify(parked.held));
  is('  and it says which task', parked.held.name, 's193 the one being timed');
  yes('  with the name as the way back to it', parked.held.jump);
  is('finishing empties it of the task as well as the sitting',
    [parked.after.bubble, parked.after.task], [true, null]);

  console.log('\n3. a press is a peek, and the peek ends when you fold it');
  await p.evaluate(() => document.querySelector('#fdOpen').click()); await p.waitForTimeout(600);
  const peek = await p.evaluate(() => ({open: !!document.querySelector('.fd-card'),
    fold: !!document.querySelector('#fpFold'), peek: !!S._fdPeek}));
  yes('pressing the dial opens it although nothing is running', peek.open, JSON.stringify(peek));
  yes('  and it knows it is only peeking', peek.peek);
  yes('  the button on it folds rather than finishes', peek.fold);
  await p.evaluate(() => document.querySelector('#fpFold').click()); await p.waitForTimeout(600);
  const folded = await dock();
  yes('folding it away leaves the dial', folded.bubble && !folded.card, JSON.stringify(folded));
  /* and a peek does not survive the sitting it was opened over: finishing one
     is a moment you want the sidebar back, not a panel left standing open */
  const survives = await p.evaluate(() => {
    S._fdPeek = true; FocusTimer.start(); paintFocusDock(true);
    FocusTimer.stop(); paintFocusDock(true);
    return {peek: !!S._fdPeek, card: !!document.querySelector('.fd-card')};
  });
  is('a peek does not outlive the sitting', [survives.peek, survives.card], [false, false]);

  console.log('\n4. narrowed, it is the dial and nothing else');
  await p.evaluate(() => { document.documentElement.classList.add('sb-collapsed');
    FocusTimer.start(); paintFocusDock(true); }); await p.waitForTimeout(600);
  const narrow = await dock();
  yes('even with a sitting under way', narrow.bubble && !narrow.card, JSON.stringify(narrow));
  await p.evaluate(() => { FocusTimer.stop(); document.documentElement.classList.remove('sb-collapsed');
    S._fdPeek = false; paintFocusDock(true); });

  /* Sections 5–10 (the two piano decks, and a deck written by an AI in the
     old deck's format) tested the Study Deck before its Anki-compatible
     rebuild; they are kept in smokes-retired/smoke193-decks.js, and the
     rebuilt deck — its migration, and .apkg both ways — is smoke240's. */

  console.log('\n11. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
