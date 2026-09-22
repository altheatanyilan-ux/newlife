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
      bass: isGrand && lhBars[i] ? _jaeParseNotes(lhBars[i], 0) : null
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

/* ---------- editor session state ---------- */
let _jaeSession   = null;
let _jaeTimer     = null;

/* ---------- editor HTML ---------- */
const JAE_DURS = [
  {d:16, t:'whole',      s:'𝅝', label:'whole'},
  {d:8,  t:'half',       s:'𝅗𝅥', label:'half'},
  {d:4,  t:'quarter',    s:'♩',        label:'quarter'},
  {d:2,  t:'eighth',     s:'♪',        label:'eighth'},
  {d:1,  t:'sixteenth',  s:'♬',        label:'16th'}
];

function jaeNoteName(note, key){
  if(note.r) return 'rest';
  return jazzNoteNameFromMidi(note.m + JazzExerciseGenerator.transpositionFromC(key), key);
}

function jaeNoteHTML(note, mi, ni, key){
  const nm = jaeNoteName(note, key);
  const durSel = JAE_DURS.map(x =>
    `<option value="${x.d}" ${x.d===note.d?'selected':''}>${x.s} ${x.label}</option>`).join('');
  return `<div class="jae-note" data-mi="${mi}" data-ni="${ni}">
    <input class="jae-np mono" type="text" value="${esc(nm)}" placeholder="C4"
      data-mi="${mi}" data-ni="${ni}" ${note.r?'disabled':''} style="${note.r?'opacity:.4':''}">
    <select class="jae-nd mono" data-mi="${mi}" data-ni="${ni}">${durSel}</select>
    <label class="jae-nr"><input type="checkbox" class="jae-rc" data-mi="${mi}" data-ni="${ni}"
      ${note.r?'checked':''}><span>rest</span></label>
    <button class="jae-ndel tbtn" data-mi="${mi}" data-ni="${ni}" title="remove note">\xd7</button>
  </div>`;
}

function jaeMeasureHTML(m, mi, key){
  const chordInKey = m.chord
    ? jazzTransposeChord(m.chord, JazzExerciseGenerator.transpositionFromC(key)) : '';
  return `<div class="jae-measure" data-mi="${mi}">
    <div class="jae-mhead">
      <span class="mono jae-mn">M${mi+1}</span>
      <input class="jae-chord mono" type="text" value="${esc(chordInKey)}"
        placeholder="chord, e.g. Dm7" data-mi="${mi}">
      <button class="jae-mdel tbtn" data-mi="${mi}"${mi===0?' disabled':''}>&#x2212; bar</button>
    </div>
    <div class="jae-notes" id="jaeNotes${mi}">
      ${(m.treble||[]).map((n,ni) => jaeNoteHTML(n, mi, ni, key)).join('')}
    </div>
    <button class="jae-nadd tbtn" data-mi="${mi}">&#x2b; note</button>
  </div>`;
}

function jaeEditorHTML(id, session, key){
  const ex = jazzExercise(id);
  const am = jazzAmend(id);
  return `<div class="jae-editor">
    <div class="jae-etitle">
      <b class="serif">✏️ Editing:</b> ${esc(ex ? ex.name : id)}
      <span class="mono faint" style="margin-left:8px">key shown: ${esc(key)}</span>
    </div>
    <p class="faint mono jae-tip">Notes are stored as intervals — they transpose automatically.</p>
    <div class="jae-measures" id="jaeMeasures">
      ${session.measures.map((m,mi) => jaeMeasureHTML(m, mi, key)).join('')}
    </div>
    <div class="row" style="gap:8px;margin:8px 0 14px">
      <button class="tbtn" id="jaeMAdd">&#x2b; bar</button>
    </div>
    <div class="jae-meta">
      <label class="jae-ml"><span class="mono">Source ref</span>
        <input type="text" id="jaeSrc" value="${esc(session.src||'')}"
          placeholder="e.g. Siskind Book 1, p.82, system 3"></label>
      <label class="jae-ml"><span class="mono">Notes</span>
        <input type="text" id="jaeNote" value="${esc(session.note||'')}"
          placeholder="what you changed"></label>
      <div class="jae-ml row" style="gap:14px;align-items:center;flex-wrap:wrap">
        <span class="mono">Confidence</span>
        ${['verified','approximate','needs_review'].map(c =>
          `<label class="row" style="gap:4px;align-items:center"><input type="radio" name="jaeConf"
            value="${c}" ${(session.conf||'approximate')===c?'checked':''}> ${esc(c.replace('_',' '))}</label>`).join('')}
      </div>
    </div>
    <div class="jae-preview" id="jaePreview">
      <div class="mono faint" style="padding:10px;font-size:.7rem">Preview loading…</div>
    </div>
    <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn primary" id="jaeSave">\u{1f4be} Save amendment</button>
      <button class="btn ghost" id="jaeCancel">Cancel</button>
      ${am ? `<button class="btn sm danger" id="jaeClear" style="margin-left:auto">\u{1f5d1} Remove amendment</button>` : ''}
    </div>
  </div>`;
}

/* ---------- editor binding ---------- */
function _jaeReadForm(root, session, key){
  const G = JazzExerciseGenerator;
  const t = G.transpositionFromC(key);
  root.querySelectorAll('.jae-chord').forEach(inp => {
    const mi = +inp.dataset.mi;
    if(!session.measures[mi]) return;
    const raw = inp.value.trim();
    if(!raw){ session.measures[mi].chord = null; return; }
    session.measures[mi].chord = jazzTransposeChord(raw, (12 - t % 12) % 12);
  });
  root.querySelectorAll('.jae-np').forEach(inp => {
    if(inp.disabled) return;
    const mi = +inp.dataset.mi, ni = +inp.dataset.ni;
    const note = (session.measures[mi]||{}).treble && session.measures[mi].treble[ni];
    if(!note || note.r) return;
    const midi = jazzNoteNameToMidi(inp.value.trim());
    if(midi != null) note.m = midi - t;
  });
  root.querySelectorAll('.jae-nd').forEach(sel => {
    const mi = +sel.dataset.mi, ni = +sel.dataset.ni;
    const note = (session.measures[mi]||{}).treble && session.measures[mi].treble[ni];
    if(!note) return;
    const d = +sel.value;
    note.d = d; note.t = JAE_DUR_TYPE[d]||'quarter';
  });
  root.querySelectorAll('.jae-rc').forEach(cb => {
    const mi = +cb.dataset.mi, ni = +cb.dataset.ni;
    const note = (session.measures[mi]||{}).treble && session.measures[mi].treble[ni];
    if(!note) return;
    note.r = cb.checked;
  });
}

function _jaeBindMeasures(root, session, key, schedPreview, doRerender){
  const G = JazzExerciseGenerator;
  root.querySelectorAll('.jae-np').forEach(inp => {
    inp.oninput = schedPreview; inp.onchange = schedPreview;
  });
  root.querySelectorAll('.jae-nd').forEach(sel => sel.onchange = schedPreview);
  root.querySelectorAll('.jae-chord').forEach(inp => inp.oninput = schedPreview);
  root.querySelectorAll('.jae-rc').forEach(cb => cb.onchange = () => {
    const mi = +cb.dataset.mi, ni = +cb.dataset.ni;
    const inp = root.querySelector(`.jae-np[data-mi="${mi}"][data-ni="${ni}"]`);
    if(inp){ inp.disabled = cb.checked; inp.style.opacity = cb.checked ? '.4' : ''; }
    schedPreview();
  });
  root.querySelectorAll('.jae-ndel').forEach(btn => btn.onclick = () => {
    _jaeReadForm(root, session, key);
    const mi = +btn.dataset.mi, ni = +btn.dataset.ni;
    if(session.measures[mi]) session.measures[mi].treble.splice(ni, 1);
    doRerender(); schedPreview();
  });
  root.querySelectorAll('.jae-mdel').forEach(btn => btn.onclick = () => {
    if(session.measures.length <= 1) return;
    _jaeReadForm(root, session, key);
    session.measures.splice(+btn.dataset.mi, 1);
    session.measures.forEach((m,i) => m.n = i+1);
    doRerender(); schedPreview();
  });
  root.querySelectorAll('.jae-nadd').forEach(btn => btn.onclick = () => {
    _jaeReadForm(root, session, key);
    const mi = +btn.dataset.mi;
    if(!session.measures[mi]) return;
    const last = session.measures[mi].treble.slice(-1)[0];
    const m = last && !last.r ? last.m : (60 - G.transpositionFromC(key));
    session.measures[mi].treble.push({m, d:4, t:'quarter', r:false, c:false});
    doRerender(); schedPreview();
  });
}

function bindJazzAmendEditor(overlay, id, key, afterSave){
  const root = overlay.querySelector('.jae-editor');
  if(!root || !_jaeSession) return;
  const session = _jaeSession;

  function schedPreview(){
    clearTimeout(_jaeTimer);
    _jaeTimer = setTimeout(() => {
      _jaeReadForm(root, session, key);
      const box = root.querySelector('#jaePreview');
      if(!box) return;
      try {
        const xml = jazzAmendToXml(session, key);
        jazzEngrave(box, xml);
      } catch(e){
        if(box) box.innerHTML = `<div class="jz-noscore" style="font-size:.8rem">Preview error: ${esc(e.message)}</div>`;
      }
    }, 500);
  }

  function doRerender(){
    const measDiv = root.querySelector('#jaeMeasures');
    if(measDiv) measDiv.innerHTML = session.measures.map((m,mi) => jaeMeasureHTML(m, mi, key)).join('');
    _jaeBindMeasures(root, session, key, schedPreview, doRerender);
  }

  _jaeBindMeasures(root, session, key, schedPreview, doRerender);

  const mAdd = root.querySelector('#jaeMAdd');
  if(mAdd) mAdd.onclick = () => {
    _jaeReadForm(root, session, key);
    const G = JazzExerciseGenerator;
    session.measures.push({n: session.measures.length+1, chord:null,
      treble:[{m:60 - G.transpositionFromC(key), d:4, t:'quarter', r:false, c:false}],
      bass: session.staff === 'grand' ? [] : null});
    doRerender(); schedPreview();
  };

  const save = root.querySelector('#jaeSave');
  if(save) save.onclick = () => {
    _jaeReadForm(root, session, key);
    session.src  = (root.querySelector('#jaeSrc')||{}).value || null;
    session.note = (root.querySelector('#jaeNote')||{}).value || null;
    const conf = root.querySelector('[name="jaeConf"]:checked');
    session.conf = conf ? conf.value : 'approximate';
    jazzSetAmend(id, session);
    overlay.remove(); _jaeSession = null;
    sound('success');
    toast('Amendment saved — applies in all twelve keys.');
    if(afterSave) afterSave();
  };

  const cancel = root.querySelector('#jaeCancel');
  if(cancel) cancel.onclick = () => { overlay.remove(); _jaeSession = null; };

  const clr = root.querySelector('#jaeClear');
  if(clr) clr.onclick = () => {
    jazzClearAmend(id);
    overlay.remove(); _jaeSession = null;
    sound('click');
    toast('Amendment removed. Back to the generated version.');
    if(afterSave) afterSave();
  };

  schedPreview();
}

/* ---------- open the editor ---------- */
function openJazzEditor(id, xmlOf, key, afterSave){
  const G = JazzExerciseGenerator;
  const ex = jazzExercise(id);
  const existing = jazzAmend(id);
  if(existing){
    _jaeSession = JSON.parse(JSON.stringify(existing));
  } else {
    const xml = xmlOf ? xmlOf() : null;
    if(xml && typeof xml === 'string'){
      _jaeSession = jazzMxlToAmend(xml, key, ex ? ex.name : id);
    }
    if(!_jaeSession){
      /* fallback: one empty bar */
      _jaeSession = {staff:'treble', title: ex ? ex.name : id, key,
        measures:[{n:1, chord:null,
          treble:[{m:60 - G.transpositionFromC(key), d:4, t:'quarter', r:false, c:false}],
          bass:null}],
        note:null, src:null, conf:'approximate'};
    }
  }
  const overlay = openModal(jaeEditorHTML(id, _jaeSession, key), 'jae-modal wide');
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
