const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);
  await page.evaluate(() => { S.settings.starterApplied='skip'; S.settings.starterDeclined=true; S.visionEras=[{id:'e1',name:'Now',subtitle:'',startYear:2024}]; saveNow(); location.hash='#/import'; });
  await page.waitForTimeout(600);

  // local routing (no API key) across a mixed dump
  const routed = await page.evaluate(async () => {
    const raw = [
      'I want to be fluent enough in Japanese to hold a real conversation about something that matters.',
      'need to send the invoice to the design client by friday',
      'Finished reading Psycho-Cybernetics. The bit about the mental screen stayed with me.',
      'every morning I want to sit for ten minutes before touching my phone',
      'my mentor Aiko said something I keep turning over',
      'the freelance editing work brings in about 2k a month now',
      'shipping the zine before the end of the year',
      'those years right after I moved back were their own whole chapter',
      'grateful for the quiet this morning',
    ].join('\n\n\n');
    await impProcess(raw);
    return _impQueue.map(i => ({dest:i.dest, type:i.type, title:i.title.slice(0,42)}));
  });
  console.log('local routing (no key):');
  routed.forEach(r => console.log('   ', r.dest.padEnd(8), '|', r.type.padEnd(13), '|', r.title));
  const distinct = [...new Set(routed.map(r=>r.dest))];
  console.log('   distinct rooms hit:', distinct.length, distinct.join(','));

  // cards render with per-room fields
  await page.evaluate(() => rerender());
  await page.waitForTimeout(400);
  const cards = await page.evaluate(() => {
    const cs = [...document.querySelectorAll('.iq-card')];
    return { n: cs.length,
      destSelectors: document.querySelectorAll('[data-iq-dest]').length,
      withFieldBlocks: cs.filter(c => c.querySelector('.iq-extra')).length,
      fieldInputs: document.querySelectorAll('[data-iq-field]').length };
  });
  console.log('cards:', JSON.stringify(cards));

  // switching a card's room swaps its field set
  const swap = await page.evaluate(() => {
    const sel = document.querySelector('[data-iq-dest]');
    const id = sel.dataset.iqDest;
    const before = document.querySelectorAll(`[data-iqid="${id}"] [data-iq-field]`).length;
    sel.value = 'media'; sel.dispatchEvent(new Event('change'));
    const after = [...document.querySelectorAll(`[data-iqid="${id}"] [data-iq-field]`)].map(n=>n.dataset.iqField.split(':')[1]);
    return { before, afterKeys: after };
  });
  console.log('room swap → media fields:', JSON.stringify(swap));

  // editing a field persists, then commit routes to the right stores
  const committed = await page.evaluate(() => {
    // force one of each room so every builder runs
    const rooms = ['entry','vision','skill','person','project','media','task','habit','stream','stage'];
    _impQueue = rooms.map((d,i) => ({ id:uid(), dest:d, type:'reflection', title:'Test '+d, body:'body text for '+d,
      date: today(), keep:true, tags:['t'+i], why:'because', enriched:true,
      fields:{ futureMemory:'fm', firstHour:'fh', nextAction:'na', confidence:'seeding',
               cat:'craft', why:'w', horizon:'focus', beginnerDesc:'bd',
               relationship:'mentor', circle:'close', notes:'n',
               description:'d', kind:'book', creator:'c', status:'finished', capture:'cap',
               day: today(), cue:'after coffee', timeOfDay:'morning', min:'one line',
               model:'freelance', target:'2000', char:'章', yearFrom:'2020', yearTo:'2023', narrative:'nar' } }));
    const before = { visions:S.visions.length, skills:S.skills.length, people:S.people.length,
      projects:S.projects.length, media:(S.mediaQueue||[]).length, tasks:(S.tasks||[]).length,
      habits:S.habits.length, streams:(S.incomeStreams||[]).length, stages:S.stages.length, entries:S.entries.length };
    impCommit();
    const after = { visions:S.visions.length, skills:S.skills.length, people:S.people.length,
      projects:S.projects.length, media:(S.mediaQueue||[]).length, tasks:(S.tasks||[]).length,
      habits:S.habits.length, streams:(S.incomeStreams||[]).length, stages:S.stages.length, entries:S.entries.length };
    const delta = {}; Object.keys(before).forEach(k => delta[k] = after[k]-before[k]);
    const v = S.visions[S.visions.length-1], sk = S.skills[S.skills.length-1], p = S.people[S.people.length-1];
    const md = (S.mediaQueue||[]).slice(-1)[0], st = S.stages[S.stages.length-1];
    return { delta,
      visionCarried: {fm:v?.futureMemory, first:v?.sensory?.firstHour, next:v?.nextAction, conf:v?.confidence},
      skillCarried:  {cat:sk?.cat, hz:sk?.horizon, lvl1:sk?.levels?.[0]?.description},
      personCarried: {rel:p?.relationship, circle:p?.circle, notes:p?.details?.notes},
      mediaCarried:  {kind:md?.kind, creator:md?.creator, status:md?.status},
      stageCarried:  {char:st?.char, years:st?.years} };
  });
  console.log('commit deltas:', JSON.stringify(committed.delta));
  console.log('  vision fields carried:', JSON.stringify(committed.visionCarried));
  console.log('  skill  fields carried:', JSON.stringify(committed.skillCarried));
  console.log('  person fields carried:', JSON.stringify(committed.personCarried));
  console.log('  media  fields carried:', JSON.stringify(committed.mediaCarried));
  console.log('  stage  fields carried:', JSON.stringify(committed.stageCarried));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
