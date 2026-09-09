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
   WHAT BLOOMS ON A BANNER

   Each room's banner carries flowers, and nothing else. There was a
   climbing plant here once — stems drawing themselves across the head
   of the page, leaves opening along them, the whole growth slowly
   turning — and every one of those movements happened underneath the
   title, which is precisely where a reader is looking. Growth is a
   travelling animation; it cannot help crossing whatever it passes.

   A blossom does not travel. It opens where it is and then only
   breathes. So the ornament is now a scatter of flowers, each placed
   in a gap the words do not occupy, sized to fit that gap, opening on
   its own beat and afterwards barely moving at all.

   Where the gaps are is not guessed. Before a banner is drawn, the
   line boxes of its own text and controls are measured, and every
   flower is tested against them — so a long title simply gets fewer
   flowers, further out, rather than flowers over the top of it.
   ============================================================ */

/* five brushes, all of them a whole flower rather than something that
   needs a branch under it to make sense */
const BLOOM_FORMS = {
  /* plum: five round petals, a few stamens — the ink painter's flower */
  plum: (r, k) => {
    const petals = [0,1,2,3,4].map(q => {
      const a = q * 72 + (k * 17) % 40;
      return `<circle cx="0" cy="${(-r*.56).toFixed(2)}" r="${(r*.46).toFixed(2)}"
                transform="rotate(${a})" fill="currentColor" opacity=".55"/>`; }).join('');
    const stamens = [0,1,2,3,4,5].map(q => { const a = q * 60 + 12;
      return `<line x1="0" y1="0" x2="0" y2="${(-r*.44).toFixed(2)}" transform="rotate(${a})"
                stroke="currentColor" stroke-width="${(r*.055).toFixed(2)}" opacity=".5"/>`; }).join('');
    return `${petals}${stamens}<circle r="${(r*.15).toFixed(2)}" fill="currentColor" opacity=".8"/>`;
  },
  /* a wider, pointed five — apricot, or anything that opens flat */
  open: (r, k) => {
    const petals = [0,1,2,3,4].map(q => { const a = q * 72 + (k * 23) % 72;
      return `<path d="M0,0 Q${(r*.42).toFixed(2)},${(-r*.5).toFixed(2)} 0,${(-r).toFixed(2)}
                        Q${(-r*.42).toFixed(2)},${(-r*.5).toFixed(2)} 0,0Z"
                transform="rotate(${a})" fill="currentColor" opacity=".52"/>`; }).join('');
    return `${petals}<circle r="${(r*.17).toFixed(2)}" fill="currentColor" opacity=".78"/>`;
  },
  /* two rings of petals, offset — camellia, peony, anything doubled */
  layered: (r, k) => {
    const ring = (rad, op, n, off) => [...Array(n)].map((_, q) => {
      const a = q * (360 / n) + off + (k * 11) % 30;
      return `<ellipse cx="0" cy="${(-rad*.54).toFixed(2)}" rx="${(rad*.36).toFixed(2)}" ry="${(rad*.54).toFixed(2)}"
                transform="rotate(${a})" fill="currentColor" opacity="${op}"/>`; }).join('');
    return `${ring(r, '.4', 6, 0)}${ring(r*.66, '.6', 5, 30)}<circle r="${(r*.14).toFixed(2)}" fill="currentColor" opacity=".82"/>`;
  },
  /* not yet open: a tight teardrop with its sepals still around it */
  bud: (r) => `<path d="M0,${(r*.62).toFixed(2)} q${(-r*.46).toFixed(2)},${(-r*.62).toFixed(2)} 0,${(-r*1.3).toFixed(2)}
                        q${(r*.46).toFixed(2)},${(r*.62).toFixed(2)} 0,${(r*1.3).toFixed(2)}z"
                 fill="currentColor" opacity=".58"/>
               <path d="M${(-r*.3).toFixed(2)},${(r*.5).toFixed(2)} q${(r*.3).toFixed(2)},${(-r*.3).toFixed(2)} ${(r*.6).toFixed(2)},0"
                 fill="none" stroke="currentColor" stroke-width="${(r*.09).toFixed(2)}" opacity=".5"/>`,
  /* one petal, already loose — the thing that makes a scatter read as fallen */
  petal: (r) => `<path d="M0,${(-r*.6).toFixed(2)} q${(r*.52).toFixed(2)},${(r*.4).toFixed(2)} 0,${(r*1.2).toFixed(2)}
                          q${(-r*.52).toFixed(2)},${(-r*.8).toFixed(2)} 0,${(-r*1.2).toFixed(2)}z"
                   fill="currentColor" opacity=".46"/>`,
};

/* one entry per room: which flowers, how many, how big, how loose the
   scatter. No two rooms bloom the same. */
const BANNER_BLOOMS = {
  compass:    {forms:['plum','plum','bud'],      n:5, size:[22,40], drift:2},
  today:      {forms:['open','plum'],            n:6, size:[22,42], drift:3},
  journals:   {forms:['bud','plum'],             n:5, size:[20,36], drift:2},
  values:     {forms:['plum','plum','layered'],  n:6, size:[24,44], drift:3},
  skills:     {forms:['open','bud'],             n:5, size:[21,38], drift:2},
  projects:   {forms:['layered','open'],         n:5, size:[24,42], drift:3},
  finance:    {forms:['open','plum'],            n:5, size:[20,37], drift:2},
  commonplace:{forms:['plum','open'],            n:6, size:[21,40], drift:3},
  people:     {forms:['layered','plum'],         n:6, size:[22,42], drift:3},
  timeline:   {forms:['plum','open'],            n:7, size:[19,38], drift:4},
  writing:    {forms:['layered','plum'],         n:4, size:[26,46], drift:2},
  settings:   {forms:['plum','bud'],             n:4, size:[19,34], drift:2},
};
function bannerBloom(key){ return BANNER_BLOOMS[key] || BANNER_BLOOMS.compass; }

/* does a flower of radius (fw, fh) at (x, y) — all fractions of the banner —
   land on anything the reader is reading? */
function bloomClear(x, y, fw, fh, keep){
  /* a flower whose disc crosses the banner's own edge is a half flower: the
     head is clipped, and rounded at the corners besides */
  if(x - fw < .012 || x + fw > .988 || y - fh < .04 || y + fh > .96) return false;
  return !keep.some(k => x + fw > k.x0 && x - fw < k.x1 && y + fh > k.y0 && y - fh < k.y1);
}

/* `keep` is a list of rectangles, in fractions of the banner, that the words
   and controls occupy. Passing none means the whole banner is free. */
function bannerBloomsHTML(key, keep = [], box = {w: 900, h: 150}){
  const p = bannerBloom(key);
  const r = mulberry32(hashSeed('bloom:' + key));
  const W = Math.max(box.w, 200), H = Math.max(box.h, 60);

  /* Candidates on a jittered grid, ranked by how deep into free ground they
     sit — distance from the nearest word, not distance from the banner's
     edge. A banner is short and its free ground is the run beside the title,
     so chasing the edges would only push flowers into the rounded corners and
     under the bottom fade. Rows stop short of both edges for the same reason:
     the head is clipped at the top and masked out at the bottom. */
  const cand = [];
  const COLS = 11, ROWS = 5;
  const near = (x, y) => keep.length
    ? Math.min(...keep.map(k => Math.hypot(
        Math.max(k.x0 - x, 0, x - k.x1) * W, Math.max(k.y0 - y, 0, y - k.y1) * H)))
    : 999;
  for(let cx = 0; cx < COLS; cx++) for(let cy = 0; cy < ROWS; cy++){
    const x = (cx + .5 + (r() - .5) * .7) / COLS;
    const y = .12 + ((cy + .5 + (r() - .5) * .7) / ROWS) * .68;    // clear of clip and fade
    cand.push({x, y, room: near(x, y), jitter: r()});
  }
  cand.sort((a, b) => (b.room + b.jitter * 26) - (a.room + a.jitter * 26));

  /* Take the biggest flower that fits each spot, and never let two of them sit
     on top of each other. */
  const placed = [];
  /* a flower is measured against the banner it is in, not against a nominal
     one: a 100px head cannot carry a 46px blossom without looking crowded */
  const k = clamp(H / 130, .62, 1.1);
  const [lo, hi] = [p.size[0] * k, p.size[1] * k];
  /* Two spacings, not one. Anchors keep well apart, so the sprays land across
     the whole of the free ground instead of piling into the one corner that
     happens to be furthest from the title; the small flowers of a spray keep
     close, because that is what makes them read as one spray. */
  const APART = Math.max(74, W * .07);
  const fits = (x, y, size, anchor) => {
    if(!bloomClear(x, y, (size / 2) / W, (size / 2) / H, keep)) return false;
    return !placed.some(q => {
      const d = Math.hypot((q.x - x) * W, (q.y - y) * H);
      return d < (anchor && !q.spray ? APART : (q.size + size) * .42);
    });
  };
  const put = (x, y, size, spray) => { placed.push({x, y, size, spray}); };

  /* `n` counts open flowers. Their buds and loose petals are extra, or a
     banner ends up with two blossoms and four specks. */
  let anchors = 0;
  for(const c of cand){
    if(anchors >= p.n) break;
    let size = null;
    for(const s of [hi, (lo + hi) / 2, lo, lo * .66, lo * .46]) if(fits(c.x, c.y, s, true)){ size = s; break; }
    if(size == null) continue;
    const anchor = size * (.86 + r() * .26);
    put(c.x, c.y, anchor, false); anchors++;
    /* One or two smaller flowers close in, so a blossom reads as a spray on a
       branch you cannot see rather than as a dot dropped on the banner. */
    const buds = 1 + Math.round(r());
    for(let b = 0; b < buds; b++){
      const a = r() * Math.PI * 2, d = anchor * (.62 + r() * .5);
      const nx = c.x + Math.cos(a) * d / W, ny = c.y + Math.sin(a) * d / H;
      const sz = anchor * (.42 + r() * .26);
      if(fits(nx, ny, sz, false)) put(nx, ny, sz, true);
    }
  }

  return placed.map((b, i) => {
    /* a satellite is a bud or a loose petal; the anchors carry the room's flower */
    const form = b.spray ? (r() < .55 ? 'bud' : 'petal') : p.forms[i % p.forms.length];
    const spin = Math.round((r() - .5) * 70);
    const dur = (7 + r() * 6).toFixed(1);
    return `<span class="ph-bloom" style="left:${(b.x * 100).toFixed(2)}%;top:${(b.y * 100).toFixed(2)}%;
      --sz:${b.size.toFixed(1)}px;--d:${(i * .09).toFixed(2)}s;--sp:${spin}deg;--br:${dur}s;--bd:${(r() * 4).toFixed(1)}s;
      --op:${(b.spray ? .48 + r() * .26 : .74 + r() * .26).toFixed(2)};--dr:${p.drift}px">
      <svg viewBox="-50 -50 100 100" aria-hidden="true">${(BLOOM_FORMS[form] || BLOOM_FORMS.plum)(42, i)}</svg></span>`;
  }).join('');
}
