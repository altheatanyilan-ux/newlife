/* ============================================================
   THE CAST

   Everything the cards do in sequence, this does at once. There is no
   first position and no second: the charms go up, they come down, and
   what you have is a scatter to be read like a map rather than a list to
   be read like a sentence.

   Three things are computed from where they land, and nothing else is:

     the ring        how close to the middle of it this charm is
     the quarter     which way it is facing — spirit, action, material, intuition
     the neighbours  which charms came down close enough to be read together

   Plus one charm singled out by the throw itself: whichever landed
   nearest the centre is the significator, and the reading opens with it.
   Nobody chooses it; that is the point.

   A sixth or so of the charms land face down. They are not read unless
   you turn them, and you do not have to. A cast with something still
   hidden in it is a perfectly good cast.
   ============================================================ */

const CAST_SIZES = [
  {id:'quick',    n:7,  name:'Quick',    hint:'A handful. A morning, or one thing you want looked at.'},
  {id:'standard', n:15, name:'Standard', hint:'Half the set. A question with some room in it.'},
  {id:'full',     n:30, name:'Full',     hint:'Everything at once. A long question, and an hour to sit with it.'},
];
const castSize = id => CAST_SIZES.find(s => s.id === id) || CAST_SIZES[1];

/* ---------- the throw ----------
   Positions are in the unit circle, so nothing here knows or cares how
   big the cloth is drawn.

   The radius is the part worth getting right. A radius picked uniformly
   at random spreads charms evenly *by area*, which puts about a
   sixteenth of them in the core and nearly two thirds out past the
   middle ring — a reading where almost everything is "beyond you" and
   the centre is usually empty. That is not how a handful of thrown
   objects behaves, and it is not a reading. `pow(random, .95)` is close
   to linear in the radius, which crowds them toward the middle the way
   a real throw does: roughly a sixth in the core, two fifths in the
   influences, two fifths beyond. */
function charmCast(size){
  const pool = charmPool().slice();
  const n = Math.min(castSize(size).n, pool.length);
  const out = [];
  for(let i = 0; i < n; i++){
    const c = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const ang = Math.random() * Math.PI * 2;
    const rad = .08 + Math.pow(Math.random(), .95) * .88;
    out.push({id: c.id,
      x: Math.cos(ang) * rad, y: Math.sin(ang) * rad,
      rot: Math.round((Math.random() - .5) * 46),      /* how it came to rest */
      up: Math.random() > .15,                          /* a sixth land face down */
      flipped: false});
  }
  return out;
}

/* ---------- reading the scatter ---------- */
function castAnalyse(thrown){
  const marks = thrown.map((t, i) => {
    const d = Math.hypot(t.x, t.y);
    /* atan2 with y as it is: the cloth's y grows downward like the screen's,
       so this is already the angle the quarters are written against */
    const deg = (Math.atan2(t.y, t.x) * 180 / Math.PI + 360) % 360;
    return Object.assign({}, t, {i, d, deg, charm: charmById(t.id),
      ring: castRing(d), quarter: castQuarter(deg)});
  }).filter(m => m.charm);

  /* the significator is decided by the throw, not by the reader — and a
     charm that landed face down cannot be the core of a reading it is not
     part of, so it has to be turned first to claim the place */
  const readable = marks.filter(m => m.up || m.flipped);
  const sig = readable.slice().sort((a, b) => a.d - b.d)[0] || null;

  /* Clusters: single-link, over the readable charms. The threshold is a
     fraction of the cloth rather than a pixel count, so the same cast
     clusters the same way on a phone and on a desk. */
  const near = .17;
  const seen = new Set(), clusters = [];
  readable.forEach(a => {
    if(seen.has(a.i)) return;
    const group = [a]; seen.add(a.i);
    /* single-link: anything near anything already in the group joins it */
    for(let grew = true; grew;){
      grew = false;
      readable.forEach(b => {
        if(seen.has(b.i)) return;
        if(group.some(g => Math.hypot(g.x - b.x, g.y - b.y) < near)){
          group.push(b); seen.add(b.i); grew = true;
        }
      });
    }
    if(group.length > 1) clusters.push(group);
  });
  clusters.sort((a, b) => b.length - a.length);

  const quarters = {};
  readable.forEach(m => { quarters[m.quarter.id] = (quarters[m.quarter.id] || 0) + 1; });
  const heaviest = Object.entries(quarters).sort((a, b) => b[1] - a[1])[0] || null;

  return {marks, readable, sig, clusters,
    inner: readable.filter(m => m.ring.id === 'inner'),
    hidden: marks.filter(m => !m.up && !m.flipped),
    quarters, heaviest};
}

/* ---------- what it says ----------
   Built from templates out of the charms' own words, like the tarot's
   story paragraph and for the same reason: not to be profound, only to
   join enough dots that the person reading has somewhere to start. */
function castNarrative(a){
  if(!a.sig) return 'Every charm came down face down. That is a reading of a kind — turn one, or throw again.';
  const firstSentence = s => (s.split(/(?<=\.)\s/)[0] || s).replace(/\s+$/, '');
  let t = `At the heart of this cast is ${a.sig.charm.name}. ${firstSentence(a.sig.charm.m)} `
        + `It came down in ${a.sig.ring.name.toLowerCase()}, toward ${a.sig.quarter.name.toLowerCase()}.`;
  const others = a.inner.filter(m => m !== a.sig);
  if(others.length){
    t += ` Beside it at the centre: ${others.map(m => m.charm.name).join(' and ')} — `
       + `so this is a reading about ${a.inner.map(m => m.charm.k[0]).join(', ')} before it is about anything else.`;
  }
  if(a.clusters.length){
    const c = a.clusters[0];
    t += ` ${c.map(m => m.charm.name).join(' and ')} fell together, which is the part to look at hardest: `
       + `those themes are not separate things in your life at the moment.`;
  }
  if(a.heaviest && a.heaviest[1] >= Math.max(2, a.readable.length * .35)){
    const q = CAST_QUARTERS.find(x => x.id === a.heaviest[0]);
    t += ` The weight of the cast falls toward ${q.name.toLowerCase()} — ${q.m}.`;
  }
  if(a.hidden.length){
    t += ` ${a.hidden.length === 1 ? 'One charm is' : a.hidden.length + ' charms are'} still face down. `
       + `Whatever is working on this from underneath, you have not looked at it yet.`;
  }
  return t;
}

/* three questions, drawn from the charms the throw made prominent */
function castQuestions(a){
  const qs = [];
  if(a.sig) qs.push(`${a.sig.charm.m.match(/[^.]*\?$/) ? a.sig.charm.m.split(/(?<=\.)\s/).pop()
    : `What does ${a.sig.charm.name} ask of the thing you brought?`}`);
  a.inner.filter(m => m !== a.sig).slice(0, 1).forEach(m =>
    qs.push(`${m.charm.name} landed at your core. Where is ${m.charm.k[0]} in this, honestly?`));
  if(a.clusters.length){
    const c = a.clusters[0];
    qs.push(`What is the connection between ${c[0].charm.name} and ${c[1].charm.name} that you have not said out loud?`);
  }
  if(a.hidden.length) qs.push('What are you not turning over, and why not?');
  if(a.heaviest){
    const q = CAST_QUARTERS.find(x => x.id === a.heaviest[0]);
    qs.push(`Most of this landed toward ${q.name.toLowerCase()}. Is that where you have been looking?`);
  }
  return qs.slice(0, 4);
}

/* ============================================================
   THE CLOTH, DRAWN

   Three rings and two lines, at the weight of a watermark. The zones are
   there to orient the reading, not to be the thing you look at — a ruled
   diagram with objects on it is a chart, and this is meant to be a cloth.
   ============================================================ */
function castClothHTML(){
  /* The viewBox is exactly the cloth: 100 units across, radius 50, so an SVG
     radius of 50 and a charm thrown to radius 1 are the same circle. They
     were not, at first, and the outer ring sat a fifth of the way inside
     where the charms were actually landing. The direction labels sit outside
     that circle and are painted by overflow rather than by widening it. */
  const R = 50, lab = (x, y, t, anchor) =>
    `<text class="cc-lab" x="${x}" y="${y}" text-anchor="${anchor}">${esc(t)}</text>`;
  return `<svg class="cc-cloth" viewBox="-50 -50 100 100" aria-hidden="true">
    <defs><radialGradient id="ccCore"><stop offset="0" stop-color="currentColor" stop-opacity=".085"/>
      <stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
    <circle r="${R * .25}" fill="url(#ccCore)"/>
    ${CAST_RINGS.map(r => `<circle class="cc-ring" r="${(R * r.max).toFixed(1)}"/>`).join('')}
    <line class="cc-cross" x1="${-R}" y1="0" x2="${R}" y2="0"/>
    <line class="cc-cross" x1="0" y1="${-R}" x2="0" y2="${R}"/>
    <circle class="cc-centre" r="1.1"/>
    ${lab(0, -R - 3.5, 'Spirit', 'middle')}
    ${lab(R + 3.5, 1.6, 'Action', 'start')}
    ${lab(0, R + 7, 'Material', 'middle')}
    ${lab(-R - 3.5, 1.6, 'Intuition', 'end')}
  </svg>`;
}

/* one charm as it sits on the cloth */
function charmTokenHTML(m, opts){
  const c = m.charm, cat = charmCatOf(c);
  const shown = m.up || m.flipped;
  return `<button type="button" class="cc-tok${shown ? '' : ' down'}${opts && opts.sig ? ' sig' : ''}"
    data-cctok="${m.i}" style="--x:${(m.x * 50).toFixed(2)};--y:${(m.y * 50).toFixed(2)};--rot:${m.rot}deg;--cc:${cat.c};--hue:${c.hue}"
    aria-label="${esc(shown ? c.name : 'a charm, face down')}">
    <span class="cc-glyph">${shown ? c.sym : '<svg viewBox="0 0 24 24" class="cc-back"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.4"/></svg>'}</span>
  </button>`;
}

/* ---------- the reading, written out ---------- */
function castReadingHTML(a){
  const zone = m => `${m.ring.name}, toward ${m.quarter.name.toLowerCase()}`;
  const one = (m, lead) => `<article class="cc-read" data-ccread="${m.i}" style="--cc:${charmCatOf(m.charm).c}">
    <div class="cc-read-h"><span class="cc-read-sym">${m.charm.sym}</span>
      <b class="serif">${esc(m.charm.name)}</b>
      <span class="mono">${esc(zone(m))}</span></div>
    <div class="cc-keys mono">${esc(m.charm.k.join(' · '))}</div>
    <p class="cc-p">${esc(m.charm.m)}</p>
    ${lead === 'full' ? `<p class="cc-p faint">Where it landed: ${esc(m.ring.m)} And toward ${esc(m.quarter.name.toLowerCase())} — ${esc(m.quarter.m)}.</p>`
      : lead ? `<p class="cc-p faint">Toward ${esc(m.quarter.name.toLowerCase())}: ${esc(m.quarter.m)}.</p>` : ''}
  </article>`;

  const sections = [];
  if(a.sig) sections.push(`<section class="dv-sec"><h4 class="dv-sec-h">The core</h4>
    <p class="cc-lead">Nearest the centre, and therefore the middle of this:</p>
    ${one(a.sig, 'full')}</section>`);

  const rest = a.inner.filter(m => m !== a.sig);
  if(rest.length) sections.push(`<section class="dv-sec"><h4 class="dv-sec-h">Also at the centre</h4>
    ${rest.map(m => one(m, true)).join('')}</section>`);

  if(a.clusters.length) sections.push(`<section class="dv-sec"><h4 class="dv-sec-h">Together</h4>
    <p class="cc-lead">Charms that came down close enough to be read as one thing. This is the part of a cast
      that a deck of cards cannot do.</p>
    ${a.clusters.map(g => `<article class="cc-clus">
      <div class="cc-clus-h">${g.map(m => `<span class="cc-clus-sym" title="${esc(m.charm.name)}">${m.charm.sym}</span>`).join('')}
        <b class="serif">${g.map(m => esc(m.charm.name)).join(' · ')}</b>
        <span class="mono">${esc(g[0].ring.name)}, ${esc(g[0].quarter.name.toLowerCase())}</span></div>
      ${g.length === 2
        ? `<p class="cc-p">${esc(charmPairText(g[0].id, g[1].id))}</p>`
        : `<p class="cc-p">${esc(`Three or more in one place is a knot rather than a pairing: `
            + g.map(m => m.charm.k[0]).join(', ') + ` are all one subject here.`)}</p>
           ${g.slice(0, -1).map((m, i) => `<p class="cc-p faint">${esc(charmPairText(m.id, g[i + 1].id))}</p>`).join('')}`}
    </article>`).join('')}</section>`);

  /* the outer ring is the weather rather than the question, so it is
     summarised rather than given a paragraph each */
  const outer = a.readable.filter(m => m.ring.id === 'outer');
  if(outer.length) sections.push(`<section class="dv-sec"><h4 class="dv-sec-h">Out at the edge</h4>
    <p class="cc-lead">Further out than you: coming toward you, going away, or simply not yours to decide.</p>
    <div class="cc-edge">${outer.map(m => `<span class="cc-edge-i" style="--cc:${charmCatOf(m.charm).c}">
      <span>${m.charm.sym}</span><b class="serif">${esc(m.charm.name)}</b>
      <span class="mono">${esc(m.quarter.name.toLowerCase())}</span></span>`).join('')}</div></section>`);

  if(a.hidden.length) sections.push(`<section class="dv-sec" id="ccHiddenSec"><h4 class="dv-sec-h">Face down</h4>
    <p class="cc-lead">${a.hidden.length === 1 ? 'One charm' : a.hidden.length + ' charms'} landed the wrong way up.
      They are not part of the reading unless you turn them, and leaving them is a legitimate answer —
      some influences are working on you and are not yours to look at today.</p>
    <div class="cc-edge">${a.hidden.map(m => `<button type="button" class="cc-edge-i cc-turn" data-ccflip="${m.i}">
      <span>↻</span><b class="serif">turn it over</b><span class="mono">${esc(m.ring.name.toLowerCase())}</span></button>`).join('')}</div></section>`);

  sections.push(`<section class="dv-story"><h4 class="dv-sec-h">The scatter, as one thing</h4>
    <p>${esc(castNarrative(a))}</p>
    <div class="mono faint">Read as one. Where it is wrong is where your own reading starts.</div></section>`);

  const qs = castQuestions(a);
  if(qs.length) sections.push(`<section class="dv-sec"><h4 class="dv-sec-h">To sit with</h4>
    <ul class="dv-cr-q">${qs.map(q => `<li>${esc(q)}</li>`).join('')}</ul></section>`);

  return `<div class="dv-reading cc-reading">${sections.join('')}</div>`;
}

/* ============================================================
   THROWING THEM

   Four movements. They are gathered and shaken in the middle, they go
   up, they come down past where they are going and settle back onto it,
   and then the cloth is still. The overshoot is the whole illusion: an
   object that arrives at its resting place and stops was placed there,
   not thrown.

   Done with the Web Animations API rather than CSS keyframes because
   every charm needs its own arc, and thirty generated @keyframes blocks
   is a stylesheet written at runtime. For anyone who has asked for less
   motion there is no flight at all — the charms are simply where they
   landed, which is the same reading.
   ============================================================ */
function charmThrow(surface, marks, done){
  const soft = typeof reduced === 'function' && reduced();
  const toks = [...surface.querySelectorAll('[data-cctok]')];
  if(soft){ toks.forEach(t => t.classList.add('rest')); if(done) setTimeout(done, 0); return; }
  /* Each charm already sits at its landing place, set in CSS as a percentage
     of the cloth. The flight is expressed as a delta from there back to the
     middle and forward again, which needs pixels — so the cloth is measured
     once, here, at the moment of throwing. */
  const R = (surface.clientWidth || 460) / 2;
  surface.classList.add('casting');
  dvMoment('rattle');
  toks.forEach((t, i) => {
    const m = marks[i];
    t.style.setProperty('--bx', (-m.x * R).toFixed(1) + 'px');
    t.style.setProperty('--by', (-m.y * R).toFixed(1) + 'px');
    t.classList.add('gathered');
  });
  setTimeout(() => {
    dvMoment('whoosh');
    surface.classList.remove('casting');
    let last = 0;
    toks.forEach((tok, i) => {
      const m = marks[i];
      const delay = Math.random() * 240;
      const fly = 520 + Math.random() * 220;
      const spin = (Math.random() - .5) * 620;
      const X = m.x * R, Y = m.y * R;
      const at = (k, r, sc, op) => ({
        transform: `translate(-50%,-50%) translate(${((k - 1) * X).toFixed(1)}px,${((k - 1) * Y).toFixed(1)}px) rotate(${r.toFixed(0)}deg) scale(${sc})`,
        opacity: op});
      tok.classList.remove('gathered');
      tok.animate([
        Object.assign(at(0, 0, .72, .55), {offset: 0}),
        Object.assign(at(.55, spin * .5, 1.06, 1), {offset: .34}),
        /* past where it is going, then back onto it — an object that arrives
           and stops was placed there, not thrown */
        Object.assign(at(1.12, spin, 1.04, 1), {offset: .68}),
        Object.assign(at(.985, spin + m.rot * .6, .99, 1), {offset: .86}),
        Object.assign(at(1, m.rot, 1, 1), {offset: 1}),
      ], {duration: fly, delay, easing: 'cubic-bezier(.2,.62,.3,1)', fill: 'backwards'});
      const lands = delay + fly;
      last = Math.max(last, lands);
      setTimeout(() => {
        tok.classList.add('rest');
        dvMoment('tink');
        const r = tok.getBoundingClientRect();
        const cv = document.getElementById('ccMotes');
        if(cv){ const c = cv.getBoundingClientRect();
          dvField().burst(r.left - c.left + r.width / 2, r.top - c.top + r.height / 2, 6); }
      }, lands);
    });
    setTimeout(() => { dvMoment('wind'); dvMoment('bowlQuiet'); if(done) done(); }, last + 220);
  }, 360);
}

/* ---------- the whole thing ---------- */
function openCharmCast(pre = {}){
  const projects = typeof thProjects === 'function' ? thProjects() : [];
  let size = pre.size || divPrefs().castSize || 'standard';
  const m = openModal(`<h2>A cast</h2>
    <div class="stack" id="ccSetup">
      <p class="dv-yours-p">Older than the cards by a few thousand years. You throw the charms and read
        where they fall — what landed, where it landed, and what it landed beside. Nothing is in a
        position; everything is somewhere.</p>
      <div class="field"><label>What are you asking?</label>
        <input class="inp serif-lg" id="ccQ" value="${esc(pre.question || '')}" placeholder="Charms answer “show me what I am not seeing” better than they answer “will it happen”."></div>
      <div class="field"><label>How many</label>
        <div class="cc-sizes" id="ccSizes">${CAST_SIZES.map(s => `
          <button type="button" class="cc-size${s.id === size ? ' on' : ''}" data-ccsize="${s.id}">
            ${castSizeDotsHTML(s.n)}
            <span class="sp-name serif">${esc(s.name)}</span>
            <span class="sp-n mono">${s.n} charms</span>
            <span class="cc-size-h quote">${esc(s.hint)}</span>
          </button>`).join('')}</div></div>
      ${divTogglesHTML()}
      <div class="row" style="justify-content:flex-end;gap:8px;flex-wrap:wrap">
        <button class="btn" id="ccPhys" title="charms you already threw on a real cloth">📖 a cast you did on a cloth</button>
        <button class="btn primary" id="ccGo">Throw them</button></div>
    </div>
    <div id="ccOut"></div>`, 'wide');
  bindDivToggles(m);
  m.querySelectorAll('[data-ccsize]').forEach(b => b.onclick = () => {
    size = b.dataset.ccsize; divPrefSet('castSize', size);
    m.querySelectorAll('[data-ccsize]').forEach(x => x.classList.toggle('on', x === b));
    if(typeof sound === 'function') sound('click');
  });
  m.querySelector('#ccPhys').onclick = () => { const q = m.querySelector('#ccQ').value; m.remove(); openPhysicalCast({question: q, size}); };
  m.querySelector('#ccGo').onclick = () => {
    const thrown = charmCast(size);
    m.querySelector('#ccSetup').hidden = true;
    castStageInto(m.querySelector('#ccOut'), thrown, {
      question: () => m.querySelector('#ccQ')?.value.trim() || pre.question || '',
      size, projects, modal: m, animate: true,
      recast: () => { m.remove(); openCharmCast({question: m.querySelector('#ccQ')?.value || '', size}); },
    });
  };
}

const castSizeDotsHTML = n => `<svg class="cc-dots" viewBox="0 0 34 26" aria-hidden="true">${
  Array.from({length: n}, (_, i) => {
    /* the dots are a throw of their own, seeded off the index so the tile
       looks the same every time it is drawn */
    const a = (i * 2.399), r = 1.6 + Math.sqrt(i / n) * 9.6;
    return `<circle cx="${(17 + Math.cos(a) * r * 1.28).toFixed(1)}" cy="${(13 + Math.sin(a) * r).toFixed(1)}" r="1.1"/>`;
  }).join('')}</svg>`;

/* The cloth, the charms on it, and the reading under it — shared by a cast
   thrown here and one typed in from a real cloth, because they are the
   same reading and only the provenance differs. */
function castStageInto(host, thrown, opt){
  const a0 = castAnalyse(thrown);
  host.innerHTML = `<div class="cc-stage" id="ccStage">
    <canvas class="dv-motes" id="ccMotes" aria-hidden="true"></canvas>
    <button class="dv-mute mono" id="ccMute"></button>
    <div class="cc-surface" id="ccSurface">
      ${castClothHTML()}
      <div class="cc-toks" id="ccToks">${a0.marks.map(mk =>
        charmTokenHTML(mk, {sig: a0.sig && a0.sig.i === mk.i})).join('')}</div>
      <svg class="cc-links" id="ccLinks" viewBox="-50 -50 100 100" aria-hidden="true"></svg>
    </div>
    <div class="cc-tip" id="ccTip" hidden></div>
    <div class="row cc-bar">
      <span class="mono faint" id="ccWhat"></span>
      <span style="margin-left:auto"></span>
      <button class="pf-chip" id="ccAgain">throw again</button></div>
  </div>
  <div id="ccRead" hidden></div>`;

  const stage = host.querySelector('#ccStage');
  const field = dvFieldStart(host.querySelector('#ccMotes'));
  const mute = host.querySelector('#ccMute');
  const showMute = () => { mute.textContent = divPrefs().sound ? '♪ sound on' : '♪ sound off';
    mute.classList.toggle('off', !divPrefs().sound); };
  mute.onclick = () => { divPrefSet('sound', !divPrefs().sound); showMute();
    if(divPrefs().sound) CeremonySound.chime(); else CeremonySound.close(); };
  showMute();
  const stopAll = () => { dvFieldStop(); CeremonySound.close(); };
  const modalHost = document.getElementById('modals') || document.body;
  if(opt.modal){
    const obs = new MutationObserver(() => { if(!modalHost.contains(opt.modal)){ stopAll(); obs.disconnect(); } });
    obs.observe(modalHost, {childList: true});
  }
  host.querySelector('#ccAgain').onclick = () => { stopAll(); opt.recast(); };

  /* re-read and re-render whenever a face-down charm is turned */
  let a = a0;
  function paint(){
    a = castAnalyse(thrown);
    host.querySelector('#ccWhat').textContent =
      `${a.readable.length} read · ${a.hidden.length} face down · ${a.clusters.length} together`;
    const box = host.querySelector('#ccRead');
    box.innerHTML = castReadingHTML(a) + divKeepHTML(opt.projects);
    box.hidden = false;
    bindReading();
    host.querySelector('#dvSave').onclick = () => {
      divinationSave({system:'charms', question: opt.question(), spread: opt.size,
        title: `A cast — ${a.sig ? a.sig.charm.name : 'all face down'}`,
        charms: thrown.map(t => ({id:t.id, x:+t.x.toFixed(4), y:+t.y.toFixed(4), rot:t.rot,
          up:t.up, flipped:t.flipped})),
        cards: [], source: opt.source || 'digital',
        reading: host.querySelector('#dvText').value.trim(),
        revisit: host.querySelector('#dvRevisit').checked,
        projectId: host.querySelector('#dvProj')?.value || null});
      stopAll(); sound('success'); toast('Kept in the Lived Record.');
      if(opt.modal) opt.modal.remove();
      rerender();
    };
  }
  function bindReading(){
    host.querySelectorAll('[data-ccflip]').forEach(b => b.onclick = () => {
      const i = +b.dataset.ccflip;
      thrown[i].flipped = true;
      const tok = host.querySelector(`[data-cctok="${i}"]`);
      if(tok){ tok.classList.add('turning');
        setTimeout(() => { const mk = castAnalyse(thrown).marks[i];
          tok.outerHTML = charmTokenHTML(mk, {}); bindToks(); paint(); }, 260); }
      else paint();
      dvMoment('chime');
    });
  }

  /* Hovering a charm: it comes up, the others go quiet, and a line is drawn
     to everything it came down with. The cluster is the hardest thing to see
     in a scatter and the most of what the scatter means. */
  function bindToks(){
    const links = host.querySelector('#ccLinks'), tip = host.querySelector('#ccTip');
    host.querySelectorAll('[data-cctok]').forEach(tok => {
      const i = +tok.dataset.cctok;
      const on = () => {
        const mk = a.marks[i]; if(!mk) return;
        stage.classList.add('focused');
        tok.classList.add('lit');
        const group = a.clusters.find(g => g.some(x => x.i === i));
        links.innerHTML = group ? group.filter(x => x.i !== i).map(x =>
          `<line x1="${(mk.x * 50).toFixed(1)}" y1="${(mk.y * 50).toFixed(1)}"
             x2="${(x.x * 50).toFixed(1)}" y2="${(x.y * 50).toFixed(1)}"/>`).join('') : '';
        if(group) group.forEach(x => host.querySelector(`[data-cctok="${x.i}"]`)?.classList.add('kin'));
        const shown = mk.up || mk.flipped;
        tip.hidden = false;
        tip.innerHTML = shown
          ? `<b class="serif">${esc(mk.charm.name)}</b>
             <span class="mono">${esc(mk.ring.name)} · ${esc(mk.quarter.name.toLowerCase())}</span>
             <span class="cc-tip-k">${esc(mk.charm.k.join(' · '))}</span>`
          : `<b class="serif">face down</b><span class="mono">${esc(mk.ring.name)}</span>
             <span class="cc-tip-k">not part of the reading unless you turn it</span>`;
        host.querySelector(`[data-ccread="${i}"]`)?.classList.add('lit');
      };
      const off = () => {
        stage.classList.remove('focused');
        host.querySelectorAll('.cc-tok').forEach(t => t.classList.remove('lit', 'kin'));
        links.innerHTML = ''; tip.hidden = true;
        host.querySelectorAll('.cc-read').forEach(n => n.classList.remove('lit'));
      };
      tok.addEventListener('pointerenter', on);
      tok.addEventListener('pointerleave', off);
      tok.addEventListener('focus', on);
      tok.addEventListener('blur', off);
      tok.onclick = () => {
        const mk = a.marks[i];
        if(mk && !mk.up && !mk.flipped){
          thrown[i].flipped = true; tok.classList.add('turning'); dvMoment('chime');
          setTimeout(() => { const m2 = castAnalyse(thrown).marks[i];
            tok.outerHTML = charmTokenHTML(m2, {}); bindToks(); paint(); }, 260);
          return;
        }
        host.querySelector(`[data-ccread="${i}"]`)?.scrollIntoView({block:'center',
          behavior: (typeof reduced === 'function' && reduced()) ? 'auto' : 'smooth'});
      };
    });
  }

  bindToks();
  if(opt.animate){
    field.ambient(16);
    charmThrow(host.querySelector('#ccSurface'), a0.marks, () => {
      field.shimmer();
      paint();
      host.querySelector('#ccRead').scrollIntoView({block:'start',
        behavior: (typeof reduced === 'function' && reduced()) ? 'auto' : 'smooth'});
      setTimeout(() => field.stop(), 6000);
    });
  } else {
    host.querySelectorAll('[data-cctok]').forEach(t => t.classList.add('rest'));
    paint();
  }
}

/* ---------- a cast, kept ----------
   Opened months later from the Lived Record. The scatter is redrawn as it
   fell, because a list of which charms came up would be the one part of a
   cast that does not carry the meaning. */
function castKeptHTML(d){
  const thrown = d.charms || [];
  if(!thrown.length) return '<div class="cc-none quote">The charms for this cast were not kept.</div>';
  const a = castAnalyse(thrown);
  return `<div class="cc-kept">
    <div class="cc-surface small">
      ${castClothHTML()}
      <div class="cc-toks">${a.marks.map(mk =>
        charmTokenHTML(mk, {sig: a.sig && a.sig.i === mk.i})).join('').replace(/class="cc-tok/g, 'class="cc-tok rest')}</div>
    </div>
    ${castReadingHTML(a)}</div>`;
}

/* ============================================================
   A CAST YOU DID ON A CLOTH

   The paper equivalent of a real throw, and it cannot work the way the
   tarot one does. A card goes in position three; a charm goes wherever it
   went, and "wherever it went" is a place on a circle. So instead of a
   list of slots there is the cloth itself, and you put each charm where
   it actually fell by dragging it there — which is both the honest way to
   record a scatter and considerably faster than filling in two dropdowns
   per charm.

   Ring and quarter are read off the position, exactly as they are for a
   thrown cast, so a recorded one reads identically.
   ============================================================ */
function openPhysicalCast(pre = {}){
  const projects = typeof thProjects === 'function' ? thProjects() : [];
  let placed = [];                       /* {id, x, y, rot, up, flipped} */
  const m = openModal(`<h2>A cast you did on a cloth</h2>
    <div class="stack" id="pcWrap">
      <p class="dv-yours-p">Put each charm where it actually landed. Drag it on the cloth; the ring and the
        quarter are read off where you put it, the same way they are for a throw made here.</p>
      <div class="field"><label>What were you asking?</label>
        <input class="inp serif-lg" id="pcQ" value="${esc(pre.question || '')}"></div>
      <div class="cc-lay">
        <div class="cc-surface" id="pcSurface">
          ${castClothHTML()}
          <div class="cc-toks" id="pcToks"></div>
        </div>
        <div class="cc-tray">
          <div class="mono faint">the charms — click one to put it on the cloth</div>
          <div class="cc-pick" id="pcPick"></div>
        </div>
      </div>
      <div class="row" style="justify-content:flex-end;gap:8px">
        <button class="btn" id="pcClear">take them all off</button>
        <button class="btn primary" id="pcGo">Read it</button></div>
    </div>
    <div id="pcOut"></div>`, 'wide');

  const surface = m.querySelector('#pcSurface');
  function drawTray(){
    const used = new Set(placed.map(p => p.id));
    m.querySelector('#pcPick').innerHTML = CHARM_CATS.map(cat => {
      const list = charmPool().filter(c => (c.cat || 'shadow') === cat.id);
      if(!list.length) return '';
      return `<div class="cc-pick-cat"><span class="mono" style="color:${cat.c}">${esc(cat.name)}</span>
        <div class="cc-pick-row">${list.map(c => `<button type="button" class="cc-chip${used.has(c.id) ? ' used' : ''}"
          data-pcadd="${esc(c.id)}" title="${esc(c.name)} — ${esc(c.k.join(', '))}" style="--cc:${cat.c}">
          <span>${c.sym}</span><span class="cc-chip-n">${esc(c.name.replace(/^The /, ''))}</span></button>`).join('')}</div></div>`;
    }).join('');
    m.querySelectorAll('[data-pcadd]').forEach(b => b.onclick = () => {
      const id = b.dataset.pcadd;
      if(placed.some(p => p.id === id)){ placed = placed.filter(p => p.id !== id); }
      else {
        /* dropped just off centre, in a free-ish spot, and then dragged */
        const t = placed.length * 2.399;
        const r = .16 + Math.min(.7, placed.length * .035);
        placed.push({id, x: Math.cos(t) * r, y: Math.sin(t) * r,
          rot: Math.round((Math.random() - .5) * 40), up: true, flipped: false});
      }
      drawAll(); if(typeof sound === 'function') sound('click');
    });
  }
  function drawCloth(){
    const a = castAnalyse(placed);
    m.querySelector('#pcToks').innerHTML = a.marks.map(mk =>
      charmTokenHTML(mk, {})).join('').replace(/class="cc-tok/g, 'class="cc-tok rest drag');
    m.querySelectorAll('#pcToks [data-cctok]').forEach(tok => {
      const i = +tok.dataset.cctok;
      tok.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        tok.setPointerCapture(ev.pointerId);
        tok.classList.add('lit');
        const move = e => {
          const r = surface.getBoundingClientRect();
          let x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
          let y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
          const d = Math.hypot(x, y);
          if(d > 1){ x /= d; y /= d; }          /* nothing lands off the cloth */
          placed[i].x = x; placed[i].y = y;
          tok.style.setProperty('--x', (x * 50).toFixed(2));
          tok.style.setProperty('--y', (y * 50).toFixed(2));
        };
        const up = () => { tok.removeEventListener('pointermove', move);
          tok.removeEventListener('pointerup', up); tok.removeEventListener('pointercancel', up);
          tok.classList.remove('lit'); zones(); };
        tok.addEventListener('pointermove', move);
        tok.addEventListener('pointerup', up);
        tok.addEventListener('pointercancel', up);
      });
      /* a charm on the cloth can be turned face down, the way one does on a
         real cloth by simply leaving it as it fell */
      tok.addEventListener('dblclick', () => { placed[i].up = !placed[i].up; drawAll(); });
    });
  }
  function zones(){
    const a = castAnalyse(placed);
    m.querySelector('#pcZones').innerHTML = placed.length
      ? a.marks.map(mk => `<span class="cc-zline"><b>${mk.charm.sym}</b> ${esc(mk.charm.name)}
          <span class="mono">${esc(mk.ring.name.toLowerCase())} · ${esc(mk.quarter.name.toLowerCase())}${
            (mk.up || mk.flipped) ? '' : ' · face down'}</span></span>`).join('')
      : '<span class="quote">Nothing on the cloth yet.</span>';
  }
  function drawAll(){ drawTray(); drawCloth(); zones(); }

  m.querySelector('.cc-tray').insertAdjacentHTML('beforeend',
    '<div class="cc-zones mono" id="pcZones"></div>');
  m.querySelector('#pcClear').onclick = () => { placed = []; drawAll(); };
  drawAll();

  m.querySelector('#pcGo').onclick = () => {
    if(placed.length < 2) return toast('Put at least two charms on the cloth.');
    m.querySelector('#pcWrap').hidden = true;
    castStageInto(m.querySelector('#pcOut'), placed.slice(), {
      question: () => m.querySelector('#pcQ')?.value.trim() || '',
      size: 'cloth', projects, modal: m, animate: false, source: 'physical',
      recast: () => { m.remove(); openPhysicalCast({question: m.querySelector('#pcQ')?.value || ''}); },
    });
    m.querySelector('#pcOut').insertAdjacentHTML('afterbegin',
      `<div class="ph-done"><span class="dv-src mono">📖 thrown on a cloth</span></div>`);
  };
}
