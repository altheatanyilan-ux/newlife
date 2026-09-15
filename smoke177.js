/* smoke177 — the days themselves, and room to say what a day was.

   Today is a page you write on and then never see again. Everything it asks
   for is filed by date and afterwards only ever consulted in aggregate — a
   line on a chart, a number in a dashboard. Those are true and they are not
   the thing: a chart can say your set-point averaged eleven in August and it
   cannot hand back the ninth, when you wrote one sentence you would want to
   read again.

   So the Review tab of the Lived Record gets the days. It belongs there
   because that tab is already both halves of looking back — the numbers, and
   the reviews written about the periods the numbers cover — and the days are
   what both of those are ABOUT.

   Three things this watches, and the first is the one that bites.

   A day is listed only if something was put into it. Anything that so much as
   glances at a date leaves a rhythm record behind — the charts walk back a
   week every time they draw — so presence in the store proves nothing, and an
   archive built by reading keys is a wall of empty days.

   It stops at today. A task scheduled for October puts October in the set,
   and a record of days that have not happened is a plan.

   And the words can be edited where the readings cannot. A sentence about a
   Tuesday is yours and a typo in it is worth fixing; the mood you chose and
   the numbers you gave were readings taken at a time, and a record you can
   quietly improve afterwards is not a record.

   Last, the smallest change and the one most likely to be felt: the box that
   asks how today is going is no longer one line. It was asked for as one
   sentence and given a single-line input, which argues with you exactly on
   the days that need more than a sentence — and those are the days worth
   having written down. */
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
  const ctx = await b.newContext({viewport:{width:1280, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1900); }

  console.log('\n1. the box that asks how today is going has room to answer');
  await p.evaluate(() => { location.hash = '#/today'; });
  await p.waitForTimeout(1200);
  const box = await p.evaluate(() => {
    const d = document.querySelector('#t-checkin'); if(d) d.open = true;
    const f = [...document.querySelectorAll('#t-checkin .ed')]
      .find(n => (n.dataset.path || '').endsWith('.sentence'));
    return f ? {multi: f.dataset.multi, tag: f.tagName,
      label: f.closest('.field')?.querySelector('label')?.textContent.trim()} : null;
  });
  yes('the field is there', !!box, JSON.stringify(box));
  is('  and it is not a single line any more', box && box.multi, '1');
  yes('  nor does the label still insist on one sentence',
    box && !/one sentence/i.test(box.label), box && box.label);
  /* and editing it really does open something that grows */
  await p.evaluate(() => {
    const f = [...document.querySelectorAll('#t-checkin .ed')]
      .find(n => (n.dataset.path || '').endsWith('.sentence'));
    f.click();
  });
  await p.waitForTimeout(300);
  is('  writing in it opens a box that can grow',
    await p.evaluate(() => document.querySelector('#t-checkin .ed.editing textarea') ? 'textarea' : 'input'),
    'textarea');
  await p.keyboard.type('Slow start.\nThen it opened up.');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);

  console.log('\n2. a fresh house has no wall of empty days');
  /* the charts walk back a week whenever they draw, and each of those leaves
     a rhythm record behind it that holds nothing at all */
  /* Far enough back that the starter set has not been there: the recent days
     really do have habits and entries in them, so touching those would prove
     nothing either way. */
  const fresh = await p.evaluate(() => {
    const T = today();
    const days = Array.from({length: 10}, (_, i) => addDays(T, -(200 + i)));
    days.forEach(d => rhythmDay(d));                          // touch, do not fill
    saveNow();
    const listed = archiveDays();
    return {days, inStore: days.filter(d => (S.dailyRhythm || {})[d]).length,
      inArchive: days.filter(d => listed.includes(d))};
  });
  is('the store now has ten days in it that nobody wrote on', fresh.inStore, 10);
  is('  and the archive counts none of them', fresh.inArchive, []);

  console.log('\n3. it stops at today');
  const future = await p.evaluate(() => {
    const T = today(), soon = addDays(T, 30);
    S.tasks = S.tasks || [];
    S.tasks.push({id: 'tfuture', text: 'a thing in a month', day: soon, done: false,
      links: {projects: [], skills: []}});
    saveNow();
    return {soon, listed: archiveDays().includes(soon), latest: archiveDays()[0] || null, T};
  });
  yes('a task scheduled for next month is not a day you have lived', !future.listed);
  yes('  and nothing in the archive is after today', !future.latest || future.latest <= future.T,
    `${future.latest} against ${future.T}`);

  console.log('\n4. the days are under the Review of the Lived Record');
  await p.evaluate(() => {
    const T = today();
    S.checkins = S.checkins || {}; S.dailyRhythm = S.dailyRhythm || {};
    for(let i = 0; i < 4; i++){
      const d = addDays(T, -i);
      S.checkins[d] = {intention: 'the intention for ' + i,
        sentence: 'What the day was.\nAnd a second line of it.',
        mood: 'settled', setpoint: 17, energy: {physical: 3, mental: 4}};
      S.dailyRhythm[d] = {wakeTime: '07:10', sleepTime: '23:20', blocks: []};
    }
    S.checkins['2026-07-04'] = {intention: 'an older day', mood: 'open'};
    saveNow(); location.hash = '#/journals/review';
  });
  await p.waitForTimeout(1600);
  const tab = await p.evaluate(() => ({
    onReview: /journals\/review/.test(location.hash),
    section: !!document.querySelector('#rvDays'),
    months: [...document.querySelectorAll('.day-month')].map(m => m.dataset.month),
    firstOpen: document.querySelector('.day-month')?.open === true,
    rowsInOpen: document.querySelectorAll('.day-month[open] .day-row').length,
    rowsInShut: document.querySelectorAll('.day-month:not([open]) .day-row').length}));
  yes('the archive is on the Review tab', tab.onReview && tab.section);
  yes('  grouped by month, newest first', tab.months.length >= 2
    && tab.months[0] > tab.months[1], tab.months.join(' '));
  yes('  with the month you are in already open', tab.firstOpen && tab.rowsInOpen >= 4,
    String(tab.rowsInOpen));
  /* a year of days is three hundred rows nobody asked for */
  is('  and a shut month costing nothing until it is asked for', tab.rowsInShut, 0);
  await p.evaluate(() => { document.querySelectorAll('.day-month')[1].open = true; });
  await p.waitForTimeout(400);
  yes('  opening one fills it', await p.evaluate(() =>
    document.querySelectorAll('.day-month')[1].querySelectorAll('.day-row').length > 0));

  console.log('\n5. a day gives back what that day held');
  const row = await p.evaluate(() => {
    const r = document.querySelector('.day-row'); r.open = true;
    const txt = r.textContent;
    return {when: !!r.querySelector('.day-when'),
      intention: /the intention for 0/.test(txt),
      sentence: /What the day was/.test(txt),
      mood: /settled/i.test(txt), setpoint: /17/.test(txt),
      slept: /23:20/.test(txt), woke: /07:10/.test(txt),
      edges: !!r.querySelector('[data-dayedges]')};
  });
  for(const [k, v] of Object.entries(row)) yes(`  the day gives back its ${k}`, v);

  console.log('\n6. the words can be corrected; the readings cannot');
  const writable = await p.evaluate(() => {
    const r = document.querySelector('.day-row[open]') || document.querySelector('.day-row');
    r.open = true;
    const paths = [...r.querySelectorAll('.ed')].map(n => n.dataset.path);
    const readings = r.querySelector('.day-readings');
    return {paths, readingsAreEd: readings ? !!readings.querySelector('.ed') : null};
  });
  yes('the intention and the sentence are editable where they lie',
    writable.paths.some(x => /\.intention$/.test(x)) && writable.paths.some(x => /\.sentence$/.test(x)),
    writable.paths.join(' '));
  is('  and the mood, the set-point and the energy are not', writable.readingsAreEd, false);
  /* a sentence corrected here is the same sentence Today wrote */
  await p.evaluate(() => {
    const r = document.querySelector('.day-row');
    const f = [...r.querySelectorAll('.ed')].find(n => /\.sentence$/.test(n.dataset.path));
    f.click();
  });
  await p.waitForTimeout(300);
  await p.keyboard.type('corrected afterwards');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  yes('  and correcting it writes through to the day itself',
    await p.evaluate(() => /corrected afterwards/.test(S.checkins[today()].sentence || '')),
    await p.evaluate(() => S.checkins[today()].sentence));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke177  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
