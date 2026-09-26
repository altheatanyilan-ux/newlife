/* smoke259 — an orchestra that sounds played.

   The claims.

   THE RECORDINGS. The sections, winds and brass are carried at the quality
   the solo strings are (vendor/orchestra-hq): both dynamic layers, 32 kHz,
   five-second notes; with them the short notes each section actually
   played (spiccato, staccato). The thin copies they replace are not
   carried; the pizzicato still is. The soft layer is brought to a fixed
   share of the loud one, so a quiet passage is a quiet recording that can
   still be heard.

   THE PARTS. Once a score is an orchestra, its violin and cello parts are
   the sections — and the soloist stays one violin: named solo, or the one
   unnumbered violin among numbered ones. A string quartet is four players,
   not four sections. A "Contrabass" in an orchestra is bowed. Italian,
   German and French part names are read.

   THE HALL AND THE SEATS. The first violins on the left, the seconds inside
   them, the cellos and basses on the right, the soloist in front; one hall
   for the whole orchestra, fed from each part; a solo piano piece exactly
   as it was (no seat, no hall).

   HOW IT IS PLAYED. pizz. plucks until arco; a staccato or a quick
   unslurred note is played from the short recordings; a slurred run stays
   joined; a hairpin moves the loudness of the notes under it.

   THE MIX. The concerto's tutti fortissimo stays under full scale, and the
   hall rings on after the last note; left and right differ.

   HOW IT COULD BE WRONG AND STILL PASS. Nothing here listens: it counts the
   recordings used and measures the signal. The ear test is the rendering
   (scratch: concerto-before/after.mp3).

   Run: NODE_PATH=node_modules node smoke259.js */
const {chromium} = require('playwright');
const path = require('path');
const {concertoExcerpt} = require('./tests/fixtures/concerto-excerpt.js');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const head = (parts) => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list>${parts.map((n, i) =>
  `<score-part id="P${i + 1}"><part-name>${n[0]}</part-name>${n[1] ? `<midi-instrument id="P${i + 1}-I1"><midi-channel>${i + 1 >= 10 ? i + 2 : i + 1}</midi-channel><midi-program>${n[1]}</midi-program></midi-instrument>` : ''}</score-part>`).join('')}</part-list>`;
const bars = n => `<measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>${n}</step><octave>4</octave></pitch><duration>4</duration></note></measure>`;
const score = parts => head(parts) + parts.map((_, i) => `<part id="P${i + 1}">${bars('CDEFGAB'[i % 7])}</part>`).join('') + '</score-partwise>';
const QUARTET = score([['Violin I', 41], ['Violin II', 41], ['Viola', 42], ['Violoncello', 43]]);
const VIOLIN_CONCERTO = score([['Violin', 41], ['Oboe', 69], ['Horn', 61], ['Violin 1', 41], ['Violin 2', 41], ['Viola', 42], ['Cello', 43], ['Double Bass', 44]]);
const CELLO_CONCERTO = score([['Violoncello solo', 43], ['Flauto', 74], ['Violini I', 41], ['Violini II', 41], ['Viole', 42], ['Violoncelli', 43], ['Contrabbassi', 44]]);
const PIANO = score([['Piano', 1]]);

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await b.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);

  console.log('\n1. the recordings');
  const R = await p.evaluate(() => {
    const m = orchSrc().manifest.instruments;
    const held = ['violins', 'violas', 'celli', 'basses', 'flute', 'oboe', 'clarinet', 'bassoon', 'horn', 'trumpet', 'trombone', 'tuba'];
    const short = ['violins-spic', 'violas-spic', 'celli-spic', 'basses-spic', 'flute-stac', 'oboe-stac', 'clarinet-stac', 'bassoon-stac', 'horn-stac', 'trumpet-stac', 'trombone-stac', 'tuba-stac'];
    return {held: held.filter(id => { const v = m[id + '-hq']; return v && v.layers === (id === 'flute' ? 1 : 2) && v.sampleRate === 32000 && v.length >= 4 && v.sustain; }),
      short: short.filter(id => { const v = m[id + '-hq']; return v && !v.sustain && v.notes.length >= 5; }),
      thin: held.filter(id => m[id]).concat(m['violin-solo'] ? ['violin-solo'] : []),
      pizz: ['violins-pizz', 'violas-pizz', 'celli-pizz', 'bass-pizz'].filter(id => m[id]),
      src: [...new Set(held.map(id => (m[id + '-hq'] || {}).source))]};
  });
  is('twelve held instruments at the solo strings\' quality: two layers (the flute was recorded at one), 32 kHz, notes of four seconds and more', R.held.length, 12);
  is('  with the short notes each one played', R.short.length, 12);
  is('  the thin copies they replace are not carried', R.thin, []);
  is('  the pizzicato still is', R.pizz.length, 4);
  is('  VSCO-2, CC0', R.src, ['VSCO-2 Community Edition, Versilian Studios']);
  const LG = await p.evaluate(async () => { await instrumentsLoad(['violins', 'horn']); return [_orch.sets['violins-hq'].layerGain, _orch.sets['horn-hq'].layerGain]; });
  yes('  a soft layer too quiet to be heard is raised towards its share of the loud (the violins\'), one loud enough is left alone (the horn\'s), never by three times or more',
    LG[0][0] > 1 && LG[0][0] <= 3 && LG[1][0] === 1 && LG.every(g => g[1] === 1), LG);

  console.log('\n2. the parts');
  const M = await p.evaluate(([q, vc, cc, pn]) => [q, vc, cc, pn].map(x => musicXmlTimeline(x).parts.map(t => t.inst + (t.solo ? '*' : ''))), [QUARTET, VIOLIN_CONCERTO, CELLO_CONCERTO, PIANO]);
  is('a string quartet is four players', M[0], ['violin', 'violin', 'viola', 'cello']);
  is('a violin concerto: the unnumbered Violin is the soloist, Violin 1 and 2 the sections, the cello the section, the bass bowed',
    M[1], ['violin*', 'oboe', 'horn', 'violins', 'violins', 'viola', 'celli', 'contrabass']);
  is('a cello concerto, in Italian: "Violoncello solo" the soloist, "Violoncelli" the section, "Contrabbassi" bowed', M[2], ['cello*', 'flute', 'violins', 'violins', 'viola', 'celli', 'contrabass']);
  const N = await p.evaluate(() => ['Violini I', 'Viole', 'Violoncelli', 'Contrabbassi', 'Corni in F', 'Trombe in D', 'Tromboni', 'Flauti', 'Oboi', 'Fagotti',
    'Hörner', 'Violons I', 'Flûte', 'Contrebasses', 'Bassons', 'Cors', 'Trompettes', 'Violoncelle', 'Kontrabässe', 'Ottavino'].map(n => instrumentForName(n)));
  is('  part names in Italian, German, French', N, ['violins', 'viola', 'cello', 'acoustic_bass', 'horn', 'trumpet', 'trombone', 'flute', 'oboe', 'bassoon',
    'horn', 'violins', 'flute', 'acoustic_bass', 'bassoon', 'horn', 'trumpet', 'cello', 'acoustic_bass', 'piccolo']);

  console.log('\n3. the hall and the seats');
  const xml = concertoExcerpt();
  const T = await p.evaluate(xml => { const tl = musicXmlTimeline(xml); const at = n => tl.parts.find(q => q.name === n);
    return {v1: at('Violin I').pan, v2: at('Violin II').pan, vc: at('Violoncello').pan, cb: at('Contrabass').pan, solo: at('Solo Violin').pan,
      halls: tl.parts.map(q => q.hall), trim: [at('Violin I').trim, at('Solo Violin').trim]}; }, xml);
  yes('the first violins on the left, the seconds inside them, the cellos and basses on the right, the soloist in front',
    T.v1 < T.v2 && T.v2 < 0 && T.vc > 0.2 && T.cb > T.vc && Math.abs(T.solo) < 0.15, T);
  yes('  every part sends to the hall', T.halls.every(h => h > 0.15 && h < 0.5), T.halls);
  yes('  each trimmed to its share of the tutti, the soloist less', T.trim[0] < 1 && T.trim[1] > T.trim[0], T.trim);
  const Q = await p.evaluate(x => musicXmlTimeline(x).parts.map(q => [q.pan, q.hall]), QUARTET);
  yes('a quartet is seated too, but closer together', Q[0][0] < 0 && Q[3][0] > 0 && Math.abs(Q[0][0]) < 0.3, Q);
  is('a solo piano piece is as it was: no seat, no hall', await p.evaluate(x => musicXmlTimeline(x).parts.map(q => [q.pan || 0, q.hall || 0]), PIANO), [[0, 0]]);

  console.log('\n4. how it is played');
  const A = await p.evaluate(xml => { const tl = musicXmlTimeline(xml), ev = tl.events;
    const part = n => tl.parts.findIndex(q => q.name === n);
    const bar = (e, k) => e.q >= k * 4 && e.q < (k + 1) * 4;
    const vc = part('Violoncello'), v1 = part('Violin I'), hn = part('Horn in F');
    const horn = ev.filter(e => e.part === hn && e.q < 16).map(e => e.vel);
    return {pizz: [4, 5, 6].map(k => ev.filter(e => e.part === vc && bar(e, k)).every(e => e.pizz)),
      run: ev.filter(e => e.part === v1 && bar(e, 2)).every(e => e.slur), detache: ev.filter(e => e.part === v1 && bar(e, 6)).some(e => e.slur),
      stac: ev.filter(e => e.staccato).length, horn: horn.map(v => +v.toFixed(2))}; }, xml);
  is('pizz. in bars 5 and 6 of the cellos, arco again at bar 7', A.pizz, [true, true, false]);
  yes('the violins\' sixteenths in bar 3 are under a slur; bar 7\'s are not', A.run && !A.detache, A);
  yes('the hairpin in the horn grows through bars 1 to 4', A.horn[0] < A.horn[1] && A.horn[1] < A.horn[2] && A.horn[3] > A.horn[0], A.horn);
  const P = await p.evaluate(async xml => {
    const tl = musicXmlTimeline(xml);
    await instrumentsLoad(tl.parts.map(q => q.inst));
    const sr = 44100, ctx = new OfflineAudioContext(2, sr * 23, sr);
    _instr.stats = {sampled: 0};
    const pl = scorePlayer(tl, {}); pl.start(ctx);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1); let pk = 0, sl = 0, sr2 = 0, slr = 0;
    for(let i = 0; i < L.length; i += 3){ pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); sl += L[i] * L[i]; sr2 += R[i] * R[i]; slr += L[i] * R[i]; }
    const end = pl.length, rms = (a, z) => { let e = 0, n = 0; for(let i = Math.round(a * sr); i < Math.min(L.length, Math.round(z * sr)); i++){ e += L[i] * L[i]; n++; } return Math.sqrt(e / (n || 1)); };
    return {stats: _instr.stats, peak: pk, corr: slr / Math.sqrt(sl * sr2), tail: rms(end + 0.3, end + 1.0), body: rms(end - 3, end - 1)};
  }, xml);
  yes('played: the plucked notes plucked, the short ones from the short recordings, the rest held', P.stats.pizz >= 8 && P.stats.short >= 20 && P.stats.bowed >= 80, P.stats);
  is('  one hall for the whole orchestra', P.stats.halls, 1);
  yes('  the tutti fortissimo stays under full scale', P.peak < 1, P.peak.toFixed(3));
  yes('  and the hall rings on after the last note', P.tail > P.body * 0.04, [P.tail.toFixed(4), P.body.toFixed(4)]);
  yes('  left and right are not the same signal', P.corr < 0.9, P.corr.toFixed(3));

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
