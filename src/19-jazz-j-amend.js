/* ============================================================
   INLINE MUSICXML AMENDMENT SYSTEM

   The generators are first drafts. They were built from interval
   formulas rather than note-for-note transcription, and some of them
   are wrong. This room makes it possible to correct an exercise in the
   browser and have that correction follow it into all twelve keys.

   HOW IT WORKS. The generators work by defining notes as intervals from
   C and then adding transpositionFromC(key) to shift everything. An
   amendment uses the same trick in reverse: when you correct a note in
   (say) Bb, the system subtracts transpositionFromC('Bb') to get the
   interval from C, and stores that. When you switch to any other key,
   it adds that key's offset and engraves the same correction there.

   One amendment — all twelve keys.
   ============================================================ */

/* ---------- storage ---------- */
function jazzAmendState(){
  const j = jazzState();
  j.amendments = j.amendments && typeof j.amendments === 'object' ? j.amendments : {};
  return j.amendments;
}
function jazzAmend(id){ return jazzAmendState()[id] || null; }
function jazzSetAmend(id, data){
  const all = jazzAmendState();
  const now = new Date().toISOString();
  const ex = all[id];
  all[id] = Object.assign({}, data, {id, v: ex ? (ex.v||0)+1 : 1,
    at: ex ? ex.at : now, ua: now});
  saveNow();
}
function jazzClearAmend(id){ delete jazzAmendState()[id]; saveNow(); }
function jazzAmendCount(){ return Object.keys(jazzAmendState()).length; }
function jazzExportAmends(){ return JSON.stringify(jazzAmendState(), null, 2); }
function jazzImportAmends(json){
  try {
    const data = JSON.parse(json);
    if(!data || typeof data !== 'object') return {error: 'Invalid format.'};
    const all = jazzAmendState();
    let n = 0;
    for(const [id, val] of Object.entries(data)){
      if(!val || !Array.isArray(val.measures)) continue;
      all[id] = val; n++;
    }
    saveNow();
    return {imported: n};
  } catch(e){ return {error: e.message}; }
}

/* ---------- note name helpers ---------- */
const JAE_NAMES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const JAE_NAMES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function jazzNoteNameFromMidi(midi, key){
  const G = JazzExerciseGenerator;
  const useSharp = G.SHARP_KEYS.has(key);
  const names = useSharp ? JAE_NAMES_SHARP : JAE_NAMES_FLAT;
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return names[pc] + octave;
}

function jazzNoteNameToMidi(s){
  const m = /^([A-G][b#]?)(-?\d+)$/.exec((s||'').trim());
  if(!m) return null;
  const pc = JazzExerciseGenerator.KEY_TO_PC[m[1]];
  if(pc === undefined) return null;
  return (parseInt(m[2], 10) + 1) * 12 + pc;
}

function jazzTransposeChord(sym, semitones){
  if(!sym) return sym;
  semitones = ((semitones % 12) + 12) % 12;
  if(!semitones) return sym;
  const G = JazzExerciseGenerator;
  const m = /^([A-G][b#]?)(.*)/.exec(sym);
  if(!m) return sym;
  const rootPc = G.KEY_TO_PC[m[1]];
  if(rootPc === undefined) return sym;
  const newPc = ((rootPc + semitones) % 12 + 12) % 12;
  return G.pcToKeyName(newPc) + m[2];
}

/* ---------- MusicXML parsing ---------- */
function _jaeParseNotes(measureEl, tFromC){
  return [...measureEl.querySelectorAll('note')].map(n => {
    const rest = !!n.querySelector('rest');
    const chord = !!n.querySelector('chord');
    const dur = +((n.querySelector('duration')||{}).textContent || 4);
    const type = ((n.querySelector('type')||{}).textContent || 'quarter').trim();
    if(rest) return {m:0, d:dur, t:type, r:true, c:false};
    const midi = jazzPitchMidi(n.querySelector('pitch'));
    return {m: midi != null ? midi - tFromC : 60, d:dur, t:type, r:false, c:chord};
  });
}

function _jaeParseChordSym(measureEl, tFromC){
  const dir = measureEl.querySelector('direction');
  const words = dir && dir.querySelector('words');
  if(!words || !words.textContent.trim()) return null;
  const sym = words.textContent.trim();
  if(!tFromC) return sym;
  return jazzTransposeChord(sym, (12 - (tFromC % 12)) % 12);
}

/* Turn a MusicXML string (any key) into the amendment data model.
   The resulting measures store midiIntervalFromC — key-independent. */
function jazzMxlToAmend(xml, key, title){
  const G = JazzExerciseGenerator;
  try {
    const t = G.transpositionFromC(key);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if(doc.querySelector('parsererror')) return null;
    const isGrand = xml.includes('jz-grand-staff');
    const isBass  = xml.includes('jz-single-staff: bass-only');
    const staff   = isGrand ? 'grand' : (isBass ? 'bass' : 'treble');
    const parts   = [...doc.querySelectorAll('part')];
    const rhBars  = parts[0] ? [...parts[0].querySelectorAll('measure')] : [];
    const lhBars  = isGrand && parts[1] ? [...parts[1].querySelectorAll('measure')] : [];
    const measures = rhBars.map((rm, i) => ({
      n: i+1,
      chord: _jaeParseChordSym(rm, t),
      treble: _jaeParseNotes(rm, t),
      bass: isGrand && lhBars[i] ? _jaeParseNotes(lhBars[i], t) : null
    }));
    return {staff, title: title||'Amended Exercise', key, measures,
      note:null, src:null, conf:'approximate'};
  } catch(e){ console.warn('jazzMxlToAmend failed', e); return null; }
}

/* ---------- amendment → MusicXML ---------- */
const JAE_DUR_TYPE = {1:'sixteenth', 2:'eighth', 4:'quarter', 8:'half', 16:'whole'};

function _jaeNotesXml(notes, measureNum, clefSign, clefLine, chord, key){
  const G = JazzExerciseGenerator;
  const t = G.transpositionFromC(key);
  let xml = `    <measure number="${measureNum}">\n`;
  if(measureNum === 1){
    xml += '      <attributes>\n';
    xml += '        <divisions>4</divisions>\n';
    xml += '        <time>\n          <beats>4</beats>\n          <beat-type>4</beat-type>\n        </time>\n';
    xml += `        <clef>\n          <sign>${clefSign}</sign>\n          <line>${clefLine}</line>\n        </clef>\n`;
    xml += '      </attributes>\n';
  }
  if(chord){
    xml += `      <direction placement="above">\n        <direction-type>\n          <words default-y="40" font-size="12" font-weight="bold">${G._xmlEsc(chord)}</words>\n        </direction-type>\n      </direction>\n`;
  }
  if(!notes || !notes.length){
    xml += G.generateRest(16, 'whole');
  } else {
    for(const n of notes){
      const type = n.t || JAE_DUR_TYPE[n.d] || 'quarter';
      if(n.r){
        xml += G.generateRest(n.d||4, type);
      } else if(n.c){
        const midi = n.m + t;
        xml += '      <note>\n        <chord/>\n';
        xml += G.midiToXmlPitch(midi, key) + '\n';
        xml += `        <duration>${n.d||4}</duration>\n        <type>${type}</type>\n      </note>\n`;
      } else {
        xml += G.generateSingleNote(n.m + t, n.d||4, type, key);
      }
    }
  }
  xml += `    </measure>\n`;
  return xml;
}

function jazzAmendToXml(amendment, key){
  const G = JazzExerciseGenerator;
  const t = G.transpositionFromC(key);
  const isGrand = amendment.staff === 'grand';
  const isBass  = amendment.staff === 'bass';
  let rhXml = '', lhXml = '';
  amendment.measures.forEach((m, i) => {
    const mn = i+1;
    const chord = m.chord ? jazzTransposeChord(m.chord, t) : '';
    if(isBass){
      lhXml += _jaeNotesXml(m.treble, mn, 'F', 4, chord, key);
    } else {
      rhXml += _jaeNotesXml(m.treble, mn, 'G', 2, chord, key);
      if(isGrand) lhXml += _jaeNotesXml(m.bass||[], mn, 'F', 4, '', key);
    }
  });
  const title = amendment.title || 'Amended Exercise';
  if(isGrand) return G.wrapGrandStaffDocument(rhXml, lhXml, title);
  if(isBass)  return G.wrapBassClefOnlyDocument(lhXml, title);
  return G.wrapDocument(rhXml, title);
}

/* ---------- editor state ---------- */
let _jaeSession = null;
let _jaeTimer   = null;
let _jaeOSMD    = null;   /* single OSMD instance — Bug #3 fix */
let _jaeEd      = null;

const JAE_DURS = [
  {d:16, t:'whole',     s:'𝅝',  k:'1', label:'whole'},
  {d:8,  t:'half',      s:'𝅗𝅥',  k:'2', label:'half'},
  {d:4,  t:'quarter',   s:'♩',        k:'3', label:'quarter'},
  {d:2,  t:'eighth',    s:'♪',        k:'4', label:'eighth'},
  {d:1,  t:'sixteenth', s:'♬',        k:'5', label:'16th'}
];

function _jaeResetEdState(session){
  _jaeEd = {
    mode:        'normal',
    activeStaff: session.staff === 'bass' ? 'bass' : 'treble',
    durD: 4, durT: 'quarter',
    accidental: 0,
    selMeasure: 0, selNote: -1,
    history: [], future: []
  };
}

function _jaeSnapshot(){
  if(!_jaeEd) return;
  _jaeEd.history.push(JSON.stringify(_jaeSession.measures));
  _jaeEd.future = [];
  if(_jaeEd.history.length > 40) _jaeEd.history.shift();
}

function _jaeUndo(){
  if(!_jaeEd || !_jaeEd.history.length) return false;
  _jaeEd.future.push(JSON.stringify(_jaeSession.measures));
  _jaeSession.measures = JSON.parse(_jaeEd.history.pop());
  _jaeEd.selNote = -1;
  return true;
}

function _jaeRedo(){
  if(!_jaeEd || !_jaeEd.future.length) return false;
  _jaeEd.history.push(JSON.stringify(_jaeSession.measures));
  _jaeSession.measures = JSON.parse(_jaeEd.future.pop());
  _jaeEd.selNote = -1;
  return true;
}

/* Get the note array for a given measure and staff label.
   Bass-only exercises store their (bass-clef) notes in treble array. */
function _jaeGetNoteArrByStaff(session, mi, staff){
  const m = session && session.measures[mi];
  if(!m) return null;
  if(session.staff === 'bass') return m.treble;
  if(staff === 'bass') return m.bass || (m.bass = []);
  return m.treble;
}

function _jaeGetNoteArrForSel(){
  if(!_jaeEd || !_jaeSession) return null;
  const effStaff = _jaeSession.staff === 'bass' ? 'treble' : _jaeEd.activeStaff;
  return _jaeGetNoteArrByStaff(_jaeSession, _jaeEd.selMeasure, effStaff);
}

/* Map a letter key (A-G) to the closest MIDI note to currentMidi,
   with optional accidental (+1 sharp / -1 flat). */
function _jaeLetterToMidi(letter, accidental, currentMidi){
  const LPC = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
  const basePc = LPC[letter.toUpperCase()];
  if(basePc === undefined) return null;
  const pc = ((basePc + accidental) % 12 + 12) % 12;
  if(currentMidi == null) currentMidi = 60;
  const base = Math.round((currentMidi - pc) / 12) * 12 + pc;
  const candidates = [base - 12, base, base + 12];
  return candidates.reduce((best, c) =>
    Math.abs(c - currentMidi) < Math.abs(best - currentMidi) ? c : best, base);
}

/* ---------- note / measure HTML ---------- */
function jaeNoteName(note, key){
  if(note.r) return 'rest';
  return jazzNoteNameFromMidi(note.m + JazzExerciseGenerator.transpositionFromC(key), key);
}

function jaeNoteHTML(note, mi, ni, key, staff){
  const nm = jaeNoteName(note, key);
  const isSel = _jaeEd &&
    _jaeEd.selMeasure === mi && _jaeEd.selNote === ni &&
    (_jaeSession.staff === 'bass' || _jaeEd.activeStaff === staff);
  const durSel = JAE_DURS.map(x =>
    `<option value="${x.d}" ${x.d===note.d?'selected':''}>${x.s} ${x.label}</option>`).join('');
  return `<div class="jae-note${isSel?' jae-sel':''}" data-mi="${mi}" data-ni="${ni}" data-staff="${staff}">
    <input class="jae-np mono" type="text" value="${esc(nm)}" placeholder="C4"
      data-mi="${mi}" data-ni="${ni}" data-staff="${staff}" ${note.r?'disabled':''}>
    <select class="jae-nd mono" data-mi="${mi}" data-ni="${ni}" data-staff="${staff}">${durSel}</select>
    <label class="jae-nr"><input type="checkbox" class="jae-rc"
      data-mi="${mi}" data-ni="${ni}" data-staff="${staff}" ${note.r?'checked':''}><span>rest</span></label>
    <button class="jae-ndel tbtn" data-mi="${mi}" data-ni="${ni}" data-staff="${staff}" title="remove">×</button>
  </div>`;
}

function jaeMeasureHTML(m, mi, key){
  const session = _jaeSession;
  const isGrand = session && session.staff === 'grand';
  const isBass  = session && session.staff === 'bass';
  const chordInKey = m.chord
    ? jazzTransposeChord(m.chord, JazzExerciseGenerator.transpositionFromC(key)) : '';
  const trebleActive = !_jaeEd || _jaeEd.activeStaff === 'treble';
  const bassActive   = !_jaeEd || _jaeEd.activeStaff === 'bass';

  const trebleRow = !isBass ? `
    <div class="jae-staff-row${trebleActive?' jae-active-staff':''}" data-staff="treble">
      <span class="jae-staff-lbl">𝄞 RH</span>
      <div class="jae-notes" id="jaeNotesTreble${mi}">
        ${(m.treble||[]).map((n,ni) => jaeNoteHTML(n, mi, ni, key, 'treble')).join('')}
      </div>
      <button class="jae-nadd tbtn" data-mi="${mi}" data-staff="treble">+ note</button>
    </div>` : '';

  const bassRow = (isGrand || isBass) ? `
    <div class="jae-staff-row${isGrand ? (bassActive?' jae-active-staff':'') : ' jae-active-staff'}" data-staff="bass">
      <span class="jae-staff-lbl">𝄢 LH</span>
      <div class="jae-notes" id="jaeNotesBass${mi}">
        ${(isBass ? (m.treble||[]) : (m.bass||[]))
            .map((n,ni) => jaeNoteHTML(n, mi, ni, key, 'bass')).join('')}
      </div>
      <button class="jae-nadd tbtn" data-mi="${mi}" data-staff="bass">+ note</button>
    </div>` : '';

  return `<div class="jae-measure" data-mi="${mi}">
    <div class="jae-mhead">
      <span class="mono jae-mn">M${mi+1}</span>
      <input class="jae-chord mono" type="text" value="${esc(chordInKey)}"
        placeholder="chord e.g. Dm7" data-mi="${mi}">
      <button class="jae-mdel tbtn" data-mi="${mi}"${mi===0?' disabled':''}>− bar</button>
    </div>
    ${trebleRow}${bassRow}
  </div>`;
}

function _jaeTipText(mode){
  if(mode === 'input')
    return 'Note Input — A-G = add note · 1-5 = duration · 0 = rest · Shift+letter = chord · N or Esc = exit';
  if(mode === 'repitch')
    return 'Re-pitch — A-G = replace & advance · arrows or ← → navigate · Ctrl+Shift+I or Esc = exit';
  return 'Normal — click to select · ↑↓ = ±semitone · A-G = replace pitch · Delete = remove · N = Note Input';
}

function jaeEditorHTML(id, session, key){
  const ex = jazzExercise(id);
  const am = jazzAmend(id);
  const isGrand = session.staff === 'grand';
  const ed = _jaeEd;

  const modeBtns = ['normal','input','repitch'].map(m =>
    `<button class="tbtn jae-mode${ed&&ed.mode===m?' active':''}" data-mode="${m}"
       title="${m==='normal'?'Select & modify [Esc]':m==='input'?'Add notes [N]':'Re-pitch notes [Ctrl+Shift+I]'}"
       >${m==='normal'?'📝 Normal':m==='input'?'🎵 Note Input':'🔄 Re-pitch'}</button>`).join('');

  const staffBtns = isGrand ? `<div class="jae-tg">
    <button class="tbtn jae-staff${!ed||ed.activeStaff==='treble'?' active':''}" data-staff="treble"
      title="Right hand — treble clef [Alt+↑]">𝄞 RH</button>
    <button class="tbtn jae-staff${ed&&ed.activeStaff==='bass'?' active':''}" data-staff="bass"
      title="Left hand — bass clef [Alt+↓]">𝄢 LH</button>
  </div>` : '';

  const durBtns = JAE_DURS.map(d =>
    `<button class="tbtn jae-dur${ed&&ed.durD===d.d?' active':''}" data-d="${d.d}"
       title="${d.label} [${d.k}]">${d.s}</button>`).join('');

  return `<div class="jae-editor">
    <div class="jae-etitle">
      <b class="serif">✏️ Editing:</b> ${esc(ex ? ex.name : id)}
      <span class="mono faint" style="margin-left:8px">key: ${esc(key)}</span>
    </div>
    <div class="jae-toolbar">
      <div class="jae-tg">${modeBtns}</div>
      ${staffBtns}
      <div class="jae-tg">${durBtns}</div>
      <div class="jae-tg">
        <button class="tbtn jae-acc" data-acc="1"  title="sharp [#]">♯</button>
        <button class="tbtn jae-acc" data-acc="-1" title="flat [b]">♭</button>
        <button class="tbtn jae-acc" data-acc="0"  title="natural [n]">♮</button>
      </div>
      <div class="jae-tg">
        <button class="tbtn" id="jaeUndo" title="Undo [Ctrl+Z]">↩</button>
        <button class="tbtn" id="jaeRedo" title="Redo [Ctrl+Y]">↪</button>
        <button class="tbtn" id="jaeMAdd" title="Add measure">+ bar</button>
      </div>
      <div class="jae-tg jae-tg-end">
        <button class="btn primary sm" id="jaeSave">💾 Save</button>
        <button class="btn ghost sm"   id="jaeCancel">✕</button>
        ${am ? `<button class="btn sm danger" id="jaeClear" title="Remove amendment">🗑</button>` : ''}
      </div>
    </div>
    <div class="jae-mode-tip mono faint" id="jaeTip">${esc(_jaeTipText(ed ? ed.mode : 'normal'))}</div>
    <div class="jae-preview" id="jaePreview">
      <div class="mono faint" style="padding:10px;font-size:.7rem">Preview loading…</div>
    </div>
    <div class="jae-measures" id="jaeMeasures">
      ${session.measures.map((m,mi) => jaeMeasureHTML(m, mi, key)).join('')}
    </div>
    <div class="jae-meta">
      <label class="jae-ml"><span class="mono">Source</span>
        <input type="text" id="jaeSrc" value="${esc(session.src||'')}"
          placeholder="e.g. Siskind Book 1, p.82, system 3"></label>
      <label class="jae-ml"><span class="mono">Notes</span>
        <input type="text" id="jaeNote" value="${esc(session.note||'')}"
          placeholder="what you changed"></label>
      <div class="jae-ml row" style="gap:14px;align-items:center;flex-wrap:wrap">
        <span class="mono">Confidence</span>
        ${['verified','approximate','needs_review'].map(c =>
          `<label class="row" style="gap:4px;align-items:center"><input type="radio" name="jaeConf"
            value="${c}" ${(session.conf||'approximate')===c?'checked':''}> ${esc(c.replace('_',' '))}</label>`
        ).join('')}
      </div>
    </div>
  </div>`;
}

/* ---------- read form inputs into session ---------- */
function _jaeReadForm(root, session, key){
  const G = JazzExerciseGenerator;
  const t = G.transpositionFromC(key);
  root.querySelectorAll('.jae-chord').forEach(inp => {
    const mi = +inp.dataset.mi;
    if(!session.measures[mi]) return;
    const raw = inp.value.trim();
    session.measures[mi].chord = raw ? jazzTransposeChord(raw, (12 - t % 12) % 12) : null;
  });
  root.querySelectorAll('.jae-np').forEach(inp => {
    if(inp.disabled) return;
    const mi = +inp.dataset.mi, ni = +inp.dataset.ni, staff = inp.dataset.staff || 'treble';
    const arr = _jaeGetNoteArrByStaff(session, mi, staff);
    const note = arr && arr[ni];
    if(!note || note.r) return;
    const midi = jazzNoteNameToMidi(inp.value.trim());
    if(midi != null) note.m = midi - t;
  });
  root.querySelectorAll('.jae-nd').forEach(sel => {
    const mi = +sel.dataset.mi, ni = +sel.dataset.ni, staff = sel.dataset.staff || 'treble';
    const arr = _jaeGetNoteArrByStaff(session, mi, staff);
    const note = arr && arr[ni];
    if(!note) return;
    const d = +sel.value;
    note.d = d; note.t = JAE_DUR_TYPE[d] || 'quarter';
  });
  root.querySelectorAll('.jae-rc').forEach(cb => {
    const mi = +cb.dataset.mi, ni = +cb.dataset.ni, staff = cb.dataset.staff || 'treble';
    const arr = _jaeGetNoteArrByStaff(session, mi, staff);
    const note = arr && arr[ni];
    if(!note) return;
    note.r = cb.checked;
  });
}

/* ---------- bind measure-level controls ---------- */
function _jaeBindMeasures(root, session, key, schedPreview, doRerender){
  const G = JazzExerciseGenerator;

  root.querySelectorAll('.jae-np').forEach(inp => {
    inp.oninput = schedPreview; inp.onchange = schedPreview;
  });
  root.querySelectorAll('.jae-nd').forEach(sel => sel.onchange = schedPreview);
  root.querySelectorAll('.jae-chord').forEach(inp => inp.oninput = schedPreview);

  root.querySelectorAll('.jae-rc').forEach(cb => cb.onchange = () => {
    const mi = +cb.dataset.mi, ni = +cb.dataset.ni, staff = cb.dataset.staff || 'treble';
    const np = root.querySelector(`.jae-np[data-mi="${mi}"][data-ni="${ni}"][data-staff="${staff}"]`);
    if(np){ np.disabled = cb.checked; np.style.opacity = cb.checked ? '.4' : ''; }
    schedPreview();
  });

  root.querySelectorAll('.jae-note').forEach(div => div.onclick = e => {
    if(e.target.closest('button,input,select,label')) return;
    const mi = +div.dataset.mi, ni = +div.dataset.ni, staff = div.dataset.staff || 'treble';
    if(_jaeEd){
      _jaeEd.selMeasure = mi;
      _jaeEd.selNote = ni;
      if(session.staff === 'grand') _jaeEd.activeStaff = staff;
    }
    doRerender();
  });

  root.querySelectorAll('.jae-ndel').forEach(btn => btn.onclick = () => {
    _jaeReadForm(root, session, key);
    const mi = +btn.dataset.mi, ni = +btn.dataset.ni, staff = btn.dataset.staff || 'treble';
    const arr = _jaeGetNoteArrByStaff(session, mi, staff);
    if(arr){ _jaeSnapshot(); arr.splice(ni, 1); }
    if(_jaeEd && _jaeEd.selMeasure === mi && _jaeEd.selNote >= arr.length)
      _jaeEd.selNote = arr.length - 1;
    doRerender(); schedPreview();
  });

  root.querySelectorAll('.jae-mdel').forEach(btn => btn.onclick = () => {
    if(session.measures.length <= 1) return;
    _jaeReadForm(root, session, key);
    _jaeSnapshot();
    session.measures.splice(+btn.dataset.mi, 1);
    session.measures.forEach((m,i) => m.n = i+1);
    doRerender(); schedPreview();
  });

  root.querySelectorAll('.jae-nadd').forEach(btn => btn.onclick = () => {
    _jaeReadForm(root, session, key);
    const mi = +btn.dataset.mi, staff = btn.dataset.staff || 'treble';
    const arr = _jaeGetNoteArrByStaff(session, mi, staff);
    if(!arr) return;
    _jaeSnapshot();
    const t = G.transpositionFromC(key);
    const last = arr.filter(n => !n.r).slice(-1)[0];
    const m = last ? last.m : (60 - t);
    arr.push({m, d:4, t:'quarter', r:false, c:false});
    if(_jaeEd){
      _jaeEd.selMeasure = mi;
      _jaeEd.selNote = arr.length - 1;
      if(session.staff === 'grand') _jaeEd.activeStaff = staff;
    }
    doRerender(); schedPreview();
  });
}

/* ---------- bind the whole editor ---------- */
function bindJazzAmendEditor(overlay, id, key, afterSave){
  const root = overlay.querySelector('.jae-editor');
  if(!root || !_jaeSession || !_jaeEd) return;
  const session = _jaeSession;
  const G = JazzExerciseGenerator;

  /* ---- UI update helpers ---- */
  function updateModeUI(){
    root.querySelectorAll('.jae-mode').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === _jaeEd.mode));
    const tip = root.querySelector('#jaeTip');
    if(tip) tip.textContent = _jaeTipText(_jaeEd.mode);
  }
  function updateStaffUI(){
    root.querySelectorAll('.jae-staff').forEach(b =>
      b.classList.toggle('active', b.dataset.staff === _jaeEd.activeStaff));
    root.querySelectorAll('.jae-staff-row').forEach(row =>
      row.classList.toggle('jae-active-staff',
        session.staff !== 'grand' || row.dataset.staff === _jaeEd.activeStaff));
  }
  function updateDurUI(){
    root.querySelectorAll('.jae-dur').forEach(b =>
      b.classList.toggle('active', +b.dataset.d === _jaeEd.durD));
  }

  /* ---- single OSMD instance (Bug #3 fix) ---- */
  async function _initOSMD(){
    const box = root.querySelector('#jaePreview');
    if(!box || _jaeOSMD) return;
    if(!osmdBuiltIn()){ box.innerHTML = '<div class="jz-noscore">Engraver not available.</div>'; return; }
    box.innerHTML = '';
    try {
      const lib = await osmdBoot();
      _jaeOSMD = new lib.OpenSheetMusicDisplay(box, {
        autoResize:false, backend:'svg',
        drawTitle:false, drawComposer:false, drawCredits:false,
        drawPartNames:false, drawMeasureNumbers:false,
        drawingParameters:'compact'
      });
      const rules = _jaeOSMD.EngravingRules || _jaeOSMD.rules;
      if(rules){ rules.RenderChordSymbols = true;
        try { rules.FillEmptyMeasuresWithWholeRest = 2; } catch(e){} }
    } catch(e){ console.warn('OSMD init failed in amendment editor', e); }
  }

  function schedPreview(){
    clearTimeout(_jaeTimer);
    _jaeTimer = setTimeout(async () => {
      _jaeReadForm(root, session, key);
      const box = root.querySelector('#jaePreview');
      if(!box) return;
      try {
        const xml = jazzAmendToXml(session, key);
        if(!_jaeOSMD) await _initOSMD();
        if(_jaeOSMD){
          await _jaeOSMD.load(xml);
          _jaeOSMD.zoom = 1.0;
          _jaeOSMD.render();
        }
      } catch(e){
        if(box) box.innerHTML =
          `<div class="jz-noscore" style="font-size:.8rem">Preview error: ${esc(e.message)}</div>`;
      }
    }, 400);
  }

  function doRerender(){
    const measDiv = root.querySelector('#jaeMeasures');
    if(measDiv) measDiv.innerHTML =
      session.measures.map((m,mi) => jaeMeasureHTML(m, mi, key)).join('');
    updateModeUI(); updateStaffUI(); updateDurUI();
    _jaeBindMeasures(root, session, key, schedPreview, doRerender);
  }

  /* ---- toolbar bindings ---- */
  root.querySelectorAll('.jae-mode').forEach(b => b.onclick = () => {
    _jaeEd.mode = b.dataset.mode; updateModeUI();
  });
  root.querySelectorAll('.jae-staff').forEach(b => b.onclick = () => {
    _jaeEd.activeStaff = b.dataset.staff; updateStaffUI(); doRerender();
  });
  root.querySelectorAll('.jae-dur').forEach(b => b.onclick = () => {
    const dur = JAE_DURS.find(d => d.d === +b.dataset.d);
    if(!dur) return;
    _jaeEd.durD = dur.d; _jaeEd.durT = dur.t; updateDurUI();
    if(_jaeEd.mode === 'normal' && _jaeEd.selNote >= 0){
      const arr = _jaeGetNoteArrForSel(), note = arr && arr[_jaeEd.selNote];
      if(note){ _jaeSnapshot(); note.d = dur.d; note.t = dur.t; doRerender(); schedPreview(); }
    }
  });
  root.querySelectorAll('.jae-acc').forEach(b => b.onclick = () => {
    const acc = +b.dataset.acc;
    if(_jaeEd.mode === 'normal' && _jaeEd.selNote >= 0){
      const arr = _jaeGetNoteArrForSel(), note = arr && arr[_jaeEd.selNote];
      if(note && !note.r){
        _jaeSnapshot();
        const t = G.transpositionFromC(key);
        const midi = note.m + t;
        const pc = ((midi % 12) + 12) % 12;
        const newPc = ((pc + acc) % 12 + 12) % 12;
        let delta = newPc - pc;
        if(delta > 6) delta -= 12;
        if(delta < -6) delta += 12;
        note.m += delta;
        doRerender(); schedPreview();
      }
    } else {
      _jaeEd.accidental = acc;
    }
  });

  const undoBtn = root.querySelector('#jaeUndo');
  if(undoBtn) undoBtn.onclick = () => { if(_jaeUndo()){ doRerender(); schedPreview(); } };
  const redoBtn = root.querySelector('#jaeRedo');
  if(redoBtn) redoBtn.onclick = () => { if(_jaeRedo()){ doRerender(); schedPreview(); } };

  const mAdd = root.querySelector('#jaeMAdd');
  if(mAdd) mAdd.onclick = () => {
    _jaeReadForm(root, session, key);
    _jaeSnapshot();
    const t = G.transpositionFromC(key);
    session.measures.push({n: session.measures.length+1, chord:null,
      treble:[{m:60 - t, d:4, t:'quarter', r:false, c:false}],
      bass: session.staff === 'grand' ? [] : null});
    doRerender(); schedPreview();
  };

  function doSave(){
    _jaeReadForm(root, session, key);
    session.src  = (root.querySelector('#jaeSrc')||{}).value || null;
    session.note = (root.querySelector('#jaeNote')||{}).value || null;
    const conf = root.querySelector('[name="jaeConf"]:checked');
    session.conf = conf ? conf.value : 'approximate';
    jazzSetAmend(id, session);
    _jaeClose(overlay);
    sound('success');
    toast('Amendment saved — applies in all twelve keys.');
    if(afterSave) afterSave();
  }

  const saveBtn = root.querySelector('#jaeSave');
  if(saveBtn) saveBtn.onclick = doSave;
  const cancelBtn = root.querySelector('#jaeCancel');
  if(cancelBtn) cancelBtn.onclick = () => _jaeClose(overlay);
  const clrBtn = root.querySelector('#jaeClear');
  if(clrBtn) clrBtn.onclick = () => {
    jazzClearAmend(id);
    _jaeClose(overlay);
    sound('click');
    toast('Amendment removed.');
    if(afterSave) afterSave();
  };

  /* ---- keyboard handler ---- */
  function _jaeKeyDown(e){
    if(!_jaeEd || !_jaeSession) return;
    const isMeta = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    const k = e.key;
    const tag = document.activeElement ? document.activeElement.tagName : '';
    const inInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

    /* global shortcuts — fire even in form inputs */
    if(isMeta && !isAlt && k === 'z'){
      e.preventDefault();
      if(isShift){ if(_jaeRedo()){ doRerender(); schedPreview(); } }
      else       { if(_jaeUndo()){ doRerender(); schedPreview(); } }
      return;
    }
    if(isMeta && !isAlt && k === 'y'){
      e.preventDefault();
      if(_jaeRedo()){ doRerender(); schedPreview(); }
      return;
    }
    if(isMeta && k === 's'){ e.preventDefault(); doSave(); return; }

    if(inInput) return;

    /* mode switching */
    if(!isMeta && !isAlt && k.toLowerCase() === 'n'){
      _jaeEd.mode = _jaeEd.mode === 'input' ? 'normal' : 'input';
      updateModeUI(); e.preventDefault(); return;
    }
    if(isMeta && isShift && k.toLowerCase() === 'i'){
      _jaeEd.mode = _jaeEd.mode === 'repitch' ? 'normal' : 'repitch';
      updateModeUI(); e.preventDefault(); return;
    }
    if(k === 'Escape'){
      _jaeEd.mode = 'normal'; _jaeEd.selNote = -1;
      updateModeUI(); doRerender(); e.preventDefault(); return;
    }

    /* staff switching Alt+↑/↓ */
    if(isAlt && k === 'ArrowUp'){
      if(session.staff === 'grand'){ _jaeEd.activeStaff = 'treble'; updateStaffUI(); doRerender(); }
      e.preventDefault(); return;
    }
    if(isAlt && k === 'ArrowDown'){
      if(session.staff === 'grand'){ _jaeEd.activeStaff = 'bass'; updateStaffUI(); doRerender(); }
      e.preventDefault(); return;
    }

    /* duration keys 1-5 */
    if(!isMeta && !isAlt && '12345'.includes(k)){
      const idx = '12345'.indexOf(k);
      const dur = JAE_DURS[idx];
      if(dur){ _jaeEd.durD = dur.d; _jaeEd.durT = dur.t; updateDurUI(); }
      if(_jaeEd.mode === 'normal' && _jaeEd.selNote >= 0 && dur){
        const arr = _jaeGetNoteArrForSel(), note = arr && arr[_jaeEd.selNote];
        if(note){ _jaeSnapshot(); note.d = dur.d; note.t = dur.t; doRerender(); schedPreview(); }
      }
      e.preventDefault(); return;
    }

    /* accidentals */
    if(!isMeta && !isAlt && k === '#'){ _jaeEd.accidental = 1; e.preventDefault(); return; }
    /* 'b' means flat in input/repitch; in normal it falls through to pitch-letter handling */
    if(!isMeta && !isAlt && k === 'b' && _jaeEd.mode !== 'normal'){
      _jaeEd.accidental = -1; e.preventDefault(); return;
    }

    /* pitch letters A-G */
    const letter = k.toUpperCase();
    if(!isMeta && !isAlt && 'ABCDEFG'.includes(letter) && letter.length === 1){
      e.preventDefault();
      const t = G.transpositionFromC(key);

      if(_jaeEd.mode === 'normal'){
        if(_jaeEd.selNote < 0) return;
        const arr = _jaeGetNoteArrForSel(), note = arr && arr[_jaeEd.selNote];
        if(!note || note.r) return;
        _jaeSnapshot();
        note.m = _jaeLetterToMidi(letter, _jaeEd.accidental, note.m + t) - t;
        _jaeEd.accidental = 0;
        doRerender(); schedPreview();

      } else if(_jaeEd.mode === 'input'){
        _jaeSnapshot();
        const arr = _jaeGetNoteArrForSel();
        if(!arr) return;
        const lastNote = arr.filter(n => !n.r).slice(-1)[0];
        const lastMidi = lastNote ? (lastNote.m + t) : 60;
        const midi = _jaeLetterToMidi(letter, _jaeEd.accidental, lastMidi);
        arr.push({m: midi - t, d: _jaeEd.durD, t: _jaeEd.durT, r:false, c: isShift && arr.length > 0});
        _jaeEd.selNote = arr.length - 1;
        _jaeEd.accidental = 0;
        doRerender(); schedPreview();

      } else if(_jaeEd.mode === 'repitch'){
        if(_jaeEd.selNote < 0) _jaeEd.selNote = 0;
        const arr = _jaeGetNoteArrForSel(), note = arr && arr[_jaeEd.selNote];
        if(!note || note.r) return;
        _jaeSnapshot();
        note.m = _jaeLetterToMidi(letter, _jaeEd.accidental, note.m + t) - t;
        _jaeEd.accidental = 0;
        if(_jaeEd.selNote + 1 < arr.length){
          _jaeEd.selNote++;
        } else if(_jaeEd.selMeasure + 1 < session.measures.length){
          _jaeEd.selMeasure++;
          const next = _jaeGetNoteArrForSel();
          _jaeEd.selNote = next && next.length > 0 ? 0 : -1;
        }
        doRerender(); schedPreview();
      }
      return;
    }

    /* rest in input mode (0) */
    if(!isMeta && !isAlt && k === '0' && _jaeEd.mode === 'input'){
      e.preventDefault();
      _jaeSnapshot();
      const arr = _jaeGetNoteArrForSel();
      if(!arr) return;
      arr.push({m:0, d:_jaeEd.durD, t:_jaeEd.durT, r:true, c:false});
      _jaeEd.selNote = arr.length - 1;
      doRerender(); schedPreview();
      return;
    }

    /* arrow keys for pitch and navigation */
    if(!isAlt && (k === 'ArrowUp' || k === 'ArrowDown') && _jaeEd.mode !== 'input'){
      if(_jaeEd.selNote < 0) return;
      e.preventDefault();
      const arr = _jaeGetNoteArrForSel(), note = arr && arr[_jaeEd.selNote];
      if(!note || note.r) return;
      _jaeSnapshot();
      note.m += (k === 'ArrowUp' ? 1 : -1) * (isMeta ? 12 : 1);
      doRerender(); schedPreview();
      return;
    }
    if(!isAlt && (k === 'ArrowLeft' || k === 'ArrowRight') && _jaeEd.mode === 'normal'){
      e.preventDefault();
      if(k === 'ArrowLeft'){
        if(_jaeEd.selNote > 0){ _jaeEd.selNote--; }
        else if(_jaeEd.selMeasure > 0){
          _jaeEd.selMeasure--;
          const arr = _jaeGetNoteArrForSel();
          _jaeEd.selNote = arr ? arr.length - 1 : -1;
        }
      } else {
        const arr = _jaeGetNoteArrForSel();
        if(arr && _jaeEd.selNote + 1 < arr.length){ _jaeEd.selNote++; }
        else if(_jaeEd.selMeasure + 1 < session.measures.length){
          _jaeEd.selMeasure++; _jaeEd.selNote = 0;
        }
      }
      doRerender(); return;
    }

    /* Tab = next/prev measure */
    if(k === 'Tab'){
      e.preventDefault();
      if(isShift){
        if(_jaeEd.selMeasure > 0){ _jaeEd.selMeasure--; _jaeEd.selNote = 0; }
      } else {
        if(_jaeEd.selMeasure + 1 < session.measures.length){ _jaeEd.selMeasure++; _jaeEd.selNote = 0; }
      }
      doRerender(); return;
    }

    /* Delete/Backspace in normal mode — replace with rest */
    if((k === 'Delete' || k === 'Backspace') && _jaeEd.mode === 'normal'){
      if(_jaeEd.selNote < 0) return;
      e.preventDefault();
      const arr = _jaeGetNoteArrForSel(), note = arr && arr[_jaeEd.selNote];
      if(!note) return;
      _jaeSnapshot();
      arr[_jaeEd.selNote] = {m:0, d:note.d, t:note.t, r:true, c:false};
      doRerender(); schedPreview();
      return;
    }
  }

  document.addEventListener('keydown', _jaeKeyDown);

  /* clean up when overlay is removed from DOM (handles all close paths) */
  const _parentObserver = new MutationObserver(() => {
    if(!document.contains(overlay)){
      _parentObserver.disconnect();
      document.removeEventListener('keydown', _jaeKeyDown);
      clearTimeout(_jaeTimer);
      _jaeOSMD = null;
    }
  });
  const _parent = overlay.parentNode;
  if(_parent) _parentObserver.observe(_parent, {childList:true});

  _jaeBindMeasures(root, session, key, schedPreview, doRerender);
  schedPreview();
}

function _jaeClose(overlay){
  overlay.remove();
  _jaeSession = null;
  _jaeEd = null;
}

/* ---------- open the editor ---------- */
function openJazzEditor(id, xmlOf, key, afterSave){
  const G = JazzExerciseGenerator;
  const ex = jazzExercise(id);
  const existing = jazzAmend(id);
  let session;
  if(existing){
    session = JSON.parse(JSON.stringify(existing));
  } else {
    const xml = xmlOf ? xmlOf() : null;
    session = (xml && typeof xml === 'string') ? jazzMxlToAmend(xml, key, ex ? ex.name : id) : null;
    if(!session){
      session = {staff:'treble', title: ex ? ex.name : id, key,
        measures:[{n:1, chord:null,
          treble:[{m:60 - G.transpositionFromC(key), d:4, t:'quarter', r:false, c:false}],
          bass:null}],
        note:null, src:null, conf:'approximate'};
    }
  }
  _jaeSession = session;
  _jaeResetEdState(session);   /* must come before jaeEditorHTML */
  const overlay = openModal(jaeEditorHTML(id, session, key), 'jae-modal wide');
  bindJazzAmendEditor(overlay, id, key, afterSave);
  return overlay;
}

/* ---------- amendment banner HTML ---------- */
function jazzAmendBannerHTML(id){
  const a = jazzAmend(id);
  if(!a) return '';
  const conf = a.conf || 'approximate';
  const confClass = conf === 'verified' ? 'jae-cv' : conf === 'needs_review' ? 'jae-cr' : 'jae-ca';
  const when = a.ua ? ` · last edited ${esc(relDays(daysSince(a.ua.slice(0,10))))}` : '';
  return `<div class="jae-banner">
    <span class="jae-bi" aria-hidden="true">✏️</span>
    <span>Corrected by you${when}</span>
    <span class="jae-conf ${confClass}">${esc(conf.replace('_',' '))}</span>
  </div>`;
}
