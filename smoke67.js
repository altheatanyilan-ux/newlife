const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setViewportSize({width:1400, height:900});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(600);

  const wid = await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const w = newWriting(); w.title='Overlap test'; w.body='some words here to give it height';
    S.settings.wstudio = {lw:280, rw:300, drawer:true, board:true};
    saveNow(); return w.id;
  });
  await page.evaluate(id => { location.hash='#/writing/'+id; }, wid);
  await page.waitForTimeout(800);

  // does anything in a side column cross into the editor's box?
  const geom = () => page.evaluate(() => {
    const L = document.querySelector('.ws-left'), R = document.querySelector('.ws-right');
    const mid = document.querySelector('#wsStage');
    const box = n => { if(!n) return null; const r = n.getBoundingClientRect(); return {l:Math.round(r.left), r:Math.round(r.right), w:Math.round(r.width)}; };
    // widest thing actually painted inside each side column
    const spread = side => { if(!side) return null;
      let lo=Infinity, hi=-Infinity;
      side.querySelectorAll('*').forEach(n => { const r=n.getBoundingClientRect(); if(r.width||r.height){ lo=Math.min(lo,r.left); hi=Math.max(hi,r.right); } });
      return lo===Infinity ? null : {l:Math.round(lo), r:Math.round(hi)};
    };
    const m = box(mid);
    return {
      cols: getComputedStyle(document.querySelector('#wsLayout')).gridTemplateColumns,
      left: box(L), right: box(R), mid: m,
      leftContent: spread(L), rightContent: spread(R),
      leftOverlapsMid:  spread(L) && m ? spread(L).r > m.l + 1 : false,
      rightOverlapsMid: spread(R) && m ? spread(R).l < m.r - 1 : false,
      railLvisible: !!document.querySelector('#wsRailL')?.offsetParent,
      railRvisible: !!document.querySelector('#wsRailR')?.offsetParent,
    };
  });

  console.log('BOTH OPEN   ', JSON.stringify(await geom()));

  // fold the left using the button ON the binder itself
  await page.evaluate(() => document.querySelector('#wsFoldL').click());
  await page.waitForTimeout(500);
  const l = await geom();
  console.log('LEFT FOLDED ', JSON.stringify(l));

  // fold the right using the button ON the inspector itself
  await page.evaluate(() => document.querySelector('#wsFoldR').click());
  await page.waitForTimeout(500);
  const b = await geom();
  console.log('BOTH FOLDED ', JSON.stringify(b));

  // reopen from the rails alone
  await page.evaluate(() => document.querySelector('#wsRailL').click());
  await page.waitForTimeout(450);
  await page.evaluate(() => document.querySelector('#wsRailR').click());
  await page.waitForTimeout(500);
  const re = await page.evaluate(() => ({
    drawer: S.settings.wstudio.drawer, board: S.settings.wstudio.board,
    binderVisible: !!document.querySelector('#wsBinder')?.offsetParent,
    inspectorVisible: !!document.querySelector('#wsInspector')?.offsetParent,
  }));
  console.log('REOPENED VIA RAILS', JSON.stringify(re));

  // focus mode leaves nothing, not even rails
  await page.evaluate(() => document.querySelector('#wFocus').click());
  await page.waitForTimeout(500);
  const f = await page.evaluate(() => ({
    cols: getComputedStyle(document.querySelector('#wsLayout')).gridTemplateColumns,
    leftShown: !!document.querySelector('.ws-left')?.offsetParent,
    rightShown: !!document.querySelector('.ws-right')?.offsetParent,
    railShown: !!document.querySelector('#wsRailL')?.offsetParent,
    editorW: Math.round(document.querySelector('#wBody').getBoundingClientRect().width),
  }));
  console.log('FOCUS       ', JSON.stringify(f));

  const pass = !l.leftOverlapsMid && !l.rightOverlapsMid && !b.leftOverlapsMid && !b.rightOverlapsMid
            && l.railLvisible && b.railRvisible && re.drawer && re.board && !f.railShown;
  console.log('\n' + (pass ? 'PASS — folded sides occupy only their rail and never cross the editor.'
                           : 'FAIL — see the overlap flags above.'));
  console.log('ERRORS:', errors.length); errors.forEach(e => console.log(e));
  await browser.close();
})();
