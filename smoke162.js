/* smoke162 — the rooms that no longer announce themselves. Seven pages opened
   with a pane of tinted glass carrying the room's own name — a name the
   sidebar was already showing, over a band of backdrop blur the page paid for
   on every scroll, under a scatter of flowers and a Han character. The name is
   gone. What the banner actually carried — which view you are looking at, how
   the list is sorted, the button that makes a new thing — is not: it sits in a
   plain bar directly over the work it governs, where it is nearer the thing it
   changes than it was before. This file exists so that nobody quietly puts the
   glass back, and so that nobody loses a control while doing it. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* the seven, and the rooms that still open with a banner */
const BARE = [['Planning','#/planning'], ['Content Studio','#/writing'], ['Projects','#/projects'],
              ['Finance','#/finance'], ['Skill Tree','#/skills'], ['Values','#/values'], ['People','#/people']];
/* #/compass leads to Today's Review view now, which has no banner */
const KEPT = ['#/journals', '#/commonplace', '#/timeline', '#/settings'];

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1340, height:1000}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1600); }
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(1100); };

  console.log('\n1. seven rooms open with their work, not with their name');
  for(const [name, route] of BARE){
    await go(route);
    const m = await p.evaluate(n => ({
      heads: document.querySelectorAll('#main .page-head').length,
      plant: document.querySelectorAll('#main .ph-plant, #main .ph-bloom, #main .ph-rule').length,
      /* the room's name must not be sitting in an h1 somewhere else either */
      h1: [...document.querySelectorAll('#main h1')].map(e => e.textContent.trim()).filter(t => t === n).length,
    }), name);
    is(`${name} has no banner`, m.heads, 0);
    is(`  and nothing that grew on one`, m.plant, 0);
    is(`  and does not repeat its own name`, m.h1, 0);
  }

  console.log('\n2. the rooms that kept theirs still have it');
  for(const route of KEPT){
    await go(route);
    yes(`${route} still opens with a banner`,
      await p.evaluate(() => !!document.querySelector('#main .page-head')));
  }

  console.log('\n3. nothing the banner carried was lost with it');
  await go('#/projects');
  const pr = await p.evaluate(() => {
    const bar = document.querySelector('#main .page-bar'); if(!bar) return null;
    const body = document.querySelector('#pcards, .kanban, .gantt');
    return {views: [...bar.querySelectorAll('.view-toggle button')].map(x => x.dataset.pview),
      on: bar.querySelector('.view-toggle button.on')?.dataset.pview,
      sort: !!bar.querySelector('#psort'), nod: !!bar.querySelector('#addNod'),
      /* over the work, not under it */
      aboveBody: !!body && bar.getBoundingClientRect().bottom <= body.getBoundingClientRect().top + 1};
  });
  yes('Projects has a bar where the banner was', pr !== null);
  is('  carrying all three views', pr && pr.views, ['cards','kanban','timeline']);
  is('  with the current one marked', pr && pr.on, 'cards');
  yes('  the sort is still there', pr && pr.sort);
  yes('  and so is the button that makes a nod', pr && pr.nod);
  yes('  and the bar sits above the work it governs', pr && pr.aboveBody);
  /* and it still works */
  await p.click('#main .page-bar [data-pview="kanban"]'); await p.waitForTimeout(800);
  is('  switching view from the bar still switches the view',
    await p.evaluate(() => S.settings.projectView), 'kanban');
  await p.click('#main .page-bar [data-pview="cards"]'); await p.waitForTimeout(800);

  await go('#/people');
  const pl = await p.evaluate(() => {
    const bar = document.querySelector('#main .page-bar'); if(!bar) return null;
    const body = document.querySelector('#pplBody');
    return {views: [...bar.querySelectorAll('.view-toggle button')].map(x => x.dataset.pplview),
      on: bar.querySelector('.view-toggle button.on')?.dataset.pplview,
      acts: ['rtReachout','rtGratitude','rtRing'].filter(id => !!bar.querySelector('#' + id)),
      aboveBody: !!body && bar.getBoundingClientRect().bottom <= body.getBoundingClientRect().top + 1};
  });
  yes('People has one too', pl !== null);
  is('  carrying all five views', pl && pl.views, ['circles','list','log','eras','audit']);
  is('  with the current one marked', pl && pl.on, 'circles');
  is('  and the three quick actions beside them', pl && pl.acts, ['rtReachout','rtGratitude','rtRing']);
  yes('  above the body it switches', pl && pl.aboveBody);
  await p.click('#main .page-bar [data-pplview="list"]'); await p.waitForTimeout(800);
  is('  and switching still switches', await p.evaluate(() => S._pplView), 'list');

  console.log('\n4. the bar wraps rather than overflowing a narrow window');
  await p.setViewportSize({width: 560, height: 900}); await p.waitForTimeout(700);
  for(const route of ['#/projects', '#/people']){
    await go(route);
    const fit = await p.evaluate(() => {
      const bar = document.querySelector('#main .page-bar'), pg = bar.closest('.page');
      return bar.getBoundingClientRect().right <= pg.getBoundingClientRect().right + 1
        && document.documentElement.scrollWidth <= innerWidth + 1;
    });
    yes(`${route} stays inside the window at 560px`, fit);
  }
  await p.setViewportSize({width: 1340, height: 1000}); await p.waitForTimeout(600);

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(bad ? `\nsmoke162  ${bad} FAILED` : '\nsmoke162  all good');
  process.exit(bad ? 1 : 0);
})();
