/* smoke123 — a criterion is an observable behaviour, so it can be ticked */
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
  const p = await b.newPage({viewport:{width:1500, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  console.log('\n1. criteria written before today are still there, and now tick');
  /* the old shape was a bare string; nobody should lose what they wrote */
  const sid = await p.evaluate(() => {
    const s = S.skills[0];
    s.levels[0].criteria = ['Can hold a conversation', 'Can read a menu'];
    saveNow(); return s.id;
  });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2600);
  const shape = await p.evaluate(i => byId(S.skills, i).levels[0].criteria, sid);
  is('both survive the change of shape', shape.length, 2);
  is('  with their words intact', shape[0].text, 'Can hold a conversation');
  yes('  each with an id of its own', shape.every(c => !!c.id), JSON.stringify(shape));
  yes('  and none of them met yet', shape.every(c => c.done === false));

  console.log('\n2. the criterion can be ticked in the panel');
  await p.evaluate(() => { location.hash = '#/skills'; rerender(); }); await p.waitForTimeout(1200);
  await p.evaluate(i => openSkillPanel(i), sid); await p.waitForTimeout(1000);
  /* levels are folded; open the first one */
  await p.evaluate(() => document.querySelector('#panel .lvl[data-level="1"] .lvl-head').click());
  await p.waitForTimeout(500);
  const boxes = await p.$$('#panel .lvl[data-level="1"] .lvl-criteria [data-crittick]');
  is('every criterion wears a checkbox', boxes.length, 2);
  yes('  drawn the way a task checkbox is', await p.evaluate(() =>
    document.querySelector('#panel .lvl-criteria [data-crittick]').classList.contains('task-check')));
  await boxes[0].click(); await p.waitForTimeout(900);
  const after = await p.evaluate(i => byId(S.skills, i).levels[0].criteria, sid);
  is('ticking one marks it met', after[0].done, true);
  yes('  and remembers when', !!after[0].metAt, String(after[0].metAt));
  is('  leaving the other alone', after[1].done, false);

  console.log('\n3. the tick shows, and the level says how many are met');
  await p.evaluate(i => openSkillPanel(i), sid); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelector('#panel .lvl[data-level="1"] .lvl-head').click());
  await p.waitForTimeout(500);
  yes('the met one is struck through', await p.evaluate(() => {
    const li = document.querySelector('#panel .lvl[data-level="1"] .lvl-criteria li');
    return li.classList.contains('met') && getComputedStyle(li.querySelector('.ed')).textDecorationLine === 'line-through';
  }));
  const count = await p.evaluate(() => document.querySelector('#panel .lvl[data-level="1"] .crit-count')?.textContent.trim());
  is('the level counts them', count, '1/2 met');

  console.log('\n4. a criterion added now is the new shape, and can be typed into');
  await p.evaluate(() => document.querySelector('#panel .lvl[data-level="1"] [data-critadd]').click());
  await p.waitForTimeout(900);
  const grew = await p.evaluate(i => byId(S.skills, i).levels[0].criteria, sid);
  is('there are three now', grew.length, 3);
  yes('  the new one is an object with a tick of its own',
      typeof grew[2] === 'object' && grew[2].done === false && !!grew[2].id, JSON.stringify(grew[2]));
  /* the row is created blank, and Living View hides blank rows — the fix in
     beginEdit unhides it, so the caret really lands in the field */
  const typed = await p.evaluate(() => {
    const el = document.activeElement;
    return {tag: el.tagName.toLowerCase(), w: el.getBoundingClientRect().width};
  });
  yes('  and the caret is in a field with room to type it',
      typed.tag === 'input' || typed.tag === 'textarea', JSON.stringify(typed));
  yes('  which is on screen, not hidden', typed.w > 0, JSON.stringify(typed));
  await p.keyboard.type('Can order at a counter');
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  is('what was typed is kept', await p.evaluate(i => byId(S.skills, i).levels[0].criteria[2].text, sid),
     'Can order at a counter');

  console.log('\n5. and one can be taken away again');
  await p.evaluate(i => openSkillPanel(i), sid); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelector('#panel .lvl[data-level="1"] .lvl-head').click());
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelectorAll('#panel .lvl[data-level="1"] [data-critdel]')[1].click());
  await p.waitForTimeout(1100);
  const left = await p.evaluate(i => byId(S.skills, i).levels[0].criteria.map(c => c.text), sid);
  is('two are left', left.length, 2);
  yes('  and it is the right two', !left.includes('Can read a menu'), left.join(' | '));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke123  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
