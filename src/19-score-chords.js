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
   `bass` the pitch class of the lowest note, or null.

   `hold` is optional: pitch class to the share of the span it actually
   sounds for, 0 to 1. Without it every note counts the same, which is right
   for a block chord and wrong for everything else — a passing quaver in a
   bar of C major is not evidence against C major, and counting it as hard
   evidence is how a clean bar comes out named something nobody played. With
   it, a note that is there for a moment costs a fraction of one that is
   there throughout. */
function chordFit(pcs, bass, hold){
  let best = null;
  for(let r = 0; r < 12; r++){
    for(const [name, tones, odd] of CHORD_SHAPES){
      let cost = odd + tones.length * 0.05;   /* a tie goes to the simpler name */
      const has = {};
      tones.forEach(t => { has[t] = true; if(!pcs.has((r + t) % 12)) cost += CHORD_MISS(t); });
      pcs.forEach(p => { if(!has[((p - r) % 12 + 12) % 12])
        cost += CHORD_EXTRA * (hold ? clamp(hold[p] == null ? 1 : hold[p], 0.2, 1) : 1); });
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

/* ---------- what is sounding, over a stretch of time ----------
   The first version of this asked what was struck ON the beat, and that is
   the question almost no piano score answers. Real writing spreads the
   harmony out: an Alberti bass, a broken chord, a left hand that lays out
   C–G–E–G across the bar while the right hand plays a tune. Ask what is
   sounding at the instant of beat two and you get two notes, and two notes
   name a chord the way two letters name a word — confidently and wrongly.

   So a span is gathered instead: everything sounding anywhere inside it,
   with how long each pitch class lasts there. C–G–E–G over a bar is a C
   chord, and the only way to see that is to look at the whole bar. */
function chordPool(list, from, to){
  const hold = {}, pcs = new Set();
  const span = Math.max(to - from, 1 / 64);
  let low = null, first = Infinity, lowOn = 0;
  list.forEach(n => {
    if(n.midi == null) return;
    const a = n.at, b = n.at + Math.max(n.dur || 0, 1 / 64);
    const on = Math.min(b, to) - Math.max(a, from);
    if(on <= 1e-9) return;
    const pc = ((n.midi % 12) + 12) % 12;
    hold[pc] = (hold[pc] || 0) + on;
    pcs.add(pc);
    /* The bass is what is underneath at the START of the span, not the
       lowest note to appear anywhere in it — in a broken chord the lowest
       note is often the one after the beat, and calling that the bass turns
       every bar into a slash chord.

       How long it lasts is measured on THAT NOTE and not on its pitch class.
       The classes are pooled across the span and across octaves, which is
       right for deciding what chord this is and wrong for deciding whether
       there is a bass: an E in the left hand followed by an E three octaves
       up reads, pooled, as one E held throughout, and every arpeggio in the
       piece comes out as a slash chord on that evidence. */
    if(a < first - 1e-9){ first = a; low = n.midi; lowOn = on; }
    else if(Math.abs(a - first) < 1e-9 && (low === null || n.midi < low)){ low = n.midi; lowOn = on; }
  });
  Object.keys(hold).forEach(k => hold[k] = Math.min(1, hold[k] / span));
  return {pcs, hold, bass: low == null ? null : ((low % 12) + 12) % 12,
    bassHeld: Math.min(1, lowOn / span), n: pcs.size};
}

/* What the harmony is at each beat of each bar, and what to call it.
   Beats rather than note onsets: a passing quaver is not a chord change, and
   naming every onset gives a different symbol twice a beat, which is noise
   drawn over the music.

   Where a beat on its own has too little in it to name — which in a broken
   texture is nearly every beat — the question is widened rather than
   dropped: the half bar, then the whole bar. A bar of C major arpeggiated
   four different ways is one C, written once, at the bar line. */
function scoreChordLine(notes, opts = {}){
  const t = scoreTimeSignature();
  const beats = Math.max(1, opts.beats || (t ? t.beats : 4));
  const step = 1 / (t ? t.unit : 4);       /* one beat, as a fraction of a whole */
  const bar = beats * step;
  const flat = !!opts.flat;
  const byBar = {};
  notes.forEach(n => { if(n.midi == null) return; (byBar[n.measure] = byBar[n.measure] || []).push(n); });
  const out = [];
  let lastSay = null;
  Object.keys(byBar).map(Number).sort((a, b) => a - b).forEach(barNo => {
    const list = byBar[barNo];
    const half = bar / 2;
    for(let i = 0; i < beats; i++){
      const at = i * step;
      /* the beat; then the half bar it is in; then the bar. Three notes is
         the fewest that names a chord rather than guesses at one. */
      let pool = chordPool(list, at, at + step);
      let wide = 0;
      if(pool.n < 3){
        const h = at < half ? [0, half] : [half, bar];
        const wider = chordPool(list, h[0], h[1]);
        if(wider.n > pool.n){ pool = wider; wide = 1; }
      }
      if(pool.n < 3){
        const whole = chordPool(list, 0, bar);
        if(whole.n > pool.n){ pool = whole; wide = 2; }
      }
      /* one note is a note, not a chord */
      if(pool.n < 2) continue;
      const fit = chordFit(pool.pcs, pool.bass, pool.hold);
      /* A slash chord is worth writing when there really is a bass under the
         chord — a triad in first inversion, a pedal note, a held left hand.
         It is not worth writing when the lowest note is simply the next note
         of a broken chord, and telling those apart is not about which note
         is lowest but about how long it lasts: a bass is HELD, a figure is
         passed through. Labelling bar after bar F then F/A, because the
         second quaver of the arpeggio happens to be an A, is three symbols
         of noise for every real one.

         Eight tenths of the beat is the line. A whole note under a bar of
         four clears it; one quaver of two does not. */
      const held = pool.bass == null ? 0 : pool.bassHeld;
      const head = chordRootName(fit.root, flat) + fit.name;
      const firm = !wide && pool.bass !== fit.root && held >= 0.8;
      const say = firm ? chordSymbol(fit, pool.bass, flat) : head;
      /* and a change is a change of what is written: the same harmony
         arpeggiated four ways is one symbol, at the bar line */
      if(say === lastSay) continue;
      lastSay = say;
      /* the symbol goes where the beat is, so a change lands over the notes
         that made it — falling back to whatever the span could find */
      const here = list.filter(n => Math.abs(n.at - at) < 1e-6);
      const near = here.length ? here : list.filter(n =>
        n.at <= at + 1e-6 && n.at + Math.max(n.dur || 0, 1 / 64) > at + 1e-6);
      const where = near.length ? near : list;
      out.push({measure: barNo, beat: i, at, key: `${barNo}|${Math.round(at * 48)}`,
        say, cost: fit.cost, wide,
        /* two pitch classes is a guess however cheap it scores, and a symbol
           read off the whole bar is a summary rather than a reading */
        sure: fit.cost <= CHORD_UNSURE && pool.n >= 3,
        x: where.reduce((a, n) => Math.min(a, n.x), Infinity),
        page: where[0].page});
    }
  });
  return out;
}
