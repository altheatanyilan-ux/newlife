/* smoke277 — focus mode: somewhere to park what comes up, and a cheat sheet
   for what pulls you away.

   The claims.

   PARKED. On the focus desk, beside the notes on the sitting, one line takes
   a thought: Enter, and it is parked and the box is ready for the next one
   (the caret never leaves). Plain text is a to-do with a box to tick; a first
   "-" makes a note, "*" an idea, "?" something to look up, "~" a worry — the
   kind lights up as it is typed — or a press on the kind's mark. Each one
   remembers which sitting it came up in, and the day's log says how many
   were parked in each sitting. P comes to the box.

   Afterwards: a to-do ticks off (and back); anything becomes a task (the
   Inbox, today, tomorrow — a look-up becomes "Look up: …"), goes into the
   journal as an unfinished thought (an idea tagged as one), is let go, or is
   thrown away — each says where it went and can be undone. "Sort them" goes
   through them all. A break, and leaving focus mode, mention what is parked.
   Ten minutes on the clock clears the small ones.

   FOCUS MODE ON A PAGE shows the same box in a pocket in the corner; P opens it.

   THE CHEAT SHEET. "phone buzzing → in the other room" notes a distraction
   and what to do about it; the same thing again counts it up. What to do can
   be changed in place. At the start of every sitting the sheet flashes up,
   most frequent first, to clear before starting — and not again when a
   sitting is only resumed. It can be turned off. A handled one leaves the
   sheet and comes back if noted again. D comes to the box.

   Both are kept (S.planning.parked, S.planning.distractions) and survive a reload.

   Run: NODE_PATH=node_modules node smoke277.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
const FILE = 'file://' + path.join(__dirname, 'index.html');

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport: {width: 1400, height: 1000}});
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto(FILE); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  const calm = () => p.evaluate(() => { closeModals(); document.querySelectorAll('.dv-veil, .dx-flashcard, .toast').forEach(n => n.remove()); });
  await calm();
  const toasts = () => p.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent.replace(/\s+/g, ' ').trim()));
  const parked = () => p.evaluate(() => (S.planning.parked || []).map(x => ({text: x.text, kind: x.kind, fate: x.fate, done: x.done, sit: !!(x.during && x.during.sitStart)})));

  /* a task on the clock, focus mode on Today: the desk */
  const task = await p.evaluate(() => { const t = newPlanTask('Transcribe the solo', today(), {listId: 'inbox'}); S.tasks.push(t);
    S.planning.parked = []; S.planning.distractions = []; delete S.planning.dxFlash; saveNow();
    FocusTimer.reset(); FocusTimer.setMode('countdown'); FocusTimer.setLength(25); FocusTimer.setTask(t.id);
    S.settings.todayView = 'do'; location.hash = '#/today'; return t.id; });
  await p.waitForTimeout(800);
  await p.evaluate(() => setPageFocus(true)); await p.waitForTimeout(900);
  await p.evaluate(() => FocusTimer.start()); await p.waitForTimeout(1200);
  await calm(); /* the cheat sheet is empty, so nothing flashed — cleared anyway */

  console.log('\n1. parked, on the desk');
  yes('the desk has the box beside the notes on the sitting', await p.evaluate(() => !!document.querySelector('.pf-desk #t-focus .pk [data-pkinp]')));
  const inp = '.pf-desk .pk [data-pkinp]';
  await p.click(inp); await p.keyboard.type('call the printer about the paper'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  let st = await p.evaluate(() => { const i = document.querySelector('.pf-desk .pk [data-pkinp]');
    return {focused: document.activeElement === i, value: i.value, rows: [...document.querySelectorAll('.pf-desk .pk-it')].map(n => n.className),
      count: document.querySelector('.pf-desk .pk-count').textContent}; });
  yes('Enter parks it, and the box is empty and still has the caret', st.focused && st.value === '' && st.rows.length === 1, st);
  yes('  a plain line is a to-do, with a box to tick', /k-todo/.test(st.rows[0]) && await p.evaluate(() => !!document.querySelector('.pf-desk .pk-it [data-pkact="tick"]')));
  yes('  it says how many wait, and how many came up this sitting', /1 to sort · 1 this sitting/.test(st.count), st.count);
  await p.keyboard.type('- the second chapter could open with the letter');
  const lit = await p.evaluate(() => document.querySelector('.pf-desk .pk-kind.on')?.dataset.pkkind);
  is('  the kind lights up as its mark is typed', lit, 'note');
  await p.keyboard.press('Enter');
  for(const line of ['* a podcast about how proofs are made', '? how long do proofs usually take', '~ worried Thursday will slip']){
    await p.keyboard.type(line); await p.keyboard.press('Enter'); await p.waitForTimeout(120); }
  await p.click('.pf-desk [data-pkkind="idea"]'); await p.keyboard.type('a cover in blue'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  let all = await parked();
  is('each mark makes its kind', all.map(x => x.kind), ['todo', 'note', 'idea', 'ask', 'worry', 'idea']);
  is('  and the mark is not kept in the words', all.map(x => x.text)[3], 'how long do proofs usually take');
  yes('  a press on a kind\'s mark works too', all[5].text === 'a cover in blue' && all[5].kind === 'idea');
  yes('  each remembers the sitting it came up in', all.every(x => x.sit));
  await p.evaluate(() => document.activeElement.blur());
  await p.keyboard.press('p'); await p.waitForTimeout(300);
  yes('P comes to the box', await p.evaluate(() => document.activeElement === document.querySelector('.pf-desk .pk [data-pkinp]')));
  await p.evaluate(() => document.activeElement.blur());
  const logged = await p.evaluate(() => { const s = FocusTimer.state();
    return focusSessionHTML({startedAt: s.startedAt, duration: 25, taskId: s.taskId, type: 'focus', breaks: []}); });
  yes('the sitting in the day\'s log says how many were parked in it', /✎ 6 parked/.test(logged));

  console.log('\n2. afterwards: tick, task, journal, let go, undo');
  await p.click('.pf-desk .pk-it.k-todo [data-pkact="tick"]'); await p.waitForTimeout(250);
  all = await parked();
  yes('a to-do ticks off', all[0].done === true && all[0].fate === 'done');
  yes('  and shows struck through, where it can be ticked back', await p.evaluate(() => !!document.querySelector('.pf-desk .pk-it.done')));
  await p.click('.pf-desk .pk-it.done [data-pkact="tick"]'); await p.waitForTimeout(250);
  yes('  and back', (await parked())[0].done === false && (await parked())[0].fate === '');
  /* the actions sit over the end of the row, and only answer when the row is
     pointed at — an idle click on the time can never throw a thought away */
  const hitAt = () => p.evaluate(() => { const b = document.querySelector('.pf-desk .pk-it.k-todo [data-pkact="task"]'); const r = b.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === b; });
  await p.mouse.move(5, 5); await p.waitForTimeout(150);
  yes('a row\'s actions cannot be hit until the row is pointed at', !(await hitAt()));
  await p.hover('.pf-desk .pk-it.k-todo'); await p.waitForTimeout(150);
  yes('  and then they can', await hitAt());
  await p.click('.pf-desk .pk-it.k-todo [data-pkact="task"]'); await p.waitForTimeout(300);
  let tk = await p.evaluate(() => S.tasks.find(t => t.text === 'call the printer about the paper'));
  yes('→ task makes a task, in the Inbox', tk && tk.listId === 'inbox' && !tk.day, tk && {list: tk.listId, day: tk.day});
  yes('  says where it went, with an undo', (await toasts()).some(t => /A task now, for the Inbox/.test(t) && /undo/.test(t)), await toasts());
  await p.evaluate(() => [...document.querySelectorAll('.toast .toast-act')].pop().click()); await p.waitForTimeout(300);
  yes('  and undo takes the task back and parks it again', await p.evaluate(() => !S.tasks.some(t => t.text === 'call the printer about the paper'))
    && (await parked())[0].fate === '');
  await calm();

  await p.click('.pf-desk [data-pksort]'); await p.waitForTimeout(400);
  yes('"sort them" goes through all six', await p.evaluate(() => document.querySelectorAll('.pks-it').length) === 6);
  const act = (i, a) => p.evaluate(([i, a]) => document.querySelectorAll('.pks-it')[i].querySelector(`[data-pkact="${a}"]`).click(), [i, a]);
  const find = t => p.evaluate(t => [...document.querySelectorAll('.pks-it')].findIndex(n => n.querySelector('[data-pkstext]').value === t), t);
  await act(await find('how long do proofs usually take'), 'today'); await p.waitForTimeout(250);
  tk = await p.evaluate(() => S.tasks.find(t => /how long do proofs usually take/.test(t.text)));
  yes('a look-up → today becomes "Look up: …", for today', tk && tk.text === 'Look up: how long do proofs usually take' && tk.day === await p.evaluate(() => today()), tk && tk.text);
  await act(await find('a podcast about how proofs are made'), 'journal'); await p.waitForTimeout(250);
  const je = await p.evaluate(() => S.entries.find(e => e.body === 'a podcast about how proofs are made'));
  yes('an idea → journal is an unfinished thought, tagged as an idea', je && je.extra.unfinished && je.tags.includes('idea'), je && {tags: je.tags, x: je.extra});
  await act(await find('worried Thursday will slip'), 'letgo'); await p.waitForTimeout(250);
  yes('a worry can be let go', (await parked()).find(x => x.text === 'worried Thursday will slip').fate === 'released');
  await act(await find('call the printer about the paper'), 'tomorrow'); await p.waitForTimeout(250);
  tk = await p.evaluate(() => S.tasks.find(t => t.text === 'call the printer about the paper'));
  yes('→ tomorrow dates it tomorrow', tk && tk.day === await p.evaluate(() => addDays(today(), 1)));
  await p.evaluate(() => { const i = [...document.querySelectorAll('.pks-it')].find(n => n.querySelector('[data-pkstext]').value === 'a cover in blue');
    const t = i.querySelector('[data-pkstext]'); t.value = 'a cover in deep blue'; t.dispatchEvent(new Event('change', {bubbles: true})); });
  await p.waitForTimeout(200);
  yes('its words can be changed while sorting', (await parked()).some(x => x.text === 'a cover in deep blue'));
  await p.evaluate(() => { const i = [...document.querySelectorAll('.pks-it')].find(n => n.querySelector('[data-pkstext]').value === 'a cover in deep blue');
    i.querySelector('[data-pkskind="todo"]').click(); });
  await p.waitForTimeout(200);
  yes('  and its kind', (await parked()).find(x => x.text === 'a cover in deep blue').kind === 'todo');
  const left = await p.evaluate(() => document.querySelectorAll('.pks-it').length);
  is('what is left is still there, left parked', left, 2);
  await p.evaluate(() => closeModals()); await calm();

  console.log('\n3. a break, and leaving, mention it');
  await p.evaluate(() => FocusTimer.pause()); await p.waitForTimeout(900);
  yes('a break says what is parked, with the way to sort it', (await toasts()).some(t => /A break\. 2 things are parked/.test(t) && /sort them/.test(t)), await toasts());
  await calm();
  await p.evaluate(() => FocusTimer.start()); await p.waitForTimeout(400);
  await p.evaluate(() => setPageFocus(false)); await p.waitForTimeout(900);
  yes('leaving focus mode says how many were parked while focused', (await toasts()).some(t => /parked while you were focused/.test(t)), await toasts());
  await calm();
  yes('back on Today, the box is in the Focus section', await p.evaluate(() => !!document.querySelector('#main #t-focus .pk [data-pkinp]')));

  console.log('\n4. focus mode on a page: the pocket');
  await p.evaluate(() => { location.hash = '#/journals'; }); await p.waitForTimeout(900);
  await p.evaluate(() => setPageFocus(true)); await p.waitForTimeout(900); await calm();
  yes('a page in focus mode has the pocket in the corner, showing the count', await p.evaluate(() => /parked · 2/.test(document.querySelector('#pkPocket .pk-tab')?.textContent || '')));
  await p.keyboard.press('p'); await p.waitForTimeout(300);
  yes('P opens it, with the caret in the box', await p.evaluate(() => !document.querySelector('#pkPanel').hidden && document.activeElement === document.querySelector('#pkPanel [data-pkinp]')));
  await p.keyboard.type('reply to Sam about Saturday'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  yes('  parking from there works the same', (await parked()).some(x => x.text === 'reply to Sam about Saturday') && await p.evaluate(() => /parked · 3/.test(document.querySelector('#pkPocket .pk-tab').textContent)));
  yes('  and the cheat sheet is in the pocket too', await p.evaluate(() => !!document.querySelector('#pkPanel .dx [data-dxinp]')));
  await p.mouse.click(700, 500); await p.waitForTimeout(250);
  yes('clicking back on the page puts it away', await p.evaluate(() => document.querySelector('#pkPanel').hidden));
  await p.evaluate(() => setPageFocus(false)); await p.waitForTimeout(800); await calm();
  yes('leaving focus mode takes the pocket with it', await p.evaluate(() => !document.getElementById('pkPocket')));

  console.log('\n5. the distraction cheat sheet');
  await p.evaluate(() => { S.settings.todayView = 'do'; location.hash = '#/today'; }); await p.waitForTimeout(900);
  await p.evaluate(() => setPageFocus(true)); await p.waitForTimeout(900); await calm();
  const dx = '.pf-desk .dx [data-dxinp]';
  yes('the desk has the cheat sheet beside the parked box', !!(await p.$(dx)));
  await p.click(dx); await p.keyboard.type('phone buzzing → in the other room'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  await p.keyboard.type('email tab open'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  await p.keyboard.type('Phone buzzing!'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  let sheet = await p.evaluate(() => S.planning.distractions.map(x => ({t: x.text, fix: x.fix, n: x.hits.length})));
  is('noted with what to do; the same thing again counts it up', sheet, [{t: 'phone buzzing', fix: 'in the other room', n: 2}, {t: 'email tab open', fix: '', n: 1}]);
  yes('  and the caret stays in the box', await p.evaluate(() => document.activeElement === document.querySelector('.pf-desk .dx [data-dxinp]')));
  await p.click('.pf-desk .dx-it:nth-child(2) [data-dxact="fix"]'); await p.waitForTimeout(150);
  await p.keyboard.type('close it before starting'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  yes('what to do about it can be written in place', await p.evaluate(() => S.planning.distractions[1].fix === 'close it before starting'));
  await p.evaluate(() => document.activeElement.blur());
  await p.keyboard.press('d'); await p.waitForTimeout(250);
  yes('D comes to the box', await p.evaluate(() => document.activeElement === document.querySelector('.pf-desk .dx [data-dxinp]')));
  await p.evaluate(() => document.activeElement.blur());

  /* a new sitting: the sheet flashes */
  await p.evaluate(() => { FocusTimer.stop(false); FocusTimer.reset(); FocusTimer.setMode('countdown'); FocusTimer.setLength(25); FocusTimer.start(); });
  await p.waitForTimeout(1200);
  const fl = await p.evaluate(() => { const f = document.querySelector('.dx-flashcard');
    return f && {items: [...f.querySelectorAll('.dx-fc-list b')].map(n => n.textContent), fix: f.textContent.includes('in the other room')}; });
  yes('a new sitting brings the cheat sheet up, most frequent first', fl && fl.items[0] === 'phone buzzing' && fl.items.length === 2 && fl.fix, fl);
  await p.evaluate(() => document.querySelectorAll('.dx-flashcard [data-dxclr]').forEach(c => c.click()));
  await p.waitForTimeout(1200);
  yes('  ticking everything clears it away', await p.evaluate(() => !document.querySelector('.dx-flashcard')));
  yes('  and each clearing is counted', await p.evaluate(() => S.planning.distractions.every(x => x.cleared === 1)));
  await p.evaluate(() => FocusTimer.pause()); await p.waitForTimeout(300); await calm();
  await p.evaluate(() => FocusTimer.start()); await p.waitForTimeout(1200);
  yes('resuming the same sitting does not bring it back', await p.evaluate(() => !document.querySelector('.dx-flashcard')));
  await p.evaluate(() => { FocusTimer.stop(false); FocusTimer.reset(); FocusTimer.start(); }); await p.waitForTimeout(1200);
  yes('the next sitting does', await p.evaluate(() => !!document.querySelector('.dx-flashcard')));
  await p.click('.dx-flashcard [data-dxfoff]'); await p.waitForTimeout(600); await calm();
  yes('"stop showing this" turns it off', await p.evaluate(() => S.planning.dxFlash === false && !document.querySelector('.dx-flashcard')));
  await p.evaluate(() => { FocusTimer.stop(false); FocusTimer.reset(); FocusTimer.start(); }); await p.waitForTimeout(1200);
  yes('  and the next sitting starts without it', await p.evaluate(() => !document.querySelector('.dx-flashcard')));
  yes('  the box shows it off, to turn back on', await p.evaluate(() => { rerender(); return document.querySelector('.pf-desk [data-dxflash]').checked === false; }));
  await p.evaluate(() => { const c = document.querySelector('.pf-desk [data-dxflash]'); c.checked = true; c.dispatchEvent(new Event('change', {bubbles: true})); });
  yes('  and back on', await p.evaluate(() => S.planning.dxFlash === true));
  await p.hover('.pf-desk .dx-it:nth-child(2)');
  await p.click('.pf-desk .dx-it:nth-child(2) [data-dxact="handled"]'); await p.waitForTimeout(250);
  yes('a handled one leaves the sheet', await p.evaluate(() => document.querySelectorAll('.pf-desk .dx-it').length === 1 && S.planning.distractions[1].handled));
  await p.evaluate(() => dxNote('email tab open')); await p.evaluate(() => dxRepaint()); await p.waitForTimeout(150);
  yes('  and comes back if it happens again', await p.evaluate(() => !S.planning.distractions[1].handled && document.querySelectorAll('.pf-desk .dx-it').length === 2));
  await calm();

  console.log('\n6. ten minutes for the small ones');
  await p.evaluate(() => { FocusTimer.stop(false); FocusTimer.reset(); rerender(); }); await p.waitForTimeout(500);
  yes('with the clock idle, the box offers ten minutes for the to-dos', !!(await p.$('.pf-desk [data-pksweep]')));
  await p.click('.pf-desk [data-pksweep]'); await p.waitForTimeout(800); await calm();
  const sw = await p.evaluate(() => { const s = FocusTimer.state(); return {running: s.running, left: s.left, notes: s.notes}; });
  yes('it starts a ten-minute countdown for them', sw.running && sw.left > 590 && sw.left <= 600 && /Clearing what was parked/.test(sw.notes), sw);
  await p.evaluate(() => { FocusTimer.stop(false); FocusTimer.reset(); setPageFocus(false); }); await p.waitForTimeout(600); await calm();

  console.log('\n7. kept');
  await p.evaluate(() => saveNow()); await p.waitForTimeout(800);
  await p.goto(FILE + '#/today'); await p.waitForTimeout(1600); await calm();
  const kept = await p.evaluate(() => ({parked: (S.planning.parked || []).length, dx: (S.planning.distractions || []).length}));
  yes('both lists survive a reload', kept.parked === 7 && kept.dx === 2, kept);

  console.log('\n8. phone width');
  await p.setViewportSize({width: 390, height: 860}); await p.waitForTimeout(400);
  await p.evaluate(() => { location.hash = '#/journals'; }); await p.waitForTimeout(700);
  await p.evaluate(() => setPageFocus(true)); await p.waitForTimeout(700); await calm();
  await p.evaluate(() => parkPocketOpen(true)); await p.waitForTimeout(300);
  const fit = await p.evaluate(() => { const r = document.querySelector('#pkPanel').getBoundingClientRect();
    return {in: r.left >= 0 && r.right <= innerWidth, scroll: document.documentElement.scrollWidth <= innerWidth + 1}; });
  yes('the pocket fits a phone', fit.in && fit.scroll, fit);
  await p.screenshot({path: '/tmp/smoke277-pocket.png'});
  await p.evaluate(() => { parkPocketOpen(false); dxFlash(); }); await p.waitForTimeout(500);
  const ff = await p.evaluate(() => { const r = document.querySelector('.dx-flashcard').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
  yes('  and so does the flash', ff);
  await p.screenshot({path: '/tmp/smoke277-flash.png'});

  console.log('\n9. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
