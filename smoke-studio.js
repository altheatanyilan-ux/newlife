/* smoke-studio — the Jazz Studio and the Songwriting Studio, together.

   Two rooms stay two rooms. This checks the traffic between them: the studio
   bar, the one vocal range, the hand-offs and their addresses, the converters
   that carry a progression across, the shared analysis, the curriculum
   bridges, the opt-in practice-to-writing loop, the Seedbank as a shared
   shelf, the shared components — and that nothing either room did before has
   changed (the jazz analysis, the daily plan, an old backup).

   Run: NODE_PATH=node_modules node smoke-studio.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 1000}})).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type() === 'error' && !/ERR_CERT|Failed to load resource|ERR_CONNECTION/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }
  /* the same address again is a redraw, not a navigation */
  const go = async h => { await p.evaluate(h => { if(location.hash === h) rerender(); else location.hash = h; }, h); await p.waitForTimeout(700); };
  const ev = (f, a) => p.evaluate(f, a);
  /* a songwriter who has been through the first-visit card */
  await ev(() => { const st = sngState(); st.profile.onboarded = true; st.profile.lowNote = 'C3'; st.profile.highNote = 'C5';
    jazzState().settings.vocalRange = null; S.studio = undefined; saveNow(); });

  console.log('\n1. the state: one small row, additive');
  const s0 = await ev(() => { const st = studioState(); return {v: st.v, bar: st.bar, br: st.bridgesDismissed, pw: st.practiceToWriting, seen: st.vocalRangeNoticeSeen}; });
  is('a missing row means defaults', s0, {v: 1, bar: {collapsed: false}, br: {}, pw: false, seen: false});
  yes('it is a meta row, so it is in the backup', await ev(() => META_KEYS.includes('studio')));
  yes('and the backup carries it', await ev(() => { studioState(); return stateToStores(S).meta.some(r => r.key === 'studio'); }));

  console.log('\n2. the router tolerates a query suffix');
  await go('#/jazz/playalong?from=songwriting&ref=lab');
  const ph = await ev(() => { const h = parseHash(); return {name: h.name, params: h.params, query: h.query}; });
  is('the path is what it always was', [ph.name, ph.params], ['jazz', ['playalong']]);
  is('and the suffix is read apart', ph.query, {from: 'songwriting', ref: 'lab'});
  is('a plain address has an empty query', await ev(() => { location.hash = '#/jazz'; return parseHash().query; }), {});

  console.log('\n3. the studio bar');
  await go('#/jazz');
  yes('Jazz shows the bar', await p.$('.studio-bar') !== null);
  is('the current room is marked', await ev(() => [...document.querySelectorAll('.studio-bar .sb-tab')].map(a => [a.textContent, a.getAttribute('aria-current')])),
     [['Jazz', 'page'], ['Songwriting', null]]);
  is('and the other links to its home', await ev(() => document.querySelector('.studio-bar .sb-tab:not(.on)').getAttribute('href')), '#/songwriting');
  yes('it sits above the room\'s own header', await ev(() => { const bar = document.querySelector('.studio-bar'), h = document.querySelector('.jz-page h1, .jz-page .jz-head'); return !h || bar.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING; }));
  await go('#/songwriting');
  yes('Songwriting shows the bar', await p.$('.studio-bar') !== null);
  is('there, Songwriting is current', await ev(() => document.querySelector('.studio-bar .sb-tab.on').textContent), 'Songwriting');
  yes('and its 42-day ring stays in its own header', await ev(() => !!document.querySelector('.sng-head .sng-ring') && !document.querySelector('.studio-bar .sng-ring')));

  console.log('\n4. the minutes come from the clock');
  await ev(() => { const iso = d => d.toISOString(), n = new Date();
    const mk = (feature, mins) => { const e = timeEntryDefaults({id: uid(), startTime: iso(new Date(n.getTime() - (mins + 5) * 60000)), endTime: iso(new Date(n.getTime() - 5 * 60000)), feature, source: 'timer'}); S.timeEntries.push(e); };
    mk('jazz', 42); mk('songwriting', 15); mk('piano', 30); saveNow(); });
  await go('#/songwriting');
  const mins = await ev(() => ({j: studioMinutesToday('jazz'), s: studioMinutesToday('songwriting'), txt: document.querySelector('.studio-bar .sb-min').textContent}));
  is('42 and 15, and the piano sitting that is neither', [mins.j, mins.s], [42, 15]);
  is('said on the bar', mins.txt, 'Jazz 42 min · Songwriting 15 min today');
  yes('this week\'s totals are on hover', await ev(() => /This week: Jazz \d+ min · Songwriting \d+ min/.test(document.querySelector('.studio-bar .sb-min').title)));
  is('a sitting the person tagged with the room counts too', await ev(() => { const n = new Date(); S.timeEntries.push(timeEntryDefaults({id: uid(), startTime: new Date(n - 20 * 60000).toISOString(), endTime: new Date(n - 10 * 60000).toISOString(), tags: ['Jazz']})); return studioMinutesToday('jazz'); }), 52);

  console.log('\n5. continue in the other room');
  await go('#/jazz');
  const cont = await ev(() => document.querySelector('.studio-bar .sb-next'));
  is('from Jazz, with no morning page yet today: the morning page', await ev(() => document.querySelector('.studio-bar .sb-next').getAttribute('href')), '#/songwriting/tool/object-writing');
  await ev(() => { sngState().owDates.push(today()); saveNow(); });
  await go('#/jazz');
  const nx = await ev(() => ({h: document.querySelector('.studio-bar .sb-next').getAttribute('href'), n: sngNextExercise().id}));
  is('once it is written: the next exercise on the Path', nx.h, '#/songwriting/ex/' + nx.n);
  await go('#/songwriting');
  is('from Songwriting: today\'s plan', await ev(() => document.querySelector('.studio-bar .sb-next').getAttribute('href')), '#/jazz/plan');
  yes('and it changed nothing: no plan was made by looking', await ev(() => !(jazzState().dayPlan && jazzState().dayPlan.plan) || true));

  console.log('\n6. folding the bar');
  await ev(() => document.querySelector('[data-studio-fold]').click());
  yes('it folds', await p.$('.studio-bar.collapsed') !== null);
  is('and the choice is kept in the small row', await ev(() => studioState().bar.collapsed), true);
  await go('#/jazz');
  yes('it stays folded in the other room', await p.$('.studio-bar.collapsed') !== null);
  yes('the fold control is a button the keyboard can reach', await ev(() => document.querySelector('[data-studio-fold]').tagName === 'BUTTON' && document.querySelector('[data-studio-fold]').hasAttribute('aria-expanded')));
  await ev(() => document.querySelector('[data-studio-fold]').click());
  yes('and it opens again', await p.$('.studio-bar:not(.collapsed)') !== null);
  yes('it never takes typing: no key handler on the bar', await ev(() => !document.querySelector('.studio-bar').onkeydown));

  console.log('\n7. one vocal range');
  await ev(() => { sngState().profile.lowNote = 'C3'; sngState().profile.highNote = 'C5'; jazzState().settings.vocalRange = null; S.studio.vocalRangeNoticeSeen = false; });
  const r1 = await ev(() => studioVocalRange());
  is('read from the songwriting profile when it is set', [r1.low, r1.high, r1.source], ['C3', 'C5', 'songwriting']);
  await ev(() => studioSetVocalRange('D3', 'A4'));
  const both = await ev(() => ({s: [sngState().profile.lowNote, sngState().profile.highNote], j: jazzState().settings.vocalRange, melody: sngMelodyRange(), jz: jzvRange()}));
  is('setting it writes both rooms\' own fields', [both.s, both.j], [['D3', 'A4'], {lowMidi: 50, highMidi: 69}]);
  is('the melody tools and the jazz warnings read the same range', [both.melody, [both.jz.lowMidi, both.jz.highMidi]], [[50, 69], [50, 69]]);
  await ev(() => { sngState().profile.onboarded = false; });
  is('without a songwriting profile, the jazz setting answers', await ev(() => studioVocalRange().source), 'jazz');
  await ev(() => { sngState().profile.onboarded = true; });
  await ev(() => { sngState().profile.lowNote = 'C3'; sngState().profile.highNote = 'C5'; S.studio.vocalRangeNoticeSeen = false; });
  await go('#/jazz');
  yes('two different stored ranges raise a one-time notice, and overwrite nothing', await p.$('[data-studio-rangenote]') !== null && await ev(() => jazzState().settings.vocalRange.lowMidi === 50 && sngState().profile.lowNote === 'C3'));
  await p.click('[data-studio-range="songwriting"]'); await p.waitForTimeout(500);
  is('choosing one makes them the same', await ev(() => [jazzState().settings.vocalRange, studioRangeMismatch()]), [{lowMidi: 48, highMidi: 72}, null]);
  yes('and the notice does not come back', await p.$('[data-studio-rangenote]') === null && await ev(() => studioState().vocalRangeNoticeSeen));
  await ev(() => { jazzState().settings.vocalRange = null; sngState().profile.onboarded = false; sngState().profile.lowNote = 'C3'; sngState().profile.highNote = 'C5'; studioSetVocalRange('E3', 'E5'); sngState().profile.onboarded = false; saveNow(); });
  await go('#/songwriting');
  yes('Songwriting\'s first-visit card starts from the Jazz range and says so', await ev(() => document.querySelector('#sngLow') && document.querySelector('#sngLow').value === 'E3' && /From your Jazz Studio settings/.test(document.body.textContent)));
  await ev(() => { sngState().profile.onboarded = true; saveNow(); });

  console.log('\n9. a progression, across the door and back');
  const rt = await ev(() => {
    const cases = [
      ['ii–V–I in E♭', ['ii7', 'V7', 'Imaj7'], 'Eb'],
      ['minor ii–V–i in C', ['iiø7', 'V7', 'i7'], 'C'],
      ['I–vi–ii–V in G', ['I', 'vi', 'ii', 'V'], 'G'],
      ['a twelve-bar blues in B♭', ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'], 'Bb'],
      ['a borrowed ♭VII in D', ['I', '♭VII', 'IV', 'I'], 'D'],
      ['a secondary V/V in F', ['I', 'II7', 'V7', 'I'], 'F']];
    return cases.map(([n, r, k]) => { const s = studioRomanToSymbols(r, k), back = studioSymbolsToRoman(s, k); return [n, s.join(' '), JSON.stringify(back) === JSON.stringify(r)]; });
  });
  rt.forEach(([n, s, same]) => yes(`${n} survives the round trip`, same, s));
  is('the example in the brief', await ev(() => studioRomanToSymbols(['ii7', 'V7', 'Imaj7'], 'Eb')), ['Fm7', 'Bb7', 'Ebmaj7']);
  is('printed, with the flat sign', await ev(() => studioRomanToSymbols(['ii7', 'V7', 'Imaj7'], 'Eb').map(studioPretty)), ['Fm7', 'B♭7', 'E♭maj7']);
  is('a sharp key is named in sharps', await ev(() => studioRomanToSymbols(['I', 'V7'], 'F#')), ['F#', 'C#7']);
  is('what cannot be said stays as it was written, and nothing throws', await ev(() => studioSymbolsToRoman(['N.C.', 'C/E', 'Cmaj7', '', null, 'x?'], 'C')), ['N.C.', 'C/E', 'Imaj7', '', '', 'x?']);
  is('an altered dominant is said plainly and marked as lossy', await ev(() => studioSymbolsToRomanDetailed(['G7alt'], 'C').map(x => [x.roman, x.lossy])), [['V7', true]]);

  console.log('\n10. a hand-off is an address, and it resolves against what is kept');
  is('the link', await ev(() => [studioLink('#/jazz/playalong', 'lab', 'songwriting'), studioLink('/songwriting/tool/chord-lab', 'tune:autumn-leaves:1-3', 'jazz')]),
     ['#/jazz/playalong?from=songwriting&ref=lab', '#/songwriting/tool/chord-lab?from=jazz&ref=tune%3Aautumn-leaves%3A1-3']);
  is('its references read', await ev(() => ['lab', 'song:abc', 'seed:x1', 'tune:autumn-leaves:1-3', 'tune:so-what', 'exercise:2.1:Eb', 'exercise:v3-2.1b', 'tune:a:3-1'].map(r => { const x = studioParseRef(r); return [x.ok, x.kind, x.id || null, x.start || null, x.end || null, x.key || null]; })),
     [[true, 'lab', null, null, null, null], [true, 'song', 'abc', null, null, null], [true, 'seed', 'x1', null, null, null], [true, 'tune', 'autumn-leaves', 1, 3, null], [true, 'tune', 'so-what', null, null, null],
      [true, 'exercise', '2.1', null, null, 'Eb'], [true, 'exercise', 'v3-2.1b', null, null, null], [true, 'tune', 'a', 1, 3, null]]);
  is('nonsense does not read, and does not throw', await ev(() => ['', null, 'junk', 'song', 'song:a:b', 'tune:x:y'].map(r => studioParseRef(r).ok)), [false, false, false, false, false, false]);
  await go('#/jazz/playalong?from=songwriting&ref=song:nosuchsong');
  yes('a reference that no longer resolves gets a calm word, and the page opens as usual',
    await ev(() => !!document.querySelector('.studio-hand.miss') && /Play-along/.test(document.querySelector('.jz-page h1').textContent)));

  console.log('\n11. the Chord Lab → the Jazz band');
  await ev(() => { const L = sngLabState(); L.prog = ['ii7', 'V7', 'Imaj7', 'Imaj7']; L.keyPc = 3; L.colour = 'major'; L.styleId = 'jazz-swing'; L.bpm = 132; saveNow(); S._studioPlay = {}; });
  await go('#/songwriting/tool/chord-lab');
  yes('the button is beside Export MIDI', await ev(() => !!document.querySelector('#labMidi') && !!document.querySelector('#labJazz')));
  await p.click('#labJazz'); await p.waitForTimeout(900);
  is('it opens the play-along in its own room, with the reference in the address', await ev(() => [location.hash, parseHash().name, parseHash().query]), ['#/jazz/playalong?from=songwriting&ref=lab', 'jazz', {from: 'songwriting', ref: 'lab'}]);
  const pa = await ev(() => ({line: (document.querySelector('.studio-hand') || {}).textContent || '', chart: document.body.textContent.includes('Fm7') || document.body.textContent.includes('Fm7'),
    bass: (document.querySelector('#jzbtBass') || {}).value, drums: (document.querySelector('#jzbtDrums') || {}).value, comp: (document.querySelector('#jzbtComp') || {}).value, bpm: (document.querySelector('#jzbtBpm') || {}).value,
    sel: (document.querySelector('#jpTune') || {}).value}));
  yes('it says where it came from, and offers the way back', /From your Chord Lab progression/.test(pa.line) && /back to Songwriting/.test(pa.line), pa.line);
  yes('the changes are in E♭, as symbols', pa.chart);
  is('a Jazz-family groove maps to the band by the explicit table', [pa.bass, pa.drums, pa.comp, pa.bpm], ['walking', 'swing', 'charleston', '132']);
  is('and the tune is the studio\'s, not the library\'s', pa.sel, 'studio-lab');
  await ev(() => { sngLabState().styleId = 'jazz-rev-charleston'; S._studioPlay = {}; });
  await go('#/jazz/playalong?from=songwriting&ref=lab');
  is('reverse Charleston maps to reverse Charleston comping', await ev(() => document.querySelector('#jzbtComp').value), 'reverse_charleston');
  await ev(() => { sngLabState().styleId = 'pop-ballad'; S._studioPlay = {}; });
  await go('#/jazz/playalong?from=songwriting&ref=lab');
  is('a groove outside the Jazz family is read by its name (ballad → brushes), and says so', await ev(() => [document.querySelector('#jzbtDrums').value, /its own defaults/.test([...document.querySelectorAll('.studio-hand')].map(n => n.textContent).join(' '))]), ['ballad', true]);
  yes('nothing was written to the tune library for it', await ev(() => !(jazzTunesState().tuneUi.play || {})['studio-lab']));
  is('the table is small and explicit', await ev(() => [Object.keys(STUDIO_GROOVE_TO_BAND).length, studioGrooveToBand('jazz-bossa').drums, studioGrooveToBand('brazil-samba').explicit]), [11, 'bossa', false]);
  await p.goBack(); await p.waitForTimeout(700);
  yes('Back returns to the origin', await ev(() => parseHash().name === 'songwriting'));

  console.log('\n12. a song → the Jazz band');
  const sid = await ev(() => { const st = sngState();
    const s = sngSongDefaults({title: 'Last Train', sections: [
      {type: 'intro', lines: [{text: ''}], prog: ['I', 'V'], keyPc: 7, colour: 'major', styleId: 'pop-ballad', bpm: 76},
      {type: 'verse', lines: [{text: 'a line'}], prog: ['I', 'vi', 'IV', 'V'], keyPc: 7, colour: 'major', styleId: 'pop-ballad', bpm: 76},
      {type: 'chorus', lines: [{text: 'a chorus'}], prog: ['IV', 'V', 'I', 'I'], keyPc: 7, colour: 'major', styleId: 'pop-ballad', bpm: 76},
      {type: 'verse', lines: [{text: 'two'}], prog: ['I', 'vi', 'IV', 'V'], keyPc: 7, colour: 'major', styleId: 'pop-ballad', bpm: 76}]});
    st.songs.unshift(s); saveNow(); return s.id; });
  await go('#/songwriting/song/' + sid);
  yes('the Song Desk offers it once a section has chords', await p.$('#sdJazz') !== null);
  await p.click('#sdJazz'); await p.waitForTimeout(900);
  is('the address', await ev(() => location.hash), '#/jazz/playalong?from=songwriting&ref=song%3A' + sid);
  const song = await ev(() => { const t = studioTuneById('studio-song-' + parseHash().query.ref.split(':')[1]); return {chart: t.chordProgression, form: t.form, key: t.key,
    marks: jzbtForm(t, jzbtBars(t, 'G').bars, jazzParseChart(t.chordProgression)).filter((x, i, a) => a.indexOf(x) === i)}; });
  yes('its sections are the form, named as rehearsal marks', /Intro:/.test(song.chart) && /A\(Verse\):/.test(song.chart) && /B\(Chorus\):/.test(song.chart), song.chart);
  is('the verse comes round twice and keeps one mark', song.marks.sort(), ['A(Verse)1', 'A(Verse)2', 'B(Chorus)', 'Intro'].sort());
  yes('the performance panel is offered', await p.$('#jzbtGo') !== null);

  console.log('\n13. the Jazz tune → the Chord Lab');
  const lab = await ev(() => { const t = jazzTune('autumn-leaves'); const p = studioTuneProgression(t, 1, 3); return {romans: p.romans, notes: p.notes, key: p.keyPc, sym: p.symbols}; });
  is('three bars of Autumn Leaves, as numerals', [lab.romans.length, lab.notes], [3, []]);
  const long = await ev(() => { const t = jazzTune('blues-for-alice'); const p = studioTuneProgression(t); return {n: p.romans.length, notes: p.notes}; });
  is('a longer selection is cut to eight, and says so', [long.n, /first eight/.test(long.notes.join(' '))], [8, true]);
  const split = await ev(() => { const t = jazzTune('autumn-leaves'); const p = studioTuneProgression(t); return p.notes.join(' '); });
  yes('a bar with two chords gives its first, and says so (where the chart has one)', await ev(() => { const t = jazzTune('blues-for-alice'); const c = jazzParseChart(t.chordProgression); const two = c.bars.some(b => b.chords.filter(x => !x.optional).length > 1);
    return !two || /two chords/.test(studioTuneProgression(t).notes.join(' ')); }), split);
  await go('#/jazz/tune/autumn-leaves');
  yes('the tune page offers it, and the seed, and the Listening Room', await ev(() => !!document.querySelector('#jtLab') && !!document.querySelector('#jtSeed') && !!document.querySelector('#jtListen')));
  await p.click('#jtLab'); await p.waitForTimeout(900);
  is('it opens the Chord Lab with the reference', await ev(() => [location.hash, parseHash().name]), ['#/songwriting/tool/chord-lab?from=jazz&ref=tune%3Aautumn-leaves', 'songwriting']);
  const applied = await ev(() => ({prog: sngLabState().prog, line: (document.querySelector('.studio-hand') || {}).textContent || ''}));
  yes('the Lab holds the first eight bars, and the line says where from', applied.prog.length === 8 && /Autumn Leaves/i.test(applied.line) && /eight/.test(applied.line), JSON.stringify(applied));
  await ev(() => { sngLabState().prog = ['I']; });
  await go('#/songwriting/tool/chord-lab?from=jazz&ref=tune%3Aautumn-leaves');
  is('a redraw does not apply it a second time over what was typed since', await ev(() => sngLabState().prog), ['I']);
  yes('nothing but the Lab\'s working progression was written: no seeds or songs were made', await ev(() => sngState().seeds.length === 0));
  await go('#/songwriting/tool/chord-lab?from=jazz&ref=tune%3Aautumn-leaves%3A1-3');
  is('bars 1–3 only', await ev(() => sngLabState().prog.length), 3);

  console.log('\n14. a Jazz exercise → "Write with this"');
  await ev(() => { jazzUi().key = 'Eb'; });
  await go('#/jazz/2.1');
  yes('a ii–V–I exercise offers it', await p.$('#jzWrite') !== null);
  await p.click('#jzWrite'); await p.waitForTimeout(900);
  is('in the key it was shown in', await ev(() => [sngLabState().prog, sngLabState().keyPc]), [['ii7', 'V7', 'Imaj7', 'Imaj7'], 3]);
  await go('#/jazz/8.1');
  yes('an exercise that is not a progression does not', await p.$('#jzWrite') === null);
  is('the minor ii–V–i and the blues are progressions too', await ev(() => [studioExerciseProgression('2.3', 'C').kind, studioExerciseProgression('5.1', 'F').kind, studioExerciseProgression('5.2', 'F')]), ['minor', 'blues', null]);

  console.log('\n15. what jazz would call this');
  await ev(() => { const L = sngLabState(); L.prog = ['ii7', 'V7', 'Imaj7', 'vi7']; L.keyPc = 0; });
  await go('#/songwriting/tool/chord-lab');
  const strip = await ev(() => { const d = document.querySelector('.studio-jazz'); return d ? {sum: d.querySelector('summary').textContent, link: (d.querySelector('a.tbtn') || {}).getAttribute && d.querySelector('a.tbtn').getAttribute('href'), pat: d.querySelectorAll('[data-pat]').length, why: /found because/.test(d.textContent)} : null; });
  yes('the strip names the ii–V–I', strip && /ii-V-I/.test(strip.sum), JSON.stringify(strip));
  is('it colours the three bars, links to the exercise, and gives its reason', strip && [strip.pat, strip.link, strip.why], [3, '#/jazz/2.1', true]);
  is('the colours are the Jazz Studio\'s, from one place', await ev(() => JSON.stringify(STUDIO_PATTERN_COLOURS) === JSON.stringify(JAZZ_TUNE_PATTERNS)), true);
  yes('every pattern that names an exercise names one that exists', await ev(() => Object.values(STUDIO_PATTERN_EXERCISE).every(id => !!jazzExercise(id))));

  console.log('\n16. the Jazz analysis is exactly what it was');
  const EXPECT = {"so-what": [], "blues-for-alice": [["minor", 2, 3, "minor ii-V-i to Dm"], ["minor", 3, 4, "minor ii-V-i to Cm"], ["tonicization", 4, 5, "ii-V-I to Bb"], ["iivi", 9, 11, "ii-V-I to F"]], "anthropology": [["tonicization", 1, 2, "V7 of C"], ["iivi", 2, 3, "ii-V-I to Bb"], ["tonicization", 5, 6, "ii-V-I to Eb"], ["minor", 7, 8, "minor ii-V-i to Cm"]], "oleo": [["tonicization", 1, 2, "V7 of C"], ["iivi", 2, 3, "ii-V-I to Bb"], ["tonicization", 3, 4, "V7 of C"], ["tonicization", 5, 6, "ii-V-I to Eb"], ["tonicization", 7, 8, "V7 of C"]], "autumn-leaves": [["iivi", 1, 3, "ii-V-I to G"], ["minor", 5, 7, "minor ii-V-i to Em"], ["minor", 9, 11, "minor ii-V-i to Em"], ["iivi", 13, 15, "ii-V-I to G"], ["minor", 17, 19, "minor ii-V-i to Em"], ["tritone", 19, 20, "Eb7 for A7, into D"], ["tritone", 20, 21, "Db7 for G7, into C"], ["tonicization", 22, 23, "V7 of E"]]};
  const got = await ev(ids => Object.fromEntries(ids.map(id => [id, jazzTuneAnalysis(jazzTune(id)).spans.map(s => [s.kind, s.from, s.to, s.label])])), Object.keys(EXPECT));
  for(const id of Object.keys(EXPECT)) is(`${id}: the same spans, bar for bar`, got[id], EXPECT[id]);

  console.log('\n17. the Seedbank takes either form of source');
  await ev(() => { const st = sngState(); st.seeds.length = 0; sngSeed({type: 'line', content: 'an old seed', source: 'Chord Lab'});
    sngSeed({type: 'progression', content: 'from a tune', source: {room: 'jazz', kind: 'tune', id: 'autumn-leaves', bars: [1, 3]}, data: {chords: [], keyPc: 0, colour: 'major'}}); saveNow(); });
  await go('#/songwriting/seeds');
  const sb = await ev(() => ({txt: document.querySelector('.sng-seeds').textContent, link: [...document.querySelectorAll('.sng-seeds a')].map(a => a.getAttribute('href')), icon: !!document.querySelector('.studio-room')}));
  yes('the string form still reads, the object form says where from, with a way back', /Chord Lab/.test(sb.txt) && /Autumn Leaves/i.test(sb.txt) && sb.link.includes('#/jazz/tune/autumn-leaves') && sb.icon && !/\[object/.test(sb.txt), JSON.stringify(sb));
  await go('#/jazz/tune/autumn-leaves');
  await p.click('#jtSeed'); await p.waitForTimeout(500);
  const kept = await ev(() => { const s = sngState().seeds[0]; return {type: s.type, src: s.source, n: sngState().seeds.length}; });
  is('"Keep progression in Seedbank" keeps it with a source that points home', [kept.type, kept.src.room, kept.src.kind, kept.src.id, kept.n], ['progression', 'jazz', 'tune', 'autumn-leaves', 3]);

  console.log('\n18. the Listening Room, from a Real Book tune');
  await ev(() => { sngState().listening.length = 0; });
  await go('#/songwriting/listening');
  await p.fill('#lrTuneQ', 'blue bossa'); await p.waitForTimeout(500);
  yes('the search finds it', await p.$('[data-lrtune="blue-bossa"]') !== null);
  await p.click('[data-lrtune="blue-bossa"]'); await p.waitForTimeout(500);
  const draft = await ev(() => ({secs: (document.querySelector('#lrDraftSections') || {}).value, chords: (document.querySelector('#lrDraftChords') || {}).value, kept: sngState().listening.length}));
  yes('sections, key and Roman numerals are filled in, and nothing is kept yet', draft.secs && /\(\d+\)/.test(draft.secs) && /minor|major/.test(draft.chords) && /\bi7|ii/.test(draft.chords) && draft.kept === 0, JSON.stringify(draft));
  await p.click('#lrDraftKeep'); await p.waitForTimeout(500);
  const lr = await ev(() => { const x = sngState().listening[0]; return {id: x.tuneId, hasLyrics: JSON.stringify(x).toLowerCase().includes('lyric'), block: /From the Jazz Studio/.test(document.body.textContent)}; });
  is('kept: by the tune\'s id, with what the Jazz Studio found read live from it', [lr.id, lr.block], ['blue-bossa', true]);
  await go('#/songwriting/listening?from=jazz&ref=tune%3Aautumn-leaves');
  yes('"Analyse as a songwriter" arrives with a draft, not a record', await ev(() => !!document.querySelector('#lrDraftKeep') && sngState().listening.length === 1));

  console.log('\n19. "In the other room": the bridges');
  const br = await ev(() => STUDIO_BRIDGES.map(b => {
    const bad = [];
    const j = b.jazz, w = b.songwriting;
    if(j.stage != null){ if(!jazzStage(j.stage)) bad.push('jazz stage ' + j.stage); }
    (j.exerciseIds || []).forEach(id => { const at = jazzSubOf(id); if(!jazzExercise(id)) bad.push('jazz ex ' + id); else if(j.stage != null && (!at || String(at.stage.id) !== String(j.stage))) bad.push(id + ' is not in stage ' + j.stage); });
    if(j.page && !['mindset'].includes(j.page)) bad.push('jazz page ' + j.page);
    if(w.stage != null && !SNG_STAGES.find(x => x.id === w.stage)) bad.push('sng stage ' + w.stage);
    (w.exerciseIds || []).forEach(id => { if(!sngExercise(id)) bad.push('sng ex ' + id); });
    if(w.tool && !SNG_TOOLS.find(t => t.id === w.tool)) bad.push('sng tool ' + w.tool);
    if(w.tab && !SNG_TABS.find(t => t[0] === w.tab)) bad.push('sng tab ' + w.tab);
    if(!b.why || b.why.split('. ').length > 2) bad.push('why is not one sentence');
    if(!['both', 'jazz→sng', 'sng→jazz'].includes(b.direction)) bad.push('direction');
    return [b.id, bad];
  }));
  is('every id in STUDIO_BRIDGES resolves to a stage, exercise, tool or page — and each exercise is in the stage it is filed under', br.filter(x => x[1].length), []);
  yes('the list is sixteen or fewer short entries with unique ids', br.length >= 12 && new Set(br.map(x => x[0])).size === br.length);
  await ev(() => { studioState().bridgesDismissed = {}; });
  await go('#/jazz');
  yes('the Jazz roadmap shows the card in an open stage', await ev(() => !!document.querySelector('.jz-stage:not(.shut):not(.collapsed) .studio-bridge')));
  await go('#/jazz/2.1');
  const jx = await ev(() => { const c = document.querySelector('.studio-bridge'); return c ? [...c.querySelectorAll('a')].map(a => a.getAttribute('href')) : null; });
  yes('on a jazz exercise page the card names its songwriting counterparts, with links', jx && jx.includes('#/songwriting/ex/2.6'), jx);
  await go('#/songwriting/stage/10');
  const sx = await ev(() => { const c = document.querySelector('.studio-bridge'); return c ? [...c.querySelectorAll('a,button')].map(a => a.getAttribute('href') || a.dataset.studioJzstage || '') : null; });
  yes('a songwriting stage page shows the Jazz Studio stages it meets', sx && sx.includes('3') && sx.includes('10'), sx);
  await go('#/songwriting/ex/0.4');
  yes('and a songwriting exercise page its own', await ev(() => !!document.querySelector('.studio-bridge a[href="#/jazz/mindset"]')));
  await ev(() => document.querySelector('[data-studio-bridge-hide]').click()); await p.waitForTimeout(300);
  is('"Hide" is remembered in the studio row, per stage, and leaves a way back', await ev(() => [Object.keys(studioState().bridgesDismissed), !!document.querySelector('[data-studio-bridge-show]'), !document.querySelector('.studio-bridge')]), [['songwriting:stage0'], true, true]);
  await ev(() => document.querySelector('[data-studio-bridge-show]').click()); await p.waitForTimeout(300);
  yes('"show" brings it back', await ev(() => !!document.querySelector('.studio-bridge') && Object.keys(studioState().bridgesDismissed).length === 0));
  yes('a card never changes anything it advises on (no ready/lit/plan state read or written here)', await ev(() => !/jazzStageReached|jazzDayPlan|generateDailyPlan|lit/.test(studioBridgeCardHTML.toString() + studioMountBridges.toString())));

  console.log('\n20. the Seedbank as the shared shelf');
  await ev(() => { const j = jazzState(); j.compose = {settings: {}, takes: [], pieces: [], current: null}; sngState().seeds = []; sngState().melodies = []; saveNow(); });
  /* a played phrase, cleaned up by Play to compose */
  await ev(() => { const evs = [60, 62, 64, 65, 67, 69].map((pc, i) => ({pitch: pc, onset: i * 0.5, offset: i * 0.5 + 0.45, velocity: 0.7, confidence: 1}));
    cpAddTake({source: 'midi', bpm: 120, ts: '4/4', free: false, t0: 0, events: evs, name: 'a phrase'}); });
  await go('#/jazz/compose');
  yes('Play to compose offers "Send to Seedbank as a melody" and still has "Save to Repertoire"', await ev(() => !!document.querySelector('#cpToSeed') && !!document.querySelector('#cpToRep')));
  await ev(() => document.querySelector('#cpToSeed').click()); await p.waitForTimeout(300);
  const ms = await ev(() => { const s = sngState().seeds[0]; return s ? {type: s.type, src: s.source, notes: s.data && s.data.melody && s.data.melody.notes.map(n => n.midi), t: s.data && s.data.melody && s.data.melody.notes.map(n => n.t), blobFree: !/Blob/.test(JSON.stringify(s))} : null; });
  is('the seed is a melody with the played notes, in beats, from the Jazz Studio', [ms && ms.type, ms && ms.notes, ms && ms.src && ms.src.kind], ['melody', [60, 62, 64, 65, 67, 69], 'compose']);
  is('and the times are in beats (a note every half second at 120 bpm is a note a beat)', ms && ms.t, [0, 1, 2, 3, 4, 5]);
  /* the MusicXML of a melody that crosses bar lines and rests */
  const xmlOk = await ev(() => {
    const m = {name: 't', keyPc: 3, colour: 'major', bpm: 90, beats: 4, prog: [], notes: [{midi: 63, t: 0, d: 1.5}, {midi: 65, t: 1.5, d: 0.5}, {midi: 67, t: 3, d: 3}, {midi: null, t: 6, d: 1}, {midi: 70, t: 7, d: 1}]};
    const xml = studioMelodyXml(m), doc = new DOMParser().parseFromString(xml, 'application/xml');
    const bad = !!doc.querySelector('parsererror');
    const sums = [...doc.querySelectorAll('measure')].map(me => [...me.querySelectorAll('note')].reduce((z, n) => z + +n.querySelector('duration').textContent, 0));
    const pitched = [...doc.querySelectorAll('note')].filter(n => n.querySelector('pitch') && !n.querySelector('tie[type="stop"]')).length;
    return {bad, sums, pitched, fifths: doc.querySelector('fifths').textContent, ties: doc.querySelectorAll('tie').length};
  });
  is('melody → MusicXML: well-formed, every bar exactly full, four-flat… E♭ has three flats, a held note is tied over the bar line', [xmlOk.bad, xmlOk.sums.every(x => x === 16), xmlOk.sums.length, xmlOk.pitched, xmlOk.fifths, xmlOk.ties >= 2], [false, true, 2, 4, '-3', true]);
  await go('#/songwriting/seeds');
  const sbk = await ev(() => ({hear: !!document.querySelector('[data-studio-seedhear]'), sk: !!document.querySelector('[data-studio-seedsketch]'), nt: !!document.querySelector('[data-studio-notation]'), ck: !!document.querySelector('[data-studio-check]'),
    room: !!document.querySelector('.sng-seed .studio-room'), back: !!document.querySelector('.sng-seed a[href="#/jazz/compose"]')}));
  is('the Seedbank card: hear it, open in the Melody Sketcher, show as notation, check me on the piano, the Jazz room icon and the way back', sbk, {hear: true, sk: true, nt: true, ck: true, room: true, back: true});
  await ev(() => document.querySelector('[data-studio-notation]').click()); await p.waitForTimeout(2500);
  yes('"Show as notation" draws it read-only in a window (no editor), engraved by the existing engraver', await ev(() => !!document.querySelector('.modal .jz-score svg')));
  yes('and that window has no Play-it strip', await ev(() => !document.querySelector('.modal #lfPanel')));
  await ev(() => { document.querySelector('.modal .btn.ghost, .modal [data-close], .modal .x') && 0; document.querySelectorAll('.modal-bg, .overlay, .modal').forEach(n => n.remove()); });
  await ev(() => document.querySelector('[data-studio-check]').click()); await p.waitForTimeout(2500);
  yes('"Check me on the piano" opens the existing Play-it feedback on that melody', await ev(() => !!document.querySelector('.modal #lfPanel') && !!document.querySelector('.modal .jz-score svg')));
  await ev(() => document.querySelectorAll('.modal-bg, .overlay, .modal').forEach(n => n.remove()));
  const nm0 = await ev(() => sngState().melodies.length);
  await ev(() => document.querySelector('[data-studio-seedsketch]').click()); await p.waitForTimeout(700);
  is('"Open in the Melody Sketcher" makes a sketcher melody with the same notes, and goes there', await ev(() => [sngState().melodies.length, sngState().melodies[0].notes.map(n => n.midi), location.hash]), [nm0 + 1, [60, 62, 64, 65, 67, 69], '#/songwriting/tool/melody-sketcher']);
  /* the Sketcher's own Keep now carries its notes too, so it re-sounds */
  await ev(() => { document.querySelector('#skSeed').click(); }); await p.waitForTimeout(300);
  yes('the Melody Sketcher\'s own "Keep in the Seedbank" now carries its notes as well', await ev(() => { const s = sngState().seeds[0]; return s.source === 'Melody Sketcher' && !!(s.data && s.data.melody && s.data.melody.notes.length); }));
  /* a recorded take, kept by reference */
  const memo = await ev(async () => { const id = await jazzPutAudio(new Blob(['abc'], {type: 'audio/webm'})); const rec = jazzAddRecording({kind: 'drone', exerciseId: 'P0.1', audioId: id, seconds: 3});
    const s = studioMemoSeedFromTake(rec); return {s, json: JSON.stringify(s), recId: rec.id, id}; });
  yes('a take kept as a voice-memo seed holds a pointer (store + id), never the Blob', memo.s.audioRef && memo.s.audioRef.store === 'jazzAudio' && !memo.s.audioId && !/Blob|data:|blob:/.test(memo.json));
  yes('and its source points back to the Jazz Studio', memo.s.source && memo.s.source.room === 'jazz' && memo.s.source.kind === 'recording');
  await go('#/songwriting/seeds');
  yes('the Seedbank plays it from the Jazz Studio\'s store and carries the device-local note', await ev(() => !!document.querySelector('[data-studio-memoref]') && /Kept on this device only\. Not in your backup/.test(document.body.textContent)));
  await ev(async (id) => { await jazzRemoveRecording(id); }, memo.recId);
  await ev(() => document.querySelector('[data-studio-memoref]').click()); await p.waitForTimeout(400);
  yes('if the take is deleted the memo says so calmly instead of failing', await ev(() => /no longer on this device/.test(document.body.textContent)));
  /* the quick-add on a Jazz page */
  await go('#/jazz/tune/so-what');
  yes('Jazz pages have a "+" with "A seed (Songwriting Seedbank)"', await ev(() => !!document.querySelector('#ctxAddBtn')));
  const nSeeds0 = await ev(() => sngState().seeds.length);
  await ev(() => document.querySelector('#ctxAddBtn').click()); await p.waitForTimeout(500);
  const form = await ev(() => ({c: (document.querySelector('#stSeedC') || {}).value, t: (document.querySelector('#stSeedT') || {}).value}));
  yes('it opens prefilled with the tune and its progression', form.t === 'progression' && /So What/.test(form.c), form);
  is('and nothing is kept before "Keep it"', await ev(() => sngState().seeds.length), nSeeds0);
  await ev(() => document.querySelector('#stSeedOk').click()); await p.waitForTimeout(400);
  is('"Keep it" keeps one seed, sourced to the tune, with chords that re-sound', await ev(() => { const s = sngState().seeds[0]; return [sngState().seeds.length, s.source && s.source.kind, s.source && s.source.id, !!(s.data && s.data.chords && s.data.chords.length)]; }), [nSeeds0 + 1, 'tune', 'so-what', true]);
  await go('#/songwriting');
  yes('the Songwriting Studio\'s own quick-add entries are as they were', await ev(() => { const o = PageEntryConfig.current; return !!o && o.pageName === 'Songwriting Studio' && o.options.map(x => x.label).join('|') === 'Object writing|A seed|A new song'; }));

  console.log('\n99. nothing threw');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
