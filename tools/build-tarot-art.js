#!/usr/bin/env node
/* ============================================================
   THE DECK, TRACED AND CUT DOWN TO SIZE

   Pamela Colman Smith's drawings for the 1909/1910 Rider deck are in the
   public domain, and vector tracings of all seventy-eight exist. The
   tracings are faithful and enormous: potrace emits a cubic for every
   wobble of the scanned line, and the set runs to seven megabytes, which
   is more than twice the whole of this house.

   This script is the reconciliation. The cards are drawn at 160 by 240 —
   a fifth of the traced resolution — so most of that detail is describing
   curvature finer than a pixel, and a great deal of it is speckle from the
   scan that never resolves into anything at all. So: flatten every curve
   to a polyline, throw away every point that is not further than the
   tolerance from the line its neighbours make (Douglas–Peucker), throw
   away every closed shape too small to see, and re-emit in integers.

   Run it by hand when the source changes; the output is committed, so a
   normal build never needs it:

     node tools/build-tarot-art.js ../georgestephanis/tarot/images

   Source of the tracings: the black-and-white SVGs bundled with
   github.com/georgestephanis/tarot, generated from the 1910 Rider-Waite
   deck and stated there to be public domain.
   ============================================================ */
const fs = require('fs'), path = require('path'), zlib = require('zlib');

const TOL = +(process.env.TOL || 1.1);      /* units, out of a 500-wide card */
const SPECK = +(process.env.SPECK || 2.2);  /* drop closed shapes smaller than this */

/* ---------- reading a path ----------
   Only what potrace actually emits, plus the handful of absolute forms
   that turn up in these files. Everything becomes absolute points. */
function parsePath(d){
  /* potrace writes numbers run together — "229.8.7" is 229.8 then .7 — so the
     tokeniser reads a number at a time rather than splitting on whitespace */
  const toks = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const subs = [];
  let cur = null, cmd = '', i = 0;
  let x = 0, y = 0, sx = 0, sy = 0, px = 0, py = 0;
  const num = () => +toks[i++];
  const open = () => { if(!cur){ cur = [[x, y]]; subs.push(cur); } return cur; };
  const line = (X, Y) => { open().push([X, Y]); x = X; y = Y; px = X; py = Y; };
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    const c = open();
    /* flattened to a polyline: sixteen steps is finer than anything that
       survives the simplifier, and costs nothing at build time */
    for(let t = 1; t <= 16; t++){
      const u = t / 16, v = 1 - u;
      c.push([v*v*v*x + 3*v*v*u*x1 + 3*v*u*u*x2 + u*u*u*x3,
              v*v*v*y + 3*v*v*u*y1 + 3*v*u*u*y2 + u*u*u*y3]);
    }
    px = x2; py = y2; x = x3; y = y3;
  };
  while(i < toks.length){
    if(/[A-Za-z]/.test(toks[i])){ cmd = toks[i]; i++; }
    else if(!cmd){ i++; continue; }
    const C = cmd.toUpperCase(), rel = cmd !== C;
    if(C === 'Z'){
      /* close: back to where the subpath started, and nothing more to read.
         The letter is already consumed — reading anything else here is what
         threw every coordinate after the first close out by one. */
      if(cur) cur.push([sx, sy]);
      x = sx; y = sy; px = x; py = y; cur = null; cmd = '';
      continue;
    }
    if(i >= toks.length || /[A-Za-z]/.test(toks[i])) continue;   /* no operands left */
    if(C === 'M'){
      const a = num(), b = num();
      x = rel ? x + a : a; y = rel ? y + b : b;
      sx = x; sy = y; px = x; py = y;
      cur = [[x, y]]; subs.push(cur);
      cmd = rel ? 'l' : 'L';                    /* further pairs after M are linetos */
    }
    else if(C === 'L'){ const a = num(), b = num(); line(rel ? x + a : a, rel ? y + b : b); }
    else if(C === 'H'){ const a = num(); line(rel ? x + a : a, y); }
    else if(C === 'V'){ const a = num(); line(x, rel ? y + a : a); }
    else if(C === 'C'){
      const a = num(), b = num(), c = num(), e = num(), f = num(), g = num();
      cubic(rel ? x+a : a, rel ? y+b : b, rel ? x+c : c, rel ? y+e : e, rel ? x+f : f, rel ? y+g : g);
    }
    else if(C === 'S'){
      const c = num(), e = num(), f = num(), g = num();
      cubic(2*x - px, 2*y - py, rel ? x+c : c, rel ? y+e : e, rel ? x+f : f, rel ? y+g : g);
    }
    else if(C === 'Q' || C === 'T'){
      let qx, qy, ex, ey;
      if(C === 'Q'){ const a = num(), b = num(), c = num(), e = num();
        qx = rel ? x+a : a; qy = rel ? y+b : b; ex = rel ? x+c : c; ey = rel ? y+e : e; }
      else { const c = num(), e = num();
        qx = 2*x - px; qy = 2*y - py; ex = rel ? x+c : c; ey = rel ? y+e : e; }
      const x0 = x, y0 = y;
      cubic(x0 + 2/3*(qx-x0), y0 + 2/3*(qy-y0), ex + 2/3*(qx-ex), ey + 2/3*(qy-ey), ex, ey);
      px = qx; py = qy;
    }
    else if(C === 'A'){
      num(); num(); num(); num(); num();
      const ex = num(), ey = num();
      line(rel ? x + ex : ex, rel ? y + ey : ey);
    }
    else { i++; }                                /* unknown: skip a token rather than spin */
  }
  return subs.filter(s => s && s.length > 1);
}

/* ---------- Douglas–Peucker ----------
   Keep the two ends, keep whichever point in between is furthest from the
   line they make, and recurse on the two halves — but only while that
   furthest point is further out than the tolerance. Everything nearer than
   that is describing a curve finer than the screen can draw. */
function simplify(pts, tol){
  if(pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length-1] = 1;
  const stack = [[0, pts.length-1]];
  const t2 = tol * tol;
  while(stack.length){
    const [a, b] = stack.pop();
    if(b - a < 2) continue;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = dx*dx + dy*dy;
    let far = -1, fd = -1;
    for(let i = a + 1; i < b; i++){
      const [px, py] = pts[i];
      let d;
      if(len === 0) d = (px-ax)*(px-ax) + (py-ay)*(py-ay);
      else { let u = ((px-ax)*dx + (py-ay)*dy) / len; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const qx = ax + u*dx - px, qy = ay + u*dy - py; d = qx*qx + qy*qy; }
      if(d > fd){ fd = d; far = i; }
    }
    if(fd > t2){ keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const bboxDiag = pts => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for(const [x, y] of pts){ if(x<x0)x0=x; if(y<y0)y0=y; if(x>x1)x1=x; if(y>y1)y1=y; }
  return Math.hypot(x1-x0, y1-y0);
};

/* ---------- writing it back out ----------
   Relative integers, and `l` takes as many pairs as you give it, so the
   command letter is written once per subpath rather than once per point. */
function emit(subs){
  let out = '', cx = 0, cy = 0;
  for(const pts of subs){
    const r = pts.map(([x, y]) => [Math.round(x), Math.round(y)]);
    /* drop points that round onto their neighbour */
    const u = [r[0]];
    for(let i = 1; i < r.length; i++) if(r[i][0] !== u[u.length-1][0] || r[i][1] !== u[u.length-1][1]) u.push(r[i]);
    if(u.length < 3) continue;
    const closed = u[0][0] === u[u.length-1][0] && u[0][1] === u[u.length-1][1];
    const body = closed ? u.slice(0, -1) : u;
    out += `m${body[0][0]-cx} ${body[0][1]-cy}`;
    cx = body[0][0]; cy = body[0][1];
    let d = '';
    for(let i = 1; i < body.length; i++){
      d += `${i>1?' ':''}${body[i][0]-cx} ${body[i][1]-cy}`;
      cx = body[i][0]; cy = body[i][1];
    }
    if(d) out += 'l' + d;
    out += 'z';
    cx = body[0][0]; cy = body[0][1];   /* z returns the pen to the subpath start */
  }
  return out;
}

/* ---------- the deck, in the order the app holds it ---------- */
const ORDER = [];
for(let i = 0; i <= 21; i++) ORDER.push('a-' + String(i).padStart(2, '0'));
for(const s of ['w', 'c', 's', 'p']) for(let i = 1; i <= 14; i++) ORDER.push(s + '-' + String(i).padStart(2, '0'));

const dir = process.argv[2];
if(!dir){ console.error('usage: node tools/build-tarot-art.js <dir of a-00.svg …>'); process.exit(1); }

let rawIn = 0, rawOut = 0;
const cards = ORDER.map(name => {
  const file = path.join(dir, name + '.svg');
  const svg = fs.readFileSync(file, 'utf8');
  rawIn += Buffer.byteLength(svg);
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 500 878';
  const ds = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1]);
  let subs = [];
  for(const d of ds) subs = subs.concat(parsePath(d));
  const kept = subs.map(s => simplify(s, TOL)).filter(s => bboxDiag(s) >= SPECK && s.length >= 3);
  const out = emit(kept);
  rawOut += Buffer.byteLength(out);
  return {name, vb, d: out, subsIn: subs.length, subsOut: kept.length};
});

const vbs = [...new Set(cards.map(c => c.vb))];
const body = `/* ============================================================
   THE PICTURES

   Pamela Colman Smith's drawings for the deck published by Rider in
   1909 — the ones everybody means by "the tarot" — traced to vector and
   then cut down to the size they are actually drawn at here. They are in
   the public domain; the tracings come from the black-and-white SVGs
   bundled with github.com/georgestephanis/tarot, which states them to be
   generated from the 1910 deck and public domain.

   One path per card, in the order TAROT holds them: the twenty-two Major
   Arcana, then Wands, Cups, Swords and Pentacles, ace to king. Black ink
   on nothing, so the card's own paper shows through and the drawing takes
   the colour of the theme.

   Generated by tools/build-tarot-art.js — do not edit by hand.
   ============================================================ */
const TAROT_ART_VB = ${JSON.stringify(vbs.length === 1 ? vbs[0] : vbs)};
const TAROT_ART = [
${cards.map(c => `/* ${c.name} */ ${JSON.stringify(c.d)},`).join('\n')}
];
`;
const outFile = path.join(__dirname, '..', 'src', '16-divination-art.js');
fs.writeFileSync(outFile, body);

const gz = n => (zlib.gzipSync(Buffer.from(n), {level: 9}).length / 1048576).toFixed(2);
console.log(`in    ${(rawIn/1048576).toFixed(2)} MB of tracings (gzip ${gz(cards.map(c=>c.d).join(''))} — see below)`);
console.log(`out   ${(Buffer.byteLength(body)/1048576).toFixed(2)} MB written, ${gz(body)} MB gzipped`);
console.log(`      tolerance ${TOL}, speck floor ${SPECK}`);
console.log(`      subpaths ${cards.reduce((s,c)=>s+c.subsIn,0)} → ${cards.reduce((s,c)=>s+c.subsOut,0)}`);
console.log(`      viewBox ${vbs.join(' | ')}`);
console.log(`→ ${path.relative(process.cwd(), outFile)}`);
