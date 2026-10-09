/* ============================================================
   VISION, RESTORED (#/purpose/vision)

   Visions were read in three places — the Theatre's rotation queue, the
   structural-tension and scene pickers, the values solar system's blind-spot
   orbit — after the page that made them was retired. No new one could be
   written. One missing object, showing up as three defects.

   This is the page that writes them again: a list, and an editor. The record
   keeps the shape the consumers already read (name, futureMemory, sensory,
   currentReality, confidence, links), so the rotation score, the structural
   tension formula and the solar system all work, unchanged, the moment there
   is something for them to read. Nothing in them is retuned here.
   ============================================================ */

purposeTabAdd({id: 'vision', label: 'Vision', order: 40, render: (body, rest) => visionRender(body, rest)});

const VISION_HORIZONS = [['1y', 'one year'], ['10y', 'ten years'], ['20y', 'twenty years']];
function visionNew(name){
  const v = {id: uid(), name: String(name || '').trim() || 'A vision', era: '', parentId: null, status: 'pending', phase: 'in-progress', progress: 0,
    startedAt: today(), completedAt: '', successCriteria: '', reflection: '', archived: false, confidence: 'hunch', nextAction: '',
    sensory: {see: '', hear: '', smell: '', firstHour: '', who: '', noLonger: '', notes: ''},
    futureMemory: '', futureMemoryHistory: [], costs: '', currentReality: '', currentRealityHistory: [], resistance: [],
    preSkills: [], peopleNeeded: [], selfImage: '', values: [], obituary: '', evidence: [], feeling: 0, targetDate: '', location: '', money: '',
    createdAt: today(), horizon: '10y', purposeRef: [], links: {values: [], skills: [], bets: [], boardCardIds: []},
    lastMorningTheatreDate: '', morningTheatreCount: 0, guidedHour: null, updatedAt: new Date().toISOString()};
  S.visions.push(v); saveNow();
  return v;
}
const visionHorizonName = v => (VISION_HORIZONS.find(h => h[0] === v.horizon) || [, /^\d{4}-/.test(v.horizon || '') ? 'by ' + fmtDate(v.horizon, 'med') : 'ten years'])[1];
function visionOpen(){ return (S.visions || []).filter(v => !v.archived && v.status !== 'completed'); }
function visionCardHTML(v){
  const tension = typeof structuralTension === 'function' ? structuralTension(v) : 0;
  const seen = (v.lastMorningTheatreDate || '').slice(0, 10);
  return `<a class="vs-card" href="#/purpose/vision/${esc(v.id)}">
    <h3 class="serif">${esc(v.name)}</h3>
    <div class="mono faint">${esc(visionHorizonName(v))} · ${esc(v.confidence || 'hunch')} · ${seen ? 'in the Theatre ' + esc(fmtDate(seen, 'med')) : 'not yet in the Theatre'}</div>
    ${v.futureMemory ? `<p class="vs-fm">${esc(v.futureMemory.slice(0, 180))}${v.futureMemory.length > 180 ? '…' : ''}</p>` : '<p class="faint">The future memory is not written yet.</p>'}
    <div class="mono faint">${tension ? `structural tension ${tension} — the gap between where you are and what you want` : 'no tension yet — it needs both the present and the future written'}${purposeScreened(v) ? '' : ' · not yet put to the sheet'}</div>
  </a>`;
}
function visionRender(body, rest){
  const id = rest && rest[0];
  const v = id ? byId(S.visions, id) : null;
  if(v) return visionEditorRender(body, v);
  const open = visionOpen(), shut = (S.visions || []).filter(x => x.archived || x.status === 'completed');
  body.innerHTML = `<div class="vs-wrap">
    <p class="faint vs-lede">A vision is a long-term picture of how the purpose unfolds — where you are now, and where your life is ten years from now. Very detailed, emotionally compelling, a bit idealistic and grand. This is not the place to ask how.</p>
    <div class="row" style="gap:8px"><button class="btn primary" id="vsNew">A new vision</button><button class="btn" id="vsHourNew">The guided hour</button>${open.length ? '<button class="btn ghost" id="vsLookAll">Look at them</button>' : ''}</div>
    ${open.length ? `<div class="vs-grid">${open.map(visionCardHTML).join('')}</div>`
      : '<div class="empty">No visions yet. Without one the Morning Theatre has only its practices to rotate through, and structural tension has no result to hold against the present.</div>'}
    ${shut.length ? `<details class="pp-vers"><summary class="mono">${shut.length} set down</summary><div class="vs-grid">${shut.map(visionCardHTML).join('')}</div></details>` : ''}
  </div>`;
  body.querySelector('#vsHourNew').onclick = () => visionHour();
  if(body.querySelector('#vsLookAll')) body.querySelector('#vsLookAll').onclick = () => visionLook();
  body.querySelector('#vsNew').onclick = () => {
    const m = openModal(`<h2>A new vision</h2><div class="field"><label>What do you want to create or become?</label>
      <input class="inp serif-lg" id="vsN" autofocus placeholder="Name it so the future you recognises it"></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="vsGo">Begin</button></div>`, 'narrow');
    const go = () => { const n = m.querySelector('#vsN').value.trim(); if(!n) return; const nv = visionNew(n); m.remove(); navigate('#/purpose/vision/' + nv.id); };
    m.querySelector('#vsGo').onclick = go; m.querySelector('#vsN').onkeydown = e => { if(e.key === 'Enter') go(); };
  };
}
function visionEditorRender(body, v){
  v.links = v.links || {}; ['values', 'skills', 'bets', 'boardCardIds'].forEach(k => { if(!Array.isArray(v.links[k])) v.links[k] = []; });
  if(!Array.isArray(v.purposeRef)) v.purposeRef = [];
  v.sensory = v.sensory && typeof v.sensory === 'object' ? v.sensory : {};
  const tension = typeof structuralTension === 'function' ? structuralTension(v) : 0;
  const values = (S.valueOrder || []).map(id => byId(S.values, id)).filter(Boolean);
  const hz = v.horizon && !VISION_HORIZONS.some(h => h[0] === v.horizon) ? 'custom' : (v.horizon || '10y');
  body.innerHTML = `<div class="vs-ed">
    <div class="row" style="gap:8px"><a class="btn ghost" href="#/purpose/vision">← the visions</a>
      <span class="grow"></span>
      <button class="btn sm" id="vsHour">Guided hour</button><button class="btn sm ghost" id="vsLook">Look at it</button>
      ${v.status === 'completed' ? '<button class="btn sm ghost" id="vsReopen">reopen</button>' : '<button class="btn sm ghost" id="vsDone">it is lived — complete</button>'}
      ${v.archived ? '<button class="btn sm ghost" id="vsUnarch">bring back</button>' : '<button class="btn sm ghost" id="vsArch">set down</button>'}</div>
    <div class="field"><label class="sc">Name</label><input class="inp serif-lg" id="vsName" value="${esc(v.name)}"></div>
    <div class="field"><label class="sc">The future memory</label>
      <p class="faint pp-help">First person, present tense: you are living it. What do you see, who is there, what has changed for them and for you?</p>
      <textarea class="ta" id="vsFm" rows="8">${esc(v.futureMemory)}</textarea>
      ${typeof zoneThinkBtn === 'function' ? zoneThinkBtn('vision', v.id, 'futureMemory') : ''}
      ${(v.futureMemoryHistory || []).length ? `<details class="pp-vers"><summary class="mono">${v.futureMemoryHistory.length} earlier wording${v.futureMemoryHistory.length === 1 ? '' : 's'}</summary>${v.futureMemoryHistory.slice().reverse().map(h => `<div class="pp-v"><span class="mono faint">${esc(fmtDate(h.date, 'med'))}</span> ${esc(h.text)}</div>`).join('')}</details>` : ''}</div>
    <div class="field"><label class="sc">Sensory notes</label>
      <p class="faint pp-help">The nervous system is literal. The first hour of that day: light, sound, sensation.</p>
      <textarea class="ta" id="vsSens" rows="3">${esc(v.sensory.notes || v.sensory.firstHour || '')}</textarea></div>
    <div class="field"><label class="sc">Where you actually are</label>
      <p class="faint pp-help">Honestly, and without softening it. The tension between an accurate present and a clear future is the engine; softening either end dissolves it.</p>
      <textarea class="ta" id="vsCr" rows="5">${esc(v.currentReality)}</textarea>
      ${(v.currentRealityHistory || []).length ? `<details class="pp-vers"><summary class="mono">${v.currentRealityHistory.length} earlier</summary>${v.currentRealityHistory.slice().reverse().map(h => `<div class="pp-v"><span class="mono faint">${esc(fmtDate(h.date, 'med'))}</span> ${esc(h.text)}</div>`).join('')}</details>` : ''}</div>
    <div class="mono faint">${tension ? `structural tension ${tension}` : 'structural tension is 0 until both the present and the future are written'}</div>
    ${typeof fearCompass === 'function' ? fearCompass().filter(f => f.pointsTo && f.pointsTo.visionId === v.id).map(f => `<p class="faint vs-fear">A fear points this way: \u201C${esc(f.text)}\u201D \u2014 <a href="#/purpose/demons">the fear inventory</a></p>`).join('') : ''}
    <div class="grid c2" style="gap:12px">
      <div class="field"><label class="sc">Horizon</label>
        <select class="sel" id="vsHz">${VISION_HORIZONS.map(([k, n]) => `<option value="${k}" ${hz === k ? 'selected' : ''}>${n}</option>`).join('')}<option value="custom" ${hz === 'custom' ? 'selected' : ''}>a date…</option></select>
        <input class="inp" type="date" id="vsDate" ${hz === 'custom' ? '' : 'hidden'} value="${/^\d{4}-/.test(v.horizon || '') ? esc(v.horizon) : ''}" style="margin-top:6px"></div>
      <div class="field"><label class="sc">How real does it feel</label><div class="ladder">${CONF.map(c => `<button data-vsconf="${c}" class="${v.confidence === c ? 'on' : ''}">${c}</button>`).join('')}</div></div>
    </div>
    <div class="field"><label class="sc">What it serves</label>
      <div class="pp-chips" style="gap:6px">${PURPOSE_KEYS.filter(purposeHas).map(k => `<button class="chip ${v.purposeRef.includes(k) ? 'on' : ''}" data-vsref="${k}">${esc(PURPOSE_FIELDS[k].short)}</button>`).join('')}${purposeHas('values') ? `<button class="chip ${v.purposeRef.includes('values') ? 'on' : ''}" data-vsref="values">values</button>` : ''}
        ${purposeAny() ? '' : '<span class="faint">Nothing is written on the <a href="#/purpose">sheet</a> yet — it will appear here.</span>'}</div>
      ${purposeScreened(v) ? '' : '<div class="mono faint">Saved without it, the vision is listed under “not yet put to the sheet” — flagged, never blocked.</div>'}</div>
    ${values.length ? `<div class="field"><label class="sc">Values it lives by</label><div class="deps">${values.map(x => `<button class="chip ${v.links.values.some(l => l.id === x.id) ? 'on' : ''}" style="--c:${esc(x.color)}" data-vsval="${x.id}">${esc(x.name)}</button>`).join('')}</div></div>` : ''}
    ${(S.skills || []).length ? `<div class="field"><label class="sc">Skills it needs</label><div class="deps">${S.skills.slice(0, 60).map(x => `<button class="chip ${v.links.skills.includes(x.id) ? 'on' : ''}" data-vsskill="${x.id}">${esc(x.name)}</button>`).join('')}</div></div>` : ''}
    <div class="field"><div class="row between" style="align-items:center"><label class="sc" style="margin:0">Pictures of it</label>${typeof imageAddHTML === 'function' ? imageAddHTML('vision', v.id) : ''}</div>
      ${typeof imageStripHTML === 'function' ? imageStripHTML('vision', v.id) : ''}</div>
    <div class="row" style="gap:8px"><button class="btn primary" id="vsSave">Save</button></div>
  </div>`;
  const q = s => body.querySelector(s);
  if(typeof bindRecImages === 'function') bindRecImages(body);
  q('#vsHour').onclick = () => visionHour(v.id);
  q('#vsLook').onclick = () => visionLook(v.id);
  const hist = (cur, next, key) => { if(cur && next && cur !== next && verIsNewWording(cur, next)) (v[key] = v[key] || []).push({date: today(), text: cur}); };
  q('#vsSave').onclick = () => {
    v.name = q('#vsName').value.trim() || v.name;
    const fm = q('#vsFm').value.trim(), cr = q('#vsCr').value.trim();
    hist(v.futureMemory, fm, 'futureMemoryHistory'); hist(v.currentReality, cr, 'currentRealityHistory');
    v.futureMemory = fm; v.currentReality = cr; v.sensory.notes = q('#vsSens').value.trim();
    const hzv = q('#vsHz').value; v.horizon = hzv === 'custom' ? (q('#vsDate').value || '10y') : hzv;
    if(hzv === 'custom' && q('#vsDate').value) v.targetDate = q('#vsDate').value;
    v.updatedAt = new Date().toISOString(); saveNow(); sound('success'); toast('Saved.'); rerender();
  };
  q('#vsHz').onchange = () => { q('#vsDate').hidden = q('#vsHz').value !== 'custom'; };
  body.querySelectorAll('[data-vsconf]').forEach(b => b.onclick = () => { v.confidence = b.dataset.vsconf; saveNow(); body.querySelectorAll('[data-vsconf]').forEach(x => x.classList.toggle('on', x === b)); });
  body.querySelectorAll('[data-vsref]').forEach(b => b.onclick = () => { purposeToggleRef(v, b.dataset.vsref); b.classList.toggle('on'); });
  body.querySelectorAll('[data-vsval]').forEach(b => b.onclick = () => { const i = v.links.values.findIndex(l => l.id === b.dataset.vsval);
    if(i >= 0) v.links.values.splice(i, 1); else v.links.values.push({id: b.dataset.vsval}); saveNow(); b.classList.toggle('on'); });
  body.querySelectorAll('[data-vsskill]').forEach(b => b.onclick = () => { const a = v.links.skills, i = a.indexOf(b.dataset.vsskill);
    if(i >= 0) a.splice(i, 1); else a.push(b.dataset.vsskill); saveNow(); b.classList.toggle('on'); });
  const set = (fn) => () => { fn(); saveNow(); rerender(); };
  if(q('#vsDone')) q('#vsDone').onclick = set(() => { v.status = 'completed'; v.completedAt = today(); v.progress = 100; });
  if(q('#vsReopen')) q('#vsReopen').onclick = set(() => { v.status = 'pending'; v.completedAt = ''; });
  if(q('#vsArch')) q('#vsArch').onclick = set(() => { v.archived = true; });
  if(q('#vsUnarch')) q('#vsUnarch').onclick = set(() => { v.archived = false; });
}
