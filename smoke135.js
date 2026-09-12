/* smoke135 — a day ends when you sleep, not at midnight */
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
  const p = await b.newPage({viewport:{width:1400, height:1300}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  console.log('\n1. the boundary decides which day it is');
  is('four in the morning by default', await p.evaluate(() => dayBoundaryHour()), 4);
  const probe = await p.evaluate(() => {
    const at = h => { const d = new Date(2026, 8, 13, h, 30); return effectiveDate(d); };
    return {one: at(1), three: at(3), five: at(5), nine: at(9), eleven: at(23)};
  });
  is('half past one is still the twelfth', probe.one.date, '2026-09-12');
  is('  and says so', probe.one.isLateNight, true);
  is('  while the clock says the thirteenth', probe.one.clockDate, '2026-09-13');
  is('half past three is still the twelfth', probe.three.date, '2026-09-12');
  is('half past five is the thirteenth', probe.five.date, '2026-09-13');
  is('  and is not late night', probe.five.isLateNight, false);
  is('the morning is the thirteenth', probe.nine.date, '2026-09-13');
  is('and so is the evening', probe.eleven.date, '2026-09-13');

  console.log('\n2. the boundary can be moved, and midnight restores the old behaviour');
  await p.evaluate(() => { S.settings.dayBoundaryHour = 0; saveNow(); });
  is('at midnight, one in the morning is a new day',
     await p.evaluate(() => effectiveDate(new Date(2026, 8, 13, 1, 30)).date), '2026-09-13');
  await p.evaluate(() => { S.settings.dayBoundaryHour = 6; saveNow(); });
  is('at six, five in the morning is still yesterday',
     await p.evaluate(() => effectiveDate(new Date(2026, 8, 13, 5, 0)).date), '2026-09-12');
  await p.evaluate(() => { S.settings.dayBoundaryHour = 4; saveNow(); });

  console.log('\n3. everything that asks what day it is gets the same answer');
  /* today() is the definition, not a second function beside it, so the 278
     places that ask cannot disagree with each other */
  const agree = await p.evaluate(() => {
    const real = Date;
    /* pretend it is 1:30am */
    const fake = new Date(2026, 8, 13, 1, 30);
    const orig = Date.now; Date.now = () => fake.getTime();
    const OrigDate = window.Date;
    window.Date = class extends OrigDate { constructor(...a){ super(...(a.length ? a : [fake.getTime()])); } static now(){ return fake.getTime(); } };
    const out = {today: today(), effective: effectiveDate().date, late: isLateNight(), clock: clockDay()};
    window.Date = OrigDate; Date.now = orig;
    return out;
  });
  is('today() answers with the effective day', agree.today, agree.effective);
  is('  which is the twelfth', agree.today, '2026-09-12');
  is('  it knows it is late', agree.late, true);
  is('  and the calendar date is still available', agree.clock, '2026-09-13');

  console.log('\n4. the sleep chart draws a small-hours bedtime at the end of a day');
  const plotted = await p.evaluate(() => {
    const d = addDays(today(), -1);
    const r = rhythmDay(d); r.wakeTime = '07:30'; r.sleepTime = '01:15'; rhythmCompute(r); saveNow();
    return weekShapeRow(d);
  });
  yes('a 1:15am bedtime plots past 24, not back at 1',
      plotted.close > 24 && plotted.close < 26, String(plotted.close));
  is('  so the night reads as a real length', Math.round(plotted.awake * 10) / 10, 17.8);
  /* and a bedtime logged with no wake time beside it — the case that spiked */
  const alone = await p.evaluate(() => {
    const d = addDays(today(), -3);
    const r = rhythmDay(d); r.wakeTime = ''; r.sleepTime = '01:30'; rhythmCompute(r); saveNow();
    return weekShapeRow(d);
  });
  yes('and one logged on its own still plots past 24', alone.close > 24, String(alone.close));

  console.log('\n5. Today says so when you are up past midnight');
  /* the wall clock decides this, so set it: a second page opened at 1:30am */
  const p2 = await b.newPage({viewport:{width:1400, height:1400}});
  const errs2 = [];
  p2.on('pageerror', e => errs2.push('pageerror: ' + e.message));
  await p2.clock.install({time: new Date(2026, 8, 13, 1, 30)});
  await p2.goto(FILE); await p2.waitForTimeout(1000);
  if(await p2.$('#frGo')){ await p2.click('#frGo'); await p2.waitForTimeout(2000); }
  await p2.evaluate(() => { S.settings.dayBoundaryHour = 4; delete S.settings.dayStartedEarly;
    saveNow(); location.hash = '#/today'; rerender(); });
  await p2.waitForTimeout(1600);
  is('at half past one it is still yesterday', await p2.evaluate(() => today()), '2026-09-12');
  is('  and the clock knows it is the thirteenth', await p2.evaluate(() => clockDay()), '2026-09-13');
  yes('the date carries a late-night mark', !!(await p2.$('.late-night')));
  yes('  which names the day it is holding', /still/.test(
    (await p2.evaluate(() => document.querySelector('.late-night')?.textContent)) || ''));
  yes('a wind-down card comes forward', !!(await p2.$('.wind-down')));
  yes('  offering to log a bedtime', !!(await p2.$('#wdBed')));
  yes('  and to start a new day by hand', !!(await p2.$('#wdNewDay')));
  yes('  saying which day the bedtime lands on', await p2.evaluate(() =>
    /still your/.test(document.querySelector('.wind-down').textContent)));
  yes('the morning check-in folds itself away rather than asking to start a morning',
      await p2.evaluate(() => !document.querySelector('#t-checkin')?.open));
  /* a habit ticked at half past one counts for the day you have been living */
  const hid = await p2.evaluate(() => habList()[0]?.id);
  if(hid){
    await p2.evaluate(i => habSetEntry(byId(S.habits, i), today(), {status:'completed'}), hid);
    is('a habit kept at 1:30am counts for yesterday by the clock',
       await p2.evaluate(i => !!S.habitLog['2026-09-12']?.[i], hid), true);
    is('  and not for the calendar day',
       await p2.evaluate(i => !!S.habitLog['2026-09-13']?.[i], hid), false);
  }
  await p2.click('#wdNewDay'); await p2.waitForTimeout(1400);
  is('starting a new day crosses the line', await p2.evaluate(() => isLateNight()), false);
  is('  and today is the calendar day', await p2.evaluate(() => today()), '2026-09-13');
  yes('  the wind-down is gone with it', !(await p2.$('.wind-down')));
  yes('  and the bedtime was recorded against the day that ended', await p2.evaluate(() =>
    !!rhythmDay('2026-09-12').sleepTime));
  if(errs2.length){ bad += errs2.length; console.log('  page errors:', errs2.slice(0,3)); }
  await p2.close();
  await p.evaluate(() => { S.settings.dayBoundaryHour = 4; delete S.settings.dayStartedEarly; saveNow(); });

  console.log('\n6. the setting is on the Settings page');
  await p.evaluate(() => { location.hash = '#/settings'; rerender(); }); await p.waitForTimeout(1300);
  yes('there is a Day & sleep section', await p.evaluate(() =>
    /Day & sleep/i.test(document.querySelector('#main').textContent)));
  yes('  with the hour to choose', !!(await p.$('#sBoundary')));
  is('  showing the current one', await p.evaluate(() => document.querySelector('#sBoundary').value), '4');
  yes('  offering midnight through six', await p.evaluate(() =>
    document.querySelectorAll('#sBoundary option').length === 7));
  await p.selectOption('#sBoundary', '2'); await p.waitForTimeout(900);
  is('  and choosing one keeps it', await p.evaluate(() => S.settings.dayBoundaryHour), 2);
  await p.evaluate(() => { S.settings.dayBoundaryHour = 4; saveNow(); });

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke135  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
