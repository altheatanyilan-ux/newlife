const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);
  await page.evaluate(() => { S.settings.starterApplied='skip'; S.settings.starterDeclined=true; saveNow(); location.hash='#/today'; });
  await page.waitForTimeout(700);

  const before = await page.evaluate(() => ({
    hasPlanSection: !!document.querySelector('.today-plan'),
    planNote: document.querySelector('.today-plan .mono')?.textContent?.trim(),
    threeShown: document.querySelectorAll('.today-three li').length,
    hasTomorrowBlock: !!document.querySelector('.tomorrow-block'),
    planTomorrowBtn: !!document.querySelector('#planTomorrow'),
    eveningReviewBtn: !!document.querySelector('#eveningReview'),
    nextWeekBtn: !!document.querySelector('#planNextWeek'),
    isSunday: new Date().getDay() === 0,
  }));
  console.log('Today page, nothing planned:', JSON.stringify(before));

  // plan tomorrow through the real flow
  await page.evaluate(() => document.querySelector('#planTomorrow').click());
  await page.waitForTimeout(350);
  const step1 = await page.evaluate(() => ({
    heading: document.querySelector('.modal h2')?.textContent,
    btn: document.querySelector('#pmNext')?.textContent,
  }));
  console.log('planMyDay step 1 (should say tomorrow):', JSON.stringify(step1));

  await page.evaluate(() => {
    const ins = [...document.querySelectorAll('[data-int]')];
    ins[0].value = 'Ship the finance fix'; ins[0].dispatchEvent(new Event('change'));
    ins[1].value = 'Call Mum'; ins[1].dispatchEvent(new Event('change'));
    document.querySelector('#pmNext').click();
  });
  await page.waitForTimeout(250);
  await page.evaluate(() => document.querySelector('#pmNext').click());
  await page.waitForTimeout(250);
  const lastBtn = await page.evaluate(() => document.querySelector('#pmNext')?.textContent);
  await page.evaluate(() => document.querySelector('#pmNext').click());
  await page.waitForTimeout(700);
  console.log('final button read:', JSON.stringify(lastBtn));

  const after = await page.evaluate(() => {
    const tm = addDays(today(), 1);
    return {
      tomorrowIntentions: (S.plans[tm]?.intentions||[]).filter(Boolean),
      tomorrowPlanned: !!S.plans[tm]?.planned,
      tomorrowCheckinIntention: S.checkins[tm]?.intention || null,
      todayUntouched: (S.plans[today()]?.intentions||[]).filter(Boolean).length,
      blockShowsThree: document.querySelectorAll('.tomorrow-block .today-three li').length,
      btnNowSays: document.querySelector('#planTomorrow')?.textContent?.trim(),
    };
  });
  console.log('after planning tomorrow:', JSON.stringify(after));

  // simulate arriving the next morning: today's plan section should show them
  const nextMorning = await page.evaluate(() => {
    const tm = addDays(today(), 1);
    // move tomorrow's plan onto today, as if the day rolled over
    S.plans[today()] = S.plans[tm]; S.checkins[today()].intention = S.checkins[tm]?.intention || '';
    saveNow(); rerender();
    return {
      planNote: document.querySelector('.today-plan .mono')?.textContent?.trim(),
      three: [...document.querySelectorAll('.today-plan .today-three li')].map(l=>l.textContent.trim()),
      intentionLabel: [...document.querySelectorAll('.today-checkin label')].map(l=>l.textContent.replace(/\s+/g,' ').trim())[0],
    };
  });
  console.log('next morning, today page:', JSON.stringify(nextMorning));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
