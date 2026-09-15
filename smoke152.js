/* smoke152 — a save you wait for has actually happened
   Two faults sat behind one symptom: a reorder made at the wrong moment was
   silently dropped, and it came back about one time in three.
     · saveNow() handed back the save already in flight when one was running,
       so `await saveNow()` returned before the caller's own change was on
       disk, and flushSave() waited one pass rather than until it was quiet.
     · persist() worked out what it had written AFTER the write, from the live
       arrays — so a change made while the transaction was in the air was
       recorded as already written, and the next pass skipped it as clean. */
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
  const c = await b.newContext();
  const p = await c.newPage({viewport:{width:1300, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }
  await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1200);

  const inDB = () => p.evaluate(async () => (await db.tasks.toArray())
    .filter(t => /^probe/.test(t.text)).sort((x,y) => (x.order||0)-(y.order||0)).map(t => t.text).join(','));

  console.log('\n1. a change made while a save is in the air is not lost');
  /* the first pass is deliberately left running while the state changes under
     it — the case persist() used to mark clean and skip */
  await p.evaluate(() => {
    ['probe a','probe b','probe c'].forEach((n, i) => S.tasks.push(Object.assign(newTask(n, today()), {order:i})));
    const first = saveNow();          // in flight, not awaited
    S.tasks.find(t => t.text === 'probe a').order = 9;   // changes under it
    return first && saveNow();
  });
  await p.evaluate(() => flushSave());
  await p.waitForTimeout(400);
  is('the disk holds the change, not the state the save started from',
     await inDB(), 'probe b,probe c,probe a');
  is('  and memory agrees with it',
     await p.evaluate(() => S.tasks.filter(t=>/^probe/.test(t.text)).sort((x,y)=>x.order-y.order).map(t=>t.text).join(',')),
     'probe b,probe c,probe a');

  console.log('\n2. awaiting saveNow waits for your own change, not someone else\'s');
  const landed = await p.evaluate(async () => {
    S.tasks.find(t => t.text === 'probe b').order = 20;
    const inFlight = saveNow();                      // pass one
    S.tasks.find(t => t.text === 'probe c').order = 30;
    await saveNow();                                 // must not resolve on pass one
    const rows = await db.tasks.toArray();
    return rows.filter(t => /^probe/.test(t.text)).map(t => `${t.text}:${t.order}`).sort().join(' ');
  });
  is('the row it was called for is on disk when it resolves',
     landed, 'probe a:9 probe b:20 probe c:30');
  /* said directly, because the check above can only catch it when the queued
     pass happens to be slow: the promise you are handed while another pass is
     running must be the queued one, never the one already in the air */
  const own = await p.evaluate(async () => {
    S.tasks.find(t => t.text === 'probe b').order = 21;
    const inFlight = saveNow();
    S.tasks.find(t => t.text === 'probe c').order = 31;
    const mine = saveNow();
    const same = mine === inFlight;
    await flushSave();
    return {same, order: (await db.tasks.toArray()).filter(t => /^probe/.test(t.text))
      .map(t => `${t.text}:${t.order}`).sort().join(' ')};
  });
  yes('  and it is the queued pass, not the one already in the air', !own.same);
  is('  which is why the later change is on disk too', own.order, 'probe a:9 probe b:21 probe c:31');

  console.log('\n3. and a reorder survives a reload, every time');
  await p.evaluate(() => { reorderTaskInDay(today(), S.tasks.find(t=>t.text==='probe c').id,
    S.tasks.find(t=>t.text==='probe a').id, true); });   // c before a
  await p.evaluate(() => flushSave());
  await p.waitForTimeout(300);
  await p.reload(); await p.waitForTimeout(2400);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1600); }
  const after = await p.evaluate(() => tasksForDay(today()).map(r => r.text).filter(t => /^probe/.test(t)).join(','));
  const rightBefore = (list, a, b) => { const s = list.split(','); const i = s.indexOf(a); return i >= 0 && s[i+1] === b; };
  yes('c is immediately before a after the reload', rightBefore(after, 'probe c', 'probe a'), after);

  console.log('\n4. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke152  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
