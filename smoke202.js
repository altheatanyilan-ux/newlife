/* smoke202 — five things that were wrong with the score room.

   AN INVENTORY, NOT ONLY A SHELF. The shelf answers "what am I working on".
   It does not answer "what have I got", which is the question you ask when
   you are choosing what to pick up, or wondering whether the piece you
   imported in March is still here and how far you got. Projects and the Skill
   Tree both grew this section for that reason and this is the same shape.

   ONE PRESS TO LEAVE. The way back was an anchor with a click handler on it,
   which is two ways out at once: the handler cleared the score and redrew,
   the redraw read the id straight back out of the address it had not left
   yet, and only the anchor's own navigation actually took you anywhere. It
   looked like it needed pressing twice because it did.

   THE LABELS ARE NEVER REFUSED. There was a ceiling — past nine hundred note
   heads the layer said "too many notes on this page" and drew nothing. That
   is exactly backwards: the pieces where you most need to see the harmony are
   the thick ones, and a room that goes quiet when you ask it the hard
   question is a room you stop asking.

   READING MODE TAKES THE SCREEN. Hiding this room's own furniture still left
   the browser's — tabs, address bar, bookmarks — standing over a page of
   music on a tablet propped on the piano.

   AND THE STRIP STAYS AWAY. It woke on any pointer movement, so on a laptop
   it never stayed hidden: a mouse resting on a desk twitches. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* thick enough to have been refused: eight notes a bar over sixty bars is
   nearly five hundred heads, and two parts of it is a thousand */
const part = (id, clef, oct) => `<part id="${id}">${Array.from({length:110}, (_, i) =>
  `<measure number="${i+1}">${i === 0 ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key>
    <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>${clef}</sign><line>${clef === 'G' ? 2 : 4}</line></clef></attributes>` : ''}${
  ['C','D','E','F','G','A','B','C'].map(s =>
    `<note><pitch><step>${s}</step><octave>${oct}</octave></pitch><duration>1</duration><type>eighth</type></note>`).join('')
  }</measure>`).join('')}</part>`;
const THICK = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>A Thick One</work-title></work>
  <part-list><score-part id="P1"><part-name>Right</part-name></score-part>
    <score-part id="P2"><part-name>Left</part-name></score-part></part-list>
  ${part('P1','G',5)}${Array.from({length:1}, () =>
    `<part id="P2">${Array.from({length:110}, (_, i) =>
      `<measure number="${i+1}">${i === 0 ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>F</sign><line>4</line></clef></attributes>` : ''}${
      [['C',3],['E',3],['G',3]].map(([st, oc], k) =>
        `<note>${k ? '<chord/>' : ''}<pitch><step>${st}</step><octave>${oc}</octave></pitch><duration>8</duration><type>whole</type></note>`).join('')
      }</measure>`).join('')}</part>`).join('')}
</score-partwise>`;
const THIN = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>A Thin One</work-title><creator type="composer">Somebody</creator></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key>
    <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part>
</score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource|fullscreen|Fullscreen/i.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(1300);
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'A Thin One.musicxml')); }, THIN);
  await p.waitForTimeout(3000);
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'A Thick One.musicxml')); }, THICK);
  await p.waitForTimeout(6000);

  console.log('\n1. the inventory');
  await p.evaluate(() => { scoreUi().id = null; location.hash = '#/score'; rerender(); });
  await p.waitForTimeout(1400);
  const inv = await p.evaluate(() => ({
    there: !!document.querySelector('#scInv'),
    rows: [...document.querySelectorAll('.sc-invrow .sc-invname b')].map(n => n.textContent),
    count: (document.querySelector('#scInv .mono') || {}).textContent,
    filters: [...document.querySelectorAll('#scInv .filter-bar select')].map(n => n.id)}));
  yes('there is one', inv.there, JSON.stringify(inv));
  is('  with a row per score', inv.rows.length, 2);
  yes('  and it says how many of how many are shown', /2 of 2 shown/.test(inv.count || ''), inv.count);
  is('  search, how well you know it, standing, composer, period, shape and sort',
    inv.filters,
    ['scinvFam','scinvState','scinvComposer','scinvPeriod','scinvShape','scinvSort']);
  /* what the shelf shows as a picture, the inventory shows as a number */
  const row = await p.evaluate(() => {
    const x = scores().find(y => y.title === 'A Thin One');
    addScoreSection(x.id, {name:'All of it', startMeasure:1, endMeasure:1, status:'solid'});
    x.pins.push(scorePinDefaults({id:uid(), measure:1, text:'here'}));
    logScorePractice(x.id, x.sections[0].id, 45, {});
    saveNow(); rerender();
    return new Promise(r => setTimeout(() => r([...document.querySelectorAll('.sc-invrow')]
      .find(n => /A Thin One/.test(n.textContent)).textContent.replace(/\s+/g, ' ').trim()), 700));
  });
  yes('the standing is read off the sections rather than set by hand', /solid/.test(row), row);
  yes('  with the bars, the sections and what you have written on it',
    /1 bars/.test(row) && /1 section/.test(row) && /1 pin/.test(row), row);
  yes('  and the time you have put in', /45m/.test(row), row);
  const filtered = await p.evaluate(async () => {
    const sel = document.querySelector('#scinvShape');
    sel.value = 'never'; sel.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 700));
    const rows = [...document.querySelectorAll('.sc-invrow .sc-invname b')].map(n => n.textContent);
    document.querySelector('#scinvClear').click();
    await new Promise(r => setTimeout(r, 700));
    return {rows, after: document.querySelectorAll('.sc-invrow').length};
  });
  is('filtering to what you have never practised leaves the one', filtered.rows, ['A Thick One']);
  is('  and clearing brings them back', filtered.after, 2);

  console.log('\n2. one press back to the shelf');
  await p.evaluate(() => { const x = scores().find(y => y.title === 'A Thick One');
    document.querySelector(`[data-scopen="${x.id}"]`).click(); });
  await p.waitForTimeout(6000);
  const back = await p.evaluate(async () => {
    const was = location.hash;
    document.querySelector('#scBack').click();
    await new Promise(r => setTimeout(r, 1400));
    return {was, now: location.hash, id: scoreUi().id,
      shelf: !!document.querySelector('.sc-shelf'), viewer: !!document.querySelector('.sc-open')};
  });
  yes('the address still had the score in it', /#\/score\/.+/.test(back.was), back.was);
  /* one press: the shelf, and the address that goes with it */
  is('  and one press leaves both', [back.now, back.id], ['#/score', null]);
  yes('  the shelf is what is on the page', back.shelf && !back.viewer, JSON.stringify(back));

  console.log('\n3. a thick page is labelled, not refused');
  await p.evaluate(() => { const x = scores().find(y => y.title === 'A Thick One');
    document.querySelector(`[data-scopen="${x.id}"]`).click(); });
  await p.waitForTimeout(6000);
  const thick = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'A Thick One');
    const heads = scoreNotes().filter(n => n.midi != null).length;
    x.overlays.names = true; x.overlays.degrees = true; x.overlays.chords = true;
    scoreLayersPaint(x);
    await new Promise(r => setTimeout(r, 400));
    return {heads, refused: !!document.querySelector('.sc-toomany'),
      names: document.querySelectorAll('.sc-lab-name').length,
      chords: document.querySelectorAll('.sc-lab-chord').length};
  });
  yes('the page really is a thick one', thick.heads > 900, String(thick.heads));
  yes('  and nothing refuses to label it', !thick.refused, JSON.stringify(thick));
  is('  every note head has its letter', thick.names, thick.heads);
  /* the left hand holds a chord under the scale, so there is a harmony to
     read — a page of two parts in unison would honestly have none */
  yes('  and the harmony is read too', thick.chords > 0, String(thick.chords));

  console.log('\n4. reading mode asks for the screen');
  const read = await p.evaluate(async () => {
    const asked = {n: 0, opts: null};
    const real = document.documentElement.requestFullscreen;
    document.documentElement.requestFullscreen = function(o){ asked.n++; asked.opts = o; return Promise.resolve(); };
    setScoreReading(true);
    await new Promise(r => setTimeout(r, 2500));
    const inRead = document.documentElement.classList.contains('sc-reading');
    const furniture = ['.sidebar','.topbar','.sc-bar','.sc-side','.fab-wrap'].map(sel => {
      const n = document.querySelector(sel);
      return n ? getComputedStyle(n).display : 'gone'; });
    document.documentElement.requestFullscreen = real;
    return {asked, inRead, furniture, strip: !!document.querySelector('.sc-strip')};
  });
  is('it asks once', read.asked.n, 1);
  /* and asks for the plain screen, without the browser's own edges on it */
  is('  for the screen without navigation on it', read.asked.opts, {navigationUI:'hide'});
  yes('  the room is in reading mode', read.inRead, JSON.stringify(read));
  is('  and none of the room’s own furniture is drawn',
    read.furniture, ['none','none','none','none','none']);
  yes('  leaving only the strip', read.strip);
  /* the browser's Escape leaves full screen without telling anybody; the room
     has to follow it out rather than sit there stripped with the tabs back */
  const escaped = await p.evaluate(async () => {
    dispatchEvent(new Event('fullscreenchange'));
    await new Promise(r => setTimeout(r, 1200));
    return {reading: scoreUi().reading,
      cls: document.documentElement.classList.contains('sc-reading'),
      bar: !!document.querySelector('.sc-bar')};
  });
  yes('the screen going back takes the room with it',
    !escaped.reading && !escaped.cls && escaped.bar, JSON.stringify(escaped));

  console.log('\n5. the strip stays away');
  const quiet = await p.evaluate(async () => {
    const real = document.documentElement.requestFullscreen;
    document.documentElement.requestFullscreen = () => Promise.resolve();
    setScoreReading(true);
    await new Promise(r => setTimeout(r, 2200));
    const root = document.documentElement;
    const before = root.classList.contains('sc-quiet');
    document.querySelector('#scHide').click();
    const hidden = root.classList.contains('sc-quiet');
    /* a mouse resting on a desk twitches; that must not bring it back */
    dispatchEvent(new PointerEvent('pointermove', {bubbles:true, clientX:400, clientY:400}));
    await new Promise(r => setTimeout(r, 400));
    const afterMove = root.classList.contains('sc-quiet');
    /* a press is a thing you did on purpose */
    dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}));
    await new Promise(r => setTimeout(r, 200));
    const afterPress = root.classList.contains('sc-quiet');
    document.documentElement.requestFullscreen = real;
    setScoreReading(false);
    return {before, hidden, afterMove, afterPress};
  });
  yes('it is there while you are using it', !quiet.before, JSON.stringify(quiet));
  yes('  a press on the chevron sends it away at once', quiet.hidden, JSON.stringify(quiet));
  yes('  a mouse drifting across does not bring it back', quiet.afterMove, JSON.stringify(quiet));
  yes('  and a press does', !quiet.afterPress, JSON.stringify(quiet));

  console.log('\n6. the count and what it says it is');
  await p.evaluate(() => { const x = scores().find(y => y.title === 'A Thick One');
    if(!scoreUi().more){ scoreUi().more = true; rerender(); } });
  await p.waitForTimeout(1000);
  const sig = await p.evaluate(async () => {
    const said = () => { const n = document.querySelector('#scSigSay');
      return {txt: n.textContent.replace(/\s+/g, ' ').trim(), mine: n.classList.contains('mine'),
        back: !!document.querySelector('#scSigBack')}; };
    const before = said();
    const per = document.querySelector('#scPer');
    per.value = '5'; per.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 300));
    const after = said();
    document.querySelector('#scSigBack').click();
    await new Promise(r => setTimeout(r, 300));
    return {before, after, restored: said(),
      kept: (scores().find(y => y.title === 'A Thick One').metronome || {}).perBar};
  });
  is('it starts at what the score is written in', sig.before.txt, '4/4');
  yes('  unmarked, because that is what the notation says',
    !sig.before.mine && !sig.before.back, JSON.stringify(sig.before));
  /* the whole complaint: the number beside it used to stay at 4/4 while the
     click counted five */
  is('counting it in five says five', sig.after.txt.slice(0, 3), '5/4');
  yes('  and marks it as yours, with the way back', sig.after.mine && sig.after.back,
    JSON.stringify(sig.after));
  is('"as written" puts it back', sig.restored.txt, '4/4');
  is('  and forgets the override rather than storing the notation\u2019s number',
    sig.kept, null);

  console.log('\n7. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
