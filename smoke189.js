/* smoke189 — the Piano Studio.

   Two systems on one bench, and the reason they are two is that they answer
   different questions. "What could I play if somebody asked me right now" is
   a repertoire question, and it is answered by a list of finished things.
   "Can I hear a ii-V-I in Ab and put my hands on it" is not a question about
   pieces at all, and no list of pieces answers it.

   The claims worth checking are the ones where the studio decides something
   rather than storing it:

   RUST is not a state anybody sets. It is a fact about a date, so it is
   computed — which means practising a piece stops it being rusty by itself,
   with nothing to remember to un-tick, and the player's own word for the
   piece survives underneath.

   THE TWELVE KEYS move one rung per sitting, and stop one short of the top.
   "Second nature" is a claim about not thinking, and a log cannot make it —
   only the player can, on the key's own panel.

   THE SUGGESTION spends a budget in three places, in the order things are
   lost: what you are about to lose, what you are in the middle of, what
   stays good only because you play it. It leaves minutes over on purpose.

   And the bench is wired into the house: practice hours land on the Piano
   skill if there is one, the piano habit keeps itself, and the weekly review
   says what happened — but none of it invents anything. No piano skill on
   the tree means no credit, because a skill that appears because you
   practised is a skill you did not choose to track. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport:{width:1400, height:1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2000); }

  console.log('\n1. the room opens, and it has two halves');
  await p.evaluate(() => { location.hash = '#/piano'; }); await p.waitForTimeout(1600);
  yes('the page is there', await p.evaluate(() => !!document.querySelector('.pn-page')));
  is('  with two tabs', await p.evaluate(() =>
    [...document.querySelectorAll('[data-pntab]')].map(x => x.dataset.pntab)), ['repertoire','jazz']);
  /* the Fazioli is the other way in, and it used to open the skill tree —
     which is a picture of the practice rather than the room you sit down in */
  const wentTo = await p.evaluate(() => { const was = location.hash;
    HOUSE_PORTALS.piano(); const to = location.hash; location.hash = was; return to; });
  is('  and the Fazioli in the main room opens it', wentTo, '#/piano');

  console.log('\n2. a piece, and the states it moves through');
  const id = await p.evaluate(() => {
    const x = newPiece('s189 Ballade No. 1'); x.composer = 'Chopin'; x.status = 'polished';
    x.duration = 10; pianoState().pieces.push(x); saveNow(); return x.id; });
  is('it is on the stand', await p.evaluate(i => pianoPiece(i).title, id), 's189 Ballade No. 1');
  is('  and it reads as polished', await p.evaluate(i => pianoShownStatus(pianoPiece(i)), id), 'polished');
  yes('  which means you could play it right now', await p.evaluate(i => pianoIsReady(pianoPiece(i)), id));

  console.log('\n3. rust is worked out from the dates, not set by hand');
  await p.evaluate(i => { pianoState().practiceLogs.push({id:uid(), pieceId:i,
    date:addDays(today(), -45), durationMinutes:30, sections:[], quality:'good'}); saveNow(); }, id);
  is('45 days untouched reads as rusty', await p.evaluate(i => pianoShownStatus(pianoPiece(i)), id), 'rusty');
  is('  but the word the player chose is still underneath',
    await p.evaluate(i => pianoPiece(i).status, id), 'polished');
  yes('  and it is not offered as ready', await p.evaluate(i => !pianoIsReady(pianoPiece(i)), id));
  await p.evaluate(i => { pianoState().practiceLogs.push({id:uid(), pieceId:i,
    date:today(), durationMinutes:25, sections:[], quality:'good'}); saveNow(); }, id);
  is('practising it today un-rusts it with nothing to remember',
    await p.evaluate(i => pianoShownStatus(pianoPiece(i)), id), 'polished');

  console.log('\n4. the readiness dashboard answers one question');
  await p.evaluate(() => { setPianoRepView('ready'); }); await p.waitForTimeout(1200);
  const ready = await p.evaluate(() => document.querySelector('.pn-ready')?.textContent || '');
  yes('the piece is listed as playable now', /Ballade/.test(ready), ready.slice(0, 200));
  yes('  with how much music that is', /minutes of music/.test(ready));

  console.log('\n5. the suggestion spends the budget where things are lost');
  const plan = await p.evaluate(() => {
    const T = today();
    const mk = (title, status, lastDays, sections) => { const x = newPiece(title); x.status = status;
      x.duration = 5; x.sections = (sections || []).map(r => ({id:uid(), name:r, readiness:'rough', notes:''}));
      pianoState().pieces.push(x);
      if(lastDays != null) pianoState().practiceLogs.push({id:uid(), pieceId:x.id,
        date:addDays(T, -lastDays), durationMinutes:20, sections:[], quality:'good'});
      return x.id; };
    mk('s189 going rusty', 'polished', 60);
    mk('s189 being learned', 'learning', 1, ['coda','development']);
    mk('s189 kept polished', 'polished', 3);
    saveNow();
    const s = pianoSuggestPractice(30);
    return {kinds: s.items.map(i => i.kind), free: s.free,
      spent: s.items.reduce((n, i) => n + i.minutes, 0), budget: s.budget};
  });
  yes('maintenance comes first', plan.kinds[0] === 'maintenance', JSON.stringify(plan));
  yes('  learning is in it', plan.kinds.includes('learning'), JSON.stringify(plan));
  yes('  and so is a run-through', plan.kinds.includes('runthrough'), JSON.stringify(plan));
  yes('it does not spend more than it has', plan.spent <= plan.budget, JSON.stringify(plan));
  yes('  and leaves some of it unplanned on purpose', plan.free >= 1, JSON.stringify(plan));

  console.log('\n5b. archived is out of the way, but asking for it finds it');
  const arch = await p.evaluate(() => {
    const x = newPiece('s189 put away on purpose'); x.status = 'archived';
    pianoState().pieces.push(x); saveNow();
    const f = pianoPieceFilter();
    f.status = ''; const hidden = pianoFilteredPieces().some(y => y.id === x.id);
    f.status = 'archived'; const shown = pianoFilteredPieces().some(y => y.id === x.id);
    f.status = ''; return {hidden, shown};
  });
  yes('it is not in the ordinary list', !arch.hidden);
  yes('  and it is there when you ask for it', arch.shown);

  console.log('\n6. a set knows what is wrong with it');
  const warn = await p.evaluate(() => {
    const sl = newSetlist('s189 bar night');
    const rusty = pianoPieces().find(x => x.title === 's189 going rusty');
    const learn = pianoPieces().find(x => x.title === 's189 being learned');
    sl.pieces = [{pieceId:rusty.id, order:0, notes:''}, {pieceId:learn.id, order:1, notes:''}];
    pianoState().setlists.push(sl); saveNow();
    return {warnings: setlistWarnings(sl), minutes: setlistMinutes(sl)};
  });
  yes('it says a piece is rusty', warn.warnings.some(w => /rusty/.test(w)), JSON.stringify(warn));
  yes('  and that one is still being learned', warn.warnings.some(w => /learning/.test(w)), JSON.stringify(warn));
  is('  and adds up how long the set runs', warn.minutes, 10);

  console.log('\n7. the roadmap arrives with the first year already written');
  const road = await p.evaluate(() => ({
    phases: pianoPhases().length,
    stages: pianoAllStages().length,
    first: pianoPhases()[0].stages[0].name,
    resources: pianoState().jazz.resources.length,
    audiation: pianoState().jazz.audiation.length}));
  is('four phases', road.phases, 4);
  is('  twenty micro-stages', road.stages, 20);
  is('  starting where the roadmap starts', road.first, 'Major Scales & Intervals');
  is('  six audiation rungs', road.audiation, 6);
  yes('  and a shelf with the books on it', road.resources >= 6, String(road.resources));

  console.log('\n8. the twelve keys move a rung at a time, and stop one short');
  const keys = await p.evaluate(() => {
    const c = pianoAllStages()[0].stage.concepts[0];
    const before = Object.assign({}, pianoKeyMastery(c));
    pianoLogJazz({conceptId:c.id, keys:['C','F'], durationMinutes:20, mode:'practice'});
    const once = Object.assign({}, pianoKeyMastery(c));
    for(let i = 0; i < 8; i++) pianoLogJazz({conceptId:c.id, keys:['C'], durationMinutes:5, mode:'practice'});
    return {id:c.id, before:before.C, once:once.C, otherOnce:once.F, untouched:once.G,
      ceiling: pianoKeyMastery(c).C, progress: pianoConceptProgress(c)};
  });
  is('a key starts at the bottom', keys.before, 'cant_do');
  is('  one sitting moves it one rung', keys.once, 'aware');
  is('  every key in the sitting moves', keys.otherOnce, 'aware');
  is('  and the ones you did not touch do not', keys.untouched, 'cant_do');
  is('eight more sittings stop at fluent, not above it', keys.ceiling, 'fluent');
  yes('  and the concept has made real progress', keys.progress > 0, String(keys.progress));
  const claimed = await p.evaluate(cid => {
    const c = pianoConcept(cid); pianoKeyMastery(c).C = 'second_nature'; saveNow();
    return pianoKeyMastery(c).C; }, keys.id);
  is('the top rung is claimed by the player, not earned by logging', claimed, 'second_nature');

  console.log('\n9. logging drags the stage out of "not started"');
  const stage = await p.evaluate(() => {
    const {stage, phase} = pianoAllStages()[0];
    return {stage: stage.status, phase: phase.status}; });
  is('the stage is under way', stage.stage, 'in_progress');
  is('  and so is its phase', stage.phase, 'in_progress');

  console.log('\n10. practice and play are counted apart');
  const ratio = await p.evaluate(() => {
    const c = pianoAllStages()[0].stage.concepts[0];
    pianoLogJazz({conceptId:c.id, keys:[], durationMinutes:20, mode:'play'});
    return pianoPlayRatio(); });
  yes('playing is counted as playing', ratio.play >= 1, JSON.stringify(ratio));
  yes('  practising is counted separately', ratio.practice >= 9, JSON.stringify(ratio));
  yes('  and the share is of the two together', ratio.share > 0 && ratio.share < 1, JSON.stringify(ratio));

  console.log('\n11. practice hours land on the piano skill — if there is one');
  /* clear the tree of anything the starter set calls a piano first — with one
     already there, "no skill was created" is true whatever the code does */
  const noSkill = await p.evaluate(i => {
    S.skills = (S.skills || []).filter(x => !/piano|keyboard/i.test(x.name || ''));
    const before = S.skills.length;
    logPianoPractice(i, {durationMinutes:60});
    return {before, after:S.skills.length, found: !!pianoSkill()}; }, id);
  yes('  there is no piano on the tree to credit', !noSkill.found, JSON.stringify(noSkill));
  is('practising invents no skill', noSkill.after, noSkill.before);
  const credited = await p.evaluate(i => {
    S.skills = S.skills || [];
    /* the starter set may already carry a piano skill, and pianoSkill() takes
       the first that matches — so the claim is about the change, not the total */
    if(!pianoSkill()) S.skills.push({id:uid(), name:'Piano', hours:2, cat:'craft'});
    const before = pianoSkill().hours || 0;
    logPianoPractice(i, {durationMinutes:90});
    const sk = pianoSkill();
    return {gained: Math.round((sk.hours - before) * 100) / 100, last: sk.lastPracticed}; }, id);
  is('an hour and a half is an hour and a half', credited.gained, 1.5);
  is('  and it was practised today', credited.last, await p.evaluate(() => today()));

  console.log('\n12. a piano habit keeps itself');
  const hab = await p.evaluate(i => {
    S.habits = S.habits || [];
    const h = {id:uid(), name:'Practise piano 30 min', archived:false};
    S.habits.push(h);
    S.habitLog = S.habitLog || {}; delete (S.habitLog[today()] || {})[h.id];
    logPianoPractice(i, {durationMinutes:30});
    return !!(S.habitLog[today()] || {})[h.id]; }, id);
  yes('it is kept by practising', hab);

  console.log('\n13. the weekly review has something to say about the bench');
  const lines = await p.evaluate(() =>
    pianoReviewLines(addDays(today(), -7), today()));
  yes('it reports the hours', lines.some(l => /hours at the piano/.test(l)), JSON.stringify(lines));
  yes('  and the keys the jazz side touched', lines.some(l => /vocabulary worked in/.test(l)), JSON.stringify(lines));
  yes('  and what is going rusty', lines.some(l => /rusty/.test(l)), JSON.stringify(lines));
  const quiet = await p.evaluate(() => pianoReviewLines('1990-01-01', '1990-01-07'));
  is('a week with nothing in it says nothing at all', quiet, []);

  console.log('\n13b. a room nobody has opened is not opened on their behalf');
  const untouched = await p.evaluate(() => {
    const keep = S.piano; delete S.piano;
    const said = pianoReviewLines(addDays(today(), -7), today());
    const made = !!S.piano;
    S.piano = keep;
    return {said, made};
  });
  is('it has nothing to report', untouched.said, []);
  yes('  and asking did not build a jazz roadmap for them', !untouched.made);

  console.log('\n14. the jazz half draws');
  await p.evaluate(() => { setPianoTab('jazz'); }); await p.waitForTimeout(1500);
  const jazz = await p.evaluate(() => ({
    phases: document.querySelectorAll('.pn-phase').length,
    stages: document.querySelectorAll('[data-pnstage]').length,
    ladder: document.querySelectorAll('.pn-rung').length,
    ratio: !!document.querySelector('.pn-ratio')}));
  is('all four phases are on the page', jazz.phases, 4);
  is('  and all twenty stages', jazz.stages, 20);
  is('  the audiation ladder has its six rungs', jazz.ladder, 6);
  yes('  and the practice-against-play line is there', jazz.ratio);
  await p.evaluate(() => { const b = document.querySelector('[data-pnstage]'); if(b) b.click(); });
  await p.waitForTimeout(1200);
  const wheel = await p.evaluate(() => {
    const w = document.querySelector('.pn-wheel');
    return {there: !!w, segs: w ? w.querySelectorAll('[data-pnkey]').length : 0,
      labels: w ? [...w.querySelectorAll('[data-pnkey] text')].map(t => t.textContent) : []}; });
  yes('opening a stage shows the wheel', wheel.there);
  is('  with twelve segments', wheel.segs, 12);
  is('  in the order of the circle of fifths', wheel.labels,
    ['C','G','D','A','E','B','Gb','Db','Ab','Eb','Bb','F']);

  console.log('\n15. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
