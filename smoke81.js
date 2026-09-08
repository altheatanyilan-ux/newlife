const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1300,height:1000});
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html'); await page.waitForTimeout(800);
  await page.evaluate(() => { S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    S.habits=[{id:'h1',name:'Walk',icon:'◍',dimension:'physical',kind:'build',timeOfDay:'morning',freq:'daily',days:[],perWeek:7,order:0,archived:false,negative:false,min:'',ideal:'',prompt:'',stackAfter:null}];
    S.tasks=[{id:'tk1',text:'Finish the draft',day:today(),done:true,createdAt:today()},
             {id:'tk2',text:'Call the bank',day:today(),done:false,createdAt:today()}];
    S.reviews={}; saveNow(); });

  // THE QUESTION: a missed weekly, and the new week's weekly, on the same day
  const stacked = await page.evaluate(() => {
    // find a Sunday, and the Sunday before it
    let sun = today(); for(let i=0;i<7;i++){ const d=addDays(today(),-i); if(parseDay(d).getDay()===0){ sun=d; break; } }
    const prevSun = addDays(sun,-7);
    S.reviews = {}; // neither was ever done
    const due = reviewsDue(sun);
    return { evaluatedOn: sun, prevSun,
      weeklies: due.filter(x=>x.c.key==='weekly').map(x=>({end:x.end, from:x.from, late:x.late})),
      allKinds: due.map(x=>x.c.key) };
  });
  console.log('both weeklies shown:', JSON.stringify(stacked, null, 1));

  // and once the older one is answered, only the newer remains
  const afterOne = await page.evaluate(() => {
    let sun = today(); for(let i=0;i<7;i++){ const d=addDays(today(),-i); if(parseDay(d).getDay()===0){ sun=d; break; } }
    const prevSun = addDays(sun,-7);
    const c = CYCLES.find(x=>x.key==='weekly');
    S.reviews.done = {}; S.reviews.done[cyclePeriodId(c, prevSun)] = new Date().toISOString();
    return reviewsDue(sun).filter(x=>x.c.key==='weekly').map(x=>x.end);
  });
  console.log('after answering the older:', JSON.stringify(afterOne));

  // completion lands on the period that was begun, not merely "today"
  const marks = await page.evaluate(() => {
    S.reviews = {};
    let sun = today(); for(let i=0;i<7;i++){ const d=addDays(today(),-i); if(parseDay(d).getDay()===0){ sun=d; break; } }
    const prevSun = addDays(sun,-7);
    const c = CYCLES.find(x=>x.key==='weekly');
    beginCycleReview.__test = true;
    pendingCycle = {key:'weekly', end:prevSun};
    markCycleAnswered('lastWeekly');
    return { markedPrev: !!S.reviews.done[cyclePeriodId(c, prevSun)], markedThis: !!S.reviews.done[cyclePeriodId(c, sun)] };
  });
  console.log('completion targeting:', JSON.stringify(marks));

  // the capture step and the tasks step
  await page.evaluate(() => { S.reviews={}; location.hash='#/today'; });
  await page.waitForTimeout(800);
  await page.evaluate(() => flowEvening());
  await page.waitForTimeout(500);
  const steps = await page.evaluate(async () => {
    const titles = [];
    for(let i=0;i<12;i++){
      const h = document.querySelector('#modals h2')?.textContent?.trim();
      if(h) titles.push(h);
      const nx = document.querySelector('#fwNext'); if(!nx) break;
      const cap = document.querySelector('.cap-grid');
      if(cap) return {titles, capKinds: document.querySelectorAll('[data-cap]').length,
                      taskSeen: titles.some(t=>/actually got done/i.test(t))};
      nx.click(); await new Promise(r=>setTimeout(r,260));
    }
    return {titles};
  });
  console.log('evening flow:', JSON.stringify(steps, null, 1));

  // adding from the capture step keeps the review open and updates the count
  const cap = await page.evaluate(async () => {
    const before = document.querySelector('.cap-count')?.textContent;
    document.querySelector('[data-cap="gratitude"]').click();
    await new Promise(r=>setTimeout(r,400));
    const entryOpen = document.querySelectorAll('#modals .overlay').length;
    const ta = document.querySelector('#modals .overlay:last-child textarea');
    if(ta){ ta.value = 'the light this morning'; ta.dispatchEvent(new Event('input',{bubbles:true})); }
    const save = [...document.querySelectorAll('#modals .overlay:last-child button')].find(b=>/save|keep|add/i.test(b.textContent));
    if(save) save.click();
    await new Promise(r=>setTimeout(r,600));
    return { overlaysWhileAdding: entryOpen, reviewStillOpen: !!document.querySelector('.cap-grid'),
      before, after: document.querySelector('.cap-count')?.textContent,
      entries: S.entries.filter(e=>e.type==='gratitude').length };
  });
  console.log('capture:', JSON.stringify(cap));

  // plan for tomorrow has the new steps
  await page.evaluate(() => { document.querySelectorAll('#modals .overlay').forEach(o=>o.remove()); planMyDay(addDays(today(),1)); });
  await page.waitForTimeout(400);
  const plan = await page.evaluate(async () => {
    const seen=[];
    for(let i=0;i<7;i++){
      seen.push(document.querySelector('#modals h2')?.textContent?.trim());
      const step = document.querySelector('#modals .mono')?.textContent;
      if(document.querySelector('[data-planwhy]')) document.querySelector('[data-planwhy]').value='shipping the thing';
      if(document.querySelector('[data-planfirst]')) document.querySelector('[data-planfirst]').value='open the editor';
      const nx = document.querySelector('#pmNext'); if(!nx) break;
      if(/of 5/.test(step||'') && /5 of 5|step 5/.test(step||'')) {}
      nx.click(); await new Promise(r=>setTimeout(r,220));
      if(!document.querySelector('#pmNext')) break;
    }
    return {seen, why: dayPlan(addDays(today(),1)).why, firstMove: dayPlan(addDays(today(),1)).firstMove};
  });
  console.log('plan flow:', JSON.stringify(plan, null, 1));

  console.log('ERRORS:', errors.length); errors.slice(0,6).forEach(e=>console.log('  '+e));
  await browser.close();
})();
