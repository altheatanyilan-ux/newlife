/* smoke-bubbles — a form asked one question at a time, as clouds */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const ctx = await b.newContext({viewport: {width: 1300, height: 1000}});
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__bbForce = true; });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  const q = (f, a) => p.evaluate(f, a);
  const fresh = async (type) => { await q(() => { document.querySelectorAll('.overlay').forEach(o => o.remove()); }); await q(t => { openEntryModal({type: t}); }, type); await p.waitForTimeout(1100); };
  console.log('floating clouds (the default): no dialog');
  await fresh('reflection');
  const a = await q(() => { const m = document.querySelector('.modal'); const ov = m.closest('.overlay');
    return {free: ov.classList.contains('bb-free'), gone: m.classList.contains('bb-gone'), cur: document.querySelector('.bb-cur label').textContent, units: m._bb.units.length, saveHidden: !!document.querySelector('#eSave').closest('.bb-end[hidden]'),
      cloudInStage: !!document.querySelector('.bb-stage-free .bb-cloud'), modalBox: m.getBoundingClientRect().width}; });
  yes('the form opens as a floating cloud over the page, with the dialog out of sight', a.free && a.gone && a.cloudInStage && a.modalBox <= 2 && /title/.test(a.cur), a);
  yes('and Save waits until the end', a.saveHidden, a);
  await p.keyboard.type('A quiet morning'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  const b2 = await q(() => ({cur: document.querySelector('.bb-cur label').textContent, chip: [...document.querySelectorAll('.bb-chip')].find(c => /A quiet morning/.test(c.textContent)), pos: (() => { const c = [...document.querySelectorAll('.bb-chip')].find(c => /A quiet morning/.test(c.textContent)); return c ? [c.style.left, c.style.top] : null; })(), entries: S.entries.length}));
  yes('Enter answers it: the next cloud forms and the answer drifts to the edge as a bubble; nothing is saved yet', /put down/.test(b2.cur) && b2.pos && b2.pos[0], b2);
  await p.keyboard.type('Slept well, and the light was good.'); await p.keyboard.press('Control+Enter'); await p.waitForTimeout(500);
  await p.click('[data-bb="end"]'); await p.waitForTimeout(600);
  const e = await q(() => ({end: !document.querySelector('.bb-end').hidden, saveShown: !!document.querySelector('#eSave').offsetParent, chips: document.querySelectorAll('.bb-chip').length}));
  yes('“that’s enough” goes to the end: Save appears, the skipped are faint bubbles', e.end && e.saveShown && e.chips >= 8, e);
  const n0 = await q(() => S.entries.length);
  await p.click('#eSave'); await p.waitForTimeout(900);
  const saved = await q(() => { const x = S.entries[S.entries.length - 1]; return {n: S.entries.length, title: x.title, body: x.body, stage: !!document.querySelector('.bb-stage')}; });
  yes('Save works exactly as before, and the clouds go', saved.n === n0 + 1 && saved.title === 'A quiet morning' && /Slept well/.test(saved.body) && !saved.stage, saved);
  await fresh('dream'); await p.click('[data-bb="end"]'); await p.waitForTimeout(500);
  await q(() => document.querySelector('.bb-chip').click()); await p.waitForTimeout(500);
  yes('touching a bubble goes back to that question', await q(() => !!document.querySelector('.bb-cur') && document.querySelector('.bb-end').hidden));
  await p.click('[data-bb="plain"]'); await p.waitForTimeout(400);
  const pl = await q(() => ({stage: !!document.querySelector('.bb-stage'), shown: !!document.querySelector('#eBody').offsetParent, save: !!document.querySelector('#eSave').offsetParent, free: !!document.querySelector('.overlay.bb-free')}));
  yes('“plain form” puts the dialog back as an ordinary form', !pl.stage && pl.shown && pl.save && !pl.free, pl);

  console.log('\nin the dialog, one at a time');
  await q(() => { S.settings.bubbleMode = 'steps'; });
  await fresh('reflection');
  const st = await q(() => { const m = document.querySelector('.modal'); return {free: !!document.querySelector('.overlay.bb-free'), on: m.classList.contains('bb-on'), inModal: !!m.querySelector('.bb-stage'), saveHidden: !!document.querySelector('#eSave').closest('.bb-hide')}; });
  yes('inside the dialog, the same asking', !st.free && st.on && st.inModal && st.saveHidden, st);

  console.log('\nplain');
  await q(() => { S.settings.bubbleMode = 'plain'; });
  await fresh('reflection');
  yes('plain: no staging at all', !(await p.$('.bb-stage')));
  await q(() => { document.querySelectorAll('.overlay').forEach(o => o.remove()); S.settings.bubbleMode = 'free'; location.hash = '#/settings'; }); await p.waitForTimeout(900);
  yes('Settings offers the three, with the current one marked', (await p.$$('[data-bbmode]')).length === 3 && await q(() => document.querySelector('[data-bbmode="free"]').classList.contains('on')));
  await p.click('[data-bbmode="steps"]');
  yes('and choosing one is kept', await q(() => S.settings.bubbleMode === 'steps'));
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
