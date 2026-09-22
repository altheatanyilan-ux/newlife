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
    return osmd;
  } catch(e){
    console.warn('the jazz engraver could not draw that', e);
    box.innerHTML = `<div class="jz-noscore">That could not be drawn — ${esc(e.message)}</div>`;
    return null;
  }
}

/* ---------- the route ---------- */
routes.jazz = function(root, params){
  jazzState();
  const ui = jazzUi();
  const want = params && params[0] ? params[0] : null;
  if(want === 'cards'){ root.innerHTML = `<div class="page jz-page">${jazzFlashHTML()}</div>`;
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
const JAZZ_VOICE_STAGES = ['V1', 'V2', 'V3', 'V4'];
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
    <p class="page-blurb">Not pieces — patterns, in all twelve keys, until the hands go there
      without being asked. ${done} of ${of} keys are yours.</p>
    ${jazzStageHeadHTML(jazzActiveStage())}
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:16px">
      <button class="btn primary" id="jzPlanGo">\u{1f4cb} Today\u2019s practice</button>
      <button class="btn sm ghost" id="jzCards">\u{1f3af} Flashcards</button>
      <button class="btn sm ghost" id="jzHistory">\u{1f4ca} What you have practised</button>
      <button class="btn sm ghost" id="jzAllTips">\u{1f3c6} Golden tips</button>
      <button class="btn sm ghost" id="jzListen">\u{1f3a7} Listening Library</button>
      <button class="btn sm ghost" id="jzImprov">\u{1f3bc} Improvisation</button>
      <button class="btn sm ghost" id="jzUnits">\u{1f4cb} Unit Assignments</button>
      <span class="grow"></span>
      <label class="jz-gate mono"><input type="checkbox" id="jzGate" ${jazzGated() ? 'checked' : ''}>
        one stage at a time</label>
    </div>
    <div class="jz-view-tabs" role="tablist">
      <button class="jz-view-tab${!isVoice ? ' on' : ''}" data-jzview="piano" role="tab"
        aria-selected="${!isVoice}">Piano</button>
      <button class="jz-view-tab${isVoice ? ' on' : ''}" data-jzview="voice" role="tab"
        aria-selected="${isVoice}">\u{1f3a4} Voice</button>
    </div>
    ${isVoice ? `<p class="jz-view-blurb">Vocal improvisation stages \u2014 scat, bebop phrasing,
      and hearing the changes. These run alongside the piano curriculum;
      V1 opens after stage 6.</p>` : ''}
    <div class="jz-road">${shown.map(s => jazzStageHTML(s, s.id === now.id)).join('')}</div>`;
}
function jazzStageHTML(s, here){
  const got = jazzStageGot(s);
  const open = jazzStageOpen(s);
  const collapsed = open && jazzStageCollapsed(s.id);
  /* run ahead if you like \u2014 it just says so */
  const ahead = open && !jazzStageReached(s);
  const pct = got.of ? Math.round(got.done / got.of * 100) : 0;
  return `<section class="jz-stage${open ? '' : ' shut'}${here ? ' here' : ''}${
    collapsed ? ' collapsed' : ''}" data-jzstage="${esc(s.id)}">
    <header class="jz-shead" data-jztoggle="${esc(s.id)}"
      title="${collapsed ? 'Expand this stage' : 'Collapse this stage'}" style="cursor:pointer">
      <span class="jz-sn mono">${s.n === 0 ? 'P' : s.n}</span>
      <span class="jz-st"><b class="serif">${esc(s.name)}</b>
        <span class="faint">${esc(s.blurb)}</span></span>
      ${jazzDifficultyHTML(s.expectedDifficulty)}
      <span class="mono jz-scount">${open ? `${got.done}/${got.of}` : '\u{1f512}'}${
        ahead ? '<em class="jz-ahead" title="the stage before this one is not finished">ahead</em>' : ''}
        <span class="jz-toggle-arrow" aria-hidden="true">${collapsed ? '\u25b6' : '\u25bc'}</span></span>
    </header>
    <div class="jz-sbar"><i style="width:${pct}%"></i></div>
    ${open && !collapsed ? `<div class="jz-subs">${s.subs.map(id => {
      const ex = jazzExercise(id); if(!ex) return '';
      const n = jazzKeysGot(id);
      return `<button class="jz-sub" data-jzopen="${esc(id)}">
        <span class="jz-subn mono">${esc(id)}</span>
        <span class="jz-subt">${esc(ex.name)}${
          jazzHasScore(ex) ? '' : '<span class="jz-nodraw mono">no notation</span>'}${
          jazzTrusted(ex) ? '' : `<span class="jz-nodraw mono jz-unver" title="${
            esc(jazzAccuracy(ex).said)}">${esc(jazzAccuracy(ex).short)} notes</span>`}${
          jazzAmend(id) ? '<span class="jae-pill mono" title="you have corrected this exercise">✏️ corrected</span>' : ''}</span>
        <span class="jz-keys">${JAZZ_KEY_NAMES.map(k =>
          `<i class="${jazzRecord(id).keys[k] ? 'on' : ''}" title="${esc(jazzPretty(k))}"></i>`).join('')}</span>
        <span class="mono jz-subc">${n}/12</span></button>`; }).join('')}</div>
      <details class="jz-why"><summary><span class="mono">why this stage</span></summary>
        <p class="serif">${esc(s.theory)}</p>
        <div class="jz-werner"><span class="jz-wi">\u{1f9d8}</span>
          <p>${esc(s.werner)}</p>
          <p class="jz-wm">${esc(s.mindset)}</p></div>
        ${s.historicalContext ? `<div class="jz-note"><span class="sc">Where this came from</span>
          <p class="serif">${esc(s.historicalContext)}</p></div>` : ''}
        ${s.typicalTimeToMaster ? `<div class="jz-note jz-howlong"><span class="sc">How long this honestly takes</span>
          <p>${esc(s.typicalTimeToMaster)}</p></div>` : ''}
        ${jazzMistakesHTML(s.commonMistakes)}
        ${jazzListeningHTML(s.listeningAssignments)}
      </details>`
    : (!open ? `<p class="jz-shut mono">Shut until ${esc((jazzStage(s.needs) || {}).name || 'the stage before it')} is finished in all twelve keys.</p>` : '')}
  </section>`;
}
function bindJazzRoad(root){
  bindJazzPlan(root);
  $$('[data-jzopen]', root).forEach(b => b.onclick = () => {
    jazzUi().exId = b.dataset.jzopen; navigate('#/jazz/' + b.dataset.jzopen); });
  const cards = root.querySelector('#jzCards');
  if(cards) cards.onclick = () => navigate('#/jazz/cards');
  const hist = root.querySelector('#jzHistory');
  if(hist) hist.onclick = () => openJazzHistory();
  const gate = root.querySelector('#jzGate');
  if(gate) gate.onchange = () => { jazzState().settings.gate = gate.checked;
    saveNow(); sound('click'); rerender(); };
  const listen = root.querySelector('#jzListen');
  if(listen) listen.onclick = () => navigate('#/jazz/listen');
  const improv = root.querySelector('#jzImprov');
  if(improv) improv.onclick = () => navigate('#/jazz/improv');
  const units = root.querySelector('#jzUnits');
  if(units) units.onclick = () => navigate('#/jazz/units');
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
}

/* ---------- one exercise ---------- */
function jazzExerciseHTML(id){
  const ex = jazzExercise(id), at = jazzSubOf(id);
  const r = jazzRecord(id);
  const ui = jazzUi();
  const key = JAZZ_KEY_NAMES.includes(ui.key) ? ui.key : 'C';
  const got = jazzKeysGot(id);
  return `<div class="row between" style="align-items:baseline;gap:10px;flex-wrap:wrap">
      <button class="btn sm ghost" id="jzBack">← the roadmap</button>
      <span class="mono faint">${at ? `${esc(ex.id)} · ${esc(at.stage.name)}` : ''}</span></div>
    <h1 class="serif" style="margin-top:8px">${esc(ex.name)}</h1>
    <div class="jz-cols">
      <div class="jz-main">
        <div class="jz-keyrow">
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
        </div>
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
        ${jazzAmendBannerHTML(id)}
        ${jazzHasScore(ex) ? `<div class="jz-stage-box" data-jzacc="${
            jazzAmend(id) ? 'user_amended' : jazzFixCount(id) ? 'user_modified' : esc(ex.acc || 'verified')}">
            ${jazzIsMultiExample(ex) ? `<div class="jz-ex-tabs" id="jzExTabs"></div>` : ''}
            <div class="jz-score" id="jzScore"></div></div>
          ${jazzIsMultiExample(ex) ? '' : jazzFixToolsHTML(id, ex)}`
          : `<div class="jz-stage-box"><div class="jz-noscore">This one has nothing to read.
             It is a thing to do — at the instrument or on paper — and the words
             beside it are the whole of it.</div></div>`}
        <!-- what is true of this exercise and of every other one. Under the
             score because that is where the eyes are, shut because four
             paragraphs between the notation and the buttons would be four
             paragraphs nobody asked for. -->
        ${jazzTipsHTML(ex)}
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn ${r.keys[key] ? 'ghost' : 'primary'}" id="jzGot">${
            r.keys[key] ? `✓ ${esc(jazzPretty(key))} is yours — take it back` : `Mark ${esc(jazzPretty(key))} as yours`}</button>
          <button class="btn sm ghost" id="jzLog">+ Log a sitting</button>
          <button class="btn sm ghost" id="jzCard">\u{1f3af} Put this in the cards</button>
        </div>
        <div class="jz-count mono">${got} of 12 keys${r.lastAt ? ` · last practised ${esc(relDays(daysSince(r.lastAt)))}` : ''}</div>
        ${jazzChecklistHTML(id)}
      </div>
      <aside class="jz-side">
        ${ex.why ? `<div class="jz-note"><span class="sc">Why it matters</span><p class="serif">${esc(ex.why)}</p></div>` : ''}
        ${ex.tip ? `<div class="jz-note"><span class="sc">How to get it in</span><p>${esc(ex.tip)}</p></div>` : ''}
        ${ex.theory ? `<div class="jz-note"><span class="sc">The book says</span><p class="serif">${esc(ex.theory)}</p></div>` : ''}
        ${ex.doubt ? `<div class="jz-note"><span class="sc">About these notes</span><p class="faint">${esc(ex.doubt)}</p></div>` : ''}
        ${ex.whenToUse ? `<div class="jz-note"><span class="sc">When you would use it</span>
          <p class="serif">${esc(ex.whenToUse)}</p></div>` : ''}
        ${ex.practiceStrategy ? `<div class="jz-note"><span class="sc">How to practise it</span>
          <p>${esc(ex.practiceStrategy)}</p></div>` : ''}
        ${jazzMistakesHTML(ex.commonMistakes, ex.mistakesFromStage)}
        ${jazzListeningHTML(ex.listeningAssignments, ex.listeningFromStage)}
        ${(ex.connections || []).length ? `<div class="jz-note jz-conns"><span class="sc">What it joins onto</span>
          <ul>${ex.connections.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
        ${ex.creativeChallenge ? `<div class="jz-note jz-challenge"><span class="sc">Something to make with it</span>
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
/* ---------- take it away, fix it, bring it back ----------
   Put under the engraving rather than in the sidebar, because the thing you
   are about to correct is the thing you are looking at. */
function jazzFixToolsHTML(id, ex){
  const n = jazzFixCount(id);
  return `<div class="jz-fixbar">
    <button class="tbtn" id="jzEdit" title="edit the notes directly in the browser">\u270f\ufe0f Edit notes</button>
    <button class="tbtn" id="jzDown" title="save it as a MusicXML file you can open in MuseScore">\u2b07 MusicXML</button>
    <button class="tbtn" id="jzUp" title="bring back a file you have corrected">\u{1f4e4} Import a corrected one</button>
    <span class="grow"></span>
    ${n ? `<span class="jz-fixed mono" title="${esc(jazzFixSource(id))}">\u2713 ${n} note${
      n === 1 ? '' : 's'} corrected by you</span>
      <button class="tbtn danger" id="jzReset">\u21a9 put it back</button>` : ''}
    ${jazzFixStale(id) ? `<span class="jz-stale mono">\u26a0 ${jazzFixStaleCount(id)} correction${
      jazzFixStaleCount(id) === 1 ? '' : 's'} were recorded before this room had a bass clef.
      A note's place on the page has changed, so they are not being applied \u2014 correct the file again,
      or let them go.</span>
      <button class="tbtn danger" id="jzDropStale">forget them</button>` : ''}
    <input type="file" id="jzUpFile" accept=".musicxml,.xml,application/xml,text/xml" hidden>
  </div>`;
}
function bindJazzFixTools(root, id, ex, xmlOf){
  const edit = root.querySelector('#jzEdit');
  if(edit) edit.onclick = () => openJazzEditor(id, xmlOf, jazzUi().key, () => rerender());
  const drop = root.querySelector('#jzDropStale');
  if(drop) drop.onclick = () => { jazzClearFixes(id); toast('Forgotten. The notation is the generator\u2019s again.'); rerender(); };
  const down = root.querySelector('#jzDown');
  if(down) down.onclick = () => {
    const xml = xmlOf();
    if(!xml){ toast('There is nothing to save for this one.'); return; }
    const name = jazzDownloadXML(xml, ex.name, jazzPretty(jazzUi().key));
    sound('success'); toast(`Saved as ${name}. Correct it in MuseScore and bring it back.`, 6000);
  };
  const up = root.querySelector('#jzUp'), file = root.querySelector('#jzUpFile');
  if(up && file){
    up.onclick = () => file.click();
    file.onchange = async () => {
      const f = file.files && file.files[0];
      if(!f) return;
      const theirs = await f.text();
      /* compared against what this copy would draw, unfixed, in the key the
         file was exported from \u2014 which is the key on the screen */
      const mine = jazzScoreXml(ex, jazzUi().key, {interval: jazzUi().interval});
      const out = jazzDiffXML(mine, theirs);
      file.value = '';
      if(out.error){ toast(out.error, 8000); sound('error'); return; }
      if(!out.fixes.length){
        toast(`Nothing differs \u2014 all ${out.looked} notes match what this copy draws.`, 6000);
        return;
      }
      jazzSetFixes(id, out.fixes, `imported from ${f.name}`);
      sound('success');
      toast(`${out.fixes.length} note${out.fixes.length === 1 ? '' : 's'} corrected. It will follow the exercise into every key.`, 7000);
      rerender();
    };
  }
  const reset = root.querySelector('#jzReset');
  if(reset) reset.onclick = () => {
    jazzClearFixes(id); sound('click'); toast('Back to what the generator draws.'); rerender();
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
  /* what this copy generates, then what you have corrected, then what you have amended */
  const plain   = () => jazzScoreXml(ex, ui.key, {interval: ui.interval});
  const fixed   = () => { const x = plain(); return x ? jazzApplyFixes(x, id, ui.key) : x; };
  const amended = () => { const a = jazzAmend(id); return a ? jazzAmendToXml(a, ui.key) : fixed(); };
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
  bindJazzFixTools(root, id, ex, amended);
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
