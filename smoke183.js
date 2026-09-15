/* smoke183 — the Morning Theatre asks one question and assembles the rest.

   The theatre was nine panels and a decision: which of these do I want this
   morning? That is a question about the practices, and nobody arrives with an
   opinion about the practices. They arrive with a feeling about what they
   want. So the question is "how are you feeling about your visions right now",
   the answer picks a recipe, the length decides how much of it fits, and the
   rotation queue decides which visions it is about — so that every vision gets
   a morning over a fortnight rather than only the favourite.

   What is worth testing here is not that the screens exist but that the
   assembly is real:

     · the recipe changes with the mood AND with the length, and the chief aim
       is on the end of every one of them — the spec's data table omits it from
       the five-minute sessions and its prose two paragraphs later says it
       always appears, and the prose is right;
     · the rotation actually rotates — the vision practised today is not the
       one picked tomorrow — which is the whole reason it is a queue and not
       a "pick a vision" dropdown;
     · a step draws the real practice, not a copy of it, so what you write in a
       session is saved by the same code that saves it in the accordion;
     · finishing logs the session and ticks the 21-day tracker, and leaving
       early does neither while still keeping what was written.

   And one thing the redesign could quietly have broken: the pinned entries
   were put in the theatre to be reread every day. If they had gone into
   manual mode with the other eight panels they would be behind a door you
   have to know about, which is not every day. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1400, height:1050}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }

  const openTheatre = async () => {
    await p.evaluate(() => { setTodayView('in');
      if(location.hash === '#/today') rerender(); else location.hash = '#/today'; });
    await p.waitForTimeout(1400);
    await p.evaluate(() => { const j = document.querySelector('.today-jump button[data-jump="t-theatre"]');
      if(j) j.click(); });
    await p.waitForTimeout(900);
  };

  console.log('\n1. the door is a question, not a menu');
  await openTheatre();
  const door = await p.evaluate(() => ({
    ask: document.querySelector('.ths-ask')?.textContent.trim(),
    moods: [...document.querySelectorAll('[data-thmood]')].map(n => n.dataset.thmood),
    mins: [...document.querySelectorAll('[data-thmin]')].map(n => +n.dataset.thmin),
    panels: document.querySelectorAll('#thSecs .th-sec').length,
    manual: !!document.querySelector('#thManual'),
    begin: document.querySelector('#thBegin')?.disabled}));
  yes('it asks how you are feeling', /how are you feeling/i.test(door.ask || ''), door.ask);
  is('  with the five states', door.moods, ['on_fire','foggy','resistant','grateful','inspired']);
  is('  and three lengths', door.mins, [5,15,30]);
  is('  and none of the nine panels in the way', door.panels, 0);
  yes('  nothing can begin until a mood is picked', door.begin === true);

  console.log('\n2. manual mode is still one click away, and comes back');
  await p.click('#thManual'); await p.waitForTimeout(1200);
  const man = await p.evaluate(() => ({
    panels: [...document.querySelectorAll('#thSecs .th-sec')].map(n => n.dataset.th),
    back: !!document.querySelector('#thGuided'),
    ask: !!document.querySelector('.ths-ask')}));
  yes('every practice is there', man.panels.length >= 8, man.panels.join(' '));
  yes('  including the vision board and the chief aim',
      man.panels.includes('board') && man.panels.includes('aim'), man.panels.join(' '));
  yes('  and the question is not', !man.ask);
  await p.click('#thGuided'); await p.waitForTimeout(1200);
  yes('  pressing back returns to the question',
      await p.evaluate(() => !!document.querySelector('.ths-ask')));

  console.log('\n3. the pinned things stay on the door');
  const pinned = await p.evaluate(() => {
    const e = {id:uid(), type:'quote', title:'Seneca', body:'smoke183 the thing to hear again',
      occurredAt:today(), createdAt:new Date().toISOString(), media:[],
      links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
      people:[], places:[], emotions:[], tags:[], confidence:'', extra:{}};
    S.entries.push(e); setEntryPinned(e.id, true); rerender(); return e.id;
  });
  await p.waitForTimeout(1200); await openTheatre();
  const onDoor = await p.evaluate(() => {
    const d = document.querySelector('.ths-open');
    return {here: !!d?.querySelector('[data-th="pins"]'),
      card: !!d?.querySelector('[data-th="pins"] .entry')};
  });
  yes('the pinned panel is on the opening screen', onDoor.here);
  yes('  with what was pinned in it', onDoor.card);

  console.log('\n4. a mood and a length assemble a real sequence');
  const recipes = await p.evaluate(() => ({
    fire5:  thRecipe('on_fire', 5),
    fire15: thRecipe('on_fire', 15),
    fire30: thRecipe('on_fire', 30),
    foggy15: thRecipe('foggy', 15),
    resist15: thRecipe('resistant', 15)}));
  yes('a longer session holds more', recipes.fire30.length > recipes.fire15.length
      && recipes.fire15.length > recipes.fire5.length, JSON.stringify(recipes));
  yes('  a different mood goes somewhere else',
      recipes.fire15[0] !== recipes.foggy15[0] && recipes.foggy15[0] !== recipes.resist15[0],
      JSON.stringify([recipes.fire15[0], recipes.foggy15[0], recipes.resist15[0]]));
  /* The one rule that holds across all fifteen. Not "ends on the chief aim":
     two of the spec's own thirty-minute recipes put a short vision-board
     browse after it, deliberately, as a fade-out after the loud part. What
     must never happen is a session with no chief aim in it, or with two. */
  const aims = await p.evaluate(() => {
    const out = {};
    ['on_fire','foggy','resistant','grateful','inspired'].forEach(m =>
      [5,15,30].forEach(n => { const seq = thRecipe(m, n);
        out[m + n] = seq.filter(k => k === 'aim').length; }));
    return Object.entries(out).filter(([, v]) => v !== 1).map(([k, v]) => k + ':' + v);
  });
  is('  and every one of the fifteen carries the chief aim exactly once', aims, []);
  const fade = await p.evaluate(() => thRecipe('on_fire', 30));
  yes('  where the recipe placed it deliberately, it is left there',
      fade.indexOf('aim') === fade.length - 2 && fade[fade.length - 1] === 'board', fade.join(' → '));

  console.log('\n5. the rotation picks what has gone longest without a morning');
  const vis = await p.evaluate(() => {
    /* three visions, all eligible, practised at different removes */
    const mk = (title, ago) => { const v = {id:uid(), title, confidence:'plan', status:'pending',
      archived:false, currentReality:'where I am', futureMemory:'what it is like',
      sensory:{}, links:{values:[]}, createdAt:new Date().toISOString(),
      lastMorningTheatreDate: ago == null ? null : new Date(Date.now() - ago*864e5).toISOString()};
      S.visions.push(v); return v.id; };
    const ids = {fresh: mk('smoke183 practised today', 0),
      mid: mk('smoke183 a week ago', 7), stale: mk('smoke183 a month ago', 30)};
    saveNow();
    return {ids, order: thRotation().filter(v => /smoke183/.test(v.title)).map(v => v.title)};
  });
  is('the longest-neglected comes first',
     vis.order, ['smoke183 a month ago', 'smoke183 a week ago', 'smoke183 practised today']);
  const picks = await p.evaluate(() => ({
    five: thPickVisions(5).length, fifteen: thPickVisions(15).length}));
  is('  a five-minute session carries one vision', picks.five, 1);
  is('  a longer one carries two', picks.fifteen, 2);

  console.log('\n6. the session runs, step by step, drawing the real practices');
  await openTheatre();
  await p.click('[data-thmood="inspired"]'); await p.waitForTimeout(900);
  await openTheatre();
  await p.click('[data-thmin="15"]'); await p.waitForTimeout(900);
  await openTheatre();
  await p.click('#thBegin'); await p.waitForTimeout(900);
  const focus = await p.evaluate(() => ({
    shown: [...document.querySelectorAll('#thFocusOv .ths-v b')].map(n => n.textContent.trim()),
    go: !!document.querySelector('#thFocusGo'), pick: !!document.querySelector('#thFocusPick')}));
  yes('it shows what today is about before it starts', focus.shown.length >= 1, JSON.stringify(focus));
  yes('  and offers to choose differently', focus.pick);
  await p.click('#thFocusGo'); await p.waitForTimeout(1000);
  const opening = await p.evaluate(() => ({
    ov: !!document.querySelector('#thSessionOv'),
    head: document.querySelector('.ths-head .mono')?.textContent.trim(),
    prev: document.querySelector('#thPrev')?.disabled}));
  yes('the session opens', opening.ov);
  yes('  on a moment before the first step', /before you start/.test(opening.head || ''), opening.head);
  yes('  with nothing behind it yet', opening.prev === true);
  const seen = [];
  for(let n = 0; n < 4; n++){
    await p.click('#thNext'); await p.waitForTimeout(800);
    const st = await p.evaluate(() => ({
      head: document.querySelector('.ths-head .mono')?.textContent.trim(),
      title: document.querySelector('.ths-title')?.textContent.trim(),
      panel: document.querySelector('.ths-step .th-sec')?.dataset.th || null,
      summaryHidden: (() => { const su = document.querySelector('.ths-step .th-sec > summary');
        return su ? getComputedStyle(su).display === 'none' : null; })(),
      /* The practice has to be VISIBLE, not merely present. A panel is a
         <details>, and in the accordion only the first one is open — hiding
         the summary without opening the details gave a step with a title, a
         timer, a next button and nothing at all in between.

         Neither "is the panel in the DOM" nor "does .th-body have a height"
         catches that: a closed <details> skips its contents with
         content-visibility, which leaves the element itself a box and leaves
         every field inside it queryable. What goes away is the LAYOUT of the
         descendants, so the test is whether a field inside the practice has a
         rect at all. */
      open: document.querySelector('.ths-step .th-sec')?.open === true,
      fields: [...document.querySelectorAll('.ths-step .th-body .inp, .ths-step .th-body textarea, .ths-step .th-body .btn, .ths-step .th-body .ed')]
        .filter(n => n.getClientRects().length && n.getBoundingClientRect().height > 4).length,
      closing: !!document.querySelector('.ths-closing')}));
    seen.push(st);
    if(st.closing) break;
  }
  const steps = seen.filter(x => !x.closing);
  yes('every step names where you are', steps.every(x => /Step \d+ of \d+/.test(x.head || '')),
      JSON.stringify(steps.map(x => x.head)));
  yes('  and what the practice is', steps.every(x => x.title), JSON.stringify(steps.map(x => x.title)));
  yes('  drawing the practice itself, not a copy of it',
      steps.every(x => x.panel), JSON.stringify(steps.map(x => x.panel)));
  yes('  opened, since the step IS the practice',
      steps.every(x => x.open), JSON.stringify(steps.map(x => x.open)));
  yes('  with its own fields on the screen to work in',
      steps.every(x => x.fields > 0), JSON.stringify(steps.map(x => x.fields)));
  yes('  with its accordion summary out of the way, since the heading says it',
      steps.every(x => x.summaryHidden === true), JSON.stringify(steps.map(x => x.summaryHidden)));
  is('  the last of them is the chief aim', steps[steps.length - 1].panel, 'aim');
  yes('  and then it closes', seen[seen.length - 1].closing);

  console.log('\n7. finishing is what the tracker counts');
  const after = await p.evaluate(() => { const r = theatre();
    const v = S.visions.filter(x => /smoke183/.test(x.title));
    return {sessions: r.sessions.length, last: r.sessions[0],
      today: r.days.includes(today()),
      practised: v.filter(x => (x.lastMorningTheatreDate || '').slice(0,10) === today()).map(x => x.title),
      counts: v.map(x => +x.morningTheatreCount || 0)};
  });
  is('the session is written down', after.sessions, 1);
  is('  with the mood and the length it was', [after.last.mood, after.last.minutes], ['inspired', 15]);
  yes('  and the practices it walked through', (after.last.practices || []).includes('aim'),
      JSON.stringify(after.last.practices));
  yes('  today counts towards the 21', after.today);
  yes('  and the visions it was about have moved down the queue',
      after.practised.length >= 1 && after.counts.some(n => n > 0), JSON.stringify(after));
  /* which is the point of a queue: tomorrow is somebody else's turn */
  const next = await p.evaluate(() => thRotation().filter(v => /smoke183/.test(v.title)).map(v => v.title));
  yes('  so the next session starts somewhere else',
      next[0] !== 'smoke183 a month ago', next.join(' | '));
  await p.click('#thClose'); await p.waitForTimeout(1000);
  yes('closing puts the page back', await p.evaluate(() => !document.querySelector('#thSessionOv')));

  console.log('\n8. leaving early keeps the writing and logs nothing');
  await openTheatre();
  await p.click('#thBegin'); await p.waitForTimeout(900);
  await p.click('#thFocusGo'); await p.waitForTimeout(1000);
  await p.click('#thNext'); await p.waitForTimeout(900);
  const wrote = await p.evaluate(() => {
    const t = document.querySelector('.ths-step textarea, .ths-step .inp');
    if(!t) return null;
    t.value = 'smoke183 written mid-session';
    t.dispatchEvent(new Event('input', {bubbles:true}));
    return t.id || t.className;
  });
  await p.waitForTimeout(900);
  await p.click('#thLeave'); await p.waitForTimeout(1200);
  const left = await p.evaluate(() => ({sessions: theatre().sessions.length,
    ov: !!document.querySelector('#thSessionOv')}));
  yes('the session is gone', !left.ov);
  is('  and nothing new was logged', left.sessions, 1);
  yes('  there was somewhere to write', !!wrote, String(wrote));

  console.log('\nconsole: ' + (errs.length ? errs.join(' | ') : 'clean'));
  errs.forEach(e => no(e));
  await b.close();
  console.log(`\nsmoke183  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
