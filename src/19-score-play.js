/* ============================================================
   PLAYBACK — every score in the house, heard.

   Every page that draws MusicXML — the Score Practice room, an exercise
   in the Jazz Studio in any of its twelve keys, a flashcard's answer, the
   notation editor's preview — gets a bar with ▶ on it, and pressing it
   plays what is on the glass: the key it is transposed into, the bars the
   focus has clipped it to, and the parts and hands you have left switched
   on.

   THE FILE IS READ HERE, NOT THROUGH THE ENGRAVER. OSMD draws; it does not
   play, and what it keeps of a file is what drawing needs. So the notes are
   read from the MusicXML itself: divisions, chords, voices written one after
   another with <backup> between them, ties, grace notes, tempo marks and
   metronome marks, dynamics, the sustain pedal, instruments that sound in a
   key other than the one they are written in, and the road map — repeats,
   first and second endings, D.C., D.S., Fine and the coda. What the engraver
   is still used for is WHERE: the bar being played is lit on the engraving
   and a playhead runs through it, from the engraver's own layout.

   THE PIANO IS A REAL GRAND. Every note is the Salamander Grand Piano, a
   recorded Yamaha C5 (19-grand-piano.js), carried inside the page so it
   works offline, with a little room around it. For the moment before its
   recordings are decoded — once, when a room with music opens — a
   synthesised struck string stands in: a bright attack that darkens as it
   decays, low notes ringing longer than high ones.
   ============================================================ */

const PLX_STEP = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
/* the printed dynamic, as how hard the key goes down (0–1) */
const PLX_DYN = {pppp: .12, ppp: .18, pp: .26, p: .36, mp: .48, mf: .6, f: .74, ff: .86, fff: .95, ffff: 1,
  sf: .85, sfz: .88, sffz: .92, sfp: .8, fp: .74, rf: .8, rfz: .84, fz: .85, pf: .5, sfzp: .85};
const PLX_DEFAULT_VEL = 0.6;
/* <harmony>'s kinds, as the symbols the chord reader already knows */
const PLX_KIND = {major: '', minor: 'm', augmented: '+', diminished: 'dim', dominant: '7', 'major-seventh': 'maj7',
  'minor-seventh': 'm7', 'diminished-seventh': 'o7', 'augmented-seventh': '+7', 'half-diminished': 'm7b5',
  'major-minor': 'm(maj7)', 'major-sixth': '6', 'minor-sixth': 'm6', 'dominant-ninth': '9', 'major-ninth': 'maj9',
  'minor-ninth': 'm9', 'dominant-11th': '11', 'major-11th': 'maj9', 'minor-11th': 'm11', 'dominant-13th': '13',
  'major-13th': 'maj13', 'minor-13th': 'm9', 'suspended-second': 'sus2', 'suspended-fourth': 'sus4', power: '5', none: null};
/* a chord symbol written as plain words over the staff ("Dmin7", "CMaj7") */
const PLX_WORD_CHORD = /^[A-G][b#♭♯]?(maj|Maj|min|m|M|dim|aug|sus|ø|°|o|\+|-|Δ|\^)?[0-9]*(\(?(b|#|♭|♯|add|alt|sus)?\d*\)?)*(\/[A-G][b#♭♯]?)?$/;
function plxChordText(t){
  const x = String(t || '').trim().replace(/♭/g, 'b').replace(/♯/g, '#').replace(/^([A-G][b#]?)Maj/, '$1maj')
    .replace(/^([A-G][b#]?)ø7?/, '$1m7b5').replace(/^([A-G][b#]?)°7?/, '$1o7');
  return PLX_WORD_CHORD.test(String(t || '').trim()) ? x : null;
}
/* the notes of a chord symbol: a rootless voicing round middle C over the
   root (or the bass it names) low down */
function plxChordMidis(sym){
  if(typeof jazzChordSpec !== 'function') return [];
  const spec = jazzChordSpec(sym);
  if(!spec) return [];
  const upper = typeof jazzCompVoicing === 'function' ? jazzCompVoicing(spec, 58) : spec.tones.map(t => 60 + (spec.pc + t) % 12);
  const bassPc = spec.bassPc != null ? spec.bassPc : spec.pc;
  return [36 + bassPc].concat(upper);
}
const PLX_DEFAULT_BPM = 100;

const plxKids = (el, name) => el ? [...el.children].filter(c => !name || c.nodeName === name) : [];
const plxKid = (el, name) => el ? [...el.children].find(c => c.nodeName === name) || null : null;
const plxText = (el, name) => { const k = plxKid(el, name); return k ? k.textContent.trim() : ''; };
const plxNum = (el, name, d) => { const t = plxText(el, name); const n = parseFloat(t); return isFinite(n) ? n : d; };

/**
 * A MusicXML document as something to play.
 * @returns {parts:[{id, name, staves}], measures:[{k, number, len, beats, beatType}],
 *   order:[k…] (the written bars in the order they are played),
 *   perf:[{i, k, number, q0, len}] (one per bar played, in quarter notes from the start),
 *   events:[{q, d, midi, vel, part, staff, voice, perf, inBar, grace, perc, staccato, arp}],
 *   tempos:[{q, bpm}] (performance time), bpm (the first marked tempo, or null),
 *   length (quarters)}
 */
function musicXmlTimeline(xml){
  const doc = typeof xml === 'string' ? new DOMParser().parseFromString(xml, 'application/xml') : xml;
  if(!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length)
    throw new Error('That is not MusicXML this can read.');
  const root = doc.documentElement;
  const timewise = root.nodeName === 'score-timewise';
  if(root.nodeName !== 'score-partwise' && !timewise) throw new Error('That is not a MusicXML score.');
  /* the parts, and each part's bars as the elements holding their contents */
  const list = plxKid(root, 'part-list');
  const names = {};
  plxKids(list, 'score-part').forEach(sp => { names[sp.getAttribute('id')] = plxText(sp, 'part-name') || sp.getAttribute('id'); });
  const byPart = new Map();
  if(timewise){
    plxKids(root, 'measure').forEach(m => plxKids(m, 'part').forEach(p => {
      const id = p.getAttribute('id');
      if(!byPart.has(id)) byPart.set(id, []);
      byPart.get(id).push({el: p, number: m.getAttribute('number'), implicit: m.getAttribute('implicit') === 'yes'});
    }));
  } else {
    plxKids(root, 'part').forEach(p => byPart.set(p.getAttribute('id'),
      plxKids(p, 'measure').map(m => ({el: m, number: m.getAttribute('number'), implicit: m.getAttribute('implicit') === 'yes'}))));
  }
  const partIds = [...byPart.keys()];
  if(!partIds.length) throw new Error('That score has no parts in it.');
  const nBars = Math.max(...partIds.map(id => byPart.get(id).length));

  /* ---- pass one: every part, bar by bar, in written time ---- */
  const parts = [], raw = [];            /* raw: per part, per bar, the notes with their place in the bar */
  const barLen = new Array(nBars).fill(0), barSig = new Array(nBars).fill(null);
  const barInfo = [...Array(nBars)].map(() => ({}));
  const tempoIn = [...Array(nBars)].map(() => []);  /* [{at, bpm}] */
  const harmIn = [...Array(nBars)].map(() => []);   /* [{at, sym}] */
  const hasNotes = new Array(nBars).fill(false);
  const pedalIn = partIds.map(() => [...Array(nBars)].map(() => []));  /* [{at, down}] */
  partIds.forEach((pid, pi) => {
    const bars = byPart.get(pid);
    let div = 1, chrom = 0, octShift = 0, vel = PLX_DEFAULT_VEL, staves = 1;
    let beats = 4, beatType = 4;
    const perBar = [];
    for(let k = 0; k < nBars; k++){
      const bar = bars[k];
      const notes = [];
      perBar.push(notes);
      if(!bar) continue;
      let pos = 0, maxPos = 0, lastOnset = 0;
      const info = barInfo[k];
      const sound = (s, at) => {
        if(!s) return;
        const t = parseFloat(s.getAttribute('tempo'));
        if(isFinite(t) && t > 0) tempoIn[k].push({at, bpm: t, sound: true});
        const d = parseFloat(s.getAttribute('dynamics'));
        if(isFinite(d)) vel = Math.max(0.05, Math.min(1, d / 90 * 0.6));
        if(pi === 0){
          if(s.getAttribute('dacapo') === 'yes') info.dacapo = true;
          if(s.getAttribute('segno')) info.segno = s.getAttribute('segno');
          if(s.getAttribute('dalsegno')) info.dalsegno = s.getAttribute('dalsegno');
          if(s.getAttribute('coda')) info.coda = s.getAttribute('coda');
          if(s.getAttribute('tocoda')) info.tocoda = s.getAttribute('tocoda');
          if(s.getAttribute('fine') != null) info.fine = true;
        }
        const dp = s.getAttribute('damper-pedal');
        if(dp === 'yes' || dp === 'no') pedalIn[pi][k].push({at, down: dp === 'yes'});
      };
      for(const c of bar.el.children){
        const name = c.nodeName;
        if(name === 'attributes'){
          const dv = plxNum(c, 'divisions', 0); if(dv > 0) div = dv;
          const st = plxNum(c, 'staves', 0); if(st > 0) staves = st;
          const tm = plxKid(c, 'time');
          if(tm){
            const bt = plxText(tm, 'beats'), ty = plxNum(tm, 'beat-type', 4);
            const b = String(bt).split('+').reduce((a, x) => a + (parseFloat(x) || 0), 0);
            if(b > 0){ beats = b; beatType = ty || 4; }
          }
          const tr = plxKid(c, 'transpose');
          if(tr){ chrom = plxNum(tr, 'chromatic', 0); octShift = plxNum(tr, 'octave-change', 0); }
        } else if(name === 'note'){
          const grace = !!plxKid(c, 'grace');
          const cue = !!plxKid(c, 'cue');
          const chord = !!plxKid(c, 'chord');
          const dur = grace ? 0 : plxNum(c, 'duration', 0) / div;
          const onset = chord ? lastOnset : pos;
          if(!chord && !grace){ lastOnset = pos; pos += dur; }
          maxPos = Math.max(maxPos, pos, onset + dur);
          if(cue || plxKid(c, 'rest')) continue;
          hasNotes[k] = true;
          const pitch = plxKid(c, 'pitch'), unp = plxKid(c, 'unpitched');
          let midi = null, perc = false;
          if(pitch){
            midi = 12 * (plxNum(pitch, 'octave', 4) + 1) + (PLX_STEP[plxText(pitch, 'step')] ?? 0) + plxNum(pitch, 'alter', 0)
              + chrom + 12 * octShift;
          } else if(unp){
            midi = 12 * (plxNum(unp, 'display-octave', 4) + 1) + (PLX_STEP[plxText(unp, 'display-step')] ?? 0); perc = true;
          } else continue;
          const ties = plxKids(c, 'tie').map(t => t.getAttribute('type'));
          const nots = plxKid(c, 'notations');
          const arts = plxKid(nots, 'articulations');
          const has = (el, n) => !!plxKid(el, n);
          let v = vel;
          const nd = parseFloat(c.getAttribute('dynamics'));
          if(isFinite(nd)) v = Math.max(0.05, Math.min(1, nd / 90 * 0.6));
          if(has(arts, 'accent')) v = Math.min(1, v + 0.12);
          if(has(arts, 'strong-accent')) v = Math.min(1, v + 0.18);
          notes.push({at: onset, d: dur, midi: Math.round(midi), vel: v, part: pi,
            staff: plxNum(c, 'staff', 1), voice: plxText(c, 'voice') || '1', grace, perc,
            tieStart: ties.includes('start'), tieStop: ties.includes('stop'),
            staccato: has(arts, 'staccato') || has(arts, 'staccatissimo') || has(arts, 'spiccato'),
            tenuto: has(arts, 'tenuto'), arp: has(nots, 'arpeggiate'), fermata: has(nots, 'fermata')});
        } else if(name === 'harmony'){
          const r = plxKid(c, 'root');
          const kindEl = plxKid(c, 'kind');
          const kind = kindEl ? kindEl.textContent.trim() : 'major';
          const suf = PLX_KIND[kind];
          if(r && suf !== null){
            const alt = plxNum(r, 'root-alter', 0);
            let sym = plxText(r, 'root-step') + (alt > 0 ? '#' : alt < 0 ? 'b' : '') + (suf == null ? '' : suf);
            plxKids(c, 'degree').forEach(d => { const v = plxNum(d, 'degree-value', 0), a = plxNum(d, 'degree-alter', 0);
              if(v) sym += (a > 0 ? '#' : a < 0 ? 'b' : '') + v; });
            const bs = plxKid(c, 'bass');
            if(bs){ const ba = plxNum(bs, 'bass-alter', 0); sym += '/' + plxText(bs, 'bass-step') + (ba > 0 ? '#' : ba < 0 ? 'b' : ''); }
            harmIn[k].push({at: pos + plxNum(c, 'offset', 0) / div, sym, part: pi});
          }
        } else if(name === 'backup'){
          pos = Math.max(0, pos - plxNum(c, 'duration', 0) / div);
        } else if(name === 'forward'){
          pos += plxNum(c, 'duration', 0) / div; maxPos = Math.max(maxPos, pos);
        } else if(name === 'direction'){
          const at = pos + plxNum(c, 'offset', 0) / div;
          plxKids(c, 'direction-type').forEach(dt => {
            plxKids(dt, 'words').forEach(w => { const sym = plxChordText(w.textContent);
              if(sym) harmIn[k].push({at, sym, part: pi, words: true}); });
            const dyn = plxKid(dt, 'dynamics');
            if(dyn){ const k0 = [...dyn.children].map(x => x.nodeName).find(n => PLX_DYN[n] != null);
              if(k0) vel = PLX_DYN[k0]; }
            const met = plxKid(dt, 'metronome');
            if(met){
              const unit = plxText(met, 'beat-unit') || 'quarter', dots = plxKids(met, 'beat-unit-dot').length;
              const pm = parseFloat(plxText(met, 'per-minute'));
              const q = {whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25}[unit] || 1;
              if(isFinite(pm) && pm > 0) tempoIn[k].push({at, bpm: pm * q * (dots ? 1.5 : 1), sound: false});
            }
            const ped = plxKid(dt, 'pedal');
            if(ped){ const ty = ped.getAttribute('type');
              if(ty === 'start' || ty === 'resume') pedalIn[pi][k].push({at, down: true});
              else if(ty === 'stop' || ty === 'discontinue') pedalIn[pi][k].push({at, down: false});
              else if(ty === 'change'){ pedalIn[pi][k].push({at, down: false}); pedalIn[pi][k].push({at: at + 0.01, down: true}); } }
            if(pi === 0 && plxKid(dt, 'segno') && !info.segno) info.segno = 'segno';
            if(pi === 0 && plxKid(dt, 'coda') && !info.coda) info.codaMark = true;
          });
          sound(plxKid(c, 'sound'), at);
        } else if(name === 'sound'){
          sound(c, pos);
        } else if(name === 'barline' && pi === 0){
          const rep = plxKid(c, 'repeat');
          if(rep){ if(rep.getAttribute('direction') === 'forward') info.fwd = true;
            else info.back = Math.max(2, parseInt(rep.getAttribute('times'), 10) || 2); }
          const end = plxKid(c, 'ending');
          if(end){ const ty = end.getAttribute('type');
            if(ty === 'start') info.ending = String(end.getAttribute('number') || '1').split(/[\s,]+/).map(Number).filter(Boolean);
            else info.endingStop = true; }
          sound(plxKid(c, 'sound'), pos);
        }
      }
      if(!barSig[k]) barSig[k] = {beats, beatType};
      const nominal = beats * 4 / beatType;
      const got = bar.implicit ? (maxPos || nominal) : Math.max(maxPos, nominal);
      barLen[k] = Math.max(barLen[k], got);
    }
    parts.push({id: pid, name: names[pid] || pid, staves});
    raw.push(perBar);
  });
  const measures = [...Array(nBars)].map((_, k) => {
    const b0 = byPart.get(partIds[0])[k];
    const n = b0 ? parseInt(b0.number, 10) : NaN;
    return {k, number: isFinite(n) ? n : k + 1, len: barLen[k] || 4,
      beats: (barSig[k] || {}).beats || 4, beatType: (barSig[k] || {}).beatType || 4};
  });

  /* ---- the road map: which bars, in what order ---- */
  const order = plxRoadMap(barInfo);

  /* the tempo and the pedal in force where each written bar starts, so a
     repeat that jumps back picks up what was in force there, not what was
     in force where it jumped from */
  const tempoAtBar = [], pedalAtBar = partIds.map(() => []);
  let tNow = null;
  for(let k = 0; k < nBars; k++){
    tempoAtBar.push(tNow);
    const marks = tempoIn[k].slice().sort((a, b) => a.at - b.at || (b.sound - a.sound));
    if(marks.length) tNow = marks[marks.length - 1].bpm;
  }
  partIds.forEach((_, pi) => { let down = false;
    for(let k = 0; k < nBars; k++){ pedalAtBar[pi].push(down);
      pedalIn[pi][k].forEach(e => { down = e.down; }); } });
  const firstBpm = (() => { for(let k = 0; k < nBars; k++){ const m = tempoIn[k].slice().sort((a, b) => a.at - b.at || (b.sound - a.sound));
    if(m.length) return m[0].bpm; } return null; })();

  /* ---- pass two: the performance ---- */
  const perf = [], events = [], tempos = [], pedals = partIds.map(() => []);
  let q = 0;
  order.forEach((k, i) => {
    const m = measures[k];
    perf.push({i, k, number: m.number, q0: q, len: m.len, beats: m.beats, beatType: m.beatType});
    const at0 = tempoAtBar[k];
    if(at0 != null && (!tempos.length || tempos[tempos.length - 1].bpm !== at0)) tempos.push({q, bpm: at0});
    /* one mark per place: where a <sound tempo> and a metronome mark say
       the same thing twice, the sound element is the one meant for playback */
    const seen = new Set();
    tempoIn[k].slice().sort((a, b) => a.at - b.at || (b.sound - a.sound)).forEach(t => {
      const key = Math.round(t.at * 1000);
      if(seen.has(key)) return; seen.add(key);
      tempos.push({q: q + t.at, bpm: t.bpm});
    });
    /* the chord symbols: heard on their own in a bar with no notes (a chord
       chart, a lead sheet's empty bars); under the notes only when asked */
    const hs = harmIn[k].filter((h, j, a) => a.findIndex(x => Math.abs(x.at - h.at) < 1e-6 && x.sym === h.sym) === j)
      .sort((a, b) => a.at - b.at);
    hs.forEach((h, j) => {
      const until = j + 1 < hs.length ? hs[j + 1].at : m.len;
      const d = Math.max(0.25, until - h.at);
      plxChordMidis(h.sym).forEach(midi => events.push({q: q + h.at, d, midi, vel: 0.42, part: h.part, staff: 0,
        voice: 'chords', inBar: h.at, perf: i, sym: h.sym, chord: true, auto: !hasNotes[k]}));
    });
    partIds.forEach((_, pi) => {
      pedals[pi].push({q, down: pedalAtBar[pi][k]});
      pedalIn[pi][k].forEach(e => pedals[pi].push({q: q + e.at, down: e.down}));
      raw[pi][k].forEach(n => events.push(Object.assign({}, n, {q: q + n.at, inBar: n.at, perf: i})));
    });
    q += m.len;
  });
  tempos.sort((a, b) => a.q - b.q);
  if(!tempos.length || tempos[0].q > 0) tempos.unshift({q: 0, bpm: firstBpm || PLX_DEFAULT_BPM, assumed: !firstBpm});
  events.sort((a, b) => a.q - b.q || a.part - b.part || a.midi - b.midi);

  /* ties: a note tied into the next one is one sound, as long as both */
  const open = new Map(), keep = [];
  events.forEach(e => {
    if(e.chord){ keep.push(e); return; }
    const key = `${e.part}|${e.midi}`;
    const was = open.get(key);
    if(e.tieStop && was && Math.abs(was.q + was.d - e.q) < 0.02){
      was.d += e.d;
      if(!e.tieStart) open.delete(key);
      return;
    }
    keep.push(e);
    if(e.tieStart) open.set(key, e); else open.delete(key);
  });
  /* the sustain pedal holds whatever it catches until it comes up */
  pedals.forEach((list, pi) => {
    const spans = []; let from = null;
    list.sort((a, b) => a.q - b.q).forEach(p => {
      if(p.down && from == null) from = p.q;
      else if(!p.down && from != null){ spans.push([from, p.q]); from = null; }
    });
    if(from != null) spans.push([from, q]);
    if(!spans.length) return;
    keep.forEach(e => { if(e.part !== pi || e.perc) return;
      const end = e.q + e.d;
      const s = spans.find(([a, b]) => end >= a - 0.001 && end < b);
      if(s) e.held = s[1] - e.q; });
  });
  return {parts, measures, order, perf, events: keep, tempos, bpm: firstBpm, length: q,
    chords: keep.some(e => e.chord), playable: keep.some(e => !e.chord || e.auto)};
}

/* The order the written bars are played in: repeats (twice unless the
   barline says how many times), numbered endings, then D.C. and D.S. — after
   which repeats are not taken again, the last ending is the one played,
   "To Coda" jumps and Fine stops. */
function plxRoadMap(info){
  const n = info.length;
  /* where each ending stops, and whether it is the last of its group */
  const endAt = new Array(n).fill(null), lastEnding = new Array(n).fill(false);
  for(let k = 0; k < n; k++) if(info[k].ending){
    let j = k; while(j < n - 1 && !info[j].endingStop && !(j > k && info[j].ending)) j++;
    if(j > k && info[j].ending && !info[j].endingStop) j--;
    endAt[k] = j;
    const next = info[j + 1];
    lastEnding[k] = !(next && next.ending);
  }
  const find = pred => { for(let k = 0; k < n; k++) if(pred(info[k])) return k; return -1; };
  const order = [];
  let k = 0, from = 0, pass = 1, jumped = false, guard = 0;
  while(k < n && guard++ < 20000){
    const b = info[k];
    if(b.fwd && from !== k && !jumped){ from = k; pass = 1; }
    if(b.ending){
      const play = jumped ? lastEnding[k] : b.ending.includes(pass);
      if(!play){ k = endAt[k] + 1; continue; }
    }
    order.push(k);
    if(jumped && b.fine) break;
    if(jumped && b.tocoda){
      let c = find(x => x.coda === b.tocoda);
      if(c < 0) c = find((x, i) => x.coda || x.codaMark);
      if(c > k){ k = c; continue; }
    }
    if(b.back && !jumped){
      if(pass < b.back){ pass++; k = from; continue; }
      pass = 1; from = k + 1;
    } else if(b.endingStop && !jumped){
      /* the end of the last ending closes the repeat */
      const start = (() => { for(let j = k; j >= 0; j--) if(info[j].ending) return j; return -1; })();
      if(start >= 0 && lastEnding[start]){ pass = 1; from = k + 1; }
    }
    if(!jumped && (b.dacapo || b.dalsegno)){
      jumped = true;
      if(b.dalsegno){ let s = find(x => x.segno === b.dalsegno); if(s < 0) s = find(x => !!x.segno); k = s >= 0 ? s : 0; }
      else k = 0;
      continue;
    }
    k++;
  }
  return order;
}

/* ---------- the sound ---------- */
let _plxCtx = null;
function plxAudioCtx(){
  if(_plxCtx && _plxCtx.state !== 'closed') return _plxCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  _plxCtx = new AC();
  return _plxCtx;
}
const plxHz = m => 440 * Math.pow(2, (m - 69) / 12);
/* a string's overtones, falling away as they go up */
function plxWave(ctx){
  if(ctx._plxWave) return ctx._plxWave;
  const amps = [0, 1, 0.6, 0.34, 0.24, 0.13, 0.1, 0.055, 0.04, 0.022, 0.016, 0.01];
  const real = new Float32Array(amps.length), imag = new Float32Array(amps);
  ctx._plxWave = ctx.createPeriodicWave(real, imag);
  return ctx._plxWave;
}
/* a little room: a second and a half of decaying noise */
function plxRoom(ctx){
  if(ctx._plxRoom) return ctx._plxRoom;
  const len = Math.floor(ctx.sampleRate * 1.5);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for(let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch);
    for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  ctx._plxRoom = b;
  return b;
}
function plxOut(ctx, volume){
  const master = ctx.createGain(); master.gain.value = volume == null ? 0.9 : volume;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  const dry = ctx.createGain(); dry.gain.value = 1;
  const wet = ctx.createGain(); wet.gain.value = 0.16;
  let verb = null;
  try { verb = ctx.createConvolver(); verb.buffer = plxRoom(ctx); } catch(e){ verb = null; }
  master.connect(dry); dry.connect(comp);
  if(verb){ master.connect(wet); wet.connect(verb); verb.connect(comp); }
  comp.connect(ctx.destination);
  return {input: master, stop(){ try { master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04); } catch(e){}
    setTimeout(() => { try { master.disconnect(); comp.disconnect(); } catch(e){} }, 2000); }};
}
/* A struck string. held: how long it rings (the pedal can make that longer
   than the note); the key coming up fades it in a tenth of a second. */
function plxPiano(ctx, dest, midi, t, dur, vel, held){
  if(typeof grandPianoNote === 'function'){
    if(grandPianoNote(ctx, dest, midi, t, dur, vel, held, 0.55)) return;
    grandPianoMissed();
  }
  const f = plxHz(midi);
  if(f < 20 || f > 12000) return;
  const v = Math.max(0.03, Math.min(1, vel || PLX_DEFAULT_VEL));
  const ring = Math.max(0.06, held || dur);
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
  o1.setPeriodicWave(plxWave(ctx)); o2.setPeriodicWave(plxWave(ctx));
  o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = 3 + (midi % 5) * 0.6;
  const mix = ctx.createGain(); mix.gain.value = 0.5;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
  const bright = Math.min(15000, f * (5 + 11 * v));
  lp.frequency.setValueAtTime(bright, t);
  lp.frequency.setTargetAtTime(Math.max(f * 2.4, 500), t + 0.01, 0.35 + (1 - v) * 0.2);
  const g = ctx.createGain();
  const peak = 0.2 * Math.pow(v, 1.4) * (midi < 48 ? 1.15 : midi > 84 ? 0.8 : 1);
  /* low strings sing on; the top of the keyboard is nearly gone in a second */
  const tail = Math.max(0.5, Math.min(4, 3.6 - (midi - 36) * 0.055));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.005);
  g.gain.setTargetAtTime(peak * 0.42, t + 0.006, 0.09);
  g.gain.setTargetAtTime(0.0001, t + 0.25, tail / 3);
  const end = t + ring;
  g.gain.cancelScheduledValues(end);
  g.gain.setTargetAtTime(0.0001, end, 0.06);
  o1.connect(mix); o2.connect(mix); mix.connect(lp); lp.connect(g); g.connect(dest);
  o1.start(t); o2.start(t); o1.stop(end + 0.5); o2.stop(end + 0.5);
  /* the hammer: a breath of noise on the attack */
  try {
    const n = ctx.createBufferSource(); n.buffer = plxNoise(ctx);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(9000, f * 3.5); bp.Q.value = 1.2;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.05 * v, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    n.connect(bp); bp.connect(ng); ng.connect(dest); n.start(t); n.stop(t + 0.04);
  } catch(e){}
}
function plxNoise(ctx){
  if(ctx._plxNoise) return ctx._plxNoise;
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
  const d = b.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  ctx._plxNoise = b; return b;
}
/* a percussion part's note: a pitched thud low down, a hiss up top */
function plxDrum(ctx, dest, midi, t, vel){
  const n = ctx.createBufferSource(); n.buffer = plxNoise(ctx);
  const f = ctx.createBiquadFilter();
  const low = midi < 62;
  f.type = low ? 'lowpass' : 'highpass'; f.frequency.value = low ? 180 + (midi - 40) * 20 : 5000;
  const g = ctx.createGain(), d = low ? 0.18 : 0.08;
  g.gain.setValueAtTime(0.35 * (vel || 0.6), t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  n.connect(f); f.connect(g); g.connect(dest); n.start(t); n.stop(t + d + 0.02);
}
function plxClick(ctx, dest, t, accent){
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square'; o.frequency.value = accent ? 1760 : 1320;
  g.gain.setValueAtTime(accent ? 0.12 : 0.07, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.05);
}

/* ---------- the player ----------
   opts: {bpm (the tempo to take the first marked one to — later changes keep
   their proportion), swing (0 straight, else the long eighth's share of the
   beat, 0.62–0.7), from/to (indexes into tl.perf), loop, countIn, click,
   muted: Set of 'p:<part>' and 'p:<part>:s:<staff>', onEnd()}.
   Quarter notes are the unit of musical time throughout. */
function scorePlayer(tl, opts){
  const o = Object.assign({bpm: null, swing: 0, from: 0, to: tl.perf.length - 1, loop: false,
    countIn: false, click: false, chords: false, muted: new Set()}, opts || {});
  let ctx = null, out = null, timer = null, running = false, paused = false;
  let anchorT = 0, anchorQ = 0, idx = 0, clickQ = 0, endQ = 0, startQ = 0, prevT = null, prevQ = 0;
  const base = tl.tempos[0] ? tl.tempos[0].bpm : PLX_DEFAULT_BPM;
  const factor = () => (o.bpm ? o.bpm / base : 1);
  const bpmAt = q => { let b = base; for(const t of tl.tempos){ if(t.q <= q + 1e-9) b = t.bpm; else break; } return b * factor(); };
  /* seconds between two points in quarter notes, across tempo changes */
  const secs = (qa, qb) => {
    if(qb <= qa) return 0;
    let s = 0, q = qa;
    const marks = tl.tempos.filter(t => t.q > qa && t.q < qb).map(t => t.q).concat([qb]);
    for(const m of marks){ s += (m - q) * 60 / bpmAt(q); q = m; }
    return s;
  };
  const qAfter = (qa, s) => {
    let q = qa, left = s;
    const later = tl.tempos.filter(t => t.q > qa).map(t => t.q);
    for(const m of later){ const need = (m - q) * 60 / bpmAt(q); if(need >= left) break; left -= need; q = m; }
    return q + left * bpmAt(q) / 60;
  };
  const rangeQ = () => { const a = tl.perf[Math.max(0, o.from)], z = tl.perf[Math.min(tl.perf.length - 1, o.to)];
    return a && z ? [a.q0, z.q0 + z.len] : [0, tl.length]; };
  /* swing: an eighth on the beat is long, the one after it short */
  const swung = e => {
    if(!o.swing || e.grace) return {q: e.q, d: e.d};
    const pm = tl.perf[e.perf];
    if(!pm || (pm.beatType !== 4 && pm.beatType !== 2)) return {q: e.q, d: e.d};
    const frac = e.inBar - Math.floor(e.inBar);
    const s = o.swing;
    if(Math.abs(frac - 0.5) < 0.01) return {q: e.q + (s - 0.5), d: Math.abs(e.d - 0.5) < 0.01 ? 1 - s : Math.max(0.05, e.d - (s - 0.5))};
    if(frac < 0.01 && Math.abs(e.d - 0.5) < 0.01) return {q: e.q, d: s};
    return {q: e.q, d: e.d};
  };
 /* one beat, in quarters: a dotted quarter in 6/8, 9/8, 12/8 */
  const beatStep = pm => !pm ? 1 : 4 / pm.beatType * (pm.beatType === 8 && pm.beats % 3 === 0 && pm.beats > 3 ? 3 : 1);
  const heard = e => e.chord ? ((o.chords || e.auto) && !o.muted.has('chords'))
    : !o.muted.has(`p:${e.part}`) && !o.muted.has(`p:${e.part}:s:${e.staff}`);
  const at = q => anchorT + secs(anchorQ, q);
  const schedule = limit => {
    const until = limit != null ? limit : ctx.currentTime + 0.18;
    while(running){
      /* the loop: the end of the range is the start again */
      const nextEventQ = idx < tl.events.length ? tl.events[idx].q : Infinity;
      const nextClickQ = o.click ? clickQ : Infinity;
      const nq = Math.min(nextEventQ, nextClickQ);
      if(nq >= endQ - 1e-9){
        const tEnd = at(endQ);
        if(tEnd > until) return;
        if(o.loop){ prevT = anchorT; prevQ = anchorQ; anchorT = tEnd; anchorQ = startQ; seek(startQ); continue; }
        running = false;
        const wait = Math.max(0, (tEnd - ctx.currentTime) * 1000) + 300;
        setTimeout(() => { if(!running && !paused && o.onEnd) o.onEnd(); }, wait);
        return;
      }
      const t = at(nq);
      if(t > until) return;
      if(nq === nextClickQ){
        const pm = perfAt(clickQ);
        const step = beatStep(pm);
        plxClick(ctx, out.input, t, pm && Math.abs(clickQ - pm.q0) < 1e-6);
        clickQ += step;
        if(pm && clickQ > pm.q0 + pm.len - 1e-6) clickQ = pm.q0 + pm.len;
        continue;
      }
      const e = tl.events[idx++];
      if(e.q < startQ - 1e-9 || !heard(e)) continue;
      const sw = swung(e);
      const t0 = at(sw.q) + (e.arp ? 0.03 * ((e.midi % 7) / 2) : 0) - (e.grace ? 0.07 : 0);
      if(t0 < ctx.currentTime - 0.05 && limit == null) continue;
      const d = e.grace ? 0.07 : Math.max(0.04, secs(sw.q, sw.q + sw.d) * (e.staccato ? 0.45 : e.tenuto ? 1 : 0.94) * (e.fermata ? 1.6 : 1));
      const held = e.held ? Math.max(d, secs(e.q, e.q + e.held)) : d;
      if(e.perc) plxDrum(ctx, out.input, e.midi, Math.max(0, t0), e.vel);
      else plxPiano(ctx, out.input, e.midi, Math.max(0, t0), d, e.vel, held);
    }
  };
  const perfAt = q => { let lo = 0, hi = tl.perf.length - 1, best = tl.perf[0];
    while(lo <= hi){ const mid = (lo + hi) >> 1; if(tl.perf[mid].q0 <= q + 1e-9){ best = tl.perf[mid]; lo = mid + 1; } else hi = mid - 1; }
    return best; };
  const seek = q => {
    let lo = 0, hi = tl.events.length;
    while(lo < hi){ const mid = (lo + hi) >> 1; if(tl.events[mid].q < q - 1e-9) lo = mid + 1; else hi = mid; }
    idx = lo;
    const pm = perfAt(q);
    const step = beatStep(pm);
    clickQ = pm ? pm.q0 + Math.ceil((q - pm.q0) / step - 1e-9) * step : q;
  };
  const api = {
    /* ctxIn: an OfflineAudioContext, for the smoke test to hear it */
    start(ctxIn, fromQ){
      ctx = ctxIn || plxAudioCtx(); if(!ctx) return false;
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const offline = !!(OAC && ctx instanceof OAC);
      if(!offline && ctx.resume) ctx.resume();
      out = plxOut(ctx, o.volume);
      [startQ, endQ] = rangeQ();
      const q0 = fromQ != null ? Math.max(startQ, Math.min(endQ - 0.01, fromQ)) : startQ;
      anchorT = ctx.currentTime + 0.08; anchorQ = q0;
      if(o.countIn){
        const pm = perfAt(q0), step = beatStep(pm), n = pm ? Math.max(1, Math.min(8, Math.round(pm.len / step))) : 4;
        const beat = step * 60 / bpmAt(q0);
        for(let i = 0; i < n; i++) plxClick(ctx, out.input, anchorT + i * beat, i === 0);
        anchorT += n * beat;
      }
      seek(q0);
      running = true; paused = false;
      if(offline){ schedule(ctx.length / ctx.sampleRate); running = false; return true; }
      timer = setInterval(() => { try { schedule(); } catch(e){ console.warn('playback', e); } }, 25);
      schedule();
      return true;
    },
    stop(){ running = false; paused = false; if(timer) clearInterval(timer); timer = null; if(out) out.stop(); out = null; },
    pause(){ if(!running) return null; const q = api.position(); paused = true; running = false;
      if(timer) clearInterval(timer); timer = null; if(out) out.stop(); out = null; return q; },
    /* where the music is now, in quarter notes (before a count-in ends, where it will start) */
    position(){ if(!ctx) return startQ; const now = ctx.currentTime;
      /* booked a moment ahead: until the loop comes round, it is still the old pass */
      if(now < anchorT) return prevT != null && now >= prevT ? Math.min(endQ, qAfter(prevQ, now - prevT)) : anchorQ;
      const q = qAfter(anchorQ, now - anchorT);
      if(o.loop && q >= endQ){ const span = endQ - startQ; return span > 0 ? startQ + ((q - startQ) % span) : startQ; }
      return Math.min(q, endQ); },
    /* a change heard at once: re-anchored where the music is */
    set(k, v){
      if(k === 'bpm' || k === 'swing'){
        /* what is already booked (a fifth of a second) plays as booked; the
           rest is timed from here at the new setting */
        if(running){ const q = api.position(); anchorQ = q; anchorT = Math.max(ctx.currentTime, anchorT); prevT = null; o[k] = v; }
        else o[k] = v;
        return;
      }
      if(k === 'muted'){ o.muted = v; return; }
      o[k] = v;
      if(k === 'from' || k === 'to'){ [startQ, endQ] = rangeQ(); }
    },
    get running(){ return running; }, get paused(){ return paused; },
    get opts(){ return o; }, perfAt, bpmAt, secs,
    get length(){ return secs(0, tl.length); }
  };
  return api;
}

/* An offline rendering, for the claims: how loud it got and how many notes. */
async function scorePlayRender(xml, seconds, opts){
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if(!OAC) return null;
  if(typeof grandPianoLoad === 'function' && !(opts && opts.synth)) await grandPianoLoad();
  const tl = musicXmlTimeline(xml);
  const ctx = new OAC(1, Math.floor(44100 * (seconds || 3)), 44100);
  const p = scorePlayer(tl, opts);
  p.start(ctx);
  const buf = await ctx.startRendering();
  const d = buf.getChannelData(0); let peak = 0, sumsq = 0;
  for(let k = 0; k < d.length; k += 5){ peak = Math.max(peak, Math.abs(d[k])); sumsq += d[k] * d[k]; }
  return {peak, rms: Math.sqrt(sumsq / (d.length / 5)), notes: tl.events.length, bars: tl.perf.length};
}

/* ---------- where it is on the engraving ----------
   For each written bar, where the engraver put it: the rectangle of the
   system it sits in (every staff of it), its page, and the x of each moment
   in it that has a note, so a playhead can run through the bar rather than
   jump from bar line to bar line. In pixels over `host`. */
function plxGeometry(osmd, host, svgRoot){
  const out = new Map();
  if(!osmd || !host) return out;
  let pages = [];
  try { pages = osmd.GraphicSheet.MusicPages || []; } catch(e){ return out; }
  const unit = (osmd.zoom || 1) * 10;
  const svgs = [...(svgRoot || host).querySelectorAll('svg')];
  const hr = host.getBoundingClientRect();
  /* a page drawn at one size and shown at another (max-width:100% on a
     narrow screen) is scaled, and the layout's units have to be too */
  const offs = svgs.map(s => { const r = s.getBoundingClientRect();
    const aw = parseFloat(s.getAttribute('width')) || r.width, ah = parseFloat(s.getAttribute('height')) || r.height;
    return {x: r.left - hr.left - host.clientLeft + host.scrollLeft, y: r.top - hr.top - host.clientTop + host.scrollTop, shown: r.width > 0,
      sx: aw > 0 && r.width > 0 ? r.width / aw : 1, sy: ah > 0 && r.height > 0 ? r.height / ah : 1}; });
  let list = [];
  try { list = osmd.GraphicSheet.MeasureList || []; } catch(e){ return out; }
  list.forEach((staves, k) => (staves || []).forEach(m => {
    if(!m || !m.PositionAndShape || !m.PositionAndShape.AbsolutePosition) return;
    const sys = m.ParentStaffLine && m.ParentStaffLine.ParentMusicSystem;
    const pg = sys && sys.Parent ? Math.max(0, pages.indexOf(sys.Parent)) : 0;
    const src = m.parentSourceMeasure;
    const idx = src && src.measureListIndex != null ? src.measureListIndex : k;
    const abs = m.PositionAndShape.AbsolutePosition, size = m.PositionAndShape.Size || {width: 0};
    const off = offs[pg] || offs[0] || {x: 0, y: 0, shown: true, sx: 1, sy: 1};
    const x = off.x + abs.x * unit * off.sx, y = off.y + abs.y * unit * off.sy, w = size.width * unit * off.sx, h = 4 * unit * off.sy;
    let g = out.get(idx);
    if(!g){ g = {k: idx, page: pg, x, y, w, h, shown: off.shown, entries: []}; out.set(idx, g); }
    else { const x2 = Math.max(g.x + g.w, x + w), y2 = Math.max(g.y + g.h, y + h);
      g.x = Math.min(g.x, x); g.y = Math.min(g.y, y); g.w = x2 - g.x; g.h = y2 - g.y; }
    const barAt = (src && src.AbsoluteTimestamp && src.AbsoluteTimestamp.RealValue) || 0;
    (m.staffEntries || []).forEach(se => {
      const ts = se.relInMeasureTimestamp || (se.sourceStaffEntry && se.sourceStaffEntry.Timestamp);
      let where = ts && ts.RealValue != null ? ts.RealValue : 0;
      if(barAt > 0 && where >= barAt) where -= barAt;
      const ps = se.PositionAndShape;
      if(!ps || !ps.AbsolutePosition) return;
      const q = where * 4, ex = off.x + ps.AbsolutePosition.x * unit * off.sx;
      const had = g.entries.find(e => Math.abs(e.q - q) < 1e-6);
      if(had) had.x = Math.min(had.x, ex); else g.entries.push({q, x: ex});
    });
  }));
  out.forEach(g => g.entries.sort((a, b) => a.q - b.q));
  return out;
}

/* ---------- the bar with ▶ on it ----------
   cfg: {xml() → the MusicXML being shown, osmd() → the engraving, host (the
   element the engraving is drawn in, and where the lit bar is drawn),
   store: {get() → saved settings, set(settings)}, swing (default for this
   room), range() → [firstBar, lastBar] as numbered, or null,
   onPage(page) → turn to that page (a paginated room), follow (scroll along)} */
let _plxNow = null;
function scorePlayStopAll(){ if(_plxNow){ try { _plxNow.stop(true); } catch(e){} _plxNow = null; } }
addEventListener('hashchange', () => scorePlayStopAll());

function scorePlayBarHTML(opts){
  const o = opts || {};
  return `<div class="plx-bar${o.compact ? ' compact' : ''}" data-plx>
    <button class="btn sm primary plx-go" data-plxgo title="play what is on the page (space)">▶ Play</button>
    <button class="tbtn" data-plxstop title="stop, and back to the start">■</button>
    <span class="plx-where mono" data-plxwhere>—</span>
    <label class="plx-tempo" title="the tempo to play it at"><span class="mono">♩ =</span>
      <input type="range" min="20" max="300" step="1" data-plxbpm aria-label="tempo">
      <b class="mono" data-plxbpmv></b></label>
    ${o.compact ? '' : `<button class="tbtn" data-plxmore aria-expanded="false" title="loop, count-in, click, swing, which parts">⋯</button>
    <div class="plx-opts" data-plxopts hidden>
      <button class="tbtn" data-plxopt="loop" title="play it round again from the start">⟳ loop</button>
      <button class="tbtn" data-plxopt="countIn" title="a bar of clicks before it starts">count-in</button>
      <button class="tbtn" data-plxopt="click" title="a click on every beat while it plays">click</button>
      <button class="tbtn" data-plxopt="swing" title="long-short eighths, as jazz is played">swing</button>
      <button class="tbtn" data-plxopt="chords" title="sound the chord symbols under the notes too — bars with only a symbol always sound it" hidden>chord symbols</button>
      <button class="tbtn" data-plxopt="follow" title="scroll the page along with the music">follow</button>
      <label class="mono plx-from">from bar <input class="inp sm mono" type="number" min="0" data-plxfrom placeholder="1"></label>
      <button class="tbtn" data-plxwritten title="the tempo the score marks">as marked</button>
      <span class="plx-mutes" data-plxmutes></span>
      ${typeof grandPianoCreditHTML === 'function' ? grandPianoCreditHTML() : ''}
    </div>`}
  </div>`;
}

function scorePlayAttach(bar, cfg){
  if(!bar) return null;
  const store = cfg.store || {get: () => ({}), set(){}};
  if(typeof grandPianoWarm === 'function') grandPianoWarm();
  const saved = Object.assign({bpm: null, loop: false, countIn: false, click: false,
    swing: cfg.swing ? 0.64 : 0, follow: true, muted: []}, store.get() || {});
  let tl = null, tlXml = null, player = null, geo = null, geoKey = '', geoOsmd = null, raf = 0, lastPerf = -1, fromBar = null;
  const $b = s => bar.querySelector(s);
  const timeline = () => {
    const xml = cfg.xml();
    if(!xml) return null;
    if(xml !== tlXml){ tl = musicXmlTimeline(xml); tlXml = xml; geo = null;
      /* the numbers the engraver shows, where it has them, so "bar 12" is the
         bar marked 12 on the page */
      try { const sm = cfg.osmd() && cfg.osmd().Sheet && cfg.osmd().Sheet.SourceMeasures;
        if(sm && sm.length === tl.measures.length) tl.perf.forEach(p => { const n = sm[p.k] && sm[p.k].MeasureNumber; if(n != null) p.number = n; });
      } catch(e){} }
    return tl;
  };
  const writtenBpm = () => { const t = tl || (() => { try { return timeline(); } catch(e){ return null; } })();
    if(t && t.tempos[0].assumed && cfg.defaultBpm) return cfg.defaultBpm;
    return t ? Math.round(t.tempos[0].bpm) : (cfg.defaultBpm || PLX_DEFAULT_BPM); };
  const bpmNow = () => Math.round(saved.bpm || writtenBpm());
  const save = () => { try { store.set(Object.assign({}, saved)); } catch(e){} };
  const rangeIdx = () => {
    const t = timeline(); if(!t) return [0, 0];
    const r = cfg.range ? cfg.range() : null;
    if(!r) return [0, t.perf.length - 1];
    const a = t.perf.findIndex(p => p.number >= r[0]);
    let z = -1; t.perf.forEach((p, i) => { if(p.number <= r[1] && i >= a) z = i; });
    return a < 0 || z < a ? [0, t.perf.length - 1] : [a, z];
  };
  const where = (i, q) => {
    const t = tl; const el = $b('[data-plxwhere]'); if(!el || !t) return;
    const [a, z] = rangeIdx();
    const pm = t.perf[i];
    el.textContent = pm ? `bar ${pm.number} · ${i - a + 1} of ${z - a + 1}` : `${z - a + 1} bars`;
  };
  const paintTempo = () => {
    const v = bpmNow(), r = $b('[data-plxbpm]'), b = $b('[data-plxbpmv]');
    if(r) r.value = v; if(b) b.textContent = v;
    const w = $b('[data-plxwritten]'); if(w){ const wb = writtenBpm(); w.disabled = !saved.bpm || saved.bpm === wb;
      w.textContent = `as marked (${wb}${tl && tl.tempos[0].assumed ? ', none marked' : ''})`; }
  };
  const paintOpts = () => {
    $$('[data-plxopt]', bar).forEach(b => { const k = b.dataset.plxopt; b.classList.toggle('on', !!saved[k]); b.setAttribute('aria-pressed', saved[k] ? 'true' : 'false'); });
    const ch = $b('[data-plxopt="chords"]');
    if(ch){ let t0 = null; try { t0 = timeline(); } catch(e){} ch.hidden = !(t0 && t0.chords); }
    const mutes = $b('[data-plxmutes]');
    const t = (() => { try { return timeline(); } catch(e){ return null; } })();
    if(mutes && t){
      const chips = [];
      t.parts.forEach((p, pi) => {
        if(t.parts.length > 1) chips.push({key: `p:${pi}`, label: p.name});
        if(p.staves === 2){ const piano = /piano|keyboard|klavier|pno/i.test(p.name) || t.parts.length === 1;
          chips.push({key: `p:${pi}:s:1`, label: piano ? `${t.parts.length > 1 ? p.name + ' ' : ''}right hand` : `${p.name} upper`});
          chips.push({key: `p:${pi}:s:2`, label: piano ? `${t.parts.length > 1 ? p.name + ' ' : ''}left hand` : `${p.name} lower`}); }
      });
      mutes.innerHTML = chips.length ? `<span class="mono faint">hear</span>${chips.map(c =>
        `<button class="tbtn${saved.muted.includes(c.key) ? '' : ' on'}" data-plxmute="${esc(c.key)}" aria-pressed="${saved.muted.includes(c.key) ? 'false' : 'true'}">${esc(c.label)}</button>`).join('')}` : '';
      $$('[data-plxmute]', mutes).forEach(b => b.onclick = () => {
        const k = b.dataset.plxmute;
        saved.muted = saved.muted.includes(k) ? saved.muted.filter(x => x !== k) : saved.muted.concat([k]);
        if(player) player.set('muted', new Set(saved.muted));
        save(); paintOpts(); });
    }
  };
  const goSay = () => { const g = $b('[data-plxgo]'); if(!g) return;
    const on = !!(player && player.running);
    g.textContent = on ? '❚❚ Pause' : (player && player.paused ? '▶ Resume' : '▶ Play');
    bar.classList.toggle('playing', on); };
  /* the lit bar and the playhead */
  const layer = () => {
    const host = cfg.host; if(!host || !host.isConnected) return null;
    let hl = host.querySelector(':scope > .plx-hl');
    if(!hl){ if(getComputedStyle(host).position === 'static') host.style.position = 'relative';
      hl = document.createElement('div'); hl.className = 'plx-hl'; hl.innerHTML = '<i class="plx-head"></i>'; hl.hidden = true;
      host.appendChild(hl); }
    return hl;
  };
  const geometry = () => {
    const osmd = cfg.osmd && cfg.osmd(); const host = cfg.host;
    if(!osmd || !host) return null;
    const root = cfg.svgRoot || host;
    const svg = root.querySelector('svg');
    const key = `${svg ? svg.getAttribute('width') + 'x' + svg.getAttribute('height') : ''}|${root.querySelectorAll('svg').length}|${osmd.zoom}|${host.clientWidth}`;
    if(!geo || key !== geoKey || geoOsmd !== osmd){ geo = plxGeometry(osmd, host, root); geoKey = key; geoOsmd = osmd; }
    return geo;
  };
  const paintAt = q => {
    const t = tl; if(!t || !player) return;
    const pm = player.perfAt(q); if(!pm) return;
    const hl = layer(); if(!hl) return;
    if(pm.i !== lastPerf){ where(pm.i, q); }
    let g = (geometry() || new Map()).get(pm.k);
    if(g && cfg.onPage && !g.shown){ cfg.onPage(g.page); geo = null; g = (geometry() || new Map()).get(pm.k); }
    if(!g){ hl.hidden = true; lastPerf = pm.i; return; }
    hl.hidden = false;
    hl.style.left = g.x + 'px'; hl.style.top = (g.y - 6) + 'px'; hl.style.width = g.w + 'px'; hl.style.height = (g.h + 12) + 'px';
    /* the playhead runs from one moment with a note to the next */
    const inBar = q - pm.q0, es = g.entries;
    let x = es.length ? es[0].x : g.x + 8;
    for(let j = 0; j < es.length; j++){
      if(es[j].q <= inBar + 1e-6){
        const nx = j + 1 < es.length ? es[j + 1] : {q: pm.len, x: g.x + g.w - 4};
        const span = nx.q - es[j].q;
        x = es[j].x + (span > 0 ? (nx.x - es[j].x) * Math.min(1, (inBar - es[j].q) / span) : 0);
      }
    }
    const head = hl.firstElementChild; if(head) head.style.left = Math.max(0, x - g.x - 1) + 'px';
    if(pm.i !== lastPerf && saved.follow){
      try { hl.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'smooth'}); } catch(e){}
    }
    lastPerf = pm.i;
  };
  const loop = () => {
    raf = 0;
    if(!player || !player.running) return;
    /* the page was drawn again under it: a new bar for the same music takes
       the playing over (see below); left alone for a second, it stops */
    if(!bar.isConnected){ ctl._goneAt = ctl._goneAt || performance.now();
      if(performance.now() - ctl._goneAt > 2500){ ctl.stop(); return; } }
    else paintAt(player.position());
    raf = requestAnimationFrame(loop);
  };
  const clearHl = () => { const h = cfg.host && cfg.host.querySelector(':scope > .plx-hl'); if(h) h.hidden = true; lastPerf = -1; };
  const ctl = {
    stop(fromOutside){ if(raf) cancelAnimationFrame(raf); raf = 0;
      if(player){ player.stop(); player = null; } clearHl(); goSay();
      const t = tl; if(t) where(-1); if(_plxNow === ctl && !fromOutside) _plxNow = null; },
    play(fromQ){
      /* the first press in a session: the piano's recordings are decoded
         first (a moment), so what starts is the piano and not its stand-in */
      if(typeof grandPianoSettled === 'function' && !grandPianoSettled()){
        const w = $b('[data-plxwhere]'); if(w) w.textContent = 'tuning the piano…';
        grandPianoLoad().then(() => { if(bar.isConnected) ctl.play(fromQ); });
        return;
      }
      let t;
      try { t = timeline(); } catch(e){ toast(e.message || 'That score could not be read for playing.'); return; }
      if(!t || !t.playable){ toast('There are no notes in this to play.'); return; }
      if(_plxNow && _plxNow !== ctl) scorePlayStopAll();
      const [a, z] = rangeIdx();
      if(player) player.stop();
      player = scorePlayer(t, {bpm: bpmNow(), swing: saved.swing ? (typeof saved.swing === 'number' ? saved.swing : 0.64) : 0,
        from: a, to: z, loop: saved.loop, countIn: saved.countIn, click: saved.click, chords: !!saved.chords, muted: new Set(saved.muted),
        onEnd: () => { const c = _plxNow; if(c && c.player === pl) c.stop(); }});
      const pl = player;
      let q = fromQ;
      if(q == null && fromBar != null){ const pm = t.perf.slice(a, z + 1).find(p => p.number >= fromBar); if(pm) q = pm.q0; }
      if(!player.start(null, q)){ toast('This browser cannot make sound.'); player = null; return; }
      _plxNow = ctl; lastPerf = -1;
      goSay();
      if(!raf) raf = requestAnimationFrame(loop);
    },
    pause(){ if(!player || !player.running) return; const q = player.pause(); ctl._at = q;
      if(raf) cancelAnimationFrame(raf); raf = 0; goSay(); },
    toggle(){ if(player && player.running) ctl.pause();
      else if(player && player.paused){ const q = ctl._at; player.stop(); player = null; ctl.play(q); }
      else ctl.play(); },
    /* a press on a bar while it plays is "from here" */
    jumpTo(k){ const t = tl; if(!t) return;
      const [a, z] = rangeIdx();
      const pm = t.perf.slice(a, z + 1).find(p => p.k === k);
      if(pm) ctl.play(pm.q0); },
    get player(){ return player; }, get timeline(){ return tl; },
    refresh(){ tl = null; tlXml = null; geo = null; paintTempo(); paintOpts(); try { timeline(); where(-1); } catch(e){} },
    /* the engraving was drawn again — another key, another size: what is
       playing carries on from the same place in the new notes */
    redrawn(){
      geo = null;
      /* the same notes drawn bigger, or with a part hidden: nothing to hear differently */
      let same = false; try { same = cfg.xml() === tlXml; } catch(e){}
      if(same){ paintTempo(); return; }
      const q = player && player.running ? player.position() : null;
      tl = null; tlXml = null;
      try { timeline(); } catch(e){ ctl.stop(); return; }
      paintTempo(); paintOpts();
      if(q != null) ctl.play(q); else where(-1); }
  };
  $b('[data-plxgo]').onclick = () => { sound('click'); ctl.toggle(); };
  $b('[data-plxstop]').onclick = () => { ctl.stop(); ctl._at = null; };
  const r = $b('[data-plxbpm]');
  r.oninput = () => { saved.bpm = +r.value; $b('[data-plxbpmv]').textContent = r.value;
    if(player) player.set('bpm', saved.bpm); paintTempo(); };
  r.onchange = save;
  const more = $b('[data-plxmore]');
  if(more) more.onclick = () => { const box = $b('[data-plxopts]'); box.hidden = !box.hidden;
    more.setAttribute('aria-expanded', box.hidden ? 'false' : 'true'); if(!box.hidden) paintOpts(); };
  $$('[data-plxopt]', bar).forEach(b => b.onclick = () => {
    const k = b.dataset.plxopt;
    saved[k] = k === 'swing' ? (saved.swing ? 0 : 0.64) : !saved[k];
    if(player && player.running){
      if(k === 'swing') player.set('swing', saved.swing);
      else if(k === 'loop') player.set('loop', saved.loop);
      else if(k === 'chords') player.set('chords', saved.chords);
      else if(k === 'click'){ const q = player.position(); ctl.play(q); }
    }
    save(); paintOpts(); });
  const fr = $b('[data-plxfrom]');
  if(fr) fr.onchange = () => { const n = parseInt(fr.value, 10); fromBar = isFinite(n) ? n : null; };
  const wr = $b('[data-plxwritten]');
  if(wr) wr.onclick = () => { saved.bpm = null; save(); paintTempo(); if(player) player.set('bpm', bpmNow()); };
  /* while it plays, a press on the engraving moves it to that bar */
  if(cfg.host && !cfg.host._plxBound){
    cfg.host._plxBound = true;
    cfg.host.addEventListener('click', ev => {
      const c = (_plxNow && _plxNow._host === cfg.host) ? _plxNow : cfg.host._plxCtl;
      if(!c || !c.player || !c.player.running) return;
      const g = (() => { try { return c._geo(); } catch(e){ return null; } })();
      if(!g) return;
      const hr = cfg.host.getBoundingClientRect();
      const px = ev.clientX - hr.left - cfg.host.clientLeft + cfg.host.scrollLeft, py = ev.clientY - hr.top - cfg.host.clientTop + cfg.host.scrollTop;
      const hit = [...g.values()].find(b => b.shown && px >= b.x && px <= b.x + b.w && py >= b.y - 10 && py <= b.y + b.h + 10);
      if(hit){ ev.stopPropagation(); ev.preventDefault(); c.jumpTo(hit.k); }
    }, true);
  }
  if(cfg.host) cfg.host._plxCtl = ctl;
  ctl._geo = geometry; ctl._host = cfg.host;
  ctl.adopt = old => {
    const p = old._handOver(); if(!p) return;
    const [a, z] = rangeIdx();
    /* the same bars: carry straight on. A new focus: the same place, in the new range */
    if(p.opts.from === a && p.opts.to === z){ player = p; _plxNow = ctl; lastPerf = -1; goSay(); if(!raf) raf = requestAnimationFrame(loop); return; }
    const q = p.position(); p.stop(); ctl.play(q);
  };
  ctl._handOver = () => { const p = player; player = null; if(raf) cancelAnimationFrame(raf); raf = 0; return p; };
  ctl._xml = () => tlXml;
  paintTempo(); paintOpts();
  /* a page of words with a staff under them has nothing to hear, and a ▶
     that plays silence is worse than no ▶ */
  try { const t0 = timeline(); bar.hidden = !(t0 && t0.playable); where(-1); paintTempo(); }
  catch(e){ const w = $b('[data-plxwhere]'); if(w) w.textContent = 'cannot be read for playing'; }
  /* The music that was playing where this bar now is — the same bar drawn
     over, or a page drawn again: the same notes carry straight on; the same
     piece in another key (or another example) goes on from the same place
     in the new notes. */
  const takeOver = old => {
    if(!old || old === ctl) return;
    if(!old.player || !old.player.running){ if(old.player) old.stop(); return; }
    if(old._xml() === tlXml && tlXml){ ctl.adopt(old); return; }
    const q = old.player.position(); old.stop();
    if(tl && q < tl.length) ctl.play(q);
  };
  const prior = bar._plx;
  bar._plx = ctl;
  takeOver(prior);
  const was = _plxNow;
  if(was && was !== ctl && was._bar && !was._bar.isConnected) takeOver(was);
  ctl._bar = bar;
  return ctl;
}
/* space bar: play and pause whichever score is on the page, unless you are typing */
addEventListener('keydown', ev => {
  if(ev.code !== 'Space' || ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const t = ev.target;
  if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
  if(ev.defaultPrevented || document.querySelector('#modals .overlay')) return;
  /* reading a score, space turns the page — a page-turning pedal sends it */
  if(typeof scoreUi === 'function' && scoreUi().reading && parseHash().name === 'score') return;
  const bars = [...document.querySelectorAll('.plx-bar')].filter(b => b._plx && b.offsetParent !== null);
  if(!bars.length) return;
  const b = (_plxNow && bars.find(x => x._plx === _plxNow)) || bars[0];
  ev.preventDefault();
  b._plx.toggle();
});

/* A bar just before `anchor`, made once and reused, attached to what is
   drawn in `host`. The Jazz Studio's scores all come through here. */
function scorePlayBarBefore(anchor, cfg){
  if(!anchor || !anchor.parentNode) return null;
  let bar = anchor.previousElementSibling;
  if(!bar || !bar.classList.contains('plx-bar')){
    const t = document.createElement('div'); t.innerHTML = scorePlayBarHTML(cfg.bar).trim();
    bar = t.firstElementChild; anchor.parentNode.insertBefore(bar, anchor);
  }
  return scorePlayAttach(bar, cfg);
}
