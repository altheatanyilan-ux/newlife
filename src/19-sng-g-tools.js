/* ============================================================
   SONGWRITING STUDIO — THE WORKBENCH, I
   Object Writing Desk, Chord Lab (with the groove engine), Groove Maker,
   Writer's-Block Deck, Metronome. Each registers in SNG_TOOL_VIEWS as
   {html(), bind(host)}; the page draws it inside the Studio.
   ============================================================ */

/* ---------- the Object Writing Desk (Pattison) ----------
   A prompt, a timer, a hard stop: when time is up the page stops taking
   words, even mid-word. The seven senses along the side are ticked as you
   reach them; a hot spot (a phrase with heat in it) is harvested by
   selecting it. Each day written fills one dot of the 42-day ring. */
let _sngOw = null;   /* {end, timer, kind, prompt, secs} while a round runs */
SNG_TOOL_VIEWS['object-writing'] = {
  html(){
    const st = sngState(), u = sngUi();
    u.owKind = u.owKind || 'what';
    if(!u.owPrompt) u.owPrompt = sngOwPick(u.owKind);
    const running = _sngOw && _sngOw.end > Date.now();
    const secs = u.owSecs || 600;
    return `<div class="sng-ow">
      <div class="card sng-ow-set">
        <div class="sng-row"><span class="mono faint">prompt</span>${['what', 'who', 'when', 'where'].map(k => `<button class="tbtn${u.owKind === k ? ' on' : ''}" data-owkind="${k}">${k}</button>`).join('')}
          <button class="tbtn" id="sngOwDice" title="another prompt">another</button></div>
        <input class="inp serif sng-ow-prompt" id="sngOwPrompt" value="${esc(u.owPrompt)}" aria-label="the prompt word">
        <div class="sng-row"><span class="mono faint">time</span>${[[600, '10 min'], [300, '5 min'], [90, '90 s']].map(([v, l]) => `<button class="tbtn${secs === v ? ' on' : ''}" data-owsecs="${v}">${l}</button>`).join('')}
          <span class="grow"></span><span class="mono sng-ow-clock" id="sngOwClock">${sngClock(running ? Math.ceil((_sngOw.end - Date.now()) / 1000) : secs)}</span>
          <button class="btn primary" id="sngOwGo">${running ? 'Writing…' : 'Start'}</button></div>
      </div>
      <div class="sng-ow-desk">
        <textarea class="inp sng-ow-page" id="sngOwPage" placeholder="${running ? '' : 'Press Start. Write with all seven senses — no rhyme, no sentences needed. When the time is up the page stops.'}" ${running ? '' : 'readonly'}>${esc(u.owText || '')}</textarea>
        <aside class="sng-senses"><span class="mono faint">senses reached</span>${SNG_SENSES.map((s, i) => `<button class="tbtn${(u.owSenses || [])[i] ? ' on' : ''}" data-owsense="${i}">${s}</button>`).join('')}
          <p class="muted">Sight and sound come first; smell, taste, body and motion are where the surprises are.</p></aside>
      </div>
      <div class="sng-row"><button class="tbtn" id="sngOwHarvest">Harvest the hot spot</button><span class="muted">select a phrase with heat in it, then harvest</span>
        <span class="grow"></span><span class="mono faint">${st.owDates.length} day${st.owDates.length === 1 ? '' : 's'} written · ${st.owDates.includes(today()) ? 'today ✓' : 'not today yet'}</span></div>
    </div>`;
  },
  bind(host){
    const u = sngUi();
    const page = host.querySelector('#sngOwPage'), clock = host.querySelector('#sngOwClock');
    $$('[data-owkind]', host).forEach(b => b.onclick = () => { u.owKind = b.dataset.owkind; u.owPrompt = sngOwPick(u.owKind); rerender(); });
    host.querySelector('#sngOwDice').onclick = () => { u.owPrompt = sngOwPick(u.owKind); rerender(); };
    host.querySelector('#sngOwPrompt').onchange = e => { u.owPrompt = e.target.value.trim() || u.owPrompt; };
    $$('[data-owsecs]', host).forEach(b => b.onclick = () => { if(_sngOw && _sngOw.end > Date.now()) return; u.owSecs = +b.dataset.owsecs; rerender(); });
    $$('[data-owsense]', host).forEach(b => b.onclick = () => { u.owSenses = u.owSenses || []; u.owSenses[+b.dataset.owsense] = !u.owSenses[+b.dataset.owsense]; b.classList.toggle('on'); });
    page.oninput = () => { u.owText = page.value; };
    const tick = () => {
      if(!_sngOw) return;
      const left = Math.ceil((_sngOw.end - Date.now()) / 1000);
      const c = document.getElementById('sngOwClock'); if(c) c.textContent = sngClock(Math.max(0, left));
      if(left <= 0){ clearInterval(_sngOw.timer); _sngOw = null;
        const p = document.getElementById('sngOwPage'); if(p){ p.readOnly = true; p.classList.add('stopped'); u.owText = p.value; }
        sngMarkOw(); sound('success'); toast('Time. Stop — even mid-word. Now read it back and harvest the hot spots.', 5000);
        const go = document.getElementById('sngOwGo'); if(go) go.textContent = 'Again'; }
    };
    host.querySelector('#sngOwGo').onclick = () => {
      if(_sngOw && _sngOw.end > Date.now()) return;
      u.owText = ''; u.owSenses = [];
      _sngOw = {end: Date.now() + (u.owSecs || 600) * 1000, timer: setInterval(tick, 250)};
      rerender(); setTimeout(() => { const p = document.getElementById('sngOwPage'); if(p) p.focus(); }, 50);
    };
    if(_sngOw && _sngOw.end > Date.now() && page){ page.focus(); page.setSelectionRange(page.value.length, page.value.length); }
    host.querySelector('#sngOwHarvest').onclick = () => {
      const sel = page.value.substring(page.selectionStart, page.selectionEnd).trim() || (window.getSelection() || '').toString().trim();
      if(!sel){ toast('Select the phrase first.'); return; }
      sngSeed({type: 'image', content: sel, tags: ['object-writing', u.owPrompt], source: 'Object Writing Desk'}); sound('success'); toast('In the Seedbank.');
    };
    void clock;
  }
};
const sngOwPick = kind => { const l = SNG_OW_PROMPTS[kind] || SNG_OW_PROMPTS.what; return l[Math.floor(Math.random() * l.length)]; };
const sngClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* ---------- the Chord Lab ----------
   A key and a key colour; the colour's chords (and the outside ones) as a
   palette; a progression of up to eight bars; played through the groove
   engine in any style, with Kachulis's four groove choices — tempo, feel,
   rhythmic level, rhythmic idea — and the rest. The Scale Lane under the
   progression is the Chord-Scale Map's pick for each chord. */
let _sngLab = null;   /* the groove playing */
function sngLabState(){
  const st = sngState(), L = st.lab;
  if(L.keyPc == null) L.keyPc = 0;
  L.colour = L.colour || 'major';
  if(!Array.isArray(L.prog)) L.prog = ['I', 'V', 'vi', 'IV'];
  L.styleId = L.styleId || 'pop-ballad';
  const style = SNG_STYLES.find(s => s.id === L.styleId) || SNG_STYLES[0];
  if(L.bpm == null) L.bpm = style.defaultBpm;
  if(L.swing == null) L.swing = style.swing || 0;
  L.voicing = L.voicing || null; L.tone = L.tone || 'piano'; L.level = L.level || 'normal'; L.bassGen = L.bassGen || 'style';
  L.mute = L.mute || {}; L.vol = L.vol || {chords: 0.8, bass: 0.9, drums: 0.75};
  if(L.humanize == null) L.humanize = 0.3;
  return L;
}
const sngLabChords = L => L.prog.map(r => { const c = sngParseRoman(r); return c || {roman: r, root: 0, quality: 'maj'}; });
const sngLabStyle = L => SNG_STYLES.find(s => s.id === L.styleId) || SNG_STYLES[0];
function sngLabOpts(L, extra){
  const style = sngLabStyle(L);
  return Object.assign({chords: sngLabChords(L), keyPc: L.keyPc, colour: L.colour, style, bpm: L.bpm, swing: L.swing, humanize: L.humanize, anticipation: L.anticipation != null ? L.anticipation : style.anticipation,
    voicing: L.voicing, tone: L.tone, level: L.level, bassGen: L.bassGen, mute: L.mute, vol: L.vol, grid: L.grid || null}, extra || {});
}
SNG_TOOL_VIEWS['chord-lab'] = {
  html(){
    const L = sngLabState(), u = sngUi(), style = sngLabStyle(L);
    const pal = sngPalette(L.colour), out = sngOutsidePalette(), chords = sngLabChords(L);
    const playing = _sngLab && _sngLab.running;
    const fam = u.labFam || '', mood = u.labMood || '';
    const families = [...new Set(SNG_STYLES.map(s => s.family))], moods = [...new Set(SNG_STYLES.flatMap(s => s.mood))].sort();
    const shown = SNG_STYLES.filter(s => (!fam || s.family === fam) && (!mood || s.mood.includes(mood)));
    return `<p class="muted sng-note">The sounds are synthesized and the patterns are simplified standard versions — adjust by ear.</p>
    <div class="sng-lab">
      <section class="card sng-lab-key">
        <div class="sng-row"><label class="mono faint">key <select class="inp" id="labKey">${SNG_NOTE_NAMES.map((n, i) => `<option value="${i}" ${L.keyPc === i ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <span class="mono faint">colour</span>${Object.entries(SNG_KEY_COLOURS).map(([k, c]) => `<button class="tbtn${L.colour === k ? ' on' : ''}" data-labcolour="${k}" title="${esc(c.mood)}">${c.name}</button>`).join('')}</div>
        <div class="sng-palette">${pal.map(c => `<button class="sng-chip fn-${(c.fn || 'T').toLowerCase()}" data-labadd="${esc(c.roman)}" title="${esc(sngChordName(c, L.keyPc))} — ${c.fn === 'T' ? 'tonic (home)' : c.fn === 'PD' ? 'predominant (away)' : 'dominant (pulls home)'}"><b>${esc(c.roman)}</b><span>${esc(sngChordName(c, L.keyPc))}</span></button>`).join('')}</div>
        <details class="sng-outside"><summary class="mono faint">colours outside the key</summary><div class="sng-palette">${out.map(c => `<button class="sng-chip outside" data-labadd="${esc(c.roman)}" title="${esc(c.why)}"><b>${esc(c.roman)}</b><span>${esc(sngChordName(c, L.keyPc))}</span></button>`).join('')}</div></details>
        <div class="sng-row"><span class="mono faint">power progressions</span>${(SNG_POWER_PROGRESSIONS[L.colour] || SNG_POWER_PROGRESSIONS.major).map((p, i) => `<button class="tbtn" data-labpp="${i}">${esc(p.join('–'))}</button>`).join('')}</div>
      </section>
      <section class="card sng-lab-prog">
        <div class="sng-card-h"><span class="serif">Your progression</span><span class="mono faint">one chord a bar · up to eight</span><span class="grow"></span><button class="tbtn" id="labClear">clear</button></div>
        <div class="sng-prog">${chords.map((c, i) => `<div class="sng-bar${u.labBar === i && playing ? ' now' : ''}" data-labbar="${i}"><b>${esc(c.roman)}</b><span>${esc(sngChordName(c, L.keyPc))}</span>
          <span class="sng-bar-x"><button class="tbtn" data-lableft="${i}" aria-label="move left">‹</button><button class="del-x inline" data-labdel="${i}" aria-label="remove">×</button></span></div>`).join('') || '<span class="muted">Press chords above to build it.</span>'}</div>
        <div class="sng-lane" title="the Chord-Scale Map's scale for each chord, in this progression">${chords.map((c, i) => { const r = sngScalesFor(c, {keyPc: L.keyPc, colour: L.colour, next: chords[(i + 1) % chords.length]});
          return `<span class="sng-lane-c" title="${esc(r.why)}">${esc(sngNoteName(L.keyPc + c.root))} ${esc(r.scales[0].name)}</span>`; }).join('')}</div>
        <div class="sng-row sng-transport">
          <button class="btn primary" id="labPlay">${playing ? '■ Stop' : '▶ Play'}</button>
          <label class="mono faint">♩ <input class="inp mono sng-bpm" id="labBpm" type="number" min="30" max="260" value="${Math.round(L.bpm)}"></label>
          <input type="range" id="labBpmR" min="${Math.max(30, style.bpmRange[0] - 30)}" max="${Math.min(260, style.bpmRange[1] + 40)}" value="${Math.round(L.bpm)}" aria-label="tempo">
          <button class="tbtn" id="labTap">tap</button>
          <span class="mono faint">suggested ${style.bpmRange[0]}–${style.bpmRange[1]}</span>
        </div>
      </section>
      <section class="card sng-lab-style">
        <div class="sng-card-h"><span class="serif">Feel — ${esc(style.name)}</span><span class="mono faint">${esc(style.family)} · ${style.timeSig.join('/')} · ${esc(style.mood.join(', '))}</span></div>
        <p class="sng-feel">${esc(style.feel)} <span class="muted">${esc(style.tryFor)}</span></p>
        <div class="sng-row"><select class="inp" id="labFam"><option value="">every family</option>${families.map(f => `<option ${fam === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select>
          <select class="inp" id="labMood"><option value="">every mood</option>${moods.map(m => `<option ${mood === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
          <span class="grow"></span><span class="mono faint">A/B</span><select class="inp" id="labB"><option value="">— a second style —</option>${SNG_STYLES.map(s => `<option value="${s.id}" ${u.labB === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
          ${u.labB ? `<button class="tbtn" id="labAB">switch A ⇄ B</button>` : ''}</div>
        <div class="sng-styles">${shown.map(s => `<button class="sng-style${s.id === L.styleId ? ' on' : ''}" data-labstyle="${s.id}" title="${esc(s.feel)}"><b>${esc(s.name)}</b><span class="mono faint">${s.timeSig.join('/')} · ${s.bpmRange[0]}–${s.bpmRange[1]}</span></button>`).join('')}</div>
      </section>
      <section class="card sng-lab-expr">
        <div class="sng-card-h"><span class="serif">Expression</span></div>
        <div class="sng-grid2">
          <label>Swing <input type="range" id="labSwing" min="50" max="75" value="${Math.round((L.swing || 0.5) * 100)}"> <span class="mono">${Math.round((L.swing || 0.5) * 100)}%</span></label>
          <label>Humanize <input type="range" id="labHum" min="0" max="100" value="${Math.round(L.humanize * 100)}"></label>
          <label>Rhythmic level <select class="inp" id="labLevel">${[['thin', 'thinner'], ['normal', 'as written'], ['thick', 'thicker']].map(([k, n]) => `<option value="${k}" ${L.level === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label>Voicing <select class="inp" id="labVoicing"><option value="">the style's (${esc(style.voicingDefault)})</option>${SNG_VOICINGS.map(([k, n]) => `<option value="${k}" ${L.voicing === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label>Tone <select class="inp" id="labTone">${SNG_TONES.map(([k, n]) => `<option value="${k}" ${L.tone === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label>Bass <select class="inp" id="labBass">${SNG_BASS_GENS.map(([k, n]) => `<option value="${k}" ${L.bassGen === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="sng-check"><input type="checkbox" id="labAntic" ${(L.anticipation != null ? L.anticipation : style.anticipation) ? 'checked' : ''}> anticipate the next chord (an eighth early)</label>
        </div>
        <div class="sng-row">${['chords', 'bass', 'drums'].map(k => `<label class="sng-layer"><button class="tbtn${L.mute[k] ? '' : ' on'}" data-labmute="${k}">${k}</button><input type="range" min="0" max="100" value="${Math.round((L.vol[k] == null ? 0.8 : L.vol[k]) * 100)}" data-labvol="${k}" aria-label="${k} volume"></label>`).join('')}</div>
        ${L.grid ? `<p class="muted">Playing your own rhythmic idea from the Groove Maker. <button class="tbtn" id="labGridOff">back to the style's</button></p>` : ''}
      </section>
      <section class="sng-row sng-lab-keep">
        <button class="tbtn" id="labSix">Same chords, six grooves</button>
        <button class="tbtn" id="labSaveGroove">Save as my groove</button>
        <button class="tbtn" id="labSeed">Keep the progression</button>
        <button class="tbtn" id="labMidi">Export MIDI</button>
      </section>
      ${u.sixOpen ? sngSixHTML(L) : ''}
      <section class="card sng-piano-wrap"><div class="sng-card-h"><span class="serif">At the piano</span><span class="mono faint">the chord now sounding</span></div>${sngKeysHTML(chords.length ? sngVoice(chords[u.labBar || 0] || chords[0], L.keyPc, L.voicing || style.voicingDefault || 'triad') : [], null)}</section>
    </div>`;
  },
  bind(host){
    const L = sngLabState(), u = sngUi(), st = sngState();
    const redraw = () => { saveNow(); rerender(); };
    const live = (k, v) => { if(_sngLab && _sngLab.running) _sngLab.set(k, v); };
    const q = s => host.querySelector(s);
    q('#labKey').onchange = e => { L.keyPc = +e.target.value; live('keyPc', L.keyPc); redraw(); };
    $$('[data-labcolour]', host).forEach(b => b.onclick = () => { L.colour = b.dataset.labcolour; redraw(); });
    $$('[data-labadd]', host).forEach(b => b.onclick = () => { if(L.prog.length >= 8){ toast('Eight bars is the most — take one out first.'); return; }
      L.prog.push(b.dataset.labadd); const c = sngParseRoman(b.dataset.labadd); if(c) sngPlayChord(sngVoice(c, L.keyPc, 'triad'), L.tone, 0.9); live('chords', sngLabChords(L)); redraw(); });
    $$('[data-labpp]', host).forEach(b => b.onclick = () => { L.prog = (SNG_POWER_PROGRESSIONS[L.colour] || SNG_POWER_PROGRESSIONS.major)[+b.dataset.labpp].slice(); live('chords', sngLabChords(L)); redraw(); });
    q('#labClear').onclick = () => { L.prog = []; redraw(); };
    $$('[data-labdel]', host).forEach(b => b.onclick = () => { L.prog.splice(+b.dataset.labdel, 1); live('chords', sngLabChords(L)); redraw(); });
    $$('[data-lableft]', host).forEach(b => b.onclick = () => { const i = +b.dataset.lableft; if(i > 0){ [L.prog[i - 1], L.prog[i]] = [L.prog[i], L.prog[i - 1]]; live('chords', sngLabChords(L)); redraw(); } });
    $$('[data-labbar]', host).forEach(b => b.addEventListener('click', ev => { if(ev.target.closest('button')) return; const c = sngLabChords(L)[+b.dataset.labbar]; if(c) sngPlayChord(sngVoice(c, L.keyPc, L.voicing || sngLabStyle(L).voicingDefault), L.tone, 1.2); }));
    /* playing */
    q('#labPlay').onclick = () => {
      if(_sngLab && _sngLab.running){ _sngLab.stop(); _sngLab = null; rerender(); return; }
      if(!L.prog.length){ toast('Build a progression first.'); return; }
      if(typeof grandPianoLoad === 'function' && L.tone === 'piano') grandPianoLoad();
      _sngLab = sngGroove(sngLabOpts(L, {onBar: (b, i) => { u.labBar = i; $$('.sng-bar').forEach((el, k) => el.classList.toggle('now', k === i));
        const c = sngLabChords(L)[i]; const kb = document.querySelector('.sng-piano-wrap .sng-keys'); if(c && kb) kb.outerHTML = sngKeysHTML(sngVoice(c, L.keyPc, L.voicing || sngLabStyle(L).voicingDefault), null); }}));
      _sngLab.start(); sngLogSession('chord-lab'); rerender();
    };
    const bpm = v => { L.bpm = Math.max(30, Math.min(260, Math.round(v))); live('bpm', L.bpm); saveNow(); const a = q('#labBpm'), r = q('#labBpmR'); if(a && document.activeElement !== a) a.value = L.bpm; if(r) r.value = L.bpm; };
    q('#labBpm').onchange = e => bpm(+e.target.value);
    q('#labBpmR').oninput = e => bpm(+e.target.value);
    const taps = [];
    q('#labTap').onclick = () => { const t = performance.now(); if(taps.length && t - taps[taps.length - 1] > 2000) taps.length = 0; taps.push(t);
      if(taps.length >= 3){ const d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); bpm(60000 / d); } };
    /* the style */
    $$('[data-labstyle]', host).forEach(b => b.onclick = () => { const s = SNG_STYLES.find(x => x.id === b.dataset.labstyle); if(!s) return;
      L.styleId = s.id; L.bpm = Math.max(s.bpmRange[0], Math.min(s.bpmRange[1], L.bpm)); L.swing = s.swing || 0; L.anticipation = null; L.grid = null;
      if(_sngLab && _sngLab.running){ _sngLab.set('style', s); _sngLab.set('swing', L.swing); _sngLab.set('bpm', L.bpm); _sngLab.set('grid', null); _sngLab.set('anticipation', s.anticipation); }
      redraw(); });
    q('#labFam').onchange = e => { u.labFam = e.target.value; rerender(); };
    q('#labMood').onchange = e => { u.labMood = e.target.value; rerender(); };
    q('#labB').onchange = e => { u.labB = e.target.value || null; if(u.labB) u.labA = L.styleId; rerender(); };
    const ab = q('#labAB'); if(ab) ab.onclick = () => { const b = SNG_STYLES.find(x => x.id === u.labB); if(!b) return; const a = L.styleId; L.styleId = b.id; u.labB = a;
      if(_sngLab && _sngLab.running){ _sngLab.set('style', b); _sngLab.set('swing', b.swing || 0); } L.swing = b.swing || 0; redraw(); };
    /* expression */
    q('#labSwing').oninput = e => { L.swing = +e.target.value / 100; live('swing', L.swing <= 0.505 ? 0 : L.swing); e.target.nextElementSibling.textContent = e.target.value + '%'; saveNow(); };
    q('#labHum').oninput = e => { L.humanize = +e.target.value / 100; live('humanize', L.humanize); saveNow(); };
    q('#labLevel').onchange = e => { L.level = e.target.value; live('level', L.level); saveNow(); };
    q('#labVoicing').onchange = e => { L.voicing = e.target.value || null; live('voicing', L.voicing); redraw(); };
    q('#labTone').onchange = e => { L.tone = e.target.value; live('tone', L.tone); saveNow(); };
    q('#labBass').onchange = e => { L.bassGen = e.target.value; live('bassGen', L.bassGen); saveNow(); };
    q('#labAntic').onchange = e => { L.anticipation = e.target.checked; live('anticipation', L.anticipation); saveNow(); };
    $$('[data-labmute]', host).forEach(b => b.onclick = () => { const k = b.dataset.labmute; L.mute[k] = !L.mute[k]; live('mute', L.mute); b.classList.toggle('on', !L.mute[k]); saveNow(); });
    $$('[data-labvol]', host).forEach(r => r.oninput = () => { L.vol[r.dataset.labvol] = +r.value / 100; live('vol', L.vol); saveNow(); });
    const go = q('#labGridOff'); if(go) go.onclick = () => { L.grid = null; live('grid', null); redraw(); };
    /* keeping */
    q('#labSix').onclick = () => { u.sixOpen = !u.sixOpen; rerender(); };
    q('#labSeed').onclick = () => { if(!L.prog.length) return; const chords = sngLabChords(L);
      sngSeed({type: 'progression', content: `${L.prog.join('–')} in ${sngNoteName(L.keyPc)} ${SNG_KEY_COLOURS[L.colour].name} (${chords.map(c => sngChordName(c, L.keyPc)).join(' ')})`, source: 'Chord Lab',
        tags: [L.colour, sngLabStyle(L).name], data: {chords, keyPc: L.keyPc, colour: L.colour, styleId: L.styleId, bpm: L.bpm, swing: L.swing}}); sound('success'); toast('In the Seedbank.'); };
    q('#labSaveGroove').onclick = () => { const g = {id: uid(), name: `${sngLabStyle(L).name} — ${L.prog.join('–')}`, styleId: L.styleId, bpm: L.bpm, swing: L.swing, prog: L.prog.slice(), keyPc: L.keyPc, colour: L.colour,
        grid: L.grid || sngGridFromStyle(sngLabStyle(L)), createdAt: new Date().toISOString()};
      st.grooves.unshift(g); saveNow(); sound('success'); toast('Saved to the Groove Maker.'); u.grooveId = g.id; navigate('#/songwriting/tool/groove-maker'); };
    q('#labMidi').onclick = () => { if(!L.prog.length) return; const o = sngLabOpts(L); const bytes = sngMidiFile(o, Math.max(4, L.prog.length * 2));
      sngDownload(bytes, `progression-${L.prog.join('-').replace(/[^\w-]+/g, '')}.mid`); };
    if(u.sixOpen) bindSngSix(host, L);
  }
};
/* ---------- "Same chords, six grooves" (Kachulis) ----------
   The same progression in six contrasting styles, one after another, with
   a line for what each one feels like. The notes go into exercise 2.10. */
const SNG_SIX = ['pop-ballad', 'rock-straight', 'soul-classic', 'jazz-swing', 'brazil-bossa', 'carib-reggae'];
function sngSixHTML(L){
  const u = sngUi(), picks = u.sixPicks || SNG_SIX, notes = (sngState().lab.sixNotes || {});
  return `<section class="card sng-six"><div class="sng-card-h"><span class="serif">Same chords, six grooves</span><span class="mono faint">Kachulis, Harmony</span></div>
    <p class="muted">Play the progression in each. Write the emotion each one gives it — one line.</p>
    ${picks.map((id, i) => { const s = SNG_STYLES.find(x => x.id === id) || SNG_STYLES[i];
      return `<div class="sng-six-row"><select class="inp" data-sixpick="${i}">${SNG_STYLES.map(x => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
        <button class="tbtn" data-sixplay="${s.id}">▶</button><input class="inp" data-sixnote="${s.id}" value="${esc(notes[s.id] || '')}" placeholder="what it feels like…"></div>`; }).join('')}
    <button class="btn sm" id="sixSave">Save the notes to exercise 2.10</button></section>`;
}
function bindSngSix(host, L){
  const u = sngUi(), st = sngState();
  $$('[data-sixpick]', host).forEach(s => s.onchange = () => { u.sixPicks = (u.sixPicks || SNG_SIX.slice()); u.sixPicks[+s.dataset.sixpick] = s.value; rerender(); });
  $$('[data-sixplay]', host).forEach(b => b.onclick = () => { const s = SNG_STYLES.find(x => x.id === b.dataset.sixplay); if(!s || !L.prog.length) return;
    if(_sngLab) _sngLab.stop(); _sngLab = sngGroove(sngLabOpts(L, {style: s, bpm: s.defaultBpm, swing: s.swing || 0, anticipation: s.anticipation, grid: null, loop: false, bars: L.prog.length * 2})); _sngLab.start(); });
  $$('[data-sixnote]', host).forEach(i => i.onchange = () => { st.lab.sixNotes = st.lab.sixNotes || {}; st.lab.sixNotes[i.dataset.sixnote] = i.value; saveNow(); });
  host.querySelector('#sixSave').onclick = () => { const notes = st.lab.sixNotes || {}, picks = u.sixPicks || SNG_SIX;
    const ex = sngExercise('2.10'); if(!ex) return;
    const lines = picks.map(id => { const s = SNG_STYLES.find(x => x.id === id); return `${s ? s.name : id}: ${notes[id] || '—'}`; }).join('\n');
    const fields = ex.outputFields || [], text = {};
    text[fields[0] || 'Notes'] = `${L.prog.join('–')} in ${sngNoteName(L.keyPc)}`;
    text[fields[1] || fields[0] || 'Notes'] = ((text[fields[1]] ? text[fields[1]] + '\n' : '') + lines);
    sngSaveOutput('2.10', Object.assign({}, (st.outputs['2.10'] || {}).text || {}, text)); sound('success'); toast('Saved to exercise 2.10.'); };
}
/* a style's own rhythmic idea, as a grid the Groove Maker can edit */
function sngGridFromStyle(style){
  const g = {chord: ((style.voicing || {}).hits || []).map(h => h.t), bass: ((style.bass || {}).notes || []).map(n => n.t), drums: {}};
  Object.entries(style.drums || {}).forEach(([k, v]) => { g.drums[k] = v.map(h => ({t: h.t, vel: h.vel})); });
  return g;
}
/* a small keyboard, two octaves from C3; lit notes, and roles for the Chord-Scale Map */
function sngKeysHTML(lit, roles, from = 48, n = 29){
  const on = new Set((lit || []).map(m => { let x = m; while(x < from) x += 12; while(x >= from + n) x -= 12; return x; }));
  const isBlack = m => [1, 3, 6, 8, 10].includes(sngPc(m));
  const whites = [...Array(n)].map((_, i) => from + i).filter(m => !isBlack(m));
  const W = 100 / whites.length;
  return `<div class="sng-keys" role="img" aria-label="keyboard: ${[...on].map(sngMidiName).join(', ') || 'no notes'}">${whites.map((m, i) => `<i class="w${on.has(m) ? ' on' : ''}${roles && roles[sngPc(m)] ? ' r-' + roles[sngPc(m)] : ''}" style="left:${(i * W).toFixed(3)}%;width:${W.toFixed(3)}%" data-key="${m}">${sngPc(m) === 0 ? `<em>C${Math.floor(m / 12) - 1}</em>` : ''}</i>`).join('')}${
    [...Array(n)].map((_, i) => from + i).filter(isBlack).map(m => { const wi = whites.findIndex(w => w > m); return `<i class="b${on.has(m) ? ' on' : ''}${roles && roles[sngPc(m)] ? ' r-' + roles[sngPc(m)] : ''}" style="left:${((wi) * W - W * 0.3).toFixed(3)}%;width:${(W * 0.6).toFixed(3)}%" data-key="${m}"></i>`; }).join('')}</div>`;
}

/* ---------- the Groove Maker ----------
   A rhythmic idea on a step grid — chord hits, bass, drums — played
   through the engine on a progression, then repeated the three ways
   Kachulis names: exactly, varied, or with a second motive added. */
let _sngGm = null;
SNG_TOOL_VIEWS['groove-maker'] = {
  html(){
    const st = sngState(), u = sngUi(), L = sngLabState();
    let g = st.grooves.find(x => x.id === u.grooveId) || st.grooves[0];
    if(!g){ g = {id: uid(), name: 'My first groove', styleId: 'pop-drive', bpm: 110, swing: 0, prog: ['I', 'vi', 'IV', 'V'], keyPc: 0, colour: 'major', grid: sngGridFromStyle(SNG_STYLES.find(s => s.id === 'pop-drive')), createdAt: new Date().toISOString()}; st.grooves.unshift(g); saveNow(); }
    u.grooveId = g.id;
    const style = SNG_STYLES.find(s => s.id === g.styleId) || SNG_STYLES[0], steps = sngBarSteps(style) * sngPatternBars(style);
    const rows = [['chord', 'Chords'], ['bass', 'Bass']].concat(Object.keys(Object.assign({kick: 1, snare: 1, hat: 1}, g.grid.drums || {})).map(k => ['d:' + k, k]));
    const has = (row, t) => row === 'chord' ? g.grid.chord.includes(t) : row === 'bass' ? g.grid.bass.includes(t) : ((g.grid.drums || {})[row.slice(2)] || []).some(h => h.t === t);
    const beat = style.timeSig[1] === 8 ? 6 : 4;
    return `<div class="sng-row"><select class="inp" id="gmPick">${st.grooves.map(x => `<option value="${x.id}" ${x.id === g.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <input class="inp" id="gmName" value="${esc(g.name)}" aria-label="name"><button class="tbtn" id="gmNew">new</button><button class="del-x inline" id="gmDel" aria-label="throw this groove away">×</button></div>
    <div class="card"><div class="sng-row"><button class="btn primary" id="gmPlay">${_sngGm && _sngGm.running ? '■ Stop' : '▶ Play'}</button>
      <span class="mono faint">${esc(style.name)} · ${style.timeSig.join('/')} · ♩=${g.bpm} · over ${esc(g.prog.join('–'))}</span>
      <span class="grow"></span><span class="mono faint">repeat</span>${[['exact', 'exactly'], ['varied', 'varied'], ['second', 'add a second motive']].map(([k, n]) => `<button class="tbtn${(g.repeat || 'exact') === k ? ' on' : ''}" data-gmrep="${k}">${n}</button>`).join('')}</div>
      <div class="sng-grid" style="--steps:${steps}">${rows.map(([row, label]) => `<div class="sng-grid-row"><span class="mono">${esc(label)}</span>${[...Array(steps)].map((_, t) =>
        `<button class="sng-step${has(row, t) ? ' on' : ''}${t % beat === 0 ? ' beat' : ''}" data-gmrow="${esc(row)}" data-gmt="${t}" aria-label="${esc(label)} step ${t + 1}"></button>`).join('')}</div>`).join('')}</div>
      <p class="muted">Press a step to turn it on or off. The Chord Lab plays this idea too, until you pick another style there.</p>
      <div class="sng-row"><button class="tbtn" id="gmToLab">Play it in the Chord Lab</button><button class="tbtn" id="gmSeed">Keep it in the Seedbank</button><button class="tbtn" id="gmMidi">Export MIDI</button></div></div>`;
  },
  bind(host){
    const st = sngState(), u = sngUi(), g = st.grooves.find(x => x.id === u.grooveId); if(!g) return;
    const style = SNG_STYLES.find(s => s.id === g.styleId) || SNG_STYLES[0];
    const q = s => host.querySelector(s);
    const opts = () => ({chords: g.prog.map(r => sngParseRoman(r) || {root: 0, quality: 'maj'}), keyPc: g.keyPc || 0, colour: g.colour, style, bpm: g.bpm, swing: g.swing, grid: sngGmGrid(g), tone: 'piano'});
    q('#gmPick').onchange = e => { u.grooveId = e.target.value; rerender(); };
    q('#gmName').onchange = e => { g.name = e.target.value.trim() || g.name; saveNow(); };
    q('#gmNew').onclick = () => { const L = sngLabState(); const s = sngLabStyle(L); const n = {id: uid(), name: 'A new groove', styleId: s.id, bpm: L.bpm, swing: L.swing, prog: L.prog.slice(), keyPc: L.keyPc, colour: L.colour, grid: sngGridFromStyle(s), createdAt: new Date().toISOString()};
      st.grooves.unshift(n); u.grooveId = n.id; saveNow(); rerender(); };
    q('#gmDel').onclick = () => { requestDelete({label: g.name, node: host, after: () => rerender(), remove: () => { const back = spliceOut(st.grooves, x => x.id === g.id); u.grooveId = null; saveNow(); return back; }}); };
    $$('[data-gmrep]', host).forEach(b => b.onclick = () => { g.repeat = b.dataset.gmrep; saveNow(); if(_sngGm && _sngGm.running) _sngGm.set('grid', sngGmGrid(g)); rerender(); });
    $$('[data-gmt]', host).forEach(b => b.onclick = () => {
      const row = b.dataset.gmrow, t = +b.dataset.gmt;
      const flip = list => { const i = list.findIndex(x => (typeof x === 'number' ? x : x.t) === t); if(i >= 0) list.splice(i, 1); else list.push(row.startsWith('d:') ? {t, vel: 0.7} : t); list.sort((a, c) => (a.t != null ? a.t : a) - (c.t != null ? c.t : c)); };
      if(row === 'chord') flip(g.grid.chord); else if(row === 'bass') flip(g.grid.bass); else { const k = row.slice(2); g.grid.drums = g.grid.drums || {}; g.grid.drums[k] = g.grid.drums[k] || []; flip(g.grid.drums[k]); }
      b.classList.toggle('on'); saveNow(); if(_sngGm && _sngGm.running) _sngGm.set('grid', sngGmGrid(g));
      if(!row.startsWith('d:')) return; const ctx = sngCtx(); if(ctx) sngDrum(ctx, ctx.destination, row.slice(2), ctx.currentTime + 0.01, 0.7);
    });
    q('#gmPlay').onclick = () => { if(_sngGm && _sngGm.running){ _sngGm.stop(); _sngGm = null; rerender(); return; } _sngGm = sngGroove(opts()); _sngGm.start(); rerender(); };
    q('#gmToLab').onclick = () => { const L = sngLabState(); Object.assign(L, {styleId: g.styleId, bpm: g.bpm, swing: g.swing, prog: g.prog.slice(), keyPc: g.keyPc || 0, colour: g.colour || 'major', grid: sngGmGrid(g)}); saveNow(); navigate('#/songwriting/tool/chord-lab'); };
    q('#gmSeed').onclick = () => { sngSeed({type: 'groove', content: `${g.name} (${style.name}, ♩=${g.bpm})`, source: 'Groove Maker', data: {chords: opts().chords, keyPc: g.keyPc, styleId: g.styleId, bpm: g.bpm, swing: g.swing}}); sound('success'); toast('In the Seedbank.'); };
    q('#gmMidi').onclick = () => sngDownload(sngMidiFile(opts(), Math.max(4, g.prog.length * 2)), `${g.name.replace(/[^\w-]+/g, '-')}.mid`);
  }
};
/* the three ways a rhythmic idea repeats (Kachulis, Melody Unit I): the
   second bar as the first, varied (its last hit moved), or a second motive
   (the hits of the second half answer the first, shifted an eighth) */
function sngGmGrid(g){
  const r = g.repeat || 'exact', grid = JSON.parse(JSON.stringify(g.grid));
  if(r === 'exact') return grid;
  const style = SNG_STYLES.find(s => s.id === g.styleId) || SNG_STYLES[0], S = sngBarSteps(style);
  if(sngPatternBars(style) > 1) return grid;
  const second = r === 'varied' ? grid.chord.map((t, i, a) => i === a.length - 1 ? Math.min(S - 1, t + 2) : t) : grid.chord.map(t => (t + 2) % S).sort((a, b) => a - b);
  grid.chord = grid.chord.concat(second.map(t => t + S));
  grid.bass = grid.bass.concat(grid.bass.map(t => t + S));
  Object.keys(grid.drums || {}).forEach(k => { grid.drums[k] = grid.drums[k].concat(grid.drums[k].map(h => ({t: h.t + S, vel: h.vel}))); });
  return grid;
}

/* ---------- the Writer's-Block Deck ---------- */
SNG_TOOL_VIEWS['block-deck'] = {
  html(){ const u = sngUi(); const c = SNG_BLOCK_CARDS[u.blockCard != null ? u.blockCard : 0];
    return `<div class="card sng-block"><p class="serif sng-block-t">${esc(c.text)}</p><p class="mono faint">${esc(c.source)}</p>
      <div class="sng-row"><button class="btn primary" id="blockNext">Draw another</button>${c.tool ? `<a class="tbtn" href="#/songwriting/tool/${esc(c.tool)}">Open the ${esc(sngToolName(c.tool))}</a>` : ''}</div></div>
      <p class="muted">${SNG_BLOCK_CARDS.length} techniques, each from the book named on it. Take the card literally for ten minutes.</p>`; },
  bind(host){ host.querySelector('#blockNext').onclick = () => { const u = sngUi(); let n; do { n = Math.floor(Math.random() * SNG_BLOCK_CARDS.length); } while(n === u.blockCard && SNG_BLOCK_CARDS.length > 1); u.blockCard = n; rerender(); }; }
};

/* ---------- the Metronome ---------- */
let _sngMet = null;
SNG_TOOL_VIEWS['metronome'] = {
  html(){ const u = sngUi(); u.metBpm = u.metBpm || 90; u.metPer = u.metPer || 4;
    return `<div class="card sng-met"><div class="sng-row"><button class="btn primary" id="metGo">${_sngMet ? '■ Stop' : '▶ Start'}</button>
      <label class="mono faint">♩ <input class="inp mono sng-bpm" id="metBpm" type="number" min="30" max="260" value="${u.metBpm}"></label>
      <button class="tbtn" id="metTap">tap</button>
      <label class="mono faint">beats a bar <select class="inp" id="metPer">${[2, 3, 4, 6].map(n => `<option ${u.metPer === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div></div>`; },
  bind(host){ const u = sngUi(); const q = s => host.querySelector(s);
    const stop = () => { if(_sngMet){ clearInterval(_sngMet.timer); _sngMet = null; } };
    q('#metGo').onclick = () => { if(_sngMet){ stop(); rerender(); return; }
      const ctx = sngCtx(); if(!ctx) return; let next = ctx.currentTime + 0.05, n = 0;
      _sngMet = {timer: setInterval(() => { while(next < ctx.currentTime + 0.12){ sngDrum(ctx, ctx.destination, n % u.metPer === 0 ? 'clave' : 'rimclick', next, n % u.metPer === 0 ? 0.9 : 0.6); next += 60 / u.metBpm; n++; } }, 25)};
      rerender(); };
    q('#metBpm').onchange = e => { u.metBpm = Math.max(30, Math.min(260, +e.target.value || 90)); };
    q('#metPer').onchange = e => { u.metPer = +e.target.value; };
    const taps = []; q('#metTap').onclick = () => { const t = performance.now(); if(taps.length && t - taps[taps.length - 1] > 2000) taps.length = 0; taps.push(t);
      if(taps.length >= 3){ u.metBpm = Math.round(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1))); q('#metBpm').value = u.metBpm; } };
  }
};
