/* ============================================================
   THE EDITOR, ON SCREEN.

   A toolbar, a score, and the keyboard. Nothing else: no cards,
   no per-note text fields, no panels. You click a note and it
   turns blue, and then the keys do things to it.

   THE ONE OSMD INSTANCE lives in _jzeOsmd for as long as the
   editor is open. Every edit calls jzeDraw(), which loads new
   MusicXML into that same instance and renders it. The preview
   container is never appended to and no second instance is ever
   made — that is the whole of the fix for the stacking bug.

   CLICKING A NOTE. OSMD's own cursor is a playback cursor and is
   too coarse to hit-test with, so after each render the graphical
   model is walked for the screen position of every notehead and
   an invisible button is laid over each one. The overlay is
   rebuilt with the render, so it can never drift from what is
   drawn.
   ============================================================ */

let _jzeOsmd = null;      /* ONE instance, for the life of the editor */
let _jze = null;          /* the open session */

/* ---------- the session ---------- */
function jzeSession(id, key){
  const ex = jazzExercise(id);
  const saved = jazzEdited(id);
  const score = saved ? JSON.parse(JSON.stringify(saved))
    : jazzXmlToScore(jazzScoreXml(ex, key, {interval: jazzUi().interval}), id, key);
  return {
    id, key, ex, score,
    mode: 'normal',                 /* 'normal' | 'input' */
    staff: score.staffConfig === 'bass' ? 'bass' : 'treble',
    dur: 3,                         /* the toolbar's chosen length, 1-5 */
    sel: {mi: 0, staff: score.staffConfig === 'bass' ? 'bass' : 'treble', ni: 0},
    /* the note a Shift+letter would stack onto: the one last entered, or
       last clicked. Not the cursor, which has moved past it by then. */
    lastEntry: null,
    undo: [], redo: [], dirty: false
  };
}
const jzeNotes = (s, mi, staff) => {
  const m = s.score.measures[mi];
  if(!m) return [];
  const cfg = s.score.staffConfig;
  if(cfg === 'treble') return m.treble;
  if(cfg === 'bass') return m.bass;
  return staff === 'bass' ? m.bass : m.treble;
};
const jzeSelNotes = s => jzeNotes(s, s.sel.mi, s.sel.staff);
const jzeSelNote = s => jzeSelNotes(s)[s.sel.ni] || null;

function jzeSnap(s){
  s.undo.push(JSON.stringify(s.score));
  if(s.undo.length > 60) s.undo.shift();
  s.redo.length = 0;
  s.dirty = true;
}
function jzeUndo(s){
  if(!s.undo.length) return false;
  s.redo.push(JSON.stringify(s.score));
  s.score = JSON.parse(s.undo.pop());
  return true;
}
function jzeRedo(s){
  if(!s.redo.length) return false;
  s.undo.push(JSON.stringify(s.score));
  s.score = JSON.parse(s.redo.pop());
  return true;
}

/* ---------- moving about ---------- */
function jzeStep(s, by){
  const notes = jzeSelNotes(s);
  let ni = s.sel.ni + by;
  if(ni >= 0 && ni < notes.length){ s.sel.ni = ni; return; }
  const mi = s.sel.mi + (by > 0 ? 1 : -1);
  if(mi < 0 || mi >= s.score.measures.length) return;
  s.sel.mi = mi;
  const next = jzeNotes(s, mi, s.sel.staff);
  s.sel.ni = by > 0 ? 0 : Math.max(0, next.length - 1);
}
function jzeSwitchStaff(s){
  if(s.score.staffConfig !== 'grand') return;
  s.staff = s.staff === 'treble' ? 'bass' : 'treble';
  s.sel.staff = s.staff;
  s.sel.ni = Math.min(s.sel.ni, Math.max(0, jzeSelNotes(s).length - 1));
}

/* A letter names a pitch class; the octave chosen is the one that puts it
   nearest the note being replaced, which is what MuseScore does. */
const JZE_LETTER_PC = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
/* The lowest note of this name strictly above a given pitch — how a chord
   is spelled upward from its root. */
function jzeAboveMidi(letter, above){
  const pc = JZE_LETTER_PC[letter.toUpperCase()];
  if(pc == null) return null;
  let m = Math.floor(above / 12) * 12 + pc;
  while(m <= above) m += 12;
  return m > 108 ? jzeNearestMidi(letter, above) : m;
}
function jzeNearestMidi(letter, near){
  const pc = JZE_LETTER_PC[letter.toUpperCase()];
  if(pc == null) return null;
  const base = (near == null ? 60 : near);
  let best = null, bestD = 1e9;
  for(let oct = -1; oct <= 9; oct++){
    const m = (oct + 1) * 12 + pc;
    const d = Math.abs(m - base);
    if(d < bestD){ bestD = d; best = m; }
  }
  return best;
}

/* ---------- editing ---------- */
function jzeSetPitch(s, delta){
  const n = jzeSelNote(s);
  if(!n || n.isRest) return false;
  jzeSnap(s);
  n.pitch = Math.max(12, Math.min(108, n.pitch + delta));
  return true;
}
function jzeReplacePitch(s, letter){
  const n = jzeSelNote(s);
  if(!n) return false;
  const midi = jzeNearestMidi(letter, n.isRest ? 60 : n.pitch);
  if(midi == null) return false;
  jzeSnap(s);
  n.pitch = midi; n.isRest = false;
  return true;
}
/* The whole chord a note belongs to: its base and every note stacked on it.
   Length and dot belong to the chord rather than to one of its notes, and a
   base note cannot become a rest while notes are still stacked on it. */
function jzeGroupOf(notes, ni){
  let start = ni;
  while(start > 0 && notes[start].isChord) start--;
  return {start, end: jzeChordEnd(notes, start)};
}
function jzeSetDuration(s, dn){
  const notes = jzeSelNotes(s);
  const n = notes[s.sel.ni];
  if(!n) return false;
  jzeSnap(s);
  const d = jzeDurByN(dn);
  const g = jzeGroupOf(notes, s.sel.ni);
  for(let i = g.start; i < g.end; i++){
    notes[i].type = d.type;
    notes[i].duration = d.units + (notes[i].dotted ? Math.floor(d.units / 2) : 0);
  }
  return true;
}
function jzeToRest(s){
  const notes = jzeSelNotes(s);
  const n = notes[s.sel.ni];
  if(!n || n.isRest) return false;
  jzeSnap(s);
  if(n.isChord){
    /* one voice out of a chord: take the note away, leave the chord standing */
    notes.splice(s.sel.ni, 1);
    s.sel.ni = Math.max(0, s.sel.ni - 1);
    return true;
  }
  /* the base: the notes stacked on it go with it, or they would be left
     describing a chord on a rest, which is not a thing MusicXML can say */
  const g = jzeGroupOf(notes, s.sel.ni);
  notes.splice(g.start, g.end - g.start, {pitch:null, duration:n.duration,
    type:n.type, isRest:true, isChord:false, dotted:!!n.dotted, tied:false});
  s.sel.ni = g.start;
  if(s.lastEntry && s.lastEntry.mi === s.sel.mi && s.lastEntry.staff === s.sel.staff)
    s.lastEntry = null;
  return true;
}
function jzeToggleDot(s){
  const notes = jzeSelNotes(s);
  const n = notes[s.sel.ni];
  if(!n) return false;
  jzeSnap(s);
  const g = jzeGroupOf(notes, s.sel.ni);
  const on = !n.dotted;
  for(let i = g.start; i < g.end; i++){
    const base = jzeDurByType(notes[i].type).units;
    notes[i].dotted = on;
    notes[i].duration = on ? base + Math.floor(base / 2) : base;
  }
  return true;
}
function jzeToggleTie(s){
  const n = jzeSelNote(s);
  if(!n || n.isRest) return false;
  jzeSnap(s); n.tied = !n.tied; return true;
}
function jzeAccidental(s, by){
  const n = jzeSelNote(s);
  if(!n || n.isRest) return false;
  jzeSnap(s); n.pitch = Math.max(12, Math.min(108, n.pitch + by)); return true;
}
/* Note Input mode: a pitch is PLACED at the cursor and the cursor moves on. */
/* Where a chord group ends: the base note at ni, plus every note stacked on
   it. A new member is inserted here so the group stays contiguous, which is
   what <chord/> means — each chord note belongs to the note before it. */
function jzeChordEnd(notes, ni){
  let i = ni + 1;
  while(i < notes.length && notes[i].isChord) i++;
  return i;
}
/* Adding a note to a chord.

   This is the one MuseScore behaviour that is easy to get wrong, and the
   first version did. Entering a pitch advances the cursor past it, so by the
   time you press Shift+letter the cursor is on the NEXT slot — usually the
   rest that was just pushed along. Stacking onto the cursor therefore stacked
   onto nothing and silently placed an ordinary note instead.

   So a chord is added to the note last entered (or last clicked), not to
   wherever the cursor has since moved, and the cursor does not move again. A
   chord member also takes the base note's length rather than the toolbar's:
   in MusicXML a <chord/> note must have the same duration as the note it sits
   on, or the bar no longer adds up. */
function jzeStack(s, letter){
  const at = s.lastEntry;
  if(!at) return false;
  const notes = jzeNotes(s, at.mi, at.staff);
  const base = notes[at.ni];
  if(!base || base.isRest) return false;
  const end = jzeChordEnd(notes, at.ni);
  /* A chord is built upward. Picking the nearest octave the way note entry
     does would put the G of a C major triad BELOW the root, because G3 is
     nearer to C4 than G4 is — so you would type C, E, G and get a second
     inversion. Each new voice goes above the top of the chord so far. */
  let top = base.pitch;
  for(let i = at.ni; i < end; i++) if(notes[i].pitch > top) top = notes[i].pitch;
  const midi = jzeAboveMidi(letter, top);
  if(midi == null) return false;
  /* a pitch already in the chord is not added twice */
  for(let i = at.ni; i < end; i++) if(notes[i].pitch === midi) return false;
  jzeSnap(s);
  notes.splice(end, 0, {pitch: midi, duration: base.duration, type: base.type,
    isRest: false, isChord: true, dotted: !!base.dotted, tied: false});
  /* the selection follows the note you just added, so the footer names it */
  s.sel.mi = at.mi; s.sel.staff = at.staff; s.sel.ni = end;
  if(s.score.staffConfig === 'grand') s.staff = at.staff;
  return true;
}
function jzePlace(s, letter, asChord){
  if(asChord && letter !== null) return jzeStack(s, letter);
  const notes = jzeSelNotes(s);
  const d = jzeDurByN(s.dur);
  const near = (() => { for(let i = notes.length - 1; i >= 0; i--)
    if(!notes[i].isRest) return notes[i].pitch; return 60; })();
  const midi = letter === null ? null : jzeNearestMidi(letter, near);
  if(letter !== null && midi == null) return false;
  jzeSnap(s);
  const note = {pitch: midi, duration: d.units, type: d.type,
    isRest: letter === null, isChord: false, dotted: false, tied: false};
  const at = notes[s.sel.ni];
  /* an untouched whole-bar rest is replaced rather than pushed along */
  if(at && at.isRest && notes.length === 1) notes.splice(0, 1, note);
  else if(at) notes.splice(s.sel.ni, 1, note);
  else notes.push(note);
  /* what a following Shift+letter will stack onto */
  s.lastEntry = note.isRest ? null : {mi: s.sel.mi, staff: s.sel.staff, ni: s.sel.ni};
  const after = jzeChordEnd(notes, s.sel.ni);
  if(after < notes.length) s.sel.ni = after;
  else if(s.sel.mi + 1 < s.score.measures.length){ s.sel.mi += 1; s.sel.ni = 0; }
  else { notes.push({pitch:null, duration:d.units, type:d.type, isRest:true,
    isChord:false, dotted:false, tied:false}); s.sel.ni = after; }
  return true;
}
function jzeAddMeasure(s){
  jzeSnap(s);
  s.score.measures.splice(s.sel.mi + 1, 0, jzeBlankMeasure(s.score));
  s.sel.mi += 1; s.sel.ni = 0;
  return true;
}
function jzeDropMeasure(s){
  if(s.score.measures.length <= 1) return false;
  jzeSnap(s);
  s.score.measures.splice(s.sel.mi, 1);
  s.sel.mi = Math.max(0, s.sel.mi - 1); s.sel.ni = 0;
  return true;
}

/* ---------- the toolbar ---------- */
function jzeToolbarHTML(s){
  const grand = s.score.staffConfig === 'grand';
  return `<div class="jze-bar">
    <div class="jze-grp">
      <span class="jze-lbl">Mode</span>
      <button class="jze-b${s.mode === 'normal' ? ' on' : ''}" data-jze="mode-normal">Normal</button>
      <button class="jze-b${s.mode === 'input' ? ' on' : ''}" data-jze="mode-input">Note Input <i>N</i></button>
    </div>
    <div class="jze-grp">
      <span class="jze-lbl">Staff</span>
      ${[['grand','\u{1f3bc} Grand'],['treble','\u{1f3b9} Treble'],['bass','\u{1f3b9} Bass']].map(([v, t]) =>
        `<button class="jze-b${s.score.staffConfig === v ? ' on' : ''}" data-jze="staff-${v}">${t}</button>`).join('')}
    </div>
    ${grand ? `<div class="jze-grp">
      <span class="jze-lbl">Active</span>
      <button class="jze-b${s.staff === 'treble' ? ' on' : ''}" data-jze="act-treble">Treble</button>
      <button class="jze-b${s.staff === 'bass' ? ' on' : ''}" data-jze="act-bass">Bass</button>
    </div>` : ''}
    <div class="jze-grp">
      <span class="jze-lbl">Duration</span>
      ${JZE_DURS.map(d => `<button class="jze-b jze-dur${s.dur === d.n ? ' on' : ''}"
        data-jze="dur-${d.n}" title="${d.type}">${d.glyph}<i>${d.n}</i></button>`).join('')}
      <button class="jze-b" data-jze="dot" title="dotted">. Dot</button>
      <button class="jze-b" data-jze="rest" title="rest">Rest <i>0</i></button>
    </div>
    <div class="jze-grp">
      <button class="jze-b" data-jze="sharp" title="raise a semitone">♯</button>
      <button class="jze-b" data-jze="flat" title="lower a semitone">♭</button>
      <button class="jze-b" data-jze="tie" title="tie">Tie <i>T</i></button>
    </div>
    <div class="jze-grp">
      <button class="jze-b" data-jze="addbar">+ Measure</button>
      <button class="jze-b" data-jze="delbar">− Measure</button>
    </div>
    <div class="jze-grp jze-end">
      <button class="jze-b" data-jze="undo" title="Ctrl+Z">↶ Undo</button>
      <button class="jze-b" data-jze="redo" title="Ctrl+Shift+Z">↷ Redo</button>
      <button class="jze-b primary" data-jze="save" title="Ctrl+S">Save</button>
      <button class="jze-b" data-jze="cancel">Cancel</button>
    </div>
  </div>`;
}
const JZE_TIP = {
  normal:'Click a note — it turns blue, and the keys then act on it. ↑↓ move it by a semitone, Ctrl+↑↓ by an octave, A–G replace it, 1–5 change its length, Delete makes it a rest. ←→ walk through the notes.',
  input:'Choose a length, then type A–G to place a note. The cursor moves on by itself. Shift+letter stacks a chord, 0 puts in a rest. N or Escape to come back out.'
};
function jzeEditorHTML(s){
  return `<div class="jze-modal" role="dialog" aria-label="Score editor">
    <div class="jze-panel">
      <div class="jze-head">
        <b class="serif">${esc(s.ex ? s.ex.name : s.id)}</b>
        <span class="mono faint">editing in ${esc(jazzPretty(s.key))} · every key follows</span>
      </div>
      ${jzeToolbarHTML(s)}
      <div class="jze-tip mono" id="jzeTip">${esc(JZE_TIP[s.mode])}</div>
      <div class="jze-stage">
        <div class="jze-preview" id="jzePreview"></div>
        <div class="jze-overlay" id="jzeOverlay"></div>
      </div>
      <div class="jze-foot mono" id="jzeFoot"></div>
    </div>
  </div>`;
}

/* ---------- drawing ----------
   One instance, loaded and re-rendered. Never appended to. */
async function jzeDraw(root){
  const s = _jze;
  if(!s) return;
  const box = root.querySelector('#jzePreview');
  if(!box) return;
  let xml;
  try { xml = jazzScoreToXml(s.score, s.key); }
  catch(e){ box.innerHTML = `<div class="jz-noscore">That could not be written out — ${esc(e.message)}</div>`; return; }
  try {
    if(!_jzeOsmd){
      if(!osmdBuiltIn()){
        box.innerHTML = '<div class="jz-noscore">The engraver is not built into this copy, so the score cannot be drawn.</div>';
        return;
      }
      const lib = await osmdBoot();
      _jzeOsmd = new lib.OpenSheetMusicDisplay(box, {autoResize:false, backend:'svg',
        drawTitle:false, drawComposer:false, drawCredits:false, drawPartNames:false,
        drawMeasureNumbers:true, drawingParameters:'compact'});
      const rules = _jzeOsmd.EngravingRules || _jzeOsmd.rules;
      if(rules){ rules.RenderChordSymbols = true;
        try { rules.FillEmptyMeasuresWithWholeRest = 2; } catch(e){} }
    }
    await _jzeOsmd.load(xml);
    _jzeOsmd.zoom = 1.0;
    _jzeOsmd.render();
  } catch(e){
    console.warn('the editor could not draw that', e);
    box.innerHTML = `<div class="jz-noscore">That could not be drawn — ${esc(e.message)}</div>`;
    return;
  }
  jzeOverlay(root);
  jzeFoot(root);
}
/* Walk OSMD's graphical model for where each notehead landed, and lay an
   invisible button over each. Rebuilt on every render, so it cannot drift. */
function jzeOverlay(root){
  const s = _jze, ov = root.querySelector('#jzeOverlay'), box = root.querySelector('#jzePreview');
  if(!s || !ov || !box) return;
  jzeUnpaint();
  ov.innerHTML = '';
  let hits = [];
  try { hits = jzeHitTargets(box); } catch(e){ hits = []; }
  const boxRect = box.getBoundingClientRect();
  /* Each graphical measure counts its own notes from zero, per staff, and so
     does the model — so h.ni indexes straight into the right array. Using a
     counter that ran across the whole piece instead was why every bar after
     the first had no clickable notes. */
  const cfg = s.score.staffConfig;
  for(const h of hits){
    const staff = cfg === 'grand' ? (h.staff === 1 ? 'bass' : 'treble') : cfg;
    const mi = h.measure;
    const arr = jzeNotes(s, mi, staff);
    if(!arr || h.ni >= arr.length) continue;
    const chosen = s.sel.mi === mi && s.sel.staff === staff && s.sel.ni === h.ni;
    const b = document.createElement('button');
    b.className = 'jze-hit' + (chosen ? ' sel' : '');
    b.style.left = (h.x - boxRect.left - 10) + 'px';
    b.style.top  = (h.y - boxRect.top - 10) + 'px';
    b.dataset.jzemi = mi; b.dataset.jzeni = h.ni; b.dataset.jzestaff = staff;
    b.title = `bar ${mi + 1}, note ${h.ni + 1}`;
    ov.appendChild(b);
    /* The selected note turns blue — the note itself, not a marker floating
       over it. Without this the editor looks broken: the keys were changing
       the right note all along, but nothing on the page said which one was
       selected, so there was no way to tell it had worked. */
    if(chosen) jzePaint(h.gn, JZE_BLUE);
  }
}
const JZE_BLUE = '#2f6fed';
/* What has been painted blue, and what it looked like before. The selection
   often moves without the score being re-drawn — walking with the arrow keys
   changes nothing about the music — so the previous note has to be put back
   by hand. Left to itself the blue accumulated until half the score was
   highlighted. */
let _jzePainted = [];
function jzeUnpaint(){
  for(const {el, fill, stroke} of _jzePainted){
    try {
      if(fill === null) el.removeAttribute('fill'); else el.setAttribute('fill', fill);
      if(stroke === null) el.removeAttribute('stroke'); else el.setAttribute('stroke', stroke);
    } catch(e){}
  }
  _jzePainted = [];
}
function jzePaint(gn, colour){
  if(!gn) return;
  try {
    let els = typeof gn.getNoteheadSVGs === 'function' ? gn.getNoteheadSVGs() : null;
    if(!els || !els.length){
      const g = typeof gn.getSVGGElement === 'function' ? gn.getSVGGElement() : null;
      els = g ? [...g.querySelectorAll('path')] : [];
    }
    for(const el of els){
      if(!el || !el.setAttribute) continue;
      _jzePainted.push({el, fill: el.getAttribute('fill'), stroke: el.getAttribute('stroke')});
      el.setAttribute('fill', colour);
      el.setAttribute('stroke', colour);
    }
  } catch(e){ /* the engraver's shape is its own; a missed highlight is not fatal */ }
}
/* The positions, read out of OSMD's graphic sheet. Kept in one place and
   wrapped, because it is the part most likely to change under us. */
function jzeHitTargets(box){
  const out = [];
  const o = _jzeOsmd;
  if(!o || !o.GraphicSheet || !o.GraphicSheet.MeasureList) return out;
  const svg = box.querySelector('svg');
  if(!svg) return out;
  const svgRect = svg.getBoundingClientRect();
  const unit = 10 * (o.zoom || 1);   /* OSMD works in units of 10px at zoom 1 */
  o.GraphicSheet.MeasureList.forEach(sysMeasures => {
    (sysMeasures || []).forEach(gm => {
      if(!gm || !gm.staffEntries) return;
      const measureIdx = gm.MeasureNumber ? gm.MeasureNumber - 1 : 0;
      const staffIdx = (gm.ParentStaff && gm.ParentStaff.idInMusicSheet) || 0;
      let ni = 0;
      gm.staffEntries.forEach(se => {
        const gves = se.graphicalVoiceEntries || [];
        gves.forEach(gve => {
          (gve.notes || []).forEach(gn => {
            const bb = gn.PositionAndShape;
            if(!bb) return;
            const ax = bb.AbsolutePosition ? bb.AbsolutePosition.x : null;
            const ay = bb.AbsolutePosition ? bb.AbsolutePosition.y : null;
            if(ax == null || ay == null) return;
            out.push({measure: measureIdx, staff: staffIdx, ni: ni++,
              x: svgRect.left + ax * unit, y: svgRect.top + ay * unit, gn});
          });
        });
      });
    });
  });
  return out;
}
function jzeFoot(root){
  const s = _jze, f = root.querySelector('#jzeFoot');
  if(!s || !f) return;
  const n = jzeSelNote(s);
  const where = `bar ${s.sel.mi + 1} of ${s.score.measures.length} · ${
    s.score.staffConfig === 'grand' ? s.sel.staff + ' staff · ' : ''}note ${s.sel.ni + 1}`;
  const what = !n ? 'nothing selected'
    : n.isRest ? `rest, ${n.type}${n.dotted ? ' dotted' : ''}`
    : `${jazzNoteLetter(n.pitch)} · ${n.type}${n.dotted ? ' dotted' : ''}${n.tied ? ' · tied' : ''}`;
  f.textContent = `${where} — ${what}${s.dirty ? ' · unsaved' : ''}`;
}
const JZE_PC_NAME = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const jazzNoteLetter = midi =>
  midi == null ? '—' : JZE_PC_NAME[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);

/* ---------- opening it ---------- */
function openJazzScoreEditor(id, key, afterSave){
  const ex = jazzExercise(id);
  if(!ex){ toast('There is no exercise to edit.'); return; }
  if(!jazzHasScore(ex)){ toast('This one has no notation to edit.'); return; }
  _jze = jzeSession(id, key);
  _jzeOsmd = null;
  const overlay = document.createElement('div');
  overlay.innerHTML = jzeEditorHTML(_jze);
  document.body.appendChild(overlay);
  bindJazzScoreEditor(overlay, afterSave);
  jzeDraw(overlay);
}
function jzeClose(overlay){
  _jze = null; _jzeOsmd = null;
  if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
}

function bindJazzScoreEditor(overlay, afterSave){
  const redrawChrome = () => {
    const bar = overlay.querySelector('.jze-bar');
    if(bar) bar.outerHTML = jzeToolbarHTML(_jze);
    const tip = overlay.querySelector('#jzeTip');
    if(tip) tip.textContent = JZE_TIP[_jze.mode];
    bindButtons();
  };
  const after = (changed) => { if(changed) jzeDraw(overlay); else { jzeOverlay(overlay); jzeFoot(overlay); } };

  const act = (what) => {
    const s = _jze;
    switch(what){
      case 'mode-normal': s.mode = 'normal'; redrawChrome(); after(false); return;
      case 'mode-input':  s.mode = 'input';  redrawChrome(); after(false); return;
      case 'staff-grand': case 'staff-treble': case 'staff-bass': {
        jzeSnap(s);
        s.score.staffConfig = what.slice(6);
        if(s.score.staffConfig !== 'grand') s.staff = s.score.staffConfig;
        s.sel.staff = s.score.staffConfig === 'grand' ? s.staff : s.score.staffConfig;
        s.sel.ni = 0;
        redrawChrome(); after(true); return;
      }
      case 'act-treble': s.staff = 'treble'; s.sel.staff = 'treble'; s.sel.ni = 0; redrawChrome(); after(false); return;
      case 'act-bass':   s.staff = 'bass';   s.sel.staff = 'bass';   s.sel.ni = 0; redrawChrome(); after(false); return;
      case 'dot':   after(jzeToggleDot(s)); return;
      case 'tie':   after(jzeToggleTie(s)); return;
      case 'sharp': after(jzeAccidental(s, 1)); return;
      case 'flat':  after(jzeAccidental(s, -1)); return;
      case 'rest':  after(s.mode === 'input' ? jzePlace(s, null, false) : jzeToRest(s)); return;
      case 'addbar': after(jzeAddMeasure(s)); return;
      case 'delbar': after(jzeDropMeasure(s)); return;
      case 'undo': after(jzeUndo(s)); return;
      case 'redo': after(jzeRedo(s)); return;
      case 'save': {
        s.score.editedInKey = s.key;
        jazzSetEdited(s.id, s.score);
        sound('success'); toast('Saved. It will be drawn from your version in every key.');
        jzeClose(overlay); if(afterSave) afterSave(); return;
      }
      case 'cancel': {
        if(s.dirty && !confirm('Close the editor and lose the changes you have made?')) return;
        jzeClose(overlay); return;
      }
    }
    if(/^dur-/.test(what)){
      s.dur = +what.slice(4);
      if(s.mode === 'normal'){ redrawChrome(); after(jzeSetDuration(s, s.dur)); }
      else { redrawChrome(); after(false); }
    }
  };

  function bindButtons(){
    $$('[data-jze]', overlay).forEach(b => b.onclick = () => act(b.dataset.jze));
  }
  bindButtons();

  /* clicking a notehead selects it (Normal) or moves the cursor there */
  overlay.addEventListener('click', ev => {
    const hit = ev.target.closest('[data-jzemi]');
    if(!hit) return;
    const s = _jze;
    s.sel.mi = +hit.dataset.jzemi;
    s.sel.staff = hit.dataset.jzestaff;
    s.sel.ni = +hit.dataset.jzeni;
    if(s.score.staffConfig === 'grand') s.staff = s.sel.staff;
    /* clicking a note also makes it the one a chord would be added to, so
       Shift+letter works on a note you picked rather than only on one you
       have just typed. A chord member stacks onto its own base. */
    const picked = jzeSelNote(s);
    if(picked && !picked.isRest){
      let base = s.sel.ni;
      const arr = jzeSelNotes(s);
      while(base > 0 && arr[base].isChord) base--;
      s.lastEntry = {mi: s.sel.mi, staff: s.sel.staff, ni: base};
    } else s.lastEntry = null;
    redrawChrome();
    jzeOverlay(overlay); jzeFoot(overlay);
  });

  const onKey = ev => {
    if(!_jze) return;
    const s = _jze;
    const k = ev.key;
    const tag = (ev.target && ev.target.tagName) || '';
    if(tag === 'INPUT' || tag === 'TEXTAREA') return;
    const mod = ev.ctrlKey || ev.metaKey;

    if(mod && (k === 'z' || k === 'Z')){ ev.preventDefault();
      after(ev.shiftKey ? jzeRedo(s) : jzeUndo(s)); return; }
    if(mod && (k === 's' || k === 'S')){ ev.preventDefault(); act('save'); return; }
    if(k === 'Escape'){ ev.preventDefault();
      if(s.mode === 'input'){ s.mode = 'normal'; redrawChrome(); after(false); }
      else act('cancel');
      return; }
    if(k === 'n' || k === 'N'){ ev.preventDefault();
      s.mode = s.mode === 'input' ? 'normal' : 'input'; redrawChrome(); after(false); return; }

    if(ev.altKey && (k === 'ArrowUp' || k === 'ArrowDown')){
      ev.preventDefault(); jzeSwitchStaff(s); redrawChrome(); after(false); return; }

    if(/^[1-5]$/.test(k)){ ev.preventDefault();
      s.dur = +k;
      if(s.mode === 'normal'){ redrawChrome(); after(jzeSetDuration(s, s.dur)); }
      else { redrawChrome(); after(false); }
      return; }
    if(k === '0'){ ev.preventDefault();
      after(s.mode === 'input' ? jzePlace(s, null, false) : jzeToRest(s)); return; }
    if(k === '.'){ ev.preventDefault(); after(jzeToggleDot(s)); return; }
    if(k === 't' || k === 'T'){ ev.preventDefault(); after(jzeToggleTie(s)); return; }
    if(k === '#'){ ev.preventDefault(); after(jzeAccidental(s, 1)); return; }

    if(/^[a-gA-G]$/.test(k)){
      /* "b" is both a note name and the flat key. The note name wins, because
         typing a pitch is the commoner action by far; the toolbar's ♭ button
         is there for the accidental. */
      ev.preventDefault();
      if(s.mode === 'input') after(jzePlace(s, k, ev.shiftKey));
      else after(jzeReplacePitch(s, k));
      return;
    }
    if(s.mode === 'normal'){
      if(k === 'ArrowUp'){ ev.preventDefault(); after(jzeSetPitch(s, mod ? 12 : 1)); return; }
      if(k === 'ArrowDown'){ ev.preventDefault(); after(jzeSetPitch(s, mod ? -12 : -1)); return; }
      if(k === 'ArrowLeft'){ ev.preventDefault(); jzeStep(s, -1); after(false); return; }
      if(k === 'ArrowRight'){ ev.preventDefault(); jzeStep(s, 1); after(false); return; }
      if(k === 'Delete' || k === 'Backspace'){ ev.preventDefault(); after(jzeToRest(s)); return; }
    }
  };
  document.addEventListener('keydown', onKey);
  /* The listener belongs to the editor and has to die with it, or the next
     page you visit will still be interpreting A-G as note entry. */
  const obs = new MutationObserver(() => {
    if(!document.body.contains(overlay)){
      document.removeEventListener('keydown', onKey); obs.disconnect();
    }
  });
  obs.observe(document.body, {childList: true});
}
