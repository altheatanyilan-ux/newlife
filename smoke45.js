const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors=[];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    // seed some habits
    S.habits.push({id:'h1',name:'Morning walk',freq:{type:'daily',days:[],count:3},timeOfDay:'morning',dimension:'physical',kind:'expenditure',links:{values:[],visions:[],skills:[]},min:'',ideal:'',prompt:'',negative:false,archived:false,stackAfter:null,relational:'',order:0});
    // seed a checkin
    S.checkins[T] = {mood:'settled', sentence:'', energy:{physical:4}, setpoint:16, intention:'Write one honest page'};
    saveNow();
    location.hash='#/today';
  });
  await page.waitForTimeout(800);

  // verify Today page structure
  const todayInfo = await page.evaluate(() => ({
    date: document.querySelector('.today-date')?.textContent,
    moon: !!document.querySelector('.moon'),
    checkin: !!document.querySelector('.today-checkin'),
    moodBtns: document.querySelectorAll('[data-mood]').length,
    moodOn: document.querySelector('.mood-btn.on')?.dataset.mood,
    setpointSlider: !!document.querySelector('#setpoint'),
    habitRings: document.querySelectorAll('#todayRings .hring-btn').length > 0,
    quickAddBtns: document.querySelectorAll('[data-quick]').length,
    plannerSection: !!document.querySelector('#todayPlannerWrap'),
    theatreSection: !!document.querySelector('.rehearsal-wrap'),
    noSignals: !document.querySelector('.signals'),
    noSparkline: !document.querySelector('.sparkline-wrap') && !document.body.innerHTML.includes('these thirty days'),
  }));
  console.log('Today page:', JSON.stringify(todayInfo));

  // verify Rhythm no longer has "Day plan" tab
  await page.evaluate(() => { location.hash='#/rhythm/tape'; });
  await page.waitForTimeout(600);
  const rhythmTabs = await page.evaluate(() => [...document.querySelectorAll('[data-rtab]')].map(b => b.textContent));
  console.log('Rhythm tabs:', JSON.stringify(rhythmTabs));
  const noPlanTab = !rhythmTabs.includes('Day plan');
  console.log('No Day plan tab:', noPlanTab);

  // verify Life Tape partial refresh (tab switch doesn't reload whole page)
  await page.evaluate(() => { location.hash='#/rhythm/tape'; });
  await page.waitForTimeout(400);
  await page.evaluate(() => { window._beforeSwitch = document.querySelector('#ltBody')?.innerHTML?.slice(0,20); });
  await page.evaluate(() => document.querySelector('[data-ltview="month"]')?.click());
  await page.waitForTimeout(500);
  const afterSwitch = await page.evaluate(() => ({
    tabActive: document.querySelector('[data-ltview="month"]')?.classList.contains('active'),
    bodyChanged: document.querySelector('#ltBody')?.innerHTML?.slice(0,20) !== window._beforeSwitch,
    noPageFlash: !!document.querySelector('#ltBody'),
  }));
  console.log('Partial refresh:', JSON.stringify(afterSwitch));

  // verify evening flow has new "See your full day" step
  await page.evaluate(() => { location.hash='#/rhythm/reviews'; });
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('[data-flowstart="lastEvening"]').click());
  await page.waitForTimeout(400);
  const eveSteps = [];
  for(let i=0;i<8;i++){
    const t = await page.evaluate(() => document.querySelector('.modal h2')?.textContent);
    if(!t) break; eveSteps.push(t);
    await page.evaluate(() => document.querySelector('#fwNext')?.click());
    await page.waitForTimeout(260);
  }
  console.log('Evening flow steps:', JSON.stringify(eveSteps));
  const hasSeeFullDay = eveSteps.some(s => s.toLowerCase().includes('full day'));
  const noLifeTapeSummary = !eveSteps.some(s => s.includes('actually held'));
  console.log('Has "See your full day":', hasSeeFullDay, '| Removed "actually held" step:', noLifeTapeSummary);

  console.log('ERRORS:', errors.length); errors.forEach(e=>console.log(e));
  await browser.close();
})();
