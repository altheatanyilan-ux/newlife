const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage(); await page.setViewportSize({width:1300,height:1000});
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html'); await page.waitForTimeout(800);
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    S.ideas=[{id:'i1',text:'a spark',kind:'spark',note:'',createdAt:new Date().toISOString(),tags:[]},
             {id:'i2',text:'an old inspiration',kind:'inspiration',note:'',createdAt:new Date().toISOString(),tags:[]},
             {id:'i3',text:'an old experiment',kind:'experiment',note:'',createdAt:new Date().toISOString(),tags:[]},
             {id:'i4',text:'what do I not know?',kind:'question',note:'',createdAt:new Date().toISOString(),tags:[]}];
    migrateIdeas(); S.settings.projectMode='ideation'; saveNow(); location.hash='#/projects';
  });
  await page.waitForTimeout(900);
  console.log('ideation:', JSON.stringify(await page.evaluate(() => {
    const cols = [...document.querySelectorAll('.spark-col')];
    const r = cols.map(c => Math.round(c.getBoundingClientRect().width));
    return { kinds: cols.map(c => c.querySelector('.sc')?.textContent?.trim()),
      widths: r, halfEach: r.length===2 && Math.abs(r[0]-r[1]) < 4,
      sideBySide: cols.length===2 && Math.round(cols[0].getBoundingClientRect().top)===Math.round(cols[1].getBoundingClientRect().top),
      folded: S.ideas.map(i=>i.kind),
      pickerOptions: [...document.querySelectorAll('#ideaKind option')].map(o=>o.value),
      brainstormGone: !document.body.textContent.includes('Brainstorm') };
  }), null, 1));
  console.log('ERRORS:', errors.length); errors.slice(0,5).forEach(e=>console.log('  '+e));
  await b.close();
})();
