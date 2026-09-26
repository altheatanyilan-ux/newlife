/* ============================================================
   SONGWRITING STUDIO — THE WORKBENCH, II: WORDS
   The Lyric Sheet & Structure Lab (Pattison's stress, motion and
   stability; Stolpe's power positions; contrast, show/tell, point of view,
   tense, clichés), the Rhyme Workbench, the Metaphor Lab, Colour a Word,
   and the Chord-Scale Map.

   Every check is a rule that can be read here. None of them knows what a
   line means; each says what it measured, and the writer decides.
   ============================================================ */

/* ---------- words: syllables and stress, by rule ---------- */
/* function words are usually unstressed in a line; content words carry
   a stress on one syllable (the first, unless the ending says otherwise) */
const SNG_WEAK = new Set('a an the and but or nor for so yet of to in on at by with from up as is am are was were be been it its i me my you your he him his she her we us our they them their this that these those do does did has have had will would shall should can could may might must not no if then than there here what when where who how all some any each just like into onto over under through about'.split(' '));
const SNG_ABSTRACT = new Set('love hate heart soul pain hope dream dreams fear feel feeling feelings lonely loneliness happy happiness sad sadness joy sorrow forever always never truth beauty freedom peace life death time memory memories desire passion emotion emotions faith trust destiny fate grief regret longing heartache heartbreak loss lost broken mind spirit'.split(' '));
const SNG_CONCRETE_HINT = /(ing|er|ed)$/;
const SNG_CLICHES = ['broken heart', 'tears fall', 'end of time', 'set me free', 'deep inside', 'my heart beats', 'can\'t live without', 'hold me tight', 'fire in my', 'take my breath', 'the rest of my life', 'meant to be', 'heart of gold', 'love of my life', 'walk away', 'reach for the stars', 'light up the', 'you and me', 'dance the night away', 'nothing to lose', 'shine like a star', 'lost without you'];
function sngSyllables(word){
  let w = String(word || '').toLowerCase().replace(/[^a-z']/g, '');
  if(!w) return 0; if(w.length <= 3) return 1;
  w = w.replace(/'/g, '').replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g); return Math.max(1, m ? m.length : 1);
}
/* a line as syllables, each {text, stress (1 strong, 0 weak), word}; marks the
   writer has made (a stress map keyed by line text) win */
function sngScan(line, marks){
  const words = String(line || '').split(/\s+/).filter(Boolean), out = [];
  words.forEach((w, wi) => {
    const n = sngSyllables(w), bare = w.toLowerCase().replace(/[^a-z']/g, '');
    const weak = SNG_WEAK.has(bare);
    const stressAt = /(tion|sion|ity|ic|ical)$/.test(bare) && n > 1 ? n - 2 : /^(a|be|de|re|un|in|ex|for|to)[a-z]{3,}/.test(bare) && n === 2 ? 1 : 0;
    for(let s = 0; s < n; s++) out.push({word: wi, text: n === 1 ? w : `${w}·${s + 1}`, stress: weak ? 0 : s === stressAt ? 1 : 0});
  });
  if(marks && marks.length === out.length) marks.forEach((m, i) => { out[i].stress = m; });
  return out;
}
const sngLastWord = l => (String(l || '').toLowerCase().match(/[a-z']+(?=[^a-z']*$)/) || [''])[0];

/* ---------- rhyme, by the way words are spelled ----------
   English spelling is a poor map of sound, so every match here is a
   candidate to say out loud. A word's tail is its last vowel group and
   the consonants after it. */
const SNG_FAMILY = [['b', 'd', 'g'], ['p', 't', 'k', 'ck', 'c'], ['v', 'th', 'z', 's', 'j'], ['f', 'sh', 'ch', 'ss'], ['m', 'n', 'ng']];
function sngTail(word){
  /* a silent final e goes; a y after a consonant is the vowel it sounds (rhyme, fly) */
  const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '').replace(/([^aeiou])e$/, '$1').replace(/([^aeiouy])y/g, '$1i');
  const m = w.match(/([aeiouy]+)([^aeiouy]*)$/);
  return m ? {vowel: m[1], coda: m[2], w} : {vowel: '', coda: w, w};
}
const sngFam = c => { const i = SNG_FAMILY.findIndex(f => f.includes(c)); return i; };
/* which of the five rhyme types b is to a (Pattison, WBL ch3–5) */
function sngRhymeType(a, b){
  if(!a || !b) return null;
  const A = sngTail(a), B = sngTail(b);
  if(A.w === B.w) return null;
  if(A.vowel === B.vowel && A.coda === B.coda) return 'perfect';
  if(A.vowel === B.vowel){
    if(A.coda && B.coda && sngFam(A.coda) >= 0 && sngFam(A.coda) === sngFam(B.coda)) return 'family';
    if(A.coda.startsWith(B.coda) || B.coda.startsWith(A.coda)) return 'additive';
    return 'assonance';
  }
  if(A.coda && A.coda === B.coda) return 'consonance';
  return null;
}
const SNG_RHYME_TYPES = [['perfect', 'Perfect', 'same vowel, same consonants after it'], ['family', 'Family', 'same vowel, consonants from the same family'],
  ['additive', 'Additive / subtractive', 'same vowel, one consonant more or fewer'], ['assonance', 'Assonance', 'same vowel, different consonants'], ['consonance', 'Consonance', 'different vowels, same consonants']];
/* every word the writer has ever written here: the Rhyme Workbench's pool */
function sngWordPool(){
  const st = sngState(), bag = new Set();
  const add = t => String(t || '').toLowerCase().split(/[^a-z']+/).forEach(w => { if(w.length > 1 && w.length < 16) bag.add(w.replace(/'/g, '')); });
  st.seeds.forEach(s => add(s.content)); Object.values(st.outputs).forEach(o => Object.values(o.text || {}).forEach(add));
  st.songs.forEach(s => s.sections.forEach(sec => sec.lines.forEach(l => add(l.text || l))));
  (st.lab.worksheet || '').split(/[\s,]+/).forEach(add);
  SNG_BASE_WORDS.split(' ').forEach(add);
  return [...bag];
}
/* a modest stock of song-friendly words, so the pool is never empty */
const SNG_BASE_WORDS = 'light night bright sight white fight flight kite bite write rain train chain plain pain lane main vein sky high fly cry dry lie tie why eye by blue true through you new view two do shoe move prove love glove above of shove dove heart start part art apart dark spark mark park bark stone bone phone home alone own known grown shown road load gold cold told hold old fold sold rolled door floor more shore war core four before sea free tree me we see three key knee day way stay play grey say pray away hand sand land band stand planned fire wire tire higher desire liar tired water daughter over clover ocean motion emotion window shadow meadow morning warning evening leaving ribbon river silver shiver fever never ever clever forever weather feather together leather mirror nearer summer winter wander thunder under wonder window pillow yellow hollow follow swallow tomorrow sorrow borrow street feet sweet heat beat meet seat time line mine shine wine sign fine kind mind find blind wind rise eyes skies lies ties wise size town down crown brown gown sound ground found round wound bound sun run done one gun fun young tongue song long strong wrong along gone on dawn lawn born torn worn thorn storm warm form arm harm charm'.trim();

/* ---------- the Lyric Sheet & Structure Lab ---------- */
const SNG_SECTION_TYPES = ['verse', 'prechorus', 'chorus', 'bridge', 'intro', 'outro'];
/* stability, as Pattison's motion: four measurable elements. Each says
   stable or unstable and why; the meter is their balance. */
function sngStability(sec){
  const lines = sec.lines.map(l => (l.text != null ? l.text : l)).filter(t => String(t).trim());
  const n = lines.length; if(!n) return {score: 0, parts: []};
  const syl = lines.map(t => sngScan(t).length), parts = [];
  parts.push({k: 'number of lines', stable: n % 2 === 0, why: `${n} line${n === 1 ? '' : 's'} — ${n % 2 === 0 ? 'even: it closes' : 'odd: it leaves you leaning'}`});
  const pairsMatch = syl.every((s, i) => i % 2 === 1 ? Math.abs(s - syl[i - 1]) <= 1 : true);
  parts.push({k: 'line lengths', stable: pairsMatch, why: `syllables ${syl.join(' / ')} — ${pairsMatch ? 'matched in pairs' : 'unmatched: the ear waits'}`});
  const ends = lines.map(sngLastWord), rhymeLast = n > 1 && ends.slice(0, -1).some(e => sngRhymeType(e, ends[n - 1]));
  parts.push({k: 'rhyme at the end', stable: !!rhymeLast, why: rhymeLast ? 'the last line rhymes with an earlier one: resolved' : 'the last line does not rhyme back: open'});
  const types = []; for(let i = 1; i < n; i++) for(let j = 0; j < i; j++){ const t = sngRhymeType(ends[j], ends[i]); if(t) types.push(t); }
  const perfect = types.filter(t => t === 'perfect').length, other = types.length - perfect;
  parts.push({k: 'rhyme type', stable: perfect >= other && types.length > 0, why: types.length ? `${perfect} perfect, ${other} imperfect — ${perfect >= other ? 'firm' : 'softer, less settled'}` : 'no rhymes: loose'});
  const score = parts.filter(p => p.stable).length / parts.length;
  return {score, parts};
}
/* the five elements Pattison compares between sections */
function sngSectionShape(sec){
  const lines = sec.lines.map(l => (l.text != null ? l.text : l)).filter(t => String(t).trim());
  const syl = lines.map(t => sngScan(t).length), scans = lines.map(t => sngScan(t));
  const ends = lines.map(sngLastWord), scheme = []; const letters = [];
  ends.forEach((e, i) => { let L = null; for(let j = 0; j < i; j++) if(sngRhymeType(ends[j], e) === 'perfect' || sngRhymeType(ends[j], e)){ L = scheme[j]; break; }
    if(!L){ L = String.fromCharCode(97 + letters.length); letters.push(L); } scheme.push(L); });
  const stressRate = scans.length ? scans.flat().filter(s => s.stress).length / Math.max(1, scans.flat().length) : 0;
  return {lines: lines.length, len: syl.length ? Math.round(syl.reduce((a, b) => a + b, 0) / syl.length) : 0, rhythm: Math.round(stressRate * 100), scheme: scheme.join(''), types: sngStability(sec).parts[3] ? sngStability(sec).parts[3].stable ? 'perfect' : 'imperfect' : ''};
}
function sngContrast(a, b){
  const A = sngSectionShape(a), B = sngSectionShape(b), diff = [];
  if(A.lines !== B.lines) diff.push('number of lines');
  if(Math.abs(A.len - B.len) >= 2) diff.push('line length');
  if(Math.abs(A.rhythm - B.rhythm) >= 10) diff.push('rhythm (stress density)');
  if(A.scheme !== B.scheme) diff.push('rhyme scheme');
  if(A.types !== B.types) diff.push('rhyme type');
  return {diff, A, B};
}
function sngPovTense(text){
  const w = String(text || '').toLowerCase().match(/[a-z']+/g) || [];
  const c = k => w.filter(x => k.includes(x)).length;
  const pov = {first: c(['i', 'me', 'my', 'mine', "i'm", "i've", "i'll", "i'd", 'we', 'us', 'our']), second: c(['you', 'your', 'yours', "you're", "you've", "you'll"]), third: c(['he', 'she', 'him', 'her', 'his', 'they', 'them', 'their'])};
  const past = w.filter(x => /[a-z]{3,}ed$/.test(x) || ['was', 'were', 'had', 'did', 'went', 'said', 'came', 'took', 'saw', 'knew', 'felt', 'left', 'gave', 'made', 'told', 'thought', 'found'].includes(x)).length;
  const present = w.filter(x => ['is', 'am', 'are', 'do', 'does', 'has', 'have', 'go', 'goes', 'say', 'says', 'know', 'knows', 'feel', 'feels', "i'm", "you're", "it's"].includes(x)).length;
  return {pov, tense: past > present ? 'past' : present > past ? 'present' : past ? 'mixed' : '—', past, present};
}
function sngShowTell(text){
  const w = String(text || '').toLowerCase().match(/[a-z']+/g) || [];
  const abs = w.filter(x => SNG_ABSTRACT.has(x));
  return {abstract: abs, concreteish: w.filter(x => !SNG_WEAK.has(x) && !SNG_ABSTRACT.has(x) && x.length > 3).length};
}
function sngClicheFlags(lines){
  const out = [], text = lines.join(' ').toLowerCase();
  SNG_CLICHES.forEach(c => { if(text.includes(c)) out.push(`"${c}"`); });
  const ends = lines.map(sngLastWord);
  for(let i = 1; i < ends.length; i++) for(let j = 0; j < i; j++) SNG_CLICHE_PAIRS.forEach(([a, b]) => { if((ends[i] === a && ends[j] === b) || (ends[i] === b && ends[j] === a)) out.push(`${a} / ${b}`); });
  return [...new Set(out)];
}
/* the sheet: a song's sections, or a scratch sheet of its own */
function sngSheet(){
  const st = sngState(), u = sngUi();
  const song = u.sheetSong ? st.songs.find(s => s.id === u.sheetSong) : null;
  if(song){ if(!song.sections.length) song.sections.push({id: uid(), type: 'verse', feel: 'unstable', lines: [{text: ''}, {text: ''}, {text: ''}, {text: ''}]}); return {song, sections: song.sections}; }
  st.lab.sheet = st.lab.sheet || [{id: uid(), type: 'verse', feel: 'unstable', lines: [{text: ''}, {text: ''}, {text: ''}, {text: ''}]}, {id: uid(), type: 'chorus', feel: 'stable', lines: [{text: ''}, {text: ''}, {text: ''}, {text: ''}]}];
  return {song: null, sections: st.lab.sheet};
}
SNG_TOOL_VIEWS['lyric-sheet'] = {
  html(){
    const st = sngState(), u = sngUi(), {song, sections} = sngSheet();
    const allLines = sections.flatMap(s => s.lines.map(l => l.text || ''));
    const pt = sngPovTense(allLines.join(' '));
    return `<div class="sng-row"><span class="mono faint">sheet</span><select class="inp" id="lsSong"><option value="">scratch sheet</option>${st.songs.map(s => `<option value="${s.id}" ${u.sheetSong === s.id ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select>
      <span class="grow"></span><span class="muted">Press a syllable to mark it strong or weak; the rest is measured as you type.</span></div>
    ${sections.map((sec, si) => { const stab = sngStability(sec); const prevSec = sections[si - 1]; const con = prevSec ? sngContrast(prevSec, sec) : null;
      const lines = sec.lines.map(l => l.text || ''); const cl = sngClicheFlags(lines.filter(Boolean)); const shown = sngShowTell(lines.join(' '));
      const nextIsChorus = sections[si + 1] && sections[si + 1].type === 'chorus' && sec.type !== 'chorus';
      return `<section class="card sng-sec" data-lssec="${si}">
        <div class="sng-card-h"><select class="inp" data-lstype="${si}">${SNG_SECTION_TYPES.map(t => `<option ${sec.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <span class="mono faint">meant to feel</span>${['stable', 'unstable'].map(f => `<button class="tbtn${sec.feel === f ? ' on' : ''}" data-lsfeel="${si}:${f}">${f}</button>`).join('')}
          <span class="grow"></span><button class="del-x inline" data-lsdel="${si}" aria-label="remove the section">×</button></div>
        <div class="sng-lines">${sec.lines.map((l, li) => { const sc = sngScan(l.text, l.stress); const power = li === 0 || li === sec.lines.length - 1;
          return `<div class="sng-line${power ? ' power' : ''}${nextIsChorus && li === sec.lines.length - 1 ? ' trigger' : ''}">
            <input class="inp serif" data-lsline="${si}:${li}" value="${esc(l.text || '')}" placeholder="${li === 0 ? 'first line — a power position' : ''}">
            <span class="sng-syl">${sc.map((s, k) => `<button class="${s.stress ? 'on' : ''}" data-lsstress="${si}:${li}:${k}" title="${esc(s.text)}">${s.stress ? '/' : '˘'}</button>`).join('')}</span>
            <span class="mono faint">${sc.length}</span></div>`; }).join('')}</div>
        <div class="sng-row"><button class="tbtn" data-lsadd="${si}">＋ line</button><span class="grow"></span>
          <span class="sng-meter" title="${esc(stab.parts.map(p => `${p.k}: ${p.why}`).join('\n'))}"><i style="width:${Math.round(stab.score * 100)}%"></i></span>
          <span class="mono">${stab.score >= 0.6 ? 'stable' : stab.score <= 0.4 ? 'unstable' : 'in between'}${sec.feel && ((stab.score >= 0.6) !== (sec.feel === 'stable')) && lines.some(Boolean) ? ' — not what you meant' : ''}</span></div>
        <details class="sng-why"><summary class="mono faint">why — motion, power positions, contrast, show / tell, clichés</summary>
          <ul>${stab.parts.map(p => `<li><b>${p.stable ? 'stable' : 'unstable'}</b> — ${esc(p.k)}: ${esc(p.why)}</li>`).join('')}</ul>
          <p><b>Power positions</b>: the first line (“${esc(lines[0] || '…')}”) and the last (“${esc(lines[lines.length - 1] || '…')}”) — put the strongest content there.</p>
          ${nextIsChorus ? `<p><b>Trigger line</b>: “${esc(lines[lines.length - 1] || '…')}” is the line before the chorus. Does it release into it?</p>` : ''}
          ${con ? `<p><b>Contrast with the ${esc(prevSec.type)}</b>: ${con.diff.length ? `${con.diff.length} of 5 elements differ (${esc(con.diff.join(', '))})` : 'no element differs'} — ${con.diff.length >= 3 ? 'a clear change' : 'aim for three or more'}.</p>` : ''}
          <p><b>Show / tell</b>: ${shown.abstract.length ? `abstract words — ${esc(shown.abstract.join(', '))}. Is there a concrete image before them?` : 'no abstract words: it shows.'}</p>
          ${cl.length ? `<p><b>Worn smooth</b>: ${esc(cl.join('; '))} — keep only if you chose it.</p>` : ''}
        </details></section>`; }).join('')}
    <div class="sng-row"><button class="tbtn" id="lsAddSec">＋ section</button><span class="grow"></span>
      <span class="mono faint">point of view: ${pt.pov.first ? `1st (${pt.pov.first}) ` : ''}${pt.pov.second ? `2nd (${pt.pov.second}) ` : ''}${pt.pov.third ? `3rd (${pt.pov.third})` : ''} · tense: ${esc(pt.tense)}${[pt.pov.first, pt.pov.second, pt.pov.third].filter(Boolean).length > 1 ? ' · more than one point of view — one shift, on purpose, at most' : ''}</span></div>
    <div class="card sng-ref"><b class="mono faint">rhyme types</b>${SNG_RHYME_TYPES.map(([k, n, d]) => `<span><b>${n}</b>: ${d}</span>`).join('')}</div>`;
  },
  bind(host){
    const u = sngUi(), {sections} = sngSheet(), st = sngState();
    const redraw = () => { saveNow(); rerender(); };
    const q = s => host.querySelector(s);
    q('#lsSong').onchange = e => { u.sheetSong = e.target.value || null; rerender(); };
    $$('[data-lstype]', host).forEach(s => s.onchange = () => { sections[+s.dataset.lstype].type = s.value; redraw(); });
    $$('[data-lsfeel]', host).forEach(b => b.onclick = () => { const [i, f] = b.dataset.lsfeel.split(':'); sections[+i].feel = f; redraw(); });
    $$('[data-lsdel]', host).forEach(b => b.onclick = () => { sections.splice(+b.dataset.lsdel, 1); redraw(); });
    $$('[data-lsadd]', host).forEach(b => b.onclick = () => { sections[+b.dataset.lsadd].lines.push({text: ''}); redraw(); });
    q('#lsAddSec').onclick = () => { sections.push({id: uid(), type: 'verse', feel: 'unstable', lines: [{text: ''}, {text: ''}]}); redraw(); };
    $$('[data-lsline]', host).forEach(inp => inp.onchange = () => { const [i, j] = inp.dataset.lsline.split(':').map(Number); const l = sections[i].lines[j];
      l.text = inp.value; delete l.stress; const s = sngSheet().song; if(s) s.updatedAt = new Date().toISOString(); redraw(); });
    $$('[data-lsstress]', host).forEach(b => b.onclick = () => { const [i, j, k] = b.dataset.lsstress.split(':').map(Number); const l = sections[i].lines[j];
      const sc = sngScan(l.text, l.stress); l.stress = sc.map(x => x.stress); l.stress[k] = l.stress[k] ? 0 : 1; redraw(); });
    void st;
  }
};

/* ---------- the Rhyme Workbench ---------- */
SNG_TOOL_VIEWS['rhyme-bench'] = {
  html(){
    const st = sngState(), u = sngUi(), w = (u.rhymeWord || '').toLowerCase().trim();
    const pool = w ? sngWordPool() : [];
    const found = {}; SNG_RHYME_TYPES.forEach(([k]) => found[k] = []);
    pool.forEach(x => { const t = sngRhymeType(w, x); if(t) found[t].push(x); });
    Object.values(found).forEach(l => l.sort());
    return `<div class="card"><div class="sng-row"><label class="mono faint">focus word <input class="inp serif" id="rbWord" value="${esc(u.rhymeWord || '')}" placeholder="e.g. home"></label>
      <span class="muted">matched by spelling against every word you have written here, and a small stock — say each one aloud</span></div></div>
    ${w ? `<div class="sng-rhymes">${SNG_RHYME_TYPES.map(([k, n, d]) => `<div class="card"><div class="sng-card-h"><b>${n}</b><span class="mono faint">${esc(d)}</span></div>
      <div class="sng-wordlist">${found[k].slice(0, 60).map(x => `<button class="chip" data-rbpick="${esc(x)}">${esc(x)}</button>`).join('') || '<span class="muted">none in the pool</span>'}</div>
      <input class="inp" data-rbown="${k}" value="${esc(((st.lab.rhymeOwn || {})[w] || {})[k] || '')}" placeholder="your own ${n.toLowerCase()} rhymes for “${esc(w)}”…"></div>`).join('')}</div>` : ''}
    <div class="card"><div class="sng-card-h"><b>Worksheet</b><span class="mono faint">Pattison, WBL ch5</span></div>
      <p class="muted">List the words of your idea — its images, its places, its verbs. They join the pool, so the workbench finds rhymes among your own words first.</p>
      <textarea class="inp sng-ta" rows="3" id="rbSheet">${esc(st.lab.worksheet || '')}</textarea></div>
    <div class="card sng-ref"><b class="mono faint">consonant families</b>${Object.entries(SNG_CONSONANT_FAMILIES).map(([k, v]) => `<span><b>${esc(k)}</b>: ${esc(v.join(', '))}</span>`).join('')}</div>`;
  },
  bind(host){
    const st = sngState(), u = sngUi();
    const w = host.querySelector('#rbWord'); w.onchange = () => { u.rhymeWord = w.value; rerender(); };
    $$('[data-rbpick]', host).forEach(b => b.onclick = () => { sngSeed({type: 'rhyme', content: `${u.rhymeWord} / ${b.dataset.rbpick}`, source: 'Rhyme Workbench', tags: [sngRhymeType(u.rhymeWord, b.dataset.rbpick)]}); sound('click'); toast('Rhyme pair in the Seedbank.'); });
    $$('[data-rbown]', host).forEach(i => i.onchange = () => { const k = (u.rhymeWord || '').toLowerCase(); st.lab.rhymeOwn = st.lab.rhymeOwn || {}; st.lab.rhymeOwn[k] = st.lab.rhymeOwn[k] || {}; st.lab.rhymeOwn[k][i.dataset.rbown] = i.value; saveNow(); });
    host.querySelector('#rbSheet').onchange = e => { st.lab.worksheet = e.target.value; saveNow(); rerender(); };
  }
};

/* ---------- the Metaphor Lab (Pattison, SWB Challenge 2–3) ---------- */
const SNG_ADJ = ['rusty', 'velvet', 'electric', 'hollow', 'liquid', 'frozen', 'crooked', 'golden', 'bitter', 'tangled', 'paper', 'borrowed', 'salted', 'humming', 'sleepless', 'splintered', 'amber', 'restless', 'quiet', 'burning'];
const SNG_NOUN = ['cathedral', 'whisper', 'anchor', 'meadow', 'clockwork', 'avalanche', 'lantern', 'shadow', 'harbor', 'ember', 'staircase', 'suitcase', 'orchard', 'radio', 'lighthouse', 'windowsill', 'river', 'stitch', 'compass', 'bruise'];
SNG_TOOL_VIEWS['metaphor-lab'] = {
  html(){
    const st = sngState(), u = sngUi(), m = st.lab.metaphor = st.lab.metaphor || {};
    u.mlTab = u.mlTab || 'collide';
    const tabs = [['collide', 'Collisions'], ['identity', 'Identity'], ['keys', 'Keys'], ['link', 'Linking']];
    const pane = {
      collide: `<p class="muted">Collide an adjective with a noun that does not belong to it, then write a sentence that makes sense of the collision (ninety seconds, object-writing style).</p>
        <div class="sng-row"><input class="inp" id="mlAdj" value="${esc(m.adj || '')}" placeholder="adjective…"><input class="inp" id="mlNoun" value="${esc(m.noun || '')}" placeholder="noun…"><button class="tbtn" id="mlDice">collide at random</button></div>
        ${m.adj && m.noun ? `<p class="serif sng-big">${esc(m.adj)} ${esc(m.noun)}</p>` : ''}
        <textarea class="inp sng-ta" rows="3" id="mlSense" placeholder="a sentence that makes sense of it…">${esc(m.sense || '')}</textarea>`,
      identity: `<p class="muted">Three forms of expressed identity, each with a different weight: “X is Y”, “the Y of X”, and “X’s Y”.</p>
        <div class="sng-row"><input class="inp" id="mlX" value="${esc(m.x || '')}" placeholder="X (e.g. love)"><input class="inp" id="mlY" value="${esc(m.y || '')}" placeholder="Y (e.g. a lighthouse)"></div>
        ${m.x && m.y ? `<ul class="serif"><li>${esc(m.x)} is ${esc(m.y)}</li><li>the ${esc(m.y.replace(/^(a|an|the)\s+/i, ''))} of ${esc(m.x)}</li><li>${esc(m.x)}’s ${esc(m.y.replace(/^(a|an|the)\s+/i, ''))}</li></ul>` : ''}`,
      keys: `<p class="muted">A tone word, and the words that live in its key; then collide one of them with a word from outside the key.</p>
        <input class="inp" id="mlTone" value="${esc(m.tone || '')}" placeholder="tone word (e.g. ocean)"><textarea class="inp sng-ta" rows="2" id="mlDia" placeholder="words in its key: wave, salt, tide, deep…">${esc(m.dia || '')}</textarea>
        <input class="inp" id="mlOut" value="${esc(m.out || '')}" placeholder="a word from outside the key…">
        ${m.dia && m.out ? `<p class="serif">${(m.dia.split(/[,\s]+/).filter(Boolean).slice(0, 6)).map(d => `${esc(d)} ${esc(m.out)}`).join(' · ')}</p>` : ''}`,
      link: `<p class="muted">What quality does the idea have? What else has that quality? The link is the metaphor.</p>
        <input class="inp" id="mlIdea" value="${esc(m.idea || '')}" placeholder="the abstract idea (e.g. heartbreak)">
        <input class="inp" id="mlQual" value="${esc(m.qual || '')}" placeholder="its qualities (sharp, sudden, cold…)">
        <input class="inp" id="mlElse" value="${esc(m.els || '')}" placeholder="what else has them (ice, glass, winter…)">`};
    return `<div class="sng-row">${tabs.map(([k, n]) => `<button class="tbtn${u.mlTab === k ? ' on' : ''}" data-mltab="${k}">${n}</button>`).join('')}</div>
      <div class="card">${pane[u.mlTab]}<div class="sng-row"><button class="btn sm" id="mlSeed">Keep it in the Seedbank</button></div></div>`;
  },
  bind(host){
    const st = sngState(), u = sngUi(), m = st.lab.metaphor;
    $$('[data-mltab]', host).forEach(b => b.onclick = () => { u.mlTab = b.dataset.mltab; rerender(); });
    const bindIn = (sel, k, re) => { const n = host.querySelector(sel); if(n) n.onchange = () => { m[k] = n.value; saveNow(); if(re) rerender(); }; };
    bindIn('#mlAdj', 'adj', 1); bindIn('#mlNoun', 'noun', 1); bindIn('#mlSense', 'sense'); bindIn('#mlX', 'x', 1); bindIn('#mlY', 'y', 1);
    bindIn('#mlTone', 'tone'); bindIn('#mlDia', 'dia', 1); bindIn('#mlOut', 'out', 1); bindIn('#mlIdea', 'idea'); bindIn('#mlQual', 'qual'); bindIn('#mlElse', 'els');
    const dice = host.querySelector('#mlDice'); if(dice) dice.onclick = () => { m.adj = SNG_ADJ[Math.floor(Math.random() * SNG_ADJ.length)]; m.noun = SNG_NOUN[Math.floor(Math.random() * SNG_NOUN.length)]; m.sense = ''; saveNow(); rerender(); };
    host.querySelector('#mlSeed').onclick = () => {
      const c = u.mlTab === 'collide' ? `${m.adj || ''} ${m.noun || ''} — ${m.sense || ''}` : u.mlTab === 'identity' ? `${m.x || ''} is ${m.y || ''}` : u.mlTab === 'keys' ? `${m.tone || ''}: ${m.dia || ''} × ${m.out || ''}` : `${m.idea || ''} — ${m.qual || ''} — ${m.els || ''}`;
      if(sngSeed({type: 'metaphor', content: c, source: 'Metaphor Lab', tags: [u.mlTab]})){ sound('success'); toast('In the Seedbank.'); } };
  }
};

/* ---------- Colour a Word (Kachulis, Harmony) ----------
   One melody note, sung on one word; every chord that holds that note,
   heard under it. The same word means something else over each. With the
   Chord-Scale Map, the tensions that note can be as well. */
SNG_TOOL_VIEWS['color-word'] = {
  html(){
    const u = sngUi(), L = sngLabState();
    const deg = u.cwDeg != null ? u.cwDeg : 0, word = u.cwWord || '';
    const all = sngPalette(L.colour).concat(sngOutsidePalette());
    const holds = all.filter(c => (SNG_QUALITY[c.quality] || []).map(x => sngPc(c.root + x)).includes(deg));
    const tens = sngPalette(L.colour).map(c => { const sc = sngScalesFor(c, {keyPc: L.keyPc, colour: L.colour}).scales[0]; const d = sngPc(deg - c.root);
      return sc.tensions.map(sngPc).includes(d) && !(SNG_QUALITY[c.quality] || []).map(sngPc).includes(d) ? {c, as: {1: '♭9', 2: '9', 3: '♯9', 5: '11', 6: '♯11', 8: '♭13', 9: '13'}[d] || ''} : null; }).filter(Boolean);
    return `<div class="card"><div class="sng-row"><label class="mono faint">the melody note</label>${SNG_KEY_COLOURS[L.colour].scale.map(s => `<button class="tbtn${deg === s ? ' on' : ''}" data-cwdeg="${s}">${esc(sngNoteName(L.keyPc + s))}</button>`).join('')}
      <input class="inp serif" id="cwWord" value="${esc(word)}" placeholder="the word it carries…"></div>
      <p class="muted">In ${esc(sngNoteName(L.keyPc))} ${esc(SNG_KEY_COLOURS[L.colour].name)} (the Chord Lab's key). Press a chord to hear the note over it.</p></div>
    <div class="sng-palette">${holds.map(c => { const q = SNG_QUALITY[c.quality] || [], role = ['root', '', '', '3rd', '3rd', '', '5th', '5th', '5th', '6th', '7th', '7th'][sngPc(deg - c.root)] || '';
      return `<button class="sng-chip" data-cwplay="${esc(c.roman)}"><b>${esc(c.roman)}</b><span>${esc(sngChordName(c, L.keyPc))}${role ? ` · the ${role}` : ''}</span></button>`; }).join('')}</div>
    ${tens.length ? `<div class="card"><b class="mono faint">as a tension (Chord-Scale Map)</b><div class="sng-palette">${tens.map(t => `<button class="sng-chip outside" data-cwplay="${esc(t.c.roman)}" data-cwtens="1"><b>${esc(t.c.roman)}</b><span>${esc(sngChordName(t.c, L.keyPc))} · the ${esc(t.as)}</span></button>`).join('')}</div></div>` : ''}
    ${word ? `<p class="serif sng-big">“${esc(word)}”</p>` : ''}
    <textarea class="inp sng-ta" rows="2" id="cwNotes" placeholder="how the word changes over each…">${esc((sngState().lab.cwNotes || ''))}</textarea>`;
  },
  bind(host){
    const u = sngUi(), L = sngLabState(), st = sngState();
    $$('[data-cwdeg]', host).forEach(b => b.onclick = () => { u.cwDeg = +b.dataset.cwdeg; rerender(); });
    host.querySelector('#cwWord').onchange = e => { u.cwWord = e.target.value; rerender(); };
    $$('[data-cwplay]', host).forEach(b => b.onclick = () => { const c = sngParseRoman(b.dataset.cwplay); if(!c) return;
      const top = 72 + sngPc(L.keyPc + (u.cwDeg || 0)); const v = sngVoice(c, L.keyPc, b.dataset.cwtens ? 'tension' : 'triad', null, b.dataset.cwtens ? sngScalesFor(c, {keyPc: L.keyPc, colour: L.colour}).scales[0] : null).map(m => m >= top ? m - 12 : m);
      sngPlayChord(v.concat([sngBassNote(c, L.keyPc), top]), 'piano', 1.6); });
    host.querySelector('#cwNotes').onchange = e => { st.lab.cwNotes = e.target.value; saveNow(); };
  }
};

/* ---------- the Chord-Scale Map ---------- */
const SNG_CSM_PRESETS = [['ii–V–I', ['ii7', 'V7', 'Imaj7', 'Imaj7'], 'major'], ['minor ii–V–i', ['iiø7', 'V7', 'i', 'i'], 'minor'], ['12-bar blues', ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'], 'blues'],
  ['I–vi–ii–V', ['Imaj7', 'vi7', 'ii7', 'V7'], 'major'], ['Dorian vamp', ['i7', 'IV7'], 'dorian']];
const SNG_OUTSIDE_LEVELS = ['chord tones', 'the scale', 'with tensions', 'altered', 'chromatic'];
let _sngCsm = null;
function sngCsmState(){ const st = sngState(); const c = st.lab.csm = st.lab.csm || {}; if(!Array.isArray(c.prog)) c.prog = SNG_CSM_PRESETS[0][1].slice(); c.colour = c.colour || 'major'; if(c.keyPc == null) c.keyPc = 0; c.pick = c.pick || {}; if(c.out == null) c.out = 1; return c; }
function sngCsmRows(c){
  const chords = c.prog.map(r => sngParseRoman(r) || {roman: r, root: 0, quality: 'maj'});
  return chords.map((ch, i) => { const r = sngScalesFor(ch, {keyPc: c.keyPc, colour: c.colour, next: chords[(i + 1) % chords.length], blues: c.colour === 'blues'});
    const sc = r.scales.find(s => s.id === c.pick[i]) || r.scales[0]; return {ch, r, sc}; });
}
/* the pitch set a phrase may use at an inside/outside level */
function sngCsmSet(row, level){
  const q = (SNG_QUALITY[row.ch.quality] || SNG_QUALITY.maj).map(sngPc);
  if(level <= 0) return q;
  if(level === 1) return row.sc.deg.filter(d => !row.sc.avoid.includes(d));
  if(level === 2) return [...new Set(row.sc.deg.concat(row.sc.tensions.map(sngPc)))];
  if(level === 3) return [...new Set(row.sc.deg.concat(SNG_SCALES.altered.deg))];
  return [...Array(12).keys()];
}
SNG_TOOL_VIEWS['chord-scale'] = {
  html(){
    const c = sngCsmState(), u = sngUi(), rows = sngCsmRows(c), cur = rows[u.csmAt || 0] || rows[0];
    const roles = {}; if(cur) sngScaleRoles(cur.ch, cur.sc).forEach(x => { roles[sngPc(c.keyPc + cur.ch.root + x.deg)] = x.role; });
    const lit = cur ? cur.sc.deg.map(d => 60 + sngPc(c.keyPc + cur.ch.root + d)) : [];
    const gt = sngGuideTones(rows.map(r => r.ch), c.keyPc);
    return `<p class="muted sng-note">Standard jazz chord-scale thinking, as a writing tool: which notes each chord allows, chosen by its quality and by what it does in the progression. Alternates run from inside to outside.</p>
    <div class="card"><div class="sng-row"><label class="mono faint">key <select class="inp" id="csmKey">${SNG_NOTE_NAMES.map((n, i) => `<option value="${i}" ${c.keyPc === i ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${SNG_CSM_PRESETS.map(([n], i) => `<button class="tbtn" data-csmpre="${i}">${esc(n)}</button>`).join('')}<button class="tbtn" id="csmFromLab">the Chord Lab's</button></div>
      <div class="sng-csm">${rows.map((row, i) => `<div class="sng-csm-c${(u.csmAt || 0) === i ? ' on' : ''}" data-csmat="${i}"><b>${esc(sngChordName(row.ch, c.keyPc))}</b><span class="mono faint">${esc(row.ch.roman)}</span>
        <select class="inp" data-csmpick="${i}" title="${esc(row.r.why)}">${row.r.scales.map(s => `<option value="${s.id}" ${s.id === row.sc.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
        <span class="muted">${esc(row.sc.mood)} · colour ${esc(sngNoteName(c.keyPc + row.ch.root + row.sc.colour))}</span></div>`).join('')}</div>
      ${cur ? `<p class="muted">${esc(cur.r.why)}.</p>${sngKeysHTML(lit, roles, 48, 36)}
      <div class="sng-legend mono"><span><i class="r-chord"></i>chord tone</span><span><i class="r-tension"></i>available tension</span><span><i class="r-colour"></i>characteristic colour</span><span><i class="r-avoid"></i>avoid (on a strong beat)</span></div>` : ''}</div>
    <div class="card"><div class="sng-row"><button class="btn primary" id="csmLoop">${_sngCsm && _sngCsm.running ? '■ Stop' : '▶ Loop it — improvise'}</button>
      <button class="tbtn" id="csmCall">call and response</button><button class="tbtn" id="csmGuide">guide-tone line</button>
      <label class="mono faint">inside ↔ outside <input type="range" min="0" max="4" value="${c.out}" id="csmOut"> <span id="csmOutSay">${SNG_OUTSIDE_LEVELS[c.out]}</span></label></div>
      <p class="muted">Guide tones (3rds and 7ths moving by step): ${gt.map((g, i) => `${esc(sngMidiName(g.midi))} <span class="faint">(${g.role} of ${esc(sngChordName(rows[i].ch, c.keyPc))})</span>`).join(' → ')}</p>
      ${cur ? `<p class="muted"><b>Approach notes</b> into the ${esc(sngNoteName(c.keyPc + cur.ch.root + ((SNG_QUALITY[cur.ch.quality] || [0, 4])[1])))} (the 3rd of ${esc(sngChordName(cur.ch, c.keyPc))}): chromatic from below, the scale note above, or an enclosure (above, below, land) — on the off-beats, as bebop passing tones do.</p>` : ''}</div>
    <div class="card"><div class="sng-card-h"><b>Scale flashcards</b><span class="mono faint">given a chord in context, name the scale and its colour note</span></div>${sngCsmCardHTML()}</div>`;
  },
  bind(host){
    const c = sngCsmState(), u = sngUi(), st = sngState();
    const redraw = () => { saveNow(); rerender(); };
    host.querySelector('#csmKey').onchange = e => { c.keyPc = +e.target.value; redraw(); };
    $$('[data-csmpre]', host).forEach(b => b.onclick = () => { const p = SNG_CSM_PRESETS[+b.dataset.csmpre]; c.prog = p[1].slice(); c.colour = p[2]; c.pick = {}; u.csmAt = 0; redraw(); });
    host.querySelector('#csmFromLab').onclick = () => { const L = sngLabState(); c.prog = L.prog.slice(); c.colour = L.colour; c.keyPc = L.keyPc; c.pick = {}; redraw(); };
    $$('[data-csmat]', host).forEach(d => d.addEventListener('click', ev => { if(ev.target.closest('select')) return; u.csmAt = +d.dataset.csmat; rerender(); }));
    $$('[data-csmpick]', host).forEach(s => s.onchange = () => { c.pick[+s.dataset.csmpick] = s.value; redraw(); });
    host.querySelector('#csmOut').oninput = e => { c.out = +e.target.value; host.querySelector('#csmOutSay').textContent = SNG_OUTSIDE_LEVELS[c.out]; saveNow(); };
    const rows = () => sngCsmRows(c);
    host.querySelector('#csmLoop').onclick = () => {
      if(_sngCsm && _sngCsm.running){ _sngCsm.stop(); _sngCsm = null; rerender(); return; }
      const style = SNG_STYLES.find(s => s.id === (c.colour === 'blues' ? 'blues-shuffle' : 'jazz-swing4')) || SNG_STYLES[0];
      _sngCsm = sngGroove({chords: rows().map(r => r.ch), keyPc: c.keyPc, colour: c.colour, style, bpm: 100, swing: style.swing || 0.62, voicing: 'rootless', tone: 'rhodes',
        onBar: (b, i) => { u.csmAt = i; const r = rows()[i]; const kb = document.querySelector('[data-sngtool="chord-scale"] .sng-keys'); if(!r || !kb) return;
          const roles = {}; sngScaleRoles(r.ch, r.sc).forEach(x => { roles[sngPc(c.keyPc + r.ch.root + x.deg)] = x.role; });
          kb.outerHTML = sngKeysHTML(r.sc.deg.map(d => 60 + sngPc(c.keyPc + r.ch.root + d)), roles, 48, 36);
          $$('[data-csmat]').forEach((el, k) => el.classList.toggle('on', k === i)); }});
      _sngCsm.start(); sngLogSession('chord-scale'); rerender(); };
    /* the tool plays two bars from the scale; you answer in the next two */
    host.querySelector('#csmCall').onclick = () => {
      const rs = rows(), rnd = sngRng(Date.now() & 0xffff), notes = []; let t = 0, prev = 67;
      rs.slice(0, 2).forEach(r => { const set = sngCsmSet(r, c.out).map(d => c.keyPc + r.ch.root + d);
        for(let k = 0; k < 4; k++){ const cands = [...Array(25)].map((_, i) => 55 + i).filter(m => set.map(sngPc).includes(sngPc(m)) && Math.abs(m - prev) <= 5);
          const m = cands[Math.floor(rnd() * cands.length)] || prev; notes.push({midi: m, t, d: 0.9}); prev = m; t += 1; } });
      sngPlayMelody(notes, 100, {tone: 'rhodes', chords: rs.slice(0, 2).map((r, i) => ({t: i * 4, d: 4, midis: sngVoice(r.ch, c.keyPc, 'shell')}))});
      toast('Your turn in two bars — answer it.', 3000); };
    host.querySelector('#csmGuide').onclick = () => { const rs = rows(), gt = sngGuideTones(rs.map(r => r.ch), c.keyPc);
      sngPlayMelody(gt.map((g, i) => ({midi: g.midi, t: i * 4, d: 3.8})), 100, {tone: 'rhodes', chords: rs.map((r, i) => ({t: i * 4, d: 4, midis: sngVoice(r.ch, c.keyPc, 'shell')}))});
      sngSeed({type: 'melody', content: `Guide tones over ${c.prog.join('–')}: ${gt.map(g => sngMidiName(g.midi)).join(' ')}`, source: 'Chord-Scale Map'}); };
    bindSngCsmCard(host);
    void st;
  }
};
/* flashcards: a chord in a progression; name its scale and colour note */
function sngCsmCardHTML(){
  const u = sngUi(); if(!u.csmCard) u.csmCard = sngCsmDeal();
  const k = u.csmCard, row = k.row;
  return `<p class="serif sng-big">${esc(sngChordName(row.ch, 0))} <span class="muted">— ${esc(row.ch.roman)} in ${esc(k.ctx)}</span></p>
    ${u.csmShow ? `<p><b>${esc(row.r.scales[0].name)}</b> · colour note ${esc(sngNoteName(row.ch.root + row.r.scales[0].colour))}. <span class="muted">${esc(row.r.why)}</span></p>
      <div class="sng-row"><button class="tbtn" data-csmgrade="1">I had it</button><button class="tbtn" data-csmgrade="0">not yet</button></div>`
      : `<button class="btn sm" id="csmReveal">show the answer</button>`}
    <span class="mono faint">${(sngState().lab.csmScore || {right: 0}).right || 0} right of ${(sngState().lab.csmScore || {n: 0}).n || 0}</span>`;
}
function sngCsmDeal(){
  const p = SNG_CSM_PRESETS[Math.floor(Math.random() * SNG_CSM_PRESETS.length)], i = Math.floor(Math.random() * p[1].length);
  const chords = p[1].map(r => sngParseRoman(r));
  return {ctx: p[0], row: {ch: chords[i], r: sngScalesFor(chords[i], {keyPc: 0, colour: p[2], next: chords[(i + 1) % chords.length], blues: p[2] === 'blues'})}};
}
function bindSngCsmCard(host){
  const u = sngUi(), st = sngState();
  const r = host.querySelector('#csmReveal'); if(r) r.onclick = () => { u.csmShow = true; rerender(); };
  $$('[data-csmgrade]', host).forEach(b => b.onclick = () => { const s = st.lab.csmScore = st.lab.csmScore || {right: 0, n: 0}; s.n++; if(b.dataset.csmgrade === '1') s.right++; saveNow(); u.csmShow = false; u.csmCard = sngCsmDeal(); rerender(); });
}
