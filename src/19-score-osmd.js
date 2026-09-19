/* ============================================================
   THE ENGRAVER — OpenSheetMusicDisplay, held at arm's length.

   A megabyte of somebody else's code renders the notation. It is not in the
   script the app lives in: build.js writes it to the end of the document as a
   payload the browser stores and does not parse, and it is compiled here the
   first time somebody opens a score. Most days nobody does, and those days
   cost nothing.

   Everything the room says to the library goes through this file, so there is
   one place that knows the difference between what OSMD calls a thing and what
   this house calls it — and one place to repair if it is ever swapped out.
   ============================================================ */

let _osmdReady = null;
/* Compile the payload, once. The promise is kept rather than the result so
   that two rooms opening at the same moment wait on one compile instead of
   racing to do it twice. */
function osmdBoot(){
  if(_osmdReady) return _osmdReady;
  _osmdReady = new Promise((resolve, reject) => {
    if(typeof opensheetmusicdisplay !== 'undefined') return resolve(opensheetmusicdisplay);
    const tag = document.getElementById('osmdSrc');
    if(!tag || !tag.textContent.trim())
      return reject(new Error('The engraver was not built into this copy. Run npm install and build again.'));
    try {
      /* indirect eval, so the bundle's own top-level declarations land on the
         global object the way a <script> would put them there */
      (0, eval)(tag.textContent);
      if(typeof opensheetmusicdisplay === 'undefined')
        return reject(new Error('The engraver loaded but did not announce itself.'));
      resolve(opensheetmusicdisplay);
    } catch(e){ reject(e); }
  });
  /* a failed compile must not be remembered as a failure for ever: the next
     attempt gets to try again rather than being told no from a cache */
  _osmdReady.catch(() => { _osmdReady = null; });
  return _osmdReady;
}
const osmdBuiltIn = () => { const t = document.getElementById('osmdSrc');
  return !!(t && t.textContent.trim()) || typeof opensheetmusicdisplay !== 'undefined'; };

/* ---------- one rendered score ----------
   Held outside the state on purpose. It is a live object over a DOM node, it
   cannot be serialised, and a redraw of the page throws the node away — so it
   is rebuilt from the file rather than kept across renders. */
/* A five-line staff is four line-gaps tall, and the engraver draws one gap to
   the unit. This is the one number the overlay needs that the layout tree does
   not hand over honestly. */
const STAFF_UNITS = 4;

let _sv = null;
const scoreView = () => _sv;

async function openScoreIn(container, rec, opts = {}){
  const lib = await osmdBoot();
  if(_sv && _sv.osmd && _sv.container !== container){ try { _sv.osmd.clear(); } catch(e){} }
  const osmd = new lib.OpenSheetMusicDisplay(container, {
    autoResize: false,                      /* the room decides when to reflow */
    backend: 'svg',
    drawTitle: false,                       /* the page already says the title */
    drawComposer: false,
    drawCredits: false,
    drawPartNames: true,
    drawMeasureNumbers: true,
    measureNumberInterval: 1,
    drawingParameters: 'default',
  });
  _sv = {osmd, container, scoreId: rec.id, from: null, to: null, loaded: false};
  await renderScore(rec, opts);
  return _sv;
}
/* Rendering is where the two things the room can ask for land: how big, and
   which measures.

   The measure range is a real clip rather than everything else dimmed, and
   that costs something: OSMD decides which measures exist while it is reading
   the file, not while it is drawing, so changing the range means reading the
   file again. It is only paid when the range actually changes — entering or
   leaving focus — and never for a zoom, a part or a note written in the
   margin. Dimming would have been cheaper and would have left the passage
   surrounded by the thing you were trying to stop looking at. */
async function renderScore(rec, opts = {}){
  if(!_sv) return null;
  const {osmd} = _sv;
  const from = opts.from === undefined ? _sv.from : opts.from;
  const to = opts.to === undefined ? _sv.to : opts.to;
  const changed = !_sv.loaded || from !== _sv.from || to !== _sv.to;
  _sv.from = from; _sv.to = to;
  if(changed){
    const r = osmd.EngravingRules || osmd.rules;
    if(r){
      /* the rules count from zero and the room counts from one */
      r.MinMeasureToDrawIndex = from ? Math.max(0, from - 1) : 0;
      r.MaxMeasureToDrawIndex = to ? Math.max(0, to - 1) : Number.MAX_SAFE_INTEGER;
    }
    await osmd.load(rec.musicXml);
    _sv.loaded = true;
  }
  /* every engraving, not only the ones that re-read the file: reading the
     file resets every part to visible, and a caller that changed which parts
     are on without saying so would otherwise get the old picture back */
  applyScoreParts(rec);
  const rules = osmd.EngravingRules || osmd.rules;
  const want = clamp(+rec.barsPerLine || 0, 0, 16);
  if(rules) rules.RenderXMeasuresPerLineAkaSystem = want;
  osmd.zoom = clamp(+rec.zoom || 1, 0.4, 2.5);
  osmd.render();
  /* Asking for eight bars to a line is asking for eight, and the engraver's
     own setting is only a ceiling: it will happily give five if five is all
     the width takes. So when a number has been asked for, the engraving is
     shrunk until the number is what arrives. Two or three passes settle it,
     and they are only paid when the setting or the width changes. */
  if(want) _sv.fitted = fitBarsPerLine(osmd, rec, want);
  else _sv.fitted = null;
  /* the count is the whole piece's, which only a full engraving can say */
  if(!from && !to) rec.totalMeasures = scoreMeasureCount(osmd) || rec.totalMeasures;
  return _sv;
}
/* How many bars the widest line actually got. Lines are found by grouping the
   drawn measures by the height they sit at, which is the same trick the bands
   use, so the two always agree about what a line is. */
function barsOnWidestLine(){
  const rows = {};
  measureBoxes().forEach(b => { const k = Math.round(b.y / 20); rows[k] = (rows[k] || 0) + 1; });
  const counts = Object.values(rows);
  return counts.length ? Math.max(...counts) : 0;
}
function fitBarsPerLine(osmd, rec, want){
  let zoom = clamp(+rec.zoom || 1, 0.4, 2.5);
  for(let pass = 0; pass < 3; pass++){
    const got = barsOnWidestLine();
    if(!got || got >= want) return {zoom, got};
    /* width needed runs about linearly with the size of the engraving, so the
       ratio of what arrived to what was asked for is the first guess, and it
       is a good one — a little under, so a near miss does not need a third go */
    const next = clamp(zoom * (got / want) * 0.97, 0.25, 2.5);
    if(Math.abs(next - zoom) < 0.01) return {zoom, got};
    zoom = next;
    osmd.zoom = zoom;
    osmd.render();
  }
  return {zoom, got: barsOnWidestLine()};
}
function scoreMeasureCount(osmd){
  try { return (osmd.Sheet && osmd.Sheet.SourceMeasures || []).length; } catch(e){ return 0; }
}
/* The parts, as the house wants to talk about them: an index, a name, and
   whether it is switched on. A score with one instrument still reports it,
   because "Piano" beside a single checkbox is how you learn the control is
   there before the day you open a duet. */
function scoreParts(rec){
  if(!_sv) return rec.instruments || [];
  let list = [];
  try {
    list = (_sv.osmd.Sheet.Instruments || []).map((inst, i) => ({
      index: i,
      name: (inst.NameLabel && inst.NameLabel.text) || inst.Name || `Part ${i + 1}`}));
  } catch(e){ list = []; }
  rec.instruments = list;
  return list.map(p => Object.assign({}, p, {visible: !(rec.hidden || []).includes(p.index)}));
}
/* Switching a part off and on again is the whole reason a duet player wants
   this room. OSMD reflows the layout by itself once told. */
function applyScoreParts(rec){
  if(!_sv) return;
  try {
    (_sv.osmd.Sheet.Instruments || []).forEach((inst, i) => {
      inst.Visible = !(rec.hidden || []).includes(i);
    });
  } catch(e){}
}
/* Never every part at once: a score with nothing visible renders as an empty
   box, which reads as a bug rather than as a choice. */
function setScorePartVisible(rec, index, visible){
  rec.hidden = Array.isArray(rec.hidden) ? rec.hidden : [];
  const on = scoreParts(rec).filter(p => p.visible).length;
  if(!visible && on <= 1) return false;
  rec.hidden = visible ? rec.hidden.filter(i => i !== index) : [...new Set([...rec.hidden, index])];
  applyScoreParts(rec);
  return true;
}

/* ---------- where a measure is on the page ----------
   Everything drawn over the notation — the section bands, the pins, the click
   target that says which measure you pressed — needs the same answer: where,
   in the rendered picture, is measure n. OSMD's own layout tree carries it in
   its internal units; this converts to pixels in the container, which is what
   an overlay needs and the only thing this room asks for. */
function measureBoxes(){
  if(!_sv) return [];
  const {osmd} = _sv;
  const out = [];
  /* Clipping to a range takes the measures off the canvas but leaves them in
     the model, holding the positions they had before the clip. Reading the
     model without this filter is reading where a measure used to be — which
     is how a band for bar 40 ends up drawn over a page that stops at bar 6. */
  const lo = _sv.from || -Infinity, hi = _sv.to || Infinity;
  const unit = (osmd.zoom || 1) * 10;             /* OSMD's unit-to-pixel scale */
  try {
    (osmd.GraphicSheet.MeasureList || []).forEach(staffLine => {
      (staffLine || []).forEach(m => {
        if(!m || !m.PositionAndShape) return;
        const n = (m.MeasureNumber != null) ? m.MeasureNumber
          : (m.parentSourceMeasure && m.parentSourceMeasure.MeasureNumber);
        if(n == null || n < lo || n > hi) return;
        const abs = m.PositionAndShape.AbsolutePosition;
        const size = m.PositionAndShape.Size;
        if(!abs || !size) return;
        /* The height to draw a band at is the staff's, and a measure's own
           reported height is not it — that is the bounding box of what is
           written in the measure, so a bar of whole notes reports one unit and
           the same bar with stems and a beam reports four. Reading it as the
           staff gives a stripe through the middle of the notes for one bar and
           a block hanging over three systems for the next, and both have
           shipped from this file.

           The staff itself is fixed by the engraver: five lines one unit
           apart, so four units tall, whatever is written on it. */
        const box = {measure:n, x: abs.x * unit, y: abs.y * unit,
          w: size.width * unit, h: STAFF_UNITS * unit};
        /* a measure is drawn once per staff; where two staves are one
           instrument the band wants the union, so it covers both hands */
        const had = out.find(b => b.measure === n && Math.abs(b.y - box.y) < box.h * 0.75);
        if(had){
          const x2 = Math.max(had.x + had.w, box.x + box.w), y2 = Math.max(had.y + had.h, box.y + box.h);
          had.x = Math.min(had.x, box.x); had.y = Math.min(had.y, box.y);
          had.w = x2 - had.x; had.h = y2 - had.y;
        } else out.push(box);
      });
    });
  } catch(e){ return []; }
  return out;
}
/* A measure range is one band per line it runs across, because a range that
   wraps is two shapes on the page and drawing it as one rectangle would paint
   over everything between them. */
function measureRangeBands(from, to){
  const rows = measureBoxes().filter(b => b.measure >= from && b.measure <= to);
  const bands = [];
  rows.sort((a, b) => a.y - b.y || a.x - b.x).forEach(b => {
    const line = bands.find(x => Math.abs(x.y - b.y) < Math.max(8, b.h * 0.6));
    if(line){
      const x2 = Math.max(line.x + line.w, b.x + b.w);
      line.x = Math.min(line.x, b.x); line.w = x2 - line.x;
      line.h = Math.max(line.h, b.h);
    } else bands.push({x:b.x, y:b.y, w:b.w, h:b.h});
  });
  return bands;
}
const measureBox = n => measureBoxes().find(b => b.measure === n) || null;
/* which measure a press landed in, for the pin popover */
function measureAt(x, y){
  const hit = measureBoxes().filter(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  return hit.length ? hit[0].measure : null;
}
