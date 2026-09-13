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

/* ---------- the directory ---------- */
function openCardDirectory(startAt){
  let tab = 'major', q = '';
  const counts = cardCounts();
  const m = openModal(`<h2>The deck</h2>
    <div class="stack" id="cdWrap">
      <p class="dv-yours-p">All seventy-eight, what each one means, and what each one has meant to you.
        The ones you have not drawn are dimmed.</p>
      <input class="inp" id="cdFind" placeholder="a name, a keyword, an element — “love”, “tower”, “fire”" autocomplete="off">
      <div class="row cd-tabs" style="gap:5px;flex-wrap:wrap">${CARD_TABS.map(t =>
        `<button class="chip${t.id === tab ? ' on' : ''}" data-cdtab="${t.id}">${esc(t.name)}</button>`).join('')}</div>
      <div class="cd-count mono" id="cdCount"></div>
      <div class="cd-grid" id="cdGrid"></div>
    </div>
    <div id="cdPage" hidden></div>`, 'wide');

  function grid(){
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
  m.querySelectorAll('[data-cdtab]').forEach(b => b.onclick = () => {
    tab = b.dataset.cdtab; q = ''; m.querySelector('#cdFind').value = '';
    m.querySelectorAll('[data-cdtab]').forEach(x => x.classList.toggle('on', x === b));
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
  if(typeof startAt === 'number') page(startAt);
  else grid();
}
