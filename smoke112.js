/* smoke112 — the Skill Tree's seven categories, and what happens to an install
   filed under the old six */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const WANT = ['Musical','Artistic','Income','Language','Intellectual','Social','Spirituality'];

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1500, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { location.hash = '#/skills'; }); await p.waitForTimeout(1600);

  console.log('\n1. the seven, in the order they were asked for');
  is('the list is exactly these', await p.evaluate(() => SKILL_CATS.join(',')), WANT.join(','));
  yes('none of the old six survives in it', await p.evaluate(() =>
    !['Languages','Technical','Creative','Physical','Craft'].some(c => SKILL_CATS.includes(c))));
  yes('each has a colour of its own', await p.evaluate(w => {
    const cols = w.map(c => catColor(c));
    return new Set(cols).size === w.length && !cols.includes('#a89f94');
  }, WANT), await p.evaluate(w => w.map(c => catColor(c)).join(','), WANT));

  console.log('\n2. the new-skill form offers them');
  await p.evaluate(() => EntryActions.newSkill());
  await p.waitForTimeout(700);
  const opts = await p.$$eval('#skCat option', n => n.map(o => o.textContent));
  yes('all seven are on the menu', WANT.every(c => opts.includes(c)), opts.join(','));
  await p.fill('#skName', 'Choral singing');
  await p.selectOption('#skCat', 'Musical');
  await p.click('#skSave');
  await p.waitForTimeout(1400);
  is('a skill can be filed under one', await p.evaluate(() =>
    S.skills.find(s => s.name === 'Choral singing')?.cat), 'Musical');
  await p.evaluate(() => closePanel());

  console.log('\n3. the tree and the filters use them');
  await p.evaluate(() => { location.hash = '#/skills'; rerender(); }); await p.waitForTimeout(1600);
  const filterOpts = await p.$$eval('#skCat option', n => n.map(o => o.value));
  yes('the inventory filter lists the ones in use',
      filterOpts.includes('Musical') && filterOpts.includes('Language'), filterOpts.join(','));
  yes('the tree draws a branch per category in use', await p.evaluate(() =>
    document.querySelectorAll('.sk-branch').length >= 3));

  console.log('\n4. the starter set is written in the new vocabulary');
  const cats = await p.evaluate(() => [...new Set(S.skills.map(s => s.cat))].sort());
  yes('every skill sits in one of the seven', cats.every(c => WANT.includes(c)), cats.join(','));
  yes('  and they are spread, not all in one', cats.length >= 4, cats.join(','));

  console.log('\n5. an install filed under the old six is brought across');
  await p.evaluate(() => {
    S.skills.forEach((s, i) => { s.cat = ['Languages','Creative','Technical','Craft','Physical','Social'][i % 6]; });
    saveNow();
  });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2600);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { location.hash = '#/skills'; }); await p.waitForTimeout(1600);
  const after = await p.evaluate(() => S.skills.map(s => s.cat));
  yes('Languages became Language', !after.includes('Languages') && after.includes('Language'), after.join(','));
  yes('Creative and Craft became Artistic', !after.includes('Creative') && !after.includes('Craft') && after.includes('Artistic'), after.join(','));
  yes('Technical became Intellectual', !after.includes('Technical') && after.includes('Intellectual'), after.join(','));
  is('Social stayed Social', after.filter(c => c === 'Social').length > 0, true);
  /* Physical has no honest home among the seven, so it is left where it is
     rather than quietly mis-filed — and must stay reachable */
  yes('Physical is left alone rather than guessed at', after.includes('Physical'), after.join(','));
  const sid = await p.evaluate(() => S.skills.find(s => s.cat === 'Physical').id);
  await p.evaluate(i => openSkillPanel(i), sid); await p.waitForTimeout(1000);
  is('  and its own dropdown still says what it is',
     await p.evaluate(() => document.querySelector('#skCatSel').value), 'Physical');
  await p.selectOption('#skCatSel', 'Social');
  await p.waitForTimeout(1100);
  is('  so it can be moved deliberately',
     await p.evaluate(i => byId(S.skills, i).cat, sid), 'Social');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke112  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
