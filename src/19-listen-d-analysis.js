/* ============================================================
   HEARING THE PIANO — what an attempt amounted to.

   The live feedback (19-listen-e-feedback.js) watches the notes arrive;
   this file says what they add up to once they have. Arithmetic only (lf*),
   so the tests can run it in Node.

   Per kind of exercise:
   - CHORDS AND VOICINGS: each step passes when every expected note is there
     and nothing else is; the reaction time is from the step being asked to
     the right chord sounding. Twelve-key drills are logged key by key.
   - SCALES AND PATTERNS: note accuracy (by alignment, so one slip does not
     spoil the rest), evenness (how much the gaps between notes vary — the
     coefficient of variation, shown as a percentage), the tempo reached,
     and for swing exercises the swing ratio, long eighth to short.
   - RHYTHM AND COMPING: the average early or late of each rhythmic
     position, in plain words: "you rush the and of 2 by 35 ms".
   - LEAD-SHEET CARDS: pass or fail per chord symbol — the guide tones there,
     nothing outside the chord and its tensions — and how quickly.
   - FREE PLAYING: nothing right or wrong. Which notes were inside the mode,
     the range, and how busy each few seconds were.

   THE SCORECARD. Accuracy, a timing score (100 when every onset is dead on,
   falling to 0 at the edge of the strictness window), and the bars or keys
   with the most errors — which "Loop the tricky bit" plays again.

   THE PROGRESS. Every attempt is kept on the exercise. Three passes in a
   row in one key, at Standard or stricter, each with a timing score of 80
   or more, and the key is marked as got — and the page suggests raising
   how comfortable you say you are with it. It suggests; it does not decide.
   ============================================================ */

const LF_POS_NAMES = ['1', 'e of 1', 'and of 1', 'a of 1'];
function lfMean(xs){ return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0; }
function lfSd(xs){ if(xs.length < 2) return 0; const m = lfMean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1)); }
function lfMedian(xs){ const s = xs.slice().sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; }

/* ---------- which mode, which strictness ---------- */
/* ex: an exercise from the book; stage: its stage number (P0 counts as 0) */
function lfModeFor(ex, opts){
  const o = opts || {};
  if(o.flashcard && (o.stage || 0) <= 1) return 'pitch-class';
  const cat = String(ex && ex.category || ''), text = String(ex && (ex.name + ' ' + (ex.ask || '') + ' ' + (ex.description || '')) || '').toLowerCase();
  if(/drone|free improv|improvis/.test(text) && !/voicing/.test(text) || cat === 'improvisation') return 'free';
  if(cat === 'comping' || /charleston|comping|red garland|rhythm/.test(text)) return 'rhythm';
  if(cat === 'scale-pattern' || cat === 'melody' || /scale|pattern|lick|melody|arpeggio|enclosure|line/.test(text)) return 'sequence';
  if(cat === 'voicing' || /voicing|shell|type a|type b|drop.?2|mantooth|rootless/.test(text)) return 'exact';
  return (o.stage || 0) <= 1 ? 'pitch-class' : 'exact';
}
function lfStrictnessFor(stage){ return (+stage || 0) <= 2 ? 'lenient' : 'standard'; }
function lfIsSwing(ex){ return /swing|swung/i.test(String(ex && (ex.name + ' ' + (ex.description || '') + ' ' + (ex.category || '')) || '')); }

/* ---------- steps from a parsed score ---------- */
/* parsed notes: [{midi, on (quarters from the start), num (bar), at (quarters in bar), staff, dur}] */
function lfSteps(notes){
  const out = [];
  notes.filter(n => n.midi != null && !n.tieStop).slice().sort((a, b) => a.on - b.on || a.midi - b.midi).forEach(n => {
    const s = out[out.length - 1];
    if(s && Math.abs(s.on - n.on) < 1e-6){ if(!s.notes.includes(n.midi)) s.notes.push(n.midi); s.ids.push(n.id); return; }
    out.push({i: out.length, on: n.on, num: n.num, at: n.at, notes: [n.midi], ids: [n.id], dur: n.dur});
  });
  return out;
}
function lfIsMonophonic(steps){ return steps.length > 2 && steps.filter(s => s.notes.length === 1).length / steps.length >= 0.8; }

/* ---------- timing ---------- */
function lfTimingScore(offsetsMs, windowMs){
  const xs = offsetsMs.filter(x => x != null);
  if(!xs.length) return null;
  const w = windowMs || 80;
  return Math.round(100 * lfMean(xs.map(o => Math.max(0, 1 - Math.abs(o) / w))));
}
/* scales: how even, how fast. onsets in seconds; perBeat notes per beat */
function lfEvenness(onsets){
  const t = onsets.slice().sort((a, b) => a - b), io = [];
  for(let i = 1; i < t.length; i++) io.push(t[i] - t[i - 1]);
  if(io.length < 3) return null;
  const med = lfMedian(io);
  const kept = io.filter(x => x < med * 1.8 && x > med * 0.4);   /* a breath between phrases is not unevenness */
  return {cv: +(lfSd(kept) / lfMean(kept)).toFixed(3), ioi: +med.toFixed(3)};
}
function lfTempoOf(onsets, perBeat){
  const e = lfEvenness(onsets); if(!e) return null;
  return Math.round(60 / (e.ioi * (perBeat || 2)));
}
/* the swing ratio: pairs of eighths, long over short */
function lfSwingRatio(onsets, beatSec, t0){
  const t = onsets.slice().sort((a, b) => a - b);
  const ratios = [];
  if(beatSec && t0 != null){
    /* against the beat: where in the beat the note after it lands */
    const byBeat = new Map();
    t.forEach(x => { const p = (x - t0) / beatSec, k = Math.floor(p + 0.1), f = p - k; const l = byBeat.get(k) || byBeat.set(k, []).get(k); l.push(f); });
    byBeat.forEach(fs => { const on = fs.filter(f => f < 0.12), mid = fs.filter(f => f >= 0.35 && f <= 0.85); if(on.length && mid.length === 1) ratios.push(mid[0] / (1 - mid[0])); });
  } else {
    for(let i = 0; i + 2 < t.length; i += 2){ const a = t[i + 1] - t[i], b = t[i + 2] - t[i + 1]; if(a > 0 && b > 0) ratios.push(a / b); }
  }
  if(ratios.length < 3) return null;
  return +lfMedian(ratios).toFixed(2);
}
function lfSwingSay(r, target){
  if(r == null) return 'Not enough eighth notes to measure the swing.';
  const t = target || 2;
  const how = r < 1.25 ? 'nearly straight' : r < t - 0.35 ? 'lighter than the target' : r > t + 0.5 ? 'heavier than the target' : 'about right';
  return `Your swing ratio: ${r.toFixed(1)}:1 (target ~${t}:1) — ${how}.`;
}
/* rhythm: onsets (s) against a grid [{t, label}], each position's average early/late */
function lfRhythmReport(onsets, grid, windowMs){
  const hits = typeof ldRhythm === 'function' ? ldRhythm(onsets, grid, windowMs || 150) : [];
  const by = {};
  hits.forEach(h => { const l = by[h.label] = by[h.label] || {label: h.label, offs: [], missed: 0}; if(h.hit) l.offs.push(h.offsetMs); else l.missed++; });
  const rows = Object.values(by).map(l => ({label: l.label, n: l.offs.length, missed: l.missed, mean: l.offs.length ? Math.round(lfMean(l.offs)) : null}));
  const worst = rows.filter(r => r.mean != null && Math.abs(r.mean) >= 20).sort((a, b) => Math.abs(b.mean) - Math.abs(a.mean))[0];
  const say = worst ? `You ${worst.mean < 0 ? 'rush' : 'drag'} the ${lfPosSay(worst.label)} by ${Math.abs(worst.mean)} ms on average.` : rows.some(r => r.n) ? 'Every position within 20 ms on average.' : 'No onsets near the grid.';
  return {rows, say, hits, timing: lfTimingScore(hits.filter(h => h.hit).map(h => h.offsetMs), windowMs || 150)};
}
function lfPosSay(label){ return /^\d$/.test(label) ? `beat ${label}` : /^&\d$/.test(label) ? `“and” of ${label.slice(1)}` : label; }
/* a grid for a bar pattern: positions in beats, e.g. Charleston [0, 1.5] */
function lfGrid(t0, beatSec, bars, perBar, positions){
  const out = [];
  for(let b = 0; b < bars; b++) positions.forEach(p => { const k = Math.floor(p), f = p - k;
    out.push({t: t0 + (b * perBar + p) * beatSec, label: f === 0 ? String(k + 1) : Math.abs(f - 0.5) < 1e-6 ? '&' + (k + 1) : `${k + 1}+${f}`}); });
  return out;
}

/* ---------- lead-sheet chords ---------- */
/* spec: {pc (root), tones: semitones above the root}; heard: MIDI pitches. The guide tones must be there. */
function lfChordSymbolCheck(spec, heard){
  if(!spec) return {pass: false, missing: [], extra: [], why: 'unknown chord'};
  const tones = spec.tones.map(t => ((t % 12) + 12) % 12);
  const pcs = [...new Set(heard.map(p => ((p % 12) + 12) % 12))];
  const rel = p => ((p - spec.pc) % 12 + 12) % 12;
  const third = tones.find(t => t === 3 || t === 4), seventh = tones.find(t => t === 10 || t === 11 || t === 9);
  const need = [third, seventh].filter(t => t != null);
  if(!need.length) need.push(...tones.filter(t => t !== 0).slice(0, 2));
  const missing = need.filter(t => !pcs.some(p => rel(p) === t));
  /* anything in the chord or its usual tensions is fine; a note outside it is not */
  const allowed = new Set([...tones, 0, 7, 2, 9].concat(third === 4 && seventh === 10 ? [1, 3, 6, 8] : []));
  const extra = pcs.filter(p => !allowed.has(rel(p)));
  return {pass: !missing.length && !extra.length, missing: missing.map(t => (spec.pc + t) % 12), extra};
}

/* ---------- free playing ---------- */
function lfFreeReport(events, modePcs, binSec){
  const ev = events.slice().sort((a, b) => a.onset - b.onset);
  if(!ev.length) return {n: 0, inside: 0, outside: 0, range: null, density: [], share: null};
  const set = modePcs ? new Set(modePcs.map(p => ((p % 12) + 12) % 12)) : null;
  const inside = set ? ev.filter(e => set.has(((e.pitch % 12) + 12) % 12)).length : ev.length;
  const lo = Math.min(...ev.map(e => e.pitch)), hi = Math.max(...ev.map(e => e.pitch));
  const b = binSec || 2, t0 = ev[0].onset, bins = [];
  ev.forEach(e => { const k = Math.floor((e.onset - t0) / b); bins[k] = (bins[k] || 0) + 1; });
  const density = Array.from(bins, x => (x || 0) / b);
  return {n: ev.length, inside, outside: ev.length - inside, share: +(inside / ev.length).toFixed(2), range: [lo, hi], span: hi - lo, density, seconds: +(ev[ev.length - 1].onset - t0).toFixed(1)};
}

/* ---------- the scorecard ---------- */
/* results: one per step {i, num (bar), key?, pass, offsetMs?, played?, missing?, extra?} */
function lfScorecard(results, opts){
  const o = opts || {};
  const n = results.length;
  const right = results.filter(r => r.pass).length;
  const timing = lfTimingScore(results.map(r => r.offsetMs), o.windowMs);
  const errBy = {};
  results.forEach(r => { if(r.pass) return; const k = o.byKey && r.key ? r.key : r.num; if(k == null) return; errBy[k] = (errBy[k] || 0) + 1; });
  const worst = Object.entries(errBy).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, e]) => ({at: isNaN(+k) ? k : +k, errors: e}));
  /* the tricky bit: the worst bars and one bar either side, as one range */
  let loop = null;
  if(!o.byKey && worst.length){
    const bars = worst.map(w => w.at).filter(x => typeof x === 'number');
    if(bars.length) loop = {from: Math.max(1, Math.min(...bars) - (bars.length > 1 ? 0 : 0)), to: Math.max(...bars)};
  }
  const reaction = results.map(r => r.reaction).filter(x => x != null);
  return {n, right, accuracy: n ? Math.round(100 * right / n) : null, timing, worst, loop,
    reaction: reaction.length ? +lfMedian(reaction).toFixed(2) : null};
}

/* ---------- the progress rule ---------- */
/* attempts, newest last: {key, pass, strictness, timing}. Returns true when the key has earned it. */
function lfKeyEarned(attempts, key){
  /* whole attempts only: looping the tricky bit is practice, not proof */
  const mine = attempts.filter(a => a.key === key && !a.loop).slice(-3);
  return mine.length === 3 && mine.every(a => a.pass && a.strictness !== 'lenient' && (a.timing == null || a.timing >= 80));
}

if(typeof module !== 'undefined' && module.exports) module.exports = {lfModeFor, lfStrictnessFor, lfSteps, lfTimingScore, lfEvenness, lfTempoOf, lfSwingRatio, lfSwingSay, lfRhythmReport, lfGrid, lfChordSymbolCheck, lfFreeReport, lfScorecard, lfKeyEarned, lfIsMonophonic};
