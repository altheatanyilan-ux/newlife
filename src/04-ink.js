/* ============================================================
   THE INK LAYER — 水墨画, the paper the rooms are painted on
   The rooms each have their own painting (see scenes.js). This
   is what sits behind all of them: the mist that moves across
   it, whatever the season is doing at the margin, and the water
   everything floats above. There is deliberately no splatter —
   one fixed blob repeated on every page reads as a stain, not
   as a painting.

   Monochrome by rule — warm cream on the dark ground, ink black
   on the paper one — because the colour in this house belongs
   to the rooms, and a shan shui painting has never needed any.
   ============================================================ */
const INK_CONTEMPLATIVE = ['today','journals'];   // where a margin illustration belongs
const INK_WATER = ['skills','compass'];              // the wide canvases that float on water

/* one seed for the life of the install, so the same painting greets you */
function inkSeed(){ return hashSeed('ink:' + ((typeof S !== 'undefined' && S?.settings?.firstOpen) || 'first-light')); }
function season(d = new Date()){ const m = d.getMonth(); return (m === 11 || m <= 1) ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn'; }

/* ---------- mist: three breaths of wash, none of them with an edge ---------- */
function mistRibbon(y, h, seed){
  const r = mulberry32(hashSeed(seed)); const W = 1400, steps = 7, pts = [];
  for(let i = 0; i <= steps; i++) pts.push([(i/steps)*W, y + (r()-.5)*h*.75]);
  for(let i = steps; i >= 0; i--) pts.push([(i/steps)*W, y + h + (r()-.5)*h*.75]);
  pts.push(pts[0]);
  return smoothClosed(pts);
}
function inkMistSVG(){
  const bands = [[190,140,'mist-a'], [420,185,'mist-b'], [655,150,'mist-c']];
  return `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice">
    <defs><filter id="inkMistBlur" x="-25%" y="-80%" width="150%" height="260%"><feGaussianBlur stdDeviation="26"/></filter></defs>
    <g filter="url(#inkMistBlur)" fill="var(--ink)">
      ${bands.map(([y,h,s], i) => `<path class="mist-band mb${i+1}" d="${mistRibbon(y, h, s)}" opacity="${(.55 - i*.09).toFixed(2)}"/>`).join('')}
    </g></svg>`;
}

/* ---------- still water at the foot of the wide rooms ---------- */
function inkRippleSVG(){
  return `<svg viewBox="0 0 1200 200" preserveAspectRatio="none">
    <g fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round">
      ${[0,1,2,3].map(i => `<ellipse class="ripple-ring rr${i+1}" cx="600" cy="${168 - i*3}" rx="${240 + i*190}" ry="${13 + i*9}"/>`).join('')}
    </g></svg>`;
}

/* ---------- the season, at the margin ----------
   A single sprig at the page edge, the way a hand-copied sutra carries one. */
function bareBranch(x, y, s = 1, seed = 'winter'){
  const r = mulberry32(hashSeed(seed));
  let g = `<path d="M${x},${y} C${(x-130*s).toFixed(0)},${(y+50*s).toFixed(0)} ${(x-230*s).toFixed(0)},${(y+40*s).toFixed(0)} ${(x-350*s).toFixed(0)},${(y+150*s).toFixed(0)}" fill="none" stroke="var(--page-accent)" stroke-width="${(4.4*s).toFixed(1)}" stroke-linecap="round" opacity=".5"/>`;
  for(let i = 0; i < 5; i++){
    const t = .16 + i*.18, bx = x - 350*s*t, by = y + (50*s*t + 110*s*t*t*t*3);
    const up = i%2 ? -1 : 1, len = (48 + r()*66)*s;
    g += `<path d="M${bx.toFixed(0)},${by.toFixed(0)} q${(-len*.42).toFixed(0)},${(up*len*.3).toFixed(0)} ${(-len*.72).toFixed(0)},${(up*len*.78).toFixed(0)}" fill="none" stroke="var(--page-accent)" stroke-width="${(1.9*s).toFixed(1)}" stroke-linecap="round" opacity=".42"/>`;
  }
  return g;
}
function fallingLeavesHTML(r){
  return Array.from({length:3}, () => {
    const dur = 44 + r()*36;
    return `<i class="ink-leaf" style="left:${(7 + r()*84).toFixed(1)}%;--dur:${dur.toFixed(0)}s;--delay:${(-r()*dur).toFixed(0)}s;--sway:${(28 + r()*54).toFixed(0)}px;--sz:${(11 + r()*9).toFixed(0)}px"></i>`;
  }).join('');
}
function inkSeasonHTML(){
  const s = season(), key = typeof pageThemeKey === 'function' ? pageThemeKey() : 'compass';
  const r = mulberry32(inkSeed() ^ 0x5eed5eed);
  let art = '';
  if(INK_CONTEMPLATIVE.includes(key)){
    if(s === 'spring')      art = plumBranch(-70, 250, 1.05, 'ink-mei');
    else if(s === 'summer') art = bamboo(1128, 830, 1, 'ink-bam') + bamboo(1182, 845, .74, 'ink-bam2');
    else if(s === 'winter') art = bareBranch(1270, 90, 1.05, 'ink-bare');
    else                    art = bamboo(1150, 830, .78, 'ink-aki');
  }
  return (art ? `<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">${art}</svg>` : '')
       + (s === 'autumn' ? fallingLeavesHTML(r) : '');
}

/* ---------- painting it ----------
   The mist and the water are the paper: painted once and left alone. Only
   the margin sprig changes as you move between rooms. */
let _inkPainted = false, _inkKey = null;
function applyInk(){
  const mist = document.getElementById('inkMist'),
        seas = document.getElementById('inkSeason'), rip = document.getElementById('inkRipple');
  if(!mist || !seas || !rip) return;
  if(!_inkPainted){ mist.innerHTML = inkMistSVG(); rip.innerHTML = inkRippleSVG(); _inkPainted = true; }
  const key = (typeof pageThemeKey === 'function' ? pageThemeKey() : 'compass') + ':' + season();
  if(key !== _inkKey){ seas.innerHTML = inkSeasonHTML(); _inkKey = key; }
  rip.classList.toggle('on', INK_WATER.includes(typeof pageThemeKey === 'function' ? pageThemeKey() : 'compass'));
}
/* parallax: the ridges answer the scroll a little, the mist a little more */
(() => {
  let ticking = false;
  addEventListener('scroll', () => {
    if(ticking || (typeof reduced === 'function' && reduced())) return;
    ticking = true;
    requestAnimationFrame(() => { document.documentElement.style.setProperty('--ink-par', String(Math.min(1600, window.scrollY))); ticking = false; });
  }, {passive:true});
})();

/* ============================================================
   ONE PAINTING PER KIND OF ENTRY

   Writing something down is not filing a record, and the box you
   write it in should not look like a form. Every kind of entry
   opens on a small painting of its own — drawn from the same
   brush the rooms are drawn with, in the same monochrome — so a
   dream and a decision do not arrive looking identical.

   The vignettes are wide and short (a band across the top of the
   modal), and they draw themselves in when the modal opens.
   ============================================================ */
const EI_W = 1200, EI_H = 300;
/* each is a function of (u, r) exactly as a room's scene is, so every
   primitive in 04-scenes.js is available to it */
const ENTRY_INK = {
  /* 憶 — what is behind you: ridges receding, geese leaving */
  memory:        (u,r) => `${mountain(u, 300, 262, 620, 210, 'm1', {far:true})}${mountain(u, 760, 268, 520, 150, 'm2', {far:true})}
    ${mistBand(u, 176, 46)}${geese(880, 74, 6, .9, 'yi')}${water(276, 60, 1140, 5, 'mem')}`,
  lifeevent:     (u,r) => `${mountain(u, 600, 268, 660, 236, 'le')}${mistBand(u, 190, 42)}
    ${pine(300, 268, .74, 'le-p')}${figure(880, 266, .82)}`,
  /* 思 — thinking on paper: a table by the water, nobody at it yet */
  reflection:    (u,r) => `${mistBand(u, 150, 54)}${mountain(u, 880, 258, 560, 150, 'rf', {far:true})}
    ${pavilion(300, 262, .8)}${water(272, 60, 1140, 6, 'rf')}${bamboo(1040, 266, .7, 'rf-b')}`,
  /* 夢 — the moon, and mist where the ground should be */
  dream:         (u,r) => `${moonDisc(940, 92, 40)}${mistBand(u, 150, 66)}${mistBand(u, 214, 58, .8)}
    ${mountain(u, 340, 268, 540, 176, 'dr', {far:true})}${water(278, 60, 1140, 4, 'dr')}`,
  /* 謝 — a plum branch in flower, which is the whole of it */
  gratitude:     (u,r) => `${mistBand(u, 176, 44)}${plumBranch(210, 250, 1.08, 'gr')}
    ${mountain(u, 900, 268, 520, 132, 'gr2', {far:true})}`,
  /* 緣 — two ridges meeting over one bridge */
  synchronicity: (u,r) => `${mountain(u, 250, 268, 520, 198, 'sy1')}${mountain(u, 950, 268, 520, 198, 'sy2')}
    ${mistBand(u, 196, 52)}${bridge(490, 244, 220, .9)}`,
  /* 願 — the sun over an empty road */
  manifestation: (u,r) => `${sunDisc(920, 96, 42)}${mountain(u, 420, 268, 620, 210, 'mf', {far:true})}
    ${mistBand(u, 190, 46)}${ruyiCloud(260, 96, .9, 4)}`,
  visualization: (u,r) => `${sunDisc(300, 92, 36)}${mistBand(u, 168, 58)}
    ${mountain(u, 820, 268, 640, 214, 'vz')}${figure(300, 266, .9)}`,
  /* 決 — one figure at a fork, the two ways drawn as ridges */
  decision:      (u,r) => `${mountain(u, 330, 268, 470, 214, 'dc1')}${mountain(u, 900, 268, 470, 190, 'dc2')}
    ${mistBand(u, 200, 44)}${figure(614, 266, .95, true)}`,
  /* 問 — a lone pine on rock, and a great deal of unpainted paper */
  question:      (u,r) => `${mistBand(u, 158, 62)}${pine(240, 266, .95, 'qn')}
    ${mountain(u, 980, 268, 460, 120, 'qn2', {far:true})}`,
  /* 進 — the road going up, and someone a long way along it */
  progress:      (u,r) => `${mountain(u, 700, 268, 760, 246, 'pg')}${mistBand(u, 184, 44)}
    <path d="M400,${EI_H} q40,-96 -14,-160" fill="none" stroke="${A}" stroke-width="2" opacity=".3" stroke-dasharray="10 13"/>
    ${figure(392, 262, .8)}`,
  nod:           (u,r) => `${mistBand(u, 178, 40)}${hut(320, 266, .78)}${bamboo(980, 266, .82, 'nd')}${water(276, 60, 1140, 4, 'nd')}`,
  /* 書 — a letter is a boat you push out for someone later to catch */
  letter:        (u,r) => `${mistBand(u, 162, 56)}${mountain(u, 880, 260, 560, 140, 'lt', {far:true})}
    ${water(258, 60, 1140, 7, 'lt')}${boat(420, 250, .95)}`,
  /* 言 — the scholar's table, borrowed for somebody else's words */
  quote:         (u,r) => `${mistBand(u, 170, 46)}${pavilion(880, 264, .72)}${plumBranch(250, 246, .8, 'qt')}`,
  artifact:      (u,r) => `${mistBand(u, 172, 48)}${hut(600, 266, .95)}${pine(220, 266, .7, 'af')}${pine(980, 266, .62, 'af2')}`,
  uncategorized: (u,r) => `${mistBand(u, 170, 52)}${mountain(u, 600, 268, 700, 200, 'un', {far:true})}${water(276, 60, 1140, 5, 'un')}`,
};
const ENTRY_SEALS = {
  memory:'憶', lifeevent:'事', reflection:'思', dream:'夢', gratitude:'謝', synchronicity:'緣',
  manifestation:'願', visualization:'觀', decision:'決', question:'問', progress:'進',
  nod:'點', letter:'書', quote:'言', artifact:'物', uncategorized:'記',
};
/* the band itself. `_scId` keeps the gradient ids unique, exactly as the rooms do. */
function entryInkSVG(type){
  const build = ENTRY_INK[type] || ENTRY_INK.uncategorized;
  const u = 'e' + (++_scId) + '_';
  const seal_ = ENTRY_SEALS[type] || ENTRY_SEALS.uncategorized;
  return `<svg viewBox="0 0 ${EI_W} ${EI_H}" preserveAspectRatio="xMidYMax slice" class="entry-ink-svg" aria-hidden="true">
    ${scDefs(u, A)}${build(u, mulberry32(hashSeed('entryink:' + type)))}
    <text class="entry-ink-seal" x="${Math.round(EI_W * .855)}" y="76">${seal_}</text>
  </svg>`;
}

/* ============================================================
   WHAT GROWS ON A BANNER

   Each room gets a plant along the head of its page — not the same
   ornament recoloured twelve times, but twelve different growths
   from one set of brushes: a stem, a leaf shape, and something
   that opens on it. Pine for the Compass, bamboo for Journals,
   plum in blossom for Values, an orchid for Writing, wheat for
   Finance, willow trailing over the Timeline.

   Drawn in the page's own accent at low opacity, behind the words,
   growing in when the page arrives.
   ============================================================ */
const BP_W = 900, BP_H = 170;

/* a stem: a run of points, smoothed, thinning as it climbs */
function bpStem(pts, w0 = 3.4, w1 = .7){
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i = 1; i < pts.length; i++){
    const [px, py] = pts[i - 1], [x, y] = pts[i];
    d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${((px + x) / 2).toFixed(1)},${((py + y) / 2).toFixed(1)}`;
  }
  d += ` L${pts[pts.length-1][0].toFixed(1)},${pts[pts.length-1][1].toFixed(1)}`;
  /* two strokes, the second thinner and shorter, so the line tapers the way a
     loaded brush does as it runs out */
  return `<path class="bp-stem" d="${d}" fill="none" stroke="currentColor" stroke-width="${w0}" stroke-linecap="round" opacity=".5"/>
          <path class="bp-stem" d="${d}" fill="none" stroke="currentColor" stroke-width="${w1}" stroke-linecap="round" opacity=".8"/>`;
}
/* a point along a polyline, and the direction it is heading */
function bpAt(pts, t){
  const n = pts.length - 1, f = clamp(t, 0, .999) * n, i = Math.floor(f), k = f - i;
  const [x0, y0] = pts[i], [x1, y1] = pts[Math.min(i + 1, n)];
  return {x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k,
          a: Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI};
}
const BP_LEAF = {
  oval:   s => `M0,0 Q${s*.9},${-s*.6} ${s*1.9},0 Q${s*.9},${s*.6} 0,0Z`,
  lance:  s => `M0,0 Q${s*1.1},${-s*.34} ${s*2.6},0 Q${s*1.1},${s*.34} 0,0Z`,
  ivy:    s => `M0,0 Q${s*.5},${-s*.95} ${s*1.2},${-s*.5} Q${s*1.7},${-s*.1} ${s*2},0 Q${s*1.7},${s*.1} ${s*1.2},${s*.5} Q${s*.5},${s*.95} 0,0Z`,
  needle: s => `M0,0 L${s*2.2},${-s*.12} L${s*2.2},${s*.12}Z`,
  grain:  s => `M0,0 Q${s*.7},${-s*.5} ${s*1.3},${-s*.08} Q${s*.7},${s*.2} 0,0Z`,
  blade:  s => `M0,0 Q${s*1.6},${-s*.5} ${s*3.2},${-s*.1} Q${s*1.6},${s*.25} 0,0Z`,
};
function bpLeaf(x, y, ang, s, shape = 'oval', op = .34){
  return `<g class="bp-leaf" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${ang.toFixed(1)})">
    <path d="${(BP_LEAF[shape] || BP_LEAF.oval)(s)}" fill="currentColor" opacity="${op}"/></g>`;
}
/* the thing that opens: five petals, a tight bud, a berry, or an ear of grain */
function bpBloom(x, y, r, kind, i = 0){
  if(kind === 'none') return '';
  if(kind === 'berry') return `<circle class="bp-bloom" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="currentColor" opacity=".66"/>`;
  if(kind === 'bud')   return `<g class="bp-bloom" style="--d:${(i*.13).toFixed(2)}s"><path d="M${x.toFixed(1)},${(y+r*1.3).toFixed(1)} q${(-r*.8).toFixed(1)},${(-r*1.1).toFixed(1)} 0,${(-r*2.2).toFixed(1)} q${(r*.8).toFixed(1)},${(r*1.1).toFixed(1)} 0,${(r*2.2).toFixed(1)}z" fill="currentColor" opacity=".6"/></g>`;
  if(kind === 'ear'){
    let g = '';
    for(let k = 0; k < 5; k++){ const yy = y - k * r * 1.15;
      g += `<path d="M${x.toFixed(1)},${yy.toFixed(1)} q${(r*1.2).toFixed(1)},${(-r*.5).toFixed(1)} ${(r*1.9).toFixed(1)},${(-r*.15).toFixed(1)} q${(-r*1.1).toFixed(1)},${(r*.5).toFixed(1)} ${(-r*1.9).toFixed(1)},${(r*.15).toFixed(1)}z" fill="currentColor" opacity=".58"/>
            <path d="M${x.toFixed(1)},${yy.toFixed(1)} q${(-r*1.2).toFixed(1)},${(-r*.5).toFixed(1)} ${(-r*1.9).toFixed(1)},${(-r*.15).toFixed(1)} q${(r*1.1).toFixed(1)},${(r*.5).toFixed(1)} ${(r*1.9).toFixed(1)},${(r*.15).toFixed(1)}z" fill="currentColor" opacity=".58"/>`; }
    return `<g class="bp-bloom" style="--d:${(i*.13).toFixed(2)}s">${g}</g>`;
  }
  /* an open flower: five petals and a heart */
  const petals = [0,1,2,3,4].map(q => { const a = q * 72 + (i * 23) % 72;
    return `<ellipse cx="0" cy="${(-r*.62).toFixed(2)}" rx="${(r*.42).toFixed(2)}" ry="${(r*.62).toFixed(2)}" transform="rotate(${a})" fill="currentColor" opacity=".62"/>`; }).join('');
  return `<g class="bp-bloom" style="--d:${(i*.13).toFixed(2)}s" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${petals}<circle r="${(r*.26).toFixed(2)}" fill="currentColor" opacity=".75"/></g>`;
}

/* one entry per room: the shape of the stem, what its leaves are, and what
   opens on it. `climb` is how steeply it rises; `reach` how far it runs. */
const BANNER_PLANTS = {
  compass:    {leaf:'needle', bloom:'none',  n:18, reach:.30, climb:.86, size:20, arc:.30},
  today:      {leaf:'ivy',    bloom:'open',  n:10, reach:.44, climb:.74, size:19, arc:.55, blooms:3},
  journals:   {leaf:'lance',  bloom:'none',  n:11, reach:.20, climb:.94, size:24, arc:.06, culm:true},
  values:     {leaf:'oval',   bloom:'plum',  n:7,  reach:.40, climb:.66, size:15, arc:.42, blooms:6},
  skills:     {leaf:'oval',   bloom:'bud',   n:12, reach:.34, climb:.88, size:19, arc:.24, blooms:3},
  projects:   {leaf:'ivy',    bloom:'berry', n:13, reach:.52, climb:.60, size:17, arc:.66, blooms:4, tendril:true},
  finance:    {leaf:'lance',  bloom:'ear',   n:8,  reach:.28, climb:.90, size:21, arc:.10, blooms:3},
  commonplace:{leaf:'ivy',    bloom:'none',  n:15, reach:.56, climb:.52, size:17, arc:.72, tendril:true},
  people:     {leaf:'oval',   bloom:'open',  n:9,  reach:.42, climb:.70, size:17, arc:.46, blooms:5},
  timeline:   {leaf:'blade',  bloom:'none',  n:14, reach:.48, climb:.40, size:20, arc:.80, weep:true},
  writing:    {leaf:'blade',  bloom:'plum',  n:8,  reach:.34, climb:.78, size:26, arc:.34, blooms:2},
  settings:   {leaf:'lance',  bloom:'none',  n:9,  reach:.22, climb:.84, size:19, arc:.14},
};
function bannerPlant(key){ return BANNER_PLANTS[key] || BANNER_PLANTS.compass; }

function bannerPlantSVG(key){
  const p = bannerPlant(key);
  const r = mulberry32(hashSeed('banner:' + key));

  /* one growth: a stem from the bottom edge, its leaves, and what opens on it.
     Each room gets a main climb plus a shorter companion shoot or two, because
     a single stem reads as a stray twig rather than something growing. */
  const growth = (x0, scale, reachMul, bloomN, phase) => {
    const y0 = BP_H + 8;
    const top = BP_H * (1 - p.climb * scale);
    const far = BP_W * p.reach * reachMul;
    const pts = [];
    const STEPS = 7;
    for(let i = 0; i <= STEPS; i++){
      const t = i / STEPS;
      const x = x0 + far * t + BP_W * p.arc * reachMul * t * t * .55;
      let y = y0 - (y0 - top) * Math.pow(t, .78);
      if(p.weep) y = top + (y0 - top) * Math.pow(t, 1.9) * .55;    // willow falls again
      pts.push([x, y + (r() - .5) * 6]);
    }
    let g = bpStem(pts, (p.culm ? 7 : 5) * scale, (p.culm ? 2.6 : 1.2) * scale);
    if(p.culm) for(let i = 1; i < STEPS; i++){ const q = bpAt(pts, i / STEPS);
      g += `<path d="M${(q.x-9*scale).toFixed(1)},${q.y.toFixed(1)} h${(18*scale).toFixed(1)}" stroke="currentColor" stroke-width="${(2.6*scale).toFixed(1)}" opacity=".45"/>`; }

    const n = Math.max(3, Math.round(p.n * scale));
    for(let i = 0; i < n; i++){
      const t = .1 + (i / Math.max(n - 1, 1)) * .86;
      const q = bpAt(pts, t);
      const side = i % 2 ? 1 : -1;
      const spread = p.leaf === 'needle' ? 26 : p.weep ? 62 : 44;
      const ang = q.a + side * (spread + (r() - .5) * 26);
      const sz = p.size * 1.45 * scale * (.74 + r() * .44) * (1 - t * .22);
      g += bpLeaf(q.x, q.y, ang, sz, p.leaf, .5 + r() * .22);
    }
    if(p.tendril) for(let i = 0; i < 2; i++){ const q = bpAt(pts, .4 + i * .3);
      g += `<path class="bp-stem" d="M${q.x.toFixed(1)},${q.y.toFixed(1)} q${(24*scale).toFixed(0)},${(-20*scale).toFixed(0)} ${(38*scale).toFixed(0)},4 q9,15 -7,17 q-12,-2 -5,-14" fill="none" stroke="currentColor" stroke-width="${(1.6*scale).toFixed(1)}" opacity=".5" stroke-linecap="round"/>`; }

    for(let i = 0; i < bloomN; i++){
      const t = .3 + (i / Math.max(bloomN - 1, 1)) * .62;
      const q = bpAt(pts, t);
      const off = (i % 2 ? 1 : -1) * (14 + r() * 12) * scale;
      g += bpBloom(q.x + off, q.y - (10 + r() * 14) * scale,
        (p.bloom === 'ear' ? 11 : 19) * scale * (.82 + r() * .4), p.bloom, i + phase);
    }
    return g;
  };

  /* the main climb at the corner, then companions further along the edge */
  let g = growth(26, 1, 1, p.blooms || 0, 0);
  g += growth(BP_W * (.16 + p.reach * .5), .62, .8, Math.max(0, Math.round((p.blooms || 0) * .5)), 4);
  if(!p.culm) g += growth(BP_W * (.34 + p.reach * .6), .4, .6, Math.max(0, Math.round((p.blooms || 0) * .34)), 8);

  return `<svg class="ph-plant-svg" viewBox="0 0 ${BP_W} ${BP_H}" preserveAspectRatio="xMinYMax meet" aria-hidden="true">${g}</svg>`;

}
