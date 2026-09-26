/* smoke238 — the Songwriting Studio.

   WHAT IS CLAIMED. A new room, next to the Jazz Studio: first-visit setup
   (the vocal range, when you write); Today (the morning page, the next
   exercise, the warm-up); The Path — eleven stages and the capstone, every
   exercise with its source, an output that is saved with versions, a
   self-check, a reflection, a harvest to the Seedbank; the Object Writing
   Desk with its hard stop and the 42-day ring; the Chord Lab playing a
   progression through the groove engine (fifty-five styles, swing,
   anticipation, rhythmic level, voicings, bass generators, MIDI with chords
   on 1, bass on 2, drums on 10); the Groove Maker; the Chord-Scale Map
   choosing a scale by quality AND function; the Melody Generator (seeded,
   rule-bound, every note explained, locks, a lyric's stresses on strong
   beats); the Lyric Sheet's measured checks; the Rhyme Workbench; songs on
   the Song Desk with the Rewrite Room; the Songbook; voice memos kept on
   this device only. The data is one versioned object, migrated without
   loss. Nothing is fetched from the network; the other rooms still open;
   nothing overflows a phone.

   HOW IT COULD BE WRONG AND STILL PASS. Sound is counted as events booked,
   not listened to.

   Run: NODE_PATH=node_modules node smoke238.js */
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
  const errs = [], net = [];
  const ctx = await b.newContext({viewport:{width:1300, height:950}, acceptDownloads: true});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource|ERR_NAME|ERR_INTERNET/.test(m.text())) errs.push('console: ' + m.text()); });
  p.on('request', r => { const u = r.url(); if(/^https?:/.test(u) && !/fonts\.(googleapis|gstatic)\.com/.test(u)) net.push(u); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(650); };

  console.log('\n1. the room and what it keeps');
  const N = await p.evaluate(() => { const create = navConfig().create; return {create, link: !!document.querySelector('#sidebar a[href="#/songwriting"]')}; });
  yes('a door in the sidebar, under Create, after the Jazz Studio', N.link && N.create.indexOf('songwriting') === N.create.indexOf('jazz') + 1, N.create);
  const N2 = await p.evaluate(() => { const keep = S.settings.nav; S.settings.nav = {create: ['content', 'projects', 'jazz', 'japanese'], identity: ['values'], standalone: []};
    const n = navConfig(); const out = n.create.slice(); S.settings.nav = keep; navConfig(); return out; });
  yes('  a sidebar arranged before the room existed gets it in the same place, not in a loose pile', N2.indexOf('songwriting') === N2.indexOf('jazz') + 1, N2);
  const M = await p.evaluate(() => {
    /* the prototype's localStorage shape, with a field this build does not know */
    const old = {profile: {lowNote: 'A2', highNote: 'E4', onboarded: true, owDates: ['2026-01-01', '2026-01-02']}, outputs: {'0.1': {text: {'Lowest comfortable note': 'A2'}, savedAt: '2026-01-01T10:00:00Z'}},
      seeds: [{id: 's1', content: 'rust on the gate', type: 'image'}], songs: [{id: 'x', title: 'Old song'}], badges: [], mystery: {keep: 'me'}};
    const m = sngMigrate(JSON.parse(JSON.stringify(old)));
    return {v: m.v, ow: m.owDates, out: m.outputs['0.1'].text, versions: m.outputs['0.1'].versions, seeds: m.seeds.length, song: m.songs[0].title, sections: m.songs[0].sections, mystery: m.mystery,
      meta: META_KEYS.includes('songwriting'), binary: BINARY_STORES.includes('sngAudio'), dbv: db.verno || (db._version)};
  });
  is('an older shape is migrated forward without losing a field: outputs, seeds, songs, the ring, even a field it does not know',
    [M.v, M.ow, M.out, M.versions, M.seeds, M.song, M.sections, M.mystery], [1, ['2026-01-01', '2026-01-02'], {'Lowest comfortable note': 'A2'}, [], 1, 'Old song', [], {keep: 'me'}]);
  yes('  saved with the house (a meta row); voice memos in a store of their own, left out of backups', M.meta && M.binary, M);

  console.log('\n2. first visit, and Today');
  await go('#/songwriting');
  yes('the first visit asks for the vocal range and when you write', !!(await p.$('#sngLow')) && !!(await p.$('input[name="sngWhen"]')));
  await p.fill('#sngLow', 'G2'); await p.fill('#sngHigh', 'D4'); await p.click('#sngGo'); await p.waitForTimeout(600);
  const T = await p.evaluate(() => ({prof: sngState().profile, tabs: [...document.querySelectorAll('[data-sngtab]')].map(b => b.textContent.trim()),
    morning: !!document.querySelector('.sng-morning'), next: (document.querySelector('.sng-next b') || {}).textContent, warm: !!document.querySelector('[data-sngrotd]')}));
  is('  it keeps them', [T.prof.lowNote, T.prof.highNote, T.prof.onboarded], ['G2', 'D4', true]);
  yes(`Today: the morning page, the next exercise ("${T.next}"), the warm-up; six tabs`, T.morning && /0\.1/.test(T.next) && T.warm && T.tabs.length === 6, T);

  console.log('\n3. The Path');
  const P = await p.evaluate(() => ({stages: SNG_STAGES.length, ex: SNG_STAGES.reduce((a, s) => a + s.exercises.length, 0), src: SNG_STAGES.every(s => s.exercises.every(e => e.source && e.purpose && (e.instructions || []).length)),
    e616: !!sngExercise('6.16'), e109: !!sngExercise('10.9'), tools: [...new Set(SNG_STAGES.flatMap(s => s.exercises.map(e => e.toolLink)).filter(Boolean))].filter(t => !SNG_TOOL_VIEWS[t])}));
  yes(`${P.stages} stages, ${P.ex} exercises, every one with its source, purpose and instructions`, P.stages === 11 && P.ex >= 131 && P.src, P);
  yes('  with the two the brief adds: 6.16 Generate, Sing, Rewrite and 10.9 Chord-Scale Map: Improvise, Then Write', P.e616 && P.e109);
  is('  and every tool an exercise sends you to exists', P.tools, []);
  await go('#/songwriting/path');
  yes('the Path draws each stage as a room (and the capstone)', (await p.$$('.sng-room')).length === 12);
  await go('#/songwriting/ex/0.3');
  await p.fill('[data-sngfield="Object writing output"]', 'Rain on the tin roof, a cold coin in the mouth, the smell of wet dog.');
  await p.click('#sngSaveEx'); await p.waitForTimeout(500);
  await p.fill('[data-sngfield="Object writing output"]', 'Second go: the puddle holds a whole sky, cracked by a bicycle.');
  await p.click('#sngSelf'); await p.fill('#sngReflect', 'smell was hardest'); await p.click('#sngSaveEx'); await p.waitForTimeout(500);
  const E = await p.evaluate(() => { const o = sngState().outputs['0.3']; return {text: o.text['Object writing output'], versions: o.versions.length, self: o.selfCheck, refl: o.reflection, restore: document.querySelectorAll('[data-sngrestore]').length}; });
  yes('an exercise saves its output, keeps the earlier version, the self-check and the reflection', /Second go/.test(E.text) && E.versions === 1 && E.self && E.refl === 'smell was hardest' && E.restore === 1, E);
  await p.evaluate(() => { const t = document.querySelector('[data-sngfield="Object writing output"]'); t.focus(); t.setSelectionRange(10, 32); });
  await p.evaluate(() => { const t = document.querySelector('[data-sngfield="Object writing output"]'); const r = document.createRange(); window.getSelection().removeAllRanges(); });
  await p.click('#sngHarvest'); await p.waitForTimeout(300);
  yes('  and Harvest puts a line of it in the Seedbank', await p.evaluate(() => sngState().seeds.some(s => /puddle|Second go/.test(s.content))));

  console.log('\n4. the Object Writing Desk');
  await go('#/songwriting/tool/object-writing');
  await p.evaluate(() => { sngUi().owSecs = 2; }); await p.evaluate(() => rerender()); await p.waitForTimeout(300);
  await p.click('#sngOwGo'); await p.waitForTimeout(400);
  await p.keyboard.type('the lantern hums');
  const before = await p.evaluate(() => document.getElementById('sngOwPage').readOnly);
  await p.waitForTimeout(2600);
  const O = await p.evaluate(() => ({ro: document.getElementById('sngOwPage').readOnly, text: document.getElementById('sngOwPage').value, days: sngState().owDates.length, today: sngState().owDates.includes(today())}));
  yes('writing is open while the timer runs, and the page stops taking words when it ends — the hard stop', !before && O.ro && /lantern/.test(O.text), O);
  yes('  the day is marked on the 42-day ring', O.today && O.days >= 1, O);

  console.log('\n5. the groove engine and the Chord Lab');
  const G = await p.evaluate(() => {
    const chords = ['ii7', 'V7', 'Imaj7', 'Imaj7'].map(sngParseRoman);
    const ev = (id, extra) => sngGrooveEvents(Object.assign({chords, keyPc: 0, style: SNG_STYLES.find(s => s.id === id), bassGen: 'style'}, extra || {}), 0, 4);
    const sig = e => e.map(x => `${x.kind}:${x.voice || x.midi}@${x.t}`).join(',');
    const ids = SNG_STYLES.map(s => s.id), sigs = new Set(ids.map(id => sig(ev(id))));
    const need = ['jazz-swing4', 'jazz-charleston', 'jazz-rev-charleston', 'jazz-anticipation', 'jazz-twofeel', 'jazz-stride', 'jazz-ballad', 'jazz-waltz', 'jazz-bossa', 'brazil-bossa', 'brazil-partido', 'brazil-baiao',
      'latin-montuno23', 'latin-montuno32', 'latin-salsa', 'latin-chacha', 'latin-bolero', 'latin-habanera', 'latin-cumbia', 'latin-reggaeton', 'carib-reggae', 'carib-ska', 'carib-calypso', 'afro-afrobeat', 'world-6-8'];
    const fields = SNG_STYLES.every(s => s.name && s.family && s.timeSig && s.bpmRange && s.mood && s.feel && s.tryFor && s.voicingDefault && typeof s.anticipation === 'boolean');
    const S = SNG_STYLES.find(s => s.id === 'pop-ballad');
    const hits = o => ev('pop-drive', o).filter(x => x.kind === 'chord').length;
    const bass = g => sig(ev('pop-drive', {bassGen: g}).filter(x => x.kind === 'bass'));
    const bassSigs = new Set(SNG_BASS_GENS.map(([g]) => bass(g)));
    const walk = ev('pop-drive', {bassGen: 'walking'}).filter(x => x.kind === 'bass');
    const firstOf = (e, bar) => e.filter(x => x.kind === 'chord' && x.t >= bar * 16 - 3 && x.t <= bar * 16).map(x => x.t)[0];
    const aE = ev('pop-drive', {anticipation: true}), pE = ev('pop-drive', {anticipation: false});
    const antic = [firstOf(aE, 1)], plain = [firstOf(pE, 1)];
    const kits = {samba: ev('brazil-samba').filter(x => x.voice === 'surdo').length, ballad: ev('jazz-ballad').filter(x => x.voice === 'brush').length};
    const swung = [sngSwungStep(2, 0.66, S), sngSwungStep(2, 0, S)];
    const bars = {w: sngBarSteps(SNG_STYLES.find(s => s.id === 'jazz-waltz')), six: sngBarSteps(SNG_STYLES.find(s => s.id === 'world-6-8')), twelve: sngBarSteps(SNG_STYLES.find(s => s.id === 'rock-12-8')),
      two: sngPatternBars(SNG_STYLES.find(s => s.id === 'latin-montuno23'))};
    const midi = sngMidiFile({chords, keyPc: 0, style: SNG_STYLES.find(s => s.id === 'jazz-swing4'), bpm: 120, swing: 0.62}, 4);
    const chans = new Set(); for(let i = 0; i < midi.length - 2; i++) if((midi[i] & 0xf0) === 0x90 && midi[i + 1] < 128 && midi[i + 2] < 128 && midi[i + 2] > 0) chans.add(midi[i] & 0x0f);
    return {n: ids.length, distinct: sigs.size, missing: need.filter(x => !ids.includes(x)), fields, thin: hits({level: 'thin'}), normal: hits({}), thick: hits({level: 'thick'}), bassN: bassSigs.size, walkN: walk.length,
      antic: [antic[0], plain[0]], kits, swung, bars, midiHead: String.fromCharCode(...midi.slice(0, 4)), tracks: midi[11], chans: [...chans].sort((a, c) => a - c)};
  });
  yes(`${G.n} styles, every one sounding different (${G.distinct} distinct patterns), every field the brief names`, G.n >= 55 && G.distinct === G.n && G.fields, G);
  is('  the jazz comping, Latin, Brazilian, Caribbean and African styles the brief lists are all there', G.missing, []);
  yes(`  rhythmic level: thinner ${G.thin} < as written ${G.normal} < thicker ${G.thick} chord hits`, G.thin < G.normal && G.normal < G.thick, G);
  yes(`  ${G.bassN} bass generators, each a different line; walking is a note a beat (${G.walkN} in four bars)`, G.bassN === 9 && G.walkN === 16, G);
  yes('  anticipation moves the last hit of the bar earlier, onto the next chord', G.antic[0] < G.antic[1], G.antic);
  yes('  a samba\'s kick is a surdo, a jazz ballad\'s snare is brushes', G.kits.samba > 0 && G.kits.ballad > 0, G.kits);
  yes(`  swing moves the off-beat eighth late (${G.swung[0].toFixed(2)} instead of 2)`, G.swung[0] > 2.5 && G.swung[1] === 2, G.swung);
  is('  3/4 bars are 12 steps, 6/8 12, 12/8 24; a clave pattern is two bars', [G.bars.w, G.bars.six, G.bars.twelve, G.bars.two], [12, 12, 24, 2]);
  is('  MIDI: a Standard MIDI File with a tempo track and three more — chords on channel 1, bass on 2, drums on 10', [G.midiHead, G.tracks, G.chans], ['MThd', 4, [0, 1, 9]]);
  await go('#/songwriting/tool/chord-lab');
  await p.click('#labClear'); await p.waitForTimeout(300);
  for(const r of ['I', 'vi', 'IV', 'V']) { await p.click(`[data-labadd="${r}"]`); await p.waitForTimeout(150); }
  await p.click('#labPlay'); await p.waitForTimeout(1500);
  const L = await p.evaluate(() => ({prog: sngState().lab.prog, running: !!(_sngLab && _sngLab.running), now: !!document.querySelector('.sng-bar.now'), lane: [...document.querySelectorAll('.sng-lane-c')].map(x => x.textContent.trim())}));
  yes(`the Chord Lab builds I–vi–IV–V from the palette and plays it, the bar lit as it sounds`, L.prog.join() === 'I,vi,IV,V' && L.running && L.now, L);
  yes(`  the Scale Lane names each chord's scale in context (${L.lane.join(' · ')})`, L.lane.length === 4 && /Lydian/.test(L.lane[2]), L.lane);
  await p.click('[data-labstyle="brazil-bossa"]'); await p.waitForTimeout(700);
  yes('  a new style is picked up while it plays (groove swap)', await p.evaluate(() => !!(_sngLab && _sngLab.running && _sngLab.opts.style.id === 'brazil-bossa')));
  await p.click('#labPlay'); await p.waitForTimeout(200);
  await p.click('#labSix'); await p.waitForTimeout(400);
  await p.fill('[data-sixnote="pop-ballad"]', 'tender, a slow dance'); await p.dispatchEvent('[data-sixnote="pop-ballad"]', 'change');
  await p.click('#sixSave'); await p.waitForTimeout(300);
  yes('"Same chords, six grooves" saves its notes into exercise 2.10', await p.evaluate(() => /tender, a slow dance/.test(JSON.stringify((sngState().outputs['2.10'] || {}).text || {}))));
  await p.click('#labSaveGroove'); await p.waitForTimeout(800);
  const GM = await p.evaluate(() => ({hash: location.hash, n: sngState().grooves.length, steps: document.querySelectorAll('.sng-step').length}));
  yes('"Save as my groove" opens it in the Groove Maker as a step grid', /groove-maker/.test(GM.hash) && GM.n >= 1 && GM.steps > 40, GM);
  const GR = await p.evaluate(() => { const g = sngState().grooves[0]; const a = sngGmGrid(Object.assign({}, g, {repeat: 'exact'})), v = sngGmGrid(Object.assign({}, g, {repeat: 'varied'})), s = sngGmGrid(Object.assign({}, g, {repeat: 'second'}));
    return {exact: a.chord.length, varied: v.chord.length, second: JSON.stringify(s.chord) !== JSON.stringify(v.chord)}; });
  yes('  repeated exactly, varied, or with a second motive', GR.varied === GR.exact * 2 && GR.second, GR);

  console.log('\n6. the Chord-Scale Map');
  const C = await p.evaluate(() => { const f = (r, next, colour, blues) => sngScalesFor(sngParseRoman(r), {keyPc: 0, colour: colour || 'major', next: next ? sngParseRoman(next) : null, blues}).scales.map(s => s.id);
    return {I: f('Imaj7'), IV: f('IVmaj7'), V_I: f('V7', 'Imaj7'), V_i: f('V7', 'i', 'minor'), bVII7: f('♭VII7', 'I'), ii: f('ii7', 'V7'), iii: f('iii7'), vi: f('vi7'), half: f('iiø7', 'V7', 'minor'), dim: f('vii°7'),
      blues: f('IV7', 'I7', 'blues', true), sus: f('V7sus4'), mm: f('iMaj7', null, 'minor'), roles: sngScaleRoles(sngParseRoman('Imaj7'), SNG_SCALES.ionian).map(x => x.role).join(','),
      gt: sngGuideTones(['ii7', 'V7', 'Imaj7'].map(sngParseRoman), 0).map(g => g.midi)}; });
  is('by quality and function: I Ionian, IV Lydian, V→I Mixolydian (altered for tension), V→i Phrygian dominant, ♭VII7 Lydian dominant',
    [C.I[0], C.IV[0], C.V_I[0], C.V_I.includes('altered'), C.V_i[0], C.bVII7[0]], ['ionian', 'lydian', 'mixolydian', true, 'phrygianDom', 'lydianDom']);
  is('  ii Dorian, iii Phrygian, vi Aeolian, half-diminished Locrian ♮2, dim7 whole-half, a blues IV7 Mixolydian with the blues scales, 7sus4 Mixolydian',
    [C.ii[0], C.iii[0], C.vi[0], C.half[0], C.dim[0], C.blues[0], C.blues.includes('minBlues'), C.sus[0]], ['dorian', 'phrygian', 'aeolian', 'locrian2', 'wholeHalf', 'mixolydian', true, 'mixolydian']);
  is('  each note marked: chord tone, tension, avoid (the 4th over a major 7), colour', C.roles, 'chord,tension,chord,avoid,chord,tension,chord');
  yes('  the guide-tone line moves by step (3rds and 7ths)', C.gt.every((m, i) => i === 0 || Math.abs(m - C.gt[i - 1]) <= 2), C.gt);
  await go('#/songwriting/tool/chord-scale');
  const CS = await p.evaluate(() => ({cells: document.querySelectorAll('.sng-csm-c').length, keys: document.querySelectorAll('.sng-keys i.r-chord').length, card: !!document.getElementById('csmReveal')}));
  yes('the map draws the progression, the keyboard coloured by role, and the scale flashcards', CS.cells === 4 && CS.keys >= 3 && CS.card, CS);

  console.log('\n7. the Melody Generator');
  const MG = await p.evaluate(() => {
    const g = Object.assign(sngPresetControls('melancholy'), {preset: 'melancholy', prog: ['vi', 'IV', 'I', 'V'], keyPc: 0, bars: 4});
    const a = sngGenerate(g, 42), b = sngGenerate(g, 42), c = sngGenerate(g, 43);
    const [lo, hi] = sngMelodyRange();
    const leaps = a.notes.every((n, i) => i === 0 || Math.abs(n.midi - a.notes[i - 1].midi) <= g.maxLeap || (n.why || []).some(w => /repetition|sequence|inversion|resolves|phrase ending/.test(w)));
    const locked = sngGenerate(g, 99, [Object.assign({}, a.notes[2], {locked: true})]);
    const lyr = sngGenerate(Object.assign({}, g, {lyric: 'the RAIN keeps FALLing on the ROOF'}), 5);
    const trium = sngGenerate(Object.assign(sngPresetControls('triumphant'), {preset: 'triumphant', prog: ['I', 'IV', 'V', 'I'], keyPc: 0, bars: 4}), 7);
    const ends = a.notes.filter(n => n.phraseEnd).map(n => sngPc(n.midi));
    return {same: JSON.stringify(a.notes) === JSON.stringify(b.notes), diff: JSON.stringify(a.notes) !== JSON.stringify(c.notes), range: a.notes.every(n => n.midi >= lo && n.midi <= hi), lo, hi, leaps,
      why: a.notes.every(n => (n.why || []).length >= 2), lockedKept: locked.notes.some(n => n.midi === a.notes[2].midi && Math.abs(n.t - a.notes[2].t) < 1e-6 && (n.why || []).includes('locked by you')),
      ends, lyricN: lyr.notes.length, lyricSyl: sngScan('the RAIN keeps FALLing on the ROOF').length, triumphEnd: sngPc(trium.notes[trium.notes.length - 1].midi), comp: sngCompliance(g, a).map(x => x[1]),
      presets: SNG_EMOTIONS.length, rules: a.rules.length};
  });
  yes('the same seed gives the same melody; another seed another', MG.same && MG.diff);
  yes(`every note inside your range (G2–D4 → ${MG.lo}–${MG.hi}) and no leap past the largest allowed`, MG.range && MG.leaps, MG);
  yes('  every note carries the rules it satisfies ("explain this melody")', MG.why);
  yes('  a locked note survives a new seed', MG.lockedKept);
  yes(`  melancholy's phrases end on 1 or 5 of the key (${MG.ends.join(', ')})`, MG.ends.length && MG.ends.every(x => [0, 7].includes(x)), MG.ends);
  yes(`  a lyric sets the rhythm: one note a syllable (${MG.lyricN} for ${MG.lyricSyl})`, MG.lyricN === MG.lyricSyl, MG);
  yes('  triumphant ends on 1', MG.triumphEnd === 0, MG.triumphEnd);
  yes(`  ${MG.presets} emotion presets, the compliance panel all ticked`, MG.presets === 12 && MG.comp.every(Boolean), MG.comp);
  await go('#/songwriting/tool/melody-gen');
  await p.click('#genAccept'); await p.waitForTimeout(700);
  yes('"Accept" puts it in the Sketcher to sing and rewrite', await p.evaluate(() => /melody-sketcher/.test(location.hash) && sngState().melodies[0].generated && document.querySelectorAll('.sng-roll-n').length > 4));

  console.log('\n8. words');
  const W = await p.evaluate(() => {
    const sec = lines => ({type: 'verse', lines: lines.map(text => ({text}))});
    const stable = sngStability(sec(['I walked the road in the cold', 'my breath a ghost in the air', 'I held the key that you sold', 'and found the house wasn\'t there']));
    const unstable = sngStability(sec(['the kettle sings', 'and the phone stays quiet on the table', 'nothing moves']));
    const rt = [['time', 'rhyme'], ['time', 'mine'], ['time', 'tide'], ['home', 'hope'], ['pain', 'pains'], ['cold', 'held']].map(([a, c]) => sngRhymeType(a, c));
    const cl = sngClicheFlags(['you set my broken heart on fire', 'and I fell apart', 'you stole my heart']);
    const pv = sngPovTense('I was walking, you were gone, and she laughed');
    const syl = ['fire', 'happy', 'beautiful', 'the'].map(sngSyllables);
    return {stable: stable.score, unstable: unstable.score, rt, cl, pv: pv.pov, tense: pv.tense, syl};
  });
  yes(`stability, measured: four matched, rhymed lines ${W.stable.toFixed(2)} against three unmatched, unrhymed ${W.unstable.toFixed(2)}`, W.stable > 0.6 && W.unstable < 0.4, W);
  is('rhyme types: time/rhyme perfect, time/mine family, time/tide assonance, home/hope assonance, pain/pains additive', W.rt.slice(0, 5), ['perfect', 'family', 'assonance', 'assonance', 'additive']);
  yes(`clichés flagged: ${W.cl.join('; ')}`, W.cl.some(x => /broken heart/.test(x)) && W.cl.some(x => /heart \/ apart|apart \/ heart/.test(x)), W.cl);
  is('point of view and tense read off the words', [W.pv.first > 0, W.pv.second > 0, W.pv.third > 0, W.tense], [true, true, true, 'past']);
  await go('#/songwriting/tool/lyric-sheet');
  await p.fill('[data-lsline="0:0"]', 'the kettle sings'); await p.dispatchEvent('[data-lsline="0:0"]', 'change'); await p.waitForTimeout(400);
  const LS = await p.evaluate(() => ({syl: document.querySelectorAll('[data-lsline="0:0"] ~ .sng-syl button').length, meter: !!document.querySelector('.sng-meter'), why: !!document.querySelector('.sng-why')}));
  yes('the Lyric Sheet scans a line into syllables to mark, with the stability meter and its reasons', LS.syl === 4 && LS.meter && LS.why, LS);
  await p.click('[data-lsline="0:0"] ~ .sng-syl button:nth-child(2)'); await p.waitForTimeout(300);
  yes('  a syllable pressed changes its stress, and is kept', await p.evaluate(() => Array.isArray(sngState().lab.sheet[0].lines[0].stress)));
  await go('#/songwriting/tool/rhyme-bench');
  await p.fill('#rbWord', 'light'); await p.dispatchEvent('#rbWord', 'change'); await p.waitForTimeout(400);
  const RB = await p.evaluate(() => [...document.querySelectorAll('.sng-rhymes .card')].map(c => c.querySelectorAll('[data-rbpick]').length));
  yes(`the Rhyme Workbench sorts the pool into the five types (${RB.join(' / ')})`, RB.length === 5 && RB[0] > 3, RB);

  console.log('\n9. songs');
  await go('#/songwriting/tool/song-desk');
  await p.fill('#sdTitle', 'Tin Roof'); await p.fill('#sdBrief', 'Me, to my sister, the night the power went out'); await p.click('#sdNew'); await p.waitForTimeout(600);
  await p.fill('[data-sdlines="0"]', 'rain on the tin roof like a drummer\ncandles on the table\nyou set my broken heart on fire\nand the dark goes soft'); await p.dispatchEvent('[data-sdlines="0"]', 'change'); await p.waitForTimeout(500);
  const SD = await p.evaluate(() => { const s = sngState().songs[0]; return {title: s.title, lines: s.sections[0].lines.length, auto: [...document.querySelectorAll('.sng-auto')].map(x => x.className.split(' ').pop() + ':' + x.textContent)}; });
  yes('a song on the Song Desk: brief, sections, lines', SD.title === 'Tin Roof' && SD.lines === 4, SD);
  yes(`  the Rewrite Room measures what it can (${SD.auto.length} checks), and finds the cliché`, SD.auto.length >= 4 && SD.auto.some(x => /^no:.*broken heart/.test(x)), SD.auto);
  await p.selectOption('#sdStatus', 'finished'); await p.waitForTimeout(500);
  await go('#/songwriting/songs');
  yes('finished, it stands on the Songbook shelf', (await p.$$('.sng-spine')).length === 1);
  await go('#/songwriting/capstone'); await p.click('#sngCapNew'); await p.waitForTimeout(600);
  yes('a capstone song walks the Ten Steps', await p.evaluate(() => document.querySelectorAll('.sng-ten-list li').length === 10 && !!document.getElementById('tenNext')));

  console.log('\n10. a voice memo, on this device only');
  const VM = await p.evaluate(async () => { await sngMemoKeep(new Blob([new Uint8Array(4000)], {type: 'audio/webm'}), 'hook idea.webm');
    const s = sngState().seeds.find(x => x.type === 'memo'); const row = s && await db.sngAudio.get(s.audioId); const rows = await readAllStores();
    return {seed: !!s, blob: !!(row && row.blob && row.blob.size === 4000), inBackup: Object.keys(rows).includes('sngAudio'), json: JSON.stringify(sngState()).includes('"blob"')}; });
  yes('a memo is a seed; its sound is in its own store; the backup and the saved state carry none of it', VM.seed && VM.blob && !VM.inBackup && !VM.json, VM);

  console.log('\n11. the rest of the house');
  for(const [h, sel] of [['#/jazz', '.page'], ['#/score', '.page'], ['#/japanese', '.ja-page']]){ await go(h); await p.waitForTimeout(500);
    yes(`${h} still opens`, !!(await p.$(sel)), h); }
  is('nothing was fetched from the network (Google Fonts aside)', net, []);

  console.log('\n12. on a phone');
  await p.setViewportSize({width: 390, height: 844});
  for(const h of ['#/songwriting', '#/songwriting/tool/chord-lab', '#/songwriting/tool/melody-gen', '#/songwriting/tool/lyric-sheet', '#/songwriting/tool/groove-maker', '#/songwriting/ex/0.3']){
    await go(h); await p.waitForTimeout(300);
    const w = await p.evaluate(() => ({doc: document.documentElement.scrollWidth, w: innerWidth, over: [...document.querySelectorAll('.sng-page *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 2 && !e.closest('.sng-grid'); }).map(e => e.className || e.tagName).slice(0, 3)}));
    yes(`${h}: nothing runs off the screen`, w.doc <= w.w + 1 && !w.over.length, w);
  }

  console.log('');
  if(errs.length){ bad += errs.length; errs.forEach(e => console.log('  FAIL ' + e)); }
  console.log(bad ? `${bad} FAILED` : 'all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
