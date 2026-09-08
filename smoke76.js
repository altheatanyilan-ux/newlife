const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.setViewportSize({width:1400,height:1100});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(800);
  await p.evaluate(() => { S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    S.values=[{id:'v1',name:'Authenticity',color:'#ab93cf',fields:{},practices:[]},{id:'v2',name:'Mastery',color:'#3fae7a',fields:{},practices:[]}];
    S.valueOrder=['v1','v2']; saveNow(); });
  // every route renders without error
  const routes = ['compass','today','lifetape','lifetape/habits','lifetape/patterns','journals','projects','writing','people','finance','commonplace','import','values','needs','spiral','skills','vision','timeline','settings','value/v1'];
  for(const r of routes){
    await p.evaluate(x => { location.hash = '#/'+x; }, r);
    await p.waitForTimeout(420);
    const ok = await p.evaluate(() => ({ hash:location.hash, err: /Something went wrong/.test(document.querySelector('#main')?.textContent||''), nodes: document.querySelector('#main')?.children.length }));
    console.log(`  ${r.padEnd(20)} ${ok.err ? 'RENDER ERROR' : 'ok'} (${ok.nodes} nodes)`);
  }
  await p.evaluate(() => { location.hash='#/compass'; }); await p.waitForTimeout(900);
  console.log('house nodes:', await p.evaluate(() => ({
    nodes: [...document.querySelectorAll('.hnode')].map(n=>n.dataset.node),
    hasNeeds: !!document.querySelector('.hnode[data-node="needs"]'),
    hasSpiral: !!document.querySelector('.hnode[data-node="spiral"]'),
    levelAnnots: [...document.querySelectorAll('.hnode .hs')].filter(t=>/^L\d /.test(t.textContent)).length })));
  await p.evaluate(() => { location.hash='#/value/v1'; }); await p.waitForTimeout(700);
  console.log('value stage note:', await p.evaluate(() => document.querySelector('.val-stage-note')?.textContent?.trim()));
  console.log('ERRORS:', errs.length); errs.slice(0,8).forEach(e=>console.log('  '+e));
  await b.close();
})();
