/* Four rooms became two, and the sidebar was rearranged around what you are
   making and who you are. This checks the merges kept everything they were
   supposed to keep, and that every address that used to work still does. */
const { chromium } = require('playwright');
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1500,height:1050});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  /* A fresh profile is asked about theme and sound before anything else, and
     the rest of boot waits behind that dialog. Take the defaults and get on
     with it, the way a first-time user would. */
  await page.waitForTimeout(900);
  if(await page.$('#frGo')){ await page.click('#frGo'); await page.waitForTimeout(1800); }

  await page.waitForTimeout(3200);
  const clean = () => page.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove()));
  const go = async h => { await page.evaluate(x => { location.hash = x; rerender(); }, h);
    await page.waitForTimeout(1000); await clean(); };

  console.log('\n1. the sidebar, as asked for');
  const nav = await page.evaluate(() => ({
    top: [...document.querySelectorAll('.nav-top a')].map(a => a.dataset.page),
    zones: [...document.querySelectorAll('.zone')].map(z => ({name: z.querySelector('.zone-lbl')?.textContent,
      pages: [...z.querySelectorAll('.zone-pages a')].map(a => a.dataset.page)})),
    loose: [...document.querySelectorAll('.nav > a')].map(a => a.dataset.page),
    settings: !!document.querySelector('#sidebar a[href="#/settings"]'),
  }));
  ok('Today, Planning, Compass at the top, in that order',
     JSON.stringify(nav.top) === JSON.stringify(['today','planning','compass']), JSON.stringify(nav.top));
  ok('the top three carry no heading',
     await page.evaluate(() => !document.querySelector('.nav-top .zone-h')), 'a heading appeared');
  /* the Library moved in with Journals as its third view, so it is no longer
     a door of its own in this zone */
  ok('Create holds Content, Projects, Finance and the Skill Tree',
     nav.zones[0]?.name === 'Create' && JSON.stringify(nav.zones[0].pages) === JSON.stringify(['content','projects','finance','skills']),
     JSON.stringify(nav.zones[0]));
  ok('Identity holds Values, Journals, People',
     nav.zones[1]?.name === 'Identity' && JSON.stringify(nav.zones[1].pages) === JSON.stringify(['values','journals','people']),
     JSON.stringify(nav.zones[1]));
  ok('both zones fold', await page.evaluate(() => document.querySelectorAll('.zone [data-zoneh]').length === 2), 'no');
  ok('nothing is left loose at the bottom', nav.loose.length === 0, JSON.stringify(nav.loose));
  ok('Timeline and the Writing Studio are no longer rooms',
     !nav.zones.some(z => z.pages.includes('timeline') || z.pages.includes('writing')) && !nav.top.includes('timeline'),
     JSON.stringify(nav.zones));

  console.log('\n2. Settings moved to the top right');
  ok('it has left the sidebar', !nav.settings, 'still listed');
  ok('and is a button up there instead', await page.evaluate(() => !!document.querySelector('#btnSettings')), 'no button');
  await page.click('#btnSettings'); await page.waitForTimeout(900);
  ok('which opens it', (await page.evaluate(() => location.hash)) === '#/settings', await page.evaluate(() => location.hash));
  /* on a phone the sidebar is a bar of five, so Settings has to be findable
     in the overlay behind More — otherwise moving it off the sidebar strands it */
  await page.setViewportSize({width:390, height:844}); await go('#/today');
  await page.evaluate(() => document.querySelector('#mobileMore')?.click()); await page.waitForTimeout(600);
  ok('and is still findable behind More on a phone',
     await page.evaluate(() => !!document.querySelector('#navOverlay a[href="#/settings"]')), 'not in the overlay');
  await page.evaluate(() => document.querySelector('#navOverlay')?.remove());
  await page.setViewportSize({width:1500, height:1050}); await page.waitForTimeout(400);

  console.log('\n3. Journals holds the Timeline and the Library now');
  await go('#/journals');
  ok('it opens on the entries, as before',
     await page.evaluate(() => !!document.querySelector('.jnav') && document.querySelector('[data-jrview].on')?.dataset.jrview === 'entries'), 'no');
  ok('with a switch to the Timeline and to the Library',
     await page.evaluate(() => [...document.querySelectorAll('[data-jrview]')].map(b => b.dataset.jrview).join(',')
       === 'entries,timeline,library'),
     await page.evaluate(() => [...document.querySelectorAll('[data-jrview]')].map(b => b.dataset.jrview).join(',')));
  await page.evaluate(() => document.querySelector('[data-jrview="timeline"]').click()); await page.waitForTimeout(1000);
  const tl = await page.evaluate(() => ({hash: location.hash, h1: document.querySelector('h1')?.textContent,
    spine: !!document.querySelector('#spine'), tabs: [...document.querySelectorAll('.tabs button')].map(b => b.textContent.trim()),
    banners: document.querySelectorAll('.page-head').length}));
  ok('the stage spine is there', tl.spine && tl.hash === '#/journals/timeline', JSON.stringify(tl));
  ok('so is Threads & Tensions', tl.tabs.join('|') === 'Stages|Threads & Tensions', JSON.stringify(tl.tabs));
  ok('the page is still called Journals', tl.h1 === 'Journals', tl.h1);
  ok('and it has one banner, not two', tl.banners === 1, tl.banners + ' page-heads');
  await go('#/journals/timeline/threads');
  ok('the threads tab draws its threads',
     await page.evaluate(() => !!document.querySelector('#addThread') && !document.querySelector('.spine-wrap')), 'no');

  console.log('\n4. Content holds the writing');
  await go('#/writing');
  ok('the old desk address lands on the Shelf',
     await page.evaluate(() => location.hash === '#/content' && contentView() === 'library'),
     await page.evaluate(() => location.hash + ' / ' + contentView()));
  ok('the Shelf lists the pieces the desk used to',
     await page.evaluate(() => document.querySelectorAll('.ct-shelf [data-ctcard]').length >= 8),
     await page.evaluate(() => document.querySelectorAll('.ct-shelf [data-ctcard]').length + ' cards'));
  ok('Content offers the compost heap',
     await page.evaluate(() => !!document.querySelector('a[href="#/writing/compost"]')), 'no link');
  const pid = await page.evaluate(() => contentPieces().find(e => e.title.startsWith('Structural')).id);
  await go('#/writing/' + pid);
  const desk = await page.evaluate(() => ({editor: !!document.querySelector('#wBody'), binder: !!document.querySelector('#wsBinder'),
    inspector: !!document.querySelector('#wsInspector'), drawer: !!document.querySelector('#drawer'),
    bar: !!document.querySelector('.ws-piecebar'), back: document.querySelector('a[href="#/content/shelf"]')?.textContent.trim(),
    add: [...document.querySelectorAll('#ctxAdd button')].map(b => b.textContent.trim())}));
  ok('the drafting interface is untouched — binder, editor, inspector, drawer',
     desk.editor && desk.binder && desk.inspector && desk.drawer, JSON.stringify(desk));
  ok('it says which piece it is writing, and how to get back',
     desk.bar && desk.back === '‹ Content', JSON.stringify({bar:desk.bar, back:desk.back}));
  ok('and it asks for its own kind of new thing',
     desk.add.join('|').includes('New document'), JSON.stringify(desk.add));
  await go('#/writing/compost');
  ok('the compost heap survives, and comes home to Content',
     await page.evaluate(() => !!document.querySelector('.compost-grid') &&
       !!document.querySelector('a[href="#/content/shelf"]')), 'no');

  console.log('\n5. nothing the desk held was simply dropped');
  await go('#/content');
  await page.evaluate(() => contentSetView('stats')); await page.waitForTimeout(900);
  ok('cross-pollination moved to the Numbers view',
     await page.evaluate(() => /keeps reaching for/.test(document.body.textContent)), 'missing');
  ok('the writing streak and heat are there too',
     await page.evaluate(() => /day streak/.test(document.body.textContent) && !!document.querySelector('.ct-heat')), 'missing');

  console.log('\n6. every old address still answers');
  for(const [from, want] of [['#/timeline','#/journals/timeline'], ['#/timeline/threads','#/journals/timeline/threads'],
                             ['#/writing','#/content']]){
    await go(from);
    const landed = await page.evaluate(() => location.hash);
    ok(`${from} → ${want}`, landed === want, landed);
  }
  const sid = await page.evaluate(() => S.stages[0]?.id);
  if(sid){ await go('#/stage/' + sid);
    ok('a stage still opens', await page.evaluate(() => !!document.querySelector('.stage-hero')), 'no hero'); }

  console.log('\nconsole:', errors.length ? errors.slice(0, 6) : 'clean');
  if(errors.length) fails += errors.length;
  console.log(fails ? `\n${fails} FAILED` : '\nall good');
  await browser.close(); process.exit(fails ? 1 : 0);
})();
