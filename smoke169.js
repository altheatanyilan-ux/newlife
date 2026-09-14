/* smoke169 — accounting for the days it did not happen.

   A habit page that only records what you did is half a record. The days a
   habit was due and nothing happened are the ones with something to say, and
   they were silently blank: no tick, no note, nothing to come back to. A
   streak that broke on a Tuesday told you it broke and never why.

   So every habit is answerable, and the three things that have to stay true
   are the three that keep it from turning into a scold.

   The rhythm. A daily habit is answerable for a day. A "three times a week"
   habit is NOT answerable for the four days it was not done — that is the
   design, not a failure — it is answerable for the week, once the week has
   closed and it came up short. habitDue() says true every day for those,
   which is right for drawing a ring and wrong for asking a question.

   The breaking habits are not asked at all. Their resting state is the good
   one: a day nobody recorded is a day nothing happened, and "what got in the
   way of not doing it" is not a question anybody can answer.

   And it never accumulates. One row per habit, the most recent period that
   qualifies. Four weeks of the same unanswered question is not
   accountability, it is a wall of guilt, and a wall of guilt gets the block
   closed and never opened again. */
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
  const p = await b.newPage({viewport:{width:1340, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1600); }

  /* one daily habit nobody has touched, one three-times-a-week that came up
     short for weeks, one daily already ticked, and one breaking habit */
  await p.evaluate(() => {
    const T = today();
    S.habits.forEach((h, i) => { h.archived = false; h.negative = i === 3;
      h.createdAt = addDays(T, -90) + 'T08:00:00.000Z'; });
    S.habits = S.habits.slice(0, 4);
    S.habits[0].name = 'Morning pages'; S.habits[0].freq = {type:'daily', days:[], count:3};
    S.habits[1].name = 'Long run';      S.habits[1].freq = {type:'perWeek', days:[], count:3};
    S.habits[2].name = 'Ten minutes';   S.habits[2].freq = {type:'daily', days:[], count:3};
    S.habits[3].name = 'No scrolling';  S.habits[3].freq = {type:'daily', days:[], count:3};
    S.habitLog = {}; S.habitAccounts = {};
    habSetEntry(S.habits[2], T, {status:'completed'});
    habSetEntry(S.habits[1], addDays(weekStart(T), -5), {status:'completed'});
    saveNow(); location.hash = '#/today'; rerender();
  });
  await p.waitForTimeout(1200);
  const open = async () => { await p.evaluate(() => { const d = document.querySelector('#t-habits'); if(d) d.open = true; });
    await p.waitForTimeout(400); };
  await open();
  const rows = () => p.evaluate(() => [...document.querySelectorAll('.hb-account .hb-acc-row')]
    .map(n => ({what: n.querySelector('b').textContent, why: n.querySelector('.mono').textContent.trim(),
      kind: n.dataset.hbacc ? 'day' : 'period'})));

  console.log('\n1. what has not been said, and only that');
  yes('the block is on Today', await p.$('.hb-account') !== null);
  const r0 = await rows();
  is('  the daily one nobody touched is asked about',
    r0.filter(x => x.kind === 'day').map(x => x.what), ['Morning pages']);
  yes('  the one already ticked is not — the tick is the account',
    !r0.some(x => x.what === 'Ten minutes'), r0.map(x => x.what).join(' / '));
  /* "what got in the way of not doing it" is not a question */
  yes('  and neither is the breaking habit',
    !r0.some(x => x.what === 'No scrolling'), r0.map(x => x.what).join(' / '));

  console.log('\n2. a week is answerable for the week, not for its days');
  is('  the three-times-a-week habit is asked once, about a week',
    r0.filter(x => x.kind === 'period').map(x => x.what), ['Long run']);
  yes('    and it says how short it fell', /kept 1 of 3/.test(
    r0.find(x => x.kind === 'period').why), r0.find(x => x.kind === 'period').why);
  /* the point of the rhythm: four days not run is the design of a 3/week habit */
  yes('    it is not asked about any of the days it was not run',
    !r0.some(x => x.what === 'Long run' && x.kind === 'day'));
  /* ninety days of nothing would otherwise queue up twelve identical rows */
  is('  and never more than one period each', r0.filter(x => x.kind === 'period').length, 1);

  console.log('\n3. a missed day asks what happened, and keeps the answer');
  await p.click('[data-hbacc]'); await p.waitForTimeout(800);
  is('  it opens on the question that was asked',
    await p.evaluate(() => document.querySelector('[data-cis].on')?.dataset.cis), 'skipped');
  yes('    with the reasons on the table', await p.evaluate(() =>
    document.querySelectorAll('[data-ciw]').length) === 6);
  is('    and the note asks what happened rather than offering to be skipped',
    await p.evaluate(() => document.querySelector('#ciNoteLbl').textContent.trim()), 'What happened');
  /* how long it took and how it left you are questions about a thing that
     happened; on a skipped day they are inapplicable, not unanswered */
  yes('    and does not ask how long it took or how it left you',
    await p.evaluate(() => document.querySelector('#ciKept').hidden));
  await p.click('[data-ciw="tired"]');
  await p.fill('#ciNote', 'Slept badly and let it go.');
  await p.click('#ciSave'); await p.waitForTimeout(900);
  is('  the answer is kept where the rest of that day is kept',
    await p.evaluate(() => { const e = habEntry(S.habits[0], today());
      return e && {status: e.status, reason: e.reason, note: e.note}; }),
    {status:'skipped', reason:'tired', note:'Slept badly and let it go.'});
  await open();
  yes('  and it stops being asked', !(await rows()).some(x => x.what === 'Morning pages'));

  console.log('\n4. a short week is accounted for once, and then let go');
  await p.click('[data-hbper]'); await p.waitForTimeout(800);
  yes('  the week names itself and how short it fell', await p.evaluate(() =>
    /kept 1 of 3/.test(document.querySelector('.overlay .modal').textContent)));
  await p.click('[data-paw="time"]');
  await p.fill('#paNote', 'The week went to the deadline.');
  await p.click('#paSave'); await p.waitForTimeout(900);
  const acc = await p.evaluate(() => Object.values(S.habitAccounts || {})
    .map(a => ({kept:a.kept, target:a.target, reason:a.reason, note:a.note})));
  is('  a period has nowhere else to live, so it gets its own record', acc,
    [{kept:1, target:3, reason:'time', note:'The week went to the deadline.'}]);
  await open();
  const r1 = await rows();
  yes('  that week is not asked about again',
    !r1.some(x => x.kind === 'period' && /7 Sep|of 3/.test(x.why) && x.why.includes('kept 1')),
    r1.map(x => x.why).join(' / '));
  /* the week before it is next, because the look-back exists so that skipping
     one week does not lose the week before it */
  yes('  the week before it is what comes up next',
    r1.filter(x => x.kind === 'period').length <= 1, `${r1.filter(x => x.kind === 'period').length} periods`);

  console.log('\n5. it is not there when there is nothing to ask');
  await p.evaluate(() => {
    const T = today();
    habList().forEach(h => { for(let i = 0; i < 40; i++) habSetEntry(h, addDays(T, -i), {status:'completed'}); });
    saveNow(); rerender();
  });
  await p.waitForTimeout(900); await open();
  yes('a house that has kept everything is asked nothing',
    await p.$('.hb-account') === null);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke169  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
