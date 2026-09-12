/* smoke121 — the Compass loses its card row; a milestone says how far away it is */
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

  console.log('\n1. the Compass no longer opens with four cards');
  await p.evaluate(() => { location.hash = '#/compass'; }); await p.waitForTimeout(2000);
  yes('the row is gone', !(await p.$('.zone-cards')));
  is('  and no card survives it', await p.evaluate(() => document.querySelectorAll('.zone-card').length), 0);
  yes('  the words are gone with it', await p.evaluate(() => {
    const t = document.querySelector('#main').textContent;
    return !/what is happening now|long-term growth, identity|relationships, memory, meaning/.test(t); }));
  yes('the functions that built it are gone too', await p.evaluate(() =>
    typeof zoneCardsHTML === 'undefined' && typeof zoneSummaries === 'undefined'));
  yes('and the page still draws everything else',
      await p.evaluate(() => !!document.querySelector('.week-shape') && !!document.querySelector('.house-wrap')));

  console.log('\n2. how far away a date is, said as a person would');
  const said = await p.evaluate(() => [0,1,-1,3,6,7,8,13,14,21,34,-9]
    .map(d => [d, planWhenAway(addDays(today(), d))]));
  const m = Object.fromEntries(said);
  is('today is today', m[0], 'today');
  is('tomorrow is tomorrow, not "in 1 day"', m[1], 'tomorrow');
  is('  and yesterday likewise', m[-1], 'yesterday');
  is('under a week stays in days', m[3], 'in 3 days');
  is('  right up to six', m[6], 'in 6 days');
  is('at seven it becomes a week', m[7], 'in 1 week');
  is('  eight is a week and a day', m[8], 'in 1 week 1 day');
  is('  thirteen is a week and six', m[13], 'in 1 week 6 days');
  is('  fourteen is two weeks, with no stray days', m[14], 'in 2 weeks');
  is('  and thirty-four is four weeks and six', m[34], 'in 4 weeks 6 days');
  is('the past counts the same way, backwards', m[-9], '1 week 2 days ago');

  console.log('\n3. the strip says it under each name');
  const listId = await p.evaluate(() => {
    const l = planLists().find(x => x.id !== 'inbox');
    l.milestones = [
      {id: uid(), name:'First draft', date: addDays(today(), -6), done: true, note:''},
      {id: uid(), name:'Deposit due', date: addDays(today(), -2), done: false, note:''},
      {id: uid(), name:'Hearing', date: addDays(today(), 9), done: false, note:'court 3'},
      {id: uid(), name:'Filing deadline', date: addDays(today(), 34), done: false, note:''}];
    S._planSel = {kind:'list', id: l.id}; saveNow(); location.hash = '#/planning'; return l.id;
  });
  await p.waitForTimeout(1800);
  const pins = await p.$$eval('.pl-mspin', n => n.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  yes('one ahead says the weeks and days', pins.some(t => /Hearing in 1 week 2 days/.test(t)), pins.join(' | '));
  yes('  the far one too', pins.some(t => /Filing deadline in 4 weeks 6 days/.test(t)), pins.join(' | '));
  yes('one past says how long ago', pins.some(t => /Deposit due 2 days ago/.test(t)), pins.join(' | '));
  /* a met milestone is not "away" from anything, so it keeps its date */
  yes('a met one shows its date instead', pins.some(t => /First draft/.test(t) && !/ago|in \d/.test(t)), pins.join(' | '));
  yes('and the full date is still on the hover', await p.evaluate(() =>
    /\d/.test(document.querySelector('.pl-mspin[title]')?.title || '') &&
    /·/.test(document.querySelector('.pl-mspin[title]')?.title || '')));

  console.log('\n3b. and so does the timeline lane');
  await p.evaluate(() => { planSetView('timeline'); }); await p.waitForTimeout(1500);
  const bars = await p.$$eval('.pl-gms', n => n.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  yes('the markers carry it as well', bars.some(t => /in 1 week 2 days/.test(t)), bars.join(' | '));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke121  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
