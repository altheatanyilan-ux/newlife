/* ============================================================
   WALKING THROUGH THE PIECE.

   The room cannot play the score — there is no synthesiser in it and there is
   not going to be one. What it can do is move a marker through the notation
   at whatever pace you can follow, which turns out to be the more useful half
   of playback anyway: it is how you read a passage you cannot yet play, one
   chord at a time, with the chord symbols and the degrees switched on so you
   can see what each moment is made of.

   The specification reaches for the engraver's own cursor and drives it with
   setInterval. Neither part survives contact with this room. The engraver's
   cursor draws itself into whichever page it thinks is current and the room
   has already taken the pages apart to show one at a time; and setInterval
   drifts, which is the whole reason the metronome does not use it. So the
   marker is drawn from the same measure boxes everything else here is drawn
   from, and when the click is running the marker moves on the click — one
   clock for the room, not two that slowly disagree.
   ============================================================ */

/* The three sizes of step. A note is what you want when you are working out a
   chord; a bar is what you want when you are finding your place. */
const SCORE_CURSOR_MODES = [['beat', 'beat'], ['note', 'note'], ['measure', 'bar']];
const SCORE_CURSOR_SPEEDS = [0.5, 1, 2, 4];

let _scCur = null;            /* where the marker is, or null for put away */
let _scAuto = null;           /* the auto-advance timer, or the metronome's hold */

/* Every place the marker can stop, in order, for the whole of what is drawn.
   Not only the page on the glass: stepping off the end of a page should turn
   it, which it cannot do if it does not know what is over the leaf. */
function scoreCursorStops(mode){
  const notes = scoreNotes();
  const boxes = measureBoxes();
  const bars = [...new Set(boxes.map(b => b.measure))].sort((a, b) => a - b);
  if(!bars.length) return [];
  const t = scoreTimeSignature();
  const beats = t ? t.beats : 4;
  const step = 1 / (t ? t.unit : 4);
  const byBar = {};
  notes.forEach(n => (byBar[n.measure] = byBar[n.measure] || []).push(n));
  const topOf = bar => {
    const own = boxes.filter(b => b.measure === bar);
    return own.length ? own.reduce((a, b) => b.y < a.y ? b : a) : null;
  };
  const stops = [];
  bars.forEach(bar => {
    const box = topOf(bar);
    if(!box) return;
    const here = byBar[bar] || [];
    /* where in the bar to put the marker: on a note if one starts there, and
       otherwise across the bar in proportion, which is where the engraver
       would have put a note had there been one */
    const place = at => {
      const struck = here.filter(n => Math.abs(n.at - at) < 1e-6);
      if(struck.length) return {x: struck.reduce((a, n) => Math.min(a, n.x), Infinity),
        page: struck[0].page};
      const across = beats * step;
      return {x: box.x + box.w * (across ? at / across : 0), page: box.page};
    };
    if(mode === 'measure'){ const p = place(0); stops.push({measure:bar, at:0, ...p}); return; }
    if(mode === 'note'){
      const ats = [...new Set(here.map(n => Math.round(n.at * 48)))].sort((a, b) => a - b);
      (ats.length ? ats : [0]).forEach(k => { const at = k / 48; stops.push({measure:bar, at, ...place(at)}); });
      return;
    }
    for(let i = 0; i < beats; i++){ const at = i * step; stops.push({measure:bar, at, ...place(at)}); }
  });
  return stops;
}
/* Which stop the marker is on now — by bar and place in the bar rather than by
   a remembered index, because the list is rebuilt whenever the engraving is,
   and an index into the old list points at the wrong note in the new one. */
function scoreCursorIndex(stops){
  if(!_scCur) return -1;
  let best = -1, gap = Infinity;
  stops.forEach((s, i) => {
    const d = Math.abs(s.measure - _scCur.measure) * 100 + Math.abs(s.at - _scCur.at);
    if(d < gap){ gap = d; best = i; }
  });
  return best;
}
function scoreCursorAt(){ return _scCur; }
function scoreCursorOn(){ return !!_scCur; }
/* put it on the page, or take it off */
function scoreCursorShow(on, mode){
  if(!on){ _scCur = null; scoreCursorAuto(false); return null; }
  const stops = scoreCursorStops(mode || (_scCur && _scCur.mode) || 'beat');
  if(!stops.length) return null;
  _scCur = Object.assign({mode: mode || (_scCur && _scCur.mode) || 'beat'}, stops[0]);
  return _scCur;
}
/* one step. Returns false at either end, so the caller can say so rather than
   leaving you pressing an arrow that does nothing. */
function scoreCursorStep(by){
  if(!_scCur) return false;
  const stops = scoreCursorStops(_scCur.mode);
  if(!stops.length) return false;
  const at = scoreCursorIndex(stops);
  const next = clamp(at + by, 0, stops.length - 1);
  if(next === at && stops.length > 1 && (at === 0 || at === stops.length - 1)) return false;
  _scCur = Object.assign({mode: _scCur.mode}, stops[next]);
  return true;
}
/* the mode changes under the marker without losing the place */
function scoreCursorMode(mode){
  if(!_scCur){ return scoreCursorShow(true, mode); }
  const was = {measure:_scCur.measure, at:_scCur.at};
  _scCur.mode = mode;
  const stops = scoreCursorStops(mode);
  if(!stops.length) return _scCur;
  _scCur = Object.assign({mode}, stops[Math.max(0, stops.findIndex(s =>
    s.measure > was.measure || (s.measure === was.measure && s.at >= was.at - 1e-6)))]);
  return _scCur;
}
/* How it says where it is, for the readout. */
function scoreCursorSay(){
  if(!_scCur) return '';
  const t = scoreTimeSignature();
  const beat = Math.round(_scCur.at * (t ? t.unit : 4)) + 1;
  return _scCur.mode === 'measure' ? `bar ${_scCur.measure}` : `bar ${_scCur.measure} · ${beat}`;
}
