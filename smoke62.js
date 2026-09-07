const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);

  const wid = await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const w = newWriting(); w.title='Long piece'; w.body='seed text';
    saveNow(); return w.id;
  });
  await page.evaluate(id => { location.hash='#/writing/'+id; }, wid);
  await page.waitForTimeout(800);

  // build a few docs with varied status/label
  await page.evaluate(id => {
    const w = byId(S.entries, id); const x = w.extra;
    const d = wsFind(x.binder, wsFlatDocs(x.binder)[0].id);
    const mk = (name, status, label, body) => { const n = wsNewNode('doc', name); n.status=status; n.label=label; n.body=body; return n; };
    const draft = x.binder[0];
    draft.children.push(mk('Second','first draft','scene','Words about the sea.'));
    draft.children.push(mk('Third','polished','chapter','More words entirely.'));
    saveNow(); rerender();
  }, wid);
  await page.waitForTimeout(500);

  // typewriter toggle
  const tw = await page.evaluate(id => {
    document.querySelector('#wsTypewriter').click();
    return byId(S.entries, id).extra._typewriter;
  }, wid);
  await page.waitForTimeout(350);
  console.log('typewriter toggles:', tw);

  // collection: smart filter by status
  const coll = await page.evaluate(id => {
    const w = byId(S.entries, id);
    w.extra.collections.push({id:'c1', name:'Polished only', type:'smart', filter:{status:'polished', label:'', q:''}, docs:[]});
    saveNow(); rerender();
    return wsCollectionDocs(w, w.extra.collections[0]).map(d=>d.name);
  }, wid);
  await page.waitForTimeout(400);
  console.log('smart collection matches:', JSON.stringify(coll));

  const collUI = await page.evaluate(() => {
    const b = document.querySelector('[data-wscoll]'); if(!b) return {noChip:true};
    b.click(); return {clicked:true};
  });
  await page.waitForTimeout(450);
  const scoped = await page.evaluate(() => ({
    activeChip: !!document.querySelector('.ws-coll.on'),
    view: document.querySelector('[data-wsview].on')?.dataset.wsview,
    cards: document.querySelectorAll('[data-wscard]').length,
  }));
  console.log('collection active:', JSON.stringify(collUI), '→', JSON.stringify(scoped));

  // writing history on the desk
  await page.evaluate(() => { location.hash='#/writing'; });
  await page.waitForTimeout(700);
  const hist = await page.evaluate(() => {
    const h = document.querySelector('.ws-hist');
    return { present: !!h, cells: h?.children.length,
      caption: document.querySelector('.ws-hist')?.previousElementSibling?.textContent?.replace(/\s+/g,' ').trim().slice(0,70) };
  });
  console.log('writing history:', JSON.stringify(hist));

  // keyboard: cmd-N makes a document
  await page.evaluate(id => { location.hash='#/writing/'+id; }, wid);
  await page.waitForTimeout(700);
  const before = await page.evaluate(id => wsFlatDocs(byId(S.entries,id).extra.binder).length, wid);
  await page.keyboard.down('Control'); await page.keyboard.press('n'); await page.keyboard.up('Control');
  await page.waitForTimeout(500);
  const after = await page.evaluate(id => wsFlatDocs(byId(S.entries,id).extra.binder).length, wid);
  console.log('ctrl+N new document:', before, '→', after);

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
