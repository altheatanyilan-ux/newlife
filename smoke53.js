const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);

  await page.evaluate(() => { S.settings.starterApplied='skip'; S.settings.starterDeclined=true; saveNow(); });

  // Chronicle fully gone
  const chron = await page.evaluate(() => ({
    route: typeof routes.chronicle,
    navEntry: typeof NAV !== 'undefined' ? !!NAV.chronicle : 'NAV?',
    inStoryZone: typeof ZONES !== 'undefined' ? JSON.stringify(ZONES.story || null) : 'n/a',
    migrateFn: typeof migrateChronicle,
    turningPts: typeof turningPointEntries,
  }));
  console.log('Chronicle removed:', JSON.stringify(chron));

  // calendar import + add-event gone
  const cal = await page.evaluate(() => ({
    icsImport: typeof openICSImport,
    importICSText: typeof importICSText,
    eventModalStillEditsExisting: typeof openEventModal, // kept for editing legacy blocks
  }));
  console.log('Calendar fns:', JSON.stringify(cal));

  // heat-mode buttons gone from Life Tape
  await page.evaluate(() => { location.hash = '#/rhythm'; });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[data-rytab]')];
    const lt = tabs.find(b => /life tape|tape/i.test(b.textContent)); if(lt) lt.click();
  });
  await page.waitForTimeout(500);
  const modes = await page.evaluate(() => ({
    modeButtons: document.querySelectorAll('[data-tapemode]').length,
    tapeModesConst: typeof TAPE_MODES,
    modeBarFn: typeof tapeModeBarHTML,
    headerStripStillThere: !!document.querySelector('.lt-header-strip'),
  }));
  console.log('Heat modes:', JSON.stringify(modes));

  // every remaining route renders without throwing
  const routeNames = await page.evaluate(() => Object.keys(routes));
  const bad = [];
  for(const r of routeNames){
    const before = errors.length;
    await page.evaluate(n => { location.hash = '#/' + n; }, r);
    await page.waitForTimeout(230);
    const ok = await page.evaluate(() => !!document.querySelector('#main')?.children.length);
    if(!ok) bad.push(r + '(empty)');
  }
  console.log('Routes checked:', routeNames.length, '| empty:', bad.length ? bad.join(',') : 'none');

  // year view of the tape still renders after removing the energy branch
  await page.evaluate(() => { location.hash='#/rhythm'; });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[data-rytab]')];
    const lt = tabs.find(b => /life tape|tape/i.test(b.textContent)); if(lt) lt.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-ltview="year"]')?.click());
  await page.waitForTimeout(500);
  const yr = await page.evaluate(() => ({
    hasGrid: !!document.querySelector('.tape-grid, .tm-cell'),
    cells: document.querySelectorAll('.tm-cell').length,
  }));
  console.log('Year view:', JSON.stringify(yr));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
