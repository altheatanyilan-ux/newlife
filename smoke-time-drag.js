/* smoke-time-drag — Time tracking: drag across the day strip to write a sitting down.
   Run: NODE_PATH=node_modules node smoke-time-drag.js */
const {chromium}=require('playwright');
let bad=0;const R={};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1300,height:900}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'index.html')+'');await p.waitForTimeout(1500);
if(await p.$('#frGo')){await p.click('#frGo');await p.waitForTimeout(1500);}
await p.evaluate(()=>{document.querySelectorAll('.toast,.overlay').forEach(n=>n.remove());S.timeEntries=[];const y=new Date();y.setDate(y.getDate()-1);timeUi().day=timeDayOf(y.toISOString());location.hash='#/time/day'});await p.waitForTimeout(1000);
const r=await p.evaluate(()=>{document.querySelector('[data-tmdrag]').scrollIntoView({block:'center'});const b=document.querySelector('[data-tmdrag]').getBoundingClientRect();return {x:b.left,y:b.top+15,w:b.width,day:document.querySelector('[data-tmdrag]').dataset.tmdrag}});
const X=m=>r.x+r.w*m/1440;
await p.mouse.move(X(60),r.y);await p.mouse.down();await p.mouse.move(X(120),r.y,{steps:5});await p.mouse.move(X(185),r.y,{steps:5});
R.tip=(await p.evaluate(()=>document.querySelector('.tm-dragtip')?.textContent));

await p.mouse.up();await p.waitForTimeout(400);
R.form=await p.evaluate(()=>[teFrom.value,teTo.value,document.getElementById('teAfter')?.hidden]);
await p.fill('#teWhat','dragged work');await p.click('#teSave');await p.waitForTimeout(500);
R.entries=await p.evaluate(()=>S.timeEntries.map(e=>[e.what,timeClockOf(e.startTime),timeClockOf(e.endTime)]));
// click without drag (the page has redrawn, so find the strip again)
Object.assign(r,await p.evaluate(()=>{const s=document.querySelector('[data-tmdrag]');s.scrollIntoView({block:'center'});const b=s.getBoundingClientRect();return {x:b.left,y:b.top+15,w:b.width}}));
await p.mouse.move(X(900),r.y);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(300);
R.click=await p.evaluate(()=>!!document.querySelector('#teSave'));
// drag starting on a segment opens it, not a new one
await p.mouse.click(X(90),r.y);await p.waitForTimeout(300);
R.drawn=await p.evaluate(()=>document.querySelectorAll('.tm-strip [data-tmgo]').length);
R.seg=await p.evaluate(()=>[!!document.querySelector('#teDel'),teWhat.value]);

const exp=(n,g,w)=>{if(JSON.stringify(g)!==JSON.stringify(w)){bad++;console.log('  FAIL '+n+' got '+JSON.stringify(g)+' want '+JSON.stringify(w));}else console.log('  ok   '+n);};
exp('tip',R.tip,'01:00\u201303:05 \u00b7 2h 5m');exp('form prefilled',R.form,['01:00','03:05',true]);
exp('entry written',R.entries,[['dragged work','01:00','03:05']]);exp('drawn on the strip it was dragged on',R.drawn,1);exp('bare click writes nothing',R.click,false);
exp('press on a sitting opens it',R.seg,[true,'dragged work']);exp('no page errors',errs,[]);
await b.close();console.log(bad?'FAILURES':'all good');process.exit(bad?1:0);})();
