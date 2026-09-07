const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    S.values = [{id:'v1', name:'Freedom', color:'#c25b5b', fields:{embody:[],hundred:[],motivation:[],counterfeit:[]}, practices:[]}];
    S.valueOrder = ['v1']; S.valueOrderHistory = [];
    S.visions = [{id:'vis1', name:'Write daily', era:'', parentId:null, status:'pending', phase:'in-progress', progress:0,
      startedAt:today(), completedAt:'', successCriteria:'', reflection:'', archived:false, confidence:'seeding', nextAction:'',
      sensory:{see:'',hear:'',smell:'',firstHour:'',who:'',noLonger:''}, futureMemory:'', futureMemoryHistory:[],
      costs:'', currentReality:'', currentRealityHistory:[], resistance:[], preSkills:[], peopleNeeded:[], selfImage:'',
      values:[], obituary:[], evidence:[], feeling:0, targetDate:'', location:'', money:'', createdAt:today()}];
    S.projects = [{id:'p1', name:'Zine', tags:[], phases:[], income:{model:'',current:0,target:0,milestones:[]}, links:{}}];
    S.incomeStreams = [{id:'st1', name:'Freelance editing', model:'freelance', current:0, target:5000, hoursPerWeek:0, currency:'SGD', status:'earning', milestones:[], revenueLog:[]}];
    saveNow(); location.hash='#/finance';
  });
  await page.waitForTimeout(700);

  // 1. eff rate with hours but no income should read "—", not 0.0
  const noIncome = await page.evaluate(() => {
    const s = S.incomeStreams[0]; s.hoursPerWeek = 20; s.current = 0;
    return { rate: effHourlyRate(s) };
  });
  console.log('1. eff rate, hours but no income (want null):', JSON.stringify(noIncome));

  // 2. eff rate computes correctly with both
  const withIncome = await page.evaluate(() => {
    const s = S.incomeStreams[0]; s.hoursPerWeek = 20; s.current = 3000;
    return { rate: +effHourlyRate(s).toFixed(2) };
  });
  console.log('2. eff rate 3000/mo @ 20h/wk (want ~34.64):', JSON.stringify(withIncome));

  // 3. live recalc: edit the current field, confirm the DOM updates with no refresh
  await page.evaluate(() => { S.incomeStreams[0].current = 0; S.incomeStreams[0].hoursPerWeek = 0; saveNow(); rerender(); });
  await page.waitForTimeout(300);

  const beforeEdit = await page.evaluate(() => {
    const card = document.querySelector('.stream-card');
    return card ? card.textContent.replace(/\s+/g,' ').match(/eff\. rate\s*(\S+)/)?.[1] : null;
  });

  // simulate a real edit through the ed() inline editor on hrs/week then current
  await page.evaluate(() => {
    const eds = [...document.querySelectorAll('.stream-card .ed')];
    const find = p => eds.find(e => e.dataset.path.endsWith(p));
    const h = find('.hoursPerWeek'); beginEdit(h);
    const i = h.querySelector('input'); i.value = '20'; i.dispatchEvent(new Event('input')); i.blur();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const eds = [...document.querySelectorAll('.stream-card .ed')];
    const c = eds.find(e => e.dataset.path.endsWith('.current')); beginEdit(c);
    const i = c.querySelector('input'); i.value = '3000'; i.dispatchEvent(new Event('input')); i.blur();
  });
  await page.waitForTimeout(900); // finLiveRecalc debounce + rerender

  const afterEdit = await page.evaluate(() => {
    const card = document.querySelector('.stream-card');
    return {
      shown: card ? card.textContent.replace(/\s+/g,' ').match(/eff\. rate\s*(\S+)/)?.[1] : null,
      storedCurrent: S.incomeStreams[0].current,
      storedHours: S.incomeStreams[0].hoursPerWeek,
      typeofCurrent: typeof S.incomeStreams[0].current,
    };
  });
  console.log('3. eff rate before edit:', beforeEdit, '→ after edit (no refresh):', JSON.stringify(afterEdit));

  // 4. cross-tagging editors present on stream and scenario
  const tagging = await page.evaluate(() => ({
    finLinksBoxes: document.querySelectorAll('[data-finlinks]').length,
    streamHasProjects: !!document.querySelector('.stream-card [data-lk="projects"]'),
    scenarioHasValues: !!document.querySelector('.scenario-card [data-lk="values"]'),
  }));
  console.log('4. cross-tag editors:', JSON.stringify(tagging));

  // 5. link a project to the existing standalone stream (the reported bug)
  const linkProj = await page.evaluate(() => {
    const box = [...document.querySelectorAll('[data-finlinks]')].find(b => b.dataset.finlinks.includes('incomeStreams'));
    const chip = box.querySelector('[data-lk="projects"][data-id="p1"]');
    chip.click();
    return { linkedProjects: S.incomeStreams[0].links.projects, chipOn: chip.classList.contains('on') };
  });
  console.log('5. link project to existing standalone stream:', JSON.stringify(linkProj));

  // 6. editable scenario categories: add, rename, move, delete
  await page.evaluate(() => { location.hash='#/finance'; });
  await page.waitForTimeout(500);
  const catOps = await page.evaluate(() => {
    const sc = S.finance.scenarios[0];
    const before = sc.categories.length;
    document.querySelector('[data-catadd]').click();
    return { before, after: S.finance.scenarios[0].categories.length };
  });
  await page.waitForTimeout(400);
  console.log('6. add category:', JSON.stringify(catOps));

  const catRename = await page.evaluate(() => {
    const sc = S.finance.scenarios[0];
    const c0 = sc.categories[0];
    const node = document.querySelector(`.spend-cat[data-cat="${c0.id}"] .ed`);
    beginEdit(node);
    const i = node.querySelector('input'); i.value = 'Renamed Housing'; i.dispatchEvent(new Event('input')); i.blur();
    return { name: S.finance.scenarios[0].categories[0].name };
  });
  await page.waitForTimeout(300);
  console.log('7. rename category:', JSON.stringify(catRename));

  const catMove = await page.evaluate(() => {
    const sc = S.finance.scenarios[0];
    const firstName = sc.categories[0].name, secondName = sc.categories[1].name;
    const btn = document.querySelector(`.spend-cat[data-cat="${sc.categories[1].id}"] [data-catmove$=":-1"]`);
    btn.click();
    return { firstName, secondName, nowFirst: S.finance.scenarios[0].categories[0].name };
  });
  console.log('8. move category up:', JSON.stringify(catMove));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
