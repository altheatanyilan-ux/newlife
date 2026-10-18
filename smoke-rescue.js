/* smoke-rescue — the Overwhelm rescue space: a blank page, boxes anywhere, and the doors out of them.
   Run: NODE_PATH=node_modules node smoke-rescue.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + (g !== '' ? '  — ' + (typeof g === 'string' ? g : JSON.stringify(g)) : '')));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { document.querySelectorAll('.overlay,.toast').forEach(n => n.remove());
    const l = planNewList('Thesis'); l.milestones = [{id: 'msx', name: 'Viva', date: addDays(today(), 12)}];
    S.tasks.push(newPlanTask('write the abstract', '', {listId: l.id}));
    S.people.push(newPerson('Mira Okafor')); S.settings.todayView = 'do'; saveNow(); });

  console.log('\n1. the door, and a blank page');
  yes('Today has the door', await p.evaluate(() => { location.hash = '#/today'; return new Promise(r => setTimeout(() => r(!!document.querySelector('.rs-door')), 900)); }));
  await p.evaluate(() => { location.hash = '#/rescue'; }); await p.waitForTimeout(900);
  yes('the page is blank, with a hint, and no sheet is made until you write', await p.evaluate(() => !!document.querySelector('.rs-canvas') && !document.querySelector('.rs-hint').hidden && S.rescueSheets.length === 0));
  const canvas = await p.$('#rsCanvas'); const cb = await canvas.boundingBox();
  await p.mouse.click(cb.x + 200, cb.y + 140); await p.waitForTimeout(150);
  await p.keyboard.type('too many deadlines and I am tired'); await p.keyboard.press('Enter');
  await p.keyboard.type('Mira reply'); await p.keyboard.press('Tab');
  await p.keyboard.type('stay up or sleep?'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.mouse.click(cb.x + 700, cb.y + 420); await p.keyboard.type('Thesis viva prep'); await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  const st = await p.evaluate(() => ({sheets: S.rescueSheets.length, boxes: S.rescueSheets[0].boxes.map(b => [b.text, b.x, b.y, b.font]), hash: location.hash}));
  yes('one sheet, four boxes in different places and faces', st.sheets === 1 && st.boxes.length === 4 && new Set(st.boxes.map(x => x[1] + ',' + x[2])).size === 4 && st.boxes.every(x => x[3]), st);
  yes('Enter made one underneath, Tab one beside', st.boxes[1][2] > st.boxes[0][2] && st.boxes[2][1] > st.boxes[1][1], st.boxes);
  yes('the address now names the page', /#\/rescue\/.+/.test(st.hash));
  yes('an empty click leaves no empty box behind', await (async () => { await p.mouse.click(cb.x + 900, cb.y + 200); await p.waitForTimeout(100); await p.mouse.click(cb.x + 300, cb.y + 700); await p.keyboard.press('Escape'); await p.waitForTimeout(500); return p.evaluate(() => S.rescueSheets[0].boxes.every(b => (b.text || '').trim()) && document.querySelectorAll('.rs-box').length === 4); })());

  console.log('\n2. the site is in the page');
  const refs = await p.evaluate(() => [...document.querySelectorAll('.rs-box')].map(el => [el.querySelector('.rs-ta').value, [...el.querySelectorAll('.rs-ref')].map(r => r.textContent.trim())]));
  yes('a person named in a box gets a thread to them, with one line on what the site knows', refs.some(r => /Mira/.test(r[0]) && r[1].some(t => /Mira/.test(t) && /contact|touch/.test(t))), refs);
  yes('a list and its date, likewise', refs.some(r => /Thesis/.test(r[0]) && r[1].some(t => /Thesis/.test(t))), refs);

  console.log('\n3. select words, say what they are');
  const sel = async text => p.evaluate(t => { const ta = [...document.querySelectorAll('.rs-ta')].find(x => x.value.includes(t)); ta.focus(); const i = ta.value.indexOf(t); ta.setSelectionRange(i, i + t.length); ta.dispatchEvent(new MouseEvent('mouseup', {bubbles: true})); }, text);
  const menu = () => p.waitForSelector('.rs-menu', {timeout: 3000});
  await sel('too many deadlines'); await menu();
  yes('selecting words opens the menu on those words', await p.evaluate(() => /these words/.test(document.querySelector('.rs-menu').textContent) && document.querySelectorAll('.rs-m-b').length === 11));
  await p.click('.rs-m-b[data-x="task"]'); await p.waitForTimeout(500);
  yes('a task is made from the selection, in the Inbox, and the box says so', await p.evaluate(() => S.tasks.some(t => (t.text || t.title) === 'too many deadlines') && /task/.test(document.querySelector('.rs-marks').textContent)));
  await p.evaluate(() => document.querySelector('.toast .tbtn, .toast button') && document.querySelector('.toast .tbtn, .toast button').click()); await p.waitForTimeout(300);
  yes('undo takes it back', await p.evaluate(() => !S.tasks.some(t => (t.text || t.title) === 'too many deadlines') && !document.querySelector('.rs-marks').textContent.trim()));
  await sel('Mira reply'); await menu(); await p.click('.rs-m-b[data-x="person"]'); await p.waitForTimeout(200);
  yes('the person door lists whoever is named', await p.evaluate(() => /Mira Okafor/.test(document.querySelector('.rs-menu').textContent)));
  await p.click('[data-p]'); await p.waitForTimeout(150); await p.click('[data-a="reach"]'); await p.waitForTimeout(400);
  yes('reach out makes a task about them', await p.evaluate(() => S.tasks.some(t => /Reach out to Mira/.test(t.text || t.title || ''))));
  await sel('stay up or sleep?'); await menu(); await p.click('.rs-m-b[data-x="thread"]'); await p.waitForTimeout(200);
  await p.click('[data-k="turn"]'); await p.click('#rsMk'); await p.waitForTimeout(400);
  yes('a thread is made for the week, with days and the kind', await p.evaluate(() => { const t = weekPlan(weekStart(today())).threads.find(x => /stay up/.test(x.text)); return t && t.kind === 'turn' && t.days.includes(today()); }));
  await sel('Thesis viva prep'); await menu(); await p.click('.rs-m-b[data-x="journal"]'); await p.waitForTimeout(150); await p.click('[data-t="reflection"]'); await p.waitForTimeout(400);
  yes('a journal entry is made', await p.evaluate(() => S.entries.some(e => e.type === 'reflection' && /Thesis viva prep/.test(e.title))));
  await sel('Thesis viva prep'); await menu(); await p.click('.rs-m-b[data-x="decision"]'); await p.waitForTimeout(500);
  yes('the decision form opens with it in', await p.evaluate(() => { const t = document.querySelector('#dTitle'); return t && /Thesis viva prep/.test(t.value); }));
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  await sel('Thesis viva prep'); await menu(); await p.click('.rs-m-b[data-x="remind"]'); await p.waitForTimeout(150); await p.click('[data-o="1"]'); await p.waitForTimeout(400);
  yes('a reminder, for tomorrow morning', await p.evaluate(() => S.tasks.some(t => t.remind && /Thesis viva prep/.test(t.text || t.title || '') && t.day === addDays(today(), 1))));
  await sel('Thesis viva prep'); await menu(); await p.click('.rs-m-b[data-x="park"]'); await p.waitForTimeout(150); await p.click('[data-k="worry"]'); await p.waitForTimeout(400);
  yes('parked as a worry', await p.evaluate(() => parkedAll().some(x => x.kind === 'worry' && /Thesis viva prep/.test(x.text))));
  await sel('Thesis viva prep'); await menu(); await p.click('.rs-menu [data-hz="tonight"]'); await p.waitForTimeout(300);
  yes('a horizon is set on a box', await p.evaluate(() => S.rescueSheets[0].boxes.find(b => /viva/.test(b.text)).horizon === 'tonight' && /tonight/i.test(document.querySelector('.rs-hz:not(:empty)').textContent)));
  await sel('Mira reply'); await menu(); await p.click('.rs-m-b[data-x="letgo"]'); await p.waitForTimeout(400);
  yes('let go fades the box from the page, and keeps it in the record', await p.evaluate(() => { const b = S.rescueSheets[0].boxes.find(x => /Mira reply/.test(x.text)); return b.fate === 'letgo' && [...document.querySelectorAll('.rs-box')].find(e => /Mira reply/.test(e.querySelector('.rs-ta').value)).classList.contains('gone'); }));

  console.log('\n4. the plate, landing, the Review, the morning after');
  await p.click('[data-rs="rail"]'); await p.waitForTimeout(400);
  yes('the plate lists what is live and brings one onto the page', await p.evaluate(() => !!document.querySelector('.rs-ri')) );
  const n0 = await p.evaluate(() => document.querySelectorAll('.rs-box').length); await p.click('.rs-ri'); await p.waitForTimeout(300);
  yes('pressing one makes a box with it', await p.evaluate(n => document.querySelectorAll('.rs-box').length === n + 1, n0));
  yes('time was started on the clock for the page', await p.evaluate(() => { const r = timeRunning(); return !!r && r.feature === 'rescue'; }));
  await p.click('[data-rs="land"]'); await p.waitForTimeout(400);
  await p.fill('#rlDecide', 'sleep by 11:30'); await p.fill('#rlNext', 'write the first paragraph ~25m'); await p.fill('#rlDown', 'replying to everyone tonight'); await p.click('#rlGo'); await p.waitForTimeout(900);
  const L = await p.evaluate(() => ({l: S.rescueSheets[0].landing, ended: !!S.rescueSheets[0].endedAt, task: S.tasks.some(t => /first paragraph/.test(t.text || t.title || '')), running: !!timeRunning(), hash: location.hash}));
  yes('landing keeps the three things, makes the task, and stops the clock', L.l && L.l.decide === 'sleep by 11:30' && L.ended && L.task && !L.running, L);
  await p.evaluate(() => { location.hash = '#/today/review'; }); await p.waitForTimeout(1200);
  yes('the Review lists the page under its date', await p.evaluate(() => !!document.querySelector('.rs-rv-row') && /landed/.test(document.querySelector('.rs-rv-row').textContent)));
  await p.evaluate(() => { const s = S.rescueSheets[0]; s.day = addDays(today(), -1); s.landing = null; s.boxes.forEach(b => { if(b.fate !== 'letgo'){ b.fate = ''; b.exits = []; } }); saveNow(); });
  yes('the next morning one prompt offers what was left unsorted', await p.evaluate(() => promptQueue(today()).some(it => /^rescue:/.test(it.id) && /unsorted/.test(it.msg))));
  await p.evaluate(() => { location.hash = '#/rescue/' + S.rescueSheets[0].id; }); await p.waitForTimeout(900);
  yes('an earlier page opens again, boxes where they were', await p.evaluate(() => document.querySelectorAll('.rs-box').length >= 3));
  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(bad ? '\nFAILURES' : '\nall good'); process.exit(bad ? 1 : 0);
})();
