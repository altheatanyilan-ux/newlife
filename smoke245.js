/* smoke245 — Score Study, inside Repertoire.

   The claims.

   THE MIGRATION LOSES NOTHING. A database written by the site before Study
   (schema v19, the build at HEAD before this one) opens at v20 with every
   existing store unchanged and the six Study stores empty — on real Dexie and
   on the built-in fallback — and an analysis written on the fallback survives
   a reload.

   THE ENGINE IS RIGHT ON THE FIXTURES. Four small scores with known answers
   (tests/fixtures/study): the key of each, every Roman numeral, every cadence,
   and the period in the eight-bar one once its cadences are accepted. The
   accuracy is printed. It runs in a Worker, falls back to the page when there
   is no Worker, and reads 200 bars in well under the time a person waits.

   ROMANTEXT goes out and comes back the same; an expert's file is compared bar
   by bar.

   THE RECORD IS ADD-ONLY. A saved interpretation, a write-up and a decision
   cannot be changed or removed: persist() puts them back.

   TENSION AND TAKES. The dominant is tenser than the tonic; tapping at 120
   reads as 120.

   ON THE SCORE. The study button opens the panel in place of the sections;
   Analyse labels every chord on the engraving; every tab draws. A note
   anchored to a notehead sits on that notehead, and still does after zooming
   and after the window changes size. A long note is never cut: it becomes a
   pin whose popover holds every word; a short one is written inline; the
   threshold decides between them. */
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const {execSync} = require('child_process');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke245-'));
const NEW = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let OLD = null;
try { const rev = execSync('git log --format=%H -n 30 -- index.html', {cwd: __dirname}).toString().trim().split('\n');
  for(const r of rev){ const h = execSync(`git show ${r}:index.html`, {cwd: __dirname, maxBuffer: 64 << 20}).toString(); if(/db\.version\(19\)/.test(h)){ OLD = h; break; } } } catch(e){}
const noDexie = h => h.replace(/\/\* ---- dexie \(inlined[\s\S]*?\/\* ---- end dexie ---- \*\//, '');
const write = (name, html) => { const f = path.join(DIR, name); fs.writeFileSync(f, html); return 'file://' + f; };
const FX = n => fs.readFileSync(path.join(__dirname, 'tests/fixtures/study', n + '.musicxml'), 'utf8');

/* 200 bars: the period, twenty-five times over, renumbered */
function longScore(){
  const src = FX('period-g');
  return src.replace(/(<part id="[^"]+">)([\s\S]*?)(<\/part>)/g, (all, open, body, close) => {
    const bars = body.match(/<measure[\s\S]*?<\/measure>/g);
    let n = 0, out = '';
    for(let k = 0; k < 25; k++) bars.forEach((m, i) => { n++; let mm = m.replace(/number="\d+"/, `number="${n}"`); if(k > 0 && i === 0) mm = mm.replace(/<attributes>[\s\S]*?<\/attributes>/, ''); out += mm; });
    return open + out + close;
  });
}

const EXPECT = {
  'cadence-c':     {key: 'C', ch: ['1.1:I', '2.1:IV', '3.1:V', '4.1:I'], cad: ['4:PAC']},
  'applied-cad64': {key: 'C', ch: ['1.1:I', '2.1:V7/V', '3.1:cad64', '3.3:V7', '4.1:I'], cad: ['4:PAC']},
  'minor-a':       {key: 'a', ch: ['1.1:i', '2.1:iv', '3.1:V', '4.1:i'], cad: ['4:PAC']},
  'period-g':      {key: 'G', ch: ['1.1:I', '2.1:ii6', '2.3:IV', '3.1:I', '4.1:V', '5.1:I', '6.1:ii6', '6.3:IV', '7.1:V7', '8.1:I'], cad: ['4:HC', '8:PAC']},
};

async function boot(p, url){
  await p.goto(url); await p.waitForTimeout(1300);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
}
const AN = ['analyses', 'writeups', 'takes', 'performanceNotes', 'ambiguities', 'omrReviews'];
const snapshot = AN => (async () => {
  const out = {};
  for(const t of db.tables){ if(AN.includes(t.name)) continue; const rows = await t.toArray();
    out[t.name] = t.name === 'meta' ? rows.filter(r => !['anPrefs', 'sdSummary'].includes(r.key)).map(r => r.key).sort().join(',') : JSON.stringify(rows.map(r => JSON.stringify(r)).sort()); }
  return out;
})();

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const watch = p => { p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if(m.type() === 'error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/i.test(m.text())) errs.push('console: ' + m.text()); }); };

  console.log('\n0. the migration, on both database paths');
  if(!OLD) no('found the v19 build to migrate from');
  for(const [label, fix] of [['Dexie', h => h], ['the built-in fallback', noDexie]]){
    if(!OLD) break;
    const ctx = await b.newContext({viewport: {width: 1280, height: 900}}); const p = await ctx.newPage(); watch(p);
    const oldUrl = write('old-' + label.length + '.html', fix(OLD)), newUrl = write('new-' + label.length + '.html', fix(NEW));
    await boot(p, oldUrl);
    const v19 = await p.evaluate(async () => {
      for(let i = 0; i < 4; i++) S.entries.push({id: 'mig' + i, type: 'reflection', title: 'kept ' + i, body: 'body ' + i, occurredAt: '2025-01-0' + (i + 1), createdAt: new Date().toISOString(), links: {stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, tags: [], extra: {}});
      if(!Array.isArray(S.scores)) S.scores = []; S.scores.push({id: 'migs', title: 'A score that must survive', composer: '', musicXml: '<score-partwise/>', sections: [], pins: [], createdAt: new Date().toISOString()});
      await saveNow(); await flushSave();
      return {ver: db.verno || db._version, real: usingRealDexie};
    });
    await boot(p, oldUrl);
    const before = await p.evaluate(snapshot, AN);
    await boot(p, newUrl);
    const after = await p.evaluate(snapshot, AN);
    const info = await p.evaluate(async AN => ({ver: db.verno || db._version, real: usingRealDexie, empty: AN.every(k => Array.isArray(S[k]) && S[k].length === 0), stores: AN.every(k => db.tables.some(t => t.name === k)),
      kept: S.entries.filter(e => /^mig/.test(e.id)).length, score: !!S.scores.find(s => s.id === 'migs')}), AN);
    yes(`${label}: the old build ran at v19`, v19.ver === 19 && v19.real === (label === 'Dexie'), v19);
    yes(`${label}: the new build opens it at v20`, info.ver === 20 && info.real === (label === 'Dexie'), info);
    const diff = Object.keys(before).filter(k => before[k] !== after[k]);
    yes(`${label}: every existing store is unchanged`, !diff.length && Object.keys(before).length > 20, diff.join(', ') + ` (${Object.keys(before).length} stores)`);
    yes(`${label}: the entries and the score are there`, info.kept === 4 && info.score);
    yes(`${label}: the six Study stores exist, and are empty`, info.empty && info.stores, info);
    const id = await p.evaluate(async () => { const a = anNewVersion('migs', 'mine', {keySpans: [{id: 'k', startMeasure: 1, key: anKeyParse('G'), confidence: 1}], chordLabels: [{id: 'c', measure: 1, beat: 1, roman: 'I', function: 'T', confidence: 1, status: 'accepted'}]});
      anFreeze(a, 'kept'); anLog('migs', {kind: 'chord', measure: 1, readings: ['I', 'vi6'], chose: 'I', why: 'the bass'}); await saveNow(); await flushSave(); return a.id; });
    await boot(p, newUrl);
    const back = await p.evaluate(id => { const a = S.analyses.find(z => z.id === id); return {a: !!a && a.frozen && a.label === 'kept' && a.chordLabels[0].roman === 'I', log: S.ambiguities.length}; }, id);
    is(`${label}: an analysis and a decision survive a reload`, back, {a: true, log: 1});
    await ctx.close();
  }

  const ctx = await b.newContext({viewport: {width: 1400, height: 950}}); const p = await ctx.newPage(); watch(p);
  await boot(p, write('main.html', NEW));

  console.log('\n1. the engine, on the fixtures');
  let right = 0, total = 0, keyRight = 0, cadRight = 0, cadTotal = 0;
  for(const [name, want] of Object.entries(EXPECT)){
    const r = await p.evaluate(async xml => { const P = anParse(xml); const r = await anAnalyzeAsync(P, {profile: 'tkp', penalty: 1.2});
      const a = {id: 'x', scoreId: 's', keySpans: r.keySpans, chordLabels: r.chordLabels};
      a.cadences = anFindCadences(a, P, {definition: 'broad'});
      return {where: r.where, keys: r.keySpans.map(s => anKeyName(s.key)), dom: r.keySpans.map(s => !!s.dominantWarning),
        ch: r.chordLabels.map(c => c.measure + '.' + c.beat + ':' + c.roman), conf: r.chordLabels.map(c => c.confidence), alts: r.chordLabels.map(c => c.alt ? c.alt.roman : null),
        cad: a.cadences.map(c => c.measure + ':' + c.type)}; }, FX(name));
    const hit = want.ch.filter(c => r.ch.includes(c)).length;
    right += hit; total += want.ch.length; keyRight += r.keys[0] === want.key && r.keys.length === 1 ? 1 : 0;
    const ch = want.cad.filter(c => r.cad.includes(c)).length; cadRight += ch; cadTotal += want.cad.length;
    is(`${name}: the key`, r.keys, [want.key]);
    is(`${name}: the Roman numerals`, r.ch, want.ch);
    is(`${name}: the cadences`, r.cad, want.cad);
    yes(`${name}: every label says how sure it is and gives the next-best reading`, r.conf.every(c => c > 0 && c <= 1) && r.alts.filter(Boolean).length >= r.alts.length - 1, {conf: r.conf, alts: r.alts});
    yes(`${name}: it ran in the Worker`, r.where === 'worker', r.where);
    if(name === 'applied-cad64') yes('applied-cad64: the runner-up key is the dominant, and it says so', r.dom[0] === true, r.dom);
  }
  console.log(`  ---  accuracy: keys ${keyRight}/4, chords ${right}/${total} (${Math.round(right / total * 100)}%), cadences ${cadRight}/${cadTotal}`);
  yes('accuracy on the fixtures is 100%', right === total && keyRight === 4 && cadRight === cadTotal);

  const F = await p.evaluate(async xml => { const P = anParse(xml); const r = await anAnalyzeAsync(P, {});
    const a = {id: 'y', scoreId: 's', keySpans: r.keySpans, chordLabels: r.chordLabels};
    a.cadences = anFindCadences(a, P, {definition: 'broad'}).map(c => Object.assign(c, {status: 'accepted'}));
    a.units = anSeedUnits(a, P);
    const strict = anFindCadences(a, P, {definition: 'strict'}).map(c => c.measure + ':' + c.type);
    return {units: a.units.map(u => `${u.kind} ${u.startMeasure}-${u.endMeasure}`), strict}; }, FX('period-g'));
  is('period-g: once its cadences are accepted, the phrases are an antecedent and a consequent, and together a period', F.units, ['antecedent 1-4', 'consequent 5-8', 'period 1-8']);
  yes('  the strict definition still finds the half and the perfect cadence', F.strict.includes('4:HC') && F.strict.includes('8:PAC'), F.strict);

  const W = await p.evaluate(async xml => { const keep = window.Worker; window.Worker = undefined;
    try { const r = await anAnalyzeAsync(anParse(xml), {}); return {where: r.where, ch: r.chordLabels.map(c => c.roman).join(' ')}; } finally { window.Worker = keep; } }, FX('cadence-c'));
  is('without a Worker it runs in the page, with the same answer', W, {where: 'page', ch: 'I IV V I'});

  const L = await p.evaluate(async xml => { const t0 = performance.now(); const P = anParse(xml); const t1 = performance.now(); const r = await anAnalyzeAsync(P, {}); const t2 = performance.now();
    return {bars: P.measures.length, parse: Math.round(t1 - t0), run: Math.round(t2 - t1), where: r.where, labels: r.chordLabels.length, keys: r.keySpans.length}; }, longScore());
  yes(`200 bars are read and analysed quickly`, L.bars === 200 && L.run < 4000 && L.labels === 250 && L.keys === 1, L);
  console.log(`  ---  200 bars: parse ${L.parse} ms, analysis ${L.run} ms in the ${L.where}`);

  console.log('\n2. RomanText');
  const R = await p.evaluate(async xml => { const P = anParse(xml); const r = await anAnalyzeAsync(P, {});
    const a = {origin: 'auto', keySpans: r.keySpans, chordLabels: r.chordLabels};
    const txt = anToRntxt(a, {title: 'Period', composer: 'Test'});
    const back = anFromRntxt(txt);
    const expert = anFromRntxt('Composer: Test\nTitle: Period\nAnalyst: someone\n\nTime Signature: 4/4\nm1 G: I\nm2 ii6 b3 IV\nm3 I\nm4 V\nm5 I\nm6 ii65 b3 IV\nm7 V7\nm8 I\n');
    return {txt, same: JSON.stringify(back.chordLabels.map(c => [c.measure, c.beat, c.roman])) === JSON.stringify(r.chordLabels.map(c => [c.measure, c.beat, c.roman])),
      keys: back.keySpans.map(s => anKeyName(s.key)), meta: back.meta.Title, diff: anDiff(a, expert), fn: expert.chordLabels.map(c => c.function).join(' ')}; }, FX('period-g'));
  yes('it writes bars as RomanText lines, the key once', /^m1 G: I$/m.test(R.txt) && /^m2 ii6 b3 IV$/m.test(R.txt) && (R.txt.match(/G:/g) || []).length === 1, R.txt);
  yes('and reads them back to the same labels and key', R.same && R.keys.join() === 'G' && R.meta === 'Period');
  is("an expert's file is compared bar by bar: the one difference is found", R.diff, [{measure: 6, beat: 1, a: 'ii6', b: 'ii65'}]);
  is("  and functions come from the imported numerals", R.fn, 'T PD PD T D T PD PD D T');

  console.log('\n3. the record is add-only');
  const G = await p.evaluate(async () => {
    const a = anNewVersion('guard', 'mine', {keySpans: [{id: 'k', startMeasure: 1, key: anKeyParse('C'), confidence: 1}], chordLabels: [{id: 'c1', measure: 1, beat: 1, roman: 'I', function: 'T', confidence: 1, status: 'accepted'}]});
    anFreeze(a, 'first');
    const w = anAddWriteup(a, 's-all', [{kind: 'harmony', title: 'Harmony', text: 'Mine.'}], 'mine', 'mine');
    const d = anLog('guard', {kind: 'key', measure: 1, readings: ['C', 'G'], chose: 'C', why: 'the cadence'});
    await saveNow(); await flushSave();
    /* now try to change each of them */
    a.chordLabels[0].roman = 'vi'; a.frozen = false;
    const wi = S.writeups.findIndex(z => z.id === w.id); S.writeups[wi] = Object.assign({}, w, {blocks: [{kind: 'harmony', text: 'Changed.'}]});
    S.ambiguities = S.ambiguities.filter(z => z.id !== d.id);
    await saveNow(); await flushSave();
    const A = S.analyses.find(z => z.id === a.id), Wr = S.writeups.find(z => z.id === w.id), D = S.ambiguities.find(z => z.id === d.id);
    /* editing the saved one starts a new version instead */
    const e = anEditable(A); e.chordLabels[0].roman = 'I6';
    await saveNow(); await flushSave();
    return {a: A.frozen && A.chordLabels[0].roman === 'I', w: Wr.blocks[0].text, d: !!D, fresh: e.id !== a.id && e.version === 2 && e.parentId === a.id && !e.frozen,
      kept: S.analyses.find(z => z.id === a.id).chordLabels[0].roman, frozenRow: Object.isFrozen(S.ambiguities.find(z => z.id === d.id)) && Object.isFrozen(anLog('guard', {kind: 'x', readings: []}))};
  });
  is('a saved interpretation, a write-up and a decision are put back', {a: G.a, w: G.w, d: G.d}, {a: true, w: 'Mine.', d: true});
  yes('editing a saved interpretation makes version 2 and leaves version 1 as it was', G.fresh && G.kept === 'I', G);
  yes('a decision row is frozen in memory too', G.frozenRow);

  console.log('\n4. tension and takes');
  const T = await p.evaluate(async xml => { const P = anParse(xml); const r = await anAnalyzeAsync(P, {});
    const a = {keySpans: r.keySpans, chordLabels: r.chordLabels};
    const t = a.tension = anTension(a, P); const v = Object.fromEntries(t.curve.map(c => [c.measure + '.' + c.beat, c.value]));
    const taps = []; for(let i = 0; i < 16; i++) taps.push({time: 1000 + i * 500});
    const pts = anTakeTempo({startMeasure: 1, taps}, P, false);
    const slow = taps.map((x, i) => ({time: 1000 + i * 500 + (i > 12 ? (i - 12) * 180 : 0)}));
    a.cadences = anFindCadences(a, P, {}).map(c => Object.assign(c, {status: 'accepted'})); a.units = anSeedUnits(a, P);
    const facts = anTakeFacts({startMeasure: 1, taps: slow}, a, P);
    const svg = anOverlaySVG(P, a, [{label: 'take', pts: anTakeTempo({startMeasure: 1, taps: slow}, P, true)}]);
    return {v, bpm: pts.map(x => Math.round(x.bpm)), facts: facts.lines.join(' '), svg: /an-tempo/.test(svg) && /an-tension/.test(svg) && /an-cadline/.test(svg), method: t.method}; }, FX('cadence-c'));
  yes('the dominant is tenser than the tonic, and the tonic at the end relaxes', T.v['3.1'] > T.v['1.1'] && T.v['3.1'] > T.v['4.1'], T.v);
  yes('the curve says how it was made', /TPS/.test(T.method));
  yes('taps every half second read as 120 to the quarter', T.bpm.length === 15 && T.bpm.every(x => x === 120), T.bpm);
  yes('a take that slows at the cadence says so, in plain facts', /Median tempo 120/.test(T.facts) && /biggest slowings/.test(T.facts), T.facts);
  yes('tempo, tension and cadences share one chart', T.svg);

  console.log('\n5. on the score');
  const id = await p.evaluate(async xml => (await takeScoreFile(new File([xml], 'Period in G.musicxml'))).id, FX('period-g'));
  await p.evaluate(id => { const ui = scoreUi(); ui.focus = null; ui.study = false; location.hash = '#/score/' + id; }, id);
  await p.waitForSelector('#scCanvas svg', {timeout: 20000}); await p.waitForTimeout(800);
  yes('the study button is in the head of the score', !!(await p.$('#scStudy')));
  await p.click('#scStudy'); await p.waitForTimeout(1500);
  await p.waitForSelector('#scCanvas svg', {timeout: 20000});
  const U0 = await p.evaluate(() => ({side: !!document.querySelector('#anSide'), secHidden: document.querySelector('#scSide').hidden && getComputedStyle(document.querySelector('#scSide')).display === 'none',
    empty: /Nothing analysed yet/.test(document.querySelector('#anSide').textContent)}));
  is('it opens the study panel in place of the sections', U0, {side: true, secHidden: true, empty: true});
  await p.click('#anRun'); await p.waitForTimeout(2500);
  const U1 = await p.evaluate(id => { const a = anCurrent(id); return {labels: document.querySelectorAll('#anLayer .an-lbl').length, want: a ? a.chordLabels.length : -1,
    text: [...document.querySelectorAll('#anLayer .an-lbl')].map(b => b.textContent).join(' '), key: document.querySelector('#anLayer .an-keylbl') && document.querySelector('#anLayer .an-keylbl').textContent,
    flags: [...document.querySelectorAll('#anLayer .an-cadflag')].map(f => f.textContent).join(' ')}; }, id);
  yes('Analyse puts every chord on the engraving, with the key and the cadences', U1.labels === 10 && U1.want === 10 && U1.text === 'I ii6 IV I V I ii6 IV V7 I' && U1.key === 'G:' && U1.flags === 'HC PAC', U1);
  const tabs = await p.$$eval('[data-antab]', bs => bs.map(b => b.dataset.antab));
  const drawn = [];
  for(const t of tabs){ await p.click(`[data-antab="${t}"]`); await p.waitForTimeout(250);
    drawn.push(await p.evaluate(t => ({t, on: document.querySelector(`[data-antab="${t}"]`).classList.contains('on'), n: document.querySelector('#anBody').textContent.trim().length}), t)); }
  yes(`all ${tabs.length} tabs draw`, tabs.length === 11 && drawn.every(d => d.on && d.n > 20), drawn.filter(d => !d.on || d.n <= 20));
  await p.screenshot({path: path.join(DIR, 'study.png')});

  /* a note on a notehead */
  const place = async () => p.evaluate(() => {
    const btn = document.querySelector('.an-note[data-annote="nlong"]'), short = document.querySelector('.an-note[data-annote="nshort"]');
    const pos = anNotePositions(), P = _anCtx.parsed;
    const want = anResolveAnchor(S.performanceNotes.find(n => n.id === 'nlong').anchor, pos, P);
    const canvas = document.querySelector('#scCanvas').getBoundingClientRect(), layer = document.querySelector('#anNotes').getBoundingClientRect();
    const heads = [...document.querySelectorAll('#scCanvas .vf-notehead')].map(h => h.getBoundingClientRect());
    const hx = canvas.left + want[0].x, hy = canvas.top + want[0].y;
    const onHead = heads.some(r => hx >= r.left - 4 && hx <= r.right + 4 && hy >= r.top - 8 && hy <= r.bottom + 8);
    return {btn: !!btn, left: btn ? parseFloat(btn.style.left) : null, x: want[0] ? want[0].x : null, dx: Math.abs(layer.left - canvas.left), dy: Math.abs(layer.top - canvas.top), onHead, heads: heads.length,
      cls: btn ? btn.className : '', shortCls: short ? short.className : '', shortText: short ? short.textContent : ''};
  });
  const LONG = Array.from({length: 420}, (_, i) => ['Let', 'the', 'bass', 'speak', 'first,', 'then', 'breathe', 'before', 'the', 'turn'][i % 10]).join(' ') + ' — the end of a long note.';
  await p.evaluate(({id, LONG}) => {
    const P = _anCtx.parsed; const n = P.notes.filter(z => z.num === 2 && z.staff === 1).sort((a, b) => a.at - b.at || b.midi - a.midi)[0];
    const n3 = P.notes.filter(z => z.num === 3 && z.staff === 2).sort((a, b) => a.at - b.at)[0];
    const anchor = z => ({partId: z.partId, staff: z.staff, voice: z.voice, measure: z.num, at: z.at, noteIds: [z.id], pitches: [z.midi]});
    S.performanceNotes.push({id: 'nlong', scoreId: id, status: 'mine', origin: 'mine', text: LONG, reason: 'Because.', category: 'voicing', level: 2, hand: 'RH', anchor: anchor(n), createdAt: anNow()});
    S.performanceNotes.push({id: 'nshort', scoreId: id, status: 'mine', origin: 'mine', text: 'Bass first, then the chord.', category: 'timing', level: 1, hand: 'LH', anchor: anchor(n3), createdAt: anNow()});
    const pr = anEnsure(); pr.showNotes = true; pr.inlineWords = 12; pr.noteFilter = {}; pr.density = 'all'; save(); anAfterPaint(_anCtx.x);
  }, {id, LONG});
  await p.waitForTimeout(300);
  const A1 = await place();
  yes('a note anchored to a notehead is drawn at that notehead', A1.btn && A1.onHead && A1.dx < 1 && A1.dy < 1 && Math.abs(A1.left - (A1.x + 2)) < 1, A1);
  yes('a 420-word note shows as a pin; a six-word one is written inline, in full', /\bpin\b/.test(A1.cls) && /\binline\b/.test(A1.shortCls) && A1.shortText === 'Bass first, then the chord.', A1);
  await p.click('.an-note[data-annote="nlong"]'); await p.waitForTimeout(200);
  const pop = await p.evaluate(() => { const q = document.querySelector('.an-pop .an-poptext'); if(!q) return null; const cs = getComputedStyle(q);
    return {text: q.textContent, clip: cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' && cs.webkitLineClamp !== '' , scroll: getComputedStyle(document.querySelector('.an-pop')).overflowY}; });
  yes('its popover holds every word, uncut', pop && pop.text === LONG && !pop.clip && pop.scroll === 'auto', pop && {len: pop.text.length, want: LONG.length, clip: pop.clip});
  await p.evaluate(() => document.querySelectorAll('.an-pop').forEach(n => n.remove()));
  const saved = await p.evaluate(async () => { await saveNow(); await flushSave(); const r = await db.table('performanceNotes').get('nlong'); return r && r.text.length; });
  is('  and it is stored whole', saved, LONG.length);
  await p.evaluate(() => { anEnsure().inlineWords = 3; anAfterPaint(_anCtx.x); });
  const th = await p.evaluate(() => document.querySelector('.an-note[data-annote="nshort"]').className);
  yes('lowering the threshold to three words turns the short note into a pin', /\bpin\b/.test(th), th);
  await p.evaluate(() => { anEnsure().inlineWords = 12; anAfterPaint(_anCtx.x); });

  /* zoom */
  const z0 = A1.x;
  await p.click('[data-sczoom="1"]'); await p.waitForTimeout(2500);
  const A2 = await place();
  yes('after zooming in, the note moves with its notehead', A2.btn && A2.onHead && Math.abs(A2.left - (A2.x + 2)) < 1 && A2.x > z0 + 3, {before: z0, after: A2});
  await p.click('[data-sczoom="-1"]'); await p.waitForTimeout(2500);
  /* the window changes size */
  await p.setViewportSize({width: 1000, height: 800}); await p.waitForTimeout(1500);
  const A3 = await place();
  yes('after the window narrows, it is still on its notehead', A3.btn && A3.onHead && Math.abs(A3.left - (A3.x + 2)) < 1, A3);
  /* reading mode reflows on resize; the notes follow */
  await p.evaluate(() => { const ui = scoreUi(); ui.reading = true; save(); rerender(); }); await p.waitForTimeout(3000);
  await p.setViewportSize({width: 820, height: 1000}); await p.waitForTimeout(3000);
  const A4 = await place();
  yes('in reading mode, after a reflow, it is still on its notehead', A4.btn && A4.onHead && Math.abs(A4.left - (A4.x + 2)) < 1, A4);
  await p.evaluate(() => { const ui = scoreUi(); ui.reading = false; save(); rerender(); }); await p.waitForTimeout(2000);
  await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(1500);
  const M = await p.evaluate(() => ({side: !!document.querySelector('#anSide'), over: document.documentElement.scrollWidth - innerWidth}));
  yes('at phone width the panel is there and nothing scrolls sideways', M.side && M.over <= 1, M);
  await p.screenshot({path: path.join(DIR, 'study-390.png'), fullPage: false});
  await p.setViewportSize({width: 1400, height: 950}); await p.waitForTimeout(800);

  console.log('\n6. write-ups and the log from the panel');
  const WU = await p.evaluate(id => { const a = anCurrent(id), P = _anCtx.parsed; const sec = (a.sections && a.sections[0]) || {id: 's-all', startMeasure: 1, endMeasure: 8, label: 'The whole piece'};
    const b1 = JSON.stringify(anWriteupBlocks(a, sec, P)), b2 = JSON.stringify(anWriteupBlocks(a, sec, P));
    return {same: b1 === b2, kinds: JSON.parse(b1).map(x => x.kind), long: JSON.parse(b1).map(x => x.text.length)}; }, id);
  yes('the proposed write-up is the same every time it is made (rules and templates)', WU.same && WU.kinds.length >= 3, WU);
  await p.click('[data-antab="cadences"]'); await p.waitForTimeout(300);
  const acc = await p.$$('[data-ancad]');
  yes('the cadences tab lists both cadences with their own buttons', acc.length >= 2, acc.length);

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}  (screenshots in ${DIR})`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
