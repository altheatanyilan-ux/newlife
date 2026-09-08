const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1280,height:1200});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(800);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    // enough across the instrument that several levels can be read
    S.habits=[{id:'h1',name:'Walk',icon:'◍',dimension:'physical',kind:'build',timeOfDay:'morning',freq:'daily',days:[],perWeek:7,order:0,archived:false,negative:false,min:'',ideal:'',prompt:'',stackAfter:null}];
    S.habitLog={}; lastDays(7).forEach((d,i)=>{ if(i%2===0) S.habitLog[d]={h1:{level:'full'}}; });
    lastDays(7).forEach((d,i)=>{ S.checkins[d]={mood:'open',sentence:'',energy:{physical:3+(i%2),mental:4},setpoint:12+i,intention:''}; });
    S.people=[{id:'p1',name:'Mei',circle:'core',status:'active'},{id:'p2',name:'Jonas',circle:'close',status:'active'}];
    S.interactions=[{id:'i1',personId:'p1',date:addDays(T,-3),description:'coffee'}];
    S.rehearsal={script:'',winning:'',aim:'',cycleStart:addDays(T,-5),days:[addDays(T,-5),addDays(T,-4),T]};
    saveNow(); location.hash='#/needs';
  });
  await page.waitForTimeout(1000);

  const needs = await page.evaluate(() => ({
    h1: document.querySelector('#main h1')?.textContent,
    tiers: document.querySelectorAll('.mas-tier').length,
    order: [...document.querySelectorAll('.mas-tier')].map(t=>t.dataset.mtier),
    weakPulse: !!document.querySelector('.mas-tier.weak'),
    weakKey: document.querySelector('.mas-tier.weak')?.dataset.mtier,
    diagnostics: document.querySelectorAll('.needs-diag').length,
    stanzas: document.querySelectorAll('.lg-stanza').length,
    firstFlag: document.querySelector('.lg-flag')?.textContent,
    proseSample: document.querySelector('.lg-stanza .lg-body')?.textContent?.trim().slice(0,150),
    sparks: document.querySelectorAll('.lg-spark').length,
    weights: [...document.querySelectorAll('.lg-stanza')].map(s=>s.className.replace('lg-stanza','').trim()),
  }));
  console.log('needs page:', JSON.stringify(needs, null, 1));

  // the top tier is L7 and the bottom is L1
  console.log('hierarchy top→bottom:', needs.order.join(' '));

  // override
  await page.evaluate(() => document.querySelector('[data-mtier="safety"]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
  await page.waitForTimeout(600);
  const detail = await page.evaluate(() => ({
    open: !!document.querySelector('.mas-detail'),
    tick: document.querySelector('#mOverride')?.style.getPropertyValue('--tick'),
    ask: document.querySelector('.mas-ask')?.textContent }));
  console.log('detail:', JSON.stringify(detail));
  await page.evaluate(() => { const s=document.querySelector('#mOverride'); s.value=25; s.dispatchEvent(new Event('change')); });
  await page.waitForTimeout(700);
  console.log('override stored:', await page.evaluate(() => S.position.overrides.safety));
  console.log('discrepancy shown:', await page.evaluate(() => [...document.querySelectorAll('.mono.faint')].some(x=>/Auto: .* → You: 25/.test(x.textContent))));

  // two check-ins → the multi-line chart
  await page.evaluate(() => { logNeedsCheckin(); S.position.history[0].timestamp = new Date(Date.now()-86400000*30).toISOString(); logNeedsCheckin(); saveNow(); rerender(); });
  await page.waitForTimeout(700);
  console.log('history chart lines:', await page.evaluate(() => document.querySelectorAll('.needs-hist-svg polyline').length));

  // the ledger on Today, limited to 4
  await page.evaluate(() => { location.hash='#/today'; });
  await page.waitForTimeout(1000);
  console.log('today ledger:', await page.evaluate(() => ({
    stanzas: document.querySelectorAll('#lifeLedger .lg-stanza').length,
    readAll: !!document.querySelector('#ledgerAll'),
    jump: [...document.querySelectorAll('[data-jump]')].map(b=>b.textContent).includes('ledger'),
    oldCards: document.querySelectorAll('.mrow').length })));
  await page.evaluate(() => document.querySelector('#ledgerAll').click());
  await page.waitForTimeout(700);
  console.log('after expand:', await page.evaluate(() => document.querySelectorAll('#lifeLedger .lg-stanza').length));

  // maslow-aware gentle prompt is in the pool
  console.log('maslow prompt reachable:', await page.evaluate(() => {
    for(let i=0;i<40;i++){ S._promptShift=i; if(/Fritz says structural tension needs an accurate picture/.test(gentlePrompt())) return true; }
    return false; }));

  console.log('ERRORS:', errors.length); errors.slice(0,8).forEach(e=>console.log('  '+e));
  await browser.close();
})();
