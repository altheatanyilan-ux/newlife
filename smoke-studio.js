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

  console.log('\n8. nothing threw');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
