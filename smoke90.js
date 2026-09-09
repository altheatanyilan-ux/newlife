/* The Writing Studio's reading layers: Hemingway's measurements painted on
   a mirror behind the textarea, Forte's three passes of progressive
   summarization, and the distillation they make possible. */
const { chromium } = require('playwright');
let fails = 0;
const ok = (n, cond, detail) => { console.log((cond ? '  ok   ' : '  FAIL ') + n + (cond ? '' : '  — ' + detail)); if(!cond) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.setViewportSize({width:1500,height:1100});
  const errs=[]; p.on('pageerror', e=>errs.push('PAGEERROR '+e.message));
  p.on('console', m=>{ if(m.type()==='error' && !/ERR_CONNECTION/.test(m.text())) errs.push('CONSOLE '+m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(2900);
  const clean = () => p.evaluate(() => document.querySelectorAll('.toast').forEach(n=>n.remove()));

  console.log('\n1. the measurements');
  const stats = await p.evaluate(() => {
    const t = 'This is short. ' +
      'The committee, having reviewed the matter at some considerable length and in a spirit of ' +
      'collaboration that was widely admired by everyone who happened to be present in the room at ' +
      'the time, was subsequently persuaded that the proposal should be adopted without delay. ' +
      'He quickly and carelessly agreed. In order to proceed we must decide.';
    return wsReadStats(t);
  });
  ok('it counts sentences and words', stats.sentences === 4 && stats.words > 50, JSON.stringify(stats));
  ok('it finds the very long sentence', stats.hard === 1, 'hard=' + stats.hard);
  ok('it finds the passive construction', stats.passive >= 1, 'passive=' + stats.passive);
  ok('it finds the adverbs', stats.adverbs >= 2, 'adverbs=' + stats.adverbs);
  ok('it finds a phrase with a shorter form', stats.wordy >= 1, 'wordy=' + stats.wordy);
  ok('the grade is a plausible number', stats.grade > 4 && stats.grade < 40, 'grade=' + stats.grade);
  const marksIgnored = await p.evaluate(() => {
    const plain = wsReadStats('One two three four five.');
    const marked = wsReadStats('==One two== ===three=== ====four==== five.');
    return {plain:plain.words, marked:marked.words, sp:plain.sentences, sm:marked.sentences};
  });
  ok('the marks are never counted as words or sentence ends',
     marksIgnored.plain === marksIgnored.marked && marksIgnored.sp === marksIgnored.sm, JSON.stringify(marksIgnored));

  console.log('\n2. the overlay');
  const ov = await p.evaluate(() => {
    const html = wsOverlayHTML('==kept== ===core=== ====quote==== He walked slowly.', {readability:true, marks:true});
    return {l1:(html.match(/wsl1/g)||[]).length, l2:(html.match(/wsl2/g)||[]).length,
      l3:(html.match(/wsl3/g)||[]).length, adverb:(html.match(/wsr-adverb/g)||[]).length,
      escaped: !/<script/.test(wsOverlayHTML('<script>x</script>', {readability:false, marks:false}))};
  });
  ok('three layers paint as three marks', ov.l1===1 && ov.l2===1 && ov.l3===1, JSON.stringify(ov));
  ok('and readability paints on top of them', ov.adverb===1, JSON.stringify(ov));
  ok('the mirror escapes what it is given', ov.escaped, 'raw HTML reached the mirror');

  console.log('\n3. on the desk');
  const id = await p.evaluate(() => contentPieces().find(e=>e.title.startsWith('Structural')).id);
  await p.evaluate(i => { location.hash = '#/writing/'+i; rerender(); }, id); await p.waitForTimeout(1100); await clean();
  const off = await p.evaluate(() => ({mirror:!!document.querySelector('#wMirror'), on:S.wsRead?.on, marks:S.wsRead?.marks}));
  ok('the mirror is up when marking is on', off.mirror, JSON.stringify(off));
  await p.evaluate(() => document.querySelector('#wsReadBtn').click()); await p.waitForTimeout(700); await clean();
  const on = await p.evaluate(() => { const m = document.querySelector('#wMirror');
    return {on:S.wsRead.on, flags: m ? m.querySelectorAll('.wsr-hard,.wsr-dense,.wsr-passive,.wsr-adverb,.wsr-wordy').length : 0}; });
  ok('readability lights up the draft', on.on && on.flags > 0, JSON.stringify(on));

  console.log('\n4. the mirror lines up with the words');
  const geom = await p.evaluate(() => {
    const ta = document.querySelector('#wBody'), m = document.querySelector('#wMirror');
    const a = getComputedStyle(ta), b = getComputedStyle(m);
    const ra = ta.getBoundingClientRect(), rb = m.getBoundingClientRect();
    return {font: a.fontFamily === b.fontFamily && a.fontSize === b.fontSize && a.lineHeight === b.lineHeight,
      wrap: a.whiteSpace === b.whiteSpace,
      dx: Math.abs(ra.left - rb.left), dy: Math.abs(ra.top - rb.top), dw: Math.abs(ra.width - rb.width)};
  });
  ok('same face, size and leading', geom.font && geom.wrap, JSON.stringify(geom));
  ok('same box, to the pixel', geom.dx < 1.5 && geom.dy < 1.5 && geom.dw < 1.5, JSON.stringify(geom));

  console.log('\n5. the stats panel');
  await p.evaluate(() => { const b=[...document.querySelectorAll('[data-wsitab]')].find(x=>x.dataset.wsitab==='read'); b.click(); });
  await p.waitForTimeout(600);
  const panel = await p.evaluate(() => { const n = document.querySelector('.ws-readpanel');
    return n ? {rows:n.querySelectorAll('.wsr-row').length, text:n.textContent.replace(/\s+/g,' ')} : null; });
  ok('the panel lists grade, time, structure and the flags',
     panel && panel.rows >= 9 && /reading grade/.test(panel.text) && /passive voice/.test(panel.text), JSON.stringify(panel && panel.rows));

  console.log('\n6. marking a passage');
  const marked = await p.evaluate(() => {
    const ta = document.querySelector('#wBody');
    ta.focus(); ta.setSelectionRange(0, 14);
    const before = ta.value.slice(0, 20);
    wsApplyLayer(ta, 1);
    const after1 = ta.value.slice(0, 24);
    ta.setSelectionRange(2, 16); wsApplyLayer(ta, 0);
    return {before, after1, cleared: ta.value.slice(0, 20)};
  });
  ok('⌘⇧1 wraps the selection in two equals signs',
     /^==/.test(marked.after1) && marked.after1.includes('=='), JSON.stringify(marked));
  ok('and clearing takes them off again', marked.cleared === marked.before, JSON.stringify(marked));

  console.log('\n7. distilling');
  await p.evaluate(() => { const ta = document.querySelector('#wBody');
    ta.value = 'A first ordinary sentence that is not marked at all.\n\n==Something worth keeping.==\n\n===The core of it.===\n\n====The line I would quote.====';
    ta.dispatchEvent(new Event('input')); });
  await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelector('#wsDistilBtn').click()); await p.waitForTimeout(700); await clean();
  const d1 = await p.evaluate(() => ({rows:document.querySelectorAll('.wsd-row').length,
    text:document.querySelector('.ws-distil')?.textContent.replace(/\s+/g,' ')}));
  ok('layer 1 and above shows all three marked passages', d1.rows === 3, JSON.stringify(d1.rows));
  ok('and never the unmarked sentence', !/ordinary sentence/.test(d1.text||''), d1.text);
  await p.evaluate(() => document.querySelector('[data-wsdistil="3"]').click()); await p.waitForTimeout(600);
  const d3 = await p.evaluate(() => ({rows:document.querySelectorAll('.wsd-row').length,
    text:document.querySelector('.ws-distil')?.textContent}));
  ok('layer 3 shows only the line worth quoting',
     d3.rows === 1 && /would quote/.test(d3.text||''), JSON.stringify(d3.rows));
  await p.evaluate(() => document.querySelector('[data-wsdistil="0"]').click()); await p.waitForTimeout(600);

  console.log('\n8. the marks never leave the studio');
  const out = await p.evaluate(i => { const e = byId(S.entries, i);
    return {compiled: wsCompile(e), body: wsFlatDocs(wsBinder(e)).map(d=>d.body).join('')}; }, id);
  ok('the draft still carries its marks', /={2,4}/.test(out.body), 'marks lost from the draft');
  ok('but nothing compiled does', !/={2,4}/.test(out.compiled), out.compiled.slice(0,120));

  console.log('\n9. the streak');
  const streak = await p.evaluate(() => ({n: wsStreak(), shown: !!document.querySelector('.ws-streak')}));
  ok('the desk shows the streak it has counted', streak.n === 0 || streak.shown, JSON.stringify(streak));

  console.log('\nerrors:', errs.length ? errs.slice(0,6) : 'none');
  if(errs.length) fails += errs.length;
  console.log(fails ? `\n${fails} FAILED` : '\nall good');
  await b.close(); process.exit(fails?1:0);
})();
