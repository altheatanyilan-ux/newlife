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

  console.log('\n12. the desk knows which piece it is writing');
  const pid = await page.evaluate(() => contentPieces().find(e => e.title.startsWith('The Self-Image')).id);
  await page.evaluate(i => { location.hash = '#/writing/' + i; rerender(); }, pid);
  await page.waitForTimeout(1100); await clean();
  const bar = await page.evaluate(() => { const n = document.querySelector('.ws-piecebar');
    return n ? {text:n.textContent.replace(/\s+/g, ' ').trim(), stage:!!n.querySelector('#wpbStage'), back:!!n.querySelector('#wpbBack')} : null; });
  ok('a context bar names the piece, kind, stage, words and destination',
     bar && /Self-Image/.test(bar.text) && /Essay/.test(bar.text) && /800 \/ 2,500 words/.test(bar.text)
       && /Substack/.test(bar.text) && bar.stage && bar.back, JSON.stringify(bar));
  await page.evaluate(() => document.querySelector('#wpbStage').click()); await page.waitForTimeout(400);
  await page.evaluate(() => { const b = [...document.querySelectorAll('.overlay button')].find(x => /Refining/.test(x.textContent)); b && b.click(); });
  await page.waitForTimeout(700); await clean();
  const advanced = await page.evaluate(i => { const e = byId(S.entries, i);
    return {stage:e.extra.content.stage, ws:e.extra.status, bar:document.querySelector('.ws-piecebar')?.textContent.replace(/\s+/g, ' ')}; }, pid);
  ok('the pipeline can be advanced without leaving the desk',
     advanced.stage === 'refining' && advanced.ws === 'Drafting' && /Refining/.test(advanced.bar || ''), JSON.stringify(advanced));

  console.log('\n13. the drawer reaches the vault, and the heap reaches the pipeline');
  const shelf = await page.evaluate(() => { const d = [...document.querySelectorAll('#drawer details')].find(x => /from the vault/.test(x.textContent));
    if(!d) return null; d.open = true;
    return {rows:d.querySelectorAll('.vault-item').length, paras:d.querySelectorAll('.vault-para').length,
      flags:d.querySelectorAll('.vault-flag').length,
      quotedParas:[...d.querySelectorAll('.vault-para')].filter(n => n.textContent.trim().startsWith('“')).length}; });
  ok('the vault shelf matches passages to the piece\'s themes', shelf && shelf.rows > 0, JSON.stringify(shelf));
  ok('and holds the paraphrase rule there too',
     shelf && shelf.quotedParas === 0 && shelf.flags === shelf.paras, JSON.stringify(shelf));
  const grew = await page.evaluate(() => { const ta = document.querySelector('#wBody'); const was = ta.value.length;
    const d = [...document.querySelectorAll('#drawer details')].find(x => /from the vault/.test(x.textContent));
    d.open = true; d.querySelector('[data-vpull]').click();
    const lines = ta.value.split('\n').filter(l => l.startsWith('>'));
    return {was, now:ta.value.length, quoted:lines.length, cite:lines.find(l => l.includes('—')) || ''}; });
  await page.waitForTimeout(400); await clean();
  ok('a passage pulls into the draft as an attributed blockquote',
     grew.now > grew.was && grew.quoted >= 2 && /—/.test(grew.cite), JSON.stringify(grew));

  await page.evaluate(() => { addCompost('A line I overheard and could not place.', ['craft']);
    location.hash = '#/writing/compost'; rerender(); });
  await page.waitForTimeout(900); await clean();
  ok('every compost fragment offers a way to Content',
     await page.evaluate(() => document.querySelectorAll('[data-cpromote]').length > 0), 'no promote buttons');
  await page.evaluate(() => document.querySelector('[data-cpromote]').click()); await page.waitForTimeout(500);
  const fromHeap = await page.evaluate(() => ({raw:document.querySelector('#ccRaw')?.value,
    spark:document.querySelector('#ccSpark')?.value}));
  ok('and carries the fragment into the catcher',
     /overheard/.test(fromHeap.raw || '') && /compost heap/.test(fromHeap.spark || ''), JSON.stringify(fromHeap));
  await page.evaluate(() => closeModals()); await page.waitForTimeout(250);

  await page.evaluate(() => { closeModals(); location.hash = '#/content'; rerender(); });
  await page.waitForTimeout(1000); await clean();

  console.log('\n14. a seed that has sat too long says so');
  const germ = await page.evaluate(() => {
    const old = contentPieces().find(e => e.extra.content.stage === 'idea');
    const fresh = contentNewPiece({stage:'idea', raw:'Caught just now.'});
    old.extra.content.stageAt = new Date(Date.now() - 20*864e5).toISOString();
    saveNow(); rerender();
    return {old:old.id, fresh:fresh.id};
  });
  await page.waitForTimeout(800); await clean();
  const shown = await page.evaluate(i => ({
    old: !!document.querySelector(`[data-ctcard="${i.old}"] .ct-germ`),
    fresh: !!document.querySelector(`[data-ctcard="${i.fresh}"] .ct-germ`)}), germ);
  ok('a twenty-day-old idea is asked about', shown.old, JSON.stringify(shown));
  ok('one caught today is left alone', !shown.fresh, JSON.stringify(shown));

  console.log('\n15. the themes can be curated');
  await page.evaluate(() => document.querySelector('#ctThemes').click()); await page.waitForTimeout(450);
  const tm = await page.evaluate(() => ({rows:document.querySelectorAll('.ct-themerow').length,
    add:!!document.querySelector('#tmAdd'), colour:!!document.querySelector('[data-tmcol]')}));
  ok('every theme is listed, with its colour', tm.rows === 12 && tm.colour, JSON.stringify(tm));
  await page.fill('#tmNew', 'Solitude');
  await page.evaluate(() => document.querySelector('#tmAdd').click()); await page.waitForTimeout(500);
  ok('a new one can be added', await page.evaluate(() => S.content.themes.some(t=>t.name==='Solitude')), 'not added');
  const renamed = await page.evaluate(async () => {
    const t = S.content.themes.find(x=>x.name==='Solitude');
    const inp = document.querySelector(`[data-tmname="${t.id}"]`);
    inp.value = 'Being alone'; inp.dispatchEvent(new Event('input'));
    await new Promise(r=>setTimeout(r,600));
    return S.content.themes.find(x=>x.id===t.id).name; });
  ok('and renamed', renamed === 'Being alone', renamed);

  console.log('\n16. deleting a theme in use asks first, and takes it off the pieces');
  const del = await page.evaluate(async () => {
    const used = S.content.themes.find(t => contentThemeUse(t.id) > 0);
    const n = contentThemeUse(used.id);
    document.querySelector(`[data-tmdel="${used.id}"]`).click();
    await new Promise(r=>setTimeout(r,350));
    const asked = !!document.querySelector('[data-x=yes]');
    if(asked) document.querySelector('[data-x=yes]').click();
    await new Promise(r=>setTimeout(r,500));
    return {n, asked, gone: !S.content.themes.some(t=>t.id===used.id),
      onPieces: contentPieces().filter(e=>e.extra.content.themes.includes(used.id)).length};
  });
  ok('it asks before deleting a theme pieces are using', del.asked && del.n > 0, JSON.stringify(del));
  ok('and takes it off every piece that carried it', del.gone && del.onPieces === 0, JSON.stringify(del));
  await page.evaluate(() => closeModals()); await page.waitForTimeout(300);

  console.log('\n17. a focus session on a piece\'s task counts as time on the piece');
  const focus = await page.evaluate(() => {
    const e = contentPieces().find(x => x.title.startsWith('The Self-Image'));
    const before = e.extra.content.focusMinutes || 0;
    const t = newPlanTask('Write: the self-image piece', today(), {listId:'inbox'});
    t.links.content = [e.id]; S.tasks.push(t); saveNow();
    FocusTimer.setTask(t.id); FocusTimer.start(); FocusTimer.pause();
    /* No test hook: the timer measures the phase length minus what is left,
       so lengthening the phase after starting is the same arithmetic as
       having sat there for the difference. */
    planState().timer.focusDuration = 55;
    FocusTimer.skip();
    return {before, after: e.extra.content.focusMinutes || 0,
      onTask: (byId(S.tasks, t.id).focusTime || 0),
      sessions: planState().focusSessions.length};
  });
  ok('the minutes land on the piece as well as the task',
     focus.after > focus.before && focus.onTask > 0, JSON.stringify(focus));

  console.log('\n18. leaving the panel for the desk actually arrives');
  const id = await page.evaluate(() => contentPieces().find(e => e.title.startsWith('The Self-Image')).id);
  await page.evaluate(() => { location.hash='#/today'; }); await page.waitForTimeout(700);
  await page.evaluate(() => { location.hash='#/content'; }); await page.waitForTimeout(900);
  await page.evaluate(i => openPieceDetail(i), id); await page.waitForTimeout(600);
  ok('the panel is open over Content', await page.evaluate(() => !!document.querySelector('#panel')), 'no panel');
  await page.click('#pcOpen'); await page.waitForTimeout(1100);
  ok('the button lands on the desk', /#\/writing\//.test(await page.evaluate(() => location.hash)), await page.evaluate(()=>location.hash));
  ok('and the panel is gone', await page.evaluate(() => !document.querySelector('#panel')), 'panel still up');

  await page.goBack(); await page.waitForTimeout(1000);
  const h1 = await page.evaluate(() => location.hash);
  ok('Back returns to Content, not into the panel', h1 === '#/content', h1);
  ok('with no panel hanging over it', await page.evaluate(() => !document.querySelector('#panel')), 'panel reappeared');
  await page.goBack(); await page.waitForTimeout(900);
  const h2 = await page.evaluate(() => location.hash);
  ok('Back again reaches the page before that', h2 === '#/today', h2);
  await page.goForward(); await page.waitForTimeout(900);
  ok('Forward works too', (await page.evaluate(() => location.hash)) === '#/content', await page.evaluate(()=>location.hash));

  console.log('\n  closing a panel normally still works');
  await page.evaluate(() => { location.hash='#/content'; }); await page.waitForTimeout(800);
  await page.evaluate(i => openPieceDetail(i), id); await page.waitForTimeout(600);
  await page.evaluate(() => closePanel()); await page.waitForTimeout(700);
  ok('closePanel leaves you on Content', (await page.evaluate(() => location.hash)) === '#/content', await page.evaluate(()=>location.hash));
  ok('and takes the panel down', await page.evaluate(() => !document.querySelector('#panel')), 'still up');

  console.log('\n19. every shortcut this room documents');
  const press = async (key, probe, setup) => {
    await page.evaluate(() => closeModals()); await page.waitForTimeout(150);
    await page.evaluate(() => { location.hash = '#/content'; rerender(); }); await page.waitForTimeout(800);
    await clean(); await page.evaluate(() => document.body.click());
    if(setup) await page.evaluate(setup); await page.waitForTimeout(200);
    const was = await page.evaluate(probe);
    await page.keyboard.press(key); await page.waitForTimeout(600);
    return {was, now: await page.evaluate(probe)};
  };
  for(const [key, want, probe, setup] of [
    ['n', 'the catcher opens',        () => !!document.querySelector('#ccRaw'), null],
    ['i', 'the catcher, by its old key', () => !!document.querySelector('#ccRaw'), null],
    ['2', 'calendar',                 () => contentView(), null],
    ['3', 'the shelf',                () => contentView(), () => contentSetView('pipeline')],
    ['4', 'the numbers',              () => contentView(), () => contentSetView('pipeline')],
    ['1', 'the pipeline',             () => contentView(), () => contentSetView('stats')],
    ['w', 'the Writing Studio',       () => location.hash, null],
  ]){ const r = await press(key, probe, setup);
    ok(`${key} reaches ${want}`, r.was !== r.now, JSON.stringify(r)); }

  /* ⌘K belongs to the omni-search everywhere. The page used to focus its own
     field too, without stopping the event, so both happened. */
  await page.evaluate(() => closeModals()); await page.waitForTimeout(200);
  await page.evaluate(() => { location.hash = '#/content'; rerender(); }); await page.waitForTimeout(800);
  await clean(); await page.evaluate(() => document.body.click());
  await page.keyboard.press('Control+k'); await page.waitForTimeout(700);
  const pal = await page.evaluate(() => ({open: !!document.querySelector('#palQ'),
    focused: document.activeElement?.id || ''}));
  ok('⌘K opens the omni-search, and only that', pal.open && pal.focused === 'palQ', JSON.stringify(pal));
  await page.evaluate(() => { const q = document.querySelector('#palQ');
    q.value = 'Self-Image'; q.dispatchEvent(new Event('input')); });
  await page.waitForTimeout(500);
  const found = await page.evaluate(() => { const rows = [...document.querySelectorAll('#palRes .res')];
    const r = rows.find(x => /Self-Image/.test(x.textContent));
    return r ? {label:r.querySelector('.m')?.textContent || ''} : null; });
  ok('it finds a piece and says where in the pipeline it is',
     found && /piece/.test(found.label), JSON.stringify(found));
  await page.evaluate(() => { const r = [...document.querySelectorAll('#palRes .res')].find(x => /Self-Image/.test(x.textContent)); r && r.click(); });
  await page.waitForTimeout(900);
  ok('and opens it on the desk, not in a journal',
     /^#\/writing\//.test(await page.evaluate(() => location.hash)), await page.evaluate(() => location.hash));
  await page.evaluate(() => closeModals());

  console.log('\n20. and the ones in the Writing Studio');
  const wid = await page.evaluate(() => contentPieces().find(e => e.title.startsWith('Structural')).id);
  const inStudio = async (key, prep) => {
    await page.evaluate(i => { location.hash = '#/writing/' + i; rerender(); }, wid);
    await page.waitForTimeout(900); await clean();
    if(prep) await page.evaluate(prep); await page.waitForTimeout(300);
    await page.keyboard.press(key); await page.waitForTimeout(600);
    return page.evaluate(() => ({on: !!S.wsRead?.on, text: document.querySelector('#wBody')?.value.slice(0, 24) || ''}));
  };
  const sel = () => { const ta = document.querySelector('#wBody');
    ta.value = 'One two three four five.'; ta.dispatchEvent(new Event('input'));
    ta.focus(); ta.setSelectionRange(0, 13); };
  /* ev.key is the character a key would type, and shift turns the number row
     into !"£$ — so these chords have to be read off ev.code, which names the
     physical key. Reading ev.key made every one of them do nothing. */
  ok('⌥⇧1 marks a passage',       /^==One two three==/.test((await inStudio('Alt+Shift+Digit1', sel)).text), 'no mark');
  ok('⌥⇧2 marks it deeper',       /^===One two three===/.test((await inStudio('Alt+Shift+Digit2', sel)).text), 'no mark');
  ok('⌥⇧3 marks it deepest',      /^====One two three====/.test((await inStudio('Alt+Shift+Digit3', sel)).text), 'no mark');
  const cleared = await inStudio('Alt+Shift+Digit0', () => { const ta = document.querySelector('#wBody');
    ta.value = '==One two three== four.'; ta.dispatchEvent(new Event('input')); ta.focus(); ta.setSelectionRange(3, 15); });
  ok('⌥⇧0 takes the marks off',   !/=/.test(cleared.text), cleared.text);
  const before = await page.evaluate(() => !!S.wsRead?.on);
  ok('⌥R toggles readability',   (await inStudio('Alt+KeyR')).on !== before, 'unchanged');

  console.log('\nconsole:', errors.length ? errors.slice(0, 6) : 'clean');
  if(errors.length) fails += errors.length;
  console.log(fails ? `\n${fails} FAILED` : '\nall good');
  await browser.close(); process.exit(fails ? 1 : 0);
})();
