/* smoke216 — a work on the shelf is a pointer at something outside this file

   Everything in the Library is a thing that exists somewhere else. The entry
   is a record of having met it; the meeting happened on a page, in a video,
   in a shop, in a copy somebody sent. Until now that address lived in the
   prose if it lived anywhere, which means finding it again was a search
   through your own notes for a string you half remember.

   So a work carries addresses. The claims below are mostly about three ways
   this kind of feature goes wrong.

   THE NAME. `e.links` already exists on every entry in this app and means
   something else entirely — the stages, values, threads and visions a work
   is tied to. A second thing called links on the same object is a bug with
   a date on it, so the addresses are `extra.urls`, and there is a claim
   that adding, editing and deleting them leaves the dimension links exactly
   where they were.

   THE HAND-OFF. You almost never type an address on the entry page. You
   have it when you queue the thing, or when somebody sends it to you, or in
   the moment you first log it — and then the work is created from that and
   the address is dropped on the floor. There are claims that all three
   doors carry it through onto the shelf.

   WHAT COUNTS AS AN ADDRESS. Somebody pastes `www.foo.com`, or types a
   note into the field, or leaves it blank and fills in only the label. The
   first must open, the second and third must not pretend to. A row that
   points nowhere says so rather than rendering a dead anchor.

   WHAT IS NOT CLAIMED. That the link works — this app is offline and has
   no business asking. Nothing here fetches anything.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1200}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  const clean = () => p.evaluate(() => {
    for(let i = S.entries.length - 1; i >= 0; i--) if(['media','quote'].includes(S.entries[i].type)) S.entries.splice(i,1);
    S.mediaQueue = []; S.mediaRecs = []; S.mediaLists = [];
    S._mq = ''; S._mKind = 'all'; S._mStatus = 'all'; S._mRes = 'all'; S._mView = 'shelf';
    saveNow();
  });
  const lib = async (sub = '') => { await p.evaluate(s => { location.hash = '#/journals/library' + s; }, sub); await p.waitForTimeout(900); };
  const relib = async () => { await p.evaluate(() => rerender()); await p.waitForTimeout(500); };
  const shut = async () => { await p.evaluate(() => { document.querySelectorAll('.overlay,.panel-wrap,#panel').forEach(n => n.remove()); }); };

  await clean(); await lib();

  /* ------------------------------------------------------------------ */
  console.log('\n1. logging a work, with the address you already have in hand');
  await p.evaluate(() => openMediaModal({}));
  await p.waitForTimeout(400);
  yes('the quick-add asks for a link', !!(await p.$('#mUrl')));
  await p.fill('#mTitle', 'Gödel, Escher, Bach');
  await p.fill('#mCreator', 'Douglas Hofstadter');
  await p.fill('#mUrl', 'https://example.org/geb');
  await p.click('#mSave'); await p.waitForTimeout(900);
  const one = await p.evaluate(() => {
    const e = S.entries.find(x => x.type === 'media' && x.title.startsWith('Gödel'));
    return e ? {n:(e.extra.urls||[]).length, url:(e.extra.urls||[])[0]?.url, kind:(e.extra.urls||[])[0]?.kind, hasId:!!(e.extra.urls||[])[0]?.id} : null;
  });
  is('it lands on the work as one address', one, {n:1, url:'https://example.org/geb', kind:'work', hasId:true});
  await shut(); await lib();

  console.log('\n1b. and a work logged without one carries an empty list, not undefined');
  await p.evaluate(() => openMediaModal({}));
  await p.waitForTimeout(400);
  await p.fill('#mTitle', 'A book with no address');
  await p.click('#mSave'); await p.waitForTimeout(900);
  is('an empty shelf of addresses', await p.evaluate(() => {
    const e = S.entries.find(x => x.type === 'media' && x.title === 'A book with no address');
    return Array.isArray(e?.extra?.urls) ? e.extra.urls.length : 'not an array';
  }), 0);
  await shut(); await lib();

  /* ------------------------------------------------------------------ */
  console.log('\n2. the panel: adding, naming and filing an address');
  const gid = await p.evaluate(() => S.entries.find(e => e.type === 'media' && e.title.startsWith('Gödel')).id);
  await p.evaluate(i => openMediaPanel(i), gid); await p.waitForTimeout(600);
  yes('the panel has a place for them', await p.evaluate(() =>
    [...document.querySelectorAll('#panel .sc')].some(n => n.textContent.trim() === 'Where to find it')));
  is('  with the one it already has', await p.$$eval('#panel .res-row', n => n.length), 1);
  await p.click('#mpAddL'); await p.waitForTimeout(700);
  is('＋ link adds a row', await p.$$eval('#panel .res-row', n => n.length), 2);
  yes('  and opens the address field, not the label',
    await p.evaluate(() => { const rows = document.querySelectorAll('#panel .res-row');
      const eds = rows[rows.length-1].querySelectorAll('.ed');
      return eds[1].classList.contains('editing') && !eds[0].classList.contains('editing'); }));

  /* type into the field that is open, the way a person would */
  await p.evaluate(() => { const rows = document.querySelectorAll('#panel .res-row');
    const inp = rows[rows.length-1].querySelector('.ed.editing input'); inp.value = 'www.example.com/about-geb'; inp.blur(); });
  await p.waitForTimeout(700);
  is('what was typed is on the work', await p.evaluate(() => {
    const e = byId(S.entries, S.entries.find(x => x.type==='media' && x.title.startsWith('Gödel')).id);
    return e.extra.urls.map(u => u.url); }), ['https://example.org/geb', 'www.example.com/about-geb']);

  await p.evaluate(i => { const e = byId(S.entries, i); e.extra.urls[1].label = 'the long review'; e.extra.urls[1].kind = 'about'; saveNow(); reopenPanel(() => { rerender(); openMediaPanel(i); }); }, gid);
  await p.waitForTimeout(800);
  const row2 = await p.evaluate(() => { const r = document.querySelectorAll('#panel .res-row')[1];
    const a = r.querySelector('a.res-link');
    return {href:a?.getAttribute('href'), text:a?.textContent.trim(), icon:r.querySelector('.res-type')?.textContent.trim(),
            pill:r.querySelector('.status-pill')?.textContent.trim(), host:[...r.querySelectorAll('.mono.faint')].map(n=>n.textContent.trim())[0]}; });
  is('a bare www. address is still a door', row2.href, 'https://www.example.com/about-geb');
  is('  it is called what you called it', row2.text, 'the long review');
  is('  and filed as what it is', [row2.icon, row2.pill], ['💬', 'written about it']);
  is('  with where it goes, since the name no longer says', row2.host, 'example.com');

  console.log('\n2b. a row that points nowhere does not pretend to');
  await p.evaluate(i => { const e = byId(S.entries, i); e.extra.urls.push({id:uid(), label:'the copy in my drawer', url:'', kind:'notes'}); saveNow(); reopenPanel(() => { rerender(); openMediaPanel(i); }); }, gid);
  await p.waitForTimeout(800);
  is('no anchor on it', await p.evaluate(() => !!document.querySelectorAll('#panel .res-row')[2].querySelector('a')), false);
  is('  it says its name anyway', await p.evaluate(() =>
    /* the row's own span, not the hidden editor under it — that one holds the
       label either way, which made this claim unable to fail */
    document.querySelectorAll('#panel .res-row')[2].querySelector(':scope > span.faint')?.textContent.trim()), 'the copy in my drawer');
  await p.evaluate(i => { const e = byId(S.entries, i); e.extra.urls[2].url = 'ask Marta, she has it'; saveNow(); reopenPanel(() => { rerender(); openMediaPanel(i); }); }, gid);
  await p.waitForTimeout(800);
  is('prose in the field is not an address either', await p.evaluate(() => !!document.querySelectorAll('#panel .res-row')[2].querySelector('a')), false);

  console.log('\n2c. deleting one leaves the rest alone');
  await p.evaluate(() => document.querySelectorAll('#panel .res-row')[1].querySelector('[data-ldel]').click());
  await p.waitForTimeout(1200);
  is('the middle one goes', await p.evaluate(i => byId(S.entries,i).extra.urls.map(u => u.url), gid),
     ['https://example.org/geb', 'ask Marta, she has it']);

  /* ------------------------------------------------------------------ */
  console.log('\n3. the other links — the ones that mean stages and values — are untouched');
  is('still exactly the seven dimensions', await p.evaluate(i => Object.keys(byId(S.entries,i).links).sort(), gid),
     ['projects','skills','stages','substages','threads','values','visions']);
  is('  and nothing put an address in among them', await p.evaluate(i => {
    const l = byId(S.entries,i).links;
    return Object.values(l).every(v => Array.isArray(v)) && !('urls' in l); }, gid), true);
  await shut(); await lib();

  /* ------------------------------------------------------------------ */
  console.log('\n4. the shelf card is one press from the work itself');
  const card = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.shelf-grid .work')];
    const geb = cards.find(c => c.textContent.includes('Gödel'));
    const none = cards.find(c => c.textContent.includes('A book with no address'));
    const a = geb?.querySelector('a.work-link');
    return {href:a?.getAttribute('href'), target:a?.getAttribute('target'), rel:a?.getAttribute('rel'),
            onNone: !!none?.querySelector('a.work-link')}; });
  is('the first address that goes somewhere', card.href, 'https://example.org/geb');
  is('  in another tab, with no handle back on this one', [card.target, card.rel], ['_blank', 'noopener noreferrer']);
  is('  and nothing at all where there is no address', card.onNone, false);

  console.log('\n4b. pressing it opens the work, not the panel');
  const pop = await Promise.all([
    p.waitForEvent('popup').catch(() => null),
    p.evaluate(() => [...document.querySelectorAll('.shelf-grid .work')].find(c => c.textContent.includes('Gödel')).querySelector('a.work-link').click()),
  ]).then(r => r[0]);
  await p.waitForTimeout(700);
  is('no panel opened behind it', await p.evaluate(() => !!document.querySelector('#panel')), false);
  if(pop) await pop.close().catch(() => {});
  await p.waitForTimeout(300);

  console.log('\n4c. pressing the card still opens the panel');
  await p.evaluate(() => [...document.querySelectorAll('.shelf-grid .work')].find(c => c.textContent.includes('Gödel')).click());
  await p.waitForTimeout(700);
  is('it does', await p.evaluate(() => !!document.querySelector('#panel')), true);
  await shut(); await lib();

  /* ------------------------------------------------------------------ */
  console.log('\n5. searching the shelf by where something lives');
  await p.evaluate(() => { S._mq = 'example.org'; rerender(); }); await p.waitForTimeout(700);
  is('the host finds it', await p.$$eval('.shelf-grid .work .work-title', n => n.map(x => x.textContent.trim())), ['Gödel, Escher, Bach']);
  await p.evaluate(() => { S._mq = ''; rerender(); }); await p.waitForTimeout(600);

  /* ------------------------------------------------------------------ */
  console.log('\n6. the queue: the address you found it at goes onto the shelf with it');
  await lib('/lists');
  await p.evaluate(() => openQueueItemModal()); await p.waitForTimeout(400);
  yes('the queue asks for one too', !!(await p.$('#qiUrl')));
  await p.fill('#qiTitle', 'The Dawn of Everything');
  await p.fill('#qiUrl', 'https://example.net/dawn');
  await p.click('#qiSave'); await p.waitForTimeout(900);
  is('the queue row is a door as well', await p.evaluate(() =>
    document.querySelector('.queue-item a.work-link')?.getAttribute('href')), 'https://example.net/dawn');
  await p.evaluate(() => document.querySelector('[data-qstart]').click()); await p.waitForTimeout(700);
  is('  marking it started hands the address on', await p.evaluate(() => document.querySelector('#mUrl')?.value), 'https://example.net/dawn');
  await p.click('#mSave'); await p.waitForTimeout(900);
  is('  and it is on the work', await p.evaluate(() => {
    const e = S.entries.find(x => x.type==='media' && x.title==='The Dawn of Everything');
    return (e?.extra?.urls||[]).map(u => u.url); }), ['https://example.net/dawn']);
  await shut(); await lib('/lists');

  /* ------------------------------------------------------------------ */
  console.log('\n7. a recommendation is usually just a link somebody sent you');
  await p.evaluate(() => openRecModal()); await p.waitForTimeout(400);
  yes('the inbox asks for it', !!(await p.$('#rcUrl')));
  await p.fill('#rcTitle', 'Children of Time');
  await p.fill('#rcFrom', 'Kenji');
  await p.fill('#rcUrl', 'https://example.com/children');
  await p.click('#rcSave'); await p.waitForTimeout(900);
  is('the row is a door', await p.evaluate(() => document.querySelector('.rec-row a.autolink')?.getAttribute('href')), 'https://example.com/children');
  await p.evaluate(() => document.querySelector('[data-rclog]').click()); await p.waitForTimeout(700);
  is('  logging it hands the address on', await p.evaluate(() => document.querySelector('#mUrl')?.value), 'https://example.com/children');
  await p.click('#mSave'); await p.waitForTimeout(900);
  is('  and it remembers who sent it', await p.evaluate(() => {
    const e = S.entries.find(x => x.type==='media' && x.title==='Children of Time');
    return (e?.extra?.urls||[]).map(u => [u.url, u.label]); }), [['https://example.com/children', 'sent by Kenji']]);
  await shut(); await lib('/lists');

  /* ------------------------------------------------------------------ */
  console.log('\n8. a list you give away carries the addresses out with it');
  await p.evaluate(() => {
    window._exported = null;
    const orig = URL.createObjectURL;
    URL.createObjectURL = async_b => { window._exportedBlob = async_b; return orig.call(URL, async_b); };
    const l = newCuratedList('For Kenji', 'the three');
    l.entries = S.entries.filter(e => e.type === 'media').map(e => e.id);
    saveNow(); exportListAsPage(l);
  });
  await p.waitForTimeout(600);
  const out = await p.evaluate(async () => window._exportedBlob ? await window._exportedBlob.text() : '');
  yes('the exported page links to the work', out.includes('href="https://example.org/geb"'), out.slice(0,200));
  yes('  and to the one from the queue', out.includes('href="https://example.net/dawn"'));
  yes('  while a work without an address is still listed', out.includes('A book with no address'));

  /* ------------------------------------------------------------------ */
  console.log('\n9. what was on the shelf before this existed');
  await p.evaluate(() => {
    const e = S.entries.find(x => x.type === 'media' && x.title.startsWith('Gödel'));
    /* the shapes a row can arrive in: no id, a kind that is not a kind, and
       a row somebody opened and never filled */
    e.extra.urls = [{url:'https://example.org/geb', label:'', kind:'werk'},
                    {label:'', url:'', kind:'work'},
                    {label:'only a name', url:'', kind:'notes'}];
    /* waited for: a reload that lands while the write is still in the air
       takes the write with it, and the claim below would be about timing */
    return saveNow();
  });
  await p.reload(); await p.waitForTimeout(2200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  const migrated = await p.evaluate(() => {
    const e = S.entries.find(x => x.type === 'media' && x.title.startsWith('Gödel'));
    return e.extra.urls.map(u => [u.url, u.label, u.kind, !!u.id]); });
  is('the blank row is dropped, the rest kept and named properly', migrated,
     [['https://example.org/geb', '', 'work', true], ['', 'only a name', 'notes', true]]);

  /* a reload runs every migration, not only this one, and the entry-links pass
     adds `people` to anything that predates it — so the set is eight after a
     boot and seven before one. What matters either way is that no address got
     filed among them. */
  is('  and the dimension links are still only dimensions', await p.evaluate(() => {
    const e = S.entries.find(x => x.type === 'media' && x.title.startsWith('Gödel'));
    return Object.keys(e.links).sort(); }), ['people','projects','skills','stages','substages','threads','values','visions']);

  console.log('\n9b. and a work that predates the field entirely');
  await p.evaluate(() => {
    const e = S.entries.find(x => x.type === 'media' && x.title.startsWith('Gödel'));
    delete e.extra.urls; return saveNow();
  });
  await p.reload(); await p.waitForTimeout(2200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
  is('it gets an empty shelf and nothing breaks', await p.evaluate(() => {
    const e = S.entries.find(x => x.type === 'media' && x.title.startsWith('Gödel'));
    return Array.isArray(e.extra.urls) ? e.extra.urls.length : 'not an array'; }), 0);
  await lib();
  is('  and its card draws, with no arrow on it', await p.evaluate(() => {
    const c = [...document.querySelectorAll('.shelf-grid .work')].find(x => x.textContent.includes('Gödel'));
    return c ? !!c.querySelector('a.work-link') : 'no card at all'; }), false);

  console.log('\n— errors —');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
