/* smoke285 — pressing a size, a layout or a key several times draws the piece once.

   The claims.

   Drawing a piece again holds the page for as long as it takes, so a redraw is
   asked for and started a moment after the last ask. Pressing "bigger" three
   times in quick succession draws the piece ONCE, at the size the third press
   asked for (each press steps from the one before it, not from what is still on
   the glass). Everyone who asked is answered when that one drawing is done. The
   stage greys and says "engraving…" from the moment of the first press until it
   is done, and not after. A single press still draws once. And opening a piece
   shows the page and its "engraving…" before the engraving begins, rather than
   after it.

   Run: NODE_PATH=node_modules node smoke285.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const bar = n => `<measure number="${n}">${n === 1 ? '<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>' : ''}${
  ['C','D','E','F'].map(s => `<note><pitch><step>${s}</step><octave>${4 + (n % 2)}</octave></pitch><duration>4</duration><type>quarter</type></note>`).join('')}</measure>`;
const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Sixty Bars</work-title></work>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">${Array.from({length: 60}, (_, i) => bar(i + 1)).join('')}</part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1400, height: 950}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); });

  console.log('\n1. opening shows the page before it engraves');
  await p.evaluate(async xml => {
    const lib = await osmdBoot();                      /* compiled already, as it is by the time you choose a piece */
    window.__seq = []; window.__r = 0;
    const proto = lib.OpenSheetMusicDisplay.prototype, f = proto.render;
    proto.render = function(...a){ __r++; __seq.push('render'); return f.apply(this, a); };
    const loop = () => { __seq.push(document.getElementById('scLoading') && !document.querySelector('#scCanvas svg') ? 'frame+loading' : 'frame'); if(__seq.length < 400) requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    const rec = addScore({title: 'Sixty Bars', composer: 'T', musicXml: xml});
    scoreUi().id = rec.id; location.hash = '#/score/' + rec.id; }, XML);
  await p.waitForFunction(() => document.querySelector('#scCanvas svg'), null, {timeout: 60000}); await p.waitForTimeout(600);
  const seq = await p.evaluate(() => window.__seq);
  const firstRender = seq.indexOf('render'), shown = seq.indexOf('frame+loading');
  yes('a frame with "engraving…" on it came before the first engraving', shown !== -1 && shown < firstRender, seq.slice(0, 12));

  console.log('\n2. three quick presses on "bigger" draw once');
  await p.evaluate(() => { window.__r = 0; });
  const z0 = await p.evaluate(() => scores()[0].zoom || 1);
  for(let i = 0; i < 3; i++){ await p.evaluate(() => document.querySelector('[data-sczoom="1"]').click()); await p.waitForTimeout(60); }
  const during = await p.evaluate(() => ({cls: document.getElementById('scStage').classList.contains('sc-engraving'), pill: !!document.querySelector('#scStage > .sc-busy')}));
  yes('the stage says it is engraving as soon as it is pressed', during.cls && during.pill, during);
  await p.waitForFunction(() => !document.getElementById('scStage').classList.contains('sc-engraving'), null, {timeout: 30000});
  await p.waitForTimeout(300);
  is('the piece was drawn once', await p.evaluate(() => window.__r), 1);
  const zs = await p.evaluate(() => ({asked: scores()[0].zoom, drawn: scoreView().osmd.zoom}));
  is('at the size the third press asked for (each stepped from the one before)', zs.asked, Math.round(Math.round(Math.round(z0 * 1.15 * 100) / 100 * 1.15 * 100) / 100 * 1.15 * 100) / 100);
  is('and that is what is drawn', zs.drawn, zs.asked);
  const after = await p.evaluate(() => ({cls: document.getElementById('scStage').classList.contains('sc-engraving'), pill: !!document.querySelector('#scStage > .sc-busy'), say: document.getElementById('scZoomSay')?.textContent}));
  yes('the greying and the label are gone when it is done', !after.cls && !after.pill, after);
  yes('and the size shown is the one drawn', after.say === Math.round(zs.drawn * 100) + '%', after.say);

  console.log('\n3. everyone who asked is answered by the one drawing');
  const r3 = await p.evaluate(async () => { window.__r = 0; const x = scores()[0];
    let done = 0; const a = scoreRedraw(x).then(() => done++), c = scoreRedraw(x).then(() => done++);
    await Promise.all([a, c]); return {renders: window.__r, answered: done}; });
  is('two asks, one drawing, two answers', r3, {renders: 1, answered: 2});

  console.log('\n4. a single press draws once, and a layout change merges too');
  await p.evaluate(() => { window.__r = 0; });
  await p.evaluate(() => document.querySelector('[data-sczoom="-1"]').click());
  await p.waitForFunction(() => !document.getElementById('scStage').classList.contains('sc-engraving'), null, {timeout: 30000}); await p.waitForTimeout(300);
  is('one press, one drawing', await p.evaluate(() => window.__r), 1);
  await p.evaluate(() => { window.__r = 0; });
  for(let i = 0; i < 2; i++){ await p.evaluate(() => document.querySelector('[data-scbpl="1"]')?.click()); await p.waitForTimeout(60); }
  await p.waitForFunction(() => !document.getElementById('scStage').classList.contains('sc-engraving'), null, {timeout: 30000}); await p.waitForTimeout(400);
  yes('two quick presses on bars-per-line: no more than one drawing (plus the fit pass the engraver makes)', await p.evaluate(() => window.__r) <= 2, await p.evaluate(() => window.__r));

  console.log('\n5. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
