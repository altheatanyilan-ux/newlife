const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1280,height:1000});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(700);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true; S.settings.chapterNamed=true;
    const T = today();
    S.visionEras=[{id:'e1',name:'Now',subtitle:'',startYear:2020,endYear:2029,color:'#7f916a',order:0,type:'present',stageRef:null},
                  {id:'e2',name:'Ahead',subtitle:'',startYear:2030,endYear:2039,color:'#b08968',order:1,type:'future',stageRef:null}];
    const mk = (id,era,name,fm,next,conf) => ({id,name,era,parentId:null,status:'pending',phase:'in-progress',progress:0,
      startedAt:T,completedAt:'',successCriteria:'',reflection:'',archived:false,confidence:conf,nextAction:next,
      sensory:{see:'',hear:'',smell:'',firstHour:'',who:'',noLonger:''},futureMemory:fm,futureMemoryHistory:[],
      costs:'',currentReality:'',currentRealityHistory:[],resistance:[],preSkills:[],peopleNeeded:[],selfImage:'',
      values:[],obituary:[],evidence:[],feeling:4,targetDate:'',location:'',money:'',createdAt:T});
    S.visions=[mk('v1','e1','First Vision','Prose one.','Do a thing.','plan'),
               mk('v2','e1','Second Vision','Prose two.','Do another.','exploring')];
    S.boards=[{id:'vision:v1',items:[
      {id:'i1',kind:'image',src:'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',caption:'a',span:'m'},
      {id:'i2',kind:'image',src:'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',caption:'b',span:'m'}],note:''}];
    saveNow(); location.hash='#/vision';
  });
  await page.waitForTimeout(900);

  const noBoard = await page.evaluate(() => ({
    topBoard: !!document.querySelector('.vision-board-top'),
    bscope: document.querySelectorAll('[data-bscope]').length,
    boardNote: [...document.querySelectorAll('label')].some(l=>/what this board is about/i.test(l.textContent)),
    plated: document.querySelectorAll('.ll-vision.plated').length,
    plateWidth: Math.round(document.querySelector('.ll-vision.plated')?.getBoundingClientRect().width || 0),
    stripImgs: document.querySelectorAll('.ll-plate-strip img').length,
    tools: document.querySelectorAll('[data-llimgadd]').length,
  }));
  console.log('page:', JSON.stringify(noBoard));

  // deep link consumed
  await page.evaluate(() => { location.hash = '#/vision/v1'; });
  await page.waitForTimeout(700);
  const deep = await page.evaluate(() => ({ panel: !!document.querySelector('#panel'),
    panelName: document.querySelector('#panel h2')?.textContent?.trim(), hash: location.hash }));
  console.log('deep link:', JSON.stringify(deep));

  // close, then open the OTHER vision from the manuscript
  await page.evaluate(() => document.querySelector('#panel .close').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => { document.querySelector('[data-llname="v2"]').click(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => { document.querySelector('.ll-vision.open [data-llfull]').click(); });
  await page.waitForTimeout(500);
  const second = await page.evaluate(() => ({ panelName: document.querySelector('#panel h2')?.textContent?.trim(), hash: location.hash }));
  console.log('second open:', JSON.stringify(second));

  // toggling the view must not resurrect a panel
  await page.evaluate(() => document.querySelector('#panel .close').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-vview="tree"]').click());
  await page.waitForTimeout(700);
  const afterToggle = await page.evaluate(() => ({ panel: !!document.querySelector('#panel'),
    tree: !!document.querySelector('.tree-wrap') }));
  console.log('after view toggle:', JSON.stringify(afterToggle));
  await page.evaluate(() => document.querySelector('[data-vview="line"]').click());
  await page.waitForTimeout(600);

  // Living/Workshop toggle must not resurrect a panel either
  await page.evaluate(() => document.querySelector('#lifeline [data-vmkey]').click());
  await page.waitForTimeout(700);
  const afterVm = await page.evaluate(() => ({ panel: !!document.querySelector('#panel'),
    mode: document.querySelector('#lifeline')?.className }));
  console.log('after living/workshop:', JSON.stringify(afterVm));

  // no big ink splat anywhere
  const ink = await page.evaluate(() => ({ splat: !!document.querySelector('#inkSplat') }));
  console.log('ink:', JSON.stringify(ink));

  console.log('ERRORS:', errors.length); errors.slice(0,8).forEach(e=>console.log('  '+e));
  await browser.close();
})();
