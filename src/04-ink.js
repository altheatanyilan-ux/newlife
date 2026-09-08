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
