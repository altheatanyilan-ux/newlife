/* smoke-cloud-ui — Settings → the cloud copy: set it up, sign in, and let it keep itself in step.
   Run: NODE_PATH=node_modules node smoke-cloud-ui.js */
const {chromium} = require('playwright');
const path = require('path');
const mock = require('./tests/mock-supabase.js');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + (g !== '' ? '  — ' + (typeof g === 'string' ? g : JSON.stringify(g)) : '')));
(async () => {
  const srv = await mock.start(0);
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const mk = async () => { const p = await (await b.newContext({viewport: {width: 1200, height: 1000}})).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
    await p.evaluate(() => { document.querySelectorAll('.overlay,.toast').forEach(n => n.remove()); localStorage.setItem('li.cloud.delay', '800'); }); return p; };
  const open = async p => { await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForTimeout(900); await p.evaluate(() => document.getElementById('cloudSec').scrollIntoView({block: 'center'})); };
  const P = await mk(); await open(P);
  yes('with no project it asks for the URL and the anon key', await P.evaluate(() => !!document.querySelector('#clUrl') && !!document.querySelector('#clKey')));
  await P.fill('#clUrl', srv.url); await P.fill('#clKey', 'anon-key-for-the-test-0123456789'); await P.click('#clSaveCfg'); await P.waitForTimeout(400);
  yes('then it shows the sign-in', await P.evaluate(() => !!document.querySelector('#clEmail') && !!document.querySelector('#clIn')));
  await P.fill('#clEmail', 'ui@example.com'); await P.fill('#clPw', 'secret-ui');
  await P.click('#clUp'); await P.waitForTimeout(2500);
  yes('creating the account signs in and exchanges', await P.evaluate(() => cloudSignedIn() && !!document.querySelector('#clNow')) && srv.heads.length > 5, srv.heads.length);
  yes('the room says so, and offers encryption', await P.evaluate(() => /signed in/.test(document.getElementById('cloudSec').textContent)) && await P.waitForSelector('#clEncOn', {timeout: 4000}).then(() => true).catch(() => false));
  /* it keeps itself in step */
  const before = {gen: srv.heads.find(h => h.unit === 'tasks').gen};
  await P.evaluate(() => { S.tasks.push(newPlanTask('typed on the phone', '', {})); saveNow(); });
  await P.waitForTimeout(3500);
  const after = srv.heads.find(h => h.unit === 'tasks');
  yes('a change goes up by itself a moment later', before && after && after.gen !== before.gen, [before && before.gen, after && after.gen]);
  /* a second device signs in through the form and is asked, not overwritten */
  const Q = await mk(); await open(Q);
  await Q.fill('#clUrl', srv.url); await Q.fill('#clKey', 'anon-key-for-the-test-0123456789'); await Q.click('#clSaveCfg'); await Q.waitForTimeout(300);
  await Q.fill('#clEmail', 'ui@example.com'); await Q.fill('#clPw', 'secret-ui'); await Q.click('#clIn'); await Q.waitForTimeout(2500);
  yes('a new device is asked which copy to keep', await Q.evaluate(() => /meets a life in the cloud/.test(document.body.textContent)));
  await Q.click('#clTake'); await Q.waitForTimeout(3500);
  yes('taking the cloud copy brings the task over', await Q.evaluate(() => S.tasks.some(t => (t.text || t.title) === 'typed on the phone')));
  yes('sign out works from the room', await (async () => { await open(Q); await Q.click('#clOut'); await Q.waitForTimeout(400); return Q.evaluate(() => !cloudSignedIn() && !!document.querySelector('#clIn')); })());
  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); await srv.close(); console.log(bad ? '\nFAILURES' : '\nall good'); process.exit(bad ? 1 : 0);
})();
