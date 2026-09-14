/* smoke174 — the last resort keeps its mouth shut until it has something to
   say.

   The notice at the top of the body reads "The house did not start." It is
   plain HTML rather than anything cleverer for one reason: the failure it
   exists for is the script failing to PARSE, and then no JavaScript runs at
   all, no error handler fires, and every recovery further down the file is
   dead code. It has to be in the document from the beginning.

   Which is exactly why it was a lie. This file is four and a half megabytes
   and nearly all of it is that one script; the parser reaches the body long
   before it reaches the end of the script, and paints. So every cold open
   showed a person the words "The house did not start." for about a second
   before the house started.

   Two things have to be true at once, and they pull against each other.

   Opening the house must never show it. Not "rarely" — the flash was a race
   against a four-megabyte parse, and a race you win on a fast machine is a
   race somebody else loses.

   And a file that really is broken must still say so. Which is why the fix
   cannot be a line of JavaScript, however early: the case that matters is the
   case where no JavaScript runs. It is CSS and a clock, and this file checks
   the clock by breaking the script on purpose and waiting. */
const {chromium} = require('playwright');
const path = require('path'); const fs = require('fs');
const SCRATCH = '/tmp/claude-0/-home-user-newlife/923b6cf5-ecb3-57ac-957e-178011b85c4d/scratchpad';
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* watch what the notice actually does, from before any page script runs */
const WATCH = () => {
  window.__seen = [];
  const look = () => {
    const d = document.getElementById('deadStart');
    if(d){
      const cs = getComputedStyle(d);
      window.__seen.push({t: Math.round(performance.now()),
        vis: cs.visibility, op: +cs.opacity});
    }
    if(performance.now() < 9000) requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
};

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

  console.log('\n1. opening the house never shows it');
  /* Slowed down on purpose. The flash is a race, and at full speed this
     machine wins it — which proves nothing about anybody else's. */
  for(const rate of [1, 6]){
    const ctx = await b.newContext({viewport:{width:1100, height:800}});
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', {rate});
    await p.addInitScript(WATCH);
    await p.goto(FILE);
    await p.waitForTimeout(3000);
    const seen = await p.evaluate(() => ({
      frames: window.__seen.length,
      shown: window.__seen.filter(s => s.vis !== 'hidden' && s.op > 0),
      gone: !document.getElementById('deadStart')}));
    yes(`at ${rate}x slower the notice is never once visible`,
      seen.shown.length === 0,
      seen.shown.slice(0, 3).map(s => `${s.t}ms ${s.vis} ${s.op}`).join(', '));
    yes(`  and boot takes it down altogether`, seen.gone);
    await ctx.close();
  }

  console.log('\n2. and a file that really is broken still says so');
  /* The whole point of the notice, and the reason the fix could not be a
     script: break the parse and nothing else in the file gets a vote. */
  const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
  const cut = html.indexOf('<script>');
  yes('the app is one script, as the notice assumes', cut > 0);
  const broken = path.join(SCRATCH, 'halfmerged.html');
  /* a half-finished merge: the script opens and is never closed */
  fs.writeFileSync(broken, html.slice(0, cut + 8) + '\nconst a = {   // and the file ends here\n');
  const ctx = await b.newContext({viewport:{width:1100, height:800}});
  const p = await ctx.newPage();
  await p.addInitScript(WATCH);
  await p.goto('file://' + broken);
  await p.waitForTimeout(3000);
  const early = await p.evaluate(() => getComputedStyle(document.getElementById('deadStart')).visibility);
  is('  three seconds in it is still holding its tongue', early, 'hidden');
  await p.waitForTimeout(3500);
  const late = await p.evaluate(() => {
    const d = document.getElementById('deadStart'); if(!d) return null;
    const cs = getComputedStyle(d);
    return {vis: cs.visibility, op: +cs.opacity, says: d.textContent.includes('The house did not start'),
      reload: !!d.querySelector('button'), box: d.getBoundingClientRect().height};
  });
  yes('  and then it speaks', late && late.vis === 'visible' && late.op > .9, JSON.stringify(late));
  yes('    saying the thing it exists to say', late && late.says);
  yes('    with the button that fixes it', late && late.reload);
  yes('    and covering the page, not hiding in a corner', late && late.box > 400, late && String(late.box));
  await ctx.close();

  console.log('\n3. and what the waiting costs is paid in the right place');
  /* Five seconds is measured rather than picked: on a machine slowed sixteen
     times a healthy boot takes the notice down at about 4.4 seconds. The cost
     is the other side of it — a broken file shows nothing for five seconds
     before explaining itself — and that is the right way round, because a
     false alarm on every healthy open is worse than a wait in the rare case
     that is really broken. What a person waits in front of has to be the
     app's own paper, though, not a white void. */
  const ctx3 = await b.newContext({viewport:{width:1100, height:800}});
  const p3 = await ctx3.newPage();
  await p3.goto('file://' + broken); await p3.waitForTimeout(900);
  const ground = await p3.evaluate(() => {
    const c = getComputedStyle(document.body).backgroundColor;
    const m = c.match(/\d+/g) || [];
    return {c, white: m.length >= 3 && m.slice(0, 3).every(v => +v > 250),
      clear: m.length >= 4 ? +m[3] > 0 : true};
  });
  yes('the wait happens on the app\'s own paper, not a white void',
    ground.clear && !ground.white, ground.c);
  await ctx3.close();

  console.log('\n4. it cannot swallow a click while it waits');
  /* Hidden with opacity alone it would still be a sheet of glass over the
     whole house for four seconds. */
  const ctx2 = await b.newContext({viewport:{width:1100, height:800}});
  const p2 = await ctx2.newPage();
  await p2.goto(FILE); await p2.waitForTimeout(400);
  const hit = await p2.evaluate(() => {
    const d = document.getElementById('deadStart');
    if(!d) return 'already gone';
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return el && (el.id === 'deadStart' || d.contains(el)) ? 'the notice' : 'the house';
  });
  yes('the middle of the page belongs to the house', hit !== 'the notice', hit);
  await ctx2.close();

  await b.close();
  console.log(`\nsmoke174  ${bad ? bad + ' FAILED' : 'all good'}`);
  process.exit(bad ? 1 : 0);
})();
