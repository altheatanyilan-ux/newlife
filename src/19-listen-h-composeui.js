/* ============================================================
   PLAY TO COMPOSE — the room (Jazz Studio › Play to compose).

   Press Record and play. A bar of clicks counts you in; with the click on
   (the default) it keeps time while you play, which makes the rhythm far
   surer; with Free tempo there is no click and the beat is found from what
   you played. From a MIDI keyboard the notes are exact already (and the
   pedal is heard). From the microphone the take is held in memory, and
   when you stop the Transcribe Engine writes it down, with a progress bar.

   Every recording is a take. Use one as the piece, or add the next four
   or eight bars as another take on the end of it. Keep a take's sound if
   you want it (it is stored on this device, in its own store, and a
   "Delete take" removes it); otherwise the sound is let go as soon as the
   notes are written.

   The piece is drawn by the house's engraver with its player, and the
   clean-up (19-listen-g-compose.js) can be run again with other settings —
   the grid, swing, where the hands split, a piano score or a lead sheet —
   which is how most things are fixed. For the rest, a light toolbar: click a
   note, then delete it, move it up or down, make it longer or shorter, or
   move it to the other staff. Every hand correction is counted, because how
   many notes needed correcting is how good the transcription was.

   It exports MusicXML 4.0, compressed .mxl and MIDI (as written, or as
   played). It saves to Repertoire as a score, and it can be kept as an
   exercise of your own that the Play it strip under it checks you on.
   ============================================================ */

function cpState(){
  const j = jazzState();
  const c = j.compose = j.compose && typeof j.compose === 'object' ? j.compose : {};
  c.settings = Object.assign({source: 'auto', bpm: 120, ts: '4/4', free: false, countIn: true, mode: 'piano', grid: 'auto', swing: 'auto', split: 'auto', chords: true, title: 'A new piece'}, c.settings || {});
  c.takes = Array.isArray(c.takes) ? c.takes : [];
  c.pieces = Array.isArray(c.pieces) ? c.pieces : [];
  return c;
}
const _cp = {rec: null, busy: null, sel: null, pieceId: null};
function cpPiece(){ const c = cpState(); return c.pieces.find(p => p.id === (_cp.pieceId || c.current)) || null; }
function cpTsOf(s){ const m = /^(\d+)\/(\d+)$/.exec(String(s || '4/4')); return m ? [+m[1], +m[2]] : [4, 4]; }

/* ---------- the model of a piece: its takes, cleaned, with the hand edits on top ---------- */
function cpEventsOf(piece){
  const c = cpState(); const ev = [], pedal = [];
  let at = 0, t0 = null, clicked = true;
  (piece.takeIds || []).forEach((tid, k) => {
    const tk = c.takes.find(t => t.id === tid); if(!tk) return;
    const beat = 60 / (tk.bpm || 120), ts = cpTsOf(tk.ts), bar = beat * ts[0];
    /* each take after the first starts on the next bar line after the one before it ends */
    const first = tk.t0 != null ? tk.t0 : Math.min(...tk.events.map(e => e.on));
    const shift = k === 0 ? 0 : at - first;
    if(k === 0) t0 = tk.t0;
    if(tk.free) clicked = false;
    tk.events.forEach(e => ev.push({pitch: e.p, onset: e.on + shift, offset: e.off != null ? e.off + shift : null, velocity: e.v, confidence: e.c == null ? 1 : e.c}));
    (tk.pedal || []).forEach(p => pedal.push({t: p.t + shift, down: p.down}));
    const end = Math.max(...tk.events.map(e => (e.off || e.on) + shift));
    const origin = k === 0 ? (tk.t0 != null ? tk.t0 : first) : at;
    at = origin + Math.ceil((end - origin) / bar - 0.15) * bar;
  });
  return {ev, pedal, t0, clicked};
}
function cpModel(piece){
  const c = cpState(), st = Object.assign({}, c.settings, piece.settings || {});
  const first = c.takes.find(t => t.id === (piece.takeIds || [])[0]);
  const {ev, pedal, t0, clicked} = cpEventsOf(piece);
  if(!ev.length) return null;
  const model = cpClean(ev, {bpm: first ? first.bpm : st.bpm, ts: cpTsOf(first ? first.ts : st.ts), click: clicked && first && !first.free, t0, free: !clicked,
    grid: st.grid, swing: st.swing, split: st.split, mode: st.mode, chords: st.mode === 'lead' ? true : !!st.chords, pedal, title: piece.title});
  (piece.edits || []).forEach(e => cpEdit(model, e.op, e.id, e.arg));
  return model;
}
function cpXmlOf(piece, model){ return cpToMusicXML(model || cpModel(piece), {title: piece.title}); }

/* ---------- the page ---------- */
function jazzComposeHTML(){
  const c = cpState(), s = c.settings, piece = cpPiece();
  const act = listenActive();
  const takes = c.takes.slice().reverse();
  return `<div class="cp-page">
    <div class="jz-crumbs"><a href="#/jazz">Jazz Studio</a> <span>›</span> <span>Play to compose</span></div>
    <h1 class="serif">Play to compose</h1>
    <p class="li-lede">Play, and it is written down: a piano score with both hands, or a lead sheet with the chords read off your left hand.
      A MIDI keyboard is exact; an acoustic piano through the microphone is transcribed on this device. No sound leaves it, and no sound is kept unless you keep it.</p>

    <section class="li-card cp-rec">
      <div class="li-row">
        <div class="li-seg" role="radiogroup" aria-label="Input">${[['auto', 'Auto'], ['mic', 'Microphone'], ['midi', 'MIDI keyboard']].map(([k, n]) =>
          `<button class="${s.source === k ? 'on' : ''}" data-cpsrc="${k}" role="radio" aria-checked="${s.source === k}">${n}</button>`).join('')}</div>
        <label>♩ = <input class="inp sm mono" id="cpBpm" type="number" min="40" max="240" value="${s.bpm}"${s.free ? ' disabled' : ''}></label>
        <label>time <select class="sel sm" id="cpTs">${['4/4', '3/4', '2/4', '6/8'].map(t => `<option${t === s.ts ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="cp-chk"><input type="checkbox" id="cpFree"${s.free ? ' checked' : ''}> free tempo (no click)</label>
        <label class="cp-chk"><input type="checkbox" id="cpCount"${s.countIn ? ' checked' : ''}> a bar of count-in</label>
      </div>
      <div class="li-row">
        <button class="btn primary cp-big" id="cpRec">${_cp.rec ? '■ Stop' : '● Record'}</button>
        <span class="cp-say" id="cpSay">${_cp.rec ? 'Recording…' : act ? `Ready — ${act === 'midi' ? 'the MIDI keyboard' : 'the microphone'} is on.` : 'Ready.'}</span>
        <span class="grow"></span>
        <label class="li-file">Import MIDI <input type="file" id="cpMidiIn" accept=".mid,.midi,audio/midi"></label>
      </div>
      <div class="cp-meter"${_cp.rec && _cp.rec.mic ? '' : ' hidden'}><i id="cpMeter"></i></div>
      <div class="cp-prog" id="cpProg"${_cp.busy ? '' : ' hidden'}><i style="width:${_cp.busy ? Math.round(_cp.busy.f * 100) : 0}%"></i><span>${_cp.busy ? esc(_cp.busy.text) : ''}</span></div>
      ${!s.free ? '<p class="faint cp-tip">With the microphone, wear headphones: the click should reach you, not the microphone.</p>' : ''}
    </section>

    ${takes.length ? `<section class="li-card"><h2 class="serif">Takes</h2>
      <div class="cp-takes">${takes.map(t => `<div class="cp-take${piece && (piece.takeIds || []).includes(t.id) ? ' in' : ''}">
        <b>${esc(t.name || 'Take')}</b>
        <span class="faint mono">${esc((t.at || '').slice(5, 16).replace('T', ' '))} · ${t.events.length} notes · ${t.seconds ? t.seconds.toFixed(0) + ' s' : ''} · ${t.source}${t.free ? ' · free' : ` · ♩=${t.bpm}`}</span>
        <span class="grow"></span>
        <button class="tbtn" data-cpuse="${t.id}">use as the piece</button>
        ${piece && !(piece.takeIds || []).includes(t.id) ? `<button class="tbtn" data-cpadd="${t.id}">add to the end</button>` : ''}
        ${t.source === 'mic' && !t.audioId && _cp.pcm && _cp.pcm.id === t.id ? `<button class="tbtn" data-cpkeep="${t.id}">keep the sound</button>` : ''}
        ${t.audioId ? `<button class="tbtn" data-cpplay="${t.id}">▶ the sound</button>` : ''}
        <button class="tbtn danger" data-cpdel="${t.id}">Delete take</button></div>`).join('')}</div></section>` : ''}

    ${piece ? cpPieceHTML(piece) : ''}

    ${c.pieces.length ? `<section class="li-card"><h2 class="serif">Your pieces</h2>
      <div class="cp-takes">${c.pieces.map(p => `<div class="cp-take${piece && p.id === piece.id ? ' in' : ''}"><b>${esc(p.title)}</b>
        <span class="faint mono">${esc((p.updatedAt || p.createdAt || '').slice(0, 10))} · ${(p.takeIds || []).length} take${(p.takeIds || []).length === 1 ? '' : 's'}${p.exercise ? ' · an exercise' : ''}${p.edits && p.edits.length ? ` · ${p.edits.length} hand corrections` : ''}</span>
        <span class="grow"></span><button class="tbtn" data-cpopen="${p.id}">open</button><button class="tbtn danger" data-cpdrop="${p.id}">remove</button></div>`).join('')}</div></section>` : ''}
  </div>`;
}
function cpPieceHTML(piece){
  const c = cpState(), st = Object.assign({}, c.settings, piece.settings || {});
  const model = cpModel(piece);
  if(model) cpPiece._model = model;
  const n = model ? model.notes.length : 0;
  return `<section class="li-card cp-piece">
    <div class="li-row"><input class="inp cp-title serif" id="cpTitle" value="${esc(piece.title)}" aria-label="Title">
      <span class="grow"></span>
      <span class="faint mono">${model ? `${model.key.name.replace('b', '♭').replace('#', '♯')} · ${model.ts.join('/')} · ♩=${model.bpm}${model.swing.on ? ` · swing ${model.swing.ratio}:1` : ''} · ${model.measures} bars` : ''}</span></div>
    <div class="li-row cp-opts">
      <span class="li-seg">${[['piano', 'Piano score'], ['lead', 'Lead sheet']].map(([k, nm]) => `<button data-cpmode="${k}" class="${st.mode === k ? 'on' : ''}">${nm}</button>`).join('')}</span>
      <label>grid <select class="sel sm" id="cpGrid">${[['auto', 'choose per beat'], ['8', 'eighths'], ['3', 'triplets'], ['16', 'sixteenths'], ['4', 'quarters']].map(([k, nm]) => `<option value="${k}"${st.grid === k ? ' selected' : ''}>${nm}</option>`).join('')}</select></label>
      <label>swing <select class="sel sm" id="cpSwing">${[['auto', 'if it swings'], ['on', 'swung'], ['off', 'straight']].map(([k, nm]) => `<option value="${k}"${st.swing === k ? ' selected' : ''}>${nm}</option>`).join('')}</select></label>
      <label>hands split <select class="sel sm" id="cpSplit"><option value="auto"${st.split === 'auto' ? ' selected' : ''}>by the hands</option>${[55, 57, 60, 62, 64].map(v => `<option value="${v}"${String(st.split) === String(v) ? ' selected' : ''}>at ${listenNoteName(v)}</option>`).join('')}</select></label>
      ${st.mode === 'piano' ? `<label class="cp-chk"><input type="checkbox" id="cpChords"${st.chords ? ' checked' : ''}> chord symbols</label>` : ''}
      <button class="btn sm" id="cpRerun">Re-run the clean-up</button>
    </div>
    <div class="jz-stage-box"><div class="jz-score cp-score" id="cpScore"></div></div>
    <div class="cp-tools" id="cpTools">
      <span class="faint" id="cpSel">${_cp.sel ? '' : 'Click a note to correct it.'}</span>
      <button class="tbtn" data-cped="delete" title="Delete">✕ delete</button>
      <button class="tbtn" data-cped="up" title="Up a semitone (↑)">↑</button><button class="tbtn" data-cped="down" title="Down a semitone (↓)">↓</button>
      <button class="tbtn" data-cped="shorter" title="Shorter">− shorter</button><button class="tbtn" data-cped="longer" title="Longer">+ longer</button>
      <button class="tbtn" data-cped="staff" title="To the other staff">⇅ other staff</button>
      <span class="grow"></span>
      <span class="faint mono">${(piece.edits || []).length} of ${n} notes corrected by hand</span>
      ${(piece.edits || []).length ? '<button class="tbtn" id="cpUndo">undo</button>' : ''}
    </div>
    <div class="li-row cp-out">
      <button class="btn sm" data-cpx="musicxml">⇩ MusicXML</button><button class="btn sm" data-cpx="mxl">⇩ .mxl</button>
      <button class="btn sm" data-cpx="mid">⇩ MIDI</button><button class="btn sm ghost" data-cpx="played">⇩ MIDI as played</button>
      <span class="grow"></span>
      <button class="btn sm" id="cpToRep">Save to Repertoire</button>
      <button class="btn sm ${piece.exercise ? 'ghost' : 'primary'}" id="cpEx">${piece.exercise ? '✓ one of your exercises' : 'Keep as an exercise'}</button>
    </div>
    ${piece.exercise && typeof lfPanelHTML === 'function' ? (cpRegisterExercise(piece), lfPanelHTML('cmp:' + piece.id)) : ''}
  </section>`;
}
function cpRegisterExercise(piece){
  _lfEx['cmp:' + piece.id] = {ex: {id: 'cmp:' + piece.id, name: piece.title, category: piece.settings && piece.settings.mode === 'lead' ? 'melody' : 'voicing', description: 'your own'},
    record: () => { piece.keys = piece.keys || {}; piece.heard = piece.heard || []; return piece; }};
}
function bindJazzCompose(root){
  const c = cpState(), s = c.settings;
  const save = () => saveNow();
  $$('[data-cpsrc]', root).forEach(b => b.onclick = () => { s.source = b.dataset.cpsrc; save(); rerender(); });
  const bpm = root.querySelector('#cpBpm'); if(bpm) bpm.onchange = () => { s.bpm = Math.max(40, Math.min(240, +bpm.value || 120)); save(); };
  root.querySelector('#cpTs').onchange = e => { s.ts = e.target.value; save(); };
  root.querySelector('#cpFree').onchange = e => { s.free = e.target.checked; save(); rerender(); };
  root.querySelector('#cpCount').onchange = e => { s.countIn = e.target.checked; save(); };
  root.querySelector('#cpRec').onclick = () => _cp.rec ? cpStop(root) : cpRecord(root);
  root.querySelector('#cpMidiIn').onchange = async e => { const f = e.target.files[0]; if(!f) return;
    try { const r = txReadMidi(await f.arrayBuffer()); if(!r.notes.length) throw new Error('There are no notes in that file.');
      cpAddTake({source: /transcri|helper/i.test(f.name) ? 'helper' : 'file', name: f.name.replace(/\.[^.]+$/, ''), events: r.notes, pedal: r.pedal, bpm: s.bpm, ts: s.ts, free: true, t0: null});
      toast(`${r.notes.length} notes read from ${f.name}.`); rerender(); }
    catch(err){ toast(err.message || 'That MIDI file could not be read.'); } };
  $$('[data-cpuse]', root).forEach(b => b.onclick = () => { cpUseTake(b.dataset.cpuse); rerender(); });
  $$('[data-cpadd]', root).forEach(b => b.onclick = () => { const p = cpPiece(); if(!p) return; p.takeIds.push(b.dataset.cpadd); p.edits = []; p.updatedAt = new Date().toISOString(); save(); rerender(); });
  $$('[data-cpkeep]', root).forEach(b => b.onclick = async () => { const t = c.takes.find(x => x.id === b.dataset.cpkeep); if(!t || !_cp.pcm || _cp.pcm.id !== t.id) return;
    t.audioId = await jazzPutAudio(txWav(_cp.pcm.pcm, _cp.pcm.sr)); save(); toast(t.audioId ? 'The sound of this take is kept on this device. "Delete take" removes it.' : 'The sound could not be kept.'); rerender(); });
  $$('[data-cpplay]', root).forEach(b => b.onclick = async () => { const t = c.takes.find(x => x.id === b.dataset.cpplay); const blob = t && await jazzGetAudio(t.audioId);
    if(!blob){ toast('That sound is no longer here.'); return; } const a = new Audio(URL.createObjectURL(blob)); a.play(); });
  $$('[data-cpdel]', root).forEach(b => b.onclick = async () => { const i = c.takes.findIndex(x => x.id === b.dataset.cpdel); if(i < 0) return;
    const t = c.takes[i]; if(t.audioId) await jazzDropAudio(t.audioId);
    c.takes.splice(i, 1); c.pieces.forEach(p => { p.takeIds = (p.takeIds || []).filter(id => id !== t.id); });
    if(_cp.pcm && _cp.pcm.id === t.id) _cp.pcm = null;
    save(); toast('The take is deleted' + (t.audioId ? ', and its sound with it.' : '.')); rerender(); });
  $$('[data-cpopen]', root).forEach(b => b.onclick = () => { c.current = b.dataset.cpopen; _cp.pieceId = null; _cp.sel = null; save(); rerender(); });
  $$('[data-cpdrop]', root).forEach(b => b.onclick = () => { const p = c.pieces.find(x => x.id === b.dataset.cpdrop); if(!p) return;
    if(!confirm(`Remove “${p.title}”? Its takes stay until you delete them.`)) return;
    c.pieces = c.pieces.filter(x => x !== p); if(c.current === p.id) c.current = null; save(); rerender(); });
  const piece = cpPiece(); if(piece) cpBindPiece(root, piece);
  addEventListener('hashchange', () => { if(_cp.rec) cpStop(root, true); }, {once: true});
}
function cpBindPiece(root, piece){
  const c = cpState(), save = () => { piece.updatedAt = new Date().toISOString(); saveNow(); };
  piece.settings = piece.settings || {};
  const model = cpPiece._model;
  root.querySelector('#cpTitle').onchange = e => { piece.title = e.target.value.trim() || 'Untitled'; save(); };
  const reclean = (k, v) => { if((piece.edits || []).length && !confirm(`Running the clean-up again discards your ${piece.edits.length} hand correction${piece.edits.length === 1 ? '' : 's'}. Go ahead?`)) { rerender(); return; }
    piece.settings[k] = v; piece.edits = []; save(); rerender(); };
  $$('[data-cpmode]', root).forEach(b => b.onclick = () => reclean('mode', b.dataset.cpmode));
  root.querySelector('#cpGrid').onchange = e => reclean('grid', e.target.value);
  root.querySelector('#cpSwing').onchange = e => reclean('swing', e.target.value);
  root.querySelector('#cpSplit').onchange = e => reclean('split', e.target.value === 'auto' ? 'auto' : +e.target.value);
  const ch = root.querySelector('#cpChords'); if(ch) ch.onchange = e => reclean('chords', e.target.checked);
  root.querySelector('#cpRerun').onclick = () => reclean('ranAt', Date.now());
  if(!model) return;
  const xml = cpXmlOf(piece, model);
  piece.xml = xml;
  const box = root.querySelector('#cpScore');
  Promise.resolve(jazzEngrave(box, xml)).then(osmd => { if(!osmd) return; cpBindNotes(root, piece, box, osmd, model);
    if(piece.exercise && typeof bindLfPanel === 'function'){ cpRegisterExercise(piece); bindLfPanel(root, 'cmp:' + piece.id); } });
  const edit = (op, arg) => { if(!_cp.sel){ toast('Click a note first.'); return; }
    const m2 = cpModel(piece);
    const real = op === 'up' || op === 'down' ? 'pitch' : op;
    const a = op === 'up' ? 1 : op === 'down' ? -1 : arg;
    if(!cpEdit(m2, real, _cp.sel, a)){ toast('That note is no longer there.'); return; }
    piece.edits = piece.edits || []; piece.edits.push({op: real, id: _cp.sel, arg: a, at: Date.now()});
    if(real === 'delete') _cp.sel = null;
    save(); rerender(); };
  $$('[data-cped]', root).forEach(b => b.onclick = () => edit(b.dataset.cped));
  const undo = root.querySelector('#cpUndo'); if(undo) undo.onclick = () => { piece.edits.pop(); save(); rerender(); };
  const kd = e => { if(!_cp.sel || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
    if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); edit('delete'); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); edit('up'); } else if(e.key === 'ArrowDown'){ e.preventDefault(); edit('down'); } };
  /* one listener, however many times the piece is redrawn */
  if(_cp.kd) removeEventListener('keydown', _cp.kd);
  _cp.kd = kd; addEventListener('keydown', kd);
  addEventListener('hashchange', () => { if(_cp.kd === kd){ removeEventListener('keydown', kd); _cp.kd = null; } }, {once: true});
  const blob = (bytes, type, name) => { const b = new Blob([bytes], {type}), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 1000); };
  const fname = (piece.title || 'piece').replace(/[^\w\- ]+/g, '').trim() || 'piece';
  $$('[data-cpx]', root).forEach(b => b.onclick = () => {
    const k = b.dataset.cpx;
    if(k === 'musicxml') blob(xml, 'application/vnd.recordare.musicxml+xml', fname + '.musicxml');
    else if(k === 'mxl') blob(cpToMxl(xml, fname), 'application/vnd.recordare.musicxml', fname + '.mxl');
    else if(k === 'mid') blob(cpToMidi(model), 'audio/midi', fname + '.mid');
    else { const {ev, pedal} = cpEventsOf(piece); blob(cpToMidi(model, true, ev, pedal), 'audio/midi', fname + ' (as played).mid'); }
  });
  root.querySelector('#cpToRep').onclick = async () => { const rec = await takeScoreFile(new File([xml], fname + '.musicxml', {type: 'application/xml'}));
    if(rec){ piece.repertoireId = rec.id; save(); } };
  root.querySelector('#cpEx').onclick = () => { piece.exercise = !piece.exercise; save(); toast(piece.exercise ? 'Kept as one of your exercises — the Play it strip under it checks you on it.' : 'No longer an exercise.'); rerender(); };
}
/* a click on the engraving picks the nearest written note */
function cpBindNotes(root, piece, box, osmd, model){
  const pos = lfPositions(osmd);
  const svg = box.querySelector('svg');
  const byPos = p => model.notes.find(n => n.pitch === p.midi && n.start === (p.num - 1) * model.barDiv + Math.round(p.at * CP_DIV) && (model.mode === 'lead' || n.staff === p.staff))
    || model.notes.find(n => n.pitch === p.midi && Math.abs(n.start - ((p.num - 1) * model.barDiv + Math.round(p.at * CP_DIV))) <= 3);
  const mark = () => { let l = box.querySelector('.cp-selmark'); if(!l){ l = document.createElement('i'); l.className = 'cp-selmark'; box.appendChild(l); }
    const n = model.notes.find(x => x.id === _cp.sel); const p = n && pos.find(q => byPos(q) === n);
    if(!p || !svg){ l.hidden = true; return; } const o = svg.getBoundingClientRect(), b = box.getBoundingClientRect();
    l.hidden = false; l.style.left = (o.left - b.left + p.x) + 'px'; l.style.top = (o.top - b.top + p.y) + 'px';
    const say = root.querySelector('#cpSel'); if(say) say.textContent = `${listenNoteName(n.pitch)} · bar ${Math.floor(n.start / model.barDiv) + 1} · ${n.staff === 1 ? 'treble' : 'bass'} staff`; };
  if(getComputedStyle(box).position === 'static') box.style.position = 'relative';
  box.onclick = e => { if(!svg) return; const o = svg.getBoundingClientRect(); const x = e.clientX - o.left, y = e.clientY - o.top;
    let best = null, bd = 18 * 18;
    pos.forEach(p => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if(d < bd){ bd = d; best = p; } });
    const n = best && byPos(best); _cp.sel = n ? n.id : null; mark(); };
  if(_cp.sel) mark();
}

/* ---------- recording ---------- */
async function cpRecord(root){
  const c = cpState(), s = c.settings;
  const say = t => { const el = root.querySelector('#cpSay'); if(el) el.textContent = t; };
  let src = s.source;
  if(src === 'auto'){ src = 'mic'; try { if(navigator.requestMIDIAccess){ const acc = await navigator.requestMIDIAccess(); if([...acc.inputs.values()].length) src = 'midi'; } } catch(e){} }
  const rec = _cp.rec = {src, events: [], pedal: [], unsubs: [], bpm: s.bpm, ts: s.ts, free: !!s.free, startedAt: listenNow()};
  const beat = 60 / s.bpm * (cpTsOf(s.ts)[1] === 8 && cpTsOf(s.ts)[0] % 3 === 0 ? 1.5 : 1), per = cpTsOf(s.ts)[1] === 8 && cpTsOf(s.ts)[0] % 3 === 0 ? cpTsOf(s.ts)[0] / 3 : cpTsOf(s.ts)[0];
  try {
    if(src === 'midi'){
      if(listenActive() !== 'midi') await listenStart({source: 'midi'});
      rec.unsubs.push(listenOn(ev => { if(ev.source === 'midi') rec.events.push(ev); }));
      rec.unsubs.push(listenOnPedal(p => rec.pedal.push(p)));
    } else {
      /* the live listener and the recorder would both want the microphone */
      if(listenActive() === 'mic') await listenStop();
      rec.mic = await txMicRecord();
      rec.startedAt = rec.mic.startedAt;
      rec.meter = setInterval(() => { const m = root.querySelector('#cpMeter'); if(m && rec.mic) m.style.width = Math.min(100, rec.mic.level() * 400) + '%'; }, 80);
    }
  } catch(e){ _cp.rec = null; toast(e.message || 'Could not start recording.'); return; }
  /* the click: a bar of count-in, then on through the take unless the tempo is free */
  if(!s.free || s.countIn){
    const AC = window.AudioContext || window.webkitAudioContext;
    try { rec.click = new AC(); } catch(e){}
    if(rec.click){
      const ctx = rec.click, t0c = ctx.currentTime + 0.15;
      const nowP = listenNow();
      rec.t0 = nowP + 0.15 + (s.countIn ? per * beat : 0) - rec.startedAt;   /* the first downbeat, seconds into the take */
      let k = 0;
      const sched = () => { if(!_cp.rec || _cp.rec !== rec) return;
        while(t0c + k * beat < ctx.currentTime + 0.3){
          if(s.free && k >= (s.countIn ? per : 0)) return;
          const t = t0c + k * beat, o = ctx.createOscillator(), g = ctx.createGain();
          o.frequency.value = k % per === 0 ? 1500 : 1000; g.gain.setValueAtTime(k < per && s.countIn ? 0.3 : 0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.06); k++; } };
      sched(); rec.clickTimer = setInterval(sched, 60);
    }
  }
  if(rec.t0 == null) rec.t0 = null;
  const btn = root.querySelector('#cpRec'); if(btn) btn.textContent = '■ Stop';
  const m = root.querySelector('.cp-meter'); if(m) m.hidden = !rec.mic;
  say(s.countIn ? 'One bar of clicks, then play…' : 'Recording — play.');
  if(s.countIn) setTimeout(() => { if(_cp.rec === rec) say('Recording — play.'); }, per * beat * 1000 + 150);
}
async function cpStop(root, quiet){
  const rec = _cp.rec; if(!rec) return;
  _cp.rec = null;
  rec.unsubs.forEach(f => { try { f(); } catch(e){} });
  clearInterval(rec.clickTimer); clearInterval(rec.meter);
  if(rec.click){ try { rec.click.close(); } catch(e){} }
  const c = cpState(), s = c.settings;
  if(rec.src === 'midi'){
    const t0 = rec.startedAt;
    const events = rec.events.map(e => ({pitch: e.pitch, onset: e.onset - t0, offset: e.offset != null ? e.offset - t0 : null, velocity: e.velocity, confidence: 1}));
    if(!events.length){ if(!quiet) toast('Nothing was played.'); rerender(); return; }
    cpAddTake({source: 'midi', events, pedal: rec.pedal.map(p => ({t: p.t - t0, down: p.down})), bpm: rec.bpm, ts: rec.ts, free: rec.free, t0: rec.free ? null : rec.t0, seconds: listenNow() - t0});
    if(!quiet){ toast(`${events.length} notes.`); rerender(); }
    return;
  }
  const got = await rec.mic.stop();
  if(quiet) return;
  if(got.pcm.length < got.sr * 0.5){ toast('That was too short to hear anything.'); rerender(); return; }
  _cp.busy = {f: 0, text: 'Hearing the notes…'}; rerender();
  const paint = () => { const p = document.querySelector('#cpProg'); if(p && _cp.busy){ p.hidden = false; p.querySelector('i').style.width = Math.round(_cp.busy.f * 100) + '%'; p.querySelector('span').textContent = _cp.busy.text; } };
  try {
    const r = await txTranscribe(got.pcm, got.sr, {}, (f, text) => { _cp.busy = {f, text: text || 'Working…'}; paint(); });
    const take = cpAddTake({source: 'mic', events: r.notes, pedal: [], bpm: rec.bpm, ts: rec.ts, free: rec.free, t0: rec.free ? null : rec.t0, seconds: got.pcm.length / got.sr, cents: r.cents, ms: r.ms});
    _cp.pcm = {id: take.id, pcm: got.pcm, sr: got.sr};
    toast(`${r.notes.length} notes, written down in ${(r.ms / 1000).toFixed(1)} s.`);
  } catch(e){ toast('The take could not be transcribed: ' + (e.message || e)); }
  _cp.busy = null;
  rerender();
}
function cpAddTake(t){
  const c = cpState();
  const take = {id: uid(), at: new Date().toISOString(), name: t.name || `Take ${c.takes.length + 1}`, source: t.source, bpm: t.bpm, ts: t.ts, free: !!t.free, t0: t.t0 == null ? null : +(+t.t0).toFixed(4),
    seconds: t.seconds || null, cents: t.cents != null ? t.cents : null, ms: t.ms || null, audioId: null,
    events: t.events.map(e => ({p: e.pitch, on: +(+e.onset).toFixed(4), off: e.offset != null ? +(+e.offset).toFixed(4) : null, v: +(e.velocity != null ? e.velocity : 0.7).toFixed(2), c: e.confidence != null ? +(+e.confidence).toFixed(2) : 1})),
    pedal: (t.pedal || []).map(p => ({t: +(+p.t).toFixed(4), down: !!p.down}))};
  c.takes.push(take);
  if(c.takes.length > 60){ const old = c.takes.shift(); if(old.audioId) jazzDropAudio(old.audioId); }
  /* the first take of nothing becomes a piece at once */
  if(!cpPiece()) cpUseTake(take.id);
  saveNow();
  return take;
}
function cpUseTake(id){
  const c = cpState();
  const p = {id: uid(), title: c.settings.title && c.pieces.every(x => x.title !== c.settings.title) ? c.settings.title : `A piece, ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(), takeIds: [id], settings: {}, edits: []};
  c.pieces.unshift(p); c.current = p.id; _cp.pieceId = null; _cp.sel = null;
  saveNow();
  return p;
}
