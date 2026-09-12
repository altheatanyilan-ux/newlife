/* smoke138 — the sleep chart: a bedtime you forgot is guessed, said to be a
   guess, and can be corrected on the chart itself */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1400, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const compass = async () => { await p.evaluate(() => { if(location.hash === '#/compass') rerender(); else location.hash = '#/compass'; });
    await p.waitForTimeout(1600); await p.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove())); };

  console.log('\n1. the house notes when you were last in it');
  await p.evaluate(() => { const r = rhythmDay(today()); delete r.lastSeenAt; touchPresence(); });
  const seen = await p.evaluate(() => rhythmDay(today()).lastSeenAt);
  yes('a time is stamped on today', /^\d{2}:\d{2}$/.test(seen || ''), String(seen));
  is('  and it is now', seen, await p.evaluate(() => nowHM()));

  console.log('\n1b. but it never writes a waking time on your behalf');
  await p.evaluate(() => { const T = today(); delete checkin(T).wakeAt;
    const r = rhythmDay(T); r.wakeTime = ''; rhythmCompute(r); saveNow();
    location.hash = '#/today'; rerender(); });
  await p.waitForTimeout(1400);
  is('opening Today leaves the check-in empty', await p.evaluate(() => checkin(today()).wakeAt || ''), '');
  is('  and the rhythm empty', await p.evaluate(() => rhythmDay(today()).wakeTime || ''), '');
  is('  the line says nothing yet', await p.evaluate(() => document.querySelector('#wokeAt')?.textContent.trim()), '—');
  /* and pressing it is still how you say */
  await p.evaluate(() => { document.querySelector('#wokeAt').click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelector('#clkV').value = '07:05'; document.querySelector('#clkOk').click(); });
  await p.waitForTimeout(1200);
  is('answering it writes the time', await p.evaluate(() => rhythmDay(today()).wakeTime), '07:05');
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1200);
  is('  and a redraw keeps it', await p.evaluate(() => rhythmDay(today()).wakeTime), '07:05');

  console.log('\n2. it is never read as a bedtime while the day is still running');
  const now = await p.evaluate(() => { const r = rhythmDay(today()); r.sleepTime = ''; return rhythmSleep(today()); });
  is('today has no sleeping time from it', now.hm, '');
  is('  and is not marked as a guess', now.inferred, false);

  console.log('\n3. a day that is over falls back to it, marked as a guess');
  const D = await p.evaluate(() => addDays(today(), -2));
  const g = await p.evaluate(d => { const r = rhythmDay(d); r.wakeTime = '07:30'; r.sleepTime = ''; r.lastSeenAt = '23:41';
    rhythmCompute(r); saveNow(); return rhythmSleep(d); }, D);
  is('the last time you were here becomes the bedtime', g.hm, '23:41');
  is('  and it says it is assumed', g.inferred, true);
  const row = await p.evaluate(d => weekShapeRow(d), D);
  yes('  the chart plots it', row.close != null && Math.abs(row.close - 23.683) < .02, JSON.stringify(row.close));
  is('  and remembers it is a guess', row.guessedClose, true);
  /* a day that is over with nothing at all stays honestly empty */
  const none = await p.evaluate(d => { const r = rhythmDay(d); r.sleepTime = ''; delete r.lastSeenAt; return rhythmSleep(d); },
    await p.evaluate(() => addDays(today(), -3)));
  is('a day with nothing recorded still has nothing', none.hm, '');

  console.log('\n4. the chart shows the difference');
  await compass();
  yes('the guessed dot is drawn hollow, the logged ones solid',
      await p.evaluate(() => document.querySelectorAll('.wk-svg circle[stroke-dasharray]').length === 1));
  yes('  the legend says what that means',
      await p.evaluate(() => /assumed from the last time you were here/.test(document.querySelector('.wk-legend')?.textContent || '')));
  yes('  and the readout for that day calls it assumed',
      await p.evaluate(d => /assumed/.test(document.querySelector(`[data-wksay="${d}"]`)?.textContent || ''), D));
  yes('  while a day with no reading says so plainly',
      await p.evaluate(d => /no sleeping time/.test(document.querySelector(`[data-wksay="${d}"]`)?.textContent || ''),
        await p.evaluate(() => addDays(today(), -3))));

  console.log('\n5. any day can be set from the chart');
  yes('a column is a button', await p.evaluate(d =>
    document.querySelector(`[data-wkday="${d}"]`)?.getAttribute('role') === 'button', D));
  await p.evaluate(d => document.querySelector(`[data-wkday="${d}"]`).dispatchEvent(new MouseEvent('click', {bubbles:true})), D);
  await p.waitForTimeout(600);
  const dlg = await p.evaluate(() => ({open: !!document.querySelector('#deWake'),
    wake: document.querySelector('#deWake')?.value, sleep: document.querySelector('#deSleep')?.value,
    warned: /assumed/.test(document.querySelector('#modals')?.textContent || '')}));
  yes('pressing it opens that day', dlg.open);
  is('  filled in with what is known', dlg.wake, '07:30');
  is('  and with the guess offered as a starting point', dlg.sleep, '23:41');
  yes('  which is labelled as a guess', dlg.warned);
  await p.evaluate(() => { document.querySelector('#deSleep').value = '22:15'; document.querySelector('#deOk').click(); });
  await p.waitForTimeout(1200);
  const after = await p.evaluate(d => ({stored: rhythmDay(d).sleepTime, guess: weekShapeRow(d).guessedClose}), D);
  is('saving writes it as a real bedtime', after.stored, '22:15');
  is('  no longer a guess', after.guess, false);
  yes('  and the chart no longer draws it hollow',
      await p.evaluate(() => document.querySelectorAll('.wk-svg circle[stroke-dasharray]').length === 0));

  console.log('\n6. and it can be cleared again');
  await p.evaluate(d => document.querySelector(`[data-wkday="${d}"]`).dispatchEvent(new MouseEvent('click', {bubbles:true})), D);
  await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('#deClear').click());
  await p.waitForTimeout(1000);
  is('both ends go', await p.evaluate(d => rhythmDay(d).wakeTime + '|' + rhythmDay(d).sleepTime, D), '|');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke138  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
