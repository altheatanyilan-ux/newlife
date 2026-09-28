const { chromium } = require('playwright');
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1300,height:1000});
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html'); await page.waitForTimeout(800);

  // an old board full of pins must fold into the records themselves
  await page.evaluate(() => {
    S.settings.starterApplied='skip'; S.settings.starterDeclined=true;
    const T=today();
    S.projects=[{id:'pr1',name:'Zine',description:'a small press',tags:[],status:'active',priority:'P2',startDate:T,targetDate:'',
      phases:[],resources:[],linkedSkills:[],income:{model:'',current:0,target:0,milestones:[]},createdAt:T}];
    S.boards=[{id:'project:pr1',items:[
      {id:'b1',kind:'image',src:'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',caption:'cover',span:'m'},
      {id:'b2',kind:'word',src:'',caption:'quiet',span:'s'}]}];
    saveNow(); migrateBoards(); saveNow();
  });
  console.log('board fold-in:', await page.evaluate(() => ({
    projImages: (S.projects[0].images||[]).length,
    caption: S.projects[0].images?.[0]?.caption,
    wordsDropped: !(S.projects[0].images||[]).some(x=>!x.src),
    boardsEmptied: S.boards.length })));

  // (the project card's picture and the project panel's upload were checked here;
  //  the Projects page was taken out — the fold-in above still proves the data move)

  // no board UI survives anywhere
  const gone = await page.evaluate(async () => {
    const out={};
    for(const r of ['values','people','skills','vision','timeline','compass']){
      location.hash='#/'+r; await new Promise(x=>setTimeout(x,450));
      out[r] = document.querySelectorAll('.board-wrap, .pin, .board-strip').length;
    }
    return out;
  });
  console.log('board UI remaining:', JSON.stringify(gone));

  console.log('ERRORS:', errors.length); errors.slice(0,6).forEach(e=>console.log('  '+e));
  await browser.close();
})();
