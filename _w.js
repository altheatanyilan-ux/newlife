const {chromium} = require('playwright');
const OUT='/tmp/claude-0/-home-user-newlife/923b6cf5-ecb3-57ac-957e-178011b85c4d/scratchpad/tex/';
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1400,height:1000}, deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/newlife/index.html'); await p.waitForTimeout(1500);
  const begin = p.locator('#modals button').filter({hasText:/^Begin$/});
  if (await begin.count()) { await begin.first().click(); await p.waitForTimeout(700); }
  await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(1200);
  const sections = v => p.evaluate(() => [...document.querySelectorAll('.today-view:not([hidden]) .t-sec')].map(n => n.id));
  console.log('execution:', JSON.stringify(await sections()));
  console.log('  jumps:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[data-jump]')].map(b=>b.textContent))));
  await p.locator('[data-tview="in"]').click(); await p.waitForTimeout(900);
  console.log('inward:  ', JSON.stringify(await sections()));
  console.log('  jumps:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[data-jump]')].map(b=>b.textContent))));
  await p.screenshot({path: OUT+'today-in.png'});
  console.log('remembered:', await p.evaluate(() => S.settings.todayView));
  // and it survives a re-render
  await p.evaluate(() => rerender()); await p.waitForTimeout(700);
  console.log('after rerender:', await p.evaluate(() => document.querySelector('.today-switch button.on')?.textContent));
  console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
