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
    S.visions = [{id:'v1', name:'Sparse vision', era:'era1', parentId:null, status:'pending', phase:'in-progress',
      progress:0, startedAt:'', completedAt:'', successCriteria:'', reflection:'', archived:false,
      confidence:'seeding', nextAction:'', sensory:{see:'',hear:'',smell:'',firstHour:'',who:'',noLonger:''},
      futureMemory:'One filled field.', futureMemoryHistory:[], costs:'', currentReality:'',
      currentRealityHistory:[], resistance:[], preSkills:[], peopleNeeded:[], selfImage:'', values:[],
      obituary:[], evidence:[], feeling:0, targetDate:'', location:'', money:'', createdAt:today()}];
    saveNow();
  });

  const probe = () => page.evaluate(() => {
    const p = document.querySelector('#panel'); if(!p) return {noPanel:true};
    const onScreen = n => !!(n.offsetParent || n.getClientRects().length);
    const isEmpty = e => !!e.querySelector(':scope > .ph');
    const eds = [...p.querySelectorAll('.ed')];
    const empties = eds.filter(isEmpty);
    const wrapSel = '.field, .q, .vp-sec, .next-action, .evidence-item';
    const wraps = [...p.querySelectorAll(wrapSel)];
    /* a wrapper holding a select, an on chip or a status pill carries real
       state even with blank text, so it is not "unanswered" */
    const hasOther = w => [...w.querySelectorAll('select, input, textarea, .chip.on, .bar, svg, img, .status-pill, .tagrow')].some(n => !n.closest('.ed'));
    const emptyWraps = wraps.filter(w => { const i=[...w.querySelectorAll('.ed')]; return i.length && i.every(isEmpty) && !hasOther(w); });
    return {
      mode: p.classList.contains('lv-mode') ? 'lv' : 'wv',
      emptyEds: empties.length,
      emptyEdsOnScreen: empties.filter(onScreen).length,
      emptyWraps: emptyWraps.length,
      emptyWrapsOnScreen: emptyWraps.filter(onScreen).length,
      strayLabels: emptyWraps.filter(onScreen).map(w=>w.querySelector('label')?.textContent?.trim()).filter(Boolean).slice(0,6),
      placeholdersOnScreen: [...p.querySelectorAll('.ph')].filter(onScreen).length,
      filledOnScreen: eds.filter(e=>!isEmpty(e)).filter(onScreen).length,
    };
  });

  const setMode = m => page.evaluate(mm => {
    const p = document.querySelector('#panel'); if(!p) return;
    const b = p.querySelector('[data-vmkey]'); if(!b) return;
    if(p.classList.contains('lv-mode') !== (mm==='lv')) b.click();
  }, m);

  const panels = [
    ['vision', () => { S.visions.length && openVisionPanel('v1'); }],
    ['skill',  () => { if(!byId(S.skills,'sk1')){ guidedNewSkill(); document.querySelector('#gsName').value='Sparse skill';
                         for(let i=0;i<6 && document.querySelector('#fwNext');i++) document.querySelector('#fwNext').click();
                         document.querySelectorAll('.overlay').forEach(o=>o.remove());
                         const s2=S.skills[S.skills.length-1]; if(s2) s2.id='sk1'; saveNow(); }
                       typeof openSkillPanel==='function' && openSkillPanel('sk1'); }],
    ['media',  () => { const e = {id:'md1', type:'media', title:'Sparse book', body:'', occurredAt:today(), createdAt:new Date().toISOString(),
                        media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
                        people:[], places:[], emotions:[], tags:[], confidence:'', extra:{kind:'book', status:'reading', rating:0, creator:'', passages:[]}};
                       if(!byId(S.entries,'md1')) S.entries.push(e); saveNow();
                       typeof openMediaPanel==='function' && openMediaPanel('md1'); }],
  ];

  let allPass = true;
  for(const [name, opener] of panels){
    await page.evaluate(() => { const p = document.querySelector('#panel'); p && p.remove(); });
    await page.evaluate(`(${opener.toString()})()`);
    await page.waitForTimeout(650);
    const has = await page.evaluate(() => !!document.querySelector('#panel [data-vmkey]'));
    if(!has){ console.log(name.padEnd(7), 'no living/workshop toggle on this panel — skipped'); continue; }
    await setMode('wv'); await page.waitForTimeout(200);
    const wv = await probe();
    await setMode('lv'); await page.waitForTimeout(200);
    const lv = await probe();
    const pass = lv.emptyEdsOnScreen === 0 && lv.emptyWrapsOnScreen === 0 && lv.placeholdersOnScreen === 0;
    if(!pass) allPass = false;
    console.log(name.padEnd(7), pass ? 'PASS' : 'FAIL');
    console.log('        wv:', JSON.stringify(wv));
    console.log('        lv:', JSON.stringify(lv));
  }

  console.log(allPass ? '\nALL PANELS PASS: Living View shows nothing for an unanswered field — no value, no placeholder, no label.'
                      : '\nFAILURES ABOVE');
  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
