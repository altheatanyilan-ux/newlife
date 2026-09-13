/* ============================================================
   HOW A TREE GETS ITS SHAPE

   The old tree was laid out by arithmetic: divide the sky into as many
   sectors as there are categories, put a branch down the middle of each,
   hang the skills off it at fixed angles. That is a diagram-drawing
   algorithm, and no amount of jitter hides it — the eye reads the even
   spacing straight through the noise.

   A real tree does not divide anything. It grows toward light, a segment
   at a time, and forks when the light it is reaching for lies in two
   directions at once. Everything that makes a tree look like a tree — the
   asymmetry, the way a limb thickens where it carries more, the way two
   branches never leave at quite the same angle — comes out of that one
   rule rather than being added on top of it.

   So: scatter the skills as points of light in the canopy, start a shoot
   at the top of the trunk, and let it grow. The algorithm is space
   colonisation (Runions, Lane & Prusinkiewicz, 2007), which is what most
   convincing procedural trees use. What comes out is a cloud of short
   segments; the rest of this file turns those into wood — chained into
   strands, smoothed through a Catmull-Rom spline, and filled as tapered
   ribbons rather than stroked as lines, because a branch of even width is
   the other half of why a drawn tree looks drawn.

   The randomness is seeded off the skill ids, so the same skills always
   make the same tree. Adding one grows a branch; it does not reshuffle
   the garden.
   ============================================================ */

/* ---------- curves ----------
   Catmull-Rom passes *through* every point it is given, which is what we
   want: the growth points are where the branch actually went, and a curve
   that merely approximates them wanders off the wood. Converting to cubic
   Bézier is the standard trick — the spline's tangent at each point gives
   the two control points of the segment leaving it. */
function sgBezier(pts, tension = 1){
  const n = pts.length;
  if(n < 2) return [];
  const out = [];
  for(let i = 0; i < n - 1; i++){
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    out.push([
      [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension],
      [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension],
      [p2[0], p2[1]],
    ]);
  }
  return out;
}
const sgN = v => (Math.round(v * 10) / 10).toFixed(1);
/* the smooth path through a run of points, as an open curve */
function sgPath(pts, tension = 1){
  if(pts.length < 2) return '';
  return `M${sgN(pts[0][0])},${sgN(pts[0][1])}` + sgBezier(pts, tension)
    .map(c => `C${sgN(c[0][0])},${sgN(c[0][1])} ${sgN(c[1][0])},${sgN(c[1][1])} ${sgN(c[2][0])},${sgN(c[2][1])}`).join('');
}

/* ---------- wood ----------
   A branch is a ribbon, not a line: walk the centreline, step out to
   either side by half the width at that point, and close the two edges
   into one filled shape. The taper is the whole effect — a limb that
   leaves the trunk thick and arrives at its tip thin reads as wood, and
   the same curve stroked at a constant width reads as wire.

   The tip is rounded off rather than cut square, because a branch that
   ends in a flat edge looks snapped. */
function sgRibbon(pts, widths, tension = 1){
  const n = pts.length;
  if(n < 2) return '';
  const normalAt = i => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [-dy / L, dx / L];
  };
  const left = [], right = [];
  for(let i = 0; i < n; i++){
    const [nx, ny] = normalAt(i), h = Math.max(widths[i], .35) / 2;
    left.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
    right.push([pts[i][0] - nx * h, pts[i][1] - ny * h]);
  }
  /* carry the tip a little past the last growth point and round it */
  const tipR = Math.max(widths[n - 1], .35) / 2;
  const [tx, ty] = (() => {
    const a = pts[n - 2], b = pts[n - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [b[0] + (b[0] - a[0]) / L * tipR, b[1] + (b[1] - a[1]) / L * tipR];
  })();
  const rev = right.slice().reverse();
  return sgPath(left, tension)
    + ` Q${sgN(tx)},${sgN(ty)} ${sgN(rev[0][0])},${sgN(rev[0][1])}`
    + sgBezier(rev, tension).map(c => `C${sgN(c[0][0])},${sgN(c[0][1])} ${sgN(c[1][0])},${sgN(c[1][1])} ${sgN(c[2][0])},${sgN(c[2][1])}`).join('')
    + ' Z';
}

/* ---------- the canopy the tree is reaching into ----------
   An ellipse a little wider than it is tall, sitting above the trunk. It
   grows with the number of skills, but slower than linearly: a tree with
   forty skills is denser than one with ten, not four times the size. */
function sgEnvelope(count, trunkTop){
  const rx = Math.min(430, 130 + Math.sqrt(count) * 82);
  const ry = Math.min(330, 92 + Math.sqrt(count) * 46);
  return {rx, ry, base: trunkTop};
}

/* ---------- where the light is ----------
   One attractor per skill. Categories take overlapping zones of the
   canopy rather than tidy sectors — overlapping is what stops the tree
   reading as a pie chart — and a skill sits further out the further it
   has come, so a practised skill ends up on a longer branch with room
   around its flower. A skill that grows out of another one is placed just
   beyond its parent, which is how the branch reaching the parent carries
   on to the child without anything having to arrange it. */
function sgAttractors(rnd, env, fillers){
  const cats = [...new Set([...SKILL_CATS, ...S.skills.map(s => s.cat)])].filter(c => S.skills.some(s => s.cat === c));
  const parentOf = s => s.prereqs.find(id => byId(S.skills, id)) || null;
  const out = [];
  /* Positions are polar about the top of the trunk: an angle out from
     straight up, and a reach along the canopy ellipse. A cherry's crown is
     a vase — wide, and not much taller than it is wide — so the ellipse is
     the wider way round and the outermost skills sit almost level with the
     top of the trunk rather than piled above it. */
  const ARC = 74 * Math.PI / 180;
  const slot = (2 * ARC * .88) / Math.max(cats.length, 1);
  cats.forEach((c, ci) => {
    const mine = S.skills.filter(s => s.cat === c);
    const roots = mine.filter(s => { const p = parentOf(s); return !p || byId(S.skills, p).cat !== c; });
    /* Each category gets a slot, then is pushed off it by an amount of its
       own. The push is seeded, so it is the same on every load — but it is
       not the same for every category, and that is what keeps neighbouring
       zones overlapping instead of reading as the segments of a pie. */
    const centre = -ARC * .88 + slot * (ci + .5) + (rnd() - .5) * slot * .40;
    const place = (sk, ang, rf, depth) => {
      const a = clamp(ang + (rnd() - .5) * .20, -1.47, 1.47);
      const r = clamp(rf + (rnd() - .5) * .13, .34, 1.08);
      out.push({
        x: Math.sin(a) * env.rx * r,
        y: env.base + Math.cos(a) * env.ry * r,
        skill: sk, cat: c, depth, claimed: false, node: null,
      });
      const kids = S.skills.filter(k => parentOf(k) === sk.id);
      kids.forEach((k, j) => place(k, a + (j - (kids.length - 1) / 2) * .26 + (rnd() - .5) * .10,
        r + .22 + rnd() * .08, depth + 1));
    };
    const span = slot * .42;
    roots.forEach((sk, j) => {
      const off = roots.length === 1 ? 0 : (j / (roots.length - 1) - .5) * span * 2;
      /* the further along a skill is, the further out it reaches for light */
      const lc = Math.max(skillLevelCount(sk), 1);
      const prog = clamp((sk.currentLevel || 0) / lc, 0, 1);
      place(sk, centre + off, .52 + prog * .40, 0);
    });
  });
  /* ---- the rest of the canopy ----
     Seven points of light make a star, not a tree: each skill pulls its own
     shoot straight off the trunk and nothing ever forks. A real canopy is
     a volume to be filled, so the crown is seeded with plain points as
     well — they carry no skill and get no flower, but the wood that grows
     to reach them is what gives the tree its interior: the limbs that
     divide, the spurs, the silhouette. This is what the space-colonisation
     papers mean by the attractor cloud; the skills are simply the points
     that are also worth naming. */
  let tries = 0;
  while(out.length < fillers + S.skills.length && tries++ < fillers * 12){
    const a = (rnd() * 2 - 1) * ARC * 1.04;
    const r = Math.sqrt(rnd()) * 1.06;
    if(r < .24) continue;
    out.push({x: Math.sin(a) * env.rx * r, y: env.base + Math.cos(a) * env.ry * r,
      skill: null, cat: null, depth: 0, claimed: false, node: null, filler: true});
  }
  return {attractors: out, cats};
}

/* ---------- growth ----------
   Every unclaimed attractor pulls on whichever node of the tree is nearest
   it. A node pulled from several directions at once averages them, which
   is what makes a branch lean; a node pulled hard in two directions ends
   up forking on the next step, because its two children then have
   different nearest attractors. When a node arrives within the kill
   distance of an attractor, that attractor stops pulling — it has been
   reached, and its skill will flower there.

   The upward bias is the one piece of biology that is not emergent:
   without it a tree with all its skills to one side grows sideways out of
   the ground like a hedge. */
function sgGrow(attractors, opt){
  const root = {x: opt.startX || 0, y: opt.startY, parent: null, depth: 0, kids: 0};
  const nodes = [root];
  const rnd = opt.rnd;
  const seg = opt.seg, kill = opt.kill, infl = opt.infl;
  /* One flower to a tip: a node that has already been reached by a skill
     cannot be reached by a second, or two skills end up sharing a twig and
     neither of them owns any wood. The one that misses keeps pulling, and
     claims the shoot that grows out of it a step later. */
  const taken = new Set();
  for(let iter = 0; iter < opt.maxIter; iter++){
    const pull = new Map();
    let live = 0;
    for(const a of attractors){
      if(a.claimed) continue;
      live++;
      let best = -1, bd = Infinity;
      for(let i = 0; i < nodes.length; i++){
        const d = Math.hypot(nodes[i].x - a.x, nodes[i].y - a.y);
        if(d < bd){ bd = d; best = i; }
      }
      if(best < 0) continue;
      if(bd <= kill && !taken.has(nodes[best])){ a.claimed = true; a.node = nodes[best]; taken.add(nodes[best]); live--; continue; }
      if(bd > infl) continue;
      const n = nodes[best], p = pull.get(best) || [0, 0, 0];
      p[0] += (a.x - n.x) / bd; p[1] += (a.y - n.y) / bd; p[2]++;
      pull.set(best, p);
    }
    if(!live) break;
    if(!pull.size){
      /* Nothing is close enough to pull on anything — which happens when a
         skill sits outside the influence radius of every shoot. Reach for
         the nearest unclaimed one directly rather than stalling. */
      let bn = null, ba = null, bd = Infinity;
      for(const a of attractors){ if(a.claimed) continue;
        for(const n of nodes){ const d = Math.hypot(n.x - a.x, n.y - a.y); if(d < bd){ bd = d; bn = n; ba = a; } } }
      if(!bn) break;
      const L = Math.hypot(ba.x - bn.x, ba.y - bn.y) || 1;
      nodes.push({x: bn.x + (ba.x - bn.x) / L * seg, y: bn.y + (ba.y - bn.y) / L * seg,
        parent: bn, depth: bn.depth + 1, kids: 0});
      bn.kids++;
      continue;
    }
    for(const [idx, p] of pull){
      const n = nodes[idx];
      let dx = p[0] / p[2], dy = p[1] / p[2];
      dy += opt.up;
      dx += (rnd() - .5) * opt.jitter;
      dy += (rnd() - .5) * opt.jitter * .45;
      const L = Math.hypot(dx, dy) || 1;
      nodes.push({x: n.x + dx / L * seg, y: n.y + dy / L * seg, parent: n, depth: n.depth + 1, kids: 0});
      n.kids++;
    }
  }
  /* Any skill the growth never reached gets a shoot of its own from the
     nearest wood. This should be rare; it is here so that a skill is never
     silently missing from the tree because the geometry went against it.
     A plain canopy point that was never reached is just a gap in the crown,
     which is what gaps in a crown are. */
  for(const a of attractors){
    if(a.claimed || a.filler) continue;
    let bn = nodes[0], bd = Infinity;
    for(const n of nodes){ const d = Math.hypot(n.x - a.x, n.y - a.y); if(d < bd){ bd = d; bn = n; } }
    let cur = bn, steps = Math.max(1, Math.round(bd / seg));
    for(let i = 0; i < Math.min(steps, 24); i++){
      const L = Math.hypot(a.x - cur.x, a.y - cur.y) || 1;
      const nx = {x: cur.x + (a.x - cur.x) / L * Math.min(seg, L), y: cur.y + (a.y - cur.y) / L * Math.min(seg, L),
        parent: cur, depth: cur.depth + 1, kids: 0};
      cur.kids++; nodes.push(nx); cur = nx;
      if(Math.hypot(cur.x - a.x, cur.y - a.y) <= kill && !taken.has(cur)) break;
    }
    a.claimed = true; a.node = cur; taken.add(cur);
  }
  return {nodes, root};
}

/* ---------- pruning and ownership ----------
   The growth leaves a lot of shoots that never reached anything. A few are
   worth keeping — real trees are full of twigs going nowhere, and they are
   most of what gives a crown its silhouette — but a long dead run is just
   clutter, so they are cut back to a couple of segments.

   Then every node is asked two questions. Which skills lie anywhere beyond
   it — that sorts the shared wood into category limbs and trunk. And which
   flowers are the *next* ones beyond it, with no other flower in between:
   a node with exactly one of those belongs to that skill, and is the twig
   you click on. The second question is the one that matters, because a
   skill grown out of another sits further along the same branch, and the
   wood between the two flowers belongs to the further one. Nothing is
   assigned by decree; it falls out of where the branches went. */
function sgOwn(grown, attractors, deadLen = 2){
  const {nodes, root} = grown;
  const byNode = new Map();
  nodes.forEach(n => byNode.set(n, {skills: new Set(), cats: new Set(), front: new Set(), size: 0, reached: 0, tip: true}));
  attractors.forEach(a => { if(!a.node) return;
    const m = byNode.get(a.node);
    m.stops = true; m.reached++;
    if(a.skill){ m.skills.add(a.skill.id); m.cats.add(a.cat); m.claim = m.claim || a.skill.id; } });
  /* nodes are pushed in creation order, so a parent is always before its
     children: one pass backwards rolls every subtree up */
  for(let i = nodes.length - 1; i >= 0; i--){
    const n = nodes[i], m = byNode.get(n);
    m.size++;
    /* a flower stops the front: what is beyond it is no longer the nearest
       thing beyond whatever is below */
    if(m.stops){ m.front.clear(); if(m.claim) m.front.add(m.claim); }
    if(!n.parent) continue;
    const p = byNode.get(n.parent);
    p.size += m.size; p.reached += m.reached; p.tip = false;
    m.skills.forEach(s => p.skills.add(s));
    m.cats.forEach(c => p.cats.add(c));
    m.front.forEach(s => p.front.add(s));
  }
  /* cut the dead runs back */
  const keep = new Set();
  nodes.forEach(n => { if(byNode.get(n).reached) keep.add(n); });
  nodes.forEach(n => {
    if(keep.has(n)) return;
    let up = n.parent, d = 0;
    while(up && !keep.has(up)){ up = up.parent; d++; if(d > 40) break; }
    if(up && n.depth - up.depth <= deadLen) keep.add(n);
  });
  const live = nodes.filter(n => keep.has(n) || n === root);
  const kindOf = n => {
    const m = byNode.get(n);
    if(m.front.size === 1) return 'skill:' + [...m.front][0];
    if(m.skills.size === 0) return 'twiglet';
    if(m.cats.size === 1) return 'cat:' + [...m.cats][0];
    return 'trunk';
  };
  live.forEach(n => { const m = byNode.get(n); m.kind = kindOf(n); });
  return {live, meta: byNode, root};
}

/* ---------- strands ----------
   The growth is a cloud of one-segment steps; wood comes in runs. At every
   node the child carrying the most tree beyond it continues the branch,
   and the others start their own — which is exactly how a limb reads: one
   line carrying on, with others leaving it. A run also breaks where it
   changes hands, so a category's limb stops being the category's at the
   fork where its skills part company. */
function sgStrands(owned){
  const {live, meta} = owned;
  const liveSet = new Set(live);
  const kids = new Map();
  live.forEach(n => {
    if(!n.parent || !liveSet.has(n.parent)) return;
    if(!kids.has(n.parent)) kids.set(n.parent, []);
    kids.get(n.parent).push(n);
  });
  const cont = new Map();
  kids.forEach((cs, p) => {
    const pk = meta.get(p).kind;
    const same = cs.filter(c => meta.get(c).kind === pk);
    const pick = (same.length ? same : []).sort((a, b) => meta.get(b).size - meta.get(a).size)[0];
    if(pick) cont.set(p, pick);
  });
  const strands = [];
  const used = new Set();
  live.forEach(n => {
    if(used.has(n)) return;
    const p = n.parent;
    const starts = !p || !liveSet.has(p) || cont.get(p) !== n;
    if(!starts) return;
    const chain = [];
    /* a strand is drawn from the fork it leaves, so the wood joins up */
    if(p && liveSet.has(p)) chain.push(p);
    let cur = n;
    while(cur){ chain.push(cur); used.add(cur); cur = cont.get(cur); }
    if(chain.length >= 2) strands.push({kind: meta.get(n).kind, nodes: chain, meta});
  });
  return strands;
}

/* A growth chain is a staircase: every step took a fresh random nudge, and
   a spline drawn straight through them keeps every one of those corners.
   Two or three passes of pulling each interior point a quarter of the way
   toward the average of its neighbours takes the staircase out without
   moving the branch — the wood keeps where it went and loses the jitter it
   went there with. The ends are pinned, so nothing comes adrift from the
   fork it grows out of or from the flower it grew to reach. */
function sgSmooth(pts, rounds = 2, amount = .28){
  if(pts.length < 3) return pts;
  let cur = pts.map(p => [p[0], p[1]]);
  for(let r = 0; r < rounds; r++){
    const next = cur.map(p => [p[0], p[1]]);
    for(let i = 1; i < cur.length - 1; i++){
      next[i][0] = cur[i][0] + ((cur[i-1][0] + cur[i+1][0]) / 2 - cur[i][0]) * amount;
      next[i][1] = cur[i][1] + ((cur[i-1][1] + cur[i+1][1]) / 2 - cur[i][1]) * amount;
    }
    cur = next;
  }
  return cur;
}

/* Leonardo's rule: the wood below a fork carries the wood above it. Raising
   the total to a power a little under a half is the usual approximation and
   is what makes a trunk thicken believably as a tree fills out. */
function sgWidth(size, unit){ return Math.max(unit * .55, unit * Math.pow(size, 1 / 2.45)); }
