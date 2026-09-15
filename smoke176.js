/* smoke176 — the one thing you cannot log while it is happening.

   Both ends of a day are set on the Today page, and the Today page only ever
   asks about today. Which works for the waking end and cannot work for the
   other one: at the moment you go to sleep you are asleep. By the morning the
   question has moved onto yesterday's page, and yesterday's page is not where
   anybody is standing — so the night just kept its "no sleeping time" for
   ever, quietly, and nobody was ever asked.

   Now, on a morning, the house asks once.

   A window that opens by itself has to earn it, so most of this file is about
   when it must NOT open. It waits for a second day, because a house that
   greets somebody with a form on the day they move in is not a house. It asks
   only when the answer is missing and only about a night it actually saw. It
   asks once a morning whatever the answer is, including no answer, because a
   question you have already declined is not a question any more. And it can
   be switched off from inside itself, which is the only honest thing to put
   on a window nobody opened.

   The clock rule is the subtle one. A day in this house ends when you go to
   sleep, not at midnight — there is a boundary hour, four in the morning by
   default — so at two in the morning today() is still yesterday, nothing has
   ended, and there is no new night to ask about yet. "Morning" here means
   after the boundary and before noon, not merely a small number on a clock. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* a house that was lived in yesterday and never closed the night */
const SEED = () => {
  const d = today(), y = addDays(d, -1);
  S.settings.firstOpen = addDays(d, -6);
  S.settings.askBedtime = undefined;
  S.dailyRhythm = S.dailyRhythm || {};
  S.dailyRhythm[y] = {wakeTime: '07:10', sleepTime: '', lastSeenAt: '23:40', blocks: []};
  delete S.dailyRhythm[d];
  if(S.checkins) delete S.checkins[y];
  saveNow();
  return y;
};

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  /* a fixed morning, set before the page loads so boot sees it */
  const open = async (when = '2026-09-15T08:30:00') => {
    const ctx = await b.newContext({viewport:{width:1280, height:900}});
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.clock.setFixedTime(new Date(when));
    await p.goto(FILE); await p.waitForTimeout(1000);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1900); }
    return {ctx, p};
  };

  let {ctx, p} = await open();

  console.log('\n1. when the house may ask, and when it may not');
  await p.evaluate(SEED);
  const table = await p.evaluate(() => {
    const d = today(), y = addDays(d, -1);
    const at = (h, m = 0) => { const t = new Date(); t.setHours(h, m, 0, 0); return t; };
    const out = {};
    const ask = (h) => bedtimeAskDue(at(h));
    out.morning = ask(8) === y;
    out.earlyMorning = ask(5) === y;
    out.beforeBoundary = ask(2);          // still last night: nothing has ended
    out.afternoon = ask(13);
    out.evening = ask(21);
    /* the first morning has no yesterday to have slept through */
    const keep = S.settings.firstOpen; S.settings.firstOpen = d;
    out.firstDay = ask(8); S.settings.firstOpen = keep;
    /* a night already accounted for */
    S.dailyRhythm[y].sleepTime = '23:15'; out.alreadyLogged = ask(8);
    S.dailyRhythm[y].sleepTime = '';
    /* a night the house never saw */
    const yr = S.dailyRhythm[y]; delete S.dailyRhythm[y];
    out.neverHere = ask(8); S.dailyRhythm[y] = yr;
    /* asked once already this morning */
    S.dailyRhythm[d] = {askedBedtime: true}; out.askedAlready = ask(8);
    delete S.dailyRhythm[d];
    /* switched off for good */
    S.settings.askBedtime = false; out.switchedOff = ask(8);
    S.settings.askBedtime = undefined;
    return out;
  });
  yes('a morning with last night missing is a question', table.morning);
  yes('  and so is first thing, after the boundary', table.earlyMorning);
  is('two in the morning is not a morning, it is still last night', table.beforeBoundary, null);
  is('  the afternoon is too late to be asked', table.afternoon, null);
  is('  and the evening is somebody else\'s night', table.evening, null);
  is('the first day has no yesterday to ask about', table.firstDay, null);
  is('  a night already logged is not asked about again', table.alreadyLogged, null);
  is('  nor a night the house was not here for', table.neverHere, null);
  is('  nor one it has already asked about this morning', table.askedAlready, null);
  is('  and never, once it has been told not to', table.switchedOff, null);

  console.log('\n2. what the question looks like');
  const shown = await p.evaluate(() => {
    const y = addDays(today(), -1);
    const m = openBedtimeAsk(y);
    return {open: !!document.querySelector('#modals .overlay'),
      asks: /went to sleep/i.test(m.textContent),
      names: m.textContent.includes('Last night'),
      prefilled: m.querySelector('#bnTime').value,
      saysGuess: /last time you were here/i.test(m.textContent),
      canSkip: !!m.querySelector('#bnSkip'), canStop: !!m.querySelector('#bnNever')};
  });
  yes('it opens and asks the one thing', shown.open && shown.asks && shown.names);
  is('  with what the house last saw already in the box', shown.prefilled, '23:40');
  yes('  named as a guess rather than presented as a fact', shown.saysGuess);
  yes('  and it can be declined, or stopped for good', shown.canSkip && shown.canStop);

  console.log('\n3. answering it');
  await p.click('#bnTime'); await p.evaluate(() => {
    const i = document.querySelector('#bnTime'); i.value = '00:20';
    i.dispatchEvent(new Event('input', {bubbles: true})); });
  await p.click('#bnOk'); await p.waitForTimeout(500);
  const saved = await p.evaluate(() => {
    const y = addDays(today(), -1);
    return {kept: S.dailyRhythm[y].sleepTime, gone: !document.querySelector('#modals .overlay'),
      /* a bedtime past midnight belongs to the night before, not the morning after */
      awake: rhythmDay(y).computed.totalAwakeMinutes};
  });
  is('the time you gave is the time that is kept', saved.kept, '00:20');
  yes('  and the window closes behind it', saved.gone);
  is('  a bedtime after midnight still ends the day before it', saved.awake, 1030);

  console.log('\n4. not knowing is an answer too');
  await p.evaluate(() => { const y = addDays(today(), -1);
    S.dailyRhythm[y].sleepTime = ''; openBedtimeAsk(y); });
  await p.click('#bnSkip'); await p.waitForTimeout(400);
  const skipped = await p.evaluate(() => {
    const y = addDays(today(), -1);
    return {sleep: S.dailyRhythm[y].sleepTime, seen: S.dailyRhythm[y].lastSeenAt,
      gone: !document.querySelector('#modals .overlay')};
  });
  is('nothing is written down', skipped.sleep, '');
  yes('  and the guess is not quietly kept as if you had said it', skipped.seen === '23:40');
  yes('  the window closes', skipped.gone);
  await ctx.close();

  console.log('\n5. on a morning, it opens by itself');
  ({ctx, p} = await open());
  await p.evaluate(SEED);
  await p.reload(); await p.waitForTimeout(3200);
  const boot = await p.evaluate(() => {
    const m = document.querySelector('#modals .overlay');
    return {asked: !!m && /went to sleep/i.test(m.textContent),
      marked: !!S.dailyRhythm[today()]?.askedBedtime};
  });
  yes('the house asks without being asked to', boot.asked);
  yes('  and writes down that it has, before it asks', boot.marked);
  /* and having asked, it lets you alone for the rest of the morning */
  await p.evaluate(() => document.querySelector('#modals .overlay').remove());
  await p.reload(); await p.waitForTimeout(3200);
  yes('  a second open the same morning is left in peace',
    await p.evaluate(() => !document.querySelector('#modals .overlay')));
  await ctx.close();

  console.log('\n6. and on the first morning it says nothing at all');
  ({ctx, p} = await open());
  await p.evaluate(() => {
    const d = today(), y = addDays(d, -1);
    S.settings.firstOpen = d;
    S.dailyRhythm = S.dailyRhythm || {};
    S.dailyRhythm[y] = {lastSeenAt: '23:40', sleepTime: '', blocks: []};
    delete S.dailyRhythm[d]; saveNow();
  });
  await p.reload(); await p.waitForTimeout(3200);
  yes('nobody is handed a form on the day they move in',
    await p.evaluate(() => !document.querySelector('#modals .overlay')));
  await ctx.close();

  console.log('\n7. an evening open is not a morning');
  ({ctx, p} = await open('2026-09-15T21:00:00'));
  await p.evaluate(SEED);
  await p.reload(); await p.waitForTimeout(3200);
  yes('the house does not ask about last night at nine at night',
    await p.evaluate(() => !document.querySelector('#modals .overlay')));
  await ctx.close();

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke176  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
