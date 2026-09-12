/* smoke101 — the fields that never saved, a title that wraps, a folder that knows itself */
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
  const p = await b.newPage({viewport:{width:1400, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  console.log('\n1. a debounced handler keeps the element it was bound to');
  /* the bug in one line: nine fields were written as debounce(function(){ …this… }),
     and an arrow wrapper hands them no receiver at all */
  const keepsThis = await p.evaluate(() => new Promise(res => {
    const i = document.createElement('input'); i.value = 'held';
    document.body.appendChild(i);
    i.oninput = debounce(function(){ res(this && this.value); }, 10);
    i.dispatchEvent(new Event('input'));
    setTimeout(() => res('never fired'), 400);
  }));
  is('debounce passes the element through as `this`', keepsThis, 'held');

  console.log('\n2. so typing a task name in the panel actually saves it');
  await p.evaluate(() => { location.hash = '#/planning'; });
  await p.waitForTimeout(1700);
  const tid = await p.evaluate(() => { const r = document.querySelector('[data-ptrow]'); if(!r) return null;
    openPlanTask(r.dataset.ptrow); return r.dataset.ptrow; });
  if(!tid) no('the panel opens on a task', 'no planner row');
  else {
    await p.waitForTimeout(900);
    yes('the panel is open', !!(await p.$('#pdTitle')));
    await p.fill('#pdTitle', 'typed and never confirmed');
    await p.waitForTimeout(900);      // past the debounce, no Enter, no button
    is('typing alone saves it — no button, no confirmation',
       await p.evaluate(id => planTaskById(id).text, tid), 'typed and never confirmed');
    yes('and it says so rather than staying silent',
        await p.evaluate(() => !!document.querySelector('.saved-pulse')));
    await p.fill('#pdTitle', 'and Return finishes the job');
    await p.press('#pdTitle', 'Enter');
    await p.waitForTimeout(700);
    is('Return saves too, instead of doing nothing',
       await p.evaluate(id => planTaskById(id).text, tid), 'and Return finishes the job');

    console.log('\n3. a long name wraps instead of running off the end');
    const LONG = 'Draft the response to the second set of interrogatories and circulate it to everyone who has to sign off before Friday';
    await p.fill('#pdTitle', LONG);
    await p.waitForTimeout(700);
    const box = await p.evaluate(() => { const t = document.querySelector('#pdTitle');
      return {h: t.clientHeight, scroll: t.scrollHeight, tag: t.tagName, over: t.scrollWidth > t.clientWidth + 2}; });
    is('the title is something that can wrap at all', box.tag, 'TEXTAREA');
    yes('it grew to more than one line', box.h > 34, `${box.h}px`);
    yes('nothing is hidden below the fold of the field', box.scroll <= box.h + 2, `${box.scroll} vs ${box.h}`);
    yes('and nothing runs off the side', !box.over);
    /* and at the widest the panel goes */
    await p.evaluate(() => { const pan = document.querySelector('#panel'); if(pan) pan.style.setProperty('--panel-w', '1100px'); });
    await p.waitForTimeout(500);
    await p.evaluate(() => { const t = document.querySelector('#pdTitle'); t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; });
    const wide = await p.evaluate(() => { const t = document.querySelector('#pdTitle');
      return {h: t.clientHeight, scroll: t.scrollHeight, lines: Math.round(t.clientHeight / parseFloat(getComputedStyle(t).lineHeight))}; });
    yes('at full width it still shows the whole name', wide.scroll <= wide.h + 2, `${wide.scroll} vs ${wide.h}`);
    yes('  wrapping rather than sitting on one line', wide.lines >= 2, `${wide.lines} lines`);
    await p.evaluate(() => closePanel());
    await p.waitForTimeout(500);
  }

  console.log('\n4. a folder makes its own lists');
  const fid = await p.evaluate(() => {
    const p0 = planState();
    const f = {id: uid(), name: 'Client work', sortOrder: 0, isCollapsed: false};
    p0.folders.push(f); saveNow(); rerender(); return f.id;
  });
  await p.waitForTimeout(1000);
  yes('the folder carries a button of its own', !!(await p.$(`[data-plnewin="${fid}"]`)));
  await p.evaluate(id => document.querySelector(`[data-plnewin="${id}"]`).click(), fid);
  await p.waitForTimeout(600);
  yes('it opens the new-list dialog', !!(await p.$('#plnName')));
  is('with the folder already chosen, nothing to select',
     await p.evaluate(() => document.querySelector('#plnFolder').value), fid);
  await p.fill('#plnName', 'Acme');
  await p.click('#plnSave');
  await p.waitForTimeout(900);
  is('and the list lands in that folder',
     await p.evaluate(f => (planLists().find(l => l.name === 'Acme') || {}).folderId, fid), fid);

  console.log('\n5. the general new-list button still asks, because it has no folder to assume');
  await p.evaluate(() => { const n = document.querySelector('#plNewList'); if(n) n.click(); });
  await p.waitForTimeout(600);
  is('it opens with no folder chosen',
     await p.evaluate(() => document.querySelector('#plnFolder').value), '');
  await p.evaluate(() => closeModals());

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke101  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
