/* smoke134 — a real clock, and today's tasks in two lists grouped by their own */
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
  const p = await b.newPage({viewport:{width:1400, height:1400}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const today_ = async () => { await p.evaluate(() => { if(location.hash === '#/today') rerender(); else location.hash = '#/today'; }); await p.waitForTimeout(1400); };
  await today_();

  console.log('\n1. the timer is a clock, and its hands move');
  is('the dial has sixty marks', await p.evaluate(() => document.querySelectorAll('.fc-mark').length), 60);
  is('  twelve of them major', await p.evaluate(() => document.querySelectorAll('.fc-mark.major').length), 12);
  yes('there is a minute hand and a second hand',
      !!(await p.$('.fc-min')) && !!(await p.$('.fc-sec')));
  const deg = () => p.evaluate(() => { const r = e => { const m = (e?.style.transform || '').match(/rotate\(([-\d.]+)deg\)/); return m ? +m[1] : null; };
    return {sec: r(document.querySelector('.fc-sec')), min: r(document.querySelector('.fc-min'))}; });
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); FocusTimer.setMode('countdown'); FocusTimer.setLength(25); FocusTimer.start(); });
  await p.waitForTimeout(1600);
  const a = await deg();
  await p.waitForTimeout(3200);
  const c = await deg();
  yes('the second hand moves while it runs', a.sec !== null && c.sec !== null && a.sec !== c.sec, JSON.stringify({a, c}));
  yes('  and so does the minute hand, slowly', a.min !== c.min, JSON.stringify({a: a.min, c: c.min}));
  yes('  the face shows it is ticking', await p.evaluate(() =>
    document.querySelector('.fp-ring').classList.contains('ticking')));
  yes('  and the digital reading is still there', /^\d\d:\d\d$/.test(
    (await p.evaluate(() => document.querySelector('.fp-time')?.textContent.trim())) || ''));
  await p.evaluate(() => { FocusTimer.stop(); FocusTimer.reset(); });
  yes('the setup rows sit in a band of their own', !!(await p.$('.fp-setup .fp-mode')));

  console.log('\n2. today\'s tasks are grouped by the list each lives in');
  const set = await p.evaluate(() => {
    S.tasks = (S.tasks || []).filter(t => t.day !== today());
    const a = planNewList('Work'), c = planNewList('Errands'), d = planNewList('Reading');
    const mk = (text, listId, bonus) => { const t = {id:uid(), text, listId, day:today(), done:false,
      order:0, priority:'', subtasks:[], links:{}, notes:'', bonus:!!bonus}; S.tasks.push(t); return t.id; };
    const ids = {
      w1: mk('Draft the brief', a.id), w2: mk('Call the client', a.id), w3: mk('Send the invoice', a.id),
      e1: mk('Post the parcel', c.id),
      r1: mk('Read a chapter', d.id, true), r2: mk('Skim the paper', d.id, true),
    };
    saveNow();
    return {ids, work: a.name, errands: c.name, reading: d.name};
  });
  await today_();
  const heads = await p.$$eval('.tg-head .tg-name', n => n.map(x => x.textContent.trim()));
  yes('there is a group per list', heads.length >= 2, heads.join(' | '));
  yes('  each says how many are left', await p.evaluate(() =>
    [...document.querySelectorAll('.tg-n')].every(n => /left|all done/.test(n.textContent))));
  /* the busiest list first: three left beats one */
  const mustHeads = await p.$$eval('.tband-must .tg-head .tg-name', n => n.map(x => x.textContent.trim().toLowerCase()));
  is('the busiest list is at the top', mustHeads[0], set.work.toLowerCase());
  yes('  and the quieter one below it', mustHeads.indexOf(set.errands.toLowerCase()) > 0, mustHeads.join(' | '));

  console.log('\n3. a group folds');
  const gk = await p.evaluate(() => document.querySelector('[data-tgroup]').dataset.tgroup);
  const before = await p.$$eval('.task-row', n => n.length);
  await p.evaluate(k => document.querySelector(`[data-tgroup="${k}"]`).click(), gk);
  await p.waitForTimeout(900);
  const after = await p.$$eval('.task-row', n => n.length);
  yes('folding one hides its rows', after < before, `${before} → ${after}`);
  yes('  and the heading stays, so it can be opened again',
      !!(await p.$(`[data-tgroup="${gk}"]`)));
  await p.evaluate(k => document.querySelector(`[data-tgroup="${k}"]`).click(), gk);
  await p.waitForTimeout(900);
  is('  unfolding brings them back', await p.$$eval('.task-row', n => n.length), before);
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2800);

  console.log('\n4. compulsory and bonus are counted apart');
  await today_();
  yes('there is a compulsory band', !!(await p.$('.tband-must')));
  yes('  and a bonus band', !!(await p.$('.tband-bonus')));
  yes('  which says that leaving it is not a miss', await p.evaluate(() =>
    /not a miss/.test(document.querySelector('.tband-bonus .tband-note').textContent)));
  const bonusRows = await p.$$eval('.tband-bonus .task-row .task-text', n => n.map(x => x.textContent.trim()));
  yes('the bonus band holds only the bonus work',
      bonusRows.length === 2 && bonusRows.includes('Read a chapter'), bonusRows.join(' | '));
  const summary = await p.evaluate(() => document.querySelector('#t-tasks summary .mono')?.textContent.trim());
  yes('the day is counted against what had to be done', /0 of 4 done/.test(summary || ''), String(summary));
  yes('  with the bonus counted beside it, not in it', /0\/2 bonus/.test(summary || ''), String(summary));
  /* finishing every compulsory task is finishing the day */
  await p.evaluate(i => { [i.w1, i.w2, i.w3, i.e1].forEach(x => setTaskDone(x, true)); saveNow(); }, set.ids);
  await today_();
  const s2 = await p.evaluate(() => document.querySelector('#t-tasks summary .mono')?.textContent.trim());
  yes('so the day reads as done with the bonus still open', /4 of 4 done/.test(s2 || ''), String(s2));

  console.log('\n5. a task can be moved between the two');
  await p.evaluate(i => { [i.w1, i.w2, i.w3, i.e1].forEach(x => setTaskDone(x, false)); saveNow(); }, set.ids);
  await today_();
  is('it starts compulsory', await p.evaluate(i => !!byId(S.tasks, i).bonus, set.ids.w1), false);
  await p.evaluate(i => document.querySelector(`[data-tbonus="${i}"]`).click(), set.ids.w1);
  await p.waitForTimeout(1000);
  is('  pressing the mark makes it a bonus', await p.evaluate(i => !!byId(S.tasks, i).bonus, set.ids.w1), true);
  yes('  and it moves into the bonus band', await p.evaluate(i =>
    !!document.querySelector(`.tband-bonus [data-taskrow="${i}"]`), set.ids.w1));
  await p.evaluate(i => document.querySelector(`[data-tbonus="${i}"]`).click(), set.ids.w1);
  await p.waitForTimeout(1000);
  is('  and back again', await p.evaluate(i => !!byId(S.tasks, i).bonus, set.ids.w1), false);

  console.log('\n6. with nothing marked bonus, there are no headings to read past');
  await p.evaluate(i => { [i.r1, i.r2].forEach(x => { byId(S.tasks, x).bonus = false; }); saveNow(); }, set.ids);
  await today_();
  yes('the bands are gone', !(await p.$('.tband-bonus')) && !(await p.$('.tband-must')));
  yes('  but the groups remain', (await p.$$('.tg-head')).length >= 2);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke134  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
