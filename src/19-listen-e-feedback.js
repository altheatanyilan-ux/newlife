/* ============================================================
   HEARING THE PIANO — live feedback, on the page you are practising from.

   Under every engraved exercise, a "Play it" strip. Start it and play:

   ON THE NOTATION. Each notehead is marked as it is judged — green when it
   was played, red when a wrong note was played in its place, grey when it
   was missed — and a note played that the page did not ask for appears as a
   small red ghost at the pitch it actually was. Under each staff a timing
   lane: a tick for each onset, left of its note when early and right when
   late, coloured by how far off. A soft column is the cursor.

   TWO WAYS TO GO THROUGH IT. Wait: the cursor stays on a step until it is
   played right, then moves on — for learning the notes. Play along: a
   click counts you in and the cursor moves with it whatever happens — for
   playing it in time. What was missed is missed.

   THE KEYS. For chords, a keyboard under the strip: the expected keys are
   outlined, the ones you played right fill green, wrong ones red, and the
   ones still missing pulse.

   AFTER. A scorecard (19-listen-d-analysis.js): accuracy, timing, the bars
   with the most errors and a button that loops just those, and what this
   kind of exercise is measured by — the swing ratio of a swing line, the
   evenness of a scale, which beat of a comping pattern you rush. The
   attempt is kept on the exercise, key by key, and the practice plan reads
   it.

   The notes come from the one stream (19-listen-b-live.js), so a MIDI
   keyboard and an acoustic piano through the microphone are the same here.
   ============================================================ */

let _lf = null;
/* a piece that is not in the book (a composition saved as an exercise) registers itself here, with where its attempts go */
const _lfEx = {};
function lfExOf(id){ return (_lfEx[id] && _lfEx[id].ex) || (typeof jazzExercise === 'function' ? jazzExercise(id) : null); }
const LF_COLOURS = {ok: '#3f8f5a', bad: '#c0463a', miss: '#9a958c'};

/* ---------- where the noteheads are, on any engraving ---------- */
function lfPositions(osmd){
  const out = [];
  if(!osmd || !osmd.GraphicSheet) return out;
  const unit = (osmd.zoom || 1) * 10;
  try {
    (osmd.GraphicSheet.MeasureList || []).forEach(list => (list || []).forEach(gm => {
      if(!gm || !gm.ParentStaff || !gm.PositionAndShape) return;
      const inst = gm.ParentStaff.ParentInstrument, staff = inst ? inst.Staves.indexOf(gm.ParentStaff) + 1 : 1;
      const num = gm.MeasureNumber != null ? gm.MeasureNumber : (gm.parentSourceMeasure && gm.parentSourceMeasure.MeasureNumber);
      const src = gm.parentSourceMeasure, barAt = (src && src.AbsoluteTimestamp && src.AbsoluteTimestamp.RealValue) || 0;
      const mp = gm.PositionAndShape.AbsolutePosition;
      (gm.staffEntries || []).forEach(se => {
        const ts = se.relInMeasureTimestamp || (se.sourceStaffEntry && se.sourceStaffEntry.Timestamp);
        let where = ts && ts.RealValue != null ? ts.RealValue : 0; if(barAt > 0 && where >= barAt) where -= barAt;
        (se.graphicalVoiceEntries || []).forEach(gve => (gve.notes || []).forEach(gn => {
          const sn = gn.sourceNote; if(!sn || !sn.Pitch || !gn.PositionAndShape) return;
          const abs = gn.PositionAndShape.AbsolutePosition; if(!abs) return;
          out.push({num, staff, at: +(where * 4).toFixed(4), midi: (sn.halfTone != null ? sn.halfTone : sn.Pitch.getHalfTone()) + 12,
            x: abs.x * unit, y: abs.y * unit, staffTop: mp ? mp.y * unit : null, unit});
        }));
      });
    }));
  } catch(e){}
  return out;
}
/* a diatonic step number, for placing a ghost note a line or space from a real one */
const LF_DIA = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const lfDia = p => LF_DIA[((p % 12) + 12) % 12] + 7 * Math.floor(p / 12);

/* ---------- the strip ---------- */
function lfPanelHTML(id){
  const ex = lfExOf(id); if(!ex) return '';
  const L = listenState(), at = !_lfEx[id] && typeof jazzSubOf === 'function' ? jazzSubOf(id) : null, stage = at ? +at.stage.n || 0 : 0;
  const saved = (jazzState().listenPrefs || {})[id] || {};
  const mode = saved.mode || lfModeFor(ex, {stage}), strict = saved.strictness || lfStrictnessFor(stage), how = saved.how || (mode === 'rhythm' ? 'along' : 'wait');
  const act = listenActive();
  return `<section class="lf-panel" id="lfPanel" data-lfid="${esc(id)}">
    <div class="lf-row">
      <b class="serif lf-t">Play it</b>
      <span class="lf-src faint">${act === 'mic' ? '<span class="li-dot"></span> hearing the microphone' : act === 'midi' ? '<span class="li-dot"></span> reading the MIDI keyboard' : 'not listening'}</span>
      <span class="grow"></span>
      ${act ? '' : `<button class="btn sm" id="lfListen">Start listening</button>`}
    </div>
    <div class="lf-row lf-opts">
      <label>Judge <select class="sel sm" id="lfMode">${[['exact', 'exact notes'], ['pitch-class', 'note names, any octave'], ['sequence', 'a line, in order'], ['rhythm', 'the rhythm'], ['free', 'nothing — describe it']].map(([k, n]) =>
        `<option value="${k}"${k === mode ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Strictness <select class="sel sm" id="lfStrict">${['lenient', 'standard', 'strict'].map(k => `<option${k === strict ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
      <span class="lf-seg" role="radiogroup">${[['wait', 'Wait for me'], ['along', 'Play along']].map(([k, n]) => `<button data-lfhow="${k}" class="${k === how ? 'on' : ''}" role="radio" aria-checked="${k === how}">${n}</button>`).join('')}</span>
      <label class="lf-bpm"${how === 'along' ? '' : ' hidden'}>♩ = <input class="inp sm mono" id="lfBpm" type="number" min="30" max="260" value="${saved.bpm || 80}"></label>
      <span class="grow"></span>
      <button class="btn sm primary" id="lfGo">${_lf && _lf.id === id && _lf.running ? 'Stop' : 'Start'}</button>
    </div>
    <div class="lf-live" id="lfLive" aria-live="polite"><span class="faint">${act ? 'Press Start, then play from the first note.' : 'Start listening, then Start.'} Wrong notes turn red, missed ones grey.</span></div>
    <div class="lf-kbd" id="lfKbd"></div>
    <div class="lf-card" id="lfCard">${lfLastHTML(id)}</div>
  </section>`;
}
function lfRecordOf(id){ return _lfEx[id] ? _lfEx[id].record() : jazzRecord(id, true); }
function lfLastHTML(id){
  const r = lfRecordOf(id); const h = (r.heard || []).slice(-1)[0];
  if(!h) return '';
  return `<p class="faint lf-lastline">Last time (${esc(jazzPretty(h.key || ''))}, ${esc(h.mode)}): ${h.accuracy != null ? h.accuracy + '% right' : ''}${h.timing != null ? ` · timing ${h.timing}` : ''}${h.note ? ' · ' + esc(h.note) : ''}</p>`;
}
function bindLfPanel(root, id){
  const box = root.querySelector('#lfPanel'); if(!box) return;
  const prefs = () => { const j = jazzState(); j.listenPrefs = j.listenPrefs || {}; return (j.listenPrefs[id] = j.listenPrefs[id] || {}); };
  const lis = box.querySelector('#lfListen');
  if(lis) lis.onclick = async () => { try { const s = await listenStart(); toast(s === 'midi' ? 'Reading the MIDI keyboard.' : 'Listening through the microphone. Nothing leaves this device.'); } catch(e){ toast(e.message || 'Could not start listening.'); } rerender(); };
  box.querySelector('#lfMode').onchange = e => { prefs().mode = e.target.value; saveNow(); };
  box.querySelector('#lfStrict').onchange = e => { prefs().strictness = e.target.value; saveNow(); };
  box.querySelectorAll('[data-lfhow]').forEach(b => b.onclick = () => { prefs().how = b.dataset.lfhow; saveNow();
    box.querySelectorAll('[data-lfhow]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    box.querySelector('.lf-bpm').hidden = b.dataset.lfhow !== 'along'; });
  box.querySelector('#lfBpm').onchange = e => { prefs().bpm = Math.max(30, Math.min(260, +e.target.value || 80)); saveNow(); };
  box.querySelector('#lfGo').onclick = () => { if(_lf && _lf.running) lfStop(true); else lfStart(root, id); };
  addEventListener('hashchange', () => { if(_lf) lfStop(false); }, {once: true});
}

/* what this strip asked the listener for, marked as ours, so leaving the page clears ours and nobody else's */
function lfExpect(notes, eo, owner){ listenExpect(notes, eo); if(_li.expect) _li.expect.owner = owner || 'lf'; }
function lfUnexpect(owner){ if(_li.expect && _li.expect.owner === (owner || 'lf')) listenExpect(null); }
/* ---------- an attempt ---------- */
function lfScoreBox(root){ return root.querySelector('#jzScore') || root.querySelector('.jz-score'); }
function lfStart(root, id, loop){
  const ex = lfExOf(id);
  const box = lfScoreBox(root);
  const osmd = box && box._jzOsmd, xml = box && box._jzXml;
  if(!osmd || !xml){ toast('The notation has not been drawn yet.'); return; }
  if(!listenActive()){ toast('Start listening first — the microphone or a MIDI keyboard.'); return; }
  let parsed; try { parsed = anParse(xml); } catch(e){ toast('That score could not be read for listening.'); return; }
  let steps = lfSteps(parsed.notes.map(n => ({midi: n.midi, on: n.on, num: n.num, at: n.at, staff: n.staff, dur: n.dur, id: n.id, tieStop: n.tieStop})));
  if(loop) steps = steps.filter(s => s.num >= loop.from && s.num <= loop.to);
  if(!steps.length){ toast('There are no notes to listen for here.'); return; }
  const panel = root.querySelector('#lfPanel');
  const mode = panel.querySelector('#lfMode').value, strict = panel.querySelector('#lfStrict').value;
  const how = mode === 'rhythm' ? 'along' : (panel.querySelector('[data-lfhow].on') || {}).dataset.lfhow || 'wait';
  const bpm = Math.max(30, Math.min(260, +panel.querySelector('#lfBpm').value || 80));
  if(_lf) lfStop(false);
  const ui = jazzUi();
  _lf = {id, root, box, osmd, xml, parsed, steps, mode, strict, how, bpm, key: ui.key || 'C', loop: loop || null, i: 0, results: steps.map(s => ({i: s.i, num: s.num, pass: null, played: [], extra: [], missing: [], offsetMs: null})),
    played: [], running: true, startedAt: listenNow(), stepAskedAt: listenNow(), unsubs: [], pos: lfPositions(osmd), marks: []};
  lfLayer();
  lfPaint();
  panel.querySelector('#lfGo').textContent = 'Stop';
  panel.querySelector('#lfCard').innerHTML = '';
  const eo = {mode: mode === 'pitch-class' ? 'pitch-class' : 'exact', strictness: strict};
  _lf.unsubs.push(listenOn(ev => lfOnNote(ev)));
  if(mode === 'exact' || mode === 'pitch-class'){
    _lf.unsubs.push(listenOnVerify(r => lfOnVerdict(r)));
    lfExpect(steps[0].notes, eo);
  }
  if(how === 'along') lfCountIn();
  lfSay();
}
function lfStop(finished){
  const s = _lf; if(!s) return;
  s.running = false;
  s.unsubs.forEach(f => { try { f(); } catch(e){} });
  clearInterval(s.timer); clearTimeout(s.endTimer);
  if(s.click){ try { s.click.close(); } catch(e){} s.click = null; }
  lfUnexpect();
  const panel = s.root.querySelector('#lfPanel'); if(panel) panel.querySelector('#lfGo').textContent = 'Start';
  if(finished) lfFinish(); else _lf = null;
}
/* ---------- play along: a bar of clicks, then the cursor moves with the beat ---------- */
function lfCountIn(){
  const s = _lf, beat = 60 / s.bpm;
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null; try { ctx = new AC(); } catch(e){}
  s.click = ctx;
  const M = s.parsed.measures[0] || {beats: 4};
  const count = M.beats || 4;
  const firstOn = s.steps[0].on;
  const nowCtx = ctx ? ctx.currentTime + 0.1 : 0;
  s.t0 = listenNow() + 0.1 + count * beat - firstOn * beat;   /* score time 0, on the shared clock */
  const lastOn = s.steps[s.steps.length - 1].on + (s.steps[s.steps.length - 1].dur || 1);
  if(ctx){
    const total = count + Math.ceil(lastOn - firstOn) + 1;
    for(let k = 0; k < total; k++){
      const t = nowCtx + k * beat, o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = k < count ? (k === 0 ? 1500 : 1100) : ((k - count) % count === 0 ? 1200 : 900);
      g.gain.setValueAtTime(k < count ? 0.25 : 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.06);
    }
  }
  s.stepTime = st => s.t0 + st.on * beat;
  const win = LD_STRICTNESS[s.strict].windowMs / 1000;
  s.timer = setInterval(() => {
    if(!s.running) return;
    const now = listenNow();
    /* the cursor is where the click is */
    let i = s.steps.findIndex(st => s.stepTime(st) + Math.max(win, 0.12) > now);
    if(i < 0) i = s.steps.length;
    /* a step whose moment has passed with nothing right is missed */
    for(let k = 0; k < i; k++){ const r = s.results[k]; if(r.pass == null){ r.pass = false; r.missing = s.steps[k].notes.slice(); } }
    if(i !== s.i){ s.i = i; if(s.mode === 'exact' || s.mode === 'pitch-class'){ const nx = s.steps[i]; lfExpect(nx ? nx.notes : null, {mode: s.mode, strictness: s.strict}); } lfPaint(); lfSay(); }
    if(i >= s.steps.length && !s.endTimer) s.endTimer = setTimeout(() => lfStop(true), 600);
  }, 30);
}
/* ---------- what arrives ---------- */
function lfOnNote(ev){
  const s = _lf; if(!s || !s.running) return;
  s.played.push(ev);
  if(s.mode === 'sequence'){
    const idx = s.how === 'along' ? lfNearestStep(ev.onset) : s.i;
    const st = s.steps[idx]; if(!st){ return; }
    const r = s.results[idx];
    const right = st.notes.includes(ev.pitch);
    if(right){ if(!r.played.includes(ev.pitch)) r.played.push(ev.pitch); }
    else { r.extra.push(ev.pitch); }
    if(s.how === 'along' && s.stepTime) r.offsetMs = r.offsetMs == null ? Math.round((ev.onset - s.stepTime(st)) * 1000) : r.offsetMs;
    if(st.notes.every(p => r.played.includes(p))){
      r.pass = !r.extra.length || s.strict === 'lenient';
      if(s.how === 'wait'){ r.reaction = +(ev.onset - s.stepAskedAt).toFixed(2); lfAdvance(); }
    } else if(!right && s.how === 'wait' && s.strict !== 'lenient') r.pass = false;
    lfPaint(); lfSay();
    if(s.how === 'wait' && s.i >= s.steps.length) lfStop(true);
    return;
  }
  if(s.mode === 'rhythm'){
    const idx = lfNearestStep(ev.onset); if(idx < 0) return;
    const r = s.results[idx], st = s.steps[idx];
    if(r.offsetMs == null){ r.offsetMs = Math.round((ev.onset - s.stepTime(st)) * 1000); r.pass = Math.abs(r.offsetMs) <= LD_STRICTNESS[s.strict].windowMs; }
    if(!r.played.includes(ev.pitch)) r.played.push(ev.pitch);
    lfPaint(); return;
  }
  if(s.mode === 'free'){ lfKeyboard(); lfSay(); }
}
function lfNearestStep(t){
  const s = _lf; if(!s.stepTime) return -1;
  const win = Math.max(0.2, LD_STRICTNESS[s.strict].windowMs / 1000 * 2);
  let best = -1, bd = Infinity;
  s.steps.forEach((st, k) => { const d = Math.abs(s.stepTime(st) - t); if(d < bd && d <= win){ bd = d; best = k; } });
  return best;
}
function lfOnVerdict(r){
  const s = _lf; if(!s || !s.running) return;
  const idx = s.how === 'along' ? lfNearestStep(r.t) : s.i;
  const st = s.steps[idx]; if(!st) return;
  const res = s.results[idx];
  const v = r.verify;
  /* in wait mode a wrong try stays on the step (and counts); a right one moves on */
  const had = res.pass;
  res.played = [...new Set(res.played.concat(r.notes || []))];
  res.missing = v.missing.slice(); res.extra = [...new Set(res.extra.concat(v.extra))];
  if(s.how === 'along' && s.stepTime) res.offsetMs = Math.round((r.t - s.stepTime(st)) * 1000);
  if(v.pass){
    res.pass = had === false && s.how === 'wait' ? false : true;   /* right at the second try is still an error on the card */
    res.passedAfterTry = had === false;
    res.reaction = +(r.t - s.stepAskedAt).toFixed(2);
    if(s.how === 'wait') lfAdvance();
  } else if(s.how === 'wait') res.pass = false;
  else res.pass = false;
  lfPaint(); lfSay();
  if(s.how === 'wait' && s.i >= s.steps.length) lfStop(true);
}
function lfAdvance(){
  const s = _lf;
  s.i++; s.stepAskedAt = listenNow();
  const nx = s.steps[s.i];
  if(s.mode === 'exact' || s.mode === 'pitch-class') lfExpect(nx ? nx.notes : null, {mode: s.mode, strictness: s.strict});
}
function lfSay(){
  const s = _lf; if(!s) return;
  const el = s.root.querySelector('#lfLive'); if(!el) return;
  if(s.mode === 'free'){ el.innerHTML = `<span>${s.played.length} notes so far. Press Stop when you are done.</span>`; return; }
  const st = s.steps[s.i];
  const done = s.results.filter(r => r.pass != null).length, right = s.results.filter(r => r.pass).length;
  el.innerHTML = st ? `<span>Step ${s.i + 1} of ${s.steps.length}${s.how === 'wait' ? ' — waiting for' : ' —'} <b>${st.notes.map(listenNoteName).join(' ')}</b></span>
    <span class="faint">bar ${st.num} · ${right} of ${done} right so far</span>` : '<span>Done.</span>';
  lfKeyboard();
}
/* ---------- the marks on the notation ---------- */
function lfLayer(){
  const s = _lf;
  let layer = s.box.querySelector('.lf-layer');
  if(!layer){ layer = document.createElement('div'); layer.className = 'lf-layer'; layer.setAttribute('aria-hidden', 'true'); s.box.appendChild(layer); }
  if(getComputedStyle(s.box).position === 'static') s.box.style.position = 'relative';
  s.layer = layer;
  return layer;
}
function lfPaint(){
  const s = _lf; if(!s || !s.layer) return;
  const pos = s.pos.length ? s.pos : (s.pos = lfPositions(s.osmd));
  const svg = s.osmd.container ? s.osmd.container.querySelector('svg') : s.box.querySelector('svg');
  const offX = svg ? svg.getBoundingClientRect().left - s.box.getBoundingClientRect().left : 0;
  const offY = svg ? svg.getBoundingClientRect().top - s.box.getBoundingClientRect().top : 0;
  let html = '';
  const win = LD_STRICTNESS[s.strict].windowMs;
  s.steps.forEach((st, k) => {
    const r = s.results[k];
    const here = pos.filter(p => p.num === st.num && Math.abs(p.at - st.at) < 1e-3);
    if(k === s.i && s.running && here.length){
      const x0 = Math.min(...here.map(p => p.x)), y0 = Math.min(...here.map(p => p.staffTop != null ? p.staffTop : p.y)) , y1 = Math.max(...here.map(p => (p.staffTop != null ? p.staffTop : p.y) + 4 * p.unit));
      html += `<i class="lf-cursor" style="left:${offX + x0 - 7}px;top:${offY + y0 - 12}px;height:${y1 - y0 + 24}px"></i>`;
    }
    if(r.pass == null) return;
    here.forEach(p => {
      const played = r.played.includes(p.midi) || (s.mode === 'pitch-class' && r.played.some(q => ((q - p.midi) % 12 + 12) % 12 === 0));
      const cls = played ? (r.passedAfterTry ? 'ok retry' : 'ok') : r.extra.length ? 'bad' : 'miss';
      html += `<i class="lf-m ${cls}" style="left:${offX + p.x}px;top:${offY + p.y}px" title="${listenNoteName(p.midi)}: ${cls === 'ok' ? 'played' : cls === 'bad' ? 'a wrong note in its place' : 'missed'}"></i>`;
    });
    /* the wrong notes, where they would sit on the staff */
    if(here.length) r.extra.forEach(q => {
      if(s.mode === 'pitch-class' && q < 12) return;
      const ref = here.reduce((a, b) => Math.abs(b.midi - q) < Math.abs(a.midi - q) ? b : a);
      const y = ref.y - (lfDia(q) - lfDia(ref.midi)) * ref.unit / 2;
      html += `<i class="lf-ghost" style="left:${offX + ref.x + ref.unit * 1.3}px;top:${offY + y}px" title="${listenNoteName(q)} was played"></i>`;
    });
    /* the timing lane, under the staff */
    if(r.offsetMs != null && here.length){
      const p = here[0], top = (p.staffTop != null ? p.staffTop : p.y) + 4 * p.unit + Math.max(...here.map(h => Math.max(0, h.y - ((h.staffTop || h.y) + 4 * h.unit)))) + 14;
      const dx = Math.max(-40, Math.min(40, r.offsetMs * 0.25)), off = Math.abs(r.offsetMs);
      const tone = off <= win * 0.5 ? 'good' : off <= win ? 'fair' : 'far';
      html += `<i class="lf-tick ${tone}" style="left:${offX + p.x + dx}px;top:${offY + top}px" title="${r.offsetMs > 0 ? '+' : ''}${r.offsetMs} ms ${r.offsetMs < 0 ? 'early' : r.offsetMs > 0 ? 'late' : ''}"></i>`;
    }
  });
  s.layer.innerHTML = html;
  lfKeyboard();
}
/* ---------- the keyboard ---------- */
function lfKeyboardSVG(lo, hi, st){
  const white = [], black = [], isB = p => [1, 3, 6, 8, 10].includes(((p % 12) + 12) % 12);
  let x = 0;
  for(let p = lo; p <= hi; p++){ if(!isB(p)){ white.push({p, x}); x += 18; } }
  for(let p = lo; p <= hi; p++){ if(isB(p)){ const left = white.filter(w => w.p < p).pop(); if(left) black.push({p, x: left.x + 12}); } }
  const cls = p => ['lf-k', isB(p) ? 'b' : 'w', st.exp.has(p) ? 'exp' : '', st.ok.has(p) ? 'ok' : '', st.bad.has(p) ? 'bad' : '', st.miss.has(p) ? 'miss' : '', st.out && st.out.has(p) ? 'out' : ''].filter(Boolean).join(' ');
  return `<svg viewBox="-1 -1 ${x + 2} 72" class="lf-keys" role="img" aria-label="Keyboard">${white.map(w => `<rect class="${cls(w.p)}" x="${w.x}" y="0" width="17" height="70" rx="2"><title>${listenNoteName(w.p)}</title></rect>`).join('')}
    ${black.map(b => `<rect class="${cls(b.p)}" x="${b.x}" y="0" width="11" height="44" rx="1.5"><title>${listenNoteName(b.p)}</title></rect>`).join('')}</svg>`;
}
function lfKeyboard(){
  const s = _lf; if(!s) return;
  const el = s.root.querySelector('#lfKbd'); if(!el) return;
  const chordy = s.steps.some(st => st.notes.length > 1) || s.mode === 'free';
  if(!chordy){ el.innerHTML = ''; return; }
  const st = s.steps[Math.min(s.i, s.steps.length - 1)] || {notes: []};
  const r = s.results[Math.min(s.i, s.results.length - 1)] || {played: [], extra: [], missing: []};
  /* what was played for THIS step: since it was asked (wait) or near its moment (play along) */
  const since = s.how === 'wait' ? s.stepAskedAt - 0.05 : listenNow() - 0.6;
  const recent = s.i >= s.steps.length ? [] : s.played.filter(e => e.onset >= since).map(e => e.pitch);
  const all = st.notes.concat(recent, r.extra);
  const lo = Math.min(48, ...all) - 2, hi = Math.max(72, ...all) + 2;
  const state = {exp: new Set(st.notes), ok: new Set(recent.filter(p => st.notes.includes(p)).concat(r.played.filter(p => st.notes.includes(p)))),
    bad: new Set(recent.filter(p => !st.notes.includes(p)).concat(r.extra)), miss: new Set(r.pass === false ? st.notes.filter(p => !r.played.includes(p)) : [])};
  if(s.mode === 'free'){ const sc = lfModePcs(); state.exp = new Set(); state.ok = new Set(recent.filter(p => sc.includes(((p % 12) + 12) % 12))); state.bad = new Set(); state.out = new Set(recent.filter(p => !sc.includes(((p % 12) + 12) % 12))); }
  el.innerHTML = lfKeyboardSVG(lo - (lo % 12 === 1 || [1, 3, 6, 8, 10].includes(((lo % 12) + 12) % 12) ? 1 : 0), hi, state);
}
/* the mode free playing is measured against: the key's major scale, or what the exercise names */
function lfModePcs(){
  const s = _lf; const key = jazzKey(s ? s.key : 'C'), tonic = (JAZZ_NATURAL[key[1]] + key[2] + 12) % 12;
  const ex = s ? lfExOf(s.id) : null, t = String(ex && (ex.name + ' ' + (ex.description || '')) || '').toLowerCase();
  const modes = {dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], blues: [0, 3, 5, 6, 7, 10], minor: [0, 2, 3, 5, 7, 8, 10], pentatonic: [0, 2, 4, 7, 9]};
  const name = Object.keys(modes).find(k => t.includes(k));
  return (name ? modes[name] : [0, 2, 4, 5, 7, 9, 11]).map(x => (x + tonic) % 12);
}
/* ---------- the scorecard ---------- */
function lfFinish(){
  const s = _lf; if(!s) return;
  const ex = lfExOf(s.id);
  s.results.forEach((r, k) => { if(r.pass == null && s.mode !== 'free'){ r.pass = false; r.missing = s.steps[k].notes.slice(); } });
  lfPaint();
  const win = LD_STRICTNESS[s.strict].windowMs;
  const card = lfScorecard(s.mode === 'free' ? [] : s.results, {windowMs: win});
  const lines = [];
  const onsets = s.played.map(e => e.onset);
  if(s.mode === 'sequence'){
    const al = ldAlign(s.steps.flatMap(st => st.notes), s.played.map(e => e.pitch), 'exact');
    card.accuracy = Math.round(al.accuracy * 100);
    const ev = lfEvenness(onsets); if(ev) lines.push(`Evenness: the gaps between notes vary by ${Math.round(ev.cv * 100)}% ${ev.cv < 0.08 ? '— very even' : ev.cv < 0.15 ? '— fairly even' : '— uneven'}.`);
    const perBeat = s.steps.length > 2 ? Math.max(1, Math.round(1 / Math.max(0.125, lfMedian(s.steps.slice(1).map((st, k) => st.on - s.steps[k].on))))) : 2;
    const tempo = lfTempoOf(onsets, perBeat); if(tempo) lines.push(`Tempo reached: ♩ = ${tempo}.`);
    if(lfIsSwing(ex)) lines.push(lfSwingSay(lfSwingRatio(onsets, s.stepTime ? 60 / s.bpm : null, s.stepTime ? s.t0 : null), 2));
  }
  if(s.mode === 'rhythm' && s.stepTime){
    const grid = s.steps.map(st => { const f = st.at - Math.floor(st.at + 1e-6); return {t: s.stepTime(st), label: f === 0 ? String(Math.floor(st.at) + 1) : Math.abs(f - 0.5) < 1e-6 ? '&' + (Math.floor(st.at) + 1) : `${Math.floor(st.at) + 1}+${f}`}; });
    const rep = lfRhythmReport(onsets, grid, win);
    lines.push(rep.say); card.timing = rep.timing;
    card.accuracy = Math.round(100 * rep.hits.filter(h => h.hit && Math.abs(h.offsetMs) <= win).length / Math.max(1, rep.hits.length));
  }
  let free = null;
  if(s.mode === 'free'){
    free = lfFreeReport(s.played, lfModePcs());
    if(free.n) lines.push(`${free.n} notes over ${free.seconds} s; ${Math.round(free.share * 100)}% inside the mode, range ${listenNoteName(free.range[0])}–${listenNoteName(free.range[1])}.`);
  }
  const pass = s.mode === 'free' ? null : card.accuracy >= (s.mode === 'sequence' ? 95 : 100) && (card.timing == null || card.timing >= 60);
  const note = lines.join(' ');
  /* kept on the exercise, key by key */
  const rec = lfRecordOf(s.id);
  rec.keys = rec.keys || {};
  rec.heard = rec.heard || [];
  rec.heard.push({at: new Date().toISOString(), day: today(), key: s.key, mode: s.mode, strictness: s.strict, how: s.how, accuracy: card.accuracy, timing: card.timing, pass, n: card.n, loop: s.loop, note: note.slice(0, 200),
    reaction: card.reaction, source: listenActive()});
  if(rec.heard.length > 300) rec.heard = rec.heard.slice(-300);
  let earned = false;
  if(pass && !_lfEx[s.id] && lfKeyEarned(rec.heard, s.key) && !rec.keys[s.key]){ jazzSetKey(s.id, s.key, true); earned = true; }
  saveNow();
  /* a free take is kept for the self-transcription exercises */
  if(s.mode === 'free' && s.played.length){
    const j = jazzState(); j.freeTakes = j.freeTakes || [];
    j.freeTakes.unshift({id: uid(), at: new Date().toISOString(), exerciseId: s.id, key: s.key, notes: s.played.map(e => ({p: e.pitch, t: +(e.onset - s.startedAt).toFixed(3), v: e.velocity}))});
    j.freeTakes = j.freeTakes.slice(0, 40); saveNow();
  }
  const el = s.root.querySelector('#lfCard');
  if(el) el.innerHTML = `<div class="lf-score">
    ${s.mode === 'free' ? `<div class="lf-big"><b>${free && free.n || 0}</b><span>notes</span></div><div class="lf-big"><b>${free && free.n ? Math.round(free.share * 100) + '%' : '—'}</b><span>inside the mode</span></div>
      ${free && free.density.length > 1 ? `<svg class="lf-dens" viewBox="0 0 ${free.density.length * 8} 30" preserveAspectRatio="none" aria-label="notes per second">${free.density.map((d, i) => `<rect x="${i * 8 + 1}" y="${30 - Math.min(30, d * 5)}" width="6" height="${Math.min(30, d * 5)}"><title>${d.toFixed(1)} notes a second</title></rect>`).join('')}</svg>` : ''}`
    : `<div class="lf-big"><b>${card.accuracy != null ? card.accuracy + '%' : '—'}</b><span>right</span></div>
      <div class="lf-big"><b>${card.timing != null ? card.timing : '—'}</b><span>timing</span></div>
      ${card.reaction != null ? `<div class="lf-big"><b>${card.reaction.toFixed(1)} s</b><span>to find it</span></div>` : ''}`}
    <div class="lf-lines">${lines.map(l => `<p>${esc(l)}</p>`).join('')}
      ${card.worst.length ? `<p>Most errors: ${card.worst.map(w => `bar ${w.at} (${w.errors})`).join(', ')}.</p>` : s.mode !== 'free' ? '<p>No errors.</p>' : ''}
      ${earned ? `<p class="lf-earned">Three clean attempts in ${esc(jazzPretty(s.key))} — it is marked as yours. <button class="tbtn" id="lfComfort">raise how comfortable you are with it</button></p>` : ''}</div>
    <div class="lf-btns">${card.loop ? `<button class="btn sm" id="lfLoop">Loop the tricky bit (bars ${card.loop.from}–${card.loop.to})</button>` : ''}
      <button class="btn sm ghost" id="lfAgain">Again</button><button class="btn sm ghost" id="lfClear">Clear the marks</button></div></div>`;
  const root = s.root, id = s.id, loop = card.loop;
  _lf = Object.assign(s, {running: false});
  const $b = q => root.querySelector(q);
  if($b('#lfLoop')) $b('#lfLoop').onclick = () => lfStart(root, id, loop);
  if($b('#lfAgain')) $b('#lfAgain').onclick = () => lfStart(root, id, s.loop);
  if($b('#lfClear')) $b('#lfClear').onclick = () => { if(s.layer) s.layer.innerHTML = ''; };
  if($b('#lfComfort')) $b('#lfComfort').onclick = () => {
    const now = jazzComfortOf(id) || 2, next = Object.keys(JAZZ_COMFORT).find(k => JAZZ_COMFORT[k] === Math.min(5, now + 1));
    jazzLogPractice(id, {quality: next, keys: [s.key], minutes: 0, note: 'Raised after three clean attempts, heard.'});
    toast(`Comfort: ${JAZZ_COMFORT_SAID[Math.min(5, now + 1)]}.`); };
  if(typeof sound === 'function') sound(pass ? 'success' : 'click');
}
/* ---------- what the plan reads ---------- */
function lfHeardSummary(id){
  const r = jazzRecord(id); const h = (r.heard || []).filter(x => x.mode !== 'free');
  if(!h.length) return null;
  const last = h.slice(-5);
  const weak = [...new Set(h.slice(-24).filter(x => x.pass === false).map(x => x.key))].filter(k => !h.slice(-24).filter(x => x.key === k).slice(-1)[0].pass);
  return {attempts: h.length, accuracy: Math.round(lfMean(last.map(x => x.accuracy || 0))), timing: last.some(x => x.timing != null) ? Math.round(lfMean(last.filter(x => x.timing != null).map(x => x.timing))) : null, weakKeys: weak};
}

/* ---------- the twelve-key cards: the chord asked, heard ---------- */
function lfFlashHook(root, card, ex, drawn){
  const f = jazzUi().flash; if(!f || f.shown || !listenActive() || !ex) return;
  let steps = [];
  try { const xml = drawn(card.key); if(xml) steps = lfSteps(anParse(xml).notes.map(n => ({midi: n.midi, on: n.on, num: n.num, at: n.at, staff: n.staff, dur: n.dur, id: n.id, tieStop: n.tieStop}))); } catch(e){}
  if(!steps.length) return;
  const at = typeof jazzSubOf === 'function' ? jazzSubOf(card.exerciseId) : null, stage = at ? +at.stage.n || 0 : 0;
  const mode = lfModeFor(ex, {flashcard: true, stage}) === 'pitch-class' ? 'pitch-class' : 'exact';
  const strict = lfStrictnessFor(stage);
  /* a progression is asked chord by chord; a line, its first four notes as they come */
  const chords = steps.filter(s => s.notes.length > 1).slice(0, 8);
  const want = chords.length ? chords : [{notes: steps.slice(0, 4).flatMap(s => s.notes)}];
  let k = 0;
  const say = root.querySelector('.jz-chint');
  if(say) say.innerHTML = `<span class="li-dot"></span> listening — play it, and the card turns over when it hears it`;
  lfExpect(want[0].notes, {mode, strictness: strict}, 'card');
  const from = listenNow();
  const off = listenOnVerify(r => {
    if(!r.verify.pass) return;
    k++;
    if(k < want.length){ lfExpect(want[k].notes, {mode, strictness: strict}, 'card'); return; }
    off(); lfUnexpect('card');
    f.heard = {seconds: +(r.t - from).toFixed(1), key: card.key};
    f.shown = true; f.seconds = r.t - from; f.at0 = f.at0 || Date.now();
    if(typeof sound === 'function') sound('success');
    rerender();
  });
  addEventListener('hashchange', () => { off(); lfUnexpect('card'); }, {once: true});
  const obs = new MutationObserver(() => { if(!document.body.contains(root.querySelector('#jzShow') || document.createElement('i'))){ off(); obs.disconnect(); } });
  try { obs.observe(root, {childList: true, subtree: false}); } catch(e){}
}
