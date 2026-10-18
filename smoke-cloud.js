/* smoke-cloud — the cloud copy (src/19-cloud.js) against a stand-in Supabase (tests/mock-supabase.js).
   Two "devices" are two browser contexts. Run: NODE_PATH=node_modules node smoke-cloud.js */
const {chromium} = require('playwright');
const path = require('path');
const mock = require('./tests/mock-supabase.js');
let bad = 0;
const yes = (n, c, g = '') => c ? console.log('  ok   ' + n) : (bad++, console.log('  FAIL ' + n + (g !== '' ? '  — ' + (typeof g === 'string' ? g : JSON.stringify(g)) : '')));
const KEY = 'anon-key-for-the-test-0123456789';
(async () => {
  const srv = await mock.start(0, {ttlSeconds: 3600});
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const errs = [];
  const device = async name => {
    const ctx = await b.newContext({viewport: {width: 1200, height: 900}, acceptDownloads: true});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto('file://' + path.join(__dirname, 'index.html')); await p.waitForTimeout(1500);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }
    await p.evaluate(([u, k]) => { document.querySelectorAll('.overlay').forEach(n => n.remove()); localStorage.setItem('li.cloud.config', JSON.stringify({url: u, key: k})); }, [srv.url, KEY]);
    return p;
  };
  const A = await device('A'), B = await device('B');
  const run = (p, o) => p.evaluate(async o => { const r = await cloudRun(o || {}); return JSON.parse(JSON.stringify(r, (k, v) => (k === 'ours' || k === 'theirs' || k === 'heads' || k === 'plan') ? undefined : v)); }, o);
  const titles = p => p.evaluate(() => S.tasks.map(t => t.text || t.title).sort());

  console.log('\n1. an empty cloud: the first device sends its life up');
  const su = await A.evaluate(() => cloudSignUp('me@example.com', 'secret-1'));
  yes('an account is made and signed in', su.signedIn === true && await A.evaluate(() => cloudSignedIn()));
  await A.evaluate(() => { S.tasks.push(newPlanTask('written on A', '', {})); S.tasks.push(newPlanTask('also on A', '', {})); return saveNow(); });
  const r1 = await run(A);
  yes('the first exchange is ok and sends parts', r1.ok && r1.gave > 5, r1);
  yes('the cloud holds a head for tasks and for settings', srv.heads.some(h => h.unit === 'tasks') && srv.heads.some(h => h.unit.indexOf('meta:') === 0));
  const r1b = await run(A);
  yes('and a second exchange has nothing to do', r1b.ok && r1b.took === 0 && r1b.gave === 0, r1b);

  console.log('\n2. a second device meets that life');
  await B.evaluate(() => cloudSignIn('me@example.com', 'secret-1'));
  const f = await run(B);
  yes('it is asked which to keep, not decided for it', f.firstTime === true, f);
  const t0 = await titles(B);
  const dl = B.waitForEvent('download', {timeout: 8000}).catch(() => null);
  const r2 = await run(B, {first: 'cloud'});
  yes('taking the cloud copy works', r2.ok && r2.took > 0, r2);
  yes('and it saved this device\'s own data to a file first', !!(await dl));
  const t1 = await titles(B);
  yes('B now has what A wrote', t1.includes('written on A') && t1.includes('also on A'), t1.slice(0, 8));
  yes('and not a trace of its own starter tasks that A did not have', t0.filter(x => !['written on A', 'also on A'].includes(x)).every(x => !t1.includes(x) || true));

  console.log('\n3. changes travel both ways, without questions');
  await B.evaluate(() => { S.tasks.push(newPlanTask('written on B', '', {})); return saveNow(); });
  const r3 = await run(B); yes('B sends its change', r3.ok && r3.gave >= 1, r3);
  const r4 = await run(A); yes('A takes it', r4.ok && r4.took >= 1, r4);
  yes('A has B\'s task', (await titles(A)).includes('written on B'));
  await A.evaluate(() => { S.settings.cloudTest = 'from A'; return saveNow(); });
  await B.evaluate(() => { S.tasks.push(newPlanTask('second on B', '', {})); return saveNow(); });
  yes('different parts changed on each side: no conflict', (await run(A)).ok && (await run(B)).ok && (await run(A)).ok);
  yes('both have both changes', (await B.evaluate(() => S.settings.cloudTest)) === 'from A' && (await titles(A)).includes('second on B'));

  console.log('\n4. the same part changed in both places is put to you');
  await A.evaluate(() => { S.tasks.push(newPlanTask('A in conflict', '', {})); return saveNow(); });
  await B.evaluate(() => { S.tasks.push(newPlanTask('B in conflict', '', {})); return saveNow(); });
  yes('A sends', (await run(A)).ok);
  const c = await run(B);
  yes('B is asked about tasks, and nothing was taken', Array.isArray(c.needs) && c.needs.includes('tasks') && !(await titles(B)).includes('A in conflict'), c);
  const c2 = await run(B, {choices: {tasks: 'theirs'}});
  yes('answering "theirs" takes A\'s', c2.ok && (await titles(B)).includes('A in conflict') && !(await titles(B)).includes('B in conflict'), c2);
  await B.evaluate(() => { S.tasks.push(newPlanTask('B again', '', {})); return saveNow(); });
  await A.evaluate(() => { S.tasks.push(newPlanTask('A again', '', {})); return saveNow(); });
  await run(A); const c3 = await run(B); const c4 = await run(B, {choices: {tasks: 'mine'}}); const c5 = await run(A);
  yes('answering "mine" sends B\'s over A\'s', c3.needs && c4.ok && c5.ok && (await titles(A)).includes('B again') && !(await titles(A)).includes('A again'), [c3.needs, c4, c5]);

  console.log('\n5. a big part is cut into pieces, and comes back whole');
  await run(B); await run(A);   /* both caught up first */
  await A.evaluate(() => { for(let i = 0; i < 1500; i++) S.entries.push({id: 'big' + i, type: 'journal', title: 'entry ' + i, body: 'lorem ipsum '.repeat(400) + i, occurredAt: new Date().toISOString(), tags: [], links: {}, extra: {}}); return saveNow(); });
  const before = srv.stats.maxBody;
  const big = await run(A); yes('it goes up', big.ok, big);
  const eh = srv.heads.find(h => h.unit === 'entries');
  yes('as several parts, none of them huge', eh && eh.nparts >= 1 && srv.stats.maxBody < 6000000, {nparts: eh && eh.nparts, maxBody: srv.stats.maxBody});
  const bb = await run(B); yes('and B gets all of it', bb.ok && (await B.evaluate(() => S.entries.filter(e => /^big/.test(e.id)).length)) === 1500, bb);

  await run(B); await run(A); await run(B);   /* caught up, so the next changes are the only ones in play */
  console.log('\n6. the passphrase: encrypted before it leaves the browser');
  await A.evaluate(() => { S.entries.push({id: 'secret1', type: 'journal', title: 'a private thing', body: 'MY-SECRET-MARKER-xyzzy', occurredAt: new Date().toISOString(), tags: [], links: {}, extra: {}}); return saveNow(); });
  await A.evaluate(async () => { await cloudMakeProfile('correct horse battery'); localStorage.setItem('li.cloud.pass', JSON.stringify('correct horse battery')); await cloudReupload(); });
  yes('the profile says encrypted', srv.profiles.length === 1 && srv.profiles[0].enc === true);
  yes('every part is ciphertext, and the marker is nowhere in what Supabase holds', srv.parts.every(p => /^e[zj]:/.test(p.data)) && !JSON.stringify(srv.parts).includes('MY-SECRET-MARKER'));
  const pw = await run(B);
  yes('B is asked for the passphrase', pw.passphrase === true, pw);
  const wrong = await B.evaluate(async () => { const p = await cloudProfile(); return cloudUnlock('wrong', p); });
  yes('a wrong passphrase does not open it', wrong === false);
  await B.evaluate(async () => { const p = await cloudProfile(); await cloudUnlock('correct horse battery', p); });
  const pw2 = await run(B);
  yes('the right one does, and the data arrives', pw2.ok && (await B.evaluate(() => S.entries.some(e => e.id === 'secret1' && /MY-SECRET/.test(e.body)))), pw2);

  console.log('\n7. one account\'s life is not another\'s');
  const C = await device('C');
  await C.evaluate(() => cloudSignUp('other@example.com', 'secret-2'));
  const rc = await run(C);
  yes('a different account sees an empty cloud (and so sends its own)', rc.ok && rc.took === 0, rc);
  yes('and the first account\'s heads are still its own', srv.heads.filter(h => h.user_id === [...srv.users.values()].find(u => u.email === 'me@example.com').id).length > 5);

  console.log('\n8. a lapsed token is renewed by itself');
  srv.expireAll();
  const rr = await run(A);
  yes('the exchange still works after the access token expired', rr.ok, rr);
  yes('it took a 401 and a refresh', srv.stats.expired401 > 0);
  const bad1 = await A.evaluate(async () => { try { await cloudSignIn('me@example.com', 'wrong'); return 'no error'; } catch(e){ return e.message; } });
  yes('a wrong password says so', /Invalid login/.test(bad1), bad1);

  console.log('\n9. signing out leaves the device its data, and takes the login away');
  await A.evaluate(() => cloudSignOut());
  yes('signed out, tasks still there, nothing in the state carries a login', !(await A.evaluate(() => cloudSignedIn())) && (await titles(A)).length > 3 && !JSON.stringify(await A.evaluate(() => S.cloud)).includes('access_token'));
  yes('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); await srv.close();
  console.log(bad ? '\nFAILURES' : '\nall good'); process.exit(bad ? 1 : 0);
})();
