const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1400,height:1000});
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html'); await page.waitForTimeout(800);
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    S.dailyRhythm = {};
    for(let i=0;i<7;i++){ const d = addDays(T,-i);
      const r = rhythmDay(d);
      r.wakeTime = ['06:30','07:15','06:45','08:00','06:20','07:40','06:55'][i];
      r.sleepTime = ['23:10','00:30','22:50','23:45','23:05','01:10','22:30'][i];
      r.blocks = [{id:'b'+i,startTime:'09:00',endTime:['13:00','12:00','14:00','11:00','15:00','10:00','12:30'][i],category:'intentional',tag:'work'},
                  {id:'w'+i,startTime:'20:00',endTime:['22:00','23:00','21:00','22:30','21:30','23:30','21:00'][i],category:'wasted',tag:'scrolling'}];
      rhythmCompute(r);
    }
    // a little of everything so the ledger has something to say
    S.habits=[{id:'h1',name:'Walk',icon:'◍',dimension:'physical',kind:'build',timeOfDay:'morning',freq:'daily',days:[],perWeek:7,order:0,archived:false,negative:false,min:'',ideal:'',prompt:'',stackAfter:null}];
    lastDays(7).forEach((d,i)=>{ if(i%2===0) S.habitLog[d]={h1:{level:'full'}}; });
    saveNow(); location.hash='#/compass';
  });
  await page.waitForTimeout(900);
  await page.evaluate(() => rerender());
  await page.waitForTimeout(700);

  const wk = await page.evaluate(() => ({
    present: !!document.querySelector('.week-shape'),
    bars: document.querySelectorAll('.wk-bar').length,
    wakeDots: document.querySelectorAll('.wk-svg circle').length,
    lines: document.querySelectorAll('.wk-svg polyline').length,
    legend: [...document.querySelectorAll('.wk-key')].map(x=>x.textContent.trim()),
    dayLabels: [...document.querySelectorAll('.wk-day')].map(x=>x.textContent),
    todayMarked: !!document.querySelector('.wk-day.now'),
  }));
  console.log('week shape:', JSON.stringify(wk, null, 1));

  console.log('ledger on compass:', await page.evaluate(() => ({
    ledger: !!document.querySelector('#lifeLedger'),
    stanzas: document.querySelectorAll('#lifeLedger .lg-stanza').length,
    position: !!document.querySelector('.position') })));

  // the numbers the figure claims
  console.log('computed:', await page.evaluate(() => {
    const rows = weekShapeDays().map(weekShapeRow);
    const f = rows.filter(r=>!r.empty);
    return { days: rows.length, filled: f.length,
      avgWake: +(f.reduce((a,r)=>a+r.wake,0)/f.length).toFixed(2),
      avgUsed: +(f.reduce((a,r)=>a+r.used,0)/f.length).toFixed(2),
      avgWasted: +(f.reduce((a,r)=>a+r.wasted,0)/f.length).toFixed(2),
      pastMidnight: rows.filter(r=>r.close>24).length };
  }));

  console.log('today has no graph:', await page.evaluate(async () => {
    location.hash='#/today'; await new Promise(r=>setTimeout(r,800));
    return !document.querySelector('.week-shape, .time-use'); }));

  console.log('ERRORS:', errors.length); errors.slice(0,6).forEach(e=>console.log('  '+e));
  await browser.close();
})();
