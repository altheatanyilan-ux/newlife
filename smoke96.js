/* smoke96 — the house installs, survives losing the network, and is unchanged on disk */
const {chromium} = require('playwright');
const path = require('path');
const BASE = 'http://localhost:8099/newlife/';
const FILE = 'file://' + path.resolve('/home/user/newlife/index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* The page stacks several toasts at boot — welcome, the starter set, and ours.
   Addressing one by position picks whichever arrived first; address it by what
   it says. And poll rather than sleep: a cold first load has to create the
   database before any of this runs. */
const toastsOn = pg => pg.evaluate(() => [...document.querySelectorAll('.toast')].map(n => n.textContent));
async function waitForToast(pg, re, ms = 12000){
  const until = Date.now() + ms;
  while(Date.now() < until){
    const all = await toastsOn(pg);
    const hit = all.find(t => re.test(t));
    if(hit) return hit;
    await pg.waitForTimeout(250);
  }
  return null;
}
const clickToast = (pg, re) => pg.evaluate(src => {
  const t = [...document.querySelectorAll('.toast')].find(n => new RegExp(src, 'i').test(n.textContent));
  const b = t && t.querySelector('.toast-act');
  if(b){ b.click(); return true; } return false;
}, re.source);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

  console.log('\n1. the manifest is one a browser will actually install');
  const plain = await b.newPage();
  const mf = await (await plain.goto(BASE + 'manifest.webmanifest')).json();
  is('it has a name', mf.name, 'Life Instrument');
  is('it opens standalone, with no browser chrome', mf.display, 'standalone');
  yes('start_url and scope are relative, so a project subpath works',
      mf.start_url === '.' && mf.scope === '.', `${mf.start_url} / ${mf.scope}`);
  yes('it offers 192 and 512 icons, and a maskable one for Android',
      mf.icons.some(i => i.sizes==='192x192') && mf.icons.some(i => i.sizes==='512x512')
      && mf.icons.some(i => (i.purpose||'').includes('maskable')));
  for(const i of mf.icons){
    const r = await plain.goto(BASE + i.src);
    yes(`  ${i.src} is really there`, r.status() === 200, String(r.status()));
  }
  await plain.close();

  console.log('\n2. served over http, the worker takes hold');
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  /* Fail the font host immediately rather than letting it hang. That is the
     ordinary case on a real network — and it is the one that catches a
     registration hung off the load event: with nothing slow left in the page,
     load fires long before the database has finished opening, so code that
     waits for it afterwards waits for an event that has already gone. */
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(BASE);
  await p.waitForTimeout(2500);
  const reg = await p.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return r ? {scope: r.scope, active: !!r.active} : null;
  });
  yes('a service worker is registered', !!reg && reg.active, JSON.stringify(reg));
  yes('and its scope is the app folder, not the whole domain',
      !!reg && reg.scope.endsWith('/newlife/'), reg && reg.scope);
  const cached = await p.evaluate(async () => {
    const names = await caches.keys();
    const c = await caches.open(names.find(n => n.startsWith('shell-')));
    return {names, urls: (await c.keys()).map(r => new URL(r.url).pathname)};
  });
  yes('the shell cache is stamped with a build, not a fixed name',
      cached.names.some(n => /^shell-[0-9a-f]{12}$/.test(n)), cached.names.join(','));
  yes('the document itself is in it', cached.urls.some(u => u.endsWith('/index.html')), cached.urls.join(' '));
  yes('so are the icons', cached.urls.filter(u => u.includes('/icons/')).length === 3,
      String(cached.urls.filter(u => u.includes('/icons/')).length));

  console.log('\n3. with the network gone, the house still opens');
  await ctx.setOffline(true);
  const p2 = await ctx.newPage();
  const off = [];
  p2.on('pageerror', e => off.push(e.message));
  const resp = await p2.goto(BASE);
  yes('the page loads offline', !!resp && resp.status() < 400, resp ? String(resp.status()) : 'no response');
  await p2.waitForTimeout(2500);
  is('and it is the real app, not a fallback page',
     await p2.title(), 'Life Instrument');
  yes('the sidebar rendered', !!(await p2.$('.sidebar')));
  await p2.evaluate(() => { location.hash = '#/planning'; });
  await p2.waitForTimeout(900);
  yes('a room other than the first one renders too', !!(await p2.$('#main')) &&
      (await p2.evaluate(() => document.querySelector('#main').textContent.trim().length)) > 50);
  const wrote = await p2.evaluate(async () => {
    const t = {id: uid(), text: 'written on a train', done: false, day: today(),
      createdAt: new Date().toISOString(), tags: [], subtasks: []};
    planTaskDefaults(t); S.tasks.push(t); await saveNow();
    return !!byId(S.tasks, t.id);
  });
  yes('and writing to the database works with no signal', wrote);
  is('nothing threw while offline', off.join(' | '), '');
  await ctx.setOffline(false);
  await p2.close();

  console.log('\n4. a new build reaches a phone that already has the app');
  const fs = require('fs');
  const swPath = '/home/user/newlife/sw.js';
  const before = fs.readFileSync(swPath, 'utf8');
  const stamp = (before.match(/^const BUILD = '([^']*)';/m) || [])[1];
  yes('build.js stamped a hash into the worker', /^[0-9a-f]{12}$/.test(stamp || ''), String(stamp));
  const idx = fs.readFileSync('/home/user/newlife/index.html', 'utf8');
  const rehash = require('crypto').createHash('sha256').update(idx).digest('hex').slice(0,12);
  is('and the hash is of the build it ships with', stamp, rehash);

  console.log('\n4b. and it reaches it for real, end to end');
  const swFile = '/home/user/newlife/sw.js', idxFile = '/home/user/newlife/index.html';
  const swBak = fs.readFileSync(swFile, 'utf8'), idxBak = fs.readFileSync(idxFile, 'utf8');
  try {
    /* ship a new build the way build.js would: change the document, then stamp
       its hash into the worker — that stamp is the whole update mechanism */
    const nextIdx = idxBak.replace('<title>Life Instrument</title>', '<title>Life Instrument</title><!--BUILD-TWO-->');
    if(nextIdx === idxBak) throw new Error('could not mark a second build');
    const nextHash = require('crypto').createHash('sha256').update(nextIdx).digest('hex').slice(0,12);
    fs.writeFileSync(idxFile, nextIdx);
    fs.writeFileSync(swFile, swBak.replace(/^const BUILD = '[^']*';/m, `const BUILD = '${nextHash}';`));

    /* the page notices a new worker the same way a phone left open would */
    await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    const offer = await waitForToast(p, /newer version of the house/i);
    yes('the open page is told a newer version is ready', !!offer, '(no such toast)');
    yes('and it is an offer, not a swap done behind your back — the old build is still running',
        !(await p.content()).includes('BUILD-TWO'));

    const clicked = await clickToast(p, /newer version of the house/i);
    if(!clicked) no('taking the offer loads the new build', 'no reload button on that toast');
    else {
      await p.waitForNavigation({timeout: 20000}).catch(() => {});
      await p.waitForTimeout(2500);
      yes('taking the offer loads the new build', (await p.content()).includes('BUILD-TWO'));
      const shells = await p.evaluate(async () => (await caches.keys()).filter(n => n.startsWith('shell-')));
      is('and the previous build\'s cache is swept up, not left to pile', shells.length, 1);
      is('the surviving one is the new build', shells[0], 'shell-' + nextHash);
    }
  } finally {
    fs.writeFileSync(idxFile, idxBak);
    fs.writeFileSync(swFile, swBak);
  }
  await ctx.close();

  console.log('\n5. the handoff notice, for data that cannot follow the app');
  const fresh = await b.newContext();
  const p4 = await fresh.newPage();
  await p4.goto(BASE);
  const notice = await waitForToast(p4, /nothing came across/i);
  yes('a fresh hosted copy warns that nothing came across from the local file', !!notice, '(no such toast)');
  yes('and points at where the import button is', !!notice && /Settings/i.test(notice), notice || '');
  /* it is a one-time notice: a second visit must not nag. Give the reload the
     same generous window the first one got, then confirm it stayed quiet. */
  await p4.reload();
  await waitForToast(p4, /starter set|Welcome home/i);      // boot has finished talking
  await p4.waitForTimeout(1500);
  const again = (await toastsOn(p4)).join(' | ');
  yes('and it says it once, not on every open', !/nothing came across/i.test(again), again);
  await fresh.close();

  console.log('\n6. opened from disk, none of this happens');
  const p3 = await b.newPage();
  const fileErrs = [];
  p3.on('pageerror', e => fileErrs.push('pageerror: ' + e.message));
  p3.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|Failed to load resource/.test(m.text())) fileErrs.push('console: ' + m.text()); });
  await p3.goto(FILE);
  await p3.waitForTimeout(2200);
  yes('the local file still opens clean', fileErrs.length === 0, fileErrs.join(' | '));
  is('no worker was registered from file://',
     await p3.evaluate(async () => { try { return !!(await navigator.serviceWorker.getRegistration()); } catch(e){ return false; } }), false);
  yes('and the app is running', !!(await p3.$('.sidebar')));
  await p3.close();

  console.log('\n7. nothing on another host is allowed to hold up the first paint');
  /* The whole file, deliberately. Every attempt to look at "just the head" has
     been wrong: a byte slice misses the font links behind the base64 touch
     icon, and splitting on a tag name matches the first prose mention of it in
     a comment. These link tags appear nowhere else, so scan for them. */
  const headSrc = fs.readFileSync('/home/user/newlife/index.html', 'utf8');
  const fontLinks = headSrc.match(/<link[^>]*fonts\.googleapis\.com[^>]*>/g) || [];
  const blocking = fontLinks.filter(l => /rel=["']stylesheet["']/.test(l) && !/media=["']print["']/.test(l)
                                          && !/^<link[^>]*rel=["']preconnect/.test(l));
  is('the webfont stylesheet is not on the critical path', blocking.length, 0);
  yes('it is still fetched, and promoted once it lands',
      fontLinks.some(l => /media=["']print["']/.test(l) && /onload=/.test(l)));
  yes('and no <noscript> copy sneaks back onto the critical path — this app is all script anyway',
      !/<noscript>[^]*fonts\.googleapis/.test(headSrc));

  /* the measurement the static check stands in for: the sandbox cannot reach
     Google, so the request hangs for about twelve seconds. The app must not be
     waiting on it. */
  const timed = await b.newContext();
  const p5 = await timed.newPage();
  /* 'commit' rather than the default: waiting for the load event would mean
     waiting for the very stylesheet whose blocking is the thing under test */
  const t0 = Date.now();
  await p5.goto(BASE, {waitUntil: 'commit'});
  let up = null;
  while(Date.now() - t0 < 20000){
    if(await p5.evaluate(() => typeof S === 'object' && !!document.querySelector('#main')).catch(() => false)){
      up = Date.now() - t0; break;
    }
    await p5.waitForTimeout(100);
  }
  yes('the house is standing in under three seconds even with the font host unreachable',
      up !== null && up < 3000, up === null ? 'never came up' : up + 'ms');
  await timed.close();

  console.log('\n' + (errs.length ? 'console:\n  ' + errs.join('\n  ') : 'console: clean'));
  if(errs.length) bad += errs.length;
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke96  all good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
