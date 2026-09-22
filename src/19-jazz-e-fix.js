/* ============================================================
   TAKE IT AWAY, FIX IT, BRING IT BACK.

   Ten of these exercises are marked as not reliable, and saying so is only
   half an answer. The other half is being able to do something about it:
   open the book, see that the fourth note of bar two is a D and not an E,
   and correct it — permanently, in your copy, without waiting for anybody.

   THREE WAYS OUT AND ONE WAY BACK. Every engraving can be downloaded as a
   MusicXML file and opened in MuseScore or anything else that reads the
   format. A corrected file can be brought back in. And what comes back is
   not stored as a replacement score.

   WHY NOT A REPLACEMENT. Because these exercises exist in twelve keys, and
   a corrected score is a correction in ONE key. Store the file and the other
   eleven keys stay wrong; store what CHANGED — the fourth note of bar two is
   a semitone lower than the generator thinks — and the correction follows
   the exercise into every key, because a semitone is a semitone wherever you
   start from.

   So a fix is {bar, note, delta}: which bar, which note in it, and how far
   the note moved. It is applied to the generated notation on its way to the
   engraver, and it survives transposition, reload and the generator being
   corrected underneath it.

   WHICH IS ALSO THE RISK, and it is worth writing down. If the generator is
   later fixed to produce the right note, your fix will still be applied on
   top and will now be wrong. That is why a fix is visible rather than
   silent: the score says it has been changed by you, and says how many notes
   were changed, and there is one button that puts it all back.
   ============================================================ */

/* ---------- which layout a correction was recorded against ----------
   A fix is "the fourth note of bar two", and which note that is depends on
   how the notes are laid out on the page. When the room grew a bass clef,
   a chord that straddles middle C stopped being four notes in a row and
   became some on one stave and some on the other — so the fourth note of
   bar two is not the note it was. Applying an old correction to the new
   layout would move the wrong note, silently, in a score whose whole point
   is that the notes are right.

   So a correction says which layout it was recorded against, and one from
   before the bass clef is not applied. It is not deleted either: the page
   says it is there and cannot be used, and there is a button to let it go. */
const JAZZ_FIX_LAYOUT = 2;      /* 1 = one treble stave; 2 = the grand staff */

/* ---------- what you have changed ---------- */
function jazzFixState(){
  const j = jazzState();
  j.fixes = j.fixes && typeof j.fixes === 'object' ? j.fixes : {};
  return j.fixes;
}
/** The fixes for one exercise, as a plain array. */
function jazzFixes(exId){
  const all = jazzFixState();
  const row = all[exId];
  if(!row || !Array.isArray(row.notes)) return [];
  return (row.layout || 1) === JAZZ_FIX_LAYOUT ? row.notes : [];
}
/* corrections that are stored and cannot be trusted against this layout */
function jazzFixStale(exId){
  const row = jazzFixState()[exId];
  return !!(row && Array.isArray(row.notes) && row.notes.length && (row.layout || 1) !== JAZZ_FIX_LAYOUT);
}
const jazzFixStaleCount = exId => jazzFixStale(exId) ? jazzFixState()[exId].notes.length : 0;
const jazzFixCount = exId => jazzFixes(exId).length;
const jazzFixedAt = exId => (jazzFixState()[exId] || {}).at || null;
/** Where it came from, for the sentence on the page. */
const jazzFixSource = exId => (jazzFixState()[exId] || {}).from || '';

function jazzSetFixes(exId, notes, from){
  const all = jazzFixState();
  if(!notes || !notes.length) delete all[exId];
  else all[exId] = {notes: notes.slice(), at: new Date().toISOString(), from: from || 'edited',
    layout: JAZZ_FIX_LAYOUT};
  saveNow();
  return jazzFixes(exId);
}
const jazzClearFixes = exId => jazzSetFixes(exId, []);

/* ---------- reading and writing pitches in a MusicXML document ---------- */
const JAZZ_STEP_PC = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
function jazzPitchMidi(pitchEl){
  if(!pitchEl) return null;
  const step = (pitchEl.querySelector('step') || {}).textContent;
  const oct = +((pitchEl.querySelector('octave') || {}).textContent);
  const alter = +((pitchEl.querySelector('alter') || {}).textContent || 0);
  if(!step || !isFinite(oct)) return null;
  return (oct + 1) * 12 + JAZZ_STEP_PC[step] + alter;
}
/* Spelled the way the key spells it, so a fix in G♭ does not come back as
   F♯ and make the accidentals disagree with the rest of the bar. */
function jazzWritePitch(pitchEl, midi, key){
  const G = typeof JazzExerciseGenerator !== 'undefined' ? JazzExerciseGenerator : null;
  const map = G && G.pitchMapForKey ? G.pitchMapForKey(key) : null;
  const pc = ((midi % 12) + 12) % 12;
  const spelling = map && map[pc] ? map[pc]
    : [{step:'C',alter:0},{step:'D',alter:-1},{step:'D',alter:0},{step:'E',alter:-1},
       {step:'E',alter:0},{step:'F',alter:0},{step:'G',alter:-1},{step:'G',alter:0},
       {step:'A',alter:-1},{step:'A',alter:0},{step:'B',alter:-1},{step:'B',alter:0}][pc];
  const doc = pitchEl.ownerDocument;
  const set = (tag, value) => {
    let el = pitchEl.querySelector(tag);
    if(value === null){ if(el) el.remove(); return; }
    if(!el){ el = doc.createElement(tag); pitchEl.appendChild(el); }
    el.textContent = String(value);
  };
  /* rebuilt in order, because <alter> has to sit between step and octave */
  while(pitchEl.firstChild) pitchEl.removeChild(pitchEl.firstChild);
  set('step', spelling.step);
  if(spelling.alter) set('alter', spelling.alter);
  set('octave', Math.floor(midi / 12) - 1);
}
/** Every sounding note of a document, bar by bar. Rests are skipped, so a
    note's index is its index among the notes you can actually hear. */
function jazzReadNotes(doc){
  return [...doc.querySelectorAll('measure')].map(bar =>
    [...bar.querySelectorAll('note')].filter(n => !n.querySelector('rest')));
}

/* ---------- applying what you changed ---------- */
function jazzApplyFixes(xml, exId, key){
  const fixes = jazzFixes(exId);
  if(!xml || !fixes.length) return xml;
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if(doc.querySelector('parsererror')) return xml;
    const bars = jazzReadNotes(doc);
    fixes.forEach(f => {
      const note = (bars[f.bar] || [])[f.i];
      if(!note) return;
      if(f.d){
        const pitch = note.querySelector('pitch');
        const was = jazzPitchMidi(pitch);
        if(was != null) jazzWritePitch(pitch, was + f.d, key);
      }
      if(f.dur){
        const d = note.querySelector('duration'), t = note.querySelector('type');
        if(d) d.textContent = String(f.dur);
        if(t && f.type) t.textContent = f.type;
      }
    });
    return new XMLSerializer().serializeToString(doc);
  } catch(e){ console.warn('a correction could not be applied', e); return xml; }
}

/* ---------- taking it away ---------- */
function jazzDownloadXML(xml, exerciseName, key){
  const name = `${exerciseName || 'exercise'}_${key || 'C'}.musicxml`
    .replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
  const blob = new Blob([xml], {type: 'application/vnd.recordare.musicxml+xml'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  /* revoked late: Safari has been known to cancel the download if the URL
     goes away in the same tick as the click */
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return name;
}

/* ---------- and bringing it back ----------
   What comes back is compared against what this copy would have generated
   for the same exercise in the same key, and only the DIFFERENCES are kept.
   A file that matches is not a correction and is not stored as one. */
function jazzDiffXML(mineXml, theirsXml){
  const parse = x => { const d = new DOMParser().parseFromString(x, 'application/xml');
    return d.querySelector('parsererror') ? null : d; };
  const a = parse(mineXml), b = parse(theirsXml);
  if(!a || !b) return {error: 'That file could not be read as MusicXML.'};
  const mine = jazzReadNotes(a), theirs = jazzReadNotes(b);
  if(theirs.length !== mine.length)
    return {error: `That file has ${theirs.length} bars and this exercise has ${mine.length}. It is a different piece of music.`};
  const out = [];
  let looked = 0;
  for(let bar = 0; bar < mine.length; bar++){
    if((theirs[bar] || []).length !== mine[bar].length)
      return {error: `Bar ${bar + 1} has ${(theirs[bar] || []).length} notes in that file and ${mine[bar].length} here. Notes can be corrected but not added or taken away.`};
    for(let i = 0; i < mine[bar].length; i++){
      looked++;
      const was = jazzPitchMidi(mine[bar][i].querySelector('pitch'));
      const now = jazzPitchMidi(theirs[bar][i].querySelector('pitch'));
      const fix = {bar, i};
      let any = false;
      if(was != null && now != null && now !== was){ fix.d = now - was; any = true; }
      const wasDur = +((mine[bar][i].querySelector('duration') || {}).textContent || 0);
      const nowDur = +((theirs[bar][i].querySelector('duration') || {}).textContent || 0);
      if(nowDur && nowDur !== wasDur){
        fix.dur = nowDur;
        fix.type = ((theirs[bar][i].querySelector('type') || {}).textContent || '').trim();
        any = true;
      }
      if(any) out.push(fix);
    }
  }
  return {fixes: out, looked};
}
