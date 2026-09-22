/* smoke219 — P0.11 is called a randomizer and had nothing to press.

   Every exercise in this room is twelve exercises, and the way you choose
   which of the twelve is by pressing one of twelve buttons — which means you
   press the one you feel like, which means you practise four of them. That
   is the thing the books are most insistent about and the thing a key picker
   quietly works against: "practise ii-V-I in random key sequences, not the
   cycle of fifths, so your hands are not relying on motor memory".

   P0.11 is the sharp end of it. It is called "Interval Flashcard
   (Randomizer)"; its own text says to randomise the key AND the interval;
   and the page offered twelve keys, twelve distances and no dice at all. A
   flashcard you deal yourself is not a flashcard.

   So there is a die on every exercise, and on the randomiser it throws both.

   WHAT IS CLAIMED. That it is there; that it says what it deals; that it
   never deals the hand already on the screen, which is the tell that a
   randomiser is broken; that both pickers follow it and the notation is
   redrawn; and that an exercise which was never asked for a distance is
   still not asked for one.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. P0.11 says it is a randomiser, and now it is one');
  await p.evaluate(() => { location.hash = '#/jazz/P0.11'; }); await p.waitForTimeout(2400);
  yes('there is something to press', !!(await p.$('#jzDice')));
  is('  and it says what it deals', await p.evaluate(() =>
    document.querySelector('#jzDice').textContent.trim()), '🎲 deal one');
  const deals = [];
  for(let i = 0; i < 10; i++){
    await p.click('#jzDice'); await p.waitForTimeout(500);
    deals.push(await p.evaluate(() => {
      const ui = jazzUi();
      return {key: ui.key, iv: ui.interval,
        keyOn: document.querySelector('[data-jzkey].on')?.dataset.jzkey,
        ivOn: document.querySelector('[data-jzint].on')?.dataset.jzint,
        drawn: !!document.querySelector('#jzScore svg')};
    }));
  }
  yes('ten presses, ten different hands', new Set(deals.map(d => d.key + '/' + d.iv)).size >= 9,
      JSON.stringify(deals.map(d => d.key + '/' + d.iv)));
  yes('  never the one already on the screen',
      deals.every((d, i) => i === 0 || d.key !== deals[i - 1].key || d.iv !== deals[i - 1].iv));
  /* Ten presses is ten chances to notice, and one in a hundred and forty-four
     is not a chance. The rule itself is asked four hundred times instead. */
  is('  asked four hundred times, it never once repeats itself', await p.evaluate(() => {
    let same = 0;
    for(let i = 0; i < 400; i++){
      if(jazzPickOther(JAZZ_KEY_NAMES, 'C') === 'C') same++;
      if(jazzPickOther(JAZZ_INTERVALS, 'tritone') === 'tritone') same++;
    }
    return same; }), 0);
  is('  and asked for something else when there is nothing else, it says the one',
     await p.evaluate(() => jazzPickOther(['C'], 'C')), 'C');
  yes('  the pickers follow it', deals.every(d => d.keyOn === d.key && d.ivOn === d.iv));
  yes('  and the notation is redrawn each time', deals.every(d => d.drawn));
  yes('  over ten deals it reaches most of the twelve keys',
      new Set(deals.map(d => d.key)).size >= 6, String(new Set(deals.map(d => d.key)).size));

  console.log('\n2. everything else gets a key and keeps its subject');
  await p.evaluate(() => { location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(2400);
  is('the button offers a key', await p.evaluate(() =>
    document.querySelector('#jzDice').textContent.trim()), '🎲 random key');
  const plain = await p.evaluate(() => jazzUi().key);
  await p.click('#jzDice'); await p.waitForTimeout(900);
  const after = await p.evaluate(() => ({key: jazzUi().key, on: document.querySelector('[data-jzkey].on')?.dataset.jzkey,
    drawn: !!document.querySelector('#jzScore svg'), noIntervals: !document.querySelector('[data-jzint]')}));
  yes('  and changes it', after.key !== plain, `${plain} → ${after.key}`);
  yes('  the picker follows, the score is redrawn', after.on === after.key && after.drawn);
  yes('  and it was never asked for a distance', after.noIntervals);

  console.log('\n— errors —');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
