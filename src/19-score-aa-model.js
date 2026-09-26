/* ============================================================
   SCORE STUDY — the model. The analysis layer of the Repertoire room.

   It reads the score rows the room already has (S.scores, x.musicXml) and
   keeps what it works out beside them, never inside them:

   analyses          one row per VERSION of an analysis of a score: its key
                     spans, chord labels, cadences, units, sections, schemata,
                     structural line and tension, nested. origin: auto |
                     companion | expert-import | mine. A version is a draft
                     until frozen; a frozen version is never changed again —
                     revising it starts a new row that points back (parentId).
   writeups          add-only versions of a section's write-up
   takes             tap-along tempo captures
   performanceNotes  pinpoint annotations, anchored to notes, never pixels
   ambiguities       add-only: every override and every choice between
                     readings, with the readings and (if given) why
   omrReviews        one row per score: a status for each bar after OMR

   Everything automatic carries a confidence and the runner-up reading;
   everything that needs judgment is a proposal (status 'proposed') until it
   is accepted, rejected or relabelled.
   ============================================================ */

const AN_STORES = ['analyses', 'writeups', 'takes', 'performanceNotes', 'ambiguities', 'omrReviews'];
const AN_STEP_PC = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
const AN_LETTERS = 'CDEFGAB';
function anEnsure(){
  AN_STORES.forEach(k => { if(!Array.isArray(S[k])) S[k] = []; });
  S.anPrefs = Object.assign({profile: 'tkp', penalty: 1.2, cadence: 'broad', inlineWords: 12, nctDim: false, showChords: true, showKeys: true, showCadences: true,
    showNotes: true, noteFilter: {hand: '', category: '', level: 0}, arches: false, weights: null, nrThreshold: 0.35, density: 'normal'}, S.anPrefs || {});
  return S.anPrefs;
}
function anNow(){ return new Date().toISOString(); }

/* ---------- reading the MusicXML: every note, spelled ---------- */
function anKids(el, name){ return el ? [...el.children].filter(c => c.nodeName === name) : []; }
function anKid(el, name){ return el ? [...el.children].find(c => c.nodeName === name) || null : null; }
function anTxt(el, name, d){ const k = anKid(el, name); return k ? k.textContent.trim() : (d === undefined ? '' : d); }
function anNum(el, name, d){ const v = parseFloat(anTxt(el, name, '')); return isFinite(v) ? v : d; }
/* A note list for analysis: onset and duration in quarters, spelled pitch,
   part, staff, voice, the written bar (index and its printed number), the
   beat, and a stable id: part.measure.staff.voice.onset.pitch */
function anParse(xml){
  const doc = typeof xml === 'string' ? new DOMParser().parseFromString(xml, 'application/xml') : xml;
  if(!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length) throw new Error('That is not MusicXML this can read.');
  const root = doc.documentElement;
  if(root.nodeName !== 'score-partwise') throw new Error('Study reads partwise MusicXML (what MuseScore and most editors write).');
  const partNames = {}; anKids(anKid(root, 'part-list'), 'score-part').forEach(sp => partNames[sp.getAttribute('id')] = anTxt(sp, 'part-name') || sp.getAttribute('id'));
  const parts = anKids(root, 'part');
  const measures = [], notes = [], problems = [];
  let nMeasures = Math.max(0, ...parts.map(p => anKids(p, 'measure').length));
  /* the bar grid comes from the first part; every part shares it */
  parts.forEach((p, pi) => {
    const pid = p.getAttribute('id');
    let div = 1, beats = 4, beatType = 4, fifths = 0, mode = 'major', abs = 0;
    anKids(p, 'measure').forEach((m, k) => {
      const numAttr = m.getAttribute('number'), implicit = m.getAttribute('implicit') === 'yes';
      let pos = 0, maxPos = 0, lastOnset = 0;
      const perVoice = {};
      for(const c of m.children){
        const nm = c.nodeName;
        if(nm === 'attributes'){
          const dv = anNum(c, 'divisions', 0); if(dv > 0) div = dv;
          const tm = anKid(c, 'time'); if(tm){ const b = String(anTxt(tm, 'beats')).split('+').reduce((a, x) => a + (parseFloat(x) || 0), 0); if(b > 0){ beats = b; beatType = anNum(tm, 'beat-type', 4); } }
          const ky = anKid(c, 'key'); if(ky){ fifths = anNum(ky, 'fifths', 0); mode = anTxt(ky, 'mode') || 'major'; }
        } else if(nm === 'note'){
          const grace = !!anKid(c, 'grace'), chord = !!anKid(c, 'chord'), cue = !!anKid(c, 'cue');
          const dur = grace ? 0 : anNum(c, 'duration', 0) / div;
          const onset = chord ? lastOnset : pos;
          if(!chord && !grace){ lastOnset = pos; pos += dur; }
          maxPos = Math.max(maxPos, pos);
          const voice = anTxt(c, 'voice') || '1';
          if(!chord && !grace) perVoice[voice] = (perVoice[voice] || 0) + dur;
          if(cue || anKid(c, 'rest') || grace) continue;
          const pt = anKid(c, 'pitch'); if(!pt) continue;
          const step = anTxt(pt, 'step'), alter = Math.round(anNum(pt, 'alter', 0)), oct = anNum(pt, 'octave', 4);
          const midi = 12 * (oct + 1) + AN_STEP_PC[step] + alter;
          const ties = anKids(c, 'tie').map(t => t.getAttribute('type'));
          notes.push({part: pi, partId: pid, staff: anNum(c, 'staff', 1), voice, m: k, at: onset, dur, step, alter, oct, midi, pc: ((midi % 12) + 12) % 12,
            tieStop: ties.includes('stop'), tieStart: ties.includes('start'), fermata: !!anKid(anKid(c, 'notations'), 'fermata')});
        } else if(nm === 'backup'){ pos = Math.max(0, pos - anNum(c, 'duration', 0) / div); }
        else if(nm === 'forward'){ pos += anNum(c, 'duration', 0) / div; maxPos = Math.max(maxPos, pos); }
      }
      const len = beats * 4 / beatType;
      if(pi === 0){
        const num = /^-?\d+$/.test(numAttr || '') ? parseInt(numAttr, 10) : (measures.length ? measures[measures.length - 1].num + 1 : 1);
        measures.push({idx: k, num, beats, beatType, len, fifths, mode, start: abs, implicit});
      }
      /* the sanity check: each voice's notes and rests should fill the bar */
      const want = len;
      Object.entries(perVoice).forEach(([v, sum]) => {
        const first = k === 0, last = k === nMeasures - 1;
        if(Math.abs(sum - want) > 1e-3 && !(sum < want && (first || last || implicit)))
          problems.push({m: k, part: pi, voice: v, have: +sum.toFixed(3), want: +want.toFixed(3)});
      });
      abs += (measures[k] ? measures[k].len : len);
    });
  });
  /* absolute onsets, beats and stable ids, now that the bar grid is known */
  notes.forEach(n => {
    const M = measures[n.m] || measures[measures.length - 1];
    n.num = M.num; n.on = M.start + n.at;
    const beatLen = anBeatLen(M);
    n.beat = +(1 + n.at / beatLen).toFixed(4);
    n.name = n.step + (n.alter > 0 ? '#'.repeat(n.alter) : n.alter < 0 ? 'b'.repeat(-n.alter) : '');
    n.id = `${n.partId}.${n.num}.${n.staff}.${n.voice}.${+n.at.toFixed(4)}.${n.name}${n.oct}`;
  });
  notes.sort((a, b) => a.on - b.on || a.midi - b.midi);
  /* the index within a chord, from the bottom, per part/staff/voice/onset */
  const groups = new Map();
  notes.forEach(n => { const g = `${n.partId}|${n.num}|${n.staff}|${n.voice}|${n.at.toFixed(4)}`; (groups.get(g) || groups.set(g, []).get(g)).push(n); });
  groups.forEach(list => list.sort((a, b) => a.midi - b.midi).forEach((n, i) => n.idx = i));
  return {measures, notes, parts: parts.map(p => ({id: p.getAttribute('id'), name: partNames[p.getAttribute('id')] || p.getAttribute('id')})), problems};
}
/* a beat: the dotted quarter in compound time, the beat-type otherwise */
function anBeatLen(M){ const q = 4 / M.beatType; return M.beatType >= 8 && M.beats % 3 === 0 && M.beats > 3 ? q * 3 : q; }
/* the parse is cached per score and per text: parsing is the slow part */
const _anParsed = new Map();
function anParsed(x){
  const key = x.id + ':' + (x.musicXml || '').length;
  if(_anParsed.has(key)) return _anParsed.get(key);
  const p = anParse(x.musicXml); _anParsed.clear(); _anParsed.set(key, p); return p;
}

/* ---------- versions ---------- */
function anVersions(scoreId){ return S.analyses.filter(a => a.scoreId === scoreId).sort((a, b) => a.version - b.version); }
function anCurrent(scoreId){
  const p = anEnsure(); const list = anVersions(scoreId);
  const pick = p.current && p.current[scoreId] ? list.find(a => a.id === p.current[scoreId]) : null;
  return pick || list.filter(a => !a.orphan).slice(-1)[0] || null;
}
function anSetCurrent(scoreId, id){ const p = anEnsure(); p.current = p.current || {}; p.current[scoreId] = id; save(); }
function anNewVersion(scoreId, origin, data, parent){
  anEnsure();
  const version = anVersions(scoreId).reduce((m, a) => Math.max(m, a.version || 0), 0) + 1;
  const a = Object.assign({id: uid(), scoreId, version, parentId: parent ? parent.id : null, origin: origin || 'auto', frozen: false, createdAt: anNow(), updatedAt: anNow(),
    settings: Object.assign({}, S.anPrefs), rntxt: '', keySpans: [], chordLabels: [], cadences: [], units: [], sections: [], schemata: [], structLine: [], tension: null, notes: ''},
    data ? JSON.parse(JSON.stringify(data)) : {});
  a.id = a.id && !S.analyses.some(x => x.id === a.id) ? a.id : uid(); a.version = version; a.frozen = false; a.createdAt = anNow(); a.parentId = parent ? parent.id : (a.parentId || null);
  S.analyses.push(a); anSetCurrent(scoreId, a.id); save();
  return a;
}
/* an edit to a frozen version starts a new one; a draft is edited in place */
function anEditable(a){
  if(!a) return null;
  if(!a.frozen) return a;
  const copy = JSON.parse(JSON.stringify(a)); delete copy.id;
  return anNewVersion(a.scoreId, a.origin === 'auto' ? 'mine' : a.origin, copy, a);
}
function anFreeze(a, label){ if(!a || a.frozen) return; a.frozen = true; a.frozenAt = anNow(); a.label = label || a.label || `Version ${a.version}`; save(); }

/* ---------- the decision log: add-only ---------- */
function anLog(scoreId, entry){
  anEnsure();
  const row = Object.freeze(Object.assign({id: uid(), scoreId, createdAt: anNow()}, entry));
  S.ambiguities.push(row); save(); return row;
}
/* persist() calls this before writing: what was written stays written */
function anGuard(rows, lastWritten){
  let broke = 0;
  const check = (k, protectedRow) => {
    if(!lastWritten[k]) return;
    let prev; try { prev = JSON.parse(lastWritten[k]); } catch(e){ return; }
    const cur = new Map((rows[k] || []).map(r => [r.id, r])); const fixed = (rows[k] || []).slice();
    prev.forEach(old => { if(!protectedRow(old)) return;
      const now = cur.get(old.id); if(now && JSON.stringify(now) === JSON.stringify(old)) return;
      broke++; if(k !== 'analyses') Object.freeze(old); const i = fixed.findIndex(r => r.id === old.id); if(i > -1) fixed[i] = old; else fixed.push(old); });
    if(broke){ S[k] = fixed; rows[k] = fixed; }
  };
  check('ambiguities', () => true);
  check('writeups', () => true);
  check('analyses', r => r.frozen);
  if(broke){ console.warn(`Score Study: ${broke} add-only record(s) were changed or removed; put back.`);
    if(typeof toast === 'function') toast('A saved interpretation, write-up or decision cannot be changed or removed. It has been put back.', 5000); }
  return broke;
}

/* ---------- RomanText ---------- */
/* keys are written C: for major and c: for minor, with # and b */
function anKeyName(k){ if(!k) return '?'; return k.mode === 'minor' ? k.name.toLowerCase() : k.name; }
function anKeyParse(s){
  const m = /^([A-Ga-g])([#b-]*)$/.exec(String(s).trim()); if(!m) return null;
  const letter = m[1].toUpperCase(), acc = m[2].replace(/-/g, 'b');
  const alter = [...acc].reduce((a, c) => a + (c === '#' ? 1 : -1), 0);
  return {name: letter + acc, tonic: ((AN_STEP_PC[letter] + alter) % 12 + 12) % 12, letter, alter, mode: m[1] === letter ? 'major' : 'minor'};
}
function anBeatStr(b){ const v = Math.round(b * 1000) / 1000; return String(v); }
function anToRntxt(a, meta){
  const lines = [`Composer: ${meta && meta.composer || ''}`, `Title: ${meta && meta.title || ''}`, `Analyst: ${a.origin === 'auto' ? 'Life Instrument (rule-based, unreviewed)' : 'Life Instrument'}`,
    `Proposed By: ${a.origin}`, ''];
  const byM = new Map();
  (a.chordLabels || []).filter(c => c.status !== 'rejected').forEach(c => (byM.get(c.measure) || byM.set(c.measure, []).get(c.measure)).push(c));
  const keyAt = (m, b) => { let k = null; (a.keySpans || []).forEach(s => { if(s.startMeasure < m || (s.startMeasure === m && (s.startBeat || 1) <= b)) k = s; }); return k; };
  let lastKey = null, lastTs = null;
  [...byM.keys()].sort((x, y) => x - y).forEach(m => {
    const ts = (meta && meta.ts && meta.ts[m]) || null;
    if(ts && ts !== lastTs){ lines.push(`Time Signature: ${ts}`); lastTs = ts; }
    const parts = [`m${m}`];
    byM.get(m).sort((x, y) => x.beat - y.beat).forEach(c => {
      const k = keyAt(m, c.beat);
      parts.push(`b${anBeatStr(c.beat)}`);
      if(k && (!lastKey || k.key.name !== lastKey.name || k.key.mode !== lastKey.mode)){ parts.push(anKeyName(k.key) + ':'); lastKey = k.key; }
      parts.push(c.chosen || c.roman);
    });
    /* "b1" is implied when a bar starts on its first beat */
    lines.push(parts.join(' ').replace(/^m(\d+) b1 /, 'm$1 '));
  });
  return lines.join('\n') + '\n';
}
function anFromRntxt(text){
  const out = {chordLabels: [], keySpans: [], meta: {}};
  let key = null;
  String(text || '').split(/\r?\n/).forEach(line => {
    const l = line.trim(); if(!l) return;
    const hm = /^([A-Za-z ]+):\s*(.*)$/.exec(l);
    if(hm && !/^m\d/.test(l)){ out.meta[hm[1].trim()] = hm[2]; return; }
    const mm = /^m(\d+)(?:var\d+)?\s+(.*)$/.exec(l); if(!mm) return;
    const measure = +mm[1]; if(/^m\d+-\d+\s*=/.test(l)) return;   /* repeats of earlier bars are left to the reader */
    let beat = 1;
    mm[2].split(/\s+/).forEach(tok => {
      if(!tok || tok === '||' || tok === '|') return;
      const bm = /^b(\d+(?:\.\d+)?)$/.exec(tok); if(bm){ beat = +bm[1]; return; }
      const km = /^([A-Ga-g][#b-]*):$/.exec(tok);
      if(km){ key = anKeyParse(km[1]); if(key) out.keySpans.push({id: uid(), startMeasure: measure, startBeat: beat, key, confidence: 1, alternatives: [], status: 'accepted'}); return; }
      const km2 = /^([A-Ga-g][#b-]*):(.+)$/.exec(tok);
      if(km2){ key = anKeyParse(km2[1]); if(key) out.keySpans.push({id: uid(), startMeasure: measure, startBeat: beat, key, confidence: 1, alternatives: [], status: 'accepted'}); tok = km2[2]; }
      out.chordLabels.push({id: uid(), measure, beat, roman: tok, function: anFunctionOfRoman(tok), functionalBass: '', confidence: 1, alt: null, status: 'accepted', key: key ? anKeyName(key) : ''});
    });
  });
  return out;
}
/* T / PD / D from a Roman numeral string, for imported labels */
function anFunctionOfRoman(r){
  const s = String(r || '').replace(/[0-9]/g, '');
  if(/\//.test(s)) return 'D';
  if(/^(Cad|cad)/.test(s)) return 'D';
  if(/^(It|Fr|Ger|N)/.test(s)) return 'PD';
  const base = s.replace(/^[b#]/, '').replace(/[°øo+]/g, '');
  const up = base.toUpperCase();
  if(up === 'V' || up === 'VII') return 'D';
  if(up === 'II' || up === 'IV') return 'PD';
  return 'T';
}
