/* ============================================================
   THE STUDY DECK — the room: the deck list, a deck's overview, the
   review itself, and the page at the end.

   The card is the thing. Everything else is either a slim line at the top
   (what is left, in Anki's colours: new blue, learning red, due green) or
   behind a key. The four buttons carry the interval each would give, and
   the number to press, faintly.

   Keys (all remappable, see the shortcuts sheet with ?):
     Space / Enter  show the answer, then Good
     1 2 3 4        Again, Hard, Good, Easy
     Ctrl/⌘+Z       undo
     Ctrl/⌘+1…7     flag          *   mark the note
     -              bury          @ or !  suspend
     E  edit        I  card info   R  replay audio   F  focus
   On touch: swipe left for Again, right for Good, up for Easy, down for
   Hard — the card follows the finger and the answer fades in as you go.
   ============================================================ */

function sdUi(){ return S._sd = S._sd || {view: 'decks', deckId: null, cardId: null, shown: false, typed: '', started: 0, session: null, token: 0}; }

routes.study = async function(root, params){
  const ui = sdUi();
  const want = params && params[0];
  if(!SD.loaded){
    root.innerHTML = `<div class="page sx-page"><div class="sx-skel"><div></div><div></div><div></div></div></div>`;
    await sdLoad();
    if(!root.isConnected) return;
  }
  sdDailyUnbury();
  sdSummarise();
  if(want === 'browse') return sdBrowserRoute(root, params.slice(1));
  if(want === 'stats') return sdStatsRoute(root, params.slice(1));
  if(want === 'add') return sdEditorRoute(root, {mode: 'add', deckId: params[1] ? +params[1] : null});
  if(want === 'edit' && params[1]) return sdEditorRoute(root, {mode: 'edit', noteId: +params[1]});
  if(want === 'types') return sdNoteTypesRoute(root, params.slice(1));
  if(want === 'import') return sdImportRoute(root);
  if(want === 'tools') return sdToolsRoute(root);
  if(want === 'deck' && params[1]){ ui.deckId = +params[1]; return sdOverviewRoute(root); }
  if(want === 'review' && params[1]){ ui.deckId = +params[1]; return sdReviewRoute(root); }
  return sdDecksRoute(root);
};
function sdNav(active){
  const l = [['', 'Decks'], ['add', 'Add'], ['browse', 'Browse'], ['stats', 'Stats'], ['import', 'Import'], ['tools', 'Tools']];
  return `<nav class="sx-nav" aria-label="Study Deck">${l.map(([k, n]) => `<a href="#/study${k ? '/' + k : ''}" class="${active === k ? 'on' : ''}">${n}</a>`).join('')}</nav>`;
}

/* ---------- the deck list ---------- */
function sdDecksRoute(root){
  registerPageEntry && registerPageEntry({pageName: 'Study Deck', addLabel: 'Add a card', defaultEntryType: 'card', prefilledFields: {},
    options: [{label: 'Add a card', run: () => navigate('#/study/add')}, {label: 'Import a deck', run: () => navigate('#/study/import')}]});
  const s = sdSettings();
  const decks = sdDecks();
  const top = decks.filter(d => !d.name.includes('::'));
  const row = (d, depth) => {
    const kids = sdDeckChildren(d.id), c = sdCounts(d.id), open = !s.collapsed[d.id];
    const done = sdDoneToday(), below = sdDeckAndBelow(d.id);
    let dn = 0; below.forEach(i => { const o = done.get(i); if(o) dn += o.newN + o.rev; });
    const total = dn + c.newN + c.learn + c.rev, frac = total ? dn / total : 1;
    return `<div class="sx-deck${d.isFiltered ? ' filtered' : ''}" data-sxdeck="${d.id}" draggable="true" style="--dc:${d.color};--pad:${depth * 18}px">
      <button class="sx-twisty" data-sxtw="${d.id}" ${kids.length ? '' : 'disabled'} aria-label="${open ? 'Collapse' : 'Expand'}">${kids.length ? (open ? '▾' : '▸') : ''}</button>
      <span class="sx-ring" style="--f:${frac}" title="${Math.round(frac * 100)}% of today done"></span>
      <a class="sx-dname" href="#/study/deck/${d.id}">${esc(sdDeckLeaf(d.name))}</a>
      <span class="sx-n new" title="new">${c.newN || ''}</span><span class="sx-n learn" title="learning">${c.learn || ''}</span><span class="sx-n due" title="due">${c.rev || ''}</span>
      <button class="tbtn sx-gear" data-sxgear="${d.id}" aria-label="Options for ${esc(d.name)}">⋯</button>
    </div>${open ? kids.map(k => row(k, depth + 1)).join('') : ''}`;
  };
  const all = sdCounts(null);
  root.innerHTML = `<div class="page sx-page">
    ${sdNav('')}
    <header class="sx-head"><h1 class="serif">Study Deck</h1>
      <span class="sx-sub">${SD.cards.size.toLocaleString()} cards in ${decks.filter(d => !d.isFiltered).length} decks · ${all.rev + all.learn} due today</span></header>
    <section class="sx-decks" id="sxDecks">
      <div class="sx-deckhead"><span></span><span></span><span>Deck</span><span class="new">New</span><span class="learn">Learn</span><span class="due">Due</span><span></span></div>
      ${top.map(d => row(d, 0)).join('') || '<p class="faint">No decks yet.</p>'}
    </section>
    <div class="sx-actions"><button class="btn" id="sxNewDeck">New deck</button><button class="btn ghost" id="sxFiltered">Filtered deck</button>
      <a class="btn ghost" href="#/study/import">Import a deck</a></div>
    <section class="sx-heat">${sdHeatmapHTML(null, 26)}</section>
  </div>`;
  root.querySelectorAll('[data-sxtw]').forEach(b => b.onclick = () => { s.collapsed[b.dataset.sxtw] = !s.collapsed[b.dataset.sxtw]; sdTouch('misc', s); rerender(); });
  root.querySelectorAll('[data-sxgear]').forEach(b => b.onclick = e => { e.stopPropagation(); sdDeckMenu(+b.dataset.sxgear, b); });
  root.querySelector('#sxNewDeck').onclick = async () => { const n = await sdAsk('A name for the deck', '', 'Use :: to put it inside another, e.g. Japanese::Kanji'); if(n){ sdEnsureDeck(n); rerender(); } };
  root.querySelector('#sxFiltered').onclick = () => sdFilteredDialog();
  sdBindHeat(root);
  /* drag a deck onto another to move it inside; onto the list's edge to make it top-level */
  let drag = null;
  root.querySelectorAll('[data-sxdeck]').forEach(el => {
    el.addEventListener('dragstart', e => { drag = +el.dataset.sxdeck; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); root.querySelectorAll('.drop').forEach(x => x.classList.remove('drop')); });
    el.addEventListener('dragover', e => { if(drag == null || +el.dataset.sxdeck === drag) return; e.preventDefault(); el.classList.add('drop'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop'));
    el.addEventListener('drop', e => { e.preventDefault(); const to = SD.decks.get(+el.dataset.sxdeck), from = SD.decks.get(drag);
      if(!to || !from || to.name.startsWith(from.name + '::')) return;
      sdRenameDeck(from.id, to.name + '::' + sdDeckLeaf(from.name)); rerender(); });
  });
  const list = root.querySelector('#sxDecks');
  list.addEventListener('dragover', e => { if(drag != null && e.target === list) e.preventDefault(); });
  list.addEventListener('drop', e => { if(e.target !== list) return; const from = SD.decks.get(drag); if(from) { sdRenameDeck(from.id, sdDeckLeaf(from.name)); rerender(); } });
}
function sdDeckMenu(id, anchor){
  const d = SD.decks.get(id); if(!d) return;
  const items = [['Study now', () => navigate('#/study/review/' + id)], ['Options', () => sdOptionsDialog(id)], ['Rename', async () => { const n = await sdAsk('Rename', d.name); if(n && !sdRenameDeck(id, n)) toast('A deck with that name exists.'); rerender(); }],
    ['Custom study', () => sdCustomStudyDialog(id)], ['Export', () => sdExportDialog(id)],
    ...(d.isFiltered ? [['Rebuild', () => { sdRebuildFiltered(id); rerender(); }], ['Empty', () => { sdEmptyFiltered(id); rerender(); }]] : []),
    ['Delete', () => { const n = [...SD.cards.values()].filter(c => sdDeckAndBelow(id).includes(c.deckId)).length;
      const undo = sdDeleteDeck(id); rerender(); sdUndoToast(`Deleted ${d.name}${n ? ` and ${n} cards` : ''}`, () => { undo(); rerender(); }); }]];
  sdMenu(anchor, items);
}
function sdMenu(anchor, items){
  document.querySelectorAll('.sx-menu').forEach(m => m.remove());
  const m = document.createElement('div'); m.className = 'sx-menu'; m.setAttribute('role', 'menu');
  m.innerHTML = items.map(([n], i) => `<button role="menuitem" data-i="${i}">${esc(n)}</button>`).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect();
  m.style.top = Math.min(innerHeight - m.offsetHeight - 8, r.bottom + 4) + 'px'; m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
  m.querySelectorAll('button').forEach(b => b.onclick = () => { m.remove(); items[+b.dataset.i][1](); });
  setTimeout(() => document.addEventListener('click', function off(e){ if(!m.contains(e.target)){ m.remove(); document.removeEventListener('click', off); } }), 0);
  m.querySelector('button').focus();
}
/* a small question, asked calmly */
function sdAsk(title, value, hint){
  return new Promise(res => {
    const m = openModal(`<h2 class="serif">${esc(title)}</h2>${hint ? `<p class="faint">${esc(hint)}</p>` : ''}
      <input class="inp" id="sxAsk" value="${esc(value || '')}"><div class="row" style="justify-content:flex-end;gap:8px;margin-top:14px">
      <button class="btn ghost" id="sxAskNo">Cancel</button><button class="btn primary" id="sxAskOk">OK</button></div>`, 'narrow');
    const inp = document.getElementById('sxAsk'); inp.focus(); inp.select();
    const done = v => { closeModals(); res(v); };
    document.getElementById('sxAskOk').onclick = () => done(inp.value.trim());
    document.getElementById('sxAskNo').onclick = () => done(null);
    inp.onkeydown = e => { if(e.key === 'Enter') done(inp.value.trim()); if(e.key === 'Escape') done(null); };
    void m;
  });
}
function sdUndoToast(text, undo){
  document.querySelectorAll('.sx-undo').forEach(x => x.remove());
  const t = document.createElement('div'); t.className = 'sx-undo'; t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(text)}</span><button class="tbtn">Undo</button><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>`;
  document.body.appendChild(t);
  const kill = setTimeout(() => t.remove(), 5000);
  t.querySelector('button').onclick = () => { clearTimeout(kill); t.remove(); undo(); };
}

/* ---------- a deck's overview ---------- */
function sdOverviewRoute(root){
  const ui = sdUi(), d = SD.decks.get(ui.deckId);
  if(!d){ navigate('#/study'); return; }
  const c = sdCounts(d.id), ids = new Set(sdDeckAndBelow(d.id));
  let young = 0, mature = 0, susp = 0, bur = 0, learnAll = 0, newAll = 0;
  SD.cards.forEach(x => { if(!ids.has(x.deckId)) return; if(x.queue === -1) susp++; else if(x.queue === -2 || x.queue === -3) bur++;
    else if(x.type === 2) (x.ivl >= 21 ? mature++ : young++); else if(x.type === 1 || x.type === 3) learnAll++; else newAll++; });
  const pace = sdPaceSecs();
  const est = Math.round(((c.rev + c.learn) * pace.rev + c.newN * pace.newC) / 60);
  root.innerHTML = `<div class="page sx-page" style="--dc:${d.color}">
    ${sdNav('')}
    <div class="sx-crumbs">${sdCrumbs(d)}</div>
    <h1 class="serif sx-otitle">${esc(sdDeckLeaf(d.name))}</h1>
    ${d.description ? `<div class="sx-desc">${sdMarkdown(d.description)}</div>` : ''}
    <div class="sx-ocounts"><div class="new"><b>${c.newN}</b><span>new</span></div><div class="learn"><b>${c.learn}</b><span>learning</span></div><div class="due"><b>${c.rev}</b><span>to review</span></div></div>
    <div class="sx-orow"><button class="btn primary sx-go" id="sxGo" ${c.newN + c.learn + c.rev ? '' : 'disabled'}>Study now</button>
      ${bur ? `<button class="btn ghost" id="sxUnbury">Unbury ${bur}</button>` : ''}
      <button class="btn ghost" id="sxCustom">Custom study</button><button class="btn ghost" id="sxOpts">Options</button>
      <a class="btn ghost" href="#/study/add/${d.id}">Add</a></div>
    <div class="sx-ostats"><span>${young} young</span><span>${mature} mature</span><span>${learnAll} learning</span><span>${newAll} new in all</span><span>${susp} suspended</span><span>${bur} buried</span>
      <span>about ${est} min today</span></div>
    ${sdFsrsDeckStatsHTML(d.id)}
    <section class="sx-heat">${sdHeatmapHTML(d.id, 20)}</section>
  </div>`;
  root.querySelector('#sxGo').onclick = () => navigate('#/study/review/' + d.id);
  const ub = root.querySelector('#sxUnbury'); if(ub) ub.onclick = () => { sdUnburyDeck(d.id); rerender(); };
  root.querySelector('#sxCustom').onclick = () => sdCustomStudyDialog(d.id);
  root.querySelector('#sxOpts').onclick = () => sdOptionsDialog(d.id);
  sdBindHeat(root);
  if(!(c.newN + c.learn + c.rev)) root.querySelector('#sxGo').title = 'Nothing is due in this deck today.';
}
function sdCrumbs(d){
  const parts = d.name.split('::'); let acc = '';
  return `<a href="#/study">Decks</a>` + parts.map((p, i) => { acc = acc ? acc + '::' + p : p; const x = sdDeckByName(acc);
    return ` <span>›</span> ${i < parts.length - 1 && x ? `<a href="#/study/deck/${x.id}">${esc(p)}</a>` : esc(p)}`; }).join('');
}
/* the smallest useful markdown: paragraphs, bold, italic, links, lists */
function sdMarkdown(t){
  const e = esc(t);
  return e.split(/\n{2,}/).map(p => /^\s*[-*] /m.test(p) ? `<ul>${p.split(/\n/).filter(Boolean).map(l => `<li>${l.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>` : `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

/* ---------- pacing: from your own recent answers ---------- */
function sdPaceSecs(){
  const recent = SD.revlog.slice(-300).filter(r => r.ease > 0 && r.time > 0);
  const avg = l => l.length ? l.reduce((s, r) => s + r.time, 0) / l.length / 1000 : null;
  const rev = avg(recent.filter(r => r.type === 1)) || 8, lrn = avg(recent.filter(r => r.type !== 1)) || 10;
  return {rev, newC: lrn * 2.5, learn: lrn};
}

/* ---------- the review ---------- */
function sdReviewRoute(root){
  const ui = sdUi(), d = SD.decks.get(ui.deckId);
  if(!d){ navigate('#/study'); return; }
  const sess = ui.session && ui.session.deckId === d.id ? ui.session : (ui.session = {deckId: d.id, started: Date.now(), answered: 0, again: 0, times: [], skip: new Set(), lastBreak: Date.now()});
  root.innerHTML = `<div class="page sx-page sx-review${sdSettings().focus ? ' sx-focus' : ''}" style="--dc:${d.color}" id="sxRev">
    <div class="sx-rtop"><a class="sx-back" href="#/study/deck/${d.id}" aria-label="Back to the deck">‹</a><span class="sx-rdeck">${esc(d.name)}</span>
      <span class="sx-rcounts" id="sxCounts"></span><span class="sx-pace" id="sxPace"></span>
      <button class="tbtn" id="sxMore" aria-label="More actions">⋯</button></div>
    <div class="sx-progress"><i id="sxProg"></i></div>
    <div class="sx-stage" id="sxStage"><div class="sx-cardwrap" id="sxCardWrap"><div class="sx-timer" id="sxTimer" hidden><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17"/></svg></div>
      <div class="sx-swipelabel" id="sxSwipe"></div><iframe class="sx-card" id="sxCard" sandbox="allow-scripts" title="The card" referrerpolicy="no-referrer"></iframe></div></div>
    <div class="sx-bar" id="sxBar"></div>
  </div>`;
  sdShowNext(root);
  sdBindReview(root);
}
async function sdShowNext(root){
  const ui = sdUi(), sess = ui.session;
  const c = sdNextCard(ui.deckId, sess.skip);
  sdPaintCounts(root);
  if(!c){ sdCongrats(root); return; }
  ui.cardId = c.id; ui.shown = false; ui.typed = ''; ui.started = Date.now();
  await sdPaintCard(root, c, false);
  sdPaintBar(root, c);
  sdStartTimer(root, c);
}
function sdPaintCounts(root){
  const ui = sdUi(), c = sdCounts(ui.deckId), cur = SD.cards.get(ui.cardId);
  const which = cur ? (cur.queue === 0 ? 'new' : cur.queue === 2 ? 'due' : 'learn') : '';
  const el = root.querySelector('#sxCounts'); if(!el) return;
  el.innerHTML = `<span class="new${which === 'new' ? ' cur' : ''}">${c.newN}</span> <span class="learn${which === 'learn' ? ' cur' : ''}">${c.learn}</span> <span class="due${which === 'due' ? ' cur' : ''}">${c.rev}</span>`;
  const sess = ui.session, left = c.newN + c.learn + c.rev, total = sess.answered + left;
  const prog = root.querySelector('#sxProg'); if(prog) prog.style.width = (total ? sess.answered / total * 100 : 100) + '%';
  /* how long is left, and when it will be done, from this session's pace */
  const pace = sess.times.length >= 3 ? sess.times.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, sess.times.length) / 1000 : sdPaceSecs().rev;
  const secs = (c.rev + c.learn) * pace + c.newN * pace * 2.5;
  const fin = new Date(Date.now() + secs * 1000);
  const p = root.querySelector('#sxPace'); if(p) p.textContent = left ? `~${Math.max(1, Math.round(secs / 60))} min · done ${fin.getHours()}:${String(fin.getMinutes()).padStart(2, '0')}` : '';
}
async function sdPaintCard(root, c, shown){
  const ui = sdUi();
  const r = sdRenderCard(c, {typed: ui.typed});
  const d = SD.decks.get(c.deckId);
  const dark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark') || matchMedia('(prefers-color-scheme: dark)').matches && sdSettings().theme === 'auto';
  let html = shown ? r.a : r.q;
  html = await sdResolveMedia(html);
  ui.token = (ui.token || 0) + 1;
  const doc = sdCardDoc(shown ? 'a' : 'q', html, r.css, {js: r.js, dark, token: ui.token, reveal: shown && sdSettings().reveal !== 'none',
    scale: (d && d.zoom || 1) * (sdSettings().fontScale || 1), ink: dark ? '#e9e2d6' : '#2b2622'});
  const f = root.querySelector('#sxCard'); if(!f) return;
  f.srcdoc = doc;
  const wrap = root.querySelector('#sxCardWrap');
  wrap.classList.toggle('shown', shown);
  if(!shown){ wrap.classList.remove('leave-good', 'leave-again', 'leave-easy', 'leave-hard'); wrap.classList.add('enter'); setTimeout(() => wrap.classList.remove('enter'), 320); }
  /* sound: the question's on showing it, the answer's on turning it over */
  const pre = sdDeckPreset(c.odid || c.deckId);
  if(pre.autoplay) sdPlaySounds(shown ? r.sounds.a : r.sounds.q);
}
function sdPaintBar(root, c){
  const ui = sdUi(), bar = root.querySelector('#sxBar'); if(!bar) return;
  if(!ui.shown){ bar.innerHTML = `<button class="btn sx-show" id="sxShow">Show answer <kbd>Space</kbd></button>`; bar.querySelector('#sxShow').onclick = () => sdReveal(root); return; }
  const prev = sdPreviewAll(c);
  const names = [null, 'Again', 'Hard', 'Good', 'Easy'];
  bar.innerHTML = [1, 2, 3, 4].map(r => { const nx = prev[r]; const when = nx.queue === 1 ? new Date(nx.due * 1000) : sdDayToDate(nx.due);
    return `<button class="sx-ans r${r}" data-sxans="${r}" title="${when.toLocaleString(undefined, {dateStyle: 'medium', timeStyle: nx.queue === 1 ? 'short' : undefined})}">
      <span class="ivl">${sdIvlText(c, nx)}</span><span class="nm">${names[r]}</span><kbd>${r}</kbd></button>`; }).join('');
  bar.querySelectorAll('[data-sxans]').forEach(b => b.onclick = () => sdRate(root, +b.dataset.sxans));
}
function sdReveal(root){
  const ui = sdUi(), c = SD.cards.get(ui.cardId); if(!c || ui.shown) return;
  ui.shown = true; ui.revealAt = Date.now();
  sdPaintCard(root, c, true); sdPaintBar(root, c);
}
async function sdRate(root, rating){
  const ui = sdUi(), c = SD.cards.get(ui.cardId); if(!c || !ui.shown || ui.rating) return;
  ui.rating = true;
  const btn = root.querySelector(`[data-sxans="${rating}"]`); if(btn) btn.classList.add('pressed');
  const ms = Date.now() - ui.started;
  const res = await sdAnswer(c.id, rating, ms);
  const sess = ui.session; sess.answered++; sess.times.push(Math.min(60000, ms)); if(rating === 1) sess.again++;
  if(res && res.leech) sdLeechBanner(root, c);
  const wrap = root.querySelector('#sxCardWrap');
  if(wrap && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    wrap.classList.add(rating === 1 ? 'leave-again' : rating === 2 ? 'leave-hard' : rating === 4 ? 'leave-easy' : 'leave-good');
    await new Promise(r => setTimeout(r, 220));
  }
  if(sdSettings().sounds) sdTick(rating);
  const labels = {1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy'};
  sdUndoToast(`Rated ${labels[rating]}`, async () => { await sdUndo(); sess.answered = Math.max(0, sess.answered - 1); sdShowNext(root); });
  ui.rating = false;
  /* the timebox: a gentle word every N minutes */
  const tb = sdSettings().timeboxMin;
  if(tb && Date.now() - sess.lastBreak > tb * 60000){ sess.lastBreak = Date.now(); toast(`${tb} minutes: ${sess.answered} cards, ${sess.answered ? Math.round((1 - sess.again / sess.answered) * 100) : 0}% right. Carry on, or stop here.`, 6000); }
  if(sdSettings().autoDisperse) sdDisperseSiblings([c.noteId], true);
  sdShowNext(root);
}
function sdLeechBanner(root, c){
  const pre = sdDeckPreset(c.odid || c.deckId);
  const b = document.createElement('div'); b.className = 'sx-leech';
  b.innerHTML = `<span>This card keeps slipping away — it has lapsed ${c.lapses} times.${pre.leechAction === 'suspend' ? ' It has been suspended.' : ''}</span>
    <button class="tbtn" data-l="s">${pre.leechAction === 'suspend' ? 'Unsuspend' : 'Suspend'}</button><button class="tbtn" data-l="e">Edit</button><button class="tbtn" data-l="k">Keep</button>`;
  root.querySelector('#sxRev').prepend(b);
  b.querySelectorAll('[data-l]').forEach(x => x.onclick = () => { const k = x.dataset.l;
    if(k === 's') sdSuspend([c.id]); if(k === 'e') navigate('#/study/edit/' + c.noteId); b.remove(); });
}
function sdCongrats(root){
  const ui = sdUi(), d = SD.decks.get(ui.deckId), sess = ui.session;
  const f = sdForecast(ui.deckId, 7), next = sdNextLearnDue(ui.deckId);
  const mins = Math.round((Date.now() - sess.started) / 60000);
  const stage = root.querySelector('#sxStage'), bar = root.querySelector('#sxBar');
  if(bar) bar.innerHTML = '';
  if(stage) stage.innerHTML = `<div class="sx-done"><div class="sx-bloom" aria-hidden="true"></div>
    <h2 class="serif">${sess.answered ? 'That is everything for now.' : 'Nothing is due here today.'}</h2>
    ${sess.answered ? `<p>${sess.answered} ${sess.answered === 1 ? 'card' : 'cards'} in ${Math.max(1, mins)} ${mins === 1 ? 'minute' : 'minutes'} · ${Math.round((1 - sess.again / sess.answered) * 100)}% remembered the first time.</p>` : ''}
    ${next ? `<p class="faint">Learning cards come back at ${new Date(next * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}.</p>` : ''}
    <p class="faint">Tomorrow: ${f[1] || 0} to review${sdCounts(ui.deckId).newN ? ', and new cards' : ''}. The week: ${f.slice(1).reduce((a, b) => a + b, 0)}.</p>
    <div class="row" style="gap:8px;justify-content:center"><a class="btn" href="#/study">The decks</a><button class="btn ghost" id="sxCust">Custom study</button></div></div>`;
  const cb = root.querySelector('#sxCust'); if(cb) cb.onclick = () => sdCustomStudyDialog(ui.deckId);
  ui.session = null;
  sdSummarise(); if(typeof saveNow === 'function') saveNow();
}
/* the answer timer: a thin ring, warn → reveal → act, off unless the preset asks */
function sdStartTimer(root, c){
  const pre = sdDeckPreset(c.odid || c.deckId), t = pre.timer || {}, ui = sdUi();
  clearInterval(ui.timerIv);
  const el = root.querySelector('#sxTimer'); if(!el) return;
  if(!t.show && !t.autoRevealSec && !t.autoActionSec){ el.hidden = true; return; }
  el.hidden = false; const circ = el.querySelector('circle'); const L = 2 * Math.PI * 17;
  circ.style.strokeDasharray = L;
  const max = t.autoActionSec || t.autoRevealSec || t.maxAnswerSec || 60, id = c.id;
  ui.timerIv = setInterval(() => {
    if(ui.cardId !== id || !root.isConnected){ clearInterval(ui.timerIv); return; }
    const sec = (Date.now() - ui.started) / 1000;
    circ.style.strokeDashoffset = L * (1 - Math.min(1, sec / max));
    el.classList.toggle('warn', !!t.warnSec && sec >= t.warnSec);
    if(t.autoRevealSec && !ui.shown && sec >= t.autoRevealSec) sdReveal(root);
    if(t.autoActionSec && sec >= t.autoActionSec){ clearInterval(ui.timerIv);
      if(t.autoAction === 'skip'){ ui.session.skip.add(id); sdShowNext(root); } else { if(!ui.shown) sdReveal(root); setTimeout(() => sdRate(root, t.autoAction === 'good' ? 3 : 1), 50); } }
  }, 200);
}

/* ---------- keys, gestures and the card's messages ---------- */
function sdBindReview(root){
  const ui = sdUi();
  const act = key => sdReviewKey(root, key);
  const onKey = e => {
    if(!root.isConnected){ removeEventListener('keydown', onKey); return; }
    if(e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if(sdHandleKey(root, {key: e.key, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey, alt: e.altKey})) e.preventDefault();
  };
  addEventListener('keydown', onKey);
  const onMsg = e => {
    const m = e.data || {}; if(!m.sdCard || m.sdCard !== ui.token){ if(!root.isConnected) removeEventListener('message', onMsg); return; }
    if(m.type === 'key') sdHandleKey(root, m);
    else if(m.type === 'height'){ const f = root.querySelector('#sxCard'); if(f) f.style.height = Math.max(160, Math.min(4000, m.h + 4)) + 'px'; }
    else if(m.type === 'sound') sdPlaySounds([m.file]);
    else if(m.type === 'typed'){ ui.typed = m.value; if(m.submit) act('show'); }
    else if(m.type === 'tag') navigate('#/study/browse/' + encodeURIComponent('tag:' + m.tag));
    else if(m.type === 'field') sdInlineEdit(ui.cardId, m.name, m.html);
    else if(m.type === 'select' && sdSettings().lookup) sdLookup(m.text, root);
  };
  addEventListener('message', onMsg);
  /* swipes */
  const wrap = root.querySelector('#sxCardWrap'), label = root.querySelector('#sxSwipe');
  let sx = 0, sy = 0, dragging = false;
  const sw = sdSettings().swipe || {left: 1, right: 3, up: 4, down: 2};
  const dirOf = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  wrap.addEventListener('touchstart', e => { if(e.touches.length !== 1) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; dragging = true; }, {passive: true});
  wrap.addEventListener('touchmove', e => { if(!dragging) return; const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
    wrap.style.transform = `translate(${dx * 0.6}px, ${dy * 0.4}px) rotate(${dx / 40}deg)`;
    const dist = Math.hypot(dx, dy), r = sw[dirOf(dx, dy)];
    label.textContent = ui.shown && dist > 40 ? ['', 'Again', 'Hard', 'Good', 'Easy'][r] : ''; label.style.opacity = Math.min(1, dist / 120); }, {passive: true});
  wrap.addEventListener('touchend', e => { if(!dragging) return; dragging = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy, dist = Math.hypot(dx, dy);
    wrap.style.transform = ''; label.textContent = '';
    if(dist < 15){ if(!ui.shown) sdReveal(root); return; }
    if(dist > 90){ if(!ui.shown){ sdReveal(root); return; } if(navigator.vibrate) navigator.vibrate(12); sdRate(root, sw[dirOf(dx, dy)]); } });
  root.querySelector('#sxMore').onclick = e => sdMenu(e.currentTarget, [
    ['Edit (E)', () => act('edit')], ['Card info (I)', () => act('info')], ['Flag…', () => act('flag1')], ['Mark note (*)', () => act('mark')],
    ['Bury (-)', () => act('bury')], ['Suspend (@)', () => act('suspend')], ['Replay audio (R)', () => act('replay')],
    ['Scratchpad (W)', () => act('scratch')], ['Focus (F)', () => act('focus')], ['Undo (Ctrl+Z)', () => act('undo')]]);
  sdGamepad(root);
}
function sdHandleKey(root, k){
  const map = sdShortcuts(), combo = sdComboOf(k);
  const action = map[combo];
  if(action){ sdReviewKey(root, action); return true; }
  return false;
}
async function sdReviewKey(root, action){
  const ui = sdUi(), c = SD.cards.get(ui.cardId);
  if(action === 'show'){ if(!ui.shown) sdReveal(root); else sdRate(root, 3); return; }
  if(/^rate[1-4]$/.test(action)){ if(ui.shown) sdRate(root, +action.slice(4)); return; }
  if(action === 'undo'){ const u = await sdUndo(); if(u){ if(ui.session) ui.session.answered = Math.max(0, ui.session.answered - 1); toast('Undone.'); sdShowNext(root); } return; }
  if(!c) return;
  if(/^flag[0-7]$/.test(action)){ sdFlag([c.id], +action.slice(4)); toast(c.flags & 7 ? `Flagged ${sdMisc('flags').names[(c.flags & 7) - 1]}` : 'Flag removed.'); return; }
  if(action === 'mark'){ const n = SD.notes.get(c.noteId); const on = !n.tags.includes('marked'); n.tags = on ? n.tags.concat('marked') : n.tags.filter(t => t !== 'marked'); sdSaveNote(n); toast(on ? 'Marked.' : 'Unmarked.'); return; }
  if(action === 'bury'){ sdBury([c.id]); sdUndoToast('Buried till tomorrow', async () => { await sdUndo(); sdShowNext(root); }); sdShowNext(root); return; }
  if(action === 'suspend'){ sdSuspend([c.id]); sdUndoToast('Suspended', async () => { await sdUndo(); sdShowNext(root); }); sdShowNext(root); return; }
  if(action === 'edit'){ S._sdReturn = location.hash; navigate('#/study/edit/' + c.noteId); return; }
  if(action === 'info'){ sdCardInfo(c.id); return; }
  if(action === 'replay'){ const r = sdRenderCard(c); sdPlaySounds(ui.shown ? r.sounds.q.concat(r.sounds.a) : r.sounds.q); return; }
  if(action === 'focus'){ const s = sdSettings(); s.focus = !s.focus; sdTouch('misc', s); root.querySelector('#sxRev').classList.toggle('sx-focus', s.focus); return; }
  if(action === 'scratch'){ sdScratchpad(root); return; }
  if(action === 'help'){ sdShortcutSheet(); return; }
}
/* editing a field in place during review, through the sandbox's postMessage */
function sdInlineEdit(cardId, name, html){
  const c = SD.cards.get(cardId); if(!c) return;
  const n = SD.notes.get(c.noteId), nt = SD.noteTypes.get(n.noteTypeId);
  const i = nt.fields.findIndex(f => f.name === name); if(i < 0) return;
  const clean = sdSanitize(html, false);
  if(clean === n.fields[i]) return;
  n.fields[i] = clean; sdSaveNote(n); toast('Saved.');
}

/* ---------- sound ---------- */
let _sdAudio = null;
async function sdPlaySounds(files){
  if(!files || !files.length) return;
  if(_sdAudio){ _sdAudio.pause(); _sdAudio = null; }
  for(const f of files){
    const u = await sdMediaUrl(f); if(!u) continue;
    await new Promise(res => { const a = _sdAudio = new Audio(u); a.onended = res; a.onerror = res; a.play().catch(res); });
  }
}
function sdTick(rating){
  try { const ctx = sdTick.ctx = sdTick.ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = [0, 330, 392, 523, 659][rating]; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.2); } catch(e){}
}

/* ---------- the review heatmap: a calm calendar, not a scoreboard ---------- */
function sdHeatmapHTML(deckId, weeks){
  const ids = deckId ? new Set(sdDeckAndBelow(deckId)) : null;
  const per = new Map();
  SD.revlog.forEach(r => { if(r.ease === 0) return; if(ids){ const c = SD.cards.get(r.cardId); if(!c || !ids.has(c.odid || c.deckId)) return; }
    const d = sdDayOfMs(r.id); per.set(d, (per.get(d) || 0) + 1); });
  const t = sdToday(), days = weeks * 7;
  const start = t - days + 1 - ((sdDayToDate(t).getDay() + 6) % 7 === 6 ? 0 : 0);
  const vals = []; for(let d = start; d <= t; d++) vals.push(per.get(d) || 0);
  const max = Math.max(1, ...vals);
  /* streaks, stated plainly */
  let cur = 0; for(let d = t; per.get(d) || (d === t && !per.get(d) && per.get(d - 1)); d--){ if(per.get(d)) cur++; else if(d !== t) break; }
  let best = 0, run = 0; const allDays = [...per.keys()].sort((a, b) => a - b);
  allDays.forEach((d, i) => { run = i && allDays[i - 1] === d - 1 ? run + 1 : 1; best = Math.max(best, run); });
  const studied = vals.filter(v => v).length, avg = studied ? Math.round(vals.reduce((a, b) => a + b, 0) / days) : 0;
  const cell = 11, gap = 2, cols = Math.ceil(vals.length / 7);
  const rects = vals.map((v, i) => { const col = Math.floor(i / 7), row = i % 7, lvl = v ? Math.min(4, Math.ceil(v / max * 4)) : 0;
    return `<rect x="${col * (cell + gap)}" y="${row * (cell + gap)}" width="${cell}" height="${cell}" rx="2" class="l${lvl}" data-sxday="${start + i}"><title>${sdDayISO(start + i)}: ${v} reviews</title></rect>`; }).join('');
  return `<div class="sx-heatwrap"><svg class="sx-heatmap" style="max-width:${Math.round(cols * (cell + gap) * 1.5)}px" viewBox="0 0 ${cols * (cell + gap)} ${7 * (cell + gap)}" role="img" aria-label="Reviews per day, last ${weeks} weeks">${rects}</svg>
    <div class="sx-streak"><span>${cur ? `${cur} day${cur === 1 ? '' : 's'} running` : 'No reviews yet today'}</span><span>longest ${best}</span><span>${avg} a day on average</span><span>${Math.round(studied / days * 100)}% of days</span></div>
    <div class="sx-dayinfo" id="sxDayInfo"></div></div>`;
}
function sdBindHeat(root){
  root.querySelectorAll('[data-sxday]').forEach(r => r.addEventListener('click', () => {
    const d = +r.dataset.sxday, list = SD.revlog.filter(x => x.ease > 0 && sdDayOfMs(x.id) === d);
    const box = root.querySelector('#sxDayInfo'); if(!box) return;
    const byE = [0, 0, 0, 0, 0]; list.forEach(x => byE[x.ease]++);
    box.innerHTML = list.length ? `${sdDayISO(d)}: ${list.length} reviews in ${Math.round(list.reduce((a, x) => a + x.time, 0) / 60000)} min · again ${byE[1]}, hard ${byE[2]}, good ${byE[3]}, easy ${byE[4]}
      <a href="#/study/browse/${encodeURIComponent('rated:' + Math.max(1, sdToday() - d + 1))}">see them</a>` : `${sdDayISO(d)}: no reviews.`;
  }));
}
function sdFsrsDeckStatsHTML(deckId){
  const ids = new Set(sdDeckAndBelow(deckId)); const rs = [], ss = [];
  SD.cards.forEach(c => { if(!ids.has(c.deckId) || c.type !== 2) return; const r = sdRetrievability(c); if(r != null){ rs.push(r); ss.push(c.memory.s); } });
  if(!rs.length) return '';
  const avg = rs.reduce((a, b) => a + b, 0) / rs.length;
  return `<div class="sx-ostats faint"><span>average retrievability ${(avg * 100).toFixed(1)}%</span><span>about ${Math.round(avg * rs.length)} of ${rs.length} reviewed cards remembered today</span>
    <span>median stability ${ss.sort((a, b) => a - b)[ss.length >> 1].toFixed(1)} days</span></div>`;
}
