/* smoke146 — a skill is a bundle of abilities, each with a rubric of its own,
   and the tree flowers by how far the parts have actually come */
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
  const p = await b.newPage({viewport:{width:1500, height:1400}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }
  await p.evaluate(() => { location.hash = '#/skills'; rerender(); }); await p.waitForTimeout(1600);
  const sid = await p.evaluate(() => S.skills[0].id);

  console.log('\n1. a skill left whole is unchanged');
  is('no abilities until one is named', await p.evaluate(i => byId(S.skills, i).abilities.length, sid), 0);
  is('  and the reading is still its own level',
     await p.evaluate(i => { const s = byId(S.skills, i);
       return Math.abs(skillProgress(s) - (s.currentLevel / skillLevelCount(s))) < 1e-9; }, sid), true);
  await p.evaluate(i => openSkillPanel(i), sid); await p.waitForTimeout(700);
  yes('the panel offers to break it up', await p.evaluate(() => !!document.querySelector('#abAdd')));
  yes('  and says why, before there is anything to show', await p.evaluate(() =>
    /do not move together/.test(document.querySelector('#panel')?.textContent || '')));

  console.log('\n2. naming one gives it a rubric of its own');
  await p.evaluate(() => document.querySelector('#abAdd').click()); await p.waitForTimeout(900);
  is('the name field is focused, ready to type',
     await p.evaluate(() => document.activeElement?.tagName), 'INPUT');
  await p.keyboard.type('Speaking'); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  is('  the name is kept', await p.evaluate(i => byId(S.skills, i).abilities[0].name, sid), 'Speaking');
  is('  with three levels of its own',
     await p.evaluate(i => byId(S.skills, i).abilities[0].levels.length, sid), 3);
  is('  and a dot for each', await p.$$eval('.ab-dot', n => n.length), 3);

  console.log('\n3. the dots set the level, and give it back');
  await p.evaluate(() => document.querySelectorAll('.ab-dot')[2].click()); await p.waitForTimeout(700);
  is('pressing the third dot is level three',
     await p.evaluate(i => byId(S.skills, i).abilities[0].currentLevel, sid), 3);
  await p.evaluate(() => document.querySelectorAll('.ab-dot')[2].click()); await p.waitForTimeout(700);
  is('  pressing it again steps back one',
     await p.evaluate(i => byId(S.skills, i).abilities[0].currentLevel, sid), 2);

  console.log('\n4. each level of an ability carries criteria');
  /* a freshly named ability is already open — you have just made it, so you
     are about to write into it. Pressing the head folds it away and back. */
  yes('a new ability is open, because you are about to fill it in',
      await p.evaluate(() => !!document.querySelector('.ab.open')));
  await p.evaluate(() => document.querySelector('[data-abexpand]').click()); await p.waitForTimeout(700);
  yes('  pressing the head folds it away', await p.evaluate(() => !document.querySelector('.ab.open')));
  await p.evaluate(() => document.querySelector('[data-abexpand]').click()); await p.waitForTimeout(700);
  yes('  and back', await p.evaluate(() => !!document.querySelector('.ab.open')));
  await p.evaluate(() => document.querySelector('[data-abcritadd]').click()); await p.waitForTimeout(900);
  await p.keyboard.type('order lunch without rehearsing it'); await p.keyboard.press('Enter');
  await p.waitForTimeout(800);
  is('  a criterion can be written',
     await p.evaluate(i => byId(S.skills, i).abilities[0].levels[0].criteria[0].text, sid),
     'order lunch without rehearsing it');
  await p.evaluate(() => document.querySelector('[data-abcrit]').click()); await p.waitForTimeout(700);
  is('  and ticked', await p.evaluate(i => byId(S.skills, i).abilities[0].levels[0].criteria[0].done, sid), true);
  is('  with the day it was met',
     await p.evaluate(i => byId(S.skills, i).abilities[0].levels[0].criteria[0].metAt, sid),
     await p.evaluate(() => today()));

  console.log('\n5. the skill is read by its parts');
  await p.evaluate(i => { const s = byId(S.skills, i);
    s.abilities = [Object.assign(newAbility('Speaking', 3), {currentLevel:3, order:0}),
                   Object.assign(newAbility('Reading',  3), {currentLevel:1, order:1})];
    saveNow(); reopenPanel(() => { rerender(); openSkillPanel(i); }); }, sid);
  await p.waitForTimeout(1000);
  is('two abilities at 3/3 and 1/3 read 67%',
     await p.evaluate(i => Math.round(skillProgress(byId(S.skills, i)) * 100), sid), 67);
  is('  the one furthest behind is named',
     await p.evaluate(i => weakestAbility(byId(S.skills, i))?.name, sid), 'Reading');
  is('  and marked in the list',
     await p.evaluate(() => document.querySelector('.ab.weakest .ab-name')?.textContent.trim()), 'Reading');
  yes('  the panel says where the next hour is worth most', await p.evaluate(() =>
    /furthest behind is/.test(document.querySelector('#panel')?.textContent || '')));
  yes('  and the header stops quoting a level the skill no longer has alone',
    await p.evaluate(() => /2 abilities · 67%/.test(document.querySelector('#panel .mono')?.textContent || '')));
  /* the average is what a bundle is worth, and it moves when a part moves */
  await p.evaluate(i => { byId(S.skills, i).abilities[1].currentLevel = 3; saveNow(); }, sid);
  is('moving the weak one moves the whole reading',
     await p.evaluate(i => Math.round(skillProgress(byId(S.skills, i)) * 100), sid), 100);

  console.log('\n6. the tree flowers off the roll-up');
  await p.evaluate(i => { const s = byId(S.skills, i);
    s.abilities.forEach(a => a.currentLevel = 1); s.currentLevel = 5; saveNow();
    closePanel(); rerender(); }, sid);
  await p.waitForTimeout(4800);
  const low = await p.evaluate(i => {
    const g = document.querySelector(`[data-skilltwig="${i}"], .sk-twig[data-skill="${i}"]`);
    return document.querySelectorAll('.blossom').length; }, sid);
  yes('the tree still draws', low > 0, `blossoms: ${low}`);
  is('  a skill whose parts are all at level 1 reads low, whatever its own level says',
     await p.evaluate(i => Math.round(skillProgress(byId(S.skills, i)) * 100), sid), 33);
  is('  and it is not mastered',
     await p.evaluate(i => { const s = byId(S.skills, i);
       return !s.planned && (skillAbilities(s).length ? skillProgress(s) >= 1
         : skillLevelCount(s) >= 2 && s.currentLevel >= skillLevelCount(s)); }, sid), false);

  console.log('\n7. it survives a reload');
  await p.evaluate(() => saveNow()); await p.waitForTimeout(600);
  await p.reload(); await p.waitForTimeout(2200);
  is('the abilities are still there',
     await p.evaluate(i => (byId(S.skills, i).abilities || []).map(a => a.name).join(','), sid),
     'Speaking,Reading');
  is('  with their criteria',
     await p.evaluate(i => byId(S.skills, i).abilities[0].levels[0].criteria.length, sid), 0);

  console.log('\n8. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke146  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
