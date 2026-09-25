/* smoke235 — Opening a score is quick, and nothing is done twice.

   WHAT IS CLAIMED. A page is built once per navigation, even on a machine
   slow enough that the crossfade's own callback arrives after the fallback
   timer has already drawn the page (it used to draw it again — a score was
   engraved twice). On such a machine the crossfade is then left off. The
   engraver compiles while the shelf is open, so the press has only the notes
   to draw. The piano does not decode while the notes are being engraved; it
   waits until they are on the screen. The marks and the player come after the
   notes are painted. Coming back to a score you just had open does not
   engrave it again.

   Run: NODE_PATH=node_modules node smoke235.js */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

function xml(bars){
  const steps = ['C','D','E','F','G','A','B'];
  const n = (s, o, d, type, staff, voice, chord) => `<note>${chord ? '<chord/>' : ''}<pitch><step>${s}</step><octave>${o}</octave></pitch><duration>${d}</duration><voice>${voice}</voice><type>${type}</type>${staff ? `<staff>${staff}</staff>` : ''}</note>`;
  let pm = '';
  for(let m = 1; m <= bars; m++){
    let rh = ''; for(let i = 0; i < 8; i++) rh += n(steps[(m + i) % 7], 5, 1, 'eighth', 1, 1);
    let lh = ''; for(let i = 0; i < 4; i++) lh += n('C', 3, 2, 'quarter', 2, 2) + n('E', 3, 2, 'quarter', 2, 2, true);
    const attr = m === 1 ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>` : '';
    pm += `<measure number="${m}">${attr}${rh}<backup><duration>8</duration></backup>${lh}</measure>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Quick Etude</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${pm}</part></score-partwise>`;
}

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1300, height:900}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }

  console.log('\n1. a page is built once');
  /* a crossfade that answers late, as it does on a slow machine */
  const R = await p.evaluate(() => new Promise(res => {
    const real = document.startViewTransition ? document.startViewTransition.bind(document) : null;
    document.startViewTransition = cb => { let skipped = false; setTimeout(() => cb(), 450);
      return {finished: Promise.resolve(), skipTransition(){ skipped = true; }}; };
    let n = 0; const ro = window.renderRoute; window.renderRoute = function(...a){ n++; return ro.apply(this, a); };
    location.hash = '#/values';
    setTimeout(() => { window.renderRoute = ro; if(real) document.startViewTransition = real; res({n, off: _vtOff}); }, 1200);
  }));
  yes('a crossfade that answers after the timer does not build the page a second time', R.n === 1, R);
  yes('  and on such a machine the crossfade is left off for the rest of the visit', R.off === true, R);

  console.log('\n2. the shelf gets the engraver ready');
  const id = await p.evaluate(x => { const s = addScore({title: 'Quick Etude', musicXml: x}); saveNow(); return s.id; }, xml(32));
  const before = await p.evaluate(() => typeof opensheetmusicdisplay !== 'undefined');
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(3500);
  const after = await p.evaluate(() => typeof opensheetmusicdisplay !== 'undefined');
  yes('the engraver compiles while you look at the shelf, before any score is pressed', !before && after, {before, after});

  console.log('\n3. the notes first');
  await p.evaluate(sid => { window._seen = null;
    const mo = new MutationObserver(() => { if(document.querySelector('#scCanvas svg') && !window._seen){
      window._seen = {piano: _grand.state, player: !!(document.querySelector('#scPlayRow .plx-bar') || {})._plx}; } });
    mo.observe(document.body, {childList: true, subtree: true});
    location.hash = '#/score/' + sid; }, id);
  await p.waitForFunction(() => window._seen, null, {timeout: 60000});
  const F = await p.evaluate(() => window._seen);
  yes('when the notes appear the piano has not started decoding, and the player waits its turn', F.piano === 'idle' && !F.player, F);
  await p.waitForFunction(() => { const b = document.querySelector('#scPlayRow .plx-bar'); return b && b._plx; }, null, {timeout: 60000});
  await p.waitForTimeout(2500);
  const G = await p.evaluate(() => ({piano: _grand.state, player: !!document.querySelector('#scPlayRow .plx-bar')._plx}));
  yes('  then the player is ready and the piano is decoding (or done) in the quiet after', G.player && G.piano !== 'idle', G);

  console.log('\n4. coming back to it');
  const renders0 = await p.evaluate(() => { window._renders = 0; const O = opensheetmusicdisplay.OpenSheetMusicDisplay.prototype, r = O.render;
    O.render = function(...a){ window._renders++; return r.apply(this, a); }; return scoreView().reused || 0; });
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(1200);
  await p.evaluate(sid => { location.hash = '#/score/' + sid; }, id);
  await p.waitForFunction(() => document.querySelector('#scCanvas svg') && !document.querySelector('#scLoading'), null, {timeout: 60000});
  await p.waitForTimeout(800);
  const H = await p.evaluate(() => ({renders: window._renders, reused: scoreView().reused || 0,
    bars: [...new Set(measureBoxes().map(m => m.measure))].length, svgs: document.querySelectorAll('#scCanvas svg').length}));
  yes('reopened: the same engraving is put back, not engraved again — and it is all there', H.renders === 0 && H.reused > renders0 && H.bars === 32 && H.svgs >= 1, H);
  await p.evaluate(() => { const x = scores()[0]; x.zoom = 1.2; rerender(); }); await p.waitForTimeout(2500);
  yes('  change how it is drawn and it is engraved again, as it should be', await p.evaluate(() => window._renders > 0));

  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
