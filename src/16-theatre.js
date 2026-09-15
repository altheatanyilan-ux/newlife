/* ============================================================
   THE MORNING THEATRE — six ways of practising a future

   The room already held three of the classical exercises: Maltz's self-image
   script, his winning feeling, and Hill's definite chief aim, with a 21-day
   tracker under them. Six more join them here, each doing a different job:

     the Vision Board     what it looks like — the image layer
     the Scene            what it is like to be inside it — the sensory layer
     Scripting            what it reads like, written as already true
     Structural Tension   the vision and the present held together, on purpose
     the Gratitude line   thanks given for what has not arrived yet
     the Focus Wheel      what to do on a day you do not believe any of it

   The Vision page was retired long ago, so where the source material says "a
   vision" this reads "a project": the thing on the Projects page you are
   actually building towards. Nothing here invents a second place to keep them.
   ============================================================ */

const THEATRE_AREAS = [
  ['body',          'Body'],
  ['home',          'Home'],
  ['relationships', 'Relationships'],
  ['work',          'Work'],
  ['experience',    'Experience'],
  ['being',         'Being'],
  ['general',       'General'],
];
const VB_KINDS = [
  ['image',       '▣', 'An image',      'A photograph, a screenshot, a picture of the thing.'],
  ['quote',       '❝', 'A quote',       'Someone else said it better. Keep who said it.'],
  ['description', '✎', 'A description', 'One or two sentences: what you want, plainly.'],
  ['affirmation', '◈', 'An affirmation','Written as already true — "I am…", "I have…".'],
];
const SCRIPT_CATS = [
  ['today','Today'], ['this_week','This week'], ['body','Body'], ['home','Home'],
  ['relationships','Relationships'], ['work','Work'], ['financial','Money'], ['ideal_life','The whole life'],
];
const TH_FEELINGS = ['excited','peaceful','powerful','held','free','proud','light','certain'];
/* The suggested order the sections are offered in, and their names. A person
   may drag them into their own order; that order is what is remembered. */
const TH_SECTIONS = [
  ['script',   'Self-image script'],
  ['winning',  'The winning feeling'],
  ['pins',     'Pinned'],
  ['board',    'Vision board'],
  ['scene',    'A scene, entered'],
  ['scripting','Scripting'],
  ['tension',  'Structural tension'],
  ['thanks',   'Thanks, in advance'],
  ['aim',      'Definite chief aim'],
];

/* ---------- state ---------- */
function migrateTheatre(){
  const r = S.rehearsal = S.rehearsal || {};
  if(!r.board) r.board = {items:[], layout:'masonry', focusSpeed:5};
  if(!Array.isArray(r.board.items)) r.board.items = [];
  ['scenes','scripts','tension','thanks','wheels'].forEach(k => { if(!Array.isArray(r[k])) r[k] = []; });
  if(!r.prefs) r.prefs = {order:TH_SECTIONS.map(s => s[0]), project:null, showFlow:true};
  if(!Array.isArray(r.prefs.order)) r.prefs.order = TH_SECTIONS.map(s => s[0]);
  /* A section added after someone set their own order still has to appear —
     and it has to appear where it was meant to be. Pushing it onto the end put
     every new section at the bottom of the theatre regardless of where it was
     placed in TH_SECTIONS, which for one placed deliberately next to another
     (Pinned, beside the vision board) is simply the wrong place. So it goes in
     after whichever of its TH_SECTIONS predecessors this person already has,
     and only falls to the end when it has none. */
  TH_SECTIONS.forEach(([k], i) => {
    if(r.prefs.order.includes(k)) return;
    /* Its neighbours here are the only record of where it was meant to go, and
       the one it comes BEFORE is the better anchor: a section is added next to
       the thing it belongs with (Pinned, before the vision board), and if that
       thing has been dragged to the top of somebody's theatre then the top is
       where the new one belongs too. Falling back to the section it comes
       after covers a new last section, which has nothing in front of it. */
    let at = -1;
    for(let j = i + 1; j < TH_SECTIONS.length && at < 0; j++) at = r.prefs.order.indexOf(TH_SECTIONS[j][0]);
    if(at >= 0){ r.prefs.order.splice(at, 0, k); return; }
    for(let j = i - 1; j >= 0 && at < 0; j--) at = r.prefs.order.indexOf(TH_SECTIONS[j][0]);
    if(at < 0) r.prefs.order.push(k); else r.prefs.order.splice(at + 1, 0, k);
  });
  r.prefs.order = r.prefs.order.filter(k => TH_SECTIONS.some(s => s[0] === k));
  if(!Array.isArray(r.days)) r.days = [];
  return r;
}
const theatre = () => migrateTheatre();
const thProjects = () => (S.projects || []).filter(p => !['archived','abandoned'].includes(p.status));
const thProjectName = id => (byId(S.projects, id) || {}).name || '';
/* every practice counts towards the 21 days, not only the script */
function theatreDoneToday(){
  const T = today(), r = theatre();
  return (r.days || []).includes(T)
    || r.scenes.some(x => x.date === T) || r.scripts.some(x => x.date === T)
    || r.tension.some(x => x.date === T) || r.thanks.some(x => x.date === T)
    || r.wheels.some(x => x.date === T);
}
/* a practice was done: mark the day, once */
function theatreMark(){
  const r = theatre(), T = today();
  if(!r.days.includes(T)) r.days.push(T);
  if(!r.cycleStart) r.cycleStart = T;
}
function theatreCountsOn(d){
  const r = theatre();
  return {scenes: r.scenes.filter(x => x.date === d).length, scripts: r.scripts.filter(x => x.date === d).length,
    tension: r.tension.filter(x => x.date === d).length, thanks: r.thanks.filter(x => x.date === d).length,
    wheels: r.wheels.filter(x => x.date === d).length};
}
/* what the Review asks for: how the practice went over a stretch of days */
function theatreDigest(from, to){
  const r = theatre();
  const inRange = x => x.date >= from && x.date <= to;
  const scenes = r.scenes.filter(inRange), scripts = r.scripts.filter(inRange);
  const days = new Set([...r.days.filter(d => d >= from && d <= to),
    ...scenes.map(x => x.date), ...scripts.map(x => x.date),
    ...r.tension.filter(inRange).map(x => x.date), ...r.thanks.filter(inRange).map(x => x.date),
    ...r.wheels.filter(inRange).map(x => x.date)]);
  const avg = (xs, k) => xs.length ? +(sum(xs.map(x => +x[k] || 0)) / xs.length).toFixed(1) : null;
  return {days: days.size, scenes: scenes.length, scripts: scripts.length,
    words: sum(scripts.map(x => +x.words || 0)),
    tension: r.tension.filter(inRange).length, thanks: r.thanks.filter(inRange).length,
    wheels: r.wheels.filter(inRange).length,
    vividness: avg(scenes, 'vivid'), intensity: avg(scenes, 'intensity')};
}

/* ---------- the vision board ---------- */
function vbAdd(item){
  const r = theatre();
  r.board.items.unshift(Object.assign({id:uid(), type:'description', text:'', src:'', caption:'',
    source:'', projectId:null, area:'general', feeling:'', createdAt:new Date().toISOString(),
    order: -Date.now()}, item));
  saveNow();
}
/* the pin that appears wherever there is an image or a quote worth keeping */
function pinToVisionBoard(item, label){
  migrateTheatre(); vbAdd(item); sound('success');
  toast(`${label || 'Pinned'} to the vision board.`);
}
function vbSorted(){
  const items = theatre().board.items.slice();
  return items.sort((a, b) => (a.order || 0) - (b.order || 0));
}
function vbCardHTML(it){
  const proj = it.projectId ? byId(S.projects, it.projectId) : null;
  const dot = proj ? `<i class="vb-dot" title="${esc(proj.name)}"></i>` : '';
  const feel = it.feeling ? `<span class="vb-feel mono">${esc(it.feeling)}</span>` : '';
  const body = it.type === 'image'
    ? `<div class="vb-img"><img src="${esc(it.src)}" alt="${esc(it.caption || '')}" loading="lazy">
        ${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}</div>`
    : it.type === 'quote'
      ? `<blockquote class="vb-quote">${esc(it.text)}${it.source ? `<cite>${esc(it.source)}</cite>` : ''}</blockquote>`
      : it.type === 'affirmation'
        ? `<p class="vb-affirm" data-typed>${esc(it.text)}</p>`
        : `<p class="vb-desc">${esc(it.text)}</p>`;
  return `<figure class="vb-card ${it.type}" data-vb="${it.id}" draggable="true" tabindex="0">
    ${body}
    <div class="vb-meta mono">${dot}<span>${esc((THEATRE_AREAS.find(a => a[0] === it.area) || [,'General'])[1])}</span>${feel}
      <button class="vb-x" data-vbdel="${it.id}" title="take it off the board">×</button></div>
  </figure>`;
}
function openVisionBoardAdd(pre){
  const m = openModal(`<h2>Put something on the board</h2>
    <div class="stack" style="gap:8px">${VB_KINDS.map(([k, ic, name, d]) =>
      `<button class="choice" data-vbk="${k}"><span class="ico">${ic}</span><span><b>${esc(name)}</b><div class="d">${esc(d)}</div></span></button>`).join('')}</div>`, 'narrow');
  m.querySelectorAll('[data-vbk]').forEach(b => b.onclick = () => { m.remove(); openVisionBoardForm(b.dataset.vbk, pre); });
}
function openVisionBoardForm(kind, pre = {}){
  const projects = thProjects();
  const isImg = kind === 'image';
  const m = openModal(`<h2>${esc((VB_KINDS.find(k => k[0] === kind) || [,,'Something'])[2])}</h2>
    <div class="stack">
      ${isImg
        ? `<div class="field"><label>The picture</label>
            <div class="vb-drop" id="vbDrop"><span class="mono faint">drop an image here, or</span>
              <button class="btn sm" id="vbPick">choose a file</button>
              <input type="file" id="vbFile" accept="image/*" hidden></div>
            <div id="vbPrev"></div></div>
          <div class="field"><label>A caption, if it needs one</label>
            <input class="inp" id="vbCap" placeholder="Where this is, or what it is of."></div>`
        : `<div class="field"><label>${kind === 'quote' ? 'The quote' : kind === 'affirmation' ? 'Write it as already true' : 'What you want, in a sentence or two'}</label>
            <textarea class="inp" id="vbText" rows="3" placeholder="${kind === 'affirmation' ? 'I am… / I have…' : ''}">${esc(pre.text || '')}</textarea></div>
          ${kind === 'quote' ? `<div class="field"><label>Who said it</label><input class="inp" id="vbSrc" value="${esc(pre.source || '')}"></div>` : ''}`}
      <div class="field"><label>Which part of a life</label>
        <select class="inp" id="vbArea">${THEATRE_AREAS.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></div>
      <div class="field"><label>How looking at it feels</label>
        <div class="row" style="gap:6px;flex-wrap:wrap" id="vbFeels">
          ${TH_FEELINGS.map(f => `<button type="button" class="chip" data-feel="${f}">${f}</button>`).join('')}</div></div>
      ${projects.length ? `<div class="field"><label>What it serves</label>
        <select class="inp" id="vbProj"><option value="">nothing in particular</option>
          ${projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>` : ''}
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="vbSave">Pin it</button></div>
    </div>`);
  let src = pre.src || '';
  if(isImg){
    const prev = () => { m.querySelector('#vbPrev').innerHTML = src ? `<img class="vb-prev" src="${esc(src)}" alt="">` : ''; };
    const take = files => readImages(files, im => { src = im.src; prev(); });
    m.querySelector('#vbPick').onclick = () => m.querySelector('#vbFile').click();
    m.querySelector('#vbFile').onchange = e => take(e.target.files);
    const drop = m.querySelector('#vbDrop');
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); take(e.dataTransfer.files); });
    prev();
  }
  let feeling = '';
  m.querySelectorAll('[data-feel]').forEach(b => b.onclick = () => {
    feeling = feeling === b.dataset.feel ? '' : b.dataset.feel;
    m.querySelectorAll('[data-feel]').forEach(x => x.classList.toggle('on', x.dataset.feel === feeling));
  });
  m.querySelector('#vbSave').onclick = () => {
    const text = m.querySelector('#vbText')?.value.trim() || '';
    if(isImg && !src){ toast('Choose a picture first.'); return; }
    if(!isImg && !text){ toast('Write something first.'); return; }
    vbAdd({type:kind, src, caption: m.querySelector('#vbCap')?.value.trim() || '', text,
      source: m.querySelector('#vbSrc')?.value.trim() || '', area: m.querySelector('#vbArea').value,
      feeling, projectId: m.querySelector('#vbProj')?.value || null});
    theatreMark(); saveNow(); sound('success'); m.remove(); rerender();
  };
}
/* Focus mode: a few of them, one at a time, large, slowly. The digital
   equivalent of sitting in front of the box and actually looking in it. */
function openVisionBoardFocus(){
  const all = vbSorted();
  if(!all.length){ toast('Nothing on the board yet.'); return; }
  const pick = all.slice().sort(() => Math.random() - .5).slice(0, Math.min(5, all.length));
  const secs = theatre().board.focusSpeed || 5;
  const m = openModal(`<div class="vb-focus" id="vbFocus">
    <div class="vb-stage" id="vbStage"></div>
    <div class="vb-focus-foot"><span class="mono faint" id="vbCount"></span>
      <span class="mono faint">tap anywhere for the next one</span></div>
  </div>`, 'wide');
  let i = -1, timer = null;
  const step = () => {
    i++;
    if(i >= pick.length){ m.remove(); theatreMark(); saveNow(); return; }
    const it = pick[i];
    m.querySelector('#vbStage').innerHTML = `<div class="vb-slide">${
      it.type === 'image' ? `<img src="${esc(it.src)}" alt="">${it.caption ? `<p class="vb-cap">${esc(it.caption)}</p>` : ''}`
        : `<p class="vb-big">${esc(it.text)}</p>${it.source ? `<cite>${esc(it.source)}</cite>` : ''}`}</div>`;
    m.querySelector('#vbCount').textContent = `${i + 1} of ${pick.length}`;
    clearTimeout(timer); timer = setTimeout(step, secs * 1000);
  };
  m.querySelector('#vbFocus').onclick = step;
  m.addEventListener('remove', () => clearTimeout(timer));
  new MutationObserver(() => { if(!m.isConnected) clearTimeout(timer); }).observe(document.body, {childList:true, subtree:true});
  step();
}

/* ---------- a scene, entered ----------
   Five steps, one screen each. Not a form: a walk through a place that does
   not exist yet, in enough detail that the nervous system cannot tell. */
const SCENE_STEPS = [
  {key:'where', title:'Set the scene', quote:'', fields:[
    ['location', 'Where does this take place?', 'text', 'A room, a street, a shore — name it.'],
    ['setting',  'Indoors or out?', 'choice', ['indoors','outdoors']],
    ['timeOfDay','What time of day?', 'choice', ['morning','afternoon','evening','night']],
    ['temp',     'What is the temperature?', 'text', 'Warm and humid. Cold enough for a coat.']]},
  {key:'senses', title:'What it is like to be there',
   quote:'Maltz: details of the imagined environment are all-important, because for all practical purposes you are creating a practice experience.', fields:[
    ['see',   'What do you see?', 'area', ''],
    ['hear',  'What do you hear?', 'area', ''],
    ['feel',  'What do you feel on your skin?', 'area', ''],
    ['smell', 'What can you smell?', 'area', '']]},
  {key:'self', title:'You, in it',
   quote:'Hicks: if you bring someone else into the scene, it matters that it feels good to have them there.', fields:[
    ['wearing', 'What are you wearing?', 'text', ''],
    ['doing',   'What are you doing?', 'area', ''],
    ['whoElse', 'Who else is there, and what mood are they in?', 'area', ''],
    ['dialogue','One line of dialogue — something said to you, or by you', 'text', '']]},
  {key:'feeling', title:'The feeling',
   quote:'Wattles: live in the new house mentally until it takes form around you.', fields:[
    ['emotion',   'How do you feel, standing in it?', 'text', ''],
    ['vivid',     'How vivid was it?', 'rate', 'vague → I could smell it'],
    ['intensity', 'How strongly did you feel it?', 'rate', 'neutral → I felt it in my body']]},
];
function openScene(existing){
  migrateTheatre();
  const data = Object.assign({id:uid(), date:today(), projectId:theatre().prefs.project || null,
    location:'', setting:'indoors', timeOfDay:'morning', temp:'', see:'', hear:'', feel:'', smell:'',
    wearing:'', doing:'', whoElse:'', dialogue:'', emotion:'', vivid:3, intensity:3}, existing || {});
  const fresh = !existing;
  let step = 0;
  const m = openModal(`<div class="sc-flow"><div class="sc-prog"><i id="scBar"></i></div>
    <div id="scBody"></div>
    <div class="row between sc-foot"><button class="btn sm ghost" id="scBack">back</button>
      <span class="mono faint" id="scStep"></span>
      <button class="btn primary" id="scNext">next</button></div></div>`, 'wide');
  const field = (f) => {
    const [key, label, kind, extra] = f;
    if(kind === 'choice') return `<div class="field"><label>${esc(label)}</label>
      <div class="row" style="gap:6px;flex-wrap:wrap">${extra.map(o =>
        `<button type="button" class="chip ${data[key] === o ? 'on' : ''}" data-set="${key}" data-val="${o}">${o}</button>`).join('')}</div></div>`;
    if(kind === 'rate') return `<div class="field"><label>${esc(label)}</label>
      <div class="row" style="gap:8px;align-items:center"><div class="sc-rate">${[1,2,3,4,5].map(n =>
        `<button type="button" class="${(+data[key] || 0) >= n ? 'on' : ''}" data-rate="${key}" data-n="${n}">●</button>`).join('')}</div>
        <span class="mono faint">${esc(extra)}</span></div></div>`;
    if(kind === 'area') return `<div class="field"><label>${esc(label)}</label>
      <textarea class="inp" rows="2" data-f="${key}" placeholder="${esc(extra || '')}">${esc(data[key] || '')}</textarea></div>`;
    return `<div class="field"><label>${esc(label)}</label>
      <input class="inp" data-f="${key}" value="${esc(data[key] || '')}" placeholder="${esc(extra || '')}"></div>`;
  };
  const projects = thProjects();
  const draw = () => {
    const st = SCENE_STEPS[step];
    m.querySelector('#scBar').style.width = ((step + 1) / (SCENE_STEPS.length + 1) * 100) + '%';
    m.querySelector('#scStep').textContent = `${step + 1} of ${SCENE_STEPS.length + 1}`;
    m.querySelector('#scBody').innerHTML = step < SCENE_STEPS.length
      ? `<h2>${esc(st.title)}</h2>
         ${st.quote ? `<p class="sc-quote">${esc(st.quote)}</p>` : ''}
         <div class="stack">${st.fields.map(field).join('')}</div>
         ${step === 0 && projects.length ? `<div class="field"><label>What it serves</label>
           <select class="inp" data-f="projectId"><option value="">nothing in particular</option>
             ${projects.map(p => `<option value="${p.id}" ${data.projectId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>` : ''}`
      : `<h2>Step out of it</h2>
         <p class="sc-quote">Hicks: get into the scene quickly, bring yourself to a place of really feeling good, and then get out. Do not stay so long that you start looking for it to have happened.</p>
         <div class="sc-close"><p class="serif-lg">${esc(data.emotion || 'You were there.')}</p>
           <p class="muted">Leave it now. It is filed, and it will be here tomorrow with room to add to.</p></div>`;
    m.querySelector('#scBack').hidden = step === 0;
    m.querySelector('#scNext').textContent = step < SCENE_STEPS.length ? 'next' : 'Close the scene';
    m.querySelectorAll('[data-f]').forEach(el_ => el_.oninput = () => { data[el_.dataset.f] = el_.value; });
    m.querySelectorAll('[data-set]').forEach(b => b.onclick = () => { data[b.dataset.set] = b.dataset.val; draw(); });
    m.querySelectorAll('[data-rate]').forEach(b => b.onclick = () => { data[b.dataset.rate] = +b.dataset.n; draw(); });
  };
  m.querySelector('#scBack').onclick = () => { if(step > 0){ step--; draw(); } };
  m.querySelector('#scNext').onclick = () => {
    if(step < SCENE_STEPS.length){ step++; draw(); return; }
    const r = theatre();
    data.date = today(); data.createdAt = new Date().toISOString();
    const at = r.scenes.findIndex(x => x.id === data.id);
    if(at >= 0) r.scenes[at] = data; else r.scenes.unshift(data);
    theatreMark(); saveNow(); sound('success');
    toast(fresh ? 'The scene is filed.' : 'The scene has grown.');
    m.remove(); rerender();
  };
  draw();
}
const sceneTitle = sc => sc.location || sc.doing || 'A scene';

/* ---------- scripting ---------- */
function saveScript(cat, body, projectId){
  const text = (body || '').trim(); if(!text) return null;
  const r = theatre();
  const rec = {id:uid(), date:today(), cat, projectId: projectId || null, body:text,
    words: text.split(/\s+/).filter(Boolean).length, createdAt:new Date().toISOString()};
  r.scripts.unshift(rec);
  /* a script is a journal entry as well, so the Review and the search find it */
  S.entries.push({id:uid(), type:'manifestation',
    title:`Scripted — ${(SCRIPT_CATS.find(c => c[0] === cat) || [,cat])[1]}`, body:text,
    occurredAt:today(), createdAt:new Date().toISOString(), media:[],
    links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:projectId?[projectId]:[],people:[]},
    people:[], places:[], emotions:[], tags:['scripting'], confidence:'', extra:{scriptId:rec.id}});
  theatreMark(); saveNow();
  return rec;
}

/* ---------- structural tension ---------- */
/* Fritz's pivotal technique: hold the result you want and where you actually
   are, at the same time, without resolving either — the gap is the engine. */
function tensionFor(projectId){
  const p = byId(S.projects, projectId);
  const r = theatre();
  const last = r.tension.find(x => x.projectId === projectId);
  return {
    vision: last?.vision || p?.description || '',
    reality: last?.reality || p?.notes || '',
  };
}
function saveTension(projectId, vision, reality, chose){
  const r = theatre();
  r.tension.unshift({id:uid(), date:today(), projectId, vision, reality, chose: !!chose,
    createdAt:new Date().toISOString()});
  /* the edits belong to the project too, or they are lost the moment you leave */
  const p = byId(S.projects, projectId);
  if(p){ if(vision) p.description = vision; if(reality) p.notes = reality; }
  r.prefs.project = projectId;
  theatreMark(); saveNow();
}

/* ---------- thanks, in advance ---------- */
function saveThanks(lines, projectId){
  const kept = (lines || []).map(x => (x || '').trim()).filter(Boolean);
  if(!kept.length) return null;
  const r = theatre();
  const rec = {id:uid(), date:today(), lines:kept, projectId: projectId || null, createdAt:new Date().toISOString()};
  r.thanks.unshift(rec);
  S.entries.push({id:uid(), type:'gratitude', title:'Thanks, in advance',
    body: kept.map(l => '· ' + l).join('\n'), occurredAt:today(), createdAt:new Date().toISOString(), media:[],
    links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:projectId?[projectId]:[],people:[]},
    people:[], places:[], emotions:[], tags:['anticipatory'], confidence:'', extra:{anticipatory:true, thanksId:rec.id}});
  theatreMark(); saveNow();
  return rec;
}

/* ---------- the focus wheel ----------
   Not part of the morning. It is for the day you look at all of the above and
   do not believe a word of it: name the thing you cannot believe, then find
   twelve thoughts that are each slightly easier to believe than the last. */
function openFocusWheel(existing){
  migrateTheatre();
  const data = Object.assign({id:uid(), date:today(), topic:'', want:'', belief:'',
    statements:['','','','',''], projectId:theatre().prefs.project || null}, existing || {});
  const projects = thProjects();
  const m = openModal(`<h2>Feeling resistance</h2>
    <p class="muted" style="font-size:.86rem;margin:0 0 14px">Name what you cannot believe, then walk towards it one thought at a time. Each one only has to be a little easier than the last.</p>
    <div class="stack">
      <div class="field"><label>What feels bad</label><input class="inp" data-w="topic" value="${esc(data.topic)}" placeholder="I will never be able to afford it."></div>
      <div class="field"><label>What you would rather feel</label><input class="inp" data-w="want" value="${esc(data.want)}" placeholder="At ease about money."></div>
      <div class="field"><label>The belief in the middle of the wheel</label><input class="inp serif-lg" data-w="belief" value="${esc(data.belief)}" placeholder="There is enough, and it is coming."></div>
      ${projects.length ? `<div class="field"><label>About which</label><select class="inp" data-w="projectId"><option value="">nothing in particular</option>
        ${projects.map(p => `<option value="${p.id}" ${data.projectId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>` : ''}
      <div class="fw-wrap"><div id="fwSvg"></div>
        <div class="fw-inputs" id="fwIn"></div></div>
      <div class="row between" style="margin-top:14px">
        <button class="btn sm ghost" id="fwMore">＋ another thought</button>
        <button class="btn primary" id="fwSave">Save the wheel</button></div>
    </div>`, 'wide');
  const drawWheel = () => {
    const n = data.statements.length, R = 92, C = 128;
    const spokes = data.statements.map((s, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = C + Math.cos(a) * R, y = C + Math.sin(a) * R;
      return `<line x1="${C}" y1="${C}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--sage,#7f916a)" stroke-width="1" opacity=".5"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.trim() ? 6 : 3.4}" fill="${s.trim() ? 'var(--sage,#7f916a)' : 'none'}" stroke="var(--sage,#7f916a)" stroke-width="1"/>
        ${s.trim() ? `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" class="fw-n">${i + 1}</text>` : ''}`;
    }).join('');
    m.querySelector('#fwSvg').innerHTML = `<svg class="fw-svg" viewBox="0 0 256 256">
      <circle cx="128" cy="128" r="92" fill="none" stroke="var(--sage,#7f916a)" stroke-width="1" opacity=".45"/>
      ${spokes}
      <circle cx="128" cy="128" r="46" fill="none" stroke="var(--terra,#b4462f)" stroke-width="1.2"/>
      <foreignObject x="84" y="100" width="88" height="60"><div class="fw-mid">${esc(data.belief || 'the belief')}</div></foreignObject>
    </svg>`;
    m.querySelector('#fwIn').innerHTML = data.statements.map((s, i) =>
      `<label class="fw-row"><span class="mono">${i + 1}</span>
        <input class="inp" data-s="${i}" value="${esc(s)}" placeholder="${i === 0 ? 'Something you already believe, however small.' : 'A little easier than the one before.'}"></label>`).join('');
    m.querySelectorAll('[data-s]').forEach(el_ => el_.oninput = () => { data.statements[+el_.dataset.s] = el_.value; drawWheel0(); });
  };
  /* redraw the wheel without rebuilding the inputs, so typing is not interrupted */
  const drawWheel0 = debounce(() => { const focused = document.activeElement?.dataset?.s;
    drawWheel(); if(focused != null){ const el_ = m.querySelector(`[data-s="${focused}"]`);
      if(el_){ el_.focus(); el_.setSelectionRange(el_.value.length, el_.value.length); } } }, 400);
  m.querySelectorAll('[data-w]').forEach(el_ => el_.oninput = () => { data[el_.dataset.w] = el_.value;
    if(el_.dataset.w === 'belief') drawWheel0(); });
  m.querySelector('#fwMore').onclick = () => { if(data.statements.length < 12){ data.statements.push(''); drawWheel(); } };
  m.querySelector('#fwSave').onclick = () => {
    data.statements = data.statements.map(s => s.trim()).filter(Boolean);
    if(!data.belief.trim() && !data.statements.length){ toast('Write the belief, or one thought towards it.'); return; }
    const r = theatre();
    data.date = today(); data.createdAt = new Date().toISOString();
    r.wheels.unshift(data);
    S.entries.push({id:uid(), type:'reflection', title:`Focus wheel — ${data.belief || data.topic || 'resistance'}`,
      body: [data.topic ? `What felt bad: ${data.topic}` : '', data.want ? `What I wanted instead: ${data.want}` : '',
        data.belief ? `The belief: ${data.belief}` : '', '', ...data.statements.map((s, i) => `${i + 1}. ${s}`)]
        .filter(x => x !== undefined).join('\n'),
      occurredAt:today(), createdAt:new Date().toISOString(), media:[],
      links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:data.projectId?[data.projectId]:[],people:[]},
      people:[], places:[], emotions:[], tags:['focus wheel'], confidence:'', extra:{wheelId:data.id}});
    theatreMark(); saveNow(); sound('success'); m.remove(); rerender();
  };
  drawWheel();
}

/* ---------- the room, drawn ---------- */
function theatrePanelHTML(key){
  const r = theatre(), T = today();
  const projects = thProjects();
  const done = k => ({
    board:  r.board.items.length > 0,
    scene:  r.scenes.some(x => x.date === T),
    scripting: r.scripts.some(x => x.date === T),
    tension: r.tension.some(x => x.date === T),
    thanks: r.thanks.some(x => x.date === T),
    script: !!(r.script || '').trim(),
    winning: !!(r.winning || '').trim(),
    aim: !!(r.aim || '').trim(),
  })[k];
  const head = (name, note) => `<summary><span class="th-name">${esc(name)}</span>
    <span class="mono faint">${esc(note || '')}</span>${done(key) ? '<i class="th-tick">✓</i>' : ''}</summary>`;
  const quote = t => `<p class="th-quote">${esc(t)}</p>`;
  const projSelect = (id, sel, first) => projects.length
    ? `<select class="inp sm" id="${id}"><option value="">${esc(first)}</option>
        ${projects.map(p => `<option value="${p.id}" ${sel === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>` : '';

  if(key === 'script') return `<details class="th-sec" data-th="script" open>${head('Self-image script', 'Maltz')}
    <div class="th-body">${quote('Close your eyes for thirty minutes. See yourself acting, feeling and being as you want to be. The nervous system cannot tell a real experience from one vividly imagined.')}
      ${ed('rehearsal.script', {multi:true, mdr:true, cls:'prose serif-lg', ph:'First person, present tense. Who you are becoming — vivid, sensory, felt as already real.'})}</div></details>`;

  if(key === 'winning') return `<details class="th-sec" data-th="winning">${head('The winning feeling', 'Maltz')}
    <div class="th-body"><div class="faint" style="font-size:.8rem;margin-bottom:6px">Recall a moment when you felt self-confident and successful. Capture that feeling, then weld it to your vision of the future.</div>
      ${ed('rehearsal.winning', {multi:true, cls:'prose', ph:'Where were you? What did your body do?'})}</div></details>`;

  if(key === 'aim') return `<details class="th-sec" data-th="aim">${head('Definite chief aim', 'Hill')}
    <div class="th-body"><div class="faint" style="font-size:.8rem;margin-bottom:6px">The exact thing desired, what you will give in return, the date, the plan. Read aloud morning and night, with feeling.</div>
      ${ed('rehearsal.aim', {multi:true, cls:'prose serif-lg', ph:'By [date] I will have [exactly this]. In return I will give [this].'})}</div></details>`;

  /* drawn next door, where the entries it holds are already drawn from */
  if(key === 'pins') return typeof pinsPanelHTML === 'function' ? pinsPanelHTML() : '';

  if(key === 'board'){
    const items = vbSorted();
    return `<details class="th-sec" data-th="board">${head('Vision board', items.length ? `${items.length} on it` : 'empty')}
      <div class="th-body">
        <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <button class="btn sm primary" id="vbAddBtn">＋ pin something</button>
          ${items.length >= 2 ? '<button class="btn sm ghost" id="vbShuffle">shuffle</button>' : ''}
          ${items.length ? '<button class="btn sm ghost" id="vbFocusBtn">focus mode</button>' : ''}
        </div>
        ${items.length
          ? `<div class="vb-grid">${items.map(vbCardHTML).join('')}</div>`
          : `<div class="empty">Nothing on the board yet. Pin a picture, a quote, or a sentence about something you want — and put it where you will see it every morning.</div>`}
        ${quote('Hicks: whatever is contained in this box — IS. Look at these. Feel what it would be like to live in them, now.')}
      </div></details>`;
  }

  if(key === 'scene'){
    const scenes = theatre().scenes.slice(0, 6);
    return `<details class="th-sec" data-th="scene">${head('A scene, entered', scenes.length ? `${theatre().scenes.length} kept` : 'none yet')}
      <div class="th-body">
        <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <button class="btn sm primary" id="scNew">＋ build a scene</button></div>
        ${scenes.length ? `<div class="th-list">${scenes.map(sc => `<button class="th-row" data-scene="${sc.id}">
            <span><b class="serif">${esc(sceneTitle(sc))}</b>
              <div class="mono faint">${esc(fmtDate(sc.date, 'med'))} · ${esc(sc.timeOfDay)} · vividness ${sc.vivid}/5 · felt ${sc.intensity}/5${sc.projectId ? ' · ' + esc(thProjectName(sc.projectId)) : ''}</div></span>
            <span class="mono faint">revisit →</span></button>`).join('')}</div>`
          : `<div class="empty">A place that does not exist yet, in enough detail that your nervous system cannot tell. Five steps, five minutes.</div>`}
        ${quote('Maltz: details of the imagined environment are all-important — for all practical purposes you are creating a practice experience.')}
      </div></details>`;
  }

  if(key === 'scripting'){
    const recent = theatre().scripts.slice(0, 4);
    return `<details class="th-sec" data-th="scripting">${head('Scripting', recent.length ? `${theatre().scripts.length} written` : 'nothing written')}
      <div class="th-body">
        ${quote('Write it in the present tense, in the first person, as though the day has already happened exactly as you would have it.')}
        <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
          <select class="inp sm" id="scrCat">${SCRIPT_CATS.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>
          ${projSelect('scrProj', r.prefs.project, 'nothing in particular')}</div>
        <textarea class="inp scr-area" id="scrBody" rows="7" placeholder="I woke and the light was already in the room…"></textarea>
        <div class="row between" style="margin-top:8px"><span class="mono faint" id="scrCount">0 words</span>
          <button class="btn sm primary" id="scrSave">Keep it</button></div>
        ${recent.length ? `<div class="th-list" style="margin-top:12px">${recent.map(s => `<button class="th-row" data-script="${s.id}">
          <span><b class="serif">${esc((SCRIPT_CATS.find(c => c[0] === s.cat) || [,s.cat])[1])}</b>
            <div class="mono faint">${esc(fmtDate(s.date, 'med'))} · ${s.words} words</div></span>
          <span class="mono faint">read →</span></button>`).join('')}</div>` : ''}
      </div></details>`;
  }

  if(key === 'tension'){
    const pid = r.prefs.project || projects[0]?.id || '';
    const t = pid ? tensionFor(pid) : {vision:'', reality:''};
    const chosen = r.tension.find(x => x.projectId === pid && x.date === T && x.chose);
    return `<details class="th-sec" data-th="tension">${head('Structural tension', 'Fritz')}
      <div class="th-body">
        ${quote('Hold the result you want and where you actually are, at the same time, without resolving either. The gap between them is not a problem to be solved — it is the thing that does the work.')}
        ${projects.length ? `<div class="field"><label>The result</label>${projSelect('stProj', pid, 'choose a project')}</div>
        <div class="st-cols">
          <div class="st-col"><label class="mono">what you want</label>
            <textarea class="inp" id="stVision" rows="5" placeholder="Written as a result, not as a wish. What is true when it is done?">${esc(t.vision)}</textarea></div>
          <div class="st-gap" aria-hidden="true"><i></i></div>
          <div class="st-col"><label class="mono">where you actually are</label>
            <textarea class="inp" id="stReality" rows="5" placeholder="Honestly, and without softening it. Is this still accurate? What has changed?">${esc(t.reality)}</textarea></div>
        </div>
        <div class="row between" style="margin-top:10px">
          <button class="btn sm ghost" id="stSave">save both</button>
          <button class="btn sm ${chosen ? '' : 'primary'}" id="stChoose">${chosen ? '✓ chosen today' : 'I choose this result'}</button></div>`
        : `<div class="empty">Structural tension needs a result to hold against the present. Name a project first, on the Projects page.</div>`}
      </div></details>`;
  }

  if(key === 'thanks'){
    const todayThanks = r.thanks.find(x => x.date === T);
    return `<details class="th-sec" data-th="thanks">${head('Thanks, in advance', todayThanks ? 'given today' : '60 seconds')}
      <div class="th-body">
        ${quote('Wattles: the man who can sincerely give thanks for the things which as yet he owns only in imagination has real faith. This is not gratitude for what is here. It is gratitude for what is coming.')}
        ${todayThanks
          ? `<ul class="th-thanks">${todayThanks.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
             <button class="btn sm ghost" id="thAgain">give thanks again</button>`
          : `<div class="stack" style="gap:6px">
              ${[0,1,2].map(i => `<input class="inp" data-thanks="${i}" placeholder="${i === 0 ? 'I am grateful for…' : 'And…'}">`).join('')}
              ${projSelect('thProj', r.prefs.project, 'nothing in particular')}
              <div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn sm primary" id="thSave">Give thanks</button></div>
            </div>`}
      </div></details>`;
  }
  return '';
}
function theatreHTML(){
  const r = theatre(), T = today();
  const cycleStart = r.cycleStart || T;
  const cycleDay = daysBetween(cycleStart, T);
  const kept = r.days.filter(d => d >= cycleStart).length;
  const c = theatreCountsOn(T);
  const did = [c.scenes && `${c.scenes} scene${c.scenes === 1 ? '' : 's'}`, c.scripts && `${c.scripts} script${c.scripts === 1 ? '' : 's'}`,
    c.tension && 'tension held', c.thanks && 'thanks given', c.wheels && 'a wheel'].filter(Boolean).join(' · ');
  return `<div class="body theatre">
    ${r.prefs.showFlow ? `<div class="th-flow"><span class="mono">a suggested half hour</span>
      <span>5 min self-image script · 5 min vision board, focus mode · 10 min a scene · 5 min scripting · 3 min thanks · 2 min the chief aim, read aloud</span>
      <button class="th-flow-x" id="thHideFlow" title="don't show this again">×</button></div>` : ''}
    <div class="th-secs" id="thSecs">${r.prefs.order.map(theatrePanelHTML).join('')}</div>
    <div class="th-foot">
      <div class="field"><label>21-day tracker <span class="mono" style="text-transform:none;letter-spacing:0">· day ${clamp(cycleDay + 1, 1, 21)} of 21 · ${kept} practised${did ? ' · today: ' + did : ''}</span></label>
        <div class="tracker">${Array.from({length:21}, (_, i) => { const d = addDays(cycleStart, i);
          return `<i class="${r.days.includes(d) ? 'done' : ''} ${d === T ? 'today' : ''}" data-td="${d}" title="${fmtDate(d, 'med')}"></i>`; }).join('')}</div>
        <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">
          <button class="btn sm ${theatreDoneToday() ? '' : 'primary'}" id="markTheatre">${theatreDoneToday() ? '✓ Practised today' : "Mark today's practice"}</button>
          <button class="btn sm ghost" id="newCycle">Begin a new 21-day cycle</button>
          <button class="btn sm ghost" id="thWheel">Feeling resistance?</button>
        </div>
      </div>
    </div>
  </div>`;
}
function bindTheatre(root){
  const r = theatre();
  const re = () => { saveNow(); rerender(); };
  const q = s => root.querySelector(s);

  if(q('#thHideFlow')) q('#thHideFlow').onclick = () => { r.prefs.showFlow = false; re(); };
  if(q('#thWheel')) q('#thWheel').onclick = () => openFocusWheel();

  /* the vision board */
  if(q('#vbAddBtn')) q('#vbAddBtn').onclick = () => openVisionBoardAdd();
  if(q('#vbFocusBtn')) q('#vbFocusBtn').onclick = () => openVisionBoardFocus();
  if(q('#vbShuffle')) q('#vbShuffle').onclick = () => {
    /* Shuffle so the eye does not stop seeing them. It rewrites the order, so
       what you see today is where they actually are, not a trick of drawing. */
    const items = r.board.items.slice().sort(() => Math.random() - .5);
    items.forEach((it, i) => { it.order = i; });
    sound('click'); re();
  };
  root.querySelectorAll('[data-vbdel]').forEach(b => b.onclick = ev => { ev.stopPropagation();
    const id = b.dataset.vbdel; const it = r.board.items.find(x => x.id === id); if(!it) return;
    requestDelete({label:'that from the board', node: b.closest('.vb-card'),
      remove: () => { const back = spliceOut(r.board.items, x => x.id === id); return back; }, after: re});
  });
  /* drag a card to reorder the board */
  let vbDrag = null;
  root.querySelectorAll('[data-vb]').forEach(card => {
    card.addEventListener('dragstart', ev => { vbDrag = card.dataset.vb; card.classList.add('dragging');
      ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', vbDrag); } catch(e){} });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); vbDrag = null; });
    card.addEventListener('dragover', ev => { if(vbDrag && vbDrag !== card.dataset.vb){ ev.preventDefault(); card.classList.add('over'); } });
    card.addEventListener('dragleave', () => card.classList.remove('over'));
    card.addEventListener('drop', ev => { ev.preventDefault(); card.classList.remove('over');
      const from = r.board.items.find(x => x.id === vbDrag), onto = r.board.items.find(x => x.id === card.dataset.vb);
      vbDrag = null; if(!from || !onto || from === onto) return;
      const list = vbSorted(); const at = list.indexOf(onto);
      list.splice(list.indexOf(from), 1); list.splice(at, 0, from);
      list.forEach((it, i) => { it.order = i; });
      sound('click'); re(); });
  });

  /* scenes */
  if(q('#scNew')) q('#scNew').onclick = () => openScene();
  root.querySelectorAll('[data-scene]').forEach(b => b.onclick = () =>
    openScene(r.scenes.find(x => x.id === b.dataset.scene)));

  /* scripting */
  const body = q('#scrBody');
  if(body){
    const count = () => { const n = body.value.trim().split(/\s+/).filter(Boolean).length;
      q('#scrCount').textContent = `${n} word${n === 1 ? '' : 's'}`; };
    body.addEventListener('input', count); count();
    q('#scrSave').onclick = () => {
      const rec = saveScript(q('#scrCat').value, body.value, q('#scrProj')?.value || null);
      if(!rec){ toast('Write something first.'); return; }
      sound('success'); toast('Kept — and filed under Manifestation in the Lived Record.'); re();
    };
  }
  root.querySelectorAll('[data-script]').forEach(b => b.onclick = () => {
    const s = r.scripts.find(x => x.id === b.dataset.script); if(!s) return;
    openModal(`<h2>${esc((SCRIPT_CATS.find(c => c[0] === s.cat) || [,s.cat])[1])}</h2>
      <div class="mono faint" style="margin-bottom:10px">${esc(fmtDate(s.date, 'med'))} · ${s.words} words</div>
      <div class="prose serif-lg" style="white-space:pre-wrap">${esc(s.body)}</div>`, 'wide');
  });

  /* structural tension */
  if(q('#stProj')) q('#stProj').onchange = () => { r.prefs.project = q('#stProj').value || null; re(); };
  const stSave = (chose) => {
    const pid = q('#stProj')?.value || r.prefs.project; if(!pid){ toast('Choose a project first.'); return; }
    saveTension(pid, q('#stVision').value.trim(), q('#stReality').value.trim(), chose);
    sound(chose ? 'success' : 'click');
    if(chose) toast('Chosen. Now let it go and get on with the day.');
    re();
  };
  if(q('#stSave')) q('#stSave').onclick = () => stSave(false);
  if(q('#stChoose')) q('#stChoose').onclick = () => stSave(true);

  /* thanks */
  if(q('#thSave')) q('#thSave').onclick = () => {
    const lines = [...root.querySelectorAll('[data-thanks]')].map(i => i.value);
    if(!saveThanks(lines, q('#thProj')?.value || null)){ toast('Write at least one line.'); return; }
    sound('success'); toast('Given — and filed under Gratitude.'); re();
  };
  if(q('#thAgain')) q('#thAgain').onclick = () => {
    const i = r.thanks.findIndex(x => x.date === today());
    if(i >= 0) r.thanks.splice(i, 1); re();
  };

  /* the sections can be dragged into the order you actually practise in */
  let thDrag = null;
  root.querySelectorAll('[data-th]').forEach(sec => {
    const sum = sec.querySelector('summary'); if(!sum) return;
    sum.setAttribute('draggable', 'true');
    sum.addEventListener('dragstart', ev => { thDrag = sec.dataset.th; sec.classList.add('dragging');
      ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', thDrag); } catch(e){} });
    sum.addEventListener('dragend', () => { sec.classList.remove('dragging'); thDrag = null; });
    sec.addEventListener('dragover', ev => { if(thDrag && thDrag !== sec.dataset.th){ ev.preventDefault(); sec.classList.add('over'); } });
    sec.addEventListener('dragleave', () => sec.classList.remove('over'));
    sec.addEventListener('drop', ev => { ev.preventDefault(); sec.classList.remove('over');
      const from = thDrag, onto = sec.dataset.th; thDrag = null;
      if(!from || from === onto) return;
      const o = r.prefs.order.filter(k => k !== from);
      o.splice(o.indexOf(onto), 0, from);
      r.prefs.order = o; sound('click'); re(); });
  });
}
