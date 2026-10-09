/* smoke276 — a sitting written down afterwards starts where the last one ended.

   The claims.

   "+ a sitting" opens with "from" already set to the time that day's last
   finished sitting ended, and says so underneath ("picks up where … ended").
   A clock still running has not ended, so it is not what is picked up from.
   Change the day and "from" follows that day's last sitting (or empties, on a
   day with none) — until "from" is set by hand, which then stays. Saving
   with just a length starts at the suggested time, so the next "+ a sitting"
   picks up after that one. Correcting an existing sitting keeps its own
   times.

   Run: NODE_PATH=node_modules node smoke276.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil').forEach(n => n.remove()); });

  /* a clean clock: today two sittings, yesterday one late, and one running */
  const days = await p.evaluate(() => {
    const T = today(), Y = addDays(T, -1), E = addDays(T, -9);
    S.timeEntries.splice(0);
    logTime({what: 'Morning pages', startTime: timeAtOn(T, '09:00'), endTime: timeAtOn(T, '10:30')});
    logTime({what: 'Read the Jazz Piano Book', startTime: timeAtOn(T, '13:00'), endTime: timeAtOn(T, '14:15')});
    logTime({what: 'Late scales', startTime: timeAtOn(Y, '21:10'), endTime: timeAtOn(Y, '22:00')});
    /* recorded in the wrong order, to be sure it is the latest end and not the last written */
    logTime({what: 'Early walk', startTime: timeAtOn(T, '07:00'), endTime: timeAtOn(T, '08:00')});
    saveNow();
    return {T, Y, E};
  });
  const form = () => p.evaluate(() => ({from: document.querySelector('#teFrom')?.value,
    note: document.querySelector('#teAfter')?.hidden ? '' : (document.querySelector('#teAfter')?.textContent || '').trim()}));
  const setDay = d => p.evaluate(d => { const x = document.querySelector('#teDay'); x.value = d; x.dispatchEvent(new Event('change', {bubbles: true})); }, d);

  console.log('\n1. it starts where the last sitting ended');
  await p.evaluate(() => { S.settings.todayView = 'time'; location.hash = '#/today/time'; }); await p.waitForTimeout(1200);
  const btn = await p.$('#tmAdd');
  yes('the Time tracking view has "+ a sitting"', !!btn);
  if(btn){ await btn.click(); } else await p.evaluate(() => openTimeEntryModal(null, today()));
  await p.waitForTimeout(400);
  let f = await form();
  is('"from" is set to when the last sitting ended', f.from, '14:15');
  yes('  and it says whose end it picked up', /picks up where “Read the Jazz Piano Book” ended/.test(f.note), f.note);

  console.log('\n2. it follows the day');
  await setDay(days.Y); await p.waitForTimeout(150);
  f = await form();
  is('yesterday: where yesterday\'s last sitting ended', f.from, '22:00');
  yes('  and says so', /Late scales/.test(f.note), f.note);
  await setDay(days.E); await p.waitForTimeout(150);
  f = await form();
  is('a day with nothing on it: "from" is left empty', f.from, '');
  is('  and nothing is said', f.note, '');
  await setDay(days.T); await p.waitForTimeout(150);
  is('back to today: picked up again', (await form()).from, '14:15');
  await p.evaluate(() => { const x = document.querySelector('#teFrom'); x.value = '15:30'; x.dispatchEvent(new Event('input', {bubbles: true})); });
  await setDay(days.Y); await p.waitForTimeout(150);
  f = await form();
  is('set by hand, "from" stays where it was put', f.from, '15:30');
  is('  and the line about where it came from goes', f.note, '');
  await p.evaluate(() => closeModals());

  console.log('\n3. saving with just a length starts at the suggestion');
  await p.evaluate(() => openTimeEntryModal(null, today())); await p.waitForTimeout(300);
  await p.fill('#teWhat', 'Transcribe the solo');
  await p.fill('#teMins', '30');
  await p.click('#teSave'); await p.waitForTimeout(500);
  const made = await p.evaluate(() => { const x = S.timeEntries.find(e => e.what === 'Transcribe the solo');
    return x && {from: timeClockOf(x.startTime), to: timeClockOf(x.endTime), day: timeDayOf(x.startTime)}; });
  yes('the new sitting runs 14:15–14:45 today', made && made.from === '14:15' && made.to === '14:45' && made.day === days.T, made);
  await p.evaluate(() => openTimeEntryModal(null, today())); await p.waitForTimeout(300);
  f = await form();
  is('the next one picks up after it', f.from, '14:45');
  yes('  naming it', /Transcribe the solo/.test(f.note), f.note);
  await p.evaluate(() => closeModals());

  console.log('\n4. a running clock has not ended anywhere');
  await p.evaluate(() => { const T = today();
    const r = logTime({what: 'Still going', startTime: new Date(Date.now() - 5 * 60000).toISOString(), endTime: null, minutes: 0});
    if(!r) S.timeEntries.push({id: uid(), what: 'Still going', startTime: new Date(Date.now() - 5 * 60000).toISOString(), endTime: null, tags: [], source: 'timer'});
    saveNow(); });
  await p.evaluate(() => openTimeEntryModal(null, today())); await p.waitForTimeout(300);
  is('the suggestion is still the last one that ended', (await form()).from, '14:45');
  await p.evaluate(() => closeModals());

  console.log('\n5. correcting a sitting keeps its own times');
  await p.evaluate(() => openTimeEntryModal(S.timeEntries.find(e => e.what === 'Morning pages').id)); await p.waitForTimeout(300);
  f = await p.evaluate(() => ({from: document.querySelector('#teFrom').value, note: !!document.querySelector('#teAfter')}));
  yes('an existing sitting shows its own start, with no suggestion', f.from === '09:00' && !f.note, f);
  await p.evaluate(() => closeModals());

  console.log('\n5b. the first sitting of a day starts at waking');
  await p.evaluate(d => {
    S.dailyRhythm = S.dailyRhythm || {};
    S.dailyRhythm[d.E] = Object.assign(S.dailyRhythm[d.E] || {}, {wakeTime: '06:45'});
    S.dailyRhythm[d.Y] = Object.assign(S.dailyRhythm[d.Y] || {}, {wakeTime: '07:30'});
    saveNow();
  }, days);
  await p.evaluate(d => openTimeEntryModal(null, d.E), days); await p.waitForTimeout(300);
  f = await form();
  is('nothing tracked that day: "from" is the wake time', f.from, '06:45');
  yes('  and it says it came from waking', /starts from when you woke up at 06:45/.test(f.note), f.note);
  await p.evaluate(() => closeModals());
  await p.evaluate(d => openTimeEntryModal(null, d.Y), days); await p.waitForTimeout(300);
  is('a sitting after waking beats the wake time', (await form()).from, '22:00');
  await p.evaluate(() => closeModals());
  await p.evaluate(d => { logTime({what: 'Night work', startTime: new Date(d.E + 'T00:10:00').toISOString(), endTime: new Date(d.E + 'T00:50:00').toISOString()}); saveNow(); }, days);
  await p.evaluate(d => openTimeEntryModal(null, d.E), days); await p.waitForTimeout(300);
  is('a sitting that ended before waking does not count as the last one', (await form()).from, '06:45');
  await p.fill('#teWhat', 'Stretch'); await p.fill('#teMins', '20');
  await p.click('#teSave'); await p.waitForTimeout(500);
  const woke = await p.evaluate(() => { const x = S.timeEntries.find(e => e.what === 'Stretch');
    return x && {from: timeClockOf(x.startTime), to: timeClockOf(x.endTime)}; });
  yes('saving just a length starts at waking: 06:45–07:05', woke && woke.from === '06:45' && woke.to === '07:05', woke);
  await p.evaluate(d => openTimeEntryModal(null, d.E), days); await p.waitForTimeout(300);
  is('then the next one picks up after it', (await form()).from, '07:05');
  await p.evaluate(() => closeModals());

  console.log('\n6. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
