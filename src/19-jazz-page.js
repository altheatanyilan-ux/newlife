/* ============================================================
   THE JAZZ STUDIO — the room.

   Three views and one idea. The roadmap says where you are; an exercise is
   one pattern and its twelve keys; the flashcards deal you a pattern and a
   key and ask you to play it before showing you the answer.

   The engraving is its own, deliberately. The score room holds exactly one
   rendered score at a time in a module variable, because a score room shows
   one score. Here a flashcard and an exercise can both want the engraver,
   and a page that fights another page for a global is a page that draws the
   wrong thing once in twenty. So this asks the engraver for a fresh view
   over its own node and keeps nothing.
   ============================================================ */

function jazzUi(){ return S._jazz = S._jazz || {stageId:null, exId:null, key:'C',
  interval:'major3rd', flash:null, tab:'road'}; }

/* A clock this room started is this room's to stop. Leaving by any door —
   the sidebar, a search result, the back button — has to close it, because a
   timer still running in a room you have left is an hour of piano practice
   that was actually an hour of something else. Bound once, rather than
   remembered at every exit. */
addEventListener('hashchange', () => {
  if(typeof parseHash !== 'function') return;
  if(parseHash().name === 'jazz') return;
  const ui = S && S._jazz;
  if(ui) ui.flash = null;
  try { if(typeof timeAutoStop === 'function') timeAutoStop('jazz'); } catch(e){}
});

/* ---------- drawing a generated score ----------
   Everything here is written by the generator moments before it is drawn, so
   there is no file to fail to read and no version of it to be stale. What
   can still fail is the engraver, so it says so in words rather than leaving
   an empty box. */
async function jazzEngrave(box, xml){
  if(!box) return null;
  if(!osmdBuiltIn()){
    box.innerHTML = '<div class="jz-noscore">The engraver is not built into this copy, so the notation cannot be drawn. The words are all still here.</div>';
    return null;
  }
  try {
    const lib = await osmdBoot();
    const osmd = new lib.OpenSheetMusicDisplay(box, {autoResize:false, backend:'svg',
      drawTitle:false, drawComposer:false, drawCredits:false, drawPartNames:false,
      drawMeasureNumbers:false, drawingParameters:'compact'});
    const rules = osmd.EngravingRules || osmd.rules;
    if(rules){ rules.RenderChordSymbols = true;
      /* the same reason as the score room: a bar with nothing in it is what
         the engraver's span code cannot survive */
      try { rules.FillEmptyMeasuresWithWholeRest = 2; } catch(e){} }
    await osmd.load(xml);
    osmd.zoom = 1.05;
    osmd.render();
    jazzPlayBarFor(box, xml, osmd);
    return osmd;
  } catch(e){
    console.warn('the jazz engraver could not draw that', e);
    box.innerHTML = `<div class="jz-noscore">That could not be drawn — ${esc(e.message)}</div>`;
    return null;
  }
}

/* ▶ over every score the room draws — the exercise in whatever key it is
   in, each example of a multi-example page, a flashcard's answer — played by
   the same player as the score room's. Jazz is swung, and a practice tempo
   rather than a performance one is where a page that marks none starts. */
const jazzPlayStore = {get: () => jazzState().playback || {},
  set: v => { jazzState().playback = v; saveNow(); }};
function jazzPlayBarFor(box, xml, osmd){
  if(!box || typeof scorePlayBarBefore !== 'function') return null;
  try {
    return scorePlayBarBefore(box.closest('.jz-stage-box') || box,
      {xml: () => xml, osmd: () => osmd, host: box, swing: true, defaultBpm: 80, store: jazzPlayStore});
  } catch(e){ console.warn('the player could not attach', e); return null; }
}

/* ---------- the route ---------- */
routes.jazz = function(root, params){
  jazzState();
  if(typeof grandPianoWarm === 'function') grandPianoWarm();
  const ui = jazzUi();
  const want = params && params[0] ? params[0] : null;
  if(want === 'cards'){
    /* Section 4A's three lead-sheet modes sit beside the twelve-key deck */
    const mode = params && params[1];
    if(mode && /^[ABC]$/.test(mode)){ root.innerHTML = `<div class="page jz-page">${jazzLeadCardsHTML(mode)}</div>`;
      bindJazzLeadCards(root, mode); return; }
    root.innerHTML = `<div class="page jz-page">${jazzFlashHTML()}</div>`;
    bindJazzFlash(root); return; }
  /* the practice room: what to do today, what you are doing, and where it
     has got you. Three addresses rather than three tabs, so the browser's
     own Back works between them. */
  if(want === 'plan'){ root.innerHTML = `<div class="page jz-page">${jazzPlanHTML()}</div>`;
    bindJazzPlan(root); return; }
  if(want === 'session'){ root.innerHTML = `<div class="page jz-page">${jazzSessionHTML()}</div>`;
    bindJazzSession(root); return; }
  if(want === 'progress'){ root.innerHTML = `<div class="page jz-page">${jazzProgressHTML()}</div>`;
    bindJazzPlan(root); return; }
  if(want === 'listen'){
    const ls = jazzListenState();
    if(params && params[1]) ls.detailId = params[1];
    root.innerHTML = `<div class="page jz-page">${jazzListenHTML()}</div>`;
    bindJazzListen(root); return;
  }
  if(want === 'improv'){
    const is = jazzImprovState();
    if(params && params[1]) is.detailId = params[1];
    root.innerHTML = `<div class="page jz-page">${jazzImprovHTML()}</div>`;
    bindJazzImprov(root); return;
  }
  /* Curriculum v3's rooms: the document about itself, the tune database's
     five modules, and the Section 4 features. Each is its own address so
     Back works between them. A room whose file is missing says so rather
     than drawing a blank page. */
  const v3Rooms = {
    about: ['jazzAboutHTML', 'bindJazzAbout'],
    tunes: ['jazzTunesHTML', 'bindJazzTunes'], tune: ['jazzTuneHTML', 'bindJazzTune'],
    repertoire: ['jazzRepertoireHTML', 'bindJazzRepertoire'], analysis: ['jazzAnalysisHTML', 'bindJazzAnalysis'],
    playalong: ['jazzPlayAlongHTML', 'bindJazzPlayAlong'], record: ['jazzRecordHTML', 'bindJazzRecord'],
    audiation: ['jazzAudiationHTML', 'bindJazzAudiation'], mindset: ['jazzMindsetHTML', 'bindJazzMindset'],
    journal: ['jazzJournalHTML', 'bindJazzJournal']};
  if(want && v3Rooms[want]){
    const [draw, bind] = v3Rooms[want];
    const rest = (params || []).slice(1);
    root.innerHTML = `<div class="page jz-page">${typeof window[draw] === 'function'
      ? window[draw](...rest) : '<div class="empty">This room is not in this copy.</div>'}</div>`;
    try { if(typeof window[bind] === 'function') window[bind](root, ...rest); } catch(e){ console.warn('jazz room did not bind', want, e); }
    return;
  }
  if(want === 'units'){
    const activeUnitId = (params && params[1]) ? params[1] : (jazzUi()._unitId || null);
    root.innerHTML = `<div class="page jz-page">${jazzUnitsHTML(activeUnitId)}</div>`;
    bindJazzUnits(root); return;
  }
  /* The address decides which of the two views this is, and nothing else.
     It used to only ever SET the open exercise from the address and never
     clear it, so #/jazz with no exercise in it fell through to whichever one
     had been open last \u2014 and the browser's own Back button, which lands on
     #/jazz, showed you the exercise you had just left instead of the
     roadmap. Remembering is for things the address does not say. */
  ui.exId = (want && jazzExercise(want)) ? want : null;
  if(ui.exId){
    root.innerHTML = `<div class="page jz-page">${jazzExerciseHTML(ui.exId)}</div>`;
    bindJazzExercise(root, ui.exId);
    return;
  }
  root.innerHTML = `<div class="page jz-page">${jazzRoadHTML()}</div>`;
  bindJazzRoad(root);
  if(ui.scrollTo){ const el = root.querySelector(`[data-jzstage="${ui.scrollTo}"]`); ui.scrollTo = null;
    if(el) setTimeout(() => el.scrollIntoView({block: 'start', behavior: 'smooth'}), 60); }
};

/* ---------- the layer a textbook leaves out ----------
   One renderer for both the stage and the exercise, because a record is a
   record wherever it is cited, and two versions of this markup would drift
   apart the first time one of them was corrected. */
function jazzListeningHTML(list, fromStage){
  if(!list || !list.length) return '';
  return `<div class="jz-note jz-listen"><span class="sc">What to listen to${
    fromStage ? ' <em class="jz-inherit" title="this belongs to the stage rather than to this exercise">for the stage</em>' : ''}</span>
    ${list.map(a => `<div class="jz-rec">
      <div class="jz-recwho"><b>${esc(a.artist)}</b> \u2014 <i>${esc(a.track)}</i></div>
      <div class="jz-recwhat mono">${esc(a.album || '')}${a.year ? ` \u00b7 ${a.year}` : ''}${
        a.label ? ` \u00b7 ${esc(a.label)}` : ''}${a.timestamp ? ` \u00b7 ${esc(a.timestamp)}` : ''}</div>
      <p class="jz-recfor">${esc(a.listenFor || '')}</p></div>`).join('')}</div>`;
}
function jazzMistakesHTML(list, fromStage){
  if(!list || !list.length) return '';
  return `<div class="jz-note jz-mistakes"><span class="sc">What goes wrong${
    fromStage ? ' <em class="jz-inherit" title="this belongs to the stage rather than to this exercise">at this stage</em>' : ''}</span>
    <ul>${list.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>`;
}
/* Said where it will be read — above the notation rather than in a footnote
   at the bottom of a column somebody has already scrolled past. */
function jazzAccuracyHTML(ex){
  if(!ex || jazzTrusted(ex)) return '';
  const a = jazzAccuracy(ex);
  return `<div class="jz-doubt" data-jzacc="${esc(ex.acc)}">
    <span class="jz-doubti" aria-hidden="true">${a.tone === 'bad' ? '\u26a0' : '\u203c'}</span>
    <div><b>${a.tone === 'bad' ? 'These notes have not been verified' : 'These notes are approximate'}</b>
      <p>${esc(a.said)}${ex.source ? ` \u2014 ${esc(ex.source)}` : ''}</p></div></div>`;
}
/* The citation, with the page range and what to look for on it, and a button
   that puts the whole thing on the clipboard — because the moment anybody
   actually uses this they are writing it into a notebook or a message. */
function jazzReferenceHTML(ex){
  const r = ex && ex.ref;
  if(!r) return '';
  const where = [r.chapter, r.pageNumbers].filter(x => x && x !== '\u2014').join(', ');
  return `<div class="jz-ref">
    <div class="jz-refhead">
      <span class="jz-refi" aria-hidden="true">\u{1f4d6}</span>
      <span><b>${esc(r.bookFull)}</b>${where ? `<span class="mono jz-refwhere">${esc(where)}</span>` : ''}</span>
      <button class="tbtn" data-jzcite="${esc(jazzCitation(r))}" title="copy the citation">copy</button>
    </div>
    ${r.description ? `<p class="jz-refwhat">${esc(r.description)}</p>` : ''}</div>`;
}
const jazzDifficultyHTML = d => !d ? '' :
  `<span class="jz-diff" data-jzd="${esc(d)}" title="how hard this stage is">${esc(d)}</span>`;

/* ---------- the roadmap ---------- */
/* the Voice Track, which has its own view (Curriculum v3 gives it six levels) */
const JAZZ_VOICE_STAGES = typeof JAZZ_V3_VOICE === 'object' ? JAZZ_V3_VOICE : ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
const jazzRoadView = () => jazzUi().roadView || 'piano';
const jazzStageCollapsed = id => !!(jazzState().settings.collapsed || {})[String(id)];
function jazzToggleCollapse(id){
  const st = jazzState().settings;
  if(!st.collapsed) st.collapsed = {};
  const k = String(id);
  st.collapsed[k] = !st.collapsed[k];
  saveNow();
}

function jazzRoadHTML(){
  const now = jazzNowStage();
  const ladder = jazzStages();
  const view = jazzRoadView();
  const isVoice = view === 'voice';
  const shown = ladder.filter(s => isVoice
    ? JAZZ_VOICE_STAGES.includes(String(s.id))
    : !JAZZ_VOICE_STAGES.includes(String(s.id)));
  const all = ladder.map(s => jazzStageGot(s));
  const done = sum(all.map(g => g.done)), of = sum(all.map(g => g.of));
  return `<h1 class="serif">Jazz Studio</h1>
    <p class="page-blurb">Thirteen stages, from the twelve distances to where the studying stops —
      patterns in all twelve keys until the hands go there without being asked.
      ${done} of ${of} are yours.</p>
    ${jazzStageHeadHTML(jazzActiveStage())}
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <button class="btn primary" id="jzPlanGo">\u{1f4cb} Today’s practice</button>
      <button class="btn sm ghost" id="jzCards">\u{1f3af} Flashcards</button>
      <button class="btn sm ghost" id="jzHistory">\u{1f4ca} What you have practised</button>
      <span class="grow"></span>
      <label class="jz-gate mono"><input type="checkbox" id="jzGate" ${jazzGated() ? 'checked' : ''}>
        one stage at a time</label>
    </div>
    <div class="row jz-tools" style="gap:6px;flex-wrap:wrap;margin-bottom:16px">
      <button class="tbtn" data-jzgo="#/jazz/tunes">\u{1f4da} Tune library</button>
      <button class="tbtn" data-jzgo="#/jazz/repertoire">\u{1f3b5} Repertoire</button>
      <button class="tbtn" data-jzgo="#/jazz/analysis">\u{1f50e} Harmonic analysis</button>
      <button class="tbtn" data-jzgo="#/jazz/playalong">\u{1f941} Play-along</button>
      <button class="tbtn" data-jzgo="#/jazz/listen">\u{1f3a7} Listening</button>
      <button class="tbtn" data-jzgo="#/jazz/record">\u{1f399}️ Record</button>
      <button class="tbtn" data-jzgo="#/jazz/journal">\u{1f4d3} Journal</button>
      <button class="tbtn" data-jzgo="#/jazz/audiation">\u{1f442} Audiation</button>
      <button class="tbtn" data-jzgo="#/jazz/mindset">\u{1f9d8} Mindset</button>
      <button class="tbtn" data-jzgo="#/jazz/improv">\u{1f3bc} Improvisation</button>
      <button class="tbtn" data-jzgo="#/jazz/units">\u{1f4cb} Units</button>
      <button class="tbtn" id="jzAllTips">\u{1f3c6} Practice tips</button>
      <button class="tbtn" data-jzgo="#/jazz/about">ℹ️ About v3</button>
    </div>
    ${jazzTrackToggleHTML()}
    <div class="jz-view-tabs" role="tablist">
      <button class="jz-view-tab${!isVoice ? ' on' : ''}" data-jzview="piano" role="tab"
        aria-selected="${!isVoice}">Piano</button>
      <button class="jz-view-tab${isVoice ? ' on' : ''}" data-jzview="voice" role="tab"
        aria-selected="${isVoice}">\u{1f3a4} Voice</button>
    </div>
    ${isVoice ? `<p class="jz-view-blurb">${esc(((JAZZ_V3_DOC.overview || {}).V || {paras: ['']}).paras[0])}
      V1 opens after Stage 1.</p>` : ''}
    <div class="jz-road">${shown.map(s => jazzStageHTML(s, s.id === now.id)).join('')}</div>`;
}
function jazzStageHTML(s, here){
  const got = jazzStageGot(s);
  const open = jazzStageOpen(s);
  const collapsed = open && jazzStageCollapsed(s.id);
  /* run ahead if you like — it just says so */
  const ahead = open && !jazzStageReached(s);
  const pct = got.of ? Math.round(got.done / got.of * 100) : 0;
  const num = s.n === 'DT' ? 'DT' : s.n;
  /* the fast track shows the essential exercises and hides (not removes)
     the rest; the stage you are on lists its essentials first */
  const fast = jazzTrack() === 'fast-track' && JAZZ_TIER_MAIN.includes(String(s.id));
  const fp = jazzFastProgress(s.id);
  const showAll = !!(jazzUi().showAll || {})[s.id];
  const current = String((jazzActiveStage() || {}).id) === String(s.id);
  const sortMode = ((jazzState().settings.stageSort || {})[s.id]) || (current ? 'tier' : 'doc');
  let rowIds = fast && !showAll ? s.subs.filter(id => jazzTierOf(id) === 'fast-track') : s.subs.slice();
  if(sortMode === 'tier') rowIds = jazzTierSorted(rowIds);
  const hidden = s.subs.length - rowIds.length;
  return `<section class="jz-stage${open ? '' : ' shut'}${here ? ' here' : ''}${
    collapsed ? ' collapsed' : ''}${s.track ? ' jz-track' : ''}" data-jzstage="${esc(s.id)}">
    <header class="jz-shead" data-jztoggle="${esc(s.id)}"
      title="${collapsed ? 'Expand this stage' : 'Collapse this stage'}" style="cursor:pointer">
      <span class="jz-sn mono">${esc(String(num))}</span>
      <span class="jz-st"><b class="serif">${esc(s.name)}</b>
        ${s.subtitle ? `<span class="jz-ssub">${esc(s.subtitle)}</span>` : ''}
        <span class="faint">${esc(s.blurb)}</span></span>
      ${jazzDifficultyHTML(s.expectedDifficulty)}
      <span class="mono jz-scount">${open ? (fast ? `${fp.done}/${fp.of} essential` : `${got.done}/${got.of}`) : '\u{1f512}'}${
        s.outcome ? `<em class="jz-weeks" title="how long the v3 plan gives this stage">${esc(fast ? jazzHalfTime(s.outcome.time) : s.outcome.time)}</em>` : ''}${
        ahead ? '<em class="jz-ahead" title="the stage before this one is not finished">ahead</em>' : ''}
        <span class="jz-toggle-arrow" aria-hidden="true">${collapsed ? '▶' : '▼'}</span></span>
    </header>
    <div class="jz-sbar"><i style="width:${pct}%"></i></div>
    ${open && !collapsed ? `${jazzV3GoldenHTML(s)}
      <div class="jz-subsbar mono">${fast ? `<span>Fast track · ${fp.done} of ${fp.of} fast-track exercises mastered</span>
          <button class="tbtn" data-jzshowall="${esc(s.id)}">${showAll ? 'only the essentials' : hidden ? `show all (${hidden} more)` : ''}</button>` : ''}
        <span class="grow"></span>
        <span class="jz-sortpick">${[['tier', 'by tier'], ['doc', 'curriculum order']].map(([k, l]) =>
          `<button class="tbtn${sortMode === k ? ' on' : ''}" data-jzsort="${esc(s.id)}" data-v="${k}">${l}</button>`).join('')}</span></div>
      <div class="jz-subs">${rowIds.map(id => {
      const ex = jazzExercise(id); if(!ex) return '';
      const single = jazzIsSingle(id);
      const r = jazzRecord(id);
      return `<button class="jz-sub${ex.isV3 ? ' jz-subv3' : ''}" data-jzopen="${esc(id)}">
        <span class="jz-subn mono">${esc(jazzV3Label(ex))}</span>
        <span class="jz-subt">${jazzV3TypePill(ex, true)} ${jazzTierBadgeHTML(id, true)} ${esc(ex.name)}${
          jazzHasScore(ex) ? '' : '<span class="jz-nodraw mono">no notation</span>'}${
          jazzTrusted(ex) ? '' : `<span class="jz-nodraw mono jz-unver" title="${
            esc(jazzAccuracy(ex).said)}">${esc(jazzAccuracy(ex).short)} notes</span>`}${
          jazzEdited(id) ? '<span class="jz-editpill mono" title="you have edited this score">✏️ edited</span>' : ''}${
          jazzV3ConflictPillHTML(id)}</span>
        ${single ? `<span class="jz-keys jz-one"><i class="${r.done ? 'on' : ''}" title="${r.done ? 'done' : 'not yet'}"></i></span>
          <span class="mono jz-subc">${r.done ? 'done' : 'read'}</span>`
        : `<span class="jz-keys">${JAZZ_KEY_NAMES.map(k =>
          `<i class="${r.keys[k] ? 'on' : ''}" title="${esc(jazzPretty(k))}"></i>`).join('')}</span>
        <span class="mono jz-subc">${jazzKeysGot(id)}/12</span>`}</button>`; }).join('')}</div>
      <details class="jz-why"><summary><span class="mono">why this stage</span></summary>
        ${jazzV3OutcomeHTML(s)}
        ${jazzV3ParasHTML(s.theory, 'serif')}
        ${s.intro ? `<p class="serif">${esc(s.intro)}</p>` : ''}
        ${s.sources ? `<p class="jz-src mono">Sources: ${esc(s.sources)}</p>` : ''}
        ${s.beside ? `<p class="jz-src mono">Runs beside piano Stage ${esc(s.beside.join('–'))}.</p>` : ''}
        ${jazzV3ThreadsHTML(s)}
        <div class="jz-werner"><span class="jz-wi">\u{1f9d8}</span>
          <p>${esc(s.werner)}</p>
          <p class="jz-wm">${esc(s.mindset)}</p></div>
        ${jazzV3AudiationHTML(s)}
        ${s.historicalContext ? `<div class="jz-note"><span class="sc">Where this came from</span>
          ${jazzV3ParasHTML(s.historicalContext, 'serif')}</div>` : ''}
        ${typeof jazzStageBandHTML === 'function' ? jazzStageBandHTML(s.id) : ''}
        ${s.typicalTimeToMaster ? `<div class="jz-note jz-howlong"><span class="sc">How long this honestly takes</span>
          ${jazzV3ParasHTML(s.typicalTimeToMaster)}</div>` : ''}
        ${jazzMistakesHTML(s.commonMistakes)}
        ${jazzListeningHTML(s.listeningAssignments)}
        ${jazzV3CarriedHTML(s)}
      </details>`
    : (!open ? `<p class="jz-shut mono">Shut until ${esc((jazzStage(s.needs) || {}).name || 'the stage before it')} is finished.</p>` : '')}
  </section>`;
}
function bindJazzRoad(root){
  bindJazzPlan(root);
  bindJazzTips(root);
  $$('[data-jzgo]', root).forEach(b => b.onclick = ev => { ev.stopPropagation(); navigate(b.dataset.jzgo); });
  /* the "differs" pill sits inside a row that is itself a button to its own
     exercise; it goes to the other side of the disagreement instead */
  $$('.jzv3-diff[data-jzopen]', root).forEach(b => b.onclick = ev => {
    ev.stopPropagation(); ev.preventDefault(); navigate('#/jazz/' + b.dataset.jzopen); });
  $$('button[data-jzopen]', root).forEach(b => b.onclick = () => {
    jazzUi().exId = b.dataset.jzopen; navigate('#/jazz/' + b.dataset.jzopen); });
  const cards = root.querySelector('#jzCards');
  if(cards) cards.onclick = () => navigate('#/jazz/cards');
  const hist = root.querySelector('#jzHistory');
  if(hist) hist.onclick = () => openJazzHistory();
  const gate = root.querySelector('#jzGate');
  if(gate) gate.onchange = () => { jazzState().settings.gate = gate.checked;
    saveNow(); sound('click'); rerender(); };
  $$('[data-jztoggle]', root).forEach(h => h.onclick = ev => {
    if(ev.target.closest('[data-jzopen]')) return;
    jazzToggleCollapse(h.dataset.jztoggle);
    sound('click');
    rerender();
  });
  $$('[data-jzview]', root).forEach(b => b.onclick = () => {
    jazzUi().roadView = b.dataset.jzview;
    sound('click');
    rerender();
  });
  $$('[data-jzshowall]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const u = jazzUi(); u.showAll = u.showAll || {}; u.showAll[b.dataset.jzshowall] = !u.showAll[b.dataset.jzshowall]; rerender(); });
  $$('[data-jzsort]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const st = jazzState().settings; st.stageSort = st.stageSort || {}; st.stageSort[b.dataset.jzsort] = b.dataset.v;
    saveNow(); rerender(); });
}
/* "~6 weeks" on the fast track */
const jazzHalfTime = t => String(t || '').replace(/(\d+)\s*weeks?/, (m, n) => `${Math.max(1, Math.round(+n / 2))} weeks on the fast track`);
/* Section 3A: the track, at the top of the roadmap and the plan */
function jazzTrackToggleHTML(){
  const t = jazzTrack();
  return `<div class="jz-trackpick" role="tablist" aria-label="Which path">
    <button class="${t === 'full' ? 'on' : ''}" data-jztrack="full" role="tab" aria-selected="${t === 'full'}">Full Curriculum</button>
    <button class="${t === 'fast-track' ? 'on' : ''}" data-jztrack="fast-track" role="tab" aria-selected="${t === 'fast-track'}">Fast Track</button>
    <span class="mono faint">${t === 'fast-track' ? 'the essential exercises only, in about half the time — the rest is hidden, not removed'
      : 'every exercise: core and enrichment'}</span></div>`;
}
function bindJazzTrackToggle(root){
  $$('[data-jztrack]', root).forEach(b => b.onclick = () => { jazzSetTrack(b.dataset.jztrack); sound('click'); rerender(); });
}

/* ---------- one exercise ---------- */
function jazzExerciseHTML(id){
  const ex = jazzExercise(id), at = jazzSubOf(id);
  const r = jazzRecord(id);
  const ui = jazzUi();
  const key = JAZZ_KEY_NAMES.includes(ui.key) ? ui.key : 'C';
  const got = jazzKeysGot(id);
  const single = jazzIsSingle(id);
  const draws = jazzHasScore(ex);
  /* a theory page with no notation is read, not played in a key */
  const keyed = draws || !single;
  const readsHere = !draws && !!((ex.v3 && ex.v3.theory) || ex.theory);
  return `<div class="row between" style="align-items:baseline;gap:10px;flex-wrap:wrap">
      <button class="btn sm ghost" id="jzBack">← the roadmap</button>
      <span class="mono faint">${at ? `${esc(jazzV3Label(ex))} · Stage ${esc(String(at.stage.n))} — ${esc(at.stage.name)}` : ''}</span></div>
    <h1 class="serif" style="margin-top:8px">${esc(ex.name)} ${jazzV3TypePill(ex)}</h1>
    <div class="jz-tierrow">${jazzTierBadgeHTML(id)}
      <label class="mono faint">tier <select class="sel sm" id="jzTierSet">${JAZZ_TIERS.map(t =>
        `<option value="${t.id}" ${jazzTierOf(id) === t.id ? 'selected' : ''}>${t.badge} ${esc(t.label.toLowerCase())}</option>`).join('')}</select></label>
      ${jazzTierOverrides()[id] ? '<button class="tbtn" id="jzTierReset">back to the rule</button>' : ''}
      ${jazzSubsectionOf(id) ? `<span class="mono faint">subsection ${esc(jazzSubsectionOf(id))}</span>` : ''}</div>
    ${jazzSequenceBarHTML(id)}
    <div class="jz-cols">
      <div class="jz-main">
        ${jazzV3PanelHTML(ex)}
        ${keyed ? `<div class="jz-keyrow">
          <span class="mono faint">in the key of</span>
          <div class="jz-keypick">${JAZZ_KEY_NAMES.map(k =>
            `<button class="jz-k${k === key ? ' on' : ''}${r.keys[k] ? ' got' : ''}" data-jzkey="${esc(k)}"
              title="${r.keys[k] ? 'yours' : 'not yet'}">${esc(jazzPretty(k))}</button>`).join('')}</div>
          <!-- Every exercise in this room is twelve exercises, and choosing
               which of the twelve by pressing the one you feel like is how
               you end up practising four of them. P0.11 is called a
               randomiser and had nothing to press; now everything does. -->
          <button class="jz-dice" id="jzDice" title="${jazzRandomises(ex)
            ? 'deal a new root and a new distance' : 'take a key at random'}">🎲 ${
            jazzRandomises(ex) ? 'deal one' : 'random key'}</button>
        </div>` : ''}
        <!-- the first stage is about distances rather than chords, so it asks
             for one as well as for a key -->
        ${jazzWantsInterval(ex) ? `<div class="jz-keyrow">
          <span class="mono faint">the distance</span>
          <div class="jz-keypick">${JAZZ_INTERVALS.map(v =>
            `<button class="jz-k wide${v === ui.interval ? ' on' : ''}" data-jzint="${esc(v)}">${
              esc(jazzSayInterval(v))}</button>`).join('')}</div>
        </div>` : ''}
        ${jazzAccuracyHTML(ex)}
        ${jazzReferenceHTML(ex)}
        ${jazzEditedBannerHTML(id)}
        ${jazzHasScore(ex) ? `<div class="jz-stage-box" data-jzacc="${
            jazzEdited(id) ? 'user_edited' : esc(ex.acc || 'verified')}">
            ${jazzIsMultiExample(ex) ? `<div class="jz-ex-tabs" id="jzExTabs"></div>` : ''}
            <div class="jz-score" id="jzScore"></div></div>
          ${jazzIsMultiExample(ex) ? '' : jazzScoreToolsHTML(id)}`
          : `<div class="jz-stage-box">${jazzV3MainTextHTML(ex)}</div>`}
        ${jazzV3YouTubeHTML(ex)}
        ${typeof jazzV3ToolHTML === 'function' ? jazzV3ToolHTML(ex) : ''}
        <!-- what is true of this exercise and of every other one. Under the
             score because that is where the eyes are, shut because four
             paragraphs between the notation and the buttons would be four
             paragraphs nobody asked for. -->
        <!-- the unit assignment material, where there is any: the two hands
             of a coordination drill, the COREA steps of a transcription, the
             seventeen questions. It belongs on the exercise rather than in a
             catalogue of its own. -->
        ${typeof jazzMaterialHTML === 'function' ? jazzMaterialHTML(id) : ''}
        ${jazzTipsHTML(ex)}
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
          ${single ? `<button class="btn ${r.done ? 'ghost' : 'primary'}" id="jzDone">${
            r.done ? '✓ Done — take it back' : (ex.type === 'LISTEN' ? 'Mark as heard and done' : 'Mark as read and understood')}</button>`
          : `<button class="btn ${r.keys[key] ? 'ghost' : 'primary'}" id="jzGot">${
            r.keys[key] ? `✓ ${esc(jazzPretty(key))} is yours — take it back` : `Mark ${esc(jazzPretty(key))} as yours`}</button>`}
          <button class="btn sm ghost" id="jzLog">+ Log a sitting</button>
          ${draws ? `<button class="btn sm ghost" id="jzCard">\u{1f3af} Put this in the cards</button>` : ''}
        </div>
        <div class="jz-count mono">${single ? (r.done ? `done ${esc(relDays(daysSince(r.done)))}` : 'not yet done')
          : `${got} of 12 keys`}${r.lastAt ? ` · last practised ${esc(relDays(daysSince(r.lastAt)))}` : ''}</div>
        ${jazzChecklistHTML(id)}
      </div>
      <aside class="jz-side">
        ${ex.why ? `<div class="jz-note"><span class="sc">Why it matters</span><p class="serif">${esc(ex.why)}</p></div>` : ''}
        ${ex.tip ? `<div class="jz-note"><span class="sc">How to get it in</span><p>${esc(ex.tip)}</p></div>` : ''}
        ${ex.theory && !readsHere ? `<div class="jz-note"><span class="sc">${ex.isV3 ? 'The v3 document says' : 'The book says'}</span>${jazzV3ParasHTML(ex.theory, 'serif')}</div>` : ''}
        ${!ex.isV3 && ex.v3 && ex.v3.theory ? `<div class="jz-note"><span class="sc">The v3 document says</span>${jazzV3ParasHTML(ex.v3.theory, 'serif')}</div>` : ''}
        ${at && at.stage.goldenTip ? jazzV3GoldenHTML(at.stage) : ''}
        ${typeof jazzRecommendedTunesHTML === 'function' ? jazzRecommendedTunesHTML(ex) : ''}
        ${typeof IMPROVISATION_LIBRARY === 'object' && (IMPROVISATION_LIBRARY.guidedImprovisation || []).some(e => e.id === id)
          ? `<button class="tbtn" data-jzgo="#/jazz/improv/${esc(id)}">the full guide in the Improvisation room \u2192</button>` : ''}
        ${ex.doubt ? `<div class="jz-note"><span class="sc">About these notes</span><p class="faint">${esc(ex.doubt)}</p></div>` : ''}
        ${ex.whenToUse ? `<div class="jz-note"><span class="sc">When you would use it${jazzDerivedTag(ex, 'whenToUse')}</span>
          <p class="serif">${esc(ex.whenToUse)}</p></div>` : ''}
        ${ex.practiceStrategy ? `<div class="jz-note"><span class="sc">How to practise it${jazzDerivedTag(ex, 'practiceStrategy')}</span>
          <p>${esc(ex.practiceStrategy)}</p></div>` : ''}
        ${jazzMistakesHTML(ex.commonMistakes, ex.mistakesFromStage)}
        ${jazzListeningHTML(ex.listeningAssignments, ex.listeningFromStage)}
        ${(ex.connections || []).length ? `<div class="jz-note jz-conns"><span class="sc">What it joins onto${jazzDerivedTag(ex, 'connections')}</span>
          <ul>${ex.connections.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
        ${ex.creativeChallenge ? `<div class="jz-note jz-challenge"><span class="sc">Something to make with it${jazzDerivedTag(ex, 'creativeChallenge')}</span>
          <p class="serif">${esc(ex.creativeChallenge)}</p></div>` : ''}
        ${ex.source ? `<p class="jz-src mono">${esc(ex.source)}</p>` : ''}
        ${at ? `<div class="jz-werner"><span class="jz-wi">\u{1f9d8}</span>
          <p>${esc(at.stage.werner)}</p><p class="jz-wm">${esc(at.stage.mindset)}</p></div>` : ''}
        ${r.logs.length ? `<div class="jz-note"><span class="sc">Sittings</span>
          <div class="jz-logs">${r.logs.slice(0, 6).map(l => `<div class="jz-log">
            <span class="mono">${esc(fmtDate(l.day, 'short'))}</span>
            <span>${l.minutes ? `${l.minutes}m` : ''} ${esc((JAZZ_QUALITY.find(q => q[0] === l.quality) || [])[1] || '')}</span>
            <span class="faint mono">${l.keys.length ? esc(l.keys.map(jazzPretty).join(' ')) : ''}</span>
            ${l.note ? `<p class="jz-lognote">${esc(l.note)}</p>` : ''}</div>`).join('')}</div></div>` : ''}
      </aside>
    </div>`;
}
/* ---------- the way into the editor ----------
   Put under the engraving rather than in the sidebar, because the thing you
   are about to change is the thing you are looking at. One button, because
   the editor is now the only way a score gets changed. */
function jazzScoreToolsHTML(id){
  const on = jazzEdited(id);
  return `<div class="jz-fixbar">
    <button class="tbtn" id="jzEdit" title="open the score editor">✏️ Edit score</button>
    <span class="grow"></span>
    ${on ? `<span class="jz-fixed mono">✏️ edited by you</span>
      <button class="tbtn danger" id="jzReset">↩ Reset to original</button>` : ''}
  </div>`;
}
function bindJazzScoreTools(root, id){
  const edit = root.querySelector('#jzEdit');
  if(edit) edit.onclick = () => openJazzScoreEditor(id, jazzUi().key, () => rerender());
  const reset = root.querySelector('#jzReset');
  if(reset) reset.onclick = () => {
    jazzClearEdited(id); sound('click');
    toast('Back to what the generator draws.'); rerender();
  };
}

/* ---------- the checkpoints ----------
   Binary, and yours to tick. Unlike the twelve-key grid, which is filled by
   the flashcards rather than by hand, a checkpoint is a claim about yourself
   that nothing else can measure — "can play it with my eyes shut" has no
   test in this room except your own honesty.

   Ticking one takes it out of the deck, which is the only place a tick here
   changes what the room asks you. That is deliberate: the deck takes you at
   your word until a card proves otherwise. */
function jazzChecklistHTML(id){
  const ex = jazzExercise(id);
  const list = (ex && ex.masteryChecklist) || [];
  if(!list.length) return '';
  const got = jazzChecksGot(id);
  return `<div class="jz-checks">
    <div class="row between" style="align-items:baseline">
      <span class="sc">How you know you have it</span>
      <span class="mono faint">${got.done}/${got.of}${ex.checklistDerived
        ? ' · <em class="jz-inherit" title="the source has no checklist for this one, so these are the standard rungs — slowly, in all twelve, at tempo, from memory, in a tune">the standard rungs</em>' : ''}</span>
    </div>
    ${list.map(t => `<label class="jz-check${jazzCheckGot(id, t) ? ' on' : ''}">
      <input type="checkbox" data-jzchk="${esc(t)}" ${jazzCheckGot(id, t) ? 'checked' : ''}>
      <span>${esc(t)}</span></label>`).join('')}</div>`;
}

function bindJazzExercise(root, id){
  const ex = jazzExercise(id);
  const ui = jazzUi();
  const tierSel = root.querySelector('#jzTierSet');
  if(tierSel) tierSel.onchange = () => { jazzSetTier(id, tierSel.value); sound('click'); rerender(); };
  const tierReset = root.querySelector('#jzTierReset');
  if(tierReset) tierReset.onclick = () => { jazzSetTier(id, null); sound('click'); rerender(); };
  bindJazzSequence(root, id);
  try { if(typeof bindJazzMaterial === 'function') bindJazzMaterial(root, id); } catch(e){}
  /* What this copy draws: the score you have edited if there is one, and
     what the generator writes if there is not. One override, not three. */
  const amended = () => jazzScoreFor(id, ex, ui.key, {interval: ui.interval});
  const draw = () => { if(!jazzHasScore(ex)) return;
    const result = amended();
    const box = root.querySelector('#jzScore');
    if(!result){
      if(box) box.innerHTML = '<div class="jz-noscore">The book names a way of writing this one out that this copy does not have.</div>';
      return;
    }
    if(typeof result === 'object' && Array.isArray(result.documents)){
      const tabs = root.querySelector('#jzExTabs');
      if(tabs && result.documents.length){
        const renderTab = i => {
          [...tabs.querySelectorAll('[data-jzex]')].forEach((b,j) => b.classList.toggle('on', j===i));
          jazzEngrave(box, result.documents[i].mxl);
        };
        tabs.innerHTML = result.documents.map((d,i) =>
          `<button class="jz-ex-tab${i===0?' on':''}" data-jzex="${i}">${esc(d.subtitle)}</button>`
        ).join('');
        tabs.querySelectorAll('[data-jzex]').forEach((b,i) =>
          b.onclick = () => { sound('click'); renderTab(i); });
        renderTab(0);
      } else if(box && result.documents.length) jazzEngrave(box, result.documents[0].mxl);
      return;
    }
    jazzEngrave(box, result); };
  draw();
  bindJazzTips(root);
  bindJazzScoreTools(root, id);
  $$('[data-jzint]', root).forEach(b => b.onclick = () => {
    ui.interval = b.dataset.jzint; sound('click'); rerender(); });
  root.querySelector('#jzBack').onclick = () => { ui.exId = null; navigate('#/jazz'); };
  $$('[data-jzkey]', root).forEach(b => b.onclick = () => {
    ui.key = b.dataset.jzkey; sound('click'); rerender(); });
  const dice = root.querySelector('#jzDice');
  /* Never the one already on the screen: a randomiser that deals you the
     same card you are looking at has not dealt you anything, and pressing it
     twice to get a new one is the tell that it is broken. */
  if(dice) dice.onclick = () => {
    ui.key = jazzPickOther(JAZZ_KEY_NAMES, ui.key);
    if(jazzRandomises(ex)) ui.interval = jazzPickOther(JAZZ_INTERVALS, ui.interval);
    sound('click');
    toast(jazzRandomises(ex)
      ? `${jazzPretty(ui.key)} — ${jazzSayInterval(ui.interval)}. Play it before you look.`
      : `In ${jazzPretty(ui.key)}.`);
    rerender();
  };
  const done = root.querySelector('#jzDone');
  if(done) done.onclick = () => {
    const on = jazzSetDone(id, !jazzRecord(id).done);
    sound(on ? 'success' : 'click'); if(on) toast('Done.'); rerender(); };
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  $$('.jzv3-diff[data-jzopen]', root).forEach(b => b.onclick = () => navigate('#/jazz/' + b.dataset.jzopen));
  try { if(typeof jazzV3BindTools === 'function') jazzV3BindTools(root, ex); } catch(e){ console.warn('a v3 tool did not bind', e); }
  const got = root.querySelector('#jzGot');
  if(got) got.onclick = () => {
    const have = !!jazzRecord(id).keys[ui.key];
    jazzSetKey(id, ui.key, !have);
    sound(have ? 'click' : 'success');
    if(!have) toast(`${jazzPretty(ui.key)} — ${jazzKeysGot(id)} of 12.`);
    rerender();
  };
  $$('[data-jzcite]', root).forEach(b => b.onclick = async () => {
    const said = b.dataset.jzcite;
    try { await navigator.clipboard.writeText(said); toast('Citation copied.'); }
    catch(e){ toast(said, 8000); }      /* no clipboard: show it to be copied by hand */
    sound('click');
  });
  $$('[data-jzchk]', root).forEach(c => c.onchange = () => {
    jazzSetCheck(id, c.dataset.jzchk, c.checked);
    c.closest('.jz-check').classList.toggle('on', c.checked);
    sound(c.checked ? 'success' : 'click');
    const said = root.querySelector('.jz-checks .mono');
    if(said){ const g = jazzChecksGot(id);
      said.innerHTML = said.innerHTML.replace(/^\d+\/\d+/, `${g.done}/${g.of}`); }
  });
  const log = root.querySelector('#jzLog');
  if(log) log.onclick = () => openJazzLog(id);
  const card = root.querySelector('#jzCard');
  if(card) card.onclick = () => {
    const st = jazzState().settings;
    if(!st.syllabus.includes(id)) st.syllabus.push(id);
    saveNow(); sound('success'); toast('It will come round in the cards.');
  };
  /* a sitting at this exercise is piano practice, and the clock should not
     need asking twice */
  try { if(typeof timeAutoStart === 'function')
    timeAutoStart({categoryId:'piano', feature:'jazz', what:`${ex.name}, in ${jazzPretty(ui.key)}`,
      linkedType:'skill', linkedId:null, linkedLabel:'Jazz piano'}); } catch(e){}
}

/* ---------- logging a sitting ---------- */
function openJazzLog(id){
  const ex = jazzExercise(id);
  const ui = jazzUi();
  const m = openModal(`<h2>A sitting — ${esc(ex.name)}</h2>
    <div class="row" style="gap:10px">
      <label class="pd-q" style="flex:1"><span class="k">how long</span>
        <input class="inp mono" type="number" min="0" max="600" id="jlMins" value="15"></label>
      <label class="pd-q" style="flex:1"><span class="k">from ♪=</span>
        <input class="inp mono" type="number" min="20" max="400" id="jlFrom" placeholder="80"></label>
      <label class="pd-q" style="flex:1"><span class="k">to ♪=</span>
        <input class="inp mono" type="number" min="20" max="400" id="jlTo" placeholder="120"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">how it went</span>
      <select class="sel" id="jlQ">${JAZZ_QUALITY.map(q =>
        `<option value="${q[0]}" ${q[0] === 'improving' ? 'selected' : ''}>${q[1]}</option>`).join('')}</select></label>
    <div class="pd-q" style="margin-top:10px"><span class="k">keys worked</span>
      <div class="jz-keypick" id="jlKeys">${JAZZ_KEY_NAMES.map(k =>
        `<button class="jz-k${k === ui.key ? ' on' : ''}" data-jlk="${esc(k)}">${esc(jazzPretty(k))}</button>`).join('')}</div></div>
    <label class="pd-q" style="margin-top:10px"><span class="k">notes</span>
      <textarea class="inp" rows="3" id="jlNote" placeholder="A flat and D flat still clunky. The V to I is the join that needs the work."></textarea></label>
    <label class="row" style="gap:8px;margin-top:10px;align-items:center">
      <input type="checkbox" id="jlMark" checked><span>mark those keys as yours</span></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="jlSave">Save</button></div>`, 'narrow');
  const picked = new Set([ui.key]);
  m.querySelectorAll('[data-jlk]').forEach(b => b.onclick = ev => {
    ev.preventDefault();
    const k = b.dataset.jlk;
    picked.has(k) ? picked.delete(k) : picked.add(k);
    b.classList.toggle('on', picked.has(k));
  });
  m.querySelector('#jlSave').onclick = () => {
    jazzLogPractice(id, {minutes: +m.querySelector('#jlMins').value || 0,
      from: +m.querySelector('#jlFrom').value || null,
      to: +m.querySelector('#jlTo').value || null,
      quality: m.querySelector('#jlQ').value,
      keys: [...picked], note: m.querySelector('#jlNote').value.trim(),
      markKeys: m.querySelector('#jlMark').checked});
    m.remove(); sound('success'); toast('Written down.'); rerender();
  };
  return m;
}
function openJazzHistory(){
  const logs = jazzAllLogs();
  const days = [];
  logs.forEach(l => { const d = days.find(v => v.day === l.day);
    d ? d.rows.push(l) : days.push({day: l.day, rows: [l]}); });
  const m = openModal(`<h2>What you have practised</h2>
    ${days.length ? days.slice(0, 20).map(d => `<div class="jz-hday">
      <div class="row between"><span class="sc">${esc(fmtDate(d.day, 'med'))}</span>
        <span class="mono">${sum(d.rows.map(r => +r.minutes || 0))} min</span></div>
      ${d.rows.map(l => { const ex = jazzExercise(l.exerciseId);
        return `<div class="jz-log"><span>${esc(ex ? ex.name : 'an exercise no longer in the book')}</span>
          <span class="mono faint">${l.minutes}m · ${esc(l.keys.map(jazzPretty).join(' ') || 'no keys said')}</span></div>`; }).join('')}
    </div>`).join('') : '<div class="empty">Nothing logged yet.</div>'}`, 'wide');
  return m;
}

/* a practice field nobody wrote for this exercise says so, beside its heading */
const jazzDerivedTag = (ex, k) => (ex.enrichDerived || []).includes(k)
  ? ' <em class="jz-inherit" title="No source gives this for this exercise. It is written from the exercise\u2019s type, its place on the ladder and its stage\u2019s goal.">derived</em>' : '';
