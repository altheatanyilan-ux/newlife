/* ============================================================
   THE 4 / 3 / 2 DRILL.

   One talk, three times, with the clock shrinking under you. The content is
   fixed on purpose: anything that improves between the first delivery and the
   third is the machinery getting faster, not the material getting easier, and
   that is the only thing this exercise is measuring.

   It records, and it listens.

   THE RECORDING IS A BLOB IN THE DATABASE, NOT BASE64 IN localStorage. The
   specification says to keep the audio as a base64 string in localStorage.
   localStorage is about five megabytes for the entire site, base64 inflates
   binary by a third, and two minutes of Opus is a few hundred kilobytes — so
   ten sessions would fill it and every other room's storage would die with
   it, silently, at a save nobody could connect to the drill. IndexedDB holds
   a Blob as a Blob, and the audio goes in a table of its own that the state
   snapshot never touches.

   AND THE TRANSCRIPT IS A SECOND OPINION, NOT A RECORD. The recogniser hears
   an L2 speaker at maybe two thirds accuracy, and correcting it is not an
   annoyance to be tolerated — it is the audit. The gap between what you meant
   and what a machine with no stake in the matter actually heard is the
   pronunciation diagnostic you cannot get any other way. So both are kept:
   what it heard, and what you say you said.

   Neither is required. On a page served from a file, or in a browser without
   the recogniser, or with the microphone refused, the drill still runs — it
   is a clock and a topic and a blank box to type what you said into, which is
   how the exercise was done for thirty years before any of this existed.
   ============================================================ */

const JA_432_STAGES = [4, 3, 2];
const JA_432_BREATH = 5;              /* seconds between stages: "same topic, less time" */

/* ---------- the microphone ----------
   One object over two APIs that fail in different ways and neither of which
   is necessary. Everything it exposes is safe to call when nothing works. */
const JaRecorder = (() => {
  let stream = null, rec = null, parts = [], sr = null, heard = '', live = '', at = 0, revived = 0;
  const hasAudio = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    && typeof MediaRecorder === 'function');
  const hasSpeech = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  async function open(){
    if(stream) return true;
    if(!hasAudio()) return false;
    try { stream = await navigator.mediaDevices.getUserMedia({audio:true}); return true; }
    catch(e){ stream = null; return false; }
  }
  function startSpeech(onText){
    if(!hasSpeech()) return false;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      sr = new SR();
      sr.lang = 'ja-JP'; sr.continuous = true; sr.interimResults = true;
      sr.onresult = ev => {
        live = '';
        for(let i = ev.resultIndex; i < ev.results.length; i++){
          const text = ev.results[i][0].transcript;
          if(ev.results[i].isFinal) heard += text; else live = text;
        }
        if(onText) onText(heard, live);
      };
      /* A recogniser that stops itself mid-stage is the commonest failure and
         the least visible one: it simply goes quiet. So it is started again —
         but a bounded number of times, and only while a stage is actually
         running. Restarting unconditionally is how you get a tight loop out of
         a recogniser that cannot start at all: every failed start fires onend,
         and onend starts it again. */
      revived = 0;
      sr.onend = () => {
        if(!sr || revived >= 20) return;
        if(_ja432 && _ja432.phase !== 'run') return;
        revived++;
        try { sr.start(); } catch(e){}
      };
      sr.onerror = ev => { if(ev && /not-allowed|service-not-allowed|audio-capture/.test(ev.error || '')) stopSpeech(); };
      sr.start();
      return true;
    } catch(e){ sr = null; return false; }
  }
  async function start(onText){
    heard = ''; live = ''; parts = []; at = Date.now();
    const audio = await open();
    if(audio){
      try {
        rec = new MediaRecorder(stream);
        rec.ondataavailable = ev => { if(ev.data && ev.data.size) parts.push(ev.data); };
        rec.start();
      } catch(e){ rec = null; }
    }
    const speech = startSpeech(onText);
    return {audio: !!rec, speech};
  }
  function stopSpeech(){
    if(!sr) return;
    const s = sr; sr = null;
    try { s.onend = null; s.stop(); } catch(e){}
  }
  async function stop(){
    const seconds = at ? Math.round((Date.now() - at) / 1000) : 0;
    stopSpeech();
    let blob = null;
    if(rec){
      const r = rec; rec = null;
      blob = await new Promise(res => {
        r.onstop = () => res(parts.length ? new Blob(parts, {type: parts[0].type || 'audio/webm'}) : null);
        try { r.stop(); } catch(e){ res(null); }
      });
    }
    at = 0;
    return {blob, heard: (heard + (live ? live : '')).trim(), seconds};
  }
  function release(){
    stopSpeech();
    if(stream){ try { stream.getTracks().forEach(t => t.stop()); } catch(e){} stream = null; }
    rec = null; parts = [];
  }
  return {start, stop, release, hasAudio, hasSpeech,
    get listening(){ return !!sr; }, get recording(){ return !!rec; }};
})();

/* ---------- keeping the audio ----------
   Its own table, written directly. It is deliberately outside the state
   snapshot: that pass serialises everything through JSON to decide what
   changed, and a Blob through JSON is an empty object. */
async function jaPutAudio(blob){
  if(!blob || !jaState2().settings.keepAudio) return null;
  const id = uid();
  try { await db.jaAudio.put({id, blob, at:new Date().toISOString()}); return id; }
  catch(e){ console.warn('the recording could not be kept', e); return null; }
}
async function jaGetAudio(id){
  if(!id) return null;
  try { const row = await db.jaAudio.get(id); return row ? row.blob : null; }
  catch(e){ return null; }
}
async function jaDropAudio(ids){
  for(const id of (ids || []).filter(Boolean)){
    try { await db.jaAudio.delete(id); } catch(e){}
  }
}

/* ---------- the sitting ----------
   Held in one object so the stages can be driven by the clock or by a press,
   and so that finishing is one path whichever ended it. */
let _ja432 = null;
const ja432 = () => _ja432;
function ja432Begin(setup){
  _ja432 = {setup: setup || {}, stage: 0, phase:'ready', endsAt: 0,
    deliveries: [], heard: '', live: '', can: {audio:false, speech:false}, timer: null};
  /* twelve minutes of talking is twelve minutes of the day, and it should not
     have to be logged twice — refused if you were already timing something */
  try { if(typeof timeAutoStart === 'function') timeAutoStart({categoryId:'japanese',
    feature:'japanese', what:`4/3/2 — ${(setup && setup.topic) || 'a topic'}`}); } catch(e){}
  return _ja432;
}
async function ja432Run(){
  const d = _ja432;
  if(!d || d.stage >= JA_432_STAGES.length) return null;
  d.phase = 'run';
  d.endsAt = Date.now() + JA_432_STAGES[d.stage] * 60000;
  d.heard = ''; d.live = '';
  d.can = await JaRecorder.start((heard, live) => {
    d.heard = heard; d.live = live; ja432PaintLive();
  });
  ja432Paint();
  if(d.timer) clearInterval(d.timer);
  d.timer = setInterval(() => {
    if(!_ja432 || _ja432.phase !== 'run'){ clearInterval(d.timer); d.timer = null; return; }
    if(Date.now() >= _ja432.endsAt) ja432EndStage();
    else ja432PaintClock();
  }, 250);
  return d;
}
/* The end of a stage, whether the clock ran out or you stopped early. */
async function ja432EndStage(){
  const d = _ja432;
  if(!d || d.phase !== 'run') return null;
  d.phase = 'breath';
  if(d.timer){ clearInterval(d.timer); d.timer = null; }
  const got = await JaRecorder.stop();
  const audioId = await jaPutAudio(got.blob);
  const heard = got.heard || d.heard || '';
  const delivery = {stage: d.stage + 1, target: JA_432_STAGES[d.stage],
    seconds: got.seconds, wpm: null, audioId, heard};
  /* counted here rather than asked for later */
  delivery.wpm = jaDeliveryWpm(delivery, heard);
  d.deliveries.push(delivery);
  d.stage += 1;
  if(d.stage >= JA_432_STAGES.length){ d.phase = 'done'; ja432Paint(); return d; }
  d.breathUntil = Date.now() + JA_432_BREATH * 1000;
  ja432Paint();
  d.timer = setInterval(() => {
    if(!_ja432 || _ja432.phase !== 'breath'){ clearInterval(d.timer); d.timer = null; return; }
    if(Date.now() >= _ja432.breathUntil){ clearInterval(d.timer); d.timer = null; ja432Run(); }
    else ja432PaintClock();
  }, 200);
  return d;
}
/* Writing it down. The talk is over; what is kept is the three deliveries,
   what the machine heard in the last one, and the targets you set out with —
   so the audit can ask whether you actually used them. */
function ja432Save(){
  const d = _ja432;
  if(!d) return null;
  const j = jaState2();
  const s = jaSessionDefaults({
    topic: d.setup.topic || '', islandId: d.setup.islandId || null,
    targetChunks: d.setup.chunks || [], targetGrammar: d.setup.grammar || [],
    deliveries: d.deliveries,
    /* the last delivery's transcript is the one worth correcting: it is the
       fastest and therefore the one where the machinery shows */
    transcript: (d.deliveries[d.deliveries.length - 1] || {}).heard || '',
    sessionType: d.setup.sessionType || 'practice', partnerType: 'solo'});
  j.sessions.unshift(s);
  if(s.islandId){ const i = byId(j.islands, s.islandId);
    if(i){ i.timesUsed = (+i.timesUsed || 0) + 1; i.lastUsedDate = today(); } }
  JaRecorder.release();
  _ja432 = null;
  try { if(typeof timeAutoStop === 'function') timeAutoStop('japanese'); } catch(e){}
  saveNow();
  return s;
}
function ja432Abandon(){
  const d = _ja432;
  if(!d) return null;
  if(d.timer) clearInterval(d.timer);
  JaRecorder.release();
  /* nothing written down means nothing kept: the recordings of an abandoned
     sitting are megabytes nobody will ever play */
  jaDropAudio(d.deliveries.map(v => v.audioId));
  _ja432 = null;
  try { if(typeof timeAutoStop === 'function') timeAutoStop('japanese'); } catch(e){}
  return null;
}
const ja432Left = () => { const d = _ja432; if(!d) return 0;
  return Math.max(0, Math.ceil(((d.phase === 'breath' ? d.breathUntil : d.endsAt) - Date.now()) / 1000)); };
const jaMMSS = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

/* ---------- the screens ----------
   Set out what you are going to say and what you are going to try to use;
   then a dark room with a clock in it and nothing else; then the audit. */
function openJa432Setup(islandId){
  const j = jaState2();
  const isl = islandId ? byId(j.islands, islandId) : null;
  const m = openModal(`<h2>🎙 A 4 / 3 / 2 sitting</h2>
    <p class="muted sm">One talk, three times, with the clock shrinking under you. The content is
      fixed on purpose — whatever improves by the third delivery is the machinery, not the material.</p>
    <label class="pd-q" style="margin-top:8px"><span class="k">what you are going to talk about</span>
      <input class="inp" id="jsTopic" autofocus value="${esc(isl ? isl.topic : '')}"
        placeholder="something you could already talk about"></label>
    ${j.islands.length ? `<label class="pd-q" style="margin-top:10px"><span class="k">or an island you have by heart</span>
      <select class="sel" id="jsIsland"><option value="">— not one of them —</option>${j.islands.map(i =>
        `<option value="${esc(i.id)}" ${isl && isl.id === i.id ? 'selected' : ''}>${esc(i.topic)}</option>`).join('')}</select></label>` : ''}
    <!-- the chunks that come up are the ones you cannot yet produce: there is
         no point setting out to deploy the phrases you already have -->
    <div class="pd-q" style="margin-top:10px"><span class="k">chunks to try to deploy</span>
      <div class="ja-targets" id="jsChunks">${jaTargetChunksHTML(isl)}</div></div>
    ${j.grammar.length ? `<div class="pd-q" style="margin-top:10px"><span class="k">grammar to try to use</span>
      <div class="ja-targets">${j.grammar.slice(0, 12).map(g =>
        `<label class="ja-target"><input type="checkbox" data-jsgram="${esc(g.name)}"> ${esc(g.name)}</label>`).join('')}</div></div>` : ''}
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn primary" id="jsGo">▶ Begin</button></div>`, 'sc-modal');
  const isle = m.querySelector('#jsIsland');
  if(isle) isle.onchange = () => { const i = byId(j.islands, isle.value);
    const box = m.querySelector('#jsChunks');
    if(box) box.innerHTML = jaTargetChunksHTML(i);
    const t = m.querySelector('#jsTopic');
    if(i && t && !t.value.trim()) t.value = i.topic; };
  m.querySelector('#jsGo').onclick = async () => {
    const setup = {topic: m.querySelector('#jsTopic').value.trim(),
      islandId: isle ? (isle.value || null) : null,
      chunks: $$('[data-jschunk]', m).filter(b => b.checked).map(b => b.dataset.jschunk),
      grammar: $$('[data-jsgram]', m).filter(b => b.checked).map(b => b.dataset.jsgram)};
    if(!setup.topic){ m.querySelector('#jsTopic').focus(); return; }
    m.remove();
    ja432Begin(setup);
    ja432Open();
    await ja432Run();
  };
  return m;
}
function jaTargetChunksHTML(isl){
  const list = isl ? (isl.chunks || []).filter(c => !c.ready) : [];
  if(!isl) return '<span class="faint sm">Pick an island and the phrases you cannot yet produce come up here.</span>';
  if(!list.length) return '<span class="faint sm">Every chunk on this island is one you can produce. Nothing to aim at.</span>';
  return list.map(c => `<label class="ja-target"><input type="checkbox" checked
    data-jschunk="${esc(c.japanese)}"> ${esc(c.japanese)}<span class="faint">${
      esc(c.meaning || jaFurigana(c.japanese))}</span></label>`).join('');
}

let _ja432El = null;
function ja432Open(){
  if(_ja432El) _ja432El.remove();
  _ja432El = el('<div class="ja-run" id="jaRun" role="dialog" aria-modal="true"></div>');
  document.body.appendChild(_ja432El);
  document.documentElement.classList.add('ja-running');
  ja432Paint();
  return _ja432El;
}
function ja432Close(){
  if(_ja432El){ _ja432El.remove(); _ja432El = null; }
  document.documentElement.classList.remove('ja-running');
}
function ja432Paint(){
  const d = _ja432, box = _ja432El;
  if(!box) return;
  if(!d){ ja432Close(); return; }
  if(d.phase === 'done'){ box.innerHTML = ja432DoneHTML(d); ja432Bind(); return; }
  if(d.phase === 'breath'){ box.innerHTML = ja432BreathHTML(d); ja432Bind(); return; }
  box.innerHTML = `<div class="ja-run-in">
    <div class="ja-run-h mono">Stage ${d.stage + 1} of ${JA_432_STAGES.length}
      · ${JA_432_STAGES[d.stage]} minutes</div>
    <div class="ja-clock serif" id="jaClock">${jaMMSS(ja432Left())}</div>
    <div class="ja-rec mono">${d.can.audio ? '<i class="ja-dot"></i> recording' :
      'no microphone — the clock still counts'}${d.can.speech ? ' · listening' : ''}</div>
    <div class="ja-topic serif">${esc(d.setup.topic || 'your topic')}</div>
    ${(d.setup.chunks || []).length || (d.setup.grammar || []).length ? `<div class="ja-run-targets mono">
      ${(d.setup.chunks || []).length ? `<div><b>chunks</b> ${esc(d.setup.chunks.join(' · '))}</div>` : ''}
      ${(d.setup.grammar || []).length ? `<div><b>grammar</b> ${esc(d.setup.grammar.join(' · '))}</div>` : ''}
    </div>` : ''}
    ${d.can.speech ? `<div class="ja-live" id="jaLive" aria-live="polite"></div>` : ''}
    <div class="row" style="gap:10px;margin-top:18px">
      <button class="btn" id="jaEnd">◼ End this one early</button>
      <button class="tbtn" id="jaQuit">leave the sitting</button>
    </div>
  </div>`;
  ja432Bind();
  ja432PaintLive();
}
function ja432BreathHTML(d){
  return `<div class="ja-run-in ja-breath">
    <div class="ja-breath-t serif">Same topic. Less time.</div>
    <div class="ja-clock serif" id="jaClock">${jaMMSS(ja432Left())}</div>
    <div class="mono faint">stage ${d.stage + 1} of ${JA_432_STAGES.length}
      · ${JA_432_STAGES[d.stage]} minutes</div>
    <div class="row" style="gap:10px;margin-top:18px">
      <button class="btn primary" id="jaNow">go now</button>
      <button class="tbtn" id="jaQuit">leave the sitting</button></div>
  </div>`;
}
function ja432DoneHTML(d){
  return `<div class="ja-run-in">
    <div class="ja-breath-t serif">Three times through.</div>
    <div class="mono faint">${d.deliveries.map(v => `${v.target}m → ${jaMMSS(v.seconds)}`).join('  ·  ')}</div>
    <p class="muted" style="max-width:34rem;margin-top:12px">Now the part that does the work: listen back,
      write down what you actually said, and see where it differs from what the machine heard.</p>
    <div class="row" style="gap:10px;margin-top:18px">
      <button class="btn primary" id="jaAudit">To the audit</button>
      <button class="tbtn" id="jaQuit">throw it away</button></div>
  </div>`;
}
function ja432Bind(){
  const box = _ja432El;
  if(!box) return;
  const on = (sel, fn) => { const n = box.querySelector(sel); if(n) n.onclick = fn; };
  on('#jaEnd', () => ja432EndStage());
  on('#jaNow', () => { if(_ja432 && _ja432.timer){ clearInterval(_ja432.timer); _ja432.timer = null; } ja432Run(); });
  on('#jaAudit', () => { const s = ja432Save(); ja432Close();
    if(s) openJa432Audit(s.id); else rerender(); });
  on('#jaQuit', () => { ja432Abandon(); ja432Close(); rerender(); });
}
function ja432PaintClock(){
  const n = _ja432El && _ja432El.querySelector('#jaClock');
  if(n) n.textContent = jaMMSS(ja432Left());
}
function ja432PaintLive(){
  const n = _ja432El && _ja432El.querySelector('#jaLive');
  if(!n || !_ja432) return;
  n.textContent = (_ja432.heard || '') + (_ja432.live ? ` ${_ja432.live}` : '');
  n.scrollTop = n.scrollHeight;
}

/* ---------- the audit ----------
   The half of the exercise that is not talking. Two texts side by side: what
   a machine with no stake in the matter heard, and what you say you said.
   Correcting the first into the second is the whole diagnostic — every place
   they differ is either a word the recogniser got wrong or a word you did,
   and telling those two apart is a skill worth building.

   Nothing here is scored. The marks are yours, the counts are yours, and the
   one number the room asks for is the one nobody can compute for you: where
   your pauses fell. */
function openJa432Audit(sessionId){
  const j = jaState2();
  const s = byId(j.sessions, sessionId);
  if(!s) return null;
  const last = s.deliveries[s.deliveries.length - 1] || {};
  const isl = s.islandId ? byId(j.islands, s.islandId) : null;
  const m = openModal(`<h2>🔍 The audit — ${esc(s.topic || 'that sitting')}</h2>
    <div class="ja-audit">
      <div class="mono faint">${s.deliveries.map(v => `stage ${v.stage}: ${jaMMSS(v.seconds)} of ${v.target}m`).join(' · ')}</div>
      ${last.audioId ? `<div class="ja-player" id="jaPlayer">
        <audio controls id="jaAudio"></audio>
        <span class="ja-speeds">${[0.75, 1, 1.25].map(r =>
          `<button class="tbtn${r === 1 ? ' on' : ''}" data-jarate="${r}">${r}×</button>`).join('')}</span>
      </div>` : '<p class="faint sm">No recording was kept for this one.</p>'}
      <label class="pd-q" style="margin-top:10px"><span class="k">what the machine heard</span>
        <textarea class="inp ja-heard" rows="4" id="jaHeard" readonly>${esc(last.heard || '')}</textarea></label>
      <p class="faint sm">${last.heard ? 'It hears an L2 speaker at maybe two thirds. Every place it is wrong is either its mistake or your pronunciation, and telling those apart is the point.' : 'Nothing was heard — type what you said below.'}</p>
      <label class="pd-q" style="margin-top:8px"><span class="k">what you actually said</span>
        <textarea class="inp" rows="6" id="jaSaid" placeholder="えーと、…">${esc(s.transcript || last.heard || '')}</textarea></label>
      <div class="pd-q"><span class="k">mark what went wrong</span>
        <div class="ja-marks">${JA_MARKS.map(([k, name, col]) =>
          `<button class="tbtn" data-jamark="${k}" style="--c:${col}" title="select some of the text first">${esc(name)}</button>`).join('')}</div>
        <div class="ja-marklist" id="jaMarkList">${jaMarkListHTML(s)}</div></div>
      ${(s.targetChunks || []).length ? `<div class="pd-q"><span class="k">did you deploy them?</span>
        <div class="ja-targets">${s.targetChunks.map(c =>
          `<label class="ja-target"><input type="checkbox" data-jaused="${esc(c)}"
            ${s.chunksUsed[c] ? 'checked' : ''}> ${esc(c)}</label>`).join('')}</div></div>` : ''}
      ${(s.targetGrammar || []).length ? `<div class="pd-q"><span class="k">and the grammar?</span>
        <div class="ja-gramused">${s.targetGrammar.map(g => `<div class="ja-gramrow">
          <span>${esc(g)}</span>
          <select class="sel sm" data-jagram="${esc(g)}">${[['not_used','did not get to it'],
            ['used','used it, correctly'],['attempted','tried it and botched it']].map(([v, n]) =>
            `<option value="${v}" ${(s.grammarUsed[g] || 'not_used') === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        </div>`).join('')}</div></div>` : ''}
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <label class="pd-q" style="flex:1;min-width:15rem"><span class="k">where did the pauses fall?</span>
          <select class="sel" id="jaPause"><option value="">—</option>${JA_PAUSE.map(([v, n, hint]) =>
            `<option value="${v}" ${s.pauseLocation === v ? 'selected' : ''}>${esc(n)} — ${esc(hint)}</option>`).join('')}</select></label>
        <label class="pd-q" style="flex:1;min-width:11rem"><span class="k">how it went</span>
          <select class="sel" id="jaQual"><option value="">—</option>${JA_QUALITY.map(([v, n]) =>
            `<option value="${v}" ${s.quality === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      </div>
      <!-- counted for you, off the transcript and the seconds it took. The
           last stage is recounted from what you type above, because that is
           the accurate text; the earlier two are what the recogniser heard,
           which is a floor rather than a figure. -->
      <div class="pd-q"><span class="k">words a minute</span>
        <div class="row" style="gap:8px" id="jaWpmRow">${jaWpmRowHTML(s)}</div>
        <p class="faint sm" style="margin:4px 0 0">${last.heard
          ? `Counted ${jaHasSegmenter() ? 'with the browser\u2019s own Japanese word breaker'
            : 'roughly \u2014 this browser has no word breaker, so Japanese is counted at two characters to a word'}. The last stage follows what you type above.`
          : 'Nothing was heard, so there is nothing to count. Type what you said above and the last stage is counted from it.'}</p></div>
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn sm ghost" id="jaToBook">Send what went wrong to the notebook</button>
      <span class="grow"></span>
      <button class="btn primary" id="jaAuditSave">Save</button></div>`, 'wide sc-modal');

  if(last.audioId) jaGetAudio(last.audioId).then(blob => {
    const a = m.querySelector('#jaAudio');
    if(a && blob) a.src = URL.createObjectURL(blob);
  });
  $$('[data-jarate]', m).forEach(b => b.onclick = () => {
    const a = m.querySelector('#jaAudio');
    if(a) a.playbackRate = +b.dataset.jarate;
    $$('[data-jarate]', m).forEach(y => y.classList.toggle('on', y === b));
  });
  /* a mark is a selection plus a name for what is wrong with it */
  $$('[data-jamark]', m).forEach(b => b.onclick = () => {
    const ta = m.querySelector('#jaSaid');
    const text = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
    if(!text){ toast('Select the part that went wrong first.'); return; }
    s.marks.push({id:uid(), kind:b.dataset.jamark, text});
    m.querySelector('#jaMarkList').innerHTML = jaMarkListHTML(s);
    jaBindMarkList(m, s);
    sound('click');
  });
  jaBindMarkList(m, s);
  /* the transcript is the text the last stage is measured against, so the
     number follows it as it is corrected rather than waiting for a save */
  const said = m.querySelector('#jaSaid');
  const recount = () => {
    const d = s.deliveries[s.deliveries.length - 1];
    if(d) d.wpm = jaDeliveryWpm(d, said.value);
    const row = m.querySelector('#jaWpmRow');
    if(row) row.innerHTML = jaWpmRowHTML(s);
  };
  if(said) said.oninput = debounce(recount, 300);
  m.querySelector('#jaToBook').onclick = () => {
    const made = jaMarksToNotebook(s);
    toast(made ? `${made} in the notebook.` : 'Nothing marked yet.');
    if(made) sound('success');
  };
  m.querySelector('#jaAuditSave').onclick = () => {
    s.transcript = m.querySelector('#jaSaid').value;
    s.pauseLocation = m.querySelector('#jaPause').value || null;
    s.quality = m.querySelector('#jaQual').value || null;
    $$('[data-jaused]', m).forEach(b => s.chunksUsed[b.dataset.jaused] = b.checked);
    $$('[data-jagram]', m).forEach(b => s.grammarUsed[b.dataset.jagram] = b.value);
    /* recounted from the corrected text, which is the accurate one */
    const lastD = s.deliveries[s.deliveries.length - 1];
    if(lastD) lastD.wpm = jaDeliveryWpm(lastD, s.transcript);
    /* a chunk you deployed is a chunk you can produce: the checkbox in the
       audit is the same fact as the one on the island, so it is written there */
    if(isl) (s.targetChunks || []).forEach(text => {
      if(!s.chunksUsed[text]) return;
      const c = (isl.chunks || []).find(v => v.japanese === text);
      if(c) c.ready = true;
    });
    saveNow(); m.remove(); sound('success'); rerender();
  };
  return m;
}
function jaMarkListHTML(s){
  if(!s.marks.length) return '<span class="faint sm">Nothing marked yet.</span>';
  return s.marks.map(v => { const kind = JA_MARKS.find(k => k[0] === v.kind) || JA_MARKS[0];
    return `<span class="ja-mark" style="--c:${kind[2]}">${esc(v.text)}
      <b class="mono">${esc(kind[1].toLowerCase())}</b>
      <button class="del-x inline" data-jamarkdel="${esc(v.id)}">×</button></span>`; }).join('');
}
function jaBindMarkList(m, s){
  $$('[data-jamarkdel]', m).forEach(b => b.onclick = () => {
    spliceOut(s.marks, v => v.id === b.dataset.jamarkdel);
    m.querySelector('#jaMarkList').innerHTML = jaMarkListHTML(s);
    jaBindMarkList(m, s);
  });
}
/* Everything marked becomes an entry in the one book, with the sitting it came
   from on it. The corrected version is left blank on purpose: it is the thing
   you have to go and find out, and a notebook that filled it in for you would
   be the machine judgement this room does not have. */
function jaMarksToNotebook(s){
  const j = jaState2();
  let made = 0;
  s.marks.forEach(v => {
    if(v.errorId) return;
    const e = jaErrorDefaults({tried: v.text, errorType: v.kind === 'grammar' ? 'grammar'
      : v.kind === 'vocab' ? 'vocabulary' : v.kind === 'english' ? 'expression' : 'other',
      source:'432', sourceId: s.id,
      note: v.kind === 'pause' ? 'a pause inside the clause — the sentence was still being built'
        : v.kind === 'english' ? 'fell back into English here' : ''});
    j.errors.unshift(e);
    v.errorId = e.id;
    s.errorIds.push(e.id);
    made++;
  });
  if(made) saveNow();
  return made;
}

/* the three numbers, said plainly, with the ones nobody could hear left blank */
function jaWpmRowHTML(s){
  return (s.deliveries || []).map(v => `<span class="ja-wpm mono">stage ${v.stage}
    <b>${v.wpm != null ? v.wpm : '\u2014'}</b></span>`).join('');
}
