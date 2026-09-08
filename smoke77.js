const { chromium } = require('playwright');
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1300,height:1000});
  const errors=[]; page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
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

  await page.evaluate(() => { location.hash='#/projects'; });
  await page.waitForTimeout(900);
  console.log('project card:', await page.evaluate(() => ({
    plated: document.querySelectorAll('.pcard.plated').length,
    backdrop: !!document.querySelector('.pcard .rec-plate-img'),
    bgSet: /data:image/.test(document.querySelector('.rec-plate-img')?.style.backgroundImage||''),
    contentAbove: getComputedStyle(document.querySelector('.pcard.plated .hd')).zIndex })));

  // uploading from a project panel
  await page.evaluate(() => document.querySelector('[data-popen]').click());
  await page.waitForTimeout(700);
  const up = await page.evaluate(async (PNG) => {
    const bin=atob(PNG); const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
    const dt=new DataTransfer(); dt.items.add(new File([arr],'b.png',{type:'image/png'}));
    const inp=document.querySelector('#panel [data-imgfile]');
    if(!inp) return {noInput:true};
    inp.files=dt.files; inp.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,900));
    return {images:(S.projects[0].images||[]).length, allStrings:(S.projects[0].images||[]).every(x=>typeof x.src==='string')};
  }, PNG);
  console.log('panel upload:', JSON.stringify(up));

  // no board UI survives anywhere
  const gone = await page.evaluate(async () => {
    const out={};
    for(const r of ['projects','values','people','skills','vision','timeline','compass']){
      location.hash='#/'+r; await new Promise(x=>setTimeout(x,450));
      out[r] = document.querySelectorAll('.board-wrap, .pin, .board-strip').length;
    }
    return out;
  });
  console.log('board UI remaining:', JSON.stringify(gone));

  console.log('ERRORS:', errors.length); errors.slice(0,6).forEach(e=>console.log('  '+e));
  await browser.close();
})();
