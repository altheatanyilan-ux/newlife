const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(400);

  // seed 20 days of checkins with setpoint and energy
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    for(let i = 0; i < 20; i++){
      const d = addDays(T, -i);
      S.checkins = S.checkins || {};
      S.checkins[d] = {
        setpoint: Math.round(10 + Math.random() * 8),
        energy: {physical: Math.round(2 + Math.random()*3), emotional: Math.round(1 + Math.random()*4), mental: Math.round(2 + Math.random()*3), spiritual: Math.round(1 + Math.random()*4)},
      };
    }
    saveNow(); location.hash='#/today'; // navigate to today first then to lifetape
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => { location.hash='#/rhythm'; });
  await page.waitForTimeout(600);

  // navigate to Life Tape tab
  await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('.lib-tabs button, [data-rytab]')];
    const lt = tabs.find(b => /life tape|tape/i.test(b.textContent));
    if(lt) lt.click();
  });
  await page.waitForTimeout(500);

  const stripInfo = await page.evaluate(() => ({
    hasStrip: !!document.querySelector('.lt-header-strip'),
    hasSetpointCell: !!document.querySelector('.lt-hs-cell-main'),
    dimCells: document.querySelectorAll('.lt-hs-cell:not(.lt-hs-cell-main)').length,
    svgs: document.querySelectorAll('.lt-hs-svg').length,
    setpointText: document.querySelector('.lt-hs-cell-main .lt-hs-val')?.textContent,
    setpointSub: document.querySelector('.lt-hs-cell-main .lt-hs-sub')?.textContent,
    stripIsSticky: getComputedStyle(document.querySelector('.lt-header-strip')||document.body).position,
  }));
  console.log('Strip info:', JSON.stringify(stripInfo));

  // verify strip stays when switching tab views
  await page.evaluate(() => { document.querySelector('[data-ltview="month"]')?.click(); });
  await page.waitForTimeout(300);
  const stripAfterSwitch = await page.evaluate(() => ({
    stillPresent: !!document.querySelector('.lt-header-strip'),
    currentView: document.querySelector('[data-ltview].active')?.dataset?.ltview,
  }));
  console.log('Strip after switching to month view:', JSON.stringify(stripAfterSwitch));

  // verify strip present with no checkin data (empty state)
  await page.evaluate(() => { S.checkins = {}; location.hash='#/rhythm'; });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[data-rytab]')];
    const lt = tabs.find(b => /life tape|tape/i.test(b.textContent));
    if(lt) lt.click();
  });
  await page.waitForTimeout(400);
  const emptyStrip = await page.evaluate(() => ({
    hasStrip: !!document.querySelector('.lt-header-strip'),
    emptyMsg: document.querySelector('.lt-hs-cell-main .lt-hs-sub')?.textContent,
  }));
  console.log('Empty state strip:', JSON.stringify(emptyStrip));

  console.log('ERRORS:', errors.length); errors.forEach(e=>console.log(e));
  await browser.close();
})();
