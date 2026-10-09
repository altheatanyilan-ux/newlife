/* ============================================================
   THE CONTEMPLATION ZONE AND THE OBSERVER VOICE

   A staging area in front of the canon. Anything that needs changing in the
   canonical artefacts — the sheet, a value, a strength, a vision, a belief —
   passes through the zone first; all backstory and rationale lives there, so
   the canon stays clean and the thinking has somewhere to be. The zone is
   written in the third person on purpose, to keep the observer's view, and it
   is processed on the weekly retreat.

   It is a flag and a list and a card — not a second journal. An entry in the
   zone is a normal entry in every respect (searchable, linkable, backed up)
   carrying one extra property: what it is about. Nothing here deletes
   anything; letting go clears the flag and the entry stays.

   The soft rule is stated and not enforced: the canon changes through the
   zone. An artefact edited directly records that, as information and not as a
   block.
   ============================================================ */

/* ---------- what an entry can be about ---------- */
function zoneAbouts(){
  const out = [];
  PURPOSE_KEYS.forEach(k => out.push({kind: 'purpose', id: 'sheet', artefact: k, label: 'the sheet — ' + PURPOSE_FIELDS[k].label.toLowerCase()}));
  (S.values || []).forEach(v => out.push({kind: 'value', id: v.id, artefact: '', label: 'value — ' + v.name}));
  (typeof strengthsAll === 'function' ? strengthsAll() : []).forEach(s => out.push({kind: 'strength', id: s.id, artefact: 'gloss', label: 'strength — ' + s.name}));
  (S.visions || []).filter(v => !v.archived).forEach(v => out.push({kind: 'vision', id: v.id, artefact: 'futureMemory', label: 'vision — ' + (v.name || 'untitled')}));
  (typeof beliefsAll === 'function' ? beliefsAll('belief') : []).forEach(b => out.push({kind: 'belief', id: b.id, artefact: 'text', label: 'belief — ' + b.text.slice(0, 40)}));
  (S.stages || []).filter(s => !s.notyet).forEach(s => out.push({kind: 'stage', id: s.id, artefact: 'narrative', label: 'stage story — ' + s.name}));
  return out;
}
const zoneAboutKey = a => a ? [a.kind, a.id, a.artefact || ''].join('|') : '';
function zoneAboutParse(key){ if(!key) return null; const [kind, id, artefact] = key.split('|'); const a = zoneAbouts().find(x => x.kind === kind && x.id === id && (x.artefact || '') === (artefact || '')) || zoneAbouts().find(x => x.kind === kind && x.id === id); return a || null; }
const zoneItems = () => (S.entries || []).filter(e => e.zone && !e.zone.processedAt).sort((a, b) => (a.createdAt || '') < (b.createdAt || '') ? -1 : 1);
const zoneWaiting = e => Math.max(0, daysBetween((e.createdAt || '').slice(0, 10) || today(), today()));

/* ---------- the prompt table: first- and third-person per field ----------
   Not pronoun substitution on arbitrary strings: the questions are changed,
   the user's text never is. "They" is the neutral default. */
const VOICE_PROMPTS = {
  'zone.body': ['What is on your mind about this?', 'What is on their mind about this?'],
  'zone.why': ['What do you actually want here?', 'What do they actually want here?'],
  'reflection.body': ['Thinking on paper. Nobody is reading this but you, later.', 'Thinking on paper, as an observer would see it. Nobody is reading this but you, later.'],
  'reflection.trigger': ['What prompted this', 'What prompted them'],
  'memory.body': ['What happened, and what it was like.', 'What happened, and what it was like for them.'],
  'lifeevent.body': ['What happened, and what changed.', 'What happened, and what changed for them.'],
  'contemplation.body': ['What came up.', 'What came up for them.'],
};
const voiceOn = kind => { const t = (S.settings && S.settings.thirdPerson) || {}; return kind === 'zone' ? t.zone !== false : !!t[kind]; };
function voiceSet(kind, on){ S.settings = S.settings || {}; S.settings.thirdPerson = Object.assign({}, S.settings.thirdPerson, {[kind]: !!on}); saveNow(); }
const voicePrompt = (key, third) => { const p = VOICE_PROMPTS[key]; return p ? p[third ? 1 : 0] : ''; };
const VOICE_HELP = 'Written in the third person, the questions keep you looking from outside. The third person is there to reinforce the observer’s perspective; your own words are never rewritten.';

/* The toggle on the ordinary entry form: it changes the placeholder and the
   questions for kinds with a prompt table, and nothing else. */
function entryVoiceBind(m, e){
  const body = m.querySelector('#eBody'); if(!body || !VOICE_PROMPTS[e.type + '.body']) return;
  const kind = e.type;
  const wrap = document.createElement('label'); wrap.className = 'row faint'; wrap.style.cssText = 'gap:6px;align-items:center;font-size:.8rem';
  wrap.innerHTML = `<input type="checkbox" id="eVoice"${voiceOn(kind) || e.thirdPerson ? ' checked' : ''}> <span title="${esc(VOICE_HELP)}">write in the third person</span>`;
  body.parentNode.insertBefore(wrap, body);
  const apply = on => { body.placeholder = voicePrompt(kind + '.body', on) || body.placeholder; e.thirdPerson = on;
    const tr = m.querySelector('[data-x="trigger"]'); const lab = tr && tr.closest('.field') && tr.closest('.field').querySelector('label'); if(lab && VOICE_PROMPTS[kind + '.trigger']) lab.textContent = voicePrompt(kind + '.trigger', on); };
  wrap.querySelector('input').onchange = ev => { voiceSet(kind, ev.target.checked); apply(ev.target.checked); };
  apply(wrap.querySelector('input').checked);
}

/* ---------- capture ---------- */
function zoneCapture({about = null, text = '', after = null} = {}){
  const abouts = zoneAbouts(), third = voiceOn('zone');
  const m = openModal(`<h2>Think about this</h2>
    <p class="faint">A place for the backstory and the reasons, in front of the canon. It will be processed on the weekly retreat; nothing here is ever deleted.</p>
    <div class="field"><label>About</label><select class="sel" id="zbAbout"><option value="">nothing in particular</option>
      ${abouts.map(a => `<option value="${esc(zoneAboutKey(a))}"${about && zoneAboutKey(about) === zoneAboutKey(a) ? ' selected' : ''}>${esc(a.label)}</option>`).join('')}</select></div>
    <label class="row faint" style="gap:6px;align-items:center;font-size:.8rem"><input type="checkbox" id="zbVoice"${third ? ' checked' : ''}> <span title="${esc(VOICE_HELP)}">write in the third person</span></label>
    <p class="mono faint" id="zbQ" style="margin:6px 0 2px"></p>
    <textarea class="ta" id="zbText" rows="6">${esc(text)}</textarea>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="zbGo">Keep it</button></div>`, 'narrow');
  const q = m.querySelector('#zbQ'), v = m.querySelector('#zbVoice');
  const paint = () => { q.textContent = voicePrompt('zone.why', v.checked); m.querySelector('#zbText').placeholder = voicePrompt('zone.body', v.checked); };
  v.onchange = () => { voiceSet('zone', v.checked); paint(); }; paint();
  if(typeof attachDictation === 'function') attachDictation(m.querySelector('#zbText'), {compact: true});
  setTimeout(() => m.querySelector('#zbText').focus(), 30);
  m.querySelector('#zbGo').onclick = () => {
    const body = m.querySelector('#zbText').value.trim(); if(!body){ toast('Write something first — even one line.'); return; }
    const a = zoneAboutParse(m.querySelector('#zbAbout').value);
    const e = lifeEntryNew({type: 'reflection', title: '', body, tags: ['zone'], extra: {}});
    zoneFlag(e, a); e.thirdPerson = v.checked;
    saveNow(); m.remove(); sound('click'); toast('In the zone.'); if(after) after(e); else rerender();
  };
}
function zoneFlag(e, about){
  e.zone = {about: about ? {kind: about.kind, id: about.id, artefact: about.artefact || '', label: about.label} : null, consideredAt: [], processedAt: null, producedVersion: null};
  return e;
}
/* any "think about this" button on a canonical artefact opens a capture already pointed at it */
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-zthink]'); if(!b) return;
  ev.preventDefault(); ev.stopPropagation();
  zoneCapture({about: zoneAboutParse(b.dataset.zthink)});
}, true);
const zoneThinkBtn = (kind, id, artefact) => `<button type="button" class="btn sm ghost zone-think" data-zthink="${esc([kind, id, artefact || ''].join('|'))}" title="a place in front of the canon, for the reasons">think about this</button>`;
document.addEventListener('keydown', ev => {
  if(!ev.altKey || ev.ctrlKey || ev.metaKey || ev.code !== 'KeyZ') return;
  const t = ev.target; if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if(typeof S === 'undefined' || !S) return;
  ev.preventDefault(); zoneCapture();
});

/* ---------- canon integrity: when was it last refined, and from how many zone items ---------- */
function canonRows(kind, id, artefact){
  if(kind === 'purpose') return purposeState()[artefact] || [];
  if(kind === 'strength'){ const s = byId(typeof strengthsAll === 'function' ? strengthsAll() : [], id); return s ? (s[artefact || 'gloss'] || []) : []; }
  if(kind === 'value'){ const v = byId(S.values, id); return v && v.fields ? [].concat(...Object.values(v.fields)) : []; }
  return [];
}
function canonLineHTML(kind, id, artefact){
  const rows = canonRows(kind, id, artefact).filter(r => r && r.text);
  if(!rows.length) return '';
  const last = rows[rows.length - 1], d = (last.at || last.date || '').slice(0, 10);
  const nZone = (S.entries || []).filter(e => e.zone && e.zone.processedAt && e.zone.producedVersion && e.zone.producedVersion.kind === kind && e.zone.producedVersion.id === id && (!artefact || e.zone.producedVersion.artefact === artefact)).length;
  const direct = rows.slice(1).filter(r => r.via === 'direct').length;
  return `<div class="mono faint canon-line">${d ? 'last refined ' + esc(fmtDate(d, 'short')) : ''}${nZone ? `, from ${nZone} zone item${nZone === 1 ? '' : 's'}` : ''}${direct && !nZone ? ' · edited directly' : direct ? ` · ${direct} edited directly` : ''}</div>`;
}

/* ---------- the zone view ---------- */
function zoneViewHTML(){
  const xs = zoneItems();
  const groups = {};
  xs.forEach(e => { const k = e.zone.about ? zoneAboutKey(e.zone.about) : ''; (groups[k] = groups[k] || []).push(e); });
  const keys = Object.keys(groups).sort((a, b) => !a ? 1 : !b ? -1 : a.localeCompare(b));
  const row = e => `<article class="dm-row"><div class="dm-main"><p class="serif dm-text">${esc(e.body.slice(0, 240))}${e.body.length > 240 ? '…' : ''}</p>
    <div class="mono faint">waiting ${zoneWaiting(e)} day${zoneWaiting(e) === 1 ? '' : 's'}${(e.zone.consideredAt || []).length ? `, considered ${e.zone.consideredAt.length} time${e.zone.consideredAt.length === 1 ? '' : 's'}` : ''}</div></div>
    <div class="dm-side"><button class="btn sm ghost" data-zopen="${e.id}">open</button></div></article>`;
  return `<div class="zone-view"><p class="faint dm-lede">The contemplation zone sits in front of the canon: anything that needs changing there passes through here first. It is written in the third person, on purpose. Nothing here is required to be processed — a zone with forty items is a sign of a productive mind — and nothing is ever deleted.</p>
    <div class="row" style="gap:8px"><button class="btn primary" id="zvNew">Think about something</button>${xs.length ? '<button class="btn" id="zvProcess">Process them, one at a time</button>' : ''}</div>
    ${xs.length ? keys.map(k => `<section class="section"><span class="sc">${k ? esc(groups[k][0].zone.about.label) : 'not about anything in particular'}</span><div class="dm-list">${groups[k].map(row).join('')}</div></section>`).join('') : '<div class="empty">The zone is empty.</div>'}</div>`;
}
function bindZoneView(host){
  const nw = host.querySelector('#zvNew'); if(nw) nw.onclick = () => zoneCapture();
  const pr = host.querySelector('#zvProcess'); if(pr) pr.onclick = () => zoneProcess();
  host.querySelectorAll('[data-zopen]').forEach(b => b.onclick = () => { const e = byId(S.entries, b.dataset.zopen); if(e) openPanel(entryCard(e, {clamp: false})); });
}

/* ---------- processing: one at a time, three dispositions ----------
   The Knowledge Tree's tending card has the same shape: make it a page, add it
   to a page, or let it go. */
function zoneProcess({onDone, stamp = true} = {}){
  const queue = zoneItems().map(e => e.id);
  if(!queue.length){ toast('The zone is empty.'); if(onDone) onDone(); return; }
  let i = 0;
  const m = openModal('<div id="zpBox"></div>', 'wide');
  const next = () => { i++; draw(); };
  const draw = () => {
    const box = m.querySelector('#zpBox');
    if(i >= queue.length){ box.innerHTML = '<h2>That is the zone, for now.</h2><p class="faint">Whatever you kept is still there.</p><div class="row" style="justify-content:flex-end"><button class="btn primary" id="zpEnd">Done</button></div>';
      box.querySelector('#zpEnd').onclick = () => { m.remove(); if(onDone) onDone(); else rerender(); }; return; }
    const e = byId(S.entries, queue[i]); if(!e || !e.zone || e.zone.processedAt){ next(); return; }
    box.innerHTML = `<div class="mono faint">${i + 1} of ${queue.length}${e.zone.about ? ' · about ' + esc(e.zone.about.label) : ''}</div>
      <p class="serif" style="font-size:1.2rem;white-space:pre-wrap">${esc(e.body)}</p>
      <div class="mono faint">waiting ${zoneWaiting(e)} days${(e.zone.consideredAt || []).length ? `, considered ${e.zone.consideredAt.length} time${e.zone.consideredAt.length === 1 ? '' : 's'}` : ''}</div>
      <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn primary" id="zpPromote"${e.zone.about ? '' : ' disabled title="point it at something first"'}>Promote</button>
        <button class="btn" id="zpKeep">Keep — not ready</button>
        <button class="btn ghost" id="zpLet">Let go</button>
        ${e.zone.about ? '' : '<select class="sel" id="zpPoint" style="max-width:16em"><option value="">point it at…</option>' + zoneAbouts().map(a => `<option value="${esc(zoneAboutKey(a))}">${esc(a.label)}</option>`).join('') + '</select>'}
        <button class="btn ghost" id="zpStop" style="margin-left:auto">stop here</button></div>
      <p class="faint" style="font-size:.78rem;margin-top:10px">Promote opens the artefact with this text beside it to copy from. Keep leaves it here and notes that it was considered today. Letting go clears the flag; the entry stays in your journal as an ordinary reflection — nothing is deleted.</p>`;
    const pt = box.querySelector('#zpPoint'); if(pt) pt.onchange = () => { const a = zoneAboutParse(pt.value); if(a){ e.zone.about = {kind: a.kind, id: a.id, artefact: a.artefact || '', label: a.label}; saveNow(); draw(); } };
    box.querySelector('#zpKeep').onclick = () => { if(stamp) e.zone.consideredAt.push(new Date().toISOString()); saveNow(); next(); };
    box.querySelector('#zpLet').onclick = () => { e.zoneWas = e.zone; e.zone = null; saveNow(); toast('Let go. The entry is still in your journal.'); next(); };
    box.querySelector('#zpStop').onclick = () => { m.remove(); if(onDone) onDone(); else rerender(); };
    const pm = box.querySelector('#zpPromote'); if(pm) pm.onclick = () => zonePromote(e, () => { draw(); });
  };
  draw();
}

/* ---------- promote: the artefact's editor, the zone text beside it ---------- */
function zonePromote(e, done){
  const a = e.zone.about; if(!a) return;
  const mark = (artefact, text) => {
    e.zone.processedAt = new Date().toISOString();
    e.zone.producedVersion = {kind: a.kind, id: a.id, artefact: artefact || a.artefact || '', versionAt: e.zone.processedAt, text: String(text || '').slice(0, 400)};
    saveNow(); sound('success'); toast('Promoted. The entry keeps a link to what it produced.'); if(done) done();
  };
  const note = {via: 'zone', zoneEntryIds: [e.id]};
  let title = '', cur = '', save = null, choices = null;
  if(a.kind === 'purpose'){
    title = PURPOSE_FIELDS[a.artefact].label; cur = purposeText(a.artefact);
    save = t => { purposeSave(a.artefact, t, {force: true, extra: note}); mark(a.artefact, t); };
  } else if(a.kind === 'strength'){
    const s = byId(strengthsAll(), a.id); if(!s) return;
    choices = [['gloss', 'what it means for me'], ['shadow', 'how it goes wrong']];
    title = s.name; let f = 'gloss'; cur = verText(s.gloss);
    save = (t, field) => { verSave(s[field || f], t, {force: true, extra: note}); mark(field || f, t); };
  } else if(a.kind === 'value'){
    const v = byId(S.values, a.id); if(!v) return;
    choices = [['embody', 'embodying it'], ['hundred', 'a hundred per cent'], ['motivation', 'what pulls'], ['counterfeit', 'the forgery']];
    title = v.name; const lat = f => ((v.fields && v.fields[f]) || []).slice(-1)[0]; cur = (lat('embody') || {}).text || '';
    save = (t, field) => { v.fields = v.fields || {}; v.fields[field || 'embody'] = v.fields[field || 'embody'] || []; v.fields[field || 'embody'].push({date: today(), text: t, via: 'zone', zoneEntryIds: [e.id]}); mark(field || 'embody', t); };
    choices.cur = f => (lat(f) || {}).text || '';
  } else if(a.kind === 'vision'){
    const v = byId(S.visions, a.id); if(!v) return;
    title = v.name || 'vision'; cur = v.futureMemory || '';
    save = t => { v.futureMemoryHistory = v.futureMemoryHistory || []; if(v.futureMemory && v.futureMemory.trim()) v.futureMemoryHistory.push({text: v.futureMemory, at: new Date().toISOString(), via: 'direct'});
      v.futureMemory = t; v.updatedAt = new Date().toISOString(); mark('futureMemory', t); };
  } else {
    /* a belief or a stage story: open the page with the text beside it; the item keeps a link */
    const go = a.kind === 'belief' ? '#/purpose/demons' : '#/timeline/' + a.id;
    const m2 = openModal(`<h2>Promote — ${esc(a.label)}</h2><p class="faint">This text is here to copy from. Open the page, change what needs changing, and come back to mark it done.</p>
      <textarea class="ta" rows="6" readonly>${esc(e.body)}</textarea><div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><a class="btn" href="${go}" id="zpOpen" target="_self">Open it</a><button class="btn primary" id="zpMark">Done — mark it promoted</button></div>`, 'narrow');
    m2.querySelector('#zpMark').onclick = () => { m2.remove(); mark(a.artefact, e.body); };
    return;
  }
  const m = openModal(`<h2>Promote — ${esc(title)}</h2>
    <div class="grid c2" style="gap:12px;align-items:start"><div><div class="mono faint">from the zone</div><p class="serif" style="white-space:pre-wrap">${esc(e.body)}</p></div>
    <div>${choices ? `<div class="row" style="gap:6px;flex-wrap:wrap">${choices.map(([k, n], i) => `<button class="chip${i === 0 ? ' on' : ''}" data-zpf="${k}">${esc(n)}</button>`).join('')}</div>` : ''}
      <div class="mono faint" style="margin-top:6px">the artefact now — the previous wording is kept as an earlier version</div>
      <textarea class="ta" id="zpEd" rows="9">${esc(cur)}</textarea></div></div>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" id="zpSave">Keep this wording</button></div>`, 'wide');
  let field = choices ? choices[0][0] : null;
  m.querySelectorAll('[data-zpf]').forEach(b => b.onclick = () => { field = b.dataset.zpf; m.querySelectorAll('[data-zpf]').forEach(x => x.classList.toggle('on', x === b));
    if(a.kind === 'strength') m.querySelector('#zpEd').value = verText(byId(strengthsAll(), a.id)[field]); else if(choices && choices.cur) m.querySelector('#zpEd').value = choices.cur(field); });
  m.querySelector('#zpSave').onclick = () => { const t = m.querySelector('#zpEd').value.trim(); if(!t){ toast('Write the wording first.'); return; } save(t, field); m.remove(); };
}

/* ---------- surfaces: the Today index, the route ---------- */
purposeTabAdd({id: 'zone', label: 'Zone', order: 35, render: body => { body.innerHTML = zoneViewHTML(); bindZoneView(body); }});
function zoneCountChip(){ const n = zoneItems().length; return n ? n : 0; }
