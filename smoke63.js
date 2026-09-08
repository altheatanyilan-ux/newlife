const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);
  await page.evaluate(() => { S.settings.starterApplied='skip'; S.settings.starterDeclined=true; saveNow(); });

  const routeNames = await page.evaluate(() => Object.keys(routes));
  const rows = [];
  for(const r of routeNames){
    await page.evaluate(n => { location.hash = '#/' + n; }, r);
    await page.waitForTimeout(260);
    const info = await page.evaluate(() => {
      const head = document.querySelector('#main .page-head');
      const h1 = document.querySelector('#main h1');
      const sub = head?.querySelector('.sub, .subtitle');
      return {
        rendered: !!document.querySelector('#main')?.children.length,
        title: h1?.textContent?.trim().slice(0,26) || '(none)',
        subText: sub ? sub.textContent.trim().slice(0,50) : null,
      };
    });
    rows.push([r, info]);
  }
  let withProse = 0;
  rows.forEach(([r, i]) => {
    if(i.subText) withProse++;
    console.log(r.padEnd(13), i.rendered ? 'ok ' : 'EMPTY', '| title:', (i.title||'').padEnd(26), '| sub:', i.subText ?? '—');
  });
  console.log('\nroutes:', rows.length, '| still carrying a subtitle:', withProse);
  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
