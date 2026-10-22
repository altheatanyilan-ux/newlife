/* smoke-proof — Proof, the collection of wins */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport: {width: 1300, height: 950}})).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const q = (f, a) => p.evaluate(f, a);
  await q(() => { S.settings.rescueGate = 'off'; S.settings.rescueCarry = false; saveNow(); location.hash = '#/journals/proof'; }); await p.waitForTimeout(1000);
  yes('Proof is a journal in the sidebar', !!(await p.$('.jnav [data-go="#/journals/proof"]')) && /Proof/.test(await q(() => document.querySelector('.jnav .active').textContent)));
  yes('with an invitation while it is empty', /Nothing yet/.test(await q(() => document.querySelector('.pf-banner').textContent)));
  await q(() => { openEntryModal({type: 'proof'}); }); await p.waitForTimeout(700);
  const f = await q(() => ({labels: [...document.querySelectorAll('.modal .field label, .modal .pd-q .k')].map(l => l.textContent), body: document.querySelector('#eBody').placeholder, size: [...document.querySelectorAll('[data-xset="proofSize"]')].map(c => c.textContent)}));
  yes('its entry form asks what it shows, how big and who saw', f.labels.some(l => /shows about me/.test(l)) && f.labels.some(l => /Who saw it/.test(l)) && f.size.length === 4 && /plainly/.test(f.body), f);
  await q(() => { document.querySelector('#eTitle').value = 'Played the Ravel from memory'; document.querySelector('#eBody').value = 'No score, no stumble, in front of the committee.'; document.querySelector('[data-x="proofShows"]').value = 'I can perform under pressure'; document.querySelector('[data-xset="proofSize"][data-xval="big"]').click(); document.querySelector('#eSave').click(); }); await p.waitForTimeout(700);
  const e = await q(() => { const x = S.entries.filter(e => e.type === 'proof'); return x.length && {n: x.length, title: x[0].title, shows: x[0].extra.proofShows, size: x[0].extra.proofSize}; });
  yes('it saves as an entry of its own kind', e && e.n === 1 && e.title === 'Played the Ravel from memory' && e.shows === 'I can perform under pressure' && e.size === 'big', e);
  await q(() => { location.hash = '#/today'; }); await p.waitForTimeout(300); await q(() => { location.hash = '#/journals/proof'; }); await p.waitForTimeout(900);
  yes('the journal offers to read some proof back', !!(await p.$('[data-proofread]')));
  await p.click('[data-proofread]'); await p.waitForTimeout(400);
  yes('which shows one piece at a time', await q(() => /Ravel/.test(document.querySelector('#pfCard').textContent) && /I can perform under pressure/.test(document.querySelector('#pfCard').textContent)));
  await q(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));
  /* keep as proof from the weekly review */
  await q(() => { const wk = weekStart(today()), pl = weekPlan(wk); pl.outcomes = [{id: 'g9', text: 'Send the grant report', taskIds: []}]; pl.wins = [{id: 'w9', text: 'A calm week', why: '', evidence: [{id: 'e9', text: 'slept well all week', at: today()}]}]; saveNow(); flowWeekly(); });
  await p.waitForTimeout(600);
  const thisWk = await q(() => weekStart(today())); const later = await p.$(`[data-wwwk="${thisWk}"]`); if(later) await later.click();
  await p.click('[data-wwproof="g:g9"]'); await p.waitForTimeout(300);
  yes('a goal that happened can be kept as proof from the weekly review', await q(() => proofAll().some(e => e.title === 'Send the grant report' && e.extra.proofFrom === 'weekly review')));
  await q(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));
  /* from the rescue page */
  await q(() => { location.hash = '#/rescue/new'; }); await p.waitForTimeout(1500);
  if(await p.$('.rs-ready-x')) await p.click('.rs-ready-x');
  const r = await q(() => { const n = _rs.newBox(100, 100); n.ta.value = 'finally told Mira no, kindly'; n.b.text = n.ta.value;
    const ctx = {b: n.b, el: n.el, text: n.b.text, whole: true, step(){}, place(){}}; rescueExitStep(ctx, 'proof'); return {kept: proofAll().some(e => /told Mira no/.test(e.title)), exit: RESCUE_EXITS.some(x => x.id === 'proof')}; });
  yes('on the rescue page a card can be sent to Proof', r.kept && r.exit, r);
  yes('and proof can lean in as a line at the edge', await q(() => { for(let i = 0; i < 80; i++){ const w = rescueWhisperFor(_rs.sheet, []); if(w && /You did this/.test(w.t)) return true; } return false; }));
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
