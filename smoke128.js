/* smoke128 — an entry times itself, and Today totals the day's writing */
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
  const p = await b.newPage({viewport:{width:1400, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  console.log('\n1. the clock counts only the time really spent');
  /* driven directly rather than through the wall clock: a test that waits out
     a two-minute idle cut would take two minutes */
  const run = await p.evaluate(async () => {
    const box = document.createElement('div'); document.body.appendChild(box);
    const st = startWritingClock(box);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    await wait(320);
    const writing = st.elapsedMs();
    /* the window loses focus — the person has gone somewhere else */
    window.dispatchEvent(new Event('blur'));
    await wait(400);
    const afterAway = st.elapsedMs();
    /* they come back and type */
    window.dispatchEvent(new Event('focus'));
    box.dispatchEvent(new KeyboardEvent('keydown', {bubbles:true}));
    await wait(300);
    const total = st.stop().elapsedMs();
    box.remove();
    return {writing, afterAway, total};
  });
  yes('it runs while the writing is happening', run.writing >= 250, JSON.stringify(run));
  yes('  it stops the moment the window is left',
      run.afterAway - run.writing < 120, `counted ${run.afterAway - run.writing}ms of a 400ms absence`);
  yes('  and runs again on the next keystroke',
      run.total - run.afterAway >= 200, `counted ${run.total - run.afterAway}ms of 300ms back at the desk`);
  yes('  so the total is the time spent, not the time elapsed',
      run.total < 900, `${run.total}ms across a span of about 1020ms`);

  console.log('\n2. writing an entry records how long it took');
  const before = await p.evaluate(() => S.entries.length);
  await p.evaluate(() => EntryActions.quickNote()); await p.waitForTimeout(700);
  await p.fill('#eBody', 'Something worth keeping.');
  await p.waitForTimeout(700);
  await p.click('#eSave'); await p.waitForTimeout(1200);
  is('the entry is saved', await p.evaluate(() => S.entries.length), before + 1);
  const w = await p.evaluate(() => S.entries[S.entries.length-1].extra.writing);
  yes('it carries a writing record', !!w, JSON.stringify(w));
  yes('  saying when it was begun', !!w?.startedAt, String(w?.startedAt));
  yes('  with a session filed under today',
      (w?.sessions || []).some(s => s.on === new Date().toISOString().slice(0,10)), JSON.stringify(w));
  yes('  holding a real number of seconds', (w?.sessions?.[0]?.seconds || 0) >= 1, JSON.stringify(w?.sessions));

  console.log('\n3. Today totals it, however many entries there were');
  /* two more, with known times, so the total is checkable */
  const T = await p.evaluate(() => today());
  await p.evaluate(d => {
    const mk = (title, secs) => S.entries.push({id:uid(), type:'reflection', title, body:'x',
      occurredAt:d, createdAt:new Date().toISOString(), media:[],
      links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
      people:[], places:[], emotions:[], tags:[], confidence:'',
      extra:{writing:{startedAt:new Date().toISOString(), sessions:[{on:d, seconds:secs}]}}});
    mk('The long one', 3000);      // 50m
    mk('The short one', 900);      // 15m
    /* and one written yesterday, which today must not claim */
    S.entries.push({id:uid(), type:'reflection', title:'Yesterday', body:'x', occurredAt:d,
      createdAt:new Date().toISOString(), media:[],
      links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
      people:[], places:[], emotions:[], tags:[], confidence:'',
      extra:{writing:{startedAt:'', sessions:[{on: addDays(d,-1), seconds: 9999}]}}});
    saveNow();
  }, T);
  const mine = await p.evaluate(() => S.entries[0]?.extra?.writing?.sessions?.[0]?.seconds || 0);
  const sum = await p.evaluate(() => writingSecondsOn());
  yes('the day\'s seconds add up', sum >= 3900, String(sum));
  yes('  and yesterday is not counted in it', sum < 9999, String(sum));
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1500);
  yes('Today shows a tally', !!(await p.$('.write-tally')));
  const shown = await p.evaluate(() => document.querySelector('.write-total')?.textContent.trim());
  yes('  in hours and minutes', /^\d+h( \d+m)?$|^\d+m$/.test(shown || ''), String(shown));
  yes('  saying how many entries it is across', await p.evaluate(() =>
    /entries today/.test(document.querySelector('.write-tally').textContent)));
  const rows = await p.$$eval('.write-row .wr-name', n => n.map(x => x.textContent.trim()));
  yes('  and listing them', rows.includes('The long one') && rows.includes('The short one'), rows.join(' | '));
  yes('  but not yesterday\'s', !rows.includes('Yesterday'), rows.join(' | '));

  console.log('\n4. a day with no writing says nothing at all');
  await p.evaluate(() => { S.entries.forEach(e => { if(e.extra?.writing) delete e.extra.writing; }); saveNow(); rerender(); });
  await p.waitForTimeout(1100);
  yes('no tally, no reproach', !(await p.$('.write-tally')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke128  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
