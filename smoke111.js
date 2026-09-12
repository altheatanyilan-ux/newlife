/* smoke111 — a value edited in one place stops being stale everywhere else.
   Renaming a skill in its panel left the inventory behind it saying the old
   name until a reload; the same held wherever a value is shown twice. */
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
  const p = await b.newPage({viewport:{width:1500, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const go = async h => { await p.evaluate(x => { if(location.hash === x) rerender(); else location.hash = x; }, h);
    await p.waitForTimeout(1500); };
  /* retype a field in place and commit it the way a person does */
  const retype = async (sel, text) => {
    await p.click(sel); await p.waitForTimeout(350);
    await p.keyboard.press('Control+A'); await p.keyboard.type(text);
    await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  };

  console.log('\n1. a skill renamed in its panel, seen from the page behind');
  await go('#/skills');
  const sid = await p.evaluate(() => S.skills[0].id);
  const wasNamed = await p.evaluate(i => byId(S.skills, i).name, sid);
  await p.evaluate(i => openSkillPanel(i), sid); await p.waitForTimeout(1000);
  await retype('#panel .ed[data-path$=".name"]', 'Renamed in the panel');
  is('the name changed in the data', await p.evaluate(i => byId(S.skills, i).name, sid), 'Renamed in the panel');
  yes('the inventory behind it says the new name', await p.evaluate(() =>
    [...document.querySelectorAll('.inv-name b')].some(n => n.textContent === 'Renamed in the panel')));
  yes('  and no longer the old one', await p.evaluate(o =>
    ![...document.querySelectorAll('.inv-name b')].some(n => n.textContent === o), wasNamed), wasNamed);
  yes('and the panel is still open, where you left it', !!(await p.$('#panel')));
  await p.evaluate(() => closePanel());

  console.log('\n2. the same, in Projects');
  await go('#/projects');
  const pid = await p.evaluate(() => S.projects[0].id);
  await p.evaluate(i => openProjectPanel(i), pid); await p.waitForTimeout(1000);
  await retype('#panel .ed[data-path$=".name"]', 'A renamed project');
  yes('the inventory row updates', await p.evaluate(() =>
    [...document.querySelectorAll('#pInv .inv-name b')].some(n => n.textContent === 'A renamed project')));
  yes('  and the card in the grid too', await p.evaluate(() =>
    [...document.querySelectorAll('#pcards .hd h3')].some(n => n.textContent === 'A renamed project')));
  yes('  the panel survived', !!(await p.$('#panel')));
  await p.evaluate(() => closePanel());

  console.log('\n3. the same, in the Library');
  await go('#/commonplace');
  const mid = await p.evaluate(() => mediaEntries()[0]?.id);
  if(!mid) no('a work to rename', 'nothing on the shelf');
  else {
    await p.evaluate(i => openMediaPanel(i), mid); await p.waitForTimeout(1000);
    await retype('#panel h2 .ed', 'A renamed work');
    yes('the shelf behind it updates',
        await p.evaluate(() => /A renamed work/.test(document.querySelector('#main').textContent)));
    yes('  the panel survived', !!(await p.$('#panel')));
    await p.evaluate(() => closePanel());
  }

  console.log('\n4. a field edited on the page itself, with no panel involved');
  const vid = await p.evaluate(() => S.values[0]?.id);
  await go('#/value/' + vid);
  const before = await p.evaluate(() => location.hash);
  await p.click('#main .ed'); await p.waitForTimeout(350);
  await p.keyboard.type('an answer typed just now');
  await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
  yes('what was typed is on the page', await p.evaluate(() =>
    /an answer typed just now/.test(document.querySelector('#main').textContent)));
  is('and the redraw did not navigate anywhere', await p.evaluate(() => location.hash), before);

  console.log('\n5. clicking straight from one field to the next keeps the second');
  /* the redraw waits a tick; if it fired regardless it would tear the next
     edit out from under the caret */
  await go('#/skills');
  await p.evaluate(i => openSkillPanel(i), sid); await p.waitForTimeout(1000);
  const eds = await p.$$('#panel .ed');
  yes('there are two fields to move between', eds.length >= 2, String(eds.length));
  await eds[0].click(); await p.waitForTimeout(300);
  await p.keyboard.press('Control+A'); await p.keyboard.type('first field');
  await eds[1].click();                      // no pause: straight to the next
  await p.waitForTimeout(600);
  is('exactly one field is open', await p.evaluate(() => document.querySelectorAll('.ed.editing').length), 1);
  is('  and the caret is in it', await p.evaluate(() => document.activeElement.tagName), 'INPUT');
  await p.keyboard.type('second field'); await p.keyboard.press('Enter');
  await p.waitForTimeout(900);
  is('both edits landed', await p.evaluate(i => { const s = byId(S.skills, i);
    return JSON.stringify([s.name, s.why]).includes('first field') ? 'kept' : 'lost'; }, sid), 'kept');

  console.log('\n6. a redraw is not triggered by an edit that changed nothing');
  await p.evaluate(() => { window.__renders = 0; const r = rerender;
    window.rerender = function(){ window.__renders++; return r.apply(this, arguments); }; });
  const eds2 = await p.$$('#panel .ed');
  await eds2[0].click(); await p.waitForTimeout(300);
  await p.keyboard.press('Escape');          // committed unchanged
  await p.waitForTimeout(700);
  is('nothing was redrawn', await p.evaluate(() => window.__renders), 0);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke111  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
