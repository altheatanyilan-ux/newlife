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
    S.values=[{id:'v1',name:'Craft',color:'#c25b5b',fields:{embody:[],hundred:[],motivation:[],counterfeit:[]},practices:[]}];
    S.valueOrder=['v1']; S.valueOrderHistory=[];
    // a Library entry sharing the value, carrying two quotes
    S.entries.push({id:'md1', type:'media', title:'Psycho-Cybernetics', body:'', occurredAt:today(),
      createdAt:new Date().toISOString(), media:[],
      links:{stages:[],substages:[],threads:[],values:[{id:'v1',pol:'+'}],visions:[],skills:[],projects:[],people:[]},
      people:[],places:[],emotions:[],tags:['selfimage'],confidence:'',
      extra:{kind:'book', creator:'Maxwell Maltz', status:'finished', oneLineCapture:'The nervous system cannot tell the difference.',
             quotes:[{id:'q1',text:'You are not your mistakes.',where:'ch.2',why:'core'},
                     {id:'q2',text:'The mental screen is a rehearsal room.',where:'ch.4',why:''}]}});
    // a writing piece linked to the same value
    const w = newWriting(); w.title='On self-image'; w.links.values=[{id:'v1',pol:'+'}]; w.tags=['selfimage'];
    saveNow(); return w.id;
  });

  await page.evaluate(id => { location.hash = '#/writing/'+id; }, wid);
  await page.waitForTimeout(700);

  // #48 — Library shelf and quotes appear
  const lib = await page.evaluate(() => {
    const d = document.querySelector('#drawer');
    const summaries = [...d.querySelectorAll('summary')].map(s=>s.textContent.trim());
    const quoteItems = [...d.querySelectorAll('[data-dkind="quote"]')];
    return { summaries, quoteCount: quoteItems.length,
      quoteText: quoteItems[0]?.querySelector('.snippet')?.textContent?.trim().slice(0,44),
      quoteAttrib: quoteItems[0]?.querySelector('.meta')?.textContent?.trim(),
      mediaItemShowsCapture: [...d.querySelectorAll('[data-dkind="entry"]')].some(n=>/nervous system/i.test(n.textContent)) };
  });
  console.log('#48 Library in drawer:', JSON.stringify(lib, null, 1));

  // pinning a quote keeps its compound id intact
  const pinned = await page.evaluate(() => {
    const b = document.querySelector('[data-dkind="quote"] [data-pin]');
    b.click();
    const p = S.entries.find(e=>e.type==='writing').extra.pinned.slice(-1)[0];
    return {kind:p.kind, sourceId:p.sourceId, resolves: !!pinnedMeta(p)};
  });
  console.log('#48 pin a quote:', JSON.stringify(pinned));

  // #47 — panes hide, widths persist, focus collapses both
  await page.waitForTimeout(400);
  const panes = await page.evaluate(() => {
    const L = document.querySelector('#wsLayout');
    const cols = () => getComputedStyle(L).gridTemplateColumns;
    const start = cols();
    document.querySelector('#wPaneL').click();
    return {start, afterHideDrawer: S.settings.wstudio.drawer};
  });
  await page.waitForTimeout(400);
  const afterHide = await page.evaluate(() => {
    const L = document.querySelector('#wsLayout');
    return { hasNoL: L.classList.contains('no-l'), cols: getComputedStyle(L).gridTemplateColumns,
             drawerVisible: !!document.querySelector('.drawer')?.offsetWidth };
  });
  console.log('#47 hide drawer:', JSON.stringify(panes), '→', JSON.stringify(afterHide));

  const focused = await page.evaluate(() => {
    document.querySelector('#wPaneL').click(); // restore
    return true;
  });
  await page.waitForTimeout(350);
  await page.evaluate(() => document.querySelector('#wFocus').click());
  await page.waitForTimeout(450);
  const focusInfo = await page.evaluate(() => {
    const L = document.querySelector('#wsLayout');
    const ed = document.querySelector('#wBody');
    return { pageHasFocusClass: !!document.querySelector('.wstudio-focus'),
             cols: getComputedStyle(L).gridTemplateColumns,
             editorWidth: Math.round(ed.getBoundingClientRect().width),
             drawerWidth: Math.round(document.querySelector('.drawer').getBoundingClientRect().width) };
  });
  console.log('#47 focus mode:', JSON.stringify(focusInfo));

  await page.evaluate(() => document.querySelector('#wFocus').click());
  await page.waitForTimeout(350);
  const unfocused = await page.evaluate(() => Math.round(document.querySelector('#wBody').getBoundingClientRect().width));
  console.log('#47 editor width focus vs normal:', focusInfo.editorWidth, 'vs', unfocused);

  // width persists
  const widths = await page.evaluate(() => { S.settings.wstudio.lw = 420; saveNow(); rerender(); return S.settings.wstudio; });
  await page.waitForTimeout(400);
  const applied = await page.evaluate(() => getComputedStyle(document.querySelector('#wsLayout')).gridTemplateColumns.split(' ')[0]);
  console.log('#47 saved width applied:', JSON.stringify({saved:widths.lw, rendered:applied}));

  // #49 — board fills the width
  await page.evaluate(() => { location.hash='#/writing'; });
  await page.waitForTimeout(600);
  const board = await page.evaluate(() => {
    const k = document.querySelector('#wkanban'); if(!k) return {missing:true};
    const cols = [...k.querySelectorAll('.wkcol')];
    const kr = k.getBoundingClientRect();
    const last = cols[cols.length-1].getBoundingClientRect();
    return { columns: cols.length,
      display: getComputedStyle(k).display,
      boardWidth: Math.round(kr.width),
      rightmostEdge: Math.round(last.right - kr.left),
      fillsWidth: (last.right - kr.left) > kr.width * 0.9,
      hasDropSlots: k.querySelectorAll('.wkcol-drop').length,
      quietCols: k.querySelectorAll('.wkcol.quiet').length };
  });
  console.log('#49 board:', JSON.stringify(board));

  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
