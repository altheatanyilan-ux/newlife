const { chromium } = require('playwright');
const IMG='data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1280,height:1000});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(800);
  await page.evaluate(IMG => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const st = S.stages[0] || (S.stages.push({id:'st1',num:1,char:'一',name:'Childhood',tagline:'',hue:'#b08968',years:'',narrative:'',narrativeHistory:[],substages:[],photos:[],soundtrack:[],artifacts:[],letters:{to:'',from:''},retroValues:{},notyet:false}) && S.stages[0]);
    st.substages = [
      {id:'ss1',name:'The first year',desc:'What happened.',photos:[{id:'p1',src:IMG,caption:'a'},{id:'p2',src:IMG,caption:'b'}]},
      {id:'ss2',name:'The second',desc:'',photos:[]}];
    saveNow(); location.hash = '#/stage/' + st.id;
  }, IMG);
  await page.waitForTimeout(900);
  const out = await page.evaluate(() => ({
    board: !!document.querySelector('.board-wrap'),
    boardTitle: [...document.querySelectorAll('.sc')].some(x=>/board for this chapter/i.test(x.textContent)),
    substages: document.querySelectorAll('.substage').length,
    plated: document.querySelectorAll('.substage.plated').length,
    plateImg: !!document.querySelector('.ss-plate-img'),
    galleryHidden: document.querySelectorAll('.substage .gallery').length,
    galBtn: !!document.querySelector('[data-ssgal]'),
  }));
  console.log('stage page:', JSON.stringify(out));
  await page.evaluate(() => document.querySelector('[data-ssgal]').click());
  await page.waitForTimeout(600);
  console.log('gallery after toggle:', await page.evaluate(() => document.querySelectorAll('.substage .gallery .photo').length));
  console.log('ERRORS:', errors.length); errors.slice(0,8).forEach(e=>console.log('  '+e));
  await browser.close();
})();
