/* ============================================================
   STILLNESS PRACTICE — the receptive half

   The Morning Theatre is the active half: constructing a future and feeling
   it. This is the other one. Nothing is built here. Four ways of being quiet:

     Meditation   a timer, a breathing circle, and no other interface
     Breathwork   four counted patterns, drawn as they run
     Body scan    Maltz's four mental pictures, walked through slowly
     Sanctuary    a room you build once and come back to

   Every session ends the same way, because the books all say the same thing
   about what to do afterwards: notice what happened in the body, and write
   down anything that arrived. What arrives during stillness is the material
   the intuition log is made of, so a session can hand its insight straight
   to it.
   ============================================================ */
const STILL_KINDS = [
  ['meditation', 'Meditation', '🧘'],
  ['breath',     'Breathwork', '🌬'],
  ['scan',       'Body scan',  '🫧'],
  ['sanctuary',  'Sanctuary',  '🚪'],
];
const STILL_LENGTHS = [3, 5, 10, 15, 20, 30, 45];
const STILL_ANCHORS = [
  ['breath', 'Counting the breath'],
  ['body',   'A sensation in the body'],
  ['sound',  'Whatever sound is there'],
  ['mantra', 'A word, repeated'],
];
/* Loehr's ratio for coming down, Wattles' for going up, and two standards */
const BREATH_PATTERNS = [
  {id:'calm',  name:'Calming',    inh:3, hold:0, exh:6, out:0, why:'In to three, out to six. Loehr: a long exhale lowers arousal.'},
  {id:'box',   name:'Box',        inh:4, hold:4, exh:4, out:4, why:'Four all the way round. Balance and focus.'},
  {id:'lift',  name:'Energising', inh:4, hold:7, exh:8, out:0, why:'Wattles: straighten up and fill the lungs FULL.'},
  {id:'deep',  name:'Deep rhythm',inh:5, hold:2, exh:5, out:2, why:'Slow and even, for a long sitting.'},
];
const SCAN_PICTURES = [
  ['concrete',  'Legs of concrete', 'See your legs as made of concrete, sinking into the bed from their sheer weight. Too heavy to lift. Let them sink.'],
  ['marionette','A loose marionette','Your body is a big marionette doll. All the various strings are loose and limp. Your jaw hangs. Your arms hang.'],
  ['balloon',   'Deflating balloons','Your body is a set of inflated rubber balloons. Valves open in your feet, and the air escapes. Slowly you sink into the bed.'],
  ['memory',    'A remembered place','Go back to some relaxing scene from your past. Pay attention to the incidental details — the sounds, the smells, the feel of warmth on your skin.'],
];
const SCAN_STEPS = [
  'Let go of the muscle groups, one at a time. Let your forehead relax. Ease the tension in your jaws. Let your hands, your arms, your shoulders, your legs become a little more relaxed than they were.',
  null,   /* the chosen picture goes here */
  'My nerves are in perfect order. I am breathing deeply and quietly. My heart beats strongly and steadily. My body is resting, my mind is quiet, and my soul is at peace.',
  'Now stop reading, and rest.',
];
const SANCTUARY_WALLS = [['blue','Soft blue'], ['green','Light green'], ['gold','Warm gold'], ['cream','Pale cream']];
const STILL_SENSATIONS = ['numbness','swaying','twitches','warmth','tingling','lightness','heaviness'];

function migrateStillness(){
  const s = S.stillness = S.stillness || {};
  if(!Array.isArray(s.sessions)) s.sessions = [];
  if(!s.sanctuary) s.sanctuary = {built:false, door:'', wall:'blue', view:'', detail:'', visits:0, last:null};
  if(!s.prefs) s.prefs = {kind:'meditation', minutes:10, anchor:'breath', mantra:'', pattern:'calm', picture:'concrete', chime:'bowl'};
  return s;
}
const stillness = () => migrateStillness();
const stillOn = d => stillness().sessions.filter(x => x.date === d);
const stillMinutesOn = d => sum(stillOn(d).map(x => +x.actual || 0));
function stillStreak(){
  let n = 0, d = today();
  /* today not yet sat is not a broken streak — it is a day still going */
  if(!stillMinutesOn(d)) d = addDays(d, -1);
  while(stillMinutesOn(d)){ n++; d = addDays(d, -1); }
  return n;
}
function stillDigest(from, to){
  const xs = stillness().sessions.filter(x => x.date >= from && x.date <= to);
  const avg = k => { const v = xs.map(x => +x[k]).filter(Boolean); return v.length ? +(sum(v) / v.length).toFixed(1) : null; };
  const byKind = {};
  STILL_KINDS.forEach(([k]) => { const g = xs.filter(x => x.kind === k);
    if(g.length) byKind[k] = {n: g.length, minutes: sum(g.map(x => +x.actual || 0))}; });
  return {sessions: xs.length, minutes: sum(xs.map(x => +x.actual || 0)),
    days: new Set(xs.map(x => x.date)).size, depth: avg('depth'), clarity: avg('clarity'), byKind};
}
function saveStillSession(rec){
  const s = stillness();
  s.sessions.unshift(Object.assign({id:uid(), date:today(), createdAt:new Date().toISOString()}, rec));
  /* a session counts towards any habit that is about sitting still */
  if(typeof S.habits !== 'undefined') S.habits.forEach(h => {
    if(h.archived || h.negative) return;
    if(/medit|still|breath|sit\b/i.test(h.name || '') && typeof habitToggle === 'function' && !habitDone(h, today())) habitToggle(h, today());
  });
  saveNow();
  return s.sessions[0];
}

/* ---------- the sitting itself ---------- */
/* A full-viewport overlay with a circle that breathes and almost nothing
   else. The point of the screen is to stop being a screen. */
function openStillTimer(opts){
  const {kind, minutes, anchor, mantra, pattern, picture} = opts;
  const pat = BREATH_PATTERNS.find(p => p.id === pattern) || BREATH_PATTERNS[0];
  const total = Math.max(1, minutes) * 60;
  const m = openModal(`<div class="still-run" id="stillRun">
    <div class="still-circle" id="stillCircle"><i></i><span class="still-cue mono" id="stillCue"></span></div>
    <div class="still-under">
      <span class="mono faint" id="stillLeft"></span>
      ${kind === 'breath' ? '<span class="mono faint" id="stillCycles"></span>' : ''}
      ${anchor === 'mantra' && mantra ? `<span class="still-mantra">${esc(mantra)}</span>` : ''}
      ${anchor === 'breath' && kind === 'meditation' ? '<span class="mono faint" id="stillCount"></span>' : ''}
    </div>
    <button class="btn sm ghost still-end" id="stillEnd">end the sitting</button>
  </div>`, 'wide plain');
  const t0 = Date.now();
  let cycles = 0, breaths = 0, phase = '', done = false;
  const circle = m.querySelector('#stillCircle');
  const cue = m.querySelector('#stillCue');
  /* one loop for everything: the clock, the circle, the counter */
  const period = kind === 'breath' ? (pat.inh + pat.hold + pat.exh + pat.out) : 10;
  const tick = () => {
    const el = (Date.now() - t0) / 1000;
    const left = Math.max(0, total - el);
    m.querySelector('#stillLeft').textContent = fmtClock(Math.round(left));
    /* the circle: for breathwork it follows the pattern exactly; for a plain
       sitting it swells over ten seconds, which is a restful pace to follow
       without being told to */
    const inCycle = el % period;
    let p, cueText;
    if(kind === 'breath'){
      if(inCycle < pat.inh){ p = inCycle / pat.inh; cueText = 'breathe in'; }
      else if(inCycle < pat.inh + pat.hold){ p = 1; cueText = 'hold'; }
      else if(inCycle < pat.inh + pat.hold + pat.exh){ p = 1 - (inCycle - pat.inh - pat.hold) / pat.exh; cueText = 'let it go'; }
      else { p = 0; cueText = 'rest'; }
      const c = Math.floor(el / period);
      if(c !== cycles){ cycles = c; const n = m.querySelector('#stillCycles'); if(n) n.textContent = `${cycles} breath${cycles === 1 ? '' : 's'}`; }
    } else {
      p = (1 - Math.cos(inCycle / period * Math.PI * 2)) / 2;
      cueText = inCycle < period / 2 ? 'in' : 'out';
      const bcount = Math.floor(el / period);
      if(bcount !== breaths){ breaths = bcount; const n = m.querySelector('#stillCount'); if(n) n.textContent = `${breaths}`; }
    }
    circle.style.setProperty('--p', p.toFixed(3));
    if(cueText !== phase){ phase = cueText; cue.textContent = cueText; }
    if(left <= 0 && !done){ done = true; finish(true); }
  };
  const iv = setInterval(tick, 100); tick();
  const finish = (complete) => {
    clearInterval(iv);
    const actual = Math.min(minutes, Math.max(0, Math.round((Date.now() - t0) / 60000 * 10) / 10));
    if(complete && typeof sound === 'function') sound('chime');
    m.remove();
    openStillLog({kind, minutes, actual, complete, anchor, mantra, pattern, picture, cycles});
  };
  m.querySelector('#stillEnd').onclick = () => finish(false);
  /* if the overlay is dismissed some other way, do not leave the loop running */
  new MutationObserver(() => { if(!m.isConnected) clearInterval(iv); }).observe(document.body, {childList:true, subtree:true});
}
function openStillLog(ctx){
  const mins = ctx.actual < .1 ? 0 : ctx.actual;
  const m = openModal(`<h2>${ctx.complete ? 'The sitting is done' : 'Ended early'} — ${mins} minute${mins === 1 ? '' : 's'}</h2>
    <div class="stack">
      <div class="field"><label>How deep did it go?</label>
        <div class="row" style="gap:8px;align-items:center"><div class="sc-rate" id="stDepth">${[1,2,3,4,5].map(n =>
          `<button type="button" data-n="${n}">●</button>`).join('')}</div><span class="mono faint">restless → deep peace</span></div></div>
      <div class="field"><label>How clear?</label>
        <div class="row" style="gap:8px;align-items:center"><div class="sc-rate" id="stClarity">${[1,2,3,4,5].map(n =>
          `<button type="button" data-n="${n}">●</button>`).join('')}</div><span class="mono faint">foggy → crystalline</span></div></div>
      <div class="field"><label>Anything in the body?</label>
        <div class="row" style="gap:6px;flex-wrap:wrap" id="stSens">${STILL_SENSATIONS.map(x =>
          `<button type="button" class="chip" data-sens="${x}">${x}</button>`).join('')}</div>
        <p class="th-quote" style="margin-top:8px">Hicks: you will very likely begin to feel soft, gentle sensations in your body. Smile, and acknowledge them.</p></div>
      <div class="field"><label>Anything arrive? An image, a sentence, a knowing</label>
        <textarea class="inp" id="stInsight" rows="3" placeholder="Leave it empty if nothing did. Most days nothing does."></textarea>
        <label class="row" style="gap:6px;margin-top:6px;font-size:.78rem;align-items:center">
          <input type="checkbox" id="stToIntuition"> <span>and log it as an intuition, to check against later</span></label></div>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="stSave">Keep the session</button></div>
    </div>`);
  let depth = 0, clarity = 0; const sens = [];
  const rate = (id, set) => m.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => {
    set(+b.dataset.n); m.querySelectorAll(`#${id} button`).forEach(x => x.classList.toggle('on', +x.dataset.n <= +b.dataset.n)); });
  rate('stDepth', v => depth = v); rate('stClarity', v => clarity = v);
  m.querySelectorAll('[data-sens]').forEach(b => b.onclick = () => {
    const i = sens.indexOf(b.dataset.sens); if(i >= 0) sens.splice(i, 1); else sens.push(b.dataset.sens);
    b.classList.toggle('on'); });
  m.querySelector('#stSave').onclick = () => {
    const insight = m.querySelector('#stInsight').value.trim();
    const rec = saveStillSession({kind:ctx.kind, planned:ctx.minutes, actual:mins, complete:!!ctx.complete,
      anchor:ctx.anchor || null, mantra:ctx.mantra || '', pattern:ctx.pattern || null, picture:ctx.picture || null,
      cycles:ctx.cycles || 0, depth, clarity, sensations:sens, insight});
    if(insight && m.querySelector('#stToIntuition').checked && typeof logIntuition === 'function'){
      const imp = logIntuition({impression:insight, kind:'flash', strength:3, state:'relaxed',
        context:'during a ' + ctx.kind + ' sitting', source:'stillness', sessionId:rec.id});
      rec.intuitionId = imp.id;
    }
    if(ctx.kind === 'sanctuary'){ const sc = stillness().sanctuary; sc.visits++; sc.last = new Date().toISOString(); }
    saveNow(); sound('success'); m.remove(); rerender();
  };
}
/* Maltz's mental pictures, one card at a time, unhurried */
function openBodyScan(minutes, picture){
  const pic = SCAN_PICTURES.find(p => p[0] === picture) || SCAN_PICTURES[0];
  const cards = SCAN_STEPS.map(s => s === null ? pic[2] : s);
  let i = 0;
  const m = openModal(`<div class="still-guide"><p class="still-card" id="scanCard"></p>
    <div class="row between still-guide-foot"><span class="mono faint" id="scanStep"></span>
      <button class="btn sm primary" id="scanNext">next</button></div></div>`, 'wide plain');
  const draw = () => {
    m.querySelector('#scanCard').textContent = cards[i];
    m.querySelector('#scanStep').textContent = `${i + 1} of ${cards.length}`;
    m.querySelector('#scanNext').textContent = i === cards.length - 1 ? 'rest now' : 'next';
  };
  let auto = setTimeout(function nxt(){ if(i < cards.length - 1){ i++; draw(); auto = setTimeout(nxt, 12000); } }, 12000);
  m.querySelector('#scanNext').onclick = () => {
    clearTimeout(auto);
    if(i < cards.length - 1){ i++; draw(); auto = setTimeout(() => { if(i < cards.length - 1){ i++; draw(); } }, 12000); return; }
    m.remove(); openStillTimer({kind:'scan', minutes, anchor:'body', picture});
  };
  new MutationObserver(() => { if(!m.isConnected) clearTimeout(auto); }).observe(document.body, {childList:true, subtree:true});
  draw();
}
/* The quiet room: built once, in as much detail as you would build a real
   one, and afterwards only re-entered. */
function openSanctuary(minutes){
  const sc = stillness().sanctuary;
  if(sc.built){
    const m = openModal(`<div class="still-guide sanct-in">
      <p class="still-card">Climb the stairs. ${sc.door ? esc(sc.door) + ' is at the top.' : 'The door is at the top.'}
        Open it. The walls are ${esc((SANCTUARY_WALLS.find(w => w[0] === sc.wall) || [,'soft blue'])[1].toLowerCase())}.
        ${sc.view ? 'Through the window: ' + esc(sc.view) + '.' : ''}
        ${sc.detail ? esc(sc.detail) : ''}
        Sit in your chair. You left your worries at the foot of the stairs.</p>
      <div class="row between still-guide-foot"><span class="mono faint">visit ${sc.visits + 1}</span>
        <button class="btn sm primary" id="sanGo">settle</button></div></div>`, 'wide plain');
    m.querySelector('#sanGo').onclick = () => { m.remove(); openStillTimer({kind:'sanctuary', minutes, anchor:'body'}); };
    return;
  }
  const steps = [
    {q:'Close your eyes. Imagine climbing a staircase. At the top is a door. What does it look like?', f:'door', kind:'text'},
    {q:'Open it. This is your quiet room. What colour are the walls?', f:'wall', kind:'choice'},
    {q:'It is simply furnished. There is your chair, and a small window with a beautiful view. What does the view show?', f:'view', kind:'text'},
    {q:'What else makes this room feel safe and restful?', f:'detail', kind:'area'},
  ];
  let i = 0;
  const m = openModal(`<div class="still-guide"><div id="sanBody"></div>
    <div class="row between still-guide-foot"><span class="mono faint" id="sanStep"></span>
      <button class="btn sm primary" id="sanNext">next</button></div></div>`, 'wide plain');
  const draw = () => {
    const st = steps[i];
    m.querySelector('#sanStep').textContent = `${i + 1} of ${steps.length}`;
    m.querySelector('#sanBody').innerHTML = `<p class="still-card">${esc(st.q)}</p>
      ${st.kind === 'choice'
        ? `<div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${SANCTUARY_WALLS.map(([k, n]) =>
            `<button type="button" class="chip ${sc.wall === k ? 'on' : ''}" data-wall="${k}">${n}</button>`).join('')}</div>`
        : st.kind === 'area'
          ? `<textarea class="inp" id="sanF" rows="3">${esc(sc[st.f] || '')}</textarea>`
          : `<input class="inp serif-lg" id="sanF" value="${esc(sc[st.f] || '')}">`}`;
    m.querySelectorAll('[data-wall]').forEach(b => b.onclick = () => { sc.wall = b.dataset.wall; draw(); });
    m.querySelector('#sanNext').textContent = i === steps.length - 1 ? 'settle into the chair' : 'next';
    m.querySelector('#sanF')?.focus();
  };
  m.querySelector('#sanNext').onclick = () => {
    const st = steps[i], f = m.querySelector('#sanF');
    if(f) sc[st.f] = f.value.trim();
    if(i < steps.length - 1){ i++; draw(); return; }
    sc.built = true; saveNow();
    m.remove(); openStillTimer({kind:'sanctuary', minutes, anchor:'body'});
  };
  draw();
}

/* ---------- the section on Today ---------- */
function stillnessHTML(){
  const s = stillness(), T = today();
  const p = s.prefs, kind = p.kind;
  const mins = stillMinutesOn(T);
  const week = sum(Array.from({length:7}, (_, i) => stillMinutesOn(addDays(T, -i))));
  const streak = stillStreak();
  const pat = BREATH_PATTERNS.find(x => x.id === p.pattern) || BREATH_PATTERNS[0];
  const lengths = `<div class="row" style="gap:5px;flex-wrap:wrap">${STILL_LENGTHS.map(n =>
    `<button class="chip ${p.minutes === n ? 'on' : ''}" data-stmin="${n}">${n}m</button>`).join('')}</div>`;
  const body = kind === 'meditation'
    ? `<p class="th-quote">Hicks: sit in a quiet space, close your eyes, relax, and breathe. Your only intention: nothing more than being in this moment and being consciously aware of your breathing.</p>
       <div class="field"><label>How long</label>${lengths}</div>
       <div class="field"><label>What to hold on to</label>
         <div class="row" style="gap:5px;flex-wrap:wrap">${STILL_ANCHORS.map(([k, n]) =>
           `<button class="chip ${p.anchor === k ? 'on' : ''}" data-stanchor="${k}">${n}</button>`).join('')}</div>
         ${p.anchor === 'mantra' ? `<input class="inp sm" id="stMantra" style="margin-top:6px" value="${esc(p.mantra)}" placeholder="One word. Something soft, with nowhere interesting to go.">` : ''}</div>`
    : kind === 'breath'
      ? `<div class="field"><label>The pattern</label>
          <div class="row" style="gap:5px;flex-wrap:wrap">${BREATH_PATTERNS.map(x =>
            `<button class="chip ${p.pattern === x.id ? 'on' : ''}" data-stpat="${x.id}">${x.name} · ${x.inh}-${x.hold}-${x.exh}${x.out ? '-' + x.out : ''}</button>`).join('')}</div>
          <p class="th-quote" style="margin-top:8px">${esc(pat.why)}</p></div>
         <div class="field"><label>How long</label>${lengths}</div>`
      : kind === 'scan'
        ? `<p class="th-quote">Maltz: consciously let go the various muscle groups, then give the mind a picture to hold while the body follows it.</p>
           <div class="field"><label>The picture</label>
             <div class="row" style="gap:5px;flex-wrap:wrap">${SCAN_PICTURES.map(([k, n]) =>
               `<button class="chip ${p.picture === k ? 'on' : ''}" data-stpic="${k}">${n}</button>`).join('')}</div></div>
           <div class="field"><label>How long, after the walk-through</label>${lengths}</div>`
        : `<p class="th-quote">Maltz: take as much care in building this room in your imagination as you would in building an actual one. Nothing can touch you here.</p>
           ${s.sanctuary.built
             ? `<div class="sanct-card"><b class="serif">Your quiet room</b>
                 <div class="mono faint">${esc((SANCTUARY_WALLS.find(w => w[0] === s.sanctuary.wall) || [,''])[1])} walls · ${s.sanctuary.visits} visit${s.sanctuary.visits === 1 ? '' : 's'}</div>
                 ${s.sanctuary.view ? `<p>Through the window: ${esc(s.sanctuary.view)}</p>` : ''}
                 <button class="btn sm ghost" id="stRebuild">build it again</button></div>`
             : `<div class="empty">You have not built it yet. Four questions, and then it is yours to come back to.</div>`}
           <div class="field"><label>How long to stay</label>${lengths}</div>`;
  const recent = s.sessions.slice(0, 3);
  return `<div class="body stillness">
    <div class="still-tabs">${STILL_KINDS.map(([k, n, ic]) =>
      `<button class="${kind === k ? 'on' : ''}" data-stkind="${k}">${ic} ${n}</button>`).join('')}</div>
    <div class="still-pane">${body}
      <div class="row" style="margin-top:12px"><button class="btn primary" id="stBegin">▶ begin</button></div></div>
    <div class="still-stats mono">
      <span>today ${mins ? mins + ' min' : '—'}</span><span>this week ${week ? week + ' min' : '—'}</span>
      <span>${streak ? streak + ' day streak' : 'no streak yet'}</span></div>
    ${recent.length ? `<div class="th-list" style="margin-top:10px">${recent.map(x => `<div class="th-row" style="cursor:default">
      <span><b class="serif">${esc((STILL_KINDS.find(k => k[0] === x.kind) || [,x.kind])[1])}</b>
        <div class="mono faint">${esc(fmtDate(x.date, 'med'))} · ${x.actual} min${x.depth ? ' · depth ' + x.depth + '/5' : ''}${x.insight ? ' · something arrived' : ''}</div></span>
      </div>`).join('')}</div>` : ''}
    <div class="still-util row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
      <button class="btn sm ghost" id="stDraw">🔮 quick draw</button>
      <button class="btn sm ghost" id="stIntuit">⚡ log an intuition</button>
    </div>
  </div>`;
}
function bindStillness(root){
  const s = stillness(), p = s.prefs;
  const q = x => root.querySelector(x);
  const re = () => { saveNow(); rerender(); };
  root.querySelectorAll('[data-stkind]').forEach(b => b.onclick = () => { p.kind = b.dataset.stkind; re(); });
  root.querySelectorAll('[data-stmin]').forEach(b => b.onclick = () => { p.minutes = +b.dataset.stmin; re(); });
  root.querySelectorAll('[data-stanchor]').forEach(b => b.onclick = () => { p.anchor = b.dataset.stanchor; re(); });
  root.querySelectorAll('[data-stpat]').forEach(b => b.onclick = () => { p.pattern = b.dataset.stpat; re(); });
  root.querySelectorAll('[data-stpic]').forEach(b => b.onclick = () => { p.picture = b.dataset.stpic; re(); });
  if(q('#stMantra')) q('#stMantra').oninput = () => { p.mantra = q('#stMantra').value; save(); };
  if(q('#stRebuild')) q('#stRebuild').onclick = () => { s.sanctuary.built = false; re(); };
  if(q('#stBegin')) q('#stBegin').onclick = () => {
    if(p.kind === 'scan') openBodyScan(p.minutes, p.picture);
    else if(p.kind === 'sanctuary') openSanctuary(p.minutes);
    else openStillTimer({kind:p.kind, minutes:p.minutes, anchor:p.anchor, mantra:p.mantra, pattern:p.pattern});
  };
  if(q('#stDraw')) q('#stDraw').onclick = () => openQuickDraw();
  if(q('#stIntuit')) q('#stIntuit').onclick = () => openIntuitionQuick();
}
