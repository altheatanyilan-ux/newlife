/* ============================================================
   THE BAND BEHIND EVERY EXERCISE — the Jazz Studio's play-along.

   A rootless voicing is only half a chord until somebody plays the root
   under it, and a ii-V-I practised against silence is practised against
   nothing. So every exercise with notation gets a rhythm section: a bass
   player, a drummer and, when you are not the pianist, a pianist comping —
   in any key, at any tempo, round and round, or moving to the next key
   without stopping.

   THE CHORDS are the exercise's own, read out of the MusicXML its generator
   writes (the symbols it prints over each bar). A scale, a mode or an
   interval drill prints none, and gets a vamp on the key: the tonic chord,
   minor or dominant or major as the exercise's name says.

   THE BAND is generated from the chords, never recorded:
     bass     roots · two-feel (root and fifth, sometimes the third or a
              step into the next root) · walking (root on one, chord and
              scale tones, a half step into the next root on four), kept
              between E1 and G3 and moving by step where it can
     drums    swing (ride 1 2& 3 4&, hi-hat foot on 2 and 4, a feathered
              kick, now and then a snare on an off-beat) · ballad (brushes
              on every beat, hat on 2 and 4) · bossa (cross-stick, straight
              eighths on the hat) · straight eighths · off
     comping  off · Charleston (1, the and of 2) · reverse (the and of 1,
              3) · mixed, in Type A/B voicings from the book's own tables,
              led from each chord to the nearest shape of the next

   It is played by the same player as every score (19-score-play.js): one
   long timeline — your part, the bass (the sampled double bass), the kit
   and the comping as four parts — so swing, the count-in, the loop and
   each part's volume are the player's own. Swing loosens above ♩=220, as
   it does in a real band.

   KEYS. "This key", round the cycle of fourths, down in whole steps (Set A
   then Set B, the book's own drill), up in half steps, at random, or only
   the keys not yet yours. Each key's notation is written once when the
   band starts, and the score on the page turns to the next key a bar
   before the band gets there, under a large "NEXT: B♭".

   READING. Full notation → chord symbols → the key name → nothing: the
   page can be taken away a step at a time, which is the whole point of
   playing along. The furthest you have got is kept on the exercise.
   ============================================================ */

const JZB_BASS = [['roots', 'Roots'], ['two_feel', 'Two-feel'], ['walking', 'Walking']];
const JZB_DRUMS = [['swing', 'Swing'], ['ballad', 'Ballad (brushes)'], ['bossa', 'Bossa'], ['straight', 'Straight 8ths'], ['off', 'Off']];
const JZB_COMP = [['off', 'Off'], ['charleston', 'Charleston'], ['reverse_charleston', 'Reverse Charleston'], ['mixed', 'Mixed']];
const JZB_KEYS = [['this', 'This key only'], ['fourths', 'Cycle of 4ths'], ['whole_steps_AB', 'Down in whole steps, Set A then B'],
  ['half_steps', 'Up in half steps'], ['random', 'Random'], ['unmastered', 'Only my unmastered keys']];
const JZB_SEE = [['notation', '📄', 'notation'], ['symbols', '🔤', 'symbols'], ['key_only', '🔑', 'key only'], ['none', '🌑', 'none']];
const JZB_SEE_SAY = {notation: 'full notation', symbols: 'chord symbols only', key_only: 'the key name only', none: 'nothing'};
const JZB_HEAR = [[0, 'Off'], [0.1, '10%'], [0.2, '20%'], [0.3, '30%'], [0.5, '50%']];
const JZB_CHORUSES = [1, 2, 4, 8, 12, 'infinite'];
const JZB_FOURTHS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'];
const JZB_SET_AB = ['C', 'Bb', 'Ab', 'Gb', 'E', 'D', 'Db', 'B', 'A', 'G', 'F', 'Eb'];
const JZB_PC = {C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11};
const JZB_RANGE = [28, 55];                 /* E1 – G3, where a bass line lives */

/* a repeatable dice: the same key and chorus make the same bass line */
function jzbRand(seed){
  let a = 0; for(const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- the settings, per exercise ---------- */
function jzbDefaults(id, ex){
  ex = ex || jazzExercise(id) || {};
  const name = `${ex.name || ''} ${ex.gen || ''} ${id}`.toLowerCase();
  /* the Voice Track's own ids (V1.3, V2.4…), not the v3 curriculum's (v3-…) */
  const vocal = /^V\d/.test(id) || /vocal|scat|sing/.test(name);
  const improv = /^imp/i.test(id) || ex.type === 'IMPROV' || /lick|improvis|scale|pattern|arpeggio|bebop|pentatonic|mode|line|enclosure/.test(name);
  const drums = /bossa|latin|partido/.test(name) ? 'bossa' : /ballad/.test(name) ? 'ballad'
    : /rock|funk|straight|even/.test(name) ? 'straight' : 'swing';
  const bass = drums === 'bossa' ? 'two_feel' : /in two|two-feel|bass line/.test(name) ? 'two_feel'
    : (/blues|walk|rhythm changes|coltrane|turnaround/.test(name) || vocal || improv) ? 'walking' : 'two_feel';
  return {bpm: 100, swingRatio: 0.62, bassStyle: bass, drumStyle: drums,
    /* the pianist is you in a voicing exercise; in a lick, a scale or a
       vocal pattern somebody else can comp */
    comping: vocal || improv ? 'charleston' : 'off',
    hearMyPart: vocal ? 0.2 : 0, hearFade: false, keyCycle: 'this', visibility: 'notation', hideAfterFirst: false,
    choruses: 'infinite', countIn: 1};
}
function jzbSettings(id){
  const base = jzbDefaults(id);
  const r = jazzRecord(id);
  const s = Object.assign({}, base, r.playAlongSettings || {});
  s.bpm = clamp(Math.round(+s.bpm || base.bpm), 30, 360);
  s.swingRatio = clamp(+s.swingRatio || 0.62, 0.5, 0.7);
  if(!JZB_BASS.some(v => v[0] === s.bassStyle)) s.bassStyle = base.bassStyle;
  if(!JZB_DRUMS.some(v => v[0] === s.drumStyle)) s.drumStyle = base.drumStyle;
  if(!JZB_COMP.some(v => v[0] === s.comping)) s.comping = base.comping;
  s.hearMyPart = clamp(+s.hearMyPart || 0, 0, 0.5);
  if(!JZB_KEYS.some(v => v[0] === s.keyCycle)) s.keyCycle = 'this';
  if(!JZB_SEE.some(v => v[0] === s.visibility)) s.visibility = 'notation';
  if(!JZB_CHORUSES.includes(s.choruses)) s.choruses = 'infinite';
  s.countIn = clamp(+s.countIn || 0, 0, 2);
  s.hearFade = !!s.hearFade; s.hideAfterFirst = !!s.hideAfterFirst;
  return s;
}
function jzbSave(id, patch){
  const r = jazzRecord(id, true);
  r.playAlongSettings = Object.assign({}, jzbSettings(id), patch || {});
  saveNow();
  return r.playAlongSettings;
}
/* swing loosens as it gets fast: past ♩=220 the long eighth shortens, until
   at ♩=380 or so it is nearly even — which is how it is played */
const jzbSwing = (ratio, bpm) => bpm <= 220 ? ratio : 0.5 + (ratio - 0.5) * Math.max(0.3, 1 - (bpm - 220) / 230);

/* ---------- the order of the keys ---------- */
function jzbKeyOrder(mode, start, id){
  const from = (list, k) => { const i = Math.max(0, list.indexOf(k)); return list.slice(i).concat(list.slice(0, i)); };
  const key = JZB_PC[start] != null ? start : 'C';
  if(mode === 'fourths') return from(JZB_FOURTHS, key);
  if(mode === 'whole_steps_AB') return from(JZB_SET_AB, key);
  if(mode === 'half_steps') return from(JAZZ_KEY_NAMES, key);
  if(mode === 'random'){ const list = JAZZ_KEY_NAMES.slice();
    for(let i = list.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list; }
  if(mode === 'unmastered'){
    const r = jazzRecord(id);
    const left = from(JZB_FOURTHS, key).filter(k => !r.keys[k]);
    return left.length ? left : [key];
  }
  return [key];
}

/* ---------- the chords ---------- */
/* each bar of the exercise, with the chords that change in it (in quarter
   notes from the bar line); null when it prints none */
function jzbChart(tl){
  const bars = tl.perf.map(pm => ({i: pm.i, k: pm.k, number: pm.number, q0: pm.q0, len: pm.len,
    beats: pm.beats, beatType: pm.beatType, changes: []}));
  const seen = new Set();
  let first = null;
  tl.events.forEach(e => {
    if(!e.chord || !e.sym || !bars[e.perf]) return;
    const k = `${e.perf}|${Math.round(e.inBar * 1000)}`;
    if(seen.has(k)) return;
    seen.add(k); if(!first) first = e.sym;
    bars[e.perf].changes.push({at: e.inBar, sym: e.sym});
  });
  if(!first) return null;
  let last = first;
  bars.forEach(b => {
    b.changes.sort((a, c) => a.at - c.at);
    if(!b.changes.length || b.changes[0].at > 1e-6) b.changes.unshift({at: 0, sym: last});
    last = b.changes[b.changes.length - 1].sym;
  });
  return bars;
}
/* what a page with no chords is played over: its key, minor or dominant or
   major as the name says */
function jzbVampSymbol(ex, key){
  const n = `${(ex && ex.name) || ''}`.toLowerCase();
  const q = /half-?dim|locrian|ø/.test(n) ? 'm7b5' : /dim7|diminished 7/.test(n) ? 'dim7'
    : /minor|dorian|aeolian|phrygian|min7|\bm7/.test(n) ? 'm7'
    : /dom|mixolyd|altered|blues|bebop|whole-?tone|diminished|lick 5|lick 6|sweet/.test(n) ? '7' : 'maj7';
  return key + q;
}
function jzbVampChart(tl, sym){
  return tl.perf.map(pm => ({i: pm.i, k: pm.k, number: pm.number, q0: pm.q0, len: pm.len,
    beats: pm.beats, beatType: pm.beatType, changes: [{at: 0, sym}]}));
}
/* every chord as a span of quarter notes */
function jzbSpans(bars){
  const out = [];
  bars.forEach(b => b.changes.forEach((c, j) => {
    const end = j + 1 < b.changes.length ? b.changes[j + 1].at : b.len;
    if(end - c.at > 1e-6) out.push({q: b.q0 + c.at, d: end - c.at, sym: c.sym, bar: b});
  }));
  return out;
}
const jzbPcOf = spec => spec.bassPc != null ? spec.bassPc : spec.pc;
/* the chord's scale, for the notes between the chord tones of a walking line */
function jzbScale(spec){
  const t = spec.tones.map(x => x % 12);
  const has = x => t.includes(x);
  if(has(3) && has(6) && has(10)) return [0, 1, 3, 5, 6, 8, 10];         /* locrian */
  if(has(3) && has(6) && has(9)) return [0, 2, 3, 5, 6, 8, 9, 11];       /* diminished */
  if(has(3)) return [0, 2, 3, 5, 7, 9, 10];                              /* dorian */
  if(has(4) && has(10)) return [0, 2, 4, 5, 7, 9, 10];                   /* mixolydian */
  return [0, 2, 4, 5, 7, 9, 11];                                         /* major */
}
/* the nearest note of a pitch class to where the line is, inside the range */
function jzbPlace(pc, near){
  let best = null;
  for(let m = JZB_RANGE[0]; m <= JZB_RANGE[1]; m++){
    if(((m - pc) % 12 + 12) % 12) continue;
    if(best == null || Math.abs(m - near) < Math.abs(best - near)) best = m;
  }
  return best;
}

/* ---------- the bass ---------- */
function jzbBass(bars, style, rnd){
  const spans = jzbSpans(bars), out = [];
  let prev = 38;
  const push = (q, d, midi, vel) => { out.push({q, d, midi, vel: vel || 0.82}); prev = midi; };
  spans.forEach((s, i) => {
    const spec = jazzChordSpec(s.sym); if(!spec) return;
    const nextS = spans[i + 1] || spans[0];
    const nspec = jazzChordSpec(nextS.sym) || spec;
    const root = jzbPcOf(spec), nroot = jzbPcOf(nspec);
    const r = jzbPlace(root, prev);
    if(style === 'roots'){ push(s.q, s.d * 0.96, r); return; }
    if(style === 'two_feel'){
      for(let b = 0; b < s.d - 1e-6; b += 2){
        const d = Math.min(2, s.d - b) * 0.95;
        if(b === 0){ push(s.q, d, r); continue; }
        /* the second half of the chord: mostly the fifth; sometimes the
           third, or a half step into the next root */
        const x = rnd(), last = b + 2 >= s.d - 1e-6;
        let pc;
        if(x < 0.6 || !last) pc = (root + (spec.tones.includes(6) && !spec.tones.includes(7) ? 6 : 7)) % 12;
        else if(x < 0.8) pc = (root + (spec.tones.includes(3) ? 3 : 4)) % 12;
        else pc = (nroot + (rnd() < 0.5 ? 1 : 11)) % 12;
        push(s.q + b, d, jzbPlace(pc, prev));
      }
      return;
    }
    /* walking: one a beat */
    const n = Math.max(1, Math.round(s.d));
    const target = jzbPlace(nroot, r);
    const scale = jzbScale(spec).map(x => (root + x) % 12);
    const tones = spec.tones.map(x => (root + x) % 12);
    for(let b = 0; b < n; b++){
      const q = s.q + b;
      if(b === 0){ push(q, 0.92, r); continue; }
      if(b === n - 1){
        /* into the next root: a half step above or below it, or a step of the scale */
        const cands = [target + 1, target - 1, ...[-2, 2].map(v => target + v).filter(m => scale.includes(((m % 12) + 12) % 12))]
          .filter(m => m >= JZB_RANGE[0] && m <= JZB_RANGE[1] && m !== prev);
        const pick = cands.length ? cands.sort((a, c) => Math.abs(a - prev) - Math.abs(c - prev))[rnd() < 0.7 ? 0 : Math.min(1, cands.length - 1)] : target + 1;
        push(q, 0.92, pick);
        continue;
      }
      /* between: toward the target, by step where it can, chord tones first */
      const goal = prev + (target - prev) / (n - b);
      let best = null, score = Infinity;
      for(let m = Math.max(JZB_RANGE[0], prev - 7); m <= Math.min(JZB_RANGE[1], prev + 7); m++){
        const pc = ((m % 12) + 12) % 12;
        if(m === prev || !scale.includes(pc)) continue;
        const sc = Math.abs(m - goal) + (tones.includes(pc) ? 0 : 0.8) + Math.abs(m - prev) * 0.15 + rnd() * 0.5;
        if(sc < score){ score = sc; best = m; }
      }
      push(q, 0.92, best == null ? r : best);
    }
  });
  return out;
}

/* ---------- the drums ---------- */
/* General MIDI: 36 kick, 37 cross-stick, 38 snare, 42 closed hat, 44 hat
   foot, 51 ride, 25 a brush swell (this kit's own) */
function jzbDrums(bars, style, rnd){
  const out = [], hit = (q, midi, vel, d) => out.push({q, midi, vel, d: d || 0.25});
  if(style === 'off') return out;
  bars.forEach((b, bi) => {
    const beats = Math.max(1, Math.round(b.len));
    for(let i = 0; i < beats; i++){
      const q = b.q0 + i, two = i % 2 === 1;
      if(style === 'swing'){
        hit(q, 51, two ? 0.62 : 0.55);
        if(two) hit(q + 0.5, 51, 0.42);
        if(two) hit(q, 44, 0.5);
        hit(q, 36, 0.14);
      } else if(style === 'ballad'){
        hit(q, 25, two ? 0.5 : 0.42, 0.9);
        if(two) hit(q, 44, 0.42);
      } else if(style === 'straight'){
        hit(q, 42, 0.5); hit(q + 0.5, 42, 0.32);
        if(two) hit(q, 38, 0.45); else hit(q, 36, 0.6);
      } else if(style === 'bossa'){
        hit(q, 42, 0.38); hit(q + 0.5, 42, 0.24);
        if(i % 2 === 0) hit(q, 36, 0.5); else hit(q + 0.5, 36, 0.3);
      }
    }
    /* the bossa's cross-stick, a two-bar figure */
    if(style === 'bossa') (bi % 2 === 0 ? [0, 1.5, 3] : [1, 2.5]).forEach(at => { if(at < b.len) hit(b.q0 + at, 37, 0.5); });
    /* now and then the drummer comps on the snare, softly, off the beat */
    if(style === 'swing' && rnd() < 0.18){ const at = Math.floor(rnd() * beats) + 0.5; if(at < b.len) hit(b.q0 + at, 38, 0.2); }
  });
  return out;
}

/* ---------- the comping ---------- */
const JZB_TYPE = {min: 'min7', dom: 'dom7', maj: 'maj7', hd: 'min7b5', dim: 'dim7', sus: 'dom7', aug: 'dom7', other: 'maj7'};
/* a Type A or Type B voicing of the chord, whichever shape is nearest the
   last one — the book's tables, the book's register */
function jzbVoicing(sym, prev){
  const c = typeof jazzParseChord === 'function' ? jazzParseChord(sym) : null;
  if(!c || c.pc == null) return [];
  const type = JZB_TYPE[c.quality] || 'maj7';
  if(typeof JZG === 'undefined' || !JZG || !JZG.VOICING_TYPE_A){ const spec = jazzChordSpec(sym); return spec ? jazzCompVoicing(spec, prev ? prev[0] + 4 : 60) : []; }
  const lo = (JZG.REGISTER_VOICING || [47, 60])[0], hi = (JZG.REGISTER_VOICING || [47, 60])[1];
  const cands = [];
  ['A', 'B'].forEach(t => { const table = t === 'B' ? JZG.VOICING_TYPE_B : JZG.VOICING_TYPE_A;
    if(!table[type]) return;
    for(let root = 24 + c.pc; root <= 84; root += 12){
      const v = table[type].map(i => root + i).sort((a, b) => a - b);
      if(v[0] >= lo && v[0] <= hi) cands.push({t, v});
    } });
  if(!cands.length) return [];
  if(!prev || !prev.length) return cands.find(x => x.t === 'A').v || cands[0].v;
  const cost = v => v.reduce((a, m, i) => a + Math.abs(m - (prev[i] != null ? prev[i] : prev[prev.length - 1])), 0);
  return cands.sort((a, b) => cost(a.v) - cost(b.v))[0].v;
}
function jzbComp(bars, pattern, rnd){
  const out = [];
  if(pattern === 'off') return out;
  let prev = null;
  bars.forEach(b => {
    const pat = pattern === 'mixed' ? (rnd() < 0.5 ? 'charleston' : 'reverse_charleston') : pattern;
    const hits = pat === 'reverse_charleston' ? [[0.5, 0.45], [2, 0.9]] : [[0, 0.9], [1.5, 0.45]];
    hits.forEach(([at, d]) => {
      if(at >= b.len - 1e-6) return;
      const ch = b.changes.filter(c => c.at <= at + 1e-6).pop() || b.changes[0];
      const v = jzbVoicing(ch.sym, prev);
      if(!v.length) return;
      prev = v;
      v.forEach(m => out.push({q: b.q0 + at, d, midi: m, vel: 0.36}));
    });
  });
  return out;
}

/* ---------- one exercise, in one key, as notation ----------
   Written once per key when the band starts, so turning to the next key is
   instant. A page of several examples plays its first. */
const _jzbXml = {};
function jzbXml(id, key, interval){
  const k = `${id}|${key}|${interval || ''}|${jazzEdited(id) ? 'e' : ''}`;
  if(_jzbXml[k]) return _jzbXml[k];
  let x = null;
  try { x = jazzScoreFor(id, jazzExercise(id), key, {interval}); } catch(e){ x = null; }
  const xml = x && typeof x === 'object' && Array.isArray(x.documents) ? (x.documents[0] || {}).mxl : x;
  if(typeof xml === 'string' && xml) _jzbXml[k] = xml;
  return _jzbXml[k] || null;
}

/* ---------- the whole performance as one timeline ----------
   plan: {id, keys: [one a chorus], settings, interval, seed}. Four parts —
   0 your part (the exercise), 1 the bass, 2 the kit, 3 the comping — and
   each chorus's bars carry their chorus and key, so the page knows where
   the band is. */
function jazzBackingTimeline(plan){
  const s = plan.settings, ex = jazzExercise(plan.id) || {};
  const parts = [{id: 'me', name: 'Your part', inst: 'piano', staves: 2},
    {id: 'bass', name: 'Bass', inst: 'acoustic_bass', staves: 1},
    {id: 'drums', name: 'Drums', inst: 'drums', staves: 1},
    {id: 'comp', name: 'Comping', inst: 'piano', staves: 1}];
  const perf = [], events = [], choruses = [];
  let Q = 0;
  plan.keys.forEach((key, ci) => {
    const xml = plan.xmlFor ? plan.xmlFor(key) : jzbXml(plan.id, key, plan.interval);
    if(!xml) return;
    let tl; try { tl = musicXmlTimeline(xml); } catch(e){ return; }
    if(!tl.perf.length) return;
    const chart = jzbChart(tl);
    const bars = chart || jzbVampChart(tl, jzbVampSymbol(ex, key));
    const rnd = jzbRand(`${plan.seed || plan.id}|${key}|${ci}`);
    const base = perf.length;
    const shift = b => Object.assign({}, b, {q0: Q + b.q0, i: base + b.i, changes: b.changes});
    const sb = bars.map(shift);
    sb.forEach((b, j) => perf.push({i: base + j, k: b.k, number: b.number, q0: b.q0, len: b.len,
      beats: b.beats, beatType: b.beatType, chorus: ci, key, changes: b.changes}));
    const barAt = q => { let at = sb[0]; for(const b of sb){ if(b.q0 <= q + 1e-9) at = b; else break; } return at; };
    const add = (list, part, extra) => list.forEach(n => { const b = barAt(n.q);
      events.push(Object.assign({q: n.q, d: n.d || 0.25, midi: n.midi, vel: n.vel, part, staff: 1, voice: String(part),
        inBar: n.q - b.q0, perf: b.i}, extra || {})); });
    /* your part: the exercise as written */
    tl.events.forEach(e => { if(e.chord) return;
      events.push(Object.assign({}, e, {q: Q + e.q, part: 0, perf: base + e.perf})); });
    add(jzbBass(sb, s.bassStyle, rnd), 1);
    add(jzbDrums(sb, s.drumStyle, rnd), 2, {perc: true, kit: true});
    add(jzbComp(sb, s.comping, rnd), 3);
    choruses.push({key, q0: Q, q1: Q + tl.length, bars: sb.length, chart: !!chart, xml});
    Q += tl.length;
  });
  events.sort((a, b) => a.q - b.q || a.part - b.part || a.midi - b.midi);
  return {parts, measures: [], perf, events, tempos: [{q: 0, bpm: s.bpm}], length: Q, choruses,
    chords: false, playable: events.length > 0, backing: true};
}

/* ---------- playing it ---------- */
const _jzb = {run: null, last: null};
const JZB_FADE = [0.5, 0.3, 0.2, 0.1, 0.05, 0];
const jzbLevelIdx = v => Math.max(0, JZB_SEE.findIndex(x => x[0] === v));
const jzbStyleSay = s => [`${(JZB_BASS.find(v => v[0] === s.bassStyle) || [])[1] || ''} bass`.toLowerCase(),
  `${(JZB_DRUMS.find(v => v[0] === s.drumStyle) || [])[1] || ''} drums`.toLowerCase(),
  s.comping === 'off' ? 'no comping' : `${(JZB_COMP.find(v => v[0] === s.comping) || [])[1] || ''} comping`.toLowerCase()].join(' · ');
/* what the page shows in a chorus: the chosen level, except the first key
   when it is asked to be read from the notation */
const jzbLevelFor = (r, overall) => r.settings.hideAfterFirst && overall === 0 ? 'notation' : r.settings.visibility;

async function jzbStart(root, id){
  jzbStop('restart');
  const ui = jazzUi(), s = jzbSettings(id);
  const order = jzbKeyOrder(s.keyCycle, ui.key, id);
  const n = s.choruses === 'infinite' ? order.length : s.choruses;
  const plan = {id, settings: s, interval: ui.interval, keys: [...Array(n)].map((_, i) => order[i % order.length])};
  const go = root.querySelector('#jzbGo');
  const tl = jazzBackingTimeline(plan);
  if(!tl.playable || !tl.choruses.length){ toast('There is nothing here for a band to play under.'); return false; }
  if(go){ go.textContent = 'Loading sounds…'; go.classList.add('loading'); }
  try { if(typeof instrumentsLoad === 'function') await instrumentsLoad(['piano', 'acoustic_bass']); } catch(e){}
  if(go) go.classList.remove('loading');
  if(!root.isConnected) return false;
  if(typeof scorePlayStopAll === 'function') scorePlayStopAll();
  const straight = s.drumStyle === 'bossa' || s.drumStyle === 'straight';
  const r = {id, root, tl, settings: s, keys: plan.keys, guide: s.hearMyPart, reached: new Set(), full: 0, best: -1,
    lastChorus: -1, overall: -1, shownKey: ui.key, started: Date.now(), raf: 0, osmd: null, geo: null};
  const player = scorePlayer(tl, {bpm: s.bpm, swing: straight ? 0 : jzbSwing(s.swingRatio, s.bpm),
    loop: s.choruses === 'infinite', countIn: s.countIn, click: false, accent: true, volume: 0.9,
    volumes: jzbVolumes(r), muted: new Set(r.guide > 0 ? [] : ['p:0']),
    onEnd: () => { if(_jzb.run === r) jzbStop('ended'); }});
  r.player = player;
  if(!player.start()){ toast('This browser cannot make sound.'); return false; }
  _jzb.run = r;
  if(go){ go.textContent = '■ Stop the band'; go.classList.add('on'); }
  const show = root.querySelector('#jzbShow'); if(show) show.hidden = false;
  jzbCountDown(r);
  r.raf = requestAnimationFrame(jzbFrame);
  return true;
}
const jzbVolumes = r => ({0: r.guide || 0, 1: 1, 2: 0.9, 3: 0.75});
function jzbCountDown(r){
  const ci = r.player.countIn, el = r.root.querySelector('#jzbWhere');
  if(!ci || !el) return;
  const now = r.player.audioTime;
  for(let i = 0; i < ci.n; i++) setTimeout(() => { if(_jzb.run === r && el.isConnected) el.textContent = `count-in · ${ci.n - i}`; },
    Math.max(0, (ci.t0 + i * ci.beat - now) * 1000));
}
/* the score on the page, in the key the band is in (or about to be in) */
function jzbShowKey(r, key){
  r.shownKey = key; r.osmd = null; r.geo = null;
  const box = r.root.querySelector('#jzScore');
  const xml = (r.tl.choruses.find(c => c.key === key) || {}).xml;
  if(!box || !xml) return;
  const want = key;
  /* the engraver adds to its box rather than replacing what is there */
  box.innerHTML = ''; box._jzOsmd = null;
  Promise.resolve(jazzEngrave(box, xml)).then(o => { if(_jzb.run === r && r.shownKey === want){ r.osmd = o; r.geo = null; } });
}
function jzbFrame(){
  const r = _jzb.run; if(!r) return;
  r.raf = 0;
  if(!r.root.isConnected){ jzbStop('left'); return; }
  const p = r.player;
  if(!p.running) return;
  const q = p.position(), pm = p.perfAt(q), tl = r.tl;
  if(!pm){ r.raf = requestAnimationFrame(jzbFrame); return; }
  const ch = tl.choruses[pm.chorus];
  /* a new chorus: the one before it is done, the key is reached, the guide fades */
  if(pm.chorus !== r.lastChorus){
    if(r.lastChorus >= 0){
      r.full++;
      r.best = Math.max(r.best, jzbLevelIdx(jzbLevelFor(r, r.overall)));
      if(r.settings.hearFade && r.guide > 0){
        r.guide = JZB_FADE.find(v => v < r.guide - 1e-6) || 0;
        p.set('volumes', jzbVolumes(r)); p.set('muted', new Set(r.guide > 0 ? [] : ['p:0']));
      }
    }
    r.lastChorus = pm.chorus; r.overall++;
    r.reached.add(ch.key);
  }
  const level = jzbLevelFor(r, r.overall);
  const loop = r.settings.choruses === 'infinite';
  const next = tl.choruses[pm.chorus + 1] || (loop ? tl.choruses[0] : null);
  const lastBar = pm.i === tl.perf.filter(v => v.chorus === pm.chorus).pop().i;
  const nextKey = next && next.key !== ch.key ? next.key : null;
  /* the page turns a bar before the band does */
  const wantKey = lastBar && nextKey ? nextKey : ch.key;
  const stageBox = r.root.querySelector('.jz-stage-box');
  const nextLevel = lastBar && next ? jzbLevelFor(r, r.overall + 1) : level;
  if(stageBox) stageBox.classList.toggle('jzb-hidden', (lastBar ? nextLevel : level) !== 'notation');
  if(wantKey !== r.shownKey && (lastBar ? nextLevel : level) === 'notation') jzbShowKey(r, wantKey);
  jzbPaint(r, pm, q, level, nextKey, lastBar, ch);
  r.raf = requestAnimationFrame(jzbFrame);
}
function jzbPaint(r, pm, q, level, nextKey, lastBar, ch){
  const $r = s => r.root.querySelector(s);
  const keyEl = $r('#jzbKey'), nextEl = $r('#jzbNext'), chordEl = $r('#jzbChord'), where = $r('#jzbWhere');
  const show = $r('#jzbShow');
  if(show){ show.dataset.level = level; }
  if(keyEl) keyEl.textContent = level === 'none' ? '' : jazzPretty(ch.key);
  if(nextEl){ nextEl.hidden = !(lastBar && nextKey); nextEl.textContent = nextKey ? `NEXT: ${jazzPretty(nextKey)}` : ''; }
  if(chordEl){
    const at = q - pm.q0;
    const now = (pm.changes || []).filter(c => c.at <= at + 1e-6).pop();
    chordEl.textContent = level === 'symbols' && now ? jazzPrettyChord(now.sym) : '';
  }
  const total = r.settings.choruses === 'infinite' ? '∞' : r.tl.choruses.length;
  const bars = r.tl.perf.filter(v => v.chorus === pm.chorus);
  if(where) where.textContent = `chorus ${r.overall + 1} of ${total} · bar ${bars.findIndex(v => v.i === pm.i) + 1} of ${bars.length}`;
  /* the bar being played, lit, when the page shows this key's notation */
  const box = $r('#jzScore');
  if(!box) return;
  let hl = box.querySelector(':scope > .jzb-hl');
  /* the engraving on the page: the band's own once it has turned a page,
     the page's own before that */
  if(!r.osmd && r.shownKey === ch.key && box._jzOsmd){ r.osmd = box._jzOsmd; r.geo = null; }
  const lit = level === 'notation' && r.osmd && r.shownKey === ch.key;
  if(!lit){ if(hl) hl.hidden = true; return; }
  if(!r.geo) r.geo = plxGeometry(r.osmd, box, box);
  const g = r.geo.get(pm.k);
  if(!g){ if(hl) hl.hidden = true; return; }
  if(!hl){ if(getComputedStyle(box).position === 'static') box.style.position = 'relative';
    hl = document.createElement('div'); hl.className = 'plx-hl jzb-hl'; hl.innerHTML = '<i class="plx-head"></i>'; box.appendChild(hl); }
  hl.hidden = false;
  hl.style.left = g.x + 'px'; hl.style.top = (g.y - 6) + 'px'; hl.style.width = g.w + 'px'; hl.style.height = (g.h + 12) + 'px';
  const head = hl.firstElementChild;
  if(head) head.style.left = Math.max(0, Math.min(g.w - 2, (q - pm.q0) / Math.max(0.01, pm.len) * g.w)) + 'px';
}
function jzbStop(why){
  const r = _jzb.run; if(!r) return;
  _jzb.run = null;
  if(r.raf) cancelAnimationFrame(r.raf);
  /* the chorus it was in counts if it was played to the end */
  if(why === 'ended' && r.lastChorus >= 0){ r.full++; r.best = Math.max(r.best, jzbLevelIdx(jzbLevelFor(r, r.overall))); }
  try { r.player.stop(); } catch(e){}
  const best = r.best >= 0 ? JZB_SEE[r.best][0] : null;
  _jzb.last = {id: r.id, at: Date.now(), bpm: r.settings.bpm, keys: [...r.reached], style: jzbStyleSay(r.settings),
    settings: Object.assign({}, r.settings), visibility: best, choruses: r.full};
  /* the furthest off the page you have got, kept on the exercise */
  if(best){ const rec = jazzRecord(r.id, true);
    if(jzbLevelIdx(best) > (rec.bestReadingLevel ? jzbLevelIdx(rec.bestReadingLevel) : -1)){ rec.bestReadingLevel = best; saveNow(); } }
  if(!r.root.isConnected) return;
  const $r = s => r.root.querySelector(s);
  const go = $r('#jzbGo'); if(go){ go.textContent = '▶ Play with band'; go.classList.remove('on', 'loading'); }
  const show = $r('#jzbShow'); if(show) show.hidden = true;
  const stageBox = $r('.jz-stage-box'); if(stageBox) stageBox.classList.remove('jzb-hidden');
  const hl = $r('#jzScore > .jzb-hl'); if(hl) hl.hidden = true;
  /* the page back in its own key */
  const key = jazzUi().key;
  if(r.shownKey !== key){ const box = $r('#jzScore'), xml = jzbXml(r.id, key, jazzUi().interval);
    if(box && xml){ box.innerHTML = ''; box._jzOsmd = null; jazzEngrave(box, xml); } }
  const say = $r('#jzbSay');
  if(say && r.full) say.textContent = `${r.full} chorus${r.full === 1 ? '' : 'es'} · ${[...r.reached].map(jazzPretty).join(' ')}`;
  const reading = $r('#jzReading'); if(reading) reading.outerHTML = jazzReadingHTML(r.id);
}
addEventListener('hashchange', () => { if(_jzb.run) jzbStop('left'); });

/* ---------- the panel ---------- */
function jazzBackingHTML(id){
  const s = jzbSettings(id);
  const opt = (list, v) => list.map(([k, label]) => `<option value="${k}" ${String(k) === String(v) ? 'selected' : ''}>${esc(label)}</option>`).join('');
  return `<div class="jzb" id="jzb">
    <div class="jzb-h"><span class="sc">🥁 Play-Along</span><span class="grow"></span><span class="mono faint" id="jzbSay"></span></div>
    <div class="jzb-row">
      <button class="btn sm primary jzb-go" id="jzbGo">▶ Play with band</button>
      <label class="mono jzb-f">♩ = <input class="inp sm mono" type="number" id="jzbBpm" min="30" max="360" value="${s.bpm}"></label>
      <label class="mono jzb-f" title="from straight (50:50) to hard swing (70:30); loosens by itself past ♩=220">swing
        <input type="range" id="jzbSwing" min="50" max="70" step="1" value="${Math.round(s.swingRatio * 100)}">
        <b id="jzbSwingV">${Math.round(s.swingRatio * 100)}:${100 - Math.round(s.swingRatio * 100)}</b></label>
      <label class="mono jzb-f">count-in <select class="sel sm" id="jzbCount">${opt([[0, 'none'], [1, '1 bar'], [2, '2 bars']], s.countIn)}</select></label>
    </div>
    <div class="jzb-row">
      <label class="mono jzb-f">bass <select class="sel sm" id="jzbBass">${opt(JZB_BASS, s.bassStyle)}</select></label>
      <label class="mono jzb-f">drums <select class="sel sm" id="jzbDrums">${opt(JZB_DRUMS, s.drumStyle)}</select></label>
      <label class="mono jzb-f">comping <select class="sel sm" id="jzbComp">${opt(JZB_COMP, s.comping)}</select></label>
    </div>
    <div class="jzb-row">
      <label class="mono jzb-f" title="the exercise itself, quietly, to check yourself against">hear my part too <select class="sel sm" id="jzbHear">${opt(JZB_HEAR, s.hearMyPart)}</select></label>
      <label class="mono jzb-f"><input type="checkbox" id="jzbFade" ${s.hearFade ? 'checked' : ''}> fade it each chorus</label>
      <label class="mono jzb-f">keys <select class="sel sm" id="jzbKeys">${opt(JZB_KEYS, s.keyCycle)}</select></label>
      <label class="mono jzb-f">choruses <select class="sel sm" id="jzbChor">${opt(JZB_CHORUSES.map(v => [v, v === 'infinite' ? '∞' : String(v)]), s.choruses)}</select></label>
    </div>
    <div class="jzb-row">
      <label class="mono jzb-f" title="take the page away a step at a time">reading <select class="sel sm" id="jzbSee">${opt(JZB_SEE.map(([k, i]) => [k, `${i} ${JZB_SEE_SAY[k]}`]), s.visibility)}</select></label>
      <label class="mono jzb-f"><input type="checkbox" id="jzbFirst" ${s.hideAfterFirst ? 'checked' : ''}> the notation for the first key</label>
    </div>
  </div>`;
}
function jzbShowHTML(){
  return `<div class="jzb-show" id="jzbShow" hidden aria-live="polite">
    <div class="jzb-next serif" id="jzbNext" hidden></div>
    <div class="jzb-key serif" id="jzbKey"></div>
    <div class="jzb-chord serif" id="jzbChord"></div>
    <div class="jzb-where mono" id="jzbWhere"></div></div>`;
}
function bindJazzBacking(root, id){
  const box = root.querySelector('#jzb'); if(!box) return;
  const stage = root.querySelector('.jz-stage-box');
  if(stage && !root.querySelector('#jzbShow')) stage.insertAdjacentHTML('beforebegin', jzbShowHTML());
  const $b = s => box.querySelector(s);
  const live = () => _jzb.run && _jzb.run.id === id ? _jzb.run : null;
  /* a change of style or keys starts the band again with it; tempo, swing
     and your part are heard at once */
  const again = () => { if(live()) jzbStart(root, id); };
  $b('#jzbGo').onclick = () => { sound('click'); if(live()) jzbStop('stopped'); else jzbStart(root, id); };
  $b('#jzbBpm').onchange = () => { const v = +$b('#jzbBpm').value; if(!(v >= 30 && v <= 360)){ $b('#jzbBpm').value = jzbSettings(id).bpm; return; }
    const s = jzbSave(id, {bpm: Math.round(v)}); const r = live();
    if(r){ r.settings.bpm = s.bpm; r.player.set('bpm', s.bpm);
      if(!(s.drumStyle === 'bossa' || s.drumStyle === 'straight')) r.player.set('swing', jzbSwing(s.swingRatio, s.bpm)); } };
  const sw = $b('#jzbSwing');
  sw.oninput = () => { const v = +sw.value; $b('#jzbSwingV').textContent = `${v}:${100 - v}`;
    const r = live(); if(r && !(r.settings.drumStyle === 'bossa' || r.settings.drumStyle === 'straight')) r.player.set('swing', jzbSwing(v / 100, r.settings.bpm)); };
  sw.onchange = () => { const s = jzbSave(id, {swingRatio: +sw.value / 100}); const r = live(); if(r) r.settings.swingRatio = s.swingRatio; };
  $b('#jzbCount').onchange = () => jzbSave(id, {countIn: +$b('#jzbCount').value});
  [['#jzbBass', 'bassStyle'], ['#jzbDrums', 'drumStyle'], ['#jzbComp', 'comping'], ['#jzbKeys', 'keyCycle']].forEach(([sel, k]) => {
    $b(sel).onchange = () => { jzbSave(id, {[k]: $b(sel).value}); again(); }; });
  $b('#jzbChor').onchange = () => { const v = $b('#jzbChor').value; jzbSave(id, {choruses: v === 'infinite' ? 'infinite' : +v}); again(); };
  $b('#jzbHear').onchange = () => { const v = +$b('#jzbHear').value; jzbSave(id, {hearMyPart: v}); const r = live();
    if(r){ r.guide = v; r.player.set('volumes', jzbVolumes(r)); r.player.set('muted', new Set(v > 0 ? [] : ['p:0'])); } };
  $b('#jzbFade').onchange = () => { jzbSave(id, {hearFade: $b('#jzbFade').checked}); const r = live(); if(r) r.settings.hearFade = $b('#jzbFade').checked; };
  $b('#jzbSee').onchange = () => { jzbSave(id, {visibility: $b('#jzbSee').value}); const r = live(); if(r) r.settings.visibility = $b('#jzbSee').value; };
  $b('#jzbFirst').onchange = () => { jzbSave(id, {hideAfterFirst: $b('#jzbFirst').checked}); const r = live(); if(r) r.settings.hideAfterFirst = $b('#jzbFirst').checked; };
}

/* ---------- reading, as progress ----------
   Beside the twelve keys: how far off the page this exercise has been
   played with the band — notation, chord symbols, the key name, nothing —
   and the fastest the flashcards' band has had you in. */
function jazzReadingHTML(id){
  const r = jazzRecord(id);
  const best = r.bestReadingLevel ? jzbLevelIdx(r.bestReadingLevel) : -1;
  const fast = r.fastestReaction;
  return `<div class="jzb-reading mono" id="jzReading" title="the furthest off the page you have played a whole chorus of this with the band">
    <span class="faint">Reading:</span> ${JZB_SEE.map(([k, icon, label], i) =>
      `<span class="jzb-rl${i <= best ? ' got' : ''}">${icon} ${esc(label)} ${i <= best ? '●' : '○'}</span>`).join('<span class="faint"> → </span>')}
    ${fast && fast.beats ? `<span class="faint"> · Fastest reaction:</span> ${fast.beats} beat${fast.beats === 1 ? '' : 's'} @ ♩=${fast.bpm}` : ''}</div>`;
}

/* ---------- the log, filled in from the band ---------- */
function jzbLogPrefill(id){
  const l = _jzb.last;
  if(_jzb.run && _jzb.run.id === id){ const r = _jzb.run;
    return {bpm: r.settings.bpm, keys: [...r.reached], style: jzbStyleSay(r.settings), visibility: r.best >= 0 ? JZB_SEE[r.best][0] : null}; }
  return l && l.id === id && Date.now() - l.at < 3 * 3600 * 1000 ? l : null;
}
