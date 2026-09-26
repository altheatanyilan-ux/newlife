/* smoke244 — the Identity room: People, Values, Skill Tree and Finance as
   four tabs of one room.

   The claims.
   - Each tab draws its room, unchanged, one at a time, under one strip.
   - Every old address lands on the right tab and item — #/people/<id>,
     #/values, #/value/<id>, #/skills/<id>, #/finance — and the redirect
     replaces the history entry, so Back leaves rather than bouncing.
   - The nav has one door, Identity, where there were four; the four keys
     are gone from saved layouts; the mobile bar has it too.
   - The last tab is remembered; the "i" key still opens the quick log on
     People; no data moves (every store's row count is the same). */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const counts = () => p.evaluate(async () => { await flushSave(); const o = {}; for(const t of textTables()) o[t.name] = await t.count(); return o; });
  await p.evaluate(async () => { if(!S.people.length){ S.people.push(Object.assign(newPerson('Ada Lovelace'), {})); await saveNow(); } });
  const before = await counts();
  const ids = await p.evaluate(() => ({person: (S.people[0] || {}).id, value: (S.values[0] || {}).id, skill: (S.skills[0] || {}).id}));

  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(800); return p.evaluate(() => ({hash: location.hash, tab: (document.querySelector('.id-tabs a.on') || {}).textContent, n: document.querySelectorAll('.id-tabs').length})); };
  is('#/people lands on the People tab', await go('#/people'), {hash: '#/identity/people', tab: 'People', n: 1});
  is('#/values lands on the Values tab', await go('#/values'), {hash: '#/identity/values', tab: 'Values', n: 1});
  is('#/skills lands on the Skill Tree tab', await go('#/skills'), {hash: '#/identity/skills', tab: 'Skill Tree', n: 1});
  is('#/finance lands on the Finance tab', await go('#/finance'), {hash: '#/identity/finance', tab: 'Finance', n: 1});
  if(ids.value){ const r = await go('#/value/' + ids.value); is('#/value/<id> opens that value on the Values tab', [r.hash, r.tab], ['#/identity/values/' + ids.value, 'Values']); }
  if(ids.skill){ const r = await go('#/skills/' + ids.skill); const open = await p.evaluate(() => !!document.querySelector('#panel')); is('#/skills/<id> opens that skill on the Skill Tree tab, and stays in the room', [r.tab, r.hash, open], ['Skill Tree', '#/identity/skills', true]); }
  if(ids.person){ const r = await go('#/people/' + ids.person); is('#/people/<id> keeps its id', r.hash, '#/identity/people/' + ids.person); }
  /* each tab draws its own room */
  const rooms = await p.evaluate(async () => { const out = {}; for(const t of ['people', 'values', 'skills', 'finance']){ location.hash = '#/identity/' + t; await new Promise(r => setTimeout(r, 700));
    out[t] = document.querySelector('#idSub').children.length > 0 && document.querySelector('#idSub').textContent.trim().length > 40; } return out; });
  is('each tab draws its room under the strip', rooms, {people: true, values: true, skills: true, finance: true});
  /* Back is not caught */
  await go('#/today'); await go('#/people');
  await p.goBack(); await p.waitForTimeout(700);
  is('Back from a redirected address returns to where you were', await p.evaluate(() => location.hash), '#/today');
  /* remembered */
  await go('#/identity/finance'); const rem = await go('#/identity');
  is('the last tab is remembered', rem.tab, 'Finance');
  /* the nav */
  const nav = await p.evaluate(() => ({door: !!document.querySelector('#sidebar a[data-page="identityRoom"], nav a[data-page="identityRoom"]'),
    four: ['people', 'values', 'skills', 'finance'].filter(k => document.querySelector(`a[data-page="${k}"]`)).length,
    zones: navConfig().identity.includes('identityRoom') && !Object.values(navConfig()).flat().some(k => ['people', 'values', 'skills', 'finance'].includes(k)),
    active: activePageKey()}));
  is('one door, Identity, where there were four', [nav.door, nav.four, nav.zones], [true, 0, true]);
  is('  and it is lit while any tab is open', nav.active, 'identityRoom');
  /* a layout saved with the four in it */
  const saved = await p.evaluate(() => { S.settings.nav = {create: ['content', 'finance', 'skills'], identity: ['values', 'people', 'journals'], standalone: []}; const n = navConfig(); return {create: n.create, identity: n.identity}; });
  yes('a saved layout loses the four and gains Identity', !saved.create.includes('finance') && !saved.identity.includes('people') && saved.identity.includes('identityRoom'), JSON.stringify(saved));
  /* the i key */
  await go('#/identity/people'); await p.evaluate(() => document.activeElement && document.activeElement.blur());
  await p.keyboard.press('i'); await p.waitForTimeout(400);
  yes('"i" still opens the quick log on People', await p.evaluate(() => !!document.querySelector('#modals .modal #qlSave, .modal #qlSave')));
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  const after = await counts();
  const diff = Object.keys(before).filter(k => before[k] !== after[k] && k !== 'meta');
  yes('no data moved: every store has the rows it had', !diff.length, diff.map(k => `${k} ${before[k]}→${after[k]}`).join(', '));
  await p.setViewportSize({width: 390, height: 844});
  for(const t of ['people', 'values', 'skills', 'finance']){ await go('#/identity/' + t); yes(`#/identity/${t} fits a phone`, !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))); }
  if(errs.length) console.log('\nerrors:\n  ' + errs.slice(0, 10).join('\n  '));
  yes('no errors on the page', !errs.length, errs.length + ' errors');
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
