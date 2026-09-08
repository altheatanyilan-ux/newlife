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
const INK_CONTEMPLATIVE = ['today','journals','vision'];   // where a margin illustration belongs
const INK_WATER = ['vision','skills','compass'];              // the wide canvases that float on water

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
