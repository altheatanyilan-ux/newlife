/* ============================================================
   SCORE STUDY — structure: cadences, units, sections, the phrase model,
   the norm-versus-actual flags, and the rule-built write-ups and
   annotation proposals.

   CADENCES are proposed from the chords and the lines around them: the
   harmonic pattern, the soprano's scale degree at the arrival, the bass's
   motion, where the arrival falls in the bar, and whether the melody came
   down to it (a line falling to ^1 or ^2 makes closing likelier).
   Strict (Caplin): PAC, IAC, HC, deceptive, evaded, abandoned — no plagal
   or contrapuntal cadences. Broad: plagal too, and an inverted dominant
   into tonic as an IAC. A cadential progression mid-phrase is flagged
   "limited scope". Every candidate is a proposal until accepted, rejected
   or relabelled; its level (motive, phrase, theme, section) is yours.

   WRITE-UPS and ANNOTATIONS are made from the confirmed analysis by rules
   and templates — no model writes anything. They are proposals: accept,
   edit or reject them, or write your own. An annotation has no length cap
   and is never cut short.
   ============================================================ */

const AN_CAD_TYPES = {PAC: 'perfect authentic', IAC: 'imperfect authentic', HC: 'half', DC: 'deceptive', evaded: 'evaded', abandoned: 'abandoned', plagal: 'plagal'};
const AN_LEVELS = ['motive', 'phrase', 'theme', 'section'];
const AN_UNIT_KINDS = ['basic idea', 'presentation', 'continuation', 'cadential', 'antecedent', 'consequent', 'sentence', 'period', 'hybrid', 'phrase', 'theme', 'transition', 'exposition', 'development', 'recapitulation', 'coda', 'introduction', 'section'];

/* the chords as they now stand: rejected ones out, relabels in */
function anChords(a){ return (a.chordLabels || []).filter(c => c.status !== 'rejected').map(c => Object.assign({}, c, {roman: c.chosen || c.roman, function: c.chosenFn || c.function})); }
function anScaleDegreeOf(pc, keyName){
  const k = anKeyParse(keyName); if(!k) return null;
  const sp = anSpellPc(pc, k); return (anLetterIdx(sp.letter) - anLetterIdx(k.letter) + 7) % 7 + 1;
}
/* the top and bottom sounding notes at a moment */
function anOuterAt(notes, t){
  const act = notes.filter(n => n.on <= t + 1e-6 && n.on + n.dur > t + 1e-6);
  if(!act.length) return {sop: null, bass: null};
  return {sop: act.reduce((a, b) => b.midi > a.midi ? b : a), bass: act.reduce((a, b) => b.midi < a.midi ? b : a)};
}
function anIsV(c){ return /^V(7|65|43|42|6|64)?$/.test(c.roman); }
function anIsI(c){ return /^[Ii](6|64)?$/.test(c.roman); }
function anRootPos(c){ return !/(6|64|65|43|42)$/.test(c.roman); }
function anFindCadences(a, parsed, opts){
  const o = Object.assign({definition: 'broad'}, opts || {});
  const ch = anChords(a), notes = parsed.notes, M = parsed.measures, out = [];
  const lastIdx = ch.length - 1;
  const phraseStart = ch.slice(0, 2).map(c => c.roman).join(' ');
  ch.forEach((c, i) => {
    const n = ch[i + 1], p = ch[i - 1], pp = ch[i - 2];
    if(!n && !anIsV(c)) return;
    const arr = n || c;
    const mi = M.findIndex(x => x.num === arr.measure); const Mm = M[mi] || M[0];
    const downbeat = Math.abs(arr.beat - 1) < 1e-6;
    const {sop} = anOuterAt(notes, arr.on + 1e-3);
    const sopDeg = sop ? anScaleDegreeOf(sop.pc, arr.key) : null;
    const prevSop = anOuterAt(notes, c.on + 1e-3).sop;
    const falling = sop && prevSop && sop.midi < prevSop.midi;
    const prepared = p && (p.function === 'PD' || p.roman === 'cad64') || pp && pp.function === 'PD';
    const isEnd = !n || i + 1 === lastIdx;
    /* a new phrase starting after this chord: the opening chords come back */
    const restart = n && ch.slice(i + 1, i + 3).map(x => x.roman).join(' ') === phraseStart && i > 1;
    const longV = anIsV(c) && (c.off - c.on) >= Mm.len * 0.5 - 1e-6;
    const push = (type, arrival, conf, extra) => out.push(Object.assign({id: 'cd' + arrival.measure + '_' + arrival.beat + '_' + type, measure: arrival.measure, beat: arrival.beat, on: arrival.on,
      type, level: isEnd ? 'section' : (M.findIndex(x => x.num === arrival.measure) + 1) % 4 === 0 ? 'phrase' : 'motive',
      limitedScope: !downbeat || (!isEnd && (arrival.off - arrival.on) < Mm.len * 0.5 - 1e-6 && !restart), confidence: +Math.max(0.05, Math.min(0.98, conf)).toFixed(2),
      soprano: sopDeg, status: 'proposed', chordIds: [c.id, arrival.id].filter(Boolean)}, extra || {}));
    const bonus = (prepared ? 0.1 : 0) + (falling && (sopDeg === 1 || sopDeg === 2) ? 0.08 : 0) + (downbeat ? 0 : -0.2);
    /* half cadence: a root-position V held at a phrase's end, the opening coming back after it */
    if(anIsV(c) && anRootPos(c) && (restart || (longV && (!n || !anIsI(n) || restart)) || (isEnd && !n))){
      if(o.definition === 'strict' && /7/.test(c.roman)) return;
      push('HC', c, 0.62 + (restart ? 0.18 : 0) + (prepared ? 0.08 : 0), {soprano: anScaleDegreeOf((anOuterAt(notes, c.on + 1e-3).sop || {}).pc, c.key)});
      return;
    }
    if(!n) return;
    if(anIsV(c) && anIsI(n) && c.key === n.key){
      const rootBoth = anRootPos(c) && anRootPos(n);
      if(!rootBoth){
        if(o.definition === 'strict') return;
        push(/6$/.test(n.roman) ? 'evaded' : 'IAC', n, 0.35 + bonus);
        return;
      }
      if(sopDeg === 1) push('PAC', n, 0.78 + bonus + (isEnd ? 0.1 : 0));
      else push('IAC', n, 0.58 + bonus);
      return;
    }
    if(anIsV(c) && anRootPos(c) && /^(vi|VI|bVI|IV6)$/.test(n.roman) && downbeat) { push('DC', n, 0.55 + bonus); return; }
    if(anIsV(c) && /^V(6|65)$/.test(c.roman) && anIsI(n) && !anRootPos(c) && o.definition === 'broad' && (n.off - n.on) >= Mm.len * 0.5) { push('abandoned', n, 0.3 + bonus); return; }
    if(o.definition === 'broad' && /^(IV|iv)$/.test(c.roman) && anIsI(n) && anRootPos(n) && isEnd) push('plagal', n, 0.4 + bonus);
  });
  return out;
}
/* units and sections, seeded from the cadences you accepted */
function anSeedUnits(a, parsed){
  const cads = (a.cadences || []).filter(c => c.status === 'accepted' || c.status === 'relabelled').sort((x, y) => x.on - y.on);
  const M = parsed.measures, units = [];
  let start = M[0] ? M[0].num : 1;
  cads.forEach(c => { if(c.level === 'motive' || c.limitedScope) return; units.push({id: 'u' + start, startMeasure: start, startBeat: 1, endMeasure: c.measure, endBeat: M.find(m => m.num === c.measure) ? M.find(m => m.num === c.measure).beats : 4, kind: 'phrase', cadenceId: c.id, status: 'proposed'}); start = c.measure + 1; });
  if(M.length && start <= M[M.length - 1].num) units.push({id: 'u' + start, startMeasure: start, startBeat: 1, endMeasure: M[M.length - 1].num, endBeat: M[M.length - 1].beats, kind: 'phrase', status: 'proposed'});
  /* two phrases, the first ending HC and the second PAC, starting alike: antecedent and consequent */
  const ch = anChords(a);
  for(let i = 0; i + 1 < units.length; i++){
    const u1 = units[i], u2 = units[i + 1];
    const c1 = cads.find(c => c.id === u1.cadenceId), c2 = cads.find(c => c.id === u2.cadenceId);
    const open = u => ch.filter(c => c.measure >= u.startMeasure).slice(0, 2).map(c => c.roman).join(' ');
    if(c1 && c2 && c1.type === 'HC' && (c2.type === 'PAC' || c2.type === 'IAC') && open(u1) === open(u2)){ u1.kind = 'antecedent'; u2.kind = 'consequent';
      units.push({id: 'p' + u1.startMeasure, startMeasure: u1.startMeasure, startBeat: 1, endMeasure: u2.endMeasure, endBeat: u2.endBeat, kind: 'period', status: 'proposed', parts: [u1.id, u2.id]}); }
  }
  return units;
}
function anSeedSections(a, parsed){
  const M = parsed.measures; if(!M.length) return [];
  const secCads = (a.cadences || []).filter(c => (c.status === 'accepted' || c.status === 'relabelled') && (c.level === 'section' || c.level === 'theme')).sort((x, y) => x.on - y.on);
  const out = [{id: 's-all', startMeasure: M[0].num, startBeat: 1, endMeasure: M[M.length - 1].num, endBeat: M[M.length - 1].beats, label: 'The whole piece', formalRole: 'movement', parentId: null}];
  let start = M[0].num;
  secCads.forEach((c, i) => { if(c.measure >= M[M.length - 1].num) return; out.push({id: 's' + start, startMeasure: start, startBeat: 1, endMeasure: c.measure, endBeat: 4, label: `Section ${i + 1}`, formalRole: c.level, parentId: 's-all'}); start = c.measure + 1; });
  if(out.length > 1) out.push({id: 's' + start, startMeasure: start, startBeat: 1, endMeasure: M[M.length - 1].num, endBeat: M[M.length - 1].beats, label: `Section ${out.length}`, formalRole: 'section', parentId: 's-all'});
  (a.units || []).filter(u => u.status !== 'rejected' && u.kind !== 'period').forEach(u => out.push({id: 'su' + u.startMeasure, startMeasure: u.startMeasure, startBeat: 1, endMeasure: u.endMeasure, endBeat: u.endBeat, label: `${u.kind[0].toUpperCase() + u.kind.slice(1)}, bars ${u.startMeasure}–${u.endMeasure}`, formalRole: u.kind,
    parentId: out.filter(s => s.id !== 's-all' && s.startMeasure <= u.startMeasure && s.endMeasure >= u.endMeasure)[0] ? out.filter(s => s.id !== 's-all' && s.startMeasure <= u.startMeasure && s.endMeasure >= u.endMeasure)[0].id : 's-all', unitId: u.id}));
  return out;
}
/* each phrase as T–PD–D–T zones: everything before the cadential progression is tonic prolongation */
function anPhraseModel(a, unit){
  const ch = anChords(a).filter(c => c.measure >= unit.startMeasure && c.measure <= unit.endMeasure);
  if(!ch.length) return [];
  let d = -1; for(let i = ch.length - 1; i >= 0; i--){ if(ch[i].function === 'D'){ d = i; break; } }
  if(d < 0) return [{zone: 'T', from: ch[0], to: ch[ch.length - 1]}];
  let pd = d; while(pd - 1 >= 0 && (ch[pd - 1].function === 'D' || ch[pd - 1].roman === 'cad64')) pd--;
  let pdStart = pd; while(pdStart - 1 >= 0 && ch[pdStart - 1].function === 'PD') pdStart--;
  const zones = [];
  if(pdStart > 0) zones.push({zone: 'T', from: ch[0], to: ch[pdStart - 1], note: 'tonic prolongation'});
  if(pdStart < pd) zones.push({zone: 'PD', from: ch[pdStart], to: ch[pd - 1]});
  zones.push({zone: 'D', from: ch[pd], to: ch[d]});
  if(d + 1 < ch.length) zones.push({zone: 'T', from: ch[d + 1], to: ch[ch.length - 1]});
  return zones;
}
/* the norm, and where the piece does something else: worth interpreting */
function anNormFlags(a, parsed){
  const flags = [], cads = (a.cadences || []).filter(c => c.status === 'accepted' || c.status === 'relabelled').sort((x, y) => x.on - y.on);
  const last = cads[cads.length - 1];
  if(last && last.type !== 'PAC') flags.push({measure: last.measure, text: `The last cadence is ${AN_CAD_TYPES[last.type] || last.type}, not a perfect authentic cadence — the ending leaves something open.`});
  (a.units || []).filter(u => /subordinate|exposition|consequent/.test(u.kind)).forEach(u => { const c = cads.find(x => x.measure === u.endMeasure);
    if(c && c.type === 'IAC') flags.push({measure: c.measure, text: `The ${u.kind} ends with an IAC where a PAC is the norm.`}); });
  cads.filter(c => c.type === 'DC' || c.type === 'evaded').forEach(c => flags.push({measure: c.measure, text: `A cadence is promised and ${c.type === 'DC' ? 'deceived' : 'evaded'} here — the arrival is withheld.`}));
  const ch = anChords(a);
  ch.filter(c => c.roman === 'cad64').forEach(c => { if(!cads.some(x => x.on > c.on && x.on - c.on < 8)) flags.push({measure: c.measure, text: 'A cadential six-four that is not followed by a confirmed cadence.'}); });
  return flags;
}

/* ---------- write-ups, by rule ---------- */
function anSectionFacts(a, sec, parsed){
  const ch = anChords(a).filter(c => c.measure >= sec.startMeasure && c.measure <= sec.endMeasure);
  const keys = [...new Set(ch.map(c => c.key))];
  const cads = (a.cadences || []).filter(c => (c.status === 'accepted' || c.status === 'relabelled') && c.measure >= sec.startMeasure && c.measure <= sec.endMeasure);
  const count = f => ch.filter(c => c.function === f).length;
  const special = {applied: ch.filter(c => /\//.test(c.roman)), mixture: ch.filter(c => /^b/.test(c.roman) || (/^iv/.test(c.roman) && /^[A-G]/.test(c.key))), N: ch.filter(c => /^N/.test(c.roman)),
    aug6: ch.filter(c => /^(It|Fr|Ger)/.test(c.roman)), cad64: ch.filter(c => c.roman === 'cad64')};
  const units = (a.units || []).filter(u => u.status !== 'rejected' && u.startMeasure >= sec.startMeasure && u.endMeasure <= sec.endMeasure);
  const schemata = (a.schemata || []).filter(s => s.status === 'accepted' && s.startMeasure >= sec.startMeasure && s.startMeasure <= sec.endMeasure);
  const curve = (a.tension && a.tension.curve || []).filter(p => p.measure >= sec.startMeasure && p.measure <= sec.endMeasure);
  const peak = curve.length ? curve.reduce((x, y) => y.value > x.value ? y : x) : null;
  const lowConf = ch.filter(c => c.confidence < 0.45);
  return {ch, keys, cads, count, special, units, schemata, curve, peak, lowConf};
}
const anBars = (a, b) => a === b ? `bar ${a}` : `bars ${a}–${b}`;
function anWriteupBlocks(a, sec, parsed){
  const F = anSectionFacts(a, sec, parsed), b = [];
  const k = F.keys.map(x => { const kp = anKeyParse(x); return kp ? `${kp.name} ${kp.mode}` : x; });
  b.push({kind: 'harmony', title: 'Key and harmony', text: `${anBars(sec.startMeasure, sec.endMeasure)}${k.length ? ` ${k.length === 1 ? 'stay in' : 'move through'} ${k.join(' → ')}` : ''}. ${F.ch.length} chords: ${F.count('T')} tonic, ${F.count('PD')} pre-dominant, ${F.count('D')} dominant in function.` +
    (F.special.applied.length ? ` Applied chords at ${F.special.applied.map(c => `${c.roman} (bar ${c.measure})`).join(', ')} tonicise their targets for a moment.` : '') +
    (F.special.mixture.length ? ` Mixture — ${F.special.mixture.map(c => `${c.roman} in bar ${c.measure}`).join(', ')} — borrows the darker colour of the parallel minor.` : '') +
    (F.special.N.length ? ` A Neapolitan (bar ${F.special.N.map(c => c.measure).join(', ')}) leans hard into the dominant that follows.` : '') +
    (F.special.aug6.length ? ` The augmented sixth (${F.special.aug6.map(c => `${c.roman}, bar ${c.measure}`).join('; ')}) pulls outward to the dominant.` : '') +
    (F.special.cad64.length ? ` A cadential six-four in bar ${F.special.cad64.map(c => c.measure).join(', ')} is a decorated dominant, not a tonic.` : '') +
    (F.lowConf.length ? ` The reading is uncertain in ${F.lowConf.slice(0, 6).map(c => `bar ${c.measure}`).join(', ')}${F.lowConf.length > 6 ? ' and elsewhere' : ''}; check those against your ear.` : '')});
  b.push({kind: 'cadences', title: 'Cadences', text: F.cads.length ? F.cads.map(c => `${AN_CAD_TYPES[c.type] || c.type} cadence at bar ${c.measure} (${c.level}${c.limitedScope ? ', limited scope' : ''})`).join('; ') + '.' +
    (F.cads.some(c => c.type === 'HC') && F.cads.some(c => c.type === 'PAC') ? ' The half cadence opens a question the authentic cadence answers.' : '') : 'No confirmed cadence falls here: the passage is on its way somewhere else.'});
  b.push({kind: 'form', title: 'Form', text: F.units.length ? F.units.map(u => `${u.kind} (${anBars(u.startMeasure, u.endMeasure)})`).join(', ') + '.' + (F.units.some(u => u.kind === 'period') ? ' A period: the consequent answers the antecedent, and the second cadence must sound stronger than the first.' : '') : `Its role: ${sec.formalRole || 'not yet named'}.`});
  if(F.schemata.length) b.push({kind: 'schemata', title: 'Schemata', text: F.schemata.map(s => `${s.name} at bar ${s.startMeasure}${s.placement ? ` (${s.placement})` : ''}`).join('; ') + '. Schema categories are debated; these are readings, not facts.'});
  if(F.peak) b.push({kind: 'tension', title: 'Tension', text: `The harmonic tension estimate peaks at bar ${F.peak.measure}${F.peak.roman ? ` on ${F.peak.roman}` : ''} and ${F.curve[F.curve.length - 1].value < F.peak.value * 0.6 ? 'falls away to the end' : 'stays high to the end'}. (Rhythm, dynamics, register and colour also shape tension; this reads harmony alone.)`});
  const imp = [];
  const main = F.cads.slice().sort((x, y) => AN_LEVELS.indexOf(y.level) - AN_LEVELS.indexOf(x.level))[0];
  if(main) imp.push(`The main arrival is bar ${main.measure}; let the approach to it carry the section, and give the arrival its time.`);
  F.cads.filter(c => c.type === 'DC').forEach(c => imp.push(`At bar ${c.measure} the cadence is deceived: play the arrival as a surprise — the ear expected tonic.`));
  F.cads.filter(c => c.limitedScope).forEach(c => imp.push(`Bar ${c.measure} has the shape of a cadence but not its weight; keep moving through it.`));
  F.cads.filter(c => c.type === 'HC').forEach(c => imp.push(`The half cadence at bar ${c.measure} should sound open, not finished — sustain rather than settle.`));
  if(F.special.applied.length) imp.push('The applied chords are local leading-tones; a little extra direction toward each target helps the line.');
  b.push({kind: 'interpretation', title: 'What it suggests for playing', text: imp.length ? imp.join(' ') : 'Nothing here asks for more than the notes already say.'});
  return b;
}
function anWriteupsFor(a, sectionId){ return (S.writeups || []).filter(w => w.analysisId === a.id && w.sectionId === sectionId).sort((x, y) => x.createdAt < y.createdAt ? -1 : 1); }
/* a write-up version is added, never edited: accepting, editing and writing your own each add one */
function anAddWriteup(a, sectionId, blocks, status, origin){
  const row = Object.freeze({id: uid(), analysisId: a.id, scoreId: a.scoreId, sectionId, blocks: blocks.map(x => Object.assign({}, x)), status, origin, createdAt: anNow(), version: anWriteupsFor(a, sectionId).length + 1});
  S.writeups.push(row); save(); return row;
}

/* ---------- annotation proposals, by rule ---------- */
function anAnnotationProposals(a, parsed){
  const out = [], notes = parsed.notes, ch = anChords(a);
  const cads = (a.cadences || []).filter(c => c.status === 'accepted' || c.status === 'relabelled');
  const hand = n => n && n.staff >= 2 ? 'LH' : 'RH';
  const anchorOf = (list, extra) => { const n0 = list[0]; return {partId: n0.partId, staff: n0.staff, voice: n0.voice, measure: n0.num, at: n0.at, noteIds: list.map(n => n.id), pitches: list.map(n => n.midi), ...extra}; };
  const topLevel = cads.slice().sort((x, y) => AN_LEVELS.indexOf(y.level) - AN_LEVELS.indexOf(x.level) || (y.type === 'PAC') - (x.type === 'PAC'))[0];
  cads.forEach(c => {
    const {sop, bass} = anOuterAt(notes, c.on + 1e-3);
    if(c.type === 'DC' && bass) out.push({category: 'voicing', hand: 'LH', anchor: anchorOf([bass]), level: 2, linkedEventId: c.id,
      text: `LH: lean into the bass ${bass.name} — the arrival is denied.`, reason: `A deceptive cadence at bar ${c.measure}: the dominant resolves to ${ch.find(x => Math.abs(x.on - c.on) < 1e-6)?.roman || 'a substitute'} instead of the tonic, and the bass is where the surprise lives.`});
    if(c.limitedScope && sop) out.push({category: 'timing', hand: hand(sop), anchor: anchorOf([sop]), level: 1, linkedEventId: c.id, text: 'Don’t close — keep moving through.', reason: `The progression at bar ${c.measure} has a cadence's shape but sits inside the phrase; closing here would cut the line in half.`});
    if(c === topLevel && sop) out.push({category: 'timing', hand: 'both', anchor: anchorOf([sop]), level: 3, linkedEventId: c.id, text: 'Take time here — the movement’s main arrival.', reason: `The ${AN_CAD_TYPES[c.type] || c.type} cadence at bar ${c.measure} is the highest-level arrival in the piece as confirmed; everything before it has been leading here.`});
    if(c.type === 'HC' && sop) out.push({category: 'dynamics', hand: hand(sop), anchor: anchorOf([sop]), level: 2, linkedEventId: c.id, text: 'Hold the half cadence open — sustain, don’t settle.', reason: `A half cadence at bar ${c.measure} ends on the dominant: a question, not an answer.`});
  });
  /* dissonances: appoggiaturas and suspensions in the top voice */
  ch.forEach(c => Object.entries(c.nctTypes || {}).forEach(([id, t]) => { if(t !== 'appoggiatura' && t !== 'suspension') return;
    const n = notes.find(x => x.id === id); if(!n) return;
    out.push({category: 'dynamics', hand: hand(n), anchor: anchorOf([n]), level: 1, linkedEventId: c.id, text: `${hand(n)}: weight the dissonance, release into the resolution.`, reason: `The ${n.name}${n.oct} in bar ${n.num} is ${t === 'suspension' ? 'a suspension held over from the previous chord' : 'an appoggiatura, leapt to on a strong beat'}; the resolution by step is the point of it.`}); }));
  (a.schemata || []).filter(s => s.status === 'accepted' && s.name === 'Prinner').forEach(s => {
    const tops = notes.filter(n => n.num >= s.startMeasure && n.num <= (s.endMeasure || s.startMeasure) && n.staff === 1);
    if(tops.length) out.push({category: 'voicing', hand: 'RH', anchor: anchorOf([tops.reduce((x, y) => y.midi > x.midi ? y : x)]), level: 2, linkedEventId: s.id, text: 'RH top voice: shape the 6–5–4–3 descent.', reason: `A Prinner from bar ${s.startMeasure}: the melody's stepwise fall answers the opening, over a bass falling 4–3–2–1 in tenths.`});
  });
  return out.map((x, i) => Object.assign({id: 'prop' + i + '_' + x.anchor.measure, status: 'proposed', origin: 'rule'}, x));
}
