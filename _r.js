const {chromium} = require('playwright');
const OUT='/tmp/claude-0/-home-user-newlife/923b6cf5-ecb3-57ac-957e-178011b85c4d/scratchpad/tex/';
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1400,height:1000}, deviceScaleFactor:2});
  await p.goto('file:///home/user/newlife/index.html'); await p.waitForTimeout(1500);
  const begin = p.locator('#modals button').filter({hasText:/^Begin$/});
  if (await begin.count()) { await begin.first().click(); await p.waitForTimeout(700); }
  await p.evaluate(() => { S.settings.theme='dark'; applyTheme(); openIChing && openIChing(); });
  await p.waitForTimeout(1600);
  await p.screenshot({path: OUT+'rite.png'});
  console.log('rite shot');
  await b.close();
})();
