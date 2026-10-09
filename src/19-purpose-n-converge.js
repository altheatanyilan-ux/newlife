/* ============================================================
   THE CONVERGENCE ENGINE (#/purpose/converge)

   The course's discovery method is convergence: do the exercises, let the
   answers overlap, and treat what repeats as the litmus test. The house holds
   years of introspective writing and had no way to ask what keeps coming up.

   This is a read-only report. It counts recurring phrases across what you have
   written about yourself and lets you open every occurrence. It never writes
   to an entry and never decides anything. It is consulted on a retreat, not
   pushed: no prompt, no duty, no nudge.

   Phrases are ranked by the number of DISTINCT entries they appear in — one
   long entry repeating a phrase nine times does not outrank nine separate
   entries — and the kinds spanned matter most: six kinds over four years is a
   different signal from six mentions in one week's reflections.
   ============================================================ */

purposeTabAdd({id: 'converge', label: 'Convergence', order: 60, render: (body) => convergeRender(body)});

const CONV_MIN_CORPUS = 30;
const CONV_CAND = {entries: 4, kinds: 3, days: 180};
const CONV_INCLUDED = ['reflection', 'question', 'contemplation', 'gratitude', 'synchronicity', 'manifestation', 'visualization', 'letter', 'memory', 'lifeevent'];
const CONV_OPTIONAL = [
  {id: 'divination', types: ['divination', 'intuition'], label: 'Divination and intuition', why: 'their text is largely the deck’s words rather than yours'},
  {id: 'logs', types: ['progress', 'nod'], label: 'Progress and nods', why: 'they are logs of practice, not reflection'},
  {id: 'quotes', types: ['quote'], label: 'Quotes', why: 'the words are someone else’s'},
];
const CONV_STOP = new Set(('a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves ' +
  'really thing things like get got going go one much many even still way make made also something someone').split(/\s+/));

function convRows(){ return (S.convergence = Array.isArray(S.convergence) ? S.convergence : []); }
function convRow(id, init){ let r = convRows().find(x => x.id === id); if(!r){ r = Object.assign({id}, init); convRows().push(r); } return r; }
const convIgnored = () => convRow('ignored', {phrases: []});
const convPrefs = () => { const r = convRow('prefs', {include: {}}); if(!r.include) r.include = {}; return r; };

/* crude stemming, as the specification asks: no linguistics library */
function convStem(w){
  if(w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if(w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if(w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
  if(w.length > 4 && w.endsWith('ly')) return w.slice(0, -2);
  if(w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}
function convTokens(text){
  return String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9À-ɏ぀-ヿ一-鿿\s]/g, ' ').split(/\s+/)
    .filter(w => w && !CONV_STOP.has(w)).map(convStem).filter(w => w.length > 1);
}

/* ---------- the corpus: every field a person wrote about themselves ---------- */
function convergeCorpus(){
  const prefs = convPrefs().include, out = [];
  const types = new Set(CONV_INCLUDED);
  CONV_OPTIONAL.forEach(o => { if(prefs[o.id]) o.types.forEach(t => types.add(t)); });
  (S.entries || []).forEach(e => {
    if(!types.has(e.type)) return;
    if(e.extra && e.extra.sealedUntil && (typeof letterIsSealed === 'function' ? letterIsSealed(e) : e.extra.sealedUntil > today())) return;   // sealed stays invisible here too
    const ans = e.type === 'question' && e.extra && Array.isArray(e.extra.answers) ? e.extra.answers.map(a => a.text).join(' \n ') : '';
    const text = [e.title, e.body, ans].filter(Boolean).join(' \n ');
    if(text.trim()) out.push({key: 'e:' + e.id, entryId: e.id, kind: e.type, at: (e.occurredAt || e.createdAt || '').slice(0, 10), text});
  });
  const add = (key, kind, at, text, go) => { if(text && String(text).trim()) out.push({key, entryId: null, kind, at: (at || '').slice(0, 10), text: String(text), go}); };
  const latest = arr => Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
  (S.values || []).forEach(v => ['embody', 'hundred', 'motivation', 'counterfeit'].forEach(k => { const l = latest(v.fields && v.fields[k]); if(l) add('v:' + v.id + k, 'value', l.date, l.text, '#/values/' + v.id); }));
  (typeof strengthsAll === 'function' ? strengthsAll() : []).forEach(s => { const l = latest(s.gloss); if(l) add('s:' + s.id, 'strength', l.at, l.text, '#/purpose/strengths'); });
  (S.visions || []).forEach(v => { add('f:' + v.id, 'vision', v.updatedAt || v.createdAt, v.futureMemory, '#/purpose/vision/' + v.id); add('fs:' + v.id, 'vision', v.updatedAt || v.createdAt, v.sensory && v.sensory.notes, '#/purpose/vision/' + v.id); });
  const ps = typeof purposeState === 'function' ? purposeState() : null;
  if(ps && typeof PURPOSE_KEYS !== 'undefined') PURPOSE_KEYS.forEach(k => (ps[k] || []).forEach((v, i) => add('p:' + k + i, 'purpose', v.at, v.text, '#/purpose')));
  (S.zoneItems || []).forEach(z => add('z:' + z.id, 'worksheet', z.at || z.createdAt, z.text || z.what, '#/purpose/genius'));
  (S.flowClues || []).forEach(z => add('c:' + z.id, 'flowclue', z.at || z.createdAt, z.text || z.what, '#/purpose/genius'));
  return out;
}

/* ---------- the index ---------- */
let _convCache = null, _convBuilding = false;
async function convergeBuild(onProgress){
  const t0 = performance.now(), corpus = convergeCorpus();
  const map = new Map();    // phrase -> {ids:Set, kinds:Set, first, last, surface:Set}
  for(let i = 0; i < corpus.length; i++){
    const doc = corpus[i], toks = convTokens(doc.text), seen = new Set();
    for(let n = 2; n <= 5; n++) for(let j = 0; j + n <= toks.length; j++){
      const ph = toks.slice(j, j + n).join(' ');
      if(ph.length < 6 || seen.has(ph)) continue; seen.add(ph);
      let r = map.get(ph); if(!r){ r = {ids: new Set(), kinds: new Set(), first: '9999', last: '', n}; map.set(ph, r); }
      r.ids.add(doc.key); r.kinds.add(doc.kind);
      if(doc.at && doc.at < r.first) r.first = doc.at; if(doc.at && doc.at > r.last) r.last = doc.at;
    }
    if(i % 150 === 149){ if(onProgress) onProgress(i / corpus.length); await new Promise(r => setTimeout(r, 0)); }
  }
  /* one appearance is not a recurrence */
  let list = [...map.entries()].filter(([, r]) => r.ids.size >= 2).map(([ph, r]) => ({phrase: ph, variants: [], keys: [...r.ids], kinds: [...r.kinds], firstAt: r.first === '9999' ? '' : r.first, lastAt: r.last, n: r.n}));
  /* a shorter phrase that appears in exactly the same entries as a longer one containing it adds nothing */
  const byPhrase = new Map(list.map(x => [x.phrase, x]));
  list.forEach(x => { const w = x.phrase.split(' ');
    for(let n = 2; n < w.length; n++) for(let j = 0; j + n <= w.length; j++){ const sub = byPhrase.get(w.slice(j, j + n).join(' '));
      if(sub && sub.keys.length === x.keys.length) sub.drop = true; } });
  list = list.filter(x => !x.drop);
  /* near-duplicates merge, using the Learning Studio's matcher; bounded to the busiest few hundred so it stays quick */
  list.sort((a, b) => b.keys.length - a.keys.length);
  const head = list.slice(0, 500), thr = (S.lsPrefs && S.lsPrefs.fuzzyMatchThreshold != null) ? S.lsPrefs.fuzzyMatchThreshold : 0.35;
  const gone = new Set();
  for(let i = 0; i < head.length; i++){
    if(gone.has(i)) continue;
    for(let j = i + 1; j < head.length; j++){
      if(gone.has(j) || head[i].n !== head[j].n || Math.abs(head[i].phrase.length - head[j].phrase.length) > 4) continue;
      if(typeof lsNormLevenshtein === 'function' && lsNormLevenshtein(head[i].phrase, head[j].phrase) < thr){
        const a = head[i], b = head[j];
        a.variants.push(b.phrase);
        a.keys = [...new Set(a.keys.concat(b.keys))]; a.kinds = [...new Set(a.kinds.concat(b.kinds))];
        if(b.firstAt && (!a.firstAt || b.firstAt < a.firstAt)) a.firstAt = b.firstAt; if(b.lastAt > a.lastAt) a.lastAt = b.lastAt;
        gone.add(j);
      }
    }
  }
  list = head.filter((x, i) => !gone.has(i)).concat(list.slice(500));
  const span = x => x.firstAt && x.lastAt ? daysBetween(x.firstAt, x.lastAt) : 0;
  list.forEach(x => { x.span = span(x); });
  list.sort((a, b) => b.keys.length - a.keys.length || b.kinds.length - a.kinds.length || b.span - a.span);
  _convCache = {builtAt: new Date().toISOString(), entryCount: corpus.length, phrases: list, ms: Math.round(performance.now() - t0), docs: new Map(corpus.map(d => [d.key, d]))};
  return _convCache;
}
const convStale = () => !_convCache || Math.abs(convergeCorpus().length - _convCache.entryCount) > Math.max(0, _convCache.entryCount * 0.02);
const convVisible = () => { const ig = new Set(convIgnored().phrases); return (_convCache ? _convCache.phrases : []).filter(x => !ig.has(x.phrase) && !x.variants.some(v => ig.has(v))); };
const convIsCandidate = x => x.keys.length >= CONV_CAND.entries && x.kinds.length >= CONV_CAND.kinds && x.span >= CONV_CAND.days;
function convCandidates(){ return convVisible().filter(convIsCandidate); }

/* ---------- 'the obvious thing': what is already being lived ---------- */
function convObvious(cands){
  const rows = [];
  cands.slice(0, 5).forEach(c => {
    const words = new Set(c.phrase.split(' ').concat(...c.variants.map(v => v.split(' '))));
    const hit = s => convTokens(s).some(t => words.has(t));
    const sk = (S.skills || []).filter(s => hit(s.name));
    const hb = (S.habits || []).filter(h => !h.archived && hit(h.name));
    const cats = (typeof timeAllCategories === 'function' ? timeAllCategories() : []).filter(k => hit(k.name));
    const hours = Math.round(sum(cats.map(k => sum((S.timeEntries || []).filter(e => e.categoryId === k.id && e.endTime).map(e => timeMinutes(e)))) .concat(sk.map(s => (typeof skillHours === 'function' ? skillHours(s) : 0) * 60))) / 6) / 10;
    const lib = (typeof mediaEntries === 'function' ? mediaEntries() : []).filter(e => ['changed', 'lives'].includes(mediaX(e).resonanceLevel) && (hit(e.title) || hit(mediaX(e).oneLineCapture)));
    if(sk.length || hb.length || cats.length || lib.length) rows.push({c, sk, hb, cats, lib, hours});
  });
  return rows;
}

/* ---------- the report ---------- */
function convergeRender(body){
  const corpusN = convergeCorpus().length;
  const optToggles = `<details class="cv-scope"><summary class="mono">what is read</summary>
      <p class="faint">Read by default: reflections, questions and their answers, contemplations, gratitude, synchronicities, manifestations, visualisations, letters, memories and life events, plus value definitions, strengths glosses, vision future memories and the sheet’s own wordings. Anything sealed is never read.</p>
      ${CONV_OPTIONAL.map(o => `<label class="row" style="gap:6px;align-items:center"><input type="checkbox" data-cvopt="${o.id}"${convPrefs().include[o.id] ? ' checked' : ''}> <span>${esc(o.label)} <span class="faint">— left out by default: ${esc(o.why)}</span></span></label>`).join('')}</details>`;
  if(corpusN < CONV_MIN_CORPUS){
    body.innerHTML = `<div class="cv-wrap"><p class="faint cv-lede">This needs a corpus before it can find a pattern. It will count the phrases that recur across what you have written about yourself — rank them by how many separate entries they appear in rather than how often they repeat, and show you the ones that cross several kinds of writing over at least six months. You have <b>${corpusN}</b> qualifying entr${corpusN === 1 ? 'y' : 'ies'}; the report draws at ${CONV_MIN_CORPUS}.</p>${optToggles}</div>`;
    bindConvScope(body); return;
  }
  const draw = () => {
    const c = _convCache, vis = convVisible(), cands = convCandidates(), ig = convIgnored().phrases;
    const top = vis.filter(x => x.keys.length >= 2).slice(0, 40);
    const obv = convObvious(cands);
    body.innerHTML = `<div class="cv-wrap">
      <p class="faint cv-lede">What keeps coming up. The course’s instruction: let the answers overlap, treat repeats as the litmus test, and connect the dots. This is read-only — it writes to nothing.</p>
      <div class="row between mono faint" style="flex-wrap:wrap;gap:6px"><span>${vis.length} phrases across ${c.entryCount} entries, computed in ${c.ms} ms</span>
        <span><button class="btn sm ghost" id="cvRebuild">rebuild</button></span></div>
      ${optToggles}
      <section class="section cv-sec"><span class="sc">Convergence candidates</span>
        <p class="faint mono" style="font-size:.76rem">the rule: at least ${CONV_CAND.entries} distinct entries, ${CONV_CAND.kinds} kinds of writing, and a span of ${CONV_CAND.days} days or more</p>
        ${cands.length ? cands.slice(0, 12).map(x => convRowHTML(x, true)).join('') : '<p class="faint">Nothing meets all three yet. That is a fact about the record so far, not about you.</p>'}</section>
      ${cands.length ? `<section class="section cv-sec"><span class="sc">The obvious thing</span>
        <p class="faint">The course’s most common realisation is that the purpose was already being partly lived. Set against what you actually do:</p>
        ${obv.length ? obv.map(o => `<div class="cv-obv"><b class="serif">${esc(o.c.phrase)}</b><div class="faint">${[
          o.hours > 0 ? `<b>${o.hours} hours</b> are already recorded against it` : '', o.sk.length ? 'skill: ' + o.sk.map(s => esc(s.name)).join(', ') : '', o.hb.length ? 'habit: ' + o.hb.map(h => esc(h.name)).join(', ') : '',
          o.cats.length ? 'clock: ' + o.cats.map(k => esc(k.name)).join(', ') : '', o.lib.length ? 'work that changed or lives in you: ' + o.lib.map(e => esc(e.title)).join(', ') : ''].filter(Boolean).join(' · ')}</div></div>`).join('')
          : '<p class="faint">None of the top candidates matches a skill, habit, clock category or work by name yet.</p>'}</section>` : ''}
      <section class="section cv-sec"><span class="sc">Recurring phrases</span>
        <p class="faint mono" style="font-size:.76rem">ranked by distinct entries, then kinds spanned, then days spanned — never by raw count</p>
        ${top.map(x => convRowHTML(x, false)).join('') || '<p class="faint">No phrase appears in more than one entry.</p>'}</section>
      ${ig.length ? `<details class="cv-ign"><summary class="mono">${ig.length} ignored phrase${ig.length === 1 ? '' : 's'}</summary>${ig.map(p => `<span class="chip click" data-cvun="${esc(p)}" title="stop ignoring">${esc(p)} ×</span>`).join(' ')}</details>` : ''}
    </div>`;
    bindConvScope(body);
    body.querySelector('#cvRebuild').onclick = () => run(true);
    body.querySelectorAll('[data-cvopen]').forEach(b => b.onclick = () => convDrill(b.dataset.cvopen));
    body.querySelectorAll('[data-cvign]').forEach(b => b.onclick = () => { convIgnored().phrases.push(b.dataset.cvign); saveNow(); draw(); });
    body.querySelectorAll('[data-cvun]').forEach(b => b.onclick = () => { const r = convIgnored(); r.phrases = r.phrases.filter(p => p !== b.dataset.cvun); saveNow(); draw(); });
    body.querySelectorAll('[data-cvcand]').forEach(b => b.onclick = () => convWriteCandidate(b.dataset.cvcand));
  };
  const run = async force => {
    if(_convBuilding) return; _convBuilding = true;
    if(force || convStale()){
      body.innerHTML = '<div class="cv-wrap"><p class="faint">Reading ' + corpusN + ' entries…</p></div>';
      await convergeBuild();
    }
    _convBuilding = false; draw();
  };
  run(false);
}
function bindConvScope(body){
  body.querySelectorAll('[data-cvopt]').forEach(c => c.onchange = () => { convPrefs().include[c.dataset.cvopt] = c.checked; saveNow(); _convCache = null; rerender(); });
}
function convRowHTML(x, cand){
  const kinds = x.kinds.length;
  const when = x.firstAt && x.lastAt ? (x.firstAt.slice(0, 7) === x.lastAt.slice(0, 7) ? fmtDate(x.firstAt, 'short') : fmtDate(x.firstAt, 'short') + ' → ' + fmtDate(x.lastAt, 'short')) : '';
  return `<div class="cv-row"><div class="cv-main"><button class="cv-phrase serif" data-cvopen="${esc(x.phrase)}">${esc(x.phrase)}</button>
      <div class="mono faint">${x.keys.length} entries · ${kinds} kind${kinds === 1 ? '' : 's'} (${x.kinds.map(esc).join(', ')}) · ${when} · ${x.span} days${x.variants.length ? ' · also: ' + x.variants.slice(0, 3).map(esc).join(', ') : ''}</div>
      <div class="faint" style="font-size:.78rem">${kinds >= 3 && x.span >= 180 ? 'across several kinds of writing and a long time — a different signal from a phrase in one week’s reflections' : kinds === 1 ? 'all in one kind of writing' : x.span < 30 ? 'all within a few weeks' : ''}</div></div>
    <div class="cv-act">${cand ? `<button class="btn sm" data-cvcand="${esc(x.phrase)}">note on the sheet</button>` : ''}<button class="btn sm ghost" data-cvign="${esc(x.phrase)}" title="a stylistic phrase, not a meaningful one — reversible">ignore</button></div></div>`;
}

/* ---------- drill-down: every entry, drawn as entries are drawn anywhere ---------- */
function convDrill(phrase){
  const x = _convCache && _convCache.phrases.find(p => p.phrase === phrase); if(!x) return;
  const docs = x.keys.map(k => _convCache.docs.get(k)).filter(Boolean).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  const cards = docs.map(d => {
    const e = d.entryId ? byId(S.entries, d.entryId) : null;
    if(e && !(typeof letterIsSealed === 'function' && letterIsSealed(e))) return entryCard(e, {clamp: false});
    return `<article class="entry rv"><div class="meta"><span class="mono">${esc(d.kind)}</span><span class="mono">${esc(d.at ? fmtDate(d.at, 'med') : '')}</span></div><div class="body">${esc(d.text.slice(0, 400))}</div>${d.go ? `<a class="btn sm ghost" href="${d.go}">open</a>` : ''}</article>`;
  }).join('');
  openPanel(`<div class="mono">“${esc(phrase)}” — ${docs.length} entr${docs.length === 1 ? 'y' : 'ies'}, newest first</div>${x.variants.length ? `<div class="mono faint">merged with: ${x.variants.map(esc).join(', ')}</div>` : ''}${cards}`);
  document.querySelectorAll('#panel .rv').forEach(n => n.classList.add('in'));
}

/* ---------- 'note on the sheet': appends a note, attaches nothing ---------- */
function convWriteCandidate(phrase){
  const m = openModal(`<h2>Note it on the sheet</h2>
    <p class="faint">This adds a note under the sheet — “a phrase that keeps coming up” — and changes none of the five wordings.</p>
    <p class="serif" style="font-size:1.15rem">“${esc(phrase)}”</p>
    <div class="field"><label>Beside which one</label><select class="sel" id="cvK">${PURPOSE_KEYS.map(k => `<option value="${k}">${esc(PURPOSE_FIELDS[k].label)}</option>`).join('')}</select></div>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="cvGo">Add the note</button></div>`, 'narrow');
  m.querySelector('#cvGo').onclick = () => {
    const p = purposeState(); p.candidates = Array.isArray(p.candidates) ? p.candidates : [];
    p.candidates.push({id: uid(), phrase, key: m.querySelector('#cvK').value, at: new Date().toISOString()});
    saveNow(); m.remove(); sound('success'); toast('Noted on the sheet.');
  };
}
function ppCandidatesHTML(){
  const p = purposeState(), xs = Array.isArray(p.candidates) ? p.candidates : [];
  if(!xs.length) return '';
  return `<section class="section pp-cands"><span class="sc">Phrases that keep coming up</span><p class="faint" style="font-size:.78rem">Notes from the convergence report. They sit beside the wordings and are not part of them.</p>
    ${xs.map(c => `<div class="row" style="gap:8px;align-items:baseline"><span class="serif">“${esc(c.phrase)}”</span><span class="mono faint">beside ${esc(PURPOSE_FIELDS[c.key] ? PURPOSE_FIELDS[c.key].label.toLowerCase() : c.key)} · ${esc(fmtDate(c.at.slice(0, 10), 'short'))}</span><button class="del-x inline" data-ppcdel="${c.id}" title="remove this note">×</button></div>`).join('')}</section>`;
}

/* the one place the report is offered: a step in the seasonal and annual retreats */
function convergeRetreatOffer(){
  if(convergeCorpus().length < CONV_MIN_CORPUS) return null;
  if(convStale()){ return {note: 'The report has not been read since the record changed; opening it reads it again.', go: '#/purpose/converge'}; }
  const c = convCandidates();
  return {note: c.length ? c.length + ' phrase' + (c.length === 1 ? ' meets' : 's meet') + ' the candidate rule.' : 'No phrase meets the candidate rule yet.', go: '#/purpose/converge', top: c.slice(0, 3).map(x => x.phrase)};
}

/* the phrases the contemplation practice may offer as a place to start: only
   what the report has already found, never a fresh computation at that moment */
function convergeOffer(){ return _convCache ? convCandidates().slice(0, 6).map(x => x.phrase) : []; }
