/* smoke142 — the spiritual practice suite: four ways of sitting still, three
   symbolic systems to look into, and a log that keeps score of your hunches */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport:{width:1400, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const today_ = async () => { await p.evaluate(() => { if(location.hash === '#/today') rerender(); else location.hash = '#/today'; });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll('.toast').forEach(n => n.remove());
      const d = document.querySelector('#t-still'); if(d) d.open = true; });
    await p.waitForTimeout(200); };
  await today_();

  console.log('\n1. the deck is a whole deck');
  is('all 78 tarot cards', await p.evaluate(() => TAROT.length), 78);
  is('  22 major', await p.evaluate(() => TAROT.filter(c => c.s === 'major').length), 22);
  is('  and 56 minor, fourteen to a suit', await p.evaluate(() =>
    ['wands','cups','swords','pentacles'].map(s => TAROT.filter(c => c.s === s).length).join(',')), '14,14,14,14');
  yes('  every card has keywords and both meanings', await p.evaluate(() =>
    TAROT.every(c => c.n && c.k && c.k.length && c.u && c.v)));
  is('  no card is named after the old suit', await p.evaluate(() => TAROT.filter(c => /Coins/.test(c.n)).length), 0);
  is('all 64 hexagrams', await p.evaluate(() => ICHING.length), 64);
  is('  each with its own six lines', await p.evaluate(() => new Set(ICHING.map(h => h.b)).size), 64);
  yes('  numbered one to sixty-four in King Wen order', await p.evaluate(() =>
    ICHING.every((h, i) => h.i === i + 1)));
  yes('  and each carries a judgment and an image', await p.evaluate(() =>
    ICHING.every(h => h.n && h.c && h.j && h.m && h.k.length)));

  console.log('\n2. a reading deals real cards and keeps what you make of it');
  await p.evaluate(() => openTarot({spread:'three'})); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#dvDraw').click()); await p.waitForTimeout(500);
  /* the deal is a ceremony now: a moment to settle, a shuffle, and then a
     spread of backs to choose from — always more of them than the spread
     needs, because choosing from exactly as many as you need is not
     choosing */
  yes('a moment to settle comes first', await p.evaluate(() => !!document.querySelector('.dv-veil')));
  yes('  and it can be skipped', await p.evaluate(() => !!document.querySelector('.dv-veil .dv-skip')));
  await p.evaluate(() => document.querySelector('.dv-veil .dv-skip').click());
  await p.waitForTimeout(3000);
  is('a place for each position', await p.$$eval('.tc-slot', n => n.length), 3);
  yes('  with more backs to choose from than cards to be dealt',
      (await p.$$eval('.dv-pick', n => n.length)) > 3);
  yes('  and nothing face up yet', await p.evaluate(() => !document.querySelector('.tc.up')));
  /* Drawn without replacement: three cards from seventy-eight would collide
     only rarely by luck, so this asks the dealer itself, with the biggest
     spread, many times over. */
  const dupes = await p.evaluate(() => {
    let worst = 0;
    for(let i = 0; i < 300; i++){ const pick = tarotDraw(10).map(x => x.card);
      worst = Math.max(worst, pick.length - new Set(pick).size); }
    return worst; });
  is('  and no card comes up twice in one spread', dupes, 0);
  yes('  the meanings are hidden until they are turned', await p.evaluate(() => document.querySelector('#dvRead').hidden));
  for(let i = 0; i < 3; i++){
    await p.evaluate(j => document.querySelectorAll('.dv-pick:not(.taken)')[j * 2].click(), i);
    await p.waitForTimeout(1900);
  }
  await p.waitForTimeout(1800);
  is('choosing three turns three', await p.$$eval('.tc.up', n => n.length), 3);
  yes('turning them all shows what they mean', await p.evaluate(() => !document.querySelector('#dvRead').hidden));
  is('  one reading apiece', await p.$$eval('.dv-card-read', n => n.length), 3);
  yes('  each with more than a line of it', await p.evaluate(() =>
    [...document.querySelectorAll('.dv-card-read')].every(n => n.querySelectorAll('.dv-cr-t').length >= 2)));
  yes('  and questions to put to yourself', await p.evaluate(() =>
    [...document.querySelectorAll('.dv-card-read')].every(n => n.querySelectorAll('.dv-cr-q li').length >= 2)));
  yes('  three cards are read as one story', await p.evaluate(() =>
    (document.querySelector('.dv-story p')?.textContent || '').length > 80));
  const eB = await p.evaluate(() => S.entries.length);
  await p.evaluate(() => { document.querySelector('#dvText').value = 'It is about the move, not the job.';
    document.querySelector('#dvSave').click(); });
  await p.waitForTimeout(1000);
  is('  and keeping it makes a journal entry', await p.evaluate(() => S.entries.length), eB + 1);
  const read = await p.evaluate(() => S.entries[S.entries.length - 1]);
  is('  of the divination kind', read.type, 'divination');
  is('  with the three cards on it', read.extra.divination.cards.length, 3);
  yes('  and your reading, not the book\'s', /about the move/.test(read.body), read.body);
  /* a reversed card reads the other meaning, which is the whole reason to have one */
  const rev = await p.evaluate(() => { const c = tarotCard(0);
    return {up: c.upright.summary, down: c.reversed.summary, differ: c.upright.inDepth !== c.reversed.inDepth}; });
  yes('a reversed card means something else', rev.differ);

  /* every card carries the long version, not just a dictionary line */
  const depth = await p.evaluate(() => {
    const bad = [];
    for(let i = 0; i < 78; i++){
      const c = tarotCard(i);
      if(!c.imagery || !c.essence) bad.push(c.name + ': no picture');
      else if(!c.upright.inDepth || !c.reversed.inDepth) bad.push(c.name + ': no reading');
      else if(c.upright.questions.length < 2 || c.reversed.questions.length < 2) bad.push(c.name + ': no questions');
      else if(!c.positionGuidance || !c.positionGuidance.past || !c.positionGuidance.outcome) bad.push(c.name + ': no positions');
    }
    const majors = [...Array(22).keys()].map(i => tarotCard(i));
    return {bad: bad.slice(0, 4),
      majorParas: Math.min(...majors.map(c => c.upright.inDepth.split('\n\n').length)),
      minorParas: Math.min(...[...Array(56).keys()].map(i => tarotCard(i + 22).upright.inDepth.split('\n\n').length))};
  });
  is('  every one of the seventy-eight is written out', depth.bad.length, 0);
  yes('  the Major Arcana at length', depth.majorParas >= 3, depth.majorParas + ' paragraphs at the shortest');
  yes('  the Minor in proportion', depth.minorParas >= 2, depth.minorParas + ' paragraphs at the shortest');

  console.log('\n3. the coins actually decide the hexagram');
  const cast = await p.evaluate(() => {
    /* six tosses of three coins: 6 and 9 are the moving lines, and moving
       lines are what give the second hexagram */
    const totals = [];
    for(let i = 0; i < 400; i++) ichingCast().forEach(l => totals.push(l.total));
    return {kinds: [...new Set(totals)].sort(), moving: totals.filter(t => t === 6 || t === 9).length / totals.length};
  });
  is('a line is 6, 7, 8 or 9', cast.kinds.join(','), '6,7,8,9');
  yes('  and about a quarter of them move', cast.moving > .15 && cast.moving < .35, cast.moving.toFixed(2));
  const moved = await p.evaluate(() => {
    const lines = [{v:1,moving:true},{v:0,moving:false},{v:1,moving:false},{v:0,moving:false},{v:1,moving:false},{v:0,moving:false}];
    const rel = ichingRelating(lines);
    return {from: ichingLookup(ichingBinary(lines)).i, to: rel ? rel.i : null,
      none: ichingRelating(lines.map(l => ({...l, moving:false})))};
  });
  yes('a moving line turns one hexagram into another', moved.from !== moved.to, `${moved.from} → ${moved.to}`);
  is('  and with none, nothing is becoming anything', moved.none, null);
  await p.evaluate(() => closeModals());
  await p.evaluate(() => openIChing()); await p.waitForTimeout(400);
  for(let i = 0; i < 6; i++){ await p.evaluate(() => document.querySelector('#icToss').click()); await p.waitForTimeout(160); }
  /* the coins are thrown and land before the hexagram names itself */
  await p.waitForTimeout(1400);
  /* scoped to the hexagram being cast: the reading below it draws the one it
     is turning into as well */
  is('six tosses build six lines', await p.$$eval('#icLines .ic-line:not(.empty)', n => n.length), 6);
  is('  each numbered in the order it was cast', await p.$$eval('#icLines .ic-n', n => n.length), 6);
  is('  three coins are shown for the last throw', await p.$$eval('.ic-coin', n => n.length), 3);
  yes('  and name the hexagram', await p.evaluate(() => /^\d+\./.test(document.querySelector('.ic-res b')?.textContent || '')),
      await p.evaluate(() => document.querySelector('.ic-res b')?.textContent));
  yes('  with its trigrams', await p.evaluate(() => /above/.test(document.querySelector('.ic-tri')?.textContent || '')));
  yes('  the judgment is interpreted, not just quoted', await p.evaluate(() =>
    (document.querySelector('.ic-reading')?.textContent || '').length > 600));
  yes('  and the image with it', await p.evaluate(() =>
    [...document.querySelectorAll('.dv-sec-h')].some(h => /Image/.test(h.textContent))));
  /* the coins exist in order to single out particular lines; a reading that
     names the moving lines and does not say what they say has thrown the
     whole method away */
  const mv = await p.evaluate(() => ({moving: document.querySelectorAll('.ic-line.moving').length,
    given: document.querySelectorAll('.ic-lineread').length,
    becoming: !!document.querySelector('.ic-moving')}));
  is('  every changing line is given its own text', mv.given, mv.moving);
  is('  and a moving reading says what it is becoming', mv.becoming, mv.moving > 0);
  yes('  with questions to sit with', await p.$$eval('.ic-reading .dv-cr-q li', n => n.length >= 2));
  await p.evaluate(() => closeModals());

  /* every hexagram is written out, not only the ones that happened to come up */
  const hexDepth = await p.evaluate(() => {
    const bad = [];
    for(let i = 1; i <= 64; i++){
      const r = ichingRich(i);
      if(!r) { bad.push(i + ': missing'); continue; }
      if(r.d.split('\n\n').length < 2) bad.push(i + ': judgment too short');
      else if(!r.mi) bad.push(i + ': no image');
      else if(r.L.length !== 6 || r.L.some(x => !x)) bad.push(i + ': lines missing');
      else if(r.q.length < 2) bad.push(i + ': no questions');
    }
    return bad.slice(0, 4);
  });
  is('all sixty-four are written out, lines and all', hexDepth.length, 0);

  /* an oracle card is a sentence, and a sentence in a box is a notification:
     it is a card you turn over, with a note on how to sit with it */
  await p.evaluate(() => openOracle('elem')); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#orDraw').click()); await p.waitForTimeout(1600);
  yes('an oracle card is turned over', await p.evaluate(() => document.querySelector('#orCard')?.classList.contains('up')));
  yes('  drawn at a size worth looking at', await p.evaluate(() => {
    const r = document.querySelector('#orCard')?.getBoundingClientRect();
    return !!r && r.width >= 180 && r.height >= 250; }));
  yes('  and the deck says how to sit with it', await p.evaluate(() =>
    /breaths/.test(document.querySelector('.or-sit p')?.textContent || '')));
  yes('  each deck in its own words', await p.evaluate(() =>
    new Set(Object.values(ORACLE_SIT)).size === Object.keys(ORACLE_SIT).length));
  await p.evaluate(() => closeModals());

  console.log('\n4. the intuition log, and the check on it');
  await p.evaluate(() => { S.entries = S.entries.filter(e => e.type !== 'intuition'); saveNow(); });
  const imp = await p.evaluate(() => logIntuition({impression:'Thursday will be cancelled.', kind:'hunch',
    strength:4, state:'walking', verifiable:true, criteria:'Check whether the class ran.', checkOn: addDays(today(), -1)}).id);
  is('an impression is a journal entry', await p.evaluate(i => byId(S.entries, i).type, imp), 'intuition');
  yes('  it is not judged yet', await p.evaluate(i => intuitionOf(byId(S.entries, i)).outcome === null, imp));
  is('  and it comes due for checking', await p.evaluate(() => intuitionsDue().length), 1);
  await p.evaluate(i => openIntuitionVerify(i), imp); await p.waitForTimeout(400);
  yes('the check offers five outcomes', await p.$$eval('[data-io]', n => n.length === 5));
  await p.evaluate(() => { document.querySelector('[data-io="confirmed"]').click();
    document.querySelector('#ivNotes').value = 'It was.';
    document.querySelector('#ivSave').click(); });
  await p.waitForTimeout(900);
  is('  marking it records the outcome', await p.evaluate(i => intuitionOf(byId(S.entries, i)).outcome, imp), 'confirmed');
  is('  and it is no longer waiting', await p.evaluate(() => intuitionsDue().length), 0);
  /* "cannot tell yet" postpones rather than counting as a miss */
  const imp2 = await p.evaluate(() => logIntuition({impression:'A letter is coming.', kind:'knowing', strength:2,
    state:'drowsy', verifiable:true, criteria:'watch the post', checkOn: addDays(today(), -1)}).id);
  await p.evaluate(i => openIntuitionVerify(i), imp2); await p.waitForTimeout(400);
  await p.evaluate(() => { document.querySelector('[data-io="cant_verify"]').click(); document.querySelector('#ivSave').click(); });
  await p.waitForTimeout(900);
  const later = await p.evaluate(i => intuitionOf(byId(S.entries, i)), imp2);
  is('cannot-tell-yet leaves it unjudged', later.outcome, null);
  yes('  and puts it back in the diary', later.checkOn > (await p.evaluate(() => today())), later.checkOn);

  console.log('\n5. the score it keeps');
  await p.evaluate(() => {
    S.entries = S.entries.filter(e => e.type !== 'intuition');
    const mk = (kind, state, strength, outcome) => { const e = logIntuition({impression:'x', kind, state, strength, verifiable:true});
      intuitionOf(e).outcome = outcome; return e; };
    mk('hunch','walking',5,'confirmed'); mk('hunch','walking',4,'confirmed'); mk('hunch','walking',4,'partial');
    mk('dream','drowsy',2,'not_confirmed'); mk('dream','drowsy',3,'not_confirmed');
    mk('flash','relaxed',3,'confirmed'); mk('flash','relaxed',2,'not_confirmed');
    mk('knowing','active',3,'irrelevant');   /* left out of the rate entirely */
    saveNow(); });
  const st = await p.evaluate(() => intuitionStats(addDays(today(), -30), today()));
  is('everything logged is counted', st.total, 8);
  is('  but only what was actually judged is scored', st.judged, 7);
  is('  four of seven came true', st.hits, 4);
  is('  which is the hit rate', st.rate, 57);
  is('  the strongest channel is the one that keeps being right', st.bestChannel, 'hunch');
  is('  and the state that goes with it', st.bestState, 'walking');
  yes('  the ones that came true felt stronger at the time',
      st.strengthOfHits > st.strength, `${st.strengthOfHits} against ${st.strength}`);

  console.log('\n6. sitting still');
  await today_();
  yes('the section is on Today, under the theatre', await p.evaluate(() => {
    const ids = [...document.querySelectorAll('#main .page [id^="t-"]')].map(n => n.id);
    return ids.indexOf('t-still') > ids.indexOf('t-theatre'); }));
  is('  four ways in', await p.$$eval('[data-stkind]', n => n.length), 4);
  /* Drawn is not the same as wired. The whole section once rendered perfectly
     with every button dead, because the line that binds it was never added —
     so press them rather than merely finding them. */
  await p.evaluate(() => document.querySelector('[data-stkind="breath"]').click()); await p.waitForTimeout(900);
  is('pressing a tab changes the practice', await p.evaluate(() => stillness().prefs.kind), 'breath');
  yes('  and the pane follows', await p.evaluate(() => !!document.querySelector('[data-stpat]')));
  await p.evaluate(() => document.querySelector('[data-stmin="20"]').click()); await p.waitForTimeout(900);
  is('pressing a length sets it', await p.evaluate(() => stillness().prefs.minutes), 20);
  await p.evaluate(() => { document.querySelector('#t-still').open = true;
    document.querySelector('#stBegin').click(); });
  await p.waitForTimeout(700);
  yes('pressing begin starts a sitting', await p.evaluate(() => !!document.querySelector('.still-run')));
  yes('  with a circle that breathes', await p.evaluate(() => !!document.querySelector('.still-circle')));
  await p.evaluate(() => document.querySelector('#stillEnd').click()); await p.waitForTimeout(600);
  yes('  and ending it asks how it went', await p.evaluate(() => !!document.querySelector('#stDepth')));
  await p.evaluate(() => closeModals());
  await today_();
  await p.evaluate(() => { document.querySelector('#t-still').open = true; document.querySelector('#stDraw').click(); });
  await p.waitForTimeout(600);
  yes('the quick draw opens', await p.evaluate(() => !!document.querySelector('[data-qd]')));
  await p.evaluate(() => closeModals());
  await p.evaluate(() => { document.querySelector('#t-still').open = true; document.querySelector('#stIntuit').click(); });
  await p.waitForTimeout(600);
  yes('  and so does the intuition log', await p.evaluate(() => !!document.querySelector('#inText')));
  await p.evaluate(() => closeModals());
  await today_();
  /* breathwork draws the pattern it is actually running */
  const pat = await p.evaluate(() => BREATH_PATTERNS.find(x => x.id === 'calm'));
  is('the calming breath is in for three, out for six', `${pat.inh}/${pat.exh}`, '3/6');
  await p.evaluate(() => { const s = stillness();
    s.sessions = []; saveNow(); });
  await p.evaluate(() => saveStillSession({kind:'meditation', planned:10, actual:10, complete:true,
    depth:4, clarity:3, sensations:['warmth'], insight:''}));
  await today_();
  yes('a finished sitting is counted on the day', await p.evaluate(() => stillMinutesOn(today()) === 10));
  yes('  and shows in the heading', await p.evaluate(() =>
    /10 min today/.test(document.querySelector('#t-still summary')?.textContent || '')));
  is('  a streak starts at one', await p.evaluate(() => stillStreak()), 1);
  /* an insight from a sitting can become an impression to check later */
  await p.evaluate(() => { S.entries = S.entries.filter(e => e.type !== 'intuition'); saveNow(); });
  const n0 = await p.evaluate(() => intuitions().length);
  await p.evaluate(() => { const rec = saveStillSession({kind:'meditation', planned:5, actual:5, complete:true,
      depth:3, clarity:4, sensations:[], insight:'Call her.'});
    const e = logIntuition({impression:'Call her.', kind:'flash', strength:3, state:'relaxed',
      context:'during a meditation sitting', source:'stillness', sessionId:rec.id});
    rec.intuitionId = e.id; saveNow(); });
  is('what arrives in a sitting can be logged as an impression', await p.evaluate(() => intuitions().length), n0 + 1);
  is('  and knows where it came from', await p.evaluate(() =>
    intuitionOf(intuitions()[intuitions().length - 1]).source), 'stillness');

  console.log('\n7. the two kinds appear in the Lived Record');
  yes('divination and intuition are journal kinds',
      await p.evaluate(() => { migrateJournalTypes();
        return ['divination','intuition'].every(t => S.journals.some(j => j.type === t)); }));
  yes('  each with its own name and mark',
      await p.evaluate(() => typeName('divination') === 'Divination' && typeIcon('intuition') === '⚡'));
  await p.evaluate(() => { location.hash = '#/journals/divination'; rerender(); }); await p.waitForTimeout(1300);
  yes('  and the divination page draws the deal on the entry',
      await p.evaluate(() => !!document.querySelector('.dv-cards') || !!document.querySelector('.entry')));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke142  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
