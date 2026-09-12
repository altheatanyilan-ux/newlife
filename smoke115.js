/* smoke115 — the habit form asks which kind first, and asks different things
   depending on the answer */
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
  const p = await b.newPage({viewport:{width:1400, height:1300}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const fields = () => p.evaluate(() => [...document.querySelectorAll('#hBody [id]')].map(n => n.id));

  console.log('\n1. the first thing it asks is which kind');
  await p.evaluate(() => openHabitModal()); await p.waitForTimeout(700);
  const kinds = await p.$$eval('[data-hkind]', n => n.map(x => ({k: x.dataset.hkind,
    name: x.querySelector('.hk-name').textContent, line: x.querySelector('.hk-line').textContent})));
  is('two kinds are offered', kinds.length, 2);
  is('  building first', kinds[0].k, 'positive');
  is('  then breaking', kinds[1].k, 'negative');
  yes('each says what it means', kinds.every(x => x.line.length > 25), JSON.stringify(kinds.map(x => x.line)));
  yes('  and one of them is already chosen', await p.evaluate(() => !!document.querySelector('[data-hkind].on')));
  /* the choice must come before the fields it decides */
  yes('the chooser is above the rest of the form', await p.evaluate(() => {
    const row = document.querySelector('#hKindRow'), body = document.querySelector('#hBody');
    return !!(row.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING);
  }));

  console.log('\n2. building asks what building needs');
  const pos = await fields();
  yes('a minimum and an ideal version', pos.includes('hMin') && pos.includes('hIdeal'), pos.join(','));
  yes('  how often, and when', pos.includes('hFreq') && pos.includes('hTod'), pos.join(','));
  yes('  and what it comes after', pos.includes('hStack'), pos.join(','));

  console.log('\n3. breaking asks something else entirely');
  await p.click('[data-hkind="negative"]'); await p.waitForTimeout(500);
  const neg = await fields();
  yes('one standard, not two versions',
      neg.includes('hStandard') && !neg.includes('hMin') && !neg.includes('hIdeal'), neg.join(','));
  yes('  what sets it off', neg.includes('hTrigger'), neg.join(','));
  yes('  what to do instead', neg.includes('hInstead'), neg.join(','));
  yes('  and what it costs', neg.includes('hCost'), neg.join(','));
  yes('no frequency, because a thing you are not doing is not due on Tuesday',
      !neg.includes('hFreq') && !neg.includes('hTod'), neg.join(','));
  yes('  nothing to stack it after', !neg.includes('hStack'), neg.join(','));
  yes('  and no relational ritual', !neg.includes('hRelational'), neg.join(','));
  yes('linked skills are put away, since stopping is not a skill',
      await p.evaluate(() => document.querySelector('#hSkillField').hidden));
  yes('  and really put away, not merely marked hidden', await p.evaluate(() =>
    getComputedStyle(document.querySelector('#hSkillField')).display === 'none'));

  console.log('\n4. what has been typed survives changing your mind');
  await p.fill('#hName', 'Scrolling after ten');
  await p.fill('#hStandard', 'no phone in the bedroom after ten');
  await p.click('[data-hkind="positive"]'); await p.waitForTimeout(400);
  is('the name is still there', await p.evaluate(() => document.querySelector('#hName').value), 'Scrolling after ten');
  await p.click('[data-hkind="negative"]'); await p.waitForTimeout(400);
  is('and so is the standard, on coming back',
     await p.evaluate(() => document.querySelector('#hStandard').value), 'no phone in the bedroom after ten');

  console.log('\n5. it saves as a habit being broken');
  await p.fill('#hTrigger', 'tired, phone within reach');
  await p.fill('#hInstead', 'leave it charging in the kitchen and read');
  await p.fill('#hCost', 'an hour of sleep and a worse morning');
  await p.click('#hSave'); await p.waitForTimeout(1300);
  const saved = await p.evaluate(() => { const h = S.habits.find(x => x.name === 'Scrolling after ten');
    return h && {neg: h.negative, standard: h.standard, trigger: h.trigger, instead: h.instead, cost: h.cost,
      stack: h.stackAfter, rel: h.relational, skills: (h.links.skills || []).length}; });
  yes('it exists', !!saved);
  is('  marked as one to break', saved.neg, true);
  is('  with its standard', saved.standard, 'no phone in the bedroom after ten');
  is('  its trigger', saved.trigger, 'tired, phone within reach');
  is('  its replacement', saved.instead, 'leave it charging in the kitchen and read');
  is('  and its cost', saved.cost, 'an hour of sleep and a worse morning');
  is('  nothing stacked after it', saved.stack, null);
  is('  no relational ritual', saved.rel, '');
  is('  and no skills attached', saved.skills, 0);

  console.log('\n6. reopening it opens on the right kind');
  const hid = await p.evaluate(() => S.habits.find(x => x.name === 'Scrolling after ten').id);
  await p.evaluate(i => openHabitModal(i), hid); await p.waitForTimeout(700);
  /* read defensively: if it opens on the wrong kind the standard field will
     not exist, and a crash is a worse report than a failed assertion */
  const reopened = await p.evaluate(() => ({
    kind: document.querySelector('[data-hkind].on')?.dataset.hkind || null,
    standard: document.querySelector('#hStandard')?.value ?? null,
  }));
  is('breaking is the one chosen', reopened.kind, 'negative');
  is('  and the standard is filled in', reopened.standard, 'no phone in the bedroom after ten');
  await p.evaluate(() => closeModals());

  console.log('\n7. what was written is read back where it matters');
  await p.evaluate(() => openHabitsPanel()); await p.waitForTimeout(1200);
  const row = await p.evaluate(() => { const n = document.querySelector('.neg-row');
    return n ? n.textContent.replace(/\s+/g, ' ') : null; });
  yes('the days-since row exists', !!row);
  yes('  and shows the standard', /no phone in the bedroom/.test(row), row);
  yes('  what sets it off and what to do instead', /sets it off/.test(row) && /instead/.test(row), row);
  yes('  and the cost, to read while deciding', /an hour of sleep/.test(row), row);
  yes('  with a way to record a slip', await p.evaluate(() => !!document.querySelector('[data-relapse]')));

  console.log('\n8. a habit being built is untouched by any of this');
  await p.evaluate(() => closePanel());
  await p.evaluate(() => openHabitModal()); await p.waitForTimeout(700);
  await p.fill('#hName', 'Walk before the desk');
  await p.fill('#hMin', 'to the end of the road');
  await p.fill('#hIdeal', 'thirty minutes');
  await p.click('#hSave'); await p.waitForTimeout(1300);
  const good = await p.evaluate(() => { const h = S.habits.find(x => x.name === 'Walk before the desk');
    return h && {neg: h.negative, min: h.min, ideal: h.ideal, freq: h.freq.type}; });
  is('it saves as one to build', good.neg, false);
  is('  keeping its minimum', good.min, 'to the end of the road');
  is('  and its ideal', good.ideal, 'thirty minutes');
  is('  and a real frequency', good.freq, 'daily');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke115  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
