const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error' && !/ERR_CONNECTION_RESET/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    S.settings.starterApplied='skip'; saveNow();
    SoundManager.setSound(true);
    const kinds = ['click','nav','success','error','open','leaf','save','chime','page'];
    const bad = [];
    for(const k of kinds){ try { sound(k); } catch(e){ bad.push(k+': '+e.message); } }
    await new Promise(r2=>setTimeout(r2,400));
    // clicking a real button must not throw either
    document.querySelector('button')?.click();
    await new Promise(r2=>setTimeout(r2,200));
    return {threw: bad, soundOn: true};
  });
  console.log('sounds that threw:', r.threw.length ? r.threw.join('; ') : 'none');
  console.log('ERRORS:', errs.length); errs.forEach(e=>console.log(' ', e));
  await b.close();
})();
