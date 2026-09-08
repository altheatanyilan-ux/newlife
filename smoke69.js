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
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    S.visionEras=[
      {id:'e1',name:'The 20s',subtitle:'What you build before you know what building is.',startYear:2020,endYear:2029,color:'#7f916a',order:0,type:'present',stageRef:null},
      {id:'e2',name:'The 30s',subtitle:'',startYear:2030,endYear:2039,color:'#b08968',order:1,type:'future',stageRef:null}];
    const mk = (id,era,name,fm,next,conf,tended) => ({id,name,era,parentId:null,status:'pending',phase:'in-progress',progress:0,
      startedAt:T,completedAt:'',successCriteria:'',reflection:'',archived:false,confidence:conf,nextAction:next,
      sensory:{see:'',hear:'',smell:'',firstHour:'',who:'',noLonger:''},futureMemory:fm,futureMemoryHistory:[],
      costs:'A lot of evenings.',currentReality:'Not started.',currentRealityHistory:[],resistance:['fear of looking foolish'],
      preSkills:[],peopleNeeded:[],selfImage:'',values:[],obituary:[],evidence:[],feeling:4,targetDate:'',location:'',money:'',
      createdAt: addDays(T,-(tended||1))});
    S.visions=[
      mk('v1','e1','JET Programme','I am standing in front of a classroom of fifteen-year-olds.','Apply to the information session.','plan',3),
      mk('v2','e1','Fluent Japanese','I am reading a novel on the train and I understand it.','Begin serious study.','exploring',8),
      mk('v3','e1','A third thing','Some prose.','','hunch',2),
      mk('v4','e1','A fourth thing','More prose.','','hunch',2),
      mk('v5','e2','Building a Family','','Research neighbourhoods.','hunch',90)];
    saveNow(); location.hash='#/vision';
  });
  await page.waitForTimeout(900);

  const ms = await page.evaluate(() => {
    const w = document.querySelector('.lifeline-ms');
    const cs = w ? getComputedStyle(w) : null;
    return {
      present: !!w, maxW: cs?.maxWidth, pad: cs?.paddingLeft,
      invocation: document.querySelector('.ll-invocation')?.textContent?.trim(),
      closing: document.querySelector('.ll-closing p')?.textContent?.trim(),
      chapters: document.querySelectorAll('.ll-chapter').length,
      farDashed: getComputedStyle(document.querySelector('.ll-chapter.far .ll-rule-ch')).borderTopStyle,
      passages: document.querySelectorAll('.ll-vision').length,
      collapsed: document.querySelector('.ll-more-link')?.textContent?.trim(),
      // no card affordances anywhere in the manuscript
      cardish: [...document.querySelectorAll('.lifeline-ms *')].filter(n => {
        const s2 = getComputedStyle(n);
        return (s2.boxShadow !== 'none' && s2.boxShadow) || (s2.borderRadius !== '0px' && s2.backgroundColor !== 'rgba(0, 0, 0, 0)' && n.className && !String(n.className).includes('ll-vision'));
      }).length,
      sceneOp: getComputedStyle(document.documentElement).getPropertyValue('--scene-op').trim(),
    };
  });
  console.log('manuscript:', JSON.stringify(ms, null, 1));

  const conf = await page.evaluate(() => ({
    ladders: document.querySelectorAll('.ll-conf').length,
    dots: document.querySelectorAll('.ll-conf-track i').length,
    onDot: document.querySelectorAll('.ll-conf-track i.on').length,
    firstWord: document.querySelector('.ll-conf-now')?.textContent?.trim(),
    margin: document.querySelector('.ll-margin')?.textContent?.replace(/\s+/g,' ').trim(),
    withered: document.querySelector('.ll-annot')?.textContent?.trim(),
  }));
  console.log('ladder + marginalia:', JSON.stringify(conf));

  // click a rung
  await page.evaluate(() => document.querySelector('[data-llrung="v1:4"]').click());
  await page.waitForTimeout(400);
  console.log('rung click →', await page.evaluate(() => byId(S.visions,'v1').confidence));

  // expand a passage
  await page.evaluate(() => document.querySelector('[data-llname="v2"]').click());
  await page.waitForTimeout(600);
  const exp = await page.evaluate(() => {
    const a = document.querySelector('.ll-vision.open');
    const m = a?.querySelector('.ll-more');
    return { open: !!a, height: Math.round(m?.getBoundingClientRect().height || 0),
             fields: a?.querySelectorAll('.ll-field').length,
             labels: [...(a?.querySelectorAll('.ll-field em')||[])].map(e=>e.textContent.trim()) };
  });
  console.log('expanded:', JSON.stringify(exp));

  // workshop view reveals the chapter tools
  await page.evaluate(() => document.querySelector('.lifeline-ms [data-vmkey]').click());
  await page.waitForTimeout(500);
  const wv = await page.evaluate(() => ({
    mode: document.querySelector('.lifeline-ms').classList.contains('wv-mode') ? 'wv' : 'lv',
    kits: document.querySelectorAll('.ll-erakit').length,
    addEra: !!document.querySelector('#addEra'),
    passages: document.querySelectorAll('.ll-vision').length,
  }));
  console.log('workshop:', JSON.stringify(wv));

  // toggle to the tree and back
  await page.evaluate(() => document.querySelector('[data-vview="tree"]').click());
  await page.waitForTimeout(600);
  const tree = await page.evaluate(() => ({ tree: !!document.querySelector('#treeWrap svg'), lifeline: !!document.querySelector('.lifeline-ms') }));
  await page.evaluate(() => document.querySelector('[data-vview="line"]').click());
  await page.waitForTimeout(600);
  const back = await page.evaluate(() => ({ tree: !!document.querySelector('#treeWrap'), lifeline: !!document.querySelector('.lifeline-ms') }));
  console.log('tree view:', JSON.stringify(tree), '→ back:', JSON.stringify(back));

  // leaving the page must drop the deep atmosphere
  await page.evaluate(() => { location.hash='#/today'; });
  await page.waitForTimeout(900);
  console.log('deep class off other pages:', await page.evaluate(() => !document.documentElement.classList.contains('vision-deep')));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
