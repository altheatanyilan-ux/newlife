/* ============================================================
   UNFINISHED — dump it now, finish it later, do not lose it.

   Something occurs to you between two other things and there is no
   time to write it properly. The choice at that moment is to get
   one rough line down or to lose the thought, so the capture has
   to be one field and one keystroke.

   The decision underneath: an unfinished thought is NOT a draft
   waiting somewhere to be turned into an entry. It IS an entry,
   from the first keystroke, carrying a flag that says it is not
   finished. A holding pen would mean two kinds of record, a
   conversion step between them, and a place where things sit that
   nothing else in the house can see. Instead the rough line is in
   Journals, searchable, linkable and backed up the moment it is
   typed; "finishing" it only clears a flag, so nothing moves and
   nothing has to be copied anywhere.

   Because it is a flag and not a type, it works on any kind of
   entry — a dream caught at 3am, half a decision, a memory with
   only its first sentence.

   The list sits at the bottom of Today, oldest first, and does not
   go away on its own. Nothing expires it, nothing tidies it after
   a week: it is there until you say it is done. What the bottom of
   a long page cannot do is catch your eye, so the count also rides
   in the jump index at the top.
   ============================================================ */

const unfinishedFlag = e => !!(e && e.extra && e.extra.unfinished);

/* Oldest first. The one that has been waiting longest is the one most
   likely to be forgotten, so it goes at the top rather than the bottom. */
function unfinishedEntries(){
  return (S.entries || []).filter(unfinishedFlag)
    .sort((a, b) => (a.extra.dumpedAt || a.createdAt || '') < (b.extra.dumpedAt || b.createdAt || '') ? -1 : 1);
}

function unfinishedSince(e){
  return (e.extra.dumpedAt || e.createdAt || '').slice(0, 10);
}

function setUnfinished(e, on){
  if(!e) return;
  e.extra = e.extra || {};
  if(on){ e.extra.unfinished = true; e.extra.dumpedAt = e.extra.dumpedAt || new Date().toISOString(); }
  else { delete e.extra.unfinished; }
  saveNow();
}

/* ---------- the capture ----------
   One field. No title, no type row, no date — every one of those is a
   decision, and the whole point is that there is no time to make any. It
   lands as a reflection because that is what most of them turn out to be;
   the kind is chosen later, when there is time to choose. */
function openMemoryDump(after){
  const m = openModal(`<h2 class="entry-h">Dump it here</h2>
    <p class="muted" style="font-size:.86rem;margin:-6px 0 12px">Rough is fine. It stays at the bottom of Today until you say it is finished.</p>
    <div class="stack">
      <textarea class="ta serif-lg" id="dumpBody" style="min-height:150px"
        placeholder="The thought, however half-formed. Come back to it later."></textarea>
      <div class="row between">
        <span class="faint mono" style="font-size:.7rem">⌘↵ to keep it</span>
        <button class="btn primary" id="dumpSave" style="padding:12px 28px;font-size:1rem">Keep it</button>
      </div>
    </div>`, 'narrow');
  const ta = m.querySelector('#dumpBody');
  ta.focus();
  if(typeof attachDictation === 'function') attachDictation(ta, {compact: true});

  const keep = () => {
    const body = ta.value.trim();
    if(!body){ toast('Write something first — even one line.'); return; }
    const e = {id: uid(), type: 'reflection', title: '', body, occurredAt: today(),
      createdAt: new Date().toISOString(), media: [],
      links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []},
      people: [], places: [], emotions: [], tags: [], confidence: '',
      extra: {unfinished: true, dumpedAt: new Date().toISOString()}};
    S.entries.push(e);
    saveNow();
    m.remove();
    /* redraw before the toast: the toast lives in the page, and a rerender
       that follows it would take it back down before it had been read */
    after ? after() : rerender();
    sound('save');
    toast('Kept. It is waiting at the bottom of Today.', 4000,
      {label: 'flesh it out now', fn: () => openEntryModal({entryId: e.id, after: () => rerender()})});
  };
  m.querySelector('#dumpSave').onclick = keep;
  ta.addEventListener('keydown', ev => {
    if(ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)){ ev.preventDefault(); keep(); }
  });
  return m;
}

/* ---------- the list on Today ---------- */
function unfinishedLineHTML(e){
  const days = daysSince(unfinishedSince(e));
  const waited = days <= 0 ? 'today' : days === 1 ? 'since yesterday' : `waiting ${days} days`;
  const text = (e.title || e.body || '').trim();
  return `<div class="unf" data-unf="${e.id}">
    <div class="unf-text serif">${esc(text.length > 260 ? text.slice(0, 260) + '…' : text)}</div>
    <div class="unf-foot">
      <span class="mono faint">${typeIcon(e.type)} ${esc(waited)}</span>
      <span class="row" style="gap:6px">
        <button class="btn sm ghost" data-unfopen="${e.id}">flesh it out</button>
        <button class="btn sm" data-unfdone="${e.id}">finished</button>
      </span>
    </div>
  </div>`;
}

function unfinishedSectionHTML(){
  const list = unfinishedEntries();
  /* Empty, this is one quiet line rather than nothing at all: it is the fast
     way in, and the only place the feature explains itself. */
  if(!list.length) return `<section class="section rv unfinished-block empty" id="t-unfinished">
    <div class="row between" style="gap:10px;flex-wrap:wrap">
      <span class="faint" style="font-size:.82rem">Nothing half-written. A thought with no time to write it properly goes here.</span>
      <button class="btn sm ghost" id="dumpNew">＋ dump a thought</button>
    </div></section>`;

  return `<section class="section rv unfinished-block" id="t-unfinished">
    <div class="row between" style="gap:10px;flex-wrap:wrap">
      <span class="sc" style="margin:0">Unfinished — come back to these</span>
      <button class="btn sm ghost" id="dumpNew">＋ dump a thought</button>
    </div>
    <div class="card unf-card">${list.map(unfinishedLineHTML).join('')}</div>
  </section>`;
}

function bindUnfinished(root, redraw){
  const go = () => (redraw || rerender)();
  const nu = root.querySelector('#dumpNew');
  if(nu) nu.onclick = () => openMemoryDump(go);

  root.querySelectorAll('[data-unfopen]').forEach(b => b.onclick = () => {
    openEntryModal({entryId: b.dataset.unfopen, after: go});
  });
  root.querySelectorAll('[data-unfdone]').forEach(b => b.onclick = () => {
    const e = byId(S.entries, b.dataset.unfdone); if(!e) return;
    setUnfinished(e, false);
    sound('success');
    /* Nothing is deleted by finishing — the entry stays exactly where it was,
       so the undo is simply putting the flag back. */
    toast('Marked finished. It stays in Journals.', 5000,
      {label: 'not yet', fn: () => { setUnfinished(e, true); go(); }});
    go();
  });
}
