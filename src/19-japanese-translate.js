/* ============================================================
   BIDIRECTIONAL TRANSLATION.

   Take an authentic Japanese text; put it into English; wait a day; rebuild
   the Japanese from your own English without looking; then compare. What the
   comparison shows is not vocabulary you have forgotten — it is the places
   where your Japanese is a translation of English rather than Japanese.

   THE DELAY IS THE EXERCISE. Rebuild it the same afternoon and you are
   reciting: the shape of the original is still in visual memory and you
   reproduce it without having reconstructed anything. A day later it is gone,
   and what you write is what you actually know about how the language puts
   sentences together. So the second pass is locked, and the lock is a
   timestamp rather than a countdown — a countdown dies with the tab, which is
   to say it never survives the one night it exists for.

   AND THE COMPARISON IS YOURS. Diffing two Japanese texts by machine gives
   you character-level noise: every particle swap and every synonym shows up
   as a difference and none of them are labelled. Reading the two side by side
   and naming what changed is slower and is the whole point — noticing that
   そうだ and らしい are not the same claim is the learning, and no
   diff algorithm is in a position to tell you that.
   ============================================================ */

function jaTranslateHTML(){
  const j = jaState2();
  const now = Date.now();
  const rows = j.translations.slice().sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)));
  const ready = rows.filter(t => jaTranslationState(t, now) === 'ready').length;
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Translation</span>
      <span class="row" style="gap:8px">
        ${ready ? `<span class="mono">${ready} ready for the second pass</span>` : ''}
        <button class="btn sm primary" id="jaTrNew">＋ a text</button></span></div>
    <p class="muted ja-note">Japanese into English, a day's wait, then English back into Japanese without looking. The wait is the exercise: same-day, you are reciting the shape you can still see; a day later, you are rebuilding it from what you actually know.</p>
    ${rows.length ? `<div class="stack" style="gap:10px;margin-top:10px">${rows.map(t => {
      const st = jaTranslationState(t, now);
      return `<div class="ja-tr ja-tr-${st}" data-jatr="${esc(t.id)}">
        <div class="row between" style="align-items:baseline">
          <span class="serif">${esc(t.title)}</span>
          <span class="mono faint">${st === 'pass1' ? 'not started'
            : st === 'locked' ? `locked · ${jaLockSaid(jaUnlockIn(t, now))} to go`
            : st === 'ready' ? 'ready for the second pass'
            : `${(t.divergences || []).length} divergence${(t.divergences || []).length === 1 ? '' : 's'}`}</span></div>
        ${st === 'locked' ? `<div class="ja-lock">
          <span class="ja-sand" aria-hidden="true">⌛</span>
          <span class="muted">Let it settle. Both texts are hidden until it opens.</span></div>`
          : `<div class="mono faint sm">${esc((t.originalJapanese || '').slice(0, 90))}${
            (t.originalJapanese || '').length > 90 ? '…' : ''}</div>`}
        <div class="ja-tools">
          ${st === 'pass1' ? `<button class="tbtn" data-jatr1="${esc(t.id)}">the first pass</button>` : ''}
          ${st === 'ready' ? `<button class="tbtn" data-jatr2="${esc(t.id)}">the second pass</button>` : ''}
          ${st === 'done' ? `<button class="tbtn" data-jatrcmp="${esc(t.id)}">the comparison</button>` : ''}
          <button class="del-x inline" data-jatrdel="${esc(t.id)}">×</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty">Nothing here yet. Find a paragraph of real Japanese — a blog post, a message somebody sent you, four lines of a novel.</div>'}
  </div>`;
}
const jaLockSaid = ms => {
  const h = Math.floor(ms / 3600000), m = Math.round(ms % 3600000 / 60000);
  return h ? `${h}h ${m}m` : `${m}m`;
};

/* ---------- the first pass ---------- */
function openJaTr1(id){
  const j = jaState2();
  const t = id ? byId(j.translations, id) : jaTranslationDefaults({});
  const fresh = !id;
  const m = openModal(`<h2>📖 The first pass — Japanese into English</h2>
    <div class="row" style="gap:10px">
      <label class="pd-q" style="flex:2"><span class="k">what to call it</span>
        <input class="inp" id="trTitle" autofocus value="${esc(t.title === 'A text' ? '' : t.title)}" placeholder="Tokyo friend visit"></label>
      <label class="pd-q" style="flex:1"><span class="k">where it came from</span>
        <input class="inp" id="trSource" value="${esc(t.source)}" placeholder="a blog post"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">the Japanese, as written by somebody who speaks it</span>
      <textarea class="inp ja-jp" rows="5" id="trJa" placeholder="先月、東京に住んでいる友達を訪ねました。">${esc(t.originalJapanese)}</textarea></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">your English</span>
      <textarea class="inp" rows="5" id="trEn" placeholder="Last month I visited a friend living in Tokyo…">${esc(t.userEnglish)}</textarea></label>
    <div class="row" style="gap:10px;align-items:flex-end;margin-top:10px">
      <label class="pd-q" style="flex:0 0 12rem"><span class="k">lock it for</span>
        <select class="sel" id="trLock">${[24, 48, 72, 168].map(h =>
          `<option value="${h}" ${(j.settings.lockHours || 24) === h ? 'selected' : ''}>${h < 168 ? `${h} hours` : 'a week'}</option>`).join('')}</select></label>
      <span class="grow"></span>
      <button class="btn primary" id="trSave">Save and start the wait</button></div>`, 'wide sc-modal');
  m.querySelector('#trSave').onclick = () => {
    const ja = m.querySelector('#trJa').value.trim();
    const en = m.querySelector('#trEn').value.trim();
    if(!ja || !en){ toast('Both halves, or there is nothing to come back to.'); return; }
    const hours = +m.querySelector('#trLock').value || 24;
    Object.assign(t, {title: m.querySelector('#trTitle').value.trim() || 'A text',
      source: m.querySelector('#trSource').value.trim(),
      originalJapanese: ja, userEnglish: en,
      pass1Date: new Date().toISOString(),
      unlocksAt: new Date(Date.now() + hours * 3600000).toISOString()});
    if(fresh) j.translations.push(jaTranslationDefaults(t));
    j.settings.lockHours = hours;
    saveNow(); m.remove(); sound('success');
    toast(`Locked for ${hours < 168 ? `${hours} hours` : 'a week'}.`);
    rerender();
  };
  return m;
}
/* ---------- the second ----------
   Only the English is shown. Showing the original here would make the whole
   exercise a copying task, and the lock exists precisely so that it cannot be
   in front of you. */
function openJaTr2(id){
  const j = jaState2();
  const t = byId(j.translations, id);
  if(!t) return null;
  if(jaTranslationState(t) === 'locked'){
    toast(`Still settling — ${jaLockSaid(jaUnlockIn(t))} to go.`); return null; }
  const m = openModal(`<h2>📖 The second pass — back into Japanese</h2>
    <div class="pd-q"><span class="k">your English, from the first pass</span>
      <div class="ja-frozen">${esc(t.userEnglish)}</div></div>
    <label class="pd-q" style="margin-top:10px"><span class="k">rebuild the Japanese — no peeking</span>
      <textarea class="inp ja-jp" rows="6" id="tbJa" autofocus placeholder="先月、…">${esc(t.userBackTranslation)}</textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="tbGo">Compare it against the original</button></div>`, 'wide sc-modal');
  m.querySelector('#tbGo').onclick = () => {
    t.userBackTranslation = m.querySelector('#tbJa').value;
    t.pass2Date = new Date().toISOString();
    saveNow(); m.remove(); sound('success'); openJaTrCompare(t.id);
  };
  return m;
}
/* ---------- the comparison ----------
   Side by side, and the divergences are written by hand. */
function openJaTrCompare(id){
  const j = jaState2();
  const t = byId(j.translations, id);
  if(!t) return null;
  const m = openModal(`<h2>📖 ${esc(t.title)}</h2>
    <div class="ja-compare">
      <div class="pd-q"><span class="k">as it was written</span>
        <div class="ja-frozen ja-jp">${esc(t.originalJapanese)}</div></div>
      <div class="pd-q"><span class="k">as you rebuilt it</span>
        <div class="ja-frozen ja-jp">${esc(t.userBackTranslation)}</div></div>
    </div>
    <div class="pd-q" style="margin-top:12px"><span class="k">what differs, and what the difference means</span>
      <div class="ja-divs" id="trDivs">${jaDivergenceListHTML(t)}</div>
      <button class="tbtn" id="trDivAdd">＋ a divergence</button></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="trCmpSave">Save</button></div>`, 'wide sc-modal');
  const rebuild = () => { m.querySelector('#trDivs').innerHTML = jaDivergenceListHTML(t); bindDivs(); };
  const bindDivs = () => {
    $$('[data-jadivf]', m).forEach(b => b.oninput = b.onchange = () => {
      const d = byId(t.divergences, b.dataset.jadivid); if(d) d[b.dataset.jadivf] = b.value; });
    $$('[data-jadivdel]', m).forEach(b => b.onclick = () => {
      spliceOut(t.divergences, d => d.id === b.dataset.jadivdel); rebuild(); });
    $$('[data-jadivbook]', m).forEach(b => b.onclick = () => {
      const d = byId(t.divergences, b.dataset.jadivbook);
      if(!d || d.sentToNotebook) return;
      j.errors.unshift(jaErrorDefaults({tried: d.mine, corrected: d.original,
        errorType: d.kind, note: d.note, source:'translation', sourceId: t.id}));
      d.sentToNotebook = true; saveNow(); sound('success'); toast('In the notebook.'); rebuild();
    });
    $$('[data-jadivdeck]', m).forEach(b => b.onclick = () => {
      const d = byId(t.divergences, b.dataset.jadivdeck);
      if(!d || d.sentToDeck || typeof suggestStudyCard !== 'function') return;
      suggestStudyCard({type:'production', sourceType:'translation', sourceId: t.id,
        front:`You wrote:\n\n${d.mine}\n\nWhat did the original say?`, back: d.original + (d.note ? `\n\n${d.note}` : ''),
        sourceLabel:`Translation — ${t.title}`, tags:[String(d.kind).replace(/\s+/g, '-')]});
      d.sentToDeck = true; saveNow(); sound('success'); toast('In the Study Deck inbox.'); rebuild();
    });
  };
  bindDivs();
  m.querySelector('#trDivAdd').onclick = () => {
    t.divergences.push({id:uid(), original:'', mine:'', kind:'vocabulary', note:'',
      sentToNotebook:false, sentToDeck:false});
    rebuild();
  };
  m.querySelector('#trCmpSave').onclick = () => {
    t.divergences = t.divergences.filter(d => d.original.trim() || d.mine.trim());
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
function jaDivergenceListHTML(t){
  if(!(t.divergences || []).length)
    return '<span class="faint sm">Read the two side by side and write down every place they differ. That reading is the exercise; a machine diff would give you character noise with no names on it.</span>';
  return t.divergences.map((d, i) => `<div class="ja-div">
    <div class="row" style="gap:8px">
      <span class="mono faint">${i + 1}</span>
      <input class="inp sm ja-jp" data-jadivid="${esc(d.id)}" data-jadivf="original"
        value="${esc(d.original)}" placeholder="as written">
      <span class="faint">←</span>
      <input class="inp sm ja-jp" data-jadivid="${esc(d.id)}" data-jadivf="mine"
        value="${esc(d.mine)}" placeholder="as you wrote it">
      <select class="sel sm" data-jadivid="${esc(d.id)}" data-jadivf="kind">${JA_DIVERGENCE.map(k =>
        `<option value="${k}" ${d.kind === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
      <button class="del-x inline" data-jadivdel="${esc(d.id)}">×</button>
    </div>
    <input class="inp sm" data-jadivid="${esc(d.id)}" data-jadivf="note"
      value="${esc(d.note)}" placeholder="そうだ is what you were told directly; らしい is secondhand.">
    <div class="ja-tools">
      <button class="tbtn${d.sentToNotebook ? ' on' : ''}" data-jadivbook="${esc(d.id)}"
        ${d.sentToNotebook ? 'disabled' : ''}>${d.sentToNotebook ? 'in the notebook' : 'to the notebook'}</button>
      <button class="tbtn${d.sentToDeck ? ' on' : ''}" data-jadivdeck="${esc(d.id)}"
        ${d.sentToDeck ? 'disabled' : ''}>${d.sentToDeck ? 'in the deck' : 'to the deck'}</button>
    </div>
  </div>`).join('');
}
