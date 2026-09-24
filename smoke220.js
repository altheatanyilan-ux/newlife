/* smoke220 — Curriculum v3: the thirteen stages, the document on them, and
   the Real Book beside them.

   The v3 document restructures the ladder into Stage 0 to Stage 12 with a
   parallel Voice Track V1–V6, and names 143 entries. The room's own
   exercises keep their ids — progress is keyed by them — and move to the
   stage the document puts their range on. Where the document and the
   book-checked exercise disagree, both are kept and each points at the
   other, so they can be compared and one of them corrected.

   WHAT IS CLAIMED. The ladder's shape (0–12, the DT track inline after 9,
   V1–V6 on the voice tab); that every exercise is placed exactly once and
   every one of the document's entries is on the ladder; that every
   conflict pair exists on both sides, with its pill and its row on the
   About page; that the one-time migration moves old stage records onto
   the new stages; that every scored v3 item engraves in all twelve keys;
   and that the tune database says what it was delivered saying — 917
   entries in the contents, 798 distinct, 76 analysed, every chart read,
   and Autumn Leaves' ii-V-I and minor ii-V-i where the document says.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1400, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. the ladder has the document\'s shape');
  const L = await p.evaluate(() => {
    const st = jazzStages();
    const all = st.flatMap(s => s.subs);
    const book = jazzBook();
    return {ids: st.map(s => String(s.id)), names: st.filter(s => /^\d+$/.test(String(s.id))).length,
      placed: all.length, distinct: new Set(all).size, total: Object.keys(book).length,
      unplaced: Object.keys(book).filter(id => !all.includes(id)).slice(0, 5),
      missing: all.filter(id => !book[id]).slice(0, 5),
      v3new: Object.values(book).filter(e => e.isV3).length,
      stage1: st.find(s => String(s.id) === '1').name, stage12: st.find(s => String(s.id) === '12').name};
  });
  is('Stage 0 to 12, the DT track after 9, and the voice levels',
    L.ids, ['P0','1','2','3','4','5','6','7','8','9','DT','10','11','12','V1','V2','V3','V4','V5','V6']);
  is('every exercise is placed exactly once', [L.placed, L.distinct], [L.total, L.total]);
  is('  nothing left off the ladder', L.unplaced, []);
  is('  nothing on the ladder that is not an exercise', L.missing, []);
  yes('the document added its own entries', L.v3new >= 120, `${L.v3new}`);
  yes('stages carry the document\'s poetic titles', /Day One at the Piano/.test(L.stage1), L.stage1);

  console.log('\n2. every entry the document names is on the ladder');
  const D = await p.evaluate(() => {
    const keys = new Set(JAZZ_V3_DOC.items.map(i => i.key));
    const onLadder = new Set(jazzStages().flatMap(s => s.subs).map(id => jazzExercise(id))
      .filter(e => e && e.v3 && e.v3.key).map(e => e.v3.key));
    const types = {}; jazzStages().flatMap(s => s.subs).forEach(id => { const t = jazzExercise(id).type; types[t] = (types[t] || 0) + 1; });
    return {items: keys.size, missing: [...keys].filter(k => !onLadder.has(k)), types: Object.keys(types).sort()};
  });
  is('143 entries in the document', D.items, 143);
  is('  and all of them are somewhere on it', D.missing, []);
  is('every rung wears one of the document\'s six type tags', D.types,
    ['DRILL','IMPROV','LISTEN','NOTATION','THEORY','WORKSHEET']);

  console.log('\n3. where the document and the book differ, both are kept');
  const C = await p.evaluate(() => JAZZ_V3_CONFLICTS.map(c => {
    const sides = [c.v3].concat(c.app).filter((x, i, a) => a.indexOf(x) === i);
    return {doc: c.doc, sides, there: sides.every(id => !!jazzExercise(id)),
      pill: sides.length > 1 ? sides.every(id => /differs/.test(jazzV3ConflictPillHTML(id))) : true};
  }));
  yes('the conflicts are listed', C.length >= 25, `${C.length}`);
  is('  every side of every pair exists', C.filter(c => !c.there).map(c => c.doc), []);
  is('  and every side points at the other', C.filter(c => !c.pill).map(c => c.doc), []);
  await p.evaluate(() => { location.hash = '#/jazz/about'; }); await p.waitForTimeout(1500);
  const rows = await p.evaluate(() => [...document.querySelectorAll('.jzv3-table')].find(t => /What the document says/.test(t.textContent)).querySelectorAll('tbody tr').length);
  is('  the About page has a row for each', rows, C.length);
  const about = await p.evaluate(() => document.querySelector('.page').innerText);
  yes('  and the whole road, and what was left out', /The whole road/.test(about) && /excluded/i.test(about));

  console.log('\n4. the one-time migration moves old stage records onto v3 stages');
  const M = await p.evaluate(() => {
    const j = {stages: {'3': {status: 'completed', startDate: '2026-01-05', completedDate: '2026-02-01'},
                        '4': {status: 'active', startDate: '2026-02-02'},
                        '7B': {status: 'active', startDate: '2026-03-01'}, '15': {status: 'not_started'}},
      sessions: [{stageId: '7C'}, {stageId: '13'}], settings: {collapsed: {'6A': true}}};
    const moved = jazzV3Migrate(j), again = jazzV3Migrate(j);
    return {moved, again, keys: Object.keys(j.stages).sort(), s2: j.stages['2'].status, s2start: j.stages['2'].startDate,
      from: j.stages['2'].migratedFrom, sess: j.sessions.map(s => s.stageId), col: Object.keys(j.settings.collapsed), flag: j.curriculum};
  });
  is('old 3 and 4 become Stage 2, the active one winning, the earliest start kept',
    [M.s2, M.s2start, M.from], ['active', '2026-01-05', ['3', '4']]);
  is('7B → 7, 15 → 11', M.keys, ['11', '2', '7']);
  is('sessions and folded stages follow', [M.sess, M.col], [['8', '12'], ['4']]);
  is('it runs once', [M.moved, M.again, M.flag], [true, false, 3]);

  console.log('\n5. every scored v3 item engraves in all twelve keys');
  await p.evaluate(() => osmdBoot()); await p.waitForTimeout(3000);
  const E = await p.evaluate(async () => {
    const box = document.createElement('div'); box.style.width = '760px'; document.body.appendChild(box);
    const lib = await osmdBoot(); const bad = []; let n = 0;
    const ids = jazzStages().flatMap(s => s.subs).filter(id => { const e = jazzExercise(id);
      return jazzHasScore(e) && (e.isV3 || e.xml || e.v3gen || e.v3tab); });
    for(const id of ids) for(const key of JAZZ_KEY_NAMES){
      let res; try { res = jazzScoreXml(jazzExercise(id), key, {interval: 'major3rd'}); } catch(e){ bad.push(`${id} ${key} threw ${e.message}`); continue; }
      for(const xml of (res && res.documents ? res.documents.map(d => d.mxl) : [res])){
        if(!xml){ bad.push(`${id} ${key} empty`); continue; }
        try { const o = new lib.OpenSheetMusicDisplay(box, {autoResize:false, backend:'svg', drawTitle:false,
            drawComposer:false, drawCredits:false, drawPartNames:false, drawMeasureNumbers:false});
          const r = o.EngravingRules || o.rules; if(r) r.FillEmptyMeasuresWithWholeRest = 2;
          await o.load(xml); o.render(); if(!box.querySelectorAll('.vf-notehead').length) bad.push(`${id} ${key} nothing drawn`); n++; }
        catch(e){ bad.push(`${id} ${key} ${e.message}`); }
        box.innerHTML = '';
      }
    }
    box.remove();
    return {ids: ids.length, n, bad: bad.slice(0, 8), nBad: bad.length};
  });
  yes('there are scored v3 items to draw', E.ids >= 70, `${E.ids}`);
  is(`  all ${E.n} engravings drew notes`, E.bad, []);

  console.log('\n6. the tune database, as delivered, and read');
  const T = await p.evaluate(() => {
    const I = jazzTuneIndex();
    const unread = I.rows.filter(r => r.tune).filter(r => { const c = jazzParseChart(r.tune.chordProgression); return !c.bars.length && !c.prose; }).map(r => r.id);
    const al = jazzTuneAnalysis(jazzTune('autumn-leaves')).spans.map(s => `${s.kind} ${s.from}-${s.to}`);
    return {total: I.total, distinct: I.rows.length, analysed: I.analyzed, unread,
      soWhat: jazzParseChart(jazzTune('so-what').chordProgression).bars.length,
      al, rules: TUNE_DB_STATS.stageAlignmentRules && Object.keys(TUNE_DB_STATS.stageAlignmentRules).length,
      rec3: jazzRecommendedTunes({stage: '3'}).map(x => x.row.id).slice(0, 3),
      stages: [...I.idx.stage.keys()].sort((a, b) => a - b)};
  });
  is('917 in the contents, 798 distinct, 76 analysed', [T.total, T.distinct, T.analysed], [917, 798, 76]);
  is('every analysed chart is read', T.unread, []);
  is('So What\'s Dm7(16)|Ebm7(8)|Dm7(8) is thirty-two bars', T.soWhat, 32);
  yes('Autumn Leaves: the ii-V-I in bars 1–3', T.al.includes('iivi 1-3'), T.al.join(', '));
  yes('  and the minor ii-V-i in bars 5–7', T.al.includes('minor 5-7'), T.al.join(', '));
  yes('the alignment rules are the v3 ones', T.rules > 0);
  yes('Stage 3\'s tunes are blues', ['blue-monk','billies-bounce','straight-no-chaser'].every(id => T.rec3.includes(id)), T.rec3.join(', '));
  yes('tunes reach stages across the ladder', T.stages.length >= 8, T.stages.join(' '));

  console.log('\n7. the pages open');
  for(const h of ['#/jazz', '#/jazz/tunes', '#/jazz/tune/autumn-leaves', '#/jazz/repertoire', '#/jazz/analysis', '#/jazz/1.1', '#/jazz/v3-2.903']){
    const before = errs.length;
    await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(1300);
    yes(`${h} draws without an error`, errs.length === before && await p.evaluate(() => !!document.querySelector('.page')), errs.slice(before).join(' | '));
  }

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
