/* ============================================================
   YOUR VOICE: A RANGE YOU SCROLL TO, AND A WAY TO FIND IT

   The vocal range is two notes, and typing them ("C3", "G4") asks you to
   already know them. Here each is a wheel: scroll (or press a key, or tap a
   note) and it sounds as it lands, so you can sing along and stop where it
   stops being comfortable. Under the wheels, how wide that is and which
   voice it sits like — a guide, not a label.

   FIND MY RANGE does the finding. Sing, and the microphone listens (the
   sound is analysed here and never recorded or sent anywhere): it names the
   note you are holding, and keeps the lowest and the highest you held steady
   for about half a second. Or, without a microphone, by ear: scroll to a
   note, hear it, mark the lowest you can sing and the highest. Either way the
   result is two notes, offered back to the wheels — the extremes you reached,
   and the more comfortable range a little in from each end, which is what the
   melody tools should keep inside.

   One range for the whole studio: setting it here sets it for the Jazz
   Studio too (studioSetVocalRange).
   ============================================================ */
const SNG_WHEEL = {lo: 33, hi: 89, h: 38};            /* A1 – F6 */
const SNG_VOICES = [['bass', 'E2–E4', 52], ['baritone', 'A2–A4', 57], ['tenor', 'C3–C5', 60], ['alto', 'F3–F5', 65], ['mezzo-soprano', 'A3–A5', 69], ['soprano', 'C4–C6', 72]];
const sngBlackKey = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
const sngWheelClamp = m => Math.max(SNG_WHEEL.lo, Math.min(SNG_WHEEL.hi, Math.round(m)));
const sngNote = m => typeof studioNoteName === 'function' ? studioNoteName(m) : sngMidiName(m);
const SNG_SPAN_NAMES = ['', 'a semitone', 'a tone', 'a minor third', 'a major third', 'a fourth', 'a tritone', 'a fifth', 'a minor sixth', 'a major sixth', 'a minor seventh', 'a major seventh'];
function sngSpanSay(lo, hi){
  const n = hi - lo; if(n <= 0) return '';
  const oct = Math.floor(n / 12), r = n % 12, parts = [];
  if(oct) parts.push(oct + (oct === 1 ? ' octave' : ' octaves'));
  if(r) parts.push(SNG_SPAN_NAMES[r]);
  return `${n} semitones — ${parts.join(' and ')}`;
}
function sngVoiceGuess(lo, hi){
  if(hi <= lo) return '';
  const mid = (lo + hi) / 2; let best = SNG_VOICES[0];
  SNG_VOICES.forEach(v => { if(Math.abs(v[2] - mid) < Math.abs(best[2] - mid)) best = v; });
  return `sits like a ${best[0]} (${best[1]}) — a guide, not a label`;
}
/* ---------- the wheel ---------- */
function sngWheelHTML(id, label, midi){
  const items = []; for(let m = SNG_WHEEL.hi; m >= SNG_WHEEL.lo; m--) items.push(`<div class="sng-wh${sngBlackKey(m) ? ' blk' : ''}${m % 12 === 0 ? ' c' : ''}" role="option" data-m="${m}">${esc(sngNote(m))}</div>`);
  return `<div class="sng-wheel" data-wheel="${id}"><span class="mono faint">${esc(label)}</span>
    <div class="sng-wheel-box"><div class="sng-wheel-list" tabindex="0" role="listbox" aria-label="${esc(label)}" data-value="${midi}"><div class="sng-wh-pad"></div>${items.join('')}<div class="sng-wh-pad"></div></div><i class="sng-wheel-band"></i></div></div>`;
}
function sngWheelBind(el, o){
  const list = el.querySelector('.sng-wheel-list'), H = SNG_WHEEL.h; let cur = sngWheelClamp(o.value), tm = 0;
  const top = m => (SNG_WHEEL.hi - m) * H, at = () => sngWheelClamp(SNG_WHEEL.hi - Math.round(list.scrollTop / H));
  const mark = m => list.querySelectorAll('.sng-wh').forEach(n => n.classList.toggle('on', +n.dataset.m === m));
  const set = (m, smooth) => { cur = sngWheelClamp(m); list.scrollTo({top: top(cur), behavior: smooth ? 'smooth' : 'auto'}); mark(cur); };
  list.addEventListener('scroll', () => { mark(at()); clearTimeout(tm); tm = setTimeout(() => { const m = at(); if(m !== cur){ cur = m; if(o.onChange) o.onChange(m); } }, 90); }, {passive: true});
  list.addEventListener('click', ev => { const it = ev.target.closest('.sng-wh'); if(!it) return; const m = +it.dataset.m; set(m, true); if(m !== cur || true){ cur = m; if(o.onChange) o.onChange(m); } });
  list.addEventListener('keydown', ev => { const d = {ArrowUp: 1, ArrowDown: -1, PageUp: 12, PageDown: -12}[ev.key]; if(!d) return; ev.preventDefault(); const m = sngWheelClamp(cur + d); set(m, true); cur = m; if(o.onChange) o.onChange(m); });
  requestAnimationFrame(() => set(cur, false)); set(cur, false);
  return {get: () => cur, set: m => set(m, true), setQuiet: m => { cur = sngWheelClamp(m); list.scrollTo({top: top(cur)}); mark(cur); }};
}
function sngHearNote(m){ try { sngPlayMelody([{midi: m, t: 0, d: 1.4}], 60, {tone: 'piano'}); } catch(e){} }
/* ---------- the range: two wheels, what they mean, and the finder ---------- */
function sngRangeHTML(lo, hi){
  return `<div class="sng-rangebox">
    <div class="sng-wheels">${sngWheelHTML('lo', 'lowest comfortable note', lo)}
      <div class="sng-wheel-mid"><b class="serif sng-wheel-range" id="sngRangeNames"></b><span class="mono faint" id="sngRangeSpan"></span><span class="faint sm" id="sngRangeVoice"></span></div>
      ${sngWheelHTML('hi', 'highest comfortable note', hi)}</div>
    <p class="faint sm">Scroll a wheel — each note sounds as it lands. Sing along, and stop where it stops being comfortable (no straining).</p>
    <div class="sng-row"><button class="tbtn" data-rangehear>hear the two</button><button class="btn" data-rangefind>🎤 Find my range for me</button></div></div>`;
}
function sngRangeBind(host, o = {}){
  const box = host.querySelector('.sng-rangebox'); if(!box) return null;
  const state = {lo: sngWheelClamp(o.lo), hi: sngWheelClamp(o.hi)};
  const paint = () => { box.querySelector('#sngRangeNames').textContent = state.hi > state.lo ? `${sngNote(state.lo)} – ${sngNote(state.hi)}` : 'the top note has to be above the bottom one';
    box.querySelector('#sngRangeSpan').textContent = sngSpanSay(state.lo, state.hi); box.querySelector('#sngRangeVoice').textContent = sngVoiceGuess(state.lo, state.hi); if(o.onChange) o.onChange(state.lo, state.hi); };
  let heardAt = 0;
  const heard = m => { const t = Date.now(); if(t - heardAt < 120) return; heardAt = t; sngHearNote(m); };
  const wl = sngWheelBind(box.querySelector('[data-wheel="lo"]'), {value: state.lo, onChange: m => { state.lo = m; heard(m); paint(); }});
  const wh = sngWheelBind(box.querySelector('[data-wheel="hi"]'), {value: state.hi, onChange: m => { state.hi = m; heard(m); paint(); }});
  box.querySelector('[data-rangehear]').onclick = () => sngPlayMelody([{midi: state.lo, t: 0, d: 1}, {midi: state.hi, t: 1.2, d: 1}], 80, {tone: 'piano'});
  box.querySelector('[data-rangefind]').onclick = () => sngRangeFinder({lo: state.lo, hi: state.hi}, (lo, hi) => { state.lo = lo; state.hi = hi; wl.setQuiet(lo); wh.setQuiet(hi); paint(); });
  paint();
  return {get: () => ({lo: state.lo, hi: state.hi}), set: (lo, hi) => { state.lo = lo; state.hi = hi; wl.setQuiet(lo); wh.setQuiet(hi); paint(); }};
}
/* the small chip under the studio's title, on every page, to change it */
function sngRangeChipHTML(){
  const r = typeof studioVocalRange === 'function' ? studioVocalRange() : null;
  return `<button class="sng-rangechip" data-sngrange title="your vocal range — scroll to set it, or let the microphone find it">🎙 <span>${r ? esc(r.low) + ' – ' + esc(r.high) : 'set your range'}</span> <i>change</i></button>`;
}
function sngRangeModal(){
  const r = typeof studioVocalRange === 'function' ? studioVocalRange() : null, st = sngState().profile;
  const lo = r ? r.lowMidi : (sngMidiOf(st.lowNote) || 48), hi = r ? r.highMidi : (sngMidiOf(st.highNote) || 72);
  const m = openModal(`<h2>Your vocal range</h2><p class="muted" style="font-size:.9rem">The melody tools keep inside it and warn you when a line goes outside. It is the same range in the Jazz Studio.</p>${sngRangeHTML(lo, hi)}
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" id="sngRgNo">Cancel</button><button class="btn primary" id="sngRgOk">Keep this range</button></div>`, 'narrow');
  const rb = sngRangeBind(m, {lo, hi});
  m.querySelector('#sngRgNo').onclick = () => m.remove();
  m.querySelector('#sngRgOk').onclick = () => { const v = rb.get(); if(v.hi <= v.lo){ toast('The top note has to be above the bottom one.'); return; }
    if(typeof studioSetVocalRange === 'function') studioSetVocalRange(v.lo, v.hi); sngState().profile.onboarded = sngState().profile.onboarded; saveNow(); m.remove(); sound('success'); toast(`Range kept: ${sngNote(v.lo)} – ${sngNote(v.hi)}.`); rerender(); };
}

/* ---------- hearing a voice: YIN, a plain autocorrelation pitch finder ---------- */
function sngYin(buf, sr, fmin, fmax){
  fmin = fmin || 60; fmax = fmax || 1100;
  const n = buf.length, maxLag = Math.min((n >> 1) - 2, Math.floor(sr / fmin)), minLag = Math.max(2, Math.floor(sr / fmax));
  let sum = 0; for(let i = 0; i < n; i++) sum += buf[i] * buf[i];
  const rms = Math.sqrt(sum / n); if(rms < 0.01) return null;
  const W = n - maxLag - 1, cm = new Float32Array(maxLag + 2); cm[0] = 1; let run = 0;
  for(let tau = 1; tau <= maxLag + 1; tau++){ let s = 0; for(let i = 0; i < W; i++){ const x = buf[i] - buf[i + tau]; s += x * x; } run += s; cm[tau] = run ? s * tau / run : 1; }
  let tau = -1;
  for(let t = minLag; t < maxLag; t++){ if(cm[t] < 0.15){ while(t + 1 < maxLag && cm[t + 1] < cm[t]) t++; tau = t; break; } }
  if(tau < 0) return null;
  const a = cm[tau - 1], b = cm[tau], c = cm[tau + 1], den = 2 * (a - 2 * b + c), better = den ? tau + (a - c) / den : tau;
  return {f0: sr / better, clarity: 1 - b, rms};
}
const sngFreqMidi = f => 69 + 12 * Math.log2(f / 440);

/* ---------- Find my range ---------- */
function sngRangeFinder(start, onUse){
  const m = openModal(`<h2>Find my range</h2>
    <p class="muted" style="font-size:.9rem">Two ways. <b>Sing it</b>: the microphone names the note you hold and remembers the lowest and highest you held steady — it is listened to here, never recorded or sent anywhere. Or <b>by ear</b>, without the microphone.</p>
    <div class="sng-fr-tabs"><button class="chip sm on" data-frm="mic">🎤 Sing it</button><button class="chip sm" data-frm="ear">🎹 By ear</button></div>
    <div id="frBody"></div>
    <div class="row between" style="margin-top:12px"><span class="faint sm" id="frVoice"></span><span class="row" style="gap:8px"><button class="btn ghost" id="frNo">Cancel</button><button class="btn primary" id="frUse" disabled>Use this range</button></span></div>`, 'narrow');
  const res = {lo: null, hi: null, trim: true}; let stopListen = null, earWheel = null;
  const final = () => { if(res.lo == null || res.hi == null || res.hi <= res.lo) return null; const t = res.trim && res.hi - res.lo >= 14 ? 2 : 0; return {lo: res.lo + t, hi: res.hi - t}; };
  const paintRes = () => { const f = final(), use = m.querySelector('#frUse'); use.disabled = !f;
    const out = m.querySelector('#frResult'); if(out){ out.innerHTML = res.lo == null && res.hi == null ? '<span class="faint">Nothing heard yet.</span>' :
      `reached <b>${res.lo != null ? esc(sngNote(res.lo)) : '…'}</b> to <b>${res.hi != null ? esc(sngNote(res.hi)) : '…'}</b>${f ? ` · comfortable range <b>${esc(sngNote(f.lo))} – ${esc(sngNote(f.hi))}</b>` : ''}`; }
    m.querySelector('#frVoice').textContent = f ? sngVoiceGuess(f.lo, f.hi) : ''; };
  const micBody = () => `<ol class="sng-fr-steps"><li>Press <b>Start listening</b> and sing a long “ah” on an easy middle note.</li><li>Slide <b>down</b> slowly. Hold the lowest note you can still sing <i>well</i> for a second.</li><li>Then slide <b>up</b>, and hold your highest comfortable note. Don’t strain — stop where it stops being nice.</li></ol>
    <div class="sng-fr-live"><div class="sng-fr-note serif" id="frNote">—</div><div class="sng-fr-cents mono faint" id="frCents">&nbsp;</div></div>
    <div class="sng-fr-keys" id="frKeys" aria-hidden="true"></div>
    <div class="sng-row"><button class="btn primary" id="frListen">🎤 Start listening</button><button class="tbtn" id="frReset">start again</button><label class="faint sm"><input type="checkbox" id="frTrim" checked> pull in 2 semitones from each end (the comfortable part)</label></div>
    <p class="faint sm" id="frMsg"></p><p id="frResult"></p>`;
  const earBody = () => `<p class="muted sm">Scroll to a note — it sounds. Sing along with it. Mark the lowest note you can sing comfortably, and the highest.</p>
    <div class="sng-wheels one">${sngWheelHTML('ear', 'a note to sing along with', res.lo != null ? res.lo : start.lo)}</div>
    <div class="sng-row" style="justify-content:center"><button class="btn" id="frLow">this is my lowest</button><button class="btn" id="frHigh">this is my highest</button></div><p id="frResult"></p>`;
  const keys = () => { const k = m.querySelector('#frKeys'); if(!k) return; const n = SNG_WHEEL.hi - SNG_WHEEL.lo + 1;
    k.innerHTML = [...Array(n)].map((_, i) => `<i class="${sngBlackKey(SNG_WHEEL.lo + i) ? 'blk' : ''}${res.lo != null && res.hi != null && SNG_WHEEL.lo + i >= res.lo && SNG_WHEEL.lo + i <= res.hi ? ' in' : ''}" data-k="${SNG_WHEEL.lo + i}"></i>`).join(''); };
  const mark = (midi) => { const k = m.querySelector('#frKeys'); if(!k) return; k.querySelectorAll('.now').forEach(x => x.classList.remove('now')); const t = k.querySelector(`[data-k="${midi}"]`); if(t) t.classList.add('now'); };
  const stopMic = () => { if(stopListen){ stopListen(); stopListen = null; } };
  const showMic = () => { stopMic(); m.querySelector('#frBody').innerHTML = micBody(); keys(); paintRes();
    const btn = m.querySelector('#frListen'), msg = m.querySelector('#frMsg');
    m.querySelector('#frTrim').onchange = e => { res.trim = e.target.checked; paintRes(); };
    m.querySelector('#frReset').onclick = () => { res.lo = res.hi = null; keys(); paintRes(); };
    btn.onclick = async () => {
      if(stopListen){ stopMic(); btn.textContent = '🎤 Start listening'; msg.textContent = 'Paused.'; return; }
      msg.textContent = 'Asking for the microphone…';
      try {
        stopListen = await sngVoiceListen(ev => {
          const note = m.querySelector('#frNote'), cents = m.querySelector('#frCents'); if(!note) return;
          if(ev.midi == null){ note.textContent = '—'; cents.innerHTML = '&nbsp;'; return; }
          const r = Math.round(ev.midi), c = Math.round((ev.midi - r) * 100);
          note.textContent = sngNote(r); cents.textContent = (c > 0 ? '+' : '') + c + '¢'; mark(r);
          if(ev.stable != null){ const s = ev.stable; let ch = false; if(res.lo == null || s < res.lo){ res.lo = s; ch = true; } if(res.hi == null || s > res.hi){ res.hi = s; ch = true; } if(ch){ keys(); paintRes(); mark(r); } }
        });
        btn.textContent = '■ Stop'; msg.textContent = 'Listening — sing.';
      } catch(e){ stopListen = null; msg.textContent = 'The microphone is not available here (' + (e && e.name ? e.name : 'blocked') + '). Use “By ear” instead.'; }
    }; };
  const showEar = () => { stopMic(); m.querySelector('#frBody').innerHTML = earBody(); paintRes();
    let at = 0;
    earWheel = sngWheelBind(m.querySelector('[data-wheel="ear"]'), {value: res.lo != null ? res.lo : start.lo, onChange: v => { const t = Date.now(); if(t - at > 120){ at = t; sngHearNote(v); } }});
    m.querySelector('#frLow').onclick = () => { res.lo = earWheel.get(); if(res.hi != null && res.hi <= res.lo) res.hi = null; paintRes(); };
    m.querySelector('#frHigh').onclick = () => { res.hi = earWheel.get(); if(res.lo != null && res.lo >= res.hi) res.lo = null; paintRes(); }; };
  m.querySelectorAll('[data-frm]').forEach(b => b.onclick = () => { m.querySelectorAll('[data-frm]').forEach(x => x.classList.toggle('on', x === b)); b.dataset.frm === 'mic' ? showMic() : showEar(); });
  const close = () => { stopMic(); m.remove(); };
  m.querySelector('.close').onclick = close; m.querySelector('#frNo').onclick = close;
  m.querySelector('#frUse').onclick = () => { const f = final(); if(!f) return; stopMic(); m.remove(); sound('success'); onUse(f.lo, f.hi); };
  new MutationObserver(() => { if(!m.isConnected) stopMic(); }).observe(document.getElementById('modals'), {childList: true});
  showMic();
}
/* the microphone, as a stream of {midi, stable}: midi is what is sounding now (null in silence); stable is set,
   once, when a note has been held steady for about half a second */
async function sngVoiceListen(onEvent){
  const stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false}});
  const ctx = new (window.AudioContext || window.webkitAudioContext)(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser();
  an.fftSize = 4096; src.connect(an);
  const buf = new Float32Array(an.fftSize), hist = []; let held = null;
  const tick = () => {
    an.getFloatTimeDomainData(buf);
    const r = sngYin(buf, ctx.sampleRate, 60, 1100);
    if(!r || r.clarity < 0.8){ hist.length = 0; held = null; onEvent({midi: null, stable: null}); return; }
    const midi = sngFreqMidi(r.f0); hist.push(midi); if(hist.length > 8) hist.shift();
    let stable = null;
    if(hist.length === 8){ const s = hist.slice().sort((a, b) => a - b), med = s[4]; if(s[7] - s[0] < 0.7){ const note = Math.round(med); if(held !== note){ held = note; stable = note; } } else held = null; }
    onEvent({midi, stable});
  };
  const timer = setInterval(tick, 60);
  return () => { clearInterval(timer); try { stream.getTracks().forEach(t => t.stop()); } catch(e){} try { ctx.close(); } catch(e){} };
}
