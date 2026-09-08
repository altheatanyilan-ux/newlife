const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1280,height:1100});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(800);
  await page.evaluate(() => { S.settings.starterApplied='skip'; S.settings.starterDeclined=true; saveNow(); location.hash='#/spiral'; });
  await page.waitForTimeout(900);

  console.log('nav has spiral:', await page.evaluate(() => !!document.querySelector('#sidebar a[data-page="spiral"]')));
  const empty = await page.evaluate(() => ({
    pair: [...document.querySelectorAll('.spi-end-n')].map(x=>x.textContent),
    cols: document.querySelectorAll('.spi-col').length,
    seedBtn: !!document.querySelector('#spiSeed'),
    reading: document.querySelector('.spi-reading')?.textContent,
  }));
  console.log('empty state:', JSON.stringify(empty));

  await page.evaluate(() => document.querySelector('#spiSeed').click());
  await page.waitForTimeout(800);
  const seeded = await page.evaluate(() => ({
    releasing: document.querySelectorAll('.spi-col.releasing .spi-ind').length,
    embodying: document.querySelectorAll('.spi-col.embodying .spi-ind').length,
    traces: document.querySelectorAll('.spi-trace').length,
    progress: Math.round(spiralProgress()*100),
    marker: document.querySelector('.spi-marker')?.style.left,
    reading: document.querySelector('.spi-reading')?.textContent,
    arrived: document.querySelectorAll('.spi-ind.arrived').length,
    receded: document.querySelectorAll('.spi-ind.receded').length,
    colsSideBySide: (() => { const c=[...document.querySelectorAll('.spi-col')]; return c.length===2 && Math.round(c[0].getBoundingClientRect().top)===Math.round(c[1].getBoundingClientRect().top); })(),
    leftIsReleasing: document.querySelector('.spi-cols > .spi-col')?.classList.contains('releasing'),
  }));
  console.log('seeded:', JSON.stringify(seeded, null, 1));

  // set an embodying indicator to 5 → it should arrive
  await page.evaluate(() => {
    const first = document.querySelector('.spi-col.embodying .spi-ind');
    first.querySelectorAll('.spi-dots button')[4].click();
  });
  await page.waitForTimeout(600);
  console.log('after rating 5:', await page.evaluate(() => ({
    arrived: document.querySelectorAll('.spi-ind.arrived').length,
    progress: Math.round(spiralProgress()*100),
    lastChecked: !!S.spiral.indicators.find(x=>x.strength===5)?.lastChecked,
    reading: document.querySelector('.spi-reading')?.textContent })));

  // change the pair
  await page.evaluate(() => { const s = document.querySelector('[data-spistage="embodying"]'); s.value='yellow'; s.dispatchEvent(new Event('change')); });
  await page.waitForTimeout(700);
  console.log('after pair change:', await page.evaluate(() => ({
    pair: S.spiral.currentPair, embStage: S.spiral.indicators.find(x=>x.direction==='embodying').stage,
    label: document.querySelector('.spi-col.embodying .spi-col-h b')?.textContent })));
  await page.evaluate(() => { const s = document.querySelector('[data-spistage="embodying"]'); s.value='green'; s.dispatchEvent(new Event('change')); });
  await page.waitForTimeout(600);

  // tag an entry as evidence
  await page.evaluate(() => {
    S.entries.push({id:'ev1',type:'reflection',title:'Optimised my whole Sunday',body:'again',occurredAt:today(),createdAt:new Date().toISOString(),media:[],links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]},people:[],places:[],emotions:[],confidence:'',extra:{}});
    saveNow(); rerender();
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('#spiTagEntry').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.querySelector('#spiTagPol [data-pol="releasing"]').click();
    const s = document.querySelector('#spiTagStage'); s.value='orange'; s.dispatchEvent(new Event('change'));
    document.querySelector('[data-spipick="ev1"]').click();
  });
  await page.waitForTimeout(700);
  console.log('evidence:', await page.evaluate(() => ({
    tag: S.entries.find(e=>e.id==='ev1').extra.spiral,
    groups: document.querySelectorAll('.spi-ev-group').length,
    rows: document.querySelectorAll('.spi-ev').length })));

  // a check-in
  await page.evaluate(() => document.querySelector('#spiCheckin').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => { document.querySelector('#spiNote').value = 'The green pull is real.'; document.querySelector('#spiSave').click(); });
  await page.waitForTimeout(700);
  console.log('history:', await page.evaluate(() => ({
    n: S.spiral.history.length, pos: S.spiral.history[0].progressPosition,
    frozen: S.spiral.history[0].indicators.length,
    rows: document.querySelectorAll('.spi-hist-row').length })));

  // living / workshop
  await page.evaluate(() => document.querySelector('.spiral-page [data-vmkey]').click());
  await page.waitForTimeout(700);
  console.log('workshop mode:', await page.evaluate(() => document.querySelector('.spiral-page [data-vmkey]')?.textContent.trim()));

  console.log('ERRORS:', errors.length); errors.slice(0,8).forEach(e=>console.log('  '+e));
  await browser.close();
})();
