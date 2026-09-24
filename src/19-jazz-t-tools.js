/* ============================================================
   CURRICULUM v3, SECTION 4 — THE FEATURES, WHERE THEY BELONG.

   Each feature has a room of its own for browsing, and appears on the
   exercise it serves, because that is where it is used:

     4B  the drone recorder on 1.10 Drone Improvisation; the two-track
         sing-then-play recorder on 1.11 Play What You Sing; the
         self-transcription player on the self-analysis; the COREA
         comparison on every transcription project.
     4C  the play-along on every tune in the library, and its own room.
     4D  the audiation room, and each stage's place on Gordon's ladder.
     4F  the songwriter's workspace inside Stage 11's module.
     4G  "The Space" before every session, practice time and play time
         told apart, and the Golden Tips on stages 1, 3, 6 and 9.

   4A (the lead-sheet flashcards) is in 19-jazz-u-leadcards.js, 4E is the
   DT track and 4H is Barry Harris's four exercises on Stage 8, both on
   the ladder.
   ============================================================ */

/* the document's own words for a Section 4 feature, from heading to heading */
function jazzV3FeatureText(code){
  const f = JAZZ_V3_DOC.features || [];
  const at = f.findIndex(b => b.h === 2 && b.t.indexOf(code) === 0);
  if(at < 0) return [];
  const out = [];
  for(let i = at + 1; i < f.length && !(f[i].h === 2); i++) out.push(f[i]);
  return out;
}
const jazzV3FeatureHTML = code => jazzV3FeatureText(code).map(b => b.h
  ? `<h3 class="serif jzt-h">${esc(b.t)}</h3>` : `<p>${esc(b.t)}</p>`).join('');

/* ---------- on an exercise: which tool it carries ---------- */
function jazzV3ToolOf(ex){
  if(!ex) return null;
  if(ex.tool) return ex.tool;
  const mat = typeof siskindMaterial === 'function' ? siskindMaterial(ex.id) : null;
  if(mat && mat.kind === 'transcribe') return 'corea';
  if(mat && mat.kind === 'selfana') return 'record';
  return null;
}
function jazzV3ToolHTML(ex){
  const tool = jazzV3ToolOf(ex);
  if(!tool) return '';
  const wrap = (title, body) => `<div class="jzt-tool" data-jztool="${esc(tool)}"><span class="sc">${esc(title)}</span>${body}</div>`;
  switch(tool){
    case 'drone': return wrap('Record over the drone · Section 4B', jazzRecToolHTML('drone', ex.id));
    case 'pwys': return wrap('Play what you sing · Section 4B', jazzRecToolHTML('pwys', ex.id));
    case 'record': return wrap('Record it, and listen back · Section 4B', jazzRecToolHTML('self', ex.id));
    case 'corea': return wrap('Your copy beside the original · Section 4B', jazzRecToolHTML('corea', ex.id));
    case 'cardsA': return wrap('The flashcards · Section 4A', `<p>Mode A flashes a chord symbol and gives you seconds to play it.</p>
      <button class="btn sm primary" data-jzgo="#/jazz/cards/A">Start Mode A</button>`);
    case 'cardsC': return wrap('Find the form · Section 4A', `<p>Mode C shows a whole lead sheet; you mark where each section starts.</p>
      <button class="btn sm primary" data-jzgo="#/jazz/cards/C">Start Mode C</button>`);
    case 'analysis': return wrap('The tunes to analyse · Section 7, Module 3',
      `<p>The worksheet's charts are in the tune database, with their patterns found and coloured.</p>
      <button class="btn sm primary" data-jzgo="#/jazz/analysis/${esc(ex.analysis || '')}">open the Harmonic Analysis tool</button>`);
    case 'songwriter': return wrap('Your song, three ways · Section 4F', jazzSongwriterHTML());
    default: return '';
  }
}
function jazzV3BindTools(root, ex){
  $$('[data-jzrec]', root).forEach(el => bindJazzRecTool(el));
  if(root.querySelector('#jswHost')) bindJazzSongwriter(root);
}

/* ---------- 4B: recording ---------- */
const JAZZ_REC_KINDS = {
  drone: {name: 'Drone improvisation', said: 'Record over the drone, play it back with its waveform, and compare sessions.'},
  pwys: {name: 'Play what you sing', said: 'Two tracks: sing a phrase, then play it. The two waveforms are laid over each other, with the notes each one found.'},
  self: {name: 'Self-transcription', said: 'Record a practice session. Play it back at 50, 75 or 100 per cent, loop a section, and export it.'},
  corea: {name: 'COREA', said: 'Load the original, record your copy, and play them together or one after the other.'}
};
function jazzRecToolHTML(kind, exId){
  return `<div class="jzr" data-jzrec="${esc(kind)}" data-jzrex="${esc(exId || '')}">
    <p class="faint jzr-said">${esc(JAZZ_REC_KINDS[kind].said)}</p>
    ${jazzCanRecord() ? '' : '<p class="jzr-warn">This browser cannot record from a microphone. Everything else here still works.</p>'}
    <div class="jzr-controls"></div><div class="jzr-list"></div></div>`;
}
const jazzRecsFor = (kind, exId) => jazzRecordings().filter(r => r.kind === kind && (!exId || r.exerciseId === exId));
function bindJazzRecTool(el){
  const kind = el.dataset.jzrec, exId = el.dataset.jzrex || null;
  const ui = jazzUi();
  const ctl = el.querySelector('.jzr-controls'), list = el.querySelector('.jzr-list');
  let rec = null, drone = null, stage = 0, pair = {};
  const keyPc = () => (JZE_KEY_PC[ui.key] ?? 0);
  const drawControls = () => {
    if(kind === 'drone') ctl.innerHTML = `
      <button class="btn sm ghost" data-a="drone">${drone ? '■ stop the drone' : `▶ drone on ${esc(jazzPretty(ui.key || 'C'))}`}</button>
      <button class="btn sm ${rec ? 'danger' : 'primary'}" data-a="rec" ${jazzCanRecord() ? '' : 'disabled'}>${rec ? '■ stop recording' : '● record over it'}</button>`;
    else if(kind === 'pwys') ctl.innerHTML = `
      <span class="jzr-step${stage === 0 ? ' on' : ''}">1. sing</span><span class="jzr-step${stage === 1 ? ' on' : ''}">2. play</span>
      <button class="btn sm ${rec ? 'danger' : 'primary'}" data-a="rec" ${jazzCanRecord() ? '' : 'disabled'}>${rec ? '■ stop'
        : stage === 0 ? '● record the phrase you sing' : '● record it on the piano'}</button>
      ${stage === 1 && !rec ? '<button class="tbtn" data-a="restart">start again</button>' : ''}`;
    else if(kind === 'corea') ctl.innerHTML = `
      <label class="btn sm ghost jzr-file">⬆ load the original<input type="file" accept="audio/*" data-a="orig" hidden></label>
      <button class="btn sm ${rec ? 'danger' : 'primary'}" data-a="rec" ${jazzCanRecord() ? '' : 'disabled'}>${rec ? '■ stop' : '● record your copy'}</button>`;
    else ctl.innerHTML = `<button class="btn sm ${rec ? 'danger' : 'primary'}" data-a="rec" ${jazzCanRecord() ? '' : 'disabled'}>${rec ? '■ stop recording' : '● record a session'}</button>`;
    $$('[data-a]', ctl).forEach(b => {
      if(b.dataset.a === 'orig') b.onchange = async () => {
        const f = b.files && b.files[0]; if(!f) return;
        const id = await jazzPutAudio(f);
        jazzAddRecording({kind: 'corea', role: 'original', exerciseId: exId, audioId: id, title: f.name});
        toast('The original is kept with this exercise.'); drawList();
      };
      else b.onclick = () => act(b.dataset.a);
    });
  };
  const act = async a => {
    if(a === 'drone'){ if(drone){ drone.stop(); drone = null; } else drone = jazzDrone(keyPc()); drawControls(); return; }
    if(a === 'restart'){ pair = {}; stage = 0; drawControls(); return; }
    if(a !== 'rec') return;
    if(!rec){
      try { rec = await jazzRecorder(); rec.start(); sound('click'); }
      catch(e){ rec = null; toast(e.message || 'The microphone is not available.'); }
      drawControls(); return;
    }
    const got = await rec.stop(); rec = null;
    const audioId = await jazzPutAudio(got.blob);
    if(kind === 'pwys'){
      if(stage === 0){ pair = {vocalId: audioId, vocalSeconds: got.seconds}; stage = 1; drawControls(); toast('Now play it.'); return; }
      jazzAddRecording({kind, exerciseId: exId, vocalId: pair.vocalId, pianoId: audioId, seconds: got.seconds, key: ui.key});
      pair = {}; stage = 0;
    } else jazzAddRecording({kind, role: kind === 'corea' ? 'copy' : null, exerciseId: exId, audioId, seconds: got.seconds,
      key: ui.key, drone: kind === 'drone' ? !!drone : undefined});
    if(drone && kind === 'drone'){ drone.stop(); drone = null; }
    sound('success'); drawControls(); drawList();
  };
  const drawList = () => {
    const recs = jazzRecsFor(kind, exId);
    if(!recs.length){ list.innerHTML = '<div class="empty">Nothing recorded here yet.</div>'; return; }
    list.innerHTML = recs.slice(0, 12).map(r => `<div class="jzr-item" data-rid="${esc(r.id)}">
      <div class="row between" style="align-items:baseline;gap:6px">
        <span class="mono">${esc(fmtDate(r.day, 'short'))} · ${esc(new Date(r.at).toTimeString().slice(0, 5))}${
          r.role ? ` · ${esc(r.role === 'original' ? 'the original' : 'your copy')}` : ''}${r.title ? ` · ${esc(r.title)}` : ''}${
          r.seconds ? ` · ${r.seconds}s` : ''}</span>
        <span class="row" style="gap:4px">${kind === 'drone' || kind === 'corea' ? `<label class="jz-gate mono"><input type="checkbox" data-cmp="${esc(r.id)}"> compare</label>` : ''}
          <button class="tbtn danger" data-del="${esc(r.id)}">delete</button></span></div>
      <canvas class="jzr-wave"></canvas>
      ${kind === 'pwys' ? '<div class="jzr-notes mono"></div>' : ''}
      <div class="jzr-play"></div></div>`).join('') + `<div class="jzr-compare"></div>`;
    recs.slice(0, 12).forEach(r => drawItem(list.querySelector(`[data-rid="${r.id}"]`), r));
    $$('[data-del]', list).forEach(b => b.onclick = async () => { await jazzRemoveRecording(b.dataset.del); drawList(); });
    $$('[data-cmp]', list).forEach(c => c.onchange = () => drawCompare());
  };
  const drawItem = async (box, r) => {
    const canvas = box.querySelector('canvas'), play = box.querySelector('.jzr-play');
    if(kind === 'pwys'){
      const [v, p] = await Promise.all([jazzGetAudio(r.vocalId), jazzGetAudio(r.pianoId)]);
      const [bv, bp] = await Promise.all([jazzDecode(v), jazzDecode(p)]);
      jazzDrawWaves(canvas, [bv, bp], ['var(--jzp-ton)', 'var(--jzp-iivi)'].map(cssColour));
      play.innerHTML = `${v ? '<span class="mono jzr-lab" style="--c:var(--jzp-ton)">voice</span><audio controls class="jzr-a"></audio>' : ''}
        ${p ? '<span class="mono jzr-lab" style="--c:var(--jzp-iivi)">piano</span><audio controls class="jzr-a"></audio>' : ''}`;
      const as = play.querySelectorAll('audio');
      if(v) as[0].src = URL.createObjectURL(v); if(p) as[v ? 1 : 0].src = URL.createObjectURL(p);
      const nv = r.vocalNotes || (bv ? jazzDetectPitches(bv).map(jazzMidiName) : []);
      const np = r.pianoNotes || (bp ? jazzDetectPitches(bp).map(jazzMidiName) : []);
      if(!r.vocalNotes && bv){ r.vocalNotes = nv; r.pianoNotes = np; saveNow(); }
      box.querySelector('.jzr-notes').innerHTML = `<span>sung: ${esc(nv.join(' ') || '—')}</span><span>played: ${esc(np.join(' ') || '—')}</span>`;
      return;
    }
    const blob = await jazzGetAudio(r.audioId);
    if(!blob){ play.innerHTML = '<span class="faint">The sound for this one is not in this browser.</span>'; return; }
    jazzDrawWaves(canvas, [await jazzDecode(blob)], [cssColour(r.role === 'original' ? 'var(--jzp-tri)' : 'var(--page-accent)')]);
    const url = URL.createObjectURL(blob);
    play.innerHTML = `<audio controls class="jzr-a" src="${url}"></audio>
      ${kind === 'self' || kind === 'drone' ? `<span class="row jzr-speeds">${[0.5, 0.75, 1].map(v =>
        `<button class="tbtn${v === 1 ? ' on' : ''}" data-rate="${v}">${v * 100}%</button>`).join('')}
        <button class="tbtn" data-ab="a">set A</button><button class="tbtn" data-ab="b">set B</button>
        <label class="jz-gate mono"><input type="checkbox" data-loop> loop A–B</label>
        <a class="tbtn" download="jazz-${esc(r.day)}-${esc(kind)}.webm" href="${url}">export</a></span>` : ''}`;
    const au = play.querySelector('audio');
    let A = 0, B = null;
    $$('[data-rate]', play).forEach(b => b.onclick = () => { au.playbackRate = +b.dataset.rate;
      try { au.preservesPitch = true; } catch(e){}
      $$('[data-rate]', play).forEach(x => x.classList.toggle('on', x === b)); });
    $$('[data-ab]', play).forEach(b => b.onclick = () => { if(b.dataset.ab === 'a') A = au.currentTime; else B = au.currentTime;
      b.textContent = `${b.dataset.ab.toUpperCase()} ${(b.dataset.ab === 'a' ? A : B).toFixed(1)}s`; });
    const loop = play.querySelector('[data-loop]');
    au.addEventListener('timeupdate', () => { if(loop && loop.checked && B != null && B > A && au.currentTime >= B){ au.currentTime = A; } });
  };
  const drawCompare = async () => {
    const ids = $$('[data-cmp]', list).filter(c => c.checked).map(c => c.dataset.cmp).slice(0, 2);
    const box = list.querySelector('.jzr-compare');
    if(ids.length < 2){ box.innerHTML = ''; return; }
    const recs = ids.map(id => jazzRecordings().find(r => r.id === id));
    const blobs = await Promise.all(recs.map(r => jazzGetAudio(r.audioId)));
    const bufs = await Promise.all(blobs.map(jazzDecode));
    box.innerHTML = `<span class="sc">Side by side</span><canvas class="jzr-wave tall"></canvas>
      <div class="row" style="gap:6px"><button class="btn sm ghost" data-both>▶ together</button>
      <button class="btn sm ghost" data-seq>▶ one after the other</button></div>`;
    jazzDrawWaves(box.querySelector('canvas'), bufs, ['var(--jzp-tri)', 'var(--jzp-iivi)'].map(cssColour));
    const players = blobs.map(b => { const a = new Audio(); if(b) a.src = URL.createObjectURL(b); return a; });
    box.querySelector('[data-both]').onclick = () => players.forEach(a => { a.currentTime = 0; a.play(); });
    box.querySelector('[data-seq]').onclick = () => { players[0].currentTime = 0; players[0].play(); players[0].onended = () => { players[1].currentTime = 0; players[1].play(); }; };
  };
  drawControls(); drawList();
  /* leaving the page stops what this started */
  const stopAll = () => { if(drone){ drone.stop(); drone = null; } if(rec){ rec.stop(); rec = null; } };
  addEventListener('hashchange', stopAll, {once: true});
}
/* a CSS variable's value, for the canvas */
function cssColour(v){
  const m = /var\((--[\w-]+)\)/.exec(v);
  if(!m) return v;
  return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || '#888';
}
/* the room: every recording, and a new one of any kind */
function jazzRecordHTML(){
  const all = jazzRecordings();
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Recording</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    <div class="jzt-doc">${jazzV3FeatureHTML('4B')}</div>
    <p class="mono faint">${all.length} recordings kept in this browser.</p>
    <div class="jzt-grid">${Object.keys(JAZZ_REC_KINDS).map(k => `<div class="jzt-tool"><span class="sc">${esc(JAZZ_REC_KINDS[k].name)}</span>
      ${jazzRecToolHTML(k, '')}</div>`).join('')}</div>`;
}
function bindJazzRecord(root){
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  $$('[data-jzrec]', root).forEach(el => bindJazzRecTool(el));
}

/* ---------- 4C: the play-along ---------- */
const JAZZ_PLAY_PRESETS = [
  {id: 'p-iivi', title: 'ii-V-I in C', key: 'C', chordProgression: 'Dm7|G7|CM7|CM7', category: 'standard', timeSignature: '4/4'},
  {id: 'p-blues', title: '12-bar blues in F (5.1)', key: 'F', chordProgression: 'F7|F7|F7|F7|Bb7|Bb7|F7|F7|C7|Bb7|F7|C7', category: 'blues', timeSignature: '4/4'},
  {id: 'p-jazzblues', title: 'Jazz blues in F (5.2)', key: 'F', chordProgression: 'F7|Bb7|F7|Cm7 F7|Bb7|Bo7|F7|Am7 D7|Gm7|C7|F7 D7|Gm7 C7', category: 'blues', timeSignature: '4/4'},
  {id: 'p-bird', title: 'Bird Blues in F (5.4)', key: 'F', chordProgression: 'FM7|Em7b5 A7|Dm7|Cm7 F7|Bb7|Bbm7 Eb7|Am7 D7|Abm7 Db7|Gm7|C7|FM7|Gm7 C7', category: 'blues', timeSignature: '4/4'},
  {id: 'p-minor', title: 'Minor ii-V-i in C (Stage 7)', key: 'Cm', chordProgression: 'Dm7b5|G7alt|Cm7|Cm7', category: 'standard', timeSignature: '4/4'},
  {id: 'p-rhythm', title: 'Rhythm changes in B♭ (Stage 8)', key: 'Bb', chordProgression: 'A: BbM7 G7|Cm7 F7|Dm7 G7|Cm7 F7|Fm7 Bb7|EbM7 Ab7|Dm7 G7|Cm7 F7 B: D7|D7|G7|G7|C7|C7|F7|F7', category: 'bebop', timeSignature: '4/4'},
  {id: 'p-modal', title: 'Modal: Dm7 and E♭m7 (Stage 10)', key: 'D Dorian', chordProgression: 'Dm7(8)|Ebm7(4)|Dm7(4)', category: 'modal', timeSignature: '4/4'},
  {id: 'p-waltz', title: 'Jazz waltz ii-V-I (Stage 6)', key: 'C', chordProgression: 'Dm7|G7|CM7|CM7', category: 'waltz', timeSignature: '3/4'},
  {id: 'p-bossa', title: 'Bossa ii-V-I (Stage 3)', key: 'C', chordProgression: 'Dm7|G7|CM7|CM7', category: 'bossa', timeSignature: '4/4'}];
const jazzPlayUi = () => S._jplay = S._jplay || {bpm: 120, semis: 0, swing: 0.62, layers: {bass: true, piano: true, drums: true}, click: false};
let _jzBand = null, _jzClick = null;
function jazzPlayAlongHTML(id){
  const u = jazzPlayUi();
  const tune = (id && (jazzTune(id) || JAZZ_PLAY_PRESETS.find(p => p.id === id))) || JAZZ_PLAY_PRESETS[0];
  u.id = tune.id;
  const tonic = jazzTuneTonic(tune);
  const toKey = JAZZ_TUNE_FLAT[((tonic.pc + u.semis) % 12 + 12) % 12];
  const style = tune.category === 'bossa' ? 'bossa' : /3\/4/.test(tune.timeSignature || '') ? 'waltz' : 'swing';
  const analysed = jazzTuneIndex().rows.filter(r => r.analyzed);
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Play-along</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    <div class="jzt-doc">${jazzV3FeatureHTML('4C')}</div>
    <div class="jzp-panel">
      <label class="pd-q"><span class="k">what to play over</span>
        <select class="sel" id="jpTune"><optgroup label="From the curriculum">${JAZZ_PLAY_PRESETS.map(p =>
          `<option value="${esc(p.id)}" ${p.id === tune.id ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</optgroup>
          <optgroup label="From the Real Book">${analysed.map(r => `<option value="${esc(r.id)}" ${r.id === tune.id ? 'selected' : ''}>${esc(r.title)}</option>`).join('')}</optgroup></select></label>
      <div class="jzp-row">
        <label class="pd-q"><span class="k">tempo <b class="mono" id="jpBpmV">${u.bpm}</b> bpm</span>
          <input type="range" min="40" max="300" step="2" id="jpBpm" value="${u.bpm}"></label>
        <label class="pd-q"><span class="k">key <b class="mono">${u.semis > 0 ? '+' : ''}${u.semis}</b> → ${esc(jazzPretty(toKey))}${tonic.minor ? ' minor' : ''}</span>
          <input type="range" min="-6" max="6" step="1" id="jpSemis" value="${u.semis}"></label>
        <label class="pd-q"><span class="k">swing <b class="mono" id="jpSwingV">${Math.round(u.swing * 100)}%</b></span>
          <input type="range" min="50" max="75" step="1" id="jpSwing" value="${Math.round(u.swing * 100)}"></label></div>
      <div class="row" style="gap:6px;flex-wrap:wrap;align-items:center">
        <button class="btn primary" id="jpGo">${_jzBand && _jzBand.running ? '■ Stop' : '▶ Play'}</button>
        ${['bass', 'piano', 'drums'].map(k => `<span class="jzp-layer"><label class="jz-gate mono"><input type="checkbox" data-jplayer="${k}" ${u.layers[k] ? 'checked' : ''}> ${k}</label>
          <button class="tbtn" data-jpsolo="${k}" title="hear only the ${k}">solo</button></span>`).join('')}
        <label class="jz-gate mono"><input type="checkbox" id="jpClick" ${u.click ? 'checked' : ''}> metronome on 2 and 4</label>
        <a class="btn sm ghost" href="${esc(jazzIrealLink(tune, toKey))}">iReal Pro ↗</a>
        <span class="mono faint">${esc(style)}</span></div>
      <p class="faint jzp-note">Solo track mode isolates one instrument. For a real recording, stem-separation tools such as
        Moises or LALAL.AI split a track into its instruments; this band is synthesised, so each instrument is already its own track.</p>
    </div>
    ${jazzChartHTML(tune, toKey, false)}`;
}
function bindJazzPlayAlong(root){
  const u = jazzPlayUi();
  const tune = jazzTune(u.id) || JAZZ_PLAY_PRESETS.find(p => p.id === u.id) || JAZZ_PLAY_PRESETS[0];
  const tonic = jazzTuneTonic(tune);
  const toKey = () => JAZZ_TUNE_FLAT[((tonic.pc + u.semis) % 12 + 12) % 12];
  const style = tune.category === 'bossa' ? 'bossa' : /3\/4/.test(tune.timeSignature || '') ? 'waltz' : 'swing';
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  const stop = () => { if(_jzBand){ _jzBand.stop(); _jzBand = null; } if(_jzClick){ _jzClick.stop(); _jzClick = null; }
    $$('.jt-bar.now', root).forEach(b => b.classList.remove('now')); const g = root.querySelector('#jpGo'); if(g) g.textContent = '▶ Play'; };
  root.querySelector('#jpTune').onchange = e => { stop(); navigate('#/jazz/playalong/' + e.target.value); };
  const bpm = root.querySelector('#jpBpm');
  bpm.oninput = () => { u.bpm = +bpm.value; root.querySelector('#jpBpmV').textContent = u.bpm;
    if(_jzBand) _jzBand.set('bpm', u.bpm); if(_jzClick) _jzClick.set('bpm', u.bpm); };
  const sw = root.querySelector('#jpSwing');
  sw.oninput = () => { u.swing = +sw.value / 100; root.querySelector('#jpSwingV').textContent = sw.value + '%'; if(_jzBand) _jzBand.set('swing', u.swing); };
  root.querySelector('#jpSemis').onchange = e => { u.semis = +e.target.value; stop(); rerender(); };
  $$('[data-jplayer]', root).forEach(c => c.onchange = () => { u.layers[c.dataset.jplayer] = c.checked; if(_jzBand) _jzBand.setLayer(c.dataset.jplayer, c.checked); });
  $$('[data-jpsolo]', root).forEach(b => b.onclick = () => { ['bass', 'piano', 'drums'].forEach(k => { u.layers[k] = k === b.dataset.jpsolo;
    const c = root.querySelector(`[data-jplayer="${k}"]`); if(c) c.checked = u.layers[k]; if(_jzBand) _jzBand.setLayer(k, u.layers[k]); }); });
  const click = root.querySelector('#jpClick');
  click.onchange = () => { u.click = click.checked; if(_jzBand){ if(u.click && !_jzClick){ _jzClick = jazzMetronome({bpm: u.bpm, beats: style === 'waltz' ? 3 : 4}); _jzClick.start(); } else if(!u.click && _jzClick){ _jzClick.stop(); _jzClick = null; } } };
  root.querySelector('#jpGo').onclick = () => {
    if(_jzBand && _jzBand.running){ stop(); return; }
    stop();
    const semis = jazzTuneShift(tune, toKey());
    _jzBand = jazzBand(jazzParseChart(tune.chordProgression), {bpm: u.bpm, swing: u.swing, semis, toKey: toKey(), style,
      layers: Object.assign({}, u.layers), onBar: n => { $$('.jt-bar.now', root).forEach(b => b.classList.remove('now'));
        const el = root.querySelector(`.jt-bar[data-bar="${n}"]`); if(el) el.classList.add('now'); }});
    _jzBand.start();
    if(u.click){ _jzClick = jazzMetronome({bpm: u.bpm, beats: style === 'waltz' ? 3 : 4}); _jzClick.start(); }
    root.querySelector('#jpGo').textContent = '■ Stop';
  };
  addEventListener('hashchange', stop, {once: true});
}

/* ---------- 4D: audiation ---------- */
function jazzAudState(){
  const j = jazzState();
  j.audiation = j.audiation && typeof j.audiation === 'object' ? j.audiation : {};
  j.audiation.log = Array.isArray(j.audiation.log) ? j.audiation.log : [];
  return j.audiation;
}
const jazzAudUi = () => S._jaud = S._jaud || {sym: null, phase: 'see', picked: []};
function jazzAudiationHTML(){
  const now = jazzNowStage();
  const u = jazzAudUi();
  if(!u.sym) u.sym = typeof jazzLeadSymbol === 'function' ? jazzLeadSymbol(now && now.id, true) : 'Cmaj7';
  const log = jazzAudState().log;
  const last = log.slice(0, 30), matched = last.filter(x => x.matched).length;
  const spec = jazzChordSpec(u.sym);
  const vo = spec ? jazzCompVoicing(spec, 60) : [];
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Audiation</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    <div class="jzt-doc">${jazzV3FeatureHTML('4D')}</div>
    <div class="jzv3-table-wrap"><table class="jzv3-table"><thead><tr><th>Gordon</th><th>Stage of audiation</th><th>Curriculum stages</th><th>What it asks</th></tr></thead>
      <tbody>${JAZZ_V3_AUDIATION.map(a => `<tr${a.stages.includes(String(now && now.id)) ? ' class="jzt-here"' : ''}><td class="mono">${a.n}</td><td>${esc(a.name)}</td>
        <td>${a.stages.map(s => `<span class="jt-stage${a.stages.includes(String(now && now.id)) && s === String(now.id) ? ' pri' : ''}">${esc(s === 'P0' ? '0' : s)}</span>`).join(' ')}</td><td>${esc(a.said)}</td></tr>`).join('')}</tbody></table></div>
    <div class="jzt-grid">
      <div class="jzt-tool"><span class="sc">Inner hearing</span>
        <p class="faint">See the symbol. Hear it inside before you touch anything. Then play it, then check against the sound.</p>
        <div class="jza-sym serif">${esc(jazzPrettyChord(u.sym))}</div>
        <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center">
          ${u.phase === 'see' ? '<button class="btn primary" data-jza="hear">I can hear it — now I will play it</button>'
          : u.phase === 'play' ? '<button class="btn primary" data-jza="reveal">▶ play me the chord</button>'
          : `<button class="btn primary" data-jza="yes">It matched what I heard</button><button class="btn ghost" data-jza="no">It did not</button>
            <button class="tbtn" data-jza="again">▶ again</button>`}
          <button class="tbtn" data-jza="next">another chord</button></div>
        <p class="mono faint" style="text-align:center">${last.length ? `${matched} of the last ${last.length} matched` : 'Starts at Cmaj7 and grows with your stage.'}</p></div>
      <div class="jzt-tool"><span class="sc">Chord to keyboard</span>
        <p class="faint">Map it in your head first. Press the keys you think it is, then show it.</p>
        <div class="jza-sym serif">${esc(jazzPrettyChord(u.sym))}</div>
        ${jazzKeyboardHTML(48, 72, u.phase === 'shown' ? vo : [], u.picked, 'jzaKb')}
        <div class="row" style="gap:6px;justify-content:center"><button class="btn sm ghost" data-jza="show">show it</button>
          <button class="tbtn" data-jza="clear">clear</button></div>
        ${u.phase === 'shown' && u.picked.length ? `<p class="mono" style="text-align:center">${
          jazzCheckPcs(u.picked, spec).ok ? 'Yes — the chord is in what you pressed.' : `Missing: ${esc(jazzCheckPcs(u.picked, spec).missing.join(' '))}`}</p>` : ''}</div>
    </div>`;
}
/* the pitch classes someone pressed, against the chord's required tones */
function jazzCheckPcs(midis, spec){
  if(!spec) return {ok: false, missing: []};
  const have = new Set(midis.map(m => ((m % 12) + 12) % 12));
  const need = spec.required.map(t => (spec.pc + t) % 12);
  const missing = need.filter(pc => !have.has(pc)).map(pc => JZ_NOTE_NAMES[pc]);
  const wrong = [...have].filter(pc => !spec.pcs.includes(pc) && pc !== spec.bassPc).map(pc => JZ_NOTE_NAMES[pc]);
  return {ok: !missing.length && !wrong.length, missing, wrong, score: need.length ? (need.length - missing.length) / need.length : 0};
}
/* a keyboard you can press, with some keys lit */
function jazzKeyboardHTML(lo, hi, lit, picked, id){
  const black = [1, 3, 6, 8, 10];
  const keys = [];
  for(let m = lo; m <= hi; m++) keys.push(m);
  const whites = keys.filter(m => !black.includes(m % 12));
  const w = 100 / whites.length;
  return `<div class="jzkb" id="${id || ''}">${keys.map(m => {
    const isB = black.includes(m % 12);
    const x = isB ? (whites.filter(k => k < m).length * w - w * 0.3) : whites.indexOf(m) * w;
    return `<button class="jzkb-k${isB ? ' b' : ''}${(lit || []).includes(m) ? ' lit' : ''}${(picked || []).includes(m) ? ' on' : ''}"
      style="left:${x}%;width:${isB ? w * 0.6 : w}%" data-kbm="${m}" title="${esc(jazzMidiName(m))}"></button>`; }).join('')}</div>`;
}
function bindJazzAudiation(root){
  const u = jazzAudUi();
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  $$('[data-kbm]', root).forEach(b => b.onclick = () => { const m = +b.dataset.kbm;
    u.picked = u.picked.includes(m) ? u.picked.filter(x => x !== m) : u.picked.concat(m);
    b.classList.toggle('on'); jazzPlayMidis([m]); });
  $$('[data-jza]', root).forEach(b => b.onclick = () => {
    const a = b.dataset.jza;
    if(a === 'hear') u.phase = 'play';
    else if(a === 'reveal' || a === 'again'){ jazzPlayChord(u.sym); u.phase = 'judge'; }
    else if(a === 'yes' || a === 'no'){ jazzAudState().log.unshift({day: today(), sym: u.sym, matched: a === 'yes'}); saveNow();
      u.sym = jazzLeadSymbol(jazzNowStage().id, false, {floor: 2}); u.phase = 'see'; u.picked = []; sound(a === 'yes' ? 'success' : 'click'); }
    else if(a === 'next'){ u.sym = jazzLeadSymbol(jazzNowStage().id, false, {floor: 2}); u.phase = 'see'; u.picked = []; }
    else if(a === 'show'){ u.phase = 'shown'; jazzPlayChord(u.sym); }
    else if(a === 'clear'){ u.picked = []; if(u.phase === 'shown') u.phase = 'see'; }
    rerender();
  });
}

/* ---------- 4G: psychology and mindset ---------- */
function jazzSpaceLog(){
  const j = jazzState();
  j.space = Array.isArray(j.space) ? j.space : [];
  return j.space;
}
/* practice time and play time, over the sessions of the last n days */
function jazzPracticePlay(days){
  const since = addDays(today(), -(days || 30));
  const s = jazzSessions().filter(x => x.day >= since);
  const play = sum(s.filter(x => x.mode === 'play').map(x => +x.minutes || 0));
  const practice = sum(s.filter(x => x.mode !== 'play').map(x => +x.minutes || 0));
  return {practice, play, ratio: practice + play ? Math.round(play / (practice + play) * 100) : 0};
}
function jazzPracticePlayHTML(){
  const p = jazzPracticePlay(30);
  if(!p.practice && !p.play) return '';
  return `<div class="jz-note jzt-pp"><span class="sc">Practice time and play time · last 30 days</span>
    <div class="jzt-ppbar"><i style="width:${100 - p.ratio}%"></i><b style="width:${p.ratio}%"></b></div>
    <p class="mono">${p.practice} min practising · ${p.play} min playing (${p.ratio}%)</p>
    <p class="faint">Werner: separate "practice time" (analytical, slow, repetitive) from "play time" (fearless, unedited, consequence-free).</p></div>`;
}
/* "The Space": before each session, sit at the piano, breathe, and play one note with no agenda */
function openJazzSpace(then){
  if(jazzState().settings.space === false){ then && then(); return null; }
  let left = 60, timer = null;
  const m = openModal(`<h2>The Space</h2>
    <p class="serif" style="font-size:1rem">Sit at the piano. Breathe. Play a single note or chord with no agenda —
      and listen to it: the sensation, the tone, the resonance.</p>
    <p class="faint" style="font-size:.8rem">Kenny Werner, Effortless Mastery — Curriculum v3, Section 4G.</p>
    <div class="jzt-space mono" id="jsLeft">1:00</div>
    <div class="row" style="justify-content:space-between;margin-top:14px;gap:8px;flex-wrap:wrap">
      <label class="jz-gate mono"><input type="checkbox" id="jsOff"> do not ask before sessions</label>
      <span class="row" style="gap:6px"><button class="btn sm ghost" id="jsSkip">skip</button>
      <button class="btn primary" id="jsGo">begin a minute</button></span></div>`, 'narrow');
  const done = sat => { clearInterval(timer); if(sat) { jazzSpaceLog().unshift({day: today(), seconds: 60 - left}); }
    if(m.querySelector('#jsOff').checked){ jazzState().settings.space = false; }
    saveNow(); m.remove(); then && then(); };
  m.querySelector('#jsSkip').onclick = () => done(false);
  m.querySelector('#jsGo').onclick = ev => {
    if(timer){ done(true); return; }
    ev.target.textContent = 'I am ready';
    timer = setInterval(() => { left--; const el = m.querySelector('#jsLeft'); if(el) el.textContent = `0:${String(Math.max(0, left)).padStart(2, '0')}`;
      if(left <= 0){ clearInterval(timer); sound('success'); } }, 1000);
  };
  return m;
}
function jazzMindsetHTML(){
  const golden = jazzStages().filter(s => s.goldenTip);
  const space = jazzSpaceLog();
  return `<div class="row between" style="align-items:baseline">
      <h1 class="serif" style="margin:0">Psychology &amp; mindset</h1>
      <button class="btn sm ghost" data-jzgo="#/jazz">← the roadmap</button></div>
    <div class="jzt-doc">${jazzV3FeatureHTML('4G')}</div>
    <div class="jzt-grid">
      <div class="jzt-tool"><span class="sc">The Space</span>
        <p>Before each session the practice room offers a minute of it.${jazzState().settings.space === false ? ' (Switched off — switch it back on below.)' : ''}</p>
        <p class="mono faint">${space.length} sat, ${space.filter(x => x.day === today()).length} today</p>
        <div class="row" style="gap:6px"><button class="btn sm primary" id="jmSpace">sit now</button>
          <label class="jz-gate mono"><input type="checkbox" id="jmAsk" ${jazzState().settings.space === false ? '' : 'checked'}> ask before every session</label></div></div>
      <div class="jzt-tool"><span class="sc">Golden Tips</span>
        ${golden.map(s => `<div class="jzv3-golden"><span class="jzv3-gi">✨</span><div><span class="sc">Stage ${esc(String(s.n))} — ${esc(s.name)}</span>
          <p class="serif">“${esc(s.goldenTip)}”</p></div></div>`).join('')}
        <button class="tbtn" id="jzAllTips">the forty-eight practice tips →</button></div>
    </div>
    ${jazzPracticePlayHTML()}`;
}
function bindJazzMindset(root){
  $$('[data-jzgo]', root).forEach(b => b.onclick = () => navigate(b.dataset.jzgo));
  root.querySelector('#jmSpace').onclick = () => openJazzSpace(() => rerender());
  root.querySelector('#jmAsk').onchange = e => { jazzState().settings.space = e.target.checked; saveNow(); };
  const t = root.querySelector('#jzAllTips'); if(t) t.onclick = () => openJazzTips();
}

/* ---------- 4F: the singer-songwriter's workspace ---------- */
const JAZZ_SONGWRITER_EXAMPLES = [
  {name: 'Secondary dominants', from: 'C|Am|F|G', to: 'C|A7|Dm|G7', said: 'C → C–A7–Dm–G7'},
  {name: 'Tritone substitutions', from: 'C|Am|F|G', to: 'C|Eb7|Dm|Db7|C', said: 'C–Eb7–Dm–Db7–C'},
  {name: 'Modal interchange', from: 'C|Am|F|G', to: 'C|Fm6|Am|G', said: 'C–Fm6–Am–G, borrowing from C minor'}];
function jazzSongwriterState(){
  const j = jazzState();
  j.songwriter = Array.isArray(j.songwriter) ? j.songwriter : [];
  return j.songwriter;
}
function jazzSongwriterHTML(){
  const songs = jazzSongwriterState();
  const chart = (s, title) => { const t = {title, key: 'C', chordProgression: s, category: 'standard'};
    return `<div class="jsw-chart">${jazzChartHTML(t, '', true)}<button class="tbtn" data-jswplay="${esc(s)}">▶ hear it</button></div>`; };
  return `<div id="jswHost">
    <p class="faint">Pop progressions (I–V–vi–IV, I–vi–IV–V) through three jazz techniques. Laufey, Bruno Major and
      Norah Jones apply jazz harmony to pop structures in exactly these ways.</p>
    <div class="jsw-ex">${JAZZ_SONGWRITER_EXAMPLES.map(e => `<div><b>${esc(e.name)}</b> <span class="mono faint">${esc(e.said)}</span>
      ${chart(e.to, e.name)}</div>`).join('')}</div>
    <h3 class="serif jzt-h">Your song, reharmonised three ways</h3>
    <p class="faint">"Practical output: Student takes their own song and creates 3 reharmonized versions." Bars split by |,
      chords by spaces.</p>
    ${songs.map(s => `<div class="jsw-song" data-jsw="${esc(s.id)}">
      <input class="inp" data-jswf="title" value="${esc(s.title)}" placeholder="the song">
      <label class="pd-q"><span class="k">as written</span><input class="inp mono" data-jswf="original" value="${esc(s.original)}"></label>
      ${[0, 1, 2].map(k => `<label class="pd-q"><span class="k">version ${k + 1}</span>
        <input class="inp mono" data-jswf="v${k}" value="${esc((s.versions || [])[k] || '')}"></label>`).join('')}
      <div class="row" style="gap:6px;flex-wrap:wrap">
        ${['original', 'v0', 'v1', 'v2'].map(k => `<button class="tbtn" data-jswhear="${k}">▶ ${k === 'original' ? 'as written' : 'version ' + (+k.slice(1) + 1)}</button>`).join('')}
        <button class="tbtn danger" data-jswdel>remove</button></div></div>`).join('')}
    <button class="btn sm ghost" id="jswAdd">+ a song</button></div>`;
}
function bindJazzSongwriter(root){
  const host = root.querySelector('#jswHost');
  const hear = str => { if(_jzBand) _jzBand.stop();
    _jzBand = jazzBand(jazzParseChart(str), {bpm: 84, loop: false, countIn: false, style: 'swing', swing: 0.55}); _jzBand.start(); };
  $$('[data-jswplay]', host).forEach(b => b.onclick = () => hear(b.dataset.jswplay));
  $$('[data-jsw]', host).forEach(box => {
    const s = jazzSongwriterState().find(x => x.id === box.dataset.jsw);
    $$('[data-jswf]', box).forEach(inp => inp.onchange = () => { const f = inp.dataset.jswf;
      if(/^v\d$/.test(f)){ s.versions = s.versions || ['', '', '']; s.versions[+f.slice(1)] = inp.value.trim(); } else s[f] = inp.value.trim();
      s.updated = today(); saveNow(); });
    $$('[data-jswhear]', box).forEach(b => b.onclick = () => { const k = b.dataset.jswhear;
      const str = k === 'original' ? s.original : (s.versions || [])[+k.slice(1)]; if(str) hear(str); else toast('Nothing written there yet.'); });
    box.querySelector('[data-jswdel]').onclick = () => { const j = jazzState(); j.songwriter = j.songwriter.filter(x => x.id !== s.id); saveNow(); rerender(); };
  });
  host.querySelector('#jswAdd').onclick = () => { jazzSongwriterState().push({id: uid(), title: '', original: 'C|Am|F|G', versions: ['', '', ''], updated: today()}); saveNow(); rerender(); };
}
