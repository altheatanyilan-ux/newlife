/* ============================================================
   HEARING THE PIANO — the room for it (Jazz Studio › Piano input).

   Where the input is chosen and started, where you can see what it hears,
   try the Verify Engine on a chord, and — the part that matters most for
   now — measure it on recordings of your own piano before anything is
   built on top of it.

   THE HARNESS. You give it a recording and the MusicXML of what you played
   in it (a scale, a ii–V–I in voicings, the Charleston, a melody over left
   hand chords). The recording sync engine the house already has
   (19-sync-*.js) finds where every written note falls in the recording;
   the Verify Engine is then run over the recording exactly as it would run
   live — told, a moment before each chord, what that chord should be — and
   what it decided is compared with what was written:

     note-level precision, recall and F1, a note counting as found when it
     is reported within ±50 ms of where it was played;
     chord verification: for each step of two to five notes, whether the
     engine's pass/fail was right — and, so that "pass" is not the only
     answer it is ever asked for, each step is asked about a second time
     with one of its notes moved a semitone, which the right answer fails;
     the latency the engine would have live;
   and all of it split by register (bass below C3, middle to C5, treble)
   and by the pedal, which you say was on or off for the take.

   It is an honest measure only if the recording is of what the MusicXML
   says: a wrong note you really played counts against the engine.
   ============================================================ */

function jazzPianoInHTML(){
  const L = listenState();
  const act = listenActive();
  const devs = Object.entries(L.devices);
  const lvl = _li.level;
  const runs = L.harness.slice(-6).reverse();
  return `<div class="li-page">
    <div class="jz-crumbs"><a href="#/jazz">Jazz Studio</a> <span>›</span> <span>Piano input</span></div>
    <h1 class="serif">Piano input</h1>
    <p class="li-lede">Play a real piano and the studio hears it: through the microphone, or from a MIDI keyboard if one is plugged in.
      Everything is analysed on this device as it arrives. No sound is recorded, kept or sent anywhere.</p>

    <section class="li-card">
      <div class="li-row">
        <div class="li-seg" role="radiogroup" aria-label="Input">${[['auto', 'Auto'], ['mic', 'Microphone'], ['midi', 'MIDI keyboard']].map(([k, n]) =>
          `<button class="${L.source === k ? 'on' : ''}" data-lisrc="${k}" role="radio" aria-checked="${L.source === k}">${n}</button>`).join('')}</div>
        <button class="btn ${act ? '' : 'primary'}" id="liGo">${act ? 'Stop listening' : 'Start listening'}</button>
      </div>
      <div class="li-status" id="liStatus">${act === 'mic' ? '<span class="li-dot"></span> Listening through the microphone'
        : act === 'midi' ? '<span class="li-dot"></span> Reading the MIDI keyboard'
        : '<span class="faint">Not listening. Auto uses a MIDI keyboard when one is connected, otherwise the microphone.</span>'}</div>
      ${act === 'mic' ? `<div class="li-meter"><i id="liMeter"></i><b id="liFloor"></b></div>
        <div class="li-facts" id="liFacts">${listenFactsHTML(lvl)}</div>` : ''}
    </section>

    <section class="li-card">
      <h2 class="serif">What it hears</h2>
      <div class="li-heard" id="liHeard">${listenHeardHTML()}</div>
    </section>

    <section class="li-card">
      <h2 class="serif">Check a chord</h2>
      <p class="faint">Name the notes (or pick a voicing), play them, and the Verify Engine says what it found.</p>
      <div class="li-row">
        <input class="inp" id="liExp" value="${esc(L.lastExp || 'F4 C5')}" placeholder="F4 C5" aria-label="Expected notes">
        ${[['Dm7 shell', 'F4 C5'], ['G7 type A', 'F4 A4 B4 E5'], ['Cmaj7 drop 2', 'G3 E4 B4 C5'], ['C major triad', 'C4 E4 G4']].map(([n, v]) =>
          `<button class="tbtn" data-lipre="${v}">${n}</button>`).join('')}
      </div>
      <div class="li-row">
        <label>Match <select class="sel" id="liMode"><option value="exact"${L.mode === 'exact' ? ' selected' : ''}>exact octaves</option>
          <option value="pitch-class"${L.mode === 'pitch-class' ? ' selected' : ''}>note names, any octave</option></select></label>
        <label>Strictness <select class="sel" id="liStrict">${['lenient', 'standard', 'strict'].map(k =>
          `<option value="${k}"${L.strictness === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
      </div>
      <div class="li-verdict" id="liVerdict"><span class="faint">${act ? 'Play the chord.' : 'Start listening first.'}</span></div>
    </section>

    <section class="li-card">
      <h2 class="serif">Your piano</h2>
      ${devs.length ? devs.map(([k, d]) => `<div class="li-dev"><b>${esc(d.label || 'Microphone')}</b>
        <span>tuning ${d.cents > 0 ? '+' : ''}${(+d.cents || 0).toFixed(0)} cents from A = 440</span>
        <span>${Object.keys(d.templates || {}).length} notes learned</span>
        <span>${Object.keys(d.inharm || {}).length} of 8 octaves' string stretch measured</span></div>`).join('')
        : '<p class="faint">Nothing learned yet. The tuning, the stretch of the strings and the sound of each note are picked up as you play — nothing to calibrate.</p>'}
    </section>

    ${(() => { const ps = ((jazzState().compose || {}).pieces || []).filter(p => p.xml);
      const notes = ps.reduce((n, p) => n + ((p.xml.match(/<note[ >]/g) || []).length), 0), fixed = ps.reduce((n, p) => n + (p.edits || []).length, 0);
      return ps.length ? `<section class="li-card"><h2 class="serif">How much Compose needed correcting</h2><p>${fixed} hand correction${fixed === 1 ? '' : 's'} across ${ps.length} piece${ps.length === 1 ? '' : 's'} (${notes} written notes${notes ? `, ${Math.round(100 * fixed / notes)}%` : ''}).</p></section>` : ''; })()}
    <section class="li-card">
      <h2 class="serif">How well does it hear my piano?</h2>
      <p class="faint">A recording of your piano and the MusicXML of what you played in it. The recording is read here and let go; nothing is stored but the numbers.</p>
      <div class="li-row">
        <label class="li-file">Recording <input type="file" id="liHAudio" accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"></label>
        <label class="li-file">MusicXML <input type="file" id="liHXml" accept=".musicxml,.xml,.mxl"></label>
        <label><input type="checkbox" id="liHPedal"> pedal down for most of it</label>
        <button class="btn primary" id="liHRun">Measure</button>
      </div>
      <div class="li-hprog" id="liHProg"></div>
      <div id="liHOut">${runs.length ? runs.map(listenHarnessRowHTML).join('') : ''}</div>
    </section>
  </div>`;
}
function listenFactsHTML(lvl){
  const m = _li.mic;
  if(!lvl) return '<span>Measuring the room…</span>';
  const t = m ? m.dev.cents : 0;
  return `<span>${lvl.measuring ? 'Measuring the room…' : `room noise ${lvl.floorDb.toFixed(0)} dB`}</span>
    <span>tuning ${lvl.tuning > 0 ? '+' : ''}${(lvl.tuning != null ? lvl.tuning : t || 0).toFixed(0)} ¢</span>`;
}
function listenHeardHTML(){
  const r = listenRecent(24);
  if(!r.length) return '<span class="faint">Nothing yet.</span>';
  return r.slice().reverse().map(e => `<span class="li-note" style="--c:${Math.round(e.confidence * 100)}%"
    title="${e.source} · confidence ${Math.round(e.confidence * 100)}% · velocity ${Math.round(e.velocity * 100)}%">${listenNoteName(e.pitch)}</span>`).join('');
}
function listenVerdictHTML(r){
  const v = r.verify, nm = p => typeof p === 'number' && p > 11 ? listenNoteName(p) : LI_NAMES[p];
  return `<div class="li-v ${v.pass ? 'ok' : 'no'}">${v.pass ? 'Right' : 'Not yet'}</div>
    <div class="li-vrow">${v.present.map(p => `<span class="li-chip ok">${nm(p)}</span>`).join('')}
      ${v.missing.map(p => `<span class="li-chip miss" title="expected, not heard">${nm(p)}</span>`).join('')}
      ${v.extra.map(p => `<span class="li-chip extra" title="heard, not expected">${listenNoteName(p)}</span>`).join('')}</div>
    <div class="faint li-vmeta">${r.source === 'mic' ? 'microphone' : 'MIDI'} · answered ${Math.max(0, Math.round((r.latency || 0) * 1000))} ms after the attack</div>`;
}
function listenHarnessRowHTML(h){
  const pc = v => v == null ? '—' : Math.round(v * 100) + '%';
  const cell = x => x ? `F1 ${pc(x.f)} <span class="faint">(P ${pc(x.p)} R ${pc(x.r)}, ${x.n})</span>` : '—';
  return `<div class="li-hrun">
    <div class="li-hhead"><b>${esc(h.name)}</b> <span class="faint">${esc((h.at || '').slice(0, 16).replace('T', ' '))} · ${h.pedal ? 'pedal' : 'no pedal'} · ${h.duration}s</span></div>
    <table class="li-htab"><tbody>
      <tr><th>All notes</th><td>${cell(h.all)}</td></tr>
      <tr><th>Bass · middle · treble</th><td>${cell(h.reg.bass)}<br>${cell(h.reg.middle)}<br>${cell(h.reg.treble)}</td></tr>
      <tr><th>Chords (2–5 notes)</th><td>${h.chords.n ? `${pc(h.chords.right / h.chords.n)} right of ${h.chords.n} decisions` : 'no chords in this take'}
        ${h.chords.mid ? `<br><span class="faint">middle register: ${pc(h.chords.mid.right / h.chords.mid.n)} of ${h.chords.mid.n}</span>` : ''}</td></tr>
      <tr><th>Latency</th><td>${h.latencyMs} ms after the attack <span class="faint">(${h.computeMs} ms of it arithmetic)</span></td></tr>
      <tr><th>Timing</th><td>onsets ${h.onsetMs >= 0 ? '+' : ''}${h.onsetMs} ms from where the notes were played, on average</td></tr>
      ${h.tx ? `<tr><th>Transcribed, told nothing</th><td>${h.tx.error ? esc(h.tx.error) : `${cell(h.tx.all)}<br><span class="faint">bass ${cell(h.tx.reg.bass)} · middle ${cell(h.tx.reg.middle)} · treble ${cell(h.tx.reg.treble)} · ${(h.tx.ms / 1000).toFixed(1)} s for ${h.duration} s</span>`}</td></tr>` : ''}
    </tbody></table>
    ${h.worst && h.worst.length ? `<div class="faint">Hardest notes: ${h.worst.map(w => `${esc(w.name)} (${w.missed} of ${w.n} missed)`).join(', ')}</div>` : ''}
  </div>`;
}

/* ---------- the harness ---------- */
async function listenHarnessRun(audioFile, xmlFile, opts, step){
  const say = (t, f) => step && step(t, f);
  say('Reading the MusicXML…', 0.02);
  const xml = await readMusicXmlFile(xmlFile);
  const tl = musicXmlTimeline(xml);
  if(!tl || !tl.events || !tl.events.length) throw new Error('There are no notes in that MusicXML.');
  say('Decoding the recording…', 0.05);
  const audio = await syncDecodeForEngine(await audioFile.arrayBuffer());
  if(audio.duration > 600) throw new Error('Keep test recordings under ten minutes.');
  say('Finding where each written note falls in the recording…', 0.1);
  const score = syncScoreFromMusicXml(tl);
  /* the aligner takes its samples into its Worker (transferred, not copied),
     which would leave nothing here to listen to afterwards: it gets a copy */
  const res = await syncAlign({pcm: audio.pcm.slice(), sr: audio.sr}, score, {onProgress: (t, f) => say(t, f != null ? 0.1 + f * 0.5 : null)});
  const alt = res.diagnostics.alternate, chosen = alt ? (score.alternates || []).find(a => a.how === alt) || score : score;
  const map = syncMapNew(Object.assign({}, res.syncMap, {reading: {how: chosen.how || 'as written', order: chosen.order}}));
  const rec = {map: JSON.parse(syncMapExport(map)).maps[0]};
  const tim = syncTiming(rec, tl, 100);
  if(!tim) throw new Error('The recording could not be matched to the score.');
  /* that timing is the player's, and counts from the first bar; where the
     first bar starts in the recording is added back */
  const toR = syncPerfToReading(rec.map, tl) || [];
  const firstM = toR.find(m => m != null);
  const lead = firstM != null ? scoreToAudioTime(rec.map, 1, firstM, 1) : 0;
  const start = isFinite(lead) && lead != null ? lead - tim.T(tl.perf[0] ? tl.perf[0].q0 : 0) : 0;
  /* the written notes, where they fell */
  const notes = tl.events.filter(e => !e.chord && !e.perc && e.midi != null)
    .map(e => ({midi: e.midi, t: start + tim.T(e.q)})).filter(n => isFinite(n.t) && n.t >= 0 && n.t <= audio.duration).sort((a, b) => a.t - b.t);
  if(opts && opts.debug) opts.debug.notes = notes.slice(0, 40).map(n => [n.midi, +n.t.toFixed(3)]);
  const steps = [];
  notes.forEach(n => { const s = steps[steps.length - 1]; if(s && n.t - s.t <= 0.035) s.notes.push(n); else steps.push({t: n.t, notes: [n]}); });
  say('Listening to the recording as it would live…', 0.62);
  const run = async perturb => {
    const an = ldCreate(audio.sr, {});
    const eo = {mode: 'exact', strictness: 'standard'};
    const got = [];
    let si = 0, ms = 0, evals = 0;
    const CH = 2048;
    for(let i = 0; i < audio.pcm.length; i += CH){
      const t = i / audio.sr;
      while(si < steps.length && steps[si].t - 0.08 <= t){
        const st = steps[si];
        an.expect(perturb ? perturb(st) : st.notes.map(n => n.midi), eo); si++;
      }
      const t0 = performance.now();
      const r = an.push(audio.pcm.subarray(i, i + CH));
      const dt = performance.now() - t0;
      r.forEach(e => { if(e.type === 'notes'){ got.push(e); evals++; ms += dt; } });
      if((i / CH) % 400 === 0) await new Promise(res => setTimeout(res, 0));
    }
    an.flush().forEach(e => { if(e.type === 'notes') got.push(e); });
    return {got, computeMs: evals ? ms / evals : 0};
  };
  const A = await run(null);
  say('Asking it again, about chords that were not played…', 0.8);
  /* the same steps, each with one note moved a semitone: the right answer is "no" */
  const moved = new Map();
  const B = await run(st => { const ps = st.notes.map(n => n.midi); if(ps.length < 2 || ps.length > 5) return ps;
    const j = Math.floor(ps.length / 2); let q = ps[j] + 1; if(ps.includes(q)) q = ps[j] - 1; const out = ps.slice(); out[j] = q; moved.set(st, out); return out; });
  say('Counting…', 0.97);
  const regOf = m => m < 48 ? 'bass' : m <= 72 ? 'middle' : 'treble';
  const T0 = () => ({tp: 0, fn: 0, fp: 0});
  const all = T0(), reg = {bass: T0(), middle: T0(), treble: T0()};
  const used = new Set(), errs = [], byPitch = {};
  notes.forEach(n => {
    const ei = A.got.findIndex((e, k) => Math.abs(e.t - n.t) <= 0.05 && e.notes.some(x => x.pitch === n.midi) && !used.has(k + ':' + n.midi));
    const bp = byPitch[n.midi] = byPitch[n.midi] || {n: 0, missed: 0}; bp.n++;
    if(ei >= 0){ used.add(ei + ':' + n.midi); all.tp++; reg[regOf(n.midi)].tp++; errs.push(A.got[ei].t - n.t); }
    else { all.fn++; reg[regOf(n.midi)].fn++; bp.missed++; }
  });
  A.got.forEach((e, k) => e.notes.forEach(x => {
    if(used.has(k + ':' + x.pitch)) return;
    if(notes.some(n => n.midi === x.pitch && Math.abs(e.t - n.t) <= 0.05)) return;
    all.fp++; reg[regOf(x.pitch)].fp++;
  }));
  const chords = {n: 0, right: 0, mid: {n: 0, right: 0}};
  const judge = (got, st, want) => {
    const ev = got.filter(e => Math.abs(e.t - st.t) <= 0.06).sort((a, b) => Math.abs(a.t - st.t) - Math.abs(b.t - st.t))[0];
    const pass = !!(ev && ev.verify && ev.verify.pass);
    const ok = pass === want; chords.n++; if(ok) chords.right++;
    if(st.notes.every(n => n.midi >= 48 && n.midi <= 84)){ chords.mid.n++; if(ok) chords.mid.right++; }
  };
  steps.filter(st => st.notes.length >= 2 && st.notes.length <= 5).forEach(st => { judge(A.got, st, true); if(moved.has(st)) judge(B.got, st, false); });
  const prf = x => { const p = x.tp + x.fp ? x.tp / (x.tp + x.fp) : null, r = x.tp + x.fn ? x.tp / (x.tp + x.fn) : null;
    return {p, r, f: p != null && r != null && p + r ? 2 * p * r / (p + r) : null, n: x.tp + x.fn}; };
  const worst = Object.entries(byPitch).filter(([, v]) => v.missed).sort((a, b) => b[1].missed / b[1].n - a[1].missed / a[1].n || b[1].missed - a[1].missed)
    .slice(0, 5).map(([p, v]) => ({name: listenNoteName(+p), missed: v.missed, n: v.n}));
  const h = {id: uid(), name: audioFile.name.replace(/\.[^.]+$/, ''), at: new Date().toISOString(), pedal: !!(opts && opts.pedal),
    duration: Math.round(audio.duration), all: prf(all), reg: {bass: prf(reg.bass), middle: prf(reg.middle), treble: prf(reg.treble)},
    chords: chords.n ? chords : {n: 0, right: 0}, computeMs: +A.computeMs.toFixed(1),
    latencyMs: Math.round(105 + 1024 / audio.sr * 1000 + A.computeMs),
    onsetMs: errs.length ? Math.round(errs.reduce((a, b) => a + b, 0) / errs.length * 1000) : 0, worst};
  if(!h.chords.mid || !h.chords.mid.n) delete h.chords.mid;
  /* the Transcribe Engine on the same take, told nothing: what Compose would write down */
  if(typeof txTranscribe === 'function'){
    say('Transcribing it, told nothing…', 0.985);
    try {
      const tx = await txTranscribe(audio.pcm.slice(), audio.sr, {});
      const tA = T0(), tR = {bass: T0(), middle: T0(), treble: T0()}, tu = new Set();
      notes.forEach(n => { const k = tx.notes.findIndex((x, i) => !tu.has(i) && x.pitch === n.midi && Math.abs(x.onset - n.t) <= 0.05);
        if(k >= 0){ tu.add(k); tA.tp++; tR[regOf(n.midi)].tp++; } else { tA.fn++; tR[regOf(n.midi)].fn++; } });
      tx.notes.forEach((x, i) => { if(tu.has(i)) return; tA.fp++; tR[regOf(x.pitch)].fp++; });
      h.tx = {all: prf(tA), reg: {bass: prf(tR.bass), middle: prf(tR.middle), treble: prf(tR.treble)}, ms: tx.ms, where: tx.where};
    } catch(e){ h.tx = {error: String(e.message || e)}; }
  }
  return h;
}

function bindJazzPianoIn(root){
  const L = listenState();
  const rer = () => { if(typeof rerender === 'function') rerender(); };
  root.querySelectorAll('[data-lisrc]').forEach(b => b.onclick = async () => {
    L.source = b.dataset.lisrc; saveNow();
    if(listenActive()){ try { await listenStart(); } catch(e){ toast(e.message, 5000); } }
    rer();
  });
  const go = root.querySelector('#liGo');
  if(go) go.onclick = async () => {
    if(listenActive()){ await listenStop(); rer(); return; }
    go.disabled = true; go.textContent = 'Starting…';
    try { await listenStart(); listenApplyExpect(root); }
    catch(e){ toast(e && e.name === 'NotAllowedError' ? 'The browser was not allowed to use the microphone.' : (e.message || 'Could not start listening.'), 6000); }
    rer();
  };
  const exp = root.querySelector('#liExp');
  if(exp) exp.onchange = () => { L.lastExp = exp.value; saveNow(); listenApplyExpect(root); };
  root.querySelectorAll('[data-lipre]').forEach(b => b.onclick = () => { exp.value = b.dataset.lipre; L.lastExp = exp.value; saveNow(); listenApplyExpect(root); });
  const mode = root.querySelector('#liMode'), strict = root.querySelector('#liStrict');
  if(mode) mode.onchange = () => { L.mode = mode.value; saveNow(); listenApplyExpect(root); };
  if(strict) strict.onchange = () => { L.strictness = strict.value; saveNow(); listenApplyExpect(root); };
  listenApplyExpect(root);
  /* live read-outs, for as long as this page is showing */
  const offs = [];
  offs.push(listenOn(() => { const h = document.getElementById('liHeard'); if(h) h.innerHTML = listenHeardHTML(); }));
  offs.push(listenOnVerify(r => { const v = document.getElementById('liVerdict'); if(v) v.innerHTML = listenVerdictHTML(r); }));
  offs.push(listenOnLevel(l => {
    const m = document.getElementById('liMeter'), f = document.getElementById('liFloor'), facts = document.getElementById('liFacts');
    if(!l) return;
    if(m) m.style.width = Math.max(0, Math.min(100, (l.db + 70) / 60 * 100)) + '%';
    if(f) f.style.left = Math.max(0, Math.min(100, (l.floorDb + 70) / 60 * 100)) + '%';
    if(facts) facts.innerHTML = listenFactsHTML(l);
  }));
  const stop = () => { if(document.getElementById('liHeard')) return; offs.forEach(o => o()); clearInterval(watch); };
  const watch = setInterval(stop, 1000);
  /* the harness */
  const run = root.querySelector('#liHRun');
  if(run) run.onclick = async () => {
    const a = root.querySelector('#liHAudio').files[0], x = root.querySelector('#liHXml').files[0];
    if(!a || !x){ toast('Choose a recording and the MusicXML of what was played in it.'); return; }
    const prog = root.querySelector('#liHProg');
    run.disabled = true;
    try {
      const h = await listenHarnessRun(a, x, {pedal: root.querySelector('#liHPedal').checked},
        (t, f) => { if(prog) prog.innerHTML = `<span>${esc(t)}</span>${f != null ? `<i style="width:${Math.round(f * 100)}%"></i>` : ''}`; });
      L.harness.push(h); if(L.harness.length > 40) L.harness.shift(); saveNow();
      if(prog) prog.innerHTML = '';
      const out = root.querySelector('#liHOut'); if(out) out.innerHTML = L.harness.slice(-6).reverse().map(listenHarnessRowHTML).join('');
    } catch(e){ console.warn(e); if(prog) prog.innerHTML = `<span class="li-err">${esc(e.message || String(e))}</span>`; }
    run.disabled = false;
  };
}
function listenApplyExpect(root){
  const exp = root.querySelector('#liExp');
  const notes = exp ? listenParseNotes(exp.value) : [];
  listenExpect(notes.length ? notes : null);
}
