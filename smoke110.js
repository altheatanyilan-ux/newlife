/* smoke110 — a blank field added by an "+ add" button can actually be typed
   into. Living View hides anything empty, which is right for reading and was
   fatal for writing: the row was hidden the instant it existed. */
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
  const p = await b.newPage({viewport:{width:1400, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  const id = await p.evaluate(() => S.skills[0].id);
  await p.evaluate(() => { location.hash = '#/skills'; }); await p.waitForTimeout(1500);
  await p.evaluate(i => openSkillPanel(i), id); await p.waitForTimeout(1000);

  console.log('\n1. the panel opens in Living View, which is where the bug lived');
  yes('the panel is in Living View', await p.evaluate(() => !!document.querySelector('#panel .lv-mode, #panel.lv-mode, .side-panel.lv-mode')));
  await p.click('#panel .lvl[data-level="1"] .lvl-head'); await p.waitForTimeout(500);
  yes('a level opens', await p.evaluate(() => document.querySelector('#panel .lvl[data-level="1"]').classList.contains('open')));

  console.log('\n2. + criterion gives you something you can type into');
  await p.click('#panel .lvl[data-level="1"] [data-critadd]');
  await p.waitForTimeout(600);
  const box = await p.evaluate(() => {
    const inp = document.querySelector('#panel .lvl-criteria .ed.editing input');
    if(!inp) return null;
    const r = inp.getBoundingClientRect();
    return {w: Math.round(r.width), h: Math.round(r.height), focused: document.activeElement === inp};
  });
  yes('a field appears', !!box, 'nothing to type into');
  yes('  with a size on the screen', box.w > 40 && box.h > 8, JSON.stringify(box));
  yes('  and the cursor already in it', box.focused, 'focus went nowhere');
  /* typing with the keyboard alone is the whole point: the user does not get
     to click a box that is not there */
  await p.keyboard.type('plays a blues in three keys');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(800);
  is('what was typed is what was saved',
     await p.evaluate(i => byId(S.skills, i).levels[0].criteria.join('|'), id), 'plays a blues in three keys');
  yes('  and it is now readable on the panel',
      await p.evaluate(() => /plays a blues/.test(document.querySelector('#panel .lvl-criteria').textContent)));

  console.log('\n2b. and again, so it is not a one-off');
  await p.click('#panel .lvl[data-level="1"] [data-critadd]');
  await p.waitForTimeout(600);
  await p.keyboard.type('sight-reads a lead sheet');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(800);
  is('both are there', await p.evaluate(i => byId(S.skills, i).levels[0].criteria.length, id), 2);

  console.log('\n3. + resource goes through the same door');
  await p.click('#panel .lvl[data-level="1"] [data-resadd]');
  await p.waitForTimeout(600);
  yes('the cursor is in the new field', await p.evaluate(() => document.activeElement.tagName === 'INPUT'));
  await p.keyboard.type('The Jazz Piano Book');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(800);
  is('the title was saved',
     await p.evaluate(i => byId(S.skills, i).levels[0].resources[0].title, id), 'The Jazz Piano Book');

  console.log('\n4. an empty one still disappears when you walk away from it');
  /* the hiding is right; it just must not happen while you are typing */
  await p.click('#panel .lvl[data-level="1"] [data-critadd]');
  await p.waitForTimeout(600);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(700);
  const hidden = await p.evaluate(() => {
    const eds = [...document.querySelectorAll('#panel .lvl-criteria .ed')];
    const last = eds[eds.length - 1];
    return {n: eds.length, blankIsHidden: last.classList.contains('lv-empty') || !last.textContent.trim()};
  });
  yes('the blank one is not left shouting at you', hidden.blankIsHidden, JSON.stringify(hidden));

  console.log('\n5. the same door, in another room');
  /* project resources and phases add blank rows the same way */
  await p.evaluate(() => { closePanel(); location.hash = '#/projects'; });
  await p.waitForTimeout(1500);
  const pid = await p.evaluate(() => S.projects[0].id);
  await p.evaluate(i => openProjectPanel(i), pid);
  await p.waitForTimeout(1000);
  const resBtn = await p.$('#resAdd');
  if(!resBtn) no('the project panel offers + resource', 'no #resAdd');
  else {
    await p.click('#resAdd'); await p.waitForTimeout(700);
    yes('the cursor lands in the new resource', await p.evaluate(() => document.activeElement.tagName === 'INPUT'));
    await p.keyboard.type('A reference I keep going back to');
    await p.keyboard.press('Enter'); await p.waitForTimeout(800);
    yes('and it saved', await p.evaluate(i => byId(S.projects, i).resources.some(r => r.title === 'A reference I keep going back to'), pid));
  }

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke110  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
