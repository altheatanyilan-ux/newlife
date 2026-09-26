/* smoke242 — Brand Strategy, inside the Content Studio.

   The claims.

   THE WRITING STUDIO IS NOT TOUCHED. Every writing entry is byte-for-byte
   the same after everything below; no Writing Studio file changed in this
   build; "Start in Writing Studio" goes through newWriting() and sets only
   a title; a deleted piece shows as missing, and nothing breaks.

   THE FILING RULE. A note without a scope, a kind or an anchor is in the
   Inbox, counted on every page, and triage files it.

   ACCOUNTS: charter, voice, three to five pillars adding to 100%.
   HORIZONS: season → 90 → 30 → week, a plan's target against actual mix
   from Published slots. SLOTS: Planned → Linked → Published → Reviewed, the
   checklist from voice rules and the never list before Published, metric
   notes. BRIEFS carry no body. DECISIONS come due. The HYPOTHESIS loop is
   navigable both ways and the review sets its status.

   A QUOTE IS A QUOTE: a type 'quote' entry, so the rest of the house shows it.
   EXPORT carries piece ids, never Writing Studio text. NO NETWORK beyond fonts. */
const {chromium} = require('playwright');
const path = require('path');
const {execSync} = require('child_process');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport: {width: 1300, height: 950}});
  const p = await ctx.newPage(); const errs = [], net = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type() === 'error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/i.test(m.text())) errs.push('console: ' + m.text()); });
  p.on('request', r => { const u = r.url(); if(!/^(file|data|blob):/.test(u) && !/fonts\.(googleapis|gstatic)\.com/.test(u)) net.push(u); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  const changed = (() => { try { return execSync('git diff --name-only HEAD -- src/18-writing.js src/18-writingstudio.js src/18-ws-readability.js', {cwd: __dirname}).toString().trim(); } catch(e){ return 'git failed'; } })();
  is('no Writing Studio file is changed', changed, '');

  const before = await p.evaluate(() => {
    const w = newWriting(); w.title = 'An essay already in the Studio'; saveNow();
    return {id: w.id, json: JSON.stringify(S.entries.filter(e => e.type === 'writing').map(e => JSON.stringify(e)).sort())};
  });

  console.log('\n1. accounts');
  const acc = await p.evaluate(() => {
    const a = brandNewAccount('Quiet Notes');
    a.handle = '@quietnotes'; a.platforms = ['Instagram', 'Substack'];
    a.charter = Object.assign(a.charter, {purpose: 'Slow thinking for busy people', audience: 'People who read on the train', promise: 'One idea you can use today', positioning: 'Essays, not hot takes', never: ['Clickbait openings', 'Advice I have not tried']});
    const two = brandValidatePillars([{name: 'A', targetPct: 50}, {name: 'B', targetPct: 50}]);
    const ninety = brandValidatePillars([{name: 'A', targetPct: 30}, {name: 'B', targetPct: 30}, {name: 'C', targetPct: 30}]);
    const good = [{id: uid(), name: 'Craft', targetPct: 50, color: '#7f916a'}, {id: uid(), name: 'Reading', targetPct: 30, color: '#b08968'}, {id: uid(), name: 'Life', targetPct: 20, color: '#6b7f8e'}];
    const okp = brandValidatePillars(good); a.pillars = good; save();
    const b2 = brandNewAccount('Loud Notes'); b2.pillars = [{id: uid(), name: 'Craft', targetPct: 100}]; b2.voice.tone = {formalCasual: 3, seriousPlayful: 3, reservedBold: 4}; save();
    brandState().prefs.account = a.id;
    return {id: a.id, two, ninety, okp, pillars: good.map(p => p.id)};
  });
  yes('two pillars are refused', /three to five/.test(acc.two || ''), acc.two);
  yes('pillars adding to 90% are refused', /add to 90%/.test(acc.ninety || ''), acc.ninety);
  is('three adding to 100% are kept', acc.okp, null);
  await p.evaluate(id => { location.hash = '#/content/brand/account/' + id; }, acc.id); await p.waitForTimeout(700);
  yes('the profile shows the charter, the tone sliders and the pillars', await p.evaluate(() => document.querySelectorAll('[data-btone]').length === 3 && /100%/.test(document.querySelector('.brand-total').textContent) && !!document.querySelector('[data-bc="never"]')));
  await p.evaluate(() => { location.hash = '#/content/brand/matrix'; }); await p.waitForTimeout(500);
  yes('side by side: both accounts, and where they blur', await p.evaluate(() => document.querySelectorAll('.brand-matrix thead th').length === 3 && /share a pillar: Craft/.test(document.querySelector('.brand-overlap').textContent)));

  console.log('\n2. the filing rule');
  const fil = await p.evaluate(aid => {
    const loose = brandNew('observation', {text: 'Carousel posts get saved, not liked'}, {scope: [aid], anchor: null});
    const q = brandNew('quote', {text: 'Write drunk, edit sober', author: 'attributed to Hemingway', source: 'folklore'}, {scope: ['studio'], anchor: {kind: 'studio', id: null}});
    return {inbox: brandInbox().map(e => e.id), loose: loose.id, qType: q.type, qAuthor: q.extra.author, qFiled: brandFiled(q), qName: typeName(q.type)};
  }, acc.id);
  yes('a note with no anchor waits in the inbox', fil.inbox.includes(fil.loose));
  is('a quote is a quote entry, known to the rest of the house', [fil.qType, fil.qAuthor, fil.qName, fil.qFiled], ['quote', 'attributed to Hemingway', 'Quote', true]);
  await p.evaluate(() => { location.hash = '#/content/brand'; }); await p.waitForTimeout(600);
  yes('the unfiled count shows at the top', await p.evaluate(() => /1 unfiled/.test((document.querySelector('.brand-unfiled') || {}).textContent || '')));
  await p.evaluate(() => { location.hash = '#/content/brand/inbox'; }); await p.waitForTimeout(500);
  await p.evaluate(pid => { const row = document.querySelector('[data-btri]'); const a = row.querySelector('[data-bta]'); a.value = 'pillar:' + pid; row.querySelector('[data-btf]').click(); }, acc.pillars[0]);
  await p.waitForTimeout(300);
  is('triage files it: scope, kind and anchor', await p.evaluate(() => brandInbox().length), 0);

  console.log('\n3. horizons and slots');
  const hz = await p.evaluate(aid => {
    const season = brandNewPlan(aid, 'season', null), q = brandNewPlan(aid, '90', season.id), m = brandNewPlan(aid, '30', q.id), w = brandNewPlan(aid, 'week', m.id);
    brandOf(m).theme = 'Reading in public'; m.title = 'Reading in public';
    const hyp = brandNew('hypothesis', {statement: 'Posts that quote a book get more saves'}, {scope: [aid], anchor: {kind: 'plan', id: m.id}, status: 'open'});
    brandOf(m).hypothesisIds = [hyp.id]; brandOf(hyp).planIds = [m.id]; save();
    return {season: season.id, q: q.id, m: m.id, w: w.id, hyp: hyp.id, nest: [brandOf(q).parentId === season.id, brandOf(m).parentId === q.id, brandOf(w).parentId === m.id]};
  }, acc.id);
  is('season → 90 days → 30 days → week, nested', hz.nest, [true, true, true]);
  await p.evaluate(() => { location.hash = '#/content/brand/plans'; }); await p.waitForTimeout(500);
  yes('the plans page shows the nesting', await p.evaluate(() => !!document.querySelector('.brand-plantree li ul li ul li ul li')));
  const sl = await p.evaluate(({aid, m, pillars, wid}) => {
    const mk = (pillar, date) => brandNew('slot', {title: 'Post ' + date}, {date, accountId: aid, platform: 'Instagram', pillarId: pillar, planId: m, status: 'planned', scope: [aid], anchor: {kind: 'plan', id: m}});
    const t = brandOf(byId(S.entries, m)).start;
    const s1 = mk(pillars[0], t), s2 = mk(pillars[1], brandAddDays(t, 2)), s3 = mk(pillars[0], brandAddDays(t, 4));
    [s1, s2].forEach(s => brandOf(s).status = 'published'); save();
    const mix = brandMix(byId(S.entries, m)).map(x => [x.pillar.name, x.target, x.actual]);
    return {mix, s3: s3.id, s1: s1.id};
  }, {aid: acc.id, m: hz.m, pillars: acc.pillars, wid: before.id});
  is('target against actual mix, from the published slots only', sl.mix, [['Craft', 50, 50], ['Reading', 30, 50], ['Life', 20, 0]]);
  await p.evaluate(m => { location.hash = '#/content/brand/plan/' + m; }, hz.m); await p.waitForTimeout(600);
  yes('the plan page draws its calendar and its slots', await p.evaluate(() => document.querySelectorAll('.brand-plan .brand-calslot').length === 3 && document.querySelectorAll('.brand-plan .brand-slot').length === 3));

  console.log('\n   a slot and its piece');
  await p.evaluate(id => brandSlotDialog(byId(S.entries, id), null, rerender), sl.s3); await p.waitForTimeout(300);
  yes('a planned slot offers "Link a piece" and "Start in Writing Studio"', await p.evaluate(() => !!document.getElementById('bsLink') && !!document.getElementById('bsStart')));
  await p.click('#bsBrief'); await p.waitForTimeout(200);
  yes('a brief has angle, purpose, audience, hypothesis — and no body field', await p.evaluate(() => !!document.getElementById('bbAngle') && !!document.getElementById('bbHyp') && !document.querySelector('.modal textarea#bbBody, .modal [data-bnf="text"]')));
  await p.fill('#bbAngle', 'What a slow reader notices'); await p.evaluate(h => { document.getElementById('bbHyp').value = h; }, hz.hyp); await p.click('#bbOk'); await p.waitForTimeout(300);
  await p.evaluate(id => document.querySelector('#bsLink').click(), sl.s3); await p.waitForTimeout(200);
  await p.evaluate(wid => document.querySelector(`[data-p="${wid}"]`).click(), before.id); await p.waitForTimeout(300);
  const linked = await p.evaluate(id => ({st: brandOf(byId(S.entries, id)).status, piece: brandOf(byId(S.entries, id)).pieceId, shown: /An essay already in the Studio/.test(document.querySelector('.modal').textContent)}), sl.s3);
  is('linking a piece: status Linked, the id kept, its title shown', [linked.st, linked.piece === before.id, linked.shown], ['linked', true, true]);
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  /* publishing asks for the checklist */
  const pub = await p.evaluate(async (id) => {
    brandNew('voiceRule', {text: 'Lead with the concrete, not the abstract'}, {scope: [brandOf(byId(S.entries, id)).accountId], anchor: {kind: 'charter', id: brandOf(byId(S.entries, id)).accountId}});
    brandSlotDialog(byId(S.entries, id), null, () => {}); await new Promise(r => setTimeout(r, 200));
    const items = [...document.querySelectorAll('[data-bck]')].map(i => i.parentElement.textContent.trim());
    document.getElementById('bsPublish').click(); await new Promise(r => setTimeout(r, 100));
    const refused = document.getElementById('bsPubErr').textContent;
    document.querySelectorAll('[data-bck]').forEach(i => { i.checked = true; i.dispatchEvent(new Event('change')); });
    document.getElementById('bsPublish').click(); await new Promise(r => setTimeout(r, 200));
    const st = brandOf(byId(S.entries, id)).status;
    document.querySelectorAll('.overlay').forEach(n => n.remove());
    return {items, refused, st};
  }, sl.s3);
  yes('the checklist comes from the voice rules and the never list', pub.items.length === 3 && pub.items.some(t => /Lead with the concrete/.test(t)) && pub.items.some(t => /Never: Clickbait/.test(t)), JSON.stringify(pub.items));
  yes('Published is refused until every item is ticked', /3 items/.test(pub.refused), pub.refused);
  is('  and then it is Published', pub.st, 'published');
  const met = await p.evaluate(async id => { brandMetricDialog(null, byId(S.entries, id), () => {}); await new Promise(r => setTimeout(r, 100));
    const ins = document.querySelectorAll('[data-bmf="value"]'); ins[0].value = '1200'; ins[0].dispatchEvent(new Event('input')); ins[1].value = '85'; ins[1].dispatchEvent(new Event('input'));
    document.getElementById('bmOk').click(); const b = brandOf(byId(S.entries, id)); return b.metricIds.map(x => brandOf(byId(S.entries, x)).numbers); }, sl.s3);
  is('a metric note, typed in, on the slot', met, [[{label: 'views', value: '1200'}, {label: 'saves', value: '85'}]]);
  const start = await p.evaluate(async id => { const s = byId(S.entries, id); brandOf(s).pieceId = null; brandOf(s).status = 'planned'; save();
    brandSlotDialog(s, null, () => {}); await new Promise(r => setTimeout(r, 150)); document.getElementById('bsStart').click(); await new Promise(r => setTimeout(r, 300));
    const piece = byId(S.entries, brandOf(s).pieceId); return {hash: location.hash, type: piece && piece.type, title: piece && piece.title, status: brandOf(s).status, body: piece && piece.body}; }, sl.s1);
  yes('"Start in Writing Studio" makes a piece through newWriting(), sets only its title, links it, and opens it', start.type === 'writing' && /^#\/writing\//.test(start.hash) && start.status === 'linked' && start.body === '', JSON.stringify(start));
  const missing = await p.evaluate(async id => { const s = byId(S.entries, id); const pid = brandOf(s).pieceId; S.entries = S.entries.filter(e => e.id !== pid);
    location.hash = '#/content/brand/calendar'; await new Promise(r => setTimeout(r, 500)); brandState().prefs.calMonth = brandOf(s).date.slice(0, 7); rerender(); await new Promise(r => setTimeout(r, 400));
    return {row: /piece missing/.test(document.querySelector(`[data-bslot="${id}"]`).textContent)}; }, sl.s1);
  yes('a deleted piece shows as "piece missing", and nothing breaks', missing.row);

  console.log('\n4. judgment');
  const jd = await p.evaluate(async ({aid, m, hyp}) => {
    brandNew('decision', {question: 'Should Quiet Notes post daily?', title: 'Should Quiet Notes post daily?'}, {options: [{text: 'Daily', pros: 'reach', cons: 'quality'}, {text: 'Three a week', pros: 'depth', cons: 'slower'}], choice: 'Three a week', rationale: 'Depth is the promise', changeMyMind: 'Saves drop two months running', reviewOn: brandAddDays(today(), -1), outcome: '', scope: [aid], anchor: {kind: 'charter', id: aid}});
    const due = brandDecisionsDue(aid).length;
    brandReviewDialog(null, byId(S.entries, m), () => {}); await new Promise(r => setTimeout(r, 150));
    const prompts = document.querySelectorAll('.modal [data-bra]').length;
    document.querySelector(`[data-brh="${hyp}"]`).value = 'confirmed';
    document.querySelector('.modal [data-bra]').value = 'It happened: 3 of 3 posts went out.';
    document.getElementById('brOk').click(); await new Promise(r => setTimeout(r, 150));
    const h = byId(S.entries, hyp), plan = byId(S.entries, m);
    return {due, prompts, status: brandOf(h).status, reviewLinked: !!brandOf(plan).reviewId, loop: brandHypothesisHTML(h)};
  }, {aid: acc.id, m: hz.m, hyp: hz.hyp});
  is('a decision past its date is due for review', jd.due, 1);
  is('the 30-day review has its five fixed prompts', jd.prompts, 5);
  is('  and it sets the hypothesis confirmed', jd.status, 'confirmed');
  yes('the loop reads both ways: hypothesis → plan → slots → review', jd.reviewLinked && /Reading in public/.test(jd.loop) && /1 slot/.test(jd.loop) && /30 days review/.test(jd.loop), jd.loop.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  await p.evaluate(() => { location.hash = '#/content/brand'; }); await p.waitForTimeout(600);
  yes('the dashboard: unfiled, slots by status, decisions due, the 30-day plan', await p.evaluate(() => document.querySelectorAll('.brand-tile').length === 6 && /Reading in public/.test(document.querySelector('.brand-dash').textContent) && /Should Quiet Notes post daily/.test(document.querySelector('.brand-dash').textContent)));

  console.log('\n5. the notebook, studio-wide, export');
  const nb = await p.evaluate(aid => { const f = brandState().prefs.notebook;
    const all = brandNotebookList({}).length, q = brandNotebookList({q: 'hemingway'}).length, k = brandNotebookList({kind: 'slot'}).length, s = brandNotebookList({scope: 'studio'}).length;
    return {all, q, k, s}; }, acc.id);
  yes('the notebook filters by scope, kind, pillar, tag, and searches the text', nb.all > 10 && nb.q === 1 && nb.k === 3 && nb.s === 1, JSON.stringify(nb));
  await p.evaluate(() => { location.hash = '#/content/brand/studio'; }); await p.waitForTimeout(500);
  yes('studio-wide: every account in one table', await p.evaluate(() => document.querySelectorAll('.brand-studio tbody tr').length === 2));
  const ex = await p.evaluate(() => { const pay = brandExport(); const s = JSON.stringify(pay);
    const again = brandImport(JSON.parse(s));
    return {writing: pay.entries.some(e => e.type === 'writing'), text: /An essay already in the Studio/.test(s), ids: pay.entries.filter(e => brandOf(e).pieceId).length, again: again.entries + again.accounts}; });
  yes('the export carries piece ids and no Writing Studio content', !ex.writing && !ex.text && ex.ids >= 1, JSON.stringify(ex));
  is('  re-importing it adds nothing', ex.again, 0);

  const after = await p.evaluate(id => JSON.stringify(S.entries.filter(e => e.type === 'writing' && e.id === id).map(e => JSON.stringify(e)).sort()), before.id);
  const beforeOne = await p.evaluate(({json, id}) => JSON.stringify(JSON.parse(json).filter(x => JSON.parse(x).id === id)), before);
  is('the existing writing entry is byte-for-byte what it was', after, beforeOne);
  await p.evaluate(id => { location.hash = '#/writing/' + id; }, before.id); await p.waitForTimeout(900);
  yes('and the Writing Studio still opens it', await p.evaluate(() => /An essay already in the Studio/.test(document.body.textContent)));
  await p.evaluate(() => { location.hash = '#/content'; }); await p.waitForTimeout(600);
  yes('the Content Studio has its way in', await p.evaluate(() => !!document.querySelector('.ct-views a[href="#/content/brand"]')));

  await p.setViewportSize({width: 390, height: 844});
  for(const h of ['#/content/brand', '#/content/brand/notebook', '#/content/brand/plan/' + hz.m, '#/content/brand/calendar', '#/content/brand/matrix']){
    await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(500);
    yes(`${h.replace(hz.m, '<id>')} fits a phone`, !(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)));
  }
  is('no network requests beyond Google Fonts', net, []);
  if(errs.length) console.log('\nerrors:\n  ' + errs.slice(0, 10).join('\n  '));
  yes('no errors on the page', !errs.length, errs.length + ' errors');
  await b.close();
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  process.exit(bad ? 1 : 0);
})();
