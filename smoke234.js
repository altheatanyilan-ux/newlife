/* smoke234 — Planning: All tasks is back; and the reminders.

   WHAT IS CLAIMED.

   All tasks: a row in Planning's sidebar, under the dated row, showing every
   open task whatever list it is in, grouped by list. Finished tasks are never
   in it — even with "done" switched on elsewhere — because Completed, at the
   foot of the sidebar, is where they are.

   Reminders: a 🔔 Reminders button on the top line beside the shopping list,
   not one of the lists. A reminder has a day, a time if it matters, and a
   "show it from" (one day before, by default). "call the dentist friday 3pm"
   sets its own day and time. From its show-from day until it is ticked it is
   at the top of Today and floats over every other page; at its time it rings
   once. It can be put off an hour. It is not a task in the Inbox, the dated
   views or Today's list. Any task can be one too, from its panel, and stays
   in its list. The + button makes one from anywhere. It is all kept.

   Run: NODE_PATH=node_modules node smoke234.js */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1400, height:900}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => { const real = Date.now.bind(Date); window._skew = 0; Date.now = () => real() + window._skew;
    migratePlanning();
    const g = planNewList('Garden');
    const done = newPlanTask('buy seeds', '', {listId: g.id}); done.done = true; done.doneAt = today();
    S.tasks.push(newPlanTask('prune roses', '', {listId: g.id}), done, newPlanTask('ring the bank', '', {listId: 'inbox'}));
    planAddShopItems('milk');
    S._planRoom = 'tasks'; S._planSel = {kind: 'smart', id: 'today'}; S._planView = null;
    saveNow(); location.hash = '#/planning'; });
  await p.waitForTimeout(1500);
  const clean = () => p.evaluate(() => document.querySelectorAll('#toasts > *').forEach(n => n.remove()));

  console.log('\n1. All tasks');
  const A0 = await p.evaluate(() => { const r = document.querySelector('.pl-side [data-plsel="smart:all"]');
    const marks = [...document.querySelectorAll('.pl-side .pl-dated, .pl-side [data-plsel="smart:all"], .pl-side .pl-head')].map(n =>
      n.classList.contains('pl-dated') ? 'dated' : n.dataset.plsel === 'smart:all' ? 'all' : 'head');
    return {there: !!r, name: r && r.querySelector('.pl-name').textContent, n: r && r.querySelector('.pl-n').textContent, order: marks.slice(0, 3),
      want: planOwnTasks().filter(t => !t.done && !taskIsAside(t)).length}; });
  yes('the sidebar has All tasks again, under the dated row and above the lists',
    A0.there && A0.name === 'All tasks' && A0.order.join() === 'dated,all,head', A0);
  yes('  its count is every open task (the shopping and the reminders not among them)', +A0.n === A0.want, A0);
  await p.click('.pl-side [data-plsel="smart:all"]'); await p.waitForTimeout(700);
  const A1 = await p.evaluate(() => ({title: document.querySelector('.pl-title').textContent,
    rows: [...document.querySelectorAll('.pl-body .pt-row')].map(r => r.querySelector('.pt-text, .pt-t, .pt-name')?.textContent || r.textContent),
    n: document.querySelectorAll('.pl-body .pt-row').length, want: planSmartFilter('all').length,
    done: document.querySelectorAll('.pl-body .pt-row.done').length, fold: !!document.querySelector('.pl-body .pt-done'),
    chip: !!document.querySelector('#plShowDone'), matrix: !!document.querySelector('.pl-body .pk-card'),
    groups: [...document.querySelectorAll('.pl-body .pt-ghead, .pl-body .pt-group-h, .pl-body .pt-gh')].map(n => n.textContent.replace(/\s+/g, ' ').trim())}));
  yes('pressed: "All tasks", as a list — every open task, from every list', A1.title === 'All tasks' && !A1.matrix && A1.n === A1.want && A1.n > 3, A1);
  yes('  including the Garden\'s roses and the Inbox\'s bank, and not the milk',
    A1.rows.some(x => /prune roses/.test(x)) && A1.rows.some(x => /ring the bank/.test(x)) && !A1.rows.some(x => /\bmilk\b/.test(x)), A1.rows);
  yes('  no finished task anywhere in it, and no "done" switch — Completed is at the foot', !A1.done && !A1.fold && !A1.chip && !A1.rows.some(x => /buy seeds/.test(x)), A1);
  await p.evaluate(() => { planState().prefs.showCompleted = true; saveNow(); rerender(); }); await p.waitForTimeout(500);
  yes('  even with "done" switched on from another list, it stays open tasks only',
    await p.evaluate(() => !document.querySelector('.pl-body .pt-row.done') && !document.querySelector('.pl-body .pt-done')));
  await p.evaluate(() => { planState().prefs.showCompleted = false; saveNow(); });
  yes('  grouped by the list each task lives in', await p.evaluate(() => /Garden/.test(document.querySelector('.pl-body').textContent)
    && planGroupTasks(planSmartFilter('all'), {kind: 'smart', id: 'all'}).some(([k]) => k === 'Garden')));
  await p.evaluate(() => { S._planSel = {kind: 'smart', id: 'all'}; rerender(); }); await p.waitForTimeout(400);
  yes('  and a remembered All tasks stays All tasks', await p.evaluate(() => planSel().id === 'all'
    && !!document.querySelector('.pl-side .pl-item.on[data-plsel="smart:all"]')));

  console.log('\n2. the Reminders button');
  const R0 = await p.evaluate(() => ({order: [...document.querySelectorAll('.pl-top > *')].map(n => n.classList.contains('pl-remindbtn') ? 'remind'
      : n.classList.contains('pl-shopbtn') ? 'shop' : n.classList.contains('pl-inbox') ? 'inbox' : n.classList.contains('pl-add') ? 'add' : n.id === 'plSearch' ? 'search' : '?'),
    side: /Reminders/.test(document.querySelector('.pl-side').textContent)}));
  is('the top line: new task, Inbox, 🛒 Shopping list, 🔔 Reminders, search', R0.order, ['add', 'inbox', 'shop', 'remind', 'search']);
  yes('  and the reminders are not one of the lists', !R0.side, R0);
  const inbox0 = await p.evaluate(() => planListCount('inbox'));
  await p.click('.pl-remindbtn'); await p.waitForTimeout(600);
  const R1 = await p.evaluate(() => ({title: document.querySelector('.pl-title').textContent, on: document.querySelector('.pl-remindbtn').classList.contains('on'),
    views: !!document.querySelector('.pl-viewsw'), empty: !!document.querySelector('.prem-empty'),
    lead: document.querySelector('#premLead').selectedOptions[0].textContent, day: document.querySelector('#premDay').value, T: today()}));
  yes('pressed: "Reminders", lit, a list of its own, empty to begin with', R1.title === 'Reminders' && R1.on && !R1.views && R1.empty, R1);
  yes('  a new one is for today, shown from one day before unless told otherwise', R1.day === R1.T && R1.lead === '1 day before', R1);

  console.log('\n3. writing them down');
  await p.fill('#premIn', 'call the dentist friday 3pm'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  const D = await p.evaluate(() => { const t = S.tasks.find(x => x.remind && /dentist/.test(x.text));
    return t && {text: t.text, dow: parseDay(t.day).getDay(), time: t.dueTime, lead: t.remindLead, focus: document.activeElement.id}; });
  yes('"call the dentist friday 3pm": the words, a Friday, 3pm — and the line is ready for the next',
    D && D.text === 'call the dentist' && D.dow === 5 && D.time === '15:00' && D.lead === 1 && D.focus === 'premIn', D);
  const hm = await p.evaluate(() => { const d = new Date(Date.now() - 10 * 60000); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; });
  const ago = await p.evaluate(() => { const d = new Date(Date.now() - 10 * 60000); return isoDay(d); });
  await p.fill('#premIn', 'take the pills'); await p.fill('#premDay', ago); await p.fill('#premTime', hm);
  await p.click('#premAdd'); await p.waitForTimeout(500);
  await p.fill('#premIn', 'bin day'); await p.fill('#premDay', await p.evaluate(() => addDays(today(), 1)));
  await p.fill('#premTime', '07:30'); await p.click('#premAdd'); await p.waitForTimeout(500);
  await p.fill('#premIn', 'renew the passport'); await p.fill('#premDay', await p.evaluate(() => addDays(today(), 9)));
  await p.fill('#premTime', ''); await p.selectOption('#premLead', '3'); await p.click('#premAdd'); await p.waitForTimeout(500);
  const L = await p.evaluate(() => ({now: [...document.querySelectorAll('.prem-now .prem-t')].map(n => n.textContent),
    later: [...document.querySelectorAll('.prem-group:not(.prem-now):not(.prem-done) .prem-row')].map(n => n.textContent.replace(/\s+/g, ' ').trim()),
    n: (document.querySelector('.pl-remindbtn .pl-n') || {}).textContent,
    pills: (document.querySelector('.prem-now .prem-row') || {textContent: ''}).textContent.replace(/\s+/g, ' ')}));
  is('"Showing now": the pills (their time has come) and the bins (tomorrow, shown from today)', L.now, ['take the pills', 'bin day']);
  yes('  the pills say now, and can be put off an hour', /now · /.test(L.pills) && /in an hour/.test(L.pills), L.pills);
  yes('  the passport is coming up, and says when it will start to show', L.later.some(x => /renew the passport/.test(x) && /shows /.test(x)), L.later);
  yes('  the button counts the ones showing now', L.n === '2', L);
  const K = await p.evaluate(() => ({inbox: planListCount('inbox'), all: planSmartFilter('all').some(t => t.remind),
    today: tasksForDay(today()).some(r => r.task.remind), banner: !!document.querySelector('#plRemind')}));
  yes('none of them is a task in the Inbox, All tasks or Today\'s list — and the old banner does not repeat them',
    K.inbox === inbox0 && !K.all && !K.today && !K.banner, K);

  console.log('\n4. on Today');
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1300);
  const T1 = await p.evaluate(() => { const sec = document.querySelector('#t-remind'), bar = document.querySelector('.today-bar');
    return {sec: !!sec, above: !!(sec && bar && (sec.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING)),
      rows: sec ? [...sec.querySelectorAll('.t-rem-t')].map(n => n.textContent) : [], ringing: sec && sec.classList.contains('ringing'),
      float: document.querySelector('#remFloat').hidden}; });
  yes('at the top of Today, above both halves of the day: the reminders showing now', T1.sec && T1.above && T1.rows.join() === 'take the pills,bin day', T1);
  yes('  marked as ringing, and not floating here as well — Today has them already', T1.ringing && T1.float, T1);
  await p.click('#t-remind [data-premdone]:nth-of-type(1)'); await p.waitForTimeout(0);
  await p.evaluate(() => { const b = [...document.querySelectorAll('#t-remind .t-rem')].find(r => /bin day/.test(r.textContent)).querySelector('[data-premdone]'); b.click(); });
  await p.waitForTimeout(700);
  const T2 = await p.evaluate(() => ({rows: [...document.querySelectorAll('#t-remind .t-rem-t')].map(n => n.textContent),
    bins: S.tasks.find(t => t.text === 'bin day').done, pills: S.tasks.find(t => t.text === 'take the pills').done}));
  yes('ticked on Today: done, and gone from the top of the page', T2.pills && T2.bins && !T2.rows.length, T2);
  await p.evaluate(() => { S.tasks.find(t => t.text === 'take the pills').done = false; S.tasks.find(t => t.text === 'bin day').done = false; saveNow(); });

  console.log('\n5. over every other page');
  await p.evaluate(() => { location.hash = '#/values'; }); await p.waitForTimeout(1300); await clean();
  const F1 = await p.evaluate(() => { const f = document.querySelector('#remFloat');
    return {shown: !f.hidden, mode: f.dataset.mode, first: (f.querySelector('.rf-t') || {}).textContent, more: (f.querySelector('#rfExpand') || {}).textContent,
      top: Math.round(f.getBoundingClientRect().top), h: Math.round(f.getBoundingClientRect().height), ringing: f.classList.contains('ringing')}; });
  yes('on Values it floats: one line, the most pressing first, and how many more', F1.shown && F1.mode === 'strip' && F1.first === 'take the pills' && F1.more === '+1' && F1.h <= 40, F1);
  yes('  at the top, out of the page\'s way, marked as ringing', F1.top <= 16 && F1.ringing, F1);
  await p.click('#rfExpand'); await p.waitForTimeout(300);
  const F2 = await p.evaluate(() => [...document.querySelectorAll('#remFloat .rf-t')].map(n => n.textContent));
  is('  "+1" opens the whole list', F2, ['take the pills', 'bin day']);
  await p.click('#rfMin'); await p.waitForTimeout(300);
  const F3 = await p.evaluate(() => ({mode: document.querySelector('#remFloat').dataset.mode, n: (document.querySelector('#rfOpen b') || {}).textContent}));
  yes('  "–" folds it to a bell with a number', F3.mode === 'min' && F3.n === '2', F3);
  await p.click('#rfOpen'); await p.waitForTimeout(300);
  yes('  and the bell opens it again', await p.evaluate(() => document.querySelector('#remFloat').dataset.mode === 'strip'));
  await p.evaluate(() => { location.hash = '#/journals'; }); await p.waitForTimeout(1200);
  yes('it follows you to the next page', await p.evaluate(() => !document.querySelector('#remFloat').hidden));
  await p.keyboard.press('z'); await p.waitForTimeout(700);
  const F4 = await p.evaluate(() => [...document.querySelectorAll('#remFloat .rf-row .rf-t')].map(n => n.textContent).concat(
    document.querySelector('#rfExpand') ? ['+'] : []));
  is('in focus mode it keeps to the ones whose day has come', F4, ['take the pills']);
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  await p.click('#remFloat [data-premdone]'); await p.waitForTimeout(600);
  yes('✓ in the float ticks it off', await p.evaluate(() => S.tasks.find(t => t.text === 'take the pills').done
    && (document.querySelector('#remFloat .rf-t') || {}).textContent === 'bin day'));

  console.log('\n6. at its time');
  await p.evaluate(() => { const d = new Date(Date.now() + 60000);
    planAddReminder({text: 'leave for the station', day: isoDay(d), time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, lead: 0});
    S._remFloatMode = 'min'; paintRemindFloat(); remindCheckRing(); });
  const G0 = await p.evaluate(() => !!S.tasks.find(t => t.text === 'leave for the station').remindRang);
  await p.evaluate(() => { window._skew += 2 * 60000; remindCheckRing(); }); await p.waitForTimeout(400);
  const G1 = await p.evaluate(() => ({rang: !!S.tasks.find(t => t.text === 'leave for the station').remindRang,
    mode: document.querySelector('#remFloat').dataset.mode, toast: [...document.querySelectorAll('#toasts > *')].map(n => n.textContent).join(' | ')}));
  yes('not before its time; at it, it rings — a word at the foot, and the folded bell opens to its line', !G0 && G1.rang && G1.mode === 'strip' && /leave for the station/.test(G1.toast), {G0, G1});
  const once = await p.evaluate(() => { const was = S.tasks.find(t => t.text === 'leave for the station').remindRang;
    remindCheckRing(); return S.tasks.find(t => t.text === 'leave for the station').remindRang === was; });
  yes('  once', once);

  console.log('\n7. later, and from a task');
  await p.evaluate(() => { S._planSel = {kind: 'remind', id: 'list'}; location.hash = '#/planning'; }); await p.waitForTimeout(1300);
  await p.evaluate(() => { const r = [...document.querySelectorAll('.prem-row')].find(x => /leave for the station/.test(x.textContent));
    r.querySelector('[data-premsnooze]').click(); }); await p.waitForTimeout(500);
  const Z = await p.evaluate(() => { const t = S.tasks.find(x => x.text === 'leave for the station');
    return {mins: Math.round((remindMoment(t) - Date.now()) / 60000), st: remindState(t), rang: t.remindRang}; });
  yes('"in an hour" puts it off an hour, and it will ring again then', Z.mins >= 58 && Z.mins <= 61 && Z.st !== 'now' && !Z.rang, Z);
  await p.evaluate(() => openPlanTask(S.tasks.find(t => t.text === 'prune roses').id)); await p.waitForTimeout(500);
  await p.check('#pdRemind'); await p.waitForTimeout(500);
  await p.selectOption('#pdRemLead', '0'); await p.waitForTimeout(400);
  const P = await p.evaluate(() => { const t = S.tasks.find(x => x.text === 'prune roses');
    return {remind: t.remind, day: t.day, lead: t.remindLead, T: today(),
      row: [...document.querySelectorAll('.prem-row')].map(r => r.textContent.replace(/\s+/g, ' ')).find(x => /prune roses/.test(x)) || '',
      still: planSelectionTasks({kind: 'list', id: t.listId}).some(x => x.id === t.id)}; });
  yes('a task ticked "remind me" in its panel is a reminder — today if it had no day — saying its list', P.remind && P.day === P.T && P.lead === 0 && /Garden/.test(P.row), P);
  yes('  and it stays in its own list', P.still, P);
  await p.evaluate(() => { const c = document.querySelector('#panel .close, .panel .close, [data-panelclose]'); if(c) c.click(); });

  console.log('\n8. from anywhere, and kept');
  await p.evaluate(() => { location.hash = '#/values'; }); await p.waitForTimeout(1000);
  await p.evaluate(() => EntryActions.reminder()); await p.waitForTimeout(400);
  await p.fill('#rmText', 'post the letter tomorrow 9am'); await p.click('#rmSave'); await p.waitForTimeout(500);
  const M = await p.evaluate(() => { const t = S.tasks.find(x => x.remind && /post the letter/.test(x.text));
    return t && {text: t.text, day: t.day, time: t.dueTime, T1: addDays(today(), 1)}; });
  yes('the + button\'s Reminder makes one from any page, day and time read from the words',
    M && M.text === 'post the letter' && M.day === M.T1 && M.time === '09:00', M);
  await p.evaluate(async () => { await saveNow(); });
  await p.reload(); await p.waitForTimeout(1600);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const KEPT = await p.evaluate(() => planRemindItems().map(t => [t.text, t.dueTime, t.remindLead]).filter(x => /dentist|passport|station|post the letter/.test(x[0])).sort());
  yes('after a reload they are all still there, with their times and their show-from', KEPT.length === 4
    && KEPT.some(x => x[0] === 'renew the passport' && x[2] === 3) && KEPT.some(x => x[0] === 'call the dentist' && x[1] === '15:00'), KEPT);

  console.log('\n9. on a phone');
  await p.setViewportSize({width: 390, height: 844});
  await p.evaluate(() => { location.hash = '#/values'; }); await p.waitForTimeout(1200); await clean();
  const PH = await p.evaluate(() => { const f = document.querySelector('#remFloat').getBoundingClientRect(),
    fab = document.querySelector('.fab').getBoundingClientRect(), nav = document.querySelector('.mobile-nav').getBoundingClientRect();
    return {over: document.documentElement.scrollWidth - innerWidth, shown: !document.querySelector('#remFloat').hidden,
      clearFab: f.bottom <= fab.top + 1, clearNav: f.bottom <= nav.top, inside: f.left >= 0 && f.right <= innerWidth}; });
  yes('the float fits the phone, above the + and the tabs', PH.shown && PH.clearFab && PH.clearNav && PH.inside && PH.over <= 1, PH);
  await p.evaluate(() => { S._planSel = {kind: 'remind', id: 'list'}; location.hash = '#/planning'; }); await p.waitForTimeout(1200);
  yes('  and so does the Reminders view', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));

  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
