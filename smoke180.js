/* smoke180 — writing a task down is one line, and the Inbox is beside it.

   The complaint: "change the add new task button to one where it's simple —
   right now the whole page opens up — and by default the task will be parked
   under inbox. also, remove the inbox from the sidebar of lists; but move it
   to the top just by the side of the add new task button."

   The ＋ New task button called openPlanTask(null), which makes a task and
   immediately opens the detail panel over the page: a dozen fields — priority,
   duration, recurrence, reminders, steps, notes — for a sentence you already
   knew how to write. And it filed the task into whatever list happened to be
   selected, so the same button meant a different thing depending on where you
   were standing.

   It is a line now. Type the sentence, press return, it is in the Inbox. The
   parse is the one the quadrants and the list already use, so "friday 2pm
   !high ~1h" still means what it means — nothing new to learn, one less thing
   to open.

   Two things this has to get right, and both are easy to get wrong:

   1. The top line must not take the selection into account. Every other add
      field on the page does — type into the Tuesday column and you meant
      Tuesday — but this one sits above everything, before you have chosen
      anything, and it says on its own face where it puts things. If it quietly
      filed into the open list instead, it would be the old button's bug with
      a new shape.

   2. A task typed while you are looking at Today lands somewhere you cannot
      see. The Inbox count sitting right beside the field is the only thing
      that can say so, which is the second reason it belongs up there and not
      buried in the column of lists.

   And there is one trap in moving the Inbox: the app has two names for it —
   the smart view 'inbox' and the real list 'inbox', which disagree about
   finished tasks. The FAB's #/planning/inbox address uses the first. If the
   button used the second, arriving by that address would light nothing. */
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
  const ctx = await b.newContext({viewport:{width:1400, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1900); }
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1500);

  console.log('\n1. the add is a line on the top row, not a button that opens a page');
  const top = await p.evaluate(() => {
    const a = document.querySelector('.pl-top .pl-add-input');
    const ib = document.querySelector('.pl-top .pl-inbox');
    const s = document.querySelector('.pl-top #plSearch');
    const t = n => n ? Math.round(n.getBoundingClientRect().top) : null;
    return {add: !!a, inbox: !!ib, search: !!s,
      ctxButton: !!document.querySelector('#ctxAdd'),
      sameLine: a && ib && s ? Math.abs(t(a)-t(ib)) < 14 && Math.abs(t(a)-t(s)) < 14 : false,
      order: [...document.querySelectorAll('.pl-top .pl-add-input, .pl-top .pl-inbox, .pl-top #plSearch')]
        .map(n => n.className.split(' ').find(c => /pl-add-input|pl-inbox|pl-search/.test(c)))};
  });
  yes('there is a field to type a task into', top.add);
  yes('  the Inbox is beside it', top.inbox);
  yes('  and the search is on the same line', top.search && top.sameLine, JSON.stringify(top));
  is('  in that order', top.order, ['pl-add-input','pl-inbox','pl-search']);
  yes('the button that opened the whole panel is gone', !top.ctxButton);

  console.log('\n2. the Inbox is no longer one of the lists in the column');
  const side = await p.evaluate(() => ({
    inSidebar: !!document.querySelector('.pl-side [data-plsel="list:inbox"]'),
    otherLists: [...document.querySelectorAll('.pl-side #plLists [data-plsel^="list:"]')]
      .map(n => n.dataset.plsel.split(':')[1]),
    stillALivingList: !!planList('inbox')}));
  yes('it has no row among the lists', !side.inSidebar, side.otherLists.join(','));
  yes('  but the list itself is untouched in the data', side.stillALivingList);
  yes('  and the lists you made on purpose are all still there', side.otherLists.length >= 1,
    side.otherLists.join(','));

  console.log('\n3. a task typed at the top goes to the Inbox, wherever you are standing');
  /* the selection is a list of its own — the old button would have filed here */
  const someList = await p.evaluate(() => planLists().find(l => l.id !== 'inbox')?.id);
  await p.evaluate(id => { planSetSel('list', id); }, someList);
  await p.waitForTimeout(900);
  const beforeN = await p.evaluate(() => planListCount('inbox'));
  await p.fill('.pl-top .pl-add-input', 'smoke180 a thing to do');
  await p.waitForTimeout(400);
  yes('  the parse is shown before it is committed',
    await p.evaluate(() => !!document.querySelector('.pl-top .pl-add .qp-preview')));
  await p.press('.pl-top .pl-add-input', 'Enter');
  await p.waitForTimeout(1100);
  const made = await p.evaluate(() => {
    const t = S.tasks.filter(x => x.text === 'smoke180 a thing to do');
    return {n: t.length, listId: t[0]?.listId, day: t[0]?.day, panel: !!document.querySelector('.plan-detail, .pd'),
      count: planListCount('inbox'), cleared: document.querySelector('.pl-top .pl-add-input')?.value};
  });
  is('  one task was made', made.n, 1);
  is('  and it is in the Inbox, not the list that was open', made.listId, 'inbox');
  yes('  no panel opened over the page', !made.panel);
  is('  the field is empty again, ready for the next one', made.cleared, '');
  is('  and the Inbox count beside it went up', made.count, beforeN + 1);

  console.log('\n4. the same line still understands what you typed');
  await p.fill('.pl-top .pl-add-input', 'smoke180 pay it !high ~90m');
  await p.press('.pl-top .pl-add-input', 'Enter');
  await p.waitForTimeout(1100);
  const parsed = await p.evaluate(() => {
    const t = S.tasks.find(x => x.text === 'smoke180 pay it');
    return t ? {listId:t.listId, priority:t.priority, duration:t.duration} : null;
  });
  yes('  priority and duration came off the sentence',
    parsed && parsed.priority === 3 && parsed.duration === 90, JSON.stringify(parsed));
  is('  and it still parked in the Inbox', parsed && parsed.listId, 'inbox');

  console.log('\n5. a date that is open does not put its date on what you type');
  /* every other add field on the page inherits the selection; this one must
     not, or "new task" would mean something different on every screen */
  await p.evaluate(() => { planSetSel('smart', 'today'); }); await p.waitForTimeout(900);
  await p.fill('.pl-top .pl-add-input', 'smoke180 undated');
  await p.press('.pl-top .pl-add-input', 'Enter');
  await p.waitForTimeout(1100);
  const undated = await p.evaluate(() => {
    const t = S.tasks.find(x => x.text === 'smoke180 undated');
    return t ? {day: t.day, listId: t.listId} : null;
  });
  is('  no day was put on it', undated && undated.day, '');
  is('  and it is in the Inbox', undated && undated.listId, 'inbox');
  /* and the field inside the workspace still does inherit — that is its job */
  const inner = await p.evaluate(() => {
    const f = [...document.querySelectorAll('[data-pqadd]')].find(n => !n.classList.contains('pl-add-input'));
    return f ? JSON.parse(f.dataset.pqadd).fixed !== true : 'none';
  });
  yes('  while the line inside the list still takes the page at its word', inner === true, String(inner));

  console.log('\n6. the button is the Inbox, whichever way you ask for it');
  await p.evaluate(() => { planSetSel('smart', 'inbox'); }); await p.waitForTimeout(900);
  const lit = await p.evaluate(() => ({sel: planSel(),
    on: !!document.querySelector('.pl-top .pl-inbox.on'),
    title: document.querySelector('.pl-title')?.textContent.trim()}));
  is('  asking for the smart view lands on the real list', lit.sel, {kind:'list', id:'inbox'});
  yes('  the button up top is lit', lit.on);
  is('  and the page says where you are', lit.title, 'Inbox');
  /* pressing it works too */
  await p.evaluate(() => { planSetSel('smart', 'today'); }); await p.waitForTimeout(800);
  await p.click('.pl-top .pl-inbox'); await p.waitForTimeout(1000);
  const pressed = await p.evaluate(() => ({sel: planSel(),
    /* the Inbox opens on its own default view, so count what is on the page
       by name rather than by the markup of any one view */
    shown: [...document.querySelectorAll('[data-ptrow],[data-pkcard],.pk-card')]
      .filter(n => /smoke180/.test(n.textContent)).length}));
  is('  and pressing it opens the Inbox', pressed.sel, {kind:'list', id:'inbox'});
  yes('  with the three just written in it', pressed.shown >= 3, String(pressed.shown));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke180  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
