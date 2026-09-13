/* smoke150 — the floor under boot. An app that holds the only copy of someone's
   writing must never answer with a blank page: a white screen looks exactly
   like having lost everything. Every failure has to say what happened and hand
   the data back. */
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const REAL = '/home/user/newlife/index.html';
const TMP  = path.join(os.tmpdir(), 'smoke150');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => a===b ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  fs.rmSync(TMP, {recursive:true, force:true}); fs.mkdirSync(TMP, {recursive:true});
  const html = fs.readFileSync(REAL, 'utf8');
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

  console.log('\n1. a healthy boot is untouched');
  {
    const p = await (await b.newContext({viewport:{width:1200,height:900}})).newPage();
    await p.goto('file://' + REAL); await p.waitForTimeout(3000);
    yes('the app draws', await p.evaluate(() => (document.querySelector('#main')?.innerHTML.length||0) > 1000));
    yes('  and no recovery screen appears', await p.evaluate(() => !document.querySelector('#bootFail')));
    await p.close();
  }

  console.log('\n2. a boot that throws says so, instead of showing nothing');
  {
    const broken = html.replace('function migrate(){', 'function migrate(){ throw new Error("MIGRATION EXPLODED");');
    yes('the fault could be injected', broken !== html);
    fs.writeFileSync(TMP + '/boot.html', broken);
    const ctx = await b.newContext({viewport:{width:1200,height:900}, acceptDownloads:true});
    const p = await ctx.newPage();
    await p.goto('file://' + TMP + '/boot.html'); await p.waitForTimeout(2800);
    const r = await p.evaluate(() => { const el = document.querySelector('#bootFail');
      return {shown:!!el, txt: el ? el.textContent : '',
        buttons:[...document.querySelectorAll('#bootFail button')].map(x => x.id)}; });
    yes('the recovery screen is there', r.shown);
    yes('  it says the writing is safe', /has not been touched/.test(r.txt));
    yes('  it names what went wrong', /MIGRATION EXPLODED/.test(r.txt));
    is('  and offers the three ways out', r.buttons.join(','), 'bfRetry,bfSave,bfSW');
    /* the point of the screen: getting the data out when nothing else works */
    const dl = p.waitForEvent('download', {timeout:9000}).catch(() => null);
    await p.click('#bfSave');
    const f = await dl;
    yes('the backup downloads', !!f, f ? f.suggestedFilename() : 'no download');
    if(f){
      const body = JSON.parse(fs.readFileSync(await f.path(), 'utf8'));
      yes('  it is a real backup file', body.version === 1 && !!body.data);
      yes('  marked as a rescue', body.rescued === true);
      yes('  with the stores in it', Object.keys(body.data).length > 5,
          Object.keys(body.data).length + ' stores');
    }
    await ctx.close();
  }

  console.log('\n3. a page that throws costs that page, never the whole house');
  {
    const p = await (await b.newContext({viewport:{width:1200,height:900}})).newPage();
    await p.goto('file://' + REAL); await p.waitForTimeout(3000);
    if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
    /* rerender empties #main before drawing, so a throw used to leave it blank —
       and almost every edit ends in a rerender */
    const r = await p.evaluate(() => {
      const keep = routes.today;
      routes.today = () => { throw new Error('THIS PAGE EXPLODED'); };
      location.hash = '#/today';
      try { rerender(); } catch(e){ return {threw:'rerender itself threw: ' + e.message}; }
      const out = {main: document.querySelector('#main').innerHTML.length,
        says:/THIS PAGE EXPLODED/.test(document.body.textContent),
        wayOut: !!document.querySelector('#main a[href="#/today"]'),
        shell: !!document.querySelector('#sidebar')};
      routes.today = keep; return out;
    });
    yes('rerender does not throw out of itself', !r.threw, r.threw || '');
    yes('  the page area is not left empty', (r.main||0) > 200, `${r.main} chars`);
    yes('  it names the error', r.says);
    yes('  it offers a way out', r.wayOut);
    yes('  and the sidebar is still there', r.shell);
    await p.close();
  }
  await b.close();

  console.log('\n3b. even a script that will not parse says something');
  {
    /* the worst case: conflict markers inside the one <script>. No handler can
       fire, so the only thing left is HTML that was already on the page. */
    const wrecked = html.replace('function migrate(){', '<<<<<<< HEAD\nfunction migrate(){');
    fs.writeFileSync(TMP + '/wrecked.html', wrecked);
    const b2 = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
    const p2 = await (await b2.newContext({viewport:{width:1200,height:900}})).newPage();
    let syntax = false;
    p2.on('pageerror', e => { if(/SyntaxError|Unexpected/.test(e.message)) syntax = true; });
    await p2.goto('file://' + TMP + '/wrecked.html'); await p2.waitForTimeout(2200);
    const r = await p2.evaluate(() => { const d = document.querySelector('#deadStart');
      return {shown:!!d, txt: d ? d.textContent : '', chars:(document.body.innerText||'').trim().length}; });
    yes('the script really did fail to parse', syntax);
    yes('  and the page is still not blank', r.shown && r.chars > 100, `${r.chars} chars`);
    yes('  it says the writing is elsewhere', /not in this file/.test(r.txt));
    yes('  and tells you what to do', /Reload/.test(r.txt));
    await b2.close();
  }
  /* and on a healthy build it must not linger */
  {
    const b3 = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
    const p3 = await (await b3.newContext({viewport:{width:1200,height:900}})).newPage();
    await p3.goto('file://' + REAL); await p3.waitForTimeout(2500);
    yes('a healthy start removes the notice', await p3.evaluate(() => !document.querySelector('#deadStart')));
    await b3.close();
  }

  console.log('\n3c. the two database engines number the same database alike');
  {
    /* Dexie writes its version to IndexedDB as version * 10, so its
       version(11) is IDB 110. MiniDexie stands in for Dexie under the same
       database name, and which one a build contains depends only on whether
       whoever ran build.js had npm install'ed. If they disagree, a database
       written by one cannot be opened by the other at all — VersionError, and
       the app never starts. This is the guard on that. */
    const decl = fs.readFileSync('/home/user/newlife/src/06-db.js', 'utf8');
    const v = (decl.match(/db\.version\((\d+)\)/) || [])[1];
    yes('the declared version is found', !!v, String(v));
    yes('  MiniDexie multiplies it by ten, as Dexie does',
        /_idbVersion\(\)\s*{\s*return Math\.round\(this\._version \* 10\)/.test(decl));
    yes('  and a newer database is adopted rather than refused',
        /VersionError/.test(decl) && /_openAt\(null\)/.test(decl));
    /* the number the browser actually ends up holding */
    const b4 = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
    const p4 = await (await b4.newContext({viewport:{width:1000,height:800}})).newPage();
    await p4.goto('file://' + REAL); await p4.waitForTimeout(3000);
    const got = await p4.evaluate(() => new Promise(res => {
      const q = indexedDB.open('lifeinstrument-db');
      q.onsuccess = () => { const n = q.result.version; q.result.close(); res(n); };
      q.onerror = () => res(-1); }));
    is('  the database really is at Dexie\'s number', got, Number(v) * 10);
    await b4.close();
  }

  console.log('\n4. an unfinished merge cannot be built');
  {
    const {execFileSync} = require('child_process');
    const f = '/home/user/newlife/src/02-css-sections.html';
    const orig = fs.readFileSync(f, 'utf8');
    let out = '', code = 0;
    try {
      fs.writeFileSync(f, '<<<<<<< HEAD\n' + orig);
      execFileSync('node', ['build.js'], {cwd:'/home/user/newlife', encoding:'utf8'});
    } catch(e){ code = e.status; out = (e.stdout||'') + (e.stderr||''); }
    finally { fs.writeFileSync(f, orig); execFileSync('node', ['build.js'], {cwd:'/home/user/newlife'}); }
    is('the build refuses', code, 1);
    yes('  and says which file', /02-css-sections\.html:1/.test(out), out.split('\n')[1] || out.slice(0,90));
    yes('  and not to hand-edit the output', /Never hand-edit index\.html/.test(out));
  }

  console.log('\n5. git will not text-merge the generated file');
  {
    const {execFileSync} = require('child_process');
    const attrs = execFileSync('git', ['check-attr', 'merge', '--', 'index.html'],
      {cwd:'/home/user/newlife', encoding:'utf8'}).trim();
    is('index.html is marked unmergeable', attrs, 'index.html: merge: unset');
  }

  fs.rmSync(TMP, {recursive:true, force:true});
  console.log(bad ? `\n${bad} FAILED` : '\nsmoke150  all good');
  process.exit(bad ? 1 : 0);
})();
