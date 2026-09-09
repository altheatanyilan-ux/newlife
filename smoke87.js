/* Who was there: people on a memory or a formative event, in the body of the
   entry rather than folded away, and on the card once it is written. */
const { chromium } = require('playwright');
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1400,height:1050});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(2200);

  const stageId = await page.evaluate(() => {
    S.people = ['Mei','Jonah','Aunt Ro','Sam','Priya','Kai','Tomo','Elise','Nadia','Ben'].map((n,i) =>
      ({...newPerson(n), circle:['core','close','warm','orbit','core','warm','close','orbit','warm','orbit'][i]}));
    const st = S.stages[0]; st.substages = st.substages || [];
    if(!st.substages.length) st.substages.push({id:uid(), name:'The flat on the hill', desc:'', photos:[]});
    saveNow(); return st.id;
  });
  const go = async () => { await page.evaluate(id => { location.hash = '#/stage/' + id; rerender(); }, stageId); await page.waitForTimeout(1000); };
  await go();

  console.log('\n1. the formative-event flow asks who was there, in the entry itself');
  await page.evaluate(() => document.querySelector('[data-ssmem]').click());
  await page.waitForTimeout(700);
  const f = await page.evaluate(() => {
    const fl = document.querySelector('#peopleField'); if(!fl) return null;
    const det = document.querySelector('.modal details');
    const body = document.querySelector('.modal .stack');
    return {label: document.querySelector('#peopleLabel').textContent,
      folded: !!(det && det.contains(fl)),
      inBody: !!(body && body.contains(fl)),
      aboveLinks: !!(det && (fl.compareDocumentPosition(det) & Node.DOCUMENT_POSITION_FOLLOWING)),
      chips: fl.querySelectorAll('[data-lk="people"]').length,
      newBtn: !!fl.querySelector('#eNewPerson'),
      filter: !document.querySelector('#ePplFilter').hidden};
  });
  ok('the field exists', !!f, 'no #peopleField');
  if(f){
    ok('it asks the memory\'s question, not a generic one', /who was there/i.test(f.label), f.label);
    ok('it is in the body of the entry, not inside "connect this entry"', f.inBody && !f.folded, JSON.stringify(f));
    ok('and it comes before the structural links', f.aboveLinks, 'it sits after the links block');
    ok('every person is offered', f.chips === 10, 'saw ' + f.chips);
    ok('someone new can be added from here', f.newBtn, 'no ＋ someone new');
    ok('a long list gets a filter', f.filter, 'filter hidden with 10 people');
  }

  console.log('\n2. the filter narrows without losing what is already tagged');
  await page.evaluate(() => document.querySelectorAll('#peopleChips [data-lk="people"]')[0].click());  // Mei — no "z"
  await page.fill('#ePplFilter', 'z');
  await page.waitForTimeout(250);
  const filtered = await page.evaluate(() => Array.from(document.querySelectorAll('#peopleChips [data-pname]'))
    .filter(c => !c.hidden).map(c => c.textContent.trim()));
  ok('a tagged person stays visible under a filter that excludes them',
     filtered.length === 1 && /Mei/.test(filtered[0]), JSON.stringify(filtered));
  await page.fill('#ePplFilter', 'ro');
  await page.waitForTimeout(250);
  const roFilter = await page.evaluate(() => Array.from(document.querySelectorAll('#peopleChips [data-pname]'))
    .filter(c => !c.hidden).map(c => c.textContent.trim()));
  ok('and it does match on the name', roFilter.some(t => /Aunt Ro/.test(t)), JSON.stringify(roFilter));
  await page.fill('#ePplFilter', '');
  await page.waitForTimeout(200);

  console.log('\n3. tagging, saving, and reading it back on the card');
  await page.evaluate(() => document.querySelectorAll('#peopleChips [data-lk="people"]')[2].click());  // Aunt Ro
  const hint = await page.evaluate(() => document.querySelector('#peopleHint').textContent);
  ok('the field says how many are tagged', /2 tagged/.test(hint), hint);
  await page.fill('#eTitle', 'The night the power went out');
  await page.fill('#eBody', 'We ate by candlelight.');
  await page.click('#eSave');
  await page.waitForTimeout(1000);
  const card = await page.evaluate(() => {
    const c = Array.from(document.querySelectorAll('.formative')).find(n => /power went out/.test(n.textContent));
    if(!c) return null;
    return {people: Array.from(c.querySelectorAll('.fm-people a')).map(a => ({t: a.textContent.trim(), href: a.getAttribute('href')})),
            btn: c.querySelector('[data-fmppl]')?.textContent.trim()};
  });
  ok('the event was saved', !!card, 'no card for it');
  if(card){
    ok('both people are on the card', card.people.length === 2, JSON.stringify(card.people));
    ok('each one opens that person', card.people.every(p => /^#\/people\/\w+/.test(p.href)), JSON.stringify(card.people));
    ok('the card offers the question directly', /who was there/i.test(card.btn || ''), card.btn);
  }

  console.log('\n4. it is the same link the People room reads');
  const both = await page.evaluate(() => {
    const e = S.entries.find(x => x.title === 'The night the power went out');
    const ids = e.links.people;
    return {onEntry: ids.length,
      onPerson: ids.every(id => S.entries.filter(x => (x.links?.people||[]).includes(id)).some(x => x.id === e.id)),
      names: ids.map(id => byId(S.people, id).name)};
  });
  ok('the entry carries the link, and the people carry the entry',
     both.onEntry === 2 && both.onPerson, JSON.stringify(both));

  console.log('\n5. the card reopens the entry on the question');
  await page.evaluate(() => { const c = Array.from(document.querySelectorAll('.formative')).find(n => /power went out/.test(n.textContent));
    c.querySelector('[data-fmppl]').click(); });
  await page.waitForTimeout(900);
  const re = await page.evaluate(() => ({exists: !!document.querySelector('#peopleField'),
    tagged: document.querySelectorAll('#peopleChips .chip.on').length,
    label: document.querySelector('#peopleLabel')?.textContent}));
  ok('it reopens with both still tagged', re.exists && re.tagged === 2, JSON.stringify(re));
  await page.evaluate(() => closeModals());
  await page.waitForTimeout(400);

  console.log('\n6. other kinds ask their own version of the question');
  const labels = await page.evaluate(async () => {
    const out = {};
    for(const t of ['memory','gratitude','letter','reflection']){
      openEntryModal({type: t});
      await new Promise(r => setTimeout(r, 250));
      out[t] = document.querySelector('#peopleLabel')?.textContent;
      closeModals(); await new Promise(r => setTimeout(r, 150));
    }
    return out;
  });
  ok('a memory asks who was there', /who was there/i.test(labels.memory || ''), labels.memory);
  ok('a gratitude asks who to thank', /thank/i.test(labels.gratitude || ''), labels.gratitude);
  ok('a letter asks who it concerns', /concerns/i.test(labels.letter || ''), labels.letter);
  ok('anything else keeps the plain label', /tag anyone this involves/i.test(labels.reflection || ''), labels.reflection);

  console.log('\n7. switching kind inside the modal relabels the field');
  const swap = await page.evaluate(async () => {
    openEntryModal({type: 'reflection'});
    await new Promise(r => setTimeout(r, 300));
    const before = document.querySelector('#peopleLabel').textContent;
    document.querySelector('#typeRow [data-t="memory"]').click();
    await new Promise(r => setTimeout(r, 300));
    const after = document.querySelector('#peopleLabel').textContent;
    closeModals();
    return {before, after};
  });
  ok('reflection → memory changes the question',
     /tag anyone/i.test(swap.before) && /who was there/i.test(swap.after), JSON.stringify(swap));

  console.log('\n8. Journals: the add button rides in the search row');
  const jrow = async w => { await page.setViewportSize({width:w, height:1000});
    await page.evaluate(() => { location.hash = '#/journals'; rerender(); }); await page.waitForTimeout(900);
    return page.evaluate(() => {
      const bar = document.querySelector('#ctxAdd'), tools = document.querySelector('.jtools'), q = document.querySelector('#jq');
      if(!bar || !tools || !q) return {missing:true};
      const b = bar.getBoundingClientRect(), s = q.getBoundingClientRect(), t = tools.getBoundingClientRect();
      return {inRow: tools.contains(bar), atTopOfPage: !!document.querySelector('.page > #ctxAdd'),
        sameLine: Math.abs((b.top + b.height/2) - (s.top + s.height/2)) < 12,
        rightOfSearch: b.left > s.right, searchW: Math.round(s.width),
        withinRow: b.right <= Math.round(t.right) + 1, label: bar.textContent.trim()};
    }); };
  const wide = await jrow(1400);
  ok('the button is in the search row, not above the page', wide.inRow && !wide.atTopOfPage, JSON.stringify(wide));
  ok('on the same line as the search box', wide.sameLine, JSON.stringify(wide));
  ok('at the far end of it', wide.rightOfSearch && wide.withinRow, JSON.stringify(wide));
  ok('and the search box is still usable width', wide.searchW >= 150, 'search is ' + wide.searchW + 'px');
  ok('it still says what it adds', /New reflection/.test(wide.label || ''), wide.label);
  const narrow = await jrow(760);
  ok('it stays in the row when the row wraps', narrow.inRow && !narrow.atTopOfPage, JSON.stringify(narrow));
  await page.setViewportSize({width:1400, height:1050});

  console.log('\n9. every other page keeps its button above the page');
  const moved = [];
  for(const r of ['#/timeline','#/projects','#/finance','#/commonplace','#/people','#/values','#/skills']){
    await page.evaluate(h => { location.hash = h; rerender(); }, r); await page.waitForTimeout(700);
    const top = await page.evaluate(() => { const b = document.querySelector('#ctxAdd');
      return b ? !!document.querySelector('.page > #ctxAdd') : 'none'; });
    if(top === false) moved.push(r);
  }
  ok('no other page had its button relocated', moved.length === 0, moved.join(', '));

  console.log('\n10. nothing threw');
  ok('no page or console errors', errors.length === 0, errors.join(' | '));

  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
