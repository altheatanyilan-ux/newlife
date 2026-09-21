/* smoke211 — a sitting shorter than a minute is not a sitting.

   Reported: the day's log kept filling up with records nobody made on
   purpose. Four rooms start the clock by themselves the moment you walk in,
   the pill in the corner starts it on one press, and every one of those is
   undone within seconds when you opened the wrong thing or changed your
   mind. None of it is practice.

   What made the small ones loud rather than merely harmless is the rounding
   rule one file over: the day's totals never round DOWN, because a seven
   minute sitting shown as "0m" reads as the room telling you that you did
   not practise. So a five-second mistake came out of the same function
   looking exactly like a minute of real work, and a day with eleven of them
   claimed eleven minutes that never happened.

   So they are thrown away rather than written. The interesting part of the
   rule is not the threshold, it is the four different ways in and what each
   one owes you afterwards:

   THE STOP BUTTON owes you a word. A button that appears to do nothing is
   worse than a wrong record, so the entry that was thrown away is handed
   back marked `dropped` and the dock says so.

   A ROOM STOPPING ITS OWN CLOCK owes you nothing, because you did not press
   anything: opening the study deck and leaving again should be silent.

   THE LOG FORM refuses, and says why, rather than closing on a record it did
   not make.

   AND EDITING AN EXISTING ENTRY IS LEFT ALONE, deliberately. Correcting a
   sitting down to thirty seconds is somebody saying what happened, not a
   clock being wrong, and deleting the row out from under the form somebody
   is typing into is a worse surprise than a short record. That boundary is
   claimed here so it is a decision rather than an oversight.

   The threshold is "less than a minute", so a minute exactly is kept. That
   is claimed too, because the off-by-one in the other direction would throw
   away the shortest real sittings there are.
 */
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
  const p = await (await b.newContext({viewport:{width:1400, height:900}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  /* an empty log to count against, and a clock that says the minutes as they
     are so nothing here is measuring the rounding instead of the rule */
  const clean = await p.evaluate(() => {
    timeState();
    S.timeEntries.length = 0;
    timeSettings().round = 1;
    timeSettings().widget = true;
    S.nods = []; S.skills = S.skills || [];
    location.hash = '#/today'; rerender();
    return {entries: S.timeEntries.length, running: !!timeRunning()};
  });
  is('the log starts empty', clean, {entries: 0, running: false});

  console.log('\n1. the stop button');
  const press = await p.evaluate(async () => {
    const out = {};
    startTimer({what:'a wrong turn'});
    out.started = !!timeRunning();
    const gone = stopTimer();
    out.saidSo = !!(gone && gone.dropped);
    out.left = S.timeEntries.length;
    out.stillRunning = !!timeRunning();
    /* and the same clock, sat at for a while */
    const e = startTimer({what:'the coda'});
    e.startTime = new Date(Date.now() - 12 * 60000).toISOString();
    const kept = stopTimer();
    out.keptSaidSo = !!(kept && kept.dropped);
    out.after = S.timeEntries.length;
    out.minutes = Math.round(timeMinutes(S.timeEntries[0] || {}));
    out.what = (S.timeEntries[0] || {}).what;
    return out;
  });
  yes('the clock did run', press.started === true);
  yes('a timer stopped the moment it started leaves nothing behind', press.left === 0, `${press.left} entries`);
  yes('  and hands back what it threw away, marked as thrown away', press.saidSo === true);
  yes('  and the clock is free again', press.stillRunning === false);
  yes('twelve minutes is still a sitting', press.after === 1, `${press.after} entries`);
  is('  and it is the one that was sat at', press.what, 'the coda');
  is('  with its minutes intact', press.minutes, 12);
  yes('  and it is not marked as thrown away', press.keptSaidSo === false);

  /* the words, off the real button rather than off the function */
  const said = await p.evaluate(async () => {
    const toasts = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent.trim());
    document.querySelectorAll('#toasts .toast').forEach(t => t.remove());
    paintTimeDock();
    document.getElementById('tdQuick').click();
    await new Promise(r => setTimeout(r, 200));
    document.getElementById('tdStop').click();
    await new Promise(r => setTimeout(r, 200));
    const short = toasts();
    document.querySelectorAll('#toasts .toast').forEach(t => t.remove());
    document.getElementById('tdQuick').click();
    await new Promise(r => setTimeout(r, 150));
    timeRunning().startTime = new Date(Date.now() - 40 * 60000).toISOString();
    document.getElementById('tdStop').click();
    await new Promise(r => setTimeout(r, 200));
    return {short, long: toasts()};
  });
  yes('the dock says the short one was not written down',
    said.short.length === 1 && /not written down/i.test(said.short[0]), JSON.stringify(said.short));
  yes('  and still says how long a real one was',
    said.long.length === 1 && /40m|0h ?40|40 m/i.test(said.long[0]), JSON.stringify(said.long));

  console.log('\n2. nothing is credited for what was not kept');
  const credit = await p.evaluate(async () => {
    S.timeEntries.length = 0; S.nods = [];
    S.skills = (S.skills || []).filter(s => s.id !== 'sk211');
    S.skills.push({id:'sk211', name:'Piano', hours: 0, archived:false});
    S.projects = S.projects || [];
    S.projects = S.projects.filter(x => x.id !== 'pj211');
    S.projects.push({id:'pj211', name:'A Record', status:'active'});
    timeSettings().autoNods = true;
    const hook = {linkedType:'skill', linkedId:'sk211', what:'scales'};
    startTimer(hook); stopTimer();                       /* seconds */
    const shortHours = +(byId(S.skills, 'sk211').hours || 0);
    const p1 = startTimer({linkedType:'project', linkedId:'pj211', what:'a page'});
    p1.startTime = new Date(Date.now() - 30 * 60000).toISOString();
    stopTimer();
    startTimer({linkedType:'project', linkedId:'pj211', what:'a glance'});
    stopTimer();                                          /* seconds */
    const e2 = startTimer(hook);
    e2.startTime = new Date(Date.now() - 60 * 60000).toISOString();
    stopTimer();
    return {shortHours, hours: +(byId(S.skills, 'sk211').hours || 0),
      nods: S.nods.filter(n => n.projectId === 'pj211').length,
      entries: S.timeEntries.length};
  });
  is('a few seconds on a skill adds no hours to it', credit.shortHours, 0);
  is('  and an hour on it adds an hour', credit.hours, 1);
  is('a few seconds on a project leaves no nod', credit.nods, 1);
  is('  and only the two real sittings were written', credit.entries, 2);

  console.log('\n3. writing one down by hand');
  const hand = await p.evaluate(() => {
    S.timeEntries.length = 0;
    const at = (h, m) => timeAtOn(today(), `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    const half = logTime({what:'half a minute', startTime: at(9, 0),
      endTime: new Date(Date.parse(at(9, 0)) + 30000).toISOString()});
    const zero = logTime({what:'nothing at all', startTime: at(10, 0), minutes: 0});
    const edge = logTime({what:'exactly a minute', startTime: at(11, 0), minutes: 1});
    const real = logTime({what:'reading', startTime: at(12, 0), minutes: 45});
    return {half, zero, edge: !!edge, real: !!real,
      kept: S.timeEntries.map(e => e.what)};
  });
  is('thirty seconds typed in is refused', hand.half, null);
  is('and so is nothing at all', hand.zero, null);
  yes('a minute exactly is kept — the rule is LESS than a minute', hand.edge === true);
  yes('and three quarters of an hour is kept', hand.real === true);
  is('  so only the two real ones are in the log', hand.kept, ['exactly a minute', 'reading']);

  /* and the same three, through the form somebody actually types into. The
     functions above are the rule; this is the door. A form that closes on a
     record it did not make is the version of this bug that looks like the
     entry simply vanished. */
  console.log('\n3b. and through the form itself');
  const form = await p.evaluate(async () => {
    S.timeEntries.length = 0;
    document.querySelectorAll('#toasts .toast').forEach(t => t.remove());
    const fill = (what, from, to, mins) => {
      const set = (sel, v) => { const n = document.querySelector(sel); if(n && v != null) n.value = v; };
      set('#teWhat', what); set('#teFrom', from); set('#teTo', to); set('#teMins', mins);
    };
    openTimeEntryModal(null, today());
    await new Promise(r => setTimeout(r, 300));
    fill('nothing much', '09:00', '', '0');
    document.querySelector('#teSave').click();
    await new Promise(r => setTimeout(r, 300));
    const refused = {entries: S.timeEntries.length,
      open: !!document.querySelector('#teSave'),
      said: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent.trim())};
    /* the same form, now given something worth keeping — and if it closed on
       the refusal there is nothing left to press, which is itself the answer */
    fill('a proper sitting', '09:00', '', '30');
    const again = document.querySelector('#teSave');
    if(again) again.click();
    await new Promise(r => setTimeout(r, 400));
    return {refused, entries: S.timeEntries.length,
      open: !!document.querySelector('#teSave'),
      what: (S.timeEntries[0] || {}).what,
      mins: Math.round(timeMinutes(S.timeEntries[0] || {}))};
  });
  is('the form writes nothing when what it was given is under a minute', form.refused.entries, 0);
  yes('  and stays open rather than closing on a record it did not make', form.refused.open === true);
  yes('  and says why',
    form.refused.said.length === 1 && /under a minute/i.test(form.refused.said[0]),
    JSON.stringify(form.refused.said));
  yes('  and the same form still saves half an hour', form.entries === 1 && form.open === false,
    JSON.stringify({entries: form.entries, open: form.open}));
  is('    as half an hour', form.mins, 30);
  is('    of what it was told', form.what, 'a proper sitting');

  /* and the boundary again, through the door: the edit branch of the same
     form. This is the one that must NOT drop the row. */
  const shrink = await p.evaluate(async () => {
    S.timeEntries.length = 0;
    const e = logTime({what:'a long one', startTime: timeAtOn(today(), '14:00'), minutes: 90});
    openTimeEntryModal(e.id);
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#teTo').value = document.querySelector('#teFrom').value;
    document.querySelector('#teSave').click();
    await new Promise(r => setTimeout(r, 400));
    return {there: !!byId(S.timeEntries, e.id), count: S.timeEntries.length,
      mins: Math.round(timeMinutes(byId(S.timeEntries, e.id) || {})),
      open: !!document.querySelector('#teSave')};
  });
  yes('shrinking an existing sitting to nothing through the form keeps the row',
    shrink.there === true && shrink.count === 1, JSON.stringify(shrink));
  is('  at the nothing it was shrunk to', shrink.mins, 0);
  yes('  and the form closes, because it did what it was asked', shrink.open === false);

  console.log('\n4. a room opened and left again');
  const room = await p.evaluate(async () => {
    S.timeEntries.length = 0;
    timeAutoStart({feature:'study', what:'a review', categoryId:'study'});
    const quiet = timeAutoStop('study');
    const afterQuiet = S.timeEntries.length;
    const e = timeAutoStart({feature:'study', what:'a real review', categoryId:'study'});
    e.startTime = new Date(Date.now() - 20 * 60000).toISOString();
    const loud = timeAutoStop('study');
    return {quiet, afterQuiet, loud: !!loud, dropped: !!(loud && loud.dropped),
      after: S.timeEntries.length};
  });
  is('walking in and straight out again leaves nothing', room.afterQuiet, 0);
  is('  and says nothing, because nobody pressed anything', room.quiet, null);
  yes('twenty minutes in the room is kept', room.loud === true && room.dropped === false);
  is('  and is the only thing in the log', room.after, 1);

  console.log('\n5. starting a second clock does not write the first one down');
  const swap = await p.evaluate(() => {
    S.timeEntries.length = 0;
    startTimer({what:'the wrong thing'});
    startTimer({what:'the right thing'});
    return {count: S.timeEntries.length, running: (timeRunning() || {}).what,
      names: S.timeEntries.map(e => e.what)};
  });
  is('the abandoned one is gone rather than logged as seconds', swap.names, ['the right thing']);
  is('  and the new one is what is running', swap.running, 'the right thing');
  is('  with nothing else left over', swap.count, 1);

  /* THE BOUNDARY, ON PURPOSE. Correcting an entry is not making one: the row
     already exists, somebody is looking at it, and deleting it out from under
     the form is a worse surprise than a thirty-second record they asked for.
     So the rule is about what gets WRITTEN, not about what is allowed to
     exist. If this claim ever fails it means the rule spread into editing,
     which is a decision to make deliberately rather than by accident. */
  console.log('\n6. correcting an entry down is still allowed');
  const edit = await p.evaluate(() => {
    S.timeEntries.length = 0;
    const at = timeAtOn(today(), '14:00');
    const e = logTime({what:'a long one', startTime: at, minutes: 90});
    e.endTime = new Date(Date.parse(e.startTime) + 30000).toISOString();
    timeAfterSave(e); saveNow();
    return {there: !!byId(S.timeEntries, e.id), mins: Math.round(timeMinutes(e) * 60)};
  });
  yes('an existing entry corrected to thirty seconds stays', edit.there === true);
  is('  at the thirty seconds it was corrected to', edit.mins, 30);

  console.log('\n7. the runaway closer is untouched by any of this');
  const away = await p.evaluate(() => {
    S.timeEntries.length = 0;
    const e = startTimer({what:'left running overnight'});
    e.startTime = new Date(Date.now() - 14 * 3600 * 1000).toISOString();
    const closed = closeRunawayTimer();
    return {closed: !!closed, hours: Math.round(timeMinutes(S.timeEntries[0] || {}) / 60),
      count: S.timeEntries.length};
  });
  yes('a timer left running all night is still closed at six hours',
    away.closed === true && away.hours === 6, JSON.stringify(away));
  is('  and kept', away.count, 1);

  console.log('\n8. nothing broke on the way');
  await p.evaluate(() => { S.timeEntries.length = 0;
    S.skills = (S.skills || []).filter(s => s.id !== 'sk211');
    S.projects = (S.projects || []).filter(x => x.id !== 'pj211');
    S.nods = (S.nods || []).filter(n => n.projectId !== 'pj211'); saveNow(); });
  is('no errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
