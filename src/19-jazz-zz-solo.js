/* ============================================================
   A SOLOIST FOR THE TUNE — an improvised line over the changes, made by
   rule from the scale each chord allows (the Chord-Scale Map,
   19-sng-c-theory.js: quality AND function, inside to outside).

   The rules a line keeps, and the ones it can be told to bend:
   - chord tones on the strong beats; at a change of chord, a guide tone
     (the 3rd or the 7th) of the new chord, reached by the smallest step;
   - the eighth before a change approaches that guide tone — a half step
     from below or above, or an enclosure (the scale note above, the half
     step below, then the target);
   - between, the chord's scale, with bebop passing tones on the off-beats;
     how far outside it may go is the "outside" setting (chord tones →
     scale → tensions → altered → chromatic);
   - phrases of two or four bars with air after them; a phrase can restate
     the last one's rhythm on the new chord (a motif, developed by
     sequence) or start fresh;
   - an arpeggio up through the chord now and then, a scale line down after;
   - inside the instrument's comfortable range.
   Seeded: the same seed plays the same solo; "a new solo" draws another.
   Every note carries the rule it followed, which "show the solo" lists.
   ============================================================ */
const JZS_SOLOISTS = [['none', 'no soloist'], ['sax', 'tenor sax'], ['trumpet', 'trumpet'], ['trombone', 'trombone'], ['flute', 'flute'], ['clarinet', 'clarinet'],
  ['vibraphone', 'vibes'], ['piano', 'piano'], ['violin', 'violin']];
const JZS_RANGE = {sax: [50, 75], trumpet: [57, 82], trombone: [41, 67], flute: [62, 91], clarinet: [53, 84], vibraphone: [55, 86], piano: [57, 84], violin: [57, 88]};
const JZS_DENSITY = [['sparse', 'sparse — room to breathe'], ['medium', 'medium'], ['busy', 'busy — eighth-note lines']];
const JZS_Q = {min: 'm7', dom: '7', maj: 'maj7', hd: 'm7b5', dim: 'dim7', sus: '7sus4', aug: 'aug', other: 'maj7'};
const jzsPc = n => ((n % 12) + 12) % 12;

/* a chart symbol as the Chord-Scale Map reads it, relative to the key */
function jzsChord(sym, keyPc){
  const c = typeof jazzParseChord === 'function' ? jazzParseChord(sym) : null;
  if(!c || c.pc == null) return null;
  let q = JZS_Q[c.quality] || 'maj7';
  if(c.quality === 'min' && /6/.test(sym) && !/7/.test(sym)) q = 'm6';
  if(c.quality === 'maj' && /6/.test(sym) && !/maj7|M7|Δ/.test(sym)) q = '6';
  return {root: jzsPc(c.pc - keyPc), quality: q, roman: sym, abs: c.pc};
}
/* the pitch classes allowed at an inside/outside level, and which are chord tones */
function jzsSets(ch, next, keyPc, outside){
  const r = typeof sngScalesFor === 'function' ? sngScalesFor(ch, {keyPc, next}) : null;
  const sc = r ? r.scales[0] : {deg: [0, 2, 4, 5, 7, 9, 11], tensions: [], avoid: [], name: 'major'};
  const q = (typeof SNG_QUALITY !== 'undefined' && SNG_QUALITY[ch.quality]) || [0, 4, 7, 11];
  const abs = x => jzsPc(keyPc + ch.root + x);
  const tones = q.slice(0, 4).map(abs), third = q.includes(3) ? 3 : q.includes(4) ? 4 : 5;
  const sev = q.find(x => x === 10 || x === 11 || x === 9) != null ? q.find(x => x === 10 || x === 11 || x === 9) : 10;
  const guide = [abs(third), abs(sev)];
  let pool = sc.deg.filter(d => !(sc.avoid || []).includes(d)).map(abs);
  if(outside >= 2) pool = pool.concat((sc.tensions || []).map(abs));
  if(outside >= 3) pool = pool.concat([1, 3, 6, 8].map(abs));   /* the altered tensions */
  if(outside >= 4) pool = [...Array(12).keys()];
  if(outside <= 0) pool = tones.slice();
  return {tones, guide, pool: [...new Set(pool)], scale: sc.name, avoid: (sc.avoid || []).map(abs)};
}
/**
 * The soloist's notes for the solo choruses' bars.
 * @param bars  [{q0, len, changes: [{at, sym}], trade}] (one chorus)
 * @param o     {inst, density, outside (0–4), keyPc, seed, rnd}
 * @returns [{q, d, midi, vel, why}]
 */
function jzsSolo(bars, o){
  const rnd = o.rnd || (typeof sngRng === 'function' ? sngRng(o.seed || 1) : Math.random);
  const [lo, hi] = JZS_RANGE[o.inst] || [55, 82];
  const dens = {sparse: 0.55, medium: 0.8, busy: 0.95}[o.density || 'medium'];
  const outside = o.outside == null ? 1 : o.outside;
  /* every eighth of the chorus, with its chord and the chord after it */
  const slots = [];
  bars.forEach((b, bi) => {
    const n = Math.round(b.len * 2);
    for(let e = 0; e < n; e++){
      const at = e / 2, ch = b.changes.filter(c => c.at <= at + 1e-6).pop() || b.changes[0];
      slots.push({q: b.q0 + at, bar: bi, e, beat: at, sym: ch.sym, trade: b.trade});
    }
  });
  slots.forEach((s, i) => { const nxt = slots.slice(i + 1).find(x => x.sym !== s.sym); s.next = nxt ? nxt.sym : s.sym; s.changeNext = !!(slots[i + 1] && slots[i + 1].sym !== s.sym); s.changeHere = i === 0 || slots[i - 1].sym !== s.sym; });
  const out = [];
  let prev = Math.round((lo + hi) / 2), dir = 1, i = 0, lastPhrase = null;
  const near = (pcs, from, maxJump = 12) => { let best = null;
    for(let m = Math.max(lo, from - maxJump); m <= Math.min(hi, from + maxJump); m++) if(pcs.includes(jzsPc(m)) && (best == null || Math.abs(m - from) < Math.abs(best - from) || (Math.abs(m - from) === Math.abs(best - from) && Math.sign(m - from) === dir))) best = m;
    return best; };
  const step = (pcs, from, d) => { for(let k = 1; k <= 4; k++){ const m = from + d * k; if(m < lo || m > hi) break; if(pcs.includes(jzsPc(m))) return m; } return null; };
  while(i < slots.length){
    /* a phrase: two or four bars' worth of eighths, then air */
    const len = (rnd() < 0.55 ? 4 : 8) * (rnd() < 0.5 ? 1 : 2);
    const start = i, end = Math.min(slots.length, i + len);
    const motif = lastPhrase && rnd() < 0.35 ? lastPhrase : null;
    const rhythm = [];
    for(let k = start; k < end; k++){
      const s = slots[k];
      if(s.trade === 'drums'){ rhythm.push(0); continue; }
      const onBeat = s.e % 2 === 0;
      const play = motif ? motif[(k - start) % motif.length] : rnd() < (onBeat ? dens : dens * 0.85);
      rhythm.push(play ? 1 : 0);
    }
    let mode = rnd() < 0.2 ? 'arp' : 'line';
    for(let k = start; k < end; k++){
      const s = slots[k]; if(!rhythm[k - start]) continue;
      const ch = jzsChord(s.sym, o.keyPc), nx = jzsChord(s.next, o.keyPc);
      if(!ch) continue;
      const set = jzsSets(ch, nx, o.keyPc, outside);
      const onBeat = s.e % 2 === 0, strong = onBeat && (s.beat === 0 || s.beat === 2);
      let m = null, why = '';
      if(s.changeHere){
        m = near(set.guide, prev, 7); why = `a guide tone (${m != null && jzsPc(m) === set.guide[0] ? '3rd' : '7th'}) of ${s.sym}, by the smallest step`;
      } else if(s.changeNext && nx){
        /* approach the next chord's nearest guide tone */
        const nset = jzsSets(nx, null, o.keyPc, outside);
        const target = near(nset.guide, prev, 7);
        if(target != null){
          const kind = rnd();
          if(kind < 0.45){ m = target - 1; why = `a half step below ${s.next}'s guide tone — a chromatic approach`; }
          else if(kind < 0.7){ m = target + 1; why = `a half step above ${s.next}'s guide tone`; }
          else { const above = step(set.pool, target, 1); m = above != null ? above : target + 2; why = `the scale note above ${s.next}'s guide tone — half of an enclosure`; }
        }
      }
      if(m == null && mode === 'arp'){
        const up = set.tones.concat(set.pool.filter(p => !set.tones.includes(p)).slice(0, 1));
        m = step(up, prev, 1); why = `up the chord (${s.sym}) — an arpeggio`;
        if(m == null){ mode = 'line'; dir = -1; }
      }
      if(m == null && strong){ m = near(set.tones, prev + dir * 2, 5); why = `a chord tone of ${s.sym} on a strong beat`; }
      if(m == null){
        const bebop = !onBeat && outside >= 1 && rnd() < 0.25;
        if(bebop){ m = prev + dir; why = 'a chromatic passing tone off the beat (bebop)'; }
        else { m = step(set.pool, prev, dir); why = `along ${set.scale} (the scale for ${s.sym})`; }
        if(m == null){ dir = -dir; m = step(set.pool, prev, dir); why = `turning back along ${set.scale}`; }
      }
      if(m == null) m = prev;
      if(m < lo){ m += 12; dir = 1; } if(m > hi){ m -= 12; dir = -1; }
      if(rnd() < 0.15) dir = -dir;
      if(m >= hi - 2) dir = -1; if(m <= lo + 2) dir = 1;
      /* a note held to the next one it plays, unless there is air */
      let d = 0.5; while(k + (d * 2) < end && !rhythm[k + d * 2 - start] && d < 2) d += 0.5;
      out.push({q: s.q, d: Math.max(0.3, d - 0.05), midi: m, vel: (onBeat ? 0.62 : 0.52) + rnd() * 0.12, why, sym: s.sym});
      prev = m;
      if(mode === 'arp' && rnd() < 0.3){ mode = 'line'; dir = -1; }
    }
    lastPhrase = rhythm;
    /* air after the phrase: a beat to two bars */
    i = end + Math.round(2 + rnd() * (o.density === 'busy' ? 2 : o.density === 'sparse' ? 8 : 4));
  }
  return out;
}

const JZS_KEYS = {C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, F: 5, 'E#': 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11};
const jzsKeyPc = key => { const k = String(key || 'C').replace('♭', 'b').replace('♯', '#').replace(/m(in)?$/, ''); return JZS_KEYS[k] != null ? JZS_KEYS[k] : 0; };
/* "show the solo": each chorus's notes, bar by bar, with the rule each followed */
function jzsExplainHTML(t, s){
  let tl = null; try { tl = jazzTuneTimeline(t, jazzTuneKeyNow(t), s); } catch(e){ tl = null; }
  if(!tl) return '';
  const notes = tl.events.filter(e => e.part === 4);
  if(!notes.length) return `<div class="jzs-explain muted">No solo notes — the soloist plays only in the solo choruses.</div>`;
  const byBar = new Map(); notes.forEach(n => { const p = tl.perf[n.perf]; const k = `${p.soloN}|${p.k}`; if(!byBar.has(k)) byBar.set(k, {p, notes: []}); byBar.get(k).notes.push(n); });
  const name = m => (typeof sngMidiName === 'function' ? sngMidiName(m) : String(m));
  return `<details class="jzs-explain" open><summary class="mono">the solo, note by note — ${notes.length} notes over ${s.choruses} chorus${s.choruses > 1 ? 'es' : ''}</summary>
    <div class="jzs-bars">${[...byBar.values()].map(({p, notes}) => `<div class="jzs-bar"><span class="mono faint">chorus ${p.soloN} · bar ${p.k + 1} · ${esc(notes[0].sym || '')}</span>
      <div>${notes.map(n => `<span class="jzs-n" title="${esc(n.why || '')}"><b>${esc(name(n.midi))}</b> ${esc(n.why || '')}</span>`).join('')}</div></div>`).join('')}</div></details>`;
}
