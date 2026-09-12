/* smoke113 — a value gets a tagline, and its page gets the width of a page */
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

  /* measure another room first, so "full width" is compared against the house
     rather than against a number typed into the test */
  await p.evaluate(() => { location.hash = '#/skills'; }); await p.waitForTimeout(1600);
  const roomW = await p.evaluate(() => Math.round(document.querySelector('#main .page').getBoundingClientRect().width));

  const vid = await p.evaluate(() => S.values[0].id);
  await p.evaluate(i => { location.hash = '#/value/' + i; }, vid); await p.waitForTimeout(1700);

  console.log('\n1. the page is as wide as every other room');
  const pageW = await p.evaluate(() => Math.round(document.querySelector('.value-page').getBoundingClientRect().width));
  is('the same width as the Skill Tree', pageW, roomW);
  yes('  which is much more than the old reading column', pageW > 900, `${pageW}px`);
  yes('  and it is not the narrow variant any more',
      await p.evaluate(() => !document.querySelector('.value-page').classList.contains('narrow')));

  console.log('\n1b. so the four questions get two columns');
  const cols = await p.evaluate(() => {
    const f = [...document.querySelectorAll('.vfacet')];
    if(f.length < 2) return 0;
    return new Set(f.map(x => Math.round(x.getBoundingClientRect().x))).size;
  });
  is('two of them side by side', cols, 2);

  console.log('\n2. a tagline, under the name');
  yes('the field is there', !!(await p.$('.vhead-tag .ed')));
  yes('  inside the banner, with the name', await p.evaluate(() =>
    !!document.querySelector('.page-head .vhead-tag')));
  yes('  and below the name rather than above it', await p.evaluate(() => {
    const h1 = document.querySelector('.vhead h1'), t = document.querySelector('.vhead-tag');
    return !!(h1.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING);
  }));
  yes('  it says what it wants when empty', await p.evaluate(() =>
    /one line/.test(document.querySelector('.vhead-tag').textContent)));
  /* a value is not always one word — "telling the truth when it costs me
     something" is a value too, and the prompt should not say otherwise */
  const askedAs = await p.evaluate(() => document.querySelector('.vhead-tag').textContent.trim());
  yes('  and asks about the value, not about a word',
      /what this value means to you/.test(askedAs) && !/this word/.test(askedAs), askedAs);

  console.log('\n3. it can be written, and it stays written');
  await p.click('.vhead-tag .ed'); await p.waitForTimeout(400);
  await p.keyboard.type('telling the truth when it costs me something');
  await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
  is('saved on the value itself',
     await p.evaluate(i => byId(S.values, i).tagline, vid), 'telling the truth when it costs me something');
  yes('  and shown', await p.evaluate(() =>
    /telling the truth/.test(document.querySelector('.vhead-tag').textContent)));
  await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(2600);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(i => { location.hash = '#/value/' + i; }, vid); await p.waitForTimeout(1700);
  yes('and it survives a reload', await p.evaluate(() =>
    /telling the truth/.test(document.querySelector('.vhead-tag').textContent)));

  console.log('\n4. it is not one of the four questions');
  is('there are still four of those', await p.evaluate(() => document.querySelectorAll('.vfacet').length), 4);
  yes('  and the tagline is not among them', await p.evaluate(() =>
    !document.querySelector('.vfacet [data-path$=".tagline"]')));

  console.log('\n5. a value made today has the field from the start');
  await p.evaluate(() => { location.hash = '#/values'; }); await p.waitForTimeout(1500);
  await p.evaluate(() => EntryActions.newValue ? EntryActions.newValue() : newValueDialog());
  await p.waitForTimeout(700);
  const nameBox = await p.$('#nvName');
  if(!nameBox) no('the new-value form opens', 'no #nvName');
  else {
    await p.fill('#nvName', 'Courage');
    await p.click('#nvSave'); await p.waitForTimeout(1600);
    is('it is born with a tagline to fill in',
       await p.evaluate(() => typeof S.values.find(v => v.name === 'Courage').tagline), 'string');
    yes('  and its page offers the field', !!(await p.$('.vhead-tag .ed')));
  }

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke113  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
