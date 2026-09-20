/* smoke204 — the unwritten rules, and typing that stops shaking the page.

   THE UNWRITTEN RULES. A note pinned at bar 60 is about bar 60. A good part
   of what anybody writes on a score is not: "the inner voice carries the line
   here" is true of every piece with an inner voice, and you rediscover it
   from scratch in the next one. So a pin can say it is a rule as well, and
   rules live in one place across every score.

   The load-bearing decision is that the same rule is ONE row, not five. The
   point is not to collect sentences — it is to notice that you have now
   written the same sentence in four different pieces, because that is the
   only evidence it is real. So marking a pin as a rule looks for one that
   already says the same thing and adds this bar as another sighting. Same
   words in a different order, different punctuation, one sentence longer
   than the other: still the same rule.

   And "assessed" means something narrow on purpose. Nothing here can hear
   you play, so nothing here grades you, and anything that pretended to would
   be a number you would learn to game. What it does is hold two things side
   by side — what you say you can do, and how often the record says you have
   actually met it — and name the places they disagree. A rule met in five
   pieces that you still only notice, and a rule you called automatic and
   have not met in a year, are opposite problems; one score would hide both.

   TYPING IS NOT A STRUCTURAL CHANGE. Editing a task's name in the detail
   panel rebuilt the page underneath every three hundred and fifty
   milliseconds. On Planning that was the task body; anywhere else — Today
   included — it was the whole page, so the day flashed under the panel every
   few letters. What actually changes behind the panel while a name is typed
   is one string, so that string is written and nothing else is touched. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

const piece = (title, composer) => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>${title}</work-title></work>
  <identification><creator type="composer">${composer}</creator></identification>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">${Array.from({length:8}, (_, i) =>
    `<measure number="${i+1}">${i === 0 ? `<attributes><divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>` : ''}
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure>`).join('')}</part>
</score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. two sentences that are one rule');
  const same = await p.evaluate(() => ({
    /* same words, different order, different punctuation */
    reordered: ruleLikeness('bring the thumb out, the inner voice carries the line',
      'The inner voice carries the line — bring out the thumb.'),
    /* one longer than the other, saying the same thing plus a bit more */
    longer: ruleLikeness('the inner voice carries the line',
      'the inner voice carries the line, so it has to be louder than the top'),
    /* and two rules that are genuinely about different things */
    apart: ruleLikeness('the inner voice carries the line',
      'never pedal through a rest at the end of a phrase'),
  }));
  yes('the same words in another order are the same rule', same.reordered >= 0.7, String(same.reordered));
  yes('  and so is one that says a bit more', same.longer >= 0.7, String(same.longer));
  yes('  two different rules are not', same.apart < 0.5, String(same.apart));

  console.log('\n2. a note that is true of more than its bar');
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(1200);
  await p.evaluate(async ([a, c]) => {
    await takeScoreFile(new File([a], 'The Chopin.musicxml'));
    await takeScoreFile(new File([c], 'The Bach.musicxml'));
  }, [piece('The Chopin', 'Chopin'), piece('The Bach', 'J.S. Bach')]);
  await p.waitForTimeout(6000);
  const first = await p.evaluate(() => {
    const x = scores().find(y => y.title === 'The Chopin');
    const made = noteScoreRule({text:'The inner voice carries the line — bring out the thumb.',
      family:'line', scoreId:x.id, title:x.title, measure:12});
    return {n: scoreRules().length, again: made.again, sources: made.rule.sources.length,
      standing: made.rule.standing, id: made.rule.id};
  });
  is('it goes in the library', [first.n, first.again], [1, false]);
  is('  with the bar it came from on it', first.sources, 1);
  /* a rule you have just written down is not something you can do yet */
  is('  and nothing is claimed about how well you know it', first.standing, 'noticed');
  const second = await p.evaluate(() => {
    const x = scores().find(y => y.title === 'The Bach');
    /* the same thing, said differently, in another piece */
    const made = noteScoreRule({text:'Bring the thumb out — the inner voice is carrying the line here.',
      family:'line', scoreId:x.id, title:x.title, measure:3});
    const r = scoreRules()[0];
    return {rules: scoreRules().length, again: made.again, fresh: made.fresh,
      sources: r.sources.map(s => [s.title, s.measure]), pieces: rulePieces(r)};
  });
  is('the same rule written again is not a second rule', second.rules, 1);
  yes('  it is the one you had, with another sighting', second.again && second.fresh,
    JSON.stringify(second));
  is('  and it now names both pieces', second.sources,
    [['The Chopin', 12], ['The Bach', 3]]);
  const twice = await p.evaluate(() => {
    const x = scores().find(y => y.title === 'The Bach');
    const made = noteScoreRule({text:'The inner voice carries the line, bring out the thumb',
      scoreId:x.id, title:x.title, measure:3});
    return {fresh: made.fresh, sources: scoreRules()[0].sources.length};
  });
  /* writing it twice at the same bar is not two sightings; it is one bar */
  yes('the same bar written twice is still one sighting',
    !twice.fresh && twice.sources === 2, JSON.stringify(twice));

  console.log('\n3. what the record says, against what you say');
  const reading = await p.evaluate(() => {
    const r = scoreRules()[0];
    /* a third piece, so it has turned up often enough to be a pattern */
    r.sources.push({id:uid(), scoreId:'gone', title:'A third piece', measure:9,
      at:new Date().toISOString()});
    const before = scoreRuleReading(r);
    checkScoreRule(r.id, 'automatic');
    /* and nothing has happened since — a year ago */
    const old = new Date(Date.now() - 400 * 86400000).toISOString();
    r.sources.forEach(s => s.at = old);
    const after = scoreRuleReading(r);
    return {before, after, checks: r.checks.length};
  });
  yes('met in three pieces and still only noticed is called out',
    reading.before.under && /still only noticed/.test(reading.before.say), JSON.stringify(reading.before));
  yes('  called settled and not met since is called out too',
    reading.after.stale && /not met in/.test(reading.after.say), JSON.stringify(reading.after));
  is('  and saying where it stands is kept as a trail, not a field', reading.checks, 1);
  const whole = await p.evaluate(() => {
    const m = musicianshipReading();
    return {n: m.n, stale: m.stale.length, settled: m.settled,
      /* no single number: the four counts and the disagreements, nothing averaged */
      keys: Object.keys(m).sort()};
  });
  is('the library reads as counts', [whole.n, whole.stale, whole.settled], [1, 1, 1]);
  yes('  with no score out of ten anywhere in it',
    !whole.keys.includes('score') && !whole.keys.includes('total'), JSON.stringify(whole.keys));

  console.log('\n4. the library on the shelf page');
  const shelf = await p.evaluate(async () => {
    scoreUi().id = null; location.hash = '#/score';
    await new Promise(r => setTimeout(r, 1200));
    return {there: !!document.querySelector('#scRules'),
      rows: document.querySelectorAll('.scr-row').length,
      bars: document.querySelectorAll('.scr-bar').length,
      says: (document.querySelector('#scRules') || {textContent:''}).textContent.replace(/\s+/g, ' '),
      sources: document.querySelectorAll('.scr-src').length};
  });
  yes('it is there', shelf.there && shelf.rows === 1, JSON.stringify(shelf).slice(0, 160));
  is('  with a bar for each of the four degrees of knowing', shelf.bars, 4);
  yes('  and the pieces you met it in, as a way back to the bar', shelf.sources >= 2, String(shelf.sources));
  /* the honest sentence is on the page, not only in the source */
  yes('  saying plainly that it cannot hear you play',
    /nothing here grades you/.test(shelf.says), shelf.says.slice(0, 200));
  const back = await p.evaluate(async () => {
    const b = [...document.querySelectorAll('.scr-src')].find(n => /Chopin/.test(n.textContent));
    b.click();
    await new Promise(r => setTimeout(r, 900));
    return {id: scoreUi().id, title: (scoreById(scoreUi().id) || {}).title};
  });
  is('pressing one opens that piece', back.title, 'The Chopin');

  console.log('\n5. a pin says it is a rule');
  const pinned = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'The Chopin');
    openPinModal(x.id, null, 5);
    await new Promise(r => setTimeout(r, 400));
    const tickThere = !!document.querySelector('#pinRule');
    const hiddenFirst = document.querySelector('#pinRuleBox').hidden;
    document.querySelector('#pinText').value = 'Never pedal through a rest at the end of a phrase.';
    document.querySelector('#pinRule').checked = true;
    document.querySelector('#pinRule').onchange();
    await new Promise(r => setTimeout(r, 300));
    const shown = !document.querySelector('#pinRuleBox').hidden;
    const said = document.querySelector('#pinRuleSay').textContent;
    document.querySelector('#pinRuleFam').value = 'sound';
    document.querySelector('#pinSave').click();
    await new Promise(r => setTimeout(r, 600));
    const y = scores().find(v => v.title === 'The Chopin');
    const pin = y.pins[y.pins.length - 1];
    return {tickThere, hiddenFirst, shown, said, rules: scoreRules().length,
      pinText: pin.text, ruleId: pin.ruleId, pins: y.pins.length};
  });
  yes('the pin modal offers it', pinned.tickThere && pinned.hiddenFirst, JSON.stringify(pinned).slice(0, 140));
  yes('  and the family picker only appears once you say so', pinned.shown);
  yes('  saying it is a new one rather than one you already have',
    /A new rule/.test(pinned.said), pinned.said);
  is('the rule is added', pinned.rules, 2);
  /* being true of every piece does not make it less true of this bar */
  yes('  and the pin is still a pin at bar 5, now knowing its rule',
    pinned.pins === 1 && !!pinned.ruleId && /Never pedal/.test(pinned.pinText),
    JSON.stringify(pinned));
  const echoed = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'The Chopin');
    openPinModal(x.id, null, 7);
    await new Promise(r => setTimeout(r, 400));
    document.querySelector('#pinText').value = 'Do not pedal through a rest at a phrase ending.';
    document.querySelector('#pinRule').checked = true;
    document.querySelector('#pinRule').onchange();
    await new Promise(r => setTimeout(r, 400));
    const said = document.querySelector('#pinRuleSay').textContent.replace(/\s+/g, ' ');
    document.querySelector('.modal-wrap, .overlay') && null;
    document.querySelectorAll('.modal-wrap, .overlay').forEach(n => n.remove());
    return said;
  });
  /* being told you have already written this, before writing it again, is
     the whole point of keeping them in one place */
  yes('writing it again in the same piece says so before you save',
    /written this before/.test(echoed) && /Never pedal/.test(echoed), echoed);

  console.log('\n6. typing a task name does not rebuild the page behind it');
  const typed = await p.evaluate(async () => {
    /* a task on Today, opened in the panel over it */
    S.tasks.push(newPlanTask('A task to rename', today(), {listId:'inbox'}));
    saveNow();
    location.hash = '#/today';
    await new Promise(r => setTimeout(r, 1200));
    const id = (S.tasks || []).find(v => v.text === 'A task to rename').id;
    openPlanTask(id);
    await new Promise(r => setTimeout(r, 700));
    /* count whole-page redraws rather than eyeballing a flash */
    let draws = 0;
    const real = window.rerender;
    window.rerender = function(){ draws++; return real.apply(this, arguments); };
    const box = document.querySelector('#pdTitle');
    const word = 'Rewritten name';
    for(const ch of word){
      box.value = box.value + ch;
      box.dispatchEvent(new Event('input', {bubbles:true}));
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 900));
    const rowNow = (document.querySelector(`.task-text[data-topen="${id}"]`) || {}).textContent;
    const panelStill = !!document.querySelector('#pdTitle');
    window.rerender = real;
    return {draws, rowNow, panelStill, id,
      typed: box.value, stored: (S.tasks || []).find(v => v.id === id).text};
  });
  is('nothing behind the panel is rebuilt while you type', typed.draws, 0);
  yes('  and the panel is still standing, with what you typed in it',
    typed.panelStill && /Rewritten name$/.test(typed.typed), JSON.stringify(typed));
  is('  the task really is renamed', typed.stored, typed.typed);
  /* the row behind still has to read right — it is written directly rather
     than by rebuilding the page around it */
  is('  and the row behind says the new name', typed.rowNow, typed.typed);
  const closed = await p.evaluate(async () => {
    /* counted, not eyeballed: the redraw typing did not do has to actually
       happen on the way out, or a search filter or a sort by name would be
       left showing the old name until something else redrew the page */
    let draws = 0;
    const real = window.rerender;
    window.rerender = function(){ draws++; return real.apply(this, arguments); };
    closePanel();
    await new Promise(r => setTimeout(r, 700));
    const after = draws;
    /* and a panel opened and closed again without a word typed into it owes
       nothing, so it draws nothing: the settling-up is for what typing put
       off, not a redraw on every close */
    const id2 = (S.tasks || []).find(v => /Rewritten name/.test(v.text)).id;
    openPlanTask(id2);
    await new Promise(r => setTimeout(r, 600));
    const opened = draws;
    closePanel();
    await new Promise(r => setTimeout(r, 600));
    window.rerender = real;
    return {draws: after, idle: draws - opened,
      gone: !document.querySelector('#panel'),
      still: [...document.querySelectorAll('.task-text')].some(n => /Rewritten name/.test(n.textContent))};
  });
  is('the page settles up once when the panel closes', closed.draws, 1);
  is('  and one opened and shut without typing owes nothing, so draws nothing', closed.idle, 0);
  yes('  with the new name still on the row afterwards',
    closed.gone && closed.still, JSON.stringify(closed));

  console.log('\n7. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
