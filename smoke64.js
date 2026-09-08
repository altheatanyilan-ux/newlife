const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(700);
  await page.evaluate(() => { S.settings.starterApplied='skip'; S.settings.starterDeclined=true; saveNow(); });

  // any raw CSS visible as body text anywhere?
  const routeNames = await page.evaluate(() => Object.keys(routes));
  const leaks = [];
  for(const r of routeNames){
    await page.evaluate(n => { location.hash = '#/' + n; }, r);
    await page.waitForTimeout(230);
    const hit = await page.evaluate(() => {
      const t = document.body.innerText || '';
      // signatures of raw stylesheet text escaping into the page
      const pats = [/\{[^}]*display:\s*flex/, /var\(--[a-z-]+\)\s*;/, /@media\s*\(/, /border-radius:/, /--ws-|\.ws-[a-z]+\{/];
      const p = pats.find(re => re.test(t));
      if(!p) return null;
      const m = t.match(p);
      const i = t.indexOf(m[0]);
      return t.slice(Math.max(0,i-40), i+90).replace(/\s+/g,' ');
    });
    if(hit) leaks.push([r, hit]);
  }
  console.log(leaks.length ? 'CSS STILL LEAKING:' : 'No raw CSS visible on any page.');
  leaks.forEach(([r,h]) => console.log('  ', r, '→', h));

  // and the studio styles still actually apply
  const styled = await page.evaluate(() => {
    const el = document.createElement('div'); el.className = 'ws-binder';
    document.body.appendChild(el);
    const bg = getComputedStyle(el).backgroundColor;
    const pad = getComputedStyle(el).padding;
    el.remove();
    return {bg, pad};
  });
  console.log('ws-binder style applied:', JSON.stringify(styled));

  const tags = await page.evaluate(() => ({
    styleTags: document.querySelectorAll('style').length,
    headChildren: document.head.children.length,
  }));
  console.log('document:', JSON.stringify(tags));
  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
