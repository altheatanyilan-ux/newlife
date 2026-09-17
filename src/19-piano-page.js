/* ============================================================
   THE PIANO STUDIO — the room, and everything you can press in it.
   ============================================================ */
const PIANO_TABS = [['repertoire','Repertoire','what you play'], ['jazz','Jazz Lab','what you have internalised']];
const PIANO_REP_VIEWS = [['list','The stand'], ['ready','Ready to play'], ['practice','What to practise'], ['sets','Sets']];

function pianoTab(){
  const t = pianoState().settings.tab;
  return PIANO_TABS.some(x => x[0] === t) ? t : 'repertoire';
}
function setPianoTab(t){ pianoState().settings.tab = t; saveNow(); rerender(); }

routes.piano = function(root, params){
  const p = pianoState();
  /* an address of its own for a piece, so a link from anywhere lands on it */
  if(params && params[0] === 'piece' && params[1]){ S._pianoPiece = params[1]; }
  registerPageEntry({pageName:'Piano Studio', addLabel:'Add a piece', defaultEntryType:'piece', prefilledFields:{}, options:[
    {icon:'🎹', label:'A piece', desc:'Something you play, are learning, or mean to learn.', run:()=>openPieceEditor()},
    {icon:'🎷', label:'Jazz practice', desc:'A sitting with the vocabulary.', run:()=>openJazzLog()},
    {icon:'🎤', label:'A jam night', desc:'What you called, and how it went.', run:()=>openJamLog()}]});

  const tab = pianoTab();
  const piece = S._pianoPiece ? pianoPiece(S._pianoPiece) : null;
  root.innerHTML = `<div class="page pn-page">
    <h1 class="serif">Piano Studio</h1>
    <p class="muted pn-lede">Two systems on one bench. The Repertoire is the music stand — what you can play, what you are learning, what is going quietly rusty. The Jazz Lab is the other kind of practice: not pieces, but vocabulary, tracked across all twelve keys, because a voicing you can only play in C is a voicing you cannot play.</p>
    <div class="pn-tabs" role="tablist">${PIANO_TABS.map(([id, name, hint]) =>
      `<button class="pn-tab${tab === id ? ' on' : ''}" data-pntab="${id}" role="tab" aria-selected="${tab === id}"
        title="${esc(hint)}"><span>${esc(name)}</span><em>${esc(hint)}</em></button>`).join('')}</div>

    ${tab === 'repertoire'
      ? (piece ? pianoPieceHTML(piece) : `<div class="pn-views">${PIANO_REP_VIEWS.map(([v, n]) =>
          `<button class="pn-view${pianoRepView() === v ? ' on' : ''}" data-pnview="${v}">${esc(n)}</button>`).join('')}</div>
        <div class="pn-body">${
          pianoRepView() === 'ready' ? pianoReadyHTML()
          : pianoRepView() === 'practice' ? pianoSuggestHTML()
          : pianoRepView() === 'sets' ? pianoSetlistsHTML()
          : pianoListHTML()}</div>`)
      : `${pianoJazzHTML()}
         <div class="stack" style="gap:16px;margin-top:20px">
           ${pianoAudiationHTML()}${pianoShelfHTML()}${pianoJamsHTML()}</div>`}
    <!-- The two numbers everything else is measured against. They are at the
         bottom because you set them once; they are on the page at all because
         "rusty after thirty days" is a judgement, not a fact, and a piece you
         play twice a year is not necessarily one you are losing. -->
    <div class="pn-settings">
      <label class="pd-q"><span class="k">rusty after</span>
        <input class="inp mono" type="number" id="pnRust" min="3" max="365" value="${p.settings.rustThresholdDays}"> days</label>
      <label class="pd-q"><span class="k">a practice is usually</span>
        <input class="inp mono" type="number" id="pnDef" min="5" max="240" step="5" value="${p.settings.defaultPracticeMinutes}"> minutes</label>
    </div>
  </div>`;
  bindPianoPage(root);
};

function bindPianoPage(root){
  const p = pianoState();
  const redraw = () => { saveNow(); rerender(); };
  const soft = () => { saveNow(); };

  $$('[data-pntab]', root).forEach(b => b.onclick = () => {
    S._pianoPiece = null; S._pianoSet = null; setPianoTab(b.dataset.pntab); sound('click'); });
  $$('[data-pnview]', root).forEach(b => b.onclick = () => {
    S._pianoSet = null; setPianoRepView(b.dataset.pnview); sound('click'); });
  $$('[data-pnopen]', root).forEach(b => b.onclick = () => {
    S._pianoPiece = b.dataset.pnopen; sound('click'); rerender(); });

  /* ---- the list ---- */
  const f = pianoPieceFilter();
  const g = root.querySelector('#pnGenre'); if(g) g.onchange = () => { f.genre = g.value; rerender(); };
  const st = root.querySelector('#pnStatus'); if(st) st.onchange = () => { f.status = st.value; rerender(); };
  const q = root.querySelector('#pnQ');
  if(q) q.oninput = debounce(() => { f.q = q.value; const at = q.selectionStart; rerender();
    const again = document.querySelector('#pnQ'); if(again){ again.focus(); try { again.setSelectionRange(at, at); } catch(e){} } }, 260);
  const add = root.querySelector('#pnAdd'); if(add) add.onclick = () => openPieceEditor();

  /* ---- the suggestion ---- */
  const bud = root.querySelector('#pnBudget');
  if(bud) bud.onchange = () => { S._pianoBudget = clamp(+bud.value || 30, 5, 240); rerender(); };
  const sg = root.querySelector('#pnSuggGo');
  if(sg) sg.onclick = () => {
    const first = pianoSuggestPractice(S._pianoBudget || p.settings.defaultPracticeMinutes).items[0];
    if(!first){ toast('Nothing to suggest yet.'); return; }
    startPianoTimer(first.piece.id, null, first.minutes);
  };

  /* ---- one piece ---- */
  const back = root.querySelector('#pnBack');
  if(back) back.onclick = () => { S._pianoPiece = null; sound('click'); rerender(); };
  const cur = S._pianoPiece ? pianoPiece(S._pianoPiece) : null;
  if(cur){
    $$('[data-pnf]', root).forEach(inp => inp.onchange = () => {
      const k = inp.dataset.pnf;
      const v = inp.type === 'number' ? (inp.value === '' ? null : +inp.value) : inp.value;
      cur[k] = v;
      /* the two dates a piece keeps for itself, written when the word changes */
      if(k === 'status'){
        if(v === 'learning' && !cur.startedAt) cur.startedAt = new Date().toISOString();
        if((v === 'performance_ready' || v === 'polished') && !cur.readyAt) cur.readyAt = new Date().toISOString();
      }
      soft(); if(k === 'status' || k === 'targetBpm') rerender();
    });
    const secAdd = root.querySelector('#pnSecAdd');
    if(secAdd) secAdd.onclick = () => { cur.sections.push({id:uid(), name:'', readiness:'not_started', notes:''});
      sound('click'); redraw(); };
    $$('[data-pnsecname]', root).forEach(inp => inp.onchange = () => {
      const s = byId(cur.sections, inp.dataset.pnsecname); if(s){ s.name = inp.value; soft(); } });
    $$('[data-pnsecnote]', root).forEach(inp => inp.onchange = () => {
      const s = byId(cur.sections, inp.dataset.pnsecnote); if(s){ s.notes = inp.value; soft(); } });
    $$('[data-pnready]', root).forEach(b => b.onclick = () => {
      const [sid, r] = b.dataset.pnready.split('|');
      const s = byId(cur.sections, sid); if(!s) return;
      /* pressing the pip you are already on steps back down, so the row is
         reversible without a second control */
      s.readiness = s.readiness === r ? PIANO_READINESS[Math.max(0, pianoReadiness(r)[2] - 1)][0] : r;
      sound('click'); redraw(); });
    $$('[data-pnsecdel]', root).forEach(b => b.onclick = () => {
      spliceOut(cur.sections, s => s.id === b.dataset.pnsecdel); sound('click'); redraw(); });
    $$('[data-pnlogdel]', root).forEach(b => b.onclick = () => {
      spliceOut(pianoLogs(), l => l.id === b.dataset.pnlogdel); sound('click'); redraw(); });
    $$('[data-pnperson]', root).forEach(b => b.onclick = () => {
      const id = b.dataset.pnperson;
      const at = cur.peopleIds.indexOf(id);
      at < 0 ? cur.peopleIds.push(id) : cur.peopleIds.splice(at, 1);
      b.classList.toggle('on', at < 0); sound('click'); soft(); });
    const lg = root.querySelector('#pnLog'); if(lg) lg.onclick = () => openPracticeLog(cur.id);
    const tm = root.querySelector('#pnTimer'); if(tm) tm.onclick = () => startPianoTimer(cur.id);
    const lib = root.querySelector('#pnLib');
    if(lib) lib.onclick = () => { if(typeof openMediaModal !== 'function'){ toast('The Library is not open.'); return; }
      /* openMediaModal hands the new entry back and leaves the redraw to the
         caller, so the link is written first and the page redrawn after */
      openMediaModal({kind:'album', title:cur.title}, e => { e.pieceId = cur.id; saveNow();
        toast(`Filed under ${cur.title}.`); rerender(); }); };
    const del = root.querySelector('#pnDel');
    if(del) del.onclick = () => requestDelete({label: cur.title || 'this piece', after: () => { S._pianoPiece = null; rerender(); },
      remove: () => spliceOut(pianoState().pieces, x => x.id === cur.id)});
  }

  /* ---- sets ---- */
  const slAdd = root.querySelector('#pnSlAdd');
  if(slAdd) slAdd.onclick = () => { const sl = newSetlist('New set'); p.setlists.push(sl);
    S._pianoSet = sl.id; sound('success'); redraw(); };
  $$('[data-pnset]', root).forEach(b => b.onclick = () => { S._pianoSet = b.dataset.pnset; sound('click'); rerender(); });
  const slBack = root.querySelector('#pnSlBack');
  if(slBack) slBack.onclick = () => { S._pianoSet = null; sound('click'); rerender(); };
  const sl = S._pianoSet ? pianoSetlist(S._pianoSet) : null;
  if(sl){
    const nm = root.querySelector('#pnSlName'); if(nm) nm.onchange = () => { sl.name = nm.value; soft(); };
    const pick = root.querySelector('#pnSlPick');
    if(pick) pick.onchange = () => { if(!pick.value) return;
      sl.pieces.push({pieceId:pick.value, order:sl.pieces.length, notes:''}); sound('click'); redraw(); };
    $$('[data-pnslnote]', root).forEach(inp => inp.onchange = () => {
      const row = sl.pieces[+inp.dataset.pnslnote]; if(row){ row.notes = inp.value; soft(); } });
    const move = (i, d) => { const j = i + d; if(j < 0 || j >= sl.pieces.length) return;
      const [x] = sl.pieces.splice(i, 1); sl.pieces.splice(j, 0, x);
      sl.pieces.forEach((r, n) => r.order = n); sound('click'); redraw(); };
    $$('[data-pnslup]', root).forEach(b => b.onclick = () => move(+b.dataset.pnslup, -1));
    $$('[data-pnsldn]', root).forEach(b => b.onclick = () => move(+b.dataset.pnsldn, 1));
    $$('[data-pnslrm]', root).forEach(b => b.onclick = () => { sl.pieces.splice(+b.dataset.pnslrm, 1); sound('click'); redraw(); });
    const pr = root.querySelector('#pnSlPrint');
    if(pr) pr.onclick = () => { sl.lastUsed = today(); soft(); openSetlistPrint(sl); };
    const sd = root.querySelector('#pnSlDel');
    if(sd) sd.onclick = () => requestDelete({label: sl.name || 'this set', after: () => { S._pianoSet = null; rerender(); },
      remove: () => spliceOut(p.setlists, x => x.id === sl.id)});
  }

  /* ---- the jazz side ---- */
  $$('[data-pnstage]', root).forEach(b => b.onclick = () => {
    S._pianoStage = S._pianoStage === b.dataset.pnstage ? null : b.dataset.pnstage; sound('click'); rerender(); });
  $$('[data-pnststatus]', root).forEach(sel => sel.onchange = () => {
    const s = pianoStage(sel.dataset.pnststatus); if(s){ s.status = sel.value; redraw(); } });
  $$('[data-pnstlog]', root).forEach(b => b.onclick = () => openJazzLog(b.dataset.pnstlog));
  $$('[data-pnclog]', root).forEach(b => b.onclick = () => openJazzLog(null, b.dataset.pnclog));
  $$('[data-pnweak]', root).forEach(b => b.onclick = () => {
    const c = pianoConcept(b.dataset.pnweak); if(!c) return;
    const weak = pianoWeakKeys(c);
    toast(`Weakest in ${weak.join(', ')} — that is where the next fifteen minutes go.`, 6000);
    sound('click'); });
  $$('[data-pnkey]', root).forEach(gnode => {
    const open = () => { const c = pianoConcept(gnode.closest('[data-pnconcept]')?.dataset.pnconcept);
      if(c) openKeyPanel(c, gnode.dataset.pnkey); };
    gnode.onclick = open;
    gnode.onkeydown = ev => { if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); open(); } };
  });
  $$('[data-pnfluency]', root).forEach(b => b.onclick = () => {
    const [cid, lvl] = b.dataset.pnfluency.split('|');
    const c = pianoConcept(cid); if(c){ c.fluency = lvl; sound('click'); redraw(); } });
  $$('[data-pnentadd]', root).forEach(b => b.onclick = () => {
    const c = pianoConcept(b.dataset.pnentadd); if(!c) return;
    const inp = root.querySelector(`[data-pnentry="${CSS.escape(c.id)}"]`);
    const text = inp ? inp.value.trim() : ''; if(!text) return;
    c.entries = c.entries || []; c.entries.push({id:uid(), date:today(), text});
    c.lastPracticed = today(); sound('success'); redraw(); });
  $$('[data-pnentdel]', root).forEach(b => b.onclick = () => {
    const [cid, eid] = b.dataset.pnentdel.split('|');
    const c = pianoConcept(cid); if(c && c.entries){ spliceOut(c.entries, e => e.id === eid); sound('click'); redraw(); } });
  $$('[data-pnaud]', root).forEach(b => b.onclick = () => {
    const [n, lvl] = b.dataset.pnaud.split('|');
    const a = p.jazz.audiation.find(x => x.stage === +n);
    if(a){ a.level = lvl; a.assessedAt = new Date().toISOString(); sound('click'); redraw(); } });
  const resAdd = root.querySelector('#pnResAdd');
  if(resAdd) resAdd.onclick = () => { p.jazz.resources.push({id:uid(), title:'New resource', author:'',
    type:'book', focus:'', bestFor:'', url:'', notes:'', stageIds:[]}); sound('click'); redraw(); };
  $$('[data-pnresf]', root).forEach(inp => inp.onchange = () => {
    const [rid, field] = inp.dataset.pnresf.split('|');
    const r = byId(p.jazz.resources, rid); if(r){ r[field] = inp.value; soft(); } });
  $$('[data-pnresdel]', root).forEach(b => b.onclick = () => {
    spliceOut(p.jazz.resources, r => r.id === b.dataset.pnresdel); sound('click'); redraw(); });
  const rust = root.querySelector('#pnRust');
  if(rust) rust.onchange = () => { p.settings.rustThresholdDays = clamp(+rust.value || 30, 3, 365); redraw(); };
  const def = root.querySelector('#pnDef');
  if(def) def.onchange = () => { p.settings.defaultPracticeMinutes = clamp(+def.value || 30, 5, 240); soft(); };
  const jamAdd = root.querySelector('#pnJamAdd'); if(jamAdd) jamAdd.onclick = () => openJamLog();
  $$('[data-pnjamdel]', root).forEach(b => b.onclick = () => {
    spliceOut(p.jazz.jams, j => j.id === b.dataset.pnjamdel); sound('click'); redraw(); });
}

/* ---------- adding and logging ---------- */
function openPieceEditor(){
  const m = openModal(`<h2>A piece</h2>
    <div class="grid c2" style="gap:10px">
      <label class="pd-q"><span class="k">title</span><input class="inp serif-lg" id="peTitle" autofocus placeholder="Clair de Lune"></label>
      <label class="pd-q"><span class="k">composer</span><input class="inp" id="peComposer" placeholder="Claude Debussy"></label>
      <label class="pd-q"><span class="k">genre</span><select class="sel" id="peGenre">${PIANO_GENRES.map(([v, n]) =>
        `<option value="${v}">${esc(n)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">state</span><select class="sel" id="peStatus">${PIANO_STATUSES.filter(s => s[0] !== 'rusty').map(([v, n]) =>
        `<option value="${v}" ${v === 'want_to_learn' ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="peSave">Add</button></div>`, 'narrow');
  const save = () => {
    const t = m.querySelector('#peTitle').value.trim();
    if(!t){ m.querySelector('#peTitle').focus(); return; }
    const x = newPiece(t);
    x.composer = m.querySelector('#peComposer').value.trim();
    x.genre = m.querySelector('#peGenre').value;
    x.status = m.querySelector('#peStatus').value;
    if(x.status === 'learning') x.startedAt = new Date().toISOString();
    pianoState().pieces.push(x); saveNow(); m.remove(); sound('success');
    S._pianoPiece = x.id; rerender();
  };
  m.querySelector('#peSave').onclick = save;
  m.querySelector('#peTitle').onkeydown = ev => { if(ev.key === 'Enter') save(); };
  return m;
}
function openPracticeLog(pieceId, prefill = {}){
  const x = pianoPiece(pieceId); if(!x) return null;
  const m = openModal(`<h2>${esc(x.title)}</h2>
    <div class="grid c2" style="gap:10px">
      <label class="pd-q"><span class="k">date</span><input type="date" class="inp" id="plDate" value="${today()}"></label>
      <label class="pd-q"><span class="k">minutes</span><input type="number" class="inp mono" id="plMin" value="${+prefill.minutes || pianoState().settings.defaultPracticeMinutes}"></label>
    </div>
    ${(x.sections || []).length ? `<div style="margin-top:12px"><span class="k mono">which sections</span>
      <div class="pn-keypick">${x.sections.map(s =>
        `<button class="pn-kp" data-plsec="${esc(s.id)}" aria-pressed="false">${esc(s.name || 'unnamed')}</button>`).join('')}</div></div>` : ''}
    <label class="pd-q" style="margin-top:12px"><span class="k">what you worked on</span>
      <input class="inp" id="plFocus" placeholder="slow practice, mm. 32–48 · a memorisation run"></label>
    <div class="grid c2" style="gap:10px;margin-top:10px">
      <label class="pd-q"><span class="k">how it went</span><select class="sel" id="plQ">${PIANO_QUALITIES.map(([v, n]) =>
        `<option value="${v}" ${v === 'good' ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      <label class="pd-q"><span class="k">♩= today</span><input type="number" class="inp mono" id="plBpm" placeholder="${x.targetBpm || 90}"></label>
    </div>
    <label class="pd-q" style="margin-top:10px"><span class="k">notes</span>
      <textarea class="inp" rows="2" id="plNotes"></textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="plSave">Save</button></div>`, 'narrow');
  m.querySelectorAll('[data-plsec]').forEach(b => b.onclick = () => {
    const on = b.getAttribute('aria-pressed') === 'true';
    b.setAttribute('aria-pressed', String(!on)); b.classList.toggle('on', !on); });
  m.querySelector('#plSave').onclick = () => {
    logPianoPractice(pieceId, {
      date: m.querySelector('#plDate').value || today(),
      durationMinutes: +m.querySelector('#plMin').value || 0,
      sections: [...m.querySelectorAll('[data-plsec][aria-pressed="true"]')].map(b => b.dataset.plsec),
      focusArea: m.querySelector('#plFocus').value,
      quality: m.querySelector('#plQ').value,
      currentBpm: +m.querySelector('#plBpm').value || null,
      notes: m.querySelector('#plNotes').value});
    m.remove(); sound('success'); rerender();
  };
  return m;
}
/* One way in for a logged sitting, whoever is calling: the modal, the timer,
   or the studio's own suggestion. Everything that has to happen when practice
   is recorded happens here, once. */
function logPianoPractice(pieceId, rec){
  const x = pianoPiece(pieceId); if(!x) return null;
  const log = Object.assign({id:uid(), pieceId, date:today(), durationMinutes:0,
    sections:[], focusArea:'', quality:'good', currentBpm:null, notes:''}, rec || {});
  pianoState().practiceLogs.push(log);
  /* practising a piece you had put down picks it up again: "rusty" is worked
     out from the dates, so this happens by itself, but a piece nobody has
     started is started by being practised */
  if(x.status === 'want_to_learn'){ x.status = 'learning'; x.startedAt = x.startedAt || new Date().toISOString(); }
  pianoCreditSkill(log.durationMinutes);
  pianoCreditHabit();
  saveNow();
  return log;
}

/* ---------- the shared clock ----------
   There is already one timer in this house and it is good. Rather than build
   a second, a practice sitting borrows it: the piece becomes the thing being
   timed, and when the sitting ends the minutes come back here as a log. That
   also means practice minutes land in the same focus history as everything
   else, which is what makes the skill credit honest. */
function startPianoTimer(pieceId, sectionId, minutes){
  const x = pianoPiece(pieceId); if(!x) return;
  S._pianoTimed = {pieceId, sectionId: sectionId || null, at: Date.now()};
  if(typeof FocusTimer === 'undefined'){ openPracticeLog(pieceId, {minutes}); return; }
  if(FocusTimer.state().running) FocusTimer.stop();
  FocusTimer.reset();
  const n = +minutes || 0;
  if(n >= 1){ FocusTimer.setMode('countdown'); FocusTimer.setLength(n); }
  else FocusTimer.setMode('stopwatch');
  FocusTimer.setTask(null);
  FocusTimer.start();
  sound('success');
  toast(`The clock is on ${x.title}. End the sitting and it will ask how it went.`, 6000);
  if(typeof paintFocusDock === 'function') paintFocusDock();
}
/* When a borrowed sitting ends, offer to write it down — with the minutes
   already filled in, because the whole reason to time it was not to have to
   remember them. */
function pianoSittingEnded(mins){
  const t = S._pianoTimed; if(!t) return false;
  S._pianoTimed = null;
  if(!(mins >= 1)) return false;
  const x = pianoPiece(t.pieceId); if(!x) return false;
  openPracticeLog(t.pieceId, {minutes: Math.round(mins)});
  return true;
}

/* ---------- what the rest of the house gets out of it ----------
   Practice hours are hours: they belong to the Piano skill, wherever the
   player keeps it. Nothing is invented — if there is no piano skill on the
   tree, nothing is credited, because a skill that appears because you
   practised is a skill you did not choose to track. */
function pianoSkill(){
  return (S.skills || []).find(s => /piano|keyboard/i.test(s.name || '')) || null;
}
function pianoCreditSkill(mins){
  const m = +mins || 0; if(m < 1) return;
  const sk = pianoSkill(); if(!sk) return;
  sk.hours = +(((+sk.hours || 0) + m / 60).toFixed(2));
  sk.lastPracticed = today();
}
/* A habit whose whole content is "practise the piano" is kept by practising
   the piano. Ticking it a second time by hand is the kind of bookkeeping that
   makes people stop using a habit tracker. */
function pianoCreditHabit(){
  const h = (S.habits || []).find(x => !x.archived && /piano|keyboard/i.test(x.name || ''));
  if(!h) return;
  const d = today();
  S.habitLog = S.habitLog || {};
  S.habitLog[d] = S.habitLog[d] || {};
  if(S.habitLog[d][h.id]) return;                 // already kept by hand today
  S.habitLog[d][h.id] = {level:'full', note:'practised'};
}
/* what the weekly review wants to know about the bench */
function pianoReviewLines(from, to){
  /* Asking the studio for a state it has never had would build the whole
     twenty-stage roadmap to answer "nothing happened" — so a room nobody has
     opened stays unopened, and the review and the morning session simply have
     nothing to say about it. */
  if(!S.piano) return [];
  const p = pianoState();
  const logs = p.practiceLogs.filter(l => l.date >= from && l.date <= to);
  const jazz = p.jazz.logs.filter(l => l.date >= from && l.date <= to);
  if(!logs.length && !jazz.length) return [];
  const out = [];
  const mins = sum(logs.map(l => +l.durationMinutes || 0)) + sum(jazz.map(l => +l.durationMinutes || 0));
  const pieces = new Set(logs.map(l => l.pieceId)).size;
  if(mins) out.push(`${Math.round(mins / 60 * 10) / 10} hours at the piano${pieces ? `, across ${pieces} ${pieces === 1 ? 'piece' : 'pieces'}` : ''}.`);
  const keys = new Set(); jazz.forEach(l => (l.keys || []).forEach(k => keys.add(k)));
  if(keys.size) out.push(`Jazz vocabulary worked in ${[...keys].join(', ')}.`);
  const jams = p.jazz.jams.filter(j => j.date >= from && j.date <= to).length;
  if(jams) out.push(`${jams} jam ${jams === 1 ? 'night' : 'nights'}.`);
  const play = jazz.filter(l => l.mode === 'play').length;
  if(jazz.length) out.push(play
    ? `${play} of ${jazz.length} jazz sittings were play rather than practice.`
    : 'Every jazz sitting was practice. Werner would want one of them to be play.');
  const rusty = p.pieces.filter(pianoIsRusty).length;
  if(rusty) out.push(`${rusty} ${rusty === 1 ? 'piece is' : 'pieces are'} going rusty.`);
  return out;
}
