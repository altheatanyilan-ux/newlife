const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);

  // seed 120 days of wake/close/used/wasted so week, month, quarter, half and year all have data
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    for(let i=0;i<120;i++){
      const d = addDays(T,-i);
      const wakeH = 6 + (i%5)*0.5, closeH = 22 + (i%3)*0.5;
      const mk = (h)=>{ const dt=new Date(d+'T00:00:00'); dt.setHours(Math.floor(h), Math.round((h%1)*60)); return dt.toISOString(); };
      S.checkins[d] = Object.assign(S.checkins[d]||{}, {
        wakeAt: mk(wakeH), closeAt: mk(closeH),
        hoursUsed: 5 + (i%6), hoursWasted: 1 + (i%4),
        energy:{}, setpoint:12, intention:'', mood:'', sentence:'',
      });
    }
    saveNow(); location.hash='#/rhythm';
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const tabs=[...document.querySelectorAll('[data-rytab]')];
    const lt=tabs.find(b=>/life tape|tape/i.test(b.textContent)); if(lt) lt.click();
  });
  await page.waitForTimeout(500);

  for(const v of ['week','month','quarter','half','year']){
    await page.evaluate(vv => document.querySelector(`[data-ltview="${vv}"]`)?.click(), v);
    await page.waitForTimeout(450);
    const info = await page.evaluate(() => {
      const s = document.querySelector('.day-shape');
      if(!s) return {missing:true};
      const svg = s.querySelector('.ds-svg');
      return {
        bars: s.querySelectorAll('.ds-bar').length,
        wakeLine: !!svg?.querySelector('polyline[stroke*="gold"]'),
        closeLine: !!svg?.querySelector('polyline[stroke*="ment"]'),
        usedRects: svg?.querySelectorAll('rect[fill*="sage"]').length ?? 0,
        wastedRects: svg?.querySelectorAll('rect[fill*="rose"]').length ?? 0,
        legend: [...s.querySelectorAll('.ds-key')].map(k=>k.textContent.trim().split('·')[0].trim()),
        coverage: s.querySelector('.mono.faint')?.textContent?.trim(),
        height: Math.round(s.getBoundingClientRect().height),
      };
    });
    console.log(v.padEnd(8), JSON.stringify(info));
  }

  // empty state
  await page.evaluate(() => { S.checkins = {}; S.dailyRhythm = {}; saveNow(); rerender(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const tabs=[...document.querySelectorAll('[data-rytab]')];
    const lt=tabs.find(b=>/life tape|tape/i.test(b.textContent)); if(lt) lt.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-ltview="month"]')?.click());
  await page.waitForTimeout(400);
  const empty = await page.evaluate(() => {
    const s = document.querySelector('.day-shape');
    return { present: !!s, saysWhere: /Today page/.test(s?.textContent||'') };
  });
  console.log('empty   ', JSON.stringify(empty));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
