/* smoke140 — the skill tree is a cherry in flower: petals with the cleft that
   names the species, stamens, cherry leaves, bark with lenticels, and grass
   and orchids growing at its foot */
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
  const p = await b.newPage({viewport:{width:1500, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const draw = async () => { await p.evaluate(() => { if(location.hash === '#/skills') rerender(); else location.hash = '#/skills'; });
    await p.waitForTimeout(2400); await p.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove())); };
  await p.evaluate(() => { S.skills.forEach(s => { s.planned = false; s.currentLevel = skillLevelCount(s); }); saveNow(); });
  await draw();

  console.log('\n1. the flower is a cherry flower');
  /* the cleft at the tip is the whole difference between a cherry petal and a
     rounded blob, and it lives in the middle of the petal path */
  const petal = await p.evaluate(() => { const g = document.querySelector('.blossom');
    const paths = [...g.querySelectorAll('path')].map(x => x.getAttribute('d'));
    return paths.find(d => /^M0,0/.test(d) && d.split('C').length === 5) || null; });
  yes('a petal is drawn as five curves, not an ellipse', !!petal, String(petal).slice(0, 60));
  yes('  and the middle pair form the notch at its tip', (() => {
    if(!petal) return false;
    const nums = petal.match(/-?[\d.]+/g).map(Number);
    /* the two control points either side of the tip come back down the y axis:
       the notch is the point where |y| stops growing */
    const ys = nums.filter((_, i) => i % 2 === 1);
    const tip = Math.min(...ys);
    return ys.some(y => y > tip + 1 && y < tip * .5);
  })(), petal ? petal.replace(/\s+/g, ' ') : '');
  yes('  a full bloom has a spray of stamens with anthers',
      await p.evaluate(() => { const g = document.querySelector('.blossom.t5') || document.querySelector('.blossom');
        return g.querySelectorAll('ellipse').length >= 10; }),
      await p.evaluate(() => (document.querySelector('.blossom.t5') || document.querySelector('.blossom')).querySelectorAll('ellipse').length + ' anthers'));
  yes('  and it is painted with a gradient, not one flat pink',
      await p.evaluate(() => /url\(#sakP/.test(document.querySelector('.blossom').innerHTML)));
  yes('  the flowers are drawn big', await p.evaluate(() =>
    Math.round(document.querySelector('.blossom').getBoundingClientRect().width) >= 60),
    await p.evaluate(() => Math.round(document.querySelector('.blossom').getBoundingClientRect().width) + 'px'));

  console.log('\n2. the leaves are cherry leaves');
  const leaf = await p.evaluate(() => { const g = document.querySelector('.sk-twig .leaf');
    return {teeth: (g.querySelector('path').getAttribute('d').match(/Q/g) || []).length,
      veins: g.querySelectorAll('path').length,
      w: Math.round(g.getBoundingClientRect().width)}; });
  yes('the outline is toothed, not two arcs', leaf.teeth >= 10, leaf.teeth + ' curves');
  yes('  with a midrib and side veins drawn', leaf.veins >= 5, leaf.veins + ' paths');
  yes('  and it is big enough to see the shape of', leaf.w >= 20, leaf.w + 'px');

  console.log('\n3. the bark is a cherry\'s');
  const bark = await p.evaluate(() => ({
    lentic: document.querySelectorAll('.sk-lentic').length,
    span: (() => { const t = document.querySelector('.sk-trunk'); const tw = +t.dataset.w;
      return [...document.querySelectorAll('.sk-lentic')].every(l => {
        const m = l.getAttribute('d').match(/h(-?[\d.]+)/); return m && Math.abs(+m[1]) < tw * .55; }); })(),
  }));
  yes('lenticels mark it', bark.lentic >= 7, bark.lentic + ' of them');
  yes('  and each is a dash, not a rung across the whole trunk', bark.span);

  console.log('\n4. grass and orchids at its foot');
  const ground = await p.evaluate(() => {
    const turf = document.querySelector('.sk-turf');
    const blades = turf.querySelectorAll('.blade');
    const greens = new Set([...blades].map(b => b.getAttribute('stroke')));
    const svg = document.querySelector('.sk-organic');
    const gr = document.querySelector('.sk-trunk').getBBox();
    return {n: blades.length, greens: greens.size, orchids: turf.querySelectorAll('.orchid').length,
      lastIsTurf: [...svg.children].map(c => c.getAttribute('class')).filter(Boolean).includes('sk-turf')}; });
  yes('the grass is thick', ground.n >= 300, ground.n + ' blades');
  yes('  and more than one green', ground.greens >= 4, ground.greens + ' greens');
  yes('orchids grow among it', ground.orchids >= 8, ground.orchids + ' flowers');
  /* the lip is what tells an orchid from any other flower */
  yes('  each with its lower lip', await p.evaluate(() =>
    [...document.querySelectorAll('.orchid')].every(o => o.querySelectorAll('path').length >= 2)));
  yes('  and the grass stands in front of the trunk', await p.evaluate(() => {
    const kids = [...document.querySelector('.sk-organic').children];
    const turf = kids.findIndex(c => c.classList?.contains('sk-turf'));
    const trunk = kids.findIndex(c => c.classList?.contains('sk-trunk'));
    return turf > trunk; }));

  console.log('\n5. petals in the air');
  const fall = await p.evaluate(() => { const n = document.querySelectorAll('.sk-fallpetal');
    return {n: n.length, animated: [...n].every(x => /sakFall/.test(getComputedStyle(x).animationName))}; });
  yes('some are falling', fall.n >= 6, fall.n + ' petals');
  yes('  and they are drifting down', fall.animated);

  console.log('\n6. and the page says what it is showing');
  yes('the hint calls it a cherry, and no longer promises apples',
      await p.evaluate(() => { const t = document.querySelector('.sk-hint')?.textContent || '';
        return /cherry/.test(t) && !/apple/.test(t); }),
      await p.evaluate(() => document.querySelector('.sk-hint')?.textContent));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke140  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
