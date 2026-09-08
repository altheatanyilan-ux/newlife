const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1300,height:1000});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(700);

  // a life with something in every section, so all seven levels can score
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    S.values=[{id:'v1',name:'Authenticity',color:'#c25b5b',fields:{embody:[],hundred:[],motivation:[],counterfeit:[]},practices:[]},
              {id:'v2',name:'Awe for Life',color:'#d4a44c',fields:{embody:[],hundred:[],motivation:[],counterfeit:[]},practices:[]}];
    S.valueOrder=['v1','v2'];
    S.valueSnapshots=[{id:'s1',date:addDays(T,-20),ratings:{v1:70,v2:48},note:''}];
    S.people=[{id:'p1',name:'Yuki',circle:'core',status:'active',details:{},relationship:'friend',links:{}}];
    S.interactions=[{id:'i1',personId:'p1',date:addDays(T,-2),description:'coffee'}];
    S.skills=[{id:'sk1',name:'Japanese',cat:'language',horizon:'focus',levels:[{number:1,label:'a',description:'',criteria:[],resources:[]}],currentLevel:1,milestones:[],prereqs:[],tags:[]}];
    S.projects=[{id:'pr1',name:'Zine',description:'',tags:[],status:'active',priority:'P3',startDate:T,targetDate:'',phases:[],resources:[],linkedSkills:[],income:{model:'',current:0,target:0,milestones:[]},createdAt:T}];
    S.nods=[{id:'n1',projectId:'pr1',date:addDays(T,-1),text:'drew a page'}];
    S.habits=[{id:'h1',name:'Run',freq:{type:'daily',days:[],count:3},timeOfDay:'morning',dimension:'physical',kind:'expenditure',links:{values:[],visions:[],skills:[]},min:'',ideal:'',prompt:'',negative:false,archived:false,relational:'',order:0}];
    S.habitLog={}; for(let i=0;i<5;i++) S.habitLog[addDays(T,-i)]={h1:{level:'full'}};
    S.visions=[{id:'vi1',name:'Write daily',era:'',parentId:null,status:'pending',phase:'in-progress',progress:0,startedAt:T,completedAt:'',successCriteria:'',reflection:'',archived:false,confidence:'seeding',nextAction:'write',sensory:{see:'a desk',hear:'',smell:'',firstHour:'coffee',who:'',noLonger:''},futureMemory:'It happened.',futureMemoryHistory:[],costs:'',currentReality:'Not yet',currentRealityHistory:[],resistance:[],preSkills:[],peopleNeeded:[],selfImage:'',values:[],obituary:[],evidence:[{date:T,text:'a page'}],feeling:4,targetDate:'2027-01-01',location:'home',money:'',createdAt:T}];
    S.rehearsal={script:'',winning:'',aim:'',days:[T,addDays(T,-1)],cycleStart:addDays(T,-7)};
    S.entries.push({id:'md1',type:'media',title:'Psycho-Cybernetics',body:'',occurredAt:addDays(T,-5),createdAt:new Date().toISOString(),media:[],links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},people:[],places:[],emotions:[],tags:[],confidence:'',extra:{kind:'book',creator:'Maltz',status:'finished',resonanceLevel:'changed',quotes:[]}});
    S.entries.push({id:'r1',type:'reflection',title:'A thought about systems and patterns',body:'both things are true',occurredAt:T,createdAt:new Date().toISOString(),media:[],links:{stages:[],substages:[],threads:[],values:[{id:'v1',pol:'+'}],visions:['vi1'],skills:['sk1'],projects:[],people:[]},people:[],places:[],emotions:[],tags:[],confidence:'',extra:{}});
    for(let i=0;i<7;i++){ const d=addDays(T,-i);
      S.checkins[d]=Object.assign(S.checkins[d]||{},{energy:{physical:4,emotional:3,mental:4,spiritual:3},setpoint:16,intention:'x',mood:'open',sentence:''}); }
    saveNow(); location.hash='#/today';
  });
  await page.waitForTimeout(900);

  const layout = await page.evaluate(() => {
    const order = [...document.querySelectorAll('.today-page > *')].map(n =>
      n.className.split(' ').find(c => ['today-head','today-jump','time-use','life-ledger','morning-flow','today-plan','today-checkin','rehearsal-wrap','cyc-block','tomorrow-block'].includes(c)) || n.tagName.toLowerCase());
    return { order: order.filter(Boolean) };
  });
  console.log('page order:', layout.order.join(' → '));

  const tu = await page.evaluate(() => ({
    bar: !!document.querySelector('.tu-bar'),
    wakeInput: document.querySelector('[data-tuwake]')?.value,
    ticks: document.querySelectorAll('.tu-tick').length,
    sleepBlocks: document.querySelectorAll('.tu-sleep').length,
  }));
  console.log('time-use graph:', JSON.stringify(tu));

  // claim a stretch through the real UI path
  const claimed = await page.evaluate(() => {
    const r = rhythmDay(today());
    r.blocks.push({id:uid(),startTime:'09:00',endTime:'12:00',category:'intentional',tag:'Deep work'});
    r.blocks.push({id:uid(),startTime:'20:00',endTime:'21:30',category:'wasted',tag:'Scrolling'});
    rhythmCompute(r); saveNow(); rerender();
    return r.computed;
  });
  await page.waitForTimeout(500);
  console.log('after claiming 3h used + 1.5h wasted:', JSON.stringify(claimed));
  const rendered = await page.evaluate(() => ({
    blocks: document.querySelectorAll('.tu-block').length,
    ratio: document.querySelector('.tu-ratio')?.textContent?.trim(),
    summary: document.querySelector('.tu-sum span')?.textContent?.replace(/\s+/g,' ').trim(),
  }));
  console.log('rendered:', JSON.stringify(rendered));

  // the stats are prose now, not a card grid, and four of them ride on Today
  const maslow = await page.evaluate(() => {
    const L = maslowScores();
    return { levels: L.map(m => `${m.short}:${m.autoScore ?? '—'}`).join(' '),
             withData: L.filter(m=>m.hasData).length,
             stanzas: document.querySelectorAll('#lifeLedger .lg-stanza').length,
             oldCards: document.querySelectorAll('.mrow, .mstat').length,
             weakestFlagged: document.querySelector('.lg-flag')?.textContent?.trim(),
             prose: document.querySelector('.lg-stanza .lg-body')?.textContent?.trim().slice(0,90) };
  });
  console.log('maslow:', JSON.stringify(maslow, null, 1));

  // the Life Position panel now lives on the Compass, not on Today
  console.log('position off Today:', await page.evaluate(() => !document.querySelector('.position')));
  await page.evaluate(() => { location.hash = '#/compass'; });
  await page.waitForTimeout(900);

  const spiral = await page.evaluate(() => {
    const r = spiralReading();
    return { primary:r.primary, emerging:r.emerging, line:r.line,
             bars: document.querySelectorAll('.spi-row').length,
             top3: Object.entries(r.resonance).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>k+':'+v).join(' ') };
  });
  console.log('spiral:', JSON.stringify(spiral, null, 1));

  const pyr = await page.evaluate(() => ({
    tiers: document.querySelectorAll('.mas-tier').length,
    weakPulsing: document.querySelectorAll('.mas-tier.weak').length,
    svgW: Math.round(document.querySelector('.mas-svg')?.getBoundingClientRect().width || 0),
  }));
  console.log('pyramid:', JSON.stringify(pyr));

  // tier click → detail + override
  await page.evaluate(() => document.querySelector('.position [data-mtier="body"]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
  await page.waitForTimeout(400);
  const detail = await page.evaluate(() => {
    const sl = document.querySelector('#mOverride'); if(!sl) return {noDetail:true};
    sl.value = 42; sl.dispatchEvent(new Event('change'));
    return {ask: document.querySelector('.mas-ask')?.textContent?.slice(0,40), inputs: document.querySelectorAll('.mas-inputs .chip').length};
  });
  await page.waitForTimeout(400);
  const overridden = await page.evaluate(() => {
    const b = maslowScores().find(m=>m.key==='body');
    return {override:b.override, effective:b.effectiveScore, auto:b.autoScore};
  });
  console.log('tier detail:', JSON.stringify(detail), '→ override:', JSON.stringify(overridden));

  // log a check-in
  await page.evaluate(() => document.querySelector('#posLog').click());
  await page.waitForTimeout(500);
  const logged = await page.evaluate(() => ({ history: S.position.history.length,
    hasLevels: (S.position.history[0]?.levels||[]).length, primary: S.position.history[0]?.primaryStage }));
  console.log('check-in logged:', JSON.stringify(logged));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
