/* smoke232 — Planning: the shopping list.

   WHAT IS CLAIMED. The top line of Planning has its own 🛒 Shopping list
   button, beside the Inbox, with a count — and the shopping list is not one
   of the lists in the sidebar. It shows everything that needs buying:
   things written straight into it ("milk, eggs, bread" is three) and any
   task elsewhere ticked "on the shopping list" in its panel, which says the
   list it came from and stays in that list too. Things to buy stay out of
   the Inbox and the dated views. Ticking one puts it in the basket;
   clearing the basket throws the bought things away. A list made before
   this, called Shopping or Groceries, is offered to be moved in; moving it
   brings its things and takes the empty list away. It is all kept.

   Run: NODE_PATH=node_modules node smoke232.js */
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
  const ctx = await b.newContext({viewport:{width:1300, height:950}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  /* a list from before, called Groceries, with two things in it, and a list for a project */
  await p.evaluate(() => { migratePlanning();
    const g = planNewList('Groceries'), h = planNewList('Kitchen shelves');
    S.tasks.push(newPlanTask('oat milk', '', {listId: g.id}), newPlanTask('coffee beans', '', {listId: g.id}),
      newPlanTask('drill bits', '', {listId: h.id}), newPlanTask('call the plumber', '', {listId: 'inbox'}));
    saveNow(); S._planRoom = 'tasks'; S._planSel = {kind: 'smart', id: 'today'}; location.hash = '#/planning'; });
  await p.waitForTimeout(1500);

  console.log('\n1. the button');
  const B0 = await p.evaluate(() => ({order: [...document.querySelectorAll('.pl-top > *')].map(n => n.classList.contains('pl-shopbtn') ? 'shop' : n.classList.contains('pl-remindbtn') ? 'remind' : n.classList.contains('pl-inbox') ? 'inbox' : n.classList.contains('pl-add') ? 'add' : n.id === 'plSearch' ? 'search' : '?'),
    text: document.querySelector('.pl-shopbtn').textContent.replace(/\s+/g, ' ').trim(),
    inSidebar: [...document.querySelectorAll('.pl-side, .pl-sidebar, aside')].some(a => /Shopping list/.test(a.textContent))}));
  is('Planning\'s top line: the new task, the Inbox, 🛒 Shopping list, (🔔 Reminders,) the search', B0.order, ['add', 'inbox', 'shop', 'remind', 'search']);
  yes('  and the shopping list is not one of the lists in the sidebar', !B0.inSidebar && /^🛒\s*Shopping list$/.test(B0.text), B0);
  await p.click('.pl-shopbtn'); await p.waitForTimeout(600);
  const V0 = await p.evaluate(() => ({title: document.querySelector('.pl-title').textContent, on: document.querySelector('.pl-shopbtn').classList.contains('on'),
    views: !!document.querySelector('.pl-viewsw'), empty: !!document.querySelector('.pshop-empty'),
    offer: (document.querySelector('.pshop-offer') || {}).textContent || ''}));
  yes('pressed: "Shopping list", lit, a list rather than a matrix, empty to begin with', V0.title === 'Shopping list' && V0.on && !V0.views && V0.empty, V0);
  yes('  and the old "Groceries" list is offered to be moved in (2 to buy)', /Your list Groceries looks like shopping — 2 to buy/.test(V0.offer.replace(/\s+/g, ' ')), V0.offer);

  console.log('\n2. writing it down');
  await p.fill('#pshopIn', 'milk, eggs, bread'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  await p.fill('#pshopIn', 'washing-up liquid'); await p.click('#pshopAdd'); await p.waitForTimeout(500);
  const A = await p.evaluate(() => ({items: [...document.querySelectorAll('.pshop-list .pshop-t')].map(n => n.textContent),
    focus: document.activeElement && document.activeElement.id, n: document.querySelector('.pl-shopbtn .pl-n').textContent,
    inbox: planListCount('inbox'), inboxRows: planSelectionTasks({kind: 'list', id: 'inbox'}).filter(t => !t.done).map(t => t.text),
    inboxShown: [...document.querySelectorAll('.pl-top .pl-inbox .pl-n')].map(n => n.textContent).join(''),
    all: planSmartFilter('all').some(t => t.shop), shop: S.tasks.filter(t => t.shop).length}));
  is('"milk, eggs, bread" is three things; one more by the button; in the order written', A.items, ['milk', 'eggs', 'bread', 'washing-up liquid']);
  yes('  the line stays ready for the next, and the button counts 4', A.focus === 'pshopIn' && A.n === '4', A);
  const buy = ['milk', 'eggs', 'bread', 'washing-up liquid'];
  yes('  none of them in the Inbox (its count is its rows, the plumber among them) or the dated views',
    A.inbox === A.inboxRows.length && A.inboxRows.includes('call the plumber') && !A.inboxRows.some(x => buy.includes(x)) && !A.all, A);

  console.log('\n3. from anywhere else');
  await p.evaluate(() => openPlanTask(S.tasks.find(t => t.text === 'drill bits').id)); await p.waitForTimeout(500);
  await p.check('#pdShop'); await p.waitForTimeout(500);
  const D = await p.evaluate(() => { const t = S.tasks.find(x => x.text === 'drill bits');
    return {shop: t.shop, row: [...document.querySelectorAll('.pshop-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim()).find(x => /drill bits/.test(x)) || '',
      still: planSelectionTasks({kind: 'list', id: t.listId}).some(x => x.id === t.id), n: document.querySelector('.pl-shopbtn .pl-n').textContent}; });
  yes('a task ticked "on the shopping list" in its panel is on it, saying the list it came from', D.shop && /drill bits\s*Kitchen shelves/.test(D.row) && D.n === '5', D);
  yes('  and it stays in its own list too', D.still, D);
  await p.evaluate(() => { const c = document.querySelector('#panel .close, .panel .close, [data-panelclose]'); if(c) c.click(); });

  console.log('\n4. the old list');
  await p.evaluate(() => { S._planSel = {kind: 'shop', id: 'list'}; rerender(); }); await p.waitForTimeout(400);
  await p.click('[data-pshopmove]'); await p.waitForTimeout(500);
  const M = await p.evaluate(() => ({items: [...document.querySelectorAll('.pshop-list .pshop-t')].map(n => n.textContent),
    listGone: !planLists().some(l => l.name === 'Groceries'), offer: !!document.querySelector('.pshop-offer')}));
  yes('"Move it here": oat milk and coffee beans join the list, and the empty Groceries list is gone',
    M.items.includes('oat milk') && M.items.includes('coffee beans') && M.listGone && !M.offer, M);

  console.log('\n5. at the shop');
  const row = name => p.evaluate(n => [...document.querySelectorAll('.pshop-row')].find(r => r.querySelector('.pshop-t').textContent === n).dataset.pshoprow, name);
  await p.click(`[data-pshopdone="${await row('milk')}"]`); await p.waitForTimeout(400);
  await p.click(`[data-pshopdone="${await row('drill bits')}"]`); await p.waitForTimeout(400);
  const S1 = await p.evaluate(() => ({list: [...document.querySelectorAll('.pshop-list .pshop-t')].map(n => n.textContent),
    basket: [...document.querySelectorAll('.pshop-basket .pshop-t')].map(n => n.textContent).sort(), n: document.querySelector('.pl-shopbtn .pl-n').textContent}));
  yes('ticked off: milk and the drill bits go into the basket, and the count drops', !S1.list.includes('milk') && S1.basket.join() === 'drill bits,milk' && S1.n === '5', S1);
  await p.click('#pshopClear'); await p.waitForTimeout(400);
  const S2 = await p.evaluate(() => ({basket: !!document.querySelector('.pshop-basket'), milk: S.tasks.some(t => t.text === 'milk'),
    drill: (S.tasks.find(t => t.text === 'drill bits') || {}), }));
  yes('"clear the basket": milk is gone; the drill bits, a task of the Kitchen list, stay there (done) and leave the shopping list',
    !S2.basket && !S2.milk && S2.drill.done && !S2.drill.shop, S2);
  await p.click(`[data-pshopdel="${await row('eggs')}"]`); await p.waitForTimeout(400);
  yes('× takes a thing off the list', await p.evaluate(() => !S.tasks.some(t => t.text === 'eggs')));

  console.log('\n6. kept');
  await p.evaluate(async () => { await saveNow(); await load(); });
  await p.reload(); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { location.hash = '#/planning'; }); await p.waitForTimeout(1200);
  await p.click('.pl-shopbtn'); await p.waitForTimeout(500);
  is('after a reload, the list is as it was left', await p.evaluate(() => [...document.querySelectorAll('.pshop-list .pshop-t')].map(n => n.textContent)),
    ['bread', 'washing-up liquid', 'oat milk', 'coffee beans']);

  console.log('\n7. on a phone');
  await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(500);
  const PH = await p.evaluate(() => ({over: document.documentElement.scrollWidth - innerWidth, btn: !!document.querySelector('.pl-shopbtn').getBoundingClientRect().width}));
  yes('the button and the list fit 390px', PH.over <= 1 && PH.btn, PH);

  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
