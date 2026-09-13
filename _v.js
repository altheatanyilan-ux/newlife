const {chromium} = require('playwright');
const OUT='/tmp/claude-0/-home-user-newlife/923b6cf5-ecb3-57ac-957e-178011b85c4d/scratchpad/tex/';
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1400,height:1000}, deviceScaleFactor:2});
  await p.goto('file:///home/user/newlife/index.html'); await p.waitForTimeout(1500);
  const begin = p.locator('#modals button').filter({hasText:/^Begin$/});
  if (await begin.count()) { await begin.first().click(); await p.waitForTimeout(700); }
  await p.evaluate(() => { S.settings.theme='dark'; applyTheme(); location.hash='#/divination'; });
  await p.waitForTimeout(1500);
  await p.screenshot({path: OUT+'dv.png', fullPage:false});
  // open a tarot draw to see the cards at the new size
  const d = p.locator('button').filter({hasText:/Draw|draw/}).first();
  if (await d.count()) { await d.click(); await p.waitForTimeout(1200); }
  const one = p.locator('#modals button').filter({hasText:/One tarot card/}).first();
  if (await one.count()) { await one.click(); await p.waitForTimeout(3500); }
  const deal = p.locator('#modals button').filter({hasText:/then deal/}).first();
  if (await deal.count()) { await deal.click(); await p.waitForTimeout(5000); }
  const rdy = p.locator('button').filter({hasText:/I'm ready/}).first();
  if (await rdy.count()) { await rdy.click(); await p.waitForTimeout(4000); }
  const pick = p.locator('.dv-pick').first();
  if (await pick.count()) { await pick.click(); await p.waitForTimeout(3000); }
  await p.screenshot({path: OUT+'dv2.png'});
  console.log('shot');
  await b.close();
})();
