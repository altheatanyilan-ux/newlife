/* smoke221 — Curriculum v3, Section 4: the features, used.

   4A's three lead-sheet flashcard modes (symbols scored on notes, time and
   a streak; four bars comped in time and graded; a lead sheet's sections
   found), 4C's play-along band (it sounds, offline, in all three styles),
   4B's recorder (a fake microphone records and plays back), 4D's audiation
   drill, 4G's "The Space" before a session and practice time told apart
   from play time, and Section 5's repertoire ladder counted in the
   Listening Library.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n) => console.log(`  ok   ${n}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1300,height:1000},permissions:['microphone']});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('pageerror: '+e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT|ERR_CONNECTION_RESET|Failed to load/.test(m.text()))errs.push(m.text().slice(0,300));});
await p.goto(FILE); await p.waitForTimeout(1200);
if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
const go=async h=>{ await p.evaluate(x=>{location.hash=x;},h); await p.waitForTimeout(900); };
const out={};
/* Mode A: on-screen keys */
await go('#/jazz/cards/A');
await p.evaluate(()=>{ jazzLeadState().settings.cards=10; jazzLeadState().settings.self=false; });
await p.click('[data-jzlgo]'); await p.waitForTimeout(300);
for(let i=0;i<10;i++){
  const sym=await p.evaluate(()=>jazzLeadUi().A.cards[jazzLeadUi().A.at]);
  const vo=await p.evaluate(s=>jazzCompVoicing(jazzChordSpec(s),60).map(m=>{ while(m>77) m-=12; while(m<48) m+=12; return m; }).concat(jazzChordSpec(s).bassPc!=null?[48+jazzChordSpec(s).bassPc]:[]),sym);
  if(i<7){ for(const m of vo) await p.click(`#jzlKb [data-kbm="${m}"]`); await p.click('[data-jzlsubmit]'); }
  else if(i===7){ /* MIDI-like: press and release through the sink */
    await p.evaluate(v=>{ const t=performance.now(); v.forEach(m=>_jzlSink(m,true,t)); v.forEach(m=>_jzlSink(m,false,t+50)); }, vo); }
  else { await p.click(`#jzlKb [data-kbm="${vo[0]}"]`); await p.click('[data-jzlsubmit]'); }
  await p.waitForTimeout(150);
  const v=await p.evaluate(()=>{const e=document.querySelector('.jzl-verdict'); const q=document.querySelector('.jzl-pts'); return (e?e.textContent:'?')+' | '+(q?q.textContent:'');});
  (out.A=out.A||[]).push(sym+' → '+v.replace(/\s+/g,' '));
  await p.click('[data-jzlnext]'); await p.waitForTimeout(120);
}
out.Adone=await p.evaluate(()=>document.querySelector('.jzl-card').innerText.replace(/\n/g,' / '));
/* Mode A timeout */
await p.evaluate(()=>{ jazzLeadState().settings.seconds=4; jazzLeadState().settings.cards=10; });
await p.click('[data-jzlsetup]'); await p.waitForTimeout(200); await p.click('[data-jzlgo]'); await p.waitForTimeout(4600);
out.Atimeout=await p.evaluate(()=>document.querySelector('.jzl-verdict')&&document.querySelector('.jzl-verdict').textContent);
await p.click('[data-jzlquit]'); await p.waitForTimeout(200);
/* Mode B: notes in time */
await p.evaluate(()=>{ const st=jazzLeadState().settings; st.bpm=200; st.bars=4; st.band=true; });
await go('#/jazz/cards/B');
await p.click('[data-jzlrun]');
const plan=await p.evaluate(()=>{ const B=jazzLeadUi().B; const bars=jzlExcerptBars(B.ex); const t=jazzTune(B.ex.id); const per=/3\/4/.test(t.timeSignature||'')?3:4;
  const beats=jazzChartBeats({bars},per,0,null); const spb=60/200; const lead=(0.2+per*spb)*1000; const t0=performance.now();
  const wins=[]; beats.forEach((b,k)=>{ const l=wins[wins.length-1]; if(!l||b.first||b.sym!==l.sym) wins.push({sym:b.sym,k}); });
  wins.forEach(w=>{ const v=jazzCompVoicing(jazzChordSpec(w.sym),60); const at=lead+w.k*spb*1000;
    setTimeout(()=>{ const ts=performance.now(); v.forEach(m=>_jzlSink(m,true,ts)); setTimeout(()=>v.forEach(m=>_jzlSink(m,false,performance.now())),200); }, at); });
  return {n:wins.length, dur: lead+beats.length*spb*1000, per};});
await p.waitForTimeout(plan.dur+1200);
out.B=await p.evaluate(()=>{ const r=jazzLeadUi().B.result; return r?{harm:r.harm,rhythm:r.rhythm,vl:r.vl,dev:r.meanDevMs,lean:r.leanMs,att:r.attacks,rows:r.rows.map(x=>x.sym+(x.ok?'✓':'✗'+x.missing.join('')+x.against.join(''))).join(' ')}:null;});
/* Mode B: no notes → self rating */
await p.click('[data-jzlrun]'); await p.waitForTimeout(plan.dur+1200);
out.Bself=await p.evaluate(()=>!!document.querySelector('[data-jzlsaveself]'));
for(const k of ['harm','rhythm','vl']) await p.click(`[data-jzlrate="${k}"][data-v="0.6"]`);
await p.click('[data-jzlsaveself]'); await p.waitForTimeout(200);
out.Blog=await p.evaluate(()=>jazzLeadState().log.filter(x=>x.mode==='B').map(x=>x.self+':'+x.harm));
/* Mode C: the right answer */
await go('#/jazz/cards/C');
const truth=await p.evaluate(()=>{ const t=jazzTune(jazzLeadUi().C.id); return {id:t.id, starts:jazzLeadFormSheet(t).starts}; });
for(const s of truth.starts){ const clicks='ABCD'.indexOf(s.letter)+1; for(let c=0;c<clicks;c++){ await p.click(`.jzl-form .jt-bar[data-bar="${s.bar}"]`); await p.waitForTimeout(60);} }
await p.click('[data-jzlcheck]'); await p.waitForTimeout(200);
out.C=truth.id+' '+await p.evaluate(()=>document.querySelector('.jzl-grade').innerText.replace(/\n/g,' / '));
/* audiation */
await go('#/jazz/audiation');
for(const a of ['hear','reveal','yes','next','show']){ const el=await p.$(`[data-jza="${a}"]`); if(el){ await el.click(); await p.waitForTimeout(250);} }
out.aud=await p.evaluate(()=>({log:jazzAudState().log.length, sym:jazzAudUi().sym}));
/* play-along */
await go('#/jazz/playalong/autumn-leaves');
await p.click('#jpGo'); await p.waitForTimeout(2500);
out.play=await p.evaluate(()=>({running:!!(_jzBand&&_jzBand.running), now:(document.querySelector('.jt-bar.now')||{}).dataset}));
await p.click('#jpGo'); await p.waitForTimeout(200);
out.peak=await p.evaluate(async()=>{ const a=await jazzBandRenderPeak(jazzParseChart(jazzTune('autumn-leaves').chordProgression),{bpm:160},3);
  const b=await jazzBandRenderPeak(jazzParseChart('Dm7|G7|CM7|CM7'),{bpm:120,style:'bossa'},2); const c=await jazzBandRenderPeak(jazzParseChart('Dm7|G7|CM7|CM7'),{bpm:120,style:'waltz'},2); return [a,b,c];});
/* recording */
await go('#/jazz/record');
const self=await p.$('[data-jzrec="self"] [data-a="rec"]'); await self.click(); await p.waitForTimeout(1600);
await p.click('[data-jzrec="self"] [data-a="rec"]'); await p.waitForTimeout(1500);
out.rec=await p.evaluate(()=>({n:jazzRecordings().length, items:document.querySelectorAll('[data-jzrec="self"] .jzr-item').length, audio:!!document.querySelector('[data-jzrec="self"] audio')}));
/* The Space, then a session, ended as play time */
await go('#/jazz/plan');
const bud=await p.$('[data-jzstart][data-jzpace="standard"]') || await p.$('[data-jzstart]'); if(bud){ await bud.click(); await p.waitForTimeout(500); }
const st=await p.$('#jzPlanStart'); if(st){ await st.click(); await p.waitForTimeout(300); }
out.space=await p.evaluate(()=>!!document.querySelector('#jsGo'));
await p.click('#jsSkip'); await p.waitForTimeout(600);
out.sessHash=await p.evaluate(()=>location.hash+' open='+!!jazzSessionOpen());
await p.evaluate(()=>openJazzSessionEnd()); await p.waitForTimeout(200);
await p.click('[data-jemode="play"]'); await p.fill('#jeMins','25'); await p.click('#jeSave'); await p.waitForTimeout(600);
out.mode=await p.evaluate(()=>({mode:jazzSessions()[0].mode, pp:jazzPracticePlay(30)}));
out.progress=await p.evaluate(()=>!!document.querySelector('.jzt-pp'));
/* listening ladder +1 */
await go('#/jazz/listen');
const lb=await p.$('[data-jlladder]'); if(lb){ await lb.click(); await p.waitForTimeout(300); }
out.ladder=await p.evaluate(()=>{ const a=jazzV3LadderListening('P0')[0]; return a?jazzListens(a):null; });

console.log('\n4A');
yes('Mode A: right voicings score, with the streak multiplying', out.A.slice(0,8).every(x=>/✓/.test(x)) && /× 2\.00/.test(out.A[7]), out.A);
yes('  a MIDI-style press and release is graded when the hands lift', /✓/.test(out.A[7]), out.A[7]);
yes('  wrong notes name what is missing', /Missing/.test(out.A[8]), out.A[8]);
yes('  the round ends with a total and a best', /8 of 10 right/.test(out.Adone) && /new best/.test(out.Adone), out.Adone);
yes('  the clock runs out', /Time ran out/.test(out.Atimeout||''), out.Atimeout);
yes('Mode B: comping in time grades chords, time and voice leading', out.B && out.B.harm===1 && out.B.rhythm>0.9 && out.B.vl>0.8, out.B);
yes('  with no notes it asks, and keeps the answer', out.Bself && out.Blog[0]==='true:0.6', out.Blog);
yes('Mode C: the right section starts are found', /(\d+) of \1 section starts found/.test(out.C), out.C);
console.log('\n4B–4G, Section 5');
yes('audiation logs a heard chord', out.aud.log===1, out.aud);
yes('the play-along runs and follows the bars', out.play.running && out.play.now && out.play.now.bar, out.play);
yes('  and the band makes a sound in swing, bossa and waltz', out.peak.every(v=>v>0.05), out.peak);
yes('a recording is kept and played back', out.rec.n===1 && out.rec.items===1 && out.rec.audio, out.rec);
yes('The Space comes before a session', out.space);
yes('  and the session starts after it, on the plan\'s first exercise', /^#\/jazz\/.+ open=true/.test(out.sessHash), out.sessHash);
yes('play time is told apart from practice time', out.mode.mode==='play' && out.mode.pp.play===25 && out.progress, out.mode);
yes('the repertoire ladder counts a listen', out.ladder===1, out.ladder);
yes('no page errors', !errs.length, errs.join(' | '));
await b.close(); console.log(bad ? `\n${bad} FAILED` : '\nall good'); process.exit(bad?1:0);})();
