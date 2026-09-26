/* ============================================================
   THE SONGWRITING STUDIO — a curriculum and a workshop.

   For writing original songs, words and music, as someone who plays the
   piano and sings: The Path is eleven stages of exercises (and a
   capstone), each a room of the house that lights up as it is done; the
   Studio is the workbench the exercises send you to — object writing, the
   Chord Lab and its grooves, the melody tools, the lyric tools, the Song
   Desk. Everything a tool makes can be kept in the Seedbank.
   Production happens in a DAW; this room is everything before that.

   Everything here is rule-based and can be read: no suggestion comes from
   anywhere but the rules written in these files. Nothing is sent anywhere.

   Addresses: #/songwriting (Today), /path, /stage/<n>, /ex/<id>,
   /capstone, /studio, /tool/<id>, /seeds, /songs, /song/<id>, /listening.
   ============================================================ */
function sngUi(){ return S._sng = S._sng || {tab: 'today', tool: null, seedFilter: '', seedType: ''}; }
const SNG_TABS = [['today', '☀ Today'], ['path', '🏠 The Path'], ['studio', '🎹 Studio'], ['seeds', '🌱 Seedbank'], ['songs', '📚 Songbook'], ['listening', '🎧 Listening']];
/* the workbench, in the order the Path first sends you to each */
const SNG_TOOLS = [
  {id: 'object-writing', name: 'Object Writing Desk', icon: '🖊', desc: 'Timed sense-bound writing, a hard stop, the 42-day ring'},
  {id: 'chord-lab', name: 'Chord Lab', icon: '🎹', desc: 'Progressions in five key colours, played in fifty-odd grooves'},
  {id: 'groove-maker', name: 'Groove Maker', icon: '🥁', desc: 'A rhythmic idea on a step grid, and how it repeats'},
  {id: 'chord-scale', name: 'Chord-Scale Map', icon: '🗺', desc: 'Which notes each chord allows — improvise, then write'},
  {id: 'melody-sketcher', name: 'Melody Sketcher', icon: '🎶', desc: 'Scale degrees over chords, developed by hand'},
  {id: 'melody-gen', name: 'Melody Generator', icon: '🎲', desc: 'An emotion, turned into rules, turned into six melodies'},
  {id: 'lyric-sheet', name: 'Lyric Sheet & Structure Lab', icon: '📝', desc: 'Stress, motion, stability, power positions, contrast'},
  {id: 'rhyme-bench', name: 'Rhyme Workbench', icon: '🔤', desc: 'Five rhyme types, consonant families, worksheets'},
  {id: 'metaphor-lab', name: 'Metaphor Lab', icon: '💥', desc: 'Collisions, identity, keys, linking qualities'},
  {id: 'color-word', name: 'Colour a Word', icon: '🎨', desc: 'One melody note, many chords: hear the word change'},
  {id: 'song-desk', name: 'Song Desk', icon: '📋', desc: 'Brief, plot, boxes, sections, the rewrite'},
  {id: 'block-deck', name: 'Writer\'s-Block Deck', icon: '🃏', desc: 'Stuck? Draw a technique card'},
  {id: 'metronome', name: 'Metronome', icon: '⏱', desc: 'A click, tap tempo'}];
const sngToolName = id => (SNG_TOOLS.find(t => t.id === id) || {name: id}).name;

routes.songwriting = function(root, params){
  const st = sngState(), u = sngUi();
  const [a, b] = params || [];
  if(typeof sngStopAll === 'function' && !(a === 'tool' && b === u.tool)) sngStopAll();
  registerPageEntry({pageName: 'Songwriting Studio', addLabel: 'Write', defaultEntryType: 'session', prefilledFields: {}, options: [
    {icon: '🖊', label: 'Object writing', desc: 'Ten minutes, seven senses, a hard stop.', run: () => navigate('#/songwriting/tool/object-writing')},
    {icon: '🌱', label: 'A seed', desc: 'A line, an image, a title — before it goes.', run: () => sngSeedModal()},
    {icon: '📋', label: 'A new song', desc: 'Start it on the Song Desk.', run: () => navigate('#/songwriting/tool/song-desk')}]});
  if(!st.profile.onboarded) return sngOnboard(root);
  let body = '', crumb = '';
  if(a === 'ex' && b){ const ex = sngExercise(b); if(ex){ u.tab = 'path'; body = sngExerciseHTML(ex); crumb = 'ex'; } }
  else if(a === 'stage' && b != null){ u.tab = 'path'; body = sngStageHTML(+b); }
  else if(a === 'capstone'){ u.tab = 'path'; body = sngCapstoneHTML(); }
  else if(a === 'tool' && b){ u.tab = 'studio'; u.tool = b; if(b === 'song-desk') u.songId = null; body = sngToolHTML(b); }
  else if(a === 'song' && b){ u.tab = 'songs'; u.tool = 'song-desk'; sngUiSong(b); body = sngToolHTML('song-desk'); }
  else if(SNG_TABS.some(t => t[0] === a)){ u.tab = a; }
  else if(!a) u.tab = u.tab && u.tab !== 'studio' ? u.tab : 'today';
  if(!body) body = sngTabHTML(u.tab);
  root.innerHTML = `<div class="page sng-page">
    <div class="sng-head"><div><h1 class="serif">Songwriting Studio</h1>
      <p class="muted sng-lede">A path of exercises and a workbench for writing songs — words and music — at the piano. Everything you make can go in the Seedbank; production happens in your DAW.</p></div>
      ${sngRingHTML(st.owDates.length)}</div>
    <div class="tabs sng-tabs" role="tablist">${SNG_TABS.map(([k, n]) => `<button class="tab${u.tab === k ? ' on' : ''}" role="tab" aria-selected="${u.tab === k}" data-sngtab="${k}">${n}</button>`).join('')}</div>
    <div class="sng-body" data-sngview="${esc(crumb || u.tab)}">${body}</div>
  </div>`;
  bindSongwriting(root);
};
function sngTabHTML(tab){
  if(tab === 'path') return sngPathHTML();
  if(tab === 'studio') return sngStudioHTML();
  if(tab === 'seeds') return sngSeedsHTML();
  if(tab === 'songs') return typeof sngSongbookHTML === 'function' ? sngSongbookHTML() : '';
  if(tab === 'listening') return typeof sngListeningHTML === 'function' ? sngListeningHTML() : '';
  return sngTodayHTML();
}
/* the 42-day object-writing ring: a dot a day, filled as you write */
function sngRingHTML(days){
  const n = 42, r = 30, c = 38, got = Math.min(days, n);
  const dots = [...Array(n)].map((_, i) => { const a = i / n * 2 * Math.PI - Math.PI / 2;
    return `<circle cx="${(c + r * Math.cos(a)).toFixed(1)}" cy="${(c + r * Math.sin(a)).toFixed(1)}" r="2.3" class="${i < got ? 'on' : ''}"/>`; }).join('');
  return `<a class="sng-ring" href="#/songwriting/tool/object-writing" title="days of object writing: ${days} of 42 (Pattison's six weeks)">
    <svg viewBox="0 0 76 76" width="76" height="76" aria-hidden="true">${dots}<text x="38" y="43" text-anchor="middle">${days}</text></svg>
    <span class="mono faint">${days}/42 days</span></a>`;
}

/* ---------- first visit ---------- */
function sngOnboard(root){
  const st = sngState();
  root.innerHTML = `<div class="page sng-page"><h1 class="serif">Songwriting Studio</h1>
    <div class="card sng-onboard">
      <h2 class="serif">Before the first song</h2>
      <p class="muted">Two things the tools will use, both changeable later.</p>
      <h3>1. Your vocal range</h3>
      <p class="muted">At the piano, from middle C sing down until the tone goes, then up until you strain. The melody tools keep inside these, and warn you when a line goes outside.</p>
      <div class="sng-row"><label>Lowest comfortable note <input class="inp mono" id="sngLow" value="${esc(st.profile.lowNote)}" placeholder="C3"></label>
        <label>Highest <input class="inp mono" id="sngHigh" value="${esc(st.profile.highNote)}" placeholder="C5"></label>
        <button class="tbtn" id="sngHearRange">hear them</button></div>
      <h3>2. When you write</h3>
      <p class="muted">Object writing works best first thing in the morning, before the day has opinions.</p>
      <div class="sng-row">${['morning', 'midday', 'evening', 'whenever'].map(t => `<label class="chip"><input type="radio" name="sngWhen" value="${t}" ${st.profile.dailyTime === t ? 'checked' : ''}> ${t}</label>`).join('')}</div>
      <p class="muted sng-sources">The exercises are paraphrased from ${SNG_SOURCES.slice(0, 6).map(esc).join('; ')}, with the source named on each. The Chord-Scale Map is general jazz pedagogy.</p>
      <button class="btn primary" id="sngGo">Open the studio</button>
    </div></div>`;
  const hear = root.querySelector('#sngHearRange');
  hear.onclick = () => { const lo = sngMidiOf(root.querySelector('#sngLow').value), hi = sngMidiOf(root.querySelector('#sngHigh').value);
    if(lo == null || hi == null){ toast('Write notes like C3 and G4.'); return; }
    sngPlayMelody([{midi: lo, t: 0, d: 1}, {midi: hi, t: 1.2, d: 1}], 80, {tone: 'piano'}); };
  root.querySelector('#sngGo').onclick = () => {
    const lo = root.querySelector('#sngLow').value.trim(), hi = root.querySelector('#sngHigh').value.trim();
    if(sngMidiOf(lo) == null || sngMidiOf(hi) == null || sngMidiOf(lo) >= sngMidiOf(hi)){ toast('The lowest note has to be a note (like C3), and below the highest.'); return; }
    const when = (root.querySelector('input[name="sngWhen"]:checked') || {}).value || 'morning';
    Object.assign(st.profile, {lowNote: lo, highNote: hi, dailyTime: when, onboarded: true});
    saveNow(); sound('success'); rerender();
  };
}

/* ---------- Today ---------- */
function sngTodayHTML(){
  const st = sngState(), next = sngNextExercise(), d = today();
  const wroteToday = st.owDates.includes(d);
  const warm = SNG_WARMUPS.warmups[(new Date().getDate()) % SNG_WARMUPS.warmups.length];
  const seedsToday = st.seeds.filter(s => (s.createdAt || '').slice(0, 10) === d).length;
  return `<div class="sng-today">
    <div class="card sng-morning${wroteToday ? ' done' : ''}">
      <div class="sng-card-h"><span class="serif sng-big">Morning page</span><span class="mono faint">${wroteToday ? 'written today ✓' : 'not yet today'}</span></div>
      <p class="muted">Object writing, every day: ten minutes on one object, all seven senses, and stop when the timer stops (Pattison). It is the habit everything else grows from.</p>
      <a class="btn primary" href="#/songwriting/tool/object-writing">🖊 ${wroteToday ? 'Write another' : 'Start object writing'}</a>
    </div>
    ${next ? `<div class="card"><div class="sng-card-h"><span class="serif sng-big">Next on the Path</span><span class="mono faint">stage ${next.stage}</span></div>
      <div class="sng-next"><div><b>${esc(next.id)} · ${esc(next.title)}</b><p class="muted">${esc(next.purpose)}</p><span class="mono faint">${esc(next.source)}</span></div>
      <a class="btn" href="#/songwriting/ex/${esc(next.id)}">Open →</a></div></div>`
      : `<div class="card"><div class="serif sng-big">Every exercise on the Path is done.</div><p class="muted">The Capstone is three songs by the whole process. <a href="#/songwriting/capstone">Open it →</a></p></div>`}
    <div class="card"><div class="sng-card-h"><span class="serif sng-big">Today's warm-up</span></div>
      <p>${esc(warm)}</p><p class="muted">${esc(SNG_WARMUPS.pianoColor)}</p>
      <div class="sng-row"><a class="tbtn" href="#/songwriting/tool/chord-lab" data-sngsix>🎭 Six grooves of one progression</a>
        <button class="tbtn" data-sngrotd>🎲 Rhythm of the day</button>
        <a class="tbtn" href="#/songwriting/tool/melody-gen">Six melodies over one progression</a></div></div>
    <div class="sng-stats">${[[Object.keys(st.outputs).length, 'exercises'], [st.seeds.length, 'seeds', seedsToday ? `${seedsToday} today` : ''], [st.songs.length, 'songs'], [st.owDates.length, 'days written']]
      .map(([n, l, x]) => `<div class="card sng-stat"><b class="serif">${n}</b><span class="mono faint">${l}${x ? ` · ${x}` : ''}</span></div>`).join('')}</div>
    ${st.badges.length ? `<div class="card"><div class="sng-card-h"><span class="serif sng-big">Badges</span></div><div class="sng-badges">${st.badges.map(id => {
      const bd = SNG_BADGES.find(x => x.id === id); return bd ? `<span class="chip" title="${esc(bd.desc)}">${bd.icon} ${esc(bd.name)}</span>` : ''; }).join('')}</div></div>` : ''}
  </div>`;
}

/* ---------- The Path ---------- */
/* each stage a room: dark until you start it, lit by how much is done */
function sngPathHTML(){
  const st = sngState();
  return `<p class="muted">Each stage is a room of the house. Light them up — in order is best, but every door opens.</p>
    <div class="sng-rooms">${SNG_STAGES.map(s => { const pct = sngStagePct(s.id);
      return `<a class="sng-room${pct === 100 ? ' done' : pct ? ' lit' : ''}" href="#/songwriting/stage/${s.id}" style="--lit:${(pct / 100).toFixed(2)}">
        <span class="sng-room-n mono">${s.id}</span><span class="sng-room-t serif">${esc(s.name)}</span>
        <span class="sng-room-s muted">${esc(s.subtitle)}</span>
        <span class="sng-room-bar"><i style="width:${pct}%"></i></span><span class="mono faint">${pct}% · ${s.exercises.filter(e => st.outputs[e.id]).length}/${s.exercises.length}</span></a>`; }).join('')}
      <a class="sng-room capstone" href="#/songwriting/capstone"><span class="sng-room-n mono">★</span><span class="sng-room-t serif">${esc(SNG_CAPSTONE.name)}</span>
        <span class="sng-room-s muted">Capstone</span><span class="mono faint">${sngState().songs.filter(s => s.capstone && s.status === 'finished').length}/3 songs</span></a>
    </div>`;
}
function sngStageHTML(id){
  const st = sngState(), s = SNG_STAGES.find(x => x.id === id);
  if(!s) return sngPathHTML();
  return `<a class="tbtn" href="#/songwriting/path">← the Path</a>
    <h2 class="serif sng-stage-t">${s.id}. ${esc(s.name)} <span class="muted">— ${esc(s.subtitle)}</span></h2>
    <p class="sng-promise">${esc(s.promise)}</p><p class="mono faint">${s.books.map(esc).join(' · ')}</p>
    <div class="sng-exlist">${s.exercises.map(e => { const o = st.outputs[e.id];
      return `<a class="sng-ex${o ? ' done' : ''}" href="#/songwriting/ex/${esc(e.id)}"><span class="mono">${esc(e.id)}</span>
        <span class="sng-ex-t"><b>${esc(e.title)}</b><span class="muted">${esc(e.purpose)}</span></span>
        <span class="mono faint">${o ? '✓ ' + esc((o.savedAt || '').slice(0, 10)) : e.toolLink ? esc(sngToolName(e.toolLink)) : ''}</span></a>`; }).join('')}</div>
    <div class="card sng-stagesong"><b>🎵 Stage song</b><p>${esc(s.stageSong || '')}</p><a class="tbtn" href="#/songwriting/tool/song-desk">Write it on the Song Desk →</a></div>`;
}
function sngExerciseHTML(ex){
  const st = sngState(), o = st.outputs[ex.id] || {text: {}, versions: []};
  const stage = SNG_STAGES.find(s => s.id === ex.stage), i = stage.exercises.findIndex(e => e.id === ex.id);
  const prev = stage.exercises[i - 1], next = stage.exercises[i + 1] || (SNG_STAGES.find(s => s.id === ex.stage + 1) || {exercises: []}).exercises[0];
  return `<div class="sng-exnav"><a class="tbtn" href="#/songwriting/stage/${ex.stage}">← ${esc(stage.name)}</a><span class="grow"></span>
      ${prev ? `<a class="tbtn" href="#/songwriting/ex/${esc(prev.id)}">‹ ${esc(prev.id)}</a>` : ''}${next ? `<a class="tbtn" href="#/songwriting/ex/${esc(next.id)}">${esc(next.id)} ›</a>` : ''}</div>
    <article class="card sng-exercise" data-sngex="${esc(ex.id)}">
      <div class="sng-card-h"><span class="mono faint">${esc(ex.id)}</span><h2 class="serif">${esc(ex.title)}</h2></div>
      <p class="mono faint">${esc(ex.source)}</p>
      <h4>Why this exercise</h4><p>${esc(ex.purpose)}</p>
      ${ex.constraints ? `<p class="sng-constraint">⏱ ${esc(ex.constraints)}</p>` : ''}
      <h4>Instructions</h4><ol class="sng-steps">${(ex.instructions || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      ${ex.levels ? `<div class="sng-row"><span class="mono faint">level</span>${ex.levels.map((l, k) => `<label class="chip"><input type="radio" name="sngLevel" value="${k}" ${(+o.level || 0) === k ? 'checked' : ''}> ${esc(l)}</label>`).join('')}</div>` : ''}
      ${ex.toolLink ? `<p><a class="btn sm" href="#/songwriting/tool/${esc(ex.toolLink)}" data-sngfrom="${esc(ex.id)}">Open the ${esc(sngToolName(ex.toolLink))} →</a></p>` : ''}
      <h4>Your output</h4>
      <div class="sng-fields">${(ex.outputFields || ['Your work']).map((f, k) => `<label class="sng-field"><span>${esc(f)}</span>
        <textarea class="inp sng-ta" rows="${/output|piece|lyric|verse|chorus|song|writing/i.test(f) ? 6 : 2}" data-sngfield="${esc(f)}">${esc((o.text || {})[f] || '')}</textarea></label>`).join('')}</div>
      <div class="sng-row"><button class="btn primary" id="sngSaveEx">💾 Save</button>
        <button class="tbtn" id="sngHarvest" title="select a phrase first, or the first line is taken">🌱 Harvest to the Seedbank</button>
        ${o.savedAt ? `<span class="mono faint">saved ${esc(o.savedAt.slice(0, 16).replace('T', ' '))}${o.versions.length ? ` · ${o.versions.length} earlier version${o.versions.length > 1 ? 's' : ''}` : ''}</span>` : ''}</div>
      ${ex.selfCheck ? `<label class="sng-check"><input type="checkbox" id="sngSelf" ${o.selfCheck ? 'checked' : ''}> <b>Self-check:</b> ${esc(ex.selfCheck)}</label>` : ''}
      <label class="sng-field"><span>Reflect${ex.reflection ? ` — ${esc(ex.reflection)}` : ''}</span><textarea class="inp sng-ta" rows="3" id="sngReflect" placeholder="What did you notice?">${esc(o.reflection || '')}</textarea></label>
      ${o.versions.length ? `<details class="sng-versions"><summary class="mono">earlier versions (${o.versions.length})</summary>${o.versions.slice().reverse().map((v, k) =>
        `<div class="sng-version"><span class="mono faint">${esc((v.savedAt || '').slice(0, 16).replace('T', ' '))}</span><button class="tbtn" data-sngrestore="${o.versions.length - 1 - k}">restore</button>
        <div class="muted">${esc(Object.values(v.text || {}).join(' · ').slice(0, 240))}</div></div>`).join('')}</details>` : ''}
    </article>`;
}
function sngCapstoneHTML(){
  const st = sngState(), c = SNG_CAPSTONE, done = st.songs.filter(s => s.capstone);
  return `<a class="tbtn" href="#/songwriting/path">← the Path</a>
    <h2 class="serif">${esc(c.name)}</h2><p class="sng-promise">${esc(c.promise)}</p>
    <div class="card"><h4>Ten Steps (Stolpe)</h4><ol class="sng-steps">${c.tenSteps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      <button class="btn primary" id="sngCapNew">✨ Start a Ten-Step song</button></div>
    ${done.length ? `<div class="card"><h4>Your Ten-Step songs</h4>${done.map(s => `<a class="sng-ex${s.status === 'finished' ? ' done' : ''}" href="#/songwriting/song/${esc(s.id)}"><span class="mono">${s.status === 'finished' ? '✓' : '…'}</span><span class="sng-ex-t"><b>${esc(s.title)}</b><span class="muted">step ${Math.min(10, (s.tenStep || 0) + 1)} of 10</span></span></a>`).join('')}</div>` : ''}
    <div class="card"><h4>Rewrite checklist</h4><ul class="sng-checklist">${c.rewriteChecklist.map(x => `<li>☐ ${esc(x)}</li>`).join('')}</ul>
      <p class="muted">Every song on the Song Desk has this list, with the checks the room can do for you run against its lyric.</p></div>`;
}

/* ---------- the Studio ---------- */
function sngStudioHTML(){
  return `<p class="muted">The workbench. Each tool keeps what you make in the Seedbank.</p>
    <div class="sng-tools">${SNG_TOOLS.map(t => `<a class="sng-tool" href="#/songwriting/tool/${t.id}"><span class="sng-tool-i">${t.icon}</span><b class="serif">${esc(t.name)}</b><span class="muted">${esc(t.desc)}</span></a>`).join('')}</div>`;
}
/* a tool page: its own module draws it (19-sng-g/h/i/j) */
const SNG_TOOL_VIEWS = {};
function sngToolHTML(id){
  const v = SNG_TOOL_VIEWS[id];
  const back = `<a class="tbtn" href="#/songwriting/studio">← the Studio</a>`;
  if(!v) return back + `<p class="empty">That tool is not here.</p>`;
  return `<div class="sng-toolhead">${back}<h2 class="serif">${SNG_TOOLS.find(t => t.id === id).icon} ${esc(sngToolName(id))}</h2></div><div class="sng-tool-body" data-sngtool="${esc(id)}">${v.html()}</div>`;
}
function sngUiSong(id){ sngUi().songId = id; }

/* ---------- the Seedbank ---------- */
const SNG_SEED_TYPES = [['line', 'Line'], ['image', 'Image'], ['title', 'Title'], ['progression', 'Progression'], ['groove', 'Groove'], ['melody', 'Melody'], ['metaphor', 'Metaphor'], ['rhyme', 'Rhyme'], ['memo', 'Voice memo']];
function sngSeedsHTML(){
  const st = sngState(), u = sngUi();
  const q = (u.seedFilter || '').toLowerCase();
  const list = st.seeds.filter(s => (!u.seedType || s.type === u.seedType) && (!q || (s.content + ' ' + (s.tags || []).join(' ')).toLowerCase().includes(q)));
  return `<div class="sng-row"><button class="btn primary" id="sngSeedNew">＋ Capture a seed</button>
      <button class="tbtn" id="sngMemoNew">🎙 Voice memo</button>
      <input class="inp" id="sngSeedFind" placeholder="find…" value="${esc(u.seedFilter || '')}">
      <select class="inp" id="sngSeedType"><option value="">every kind</option>${SNG_SEED_TYPES.map(([k, n]) => `<option value="${k}" ${u.seedType === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <p class="muted">Lines, images, titles, progressions, melodies, memos — anything worth keeping, from any tool. Voice memos stay on this device.</p>
    ${list.length ? `<div class="sng-seeds">${list.map(s => `<div class="card sng-seed" data-sngseed="${esc(s.id)}">
      <div class="sng-card-h"><span class="chip">${esc((SNG_SEED_TYPES.find(t => t[0] === s.type) || ['', s.type])[1])}</span><span class="mono faint">${esc((s.createdAt || '').slice(0, 10))}${s.source ? ` · ${esc(s.source)}` : ''}</span>
        <button class="del-x inline" data-sngseeddel="${esc(s.id)}" aria-label="throw it away">×</button></div>
      ${s.content ? `<div class="sng-seed-c">${esc(s.content)}</div>` : ''}
      ${s.type === 'memo' && s.audioId ? `<button class="tbtn" data-sngmemo="${esc(s.audioId)}">▶ play</button>` : ''}
      ${s.data && s.data.chords ? `<button class="tbtn" data-sngseedplay="${esc(s.id)}">▶ hear it</button>` : ''}
      ${(s.tags || []).length ? `<div class="mono faint">${s.tags.map(t => '#' + esc(t)).join(' ')}</div>` : ''}</div>`).join('')}</div>`
      : `<div class="empty">No seeds${q || u.seedType ? ' match' : ' yet'}. Every tool has a 🌱 button; the Harvest button on an exercise takes the line you select.</div>`}`;
}
function sngSeedModal(pre){
  const m = openModal(`<h2>🌱 A seed</h2>
    <label class="sng-field"><span>What</span><textarea class="inp sng-ta" rows="3" id="sngSeedC">${esc((pre && pre.content) || '')}</textarea></label>
    <div class="sng-row"><select class="inp" id="sngSeedT">${SNG_SEED_TYPES.filter(t => t[0] !== 'memo').map(([k, n]) => `<option value="${k}" ${(pre && pre.type) === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <input class="inp" id="sngSeedTags" placeholder="tags, comma separated"></div>
    <button class="btn primary" id="sngSeedOk">Keep it</button>`);
  m.querySelector('#sngSeedC').focus();
  m.querySelector('#sngSeedOk').onclick = () => {
    const s = sngSeed({content: m.querySelector('#sngSeedC').value, type: m.querySelector('#sngSeedT').value, source: (pre && pre.source) || 'by hand',
      tags: m.querySelector('#sngSeedTags').value.split(',').map(x => x.trim()).filter(Boolean)});
    m.remove(); if(s){ sound('success'); toast('In the Seedbank.'); rerender(); }
  };
}
async function sngMemoFlow(){
  let rec;
  try { rec = await sngRecord(); } catch(e){ sngMemoFromFile(e && e.message); return; }
  const m = openModal(`<h2>🎙 Recording…</h2><p class="muted">Sing or play the idea. It stays on this device.</p><button class="btn primary" id="sngMemoStop">■ Stop and keep</button>`);
  m.querySelector('#sngMemoStop').onclick = async () => { const blob = await rec.stop(); m.remove(); await sngMemoKeep(blob); };
}
function sngMemoFromFile(why){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'audio/*';
  inp.onchange = async () => { const f = inp.files && inp.files[0]; if(f) await sngMemoKeep(f, f.name); };
  if(why) toast(esc(why), 4500);
  inp.click();
}
async function sngMemoKeep(blob, name){
  const id = await sngAudioPut(blob);
  if(!id){ toast('That could not be kept.'); return; }
  sngSeed({type: 'memo', audioId: id, content: name ? name.replace(/\.[^.]+$/, '') : `Memo ${new Date().toLocaleString()}`, source: 'voice memo'});
  sound('success'); toast('The memo is in the Seedbank.'); rerender();
}
async function sngMemoPlay(id){ const b = await sngAudioGet(id); if(!b){ toast('That memo is not on this device.'); return; }
  const a = new Audio(URL.createObjectURL(b)); a.play().catch(() => toast('This browser would not play it.')); }

/* ---------- binding ---------- */
function bindSongwriting(root){
  const st = sngState(), u = sngUi();
  $$('[data-sngtab]', root).forEach(b => b.onclick = () => navigate('#/songwriting/' + (b.dataset.sngtab === 'today' ? '' : b.dataset.sngtab)));
  const on = (sel, fn) => { const n = root.querySelector(sel); if(n) n.onclick = fn; };
  /* Today */
  on('[data-sngrotd]', () => { const s = SNG_STYLES[Math.floor(Math.random() * SNG_STYLES.length)]; st.lab.styleId = s.id; st.lab.bpm = s.defaultBpm; saveNow();
    toast(`Rhythm of the day: ${esc(s.name)}. Improvise a melody over it.`); navigate('#/songwriting/tool/chord-lab'); });
  on('[data-sngsix]', ev => { ev.preventDefault(); sngUi().sixOpen = true; navigate('#/songwriting/tool/chord-lab'); });
  /* an exercise */
  const ex = root.querySelector('[data-sngex]');
  if(ex){
    const id = ex.dataset.sngex, e = sngExercise(id);
    const read = () => { const t = {}; $$('[data-sngfield]', ex).forEach(a => { if(a.value.trim()) t[a.dataset.sngfield] = a.value; }); return t; };
    on('#sngSaveEx', () => { const lv = ex.querySelector('input[name="sngLevel"]:checked');
      sngSaveOutput(id, read(), {selfCheck: !!(ex.querySelector('#sngSelf') || {}).checked, reflection: (ex.querySelector('#sngReflect') || {}).value || '', level: lv ? +lv.value : undefined, done: true});
      sound('success'); toast(`${esc(e.id)} saved.`); rerender(); });
    on('#sngHarvest', () => { const sel = (window.getSelection() || '').toString().trim();
      const first = Object.values(read())[0] || ''; const text = sel || first.split('\n').find(l => l.trim()) || '';
      if(!text){ toast('Write something first — or select the phrase you want.'); return; }
      sngSeed({type: 'line', content: text, source: `${e.id} ${e.title}`, tags: [e.toolLink || 'path']}); sound('success'); toast('Harvested to the Seedbank.'); });
    const self = ex.querySelector('#sngSelf'); if(self) self.onchange = () => { const o = st.outputs[id]; if(o){ o.selfCheck = self.checked; saveNow(); } };
    $$('[data-sngrestore]', ex).forEach(b => b.onclick = () => { const o = st.outputs[id]; const v = o && o.versions[+b.dataset.sngrestore]; if(!v) return;
      $$('[data-sngfield]', ex).forEach(a => { a.value = (v.text || {})[a.dataset.sngfield] || ''; }); toast('Restored into the fields — Save to keep it.'); });
    $$('[data-sngfrom]', ex).forEach(a => a.addEventListener('click', () => { sngUi().fromEx = id; }));
  }
  /* the capstone */
  on('#sngCapNew', () => { const s = sngSongDefaults({title: 'A Ten-Step song', capstone: true, tenStep: 0}); st.songs.unshift(s); saveNow(); navigate('#/songwriting/song/' + s.id); });
  /* the Seedbank */
  on('#sngSeedNew', () => sngSeedModal());
  on('#sngMemoNew', () => sngMemoFlow());
  const find = root.querySelector('#sngSeedFind'); if(find) find.oninput = debounce(() => { u.seedFilter = find.value; rerender(); const f = document.getElementById('sngSeedFind'); if(f){ f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }, 250);
  const ty = root.querySelector('#sngSeedType'); if(ty) ty.onchange = () => { u.seedType = ty.value; rerender(); };
  $$('[data-sngseeddel]', root).forEach(b => b.onclick = () => { const s = byId(st.seeds, b.dataset.sngseeddel); if(!s) return;
    requestDelete({label: 'that seed', node: b.closest('.sng-seed'), remove: () => { const back = spliceOut(st.seeds, x => x.id === s.id); saveNow();
      const timer = s.audioId ? setTimeout(() => sngAudioDrop(s.audioId), (typeof UNDO_MS === 'number' ? UNDO_MS : 8000) + 2000) : null;
      return () => { if(timer) clearTimeout(timer); back(); }; }}); });
  $$('[data-sngmemo]', root).forEach(b => b.onclick = () => sngMemoPlay(b.dataset.sngmemo));
  $$('[data-sngseedplay]', root).forEach(b => b.onclick = () => { const s = byId(st.seeds, b.dataset.sngseedplay); if(s && s.data) sngPlaySeed(s.data); });
  /* a tool */
  const tool = root.querySelector('[data-sngtool]');
  if(tool && SNG_TOOL_VIEWS[tool.dataset.sngtool]) SNG_TOOL_VIEWS[tool.dataset.sngtool].bind(tool);
  if(typeof bindSngMore === 'function') bindSngMore(root);
}
/* a kept progression or groove, heard again */
function sngPlaySeed(d){
  const style = SNG_STYLES.find(s => s.id === d.styleId) || SNG_STYLES[0];
  const g = sngGroove({chords: d.chords, keyPc: d.keyPc || 0, colour: d.colour, style, bpm: d.bpm || style.defaultBpm, swing: d.swing != null ? d.swing : style.swing, loop: false, bars: d.chords.length * 2});
  g.start();
}
