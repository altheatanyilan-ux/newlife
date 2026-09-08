/* ============================================================
   SCENES — shan shui behind the glass.
   Every room gets an ink painting in the ambient layer, built
   from the vocabulary of the old landscape masters: mountains
   that dissolve into mist at their feet, texture strokes (皴)
   raked down the shaded face, pines and bamboo, a pavilion, a
   boat with one figure in it, a line of geese, and the empty
   space (留白) that is doing as much work as the ink. Each is
   drawn in the page's own accent at a few per cent opacity, so
   it reads as atmosphere rather than decoration.
   Detail pages get a painting generated from their own id, so
   no two records look alike and each looks the same every time.
   ============================================================ */
const SC_W = 1200, SC_H = 760;
const A = 'var(--page-accent)', G1 = 'var(--page-gradient-start)', G2 = 'var(--page-gradient-end)';
const SEAL_RED = '#b3402f';   /* cinnabar — a chop is red in every one of these paintings */

/* stable pseudo-randomness, so a scene is painted the same way every time */
function hashSeed(str){ let h = 2166136261; for(let i=0;i<String(str).length;i++){ h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- the ink itself ----------
   Four gradients in objectBoundingBox units, so every shape fades over its
   own height: what the eye reads as mist is simply the ink running out. */
let _scId = 0;
function scDefs(u, ink){
  const k = ink || A;
  return `<defs>
    <linearGradient id="${u}w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${k}" stop-opacity=".26"/><stop offset="34%" stop-color="${k}" stop-opacity=".11"/><stop offset="100%" stop-color="${k}" stop-opacity="0"/></linearGradient>
    <linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${G2}" stop-opacity=".20"/><stop offset="46%" stop-color="${G2}" stop-opacity=".06"/><stop offset="100%" stop-color="${G2}" stop-opacity="0"/></linearGradient>
    <linearGradient id="${u}l" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${k}" stop-opacity=".95"/><stop offset="58%" stop-color="${k}" stop-opacity=".42"/><stop offset="100%" stop-color="${k}" stop-opacity="0"/></linearGradient>
    <radialGradient id="${u}h" cx=".5" cy=".5" r=".5">
      <stop offset="0%" stop-color="${G1}" stop-opacity=".24"/><stop offset="55%" stop-color="${G1}" stop-opacity=".13"/><stop offset="100%" stop-color="${G1}" stop-opacity="0"/></radialGradient>
  </defs>`;
}
/* a scene is a function of its own id namespace, so two can crossfade without
   their gradient ids colliding */
function scene(build, ink){ return () => { const u = 'k' + (++_scId) + '_';
  return `<svg viewBox="0 0 ${SC_W} ${SC_H}" preserveAspectRatio="xMidYMax slice" class="scene-svg">${scDefs(u, ink)}${build(u, mulberry32(hashSeed(build.name || 'shan')))}</svg>`; }; }

/* ---------- mountains ----------
   Not a triangle. A shan shui peak is a run of shoulders and saddles with a
   blunt top, so it is built as a profile of points and then smoothed through
   their midpoints — the same way a brush rounds a corner it did not lift for. */
function smoothClosed(pts){
  let d = `M${pts[0][0].toFixed(0)},${pts[0][1].toFixed(0)}`;
  for(let i=1;i<pts.length-1;i++){ const [cx,cy] = pts[i], [nx,ny] = pts[i+1];
    d += ` Q${cx.toFixed(0)},${cy.toFixed(0)} ${((cx+nx)/2).toFixed(0)},${((cy+ny)/2).toFixed(0)}`; }
  const last = pts[pts.length-1];
  return d + ` L${last[0].toFixed(0)},${last[1].toFixed(0)} Z`;
}
function peakPoints(cx, base, w, h, r){
  const L = cx - w/2, R = cx + w/2, sx = cx + (r()-.5)*w*.26;
  const pts = [[L, base], [L + w*.06, base - h*.06]];
  const nl = 3;
  for(let i=1;i<=nl;i++){                                   // left flank, climbing in steps
    const t = i/(nl+.6);
    const x = L + (sx-L)*(t + (r()-.5)*.06);
    const y = base - h*Math.pow(t, .72)*(.88 + r()*.2);
    pts.push([x, y]);
    if(i < nl) pts.push([x + (sx-L)*(.06 + r()*.05), y + h*(.02 + r()*.05)]);   // a shoulder to rest on
  }
  pts.push([sx - w*.07, base - h*(.93 + r()*.05)]);          // the top is blunt, not pointed
  pts.push([sx - w*.02, base - h]);
  pts.push([sx + w*.05, base - h*(.95 + r()*.04)]);
  const nr = 2 + Math.floor(r()*2);
  for(let i=1;i<=nr;i++){                                    // right flank, falling away longer
    const t = i/(nr+.5);
    const x = sx + (R-sx)*(t*.94 + (r()-.5)*.05);
    const y = base - h*(1 - Math.pow(t, .58))*(.9 + r()*.16);
    pts.push([x, y]);
    if(i < nr) pts.push([x + (R-sx)*(.05 + r()*.05), y - h*(.01 + r()*.04)]);
  }
  pts.push([R - w*.05, base - h*.04]); pts.push([R, base]);
  return pts;
}
/* 皴 — hemp-fibre strokes. They hang off the silhouette and run down the
   shaded face, short and hooked, thinning as they fall. */
function cunStrokes(pts, base, r, per=2){
  let g = '';
  pts.forEach(([x, y]) => {
    if(y > base - 26) return;
    for(let k=0;k<per;k++){
      const len = 22 + r()*54, lean = (r()-.5)*26, off = (r()-.5)*26;
      const x0 = x + off, y0 = y + 5 + k*(9 + r()*10);
      g += `<path d="M${x0.toFixed(0)},${y0.toFixed(0)} q${(lean*.5 - 7).toFixed(0)},${(len*.42).toFixed(0)} ${lean.toFixed(0)},${len.toFixed(0)}" fill="none" stroke="${A}" stroke-width="${(.9 + r()*1.3).toFixed(1)}" stroke-linecap="round" opacity="${(.16 + r()*.24).toFixed(2)}"/>`;
    }
  });
  return g;
}
function mountain(u, cx, base, w, h, seedOrR, {far=false, texture=true, edge=true} = {}){
  const r = typeof seedOrR === 'function' ? seedOrR : mulberry32(hashSeed(seedOrR));
  const pts = peakPoints(cx, base, w, h, r);
  const d = smoothClosed(pts);
  return `<g><path d="${d}" fill="url(#${u}${far?'f':'w'})"/>`
    + (edge ? `<path d="${d}" fill="none" stroke="url(#${u}l)" stroke-width="${far?1.5:2.4}" stroke-linejoin="round" stroke-linecap="round" opacity="${far?.45:.8}"/>` : '')
    + (texture && !far ? cunStrokes(pts, base, r) : '') + `</g>`;
}

/* ---------- trees ----------
   A pine is drawn branch by branch, and each branch ends in a fan of needles. */
function needles(x, y, rad, dir, r, n=22){
  /* 松針 — one cluster is a wheel of fine strokes from a single point, drawn at
     two radii so it reads as a mass of needles and not as a star */
  const fan = (rad2, count, op) => Array.from({length:count}, (_,i) => {
    const a = -Math.PI*1.02 + (i/(count-1))*Math.PI*1.04 + (dir<0 ? .2 : dir>0 ? -.2 : 0);
    const len = rad2*(.68 + r()*.4);
    return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x+Math.cos(a)*len).toFixed(0)}" y2="${(y-Math.sin(a)*len*.8).toFixed(0)}" opacity="${op}"/>`; }).join('');
  return `<g stroke="${A}" stroke-width="1" stroke-linecap="round">${fan(rad, n, .42)}${fan(rad*.66, Math.round(n*.7), .34)}${fan(rad*.4, Math.round(n*.5), .28)}</g>`;
}
function pine(x, base, s=1, seed='pine'){
  const r = mulberry32(hashSeed(seed)); const h = 148*s;
  /* the trunk leans and kinks — a straight pine is not a pine */
  let g = `<path d="M${x},${base} C${(x-9*s).toFixed(0)},${(base-h*.34).toFixed(0)} ${(x+13*s).toFixed(0)},${(base-h*.58).toFixed(0)} ${(x+4*s).toFixed(0)},${(base-h*.92).toFixed(0)}" fill="none" stroke="${A}" stroke-width="${(3.6*s).toFixed(1)}" stroke-linecap="round" opacity=".5"/>`;
  /* seven small clusters overlapping into one canopy, not four spikes on sticks */
  const boughs = [[-30,.52,.9],[26,.6,.85],[-24,.7,.8],[22,.78,.75],[-14,.86,.7],[12,.9,.62],[0,.99,.9]];
  boughs.forEach(([dx, t, k], i) => {
    const bx = x + dx*s*(1 + r()*.2), by = base - h*t;
    if(Math.abs(dx) > 6) g += `<path d="M${(x + (dx>0?3:-3)*s).toFixed(0)},${(by + 7*s).toFixed(0)} Q${(x+dx*.55*s).toFixed(0)},${(by+2*s).toFixed(0)} ${bx.toFixed(0)},${by.toFixed(0)}" fill="none" stroke="${A}" stroke-width="${(1.6*s).toFixed(1)}" stroke-linecap="round" opacity=".42"/>`;
    g += needles(bx, by, (17 + i%3*4)*k*s*1.5, dx > 0 ? 1 : dx < 0 ? -1 : 0, r, 20);
  });
  return g;
}
/* bamboo: the culm leans, tapers, and stops — with the leaves at its head */
function bamboo(x, base, s=1, seed='bam'){
  const r = mulberry32(hashSeed(seed)); const h = (210 + r()*130)*s, segs = 5 + Math.floor(r()*2);
  const lean = (r()-.5)*88*s;
  let g = '';
  for(let i=0;i<segs;i++){                                     // each internode drawn on its own, thinning upward
    const t0 = i/segs, t1 = (i+1)/segs;
    const x0 = x + lean*t0*t0, y0 = base - h*t0, x1 = x + lean*t1*t1, y1 = base - h*t1;
    g += `<line x1="${x0.toFixed(0)}" y1="${y0.toFixed(0)}" x2="${x1.toFixed(0)}" y2="${y1.toFixed(0)}" stroke="${A}" stroke-width="${((4.6 - i*.55)*s).toFixed(1)}" stroke-linecap="round" opacity="${(.5 - i*.03).toFixed(2)}"/>`;
    if(i) g += `<line x1="${(x0-4.5*s).toFixed(0)}" y1="${y0.toFixed(0)}" x2="${(x0+4.5*s).toFixed(0)}" y2="${y0.toFixed(0)}" stroke="${A}" stroke-width="${(1.5*s).toFixed(1)}" opacity=".42"/>`;
    if(i >= segs-3) g += leaves(x0, y0, s*(.7+r()*.5), i%2 ? 1 : -1, r);
  }
  return g + leaves(x + lean, base - h, s*(.8+r()*.4), r()>.5?1:-1, r);
}
function leaves(x, y, s, dir, r){
  /* 竹葉 — one stroke each, hanging down and out: wide where the brush lands,
     tapering to a point. Three of them make the 个 the manuals start from. */
  return `<g fill="${A}" opacity=".4">` + Array.from({length:3}, (_,i) => {
    const a = (32 + i*20 + r()*14) * Math.PI/180;          // always well below the horizontal
    const L = (34 + r()*24)*s, w = L*(.16 + r()*.05);
    const dx = Math.cos(a)*L*dir, dy = Math.sin(a)*L;
    const px = -dy/L*w*dir, py = dx/L*w*dir;               // the belly of the stroke
    const mx = x + dx*.36, my = y + dy*.36;
    const n = v => v.toFixed(0);
    return `<path d="M${n(x)},${n(y)} Q${n(mx+px)},${n(my+py)} ${n(x+dx)},${n(y+dy)} Q${n(mx-px*.32)},${n(my-py*.32)} ${n(x)},${n(y)} Z"/>`;
  }).join('') + `</g>`;
}
/* a plum branch: the one thing in this vocabulary that blossoms */
function plumBranch(x, y, s=1, seed='mei'){
  const r = mulberry32(hashSeed(seed));
  let g = `<path d="M${x},${y} C${(x+120*s).toFixed(0)},${(y-40*s).toFixed(0)} ${(x+210*s).toFixed(0)},${(y-30*s).toFixed(0)} ${(x+340*s).toFixed(0)},${(y-120*s).toFixed(0)}" fill="none" stroke="${A}" stroke-width="${(5*s).toFixed(1)}" stroke-linecap="round" opacity=".55"/>`;
  const twigs = 5;
  for(let i=0;i<twigs;i++){
    const t = .18 + i*.18, bx = x + 340*s*t, by = y - (40*s*t + 90*s*t*t*t*3);
    const up = i%2 ? -1 : 1, len = (60+r()*70)*s;
    const ex = bx + len*.7, ey = by + up*len*.8;
    g += `<path d="M${bx.toFixed(0)},${by.toFixed(0)} Q${(bx+len*.3).toFixed(0)},${(by+up*len*.55).toFixed(0)} ${ex.toFixed(0)},${ey.toFixed(0)}" fill="none" stroke="${A}" stroke-width="${(2.2*s).toFixed(1)}" stroke-linecap="round" opacity=".45"/>`;
    for(let b=0;b<3;b++){ const bt = .4 + b*.3;
      g += blossom(bx + (ex-bx)*bt + (r()-.5)*14*s, by + (ey-by)*bt + (r()-.5)*14*s, (7+r()*4)*s); }
  }
  return g;
}
function blossom(x, y, rad){
  return `<g opacity=".5">` + Array.from({length:5}, (_,i) => { const a = -Math.PI/2 + i*Math.PI*2/5;
    return `<circle cx="${(x+Math.cos(a)*rad*.72).toFixed(1)}" cy="${(y+Math.sin(a)*rad*.72).toFixed(1)}" r="${(rad*.62).toFixed(1)}" fill="none" stroke="${A}" stroke-width="1.4"/>`; }).join('')
    + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rad*.2).toFixed(1)}" fill="${A}"/></g>`;
}

/* ---------- what people built ----------
   The pavilion roof is the giveaway: it sags in the middle and flicks up at
   the eaves, and it is always drawn wider than the thing holding it up. */
function pavilion(x, base, s=1){
  const w = 74*s, ry = base - 92*s;
  return `<g stroke="${A}" fill="none" stroke-width="${(2.2*s).toFixed(1)}" stroke-linecap="round" opacity=".6">
    <path d="M${(x-w).toFixed(0)},${(ry-10*s).toFixed(0)} Q${(x-w*.5).toFixed(0)},${(ry+9*s).toFixed(0)} ${x},${(ry+5*s).toFixed(0)} Q${(x+w*.5).toFixed(0)},${(ry+9*s).toFixed(0)} ${(x+w).toFixed(0)},${(ry-10*s).toFixed(0)}"/>
    <path d="M${(x-w*.62).toFixed(0)},${(ry-6*s).toFixed(0)} Q${x},${(ry-26*s).toFixed(0)} ${(x+w*.62).toFixed(0)},${(ry-6*s).toFixed(0)}"/>
    <path d="M${x},${(ry-24*s).toFixed(0)} v${(-12*s).toFixed(0)}"/>
    <path d="M${(x-w*.6).toFixed(0)},${(ry+7*s).toFixed(0)} v${(72*s).toFixed(0)} M${(x+w*.6).toFixed(0)},${(ry+7*s).toFixed(0)} v${(72*s).toFixed(0)}"/>
    <path d="M${(x-w*.78).toFixed(0)},${base} h${(w*1.56).toFixed(0)}"/>
    <path d="M${(x-w*.6).toFixed(0)},${(base-26*s).toFixed(0)} h${(w*1.2).toFixed(0)}"/></g>`;
}
/* a thatched hut: softer, shaggier, lower to the ground */
function hut(x, base, s=1){
  const w = 56*s, ry = base - 62*s;
  return `<g stroke="${A}" fill="none" stroke-width="${(2.2*s).toFixed(1)}" stroke-linecap="round" opacity=".58">
    <path d="M${(x-w).toFixed(0)},${ry.toFixed(0)} Q${(x-w*.4).toFixed(0)},${(ry-30*s).toFixed(0)} ${x},${(ry-32*s).toFixed(0)} Q${(x+w*.4).toFixed(0)},${(ry-30*s).toFixed(0)} ${(x+w).toFixed(0)},${ry.toFixed(0)}"/>
    <path d="M${(x-w).toFixed(0)},${ry.toFixed(0)} q${(w*.3).toFixed(0)},${(6*s).toFixed(0)} ${(w*.6).toFixed(0)},0 q${(w*.3).toFixed(0)},${(6*s).toFixed(0)} ${(w*.6).toFixed(0)},0 q${(w*.3).toFixed(0)},${(6*s).toFixed(0)} ${(w*.6).toFixed(0)},0" opacity=".7"/>
    <path d="M${(x-w*.7).toFixed(0)},${(ry+4*s).toFixed(0)} v${(58*s).toFixed(0)} M${(x+w*.7).toFixed(0)},${(ry+4*s).toFixed(0)} v${(58*s).toFixed(0)}"/>
    <path d="M${(x-w*.7).toFixed(0)},${base} h${(w*1.4).toFixed(0)}"/>
    <path d="M${(x-11*s).toFixed(0)},${base} v${(-32*s).toFixed(0)} h${(22*s).toFixed(0)} v${(32*s).toFixed(0)}"/></g>`;
}
/* a plank bridge over the gap where the stream is not drawn */
function bridge(x, y, w, s=1){
  return `<g stroke="${A}" fill="none" stroke-width="${(2*s).toFixed(1)}" stroke-linecap="round" opacity=".5">
    <path d="M${(x-w/2).toFixed(0)},${y.toFixed(0)} Q${x},${(y-16*s).toFixed(0)} ${(x+w/2).toFixed(0)},${y.toFixed(0)}"/>
    <path d="M${(x-w/2).toFixed(0)},${(y+7*s).toFixed(0)} Q${x},${(y-9*s).toFixed(0)} ${(x+w/2).toFixed(0)},${(y+7*s).toFixed(0)}"/>
    ${Array.from({length:5},(_,i)=>{const t=(i+.5)/5, px=x-w/2+w*t, py=y-16*s*4*t*(1-t)+2*s; return `<line x1="${px.toFixed(0)}" y1="${py.toFixed(0)}" x2="${px.toFixed(0)}" y2="${(py-13*s).toFixed(0)}"/>`;}).join('')}</g>`;
}
/* ---------- who is in it ----------
   Always small. The point of the figure is the scale of everything else. */
function figure(x, base, s=1, pole=false){
  return `<g stroke="${A}" fill="none" stroke-width="${(1.6*s).toFixed(1)}" stroke-linecap="round" opacity=".6">
    <circle cx="${x}" cy="${(base-22*s).toFixed(0)}" r="${(4.4*s).toFixed(1)}"/>
    <path d="M${x},${(base-17*s).toFixed(0)} q${(-8*s).toFixed(0)},${(6*s).toFixed(0)} ${(-7*s).toFixed(0)},${(17*s).toFixed(0)} h${(14*s).toFixed(0)} q${(1*s).toFixed(0)},${(-11*s).toFixed(0)} ${(-7*s).toFixed(0)},${(-17*s).toFixed(0)} Z" fill="${A}" fill-opacity=".2"/>
    ${pole?`<line x1="${(x+7*s).toFixed(0)}" y1="${(base-34*s).toFixed(0)}" x2="${(x-4*s).toFixed(0)}" y2="${(base+8*s).toFixed(0)}"/>`:''}</g>`;
}
/* one boat, one boatman, and a great deal of nothing around them */
function boat(x, y, s=1){
  const w = 52*s;
  return `<g stroke="${A}" fill="none" stroke-width="${(2*s).toFixed(1)}" stroke-linecap="round" opacity=".62">
    <path d="M${(x-w).toFixed(0)},${(y-7*s).toFixed(0)} Q${x},${(y+10*s).toFixed(0)} ${(x+w).toFixed(0)},${(y-7*s).toFixed(0)}"/>
    <path d="M${(x-w).toFixed(0)},${(y-7*s).toFixed(0)} q${(w*.2).toFixed(0)},${(-6*s).toFixed(0)} ${(w*.34).toFixed(0)},${(-4*s).toFixed(0)} M${(x+w).toFixed(0)},${(y-7*s).toFixed(0)} q${(-w*.2).toFixed(0)},${(-6*s).toFixed(0)} ${(-w*.34).toFixed(0)},${(-4*s).toFixed(0)}"/>
    <path d="M${(x-16*s).toFixed(0)},${(y-9*s).toFixed(0)} q${(16*s).toFixed(0)},${(-19*s).toFixed(0)} ${(32*s).toFixed(0)},0"/></g>${figure(x-30*s, y-4*s, s*.8, true)}`;
}
/* geese, going somewhere else */
function geese(x, y, n=6, s=1, seed='yan'){
  const r = mulberry32(hashSeed(seed));
  return `<g stroke="${A}" fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".45">`
    + Array.from({length:n}, (_,i) => { const k = s*(1 - i*.08), px = x + i*30*k + (r()-.5)*16, py = y + i*17*k + (r()-.5)*12;
        return `<path d="M${(px-8*k).toFixed(0)},${py.toFixed(0)} q${(4*k).toFixed(0)},${(-5*k).toFixed(0)} ${(8*k).toFixed(0)},${(-1*k).toFixed(0)} q${(4*k).toFixed(0)},${(-4*k).toFixed(0)} ${(8*k).toFixed(0)},${(1*k).toFixed(0)}"/>`; }).join('')
    + `</g>`;
}
/* ---------- water, mist, sky ---------- */
function water(y, x0, x1, n=7, seed='shui'){
  const r = mulberry32(hashSeed(seed));
  return `<g stroke="${A}" fill="none" stroke-width="1.4" stroke-linecap="round">`
    + Array.from({length:n}, (_,i) => { const yy = y + i*22 + r()*6, a = x0 + r()*(x1-x0)*.3, b = x1 - r()*(x1-x0)*.3;
        return `<path d="M${a.toFixed(0)},${yy.toFixed(0)} q${(((b-a)/2)).toFixed(0)},${(-4-r()*5).toFixed(0)} ${(b-a).toFixed(0)},0" opacity="${(.3 - i*.03).toFixed(2)}"/>`; }).join('')
    + `</g>`;
}
/* mist is three overlapping breaths of wash, not a band — it has to have no edge */
function mistBand(u, y, h, op=1){
  return `<g opacity="${op}">`
    + [[300, 1.05], [640, 1.3], [960, .95]].map(([cx, k]) =>
        `<ellipse cx="${cx}" cy="${(y + h/2 + (cx%160)/8).toFixed(0)}" rx="${(430*k).toFixed(0)}" ry="${(h*.72).toFixed(0)}" fill="url(#${u}h)"/>`).join('')
    + `</g>`;
}
/* a blank disc with the wash pulled back from it — the moon is not painted, the sky around it is */
function sunDisc(x, y, rad){
  return `<circle cx="${x}" cy="${y}" r="${(rad*1.9).toFixed(0)}" fill="${G1}" opacity=".07"/>
    <circle cx="${x}" cy="${y}" r="${rad}" fill="${A}" opacity=".09"/>
    <circle cx="${x}" cy="${y}" r="${rad}" fill="none" stroke="${A}" stroke-width="1.4" opacity=".3"/>`;
}
function moonDisc(x, y, rad){
  return `<circle cx="${x}" cy="${y}" r="${(rad*1.7).toFixed(0)}" fill="none" stroke="${G2}" stroke-width="${(rad*.55).toFixed(0)}" opacity=".07"/>
    <circle cx="${x}" cy="${y}" r="${rad}" fill="none" stroke="${A}" stroke-width="1.3" opacity=".3"/>`;
}
/* 祥云 — the scrolling cloud band, drawn as a run of small spirals */
function ruyiCloud(x, y, s=1, n=4){
  return `<g stroke="${A}" fill="none" stroke-width="${(1.8*s).toFixed(1)}" stroke-linecap="round" opacity=".3">`
    + Array.from({length:n}, (_,i) => { const px = x + i*62*s, dy = (i%2 ? -6 : 4)*s;
        return `<path d="M${px.toFixed(0)},${(y+dy).toFixed(0)} q${(16*s).toFixed(0)},${(-15*s).toFixed(0)} ${(30*s).toFixed(0)},${(-3*s).toFixed(0)} q${(9*s).toFixed(0)},${(9*s).toFixed(0)} ${(-2*s).toFixed(0)},${(11*s).toFixed(0)} q${(-9*s).toFixed(0)},${(1*s).toFixed(0)} ${(-7*s).toFixed(0)},${(-8*s).toFixed(0)}"/>`; }).join('')
    + `<path d="M${x.toFixed(0)},${(y+16*s).toFixed(0)} h${(n*62*s).toFixed(0)}" opacity=".5"/></g>`;
}
/* ---------- the marks a painter leaves ---------- */
function seal(x, y, size, chars='生'){
  const c = Array.from(chars).slice(0,2);
  return `<g opacity=".42"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="3" fill="none" stroke="${SEAL_RED}" stroke-width="${(size*.09).toFixed(1)}"/>
    <text x="${(x+size/2).toFixed(0)}" y="${(y+size*(c.length>1?.44:.7)).toFixed(0)}" text-anchor="middle" fill="${SEAL_RED}" style="font-size:${(size*(c.length>1?.44:.62)).toFixed(0)}px;font-family:var(--serif)">${c[0]}</text>
    ${c[1]?`<text x="${(x+size/2).toFixed(0)}" y="${(y+size*.88).toFixed(0)}" text-anchor="middle" fill="${SEAL_RED}" style="font-size:${(size*.44).toFixed(0)}px;font-family:var(--serif)">${c[1]}</text>`:''}</g>`;
}
/* 题跋 — the column of characters written into the empty half of the picture */
function inscription(x, y, chars, size=26){
  return `<g fill="${A}" opacity=".3" style="font-family:var(--serif)">`
    + Array.from(chars).map((c,i) => `<text x="${x}" y="${(y+i*size*1.28).toFixed(0)}" text-anchor="middle" style="font-size:${size}px">${c}</text>`).join('')
    + `</g>`;
}

/* ============================================================
   THE ROOMS
   ============================================================ */
const PAGE_SCENES = {
  /* a thatched hut under pines at the foot of the mountain */
  home: scene((u,r) => `${mountain(u, 880, 610, 760, 430, 'home-far', {far:true})}
    ${mountain(u, 420, 640, 620, 330, 'home-main')}
    ${mistBand(u, 560, 90)}
    ${pine(268, 660, 1)}${pine(206, 668, .72, 'p2')}
    ${hut(360, 668, 1)}
    ${water(690, 120, 1080, 4, 'home-w')}
    ${geese(760, 168, 5, 1, 'home-g')}
    ${inscription(1092, 150, '山中無曆日', 24)}${seal(1072, 340, 40, '家')}`),

  /* first light on the river: one boat, and the geese going the other way */
  today: scene((u,r) => `${mountain(u, 300, 560, 700, 300, 'today-far', {far:true})}
    ${mountain(u, 960, 580, 620, 380, 'today-main')}
    ${sunDisc(430, 210, 62)}
    ${mistBand(u, 520, 110)}
    ${water(628, 90, 1110, 6, 'today-w')}
    ${boat(470, 690, 1)}
    ${geese(150, 150, 6, 1.05, 'today-g')}
    ${ruyiCloud(760, 250, .9, 3)}
    ${inscription(1104, 130, '朝', 30)}${seal(1084, 200, 38, '今')}`),

  /* a stream stepping down the rock in stages, the same fall repeating */
  rhythm: scene((u,r) => `${mountain(u, 620, 700, 900, 560, 'rhy-main')}
    <g stroke="${A}" fill="none" stroke-width="2" opacity=".4" stroke-linecap="round">
      ${Array.from({length:5},(_,i)=>{const y=250+i*88, x=560+i*26; return `<path d="M${x},${y} q14,${44} -6,${70}"/><path d="M${x+26},${y} q14,${44} -6,${70}"/><path d="M${x-14},${y+70} h60"/>`;}).join('')}</g>
    ${mistBand(u, 330, 70, .8)}${mistBand(u, 520, 80)}
    ${pine(300, 690, .92, 'rhy-p')}${bamboo(232, 700, .6, 'rhy-b')}
    ${water(700, 380, 980, 3, 'rhy-w')}
    ${moonDisc(980, 180, 44)}
    ${inscription(150, 200, '日日是好日', 24)}${seal(126, 400, 38, '節')}`),

  /* rain over a bamboo grove, seen through a window */
  journals: scene((u,r) => `${mountain(u, 900, 520, 660, 260, 'jr-far', {far:true})}
    <g stroke="${A}" opacity=".2" stroke-width="1.1" stroke-linecap="round">${Array.from({length:80},(_,i)=>{const x=(i*163)%SC_W, y=(i*211)%680, L=26+((i*37)%34); return `<line x1="${x}" y1="${y}" x2="${x-L*.2}" y2="${y+L}"/>`;}).join('')}</g>
    ${[0,1,2,3,4,5].map(i=>bamboo(150+i*160, 730, .9+((i*7)%3)*.14, 'jr'+i)).join('')}
    ${mistBand(u, 470, 90)}
    <rect x="70" y="40" width="${SC_W-140}" height="${SC_H-20}" fill="none" stroke="${A}" stroke-width="3" opacity=".22"/>
    <line x1="${SC_W/2}" y1="40" x2="${SC_W/2}" y2="${SC_H}" stroke="${A}" stroke-width="2.4" opacity=".16"/>
    ${seal(1058, 88, 40, '記')}`),

  /* the scholar's table: scrolls, an inkstone, and the lamp that keeps you up */
  commonplace: scene((u,r) => `${mountain(u, 260, 470, 600, 250, 'cm-far', {far:true})}
    ${mistBand(u, 400, 80)}
    <g stroke="${A}" fill="none" stroke-width="2.2" stroke-linecap="round" opacity=".5">
      <line x1="190" y1="646" x2="1010" y2="646"/>
      <path d="M250,646 v-34 M980,646 v-34"/>
      <path d="M430,612 q64,-30 128,0 q64,-30 128,0"/>
      <path d="M430,612 q10,-44 8,-70 q56,-24 120,4 q64,-28 120,-4 q-2,26 8,70"/>
      <path d="M558,616 v-70"/>
      ${Array.from({length:4},(_,i)=>`<line x1="${470+i*4}" y1="572" x2="${520-i*3}" y2="${572}"/>`).join('')}
      <rect x="770" y="556" width="52" height="60" rx="4"/>
      <path d="M782,556 v-52 M796,556 v-64 M810,556 v-46"/>
      <ellipse cx="336" cy="632" rx="44" ry="12"/><path d="M292,632 q44,18 88,0"/>
      <path d="M900,616 q-26,-14 -26,-34 q0,-22 26,-22 q26,0 26,22 q0,20 -26,34 Z"/></g>
    ${pine(1080, 662, .74, 'cm-p')}
    ${inscription(150, 210, '讀書隨處淨土', 22)}${seal(128, 430, 36, '摘')}`),

  /* the poem is not written yet: a pavilion by the water and most of the page empty */
  writing: scene((u,r) => `${mountain(u, 210, 560, 620, 320, 'wr-far', {far:true})}
    ${mistBand(u, 500, 90)}
    ${pavilion(330, 640, 1.05)}${figure(330, 636, .95)}
    ${pine(452, 646, .8, 'wr-p')}
    ${water(690, 140, 1000, 4, 'wr-w')}
    ${moonDisc(900, 200, 50)}
    ${inscription(1040, 170, '筆墨當隨時代', 26)}${seal(1018, 400, 44, '書')}`),

  /* a village stepping up the slope, lanterns lit, work still going on */
  projects: scene((u,r) => `${mountain(u, 780, 620, 820, 470, 'pj-main')}
    ${mountain(u, 180, 600, 560, 280, 'pj-far', {far:true})}
    ${hut(300, 640, .84)}${hut(430, 592, .74)}${pavilion(580, 546, .8)}${hut(700, 500, .64)}
    ${mistBand(u, 470, 80)}
    <g opacity=".42">${[[352,596],[482,548],[642,502]].map(([x,y])=>`<line x1="${x}" y1="${y-30}" x2="${x}" y2="${y-14}" stroke="${A}" stroke-width="1.6"/><ellipse cx="${x}" cy="${y}" rx="12" ry="15" fill="${A}" fill-opacity=".2" stroke="${A}" stroke-width="1.6"/>`).join('')}</g>
    ${bridge(420, 690, 130, 1)}
    ${water(716, 160, 1040, 2, 'pj-w')}
    ${seal(1080, 130, 42, '作')}`),

  /* sun and moon travelling the same arc over the same mountain */
  rituals: scene((u,r) => `${mountain(u, 600, 660, 760, 380, 'ri-main')}
    <path d="M140,660 A470,470 0 0 1 1060,660" fill="none" stroke="${A}" stroke-width="1.8" opacity=".3" stroke-dasharray="8 14"/>
    ${sunDisc(330, 330, 46)}
    ${moonDisc(880, 330, 44)}
    ${mistBand(u, 540, 80)}
    ${pine(210, 700, .8, 'ri-p')}${pine(1010, 706, .68, 'ri-p2')}
    ${inscription(600, 178, '循環', 26)}${seal(1080, 620, 38, '常')}`),

  /* a still lake, and the mountain again, upside down */
  reviews: scene((u,r) => `${mountain(u, 640, 430, 800, 340, 'rv-main')}
    ${mountain(u, 220, 420, 500, 220, 'rv-far', {far:true})}
    <line x1="0" y1="440" x2="${SC_W}" y2="440" stroke="${A}" stroke-width="2" opacity=".3"/>
    <clipPath id="${u}refl"><rect x="0" y="442" width="${SC_W}" height="${SC_H-442}"/></clipPath>
    <g clip-path="url(#${u}refl)" opacity=".26"><g transform="translate(0,884) scale(1,-1)">${mountain(u, 640, 430, 800, 280, 'rv-main', {texture:false})}</g></g>
    ${mistBand(u, 400, 80)}
    ${boat(880, 560, .8)}
    ${water(600, 120, 1080, 4, 'rv-w')}
    ${moonDisc(960, 180, 46)}
    ${inscription(120, 170, '照見', 26)}${seal(100, 300, 38, '省')}`),

  /* one pine on a bare rock: in this tradition that is what integrity looks like */
  values: scene((u,r) => `${mountain(u, 950, 620, 700, 400, 'vl-far', {far:true})}
    ${mountain(u, 230, 790, 620, 250, 'vl-rock')}
    ${pine(226, 556, 1.3, 'vl-pine')}
    ${mistBand(u, 520, 100)}
    ${geese(700, 200, 4, .9, 'vl-g')}
    ${water(660, 480, 1120, 3, 'vl-w')}
    ${inscription(700, 300, '歲寒然後知松柏之後凋', 22)}${seal(1080, 620, 40, '志')}`),

  /* the grove: every culm the same plant, none of them the same height */
  skills: scene((u,r) => `${mountain(u, 1000, 540, 620, 260, 'sk-far', {far:true})}
    ${[0,1,2,3,4,5,6,7].map(i=>bamboo(110+i*140, 740, .78+((i*11)%4)*.16, 'sk'+i)).join('')}
    ${mistBand(u, 480, 90)}
    <g stroke="${A}" fill="none" stroke-width="1.4" opacity=".2">${Array.from({length:5},(_,i)=>`<path d="M60,${560+i*40} q560,${-16-i*6} 1080,${8+i*4}"/>`).join('')}</g>
    ${seal(1076, 132, 42, '藝')}`),

  /* the road into the mountains, and one traveller a long way up it */
  spiral: scene((u,r) => `${mountain(u, 640, 520, 900, 460, 'vs-peak')}
    ${mountain(u, 200, 600, 620, 300, 'vs-left', {far:true})}
    ${mountain(u, 1080, 620, 560, 340, 'vs-right', {far:true})}
    ${mistBand(u, 440, 90)}${mistBand(u, 570, 80, .8)}
    <path d="M600,${SC_H} q60,-130 -20,-216 q-76,-84 24,-172" fill="none" stroke="${A}" stroke-width="2.2" opacity=".34" stroke-dasharray="12 15"/>
    ${figure(590, 690, 1)}
    ${ruyiCloud(200, 210, 1, 4)}
    ${moonDisc(1000, 160, 52)}
    ${inscription(126, 420, '行到水窮處', 24)}${seal(104, 610, 40, '志')}`),

  /* ridge behind ridge behind ridge, each one paler than the last */
  timeline: scene((u,r) => `${mountain(u, 300, 380, 700, 210, 'tl-4', {far:true, texture:false})}
    ${mountain(u, 820, 440, 760, 250, 'tl-3', {far:true, texture:false})}
    ${mountain(u, 420, 520, 720, 260, 'tl-2', {far:true})}
    ${mountain(u, 900, 610, 700, 300, 'tl-1')}
    ${mistBand(u, 350, 70, .7)}${mistBand(u, 460, 80, .85)}${mistBand(u, 560, 90)}
    ${water(680, 80, 1120, 4, 'tl-w')}
    ${boat(300, 700, .85)}
    ${geese(640, 140, 6, 1, 'tl-g')}
    ${seal(1080, 660, 40, '憶')}`),

  /* 九九消寒圖 — the plum-blossom calendar: one petal filled for each day */
  calendar: scene((u,r) => `${mountain(u, 260, 560, 620, 250, 'cal-far', {far:true})}
    ${plumBranch(120, 620, 1.5, 'cal-mei')}
    ${plumBranch(560, 380, 1.1, 'cal-mei2')}
    ${mistBand(u, 520, 90)}
    ${moonDisc(1040, 170, 46)}
    ${inscription(1044, 340, '九九消寒', 24)}${seal(1024, 500, 38, '曆')}`),

  /* 雅集 — the gathering: four of them, under a pine, near the water */
  people: scene((u,r) => `${mountain(u, 940, 560, 660, 320, 'pl-far', {far:true})}
    ${mountain(u, 260, 660, 560, 240, 'pl-near')}
    ${pine(300, 618, 1.1, 'pl-p')}
    ${mistBand(u, 470, 90)}
    ${[[420,652,1.5],[498,660,1.35],[582,654,1.55],[660,662,1.3]].map(([x,y,s],i)=>figure(x,y,s,i===3)).join('')}
    <g stroke="${A}" fill="none" stroke-width="1.3" stroke-dasharray="4 7" opacity=".28"><path d="M430,606 q38,-30 72,-16"/><path d="M508,612 q42,-26 78,-8"/><path d="M592,608 q36,-16 72,6"/></g>
    ${pavilion(880, 660, .9)}
    ${bridge(760, 700, 120, .9)}
    ${water(716, 200, 1040, 2, 'pl-w')}
    ${seal(1084, 140, 40, '緣')}`),

  /* terraces cut into the hill: the material floor, and the work that keeps it */
  finance: scene((u,r) => `${mountain(u, 900, 560, 760, 340, 'fn-far', {far:true})}
    <g fill="none" stroke="${A}" stroke-width="1.8" opacity=".38">${Array.from({length:7},(_,i)=>`<path d="M${90+i*18},${700-i*54} q${260-i*20},${-30-i*4} ${560-i*44},${6+i*3}"/>`).join('')}</g>
    <g fill="url(#${u}w)" opacity=".5">${Array.from({length:6},(_,i)=>`<path d="M${90+i*18},${700-i*54} q${260-i*20},${-30-i*4} ${560-i*44},${6+i*3} l0,${44} q${-(300-i*24)},${28+i*4} ${-(560-i*44)},${-6-i*3} Z"/>`).join('')}</g>
    ${hut(830, 640, .72)}${pine(950, 660, .68, 'fn-p')}
    ${mistBand(u, 480, 90)}
    ${water(720, 620, 1120, 2, 'fn-w')}
    ${inscription(1084, 190, '積', 30)}${seal(1064, 260, 38, '財')}`),

  /* a hand scroll, half unrolled, with the mountains painted inside it */
  settings: scene((u,r) => `<g stroke="${A}" fill="none" stroke-width="2.2" opacity=".42">
      <path d="M330,240 v250 M312,490 q18,80 18,150 q0,-70 18,-150 Z" fill="${A}" fill-opacity=".12"/>
      <rect x="306" y="222" width="48" height="26" rx="4"/>
      <rect x="470" y="430" width="66" height="180" rx="6"/><line x1="470" y1="470" x2="536" y2="470"/>
      <ellipse cx="760" cy="560" rx="118" ry="62"/><ellipse cx="760" cy="548" rx="86" ry="40"/>
      <path d="M900,610 h220 v-150 l-40,-34 h-180 Z"/><path d="M1080,426 v34 h40"/></g>
    ${mistBand(u, 300, 90, .6)}
    ${seal(1090, 130, 40, '具')}`),
};
PAGE_SCENES.lifetape = PAGE_SCENES.rhythm;
PAGE_SCENES.needs    = PAGE_SCENES.values;
PAGE_SCENES.compass  = PAGE_SCENES.home;
PAGE_SCENES.plan     = PAGE_SCENES.rhythm;
PAGE_SCENES.board    = PAGE_SCENES.compass;
PAGE_SCENES.tag      = PAGE_SCENES.journals;
PAGE_SCENES.habits   = PAGE_SCENES.rituals;
PAGE_SCENES.review   = PAGE_SCENES.reviews;

/* ---------- a painting no other record has ----------
   The same brush, but the composition comes out of the record's id: how many
   ridges, where the summit falls, whether there is a boat on the water. */
function recordMotifSVG(seedStr, color){
  const r = mulberry32(hashSeed(seedStr)); const ink = color || A;
  const u = 'k' + (++_scId) + '_';
  const ridges = 2 + Math.floor(r()*3);
  let g = '';
  for(let i = ridges; i >= 0; i--){
    const far = i > 0;
    const cx = 180 + r()*840, base = 400 + i*0 + (ridges-i)*72 + r()*40;
    const w = 480 + r()*520, h = 180 + r()*280 - i*20;
    g += mountain(u, cx, base, w, h, r, {far, texture: !far});
  }
  g += mistBand(u, 420 + r()*80, 90) + mistBand(u, 540 + r()*70, 80, .8);
  const trees = 1 + Math.floor(r()*3);
  for(let i=0;i<trees;i++) g += (r() > .45 ? pine : bamboo)(120 + r()*300, 660 + r()*70, .6 + r()*.6, seedStr + 'tree' + i);
  if(r() > .45) g += pavilion(700 + r()*260, 640 + r()*40, .7 + r()*.35);
  if(r() > .5)  g += hut(260 + r()*180, 660 + r()*30, .7);
  g += water(660 + r()*40, 120 + r()*160, 900 + r()*260, 3, seedStr + 'w');
  if(r() > .4)  g += boat(420 + r()*400, 700 + r()*30, .8);
  if(r() > .55) g += geese(160 + r()*300, 130 + r()*90, 4 + Math.floor(r()*3), .9, seedStr + 'g');
  if(r() > .5)  g += moonDisc(880 + r()*180, 150 + r()*80, 38 + r()*22);
  else          g += ruyiCloud(160 + r()*200, 180 + r()*70, .9, 3);
  g += seal(1040 + r()*30, 120 + r()*480, 38, '印');
  return `<svg viewBox="0 0 ${SC_W} ${SC_H}" preserveAspectRatio="xMidYMax slice" class="scene-svg">${scDefs(u, ink)}${g}</svg>`;
}

/* which record, if any, this route is about */
function routeRecord(){
  const {name, params} = parseHash(); const id = params[0]; if(!id) return null;
  const pick = (list, colorKey) => { const rec = byId(list||[], id); return rec ? {id, color: colorKey ? (rec[colorKey] || null) : null, name: rec.name || rec.title} : null; };
  switch(name){
    case 'stage':    return pick(S.stages, 'hue');
    case 'value':    return pick(S.values, 'color');
    case 'skills':   { const s = byId(S.skills, id); return s ? {id, color: catColor(s.cat), name:s.name} : null; }
    case 'projects': return pick(S.projects);
    case 'writing':  { const w = byId(S.entries, id); return w ? {id, color:null, name:w.title} : null; }
    case 'commonplace': { const m = byId(S.entries, id); return m ? {id, color:(MEDIA_KINDS[m.extra?.kind]||[])[2]||null, name:m.title} : null; }
    case 'people':   return pick(S.people);
    case 'tag':      return {id:'tag:'+id, color:null, name:id};
    default: return null;
  }
}
let _sceneKey = null, _sceneLayer = 0;
function applyPageScene(){
  const layers = [document.getElementById('scA'), document.getElementById('scB')];
  if(!layers[0] || !layers[1]) return;
  const rec = routeRecord();
  const key = rec ? `rec:${rec.id}` : `page:${pageThemeKey()}`;
  if(key === _sceneKey) return;
  const svg = rec ? recordMotifSVG(rec.id, rec.color || A) : (PAGE_SCENES[pageThemeKey()] || PAGE_SCENES.compass || PAGE_SCENES.home)();
  const next = 1 - _sceneLayer;
  layers[next].innerHTML = svg; layers[next].classList.add('on'); layers[_sceneLayer].classList.remove('on');
  _sceneLayer = next; _sceneKey = key;
}
