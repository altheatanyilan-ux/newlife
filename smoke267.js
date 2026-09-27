/* smoke267 — the daily check-in, trimmed.

   The claims.

   TAKEN OUT BY REQUEST. The check-in on Today no longer asks for a mood
   ("Mood right now") or for energy in four dimensions. It keeps the
   intention, how today is going, and the set-point.

   NOTHING LOST. A day checked in before, with a mood and energy readings,
   keeps them: they stay on the record and the Days archive still reads them.

   STILL COUNTS. A check-in with only an intention is still "checked in"
   in the sidebar's status, and the section still folds once it is done.

   Run: NODE_PATH=node_modules node smoke267.js */
const {chromium} = require('playwright');
const path = require('path');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n, typeof g === 'string' ? g : JSON.stringify(g));

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const p = await b.newPage({viewport: {width: 1280, height: 900}});
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1500); }

  console.log('\n1. what the check-in asks now');
  await p.evaluate(async () => { const T = today(); S.checkins[T] = {intention: '', sentence: ''};
    const Y = addDays(T, -1); S.checkins[Y] = {intention: 'yesterday, the old way', mood: MOODS[0].v,
      energy: {physical: 4, emotional: 3, mental: 2, spiritual: 5}, setpoint: 15};
    await saveNow(); location.hash = '#/today'; rerender(); await new Promise(r => setTimeout(r, 1200)); });
  await p.click('[data-tview="in"]'); await p.waitForTimeout(600);
  const q = await p.evaluate(() => { const d = document.querySelector('#t-checkin'); d.open = true;
    const labels = [...d.querySelectorAll('.field > label')].map(l => l.textContent.replace(/\s+/g, ' ').trim());
    return {labels, mood: !!d.querySelector('[data-mood], .mood-btn'), energy: !!d.querySelector('.energy-row, .energy-dim, .dots i'),
      text: d.textContent.replace(/\s+/g, ' ')}; });
  yes('no "Mood right now"', !q.mood && !/Mood right now/.test(q.text), q.labels);
  yes('  and no "Energy — four dimensions"', !q.energy && !/four dimensions/.test(q.text), q.labels);
  yes('  the intention, the sentence and the set-point stay',
    /Today's intention/.test(q.labels[0]) && q.labels.some(l => /How is today going/.test(l)) && q.labels.some(l => /set-point/.test(l)), q.labels);

  console.log('\n2. and what was given before is kept');
  const kept = await p.evaluate(async () => { await load(); const c = S.checkins[addDays(today(), -1)];
    return {mood: c.mood === MOODS[0].v, energy: c.energy && c.energy.physical}; });
  yes('yesterday’s mood is still on the record', kept.mood);
  is('  and its energy', kept.energy, 4);

  console.log('\n3. an intention alone is a check-in');
  const st = await p.evaluate(async () => { S.checkins[today()].intention = 'finish the draft'; await saveNow();
    return houseStats().stat.today; });
  yes('the status says "checked in"', /^checked in/.test(st.line) && st.ok, st.line);

  console.log('\n4. nothing broke on the way');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
