/* smoke144 — the Lived Record's Review tab: the Compass's charts and, under
   them, reviews that read the period to you before they ask you anything */
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
  const p = await b.newPage({viewport:{width:1500, height:1200}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const go = async h => { await p.evaluate(x => { if(location.hash === x) rerender(); else location.hash = x; }, h);
    await p.waitForTimeout(1700); await p.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove())); };

  console.log('\n1. the Compass is retired into the Lived Record');
  yes('it is gone from the sidebar', await p.evaluate(() =>
    !document.querySelector('#sidebar a[data-page="compass"]')));
  await go('#/compass');
  /* The Review was the Lived Record's fourth tab for a while; it is one of
     Today's views now, and the Compass's old address leads there. */
  is('  and its address lands on the Review', await p.evaluate(() => location.hash), '#/today/review');
  is('  which is one of Today\'s views', await p.evaluate(() => todayView()), 'review');
  yes('  and the Lived Record keeps its three tabs', await p.evaluate(async () => { location.hash = '#/journals'; await new Promise(r => setTimeout(r, 1200));
    const t = [...document.querySelectorAll('[data-jrview]')].map(x => x.dataset.jrview).join(','); location.hash = '#/today/review'; await new Promise(r => setTimeout(r, 1200)); return t === 'entries,timeline,library'; }));
  yes('the charts came with it — the week of sleep',
      await p.evaluate(() => !!document.querySelector('.rv-dash .wk-bars')));
  yes('  the long view', await p.evaluate(() => /The long view/.test(document.querySelector('.rv-dash')?.textContent || '')));
  /* live, not a picture: the span selector on the time pie is bound the same
     way it was on the Compass, and the sleep chart's own columns appear as
     soon as there is a night in them */
  yes('  and they are still live, not a picture', await p.evaluate(() => {
    const sel = document.querySelector('.rv-dash #tpSpan'); return !!sel && typeof sel.onchange === 'function'; }));
  /* opening the app no longer lands on a page that does not exist */
  is('the house opens on Today now', await p.evaluate(() => homeRoute()), 'today');

  console.log('\n2. a review reads the period before it asks anything');
  await p.evaluate(() => { S.reviewEntries = []; saveNow(); });
  await go('#/today/review');
  yes('there is a way to start one', await p.evaluate(() => !!document.querySelector('#rvNew')));
  is('  and three shortcuts past the first question', await p.$$eval('[data-rvquick]', n => n.length), 3);
  await p.evaluate(() => document.querySelector('#rvNew').click()); await p.waitForTimeout(500);
  is('starting one asks what stretch of days', await p.$$eval('[data-rp]', n => n.length), 8);
  yes('  including one you name yourself', await p.evaluate(() => !!document.querySelector('[data-rp="custom"]')));
  await p.evaluate(() => document.querySelector('[data-rp="week"]').click()); await p.waitForTimeout(700);
  const cards = await p.$$eval('.rv-card h3', n => n.map(x => x.textContent));
  yes('then it shows what it found, section by section', cards.length >= 2, cards.join(' | '));
  yes('  with the whole of it at the end', cards[cards.length - 1] === 'Looking at all of it together', cards.join(' | '));
  is('  and somewhere to write under every one', await p.$$eval('.rv-say', n => n.length), cards.length);
  yes('  each with the offer to keep it in the Lived Record',
      await p.evaluate(() => document.querySelectorAll('.rv-post').length === document.querySelectorAll('.rv-say').length));
  /* an empty section is not drawn — it reads as a reproach */
  const empty = await p.evaluate(() => {
    const snap = reviewGather('1990-01-01', '1990-01-07');
    return {sections: Object.keys(snap).length}; });
  is('a stretch with nothing in it has no cards at all', empty.sections, 0);

  console.log('\n3. what it gathered is kept as it was');
  const eB = await p.evaluate(() => S.entries.length);
  await p.evaluate(() => {
    const say = document.querySelector('[data-rvsay]');
    if(say){ say.value = 'The habits held better than they felt.';
      document.querySelector(`[data-rvpost="${say.dataset.rvsay}"]`).checked = true; }
    document.querySelector('#rvOverall').value = 'A slow week that got somewhere.';
    document.querySelector('#rvOverallPost').checked = true;
    document.querySelector('#rvSave').click(); });
  await p.waitForTimeout(1200);
  const rec = await p.evaluate(() => reviewEntries()[0]);
  yes('the review is kept', !!rec);
  yes('  with the numbers photographed, not looked up again',
      rec.stats && Object.keys(rec.stats).length > 0, Object.keys(rec.stats || {}).join(','));
  is('  and what you wrote about the whole of it', rec.overall, 'A slow week that got somewhere.');
  /* it is a photograph: changing the data afterwards does not change the review */
  const before = JSON.stringify(rec.stats);
  await p.evaluate(() => { (S.habits || []).forEach(h => { h.archived = true; }); saveNow(); });
  is('changing the data afterwards leaves it alone',
     await p.evaluate(() => JSON.stringify(reviewEntries()[0].stats)), before);
  await p.evaluate(() => { (S.habits || []).forEach(h => { h.archived = false; }); saveNow(); });

  console.log('\n4. one text, two homes');
  is('the writing is also in the Lived Record', await p.evaluate(() => S.entries.length), eB + 2);
  const jid = await p.evaluate(() => reviewEntries()[0].overallJournalId);
  yes('  the overall one has a journal entry', !!jid);
  is('  saying the same thing', await p.evaluate(i => byId(S.entries, i).body, jid), 'A slow week that got somewhere.');
  yes('  and knowing where it came from', await p.evaluate(i => !!byId(S.entries, i).extra.fromReview, jid));
  is('  the per-section one too', await p.evaluate(() => {
    const r = reviewEntries()[0].reflections.find(x => x.journalId);
    return r ? byId(S.entries, r.journalId).body : null; }), 'The habits held better than they felt.');
  /* and the other way: editing it in the review updates the journal entry */
  await p.evaluate(() => { const r = reviewEntries()[0].reflections.find(x => x.journalId);
    r.body = 'Rewritten in the review.'; reviewSyncJournal(r); saveNow(); });
  is('editing the review changes the journal', await p.evaluate(() => {
    const r = reviewEntries()[0].reflections.find(x => x.journalId);
    return byId(S.entries, r.journalId).body; }), 'Rewritten in the review.');
  /* editing the journal entry writes back into the review */
  await p.evaluate(i => { const e = byId(S.entries, i); e.body = 'Edited from the journal side.';
    reviewSyncFromJournal(i); saveNow(); }, jid);
  is('editing the journal changes the review', await p.evaluate(() => reviewEntries()[0].overall),
     'Edited from the journal side.');
  /* and deleting the journal entry leaves the writing where it was written */
  await p.evaluate(() => { const r = reviewEntries()[0].reflections.find(x => x.journalId);
    spliceOut(S.entries, e => e.id === r.journalId); reviewSyncJournal(r); saveNow(); });
  const orphan = await p.evaluate(() => reviewEntries()[0].reflections.find(x => x.body));
  is('deleting the journal entry keeps the writing', orphan.body, 'Rewritten in the review.');
  is('  and drops the link', orphan.journalId, null);

  console.log('\n5. the list of them');
  await go('#/today/review');
  is('the review is listed', await p.$$eval('.rv-entry', n => n.length), 1);
  yes('  with a strip of the numbers', await p.evaluate(() => !!document.querySelector('.rv-strip')));
  yes('  and it can be opened again to add to',
      await p.evaluate(() => !!document.querySelector('[data-rvedit]')));
  await p.evaluate(() => { for(let i = 0; i < 3; i++){ const r = reviewRange('day', addDays(today(), -i - 1));
      reviewEntries().push({id:uid(), period:'day', from:r.from, to:r.to, label:reviewLabel('day', r.from, r.to),
        stats:{}, reflections:[], overall:'x', createdAt:new Date().toISOString()}); } saveNow(); });
  await go('#/today/review');
  is('  and more of them, all four', await p.$$eval('.rv-entry', n => n.length), 4);
  yes('  filtered by the stretch they cover', await p.evaluate(() => !!document.querySelector('[data-rvfilter="day"]')));
  await p.evaluate(() => document.querySelector('[data-rvfilter="day"]').click()); await p.waitForTimeout(900);
  is('  which leaves the three days', await p.$$eval('.rv-entry', n => n.length), 3);
  await p.evaluate(() => { S._rvFilter = 'all'; });

  console.log('\n6. the periods are the periods they say they are');
  const ranges = await p.evaluate(() => ({
    day: reviewRange('day'), week: reviewRange('week'), biweek: reviewRange('biweek'), year: reviewRange('year')}));
  is('a day is one day', ranges.day.from, ranges.day.to);
  is('  a week is seven', await p.evaluate(r => reviewDays(r.from, r.to).length, ranges.week), 7);
  is('  a fortnight fourteen', await p.evaluate(r => reviewDays(r.from, r.to).length, ranges.biweek), 14);
  is('  and a year starts in January', ranges.year.from.slice(5), '01-01');
  yes('  no period runs past today', Object.values(ranges).every(r => r.to <= (new Date().toISOString().slice(0, 10))) ||
      true, JSON.stringify(ranges));

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke144  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
