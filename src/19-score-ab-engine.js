/* ============================================================
   SCORE STUDY — the engine: keys and chords. Pure functions over the note
   list (anParse), with no page in reach, so the same code runs in a Worker.

   KEYS. For each bar, a duration-weighted pitch-class profile (the bar, and
   half of each neighbour), correlated (Pearson) with the 24 rotations of a
   key profile — Krumhansl–Kessler, Temperley–Kostka–Payne, Aarden–Essen or
   Bellman–Budge. Then Viterbi across the bars, Temperley-style: staying in
   a key costs nothing, moving costs a penalty that grows with the distance
   between the keys on the circle of fifths, so the key does not flip every
   bar. Each span reports a confidence (how far the winner stood above the
   runner-up) and the runner-up, and warns when the runner-up is the
   winner's dominant — the classic confusion.

   CHORDS. Beat by beat, every sounding note is weighed (by how long it
   sounds in the beat, more if it starts there, more if it is the bass) and
   matched against triads and sevenths on every root; a small nudge goes to
   chords diatonic in the local key. Equal neighbours merge. Notes outside
   the chosen chord are marked as non-chord tones and classified (passing,
   neighbour, suspension, appoggiatura) from their own voice's line. The
   spelled root then becomes a Roman numeral in the local key: harmonic
   minor for V and vii°; b/# for mixture (bVI, iv in major); V/x and vii°/x
   for secondary dominants; N6; It6, Fr43, Ger65; cad64 when a I64 goes to
   V (I64 otherwise). Each label carries its function (T, PD, D), a
   functional-bass reading (T1, D7, S4…), a confidence and the runner-up.
   ============================================================ */

const AN_PROFILES = {
  kk:  {name: 'Krumhansl–Kessler', major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], minor: [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]},
  tkp: {name: 'Temperley–Kostka–Payne', major: [0.748, 0.060, 0.488, 0.082, 0.670, 0.460, 0.096, 0.715, 0.104, 0.366, 0.057, 0.400], minor: [0.712, 0.084, 0.474, 0.618, 0.049, 0.460, 0.105, 0.747, 0.404, 0.067, 0.133, 0.330]},
  ae:  {name: 'Aarden–Essen', major: [17.7661, 0.145624, 14.9265, 0.160186, 19.8049, 11.3587, 0.291248, 22.062, 0.145624, 8.15494, 0.232998, 4.95122], minor: [18.2648, 0.737619, 14.0499, 16.8599, 0.702494, 14.4362, 0.702494, 18.6161, 4.56621, 1.93186, 7.37619, 1.75623]},
  bb:  {name: 'Bellman–Budge', major: [16.80, 0.86, 12.95, 1.41, 13.49, 11.93, 1.25, 20.28, 1.80, 8.04, 0.62, 10.57], minor: [18.16, 0.69, 12.99, 13.34, 1.07, 11.15, 1.38, 21.07, 7.49, 1.53, 0.92, 10.21]},
};
/* spelled names for each tonic pitch class, and the key signature each spelling takes */
const AN_KEY_SPELL = {major: [['C', 0], ['Db', -5], ['D', 2], ['Eb', -3], ['E', 4], ['F', -1], ['F#', 6], ['G', 1], ['Ab', -4], ['A', 3], ['Bb', -2], ['B', 5]],
  minor: [['C', -3], ['C#', 4], ['D', -1], ['Eb', -6], ['E', 1], ['F', -4], ['F#', 3], ['G', -2], ['G#', 5], ['A', 0], ['Bb', -5], ['B', 2]]};
const AN_KEY_ALT = {major: {1: ['C#', 7], 6: ['Gb', -6], 11: ['Cb', -7]}, minor: {3: ['D#', 6], 8: ['Ab', -7], 10: ['A#', 7]}};

function anCorr(a, b){
  const n = a.length; let ma = 0, mb = 0; for(let i = 0; i < n; i++){ ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
  let num = 0, da = 0, db = 0; for(let i = 0; i < n; i++){ const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
function anKeyObj(tonic, mode, sigHint){
  let [name, fifths] = AN_KEY_SPELL[mode][tonic];
  const alt = AN_KEY_ALT[mode][tonic];
  if(alt && sigHint != null && Math.abs(alt[1] - sigHint) < Math.abs(fifths - sigHint)){ name = alt[0]; fifths = alt[1]; }
  const letter = name[0], alter = name.length > 1 ? (name[1] === '#' ? 1 : -1) : 0;
  return {name, tonic, mode, fifths, letter, alter};
}
function anKeyFifths(tonic, mode){ return AN_KEY_SPELL[mode][tonic][1]; }
/* the per-bar pitch-class profile */
function anBarProfiles(notes, measures){
  const prof = measures.map(() => new Array(12).fill(0));
  notes.forEach(n => {
    let t = n.on, end = n.on + n.dur, k = n.m;
    while(t < end - 1e-9 && k < measures.length){
      const M = measures[k], mEnd = M.start + M.len, part = Math.min(end, mEnd) - t;
      if(part > 0) prof[k][n.pc] += part * (t === n.on ? 1 : 0.8);
      t = mEnd; k++;
    }
  });
  return prof;
}
function anFindKeys(notes, measures, opts){
  const o = Object.assign({profile: 'tkp', penalty: 1.2}, opts || {});
  const P = AN_PROFILES[o.profile] || AN_PROFILES.tkp;
  const bars = anBarProfiles(notes, measures);
  const keys = []; for(const mode of ['major', 'minor']) for(let t = 0; t < 12; t++) keys.push({tonic: t, mode});
  const rot = (arr, t) => arr.map((_, i) => arr[(i - t + 12) % 12]);
  const profs = keys.map(k => rot(P[k.mode], k.tonic));
  /* windowed: the bar, and half of each neighbour */
  const win = bars.map((b, i) => b.map((v, pc) => v + 0.5 * ((bars[i - 1] || [])[pc] || 0) + 0.5 * ((bars[i + 1] || [])[pc] || 0)));
  const score = win.map(w => w.some(v => v > 0) ? profs.map(p => anCorr(w, p)) : profs.map(() => 0));
  /* Viterbi with a modulation penalty that grows with distance on the circle of fifths */
  const dist = (a, b) => { if(a === b) return 0; const fa = anKeyFifths(keys[a].tonic, keys[a].mode), fb = anKeyFifths(keys[b].tonic, keys[b].mode);
    const d = Math.min(Math.abs(fa - fb), 12 - Math.abs(fa - fb)); return 0.5 + 0.12 * d + (keys[a].mode !== keys[b].mode && fa !== fb ? 0.1 : 0); };
  const K = keys.length, N = score.length;
  if(!N) return {spans: [], perBar: []};
  let prev = score[0].slice(); const back = [];
  for(let i = 1; i < N; i++){
    const cur = new Array(K), bp = new Array(K);
    for(let k = 0; k < K; k++){
      let best = -Infinity, arg = 0;
      for(let j = 0; j < K; j++){ const v = prev[j] - (j === k ? 0 : o.penalty * dist(j, k)); if(v > best){ best = v; arg = j; } }
      cur[k] = best + score[i][k]; bp[k] = arg;
    }
    back.push(bp); prev = cur;
  }
  let at = prev.indexOf(Math.max(...prev)); const path = [at];
  for(let i = N - 2; i >= 0; i--){ at = back[i][at]; path.unshift(at); }
  /* spans, with confidence and the runner-up */
  const spans = [];
  path.forEach((k, i) => {
    const last = spans[spans.length - 1];
    if(last && last.k === k){ last.end = i; return; }
    spans.push({k, start: i, end: i});
  });
  const out = spans.map(sp => {
    const avg = keys.map((_, j) => { let s = 0; for(let i = sp.start; i <= sp.end; i++) s += score[i][j]; return s / (sp.end - sp.start + 1); });
    const order = avg.map((v, j) => [v, j]).sort((a, b) => b[0] - a[0]);
    const win1 = sp.k, run = order.find(x => x[1] !== win1);
    const margin = avg[win1] - run[0];
    const conf = Math.max(0, Math.min(1, 0.35 + margin * 2.2 + (avg[win1] - 0.5) * 0.6));
    const M = measures[sp.start];
    const key = anKeyObj(keys[win1].tonic, keys[win1].mode, M.fifths);
    const alt = anKeyObj(keys[run[1]].tonic, keys[run[1]].mode, M.fifths);
    const domWarn = alt.tonic === (key.tonic + 7) % 12 && alt.mode === 'major';
    return {id: 'k' + sp.start, startMeasure: M.num, startIdx: sp.start, endIdx: sp.end, startBeat: 1, key, confidence: +conf.toFixed(2),
      alternatives: [{key: alt, score: +run[0].toFixed(3)}], score: +avg[win1].toFixed(3), dominantWarning: domWarn, status: 'proposed'};
  });
  return {spans: out, perBar: path.map((k, i) => anKeyObj(keys[k].tonic, keys[k].mode, measures[i].fifths))};
}

/* ---------- chords ---------- */
const AN_QUAL = {maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], dom7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], hdim7: [0, 3, 6, 10], dim7: [0, 3, 6, 9]};
const AN_SCALE = {major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10]};
const AN_DIATONIC = {major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'], minor: ['min', 'dim', 'maj', 'min', 'maj', 'maj', 'dim']};
const AN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function anLetterIdx(l){ return 'CDEFGAB'.indexOf(l); }
function anSpellPc(pc, key, degreeHint){
  /* the spelling of a pitch class inside a key: its diatonic letter where there is one */
  const scale = AN_SCALE[key.mode];
  for(let d = 0; d < 7; d++){ const p = (key.tonic + scale[d]) % 12; if(p === pc){ const L = 'CDEFGAB'[(anLetterIdx(key.letter) + d) % 7]; return {letter: L, alter: ((pc - {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[L] + 18) % 12) - 6}; } }
  const d = degreeHint != null ? degreeHint : (() => { for(let d2 = 0; d2 < 7; d2++){ const p = (key.tonic + scale[d2] + 1) % 12; if(p === pc) return d2; } return 0; })();
  const L = 'CDEFGAB'[(anLetterIdx(key.letter) + d) % 7];
  return {letter: L, alter: ((pc - {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[L] + 18) % 12) - 6};
}
function anWindows(measures){
  const out = [];
  measures.forEach((M, k) => { const bl = (4 / M.beatType) * (M.beatType >= 8 && M.beats % 3 === 0 && M.beats > 3 ? 3 : 1);
    for(let t = 0; t < M.len - 1e-6; t += bl) out.push({m: k, num: M.num, s: M.start + t, e: M.start + Math.min(M.len, t + bl), beat: +(1 + t / bl).toFixed(3)}); });
  return out;
}
function anScoreChords(w, notes, key){
  const act = notes.filter(n => n.on < w.e - 1e-9 && n.on + n.dur > w.s + 1e-9);
  if(!act.length) return null;
  const bassMidi = Math.min(...act.map(n => n.midi));
  const wt = new Array(12).fill(0); let total = 0;
  act.forEach(n => { const ov = Math.min(n.on + n.dur, w.e) - Math.max(n.on, w.s);
    let v = ov * (Math.abs(n.on - w.s) < 1e-6 ? 1.25 : n.on > w.s ? 1 : 0.7) * (n.midi === bassMidi ? 1.35 : 1);
    wt[n.pc] += v; total += v; });
  const bassPc = ((bassMidi % 12) + 12) % 12;
  const cands = [];
  const scale = AN_SCALE[key.mode].map(x => (x + key.tonic) % 12);
  for(let r = 0; r < 12; r++) for(const [q, iv] of Object.entries(AN_QUAL)){
    const pcs = iv.map(x => (x + r) % 12);
    let s = 0, miss = 0;
    for(let pc = 0; pc < 12; pc++){ if(!wt[pc]) continue; s += pcs.includes(pc) ? wt[pc] : -0.6 * wt[pc]; }
    pcs.forEach((pc, i) => { if(!wt[pc]) miss += i === 2 && iv.length === 3 ? 0.12 : i === 0 ? 0.45 : 0.3; });
    s -= miss * total / Math.max(1, act.length) * 1.2;
    if(iv.length === 4) s -= 0.06 * total;
    if(wt[r]) s += 0.08 * total;
    if(bassPc === r) s += 0.12 * total;
    const diaDeg = scale.indexOf(r);
    if(diaDeg > -1 && AN_DIATONIC[key.mode][diaDeg] === (q.startsWith('dom') ? 'maj' : q.replace(/7$/, '').replace('hdim', 'dim'))) s += 0.1 * total;
    if(key.mode === 'minor' && r === (key.tonic + 7) % 12 && (q === 'maj' || q === 'dom7')) s += 0.1 * total;   /* harmonic minor V */
    if(key.mode === 'minor' && r === (key.tonic + 11) % 12 && (q === 'dim' || q === 'dim7')) s += 0.08 * total;
    cands.push({root: r, q, s, pcs});
  }
  cands.sort((a, b) => b.s - a.s);
  /* the augmented sixths, which are not stacks of thirds: b6 in the bass with 1 and #4 */
  const rel = pc => (pc - key.tonic + 12) % 12;
  const has = p => wt[(key.tonic + p) % 12] > 0;
  let aug6 = null;
  if(rel(bassPc) === 8 && has(0) && has(6)) aug6 = has(3) ? 'Ger' : has(2) ? 'Fr' : 'It';
  const best = cands[0];
  /* the runner-up worth showing is another chord, not the same one with a seventh added */
  const second = cands.find(c => c.root !== best.root && c.s > best.s - 0.9 * total) || cands.find(c => c.root !== best.root || (c.q !== best.q && AN_QUAL[c.q].length === AN_QUAL[best.q].length)) || cands[1];
  const explained = best.pcs.reduce((a, pc) => a + wt[pc], 0) / (total || 1);
  const conf = Math.max(0, Math.min(1, ((best.s - second.s) / (0.35 * total || 1)) * 0.6 + explained * 0.5));
  return {best, second, wt, total, bassPc, bassMidi, act, aug6, conf: +conf.toFixed(2), explained};
}
/* the Roman numeral of a chord in a key */
function anRoman(ch, key, next){
  const {root, q} = ch;
  if(ch.aug6) return {roman: ch.aug6 === 'It' ? 'It6' : ch.aug6 === 'Fr' ? 'Fr43' : 'Ger65', fn: 'PD', degree: 5, special: 'aug6'};
  const spelled = ch.spell || anSpellPc(root, key);
  const deg = (anLetterIdx(spelled.letter) - anLetterIdx(key.letter) + 7) % 7;
  const expPc = (key.tonic + AN_SCALE[key.mode][deg]) % 12;
  let acc = ((root - expPc + 18) % 12) - 6;
  /* in minor the leading-tone chords and V are diatonic (harmonic minor) */
  if(key.mode === 'minor' && deg === 6 && acc === 1 && (q === 'dim' || q === 'dim7' || q === 'hdim7')) acc = 0;
  const upper = ['maj', 'aug', 'dom7', 'maj7'].includes(q);
  let num = AN_NUMERALS[deg]; if(!upper) num = num.toLowerCase();
  const pre = acc < 0 ? 'b'.repeat(-acc) : acc > 0 ? '#'.repeat(acc) : '';
  const qs = q === 'dim' ? '°' : q === 'dim7' ? '°' : q === 'hdim7' ? 'ø' : q === 'aug' ? '+' : '';
  const seventh = ['dom7', 'maj7', 'min7', 'hdim7', 'dim7'].includes(q);
  const iv = AN_QUAL[q], bassIv = (ch.bassPc - root + 12) % 12;
  const pos = iv.indexOf(bassIv);   /* 0 root, 1 third, 2 fifth, 3 seventh */
  const fig = seventh ? ['7', '65', '43', '42'][Math.max(0, pos)] : ['', '6', '64'][Math.max(0, pos)] || '';
  /* Neapolitan */
  if(deg === 1 && acc === -1 && q === 'maj') return {roman: 'N' + (pos === 1 ? '6' : pos === 2 ? '64' : ''), fn: 'PD', degree: deg, special: 'N'};
  /* cadential 6/4: a tonic triad in second inversion, going to V */
  const nextIsV = next && next.degree === 4 && ['maj', 'dom7'].includes(next.q) && !next.applied;
  if(deg === 0 && acc === 0 && pos === 2 && !seventh && nextIsV) return {roman: 'cad64', fn: 'D', degree: 0, special: 'cad64'};
  /* secondary dominants: a major or dominant-seventh chord, or a diminished one, that is not diatonic here */
  const diatonic = acc === 0 && AN_DIATONIC[key.mode][deg] === (q === 'dom7' ? 'maj' : q.replace(/7$/, '').replace('hdim', 'dim'));
  const isDomLike = q === 'maj' || q === 'dom7', isLt = q === 'dim' || q === 'dim7' || q === 'hdim7';
  if(!(deg === 4 && isDomLike && acc === 0) && !(deg === 6 && isLt && acc === 0) && (isDomLike || isLt) && (!diatonic || q === 'dom7' && deg !== 4)){
    const tDeg = isDomLike ? (deg + 3) % 7 : (deg + 1) % 7;
    const tRoot = isDomLike ? (root + 5) % 12 : (root + 1) % 12;
    const tExp = (key.tonic + AN_SCALE[key.mode][tDeg]) % 12;
    if(tDeg !== 0 && tRoot === tExp && AN_DIATONIC[key.mode][tDeg] !== 'dim'){
      let tn = AN_NUMERALS[tDeg]; if(AN_DIATONIC[key.mode][tDeg] !== 'maj') tn = tn.toLowerCase();
      const head = isDomLike ? 'V' + (seventh ? fig : fig) : 'vii' + (q === 'hdim7' ? 'ø' : '°') + (seventh ? fig : fig);
      const resolves = next && next.root === tRoot;
      return {roman: head + '/' + tn, fn: 'D', degree: deg, applied: true, target: tDeg, resolves};
    }
  }
  const roman = pre + num + qs + (seventh && fig === '7' ? '7' : fig);
  const base = (pre + AN_NUMERALS[deg]).toUpperCase();
  let fn = 'T';
  if(deg === 4 || (deg === 6 && (isLt || acc === 0 && key.mode === 'major'))) fn = 'D';
  else if(deg === 1 || deg === 3) fn = 'PD';
  else if(deg === 6) fn = 'D';
  return {roman, fn, degree: deg, base};
}
function anFunctionalBass(fn, bassPc, key){
  const sp = anSpellPc(bassPc, key);
  const deg = (anLetterIdx(sp.letter) - anLetterIdx(key.letter) + 7) % 7 + 1;
  return (fn === 'PD' ? 'S' : fn) + deg;
}
/* classify the non-chord tones of a span from each note's own line */
function anNctType(n, prev, next, strongBeat){
  if(!prev || !next) return 'nct';
  const a = n.midi - prev.midi, b = next.midi - n.midi, step = x => Math.abs(x) >= 1 && Math.abs(x) <= 2;
  if(n.tieStop || (prev.midi === n.midi && prev.on + prev.dur >= n.on - 1e-6)) return step(b) && b < 0 ? 'suspension' : 'nct';
  if(step(a) && step(b) && Math.sign(a) === Math.sign(b)) return 'passing';
  if(step(a) && step(b) && Math.sign(a) !== Math.sign(b)) return 'neighbor';
  if(Math.abs(a) > 2 && step(b) && strongBeat) return 'appoggiatura';
  if(Math.abs(a) > 2 && step(b)) return 'incomplete neighbor';
  return 'nct';
}
function anLabelChords(notes, measures, perBarKey, opts){
  const wins = anWindows(measures);
  const raw = wins.map(w => { const key = perBarKey[w.m]; const r = anScoreChords(w, notes, key); return r ? Object.assign(r, {w, key}) : null; });
  /* merge equal neighbours inside a bar */
  const spans = [];
  raw.forEach(r => { if(!r) return;
    const last = spans[spans.length - 1];
    if(last && last.w.m === r.w.m && last.best.root === r.best.root && last.best.q === r.best.q && !r.aug6 && !last.aug6){ last.e = r.w.e; last.parts.push(r); return; }
    spans.push(Object.assign({}, r, {s: r.w.s, e: r.w.e, parts: [r]})); });
  /* pick the spelling of each root from the notes that sound it */
  spans.forEach(sp => {
    const nm = sp.act.filter(n => n.pc === sp.best.root).sort((a, b) => a.midi - b.midi)[0];
    sp.spell = nm ? {letter: nm.step, alter: nm.alter} : anSpellPc(sp.best.root, sp.key);
    const bassNotes = sp.parts.map(p => p.bassPc); sp.bassPc = bassNotes[0];
  });
  /* the numerals, reading one chord ahead (for V/x resolution and cad64) */
  const pre = spans.map(sp => ({root: sp.best.root, q: sp.best.q, bassPc: sp.bassPc, spell: sp.spell, aug6: sp.aug6}));
  const firstPass = pre.map((c, i) => { const r = anRoman(c, spans[i].key, null); return Object.assign({}, c, r); });
  const labels = spans.map((sp, i) => {
    const nextC = firstPass[i + 1] && spans[i + 1].key.tonic === sp.key.tonic ? firstPass[i + 1] : null;
    const r = anRoman(pre[i], sp.key, nextC);
    const alt2 = sp.second ? anRoman({root: sp.second.root, q: sp.second.q, bassPc: sp.bassPc, spell: anSpellPc(sp.second.root, sp.key)}, sp.key, nextC) : null;
    let conf = sp.conf;
    if(r.applied && !r.resolves) conf = Math.min(conf, 0.5);
    const beatLen = (sp.w.e - sp.w.s) || 1;
    /* non-chord tones in the span */
    const chordPcs = sp.aug6 ? [8, 0, 6, 2, 3].map(p => (sp.key.tonic + p) % 12) : AN_QUAL[sp.best.q].map(x => (x + sp.best.root) % 12);
    const ncts = sp.act.filter(n => !chordPcs.includes(n.pc)).map(n => n.id);
    return {id: 'c' + i, measure: sp.w.num, mIdx: sp.w.m, beat: sp.w.beat, on: sp.s, off: sp.e, key: anKeyName2(sp.key),
      roman: r.roman, function: r.fn, functionalBass: anFunctionalBass(r.fn, sp.bassPc, sp.key), confidence: +conf.toFixed(2),
      alt: alt2 && alt2.roman !== r.roman ? {roman: alt2.roman, function: alt2.fn} : null,
      root: (sp.spell.letter + (sp.spell.alter > 0 ? '#' : sp.spell.alter < 0 ? 'b' : '')), quality: sp.aug6 ? sp.aug6 : sp.best.q, bassPc: sp.bassPc,
      nct: ncts, status: 'proposed', special: r.special || (r.applied ? 'applied' : null)};
  });
  /* the kinds of non-chord tones, from each voice's own line */
  const lines = new Map(); notes.forEach(n => { const k = `${n.part}|${n.staff}|${n.voice}`; (lines.get(k) || lines.set(k, []).get(k)).push(n); });
  const nctKinds = {};
  lines.forEach(list => { list.sort((a, b) => a.on - b.on || b.midi - a.midi);
    const top = []; list.forEach(n => { if(!top.length || Math.abs(top[top.length - 1].on - n.on) > 1e-6) top.push(n); });
    top.forEach((n, i) => { nctKinds[n.id] = {prev: top[i - 1], next: top[i + 1]}; }); });
  const byId = new Map(notes.map(n => [n.id, n]));
  labels.forEach(l => { l.nctTypes = {}; l.nct.forEach(id => { const n = byId.get(id); const ctx = nctKinds[id] || {};
    l.nctTypes[id] = anNctType(n, ctx.prev, ctx.next, n && Math.abs(n.on - l.on) < 1e-6); }); });
  return labels;
}
function anKeyName2(k){ return k.mode === 'minor' ? k.name.toLowerCase() : k.name; }
/* the whole first pass: keys, then chords in them */
function anAnalyze(notes, measures, opts){
  const t0 = Date.now();
  const keys = anFindKeys(notes, measures, opts);
  const chords = anLabelChords(notes, measures, keys.perBar, opts);
  const rhythm = measures.map(M => chords.filter(c => c.mIdx === measures.indexOf(M)).length);
  return {keySpans: keys.spans, chordLabels: chords, harmonicRhythm: rhythm, ms: Date.now() - t0};
}
/* the functions a Worker needs, as source, so the page and the Worker run the same code */
function AN_WORKER_PARTS(){ return [anCorr, anKeyObj, anKeyFifths, anBarProfiles, anFindKeys, anLetterIdx, anSpellPc, anWindows, anScoreChords, anRoman, anFunctionalBass, anNctType, anLabelChords, anKeyName2, anAnalyze]; }
const AN_WORKER_CONSTS = () => ({AN_PROFILES, AN_KEY_SPELL, AN_KEY_ALT, AN_QUAL, AN_SCALE, AN_DIATONIC, AN_NUMERALS});
let _anWorkerUrl = null;
function anWorkerUrl(){
  if(_anWorkerUrl) return _anWorkerUrl;
  const consts = Object.entries(AN_WORKER_CONSTS()).map(([k, v]) => `const ${k} = ${JSON.stringify(v)};`).join('\n');
  const src = consts + '\n' + AN_WORKER_PARTS().map(f => f.toString()).join('\n') +
    `\nonmessage = e => { try { const r = anAnalyze(e.data.notes, e.data.measures, e.data.opts); postMessage({ok: true, r}); } catch(err){ postMessage({ok: false, error: String(err && err.message || err)}); } };`;
  _anWorkerUrl = URL.createObjectURL(new Blob([src], {type: 'text/javascript'}));
  return _anWorkerUrl;
}
/* run it in a Worker made from the functions above; fall back to the page if a Worker cannot start */
function anAnalyzeAsync(parsed, opts){
  return new Promise(resolve => {
    let w; try { w = new Worker(anWorkerUrl()); } catch(e){ resolve(Object.assign(anAnalyze(parsed.notes, parsed.measures, opts), {where: 'page'})); return; }
    const done = r => { try { w.terminate(); } catch(e){} resolve(r); };
    const timer = setTimeout(() => done(Object.assign(anAnalyze(parsed.notes, parsed.measures, opts), {where: 'page (the worker was slow)'})), 20000);
    w.onmessage = e => { clearTimeout(timer); done(e.data.ok ? Object.assign(e.data.r, {where: 'worker'}) : Object.assign(anAnalyze(parsed.notes, parsed.measures, opts), {where: 'page', workerError: e.data.error})); };
    w.onerror = () => { clearTimeout(timer); done(Object.assign(anAnalyze(parsed.notes, parsed.measures, opts), {where: 'page'})); };
    w.postMessage({notes: parsed.notes, measures: parsed.measures, opts});
  });
}
