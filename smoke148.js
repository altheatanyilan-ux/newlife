/* smoke148 — Today, one room at a time: every section on a line of its own
   and about a screenful tall, scrolling inside its own rectangle, with the
   index pinned clear of the chrome so it is the way between them — and one
   plain column again on a narrow screen */
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
  return {plan:r('t-plan'), focus:r('t-focus'), tasks:r('t-tasks'), habits:r('t-habits'),
    tonight:r('t-tonight'), checkin:r('t-checkin'), theatre:r('t-theatre'), still:r('t-still'),
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
      for(let i=0;i<14;i++) st.focusSessions.push({id:'fs'+i, type:'focus', taskId:null, duration:25,
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
  yes('it spans the same width as the sections under it',
      m.plan.l === m.tasks.l && m.plan.r === m.tasks.r,
      `plan ${m.plan.l}-${m.plan.r}, tasks ${m.tasks.l}-${m.tasks.r}`);
  yes('  and stands above them', m.plan.b <= m.tasks.t + 2);
  yes('  it is still a section you can fold', await p.evaluate(() => {
    const d = document.getElementById('t-plan'); const was = d.open;
    d.querySelector('summary').click(); const now = d.open; d.open = was; return was !== now; }));
  yes('  and folding it gives the room back rather than leaving an empty screenful',
      await p.evaluate(() => { const d = document.getElementById('t-plan');
        const openH = d.getBoundingClientRect().height;
        d.open = false; const shutH = d.getBoundingClientRect().height; d.open = true;
        return shutH < openH * 0.8 && shutH < 90; }));

  console.log('\n2. every section has a line of its own, about a screenful tall');
  /* The dial is no longer one of these — it is in the foot of the sidebar —
     but everything it cannot say still is. And the day is two views, one at a
     time, doing it and looking at it, so the sections on screen together are
     the ones Execution carries. */
  const secs = ['plan','focus','tasks','habits','tonight'];
  yes('nothing shares a line with anything else', secs.every((k, i) =>
    i === 0 || m[k].t >= m[secs[i-1]].b - 2), secs.map(k => `${k} ${m[k].t}-${m[k].b}`).join(', '));
  yes('  they all use the whole width', secs.every(k => m[k].w === m.plan.w),
      secs.map(k => `${k} ${m[k].w}`).join(', '));
  /* a screenful is the ceiling: nothing is taller than one, and anything
     with more in it than that is exactly one and scrolls inside it */
  yes('  none is taller than a screenful', secs.every(k => m[k].h <= m.vh),
      secs.map(k => `${k} ${m[k].h}`).join(', ') + ` of ${m.vh}`);
  yes('  and the full ones are a screenful, near enough',
      secs.filter(k => m[k].scrolls).length > 0 &&
      secs.filter(k => m[k].scrolls).every(k => m[k].h > m.vh * 0.82),
      secs.filter(k => m[k].scrolls).map(k => `${k} ${m[k].h}`).join(', ') || 'none scrolls');
  yes('  a short one takes only the room it needs',
      m.plan.h < m.vh * 0.5, `plan ${m.plan.h} of ${m.vh}`);
  yes('  nothing runs off the side', !m.hscroll);

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

  console.log('\n4. a task\'s name has the line to itself');
  /* eight controls used to share the line with the name, several of them
     invisible until the row is hovered — and an invisible button still takes
     its width, so in half a compartment the name was left about seventy
     pixels of it */
  p = await open(1280, 900, {many:false});
  await p.evaluate(() => {
    const t = newTask('Reply to opposing counsel about the discovery schedule', today());
    t.duration = 60;
    t.subtasks = [{id:'sx1', title:'Read their motion', isCompleted:false, minutes:20}];
    S.tasks.push(t); saveNow(); rerender(); });
  await p.waitForTimeout(800);
  /* a task with steps shows them without being asked */
  await p.evaluate(() => { const d = document.getElementById('t-tasks'); if(d) d.open = true; });
  await p.waitForTimeout(500);
  const rw = await p.evaluate(() => {
    const row = [...document.querySelectorAll('#t-tasks .task-row')]
      .find(r => /opposing counsel/.test(r.textContent));
    if(!row) return {found:false};
    const name = row.querySelector('.task-text'), tools = row.querySelector('.task-tools');
    const nb = name.getBoundingClientRect(), rb = row.getBoundingClientRect();
    const sub = document.querySelector('#t-tasks .sub-row');
    const st = sub && sub.querySelector('.sub-text'), se = sub && sub.querySelector('.est-wrap');
    return {found:true,
      share: nb.width / rb.width,
      clipped: name.scrollWidth > name.clientWidth + 1,
      toolsBelow: tools ? Math.round(tools.getBoundingClientRect().top) >= Math.round(nb.bottom) - 1 : null,
      buttonsInTools: tools ? tools.querySelectorAll('button,a').length : 0,
      /* the tick and the disclosure caret stay with the name — they are how
         you read the row, not the cluster that was squeezing it */
      besideName: [...row.children].filter(n => n.matches('button,a')
        && !n.matches('.task-check,.task-caret,.task-grip')).length,
      /* a step keeps its one button on the line with its name */
      tickBeside: !!row.querySelector(':scope > .task-check') && !!row.querySelector(':scope > .task-caret'),
      stepFound: !!sub, stepTwoLine: !!(sub && sub.querySelector('.task-tools')),
      stepInline: !!(st && se && Math.abs(st.getBoundingClientRect().top - se.getBoundingClientRect().top) < 12)}; });
  yes('the task is on the page', rw.found);
  yes('  its name gets most of the row\'s width', rw.share > 0.6, `${Math.round(rw.share*100)}%`);
  yes('  and is not cut off', !rw.clipped);
  yes('  the controls are on the line under it', rw.toolsBelow);
  yes('  all of them', rw.buttonsInTools >= 4, `${rw.buttonsInTools} in the tool line`);
  is('  and none of them left beside the name', rw.besideName, 0);
  yes('  the tick and the caret do stay with it', rw.tickBeside);
  yes('a step is left alone: one button, on the line with its name',
      rw.stepFound && !rw.stepTwoLine && rw.stepInline,
      `found ${rw.stepFound}, two-line ${rw.stepTwoLine}, inline ${rw.stepInline}`);
  await p.close();

  /* Section 5 was about the ledger of the day's sittings running off the
     bottom of the clock's box and being unreachable. The box is a section of
     the page again, so it scrolls with the page and there is nothing to
     unreach. What is worth pinning now is where the dial went. */

  console.log('\n5. the dial is beside the page rather than a part of it');
  /* this is the whole point of the redesign: the ledger of what the sittings
     went on sits below the clock face and used to be unreachable */
  p = await open(1440, 900, {many:false, sittings:true});
  const clk = await p.evaluate(() => {
    const d = document.getElementById('focusDock'); if(!d) return {found:false};
    const cs = getComputedStyle(d), r = d.getBoundingClientRect();
    return {found:true, fixed: cs.position === 'fixed', inMain: !!document.querySelector('#main #focusDock'),
      shut: focusDockShut(), w: Math.round(r.width), h: Math.round(r.height),
      bottom: Math.round(innerHeight - r.bottom), left: Math.round(r.left),
      right: Math.round(r.right),
      sidebar: Math.round(document.querySelector('.sidebar').getBoundingClientRect().right),
      hands: ['.fc-hour', '.fc-min', '.fc-sec'].every(x => !!d.querySelector(x)),
      section: !!document.getElementById('t-focus')}; });
  yes('the dial is on the page', clk.found);
  yes('  with all three of its hands', clk.hands);
  yes('  fixed to the window, not laid out in the page', clk.fixed && !clk.inMain);
  yes('  while the words about the sitting are a section of Today', clk.section);
  /* it stands in the foot of the sidebar and takes its shape from it: open
     beside the room names, a circle beside their icons */
  yes('  in the bottom corner', clk.bottom <= 26, String(clk.bottom));
  yes('  inside the sidebar rather than over the page', clk.left <= 1 && clk.right <= clk.sidebar + 1,
      `${clk.left}–${clk.right} vs sidebar ${clk.sidebar}`);
  await p.close();

  console.log('\n6. the index is pinned, and it is the way between the rooms');
  p = await open(1440, 900, {many:true});
  is('it offers the sections in the order the page has them',
     await p.evaluate(() => [...document.querySelectorAll('[data-jump]')].map(n => n.dataset.jump).join(',')),
     't-plan,t-focus,t-tasks,t-habits,t-tonight');
  await p.evaluate(() => document.querySelector('[data-jump="t-tasks"]').click());
  await p.waitForTimeout(1300);
  const nav = await p.evaluate(() => {
    const bar = document.querySelector('.today-jump').getBoundingClientRect();
    const t = document.getElementById('t-tasks').getBoundingClientRect();
    /* The chrome at the top of the page is fixed, not scrolled: the top bar
       sits at top:14 and the Back pill, when it is showing, at top:16 and
       about 33 tall. At top:0 the strip went under them and lost its first
       button, so it has to stick below all of that — which is a statement
       about where the strip is, and true whether or not the pill is up. */
    return {scrolled: window.scrollY,
      barTop: Math.round(bar.top), barBottom: Math.round(bar.bottom),
      pinned: Math.round(bar.top) > 0 && Math.round(bar.bottom) <= innerHeight,
      clearOfTheChrome: Math.round(bar.top) >= 50,
      landsUnderIt: Math.round(t.top) >= Math.round(bar.bottom) - 2,
      andFitsBelow: Math.round(t.bottom) <= innerHeight + 2,
      vh: innerHeight}; });
  yes('a jump moves the page', nav.scrolled > 100, `scrolled ${nav.scrolled}`);
  yes('  the strip is still on screen after it', nav.pinned, `${nav.barTop}–${nav.barBottom}`);
  yes('  and clear of the chrome fixed above it', nav.clearOfTheChrome, `top ${nav.barTop}`);
  yes('  the section lands under the strip, not behind it', nav.landsUnderIt);
  yes('  and fills the screen from there down', nav.andFitsBelow,
      `bottom vs ${nav.vh}`);
  await p.close();

  console.log('\n7. a narrow screen is the plain single column it always was');
  p = await open(880, 1100, {many:true});
  m = await p.evaluate(rects);
  is('the plan and the list share a left edge', m.tasks.l, m.plan.l);
  yes('  the plan is above them both', m.plan.b <= m.focus.t + 2 && m.plan.b <= m.tasks.t + 2);
  yes('  the sitting is above the list', m.focus.b <= m.tasks.t + 2);
  yes('  everything else stacks too', m.habits.t >= m.tasks.b - 2 && m.tonight.t >= m.habits.b - 2);
  yes('  a section is as tall as it needs to be, not a screenful',
      m.tasks.h > m.vh * 0.9, `tasks ${m.tasks.h} of ${m.vh}`);
  yes('  nothing runs off the side', !m.hscroll);
  yes('  nothing is trapped in a scroller', !m.tasks.scrolls && !m.focus.scrolls,
      `tasks ${m.tasks.ch}/${m.tasks.sh}, focus ${m.focus.ch}/${m.focus.sh}`);
  yes('  and the compartment frames are gone', await p.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('t-tasks'));
    return cs.borderTopWidth === '0px' && cs.paddingLeft === '0px'; }));
  await p.close();

  console.log('\n8. the day\'s own grid does not disturb the Review dashboard');
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

  console.log('\n9. quiet');
  is('no errors on the console', errs.length, 0, errs.join(' | '));
  if(errs.length) errs.forEach(e => console.log('    ' + e));

  console.log(bad ? `\n${bad} FAILED` : '\nsmoke148  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
