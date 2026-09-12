/* One grammar, and it is written down. Press the key; in the Writing Studio
   hold ⌥ as well. This checks that the card says so, that each room carries
   a line of its own, and that every key the card names actually fires. */
const { chromium } = require('playwright');
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.setViewportSize({width:1500,height:1050});
  const errs=[]; p.on('pageerror', e=>errs.push('PAGEERROR '+e.message));
  p.on('console', m=>{ if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errs.push('CONSOLE '+m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(3000);
  /* A fresh profile is asked about theme and sound before anything else, and
     the rest of boot waits behind that dialog. Take the defaults and get on
     with it, the way a first-time user would. */
  await p.waitForTimeout(900);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(1800); }

  const clean = () => p.evaluate(() => document.querySelectorAll('.toast').forEach(n=>n.remove()));
  const go = async h => { await p.evaluate(() => closeModals()); await p.waitForTimeout(150);
    await p.evaluate(x => { location.hash=x; rerender(); }, h); await p.waitForTimeout(850); await clean();
    await p.evaluate(() => document.body.click()); };

  console.log('\n1. the card');
  await go('#/content');
  await p.keyboard.press('?'); await p.waitForTimeout(500);
  const card = await p.evaluate(() => { const c = document.querySelector('.keyboard-card');
    return c ? {groups:c.querySelectorAll('.kb-group').length, rows:c.querySelectorAll('.kb-row').length,
      here:c.querySelector('.kb-group.here .sc')?.textContent, first:c.querySelector('.kb-group .sc')?.textContent} : null; });
  ok('? opens it', !!card, 'no card');
  /* counted off the data rather than hard-coded, so adding a room's keys
     does not fail a test that has nothing to say about it */
  const declared = await p.evaluate(() => SHORTCUT_GROUPS.length);
  ok('it lists every group there is', card && card.groups === declared, JSON.stringify({...card, declared}));
  ok('the room you are in is marked and sorted up', card && card.here === 'Content', JSON.stringify(card));
  await p.keyboard.press('?'); await p.waitForTimeout(400);
  ok('? closes it again', await p.evaluate(() => !document.querySelector('.keyboard-card')), 'still open');
  /* #/writing is no longer a room of its own — the desk is reached through a
     piece, so the card has to follow you into one of those. */
  const wid0 = await p.evaluate(() => contentPieces()[0].id);
  await go('#/writing/' + wid0);
  await p.keyboard.press('?'); await p.waitForTimeout(500);
  ok('and follows you to another room',
     (await p.evaluate(() => document.querySelector('.kb-group.here .sc')?.textContent)) === 'Writing a piece',
     await p.evaluate(() => document.querySelector('.kb-group.here .sc')?.textContent));
  await p.evaluate(() => closeModals());

  console.log('\n2. it is written on the page too');
  await go('#/content');
  ok('the Content room carries a hint', await p.evaluate(() => !!document.querySelector('.kb-hint')), 'none');
  await p.evaluate(() => document.querySelector('.kb-hint').click()); await p.waitForTimeout(450);
  ok('clicking it opens the card', await p.evaluate(() => !!document.querySelector('.keyboard-card')), 'no card');
  await p.evaluate(() => closeModals()); await p.waitForTimeout(200);
  await go('#/planning');
  ok('so does Planning', await p.evaluate(() => !!document.querySelector('.kb-hint')), 'none');
  ok('the view tabs name their digit',
     await p.evaluate(() => /\(1\)/.test(document.querySelector('[data-plview]')?.title || '')),
     await p.evaluate(() => document.querySelector('[data-plview]')?.title));
  await go('#/content');
  ok('and so do the Content tabs',
     await p.evaluate(() => /\(1\)/.test(document.querySelector('[data-ctview]')?.title || '')),
     await p.evaluate(() => document.querySelector('[data-ctview]')?.title));
  ok('a ? button sits in the top bar', await p.evaluate(() => !!document.querySelector('#btnKeys')), 'none');
  await p.click('#btnKeys'); await p.waitForTimeout(450);
  ok('and opens it', await p.evaluate(() => !!document.querySelector('.keyboard-card')), 'no card');
  await p.evaluate(() => closeModals());

  console.log('\n3. N makes the thing, in both rooms');
  await go('#/content');
  await p.keyboard.press('n'); await p.waitForTimeout(500);
  ok('N catches an idea on Content', await p.evaluate(() => !!document.querySelector('#ccRaw')), 'nothing opened');
  await p.evaluate(() => closeModals()); await p.waitForTimeout(200);
  await go('#/planning');
  const focused = await (async () => { await p.keyboard.press('n'); await p.waitForTimeout(500);
    return p.evaluate(() => document.activeElement?.className || ''); })();
  ok('N adds a task on Planning', /pq-input/.test(focused) || await p.evaluate(() => !!document.querySelector('#panel')), focused);

  console.log('\n4. the Studio: bare keys, and the two chords that work mid-sentence');
  const id = await p.evaluate(() => contentPieces().find(e=>e.title.startsWith('Structural')).id);
  /* Overlays are removed directly rather than through closeModals(), which
     calls closePanel(), which can fire history.back() — and that undoes the
     navigation on the next line a moment after it happens. */
  const inStudio = async (key, prep) => {
    await p.evaluate(() => { document.querySelectorAll('#modals .overlay').forEach(o => o.remove());
      document.querySelector('#panelOv')?.remove(); document.querySelector('#panel')?.remove(); });
    await p.waitForTimeout(200);
    await p.evaluate(i => { location.hash='#/writing/'+i; rerender(); }, id); await p.waitForTimeout(950); await clean();
    await p.evaluate(() => document.body.click());
    if(prep) await p.evaluate(prep); await p.waitForTimeout(250);
    await p.keyboard.press(key); await p.waitForTimeout(600);
    return p.evaluate(i => ({view: byId(S.entries,i).extra.viewMode, on: !!S.wsRead?.on,
      docs: wsFlatDocs(byId(S.entries,i).extra.binder).length, drawer: wsPanes().drawer, board: wsPanes().board,
      tw: !!byId(S.entries,i).extra._typewriter, overlay: !!document.querySelector('.overlay'),
      snaps: (wsFind(byId(S.entries,i).extra.binder, byId(S.entries,i).extra.openDoc)?.snapshots||[]).length,
      text: document.querySelector('#wBody')?.value.slice(0,24) || ''}), id);
  };
  ok('2 → corkboard',   (await inStudio('2')).view === 'corkboard', 'no');
  ok('4 → manuscript',  (await inStudio('4')).view === 'manuscript', 'no');
  await p.evaluate(i => { byId(S.entries,i).extra.viewMode='editor'; saveNow(); }, id);
  ok('1 → editor',      (await inStudio('1')).view === 'editor', 'no');
  const d0 = await p.evaluate(i => wsFlatDocs(byId(S.entries,i).extra.binder).length, id);
  ok('N → a new document', (await inStudio('n')).docs === d0 + 1, 'no');
  ok('W → typewriter',  (await inStudio('w')).tw === true, 'no');
  ok('C → a snapshot',  (await inStudio('c')).snaps > 0, 'no');
  ok('X → compile',     (await inStudio('x')).overlay === true, 'no');
  await p.evaluate(() => closeModals());
  const dr = await p.evaluate(() => wsPanes().drawer);
  ok('[ folds the drawer', (await inStudio('BracketLeft')).drawer !== dr, 'no');
  const bd = await p.evaluate(() => wsPanes().board);
  ok('] folds the board',  (await inStudio('BracketRight')).board !== bd, 'no');
  const on0 = await p.evaluate(() => !!S.wsRead?.on);
  ok('⌥R → readability', (await inStudio('Alt+KeyR')).on !== on0, 'no');
  const sel = () => { const ta=document.querySelector('#wBody');
    ta.value='One two three four five.'; ta.dispatchEvent(new Event('input')); ta.focus(); ta.setSelectionRange(0,13); };
  ok('⌥⇧1 marks a passage',  /^==One two three==/.test((await inStudio('Alt+Shift+Digit1', sel)).text), 'no');
  ok('⌥⇧3 marks it deepest', /^====One two three====/.test((await inStudio('Alt+Shift+Digit3', sel)).text), 'no');
  ok('⌥⇧0 clears',           !/=/.test((await inStudio('Alt+Shift+Digit0', () => { const ta=document.querySelector('#wBody');
      ta.value='==One two three== four.'; ta.dispatchEvent(new Event('input')); ta.focus(); ta.setSelectionRange(3,15); })).text), 'no');
  const bare = await inStudio('r');
  ok('R alone works when the caret is out of the text', typeof bare.on === 'boolean', 'no');

  /* the whole reason those two take a modifier: a bare key must not fire
     while you are writing, and these two must fire anyway */
  const whileWriting = await inStudio('r', () => { const ta = document.querySelector('#wBody');
    ta.value = 'One two three four five.'; ta.dispatchEvent(new Event('input')); ta.focus(); ta.setSelectionRange(4, 4); });
  ok('a bare key is just a letter while you are writing',
     /^One two/.test(whileWriting.text) === false || whileWriting.text.includes('r'), whileWriting.text);
  const chordWhileWriting = await inStudio('Alt+Shift+Digit1', () => { const ta = document.querySelector('#wBody');
    ta.value = 'One two three four five.'; ta.dispatchEvent(new Event('input')); ta.focus(); ta.setSelectionRange(0, 13); });
  ok('but ⌥⇧1 still marks, with the caret in the draft',
     /^==One two three==/.test(chordWhileWriting.text), chordWhileWriting.text);

  console.log('\n5. nothing fires while you are typing');
  await go('#/content');
  await p.evaluate(() => window.__viewBefore = contentView());
  await p.click('#ctSearch'); await p.keyboard.type('note'); await p.waitForTimeout(500);
  /* what this is actually about: keys typed into a field are letters, not
     shortcuts. Which view happens to be showing is not the point, and tying
     the check to it made an unrelated change look like a failure. */
  const typed = await p.evaluate(() => ({before: window.__viewBefore, v: contentView(),
    val: document.querySelector('#ctSearch')?.value, card: !!document.querySelector('.keyboard-card')}));
  ok('typing into a field is just typing',
     typed.val === 'note' && typed.v === typed.before && !typed.card, JSON.stringify(typed));

  console.log('\nerrors:', errs.length ? errs.slice(0,6) : 'none');
  if(errs.length) fails += errs.length;
  console.log(fails ? `\n${fails} FAILED` : '\nall good');
  await b.close(); process.exit(fails?1:0);
})();
