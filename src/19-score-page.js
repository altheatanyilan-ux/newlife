/* ============================================================
   SCORE PRACTICE — the room.

   Two views and one of them is the point. The library is a shelf you pass
   through; the score is where the work happens, so the score gets the width
   and the shelf gets a list.

   The page is rebuilt on nearly every edit, and engraving a Ballade takes the
   better part of a second — so the notation is deliberately NOT redrawn by the
   page's own rerender. Writing a note about bar 48 repaints the panel beside
   the score and leaves the engraving alone. Only the three things that really
   change the picture — a part switched off, the zoom, the focus range — ask
   the engraver to go again.
   ============================================================ */

/* Reading mode strips the app down to the notation, so leaving the room by any
   other door — the sidebar, a search result, the back button — has to put the
   room back. Bound once here rather than remembered at every exit, because a
   cleanup you have to remember is a cleanup somebody eventually forgets and
   the whole instrument is left without a sidebar. */
addEventListener('hashchange', () => {
  if(typeof parseHash !== 'function') return;
  if(parseHash().name === 'score') return;
  document.documentElement.classList.remove('sc-reading');
  if(S && S._score) S._score.reading = false;
  if(typeof scoreKeepAwake === 'function') scoreKeepAwake(false);
  if(typeof scoreQuietWatch === 'function') scoreQuietWatch(false);
  if(typeof scoreKeysWatch === 'function') scoreKeysWatch(null);
  /* a click still going in a room you have left is a click you have to hunt
     for the off switch of */
  if(typeof ScoreMetronome !== 'undefined') ScoreMetronome.stop();
});

const scoreOpenId = () => S._score && S._score.id;
function scoreUi(){ return S._score = S._score || {id:null, focus:null, reading:false, marks:true, more:false, side:'marks', goto:null}; }

routes.score = function(root, params){
  scoreState();
  /* The piano is not warmed here any more. Decoding thirty recordings is
     seconds of work on a slow machine, and doing it while the score is being
     engraved made both slower; it waits until the notes are on the screen
     (scorePaint), or until somebody presses play. */
  const ui = scoreUi();
  const want = params && params[0] ? params[0] : null;
  if(want && scoreById(want)) ui.id = want;
  const rec = ui.id ? scoreById(ui.id) : null;
  registerPageEntry({pageName:'Repertoire', addLabel:'Add a score', defaultEntryType:'score', prefilledFields:{}, options:[
    {icon:'📄', label:'A score', desc:'A MusicXML file, from MuseScore or anywhere.', run:()=>scorePickFile()},
    ...(rec ? [{icon:'🎯', label:'A section', desc:'A measure range worth practising on its own.', run:()=>openSectionModal(rec.id)}] : [])]});
  if(!rec){ document.documentElement.classList.remove('sc-reading'); ui.reading = false;
    root.innerHTML = `<div class="page sc-page">${scoreLibraryHTML()}</div>`; bindScoreLibrary(root);
    /* while you are choosing, the engraver compiles — so the one you choose
       has only its own notes left to draw */
    scoreWarmEngraver();
    return; }
  document.documentElement.classList.toggle('sc-reading', !!ui.reading);
  root.innerHTML = `<div class="page sc-page sc-open">${scoreViewerHTML(rec)}</div>`;
  bindScoreViewer(root, rec);
  scorePaint(rec);
  /* Arriving from somewhere that knows which bar it means — a rule saying
     where you met it — the engraving has not been drawn yet, so the scroll
     waits for it rather than landing on an empty stage. */
  if(ui.goto){
    const at = ui.goto; ui.goto = null;
    const tryIt = n => setTimeout(() => {
      if(document.querySelector('#scCanvas svg')) scoreScrollTo(at);
      else if(n > 0) tryIt(n - 1);
    }, 400);
    tryIt(14);
  }
};

/* ---------- the shelf ---------- */
function scoreLibraryHTML(){
  const list = scoreState().slice().sort((a, b) =>
    (b.lastOpened || b.createdAt || '').localeCompare(a.lastOpened || a.createdAt || ''));
  const weight = scoreLibraryWeight();
  return `<h1 class="serif">Repertoire</h1>
    <p class="muted sc-lede">The notation, and what you have written on it. Bring a MusicXML file and the score is engraved here; then mark the sections, write what each one needs, and practise one of them at a time. A sentence about bar 60 belongs at bar 60 — in a practice diary it is something you read in three weeks, on the page it is something you cannot miss.</p>
    ${osmdBuiltIn() ? '' : `<div class="sc-warn">The engraver is not built into this copy, so nothing can be drawn. Everything you have written is safe; run <code>npm install</code> and build again to get the notation back.</div>`}
    <div class="sc-drop" id="scDrop" tabindex="0" role="button" aria-label="Add a score">
      <span class="sc-drop-i">📄</span>
      <span class="sc-drop-t serif">Drop a MusicXML file here</span>
      <span class="sc-drop-s mono">.musicxml or .mxl — or press to choose one</span>
      <span class="sc-drop-h">Export one from MuseScore, Flat.io or Dorico. This room reads notation, not pictures of it: a PDF or a photograph has nothing in it to mark up.</span>
    </div>
    <input type="file" id="scFile" accept=".musicxml,.mxl,.xml,application/vnd.recordare.musicxml+xml" hidden>
    ${list.length ? `<div class="sc-shelf">${list.map(x => {
      const n = (x.sections || []).length;
      const done = (x.sections || []).filter(s => s.status === 'solid' || s.status === 'polished').length;
      return `<div class="sc-item" data-scitem="${esc(x.id)}">
        <button class="sc-item-face" data-scopen="${esc(x.id)}">
          <span class="sc-item-t serif">${esc(x.title)}</span>
          <span class="sc-item-c">${esc(x.composer || '')}</span>
          <span class="sc-item-m mono">${x.totalMeasures ? `${x.totalMeasures} bars · ` : ''}${
            n ? `${done} of ${n} section${n === 1 ? '' : 's'} solid` : 'no sections yet'} · ${scoreSaid(scoreWeight(x))}</span>
          ${n ? `<span class="sc-item-bar">${(x.sections || []).map(s =>
            `<i style="--c:${esc(s.color)};flex:${Math.max(1, s.endMeasure - s.startMeasure + 1)}"
              title="${esc(s.name)} — ${esc(scoreStatusName(s.status))}"></i>`).join('')}</span>` : ''}
        </button>
        <div class="sc-item-tools">
          <span class="mono faint">${x.lastOpened ? `opened ${esc(fmtDate(x.lastOpened, 'short'))}` : 'never opened'}</span>
          <span class="grow"></span>
          <button class="del-x inline" data-scdel="${esc(x.id)}" title="take this score off the shelf">×</button>
        </div>
      </div>`; }).join('')}</div>
      <div class="sc-weigh mono${scoreLibraryHeavy() ? ' heavy' : ''}">${list.length} score${list.length === 1 ? '' : 's'} · ${scoreSaid(weight)} of notation kept${
        scoreLibraryHeavy() ? ' — heavy enough to be slowing every save. Take off what you are not working on; the sections and notes go with it.' : ''}</div>`
      : '<div class="empty">Nothing on the shelf yet.</div>'}
    ${scoreInventoryHTML()}
    ${scoreRulesHTML()}`;
}

/* ---------- the inventory ----------
   The shelf answers "what am I working on": biggest, newest, most recently
   opened first. It does not answer "what have I got", which is the question
   you ask when you are deciding what to pick up next, or wondering whether
   that Debussy you imported in March is still here and how far you got with
   it. Projects and the Skill Tree both grew this section for the same reason
   and this is deliberately the same shape — search, filters as selects, one
   row per score, sortable, with what you have done to it on the row.

   Everything the shelf shows as a picture, this shows as a number, because
   the two questions want different answers. */
function scoreFilters(){
  return S._scinv = S._scinv || {q:'', state:'all', shape:'all', sort:'opened',
    composer:'all', period:'all', familiar:'all'};
}
/* Where a score stands, taken from its sections rather than set by hand: a
   piece is as ready as the least ready part of it that you have marked. */
function scoreStanding(x){
  const secs = x.sections || [];
  if(!secs.length) return {key:'unmarked', name:'not marked up', color:'#8a8d8f'};
  const rank = k => SCORE_STATUS.findIndex(v => v[0] === k);
  const low = secs.reduce((a, sc) => Math.min(a, rank(sc.status)), 99);
  const st = SCORE_STATUS[Math.max(0, low)];
  const all = secs.every(sc => sc.status === 'polished');
  if(all) return {key:'polished', name:'polished', color:'#7f916a'};
  return {key: st[0], name: st[1].toLowerCase(), color: low >= 3 ? '#7f916a' : low >= 2 ? '#c9a96e' : '#b0705e'};
}
const scoreMinutesAll = x => sum((x.practice || []).map(r => +r.minutes || 0));
const scoreLastPractised = x => (x.practice || []).map(r => r.date).sort().slice(-1)[0] || '';
function scoreMatches(x, f){
  const q = (f.q || '').trim().toLowerCase();
  if(q && !`${x.title} ${x.composer || ''} ${(x.sections || []).map(sc => sc.name).join(' ')}`.toLowerCase().includes(q)) return false;
  if(f.state !== 'all' && scoreStanding(x).key !== f.state) return false;
  if(f.composer !== 'all' && (x.composer || '\u2014') !== f.composer) return false;
  if(f.period !== 'all' && (scorePeriodOf(x) || '\u2014') !== f.period) return false;
  if(f.familiar !== 'all' && x.familiar !== f.familiar) return false;
  const last = scoreLastPractised(x);
  if(f.shape === 'unmarked' && (x.sections || []).length) return false;
  if(f.shape === 'marked'   && !(x.sections || []).length) return false;
  if(f.shape === 'never'    && last) return false;
  if(f.shape === 'cold'     && !(last && daysSince(last) > 21)) return false;
  if(f.shape === 'warm'     && !(last && daysSince(last) <= 7)) return false;
  if(f.shape === 'written'  && !((x.pins || []).length || Object.keys(x.fingerings || {}).length)) return false;
  return true;
}
function scoreInventoryHTML(){
  const all = scoreState();
  if(!all.length) return '';
  const f = scoreFilters();
  const counts = {};
  all.forEach(x => { const k = scoreStanding(x).key; counts[k] = (counts[k] || 0) + 1; });
  const list = all.filter(x => scoreMatches(x, f)).sort((a, b) => {
    if(f.sort === 'title')    return a.title.localeCompare(b.title);
    if(f.sort === 'composer') return (a.composer || '\uffff').localeCompare(b.composer || '\uffff') || a.title.localeCompare(b.title);
    /* best known first: the question this sort answers is usually what could
       I play for somebody tonight, not what have I barely started */
    if(f.sort === 'familiar') return scoreFamiliarAt(b.familiar) - scoreFamiliarAt(a.familiar)
      || daysSince(scoreLastPractised(a)) - daysSince(scoreLastPractised(b));
    /* by period is by the order they happened in, not by their names: a list
       that runs Baroque, Classical, Contemporary, Impressionist is a list
       sorted by spelling, which is no use to anybody */
    if(f.sort === 'period'){
      const at = x => { const k = scorePeriodOf(x); const i = SCORE_PERIODS.findIndex(v => v[0] === k);
        return i < 0 ? 99 : i; };
      return at(a) - at(b) || (a.composer || '').localeCompare(b.composer || '')
        || a.title.localeCompare(b.title);
    }
    if(f.sort === 'bars')     return (+b.totalMeasures || 0) - (+a.totalMeasures || 0);
    if(f.sort === 'time')     return scoreMinutesAll(b) - scoreMinutesAll(a);
    if(f.sort === 'practised')return daysSince(scoreLastPractised(a)) - daysSince(scoreLastPractised(b));
    return (b.lastOpened || b.createdAt || '').localeCompare(a.lastOpened || a.createdAt || '');
  });
  const dirty = f.q || f.state !== 'all' || f.shape !== 'all'
    || f.composer !== 'all' || f.period !== 'all' || f.familiar !== 'all';
  const states = [['unmarked','not marked up'], ...SCORE_STATUS.map(([k, n]) => [k, n.toLowerCase()])];
  /* the two categories are built from the shelf rather than from a fixed
     list, so the menu only ever offers a composer you actually have, and
     says how many — a menu of two hundred dead composers, all but six of
     them empty, is a menu nobody reads */
  const tally = get => { const t = {}; all.forEach(x => { const k = get(x);
    if(k) t[k] = (t[k] || 0) + 1; }); return t; };
  const comps = tally(x => x.composer || '\u2014');
  const fams = tally(x => x.familiar);
  const periods = tally(x => scorePeriodOf(x) || '\u2014');
  const byCount = t => Object.keys(t).sort((a, b) => t[b] - t[a] || a.localeCompare(b));
  const someGuessed = all.some(x => !x.period && scorePeriodGuess(x.composer));
  return `<section class="section rv sc-inv" id="scInv">
    <div class="row between"><span class="sc" style="margin:0">Inventory</span>
      <span class="mono">${list.length} of ${all.length} shown</span></div>
    <p class="muted" style="font-size:.85rem">Everything you have brought in, including the pieces you have not started marking up. The shelf is what you are working on; this is what you have.${
      someGuessed ? ' A period in lighter type was guessed from the composer\u2019s name \u2014 press it to say for certain, or to correct it.' : ''}</p>
    <div class="filter-bar">
      <input class="inp" id="scinvq" placeholder="search title, composer, section" value="${esc(f.q)}">
      <select class="sel" id="scinvFam"><option value="all">however well you know it</option>${
        SCORE_FAMILIAR.map(([k, n, hint]) => `<option value="${k}" ${f.familiar === k ? 'selected' : ''}
          >${esc(n)}${fams[k] ? ` (${fams[k]})` : ''}</option>`).join('')}</select>
      <select class="sel" id="scinvState"><option value="all">any section standing</option>${states.map(([k, n]) =>
        `<option value="${k}" ${f.state === k ? 'selected' : ''}>${esc(n)}${counts[k] ? ` (${counts[k]})` : ''}</option>`).join('')}</select>
      <select class="sel" id="scinvComposer"><option value="all">any composer</option>${
        byCount(comps).map(k => `<option value="${esc(k)}" ${f.composer === k ? 'selected' : ''}>${
          k === '\u2014' ? 'no composer named' : esc(k)} (${comps[k]})</option>`).join('')}</select>
      <select class="sel" id="scinvPeriod"><option value="all">any period</option>${
        byCount(periods).map(k => `<option value="${esc(k)}" ${f.period === k ? 'selected' : ''}>${
          k === '\u2014' ? 'period not set' : esc(scorePeriodName(k))} (${periods[k]})</option>`).join('')}</select>
      <select class="sel" id="scinvShape">${[['all','any shape'],['marked','has sections'],['unmarked','no sections yet'],
        ['warm','practised this week'],['cold','nothing for three weeks'],['never','never practised'],
        ['written','has pins or fingerings']].map(([v, l]) =>
        `<option value="${v}" ${f.shape === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="sel" id="scinvSort">${[['opened','by last opened'],['practised','by last practised'],
        ['time','by time spent'],['bars','by length'],['composer','by composer'],['period','by period'],['familiar','by how well you know it'],['title','by title']].map(([v, l]) =>
        `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      ${dirty ? `<button class="btn sm ghost" id="scinvClear">clear</button>` : ''}
    </div>
    ${list.length ? `<div class="sc-invrows">${list.map(x => {
      const st = scoreStanding(x);
      const secs = (x.sections || []).length;
      const mins = scoreMinutesAll(x);
      const last = scoreLastPractised(x);
      const pins = (x.pins || []).length;
      const fing = Object.keys(x.fingerings || {}).length;
      const per = scorePeriodOf(x);
      const fam = scoreFamiliarOf(x);
      const doubt = scoreFamiliarDoubt(x);
      /* the row is coloured by what YOU said about the piece rather than by
         what the sections add up to: the sections are a detail of it */
      return `<div class="sc-invrow${doubt ? ' doubt' : ''}" style="--c:${fam[3]}" data-scinvrow="${esc(x.id)}">
        <button class="sc-invname" data-scopen="${esc(x.id)}">
          <b class="serif">${esc(x.title)}</b>
          ${x.composer ? `<span class="faint">${esc(x.composer)}</span>` : ''}</button>
        <button class="sc-invper mono${x.period ? '' : ' guess'}" data-scdetails="${esc(x.id)}"
          title="${x.period ? 'the period you set \u2014 press to change it'
            : per ? 'guessed from the composer \u2014 press to say for certain'
            : 'press to name the composer and the period'}"
          >${per ? esc(scorePeriodName(per)) : 'set the period'}</button>
        <span class="sc-invfam">
          <select class="sel sm" data-scfam="${esc(x.id)}" title="${esc(fam[2])}">${
            SCORE_FAMILIAR.map(([k, n]) =>
              `<option value="${k}" ${x.familiar === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
          ${doubt ? `<em class="sc-invdoubt faint" title="what the practice log says about what you said">${esc(doubt)}</em>` : ''}</span>
        <span class="mono faint">${x.totalMeasures ? `${x.totalMeasures} bars` : '\u2014'}${
          secs ? ` \u00b7 ${secs} section${secs === 1 ? '' : 's'}, ${esc(st.name)}` : ''}${
          x.transpose ? ` \u00b7 ${x.transpose > 0 ? '+' : '\u2212'}${Math.abs(x.transpose)}` : ''}</span>
        <span class="mono faint">${pins || fing ? `${pins ? `${pins} pin${pins === 1 ? '' : 's'}` : ''}${
          pins && fing ? ' \u00b7 ' : ''}${fing ? `${fing} finger${fing === 1 ? '' : 's'}` : ''}` : ''}</span>
        <span class="mono">${mins ? fmtHM(mins) : '\u2014'}</span>
        <span class="mono faint">${last ? esc(scoreAgo(last)) : 'never practised'}</span>
        <button class="del-x inline" data-scdel="${esc(x.id)}" title="take this score off the shelf">\u00d7</button>
      </div>`; }).join('')}</div>`
      : '<div class="empty sm">Nothing matches that.</div>'}
  </section>`;
}

/* ---------- the score ---------- */
function scoreViewerHTML(x){
  const ui = scoreUi();
  const focus = ui.focus ? scoreSection(x, ui.focus) : null;
  const parts = x.instruments || [];
  return `<div class="sc-head">
      <button class="btn sm ghost" id="scBack">← the shelf</button>
      <button class="sc-title serif" data-scdetails="${esc(x.id)}"
        title="what this piece is \u2014 title, composer, period">${esc(x.title)}</button>
      ${x.composer ? `<span class="sc-comp">${esc(x.composer)}</span>` : ''}
      ${scorePeriodOf(x) ? `<span class="sc-comp faint">${esc(scorePeriodName(scorePeriodOf(x)))}</span>` : ''}
      <span class="grow"></span>
      <span class="mono faint">${x.totalMeasures ? `${x.totalMeasures} bars` : ''}</span>
      <button class="tbtn" id="scPrint" title="print it, with or without what you have written on it">⎙ print</button>
    </div>
    ${focus ? `<div class="sc-focusbar" style="--c:${esc(focus.color)}">
      <span class="sc-focus-t">🎯 ${esc(focus.name)}</span>
      <span class="mono">bars ${focus.startMeasure}–${focus.endMeasure}</span>
      ${scoreTempoSay(focus)}
      <span class="grow"></span>
      <button class="btn sm" id="scLog">Log practice</button>
      <button class="btn sm ghost" id="scUnfocus">Leave focus</button>
    </div>` : ''}
    <div class="sc-bar">
      <div class="sc-parts" id="scParts">${parts.length > 1 ? parts.map(p =>
        `<label class="sc-part"><input type="checkbox" data-scpart="${p.index}"
          ${(x.hidden || []).includes(p.index) ? '' : 'checked'}> ${esc(p.name)}</label>`).join('')
        : '<span class="mono faint">one part</span>'}</div>
      ${parts.length > 1 ? `<button class="tbtn" id="scSolo">solo the first</button>
        <button class="tbtn" id="scAllParts">all of them</button>` : ''}
      <span class="grow"></span>
      ${scoreBplHTML(x)}
      <span class="sc-zoom"><button class="tbtn" data-sczoom="-1" ${x.barsPerLine ? 'disabled' : ''}>−</button>
        <span class="mono" id="scZoomSay" title="${x.barsPerLine
          ? 'set by the bars to a line' : 'how big the engraving is'}">${scoreZoomSay(x)}</span>
        <button class="tbtn" data-sczoom="1" ${x.barsPerLine ? 'disabled' : ''}>+</button></span>
      <label class="sc-jump"><span class="k mono">bar</span>
        <input class="inp sm mono" id="scJump" type="number" min="1" max="${x.totalMeasures || 9999}" placeholder="#"></label>
      <button class="tbtn" id="scMore" title="the metronome and the rest"
        aria-expanded="${ui.more ? 'true' : 'false'}">${ui.more ? '▾' : '▸'} more</button>
      <button class="btn sm" id="scRead" title="the score and nothing else">⛶ read</button>
      <button class="btn sm primary" id="scNewSec">＋ a section</button>
    </div>
    <div class="sc-bar sc-playrow" id="scPlayRow">${scorePlayBarHTML()}</div>
    <div class="sc-bar sc-ens" id="scEns" hidden></div>
    ${ui.more ? `<div class="sc-bar sc-bar2">${scoreMetroHTML(x)}</div>
      <div class="sc-bar sc-bar2">${scoreLayerPickHTML(x)}
        <span class="grow"></span>${scoreXposeHTML(x)}</div>` : ''}
    ${scoreReadStripHTML(x)}
    <div class="sc-cue" id="scCue" hidden>
      <div class="sc-cue-h"><button class="tbtn" id="scCueTog" aria-label="fold the cue strip">▾</button>
        <span class="mono faint">partner cue</span> <span class="mono" data-cuename></span></div>
      <div class="sc-cue-in"></div>
    </div>
    <div class="sc-body">
      <div class="sc-stage" id="scStage">
        <div class="sc-canvas" id="scCanvas"></div>
        <div class="sc-overlay" id="scOverlay" aria-hidden="true"></div>
        <div class="sc-marks" id="scMarks2" aria-hidden="true"></div>
        <div class="sc-pins" id="scPins"></div>
        <div class="sc-loading" id="scLoading">engraving…</div>
      </div>
      <aside class="sc-side" id="scSide">${scoreSideHTML(x)}</aside>
    </div>`;
}

/* Moving the piece into another key. Two buttons and the key it lands in,
   because the number of semitones is not what a musician is thinking about —
   "can I read this in E flat" is, and the answer wants saying in those words.

   The key is read off the engraving rather than worked out from the record,
   so what it says is what is actually on the glass: if the rewrite went wrong
   the readout is wrong with it, which is the honest failure. It is empty for
   the first frame, before there is an engraving to ask, and filled in the
   moment there is. */
function scoreXposeHTML(x){
  const by = Math.round(+x.transpose || 0);
  return `<span class="sc-xpose"><span class="k mono">key</span>
    <button class="tbtn" data-scxp="-1" title="down a semitone">♭</button>
    <span class="mono" id="scXpSay" title="${esc(transposeSaid(by))}">${esc(scoreXposeSay(x))}</span>
    <button class="tbtn" data-scxp="1" title="up a semitone">♯</button>
    <button class="tbtn" data-scxp="0" id="scXpOff" ${by ? '' : 'disabled'}
      title="back to what the composer wrote">as written</button></span>`;
}
function scoreXposeSay(x){
  const sv = scoreView();
  const key = (sv && sv.loaded && sv.scoreId === x.id) ? scoreKeyName() : '';
  const by = Math.round(+x.transpose || 0);
  const step = by ? `${by > 0 ? '+' : '−'}${Math.abs(by)}` : '';
  return key && step ? `${key} · ${step}` : (key || step);
}
function scoreXposeRepaint(x){
  const by = Math.round(+x.transpose || 0);
  $$('#scXpSay').forEach(n => { n.textContent = scoreXposeSay(x); n.title = transposeSaid(by); });
  $$('#scXpOff').forEach(n => n.disabled = !by);
}

/* Which layers are on. Named rather than iconic, because "degrees" and
   "names" look identical as symbols and you are choosing between them. */
function scoreLayerPickHTML(x){
  const ov = x.overlays || {};
  return `<span class="k mono">over the notes</span>
    <span class="sc-layers">${SCORE_OVERLAYS.map(([k, name, hint, col]) =>
      `<button class="tbtn sc-layer${ov[k] ? ' on' : ''}" data-sclayer="${k}" style="--c:${col}"
        title="${esc(hint)}">${esc(name)}</button>`).join('')}</span>`;
}

/* The metronome. It is the one thing in the room that turns reading into
   practising: it makes "slowly" a number rather than a feeling, and it hears
   the thing you cannot hear yourself doing, which is speeding up in the easy
   bar and slowing down in the hard one. */
function scoreMetroHTML(x){
  const t = scoreTimeSignature();
  const per = x.metronome.perBar || (t ? t.beats : 4);
  const on = ScoreMetronome.running;
  return `<span class="sc-metro">
    <button class="btn sm${on ? ' primary' : ''}" id="scMetro" title="${on ? 'stop' : 'start'} the click">
      ${on ? '◼' : '▶'} ♩</button>
    <i class="sc-pulse" id="scPulse" aria-hidden="true"></i>
    <span class="sc-bpm"><button class="tbtn" data-scbpm="-5">−</button>
      <input class="inp sm mono" id="scBpmIn" type="number" min="20" max="300" value="${x.metronome.bpm}">
      <button class="tbtn" data-scbpm="5">+</button></span>
    <button class="tbtn" id="scTap" title="press it in time, four or more">tap</button>
    ${scoreAccentHTML(x)}
    <label class="sc-per"><span class="k mono">beats/bar</span>
      <input class="inp sm mono" id="scPer" type="number" min="1" max="16" value="${per}"
        title="${t ? `the score is written in ${t.beats}/${t.unit}` : 'no time signature found'}"></label>
    ${scoreSigSayHTML(x)}
  </span>`;
}

/* How many bars to a line. Nought is "however many fit", which is the right
   answer for looking something up and the wrong one for reading: a column
   half a page wide fits two, and nobody reads music two bars at a time. */
function scoreBplHTML(x){
  return `<span class="sc-bpl"><span class="k mono">bars/line</span>
    <button class="tbtn" data-scbpl="-1" ${!x.barsPerLine ? 'disabled' : ''}>−</button>
    <span class="mono" id="scBplSay">${x.barsPerLine || 'fit'}</span>
    <button class="tbtn" data-scbpl="1">+</button></span>`;
}
/* Asking for a number of bars decides the size, so the size stops being
   something you set — saying so is better than two controls quietly fighting. */
function scoreZoomSay(x){
  const sv = scoreView();
  const z = (x.barsPerLine && sv && sv.fitted) ? sv.fitted.zoom : (x.zoom || 1);
  return Math.round(z * 100) + '%';
}

/* ---------- reading ----------
   A tablet on the music desk wants the notation and nothing else: no sidebar,
   no panel of notes, no toolbar sitting where the first system should be. The
   strip that carries the way out is the only thing left, and it takes itself
   away after a few seconds so that what is on the glass is a page of music. */
function scoreReadStripHTML(x){
  const ui = scoreUi();
  if(!ui.reading) return '';
  const parts = x.instruments || [];
  const secs = (x.sections || []).slice().sort((a, b) => a.startMeasure - b.startMeasure);
  return `<div class="sc-strip" id="scStrip">
    <button class="tbtn" id="scUnread" title="back to the room">✕ done</button>
    <button class="tbtn" id="scHide" title="send this away now — a press anywhere brings it back">⌄</button>
    <span class="sc-strip-t serif">${esc(x.title)}</span>
    ${scoreBplHTML(x)}
    ${parts.length > 1 ? `<span class="sc-strip-parts">${parts.map(p =>
      `<button class="tbtn${(x.hidden || []).includes(p.index) ? '' : ' on'}" data-scrpart="${p.index}">${esc(p.name)}</button>`).join('')}</span>` : ''}
    <button class="tbtn${ui.marks ? ' on' : ''}" id="scMarks" title="the bands and pins you have put on it">marks</button>
    <span class="sc-layers">${SCORE_OVERLAYS.map(([k, name, hint, col]) =>
      `<button class="tbtn sc-layer${(x.overlays || {})[k] ? ' on' : ''}" data-sclayer="${k}" style="--c:${col}"
        title="${esc(hint)}">${esc(name)}</button>`).join('')}</span>
    <span class="sc-pager"><button class="tbtn" data-scturn="-1" title="back a page">‹</button>
      <span class="mono" id="scPageSay"></span>
      <button class="tbtn" data-scturn="1" title="on a page">›</button></span>
    ${secs.length ? `<select class="sel sm" id="scSecJump"><option value="">go to…</option>${secs.map(sv =>
      `<option value="${esc(sv.id)}">${esc(sv.name)} · ${sv.startMeasure}</option>`).join('')}</select>` : ''}
    <span class="grow"></span>
    ${scorePlayBarHTML({compact: true})}
    ${scoreMetroHTML(x)}
    <span class="mono faint" id="scWake"></span>
  </div>`;
}
/* A screen that sleeps in the middle of a phrase is the one failure this mode
   cannot have. Not every browser offers the lock; where it does not, nothing
   is claimed. */
let _scWake = null;
async function scoreKeepAwake(on){
  const say = document.getElementById('scWake');
  if(!on){
    if(_scWake){ try { await _scWake.release(); } catch(e){} _scWake = null; }
    return false;
  }
  if(!navigator.wakeLock || !navigator.wakeLock.request){ if(say) say.textContent = ''; return false; }
  try {
    _scWake = await navigator.wakeLock.request('screen');
    _scWake.addEventListener('release', () => { _scWake = null; });
    if(say) say.textContent = 'screen held';
    return true;
  } catch(e){ if(say) say.textContent = ''; return false; }
}
/* Reading mode used to be the room with its furniture taken away, which left
   the browser's own furniture — tabs, address bar, bookmarks — standing over
   a page of music on a tablet propped on the piano. That is most of a
   centimetre of somebody else's interface at the top of the thing you are
   reading from. So it asks for the screen itself.

   The request has to come from a press, which it does; a browser that refuses
   it, or a page that is not allowed to ask, simply gets what it had before —
   the room without its furniture — and nothing is claimed that did not
   happen. Leaving by any route puts the screen back, including the Escape
   key, which the browser handles itself and tells us about afterwards. */
function setScoreReading(on){
  const ui = scoreUi();
  ui.reading = !!on;
  document.documentElement.classList.toggle('sc-reading', ui.reading);
  scoreKeepAwake(ui.reading);
  scoreQuietWatch(ui.reading);
  scoreFullscreen(ui.reading);
  scoreFullscreenWatch(ui.reading);
  /* the width changed by a lot, so the lines have to be broken again */
  rerender();
}
/* Everything that leaving reading mode has to undo, in one place, so a press
   on "done" and a press on "the shelf" put the same things back. */
function scoreLeaveReading(){
  const ui = scoreUi();
  if(!ui.reading){ scoreFullscreen(false); return; }
  ui.reading = false;
  document.documentElement.classList.remove('sc-reading');
  scoreKeepAwake(false);
  scoreQuietWatch(false);
  scoreFullscreen(false);
  scoreFullscreenWatch(false);
}
function scoreFullscreen(on){
  const el = document.documentElement;
  try {
    if(on){
      if(document.fullscreenElement) return true;
      const go = el.requestFullscreen || el.webkitRequestFullscreen;
      if(!go) return false;
      const p = go.call(el, {navigationUI:'hide'});
      /* a refusal is not an error worth showing: the room is already stripped
         and the only thing missing is the browser's own edges */
      if(p && p.catch) p.catch(() => {});
      return true;
    }
    if(!document.fullscreenElement && !document.webkitFullscreenElement) return false;
    /* the house is in focus mode around the score: leaving reading goes back
       to that, which is still full screen */
    if(document.documentElement.classList.contains('page-focus')) return false;
    const out = document.exitFullscreen || document.webkitExitFullscreen;
    if(!out) return false;
    const q = out.call(document);
    if(q && q.catch) q.catch(() => {});
    return true;
  } catch(e){ return false; }
}
/* The Escape key is the browser's, not ours: it leaves full screen without
   telling anybody, and a room still in reading mode with the tabs back is
   neither one thing nor the other. So the change is watched, and the room
   follows the screen out. */
let _scFs = null;
function scoreFullscreenWatch(on){
  if(_scFs){ removeEventListener('fullscreenchange', _scFs);
    removeEventListener('webkitfullscreenchange', _scFs); _scFs = null; }
  if(!on) return;
  _scFs = () => {
    if(document.fullscreenElement || document.webkitFullscreenElement) return;
    if(!scoreUi().reading) return;
    scoreLeaveReading();
    rerender();
  };
  addEventListener('fullscreenchange', _scFs);
  addEventListener('webkitfullscreenchange', _scFs);
}
/* The strip takes itself away after a few seconds and comes back on any touch.
   Which is also why a tap in reading mode wakes the strip and never pins a
   note: your hands are on the keys, and an accidental pin at bar 43 every time
   you brush the glass is worse than having no pins at all. */
let _scQuiet = null;
/* The strip takes itself away after a few seconds so that what is on the
   glass is a page of music. It used to wake on any pointer movement, which on
   a laptop meant it never stayed away for more than a moment: a mouse resting
   on the desk twitches. Now it wakes on a press or a key — things you did on
   purpose — and there is a button to send it away before the few seconds are
   up, for when you already know you are done with it. */
const SCORE_QUIET_AFTER = 3500;
function scoreQuietWatch(on){
  const root = document.documentElement;
  if(_scQuiet){
    clearTimeout(_scQuiet.timer);
    ['pointerdown','keydown'].forEach(e => removeEventListener(e, _scQuiet.wake, true));
    _scQuiet = null;
  }
  root.classList.remove('sc-quiet');
  if(!on) return;
  const hide = () => root.classList.add('sc-quiet');
  const wake = () => { root.classList.remove('sc-quiet');
    if(_scQuiet){ clearTimeout(_scQuiet.timer); _scQuiet.timer = setTimeout(hide, SCORE_QUIET_AFTER); } };
  _scQuiet = {wake, timer: setTimeout(hide, SCORE_QUIET_AFTER)};
  ['pointerdown','keydown'].forEach(e => addEventListener(e, wake, true));
}
/* away now, rather than in three seconds */
function scoreStripHide(){
  if(_scQuiet) clearTimeout(_scQuiet.timer);
  document.documentElement.classList.add('sc-quiet');
}

/* The panel beside the score. Repainted on its own, because writing a note
   about bar 48 should not cost a re-engraving of the whole Ballade. */
function scoreSideHTML(x){
  const ui = scoreUi();
  const mins = scoreMinutesOn(x, today());
  return `<div class="sc-side-tabs">
      <button class="tbtn${ui.side !== 'notebook' ? ' on' : ''}" data-scside="marks">📝 Sections</button>
      <button class="tbtn${ui.side === 'notebook' ? ' on' : ''}" data-scside="notebook">📓 Notebook</button>
      ${typeof syncRecordingsHTML === 'function' ? `<button class="tbtn${ui.side === 'recordings' ? ' on' : ''}" data-scside="recordings"
        title="a recording of this piece, the score following it">🎧 Recordings${(x.recordings || []).length ? ` <span class="mono faint">${x.recordings.length}</span>` : ''}</button>` : ''}
      <span class="grow"></span>
      ${mins ? `<span class="mono faint">${fmtHM(mins)} today</span>` : ''}
    </div>
    ${ui.side === 'notebook' ? scoreNotebookHTML(x)
      : ui.side === 'recordings' && typeof syncRecordingsHTML === 'function' ? syncRecordingsHTML(x) : scoreMarksSideHTML(x)}`;
}
function scoreMarksSideHTML(x){
  const ui = scoreUi();
  const list = (x.sections || []).slice().sort((a, b) => a.startMeasure - b.startMeasure);
  const pins = (x.pins || []).slice().sort((a, b) => a.measure - b.measure);
  return `
    ${list.length ? `<div class="sc-secs">${list.map(s => `
      <div class="sc-sec${ui.focus === s.id ? ' on' : ''}" style="--c:${esc(s.color)}" data-scsec="${esc(s.id)}">
        <div class="sc-sec-h">
          <span class="sc-sec-n serif">${esc(s.name)}</span>
          <span class="sc-sec-m mono">${s.startMeasure}–${s.endMeasure}</span>
        </div>
        ${scoreTempoSay(s)}
        ${typeof scoreSecTempoHTML === 'function' ? scoreSecTempoHTML(x, s) : ''}
        <div class="sc-sec-s mono" title="${esc((SCORE_STATUS.find(v => v[0] === s.status) || [,,''])[2])}">
          ${scoreStatusDots(s.status)} ${esc(scoreStatusName(s.status))}
          · ${s.lastPracticedDate ? esc(scoreAgo(s.lastPracticedDate)) : 'never practised'}${
            s.practiceCount ? ` · ${s.practiceCount}×` : ''}
        </div>
        ${scoreSectionStatsSay(x, s)}
        ${s.notes ? `<div class="sc-sec-notes">${linkify(s.notes)}</div>`
          : '<div class="sc-sec-notes faint">nothing written about it yet</div>'}
        <div class="sc-sec-tools">
          <button class="tbtn" data-scedit="${esc(s.id)}">notes</button>
          <button class="tbtn" data-scgo="${esc(s.id)}">jump to it</button>
          <button class="tbtn" data-scfocus="${esc(s.id)}">${ui.focus === s.id ? 'leave focus' : 'practise this'}</button>
          <button class="del-x inline" data-scsecdel="${esc(s.id)}">×</button>
        </div>
      </div>`).join('')}</div>`
      : `<div class="empty sm">No sections yet. Mark the first one — an exposition, a bridge, the eight bars that keep falling apart.</div>`}
    ${pins.length ? `<div class="sc-pinlist">
      <span class="sc-side-t">📌 Pins</span>
      ${pins.map(p => `<div class="sc-pinrow${p.ruleId ? ' rule' : ''}" style="--c:${esc(p.color)}" data-scpinrow="${esc(p.id)}"
        ${p.ruleId ? 'title="also one of the unwritten rules"' : ''}>
        <button class="sc-pin-m mono" data-scpingo="${esc(p.id)}">m.${p.measure}</button>
        <span class="sc-pin-t">${esc(p.text)}</span>
        <button class="del-x inline" data-scpindel="${esc(p.id)}">×</button>
      </div>`).join('')}</div>` : ''}
    <p class="muted sc-hint">Press any bar of the score to pin a note to it.</p>`;
}
/* The two tempos, and the distance still to go. Said only when there is
   something to say: a section nobody has put a number on is not improved by a
   row of dashes. */
function scoreTempoSay(s){
  if(!s.targetTempo && !s.comfortTempo) return '';
  const gap = (s.targetTempo && s.comfortTempo) ? s.targetTempo - s.comfortTempo : null;
  return `<span class="sc-tempo mono" title="what it is written at, and what you can hold today">♩=${
    s.comfortTempo || '?'}<em> of </em>${s.targetTempo || '?'}${
    gap > 0 ? `<b> ${gap} to go</b>` : gap !== null && gap <= 0 ? '<b> there</b>' : ''}</span>`;
}
const scoreAgo = d => { const n = daysBetween(d, today());
  return n <= 0 ? 'practised today' : n === 1 ? 'yesterday' : `${n} days ago`; };

/* ---------- drawing what sits over the notation ---------- */
/* The shape of one page, as a ratio of the stage it has to fill. Reading is
   paged; the room is a scroll, because marking a score up wants the whole of
   it under one continuous thumb and playing from it wants a page you turn. */
function scorePageShape(){
  const ui = scoreUi();
  if(!ui.reading) return null;
  const stage = document.getElementById('scStage');
  if(!stage) return null;
  /* the room the page actually gets, which is the box less its padding — take
     the whole box and the page comes out taller than the space by exactly the
     padding, which is elevenish pixels of scroll on a thing that is supposed
     to have none */
  const cs = getComputedStyle(stage);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const w = stage.clientWidth - padX, h = stage.clientHeight - padY;
  return (w > 40 && h > 40) ? clamp(h / w, 0.3, 3) : null;
}
async function scorePaint(x){
  const stage = document.getElementById('scCanvas');
  const say = document.getElementById('scLoading');
  if(!stage) return;
  if(!osmdBuiltIn()){
    if(say) say.textContent = 'The engraver is not built into this copy — your notes are safe, but there is nothing to draw them on.';
    return;
  }
  const ui = scoreUi();
  const focus = ui.focus ? scoreSection(x, ui.focus) : null;
  try {
    await openScoreIn(stage, x, Object.assign({page: scorePageShape()},
      focus ? {from:focus.startMeasure, to:focus.endMeasure} : {}));
    x.lastOpened = new Date().toISOString();
    if(say) say.remove();
    scoreDroppedPaint();
    /* the parts are only known once the file has been read, so the bar above
       the score is filled in after the first engraving rather than guessed —
       always, because before it there is nothing there to correct */
    scoreRepaintParts(x);
    scorePageSay();
    /* The notes first. Everything below only decorates them or gets ready to
       play them, and on a slow machine it was seconds more before the browser
       was allowed to show the engraving it already had. So the page is
       painted, then the marks go on, and the player (which reads the whole
       file again, for timing) and the piano wait for a quiet moment. */
    await scoreNextPaint();
    if(!stage.isConnected) return;
    scoreOverlayPaint(x);
    scoreLayersPaint(x);
    scoreXposeRepaint(x);
    scoreWhenIdle(() => {
      if(!stage.isConnected) return;
      scorePlayBind(x);
      saveNow();
      if(typeof grandPianoWarm === 'function') grandPianoWarm();
    });
  } catch(e){
    if(say) say.textContent = `That score could not be drawn — ${e.message}`;
    console.warn('score render failed', e);
  }
}
/* A mark the engraver could not place is worth one quiet line and no more.
   The music is drawn and readable; saying so beats a blank stage, and saying
   it in a box over the notes would be worse than not saying it at all. */
function scoreDroppedPaint(){
  const stage = document.getElementById('scStage');
  if(!stage) return;
  const had = stage.querySelector('.sc-dropped');
  if(had) had.remove();
  const said = scoreDroppedSay();
  if(!said) return;
  /* what actually went wrong, kept on the line itself rather than printed:
     it is a sentence for whoever comes to repair it, not for whoever is
     trying to read the music */
  const why = (scoreView() || {}).why || '';
  stage.appendChild(el(`<div class="sc-dropped mono"${
    why ? ` title="${esc(why)}"` : ''}>${esc(said)}</div>`));
}
function scoreRepaintParts(x){
  const bar = document.getElementById('scParts'); if(!bar) return;
  const parts = scoreParts(x);
  bar.innerHTML = parts.length > 1 ? parts.map(p =>
    `<label class="sc-part"><input type="checkbox" data-scpart="${p.index}" ${p.visible ? 'checked' : ''}> ${esc(p.name)}</label>`).join('')
    : '<span class="mono faint">one part</span>';
  $$('[data-scpart]', bar).forEach(b => b.onchange = () => {
    if(!setScorePartVisible(x, +b.dataset.scpart, b.checked)){
      b.checked = true; toast('Something has to be visible.'); return; }
    saveNow(); scoreRedraw(x);
  });
}
/* the bands behind the notation, and the pins above it */
function scoreOverlayPaint(x){
  const over = document.getElementById('scOverlay');
  const pinBox = document.getElementById('scPins');
  if(!over || !pinBox) return;
  const ui = scoreUi();
  if(!ui.marks){ over.innerHTML = ''; pinBox.innerHTML = '';
    const layer = document.getElementById('scMarks2'); if(layer) layer.innerHTML = '';
    return; }
  over.innerHTML = (x.sections || []).map(s => {
    const dim = ui.focus && ui.focus !== s.id;
    return measureRangeBands(s.startMeasure, s.endMeasure).map((b, i) =>
      `<i class="sc-band${dim ? ' dim' : ''}" style="--c:${esc(s.color)};left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"
        title="${esc(s.name)} — bars ${s.startMeasure}–${s.endMeasure}">${i === 0
          ? `<b class="sc-band-n">${esc(s.name)}</b>` : ''}</i>`).join('');
  }).join('');
  pinBox.innerHTML = (x.pins || []).map(p => {
    const b = measureBox(p.measure);
    if(!b) return '';
    return `<button class="sc-pin${p.ruleId ? ' rule' : ''}" data-scpin="${esc(p.id)}" style="--c:${esc(p.color)};left:${b.x + b.w / 2}px;top:${b.y}px"
      title="${esc(p.text)}">📌</button>`;
  }).join('');
  $$('[data-scpin]', pinBox).forEach(b => b.onclick = ev => { ev.stopPropagation();
    openPinModal(x.id, b.dataset.scpin); });
}
/* ---------- the layers over the notation ----------
   Letters, degrees, the count under the bar. Each is a crutch, and the point
   of a crutch is that you can put it down — so they are all off to begin
   with, each has its own ink, and each sits a different distance from the
   staff so that two at once do not land on each other.

   Drawn as their own layer rather than into the engraving, because the
   engraving is redrawn for a dozen reasons and none of them should cost the
   labels, and because a label written into the SVG is a label that prints
   and that nobody can switch off. */
function scoreLayersPaint(x){
  const box = document.getElementById('scMarks2');
  if(!box) return;
  const ov = x.overlays || {};
  if(!scoreUi().marks || !(ov.names || ov.degrees || ov.beats || ov.chords || ov.fingerings)){
    box.innerHTML = ''; return; }
  const sv = scoreView();
  const on = sv && sv.page ? sv.at : null;
  const notes = scoreNotes().filter(n => on === null || n.page === on);
  /* There used to be a ceiling here: past nine hundred note heads the layer
     refused and said so. It was the wrong call. The pieces where you most
     need to see the harmony are the thick ones, and a room that goes quiet
     exactly when you ask it the hard question is a room you stop asking. The
     labels are cheap to draw — they are absolutely positioned text, not
     layout — and if a page is too dense to read them, fewer bars to a line
     is a thing you can already do, and now it is your decision rather than
     the room's. */
  const key = scoreKey();
  const root = keyRootOf(key.fifths, key.minor);
  /* Everything is measured in staff spaces rather than pixels, because the
     engraving is drawn at whatever size the zoom or the bars-to-a-line have
     settled on and a label pinned at thirteen pixels sits on the notes at one
     size and in the next system at another. */
  const u = scoreUnitPx();
  const size = clamp(u * 0.78, 6, 15);
  const out = [];
  notes.forEach(n => {
    if(n.rest || n.midi == null) return;
    /* the letter goes ON the head, which is the only place with room for it
       in a chord — the heads of a chord are half a space apart and nothing
       fits between them */
    if(ov.names) out.push(`<i class="sc-lab sc-lab-name" style="left:${n.x}px;top:${n.y}px;font-size:${
      (size * 0.86).toFixed(1)}px">${esc(noteLetter(n))}</i>`);
    /* the degree goes beside it, for the same reason */
    if(ov.degrees) out.push(`<i class="sc-lab sc-lab-deg" style="left:${(n.x + u * 0.95).toFixed(1)}px;top:${
      n.y}px;font-size:${size.toFixed(1)}px">${esc(SCALE_DEGREES[((n.midi - root) % 12 + 12) % 12])}</i>`);
  });
  if(ov.beats) out.push(scoreBeatsHTML(notes, u, size));
  if(ov.chords) out.push(scoreChordsHTML(x, notes, u, size));
  if(ov.fingerings) out.push(scoreFingerHTML(x, notes, u, size));
  box.innerHTML = out.join('');
}
/* one staff space, in pixels, at whatever size the engraving is now */
function scoreUnitPx(){
  const sv = scoreView();
  return sv && sv.osmd ? (sv.osmd.zoom || 1) * 10 : 10;
}
function scoreChordsHTML(x, notes, u, size){
  const key = scoreKey();
  const line = scoreChordLine(notes, {flat: (+key.fifths || 0) < 0});
  /* the symbol goes over the top staff of the bar, where a lead sheet puts
     it — not over the hand that happens to be playing the lowest note */
  const tops = {};
  measureBoxes().forEach(b => { if(tops[b.measure] == null || b.y < tops[b.measure]) tops[b.measure] = b.y; });
  const over = x.chordOverrides || {};
  return line.map(c => {
    const mine = Object.prototype.hasOwnProperty.call(over, c.key);
    const said = mine ? over[c.key] : c.say;
    if(!said) return '';
    const top = (tops[c.measure] == null ? 0 : tops[c.measure]) - u * 1.1;
    const why = mine ? 'yours \u2014 press to change it'
      : c.sure ? 'read off the notes \u2014 press to change it'
      : 'read off the notes, but not confidently \u2014 press to change it';
    return `<i class="sc-lab sc-lab-chord${c.sure ? '' : ' unsure'}${mine ? ' mine' : ''}"
      data-scchord="${esc(c.key)}" title="${esc(why)} (bar ${c.measure}, beat ${c.beat + 1})"
      style="left:${c.x.toFixed(1)}px;top:${top.toFixed(1)}px;font-size:${(size * 1.15).toFixed(1)}px"
      >${esc(said)}</i>`;
  }).join('');
}
/* ---------- the notebook ----------
   A practice log that only says "practised today" is a log you stop keeping,
   because nothing in it ever tells you anything. What is worth writing down
   is what you were after, how fast you got it and what you found out — and
   what that adds up to over a month is two pictures you cannot get any other
   way: the tempo climbing, and the section you have quietly been avoiding.

   Both are drawn from the log rather than kept as counters, so nothing can
   drift out of step with what actually happened. */
function scoreNotebookHTML(x){
  const nb = scoreNotebook(x);
  if(!nb.sessions) return `<div class="empty sm">Nothing logged yet. After a sitting,
    write down what you worked on and how fast you got it \u2014 a month of that is the
    only evidence slow practice is working.</div>
    <div class="row" style="margin-top:10px"><button class="btn sm primary" id="scLogAny">Log a sitting</button></div>`;
  return `<div class="sc-nb-top">
      <span class="mono">${nb.sessions} sitting${nb.sessions === 1 ? '' : 's'}</span>
      <span class="mono faint">${fmtHM(nb.minutes)} in all</span>
      ${nb.from && nb.to ? `<span class="mono">\u2669=${nb.from} \u2192 ${nb.to}</span>` : ''}
      ${nb.mood != null ? `<span class="mono faint" title="the average of the last ten">${
        esc(SCORE_QUALITY[Math.round(nb.mood)][1].toLowerCase())} lately</span>` : ''}
    </div>
    ${scoreTempoChartHTML(nb)}
    ${scoreHeatHTML(x, nb)}
    <div class="row" style="margin:10px 0 6px"><button class="btn sm primary" id="scLogAny">Log a sitting</button></div>
    <div class="sc-nb-list">${nb.rows.map(r => scoreSittingHTML(x, r)).join('')}</div>`;
}
/* The tempo over time, with the fastest anything is written at as the line to
   get to. Drawn only once there are two points: one dot is not a trend and a
   chart of it says something it cannot know. Sittings played with the room
   as a partner are their own line (hollow dots, the second colour), because
   holding a tempo against somebody else's is a different thing from holding
   it alone — the two are on one axis and one time line, never two scales. */
function scoreTempoChartHTML(nb){
  if(nb.tempos.length < 2) return '';
  const W = 270, H = 74, pad = 4;
  const lo = Math.min(...nb.tempos.map(t => t.tempo), nb.target || Infinity) - 6;
  const hi = Math.max(...nb.tempos.map(t => t.tempo), nb.target || 0) + 6;
  const span = Math.max(1, hi - lo);
  const at = (t, i) => [pad + (W - pad * 2) * (nb.tempos.length < 2 ? 0 : i / (nb.tempos.length - 1)),
    H - pad - (H - pad * 2) * ((t - lo) / span)];
  const pts = nb.tempos.map((t, i) => ({t, q: at(t.tempo, i)}));
  const alone = pts.filter(p => !p.t.partner), duo = pts.filter(p => p.t.partner);
  const path = list => list.length > 1 ? list.map((p, i) => `${i ? 'L' : 'M'}${p.q[0].toFixed(1)} ${p.q[1].toFixed(1)}`).join(' ') : '';
  const targetY = nb.target ? at(nb.target, 0)[1] : null;
  const tip = p => `<title>${esc(fmtDate(p.t.date, 'short'))} \u00b7 \u2669=${p.t.tempo}${p.t.partner ? ' \u00b7 with the partner' : ''}</title>`;
  return `<div class="sc-nb-chart"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img"
      aria-label="tempo of each sitting over time${duo.length ? ', alone and with the partner' : ''}">
    ${targetY != null ? `<line x1="0" y1="${targetY.toFixed(1)}" x2="${W}" y2="${targetY.toFixed(1)}"
      class="sc-nb-target" stroke-dasharray="4 4" stroke-width="1"/>` : ''}
    ${path(alone) ? `<path d="${path(alone)}" fill="none" class="sc-nb-s1" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
    ${path(duo) ? `<path d="${path(duo)}" fill="none" class="sc-nb-s2" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
    ${alone.map(p => `<circle cx="${p.q[0].toFixed(1)}" cy="${p.q[1].toFixed(1)}" r="4" class="sc-nb-d1">${tip(p)}</circle>`).join('')}
    ${duo.map(p => `<circle cx="${p.q[0].toFixed(1)}" cy="${p.q[1].toFixed(1)}" r="4" class="sc-nb-d2" stroke-width="2">${tip(p)}</circle>`).join('')}
  </svg>
  ${duo.length ? `<div class="sc-nb-legend mono sm"><span><i class="sc-nb-k1"></i>on your own</span>
    <span><i class="sc-nb-k2"></i>with the partner</span></div>` : ''}
  <div class="mono faint sm">${nb.target ? `the dashed line is \u2669=${nb.target}, what it is written at`
    : 'no target tempo written on any section yet'}</div></div>`;
}
/* Which sections have had the time. The one at the bottom of this list is the
   thing the notebook is for. */
function scoreHeatHTML(x, nb){
  if(!nb.heat.length) return '';
  const top = Math.max(1, ...nb.heat.map(h => h.sessions));
  const cold = nb.heat.filter(h => !h.sessions);
  return `<div class="sc-heat">
    ${nb.heat.map(h => `<div class="sc-heat-row" style="--c:${esc(h.section.color)}">
      <span class="sc-heat-n">${esc(h.section.name)}</span>
      <span class="sc-heat-bar"><i style="width:${Math.round(100 * h.sessions / top)}%"></i></span>
      <span class="mono faint">${h.sessions ? `${h.sessions}\u00d7` : '\u2014'}</span>
    </div>`).join('')}
    ${cold.length ? `<p class="faint sm" style="margin:6px 0 0">${cold.length === 1
      ? `${esc(cold[0].section.name)} has never been practised.`
      : `${cold.length} sections have never been practised.`}</p>` : ''}
  </div>`;
}
function scoreSittingHTML(x, r){
  const names = (r.sections || []).map(id => (scoreSection(x, id) || {}).name).filter(Boolean);
  return `<div class="sc-sitting">
    <div class="sc-sitting-h">
      <span class="mono">${esc(fmtDate(r.date, 'short'))}</span>
      <span class="mono faint">${r.minutes ? fmtHM(r.minutes) : ''}</span>
      ${r.quality ? `<span class="sc-q sc-q-${esc(r.quality)}">${esc(scoreQualityName(r.quality))}</span>` : ''}
      <span class="grow"></span>
      ${r.tempo ? `<span class="mono">\u2669=${r.tempo}</span>` : ''}
      <button class="del-x inline" data-scsitdel="${esc(r.id)}">\u00d7</button>
    </div>
    ${names.length ? `<div class="mono faint sm">${esc(names.join(' \u00b7 '))}</div>` : ''}
    ${scoreSittingPlaySay(r)}
    ${r.focus ? `<div class="sc-sitting-f">${esc(r.focus)}</div>` : ''}
    ${r.discoveries ? `<div class="sc-sitting-d">${linkify(r.discoveries)}</div>` : ''}
  </div>`;
}
/* how it was played along with, when it was */
function scoreSittingPlaySay(r){
  const bits = [];
  if(r.withPartnerPlayback) bits.push('with the partner');
  if(r.tempoPercent) bits.push(`${r.tempoPercent}% of the score's tempo`);
  if(r.finalGuideLevel != null && typeof ensGuideWords === 'function') bits.push(ensGuideWords(r.finalGuideLevel));
  if(r.loopsCompleted) bits.push(`${r.loopsCompleted} loop${r.loopsCompleted === 1 ? '' : 's'}`);
  return bits.length ? `<div class="mono faint sm sc-sitting-p">${r.withPartnerPlayback ? '🎼 ' : ''}${esc(bits.join(' \u00b7 '))}</div>` : '';
}
/* What the log knows about a section that the section record does not: how
   many sittings it has had, and the fastest it has ever been logged at. */
function scoreSectionStatsSay(x, s){
  const best = scoreSectionBest(x, s.id);
  const mins = sum(scorePracticeOf(x, s.id).map(r => +r.minutes || 0));
  if(!best && !mins) return '';
  return `<div class="sc-sec-s mono faint">${mins ? fmtHM(mins) : ''}${
    best ? `${mins ? ' \u00b7 ' : ''}best \u2669=${best}${s.targetTempo ? ` of ${s.targetTempo}` : ''}` : ''}</div>`;
}

/* ---------- printing ----------
   Three copies, because they are three different objects: the clean one you
   put on a stand, the one with the sections marked so you can see the shape,
   and the practice copy with everything you have written on it.

   Whatever is on the glass, the printed thing is the whole piece as one long
   page: printing a paginated reading view prints the page you happen to be
   looking at, and printing a focused section prints eight bars. So the score
   is re-engraved unclipped and unpaginated first, and put back afterwards. */
const SCORE_PRINTS = [
  ['score',      'Score only',        'clean, for the stand'],
  ['sections',   'With the sections', 'the shape of the piece, lightly marked'],
  ['everything', 'Everything',        'a practice copy \u2014 pins, fingerings, chords and all']];
async function scorePrint(x, mode){
  const doc = document.documentElement;
  const ui = scoreUi();
  const was = ui.reading, focus = ui.focus;
  try {
    /* out of reading and out of focus by hand rather than through the room's
       own switches: those rebuild the page, and the thing being printed is
       the engraving standing in it. Nothing is repainted that does not have
       to be, and both are put back in the same breath. */
    ui.reading = false; ui.focus = null;
    doc.classList.remove('sc-reading');
    await renderScore(x, {page:null, from:null, to:null});
    scoreOverlayPaint(x); scoreLayersPaint(x);
    doc.dataset.scprint = SCORE_PRINTS.some(q => q[0] === mode) ? mode : 'score';
    await new Promise(r => setTimeout(r, 80));
    if(typeof window.print === 'function') window.print();
  } catch(e){ console.warn('score print failed', e); }
  finally {
    delete doc.dataset.scprint;
    ui.reading = was; ui.focus = focus;
    doc.classList.toggle('sc-reading', was);
    await scoreRedraw(x);
  }
  return true;
}
function openPrintModal(scoreId){
  const x = scoreById(scoreId); if(!x) return null;
  const m = openModal(`<h2>Print ${esc(x.title)}</h2>
    <div class="sc-prints">${SCORE_PRINTS.map(([k, name, hint]) =>
      `<button class="btn" data-scprint="${k}"><b>${esc(name)}</b><span class="faint sm">${esc(hint)}</span></button>`).join('')}</div>`,
    'narrow sc-modal');
  $$('[data-scprint]', m).forEach(b => b.onclick = async () => {
    m.remove(); await scorePrint(x, b.dataset.scprint);
  });
  return m;
}

/* ---------- fingerings ----------
   The one layer that is not read off the notation but written onto it. A
   fingering is a decision — which of five fingers takes this note, given what
   the hand has to do next — and it is the decision you lose first and spend
   the longest rediscovering, which is why writing it down is worth this much
   machinery.

   It is anchored to the bar, the beat, the staff and the note's place in the
   chord, counting from the bottom. Not to anything the engraver hands out:
   those identities are rebuilt every time the file is read, so a fingering
   pinned to one would not survive a zoom, let alone a transposition. */
function scoreFingerKeys(notes){
  const groups = {};
  notes.forEach(n => { if(n.midi == null) return;
    const g = `${n.measure}|${Math.round(n.at * 48)}|${n.staff}`;
    (groups[g] = groups[g] || []).push(n); });
  const out = new Map();
  Object.keys(groups).forEach(g => groups[g].sort((a, b) => a.midi - b.midi)
    .forEach((n, i) => out.set(n, `${g}|${i}`)));
  return out;
}
/* Right hand above the note, left hand below — which is where a century of
   engraving puts them, and which is also the only arrangement that stays
   readable when both hands have something to say about the same beat. */
function scoreFingerHTML(x, notes, u, size){
  const keys = scoreFingerKeys(notes);
  const have = x.fingerings || {};
  const out = [];
  keys.forEach((k, n) => {
    const v = have[k];
    if(!v || !v.finger) return;
    const up = v.hand !== 'L';
    out.push(`<i class="sc-lab sc-fing ${up ? 'rh' : 'lh'}" data-scfing="${esc(k)}"
      title="${up ? 'right' : 'left'} hand, finger ${v.finger} \u2014 press to change it"
      style="left:${n.x.toFixed(1)}px;top:${(n.y + (up ? -u * 1.7 : u * 1.7)).toFixed(1)}px;font-size:${
      (size * 0.82).toFixed(1)}px">${v.finger}</i>`);
  });
  return out.join('');
}
/* The note a fingering belongs to, found again on whatever is drawn now. */
function scoreNoteByKey(key){
  const sv = scoreView();
  const on = sv && sv.page ? sv.at : null;
  const notes = scoreNotes().filter(n => n.midi != null && (on === null || n.page === on));
  const keys = scoreFingerKeys(notes);
  for(const [n, k] of keys) if(k === key) return {note: n, key};
  return null;
}
/* Which note head a press landed on. Within about a space and a half, which
   is close enough to be deliberate and far enough to be hittable on glass. */
function scoreNoteAt(px, py){
  const sv = scoreView();
  const on = sv && sv.page ? sv.at : null;
  const notes = scoreNotes().filter(n => n.midi != null && (on === null || n.page === on));
  const reach = scoreUnitPx() * 1.8;
  let best = null, gap = reach;
  notes.forEach(n => { const d = Math.hypot(n.x - px, n.y - py); if(d < gap){ gap = d; best = n; } });
  if(!best) return null;
  return {note: best, key: scoreFingerKeys(notes).get(best)};
}
/* Ten buttons and a way out. A modal would be the house style and would be
   wrong here: you are choosing fingerings for a run of notes and a dialogue
   that has to be dismissed between each one turns a minute into ten. */
function openFingerPicker(x, hit){
  const stage = document.getElementById('scStage');
  if(!stage || !hit) return null;
  $$('.sc-fingpick').forEach(n => n.remove());
  const now = (x.fingerings || {})[hit.key] || {};
  const row = (hand, label) => `<span class="sc-fingrow"><b class="mono">${label}</b>${
    [1,2,3,4,5].map(f => `<button class="tbtn${now.hand === hand && now.finger === f ? ' on' : ''}"
      data-fing="${hand}${f}">${f}</button>`).join('')}</span>`;
  const box = document.createElement('div');
  box.className = 'sc-fingpick';
  box.style.left = `${hit.note.x}px`;
  box.style.top = `${hit.note.y + scoreUnitPx() * 2.4}px`;
  box.innerHTML = `${row('R', 'RH')}${row('L', 'LH')}
    <span class="sc-fingrow"><button class="tbtn" data-fing="">clear</button>
      <button class="tbtn" data-fingclose="1">\u2715</button></span>`;
  stage.appendChild(box);
  const shut = () => box.remove();
  $$('[data-fing]', box).forEach(b => b.onclick = ev => { ev.stopPropagation();
    const v = b.dataset.fing;
    if(v) x.fingerings[hit.key] = {hand: v[0], finger: +v[1]};
    else delete x.fingerings[hit.key];
    /* writing a fingering on a score you cannot see the fingerings of is a
       trap you fall into once and never work out */
    x.overlays.fingerings = true;
    saveNow(); sound('click'); shut(); scoreLayersPaint(x);
  });
  const close = box.querySelector('[data-fingclose]');
  if(close) close.onclick = ev => { ev.stopPropagation(); shut(); };
  return box;
}

/* Anything read off the notes can be wrong, and a chord symbol you cannot
   correct is worse than none: you would stop trusting the whole layer. */
function openChordModal(scoreId, key){
  const x = scoreById(scoreId); if(!x) return null;
  const over = x.chordOverrides || {};
  const mine = Object.prototype.hasOwnProperty.call(over, key);
  const [bar, at] = key.split('|');
  const m = openModal(`<h2>The chord at bar ${esc(bar)}</h2>
    <div class="mono faint">beat ${Math.round(+at / 12) + 1}</div>
    <label class="pd-q" style="margin-top:8px"><span class="k">what to call it</span>
      <input class="inp" id="chSay" autofocus placeholder="Am7, F\u266f\u00b07, B\u266d/D\u2026" value="${esc(mine ? over[key] : '')}"></label>
    <p class="faint sm" style="margin:8px 0 0">Leave it empty to say nothing at all here.</p>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${mine ? `<button class="btn sm ghost" id="chAuto">Read it off the notes again</button><span class="grow"></span>` : ''}
      <button class="btn primary" id="chSave">Save</button></div>`, 'narrow sc-modal');
  const done = () => { saveNow(); m.remove(); scoreLayersPaint(x); };
  m.querySelector('#chSave').onclick = () => {
    x.chordOverrides[key] = m.querySelector('#chSay').value.trim();
    sound('success'); done();
  };
  const auto = m.querySelector('#chAuto');
  if(auto) auto.onclick = () => { delete x.chordOverrides[key]; sound('click'); done(); };
  return m;
}
/* The count, once under each beat that has something on it, and only under
   the top staff — counting is one thing you do with the whole bar, not one
   per hand. */
function scoreBeatsHTML(notes, u, size){
  /* one count per moment that has something on it, under the top staff only:
     counting is a thing you do with the whole bar rather than once per hand */
  const per = {};
  notes.forEach(n => {
    if(n.staff) return;
    const k = `${n.measure}|${Math.round(n.beat * 48)}`;
    if(!per[k] || n.y < per[k].y) per[k] = n;
  });
  const t = scoreTimeSignature();
  const beats = t ? t.beats : 4;
  const unitOf = t ? 4 / t.unit : 1;
  /* the count sits below the staff rather than below the note, so a row of
     them is a row rather than a line that follows the tune up and down */
  const lines = {};
  Object.values(per).forEach(n => { const k = Math.round(n.y / (u * 4));
    lines[k] = Math.max(lines[k] ?? -Infinity, n.y); });
  return Object.values(per).map(n => {
    const b = n.beat / unitOf;
    const whole = Math.abs(b - Math.round(b)) < 0.01;
    const say = whole ? String((Math.round(b) % beats) + 1) : '+';
    const floor = lines[Math.round(n.y / (u * 4))] ?? n.y;
    return `<i class="sc-lab sc-lab-beat${whole ? '' : ' weak'}" style="left:${n.x}px;top:${
      (floor + u * 3.4).toFixed(1)}px;font-size:${size.toFixed(1)}px">${say}</i>`;
  }).join('');
}

/* a re-engraving, for the three things that really change the picture */
async function scoreRedraw(x){
  const ui = scoreUi();
  const focus = ui.focus ? scoreSection(x, ui.focus) : null;
  try {
    await renderScore(x, Object.assign({page: scorePageShape()},
      focus ? {from:focus.startMeasure, to:focus.endMeasure} : {from:null, to:null}));
    scoreOverlayPaint(x);
    scoreLayersPaint(x);
    scoreXposeRepaint(x);
    scorePageSay();
    scorePlayBind(x);
  } catch(e){ console.warn('score redraw failed', e); }
}
/* ---------- hearing it ----------
   The bar under the toolbar (and its small copy on the reading strip) plays
   what is drawn: in the key it has been moved to, only the bars of the
   section in focus, turning the page when the music does. The tempo, loop and
   which hands are heard are kept with the piece. */
function scorePlayCfg(x){
  /* the ensemble's hooks: who is heard and how loud, a section's own tempo,
     the fermatas, the places to wait, the guide fading at each loop */
  return Object.assign(typeof scoreEnsembleCfg === 'function' ? scoreEnsembleCfg(x) : {}, {
    xml: () => scoreXmlFor(x),
    osmd: () => { const v = scoreView(); return v && v.scoreId === x.id ? v.osmd : null; },
    host: document.getElementById('scStage'), svgRoot: document.getElementById('scCanvas'),
    range: () => { const u = scoreUi(); const f = u.focus ? scoreSection(x, u.focus) : null;
      return f ? [f.startMeasure, f.endMeasure] : null; },
    onPage: p => { const v = scoreView(); if(!v || !v.page || v.at === p) return;
      showScorePage(p); scoreOverlayPaint(x); scoreLayersPaint(x); scorePageSay(); },
    store: {get: () => x.playback || {}, set: v => { x.playback = v;
      if(x.ensembleSettings){ x.ensembleSettings.countInBars = +v.countIn || 0;
        x.ensembleSettings.tempoPercent = v.pct != null ? Math.round(+v.pct) : 100; }
      saveNow(); }},
    /* a recording synced to the piece can lend its timing and dynamics (19-sync-e-memory.js) */
    timings: () => (x.recordings || []).filter(r => r.map).map(r => ({id: r.id, name: r.name, dyn: !!r.memory})),
    timingFor: (id, tl, bpm) => { const r = (x.recordings || []).find(v => v.id === id); if(!r || typeof syncTiming !== 'function') return null;
      try { return {map: syncTiming(r, tl, bpm), velOf: syncVelOf(r, tl)}; } catch(e){ console.warn('timing', e); return null; } },
    /* the play bar's click and count-in follow the piece's metronome */
    accent: {get: () => x.metronome.accent !== false, set: v => scoreSetAccent(x, v)},
    swing: false});
}
function scorePlayBind(x){
  if(typeof scorePlayAttach !== 'function') return;
  $$('#scPlayRow .plx-bar, #scStrip .plx-bar').forEach(bar => {
    try {
      if(bar._plx && bar._plxFor === x.id) bar._plx.redrawn();
      else { scorePlayAttach(bar, scorePlayCfg(x)); bar._plxFor = x.id; }
      /* space taps the tempo, while it plays, when the room is asked to follow */
      if(bar._plx && typeof ensembleSpace === 'function') bar._plx.onSpace = () => ensembleSpace(x, bar._plx);
    } catch(e){ console.warn('the player could not attach', e); }
  });
  if(typeof scoreEnsemblePaint === 'function'){ scoreEnsemblePaint(x); ensembleCuePaint(x); }
}
/* and a repaint of the words, for everything else */
function scoreSidePaint(x){
  const side = document.getElementById('scSide');
  if(!side) return;
  side.innerHTML = scoreSideHTML(x);
  bindScoreSide(side, x);
}

/* ---------- loading a file ---------- */
function scorePickFile(){
  const el = document.getElementById('scFile');
  if(el) return el.click();
  /* the picker lives on the shelf, so reach it from anywhere else */
  navigate('#/score');
  setTimeout(() => { const again = document.getElementById('scFile'); if(again) again.click(); }, 400);
}
async function takeScoreFile(file){
  if(!file) return null;
  try {
    const xml = await readMusicXmlFile(file);
    if(!/<score-partwise|<score-timewise/i.test(xml)){
      toast('That file is not MusicXML. Export the score as MusicXML — a PDF or a picture has nothing in it to mark up.', 6000);
      return null;
    }
    const {title, composer} = musicXmlTitle(xml, file.name);
    const rec = addScore({title, composer, musicXml:xml});
    sound('success');
    toast(`${title} is on the shelf — ${scoreSaid(scoreWeight(rec))}.`);
    scoreUi().id = rec.id; scoreUi().focus = null;
    navigate('#/score/' + rec.id);
    return rec;
  } catch(e){
    toast(`That file could not be read — ${e.message}`, 6000);
    return null;
  }
}

/* ---------- what the piece is ----------
   The title and the composer come off the file, and files lie: half the
   MusicXML on the internet is called "Untitled" by "Unknown", and the other
   half spells the composer four different ways, which is enough to make a
   composer filter useless. So all three are yours to set, and the period —
   which no file carries at all — is set here or nowhere. */
function openScoreDetails(id){
  const x = scoreById(id);
  if(!x) return null;
  const guess = scorePeriodGuess(x.composer);
  const m = openModal(`<h2>\u{1F3BC} What this piece is</h2>
    <label class="pd-q"><span class="k">title</span>
      <input class="inp" id="sdTitle" autofocus value="${esc(x.title)}"></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">composer</span>
      <input class="inp" id="sdComposer" value="${esc(x.composer)}"
        placeholder="the way you want it to sort \u2014 Chopin, not Fr\u00e9d\u00e9ric Fran\u00e7ois Chopin"></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">how well you know it</span>
      <select class="sel" id="sdFam">${SCORE_FAMILIAR.map(([k, n, hint]) =>
        `<option value="${k}" ${x.familiar === k ? 'selected' : ''}>${esc(n)} \u2014 ${esc(hint)}</option>`).join('')}</select></label>
    <label class="pd-q" style="margin-top:8px"><span class="k">period</span>
      <select class="sel" id="sdPeriod"><option value="">${guess
        ? `let the name decide \u2014 ${esc(scorePeriodName(guess))}` : 'not set'}</option>${
        SCORE_PERIODS.map(([v, n]) =>
          `<option value="${v}" ${x.period === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    <p class="faint sm">The period is only ever a guess until you set it here. Nothing else in the room writes it.</p>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn primary" id="sdSave">Save</button></div>`);
  m.querySelector('#sdSave').onclick = () => {
    x.title = m.querySelector('#sdTitle').value.trim() || x.title;
    x.composer = m.querySelector('#sdComposer').value.trim();
    x.period = m.querySelector('#sdPeriod').value || null;
    x.familiar = m.querySelector('#sdFam').value;
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
/* The engraver is a megabyte of code, compiled the first time a score is
   drawn — a second or more on a slow machine, spent after the press. So it is
   compiled before the press where there is a chance: when the shelf is idle,
   and at once when a finger or a pointer comes near a score. */
function scoreWarmEngraver(now){
  if(typeof opensheetmusicdisplay !== 'undefined' || !osmdBuiltIn()) return;
  const go = () => { osmdBoot().catch(() => {}); };
  if(now) return go();
  if(typeof requestIdleCallback === 'function') requestIdleCallback(go, {timeout: 2500}); else setTimeout(go, 600);
}
/* a pointer or a finger on the way to the room starts the compile, so it is
   done or nearly done by the time the click lands */
document.addEventListener('pointerover', ev => {
  const a = ev.target && ev.target.closest && ev.target.closest('a[href^="#/score"], [data-page="score"]');
  if(a) scoreWarmEngraver(true);
}, {passive: true});
document.addEventListener('pointerdown', ev => {
  const a = ev.target && ev.target.closest && ev.target.closest('a[href^="#/score"], [data-page="score"]');
  if(a) scoreWarmEngraver(true);
}, {passive: true, capture: true});
/* the next frame the browser actually paints, so a thing just drawn is seen
   before anything slower is started */
const scoreNextPaint = () => new Promise(res => requestAnimationFrame(() => setTimeout(res, 0)));
const scoreWhenIdle = (fn, timeout = 400) => typeof requestIdleCallback === 'function'
  ? requestIdleCallback(fn, {timeout}) : setTimeout(fn, 60);
function bindScoreLibrary(root){
  const file = root.querySelector('#scFile');
  $$('[data-scopen]', root).forEach(b => {
    const warm = () => scoreWarmEngraver(true);
    b.addEventListener('pointerenter', warm, {once: true});
    b.addEventListener('pointerdown', warm, {once: true});
    b.addEventListener('focus', warm, {once: true});
  });
  const drop = root.querySelector('#scDrop');
  if(file) file.onchange = () => { const f = file.files && file.files[0]; file.value = ''; takeScoreFile(f); };
  if(drop){
    drop.onclick = () => file && file.click();
    drop.onkeydown = ev => { if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); file && file.click(); } };
    drop.addEventListener('dragover', ev => { ev.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', ev => { ev.preventDefault(); drop.classList.remove('over');
      takeScoreFile(ev.dataTransfer.files && ev.dataTransfer.files[0]); });
  }
  $$('[data-scopen]', root).forEach(b => b.onclick = () => {
    scoreUi().id = b.dataset.scopen; scoreUi().focus = null; navigate('#/score/' + b.dataset.scopen); });
  $$('[data-scdel]', root).forEach(b => b.onclick = () => {
    const x = scoreById(b.dataset.scdel); if(!x) return;
    requestDelete({label: x.title, node: b.closest('.sc-item, .sc-invrow'), after: rerender,
      remove: () => removeScore(x.id)});
  });
  bindScoreInventory(root);
  bindScoreRules(root);
}
function bindScoreInventory(root){
  const f = scoreFilters();
  const redraw = () => { saveNow(); rerender(); };
  const q = root.querySelector('#scinvq');
  /* typed rather than pressed, so it filters as you go and keeps the caret
     where it was — a rerender would take the focus with it otherwise */
  if(q) q.oninput = debounce(() => { f.q = q.value; saveNow();
    const at = q.selectionStart; rerender();
    const again = document.getElementById('scinvq');
    if(again){ again.focus(); again.setSelectionRange(at, at); } }, 220);
  const pick = (sel, key) => { const n = root.querySelector(sel); if(n)
    n.onchange = () => { f[key] = n.value; redraw(); }; };
  pick('#scinvState', 'state'); pick('#scinvShape', 'shape'); pick('#scinvSort', 'sort');
  pick('#scinvComposer', 'composer'); pick('#scinvPeriod', 'period'); pick('#scinvFam', 'familiar');
  /* set right on the row: it is the one thing you come to this list to
     change, and a modal for an eight-way choice is two presses too many */
  $$('[data-scfam]', root).forEach(n => n.onchange = () => {
    const x = scoreById(n.dataset.scfam); if(!x) return;
    x.familiar = n.value; sound('click'); redraw(); });
  $$('[data-scdetails]', root).forEach(b => b.onclick = () => openScoreDetails(b.dataset.scdetails));
  const clear = root.querySelector('#scinvClear');
  if(clear) clear.onclick = () => { f.q = ''; f.state = 'all'; f.shape = 'all';
    f.composer = 'all'; f.period = 'all'; f.familiar = 'all'; redraw(); };
}

function bindScoreViewer(root, x){
  const ui = scoreUi();
  const on = (sel, fn) => { const n = root.querySelector(sel); if(n) n.onclick = fn; };
  /* It was an anchor with a click handler on it, which is two ways back: the
     handler cleared the score and redrew, the redraw read the id straight
     back out of the address it was still at, and only the anchor's own
     navigation — a beat later — actually left. One press, one navigation. */
  on('#scBack', () => { ui.id = null; ui.focus = null;
    scoreLeaveReading();
    saveNow(); navigate('#/score'); });
  $$('[data-scdetails]', root).forEach(b => b.onclick = () => openScoreDetails(b.dataset.scdetails));
  on('#scNewSec', () => openSectionModal(x.id));
  on('#scUnfocus', () => { ui.focus = null; rerender(); });
  on('#scLog', () => openScoreLogModal(x.id, ui.focus));
  on('#scSolo', () => { const parts = scoreParts(x);
    x.hidden = parts.slice(1).map(p => p.index); applyScoreParts(x); saveNow();
    scoreRepaintParts(x); scoreRedraw(x); });
  on('#scAllParts', () => { x.hidden = []; applyScoreParts(x); saveNow();
    scoreRepaintParts(x); scoreRedraw(x); });
  on('#scMore', () => { ui.more = !ui.more; saveNow(); rerender(); });
  $$('[data-sclayer]', root).forEach(b => b.onclick = () => {
    const k = b.dataset.sclayer;
    x.overlays[k] = !x.overlays[k];
    b.classList.toggle('on', x.overlays[k]);
    saveNow(); scoreLayersPaint(x);
  });
  const marks = root.querySelector('#scMarks2');
  if(marks) marks.onclick = ev => {
    const chord = ev.target.closest('[data-scchord]');
    if(chord){ ev.stopPropagation(); openChordModal(x.id, chord.dataset.scchord); return; }
    /* a fingering already written is the handle for changing it: it sits a
       space and a half off the note and pressing the note again is fiddly */
    const fing = ev.target.closest('[data-scfing]');
    if(fing){ ev.stopPropagation();
      const hit = scoreNoteByKey(fing.dataset.scfing);
      if(hit) openFingerPicker(x, hit); }
  };
  bindScoreMetro(root, x);
  on('#scRead', () => setScoreReading(true));
  on('#scUnread', () => setScoreReading(false));
  on('#scHide', () => scoreStripHide());
  on('#scMarks', () => { const u = scoreUi(); u.marks = !u.marks; saveNow();
    const btn = root.querySelector('#scMarks'); if(btn) btn.classList.toggle('on', u.marks);
    scoreOverlayPaint(x); scoreLayersPaint(x); });
  $$('[data-scxp]', root).forEach(b => b.onclick = async () => {
    const step = +b.dataset.scxp;
    x.transpose = step ? clamp((+x.transpose || 0) + step, -12, 12) : 0;
    saveNow();
    await scoreRedraw(x);
  });
  $$('[data-scbpl]', root).forEach(b => b.onclick = async () => {
    const step = +b.dataset.scbpl;
    /* off the bottom is back to letting it fit as many as it can */
    x.barsPerLine = clamp((+x.barsPerLine || 0) + (x.barsPerLine === 0 && step > 0 ? 4 : step), 0, 16);
    if(x.barsPerLine === 1) x.barsPerLine = step > 0 ? 2 : 0;
    saveNow();
    await scoreRedraw(x);
    scoreBplRepaint(x);
  });
  $$('[data-scrpart]', root).forEach(b => b.onclick = async () => {
    const i = +b.dataset.scrpart;
    const showing = !(x.hidden || []).includes(i);
    if(!setScorePartVisible(x, i, !showing)){ toast('Something has to be visible.'); return; }
    b.classList.toggle('on', !showing);
    saveNow(); await scoreRedraw(x);
  });
  const secJump = root.querySelector('#scSecJump');
  if(secJump) secJump.onchange = () => { const sec = scoreSection(x, secJump.value);
    if(sec) scoreScrollTo(sec.startMeasure); secJump.value = ''; };
  $$('[data-sczoom]', root).forEach(b => b.onclick = () => {
    x.zoom = clamp((+x.zoom || 1) + (+b.dataset.sczoom) * 0.15, 0.4, 2.5);
    const say = root.querySelector('#scZoomSay');
    if(say) say.textContent = Math.round(x.zoom * 100) + '%';
    saveNow(); scoreRedraw(x);
  });
  $$('[data-scpart]', root).forEach(b => b.onchange = () => {
    if(!setScorePartVisible(x, +b.dataset.scpart, b.checked)){
      b.checked = true; toast('Something has to be visible.'); return; }
    saveNow(); scoreRedraw(x);
  });
  const jump = root.querySelector('#scJump');
  if(jump) jump.onchange = () => { const n = +jump.value; if(n >= 1) scoreScrollTo(n); };
  /* a press on the notation pins a note to the bar it landed in */
  $$('[data-scturn]', root).forEach(b => b.onclick = ev => { ev.stopPropagation();
    scoreTurn(+b.dataset.scturn, x); });
  const stage = root.querySelector('#scStage');
  /* reading: the outer thirds turn, the middle does nothing but wake the strip */
  if(stage && ui.reading){
    stage.addEventListener('click', ev => {
      const r = stage.getBoundingClientRect();
      const at = (ev.clientX - r.left) / r.width;
      if(at > 0.72) scoreTurn(1, x);
      else if(at < 0.28) scoreTurn(-1, x);
    });
    let swipe = null;
    stage.addEventListener('pointerdown', ev => { swipe = {x:ev.clientX, y:ev.clientY, t:Date.now()}; });
    stage.addEventListener('pointerup', ev => {
      if(!swipe) return;
      const dx = ev.clientX - swipe.x, dy = ev.clientY - swipe.y, took = Date.now() - swipe.t;
      swipe = null;
      /* a swipe is sideways, quick, and further across than down — otherwise
         it is a scroll on a page that happens to be taller than the glass, or
         a finger that came to rest on the score */
      if(Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || took > 900) return;
      scoreTurn(dx < 0 ? 1 : -1, x);
    });
  }
  if(stage) stage.addEventListener('click', ev => {
    if(ev.target.closest('.sc-fingpick')) return;
    if(ev.target.closest('.sc-pin, .sc-band-n, [data-scchord]')) return;
    /* the engraving's own box, not the stage's: it moves with the scroll and
       it starts where the notation starts, so the sums are the coordinates
       the measure boxes and the note heads are already in */
    const canvas = document.getElementById('scCanvas');
    const box = (canvas || stage).getBoundingClientRect();
    const px = ev.clientX - box.left, py = ev.clientY - box.top;
    /* with the fingering layer on, the score is a thing you write fingerings
       on: a press near a note head is for that note, and only a press nowhere
       near one falls through to the bar */
    if(x.overlays && x.overlays.fingerings){
      const hit = scoreNoteAt(px, py);
      if(hit){ ev.stopPropagation(); openFingerPicker(x, hit); return; }
    }
    if(ui.reading) return;           /* a tap is for waking the strip, not pinning */
    const m = measureAt(px, py);
    if(m) openPinModal(x.id, null, m);
  });
  /* the watcher is re-armed after every redraw of the page, because the
     listeners it hangs on went with the old one */
  if(ui.reading){ scoreQuietWatch(true); scoreKeysWatch(x); bindScoreMetro(root, x); }
  else scoreKeysWatch(null);
  bindScoreSide(root, x);
}
/* The metronome's controls, which appear in two places — the toolbar's second
   row and the reading strip — so they are bound by one function over whatever
   is on the page rather than twice by hand. */
/* Beat 1 louder and higher, or every beat the same. One setting for the
   piece, shown wherever its clicks are set: here, and in the play bar. */
function scoreAccentHTML(x){
  const on = x.metronome.accent !== false;
  return `<button class="tbtn sc-accent${on ? ' on' : ''}" data-scaccent aria-pressed="${on}"
    title="${on ? 'beat 1 is louder and higher — press to make every beat the same' : 'every beat is the same click — press to accent beat 1 again'}">${
      on ? 'beat 1 accented' : 'every beat the same'}</button>`;
}
function scoreAccentPaint(x){
  const on = x.metronome.accent !== false;
  $$('[data-scaccent]').forEach(b => { const t = document.createElement('span'); t.innerHTML = scoreAccentHTML(x);
    const n = t.firstElementChild; b.className = n.className; b.title = n.title; b.textContent = n.textContent;
    b.setAttribute('aria-pressed', String(on)); });
  $$('#scPlayRow .plx-bar, #scStrip .plx-bar').forEach(b => { if(b._plx && b._plx.setAccent) b._plx.setAccent(on); });
}
function scoreSetAccent(x, on){
  x.metronome.accent = !!on;
  ScoreMetronome.setAccent(x.metronome.accent);
  saveNow(); scoreAccentPaint(x);
}
function bindScoreMetro(root, x){
  const say = () => { $$('#scMetro').forEach(b => {
    b.textContent = (ScoreMetronome.running ? '◼' : '▶') + ' ♩';
    b.classList.toggle('primary', ScoreMetronome.running); }); };
  const perOf = () => { const t = scoreTimeSignature();
    return x.metronome.perBar || (t ? t.beats : 4); };
  $$('#scMetro', root).forEach(b => b.onclick = () => {
    ScoreMetronome.setBpm(x.metronome.bpm);
    ScoreMetronome.setPerBar(perOf());
    ScoreMetronome.setAccent(x.metronome.accent);
    if(!ScoreMetronome.toggle() && !ScoreMetronome.running)
      toast('This browser will not make a sound.');
    say();
  });
  $$('[data-scbpm]', root).forEach(b => b.onclick = () => {
    x.metronome.bpm = ScoreMetronome.setBpm(x.metronome.bpm + (+b.dataset.scbpm));
    saveNow(); scoreMetroSay(x);
  });
  $$('#scBpmIn', root).forEach(n => n.onchange = () => {
    x.metronome.bpm = ScoreMetronome.setBpm(n.value); saveNow(); scoreMetroSay(x); });
  $$('#scPer', root).forEach(n => n.oninput = n.onchange = () => {
    x.metronome.perBar = ScoreMetronome.setPerBar(n.value); saveNow(); scoreMetroSay(x); });
  $$('#scSigBack', root).forEach(b => b.onclick = () => { x.metronome.perBar = null;
    ScoreMetronome.setPerBar(scoreTimeSignature() ? scoreTimeSignature().beats : 4);
    saveNow(); scoreMetroSay(x); });
  $$('[data-scaccent]', root).forEach(b => b.onclick = () => { scoreSetAccent(x, x.metronome.accent === false); sound('click'); });
  $$('#scTap', root).forEach(b => b.onclick = () => {
    const n = scoreTapTempo();
    if(n == null){ toast('Again, in time — four or more.'); return; }
    x.metronome.bpm = ScoreMetronome.setBpm(n);
    saveNow(); scoreMetroSay(x);
  });
  say();
  scorePulseWatch();
}
/* What the click is actually counting, beside the field that sets it.

   It used to be the time signature off the notation and nothing else, so
   changing the beats in a bar left a number saying 3/4 next to a metronome
   counting five — two readings of the same thing, disagreeing, and no way to
   tell from the room which one was true. Now the readout follows the field:
   it says what is being counted, says so plainly when that is not what is
   written, and offers the way back. */
function scoreSigSayHTML(x){
  const t = scoreTimeSignature();
  const per = x.metronome.perBar || (t ? t.beats : 4);
  const unit = t ? t.unit : 4;
  const mine = !!x.metronome.perBar && (!t || x.metronome.perBar !== t.beats);
  return `<span class="sc-sig${mine ? ' mine' : ''}" id="scSigSay"
    title="${mine ? `the score is written in ${t ? `${t.beats}/${t.unit}` : 'something else'} \u2014 you are counting it in ${per}`
      : t ? 'read off the notation' : 'no time signature found, so four'}">
    <b class="mono">${per}/${unit}</b>${mine ? `<button class="tbtn" id="scSigBack"
      title="count it as it is written">as written</button>` : ''}</span>`;
}
function scoreMetroSay(x){
  $$('#scBpmIn').forEach(n => { if(n.value !== String(x.metronome.bpm)) n.value = x.metronome.bpm; });
  $$('#scPer').forEach(n => { const v = x.metronome.perBar || ScoreMetronome.perBar;
    if(n.value !== String(v)) n.value = v; });
  /* the readout is rebuilt rather than patched, because it grows and loses a
     button depending on whether the count is yours or the score's */
  $$('#scSigSay').forEach(n => { const box = n.parentElement;
    n.outerHTML = scoreSigSayHTML(x);
    const again = box.querySelector('#scSigBack');
    if(again) again.onclick = () => { x.metronome.perBar = null;
      ScoreMetronome.setPerBar(scoreTimeSignature() ? scoreTimeSignature().beats : 4);
      saveNow(); scoreMetroSay(x); };
  });
}
/* The dot, lit for a moment on every beat and a little bigger on the downbeat.
   Subscribed once: the beat arrives whichever room is on the screen, and the
   handler simply finds nothing to light when the score is not. */
let _scPulseOff = null;
function scorePulseWatch(){
  if(_scPulseOff) return;
  _scPulseOff = ScoreMetronome.onBeat(({strong}) => {
    $$('.sc-pulse').forEach(n => {
      n.classList.remove('lit', 'strong');
      void n.offsetWidth;                       /* restart the animation */
      n.classList.add('lit'); if(strong) n.classList.add('strong');
    });
  });
}

/* The arrow keys, for a pedal or a keyboard. Bound to the window rather than
   the page, because in reading mode there is nothing on the page to focus. */
let _scKeys = null;
function scoreKeysWatch(x){
  if(_scKeys){ removeEventListener('keydown', _scKeys, true); _scKeys = null; }
  if(!x) return;
  _scKeys = ev => {
    if(ev.target && ev.target.matches && ev.target.matches('input, textarea, select')) return;
    const by = /ArrowRight|PageDown| /.test(ev.key) ? 1 : /ArrowLeft|PageUp/.test(ev.key) ? -1 : 0;
    if(!by) return;
    if(ev.key === ' ' && ev.repeat) return;
    if(scoreTurn(by, x)) ev.preventDefault();
  };
  addEventListener('keydown', _scKeys, true);
}
function bindScoreSide(root, x){
  const ui = scoreUi();
  /* bound here rather than with the rest of the room, because the panel is
     repainted on its own and anything bound outside it goes with the old one */
  $$('[data-scside]', root).forEach(b => b.onclick = () => {
    ui.side = b.dataset.scside; saveNow(); scoreSidePaint(x); });
  const any = root.querySelector('#scLogAny');
  if(any) any.onclick = () => openScoreLogModal(x.id, ui.focus);
  $$('[data-scsitdel]', root).forEach(b => b.onclick = () => {
    const r = byId(x.practice, b.dataset.scsitdel); if(!r) return;
    requestDelete({label: `that sitting`, node: b.closest('.sc-sitting'),
      after: () => scoreSidePaint(x),
      remove: () => { spliceOut(x.practice, q => q.id === r.id);
        (r.sections || []).forEach(id => { const sec = scoreSection(x, id);
          if(sec) sec.practiceCount = Math.max(0, (+sec.practiceCount || 0) - 1); });
        saveNow(); }});
  });
  $$('[data-scedit]', root).forEach(b => b.onclick = () => openSectionModal(x.id, b.dataset.scedit));
  $$('[data-scgo]', root).forEach(b => b.onclick = () => { const s = scoreSection(x, b.dataset.scgo);
    if(s) scoreScrollTo(s.startMeasure); });
  $$('[data-scfocus]', root).forEach(b => b.onclick = () => {
    ui.focus = ui.focus === b.dataset.scfocus ? null : b.dataset.scfocus;
    /* working on a passage is the clearest "I am practising" this house has,
       so it is where the clock starts without being asked */
    try {
      const sec = ui.focus ? scoreSection(x, ui.focus) : null;
      if(sec && typeof timeAutoStart === 'function') timeAutoStart({categoryId:'piano',
        feature:'score', what:`${x.title} \u2014 ${sec.name}`,
        linkedType:'score', linkedId:x.id, linkedLabel:x.title});
      else if(!sec && typeof timeAutoStop === 'function') timeAutoStop('score');
    } catch(e){}
    sound('click'); rerender();
  });
  $$('[data-scsecdel]', root).forEach(b => b.onclick = () => {
    const s = scoreSection(x, b.dataset.scsecdel); if(!s) return;
    requestDelete({label: s.name, node: b.closest('.sc-sec'), after: () => { scoreSidePaint(x); scoreOverlayPaint(x); },
      remove: () => removeScoreSection(x.id, s.id)});
  });
  $$('[data-scpingo]', root).forEach(b => b.onclick = () => { const p = byId(x.pins, b.dataset.scpingo);
    if(p) scoreScrollTo(p.measure); });
  $$('[data-scpindel]', root).forEach(b => b.onclick = () => {
    spliceOut(x.pins, p => p.id === b.dataset.scpindel); saveNow();
    scoreSidePaint(x); scoreOverlayPaint(x);
  });
  if(typeof bindScoreSecTempo === 'function') bindScoreSecTempo(root, x);
  if(ui.side === 'recordings' && typeof bindSyncRecordings === 'function') bindSyncRecordings(root, x);
}
/* Turning a page: a tap on the right third or the left third, an arrow key, or
   a swipe. Three ways because the same person uses all three — a finger while
   playing, a pedal or keyboard between phrases, and a thumb when the tablet is
   in the other hand. */
function scoreTurn(by, x){
  const at = turnScorePage(by);
  if(at === null) return false;
  scoreOverlayPaint(x);
  scoreLayersPaint(x);
  scorePageSay();
  const stage = document.getElementById('scStage');
  if(stage) stage.scrollTo({top:0, left:0});
  return true;
}
function scorePageSay(){
  const say = document.getElementById('scPageSay');
  const sv = scoreView();
  if(!say) return;
  if(!sv || !sv.page || sv.pages < 2){ say.textContent = ''; return; }
  say.textContent = `${sv.at + 1} / ${sv.pages}`;
}
/* both copies of the control, since reading mode carries its own */
function scoreBplRepaint(x){
  $$('#scBplSay').forEach(n => n.textContent = x.barsPerLine || 'fit');
  $$('[data-scbpl="-1"]').forEach(n => n.disabled = !x.barsPerLine);
  $$('#scZoomSay').forEach(n => n.textContent = scoreZoomSay(x));
  $$('[data-sczoom]').forEach(n => n.disabled = !!x.barsPerLine);
}
function scoreScrollTo(n){
  const stage = document.getElementById('scStage');
  const sv = scoreView();
  /* paginated, "go to bar 60" is a page to turn to before it is a place to
     scroll to, and the bar is not on the page you are looking at */
  if(sv && sv.page){
    const pg = pageOfMeasure(n);
    if(pg == null){ toast(`Bar ${n} is not in what is drawn.`); return false; }
    if(pg !== sv.at){ showScorePage(pg); const x = scoreById(scoreUi().id);
      if(x) scoreOverlayPaint(x); scorePageSay(); }
  }
  const b = measureBox(n);
  if(!stage || !b){ toast(`Bar ${n} is not on this page.`); return false; }
  stage.scrollTo({top: Math.max(0, b.y - 60), left: Math.max(0, b.x - 80), behavior:'smooth'});
  return true;
}

/* ---------- the modals ---------- */
function openSectionModal(scoreId, sectionId){
  const x = scoreById(scoreId); if(!x) return null;
  const s = sectionId ? scoreSection(x, sectionId) : null;
  const last = x.totalMeasures || 9999;
  const d = s || {name:'', startMeasure:1, endMeasure:Math.min(8, last), color:SCORE_COLORS[0][0],
    status:'not_started', notes:''};
  const m = openModal(`<h2>${s ? esc(s.name) : 'A section'}</h2>
    <label class="pd-q"><span class="k">what it is</span>
      <input class="inp serif-lg" id="secName" value="${esc(d.name)}" autofocus placeholder="Exposition · the waltz · the eight bars that keep falling apart"></label>
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">from bar</span><input class="inp mono" type="number" id="secFrom" min="1" max="${last}" value="${d.startMeasure}"></label>
      <label class="pd-q"><span class="k">to bar</span><input class="inp mono" type="number" id="secTo" min="1" max="${last}" value="${d.endMeasure}"></label>
    </div>
    <div class="pd-q" style="margin-top:10px"><span class="k">its colour</span>
      <div class="sc-swatches">${SCORE_COLORS.map(([c, name]) =>
        `<button class="sc-swatch${d.color === c ? ' on' : ''}" data-seccol="${c}" style="--c:${c}" title="${esc(name)}" aria-label="${esc(name)}"></button>`).join('')}</div></div>
    <!-- two tempos, because the useful number is the distance between them:
         a target alone is a wish, a target beside what you can hold today is
         a plan -->
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">written at ♩=</span><input class="inp mono" type="number" id="secTarget" min="20" max="300" value="${d.targetTempo || ''}" placeholder="—"></label>
      <label class="pd-q"><span class="k">you can hold ♩=</span><input class="inp mono" type="number" id="secComfort" min="20" max="300" value="${d.comfortTempo || ''}" placeholder="—"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">how it is going</span>
      <select class="sel" id="secStatus">${SCORE_STATUS.map(([v, n, hint]) =>
        `<option value="${v}" ${d.status === v ? 'selected' : ''} title="${esc(hint)}">${esc(n)} — ${esc(hint)}</option>`).join('')}</select></label>
    <!-- the whole reason the room exists: what this passage needs, kept where
         the passage is rather than in a diary you read three weeks later -->
    <label class="pd-q" style="margin-top:10px"><span class="k">what it needs</span>
      <textarea class="inp sc-ta" rows="5" id="secNotes" placeholder="Tempo shaky at m.48–52 — metronome at ♩=80 before speeding up. LH octave leaps at m.60 need isolated work.">${esc(d.notes)}</textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${s ? `<button class="btn sm ghost danger" id="secDel">Delete</button><span class="grow"></span>` : ''}
      <button class="btn primary" id="secSave">${s ? 'Save' : 'Mark it'}</button></div>`, 'narrow sc-modal');
  let color = d.color;
  $$('[data-seccol]', m).forEach(b => b.onclick = () => { color = b.dataset.seccol;
    $$('[data-seccol]', m).forEach(y => y.classList.toggle('on', y === b)); });
  m.querySelector('#secSave').onclick = () => {
    const name = m.querySelector('#secName').value.trim();
    if(!name){ m.querySelector('#secName').focus(); return; }
    let from = clamp(+m.querySelector('#secFrom').value || 1, 1, last);
    let to = clamp(+m.querySelector('#secTo').value || from, 1, last);
    /* a range entered backwards is a range entered backwards, not an error
       worth a sentence about it */
    if(to < from){ const t = from; from = to; to = t; }
    const num = id => { const v = m.querySelector(id).value.trim(); return v === '' ? null : clamp(+v, 20, 300); };
    const fields = {name, startMeasure:from, endMeasure:to, color,
      targetTempo: num('#secTarget'), comfortTempo: num('#secComfort'),
      status:m.querySelector('#secStatus').value, notes:m.querySelector('#secNotes').value};
    if(s) Object.assign(s, fields); else addScoreSection(x.id, fields);
    saveNow(); m.remove(); sound('success');
    scoreSidePaint(x); scoreOverlayPaint(x);
  };
  const del = m.querySelector('#secDel');
  if(del) del.onclick = () => { removeScoreSection(x.id, s.id); m.remove(); sound('click');
    if(scoreUi().focus === s.id){ scoreUi().focus = null; rerender(); return; }
    scoreSidePaint(x); scoreOverlayPaint(x); };
  return m;
}

/* A pin is a sentence about one bar — a fingering, a warning, the thing you
   get wrong every single time. Deliberately smaller than a section: a section
   is a plan for a passage, a pin is a note in the margin. */
function openPinModal(scoreId, pinId, measure){
  const x = scoreById(scoreId); if(!x) return null;
  const p = pinId ? byId(x.pins, pinId) : null;
  const at = p ? p.measure : Math.max(1, +measure || 1);
  const m = openModal(`<h2>📌 Bar ${at}</h2>
    ${sectionAtMeasure(x, at) ? `<div class="mono faint">in ${esc(sectionAtMeasure(x, at).name)}</div>` : ''}
    <label class="pd-q" style="margin-top:8px"><span class="k">the note</span>
      <textarea class="inp" rows="3" id="pinText" autofocus placeholder="Use 5-3-1 here, not 5-2-1.">${esc(p ? p.text : '')}</textarea></label>
    <div class="pd-q" style="margin-top:10px"><span class="k">colour</span>
      <div class="sc-swatches">${SCORE_COLORS.map(([c, name]) =>
        `<button class="sc-swatch${(p ? p.color : SCORE_COLORS[0][0]) === c ? ' on' : ''}" data-pincol="${c}" style="--c:${c}" title="${esc(name)}" aria-label="${esc(name)}"></button>`).join('')}</div></div>
    <!-- Most of what gets pinned is about this bar. Some of it is not: "the
         inner voice carries the line here" is true of every piece with an
         inner voice, and you will rediscover it from scratch in the next one
         unless it is kept somewhere that outlives this score. -->
    <label class="sc-ruletick"><input type="checkbox" id="pinRule" ${p && p.ruleId ? 'checked' : ''}>
      <span><b>This is true of more than this bar.</b>
        <em class="faint">Keep it in the unwritten rules as well, where it will be waiting the next
          time you write the same thing about another piece.</em></span></label>
    <div id="pinRuleBox" class="sc-rulebox" ${p && p.ruleId ? '' : 'hidden'}>
      <label class="pd-q"><span class="k">family</span>
        <select class="sel" id="pinRuleFam">${RULE_FAMILIES.map(([k, n, hint]) =>
          `<option value="${k}">${esc(n)} \u2014 ${esc(hint)}</option>`).join('')}</select></label>
      <p class="faint sm" id="pinRuleSay"></p>
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${p ? `<button class="btn sm ghost danger" id="pinDel">Delete</button><span class="grow"></span>` : ''}
      <button class="btn primary" id="pinSave">${p ? 'Save' : 'Pin it'}</button></div>`, 'narrow sc-modal');
  let color = p ? p.color : SCORE_COLORS[0][0];
  $$('[data-pincol]', m).forEach(b => b.onclick = () => { color = b.dataset.pincol;
    $$('[data-pincol]', m).forEach(y => y.classList.toggle('on', y === b)); });
  /* The tick opens the family picker, and while it is open the room says
     whether it already has a rule that says this — which is the thing worth
     knowing before you write it down a second time. */
  const tick = m.querySelector('#pinRule');
  const box = m.querySelector('#pinRuleBox');
  const ruleSay = () => {
    const say = m.querySelector('#pinRuleSay'); if(!say) return;
    const hit = ruleLike(m.querySelector('#pinText').value.trim());
    say.innerHTML = hit
      ? `You have written this before \u2014 <b>${esc(hit.rule.text)}</b>. This bar goes on that rule
         rather than making a second one.`
      : 'A new rule. It will be in the library on the shelf page.';
    if(hit) m.querySelector('#pinRuleFam').value = hit.rule.family;
  };
  if(tick && box){
    tick.onchange = () => { box.hidden = !tick.checked; if(tick.checked) ruleSay(); };
    m.querySelector('#pinText').addEventListener('input', debounce(() => {
      if(tick.checked) ruleSay(); }, 300));
    if(tick.checked) ruleSay();
  }
  m.querySelector('#pinSave').onclick = () => {
    const text = m.querySelector('#pinText').value.trim();
    if(!text){ m.querySelector('#pinText').focus(); return; }
    let pin = p;
    if(pin) Object.assign(pin, {text, color});
    else { pin = scorePinDefaults({id:uid(), measure:at, text, color, createdAt:new Date().toISOString()});
      x.pins.push(pin); }
    /* the pin stays a pin either way: a rule is an extra home for the
       sentence, never a move out of the bar it belongs to */
    if(tick && tick.checked){
      const made = noteScoreRule({text, family: m.querySelector('#pinRuleFam').value,
        scoreId: x.id, title: x.title, measure: at, pinId: pin.id});
      if(made){
        pin.ruleId = made.rule.id;
        toast(made.again
          ? (made.fresh ? 'You have written this before \u2014 that rule has another sighting now.'
            : 'Already on that rule, at this very bar.')
          : 'Kept as a rule as well.');
      }
    } else if(pin.ruleId){ pin.ruleId = null; }
    saveNow(); m.remove(); sound('success');
    scoreSidePaint(x); scoreOverlayPaint(x);
  };
  const del = m.querySelector('#pinDel');
  if(del) del.onclick = () => { spliceOut(x.pins, y => y.id === p.id); saveNow(); m.remove(); sound('click');
    scoreSidePaint(x); scoreOverlayPaint(x); };
  return m;
}

/* Logging is the moment the section's status is worth asking about, because
   you have just played it and nobody knows better than you do right now. */
function openScoreLogModal(scoreId, sectionId){
  const x = scoreById(scoreId); if(!x) return null;
  const s = sectionId ? scoreSection(x, sectionId) : null;
  const list = (x.sections || []).slice().sort((a, b) => a.startMeasure - b.startMeasure);
  const target = s ? s.targetTempo : Math.max(0, ...list.map(v => +v.targetTempo || 0)) || null;
  const m = openModal(`<h2>Log a sitting${s ? ` \u2014 ${esc(s.name)}` : ''}</h2>
    <label class="pd-q"><span class="k">minutes</span>
      <input class="inp mono" type="number" id="logMins" min="0" max="600" value="20" autofocus></label>
    ${list.length ? `<div class="pd-q" style="margin-top:10px"><span class="k">what you worked on</span>
      <div class="sc-logsecs">${list.map(v =>
        `<label class="sc-logsec"><input type="checkbox" data-logsec="${esc(v.id)}"
          ${s && s.id === v.id ? 'checked' : ''}> ${esc(v.name)}
          <span class="mono faint">${v.startMeasure}\u2013${v.endMeasure}</span></label>`).join('')}</div></div>` : ''}
    <label class="pd-q" style="margin-top:10px"><span class="k">what you were after</span>
      <input class="inp" id="logFocus" placeholder="tempo in the waltz; the left-hand leaps at 58"></label>
    <div class="row" style="gap:10px;margin-top:10px">
      <label class="pd-q" style="flex:1"><span class="k">fastest you held it \u2669=</span>
        <input class="inp mono" type="number" id="logTempo" min="20" max="300"
          placeholder="${target ? `written at ${target}` : '\u2014'}"></label>
      <label class="pd-q" style="flex:1"><span class="k">how it went</span>
        <select class="sel" id="logQuality"><option value="">\u2014</option>${SCORE_QUALITY.map(([v, n]) =>
          `<option value="${v}">${esc(n)}</option>`).join('')}</select></label>
    </div>
    ${typeof ensLogFieldsHTML === 'function' ? ensLogFieldsHTML(x) : ''}
    ${s ? `<label class="pd-q" style="margin-top:10px"><span class="k">how it stands now</span>
      <select class="sel" id="logStatus">${SCORE_STATUS.map(([v, n, hint]) =>
        `<option value="${v}" ${s.status === v ? 'selected' : ''}>${esc(n)} \u2014 ${esc(hint)}</option>`).join('')}</select></label>` : ''}
    <!-- the field the whole notebook is for: what you noticed, which is the
         thing that is gone by tomorrow if it is not written down now -->
    <label class="pd-q" style="margin-top:10px"><span class="k">what you found out</span>
      <textarea class="inp" rows="3" id="logNotes" placeholder="There is an inner voice in the tenor I have been ignoring. Bar 48 should be pp."></textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="logSave">Done</button></div>`,
    'narrow sc-modal');
  /* the tempo the room last played it at, as a starting point */
  const was = typeof ensLogPrefill === 'function' ? ensLogPrefill(x) : null;
  if(was && was.bpm) m.querySelector('#logTempo').value = was.bpm;
  m.querySelector('#logSave').onclick = () => {
    const mins = +m.querySelector('#logMins').value || 0;
    const st = m.querySelector('#logStatus');
    if(s && st) s.status = st.value;
    const picked = $$('[data-logsec]', m).filter(b => b.checked).map(b => b.dataset.logsec);
    const tempo = +m.querySelector('#logTempo').value || null;
    logScorePractice(x.id, s ? s.id : null, mins, Object.assign({
      sections: picked, comfort: tempo, tempo,
      focus: m.querySelector('#logFocus').value.trim(),
      quality: m.querySelector('#logQuality').value || null,
      discoveries: m.querySelector('#logNotes').value.trim()},
      typeof ensLogFieldsRead === 'function' ? ensLogFieldsRead(m) : {}));
    m.remove(); sound('success');
    toast(mins ? `${fmtHM(mins)} logged.` : 'Logged.');
    scoreSidePaint(x);
  };
  return m;
}
