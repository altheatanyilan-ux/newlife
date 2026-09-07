const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(400);

  // seed minimal state and navigate to today
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    saveNow(); location.hash='#/today';
  });
  await page.waitForTimeout(600);

  // 1. wake time should be auto-recorded
  const wakeAt = await page.evaluate(() => {
    const T = today();
    return S.checkins[T]?.wakeAt || null;
  });
  console.log('Wake time recorded:', !!wakeAt, wakeAt ? new Date(wakeAt).toLocaleTimeString() : '');

  // 2. morning flow section should exist with 3 checkboxes
  const flowInfo = await page.evaluate(() => ({
    hasSection: !!document.querySelector('.morning-flow'),
    checkboxes: document.querySelectorAll('.mf-check').length,
    wakeLabel: document.querySelector('.morning-flow .sc.lg')?.nextElementSibling?.textContent?.trim() || '',
    allUnchecked: [...document.querySelectorAll('.mf-check')].every(cb => !cb.checked),
  }));
  console.log('Morning flow:', JSON.stringify(flowInfo));

  // 3. tasks should appear before the check-in details
  const order = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.today-page > *')];
    const taskIdx = all.findIndex(el => el.textContent.includes("Today's tasks"));
    const checkinIdx = all.findIndex(el => el.classList.contains('today-checkin'));
    return { taskIdx, checkinIdx, tasksBeforeCheckin: taskIdx < checkinIdx };
  });
  console.log('Section order:', JSON.stringify(order));

  // 4. calendar/planner should be gone
  const noPlanner = await page.evaluate(() => ({
    plannerGone: !document.querySelector('.today-planner'),
    planBodyGone: !document.querySelector('#todayPlanBody'),
  }));
  console.log('Planner removed:', JSON.stringify(noPlanner));

  // 5. check a flow checkbox and verify timestamp is recorded
  await page.evaluate(() => {
    const cb = document.querySelector('.mf-check[data-mfkey="checkinAt"]');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
  });
  await page.waitForTimeout(300);

  const afterCheck = await page.evaluate(() => {
    const T = today();
    return {
      checkinAt: S.checkins[T]?.checkinAt || null,
      checkboxChecked: document.querySelector('.mf-check[data-mfkey="checkinAt"]')?.checked,
      timeShown: document.querySelector('.mf-check[data-mfkey="checkinAt"]')?.closest('.row')?.querySelector('.mono')?.textContent?.trim() || '',
    };
  });
  console.log('After checking check-in:', JSON.stringify(afterCheck));

  // 6. check theatre checkbox — should also mark rehearsal
  await page.evaluate(() => {
    const cb = document.querySelector('.mf-check[data-mfkey="theatreAt"]');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
  });
  await page.waitForTimeout(300);

  const afterTheatre = await page.evaluate(() => {
    const T = today();
    return {
      theatreAt: !!S.checkins[T]?.theatreAt,
      rehearsalMarked: S.rehearsal.days.includes(today()),
    };
  });
  console.log('After checking theatre:', JSON.stringify(afterTheatre));

  // 7. check tasks — then verify total shows
  await page.evaluate(() => {
    const cb = document.querySelector('.mf-check[data-mfkey="tasksAt"]');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
  });
  await page.waitForTimeout(300);

  const afterAll = await page.evaluate(() => {
    const T = today();
    return {
      tasksAt: !!S.checkins[T]?.tasksAt,
      allThree: !!(S.checkins[T]?.checkinAt && S.checkins[T]?.theatreAt && S.checkins[T]?.tasksAt),
      totalShown: document.querySelector('.morning-flow .card')?.textContent?.includes('total morning routine') || false,
    };
  });
  console.log('After checking all:', JSON.stringify(afterAll));

  // 8. uncheck one and verify timestamp is cleared
  await page.evaluate(() => {
    const cb = document.querySelector('.mf-check[data-mfkey="checkinAt"]');
    cb.checked = false;
    cb.dispatchEvent(new Event('change'));
  });
  await page.waitForTimeout(300);

  const afterUncheck = await page.evaluate(() => {
    const T = today();
    return {
      checkinAt: S.checkins[T]?.checkinAt,
      totalGone: !document.querySelector('.morning-flow .card')?.textContent?.includes('total morning routine'),
    };
  });
  console.log('After unchecking:', JSON.stringify(afterUncheck));

  // 9. revisit page — wake time should NOT change
  const origWake = await page.evaluate(() => S.checkins[today()]?.wakeAt);
  await page.evaluate(() => { location.hash = '#/vision'; });
  await page.waitForTimeout(200);
  await page.evaluate(() => { location.hash = '#/today'; });
  await page.waitForTimeout(400);
  const afterRevisit = await page.evaluate(() => S.checkins[today()]?.wakeAt);
  console.log('Wake time stable on revisit:', origWake === afterRevisit);

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
