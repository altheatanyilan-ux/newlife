/* smoke200 — one clock for the whole house.

   The house was full of timers that did not talk to each other, so the one
   question nobody could answer was where the day actually went. This is the
   single clock any room can start, and the three decisions that make it hold
   up over a month of real use.

   A RUNNING TIMER IS A ROW WITH NO END ON IT. The obvious model keeps the
   running timer beside the entries — an id and a started-at pointing at the
   row. Two places holding one fact drift apart: close the tab mid-sitting and
   they disagree about whether anything is running at all.

   THE LENGTH IS THE TWO TIMES. A stored duration beside a start and an end is
   a third fact that can contradict the other two, and it does the first time
   anybody corrects a start time.

   AND NOTHING IS COUNTED TWICE. A room asking for the clock while one is
   already running is refused, and a room ending only stops the entry it
   started itself. Every hour pushed outward — onto a skill, a project, a
   person — is pushed as a correction rather than as another row, so editing
   a sitting five times leaves one nod rather than five. */
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
  const p = await (await b.newContext({viewport:{width:1400, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. the pill');
  const idle = await p.evaluate(() => ({
    there: !!document.getElementById('timeDock'),
    go: !!document.getElementById('tdQuick'),
    running: !!timeRunning()}));
  yes('it is in the corner of every page', idle.there && idle.go, JSON.stringify(idle));
  yes('  and nothing is running until you say so', !idle.running, JSON.stringify(idle));
  await p.evaluate(() => { location.hash = '#/journals'; }); await p.waitForTimeout(800);
  is('  including the pages that are not about time',
    await p.evaluate(() => !!document.getElementById('tdQuick')), true);

  console.log('\n2. pressing it starts the clock, and nothing else');
  const started = await p.evaluate(async () => {
    document.getElementById('tdQuick').click();
    await new Promise(r => setTimeout(r, 1200));
    const e = timeRunning();
    return {rows: timeEntries().length, what: e && e.what, ended: e && e.endTime,
      clock: document.querySelector('.td-clock') && document.querySelector('.td-clock').textContent,
      secs: Math.round(timeMinutes(e) * 60)};
  });
  is('one row, with nothing written on it yet', [started.rows, started.what], [1, '']);
  /* the running one is the one with no end: there is no second place saying
     which timer is going, so there is nothing to drift out of step */
  is('  and no end time, which is what makes it the running one', started.ended, null);
  yes('  the count climbs without anything being written', started.secs >= 1, JSON.stringify(started));
  yes('  and it is on the face', /^\d+:\d\d$/.test(started.clock || ''), started.clock);

  console.log('\n3. one clock, not two');
  const second = await p.evaluate(async () => {
    const first = timeRunning();
    /* Backdated so it is a real sitting. A timer that has run for a second
       is not kept at all now \u2014 anything under a minute is thrown away
       rather than written, because four rooms start this clock by themselves
       and the day used to fill with sittings nobody sat. That rule has its
       own suite; what THIS section is about is that starting a second clock
       stops the first, and to see the first survive it has to be worth
       keeping. */
    first.startTime = new Date(Date.now() - 12 * 60000).toISOString();
    const id = first.id;
    startTimer({what:'something else'});
    await new Promise(r => setTimeout(r, 100));
    const now = timeRunning();
    const was = byId(S.timeEntries, id);
    return {rows: timeEntries().length, running: now.what,
      firstEnded: !!(was && was.endTime), firstMinutes: was ? Math.round(timeMinutes(was)) : null};
  });
  is('starting a second stops the first', [second.rows, second.running], [2, 'something else']);
  yes('  which is now a finished row rather than a lost one', second.firstEnded, JSON.stringify(second));
  is('    with the twelve minutes it ran for', second.firstMinutes, 12);
  /* and the other way round: one that is NOT worth keeping is not kept */
  const tooShort = await p.evaluate(async () => {
    /* from a standing start, so the count is about these two and nothing
       a previous section happened to leave running */
    if(timeRunning()) stopTimer();
    const before = timeEntries().length;
    startTimer({what:'a wrong turn'});
    startTimer({what:'the right one'});
    return {before, after: timeEntries().length,
      running: (timeRunning() || {}).what,
      names: timeEntries().map(e => e.what)};
  });
  is('  a first clock that ran for a second is thrown away instead',
    tooShort.after, tooShort.before + 1);
  is('    leaving only the one that is running', tooShort.running, 'the right one');
  yes('    and no trace of the wrong turn',
    !tooShort.names.includes('a wrong turn'), tooShort.names.join(' | '));

  console.log('\n4. the length is the two times');
  const len = await p.evaluate(() => {
    const e = timeRunning();
    stopTimer();
    e.startTime = '2026-09-19T09:00:00.000Z';
    e.endTime = '2026-09-19T11:00:00.000Z';
    const two = timeMinutes(e);
    /* correcting a time is enough: nothing else holds a duration that could
       now disagree with it */
    e.endTime = '2026-09-19T09:30:00.000Z';
    return {two, half: timeMinutes(e), stored: Object.keys(e).filter(k => /minutes|duration/i.test(k))};
  });
  is('two hours between the two times is two hours', len.two, 120);
  is('  and moving the end moves the length with it', len.half, 30);
  is('  because no third number is kept to disagree', len.stored, []);

  console.log('\n5. saying how long, after the fact');
  const manual = await p.evaluate(() => {
    const day = today();
    const byLength = logTime({what:'read the Jazz Piano Book', categoryId:'reading',
      startTime: timeAtOn(day, '09:00'), minutes: 120, tags:['jazz','theory']});
    const byTimes = logTime({what:'dinner with Yuki', categoryId:'social',
      startTime: timeAtOn(day, '17:30'), endTime: timeAtOn(day, '19:30')});
    return {a: [timeMinutes(byLength), timeClockOf(byLength.endTime)],
      b: [timeMinutes(byTimes), timeClockOf(byTimes.startTime), timeClockOf(byTimes.endTime)],
      tags: byLength.tags, source: byLength.source};
  });
  is('two hours from nine is two hours, ending at eleven', manual.a, [120, '11:00']);
  is('  and two times given are the two times kept', manual.b, [120, '17:30', '19:30']);
  is('  with the tags as given', manual.tags, ['jazz','theory']);
  is('  marked as written down rather than timed', manual.source, 'manual');

  console.log('\n6. rounding is a way of saying, not a way of storing');
  const round = await p.evaluate(() => {
    const e = logTime({what:'a short thing', startTime: timeAtOn(today(), '12:00'), minutes: 7});
    const exact = timeSaid(timeMinutes(e), 1);
    timeSettings().round = 15;
    const rough = timeSaid(timeMinutes(e));
    const kept = timeMinutes(e);
    timeSettings().round = 1;
    removeTimeEntry(e.id);
    return {exact, rough, kept};
  });
  is('seven minutes is seven minutes', round.exact, '7m');
  /* not "0m": rounding seven minutes to the nearest quarter and getting
     nothing is the room telling you that you did not practise */
  is('  said as a quarter of an hour when you ask for quarters', round.rough, '15m');
  is('  and still seven minutes underneath', round.kept, 7);

  console.log('\n7. a note on the sitting, while it is happening');
  const noted = await p.evaluate(async () => {
    startTimer({what:'the coda', categoryId:'piano'});
    noteOnTimer('  moved to the coda  ');
    noteOnTimer('');
    const e = timeRunning();
    const out = {n: e.notes.length, text: e.notes[0].text, stamped: !!e.notes[0].at};
    stopTimer();
    return out;
  });
  is('it is kept, trimmed', [noted.n, noted.text], [1, 'moved to the coda']);
  yes('  with the moment it was made', noted.stamped, JSON.stringify(noted));

  console.log('\n8. a timer left running overnight');
  const away = await p.evaluate(() => {
    const e = startTimer({what:'left running'});
    e.startTime = new Date(Date.now() - 14 * 3600 * 1000).toISOString();
    const closed = closeRunawayTimer();
    return {mins: Math.round(timeMinutes(closed)), said: closed.notes[0].text,
      running: !!timeRunning()};
  });
  is('fourteen hours of piano is closed at six', away.mins, 360);
  yes('  and says so, rather than quietly logging the night', /Left running/.test(away.said), away.said);
  yes('  with nothing left running', !away.running, JSON.stringify(away));

  console.log('\n9. the day');
  await p.evaluate(() => { location.hash = '#/time/day'; }); await p.waitForTimeout(900);
  const day = await p.evaluate(() => {
    const segs = [...document.querySelectorAll('.tm-seg')].map(n =>
      [Math.round(parseFloat(n.style.left)), Math.round(parseFloat(n.style.width))]);
    return {segs, rows: document.querySelectorAll('.tm-row').length,
      untracked: [...document.querySelectorAll('.tm-sumrow')].map(n => n.textContent.replace(/\s+/g,' ').trim())
        .filter(t => /untracked/.test(t))};
  });
  yes('every sitting is a stretch of the bar', day.segs.length >= 3, JSON.stringify(day.segs));
  /* nine in the morning is three eighths of the way along a day that starts at
     midnight, and two hours is a twelfth of it */
  yes('  placed by the time of day it happened',
    day.segs.some(s => s[0] === 38 && s[1] === 8), JSON.stringify(day.segs));
  yes('  and the hours nobody accounted for are drawn too, which is the honest half',
    day.untracked.length === 1, JSON.stringify(day.untracked));

  console.log('\n10. the week, and the reports');
  await p.evaluate(() => { location.hash = '#/time/week'; }); await p.waitForTimeout(800);
  is('seven days, stacked', await p.evaluate(() => document.querySelectorAll('.tm-wday').length), 7);
  await p.evaluate(() => { location.hash = '#/time/reports'; }); await p.waitForTimeout(800);
  const rep = await p.evaluate(async () => {
    const all = document.querySelectorAll('.tm-sumrow').length;
    const sel = document.querySelector('#tmCat');
    sel.value = 'reading'; sel.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 600));
    const one = [...document.querySelectorAll('.tm-sumrow')].map(n => n.textContent.replace(/\s+/g,' ').trim());
    const t = document.querySelector('#tmTag');
    document.querySelector('#tmCat').value = ''; document.querySelector('#tmCat').dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 600));
    const tag = document.querySelector('#tmTag');
    tag.value = 'theory'; tag.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 600));
    const byTag = [...document.querySelectorAll('.tm-sumrow')].map(n => n.textContent.replace(/\s+/g,' ').trim());
    timeUi().tag = null;
    return {all, one, byTag};
  });
  yes('the reports hold every category at once', rep.all >= 3, String(rep.all));
  yes('  and one when you ask for one', rep.one.length === 1 && /Reading/.test(rep.one[0]),
    JSON.stringify(rep.one));
  yes('  or one tag, across categories', rep.byTag.length === 1 && /Reading/.test(rep.byTag[0]),
    JSON.stringify(rep.byTag));

  console.log('\n11. an hour is logged once and shows up everywhere');
  const out = await p.evaluate(() => {
    S.skills = S.skills || [];
    S.projects = S.projects || [];
    S.people = S.people || [];
    const sk = {id:'sk-time', name:'Piano', cat:'craft', hours:2};
    const pr = {id:'pr-time', name:'The bar', status:'active'};
    const pe = {id:'pe-time', name:'Yuki', tier:'inner'};
    S.skills.push(sk); S.projects.push(pr); S.people.push(pe);
    const day = today();
    const e = logTime({what:'scales', startTime: timeAtOn(day, '08:00'), minutes: 60,
      categoryId:'piano', linkedType:'skill', linkedId:'sk-time', linkedLabel:'Piano'});
    const afterOne = sk.hours;
    /* correcting the sitting must take the difference off, not add another
       hour on top — which is what a month of small corrections would do */
    e.endTime = timeAtOn(day, '08:30');
    timeAfterSave(e);
    const afterFix = sk.hours;
    const n = logTime({what:'painted the sign', startTime: timeAtOn(day, '14:00'), minutes: 45,
      linkedType:'project', linkedId:'pr-time', linkedLabel:'The bar'});
    const nods1 = (S.nods || []).filter(q => q.projectId === 'pr-time').length;
    n.endTime = timeAtOn(day, '15:00');
    timeAfterSave(n);
    const nods2 = (S.nods || []).filter(q => q.projectId === 'pr-time');
    const i = logTime({what:'coffee', startTime: timeAtOn(day, '16:00'), minutes: 30,
      linkedType:'person', linkedId:'pe-time', linkedLabel:'Yuki'});
    timeAfterSave(i);
    const ints = (S.interactions || []).filter(q => q.personId === 'pe-time');
    return {afterOne, afterFix, nods1, nods2: nods2.length, nodMins: nods2[0] && nods2[0].duration,
      ints: ints.length, lastSeen: (byId(S.people, 'pe-time') || {}).lastInteraction === day};
  });
  is('an hour on a skill is an hour on the skill', out.afterOne, 3);
  is('  and halving it takes the half back off, rather than adding another',
    out.afterFix, 2.5);
  is('a sitting on a project is one nod', out.nods1, 1);
  is('  still one after you correct it', out.nods2, 1);
  is('  with the corrected length on it', out.nodMins, 60);
  is('an hour with somebody is one entry in their record', out.ints, 1);
  yes('  and they were last seen today', out.lastSeen, JSON.stringify(out));

  console.log('\n12. a room asking for the clock');
  const rooms = await p.evaluate(async () => {
    const mine = startTimer({what:'my own timing'});
    const refused = timeAutoStart({categoryId:'meditation', feature:'stillness', what:'sitting'});
    const stillMine = timeRunning().id === mine.id;
    /* and a room cannot stop a clock it did not start */
    const notStopped = timeAutoStop('stillness');
    const stillRunning = !!timeRunning();
    stopTimer();
    const theirs = timeAutoStart({categoryId:'meditation', feature:'stillness', what:'sitting'});
    /* Backdated, because a sitting of under a minute is thrown away rather
       than written and the room's own stop is silent about it \u2014 you did not
       press anything, so nothing is said. That rule has its own suite; here
       the question is only whether the room may stop the clock it started,
       and to see a record survive it has to be worth keeping. */
    theirs.startTime = new Date(Date.now() - 20 * 60000).toISOString();
    const stoppedIt = timeAutoStop('stillness');
    /* and the other way: in and straight out again leaves nothing behind */
    const flit = timeAutoStart({categoryId:'meditation', feature:'stillness', what:'a glance'});
    const rows = timeEntries().length;
    const said = timeAutoStop('stillness');
    return {refused: refused === null, stillMine, notStopped: notStopped === null, stillRunning,
      theirs: !!theirs, source: theirs && theirs.source, stoppedIt: !!stoppedIt,
      kept: stoppedIt && Math.round(timeMinutes(stoppedIt)),
      flit: !!flit, flitGone: timeEntries().length === rows - 1, flitQuiet: said === null,
      quiet: !timeRunning()};
  });
  yes('a room asking while you are already timing is refused', rooms.refused, JSON.stringify(rooms));
  yes('  and your timing goes on', rooms.stillMine && rooms.stillRunning, JSON.stringify(rooms));
  yes('  nor can the room stop a clock it did not start', rooms.notStopped, JSON.stringify(rooms));
  yes('with nothing running it starts one, marked as the room’s',
    rooms.theirs && rooms.source === 'auto', JSON.stringify(rooms));
  yes('  and that one it may stop', rooms.stoppedIt && rooms.quiet, JSON.stringify(rooms));
  is('    keeping the twenty minutes it ran for', rooms.kept, 20);
  yes('  a room opened and left again leaves nothing behind',
    rooms.flit && rooms.flitGone, JSON.stringify(rooms));
  yes('    and says nothing about it, because nobody pressed anything',
    rooms.flitQuiet === true, JSON.stringify(rooms));

  console.log('\n13. the day\u2019s shape, and a habit made of minutes');
  const chart = await p.evaluate(() => {
    const day = today();
    /* a block logged by hand over the same hours as a tracked sitting: the
       same hour drawn twice would make the day look twice as full */
    const r = rhythmDay(day);
    r.blocks = [{id:'blk-a', startTime:'09:30', endTime:'10:00', kind:'chores'},
      {id:'blk-b', startTime:'21:00', endTime:'21:30', kind:'chores'}];
    const blocks = barBlocksOn(day);
    return {ids: blocks.map(b => b.id.slice(0, 5)).sort(),
      tracked: blocks.filter(b => b.id.startsWith('time:')).length,
      hand: blocks.filter(b => !b.id.startsWith('time:')).map(b => b.id),
      colours: [...new Set(blocks.filter(b => b.cat).map(b => b.cat.c))].length};
  });
  yes('every tracked sitting is a block on the day\u2019s bar', chart.tracked >= 3, JSON.stringify(chart));
  /* nine-thirty is inside the two hours of reading, so the hand-logged block
     there is the same hour said twice */
  is('  and a block logged by hand over the same hours is not drawn again',
    chart.hand, ['blk-b']);
  yes('  each in its own category\u2019s colour', chart.colours >= 2, String(chart.colours));
  const habit = await p.evaluate(() => {
    S.habits = S.habits || [];
    S.habitLog = S.habitLog || {};
    const h = {id:'hb-time', name:'Read 60 minutes', dimension:'mental', negative:false,
      archived:false, freq:{type:'daily', days:[], count:1}, timeCat:'reading', timeMins:60};
    S.habits.push(h);
    const met = !!habitDone(h, today());
    const share = timeHabitShare(h, today());
    /* correcting the sitting down takes the day back, which a tick could not */
    const e = timeEntries().find(v => v.categoryId === 'reading');
    e.endTime = timeAtOn(today(), '09:30');
    const after = !!habitDone(h, today());
    return {met, share, after, fromClock: (habitDone(h, today()) || {}).fromClock};
  });
  yes('two hours of reading keeps a sixty-minute habit', habit.met, JSON.stringify(habit));
  is('  all the way round', habit.share, 1);
  yes('  and cutting the sitting to half an hour takes the day back',
    habit.after === false, JSON.stringify(habit));

  console.log('\n14. what the rest of the house says about it');
  const said = await p.evaluate(() => {
    const line = timeTodaySay();
    const from = timeDayOf(new Date(Date.now() - 6 * 864e5).toISOString());
    return {line, review: timeReviewLines(from, today())};
  });
  yes('Today says where the day went, in one line', /\dh|\dm/.test(said.line), said.line);
  yes('  and the weekly review says it with a comparison',
    said.review.length >= 1 && /tracked/.test(said.review[0]), JSON.stringify(said.review));
  /* on the day's own views (the rooms under Today draw their own page) */
  await p.evaluate(() => { setTodayView('do'); location.hash = '#/today'; }); await p.waitForTimeout(1200);
  yes('  and it is on the page', await p.evaluate(() => !!document.getElementById('tTime')));

  console.log('\n15. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
