/* smoke133 — the renames, the removed diagram, and milestones that can be read */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1500, height:1300}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const go = async h => { await p.evaluate(x => { location.hash = x; rerender(); }, h); await p.waitForTimeout(1400); };

  console.log('\n1. the rooms are called what they are called');
  const labels = await p.$$eval('#nav [data-page]', n => n.map(x => x.textContent.trim()));
  yes('the sidebar says Lived Record', labels.some(l => /Lived Record/.test(l)), labels.join(' | '));
  yes('  and not Journals', !labels.some(l => l === 'Journals'), labels.join(' | '));
  yes('the sidebar says Content Studio', labels.some(l => /Content Studio/.test(l)), labels.join(' | '));
  await go('#/content');
  is('and the Content page names itself', await p.evaluate(() =>
    document.querySelector('#main h1')?.textContent.trim()), 'Content Studio');

  console.log('\n2. under Lived Record, the banner names the view you are in');
  for(const [route, want] of [['#/journals', 'Journals'], ['#/journals/timeline', 'Timeline'], ['#/journals/library', 'Library']]){
    await go(route);
    is(`${route} says "${want}"`, await p.evaluate(() => document.querySelector('#main h1')?.textContent.trim()), want);
  }

  console.log('\n3. the Compass has no house diagram');
  await go('#/compass');
  yes('the diagram is gone', !(await p.$('#houseWrap')));
  yes('  and nothing is left hanging where it was', !(await p.$('.house-wrap, .hnode, #htip')));
  yes('  the rest of the Compass still draws', await p.evaluate(() =>
    document.querySelectorAll('#main .section').length > 3));

  console.log('\n4. milestones close together can all be read');
  const lid = await p.evaluate(() => {
    const l = planState().lists.find(x => x.id !== 'inbox');
    l.milestones = [];
    /* four within a week is the case that used to put the third name straight
       under the first, because the old rule only alternated pairwise */
    [['Draft due', 2],['Review with counsel', 4],['Filing deadline', 5],['Hearing', 7],
     ['Decision expected', 40],['Appeal window closes', 74]]
      .forEach(([name, off]) => planAddMilestone(l.id, {name, date: addDays(today(), off)}));
    saveNow(); return l.id;
  });
  await p.evaluate(l => { S._planSel = {kind:'list', id:l}; location.hash = '#/planning'; rerender(); }, lid);
  await p.waitForTimeout(1600);
  const boxes = await p.$$eval('.pl-mspin', ns => ns.map(n => { const r = n.getBoundingClientRect();
    return {name: n.querySelector('.pl-mslabel').textContent.trim(),
      x: r.left, y: r.top, w: r.width, h: r.height}; }));
  is('all six are drawn', boxes.length, 6);
  let clash = [];
  for(let i = 0; i < boxes.length; i++) for(let j = i+1; j < boxes.length; j++){
    const a = boxes[i], c = boxes[j];
    const ox = Math.min(a.x+a.w, c.x+c.w) - Math.max(a.x, c.x);
    const oy = Math.min(a.y+a.h, c.y+c.h) - Math.max(a.y, c.y);
    if(ox > 4 && oy > 4) clash.push(`${a.name} × ${c.name}`);
  }
  is('and none of them sits on another', clash.length, 0);
  if(clash.length) console.log('      ' + clash.join(', '));
  yes('  the cluster fans both above and below the line', await p.evaluate(() =>
    document.querySelectorAll('.pl-mspin.up').length > 0 &&
    document.querySelectorAll('.pl-mspin:not(.up)').length > 0));
  yes('  every one still says how far away it is', await p.evaluate(() =>
    document.querySelectorAll('.pl-msaway').length === 6));
  /* the strip is only as tall as it needs to be */
  const tall = await p.evaluate(() => document.querySelector('.pl-msline').getBoundingClientRect().height);
  yes('  and the strip is sized to what it holds', tall > 100 && tall < 340, `${Math.round(tall)}px`);
  const before = tall;
  await p.evaluate(l => { const x = planList(l); x.milestones = x.milestones.slice(0, 2);
    x.milestones[1].date = addDays(today(), 40); saveNow(); rerender(); }, lid);
  await p.waitForTimeout(1200);
  const short = await p.evaluate(() => document.querySelector('.pl-msline').getBoundingClientRect().height);
  yes('  two well-spaced dates need less room than six crowded ones', short < before, `${Math.round(short)} vs ${Math.round(before)}`);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke133  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
