const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    // Seed a vision era so guidedNewVision can pick one
    S.visionEras = [{id:'era1', name:'Now', subtitle:'', startYear:2024}];
    saveNow(); location.hash='#/vision';
  });
  await page.waitForTimeout(500);

  // ---- Test guidedNewVision ----
  const visionsBefore = await page.evaluate(() => S.visions.length);
  await page.evaluate(() => guidedNewVision());
  await page.waitForTimeout(200);

  // Check modal opened
  const modalOpen = await page.evaluate(() => !!document.querySelector('.modal'));
  console.log('Vision guided modal opened:', modalOpen);

  // Step 1: fill name + era + click Next
  await page.evaluate(() => {
    document.querySelector('#gvName').value = 'Test Vision Alpha';
    document.querySelector('#gvName').dispatchEvent(new Event('input'));
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);

  // Step 2: future memory
  await page.evaluate(() => {
    const ta = document.querySelector('#gvFm');
    if(ta) ta.value = 'I remember the day it all came together.';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);

  // Step 3: sensory
  await page.evaluate(() => {
    const ta = document.querySelector('#gvSns');
    if(ta) ta.value = 'Morning light through the window.';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);

  // Step 4: confidence — pick 'seeding'
  await page.evaluate(() => {
    document.querySelector('[data-gvc="seeding"]')?.click();
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);

  // Step 5: next action + finish
  await page.evaluate(() => {
    const inp = document.querySelector('#gvNxt');
    if(inp) inp.value = 'Write 200 words now';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(600);

  const visionsAfter = await page.evaluate(() => S.visions.length);
  const lastVision = await page.evaluate(() => { const v = S.visions[S.visions.length-1]; return v ? {name:v.name, confidence:v.confidence, futureMemory:v.futureMemory, nextAction:v.nextAction} : null; });
  console.log('Visions added:', visionsAfter - visionsBefore);
  console.log('Last vision:', JSON.stringify(lastVision));

  // ---- Test guidedNewSkill ----
  await page.evaluate(() => { location.hash='#/skills'; });
  await page.waitForTimeout(400);
  const skillsBefore = await page.evaluate(() => S.skills.length);
  await page.evaluate(() => guidedNewSkill());
  await page.waitForTimeout(200);

  // Step 1: name
  await page.evaluate(() => {
    document.querySelector('#gsName').value = 'Test Skill Beta';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  // Step 2: why
  await page.evaluate(() => {
    const inp = document.querySelector('#gsWhy');
    if(inp) inp.value = 'Because I want to.';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  // Step 3: horizon — pick 'focus'
  await page.evaluate(() => {
    document.querySelector('[data-gsh="focus"]')?.click();
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  // Step 4: beginner desc
  await page.evaluate(() => {
    const ta = document.querySelector('#gsBeg');
    if(ta) ta.value = 'Can do the basics.';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(500);

  const skillsAfter = await page.evaluate(() => S.skills.length);
  const lastSkill = await page.evaluate(() => { const s = S.skills[S.skills.length-1]; return s ? {name:s.name, horizon:s.horizon, why:s.why, level1:s.levels[0].description} : null; });
  console.log('Skills added:', skillsAfter - skillsBefore);
  console.log('Last skill:', JSON.stringify(lastSkill));

  // ---- Test guidedNewPerson ----
  await page.evaluate(() => { location.hash='#/people'; });
  await page.waitForTimeout(400);
  const peopleBefore = await page.evaluate(() => S.people.length);
  await page.evaluate(() => guidedNewPerson());
  await page.waitForTimeout(200);

  // Step 1: name
  await page.evaluate(() => {
    document.querySelector('#gpName').value = 'Test Person Gamma';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  // Step 2: circle — pick core
  await page.evaluate(() => {
    document.querySelector('[data-gpc="core"]')?.click();
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  // Step 3: notes
  await page.evaluate(() => {
    const ta = document.querySelector('#gpNotes');
    if(ta) ta.value = 'Wonderful human.';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  // Step 4: frequency — pick monthly
  await page.evaluate(() => {
    document.querySelector('[data-gpf="30"]')?.click();
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(600);

  const peopleAfter = await page.evaluate(() => S.people.length);
  const lastPerson = await page.evaluate(() => { const p = S.people[S.people.length-1]; return p ? {name:p.name, circle:p.circle, freq:p.desiredFrequency, notes:p.details.notes} : null; });
  console.log('People added:', peopleAfter - peopleBefore);
  console.log('Last person:', JSON.stringify(lastPerson));

  // ---- Test guidedNewStream ----
  await page.evaluate(() => { location.hash='#/finance'; });
  await page.waitForTimeout(400);
  const streamsBefore = await page.evaluate(() => S.incomeStreams.length);
  await page.evaluate(() => guidedNewStream());
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    document.querySelector('#gnName').value = 'Test Stream Delta';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const inp = document.querySelector('#gnCurrent');
    if(inp) inp.value = '1500';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => document.querySelector('#fwNext').click());
  await page.waitForTimeout(500);

  const streamsAfter = await page.evaluate(() => S.incomeStreams.length);
  const lastStream = await page.evaluate(() => { const s = S.incomeStreams[S.incomeStreams.length-1]; return s ? {name:s.name, current:s.current, status:s.status} : null; });
  console.log('Streams added:', streamsAfter - streamsBefore);
  console.log('Last stream:', JSON.stringify(lastStream));

  // ---- Test guidedNewStage ----
  await page.evaluate(() => { location.hash='#/timeline'; });
  await page.waitForTimeout(400);
  const stagesBefore = await page.evaluate(() => S.stages.length);
  await page.evaluate(() => guidedNewStage());
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    document.querySelector('#gsName').value = 'Test Chapter Epsilon';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const f = document.querySelector('#gsYFrom'); if(f) f.value='2020';
    const t = document.querySelector('#gsYTo'); if(t) t.value='2023';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const ta = document.querySelector('#gsNarrative');
    if(ta) ta.value='This was when everything changed.';
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    document.querySelector('[data-gss="past"]')?.click();
    document.querySelector('#fwNext').click();
  });
  await page.waitForTimeout(500);

  const stagesAfter = await page.evaluate(() => S.stages.length);
  const lastStage = await page.evaluate(() => { const s = S.stages.find(x=>x.name==='Test Chapter Epsilon'); return s ? {name:s.name, years:s.years, narrative:s.narrative.slice(0,30)} : null; });
  console.log('Stages added:', stagesAfter - stagesBefore);
  console.log('Last stage:', JSON.stringify(lastStage));

  // ---- Test EntryActions wiring ----
  const actionsExist = await page.evaluate(() => ({
    guidedVision:  typeof EntryActions.guidedVision === 'function',
    guidedSkill:   typeof EntryActions.guidedSkill === 'function',
    guidedPerson:  typeof EntryActions.guidedPerson === 'function',
    guidedMedia:   typeof EntryActions.guidedMedia === 'function',
    guidedStream:  typeof EntryActions.guidedStream === 'function',
    guidedStage:   typeof EntryActions.guidedStage === 'function',
  }));
  console.log('EntryActions guided hooks:', JSON.stringify(actionsExist));

  console.log('ERRORS:', errors.length); errors.forEach(e=>console.log(e));
  await browser.close();
})();
