const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1280,height:1000});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(800);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    migrateFinance();
    S.incomeStreams = [
      Object.assign({id:'s1',name:'Freelance design'}, (()=>{const o={model:'retainer',current:3000,target:6000,hoursPerWeek:20,earning:'active',currency:'SGD'};migrateIncomeShape(o);return o;})()),
      Object.assign({id:'s2',name:'Dividend portfolio'}, (()=>{const o={model:'dividends',current:400,target:2000,hoursPerWeek:1,earning:'passive',capital:96000,currency:'SGD'};migrateIncomeShape(o);return o;})()),
    ];
    S.finance.hoursLimit = 40; S.finance.savings = 20000;
    S.finance.scenarios = ['Current life','Tokyo life','Dream life'].map((n,i) => { const sc = newSpendScenario(n,'SGD'); sc.active = i===0;
      sc.categories[0].items.push({id:'i'+i,name:'Rent',amount:24000+i*12000,currency:'SGD',notes:''}); return sc; });
    saveNow(); location.hash = '#/finance';
  });
  await page.waitForTimeout(900);

  const fin = await page.evaluate(() => {
    const rail = document.querySelector('.scenario-rail');
    const cards = [...document.querySelectorAll('.scenario-rail > .scenario-card')];
    return {
      railScrolls: rail ? rail.scrollWidth > rail.clientWidth + 4 : null,
      scenarioCount: cards.length,
      cardWidth: cards[0] ? Math.round(cards[0].getBoundingClientRect().width) : null,
      sideBySide: cards.length > 1 ? Math.round(cards[0].getBoundingClientRect().top) === Math.round(cards[1].getBoundingClientRect().top) : null,
      earnSwitches: document.querySelectorAll('.earn-switch').length,
      passiveCards: document.querySelectorAll('.stream-card.passive').length,
      activeCards: document.querySelectorAll('.stream-card.active-inc').length,
      derived: [...document.querySelectorAll('.stream-derived')].map(d => d.textContent.replace(/\s+/g,' ').trim()),
      splitBar: !!document.querySelector('.split-bar'),
    };
  });
  console.log('finance:', JSON.stringify(fin, null, 1));

  const nums = await page.evaluate(() => {
    const t = portfolioTotals();
    return {activeBase:t.activeBase, passiveBase:t.passiveBase, passiveShare:+t.passiveShare.toFixed(3),
      activeHours:t.activeHours, passiveHours:t.passiveHours, capitalBase:t.capitalBase,
      yield: +streamYield(S.incomeStreams[1]).toFixed(2), payback: Math.round(streamPayback(S.incomeStreams[1])),
      rate: +effHourlyRate(S.incomeStreams[0]).toFixed(2),
      ceiling: Math.round(streamCeiling(S.incomeStreams[0], 40)),
      hoursForTarget_active: Math.round(streamHoursForTarget(S.incomeStreams[0])),
      hoursForTarget_passive: streamHoursForTarget(S.incomeStreams[1]),
    };
  });
  console.log('numbers:', JSON.stringify(nums));

  // toggling the kind changes the arithmetic shown
  await page.evaluate(() => document.querySelector('.stream-card.active-inc .earn-switch button:not(.on)').click());
  await page.waitForTimeout(600);
  console.log('after toggle -> passive cards:', await page.evaluate(() => document.querySelectorAll('.stream-card.passive').length));
  console.log('freelance is now:', await page.evaluate(() => S.incomeStreams[0].earning));

  console.log('ERRORS:', errors.length); errors.slice(0,8).forEach(e=>console.log('  '+e));
  await browser.close();
})();
