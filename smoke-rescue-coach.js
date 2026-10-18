/* smoke-rescue-coach — the coach for yourself: choosing by rule, the AI prompt, and the import of an AI-written bank.
   Run: NODE_PATH=node_modules node smoke-rescue-coach.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + (g !== '' ? '  — ' + (typeof g === 'string' ? g : JSON.stringify(g)) : '')));
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.evaluate(() => { S.settings.rescueGate = 'off'; saveNow(); }); /* the gate has its own smoke */
  await p.evaluate(() => { document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); location.hash = '#/rescue'; }); await p.waitForTimeout(900);

  console.log('\n1. the starter bank');
  const bank = await p.evaluate(() => ({n: RESCUE_STARTER.length, ids: new Set(RESCUE_STARTER.map(q => q.id)).size, scen: RESCUE_SCENARIOS.map(sc => RESCUE_STARTER.filter(q => q.scenarios.includes(sc.id)).length),
    follow: RESCUE_STARTER.every(q => q.followups.every(f => RESCUE_STARTER.some(x => x.id === f))), len: Math.max(...RESCUE_STARTER.map(q => q.text.length))}));
  yes('about seventy starter questions, unique, every scenario covered, follow-ups all point somewhere', bank.n >= 60 && bank.ids === bank.n && Math.min(...bank.scen) >= 3 && bank.follow && bank.len <= 220, bank);

  console.log('\n2. a question is chosen by rule, and says why');
  const cb = await (await p.$('#rsCanvas')).boundingBox();
  await p.mouse.click(cb.x + 150, cb.y + 120); await p.keyboard.type('so tired but I said I would finish this tonight however late'); await p.keyboard.press('Enter');
  await p.keyboard.type('stay up or sleep?'); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const pick = await p.evaluate(() => { const s = rescueSheets()[0]; const r = rescuePickQuestion(s, {}); return {id: r.q.id, sc: r.q.scenarios, why: r.why, inferred: rescueScenarios(s).map(x => x.id)}; });
  yes('the page reads as tired / a promise, and the question fits them', pick.inferred.includes('tired-sleep') && pick.sc.some(x => ['tired-sleep', 'broken-promise'].includes(x)), pick);
  yes('and the reason is said in the user\'s own words', /you wrote|reads as|you said|it is late/.test(pick.why), pick.why);
  await p.click('[data-rs="coach"]'); await p.waitForTimeout(300);
  yes('"Ask me something" offers the scenarios, those the page points to marked', await p.evaluate(() => document.querySelectorAll('#rcSc .chip').length === RESCUE_SCENARIOS.length && document.querySelector('#rcSc .chip.on')));
  await p.click('#rcAuto'); await p.waitForTimeout(500);
  const q1 = await p.evaluate(() => { const el = document.querySelector('.rs-box.q'); return el && {text: el.querySelector('.rs-q p').textContent, why: el.querySelector('.rs-qwhy').textContent, kind: S.rescueSheets[0].boxes.find(b => b.kind === 'question').q.id}; });
  yes('a question box appears on the page, with its reason', q1 && q1.text.length > 15 && q1.why.length > 3, q1);
  await p.keyboard.type('the one who made the promise was rested and wanted to look disciplined'); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  yes('answering is just writing in the box', await p.evaluate(() => /rested/.test(S.rescueSheets[0].boxes.find(b => b.kind === 'question').text)));
  yes('and an answer offers the door the question suggests, if it has one', await p.evaluate(() => { const q = RESCUE_STARTER.find(x => x.id === S.rescueSheets[0].boxes.find(b => b.kind === 'question').q.id); return !q || q.suggest_exit === 'none' || !!document.querySelector('.rs-qsug'); }));
  await p.click('.rs-box.q [data-rsq="another"]'); await p.waitForTimeout(500);
  const q2 = await p.evaluate(() => ({id: S.rescueSheets[0].boxes.find(b => b.kind === 'question').q.id, kept: /rested/.test(S.rescueSheets[0].boxes.find(b => b.kind === 'question').text), n: S.rescueSheets[0].boxes.filter(b => b.kind === 'question').length}));
  yes('another gives a different question and keeps what was written', q2.id !== q1.kind && q2.kept && q2.n === 1, q2);
  await p.click('.rs-box.q [data-rsq="skip"]'); await p.waitForTimeout(500);
  const sk = await p.evaluate(() => ({skipped: rescueCoachState().skip.length, id: S.rescueSheets[0].boxes.find(b => b.kind === 'question').q.id}));
  yes('"not this one" is remembered for good', sk.skipped === 1 && sk.id !== q2.id, sk);
  await p.click('.rs-box.q [data-rsq="deeper"]'); await p.waitForTimeout(500);
  yes('go deeper moves on', await p.evaluate(() => S.rescueSheets[0].coach.asked.length >= 4));

  console.log('\n2b. tonight: stay up, or sleep');
  yes('a page about being tired offers "Tonight, from my records"', await p.evaluate(() => !document.getElementById('rsTonightBtn').hidden));
  await p.click('#rsTonightBtn'); await p.waitForTimeout(300);
  const fr = await p.evaluate(() => ({txt: document.querySelector('.rs-frame').textContent, thing: document.getElementById('rfThing').value, opts: document.querySelectorAll('.rs-frame [data-fo]').length}));
  yes('it says plainly what the record holds (or that there is not enough), with no verdict, and offers three real choices', /nights|logged/.test(fr.txt) && /Tomorrow|tomorrow/.test(fr.txt) && fr.opts === 3 && !/you should/i.test(fr.txt), fr);
  await p.fill('#rfThing', 'finish the application'); await p.click('[data-fo="min"]'); await p.waitForTimeout(500);
  yes('"thirty minutes, then bed" makes tomorrow\'s task and a stop reminder tonight', await p.evaluate(() => S.tasks.some(t => /finish the application/.test(t.text || t.title || '') && t.day === addDays(today(), 1)) && S.tasks.some(t => t.remind && /Bed/.test(t.text || t.title || '') && t.day === today())));
  yes('the frame is recorded as seen on the page, and put away', await p.evaluate(() => rescueSheets()[0].seen.tonight === true && !document.querySelector('.rs-frame')));

  console.log('\n3. the prompt for a stronger AI');
  await p.evaluate(() => rescueBankDialog()); await p.waitForTimeout(300);
  await p.click('#rbPrompt'); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__ids = RESCUE_SCENARIOS.map(x => x.id); }); const pr = await p.evaluate(() => document.querySelector('#rpOut').value);
  yes('it says what the app and the space are, lists the rooms and every scenario id, the doors, and the schema', /Overwhelm Rescue Space/.test(pr) && /Today/.test(pr) && (await p.evaluate(t => RESCUE_SCENARIOS.every(x => t.includes(x.id)), pr)) && /suggest_exit/.test(pr) && /overwhelm-rescue-questions/.test(pr), pr.length);
  yes('and what the bank covers now, per scenario', /tired-sleep.*\(\d+ questions so far\)/.test(pr));
  yes('personal names are left out unless asked', !/Thesis/.test(pr));
  await p.evaluate(() => { planNewList('Thesis'); }); await p.fill('#rpCtx', 'I overthink at night'); await p.check('#rpNames'); await p.waitForTimeout(200);
  yes('with the box ticked the names of lists go in, and the context', await p.evaluate(() => /Thesis/.test(document.querySelector('#rpOut').value) && /I overthink at night/.test(document.querySelector('#rpOut').value)));

  console.log('\n4. importing what it wrote');
  const good = {format: 'overwhelm-rescue-questions', version: 1, questions: [
    {id: 'zz-1', text: 'When the zzqq thing comes up, what is the first sentence your mind says, and is it a fact?', scenarios: ['feeling', 'nope-unknown'], triggers: ['zzqq'], stage: 'open', depth: 1, kind: 'name-it', horizon: 'any', tone: 'warm', followups: ['zz-2'], use_when: 'test', avoid_when: '', suggest_exit: 'journal', time_of_day: ['any']},
    {id: 'zz-2', text: 'What would you say to someone you love who had that same sentence in their head?', scenarios: ['feeling'], triggers: [], stage: 'explore', depth: 2, kind: 'reframe'},
    {id: 'zz-3', text: 'x', scenarios: ['feeling']},
    {id: 'zz-4', text: 'Which one of these would you let go of if you had to?', scenarios: ['mystery']},
    {id: 'zz-5', text: 'If you had to start in the next two minutes with a timer, what would you open first?', scenarios: ['stuck']}]};
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove())); await p.evaluate(() => rescueImportDialog()); await p.waitForTimeout(200);
  await p.fill('#riIn', 'not json at all'); await p.click('#riCheck');
  yes('not JSON is refused, with what to do', await p.evaluate(() => /not valid JSON/.test(document.querySelector('#riRep').textContent)) && await p.evaluate(() => document.querySelector('#riGo').disabled));
  await p.fill('#riIn', '```json\n' + JSON.stringify(good) + '\n```'); await p.click('#riCheck'); await p.waitForTimeout(200);
  const rep = await p.evaluate(() => ({t: document.querySelector('#riRep').textContent, dis: document.querySelector('#riGo').disabled}));
  yes('fenced JSON is read; two are good, the too-short one, the unknown-scenario one and the duplicate of a starter are left out, and said', /2 of 5/.test(rep.t) && /3 left out/.test(rep.t) && !rep.dis, rep);
  await p.fill('#riLabel', 'first batch'); await p.click('#riGo'); await p.waitForTimeout(500);
  const imp = await p.evaluate(() => ({n: S.rescueBank.length, rows: S.rescueBank.map(r => [r.qid, r.scenarios.join(), r.followups.join(), r.batchLabel])}));
  yes('they are stored as a batch, the unknown scenario dropped from the first, its follow-up pointed at the batch', imp.n === 2 && imp.rows[0][1] === 'feeling' && /:zz-2$/.test(imp.rows[0][2]), imp);
  const hit = await p.evaluate(() => { const s = rescueSheets()[0]; s.boxes.push({id: 'zq', x: 20, y: 20, text: 'zzqq zzqq', font: 'garamond', ink: 'var(--text)', horizon: '', fate: '', exits: [], refs: [], kind: 'text'}); const r = rescuePickQuestion(s, {scenario: 'feeling'}); return {id: r.q.id, why: r.why}; });
  yes('a question the AI wrote is found when the page uses its trigger words', /zz-1$/.test(hit.id) && /zzqq/.test(hit.why), hit);
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove())); await p.evaluate(() => rescueBankDialog()); await p.waitForTimeout(300);
  yes('the bank lists the batch, with what it covers', await p.evaluate(() => /first batch/.test(document.querySelector('.modal').textContent) && /2 questions/.test(document.querySelector('.modal').textContent)));
  await p.click('[data-on]'); await p.waitForTimeout(200);
  yes('a batch can be switched off', await p.evaluate(() => !rescueBankAll().some(q => /zz-1$/.test(q.id))));
  await p.click('[data-del]'); await p.waitForTimeout(400);
  yes('or taken out, with an undo', await p.evaluate(() => S.rescueBank.length === 0));
  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(bad ? '\nFAILURES' : '\nall good'); process.exit(bad ? 1 : 0);
})();
