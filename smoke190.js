/* smoke190 — a link is a thing you press.

   "there are quite some places where I can attach a link - i want to make it
   such that when I click on the link it can open the link straight, instead of
   me needing to copy paste that link in a search bar."

   An address written down anywhere in here was a string. You selected it, you
   copied it, you found a bar to paste it into. It is a door now, in the three
   places an address turns up:

   IN PROSE. Notes, journal entries, descriptions — anywhere markdown is
   rendered. A link written as itself is how anybody actually pastes one, and
   it used to be the one form the renderer did not handle: it knew
   [named](url) and nothing else.

   IN A FIELD THAT IS ONLY AN ADDRESS. A project's link, a resource's URL.
   These are click-to-edit fields, so the link takes the click — which is what
   you want nine times in ten, and leaves nothing to click on for the tenth.
   So such a field carries its own small pencil, which is not an anchor and
   therefore starts an edit instead of opening anything.

   IN A BOX YOU ARE TYPING ONE INTO. The ↗ beside it opens what is in the box
   now rather than what was last saved, because you have usually just pasted
   it and not yet left the field.

   Two things have to hold throughout. Nothing opens in this tab: this page is
   somebody's whole instrument and a navigation away from it would lose the
   session, so every link is target=_blank with rel="noopener noreferrer" —
   the opened page does not get a handle back on this one either. And the text
   around a link is still text: escaping happens first, linking second, so a
   note containing a script tag is a note containing the words. */
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
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. an address written as itself becomes one you can press');
  /* read the href the way a browser does rather than off the markup: an
     ampersand is written &amp; in an attribute and is an ampersand once
     parsed, so matching the raw string would be testing the escaping */
  await p.evaluate(() => { window._href = s => { const d = document.createElement('div');
    d.innerHTML = linkify(s); const a = d.querySelector('a'); return a ? a.getAttribute('href') : null; }; });
  const forms = await p.evaluate(() => {
    const href = window._href;
    return {
      https: href('see https://example.com/a for more'),
      www:   href('www.example.com works'),
      mail:  href('write to me@example.com'),
      none:  href('nothing here at all'),
      query: href('https://example.com/r?a=1&b=2')};
  });
  is('a full address', forms.https, 'https://example.com/a');
  is('  one written without the scheme', forms.www, 'https://www.example.com');
  is('  an email address', forms.mail, 'mailto:me@example.com');
  is('  a query string survives whole', forms.query, 'https://example.com/r?a=1&b=2');
  is('  and ordinary text is left as text', forms.none, null);

  console.log('\n2. the sentence around it is not part of it');
  const edges = await p.evaluate(() => {
    const href = window._href;
    return {
      stop:  href('go to https://example.com/page. Then stop.'),
      comma: href('https://example.com/x, and then'),
      wrap:  href('(see https://example.com/y)'),
      inner: href('(https://en.wikipedia.org/wiki/Foo_(bar))')};
  });
  is('a full stop ends the sentence, not the path', edges.stop, 'https://example.com/page');
  is('  and so does a comma', edges.comma, 'https://example.com/x');
  is('  a bracket round it is not in it', edges.wrap, 'https://example.com/y');
  is('  but a bracket the path opened is', edges.inner, 'https://en.wikipedia.org/wiki/Foo_(bar)');

  console.log('\n3. nothing opens in this tab, and nothing gets a handle on it');
  const safety = await p.evaluate(() => {
    const d = document.createElement('div');
    d.innerHTML = md('a note with https://example.com/x and a [named one](https://example.com/y)');
    return [...d.querySelectorAll('a')].map(a => ({t:a.getAttribute('target'), r:a.getAttribute('rel')}));
  });
  yes('every link leaves this page alone', safety.length === 2 && safety.every(a => a.t === '_blank'), JSON.stringify(safety));
  yes('  and cannot reach back through window.opener',
    safety.every(a => /noopener/.test(a.r || '') && /noreferrer/.test(a.r || '')), JSON.stringify(safety));

  console.log('\n4. the text around a link is still text');
  const safe = await p.evaluate(() => linkify('<script>alert(1)</script> https://x.com'));
  yes('a script tag stays words', /&lt;script&gt;/.test(safe) && !/<script/.test(safe), safe);
  yes('  and the address beside it still works', /href="https:\/\/x\.com"/.test(safe), safe);

  console.log('\n5. a named link keeps its name, and is not linked twice');
  const named = await p.evaluate(() => ({
    keeps: md('a [named link](https://example.com/y) stays named'),
    self:  md('[https://example.com/z](https://example.com/z)')}));
  yes('the name is what you see', />named link</.test(named.keeps), named.keeps);
  is('  and there is one link, not two', (named.keeps.match(/<a /g) || []).length, 1);
  is('  even when the name is the address itself', (named.self.match(/<a /g) || []).length, 1);

  console.log('\n6. in prose it is on the page, not just in the markup');
  await p.evaluate(() => {
    S.entries.push({id:'s190', type:'reflection', title:'s190 a note', occurredAt: today(),
      body:'read this: https://example.com/read?a=1&b=2 and www.other.org too',
      createdAt:new Date().toISOString(), extra:{}, tags:[], links:{}});
    saveNow(); location.hash = '#/journals';
  });
  await p.waitForTimeout(1800);
  const inCard = await p.evaluate(() => {
    const card = [...document.querySelectorAll('.entry')].find(c => c.textContent.includes('s190 a note'));
    return card ? [...card.querySelectorAll('.body a')].map(a => a.getAttribute('href')) : null; });
  is('both of the note\'s addresses are links', inCard,
    ['https://example.com/read?a=1&b=2', 'https://www.other.org']);

  console.log('\n7. a field that is only an address opens, and still lets you rewrite it');
  const pid = await p.evaluate(() => { const pr = (S.projects || [])[0];
    pr.link = 'https://example.com/the-finished-thing'; saveNow(); return pr.id; });
  await p.evaluate(() => { location.hash = '#/projects'; }); await p.waitForTimeout(1600);
  await p.evaluate(i => openProjectPanel(i), pid); await p.waitForTimeout(1300);
  const field = await p.evaluate(() => {
    const ed = [...document.querySelectorAll('#panel .ed')].find(n => n.dataset.path?.endsWith('.link'));
    const a = ed?.querySelector('a');
    return {there: !!ed, href: a?.getAttribute('href'), pen: !!ed?.querySelector('.ed-pen')}; });
  is('it is drawn as the link it holds', field.href, 'https://example.com/the-finished-thing');
  yes('  with a small way back in beside it', field.pen, JSON.stringify(field));
  /* the delegated handler starts an edit for any click inside a field that is
     not on an anchor — so the pencil edits and the link does not */
  await p.evaluate(() => { const ed = [...document.querySelectorAll('#panel .ed')].find(n => n.dataset.path?.endsWith('.link'));
    ed?.querySelector('.ed-pen')?.click(); });
  await p.waitForTimeout(600);
  yes('pressing it opens the field for rewriting',
    await p.evaluate(() => !!document.querySelector('#panel .ed.editing input')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const linkClick = await p.evaluate(() => {
    const ed = [...document.querySelectorAll('#panel .ed')].find(n => n.dataset.path?.endsWith('.link'));
    if(!ed) return 'field gone';
    const a = ed.querySelector('a'); if(!a) return 'link gone';
    /* the click is cancelled so the test does not actually leave, but it still
       travels through the page's own handler on the way */
    a.addEventListener('click', ev => ev.preventDefault(), {once:true});
    a.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
    return !!document.querySelector('#panel .ed.editing'); });
  is('and pressing the link does not open the field instead', linkClick, false);
  await p.evaluate(() => closePanel());

  console.log('\n8. a box you type an address into has the way out beside the way in');
  /* the shadowing take's "where it is" field, which is a link box like any
     other — it used to be the Piano Studio's sheet-music field, and that room
     is gone */
  await p.evaluate(() => { location.hash = '#/japanese'; }); await p.waitForTimeout(1700);
  await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(n => n.remove()); openJaShadow(); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const inp = document.querySelector('#shLink');
    inp.value = 'https://example.com/score.pdf';
    inp.dispatchEvent(new Event('input', {bubbles:true})); });
  await p.waitForTimeout(400);
  const box = await p.evaluate(() => {
    const el = document.querySelector('#shLink').closest('.linkbox');
    return el ? {lit: el.classList.contains('has-link'), go: !!el.querySelector('[data-linkgo]')} : null; });
  yes('the box carries an opener', box && box.go, JSON.stringify(box));
  yes('  lit, because there is something in it', box && box.lit, JSON.stringify(box));
  /* it follows the field rather than the last save, because you have usually
     just pasted and not yet left the box */
  const live = await p.evaluate(() => {
    const el = document.querySelector('#shLink').closest('.linkbox');
    const inp = el.querySelector('input');
    const set = v => { inp.value = v; inp.dispatchEvent(new Event('input', {bubbles:true})); return el.classList.contains('has-link'); };
    return {emptied: set(''), typed: set('www.imslp.org/x'), nonsense: set('not a link at all')}; });
  is('emptying it puts the opener out', live.emptied, false);
  is('  typing one lights it again', live.typed, true);
  is('  and words that are not an address do not', live.nonsense, false);

  console.log('\n8b. the rooms where a link is most often written');
  /* a line about somebody with an address in it, and a follow-up that is one.
     The person is made here rather than borrowed: a fresh profile has none,
     and a check that quietly skips is a check that passes for the wrong
     reason. */
  await p.evaluate(() => {
    const person = newPerson('s190 Somebody');
    S.people = S.people || []; S.people.push(person);
    S.interactions = S.interactions || [];
    S.interactions.push({id:'s190i', personId:person.id, date:today(), type:'text',
      description:'they sent me https://example.com/the-piece', quality:'', energy:'',
      followUp:'read www.other.org/thing', followUpDone:false});
    S._pplView = 'log'; saveNow();
    if(location.hash === '#/people') rerender(); else location.hash = '#/people';
  });
  await p.waitForTimeout(1800);
  const shown = await p.evaluate(() => {
    const row = [...document.querySelectorAll('.int-row')].find(r => r.textContent.includes('the-piece'));
    if(!row) return {no:'row not found', rows: document.querySelectorAll('.int-row').length};
    return {desc: row.querySelector('.int-desc a')?.getAttribute('href'),
      follow: row.querySelector('.int-follow a')?.getAttribute('href')}; });
  is('an address in what you wrote about somebody', shown.desc, 'https://example.com/the-piece');
  is('  and one in the thing you said you would do', shown.follow, 'https://www.other.org/thing');

  console.log('\n9. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
