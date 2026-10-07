/* smoke283 — saving keeps working, and a note can be fingered in read mode.

   The claims.

   1. Saving. Every store the save pass writes has a table to be written to.
      Once the blocks of a planned day had no table, the first block ever
      written made EVERY save in the app fail ("Saving failed…") — a fingering
      picked on a score was kept until the page was reloaded and then gone.
      Now a block saves, an unrelated change after it saves, both survive a
      reload, and nothing says saving failed. A store that somehow has no
      table is left out and said once, and everything else still saves. The
      message, when a save really does fail, is said once and not on every
      change after it.

   2. Read mode. With the fingering layer on, a press near a note head is for
      that note — also in the outer thirds of the page, which turn it. A press
      on nothing in the outer third still turns the page.

   Run: NODE_PATH=node_modules node smoke283.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

/* two hundred bars of a line, enough to be several pages in reading mode */
const bar = n => `<measure number="${n}">${n === 1 ? '<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>' : ''}${
  ['C','D','E','F'].map((s, i) => `<note><pitch><step>${s}</step><octave>${4 + (n % 2)}</octave></pitch><duration>4</duration><type>quarter</type></note>`).join('')}</measure>`;
const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Long Line</work-title></work>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">${Array.from({length: 200}, (_, i) => bar(i + 1)).join('')}</part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 950}})).newPage();
  const errs = [], failures = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(/save failed/i.test(m.text())) failures.push(m.text().slice(0, 200)); });
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove());
    window.__toasts = []; const t = window.toast; window.toast = function(m, ...a){ window.__toasts.push(String(m)); return t.call(this, m, ...a); }; });

  console.log('\n1. every saved store has a table');
  is('no store the save pass writes is missing its table', await p.evaluate(() => ARRAY_STORES.filter(k => !db[k])), []);
  const r = await p.evaluate(async () => {
    S.timeBlocks = S.timeBlocks || []; S.timeBlocks.push({id: uid(), date: today(), start: '09:00', end: '10:00', kind: 'label', label: 'practice'});
    await saveNow(); await flushSave();
    const afterBlock = window.__toasts.slice(); window.__toasts.length = 0;
    S.settings.__smoke283 = 'after the block'; await saveNow(); await flushSave();
    return {afterBlock, afterChange: window.__toasts.slice()}; });
  is('a time block saves without a complaint', r.afterBlock, []);
  is('and so does an unrelated change after it', r.afterChange, []);
  await p.reload(); await p.waitForTimeout(2200);
  is('both are there after a reload', await p.evaluate(() => [(S.timeBlocks || []).length, S.settings.__smoke283]), [1, 'after the block']);

  console.log('\n2. a store with no table does not stop the rest from saving');
  await p.evaluate(() => { window.__toasts = []; const t = window.toast; window.toast = function(m, ...a){ window.__toasts.push(String(m)); return t.call(this, m, ...a); }; });
  const r2 = await p.evaluate(async () => {
    const real = db.timeBlocks; db.timeBlocks = undefined;       /* as if it were never given a table */
    S.timeBlocks = S.timeBlocks || []; S.timeBlocks.push({id: uid(), date: today(), start: '11:00', end: '12:00', kind: 'label', label: 'unwritable'});
    S.settings.__smoke283b = 'still saved'; await saveNow(); await flushSave();
    db.timeBlocks = real; return window.__toasts.slice(); });
  is('no failure is shown', r2, []);
  await p.reload(); await p.waitForTimeout(2200);
  is('the other change was kept', await p.evaluate(() => S.settings.__smoke283b), 'still saved');

  console.log('\n3. a real failure is said once, with its reason');
  const r3 = await p.evaluate(async () => {
    window.__toasts = []; const t = window.toast; window.toast = function(m, ...a){ window.__toasts.push(String(m)); return t.call(this, m, ...a); };
    const real = db.transaction; db.transaction = async () => { const e = new Error('disk full'); e.name = 'QuotaExceededError'; throw e; };
    for(let i = 0; i < 3; i++){ S.settings.__smoke283c = i; await saveNow(); await flushSave(); }
    const during = window.__toasts.slice();
    db.transaction = real; S.settings.__smoke283c = 99; await saveNow(); await flushSave();
    S.settings.__smoke283c = 100; db.transaction = async () => { throw new Error('again'); }; await saveNow(); await flushSave();
    db.transaction = real; return {during, after: window.__toasts.slice()}; });
  is('three failures in a row say it once', r3.during.length, 1);
  yes('  and name what went wrong', /QuotaExceededError/.test(r3.during[0] || ''), r3.during[0]);
  is('after a save that works, the next failure is said again', r3.after.length, 2);

  console.log('\n4. read mode: a note takes a fingering, even where the page turns');
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'long.musicxml')); }, XML);
  await p.waitForFunction(() => document.querySelector('#scCanvas svg, #scStage svg'), null, {timeout: 120000}).catch(() => {});
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('#scRead')?.click()); await p.waitForTimeout(1500);
  await p.evaluate(() => { const x = scores().find(s => s.title === 'Long Line'); x.overlays.fingerings = true; scoreLayersPaint(x); });
  await p.waitForTimeout(300);
  const geo = () => p.evaluate(() => {
    const stage = document.getElementById('scStage').getBoundingClientRect(), cv = document.getElementById('scCanvas').getBoundingClientRect();
    const sv = scoreView(); const on = sv && sv.page ? sv.at : null;
    const notes = scoreNotes().filter(n => n.midi != null && (on === null || n.page === on));
    return {at: on, paged: !!(sv && sv.page), pages: sv && sv.pages ? (sv.pages.length || sv.pages) : 0, stage: {l: stage.left, w: stage.width, t: stage.top, h: stage.height}, cv: {l: cv.left, t: cv.top},
      notes: notes.map(n => ({x: n.x, y: n.y}))}; });
  let g = await geo();
  yes('it is reading, one page at a time, with more than one page', g.paged && g.at === 0 && g.pages > 1, g);
  const rel = n => (g.cv.l + n.x - g.stage.l) / g.stage.w;
  const edge = g.notes.filter(n => rel(n) > 0.74 || rel(n) < 0.26)[0];
  yes('there is a note in an outer third of the page', !!edge);
  await p.evaluate(() => { window.__toasts.length = 0; });
  await p.mouse.click(g.cv.l + edge.x, g.cv.t + edge.y); await p.waitForTimeout(500);
  const afterNote = await geo();
  is('pressing it does not turn the page', afterNote.at, 0);
  yes('  and the fingering picker opens for it', !!(await p.$('.sc-fingpick')));
  await p.click('.sc-fingpick [data-fing="R2"]'); await p.waitForTimeout(900);
  is('  and the finger is kept', await p.evaluate(() => Object.values(scores().find(s => s.title === 'Long Line').fingerings || {})), [{hand: 'R', finger: 2}]);
  is('  with nothing saying saving failed', await p.evaluate(() => window.__toasts.filter(t => /saving failed/i.test(t)).length), 0);
  /* a press on nothing in the right-hand third still turns the page */
  g = await geo();
  const blank = (() => { for(let fx = 0.78; fx < 0.98; fx += 0.03) for(let fy = 0.05; fy < 0.95; fy += 0.05){
      const px = fx * g.stage.w - (g.cv.l - g.stage.l), py = fy * g.stage.h - (g.cv.t - g.stage.t);
      if(!g.notes.some(n => Math.hypot(n.x - px, n.y - py) < 60)) return {x: g.stage.l + fx * g.stage.w, y: g.stage.t + fy * g.stage.h}; } return null; })();
  yes('there is empty space in the right-hand third', !!blank);
  await p.evaluate(() => document.querySelectorAll('.sc-fingpick').forEach(n => n.remove()));
  await p.mouse.click(blank.x, blank.y); await p.waitForTimeout(500);
  is('a press on nothing there turns the page', (await geo()).at, 1);

  console.log('\n5. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
