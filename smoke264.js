/* smoke264 — Brand Strategy: an open question can be added where open
   questions are kept.

   The claims.

   THE BUTTON. The Judgment page's four sections — Decisions, Hypotheses,
   Reviews, Open questions — each carry a ＋ in their header, the last one
   "＋ Open question", with a count beside the heading.

   WHAT IT MAKES. Pressing it opens the note dialog already set to an open
   question, filed to the account in hand and anchored to its charter. Saved,
   the question is in the section, the count goes up, and it is filed — not
   waiting in the Inbox.

   AND THE PAGE'S ＋. The room's own add menu offers "An open question" too.

   Run: NODE_PATH=node_modules node smoke264.js */
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
  /* an account to work in: the worked example's */
  const acc = await p.evaluate(async () => { await applyTutorial(); saveNow();
    const a = brandState().accounts[0]; brandState().prefs.account = a.id; return {id: a.id, name: a.name}; });
  await p.evaluate(() => { location.hash = '#/content/brand/decisions'; }); await p.waitForTimeout(1200);

  console.log('\n1. the button');
  const heads = await p.evaluate(() => [...document.querySelectorAll('.brand-judg .brand-sechead')].map(h => ({
    h: (h.querySelector('h3') || {}).textContent, btn: [...h.querySelectorAll('button')].map(x => x.textContent.trim()).join('|')})));
  is('four sections, each with a ＋ of its own', heads.map(h => [h.h, !!h.btn]),
    [['Decisions', true], ['Hypotheses', true], ['Reviews', true], ['Open questions', true]]);
  yes('  and the last one is "＋ Open question"', (heads[3] || {}).btn === '＋ Open question', heads[3]);
  const n0 = await p.evaluate(id => brandOfKind('question', id).length, acc.id);
  const cnt0 = await p.evaluate(() => { const h = [...document.querySelectorAll('.brand-judg .brand-sechead')].pop(); return h && h.querySelector('.faint') ? h.querySelector('.faint').textContent : null; });
  is('  with the count beside the heading', cnt0, String(n0));

  console.log('\n2. what it makes');
  await p.click('#bNewQ'); await p.waitForTimeout(300);
  is('the dialog opens set to an open question', await p.$eval('#bnKind', s => s.value), 'question');
  await p.fill('[data-bnf="text"]', 'Who is this account for on a weeknight?');
  await p.click('#bnOk'); await p.waitForTimeout(500);
  const Q = await p.evaluate(id => { const q = brandOfKind('question', id).find(e => /weeknight/.test(brandGet(e, 'text') || e.title || ''));
    if(!q) return null; const b = brandOf(q); return {scope: b.scope, anchor: b.anchor, filed: brandFiled(q), inInbox: brandInbox().includes(q)}; }, acc.id);
  yes('the question is saved', !!Q, Q);
  is('  filed to the account, anchored to its charter', Q && [Q.scope, Q.anchor], [[acc.id], {kind: 'charter', id: acc.id}]);
  yes('  and filed — not waiting in the Inbox', Q && Q.filed && !Q.inInbox, Q);
  const shown = await p.evaluate(() => { const s = [...document.querySelectorAll('.brand-judg .brand-card')].pop();
    return {text: /weeknight/.test(s.textContent), count: s.querySelector('.brand-sechead .faint').textContent}; });
  yes('it is in the section', shown.text, shown);
  is('  and the count went up', shown.count, String(n0 + 1));

  console.log('\n3. the page\'s ＋');
  const opts = await p.evaluate(() => (PageEntryConfig.current || {}).options || []);
  yes('the add menu offers "An open question"', (opts || []).some(o => o.label === 'An open question'), (opts || []).map(o => o.label));

  is('no page errors', errs, []);
  console.log(`\n${bad ? bad + ' FAILED' : 'all good'}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
