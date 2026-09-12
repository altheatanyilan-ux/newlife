/* smoke131 — habits: two kinds, three views, and a habit you can change */
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
  const p = await b.newPage({viewport:{width:1500, height:1300}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const room = async () => { await p.evaluate(() => { S._planRoom = 'habits';
    if(location.hash === '#/planning') rerender(); else location.hash = '#/planning'; }); await p.waitForTimeout(1500); };
  await room();

  console.log('\n1. a habit you are breaking is actually on the page');
  /* it was filtered out of every list in the room, so whatever you typed into
     the form was saved and then never seen again */
  const nid = await p.evaluate(() => {
    const h = habitDefaults ? habitDefaults() : null;
    const x = Object.assign(h || {}, {id:uid(), name:'No scrolling after ten', negative:true,
      standard:'nothing after 22:00', dimension:'mental', kind:'recovery',
      identity:'I am someone who chooses what enters my mind.', archived:false,
      freq:{type:'daily', days:[], count:1}, links:{values:[],skills:[],projects:[]}});
    S.habits.push(x); habDefaults(x); saveNow(); return x.id;
  });
  await room();
  yes('it has a card', await p.evaluate(i => !!document.querySelector(`[data-hbcard="${i}"]`), nid));
  yes('  marked as one you are breaking', await p.evaluate(i =>
    document.querySelector(`[data-hbcard="${i}"]`).classList.contains('breaking'), nid));
  yes('  with what you typed on it', await p.evaluate(i =>
    document.querySelector(`[data-hbcard="${i}"]`).textContent.includes('No scrolling after ten'), nid));
  yes('  and its identity line', await p.evaluate(i =>
    /chooses what enters my mind/.test(document.querySelector(`[data-hbcard="${i}"]`).textContent), nid));
  yes('  counting days clean, not days done', await p.evaluate(i =>
    /days clean/.test(document.querySelector(`[data-hbcard="${i}"]`).textContent), nid));

  console.log('\n2. a habit can be changed and taken away');
  await p.evaluate(i => openHabitPanel(i), nid); await p.waitForTimeout(1000);
  yes('the panel opens', !!(await p.$('.hb-panel')));
  yes('  with a way to edit it', !!(await p.$('#hpEdit')));
  yes('  a way to archive it', !!(await p.$('#hpArchive')));
  yes('  and a way to delete it', !!(await p.$('#hpDel')));
  await p.fill('#hpName', 'No scrolling after nine'); await p.waitForTimeout(900);
  is('renaming it works', await p.evaluate(i => byId(S.habits, i).name, nid), 'No scrolling after nine');
  await p.click('#hpArchive'); await p.waitForTimeout(1100);
  is('archiving it works', await p.evaluate(i => !!byId(S.habits, i).archived, nid), true);
  yes('  and it is restorable from the room', !!(await p.$(`[data-hbrestore="${nid}"]`)));
  /* the archived list is folded away, which is right — open it first */
  await p.evaluate(() => { const d = document.querySelector('.hb-arch'); if(d) d.open = true; });
  await p.waitForTimeout(300);
  await p.click(`[data-hbrestore="${nid}"]`); await p.waitForTimeout(1000);
  is('  restored', await p.evaluate(i => !!byId(S.habits, i).archived, nid), false);

  console.log('\n3. checking in asks the right question for the kind');
  await p.evaluate(i => openHabitCheckIn(i), nid); await p.waitForTimeout(800);
  const opts = await p.$$eval('.hb-cis', n => n.map(x => x.textContent.trim()));
  yes('a breaking habit is asked clean / resisted / slipped',
      opts.some(o => /Clean day/.test(o)) && opts.some(o => /Resisted/.test(o)) && opts.some(o => /Slipped/.test(o)),
      opts.join(' | '));
  await p.click('[data-cis="resisted"]'); await p.waitForTimeout(400);
  yes('  choosing resisted asks how strong it was', await p.evaluate(() =>
    !document.querySelector('#ciResist').hidden));
  await p.click('[data-cii="4"]');
  await p.fill('#ciNote', 'Put the phone in the drawer.');
  await p.click('#ciSave'); await p.waitForTimeout(1100);
  const e = await p.evaluate(i => S.habitLog[today()][i], nid);
  is('it is recorded as resisted', e.status, 'resisted');
  is('  with the intensity', e.intensity, 4);
  is('  and what you did', e.note, 'Put the phone in the drawer.');
  yes('  and it goes in the urge log', await p.evaluate(i => byId(S.habits, i).urgeLog.length === 1, nid));

  const bid = await p.evaluate(() => habBuilding()[0]?.id);
  await p.evaluate(i => openHabitCheckIn(i), bid); await p.waitForTimeout(800);
  const bopts = await p.$$eval('.hb-cis', n => n.map(x => x.textContent.trim()));
  yes('a building habit is asked completed / partial / skipped',
      bopts.some(o => /Completed/.test(o)) && bopts.some(o => /Partial/.test(o)), bopts.join(' | '));
  yes('  and how it left you', !!(await p.$('[data-cim="3"]')) && !!(await p.$('[data-cie="3"]')));
  await p.click('[data-cim="4"]'); await p.click('[data-cie="3"]');
  await p.fill('#ciDur', '25');
  await p.click('#ciSave'); await p.waitForTimeout(1100);
  const be = await p.evaluate(i => S.habitLog[today()][i], bid);
  is('it is recorded', be.status, 'completed');
  is('  with the mood', be.mood, 4);
  is('  the energy', be.energy, 3);
  is('  and the minutes', be.minutes, 25);
  is('  and the ring on Today reads it too', be.level, 'full');

  console.log('\n4. three ways of looking at them');
  await room();
  yes('there are three views', await p.evaluate(() => document.querySelectorAll('[data-hbview]').length === 3));
  yes('  the dashboard is one', !!(await p.$('.hb-grid')));
  yes('  with the day\'s energy across the four dimensions',
      await p.evaluate(() => document.querySelectorAll('.hb-dot').length === 4));
  await p.click('[data-hbview="today"]'); await p.waitForTimeout(1000);
  yes('Today is a single column of what is due', !!(await p.$('.hb-focus')));
  yes('  grouped by when in the day', await p.evaluate(() => document.querySelectorAll('.hb-tgroup').length > 0));
  await p.click('[data-hbview="analytics"]'); await p.waitForTimeout(1100);
  yes('Analytics has ninety days of heat', !!(await p.$('.hb-heat')));
  yes('  a health score per habit', await p.evaluate(() => document.querySelectorAll('.hb-hrow').length > 0));
  yes('  the four dimensions spent and renewed', await p.evaluate(() => document.querySelectorAll('.hb-q').length === 4));
  yes('  and the longest runs', await p.evaluate(() => /longest runs/i.test(document.querySelector('.hb-an').textContent)));
  await p.click('[data-hbview="dashboard"]'); await p.waitForTimeout(900);

  console.log('\n5. filters, and the difference between the two kinds');
  await p.click('[data-hbf="type:breaking"]'); await p.waitForTimeout(900);
  const shown = await p.$$eval('[data-hbcard]', n => n.map(x => x.dataset.hbcard));
  yes('filtering to breaking shows only those',
      shown.length && shown.every(async () => true) && shown.includes(nid), shown.join(','));
  is('  and only those', await p.evaluate(ids => ids.every(i => byId(S.habits, i).negative),
     shown), true);
  await p.click('[data-hbf="type:building"]'); await p.waitForTimeout(900);
  is('filtering to building excludes it',
     await p.evaluate(i => !document.querySelector(`[data-hbcard="${i}"]`), nid), true);
  await p.click('[data-hbf="clear:"]'); await p.waitForTimeout(900);
  yes('clearing brings everything back', await p.evaluate(i =>
    !!document.querySelector(`[data-hbcard="${i}"]`), nid));

  console.log('\n6. a streak that means the right thing');
  /* for a breaking habit the number is days since the last slip */
  await p.evaluate(i => { const h = byId(S.habits, i);
    for(let k = 1; k <= 5; k++) habSetEntry(h, addDays(today(), -k), {status:'clean'});
    saveNow(); }, nid);
  const st1 = await p.evaluate(i => habStreak(byId(S.habits, i)).cur, nid);
  yes('five clean days and today makes six', st1 >= 6, String(st1));
  await p.evaluate(i => habSetEntry(byId(S.habits, i), addDays(today(), -3), {status:'slipped'}), nid);
  const st2 = await p.evaluate(i => habStreak(byId(S.habits, i)).cur, nid);
  yes('  a slip three days ago cuts it back to three', st2 === 3, String(st2));
  yes('  but the best run is remembered', await p.evaluate(i => habStreak(byId(S.habits, i)).best >= 2, nid));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke131  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
