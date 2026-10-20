/* smoke-bubbles-contain — nothing a cloud asks, or says, sticks out of the cloud */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const yes = (n, c, g='') => { if(c) console.log('  ok   ' + n); else { bad++; console.log('  FAIL ' + n + '  — ' + JSON.stringify(g)); } };
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  for(const [vw, vh] of [[1300, 900], [420, 760]]){
    const p = await (await b.newContext({viewport: {width: vw, height: vh}})).newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.__bbForce = true; });
    await p.goto(FILE); await p.waitForTimeout(1200);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
    for(const mode of ['free', 'steps']){
      await p.evaluate(m => { S.settings.bubbleMode = m; }, mode);
      for(const opener of ['openEntryModal', 'openDecisionModal', 'openHabitModal', 'openPersonModal', 'openTimeEntryModal', 'openPlanListModal']){
        await p.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));
        await p.evaluate(o => { window[o](); }, opener); await p.waitForTimeout(500);
        const n = await p.evaluate(() => { const m = document.querySelector('.modal'); return m && m._bb ? m._bb.units.length : 0; });
        if(!n){ continue; }
        const out = [];
        for(let i = 0; i < n; i++){
          await p.evaluate(i => document.querySelector('.modal')._bb.go(i), i); await p.waitForTimeout(260);
          const r = await p.evaluate(() => {
            const st = document.querySelector('.modal')._bb, cloud = st.cloud.getBoundingClientRect(), slot = st.slot.getBoundingClientRect(), bad = [];
            st.slot.querySelectorAll('*').forEach(el => { if(el.closest('[hidden]')) return; const r = el.getBoundingClientRect(); if(!r.width || !r.height) return;
              const cs = getComputedStyle(el); if(cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'absolute' && el.classList.contains('bb-away')) return;
              /* what the slot clips (it scrolls up and down) is not showing */
              const x0 = Math.max(r.left, slot.left), x1 = Math.min(r.right, slot.right);
              if(r.left < cloud.left - 1 || r.right > cloud.right + 1 || x1 - x0 < r.width - 1 && r.right > slot.right + 1) bad.push((el.className || el.tagName).toString().slice(0, 40) + ' ' + Math.round(r.left) + '-' + Math.round(r.right) + ' vs ' + Math.round(cloud.left) + '-' + Math.round(cloud.right)); });
            const ctl = st.cloud.querySelector('.bb-ctl').getBoundingClientRect();
            if(ctl.left < cloud.left - 1 || ctl.right > cloud.right + 1 || ctl.bottom > cloud.bottom + 1) bad.push('controls');
            return bad; });
          if(r.length) out.push(i + ': ' + r.slice(0, 2).join(' | '));
        }
        yes(`${vw}px ${mode}: ${opener} — all ${n} questions sit inside their cloud`, !out.length, out.slice(0, 3));
        /* the end card too */
        await p.evaluate(() => document.querySelector('.modal')._bb.go(1e3)); await p.waitForTimeout(300);
        const e = await p.evaluate(() => { const st = document.querySelector('.modal')._bb, end = st.end.getBoundingClientRect(), bad = [];
          st.end.querySelectorAll('*').forEach(el => { const r = el.getBoundingClientRect(); if(!r.width) return; if(r.left < end.left - 1 || r.right > end.right + 1) bad.push((el.className || el.tagName).toString().slice(0, 30)); }); return bad; });
        yes(`${vw}px ${mode}: ${opener} — the end card holds its words`, !e.length, e);
      }
    }
    await p.context().close();
  }
  yes('no page errors', !errs.length, errs);
  await b.close(); process.exit(bad ? 1 : 0);
})();
