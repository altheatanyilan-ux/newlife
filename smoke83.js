const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1400,height:1000});
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text().slice(0,160)); });
  await page.goto('file://' + process.cwd() + '/index.html'); await page.waitForTimeout(800);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    S.values=[{id:'v1',name:'Authenticity',color:'#ab93cf',fields:{embody:[],hundred:[],motivation:[],counterfeit:[]},practices:[{id:'p1',text:'say the true thing',perWeek:3,log:[]}]},
              {id:'v2',name:'Mastery',color:'#3fae7a',fields:{embody:[],hundred:[],motivation:[],counterfeit:[]},practices:[]}];
    S.valueOrder=['v1','v2'];
    S.valueSnapshots=[{id:'s1',date:addDays(today(),-9),ratings:{v1:70,v2:48},note:''},{id:'s2',date:addDays(today(),-2),ratings:{v1:74,v2:44},note:''}];
    S.habits=[{id:'h1',name:'Walk',icon:'◍',dimension:'physical',kind:'build',timeOfDay:'morning',freq:'daily',days:[],perWeek:7,order:0,archived:false,negative:false,min:'',ideal:'',prompt:'',stackAfter:null}];
    lastDays(60).forEach((d,i)=>{ if(i%2===0) S.habitLog[d]={h1:{level:'full'}}; });
    // an entry that was tagged to a vision before the room closed
    S.visions=[{id:'oldv',name:'A vision from before',era:'',confidence:'plan',archived:false,values:['v1'],evidence:[],preSkills:[],peopleNeeded:[],sensory:{}}];
    S.entries.push({id:'e1',type:'reflection',title:'A note',body:'x',occurredAt:today(),createdAt:new Date().toISOString(),media:[],
      links:{stages:[],substages:[],threads:[],values:[{id:'v1',pol:'+'}],visions:['oldv'],skills:[],projects:[],people:[]},people:[],places:[],emotions:[],confidence:'',extra:{}});
    saveNow();
  });

  // --- the sidebar, in the shape asked for
  await page.evaluate(() => { location.hash='#/compass'; renderNav(); });
  await page.waitForTimeout(900);
  const nav = await page.evaluate(() => ({
    top: [...document.querySelectorAll('#sidebar .nav-top a')].map(a=>a.dataset.page),
    zones: [...document.querySelectorAll('#sidebar .zone')].map(z => ({
      name: z.querySelector('.zone-lbl').textContent,
      pages: [...z.querySelectorAll('a')].map(a=>a.dataset.page) })),
    standalone: [...document.querySelectorAll('#sidebar .nav > a')].map(a=>a.dataset.page),
    foot: [...document.querySelectorAll('#sidebar .nav-foot a')].map(a=>a.dataset.page),
    goneFromNav: ['vision','lifetape','needs','import'].filter(k => document.querySelector(`#sidebar a[data-page="${k}"]`)),
  }));
  console.log('sidebar:', JSON.stringify(nav, null, 1));

  // --- import lives inside settings
  await page.evaluate(() => { location.hash='#/settings'; });
  await page.waitForTimeout(700);
  console.log('import in settings:', await page.evaluate(() => ({
    section: [...document.querySelectorAll('.settings h3')].map(h=>h.textContent).includes('Import station'),
    link: !!document.querySelector('.settings a[href="#/import"]') })));

  // --- habits on Today, trend on Compass
  await page.evaluate(() => { location.hash='#/today'; });
  await page.waitForTimeout(800);
  console.log('today habits:', await page.evaluate(() => ({
    section: !!document.querySelector('#t-habits'), add: !!document.querySelector('#todayAddHabit'),
    grid: !!document.querySelector('#todayHabitGrid'), practicesGone: !document.querySelector('[data-practoday]') })));
  await page.evaluate(() => { location.hash='#/compass'; });
  await page.waitForTimeout(900);
  console.log('compass:', await page.evaluate(() => ({
    habitTrend: [...document.querySelectorAll('.bento .k')].some(k=>/Habits, 12 weeks/.test(k.textContent)),
    weekShape: !!document.querySelector('.week-shape'),
    ledgerGone: !document.querySelector('#lifeLedger'),
    position: !!document.querySelector('.position'),
    visionsCardGone: ![...document.querySelectorAll('.bento .k')].some(k=>/Visions/.test(k.textContent)),
    houseNodes: [...document.querySelectorAll('.hnode')].map(n=>n.dataset.node) })));

  // --- values page
  await page.evaluate(() => { location.hash='#/values'; });
  await page.waitForTimeout(800);
  console.log('values page:', await page.evaluate(() => ({
    readingGone: !document.querySelector('.reading-card'),
    tellingGone: !document.body.textContent.includes('What this is telling you'),
    matrixGone: !document.querySelector('.matrix'),
    snapshotBtn: !!document.querySelector('#takeSnap'),
    compassList: document.querySelectorAll('.compass-list li').length })));
  await page.evaluate(() => { location.hash='#/value/v1'; });
  await page.waitForTimeout(800);
  console.log('value detail:', await page.evaluate(() => ({
    practicesGone: !document.querySelector('#pracBox') && !document.body.textContent.includes('Weekly practices'),
    imageryGone: !document.querySelector('.rec-img-strip') && !document.querySelector('[data-imgadd]'),
    visionsGone: !document.body.textContent.includes('Served by visions'),
    fieldsKept: document.querySelectorAll('.value-field').length,
    evidenceKept: document.body.textContent.includes('Evidence feed') })));

  // --- vision data survives untouched even though the room is gone
  console.log('vision data preserved:', await page.evaluate(() => ({
    stored: S.visions.length,
    entryLinkKept: S.entries.find(e=>e.id==='e1').links.visions,
    linkKindsExcludeVisions: !LINK_KINDS.includes('visions'),
    normLinksKeepsIt: (() => { const o = normLinks({visions:['oldv']}); return o.visions?.length === 1; })() })));

  console.log('ERRORS:', errors.length); errors.slice(0,6).forEach(e=>console.log('  '+e));
  await browser.close();
})();
