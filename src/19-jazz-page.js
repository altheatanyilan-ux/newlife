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
  flash:null, tab:'road'}; }

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
    if(rules) rules.RenderChordSymbols = true;
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
  if(want && jazzExercise(want)) ui.exId = want;
  else if(want === 'road') ui.exId = null;
  if(ui.exId && jazzExercise(ui.exId)){
    root.innerHTML = `<div class="page jz-page">${jazzExerciseHTML(ui.exId)}</div>`;
    bindJazzExercise(root, ui.exId);
    return;
  }
  root.innerHTML = `<div class="page jz-page">${jazzRoadHTML()}</div>`;
  bindJazzRoad(root);
};

/* ---------- the roadmap ---------- */
function jazzRoadHTML(){
  const now = jazzNowStage();
  const all = JAZZ_STAGES.map(s => jazzStageGot(s));
  const done = sum(all.map(g => g.done)), of = sum(all.map(g => g.of));
  return `<h1 class="serif">Jazz Studio</h1>
    <p class="page-blurb">Not pieces — patterns, in all twelve keys, until the hands go there
      without being asked. ${done} of ${of} keys are yours.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:16px">
      <button class="btn primary" id="jzCards">\u{1f3af} Flashcards</button>
      <button class="btn sm ghost" id="jzHistory">\u{1f4ca} What you have practised</button>
    </div>
    <div class="jz-road">${JAZZ_STAGES.map(s => jazzStageHTML(s, s.id === now.id)).join('')}</div>`;
}
function jazzStageHTML(s, here){
  const got = jazzStageGot(s);
  const open = jazzStageOpen(s);
  const pct = got.of ? Math.round(got.done / got.of * 100) : 0;
  return `<section class="jz-stage${open ? '' : ' shut'}${here ? ' here' : ''}" data-jzstage="${esc(s.id)}">
    <header class="jz-shead">
      <span class="jz-sn mono">${s.n}</span>
      <span class="jz-st"><b class="serif">${esc(s.name)}</b>
        <span class="faint">${esc(s.blurb)}</span></span>
      <span class="mono jz-scount">${open ? `${got.done}/${got.of}` : '\u{1f512}'}</span>
    </header>
    <div class="jz-sbar"><i style="width:${pct}%"></i></div>
    ${open ? `<div class="jz-subs">${s.subs.map(b => {
      const ex = jazzExercise(b.ex); if(!ex) return '';
      const n = jazzKeysGot(b.ex);
      return `<button class="jz-sub" data-jzopen="${esc(b.ex)}">
        <span class="jz-subn mono">${esc(b.id)}</span>
        <span class="jz-subt">${esc(b.name)}</span>
        <span class="jz-keys">${JAZZ_KEY_NAMES.map(k =>
          `<i class="${jazzRecord(b.ex).keys[k] ? 'on' : ''}" title="${esc(jazzPretty(k))}"></i>`).join('')}</span>
        <span class="mono jz-subc">${n}/12</span></button>`; }).join('')}</div>
      <details class="jz-why"><summary><span class="mono">why this stage</span></summary>
        <p class="serif">${esc(s.theory)}</p>
        <div class="jz-werner"><span class="jz-wi">\u{1f9d8}</span>
          <p>${esc(s.werner)}</p>
          <p class="jz-wm">${esc(s.mindset)}</p></div>
      </details>`
    : `<p class="jz-shut mono">Opens when stage ${jazzStage(s.needs) ? jazzStage(s.needs).n : ''} is finished in all twelve keys.</p>`}
  </section>`;
}
function bindJazzRoad(root){
  $$('[data-jzopen]', root).forEach(b => b.onclick = () => {
    jazzUi().exId = b.dataset.jzopen; navigate('#/jazz/' + b.dataset.jzopen); });
  const cards = root.querySelector('#jzCards');
  if(cards) cards.onclick = () => navigate('#/jazz/cards');
  const hist = root.querySelector('#jzHistory');
  if(hist) hist.onclick = () => openJazzHistory();
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
      <span class="mono faint">${at ? `${esc(at.sub.id)} · ${esc(at.stage.name)}` : ''}</span></div>
    <h1 class="serif" style="margin-top:8px">${esc(ex.name)}</h1>
    <div class="jz-cols">
      <div class="jz-main">
        <div class="jz-keyrow">
          <span class="mono faint">in the key of</span>
          <div class="jz-keypick">${JAZZ_KEY_NAMES.map(k =>
            `<button class="jz-k${k === key ? ' on' : ''}${r.keys[k] ? ' got' : ''}" data-jzkey="${esc(k)}"
              title="${r.keys[k] ? 'yours' : 'not yet'}">${esc(jazzPretty(k))}</button>`).join('')}</div>
        </div>
        <div class="jz-stage-box"><div class="jz-score" id="jzScore"></div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn ${r.keys[key] ? 'ghost' : 'primary'}" id="jzGot">${
            r.keys[key] ? `✓ ${esc(jazzPretty(key))} is yours — take it back` : `Mark ${esc(jazzPretty(key))} as yours`}</button>
          <button class="btn sm ghost" id="jzLog">+ Log a sitting</button>
          <button class="btn sm ghost" id="jzCard">\u{1f3af} Put this in the cards</button>
        </div>
        <div class="jz-count mono">${got} of 12 keys${r.lastAt ? ` · last practised ${esc(relDays(daysSince(r.lastAt)))}` : ''}</div>
      </div>
      <aside class="jz-side">
        <div class="jz-note"><span class="sc">Why it matters</span><p class="serif">${esc(ex.why)}</p></div>
        <div class="jz-note"><span class="sc">How to get it in</span><p>${esc(ex.tip)}</p></div>
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
function bindJazzExercise(root, id){
  const ex = jazzExercise(id);
  const ui = jazzUi();
  const draw = () => jazzEngrave(root.querySelector('#jzScore'), jazzScoreXml(ex.pattern, ui.key));
  draw();
  root.querySelector('#jzBack').onclick = () => { ui.exId = null; navigate('#/jazz'); };
  $$('[data-jzkey]', root).forEach(b => b.onclick = () => {
    ui.key = b.dataset.jzkey; sound('click'); rerender(); });
  const got = root.querySelector('#jzGot');
  if(got) got.onclick = () => {
    const have = !!jazzRecord(id).keys[ui.key];
    jazzSetKey(id, ui.key, !have);
    sound(have ? 'click' : 'success');
    if(!have) toast(`${jazzPretty(ui.key)} — ${jazzKeysGot(id)} of 12.`);
    rerender();
  };
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
