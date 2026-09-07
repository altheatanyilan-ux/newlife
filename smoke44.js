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
    S.habits.push({id:'h1',name:'Run',freq:{type:'daily',days:[],count:3},timeOfDay:'morning',dimension:'physical',kind:'expenditure',links:{values:[],visions:[],skills:[]},min:'',ideal:'',prompt:'',negative:false,archived:false,stackAfter:null,relational:'',order:0});
    // spread activity across the last 200 days
    for(let i=0;i<200;i+=3){
      const d = addDays(T,-i);
      S.entries.push({id:'e'+i,type:i%2?'reflection':'gratitude',title:'day '+i,body:'note '+i,occurredAt:d,createdAt:new Date().toISOString(),media:[],links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},people:[],places:[],emotions:[],tags:[],confidence:'',extra:{}});
      S.habitLog[d] = {h1:{level:'full',note:''}};
      S.checkins[d] = {mood:3, sentence:'', energy:{physical:3}, setpoint:10 + (i%12), intention:''};
    }
    S.finance = S.finance || {};
    saveNow(); location.hash='#/rhythm/tape';
  });
  await page.waitForTimeout(800);

  const tabs = await page.evaluate(() => [...document.querySelectorAll('[data-ltview]')].map(b=>b.textContent));
  console.log('tape zooms:', JSON.stringify(tabs));

  for(const [view, label] of [['month','Month'],['quarter','Quarter'],['half','Half-year']]){
    await page.evaluate((v) => { document.querySelector(`[data-ltview="${v}"]`).click(); }, view);
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => ({
      heading: document.querySelector('#ltBody b.serif')?.textContent,
      monthBlocks: document.querySelectorAll('.tape-month').length,
      dayCells: document.querySelectorAll('.tm-day:not(.out)').length,
      summaryNums: [...document.querySelectorAll('#ltBody .income-strip .num')].map(n=>n.textContent.trim()).slice(0,4),
      modeBtns: document.querySelectorAll('[data-tapemode]').length,
      strip: document.querySelectorAll('.tm-cell').length,
    }));
    console.log(label + ':', JSON.stringify(info));
  }

  // navigation: month prev/next
  await page.evaluate(() => document.querySelector('[data-ltview="month"]').click());
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => document.querySelector('#ltBody b.serif').textContent);
  await page.evaluate(() => document.querySelectorAll('[data-tapemonth]')[0].click());
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => document.querySelector('#ltBody b.serif').textContent);
  console.log('month nav:', before, '->', after);

  // clicking a day cell drills into Day view
  await page.evaluate(() => document.querySelector('.tm-day[data-tapeday]').click());
  await page.waitForTimeout(400);
  console.log('drilled to day:', await page.evaluate(() => ({ view: S._lt.view, h2: document.querySelector('#ltBody h2')?.textContent })));

  // heat mode carries across zooms
  await page.evaluate(() => { S._lt.view='quarter'; S._lt.mode='setpoint'; rerender(); });
  await page.waitForTimeout(500);
  console.log('quarter in set-point mode:', await page.evaluate(() => ({ blocks: document.querySelectorAll('.tape-month').length, coloured: [...document.querySelectorAll('.tm-day')].filter(c=>c.style.background).length })));

  // REVIEWS: seven cards incl monthly + half-year
  await page.evaluate(() => { location.hash='#/rhythm/reviews'; });
  await page.waitForTimeout(700);
  console.log('review cards:', await page.evaluate(() => [...document.querySelectorAll('.review-card b')].map(b=>b.textContent)));

  // run monthly flow through
  await page.evaluate(() => document.querySelector('[data-flowstart="lastMonthly"]').click());
  await page.waitForTimeout(400);
  const mSteps = [];
  for(let i=0;i<8;i++){
    const t = await page.evaluate(() => document.querySelector('.modal h2')?.textContent);
    if(!t) break; mSteps.push(t);
    await page.evaluate(() => document.querySelector('#fwNext')?.click());
    await page.waitForTimeout(260);
  }
  console.log('monthly flow:', JSON.stringify(mSteps));
  console.log('monthly logged:', await page.evaluate(() => S.reviews.lastMonthly));

  // half-year flow
  await page.evaluate(() => document.querySelector('[data-flowstart="lastHalf"]').click());
  await page.waitForTimeout(500);
  const hSteps = [];
  for(let i=0;i<9;i++){
    const t = await page.evaluate(() => document.querySelector('.modal h2')?.textContent);
    if(!t) break; hSteps.push(t);
    await page.evaluate(() => document.querySelector('#fwNext')?.click());
    await page.waitForTimeout(260);
  }
  console.log('half-year flow:', JSON.stringify(hSteps));
  console.log('half logged:', await page.evaluate(() => ({ last: S.reviews.lastHalf, notes: Object.keys(S.reviews.halfNotes||{}) })));

  console.log('ERRORS:', errors.length); errors.forEach(e=>console.log(e));
  await browser.close();
})();
