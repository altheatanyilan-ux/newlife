/* smoke215 — what should I practise today?

   It is the only question a self-learner has, and a catalogue of ninety-one
   exercises is the worst possible answer to it. A university course answers
   it by having already decided: Siskind's units are about thirty hours each,
   two hours a day for a fortnight, and every unit's assignment page says how
   those minutes divide between fundamentals, drills, tunes and listening.
   Nobody has to choose. That is most of what a course is for.

   THE ARITHMETIC IS WHERE THIS KIND OF THING GOES WRONG, in two specific
   ways, and most of the claims below are about those two.

   The first is telling somebody they are behind before they have had a
   chance to practise. "Where the line is by the end of today" and "what
   should already be done" are different numbers, and using the first to
   judge the second means the tracker greets you on the first morning of a
   stage by saying you are two hours down. So there are claims that day one
   with nothing logged is on track, and that day two with nothing logged is
   not.

   The second is counting the same minutes twice. The room already keeps
   sittings against each exercise, and a session logs activities that BECOME
   sittings. Add both naively and an hour of practice becomes two. Every
   activity a session writes carries the session's id and the stage total
   skips those, and there is a claim that forty minutes logged through the
   session is forty minutes and not eighty.

   WHAT IS NOT CLAIMED. That the minute allocations are the right ones —
   they are Siskind's, out of his assignment sections, and this suite is not
   in a position to second-guess a curriculum. What is claimed is that they
   are all there, that the day's plan adds up to the pace you chose, and that
   the plan changes when your practice does.
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
const near = (n,a,b,tol=1) => Math.abs(a-b)<=tol ? ok(n) : no(n, `${a} vs ${b}`);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const clean = () => p.evaluate(() => {
    const j = jazzPlanState();
    j.stages = {}; j.sessions = []; j.listens = {}; j.session = null;
    S.jazz.progress = {};
    saveNow();
  });
  await clean();

  console.log('\n1. every stage has a plan, and it is Siskind’s minutes');
  const temps = await p.evaluate(() => {
    const out = {gaps: [], rows: []};
    jazzStages().forEach(s => {
      const t = jazzPlanTemplate(s.id);
      if(!t){ out.gaps.push(s.id); return; }
      const mins = sum(t.parts.map(x => x[1]));
      const acts = sum(t.parts.map(x => x[2].length));
      const cats = [...new Set(t.parts.map(x => x[0]))];
      const listening = t.parts.some(x => x[0] === 'listening');
      out.rows.push({id: s.id, hours: t.hours, days: t.days, mins, acts, listening,
        bad: cats.filter(c => !JAZZ_PARTS.some(pt => pt[0] === c)),
        daily: t.daily,
        /* The book's stated minutes are a floor rather than a whole
           session, so the parts sum to less than the day — but never to
           more, and never to something trivial. What must hold is that the
           day times the days reaches the benchmark hours: a plan that
           cannot reach the line underneath it is the one failure mode that
           makes the whole thing worthless. */
        sane: mins >= 30 && mins <= t.daily
          && Math.abs(t.daily * t.days / 60 - t.hours) <= t.hours * 0.3});
    });
    return out;
  });
  is('no stage without a template', temps.gaps, []);
  is('  and all thirteen have one', temps.rows.length, 13);
  is('  every category is one of Siskind’s four',
    temps.rows.filter(r => r.bad.length).map(r => r.id), []);
  is('  every stage listens', temps.rows.filter(r => !r.listening).map(r => r.id), []);
  is('  and every one can actually reach its own benchmark',
    temps.rows.filter(r => !r.sane).map(r => `${r.id}: ${r.mins}/${r.daily}min ${r.hours}h ${r.days}d`), []);
  yes('  with real activities in them, not placeholders',
    temps.rows.every(r => r.acts >= 4), JSON.stringify(temps.rows.map(r => r.acts)));

  console.log('\n2. the pace changes the days, not the hours');
  const paces = await p.evaluate(() => {
    const out = {};
    ['relaxed', 'standard', 'intensive'].forEach(id => {
      jazzPlanState().stages = {};
      const r = jazzStartStage('2', id);
      out[id] = {hours: r.targetHours, days: r.targetDays,
        minutes: jazzPaceMinutes(id, '2'),
        plan: jazzTodaysPlan('2').totalMinutes};
    });
    jazzPlanState().stages = {};
    return out;
  });
  is('the hours are the same whichever pace you choose',
    [paces.relaxed.hours, paces.standard.hours, paces.intensive.hours], [30, 30, 30]);
  yes('  and the days are not',
    paces.relaxed.days > paces.standard.days && paces.standard.days > paces.intensive.days,
    JSON.stringify([paces.relaxed.days, paces.standard.days, paces.intensive.days]));
  near('a relaxed day is about an hour', paces.relaxed.plan, 60, 10);
  near('  a standard day about two', paces.standard.plan, 120, 10);
  near('  and an intensive day about three', paces.intensive.plan, 180, 15);
  /* And a pace is a fraction of THE STAGE'S day, not a fixed number of
     minutes. P0 is a warm-up — half an hour — and setting it to two hours
     would turn a five-minute singing drill into a twenty-minute one. */
  const warm = await p.evaluate(() => {
    jazzPlanState().stages = {};
    jazzStartStage('P0', 'standard');
    const out = {p0: jazzTodaysPlan('P0').totalMinutes,
      p0Minutes: jazzPaceMinutes('standard', 'P0'),
      unitMinutes: jazzPaceMinutes('standard', '2'),
      relaxed: jazzPaceMinutes('relaxed', 'P0')};
    jazzPlanState().stages = {};
    return out;
  });
  near('the warm-up stage asks for half an hour, not two', warm.p0, 30, 8);
  yes('  which is less than a unit of the book asks for',
    warm.p0Minutes * 2 <= warm.unitMinutes, `${warm.p0Minutes} vs ${warm.unitMinutes}`);
  near('  and a relaxed warm-up is a quarter of an hour', warm.relaxed, 15, 3);

  /* The claim this whole thing lives or dies on. */
  console.log('\n3. day one with nothing logged is not "behind"');
  const dayOne = await p.evaluate(() => {
    jazzPlanState().stages = {}; jazzPlanState().sessions = [];
    jazzStartStage('2', 'standard');
    const p1 = jazzPaceOf('2');
    return {day: p1.day, hours: p1.hours, owed: p1.owed, line: p1.expected,
      status: p1.status, said: jazzPaceSaid('2')};
  });
  is('it is day one', dayOne.day, 1);
  is('  nothing has been practised', dayOne.hours, 0);
  is('  and nothing is owed yet', dayOne.owed, 0);
  yes('  though the line for today is real', dayOne.line > 1, `${dayOne.line}`);
  is('  so the status is on track, not behind', dayOne.status, 'on_track');
  yes('  and it says so in words', /Day one/.test(dayOne.said), dayOne.said);

  console.log('\n4. and a day that has closed with nothing in it IS behind');
  const later = await p.evaluate(() => {
    const r = jazzStageRecord('2', true);
    const back = n => { const d = parseDay(today()); d.setDate(d.getDate() - n);
      return timeDayOf(d.toISOString()); };
    const out = {};
    [1, 4].forEach(n => {
      r.startDate = back(n);
      const q = jazzPaceOf('2');
      out['day' + (n + 1)] = {day: q.day, owed: q.owed, status: q.status, said: jazzPaceSaid('2')};
    });
    /* and practising catches it up */
    r.startDate = back(4);
    jazzPlanState().sessions = [{id:'x', stageId:'2', day: today(), minutes: 600, activities: []}];
    out.caught = jazzPaceOf('2').status;
    jazzPlanState().sessions = [];
    r.startDate = today();
    return out;
  });
  is('by day two, one day is owed and nothing was done', later.day2.status, 'behind');
  yes('  and it says what to do about it in minutes a day',
    /minutes a day/.test(later.day2.said), later.day2.said);
  is('by day five it is still behind', later.day5.status, 'behind');
  yes('  and owes more', later.day5.owed > later.day2.owed,
    `${later.day2.owed} then ${later.day5.owed}`);
  is('ten hours in one sitting turns it round', later.caught, 'ahead');

  console.log('\n5. the plan itself');
  const plan = await p.evaluate(() => {
    jazzPlanState().stages = {}; jazzPlanState().sessions = [];
    jazzStartStage('2', 'standard');
    const pl = jazzTodaysPlan('2');
    return {n: pl.required.length,
      cats: [...new Set(pl.required.map(r => r.category))],
      total: pl.totalMinutes,
      allNamed: pl.required.every(r => r.name && r.description),
      keyed: pl.required.filter(r => r.keys.length).length,
      exercised: pl.required.filter(r => r.exercises.length).length,
      realExercises: pl.required.every(r => r.exercises.every(id => !!jazzExercise(id))),
      track: pl.track ? pl.track.artist : null,
      bonus: pl.bonus.length, bonusNames: pl.bonus.map(x => x.name),
      bonusNamed: pl.bonus.every(x => x.name && x.description && x.why)};
  });
  yes('there are blocks to do', plan.n >= 4, `${plan.n}`);
  yes('  covering more than one part of a session', plan.cats.length >= 3, plan.cats.join(','));
  yes('  every one of them named and explained', plan.allNamed === true);
  yes('  some of them naming keys for today', plan.keyed >= 2, `${plan.keyed}`);
  yes('  and some naming exercises from this stage', plan.exercised >= 1, `${plan.exercised}`);
  yes('    all of which are really in the book', plan.realExercises === true);
  yes('  a track to live with', !!plan.track, String(plan.track));
  yes('  and ways to get ahead', plan.bonus >= 2 && plan.bonusNamed === true, `${plan.bonus}`);
  /* each drawn from something the room already knows rather than invented */
  is('    the keys nobody has touched, a checkpoint, something to make, the listening',
    plan.bonusNames, ['The keys nobody has touched', 'A checkpoint you have not claimed',
      'Something to make with it', 'Catch up on the listening']);

  console.log('\n6. the keys rotate, and they rotate through Siskind’s sets');
  const keys = await p.evaluate(() => {
    const G = JazzExerciseGenerator;
    const a = jazzDescentForDay(1), b2 = jazzDescentForDay(2);
    /* the twelve, between the two sets, exactly once each */
    const both = a.keys.concat(b2.keys).sort();
    const stage = jazzStage('2');
    const day1 = jazzKeysForToday(stage.subs, 4, 1);
    const day2 = jazzKeysForToday(stage.subs, 4, 2);
    /* a key you have marked off is dealt last */
    stage.subs.forEach(id => { jazzRecord(id, true).keys['Ab'] = true; });
    const after = jazzKeysForToday(stage.subs, 4, 1);
    stage.subs.forEach(id => { delete jazzRecord(id, true).keys['Ab']; });
    return {setA: a.name, setB: b2.name, both, day1, day2, after,
      twelve: JAZZ_KEY_NAMES.slice().sort(),
      fromA: day1.every(k => a.keys.includes(k)),
      fromB: day2.every(k => b2.keys.includes(k))};
  });
  is('odd days take Set A, even days Set B', [keys.setA, keys.setB], ['A', 'B']);
  is('  and between them they are the twelve', keys.both, keys.twelve);
  yes('today’s keys come from today’s set', keys.fromA === true, keys.day1.join(','));
  yes('  and tomorrow’s from tomorrow’s', keys.fromB === true, keys.day2.join(','));
  yes('a key you already have is dealt last',
    keys.day1.includes('Ab') && !keys.after.includes('Ab'),
    `${keys.day1.join(',')} then ${keys.after.join(',')}`);

  console.log('\n7. a session, and the same minutes counted once');
  const sess = await p.evaluate(async () => {
    jazzPlanState().sessions = []; S.jazz.progress = {};
    const stage = jazzStage('2');
    const ex = stage.subs[0];
    jazzStartSession('2');
    const running = !!jazzSessionOpen();
    jazzSessionAdd({name:'drone', category:'fundamentals', minutes: 15, keys:['C','F']});
    jazzSessionAdd({name:'the descents', category:'rote', minutes: 25, keys:['Ab'],
      exerciseId: ex, rating:'solid'});
    const mid = jazzSessionOpen().activities.length;
    const out = jazzFinishSession({minutes: 40, feeling:'good', notes:'Gb is the join.'});
    return {running, mid, closed: !jazzSessionOpen(),
      minutes: out.minutes, feeling: out.feeling,
      stageMinutes: jazzStageMinutes('2'),
      sittings: jazzRecord(ex).logs.length,
      sittingFrom: (jazzRecord(ex).logs[0] || {}).fromSession === out.id,
      /* and the sitting is NOT counted again on top of the session */
      looseMinutes: jazzAllLogs().filter(l => !l.fromSession).length};
  });
  yes('the session runs', sess.running === true);
  is('  two things were ticked off', sess.mid, 2);
  yes('  and ending it closes it', sess.closed === true);
  is('  forty minutes written down', sess.minutes, 40);
  is('  with how it felt', sess.feeling, 'good');
  is('the stage has forty minutes against it, not eighty', sess.stageMinutes, 40);
  is('  because the activity became a sitting on its exercise', sess.sittings, 1);
  yes('    carrying the session it came from', sess.sittingFrom === true);
  is('    and nothing loose was left to be counted twice', sess.looseMinutes, 0);

  /* a sitting logged the old way, from an exercise page, still counts */
  const loose = await p.evaluate(() => {
    const ex = jazzStage('2').subs[1];
    jazzLogPractice(ex, {minutes: 20, keys:['C'], quality:'improving', markKeys:false});
    return {minutes: jazzStageMinutes('2'), days: jazzStageDays('2').length};
  });
  is('a sitting logged from an exercise page counts too', loose.minutes, 60);
  is('  and today is one day of practice, not two', loose.days, 1);

  console.log('\n8. listening, counted to twenty');
  const listen = await p.evaluate(() => {
    jazzPlanState().listens = {};
    const stage = jazzStage('2');
    const all = jazzStageListening(stage);
    const first = jazzTodaysTrack(stage);
    for(let i = 0; i < 20; i++) jazzMarkListened(first, 'the left hand');
    const after = jazzTodaysTrack(stage);
    /* read before undoing — the undo is the next claim, not this one */
    const plays = jazzListens(first);
    const logged = jazzListenRecord(first).log.length;
    const focus = (jazzListenRecord(first).log[0] || {}).focus;
    const back = jazzUnmarkListened(first);
    return {tracks: all.length, target: JAZZ_LISTEN_TARGET,
      named: all.every(a => a.artist && a.track && a.listenFor),
      plays, moved: after && after.track !== first.track,
      logged, focus, undone: back};
  });
  yes('the stage has tracks to live with', listen.tracks >= 2, `${listen.tracks}`);
  yes('  each one named, with what to listen for', listen.named === true);
  is('twenty is the target', listen.target, 20);
  is('  and twenty were counted', listen.plays, 20);
  yes('  each with a note of what you listened for',
    listen.logged >= 20 && listen.focus === 'the left hand', `${listen.logged}`);
  yes('once one is done the next one comes forward', listen.moved === true);
  is('and a miscount can be taken back', listen.undone, 19);

  console.log('\n9. are you ready to move on — as a suggestion, not a gate');
  const ready = await p.evaluate(() => {
    const before = jazzReadiness('2');
    /* finish it anyway, with nothing met */
    jazzCompleteStage('2');
    const after = jazzStageStatus('2');
    jazzReopenStage('2');
    return {rows: before.rows.length, met: before.met,
      said: before.rows.map(r => r.said),
      finishedAnyway: after === 'completed',
      reopened: jazzStageStatus('2')};
  });
  is('five things to look at', ready.rows, 5);
  yes('  hours, keys, ratings, listening and checkpoints',
    /hours/.test(ready.said[0]) && /keys/.test(ready.said[1]) && /solid/.test(ready.said[2])
    && /Listened/.test(ready.said[3]) && /Checkpoints/.test(ready.said[4]),
    JSON.stringify(ready.said));
  yes('the stage can be finished with none of them met', ready.finishedAnyway === true);
  is('  and opened again afterwards', ready.reopened, 'active');

  console.log('\n10. and it is all on the page');
  const page = await p.evaluate(async () => {
    jazzPlanState().stages = {}; jazzPlanState().sessions = []; jazzPlanState().session = null;
    location.hash = '#/jazz'; rerender(); await new Promise(r => setTimeout(r, 1300));
    const before = {paces: document.querySelectorAll('[data-jzstart]').length,
      head: !!document.querySelector('.jz-head')};
    document.querySelector('[data-jzpace="standard"]').click();
    await new Promise(r => setTimeout(r, 1200));
    location.hash = '#/jazz/plan'; rerender(); await new Promise(r => setTimeout(r, 1300));
    const onPlan = {blocks: document.querySelectorAll('.jz-block').length,
      listen: !!document.querySelector('.jz-block.listen'),
      keys: !!document.querySelector('.jz-bkeys'),
      start: !!document.querySelector('#jzSessStart'),
      said: !!document.querySelector('.jz-pacesaid')};
    document.querySelector('#jzSessStart').click();
    await new Promise(r => setTimeout(r, 1300));
    const inSession = {rows: document.querySelectorAll('.jz-srow').length,
      clock: !!document.querySelector('#jzSessClock'),
      end: !!document.querySelector('#jzSessEnd')};
    location.hash = '#/jazz/progress'; rerender(); await new Promise(r => setTimeout(r, 1300));
    const onProgress = {ready: document.querySelectorAll('.jz-rrow').length,
      weeks: document.querySelectorAll('.jz-week').length,
      stats: !!document.querySelector('.jz-stats'),
      export: !!document.querySelector('#jzExport')};
    jazzAbandonSession();
    return {before, onPlan, inSession, onProgress};
  });
  is('a stage that has not started offers three paces', page.before.paces, 3);
  yes('the plan page draws its blocks', page.onPlan.blocks >= 5, `${page.onPlan.blocks}`);
  yes('  including the listening', page.onPlan.listen === true);
  yes('  and the keys for today', page.onPlan.keys === true);
  yes('  with the pace said in a sentence', page.onPlan.said === true);
  yes('the session page lists what to tick off', page.inSession.rows >= 4, `${page.inSession.rows}`);
  yes('  and runs a clock', page.inSession.clock === true);
  is('the progress page shows the five criteria', page.onProgress.ready, 5);
  is('  six weeks of hours', page.onProgress.weeks, 6);
  yes('  and a way to take the log away', page.onProgress.export === true);

  console.log('\n11. the export is a file somebody could actually read');
  const out = await p.evaluate(() => {
    const raw = jazzExportLog();
    let j = null;
    try { j = JSON.parse(raw); } catch(e){}
    return {parsed: !!j, keys: j ? Object.keys(j).sort() : []};
  });
  yes('it is valid JSON', out.parsed === true);
  is('  with the stages, the sessions, the listening and the progress',
    out.keys, ['exported', 'listens', 'progress', 'sessions', 'stages']);

  console.log('\n12. nothing broke on the way');
  await clean();
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
