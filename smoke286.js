/* smoke286 — the fingering numbers are readable and adjustable, the reading bar
   comes only when sent for, and the click is a click you can hear.

   The claims.

   1. A fingering is a dark-blue number about the size an edition prints
      (a staff space and a quarter, not the six pixels it used to be), and it
      can be made smaller or bigger from the layer's own control — in the
      toolbar and in the reading strip, only while the fingering layer is on.
      The size is one setting for the room, kept across a reload, and changing
      it does not engrave the piece again.

   2. In reading mode the top bar is away. Turning the page — by a press in
      the outer thirds, by a key, by a swipe — never brings it, and it never
      puts itself away or comes back by itself. A press on the very top edge
      of the page brings it, and it stays until a press anywhere else on the
      page; that press does nothing but put it away (no page turn, no note
      opened). Using the bar does not close it, and neither does the page
      being drawn again. Leaving and coming back finds it away again.

   3. The metronome's click, and the player's, which is the same sound:
      measured at the output, an ordinary beat peaks around -8 dBFS and the
      downbeat around -4 at the default volume (it used to be about -34 and
      -29), the volume scales it, full volume does not clip, and every beat of
      the same kind is the same sound.

   Run: NODE_PATH=node_modules node smoke286.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const bar = n => `<measure number="${n}">${n === 1 ? '<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>' : ''}${
  ['C','D','E','F'].map(s => `<note><pitch><step>${s}</step><octave>${4 + (n % 2)}</octave></pitch><duration>4</duration><type>quarter</type></note>`).join('')}</measure>`;
const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Long Line</work-title></work>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">${Array.from({length: 420}, (_, i) => bar(i + 1)).join('')}</part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required']});
  const ctx = await b.newContext({viewport: {width: 1400, height: 950}});
  /* the audio that reaches the speakers, watched: anything connected to the
     destination is also fed to an analyser */
  await ctx.addInitScript(() => {
    const real = AudioNode.prototype.connect;
    window.__taps = [];
    AudioNode.prototype.connect = function(dest, ...rest){
      try {
        if(dest instanceof AudioDestinationNode && this.context && !this.context.__tap){
          const an = this.context.createAnalyser(); an.fftSize = 8192;
          real.call(this, an); this.context.__tap = an; window.__taps.push(an);
        } else if(dest instanceof AudioDestinationNode && this.context && this.context.__tap) real.call(this, this.context.__tap);
      } catch(e){}
      return real.call(this, dest, ...rest);
    };
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove());
    window.__toasts = []; const t = window.toast; window.toast = function(m, ...a){ window.__toasts.push(String(m)); return t.call(this, m, ...a); }; });

  /* ---------------- 1. fingering numbers ---------------- */
  console.log('\n1. fingering numbers: dark blue, the size of an edition’s, adjustable');
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'long.musicxml')); }, XML);
  await p.waitForFunction(() => document.querySelector('#scCanvas svg'), null, {timeout: 120000});
  await p.waitForTimeout(1200);
  /* count engravings from here on */
  await p.evaluate(async () => { const lib = await osmdBoot(); const proto = lib.OpenSheetMusicDisplay.prototype, f = proto.render;
    window.__r = 0; proto.render = function(...a){ window.__r++; return f.apply(this, a); }; });
  const set = await p.evaluate(() => { const x = scores().find(s => s.title === 'Long Line');
    const sv = scoreView(), on = sv && sv.page ? sv.at : null;
    const notes = scoreNotes().filter(n => n.midi != null && (on === null || n.page === on));
    const keys = scoreFingerKeys(notes); x.fingerings = x.fingerings || {};
    [...keys.values()].slice(0, 6).forEach((k, i) => { x.fingerings[k] = {hand: i % 2 ? 'L' : 'R', finger: 1 + (i % 5)}; });
    x.overlays.fingerings = false; scoreLayersPaint(x); rerender(); return Object.keys(x.fingerings).length; });
  await p.waitForTimeout(1500);
  yes('six fingerings set on the page', set === 6, set);
  const vis = sel => p.evaluate(s => [...document.querySelectorAll(s)].map(n => !n.hidden && getComputedStyle(n).display !== 'none'), sel);
  /* the toolbar's second row is behind "more" */
  await p.evaluate(() => { if(!scoreUi().more){ scoreUi().more = true; rerender(); } });
  await p.waitForTimeout(1200);
  yes('the size control is away while the layer is off', (await vis('[data-scfsize]')).every(v => !v), await vis('[data-scfsize]'));
  await p.evaluate(() => document.querySelector('.sc-bar2 [data-sclayer="fingerings"]').click()); await p.waitForTimeout(500);
  yes('  and there once it is on', (await vis('.sc-bar2 [data-scfsize]')).length >= 1 && (await vis('.sc-bar2 [data-scfsize]')).every(v => v), await vis('[data-scfsize]'));
  const look = () => p.evaluate(() => { const n = document.querySelector('.sc-fing'); if(!n) return null;
    const cs = getComputedStyle(n), u = scoreUnitPx();
    return {rgb: cs.color, px: parseFloat(cs.fontSize), u, count: document.querySelectorAll('.sc-fing').length,
      top: parseFloat(n.style.top), weight: cs.fontWeight}; });
  const l0 = await look();
  yes('the six numbers are drawn', l0 && l0.count === 6, l0);
  const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(l0.rgb) || [];
  const [r0, g0, b0] = [+m[1], +m[2], +m[3]];
  yes('they are dark blue: blue leads, and nothing in it is light', b0 > r0 + 40 && b0 > g0 + 30 && r0 < 80 && g0 < 90 && b0 < 170, l0.rgb);
  yes('they are about a staff space and a quarter, not the six pixels they were', l0.px >= l0.u * 1.1 && l0.px <= l0.u * 1.4 && l0.px >= 11, `${l0.px}px at ${l0.u}px to a space`);
  yes('  and bold, so they hold against a beam', +l0.weight >= 600, l0.weight);
  yes('the layer’s button says the same blue (light enough to read on the dark room)', await p.evaluate(() => {
    const c = getComputedStyle(document.querySelector('.sc-bar2 [data-sclayer="fingerings"]')).getPropertyValue('--c').trim();
    return /^#[0-9a-f]{6}$/i.test(c); }));
  is('the room starts at a hundred per cent', await p.evaluate(() => document.querySelector('[data-scfssay]').textContent), '100%');

  await p.evaluate(() => { window.__r = 0; });
  await p.evaluate(() => document.querySelector('.sc-bar2 [data-scfs="1"]').click()); await p.waitForTimeout(300);
  const l1 = await look();
  is('bigger: the readout steps', await p.evaluate(() => document.querySelector('[data-scfssay]').textContent), '120%');
  yes('  the numbers grow by that much', Math.abs(l1.px / l0.px - 1.2) < 0.03, `${l0.px} -> ${l1.px}`);
  yes('  and sit further from the head as they grow (a right-hand number is above it)', l1.top < l0.top, `${l0.top} -> ${l1.top}`);
  is('  one setting for the room, written down', await p.evaluate(() => S.settings.fingerScale), 1.2);
  is('  and the piece was not engraved again', await p.evaluate(() => window.__r), 0);
  for(let i = 0; i < 3; i++) await p.evaluate(() => document.querySelector('.sc-bar2 [data-scfs="1"]').click());
  const l4 = await look();
  yes('more presses, bigger still', l4.px > l1.px * 1.5, `${l1.px} -> ${l4.px}`);
  for(let i = 0; i < 12; i++) await p.evaluate(() => { const b = document.querySelector('.sc-bar2 [data-scfs="1"]'); if(b && !b.disabled) b.click(); });
  is('the top of the ladder is three hundred per cent, and “+” stops there', await p.evaluate(() => ({say: document.querySelector('[data-scfssay]').textContent, off: document.querySelector('.sc-bar2 [data-scfs="1"]').disabled})), {say: '300%', off: true});
  for(let i = 0; i < 12; i++) await p.evaluate(() => { const b = document.querySelector('.sc-bar2 [data-scfs="-1"]'); if(b && !b.disabled) b.click(); });
  is('the bottom is sixty, and “−” stops there', await p.evaluate(() => ({say: document.querySelector('[data-scfssay]').textContent, off: document.querySelector('.sc-bar2 [data-scfs="-1"]').disabled})), {say: '60%', off: true});
  const small = await look();
  yes('  at sixty the numbers are still readable (eight pixels at least)', small.px >= 8, small.px);
  for(let i = 0; i < 4; i++) await p.evaluate(() => document.querySelector('.sc-bar2 [data-scfs="1"]').click());
  const back = await p.evaluate(() => S.settings.fingerScale);
  await p.evaluate(async () => { await saveNow(); await flushSave(); });
  await p.reload(); await p.waitForTimeout(2200);
  is('after a reload the size is still what it was', await p.evaluate(() => S.settings.fingerScale), back);
  await p.evaluate(async () => { await flushSave(); });

  /* ---------------- 2. the reading bar ---------------- */
  console.log('\n2. reading: the top bar comes only when sent for');
  await p.evaluate(() => { closeModals(); document.querySelectorAll('.overlay,.toast').forEach(n => n.remove());
    window.__toasts = []; const t = window.toast; window.toast = function(m, ...a){ window.__toasts.push(String(m)); return t.call(this, m, ...a); };
    document.documentElement.requestFullscreen = () => Promise.resolve(); });
  await p.evaluate(id => { location.hash = '#/score/' + id; }, await p.evaluate(() => scores().find(s => s.title === 'Long Line').id));
  await p.waitForFunction(() => document.querySelector('#scCanvas svg'), null, {timeout: 120000}); await p.waitForTimeout(1500);
  await p.evaluate(() => { const x = scores().find(s => s.title === 'Long Line'); x.overlays.fingerings = false; });
  await p.evaluate(() => document.querySelector('#scRead').click()); await p.waitForTimeout(2500);
  const strip = () => p.evaluate(() => { const s = document.getElementById('scStrip'), cs = s && getComputedStyle(s);
    return {up: !document.documentElement.classList.contains('sc-quiet'), opacity: cs ? +cs.opacity : null, hit: cs ? cs.pointerEvents : null,
      reading: scoreUi().reading, at: (() => { const sv = scoreView(); return sv && sv.page ? sv.at : null; })()}; });
  const geo = () => p.evaluate(() => { const r = document.getElementById('scStage').getBoundingClientRect(), c = document.getElementById('scCanvas').getBoundingClientRect();
    const sv = scoreView(), on = sv && sv.page ? sv.at : null;
    return {l: r.left, t: r.top, w: r.width, h: r.height, cl: c.left, ct: c.top, at: on, pages: sv && sv.pages ? (sv.pages.length || sv.pages) : 0,
      notes: scoreNotes().filter(n => n.midi != null && (on === null || n.page === on)).map(n => ({x: n.x, y: n.y}))}; });
  let g = await geo(), s = await strip();
  yes('reading, a page at a time, with pages enough to turn (seven or more)', s.reading && g.at === 0 && g.pages >= 7, {s, g: {at: g.at, pages: g.pages}});
  yes('the bar is away as it opens, and cannot be pressed', !s.up && s.opacity === 0 && s.hit === 'none', s);
  yes('  once, you are told where it is', await p.evaluate(() => window.__toasts.some(t => /very top of the page/i.test(t))));
  /* the page turn, three ways */
  await p.mouse.click(g.l + g.w * 0.9, g.t + g.h * 0.5); await p.waitForTimeout(500);
  s = await strip();
  is('a press in the right third turns the page', s.at, 1);
  yes('  and the bar stays away', !s.up && s.opacity === 0, s);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400); s = await strip();
  yes('a key turns it too, and the bar stays away', s.at === 2 && !s.up && s.opacity === 0, s);
  await p.keyboard.press('Shift'); await p.mouse.move(600, 400); await p.waitForTimeout(300);
  yes('a press of Shift or a drift of the pointer is nothing to it', !(await strip()).up);
  await p.evaluate(() => { const st = document.getElementById('scStage'), r = st.getBoundingClientRect();
    st.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, clientX: r.left + 700, clientY: r.top + 400}));
    st.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, clientX: r.left + 300, clientY: r.top + 410})); });
  await p.waitForTimeout(400); s = await strip();
  yes('a swipe turns it, and the bar stays away', s.at === 3 && !s.up, s);
  await p.waitForTimeout(4600);
  yes('and it does not come by itself, however long', !(await strip()).up);
  yes('no mark on the top line: nothing is drawn over the page', await p.evaluate(() => {
    const s = document.getElementById('scStrip'); const cs = getComputedStyle(s); return +cs.opacity === 0 && cs.pointerEvents === 'none'; }));

  /* a press just below the top edge, in the middle, is nothing */
  await p.mouse.click(g.l + g.w * 0.5, g.t + 70); await p.waitForTimeout(400);
  yes('a press in the middle, below the top edge, does nothing', !(await strip()).up && (await strip()).at === 3);
  /* the top edge */
  await p.mouse.click(g.l + g.w * 0.5, g.t + 12); await p.waitForTimeout(500); s = await strip();
  yes('a press on the very top edge brings the bar', s.up && s.opacity === 1 && s.hit !== 'none', s);
  is('  without turning the page', s.at, 3);
  await p.waitForTimeout(5200);
  yes('  and it stays, however long you leave it', (await strip()).up);
  /* the right-hand top corner is in an outer third, where a press turns the page: it brings the bar and does not turn */
  await p.mouse.click(g.l + g.w * 0.5, g.t + 300);          /* any press on the page closes it ... */
  await p.waitForTimeout(500); s = await strip();
  yes('a press elsewhere on the page puts it away', !s.up && s.opacity === 0, s);
  is('  and spends itself on that: the page does not turn', s.at, 3);
  await p.mouse.click(g.l + g.w * 0.93, g.t + 14); await p.waitForTimeout(500); s = await strip();
  yes('the top edge brings it even in an outer third', s.up && s.at === 3, s);
  await p.mouse.click(g.l + g.w * 0.93, g.t + g.h * 0.5); await p.waitForTimeout(500); s = await strip();
  yes('and a press in an outer third, with it up, only puts it away', !s.up && s.at === 3, s);
  await p.mouse.click(g.l + g.w * 0.93, g.t + g.h * 0.5); await p.waitForTimeout(500);
  is('the next press there turns the page again', (await strip()).at, 4);

  /* using the bar does not close it, nor does the page being drawn again */
  await p.mouse.click(g.l + g.w * 0.5, g.t + 10); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#scStrip [data-sclayer="degrees"]').click()); await p.waitForTimeout(500);
  yes('a press on the bar leaves it up', (await strip()).up);
  await p.evaluate(() => document.querySelector('#scStrip [data-sclayer="degrees"]').click());
  await p.evaluate(() => rerender()); await p.waitForTimeout(1800);
  yes('and so does the page being drawn again', (await strip()).up && (await strip()).opacity === 1, await strip());
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
  yes('a key turns the page under it and leaves it up', (await strip()).up && (await strip()).at === 5, await strip());
  /* the size control is in the strip too, only while the layer is on */
  yes('the size of the fingering numbers is in the bar once the layer is on', await p.evaluate(() => {
    const ctl = document.querySelector('#scStrip [data-scfsize]'); const off = ctl.hidden;
    document.querySelector('#scStrip [data-sclayer="fingerings"]').click();
    return off && !ctl.hidden && !!document.querySelector('#scStrip [data-scfs="1"]'); }));
  const before = await p.evaluate(() => S.settings.fingerScale);
  await p.evaluate(() => document.querySelector('#scStrip [data-scfs="1"]').click()); await p.waitForTimeout(300);
  yes('  and it sets the same size', await p.evaluate(b4 => S.settings.fingerScale > b4, before), before);
  yes('  with the bar still up', (await strip()).up);
  await p.evaluate(() => document.querySelector('#scHide').click()); await p.waitForTimeout(400);
  yes('the chevron puts it away', !(await strip()).up);

  /* a note on an outer third, with the bar up: the press only closes the bar */
  g = await geo();
  await p.evaluate(() => { const x = scores().find(s => s.title === 'Long Line'); x.overlays.fingerings = true; scoreLayersPaint(x); });
  g = await geo();
  const rel = n => (g.cl + n.x - g.l) / g.w;
  const edge = g.notes.filter(n => (rel(n) > 0.76 || rel(n) < 0.24) && g.ct + n.y - g.t > 80)[0];
  yes('there is a note in an outer third', !!edge);
  await p.mouse.click(g.l + g.w * 0.5, g.t + 10); await p.waitForTimeout(400);
  await p.mouse.click(g.cl + edge.x, g.ct + edge.y); await p.waitForTimeout(500); s = await strip();
  yes('with the bar up, a press on that note puts the bar away and nothing else', !s.up && s.at === 5 && !(await p.$('.sc-fingpick')), s);
  await p.mouse.click(g.cl + edge.x, g.ct + edge.y); await p.waitForTimeout(500);
  yes('the next press on it fingers it, as before', !!(await p.$('.sc-fingpick')) && (await strip()).at === 5);
  await p.evaluate(() => document.querySelectorAll('.sc-fingpick').forEach(n => n.remove()));

  /* leaving, and coming back */
  await p.mouse.click(g.l + g.w * 0.5, g.t + 10); await p.waitForTimeout(400);
  yes('up again', (await strip()).up);
  await p.evaluate(() => document.querySelector('#scUnread').click()); await p.waitForTimeout(1500);
  is('leaving puts the room back, with no class left on the page', await p.evaluate(() => ({reading: scoreUi().reading, quiet: document.documentElement.classList.contains('sc-quiet'), cls: document.documentElement.classList.contains('sc-reading')})), {reading: false, quiet: false, cls: false});
  await p.evaluate(() => { window.__toasts.length = 0; document.querySelector('#scRead').click(); }); await p.waitForTimeout(2200);
  yes('coming back finds the bar away', !(await strip()).up, await strip());
  is('  and the hint is not said twice in one visit', await p.evaluate(() => window.__toasts.filter(t => /very top of the page/i.test(t)).length), 0);
  await p.evaluate(() => document.documentElement.classList.contains('sc-reading') && setScoreReading(false)); await p.waitForTimeout(800);

  /* ---------------- 3. the click ---------------- */
  console.log('\n3. the click is a click you can hear');
  const peaks = await p.evaluate(async () => {
    const render = async (fn) => { const oc = new OfflineAudioContext(1, 48000 * 0.2, 48000); fn(oc); const res = await oc.startRendering(); return res.getChannelData(0).slice(); };
    const peak = a => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    const voice = (strong, level) => render(oc => scoreClickVoice(oc, oc.destination, 0.01, strong, level));
    const wS = await voice(true, ScoreMetronome.volume), wW = await voice(false, ScoreMetronome.volume);
    const wS2 = await voice(true, ScoreMetronome.volume);
    const half = await voice(true, ScoreMetronome.volume / 2), full = await voice(true, 1), fullW = await voice(false, 1);
    const pl = await render(oc => plxClick(oc, oc.destination, 0.01, true));
    const plW = await render(oc => plxClick(oc, oc.destination, 0.01, false));
    return {def: ScoreMetronome.volume, strong: peak(wS), weak: peak(wW), half: peak(half), full: peak(full), fullWeak: peak(fullW),
      same: wS.every((v, i) => v === wS2[i]), player: peak(pl), playerWeak: peak(plW)}; });
  is('the metronome’s own default volume is seventy per cent', peaks.def, 0.7);
  yes('an ordinary beat peaks between 0.25 and 0.6 of full scale (it was 0.02)', peaks.weak > 0.25 && peaks.weak < 0.6, peaks.weak);
  yes('the downbeat peaks between 0.4 and 0.85 (it was 0.04), and is the louder', peaks.strong > 0.4 && peaks.strong < 0.85 && peaks.strong > peaks.weak, peaks);
  yes('half the volume is about half the click', peaks.half / peaks.strong > 0.4 && peaks.half / peaks.strong < 0.6, peaks.half / peaks.strong);
  yes('full volume does not clip', peaks.full <= 0.99 && peaks.fullWeak <= 0.99 && peaks.full > 0.7, peaks);
  yes('every downbeat is the same sound, to the sample', peaks.same);
  yes('the player’s click and count-in are that same sound, at that same loudness', Math.abs(peaks.player - peaks.strong) < 1e-6 && Math.abs(peaks.playerWeak - peaks.weak) < 1e-6, peaks);

  /* and at the speakers, the real thing running */
  const live = await p.evaluate(async () => {
    ScoreMetronome.setBpm(240); ScoreMetronome.setPerBar(4); ScoreMetronome.setAccent(true);
    const beats = []; const off = ScoreMetronome.onBeat(e => beats.push(e.strong));
    ScoreMetronome.start();
    let top = 0;
    const buf = new Float32Array(8192);
    const until = performance.now() + 1700;
    while(performance.now() < until){
      await new Promise(r => setTimeout(r, 50));
      (window.__taps || []).forEach(an => { an.getFloatTimeDomainData(buf); for(const v of buf) top = Math.max(top, Math.abs(v)); });
    }
    ScoreMetronome.stop(); off();
    return {beats: beats.length, strongs: beats.filter(Boolean).length, top, taps: (window.__taps || []).length}; });
  yes('the running metronome clicked in time (about four beats a second)', live.beats >= 4, live);
  yes('and what reached the speakers is a real signal, well above where it was', live.top > 0.3 && live.top <= 1, live);

  console.log('\n4. nothing broke on the way');
  yes('no page errors', !errs.length, errs.join(' | '));
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
