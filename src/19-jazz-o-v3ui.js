/* ============================================================
   CURRICULUM v3 — WHAT THE PAGES SAY ABOUT IT.

   Small pieces the roadmap and the exercise page draw: the type tag
   every entry carries, the document's own words on the exercise it
   describes, the pill that says where the document and the book
   disagree, the stage's outcome and Golden Tip, where it sits on
   Gordon's audiation ladder, and the teaching the old rungs carried
   into it.
   ============================================================ */

/* the document's [Theory] paragraphs are run together with double spaces */
const jazzV3Paras = text => String(text || '').split(/\n\n+|\s{2,}(?=[A-Z0-9“"'(])/).map(p => p.trim()).filter(Boolean);
const jazzV3ParasHTML = (text, cls) => jazzV3Paras(text).map(p => `<p${cls ? ` class="${cls}"` : ''}>${esc(p)}</p>`).join('');

function jazzV3TypePill(ex, short){
  const t = (ex && ex.type) || 'DRILL';
  const d = JAZZ_V3_TYPES[t] || {};
  return `<span class="jzv3-type" data-t="${esc(t)}" title="[${esc(t)}] — ${esc(d.said || '')}">${d.icon || ''}${short ? '' : ' ' + esc(t)}</span>`;
}
/* the other side of each disagreement this exercise is in */
function jazzV3Others(id){
  const out = [];
  jazzV3ConflictsFor(id).forEach(c => {
    (c.v3 === id ? c.app : [c.v3]).forEach(o => { if(o !== id && !out.includes(o)) out.push(o); });
  });
  return out;
}
function jazzV3ConflictPillHTML(id, withText){
  const others = jazzV3Others(id);
  if(!others.length) return '';
  const names = others.map(o => { const e = jazzExercise(o); return `${(e && (e.label || o)) || o}`; }).join(', ');
  return `<span class="jzv3-diff" data-jzopen="${esc(others[0])}" role="link" tabindex="0"
    title="The v3 document and the room's book-checked version differ here. The other side: ${esc(names)}. Both are kept so you can compare and decide.">↔ ${withText ? 'doc and book differ — see ' + esc(names) : 'differs'}</span>`;
}
/* the label a row shows: the document's number where it gave one */
const jazzV3Label = ex => !ex ? '' : ex.isV3 && ex.v3 && ex.v3.label ? ex.v3.label.replace(/\s+/g, '') : ex.id;

/* ---------- on the exercise ---------- */
function jazzV3YouTubeHTML(ex){
  const list = (ex && ex.v3 && ex.v3.youtube) || [];
  if(!list.length) return '';
  return `<div class="jzv3-yt"><span class="sc">Watch</span>${list.map(q =>
    `<a class="jzv3-ytl" href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}" target="_blank" rel="noopener">▶ ${esc(q)}</a>`).join('')}</div>`;
}
/* The document's words, above the notation. For an exercise it merged
   onto they are the document's description of the room's exercise; for a
   new one they are the whole of it. */
function jazzV3PanelHTML(ex){
  const v = ex && ex.v3;
  if(!v) return '';
  const conflicts = jazzV3ConflictsFor(ex.id);
  return `<div class="jzv3-panel">
    <div class="jzv3-head">
      <span class="sc">Curriculum v3${v.label ? ` · ${esc(v.label)}` : ''}</span>
      ${jazzV3TypePill(ex)}
      ${v.merged ? '<span class="jzv3-merged mono" title="The document describes this exercise, so its words are shown on it rather than beside it">the document on this exercise</span>' : ''}
      ${ex.isV3 && !v.extra ? '<span class="jzv3-new mono">new in v3</span>' : ''}
      ${v.extra ? '<span class="jzv3-new mono">from the feature text</span>' : ''}
    </div>
    ${v.name && v.name !== ex.name ? `<b class="serif">${esc(v.name)}</b>` : ''}
    ${v.description ? `<p class="jzv3-desc">${esc(v.description)}</p>` : ''}
    ${v.score ? `<p class="jzv3-score"><span class="mono">[Score]</span> ${esc(v.score)}</p>` : ''}
    ${conflicts.map(c => `<div class="jzv3-conflict">
      <b>Where the document and the book differ</b>
      <p><span class="mono">the room</span> ${esc(c.has)}</p>
      <p><span class="mono">the document</span> ${esc(c.says)}</p>
      <p class="faint">Both are on the ladder. ${jazzV3ConflictPillHTML(ex.id, true)}</p></div>`).join('')}
  </div>`;
}
/* for an entry with nothing to draw, the words ARE the exercise */
function jazzV3MainTextHTML(ex){
  const v = ex && ex.v3;
  const theory = (v && v.theory) || ex.theory || '';
  return `<div class="jzv3-read">
    ${theory ? jazzV3ParasHTML(theory, 'serif') : ''}
    ${!theory && v && v.description ? `<p class="serif">${esc(v.description)}</p>` : ''}
    ${!theory && !(v && v.description) ? `<div class="jz-noscore">This one has nothing to read.
      It is a thing to do — at the instrument or on paper — and the words beside it are the whole of it.</div>` : ''}
  </div>`;
}

/* ---------- on the stage ---------- */
function jazzV3OutcomeHTML(s){
  const o = s && s.outcome;
  if(!o) return '';
  return `<div class="jzv3-outcome">
    <div><span class="sc">After this stage</span><p>${esc(o.after)}</p></div>
    <div><span class="sc">The milestone</span><p class="serif">${esc(o.milestone)}</p></div>
    <div class="jzv3-time"><span class="sc">Time</span><p class="mono">${esc(o.time)}</p></div>
  </div>`;
}
function jazzV3GoldenHTML(s){
  if(!s || !s.goldenTip) return '';
  return `<div class="jzv3-golden"><span class="jzv3-gi" aria-hidden="true">✨</span>
    <div><span class="sc">Golden Tip · Kenny Werner</span><p class="serif">“${esc(s.goldenTip)}”</p></div></div>`;
}
function jazzV3AudiationHTML(s){
  const a = (s && s.audiation) || [];
  if(!a.length) return '';
  return `<div class="jz-note jzv3-aud"><span class="sc">Audiation · Gordon</span>
    ${a.map(x => `<p><b>Stage ${x.n} — ${esc(x.name)}.</b> ${esc(x.said)}</p>`).join('')}
    <button class="tbtn" data-jzgo="#/jazz/audiation">the audiation room →</button></div>`;
}
/* the cross-cutting threads, and which of them run through this stage */
function jazzV3Threads(s){
  const ids = (s && s.subs) || [];
  const exs = ids.map(jazzExercise).filter(Boolean);
  const mat = id => typeof siskindMaterial === 'function' ? siskindMaterial(id) : null;
  const out = [];
  if(exs.some(e => /coordination/i.test(e.name) || (mat(e.id) || {}).kind === 'coord')) out.push('Coordination Exercises');
  if(exs.some(e => e.type === 'WORKSHEET')) out.push('Worksheets');
  if((JAZZ_V3_DOC.ladder || []).some(r => r[0] === String(s.n))) out.push('Repertoire Ladder');
  if((s.listeningAssignments || []).length) out.push('Listening Library');
  if((s.audiation || []).length) out.push('Audiation Training');
  if(s.goldenTip) out.push('Golden Tips');
  return out;
}
function jazzV3ThreadsHTML(s){
  const t = jazzV3Threads(s);
  if(!t.length) return '';
  return `<div class="jzv3-threads">${t.map(x => `<span class="jzv3-thread" title="${esc(
    ((JAZZ_V3_DOC.overview.X || {}).paras || []).find(p => p.indexOf(x) === 0) || x)}">${esc(x)}</span>`).join('')}</div>`;
}
function jazzV3CarriedHTML(s){
  const c = (s && s.carried) || [];
  if(!c.length) return '';
  return `<details class="jzv3-carried"><summary><span class="mono">what the earlier ladder said here</span></summary>
    ${c.map(x => `<div class="jz-note"><span class="sc">${esc(x.name)}</span><p class="serif">${esc(x.theory)}</p></div>`).join('')}
  </details>`;
}

/* ---------- the About page ----------
   Everything in the document that is ABOUT the curriculum rather than
   an exercise in it: the Section 1 overview, the source texts and the
   type legend from its front matter, the Section 3 table of the whole
   road, the Section 6 list of what was left out and why — and the one
   thing the room adds, the list of every place the document and the
   room's book-checked exercises disagree, so both can be compared. */
const JAZZ_V3_SOURCES = [
  'Levine — The Jazz Theory Book', 'Siskind — Jazz Piano Fundamentals Books 1–3',
  'Mantooth — Voicings for Jazz Keyboard', 'Berklee Book of Jazz Harmony',
  'Dobbins — Jazz Arranging and Composing', 'Stoloff — Scat! Vocal Improvisation',
  'Weir — Fearless Vocal Improvisation', 'Peckham — The Contemporary Singer',
  'Gemini AI Research — Pedagogical Roadmap for Classical-to-Jazz Transition'];
function jazzAboutHTML(){
  const ov = JAZZ_V3_DOC.overview || {};
  const rows = (JAZZ_V3_DOC.outcomes || []);
  const stageOf = n => jazzStages().find(s => String(s.n) === String(n));
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Curriculum v3</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    <p class="page-blurb">Jazz Studio — Complete Curriculum v3, Master Build Document. 13-Stage Curriculum with
      Exercise Specifications, MusicXML Notation, Feature Specs, Repertoire Ladder &amp; Gemini Research Integration.</p>
    <div class="jzv3-about">
      <section><h2 class="serif">Overview</h2>${((ov._intro || {}).paras || []).map(p => `<p class="serif">${esc(p)}</p>`).join('')}</section>
      <section><h2 class="serif">Source texts</h2><ul class="jzv3-list">${JAZZ_V3_SOURCES.map(s => `<li>${esc(s)}</li>`).join('')}</ul></section>
      <section><h2 class="serif">Exercise types</h2><div class="jzv3-legend">${Object.keys(JAZZ_V3_TYPES).map(t =>
        `<div>${jazzV3TypePill({type: t})} <span>${esc(JAZZ_V3_TYPES[t].said)}</span>
          <span class="mono faint">${jazzStages().flatMap(s => s.subs).filter(id => (jazzExercise(id) || {}).type === t).length}</span></div>`).join('')}</div></section>
      <section><h2 class="serif">The whole road</h2>
        <p class="faint">Section 3: what you can do after each stage, a concrete musical milestone, and the practice time.</p>
        <div class="jzv3-table-wrap"><table class="jzv3-table"><thead><tr><th>Stage</th><th>Title</th><th>After completing…</th><th>Musical milestone</th><th>Time</th></tr></thead>
        <tbody>${rows.map(r => { const s = r[0] ? stageOf(r[0]) : null;
          return `<tr${r[0] ? '' : ' class="jzv3-total"'}><td class="mono">${esc(r[0])}</td><td>${s
            ? `<a href="#/jazz" data-jzstagego="${esc(s.id)}">${esc(r[1])}</a>` : esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td class="mono">${esc(r[4])}</td></tr>`; }).join('')}</tbody></table></div></section>
      <section><h2 class="serif">Cross-cutting threads</h2>${((ov.X || {}).paras || []).map(p => `<p>${esc(p)}</p>`).join('')}</section>
      <section><h2 class="serif">The Voice Track</h2>${((ov.V || {}).paras || []).map(p => `<p class="serif">${esc(p)}</p>`).join('')}</section>
      <section id="jzConflicts"><h2 class="serif">Where the document and the book differ</h2>
        <p>In ${JAZZ_V3_CONFLICTS.length} places the v3 document gives an exercise number different content from what
          that number already held here — content that had been checked against the books. Both are kept on the
          ladder, next to each other, so you can compare them and decide. Each row links to both.</p>
        <div class="jzv3-table-wrap"><table class="jzv3-table"><thead><tr><th>Stage</th><th>The document</th><th>The room</th><th>What the room has</th><th>What the document says</th></tr></thead>
        <tbody>${JAZZ_V3_CONFLICTS.map(c => { const d = jazzExercise(c.v3); const st = jazzV3StageOf(c.v3);
          return `<tr><td class="mono">${esc(String((jazzStage(st) || {}).n ?? ''))}</td>
            <td><a href="#/jazz/${esc(c.v3)}">${esc(d ? `${jazzV3Label(d)} ${d.name}` : c.v3)}</a></td>
            <td>${c.app.map(a => { const e = jazzExercise(a); return `<a href="#/jazz/${esc(a)}">${esc(a)}${e ? ' ' + esc(e.name) : ''}</a>`; }).join('<br>')}</td>
            <td>${esc(c.has)}</td><td>${esc(c.says)}</td></tr>`; }).join('')}</tbody></table></div></section>
      <section><h2 class="serif">What was left out, and why</h2>
        <p class="faint">Section 6: concepts that appear in the source texts but are not discrete curriculum items.</p>
        <div class="jzv3-table-wrap"><table class="jzv3-table"><thead><tr><th>#</th><th>Concept</th><th>Source</th><th>Why excluded</th></tr></thead>
        <tbody>${(JAZZ_V3_DOC.excluded || []).map(r => `<tr><td class="mono">${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div></section>
      <section><h2 class="serif">The tune database</h2>${(JAZZ_V3_DOC.tunes || []).slice(1, 2).map(p => `<p>${esc(p)}</p>`).join('')}
        <button class="tbtn" data-jzgo="#/jazz/tunes">the tune library →</button></section>
    </div>`;
}
function bindJazzAbout(root){
  $$('[data-jzgo]', root).forEach(b => b.onclick = ev => { ev.preventDefault(); navigate(b.dataset.jzgo); });
  $$('[data-jzstagego]', root).forEach(a => a.onclick = ev => {
    ev.preventDefault();
    const st = jazzState().settings; if(st.collapsed) delete st.collapsed[a.dataset.jzstagego];
    jazzUi().roadView = JAZZ_V3_VOICE.includes(a.dataset.jzstagego) ? 'voice' : 'piano';
    jazzUi().scrollTo = a.dataset.jzstagego;
    navigate('#/jazz');
  });
}
