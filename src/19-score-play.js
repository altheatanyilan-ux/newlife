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
 *   events:[{q, d, midi, vel, part, staff, voice, perf, inBar, grace, perc, staccato, arp, pizz, slur}],
 *   tempos:[{q, bpm}] (performance time), bpm (the first marked tempo, or null),
 *   length (quarters)}
 */
/* A hairpin is a change of loudness across the notes under it, not a
   loudness that jumps at the next dynamic. Each note under one is moved
   from where the hairpin starts towards where it arrives: the next dynamic,
   if the part marks one on the note straight after, or else about a third
   louder (or softer) than it began. */
function plxShapeWedges(perBar, wedges){
  const posOf = (k, at) => k * 1e4 + at;
  wedges.forEach(w => {
    const a = posOf(w.k, w.at), z = posOf(w.k2, w.at2);
    if(!(z > a)) return;
    const under = [], after = [];
    perBar.forEach((ns, k) => ns.forEach(n => { if(n.grace || n.perc) return; const p = posOf(k, n.at);
      if(p >= a - 1e-6 && p < z - 1e-6) under.push({n, p}); else if(p >= z - 1e-6) after.push({n, p}); }));
    if(under.length < 2) return;
    under.sort((x, y) => x.p - y.p); after.sort((x, y) => x.p - y.p);
    const v0 = under[0].n.vel, next = after.length ? after[0].n.vel : null;
    let v1 = v0 * (1 + 0.35 * w.dir);
    if(next != null && (next - v0) * w.dir > 0.02) v1 = next;
    v1 = Math.max(0.05, Math.min(1, v1));
    const span = under[under.length - 1].p - under[0].p || 1;
    under.forEach(({n, p}) => { n.vel = Math.max(0.05, Math.min(1, n.vel + (v1 - v0) * (p - under[0].p) / span)); });
  });
}
function musicXmlTimeline(xml){
  const doc = typeof xml === 'string' ? new DOMParser().parseFromString(xml, 'application/xml') : xml;
  if(!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length)
    throw new Error('That is not MusicXML this can read.');
  const root = doc.documentElement;
  const timewise = root.nodeName === 'score-timewise';
  if(root.nodeName !== 'score-partwise' && !timewise) throw new Error('That is not a MusicXML score.');
  /* the parts, and each part's bars as the elements holding their contents */
  const list = plxKid(root, 'part-list');
  const names = {}, instr = {};
  plxKids(list, 'score-part').forEach(sp => { const id = sp.getAttribute('id');
    names[id] = plxText(sp, 'part-name') || id;
    /* what it is played on: a General MIDI program, and the instrument's name */
    const si = plxKid(sp, 'score-instrument'), mi = plxKid(sp, 'midi-instrument');
    instr[id] = {instrumentName: si ? plxText(si, 'instrument-name') : '', program: mi ? plxNum(mi, 'midi-program', 0) : 0,
      channel: mi ? plxNum(mi, 'midi-channel', 0) : 0}; });
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
  const barHeld = new Array(nBars).fill(0), barPadded = new Array(nBars).fill(false);  /* what the bar holds, if it was padded out */
  const barInfo = [...Array(nBars)].map(() => ({}));
  const tempoIn = [...Array(nBars)].map(() => []);  /* [{at, bpm}] */
  const harmIn = [...Array(nBars)].map(() => []);   /* [{at, sym}] */
  const hasNotes = new Array(nBars).fill(false);
  const pedalIn = partIds.map(() => [...Array(nBars)].map(() => []));  /* [{at, down}] */
  partIds.forEach((pid, pi) => {
    const bars = byPart.get(pid);
    let div = 1, chrom = 0, octShift = 0, vel = PLX_DEFAULT_VEL, staves = 1;
    let beats = 4, beatType = 4;
    /* how the part is being played, as the score says it: plucked from a
       "pizz." until an "arco"; the slurs open (a note inside one is joined
       to the next, not detached); the hairpins, shaped over their notes
       once the part has been read */
    let pizz = false, wedge = null;
    const slurs = new Set(), wedges = [];
    const perBar = [];
    for(let k = 0; k < nBars; k++){
      const bar = bars[k];
      const notes = [];
      perBar.push(notes);
      if(!bar) continue;
      let pos = 0, maxPos = 0, lastOnset = 0, soundEnd = 0;
      const info = barInfo[k];
      const sound = (s, at) => {
        if(!s) return;
        const t = parseFloat(s.getAttribute('tempo'));
        if(isFinite(t) && t > 0) tempoIn[k].push({at, bpm: t, sound: true});
        const d = parseFloat(s.getAttribute('dynamics'));
        if(isFinite(d)) vel = Math.max(0.05, Math.min(1, d / 90 * 0.6));
        const pz = s.getAttribute('pizzicato');
        if(pz === 'yes') pizz = true; else if(pz === 'no') pizz = false;
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
          soundEnd = Math.max(soundEnd, onset + dur);
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
          /* in a slur already, or the first note of one: joined to what follows */
          const sl = plxKids(nots, 'slur');
          const slurred = !chord && (slurs.size > 0 || sl.some(x => x.getAttribute('type') === 'start'));
          if(!chord) sl.forEach(x => { const n = x.getAttribute('number') || '1', ty = x.getAttribute('type');
            if(ty === 'start') slurs.add(n); else if(ty === 'stop') slurs.delete(n); });
          const tech = plxKid(nots, 'technical');
          notes.push({at: onset, d: dur, midi: Math.round(midi), vel: v, part: pi,
            pizz: pizz || has(tech, 'pizzicato') || undefined, slur: slurred || undefined,
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
              if(sym) harmIn[k].push({at, sym, part: pi, words: true});
              /* what the words say about the tempo (a section tempo can ramp
                 through a rit.), and a road sign written only as words */
              const txt = w.textContent.trim();
              if(/\bpizz/i.test(txt)) pizz = true;
              else if(/\b(arco|col arco|coll'arco)\b/i.test(txt)) pizz = false;
              if(!sym && txt){
                if(/\b(rit|ritard|ritardando|rall|rallentando|allarg|allargando)\b/i.test(txt)) info.tempoWord = info.tempoWord || 'rit';
                else if(/\baccel/i.test(txt)) info.tempoWord = info.tempoWord || 'accel';
                info.words = (info.words ? info.words + ' ' : '') + txt;
              } });
            const dyn = plxKid(dt, 'dynamics');
            if(dyn){ const k0 = [...dyn.children].map(x => x.nodeName).find(n => PLX_DYN[n] != null);
              if(k0) vel = PLX_DYN[k0]; }
            const wd = plxKid(dt, 'wedge');
            if(wd){ const ty = wd.getAttribute('type');
              if(ty === 'crescendo' || ty === 'diminuendo') wedge = {dir: ty === 'crescendo' ? 1 : -1, k, at};
              else if(ty === 'stop' && wedge){ wedges.push(Object.assign(wedge, {k2: k, at2: at})); wedge = null; } }
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
      /* A bar whose voices overrun its time signature is almost always an
         encoding slip, not music: rests left over as padding (common from
         MuseScore), or tuplets written with their unscaled durations. Left
         as it is, every later bar is out of step with the music. Only rests
         over: the bar is its time signature's length. Notes over by no more
         than a quarter of the bar: this part's bar is compressed to fit.
         Anything longer (a cadenza written in one bar) is kept as written. */
      let fit = maxPos;
      if(!bar.implicit && maxPos > nominal + 1e-6){
        if(soundEnd <= nominal + 0.02) fit = nominal;
        else if(maxPos <= nominal * 1.26){
          const f = nominal / maxPos;
          notes.forEach(n => { n.at *= f; n.d *= f; });
          harmIn[k].forEach(h => { if(h.part === pi) h.at *= f; });
          pedalIn[pi][k].forEach(e => { e.at *= f; });
          fit = nominal;
        }
      }
      /* A first bar with less in it than its time signature is a pickup,
         and a last bar so is its complement, whether or not the file says
         "implicit" (exports forget to): it lasts what it holds, not a
         silent full bar — which would put every later bar out of step */
      const shortEdge = (k === 0 || k === nBars - 1) && maxPos > 1e-6 && maxPos < nominal - 1e-6;
      const got = bar.implicit || shortEdge ? (maxPos || nominal) : Math.max(fit, nominal);
      barLen[k] = Math.max(barLen[k], got);
      barHeld[k] = Math.max(barHeld[k], fit);
      if(got > fit + 1e-6) barPadded[k] = true;
    }
    plxShapeWedges(perBar, wedges);
    parts.push(Object.assign({id: pid, name: names[pid] || pid, staves}, instr[pid] || {}));
    raw.push(perBar);
  });
  /* A bar split in two by a repeat sign or an ending — the last beats of
     a section, then its upbeat after the double bar — is two short bars,
     and each lasts what it holds: padded out to a full bar, the music
     would stop for a beat at every repeat. A short bar counts as split
     when it touches a repeat or an ending, or when it and its neighbour
     make one whole bar between them; a short bar anywhere else is an
     encoding slip and stays a full bar. */
  const nominalOf = k => { const g = barSig[k] || {beats: 4, beatType: 4}; return g.beats * 4 / g.beatType; };
  const shortAt = k => k >= 0 && k < nBars && barHeld[k] > 1e-6 && barHeld[k] < nominalOf(k) - 1e-6;
  for(let k = 1; k < nBars - 1; k++){
    if(!barPadded[k] || !shortAt(k) || barLen[k] > nominalOf(k) + 1e-6) continue;
    const I = barInfo[k], N = barInfo[k + 1] || {};
    const byRepeat = I.back || I.fwd || I.ending || I.endingStop || N.fwd || N.ending;
    const pairs = j => shortAt(j) && Math.abs(barHeld[k] + barHeld[j] - nominalOf(k)) < 1e-3;
    if(byRepeat || pairs(k - 1) || pairs(k + 1)) barLen[k] = barHeld[k];
  }
  /* each part's instrument, where this build carries one; the piano otherwise */
  const allNames = parts.map(p => p.name);
  parts.forEach(p => { p.inst = p.channel === 10 ? 'drums' : typeof instrumentFor === 'function' ? instrumentFor(p, allNames) : 'piano'; });
  /* an orchestra: sections where a symphony has sections and the soloist
     alone, each part in its seat, and the hall they share */
  if(typeof instrumentsOrchestrate === 'function') instrumentsOrchestrate(parts);
  const measures = [...Array(nBars)].map((_, k) => {
    const b0 = byPart.get(partIds[0])[k];
    const n = b0 ? parseInt(b0.number, 10) : NaN;
    return {k, number: isFinite(n) ? n : k + 1, len: barLen[k] || 4,
      beats: (barSig[k] || {}).beats || 4, beatType: (barSig[k] || {}).beatType || 4,
      tempoWord: barInfo[k].tempoWord || null};
  });

  /* ---- the road map: which bars, in what order ---- */
  const order = plxRoadMap(barInfo);
  /* and where it may not be what the page says: said, never stopped for */
  const issues = plxRoadIssues(barInfo, order).map(v => ({k: v.k, number: measures[v.k].number, why: v.why}));

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
  return {parts, measures, order, perf, events: keep, tempos, bpm: firstBpm, length: q, issues, barInfo,
    chords: keep.some(e => e.chord), playable: keep.some(e => !e.chord || e.auto)};
}
/* The places the road map cannot follow the page: a D.C. or D.S. written only
   as words (nothing in the file says to play it), a D.S. with no sign, a
   To Coda with no coda, an ending that is never reached. It plays what it
   can; these are only said. */
function plxRoadIssues(info, order){
  const out = [], seen = new Set(order);
  const say = (k, why) => { if(!out.some(v => v.k === k && v.why === why)) out.push({k, why}); };
  info.forEach((b, k) => {
    const w = b.words || '';
    if(/\bD\.\s?C\.|\bda capo\b/i.test(w) && !b.dacapo) say(k, 'a D.C. written only as words — played straight on');
    if(/\bD\.\s?S\.|\bdal segno\b/i.test(w) && !b.dalsegno) say(k, 'a D.S. written only as words — played straight on');
    if(/\bto coda\b/i.test(w) && !b.tocoda) say(k, 'a To Coda written only as words');
    if(b.dalsegno && !info.some(x => x.segno)) say(k, 'a D.S. with no sign to go back to — from the top instead');
    if(b.tocoda && !info.some(x => x.coda || x.codaMark)) say(k, 'a To Coda with no coda');
    if(b.ending && !seen.has(k)) say(k, 'an ending that is never reached');
  });
  if(order.length >= 20000) say(0, 'repeats that do not end');
  return out.sort((a, b) => a.k - b.k);
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
    if(j > k && info[j].ending) j--;
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
  /* and a limiter just under full scale after it: a full orchestra's
     forte chord is the one moment the mix could clip, and a clipped chord
     is the harshest sound a player makes. Below about -1 dB it does nothing. */
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -1.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.12;
  master.connect(dry); dry.connect(comp);
  if(verb){ master.connect(wet); wet.connect(verb); verb.connect(comp); }
  comp.connect(lim); lim.connect(ctx.destination);
  return {input: master, stop(){ try { master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04); } catch(e){}
    setTimeout(() => { try { master.disconnect(); comp.disconnect(); lim.disconnect(); } catch(e){} }, 2000); }};
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
/* A drum kit, synthesised, for the Jazz Studio's band (General MIDI
   numbers): the kick a pitched thud falling, the snare a crack of band-passed
   noise over a low tone, the cross-stick a dry click, the hi-hat and the
   ride metal — six square waves at inharmonic ratios through a band-pass,
   which is what a cymbal's spectrum is — and a brush (25) a swell of soft
   noise rather than a hit. Anything else is the old stand-in. */
const PLX_METAL = [1, 1.483, 1.932, 2.546, 2.63, 3.897];
function plxKit(ctx, dest, midi, t, vel, dur){
  /* the recorded kit, where the page carries it and it is loaded */
  if(typeof orchKitHit === 'function' && orchKitHit(ctx, dest, midi, t, vel, dur)) return;
  const v = Math.max(0.03, Math.min(1, vel == null ? 0.6 : vel));
  const noise = (type, freq, q, peak, decay, attack) => {
    const n = ctx.createBufferSource(); n.buffer = plxNoise(ctx); n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    if(attack){ g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + attack); }
    else g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (attack || 0) + decay);
    n.connect(f); f.connect(g); g.connect(dest); n.start(t); n.stop(t + (attack || 0) + decay + 0.03);
  };
  const tone = (type, f0, f1, peak, decay) => {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if(f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.12, decay));
    const g = ctx.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + decay + 0.03);
  };
  const metal = (base, peak, decay, band) => {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = band; bp.Q.value = 0.8;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = band * 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    bp.connect(hp); hp.connect(g); g.connect(dest);
    PLX_METAL.forEach(r => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = base * r;
      o.connect(bp); o.start(t); o.stop(t + decay + 0.03); });
  };
  switch(midi){
    case 35: case 36: tone('sine', 120, 44, 0.95 * v, 0.34); noise('lowpass', 1400, 0.5, 0.12 * v, 0.02); return;
    case 37: noise('bandpass', 2300, 3, 0.55 * v, 0.045); tone('triangle', 820, 780, 0.22 * v, 0.03); return;
    case 38: case 40: noise('bandpass', 1900, 0.8, 0.5 * v, 0.17); tone('triangle', 190, 160, 0.3 * v, 0.08); return;
    case 25: noise('bandpass', 3400, 0.6, 0.16 * v, Math.max(0.2, (dur || 0.5) * 0.8), 0.1); return;
    case 42: metal(400, 0.055 * v, 0.05, 9000); noise('highpass', 8000, 0.7, 0.05 * v, 0.04); return;
    case 44: metal(400, 0.045 * v, 0.06, 7500); noise('highpass', 6500, 0.7, 0.05 * v, 0.05); return;
    case 46: metal(400, 0.05 * v, 0.35, 9000); noise('highpass', 7500, 0.7, 0.05 * v, 0.3); return;
    case 51: case 59: metal(380, 0.05 * v, 0.9, 7200); noise('bandpass', 9000, 1, 0.025 * v, 0.45); return;
    case 53: metal(560, 0.07 * v, 1.2, 5200); return;
    case 49: case 57: metal(330, 0.06 * v, 1.6, 6500); noise('highpass', 5000, 0.6, 0.08 * v, 1.4); return;
    default: plxDrum(ctx, dest, midi, t, vel);
  }
}
/* The count and the click: the score room metronome's wooden click (a
   struck block — noise through a tight band-pass), the downbeat a fifth
   higher and louder unless the accent is off. */
function plxClick(ctx, dest, t, accent){
  const dur = 0.035;
  const n = ctx.createBufferSource(); n.buffer = plxNoise(ctx);
  const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = accent ? 2400 : 1600; band.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? 0.55 : 0.34, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(band); band.connect(g); g.connect(dest); n.start(t); n.stop(t + dur + 0.01);
}

/* ---------- the tempo map ----------
   The score's own tempo marks, and on top of them what the player is told:
   a section played at a tempo of your own (steady, or ramping from one tempo
   to another for a rit. or an accel.), and a fermata held longer than
   written — which is the whole ensemble slowing for the length of the held
   note, so every part waits together. Stored as stretches in which the tempo
   is steady or moves in a straight line, with the seconds up to the start of
   each worked out once, so asking how long anything takes is a lookup.
   Everything is at 100%; the tempo percentage divides the seconds. */
function plxTempoMap(tl, o){
  const base = tl.tempos.length ? tl.tempos : [{q: 0, bpm: PLX_DEFAULT_BPM}];
  const markAt = q => { let b = base[0].bpm; for(const t of base){ if(t.q <= q + 1e-9) b = t.bpm; else break; } return b; };
  const overrides = (o.overrides || []).filter(v => v && v.q1 > v.q0 && v.start > 0);
  const hold = typeof o.fermata === 'number' && o.fermata > 1 ? o.fermata : null;
  const fermatas = hold ? tl.events.filter(e => e.fermata && !e.chord && !e.grace && e.d > 0) : [];
  const cuts = new Set([0, tl.length + 64]);
  base.forEach(t => cuts.add(t.q));
  overrides.forEach(v => { cuts.add(v.q0); cuts.add(v.q1); });
  fermatas.forEach(e => { cuts.add(e.q); cuts.add(e.q + e.d); });
  const xs = [...cuts].filter(x => x >= 0).sort((a, b) => a - b);
  const bpmOf = (q, edge) => {
    /* edge: 'start' reads the stretch that begins at q, 'end' the one that ends there */
    const at = edge === 'end' ? q - 1e-7 : q + 1e-7;
    let b = markAt(at);
    const ov = overrides.find(v => at >= v.q0 && at < v.q1);
    if(ov){ const f = (q - ov.q0) / (ov.q1 - ov.q0); b = ov.end > 0 ? ov.start + (ov.end - ov.start) * Math.max(0, Math.min(1, f)) : ov.start; }
    if(fermatas.some(e => at >= e.q && at < e.q + e.d)) b = b / hold;
    return b;
  };
  const segs = [];
  let cum = 0;
  for(let i = 0; i + 1 < xs.length; i++){
    const q0 = xs[i], q1 = xs[i + 1];
    if(q1 - q0 < 1e-9) continue;
    const b0 = bpmOf(q0, 'start'), b1 = bpmOf(q1, 'end');
    segs.push({q0, q1, b0, b1, t0: cum});
    cum += Math.abs(b1 - b0) < 1e-9 ? (q1 - q0) * 60 / b0 : 60 * (q1 - q0) / (b1 - b0) * Math.log(b1 / b0);
  }
  const segAt = q => { let lo = 0, hi = segs.length - 1;
    while(lo < hi){ const mid = (lo + hi + 1) >> 1; if(segs[mid].q0 <= q + 1e-12) lo = mid; else hi = mid - 1; }
    return segs[lo]; };
  const bpmAt = q => { const g = segAt(q); if(!g) return base[0].bpm; const f = (q - g.q0) / (g.q1 - g.q0); return g.b0 + (g.b1 - g.b0) * f; };
  /* seconds from the top to q, at 100% */
  const T = q => { const g = segAt(q); if(!g) return 0; const dq = q - g.q0;
    if(Math.abs(g.b1 - g.b0) < 1e-9) return g.t0 + dq * 60 / g.b0;
    const k = (g.b1 - g.b0) / (g.q1 - g.q0);
    return g.t0 + 60 / k * Math.log((g.b0 + k * dq) / g.b0); };
  /* the q at which T reaches t */
  const Q = t => { let lo = 0, hi = segs.length - 1;
    while(lo < hi){ const mid = (lo + hi + 1) >> 1; if(segs[mid].t0 <= t + 1e-12) lo = mid; else hi = mid - 1; }
    const g = segs[lo]; const dt = t - g.t0;
    if(Math.abs(g.b1 - g.b0) < 1e-9) return g.q0 + dt * g.b0 / 60;
    const k = (g.b1 - g.b0) / (g.q1 - g.q0);
    return g.q0 + (g.b0 * Math.exp(dt * k / 60) - g.b0) / k; };
  return {bpmAt, T, Q, first: base[0].bpm, segs};
}

/* ---------- the player ----------
   opts: {bpm (the tempo to take the score's first to; every later change and
   ramp keeps its proportion), swing (0 straight, else the long eighth's share
   of the beat), from/to (indexes into tl.perf), loop, countIn (bars: 0, 1, 2),
   click (false | 'beats' | 'downbeats'), accent (beat 1 of the click), chords,
   volume (the master), volumes ({'<part>': 0–1, '<part>:<staff>': 0–1}),
   muted (Set of 'p:<part>', 'p:<part>:s:<staff>', 'chords'), overrides
   ([{q0, q1, start, end}] section tempos at 100%), fermata (a hold, e.g. 2, or
   'wait'), gates (sorted quarter-note places to stop at until released),
   onGate(q), onEnd(), at (the audio-clock time to start at, so one run can
   follow another on the beat)}.
   Quarter notes are the unit of musical time throughout. */
function scorePlayer(tl, opts){
  const o = Object.assign({bpm: null, swing: 0, from: 0, to: tl.perf.length - 1, loop: false,
    countIn: 0, click: false, chords: false, accent: true, volume: 0.9, volumes: {}, muted: new Set(),
    overrides: [], fermata: 2, gates: null}, opts || {});
  if(o.countIn === true) o.countIn = 1;
  if(o.click === true) o.click = 'beats';
  let ctx = null, out = null, timer = null, running = false, paused = false, waiting = null;
  let anchorT = 0, anchorQ = 0, idx = 0, clickQ = 0, endQ = 0, startQ = 0, prevT = null, prevQ = 0, gateAt = 0;
  let ci = null;
  /* a performance's timing (19-sync-e-memory.js) in place of the score's
     tempo map: the same T/Q/bpmAt shape, beat by beat as it was played */
  let map = o.timing || plxTempoMap(tl, o);
  const factor = () => (o.bpm ? o.bpm / map.first : 1);
  const bpmAt = q => map.bpmAt(q) * factor();
  const secs = (qa, qb) => qb <= qa ? 0 : (map.T(qb) - map.T(qa)) / factor();
  const qAfter = (qa, s) => map.Q(map.T(qa) + s * factor());
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
  /* a gain for each part (and each staff of it), so a part is turned up or
     down while it plays without touching anything else */
  const gains = new Map();
  /* times the part's share of a full orchestra (instrumentsOrchestrate):
     thirteen parts at a forte are not thirteen times one part */
  const volOf = key => { const [pi, st] = key.split(':'); const v = o.volumes || {};
    const trim = (tl.parts[+pi] || {}).trim || 1;
    return Math.max(0, trim * (v[pi] == null ? 1 : +v[pi]) * (st != null && v[`${pi}:${st}`] != null ? +v[`${pi}:${st}`] : 1)); };
  /* An orchestra is heard in a hall, from its seats: each part through a
     panner to where it sits (the violins on the left, the cellos and basses
     on the right, the soloist in the middle), and a send from its own gain
     into one hall the whole orchestra shares — one reverberation for the
     room, not one per part, and turned down with the part it belongs to. */
  let hall = null;
  const hallIn = () => {
    if(hall !== null) return hall;
    hall = typeof orchHall === 'function' ? orchHall(ctx, out.input) : false;
    return hall;
  };
  const gainFor = e => {
    const key = e.chord ? 'chords' : `${e.part}:${e.staff}`;
    let g = gains.get(key);
    if(!g){ g = ctx.createGain(); g.gain.value = key === 'chords' ? 1 : volOf(key);
      const pt = e.chord ? null : tl.parts[e.part];
      let to = out.input;
      if(pt && pt.pan && ctx.createStereoPanner){ try { const pan = ctx.createStereoPanner(); pan.pan.value = pt.pan; pan.connect(out.input); to = pan; } catch(err){} }
      g.connect(to);
      if(pt && pt.hall > 0){ const h = hallIn(); if(h){ const send = ctx.createGain(); send.gain.value = pt.hall; g.connect(send); send.connect(h); g._hall = true; } }
      gains.set(key, g); }
    return g;
  };
  const voice = (e, dest, t0, d, held) => {
    if(e.perc){ if(e.kit) plxKit(ctx, dest, e.midi, t0, e.vel, d); else plxDrum(ctx, dest, e.midi, t0, e.vel); return; }
    const inst = e.chord ? 'piano' : ((tl.parts[e.part] || {}).inst || 'piano');
    if(inst !== 'piano' && inst !== 'drums' && typeof instrumentNote === 'function'
      && instrumentNote(ctx, dest, inst, e.midi, t0, d, e.vel, held, 1, {staccato: e.staccato, slur: e.slur, pizz: e.pizz, human: true})) return;
    plxPiano(ctx, dest, e.midi, t0, d, e.vel, held);
  };
  const at = q => anchorT + secs(anchorQ, q);
  const perfAt = q => { let lo = 0, hi = tl.perf.length - 1, best = tl.perf[0];
    while(lo <= hi){ const mid = (lo + hi) >> 1; if(tl.perf[mid].q0 <= q + 1e-9){ best = tl.perf[mid]; lo = mid + 1; } else hi = mid - 1; }
    return best; };
  const nextGate = q => { if(!o.gates || !o.gates.length) return Infinity;
    for(const g of o.gates) if(g > q + 1e-9 && g >= startQ - 1e-9 && g < endQ - 1e-9) return g; return Infinity; };
  const schedule = limit => {
    const until = limit != null ? limit : ctx.currentTime + 0.18;
    while(running && !waiting){
      const nextEventQ = idx < tl.events.length ? tl.events[idx].q : Infinity;
      const nextClickQ = o.click ? clickQ : Infinity;
      const nq = Math.min(nextEventQ, nextClickQ);
      /* a place to wait: everything before it is booked, then nothing until released */
      if(gateAt < Infinity && nq >= gateAt - 1e-9){
        const tg = at(gateAt);
        if(tg > until) return;
        waiting = {q: gateAt, t: tg};
        const g = gateAt;
        setTimeout(() => { if(waiting && waiting.q === g && o.onGate) o.onGate(g); }, Math.max(0, (tg - ctx.currentTime) * 1000));
        return;
      }
      /* the end of the range: the start again, or the end */
      if(nq >= endQ - 1e-9){
        const tEnd = at(endQ);
        if(tEnd > until) return;
        if(o.loop){ prevT = anchorT; prevQ = anchorQ; anchorT = tEnd; anchorQ = startQ; seek(startQ);
          if(o.onLoop) setTimeout(() => o.onLoop(), Math.max(0, (tEnd - ctx.currentTime) * 1000)); continue; }
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
        const down = !!pm && Math.abs(clickQ - pm.q0) < 1e-6;
        if(o.click !== 'downbeats' || down) plxClick(ctx, out.input, t, o.accent !== false && down);
        clickQ += step;
        if(pm && clickQ > pm.q0 + pm.len - 1e-6) clickQ = pm.q0 + pm.len;
        continue;
      }
      const e = tl.events[idx++];
      if(e.q < startQ - 1e-9 || !heard(e)) continue;
      const sw = swung(e);
      const t0 = at(sw.q) + (e.arp ? 0.03 * ((e.midi % 7) / 2) : 0) - (e.grace ? 0.07 : 0);
      if(t0 < ctx.currentTime - 0.05 && limit == null) continue;
      /* a held fermata note in "wait for me" rings until it is let go */
      const waitHold = o.fermata === 'wait' && e.fermata ? 6 : 0;
      const d = e.grace ? 0.07 : Math.max(0.04, secs(sw.q, sw.q + sw.d) * (e.staccato ? 0.45 : e.tenuto ? 1 : 0.94));
      const held = Math.max(d, waitHold, e.held ? secs(e.q, e.q + e.held) : 0);
      /* the performer's dynamics, where there is a memory of them */
      const pv = o.velOf && !e.chord ? o.velOf(e) : null;
      voice(pv != null ? Object.assign({}, e, {vel: pv}) : e, gainFor(e), Math.max(0, t0), waitHold ? Math.max(d, waitHold) : d, held);
    }
  };
  const seek = q => {
    let lo = 0, hi = tl.events.length;
    while(lo < hi){ const mid = (lo + hi) >> 1; if(tl.events[mid].q < q - 1e-9) lo = mid + 1; else hi = mid; }
    idx = lo;
    const pm = perfAt(q);
    const step = beatStep(pm);
    clickQ = pm ? pm.q0 + Math.ceil((q - pm.q0) / step - 1e-9) * step : q;
    gateAt = nextGate(q - 1e-6);
  };
  const api = {
    /* ctxIn: an OfflineAudioContext, for the smoke test to hear it */
    start(ctxIn, fromQ){
      ctx = ctxIn || plxAudioCtx(); if(!ctx) return false;
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const offline = !!(OAC && ctx instanceof OAC);
      if(!offline && ctx.resume) ctx.resume();
      out = plxOut(ctx, o.volume);
      gains.clear();
      [startQ, endQ] = rangeQ();
      const q0 = fromQ != null ? Math.max(startQ, Math.min(endQ - 0.01, fromQ)) : startQ;
      anchorT = o.at != null && !offline ? Math.max(+o.at, ctx.currentTime + 0.02) : ctx.currentTime + 0.08; anchorQ = q0;
      ci = null;
      const bars = Math.max(0, Math.min(2, +o.countIn || 0));
      if(bars){
        const pm = perfAt(q0), step = beatStep(pm), per = pm ? Math.max(1, Math.min(12, Math.round((pm.beats * 4 / pm.beatType) / step))) : 4;
        const n = per * bars, beat = step * 60 / bpmAt(q0);
        for(let i = 0; i < n; i++) plxClick(ctx, out.input, anchorT + i * beat, o.accent !== false && i % per === 0);
        ci = {t0: anchorT, beat, n, per};
        anchorT += n * beat;
      }
      seek(q0);
      running = true; paused = false; waiting = null;
      if(offline){ schedule(ctx.length / ctx.sampleRate); running = false; return true; }
      timer = setInterval(() => { try { schedule(); } catch(e){ console.warn('playback', e); } }, 25);
      schedule();
      return true;
    },
    stop(){ running = false; paused = false; waiting = null; if(timer) clearInterval(timer); timer = null; if(out) out.stop(); out = null; gains.clear(); },
    pause(){ if(!running) return null; const q = api.position(); paused = true; running = false; waiting = null;
      if(timer) clearInterval(timer); timer = null; if(out) out.stop(); out = null; gains.clear(); return q; },
    /* where the music is now, in quarter notes (before a count-in ends, where it will start) */
    position(){ if(!ctx) return startQ; const now = ctx.currentTime;
      if(waiting && now >= waiting.t) return waiting.q;
      if(now < anchorT) return prevT != null && now >= prevT ? Math.min(endQ, qAfter(prevQ, now - prevT)) : anchorQ;
      const q = qAfter(anchorQ, now - anchorT);
      if(o.loop && q >= endQ){ const span = endQ - startQ; return span > 0 ? startQ + ((q - startQ) % span) : startQ; }
      return Math.min(q, endQ); },
    /* waiting at a gate (a fermata held for you, a note you have not played yet) */
    get waiting(){ return waiting ? waiting.q : null; },
    release(){ if(!waiting || !ctx) return;
      const q = waiting.q; waiting = null;
      anchorQ = q; anchorT = Math.max(ctx.currentTime + 0.03, 0); prevT = null;
      gateAt = nextGate(q);
      if(running) schedule(); },
    /* a change heard at once: what is already booked (a fifth of a second)
       plays as booked; the rest is timed from here at the new setting */
    set(k, v){
      if(k === 'bpm' || k === 'swing' || k === 'overrides' || k === 'fermata'){
        const q = running ? api.position() : null;
        o[k] = v;
        if((k === 'overrides' || k === 'fermata') && !o.timing) map = plxTempoMap(tl, o);
        if(running && !waiting){ anchorQ = q; anchorT = Math.max(ctx.currentTime, anchorT); prevT = null; }
        return;
      }
      if(k === 'muted'){ o.muted = v; return; }
      if(k === 'volume'){ o.volume = v; if(out && out.input) try { out.input.gain.setTargetAtTime(v, ctx.currentTime, 0.03); } catch(e){} return; }
      if(k === 'volumes'){ o.volumes = v || {};
        gains.forEach((g, key) => { if(key === 'chords') return; try { g.gain.setTargetAtTime(volOf(key), ctx.currentTime, 0.03); } catch(e){} }); return; }
      if(k === 'gates'){ o.gates = v; if(running) gateAt = nextGate(api.position() - 1e-6); return; }
      o[k] = v;
      if(k === 'from' || k === 'to'){ [startQ, endQ] = rangeQ(); }
    },
    get running(){ return running; }, get paused(){ return paused; },
    get opts(){ return o; }, get countIn(){ return ci; }, get audioTime(){ return ctx ? ctx.currentTime : 0; },
    perfAt, bpmAt, secs, get map(){ return map; },
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
    /* a part switched off stays in the list — laid out nowhere (at 0,0), or
       where it would have been: counted in, it stretches every lit bar */
    if(!m || !m.ParentStaffLine || !m.PositionAndShape || !m.PositionAndShape.AbsolutePosition) return;
    try { if(typeof m.isVisible === 'function' && !m.isVisible()) return; } catch(e){}
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

/* ---------- the transport: the bar with ▶ on it ----------
   cfg: {xml() → the MusicXML being shown, osmd() → the engraving, host (the
   element the engraving is drawn in, and where the lit bar is drawn),
   svgRoot (where its pages are, if not host), store: {get(), set()} for the
   bar's own settings, swing (default for this room), defaultBpm (when the
   score marks no tempo), range() → [firstBar, lastBar] as numbered, or null,
   onPage(page) → turn to that page, accent: {get, set} (a room-level beat-1
   setting), and the ensemble's hooks, all optional: mix() → {volumes, muted}
   for the parts, overrides(tl) → section tempos, fermata() → a hold or
   'wait', gates(tl) → places to wait, onGate(q, ctl), onLoop(ctl),
   onStart(ctl), onStop(ctl, info)} */
let _plxNow = null;
function scorePlayStopAll(){ if(_plxNow){ try { _plxNow.stop(true); } catch(e){} _plxNow = null; } }
addEventListener('hashchange', () => scorePlayStopAll());

function scorePlayBarHTML(opts){
  const o = opts || {};
  return `<div class="plx-bar${o.compact ? ' compact' : ''}" data-plx>
    <div class="plx-row">
      <button class="tbtn" data-plxrew title="back to the start (of the loop, when there is one)" aria-label="back to the start">⏮</button>
      <button class="btn sm primary plx-go" data-plxgo title="play what is on the page (space)">▶ Play</button>
      <button class="tbtn" data-plxstop title="stop — ▶ starts again from the bar it stopped in" aria-label="stop">⏹</button>
      <span class="plx-where mono" data-plxwhere>—</span>
      <label class="plx-bpm mono" title="the tempo to play it at">♩ = <input class="inp sm mono" type="number" min="10" max="400" data-plxbpm aria-label="tempo, beats a minute"></label>
      <span class="plx-score mono faint" data-plxscore></span>
      ${o.compact ? '' : `<button class="tbtn" data-plxmore aria-expanded="false" title="swing, accents, which parts you hear, and the rest">⋯</button>`}
    </div>
    ${o.compact ? '' : `<div class="plx-row plx-row2">
      <label class="plx-pct" title="the score's tempo, slowed or sped — a ritardando stays a ritardando"><span class="mono">tempo</span>
        <input type="range" min="25" max="150" step="1" data-plxpct aria-label="tempo as a percentage of the score's"><b class="mono" data-plxpctv>100%</b></label>
      <label class="mono plx-sel">count-in <select class="sel sm" data-plxcount aria-label="count-in">
        <option value="0">none</option><option value="1">1 bar</option><option value="2">2 bars</option></select></label>
      <button class="tbtn" data-plxopt="loop" title="play it round again (L)">🔁 loop</button>
      <button class="tbtn" data-plxpick title="tap the first bar of the loop, then the last">set loop…</button>
      <label class="mono plx-sel" data-plxtimingwrap hidden title="the score's own tempo marks, or the timing and dynamics of a recording synced to it">timing <select class="sel sm" data-plxtiming aria-label="whose timing"></select></label>
      <label class="mono plx-sel">click <select class="sel sm" data-plxclick aria-label="metronome click while it plays">
        <option value="off">off</option><option value="beats">beats</option><option value="downbeats">downbeats</option></select></label>
      <label class="plx-vol" title="how loud"><span class="mono">volume</span><input type="range" min="0" max="100" step="1" data-plxvol aria-label="volume"></label>
    </div>
    <div class="plx-opts" data-plxopts hidden>
      <button class="tbtn" data-plxaccent title="beat 1 of the click and the count-in louder and higher, or every beat the same">beat 1 accented</button>
      <button class="tbtn" data-plxopt="swing" title="long-short eighths, as jazz is played">swing</button>
      <button class="tbtn" data-plxopt="chords" title="sound the chord symbols under the notes too — bars with only a symbol always sound it" hidden>chord symbols</button>
      <button class="tbtn" data-plxopt="follow" title="scroll the page along with the music">follow</button>
      <label class="mono plx-from">from bar <input class="inp sm mono" type="number" min="0" data-plxfrom placeholder="1"></label>
      <button class="tbtn" data-plxwritten title="the tempo the score marks">as marked</button>
      <span class="plx-mutes" data-plxmutes></span>
      ${typeof grandPianoCreditHTML === 'function' ? grandPianoCreditHTML() : ''}
      ${typeof instrumentsCreditHTML === 'function' ? instrumentsCreditHTML() : ''}
    </div>`}
    <div class="plx-note mono" data-plxnote hidden></div>
  </div>`;
}

function scorePlayAttach(bar, cfg){
  if(!bar) return null;
  const store = cfg.store || {get: () => ({}), set(){}};
  if(typeof grandPianoWarm === 'function') grandPianoWarm();
  const saved = Object.assign({pct: null, bpm: null, loop: false, loopRange: null, countIn: 0, click: 'off', volume: 0.9,
    swing: cfg.swing ? 0.64 : 0, follow: true, muted: []}, store.get() || {});
  if(saved.countIn === true) saved.countIn = 1;
  if(saved.click === true) saved.click = 'beats'; else if(!saved.click) saved.click = 'off';
  let tl = null, tlXml = null, player = null, geo = null, geoKey = '', geoOsmd = null, raf = 0, lastPerf = -1, fromBar = null;
  let picking = null, cursorQ = null, loading = false;
  /* beat 1 of the click: the room's own setting where it has one (a piece's
     metronome), this bar's otherwise */
  const accentOn = () => cfg.accent ? cfg.accent.get() !== false : saved.accent !== false;
  const $b = s => bar.querySelector(s);
  const timeline = () => {
    const xml = cfg.xml();
    if(!xml) return null;
    if(xml !== tlXml){ tl = musicXmlTimeline(xml); tlXml = xml; geo = null;
      /* the numbers the engraver shows, where it has them, so "m. 12" is the
         bar marked 12 on the page */
      try { const sm = cfg.osmd() && cfg.osmd().Sheet && cfg.osmd().Sheet.SourceMeasures;
        if(sm && sm.length === tl.measures.length) tl.perf.forEach(p => { const n = sm[p.k] && sm[p.k].MeasureNumber; if(n != null) p.number = n; });
      } catch(e){} }
    return tl;
  };
  const tlSafe = () => { try { return timeline(); } catch(e){ return null; } };
  /* the tempo the score is at 100%: its own mark, or what the room says when it marks none */
  const scoreBpm = () => { const t = tl || tlSafe();
    if(t && t.tempos[0].assumed){ const d = cfg.defaultBpm; return Math.round((typeof d === 'function' ? d() : d) || 80); }
    return t ? Math.round(t.tempos[0].bpm) : 80; };
  const pctNow = () => saved.pct != null ? +saved.pct : saved.bpm ? saved.bpm / scoreBpm() * 100 : 100;
  const bpmNow = () => Math.max(10, Math.round(scoreBpm() * pctNow() / 100));
  const save = () => { try { store.set(Object.assign({}, saved)); } catch(e){} };
  /* the bars that play: a loop you set, else the room's (a section in focus), else all */
  const rangeIdx = () => {
    const t = timeline(); if(!t) return [0, 0];
    const r = saved.loopRange || (cfg.range ? cfg.range() : null);
    if(!r) return [0, t.perf.length - 1];
    const a = t.perf.findIndex(p => p.number >= r[0]);
    let z = -1; t.perf.forEach((p, i) => { if(p.number <= r[1] && i >= a) z = i; });
    return a < 0 || z < a ? [0, t.perf.length - 1] : [a, z];
  };
  const where = (i, q) => {
    const t = tl; const el = $b('[data-plxwhere]'); if(!el || !t) return;
    if(picking){ el.textContent = picking.a == null ? 'loop: tap its first bar' : `loop from m. ${picking.a} — tap its last`; return; }
    const [a, z] = rangeIdx();
    const pm = t.perf[i];
    const whole = a === 0 && z === t.perf.length - 1;
    el.textContent = !pm ? `${z - a + 1} bars` : whole ? `m. ${pm.number} / ${t.perf[t.perf.length - 1].number}` : `m. ${pm.number} · ${i - a + 1} of ${z - a + 1}`;
  };
  const paintTempo = () => {
    const b = $b('[data-plxbpm]'); if(b && document.activeElement !== b) b.value = bpmNow();
    const pct = pctNow();
    const r = $b('[data-plxpct]'); if(r) r.value = Math.max(25, Math.min(150, Math.round(pct)));
    const v = $b('[data-plxpctv]'); if(v) v.textContent = Math.round(pct) + '%';
    const t = tl || tlSafe();
    const sc = $b('[data-plxscore]'); if(sc) sc.textContent = t && t.tempos[0].assumed ? `(no tempo marked: ♩ = ${scoreBpm()})` : `(score: ${scoreBpm()})`;
    const w = $b('[data-plxwritten]'); if(w){ w.disabled = Math.abs(pct - 100) < 0.5;
      w.textContent = `as marked (${scoreBpm()}${t && t.tempos[0].assumed ? ', none marked' : ''})`; }
  };
  const setPct = (pct, keep) => { saved.pct = Math.max(5, Math.min(400, pct)); saved.bpm = null;
    if(player) player.set('bpm', bpmNow()); paintTempo(); if(!keep) save(); };
  const paintOpts = () => {
    $$('[data-plxopt]', bar).forEach(b => { const k = b.dataset.plxopt; b.classList.toggle('on', !!saved[k]); b.setAttribute('aria-pressed', saved[k] ? 'true' : 'false'); });
    const cnt = $b('[data-plxcount]'); if(cnt) cnt.value = String(+saved.countIn || 0);
    const clk = $b('[data-plxclick]'); if(clk) clk.value = saved.click || 'off';
    const tw = $b('[data-plxtimingwrap]'), ts = $b('[data-plxtiming]');
    if(tw && ts){ const list = cfg.timings ? cfg.timings() || [] : [];
      tw.hidden = !list.length;
      if(list.length){ if(saved.timing && !list.some(x => x.id === saved.timing)) saved.timing = '';
        ts.innerHTML = `<option value="">as written</option>` + list.map(x => `<option value="${esc(x.id)}">as ${esc(x.name)} played it${x.dyn ? '' : ' (timing)'}</option>`).join('');
        ts.value = saved.timing || ''; } }
    const vol = $b('[data-plxvol]'); if(vol) vol.value = Math.round((saved.volume == null ? 0.9 : saved.volume) * 100);
    const pk = $b('[data-plxpick]');
    if(pk){ pk.classList.toggle('on', !!picking || !!saved.loopRange);
      pk.textContent = picking ? 'tap the bars… ✕' : saved.loopRange ? `loop m. ${saved.loopRange[0]}–${saved.loopRange[1]} ✕` : 'set loop…'; }
    const ac = $b('[data-plxaccent]');
    if(ac){ const on = accentOn(); ac.classList.toggle('on', on); ac.setAttribute('aria-pressed', String(on));
      ac.textContent = on ? 'beat 1 accented' : 'every beat the same'; }
    const t = tlSafe();
    /* a road sign it cannot follow: said once, quietly, and never in the way */
    const note = $b('[data-plxnote]');
    if(note){ const is = (t && t.issues) || [];
      note.hidden = !is.length;
      note.textContent = is.length ? `Playback may differ from the score at m. ${is[0].number}: ${is[0].why}${
        is.length > 1 ? ` (and ${is.length - 1} more place${is.length > 2 ? 's' : ''})` : ''}.` : '';
      note.title = is.map(v => `m. ${v.number}: ${v.why}`).join('\n'); }
    const ch = $b('[data-plxopt="chords"]'); if(ch) ch.hidden = !(t && t.chords);
    const mutes = $b('[data-plxmutes]');
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
        ctl.applyMix(); save(); paintOpts(); });
    }
  };
  const goSay = () => { const g = $b('[data-plxgo]'); if(!g) return;
    const on = !!(player && player.running);
    g.textContent = loading ? 'Loading sounds…' : on ? '❚❚ Pause' : (player && player.paused ? '▶ Resume' : '▶ Play');
    bar.classList.toggle('playing', on); bar.classList.toggle('loading', loading);
    g.setAttribute('aria-busy', loading ? 'true' : 'false'); };
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
  /* keep the line being played a third of the way down whatever scrolls */
  const follow = hl => {
    const host = cfg.host;
    const scroller = host && host.scrollHeight > host.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(host).overflowY) ? host : null;
    const r = hl.getBoundingClientRect();
    if(scroller){ const sr = scroller.getBoundingClientRect(); const top = r.top - sr.top;
      if(top < sr.height * 0.12 || top + r.height > sr.height * 0.85) scroller.scrollTo({top: Math.max(0, scroller.scrollTop + top - sr.height / 3), behavior: 'smooth'}); }
    else { const vh = innerHeight;
      if(r.top < vh * 0.12 || r.bottom > vh * 0.85) window.scrollTo({top: Math.max(0, scrollY + r.top - vh / 3), behavior: 'smooth'}); }
  };
  const paintAt = (q, still) => {
    const t = tl; if(!t) return;
    const pm = (player || {perfAt: qq => { let best = t.perf[0]; for(const p of t.perf){ if(p.q0 <= qq + 1e-9) best = p; else break; } return best; }}).perfAt(q);
    if(!pm) return;
    const hl = layer(); if(!hl) return;
    if(pm.i !== lastPerf){ where(pm.i, q); }
    let g = (geometry() || new Map()).get(pm.k);
    if(g && cfg.onPage && !g.shown){ cfg.onPage(g.page); geo = null; g = (geometry() || new Map()).get(pm.k); }
    if(!g){ hl.hidden = true; lastPerf = pm.i; return; }
    hl.hidden = false; hl.classList.toggle('paused', !!still);
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
    if(pm.i !== lastPerf && saved.follow) follow(hl);
    lastPerf = pm.i;
    if(cfg.onPosition) try { cfg.onPosition(pm, q, ctl); } catch(e){}
  };
  const loop = () => {
    raf = 0;
    if(!player || !player.running) return;
    /* the page was drawn again under it: a new bar for the same music takes
       the playing over (see below); left alone for a moment, it stops */
    if(!bar.isConnected){ ctl._goneAt = ctl._goneAt || performance.now();
      if(performance.now() - ctl._goneAt > 2500){ ctl.stop(); return; } }
    else paintAt(player.position());
    raf = requestAnimationFrame(loop);
  };
  const clearHl = () => { const h = cfg.host && cfg.host.querySelector(':scope > .plx-hl'); if(h) h.hidden = true; lastPerf = -1; };
  /* "3… 2… 1…", big, over the score, while the count-in clicks */
  const countDown = () => {
    const ci = player && player.countIn; if(!ci || !cfg.host) return;
    const box = document.createElement('div'); box.className = 'plx-count serif'; box.setAttribute('aria-live', 'assertive');
    document.body.appendChild(box);
    const place = () => { const r = cfg.host.getBoundingClientRect();
      const top = Math.max(r.top, 60), bottom = Math.min(r.bottom, innerHeight - 20);
      box.style.left = (r.left + r.width / 2) + 'px'; box.style.top = ((top + bottom) / 2) + 'px'; };
    place();
    const now = player.audioTime;
    for(let i = 0; i < ci.n; i++){
      setTimeout(() => { if(!box.isConnected) return; place(); box.textContent = String(ci.n - i);
        box.classList.remove('beat'); void box.offsetWidth; box.classList.add('beat'); }, Math.max(0, (ci.t0 + i * ci.beat - now) * 1000));
    }
    setTimeout(() => box.remove(), Math.max(0, (ci.t0 + ci.n * ci.beat - now) * 1000) + 120);
    ctl._countBox = box;
  };
  /* every instrument the audible parts are played on, decoded before it starts */
  const soundsFor = t => {
    const muted = new Set(saved.muted);
    const ids = new Set();
    t.parts.forEach((p, pi) => { if(!muted.has(`p:${pi}`)) ids.add(p.inst === 'drums' ? 'kit' : (p.inst || 'piano')); });
    if(t.chords) ids.add('piano');
    return [...ids];
  };
  const soundsReady = ids => ids.every(id => typeof instrumentReady === 'function' ? instrumentReady(id) : id === 'piano' && (typeof grandPianoSettled !== 'function' || grandPianoSettled()));
  const ctl = {
    stop(fromOutside, ended){ if(raf) cancelAnimationFrame(raf); raf = 0;
      const info = player ? {q: player.position(), loops: ctl.loops || 0, ended: !!ended} : null;
      /* ▶ starts again from the bar it stopped in — or from the top, when it
         stopped because it had finished */
      if(player && info){ const pm = player.perfAt(info.q); cursorQ = ended ? null : pm ? pm.q0 : null; }
      if(player){ player.stop(); player = null; }
      if(ctl._countBox){ ctl._countBox.remove(); ctl._countBox = null; }
      clearHl(); goSay();
      const t = tl; if(t) where(-1); if(_plxNow === ctl && !fromOutside) _plxNow = null;
      if(info && cfg.onStop) try { cfg.onStop(ctl, info); } catch(e){} },
    play(fromQ){
      let t;
      try { t = timeline(); } catch(e){ toast(e.message || 'That score could not be read for playing.'); return; }
      if(!t || !t.playable){ toast('There are no notes in this to play.'); return; }
      /* the first press: the instruments are decoded first (a moment), so what
         starts is the real sound and not a stand-in */
      const ids = soundsFor(t);
      if(!soundsReady(ids) && !loading){
        loading = true; goSay(); const w = $b('[data-plxwhere]'); if(w) w.textContent = 'Loading sounds…';
        const load = typeof instrumentsLoad === 'function' ? instrumentsLoad(ids) : (typeof grandPianoLoad === 'function' ? grandPianoLoad() : Promise.resolve());
        load.then(() => { loading = false; goSay(); if(bar.isConnected) ctl.play(fromQ); }, () => { loading = false; goSay(); });
        return;
      }
      if(loading) return;
      if(cfg.beforePlay && cfg.beforePlay(ctl, fromQ) === false) return;
      if(_plxNow && _plxNow !== ctl) scorePlayStopAll();
      const [a, z] = rangeIdx();
      if(player) player.stop();
      const mix = cfg.mix ? cfg.mix(t) || {} : {};
      const perf = saved.timing && cfg.timingFor ? cfg.timingFor(saved.timing, t, scoreBpm()) : null;
      player = scorePlayer(t, {bpm: bpmNow(), swing: perf ? 0 : saved.swing ? (typeof saved.swing === 'number' ? saved.swing : 0.64) : 0,
        timing: perf && perf.map, velOf: perf && perf.velOf,
        from: a, to: z, loop: saved.loop, countIn: +saved.countIn || 0, click: saved.click === 'off' ? false : saved.click,
        chords: !!saved.chords, accent: accentOn(), volume: saved.volume == null ? 0.9 : saved.volume,
        muted: new Set(saved.muted.concat(mix.muted || [])), volumes: mix.volumes || {},
        overrides: cfg.overrides ? cfg.overrides(t) || [] : [], fermata: cfg.fermata ? cfg.fermata() : 2,
        gates: cfg.gates ? cfg.gates(t) : null,
        onGate: q => { if(cfg.onGate) cfg.onGate(q, ctl); },
        onLoop: () => { ctl.loops = (ctl.loops || 0) + 1; if(cfg.onLoop) cfg.onLoop(ctl); },
        onEnd: () => { const c = _plxNow; if(c && c.player === pl) c.stop(false, true); }});
      const pl = player;
      ctl.loops = 0;
      let q = fromQ;
      if(q == null && fromBar != null){ const pm = t.perf.slice(a, z + 1).find(p => p.number >= fromBar); if(pm) q = pm.q0; }
      if(q == null && cursorQ != null) q = cursorQ;
      if(!player.start(null, q)){ toast('This browser cannot make sound.'); player = null; return; }
      _plxNow = ctl; lastPerf = -1;
      goSay();
      countDown();
      if(cfg.onStart) try { cfg.onStart(ctl); } catch(e){}
      if(!raf) raf = requestAnimationFrame(loop);
    },
    pause(){ if(!player || !player.running) return; const q = player.pause(); ctl._at = q;
      if(raf) cancelAnimationFrame(raf); raf = 0; goSay(); if(q != null) paintAt(q, true); },
    toggle(){ if(loading) return;
      if(player && player.waiting != null){ player.release(); return; }
      if(player && player.running) ctl.pause();
      else if(player && player.paused){ const q = ctl._at; player.stop(); player = null; ctl.play(q); }
      else ctl.play(); },
    /* back to the start of what plays (the loop, the focus, the piece) */
    rewind(){ cursorQ = null; fromBar = null; const t = tlSafe(); if(!t) return;
      const [a] = rangeIdx(); const q = t.perf[a] ? t.perf[a].q0 : 0;
      if(player && player.running) ctl.play(q);
      else if(player && player.paused){ ctl._at = q; paintAt(q, true); }
      else { clearHl(); where(-1); } },
    /* one bar back or on, from wherever it is */
    step(by){ const t = tlSafe(); if(!t) return;
      const q = player && player.running ? player.position() : player && player.paused ? ctl._at : cursorQ;
      if(q == null) return;
      const [a, z] = rangeIdx();
      const pm = (player || {perfAt: () => null}).perfAt(q) || t.perf.find(p => p.q0 <= q + 1e-9 && q < p.q0 + p.len) || t.perf[a];
      const i = Math.max(a, Math.min(z, pm.i + by)); const nq = t.perf[i].q0;
      if(player && player.running) ctl.play(nq);
      else if(player && player.paused){ ctl._at = nq; paintAt(nq, true); }
      else { cursorQ = nq; where(i); } },
    /* a press on a bar: while it plays, go there; paused, start there */
    jumpTo(k){ const t = tl; if(!t) return;
      const [a, z] = rangeIdx();
      const pm = t.perf.slice(a, z + 1).find(p => p.k === k);
      if(!pm) return;
      if(player && player.paused){ ctl._at = pm.q0; paintAt(pm.q0, true); return; }
      ctl.play(pm.q0); },
    /* two presses on the score set the loop */
    pickBar(k){ const t = tl; if(!t || !picking) return;
      const pm = t.perf.find(p => p.k === k); if(!pm) return;
      if(picking.a == null){ picking.a = pm.number; where(-1); paintOpts(); return; }
      const lo = Math.min(picking.a, pm.number), hi = Math.max(picking.a, pm.number);
      picking = null; saved.loopRange = [lo, hi]; saved.loop = true; save();
      if(player) player.set('loop', true);
      paintOpts(); where(-1);
      if(player && player.running){ const [aa] = rangeIdx(); ctl.play(t.perf[aa].q0); } },
    /* a place lit from outside the player — a recording being listened to
       (19-sync-d-page.js): q in the written timeline, still = dimmed */
    showAt(q, still){ if(!tlSafe()) return; if(q == null){ clearHl(); where(-1); return; } paintAt(q, !!still); },
    /* whose timing plays: '' the score's, or a recording's id */
    setTiming(id){ saved.timing = id || ''; save(); paintOpts(); if(player && player.running){ const q = player.position(); ctl.play(q); } },
    get picking(){ return !!picking; },
    get player(){ return player; }, get timeline(){ return tl; }, get saved(){ return saved; },
    tempoPct: () => pctNow(), bpm: () => bpmNow(), scoreBpm: () => scoreBpm(),
    /* the room changed the accent: the click that is playing hears it now */
    setAccent(v){ if(player) player.set('accent', v !== false); paintOpts(); },
    /* the room changed who is heard and how loud: the playing hears it now */
    applyMix(){ if(!player) return; const t = tlSafe(); if(!t) return;
      const mix = cfg.mix ? cfg.mix(t) || {} : {};
      player.set('muted', new Set(saved.muted.concat(mix.muted || []))); player.set('volumes', mix.volumes || {}); },
    applyTempo(){ if(!player) return; const t = tlSafe(); if(!t) return;
      player.set('overrides', cfg.overrides ? cfg.overrides(t) || [] : []);
      player.set('fermata', cfg.fermata ? cfg.fermata() : 2);
      player.set('gates', cfg.gates ? cfg.gates(t) : null); },
    setPct, paint(){ paintTempo(); paintOpts(); },
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
  $b('[data-plxrew]').onclick = () => { sound('click'); ctl.rewind(); };
  const bpmIn = $b('[data-plxbpm]');
  bpmIn.onchange = () => { const v = parseFloat(bpmIn.value); if(!(v > 0)) { paintTempo(); return; } setPct(v / scoreBpm() * 100); };
  const pctIn = $b('[data-plxpct]');
  if(pctIn){ pctIn.oninput = () => setPct(+pctIn.value, true); pctIn.onchange = () => save(); }
  const cnt = $b('[data-plxcount]'); if(cnt) cnt.onchange = () => { saved.countIn = +cnt.value || 0; save(); };
  const tsel = $b('[data-plxtiming]');
  if(tsel) tsel.onchange = () => ctl.setTiming(tsel.value);
  const clk = $b('[data-plxclick]');
  if(clk) clk.onchange = () => { saved.click = clk.value; save();
    if(player && player.running){ const q = player.position(); ctl.play(q); } };
  const vol = $b('[data-plxvol]');
  if(vol){ vol.oninput = () => { saved.volume = +vol.value / 100; if(player) player.set('volume', saved.volume); }; vol.onchange = () => save(); }
  const pick = $b('[data-plxpick]');
  if(pick) pick.onclick = () => {
    if(picking){ picking = null; }
    else if(saved.loopRange){ saved.loopRange = null; save();
      if(player && player.running){ const q = player.position(); ctl.play(q); } }
    else picking = {a: null};
    paintOpts(); where(-1); };
  const more = $b('[data-plxmore]');
  if(more) more.onclick = () => { const box = $b('[data-plxopts]'); box.hidden = !box.hidden;
    more.setAttribute('aria-expanded', box.hidden ? 'false' : 'true'); if(!box.hidden) paintOpts(); };
  $$('[data-plxopt]', bar).forEach(b => b.onclick = () => ctl.option(b.dataset.plxopt));
  ctl.option = k => {
    saved[k] = k === 'swing' ? (saved.swing ? 0 : 0.64) : !saved[k];
    if(player && player.running){
      if(k === 'swing') player.set('swing', saved.swing);
      else if(k === 'loop') player.set('loop', saved.loop);
      else if(k === 'chords') player.set('chords', saved.chords);
    }
    save(); paintOpts(); };
  const ac = $b('[data-plxaccent]');
  if(ac) ac.onclick = () => { const v = !accentOn();
    if(cfg.accent) cfg.accent.set(v); else { saved.accent = v; save(); }
    if(player) player.set('accent', v); paintOpts(); };
  const fr = $b('[data-plxfrom]');
  if(fr) fr.onchange = () => { const n = parseInt(fr.value, 10); fromBar = isFinite(n) ? n : null; };
  const wr = $b('[data-plxwritten]');
  if(wr) wr.onclick = () => setPct(100);
  /* a press on the engraving: a bar of the loop being set, or — while it
     plays or waits paused — the bar to go to */
  if(cfg.host && !cfg.host._plxBound){
    cfg.host._plxBound = true;
    cfg.host.addEventListener('click', ev => {
      const c = (_plxNow && _plxNow._host === cfg.host) ? _plxNow : cfg.host._plxCtl;
      if(!c || !(c.picking || (c.player && (c.player.running || c.player.paused)))) return;
      const g = (() => { try { return c._geo(); } catch(e){ return null; } })();
      if(!g) return;
      const hr = cfg.host.getBoundingClientRect();
      const px = ev.clientX - hr.left - cfg.host.clientLeft + cfg.host.scrollLeft, py = ev.clientY - hr.top - cfg.host.clientTop + cfg.host.scrollTop;
      const hit = [...g.values()].find(b => b.shown && px >= b.x && px <= b.x + b.w && py >= b.y - 10 && py <= b.y + b.h + 10);
      if(!hit) return;
      ev.stopPropagation(); ev.preventDefault();
      if(c.picking) c.pickBar(hit.k); else c.jumpTo(hit.k);
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
/* The keys, whichever score on the page is playing (or was last): space to
   play and pause, ← → a bar back or on, L the loop, − + the tempo by 5%.
   Never while typing, never under a dialog, and in the score room's reading
   mode space and the arrows are the page turns they already were. */
addEventListener('keydown', ev => {
  if(ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const k = ev.key, code = ev.code;
  const isSpace = code === 'Space', isArrow = k === 'ArrowLeft' || k === 'ArrowRight';
  const isL = k === 'l' || k === 'L', isTempo = k === '-' || k === '+' || k === '=' || k === '_';
  if(!isSpace && !isArrow && !isL && !isTempo) return;
  if(isSpace && ev.repeat) return;
  const t = ev.target;
  /* a play bar's own buttons keep the keys working after they are pressed
     (space is still the focused button's own) */
  const ownButton = t && t.tagName === 'BUTTON' && t.closest && t.closest('.plx-bar') && !isSpace;
  if(t && !ownButton && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
  if(ev.defaultPrevented || document.querySelector('#modals .overlay')) return;
  const reading = typeof scoreUi === 'function' && scoreUi().reading && parseHash().name === 'score';
  if(reading && (isSpace || isArrow)) return;
  const bars = [...document.querySelectorAll('.plx-bar')].filter(b => b._plx && b.offsetParent !== null);
  if(!bars.length) return;
  const b = (_plxNow && bars.find(x => x._plx === _plxNow)) || bars[0];
  const c = b._plx;
  /* the arrows, L and the tempo keys only once the score has been played:
     before that they are the page's own */
  const live = !!(c.player || c.picking);
  if(isSpace){
    /* the room may want space for itself while it plays (tap-to-lead) */
    if(c.onSpace && c.onSpace(ev) === true){ ev.preventDefault(); return; }
    ev.preventDefault(); c.toggle(); return; }
  if(!live) return;
  ev.preventDefault();
  if(isArrow) c.step(k === 'ArrowRight' ? 1 : -1);
  else if(isL) c.option('loop');
  else c.setPct(Math.max(25, Math.min(150, Math.round(c.tempoPct() / 5) * 5 + (k === '-' || k === '_' ? -5 : 5))));
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
