/* ============================================================
   SCORE STUDY — the Study mode of a score in the Repertoire room.

   "◈ study" in the score's head turns it on. The practice side panel steps
   aside for the Study panel (it is still there, and comes back when Study is
   off), and the score gets its analysis layer: chord labels coloured by
   function (T, PD, D) under each bar, faded where the reading is unsure;
   key changes; cadence flags; unit brackets that open their write-up; the
   phrase arches if asked for; the annotations; the reduction.

   The panel's tabs: Overview (keys, harmonic rhythm, the bar check,
   settings, versions), Chords, Cadences, Form, Write-ups, Tension, Takes,
   Notes, Layers, Compare (RomanText in and out, the companion, expert
   corpora, the OMR review) and the Log of decisions.
   ============================================================ */

let _anCtx = null;
const AN_TABS = [['overview', 'Overview'], ['chords', 'Chords'], ['cadences', 'Cadences'], ['form', 'Form'], ['writeups', 'Write-ups'], ['tension', 'Tension'], ['takes', 'Takes'], ['notes', 'Notes'], ['layers', 'Layers'], ['compare', 'Compare'], ['log', 'Log']];
const AN_FN_NAME = {T: 'tonic', PD: 'pre-dominant', D: 'dominant'};
function anStudyOn(){ try { return !!scoreUi().study; } catch(e){ return false; } }
function anTab(){ return scoreUi().anTab || 'overview'; }
function anContext(x){
  anEnsure();
  let parsed = null, error = null;
  try { parsed = anParsed(x); } catch(e){ error = e.message; }
  const a = anCurrent(x.id);
  _anCtx = {x, parsed, a, error, proposals: a && parsed ? anAnnotationProposals(a, parsed) : []};
  return _anCtx;
}
function anOpenTab(x, tab, focus){ const ui = scoreUi(); ui.anTab = tab; if(focus) ui.anFocus = focus; anMount(x); }
function anRepaint(x){ anMount(x); anAfterPaint(x); }
function anOmrLocked(x){ const r = (S.omrReviews || []).find(o => o.scoreId === x.id); if(!r || !r.fromOmr) return false; const n = _anCtx && _anCtx.parsed ? _anCtx.parsed.measures.length : 0; return Object.values(r.status || {}).filter(s => s === 'ok' || s === 'fixed').length < n; }
/* run the whole first pass: keys and chords (in a Worker), then the proposals built on them */
async function anRun(x){
  const ctx = anContext(x); if(!ctx.parsed){ toast(ctx.error || 'This score could not be read.'); return; }
  if(anOmrLocked(x)){ toast('This score came from OMR: review every bar first (Compare → OMR review).', 5000); return; }
  const p = anEnsure(), box = document.getElementById('anSide'); if(box) box.classList.add('busy');
  const r = await anAnalyzeAsync(ctx.parsed, {profile: p.profile, penalty: p.penalty});
  const prev = anCurrent(x.id);
  const a = anNewVersion(x.id, 'auto', {keySpans: r.keySpans, chordLabels: r.chordLabels, harmonicRhythm: r.harmonicRhythm, run: {ms: r.ms, where: r.where, at: anNow()}}, prev && prev.frozen ? prev : null);
  a.cadences = anFindCadences(a, ctx.parsed, {definition: p.cadence});
  a.tension = anTension(a, ctx.parsed, p.weights);
  a.schemata = anFindSchemata(a, ctx.parsed);
  save(); if(box) box.classList.remove('busy');
  toast(`Analysed ${ctx.parsed.measures.length} bars in ${r.ms} ms (${r.where}).`);
  anRepaint(x);
}
/* an edit goes to a draft; a frozen version first becomes a new one */
function anEdit(x, fn){ const a = anEditable(anCurrent(x.id)); if(!a) return; fn(a); a.updatedAt = anNow(); save(); anRepaint(x); }
function anWhy(title){ return new Promise(res => {
  const m = openModal(`<h2 class="serif">${esc(title)}</h2><p class="faint">Why? (optional — it goes in the log of decisions, which is never edited.)</p><textarea class="inp" id="anWhyT" rows="3"></textarea>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn ghost" id="anWhyS">Skip</button><button class="btn primary" id="anWhyOk">Keep</button></div>`, 'narrow');
  const done = v => { m.remove(); res(v); };
  m.querySelector('#anWhyS').onclick = () => done(''); m.querySelector('#anWhyOk').onclick = () => done(m.querySelector('#anWhyT').value.trim());
  setTimeout(() => m.querySelector('#anWhyT').focus(), 30); }); }
function anAskText(title, value){ return new Promise(res => {
  const m = openModal(`<h2 class="serif">${esc(title)}</h2><input class="inp" id="anAT" value="${esc(value || '')}"><div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn ghost" id="anAN">Cancel</button><button class="btn primary" id="anAO">OK</button></div>`, 'narrow');
  const i = m.querySelector('#anAT'); setTimeout(() => i.focus(), 30); const done = v => { m.remove(); res(v); };
  m.querySelector('#anAO').onclick = () => done(i.value.trim()); m.querySelector('#anAN').onclick = () => done(null); i.onkeydown = e => { if(e.key === 'Enter') done(i.value.trim()); }; }); }

/* ---------- the panel ---------- */
function anMount(x){
  const box = document.getElementById('anSide'); if(!box) return;
  const ctx = anContext(x), tab = anTab(), a = ctx.a;
  const versions = anVersions(x.id);
  const head = `<div class="an-head"><b class="serif">Study</b>
    ${versions.length ? `<select class="sel sm" id="anVer" aria-label="Version">${versions.map(v => `<option value="${v.id}"${a && v.id === a.id ? ' selected' : ''}>v${v.version} · ${v.origin}${v.frozen ? ' · saved' : ' · draft'}${v.label ? ' · ' + esc(v.label) : ''}</option>`).join('')}</select>` : ''}
    <span class="grow"></span><button class="btn sm${a ? ' ghost' : ' primary'}" id="anRun"${anOmrLocked(x) ? ' disabled' : ''}>${a ? 'Analyse again' : 'Analyse'}</button>
    ${a && !a.frozen ? '<button class="btn sm ghost" id="anFreeze" title="save this interpretation; later edits start a new version">Save interpretation</button>' : ''}</div>
    <nav class="an-tabs">${AN_TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-antab="${k}">${n}</button>`).join('')}</nav>
    <div class="an-now" id="anNow"></div>`;
  let body = '';
  if(ctx.error) body = `<p class="an-warn">${esc(ctx.error)}</p>`;
  else if(!a && !['compare', 'log', 'takes', 'notes'].includes(tab)) body = `<div class="an-empty"><p>Nothing analysed yet.</p><p class="faint">“Analyse” reads the notes, finds the keys and labels the chords. Everything it proposes is shown with how sure it is and the next-best reading — you confirm, choose or write your own.</p></div>`;
  else body = ({overview: anOverviewHTML, chords: anChordsHTML, cadences: anCadencesHTML, form: anFormHTML, writeups: anWriteupsHTML, tension: anTensionHTML, takes: anTakesHTML, notes: anNotesHTML, layers: anLayersHTML, compare: anCompareHTML, log: anLogHTML}[tab] || anOverviewHTML)(x, a, ctx.parsed);
  box.innerHTML = head + `<div class="an-body" id="anBody">${body}</div>`;
  box.querySelectorAll('[data-antab]').forEach(b => b.onclick = () => anOpenTab(x, b.dataset.antab));
  box.querySelector('#anRun').onclick = () => anRun(x);
  const fr = box.querySelector('#anFreeze'); if(fr) fr.onclick = async () => { const l = await anAskText('A name for this interpretation', `Version ${a.version}`); if(l === null) return; anFreeze(a, l); anRepaint(x); };
  const vs = box.querySelector('#anVer'); if(vs) vs.onchange = () => { anSetCurrent(x.id, vs.value); anRepaint(x); };
  if(!ctx.error && (a || ['compare', 'log', 'takes', 'notes'].includes(tab))) ({overview: anBindOverview, chords: anBindChords, cadences: anBindCadences, form: anBindForm, writeups: anBindWriteups, tension: anBindTension, takes: anBindTakes, notes: anBindNotesTab, layers: anBindLayers, compare: anBindCompare, log: () => {}}[tab] || (() => {}))(box, x, a, ctx.parsed);
  box.querySelectorAll('[data-anbar]').forEach(b => b.onclick = () => { if(typeof scoreScrollTo === 'function') scoreScrollTo(+b.dataset.anbar); });
}
const anConf = c => `<i class="an-conf" style="--v:${Math.round((c || 0) * 100)}%" title="${Math.round((c || 0) * 100)}% sure"></i>`;
function anKeyLabel(k){ return k ? `${k.name} ${k.mode}` : '?'; }

/* ---------- overview ---------- */
function anOverviewHTML(x, a, P){
  const p = anEnsure();
  const hr = a.harmonicRhythm || P.measures.map(M => anChords(a).filter(c => c.measure === M.num).length);
  const maxH = Math.max(1, ...hr);
  return `<section class="an-sec"><h4>Keys</h4>${(a.keySpans || []).map(s => `<div class="an-keyrow"><button class="an-link" data-anbar="${s.startMeasure}">bar ${s.startMeasure}</button><b>${anKeyLabel(s.key)}</b>${anConf(s.confidence)}
      <span class="faint">next best: ${anKeyLabel(s.alternatives && s.alternatives[0] && s.alternatives[0].key)}</span>${s.dominantWarning ? '<span class="an-warn sm" title="Key finding often confuses a key with its dominant">runner-up is the dominant — check</span>' : ''}</div>`).join('') || '<p class="faint">None.</p>'}</section>
    <section class="an-sec"><h4>Harmonic rhythm <span class="faint">chord changes per bar</span></h4>
      <svg class="an-hr" viewBox="0 0 ${Math.max(40, hr.length * 6)} 40" preserveAspectRatio="none" role="img" aria-label="Chord changes per bar">${hr.map((v, i) => `<rect x="${i * 6 + 1}" y="${40 - v / maxH * 36}" width="4" height="${v / maxH * 36}" rx="1"><title>bar ${P.measures[i] ? P.measures[i].num : i + 1}: ${v}</title></rect>`).join('')}</svg></section>
    <section class="an-sec"><h4>The bar check</h4>${P.problems.length ? `<p class="an-warn">${P.problems.length} bar${P.problems.length === 1 ? '' : 's'} where a voice’s notes and rests do not fill the time signature:</p>${P.problems.slice(0, 20).map(q => `<div><button class="an-link" data-anbar="${P.measures[q.m] ? P.measures[q.m].num : q.m + 1}">bar ${P.measures[q.m] ? P.measures[q.m].num : q.m + 1}</button> <span class="faint">part ${q.part + 1}, voice ${esc(q.voice)}: ${q.have} of ${q.want} quarters</span></div>`).join('')}` : '<p class="faint">Every bar adds up.</p>'}</section>
    <section class="an-sec"><h4>Settings</h4>
      <label class="an-f"><span>Key profile</span><select class="sel" id="anProf">${Object.entries(AN_PROFILES).map(([k, v]) => `<option value="${k}"${p.profile === k ? ' selected' : ''}>${v.name}</option>`).join('')}</select></label>
      <label class="an-f"><span>Modulation penalty <b id="anPenV">${p.penalty}</b> <small>higher keeps the key longer</small></span><input type="range" min="0.2" max="3" step="0.1" id="anPen" value="${p.penalty}"></label>
      <label class="an-f"><span>Cadence definition</span><select class="sel" id="anCadDef"><option value="broad"${p.cadence === 'broad' ? ' selected' : ''}>broad (plagal and inverted dominants count)</option><option value="strict"${p.cadence === 'strict' ? ' selected' : ''}>strict (Caplin)</option></select></label>
      <p class="faint">Changes apply the next time you press “Analyse again”.</p></section>
    ${a.run ? `<p class="faint">Analysed in ${a.run.ms} ms, in the ${esc(a.run.where)}.</p>` : ''}`;
}
function anBindOverview(box, x){
  const p = anEnsure();
  box.querySelector('#anProf').onchange = e => { p.profile = e.target.value; save(); };
  box.querySelector('#anPen').oninput = e => { p.penalty = +e.target.value; box.querySelector('#anPenV').textContent = p.penalty; save(); };
  box.querySelector('#anCadDef').onchange = e => { p.cadence = e.target.value; save(); };
}

/* ---------- chords ---------- */
function anChordsHTML(x, a){
  const ui = scoreUi(), only = ui.anUnsure;
  const list = (a.chordLabels || []).filter(c => !only || c.confidence < 0.5 || c.status === 'proposed' && c.alt);
  const byBar = new Map(); list.forEach(c => (byBar.get(c.measure) || byBar.set(c.measure, []).get(c.measure)).push(c));
  return `<div class="an-row"><label class="an-chk"><input type="checkbox" id="anUnsure"${only ? ' checked' : ''}> only the unsure ones</label><span class="grow"></span>
      <button class="btn sm ghost" id="anAcceptAll" title="accept every label still proposed">accept all proposed</button></div>
    <p class="faint">T tonic · PD pre-dominant · D dominant. The bar under each label is how sure the reading is.</p>
    <div class="an-chords">${[...byBar.entries()].map(([m, cs]) => `<div class="an-bar${ui.anMeasure === m ? ' on' : ''}" id="anBar${m}"><button class="an-link" data-anbar="${m}">${m}</button>
      ${cs.map(c => `<div class="an-chip ${c.chosenFn || c.function} ${c.status}" data-anc="${c.id}"><b>${esc(c.chosen || c.roman)}</b><span class="faint">${esc(c.functionalBass || '')}</span>${anConf(c.confidence)}
        <span class="an-chipbtns">${c.status === 'proposed' ? `<button data-anacc="${c.id}" title="accept">✓</button>` : ''}${c.alt ? `<button data-analt="${c.id}" title="choose the other reading">${esc(c.alt.roman)}</button>` : ''}<button data-anown="${c.id}" title="type your own">✎</button><button data-anrej="${c.id}" title="not a chord">×</button></span></div>`).join('')}</div>`).join('') || '<p class="faint">Nothing to show.</p>'}</div>`;
}
function anBindChords(box, x, a){
  const ui = scoreUi();
  box.querySelector('#anUnsure').onchange = e => { ui.anUnsure = e.target.checked; anMount(x); };
  box.querySelector('#anAcceptAll').onclick = () => anEdit(x, b => b.chordLabels.forEach(c => { if(c.status === 'proposed') c.status = 'accepted'; }));
  const find = (b, id) => b.chordLabels.find(c => c.id === id);
  box.querySelectorAll('[data-anacc]').forEach(el => el.onclick = () => anEdit(x, b => { find(b, el.dataset.anacc).status = 'accepted'; }));
  box.querySelectorAll('[data-analt]').forEach(el => el.onclick = async () => { const c0 = find(a, el.dataset.analt); const why = await anWhy(`Bar ${c0.measure}: ${c0.alt.roman} rather than ${c0.roman}`);
    anLog(x.id, {kind: 'chord', measure: c0.measure, beat: c0.beat, readings: [c0.roman, c0.alt.roman], chose: c0.alt.roman, why});
    anEdit(x, b => { const c = find(b, c0.id); c.chosen = c.alt.roman; c.chosenFn = c.alt.function; c.status = 'relabelled'; }); });
  box.querySelectorAll('[data-anown]').forEach(el => el.onclick = async () => { const c0 = find(a, el.dataset.anown); const t = await anAskText(`Bar ${c0.measure}, beat ${c0.beat}: your label`, c0.chosen || c0.roman); if(!t) return;
    const why = await anWhy(`Bar ${c0.measure}: ${t} rather than ${c0.roman}`);
    anLog(x.id, {kind: 'chord', measure: c0.measure, beat: c0.beat, readings: [c0.roman, c0.alt && c0.alt.roman].filter(Boolean), chose: t, own: true, why});
    anEdit(x, b => { const c = find(b, c0.id); c.chosen = t; c.chosenFn = anFunctionOfRoman(t); c.status = 'relabelled'; }); });
  box.querySelectorAll('[data-anrej]').forEach(el => el.onclick = () => anEdit(x, b => { const c = find(b, el.dataset.anrej); c.status = 'rejected'; anLog(x.id, {kind: 'chord', measure: c.measure, readings: [c.roman], chose: 'none (rejected)'}); }));
  if(ui.anMeasure){ const el = box.querySelector('#anBar' + ui.anMeasure); if(el) el.scrollIntoView({block: 'center'}); }
}

/* ---------- cadences ---------- */
function anCadencesHTML(x, a){
  const cads = (a.cadences || []).slice().sort((p, q) => p.on - q.on);
  return `<div class="an-row"><span class="faint">${anEnsure().cadence} definition</span><span class="grow"></span><button class="btn sm ghost" id="anRefind">Find again</button><button class="btn sm" id="anSeed">Seed the form from accepted cadences</button></div>
    <div class="an-list">${cads.map(c => `<div class="an-cad ${c.status}" data-ancad="${c.id}"><button class="an-link" data-anbar="${c.measure}">bar ${c.measure}</button>
      <select class="sel sm" data-cadtype>${Object.keys(AN_CAD_TYPES).map(t => `<option${t === c.type ? ' selected' : ''}>${t}</option>`).join('')}</select>
      <select class="sel sm" data-cadlevel>${AN_LEVELS.map(l => `<option${l === c.level ? ' selected' : ''}>${l}</option>`).join('')}</select>
      ${c.limitedScope ? '<span class="an-tag" title="a cadential progression inside the phrase">limited scope</span>' : ''}${anConf(c.confidence)}
      <span class="an-st">${c.status}</span><span class="grow"></span>${c.status === 'proposed' ? '<button class="btn sm" data-cadacc>accept</button>' : ''}<button class="btn sm ghost" data-cadrej>reject</button></div>`).join('') || '<p class="faint">No cadence candidates. Try the broad definition, or check the chords first.</p>'}</div>`;
}
function anBindCadences(box, x, a){
  box.querySelector('#anRefind').onclick = () => anEdit(x, b => { const P = _anCtx.parsed; const kept = (b.cadences || []).filter(c => c.status !== 'proposed'); const fresh = anFindCadences(b, P, {definition: anEnsure().cadence}).filter(c => !kept.some(k => k.id === c.id)); b.cadences = kept.concat(fresh); });
  box.querySelector('#anSeed').onclick = () => anEdit(x, b => { const P = _anCtx.parsed; b.units = anSeedUnits(b, P); b.sections = anSeedSections(b, P); toast(`${b.units.length} units and ${b.sections.length} sections proposed.`); });
  box.querySelectorAll('[data-ancad]').forEach(row => { const id = row.dataset.ancad, c0 = a.cadences.find(c => c.id === id);
    row.querySelector('[data-cadtype]').onchange = async e => { const why = await anWhy(`Bar ${c0.measure}: ${e.target.value} rather than ${c0.type}`); anLog(x.id, {kind: 'cadence', measure: c0.measure, readings: [c0.type], chose: e.target.value, why});
      anEdit(x, b => { const c = b.cadences.find(z => z.id === id); c.type = e.target.value; c.status = 'relabelled'; }); };
    row.querySelector('[data-cadlevel]').onchange = e => anEdit(x, b => { const c = b.cadences.find(z => z.id === id); c.level = e.target.value; if(c.status === 'proposed') c.status = 'accepted'; });
    const acc = row.querySelector('[data-cadacc]'); if(acc) acc.onclick = () => anEdit(x, b => { b.cadences.find(z => z.id === id).status = 'accepted'; });
    row.querySelector('[data-cadrej]').onclick = async () => { const why = await anWhy(`Bar ${c0.measure}: not a cadence`); anLog(x.id, {kind: 'cadence', measure: c0.measure, readings: [c0.type], chose: 'none', why}); anEdit(x, b => { b.cadences.find(z => z.id === id).status = 'rejected'; }); };
  });
}

/* ---------- form ---------- */
function anFormHTML(x, a, P){
  const units = (a.units || []).filter(u => u.status !== 'rejected');
  const n = P.measures.length, first = n ? P.measures[0].num : 1;
  const L = m => ((m - first) / Math.max(1, n)) * 100;
  const bounds = new Set(units.filter(u => u.kind !== 'period').map(u => u.endMeasure));
  const flags = anNormFlags(a, P);
  return `<p class="faint">The timeline: click between two bars to add or remove a boundary. Units are seeded from the cadences you accepted; name each one.</p>
    <div class="an-tl">${units.filter(u => u.kind !== 'period').map(u => `<div class="an-unit" style="left:${L(u.startMeasure)}%;width:${L(u.endMeasure + 1) - L(u.startMeasure)}%"><span>${esc(u.kind)}</span></div>`).join('')}
      ${units.filter(u => u.kind === 'period').map(u => `<div class="an-unit period" style="left:${L(u.startMeasure)}%;width:${L(u.endMeasure + 1) - L(u.startMeasure)}%"><span>period</span></div>`).join('')}
      ${P.measures.slice(0, -1).map(M => `<button class="an-gap${bounds.has(M.num) ? ' on' : ''}" data-angap="${M.num}" style="left:${L(M.num + 1)}%" title="after bar ${M.num}"></button>`).join('')}</div>
    <div class="an-tlnums">${P.measures.filter((M, i) => i % Math.max(1, Math.ceil(n / 10)) === 0).map(M => `<span style="left:${L(M.num)}%">${M.num}</span>`).join('')}</div>
    <div class="an-list">${units.map(u => { const z = anPhraseModel(a, u);
      return `<div class="an-unitrow" data-anunit="${u.id}"><button class="an-link" data-anbar="${u.startMeasure}">${u.startMeasure}–${u.endMeasure}</button>
        <select class="sel sm" data-unitkind>${AN_UNIT_KINDS.map(k => `<option${k === u.kind ? ' selected' : ''}>${k}</option>`).join('')}</select><span class="an-st">${u.status}</span><span class="grow"></span>
        ${u.status === 'proposed' ? '<button class="btn sm" data-unitacc>accept</button>' : ''}<button class="btn sm ghost" data-unitrej>reject</button>
        ${u.kind !== 'period' ? `<div class="an-zones">${z.map(q => `<span class="an-zone ${q.zone}" style="flex:${Math.max(1, (q.to.off || q.to.on + 1) - q.from.on)}" title="${q.zone}${q.note ? ' — ' + q.note : ''}: bars ${q.from.measure}–${q.to.measure}">${q.zone}</span>`).join('')}</div>` : ''}</div>`; }).join('') || '<p class="faint">No units yet. Accept some cadences, then “Seed the form”.</p>'}</div>
    ${flags.length ? `<section class="an-sec"><h4>Worth interpreting</h4>${flags.map(f => `<div class="an-flag"><button class="an-link" data-anbar="${f.measure}">bar ${f.measure}</button> ${esc(f.text)}</div>`).join('')}</section>` : ''}`;
}
function anBindForm(box, x, a){
  const P = _anCtx.parsed;
  box.querySelectorAll('[data-angap]').forEach(g => g.onclick = () => anEdit(x, b => {
    const m = +g.dataset.angap; const us = (b.units || []).filter(u => u.kind !== 'period' && u.status !== 'rejected');
    const endHere = us.find(u => u.endMeasure === m), inside = us.find(u => u.startMeasure <= m && u.endMeasure > m);
    if(endHere){ const next = us.find(u => u.startMeasure === m + 1); if(next){ endHere.endMeasure = next.endMeasure; endHere.endBeat = next.endBeat; b.units = b.units.filter(u => u !== next); } }
    else if(inside){ const tail = Object.assign({}, inside, {id: 'u' + (m + 1) + '_' + Date.now().toString(36), startMeasure: m + 1, status: 'mine'}); inside.endMeasure = m; inside.endBeat = (P.measures.find(M => M.num === m) || {beats: 4}).beats; b.units.push(tail); }
    else b.units = (b.units || []).concat([{id: 'u1_' + Date.now().toString(36), startMeasure: P.measures[0].num, startBeat: 1, endMeasure: m, endBeat: 4, kind: 'phrase', status: 'mine'}, {id: 'u' + (m + 1) + '_' + Date.now().toString(36), startMeasure: m + 1, startBeat: 1, endMeasure: P.measures[P.measures.length - 1].num, endBeat: 4, kind: 'phrase', status: 'mine'}]);
    b.units.sort((p, q) => p.startMeasure - q.startMeasure);
    b.sections = anSeedSections(b, P);
  }));
  box.querySelectorAll('[data-anunit]').forEach(row => { const id = row.dataset.anunit;
    row.querySelector('[data-unitkind]').onchange = e => anEdit(x, b => { const u = b.units.find(z => z.id === id); u.kind = e.target.value; if(u.status === 'proposed') u.status = 'accepted'; b.sections = anSeedSections(b, P); });
    const acc = row.querySelector('[data-unitacc]'); if(acc) acc.onclick = () => anEdit(x, b => { b.units.find(z => z.id === id).status = 'accepted'; });
    row.querySelector('[data-unitrej]').onclick = () => anEdit(x, b => { b.units.find(z => z.id === id).status = 'rejected'; b.sections = anSeedSections(b, P); });
  });
}

/* ---------- write-ups ---------- */
function anWriteupsHTML(x, a, P){
  const secs = a.sections && a.sections.length ? a.sections : anSeedSections(a, P);
  const ui = scoreUi(), cur = secs.find(s => s.id === ui.anFocus) || secs[0];
  const tree = (pid, d) => secs.filter(s => (s.parentId || null) === pid).map(s => `<button class="an-out${cur && s.id === cur.id ? ' on' : ''}" data-ansec="${s.id}" style="--d:${d}">${esc(s.label)} <span class="faint">${s.startMeasure}–${s.endMeasure}</span></button>${tree(s.id, d + 1)}`).join('');
  if(!cur) return '<p class="faint">No sections yet.</p>';
  const versions = anWriteupsFor(a, cur.id), latest = versions[versions.length - 1];
  const shown = latest && latest.status !== 'rejected' ? latest.blocks : anWriteupBlocks(a, cur, P);
  return `<div class="an-wgrid"><nav class="an-outline">${tree(null, 0)}</nav><article class="an-writeup">
    <h4 class="serif">${esc(cur.label)} <span class="faint">bars ${cur.startMeasure}–${cur.endMeasure}</span></h4>
    <p class="faint">${latest ? `Version ${latest.version} — ${latest.status === 'accepted' ? 'accepted' : latest.status === 'mine' ? 'yours' : latest.status}` : 'Proposed, by rule, from the confirmed analysis. Nothing here is written by a model.'}</p>
    ${shown.map((b, i) => `<section class="an-block"><h5>${esc(b.title)}</h5><div class="an-btext" data-anblock="${i}">${esc(b.text).replace(/\n/g, '<br>')}</div></section>`).join('')}
    <div class="row an-wbtns">${!latest || latest.status === 'rejected' ? '<button class="btn sm primary" id="anWAcc">Accept</button>' : ''}<button class="btn sm ghost" id="anWEdit">Edit…</button><button class="btn sm ghost" id="anWRej">Reject</button><button class="btn sm ghost" id="anWOwn">Write my own</button></div>
    <div class="row an-wbtns"><button class="btn sm" id="anPractise">Practise this section</button><button class="btn sm ghost" id="anReflect">Reflect…</button>${typeof treeCapture === 'function' ? '<button class="btn sm ghost" id="anTree">Send an insight to the Knowledge Tree</button>' : ''}</div>
    ${versions.length > 1 ? `<details class="an-hist"><summary>Earlier versions (${versions.length - 1})</summary>${versions.slice(0, -1).reverse().map(v => `<div class="an-oldw"><b>v${v.version}</b> <span class="faint">${v.status}, ${esc(v.createdAt.slice(0, 10))}</span><p>${esc(v.blocks.map(b => b.text).join(' ')).slice(0, 4000)}</p></div>`).join('')}</details>` : ''}
  </article></div>`;
}
function anBindWriteups(box, x, a){
  const P = _anCtx.parsed, ui = scoreUi();
  const secs = a.sections && a.sections.length ? a.sections : anSeedSections(a, P);
  const cur = secs.find(s => s.id === ui.anFocus) || secs[0]; if(!cur) return;
  box.querySelectorAll('[data-ansec]').forEach(b => b.onclick = () => { ui.anFocus = b.dataset.ansec; anMount(x); const s = secs.find(z => z.id === b.dataset.ansec); if(s && typeof scoreScrollTo === 'function') scoreScrollTo(s.startMeasure); });
  const blocks = anWriteupBlocks(a, cur, P), versions = anWriteupsFor(a, cur.id), latest = versions[versions.length - 1];
  const shown = latest && latest.status !== 'rejected' ? latest.blocks : blocks;
  const acc = box.querySelector('#anWAcc'); if(acc) acc.onclick = () => { anAddWriteup(a, cur.id, blocks, 'accepted', 'rule'); anMount(x); };
  box.querySelector('#anWRej').onclick = async () => { const why = await anWhy('Reject this write-up'); anAddWriteup(a, cur.id, shown, 'rejected', 'rule'); anLog(x.id, {kind: 'writeup', measure: cur.startMeasure, readings: ['proposed write-up'], chose: 'rejected', why}); anMount(x); };
  const editor = (start, status) => { const m = openModal(`<h2 class="serif">${esc(cur.label)}</h2><p class="faint">Each save is a new version; the old ones stay.</p>${start.map((b, i) => `<label class="an-f"><span>${esc(b.title)}</span><textarea class="inp" rows="5" data-we="${i}">${esc(b.text)}</textarea></label>`).join('')}
      <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="weNo">Cancel</button><button class="btn primary" id="weOk">Save as a new version</button></div>`);
    m.querySelector('#weNo').onclick = () => m.remove();
    m.querySelector('#weOk').onclick = () => { const out = start.map((b, i) => Object.assign({}, b, {text: m.querySelector(`[data-we="${i}"]`).value})); anAddWriteup(a, cur.id, out, status, 'mine'); m.remove(); anMount(x); }; };
  box.querySelector('#anWEdit').onclick = () => editor(shown, 'mine');
  box.querySelector('#anWOwn').onclick = () => editor(['harmony', 'cadences', 'form', 'tension', 'interpretation'].map(k => ({kind: k, title: {harmony: 'Harmony', cadences: 'Cadences', form: 'Form', tension: 'Tension', interpretation: 'What it suggests for playing'}[k], text: ''})), 'mine');
  box.querySelector('#anPractise').onclick = () => anPractiseRange(x, cur.startMeasure, cur.endMeasure, cur.label);
  box.querySelector('#anReflect').onclick = () => anReflect(x, cur.startMeasure, `${cur.label} (bars ${cur.startMeasure}–${cur.endMeasure})`);
  const tr = box.querySelector('#anTree'); if(tr) tr.onclick = async () => { const t = await anAskText('The insight, in a sentence', ''); if(!t) return;
    treeCapture(`${t} — from ${x.title}, bars ${cur.startMeasure}–${cur.endMeasure} (#/score/${x.id})`); toast('In the Knowledge Tree’s inbox.'); };
}
/* the room's own practice section, found or made, and focused */
function anPractiseRange(x, from, to, name){
  x.sections = x.sections || [];
  let s = x.sections.find(q => q.startMeasure === from && q.endMeasure === to);
  if(!s){ s = {id: uid(), name: name || `Bars ${from}–${to}`, startMeasure: from, endMeasure: to, status: 'learning', comfortTempo: null, targetTempo: null, practiceCount: 0, lastPracticedDate: null, notes: '', color: '#7f916a'}; x.sections.push(s); }
  const ui = scoreUi(); ui.focus = s.id; ui.study = false; save(); rerender();
  toast(`Focused on ${s.name}. The player's loop follows it.`);
}
function anReflect(x, measure, what){
  const L = {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []};
  if(typeof openEntryModal === 'function'){
    const e = {id: uid(), type: 'reflection', title: `${x.title}: ${what}`, body: '', occurredAt: today(), createdAt: anNow(), links: L, tags: [], extra: {scoreId: x.id, measure, analysisId: (anCurrent(x.id) || {}).id || null}};
    S.entries.push(e); save(); openEntryModal({entryId: e.id, type: 'reflection'});
  }
}

/* ---------- tension ---------- */
function anTensionHTML(x, a, P){
  const p = anEnsure(), w = Object.assign({}, AN_TENSION_DEFAULTS, p.weights || {});
  const curve = a.tension ? a.tension.curve : [];
  const cads = (a.cadences || []).filter(c => c.status === 'accepted' || c.status === 'relabelled');
  const end = P.measures.length ? P.measures[P.measures.length - 1].start + P.measures[P.measures.length - 1].len : 1;
  const W = 600, H = 120, X = on => 30 + on / end * (W - 40), Y = v => 8 + (1 - v) * (H - 24);
  return `<p class="faint">A <b>harmonic tension estimate</b> after Lerdahl — rhythm, dynamics, register and timbre also matter. The formula is documented in the code; the weights are yours.</p>
    <div class="an-weights">${[['hier', 'distance from the tonic'], ['seq', 'distance from the last chord'], ['key', 'distance of the key from home'], ['surface', 'dissonance, inversion, sevenths'], ['attract', 'the melody’s pull']].map(([k, l]) => `<label class="an-f"><span>${l} <b data-wv="${k}">${w[k]}</b></span><input type="range" min="0" max="3" step="0.1" data-aw="${k}" value="${w[k]}"></label>`).join('')}</div>
    <div class="row"><button class="btn sm" id="anTRe">Recompute</button><label class="an-chk"><input type="checkbox" id="anArch"${p.arches ? ' checked' : ''}> phrase arches on the score (a reference shape, not an instruction)</label></div>
    ${curve.length ? `<svg class="an-tchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Harmonic tension estimate over the piece">
      ${[0, 0.5, 1].map(v => `<line class="an-grid" x1="30" x2="${W - 10}" y1="${Y(v)}" y2="${Y(v)}"/><text class="an-ax" x="26" y="${Y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
      ${cads.map(c => `<rect class="an-arrive" x="${X(c.on) - 1.5}" y="${Y(anArrivalWeight(c) / 4.8)}" width="3" height="${H - 16 - Y(anArrivalWeight(c) / 4.8)}"><title>${esc(c.type)} at bar ${c.measure}, ${c.level}: arrival weight ${anArrivalWeight(c).toFixed(1)}</title></rect>`).join('')}
      <polyline class="an-tension" points="${curve.map(pt => `${X(pt.on).toFixed(1)},${Y(pt.value).toFixed(1)}`).join(' ')}"/>
      ${curve.map(pt => `<circle class="an-tdot" cx="${X(pt.on).toFixed(1)}" cy="${Y(pt.value).toFixed(1)}" r="5" fill="transparent"><title>bar ${pt.measure}, ${esc(pt.roman)}: ${pt.value} (from tonic ${pt.parts.hier}, from last ${pt.parts.seq}, surface ${pt.parts.surface}, pull ${pt.parts.attract})</title></circle>`).join('')}</svg>
      <details class="an-numbers"><summary>Numbers</summary><table><tr><th>bar</th><th>chord</th><th>tension</th></tr>${curve.map(pt => `<tr><td>${pt.measure}</td><td>${esc(pt.roman)}</td><td>${pt.value}</td></tr>`).join('')}</table></details>` : '<p class="faint">Analyse first.</p>'}
    <section class="an-sec"><h4>Arrival weight <span class="faint">how much time and space an arrival might take — a reference</span></h4>${cads.map(c => `<div class="an-arrow"><button class="an-link" data-anbar="${c.measure}">bar ${c.measure}</button> ${esc(c.type)} · ${c.level} <i class="an-wbar" style="width:${anArrivalWeight(c) * 20}px"></i></div>`).join('') || '<p class="faint">Accept cadences and set their levels first.</p>'}</section>`;
}
function anBindTension(box, x){
  const p = anEnsure(); p.weights = Object.assign({}, AN_TENSION_DEFAULTS, p.weights || {});
  box.querySelectorAll('[data-aw]').forEach(i => i.oninput = () => { p.weights[i.dataset.aw] = +i.value; box.querySelector(`[data-wv="${i.dataset.aw}"]`).textContent = i.value; save(); });
  box.querySelector('#anTRe').onclick = () => anEdit(x, b => { b.tension = anTension(b, _anCtx.parsed, p.weights); });
  box.querySelector('#anArch').onchange = e => { p.arches = e.target.checked; save(); anAfterPaint(x); };
}

/* ---------- takes ---------- */
function anTakesHTML(x, a, P){
  const takes = (S.takes || []).filter(t => t.scoreId === x.id).sort((p, q) => q.createdAt.localeCompare(p.createdAt));
  const ui = scoreUi(), sel = (ui.anTakes || []).filter(id => takes.some(t => t.id === id)).slice(0, 2);
  const series = sel.map(id => { const t = takes.find(z => z.id === id); return {t, pts: anTakeTempo(t, P, ui.anSmooth)}; });
  return `<div class="row"><button class="btn sm primary" id="anTap">Tap along</button><label class="an-chk"><input type="checkbox" id="anSmooth"${ui.anSmooth ? ' checked' : ''}> smooth</label></div>
    <p class="faint">Press Space on each beat as you play or listen; Esc ends the take. Pick one take to see it against the structure, or two to compare.</p>
    <div class="an-list">${takes.map(t => `<label class="an-take"><input type="checkbox" data-antk="${t.id}"${sel.includes(t.id) ? ' checked' : ''}> <b>${esc(t.label)}</b> <span class="faint">${esc(t.createdAt.slice(0, 16).replace('T', ' '))} · ${t.taps.length} taps from bar ${t.startMeasure}${t.practiceId ? ' · with a logged sitting' : ''}</span></label>`).join('') || '<p class="faint">No takes yet.</p>'}</div>
    ${series.length ? `<div class="an-legend">${series.map((s, i) => `<span><i class="s${i}"></i>${esc(s.t.label)}</span>`).join('')}<span><i class="ten"></i>tension</span></div>${anOverlaySVG(P, a, series)}
      ${series.map(s => `<div class="an-facts"><b>${esc(s.t.label)}</b>${anTakeFacts(s.t, a, P).lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>`).join('')}` : ''}
    ${takes.length > 1 && a ? `<section class="an-sec"><h4>Consistency at phrase ends <span class="faint">spread of your tempo there, across ${takes.length} takes</span></h4><table class="an-tab"><tr><th>phrase ends</th><th>takes</th><th>mean (× median)</th><th>spread (sd)</th></tr>${anTakesConsistency(takes, a, P).map(r => `<tr><td>bar ${r.unit.endMeasure}</td><td>${r.n}</td><td>${r.mean ?? '—'}</td><td>${r.sd ?? '—'}</td></tr>`).join('')}</table></section>` : ''}`;
}
function anBindTakes(box, x, a){
  const ui = scoreUi();
  box.querySelector('#anSmooth').onchange = e => { ui.anSmooth = e.target.checked; anMount(x); };
  box.querySelectorAll('[data-antk]').forEach(c => c.onchange = () => { ui.anTakes = [...box.querySelectorAll('[data-antk]:checked')].map(z => z.dataset.antk).slice(-2); anMount(x); });
  box.querySelector('#anTap').onclick = () => anTapDialog(x, a);
}
function anTapDialog(x, a){
  const P = _anCtx.parsed;
  const m = openModal(`<h2 class="serif">Tap along</h2><div class="an-frow"><label class="an-f"><span>From bar</span><input class="inp" type="number" id="tpFrom" value="${P.measures[0] ? P.measures[0].num : 1}"></label><label class="an-f"><span>Name</span><input class="inp" id="tpName" value="Take ${(S.takes || []).filter(t => t.scoreId === x.id).length + 1}"></label></div>
    <div class="an-tapzone" id="tpZone" tabindex="0">Press <kbd>Space</kbd> on every beat. <kbd>Esc</kbd> to finish.</div><p class="faint" id="tpSay">0 taps</p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="tpNo">Cancel</button><button class="btn primary" id="tpOk">Keep the take</button></div>`, 'narrow');
  const taps = [], zone = m.querySelector('#tpZone'), say = m.querySelector('#tpSay'); setTimeout(() => zone.focus(), 50);
  const grid = () => anBeatGrid(P, +m.querySelector('#tpFrom').value || 1);
  const keep = () => { if(taps.length < 2){ toast('A take needs two taps or more.'); return; }
    const g = grid(); const today0 = today(); const sit = (x.practice || []).filter(p => p.date === today0).slice(-1)[0];
    S.takes.push({id: uid(), scoreId: x.id, analysisId: a ? a.id : null, createdAt: anNow(), label: m.querySelector('#tpName').value || 'Take', startMeasure: +m.querySelector('#tpFrom').value || 1,
      taps: taps.map((t, i) => ({measure: g[i] ? g[i].measure : null, beat: g[i] ? g[i].beat : null, time: t})), practiceId: sit ? sit.id : null});
    save(); m.remove(); scoreUi().anTakes = [S.takes[S.takes.length - 1].id]; anMount(x); };
  zone.onkeydown = e => { if(e.code === 'Space'){ e.preventDefault(); taps.push(performance.now()); const g = grid()[taps.length - 1]; say.textContent = `${taps.length} taps${g ? ` — bar ${g.measure}, beat ${g.beat}` : ' — past the end'}`; zone.classList.add('hit'); setTimeout(() => zone.classList.remove('hit'), 80); }
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); keep(); } };
  m.querySelector('#tpOk').onclick = keep; m.querySelector('#tpNo').onclick = () => m.remove();
}

/* ---------- notes ---------- */
function anNotesHTML(x, a){
  const p = anEnsure(), f = p.noteFilter, ui = scoreUi();
  const mine = anNotesFor(x.id), props = _anCtx.proposals || [];
  const rej = new Set((p.rejectedProposals || {})[x.id] || []), acc = new Set(mine.map(n => n.fromProposal).filter(Boolean));
  const open = props.filter(q => !rej.has(q.id) && !acc.has(q.id));
  return `<div class="an-row"><label class="an-chk"><input type="checkbox" id="anShowN"${p.showNotes ? ' checked' : ''}> show on the score</label>
      <select class="sel sm" id="anDens"><option value="normal"${p.density === 'normal' ? ' selected' : ''}>all</option><option value="sparse"${p.density === 'sparse' ? ' selected' : ''}>phrase and section only</option></select>
      <label class="an-f inline"><span>inline up to</span><input class="inp sm" type="number" min="1" max="200" id="anTh" value="${p.inlineWords}"><span>words</span></label></div>
    <div class="an-row"><select class="sel sm" id="anFH"><option value="">both hands</option>${['RH', 'LH'].map(h => `<option${f.hand === h ? ' selected' : ''}>${h}</option>`).join('')}</select>
      <select class="sel sm" id="anFC"><option value="">every category</option>${AN_NOTE_CATS.map(c => `<option${f.category === c ? ' selected' : ''}>${c}</option>`).join('')}</select>
      <select class="sel sm" id="anFL"><option value="0">any importance</option><option value="2"${f.level === 2 ? ' selected' : ''}>phrase and up</option><option value="3"${f.level === 3 ? ' selected' : ''}>section</option></select></div>
    <div class="an-row"><button class="btn sm${ui.anSelecting ? ' primary' : ''}" id="anSelBtn">${ui.anSelecting ? 'Selecting notes — click on the score' : 'Select notes on the score'}</button><button class="btn sm" id="anAddNote">＋ A note on them</button></div>
    <p class="faint" id="anSelSay"></p>
    ${open.length ? `<section class="an-sec"><h4>Proposed, by rule <span class="faint">${open.length}</span></h4>${open.map(q => `<div class="an-nrow prop" data-anprop="${q.id}"><span class="an-tag">${q.hand}</span><span class="an-tag">${q.category}</span><span>${esc(q.text)}</span><span class="grow"></span><button class="btn sm" data-npacc>accept</button><button class="btn sm ghost" data-nprej>reject</button></div>`).join('')}</section>` : ''}
    <section class="an-sec"><h4>On the score <span class="faint">${mine.length}</span></h4>${mine.map(n => `<div class="an-nrow"><button class="an-link" data-anbar="${n.anchor.measure}">bar ${n.anchor.measure}</button><span class="an-tag">${n.hand}</span><span class="an-tag">${n.category}</span><span class="an-ntext">${esc(n.text)}</span><button class="btn sm ghost" data-nedit="${n.id}">edit</button></div>`).join('') || '<p class="faint">None yet.</p>'}</section>`;
}
function anBindNotesTab(box, x){
  const p = anEnsure(), ui = scoreUi();
  box.querySelector('#anShowN').onchange = e => { p.showNotes = e.target.checked; save(); anAfterPaint(x); };
  box.querySelector('#anDens').onchange = e => { p.density = e.target.value; save(); anAfterPaint(x); };
  box.querySelector('#anTh').onchange = e => { p.inlineWords = Math.max(1, +e.target.value || 12); save(); anAfterPaint(x); };
  box.querySelector('#anFH').onchange = e => { p.noteFilter.hand = e.target.value; save(); anAfterPaint(x); };
  box.querySelector('#anFC').onchange = e => { p.noteFilter.category = e.target.value; save(); anAfterPaint(x); };
  box.querySelector('#anFL').onchange = e => { p.noteFilter.level = +e.target.value; save(); anAfterPaint(x); };
  box.querySelector('#anSelBtn').onclick = () => { ui.anSelecting = !ui.anSelecting; anMount(x); };
  box.querySelector('#anAddNote').onclick = () => anNoteDialog(x, null, () => anRepaint(x));
  box.querySelectorAll('[data-anprop]').forEach(row => { const q = _anCtx.proposals.find(z => z.id === row.dataset.anprop);
    row.querySelector('[data-npacc]').onclick = () => { S.performanceNotes.push(Object.assign({}, q, {id: uid(), scoreId: x.id, analysisId: (anCurrent(x.id) || {}).id, status: 'accepted', fromProposal: q.id, createdAt: anNow()})); save(); anRepaint(x); };
    row.querySelector('[data-nprej]').onclick = () => { p.rejectedProposals = p.rejectedProposals || {}; (p.rejectedProposals[x.id] = p.rejectedProposals[x.id] || []).push(q.id); save(); anRepaint(x); }; });
  box.querySelectorAll('[data-nedit]').forEach(b => b.onclick = () => anNoteDialog(x, S.performanceNotes.find(n => n.id === b.dataset.nedit), () => anRepaint(x)));
  anPaintSelection();
}

/* ---------- layers ---------- */
function anLayersHTML(x, a, P){
  const p = anEnsure(), nr = anNRDescribe(a, P, p.nrThreshold);
  return `<section class="an-sec"><h4>Schemata <span class="faint">proposals — the categories themselves are debated</span></h4><div class="row"><button class="btn sm ghost" id="anSchRe">Search again</button></div>
      ${(a.schemata || []).map(s => `<div class="an-nrow ${s.status}" data-ansch="${s.id}"><button class="an-link" data-anbar="${s.startMeasure}">bar ${s.startMeasure}</button><b>${esc(s.name)}</b><span class="faint">${esc(s.placement)} — ${esc(s.info)}</span><span class="grow"></span>
        <span class="an-st">${s.status}</span>${s.status === 'proposed' ? '<button class="btn sm" data-schacc>accept</button>' : ''}<button class="btn sm ghost" data-schrej>reject</button></div>`).join('') || '<p class="faint">None found.</p>'}</section>
    <section class="an-sec"><h4>Reduction</h4><label class="an-chk"><input type="checkbox" id="anNct"${p.nctDim ? ' checked' : ''}> dim the non-chord tones</label>
      <p class="faint">Your structural line: select notes on the score (Notes tab), then mark them. Drawn as noteheads joined by a beam. Nothing is drawn for you.</p>
      <div class="row"><button class="btn sm" id="anStructAdd">Mark the selected notes as structural</button><button class="btn sm ghost" id="anStructClear">Clear the line (${(a.structLine || []).length})</button></div></section>
    <section class="an-sec"><h4>Where the functional reading is weak</h4><label class="an-f"><span>below <b id="anNrV">${p.nrThreshold}</b> confidence</span><input type="range" min="0.1" max="0.9" step="0.05" id="anNr" value="${p.nrThreshold}"></label>
      ${nr.length ? `<p class="faint">Described instead as Neo-Riemannian transformations (P parallel, L leading-tone exchange, R relative, N, S) and the tones kept in common:</p>${nr.map(r => `<div class="an-nrow"><button class="an-link" data-anbar="${r.measure}">bar ${r.measure}</button><span>${esc(r.text)}</span></div>`).join('')}` : '<p class="faint">Nowhere below the threshold between two triads.</p>'}</section>`;
}
function anBindLayers(box, x, a){
  const p = anEnsure();
  box.querySelector('#anSchRe').onclick = () => anEdit(x, b => { const kept = (b.schemata || []).filter(s => s.status !== 'proposed'); b.schemata = kept.concat(anFindSchemata(b, _anCtx.parsed).filter(s => !kept.some(k => k.id === s.id))); });
  box.querySelectorAll('[data-ansch]').forEach(row => { const id = row.dataset.ansch;
    const acc = row.querySelector('[data-schacc]'); if(acc) acc.onclick = () => anEdit(x, b => { b.schemata.find(s => s.id === id).status = 'accepted'; });
    row.querySelector('[data-schrej]').onclick = () => anEdit(x, b => { b.schemata.find(s => s.id === id).status = 'rejected'; }); });
  box.querySelector('#anNct').onchange = e => { p.nctDim = e.target.checked; save(); anAfterPaint(x); };
  box.querySelector('#anNr').oninput = e => { p.nrThreshold = +e.target.value; box.querySelector('#anNrV').textContent = e.target.value; save(); };
  box.querySelector('#anNr').onchange = () => anMount(x);
  box.querySelector('#anStructAdd').onclick = () => { const sel = anSelection(); if(!sel.length){ toast('Select notes on the score first (Notes tab).'); return; }
    anEdit(x, b => { b.structLine = (b.structLine || []).concat(sel.map(q => ({id: uid(), measure: q.num, at: q.at, staff: q.staff, voice: q.voice, midi: q.midi}))); }); };
  box.querySelector('#anStructClear').onclick = () => anEdit(x, b => { b.structLine = []; });
}

/* ---------- compare, RomanText, the companion, the OMR review ---------- */
function anCompareHTML(x, a, P){
  const vs = anVersions(x.id), ui = scoreUi();
  const A = vs.find(v => v.id === ui.anDiffA) || vs[vs.length - 2], B = vs.find(v => v.id === ui.anDiffB) || vs[vs.length - 1];
  const diff = A && B && A !== B ? anDiff(A, B) : [];
  const omr = (S.omrReviews || []).find(o => o.scoreId === x.id);
  return `<section class="an-sec"><h4>RomanText</h4><div class="row"><button class="btn sm" id="anExp"${a ? '' : ' disabled'}>Export .rntxt</button>
      <label class="btn sm ghost" style="cursor:pointer">Import .rntxt…<input type="file" accept=".rntxt,.txt" id="anImp" hidden></label>
      <select class="sel sm" id="anImpOrigin"><option value="companion">from the companion script</option><option value="expert-import">from an expert corpus</option><option value="mine">my own</option></select></div>
      <p class="faint">An import becomes a new version of its own; nothing is overwritten.</p></section>
    <section class="an-sec"><h4>Compare two versions</h4>${vs.length > 1 ? `<div class="row"><select class="sel sm" id="anDA">${vs.map(v => `<option value="${v.id}"${A && v.id === A.id ? ' selected' : ''}>v${v.version} ${v.origin}</option>`).join('')}</select> against
      <select class="sel sm" id="anDB">${vs.map(v => `<option value="${v.id}"${B && v.id === B.id ? ' selected' : ''}>v${v.version} ${v.origin}</option>`).join('')}</select></div>
      ${diff.length ? `<p class="faint">${diff.length} place${diff.length === 1 ? '' : 's'} where they differ:</p><table class="an-tab"><tr><th>bar</th><th>beat</th><th>v${A.version}</th><th>v${B.version}</th><th></th></tr>${diff.slice(0, 300).map((d, i) => `<tr><td><button class="an-link" data-anbar="${d.measure}">${d.measure}</button></td><td>${d.beat}</td><td>${esc(d.a || '—')}</td><td>${esc(d.b || '—')}</td><td><button class="btn sm ghost" data-andiff="${i}">to the log</button></td></tr>`).join('')}</table>` : '<p class="faint">They agree everywhere.</p>'}` : '<p class="faint">One version so far. Import a companion or expert analysis, or save an interpretation and edit on, to compare.</p>'}</section>
    <section class="an-sec"><h4>The companion script</h4><p class="faint"><code>tools/analyze.py</code> runs AugmentedNet on a MusicXML file on your own machine and writes RomanText; import it here as “from the companion script”. It is optional and never part of the site. Setup in the README.</p></section>
    <section class="an-sec"><h4>OMR review</h4><label class="an-chk"><input type="checkbox" id="anOmr"${omr && omr.fromOmr ? ' checked' : ''}> this score came from OMR (Audiveris, homr…)</label>
      ${omr && omr.fromOmr ? `<p class="an-warn">OMR can fail badly on dense piano writing. Check every bar before the analysis unlocks.</p>
        <label class="btn sm ghost" style="cursor:pointer">Add the page image…<input type="file" accept="image/*" id="anOmrImg" hidden></label>
        <div class="an-omr">${omr.image ? `<img src="${omr.image}" alt="the page the score was read from">` : ''}<div class="an-omrbars">${P.measures.map(M => { const st = (omr.status || {})[M.num] || 'unchecked', bad = P.problems.some(q => P.measures[q.m] && P.measures[q.m].num === M.num);
          return `<div class="an-omrbar ${st}${bad ? ' bad' : ''}"><button class="an-link" data-anbar="${M.num}">${M.num}</button>${bad ? '<span class="an-tag">bar sum</span>' : ''}<select class="sel sm" data-omr="${M.num}">${['unchecked', 'ok', 'fixed'].map(s => `<option${s === st ? ' selected' : ''}>${s}</option>`).join('')}</select></div>`; }).join('')}</div></div>` : ''}</section>`;
}
function anDiff(A, B){
  const key = c => `${c.measure}|${(+c.beat).toFixed(2)}`;
  const la = new Map(), lb = new Map();
  (A.chordLabels || []).filter(c => c.status !== 'rejected').forEach(c => la.set(key(c), c.chosen || c.roman));
  (B.chordLabels || []).filter(c => c.status !== 'rejected').forEach(c => lb.set(key(c), c.chosen || c.roman));
  const keys = [...new Set([...la.keys(), ...lb.keys()])].sort((p, q) => { const [m1, b1] = p.split('|').map(Number), [m2, b2] = q.split('|').map(Number); return m1 - m2 || b1 - b2; });
  const norm = r => String(r || '').replace(/\s/g, '').replace(/o/g, '°');
  return keys.filter(k => norm(la.get(k)) !== norm(lb.get(k))).map(k => { const [m, b] = k.split('|'); return {measure: +m, beat: +b, a: la.get(k), b: lb.get(k)}; });
}
function anBindCompare(box, x, a){
  const ui = scoreUi(), P = _anCtx.parsed;
  const ex = box.querySelector('#anExp'); if(ex) ex.onclick = () => {
    const ts = {}; P.measures.forEach((M, i) => { if(i === 0 || M.beats !== P.measures[i - 1].beats || M.beatType !== P.measures[i - 1].beatType) ts[M.num] = `${M.beats}/${M.beatType}`; });
    const text = anToRntxt(a, {title: x.title, composer: x.composer, ts});
    const b = new Blob([text], {type: 'text/plain'}); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `${(x.title || 'analysis').replace(/[^\w-]+/g, '_')}.rntxt`; document.body.appendChild(l); l.click(); l.remove(); };
  box.querySelector('#anImp').onchange = async e => { const f = e.target.files[0]; if(!f) return;
    const r = anFromRntxt(await f.text()); if(!r.chordLabels.length){ toast('No Roman numerals found in that file.'); return; }
    const origin = box.querySelector('#anImpOrigin').value;
    const v = anNewVersion(x.id, origin, {keySpans: r.keySpans, chordLabels: r.chordLabels, importedFrom: f.name, meta: r.meta});
    v.frozen = true; v.frozenAt = anNow(); v.label = f.name; save();
    ui.anDiffB = v.id; ui.anDiffA = a ? a.id : null; if(a) anSetCurrent(x.id, a.id);
    toast(`Imported ${r.chordLabels.length} labels as version ${v.version} (${origin}).`); anMount(x); };
  const da = box.querySelector('#anDA'), db2 = box.querySelector('#anDB');
  if(da) da.onchange = () => { ui.anDiffA = da.value; anMount(x); }; if(db2) db2.onchange = () => { ui.anDiffB = db2.value; anMount(x); };
  const vs = anVersions(x.id), A = vs.find(v => v.id === ui.anDiffA) || vs[vs.length - 2], B = vs.find(v => v.id === ui.anDiffB) || vs[vs.length - 1];
  const diff = A && B && A !== B ? anDiff(A, B) : [];
  box.querySelectorAll('[data-andiff]').forEach(b => b.onclick = async () => { const d = diff[+b.dataset.andiff]; const why = await anWhy(`Bar ${d.measure}: ${d.a || '—'} or ${d.b || '—'}?`);
    anLog(x.id, {kind: 'comparison', measure: d.measure, beat: d.beat, readings: [d.a, d.b].filter(Boolean), sources: [`v${A.version} ${A.origin}`, `v${B.version} ${B.origin}`], chose: null, why}); b.textContent = 'logged'; b.disabled = true; });
  let omr = (S.omrReviews || []).find(o => o.scoreId === x.id);
  box.querySelector('#anOmr').onchange = e => { if(!omr){ omr = {id: uid(), scoreId: x.id, status: {}, fromOmr: false}; S.omrReviews.push(omr); } omr.fromOmr = e.target.checked; save(); anMount(x); };
  const img = box.querySelector('#anOmrImg'); if(img) img.onchange = e => { const f = e.target.files[0]; if(!f) return; const rd = new FileReader(); rd.onload = () => { omr.image = rd.result; save(); anMount(x); }; rd.readAsDataURL(f); };
  box.querySelectorAll('[data-omr]').forEach(s => s.onchange = () => { omr.status = omr.status || {}; omr.status[s.dataset.omr] = s.value; save(); if(!anOmrLocked(x)) toast('Every bar is checked: the analysis is unlocked.'); anMount(x); });
}
/* ---------- the log ---------- */
function anLogHTML(x){
  const rows = (S.ambiguities || []).filter(r => r.scoreId === x.id).slice().reverse();
  return `<p class="faint">Every time you override the machine or choose between readings. Nothing here is ever edited or removed.</p>
    ${rows.map(r => `<div class="an-logrow"><button class="an-link" data-anbar="${r.measure}">bar ${r.measure}</button><span class="an-tag">${esc(r.kind)}</span>
      <span>${(r.readings || []).map(esc).join(' / ')} → <b>${esc(r.chose == null ? 'undecided' : r.chose)}</b></span>${r.why ? `<p class="an-why">${esc(r.why)}</p>` : ''}<span class="faint">${esc(r.createdAt.slice(0, 16).replace('T', ' '))}</span></div>`).join('') || '<p class="faint">No decisions yet.</p>'}`;
}

/* ---------- the layer on the score ---------- */
function anAfterPaint(x){
  const stage = document.getElementById('scStage'); if(!stage) return;
  let layer = stage.querySelector('#anLayer'); if(!layer){ layer = document.createElement('div'); layer.id = 'anLayer'; layer.className = 'an-layer'; stage.appendChild(layer); }
  if(!anStudyOn()){ layer.innerHTML = ''; ['#anNotes', '#anRed', '#anSel'].forEach(s => { const e = stage.querySelector(s); if(e) e.innerHTML = ''; }); return; }
  const ctx = _anCtx && _anCtx.x === x ? _anCtx : anContext(x);
  const a = ctx.a, P = ctx.parsed; if(!a || !P || typeof measureBoxes !== 'function'){ layer.innerHTML = ''; return; }
  const p = anEnsure();
  const boxes = measureBoxes(); const on = typeof _sv !== 'undefined' && _sv && _sv.page ? _sv.at : null;
  const rows = new Map(); boxes.forEach(b => { if(on !== null && b.page !== on) return; const r = rows.get(b.measure); if(!r) rows.set(b.measure, Object.assign({}, b)); else { const y2 = Math.max(r.y + r.h, b.y + b.h); r.y = Math.min(r.y, b.y); r.h = y2 - r.y; } });
  const Mnum = new Map(P.measures.map(M => [M.num, M]));
  let html = '';
  if(p.showChords !== false) anChords(a).forEach(c => { const b = rows.get(c.measure), M = Mnum.get(c.measure); if(!b || !M) return;
    const xx = b.x + ((c.on - M.start) / M.len) * b.w + 2;
    html += `<button class="an-lbl ${c.function} ${c.status}" data-anlbl="${c.id}" style="left:${xx}px;top:${b.y + b.h + 20}px;opacity:${0.45 + 0.55 * Math.min(1, c.confidence)}" title="${esc(c.roman)} — ${AN_FN_NAME[c.function] || ''}, ${Math.round(c.confidence * 100)}% sure${c.alt ? ', or ' + esc(c.alt.roman) : ''}">${esc(c.roman)}</button>`; });
  (a.keySpans || []).forEach(s => { const b = rows.get(s.startMeasure); if(b) html += `<span class="an-keylbl" style="left:${b.x}px;top:${b.y + b.h + 36}px">${esc(anKeyName(s.key))}:</span>`; });
  (a.cadences || []).filter(c => c.status !== 'rejected').forEach(c => { const b = rows.get(c.measure), M = Mnum.get(c.measure); if(!b || !M) return;
    html += `<span class="an-cadflag ${c.type} ${c.status}" style="left:${b.x + ((c.on - M.start) / M.len) * b.w}px;top:${b.y - 30}px" title="${esc(AN_CAD_TYPES[c.type] || c.type)} cadence (${c.level}, ${c.status})">${esc(c.type)}</span>`; });
  (a.units || []).filter(u => u.status !== 'rejected' && u.kind !== 'period').forEach(u => { const b1 = rows.get(u.startMeasure), b2 = rows.get(u.endMeasure); if(!b1 || !b2) return;
    const sec = (a.sections || []).find(s => s.unitId === u.id);
    if(Math.abs(b1.y - b2.y) < 4) html += `<button class="an-ubr" data-anunitgo="${sec ? sec.id : ''}" style="left:${b1.x}px;top:${b1.y - 16}px;width:${b2.x + b2.w - b1.x}px">${esc(u.kind)}</button>`;
    else html += `<button class="an-ubr open" data-anunitgo="${sec ? sec.id : ''}" style="left:${b1.x}px;top:${b1.y - 16}px;width:${Math.max(40, (stage.clientWidth || 600) - b1.x - 30)}px">${esc(u.kind)} →</button>`;
    if(p.arches && Math.abs(b1.y - b2.y) < 4){ const w = b2.x + b2.w - b1.x; html += `<svg class="an-arch" style="left:${b1.x}px;top:${b1.y - 44}px" width="${w}" height="30" aria-hidden="true"><path d="M2,28 Q${w / 2},-8 ${w - 2},28"/><text x="${w / 2}" y="10" text-anchor="middle">reference shape</text></svg>`; }
  });
  layer.innerHTML = html;
  layer.querySelectorAll('[data-anlbl]').forEach(b => b.onclick = e => { e.stopPropagation(); const c = a.chordLabels.find(z => z.id === b.dataset.anlbl); scoreUi().anMeasure = c.measure; anOpenTab(x, 'chords'); });
  layer.querySelectorAll('[data-anunitgo]').forEach(b => b.onclick = e => { e.stopPropagation(); if(b.dataset.anunitgo) anOpenTab(x, 'writeups', b.dataset.anunitgo); });
  anPaintNotes(x, P, ctx.proposals);
  anPaintReduction(x, a, P);
  anPaintSelection();
}
/* mounting into the score view: the button, the panel, the clicks on the score */
function anMountViewer(root, x){
  const btn = root.querySelector('#scStudy'); if(!btn) return;
  btn.onclick = () => { const ui = scoreUi(); ui.study = !ui.study; save(); rerender(); };
  if(!anStudyOn()) return;
  anMount(x);
  const stage = root.querySelector('#scStage');
  if(stage) stage.addEventListener('click', e => {
    if(!anStudyOn()) return;
    if(e.target.closest('.an-note,.an-lbl,.an-ubr,.sc-pins button')) return;
    const ui = scoreUi();
    if(ui.anSelecting){ anSelectAt(e.clientX, e.clientY, e.shiftKey); return; }
    /* a click on a bar selects it and shows its chords */
    const r = stage.getBoundingClientRect(), px = e.clientX - r.left + stage.scrollLeft - 10, py = e.clientY - r.top + stage.scrollTop - 10;
    const b = (typeof measureBoxes === 'function' ? measureBoxes() : []).find(q => px >= q.x && px <= q.x + q.w && py >= q.y - 10 && py <= q.y + q.h + 10);
    if(b){ ui.anMeasure = b.measure; if(anTab() === 'chords') anMount(x); else anOpenTab(x, 'chords'); }
  });
}
