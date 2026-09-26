/* ============================================================
   PLAYING WITH A PARTNER — Score Practice's ensemble play-along.

   A duet, a sonata with a violin, a concerto's orchestra reduced for a
   second piano, a work for two pianos: you play one part and the room
   plays the others, while you read only your own. Each part has a role:

     Mine         shown; heard only as a quiet guide, if at all
     Partner      hidden, and heard — what somebody else would play
     Show & Play  shown and heard
     Silent       hidden and not heard

   A role is only a name for two things the room already does separately:
   which parts are drawn (the parts bar's checkboxes, x.hidden) and which
   are heard (the player's own gain for each part). Hiding a part never
   mutes it and muting never hides it, so the drawn half of a role is read
   straight off x.hidden every time — tick a part back on in the parts bar
   and a Partner becomes Show & Play — and only the heard half is kept here.

   Everything is kept with the piece as x.ensembleSettings, so a two-piano
   work opens again as "I'm Piano I". The room's hooks into the play bar
   (19-score-play.js) are scoreEnsembleCfg's: the mix, the section tempos,
   the fermata hold, the places to wait, and what happens at each loop.
   ============================================================ */

const ENS_ROLES = [
  ['mine', 'Mine', 'shown; heard only as a quiet guide, if at all — the part you play'],
  ['partner', 'Partner', 'hidden, and heard — what somebody else would play'],
  ['show_play', 'Show & Play', 'shown and heard'],
  ['silent', 'Silent', 'hidden and not heard']];
const ENS_ROLE_IDS = ENS_ROLES.map(r => r[0]);
const ENS_FADE = [0.2, 0.1, 0.05, 0];
const ENS_HOLDS = [[1.5, '1.5×'], [2, '2×'], [3, '3×'], ['wait', 'wait for me']];

/* filled in where it is, never replaced: the panel, the play bar and the
   log all hold on to the same object, and a copy would leave them talking
   to one nobody reads any more */
function ensembleDefaults(x){
  const e = x.ensembleSettings && typeof x.ensembleSettings === 'object' ? x.ensembleSettings : {};
  const want = {partRoles: {}, partVolumes: {}, mineStaffOnly: null, guideVolume: 0,
    guideFadeEnabled: false, guideFadeSteps: ENS_FADE.slice(), showCueStrip: false, readCue: null, fermataHold: 2,
    defaultTempo: null, tempoAsked: false, sectionTempoOverrides: {}, countInBars: 0, tempoPercent: 100,
    tapTempo: false, midiWait: false, midiOctave: false};
  Object.keys(want).forEach(k => { if(e[k] === undefined) e[k] = want[k]; });
  const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  e.partRoles = obj(e.partRoles);
  Object.keys(e.partRoles).forEach(k => { if(!ENS_ROLE_IDS.includes(e.partRoles[k])) delete e.partRoles[k]; });
  e.partVolumes = obj(e.partVolumes);
  Object.keys(e.partVolumes).forEach(k => { e.partVolumes[k] = clamp(+e.partVolumes[k] || 0, 0, 1); });
  e.mineStaffOnly = [1, 2].includes(+e.mineStaffOnly) ? +e.mineStaffOnly : null;
  e.guideVolume = clamp(+e.guideVolume || 0, 0, 0.5);
  e.guideFadeEnabled = !!e.guideFadeEnabled;
  e.guideFadeSteps = Array.isArray(e.guideFadeSteps) && e.guideFadeSteps.length
    ? e.guideFadeSteps.map(v => clamp(+v || 0, 0, 0.5)) : ENS_FADE.slice();
  e.showCueStrip = !!e.showCueStrip;
  /* reading mode keeps its own answer once you give it one; until then it
     does what the room does */
  e.readCue = e.readCue == null ? null : !!e.readCue;
  e.fermataHold = e.fermataHold === 'wait' ? 'wait' : [1.5, 2, 3].includes(+e.fermataHold) ? +e.fermataHold : 2;
  e.defaultTempo = +e.defaultTempo > 0 ? clamp(Math.round(+e.defaultTempo), 20, 300) : null;
  e.tempoAsked = !!e.tempoAsked;
  e.sectionTempoOverrides = obj(e.sectionTempoOverrides);
  Object.keys(e.sectionTempoOverrides).forEach(k => { const o = e.sectionTempoOverrides[k];
    if(!o || !(+o.startBpm > 0)) { delete e.sectionTempoOverrides[k]; return; }
    o.startBpm = clamp(Math.round(+o.startBpm), 10, 400);
    o.endBpm = +o.endBpm > 0 ? clamp(Math.round(+o.endBpm), 10, 400) : null; });
  e.countInBars = clamp(+e.countInBars || 0, 0, 2);
  e.tempoPercent = clamp(+e.tempoPercent || 100, 5, 400);
  e.tapTempo = !!e.tapTempo; e.midiWait = !!e.midiWait; e.midiOctave = !!e.midiOctave;
  x.ensembleSettings = e;
  return e;
}

/* what is going on now, not kept: the guide as it fades, the loops, the
   last run (for the log), the taps, the notes being waited for, MIDI */
const _ens = {run: null, last: null, taps: [], want: null, recent: [], tl: {xml: null, tl: null},
  midi: {state: 'unknown', access: null, inputs: 0, fake: 0}};

/* the parts as the player reads them: the play bar's own timeline when there
   is one, else read once and kept (a big score is not read again for a role) */
function ensTimeline(x){
  const bar = document.querySelector('#scPlayRow .plx-bar');
  const c = bar && bar._plx;
  if(c && c.timeline) return c.timeline;
  let xml = '';
  try { xml = scoreXmlFor(x); } catch(e){ return null; }
  if(!xml) return null;
  if(_ens.tl.xml !== xml){ try { _ens.tl = {xml, tl: musicXmlTimeline(xml)}; } catch(e){ _ens.tl = {xml, tl: null}; } }
  return _ens.tl.tl;
}
const ensCtl = () => { const b = document.querySelector('#scPlayRow .plx-bar'); return b && b._plx || null; };

/* ---------- roles ---------- */
function ensembleRole(x, part, i){
  const e = x.ensembleSettings || ensembleDefaults(x);
  const stored = e.partRoles[part.id];
  const shown = !(x.hidden || []).includes(i);
  const heard = stored ? (stored === 'partner' || stored === 'show_play') : true;
  const role = shown ? (heard ? 'show_play' : 'mine') : (heard ? 'partner' : 'silent');
  if(stored && stored !== role) e.partRoles[part.id] = role;
  return role;
}
const ensembleRoles = (x, tl) => tl ? tl.parts.map((p, i) => ensembleRole(x, p, i)) : [];
const ensHasMine = (x, tl) => ensembleRoles(x, tl || ensTimeline(x)).includes('mine');
/* playing along with somebody: something of yours, and something of theirs heard */
function ensWithPartner(x, tl){
  const roles = ensembleRoles(x, tl);
  const e = x.ensembleSettings;
  return roles.includes('mine') && roles.some((r, i) => (r === 'partner' || r === 'show_play')
    && (e.partVolumes[tl.parts[i].id] == null || e.partVolumes[tl.parts[i].id] > 0));
}
/** Set one part's role. Two parts may be Mine (primo and secondo, alone); a
 *  third takes the place of the first. Something always stays on the page. */
function setEnsembleRole(x, tl, i, role){
  if(!tl || !tl.parts[i] || !ENS_ROLE_IDS.includes(role)) return false;
  const e = x.ensembleSettings, parts = tl.parts;
  const hidden = new Set(x.hidden || []);
  if(role === 'mine' || role === 'show_play') hidden.delete(i); else hidden.add(i);
  if(hidden.size >= parts.length) return false;
  if(role === 'mine'){
    const others = parts.map((p, j) => j).filter(j => j !== i && ensembleRole(x, parts[j], j) === 'mine');
    others.slice(0, Math.max(0, others.length - 1)).forEach(j => { e.partRoles[parts[j].id] = 'partner'; hidden.add(j); });
  }
  e.partRoles[parts[i].id] = role;
  x.hidden = [...hidden].sort((a, b) => a - b);
  return true;
}
/** "I'm Piano I": that part Mine, every other Partner. 'all': everything
 *  shown and heard, the guide off — to hear the piece before practising it. */
function ensemblePreset(x, tl, which){
  if(!tl) return false;
  const e = x.ensembleSettings;
  if(which === 'all'){
    tl.parts.forEach(p => { e.partRoles[p.id] = 'show_play'; });
    x.hidden = []; e.guideVolume = 0; e.mineStaffOnly = null;
  } else {
    const i = +which; if(!tl.parts[i]) return false;
    tl.parts.forEach((p, j) => { e.partRoles[p.id] = j === i ? 'mine' : 'partner'; });
    x.hidden = tl.parts.map((p, j) => j).filter(j => j !== i);
    if(tl.parts[i].staves < 2) e.mineStaffOnly = null;
  }
  return true;
}

/* ---------- what is heard ----------
   Mine is heard at the guide level (and not at all at 0); with one hand
   Mine, the other hand is heard as a partner would be. */
const ensGuideNow = x => (_ens.run && _ens.run.scoreId === x.id && !_ens.run.stopped) ? _ens.run.guide : x.ensembleSettings.guideVolume;
function ensembleMix(x, tl){
  const e = x.ensembleSettings, muted = [], volumes = {};
  if(!tl) return {muted, volumes};
  const guide = clamp(ensGuideNow(x), 0, 0.5);
  tl.parts.forEach((p, pi) => {
    const role = ensembleRole(x, p, pi);
    const vol = e.partVolumes[p.id] == null ? 1 : clamp(+e.partVolumes[p.id], 0, 1);
    if(role === 'silent'){ muted.push(`p:${pi}`); return; }
    if(role !== 'mine'){ volumes[pi] = vol; if(vol <= 0) muted.push(`p:${pi}`); return; }
    const only = e.mineStaffOnly && p.staves >= 2 ? e.mineStaffOnly : null;
    if(only){
      volumes[pi] = 1;
      for(let st = 1; st <= p.staves; st++) volumes[`${pi}:${st}`] = st === only ? guide : vol;
      if(guide <= 0) muted.push(`p:${pi}:s:${only}`);
    } else if(guide <= 0) muted.push(`p:${pi}`);
    else volumes[pi] = guide;
  });
  return {muted, volumes};
}
/* the notes that are yours: the Mine parts, one hand of them if only one is */
function ensMineEvents(x, tl){
  const roles = ensembleRoles(x, tl), only = x.ensembleSettings.mineStaffOnly;
  return tl.events.filter(ev => !ev.chord && !ev.grace && !ev.perc && roles[ev.part] === 'mine'
    && (!only || tl.parts[ev.part].staves < 2 || ev.staff === only));
}

/* ---------- the tempo: a section's own, and the fermatas ----------
   A section's tempo is written as a ♩ the musician thinks in, at 100%; the
   player's map counts from the score's own first mark, so it is scaled to
   that. With an end tempo it ramps across the section (a rit., an accel.),
   every time the section is played. */
function ensScoreBpm(x, tl){
  const e = x.ensembleSettings;
  return tl && tl.tempos[0].assumed ? (e.defaultTempo || 80) : Math.round(tl ? tl.tempos[0].bpm : 80);
}
function ensembleOverrides(x, tl){
  const e = x.ensembleSettings, out = [];
  if(!tl) return out;
  const scale = tl.tempos[0].bpm / Math.max(1, ensScoreBpm(x, tl));
  (x.sections || []).forEach(s => {
    const o = e.sectionTempoOverrides[s.id];
    if(!o || !(+o.startBpm > 0)) return;
    const runs = [];
    tl.perf.forEach(p => {
      if(p.number < s.startMeasure || p.number > s.endMeasure) return;
      const last = runs[runs.length - 1];
      if(last && Math.abs(last.q1 - p.q0) < 1e-6) last.q1 = p.q0 + p.len;
      else runs.push({q0: p.q0, q1: p.q0 + p.len});
    });
    runs.forEach(r => out.push({q0: r.q0, q1: r.q1, start: o.startBpm * scale, end: +o.endBpm > 0 ? o.endBpm * scale : 0}));
  });
  return out;
}
/* the tempo the score is at where a section starts, as a ♩ at 100% */
function ensScoreTempoAt(x, tl, measure){
  if(!tl) return 80;
  const p = tl.perf.find(v => v.number >= measure) || tl.perf[0];
  let b = tl.tempos[0].bpm;
  tl.tempos.forEach(t => { if(p && t.q <= p.q0 + 1e-9) b = t.bpm; });
  return Math.round(b * ensScoreBpm(x, tl) / tl.tempos[0].bpm);
}
/* a rit. or accel. written somewhere in the section */
function ensSectionWord(tl, s){
  if(!tl) return null;
  const m = tl.measures.find(v => v.number >= s.startMeasure && v.number <= s.endMeasure && v.tempoWord);
  return m ? m.tempoWord : null;
}
/* the places to wait: the end of each fermata ("wait for me"), and each of
   your notes when a MIDI keyboard is waiting for you to play them */
function ensembleGates(x, tl){
  const e = x.ensembleSettings, g = new Set();
  if(!tl) return null;
  if(e.fermataHold === 'wait'){
    const by = new Map();
    tl.events.forEach(ev => { if(!ev.fermata || ev.chord || ev.grace || !(ev.d > 0)) return;
      const k = Math.round(ev.q * 1000); by.set(k, Math.max(by.get(k) || 0, ev.q + ev.d)); });
    by.forEach(v => g.add(Math.round(v * 1e6) / 1e6));
  }
  if(e.midiWait && ensMidiReady()) ensMineEvents(x, tl).forEach(ev => g.add(Math.round(ev.q * 1e6) / 1e6));
  return g.size ? [...g].sort((a, b) => a - b) : null;
}

/* ---------- a run: from ▶ to ⏹ ----------
   The guide starts where you set it and, with the fade on, drops a step at
   every loop — 20%, 10%, 5%, nothing — until you are playing your part
   alone with the partner. Pausing is not the end of a run; stopping is. */
function ensRunBegin(x, ctl){
  const r = _ens.run;
  if(r && r.scoreId === x.id && !r.stopped) return r;
  const e = x.ensembleSettings;
  let guide = e.guideVolume;
  if(e.guideFadeEnabled && guide <= 0) guide = Math.max(...e.guideFadeSteps);
  _ens.run = {scoreId: x.id, guide, loops: 0, stopped: false, started: Date.now()};
  return _ens.run;
}
function ensembleOnLoop(x, ctl){
  const r = _ens.run; if(!r || r.scoreId !== x.id) return;
  r.loops++;
  const e = x.ensembleSettings, tl = ctl.timeline;
  if(e.guideFadeEnabled && r.guide > 0 && ensHasMine(x, tl)){
    const next = e.guideFadeSteps.slice().sort((a, b) => b - a).find(v => v < r.guide - 1e-6);
    r.guide = next == null ? 0 : next;
    ctl.applyMix();
  }
  ensGuidePaint(x);
}
function ensembleOnStop(x, ctl){
  const r = _ens.run;
  const tl = ctl.timeline;
  if(r && r.scoreId === x.id && !r.stopped){
    r.stopped = true;
    _ens.last = {scoreId: x.id, at: Date.now(), withPartner: tl ? ensWithPartner(x, tl) : false,
      mine: tl ? ensHasMine(x, tl) : false, pct: Math.round(ctl.tempoPct()), bpm: ctl.bpm(),
      guide: r.guide, loops: r.loops};
  }
  ensWaitClear();
  ensGuidePaint(x);
}
function ensGuideSay(x){
  const tl = ensTimeline(x), r = _ens.run;
  if(!tl || !ensHasMine(x, tl)) return '';
  const live = r && r.scoreId === x.id && !r.stopped;
  const g = live ? r.guide : x.ensembleSettings.guideVolume;
  return `Guide: ${Math.round(g * 100)}%${live ? ` · loop ${r.loops + 1}` : ''}`;
}
function ensGuidePaint(x){
  const s = document.getElementById('scGuideSay');
  if(s){ const t = ensGuideSay(x); s.textContent = t; s.hidden = !t; }
}

/* ---------- tap to lead ----------
   One tap a beat on the space bar while it plays, and the partner follows:
   the last four taps set the tempo, so one early tap does not throw it. */
function ensembleSpace(x, ctl){
  const e = x.ensembleSettings;
  const p = ctl && ctl.player;
  if(!e.tapTempo || !p || !p.running || p.waiting != null) return false;
  const now = performance.now();
  _ens.taps = _ens.taps.filter(t => now - t < 2500);
  _ens.taps.push(now);
  if(_ens.taps.length > 4) _ens.taps.shift();
  if(_ens.taps.length >= 2){
    const iv = [];
    for(let i = 1; i < _ens.taps.length; i++) iv.push(_ens.taps[i] - _ens.taps[i - 1]);
    const avg = iv.reduce((a, b) => a + b, 0) / iv.length;
    const q = p.position(), pm = p.perfAt(q);
    const beatQ = !pm ? 1 : 4 / pm.beatType * (pm.beatType === 8 && pm.beats % 3 === 0 && pm.beats > 3 ? 3 : 1);
    const want = 60000 / avg * beatQ, have = p.bpmAt(q);
    if(want > 0 && have > 0) ctl.setPct(clamp(ctl.tempoPct() * want / have, 25, 150), true);
  }
  ensSay(`tapping · ♩ = ${ctl.bpm()}`, 1400);
  return true;
}

/* ---------- waiting ---------- */
function ensSay(text, ms){
  const stage = document.getElementById('scStage'); if(!stage) return null;
  let chip = document.getElementById('scEnsWait');
  if(!chip){ chip = document.createElement('button'); chip.id = 'scEnsWait'; chip.className = 'sc-ens-wait mono';
    chip.onclick = ev => { ev.stopPropagation(); const c = ensCtl(); if(c && c.player && c.player.waiting != null){ c.player.release(); ensWaitClear(); } };
    stage.appendChild(chip); }
  chip.textContent = text; chip.hidden = !text;
  clearTimeout(chip._t);
  if(ms) chip._t = setTimeout(() => { chip.hidden = true; }, ms);
  return chip;
}
function ensWaitClear(){
  _ens.want = null;
  const chip = document.getElementById('scEnsWait'); if(chip) chip.hidden = true;
  const box = document.getElementById('scWaitMarks'); if(box) box.innerHTML = '';
}
const ENS_PC = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
function ensembleOnGate(x, q, ctl){
  const tl = ctl.timeline, e = x.ensembleSettings;
  const need = e.midiWait && ensMidiReady() && tl ? ensMineEvents(x, tl).filter(ev => Math.abs(ev.q - q) < 1e-6) : [];
  if(!need.length){ ensSay('𝄐 held — space, or tap here, to go on'); return; }
  const octave = e.midiOctave;
  _ens.want = {q, octave, need: new Set(need.map(ev => octave ? ev.midi : ev.midi % 12)), got: new Set(), notes: need};
  /* a note played a moment early counts: nobody lands exactly on the gate */
  const now = performance.now();
  _ens.recent.filter(r => now - r.t < 400).forEach(r => _ens.want.got.add(octave ? r.midi : r.midi % 12));
  if(ensWantMet()){ ensRelease(); return; }
  ensWaitPaint(x, ctl);
}
const ensWantMet = () => { const w = _ens.want; return !!w && [...w.need].every(n => w.got.has(n)); };
function ensRelease(){
  const c = ensCtl();
  ensWaitClear();
  if(c && c.player && c.player.waiting != null) c.player.release();
}
/* the notes being waited for, lit where they are on the page */
function ensWaitPaint(x, ctl){
  const w = _ens.want; if(!w) return;
  const left = [...w.need].filter(n => !w.got.has(n));
  ensSay(`waiting for ${left.map(n => w.octave ? `${ENS_PC[n % 12]}${Math.floor(n / 12) - 1}` : ENS_PC[n]).join(' · ')}`);
  const stage = document.getElementById('scStage'); if(!stage) return;
  let box = document.getElementById('scWaitMarks');
  if(!box){ box = document.createElement('div'); box.id = 'scWaitMarks'; box.className = 'sc-marks sc-waitmarks';
    box.setAttribute('aria-hidden', 'true'); stage.appendChild(box); }
  const tl = ctl.timeline, pm = ctl.player && ctl.player.perfAt(w.q);
  if(!tl || !pm || typeof scoreNotes !== 'function'){ box.innerHTML = ''; return; }
  /* each part's staves, counted through the whole sheet as the engraver counts them */
  const first = []; let n = 0; tl.parts.forEach(p => { first.push(n); n += p.staves || 1; });
  const staves = new Set(w.notes.map(ev => first[ev.part] + (ev.staff || 1) - 1));
  const sv = scoreView(), on = sv && sv.page ? sv.at : null;
  const beat = w.q - pm.q0;
  const heads = scoreNotes().filter(h => !h.rest && h.midi != null && h.measure === pm.number
    && (on === null || h.page === on) && Math.abs(h.beat - beat) < 0.02 && staves.has(h.staff)
    && w.need.has(w.octave ? h.midi : h.midi % 12));
  box.innerHTML = heads.map(h => `<i class="sc-wait-dot${w.got.has(w.octave ? h.midi : h.midi % 12) ? ' got' : ''}" style="left:${h.x}px;top:${h.y}px"></i>`).join('');
}

/* ---------- MIDI: wait for me ----------
   Offered only where there is a keyboard to listen to. Browsers now ask
   before letting a page hear one, so the room never asks on its own: if
   the permission is already given it looks for a keyboard; if not, the
   option waits behind one small button, and disappears if none is there. */
const ensMidiReady = () => _ens.midi.inputs > 0 || _ens.midi.fake > 0;
async function ensMidiConnect(ask){
  const m = _ens.midi;
  if(!navigator.requestMIDIAccess){ m.state = 'none'; return m.state; }
  let perm = 'prompt';
  try { perm = (await navigator.permissions.query({name: 'midi'})).state; } catch(e){}
  if(perm === 'denied'){ m.state = 'none'; return m.state; }
  if(perm !== 'granted' && !ask){ m.state = m.state === 'none' ? 'none' : 'ask'; return m.state; }
  try {
    const acc = m.access || await navigator.requestMIDIAccess();
    m.access = acc;
    const hook = () => { let n = 0; acc.inputs.forEach(inp => { n++; inp.onmidimessage = ensMidiMessage; });
      m.inputs = n; m.state = n ? 'ready' : 'none'; ensMidiPaint(); };
    acc.onstatechange = hook; hook();
  } catch(e){ m.state = 'none'; }
  ensMidiPaint();
  return m.state;
}
function ensMidiMessage(ev){
  const d = ev.data; if(!d || d.length < 3) return;
  if((d[0] & 0xf0) === 0x90 && d[2] > 0) ensembleNoteIn(d[1]);
}
/** A note played on the keyboard (or handed in by a test). True when it
 *  was the last one being waited for. */
function ensembleNoteIn(midi){
  _ens.recent.push({midi, t: performance.now()});
  if(_ens.recent.length > 16) _ens.recent.shift();
  const w = _ens.want; if(!w) return false;
  w.got.add(w.octave ? midi : midi % 12);
  if(ensWantMet()){ ensRelease(); return true; }
  const x = scoreById(scoreUi().id), c = ensCtl();
  if(x && c) ensWaitPaint(x, c);
  return false;
}
function ensMidiPaint(){
  const box = document.getElementById('scEnsMidi'); if(!box) return;
  const x = scoreById(scoreUi().id); if(!x) return;
  const e = x.ensembleSettings, m = _ens.midi;
  if(ensMidiReady()){
    box.hidden = false;
    box.innerHTML = `<label class="sc-ens-chk" title="at each of your notes the partner waits until you play it — pitch names only, unless the octave is asked for too">
        <input type="checkbox" data-ensmidi ${e.midiWait ? 'checked' : ''}> wait for my notes (MIDI)</label>
      <label class="sc-ens-chk faint"><input type="checkbox" data-ensoct ${e.midiOctave ? 'checked' : ''}> the right octave too</label>`;
  } else if(m.state === 'ask'){
    box.hidden = false;
    box.innerHTML = `<button class="tbtn" data-ensmidiask title="let this page hear a MIDI keyboard, so the partner can wait for you to play your notes">🎹 a MIDI keyboard…</button>`;
  } else { box.hidden = true; box.innerHTML = ''; }
  const on = box.querySelector('[data-ensmidi]');
  if(on) on.onchange = () => { e.midiWait = on.checked; saveNow(); const c = ensCtl(); if(c) c.applyTempo(); };
  const oct = box.querySelector('[data-ensoct]');
  if(oct) oct.onchange = () => { e.midiOctave = oct.checked; saveNow(); };
  const ask = box.querySelector('[data-ensmidiask]');
  if(ask) ask.onclick = () => ensMidiConnect(true);
}

/* ---------- the panel ---------- */
function ensPartVolume(x, p){ const v = x.ensembleSettings.partVolumes[p.id]; return v == null ? 1 : v; }
function scoreEnsembleHTML(x){
  const tl = ensTimeline(x);
  if(!tl || !tl.playable) return '';
  const e = x.ensembleSettings, ui = scoreUi();
  const roles = ensembleRoles(x, tl);
  const multi = tl.parts.length > 1;
  const open = !!ui.ensOpen;
  const mineParts = tl.parts.filter((p, i) => roles[i] === 'mine');
  const twoHands = multi ? mineParts.some(p => p.staves >= 2) : tl.parts[0].staves >= 2;
  const names = tl.parts.map(p => p.name);
  const inst = p => p.inst && p.inst !== 'piano' && typeof instrumentName === 'function' ? instrumentName(p.inst) : '';
  const pct = v => `${Math.round(v * 100)}%`;
  const head = multi
    ? `<button class="tbtn sc-ens-tog" id="scEnsTog" aria-expanded="${open}">🎼 Parts ${open ? '▾' : '▸'}</button>
       <span class="sc-ens-presets"><span class="mono faint">quick:</span>${tl.parts.map((p, i) =>
         `<button class="tbtn${roles[i] === 'mine' && mineParts.length === 1 && roles.every((r, j) => j === i || r === 'partner') ? ' on' : ''}" data-enspreset="${i}">I'm ${esc(p.name)}</button>`).join('')}
         <button class="tbtn${roles.every(r => r === 'show_play') ? ' on' : ''}" data-enspreset="all">Listen to all</button></span>`
    : `<button class="tbtn sc-ens-tog" id="scEnsTog" aria-expanded="${open}">🎹 Practise with it ${open ? '▾' : '▸'}</button>
       <span class="mono faint sc-ens-sum">${roles[0] === 'mine' ? (e.mineStaffOnly === 1 && twoHands ? 'you play the right hand' : e.mineStaffOnly === 2 && twoHands ? 'you play the left hand' : 'you play it') : 'listening'}</span>`;
  const partRow = (p, i) => {
    const role = roles[i], shown = role === 'mine' || role === 'show_play', heard = role === 'partner' || role === 'show_play';
    return `<div class="sc-ens-row" data-ensrow="${i}">
      <span class="sc-ens-name">${esc(p.name)}${inst(p) ? ` <i class="mono faint">${esc(inst(p))}</i>` : ''}</span>
      <span class="sc-ens-roles" role="radiogroup" aria-label="${esc(p.name)}'s role">${ENS_ROLES.map(([id, label, hint]) =>
        `<button class="tbtn${role === id ? ' on' : ''}" role="radio" aria-checked="${role === id}" data-ensrole="${i}:${id}" title="${esc(hint)}">${role === id ? '● ' : ''}${esc(label)}</button>`).join('')}</span>
      <button class="tbtn" data-enseye="${i}" title="drawn on the page or not — never changes what is heard">${shown ? '👁 Show' : '🙈 Hidden'}</button>
      <button class="tbtn" data-ensear="${i}" title="heard or not — never changes what is drawn">${heard ? '🔊 Plays' : role === 'mine' ? '🔇 Guide' : '🔇 Muted'}</button>
      ${role === 'mine'
        ? `<label class="sc-ens-vol" title="your own part, quietly, while you learn it (0–50%)"><span class="mono">guide</span>
            <input type="range" min="0" max="50" step="5" data-ensguide value="${Math.round(e.guideVolume * 100)}"><b class="mono" data-ensguidev>${pct(e.guideVolume)}</b></label>`
        : heard ? `<label class="sc-ens-vol"><span class="mono">vol</span>
            <input type="range" min="0" max="100" step="5" data-ensvol="${i}" value="${Math.round(ensPartVolume(x, p) * 100)}"><b class="mono">${pct(ensPartVolume(x, p))}</b></label>` : ''}
    </div>`;
  };
  const single = !multi ? `<div class="sc-ens-row">
      <span class="mono faint">I play</span>
      <span class="sc-ens-roles" role="radiogroup" aria-label="what you play">
        <button class="tbtn${roles[0] !== 'mine' ? ' on' : ''}" role="radio" data-enssolo="listen">nothing — I listen</button>
        <button class="tbtn${roles[0] === 'mine' && !(e.mineStaffOnly && twoHands) ? ' on' : ''}" role="radio" data-enssolo="both">${twoHands ? 'both hands' : 'it'}</button>
        ${twoHands ? `<button class="tbtn${roles[0] === 'mine' && e.mineStaffOnly === 1 ? ' on' : ''}" role="radio" data-enssolo="1">the right hand</button>
        <button class="tbtn${roles[0] === 'mine' && e.mineStaffOnly === 2 ? ' on' : ''}" role="radio" data-enssolo="2">the left hand</button>` : ''}
      </span>
      ${roles[0] === 'mine' ? `<label class="sc-ens-vol" title="what you play, quietly, while you learn it (0–50%)"><span class="mono">guide</span>
        <input type="range" min="0" max="50" step="5" data-ensguide value="${Math.round(e.guideVolume * 100)}"><b class="mono" data-ensguidev>${pct(e.guideVolume)}</b></label>` : ''}
    </div>` : '';
  const hands = multi && twoHands ? `<label class="mono sc-ens-sel" title="hands separately: both staves stay on the page; the other hand is played for you">Mine:
      <select class="sel sm" id="scEnsHands"><option value="">both hands</option>
        <option value="1" ${e.mineStaffOnly === 1 ? 'selected' : ''}>right hand only</option>
        <option value="2" ${e.mineStaffOnly === 2 ? 'selected' : ''}>left hand only</option></select></label>` : '';
  const partners = roles.filter(r => r === 'partner').length;
  const assumed = tl.tempos[0].assumed;
  return `<div class="sc-ens-h">${head}<span class="grow"></span>
      <span class="sc-ens-guide mono" id="scGuideSay" ${ensGuideSay(x) ? '' : 'hidden'}>${esc(ensGuideSay(x))}</span></div>
    <div class="sc-ens-body" ${open ? '' : 'hidden'}>
      ${multi ? tl.parts.map(partRow).join('') : single}
      <div class="sc-ens-opts">
        ${hands}
        <label class="sc-ens-chk" title="each time the loop comes round, your guide drops a step — ${e.guideFadeSteps.map(pct).join(' → ')} — until you play it alone">
          <input type="checkbox" data-ensfade ${e.guideFadeEnabled ? 'checked' : ''}> fade my guide each loop</label>
        ${multi ? `<label class="sc-ens-chk${partners ? '' : ' faint'}" title="the Partner parts, small, above your own — to see what they are doing while you count rests">
          <input type="checkbox" data-enscue ${e.showCueStrip ? 'checked' : ''} ${partners ? '' : 'disabled'}> show the partner as a small cue strip above my part</label>` : ''}
      </div>
      <div class="sc-ens-opts">
        <span class="mono faint">fermata hold</span>
        <span class="sc-ens-roles">${ENS_HOLDS.map(([v, label]) =>
          `<button class="tbtn${e.fermataHold === v ? ' on' : ''}" data-enshold="${v}">${label}</button>`).join('')}</span>
        <label class="sc-ens-chk" title="while it plays, tap the space bar once a beat and the partner follows your tempo (▶ pauses)">
          <input type="checkbox" data-enstap ${e.tapTempo ? 'checked' : ''}> tap the tempo while it plays</label>
        <span id="scEnsMidi" class="sc-ens-midi" hidden></span>
        ${assumed ? `<label class="mono sc-ens-sel" title="this score marks no tempo: this is its tempo at 100%">no tempo marked — ♩ =
          <input class="inp sm mono" type="number" min="20" max="300" id="scEnsTempo" value="${e.defaultTempo || 80}"></label>` : ''}
      </div>
    </div>`;
}
function scoreEnsemblePaint(x){
  const box = document.getElementById('scEns'); if(!box) return;
  let html = '';
  try { html = scoreEnsembleHTML(x); } catch(e){ console.warn('the parts panel could not be drawn', e); }
  box.innerHTML = html; box.hidden = !html;
  if(!html) return;
  bindScoreEnsemble(box, x);
  ensMidiPaint();
  if(_ens.midi.state === 'unknown') ensMidiConnect(false);
}
/* a change to who is drawn: the parts bar, the engraving, the cue strip */
function ensRedrawParts(x){
  applyScoreParts(x); saveNow();
  scoreRepaintParts(x); scoreRedraw(x);
}
function ensMixChanged(x){ saveNow(); const c = ensCtl(); if(c) c.applyMix(); }
function bindScoreEnsemble(box, x){
  const e = x.ensembleSettings, ui = scoreUi();
  const tl = () => ensTimeline(x);
  const again = () => { scoreEnsemblePaint(x); ensembleCuePaint(x); };
  const tog = box.querySelector('#scEnsTog');
  if(tog) tog.onclick = () => { ui.ensOpen = !ui.ensOpen; scoreEnsemblePaint(x); };
  $$('[data-enspreset]', box).forEach(b => b.onclick = () => {
    if(!ensemblePreset(x, tl(), b.dataset.enspreset)) return;
    sound('click'); ensRedrawParts(x); ensMixChanged(x); again(); });
  $$('[data-ensrole]', box).forEach(b => b.onclick = () => {
    const [i, role] = b.dataset.ensrole.split(':');
    if(!setEnsembleRole(x, tl(), +i, role)){ toast('Something has to be on the page.'); return; }
    ensRedrawParts(x); ensMixChanged(x); again(); });
  $$('[data-enseye]', box).forEach(b => b.onclick = () => {
    const i = +b.dataset.enseye, t = tl(), role = ensembleRole(x, t.parts[i], i);
    const next = {mine: 'silent', show_play: 'partner', partner: 'show_play', silent: 'mine'}[role];
    if(!setEnsembleRole(x, t, i, next)){ toast('Something has to be on the page.'); return; }
    ensRedrawParts(x); ensMixChanged(x); again(); });
  $$('[data-ensear]', box).forEach(b => b.onclick = () => {
    const i = +b.dataset.ensear, t = tl(), role = ensembleRole(x, t.parts[i], i);
    const next = {mine: 'show_play', show_play: 'mine', partner: 'silent', silent: 'partner'}[role];
    setEnsembleRole(x, t, i, next); ensMixChanged(x); again(); });
  $$('[data-ensvol]', box).forEach(r => {
    r.oninput = () => { const i = +r.dataset.ensvol, p = tl().parts[i];
      e.partVolumes[p.id] = +r.value / 100; r.nextElementSibling.textContent = r.value + '%';
      const c = ensCtl(); if(c) c.applyMix(); };
    r.onchange = () => saveNow(); });
  const guide = box.querySelector('[data-ensguide]');
  if(guide){
    guide.oninput = () => { e.guideVolume = +guide.value / 100;
      const v = box.querySelector('[data-ensguidev]'); if(v) v.textContent = guide.value + '%';
      if(_ens.run && _ens.run.scoreId === x.id && !_ens.run.stopped) _ens.run.guide = e.guideVolume;
      const c = ensCtl(); if(c) c.applyMix(); ensGuidePaint(x); };
    guide.onchange = () => saveNow(); }
  $$('[data-enssolo]', box).forEach(b => b.onclick = () => {
    const v = b.dataset.enssolo, t = tl(), p = t.parts[0];
    e.partRoles[p.id] = v === 'listen' ? 'show_play' : 'mine';
    e.mineStaffOnly = v === '1' ? 1 : v === '2' ? 2 : null;
    ensMixChanged(x); again(); });
  const hands = box.querySelector('#scEnsHands');
  if(hands) hands.onchange = () => { e.mineStaffOnly = hands.value ? +hands.value : null; ensMixChanged(x); again(); };
  const fade = box.querySelector('[data-ensfade]');
  if(fade) fade.onchange = () => { e.guideFadeEnabled = fade.checked;
    if(fade.checked && e.guideVolume <= 0) e.guideVolume = Math.max(...e.guideFadeSteps);
    ensMixChanged(x); again(); };
  const cue = box.querySelector('[data-enscue]');
  if(cue) cue.onchange = () => { e.showCueStrip = cue.checked; saveNow(); ensembleCuePaint(x); };
  $$('[data-enshold]', box).forEach(b => b.onclick = () => {
    const v = b.dataset.enshold; e.fermataHold = v === 'wait' ? 'wait' : +v; saveNow();
    const c = ensCtl(); if(c) c.applyTempo(); scoreEnsemblePaint(x); });
  const tap = box.querySelector('[data-enstap]');
  if(tap) tap.onchange = () => { e.tapTempo = tap.checked; _ens.taps = []; saveNow(); };
  const tempo = box.querySelector('#scEnsTempo');
  if(tempo) tempo.onchange = () => { const v = +tempo.value;
    if(!(v >= 20 && v <= 300)){ tempo.value = e.defaultTempo || 80; return; }
    e.defaultTempo = Math.round(v); e.tempoAsked = true; saveNow();
    const c = ensCtl(); if(c){ c.paint(); if(c.player) c.player.set('bpm', c.bpm()); } };
}

/* ---------- a score with no tempo: asked once ---------- */
function ensTempoPrompt(x, ctl, fromQ){
  const e = x.ensembleSettings;
  e.tempoAsked = true; saveNow();
  const m = openModal(`<h2>No tempo marked</h2>
    <p class="muted">This score has no tempo marking. Set a tempo:</p>
    <label class="pd-q"><span class="k">♩ =</span>
      <input class="inp mono" type="number" id="ensTempoIn" min="20" max="300" value="${e.defaultTempo || 80}" autofocus></label>
    <p class="faint sm">Kept with the piece; the tempo slider still slows it down or speeds it up from there.</p>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" id="ensTempoGo">▶ Play</button></div>`,
    'narrow sc-modal');
  const go = () => { const v = +m.querySelector('#ensTempoIn').value;
    if(v >= 20 && v <= 300) e.defaultTempo = Math.round(v);
    saveNow(); m.remove(); ctl.paint(); scoreEnsemblePaint(x); ctl.play(fromQ); };
  m.querySelector('#ensTempoGo').onclick = go;
  m.querySelector('#ensTempoIn').onkeydown = ev => { if(ev.key === 'Enter'){ ev.preventDefault(); go(); } };
  return m;
}

/* ---------- the partner's cue strip ----------
   The Partner parts, small, above your own. The document offered two ways:
   engrave only the bars of the system being played and engrave again at
   every new system, or engrave the partner's whole part once as a single
   line and slide it along. Engraving again means reading the file again
   (the engraver fixes its bars when it reads — see renderScore), which on a
   concerto reduction is a pause at every line; so it is engraved once, on
   one long staff line, and scrolled so the bar being played sits a third of
   the way in, with its own lit bar and playhead. */
let _cue = {osmd: null, key: '', inner: null, geo: null, lastK: -1};
/* Whether the strip is wanted where you are: in the room, the tick in the
   play-along panel; reading, the button on the reading strip, which starts
   out agreeing with the tick and remembers its own answer once pressed. */
function ensCueWanted(x){
  const e = x.ensembleSettings || ensembleDefaults(x);
  return scoreUi().reading && e.readCue != null ? e.readCue : e.showCueStrip;
}
/* the parts heard and not on the page: the partner */
function ensCuePartners(x, tl){
  return ensembleRoles(x, tl).map((r, i) => r === 'partner' ? i : -1).filter(i => i >= 0);
}
function ensCueReadPaint(x, partners){
  const b = document.getElementById('scCueRead'); if(!b) return;
  const want = ensCueWanted(x);
  b.classList.toggle('on', !!(want && partners.length));
  b.setAttribute('aria-pressed', want && partners.length ? 'true' : 'false');
  b.title = partners.length
    ? (want ? 'hide the partner cue along the bottom' : 'show the partner, small, along the bottom — the bar being played lit')
    : 'no partner yet: take a part off the page (its name, here) and it plays as your partner, cued along the bottom';
}
async function ensembleCuePaint(x){
  const wrap = document.getElementById('scCue'); if(!wrap) return;
  const e = x.ensembleSettings, tl = ensTimeline(x), ui = scoreUi();
  const partners = ensCuePartners(x, tl);
  ensCueReadPaint(x, partners);
  const on = !!(ensCueWanted(x) && tl && tl.parts.length > 1 && partners.length);
  wrap.hidden = !on;
  if(!on) return;
  const label = wrap.querySelector('[data-cuename]');
  if(label) label.textContent = partners.map(i => tl.parts[i].name).join(' · ');
  const tog = wrap.querySelector('#scCueTog');
  if(tog){ tog.textContent = ui.cueShut ? '▸' : '▾'; tog.onclick = () => { ui.cueShut = !ui.cueShut; wrap.classList.toggle('shut', ui.cueShut); tog.textContent = ui.cueShut ? '▸' : '▾'; }; }
  /* folding is the room's; reading, the button on the strip is the switch */
  wrap.classList.toggle('shut', !!ui.cueShut && !ui.reading);
  const inner = wrap.querySelector('.sc-cue-in');
  let xml = '';
  try { xml = scoreXmlFor(x); } catch(err){ return; }
  const key = `${x.id}|${partners.join(',')}|${x.transpose}|${xml.length}`;
  if(_cue.key === key && _cue.osmd && _cue.inner === inner && inner.querySelector('svg')) return;
  _cue = {osmd: null, key, inner, geo: null, lastK: -1};
  inner.innerHTML = '<span class="mono faint sc-cue-wait">engraving the partner…</span>';
  try {
    const lib = await osmdBoot();
    if(_cue.key !== key) return;
    inner.innerHTML = '';
    const osmd = new lib.OpenSheetMusicDisplay(inner, {autoResize: false, backend: 'svg', drawTitle: false,
      drawComposer: false, drawCredits: false, drawPartNames: false, drawMeasureNumbers: true,
      measureNumberInterval: 1, renderSingleHorizontalStaffline: true, drawingParameters: 'compact'});
    try { (osmd.EngravingRules || osmd.rules).FillEmptyMeasuresWithWholeRest = 2; } catch(err){}
    await osmd.load(xml);
    if(_cue.key !== key){ try { osmd.clear(); } catch(err){} return; }
    (osmd.Sheet.Instruments || []).forEach((inst, i) => { inst.Visible = partners.includes(i); });
    osmd.zoom = 0.55;
    osmd.render();
    _cue.osmd = osmd;
  } catch(err){
    console.warn('the cue strip could not be drawn', err);
    inner.innerHTML = '<span class="mono faint sc-cue-wait">the partner could not be drawn small</span>';
  }
}
/* where the music is, in the strip too */
function ensembleCueFollow(pm, q){
  const c = _cue;
  if(!c.osmd || !c.inner || !c.inner.isConnected) return;
  const wrap = c.inner.closest('.sc-cue');
  if(!wrap || wrap.hidden || wrap.classList.contains('shut')) return;
  if(!c.geo) c.geo = plxGeometry(c.osmd, c.inner, c.inner);
  const g = c.geo.get(pm.k);
  let hl = c.inner.querySelector(':scope > .plx-hl');
  if(!g){ if(hl) hl.hidden = true; return; }
  if(!hl){ hl = document.createElement('div'); hl.className = 'plx-hl'; hl.innerHTML = '<i class="plx-head"></i>'; c.inner.appendChild(hl); }
  hl.hidden = false;
  hl.style.left = g.x + 'px'; hl.style.top = (g.y - 4) + 'px'; hl.style.width = g.w + 'px'; hl.style.height = (g.h + 8) + 'px';
  const head = hl.firstElementChild;
  if(head) head.style.left = Math.max(0, Math.min(g.w - 2, (q - pm.q0) / Math.max(0.01, pm.len) * g.w)) + 'px';
  if(c.lastK !== pm.k){
    c.lastK = pm.k;
    c.inner.scrollTo({left: Math.max(0, g.x - c.inner.clientWidth / 3), behavior: 'smooth'});
  }
}

/* ---------- the room's hooks into its play bar ---------- */
function scoreEnsembleCfg(x){
  ensembleDefaults(x);
  return {
    defaultBpm: () => x.ensembleSettings.defaultTempo || 80,
    mix: t => ensembleMix(x, t),
    overrides: t => ensembleOverrides(x, t),
    fermata: () => x.ensembleSettings.fermataHold,
    gates: t => ensembleGates(x, t),
    beforePlay: (ctl, fromQ) => {
      const t = ctl.timeline;
      if(t && t.tempos[0].assumed && !x.ensembleSettings.tempoAsked){ ensTempoPrompt(x, ctl, fromQ); return false; }
      ensRunBegin(x, ctl);
      return true;
    },
    onStart: () => ensGuidePaint(x),
    onLoop: ctl => ensembleOnLoop(x, ctl),
    onStop: ctl => ensembleOnStop(x, ctl),
    onGate: (q, ctl) => ensembleOnGate(x, q, ctl),
    onPosition: (pm, q, ctl) => {
      if(_ens.want && ctl.player && ctl.player.waiting == null) ensWaitClear();
      ensembleCueFollow(pm, q);
      if(typeof anOnPlayPosition === 'function') anOnPlayPosition(pm, q);
    }
  };
}

/* ---------- the log ----------
   What the last run says, for the sitting being logged: with the partner or
   not, how fast (as a share of the score's tempo and as a ♩), how loud the
   guide was at the end, and how many times round. Offered only for a run
   in the last three hours; anything older is a different sitting. */
function ensLogPrefill(x){
  const l = _ens.last;
  const fresh = l && l.scoreId === x.id && Date.now() - l.at < 3 * 3600 * 1000;
  const r = _ens.run;
  const live = r && r.scoreId === x.id && !r.stopped ? (() => { const c = ensCtl(), tl = ensTimeline(x);
    return c ? {withPartner: tl ? ensWithPartner(x, tl) : false, mine: tl ? ensHasMine(x, tl) : false,
      pct: Math.round(c.tempoPct()), bpm: c.bpm(), guide: r.guide, loops: r.loops} : null; })() : null;
  return live || (fresh ? l : null);
}
function ensLogFieldsHTML(x){
  const p = ensLogPrefill(x);
  const guide = p && p.mine ? Math.round(p.guide * 100) : '';
  return `<div class="sc-log-ens" style="margin-top:10px">
      <label class="sc-ens-chk"><input type="checkbox" id="logPartner" ${p && p.withPartner ? 'checked' : ''}> practised with the partner playing</label>
      <div class="row" style="gap:10px;margin-top:6px">
        <label class="pd-q" style="flex:1"><span class="k">tempo reached, % of the score's</span>
          <input class="inp mono" type="number" id="logPct" min="5" max="400" value="${p ? p.pct : ''}" placeholder="—"></label>
        <label class="pd-q" style="flex:1"><span class="k">guide at the end, %</span>
          <input class="inp mono" type="number" id="logGuide" min="0" max="50" value="${guide}" placeholder="—"
            title="0 is playing it alone with the partner"></label>
        <label class="pd-q" style="flex:1"><span class="k">loops</span>
          <input class="inp mono" type="number" id="logLoops" min="0" max="999" value="${p ? p.loops : ''}" placeholder="—"></label>
      </div>
    </div>`;
}
function ensLogFieldsRead(m){
  const num = id => { const el = m.querySelector(id); if(!el || el.value === '') return null; const v = +el.value; return isFinite(v) ? v : null; };
  const g = num('#logGuide');
  return {withPartnerPlayback: !!(m.querySelector('#logPartner') || {}).checked, tempoPercent: num('#logPct'),
    finalGuideLevel: g == null ? null : clamp(g, 0, 50) / 100, loopsCompleted: num('#logLoops')};
}
const ensGuideWords = g => g == null ? '' : g <= 0 ? 'guide 0% — played solo with the partner' : `guide ${Math.round(g * 100)}%`;

/* ---------- a section's own tempo, beside the section ----------
   "Tempo: score / custom". Custom holds while the music is in the section
   and nowhere else; an end tempo ramps it across the section. A rit. or an
   accel. written in the section is pointed out, since that is when an end
   tempo is what the page is asking for. */
function scoreSecTempoHTML(x, s){
  const e = x.ensembleSettings; if(!e) return '';
  const o = e.sectionTempoOverrides[s.id];
  const tl = ensTimeline(x);
  if(!tl) return '';
  const word = ensSectionWord(tl, s);
  const score = ensScoreTempoAt(x, tl, s.startMeasure);
  return `<div class="sc-sec-tempo mono">
    <span class="faint">tempo</span>
    <button class="tbtn${o ? '' : ' on'}" data-sectscore="${esc(s.id)}" title="the score's own tempo here">score ♩=${score}</button>
    <button class="tbtn${o ? ' on' : ''}" data-sectcustom="${esc(s.id)}"
      title="a tempo of its own while the music is in this section — with an end tempo it slows or quickens across it">custom</button>
    ${o ? `<label>♩ <input class="inp sm mono" type="number" min="10" max="400" data-sectstart="${esc(s.id)}" value="${o.startBpm}" aria-label="the section's tempo"></label>
      <label title="the tempo it arrives at, for a rit. or an accel. across the section — empty holds it steady">→
        <input class="inp sm mono" type="number" min="10" max="400" data-sectend="${esc(s.id)}" value="${o.endBpm || ''}" placeholder="steady" aria-label="the tempo at the section's end"></label>` : ''}
    ${word ? `<span class="faint">${word === 'rit' ? 'rit.' : 'accel.'} marked${o && !o.endBpm ? ' — an end tempo ramps it' : ''}</span>` : ''}
  </div>`;
}
function bindScoreSecTempo(root, x){
  const e = x.ensembleSettings; if(!e) return;
  const applied = () => { saveNow(); const c = ensCtl(); if(c) c.applyTempo(); };
  $$('[data-sectscore]', root).forEach(b => b.onclick = () => {
    delete e.sectionTempoOverrides[b.dataset.sectscore]; applied(); scoreSidePaint(x); });
  $$('[data-sectcustom]', root).forEach(b => b.onclick = () => {
    const s = scoreSection(x, b.dataset.sectcustom); if(!s) return;
    if(!e.sectionTempoOverrides[s.id]) e.sectionTempoOverrides[s.id] = {startBpm: ensScoreTempoAt(x, ensTimeline(x), s.startMeasure), endBpm: null};
    applied(); scoreSidePaint(x); });
  $$('[data-sectstart]', root).forEach(inp => inp.onchange = () => {
    const o = e.sectionTempoOverrides[inp.dataset.sectstart]; const v = +inp.value;
    if(!o || !(v >= 10 && v <= 400)){ if(o) inp.value = o.startBpm; return; }
    o.startBpm = Math.round(v); applied(); });
  $$('[data-sectend]', root).forEach(inp => inp.onchange = () => {
    const o = e.sectionTempoOverrides[inp.dataset.sectend]; if(!o) return;
    const v = +inp.value;
    o.endBpm = inp.value === '' ? null : (v >= 10 && v <= 400 ? Math.round(v) : o.endBpm);
    inp.value = o.endBpm || ''; applied(); scoreSidePaint(x); });
}
