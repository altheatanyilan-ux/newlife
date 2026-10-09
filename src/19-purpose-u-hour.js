/* ============================================================
   THE GUIDED VISION HOUR, AND LOOKING AT IT

   The course makes vision creation a named sixty-minute exercise: a long-term
   big-picture account of how the purpose unfolds, connecting where you are now
   to where you will be in ten years — very detailed, emotionally compelling,
   and a bit idealistic and grand. It is explicit that this is not the moment
   to ask how, that fears should be watched for and set aside for the hour, and
   that the imagination is the muscle being exercised.

   Three movements: dream (about twenty minutes, fill the page), specify
   (about thirty, fourteen questions), compress (about ten, into the vision's
   future memory beside an honest current reality). The timer is visible and
   advisory — a guide, never a countdown. Everything written is kept, the hour
   resumes at the screen you left, and the words are also filed as one
   Reflection entry so they can be searched and read by the convergence engine.
   ============================================================ */

const HOUR_QS = [
  'In what ways will I be impacting other people and society?',
  'What kind of leader will I be, and how will I lead?',
  'What inspiring example will I set?',
  'What breakthroughs and good fortune could occur on the journey?',
  'How will my personal life be improved?',
  'How much money will I have?',
  'Where will I live?',
  'What will my schedule look like?',
  'How will I live in twenty years?',
  'How will I feel about my life, and what positive emotions will I experience?',
  'How will my identity change for the better?',
  'How will I grow?',
  'How will my friends and family benefit?',
  'How will the world benefit?',
];
const HOUR_ARRIVE = ['This is imagination time. No worrying, for this hour.', 'Set aside the fears. Do not focus on how.', 'Be idealistic and realistic at the same time.'];
const HOUR_FEAR_RE = /\b(can'?t afford|cannot afford|not realistic|too late|not good enough|who would|who am i to|never work|impossible)\b/i;

/* an image-bearing record: a vision can carry pictures like a person or a skill */
if(typeof IMG_OWNERS !== 'undefined' && !IMG_OWNERS.vision) IMG_OWNERS.vision = {list: () => S.visions, field: 'images', path: 'visions'};

function visionHourState(v){
  if(!v.guidedHour || typeof v.guidedHour !== 'object') v.guidedHour = {startedAt: '', finishedAt: null, step: 0, secs: 0, dream: '', answers: HOUR_QS.map(q => ({q, text: ''})), entryId: null};
  const g = v.guidedHour;
  if(!Array.isArray(g.answers) || g.answers.length !== HOUR_QS.length) g.answers = HOUR_QS.map((q, i) => ({q, text: (g.answers && g.answers[i] && g.answers[i].text) || ''}));
  return g;
}
function visionHourFile(v){
  const g = visionHourState(v);
  const body = [g.dream && 'The dream\n' + g.dream].concat(g.answers.filter(a => a.text.trim()).map(a => a.q + '\n' + a.text.trim())).filter(Boolean).join('\n\n');
  if(!body.trim()) return;
  let e = g.entryId ? byId(S.entries, g.entryId) : null;
  if(e){ e.body = body; }
  else { e = lifeEntryNew({type: 'reflection', title: 'The guided vision hour — ' + v.name, body, tags: ['vision'], links: {visions: [v.id]}, extra: {source: 'guided-hour', visionId: v.id}}); g.entryId = e.id; }
  saveNow();
}

function visionHour(visionId){
  let v = visionId ? byId(S.visions, visionId) : null;
  if(!v){
    const m = openModal(`<h2>The guided hour</h2><p class="faint">About an hour. It keeps everything you write and resumes where you leave it.</p>
      <div class="field"><label>What is it a vision of?</label><input class="inp serif-lg" id="ghN" placeholder="a name the future you will recognise" autofocus></div>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="ghGo">Begin</button></div>`, 'narrow');
    const go = () => { const n = m.querySelector('#ghN').value.trim(); if(!n) return; m.remove(); visionHour(visionNew(n).id); };
    m.querySelector('#ghGo').onclick = go; m.querySelector('#ghN').onkeydown = e => { if(e.key === 'Enter') go(); };
    return;
  }
  const g = visionHourState(v);
  const begin = () => {
    g.startedAt = g.startedAt || new Date().toISOString();
    let fearOffered = false, tick = null;
    const MOVE = [['Dream', 'about 20 minutes'], ['Specify', 'about 30 minutes'], ['Compress', 'about 10 minutes']];
    const mv = i => i === 0 ? 0 : i <= HOUR_QS.length ? 1 : 2;
    const timerHTML = i => `<div class="gh-timer mono faint"><span>${MOVE[mv(i)][0]} · ${MOVE[mv(i)][1]}</span> · <span id="ghT">${Math.floor((g.secs || 0) / 60)} min so far</span> <span>— a guide, not a countdown</span></div>`;
    const steps = [];
    steps.push({title: 'Dream', hint: 'Fill the page. Many paragraphs; no concision required. How does your purpose unfold, and where is your life ten years on?',
      body: () => `${timerHTML(0)}<textarea class="ta gh-dream" id="ghD" rows="14" placeholder="Write the whole of it, as if it has happened…">${esc(g.dream)}</textarea><div id="ghFear"></div>`,
      bind: b => { const t = b.querySelector('#ghD'), fz = b.querySelector('#ghFear'); t.focus();
        t.oninput = () => { g.dream = t.value; v.updatedAt = new Date().toISOString(); saveNow();
          const mm = !fearOffered && t.value.match(HOUR_FEAR_RE);
          if(mm){ fearOffered = true; const sent = (t.value.split(/(?<=[.!?\n])\s*/).find(s => HOUR_FEAR_RE.test(s)) || mm[0]).trim();
            fz.innerHTML = `<p class="faint gh-fear">That sounds like something to put in the fear inventory rather than in the vision. <button class="btn sm ghost" id="ghFearGo">put it there</button></p>`;
            fz.querySelector('#ghFearGo').onclick = () => { fz.innerHTML = ''; fearAdd(sent); }; } }; }});
    HOUR_QS.forEach((q, i) => steps.push({title: 'Specify · ' + (i + 1) + ' of ' + HOUR_QS.length, hint: esc(q),
      body: () => `${timerHTML(i + 1)}<textarea class="ta" id="ghQ" rows="8">${esc(g.answers[i].text)}</textarea>`,
      bind: b => { const t = b.querySelector('#ghQ'); t.oninput = () => { g.answers[i].text = t.value; saveNow(); }; t.focus(); }}));
    steps.push({title: 'Compress', hint: 'Reduce the dream into the future memory — first person, present tense — and, separately, write where you actually are, honestly. Side by side, the gap is the engine: the tension between an accurate picture of where you are and a clear picture of what you want is what moves things, and softening either end dissolves it.',
      body: () => `${timerHTML(HOUR_QS.length + 1)}<div class="grid c2" style="gap:12px;align-items:start">
        <div class="field"><label class="sc">The future memory</label><textarea class="ta" id="ghFm" rows="12" placeholder="I am… (as if it is happening)">${esc(v.futureMemory || '')}</textarea></div>
        <div class="field"><label class="sc">Where I actually am</label><textarea class="ta" id="ghCr" rows="12" placeholder="Honestly, without softening it…">${esc(v.currentReality || '')}</textarea></div></div>
        <details class="pp-vers"><summary class="mono">the dream, for reference</summary><p class="serif" style="white-space:pre-wrap">${esc(g.dream)}</p></details>`,
      bind: b => { const hist = (cur, nxt, key) => { if(cur && nxt && cur !== nxt && verIsNewWording(cur, nxt)) (v[key] = v[key] || []).push({date: today(), text: cur}); };
        b.querySelector('#ghFm').oninput = e => { hist(v.futureMemory, e.target.value, 'futureMemoryHistory'); v.futureMemory = e.target.value; saveNow(); };
        b.querySelector('#ghCr').oninput = e => { hist(v.currentReality, e.target.value, 'currentRealityHistory'); v.currentReality = e.target.value; saveNow(); }; }});
    const m = ppFlow('The vision hour — ' + v.name, steps, () => {
      g.finishedAt = new Date().toISOString(); v.updatedAt = g.finishedAt; visionHourFile(v); clearInterval(tick); saveNow(); sound('success');
      toast('Kept — the vision, and a reflection of the hour.'); navigate('#/purpose/vision/' + v.id);
    }, {finish: 'Keep it', startAt: g.step || 0, onStep: i => { g.step = i; saveNow(); }});
    /* the timer is visible and advisory; it counts the time actually spent here */
    tick = setInterval(() => { if(!m.isConnected){ clearInterval(tick); visionHourFile(v); return; } g.secs = (g.secs || 0) + 5; const el = m.querySelector('#ghT'); if(el) el.textContent = Math.floor(g.secs / 60) + ' min so far'; if(g.secs % 60 === 0) saveNow(); }, 5000);
  };
  if(!g.startedAt && typeof ceremonyVeil === 'function') ceremonyVeil(HOUR_ARRIVE, begin, {label: 'the vision hour'}); else begin();
}

/* ---------- looking at it every day: the board, in the house's idiom ----------
   A card is either a picture the vision carries or a line of its future memory
   rendered as type — the horizon card, which makes this a view of the vision
   rather than a parallel artefact. Up to five at random, one at a time, large,
   five seconds each; optionally only one vision's. */
function visionCards(visionId){
  const vs = (visionId ? [byId(S.visions, visionId)] : visionOpen()).filter(Boolean), out = [];
  vs.forEach(v => {
    (v.images || []).forEach(im => out.push({kind: 'image', src: im.src, caption: im.caption || v.name, vision: v.id}));
    String(v.futureMemory || '').split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 24).forEach(s => out.push({kind: 'horizon', text: s, caption: v.name, vision: v.id}));
  });
  return out;
}
function visionLook(visionId){
  const all = visionCards(visionId);
  if(!all.length){ toast('Nothing to look at yet — write a future memory, or add a picture.'); return; }
  const cards = all.slice().sort(() => Math.random() - .5).slice(0, 5);
  let i = 0, tick = null;
  const m = openModal('<div class="vl-stage" id="vlS"></div>', 'wide plain');
  const draw = () => {
    const c = cards[i], s = m.querySelector('#vlS'); if(!s) return;
    s.innerHTML = c.kind === 'image' ? `<img class="vl-img" src="${esc(c.src)}" alt=""><div class="mono faint">${esc(c.caption)}</div>` : `<p class="vl-text serif">${esc(c.text)}</p><div class="mono faint">${esc(c.caption)}</div>`;
    s.insertAdjacentHTML('beforeend', `<div class="mono faint">${i + 1} of ${cards.length}</div>`);
  };
  draw();
  tick = setInterval(() => { if(!m.isConnected){ clearInterval(tick); return; } i++; if(i >= cards.length){ clearInterval(tick); m.remove(); if(typeof purposeContact === 'function') purposeContact('visualization'); return; } draw(); }, 5000);
  m.addEventListener('click', () => { clearInterval(tick); m.remove(); });
}
