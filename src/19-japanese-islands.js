/* ============================================================
   LANGUAGE ISLANDS.

   A monologue you have by heart, which you can stand on while the rest of the
   sentence assembles itself. Thirty of them and you can hold a conversation
   about your own life at speed, because most of what anybody says about
   themselves is the same eight paragraphs in a different order.

   Three things make this more than a notes app.

   TWO REGISTERS, ALWAYS. Keeping only the polite version means every casual
   conversation is delivered in a voice that sounds like a form letter, and
   the casual version is not a simplification of the polite one — it is a
   different set of endings, particles and omissions that has to be learned
   separately. So both are here, side by side, and an island is not finished
   until it has both.

   THE ENGLISH DRAFT IS KEPT FOREVER. Your Japanese will get better and the
   monologue will get rewritten; what must not be lost is what you were
   originally trying to say, because the temptation at every rewrite is to say
   the thing you can say rather than the thing you meant.

   AND THE VOCABULARY BELONGS TO THE TOPIC. A phrase you cannot produce
   matters here, in this monologue, and nowhere else — a global word list
   cannot tell you that "why Japan" is the topic you are not ready to be asked
   about. Each island carries the chunks it needs and says what share of them
   you can actually produce, which is the honest answer to "can I talk about
   this yet".
   ============================================================ */

function jaIslandsHTML(){
  const j = jaState2();
  const list = j.islands.slice().sort((a, b) =>
    JA_ISLAND_STATUS.findIndex(v => v[0] === b.status) - JA_ISLAND_STATUS.findIndex(v => v[0] === a.status));
  const auto = jaAutomatic();
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Islands</span>
      <span class="row" style="gap:8px">
        <span class="mono faint">${list.length} of ${j.settings.islandGoal}${auto ? ` · ${auto} automatic` : ''}</span>
        <button class="btn sm primary" id="jaIslandNew">＋ an island</button></span></div>
    <p class="muted ja-note">A monologue you have by heart, in both registers, with the vocabulary it needs kept beside it. Most of what anybody says about themselves is the same eight paragraphs in a different order — having them ready is the difference between thinking in Japanese and translating into it.</p>
    ${list.length ? `<div class="ja-islands">${list.map(i => {
      const r = jaIslandReady(i);
      return `<div class="ja-island ja-is-${esc(i.status)}" data-jaisland="${esc(i.id)}">
        <div class="ja-island-t serif">${esc(i.topicJapanese || i.topic)}</div>
        ${i.topicJapanese ? `<div class="mono faint">${esc(i.topic)}</div>` : ''}
        <div class="ja-island-s mono">${esc((JA_ISLAND_STATUS.find(v => v[0] === i.status) || [,''])[1])}${
          i.nativeVerified ? ' · checked' : ''}</div>
        <div class="ja-island-r" title="${r.ready} of ${r.total} chunks you can produce">
          <span class="ja-bar"><i style="width:${r.pct}%"></i></span>
          <span class="mono">${r.total ? `${r.pct}%` : 'no chunks yet'}</span></div>
        <div class="mono faint sm">${i.timesUsed ? `used ${i.timesUsed}× in a drill` : 'not yet drilled'}${
          !i.japaneseTameguchi ? ' · no casual version' : ''}</div>
        <div class="ja-tools">
          <button class="tbtn" data-jaislandedit="${esc(i.id)}">open</button>
          <button class="tbtn" data-jaisland432="${esc(i.id)}">4/3/2 it</button>
          <button class="tbtn" data-jaislandcard="${esc(i.id)}">to the deck</button>
          <button class="del-x inline" data-jaislanddel="${esc(i.id)}">×</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty">No islands yet. Start with the one you will be asked for first — who you are and what you do.</div>'}
    ${jaTopicOverviewHTML()}
  </div>
  ${jaStonesHTML()}`;
}
/* Every topic and how ready it is, sorted worst first. This view answers one
   question and it is the question: which of the things I might be asked about
   can I actually talk about? */
function jaTopicOverviewHTML(){
  const rows = jaTopicOverview().filter(r => r.total);
  if(!rows.length) return '';
  const total = sum(rows.map(r => r.total)), ready = sum(rows.map(r => r.ready));
  return `<details class="ja-overview"${rows.some(r => r.pct < 50) ? ' open' : ''}>
    <summary><span class="sc">Topics and their vocabulary</span>
      <span class="mono faint">${ready} of ${total} chunks you can produce</span></summary>
    <div class="body">
      ${rows.map(r => `<div class="ja-orow">
        <span class="ja-on">${esc(r.island.topic)}</span>
        <span class="ja-bar"><i style="width:${r.pct}%"></i></span>
        <span class="mono">${r.ready}/${r.total}</span>
      </div>`).join('')}
      ${rows[0].pct < 50 ? `<p class="muted sm">Lowest is ${esc(rows[0].island.topic)} at ${rows[0].pct}%.
        Drill those chunks before you try a sitting on it — four minutes on a topic you have not got
        the words for is four minutes of finding that out.</p>` : ''}
      <div class="row" style="gap:8px;margin-top:8px">
        <button class="btn sm" id="jaChunksToDeck">Send everything hesitant to the Study Deck</button></div>
    </div></details>`;
}
/* ---------- the vault ----------
   Not vocabulary. What to say while the sentence you want is still
   assembling itself — and having it by heart is the difference between a
   pause and a silence, which is the difference between a conversation that
   continues and one that somebody else has to rescue. */
function jaStonesHTML(){
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Stepping stones</span>
      <button class="btn sm primary" id="jaStoneNew">＋ a phrase</button></div>
    <p class="muted ja-note">The phrases that buy you a second without buying a silence. Glance at this while you talk; it is meant to be a cheat sheet, not a syllabus.</p>
    <div class="ja-shelves">${JA_STONE_SHELVES.map(([k, name, jp, hint]) => {
      const list = jaStones(k);
      return `<details class="ja-shelf" ${list.length ? 'open' : ''}>
        <summary><span class="sc">${esc(name)}</span><span class="mono faint">${esc(jp)} · ${esc(hint)}</span></summary>
        <div class="body"><div class="ja-stones">${list.map(v => `<span class="ja-stone" data-jastone="${esc(v.id)}">
          <b>${esc(v.text)}</b>${v.note ? ` <em class="faint">${esc(v.note)}</em>` : ''}
          <button class="del-x inline" data-jastonedel="${esc(v.id)}">×</button></span>`).join('')
          || '<span class="faint sm">nothing on this shelf yet</span>'}</div>
          <button class="tbtn" data-jastoneadd="${esc(k)}">＋ add to this shelf</button></div>
      </details>`; }).join('')}</div>
  </div>`;
}

/* ---------- the editor ---------- */
function openJaIsland(id){
  const j = jaState2();
  const i = id ? byId(j.islands, id) : jaIslandDefaults({});
  const fresh = !id;
  const m = openModal(`<h2>🏝 ${esc(i.topic || 'A new island')}</h2>
    <div class="row" style="gap:10px">
      <label class="pd-q" style="flex:2"><span class="k">what it is about</span>
        <input class="inp" id="isTopic" autofocus value="${esc(i.topic)}" placeholder="my work at the bar"></label>
      <label class="pd-q" style="flex:1"><span class="k">in Japanese</span>
        <input class="inp" id="isTopicJa" value="${esc(i.topicJapanese)}" placeholder="バーの仕事"></label>
      <label class="pd-q" style="flex:1"><span class="k">where it stands</span>
        <select class="sel" id="isStatus">${JA_ISLAND_STATUS.map(([v, n, hint]) =>
          `<option value="${v}" ${i.status === v ? 'selected' : ''}>${esc(n)} — ${esc(hint)}</option>`).join('')}</select></label>
    </div>
    <!-- kept forever: your Japanese will get better and this will be rewritten,
         and the thing that must not be lost is what you were trying to say -->
    <label class="pd-q" style="margin-top:10px"><span class="k">the English draft — what you actually mean</span>
      <textarea class="inp" rows="4" id="isEn" placeholder="I run a bar in Singapore that blends…">${esc(i.englishDraft)}</textarea></label>
    <div class="ja-registers">
      <label class="pd-q"><span class="k">丁寧語 — polite</span>
        <textarea class="inp ja-jp" rows="6" id="isTeineigo" placeholder="シンガポールでバーを経営しています。">${esc(i.japaneseTeineigo)}</textarea></label>
      <label class="pd-q"><span class="k">タメ口 — casual</span>
        <textarea class="inp ja-jp" rows="6" id="isTameguchi" placeholder="シンガポールでバーやってるんだけど、">${esc(i.japaneseTameguchi)}</textarea></label>
    </div>
    <div class="row" style="gap:14px;margin-top:6px">
      <label class="ja-check"><input type="checkbox" id="isVerified" ${i.nativeVerified ? 'checked' : ''}> a native has been over it</label>
      <label class="ja-check"><input type="checkbox" id="isPitch" ${i.pitchMarked ? 'checked' : ''}> pitch marked</label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">what was changed, and why — the part worth keeping</span>
      <textarea class="inp" rows="3" id="isNotes" placeholder="Tutor changed 体験を組み合わせた to 体験が融合した — more natural for a concept than for objects.">${esc(i.correctionNotes)}</textarea></label>
    <div class="pd-q" style="margin-top:10px"><span class="k">the chunks this topic needs</span>
      <div class="ja-chunks" id="isChunks">${jaChunkListHTML(i)}</div>
      <button class="tbtn" id="isChunkAdd">＋ a chunk</button></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${fresh ? '' : `<button class="btn sm ghost" id="isTo432">Use it in a 4/3/2</button><span class="grow"></span>`}
      <button class="btn primary" id="isSave">Save</button></div>`, 'wide sc-modal');

  const rebuild = () => { m.querySelector('#isChunks').innerHTML = jaChunkListHTML(i); bindChunks(); };
  const bindChunks = () => {
    $$('[data-jachunkready]', m).forEach(b => b.onchange = () => {
      const c = byId(i.chunks, b.dataset.jachunkready); if(c) c.ready = b.checked; });
    $$('[data-jachunkdel]', m).forEach(b => b.onclick = () => {
      spliceOut(i.chunks, c => c.id === b.dataset.jachunkdel); rebuild(); });
    $$('[data-jachunkf]', m).forEach(b => b.oninput = () => {
      const c = byId(i.chunks, b.dataset.jachunkid); if(c) c[b.dataset.jachunkf] = b.value; });
  };
  bindChunks();
  m.querySelector('#isChunkAdd').onclick = () => {
    i.chunks.push(jaChunkDefaults({}, i.id)); rebuild();
    const last = [...m.querySelectorAll('[data-jachunkf="japanese"]')].pop();
    if(last) last.focus();
  };
  const to432 = m.querySelector('#isTo432');
  if(to432) to432.onclick = () => { m.remove(); openJa432Setup(i.id); };
  m.querySelector('#isSave').onclick = () => {
    const wasJa = i.japaneseTeineigo + '|' + i.japaneseTameguchi;
    Object.assign(i, {
      topic: m.querySelector('#isTopic').value.trim() || 'An island',
      topicJapanese: m.querySelector('#isTopicJa').value.trim(),
      status: m.querySelector('#isStatus').value,
      englishDraft: m.querySelector('#isEn').value,
      japaneseTeineigo: m.querySelector('#isTeineigo').value,
      japaneseTameguchi: m.querySelector('#isTameguchi').value,
      nativeVerified: m.querySelector('#isVerified').checked,
      pitchMarked: m.querySelector('#isPitch').checked,
      correctionNotes: m.querySelector('#isNotes').value});
    /* a version so a recording made against an older wording is visibly a
       recording of something else */
    if(wasJa !== i.japaneseTeineigo + '|' + i.japaneseTameguchi) i.version = (+i.version || 1) + 1;
    i.chunks = i.chunks.filter(c => c.japanese.trim());
    if(fresh) j.islands.push(jaIslandDefaults(i));
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
function jaChunkListHTML(i){
  if(!(i.chunks || []).length) return '<span class="faint sm">Nothing yet. What would you need to know how to say, to say this?</span>';
  return i.chunks.map(c => `<div class="ja-chunk" data-jachunkrow="${esc(c.id)}">
    <input class="inp sm ja-jp" data-jachunkid="${esc(c.id)}" data-jachunkf="japanese"
      value="${esc(c.japanese)}" placeholder="経営する">
    <input class="inp sm" data-jachunkid="${esc(c.id)}" data-jachunkf="reading"
      value="${esc(c.reading)}" placeholder="けいえいする">
    <input class="inp sm" data-jachunkid="${esc(c.id)}" data-jachunkf="meaning"
      value="${esc(c.meaning)}" placeholder="to run a business">
    <label class="ja-check mono" title="can you produce it without reaching for it?">
      <input type="checkbox" data-jachunkready="${esc(c.id)}" ${c.ready ? 'checked' : ''}> fluent</label>
    <button class="del-x inline" data-jachunkdel="${esc(c.id)}">×</button>
  </div>`).join('');
}
/* Everything you cannot yet produce, to the deck in one press. The card is a
   production card — meaning on the front, Japanese on the back — because
   recognising a phrase and being able to reach for it are different skills
   and only the second one is what an island needs. */
function jaChunksToDeck(){
  if(typeof suggestStudyCard !== 'function') return 0;
  let n = 0;
  jaState2().islands.forEach(i => (i.chunks || []).forEach(c => {
    if(c.ready || c.sentToDeck || !c.japanese.trim()) return;
    suggestStudyCard({type:'production', sourceType:'island', sourceId:c.id,
      front:`Say this in Japanese:\n\n${c.meaning || c.japanese}`,
      back: c.reading ? `${c.japanese}\n${c.reading}` : c.japanese,
      sourceLabel:`Island — ${i.topic}`, tags:['chunk']});
    c.sentToDeck = true; n++;
  }));
  if(n) saveNow();
  return n;
}
function openJaStone(shelf, id){
  const j = jaState2();
  const v = id ? byId(j.stones, id) : null;
  const m = openModal(`<h2>${v ? 'That phrase' : 'A phrase worth having ready'}</h2>
    <label class="pd-q"><span class="k">the phrase</span>
      <input class="inp ja-jp" id="stText" autofocus value="${esc(v ? v.text : '')}" placeholder="なんというか"></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">reading</span>
      <input class="inp" id="stRead" value="${esc(v ? v.reading : '')}"></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">what it does</span>
      <input class="inp" id="stNote" value="${esc(v ? v.note : '')}" placeholder="how should I put it"></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">shelf</span>
      <select class="sel" id="stShelf">${JA_STONE_SHELVES.map(([k, name]) =>
        `<option value="${k}" ${(v ? v.shelf : shelf) === k ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="stSave">Save</button></div>`, 'narrow sc-modal');
  m.querySelector('#stSave').onclick = () => {
    const text = m.querySelector('#stText').value.trim();
    if(!text){ m.querySelector('#stText').focus(); return; }
    const fields = {text, reading: m.querySelector('#stRead').value.trim(),
      note: m.querySelector('#stNote').value.trim(), shelf: m.querySelector('#stShelf').value};
    if(v) Object.assign(v, fields);
    else j.stones.push(Object.assign({id:uid(), order:j.stones.length}, fields));
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
