/* ============================================================
   FOLIAGE — what makes a drawn tree look alive.

   A leaf on a real tree does not rotate about a fixed point at a
   fixed rate. It hangs off a stem, so it swings and bobs at once;
   it is lighter than the branch, so it flutters faster than the
   limb it sits on; and the wind that moves it arrives as a gust
   that crosses the tree rather than as a metronome. All three of
   those are cheap to model, and together they are the difference
   between a diagram and a thing growing.

   One loop drives every tree in the house.
   ============================================================ */
let swayRAF = 0, swayLeaves = null, swayRoot = null;

/* The sway must be stoppable from outside: a navigation that leaves a tree
   running mid-flight stalls the view transition, and the page never changes. */
function stopSway(){ if(swayRAF) cancelAnimationFrame(swayRAF); swayRAF = 0; swayLeaves = null; swayRoot = null; }

function startSway(root){
  stopSway();
  if(!root || reduced()) return;
  const nodes = $$('.leaf', root);
  if(!nodes.length) return;

  /* One layout read at the start, never per frame: where each leaf sits across
     the width of the tree, so a gust can arrive at the left before the right. */
  const box = root.getBoundingClientRect();
  const width = Math.max(1, box.width);
  swayLeaves = nodes.map((el, i) => {
    const r = el.getBoundingClientRect();
    const across = clamp((r.left + r.width / 2 - box.left) / width, 0, 1);
    const up = 1 - clamp((r.top + r.height / 2 - box.top) / Math.max(1, box.height), 0, 1);
    const ph = +el.dataset.phase || (i * 1.7) % 6.28;
    const per = +el.dataset.period || 3;
    return {
      el, across, ph,
      /* the slow swing of the twig it hangs from */
      w1: (2 * Math.PI) / per,
      /* the faster flutter of the blade itself, never a whole multiple of the
         swing — a rational ratio would make the two lock and look mechanical */
      w2: (2 * Math.PI) / (per * 0.37 + 0.6),
      /* higher leaves are further out on thinner wood, so they move more */
      gain: 0.55 + up * 0.85 + ((i * 37) % 11) / 22,
    };
  });
  swayRoot = root;

  const t0 = performance.now();
  const tick = t => {
    if(!swayRoot || !document.contains(swayRoot)){ stopSway(); return; }
    const s = (t - t0) / 1000;
    /* the gust: a slow swell that crosses the canopy, so the whole tree leans
       together for a moment and then lets go, instead of shimmering forever */
    const gustPhase = s * 0.34;
    for(let i = 0; i < swayLeaves.length; i++){
      const L = swayLeaves[i];
      const gust = 0.55 + 0.45 * Math.sin(gustPhase - L.across * 1.9);
      const swing = Math.sin(s * L.w1 + L.ph);
      const flutter = Math.sin(s * L.w2 + L.ph * 1.7);
      const deg = (swing * 3.4 + flutter * 1.5) * L.gain * gust;
      /* a leaf on a stem also lifts as it swings — pure rotation reads as a
         windscreen wiper, the small bob is what sells it */
      const lift = flutter * 0.5 * L.gain;
      L.el.style.transform = `translate(${(swing * .7 * L.gain).toFixed(2)}px,${lift.toFixed(2)}px) rotate(${deg.toFixed(2)}deg)`;
    }
    swayRAF = requestAnimationFrame(tick);
  };
  swayRAF = requestAnimationFrame(tick);
}

/* ---------- the reveal ----------
   A tree should arrive by growing, not by appearing. Limbs draw themselves
   from the trunk outward, then the leaves open behind them. Pure CSS once the
   lengths are stamped on, so it costs nothing after the first frame. */
function growTree(svg){
  if(!svg || reduced()) return;
  svg.classList.add('growing');
  const limbs = [...svg.querySelectorAll('path.limb, path.sk-limb, .limb-tint')];
  limbs.forEach(p => {
    let len = 0;
    try { len = p.getTotalLength(); } catch(e){ return; }
    if(!len || !isFinite(len)) return;
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    /* nearer the trunk first: shorter paths are the outer twigs, so order by
       distance from the root instead of by document order */
    p.style.animation = `limbDraw .9s var(--ease) forwards`;
    p.style.animationDelay = `${Math.min(.75, len / 900).toFixed(2)}s`;
  });
  const late = [...svg.querySelectorAll('.leaf, .fruit, .blossom, .sk-canopy')];
  late.forEach((n, i) => {
    n.style.animation = `leafOpen .7s var(--ease) both`;
    n.style.animationDelay = `${(0.5 + (i % 40) * 0.012).toFixed(2)}s`;
  });
  /* the inline animation has done its job once it has played; leaving it on
     would fight the sway loop for the transform property */
  setTimeout(() => {
    limbs.forEach(p => { p.style.animation = ''; p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
    late.forEach(n => { n.style.animation = ''; });
    svg.classList.remove('growing');
  }, 1700);
}

/* ---------- motes ----------
   Whatever is in the air under a canopy: pollen, dust, the light itself.
   A handful, drifting slowly, seeded so they do not all start together. */
function motesHTML(n = 9, seed = 'motes'){
  const r = mulberry32(hashSeed(seed));
  return `<div class="tree-motes" aria-hidden="true">${Array.from({length: n}, () => {
    const dur = 22 + r() * 26;
    return `<i style="left:${(4 + r() * 92).toFixed(1)}%;top:${(12 + r() * 70).toFixed(1)}%;--dur:${dur.toFixed(0)}s;--delay:${(-r() * dur).toFixed(0)}s;--dx:${(18 + r() * 46).toFixed(0)}px;--dy:${(-26 - r() * 40).toFixed(0)}px;--sz:${(2 + r() * 2.4).toFixed(1)}px"></i>`;
  }).join('')}</div>`;
}
