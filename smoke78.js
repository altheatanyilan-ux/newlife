const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1300,height:1000});
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html'); await page.waitForTimeout(800);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true; S.settings.chapterNamed=true;
    const T=today();
    S.skills=['Japanese','Drawing','Cooking','Piano'].map((n,i)=>({id:'sk'+i,name:n,cat:i<2?'language':'craft',horizon:'focus',
      levels:[1,2,3].map(k=>({number:k,label:'L'+k,description:'',criteria:[],resources:[]})),currentLevel:2,milestones:[],prereqs:[],tags:[],archived:false}));
    S.entries.push({id:'pe1',type:'progress',title:'practice',body:'',occurredAt:T,createdAt:new Date().toISOString(),media:[],
      links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:['sk0'],projects:[]},people:[],places:[],emotions:[],confidence:'',extra:{duration:60}});
    S.visionEras=[{id:'e1',name:'Now',subtitle:'',startYear:2020,endYear:2029,color:'#7f916a',order:0,type:'present',stageRef:null}];
    S.visions=['A','B','C'].map((n,i)=>({id:'v'+i,name:'Vision '+n,era:'e1',parentId:null,status:'pending',phase:'in-progress',progress:0,
      startedAt:T,completedAt:'',successCriteria:'',reflection:'',archived:false,confidence:'plan',nextAction:'go',
      sensory:{see:'a',hear:'b',smell:'',firstHour:'c',who:'',noLonger:''},futureMemory:'It happened.',futureMemoryHistory:[],
      costs:'x',currentReality:'y',currentRealityHistory:[],resistance:[],preSkills:[],peopleNeeded:[],selfImage:'',values:[],
      obituary:[],evidence:[{date:T,text:'a step'}],feeling:4,targetDate:'',location:'',money:'',createdAt:T}));
    saveNow(); location.hash='#/skills';
  });
  await page.waitForTimeout(1400);

  const sk = await page.evaluate(() => {
    const w = document.querySelector('.skill-wrap'); const cs = getComputedStyle(w);
    return { bg: cs.backgroundColor, hasSurfaceFill: /rgb\(255|rgb\(36|#fffdf9/i.test(cs.backgroundColor),
      border: cs.borderTopWidth, leaves: document.querySelectorAll('.sk-organic .leaf').length,
      motes: document.querySelectorAll('.skill-wrap .tree-motes i').length,
      fresh: document.querySelectorAll('.sk-twig.fresh').length };
  });
  console.log('skill tree:', JSON.stringify(sk));

  // leaves must actually be moving, and differently from one another
  const moving = await page.evaluate(() => new Promise(res => {
    const ls = [...document.querySelectorAll('.sk-organic .leaf')].slice(0, 6);
    const a = ls.map(l => l.style.transform);
    setTimeout(() => {
      const b = ls.map(l => l.style.transform);
      const changed = a.filter((x,i) => x !== b[i]).length;
      res({changed, distinct: new Set(b).size, sample: b[0]});
    }, 700);
  }));
  console.log('sway:', JSON.stringify(moving));

  await page.evaluate(() => { location.hash='#/vision'; });
  await page.waitForTimeout(700);
  await page.evaluate(() => { S._visionView='tree'; rerender(); });
  await page.waitForTimeout(1400);
  const vt = await page.evaluate(() => {
    const w = document.querySelector('.tree-wrap'); const cs = getComputedStyle(w);
    return { bgColor: cs.backgroundColor, border: cs.borderTopWidth,
      leaves: document.querySelectorAll('.tree-wrap .leaf').length,
      motes: document.querySelectorAll('.tree-wrap .tree-motes i').length };
  });
  console.log('vision tree:', JSON.stringify(vt));
  const moving2 = await page.evaluate(() => new Promise(res => {
    const ls = [...document.querySelectorAll('.tree-wrap .leaf')].slice(0, 6);
    const a = ls.map(l => l.style.transform);
    setTimeout(() => { const b = ls.map(l => l.style.transform);
      res({changed: a.filter((x,i)=>x!==b[i]).length, distinct: new Set(b).size}); }, 700);
  }));
  console.log('vision sway:', JSON.stringify(moving2));

  // leaving the page must stop the loop
  await page.evaluate(() => { location.hash='#/today'; });
  await page.waitForTimeout(800);
  console.log('sway stopped on leave:', await page.evaluate(() => swayRAF === 0));

  console.log('ERRORS:', errors.length); errors.slice(0,6).forEach(e=>console.log('  '+e));
  await browser.close();
})();
