/* ============================================================
   SONGWRITING STUDIO — THE WORKBENCH, III: MELODY
   The Melody Sketcher (scale degrees over chords, developed by hand:
   repeat, sequence, invert — Kachulis, Melody II–III; Hooktheory ch3) and
   the Constrained Melody Generator.

   THE GENERATOR IS RULES AND A DICE, NOT A MIND. An emotion preset sets
   the controls (every one of which can be changed); the controls are hard
   and soft rules; a seeded random walk proposes notes and every note that
   breaks a hard rule is thrown back and drawn again. Each note it keeps
   carries the list of rules it satisfies, which "Explain this melody"
   shows. The same seed gives the same melody.

   A melody: {notes: [{midi, t (beats), d (beats), deg?, locked?, why[]}],
   keyPc, bpm, chords [{root, quality}] (one a bar), beats (a bar)}.
   ============================================================ */

/* ---------- the Melody Sketcher ---------- */
function sngSketch(){
  const st = sngState(), u = sngUi();
  let m = st.melodies.find(x => x.id === u.melodyId);
  if(!m){ const L = sngLabState(); m = {id: uid(), name: 'A melody', keyPc: L.keyPc, colour: L.colour, prog: L.prog.slice(0, 4), bpm: 90, beats: 4, notes: [], createdAt: new Date().toISOString()}; st.melodies.unshift(m); u.melodyId = m.id; saveNow(); }
  return m;
}
const sngDegMidi = (m, deg, oct) => { const sc = SNG_KEY_COLOURS[m.colour] ? SNG_KEY_COLOURS[m.colour].scale : SNG_PITCH_SOURCES.major; const d = ((deg - 1) % sc.length + sc.length) % sc.length;
  return 60 + (oct || 0) * 12 + m.keyPc + sc[d] + Math.floor((deg - 1) / sc.length) * 12; };
function sngMelodyRange(){ const p = sngState().profile; return [sngMidiOf(p.lowNote) || 48, sngMidiOf(p.highNote) || 72]; }
SNG_TOOL_VIEWS['melody-sketcher'] = {
  html(){
    const st = sngState(), m = sngSketch(), u = sngUi(), [lo, hi] = sngMelodyRange();
    const sc = (SNG_KEY_COLOURS[m.colour] || SNG_KEY_COLOURS.major).scale;
    const len = u.skLen || 1, out = m.notes.filter(n => n.midi < lo || n.midi > hi).length;
    const total = m.notes.reduce((z, n) => Math.max(z, n.t + n.d), 0);
    return `<div class="sng-row"><select class="inp" id="skPick">${st.melodies.map(x => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <input class="inp" id="skName" value="${esc(m.name)}"><button class="tbtn" id="skNew">new</button><span class="grow"></span>
      <span class="mono faint">${esc(sngNoteName(m.keyPc))} ${esc((SNG_KEY_COLOURS[m.colour] || {}).name || '')} · over ${esc(m.prog.join('–'))} · ♩=${m.bpm}</span></div>
    <div class="card"><div class="sng-row"><span class="mono faint">add a degree</span>${sc.map((_, i) => `<button class="tbtn sng-deg" data-skdeg="${i + 1}">${i + 1}</button>`).join('')}
        ${sc.map((_, i) => `<button class="tbtn sng-deg hi" data-skdeg="${i + 1 + sc.length}" title="an octave up">${i + 1}′</button>`).join('')}
        <button class="tbtn" data-skrest="1" title="a rest">rest</button></div>
      <div class="sng-row"><span class="mono faint">length</span>${[[0.5, '♪'], [1, '♩'], [1.5, '♩.'], [2, '𝅗𝅥'], [4, '𝅝']].map(([v, s]) => `<button class="tbtn${len === v ? ' on' : ''}" data-sklen="${v}">${s}</button>`).join('')}</div>
      ${sngRollHTML(m, lo, hi)}
      <div class="sng-row"><button class="btn primary" id="skPlay">▶ Play over the chords</button><button class="tbtn" id="skUndo">undo</button><button class="tbtn" id="skClear">clear</button>
        <span class="grow"></span><span class="mono faint">develop the last motive</span>
        <button class="tbtn" data-skdev="repeat">repeat</button><button class="tbtn" data-skdev="seqUp">sequence up</button><button class="tbtn" data-skdev="seqDown">sequence down</button><button class="tbtn" data-skdev="invert">invert</button></div>
      <p class="muted">${m.notes.length} notes, ${total} beats.${out ? ` <b>${out} outside your range (${esc(st.profile.lowNote)}–${esc(st.profile.highNote)})</b>.` : ''} Press a note in the roll to take it out; lock it to keep it when the generator redraws the rest.</p>
      <div class="sng-row"><button class="tbtn" id="skSeed">Keep in the Seedbank</button><button class="tbtn" id="skMidi">Export MIDI</button></div></div>`;
  },
  bind(host){
    const st = sngState(), m = sngSketch(), u = sngUi(), q = s => host.querySelector(s);
    const redraw = () => { saveNow(); rerender(); };
    q('#skPick').onchange = e => { u.melodyId = e.target.value; rerender(); };
    q('#skName').onchange = e => { m.name = e.target.value.trim() || m.name; saveNow(); };
    q('#skNew').onclick = () => { u.melodyId = null; rerender(); };
    const end = () => m.notes.reduce((z, n) => Math.max(z, n.t + n.d), 0);
    $$('[data-skdeg]', host).forEach(b => b.onclick = () => { const deg = +b.dataset.skdeg, midi = sngDegMidi(m, deg); m.notes.push({midi, deg, t: end(), d: u.skLen || 1, why: ['placed by hand']}); sngPlayChord([midi], 'rhodes', 0.5); redraw(); });
    $$('[data-skrest]', host).forEach(b => b.onclick = () => { m.notes.push({midi: null, t: end(), d: u.skLen || 1, why: ['a rest']}); redraw(); });
    $$('[data-sklen]', host).forEach(b => b.onclick = () => { u.skLen = +b.dataset.sklen; rerender(); });
    q('#skUndo').onclick = () => { m.notes.pop(); redraw(); };
    q('#skClear').onclick = () => { m.notes = m.notes.filter(n => n.locked); redraw(); };
    $$('[data-rollnote]', host).forEach(b => b.onclick = ev => { const i = +b.dataset.rollnote, n = m.notes[i]; if(!n) return;
      if(ev.shiftKey || ev.altKey){ n.locked = !n.locked; } else { m.notes.splice(i, 1); } redraw(); });
    $$('[data-rolllock]', host).forEach(b => b.onclick = () => { const n = m.notes[+b.dataset.rolllock]; if(n){ n.locked = !n.locked; redraw(); } });
    $$('[data-skdev]', host).forEach(b => b.onclick = () => { sngDevelop(m, b.dataset.skdev); redraw(); });
    q('#skPlay').onclick = () => sngPlayMelodyOver(m);
    q('#skSeed').onclick = () => { sngSeed({type: 'melody', content: `${m.name}: ${m.notes.filter(n => n.midi != null).map(n => sngMidiName(n.midi)).join(' ')}`, source: 'Melody Sketcher', data: null}); sound('success'); toast('In the Seedbank.'); };
    q('#skMidi').onclick = () => sngDownload(sngMelodyMidi(m), `${m.name.replace(/[^\w-]+/g, '-')}.mid`);
  }
};
/* the notes as a piano roll: one row a semitone, one column a half beat */
function sngRollHTML(m, lo, hi, opts = {}){
  const notes = m.notes.filter(n => n.midi != null);
  const top = Math.max(hi + 2, ...notes.map(n => n.midi)) , bot = Math.min(lo - 2, ...notes.map(n => n.midi));
  const beats = Math.max(8, Math.ceil(m.notes.reduce((z, n) => Math.max(z, n.t + n.d), 0) / (m.beats || 4)) * (m.beats || 4));
  const rows = top - bot + 1, W = 100 / (beats * 2);
  return `<div class="sng-roll" style="--rows:${rows}" aria-label="the melody as a piano roll">${[...Array(rows)].map((_, r) => { const midi = top - r;
      return `<div class="sng-roll-row${[1, 3, 6, 8, 10].includes(sngPc(midi)) ? ' blk' : ''}${midi < lo || midi > hi ? ' out' : ''}">${sngPc(midi) === 0 ? `<em>${sngMidiName(midi)}</em>` : ''}</div>`; }).join('')}
    ${[...Array(Math.ceil(beats / (m.beats || 4)))].map((_, b) => `<i class="sng-roll-bar" style="left:${(b * (m.beats || 4) * 2 * W).toFixed(3)}%"><span>${esc((m.prog || [])[b % Math.max(1, (m.prog || []).length)] || '')}</span></i>`).join('')}
    ${m.notes.map((n, i) => n.midi == null ? '' : `<button class="sng-roll-n${n.locked ? ' locked' : ''}${n.midi < lo || n.midi > hi ? ' out' : ''}" data-rollnote="${i}" title="${esc(sngMidiName(n.midi))}${n.why ? ' — ' + esc(n.why.join('; ')) : ''}"
      style="top:${((top - n.midi) / rows * 100).toFixed(3)}%;height:${(100 / rows).toFixed(3)}%;left:${(n.t * 2 * W).toFixed(3)}%;width:${(n.d * 2 * W).toFixed(3)}%"></button>`).join('')}</div>
    ${opts.locks === false ? '' : `<div class="sng-locks">${m.notes.map((n, i) => n.midi == null ? '' : `<button class="tbtn${n.locked ? ' on' : ''}" data-rolllock="${i}" title="lock ${esc(sngMidiName(n.midi))}">${esc(sngMidiName(n.midi))}${n.locked ? ' 🔒' : ''}</button>`).join('')}</div>`}`;
}
/* developing the last motive (the notes of the last bar) */
function sngDevelop(m, how){
  const beats = m.beats || 4, endT = m.notes.reduce((z, n) => Math.max(z, n.t + n.d), 0);
  const startT = Math.max(0, Math.floor((endT - 0.001) / beats) * beats), motive = m.notes.filter(n => n.t >= startT);
  if(!motive.length) return;
  const sc = (SNG_KEY_COLOURS[m.colour] || SNG_KEY_COLOURS.major).scale;
  const stepBy = (midi, k) => { if(midi == null) return null; const pcs = sc.map(x => sngPc(m.keyPc + x)); let x = midi, n = Math.abs(k);
    while(n > 0){ x += k > 0 ? 1 : -1; if(pcs.includes(sngPc(x))) n--; } return x; };
  const pivot = motive.find(n => n.midi != null);
  motive.forEach(n => {
    let midi = n.midi;
    if(how === 'seqUp') midi = stepBy(n.midi, 1); else if(how === 'seqDown') midi = stepBy(n.midi, -1);
    else if(how === 'invert' && midi != null && pivot){ const d = midi - pivot.midi; midi = pivot.midi - d; const pcs = sc.map(x => sngPc(m.keyPc + x)); while(!pcs.includes(sngPc(midi))) midi += d > 0 ? -1 : 1; }
    m.notes.push({midi, deg: null, t: n.t - startT + beats * Math.ceil(endT / beats - 1e-9), d: n.d, why: [how === 'repeat' ? 'exact repetition' : how === 'invert' ? 'inversion of the motive' : 'sequence of the motive']});
  });
}
function sngPlayMelodyOver(m){
  const chords = (m.chords && m.chords.length ? m.chords : (m.prog || []).map(r => sngParseRoman(r))).filter(Boolean);
  const beats = m.beats || 4, len = m.notes.reduce((z, n) => Math.max(z, n.t + n.d), 0);
  const bars = Math.max(1, Math.ceil(len / beats));
  sngPlayMelody(m.notes, m.bpm || 90, {tone: 'rhodes', chords: chords.length ? [...Array(bars)].map((_, b) => ({t: b * beats, d: beats, midis: sngVoice(chords[b % chords.length], m.keyPc, 'shell').map(x => x - 12)})) : []});
}
function sngMelodyMidi(m){
  const tr = [], chords = (m.prog || []).map(r => sngParseRoman(r)).filter(Boolean), beats = m.beats || 4;
  m.notes.forEach(n => { if(n.midi == null) return; tr.push({tick: Math.round(n.t * 480), bytes: [0x90, n.midi, 90]}, {tick: Math.round((n.t + n.d) * 480) - 10, bytes: [0x80, n.midi, 0]}); });
  const ch = [], bars = Math.ceil(m.notes.reduce((z, n) => Math.max(z, n.t + n.d), 0) / beats);
  for(let b = 0; b < bars && chords.length; b++) sngVoice(chords[b % chords.length], m.keyPc, 'triad').map(x => x - 12).forEach(x => ch.push({tick: b * beats * 480, bytes: [0x91, x, 60]}, {tick: (b + 1) * beats * 480 - 10, bytes: [0x81, x, 0]}));
  return sngMidiBytes([tr, ch], m.bpm || 90, [beats, 4]);
}

/* ---------- the Constrained Melody Generator ---------- */
function sngGenState(){
  const st = sngState(), g = st.lab.gen = st.lab.gen || {};
  if(!g.preset) Object.assign(g, sngPresetControls('melancholy'), {preset: 'melancholy'});
  if(g.seed == null) g.seed = 1;
  if(!Array.isArray(g.prog)) g.prog = ['vi', 'IV', 'I', 'V'];
  if(g.keyPc == null) g.keyPc = 0;
  g.bars = g.bars || 4; g.bpm = g.bpm || 84;
  return g;
}
function sngPresetControls(id){
  const e = SNG_EMOTIONS.find(x => x.id === id) || SNG_EMOTIONS[0];
  return {source: e.source, register: e.register, range: e.range, contour: e.contour, steps: e.steps, maxLeap: e.maxLeap, stable: e.stable, density: e.density, sync: e.sync, start: e.start,
    ending: e.ending, endDeg: e.endDeg.slice(), dev: e.dev, novelty: e.novelty, chroma: e.chroma, titleDown: !!e.titleDown, phrases: 2, rests: 30, lyric: ''};
}
/* the rhythm first: from a lyric's syllables and stresses if there is one,
   else from the density and syncopation controls. → [{t, d, strong, syll?}] */
function sngGenRhythm(g, rnd, bars, beats){
  const out = [], dens = {low: 0.45, medium: 0.7, high: 0.95}[g.density] || 0.7;
  const phraseBars = Math.max(1, Math.round(bars / (g.phrases || 2)));
  const lyric = String(g.lyric || '').trim();
  if(lyric){
    /* one syllable a note; a stressed syllable lands on a strong beat */
    const lines = lyric.split(/\n+/).filter(Boolean);
    lines.slice(0, Math.max(1, g.phrases || 2)).forEach((line, li) => {
      const syl = sngScan(line); let t = li * phraseBars * beats + (g.start === 'after' ? 0.5 : g.start === 'before' ? -0.5 : 0);
      if(t < 0) t = 0;
      syl.forEach((s, k) => {
        if(s.stress && t % 1 !== 0) t = Math.ceil(t);
        const d = k === syl.length - 1 ? 2 : s.stress ? 1 : 0.5;
        out.push({t, d, strong: s.stress === 1 || t % beats === 0, syll: s.text}); t += d;
      });
    });
    return out;
  }
  for(let p = 0; p < (g.phrases || 2); p++){
    const t0 = p * phraseBars * beats, endAt = t0 + phraseBars * beats - (rnd() < g.rests / 100 ? 1 : 0.5);
    let t = t0 + (g.start === 'after' ? 0.5 : g.start === 'before' ? 0 : 0) + (g.start === 'before' && p > 0 ? -0.5 : 0);
    while(t < endAt - 0.25){
      const onBeat = Math.abs(t - Math.round(t)) < 1e-6;
      let d = rnd() < dens ? (rnd() < 0.5 ? 0.5 : 1) : (rnd() < 0.5 ? 1.5 : 2);
      if(!onBeat && rnd() * 100 < g.sync) d = 1;           /* syncopation: a longer note off the beat */
      if(t + d > endAt) d = Math.max(0.5, endAt - t);
      out.push({t, d, strong: onBeat && (Math.round(t) % beats === 0 || Math.round(t) % beats === beats / 2)});
      t += d;
    }
    const last = out[out.length - 1]; if(last) last.d = Math.max(last.d, 1.5), last.phraseEnd = true;
  }
  return out;
}
/* the target contour, 0 (low) to 1 (high), at a place 0–1 through the phrase */
function sngContourAt(c, x){
  switch(c){ case 'ascending': return x; case 'descending': return 1 - x; case 'inverted': return Math.abs(x - 0.5) * 2;
    case 'zigzag': return (Math.floor(x * 6) % 2) ? 0.7 : 0.3; case 'straight': return 0.5; case 'leap-descend': return x < 0.15 ? 0.2 + x * 5 : 1 - (x - 0.15) / 0.85 * 0.8;
    default: return x < 0.6 ? x / 0.6 : 1 - (x - 0.6) / 0.4 * 0.7; }
}
function sngGenerate(g, seed, locked){
  const rnd = sngRng(seed), beats = 4, bars = g.bars || 4;
  const chords = g.prog.map(r => sngParseRoman(r) || {root: 0, quality: 'maj'});
  const [vlo, vhi] = sngMelodyRange();
  const center = {low: 55, 'low-mid': 60, mid: 64, 'mid-high': 68, high: 72}[g.register] || 64;
  let lo = Math.max(vlo, center - Math.ceil(g.range / 2)), hi = Math.min(vhi, lo + g.range);
  if(hi - lo < 5){ lo = vlo; hi = vhi; }
  const rhythm = sngGenRhythm(g, rnd, bars, beats);
  const phraseLen = bars * beats / (g.phrases || 2);
  const notes = [], rules = [];
  const chordAt = t => chords[Math.floor(t / beats) % chords.length];
  const pitchSet = t => {
    const ch = chordAt(t);
    if(g.source === 'chord-scale'){ const i = Math.floor(t / beats) % chords.length; const sc = sngScalesFor(ch, {keyPc: g.keyPc, next: chords[(i + 1) % chords.length]}).scales[0]; return sc.deg.map(d => sngPc(g.keyPc + ch.root + d)); }
    return (SNG_PITCH_SOURCES[g.source] || SNG_PITCH_SOURCES.major).map(d => sngPc(g.keyPc + d));
  };
  const chordTones = t => { const ch = chordAt(t); return (SNG_QUALITY[ch.quality] || SNG_QUALITY.maj).slice(0, 4).map(x => sngPc(g.keyPc + ch.root + x)); };
  let prev = null, motif = null;
  rhythm.forEach((r, k) => {
    const lockedHere = (locked || []).find(n => Math.abs(n.t - r.t) < 1e-6 && n.midi != null);
    if(lockedHere){ notes.push(Object.assign({}, lockedHere, {why: ['locked by you']})); prev = lockedHere.midi; return; }
    const within = (r.t % phraseLen) / phraseLen, phraseIdx = Math.floor(r.t / phraseLen);
    /* development: later phrases echo the first motif */
    if(phraseIdx > 0 && motif && rnd() * 100 > g.novelty){
      const src = motif.find(n => Math.abs((n.t % phraseLen) - (r.t % phraseLen)) < 1e-6);
      if(src && src.midi != null){
        let m = src.midi; const why = [];
        if(g.dev === 'sequence'){ m = src.midi + (phraseIdx % 2 ? 2 : -1); why.push('sequence of the first motive'); }
        else if(g.dev === 'inversion'){ m = 2 * motif[0].midi - src.midi; why.push('inversion of the first motive'); }
        else if(g.dev === 'varied' && r.phraseEnd){ why.push('varied repetition: the ending changes'); m = null; }
        else if(g.dev === 'modified' && rnd() < 0.3){ m = src.midi + (rnd() < 0.5 ? 1 : -1) * 2; why.push('modified repetition'); }
        else why.push(g.dev === 'exact' ? 'exact repetition of the first motive' : 'repetition of the first motive');
        if(m != null){ const set = pitchSet(r.t); while(!set.includes(sngPc(m))) m += 1; if(m >= lo && m <= hi){ notes.push({midi: m, t: r.t, d: r.d, why: why.concat(['in the pitch set', 'within the range'])}); prev = m; return; } }
      }
    }
    const set = pitchSet(r.t), tones = chordTones(r.t);
    const target = lo + sngContourAt(g.contour, within) * (hi - lo);
    let best = null;
    for(let tries = 0; tries < 60 && !best; tries++){
      const cands = [];
      for(let m = lo; m <= hi; m++){
        const pc = sngPc(m);
        const chrom = !set.includes(pc);
        if(chrom && rnd() * 100 > g.chroma) continue;
        const iv = prev == null ? 0 : Math.abs(m - prev);
        if(prev != null && iv > g.maxLeap) continue;                                /* hard: the largest leap */
        let w = 1;
        w *= Math.exp(-Math.pow((m - target) / 3, 2));                              /* the contour */
        if(prev != null) w *= iv <= 2 ? g.steps / 50 : (100 - g.steps) / 50;         /* steps versus leaps */
        if(r.strong) w *= tones.includes(pc) ? (g.stable / 30) : (100 - g.stable) / 40;  /* stable notes on strong beats */
        if(chrom) w *= 0.4;
        if(g.repeats && prev === m) w *= 2;
        if(w > 0) cands.push([m, w]);
      }
      if(!cands.length) break;
      let x = rnd() * cands.reduce((a, c) => a + c[1], 0);
      for(const [m, w] of cands){ x -= w; if(x <= 0){ best = m; break; } }
      if(best == null) best = cands[cands.length - 1][0];
      /* hard: a leap is followed by a step back (the leap-then-step rule) */
      const p2 = notes.length > 1 ? notes[notes.length - 2].midi : null;
      if(p2 != null && prev != null && Math.abs(prev - p2) > 4 && Math.sign(best - prev) === Math.sign(prev - p2) && Math.abs(best - prev) > 2){ best = null; continue; }
    }
    if(best == null) best = prev != null ? prev : Math.round(target);
    const pc = sngPc(best), why = [];
    why.push(set.includes(pc) ? `in the pitch set (${g.source === 'chord-scale' ? 'the chord\'s scale' : g.source})` : 'a chromatic note (the inside–outside setting allows it)');
    if(r.strong) why.push(tones.includes(pc) ? 'a chord tone on a strong beat (stable)' : 'an unstable note on a strong beat');
    if(prev != null) why.push(Math.abs(best - prev) <= 2 ? 'moves by step' : `a leap of ${Math.abs(best - prev)} semitones (within ${g.maxLeap})`);
    why.push(`follows the ${g.contour} contour`);
    if(r.syll) why.push(`the syllable “${r.syll}”`);
    notes.push({midi: best, t: r.t, d: r.d, why, strong: r.strong, phraseEnd: r.phraseEnd});
    prev = best;
    if(phraseIdx === 0) motif = notes.slice();
  });
  /* hard rules applied after: an unstable strong note resolves by step to the
     nearest chord tone (Hooktheory); phrase endings land on the target degrees */
  const degOf = m => { const sc = SNG_PITCH_SOURCES.major; const i = sc.indexOf(sngPc(m - g.keyPc)); return i >= 0 ? i + 1 : null; };
  notes.forEach((n, i) => {
    if(n.strong && !chordTones(n.t).includes(sngPc(n.midi)) && notes[i + 1] && !notes[i + 1].locked){
      const tones = chordTones(n.t), nx = [n.midi - 2, n.midi - 1, n.midi + 1, n.midi + 2].filter(m => tones.includes(sngPc(m)) && m >= lo && m <= hi);
      const pick = g.contour === 'descending' || g.preset === 'melancholy' ? nx.sort((a, b) => a - b)[0] : nx.sort((a, b) => Math.abs(a - n.midi) - Math.abs(b - n.midi))[0];
      if(pick != null && notes[i + 1].t - n.t <= 1.01){ notes[i + 1].midi = pick; notes[i + 1].why = (notes[i + 1].why || []).filter(w => !/moves by step|leap/.test(w)).concat(['resolves the unstable note before it by step, to a chord tone']); }
    }
    if(n.phraseEnd && !n.locked && g.endDeg && g.endDeg.length){
      const want = g.endDeg.map(d => sngPc(g.keyPc + SNG_PITCH_SOURCES.major[(d - 1) % 7] + (g.source === 'minor' || g.source === 'minPent' || g.source === 'blues' || g.source === 'phrygian' || g.source === 'harmMinor' ? ([3, 6, 7].includes(d) ? -1 : 0) : 0)));
      const cands = []; for(let m = lo; m <= hi; m++) if(want.includes(sngPc(m))) cands.push(m);
      const prevM = notes[i - 1] ? notes[i - 1].midi : n.midi;
      const pick = cands.sort((a, b) => Math.abs(a - prevM) - Math.abs(b - prevM))[0];
      if(pick != null){ n.midi = pick; n.why = n.why.filter(w => !/moves by step|leap/.test(w)).concat([`a phrase ending on ${degOf(pick) || '?'} — ${g.ending === 'resolved' ? 'resolved' : 'left open'}`]); }
    }
  });
  if(g.titleDown){ const first = notes.find(n => Math.abs(n.t % (phraseLen)) < 1e-6); if(first) first.why.push('the title on the downbeat'); }
  rules.push(...sngGenRules(g, lo, hi));
  return {notes, rules, lo, hi};
}
/* the rules in force, in words, for the compliance panel */
function sngGenRules(g, lo, hi){
  return [`pitch set: ${g.source === 'chord-scale' ? 'each chord\'s scale from the Chord-Scale Map' : g.source}`, `range ${sngMidiName(lo)}–${sngMidiName(hi)} (inside your voice)`,
    `contour: ${g.contour}`, `${g.steps}% steps, largest leap ${g.maxLeap} semitones, a big leap is followed by a step back`,
    `${g.stable}% chord tones on strong beats; an unstable strong note resolves by step to a chord tone`, `${g.density} density, ${g.sync}% syncopation, phrases start ${g.start} the downbeat`,
    `phrase endings on ${g.endDeg.join(' / ')} (${g.ending})`, `development: ${g.dev}, novelty ${g.novelty}%`, `chromaticism ${g.chroma}%`].concat(g.titleDown ? ['the title on the downbeat'] : []);
}
/* check a melody against the hard rules: what the compliance panel ticks */
function sngCompliance(g, res){
  const n = res.notes.filter(x => x.midi != null), out = [];
  out.push(['every note inside the range', n.every(x => x.midi >= res.lo && x.midi <= res.hi)]);
  out.push([`no leap wider than ${g.maxLeap}`, n.every((x, i) => i === 0 || Math.abs(x.midi - n[i - 1].midi) <= g.maxLeap || (x.why || []).some(w => /locked|repetition|sequence|inversion/.test(w)))]);
  const steps = n.filter((x, i) => i > 0 && Math.abs(x.midi - n[i - 1].midi) <= 2).length / Math.max(1, n.length - 1);
  out.push([`about ${g.steps}% steps (${Math.round(steps * 100)}%)`, Math.abs(steps * 100 - g.steps) <= 25]);
  const ends = n.filter(x => x.phraseEnd); out.push([`phrase endings on ${g.endDeg.join('/')}`, ends.every(x => (x.why || []).some(w => /phrase ending/.test(w)))]);
  return out;
}
SNG_TOOL_VIEWS['melody-gen'] = {
  html(){
    const g = sngGenState(), u = sngUi();
    const res = u.genRes && u.genRes.seed === g.seed && u.genRes.key === JSON.stringify(g) ? u.genRes.res : (u.genRes = {seed: g.seed, key: JSON.stringify(g), res: sngGenerate(g, g.seed, u.genLocked)}).res;
    const e = SNG_EMOTIONS.find(x => x.id === g.preset) || SNG_EMOTIONS[0];
    const mel = {notes: res.notes, beats: 4, prog: g.prog, keyPc: g.keyPc, colour: 'major'};
    const comp = sngCompliance(g, res);
    const sel = (id, opts, v) => `<select class="inp" data-gen="${id}">${opts.map(([k, n]) => `<option value="${k}" ${String(v) === String(k) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
    const rng = (id, min, max, v, lab) => `<label>${lab} <input type="range" min="${min}" max="${max}" value="${v}" data-gen="${id}"> <span class="mono">${v}</span></label>`;
    return `<p class="muted sng-note">Seeded randomness inside rules you can see — not AI. The presets are common tendencies, not laws: change any control. Then sing it, and rewrite it.</p>
    <div class="card"><div class="sng-row"><span class="mono faint">emotion</span><select class="inp" id="genPreset">${SNG_EMOTIONS.map(x => `<option value="${x.id}" ${g.preset === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).concat((sngState().presets || []).map(p => `<option value="mine:${p.id}">${esc(p.name)} (mine)</option>`)).join('')}</select>
      <span class="muted">${esc(e.note)}</span></div>
      <div class="sng-row"><label class="mono faint">key ${sel('keyPc', SNG_NOTE_NAMES.map((n, i) => [i, n]), g.keyPc)}</label>
        <label class="mono faint">over <input class="inp mono" id="genProg" value="${esc(g.prog.join(' '))}" title="Roman numerals, one a bar"></label>
        <button class="tbtn" id="genFromLab">the Chord Lab's</button>
        <label class="mono faint">bars ${sel('bars', [[2, 2], [4, 4], [8, 8]], g.bars)}</label></div>
      <details class="sng-controls" ${u.genOpen ? 'open' : ''}><summary class="mono faint">the controls</summary><div class="sng-grid2">
        <label>Pitch source ${sel('source', Object.keys(SNG_PITCH_SOURCES).map(k => [k, k]).concat([['chord-scale', 'chord-scale (per chord)']]), g.source)}</label>
        <label>Register ${sel('register', [['low', 'low'], ['low-mid', 'low-mid'], ['mid', 'mid'], ['mid-high', 'mid-high'], ['high', 'high']], g.register)}</label>
        ${rng('range', 5, 19, g.range, 'Range (semitones)')}
        <label>Contour ${sel('contour', SNG_CONTOURS, g.contour)}</label>
        ${rng('steps', 20, 95, g.steps, 'Steps %')}${rng('maxLeap', 2, 12, g.maxLeap, 'Largest leap')}
        ${rng('stable', 10, 95, g.stable, 'Stable on strong beats %')}
        <label>Density ${sel('density', [['low', 'low'], ['medium', 'medium'], ['high', 'high']], g.density)}</label>
        ${rng('sync', 0, 80, g.sync, 'Syncopation %')}
        <label>Phrase start ${sel('start', [['on', 'on the downbeat'], ['before', 'before it'], ['after', 'after it']], g.start)}</label>
        ${rng('phrases', 1, 4, g.phrases, 'Phrases')}${rng('rests', 0, 80, g.rests, 'Space %')}
        <label>Endings ${sel('ending', [['resolved', 'resolved (1 / 3 / 5)'], ['open', 'open (2 / 4 / 7)']], g.ending)}</label>
        <label>Ending degrees <input class="inp mono" data-gen="endDeg" value="${esc(g.endDeg.join(' '))}"></label>
        <label>Development ${sel('dev', SNG_DEVELOP, g.dev)}</label>
        ${rng('novelty', 0, 100, g.novelty, 'Repetition ↔ novelty')}${rng('chroma', 0, 60, g.chroma, 'Inside ↔ outside')}
        <label class="sng-check"><input type="checkbox" data-gen="titleDown" ${g.titleDown ? 'checked' : ''}> the title on the downbeat</label>
      </div>
      <label class="sng-field"><span>A lyric to set (optional): its syllables and stresses make the rhythm</span><textarea class="inp sng-ta" rows="2" data-gen="lyric">${esc(g.lyric || '')}</textarea></label></details>
      <div class="sng-row"><button class="btn primary" id="genGo">Generate</button><button class="tbtn" id="genNew">new seed</button><span class="mono faint">seed ${g.seed}</span>
        <span class="grow"></span><span class="mono faint">nudge</span>${[['stable', 'more stable'], ['leaps', 'more leaps'], ['climax', 'higher climax'], ['sync', 'more syncopation'], ['resolved', 'more resolved']].map(([k, n]) => `<button class="tbtn" data-nudge="${k}">${n}</button>`).join('')}</div></div>
    <div class="card">${sngRollHTML(mel, res.lo, res.hi)}
      <div class="sng-row"><button class="btn" id="genPlay">▶ Play</button><button class="tbtn" id="genAccept">Accept into the Sketcher</button><button class="tbtn" id="genSix">Six over this progression</button><button class="tbtn" id="genSave">Save these controls as mine</button><button class="tbtn" id="genMidi">MIDI</button></div>
      <div class="sng-comply">${comp.map(([t, ok]) => `<span class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '·'} ${esc(t)}</span>`).join('')}</div>
      <details class="sng-why"><summary class="mono faint">explain this melody</summary><ol>${res.notes.map(n => n.midi == null ? '' : `<li><b>${esc(sngMidiName(n.midi))}</b> at beat ${(n.t + 1).toFixed(1)} — ${esc((n.why || []).join('; '))}</li>`).join('')}</ol>
        <p class="muted">The rules in force: ${esc(res.rules.join(' · '))}.</p></details></div>
    ${u.genSix ? sngGenSixHTML(g) : ''}
    <div class="card sng-contrast"><div class="sng-card-h"><b>Section contrast</b><span class="mono faint">verse low and stepwise, chorus higher with leaps and the title on the downbeat</span></div>
      <button class="tbtn" id="genContrast">make a verse and a chorus</button>${u.genPair ? `<p class="muted">Verse (seed ${u.genPair.v}) and chorus (seed ${u.genPair.c}) are in the Sketcher.</p>` : ''}</div>`;
  },
  bind(host){
    const g = sngGenState(), u = sngUi(), st = sngState(), q = s => host.querySelector(s);
    const redraw = () => { saveNow(); rerender(); };
    host.querySelector('.sng-controls').ontoggle = e => { u.genOpen = e.target.open; };
    q('#genPreset').onchange = e => { const v = e.target.value;
      if(v.startsWith('mine:')){ const p = st.presets.find(x => x.id === v.slice(5)); if(p) Object.assign(g, JSON.parse(JSON.stringify(p.controls))); }
      else Object.assign(g, sngPresetControls(v), {preset: v, lyric: g.lyric}); u.genLocked = null; redraw(); };
    $$('[data-gen]', host).forEach(c => c.onchange = () => { const k = c.dataset.gen;
      if(k === 'titleDown') g[k] = c.checked; else if(k === 'endDeg') g[k] = c.value.split(/[\s,]+/).map(Number).filter(n => n >= 1 && n <= 7);
      else if(['keyPc', 'bars', 'range', 'steps', 'maxLeap', 'stable', 'sync', 'phrases', 'rests', 'novelty', 'chroma'].includes(k)) g[k] = +c.value; else g[k] = c.value;
      redraw(); });
    $$('input[type="range"][data-gen]', host).forEach(r => r.oninput = () => { const s = r.nextElementSibling; if(s) s.textContent = r.value; });
    q('#genProg').onchange = e => { const p = e.target.value.split(/[\s,–-]+/).filter(Boolean); if(p.every(r => sngParseRoman(r))) g.prog = p; else toast('Roman numerals, like vi IV I V.'); redraw(); };
    q('#genFromLab').onclick = () => { const L = sngLabState(); g.prog = L.prog.slice(0, 8); g.keyPc = L.keyPc; redraw(); };
    q('#genGo').onclick = () => { u.genRes = null; rerender(); };
    q('#genNew').onclick = () => { g.seed = (g.seed * 7919 + 13) % 99991 || 1; u.genRes = null; redraw(); };
    $$('[data-nudge]', host).forEach(b => b.onclick = () => { const k = b.dataset.nudge;
      if(k === 'stable') g.stable = Math.min(95, g.stable + 15); else if(k === 'leaps'){ g.steps = Math.max(20, g.steps - 15); g.maxLeap = Math.min(12, g.maxLeap + 2); }
      else if(k === 'climax'){ g.range = Math.min(19, g.range + 2); g.contour = 'arch'; } else if(k === 'sync') g.sync = Math.min(80, g.sync + 15);
      else if(k === 'resolved'){ g.ending = 'resolved'; g.endDeg = [1, 3, 5]; }
      redraw(); });
    /* locks: the roll's lock buttons keep a note through the next draw */
    $$('[data-rolllock]', host).forEach(b => b.onclick = () => { const res = u.genRes && u.genRes.res; const n = res && res.notes[+b.dataset.rolllock]; if(!n) return;
      n.locked = !n.locked; u.genLocked = res.notes.filter(x => x.locked).map(x => ({midi: x.midi, t: x.t, d: x.d, locked: true})); b.classList.toggle('on'); });
    $$('[data-rollnote]', host).forEach(b => b.onclick = () => { const res = u.genRes && u.genRes.res; const n = res && res.notes[+b.dataset.rollnote]; if(n) sngPlayChord([n.midi], 'rhodes', 0.6); });
    const cur = () => u.genRes.res;
    q('#genPlay').onclick = () => sngPlayMelodyOver({notes: cur().notes, prog: g.prog, keyPc: g.keyPc, bpm: g.bpm, beats: 4});
    q('#genAccept').onclick = () => { const m = {id: uid(), name: `${(SNG_EMOTIONS.find(x => x.id === g.preset) || {name: 'Generated'}).name} — seed ${g.seed}`, keyPc: g.keyPc, colour: 'major', prog: g.prog.slice(), bpm: g.bpm, beats: 4,
      notes: cur().notes.map(n => ({midi: n.midi, t: n.t, d: n.d, why: n.why})), generated: {preset: g.preset, seed: g.seed}, createdAt: new Date().toISOString()};
      st.melodies.unshift(m); u.melodyId = m.id; sngLogSession('melody-gen'); saveNow(); toast('In the Sketcher — now sing it, and rewrite at least three notes.'); navigate('#/songwriting/tool/melody-sketcher'); };
    q('#genSix').onclick = () => { u.genSix = !u.genSix; rerender(); };
    q('#genSave').onclick = () => { const name = prompt('A name for these controls', 'My ' + ((SNG_EMOTIONS.find(x => x.id === g.preset) || {}).name || 'preset')); if(!name) return;
      st.presets.push({id: uid(), name, controls: JSON.parse(JSON.stringify(g))}); saveNow(); toast('Saved — it is in the emotion list as yours.'); rerender(); };
    q('#genMidi').onclick = () => sngDownload(sngMelodyMidi({notes: cur().notes, prog: g.prog, keyPc: g.keyPc, bpm: g.bpm, beats: 4}), `melody-${g.preset}-${g.seed}.mid`);
    q('#genContrast').onclick = () => {
      const verse = Object.assign({}, g, {register: 'low-mid', steps: 80, maxLeap: 4, range: 8, titleDown: false, contour: 'straight'});
      const chorus = Object.assign({}, g, {register: 'mid-high', steps: 50, maxLeap: 9, range: 12, titleDown: true, start: 'on', contour: 'arch', ending: 'resolved', endDeg: [1]});
      const vs = g.seed, cs = g.seed + 1;
      [[verse, vs, 'Verse'], [chorus, cs, 'Chorus']].forEach(([cfg, s, name]) => { const r = sngGenerate(cfg, s);
        st.melodies.unshift({id: uid(), name: `${name} — seed ${s}`, keyPc: g.keyPc, colour: 'major', prog: g.prog.slice(), bpm: g.bpm, beats: 4, notes: r.notes, createdAt: new Date().toISOString()}); });
      u.genPair = {v: vs, c: cs}; saveNow(); rerender(); };
    if(u.genSix) bindSngGenSix(host, g);
  }
};
/* six melodies over one progression (Kachulis's daily warm-up), a note on each */
function sngGenSixHTML(g){
  const st = sngState(), notes = st.lab.genSixNotes || {};
  return `<div class="card"><div class="sng-card-h"><b>Six melodies over one progression</b><span class="mono faint">seeds ${g.seed}–${g.seed + 5}</span></div>
    ${[0, 1, 2, 3, 4, 5].map(k => `<div class="sng-six-row"><button class="tbtn" data-gensix="${k}">▶ ${k + 1}</button><button class="tbtn" data-gensixtake="${k}">take it</button>
      <input class="inp" data-gensixnote="${g.seed + k}" value="${esc(notes[g.seed + k] || '')}" placeholder="what this one does…"></div>`).join('')}</div>`;
}
function bindSngGenSix(host, g){
  const st = sngState(), u = sngUi();
  $$('[data-gensix]', host).forEach(b => b.onclick = () => { const r = sngGenerate(g, g.seed + +b.dataset.gensix); sngPlayMelodyOver({notes: r.notes, prog: g.prog, keyPc: g.keyPc, bpm: g.bpm, beats: 4}); });
  $$('[data-gensixtake]', host).forEach(b => b.onclick = () => { g.seed = g.seed + +b.dataset.gensixtake; u.genRes = null; u.genSix = false; saveNow(); rerender(); });
  $$('[data-gensixnote]', host).forEach(i => i.onchange = () => { st.lab.genSixNotes = st.lab.genSixNotes || {}; st.lab.genSixNotes[i.dataset.gensixnote] = i.value; saveNow(); });
}
