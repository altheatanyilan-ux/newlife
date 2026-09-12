/* smoke106 — a quote is filed against the work it came from */
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
  const p = await b.newPage({viewport:{width:1400, height:1100}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  await p.waitForTimeout(1200);

  console.log('\n1. the quote form asks which work first');
  await p.evaluate(() => { EntryActions.libraryQuote(); });
  await p.waitForTimeout(700);
  yes('there is a work picker', !!(await p.$('#qwPick')));
  yes('  and a way to add one that is not on the shelf yet', !!(await p.$('#qwNew')));
  const order = await p.evaluate(() => {
    const fields = [...document.querySelectorAll('#extraFields .field')];
    return fields.map(f => f.id || (f.querySelector('[data-x]')?.dataset.x) || f.querySelector('label')?.textContent);
  });
  is('it comes before the author and the source', order[0], 'qwField');
  yes('  with author and source after it', order.slice(1, 3).join(',') === 'author,source', order.join(' > '));
  const opts = await p.$$eval('#qwPick option', n => n.map(o => o.textContent.trim()));
  yes('every work on the shelf is offered', opts.length - 1 === await p.evaluate(() => mediaEntries().length),
      `${opts.length - 1} offered, ${await p.evaluate(() => mediaEntries().length)} on the shelf`);

  console.log('\n2. choosing a work fills in what the work already knows');
  const work = await p.evaluate(() => { const w = mediaEntries()[0];
    return w ? {id: w.id, title: w.title, creator: (w.extra || {}).creator || ''} : null; });
  yes('there is a work to choose', !!work);
  await p.selectOption('#qwPick', work.id);
  await p.waitForTimeout(600);
  is('the source is the work’s title', await p.inputValue('[data-x=source]'), work.title);
  if(work.creator) is('  and the author is its maker', await p.inputValue('[data-x=author]'), work.creator);
  else ok('  the work has no maker recorded, so nothing to fill');
  yes('the choice is shown back', /filed under/.test(await p.textContent('#qwField')));

  console.log('\n3. saving writes the quote into the work as well as the journal');
  await p.fill('#eTitle', 'A line worth keeping');
  await p.fill('#eBody', 'The map is not the territory.');
  await p.fill('[data-x=why]', 'Because I keep mistaking one for the other.');
  await p.fill('[data-x=page]', 'p. 58');
  await p.click('#eSave');
  await p.waitForTimeout(1200);
  const saved = await p.evaluate(t => { const q = S.entries.find(e => e.title === t);
    return q ? {id: q.id, from: q.extra.fromMedia, source: q.extra.source} : null; }, 'A line worth keeping');
  yes('the quote was saved', !!saved);
  is('  filed against the work', saved.from, work.id);
  const passage = await p.evaluate(([wid, qid]) => {
    const w = S.entries.find(e => e.id === wid);
    const q = (w.extra.quotes || []).find(x => x.quoteEntryId === qid);
    return q ? {text: q.text, where: q.where, why: q.why} : null;
  }, [work.id, saved.id]);
  yes('and the work now carries the passage', !!passage, 'the work never heard about it');
  is('  with the line itself', passage.text, 'The map is not the territory.');
  is('  and where it was found', passage.where, 'p. 58');

  console.log('\n3b. which is what stops it being swept away');
  /* syncMediaQuotes deletes any quote claiming a work the work does not claim
     back, so a quote that only set `fromMedia` would vanish the next time
     anyone edited the book */
  await p.evaluate(wid => { syncMediaQuotes(S.entries.find(e => e.id === wid)); }, work.id);
  await p.waitForTimeout(400);
  yes('the quote survives the work being re-synced',
      await p.evaluate(id => !!S.entries.find(e => e.id === id), saved.id));

  console.log('\n4. the card says where the quote came from, and gets you there');
  await p.evaluate(() => { location.hash = '#/journals/quote'; });
  await p.waitForTimeout(1400);
  const chip = await p.evaluate(id => { const card = document.querySelector(`.entry[data-entry="${id}"]`);
    const c = card && card.querySelector('[data-qwopen]');
    return c ? {text: c.textContent.trim(), to: c.dataset.qwopen} : null; }, saved.id);
  yes('the card carries a chip for the work', !!chip, 'no chip on the card');
  is('  pointing at the right work', chip.to, work.id);
  yes('  and naming it', chip.text.includes(work.title), chip.text);
  await p.click(`.entry[data-entry="${saved.id}"] [data-qwopen]`);
  await p.waitForTimeout(1400);
  yes('clicking it opens the work in the Library',
      await p.evaluate(() => location.hash.startsWith('#/commonplace/')), await p.evaluate(() => location.hash));

  console.log('\n5. a work can be added without leaving the quote');
  await p.evaluate(() => { closePanel(); location.hash = '#/journals/quote'; });
  await p.waitForTimeout(1200);
  const shelfBefore = await p.evaluate(() => mediaEntries().length);
  await p.evaluate(() => { EntryActions.libraryQuote(); });
  await p.waitForTimeout(700);
  await p.fill('#eTitle', 'From a book not yet shelved');
  await p.fill('#eBody', 'Attention is the rarest form of generosity.');
  await p.fill('[data-x=why]', 'It names something I keep failing at.');
  await p.click('#qwNew');
  await p.waitForTimeout(700);
  yes('the Library’s own form opens on top', !!(await p.$('#mTitle')));
  await p.fill('#mTitle', 'Gravity and Grace');
  await p.fill('#mCreator', 'Simone Weil');
  await p.click('#mSave');
  await p.waitForTimeout(1000);
  is('the shelf grew by one', await p.evaluate(() => mediaEntries().length), shelfBefore + 1);
  yes('the quote form is still open, with everything typed still there',
      !!(await p.$('#eBody')) && await p.inputValue('#eTitle') === 'From a book not yet shelved',
      await p.$('#eBody') ? 'title lost' : 'the form closed');
  is('  and the new work is chosen', await p.inputValue('#qwPick'),
     await p.evaluate(() => mediaEntries().find(w => w.title === 'Gravity and Grace').id));
  is('  with its author filled in', await p.inputValue('[data-x=author]'), 'Simone Weil');
  await p.click('#eSave');
  await p.waitForTimeout(1100);
  yes('and it saves against the new work', await p.evaluate(() => {
    const w = mediaEntries().find(x => x.title === 'Gravity and Grace');
    const q = S.entries.find(e => e.title === 'From a book not yet shelved');
    return q && q.extra.fromMedia === w.id && (w.extra.quotes || []).some(x => x.quoteEntryId === q.id);
  }));

  console.log('\n6. a quote from nothing on the shelf is still allowed');
  await p.evaluate(() => { EntryActions.libraryQuote(); });
  await p.waitForTimeout(700);
  await p.fill('#eTitle', 'Said over dinner');
  await p.fill('#eBody', 'You only regret the invitations you turn down.');
  await p.fill('[data-x=why]', 'Because I turn most of them down.');
  await p.fill('[data-x=author]', 'my aunt');
  await p.click('#eSave');
  await p.waitForTimeout(1100);
  const loose = await p.evaluate(() => { const q = S.entries.find(e => e.title === 'Said over dinner');
    return q ? {from: q.extra.fromMedia || '', author: q.extra.author} : null; });
  yes('it saved', !!loose);
  is('  with no work behind it', loose.from, '');
  is('  and the author typed by hand', loose.author, 'my aunt');

  console.log('\n7. changing the work moves the passage rather than copying it');
  const two = await p.evaluate(() => mediaEntries().slice(0, 2).map(w => w.id));
  const moved = await p.evaluate(([a, bb]) => {
    const q = S.entries.find(e => e.title === 'A line worth keeping');
    attachQuoteToMedia(q, bb);
    const count = id => ((S.entries.find(e => e.id === id).extra.quotes) || []).filter(x => x.quoteEntryId === q.id).length;
    return {onFirst: count(a), onSecond: count(bb), from: q.extra.fromMedia};
  }, two);
  is('the old work no longer lists it', moved.onFirst, 0);
  is('the new work lists it once', moved.onSecond, 1);
  is('and the quote points at the new one', moved.from, two[1]);

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke106  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
