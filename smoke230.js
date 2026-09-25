/* smoke230 — the Jazz Studio's band: a rhythm section under every exercise.

   WHAT IS CLAIMED. An exercise's chords are read from the notation its
   generator writes; one that prints none is played over a vamp on its key.
   The bass plays roots, a two-feel (root and mostly the fifth) or a walking
   line (root on one, a half step or a scale step into the next root on four,
   between E1 and G3); the drums swing (ride 1 2& 3 4&, hat foot on 2 and 4,
   a feathered kick), brush a ballad, play a bossa (cross-stick, straight
   eighths) or straight eighths, or rest; the comping is off or a
   Charleston / reverse Charleston in the book's Type A/B voicings, led to
   the nearest shape. Swing loosens past ♩=220. The keys go round the cycle
   of fourths, down in whole steps (Set A then B), up in half steps, at
   random, or only the ones not yet yours, and each chorus is the exercise
   written again in its key. Each exercise starts from its stage's defaults.
   On the page: ▶ Play with band, tempo, swing, count-in, the three
   styles, "hear my part too" with a fade, keys, choruses and reading. While
   it plays the key is shown, "NEXT: F" is called in the last bar, the score
   turns to the next key a bar before the band does, and the page can be
   taken away a step at a time (notation → symbols → key only → nothing).
   The furthest you have got is kept as the exercise's Reading, and the
   log is filled in from the run.

   HOW IT COULD BE WRONG AND STILL PASS. The sound is counted and measured
   offline, not listened to; what a swung ride sounds like is taken on trust.

   Run: NODE_PATH=node_modules node smoke230.js */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1300, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }

  console.log('\n1. the keys, in order');
  const K = await p.evaluate(() => { const st = jazzState(); delete st.progress['2.1'];
    jazzSetKey('2.1', 'C', true); jazzSetKey('2.1', 'F', true);
    const r = jzbKeyOrder('random', 'C', '2.1');
    const out = {fourths: jzbKeyOrder('fourths', 'C'), ab: jzbKeyOrder('whole_steps_AB', 'C'), half: jzbKeyOrder('half_steps', 'Eb'),
      random: r.slice().sort().join() === JAZZ_KEY_NAMES.slice().sort().join(), this: jzbKeyOrder('this', 'A'),
      unmastered: jzbKeyOrder('unmastered', 'C', '2.1')};
    jazzSetKey('2.1', 'C', false); jazzSetKey('2.1', 'F', false); return out; });
  is('the cycle of fourths from C', K.fourths.join(' '), 'C F Bb Eb Ab Db Gb B E A D G');
  is('down in whole steps, Set A then Set B', K.ab.join(' '), 'C Bb Ab Gb E D Db B A G F Eb');
  is('up in half steps from E♭', K.half.join(' '), 'Eb E F Gb G Ab A Bb B C Db D');
  yes('random is all twelve, shuffled; "this key" is one', K.random && K.this.join() === 'A', K);
  is('"only my unmastered keys" leaves out the ones that are yours (C and F here)', K.unmastered.join(' '), 'Bb Eb Ab Db Gb B E A D G');

  console.log('\n2. the chords');
  const C = await p.evaluate(() => {
    const tl = musicXmlTimeline(jzbXml('2.1', 'C'));
    const chart = jzbChart(tl);
    const scale = musicXmlTimeline(jzbXml('5.2', 'Bb'));
    return {chart: chart.map(b => b.changes.map(c => c.sym).join(',')), none: jzbChart(scale),
      vamp: jzbVampSymbol(jazzExercise('5.2'), 'Bb'), vampMaj: jzbVampSymbol({name: 'Major Scale'}, 'D'), vampMin: jzbVampSymbol({name: 'Dorian Pattern'}, 'E')};
  });
  is('ii-V-I in C: Dm7, G7, Cmaj7, a bar each, read off its own notation', C.chart, ['Dmin7', 'G7', 'Cmaj7']);
  yes('a scale prints no chords, and is played over a vamp on its key (the blues scale over B♭7)', C.none === null && C.vamp === 'Bb7', C);
  is('  a major scale over the major seventh, a dorian over the minor', [C.vampMaj, C.vampMin], ['Dmaj7', 'Em7']);

  console.log('\n3. the bass');
  const B = await p.evaluate(() => {
    const bars = jzbChart(musicXmlTimeline(jzbXml('2.1', 'C')));
    const pc = m => ((m % 12) + 12) % 12;
    const roots = jzbBass(bars, 'roots', jzbRand('x'));
    const two = jzbBass(bars, 'two_feel', jzbRand('x'));
    const walk = jzbBass(bars, 'walking', jzbRand('x'));
    /* over many dice, what the second half-note of a chord is */
    const tally = {fifth: 0, third: 0, step: 0, other: 0};
    for(let i = 0; i < 300; i++){ const l = jzbBass(bars, 'two_feel', jzbRand('s' + i));
      const n = l.find(v => v.q === 2), r = pc(l.find(v => v.q === 0).midi), x = (pc(n.midi) - r + 12) % 12, nr = 7;
      if(x === 7) tally.fifth++; else if(x === 3 || x === 4) tally.third++; else if([6, 8].includes(pc(n.midi))) tally.step++; else tally.other++; }
    const walks = [...Array(40)].map((_, i) => jzbBass(bars, 'walking', jzbRand('w' + i)));
    return {roots: roots.map(v => [v.q, pc(v.midi)]), two: two.map(v => [v.q, pc(v.midi)]),
      walkQ: walk.map(v => v.q), walkOnes: walk.filter(v => v.q % 4 === 0).map(v => pc(v.midi)),
      fours: walks.map(l => { const a = l.find(v => v.q === 3).midi, t = l.find(v => v.q === 4).midi; return Math.abs(a - t); }),
      range: walks.flat().every(v => v.midi >= 28 && v.midi <= 55),
      leaps: walks.flat().length ? Math.max(...walks.map(l => Math.max(...l.slice(1).map((v, i) => Math.abs(v.midi - l[i].midi))))) : 99,
      tally};
  });
  is('roots: D, G, C on each bar\'s first beat', B.roots, [[0, 2], [4, 7], [8, 0]]);
  yes('two-feel: half notes, the root on one', B.two.map(v => v[0]).join() === '0,2,4,6,8,10' && B.two[0][1] === 2 && B.two[2][1] === 7 && B.two[4][1] === 0, B.two);
  yes('  and on three mostly the fifth, sometimes the third or a step into the next root', B.tally.fifth > B.tally.third && B.tally.fifth > 150 && B.tally.third > 20 && B.tally.step > 20 && B.tally.other === 0, B.tally);
  yes('walking: a note a beat, the root on every one', B.walkQ.join() === '0,1,2,3,4,5,6,7,8,9,10,11' && B.walkOnes.join() === '2,7,0', B);
  yes('  the fourth beat a half step or a whole step from the next root', B.fours.every(d => d === 1 || d === 2), B.fours);
  yes('  between E1 and G3, and never a leap past a fifth', B.range && B.leaps <= 7, B.leaps);

  console.log('\n4. the drums');
  const D = await p.evaluate(() => {
    const bar = [{i: 0, k: 0, number: 1, q0: 0, len: 4, beats: 4, beatType: 4, changes: [{at: 0, sym: 'C7'}]}];
    const at = (list, midi) => list.filter(v => v.midi === midi).map(v => v.q);
    const sw = jzbDrums(bar, 'swing', () => 0.99), ba = jzbDrums(bar, 'ballad', () => 0.99), bo = jzbDrums(bar.concat([Object.assign({}, bar[0], {i: 1, q0: 4})]), 'bossa', () => 0.99),
      st = jzbDrums(bar, 'straight', () => 0.99);
    return {ride: at(sw, 51), foot: at(sw, 44), kick: sw.filter(v => v.midi === 36).map(v => v.vel <= 0.2), brush: at(ba, 25), bfoot: at(ba, 44),
      cross: at(bo, 37), hats: at(bo, 42).length, sthat: at(st, 42), snare: at(st, 38), skick: at(st, 36), off: jzbDrums(bar, 'off', Math.random).length,
      comp: [...Array(200)].map((_, i) => jzbDrums(bar, 'swing', jzbRand('d' + i)).filter(v => v.midi === 38)).filter(l => l.length).length};
  });
  is('swing: the ride on 1, 2, 2&, 3, 4, 4&', D.ride, [0, 1, 1.5, 2, 3, 3.5]);
  is('  the hi-hat foot on 2 and 4, the kick feathered under all four', [D.foot, D.kick], [[1, 3], [true, true, true, true]]);
  yes('  and now and then a snare off the beat (not every bar)', D.comp > 10 && D.comp < 80, D.comp);
  is('ballad: a brush on every beat, the hat on 2 and 4', [D.brush, D.bfoot], [[0, 1, 2, 3], [1, 3]]);
  yes('bossa: the cross-stick figure over two bars and straight eighths on the hat', D.cross.join() === '0,1.5,3,5,6.5' && D.hats === 16, D);
  is('straight: eighths on the hat, kick on 1 and 3, snare on 2 and 4', [D.sthat, D.skick, D.snare], [[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], [0, 2], [1, 3]]);
  is('  and "off" is silence', D.off, 0);

  console.log('\n5. the comping');
  const P = await p.evaluate(() => {
    const bars = jzbChart(musicXmlTimeline(jzbXml('2.1', 'C')));
    const ch = jzbComp(bars, 'charleston', Math.random), rv = jzbComp(bars, 'reverse_charleston', Math.random);
    const hits = l => [...new Set(l.map(v => v.q))];
    const shape = (list, q, root) => list.filter(v => v.q === q).map(v => v.midi).sort((a, b) => a - b).map(m => m - root);
    const tbl = t => [JZG.VOICING_TYPE_A[t], JZG.VOICING_TYPE_B[t]].map(a => a.slice().sort((x, y) => x - y));
    const fits = (list, q, pc, t) => { const ms = list.filter(v => v.q === q).map(v => v.midi).sort((a, b) => a - b);
      return tbl(t).some(iv => [...Array(8)].some((_, o) => { const root = 24 + pc + 12 * o; return iv.every((x, i) => ms[i] === root + x); })); };
    const v = [0, 4, 8].map(q => ch.filter(e => e.q === q).map(e => e.midi).sort((a, b) => a - b));
    const move = v.slice(1).map((x, i) => x.reduce((a, m, j) => a + Math.abs(m - v[i][j]), 0));
    return {ch: hits(ch), rv: hits(rv), four: [0, 1.5, 4].map(q => ch.filter(e => e.q === q).length),
      A: fits(ch, 0, 2, 'min7') && fits(ch, 4, 7, 'dom7') && fits(ch, 8, 0, 'maj7'), move, off: jzbComp(bars, 'off', Math.random).length};
  });
  is('Charleston: on one and the and of two, every bar', P.ch, [0, 1.5, 4, 5.5, 8, 9.5]);
  is('reverse Charleston: the and of one, and three', P.rv, [0.5, 2, 4.5, 6, 8.5, 10]);
  yes('  four-note Type A/B voicings of Dm7, G7 and Cmaj7, as the book tabulates them', P.A && P.four.every(n => n === 4), P);
  yes('  led to the nearest shape: a ii-V-I moves the hand no more than a few semitones in all', P.move.every(m => m <= 6), P.move);
  is('  and off is off', P.off, 0);
  const SW = await p.evaluate(() => [jzbSwing(0.62, 180), +jzbSwing(0.62, 300).toFixed(3), jzbSwing(0.62, 300) > 0.5]);
  yes('swing loosens past ♩=220: 62:38 at 180, nearer even at 300', SW[0] === 0.62 && SW[1] < 0.6 && SW[2], SW);

  console.log('\n6. the whole performance');
  const T = await p.evaluate(async () => {
    const s = Object.assign(jzbDefaults('2.1'), {bassStyle: 'walking', drumStyle: 'swing', comping: 'charleston', bpm: 200});
    const tl = jazzBackingTimeline({id: '2.1', keys: ['C', 'F'], settings: s});
    const pc = m => ((m % 12) + 12) % 12;
    const mine = c => tl.events.filter(e => e.part === 0 && tl.perf[e.perf].chorus === c).map(e => pc(e.midi));
    const bass0 = c => pc(tl.events.find(e => e.part === 1 && tl.perf[e.perf].chorus === c).midi);
    await instrumentLoad('acoustic_bass');
    const s0 = _instr.stats.sampled;
    const ctx = new OfflineAudioContext(1, 44100 * 4, 44100);
    scorePlayer(tl, {bpm: 200, swing: 0.62}).start(ctx);
    const buf = await ctx.startRendering(); const d = buf.getChannelData(0); let peak = 0; for(let i = 0; i < d.length; i += 5) peak = Math.max(peak, Math.abs(d[i]));
    return {parts: tl.parts.map(p => p.name + ':' + p.inst), choruses: tl.choruses.map(c => c.key + ':' + c.bars), len: tl.length,
      shifted: mine(1).every((x, i) => x === (mine(0)[i] + 5) % 12) && mine(0).length > 0, bass: [bass0(0), bass0(1)],
      kit: tl.events.filter(e => e.part === 2).every(e => e.perc && e.kit), sampled: _instr.stats.sampled - s0, peak: +peak.toFixed(3)};
  });
  is('four parts: your part, the double bass, the kit and the comping piano', T.parts, ['Your part:piano', 'Bass:acoustic_bass', 'Drums:drums', 'Comping:piano']);
  is('  a chorus in C then a chorus in F, three bars each', [T.choruses, T.len], [['C:3', 'F:3'], 24]);
  yes('  your part in F is your part in C a fourth up; the bass starts each on its ii (D, then G)', T.shifted && T.bass.join() === '2,7', T);
  yes('  and it sounds: the bass on the sampled double bass, the whole band audible', T.kit && T.sampled > 8 && T.peak > 0.05, T);
  const DF = await p.evaluate(() => ['2.1', '5.1', '6.1', 'v3-5.904', 'V2.4'].map(id => { const d = jzbDefaults(id); return [id, d.bassStyle, d.drumStyle, d.comping, d.hearMyPart]; }));
  is('each exercise starts from its stage: voicings without comping, a blues walking, a lick with comping, bossa as a bossa, a vocal pattern with comping and its guide',
    DF, [['2.1', 'two_feel', 'swing', 'off', 0], ['5.1', 'walking', 'swing', 'off', 0], ['6.1', 'walking', 'swing', 'charleston', 0],
      ['v3-5.904', 'two_feel', 'bossa', 'off', 0], ['V2.4', 'walking', 'swing', 'charleston', 0.2]]);

  console.log('\n7. on the page');
  await p.evaluate(() => { jazzUi().key = 'C'; location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(3500);
  const U = await p.evaluate(() => { const j = document.getElementById('jzb'); const v = s => (j.querySelector(s) || {}).value;
    return {go: j.querySelector('#jzbGo').textContent, bpm: v('#jzbBpm'), swing: j.querySelector('#jzbSwingV').textContent, bass: v('#jzbBass'), drums: v('#jzbDrums'), comp: v('#jzbComp'),
      hear: [...j.querySelectorAll('#jzbHear option')].map(o => o.textContent).join(), keys: [...j.querySelectorAll('#jzbKeys option')].map(o => o.value).join(),
      chor: v('#jzbChor'), see: [...j.querySelectorAll('#jzbSee option')].map(o => o.textContent).join('|'),
      reading: document.getElementById('jzReading').textContent.replace(/\s+/g, ' ').trim()}; });
  yes('🥁 Play-Along under the score: ▶ Play with band, ♩ = 100, swing 62:38, two-feel bass, swing drums, no comping',
    U.go === '▶ Play with band' && U.bpm === '100' && U.swing === '62:38' && U.bass === 'two_feel' && U.drums === 'swing' && U.comp === 'off', U);
  yes('  hear my part (off to 50%), the six key orders, choruses (∞ by default), and reading in four steps',
    U.hear === 'Off,10%,20%,30%,50%' && U.keys === 'this,fourths,whole_steps_AB,half_steps,random,unmastered' && U.chor === 'infinite'
    && U.see === '📄 full notation|🔤 chord symbols only|🔑 the key name only|🌑 nothing', U);
  is('beside the twelve keys, "Reading" — nothing reached yet', U.reading, 'Reading: 📄 notation ○ → 🔤 symbols ○ → 🔑 key only ○ → 🌑 none ○');
  /* round the fourths, two choruses, fast */
  await p.evaluate(() => { const set = (s, v) => { const e = document.querySelector(s); e.value = v; e.onchange(); };
    set('#jzbBpm', 240); set('#jzbKeys', 'fourths'); set('#jzbChor', '2'); set('#jzbCount', '0'); });
  await p.click('#jzbGo');
  await p.waitForFunction(() => _jzb.run && _jzb.run.player.running, null, {timeout: 20000});
  await p.waitForTimeout(500);
  const R0 = await p.evaluate(() => ({key: document.getElementById('jzbKey').textContent, shown: !document.getElementById('jzbShow').hidden,
    go: document.getElementById('jzbGo').textContent, where: document.getElementById('jzbWhere').textContent, lit: !!document.querySelector('#jzScore > .jzb-hl:not([hidden])')}));
  yes('playing: the key called big over the score, "chorus 1 of 2 · bar 1 of 3", the bar lit, and ■ Stop', R0.shown && R0.key === 'C' && /^chorus 1 of 2 · bar \d of 3$/.test(R0.where) && R0.go === '■ Stop the band' && R0.lit, R0);
  await p.waitForFunction(() => { const n = document.getElementById('jzbNext'); return n && !n.hidden; }, null, {timeout: 10000});
  const R1 = await p.evaluate(() => ({next: document.getElementById('jzbNext').textContent, shownKey: _jzb.run.shownKey, where: document.getElementById('jzbWhere').textContent}));
  yes('in the last bar: "NEXT: F", and the score has already turned to F', R1.next === 'NEXT: F' && R1.shownKey === 'F' && /bar 3 of 3/.test(R1.where), R1);
  await p.waitForFunction(() => document.getElementById('jzbKey').textContent === 'F', null, {timeout: 10000});
  yes('  then the band is in F', true);
  await p.waitForFunction(() => !_jzb.run, null, {timeout: 15000});
  const R2 = await p.evaluate(() => ({last: _jzb.last, best: jazzRecord('2.1').bestReadingLevel, go: document.getElementById('jzbGo').textContent,
    reading: document.getElementById('jzReading').textContent.replace(/\s+/g, ' ').trim(), say: document.getElementById('jzbSay').textContent}));
  yes('two choruses and it stops by itself: C and F covered, read from the notation', R2.last.keys.join() === 'C,F' && R2.last.choruses === 2 && R2.best === 'notation' && R2.go === '▶ Play with band', R2);
  yes('  "Reading: 📄 notation ●" now', /^Reading: 📄 notation ● → 🔤 symbols ○/.test(R2.reading) && /2 choruses · C F/.test(R2.say), R2);
  /* the log knows */
  await p.click('#jzLog'); await p.waitForTimeout(300);
  const LG = await p.evaluate(() => ({to: document.getElementById('jlTo').value, keys: [...document.querySelectorAll('[data-jlk].on')].map(b => b.dataset.jlk),
    style: document.getElementById('jlStyle').value, see: document.getElementById('jlSee').value}));
  is('the log is filled in: ♪ to 240, the keys C and F, the band, the reading', LG, {to: '240', keys: ['C', 'F'], style: 'two-feel bass · swing drums · no comping', see: 'notation'});
  await p.click('#jlSave'); await p.waitForTimeout(300);
  is('  and kept on the sitting', await p.evaluate(() => { const l = jazzRecord('2.1').logs[0]; return [l.backing, l.visibility, l.bpm, l.keys]; }),
    ['two-feel bass · swing drums · no comping', 'notation', 240, ['C', 'F']]);

  console.log('\n8. taking the page away');
  await p.evaluate(() => { const set = (s, v) => { const e = document.querySelector(s); if(e.type === 'checkbox') e.checked = v; else e.value = v; e.onchange(); };
    set('#jzbKeys', 'this'); set('#jzbChor', '2'); set('#jzbSee', 'symbols'); set('#jzbFirst', true); });
  await p.click('#jzbGo');
  await p.waitForFunction(() => _jzb.run && _jzb.run.player.running, null, {timeout: 20000});
  await p.waitForTimeout(400);
  const V0 = await p.evaluate(() => ({hidden: document.querySelector('.jz-stage-box').classList.contains('jzb-hidden'), chord: document.getElementById('jzbChord').textContent}));
  yes('"the notation for the first key": the first chorus is read from the score', !V0.hidden && V0.chord === '', V0);
  await p.waitForFunction(() => _jzb.run && _jzb.run.overall === 1 && document.getElementById('jzbChord').textContent, null, {timeout: 10000});
  const V1 = await p.evaluate(() => ({hidden: document.querySelector('.jz-stage-box').classList.contains('jzb-hidden'), chord: document.getElementById('jzbChord').textContent}));
  yes('  then only the chord symbols, large, and the score gone', V1.hidden && /^(D|G|C)/.test(V1.chord), V1);
  await p.waitForFunction(() => !_jzb.run, null, {timeout: 15000});
  is('  a whole chorus of symbols is kept as the reading reached', await p.evaluate(() => jazzRecord('2.1').bestReadingLevel), 'symbols');
  yes('  and the score is back when it stops', await p.evaluate(() => !document.querySelector('.jz-stage-box').classList.contains('jzb-hidden')));
  await p.evaluate(() => { const set = (s, v) => { const e = document.querySelector(s); if(e.type === 'checkbox') e.checked = v; else e.value = v; e.onchange(); };
    set('#jzbChor', '1'); set('#jzbSee', 'key_only'); set('#jzbFirst', false); set('#jzbHear', '0.2'); set('#jzbFade', true); });
  await p.click('#jzbGo');
  await p.waitForFunction(() => _jzb.run && _jzb.run.player.running, null, {timeout: 20000});
  await p.waitForTimeout(300);
  const V2 = await p.evaluate(() => ({level: document.getElementById('jzbShow').dataset.level, key: document.getElementById('jzbKey').textContent,
    hidden: document.querySelector('.jz-stage-box').classList.contains('jzb-hidden'), vol: _jzb.run.player.opts.volumes[0], muted: [..._jzb.run.player.opts.muted]}));
  yes('"the key name only": C, alone, and your part heard quietly at 20%', V2.level === 'key_only' && V2.key === 'C' && V2.hidden && V2.vol === 0.2 && !V2.muted.includes('p:0'), V2);
  await p.waitForFunction(() => !_jzb.run, null, {timeout: 15000});
  const V3 = await p.evaluate(() => document.getElementById('jzReading').textContent.replace(/\s+/g, ' ').trim());
  is('  Reading: notation ●, symbols ●, key only ●, none ○', V3, 'Reading: 📄 notation ● → 🔤 symbols ● → 🔑 key only ● → 🌑 none ○');
  const KEPT = await p.evaluate(() => jazzRecord('2.1').playAlongSettings);
  yes('the settings are kept with the exercise', KEPT.bpm === 240 && KEPT.visibility === 'key_only' && KEPT.hearMyPart === 0.2 && KEPT.hearFade === true, KEPT);

  console.log('\n9. on a phone');
  await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(600);
  const PH = await p.evaluate(() => ({over: document.documentElement.scrollWidth - innerWidth, w: document.getElementById('jzb').getBoundingClientRect().width}));
  yes('the Play-Along panel fits 390px without scrolling sideways', PH.over <= 1 && PH.w <= 390, PH);

  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
