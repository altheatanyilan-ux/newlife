/* smoke129 — a dream is caught on waking, or honestly not caught at all */
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
  const T = await p.evaluate(() => today());
  const today_ = async () => { await p.evaluate(() => { if(location.hash === '#/today') rerender(); else location.hash = '#/today'; }); await p.waitForTimeout(1400); };
  await today_();

  console.log('\n1. the ask sits beside the hour you woke');
  yes('there is a dream button', !!(await p.$('#dreamAdd')));
  yes('  in the same line as "I woke up at"', await p.evaluate(() =>
    !!document.querySelector('.day-edge.waking #dreamAdd')));
  yes('  right after the waking time', await p.evaluate(() => {
    const w = document.querySelector('#wokeAt'), d = document.querySelector('.dream-edge');
    return !!(w.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING);
  }));
  yes('  and a way to say there was none', !!(await p.$('#dreamNone')));
  yes('  it invites rather than reports', /record a dream/.test(
    await p.evaluate(() => document.querySelector('#dreamAdd').textContent)));

  console.log('\n2. saying there was no dream is a record, not a silence');
  await p.click('#dreamNone'); await p.waitForTimeout(1200);
  is('the night is marked', await p.evaluate(d => !!S.checkins[d]?.noDream, T), true);
  yes('  and the line says so', /no dream remembered/.test(
    await p.evaluate(() => document.querySelector('.dream-edge').textContent)), 
    await p.evaluate(() => document.querySelector('.dream-edge').textContent));
  yes('  it can be taken back', !!(await p.$('#dreamNone')));
  await p.click('#dreamNone'); await p.waitForTimeout(1200);
  is('  and then the night is unmarked again', await p.evaluate(d => !!S.checkins[d]?.noDream, T), false);
  yes('  with the invitation back', !!(await p.$('#dreamAdd')));

  console.log('\n3. writing one from the top of the day');
  await p.click('#dreamAdd'); await p.waitForTimeout(800);
  is('the form opens on a dream', await p.evaluate(() => document.querySelector('.typerow .on')?.dataset.t || 
     (document.querySelectorAll('.typerow button').length <= 1 ? 'dream' : 'other')), 'dream');
  await p.fill('#eBody', 'A staircase that kept going down into water.');
  await p.click('#eSave'); await p.waitForTimeout(1300);
  is('it is filed as a dream on today',
     await p.evaluate(d => S.entries.filter(e => e.type === 'dream' && e.occurredAt === d).length, T), 1);
  await today_();
  yes('and the line now counts it', /1 dream written/.test(
    await p.evaluate(() => document.querySelector('.dream-edge').textContent)),
    await p.evaluate(() => document.querySelector('.dream-edge').textContent));

  console.log('\n4. the calendar of nights, under Dreams');
  /* a spread of nights: some dreamt, some blank, most never asked about */
  await p.evaluate(d => {
    const mk = (day, body) => S.entries.push({id:uid(), type:'dream', title:'', body, occurredAt:day,
      createdAt:new Date().toISOString(), media:[],
      links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
      people:[], places:[], emotions:[], tags:[], confidence:'', extra:{}});
    mk(addDays(d,-2), 'Flying over the old house');
    mk(addDays(d,-2), 'And then a second one, the same night');
    mk(addDays(d,-5), 'A door I could not open');
    checkin(addDays(d,-3)).noDream = true;
    checkin(addDays(d,-4)).noDream = true;
    saveNow();
  }, T);
  await p.evaluate(() => { location.hash = '#/journals/dream'; rerender(); }); await p.waitForTimeout(1600);
  yes('the calendar is there', !!(await p.$('.dream-cal')));
  const counts = await p.evaluate(() => ({
    dreamt: document.querySelectorAll('.dc-day.dreamt').length,
    blank:  document.querySelectorAll('.dc-day.blank').length,
    unasked: document.querySelectorAll('.dc-day:not(.dreamt):not(.blank)').length }));
  is('nights dreamt are marked', counts.dreamt, 3);
  is('  nights with nothing to write down are marked differently', counts.blank, 2);
  yes('  and the nights nobody asked about are neither', counts.unasked > 100, JSON.stringify(counts));
  yes('a night with two dreams says two', await p.evaluate(() =>
    [...document.querySelectorAll('.dc-n')].some(n => n.textContent === '2')));
  yes('the tally counts both kinds', /3 dreamt · 2 blank/.test(
    await p.evaluate(() => document.querySelector('.dream-cal .mono').textContent)),
    await p.evaluate(() => document.querySelector('.dream-cal .mono').textContent));
  yes('  and says how often a dream was recalled when asked', /% recalled when asked/.test(
    await p.evaluate(() => document.querySelector('.dream-cal .mono').textContent)));
  yes('there is a legend for the three states', await p.evaluate(() =>
    document.querySelectorAll('.dc-legend .dc-key').length === 3));

  console.log('\n5. the calendar reaches back, and clicking a night does something');
  yes('earlier months can be reached', !!(await p.$('#dcBack')));
  await p.click('#dcBack'); await p.waitForTimeout(1200);
  yes('  and a way back to now appears', !!(await p.$('#dcNow')));
  await p.click('#dcNow'); await p.waitForTimeout(1200);
  const dreamt = await p.$('.dc-day.dreamt');
  await dreamt.click(); await p.waitForTimeout(1000);
  yes('clicking a night that was dreamt opens something',
      !!(await p.$('.overlay')) || !!(await p.$('#panel')));
  await p.evaluate(() => { closeModals(); if(typeof closePanel === 'function') closePanel(); });
  await p.waitForTimeout(500);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke129  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
