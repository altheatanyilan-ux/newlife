const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1280,height:1000});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(800);

  const nav = await page.evaluate(() => ({
    compassLink: !!document.querySelector('#sidebar a[data-page="compass"]'),
    rhythmLink: !!document.querySelector('#sidebar a[data-page="rhythm"]'),
    tapeLink: !!document.querySelector('#sidebar a[data-page="lifetape"]'),
    labels: [...document.querySelectorAll('#sidebar .lbl')].map(x=>x.textContent),
  }));
  console.log('nav:', JSON.stringify(nav));

  // old hashes must still land somewhere sane
  for(const h of ['#/home','#/rhythm','#/rituals','#/reviews','#/calendar']){
    await page.evaluate(x => { location.hash = x; }, h);
    await page.waitForTimeout(600);
    const got = await page.evaluate(() => ({hash:location.hash, h1:document.querySelector('#main h1')?.textContent?.trim()}));
    console.log(`  ${h} ->`, JSON.stringify(got));
  }

  // seed a period with data and force a weekly + monthly cycle end
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true; S.settings.chapterNamed=true;
    S.habits=[{id:'h1',name:'Walk',icon:'◍',dimension:'physical',kind:'build',timeOfDay:'morning',freq:'daily',days:[],perWeek:7,order:0,archived:false,negative:false,min:'',ideal:'',prompt:'',stackAfter:null}];
    S.habitLog={}; S.entries=[]; S.reviews={};
    const T = today();
    for(let i=0;i<9;i++){ const d = addDays(T,-i);
      if(i%2===0) S.habitLog[d]={h1:{level:'full'}};
      S.entries.push({id:'e'+i,type:'reflection',title:'Note '+i,body:'Something that happened on day '+i,
        occurredAt:d,createdAt:new Date().toISOString(),media:[],links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]},people:[],places:[],emotions:[],confidence:'',extra:{}});
    }
    saveNow();
  });

  // pick a Sunday (weekly cycle end) so the weekly review is due
  const cyc = await page.evaluate(() => {
    const T = today();
    let sun = T; for(let i=0;i<7;i++){ const d = addDays(T,-i); if(parseDay(d).getDay()===0){ sun=d; break; } }
    const due = reviewsDue(sun).map(x => ({key:x.c.key, from:x.from, end:x.end, late:x.late}));
    const st = cycleStats(addDays(sun,-6), sun);
    return {sun, due, habits:st.habits, entries:st.entries.length, days:st.days.length};
  });
  console.log('cycles due on a Sunday:', JSON.stringify(cyc));

  await page.evaluate(() => { location.hash = '#/today'; });
  await page.waitForTimeout(900);
  const today1 = await page.evaluate(() => ({
    jumps: [...document.querySelectorAll('[data-jump]')].map(b=>b.textContent),
    addHabit: !!document.querySelector('#todayAddHabit'),
    reviewCards: document.querySelectorAll('.cyc-card').length,
    dayShape: !!document.querySelector('.day-shape'),
  }));
  console.log('today:', JSON.stringify(today1));

  // jump-link actually moves
  await page.evaluate(() => document.querySelector('[data-jump="t-habits"]').click());
  await page.waitForTimeout(700);
  const scrolled = await page.evaluate(() => Math.round(window.scrollY));
  console.log('scrolled to habits:', scrolled > 100);

  // add-habit opens the modal
  await page.evaluate(() => { window.scrollTo(0,0); document.querySelector('#todayAddHabit').click(); });
  await page.waitForTimeout(500);
  console.log('add-habit modal:', await page.evaluate(() => !!document.querySelector('#modals .overlay')));
  await page.evaluate(() => document.querySelector('#modals .overlay .close')?.click());
  await page.waitForTimeout(300);

  // the daily review card + a local (no-key) reading scoped to the period
  const daily = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.cyc-card')].find(c => c.dataset.cyc === 'daily');
    if(!card) return null;
    card.querySelector('[data-cycask]').click();
    return {figs: [...card.querySelectorAll('.cyc-figs b')].map(b=>b.textContent), graph: !!card.querySelector('.cyc-graph svg')};
  });
  await page.waitForTimeout(400);
  console.log('daily card:', JSON.stringify(daily));
  console.log('reading:', await page.evaluate(() => document.querySelector('.cyc-answer')?.textContent?.slice(0,110)));

  // lifetape page tabs
  await page.evaluate(() => { location.hash = '#/lifetape/habits'; });
  await page.waitForTimeout(800);
  console.log('lifetape habits:', await page.evaluate(() => ({h1:document.querySelector('#main h1')?.textContent, grid: !!document.querySelector('.habit-grid'), tabs:[...document.querySelectorAll('[data-rtab]')].map(b=>b.textContent)})));

  // no shape-of-day anywhere in the tape
  for(const v of ['week','month','year']){
    await page.evaluate(x => { location.hash = '#/lifetape/tape'; S._tape = Object.assign(S._tape||{}, {view:x}); }, v);
    await page.waitForTimeout(500);
    await page.evaluate(() => rerender());
    await page.waitForTimeout(300);
  }
  console.log('day-shape left anywhere:', await page.evaluate(() => !!document.querySelector('.day-shape')));
  console.log('projects scatter:', await page.evaluate(async () => { location.hash='#/projects'; await new Promise(r=>setTimeout(r,700)); return !!document.querySelector('.scatter'); }));

  console.log('ERRORS:', errors.length); errors.slice(0,10).forEach(e=>console.log('  '+e));
  await browser.close();
})();
