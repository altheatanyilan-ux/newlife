/* smoke136 — the skill tree as a tree: a seed before anything is planted, a
   sapling that thickens as it is given more to carry, leaves in proportion to
   the flowers, and labels that are readable rather than eaten by foliage. */
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
    await p.waitForTimeout(2200); await p.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove())); };
  await p.evaluate(() => { S._all = S.skills.slice(); });

  console.log('\n1. nothing planted yet is a seed, not a broken tree');
  await p.evaluate(() => { S.skills = []; }); await draw();
  yes('a seedling is drawn', await p.evaluate(() => !!document.querySelector('.sk-seedling')));
  is('  and it says so', await p.evaluate(() => document.querySelector('.sk-seedlbl')?.textContent),
     'Every master was once a beginner.');
  yes('  it tells you what to do next',
      await p.evaluate(() => /Add your first skill to plant the seed/.test(document.querySelector('.sk-seedsub')?.textContent || '')));
  yes('  with the button to do it right there',
      await p.evaluate(() => !!document.querySelector('#skillWrap .sk-plant')));
  yes('  no bare trunk is left standing', await p.evaluate(() => !document.querySelector('.sk-trunk') && !document.querySelector('.sk-twig')));
  yes('  the seed has a shoot and a root or two',
      await p.evaluate(() => !!document.querySelector('.sk-shoot') && document.querySelectorAll('.sk-seed .sk-root').length >= 2));
  yes('  and it sits inside the plot, label and all',
      await p.evaluate(() => { const s = document.querySelector('.sk-seedling'), t = document.querySelector('.sk-seedsub');
        if(!s || !t) return false;
        const H = +s.getAttribute('viewBox').split(' ')[3]; return +t.getAttribute('y') < H - 4; }));

  console.log('\n2. the trunk grows with what it carries');
  /* how fat the trunk is against how tall it is — the honest measure of a
     sapling, since the whole drawing is scaled to fit the plot */
  const trunkAt = async m => { await p.evaluate(x => { S.skills = S._all.slice(0, x); }, m); await draw();
    return p.evaluate(() => { const t = document.querySelector('.sk-trunk');
      return t ? {w: +t.getAttribute('stroke-width'), h: t.getBBox().height} : {w:0, h:1}; }); };
  const one = await trunkAt(1), full = await trunkAt(await p.evaluate(() => S._all.length));
  const slender = x => x.w / x.h;
  yes('a sapling is a slender stem', slender(one) < .085, `${one.w.toFixed(1)}px wide on ${one.h.toFixed(0)}px tall`);
  yes('  and the grown tree a proper trunk', slender(full) > slender(one) * 1.25,
      `${slender(one).toFixed(3)} → ${slender(full).toFixed(3)}`);
  yes('  which is also thicker in plain pixels', full.w > one.w + 4, `${one.w.toFixed(1)} → ${full.w.toFixed(1)}`);
  is('  one twig per skill', await p.evaluate(() => document.querySelectorAll('.sk-twig').length),
     await p.evaluate(() => S.skills.length));
  yes('  the limbs are leaved too, not bare sticks',
      await p.evaluate(() => document.querySelectorAll('.sk-branchleaves .leaf').length >= 5),
      await p.evaluate(() => document.querySelectorAll('.sk-branchleaves .leaf').length + ' leaves on the limbs'));
  yes('  and leaves drift in the gaps between them',
      await p.evaluate(() => document.querySelectorAll('.leaf.amb').length >= 6),
      await p.evaluate(() => document.querySelectorAll('.leaf.amb').length + ' ambient'));

  console.log('\n3. the flower carries the level, and is in proportion to a leaf');
  const tierOf = async frac => {
    await p.evaluate(f => { S.skills = S._all.slice(0, 1); const s = S.skills[0];
      s.planned = false; s.prereqs = []; s.currentLevel = Math.max(1, Math.round(skillLevelCount(s) * f)); }, frac);
    await draw();
    return p.evaluate(() => { const el = document.querySelector('.blossom');
      if(!el) return null; const r = el.getBoundingClientRect();
      return {cls: el.getAttribute('class').trim(), w: Math.round(r.width),
        petals: el.querySelectorAll('ellipse').length}; });
  };
  const low = await tierOf(.2) || {cls:'', w:0, petals:0}; let high = await tierOf(1);
  yes('a first level opens a bud', /\bt1\b/.test(low.cls), JSON.stringify(low));
  yes('  mastery opens a full bloom', !!high && /\bt5\b/.test(high.cls), JSON.stringify(high));
  yes('  the bloom is visibly bigger than the bud', high.w > low.w * 1.8, `${low.w}px → ${high.w}px`);
  yes('  and it is drawn at a size a person can see', high.w >= 30, high.w + 'px across');
  yes('  with more petals than the bud', high.petals > low.petals, `${low.petals} → ${high.petals}`);
  const leafW = await p.evaluate(() => { const l = document.querySelector('.sk-twig .leaf path');
    return l ? Math.round(l.getBoundingClientRect().width) : 0; });
  if(!high){ no('a bloom is drawn at all'); high = {w:0, petals:0}; }
  yes('a leaf is not a sliver beside the flower', leafW * 4 >= high.w, `leaf ${leafW}px vs flower ${high.w}px`);

  /* An infinite CSS `transform` on a group that carries an SVG transform
     attribute throws the group to the canvas origin. That emptied the tree of
     flowers once; this catches it if it comes back. */
  yes('  and it sits on its own twig, not in the corner',
      await p.evaluate(() => [...document.querySelectorAll('.sk-twig')].every(tw => {
        const limb = tw.querySelector('path.limb'); if(!limb) return true;
        const lb = limb.getBoundingClientRect();
        return [...tw.querySelectorAll('.blossom')].every(fl => { const r = fl.getBoundingClientRect();
          const cx = r.left + r.width/2, cy = r.top + r.height/2;
          return cx > lb.left - 70 && cx < lb.right + 70 && cy > lb.top - 70 && cy < lb.bottom + 70; });
      })), 'a flower has come off its twig');

  console.log('\n4. mastery hangs fruit');
  yes('an apple appears when the last level is reached',
      await p.evaluate(() => !!document.querySelector('.fruit .fruit-body')));

  console.log('\n5. every label is legible');
  await p.evaluate(() => { S.skills = S._all.slice(); }); await draw();
  yes('the labels are one layer over the whole tree, not buried in the twigs',
      await p.evaluate(() => { const svg = document.querySelector('.sk-organic');
        return !!svg && !svg.querySelector('.sk-lblslot') && svg.lastElementChild.classList.contains('sk-lbls'); }));
  is('  one label group per skill', await p.evaluate(() => document.querySelectorAll('.sk-lblfor').length),
     await p.evaluate(() => S.skills.filter(s => true).length));
  const clash = await p.evaluate(() => {
    const bs = [...document.querySelectorAll('.sk-lbl, .sk-catlbl')].map(t => {
      const r = t.getBoundingClientRect(); return {t: t.textContent, l: r.left, r: r.right, tp: r.top, bt: r.bottom}; });
    const out = [];
    for(let i=0;i<bs.length;i++) for(let j=i+1;j<bs.length;j++){
      const a = bs[i], c = bs[j];
      const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l), oy = Math.min(a.bt, c.bt) - Math.max(a.tp, c.tp);
      if(ox > 1 && oy > 1) out.push(a.t + ' × ' + c.t);
    }
    return out; });
  yes('no two names sit on top of each other', clash.length === 0, clash.join(' | '));
  yes('  and each name clears its own foliage',
      await p.evaluate(() => [...document.querySelectorAll('.sk-twig')].every(tw => {
        const id = tw.dataset.skill; const lbl = document.querySelector(`.sk-lblfor[data-for="${id}"] .sk-lbl`);
        if(!lbl) return true; const a = lbl.getBoundingClientRect();
        return [...tw.querySelectorAll('.leaf path')].every(l => { const r = l.getBoundingClientRect();
          return !(Math.min(a.right, r.right) - Math.max(a.left, r.left) > 2 && Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top) > 2); });
      })), 'a leaf covers a name');

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke136  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
