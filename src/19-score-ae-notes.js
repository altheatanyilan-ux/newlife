/* ============================================================
   SCORE STUDY — pinpoint performance annotations.

   An annotation is anchored to notes, never to pixels: {partId, staff,
   voice, measure, at (the onset in the bar, in quarters), noteIds,
   pitches}. At every paint the anchor is matched against the engraver's own
   notes — same bar, staff, voice, onset and pitch — so it lands on the same
   notes after a zoom, a resize or a new layout. The hand comes from the
   staff (upper RH, lower LH) unless you set it; a part and voice stand in
   for it on other instruments.

   The text has no length cap and is never cut. What changes with length is
   only how it shows: up to the threshold (12 words by default, a setting)
   it sits inline by the notes as a short cue; longer, it is a small pin (a
   bracket when it covers several notes) that opens the full text, its
   reason and a link to the section's write-up — on hover with a mouse, on
   a tap on a touch screen.
   ============================================================ */

const AN_NOTE_CATS = ['voicing', 'timing', 'dynamics', 'articulation', 'pedal', 'colour', 'fingering', 'breath/bowing'];
function anWords(t){ return String(t || '').trim().split(/\s+/).filter(Boolean).length; }
function anNotesFor(scoreId){ return (S.performanceNotes || []).filter(n => n.scoreId === scoreId); }
/* every engraved note, with where it is drawn (in the overlay's coordinates) */
function anNotePositions(){
  if(typeof _sv === 'undefined' || !_sv || !_sv.osmd) return [];
  const osmd = _sv.osmd, out = [];
  const unit = (osmd.zoom || 1) * 10;
  let pages = []; try { pages = osmd.GraphicSheet.MusicPages || []; } catch(e){}
  let instruments = []; try { instruments = osmd.Sheet.Instruments || []; } catch(e){}
  const on = _sv.page ? _sv.at : null;
  try {
    (osmd.GraphicSheet.MeasureList || []).forEach(list => (list || []).forEach(gm => {
      if(!gm || !gm.ParentStaff || !gm.PositionAndShape) return;
      try { if(typeof gm.isVisible === 'function' && !gm.isVisible()) return; } catch(e){}
      const sys = gm.ParentStaffLine && gm.ParentStaffLine.ParentMusicSystem;
      const page = sys && sys.Parent ? Math.max(0, pages.indexOf(sys.Parent)) : 0;
      if(on !== null && page !== on) return;
      const inst = gm.ParentStaff.ParentInstrument, part = instruments.indexOf(inst), staff = inst ? inst.Staves.indexOf(gm.ParentStaff) + 1 : 1;
      const num = gm.MeasureNumber != null ? gm.MeasureNumber : (gm.parentSourceMeasure && gm.parentSourceMeasure.MeasureNumber);
      const src = gm.parentSourceMeasure, barAt = (src && src.AbsoluteTimestamp && src.AbsoluteTimestamp.RealValue) || 0;
      (gm.staffEntries || []).forEach(se => {
        const ts = se.relInMeasureTimestamp || (se.sourceStaffEntry && se.sourceStaffEntry.Timestamp);
        let where = ts && ts.RealValue != null ? ts.RealValue : 0; if(barAt > 0 && where >= barAt) where -= barAt;
        (se.graphicalVoiceEntries || []).forEach(gve => {
          const voice = gve.parentVoiceEntry && gve.parentVoiceEntry.ParentVoice ? String(gve.parentVoiceEntry.ParentVoice.VoiceId) : '1';
          (gve.notes || []).forEach(gn => {
            const sn = gn.sourceNote; if(!sn || !sn.Pitch || !gn.PositionAndShape) return;
            const abs = gn.PositionAndShape.AbsolutePosition; if(!abs) return;
            out.push({num, part, staff, voice, at: +(where * 4).toFixed(4), midi: (sn.halfTone != null ? sn.halfTone : sn.Pitch.getHalfTone()) + 12, x: abs.x * unit, y: abs.y * unit, page});
          });
        });
      });
    }));
  } catch(e){ return out; }
  return out;
}
/* an anchor, to the drawn notes it names */
function anResolveAnchor(anchor, positions, parsed){
  const pi = parsed ? parsed.parts.findIndex(p => p.id === anchor.partId) : 0;
  const want = new Set((anchor.pitches || []).map(Number));
  return positions.filter(p => p.num === anchor.measure && p.staff === anchor.staff && (pi < 0 || p.part === pi) && Math.abs(p.at - anchor.at) < 1e-3 && (!want.size || want.has(p.midi)));
}
function anHandOf(staff){ return staff >= 2 ? 'LH' : 'RH'; }
function anNoteVisible(n, prefs){
  const f = prefs.noteFilter || {};
  if(f.hand && n.hand !== f.hand && n.hand !== 'both') return false;
  if(f.category && n.category !== f.category) return false;
  if(f.level && (n.level || 1) < f.level) return false;
  if(prefs.density === 'sparse' && (n.level || 1) < 2) return false;
  return true;
}
/* the layer on the stage */
function anPaintNotes(x, parsed, proposals){
  const stage = document.getElementById('scStage'); if(!stage) return;
  let layer = stage.querySelector('#anNotes');
  if(!layer){ layer = document.createElement('div'); layer.id = 'anNotes'; layer.className = 'an-notes'; stage.appendChild(layer); }
  const prefs = anEnsure();
  if(!prefs.showNotes || !anStudyOn()){ layer.innerHTML = ''; return; }
  const pos = anNotePositions();
  const mine = anNotesFor(x.id).filter(n => anNoteVisible(n, prefs));
  const rejected = new Set((prefs.rejectedProposals || {})[x.id] || []);
  const accepted = new Set(mine.map(n => n.fromProposal).filter(Boolean));
  const props = (proposals || []).filter(p => !rejected.has(p.id) && !accepted.has(p.id) && anNoteVisible(p, prefs));
  const th = prefs.inlineWords || 12;
  const html = [...mine, ...props].map(n => {
    const at = anResolveAnchor(n.anchor, pos, parsed); if(!at.length) return '';
    const x0 = Math.min(...at.map(p => p.x)), x1 = Math.max(...at.map(p => p.x)), y0 = Math.min(...at.map(p => p.y));
    const lh = n.hand === 'LH';
    const top = lh ? Math.max(...at.map(p => p.y)) + 26 : y0 - 22;
    const cls = `an-note ${n.status} ${n.category ? 'c-' + n.category.replace(/\W/g, '') : ''}${lh ? ' lh' : ''}`;
    const bracket = at.length > 1 && x1 - x0 > 4 ? `<i class="an-bracket" style="left:${x0 - 4}px;top:${top + (lh ? -6 : 14)}px;width:${x1 - x0 + 14}px"></i>` : '';
    const data = `data-annote="${esc(n.id)}"`;
    if(anWords(n.text) <= th) return `${bracket}<button class="${cls} inline" ${data} style="left:${x0 - 2}px;top:${top}px">${esc(n.text)}${n.reason ? '<sup>+</sup>' : ''}</button>`;
    return `${bracket}<button class="${cls} pin" ${data} style="left:${x0 + 2}px;top:${top}px" aria-label="${esc(n.text)}"><span>${n.hand === 'both' ? '•' : n.hand}</span></button>`;
  }).join('');
  layer.innerHTML = html;
  const all = new Map([...mine, ...props].map(n => [n.id, n]));
  layer.querySelectorAll('[data-annote]').forEach(b => {
    const n = all.get(b.dataset.annote);
    b.addEventListener('mouseenter', () => { if(matchMedia('(hover: hover)').matches) anPopover(b, n, x); });
    b.addEventListener('mouseleave', () => { if(matchMedia('(hover: hover)').matches) setTimeout(() => { const p = document.querySelector('.an-pop'); if(p && !p.matches(':hover')) p.remove(); }, 250); });
    b.addEventListener('click', e => { e.stopPropagation(); anPopover(b, n, x, true); });
  });
}
function anPopover(anchorEl, n, x, sticky){
  document.querySelectorAll('.an-pop').forEach(p => p.remove());
  const p = document.createElement('div'); p.className = 'an-pop'; p.setAttribute('role', 'dialog');
  const sec = n.linkedSectionId ? n.linkedSectionId : null;
  p.innerHTML = `<div class="an-pophead"><span class="an-tag">${esc(n.hand || '')}</span><span class="an-tag">${esc(n.category || '')}</span><span class="an-tag">${'●'.repeat(n.level || 1)}</span>
      <span class="grow"></span><span class="faint">${n.status === 'proposed' ? 'proposed, by rule' : n.status === 'accepted' ? 'accepted' : 'yours'}</span></div>
    <p class="an-poptext">${esc(n.text)}</p>${n.reason ? `<p class="an-popwhy">${esc(n.reason)}</p>` : ''}
    <div class="row an-popbtns">${n.status === 'proposed' ? `<button class="btn sm primary" data-ap="accept">Accept</button><button class="btn sm ghost" data-ap="edit">Edit…</button><button class="btn sm ghost" data-ap="reject">Reject</button>`
      : `<button class="btn sm ghost" data-ap="edit">Edit…</button><button class="btn sm ghost" data-ap="move">Move to the selected notes</button><button class="btn sm ghost" data-ap="delete">Delete</button>`}
      <button class="btn sm ghost" data-ap="writeup">The write-up</button></div>`;
  document.body.appendChild(p);
  const r = anchorEl.getBoundingClientRect();
  p.style.left = Math.max(8, Math.min(innerWidth - p.offsetWidth - 8, r.left)) + 'px';
  p.style.top = (r.bottom + 6 + p.offsetHeight > innerHeight ? r.top - p.offsetHeight - 6 : r.bottom + 6) + 'px';
  p.addEventListener('mouseleave', () => { if(!sticky) p.remove(); });
  const again = () => { p.remove(); anRepaint(x); };
  p.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => {
    const k = b.dataset.ap;
    if(k === 'accept'){ S.performanceNotes.push(Object.assign({}, n, {id: uid(), scoreId: x.id, analysisId: (anCurrent(x.id) || {}).id, status: 'accepted', fromProposal: n.id, createdAt: anNow()})); save(); return again(); }
    if(k === 'reject'){ const pr = anEnsure(); pr.rejectedProposals = pr.rejectedProposals || {}; (pr.rejectedProposals[x.id] = pr.rejectedProposals[x.id] || []).push(n.id); save(); return again(); }
    if(k === 'edit') return anNoteDialog(x, n.status === 'proposed' ? Object.assign({}, n, {fromProposal: n.id, id: null, status: 'mine'}) : n, again);
    if(k === 'delete'){ S.performanceNotes = S.performanceNotes.filter(m => m.id !== n.id); save(); return again(); }
    if(k === 'move'){ const sel = anSelection(); if(!sel.length){ toast('Select notes on the score first (Study → Notes → select).'); return; }
      const m = S.performanceNotes.find(z => z.id === n.id); m.anchor = anAnchorFromSelection(sel); m.hand = m.handSet ? m.hand : anHandOf(m.anchor.staff); save(); return again(); }
    if(k === 'writeup'){ p.remove(); anOpenTab(x, 'writeups', n.linkedSectionId); }
  });
  if(sticky) setTimeout(() => document.addEventListener('click', function off(e){ if(!p.contains(e.target)){ p.remove(); document.removeEventListener('click', off); } }), 0);
}
/* ---------- selecting notes on the score ---------- */
let _anSel = [];
function anSelection(){ return _anSel.slice(); }
function anSelectAt(clientX, clientY, add){
  const stage = document.getElementById('scStage'); if(!stage) return;
  const r = stage.getBoundingClientRect();
  const x = clientX - r.left + stage.scrollLeft - 10, y = clientY - r.top + stage.scrollTop - 10;
  const pos = anNotePositions(); let best = null, bd = 16;
  pos.forEach(p => { const d = Math.hypot(p.x + 4 - x, p.y - y); if(d < bd){ bd = d; best = p; } });
  if(!add) _anSel = [];
  if(best){ const i = _anSel.findIndex(s => s.num === best.num && s.staff === best.staff && s.at === best.at && s.midi === best.midi); if(i > -1) _anSel.splice(i, 1); else _anSel.push(best); }
  anPaintSelection();
}
function anPaintSelection(){
  const stage = document.getElementById('scStage'); if(!stage) return;
  let layer = stage.querySelector('#anSel'); if(!layer){ layer = document.createElement('div'); layer.id = 'anSel'; layer.className = 'an-sel'; stage.appendChild(layer); }
  layer.innerHTML = _anSel.map(p => `<i style="left:${p.x - 3}px;top:${p.y - 7}px"></i>`).join('');
  const say = document.getElementById('anSelSay'); if(say) say.textContent = _anSel.length ? `${_anSel.length} note${_anSel.length === 1 ? '' : 's'} selected` : 'click notes on the score to select them (shift-click for more)';
}
function anAnchorFromSelection(sel){
  const s = sel.slice().sort((a, b) => a.num - b.num || a.at - b.at || a.midi - b.midi);
  const parsed = _anCtx && _anCtx.parsed;
  const pid = parsed && parsed.parts[s[0].part] ? parsed.parts[s[0].part].id : 'P1';
  const ids = parsed ? s.map(p => { const n = parsed.notes.find(q => q.num === p.num && q.staff === p.staff && Math.abs(q.at - p.at) < 1e-3 && q.midi === p.midi); return n ? n.id : null; }).filter(Boolean) : [];
  return {partId: pid, staff: s[0].staff, voice: s[0].voice, measure: s[0].num, at: s[0].at, noteIds: ids, pitches: [...new Set(s.filter(p => p.num === s[0].num && p.at === s[0].at && p.staff === s[0].staff).map(p => p.midi))]};
}
function anNoteDialog(x, n, after){
  const isNew = !n || !n.id;
  const d = Object.assign({text: '', reason: '', category: 'voicing', level: 1, hand: null}, n || {});
  const sel = anSelection();
  if(isNew && !d.anchor && !sel.length){ toast('Select one or more notes on the score first.'); return; }
  const anchor = d.anchor || anAnchorFromSelection(sel);
  const m = openModal(`<h2 class="serif">${isNew ? 'A note on the score' : 'Edit the note'}</h2>
    <p class="faint">Bar ${anchor.measure}, ${anHandOf(anchor.staff)}${anchor.noteIds && anchor.noteIds.length > 1 ? `, ${anchor.noteIds.length} notes` : ''}. No length limit — say as much as it needs; long notes show as a pin.</p>
    <label class="an-f"><span>What to do</span><textarea class="inp" id="anT" rows="4">${esc(d.text)}</textarea></label>
    <label class="an-f"><span>Why <small>optional</small></span><textarea class="inp" id="anR" rows="3">${esc(d.reason || '')}</textarea></label>
    <div class="an-frow"><label class="an-f"><span>Category</span><select class="sel" id="anC">${AN_NOTE_CATS.map(c => `<option${c === d.category ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="an-f"><span>Hand</span><select class="sel" id="anH"><option value="">from the staff (${anHandOf(anchor.staff)})</option>${['RH', 'LH', 'both'].map(h => `<option${d.handSet && d.hand === h ? ' selected' : ''}>${h}</option>`).join('')}</select></label>
      <label class="an-f"><span>Importance</span><select class="sel" id="anL">${[1, 2, 3].map(l => `<option value="${l}"${+d.level === l ? ' selected' : ''}>${['detail', 'phrase', 'section'][l - 1]}</option>`).join('')}</select></label></div>
    <p class="faint" id="anWords"></p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="anNo">Cancel</button><button class="btn primary" id="anOk">Keep it</button></div>`, 'narrow');
  const $m = s => m.querySelector(s);
  const words = () => { const w = anWords($m('#anT').value); $m('#anWords').textContent = `${w} word${w === 1 ? '' : 's'} — shows ${w <= (anEnsure().inlineWords || 12) ? 'inline' : 'as a pin'} (threshold ${anEnsure().inlineWords || 12}, in the Study settings).`; };
  $m('#anT').oninput = words; words();
  $m('#anNo').onclick = () => m.remove();
  $m('#anOk').onclick = () => {
    const text = $m('#anT').value; if(!text.trim()){ toast('Write the note first.'); return; }
    const hSet = $m('#anH').value;
    const row = {text, reason: $m('#anR').value, category: $m('#anC').value, level: +$m('#anL').value, hand: hSet || anHandOf(anchor.staff), handSet: !!hSet, anchor};
    if(isNew) S.performanceNotes.push(Object.assign({id: uid(), scoreId: x.id, analysisId: (anCurrent(x.id) || {}).id || null, status: 'mine', origin: d.fromProposal ? 'rule, edited' : 'mine', fromProposal: d.fromProposal || null,
      linkedEventId: d.linkedEventId || null, linkedSectionId: d.linkedSectionId || null, createdAt: anNow()}, row));
    else Object.assign(S.performanceNotes.find(z => z.id === d.id), row, {updatedAt: anNow()});
    save(); m.remove(); _anSel = []; anPaintSelection(); after && after();
  };
}
