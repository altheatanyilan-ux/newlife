/* smoke97 — dump it now, finish it later, never lose it */
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
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(2200);
  /* Setting location.hash to the value it already holds fires no hashchange,
     so a "navigate" to the page you are on redraws nothing. Ask directly. */
  const go = async (h) => {
    await p.evaluate(x => { if(location.hash === x) rerender(); else location.hash = x; }, h);
    await p.waitForTimeout(800);
  };

  console.log('\n1. the section is last on Today, and says so when empty');
  await go('#/today');
  yes('there is an unfinished section', !!(await p.$('#t-unfinished')));
  yes('empty, it is one quiet line with a way in',
      await p.evaluate(() => { const s = document.querySelector('#t-unfinished');
        return s.classList.contains('empty') && !!s.querySelector('#dumpNew'); }));
  const order = await p.evaluate(() => {
    const secs = [...document.querySelectorAll('.today-page .section')];
    return secs.map(s => s.id || '(unnamed)');
  });
  is('and it is the last section on the page', order[order.length - 1], 't-unfinished');
  yes('below Before you sleep, which was previously last',
      order.indexOf('t-unfinished') > order.indexOf('t-tonight'), order.join(' > '));

  console.log('\n2. dumping a thought takes one field and one keystroke');
  await p.click('#dumpNew');
  await p.waitForTimeout(400);
  yes('the capture opens', !!(await p.$('#dumpBody')));
  is('with exactly one field to fill',
     await p.evaluate(() => document.querySelectorAll('.overlay input:not([type=hidden]), .overlay textarea').length), 1);
  yes('and it already has the caret', await p.evaluate(() => document.activeElement.id === 'dumpBody'));
  await p.type('#dumpBody', 'the thing about tuesday that I keep not writing down');
  await p.keyboard.press('Control+Enter');
  await p.waitForTimeout(700);
  yes('⌘↵ keeps it and closes', !(await p.$('#dumpBody')));
  const made = await p.evaluate(() => {
    const e = S.entries.find(x => (x.body||'').startsWith('the thing about tuesday'));
    return e ? {type: e.type, unfinished: !!e.extra.unfinished, dumped: !!e.extra.dumpedAt, occurred: e.occurredAt} : null;
  });
  yes('it is a real entry, not a note in a holding pen', !!made, 'no entry');
  is('  of an ordinary kind, chosen later', made && made.type, 'reflection');
  is('  flagged unfinished', made && made.unfinished, true);
  yes('  and stamped with when it was caught', made && made.dumped);

  console.log('\n3. it is in Journals immediately — nothing waits to be converted');
  await go('#/journals/reflection');
  const inJournals = await p.evaluate(() => document.body.innerText.includes('the thing about tuesday'));
  yes('the rough line is already filed', inJournals);
  yes('and marked so you know it is half-written',
      await p.evaluate(() => !!document.querySelector('.unf-pill')));

  console.log('\n4. it holds its place on Today, and says how long it has waited');
  await go('#/today');
  yes('the section is no longer the quiet empty line',
      await p.evaluate(() => !document.querySelector('#t-unfinished').classList.contains('empty')));
  is('one thing is waiting', await p.evaluate(() => document.querySelectorAll('#t-unfinished .unf').length), 1);
  yes('the whole thought is shown, not a title',
      await p.evaluate(() => document.querySelector('.unf-text').textContent.includes('keep not writing down')));
  yes('the jump index at the top carries the count, so the bottom is visible from the top',
      await p.evaluate(() => [...document.querySelectorAll('[data-jump]')].some(b => /unfinished 1/.test(b.textContent))));

  console.log('\n5. a reload does not lose it — the point of the whole feature');
  await p.reload(); await p.waitForTimeout(2400);
  await go('#/today');
  is('still there after a full reload',
     await p.evaluate(() => document.querySelectorAll('#t-unfinished .unf').length), 1);
  is('and still flagged in the database',
     await p.evaluate(() => !!S.entries.find(x => (x.body||'').startsWith('the thing about tuesday')).extra.unfinished), true);

  console.log('\n6. the oldest waits at the top, because it is the one being forgotten');
  await p.evaluate(() => {
    const mk = (body, daysAgo) => { const d = new Date(Date.now() - daysAgo*864e5).toISOString();
      S.entries.push({id: uid(), type: 'dream', title: '', body, occurredAt: d.slice(0,10), createdAt: d, media: [],
        links: {stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
        people: [], places: [], emotions: [], tags: [], confidence: '',
        extra: {unfinished: true, dumpedAt: d}}); };
    mk('nine days old and still half a sentence', 9);
    mk('three days old', 3);
    saveNow();
  });
  await go('#/today');
  const texts = await p.evaluate(() => [...document.querySelectorAll('.unf-text')].map(n => n.textContent.slice(0, 20)));
  yes('the nine-day-old one is first', texts[0].startsWith('nine days old'), texts.join(' | '));
  yes('and it says how long it has been waiting',
      await p.evaluate(() => document.querySelector('#t-unfinished .unf .mono').textContent.includes('waiting 9 days')));
  is('three of them now', texts.length, 3);

  console.log('\n7. finishing clears the flag and keeps the entry');
  const beforeCount = await p.evaluate(() => S.entries.length);
  await p.click('#t-unfinished .unf:first-child [data-unfdone]');   // the nine-day-old one
  await p.waitForTimeout(700);
  is('it leaves the list', await p.evaluate(() => document.querySelectorAll('#t-unfinished .unf').length), 2);
  is('but nothing was deleted', await p.evaluate(() => S.entries.length), beforeCount);
  is('the entry is simply no longer flagged',
     await p.evaluate(() => !!S.entries.find(x => (x.body||'').startsWith('nine days old')).extra.unfinished), false);
  yes('and the change can be taken back',
      await p.evaluate(() => [...document.querySelectorAll('.toast')].some(t => /not yet/i.test(t.textContent))));
  await p.evaluate(() => { const t = [...document.querySelectorAll('.toast')].find(x => /not yet/i.test(x.textContent));
    t.querySelector('.toast-act').click(); });
  await p.waitForTimeout(700);
  is('taking it back puts it straight back on the list',
     await p.evaluate(() => document.querySelectorAll('#t-unfinished .unf').length), 3);

  console.log('\n8. fleshing it out, and the switch that ends it');
  await p.click('#t-unfinished .unf [data-unfopen]');
  await p.waitForTimeout(600);
  yes('it opens in the full editor', !!(await p.$('#eBody')));
  yes('with the switch present and on', await p.evaluate(() => {
    const c = document.querySelector('#eUnfinished'); return !!c && c.checked; }));
  yes('and the whole rough line carried into the body',
      await p.evaluate(() => document.querySelector('#eBody').value.includes('nine days old')));
  /* saving an edit must not silently decide the thought is finished */
  await p.evaluate(() => { document.querySelector('#eBody').value += '\n\nand now a second paragraph.';
    document.querySelector('#eSave').click(); });
  await p.waitForTimeout(900);
  is('saving more of it leaves it unfinished — that is your call, not the app’s',
     await p.evaluate(() => !!S.entries.find(x => (x.body||'').startsWith('nine days old')).extra.unfinished), true);
  await go('#/today');
  is('so it is still on the list', await p.evaluate(() => document.querySelectorAll('#t-unfinished .unf').length), 3);
  yes('showing the fuller version now',
      await p.evaluate(() => [...document.querySelectorAll('.unf-text')].some(n => n.textContent.includes('second paragraph'))));

  await p.click('#t-unfinished .unf [data-unfopen]');
  await p.waitForTimeout(600);
  await p.uncheck('#eUnfinished');
  await p.evaluate(() => document.querySelector('#eSave').click());
  await p.waitForTimeout(900);
  is('turning the switch off is what finishes it',
     await p.evaluate(() => !!S.entries.find(x => (x.body||'').startsWith('nine days old')).extra.unfinished), false);
  await go('#/today');
  is('and it leaves the list', await p.evaluate(() => document.querySelectorAll('#t-unfinished .unf').length), 2);

  console.log('\n9. any kind of entry can be half-written, not just a reflection');
  const kinds = await p.evaluate(() => [...new Set(unfinishedEntries().map(e => e.type))]);
  yes('a dream is on the list beside a reflection', kinds.includes('dream'), kinds.join(','));
  /* An ordinary finished entry, written the normal way, can be sent back to
     the list later — the flag is not something only the dump can set. */
  const flagged = await p.evaluate(() => {
    const e = {id: uid(), type: 'gratitude', title: 'written properly', body: 'a whole entry',
      occurredAt: today(), createdAt: new Date().toISOString(), media: [],
      links: {stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
      people: [], places: [], emotions: [], tags: [], confidence: '', extra: {}};
    S.entries.push(e);
    setUnfinished(e, true);
    const on = unfinishedEntries().some(x => x.id === e.id);
    setUnfinished(e, false);
    const off = unfinishedEntries().some(x => x.id === e.id);
    return {on, off};
  });
  yes('an ordinary finished entry can be sent back to the list later', flagged.on);
  yes('and taken off it again', !flagged.off);
  yes('an entry written before this feature existed does not break it',
      await p.evaluate(() => {
        const legacy = {id: uid(), type: 'memory', title: 'no extra at all', body: 'x'};
        try { return unfinishedFlag(legacy) === false; } catch(err){ return false; }
      }));

  console.log('\n10. it survives a backup round trip');
  const survived = await p.evaluate(async () => {
    const before = unfinishedEntries().length;
    const payload = {version: 1, data: {}};
    for(const t of db.tables) payload.data[t.name] = await t.toArray();
    const problem = validateBackup(normaliseBackup(JSON.parse(JSON.stringify(payload))));
    if(problem) return {problem};
    await importBackup(normaliseBackup(JSON.parse(JSON.stringify(payload))));
    return {before, after: unfinishedEntries().length};
  });
  yes('the backup is valid', !survived.problem, survived.problem || '');
  is('and the unfinished ones come back unfinished', survived.after, survived.before);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke97  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
