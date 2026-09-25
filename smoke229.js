/* smoke229 — Score Practice: playing with a partner.

   WHAT IS CLAIMED. A score with more than one part has a Parts panel: each
   part is Mine, Partner, Show & Play or Silent; "I'm <part>" makes that part
   Mine and the rest Partners, "Listen to all" shows and plays everything.
   The drawn half of a role is the room's own part visibility and the heard
   half the player's own gain for the part — hiding never mutes, muting never
   hides. Mine is heard only as a guide (0–50%), and with "fade my guide" it
   drops a step at every loop (20 → 10 → 5 → 0%), said as "Guide: 10% ·
   loop 3". Two Mine parts are allowed, a third replaces the first. One hand
   of a two-staff part can be Mine. The Partner parts can be shown small in a
   cue strip above, with their own lit bar. A fermata is held 1.5×, 2×, 3× or
   until you say so; a section can have its own tempo, ramped when it has an
   end tempo, and a rit. written in it is pointed out; the space bar can lead
   the tempo while it plays; with a MIDI keyboard the partner waits for your
   notes, lit on the page. The roles are kept with the piece. A score with no
   tempo asks for one once and keeps it; a road sign the player cannot follow
   is said, quietly; a single part has no Parts panel but can still be
   practised hand by hand. A sitting logged after playing along is pre-filled
   — with the partner, the tempo as a percentage, the guide at the end, the
   loops — and the notebook's tempo chart draws the partner sittings as their
   own line.

   HOW IT COULD BE WRONG AND STILL PASS. Audio is counted, not listened to:
   notes booked on each instrument and the gains set for each part. The MIDI
   keyboard is handed in by a test hook (no device exists here).

   Run: NODE_PATH=node_modules node smoke229.js */
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

const note = (step, oct, dur, extra = '', staff = 0) => `<note><pitch><step>${step}</step><octave>${oct}</octave></pitch><duration>${dur}</duration>${extra}<voice>${staff || 1}</voice>${staff ? `<staff>${staff}</staff>` : ''}</note>`;
const head = (title, parts) => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>${title}</work-title></work><part-list>${parts}</part-list>`;
const attrs = (clef, extra = '') => `<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time>${extra}${clef}</attributes>`;
const G = '<clef><sign>G</sign><line>2</line></clef>', F = '<clef><sign>F</sign><line>4</line></clef>';
const tempo = bpm => `<direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`;
const words = w => `<direction><direction-type><words>${w}</words></direction-type></direction>`;
const bars = (n, fn) => [...Array(n)].map((_, i) => `<measure number="${i + 1}">${fn(i + 1)}</measure>`).join('');
/* a violin and a piano, eight bars of whole notes at ♩=120, a rit. written in bar 4 */
const DUET = head('Sonata for Two', `<score-part id="P1"><part-name>Violin</part-name><score-instrument id="P1-I1"><instrument-name>Violin</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>41</midi-program></midi-instrument></score-part>
  <score-part id="P2"><part-name>Piano</part-name><midi-instrument id="P2-I1"><midi-channel>2</midi-channel><midi-program>1</midi-program></midi-instrument></score-part>`)
  + `<part id="P1">${bars(8, n => (n === 1 ? attrs(G) + tempo(120) : '') + (n === 4 ? words('rit.') : '') + note('A', 4, 4))}</part>`
  + `<part id="P2">${bars(8, n => (n === 1 ? attrs(F) : '') + note('A', 2, 4))}</part></score-partwise>`;
/* a piano piece on two staves, one part */
const SOLO = head('Invention', `<score-part id="P1"><part-name>Piano</part-name></score-part>`)
  + `<part id="P1">${bars(4, n => (n === 1 ? `<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>` + tempo(100) : '')
    + note('C', 5, 4, '', 1) + '<backup><duration>4</duration></backup>' + note('C', 3, 4, '', 2))}</part></score-partwise>`;
/* no tempo marked anywhere */
const BARE = head('Air', `<score-part id="P1"><part-name>Piano</part-name></score-part>`)
  + `<part id="P1">${bars(4, n => (n === 1 ? attrs(G) : '') + note('E', 4, 4))}</part></score-partwise>`;
/* a D.S. written only as words */
const SIGN = head('Minuet', `<score-part id="P1"><part-name>Piano</part-name></score-part>`)
  + `<part id="P1">${bars(4, n => (n === 1 ? attrs(G) + tempo(90) : '') + (n === 3 ? words('D.S. al Fine') : '') + note('G', 4, 4))}</part></score-partwise>`;
/* a fermata held in bar 1, ♩=60 */
const HELD = head('Chorale', `<score-part id="P1"><part-name>Violin</part-name><midi-instrument id="P1-I1"><midi-program>41</midi-program></midi-instrument></score-part><score-part id="P2"><part-name>Piano</part-name></score-part>`)
  + `<part id="P1">${bars(3, n => (n === 1 ? attrs(G) + tempo(60) : '') + note('C', 5, 4, n === 1 ? '<notations><fermata/></notations>' : ''))}</part>`
  + `<part id="P2">${bars(3, n => (n === 1 ? attrs(F) : '') + note('C', 3, 4, n === 1 ? '<notations><fermata/></notations>' : ''))}</part></score-partwise>`;
const TRIO = head('Trio', ['Violin', 'Cello', 'Piano'].map((n, i) => `<score-part id="P${i + 1}"><part-name>${n}</part-name></score-part>`).join(''))
  + [1, 2, 3].map(i => `<part id="P${i}">${bars(2, n => (n === 1 ? attrs(G) : '') + note('C', 4 + (i % 2), 4))}</part>`).join('') + '</score-partwise>';

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required']});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1300, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const take = (xml, name) => p.evaluate(async ([xml, name]) => (await takeScoreFile(new File([xml], name))).id, [xml, name]);
  const open = async id => { await p.evaluate(id => { const u = scoreUi(); u.focus = null; u.ensOpen = true; location.hash = '#/score/' + id; }, id); await p.waitForTimeout(3500); };
  const ids = {duet: await take(DUET, 'Sonata for Two.musicxml'), solo: await take(SOLO, 'Invention.musicxml'),
    bare: await take(BARE, 'Air.musicxml'), sign: await take(SIGN, 'Minuet.musicxml'), held: await take(HELD, 'Chorale.musicxml')};

  console.log('\n1. what is kept with the piece');
  const D0 = await p.evaluate(id => { const x = scoreById(id); return Object.keys(x.ensembleSettings).sort(); }, ids.duet);
  yes('ensembleSettings carries the document\'s fields', ['countInBars', 'defaultTempo', 'fermataHold', 'guideFadeEnabled', 'guideFadeSteps', 'guideVolume',
    'mineStaffOnly', 'partRoles', 'partVolumes', 'sectionTempoOverrides', 'showCueStrip', 'tempoPercent'].every(k => D0.includes(k)), D0);
  is('  the guide fades 20% → 10% → 5% → 0% unless told otherwise, and a fermata is held twice as long',
    await p.evaluate(id => { const e = scoreById(id).ensembleSettings; return [e.guideFadeSteps, e.fermataHold, e.guideVolume]; }, ids.duet), [[0.2, 0.1, 0.05, 0], 2, 0]);
  const T3 = await p.evaluate(xml => {
    const tl = musicXmlTimeline(xml), x = {hidden: []}; ensembleDefaults(x);
    const before = ensembleRoles(x, tl);
    setEnsembleRole(x, tl, 0, 'mine'); setEnsembleRole(x, tl, 1, 'mine');
    const two = ensembleRoles(x, tl);
    setEnsembleRole(x, tl, 2, 'mine');
    return {before, two, three: ensembleRoles(x, tl), hidden: x.hidden,
      none: (() => { const y = {hidden: []}; ensembleDefaults(y); setEnsembleRole(y, tl, 0, 'partner'); setEnsembleRole(y, tl, 1, 'silent');
        return setEnsembleRole(y, tl, 2, 'partner'); })()};
  }, TRIO);
  is('every part starts as Show & Play (what the room did before)', T3.before, ['show_play', 'show_play', 'show_play']);
  is('  two parts can be Mine', T3.two, ['mine', 'mine', 'show_play']);
  is('  a third Mine takes the place of the first, which becomes a Partner (hidden)', [T3.three, T3.hidden], [['partner', 'mine', 'mine'], [0]]);
  is('  and nothing is ever left on the page', T3.none, false);

  console.log('\n2. the Parts panel');
  await open(ids.duet);
  const P0 = await p.evaluate(() => { const e = document.getElementById('scEns');
    return {shown: !e.hidden, tog: (e.querySelector('#scEnsTog') || {}).textContent, presets: [...e.querySelectorAll('[data-enspreset]')].map(b => b.textContent),
      rows: e.querySelectorAll('[data-ensrow]').length, roles: [...e.querySelectorAll('[data-ensrow="0"] [data-ensrole]')].map(b => b.textContent.replace('● ', '')),
      inst: (e.querySelector('[data-ensrow="0"] .sc-ens-name i') || {}).textContent}; });
  yes('a duet has a Parts panel: a row for each part, the four roles, and the quick presets',
    P0.shown && /Parts/.test(P0.tog) && P0.rows === 2 && P0.roles.join() === 'Mine,Partner,Show & Play,Silent'
    && P0.presets.join() === "I'm Violin,I'm Piano,Listen to all", P0);
  is('  and says what each part is played on', P0.inst, 'Violin');
  await p.click('[data-enspreset="0"]'); await p.waitForTimeout(1500);
  const P1 = await p.evaluate(id => { const x = scoreById(id), v = scoreView();
    const tl = ensTimeline(x);
    return {roles: ensembleRoles(x, tl), hidden: x.hidden, visible: v.osmd.Sheet.Instruments.map(i => i.Visible), stored: x.ensembleSettings.partRoles,
      mix: ensembleMix(x, tl), checks: [...document.querySelectorAll('[data-scpart]')].map(c => c.checked),
      eye: [...document.querySelectorAll('[data-enseye]')].map(b => b.textContent), ear: [...document.querySelectorAll('[data-ensear]')].map(b => b.textContent)}; }, ids.duet);
  is('"I\'m Violin": the violin is Mine, the piano the Partner', P1.roles, ['mine', 'partner']);
  is('  the piano is off the page (and off in the parts bar), the violin on it', [P1.hidden, P1.visible, P1.checks], [[1], [true, false], [true, false]]);
  is('  and heard: the piano at full, the violin not at all (no guide yet)', P1.mix, {muted: ['p:0'], volumes: {1: 1}});
  is('  shown as 👁 Show / 🔇 Guide and 🙈 Hidden / 🔊 Plays', [P1.eye, P1.ear], [['👁 Show', '🙈 Hidden'], ['🔇 Guide', '🔊 Plays']]);
  await p.evaluate(() => { const r = document.querySelector('[data-ensguide]'); r.value = 20; r.oninput(); r.onchange(); });
  is('the guide at 20%: the violin is heard, quietly', await p.evaluate(id => { const x = scoreById(id); return ensembleMix(x, ensTimeline(x)); }, ids.duet),
    {muted: [], volumes: {0: 0.2, 1: 1}});
  /* the two halves are independent */
  await p.evaluate(() => { const c = document.querySelector('[data-scpart="1"]'); c.checked = true; c.onchange(); }); await p.waitForTimeout(1200);
  const V1 = await p.evaluate(id => { const x = scoreById(id), tl = ensTimeline(x); return {roles: ensembleRoles(x, tl), mix: ensembleMix(x, tl)}; }, ids.duet);
  yes('ticking the piano back on in the parts bar shows it and keeps it heard (Partner → Show & Play)', V1.roles[1] === 'show_play' && V1.mix.volumes[1] === 1, V1);
  await p.click('[data-ensear="1"]'); await p.waitForTimeout(400);
  const V2 = await p.evaluate(id => { const x = scoreById(id), tl = ensTimeline(x); return {roles: ensembleRoles(x, tl), hidden: x.hidden, mix: ensembleMix(x, tl)}; }, ids.duet);
  /* shown and not heard at full is what Mine is: the piano is now a second
     part of yours, heard only as the guide, and still on the page */
  yes('  🔊 → 🔇 on a shown part makes it yours too — heard only as the guide (20%), still on the page',
    V2.hidden.length === 0 && V2.roles[1] === 'mine' && V2.mix.volumes[1] === 0.2, V2);
  await p.click('[data-enspreset="all"]'); await p.waitForTimeout(1200);
  is('"Listen to all": every part shown and heard, the guide off', await p.evaluate(id => { const x = scoreById(id), tl = ensTimeline(x);
    return [ensembleRoles(x, tl), x.hidden, x.ensembleSettings.guideVolume, ensembleMix(x, tl)]; }, ids.duet),
    [['show_play', 'show_play'], [], 0, {muted: [], volumes: {0: 1, 1: 1}}]);
  await p.click('[data-enspreset="0"]'); await p.waitForTimeout(1200);
  await p.evaluate(() => { const r = document.querySelector('[data-ensvol="1"]'); r.value = 60; r.oninput(); r.onchange(); });
  /* kept with the piece */
  await p.evaluate(() => saveNow()); await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(1500);
  await open(ids.duet);
  const K = await p.evaluate(id => { const x = scoreById(id), tl = ensTimeline(x);
    return {roles: ensembleRoles(x, tl), vol: x.ensembleSettings.partVolumes.P2, on: [...document.querySelectorAll('[data-enspreset].on')].map(b => b.textContent)}; }, ids.duet);
  is('opened again the next day, it is still "I\'m Violin", the piano at 60%', [K.roles, K.vol, K.on], [['mine', 'partner'], 0.6, ["I'm Violin"]]);

  console.log('\n3. hearing it');
  const H = await p.evaluate(async id => {
    const x = scoreById(id), tl = ensTimeline(x);
    const count = async mix => { const was = plxPiano, seen = {piano: 0}; const s0 = _instr.stats.sampled;
      plxPiano = (...a) => { seen.piano++; return was(...a); };
      try { await instrumentLoad('violin');
        const ctx = new OfflineAudioContext(1, 44100 * 5, 44100);
        scorePlayer(tl, {bpm: 240, muted: new Set(mix.muted), volumes: mix.volumes, synth: true}).start(ctx);
        await ctx.startRendering(); } finally { plxPiano = was; }
      return {violin: _instr.stats.sampled - s0, piano: seen.piano}; };
    const e = x.ensembleSettings;
    const g0 = e.guideVolume; e.guideVolume = 0;
    const silent = await count(ensembleMix(x, tl));
    e.guideVolume = 0.2;
    const guided = await count(ensembleMix(x, tl));
    e.guideVolume = g0;
    return {silent, guided};
  }, ids.duet);
  yes('with no guide only the partner is heard: the piano plays, the violin books nothing', H.silent.violin === 0 && H.silent.piano > 0, H);
  yes('  with a guide the violin is played too', H.guided.violin > 0, H);

  console.log('\n4. the guide fades each loop');
  await p.evaluate(() => { const f = document.querySelector('[data-ensfade]'); f.checked = true; f.onchange(); });
  await p.evaluate(id => { const x = scoreById(id); x.playback = Object.assign({}, x.playback, {loop: true, loopRange: [1, 1], pct: 150, countIn: 0});
    x.ensembleSettings.guideVolume = 0.2; saveNow(); rerender(); }, ids.duet);
  await p.waitForTimeout(3000);
  await p.click('#scPlayRow [data-plxgo]');
  await p.waitForFunction(() => { const c = document.querySelector('#scPlayRow .plx-bar')._plx; return c.player && c.player.running; }, null, {timeout: 15000});
  const F0 = await p.evaluate(() => document.getElementById('scGuideSay').textContent);
  await p.waitForFunction(() => _ens.run && _ens.run.loops >= 2, null, {timeout: 15000});
  const F1 = await p.evaluate(() => ({say: document.getElementById('scGuideSay').textContent, guide: _ens.run.guide,
    heard: document.querySelector('#scPlayRow .plx-bar')._plx.player.opts.volumes[0]}));
  is('"Guide: 20% · loop 1" when it starts', F0, 'Guide: 20% · loop 1');
  yes('  and a step quieter at each loop: "Guide: 5% · loop 3", and the player hears it', F1.say === 'Guide: 5% · loop 3' && F1.guide === 0.05 && F1.heard === 0.05, F1);
  await p.waitForFunction(() => _ens.run && _ens.run.loops >= 3, null, {timeout: 15000});
  const F2 = await p.evaluate(() => ({say: document.getElementById('scGuideSay').textContent,
    muted: [...document.querySelector('#scPlayRow .plx-bar')._plx.player.opts.muted]}));
  yes('  until it is gone: "Guide: 0%", the violin not heard at all', /^Guide: 0% · loop 4$/.test(F2.say) && F2.muted.includes('p:0'), F2);

  console.log('\n5. the partner, small, above');
  await p.click('[data-enscue]'); await p.waitForTimeout(3000);
  const C0 = await p.evaluate(() => { const c = document.getElementById('scCue');
    return {shown: !c.hidden, svg: !!c.querySelector('.sc-cue-in svg'), name: c.querySelector('[data-cuename]').textContent,
      oneLine: (() => { const s = c.querySelector('.sc-cue-in svg'); return s ? s.getBoundingClientRect().height < 160 : false; })(),
      parts: _cue.osmd ? _cue.osmd.Sheet.Instruments.map(i => i.Visible) : null}; });
  is('"show the partner as a small cue strip": the piano, engraved small, on one line above the score', [C0.shown, C0.svg, C0.name, C0.oneLine, C0.parts],
    [true, true, 'Piano', true, [false, true]]);
  await p.waitForTimeout(700);
  const C1 = await p.evaluate(() => { const h = document.querySelector('#scCue .sc-cue-in > .plx-hl'); return {lit: !!h && !h.hidden, left: h ? parseFloat(h.style.left) : null}; });
  yes('  with its own lit bar, following the music', C1.lit && C1.left >= 0, C1);
  await p.click('#scPlayRow [data-plxstop]'); await p.waitForTimeout(300);
  const L0 = await p.evaluate(() => _ens.last);
  yes('stopping ends the run, and remembers it for the log (with the partner, 150%, the guide at 0, the loops)',
    L0 && L0.withPartner === true && L0.pct === 150 && L0.guide === 0 && L0.loops >= 3, L0);

  console.log('\n6. logging the sitting');
  await p.evaluate(id => openScoreLogModal(id), ids.duet); await p.waitForTimeout(300);
  const LG = await p.evaluate(() => ({partner: document.getElementById('logPartner').checked, pct: document.getElementById('logPct').value,
    guide: document.getElementById('logGuide').value, loops: +document.getElementById('logLoops').value, tempo: document.getElementById('logTempo').value}));
  yes('the log is filled in from the run: with the partner, 150%, guide 0%, the loops, ♩=180', LG.partner && LG.pct === '150' && LG.guide === '0' && LG.loops >= 3 && LG.tempo === '180', LG);
  await p.click('#logSave'); await p.waitForTimeout(300);
  const R = await p.evaluate(id => { const x = scoreById(id), r = x.practice[x.practice.length - 1];
    return {w: r.withPartnerPlayback, pct: r.tempoPercent, g: r.finalGuideLevel, l: r.loopsCompleted >= 3}; }, ids.duet);
  is('  and kept on the sitting', R, {w: true, pct: 150, g: 0, l: true});
  const NB = await p.evaluate(id => { const x = scoreById(id), u = scoreUi(); u.side = 'notebook';
    const add = (tempo, partner) => logScorePractice(id, null, 20, {tempo, withPartnerPlayback: partner, tempoPercent: partner ? 80 : null});
    add(70, false); add(78, false); add(74, true); add(82, true); scoreSidePaint(x);
    return {say: document.querySelector('.sc-sitting-p') ? document.querySelector('.sc-sitting-p').textContent : '',
      s1: !!document.querySelector('.sc-nb-chart .sc-nb-s1'), s2: !!document.querySelector('.sc-nb-chart .sc-nb-s2'),
      hollow: document.querySelectorAll('.sc-nb-chart .sc-nb-d2').length, legend: document.querySelector('.sc-nb-legend') ? document.querySelector('.sc-nb-legend').textContent.replace(/\s+/g, ' ').trim() : ''}; }, ids.duet);
  yes('the notebook says how it was played ("with the partner · 80% of the score\'s tempo")', /with the partner · 80% of the score's tempo/.test(NB.say), NB);
  yes('  and the tempo chart draws the partner sittings as a second line, with a legend', NB.s1 && NB.s2 && NB.hollow === 3 && NB.legend === 'on your own with the partner', NB);

  console.log('\n7. a section\'s own tempo');
  await p.evaluate(id => { const x = scoreById(id); addScoreSection(id, {name: 'Close', startMeasure: 3, endMeasure: 4}); scoreUi().side = 'marks';
    x.playback = Object.assign({}, x.playback, {loopRange: null, loop: false, pct: 100}); saveNow(); rerender(); }, ids.duet);
  await p.waitForTimeout(3000);
  const S0 = await p.evaluate(() => { const t = document.querySelector('.sc-sec-tempo'); return t ? t.textContent.replace(/\s+/g, ' ').trim() : ''; });
  yes('beside the section: "tempo score ♩=120 custom", and the rit. written in it pointed out', /tempo score ♩=120 custom/.test(S0) && /rit\. marked/.test(S0), S0);
  await p.click('[data-sectcustom]'); await p.waitForTimeout(300);
  await p.evaluate(() => { const a = document.querySelector('[data-sectstart]'); a.value = 60; a.onchange(); });
  await p.evaluate(() => { const z = document.querySelector('[data-sectend]'); z.value = 30; z.onchange(); });
  await p.waitForTimeout(300);
  const S1 = await p.evaluate(id => { const x = scoreById(id), tl = ensTimeline(x);
    const ov = ensembleOverrides(x, tl);
    const pl = scorePlayer(tl, {overrides: ov});
    return {ov, stored: Object.values(x.ensembleSettings.sectionTempoOverrides)[0],
      secs: +pl.secs(8, 16).toFixed(2), before: +pl.secs(0, 8).toFixed(2), mid: Math.round(pl.bpmAt(12)), after: pl.bpmAt(20)}; }, ids.duet);
  is('custom ♩=60 → 30 is kept, and plays bars 3–4 only', [S1.stored, S1.ov], [{startBpm: 60, endBpm: 30}, [{q0: 8, q1: 16, start: 60, end: 30}]]);
  is('  ramping across them: 16·ln2 = 11.09 s rather than 4, ♩=45 halfway; the score\'s ♩=120 either side',
    [S1.secs, S1.before, S1.mid, S1.after], [11.09, 4, 45, 120]);

  console.log('\n8. fermatas');
  await open(ids.held);
  await p.click('[data-enspreset="0"]'); await p.waitForTimeout(1500);
  const W0 = await p.evaluate(() => [...document.querySelectorAll('[data-enshold]')].map(b => b.textContent));
  is('a fermata is held 1.5×, 2×, 3× or until you say', W0, ['1.5×', '2×', '3×', 'wait for me']);
  await p.click('[data-enshold="3"]'); await p.waitForTimeout(200);
  is('  3×: the first bar (a held whole note at ♩=60) lasts twelve seconds', await p.evaluate(id => { const x = scoreById(id), tl = ensTimeline(x);
    return +scorePlayer(tl, {fermata: x.ensembleSettings.fermataHold}).secs(0, 4).toFixed(2); }, ids.held), 12);
  await p.click('[data-enshold="wait"]'); await p.waitForTimeout(200);
  is('  "wait for me": it waits where the held note ends', await p.evaluate(id => { const x = scoreById(id); return ensembleGates(x, ensTimeline(x)); }, ids.held), [4]);
  await p.evaluate(id => { const x = scoreById(id); x.playback = Object.assign({}, x.playback, {pct: 400, countIn: 0}); saveNow(); rerender(); }, ids.held);
  await p.waitForTimeout(3000);
  await p.click('#scPlayRow [data-plxgo]');
  await p.waitForFunction(() => { const c = document.querySelector('#scPlayRow .plx-bar')._plx; return c.player && c.player.waiting === 4; }, null, {timeout: 15000});
  await p.waitForTimeout(400);
  const W1 = await p.evaluate(() => { const c = document.getElementById('scEnsWait'); return {chip: c && !c.hidden ? c.textContent : '', pos: document.querySelector('#scPlayRow .plx-bar')._plx.player.position()}; });
  yes('  playing, it holds there and says so', /𝄐 held/.test(W1.chip) && W1.pos === 4, W1);
  await p.keyboard.press('Space'); await p.waitForTimeout(700);
  const W2 = await p.evaluate(() => { const c = document.querySelector('#scPlayRow .plx-bar')._plx; return {waiting: c.player && c.player.waiting, pos: c.player && c.player.position(), running: c.player && c.player.running}; });
  yes('  and space lets it go on', W2.waiting === null && W2.pos > 4 && W2.running, W2);
  await p.click('#scPlayRow [data-plxstop]');

  console.log('\n9. waiting for your notes (MIDI)');
  /* the browser has not been asked whether the page may hear a keyboard, so
     there is at most a small button to ask it — never the option itself */
  is('with no MIDI keyboard "wait for my notes" is not there', await p.evaluate(() => !document.querySelector('[data-ensmidi]')), true);
  await p.evaluate(() => { _ens.midi.fake = 1; ensMidiPaint(); });
  yes('  with one, "wait for my notes (MIDI)"', await p.evaluate(() => /wait for my notes/.test(document.getElementById('scEnsMidi').textContent)));
  await p.evaluate(() => { const c = document.querySelector('[data-ensmidi]'); c.checked = true; c.onchange(); });
  await p.click('[data-enshold="2"]'); await p.waitForTimeout(200);
  await p.click('#scPlayRow [data-plxrew]'); await p.waitForTimeout(100);
  await p.click('#scPlayRow [data-plxgo]');
  await p.waitForFunction(() => { const c = document.querySelector('#scPlayRow .plx-bar')._plx; return c.player && c.player.waiting === 0; }, null, {timeout: 15000});
  await p.waitForTimeout(300);
  const M0 = await p.evaluate(() => ({chip: document.getElementById('scEnsWait').textContent, lit: document.querySelectorAll('#scWaitMarks .sc-wait-dot').length}));
  yes('at your first note it waits: "waiting for C", the note lit on the page', /waiting for C$/.test(M0.chip) && M0.lit === 1, M0);
  const M1 = await p.evaluate(() => ({wrong: ensembleNoteIn(62)}));
  const M2 = await p.evaluate(() => ({right: ensembleNoteIn(72), waiting: document.querySelector('#scPlayRow .plx-bar')._plx.player.waiting}));
  yes('  a D does not let it go; the C does (any octave)', M1.wrong === false && M2.right === true && M2.waiting === null, [M1, M2]);
  await p.waitForFunction(() => { const c = document.querySelector('#scPlayRow .plx-bar')._plx; return c.player && c.player.waiting != null && c.player.waiting > 0; }, null, {timeout: 20000});
  is('  then waits again at your next note', await p.evaluate(() => document.querySelector('#scPlayRow .plx-bar')._plx.player.waiting), 4);
  await p.click('#scPlayRow [data-plxstop]');
  await p.evaluate(id => { const x = scoreById(id); x.ensembleSettings.midiWait = false; _ens.midi.fake = 0; saveNow(); }, ids.held);

  console.log('\n10. leading with the space bar');
  await open(ids.duet);
  await p.evaluate(() => { const t = document.querySelector('[data-enstap]'); t.checked = true; t.onchange(); });
  await p.click('#scPlayRow [data-plxgo]');
  await p.waitForFunction(() => { const c = document.querySelector('#scPlayRow .plx-bar')._plx; return c.player && c.player.running; }, null, {timeout: 15000});
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  for(let i = 0; i < 5; i++){ await p.keyboard.press('Space'); await p.waitForTimeout(400); }
  const TP = await p.evaluate(() => { const c = document.querySelector('#scPlayRow .plx-bar')._plx; return {running: c.player.running, pct: c.tempoPct(), bpm: c.bpm()}; });
  yes('five taps at 150 a minute take the ♩=120 piece to about ♩=150, and it keeps playing', TP.running && TP.bpm >= 135 && TP.bpm <= 165, TP);
  await p.click('#scPlayRow [data-plxstop]');
  await p.evaluate(id => { const x = scoreById(id); x.ensembleSettings.tapTempo = false; x.playback.pct = 100; saveNow(); }, ids.duet);

  console.log('\n11. a piece on its own');
  await open(ids.solo);
  const O = await p.evaluate(() => { const e = document.getElementById('scEns');
    return {tog: e.querySelector('#scEnsTog').textContent, rows: e.querySelectorAll('[data-ensrow]').length, presets: e.querySelectorAll('[data-enspreset]').length,
      solo: [...e.querySelectorAll('[data-enssolo]')].map(b => b.textContent)}; });
  yes('one part: no Parts panel, but "Practise with it" — listen, or play it, or one hand of it', /Practise with it/.test(O.tog) && O.rows === 0 && O.presets === 0
    && O.solo.join() === 'nothing — I listen,both hands,the right hand,the left hand', O);
  await p.click('[data-enssolo="1"]'); await p.waitForTimeout(300);
  is('  "the right hand": the left is played for you, the right is yours (silent until a guide is set)',
    await p.evaluate(id => { const x = scoreById(id); return ensembleMix(x, ensTimeline(x)); }, ids.solo), {muted: ['p:0:s:1'], volumes: {0: 1, '0:1': 0, '0:2': 1}});

  console.log('\n12. a score with no tempo; a sign it cannot follow');
  await open(ids.bare);
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(2500);
  const N0 = await p.evaluate(() => { const m = document.querySelector('#modals .overlay'); return m ? m.textContent.replace(/\s+/g, ' ') : ''; });
  yes('the first ▶ asks: "This score has no tempo marking. Set a tempo:"', /This score has no tempo marking\. Set a tempo:/.test(N0), N0);
  await p.fill('#ensTempoIn', '72'); await p.click('#ensTempoGo'); await p.waitForTimeout(1500);
  const N1 = await p.evaluate(id => { const c = document.querySelector('#scPlayRow .plx-bar')._plx;
    return {kept: scoreById(id).ensembleSettings.defaultTempo, running: !!(c.player && c.player.running), bpm: c.bpm(), say: document.querySelector('#scPlayRow [data-plxscore]').textContent}; }, ids.bare);
  is('  kept with the piece, and played at it', N1, {kept: 72, running: true, bpm: 72, say: '(no tempo marked: ♩ = 72)'});
  await p.click('#scPlayRow [data-plxstop]'); await p.waitForTimeout(200);
  await p.click('#scPlayRow [data-plxgo]'); await p.waitForTimeout(800);
  yes('  and never asked again', await p.evaluate(() => !document.querySelector('#modals .overlay') && document.querySelector('#scPlayRow .plx-bar')._plx.player.running));
  await p.click('#scPlayRow [data-plxstop]');
  await open(ids.sign);
  const DS = await p.evaluate(() => { const n = document.querySelector('#scPlayRow [data-plxnote]'); return {shown: n && !n.hidden, text: n && n.textContent,
    drawn: !!document.querySelector('#scCanvas svg')}; });
  yes('"Playback may differ from the score at m. 3: a D.S. written only as words" — and the score is still drawn',
    DS.shown && /^Playback may differ from the score at m\. 3: a D\.S\. written only as words/.test(DS.text) && DS.drawn, DS);

  console.log('\n13. on a phone');
  await p.setViewportSize({width: 390, height: 844});
  await open(ids.duet);
  const PH = await p.evaluate(() => ({over: document.documentElement.scrollWidth - innerWidth, panel: document.getElementById('scEns').getBoundingClientRect().width}));
  yes('the Parts panel fits 390px without scrolling sideways', PH.over <= 1 && PH.panel <= 390, PH);

  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
