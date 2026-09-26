/* ============================================================
   SCORE STUDY — advanced layers, every one of them a proposal.

   SCHEMATA (galant voice-leading patterns, after Gjerdingen) searched in the
   bass and soprano scale degrees at each chord: Prinner (6–5–4–3 over
   4–3–2–1, in tenths; "modulating" when it sits in the dominant), Meyer,
   Romanesca, Monte, Fonte, Ponte, Morte (a chromatic lament bass falling to
   an augmented-sixth half cadence), Do–Re–Mi, Quiescenza and the converging
   cadence. Each is shown with its usual place — an opening gambit, a
   riposte, a pre-cadential move — and a reminder that schema categories are
   debated.

   NEO-RIEMANNIAN FALLBACK: where the functional reading is weak (confidence
   under the threshold), successive triads are described as P, L, R (and N,
   S) — one transformation or two — with the tones they keep in common, and
   the page says that it has switched description.

   REDUCTION: the non-chord tones dimmed, one label per harmony, and your
   own structural line — notes you mark — drawn across the score as beamed
   noteheads. Nothing here draws an Urlinie for you.

   PLAYBACK uses the room's own player; while it plays, the chord under the
   playhead and its function light up.
   ============================================================ */

const AN_SCHEMA_INFO = {
  Prinner: 'usually a riposte: it answers an opening gambit, or leads to a cadence',
  'Modulating Prinner': 'a Prinner in the dominant, bringing the music into its new key',
  Meyer: 'an opening gambit: 1–7…4–3 over 1–2…7–1',
  Romanesca: 'an opening gambit, over a bass falling by step or by leaps (1–7–6–3 / 1–5–6–3)',
  Monte: 'an ascending sequence, usually after the double bar — a climb',
  Fonte: 'a descending sequence, usually after the double bar — minor first, then major',
  Ponte: 'a bridge: the dominant prolonged, waiting for the return',
  Morte: 'a lament: a chromatic bass falling to an augmented sixth and a half cadence',
  'Do–Re–Mi': 'an opening gambit: 1–2–3 in the melody over 1–7–1 in the bass',
  Quiescenza: 'a closing gesture after a cadence, over a tonic pedal: ♭7–6–♮7–1',
  'Converging cadence': 'pre-cadential: the bass rising 4–♯4–5 into the dominant',
};
function anSchemaEvents(a, parsed){
  return anChords(a).map(c => { const {sop, bass} = anOuterAt(parsed.notes, c.on + 1e-3); const k = anKeyParse(c.key);
    const rel = n => n && k ? ((n.pc - k.tonic) + 12) % 12 : null;
    return {c, measure: c.measure, on: c.on, roman: c.roman, key: c.key, sopDeg: sop ? anScaleDegreeOf(sop.pc, c.key) : null, bassDeg: bass ? anScaleDegreeOf(bass.pc, c.key) : null, sopRel: rel(sop), bassRel: rel(bass), sop, bass}; });
}
function anFindSchemata(a, parsed){
  const ev = anSchemaEvents(a, parsed), out = [];
  /* consecutive repeats of the same outer voices count once */
  const cmp = []; ev.forEach(e => { const l = cmp[cmp.length - 1]; if(l && l.sopDeg === e.sopDeg && l.bassDeg === e.bassDeg) return; cmp.push(e); });
  const home = ev[0] ? anKeyParse(ev[0].key) : null;
  const add = (name, from, to, conf) => { if(out.some(s => s.name === name && s.startMeasure === from.measure)) return;
    const first = parsed.measures[0] ? parsed.measures[0].num : 1;
    const placement = /Prinner/.test(name) ? (from.measure - first < 2 ? 'at the opening (unusual)' : 'a riposte') : /Meyer|Romanesca|Do–Re–Mi/.test(name) ? (from.measure - first <= 4 ? 'opening gambit' : 'an opening gambit, restated') : /Converging|Ponte/.test(name) ? 'pre-cadential' : /Quiescenza/.test(name) ? 'post-cadential' : 'sequential';
    out.push({id: 'sch' + name.replace(/\W/g, '') + from.measure, name, startMeasure: from.measure, endMeasure: to.measure, placement, info: AN_SCHEMA_INFO[name] || '', confidence: +conf.toFixed(2), status: 'proposed'}); };
  const seq = (arr, key, pat) => arr.map(e => e[key]).join(',') === pat.join(',');
  for(let i = 0; i < cmp.length; i++){
    const w4 = cmp.slice(i, i + 4), w3 = cmp.slice(i, i + 3);
    if(w4.length === 4 && seq(w4, 'sopDeg', [6, 5, 4, 3]) && seq(w4, 'bassDeg', [4, 3, 2, 1])){
      const inDom = home && anKeyParse(w4[0].key) && anKeyParse(w4[0].key).tonic === (home.tonic + 7) % 12;
      add(inDom ? 'Modulating Prinner' : 'Prinner', w4[0], w4[3], 0.8);
    }
    if(w4.length === 4 && seq(w4, 'sopDeg', [1, 7, 4, 3]) && seq(w4, 'bassDeg', [1, 2, 7, 1])) add('Meyer', w4[0], w4[3], 0.7);
    if(w4.length === 4 && (seq(w4, 'bassDeg', [1, 7, 6, 3]) || seq(w4, 'bassDeg', [1, 5, 6, 3])) && [1, 3, 5].includes(w4[0].sopDeg)) add('Romanesca', w4[0], w4[3], 0.6);
    if(w3.length === 3 && seq(w3, 'sopDeg', [1, 2, 3]) && (seq(w3, 'bassDeg', [1, 7, 1]) || seq(w3, 'bassDeg', [1, 5, 1]))) add('Do–Re–Mi', w3[0], w3[2], 0.6);
    if(w3.length === 3 && w3.map(e => e.bassRel).join(',') === '5,6,7') add('Converging cadence', w3[0], w3[2], 0.6);
    if(w4.length === 4 && w4.every(e => e.bassDeg === 1) && w4.map(e => e.sopRel).join(',') === '10,9,11,0') add('Quiescenza', w4[0], w4[3], 0.65);
  }
  /* sequences from the numerals */
  const rom = ev.map(e => e.roman.replace(/(7|65|43|42|6|64)(?=\/|$)/g, ''));
  for(let i = 0; i + 3 < ev.length; i++){
    const w = rom.slice(i, i + 4).join(' ');
    if(/^V\/IV IV V\/V V$/.test(w)) add('Monte', ev[i], ev[i + 3], 0.75);
    if(/^V\/ii ii V I$/.test(w)) add('Fonte', ev[i], ev[i + 3], 0.75);
  }
  /* Ponte: the dominant in the bass across three chords or more, over two bars or more */
  for(let i = 0; i < ev.length; i++){ let j = i; while(j + 1 < ev.length && ev[j + 1].bassDeg === 5 && ev[j + 1].c.function === 'D') j++;
    if(ev[i].bassDeg === 5 && j - i >= 2 && ev[j].measure - ev[i].measure >= 1){ add('Ponte', ev[i], ev[j], 0.55); i = j; } }
  /* Morte: a bass falling by semitones four times or more, to V or an augmented sixth */
  for(let i = 0; i < ev.length; i++){ let j = i; while(j + 1 < ev.length && ev[j].bass && ev[j + 1].bass && ev[j].bass.midi - ev[j + 1].bass.midi === 1) j++;
    if(j - i >= 3 && /^(V|It|Fr|Ger)/.test(ev[j].roman)){ add('Morte', ev[i], ev[j], 0.6); i = j; } }
  return out;
}
/* ---------- Neo-Riemannian ---------- */
function anTriad(c){ if(!c.root || !['maj', 'min'].includes(c.quality)) return null; const k = anKeyParse(c.root); return k ? {r: k.tonic, maj: c.quality === 'maj'} : null; }
function anNR1(t, op){
  const {r, maj} = t;
  if(op === 'P') return {r, maj: !maj};
  if(op === 'R') return maj ? {r: (r + 9) % 12, maj: false} : {r: (r + 3) % 12, maj: true};
  if(op === 'L') return maj ? {r: (r + 4) % 12, maj: false} : {r: (r + 8) % 12, maj: true};
  if(op === 'N') return maj ? {r: (r + 5) % 12, maj: false} : {r: (r + 7) % 12, maj: true};
  if(op === 'S') return maj ? {r: (r + 1) % 12, maj: false} : {r: (r + 11) % 12, maj: true};
  return t;
}
function anNRPath(a, b){
  if(a.r === b.r && a.maj === b.maj) return '';
  const eq = (x, y) => x.r === y.r && x.maj === y.maj;
  for(const op of ['P', 'L', 'R', 'N', 'S']) if(eq(anNR1(a, op), b)) return op;
  for(const o1 of ['P', 'L', 'R']) for(const o2 of ['P', 'L', 'R']) if(eq(anNR1(anNR1(a, o1), o2), b)) return o1 + o2;
  return null;
}
function anNRDescribe(a, parsed, threshold){
  const ch = anChords(a), out = [], th = threshold == null ? 0.35 : threshold;
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  for(let i = 0; i + 1 < ch.length; i++){
    const x = ch[i], y = ch[i + 1];
    if(Math.min(x.confidence, y.confidence) >= th) continue;
    const tx = anTriad(x), ty = anTriad(y); if(!tx || !ty) continue;
    const path = anNRPath(tx, ty); if(path === '' || path == null) continue;
    const px = AN_QUAL[tx.maj ? 'maj' : 'min'].map(v => (v + tx.r) % 12), py = AN_QUAL[ty.maj ? 'maj' : 'min'].map(v => (v + ty.r) % 12);
    const common = px.filter(p => py.includes(p));
    out.push({measure: y.measure, from: names[tx.r] + (tx.maj ? '' : 'm'), to: names[ty.r] + (ty.maj ? '' : 'm'), path, common: common.map(p => names[p]),
      text: `${names[tx.r]}${tx.maj ? '' : 'm'} → ${names[ty.r]}${ty.maj ? '' : 'm'}: ${path.split('').join('·')} (${common.length} common tone${common.length === 1 ? '' : 's'}${common.length ? ': ' + common.map(p => names[p]).join(', ') : ''})`});
  }
  return out;
}
/* ---------- the reduction ---------- */
function anPaintReduction(x, a, parsed){
  const stage = document.getElementById('scStage'); if(!stage) return;
  let layer = stage.querySelector('#anRed'); if(!layer){ layer = document.createElement('div'); layer.id = 'anRed'; layer.className = 'an-red'; stage.appendChild(layer); }
  const prefs = anEnsure();
  if(!anStudyOn() || !a){ layer.innerHTML = ''; return; }
  const pos = anNotePositions(); let html = '';
  if(prefs.nctDim){
    const nct = new Set(anChords(a).flatMap(c => c.nct || []));
    const byKey = new Map(parsed.notes.map(n => [`${n.num}|${n.staff}|${n.at.toFixed(3)}|${n.midi}`, n]));
    pos.forEach(p => { const n = byKey.get(`${p.num}|${p.staff}|${p.at.toFixed(3)}|${p.midi}`); if(n && nct.has(n.id)) html += `<i class="an-dim" style="left:${p.x - 2}px;top:${p.y - 6}px"></i>`; });
  }
  /* the structural line: yours, drawn as noteheads joined by a beam */
  const line = (a.structLine || []).map(s => { const p = pos.find(q => q.num === s.measure && q.staff === s.staff && Math.abs(q.at - s.at) < 1e-3 && q.midi === s.midi); return p ? Object.assign({}, s, {x: p.x, y: p.y}) : null; }).filter(Boolean);
  [1, 2].forEach(st => { const pts = line.filter(p => p.staff === st).sort((p, q) => p.measure - q.measure || p.at - q.at); if(!pts.length) return;
    html += `<svg class="an-structsvg" style="left:0;top:0" width="100%" height="100%"><polyline points="${pts.map(p => `${p.x + 5},${p.y - 30}`).join(' ')}"/>${pts.map(p => `<line x1="${p.x + 5}" y1="${p.y - 30}" x2="${p.x + 5}" y2="${p.y}"/><circle cx="${p.x + 5}" cy="${p.y}" r="5"/>`).join('')}</svg>`; });
  layer.innerHTML = html;
}
/* ---------- playback: the chord under the playhead ---------- */
function anOnPlayPosition(pm, q){
  if(!anStudyOn() || !_anCtx || !_anCtx.a) return;
  const M = _anCtx.parsed.measures[pm.k]; if(!M) return;
  const t = M.start + (q - pm.q0);
  const c = anChords(_anCtx.a).find(c => c.mIdx === pm.k && c.on <= t + 1e-6 && t < c.off - 1e-6) || anChords(_anCtx.a).filter(c => c.on <= t).slice(-1)[0];
  const box = document.getElementById('anNow'); if(!box || !c) return;
  if(box.dataset.cid === c.id) return; box.dataset.cid = c.id;
  box.innerHTML = `<b class="an-fn ${c.function}">${esc(c.roman)}</b> <span>${{T: 'tonic', PD: 'pre-dominant', D: 'dominant'}[c.function] || ''}</span> <span class="faint">bar ${c.measure} · ${esc(c.key)}</span>`;
  document.querySelectorAll('.an-chip.now').forEach(e => e.classList.remove('now'));
  const chip = document.querySelector(`.an-chip[data-anc="${c.id}"]`); if(chip) chip.classList.add('now');
}
