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
  /* only the islands that are not inside another one: a smaller island
     belongs on its parent's page, not loose in the archipelago */
  const list = j.islands.filter(i => !i.parentId).sort((a, b) =>
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
          !i.japaneseTameguchi ? ' · no casual version' : ''}${
          jaSubIslands(i.id).length ? ` · ${jaSubIslands(i.id).length} inside` : ''}</div>
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
  const all = jaState2().stones || [];
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Stepping stones</span>
      <span class="row" style="gap:8px">
        <span class="mono faint">${all.length} phrase${all.length === 1 ? '' : 's'}</span>
        <button class="btn sm ghost" id="jaStonesTopUp" title="add the phrases that ship with the room, leaving yours alone">top up</button>
        <button class="btn sm primary" id="jaStoneNew">\uff0b a phrase</button></span></div>
    <p class="muted ja-note">The phrases that buy you a second without buying a silence. Glance at this while
      you talk; it is meant to be a cheat sheet, not a syllabus. The voice matters more here than anywhere:
      a stepping stone is said under pressure without thinking, and one said in the wrong register is worse
      than a pause \u2014 it is a pause and then an apology.</p>
    <div class="ja-shelves">${JA_STONE_SHELVES.map(([k, name, jp, hint]) => {
      const list = jaStones(k);
      /* grouped by voice rather than mixed, because the point of the shelf is
         to be glanced at, and a glance cannot sort */
      const by = r => list.filter(v => v.register === r);
      const group = (r, label) => { const rows = by(r); if(!rows.length) return '';
        return `<div class="ja-stonegroup">
          <span class="ja-stonevoice mono ja-v-${r}">${esc(label)}</span>
          <div class="ja-stones">${rows.map(jaStoneChipHTML).join('')}</div></div>`; };
      return `<details class="ja-shelf" ${list.length ? 'open' : ''}>
        <summary><span class="sc">${esc(name)}</span><span class="mono faint">${esc(jp)} \u00b7 ${esc(hint)}</span>
          <span class="mono faint ja-shelfn">${list.length}</span></summary>
        <div class="body">
          ${list.length
            ? group('either', 'either') + group('formal', '\u4e01\u5be7\u8a9e \u2014 formal') + group('casual', '\u30bf\u30e1\u53e3 \u2014 casual')
            : '<span class="faint sm">nothing on this shelf yet</span>'}
          <button class="tbtn" data-jastoneadd="${esc(k)}">\uff0b add to this shelf</button></div>
      </details>`; }).join('')}</div>
  </div>`;
}
/* One phrase. The reading sits under it rather than beside it, because the
   chip is read at a glance and two things on one line is one thing nobody
   reads. */
function jaStoneChipHTML(v){
  return `<span class="ja-stone ja-v-${esc(v.register)}" data-jastone="${esc(v.id)}">
    <b class="ja-jp">${esc(v.text)}</b>
    ${v.reading && v.reading !== v.text ? `<i class="ja-stoneread mono">${esc(v.reading)}</i>` : ''}
    ${v.note ? `<em class="faint">${esc(v.note)}</em>` : ''}
    <button class="del-x inline" data-jastonedel="${esc(v.id)}">\u00d7</button></span>`;
}

/* ---------- the editor ---------- */
/* ---------- an island, as a page of its own ----------
   The old one was a modal. A modal is a box floating over something else,
   which is the right shape for a question and the wrong shape for a place
   you sit and work: two full texts, a paragraph of what a tutor changed and
   why, a list of vocabulary, and a set of smaller islands underneath. None
   of that fits in a box, and all of it wants an address you can come back to. */
const jaSubIslands = parentId => jaState2().islands
  .filter(i => i.parentId === parentId)
  .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
const jaIslandParent = i => i && i.parentId ? byId(jaState2().islands, i.parentId) : null;

function openJaIsland(id){
  /* every way in now goes to the page. A new island is made first so that it
     has an address to be at. */
  if(id){ navigate('#/japanese/islands/' + id); return null; }
  const j = jaState2();
  const made = jaIslandDefaults({topic:'A new island'});
  j.islands.push(made);
  saveNow();
  navigate('#/japanese/islands/' + made.id);
  return null;
}
/* and one made inside another */
function jaNewSubIsland(parentId){
  const j = jaState2();
  const made = jaIslandDefaults({topic:'A smaller island', parentId});
  j.islands.push(made);
  saveNow();
  navigate('#/japanese/islands/' + made.id);
  return made;
}

function jaIslandPage(root, i){
  const j = jaState2();
  const parent = jaIslandParent(i);
  const subs = jaSubIslands(i.id);
  const r = jaIslandReady(i);
  root.innerHTML = `<div class="page ja-page ja-islandpage">
    <div class="ja-isle-head">
      <button class="btn sm ghost" id="isBack">← ${parent ? esc(parent.topicJapanese || parent.topic) : 'the islands'}</button>
      <span class="grow"></span>
      <span class="mono faint">${r.total ? `${r.ready} of ${r.total} chunks fluent` : 'no chunks yet'}${
        i.timesUsed ? ` · used ${i.timesUsed}×` : ''}</span>
      <button class="btn sm" id="isTo432">Use it in a 4/3/2</button>
    </div>
    ${parent ? `<div class="ja-isle-in mono">inside <a href="#/japanese/islands/${esc(parent.id)}">${
      esc(parent.topicJapanese || parent.topic)}</a></div>` : ''}
    <div class="row" style="gap:10px;align-items:flex-end">
      <label class="pd-q" style="flex:2"><span class="k">what it is about</span>
        <input class="inp serif-lg" id="isTopic" value="${esc(i.topic)}" placeholder="my work at the bar"></label>
      <label class="pd-q" style="flex:1"><span class="k">in Japanese</span>
        <input class="inp ja-jp" id="isTopicJa" value="${esc(i.topicJapanese)}" placeholder="バーの仕事"></label>
      <label class="pd-q" style="flex:0 0 15rem"><span class="k">where it stands</span>
        <select class="sel" id="isStatus">${JA_ISLAND_STATUS.map(([v, n, hint]) =>
          `<option value="${v}" ${i.status === v ? 'selected' : ''}>${esc(n)} — ${esc(hint)}</option>`).join('')}</select></label>
    </div>
    <!-- kept forever: your Japanese will get better and this will be rewritten,
         and the thing that must not be lost is what you were trying to say -->
    <label class="pd-q" style="margin-top:12px"><span class="k">the English draft — what you actually mean</span>
      <textarea class="inp" rows="4" id="isEn" placeholder="I run a bar in Singapore that blends…">${esc(i.englishDraft)}</textarea></label>
    <div class="ja-registers">
      <label class="pd-q"><span class="k">丁寧語 — polite</span>
        <textarea class="inp ja-jp" rows="8" id="isTeineigo" placeholder="シンガポールでバーを経営しています。">${esc(i.japaneseTeineigo)}</textarea></label>
      <label class="pd-q"><span class="k">タメ口 — casual</span>
        <textarea class="inp ja-jp" rows="8" id="isTameguchi" placeholder="シンガポールでバーやってるんだけど、">${esc(i.japaneseTameguchi)}</textarea></label>
    </div>
    <div class="row" style="gap:14px;margin-top:6px;flex-wrap:wrap">
      <label class="ja-check"><input type="checkbox" id="isVerified" ${i.nativeVerified ? 'checked' : ''}> a native has been over it</label>
      <label class="ja-check"><input type="checkbox" id="isPitch" ${i.pitchMarked ? 'checked' : ''}> pitch marked</label>
    </div>

    <section class="section rv ja-isle-sec">
      <div class="row between" style="align-items:baseline">
        <span class="sc" style="margin:0">The chunks this needs</span>
        <button class="btn sm" id="isChunkAdd">＋ a chunk</button></div>
      <p class="muted" style="font-size:.85rem">The phrase, how it is said, and what it means \u2014 the English is
        the cue when these become flashcards, and a card you can answer by recognising teaches nothing.
        A word you cannot produce matters here, in this monologue, and nowhere else.</p>
      <div class="ja-chunks" id="isChunks">${jaChunkListHTML(i)}</div>
    </section>

    <section class="section rv ja-isle-sec">
      <div class="row between" style="align-items:baseline">
        <span class="sc" style="margin:0">Smaller islands</span>
        <button class="btn sm" id="isSubAdd">＋ one inside this</button></div>
      <p class="muted" style="font-size:.85rem">“My work” is not one monologue — it is the bar, the hours,
        why I left the last job, the regular who comes in on Thursdays. Each of those is its own thing to be able
        to say, and useless as a heading under one enormous text.</p>
      ${subs.length ? `<div class="ja-islands">${subs.map(v => {
        const rr = jaIslandReady(v);
        return `<div class="ja-island ja-is-${esc(v.status)}">
          <div class="ja-island-t serif">${esc(v.topicJapanese || v.topic)}</div>
          ${v.topicJapanese ? `<div class="mono faint">${esc(v.topic)}</div>` : ''}
          <div class="ja-island-s mono">${esc((JA_ISLAND_STATUS.find(w => w[0] === v.status) || [,''])[1])}</div>
          <div class="ja-island-r" title="${rr.ready} of ${rr.total} chunks you can produce">
            <span class="ja-bar"><i style="width:${rr.pct}%"></i></span>
            <span class="mono">${rr.total ? `${rr.pct}%` : 'no chunks yet'}</span></div>
          <div class="ja-tools">
            <button class="tbtn" data-jaislandedit="${esc(v.id)}">open</button>
            <button class="tbtn" data-jaisland432="${esc(v.id)}">4/3/2 it</button>
            <button class="tbtn" data-jaislandout="${esc(v.id)}" title="make it an island in its own right">set adrift</button>
            <button class="del-x inline" data-jaislanddel="${esc(v.id)}">×</button></div>
        </div>`; }).join('')}</div>`
        : '<div class="empty sm">Nothing inside this one yet.</div>'}
    </section>

    <div class="row" style="margin-top:16px;gap:8px">
      <button class="btn sm ghost danger" id="isDel">Throw this island away</button>
      <span class="grow"></span>
      <span class="mono faint" id="isSaved">saved as you type</span>
    </div>
  </div>`;
  bindJaIslandPage(root, i);
}
function jaChunkListHTML(i){
  if(!(i.chunks || []).length) return '<span class="faint sm">Nothing yet. What would you need to know how to say, to say this?</span>';
  return i.chunks.map(c => jaChunkRowHTML(c)).join('');
}
/* One chunk: the phrase, how it is said, and what it means.

   There was a table in here for a while that worked the reading out from the
   characters. It is gone: a reading you type is a reading you have thought
   about, and thinking about it is most of the reason for writing the phrase
   down at all.

   What the room does do, once the reading is there, is put it over the right
   characters \u2014 which is not a language problem but an alignment one, and
   alignment is exact where generation is a guess. The kana in the phrase are
   anchors; what falls between them belongs to the kanji between them.

   The English went away for a version and came back, for a reason worth
   writing down: these chunks become flashcards, and a production card needs
   a cue in a language you are not trying to produce. Given the Japanese you
   would be recognising it; given the English you have to reach for it, and
   reaching for it is the whole exercise. */
function jaChunkRowHTML(c){
  return `<div class="ja-chunk" data-jachunkrow="${esc(c.id)}">
    <input class="inp ja-jp" data-jachunkid="${esc(c.id)}" data-jachunkf="japanese"
      value="${esc(c.japanese)}" placeholder="\u7d4c\u55b6\u3059\u308b">
    <input class="inp" data-jachunkid="${esc(c.id)}" data-jachunkf="reading"
      value="${esc(c.reading)}" placeholder="\u3051\u3044\u3048\u3044\u3059\u308b">
    <input class="inp" data-jachunkid="${esc(c.id)}" data-jachunkf="meaning"
      value="${esc(c.meaning)}" placeholder="to run a business">
    <label class="ja-check mono" title="can you produce it without reaching for it?">
      <input type="checkbox" data-jachunkready="${esc(c.id)}" ${c.ready ? 'checked' : ''}> fluent</label>
    <button class="del-x inline" data-jachunkdel="${esc(c.id)}">\u00d7</button>
    <div class="ja-chunkruby ja-jp" data-jachunkruby="${esc(c.id)}">${jaChunkRubySay(c)}</div>
  </div>`;
}
/* The phrase with the reading set over its kanji, or nothing at all. Nothing
   at all is the right answer more often than it looks: before a reading is
   typed there is nothing to set, and where the reading will not align it is
   already on the line above where it can be read. */
function jaChunkRubySay(c){
  if(!c.japanese || !c.reading) return '';
  return jaRubyFits(c.japanese, c.reading)
    ? jaRubyHTML(c.japanese, c.reading)
    : `<span class="faint sm">the reading does not line up with the kanji \u2014 check it against the phrase</span>`;
}

/* ---------- the page's bindings ----------
   Written straight through rather than saved on a button: a page you sit and
   work at should not have a Save on it, and there is nowhere for unsaved
   work to be lost to. The page is only rebuilt when something structural
   changes \u2014 a chunk added or thrown away \u2014 never while you are typing. */
function bindJaIslandPage(root, i){
  const j = jaState2();
  const one = sel => root.querySelector(sel);
  const mark = () => { const n = one('#isSaved'); if(!n) return;
    n.textContent = 'saved'; n.classList.add('just');
    clearTimeout(bindJaIslandPage._t);
    bindJaIslandPage._t = setTimeout(() => { n.textContent = 'saved as you type';
      n.classList.remove('just'); }, 1400); };
  const field = (sel, key, after) => { const n = one(sel); if(!n) return;
    n.oninput = debounce(() => { i[key] = n.value; if(after) after(); saveNow(); mark(); }, 300);
  };
  field('#isTopic', 'topic');
  field('#isTopicJa', 'topicJapanese');
  field('#isEn', 'englishDraft');
  /* a change of wording is a new version, so a recording made against the
     old one is visibly a recording of something else */
  const bump = () => { i.version = (+i.version || 1) + 1; };
  field('#isTeineigo', 'japaneseTeineigo', bump);
  field('#isTameguchi', 'japaneseTameguchi', bump);
  const st = one('#isStatus');
  if(st) st.onchange = () => { i.status = st.value; saveNow(); mark(); };
  ['isVerified|nativeVerified', 'isPitch|pitchMarked'].forEach(pair => {
    const [id, key] = pair.split('|');
    const n = one('#' + id); if(n) n.onchange = () => { i[key] = n.checked; saveNow(); mark(); };
  });
  const back = one('#isBack');
  if(back) back.onclick = () => navigate(i.parentId
    ? '#/japanese/islands/' + i.parentId : '#/japanese/islands');
  const to432 = one('#isTo432');
  if(to432) to432.onclick = () => openJa432Setup(i.id);
  const rebuild = () => { saveNow(); const box = one('#isChunks');
    if(box){ box.innerHTML = jaChunkListHTML(i); bindChunks(); } };
  const bindChunks = () => {
    $$('[data-jachunkready]', root).forEach(b => b.onchange = () => {
      const c = byId(i.chunks, b.dataset.jachunkready); if(c) c.ready = b.checked; saveNow(); mark(); });
    $$('[data-jachunkdel]', root).forEach(b => b.onclick = () => {
      spliceOut(i.chunks, c => c.id === b.dataset.jachunkdel); rebuild(); });
    /* both fields write straight through, so nothing is lost by leaving the
       page and there is no Save for anything to be waiting behind \u2014 and the
       reading is set over the kanji as it is typed, which is the only way to
       see whether it has landed where you meant it to */
    $$('[data-jachunkf]', root).forEach(n => n.oninput = debounce(() => {
      const c = byId(i.chunks, n.dataset.jachunkid); if(!c) return;
      c[n.dataset.jachunkf] = n.value;
      const over = root.querySelector(`[data-jachunkruby="${CSS.escape(c.id)}"]`);
      if(over) over.innerHTML = jaChunkRubySay(c);
      saveNow(); mark();
    }, 250));
  };
  bindChunks();
  const add = one('#isChunkAdd');
  if(add) add.onclick = () => { i.chunks.push(jaChunkDefaults({}, i.id)); rebuild();
    const last = [...root.querySelectorAll('[data-jachunkf="japanese"]')].pop();
    if(last) last.focus(); };
  const sub = one('#isSubAdd');
  if(sub) sub.onclick = () => jaNewSubIsland(i.id);
  $$('[data-jaislandedit]', root).forEach(b => b.onclick = () =>
    navigate('#/japanese/islands/' + b.dataset.jaislandedit));
  $$('[data-jaisland432]', root).forEach(b => b.onclick = () => openJa432Setup(b.dataset.jaisland432));
  /* setting one adrift makes it an island in its own right rather than
     throwing it away: the same record, one field cleared */
  $$('[data-jaislandout]', root).forEach(b => b.onclick = () => {
    const v = byId(j.islands, b.dataset.jaislandout); if(!v) return;
    v.parentId = null; saveNow(); sound('click');
    toast(`${v.topicJapanese || v.topic} is its own island now.`); rerender(); });
  $$('[data-jaislanddel]', root).forEach(b => b.onclick = () => {
    const v = byId(j.islands, b.dataset.jaislanddel); if(!v) return;
    requestDelete({label: v.topicJapanese || v.topic, node: b.closest('.ja-island'), after: rerender,
      remove: () => { jaSubIslands(v.id).forEach(k => k.parentId = v.parentId || null);
        spliceOut(j.islands, w => w.id === v.id); saveNow(); }});
  });
  const del = one('#isDel');
  if(del) del.onclick = () => confirmDlg(
    `Throw <b>${esc(i.topic)}</b> away?${jaSubIslands(i.id).length
      ? ` The ${jaSubIslands(i.id).length} inside it are set adrift rather than thrown away with it.` : ''}`,
    () => { jaSubIslands(i.id).forEach(k => k.parentId = i.parentId || null);
      spliceOut(j.islands, w => w.id === i.id); saveNow(); sound('click');
      navigate(i.parentId ? '#/japanese/islands/' + i.parentId : '#/japanese/islands'); });
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
      /* A production card, so the cue has to be in a language you are not
         trying to produce: given the Japanese you would be recognising it,
         and recognising is not the skill an island needs. The English goes
         on the front; the phrase and how it is said go on the back. Where
         there is no English — an older chunk, or one written in a hurry —
         the reading is the next best cue, because producing a phrase from
         its sound is at least producing it. */
      front: c.meaning
        ? `Say this in Japanese:\n\n${c.meaning}`
        : `Write this out:\n\n${c.reading || c.japanese}`,
      back: `${c.japanese}${c.reading ? `\n${c.reading}` : ''}`,
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
    <div class="row" style="gap:10px;margin-top:8px">
      <label class="pd-q" style="flex:1"><span class="k">shelf</span>
        <select class="sel" id="stShelf">${JA_STONE_SHELVES.map(([k, name]) =>
          `<option value="${k}" ${(v ? v.shelf : shelf) === k ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
      <label class="pd-q" style="flex:1"><span class="k">voice</span>
        <select class="sel" id="stReg">${JA_STONE_REGISTERS.map(([k, name, jp, hint]) =>
          `<option value="${k}" ${(v ? v.register : 'either') === k ? 'selected' : ''}>${esc(name)} \u2014 ${esc(hint)}</option>`).join('')}</select></label>
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="stSave">Save</button></div>`, 'narrow sc-modal');
  m.querySelector('#stSave').onclick = () => {
    const text = m.querySelector('#stText').value.trim();
    if(!text){ m.querySelector('#stText').focus(); return; }
    const fields = {text, reading: m.querySelector('#stRead').value.trim(),
      note: m.querySelector('#stNote').value.trim(), shelf: m.querySelector('#stShelf').value,
      register: m.querySelector('#stReg').value};
    if(v) Object.assign(v, fields);
    else j.stones.push(Object.assign({id:uid(), order:j.stones.length}, fields));
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
