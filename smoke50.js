const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(1000);

  // seed rich data: entries with type variety + linked values/visions
  await page.evaluate(() => {
    S.settings.starterApplied = 'skip'; S.settings.starterDeclined = true;
    const T = today();

    // a value + a vision to link to
    const val1 = {id:'val-test1', name:'Courage', color:'#c25b5b', fields:{embody:[],hundred:[],motivation:[],counterfeit:[]}, practices:[]};
    const val2 = {id:'val-test2', name:'Creativity', color:'#b08968', fields:{embody:[],hundred:[],motivation:[],counterfeit:[]}, practices:[]};
    S.values = [val1, val2];
    S.valueOrder = [val1.id, val2.id];
    S.valueOrderHistory = [];

    const vis1 = {id:'vis-test1', name:'Write every day', era:'', parentId:null, status:'pending', phase:'in-progress', progress:0,
      startedAt:T, completedAt:'', successCriteria:'', reflection:'', archived:false, confidence:'seeding', nextAction:'',
      sensory:{see:'',hear:'',smell:'',firstHour:'',who:'',noLonger:''}, futureMemory:'', futureMemoryHistory:[],
      costs:'', currentReality:'', currentRealityHistory:[], resistance:[], preSkills:[], peopleNeeded:[], selfImage:'',
      values:[], obituary:'', evidence:[], feeling:0, targetDate:'', location:'', money:'', createdAt:T};
    S.visions = [vis1];

    // seed entries across the month with type variety and links
    const types = ['reflection','gratitude','gratitude','dream','reflection','memory','reflection','gratitude','progress'];
    for(let i = 0; i < 18; i++){
      const d = addDays(T, -i % 28);
      const type = types[i % types.length];
      const links = {stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]};
      if(i % 3 === 0) links.values = ['val-test1'];
      if(i % 4 === 0) links.values = ['val-test1','val-test2'];
      if(i % 2 === 0) links.visions = ['vis-test1'];
      S.entries.push({id:uid(), type, title:'Entry '+i, body:'body', occurredAt:d, createdAt:new Date().toISOString(),
        media:[], links, people:[], places:[], emotions:[], tags:[], confidence:'', extra:{}});
    }

    // seed 20 days of checkins
    for(let i = 0; i < 20; i++){
      const d = addDays(T, -i);
      S.checkins = S.checkins || {};
      S.checkins[d] = {setpoint: 10 + Math.round(Math.random()*8), energy:{physical:3,emotional:2,mental:4,spiritual:3}};
    }

    saveNow();
    location.hash = '#/rhythm';
  });
  await page.waitForTimeout(600);

  // navigate to Life Tape
  await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[data-rytab]')];
    const lt = tabs.find(b => /life tape|tape/i.test(b.textContent));
    if(lt) lt.click();
  });
  await page.waitForTimeout(400);

  // switch to month view
  await page.evaluate(() => document.querySelector('[data-ltview="month"]')?.click());
  await page.waitForTimeout(400);

  const summaryInfo = await page.evaluate(() => {
    const card = document.querySelector('.card.rv');
    return {
      hasCard: !!card,
      hasIncomeStrip: !!card?.querySelector('.income-strip'),
      typeSectionHeader: !!card?.querySelector('.sc'),
      typeChips: card?.querySelectorAll('.chip:not(.on)').length ?? 0,
      topLinkedVals: card?.querySelector('.tape-links-summary') ? [...card.querySelectorAll('.tape-links-summary .chip.on')].map(c => c.textContent.trim()) : [],
      spDistSection: !!card?.querySelector('.tape-sp-dist'),
      statNums: [...(card?.querySelectorAll('.income-strip .num') ?? [])].map(n => n.textContent.trim()),
    };
  });
  console.log('Month summary info:', JSON.stringify(summaryInfo));

  // switch to year view, check month strip cells
  await page.evaluate(() => document.querySelector('[data-ltview="year"]')?.click());
  await page.waitForTimeout(400);

  const monthStripInfo = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.tm-cell')].filter(c => !c.classList.contains('quiet'));
    const first = cells[0];
    return {
      totalCells: document.querySelectorAll('.tm-cell').length,
      activeCells: cells.length,
      firstCellText: first?.textContent?.trim()?.replace(/\s+/g,' '),
      hasTopType: first ? /reflection|gratitude|dream|memory|progress|habit/.test(first.textContent) : false,
    };
  });
  console.log('Month strip cells:', JSON.stringify(monthStripInfo));

  // verify half-year view also shows summary
  await page.evaluate(() => document.querySelector('[data-ltview="half"]')?.click());
  await page.waitForTimeout(400);
  const halfSummary = await page.evaluate(() => ({
    hasSummary: !!document.querySelector('.card.rv'),
    hasTypeRow: !!document.querySelector('.tape-links-summary') || document.querySelectorAll('.card.rv .chip').length > 0,
  }));
  console.log('Half-year summary:', JSON.stringify(halfSummary));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
