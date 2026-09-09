/* The Content room: the piece that is a Writing Studio project, the eight
   stages, four views, the vault that will not fabricate a quotation, and
   the bridges the rest of the house crosses to get here. */
const { chromium } = require('playwright');
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage(); await page.setViewportSize({width:1500,height:1100});
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errors.push('CONSOLE: '+m.text()); });
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(2900);
  /* clear the toasts, never the tray they live in — removing #toasts makes
     the next toast() throw and takes the render down with it */
  const clean = () => page.evaluate(() => document.querySelectorAll('.toast').forEach(n => n.remove()));
  const go = async () => { await page.evaluate(() => { location.hash = '#/content'; rerender(); });
    await page.waitForTimeout(1000); await clean(); };
  await go();

  console.log('\n1. the room, furnished');
  const seed = await page.evaluate(() => ({nav: !!document.querySelector('[data-page="content"]'),
    cols: document.querySelectorAll('[data-ctcol]').length, cards: document.querySelectorAll('[data-ctcard]').length,
    themes: S.content.themes.length, vault: S.contentVault.quotes.length,
    stages: [...new Set(contentPieces().map(e => e.extra.content.stage))].length}));
  ok('a nav entry, after the Library', seed.nav, 'no Content in the sidebar');
  ok('eight stages, one column each', seed.cols === 8, 'saw ' + seed.cols);
  ok('twelve themes and a stocked vault', seed.themes === 12 && seed.vault >= 45, JSON.stringify(seed));
  ok('pieces spread across the pipeline, not heaped in one column',
     seed.cards >= 8 && seed.stages >= 5, JSON.stringify(seed));

  console.log('\n2. a piece IS a Writing Studio project');
  const one = await page.evaluate(() => { const e = contentPieces()[0];
    return {type:e.type, hasBinder: !!e.extra.binder,
      wordsAgree: pieceWords(e) === wsProjectWords(e),
      inStudio: S.entries.filter(x => x.type === 'writing').length === contentPieces().length}; });
  ok('every piece is an entry of type writing', one.type === 'writing' && one.inStudio, JSON.stringify(one));
  ok('the word count is the binder\'s, counted not stored', one.wordsAgree, JSON.stringify(one));
  const targets = await page.evaluate(() => contentPieces()
    .filter(e => pieceTarget(e)).map(e => `${pieceWords(e)}/${pieceTarget(e)}`));
  ok('the seeded counts are real words, not claims',
     targets.includes('800/2500') && targets.includes('280/280'), targets.join(' '));

  console.log('\n3. eight stages over four statuses, without losing the finer one');
  const sync = await page.evaluate(() => { const e = contentPieces()[0], keep = e.extra.content.stage;
    pieceSetStage(e, 'ready'); const a = e.extra.status;
    pieceSetStage(e, 'refining'); const b = e.extra.status;
    e.extra.status = 'Drafting'; pieceSyncFromStudio(e); const stayed = e.extra.content.stage;
    e.extra.status = 'Published'; pieceSyncFromStudio(e); const moved = e.extra.content.stage;
    pieceSetStage(e, keep); return {a, b, stayed, moved}; });
  ok('a stage sets the status it implies', sync.a === 'Polished' && sync.b === 'Drafting', JSON.stringify(sync));
  ok('a status that already contains the stage leaves it alone', sync.stayed === 'refining', JSON.stringify(sync));
  ok('a status that does not, moves it', sync.moved === 'published', JSON.stringify(sync));

  console.log('\n4. the board fits on the screen');
  const fit = await page.evaluate(() => { const b = document.querySelector('.ct-board');
    return {sw:b.scrollWidth, cw:b.clientWidth, page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1}; });
  ok('all eight columns, no horizontal scroll', fit.sw <= fit.cw + 1 && !fit.page, JSON.stringify(fit));

  console.log('\n5. the four views');
  for(const [k, v] of [['2','calendar'],['3','library'],['4','stats'],['1','pipeline']]){
    await page.keyboard.press(k); await page.waitForTimeout(450);
    const got = await page.evaluate(() => ({v: contentView(),
      body: !!document.querySelector('#ctBody')?.firstElementChild,
      over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1}));
    ok(`${k} → ${v}, drawn and within the page`, got.v === v && got.body && !got.over, JSON.stringify(got));
  }
  const next = await page.evaluate(() => { contentSetView('calendar'); return null; });
  await page.waitForTimeout(500);
  ok('the calendar carries "what to send out next"',
     await page.evaluate(() => document.querySelectorAll('.ct-nextpanel .ct-nrow').length > 0), 'panel empty');
  await page.evaluate(() => contentSetView('pipeline')); await page.waitForTimeout(450);

  console.log('\n6. the vault never invents a quotation');
  await page.evaluate(() => openQuoteBrowser(contentPieces()[0])); await page.waitForTimeout(500);
  /* checked against the vault's own data, not against the classes the
     renderer chose: a renderer that stopped marking paraphrases would
     otherwise make this test vacuously true */
  const vault = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.qb-row')];
    const find = q => rows.find(r => r.querySelector('.qb-text')?.textContent.includes(q.text.slice(0, 40)));
    const paras = S.contentVault.quotes.filter(q => q.paraphrase);
    const quotes = S.contentVault.quotes.filter(q => !q.paraphrase);
    const bad = {quotedPara: [], unlabelledPara: [], unquoted: []};
    paras.forEach(q => { const r = find(q); if(!r) return;
      if(r.querySelector('.qb-text').textContent.trim().startsWith('“')) bad.quotedPara.push(q.text.slice(0, 30));
      if(!r.querySelector('.qb-para')) bad.unlabelledPara.push(q.text.slice(0, 30)); });
    quotes.forEach(q => { const r = find(q); if(!r) return;
      if(!r.querySelector('.qb-text').textContent.trim().startsWith('“')) bad.unquoted.push(q.text.slice(0, 30)); });
    return {rows:rows.length, nPara:paras.length, nQuote:quotes.length, bad};
  });
  ok('the vault is browsable', vault.rows >= 40 && vault.nPara > 10 && vault.nQuote > 20, JSON.stringify({r:vault.rows, p:vault.nPara, q:vault.nQuote}));
  ok('every quoted passage wears quotation marks', !vault.bad.unquoted.length, JSON.stringify(vault.bad.unquoted));
  ok('no paraphrase ever does', !vault.bad.quotedPara.length, JSON.stringify(vault.bad.quotedPara));
  ok('and every paraphrase says it is a summary', !vault.bad.unlabelledPara.length, JSON.stringify(vault.bad.unlabelledPara));
  await page.evaluate(() => document.querySelector('[data-qbpin]').click()); await page.waitForTimeout(350);
  const carried = await page.evaluate(() => { const q = contentPieces()[0].extra.content.quotes.slice(-1)[0];
    return {has: 'paraphrase' in q, src: q.sourceType}; });
  ok('the label travels with a pinned passage', carried.has && carried.src === 'book_vault_quote', JSON.stringify(carried));
  await page.evaluate(() => closeModals()); await page.waitForTimeout(250);

  console.log('\n7. catching a thought');
  await go();
  await page.keyboard.press('i'); await page.waitForTimeout(400);
  await page.fill('#ccRaw', 'A sentence I do not want to lose.');
  await page.fill('#ccTitle', 'The thing about losing sentences');
  await page.evaluate(() => document.querySelector('#ccSave').click());
  await page.waitForTimeout(700); await clean();
  const caught = await page.evaluate(() => { const e = contentPieces().find(x => x.title === 'The thing about losing sentences');
    return e ? {stage:e.extra.content.stage, notes:(e.extra.scratchpad || '').length,
      onBoard: !!document.querySelector(`[data-ctcard="${e.id}"]`), id:e.id} : null; });
  ok('it lands in Idea and appears on the board', caught && caught.stage === 'idea' && caught.onBoard, JSON.stringify(caught));
  ok('the raw thought becomes the piece\'s notes', caught && caught.notes > 0, JSON.stringify(caught));

  console.log('\n8. dropping a card moves it');
  const dropped = await page.evaluate(id => { const card = document.querySelector(`[data-ctcard="${id}"]`);
    const col = document.querySelector('[data-ctcol="outline"]'); if(!card || !col) return {stage:'NO CARD'};
    card.dispatchEvent(new DragEvent('dragstart', {bubbles:true, dataTransfer:new DataTransfer()}));
    col.dispatchEvent(new DragEvent('dragover', {bubbles:true, dataTransfer:new DataTransfer()}));
    col.dispatchEvent(new DragEvent('drop', {bubbles:true, dataTransfer:new DataTransfer()}));
    const e = contentPiece(id); return {stage:e.extra.content.stage, ws:e.extra.status}; }, caught.id);
  await page.waitForTimeout(400); await clean();
  ok('the drop sets the stage and the Studio status',
     dropped.stage === 'outline' && dropped.ws === 'Outlining', JSON.stringify(dropped));

  console.log('\n9. the bridge from the Journals');
  const jid = await page.evaluate(() => {
    const mk = (title, body) => { const e = {id:uid(), type:'reflection', title, body, occurredAt:today(),
      createdAt:new Date().toISOString(), media:[], links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]},
      people:[], places:[], emotions:[], tags:[], confidence:'', extra:{}}; S.entries.push(e); return e.id; };
    const long = mk('A long enough reflection', Array.from({length:70},(_,i)=>'word'+i).join(' '));
    const short = mk('A short one', 'Only a handful of words today.');
    saveNow(); return {long, short};
  });
  await page.evaluate(() => { location.hash = '#/journals'; rerender(); }); await page.waitForTimeout(1000); await clean();
  const jb = await page.evaluate(i => ({
    long: !!document.querySelector(`[data-entry="${i.long}"] [data-ctseed]`),
    short: !!document.querySelector(`[data-entry="${i.short}"] [data-ctseed]`)}), jid);
  ok('a substantial reflection is offered the bridge', jb.long, JSON.stringify(jb));
  ok('a two-line one is left alone', !jb.short, JSON.stringify(jb));

  await page.evaluate(i => document.querySelector(`[data-entry="${i.long}"] [data-ctdismiss]`).click(), jid);
  await page.waitForTimeout(250);
  await page.evaluate(() => rerender()); await page.waitForTimeout(800);
  ok('refusing it is remembered', await page.evaluate(i =>
     !document.querySelector(`[data-entry="${i.long}"] [data-ctseed]`) && S.content.dismissedPrompts.includes(i.long), jid),
     'the prompt came back');

  await page.evaluate(() => { S.content.dismissedPrompts = []; saveNow(); rerender(); }); await page.waitForTimeout(800);
  await page.evaluate(i => document.querySelector(`[data-entry="${i.long}"] [data-ctseed]`).click(), jid);
  await page.waitForTimeout(500);
  const pre = await page.evaluate(() => ({title:document.querySelector('#ccTitle')?.value,
    raw:(document.querySelector('#ccRaw')?.value || '').slice(0, 5),
    spark:document.querySelector('#ccSpark')?.value}));
  ok('the catcher opens pre-filled from the entry',
     pre.title === 'A long enough reflection' && pre.raw === 'word0' && /Promoted from reflection/.test(pre.spark || ''), JSON.stringify(pre));
  await page.evaluate(() => document.querySelector('#ccSave').click()); await page.waitForTimeout(700); await clean();
  const made = await page.evaluate(i => { const e = contentPieces().find(x => x.title === 'A long enough reflection');
    return e ? {linked:e.extra.content.linked.length, to:e.extra.content.linked[0]?.sourceId === i.long,
      trail:e.extra.content.trail.length} : null; }, jid);
  ok('a seed is made, linked back to the entry and carrying its trail',
     made && made.linked === 1 && made.to && made.trail === 1, JSON.stringify(made));

  await page.evaluate(() => { location.hash = '#/journals'; rerender(); }); await page.waitForTimeout(900); await clean();
  const backref = await page.evaluate(i => { const n = document.querySelector(`[data-entry="${i.long}"] .ct-bridge`);
    return {used:n?.classList.contains('used'), asks:!!n?.querySelector('[data-ctseed]')}; }, jid);
  ok('the entry now shows what it became, and stops asking',
     backref.used && !backref.asks, JSON.stringify(backref));

  console.log('\n10. the bridge from the Library follows resonance');
  const mid = await page.evaluate(() => { const m = (S.entries || []).find(e => e.type === 'media');
    if(!m) return null; m.extra.resonanceLevel = 'changed'; m.extra.installed = 'It rearranged how I read.'; saveNow(); return m.id; });
  if(mid){
    await page.evaluate(() => { location.hash = '#/commonplace'; rerender(); }); await page.waitForTimeout(900);
    await page.evaluate(id => openMediaPanel(id), mid); await page.waitForTimeout(500);
    ok('a work that changed you is offered the bridge',
       await page.evaluate(() => !!document.querySelector('#panel [data-ctseed]')), 'no prompt');
    await page.evaluate(id => { byId(S.entries, id).extra.resonanceLevel = 'passed'; saveNow(); closePanel(); openMediaPanel(id); }, mid);
    await page.waitForTimeout(450);
    ok('one that merely passed through is not',
       await page.evaluate(() => !document.querySelector('#panel [data-ctseed]')), 'prompted anyway');
    await page.evaluate(() => closePanel());
  } else ok('a media entry exists to test with', false, 'none in the starter set');

  console.log('\n11. reachable from anywhere');
  await page.evaluate(() => { closeModals(); openSpeedDial(); }); await page.waitForTimeout(300);
  ok('"Content idea" sits in the speed dial', await page.evaluate(() =>
     [...document.querySelectorAll('#speedDial .sd-act')].some(b => /Content idea/.test(b.textContent))), 'not offered');

  console.log('\nconsole:', errors.length ? errors.slice(0, 6) : 'clean');
  if(errors.length) fails += errors.length;
  console.log(fails ? `\n${fails} FAILED` : '\nall good');
  await browser.close(); process.exit(fails ? 1 : 0);
})();
