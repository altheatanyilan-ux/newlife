/* ============================================================
   READING THE HARMONY OFF THE NOTES.

   A lead sheet tells you the chord. A piano score does not: it gives you the
   notes and expects you to hear the harmony in them, which is exactly the
   skill that takes years and exactly the thing that would help most while you
   are learning the piece. So the room works it out and writes it over the bar.

   The obvious way to do it is the way the specification suggests: take the
   notes sounding, and go through a list of chord shapes returning the first
   one whose notes are all present. That is wrong, and wrong in a way that
   looks right in testing, because "all present" is a subset test — A C E G is
   an A minor seventh, and a subset search finds C major inside it and stops.
   Every seventh chord in the piece comes out named as the triad three notes
   up, which is worse than no chord symbols at all.

   So every root and every shape is scored, and the best fit wins. What makes
   a fit good:

     a note in the chord that is not being played is a small cost, and the
     fifth is the smallest of all, because pianists leave fifths out;
     a note being played that the chord cannot explain is a large cost, and it
     is the thing that rules out the wrong answer above;
     the bass is a strong vote for the root, because a chord in root position
     is far commoner than one in second inversion;
     and an odd shape has to earn its name — sus2 and add9 are real, and they
     are not what a C major triad is.

   Where it is unsure it says so by writing faintly rather than by writing
   confidently, and anything it gets wrong can be written over by hand.
   ============================================================ */

/* Name, the semitones above the root, and how odd the shape is — the last is
   a handicap, so a plain triad beats an exotic name that happens to fit. */
const CHORD_SHAPES = [
  ['',      [0,4,7],       0],
  ['m',     [0,3,7],       0],
  ['5',     [0,7],         1.0],
  ['dim',   [0,3,6],       1.0],
  ['aug',   [0,4,8],       1.5],
  ['sus4',  [0,5,7],       1.0],
  ['sus2',  [0,2,7],       1.5],
  ['6',     [0,4,7,9],     1.0],
  ['m6',    [0,3,7,9],     1.2],
  ['7',     [0,4,7,10],    0.3],
  ['maj7',  [0,4,7,11],    0.5],
  ['m7',    [0,3,7,10],    0.4],
  ['m7♭5', [0,3,6,10], 1.0],
  ['dim7',  [0,3,6,9],     1.2],
  ['9',     [0,2,4,7,10],  1.2],
  ['maj9',  [0,2,4,7,11],  1.4],
  ['m9',    [0,2,3,7,10],  1.4],
  ['add9',  [0,2,4,7],     1.6],
];
/* A chord tone nobody played. The fifth is nearly free — leaving it out is
   ordinary piano writing — and a missing root is worse than a missing third,
   because without it there is not much reason to call it that chord. */
const CHORD_MISS = t => t === 7 ? 0.4 : t === 0 ? 1.0 : 1.2;
/* A note the name cannot account for. Twice the cost of a missing one: the
   thing that is there is harder evidence than the thing that is not. */
const CHORD_EXTRA = 2.0;
/* How wrong a reading can be before it is written faintly instead of plainly. */
const CHORD_UNSURE = 1.0;

/* The best name for a handful of pitch classes. `pcs` is a Set of 0–11 and
   `bass` the pitch class of the lowest note, or null. */
function chordFit(pcs, bass){
  let best = null;
  for(let r = 0; r < 12; r++){
    for(const [name, tones, odd] of CHORD_SHAPES){
      let cost = odd + tones.length * 0.05;   /* a tie goes to the simpler name */
      const has = {};
      tones.forEach(t => { has[t] = true; if(!pcs.has((r + t) % 12)) cost += CHORD_MISS(t); });
      pcs.forEach(p => { if(!has[((p - r) % 12 + 12) % 12]) cost += CHORD_EXTRA; });
      if(bass != null && bass === r) cost -= 1.2;
      if(!best || cost < best.cost) best = {cost, root: r, name, tones};
    }
  }
  return best;
}
/* The letter, spelled the way the key is spelled — a piece in flats does not
   suddenly acquire a D sharp chord. */
function chordRootName(pc, flat){
  const [letter, alter] = (flat ? XP_FLAT : XP_SHARP)[((pc % 12) + 12) % 12];
  return letter + (alter > 0 ? '♯' : alter < 0 ? '♭' : '');
}
/* The whole symbol, bass and all. A chord over a bass that is not its root is
   written as a slash chord, because that is what it is and because it is the
   thing a left hand most wants told. */
function chordSymbol(fit, bass, flat){
  const head = chordRootName(fit.root, flat) + fit.name;
  return (bass != null && bass !== fit.root)
    ? `${head}/${chordRootName(bass, flat)}` : head;
}

/* What is sounding on each beat of each bar, and what to call it.
   Beats rather than note onsets: a passing quaver is not a chord change, and
   analysing every onset gives a different name twice a beat, which is noise
   drawn over the music. */
function scoreChordLine(notes, opts = {}){
  const t = scoreTimeSignature();
  const beats = opts.beats || (t ? t.beats : 4);
  const step = 1 / (t ? t.unit : 4);       /* one beat, as a fraction of a whole */
  const flat = !!opts.flat;
  const byBar = {};
  notes.forEach(n => { if(n.midi == null) return; (byBar[n.measure] = byBar[n.measure] || []).push(n); });
  const out = [];
  let last = null;
  Object.keys(byBar).map(Number).sort((a, b) => a - b).forEach(bar => {
    const list = byBar[bar];
    for(let i = 0; i < beats; i++){
      const at = i * step;
      /* held notes count: a bass note under a melody is part of the harmony
         for as long as it lasts, not only on the beat it was struck */
      const on = list.filter(n => n.at <= at + 1e-6
        && n.at + Math.max(n.dur || 0, 1 / 64) > at + 1e-6);
      if(!on.length) continue;
      const pcs = new Set(on.map(n => ((n.midi % 12) + 12) % 12));
      /* one note is a note, not a chord */
      if(pcs.size < 2) continue;
      const low = on.reduce((a, n) => n.midi < a.midi ? n : a);
      const bass = ((low.midi % 12) + 12) % 12;
      const fit = chordFit(pcs, bass);
      const say = chordSymbol(fit, bass, flat);
      /* only where it changes: the same symbol on all four beats of a bar is
         three symbols too many */
      if(say === last) continue;
      last = say;
      const struck = on.filter(n => Math.abs(n.at - at) < 1e-6);
      out.push({measure: bar, beat: i, at, key: `${bar}|${Math.round(at * 48)}`,
        say, cost: fit.cost, sure: fit.cost <= CHORD_UNSURE,
        x: (struck.length ? struck : on).reduce((a, n) => Math.min(a, n.x), Infinity),
        page: on[0].page});
    }
  });
  return out;
}
