const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    // give the tape something to draw
    for(let i=0;i<40;i++){
      const d = addDays(T,-i);
      S.checkins[d] = {setpoint:10+(i%9), energy:{physical:3,emotional:2,mental:4,spiritual:3}, intention:'x', mood:'open', sentence:''};
      if(i%3===0) S.entries.push({id:uid(), type:'reflection', title:'E'+i, body:'b', occurredAt:d, createdAt:new Date().toISOString(),
        media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]}, people:[], places:[], emotions:[], tags:[], confidence:'', extra:{}});
    }
    saveNow(); location.hash='#/rhythm';
  });
  await page.waitForTimeout(600);

  const flows = [
    ['flowWeekly',   'Weekly review'],
    ['flowMonthly',  'Monthly review'],
    ['flowSeasonal', 'Quarterly review'],
    ['flowHalf',     'Half-year review'],
    ['flowAnnual',   'Annual rite'],
  ];

  for(const [fn, label] of flows){
    await page.evaluate(f => { document.querySelectorAll('.overlay').forEach(o=>o.remove()); window[f](); }, fn);
    await page.waitForTimeout(400);
    const info = await page.evaluate(() => {
      const body = document.querySelector('#flowBody');
      if(!body) return {noBody:true};
      const rv = [...body.querySelectorAll('.rv')];
      const visible = rv.filter(n => getComputedStyle(n).opacity !== '0').length;
      // does the step actually show pixels?
      const r = body.getBoundingClientRect();
      return {
        htmlLen: body.innerHTML.length,
        rvCount: rv.length,
        rvVisible: visible,
        renderedHeight: Math.round(r.height),
        textLen: body.innerText.trim().length,
      };
    });
    console.log(label.padEnd(18), JSON.stringify(info));
  }

  await page.evaluate(() => document.querySelectorAll('.overlay').forEach(o=>o.remove()));
  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
