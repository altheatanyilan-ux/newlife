/* Nothing on S is saved until its name is in META_KEYS or ARRAY_STORES.
   This is the guard on that: every object store the rooms actually write
   to, planted with a canary, reloaded, and looked for again — and then
   looked for in an exported backup file, which is a separate path. */
const { chromium } = require('playwright');
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext(); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(3200);
  await p.evaluate(async () => {
    contentState().themes.push({id:'C1', name:'Canary', color:'#f00', description:'', linkedValueIds:[], linkedThreadIds:[]});
    contentVault().quotes.push({id:'C2', text:'canary', bookTitle:'x', author:'x', pageOrChapter:'', themes:[], paraphrase:false, addedAt:''});
    planState().lists.push({id:'C3', name:'Canary list', sections:[], color:'#f00'});
    S.wsDaily = S.wsDaily || {}; S.wsDaily['1999-01-01'] = {c:42};
    S.wsRead = S.wsRead || {}; S.wsRead.canary = true;
    S.runLog = S.runLog || {}; S.runLog['1999-01-01'] = [{km:5}];
    S.weekPlans = S.weekPlans || {}; S.weekPlans['1999-W01'] = {theme:'canary'};
    S.monthPlans = S.monthPlans || {}; S.monthPlans['1999-01'] = {theme:'canary'};
    S.monthReviews = S.monthReviews || {}; S.monthReviews['1999-01'] = {note:'canary'};
    S.position = S.position || {}; S.position.canary = true;
    S.dailyRhythm = S.dailyRhythm || {}; S.dailyRhythm['1999-01-01'] = {blocks:[{tag:'canary'}]};
    await saveNow(); await flushSave();
  });
  await p.waitForTimeout(900); await p.evaluate(() => flushSave());
  await p.reload(); await p.waitForTimeout(3400);
  const a = await p.evaluate(() => ({
    content: !!(S.content?.themes||[]).find(t=>t.id==='C1'),
    vault: !!(S.contentVault?.quotes||[]).find(q=>q.id==='C2'),
    planning: !!(S.planning?.lists||[]).find(l=>l.id==='C3'),
    wsDaily: !!(S.wsDaily||{})['1999-01-01'], wsRead: !!S.wsRead?.canary,
    runLog: !!(S.runLog||{})['1999-01-01'], weekPlans: !!(S.weekPlans||{})['1999-W01'],
    monthPlans: !!(S.monthPlans||{})['1999-01'], monthReviews: !!(S.monthReviews||{})['1999-01'],
    position: !!S.position?.canary, dailyRhythm: !!(S.dailyRhythm||{})['1999-01-01'],
  }));
  Object.entries(a).forEach(([k,v]) => ok('S.'+k+' survives a reload', v, 'lost'));
  // and a round trip through the backup file
  const round = await p.evaluate(async () => {
    const payload = await (async () => { await flushSave();
      const data = {}; for(const t of db.tables) data[t.name] = await t.toArray();
      return {version:1, exportedAt:new Date().toISOString(), data}; })();
    const meta = payload.data.meta.map(r => r.key);
    return ['planning','content','contentVault','wsDaily','runLog','position'].filter(k => !meta.includes(k));
  });
  ok('a backup file carries them too', round.length === 0, 'missing from the backup: ' + round.join(', '));
  console.log('errors:', errs.length?errs:'none'); if(errs.length) fails+=errs.length;
  console.log(fails ? `\n${fails} FAILED` : '\nall good');
  await b.close(); process.exit(fails?1:0);
})();
