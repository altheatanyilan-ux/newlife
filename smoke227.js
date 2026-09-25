/* smoke227 — a metronome that can leave beat 1 alone.

   WHAT IS CLAIMED. A piece's metronome accents beat 1 (a fifth higher and
   louder) unless you switch the accent off, and then every beat is the same
   click. It is one setting for the piece, kept with it: set beside the
   metronome (in the toolbar and on the reading strip) or in the play bar's
   options, and it governs every click the piece gets — the metronome, and
   the play bar's click and count-in. The dot that pulses with the beat
   follows it too. Another piece keeps its own.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const piece = title => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>${title}</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${
  [1, 2, 3, 4].map(n => `<measure number="${n}">${n === 1 ? '<attributes><divisions>1</divisions><time><beats>3</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>' : ''}${
    ['C', 'E', 'G'].map(s => `<note><pitch><step>${s}</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>`).join('')}</measure>`).join('')}</part></score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1300, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const ids = await p.evaluate(async xs => { const out = [];
    for(const x of xs) out.push((await takeScoreFile(new File([x.xml], x.name))).id); return out; },
    [{xml: piece('Waltz One'), name: 'Waltz One.musicxml'}, {xml: piece('Waltz Two'), name: 'Waltz Two.musicxml'}]);
  await p.evaluate(id => { scoreUi().more = true; scoreUi().focus = null; location.hash = '#/score/' + id; }, ids[0]); await p.waitForTimeout(4000);
  /* the beats the metronome books, and whether each is the strong one */
  const listen = () => p.evaluate(async () => {
    const got = []; const off = ScoreMetronome.onBeat(e => got.push(e.strong));
    document.querySelector('#scMetro').click();
    await new Promise(r => setTimeout(r, 1700));
    document.querySelector('#scMetro').click(); off();
    return got; });
  await p.evaluate(() => { const x = scoreById(scoreUi().id); x.metronome.bpm = 240; document.querySelector('#scBpmIn').value = 240; document.querySelector('#scBpmIn').dispatchEvent(new Event('change')); });

  console.log('\n1. the metronome');
  const B = await p.evaluate(() => ({text: document.querySelector('[data-scaccent]').textContent.trim(), pressed: document.querySelector('[data-scaccent]').getAttribute('aria-pressed')}));
  is('beside the metronome: "beat 1 accented", on to begin with', [B.text, B.pressed], ['beat 1 accented', 'true']);
  const on = await listen();
  yes('  so in three-four, every third click is the strong one', on.length >= 5 && on.every((s, i) => s === (i % 3 === 0)), on);
  await p.click('[data-scaccent]'); await p.waitForTimeout(200);
  const B2 = await p.evaluate(() => ({text: document.querySelector('[data-scaccent]').textContent.trim(), pressed: document.querySelector('[data-scaccent]').getAttribute('aria-pressed'),
    kept: scoreById(scoreUi().id).metronome.accent}));
  is('switched off, it says "every beat the same", and the piece keeps that', [B2.text, B2.pressed, B2.kept], ['every beat the same', 'false', false]);
  const off = await listen();
  yes('  and every click is the same click', off.length >= 5 && off.every(s => s === false), off);

  console.log('\n2. the play bar\'s click and count-in follow it');
  const clicks = async () => p.evaluate(async () => {
    const seen = []; const was = plxClick;
    plxClick = (ctx, dest, t, accent) => { seen.push(!!accent); return was(ctx, dest, t, accent); };
    try {
      const x = scoreById(scoreUi().id);
      const tl = musicXmlTimeline(scoreXmlFor(x));
      const ctx = new OfflineAudioContext(1, 44100 * 4, 44100);
      scorePlayer(tl, {bpm: 180, click: true, countIn: true, accent: x.metronome.accent !== false}).start(ctx);
      await ctx.startRendering();
    } finally { plxClick = was; }
    return seen; });
  await p.click('#scPlayRow [data-plxmore]'); await p.waitForTimeout(200);
  const P1 = await p.evaluate(() => document.querySelector('#scPlayRow [data-plxaccent]').textContent.trim());
  is('the play bar\'s options show the same setting', P1, 'every beat the same');
  const c0 = await clicks();
  yes('  with the accent off, no click in the count-in or the bars is accented', c0.length > 6 && c0.every(a => a === false), c0);
  await p.click('#scPlayRow [data-plxaccent]'); await p.waitForTimeout(200);
  const P2 = await p.evaluate(() => ({bar: document.querySelector('#scPlayRow [data-plxaccent]').textContent.trim(),
    metro: document.querySelector('[data-scaccent]').textContent.trim(), kept: scoreById(scoreUi().id).metronome.accent, live: ScoreMetronome.accent}));
  is('switching it back on in the play bar switches the metronome\'s back on too', [P2.bar, P2.metro, P2.kept, P2.live], ['beat 1 accented', 'beat 1 accented', true, true]);
  const c1 = await clicks();
  yes('  and then beat 1 of the count-in and of every bar is accented', c1.length > 6 && c1[0] === true && c1.filter(a => a).length >= 3 && c1.some(a => !a), c1);
  /* while it plays */
  await p.selectOption('#scPlayRow [data-plxclick]', 'beats');
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(1500);
  await p.click('[data-scaccent]'); await p.waitForTimeout(300);
  is('changed while the piece plays, the click that is playing hears it', await p.evaluate(() => _plxNow && _plxNow.player && _plxNow.player.opts.accent), false);
  await p.evaluate(() => scorePlayStopAll());

  console.log('\n3. kept with the piece, and only that piece');
  /* a reload forgets the room's own state, the open "more" row with it */
  await p.evaluate(async () => { await saveNow(); await load(); scoreUi().more = true; });
  await p.evaluate(id => { location.hash = '#/score/' + id; }, ids[1]); await p.waitForTimeout(3500);
  const other = await p.evaluate(() => ({text: document.querySelector('[data-scaccent]').textContent.trim(), kept: scoreById(scoreUi().id).metronome.accent}));
  is('another piece keeps its own (accented)', [other.text, other.kept], ['beat 1 accented', true]);
  await p.evaluate(id => { location.hash = '#/score/' + id; }, ids[0]); await p.waitForTimeout(3500);
  const back = await p.evaluate(() => ({text: document.querySelector('[data-scaccent]').textContent.trim(), kept: scoreById(scoreUi().id).metronome.accent}));
  is('the first still has every beat the same, after a reload', [back.text, back.kept], ['every beat the same', false]);
  const again = await listen();
  yes('  and its metronome still clicks every beat the same', again.length >= 5 && again.every(s => s === false), again);

  console.log('\n4. reading the score');
  await p.click('#scRead'); await p.waitForTimeout(1500);
  yes('the reading strip carries the setting too', await p.evaluate(() => { const b = document.querySelector('#scStrip [data-scaccent]'); return !!b && b.textContent.trim() === 'every beat the same'; }));
  await p.evaluate(() => { document.querySelector('#scStrip [data-scaccent]').click(); });
  await p.waitForTimeout(200);
  is('  and works from there', await p.evaluate(() => scoreById(scoreUi().id).metronome.accent), true);
  await p.evaluate(() => { const u = document.querySelector('#scUnread'); if(u) u.click(); });

  is('no page errors', errs, []);
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
