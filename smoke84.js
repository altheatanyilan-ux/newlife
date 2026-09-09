/* The batch after the Spiral removal: the date picker, the banner, the value
   page, entry imagery, the review chips and flows, the sounds and the trees. */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1400,height:1200});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(900);

  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T = today();
    S.values=[{id:'v1',name:'Integrity',color:'#7f916a',fields:{embody:[{date:addDays(T,-30),text:'old'},{date:T,text:'now'}],hundred:[],motivation:[],counterfeit:[]}}];
    S.valueOrder=['v1']; S.valueOrderHistory=[];
    S.valueSnapshots=[{id:'s1',date:addDays(T,-40),ratings:{v1:50},notes:{},note:''},{id:'s2',date:T,ratings:{v1:72},notes:{},note:''}];
    S.skills=[0,1,2,3].map(i=>({id:'sk'+i,name:'S'+i,cat:'craft',horizon:'focus',
      levels:[1,2,3].map(k=>({number:k,label:'L'+k,description:'',criteria:[],resources:[]})),
      currentLevel:i,milestones:[],prereqs:[],tags:[],archived:false,planned:false}));
    S.entries.push({id:'e1',type:'reflection',title:'With a picture',body:'x',occurredAt:T,createdAt:new Date().toISOString(),
      media:[{id:'m1',src:'data:image/gif;base64,R0lGODlhAQABAAAAACw=',caption:'',date:T,people:[]}],
      links:{stages:[],substages:[],threads:[],values:[],skills:[],projects:[],people:[]},people:[],places:[],emotions:[],confidence:'',extra:{}});
    S.habits=[{id:'h1',name:'Walk',icon:'◍',dimension:'physical',kind:'build',timeOfDay:'morning',freq:'daily',days:[],perWeek:7,order:0,archived:false,negative:false,min:'',ideal:'',prompt:'',stackAfter:null}];
    S.habitLog={}; lastDays(30).forEach((d,i)=>{ if(i%2===0) S.habitLog[d]={h1:{level:'full'}}; });
    lastDays(20).forEach((d,i)=>{ const r = rhythmDay(d);
      r.wakeTime = pad(6+(i%3))+':00'; r.sleepTime = pad(21+(i%2))+':00';
      r.blocks=[{id:'b'+i,startTime:'09:00',endTime:'13:00',category:'intentional',tag:'work'},
                {id:'c'+i,startTime:'20:00',endTime:'21:00',category:'wasted',tag:'scroll'}];
      rhythmCompute(r); });
    saveNow(); location.hash='#/values'; rerender();
  });
  await page.waitForTimeout(1400);

  /* 1. the Spiral room is gone and redirects */
  await page.evaluate(() => { location.hash='#/spiral'; }); await page.waitForTimeout(700);
  console.log('spiral:', JSON.stringify({
    redirects: await page.evaluate(() => location.hash),
    notInNav: await page.evaluate(() => !document.querySelector('#sidebar a[data-page="spiral"]')),
    noRoute: await page.evaluate(() => !routes.spiral) }));

  /* 2. every banner is as wide as its page, translucent, and carries its rule */
  const banners = {};
  for(const r of ['compass','journals','values','skills','projects','finance','commonplace','people','timeline','writing','settings']){
    await page.evaluate(n => { location.hash='#/'+n; }, r); await page.waitForTimeout(420);
    banners[r] = await page.evaluate(() => { const h=document.querySelector('.page-head'); if(!h) return null;
      const pg=h.closest('.page'), a=h.getBoundingClientRect(), b=pg.getBoundingClientRect();
      return {l:+(a.left-b.left).toFixed(0), r:+(b.right-a.right).toFixed(0),
        glass:getComputedStyle(h).backdropFilter!=='none', rule:!!h.querySelector('.ph-rule')}; });
  }
  const bad = Object.entries(banners).filter(([,v]) => v && (v.l!==0||v.r!==0||!v.glass||!v.rule));
  console.log('banners aligned + glass + ruled:', bad.length ? JSON.stringify(bad) : 'all ' + Object.keys(banners).length);

  /* 3. one calendar, everywhere */
  await page.evaluate(() => { location.hash='#/journals'; }); await page.waitForTimeout(700);
  const box = await page.evaluate(() => { const i=document.querySelector('#jfrom'); const r=i.getBoundingClientRect();
    return {x:r.x+r.width/2, y:r.y+r.height/2}; });
  await page.mouse.click(box.x, box.y); await page.waitForTimeout(400);
  const dp = await page.evaluate(() => ({ open:!!document.querySelector('.dp-pop'),
    cells:document.querySelectorAll('.dp-cell[data-dpd]').length,
    months:document.querySelectorAll('.dp-month option').length,
    yearTypeable:document.querySelector('.dp-year')?.type }));
  await page.evaluate(() => { const y=document.querySelector('.dp-year'); y.value='1994'; y.dispatchEvent(new Event('input',{bubbles:true})); });
  await page.waitForTimeout(250);
  await page.evaluate(() => [...document.querySelectorAll('.dp-cell[data-dpd]')][9].click());
  await page.waitForTimeout(400);
  dp.picked = await page.evaluate(() => document.querySelector('#jfrom').value);
  dp.wroteThrough = await page.evaluate(() => S._jfrom);
  console.log('date picker:', JSON.stringify(dp));

  /* 4. the value page */
  await page.evaluate(() => { location.hash='#/value/v1'; }); await page.waitForTimeout(900);
  console.log('value page:', JSON.stringify({
    chartInBanner: await page.evaluate(() => !!document.querySelector('.page-head .vhead-chart')),
    evidenceFirst: await page.evaluate(() => document.querySelector('.page .sc')?.textContent.trim()),
    facets: await page.evaluate(() => document.querySelectorAll('.vfacet').length),
    facetsDistinct: await page.evaluate(() => new Set([...document.querySelectorAll('.vfacet')].map(f=>getComputedStyle(f).borderLeftColor)).size),
    versionsKept: await page.evaluate(() => !!document.querySelector('.vf-vers')) }));

  await page.evaluate(() => { location.hash='#/values'; }); await page.waitForTimeout(900);
  console.log('values page:', JSON.stringify({
    panelsLevel: await page.evaluate(() => { const c=[...document.querySelectorAll('.shape-card')];
      return c.length===2 && Math.abs(c[0].getBoundingClientRect().height-c[1].getBoundingClientRect().height) < 2; }),
    endLabels: await page.evaluate(() => [...document.querySelectorAll('.time-slider .lbl span')].map(x=>x.textContent)),
    noStrayNow: await page.evaluate(() => ![...document.querySelectorAll('.time-slider .lbl span')].some(x=>x.textContent==='now')),
    floatRides: await page.evaluate(() => !!document.querySelector('.ts-float')?.style.left),
    noSnapBars: await page.evaluate(() => !document.querySelector('.snap-bars')) }));

  /* 5. an entry is printed on its picture */
  await page.evaluate(() => { location.hash='#/journals'; S._jfrom=''; rerender(); }); await page.waitForTimeout(800);
  console.log('entry imagery:', JSON.stringify({
    plated: await page.evaluate(() => !!document.querySelector('.entry.plated')),
    backdrop: await page.evaluate(() => !!document.querySelector('.entry.plated .rec-plate-img')),
    entryIsAnImageOwner: await page.evaluate(() => IMG_OWNERS.entry?.field) }));

  /* 6. reviews are chips beside the evening review */
  await page.evaluate(() => { location.hash='#/today'; }); await page.waitForTimeout(1000);
  await page.evaluate(() => { const d=document.querySelector('#t-tonight'); if(d) d.open=true; });
  await page.waitForTimeout(300);
  console.log('reviews:', JSON.stringify({
    oldBlockGone: await page.evaluate(() => !document.querySelector('#t-reviews') && !document.body.textContent.includes('close tonight')),
    chipsInTonight: await page.evaluate(() => { const c=document.querySelector('.rvw-chip'); return c ? !!c.closest('#t-tonight') : 'none'; }),
    eveningKept: await page.evaluate(() => !!document.querySelector('#eveningReview')),
    emptyPeriodsSkipped: await page.evaluate(() => reviewsDue('2026-09-09').every(x => x.c.key==='daily' || x.late>0)),
    headersOneSize: await page.evaluate(() => new Set([...document.querySelectorAll('.today-page .sc')].map(x=>getComputedStyle(x).fontSize)).size) }));

  /* 7. the enriched flows */
  const flow = await page.evaluate(async () => {
    flowEvening();
    await new Promise(r=>setTimeout(r,250));
    const n = document.querySelectorAll('.flow-dots i').length;
    const titles = [];
    for(let i=0;i<n;i++){ titles.push(document.querySelector('.modal h2').textContent);
      if(i<n-1){ document.querySelector('#fwNext').click(); await new Promise(r=>setTimeout(r,90)); } }
    const prompts = [...document.querySelectorAll('.plan-lbl')].map(x=>x.textContent);
    const f = document.querySelector('[data-plan="protect"]');
    f.value='the first hour'; f.dispatchEvent(new Event('input',{bubbles:true}));
    const saved = dayPlan(addDays(today(),1)).protect;
    document.querySelector('.modal .close').click();
    return {n, titles, prompts, saved, tasks: titles.includes('What actually got done.')};
  });
  console.log('evening flow:', JSON.stringify({steps:flow.n, planPrompts:flow.prompts.length,
    prompts:flow.prompts, savesAsTyped:flow.saved, surfacesTasks:flow.tasks}));

  const ret = await page.evaluate(async () => {
    flowEvening({startAt:4}); await new Promise(r=>setTimeout(r,250));
    const step = document.querySelector('.modal .mono').textContent;
    document.querySelector('[data-cap="reflection"]').click(); await new Promise(r=>setTimeout(r,250));
    const stashed = localStorage.getItem('lifeInstrument_reviewReturn');
    document.querySelectorAll('.overlay').forEach(o=>o.remove());
    location.hash='#/journals'; await new Promise(r=>setTimeout(r,900));
    return {step, stashed: !!stashed, reopened: !!document.querySelector('#flowBody'),
      at: document.querySelector('.modal .mono')?.textContent,
      cleared: !localStorage.getItem('lifeInstrument_reviewReturn')};
  });
  console.log('return to review:', JSON.stringify(ret));
  await page.evaluate(() => document.querySelectorAll('.overlay').forEach(o=>o.remove()));

  /* 8. one voice, several pitches */
  console.log('sound:', JSON.stringify(await page.evaluate(async () => {
    SoundManager.setSound(true); const out = {};
    for(const k of ['click','nav','open','success','error','leaf']){
      try { SoundManager.play(k); out[k]='ok'; } catch(e){ out[k]=e.message; }
      await new Promise(r=>setTimeout(r,70)); }
    return out; })));

  /* 9. two charts, not one */
  await page.evaluate(() => { location.hash='#/compass'; rerender(); }); await page.waitForTimeout(1200);
  console.log('charts:', JSON.stringify({
    sleepWake: await page.evaluate(() => !!document.querySelector('.week-shape')),
    pie: await page.evaluate(() => !!document.querySelector('.time-pie')),
    arcs: await page.evaluate(() => document.querySelectorAll('.tp-svg path').length),
    spanOptions: await page.evaluate(() => document.querySelectorAll('#tpSpan option').length),
    noStackedBars: await page.evaluate(() => !document.querySelector('.week-shape .wk-bar')) }));

  /* 10. the tree flowers */
  await page.evaluate(() => { location.hash='#/skills'; }); await page.waitForTimeout(1600);
  console.log('tree:', JSON.stringify(await page.evaluate(() => {
    const o = {};
    document.querySelectorAll('.sk-twig[data-skill]').forEach(t => {
      o[t.dataset.skill] = [t.querySelectorAll('.leaf').length, t.querySelectorAll('.blossom').length]; });
    return o; })));
  console.log('milestone rows are rows:', await page.evaluate(() => {
    const r = document.querySelector('.ms-line'); return !r || getComputedStyle(r).position !== 'absolute'; }));

  /* 11. the entry modal: a painting per kind, and fields that are not boxes */
  await page.evaluate(() => { location.hash='#/journals'; }); await page.waitForTimeout(700);
  await page.mouse.move(4, 4);                       // hover reveals a field, so look at one nothing is over
  await page.evaluate(() => openEntryModal({type:'dream'})); await page.waitForTimeout(700);
  const modal = await page.evaluate(async () => {
    const seals = {}, sizes = new Set();
    for(const [t] of ENTRY_TYPES){ if(t === 'nod') continue;
      const btn = document.querySelector(`#typeRow [data-t="${t}"]`); if(!btn) continue;
      btn.click(); await new Promise(r => setTimeout(r, 40));
      seals[t] = document.querySelector('.entry-ink-seal')?.textContent;
      sizes.add(document.querySelector('.entry-ink-svg')?.innerHTML.length); }
    document.activeElement && document.activeElement.blur();
    await new Promise(r => setTimeout(r, 500));
    const rest = getComputedStyle(document.querySelector('#eTitle'));
    document.querySelector('#eBody').focus();
    await new Promise(r => setTimeout(r, 500));
    const lit = getComputedStyle(document.querySelector('#eBody'));
    return {kinds: Object.keys(seals).length, seals: Object.values(seals).filter(Boolean).length,
      distinctPaintings: sizes.size,
      restInvisible: rest.backgroundColor === 'rgba(0, 0, 0, 0)' && rest.borderTopColor === 'rgba(0, 0, 0, 0)',
      focusVisible: lit.backgroundColor !== 'rgba(0, 0, 0, 0)' && lit.borderTopColor !== 'rgba(0, 0, 0, 0)'};
  });
  console.log('entry modal:', JSON.stringify(modal));
  await page.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

  /* 12. the close cross works on every modal and panel */
  const crosses = await page.evaluate(async () => {
    const out = {};
    const openers = {entry:"openEntryModal({type:'reflection'})", snapshot:"openSnapshotModal(()=>{})",
      ambient:"openAmbientMenu()", panel:"openPanel('<h2>x</h2>')", type:"openTypeMenu(()=>{})"};
    for(const [name, call] of Object.entries(openers)){
      document.querySelectorAll('.overlay,#panel,#panelOv').forEach(o => o.remove());
      try { eval(call); } catch(e){ out[name] = 'threw'; continue; }
      await new Promise(r => setTimeout(r, 600));   // a side panel slides in over 350ms
      const x = document.querySelector('.overlay .modal > .close') || document.querySelector('#panel > .close');
      if(!x){ out[name] = 'no cross'; continue; }
      const b = x.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width/2, b.y + b.height/2);
      if(hit !== x){ out[name] = 'covered by ' + (hit && (hit.className.baseVal ?? hit.className)); continue; }
      x.click(); await new Promise(r => setTimeout(r, 200));
      out[name] = (!document.querySelector('.overlay') && !document.querySelector('#panel')) ? 'ok' : 'did not close';
    }
    document.querySelectorAll('.overlay,#panel,#panelOv').forEach(o => o.remove());
    return out; });
  console.log('close crosses:', JSON.stringify(crosses));

  /* 13. every dropdown has a ground of its own */
  console.log('options grounded:', await page.evaluate(() =>
    [...document.querySelectorAll('select')].every(s => { const o = s.querySelector('option');
      return !o || getComputedStyle(o).backgroundColor !== 'rgba(0, 0, 0, 0)'; })));

  /* 14. mastery hangs an apple */
  await page.evaluate(() => { S.skills.forEach(s => s.currentLevel = 3); saveNow(); location.hash='#/skills'; rerender(); });
  await page.waitForTimeout(1500);
  console.log('apples:', JSON.stringify({
    groups: await page.evaluate(() => document.querySelectorAll('g.fruit').length),
    noBareCircles: await page.evaluate(() => !document.querySelector('circle.fruit')),
    parts: await page.evaluate(() => { const f = document.querySelector('g.fruit');
      return f ? [...f.children].map(c => c.getAttribute('class')) : []; }) }));

  /* 15. the Compass keeps every section, with the two charts first */
  await page.evaluate(() => { location.hash='#/compass'; rerender(); }); await page.waitForTimeout(1200);
  console.log('compass:', JSON.stringify({
    order: await page.evaluate(() => [...document.querySelectorAll('#main .page > *')].map(n => {
      const sc = n.querySelector('.sc'); return sc ? sc.textContent.trim() : n.className.split(' ')[0]; }).slice(0, 4)),
    keptFocus: await page.evaluate(() => document.body.textContent.includes("Today's focus")),
    keptPrompt: await page.evaluate(() => document.body.textContent.includes('Gentle prompt')),
    keptPosition: await page.evaluate(() => document.body.textContent.includes('Where am I right now')),
    keptHouse: await page.evaluate(() => !!document.querySelector('.house-wrap')),
    keptLongView: await page.evaluate(() => !!document.querySelector('.bento')) }));

  /* 16. planning a day takes more than one task */
  const multi = await page.evaluate(async () => {
    openTaskPicker(today()); await new Promise(r => setTimeout(r, 250));
    for(const t of ['alpha','beta','gamma']){
      const i = document.querySelector('#tpNew'); if(!i) return {closedAfter: t};
      i.value = t; i.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
      await new Promise(r => setTimeout(r, 200)); }
    const out = {stillOpen: !!document.querySelector('#tpNew'),
      focused: document.activeElement?.id, listed: document.querySelectorAll('#tpAdded li').length,
      saved: S.tasks.filter(t => ['alpha','beta','gamma'].includes(t.text)).length};
    document.querySelector('#tpDone')?.click();
    out.doneCloses = !document.querySelector('#tpNew');
    return out; });
  console.log('adding several tasks:', JSON.stringify(multi));

  /* 17. the Writing Studio sets its own type */
  console.log('studio type:', JSON.stringify(await page.evaluate(() => ({
    faces: WS_FACES.length, defaults: WS_TYPE_DEFAULT.face + ' ' + WS_TYPE_DEFAULT.size,
    varsEmitted: /--ws-face/.test(wsTypeVars()) && /--ws-size/.test(wsTypeVars()) }))));

  /* 18. no select anywhere still opens the browser's own popup */
  const sweep = await page.evaluate(async () => {
    const out = {checked: 0, native: []};
    for(const r of ['journals','finance','settings','skills','commonplace','people','projects','timeline','today']){
      location.hash = '#/' + r; await new Promise(x => setTimeout(x, 420));
      document.querySelectorAll('#main details').forEach(d => d.open = true);
      await new Promise(x => setTimeout(x, 180));
      const sels = [...document.querySelectorAll('#main select')];
      for(const s of sels){
        out.checked++;
        s.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true}));
        await new Promise(x => setTimeout(x, 90));
        if(!document.querySelector('.sm-pop')) out.native.push(r + ':' + (s.id || s.className));
        document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
        await new Promise(x => setTimeout(x, 40));
      }
    }
    return out; });
  console.log('select sweep:', JSON.stringify(sweep));

  /* 19. a picture actually shows through the card it is printed on */
  console.log('plate balance:', JSON.stringify(await page.evaluate(() => {
    const img = document.createElement('div'); img.className = 'rec-plate-img';
    const wash = document.createElement('div'); wash.className = 'rec-plate-wash';
    document.body.append(img, wash);
    const io = +getComputedStyle(img).opacity;
    const first = getComputedStyle(wash).backgroundImage.match(/0?\.\d+\)/);
    img.remove(); wash.remove();
    return {imageOpacity: io, imageVisibleEnough: io >= .5, washStart: first && first[0]};
  })));

  /* 20. the two icons say what their pages are, and are not each other */
  console.log('icons:', JSON.stringify(await page.evaluate(() => ({
    compassIsARose: /M12 2\.5 13\.6 10\.4/.test(NAV_ICONS.compass),
    compassUsedByCompass: NAV_PAGES.compass.ico === NAV_ICONS.compass,
    compassNotValues: NAV_ICONS.compass !== NAV_ICONS.values,
    projectsIsRoofs: /17\.5v-3/.test(NAV_ICONS.projects) }))));

  /* 21. the Library takes works it has never seen, and recommendations have a kind */
  console.log('library:', JSON.stringify(await page.evaluate(async () => {
    S.mediaLists = [{id:'lx', title:'A list', description:'', forWhom:'myself', personName:'', private:true, entries:[]}];
    openListAddModal(byId(S.mediaLists, 'lx')); await new Promise(r => setTimeout(r, 220));
    const kinds = document.querySelectorAll('[data-mlk]').length;
    document.querySelector('[data-mlk="film"]').click();
    document.querySelector('#mlNew').value = 'A film nobody logged';
    document.querySelector('#mlAddNew').click(); await new Promise(r => setTimeout(r, 180));
    const stayed = !!document.querySelector('#mlNew');
    const made = S.entries.filter(e => e.title === 'A film nobody logged').map(e => e.extra.kind)[0];
    document.querySelector('#mlDone').click(); await new Promise(r => setTimeout(r, 220));
    openRecModal(); await new Promise(r => setTimeout(r, 220));
    const recKinds = document.querySelectorAll('[data-rck]').length;
    document.querySelector('[data-rck="podcast"]').click();
    document.querySelector('#rcTitle').value = 'Something heard about';
    document.querySelector('#rcSave').click(); await new Promise(r => setTimeout(r, 220));
    const rec = S.mediaRecs.find(x => x.title === 'Something heard about');
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return {kindsOffered: kinds, dialogStayedOpen: stayed, newWorkKind: made,
      inList: byId(S.mediaLists, 'lx').entries.length, recKinds, recMedium: rec && rec.medium};
  })));

  console.log('ERRORS:', errors.length); errors.slice(0,8).forEach(e => console.log('  ' + e));
  await browser.close();
})();
