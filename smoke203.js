/* smoke203 — six more things that were wrong, and one new room.

   THE HARMONY WAS ONLY EVER READ FOR BAR ONE. Every note carries where in its
   bar it falls, and the engraver gives that as a fraction of a whole note
   counted from the bar line — except in the fallback some files take, where
   the same field is counted from the top of the piece instead. Nothing
   noticed: the chord reader walks the beats a bar has, found notes at beat 1
   of bar 1, and from bar 2 onward was looking for a beat at 1.0 in a bar that
   only goes up to 0.75. One chord symbol on the whole score, which reads as a
   feature nobody finished rather than as a bug.

   A FINGERING IS A NUMBER, NOT A RINGED NUMBER. The circle is an editor's
   mark, for a fingering being argued with. On a page where every fingering is
   your own it is thirty rings of nothing.

   THE INVENTORY HAS CATEGORIES. Composer and period, because the question
   "what have I got" is nearly always "what have I got of his" or "have I
   practised anything written before 1750 this year". The period is not in any
   MusicXML file, so it is guessed from the composer and never written down as
   a fact until you have looked at it.

   THE TIME CATEGORIES ARE YOURS. Sixteen shipped and none of them fixed. A
   tracker whose categories somebody else chose is one you fight with for a
   week and then stop using. Putting one away and throwing it out are
   deliberately different: months of entries point at these ids, and an id
   nothing can name turns a year of Tuesdays into "Untagged".

   SLEEP IS READ, NOT TIMED. The wake and bed times are already written on
   Today. The Time page was calling those eight hours untracked.

   AND THE BUTTONS ON A CARD ARE SIMPLY THERE, which is tested next door.

   THE EXCHANGE. Two machines, no account here and no server: one file, put
   wherever something already syncs for you. What makes it harder than copying
   a file is that both sides change, so it is per store — practising on the
   tablet and tidying tasks on the laptop are not a disagreement — and only
   something moved in BOTH places since the last exchange is put to you. */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n) : no(n, `got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

/* Eight bars, and the harmony changes every one of them. The right hand holds
   a whole-note triad; the left holds the root under it. If only bar one is
   read, one symbol comes out instead of eight. */
const TOP = [['C','E','G'],['A','C','E'],['F','A','C'],['G','B','D'],
             ['E','G','B'],['D','F','A'],['B','D','F'],['C','E','G']];
const BASS = ['C','A','F','G','E','D','G','C'];
const head = `<attributes><divisions>2</divisions><key><fifths>0</fifths></key>
  <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
const bhead = head.replace('<sign>G</sign><line>2</line>', '<sign>F</sign><line>4</line>');
const chord = (steps, oct) => steps.map((st, i) =>
  `<note>${i ? '<chord/>' : ''}<pitch><step>${st}</step><octave>${oct}</octave></pitch>
   <duration>8</duration><type>whole</type></note>`).join('');
const XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>Eight Changes</work-title></work>
  <identification><creator type="composer">Fryderyk Chopin</creator></identification>
  <part-list><score-part id="P1"><part-name>RH</part-name></score-part>
    <score-part id="P2"><part-name>LH</part-name></score-part></part-list>
  <part id="P1">${TOP.map((c, i) =>
    `<measure number="${i+1}">${i === 0 ? head : ''}${chord(c, 4)}</measure>`).join('')}</part>
  <part id="P2">${BASS.map((b, i) =>
    `<measure number="${i+1}">${i === 0 ? bhead : ''}${chord([b], 2)}</measure>`).join('')}</part>
</score-partwise>`;
/* a second piece by somebody else entirely, so a composer filter has two
   things to tell apart */
const XML2 = XML.replace('Eight Changes', 'Something Else')
  .replace('Fryderyk Chopin', 'Thelonious Monk');

/* And a third, written the way piano music is actually written: a melody in
   quavers over a left hand that lays the chord out one note at a time. Block
   chords are the easy case and almost nothing real looks like them. */
const ARP_RH = [['G','E','C','E'],['A','F','C','F'],['B','G','D','G'],['C','A','E','A'],
                ['D','B','G','B'],
                /* and a last bar with two notes in the tune that are not in
                   the chord at all: a scale through D and F over a held C
                   major. Counted as hard evidence they outvote the chord
                   they are decorating and the bar comes out named C9. */
                ['C','D','E','F']];
const ARP_LH = [['C','G','E','G'],['F','C','A','C'],['G','D','B','D'],['A','E','C','E'],
                ['G','D','B','D'], null /* a held triad, written below */];
const ARP_WANT = ['C','F','G','Am','G','C'];
const qn = (st, oct) => `<note><pitch><step>${st}</step><octave>${oct}</octave></pitch><duration>1</duration><type>eighth</type></note>`;
const arpHead = clef => `<attributes><divisions>2</divisions><key><fifths>0</fifths></key>
  <time><beats>2</beats><beat-type>4</beat-type></time>
  <clef><sign>${clef}</sign><line>${clef === 'G' ? 2 : 4}</line></clef></attributes>`;
const ARP = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1">
  <work><work-title>Broken Chords</work-title></work>
  <part-list><score-part id="P1"><part-name>RH</part-name></score-part>
    <score-part id="P2"><part-name>LH</part-name></score-part></part-list>
  <part id="P1">${ARP_RH.map((b, i) =>
    `<measure number="${i+1}">${i === 0 ? arpHead('G') : ''}${b.map(st => qn(st, 5)).join('')}</measure>`).join('')}</part>
  <part id="P2">${ARP_LH.map((b, i) =>
    `<measure number="${i+1}">${i === 0 ? arpHead('F') : ''}${b
      ? b.map(st => qn(st, 3)).join('')
      : ['C','E','G'].map((st, k) => `<note>${k ? '<chord/>' : ''}<pitch><step>${st}</step><octave>3</octave></pitch><duration>4</duration><type>half</type></note>`).join('')
    }</measure>`).join('')}</part>
</score-partwise>`;

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1000}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1000);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));

  console.log('\n1. the harmony, all the way down the page');
  await p.evaluate(() => { location.hash = '#/score'; }); await p.waitForTimeout(1200);
  const made = await p.evaluate(async ([a, c]) => {
    await takeScoreFile(new File([a], 'Eight Changes.musicxml'));
    await takeScoreFile(new File([c], 'Something Else.musicxml'));
    return scores().length;
  }, [XML, XML2]);
  yes('two scores are in', made >= 2, String(made));
  await p.waitForTimeout(5000);
  /* the reading itself, before anything is drawn: eight bars, eight symbols */
  const line = await p.evaluate(() => {
    const x = scores().find(y => y.title === 'Eight Changes');
    scoreUi().id = x.id; rerender();
    return null;
  });
  await p.waitForTimeout(5000);
  const read = await p.evaluate(() => {
    const said = scoreChordLine(scoreNotes(), {});
    return {bars: said.map(c => c.measure), says: said.map(c => c.say)};
  });
  is('the harmony is read in every one of the eight bars', read.bars, [1,2,3,4,5,6,7,8]);
  is('  each one named from the notes in it', read.says,
    ['C','Am','F','G','Em','Dm','G7','C']);
  /* and again with the stamp the engraver usually gives taken away, which is
     the case some files land in: the fallback counts from the top of the
     piece rather than from the bar line, and read as if it were the bar line
     every note after bar one lands at a beat the bar does not have. That is a
     piece with one chord symbol on it, which reads as a feature nobody
     finished rather than as a bug. */
  const fallback = await p.evaluate(() => {
    const sv = scoreView();
    (sv.osmd.GraphicSheet.MeasureList || []).forEach(line => (line || []).forEach(m =>
      (m.staffEntries || []).forEach(se => { se.relInMeasureTimestamp = null; })));
    const said = scoreChordLine(scoreNotes(), {});
    return {bars: said.map(c => c.measure), says: said.map(c => c.say),
      ats: [...new Set(scoreNotes().map(n => +n.at.toFixed(3)))].sort((a, b) => a - b)};
  });
  yes('every note is placed inside its own bar, however the engraver hands the time over',
    fallback.ats.every(v => v >= 0 && v < 1), JSON.stringify(fallback.ats));
  is('  so the harmony is still read in every bar', fallback.bars, [1,2,3,4,5,6,7,8]);
  is('  and says the same things', fallback.says, read.says);
  await p.evaluate(async () => { const x = scores().find(y => y.title === 'Eight Changes');
    await scoreRedraw(x); });
  await p.waitForTimeout(1200);
  /* and the same thing once it is on the glass, which is what you actually see */
  const drawn = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Eight Changes');
    x.overlays.chords = true;
    await scoreRedraw(x);
    await new Promise(r => setTimeout(r, 1200));
    const labs = [...document.querySelectorAll('.sc-lab-chord')];
    return {n: labs.length, says: labs.map(n => n.textContent.trim()),
      tops: labs.map(n => Math.round(parseFloat(n.style.top)))};
  });
  is('every change is drawn, not only the first', drawn.n, 8);
  is('  saying the same eight things', drawn.says, ['C','Am','F','G','Em','Dm','G7','C']);
  /* a label whose bar was not found lands above the page at a negative top,
     which looks like nothing at all rather than like a bug */
  yes('  and none of them is off the top of the page',
    drawn.tops.every(t => t > 0), JSON.stringify(drawn.tops));

  console.log('\n2. the harmony of a piece written the way piano music is written');
  /* Asking what is struck ON the beat is the question almost no piano score
     answers. In a broken chord only one or two notes sound at any instant,
     and two notes name a chord the way two letters name a word: confidently
     and wrongly. The whole bar of C\u2013G\u2013E\u2013G is one C, and the only way
     to see that is to look at the whole bar. */
  await p.evaluate(async xml => { await takeScoreFile(new File([xml], 'Broken Chords.musicxml')); }, ARP);
  await p.waitForTimeout(5000);
  await p.evaluate(() => { const x = scores().find(y => y.title === 'Broken Chords');
    scoreUi().id = x.id; x.overlays.chords = true; rerender(); });
  await p.waitForTimeout(6000);
  const arp = await p.evaluate(() => {
    const notes = scoreNotes();
    const line = scoreChordLine(notes, {});
    /* how many notes there are to go on at the instant of a beat, which is
       what the old reading had and why it could not work */
    const bar1 = notes.filter(n => n.measure === 1 && n.midi != null);
    const onBeat2 = bar1.filter(n => Math.abs(n.at - 0.25) < 1e-6).length;
    return {says: line.map(c => c.say), bars: line.map(c => c.measure),
      onBeat2, notesInBar: bar1.length,
      drawn: [...document.querySelectorAll('.sc-lab-chord')].map(n => n.textContent.trim())};
  });
  yes('there are only two notes at the instant of the second beat',
    arp.onBeat2 === 2 && arp.notesInBar === 8, JSON.stringify(arp).slice(0, 120));
  is('  and the harmony is still read, one symbol a bar', arp.says, ARP_WANT);
  is('  at the bar line where it turns over', arp.bars, [1,2,3,4,5,6]);
  is('  and that is what is drawn on the page', arp.drawn, ARP_WANT);
  /* the note under beat two of an arpeggio is the next note of the arpeggio,
     not a change of harmony, and labelling F then F/A bar after bar is three
     symbols of noise for every real one */
  yes('  with no slash chord invented from a passing bass note',
    arp.says.every(v => !v.includes('/')), JSON.stringify(arp.says));
  /* the last bar is a held C major with two notes of a scale passing over
     it. A passing note is not evidence against the chord it decorates, and
     counted as though it were, the bar comes out named after the decoration */
  is('  and a passing note does not rename the chord it decorates',
    arp.says[arp.says.length - 1], 'C');

  console.log('\n3. a fingering is a number, not a ringed number');
  const fing = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Eight Changes');
    x.overlays.fingerings = true;
    /* the keys are handed back as a map over the very notes they were made
       from, so it has to be one list rather than two calls */
    const notes = scoreNotes();
    const n = notes.find(v => v.midi != null);
    x.fingerings[scoreFingerKeys(notes).get(n)] = {hand:'R', finger:3};
    await scoreRedraw(x);
    await new Promise(r => setTimeout(r, 900));
    const el = document.querySelector('.sc-fing');
    if(!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {text: el.textContent.trim(), radius: parseFloat(cs.borderRadius) || 0,
      width: cs.borderTopWidth, style: cs.borderTopStyle,
      w: Math.round(r.width), h: Math.round(r.height),
      ground: cs.backgroundColor};
  });
  yes('the fingering is drawn', fing && fing.text === '3', JSON.stringify(fing));
  /* a ring is a border; a circle is a radius of half the box. Neither */
  yes('  with no ring around it',
    fing && (fing.width === '0px' || fing.style === 'none')
      && fing.radius < Math.min(fing.w, fing.h) * 0.4,
    JSON.stringify(fing));
  /* it still needs a ground, or a 3 over a beam is unreadable */
  yes('  but still something behind it, so it is not lost in a beam',
    fing && !/rgba\(0, 0, 0, 0\)|transparent/.test(fing.ground), fing && fing.ground);

  console.log('\n4. the inventory has categories');
  await p.evaluate(() => { scoreUi().id = null; location.hash = '#/score'; });
  await p.waitForTimeout(1400);
  const cats = await p.evaluate(() => ({
    composer: !!document.querySelector('#scinvComposer'),
    period: !!document.querySelector('#scinvPeriod'),
    /* the menus are built from the shelf, not from a list of every composer
       who ever lived: a menu of two hundred, all but two empty, is a menu
       nobody reads */
    comps: [...document.querySelectorAll('#scinvComposer option')].map(o => o.textContent.trim()),
    pers: [...document.querySelectorAll('#scinvPeriod option')].map(o => o.textContent.trim()),
    guessed: scores().map(x => [x.composer, x.period, scorePeriodOf(x)]),
  }));
  yes('there is a composer menu and a period menu', cats.composer && cats.period, JSON.stringify(cats));
  is('  the composers are the ones on the shelf, with how many',
    cats.comps, ['any composer', 'no composer named (1)', 'Fryderyk Chopin (1)', 'Thelonious Monk (1)']);
  /* guessed from the name, and the guess is not written down as a fact */
  is('  the period is guessed from the composer', cats.guessed,
    [['Fryderyk Chopin', null, 'romantic'], ['Thelonious Monk', null, 'jazz'], ['', null, null]]);
  yes('  and the menu offers both of them',
    /Romantic/.test(cats.pers.join('|')) && /Jazz/.test(cats.pers.join('|')), JSON.stringify(cats.pers));
  const filtered = await p.evaluate(async () => {
    const sel = document.querySelector('#scinvPeriod');
    sel.value = 'jazz'; sel.onchange();
    await new Promise(r => setTimeout(r, 700));
    return [...document.querySelectorAll('.sc-invrow .sc-invname b')].map(n => n.textContent.trim());
  });
  is('filtering by period leaves the one piece in it', filtered, ['Something Else']);
  const own = await p.evaluate(async () => {
    const sel = document.querySelector('#scinvPeriod'); sel.value = 'all'; sel.onchange();
    await new Promise(r => setTimeout(r, 600));
    const x = scores().find(y => y.title === 'Eight Changes');
    openScoreDetails(x.id);
    await new Promise(r => setTimeout(r, 400));
    document.querySelector('#sdComposer').value = 'Chopin';
    document.querySelector('#sdPeriod').value = 'baroque';
    document.querySelector('#sdSave').click();
    await new Promise(r => setTimeout(r, 700));
    const y = scores().find(v => v.title === 'Eight Changes');
    return {composer: y.composer, period: y.period, shown: scorePeriodOf(y)};
  });
  /* what you said beats what the name suggests, which is the whole reason it
     can be set: the guess is a guess */
  is('what you set beats what the name suggested',
    [own.composer, own.period, own.shown], ['Chopin', 'baroque', 'baroque']);

  console.log('\n5. how well you know each piece');
  /* The sections answer a different question: a section's standing is about
     a passage you have marked up, and this is about your relationship with
     the whole piece over years. A piece can have no sections marked and
     still be one you could play tomorrow. */
  const fam = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Eight Changes');
    const fresh = x.familiar;
    const sel = document.querySelector(`[data-scfam="${CSS.escape(x.id)}"]`);
    const offered = [...sel.options].map(o => o.textContent.trim());
    sel.value = 'ready'; sel.onchange();
    await new Promise(r => setTimeout(r, 700));
    return {fresh, offered, now: scoreById(x.id).familiar,
      /* the row is coloured by what you said, not by what the sections add up to */
      colour: getComputedStyle(document.querySelector(`[data-scinvrow="${CSS.escape(x.id)}"]`))
        .getPropertyValue('--c').trim()};
  });
  /* nothing is claimed about a piece nobody has played */
  is('a piece starts as one you have not played', fam.fresh, 'unplayed');
  yes('  and the three you asked for are all on the list',
    fam.offered.includes('Performance ready') && fam.offered.includes('Needs polish')
      && fam.offered.includes('Rusty'), JSON.stringify(fam.offered));
  is('  eight rungs in all', fam.offered.length, 8);
  is('  and saying so on the row is enough', fam.now, 'ready');
  yes('  which is what the row is coloured by', /#7f916a/i.test(fam.colour), fam.colour);
  const doubt = await p.evaluate(async () => {
    const x = scores().find(y => y.title === 'Eight Changes');
    /* called performance ready, and last practised in the spring */
    const old = new Date(Date.now() - 200 * 86400000).toISOString().slice(0, 10);
    x.practice = [{id:uid(), date: old, minutes: 30}];
    const said = scoreFamiliarDoubt(x);
    x.practice = [{id:uid(), date: today(), minutes: 30}];
    const quiet = scoreFamiliarDoubt(x);
    x.familiar = 'rusty';
    const rusty = scoreFamiliarDoubt(x);
    x.familiar = 'ready'; x.practice = [];
    return {said, quiet, rusty};
  });
  /* what you say, held beside what the log says, where they disagree */
  yes('a piece you called ready and have not touched in months says so',
    /not practised in/.test(doubt.said), doubt.said);
  is('  and one you have been at is left alone', doubt.quiet, '');
  yes('  and one called rusty that you have been at this month says that too',
    /been at it/.test(doubt.rusty), doubt.rusty);
  const filt = await p.evaluate(async () => {
    const sel = document.querySelector('#scinvFam');
    sel.value = 'unplayed'; sel.onchange();
    await new Promise(r => setTimeout(r, 700));
    const rows = [...document.querySelectorAll('.sc-invrow .sc-invname b')].map(n => n.textContent.trim());
    document.querySelector('#scinvClear').click();
    await new Promise(r => setTimeout(r, 600));
    return {rows, back: document.querySelectorAll('.sc-invrow').length};
  });
  yes('the list can be asked for one rung at a time',
    !filt.rows.includes('Eight Changes'), JSON.stringify(filt.rows));
  yes('  and clearing brings them back', filt.back >= 3, String(filt.back));

  console.log('\n6. the time categories are yours');
  await p.evaluate(() => { location.hash = '#/time/categories'; }); await p.waitForTimeout(1000);
  const shown = await p.evaluate(() => ({
    rows: document.querySelectorAll('.tm-catrow').length,
    ships: TIME_CATEGORIES.length,
    names: [...document.querySelectorAll('[data-tmcatf="name"]')].slice(0, 3).map(n => n.value),
    colours: document.querySelectorAll('[data-tmcatf="color"]').length,
  }));
  is('every category the app ships with is on the page', shown.rows, shown.ships);
  is('  every one of them with a name you can type in', shown.names, ['Piano','Japanese','Meditation']);
  is('  and a colour you can change', shown.colours, shown.ships);
  const renamed = await p.evaluate(async () => {
    const n = document.querySelector('[data-tmcat="piano"][data-tmcatf="name"]');
    n.value = 'At the piano'; n.onchange();
    await new Promise(r => setTimeout(r, 500));
    return {name: timeCategory('piano').name,
      inPicker: [...document.querySelectorAll('#tmCatDefault option')].map(o => o.textContent.trim())
        .some(t => /At the piano/.test(t))};
  });
  is('renaming one of the shipped sixteen sticks', renamed.name, 'At the piano');
  yes('  and it is renamed everywhere, not only on this page', renamed.inPicker);
  const moved = await p.evaluate(async () => {
    const before = timeAllCategories().map(c => c.id).slice(0, 3);
    document.querySelector('[data-tmcatdown="piano"]').click();
    await new Promise(r => setTimeout(r, 500));
    return {before, after: timeAllCategories().map(c => c.id).slice(0, 3)};
  });
  is('the order is yours too', [moved.before[0], moved.after[0]], ['piano', moved.before[1]]);
  /* putting away and throwing out are different things, and the difference is
     what happens to what is already filed under it */
  const away = await p.evaluate(async () => {
    const e = logTime({what:'a sitting', categoryId:'meditation', minutes:30});
    await new Promise(r => setTimeout(r, 200));
    document.querySelector('[data-tmcatoff="meditation"]').click();
    await new Promise(r => setTimeout(r, 500));
    return {offered: timeCategories().some(c => c.id === 'meditation'),
      exists: timeAllCategories().some(c => c.id === 'meditation'),
      stillNamed: timeCategory(timeEntries().find(v => v.id === e.id).categoryId).name,
      id: e.id};
  });
  yes('one put away stops being offered', !away.offered, JSON.stringify(away));
  is('  but what is already filed under it keeps its name', away.stillNamed, 'Meditation');
  const gone = await p.evaluate(async id => {
    document.querySelector('[data-tmcatdel="meditation"]').click();
    await new Promise(r => setTimeout(r, 400));
    const pick = document.querySelector('#tcMove');
    pick.value = 'rest';
    document.querySelector('#tcGo').click();
    await new Promise(r => setTimeout(r, 700));
    return {exists: timeAllCategories().some(c => c.id === 'meditation'),
      moved: timeEntries().find(v => v.id === id).categoryId};
  }, away.id);
  yes('one thrown out is gone', !gone.exists);
  is('  and its sittings went where you said, rather than being orphaned',
    gone.moved, 'rest');
  const fresh = await p.evaluate(async () => {
    const n = timeAllCategories().length;
    document.querySelector('#tmCatAdd').click();
    await new Promise(r => setTimeout(r, 500));
    return {grew: timeAllCategories().length - n,
      focused: document.activeElement && document.activeElement.dataset.tmcatf};
  });
  is('a new one can be added', fresh.grew, 1);
  is('  with the caret already in its name', fresh.focused, 'name');

  console.log('\n7. sleep is read off Today, not timed here');
  const slept = await p.evaluate(async () => {
    const d = today();
    S.dailyRhythm = S.dailyRhythm || {};
    S.dailyRhythm[d] = Object.assign(S.dailyRhythm[d] || {}, {wakeTime:'06:30', sleepTime:'23:00'});
    location.hash = '#/time/day';
    await new Promise(r => setTimeout(r, 900));
    return {blocks: timeSleepBlocks(d), mins: timeSleepMinutes(d),
      segs: document.querySelectorAll('.tm-sleepseg').length,
      row: !!document.querySelector('.tm-sleeprow'),
      says: (document.querySelector('.tm-sleeprow .tm-sumn') || {}).textContent};
  });
  /* midnight to waking, and bedtime to midnight: six and a half hours plus one */
  is('the asleep hours are worked out from the two times you wrote',
    slept.blocks.map(v => [v.from, v.to]), [[0, 390], [1380, 1440]]);
  is('  which is seven and a half hours', slept.mins, 450);
  is('  drawn on the day as two stretches', slept.segs, 2);
  yes('  and named as sleep in the day’s totals',
    slept.row && /Sleep/.test(slept.says || ''), slept.says);
  yes('  saying where it came from', /06:30/.test(slept.says || ''), slept.says);
  /* going to bed after midnight is the case worth getting right */
  const late = await p.evaluate(() => {
    const d = today();
    S.dailyRhythm[d].sleepTime = '01:40';
    const b = timeSleepBlocks(d);
    S.dailyRhythm[d].sleepTime = '23:00';
    return b.map(v => [v.from, v.to]);
  });
  is('a bedtime after midnight is one stretch, not two overlapping ones',
    late, [[100, 390]]);
  const untracked = await p.evaluate(async () => {
    logTime({what:'reading', categoryId:'reading', minutes:60});
    location.hash = '#/time/week'; await new Promise(r => setTimeout(r, 400));
    location.hash = '#/time/day'; await new Promise(r => setTimeout(r, 900));
    const rows = [...document.querySelectorAll('.tm-sumrow')].map(n =>
      n.textContent.replace(/\s+/g, ' ').trim());
    const tracked = sum(timeOnDay(today()).map(e => timeMinutes(e)));
    return {said: rows[rows.length - 1], tracked,
      /* what the line would have said before, and what it says now */
      old: timeSaid(1440 - tracked), now: timeSaid(1440 - tracked - 450)};
  });
  /* a day is 1440 minutes; an hour of it was read and seven and a half were
     spent asleep. Counting the sleep as time lost was the old answer */
  yes('the untracked line no longer counts being asleep as time lost',
    untracked.said.includes(untracked.now) && !untracked.said.includes(untracked.old),
    JSON.stringify(untracked));
  yes('  and says it means the waking hours', /awake/.test(untracked.said), untracked.said);

  console.log('\n8. the exchange');
  const parts = await p.evaluate(() => {
    const rows = {meta:[{key:'settings', value:{a:1}}, {key:'time', value:{b:2}}],
      tasks:[{id:'t1'}], scores:[{id:'s1'}]};
    const u = syncUnits(rows);
    return {keys: Object.keys(u).sort(), back: syncUnitsToRows(u)};
  });
  /* each settings key is its own unit: a sound setting changed here and a
     month plan changed there are not the same disagreement */
  is('the state is cut into pieces small enough to merge',
    parts.keys, ['meta:settings','meta:time','scores','tasks']);
  is('  and goes back together unchanged',
    parts.back.meta.map(r => r.key).sort(), ['settings','time']);
  const plan = await p.evaluate(() => {
    const mine = {meta:[{key:'settings', value:{a:1}}], tasks:[{id:'t1'},{id:'t2'}], scores:[{id:'s1'}]};
    const base = syncPrints(syncUnits({meta:[{key:'settings', value:{a:1}}],
      tasks:[{id:'t1'}], scores:[{id:'s1'}]}));
    /* they practised, we tidied tasks: nobody should be asked anything */
    const theirsRows = {meta:[{key:'settings', value:{a:1}}], tasks:[{id:'t1'}],
      scores:[{id:'s1'},{id:'s2'}]};
    const theirs = {version:1, device:'the iPad', prints: syncPrints(syncUnits(theirsRows)), data: theirsRows};
    const q = syncPlan(mine, theirs, base);
    const merged = syncApply(mine, theirs, q, null);
    return {take: q.take, push: q.push, clash: q.clash,
      tasks: merged.tasks.length, scores: merged.scores.length};
  });
  is('what they changed is taken', plan.take, ['scores']);
  is('  what we changed is ours to send', plan.push, ['tasks']);
  is('  and neither is a disagreement', plan.clash, []);
  is('  so both sides are kept without anybody being asked',
    [plan.tasks, plan.scores], [2, 2]);
  const fight = await p.evaluate(() => {
    const base = syncPrints(syncUnits({tasks:[{id:'t1'}]}));
    const mine = {tasks:[{id:'t1'},{id:'mine'}]};
    const theirsRows = {tasks:[{id:'t1'},{id:'theirs'}]};
    const theirs = {version:1, device:'the iPad', prints: syncPrints(syncUnits(theirsRows)), data: theirsRows};
    const q = syncPlan(mine, theirs, base);
    const kept = syncApply(mine, theirs, q, null);
    const took = syncApply(mine, theirs, q, {tasks:'theirs'});
    return {clash: q.clash, kept: kept.tasks.map(t => t.id), took: took.tasks.map(t => t.id)};
  });
  is('the same thing moved on both sides is a real disagreement', fight.clash, ['tasks']);
  /* the safe direction is the one that needs no answer: unanswered means
     nothing of this machine's is thrown away */
  is('  and left unanswered, nothing of this side is thrown away',
    fight.kept, ['t1','mine']);
  is('  answered, the other side is taken', fight.took, ['t1','theirs']);
  const print = await p.evaluate(() => ({
    same: syncPrint({a:1, b:[1,2]}) === syncPrint({a:1, b:[1,2]}),
    diff: syncPrint({a:1}) !== syncPrint({a:2}),
    order: syncPrint([1,2]) !== syncPrint([2,1]),
  }));
  yes('the fingerprint tells the same from the different',
    print.same && print.diff && print.order, JSON.stringify(print));
  const room = await p.evaluate(async () => {
    location.hash = '#/settings';
    await new Promise(r => setTimeout(r, 1200));
    const sec = document.querySelector('#syncSec');
    return {there: !!sec,
      /* no account, no server, and it says so rather than leaving you to hope */
      says: sec ? sec.textContent.replace(/\s+/g, ' ') : '',
      byHand: !!document.querySelector('#syOpen'),
      named: !!document.querySelector('#syName')};
  });
  yes('there is a room for it', room.there && room.named, JSON.stringify(room).slice(0, 200));
  yes('  which says there is no account and no server',
    /No account here/.test(room.says) && /nothing of yours goes/.test(room.says), room.says.slice(0, 160));
  yes('  and a way to do it by hand where there is no folder picker', room.byHand);

  console.log('\n9. nothing threw');
  is('no page errors', errs, []);

  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
