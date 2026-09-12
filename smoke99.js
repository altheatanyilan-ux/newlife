/* smoke99 — light by default, and the one question asked before anything else */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);
const fs = require('fs');

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

  console.log('\n1. the document itself opens light, before any script runs');
  const src = fs.readFileSync('/home/user/newlife/index.html', 'utf8');
  yes('the html element is stamped light in the markup', /<html[^>]*data-theme="light"/.test(src),
      (src.match(/<html[^>]*>/) || [''])[0]);
  yes('and the seed the house is built from says light',
      /settings:\{theme:'light'/.test(src));

  console.log('\n2. a fresh house asks before it does anything else');
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE);
  await p.waitForSelector('#frGo', {timeout: 15000}).catch(() => {});
  yes('the question is on screen', !!(await p.$('#frGo')));
  is('  it opens light', await p.evaluate(() => document.documentElement.dataset.theme), 'light');
  is('  with light already chosen', await p.evaluate(() => document.querySelector('.fr-theme.on').dataset.frtheme), 'light');
  yes('  it asks about sound in the room', !!(await p.$('[data-fr="ambient"]')));
  yes('  and about sound on the buttons', !!(await p.$('[data-fr="clicks"]')));
  yes('  both start off, which is what they were before', await p.evaluate(() =>
    !document.querySelector('[data-fr="ambient"]').classList.contains('on') &&
    !document.querySelector('[data-fr="clicks"]').classList.contains('on')));
  /* the starter set and the rest of boot must wait behind it */
  await p.waitForTimeout(2500);
  is('nothing else has spoken over it yet',
     await p.evaluate(() => document.querySelectorAll('.toast').length), 0);

  console.log('\n3. every control takes effect as it is touched');
  await p.click('[data-frtheme="dark"]');
  await p.waitForTimeout(400);
  is('choosing dark darkens the room under the dialog',
     await p.evaluate(() => document.documentElement.dataset.theme), 'dark');
  is('and it is written down', await p.evaluate(() => S.settings.theme), 'dark');
  await p.click('[data-frtheme="light"]');
  await p.waitForTimeout(400);
  is('and back again', await p.evaluate(() => document.documentElement.dataset.theme), 'light');

  await p.click('[data-fr="clicks"]');
  await p.waitForTimeout(400);
  is('turning on the button sounds really turns them on',
     await p.evaluate(() => SoundManager.state().soundEnabled), true);
  yes('  and the switch shows it', await p.evaluate(() => document.querySelector('[data-fr="clicks"]').classList.contains('on')));
  await p.click('[data-fr="ambient"]');
  await p.waitForTimeout(400);
  is('so does the room sound', await p.evaluate(() => SoundManager.state().ambientEnabled), true);
  await p.click('[data-fr="ambient"]');
  await p.waitForTimeout(400);
  is('and it can be turned straight back off', await p.evaluate(() => SoundManager.state().ambientEnabled), false);

  console.log('\n4. Begin closes it, and the rest of boot follows');
  await p.click('#frGo');
  await p.waitForTimeout(2600);
  yes('the dialog is gone', !(await p.$('#frGo')));
  yes('and the house speaks now that it can be heard',
      await p.evaluate(() => document.querySelectorAll('.toast').length > 0));
  yes('the starter set arrived', await p.evaluate(() => !!S.settings.starterApplied));

  console.log('\n5. it asks once');
  await p.reload();
  await p.waitForTimeout(3000);
  yes('a second visit is not asked again', !(await p.$('#frGo')));
  is('the answer is remembered', await p.evaluate(() => S.settings.prefsAsked), true);
  is('and so is the theme chosen', await p.evaluate(() => S.settings.theme), 'light');

  console.log('\n6. choosing dark, then reloading, keeps dark');
  /* saveNow returns a promise; reloading before it lands reads back the theme
     from before the change, which made this pass most of the time */
  await p.evaluate(async () => { S.settings.theme = 'dark'; await saveNow(); applyTheme(); });
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(3000);
  is('a chosen theme survives a reload', await p.evaluate(() => document.documentElement.dataset.theme), 'dark');
  yes('and the question stays away', !(await p.$('#frGo')));

  console.log('\n7. clearing all data returns to light, and asks again');
  await p.evaluate(async () => { await resetAll(); applyTheme(); });
  await p.waitForTimeout(600);
  is('the theme is light again', await p.evaluate(() => S.settings.theme), 'light');
  is('and the room with it', await p.evaluate(() => document.documentElement.dataset.theme), 'light');
  is('the question is unanswered again', await p.evaluate(() => !!S.settings.prefsAsked), false);
  await p.reload(); await p.waitForTimeout(2500);
  yes('so the next open asks it', !!(await p.$('#frGo')));

  console.log('\n8. escaping the dialog counts as having been asked');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(2600);
  yes('it closes', !(await p.$('#frGo')));
  is('it is marked answered rather than pending forever',
     await p.evaluate(() => S.settings.prefsAsked), true);
  yes('and boot carried on behind it',
      await p.evaluate(() => document.querySelectorAll('.toast').length > 0 || !!S.settings.starterApplied));
  await p.reload(); await p.waitForTimeout(2500);
  yes('a later visit is not asked again', !(await p.$('#frGo')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke99  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
