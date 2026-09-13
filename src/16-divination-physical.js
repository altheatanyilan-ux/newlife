/* ============================================================
   A READING YOU DID ON PAPER

   Most readings that matter are done with a real deck on a real table.
   The cards are the same cards, the positions are the same positions, and
   everything this app can say about them is just as true — so there is no
   reason the long interpretation, the position guidance, the story and the
   box to write in should be available only to a deal made by a random
   number generator.

   So: choose the spread, name the cards, and get the identical reading.
   The entry is marked as having come from paper and nothing else about it
   differs — it is in the journal, in the card directory's history, and in
   the review with the rest.

   Two ways to name a card, because people are different: type it, with
   everything matched loosely enough that "3 cups", "three of cups" and
   "cups 3" all land on the same card; or open the deck and point at it.
   ============================================================ */

/* ---------- finding a card by whatever the person typed ----------
   Names, numbers, suit abbreviations, roman numerals and keywords, scored
   so that an exact name beats a keyword and a prefix beats a substring. */
const CARD_WORDS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                    'page', 'knight', 'queen', 'king'];
const CARD_ROMAN = ['0','i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv',
                    'xv','xvi','xvii','xviii','xix','xx','xxi'];
const SUIT_WORDS = {wands:['wands','wand','w','rods','staves','batons','fire'],
                    cups:['cups','cup','c','chalices','hearts','water'],
                    swords:['swords','sword','s','blades','air'],
                    pentacles:['pentacles','pentacle','p','coins','disks','discs','earth'],
                    major:['major','majors','arcana','trump','trumps']};

/* everything one card can be called, lower-cased, built once */
let _cardIndex = null;
function cardIndex(){
  if(_cardIndex) return _cardIndex;
  _cardIndex = TAROT.map((c, i) => {
    const names = [c.n.toLowerCase()];
    /* "The Papess/High Priestess" is two names for one card */
    c.n.toLowerCase().split('/').forEach(x => names.push(x.trim()));
    names.push(c.n.toLowerCase().replace(/^the\s+/, ''));
    if(c.s === 'major'){
      names.push(String(c.r), CARD_ROMAN[c.r] || '');
    } else {
      const word = CARD_WORDS[c.r - 1] || '';
      (SUIT_WORDS[c.s] || []).forEach(su => {
        names.push(`${word} of ${su}`, `${word} ${su}`, `${su} ${c.r}`, `${c.r} ${su}`, `${su}${c.r}`);
        if(c.r > 10) names.push(`${word} of ${su}`);
      });
    }
    return {i, names: [...new Set(names.filter(Boolean))],
            keys: (c.k || []).map(k => k.toLowerCase()),
            el: (SUIT_ELEM[c.s] || '').toLowerCase()};
  });
  return _cardIndex;
}
/* the matches for what has been typed, best first */
function cardSearch(q, limit = 8){
  q = (q || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if(!q) return [];
  const out = [];
  for(const e of cardIndex()){
    let best = 0;
    for(const n of e.names){
      if(n === q){ best = Math.max(best, 100); break; }
      if(n.startsWith(q)) best = Math.max(best, 70 - n.length * .1);
      else if(n.includes(q)) best = Math.max(best, 45 - n.length * .1);
    }
    if(!best) for(const k of e.keys) if(k.startsWith(q)) best = Math.max(best, 22);
    if(!best && e.el && e.el.startsWith(q)) best = 14;
    if(best) out.push({i: e.i, score: best});
  }
  return out.sort((a, b) => b.score - a.score || a.i - b.i).slice(0, limit).map(x => x.i);
}

/* ---------- the form ---------- */
function openPhysicalReading(pre = {}){
  const projects = typeof thProjects === 'function' ? thProjects() : [];
  let spreadId = spreadById(pre.spread || divPrefs().spread || 'ppf').id;
  let rev = divPrefs().reversals;
  /* one entry per slot: which card, and which way up */
  let slots = [];
  const m = openModal(`<h2>A reading you did on paper</h2>
    <div class="stack" id="phWrap">
      <p class="dv-yours-p">Cards you have already laid out. Name them and the reading is the same
        reading — the long meanings, the position guidance, the story, and room to write.</p>
      <div class="field"><label>What were you asking?</label>
        <input class="inp serif-lg" id="phQ" value="${esc(pre.question || '')}" placeholder="The question you sat down with."></div>
      <div class="field"><label>Which spread did you lay out?</label>
        ${spreadPickerHTML(spreadId)}
        <div class="sp-chosen" id="phChosen"></div></div>
      <div class="dv-switches"><button type="button" class="dv-sw${rev ? ' on' : ''}" id="phRev" role="switch"
        aria-checked="${rev}" title="whether any of the cards were upside down"><i></i><span>Reversals were in play</span></button></div>
      <div id="phSlots"></div>
      <div class="row" style="justify-content:flex-end;gap:8px">
        <button class="btn primary" id="phGo">Read it</button></div>
    </div>
    <div id="phOut"></div>`, 'wide');

  const sp = () => spreadById(spreadId);
  function drawSlots(){
    const s = sp();
    /* a yes/no laid on paper still has to be able to say no */
    if(s.forceRev) rev = true;
    slots = s.positions.map((_, i) => slots[i] || {card: null, rev: false});
    slots.length = s.cardCount;
    m.querySelector('#phChosen').innerHTML = `<p class="sp-desc">${esc(s.desc)}</p>`;
    m.querySelectorAll('[data-dvspread]').forEach(b => b.classList.toggle('on', b.dataset.dvspread === s.id));
    m.querySelector('#phSlots').innerHTML = s.positions.map((q, i) => `
      <section class="ph-slot" data-phslot="${i}">
        <h5 class="ph-h"><span class="mono">card ${i + 1}</span> <b class="serif">${esc(q.name)}</b>
          ${q.desc ? `<span class="quote">${esc(q.desc)}</span>` : ''}</h5>
        <div class="ph-pick">
          <div class="ph-typed">
            <input class="inp ph-in" data-phin="${i}" autocomplete="off" spellcheck="false"
              placeholder="type a name — “tower”, “3 cups”, “knight of swords”" value="${slots[i].card !== null ? esc(TAROT[slots[i].card].n) : ''}">
            <div class="ph-sugg" data-phsugg="${i}" hidden></div>
          </div>
          <button type="button" class="pl-mini ph-grid-b" data-phgrid="${i}" title="open the deck and point at it">▦</button>
          <label class="ph-rev${rev ? '' : ' off'}"><input type="checkbox" data-phrev="${i}" ${slots[i].rev ? 'checked' : ''}> reversed</label>
        </div>
        <div class="ph-chosen" data-phchosen="${i}"></div>
      </section>`).join('');
    slots.forEach((_, i) => paint(i));
    bindSlots();
  }
  /* the little card that shows what has been named, so a mistyped card is
     caught before the reading rather than after it */
  function paint(i){
    const box = m.querySelector(`[data-phchosen="${i}"]`); if(!box) return;
    const pick = slots[i];
    if(pick.card === null){ box.innerHTML = ''; return; }
    const c = tarotCard(pick.card);
    box.innerHTML = `<div class="ph-card${pick.rev ? ' rev' : ''}">
      <img class="ph-thumb" src="${tarotArtURL(pick.card)}" alt="">
      <div><b class="serif">${esc(c.name)}</b>${pick.rev ? ' <span class="tc-cap-rev mono">reversed</span>' : ''}
        <div class="quote">${esc(c.essence || (c.keywords || []).slice(0, 3).join(' · '))}</div></div></div>`;
  }
  function bindSlots(){
    m.querySelectorAll('[data-phin]').forEach(inp => {
      const i = +inp.dataset.phin, sugg = m.querySelector(`[data-phsugg="${i}"]`);
      const close = () => { sugg.hidden = true; sugg.innerHTML = ''; };
      const choose = at => { slots[i].card = at; inp.value = TAROT[at].n; close(); paint(i);
        if(typeof sound === 'function') sound('click'); };
      inp.addEventListener('input', () => {
        const hits = cardSearch(inp.value);
        if(!hits.length || (hits.length === 1 && TAROT[hits[0]].n.toLowerCase() === inp.value.trim().toLowerCase())){
          if(hits.length === 1) slots[i].card = hits[0];
          else if(!inp.value.trim()) slots[i].card = null;
          paint(i); return close();
        }
        sugg.innerHTML = hits.map(at => `<button type="button" class="ph-s" data-phs="${at}">
          <span class="ph-s-suit" style="color:${SUIT_COLOR[TAROT[at].s]}">${SUIT_GLYPH[TAROT[at].s]}</span>
          ${esc(TAROT[at].n)}</button>`).join('');
        sugg.hidden = false;
        sugg.querySelectorAll('[data-phs]').forEach(b => b.onclick = () => choose(+b.dataset.phs));
      });
      inp.addEventListener('keydown', e => {
        if(e.key === 'Enter'){ const first = sugg.querySelector('[data-phs]');
          if(first){ e.preventDefault(); choose(+first.dataset.phs); } }
        if(e.key === 'Escape') close();
      });
      inp.addEventListener('blur', () => setTimeout(close, 160));
    });
    m.querySelectorAll('[data-phrev]').forEach(cb => cb.onchange = () => {
      slots[+cb.dataset.phrev].rev = cb.checked; paint(+cb.dataset.phrev); });
    m.querySelectorAll('[data-phgrid]').forEach(b => b.onclick = () => {
      const i = +b.dataset.phgrid;
      openCardGrid(at => { slots[i].card = at;
        const inp = m.querySelector(`[data-phin="${i}"]`); if(inp) inp.value = TAROT[at].n;
        paint(i); });
    });
  }
  bindSpreadPicker(m, () => spreadId, id => { spreadId = spreadById(id).id; slots = []; drawSlots(); });
  m.querySelector('#phRev').onclick = () => {
    rev = !rev; const b = m.querySelector('#phRev');
    b.classList.toggle('on', rev); b.setAttribute('aria-checked', String(rev));
    if(!rev) slots.forEach((s, i) => { s.rev = false; paint(i); });
    m.querySelectorAll('.ph-rev').forEach(l => l.classList.toggle('off', !rev));
  };
  drawSlots();

  m.querySelector('#phGo').onclick = () => {
    const s = sp();
    const missing = slots.findIndex(x => x.card === null);
    if(missing >= 0){
      toast(`Which card was in “${s.positions[missing].name}”?`);
      m.querySelector(`[data-phin="${missing}"]`)?.focus();
      return;
    }
    const dupe = slots.map(x => x.card).findIndex((c, i, a) => a.indexOf(c) !== i);
    if(dupe >= 0 && !confirm(`${TAROT[slots[dupe].card].n} is named twice. Keep it anyway?`)) return;
    const picks = slots.map(x => ({card: x.card, rev: !!x.rev}));
    m.querySelector('#phWrap').hidden = true;
    const out = m.querySelector('#phOut');
    out.innerHTML = `<div class="ph-done"><span class="dv-src mono">📖 read on paper</span>
      <b class="serif">${esc(s.name)}</b>${m.querySelector('#phQ').value.trim()
        ? `<span class="quote">${esc(m.querySelector('#phQ').value.trim())}</span>` : ''}</div>
      ${tarotBoardHTML(s, i => `<div class="tc-hole">${tarotCardHTML(picks[i], i, true)}</div>`)}
      ${tarotReadingHTML(picks, s)}${divKeepHTML(projects)}`;
    /* the cards are already face up — the captions go straight on */
    picks.forEach((pk, i) => {
      const cap = out.querySelector(`[data-cap="${i}"]`);
      if(cap){ cap.innerHTML = tarotCaptionHTML(pk);
        const n = cap.querySelector('.tc-cap-name'); if(n) n.textContent = TAROT[pk.card].n; }
    });
    tarotBoardFit(out);
    out.scrollIntoView({behavior: (typeof reduced === 'function' && reduced()) ? 'auto' : 'smooth', block: 'start'});
    m.querySelector('#dvSave').onclick = () => {
      divinationSave({system:'tarot', question:m.querySelector('#phQ').value.trim(), spread:s.id,
        title:`${s.name} — ${picks.map(pk => TAROT[pk.card].n).join(', ')}`,
        cards:picks.map((pk, i) => ({card:pk.card, rev:pk.rev, pos:s.pos[i]})),
        reading:m.querySelector('#dvText').value.trim(), source:'physical',
        revisit:m.querySelector('#dvRevisit').checked, projectId:m.querySelector('#dvProj')?.value || null});
      sound('success'); toast('Kept in the Lived Record.'); m.remove(); rerender();
    };
  };
}

/* ---------- the deck, to point at ----------
   For anyone who would rather see the cards than spell them. Also the body
   of the card directory, which is the same grid with a different thing to
   do when one is tapped. */
const CARD_TABS = [
  {id:'major',     name:'Major Arcana', has: c => c.s === 'major'},
  {id:'wands',     name:'Wands',        has: c => c.s === 'wands' && c.r <= 10},
  {id:'cups',      name:'Cups',         has: c => c.s === 'cups' && c.r <= 10},
  {id:'swords',    name:'Swords',       has: c => c.s === 'swords' && c.r <= 10},
  {id:'pentacles', name:'Pentacles',    has: c => c.s === 'pentacles' && c.r <= 10},
  /* the sixteen faces together, because they work differently from the
     numbered cards: they are usually a person, or a way of being one */
  {id:'court',     name:'Court cards',  has: c => c.s !== 'major' && c.r > 10},
];
const cardsInTab = id => { const t = CARD_TABS.find(x => x.id === id) || CARD_TABS[0];
  return TAROT.map((c, i) => ({c, i})).filter(x => t.has(x.c)).map(x => x.i); };

function cardTileHTML(i, extra){
  const c = TAROT[i];
  return `<button type="button" class="cd-tile${extra && extra.dim ? ' dim' : ''}" data-cardpick="${i}"
    title="${esc(c.n)}"><img class="cd-thumb" src="${tarotArtURL(i)}" alt="" loading="lazy">
    <span class="cd-t-name">${esc(c.n)}</span>
    ${extra && extra.count ? `<span class="cd-t-n mono">×${extra.count}</span>` : ''}</button>`;
}

function openCardGrid(then){
  let tab = 'major';
  const m = openModal(`<h2>Which card?</h2>
    <div class="stack">
      <div class="row cd-tabs" style="gap:5px;flex-wrap:wrap">${CARD_TABS.map(t =>
        `<button class="chip${t.id === tab ? ' on' : ''}" data-cdtab="${t.id}">${esc(t.name)}</button>`).join('')}</div>
      <input class="inp" id="cdFind" placeholder="or type a name, a keyword, an element" autocomplete="off">
      <div class="cd-grid" id="cdGrid"></div>
    </div>`, 'wide');
  const draw = list => { m.querySelector('#cdGrid').innerHTML = list.map(i => cardTileHTML(i)).join('');
    m.querySelectorAll('[data-cardpick]').forEach(b => b.onclick = () => {
      then(+b.dataset.cardpick); if(typeof sound === 'function') sound('click'); m.remove(); }); };
  const show = () => draw(cardsInTab(tab));
  m.querySelectorAll('[data-cdtab]').forEach(b => b.onclick = () => { tab = b.dataset.cdtab;
    m.querySelectorAll('[data-cdtab]').forEach(x => x.classList.toggle('on', x === b));
    m.querySelector('#cdFind').value = ''; show(); });
  m.querySelector('#cdFind').addEventListener('input', e => {
    const q = e.target.value.trim();
    draw(q ? cardSearch(q, 24) : cardsInTab(tab));
  });
  show();
}
