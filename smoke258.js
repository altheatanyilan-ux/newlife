/* smoke258 — the partner cue, reading.

   The claims.

   A SWITCH ON THE READING STRIP. A score with more than one part carries a
   "partner cue" button on the reading strip. Pressed, the parts heard and not
   on the page (the partner) run small along the bottom of the glass, with
   the bar being played lit; pressed again, they go. Reading keeps its own
   answer, remembered with the piece: until it is pressed it does what the
   room's tick does, and pressing it never changes the room's tick.

   THE PAGE MAKES ROOM. The page is laid out in what is left above the cue,
   so no line of music goes under it; the strip, which comes down from the
   top, never lies over the cue.

   NO PARTNER, NO CUE. With every part on the page there is nobody to cue:
   the button says how to make one (take a part off the page) and shows
   nothing. A piece with one part has no button.

   Run: NODE_PATH=node_modules node smoke258.js */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(process.env.SMOKE_DIR || __dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const note = (step, oct, dur) => `<note><pitch><step>${step}</step><octave>${oct}</octave></pitch><duration>${dur}</duration><voice>1</voice></note>`;
const head = (title, parts) => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>${title}</work-title></work><part-list>${parts}</part-list>`;
const attrs = clef => `<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time>${clef}</attributes>`;
const G = '<clef><sign>G</sign><line>2</line></clef>', F = '<clef><sign>F</sign><line>4</line></clef>';
const tempo = bpm => `<direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`;
const bars = (n, fn) => [...Array(n)].map((_, i) => `<measure number="${i + 1}">${fn(i + 1)}</measure>`).join('');
const steps = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const DUET = head('Sonata for Two', `<score-part id="P1"><part-name>Violin</part-name><midi-instrument id="P1-I1"><midi-program>41</midi-program></midi-instrument></score-part>
  <score-part id="P2"><part-name>Piano</part-name><midi-instrument id="P2-I1"><midi-program>1</midi-program></midi-instrument></score-part>`)
  + `<part id="P1">${bars(48, n => (n === 1 ? attrs(G) + tempo(200) : '') + [0, 1, 2, 3].map(k => note(steps[(n + k) % 7], 5, 1)).join(''))}</part>`
  + `<part id="P2">${bars(48, n => (n === 1 ? attrs(F) : '') + note(steps[n % 7], 3, 2) + note(steps[(n + 2) % 7], 3, 2))}</part></score-partwise>`;
const SOLO = head('Air', `<score-part id="P1"><part-name>Piano</part-name></score-part>`)
  + `<part id="P1">${bars(4, n => (n === 1 ? attrs(G) + tempo(90) : '') + note('E', 4, 4))}</part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const run = async (w, h) => {
    const ctx = await b.newContext({viewport: {width: w, height: h}});
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await p.goto(FILE); await p.waitForTimeout(1200);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }
    return {ctx, p};
  };
  const {ctx, p} = await run(1280, 900);
  const take = (xml, name) => p.evaluate(async ([xml, name]) => (await takeScoreFile(new File([xml], name))).id, [xml, name]);
  const ids = {duet: await take(DUET, 'Sonata for Two.musicxml'), solo: await take(SOLO, 'Air.musicxml')};
  const open = async id => { await p.evaluate(id => { const u = scoreUi(); u.focus = null; u.reading = false; u.ensOpen = true; location.hash = '#/score/' + id; }, id); await p.waitForTimeout(3000); };
  const read = async on => { await p.evaluate(on => setScoreReading(on), on); await p.waitForTimeout(2500); };
  const press = async () => { await p.evaluate(() => document.getElementById('scCueRead').click()); await p.waitForTimeout(2600); };
  const look = () => p.evaluate(id => {
    const c = document.getElementById('scCue'), st = document.getElementById('scStage'), btn = document.getElementById('scCueRead');
    const cr = c.getBoundingClientRect(), sr = st.getBoundingClientRect(), svg = document.querySelector('#scCanvas svg');
    const e = scoreById(id).ensembleSettings;
    return {shown: !c.hidden && cr.height > 0, drawn: !!c.querySelector('.sc-cue-in svg'), name: (c.querySelector('[data-cuename]') || {}).textContent,
      btn: btn ? {on: btn.classList.contains('on'), pressed: btn.getAttribute('aria-pressed'), title: btn.title} : null,
      cueTop: Math.round(cr.top), cueBottom: Math.round(cr.bottom), stageBottom: Math.round(sr.bottom), stageH: Math.round(sr.height),
      pageBottom: svg ? Math.round(svg.getBoundingClientRect().bottom) : null, vh: innerHeight,
      readCue: e.readCue, room: e.showCueStrip, stripBottom: document.getElementById('scStrip') ? Math.round(document.getElementById('scStrip').getBoundingClientRect().bottom) : null};
  }, ids.duet);

  console.log('\n1. a switch on the reading strip');
  await open(ids.duet);
  await p.click('[data-enspreset="0"]'); await p.waitForTimeout(1500);
  is('"I\'m Violin": the piano is the partner, off the page', await p.evaluate(id => { const x = scoreById(id); return ensembleRoles(x, ensTimeline(x)); }, ids.duet), ['mine', 'partner']);
  await read(true);
  const R0 = await look();
  yes('reading, a "partner cue" button on the strip, off to begin with (the room\'s tick is off)',
    R0.btn && !R0.btn.on && R0.btn.pressed === 'false' && !R0.shown && R0.readCue === null, R0);
  yes('  and the page has the whole glass', R0.stageH >= R0.vh - 2, R0);
  await press();
  const R1 = await look();
  await p.screenshot({path: path.join(process.env.SHOTS || require('os').tmpdir(), 'smoke258-desk.png')}).catch(() => {});
  yes('pressed: the piano, drawn small, along the bottom of the glass', R1.shown && R1.drawn && R1.name === 'Piano' && R1.cueBottom === R1.vh && R1.btn.on && R1.btn.pressed === 'true', R1);
  yes('  the page is laid out above it: the stage ends where the cue begins, the music inside the stage',
    R1.stageBottom <= R1.cueTop + 1 && R1.pageBottom != null && R1.pageBottom <= R1.stageBottom + 1, R1);
  yes('  the strip, at the top, does not lie over it', R1.stripBottom < R1.cueTop, R1);
  is('  remembered with the piece, as reading\'s own answer; the room\'s tick untouched', [R1.readCue, R1.room], [true, false]);
  const pl = await p.evaluate(() => { const b = document.querySelector('#scStrip .plx-bar'); b._plx.play(); return true; });
  await p.waitForTimeout(2500);
  const L = await p.evaluate(() => { const h = document.querySelector('#scCue .sc-cue-in > .plx-hl'); return {lit: !!h && !h.hidden, left: h ? parseFloat(h.style.left) : null}; });
  yes('  playing, the bar being played is lit in the cue too', pl && L.lit && L.left >= 0, L);
  await p.evaluate(() => document.querySelector('#scStrip .plx-bar')._plx.stop());
  await press();
  const R2 = await look();
  yes('pressed again: gone, and the page has the whole glass back', !R2.shown && !R2.btn.on && R2.stageH >= R2.vh - 2 && R2.readCue === false, R2);

  console.log('\n2. reading keeps its own answer');
  await read(false);
  await p.click('[data-enscue]'); await p.waitForTimeout(2500);
  const M0 = await look();
  yes('in the room the tick shows it above the score', M0.shown && M0.room === true, M0);
  await read(true);
  const M1 = await look();
  yes('  reading, still hidden, because hidden is what reading was last told', !M1.shown && M1.readCue === false, M1);
  await p.reload(); await p.waitForTimeout(1500);
  const kept = await p.evaluate(id => { const e = scoreById(id).ensembleSettings; return [e.readCue, e.showCueStrip]; }, ids.duet);
  is('  both answers survive a reload', kept, [false, true]);
  await p.evaluate(id => { scoreById(id).ensembleSettings.readCue = null; }, ids.duet);
  await open(ids.duet); await read(true);
  const M2 = await look();
  yes('  never pressed, reading does what the room does (the tick on: shown)', M2.shown && M2.btn.on, M2);

  console.log('\n3. no partner, no cue');
  await p.evaluate(() => document.querySelector('[data-scrpart="1"]').click()); await p.waitForTimeout(3000);
  const N0 = await look();
  yes('with the piano back on the page there is nobody to cue: nothing along the bottom, the button says how to make a partner',
    !N0.shown && !N0.btn.on && /no partner yet/.test(N0.btn.title) && N0.stageH >= N0.vh - 2, N0);
  await p.evaluate(() => document.getElementById('scCueRead').click()); await p.waitForTimeout(500);
  const T = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
  yes('  pressed, it says so rather than doing nothing', /No partner yet/.test(T), T);
  await p.evaluate(() => document.querySelector('[data-scrpart="1"]').click()); await p.waitForTimeout(3000);
  const N1 = await look();
  yes('  take the piano off the page again, and its cue is back', N1.shown && N1.name === 'Piano', N1);
  await read(false); await open(ids.solo); await read(true);
  is('a piece with one part has no button', await p.evaluate(() => !!document.getElementById('scCueRead')), false);
  await read(false);

  console.log('\n4. on a phone');
  await p.setViewportSize({width: 390, height: 844});
  await p.evaluate(id => { scoreById(id).ensembleSettings.readCue = true; }, ids.duet);
  await open(ids.duet); await read(true);
  const PH = await look();
  const sw = await p.evaluate(() => [document.documentElement.scrollWidth, Math.round(document.getElementById('scCue').getBoundingClientRect().width)]);
  await p.screenshot({path: path.join(process.env.SHOTS || require('os').tmpdir(), 'smoke258-phone.png')}).catch(() => {});
  yes('  and the phone\'s tab bar is not on the glass to cover it', await p.evaluate(() => { const n = document.querySelector('.mobile-nav'); return !n || getComputedStyle(n).display === 'none'; }));
  yes('at 390px the cue spans the width, nothing scrolls sideways, the page ends above it',
    PH.shown && sw[1] === 390 && sw[0] <= 390 && PH.stageBottom <= PH.cueTop + 1 && PH.pageBottom <= PH.stageBottom + 1, [PH, sw]);
  await ctx.close();

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
