/* ============================================================
   THE ERROR NOTEBOOK.

   One book, fed by all four rooms. That is the whole design: the drill, the
   islands, the translations and the grammar each produce mistakes, and a
   mistake filed in the room that produced it is a mistake you will never see
   again. Filed together, the same three problems turn up over and over, and
   a month of entries says plainly what a month of feeling says vaguely.

   WHAT IT DOES NOT DO is tell you what the right answer was. Every correction
   in this room comes from you, a tutor or a native text. An entry starts with
   what you tried and an empty space, and filling that space is the work — a
   book that filled it in for you would be teaching you to trust a machine
   about Japanese, which is the one thing this studio is built not to do.

   The patterns are counted rather than interpreted. Five conditionals in a
   month is a fact; what to do about it is yours.
   ============================================================ */

function jaErrorsHTML(){
  const j = jaState2();
  const u = jaUi();
  let rows = j.errors.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if(u.errType) rows = rows.filter(e => e.errorType === u.errType);
  if(u.errSource) rows = rows.filter(e => e.source === u.errSource);
  if(u.errFind){ const q = u.errFind.toLowerCase();
    rows = rows.filter(e => `${e.tried} ${e.corrected} ${e.note} ${e.patternTag}`.toLowerCase().includes(q)); }
  const month = j.errors.filter(e => e.date >= addDays(today(), -30));
  const patterns = jaPatternTally(month);
  const open = j.errors.filter(e => !e.corrected.trim()).length;
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">The notebook</span>
      <button class="btn sm primary" id="jaErrNew">＋ an entry</button></div>
    <p class="muted ja-note">Everything that went wrong, from wherever it went wrong. What it will not do is tell you the right answer — that comes from you, a tutor, or a text written by somebody who speaks it.</p>
    ${open ? `<div class="ja-open mono">${open} entr${open === 1 ? 'y has' : 'ies have'} no correction written in yet.</div>` : ''}
    ${patterns.length ? `<div class="ja-patterns">
      <span class="sc">What keeps happening</span>
      ${patterns.map(([k, n], i) => `<div class="ja-prow">
        <span class="mono">${i + 1}</span><span>${esc(k)}</span>
        <span class="ja-bar"><i style="width:${Math.round(100 * n / patterns[0][1])}%"></i></span>
        <span class="mono">${n}</span></div>`).join('')}
      ${patterns[0][1] >= 3 ? `<p class="muted sm">${esc(patterns[0][0])} is the one to give a week to.
        ${jaPointNamed(patterns[0][0]) ? '' : 'There is no grammar point for it yet — making one is the first move.'}</p>` : ''}
    </div>` : ''}
    <div class="row ja-filters" style="gap:8px;flex-wrap:wrap">
      <select class="sel sm" id="jaErrType"><option value="">every kind</option>${JA_ERROR_TYPES.map(t =>
        `<option value="${esc(t)}" ${u.errType === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
      <select class="sel sm" id="jaErrSource"><option value="">from anywhere</option>${JA_SOURCES.map(([v, n]) =>
        `<option value="${v}" ${u.errSource === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <input class="inp sm" id="jaErrFind" value="${esc(u.errFind || '')}" placeholder="search">
    </div>
    ${rows.length ? `<div class="stack" style="gap:8px;margin-top:10px">${rows.slice(0, 60).map(e => `
      <div class="ja-err${e.corrected.trim() ? '' : ' ja-err-open'}" data-jaerrrow="${esc(e.id)}">
        <div class="ja-err-l"><span class="k mono">tried</span>
          <span class="ja-jp">${esc(e.tried || e.meaning || '—')}</span></div>
        <div class="ja-err-l"><span class="k mono">should be</span>
          <span class="ja-jp">${e.corrected.trim() ? esc(e.corrected) : '<em class="faint">not filled in yet</em>'}</span></div>
        ${e.note ? `<div class="ja-err-n">${esc(e.note)}</div>` : ''}
        <div class="mono faint sm">${esc(fmtDate(e.date, 'med'))} · ${esc(e.errorType)}${
          e.patternTag ? ` · ${esc(e.patternTag)}` : ''} · from ${
          esc((JA_SOURCES.find(v => v[0] === e.source) || [, 'somewhere'])[1])}${
          e.sentToStudyDeck ? ' · in the deck' : ''}</div>
        <div class="ja-tools">
          <button class="tbtn" data-jaerropen="${esc(e.id)}">open</button>
          ${e.corrected.trim() && !e.sentToStudyDeck ? `<button class="tbtn" data-jaerrcard="${esc(e.id)}">to the deck</button>` : ''}
          ${e.grammarPointId ? `<button class="tbtn" data-jaerrgram="${esc(e.grammarPointId)}">the point</button>` : ''}
          <button class="del-x inline" data-jaerrdel="${esc(e.id)}">×</button></div>
      </div>`).join('')}</div>`
      : '<div class="empty">Nothing in the book. Every room feeds it — mark something in an audit, or write one down here.</div>'}
  </div>`;
}
/* Counted by the tag you gave it, falling back to the kind. The tag is what
   makes this useful: "conditional confusion" across four different points is
   the pattern, and no automatic classifier would have grouped them. */
function jaPatternTally(rows, n = 4){
  const tally = {};
  rows.forEach(e => { const k = (e.patternTag || e.errorType || 'other').trim().toLowerCase();
    if(k) tally[k] = (tally[k] || 0) + 1; });
  return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, n).filter(v => v[1] > 1);
}
const jaPointNamed = name => jaState2().grammar
  .find(g => g.name.toLowerCase().includes(String(name).toLowerCase().split(/\s+/)[0] || '\u0000'));

function openJaError(id, seed){
  const j = jaState2();
  const e = id ? byId(j.errors, id) : jaErrorDefaults(Object.assign({}, seed || {}));
  const fresh = !id;
  const m = openModal(`<h2>📕 ${fresh ? 'Something that went wrong' : 'That entry'}</h2>
    <label class="pd-q"><span class="k">what you tried to say, or what you said</span>
      <textarea class="inp ja-jp" rows="2" id="erTried" autofocus placeholder="仕事を始めたそうで">${esc(e.tried)}</textarea></label>
    <!-- deliberately not filled in for you: finding the answer is the work -->
    <label class="pd-q" style="margin-top:8px"><span class="k">what it should have been</span>
      <textarea class="inp ja-jp" rows="2" id="erFixed" placeholder="仕事を始めたらしくて">${esc(e.corrected)}</textarea></label>
    <div class="row" style="gap:10px;margin-top:10px">
      <label class="pd-q" style="flex:1"><span class="k">what kind</span>
        <select class="sel" id="erType">${JA_ERROR_TYPES.map(t =>
          `<option value="${esc(t)}" ${e.errorType === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <label class="pd-q" style="flex:1"><span class="k">the pattern, in your words</span>
        <input class="inp" id="erTag" value="${esc(e.patternTag)}" placeholder="conditional confusion"></label>
      ${j.grammar.length ? `<label class="pd-q" style="flex:1"><span class="k">the point it belongs to</span>
        <select class="sel" id="erPoint"><option value="">—</option>${j.grammar.map(g =>
          `<option value="${esc(g.id)}" ${e.grammarPointId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>` : ''}
    </div>
    <label class="pd-q" style="margin-top:8px"><span class="k">why it is wrong</span>
      <textarea class="inp" rows="3" id="erNote" placeholder="そうだ is what you were told directly. らしい is secondhand.">${esc(e.note)}</textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${fresh ? '' : `<button class="btn sm ghost danger" id="erDel">Delete</button><span class="grow"></span>`}
      <button class="btn primary" id="erSave">Save</button></div>`, 'sc-modal');
  m.querySelector('#erSave').onclick = () => {
    const point = m.querySelector('#erPoint');
    Object.assign(e, {tried: m.querySelector('#erTried').value.trim(),
      corrected: m.querySelector('#erFixed').value.trim(),
      errorType: m.querySelector('#erType').value,
      patternTag: m.querySelector('#erTag').value.trim(),
      grammarPointId: point ? (point.value || null) : e.grammarPointId,
      note: m.querySelector('#erNote').value.trim()});
    if(!e.tried && !e.corrected){ m.querySelector('#erTried').focus(); return; }
    if(fresh) j.errors.unshift(jaErrorDefaults(e));
    saveNow(); m.remove(); sound('success'); rerender();
  };
  const del = m.querySelector('#erDel');
  if(del) del.onclick = () => { spliceOut(j.errors, v => v.id === e.id); saveNow(); m.remove();
    sound('click'); rerender(); };
  return m;
}
/* To the deck, as a production card: you are not trying to recognise the
   right version, you are trying to reach for it. */
function jaErrorToDeck(id){
  const e = byId(jaState2().errors, id);
  if(!e || typeof suggestStudyCard !== 'function') return false;
  if(!e.corrected.trim()){ toast('Write the correction in first — a card with no answer is not a card.'); return false; }
  suggestStudyCard({type:'production', sourceType:'error_log', sourceId: e.id,
    front:`You said:\n\n${e.tried}\n\nWhat should it have been?`,
    back: e.corrected + (e.note ? `\n\n${e.note}` : ''),
    sourceLabel:`Japanese — ${fmtDate(e.date, 'med')}`,
    tags:[String(e.errorType || '').replace(/\s+/g, '-')]});
  e.sentToStudyDeck = true;
  saveNow();
  return true;
}
