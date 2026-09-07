const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors=[];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    S.visions.push({id:'v1',name:'Write a novel',status:'pending',confidence:'seeding',description:'',era:null,createdAt:'2026-01-01',updatedAt:'2026-01-01',completedAt:'',archived:false,progress:0,feeling:3,parentId:null,preSkills:[],values:[],phase:'seeding',links:{},evidence:[],peopleNeeded:[],futureMemoryHistory:[],currentRealityHistory:[],resistance:[],sensory:{},successCriteria:'',reflection:'',costs:'',selfImage:'',obituary:'',nextAction:'',targetDate:'',location:'',money:'',futureMemory:'',currentReality:'',startedAt:''});
    S.skills.push({id:'sk1',name:'Deep writing',cat:'creative',currentLevel:1,planned:false,horizon:'now',priority:'active',prereqs:[],milestones:[],archived:false,links:{values:[],visions:[],skills:[]},preSkillOf:[],archetype:'',notes:'',order:0});
    saveNow();
    location.hash='#/vision';
  });
  await page.waitForTimeout(600);

  // open vision panel via route param
  await page.evaluate(() => { location.hash='#/vision/v1'; });
  await page.waitForTimeout(800);

  // debug: show what's in the DOM
  const debug = await page.evaluate(() => ({
    hash: location.hash,
    panelEl: !!document.querySelector('#panel'),
    panelOverlay: !!document.querySelector('#panel-overlay'),
    panelWrap: !!document.querySelector('#panel-wrap'),
    bodySnippet: document.body.innerHTML.slice(0, 300),
  }));
  console.log('Debug after nav:', JSON.stringify(debug));

  const visionPanel = await page.evaluate(() => ({
    hasToggle: !!document.querySelector('[data-vmkey="vision"]'),
    hasBadge: !!document.querySelector('.wv-badge'),
    panelOpen: !!document.querySelector('#panel'),
    initiallyLv: document.querySelector('#panel')?.classList.contains('lv-mode'),
  }));
  console.log('Vision panel vm:', JSON.stringify(visionPanel));

  // close any blocking modals, then toggle via JS
  await page.evaluate(() => { document.querySelectorAll('#modals .overlay').forEach(o => o.click()); });
  await page.waitForTimeout(200);

  // toggle to workshop mode via JS (avoids overlay pointer-event blocking)
  const hasToggle = await page.evaluate(() => !!document.querySelector('[data-vmkey="vision"]'));
  if(hasToggle) {
    await page.evaluate(() => document.querySelector('[data-vmkey="vision"]').click());
    await page.waitForTimeout(200);
    const afterToggle = await page.evaluate(() => ({
      isWv: document.querySelector('#panel')?.classList.contains('wv-mode'),
      notLv: !document.querySelector('#panel')?.classList.contains('lv-mode'),
      btnText: document.querySelector('[data-vmkey="vision"]')?.textContent?.trim(),
    }));
    console.log('After toggle to wv:', JSON.stringify(afterToggle));

    // toggle back with keyboard shortcut E (dispatch on panel)
    await page.evaluate(() => { document.querySelector('#panel').dispatchEvent(new KeyboardEvent('keydown', {key:'e', bubbles:true})); });
    await page.waitForTimeout(200);
    const afterKey = await page.evaluate(() => ({
      isLv: document.querySelector('#panel')?.classList.contains('lv-mode'),
      btnText: document.querySelector('[data-vmkey="vision"]')?.textContent?.trim(),
    }));
    console.log('After E key to lv:', JSON.stringify(afterKey));
  } else {
    console.log('Toggle button not found — panel may not be open');
  }

  console.log('ERRORS:', errors.length); errors.forEach(e=>console.log(e));
  await browser.close();
})();
