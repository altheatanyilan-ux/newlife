/* smoke119 — the Library is the third view of Journals, not a room of its own */
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

  console.log('\n1. it is no longer a door in the sidebar');
  yes('no Library link', !(await p.$('a[data-page="commonplace"]')));
  yes('  and it is not swept into a zone either', await p.evaluate(() =>
    !navConfig().create.includes('commonplace') && !navConfig().standalone.includes('commonplace')));

  console.log('\n2. it is the third view of Journals, after the other two');
  await p.evaluate(() => { location.hash = '#/journals'; }); await p.waitForTimeout(1700);
  const views = await p.$$eval('[data-jrview]', n => n.map(x => x.dataset.jrview));
  is('the three views, in order', views.join(','), 'entries,timeline,library');
  await p.click('[data-jrview="library"]'); await p.waitForTimeout(1800);
  is('clicking it goes there', await p.evaluate(() => location.hash), '#/journals/library');
  yes('  the Library really renders', !!(await p.$('.media-kind-row')));
  yes('  under the Journals heading', !!(await p.$('.jr-head')));
  is('  with Library marked as the view you are in',
     await p.evaluate(() => document.querySelector('[data-jrview].on')?.dataset.jrview), 'library');

  console.log('\n2b. and its own tabs work from there');
  const tabs = await p.$$eval('.tabs button', n => n.map(x => x.textContent.trim()));
  is('three of them', tabs.join(','), 'The Shelf,Chronology,Queue & Lists');
  yes('  none of them called Timeline, which is the view above', !tabs.includes('Timeline'), tabs.join(','));
  await p.click('.tabs button:nth-child(2)'); await p.waitForTimeout(1600);
  is('a tab addresses the Library where it now lives',
     await p.evaluate(() => location.hash), '#/journals/library/timeline');
  yes('  and still shows the Journals views row', !!(await p.$('[data-jrview="library"]')));
  await p.click('[data-jrview="entries"]'); await p.waitForTimeout(1600);
  yes('you can get back to the entries', !!(await p.$('.jnav')));

  console.log('\n3. every old address still lands, carrying its id');
  const mid = await p.evaluate(() => mediaEntries()[0].id);
  await p.evaluate(i => { location.hash = '#/commonplace/' + i; }, mid); await p.waitForTimeout(1900);
  is('an address with a work redirects', await p.evaluate(() => location.hash), '#/journals/library/' + mid);
  yes('  and opens that work', !!(await p.$('#panel')));
  await p.evaluate(() => closePanel()); await p.waitForTimeout(500);
  await p.evaluate(() => { location.hash = '#/commonplace'; }); await p.waitForTimeout(1700);
  is('the bare address redirects too', await p.evaluate(() => location.hash), '#/journals/library');
  yes('  showing the shelf', !!(await p.$('.media-kind-row')));

  console.log('\n3b. the links inside the app point at it');
  yes('a quote chip still reaches the work it names', await p.evaluate(async () => {
    const w = mediaEntries()[0];
    const q = {id: uid(), type:'quote', title:'A line', body:'x', occurredAt: today(),
      createdAt: new Date().toISOString(), media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]},
      people:[], places:[], emotions:[], tags:[], confidence:'', extra:{why:'x', fromMedia: w.id}};
    S.entries.push(q); saveNow();
    return typeof quoteWork === 'function' && quoteWork(q)?.id === w.id;
  }));

  console.log('\n4. adding a work still works from in there');
  await p.evaluate(() => { location.hash = '#/journals/library'; }); await p.waitForTimeout(1700);
  const before = await p.evaluate(() => mediaEntries().length);
  await p.evaluate(() => openMediaModal({}));
  await p.waitForTimeout(700);
  await p.fill('#mTitle', 'A work logged from the Journals');
  await p.click('#mSave'); await p.waitForTimeout(1400);
  is('the shelf grew', await p.evaluate(() => mediaEntries().length), before + 1);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke119  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
