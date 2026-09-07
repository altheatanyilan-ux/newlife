const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    S.visionEras = [{id:'era1', name:'Now', subtitle:'', startYear:2024}];
    // a vision with almost everything blank — the case the user described
    S.visions = [{id:'v1', name:'Sparse vision', era:'era1', parentId:null, status:'pending', phase:'in-progress',
      progress:0, startedAt:'', completedAt:'', successCriteria:'', reflection:'', archived:false,
      confidence:'seeding', nextAction:'', sensory:{see:'',hear:'',smell:'',firstHour:'',who:'',noLonger:''},
      futureMemory:'A single filled field.', futureMemoryHistory:[], costs:'', currentReality:'',
      currentRealityHistory:[], resistance:[], preSkills:[], peopleNeeded:[], selfImage:'', values:[],
      obituary:[], evidence:[], feeling:0, targetDate:'', location:'', money:'', createdAt:today()}];
    saveNow(); location.hash='#/vision';
  });
  await page.waitForTimeout(700);

  await page.evaluate(() => openVisionPanel('v1'));
  await page.waitForTimeout(600);

  const check = mode => page.evaluate(m => {
    const p = document.querySelector('#panel'); if(!p) return {noPanel:true};
    const btn = p.querySelector('[data-vmkey]');
    const want = m === 'lv';
    const isLv = p.classList.contains('lv-mode');
    if(isLv !== want && btn) btn.click();
    const vis = n => { const s = getComputedStyle(n); return s.display !== 'none' && s.visibility !== 'hidden'; };
    const eds = [...p.querySelectorAll('.ed')];
    const emptyEds = eds.filter(e => e.querySelector(':scope > .ph'));
    const fields = [...p.querySelectorAll('.field')];
    const emptyFields = fields.filter(f => { const i=[...f.querySelectorAll('.ed')]; return i.length && i.every(e=>e.querySelector(':scope > .ph')); });
    // labels whose field has no value at all
    const orphanLabels = emptyFields.filter(vis).map(f => f.querySelector('label')?.textContent?.trim()).filter(Boolean);
    return {
      mode: p.classList.contains('lv-mode') ? 'lv' : 'wv',
      totalEds: eds.length,
      emptyEds: emptyEds.length,
      emptyEdsStillVisible: emptyEds.filter(vis).length,
      emptyFields: emptyFields.length,
      emptyFieldsStillVisible: emptyFields.filter(vis).length,
      orphanLabels: orphanLabels.slice(0,6),
      placeholdersVisible: [...p.querySelectorAll('.ph')].filter(vis).length,
    };
  }, mode);

  console.log('WORKSHOP:', JSON.stringify(await check('wv')));
  console.log('LIVING  :', JSON.stringify(await check('lv')));

  // filling a field while in Living View should make it (and its label) appear
  const afterFill = await page.evaluate(() => {
    const p = document.querySelector('#panel');
    if(!p.classList.contains('lv-mode')) p.querySelector('[data-vmkey]').click();
    // switch to workshop, fill currentReality, switch back
    p.querySelector('[data-vmkey]').click();
    const node = [...p.querySelectorAll('.ed')].find(e => e.dataset.path?.endsWith('.currentReality'));
    if(!node) return {noField:true};
    beginEdit(node);
    const i = node.querySelector('input, textarea'); i.value = 'Now it has a value.'; i.dispatchEvent(new Event('input')); i.blur();
    return {filled:true};
  });
  await page.waitForTimeout(300);
  const afterFillLv = await check('lv');
  console.log('after filling one field, LIVING:', JSON.stringify(afterFillLv));

  const shows = await page.evaluate(() => {
    const p = document.querySelector('#panel');
    const n = [...p.querySelectorAll('.ed')].find(e => e.dataset.path?.endsWith('.currentReality'));
    return { visible: n ? getComputedStyle(n).display !== 'none' : null, text: n?.textContent?.trim().slice(0,30) };
  });
  console.log('the newly-filled field in LIVING:', JSON.stringify(shows));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
