const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);

  // an OLD project with a single body — migration must keep the text
  const wid = await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const w = newWriting(); w.title='On leaving'; w.body='The original single-body text that must survive.';
    w.extra.premise='What leaving costs.';
    saveNow(); return w.id;
  });
  await page.evaluate(id => { location.hash='#/writing/'+id; }, wid);
  await page.waitForTimeout(800);

  const mig = await page.evaluate(id => {
    const w = byId(S.entries, id); const x = w.extra;
    const docs = wsFlatDocs(x.binder);
    return { binderRoots: x.binder.length, docs: docs.length,
      firstDocName: docs[0]?.name, bodyPreserved: docs[0]?.body,
      synopsisFromPremise: docs[0]?.synopsis, openDoc: !!x.openDoc };
  }, wid);
  console.log('migration:', JSON.stringify(mig));

  const ui = await page.evaluate(() => ({
    binder: !!document.querySelector('#wsBinder'),
    nodes: document.querySelectorAll('[data-wsnode]').length,
    viewTabs: document.querySelectorAll('[data-wsview]').length,
    inspector: !!document.querySelector('#wsInspector'),
    inspTabs: document.querySelectorAll('[data-wsitab]').length,
    editor: !!document.querySelector('#wBody'),
  }));
  console.log('ui present:', JSON.stringify(ui));

  // create a document, type into it, confirm it saves to the node not the project
  const typed = await page.evaluate(async id => {
    document.querySelector('#wsNewDoc').click();
    await new Promise(r=>setTimeout(r,350));
    const ta = document.querySelector('#wBody');
    ta.value = 'Fresh words in the new document.';
    ta.dispatchEvent(new Event('input'));
    await new Promise(r=>setTimeout(r,700));
    const w = byId(S.entries, id); const docs = wsFlatDocs(w.extra.binder);
    return { docs: docs.length, newDocBody: docs.find(d=>d.id===w.extra.openDoc)?.body,
             projectBodyUnchanged: w.body };
  }, wid);
  console.log('new doc + typing:', JSON.stringify(typed));

  // each view mode renders
  for(const v of ['corkboard','outliner','manuscript','editor']){
    await page.evaluate(vv => document.querySelector(`[data-wsview="${vv}"]`).click(), v);
    await page.waitForTimeout(400);
    const info = await page.evaluate(vv => ({
      view: vv,
      cards: document.querySelectorAll('[data-wscard]').length,
      rows: document.querySelectorAll('[data-wsrow]').length,
      sections: document.querySelectorAll('.ws-msec').length,
      editor: !!document.querySelector('#wBody'),
      stageHeight: Math.round(document.querySelector('#wsStage')?.getBoundingClientRect().height||0),
    }), v);
    console.log('  view', JSON.stringify(info));
  }

  // snapshot + diff
  const snap = await page.evaluate(async id => {
    document.querySelector('[data-wsitab="snap"]').click();
    await new Promise(r=>setTimeout(r,300));
    const w = byId(S.entries, id); const d = wsFind(w.extra.binder, w.extra.openDoc);
    wsSnapshot(d, 'first'); d.body = 'Fresh words, now revised entirely.'; saveNow();
    const html = wsDiffHTML(d.snapshots[0].body, d.body);
    return { snapshots: d.snapshots.length, hasDel: /<del>/.test(html), hasIns: /<ins>/.test(html),
             sample: html.replace(/<[^>]+>/g,'|').slice(0,60) };
  }, wid);
  console.log('snapshot + diff:', JSON.stringify(snap));

  // compile
  const compiled = await page.evaluate(id => {
    const w = byId(S.entries, id);
    const out = wsCompile(w, {titles:true});
    return { length: out.length, hasHeading: /^# /m.test(out), hasRule: out.includes('---') };
  }, wid);
  console.log('compile:', JSON.stringify(compiled));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
