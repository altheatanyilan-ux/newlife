/* smoke148 — Today in compartments: the plan on its own line, the clock and
   the list side by side at exactly the same height, everything scrolling
   inside its own box, and one plain column again on a narrow screen */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const rects = () => {
  const r = id => { const e = document.getElementById(id); if(!e) return null;
    const b = e.getBoundingClientRect();
    return {t:Math.round(b.top), b:Math.round(b.bottom), l:Math.round(b.left), r:Math.round(b.right),
      h:Math.round(b.height), w:Math.round(b.width),
      scrolls: e.scrollHeight > e.clientHeight + 1, ch:e.clientHeight, sh:e.scrollHeight}; };
  return {focus:r('t-focus'), plan:r('t-plan'), tasks:r('t-tasks'), checkin:r('t-checkin'),
    habits:r('t-habits'), theatre:r('t-theatre'), still:r('t-still'),
    vh:innerHeight, hscroll: document.documentElement.scrollWidth > innerWidth + 1};
};

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const open = async (w, h, {many = true, sittings = false} = {}) => {
    const p = await b.newPage({viewport:{width:w, height:h}});
    p.on('pageerror', e => errs.push(`${w}x${h} pageerror: ` + e.message));
    p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push(`${w}x${h} console: ` + m.text()); });
    await p.goto(FILE); await p.waitForTimeout(1000);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2100); }
    await p.evaluate(() => { location.hash = '#/today'; rerender(); }); await p.waitForTimeout(1500);
    if(many){ await p.evaluate(() => { for(let i=0;i<18;i++)
      S.tasks.push(Object.assign(newTask('Task number ' + i, today()), {duration:20}));
      saveNow(); rerender(); }); await p.waitForTimeout(900); }
    if(sittings){ await p.evaluate(() => { const st = planState(); const T = today();
      st.focusSessions = st.focusSessions || [];
      for(let i=0;i<6;i++) st.focusSessions.push({id:'fs'+i, type:'focus', taskId:null, duration:25,
        startedAt:new Date(Date.parse(T+'T09:00:00') + i*3600000).toISOString(),
        endedAt:new Date(Date.parse(T+'T09:25:00') + i*3600000).toISOString(),
        note:'Wrote the second half of the chapter and cut two paragraphs from the first.'});
      saveNow(); rerender(); }); await p.waitForTimeout(900); }
    await p.evaluate(() => { ['t-plan','t-tasks','t-checkin','t-habits'].forEach(i => {
      const d = document.getElementById(i); if(d) d.open = true; }); });
    await p.waitForTimeout(600);
    return p;
  };

  console.log('\n1. the plan has a line to itself');
  let p = await open(1440, 900);
  let m = await p.evaluate(rects);
  yes('it spans the width the pair below it shares', m.plan.l <= m.focus.l + 2 && m.plan.r >= m.tasks.r - 2,
      `plan ${m.plan.l}-${m.plan.r}, pair ${m.focus.l}-${m.tasks.r}`);
  yes('  and stands above both of them', m.plan.b <= m.focus.t + 2 && m.plan.b <= m.tasks.t + 2);
  yes('  it is still a section you can fold', await p.evaluate(() => {
    const d = document.getElementById('t-plan'); const was = d.open;
    d.querySelector('summary').click(); const now = d.open; d.open = was; return was !== now; }));
  yes('  and folding it gives the room back rather than leaving a square',
      await p.evaluate(() => { const d = document.getElementById('t-plan');
        const openH = d.getBoundingClientRect().height;
        d.open = false; const shutH = d.getBoundingClientRect().height; d.open = true;
        return shutH < openH * 0.8 && shutH < 90; }));

  console.log('\n2. the clock and the list, side by side and the same height');
  yes('the list is to the right of the clock, not below it',
      m.tasks.l >= m.focus.r - 2, `focus ${m.focus.l}-${m.focus.r}, tasks ${m.tasks.l}-${m.tasks.r}`);
  is('  their tops are level', m.focus.t, m.tasks.t);
  is('  and so are their bottoms', m.focus.b, m.tasks.b);
  is('  which is to say they are exactly the same height', m.focus.h, m.tasks.h);
  const wF = m.focus.w, wT = m.tasks.w;
  yes('  neither column is a sliver', Math.min(wF, wT) / Math.max(wF, wT) > 0.8, `${wF} vs ${wT}`);
  yes('  and nothing runs off the side', !m.hscroll);

  console.log('\n3. a long list scrolls inside its own compartment');
  const sc = await p.evaluate(() => { const t = document.getElementById('t-tasks');
    return {rows:document.querySelectorAll('#t-tasks .task-row').length,
      scrolls:t.scrollHeight > t.clientHeight + 1, client:t.clientHeight, full:t.scrollHeight}; });
  yes('there are more rows than fit', sc.rows >= 20, `${sc.rows} rows`);
  yes('  the compartment scrolls rather than growing', sc.scrolls, `${sc.client} of ${sc.full}`);
  /* the page below it did not move because the list got longer */
  const below = await p.evaluate(() => {
    const c = document.getElementById('t-checkin').getBoundingClientRect().top;
    document.getElementById('t-tasks').scrollTop = 400;
    return {c: Math.round(c), after: Math.round(document.getElementById('t-checkin').getBoundingClientRect().top)}; });
  is('  and the section under it does not move when it does', below.after, below.c);
  const stuck = await p.evaluate(() => {
    const t = document.getElementById('t-tasks'), s = t.querySelector('summary');
    t.scrollTop = 0; const before = Math.round(s.getBoundingClientRect().top);
    t.scrollTop = 300;
    return {before, after: Math.round(s.getBoundingClientRect().top), moved: t.scrollTop}; });
  yes('  its heading is pinned while the rows go by', stuck.moved > 0 && stuck.after === stuck.before,
      `${stuck.before} → ${stuck.after}`);
  yes('  and nothing shows through the heading', await p.evaluate(() => {
    const s = document.getElementById('t-tasks').querySelector('summary');
    const bg = getComputedStyle(s).backgroundColor;
    const a = bg.startsWith('rgba') ? parseFloat(bg.split(',')[3]) : 1;
    return bg !== 'rgba(0, 0, 0, 0)' && a === 1; }), await p.evaluate(() =>
      getComputedStyle(document.getElementById('t-tasks').querySelector('summary')).backgroundColor));
  await p.close();

  console.log('\n4. the clock scrolls too, so the sittings can be read');
  /* this is the whole point of the redesign: the ledger of what the sittings
     went on sits below the clock face and used to be unreachable */
  p = await open(1440, 900, {many:false, sittings:true});
  const led = await p.evaluate(() => {
    const f = document.getElementById('t-focus'), log = f.querySelector('.fl-wrap');
    if(!log) return {found:false};
    log.open = true;
    const box = f.getBoundingClientRect();
    /* opened, the ledger runs off the bottom of its box — which is exactly
       the state in which it used to be unreachable */
    const outOfSight = log.getBoundingClientRect().bottom > box.bottom + 20;
    f.scrollTop = f.scrollHeight;
    const seen = log.getBoundingClientRect();
    const head = f.querySelector('.fp-head').getBoundingClientRect();
    return {found:true, outOfSight, moved: f.scrollTop,
      /* a real scroller, not an element quietly spilling past its own edge */
      scrolls: getComputedStyle(f).overflowY === 'auto' && f.scrollHeight > f.clientHeight + 1,
      /* the whole of it, ending inside the box — not merely overlapping it */
      inSight: seen.bottom <= box.bottom + 2 && seen.bottom > box.top,
      headPinned: Math.round(head.top) <= Math.round(box.top) + 3,
      rows: f.querySelectorAll('.fl-row').length}; });
  yes('the ledger of the day\'s sittings is there', led.found && led.rows === 6, `${led.rows} sittings`);
  yes('  opened, it runs off the bottom of its box', led.outOfSight);
  yes('  the box scrolls', led.scrolls);
  yes('  and scrolling it brings the whole ledger into view', led.inSight && led.moved > 0,
      `scrolled ${led.moved}`);
  yes('  with the Focus heading still pinned to the top', led.headPinned);
  await p.close();

  console.log('\n5. the reflective half goes in pairs');
  p = await open(1440, 900, {many:false});
  m = await p.evaluate(rects);
  yes('the check-in and the habits share a row', m.habits.l >= m.checkin.r - 2);
  is('  and are the same height as each other', m.checkin.h, m.habits.h);
  yes('  the theatre and the stillness share the next', m.still.l >= m.theatre.r - 2);
  yes('  and the pairs are stacked, not interleaved', m.theatre.t >= m.checkin.t);
  is('the index offers them in the order the page has them',
     await p.evaluate(() => [...document.querySelectorAll('[data-jump]')].map(n => n.dataset.jump).join(',')),
     't-plan,t-focus,t-tasks,t-checkin,t-habits,t-theatre,t-still,t-tonight');
  await p.close();

  console.log('\n6. a narrow screen is the plain single column it always was');
  p = await open(880, 1100, {many:true});
  m = await p.evaluate(rects);
  is('the clock and the list share a left edge', m.tasks.l, m.focus.l);
  yes('  the plan is above them both', m.plan.b <= m.focus.t + 2);
  yes('  the clock is above the list', m.focus.b <= m.tasks.t + 2);
  yes('  the pairs stack too', m.habits.t >= m.checkin.b - 2 && m.still.t >= m.theatre.b - 2);
  yes('  nothing runs off the side', !m.hscroll);
  yes('  nothing is trapped in a scroller', !m.tasks.scrolls && !m.focus.scrolls,
      `tasks ${m.tasks.ch}/${m.tasks.sh}, focus ${m.focus.ch}/${m.focus.sh}`);
  yes('  and the compartment frames are gone', await p.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('t-tasks'));
    return cs.borderTopWidth === '0px' && cs.paddingLeft === '0px'; }));
  await p.close();

  console.log('\n7. the day\'s own grid does not disturb the Review dashboard');
  /* .bento is the Review tab's twelve-column grid; the day's boxes are .daybox,
     and the two must not read each other's rules */
  p = await b.newPage({viewport:{width:1440, height:900}});
  p.on('pageerror', e => errs.push('review pageerror: ' + e.message));
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2100); }
  await p.evaluate(() => { location.hash = '#/journals/review'; rerender(); }); await p.waitForTimeout(1800);
  const cols = await p.evaluate(() => { const n = document.querySelector('.rv-dash .bento');
    return n ? getComputedStyle(n).gridTemplateColumns.split(' ').length : -1; });
  is('the Review grid still has its twelve columns', cols, 12);
  is('  and Today\'s boxes are not among them',
     await p.evaluate(() => document.querySelectorAll('.rv-dash .daybox').length), 0);
  await p.close();

  console.log('\n8. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke148  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
