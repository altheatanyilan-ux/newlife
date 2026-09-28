/* smoke275 — a reading, taken elsewhere, with the life around it.

   The claims.

   FROM THE MORNING CARD. Once the morning card is turned, "take it
   elsewhere" writes one file: the question, the card and what it means in
   the deck's own words (in full: the long reading, the questions it asks,
   the counsel), what you wrote, and a note to whoever reads it.

   THE LIFE AROUND IT, AS WIDE AS YOU SAY. That day, that week, that month
   or three months — and which parts: the day's and the week's plans (the
   intention, why the day exists, the week's theme, goals and periods), the
   work done, open and coming with the milestones ahead, how you have been
   (check-ins, when you slept and woke), the other readings in that span and
   the cards that keep coming back, what you are building toward. Each part
   says how much it holds. The journal starts unticked; ticked, it goes in,
   and each kind of entry can be left out. A narrower span leaves out what
   falls outside it. "In brief" drops the long readings.

   IT GOES ONLY WHERE YOU TAKE IT. The download is a .md file whose text is
   exactly what the preview shows; "copy" puts the same text on the
   clipboard. Nothing is requested from the network, the reading is not kept
   by writing it out, and the choices are remembered.

   FROM EVERY READING. Every reading as it is dealt (tarot, the coins, an
   oracle card) has it beside "keep"; every kept reading has it too, on
   Today and in the journal, and pressing it there does not also open the
   card it sits on.

   Run: NODE_PATH=node_modules node smoke275.js */
const {chromium} = require('playwright');
const path = require('path');
const fs = require('fs');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}, acceptDownloads: true});
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil').forEach(n => n.remove()); });

  /* a week with something in it */
  await p.evaluate(() => {
    const T = today();
    checkin(T).intention = 'Finish the proofs calmly';
    checkin(T).sentence = 'Slow start, then clear.';
    checkin(T).setpoint = 16;
    dayPlan(T).why = 'The printer needs them by Thursday';
    const wp = weekPlan(isoWeek(T));
    wp.theme = 'Close the book';
    wp.outcomes = [{id: uid(), text: 'Proofs out of the door', linkType: '', linkId: null, taskIds: []}];
    wp.periods = [{id: uid(), from: T, to: addDays(T, 2), name: 'Deadline', focus: 'the proofs and nothing else'}];
    planAddMilestone('inbox', {name: 'Proofs to the printer', date: addDays(T, 3)});
    const done = newPlanTask('Check the index', T, {listId: 'inbox'}); done.done = true; done.doneAt = T;
    S.tasks.push(done, newPlanTask('Send the captions', addDays(T, 2), {listId: 'inbox'}));
    S.dailyRhythm = S.dailyRhythm || {};
    S.dailyRhythm[addDays(T, -1)] = Object.assign(S.dailyRhythm[addDays(T, -1)] || {}, {sleepTime: '23:40'});
    S.dailyRhythm[T] = Object.assign(S.dailyRhythm[T] || {}, {wakeTime: '07:10'});
    const tower = TAROT.findIndex(c => c.n === 'The Tower');
    const mk = (days, q, body) => { const e = divinationSave({system: 'tarot', question: q, spread: 'one', title: 'A card',
      cards: [{card: tower, rev: false, pos: 'the card'}], reading: body, source: 'digital'}); e.occurredAt = addDays(T, -days); return e; };
    mk(3, 'What is falling apart?', 'The old plan, and good.');
    mk(20, 'An older question', 'Long ago.');
    const base = {media: [], links: {}, people: [], places: [], emotions: [], tags: [], confidence: '', extra: {}};
    S.entries.push(Object.assign({id: uid(), type: 'reflection', title: 'By the river', body: 'Walked by the river and knew what to cut.',
      occurredAt: T, createdAt: new Date().toISOString()}, base));
    S.entries.push(Object.assign({id: uid(), type: 'dream', title: 'The flood', body: 'A house of water, and I was calm in it.',
      occurredAt: addDays(T, -5), createdAt: new Date().toISOString()}, base));
    delete S.settings.readingBrief;
    saveNow();
  });

  console.log('\n1. from the morning card');
  await p.evaluate(() => { S.settings.lastSeenAt = Date.now() - 30 * 3600e3; openMorningCard(); }); await p.waitForTimeout(500);
  await p.click('[data-mcq="2"]');
  await p.click('#mcDraw'); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip')?.click()); await p.waitForTimeout(1500);
  const card = await p.evaluate(() => (document.querySelector('.mc-name')?.childNodes[0]?.textContent || '').trim());
  await p.fill('#mcText', 'It is telling me to stop polishing.');
  yes('the turned card has "take it elsewhere"', !!(await p.$('#mcOut #dvTake')));
  const entriesBefore = await p.evaluate(() => S.entries.length);
  const net = [];
  p.on('request', r => { if(/^https?:/.test(r.url())) net.push(r.url()); });
  await p.click('#mcOut #dvTake'); await p.waitForTimeout(600);
  yes('it opens the composer over the card', !!(await p.$('.rb')) && !!(await p.$('#mcOut')));
  const pre = () => p.evaluate(() => document.querySelector('#rbPre').textContent);
  let t = await pre();
  yes('the file begins as a reading', /^# A reading, and what surrounds it/.test(t), t.slice(0, 80));
  yes('  with the question', t.includes('Where should my attention go today?'));
  yes('  the card', !!card && t.includes(card), card);
  yes('  and what it means, at length', /What it means (upright|reversed):/.test(t) && /Questions it asks:/.test(t) && /Counsel:/.test(t));
  yes('  what I wrote', t.includes('It is telling me to stop polishing.'));
  yes('  and a note to the reader', /What I would like from you/.test(t) && /personal reading/.test(t));

  console.log('\n2. the life around it — the week by default');
  yes('the day\'s intention', t.includes('Finish the proofs calmly'));
  yes('  why the day exists', t.includes('The printer needs them by Thursday'));
  yes('  the week\'s theme, its goal and its period', t.includes('Close the book') && t.includes('Proofs out of the door') && t.includes('the proofs and nothing else'));
  yes('  work done and coming', t.includes('[x] Check the index') && t.includes('Send the captions'));
  yes('  the milestone ahead', t.includes('Proofs to the printer'));
  yes('  how the day was going, and the night', t.includes('Slow start, then clear.') && t.includes('woke 7:10 am') && t.includes('to bed 11:40 pm'));
  yes('  the reading three days ago', t.includes('What is falling apart?') && t.includes('The old plan, and good.'));
  yes('  but not one from twenty days ago', !t.includes('An older question'));
  yes('  the cards that keep coming back, over three months', /more than once[^\n]*The Tower ×\d/.test(t));
  yes('  what I am building toward', /My values/.test(t) || /working toward/.test(t) || /threads running/.test(t));
  yes('  and not the journal until asked', !t.includes('Walked by the river'));
  const counts = await p.evaluate(() => [...document.querySelectorAll('.rb-part')].map(n => n.textContent.replace(/\s+/g, ' ').trim()));
  yes('each part says how much it holds', counts.length === 7 && counts.every(c => /\d|nothing/.test(c)), counts);

  await p.click('[data-rbpart="journal"]'); await p.waitForTimeout(300);
  t = await pre();
  yes('ticked, the journal goes in', t.includes('Walked by the river') && t.includes('A house of water'));
  await p.click('[data-rbjt="dream"]'); await p.waitForTimeout(300);
  t = await pre();
  yes('  and one kind of entry can be left out', t.includes('Walked by the river') && !t.includes('A house of water'));

  await p.click('[data-rbwin="day"]'); await p.waitForTimeout(300);
  t = await pre();
  yes('that day only: the reading three days ago drops out', !t.includes('What is falling apart?'));
  yes('  and today\'s things stay', t.includes('Finish the proofs calmly') && t.includes('Walked by the river'));
  await p.click('[data-rbwin="month"]'); await p.waitForTimeout(300);
  t = await pre();
  yes('that month: the one from twenty days ago comes in', t.includes('An older question'));

  const fullLen = t.length;
  await p.click('[data-rbdepth="short"]'); await p.waitForTimeout(300);
  t = await pre();
  yes('"in brief" drops the long readings', t.length < fullLen && !/Questions it asks:/.test(t) && /What it means (upright|reversed):/.test(t));

  await p.fill('#rbNote', 'Be blunt with me.'); await p.waitForTimeout(200);
  t = await pre();
  yes('the note is mine to write', t.includes('Be blunt with me.') && !t.includes('personal reading of this'));

  console.log('\n3. it goes only where I take it');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#rbSave')]);
  const name = dl.suggestedFilename();
  const file = await dl.path();
  const got = fs.readFileSync(file, 'utf8');
  yes('a Markdown file, named for the day and the card', /^reading-\d{4}-\d{2}-\d{2}-morning-card-[\w-]+\.md$/.test(name), name);
  yes('  holding exactly what the preview shows', got === await pre(), got.length + ' vs ' + (await pre()).length);
  await p.click('#rbCopy'); await p.waitForTimeout(400);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  yes('"copy" puts the same text on the clipboard', clip === await pre());
  yes('nothing was requested from the network', !net.length, net.join(' '));
  yes('the reading was not kept by writing it out', await p.evaluate(n => S.entries.length === n, entriesBefore));
  const pr = await p.evaluate(() => S.settings.readingBrief);
  yes('the choices are remembered', pr && pr.win === 'month' && pr.depth === 'short' && pr.inc.journal === true && pr.jx.includes('dream') && pr.note === 'Be blunt with me.', pr);
  await p.evaluate(() => closeModals());

  console.log('\n4. from every reading');
  /* tarot, dealt here */
  await p.evaluate(() => openTarot({spread: 'one'})); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#dvDraw').click()); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip')?.click()); await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector('.dv-pick:not(.taken)')?.click()); await p.waitForTimeout(3600);
  yes('a tarot reading has it beside "keep"', await p.evaluate(() => !!document.querySelector('#dvRead:not([hidden]) #dvTake') && !!document.querySelector('#dvSave')));
  await p.evaluate(() => { document.querySelector('#dvText').value = 'Dealt, not kept.'; document.querySelector('#dvTake').click(); }); await p.waitForTimeout(500);
  t = await pre();
  yes('  and it writes that reading out, unkept', t.includes('Dealt, not kept.') && /Spread:/.test(t));
  await p.evaluate(() => closeModals());
  /* an oracle card */
  await p.evaluate(() => openOracle('elem')); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#orDraw').click()); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip')?.click()); await p.waitForTimeout(1400);
  yes('an oracle card has it', await p.evaluate(() => !!document.querySelector('#orOut #dvTake')));
  await p.evaluate(() => document.querySelector('#orOut #dvTake').click()); await p.waitForTimeout(500);
  t = await pre();
  yes('  and it writes the card out', /## The card/.test(t) && /\*\*Deck:\*\*/.test(t));
  await p.evaluate(() => closeModals());
  /* the coins */
  await p.evaluate(() => openIChing()); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#icGo').click()); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip')?.click()); await p.waitForTimeout(500);
  for(let i = 0; i < 6; i++){
    for(let k = 0; k < 120; k++){ if(await p.evaluate(() => { const x = document.querySelector('#icToss'); return !!x && !x.disabled; })) break; await p.waitForTimeout(200); }
    await p.evaluate(() => document.querySelector('#icToss')?.click());
  }
  for(let k = 0; k < 140; k++){ if(await p.evaluate(() => !!document.querySelector('#icRead #dvTake'))) break; await p.waitForTimeout(250); }
  yes('a cast of the coins has it', await p.evaluate(() => !!document.querySelector('#icRead #dvTake')));
  await p.evaluate(() => document.querySelector('#icRead #dvTake').click()); await p.waitForTimeout(500);
  t = await pre();
  yes('  and it writes the hexagram out, line by line', /## The hexagram/.test(t) && /line 6:/.test(t) && /The judgement:/.test(t));
  await p.evaluate(() => closeModals());

  /* a cast of the charms */
  await p.evaluate(() => openCharmCast({size: 'standard'})); await p.waitForTimeout(500);
  await p.click('#ccGo'); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip')?.click()); await p.waitForTimeout(5400);
  yes('a cast of the charms has it', await p.evaluate(() => !!document.querySelector('#ccRead #dvTake')));
  await p.evaluate(() => document.querySelector('#ccRead #dvTake').click()); await p.waitForTimeout(500);
  t = await pre();
  yes('  and it writes where each charm came down', /## The cast/.test(t) && /Where each charm came down/.test(t));
  await p.evaluate(() => closeModals());

  /* kept readings */
  await p.evaluate(() => { divinationSave({system: 'tarot', question: 'Kept this morning', spread: 'one', title: 'A card',
      cards: [{card: 16, rev: true, pos: 'the card'}], reading: 'Kept.', source: 'digital'});
    S.settings.todayView = 'in'; location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1000);
  await p.evaluate(() => { const d = document.querySelector('.dv-today-card')?.closest('details'); if(d) d.open = true; });
  const onToday = await p.evaluate(() => !!document.querySelector('.dv-today-card [data-rbexport]'));
  if(onToday){
    await p.evaluate(() => document.querySelector('.dv-today-card [data-rbexport]').click()); await p.waitForTimeout(600);
    yes('a reading kept today has it on Today, and it opens here', !!(await p.$('.rb')) && await p.evaluate(() => location.hash === '#/today'));
    await p.evaluate(() => closeModals());
  } else no('a reading kept today has it on Today');
  await p.evaluate(() => { location.hash = '#/journals/divination'; }); await p.waitForTimeout(1200);
  yes('every kept reading has it in the journal', await p.evaluate(() => document.querySelectorAll('.entry [data-rbexport]').length >= 2));
  await p.evaluate(() => document.querySelector('.entry [data-rbexport]').click()); await p.waitForTimeout(600);
  t = await pre();
  yes('  and it writes that reading out', /^# A reading/.test(t) && /The Tower/.test(t));
  await p.evaluate(() => closeModals());

  console.log('\n5. it fits a phone');
  await p.setViewportSize({width: 390, height: 860}); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.entry [data-rbexport]').click()); await p.waitForTimeout(600);
  const fit = await p.evaluate(() => { const r = document.querySelector('.rb').getBoundingClientRect();
    return {inside: r.left >= -1 && r.right <= innerWidth + 1, scroll: document.documentElement.scrollWidth <= innerWidth + 1}; });
  yes('the composer stays inside a 390px window', fit.inside && fit.scroll, fit);
  await p.screenshot({path: '/tmp/smoke275-phone.png'});
  await p.setViewportSize({width: 1300, height: 950}); await p.waitForTimeout(400);
  await p.screenshot({path: '/tmp/smoke275-desk.png'});
  await p.evaluate(() => closeModals());

  console.log('\n6. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
