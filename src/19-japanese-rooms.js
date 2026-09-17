/* ============================================================
   THE OTHER FOUR ROOMS — grammar, vocabulary, writing, and the numbers.
   ============================================================ */

/* ---------- the ladder ----------
   Pienemann's stages, and the reason to draw them at all is the Teachability
   Hypothesis: a structure two rungs above where you are cannot be taught to
   you, however well it is explained. Knowing which rung you are on is
   therefore not idle self-assessment — it is what decides whether the next
   month is spent usefully. */
function jaLadderHTML(){
  const pt = jaState().pt;
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">The ladder</span>
      <button class="btn sm ghost" id="jaPtSet">where am I?</button></div>
    <p class="muted ja-note">You can only acquire what your processing can currently carry. Instruction aimed two rungs up is not difficult — it is wasted. So the useful question is not "what should I learn next" but "what am I ready for".</p>
    <div class="ja-ladder">${JA_PT_STAGES.slice().reverse().map(([n, name, eg, what]) => {
      const state = n < pt.current ? 'solid' : n === pt.current ? 'consolidating'
        : n === pt.reaching ? 'reaching' : 'ahead';
      return `<div class="ja-rung ja-r-${state}">
        <span class="ja-gate">⛩</span>
        <span class="ja-rung-b">
          <span class="ja-rung-h serif">Stage ${n} · ${esc(name)}</span>
          <span class="ja-rung-e ja-jp-inline">${esc(eg)}</span>
          <span class="ja-rung-w">${esc(what)}</span></span>
        <span class="ja-rung-s mono">${state === 'solid' ? 'solid' : state === 'consolidating' ? 'consolidating'
          : state === 'reaching' ? 'reaching for' : ''}</span>
      </div>`; }).join('')}</div>
    ${pt.lastAssessed ? `<div class="mono faint" style="font-size:.72rem">last asked ${esc(fmtDate(pt.lastAssessed, 'med'))}</div>` : ''}
  </div>`;
}
function openJaPt(){
  const pt = jaState().pt;
  const m = openModal(`<h2>Which rung</h2>
    <p class="muted ja-note">Consolidating is where most of your errors are. Reaching is the one above it — the only one instruction can currently help with.</p>
    <label class="pd-q"><span class="k">consolidating</span><select class="sel" id="ptCur">${JA_PT_STAGES.map(([n, name]) =>
      `<option value="${n}" ${pt.current === n ? 'selected' : ''}>${n} — ${esc(name)}</option>`).join('')}</select></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">reaching for</span><select class="sel" id="ptNext">${JA_PT_STAGES.map(([n, name]) =>
      `<option value="${n}" ${pt.reaching === n ? 'selected' : ''}>${n} — ${esc(name)}</option>`).join('')}</select></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="ptSave">Save</button></div>`, 'narrow ja-modal');
  m.querySelector('#ptSave').onclick = () => {
    pt.current = +m.querySelector('#ptCur').value;
    pt.reaching = +m.querySelector('#ptNext').value;
    pt.lastAssessed = today();
    saveNow(); m.remove(); sound('click'); rerender();
  };
  return m;
}

/* ---------- grammar points ----------
   A personal annotation layer rather than a reference. The value is not the
   explanation — there are a hundred of those — it is the count beside it of
   how many times this exact thing has tripped you in the last month. */
function jaGrammarHTML(){
  const list = jaState().grammar;
  const trouble = new Set(jaGrammarTrouble().map(g => g.id));
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Grammar points</span>
      <button class="btn sm primary" id="jaGramNew">＋ a point</button></div>
    <p class="muted ja-note">Only the ones you are actually working on, with your own notes on them. What makes this worth keeping is the error count: anything that has caught you three times in a month is not a note in a margin, it is next week.</p>
    ${list.length ? `<div class="ja-grams">${list.map(g => {
      const lv = JLPT.find(l => l[0] === g.jlptLevel) || JLPT[0];
      return `<div class="ja-gram${trouble.has(g.id) ? ' trouble' : ''}" data-jagram="${esc(g.id)}">
        <div class="row between" style="align-items:baseline">
          <span class="ja-gram-n ja-jp-inline">${esc(g.name)}</span>
          <span class="ja-lv" style="--c:${lv[1]}">${esc(g.jlptLevel)}</span></div>
        <div class="ja-gram-m mono">stage ${g.ptStage} · ${esc((JA_GRAMMAR_STATUS.find(s => s[0] === g.status) || [,''])[1].toLowerCase())}${
          g.errorCount ? ` · ${g.errorCount} error${g.errorCount === 1 ? '' : 's'}` : ''}</div>
        ${g.myNotes ? `<div class="ja-gram-notes">${linkify(g.myNotes)}</div>` : ''}
        ${trouble.has(g.id) ? '<div class="ja-trouble">a problem structure — give it a week</div>' : ''}
        <div class="ja-tools">
          <button class="tbtn" data-jagramedit="${esc(g.id)}">open</button>
          <button class="tbtn" data-jagramcard="${esc(g.id)}">make a card</button>
          <button class="del-x inline" data-jagramdel="${esc(g.id)}">×</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty">Nothing tracked yet. Add the one that keeps catching you.</div>'}
  </div>`;
}
function openJaGrammar(id){
  const j = jaState();
  const g = id ? byId(j.grammar, id) : {id:uid(), name:'', jlptLevel:'N5', ptStage:2,
    status:'studying', myNotes:'', examples:[], errorCount:0, lastErrorDate:null,
    linkedErrorIds:[], createdAt:new Date().toISOString()};
  const m = openModal(`<h2>${id ? 'The point' : 'A grammar point'}</h2>
    <label class="pd-q"><span class="k">what it is</span>
      <input class="inp serif-lg ja-jp-input" id="grName" value="${esc(g.name)}" autofocus placeholder="ている · ば conditional"></label>
    <div class="grid c3" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">level</span><select class="sel" id="grLv">${JLPT.map(([v]) =>
        `<option value="${v}" ${g.jlptLevel === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">rung</span><select class="sel" id="grPt">${JA_PT_STAGES.map(([n, name]) =>
        `<option value="${n}" ${g.ptStage === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">how it stands</span><select class="sel" id="grSt">${JA_GRAMMAR_STATUS.map(([v, n]) =>
        `<option value="${v}" ${g.status === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">your own notes</span>
      <textarea class="inp" rows="4" id="grNotes" placeholder="What confuses you about it. What finally made it click. The example you always think of.">${esc(g.myNotes)}</textarea></label>
    <label class="pd-q" style="margin-top:10px"><span class="k">a sentence with it in</span>
      <input class="inp ja-jp-input" id="grEg" value="${esc((g.examples || [])[0]?.japanese || '')}" placeholder="明日東京に行きます"></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">and what it means</span>
      <input class="inp" id="grEgEn" value="${esc((g.examples || [])[0]?.english || '')}"></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="grSave">Save</button></div>`, 'narrow ja-modal');
  m.querySelector('#grSave').onclick = () => {
    const name = m.querySelector('#grName').value.trim();
    if(!name){ m.querySelector('#grName').focus(); return; }
    const jp = m.querySelector('#grEg').value.trim(), en = m.querySelector('#grEgEn').value.trim();
    Object.assign(g, {name, jlptLevel:m.querySelector('#grLv').value, ptStage:+m.querySelector('#grPt').value,
      status:m.querySelector('#grSt').value, myNotes:m.querySelector('#grNotes').value,
      examples: jp ? [{japanese:jp, english:en, source:''}] : (g.examples || [])});
    if(!id) j.grammar.push(g);
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
/* A grammar point becomes a gap in one of its own sentences, which is the
   only card shape that asks whether you can use it rather than describe it. */
function jaGrammarCard(id){
  const g = byId(jaState().grammar, id); if(!g) return;
  const eg = (g.examples || [])[0];
  if(!eg || !eg.japanese){ toast('Write a sentence with it in first — a cloze needs somewhere to put the hole.'); return; }
  if(typeof suggestStudyCard !== 'function') return;
  suggestStudyCard({type:'cloze', sourceType:'grammar', sourceId:g.id,
    front: eg.japanese.includes('{{') ? eg.japanese : `${eg.japanese}\n\n(${eg.english || ''})`,
    clozeAnswer: g.name, back: g.myNotes || '',
    sourceLabel:`Grammar Journey — ${g.name}`, tags:['grammar', g.jlptLevel.toLowerCase()]});
  sound('success');
  toast('In the Study Deck inbox. Put {{ }} round the part to hide when you accept it.');
  rerender();
}

/* ---------- double translation ----------
   Lampariello's, and the delay is the whole mechanism: translate it out,
   wait until you have forgotten the Japanese, translate it back, and every
   place your version differs from the original is a gap you could not have
   found by reading. */
function jaTranslationsHTML(){
  const list = jaState().translations.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const T = today();
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Double translation</span>
      <button class="btn sm primary" id="jaTransNew">＋ a text</button></div>
    <p class="muted ja-note">Japanese out to English, then — a day later, once you have forgotten the words — English back to Japanese. Every place your reconstruction differs from the original is a gap you could not have found by reading it.</p>
    ${list.length ? `<div class="stack" style="gap:8px;margin-top:10px">${list.map(t => {
      const ready = t.status === 'awaiting_back_translation' && t.step1Date && t.step1Date < T;
      return `<div class="ja-trans ja-t-${esc(t.status)}">
        <div class="row between" style="align-items:baseline">
          <span class="serif">${esc(t.originalSource || 'a text')}</span>
          <span class="mono faint">${esc(fmtDate(t.step1Date, 'short'))}${
            t.status === 'completed' ? ' · done' : ready ? ' · ready' : ' · resting'}</span></div>
        <p class="ja-jp">${esc((t.originalJapanese || '').slice(0, 120))}${(t.originalJapanese || '').length > 120 ? '…' : ''}</p>
        ${t.status === 'completed' && (t.divergences || []).length
          ? `<div class="ja-div">${t.divergences.length} divergence${t.divergences.length === 1 ? '' : 's'} logged</div>` : ''}
        <div class="ja-tools">
          ${t.status === 'completed' ? `<button class="tbtn" data-jatranssee="${esc(t.id)}">compare</button>`
            : ready ? `<button class="tbtn" data-jatransback="${esc(t.id)}">translate it back</button>`
            : `<span class="mono faint">rest it until tomorrow — the delay is the point</span>`}
          <button class="del-x inline" data-jatransdel="${esc(t.id)}">×</button></div>
      </div>`; }).join('')}</div>`
      : '<div class="empty">Nothing in progress. Paste something a native wrote — a paragraph is plenty.</div>'}
  </div>`;
}

/* ---------- chunks ----------
   Lewis: what makes somebody sound fluent is mostly having the phrase ready,
   not assembling it. So nothing here is a single word — 決める is not a chunk,
   予定を決める is. */
function jaVocabHTML(){
  const j = jaState();
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Chunks, by topic</span>
      <button class="btn sm primary" id="jaChunkNew">＋ a chunk</button></div>
    <p class="muted ja-note">Not words — collocations, frames, whole utterances. 決める on its own is a dictionary entry; 予定を決める is something you can say. Harvest a topic's worth, drill them meaning-to-Japanese, then immediately use them in a talk on that topic.</p>
    <div class="ja-topics">${j.topics.map(t => { const n = jaTopicReady(t.id);
      const pct = n.total ? Math.round(n.ready / n.total * 100) : 0;
      return `<button class="ja-topic-card${S._jaTopic === t.id ? ' on' : ''}" data-jatopic="${esc(t.id)}">
        <span class="ja-topic-e">${esc(t.emoji)}</span>
        <span class="ja-topic-n">${esc(t.name)}</span>
        <span class="ja-topic-m mono">${n.ready}/${n.total}</span>
        <span class="ja-topic-bar"><i style="width:${pct}%"></i></span>
      </button>`; }).join('')}</div>
    ${S._jaTopic ? (() => { const cs = jaChunksFor(S._jaTopic);
      return `<div class="ja-chunks">${cs.length ? cs.map(c => `
        <div class="ja-chunk${c.productionReady ? ' ready' : ''}" data-jachunk="${esc(c.id)}">
          ${c.reading ? `<span class="ja-reading">${esc(c.reading)}</span>` : ''}
          <span class="ja-chunk-j ja-jp-inline">${esc(c.japanese)}</span>
          <span class="ja-chunk-m">${esc(c.meaning)}</span>
          ${c.exampleSentence ? `<span class="ja-chunk-e ja-jp-inline">${esc(c.exampleSentence)}</span>` : ''}
          <div class="ja-tools">
            <button class="tbtn" data-jachunkready="${esc(c.id)}">${c.productionReady ? 'still passive' : 'production-ready'}</button>
            ${c.sentToStudyDeck ? '' : `<button class="tbtn" data-jachunkcard="${esc(c.id)}">make cards</button>`}
            <button class="del-x inline" data-jachunkdel="${esc(c.id)}">×</button></div>
        </div>`).join('') : '<div class="empty">Nothing in this topic yet.</div>'}</div>`; })() : ''}
  </div>`;
}
/* A chunk is worth three cards rather than one, and the specification is right
   about why: retrieval alone is the shallow end. Using it in a sentence about
   your own weekend, and telling it from the chunk that nearly means the same
   thing, are where it actually sticks. */
function jaChunkCards(id){
  const c = byId(jaState().chunks, id); if(!c || typeof studyMakeFamily !== 'function') return;
  const base = {type:'production', sourceType:'vocab', sourceId:c.id,
    front:`Say in Japanese:\n\n"${c.meaning}"`, back:`${c.japanese}${c.reading ? `\n(${c.reading})` : ''}${
      c.exampleSentence ? `\n\n${c.exampleSentence}` : ''}`,
    sourceLabel:`Vocabulary Lab — ${c.japanese}`, tags:['japanese', 'chunk']};
  const made = studyMakeFamily(base);
  made.forEach(x => { x.status = 'inbox'; });
  c.sentToStudyDeck = true;
  saveNow(); sound('success');
  toast(`${made.length} cards waiting in the Study Deck — recall, use it, and tell it from its neighbour.`);
  rerender();
}

/* ---------- writing ----------
   Flower and Hayes: plan, translate, review, and the middle one is where an
   L2 writer's attention all goes. So the plan is written in English on
   purpose — thinking and encoding at once is what makes the sentences short. */
function jaWritingHTML(){
  const list = jaState().writing.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `<div class="ja-sec">
    <div class="row between" style="align-items:baseline">
      <span class="sc" style="margin:0">Writing</span>
      <button class="btn sm primary" id="jaWriteNew">＋ a piece</button></div>
    <p class="muted ja-note">Plan in English, write in Japanese, then mark yourself on three things separately. They are separate because they trade against each other: push the complexity and the accuracy dips, which is not going backwards — it is stretching.</p>
    ${list.length ? `<div class="stack" style="gap:8px;margin-top:10px">${list.map(w => `
      <div class="ja-write">
        <div class="row between" style="align-items:baseline">
          <span class="serif">${esc(w.topic || 'untitled')}</span>
          <span class="mono faint">${esc(fmtDate(w.date, 'short'))} · ${w.wordCount || 0} chars${
            w.correctedText ? ' · corrected' : ''}</span></div>
        <p class="ja-jp">${esc((w.japaneseText || '').slice(0, 140))}${(w.japaneseText || '').length > 140 ? '…' : ''}</p>
        <div class="ja-caf">${[['complexity','Complexity'],['accuracy','Accuracy'],['fluency','Fluency']].map(([k, n]) =>
          `<span class="ja-caf-g"><em>${esc(n)}</em><b>${'●'.repeat(+w.selfAssessment?.[k] || 0)}${'○'.repeat(5 - (+w.selfAssessment?.[k] || 0))}</b></span>`).join('')}</div>
        <div class="ja-tools">
          <button class="tbtn" data-jawriteedit="${esc(w.id)}">open</button>
          <button class="del-x inline" data-jawritedel="${esc(w.id)}">×</button></div>
      </div>`).join('')}</div>`
      : '<div class="empty">Nothing written yet.</div>'}
  </div>`;
}

/* ---------- the numbers ----------
   Complexity, accuracy and fluency, which is the only honest frame for this:
   Skehan's trade-off says they compete for the same attention, so a month
   where complexity climbed and accuracy dipped is a good month, and a chart
   that showed only accuracy would call it a bad one. */
function jaProgressHTML(){
  const j = jaState();
  const T = today(), from = addDays(T, -90);
  const wpm = jaWpmSeries();
  const mid = jaMidClauseShare(from, T);
  const mix = jaPartnerMix(4);
  const play = jaPlayMix(from, T);
  const rate = jaErrorRate(from, T);
  const top = jaTopPatterns(addDays(T, -30), T);
  const strands = jaStrandsLatest();
  const bySeason = [90, 60, 30].map(d => ({d, v: jaMidClauseShare(addDays(T, -d), addDays(T, -d + 30))}))
    .filter(x => x.v != null);
  return `<div class="grid c2" style="gap:16px">
    <div class="card no-tilt span2">
      <div class="k">Speed, over time</div>
      ${wpm.length > 1 ? `<div class="ja-spark">${sparkline(wpm.map(x => x.wpm), {h:70, color:'var(--slate,#6b7d8e)', dots:true})}</div>
        <div class="mono faint" style="font-size:.72rem">${esc(fmtDate(wpm[0].date, 'short'))} — ${esc(fmtDate(wpm[wpm.length - 1].date, 'short'))} · ${wpm[0].wpm} → ${wpm[wpm.length - 1].wpm} words a minute</div>`
        : '<div class="empty sm">Two sessions with a word count and this becomes a line.</div>'}
    </div>

    <!-- The one worth watching. Where the silences fall says whether the
         grammar is still being assembled while you talk. -->
    <div class="card no-tilt span2">
      <div class="k">Where the pauses fall</div>
      <p class="muted" style="font-size:.82rem">Native speakers pause between clauses, to plan the next one. Learners pause inside them, because the sentence is still being built. Watching the red shrink is watching the grammar become automatic — and it is the single strongest predictor there is.</p>
      ${mid == null ? '<div class="empty sm">Log the pause location on a session or two.</div>'
        : `<div class="ja-pauseline"><i class="mid" style="width:${Math.round(mid * 100)}%"></i><i class="bnd" style="width:${Math.round((1 - mid) * 100)}%"></i></div>
           <div class="row between mono" style="font-size:.72rem"><span>${Math.round(mid * 100)}% mid-clause</span><span>${Math.round((1 - mid) * 100)}% at boundaries</span></div>
           ${bySeason.length > 1 ? `<div class="ja-pausehist">${bySeason.map(x => `
             <div class="ja-ph-row"><span class="mono">${x.d} days ago</span>
               <span class="ja-pauseline sm"><i class="mid" style="width:${Math.round(x.v * 100)}%"></i><i class="bnd" style="width:${Math.round((1 - x.v) * 100)}%"></i></span></div>`).join('')}</div>` : ''}`}
    </div>

    <div class="card no-tilt">
      <div class="k">This quarter</div>
      <div class="ja-nums">
        <div><b>${jaIn(j.sessions, from, T).length}</b><span>sessions</span></div>
        <div><b>${jaHours(from, T)}</b><span>hours</span></div>
        <div><b>${mix.ai}/${mix.human}</b><span>AI / human</span></div>
        <div><b>${play.practice}/${play.play}</b><span>practice / play</span></div>
      </div>
      ${rate != null ? `<div class="mono faint" style="font-size:.74rem;margin-top:6px">${rate.toFixed(1)} errors logged per session</div>` : ''}
      ${jaAiWarning() ? `<div class="ja-warn sm">Mostly machines lately. A machine cannot hear your pitch accent and will teach you a register only machines enjoy.</div>` : ''}
    </div>

    <div class="card no-tilt">
      <div class="k">The four strands</div>
      ${strands ? `<div class="ja-strands sm">${JA_STRANDS.map(([k, name]) => { const v = +strands[k] || 0;
        const bad = (k === 'study' && v > 30) || (k === 'fluency' && v < 20);
        return `<div class="ja-strand${bad ? ' off' : ''}"><span class="ja-strand-n">${esc(name)}</span>
          <span class="bar" style="--c:${bad ? '#c98b7a' : 'var(--sage)'}"><i style="width:${clamp(v, 0, 100)}%"></i></span>
          <span class="mono">${v}%</span></div>`; }).join('')}</div>`
        : '<div class="empty sm">Not assessed yet.</div>'}
    </div>

    <div class="card no-tilt">
      <div class="k">The ladder</div>
      <div class="ja-ptmini">${JA_PT_STAGES.slice().reverse().map(([n, name]) => `
        <div class="ja-ptm ${n < j.pt.current ? 'solid' : n === j.pt.current ? 'cur' : n === j.pt.reaching ? 'next' : ''}">
          <span class="mono">${n}</span> ${esc(name)}</div>`).join('')}</div>
    </div>

    <div class="card no-tilt">
      <div class="k">Islands, scenarios, patterns</div>
      <div class="ja-prog-row"><span>Islands at automatic</span>
        <span class="bar" style="--c:var(--sage)"><i style="width:${j.islands.length ? Math.round(jaAutomatic() / j.islands.length * 100) : 0}%"></i></span>
        <span class="mono">${jaAutomatic()}/${j.islands.length}</span></div>
      <div class="ja-prog-row"><span>Scenarios run</span>
        <span class="bar" style="--c:var(--terra)"><i style="width:${j.scenarios.length ? Math.round(j.scenarios.filter(s => s.times > 0).length / j.scenarios.length * 100) : 0}%"></i></span>
        <span class="mono">${j.scenarios.filter(s => s.times > 0).length}/${j.scenarios.length}</span></div>
      ${top.length ? `<div class="ja-top sm"><span class="k mono">this month</span>${top.map(([k, n]) =>
        `<span class="ja-pat">${esc(k)} <b>${n}</b></span>`).join('')}</div>` : ''}
    </div>
  </div>`;
}
