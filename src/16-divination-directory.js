/* ============================================================
   THE CARD DIRECTORY

   Seventy-eight cards, browsable, with everything the deck knows about
   each one — and, underneath that, everything YOU know about it: every
   time it has come up, in which spread, in which position, which way up,
   what you had asked, and what you wrote down afterwards.

   That second half is the whole reason this exists. A tarot encyclopedia
   is a book and there are better books. What no book has is the fact that
   the Tower has turned up in your outcome position three times this year,
   which is the sort of thing a person does not notice while it is
   happening and cannot miss once it is written down.

   Cards you have never drawn are dimmed rather than hidden. Not a
   collection to complete — just an honest picture of which parts of the
   deck you have actually met.
   ============================================================ */

/* ---------- every appearance of a card, across every reading kept ---------- */
function cardAppearances(cardId){
  const out = [];
  (S.entries || []).forEach(e => {
    if(e.type !== 'divination') return;
    const d = divinationOf(e); if(!d || d.system !== 'tarot') return;
    (d.cards || []).forEach((c, i) => {
      if(c.card !== cardId) return;
      out.push({entry: e, day: e.occurredAt, at: e.createdAt || e.occurredAt,
        spread: spreadById(d.spread).name, pos: c.pos || `card ${i + 1}`,
        rev: !!c.rev, question: d.question || '', note: e.body || '',
        source: d.source || 'digital'});
    });
  });
  return out.sort((a, b) => (b.at || '') < (a.at || '') ? -1 : 1);
}
/* how many times each of the seventy-eight has come up, in one pass —
   the grid asks for all of them at once and 78 × every entry is silly */
function cardCounts(){
  const n = new Array(TAROT.length).fill(0);
  (S.entries || []).forEach(e => {
    if(e.type !== 'divination') return;
    const d = divinationOf(e); if(!d || d.system !== 'tarot') return;
    (d.cards || []).forEach(c => { if(typeof c.card === 'number' && n[c.card] !== undefined) n[c.card]++; });
  });
  return n;
}

/* A sentence about a card's history, or the absence of one. Template-built
   and deliberately modest: it counts and it notices a repeated position,
   and it does not pretend to more than that. */
function cardPattern(cardId, apps){
  const card = tarotCard(cardId);
  if(!apps.length) return 'You have not drawn this one yet. It is waiting its turn.';
  if(apps.length === 1){
    const a = apps[0];
    return `Drawn once, ${fmtDate(a.day, 'long')}, in “${a.pos}”${a.rev ? ', reversed' : ''}.`;
  }
  const up = apps.filter(a => !a.rev).length;
  const by = {};
  apps.forEach(a => { by[a.pos] = (by[a.pos] || 0) + 1; });
  const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  let t = `Drawn ${apps.length} times — ${up} upright, ${apps.length - up} reversed. `;
  if(top[1] > 1){
    const keys = (card.keywords || []).slice(0, 2).join(' and ') || 'what it carries';
    t += `Most often in “${top[0]}” (${top[1]} of them), which puts ${keys} in that part of your questions `
       + `more than anywhere else.`;
  } else {
    t += 'No one position more than another, so far.';
  }
  return t;
}

/* ---------- every cast a charm has turned up in ----------
   Not the same question as a card's history: a charm has a place as well
   as an appearance, and where it keeps landing is most of what its
   history says. */
function charmAppearances(charmId){
  const out = [];
  (S.entries || []).forEach(e => {
    if(e.type !== 'divination') return;
    const d = divinationOf(e); if(!d || d.system !== 'charms' || !d.charms) return;
    const a = castAnalyse(d.charms);
    a.marks.forEach(mk => {
      if(mk.id !== charmId) return;
      out.push({entry: e, day: e.occurredAt, at: e.createdAt || e.occurredAt,
        ring: mk.ring, quarter: mk.quarter, up: mk.up || mk.flipped,
        sig: !!(a.sig && a.sig.i === mk.i),
        withWhom: (a.clusters.find(g => g.some(x => x.i === mk.i)) || [])
          .filter(x => x.i !== mk.i).map(x => x.charm.name),
        question: d.question || '', note: e.body || '', source: d.source || 'digital'});
    });
  });
  return out.sort((a, b) => (b.at || '') < (a.at || '') ? -1 : 1);
}
function charmCounts(){
  const n = {};
  (S.entries || []).forEach(e => {
    if(e.type !== 'divination') return;
    const d = divinationOf(e); if(!d || d.system !== 'charms' || !d.charms) return;
    d.charms.forEach(c => { n[c.id] = (n[c.id] || 0) + 1; });
  });
  return n;
}
function charmPattern(charm, apps){
  if(!apps.length) return 'You have not thrown this one yet — or it has not come up. It is in the bag either way.';
  if(apps.length === 1){
    const a = apps[0];
    return `Thrown once that it landed readable: ${fmtDate(a.day, 'long')}, in ${a.ring.name.toLowerCase()}, `
      + `toward ${a.quarter.name.toLowerCase()}${a.sig ? ', at the centre of that cast' : ''}.`;
  }
  const byRing = {}, byQ = {};
  apps.forEach(a => { byRing[a.ring.name] = (byRing[a.ring.name] || 0) + 1;
    byQ[a.quarter.name] = (byQ[a.quarter.name] || 0) + 1; });
  const topR = Object.entries(byRing).sort((a, b) => b[1] - a[1])[0];
  const topQ = Object.entries(byQ).sort((a, b) => b[1] - a[1])[0];
  const sigs = apps.filter(a => a.sig).length;
  let t = `It has come up ${apps.length} times. `;
  if(topR[1] > apps.length * .5)
    t += `Mostly in ${topR[0].toLowerCase()} (${topR[1]} of them), `
       + `which puts ${charm.k[0]} ${topR[0] === 'The core' ? 'squarely in the middle of your questions' : 'at that distance from you again and again'}. `;
  if(topQ[1] > apps.length * .5)
    t += `And mostly toward ${topQ[0].toLowerCase()}. `;
  if(sigs) t += `${sigs === 1 ? 'Once' : sigs + ' times'} it landed nearest the centre and opened the reading.`;
  return t.trim();
}

/* ---------- the directory ---------- */
function openCardDirectory(startAt){
  let tab = 'major', q = '';
  const counts = cardCounts();
  const charmN = charmCounts();
  const m = openModal(`<h2>The deck</h2>
    <div class="stack" id="cdWrap">
      <p class="dv-yours-p">All seventy-eight, what each one means, and what each one has meant to you.
        The ones you have not drawn are dimmed.</p>
      <input class="inp" id="cdFind" placeholder="a name, a keyword, an element — “love”, “tower”, “fire”" autocomplete="off">
      <div class="row cd-tabs" style="gap:5px;flex-wrap:wrap">${CARD_TABS.map(t =>
        `<button class="chip${t.id === tab ? ' on' : ''}" data-cdtab="${t.id}">${esc(t.name)}</button>`).join('')}
        <button class="chip" data-cdtab="charms">Charms</button></div>
      <div class="cd-count mono" id="cdCount"></div>
      <div class="cd-grid" id="cdGrid"></div>
    </div>
    <div id="cdPage" hidden></div>`, 'wide');

  function grid(){
    if(tab === 'charms') return charmGrid();
    const list = q ? cardSearch(q, 78) : cardsInTab(tab);
    const seen = list.filter(i => counts[i]).length;
    m.querySelector('#cdCount').textContent = q
      ? `${list.length} card${list.length === 1 ? '' : 's'} match “${q}”`
      : `${list.length} cards · ${seen} of them drawn at least once`;
    m.querySelector('#cdGrid').innerHTML = list.length
      ? list.map(i => cardTileHTML(i, {count: counts[i], dim: !counts[i]})).join('')
      : '<div class="pk-empty">Nothing in the deck goes by that.</div>';
    m.querySelectorAll('[data-cardpick]').forEach(b => b.onclick = () => page(+b.dataset.cardpick));
  }
  /* the charms browse by family rather than by suit, and a charm is a
     symbol rather than a picture, so the tile is a token like the ones on
     the cloth */
  function charmGrid(){
    const ql = q.toLowerCase();
    const hit = c => !ql || c.name.toLowerCase().includes(ql)
      || c.k.some(k => k.toLowerCase().includes(ql)) || c.m.toLowerCase().includes(ql);
    const pool = charmPool().filter(hit);
    const seen = pool.filter(c => charmN[c.id]).length;
    m.querySelector('#cdCount').textContent = q
      ? `${pool.length} charm${pool.length === 1 ? '' : 's'} match “${q}”`
      : `${pool.length} charms · ${seen} of them thrown at least once`;
    m.querySelector('#cdGrid').className = 'cd-grid charms';
    m.querySelector('#cdGrid').innerHTML = pool.length
      ? CHARM_CATS.map(cat => {
          const list = pool.filter(c => (c.cat || 'shadow') === cat.id);
          if(!list.length) return '';
          return `<section class="cd-fam"><h5 class="cd-fam-h" style="--cc:${cat.c}">
            <span class="sc">${esc(cat.name)}</span><span class="quote">${esc(cat.hint)}</span></h5>
            <div class="cd-fam-row">${list.map(c => `<button type="button" class="cd-ctile${charmN[c.id] ? '' : ' dim'}"
              data-charmpick="${esc(c.id)}" style="--cc:${cat.c}" title="${esc(c.k.join(', '))}">
              <span class="cd-ctok">${c.sym}</span><span class="cd-t-name">${esc(c.name)}</span>
              ${charmN[c.id] ? `<span class="cd-t-n mono">×${charmN[c.id]}</span>` : ''}</button>`).join('')}</div>
          </section>`; }).join('')
        + `<button type="button" class="cd-ctile add" data-charmnew><span class="cd-ctok">＋</span>
            <span class="cd-t-name">one of your own</span></button>`
      : '<div class="pk-empty">Nothing in the bag goes by that.</div>';
    m.querySelectorAll('[data-charmpick]').forEach(b => b.onclick = () => charmPage(b.dataset.charmpick));
    const nu = m.querySelector('[data-charmnew]');
    if(nu) nu.onclick = () => openCustomCharm(null, () => { Object.assign(charmN, charmCounts()); grid(); });
  }
  m.querySelectorAll('[data-cdtab]').forEach(b => b.onclick = () => {
    tab = b.dataset.cdtab; q = ''; m.querySelector('#cdFind').value = '';
    m.querySelectorAll('[data-cdtab]').forEach(x => x.classList.toggle('on', x === b));
    m.querySelector('#cdGrid').className = 'cd-grid';
    grid();
  });
  m.querySelector('#cdFind').addEventListener('input', e => { q = e.target.value.trim(); grid(); });

  /* one card's page: the reference above the rule, your own history below */
  function page(i){
    const c = tarotCard(i); if(!c) return;
    const apps = cardAppearances(i);
    const col = SUIT_COLOR[c.suit] || '#8f7bb0';
    const side = (s, label) => `<section class="cd-side"><h4 class="dv-sec-h">${label}</h4>
      <p class="cd-sum">${esc(s.summary || s.plain || '')}</p>
      ${s.themes && s.themes.length ? `<div class="dv-cards">${s.themes.map(t =>
        `<span class="pt-tag" style="--c:${col}">${esc(t)}</span>`).join('')}</div>` : ''}
      ${s.inDepth ? s.inDepth.split('\n\n').filter(Boolean).map(t => `<p class="cd-p">${esc(t)}</p>`).join('') : ''}
      ${s.advice ? `<p class="cd-adv"><b>What it asks:</b> ${esc(s.advice)}</p>` : ''}
      ${s.questions && s.questions.length ? `<ul class="dv-cr-q">${s.questions.map(x =>
        `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</section>`;
    m.querySelector('#cdWrap').hidden = true;
    const box = m.querySelector('#cdPage');
    box.hidden = false;
    box.innerHTML = `<div class="cd-page" style="--sc:${col}">
      <button class="pf-chip" id="cdBack">‹ all the cards</button>
      <div class="cd-head">
        <div class="tc up" style="--sc:${col}"><div class="tc-inner"><div class="tc-face">${tarotFaceHTML(c)}</div></div></div>
        <div class="cd-head-t">
          <h3 class="serif">${esc(c.name)}</h3>
          <div class="mono faint">${c.arcana === 'major' ? `Major Arcana · ${CARD_ROMAN[c.number] ? CARD_ROMAN[c.number].toUpperCase() : c.number}`
            : `${esc(c.suit.charAt(0).toUpperCase() + c.suit.slice(1))} · ${c.number}`}${
            c.element ? ` · ${esc(c.element)}` : ''}${c.planet ? ` · ${esc(c.planet)}` : ''}</div>
          ${c.essence ? `<p class="cd-ess">${esc(c.essence)}</p>` : ''}
          ${counts[i] ? `<span class="cd-seen mono">drawn ${counts[i]} time${counts[i] === 1 ? '' : 's'}</span>`
            : '<span class="cd-seen mono none">not yet drawn</span>'}
        </div></div>
      ${c.imagery ? `<section class="cd-side"><h4 class="dv-sec-h">What it shows</h4>
        <p class="cd-p">${esc(c.imagery)}</p></section>` : ''}
      ${side(c.upright, 'Upright')}
      ${side(c.reversed, 'Reversed')}
      ${c.numerology && c.numerology.meaning ? `<section class="cd-side"><h4 class="dv-sec-h">The number</h4>
        <p class="cd-p"><b>${c.numerology.number}</b> — ${esc(c.numerology.meaning)}</p></section>` : ''}
      ${(c.relatedCards || []).length ? `<section class="cd-side"><h4 class="dv-sec-h">It travels with</h4>
        <div class="dv-cards">${c.relatedCards.map(r => {
          const at = TAROT.findIndex(x => x.n === r || x.n.split('/').some(y => y.trim() === r));
          return at >= 0 ? `<button class="chip" data-cardgo="${at}">${esc(r)}</button>`
                         : `<span class="chip">${esc(r)}</span>`; }).join('')}</div></section>` : ''}
      <section class="cd-hist">
        <h4 class="dv-sec-h">Your history with ${esc(c.name)}</h4>
        <p class="cd-pat">${esc(cardPattern(i, apps))}</p>
        ${apps.map(a => `<article class="cd-app">
          <div class="cd-app-h"><span class="mono">${esc(fmtDate(a.day, 'med'))}</span>
            <b class="serif">${esc(a.spread)}</b>
            ${a.source === 'physical' ? '<span class="dv-src mono">📖 paper</span>' : ''}</div>
          <div class="mono faint">${esc(a.pos)} · ${a.rev ? 'reversed' : 'upright'}</div>
          ${a.question ? `<div class="cd-app-q quote">“${esc(a.question)}”</div>` : ''}
          ${a.note ? `<p class="cd-app-n">${esc(a.note.length > 260 ? a.note.slice(0, 260) + '…' : a.note)}</p>` : ''}
          <button class="pf-chip" data-cdopen="${a.entry.id}">the whole reading →</button>
        </article>`).join('')}
      </section></div>`;
    box.querySelector('#cdBack').onclick = () => {
      box.hidden = true; m.querySelector('#cdWrap').hidden = false; grid(); };
    box.querySelectorAll('[data-cardgo]').forEach(b => b.onclick = () => page(+b.dataset.cardgo));
    /* the same road the day's draws take to the Lived Record: address the
       journal by kind, then find the entry in it */
    box.querySelectorAll('[data-cdopen]').forEach(b => b.onclick = () => {
      const id = b.dataset.cdopen; m.remove();
      navigate('#/journals/divination');
      setTimeout(() => { const n = document.querySelector(`[data-entry="${id}"]`);
        if(n){ n.scrollIntoView({block: 'center'});
          n.style.background = 'color-mix(in srgb,var(--terra) 12%,transparent)';
          setTimeout(() => n.style.background = '', 1600); } }, 350);
    });
    box.scrollIntoView({block: 'start'});
  }
  /* a charm's own page: what it means, and every cast it has landed in */
  function charmPage(id){
    const c = charmById(id); if(!c) return;
    const cat = charmCatOf(c), apps = charmAppearances(id);
    const mine = (divPrefs().customCharms || []).some(x => x.id === id);
    /* the pairings this charm has written for it, which are the most
       charm-specific thing in the whole system */
    const pairs = Object.keys(CHARM_PAIRS).filter(k => k.split('+').includes(id))
      .map(k => ({other: charmById(k.split('+').find(x => x !== id)), text: CHARM_PAIRS[k]}))
      .filter(x => x.other);
    m.querySelector('#cdWrap').hidden = true;
    const box = m.querySelector('#cdPage');
    box.hidden = false;
    box.innerHTML = `<div class="cd-page" style="--sc:${cat.c};--cc:${cat.c}">
      <button class="pf-chip" id="cdBack">‹ all of them</button>
      <div class="cd-head">
        <div class="cd-bigtok">${c.sym}</div>
        <div class="cd-head-t">
          <h3 class="serif">${esc(c.name)}</h3>
          <div class="mono faint">${esc(cat.name)} · ${esc(cat.hint)}</div>
          <p class="cd-ess">${esc(c.k.join(' · '))}</p>
          ${apps.length ? `<span class="cd-seen mono">thrown ${apps.length} time${apps.length === 1 ? '' : 's'}</span>`
            : '<span class="cd-seen mono none">not yet thrown</span>'}
          ${mine ? ' <button class="pf-chip" id="cdEditCharm">edit it</button>' : ''}
        </div></div>
      <section class="cd-side"><h4 class="dv-sec-h">What it says</h4>
        <p class="cd-sum">${esc(c.m)}</p></section>
      ${pairs.length ? `<section class="cd-side"><h4 class="dv-sec-h">Beside another charm</h4>
        <p class="cd-p faint">A cast is read in pairs as much as in single charms. These are the ones
          written out; any other pairing is read from the two sets of themes.</p>
        ${pairs.map(x => `<div class="cc-clus"><div class="cc-clus-h">
          <span class="cc-clus-sym">${c.sym}</span><span class="cc-clus-sym">${x.other.sym}</span>
          <b class="serif">with ${esc(x.other.name)}</b></div>
          <p class="cc-p">${esc(x.text)}</p></div>`).join('')}</section>` : ''}
      <section class="cd-hist">
        <h4 class="dv-sec-h">Where it keeps landing</h4>
        <p class="cd-pat">${esc(charmPattern(c, apps))}</p>
        ${apps.map(a => `<article class="cd-app">
          <div class="cd-app-h"><span class="mono">${esc(fmtDate(a.day, 'med'))}</span>
            <b class="serif">${esc(a.ring.name)}, ${esc(a.quarter.name.toLowerCase())}</b>
            ${a.sig ? '<span class="dv-src mono">the centre</span>' : ''}
            ${a.up ? '' : '<span class="dv-src mono">face down</span>'}
            ${a.source === 'physical' ? '<span class="dv-src mono">📖 cloth</span>' : ''}</div>
          ${a.withWhom.length ? `<div class="mono faint">with ${esc(a.withWhom.join(', '))}</div>` : ''}
          ${a.question ? `<div class="cd-app-q quote">“${esc(a.question)}”</div>` : ''}
          ${a.note ? `<p class="cd-app-n">${esc(a.note.length > 260 ? a.note.slice(0, 260) + '…' : a.note)}</p>` : ''}
          <button class="pf-chip" data-cdopen="${a.entry.id}">the whole cast →</button>
        </article>`).join('')}
      </section></div>`;
    box.querySelector('#cdBack').onclick = () => {
      box.hidden = true; m.querySelector('#cdWrap').hidden = false; grid(); };
    const ed = box.querySelector('#cdEditCharm');
    if(ed) ed.onclick = () => openCustomCharm(charmCustom(id), left => {
      Object.assign(charmN, charmCounts());
      if(left) charmPage(left); else { box.hidden = true; m.querySelector('#cdWrap').hidden = false; grid(); } });
    box.querySelectorAll('[data-cdopen]').forEach(b => b.onclick = () => {
      const eid = b.dataset.cdopen; m.remove();
      navigate('#/journals/divination');
      setTimeout(() => { const n = document.querySelector(`[data-entry="${eid}"]`);
        if(n){ n.scrollIntoView({block: 'center'});
          n.style.background = 'color-mix(in srgb,var(--terra) 12%,transparent)';
          setTimeout(() => n.style.background = '', 1600); } }, 350);
    });
    box.scrollIntoView({block: 'start'});
  }

  if(typeof startAt === 'number') page(startAt);
  else if(typeof startAt === 'string'){ tab = 'charms';
    m.querySelectorAll('[data-cdtab]').forEach(x => x.classList.toggle('on', x.dataset.cdtab === 'charms'));
    charmPage(startAt); }
  else grid();
}

/* ---------- a charm of your own ----------
   Everyone who does this for long adds to their set — a thing off a beach,
   a button from a coat, something that means one specific thing to one
   person. Ten is the cap, which is about where a set stops being curated
   and starts being a drawer. */
function openCustomCharm(rec, then){
  const cats = CHARM_CATS;
  const m = openModal(`<h2>${rec ? 'Your charm' : 'A charm of your own'}</h2>
    <div class="stack">
      <p class="dv-yours-p">Something that means a specific thing to you. It goes into the bag with the
        thirty and comes up as often as any of them.</p>
      <div class="row" style="gap:9px;align-items:flex-end;flex-wrap:wrap">
        <div class="field" style="flex:0 0 84px"><label>Its mark</label>
          <input class="inp cc-symin" id="chSym" maxlength="4" value="${esc(rec ? rec.sym : '')}" placeholder="🔔"></div>
        <div class="field" style="flex:1 1 200px"><label>What you call it</label>
          <input class="inp serif-lg" id="chName" value="${esc(rec ? rec.name : '')}" placeholder="The Bell"></div>
      </div>
      <div class="field"><label>Its family</label>
        <div class="row" style="gap:5px;flex-wrap:wrap">${cats.map(c =>
          `<button type="button" class="chip${rec && rec.cat === c.id || !rec && c.id === 'self' ? ' on' : ''}"
            data-chcat="${c.id}" style="--c:${c.c}">${esc(c.name)}</button>`).join('')}</div></div>
      <div class="field"><label>Its themes, separated by commas</label>
        <input class="inp" id="chKeys" value="${esc(rec ? rec.k.join(', ') : '')}" placeholder="warning, attention, the moment it turns"></div>
      <div class="field"><label>What it says</label>
        <textarea class="inp" id="chMean" rows="4" placeholder="Written to yourself, in your own words — this is the text you will read months from now.">${esc(rec ? rec.m : '')}</textarea></div>
      <div class="row between">
        ${rec ? '<button class="btn danger" id="chDel">take it out of the bag</button>' : '<span></span>'}
        <button class="btn primary" id="chSave">${rec ? 'save it' : 'put it in'}</button></div>
    </div>`, 'narrow');
  let cat = rec ? rec.cat : 'self';
  m.querySelectorAll('[data-chcat]').forEach(b => b.onclick = () => { cat = b.dataset.chcat;
    m.querySelectorAll('[data-chcat]').forEach(x => x.classList.toggle('on', x === b)); });
  m.querySelector('#chSave').onclick = () => {
    const name = m.querySelector('#chName').value.trim();
    const sym = m.querySelector('#chSym').value.trim() || '◆';
    const mean = m.querySelector('#chMean').value.trim();
    const keys = m.querySelector('#chKeys').value.split(',').map(x => x.trim()).filter(Boolean).slice(0, 6);
    if(!name) return toast('It needs a name.');
    if(!keys.length) return toast('Give it at least one theme.');
    const p = divPrefs();
    if(!rec && p.customCharms.length >= 10) return toast('Ten of your own is the limit. Take one out first.');
    const out = {id: rec ? rec.id : 'own-' + uid(), name, sym, cat, k: keys,
      m: mean || `${name}: ${keys.join(', ')}.`, hue: 40, own: true,
      createdAt: rec ? rec.createdAt : new Date().toISOString()};
    if(rec) p.customCharms = p.customCharms.map(x => x.id === rec.id ? out : x);
    else p.customCharms.push(out);
    saveNow(); sound('success'); m.remove(); if(then) then(out.id);
  };
  if(rec) m.querySelector('#chDel').onclick = () => {
    const p = divPrefs();
    p.customCharms = p.customCharms.filter(x => x.id !== rec.id);
    saveNow(); m.remove(); if(then) then(null);
  };
}
