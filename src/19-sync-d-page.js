/* ============================================================
   RECORDING SYNC — IN THE REPERTOIRE ROOM

   A recording of the piece on the stand — your own from last week, or a
   pianist you are learning from — chosen from your own files and laid
   over the score by the engine (19-sync-b-engine.js, in a Worker). What
   comes back is a sync map: where in the audio every bar falls, however
   free the tempo. With it the score follows the recording, the bar being
   played lit on the page.

   PRIVATE. The file is a personal copy for practice. It is kept in this
   browser (the scoreAudio store, 06-db.js), read and analysed here, and
   never sent anywhere: not uploaded, not in a backup, not carried to the
   second machine. What can leave is the map, as JSON, and the map holds
   times and bar numbers, never a sample of the sound.

   ON THE SCORE ROW: x.recordings = [{id, name, file, size, duration,
   addedAt, map (the sync map, with its reading of the repeats), bpm,
   engineMs}]. The audio row has the same id.
   ============================================================ */

function syncRecDefaults(x){
  /* the same array kept, not a filtered copy: this runs whenever the piece
     is read, and an undo puts a recording back into the array it came from */
  if(!Array.isArray(x.recordings)) x.recordings = [];
  for(let i = x.recordings.length - 1; i >= 0; i--) if(!x.recordings[i] || typeof x.recordings[i] !== 'object') x.recordings.splice(i, 1);
  x.recordings.forEach(r => {
    r.id = r.id || uid();
    r.name = String(r.name || 'A recording');
    r.duration = +r.duration || 0;
    r.addedAt = r.addedAt || new Date().toISOString();
    if(!r.map || typeof r.map !== 'object') r.map = null;
  });
}

/* ---------- the audio, on this device only ---------- */
/* the audio of one recording of one piece: a row filed under another
   piece is not this one's, whatever its id */
async function syncAudioBlob(id, scoreId){
  try { const row = await db.scoreAudio.get(id);
    return row && row.blob && (!scoreId || row.scoreId === scoreId) ? row.blob : null; } catch(e){ return null; }
}
async function syncAudioPut(id, scoreId, file){
  await db.scoreAudio.put({id, scoreId, name: file.name || '', type: file.type || '', size: file.size || 0, blob: file, at: new Date().toISOString()});
}
/* Deleting is undoable for as long as the toast says so, so the audio goes
   only when the undo has run out; the function returned keeps it. A page
   closed in the meantime lets it go at once, as the deletes do. */
const _syncDropping = new Map();
function syncDropAudioLater(ids){
  const key = uid();
  const go = () => { _syncDropping.delete(key); ids.forEach(id => { try { db.scoreAudio.delete(id); } catch(e){} }); };
  const timer = setTimeout(go, (typeof UNDO_MS === 'number' ? UNDO_MS : 8000) + 2000);
  _syncDropping.set(key, {timer, go});
  return () => { clearTimeout(timer); _syncDropping.delete(key); };
}
window.addEventListener('beforeunload', () => { _syncDropping.forEach(d => { clearTimeout(d.timer); d.go(); }); });
function syncDropScoreAudio(scoreId){
  const x = (typeof scoreState === 'function' ? scoreState() : []).find(s => s.id === scoreId);
  const ids = x && Array.isArray(x.recordings) ? x.recordings.map(r => r.id) : [];
  return ids.length ? syncDropAudioLater(ids) : () => {};
}

/* ---------- what the room says about a map ---------- */
const syncClock = s => { s = Math.max(0, Math.round(+s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function syncKeySay(map){
  const t = map.transposition | 0, c = Math.round(map.tuningOffsetCents || 0);
  const names = {1: 'a semitone', 2: 'a tone', 3: 'a minor third', 4: 'a major third', 5: 'a fourth', 6: 'a tritone'};
  const key = !t ? 'in the written key' : `${names[Math.abs(t)] || Math.abs(t) + ' semitones'} ${t > 0 ? 'higher' : 'lower'}`;
  const tune = Math.abs(c) < 4 ? 'at A = 440' : `${Math.abs(c)}¢ ${c > 0 ? 'sharp' : 'flat'}`;
  return `${key}, ${tune}`;
}
/* one entry per bar played: where it starts, how sure the engine is */
function syncBars(map){
  const n = (map.form && map.form.measures) || 0, out = [];
  const pts = map.syncPoints || [];
  const byM = new Map();
  pts.forEach(p => { if(p.chorus === 1 && Math.abs(p.beat - 1) < 1e-6) byM.set(p.measure, p); });
  for(let m = 1; m <= n; m++){
    const p = byM.get(m), t = scoreToAudioTime(map, 1, m, 1);
    out.push({m, t, c: p ? +p.confidence || 0 : 0, guessed: !p || !!p.interpolated});
  }
  return out;
}
const syncSure = b => b.guessed || b.c < 0.35 ? 'guess' : b.c < 0.6 ? 'fair' : 'sure';
const SYNC_SURE_SAY = {sure: 'sure', fair: 'fairly sure', guess: 'a guess from its neighbours'};

/* the written bar each measure of the map is, and the place in the
   player's timeline it lights */
function syncReadingOrder(map, tl){
  const order = map.reading && Array.isArray(map.reading.order) ? map.reading.order : tl.order;
  return order.length === ((map.form && map.form.measures) || 0) ? order : null;
}
function syncPerfFor(order, tl){
  const byK = new Map();
  tl.perf.forEach(p => { if(!byK.has(p.k)) byK.set(p.k, []); byK.get(p.k).push(p); });
  const seen = new Map();
  return order.map(k => { const list = byK.get(k) || []; const n = seen.get(k) || 0; seen.set(k, n + 1);
    return list.length ? list[Math.min(n, list.length - 1)] : null; });
}

/* ---------- the panel ---------- */
const _syncJobs = new Map();      // score id → {name, text, fraction, error}
function syncRecordingsHTML(x){
  const job = _syncJobs.get(x.id);
  const recs = x.recordings || [];
  return `<div class="sy-recs">
    <p class="muted sy-lede">Sync a recording of this piece and the score follows it — each bar lit as it is played, however free the tempo.
      <span class="sy-private">The file stays on this device. It is never uploaded, and not in your backups.</span></p>
    ${job ? `<div class="sy-job${job.error ? ' err' : ''}" role="status" aria-live="polite">
      <div class="sy-job-n serif">${esc(job.name)}</div>
      ${job.error ? `<div class="sy-job-t">${esc(job.error)}</div><button class="tbtn" data-syjobclose>dismiss</button>`
        : `<div class="sy-job-t mono">${esc(job.text || 'Listening…')}</div>
      <div class="sy-prog"><i style="width:${Math.round(100 * Math.max(0.03, Math.min(1, job.fraction || 0)))}%"></i></div>`}
    </div>` : ''}
    <div class="sy-actions">
      <button class="btn sm primary" data-syadd ${job && !job.error ? 'disabled' : ''}>＋ Sync a recording</button>
      ${typeof txMicRecord === 'function' ? `<button class="btn sm" data-symic ${job && !job.error ? 'disabled' : ''} title="play it on the piano here; the microphone take is matched to the score like any recording, and kept as its rubato profile">${_syncMic ? '■ Stop — and follow it' : '● Record a performance'}</button>` : ''}
      <button class="tbtn" data-syimport title="a map exported from here, on this machine or another">⇧ load a map</button>
    </div>
    <input type="file" hidden data-syfile accept="audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.oga,.opus,.webm,.aif,.aiff">
    <input type="file" hidden data-symapfile accept="application/json,.json">
    <input type="file" hidden data-syrefile accept="audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.oga,.opus,.webm,.aif,.aiff">
    ${recs.length ? `<div class="sy-list">${recs.map(r => syncRecHTML(x, r)).join('')}</div>`
      : job ? '' : `<div class="empty sm">No recordings yet. Any file your browser can play will do — MP3, AAC, WAV, FLAC. A few minutes of piano takes a few seconds to follow.</div>`}
  </div>`;
}
function syncRecHTML(x, r){
  const map = r.map;
  if(!map) return `<div class="sy-rec" data-syrec="${esc(r.id)}"><div class="sy-rec-h"><span class="sy-rec-n serif">${esc(r.name)}</span>
    <button class="del-x inline" data-sydel="${esc(r.id)}" aria-label="remove it">×</button></div><div class="muted">This recording has no map.</div></div>`;
  const bars = syncBars(map);
  const count = {sure: 0, fair: 0, guess: 0}; bars.forEach(b => count[syncSure(b)]++);
  const on = _syncListen && _syncListen.rec.id === r.id;
  const how = map.reading && map.reading.how ? map.reading.how : 'as written';
  const numbers = syncBarNumbers(x, map);
  return `<div class="sy-rec${on ? ' on' : ''}" data-syrec="${esc(r.id)}">
    <div class="sy-rec-h"><span class="sy-rec-n serif" title="${esc(r.file || r.name)}">${esc(r.name)}</span>
      <span class="grow"></span><span class="mono faint">${syncClock(r.duration)}</span>
      <button class="del-x inline" data-sydel="${esc(r.id)}" aria-label="remove this recording">×</button></div>
    <div class="sy-facts">
      <span>repeats: ${esc(how === 'as written' ? 'taken as written' : how)}</span>
      ${r.bpm ? `<span>♩ ≈ ${Math.round(r.bpm)} on average</span>` : ''}
      <span>${esc(syncKeySay(map))}</span>
    </div>
    <div class="sy-strip" role="list" aria-label="each bar, and how sure the placing is">${bars.map((b, i) =>
      `<button class="sy-cell ${syncSure(b)}" role="listitem" data-syfrom="${esc(r.id)}" data-sym="${b.m}"
        title="m. ${esc(numbers[i] != null ? numbers[i] : b.m)} at ${syncClock(b.t)} — ${SYNC_SURE_SAY[syncSure(b)]}"
        aria-label="bar ${esc(numbers[i] != null ? numbers[i] : b.m)}, ${SYNC_SURE_SAY[syncSure(b)]}"></button>`).join('')}</div>
    <div class="sy-legend mono"><span><i class="sy-cell sure"></i>${count.sure} sure</span>
      ${count.fair ? `<span><i class="sy-cell fair"></i>${count.fair} fairly sure</span>` : ''}
      ${count.guess ? `<span><i class="sy-cell guess"></i>${count.guess} guessed</span>` : ''}</div>
    ${r.memory ? `<div class="sy-memory"><span class="mono faint">performance memory — every beat's timing, ${r.memory.notes || 0} notes' dynamics</span>${(() => { try { const tl = syncTimelineOf(x); return tl ? syncMemoryChartHTML(r, tl) : ''; } catch(e){ return ''; } })()}
      <div class="sy-rec-tools"><button class="btn sm" data-syperf="${esc(r.id)}" title="the score's own notes, at this performance's timing and dynamics — mute parts in the play bar to hear one alone">▶ Play the score as recorded</button>
        <button class="tbtn" data-symidi="${esc(r.id)}" title="a MIDI file of the score with this performance's timing and dynamics">⇩ MIDI as played</button></div></div>`
      : `<div class="sy-memory"><button class="tbtn" data-symemory="${esc(r.id)}">Build the performance memory</button> <span class="muted">timing and dynamics for every note, to play the score back as it was played</span></div>`}
    <div class="sy-missing" hidden>Its audio is not on this device. <button class="tbtn" data-syrefind="${esc(r.id)}">choose the file…</button></div>
    <div class="sy-rec-tools">
      <button class="btn sm${on ? ' primary' : ''}" data-sylisten="${esc(r.id)}" aria-pressed="${on ? 'true' : 'false'}">${on ? '■ Stop' : '▶ Listen along'}</button>
      <button class="tbtn${_syncClicks ? ' on' : ''}" data-syclicks aria-pressed="${_syncClicks ? 'true' : 'false'}"
        title="a click on every bar line, to hear whether the map is right">clicks on beat 1</button>
      <span class="grow"></span>
      <button class="tbtn" data-syexport="${esc(r.id)}" title="the map as JSON: bar times only, no audio">⇩ map</button>
    </div>
  </div>`;
}
/* bar numbers as the page prints them, for the strip's labels */
function syncBarNumbers(x, map){
  try {
    const tl = syncTimelineOf(x); if(!tl) return [];
    const order = syncReadingOrder(map, tl); if(!order) return [];
    return order.map(k => (tl.measures[k] || {}).number);
  } catch(e){ return []; }
}
const _syncTl = new WeakMap();
function syncTimelineOf(x){
  const c = _syncTl.get(x);
  if(c && c.xml === x.musicXml) return c.tl;
  if(!x.musicXml) return null;
  const tl = musicXmlTimeline(x.musicXml);
  _syncTl.set(x, {xml: x.musicXml, tl});
  return tl;
}
function syncPaint(x){
  const side = document.getElementById('scSide');
  if(side && scoreUi().side === 'recordings' && scoreOpenId() === x.id) scoreSidePaint(x);
  else { const tab = document.querySelector('[data-scside="recordings"]'); if(tab && scoreOpenId() === x.id) scoreSidePaint(x); }
}
/* the progress line alone, so the panel is not rebuilt at every step */
function syncPaintJob(x){
  const job = _syncJobs.get(x.id);
  const box = document.querySelector('#scSide .sy-job');
  if(!box || !job || job.error){ syncPaint(x); return; }
  const t = box.querySelector('.sy-job-t'); if(t) t.textContent = job.text || '';
  const bar = box.querySelector('.sy-prog i'); if(bar) bar.style.width = Math.round(100 * Math.max(0.03, Math.min(1, job.fraction || 0))) + '%';
}

/* a performance played here, through the microphone, becomes a recording like any other:
   aligned to the score, its timing and dynamics kept as the performance memory (its rubato profile) */
let _syncMic = null;
async function syncMicToggle(x){
  if(!_syncMic){
    try { if(typeof listenActive === 'function' && listenActive() === 'mic') await listenStop();
      _syncMic = await txMicRecord(); toast('Recording — play the piece. Press Stop when you finish.'); }
    catch(e){ _syncMic = null; toast(e.message || 'The microphone could not be opened.'); }
    syncPaint(x); return;
  }
  const m = _syncMic; _syncMic = null;
  const got = await m.stop();
  if(got.pcm.length < got.sr * 5){ toast('That was only a few seconds — too little to follow.'); syncPaint(x); return; }
  const file = new File([txWav(got.pcm, got.sr)], `Played here, ${new Date().toLocaleString()}.wav`, {type: 'audio/wav'});
  await syncRecordingAdd(x, file);
}
function bindSyncRecordings(root, x){
  $$('[data-symic]', root).forEach(b => b.onclick = () => syncMicToggle(x));
  const file = root.querySelector('[data-syfile]'), mapFile = root.querySelector('[data-symapfile]'), refile = root.querySelector('[data-syrefile]');
  const add = root.querySelector('[data-syadd]');
  if(add) add.onclick = () => file && file.click();
  if(file) file.onchange = () => { const f = file.files && file.files[0]; file.value = ''; if(f) syncRecordingAdd(x, f); };
  const imp = root.querySelector('[data-syimport]');
  if(imp) imp.onclick = () => mapFile && mapFile.click();
  if(mapFile) mapFile.onchange = async () => { const f = mapFile.files && mapFile.files[0]; mapFile.value = ''; if(f) syncMapLoad(x, await f.text()); };
  const close = root.querySelector('[data-syjobclose]');
  if(close) close.onclick = () => { _syncJobs.delete(x.id); syncPaint(x); };
  $$('[data-sydel]', root).forEach(b => b.onclick = () => {
    const r = (x.recordings || []).find(v => v.id === b.dataset.sydel); if(!r) return;
    if(_syncListen && _syncListen.rec.id === r.id) syncListenStop();
    requestDelete({label: r.name, node: b.closest('.sy-rec'), after: () => syncPaint(x),
      remove: () => { const back = spliceOut(x.recordings, v => v.id === r.id); const keep = syncDropAudioLater([r.id]); saveNow();
        return () => { keep(); back(); }; }});
  });
  $$('[data-sylisten]', root).forEach(b => b.onclick = () => {
    const r = (x.recordings || []).find(v => v.id === b.dataset.sylisten); if(!r) return;
    if(_syncListen && _syncListen.rec.id === r.id) syncListenStop(); else syncListen(x, r, null);
  });
  $$('[data-syfrom]', root).forEach(b => b.onclick = () => {
    const r = (x.recordings || []).find(v => v.id === b.dataset.syfrom); if(!r || !r.map) return;
    const t = scoreToAudioTime(r.map, 1, +b.dataset.sym, 1);
    syncListen(x, r, t == null ? null : Math.max(0, t - 0.4));
  });
  $$('[data-syclicks]', root).forEach(b => b.onclick = () => {
    _syncClicks = !_syncClicks;
    try { localStorage.setItem('syncClicks', _syncClicks ? '1' : '0'); } catch(e){}
    $$('[data-syclicks]', root).forEach(o => { o.classList.toggle('on', _syncClicks); o.setAttribute('aria-pressed', String(_syncClicks)); });
  });
  $$('[data-syexport]', root).forEach(b => b.onclick = () => {
    const r = (x.recordings || []).find(v => v.id === b.dataset.syexport); if(!r || !r.map) return;
    const json = syncMapExport(Object.assign({}, r.map, {pieceId: x.id, recordingId: r.id}));
    const blob = new Blob([json], {type: 'application/json'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${(x.title + ' - ' + r.name).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'recording'}.sync.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
  $$('[data-syperf]', root).forEach(b => b.onclick = () => syncPlayAsRecorded(x, b.dataset.syperf));
  $$('[data-symidi]', root).forEach(b => b.onclick = () => { const r = (x.recordings || []).find(v => v.id === b.dataset.symidi), tl = syncTimelineOf(x);
    const bar = syncBar(), muted = bar && bar._plx ? new Set(bar._plx.saved.muted || []) : null;
    const bytes = r && tl ? syncPerformanceMidi(r, tl, muted) : null; if(!bytes){ toast('That could not be written.'); return; }
    sngDownload(bytes, `${(x.title + ' - ' + r.name).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-')}.mid`); });
  $$('[data-symemory]', root).forEach(b => b.onclick = () => syncBuildMemory(x, b.dataset.symemory, b));
  let refind = null;
  $$('[data-syrefind]', root).forEach(b => b.onclick = () => { refind = b.dataset.syrefind; refile && refile.click(); });
  if(refile) refile.onchange = () => { const f = refile.files && refile.files[0]; refile.value = ''; if(f && refind) syncReattach(x, refind, f); };
  /* which recordings have their audio here: an imported map, or a backup
     restored on another machine, has none until the file is chosen */
  (x.recordings || []).forEach(async r => {
    const have = await syncAudioBlob(r.id, x.id);
    const card = root.querySelector(`[data-syrec="${CSS.escape(r.id)}"]`); if(!card) return;
    const miss = card.querySelector('.sy-missing'); if(miss) miss.hidden = !!have;
    const listen = card.querySelector('[data-sylisten]'); if(listen) listen.disabled = !have;
    $$('[data-syfrom]', card).forEach(c => c.disabled = !have);
  });
}

/* ---------- syncing a file ---------- */
async function syncRecordingAdd(x, file){
  if(_syncJobs.has(x.id) && !_syncJobs.get(x.id).error){ toast('One recording at a time — the last is still being followed.'); return; }
  if(!x.musicXml){ toast('This piece has no notation to follow.'); return; }
  const job = {name: file.name, text: 'Reading the file…', fraction: 0.01};
  _syncJobs.set(x.id, job); syncPaint(x);
  const step = (text, f) => { job.text = text; if(f != null) job.fraction = f; syncPaintJob(x); };
  try {
    const bytes = await file.arrayBuffer();
    step('Decoding the audio…', 0.02);
    let audio;
    try { audio = await syncDecodeForEngine(bytes); }
    catch(e){ throw new Error('This browser cannot read that file as audio. MP3, AAC (.m4a), WAV and FLAC are safest.'); }
    if(audio.duration < 5) throw new Error('That recording is only a few seconds long — too little to follow.');
    if(audio.duration > 45 * 60) throw new Error('That recording is longer than forty-five minutes. Trim it to the movement on the stand.');
    const tl = syncTimelineOf(x);
    if(!tl || !tl.playable) throw new Error('There are no notes in this score to follow.');
    const score = syncScoreFromMusicXml(tl);
    const id = uid();
    const res = await syncAlign({pcm: audio.pcm, sr: audio.sr}, score, {pieceId: x.id, recordingId: id, keepPcm: true, onProgress: (t, f) => step(t, f != null ? f * 0.9 : null)});
    step('Keeping it…', 0.98);
    const alt = res.diagnostics.alternate, chosen = alt ? (score.alternates || []).find(a => a.how === alt) || score : score;
    const map = syncMapNew(Object.assign({}, res.syncMap, {reading: {how: chosen.how || 'as written', order: chosen.order}}));
    await syncAudioPut(id, x.id, file);
    const rec = {id, name: file.name.replace(/\.[^.]+$/, '') || 'A recording', file: file.name, size: file.size,
      duration: Math.round(audio.duration * 100) / 100, addedAt: new Date().toISOString(),
      map: JSON.parse(syncMapExport(map)).maps[0], bpm: res.diagnostics.bpm || null,
      engineMs: Math.round((res.diagnostics.analyseMs || 0) + (res.diagnostics.alignMs || 0))};
    /* the performance memory: how loud each note was, where the map puts it */
    step('Measuring the dynamics, note by note…', 0.9);
    try { rec.memory = await syncMeasureDynamics(audio.pcm, audio.sr, rec, tl, f => step('Measuring the dynamics, note by note…', 0.9 + 0.08 * f)); }
    catch(e){ console.warn('dynamics', e); }
    (x.recordings = x.recordings || []).push(rec);
    saveNow();
    _syncJobs.delete(x.id);
    if(typeof sound === 'function') sound('success');
    toast(`${esc(file.name)} is synced — ${Math.round(100 * (map.overallConfidence || 0))}% sure overall.`);
    scoreUi().side = 'recordings';
    syncPaint(x);
  } catch(e){
    console.warn('sync', e);
    job.error = e && e.message ? e.message : 'The recording could not be followed.';
    syncPaint(x);
  }
}
/* a map from a file: the bars must be this score's bars */
function syncMapLoad(x, text){
  let maps;
  try { maps = syncMapImport(text); } catch(e){ toast(esc(e.message || 'That file could not be read.')); return; }
  const tl = syncTimelineOf(x);
  let added = 0, refused = 0;
  maps.forEach(m => {
    if(!tl || !syncReadingOrder(m, tl) || (m.reading && m.reading.order.some(k => !tl.measures[k]))){ refused++; return; }
    /* a new id: the one in the file may name a recording of another copy */
    const id = uid();
    const last = (m.performanceOrder || []).reduce((z, e) => Math.max(z, +e.audioEnd || 0), 0);
    (x.recordings = x.recordings || []).push({id, name: 'A recording (map loaded)', file: '', size: 0, duration: last, addedAt: new Date().toISOString(),
      map: JSON.parse(syncMapExport(Object.assign({}, m, {pieceId: x.id, recordingId: id}))).maps[0], bpm: null});
    added++;
  });
  if(added) saveNow();
  toast(added ? `${added} map${added > 1 ? 's' : ''} loaded${refused ? `; ${refused} made for another score left out` : ''}. Choose the recording's file to listen along.`
    : 'That map was made for another score — its bars do not match this one.', 6000);
  syncPaint(x);
}
/* the file again, for a map whose audio is not here */
async function syncReattach(x, id, file){
  const r = (x.recordings || []).find(v => v.id === id); if(!r) return;
  try {
    const dur = await new Promise((res, rej) => { const a = new Audio(); const url = URL.createObjectURL(file);
      a.preload = 'metadata'; a.onloadedmetadata = () => { URL.revokeObjectURL(url); res(a.duration); };
      a.onerror = () => { URL.revokeObjectURL(url); rej(new Error('unreadable')); }; a.src = url; });
    if(r.duration && isFinite(dur) && Math.abs(dur - r.duration) > Math.max(2, r.duration * 0.02)){
      toast(`That file is ${syncClock(dur)} long; the map was made from one of ${syncClock(r.duration)}. Choose the same recording.`, 6000); return; }
    await syncAudioPut(id, x.id, file);
    if(!r.file){ r.file = file.name; r.size = file.size; if(/map loaded/.test(r.name)) r.name = file.name.replace(/\.[^.]+$/, ''); if(!r.duration && isFinite(dur)) r.duration = dur; saveNow(); }
    syncPaint(x);
  } catch(e){ toast('That file could not be read as audio.'); }
}

/* ---------- listening along ----------
   The recording plays through the page's own audio clock, and at every
   frame its time is read back through the map to a place in the score,
   which the play bar lights exactly as it lights its own playing. The
   clicks, when asked for, are booked on the same clock at each bar's
   mapped downbeat, so what is heard is the map itself. */
let _syncListen = null;
let _syncClicks = (() => { try { return localStorage.getItem('syncClicks') === '1'; } catch(e){ return false; } })();
const _syncBuffers = new Map();   // recording id → decoded AudioBuffer (the last two)
async function syncListen(x, rec, from){
  syncListenStop();
  if(typeof scorePlayStopAll === 'function') scorePlayStopAll();
  const blob = await syncAudioBlob(rec.id, x.id);
  if(!blob){ toast('Its audio is not on this device — choose the file again.'); return; }
  const ctx = plxAudioCtx(); if(!ctx){ toast('This browser cannot make sound.'); return; }
  try { if(ctx.resume) await ctx.resume(); } catch(e){}
  let buf = _syncBuffers.get(rec.id);
  if(!buf){
    const btn = document.querySelector(`[data-sylisten="${CSS.escape(rec.id)}"]`); if(btn) btn.textContent = 'Opening…';
    try { buf = await ctx.decodeAudioData(await blob.arrayBuffer()); }
    catch(e){ toast('That recording could not be decoded.'); syncPaint(x); return; }
    _syncBuffers.set(rec.id, buf);
    while(_syncBuffers.size > 2) _syncBuffers.delete(_syncBuffers.keys().next().value);
  }
  const tl = (() => { const bar = syncBar(); return bar && bar._plx && bar._plx.timeline || syncTimelineOf(x); })();
  const order = tl ? syncReadingOrder(rec.map, tl) : null;
  const perf = order ? syncPerfFor(order, tl) : [];
  const beatsOf = m => { const f = rec.map.form || {}; return (f.measureBeats && f.measureBeats[m - 1]) || f.beats || 4; };
  const downs = syncBars(rec.map).map(b => b.t).filter(t => t != null && isFinite(t));
  const out = ctx.createGain(); out.gain.value = 0.95; out.connect(ctx.destination);
  const clickBus = ctx.createGain(); clickBus.gain.value = 0.7; clickBus.connect(ctx.destination);
  const src = ctx.createBufferSource(); src.buffer = buf; src.connect(out);
  const offset = Math.max(0, Math.min(buf.duration - 0.05, from == null ? 0 : from));
  const t0 = ctx.currentTime + 0.06;
  src.start(t0, offset);
  const L = _syncListen = {x, rec, ctx, src, out, clickBus, t0, offset, downs, nextDown: downs.findIndex(d => d >= offset - 0.01), raf: 0, lastQ: null};
  src.onended = () => { if(_syncListen === L) syncListenStop(); };
  const tick = () => {
    if(_syncListen !== L) return;
    const bar = syncBar(), ctl = bar && bar._plx;
    /* the player started, or the room went: the recording gives way */
    if(!document.getElementById('scStage') || (ctl && ctl.player && ctl.player.running)){ syncListenStop(true); return; }
    const now = offset + (ctx.currentTime - t0);
    /* the clicks for the next half second */
    if(L.nextDown >= 0) while(L.nextDown < downs.length && downs[L.nextDown] < now + 0.5){
      const d = downs[L.nextDown++];
      if(_syncClicks && d >= now - 0.02) plxClick(ctx, clickBus, t0 + (d - offset), true);
    }
    const at = audioToScoreTime(rec.map, now);
    if(ctl && ctl.showAt){
      if(at.measure == null || !perf.length){ if(L.lastQ != null){ ctl.showAt(null); L.lastQ = null; } }
      else { const pm = perf[at.measure - 1];
        if(pm){ const f = Math.max(0, Math.min(0.999, (at.beat - 1) / beatsOf(at.measure)));
          const q = pm.q0 + f * pm.len; ctl.showAt(q); L.lastQ = q; } }
    }
    L.raf = requestAnimationFrame(tick);
  };
  L.raf = requestAnimationFrame(tick);
  syncListenPaint();
}
function syncListenStop(quiet){
  const L = _syncListen; if(!L) return;
  _syncListen = null;
  if(L.raf) cancelAnimationFrame(L.raf);
  try { L.src.onended = null; L.src.stop(); } catch(e){}
  const now = L.ctx.currentTime;
  [L.out, L.clickBus].forEach(g => { try { g.gain.setTargetAtTime(0, now, 0.02); setTimeout(() => { try { g.disconnect(); } catch(e){} }, 200); } catch(e){} });
  const bar = syncBar(); if(bar && bar._plx && bar._plx.showAt && !quiet) bar._plx.showAt(null);
  syncListenPaint();
}
const syncBar = () => document.querySelector('#scPlayRow .plx-bar') || document.querySelector('#scStrip .plx-bar');
/* the buttons alone, not the panel */
function syncListenPaint(){
  $$('[data-sylisten]').forEach(b => { const on = !!_syncListen && _syncListen.rec.id === b.dataset.sylisten;
    b.textContent = on ? '■ Stop' : '▶ Listen along'; b.classList.toggle('primary', on); b.setAttribute('aria-pressed', String(on));
    const card = b.closest('.sy-rec'); if(card) card.classList.toggle('on', on); });
}

/* the memory for a recording synced before there was one: its audio is
   decoded again (here, on this device) and measured */
async function syncBuildMemory(x, id, btn){
  const r = (x.recordings || []).find(v => v.id === id); if(!r) return;
  const blob = await syncAudioBlob(id, x.id); if(!blob){ toast('Its audio is not on this device — choose the file first.'); return; }
  if(btn){ btn.disabled = true; btn.textContent = 'Measuring…'; }
  try { const a = await syncDecodeForEngine(await blob.arrayBuffer()); const tl = syncTimelineOf(x);
    r.memory = await syncMeasureDynamics(a.pcm, a.sr, r, tl, f => { if(btn) btn.textContent = `Measuring… ${Math.round(f * 100)}%`; });
    saveNow(); toast('The performance memory is kept.'); }
  catch(e){ console.warn(e); toast('The dynamics could not be measured.'); }
  syncPaint(x);
}
/* the score's own notes, at this recording's timing and dynamics, through
   the play bar (whose part chips choose who is heard) */
function syncPlayAsRecorded(x, id){
  syncListenStop();
  const bar = syncBar(), ctl = bar && bar._plx; if(!ctl){ toast('The player is not ready yet.'); return; }
  ctl.setTiming(id); ctl.play();
}
