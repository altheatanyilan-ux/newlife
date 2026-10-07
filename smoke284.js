/* smoke284 — a save writes the rows that changed, and loses nothing.

   The claims.

   A change to one thing writes that one row. Zooming one score in a library of
   fifteen used to clear and rewrite the whole scores store — every piece's
   MusicXML — on each press; now it writes the one row, deletes nothing, and
   clears nothing. A row added is written, one changed is rewritten, one
   removed is deleted, in any mix across stores (a keyed list, the one-object-
   per-key meta store, the day-keyed ones), and after any run of such changes
   what is on disk is exactly what the app holds — and it is still exactly that
   after a reload. A store whose rows cannot be told apart (the same key
   twice) is written whole, as it always was, and also comes back right. The
   add-only guards still put back what must not change.

   Run: NODE_PATH=node_modules node smoke284.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 900}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(/save failed/i.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); });

  /* how the disk compares with the app: every store, as rows by key */
  const same = () => p.evaluate(async () => {
    await flushSave();
    const disk = await readAllStores(), mem = stateToStores(S), bad = [];
    const norm = (k, rows) => JSON.stringify((rows || []).map(r => JSON.stringify(r)).sort());
    for(const k of Object.keys(mem)) if(norm(k, disk[k]) !== norm(k, JSON.parse(JSON.stringify(mem[k])))) bad.push(k);
    return bad; });
  /* what the save did, counted at the database itself */
  const watch = () => p.evaluate(() => { window.__w = {put: 0, del: 0, clear: 0};
    if(!window.__wrapped){ window.__wrapped = true; const P = IDBObjectStore.prototype;
      ['put', 'delete', 'clear'].forEach(m => { const f = P[m]; P[m] = function(...a){ const k = m === 'delete' ? 'del' : m; window.__w[k]++; return f.apply(this, a); }; }); } });
  const seen = () => p.evaluate(() => Object.assign({}, window.__w));

  console.log('\n1. one change writes one row');
  await p.evaluate(async () => { const xml = '<?xml version="1.0"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>P</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>';
    for(let i = 0; i < 15; i++) addScore({title: 'Piece ' + i, composer: 'T', musicXml: xml.replace('<part-name>P', '<part-name>P' + i)});
    await saveNow(); await flushSave(); });
  is('to start with, disk and app agree', await same(), []);
  await watch();
  await p.evaluate(async () => { scores()[3].zoom = 1.4; await saveNow(); await flushSave(); });
  is('zooming one of fifteen scores: one row put, nothing deleted or cleared', await seen(), {put: 1, del: 0, clear: 0});
  await p.evaluate(async () => { await saveNow(); await flushSave(); });
  is('and a save with nothing changed writes nothing', (await seen()).put, 1);

  console.log('\n2. adds, edits and removals, mixed, across stores');
  await watch();
  await p.evaluate(async () => {
    S.tasks.push(Object.assign(newTask('written by the test'), {day: today()}));        /* a keyed list: add */
    S.scores.splice(5, 1);                                                               /* a keyed list: remove */
    scores()[0].title = 'Renamed';                                                       /* a keyed list: edit */
    S.settings.__smoke284 = 'meta row changed';                                          /* the one-row-per-key store */
    S.habitLog[today()] = Object.assign(S.habitLog[today()] || {}, {__t: true});         /* a day-keyed store */
    await saveNow(); await flushSave(); });
  is('disk and app agree after the mix', await same(), []);
  const w = await seen();
  yes('  by rows: a few puts, one delete, no clearing', w.put >= 4 && w.put <= 8 && w.del === 1 && w.clear === 0, w);
  /* many rounds of random changes */
  for(let round = 0; round < 12; round++){
    await p.evaluate(async round => {
      const pick = a => a[Math.floor(Math.random() * a.length)];
      for(let i = 0; i < 1 + Math.floor(Math.random() * 4); i++){
        const op = Math.floor(Math.random() * 6);
        if(op === 0) S.tasks.push(Object.assign(newTask('t' + round + '.' + i), {day: today()}));
        else if(op === 1 && S.tasks.length > 3) S.tasks.splice(Math.floor(Math.random() * S.tasks.length), 1);
        else if(op === 2 && S.tasks.length) pick(S.tasks).text = 'edited ' + round + '.' + i;
        else if(op === 3 && scores().length) pick(scores()).zoom = 1 + Math.random();
        else if(op === 4 && scores().length > 4) S.scores.splice(Math.floor(Math.random() * S.scores.length), 1);
        else S.settings['__r' + (round % 3)] = round + '.' + i;
      }
      await saveNow(); if(round % 2) await flushSave(); }, round);
  }
  is('after twelve rounds of random changes, disk and app agree', await same(), []);
  await p.reload(); await p.waitForTimeout(2200);
  is('and still agree after a reload', await same(), []);
  yes('  with what the test wrote still in it', await p.evaluate(() => S.settings.__smoke284 === 'meta row changed' && scores().some(s => s.title === 'Renamed')));

  console.log('\n3. rows that cannot be told apart are written whole');
  await watch();
  const r3 = await p.evaluate(async () => {
    const t = newTask('twin'); S.tasks.push(t, Object.assign({}, t, {text: 'twin, second copy'}));   /* the same id twice */
    await saveNow(); await flushSave();
    return {whole: window.__w.clear >= 1}; });
  yes('the store was cleared and written whole', r3.whole, r3);
  /* a keyed store holds one row per key, so of two with the same key the last one is what is kept — as it always was */
  is('and the store keeps the last of the two, as it always did', await p.evaluate(async () => {
    const disk = (await readAllStores()).tasks.filter(t => t.text.startsWith('twin')); return disk.map(t => t.text); }), ['twin, second copy']);
  await p.evaluate(async () => { S.tasks = S.tasks.filter(t => t.text !== 'twin' && t.text !== 'twin, second copy'); await saveNow(); await flushSave(); });
  is('once the twins are gone, rows are written one by one again', await same(), []);

  console.log('\n4. the add-only guards still hold');
  const r4 = await p.evaluate(async () => {
    S.treePositions = S.treePositions || [];
    const pos = Object.freeze({id: uid(), nodeId: 'n-smoke284', date: today(), statement: 'what I held then', confidence: 60});
    S.treePositions.push(pos); await saveNow(); await flushSave();
    S.treePositions = []; await saveNow(); await flushSave();                     /* try to remove it */
    return S.treePositions.some(x => x.id === pos.id); });
  yes('a saved position cannot be removed', r4);
  is('and disk and app still agree', await same(), []);

  console.log('\n5. nothing broke on the way');
  yes('no page errors, no failed saves', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
