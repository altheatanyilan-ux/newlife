/* smoke271 — doors that open, a veil that covers, and the week's dates first.

   The claims.

   EVERY DOOR IN THE HOUSE OPENS. A press on an object in the house used to
   do nothing unless it landed on a stroke: the middle of the bookshelf, the
   piano, the desk was wall or floor. Now each object answers anywhere inside
   itself. Checked with a real click at the middle of every object in all four
   zones: each one goes somewhere or opens something. And every way out
   (the exits and the plan of the house) takes you to the zone it names.

   THE VEIL COVERS THE SCREEN. Before the cards are dealt, "Take a breath…
   hold your question in your mind" is a full-screen veil over everything —
   it had become a strip at the foot of the page, behind the dialog.

   THE WEEK'S MILESTONES, FIRST. The planner's milestones due in the next
   seven days (and any overdue) are the first thing on Today, in every view,
   and pressing one opens its list narrowed to its work. One due in a month
   is not there.

   Run: NODE_PATH=node_modules node smoke271.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 1000}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }

  const toZone = async zone => {
    await p.evaluate(z => { closeModals(); document.querySelectorAll('.dv-veil').forEach(n => n.remove());
      S._houseZone = z; S.settings.houseZone = z; S.settings.todayView = 'in';
      if(location.hash !== '#/today') location.hash = '#/today'; else rerender(); }, zone);
    await p.waitForTimeout(800);
    await p.evaluate(() => { const d = document.getElementById('t-sacred'); if(d) d.open = true;
      document.querySelector('.house-stage')?.scrollIntoView({block: 'center'}); });
    await p.waitForTimeout(300);
  };

  console.log('\n1. every door in the house opens');
  const dead = [];
  let tried = 0;
  for(const zone of ['main', 'sanctuary', 'garden', 'roof']){
    await toZone(zone);
    const rooms = await p.evaluate(() => [...document.querySelectorAll('.house-stage [data-room]')].map(n => n.dataset.room));
    for(const r of rooms){
      await toZone(zone);
      const box = await p.evaluate(r => { const el = document.querySelector(`.house-stage [data-room="${r}"]`);
        el.scrollIntoView({block: 'center'}); const rc = el.getBoundingClientRect();
        return {x: rc.left + rc.width / 2, y: rc.top + rc.height / 2}; }, r);
      const before = await p.evaluate(() => { const t = document.getElementById('t-theatre'); if(t) t.open = false; return location.hash; });
      await p.mouse.click(box.x, box.y); tried++;
      await p.waitForTimeout(700);
      /* somewhere else, something opened, or a section of Today opened for it (the mirror opens the Theatre) */
      const after = await p.evaluate(() => ({hash: location.hash,
        opened: document.querySelectorAll('#modals .overlay, .dv-veil, .ring-overlay, [class*="ceremony"], .still-ring, .sr-veil').length
          + (document.getElementById('t-theatre')?.open ? 1 : 0)}));
      if(after.hash === before && !after.opened) dead.push(`${zone}/${r}`);
    }
  }
  yes(`all ${tried} objects answer a press at their middle`, !dead.length && tried > 20, dead.join(', '));
  const lost = [];
  for(const zone of ['main', 'sanctuary', 'garden', 'roof']){
    await toZone(zone);
    const ways = await p.evaluate(() => [...document.querySelectorAll('.house-exit, .hm-cell')].map(n =>
      (n.classList.contains('house-exit') ? '.house-exit' : '.hm-cell') + `[data-hgo="${n.dataset.hgo}"]`));
    for(const sel of ways){
      await toZone(zone);
      const go = sel.match(/data-hgo="(\w+)"/)[1];
      await p.click(sel); await p.waitForTimeout(700);
      const at = await p.evaluate(() => document.querySelector('.house-stage')?.dataset.zone);
      if(at !== go) lost.push(`${zone}: ${sel} → ${at}`);
    }
  }
  yes('  and every way out goes where it says', !lost.length, lost.join('; '));

  console.log('\n2. the veil before the cards covers the screen');
  await p.evaluate(() => { closeModals(); openTarot(); }); await p.waitForTimeout(400);
  await p.click('#dvDraw'); await p.waitForTimeout(1200);
  const v = await p.evaluate(() => { const veil = document.querySelector('.dv-veil'); if(!veil) return null;
    const r = veil.getBoundingClientRect(), t = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return {pos: getComputedStyle(veil).position, full: r.width >= innerWidth - 1 && r.height >= innerHeight - 1, onTop: veil.contains(t),
      says: veil.textContent.replace(/\s+/g, ' ')}; });
  yes('it is fixed over the whole viewport, on top of everything', v && v.pos === 'fixed' && v.full && v.onTop, v);
  yes('  and it asks for the intention', v && /Hold your question in your mind/.test(v.says), v && v.says);
  await p.evaluate(() => { document.querySelectorAll('.dv-veil').forEach(n => n.remove()); closeModals(); });

  console.log("\n3. the next seven days' milestones, first on Today");
  const ms = await p.evaluate(() => { const l = planLists()[0];
    const near = planAddMilestone(l.id, {name: 'Proofs to the printer', date: addDays(today(), 3)});
    const far = planAddMilestone(l.id, {name: 'The launch party', date: addDays(today(), 30)});
    saveNow(); S.settings.todayView = 'do'; location.hash = '#/today'; rerender(); return {near: near.id, far: far.id, list: l.id}; });
  await p.waitForTimeout(900);
  /* it rests folded; opened, it stays open while the page is used */
  await p.evaluate(() => { document.querySelector('.today-ms').open = true; }); await p.waitForTimeout(300);
  const top = await p.evaluate(() => { const pg = document.querySelector('.page.today-page');
    const first = pg && [...pg.children].find(n => !n.matches('.ctx-add'));
    return {first: first && first.className, items: [...document.querySelectorAll('.today-ms .pl-mspin')].map(n => n.textContent.replace(/\s+/g, ' ').trim())}; });
  yes('the first thing on Today is the milestones strip', /today-ms/.test(top.first || ''), top.first);
  yes('  with the one due in three days', top.items.some(t => /Proofs to the printer/.test(t) && /in 3 days/.test(t)), top.items);
  yes('  and not the one a month away', !top.items.some(t => /launch party/.test(t)), top.items);
  for(const v2 of ['tasks', 'review']){
    await p.evaluate(v => { S.settings.todayView = v; location.hash = '#/today/' + v; }, v2); await p.waitForTimeout(900);
    yes(`  it is at the top of the ${v2} view too`, await p.evaluate(() => { const pg = document.querySelector('.page.today-page');
      const first = pg && [...pg.children].find(n => !n.matches('.ctx-add')); return !!first && first.classList.contains('today-ms'); }));
  }
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today'; }); await p.waitForTimeout(800);
  await p.click(`.today-ms [data-plmsfilter="${ms.near}"] .pl-mslabel`); await p.waitForTimeout(900);
  const went = await p.evaluate(() => ({hash: location.hash, filter: (S._planFilter || {}).milestone}));
  /* the planner lives in Today's Tasks view now; #/planning lands there */
  yes('pressing it opens the planner, narrowed to that milestone', /#\/(planning|today\/tasks)/.test(went.hash) && went.filter === ms.near, went);

  console.log('\n4. nothing broke on the way');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
