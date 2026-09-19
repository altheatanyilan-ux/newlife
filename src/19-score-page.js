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

const scoreOpenId = () => S._score && S._score.id;
function scoreUi(){ return S._score = S._score || {id:null, focus:null, picking:null}; }

routes.score = function(root, params){
  scoreState();
  const ui = scoreUi();
  const want = params && params[0] ? params[0] : null;
  if(want && scoreById(want)) ui.id = want;
  const rec = ui.id ? scoreById(ui.id) : null;
  registerPageEntry({pageName:'Score Practice', addLabel:'Add a score', defaultEntryType:'score', prefilledFields:{}, options:[
    {icon:'📄', label:'A score', desc:'A MusicXML file, from MuseScore or anywhere.', run:()=>scorePickFile()},
    ...(rec ? [{icon:'🎯', label:'A section', desc:'A measure range worth practising on its own.', run:()=>openSectionModal(rec.id)}] : [])]});
  if(!rec){ root.innerHTML = `<div class="page sc-page">${scoreLibraryHTML()}</div>`; bindScoreLibrary(root); return; }
  root.innerHTML = `<div class="page sc-page sc-open">${scoreViewerHTML(rec)}</div>`;
  bindScoreViewer(root, rec);
  scorePaint(rec);
};

/* ---------- the shelf ---------- */
function scoreLibraryHTML(){
  const list = scoreState().slice().sort((a, b) =>
    (b.lastOpened || b.createdAt || '').localeCompare(a.lastOpened || a.createdAt || ''));
  const weight = scoreLibraryWeight();
  return `<h1 class="serif">Score Practice</h1>
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
      : '<div class="empty">Nothing on the shelf yet.</div>'}`;
}

/* ---------- the score ---------- */
function scoreViewerHTML(x){
  const ui = scoreUi();
  const focus = ui.focus ? scoreSection(x, ui.focus) : null;
  const parts = x.instruments || [];
  return `<div class="sc-head">
      <a class="btn sm ghost" href="#/score" id="scBack">← the shelf</a>
      <span class="sc-title serif">${esc(x.title)}</span>
      ${x.composer ? `<span class="sc-comp">${esc(x.composer)}</span>` : ''}
      <span class="grow"></span>
      <span class="mono faint">${x.totalMeasures ? `${x.totalMeasures} bars` : ''}</span>
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
      <span class="sc-zoom"><button class="tbtn" data-sczoom="-1">−</button>
        <span class="mono" id="scZoomSay">${Math.round((x.zoom || 1) * 100)}%</span>
        <button class="tbtn" data-sczoom="1">+</button></span>
      <label class="sc-jump"><span class="k mono">bar</span>
        <input class="inp sm mono" id="scJump" type="number" min="1" max="${x.totalMeasures || 9999}" placeholder="#"></label>
      <button class="btn sm primary" id="scNewSec">＋ a section</button>
    </div>
    <div class="sc-body">
      <div class="sc-stage" id="scStage">
        <div class="sc-canvas" id="scCanvas"></div>
        <div class="sc-overlay" id="scOverlay" aria-hidden="true"></div>
        <div class="sc-pins" id="scPins"></div>
        <div class="sc-loading" id="scLoading">engraving…</div>
      </div>
      <aside class="sc-side" id="scSide">${scoreSideHTML(x)}</aside>
    </div>`;
}

/* The panel beside the score. Repainted on its own, because writing a note
   about bar 48 should not cost a re-engraving of the whole Ballade. */
function scoreSideHTML(x){
  const ui = scoreUi();
  const list = (x.sections || []).slice().sort((a, b) => a.startMeasure - b.startMeasure);
  const pins = (x.pins || []).slice().sort((a, b) => a.measure - b.measure);
  const mins = scoreMinutesOn(x, today());
  return `<div class="sc-side-h">
      <span class="sc-side-t">📝 Sections</span>
      ${mins ? `<span class="mono faint">${fmtHM(mins)} today</span>` : ''}
    </div>
    ${list.length ? `<div class="sc-secs">${list.map(s => `
      <div class="sc-sec${ui.focus === s.id ? ' on' : ''}" style="--c:${esc(s.color)}" data-scsec="${esc(s.id)}">
        <div class="sc-sec-h">
          <span class="sc-sec-n serif">${esc(s.name)}</span>
          <span class="sc-sec-m mono">${s.startMeasure}–${s.endMeasure}</span>
        </div>
        ${scoreTempoSay(s)}
        <div class="sc-sec-s mono" title="${esc((SCORE_STATUS.find(v => v[0] === s.status) || [,,''])[2])}">
          ${scoreStatusDots(s.status)} ${esc(scoreStatusName(s.status))}
          · ${s.lastPracticedDate ? esc(scoreAgo(s.lastPracticedDate)) : 'never practised'}${
            s.practiceCount ? ` · ${s.practiceCount}×` : ''}
        </div>
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
      ${pins.map(p => `<div class="sc-pinrow" style="--c:${esc(p.color)}" data-scpinrow="${esc(p.id)}">
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
    await openScoreIn(stage, x, focus ? {from:focus.startMeasure, to:focus.endMeasure} : {});
    x.lastOpened = new Date().toISOString();
    if(say) say.remove();
    /* the parts are only known once the file has been read, so the bar above
       the score is filled in after the first engraving rather than guessed —
       always, because before it there is nothing there to correct */
    scoreRepaintParts(x);
    scoreOverlayPaint(x);
    saveNow();
  } catch(e){
    if(say) say.textContent = `That score could not be drawn — ${e.message}`;
    console.warn('score render failed', e);
  }
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
    return `<button class="sc-pin" data-scpin="${esc(p.id)}" style="--c:${esc(p.color)};left:${b.x + b.w / 2}px;top:${b.y}px"
      title="${esc(p.text)}">📌</button>`;
  }).join('');
  $$('[data-scpin]', pinBox).forEach(b => b.onclick = ev => { ev.stopPropagation();
    openPinModal(x.id, b.dataset.scpin); });
}
/* a re-engraving, for the three things that really change the picture */
async function scoreRedraw(x){
  const ui = scoreUi();
  const focus = ui.focus ? scoreSection(x, ui.focus) : null;
  try {
    await renderScore(x, focus ? {from:focus.startMeasure, to:focus.endMeasure} : {from:null, to:null});
    scoreOverlayPaint(x);
  } catch(e){ console.warn('score redraw failed', e); }
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

function bindScoreLibrary(root){
  const file = root.querySelector('#scFile');
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
    requestDelete({label: x.title, node: b.closest('.sc-item'), after: rerender,
      remove: () => removeScore(x.id)});
  });
}

function bindScoreViewer(root, x){
  const ui = scoreUi();
  const on = (sel, fn) => { const n = root.querySelector(sel); if(n) n.onclick = fn; };
  on('#scBack', () => { ui.id = null; ui.focus = null; });
  on('#scNewSec', () => openSectionModal(x.id));
  on('#scUnfocus', () => { ui.focus = null; rerender(); });
  on('#scLog', () => openScoreLogModal(x.id, ui.focus));
  on('#scSolo', () => { const parts = scoreParts(x);
    x.hidden = parts.slice(1).map(p => p.index); applyScoreParts(x); saveNow();
    scoreRepaintParts(x); scoreRedraw(x); });
  on('#scAllParts', () => { x.hidden = []; applyScoreParts(x); saveNow();
    scoreRepaintParts(x); scoreRedraw(x); });
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
  const stage = root.querySelector('#scStage');
  if(stage) stage.addEventListener('click', ev => {
    if(ev.target.closest('.sc-pin, .sc-band-n')) return;
    const box = stage.getBoundingClientRect();
    const m = measureAt(ev.clientX - box.left + stage.scrollLeft, ev.clientY - box.top + stage.scrollTop);
    if(m) openPinModal(x.id, null, m);
  });
  bindScoreSide(root, x);
}
function bindScoreSide(root, x){
  const ui = scoreUi();
  $$('[data-scedit]', root).forEach(b => b.onclick = () => openSectionModal(x.id, b.dataset.scedit));
  $$('[data-scgo]', root).forEach(b => b.onclick = () => { const s = scoreSection(x, b.dataset.scgo);
    if(s) scoreScrollTo(s.startMeasure); });
  $$('[data-scfocus]', root).forEach(b => b.onclick = () => {
    ui.focus = ui.focus === b.dataset.scfocus ? null : b.dataset.scfocus;
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
}
function scoreScrollTo(n){
  const stage = document.getElementById('scStage');
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
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      ${p ? `<button class="btn sm ghost danger" id="pinDel">Delete</button><span class="grow"></span>` : ''}
      <button class="btn primary" id="pinSave">${p ? 'Save' : 'Pin it'}</button></div>`, 'narrow sc-modal');
  let color = p ? p.color : SCORE_COLORS[0][0];
  $$('[data-pincol]', m).forEach(b => b.onclick = () => { color = b.dataset.pincol;
    $$('[data-pincol]', m).forEach(y => y.classList.toggle('on', y === b)); });
  m.querySelector('#pinSave').onclick = () => {
    const text = m.querySelector('#pinText').value.trim();
    if(!text){ m.querySelector('#pinText').focus(); return; }
    if(p) Object.assign(p, {text, color});
    else x.pins.push(scorePinDefaults({id:uid(), measure:at, text, color, createdAt:new Date().toISOString()}));
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
  const m = openModal(`<h2>Log practice${s ? ` — ${esc(s.name)}` : ''}</h2>
    <label class="pd-q"><span class="k">minutes</span>
      <input class="inp mono" type="number" id="logMins" min="0" max="600" value="20" autofocus></label>
    ${s ? `<label class="pd-q" style="margin-top:10px"><span class="k">how it stands now</span>
      <select class="sel" id="logStatus">${SCORE_STATUS.map(([v, n, hint]) =>
        `<option value="${v}" ${s.status === v ? 'selected' : ''}>${esc(n)} — ${esc(hint)}</option>`).join('')}</select></label>
    <!-- asked here because you have just played it, and nobody knows what you
         can hold better than you do this minute -->
    <label class="pd-q" style="margin-top:10px"><span class="k">fastest you could hold it ♩=</span>
      <input class="inp mono" type="number" id="logComfort" min="20" max="300" value="${s.comfortTempo || ''}" placeholder="${s.targetTempo ? `written at ${s.targetTempo}` : '—'}"></label>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="logSave">Done</button></div>`, 'narrow sc-modal');
  m.querySelector('#logSave').onclick = () => {
    const mins = +m.querySelector('#logMins').value || 0;
    const st = m.querySelector('#logStatus');
    if(s && st) s.status = st.value;
    const comfort = m.querySelector('#logComfort');
    logScorePractice(x.id, s ? s.id : null, mins, {comfort: comfort ? comfort.value : null});
    m.remove(); sound('success');
    toast(mins ? `${fmtHM(mins)} logged.` : 'Logged.');
    scoreSidePaint(x);
  };
  return m;
}
