const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1300,height:900});
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html'); await page.waitForTimeout(800);
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    S.habits=[{id:'h1',name:'A really quite long habit name that used to be cut off',icon:'◍',dimension:'physical',kind:'build',
      timeOfDay:'morning',freq:'daily',days:[],perWeek:7,order:0,archived:false,negative:false,min:'',ideal:'',prompt:'',stackAfter:null}];
    saveNow(); location.hash='#/today';
  });
  await page.waitForTimeout(1000);

  const t = await page.evaluate(() => ({
    woke: document.querySelector('.day-edge.waking')?.textContent?.trim(),
    slept: document.querySelector('.day-edge.sleeping')?.textContent?.trim(),
    sleptIsLast: (() => { const p = document.querySelector('.today-page'); return p.lastElementChild?.classList.contains('sleeping'); })(),
    sections: [...document.querySelectorAll('.today-page details.t-sec')].map(d => d.id),
    ticks: [...document.querySelectorAll('.hd-tick')].map(x => x.closest('details')?.id),
    morningFlowGone: !document.querySelector('.morning-flow'),
    timeUseGone: !document.querySelector('.time-use'),
    promptGone: !document.querySelector('#t-prompt'),
    quickAddGone: !document.querySelector('#t-add'),
    ledgerGone: !document.querySelector('#lifeLedger'),
    jumps: [...document.querySelectorAll('[data-jump]')].map(b=>b.textContent),
  }));
  console.log('today:', JSON.stringify(t, null, 1));

  // habit name no longer clipped
  const hn = await page.evaluate(() => {
    const n = document.querySelector('.hring-name'); if(!n) return null;
    const cs = getComputedStyle(n);
    return { width: Math.round(n.getBoundingClientRect().width), lines: cs.webkitLineClamp,
      clipped: n.scrollHeight > n.clientHeight + 2, dir: getComputedStyle(n.closest('.hring-btn')).flexDirection };
  });
  console.log('habit name:', JSON.stringify(hn));

  // the tick in a header records a timestamp on that same line
  await page.evaluate(() => { const d = document.querySelector('#t-checkin'); d.open = true;
    d.querySelector('.mf-check').click(); });
  await page.waitForTimeout(700);
  console.log('header tick:', await page.evaluate(() => ({
    stored: !!S.checkins[today()].checkinAt,
    onClass: document.querySelector('#t-checkin .hd-tick')?.className,
    stamp: document.querySelector('#t-checkin .hd-tick-t')?.textContent?.trim() })));

  // jump must not land under the sticky bar
  await page.evaluate(() => { window.scrollTo(0,0); });
  await page.evaluate(() => document.querySelector('[data-jump="t-habits"]').click());
  await page.waitForTimeout(900);
  console.log('jump clearance:', await page.evaluate(() => {
    const bar = document.querySelector('.today-jump').getBoundingClientRect();
    const sec = document.querySelector('#t-habits').getBoundingClientRect();
    return { barBottom: Math.round(bar.bottom), secTop: Math.round(sec.top), clear: sec.top >= bar.bottom - 1 };
  }));

  // folding is remembered
  await page.evaluate(() => { document.querySelector('#t-tasks').open = false;
    document.querySelector('#t-tasks').dispatchEvent(new Event('toggle')); });
  await page.waitForTimeout(400);
  await page.evaluate(() => rerender());
  await page.waitForTimeout(500);
  console.log('fold remembered:', await page.evaluate(() => ({
    stored: S.settings.todayOpen['t-tasks'], stillClosed: !document.querySelector('#t-tasks').open })));

  // the wake time is editable
  await page.evaluate(() => document.querySelector('#wokeAt').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => { document.querySelector('#clkV').value='06:15'; document.querySelector('#clkOk').click(); });
  await page.waitForTimeout(700);
  console.log('wake edit:', await page.evaluate(() => ({
    rhythm: rhythmDay(today()).wakeTime, shown: document.querySelector('#wokeAt')?.textContent })));

  console.log('ERRORS:', errors.length); errors.slice(0,6).forEach(e=>console.log('  '+e));
  await browser.close();
})();
