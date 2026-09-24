/* smoke218 — it is a piano. It has two hands and two clefs.

   Every generator in this room was written one clef at a time and every one
   of them wrote a treble, which is wrong for most of what the room teaches.
   Siskind's Type A voicings sit between B2 and C4; his shell voicings
   between F2 and E3; his bass lines lower still. On a treble staff those
   come out hanging four and five ledger lines under the stave — unreadable,
   and not how the book prints them.

   So there is one pass over the finished MusicXML rather than eleven
   corrected generators, and the claims below are about the four ways a pass
   like that goes wrong.

   IT CHANGES THE MUSIC. Moving a note to another stave must not move the
   note. Every sounding pitch, in every key, has to come out of the pass
   exactly as the generator wrote it, and none may go missing. That is the
   claim the rest of this is worthless without.

   IT SPLITS WHAT IS ONE HAND. Siskind's Type A on D is D3-F3-A3-C4: it
   crosses middle C by one note and it is one grab. Split at middle C it
   becomes three notes on one stave and a lonely whole note on the other,
   which is harder to read than the ledger line it saved. A chord goes whole
   onto one stave until it is genuinely too wide to be one hand.

   IT MAKES THE LINE HOP. A phrase that dips under middle C in its third bar
   must not change clef for that bar and change back. The hand is decided
   once for the whole exercise.

   THE EMPTY STAVE LIES. A voicing exercise leaves the treble stave silent,
   and silence has to be written as a bar's rest — not as a whole rest with
   two augmentation dots, which is what a duration without a type turns into
   and which says six beats of nothing in a bar of four.

   WHAT IS NOT CLAIMED. That the register each generator chose is the right
   one. Where a voicing sits is the generator's business and the book's; this
   pass only writes it on the clef it is actually in.
 */
const {chromium} = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'index.html');
let bad = 0;
const ok  = (n, x='') => console.log(`  ok   ${n}${x?'  — '+x:''}`);
const no  = (n, g='') => { bad++; console.log(`  FAIL ${n}${g!==''?'  — '+g:''}`); };
const is  = (n,a,b) => JSON.stringify(a)===JSON.stringify(b) ? ok(n)
  : no(n, `\n         got  ${JSON.stringify(a)}\n         want ${JSON.stringify(b)}`);
const yes = (n,c,g='') => c ? ok(n) : no(n,g);

(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs = [];
  const p = await (await b.newContext({viewport:{width:1500, height:1100}})).newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_CONNECTION_RESET|ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(1200);
  if(await p.$('#frGo')){ await p.click('#frGo'); await p.waitForTimeout(2200); }
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(n => n.remove()));
  await p.evaluate(() => { const j = jazzState(); j.fixes = {}; j.progress = {}; saveNow(); });

  /* a few small readers, defined in the page once and used by everything below */
  await p.evaluate(() => {
    window.T = {
      parse: xml => new DOMParser().parseFromString(xml, 'application/xml'),
      /* every sounding pitch of a document, in bar order, sorted within a bar
         so that moving a note to the other stave does not read as a change */
      pitches(xml){
        const d = this.parse(xml);
        return [...d.querySelectorAll('measure')].map(m =>
          [...m.querySelectorAll('note')].filter(n => !n.querySelector('rest'))
            .map(n => jazzPitchMidi(n.querySelector('pitch'))).sort((a, c) => a - c));
      },
      staves(xml){
        const d = this.parse(xml);
        const out = {1: [], 2: [], noStaff: 0, rests: {1: 0, 2: 0}, dotted: 0};
        [...d.querySelectorAll('note')].forEach(n => {
          const s = n.querySelector('staff')?.textContent;
          if(!s){ out.noStaff++; return; }
          if(n.querySelector('rest')){ out.rests[s]++; if(n.querySelector('dot')) out.dotted++; return; }
          out[s].push(jazzPitchMidi(n.querySelector('pitch')));
        });
        return out;
      },
      raw(id, key){ const ex = jazzExercise(id);
        return JazzExerciseGenerator[ex.gen].apply(JazzExerciseGenerator,
          (ex.args || ['key']).map(a => a === 'key' ? key : a === 'intervalName' ? 'major3rd' : a)); },
    };
  });

  /* ------------------------------------------------------------------ */
  console.log('\n1. every exercise, in every key, comes out as a grand staff or a labelled single-staff');
  const all = await p.evaluate(() => {
    const out = {n: 0, noStaves: [], noClefs: [], noStaff: [], broken: [], moved: [], lost: []};
    Object.keys(jazzBook()).forEach(id => {
      const ex = jazzExercise(id);
      if(!jazzHasScore(ex)) return;
      JAZZ_KEY_NAMES.forEach(key => {
        let result; try { result = jazzScoreXml(ex, key, {interval: 'major3rd'}); }
        catch(e){ out.broken.push(`${id}/${key}: ${e.message}`); return; }
        if(!result){ out.broken.push(`${id}/${key}: nothing`); return; }
        /* multi-example generators return {title, documents:[{subtitle,mxl}]} —
           check each sub-document; single-example generators return a string */
        const xmlList = (typeof result === 'object' && Array.isArray(result.documents))
          ? result.documents.map(d => d.mxl) : [result];
        xmlList.forEach((xml, si) => {
          if(!xml) return;
          out.n++;
          const tag = xmlList.length > 1 ? `${id}[${si}]/${key}` : `${id}/${key}`;
          const d = T.parse(xml);
          if(d.querySelector('parsererror')){ out.broken.push(`${tag}: will not parse`); return; }
          /* single-staff exercises are intentional (bass-only drones, etc.) — the marker
             says so, and they are exempt from the grand-staff requirement.
             Two-part exercises (jz-grand-staff) use separate <part> elements for treble
             and bass, not <staves>2</staves> — they get their own verification. */
          const singleStaff = /jz-single-staff/.test(xml);
          const twoPartGrand = /jz-grand-staff/.test(xml);
          if(!singleStaff && !twoPartGrand){
            if(!/<staves>2<\/staves>/.test(xml)) out.noStaves.push(tag);
            const clefs = [...d.querySelectorAll('clef')].map(c =>
              `${c.getAttribute('number')}:${c.querySelector('sign').textContent}${c.querySelector('line').textContent}`);
            if(clefs.join(',') !== '1:G2,2:F4') out.noClefs.push(`${tag} → ${clefs.join(',')}`);
            if(T.staves(xml).noStaff) out.noStaff.push(tag);
          } else if(twoPartGrand && /<staves>2<\/staves>/.test(xml)){
            /* the marker also sits on a grand staff already written as one part with two
               staves (the score editor's output, the v3 builders): the same claims apply */
            const clefs = [...d.querySelectorAll('clef')].slice(0, 2).map(c =>
              `${c.getAttribute('number')}:${c.querySelector('sign').textContent}${c.querySelector('line').textContent}`);
            if(clefs.join(',') !== '1:G2,2:F4') out.noClefs.push(`${tag} → ${clefs.join(',')}`);
            if(T.staves(xml).noStaff) out.noStaff.push(tag);
          } else if(twoPartGrand){
            /* two-part format: must have ≥2 parts, first with G clef, second with F clef */
            const parts = [...d.querySelectorAll('part')];
            if(parts.length < 2){ out.noStaves.push(tag); }
            else {
              const p1clef = parts[0].querySelector('clef sign')?.textContent;
              const p2clef = parts[1].querySelector('clef sign')?.textContent;
              if(p1clef !== 'G' || p2clef !== 'F') out.noClefs.push(`${tag} → P1:${p1clef},P2:${p2clef}`);
            }
          }
          /* the music itself is untouched — only check single-example exercises and
             only the first sub-example for multi-example, as the raw generator returns
             the full set and there is no per-sub raw for comparison */
          if(si > 0) return;
          let raw; try { raw = T.raw(id, key); } catch(e){ return; }
          if(typeof raw === 'object' && Array.isArray(raw.documents)) raw = raw.documents[0] && raw.documents[0].mxl;
          if(!raw || typeof raw !== 'string') return;
          const a = JSON.stringify(T.pitches(raw)), c2 = JSON.stringify(T.pitches(xml));
          if(a !== c2){
            const flat = s => JSON.parse(s).flat().sort((x, y) => x - y).join(',');
            (flat(a) === flat(c2) ? out.moved : out.lost).push(tag);
          }
        });
      });
    });
    return out;
  });
  yes('there are a thousand of them to check', all.n > 1000, String(all.n));
  is('  none of them fails to generate', all.broken, []);
  is('  every one declares two staves', all.noStaves, []);
  is('  with a treble over a bass, in that order', all.noClefs, []);
  is('  and every note says which stave it is on', all.noStaff, []);
  is('  not one note changed pitch', all.lost, []);
  is('  and not one moved to another bar', all.moved, []);

  /* ------------------------------------------------------------------ */
  console.log('\n2. and the notes went to the clef they belong to');
  const where = await p.evaluate(() => {
    const at = id => T.staves(jazzScoreXml(jazzExercise(id), 'C', {interval: 'major3rd'}));
    return {voicing: at('2.1'), lick: at('6.1'), chord: at('1.1'), bassline: at('3.2')};
  });
  is('a left-hand ii-V-I is on the bass clef, all of it', where.voicing[1], []);
  yes('  which is where its twelve notes are', where.voicing[2].length === 12, JSON.stringify(where.voicing[2]));
  is('  and the treble stave is silent rather than missing', where.voicing.rests[1], 3);
  is('a lick is on the treble', where.lick[2], []);
  yes('  where its notes are', where.lick[1].length > 5, JSON.stringify(where.lick[1]));
  is('a chord built up from middle C is on the treble too', where.chord[1], [60, 64, 67, 71]);
  yes('and nothing anywhere is a dotted rest',
      !where.voicing.dotted && !where.lick.dotted && !where.chord.dotted);

  console.log('\n2b. a hand’s grab is not split for the sake of a rule');
  const grab = await p.evaluate(() => {
    /* Siskind's Type A on D: D3 F3 A3 C4, which crosses middle C by one note
       and is one hand. And a two-handed spread, which is not. */
    return {narrow: jazzChordStaff([50, 53, 57, 60]),
            wide: jazzChordStaff([41, 60, 64, 67]),
            high: jazzChordStaff([55, 60, 65, 71]),
            allBass: jazzChordStaff([43, 47, 50, 53]),
            allTreble: jazzChordStaff([60, 64, 67, 71])};
  });
  is('D3-F3-A3-C4 stays whole, on the bass', grab.narrow, 2);
  is('  and so does anything wholly under middle C', grab.allBass, 2);
  is('  or wholly over it', grab.allTreble, 1);
  is('a spread of two octaves is two hands, so two staves', grab.wide, null);
  is('  one that climbs too high for the bass goes on the treble instead', grab.high, 1);

  console.log('\n2c. a split chord really is split at middle C');
  /* asked of every chord in the room that is split, in every key, rather than
     of one — a threshold moved a few semitones would miss the one */
  const cut = await p.evaluate(() => {
    const out = {splits: 0, wrong: []};
    Object.keys(jazzBook()).forEach(id => {
      const ex = jazzExercise(id); if(!jazzHasScore(ex)) return;
      JAZZ_KEY_NAMES.forEach(key => {
        const res = jazzScoreXml(ex, key, {interval: 'major3rd'});
        /* multi-example generators return an object — check each sub-score */
        const xmlList = (res && typeof res === 'object' && Array.isArray(res.documents))
          ? res.documents.map(d => d.mxl) : (res ? [res] : []);
        xmlList.forEach(xml => {
        if(!xml) return;
        [...T.parse(xml).querySelectorAll('measure')].forEach((m, bar) => {
          jazzStaffEvents(m).forEach(ev => {
            if(ev.notes.length < 2) return;
            const by = {1: [], 2: []};
            /* single-staff documents have no <staff> elements — skip them */
            ev.notes.forEach(n => {
              const st = n.querySelector('staff');
              if(!st) return;
              by[st.textContent].push(jazzPitchMidi(n.querySelector('pitch')));
            });
            if(!by[1].length || !by[2].length) return;
            out.splits++;
            if(!by[1].every(x => x >= 60) || !by[2].every(x => x < 60))
              out.wrong.push(`${id}/${key} bar ${bar + 1}: ${JSON.stringify(by)}`);
          });
        });
        }); /* xmlList.forEach */
      });
    });
    return out;
  });
  /* Not one chord in the shipped catalogue is wide enough to need splitting,
     which is not a surprise: it is a book about what one hand does, and one
     hand is one stave. So the room is asked whether any chord came out split
     at the wrong place, and the splitting itself is proved directly, on a
     two-handed chord written for the purpose — otherwise the branch is a
     defence nobody has ever fired. */
  is('nothing in the room came out split in the wrong place', cut.wrong, []);
  is('  and a two-handed chord is split at middle C', await p.evaluate(() => {
    const one = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0">
      <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
      <part id="P1"><measure number="1"><attributes><divisions>4</divisions>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef></attributes>
      ${[41, 57, 60, 64, 67].map((m, i) => `<note>${i ? '<chord/>' : ''}<pitch><step>${
        'CCDDEFFGGAAB'[m % 12]}</step><octave>${Math.floor(m / 12) - 1}</octave></pitch>
        <duration>16</duration><type>whole</type></note>`).join('')}
      </measure></part></score-partwise>`;
    const d = T.parse(jazzGrandStaff(one));
    const by = {1: [], 2: []};
    [...d.querySelectorAll('note')].forEach(n => { if(n.querySelector('rest')) return;
      by[n.querySelector('staff').textContent].push(jazzPitchMidi(n.querySelector('pitch'))); });
    return {bass: by[2].every(m => m < 60) && by[2].length > 0,
            treble: by[1].every(m => m >= 60) && by[1].length > 0,
            kept: by[1].length + by[2].length}; }),
    {bass: true, treble: true, kept: 5});

  console.log('\n2d. a line does not change clef in the middle of itself');
  /* In every key, not only in C: a phrase that sits safely over middle C in C
     is the same phrase a fourth lower in G flat, and that is where a rule
     decided bar by bar starts flipping.

     Read off what the GENERATOR wrote rather than off the finished document,
     because a split chord leaves a lone note behind in the finished one and a
     lone note is indistinguishable from a melody note by then. */
  is('every exercise keeps its melody on one stave', await p.evaluate(() => {
    const hops = [];
    Object.keys(jazzBook()).forEach(id => {
      const ex = jazzExercise(id); if(!jazzHasScore(ex)) return;
      JAZZ_KEY_NAMES.forEach(key => {
        let raw; try { raw = T.raw(id, key); } catch(e){ return; }
        if(/<staves>/.test(raw)) return;        /* already a grand staff of its own */
        const xml = jazzGrandStaff(raw);
        const rawDoc = T.parse(raw), outDoc = T.parse(xml);
        const rawBars = [...rawDoc.querySelectorAll('measure')];
        const outBars = [...outDoc.querySelectorAll('measure')];
        const staves = new Set();
        rawBars.forEach((m, i) => jazzStaffEvents(m).forEach(ev => {
          if(ev.notes.length !== 1 || ev.notes[0].querySelector('rest')) return;
          const midi = jazzPitchMidi(ev.notes[0].querySelector('pitch'));
          /* find the same pitch in the finished bar and read its stave */
          const same = [...outBars[i].querySelectorAll('note')].find(n => !n.querySelector('rest')
            && jazzPitchMidi(n.querySelector('pitch')) === midi);
          if(same) staves.add(same.querySelector('staff').textContent);
        }));
        if(staves.size > 1) hops.push(`${id}/${key}`);
      });
    });
    return hops; }), []);
  /* And that holds for the shipped catalogue whether the hand is decided once
     or once a bar, because none of these phrases wanders far enough for the
     two to disagree. Which makes the claim above worth nothing on its own —
     so here is a phrase that does wander, written for the purpose: a bar over
     middle C and a bar under it. Decided bar by bar it changes clef halfway;
     decided once it does not. */
  is('  and a phrase that wanders across middle C still keeps one', await p.evaluate(() => {
    const bar = (n, midis) => `<measure number="${n}">${n === 1 ? `<attributes><divisions>4</divisions>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef></attributes>` : ''}${
      midis.map(m => `<note><pitch><step>${'CCDDEFFGGAAB'[m % 12]}</step><octave>${
        Math.floor(m / 12) - 1}</octave></pitch><duration>4</duration><type>quarter</type></note>`).join('')}</measure>`;
    const doc = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0">
      <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
      <part id="P1">${bar(1, [67, 69, 71, 72])}${bar(2, [59, 57, 55, 53])}</part></score-partwise>`;
    const d = T.parse(jazzGrandStaff(doc));
    const staves = [...d.querySelectorAll('note')].filter(n => !n.querySelector('rest'))
      .map(n => n.querySelector('staff').textContent);
    return [...new Set(staves)]; }), ['1']);

  /* ------------------------------------------------------------------ */
  console.log('\n3. the silent stave is written as silence, correctly');
  const rests = await p.evaluate(() => {
    const d = T.parse(jazzScoreXml(jazzExercise('2.1'), 'C', {}));
    const r = [...d.querySelectorAll('note')].filter(n => n.querySelector('rest'));
    return {n: r.length,
      measured: r.every(x => x.querySelector('rest').getAttribute('measure') === 'yes'),
      typed: r.every(x => x.querySelector('type')?.textContent === 'whole'),
      dotted: r.filter(x => x.querySelector('dot')).length,
      staffed: r.every(x => x.querySelector('staff')),
      voiced: r.every(x => x.querySelector('voice'))};
  });
  is('one for each empty bar', rests.n, 3);
  yes('  each a bar’s rest', rests.measured);
  yes('  drawn as a whole rest whatever the metre', rests.typed);
  is('  and never a dotted one', rests.dotted, 0);
  yes('  each on a stave and in a voice', rests.staffed && rests.voiced);

  console.log('\n3b. the two staves of a bar are the same length');
  is('every backup is exactly one bar', await p.evaluate(() => {
    const wrong = [];
    ['2.1','6.1','12.1','12.2','9.1','3.2'].forEach(id => {
      const d = T.parse(jazzScoreXml(jazzExercise(id), 'C', {}));
      [...d.querySelectorAll('measure')].forEach((m, i) => {
        const back = m.querySelector('backup');
        if(!back) { wrong.push(`${id} bar ${i + 1}: no backup`); return; }
        let before = 0, after = 0, seen = false;
        [...m.children].forEach(el => {
          if(el === back){ seen = true; return; }
          if(el.tagName !== 'note') return;
          if([...el.children].some(c => c.tagName === 'chord')) return;
          const d2 = +(el.querySelector('duration')?.textContent || 0);
          if(seen) after += d2; else before += d2;
        });
        const bd = +back.querySelector('duration').textContent;
        if(before !== bd || after !== bd) wrong.push(`${id} bar ${i + 1}: ${before}/${bd}/${after}`);
      });
    });
    return wrong; }), []);

  /* ------------------------------------------------------------------ */
  console.log('\n4. a generator that already writes a grand staff is left alone');
  is('the blues is untouched by the pass', await p.evaluate(() => {
    const raw = T.raw('5.1b', 'C');    /* the shells over a bass in two */
    return /<staves>2<\/staves>/.test(raw) ? (jazzGrandStaff(raw) === raw) : 'not a grand-staff generator';
  }), true);

  /* ------------------------------------------------------------------ */
  console.log('\n5. it actually draws, and it draws on two staves');
  await p.evaluate(() => { location.hash = '#/jazz/2.1'; }); await p.waitForTimeout(2600);
  /* The engraver draws barlines as <rect>s, one per stave, and on a grand
     staff also one that runs the whole way down and joins the two. So the
     number of heights they start at is the number of staves, and a full-height
     one is the brace-line that makes them a system.

     Height alone would prove nothing: the single-staff version of a left-hand
     voicing is tall too, because the chords hang five ledger lines under the
     stave — which is the whole complaint. */
  const drew = await p.evaluate(async () => {
    const read = svg => {
      if(!svg) return {rows: 0, joined: 0};
      const bars = [...svg.querySelectorAll('rect')].map(r => ({
        y: Math.round(+r.getAttribute('y')), h: +r.getAttribute('height')}));
      return {rows: new Set(bars.map(x => x.y)).size, joined: bars.filter(x => x.h > 100).length};
    };
    const grand = read(document.querySelector('#jzScore svg'));
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;left:-9999px;width:800px';
    document.body.appendChild(box);
    await jazzEngrave(box, T.raw('2.1', 'C'));       /* as the generator writes it */
    await new Promise(r => setTimeout(r, 700));
    const one = read(box.querySelector('svg'));
    box.remove();
    return {grand, one};
  });
  yes('the engraver drew it', drew.grand.rows > 0, JSON.stringify(drew));
  is('  on two staves', drew.grand.rows, 2);
  is('  where the score the generator wrote is on one', drew.one.rows, 1);
  yes('  with barlines running through both, as a system\u2019s do',
      drew.grand.joined > 0 && drew.one.joined === 0, JSON.stringify(drew));

  console.log('\n5b. and what the editor reads is the grand staff too');
  is('the score it opens on has both clefs', await p.evaluate(() => {
    const xml = jazzScoreFor('2.1', jazzExercise('2.1'), 'C', {});
    return /<staves>2<\/staves>/.test(xml) && /<sign>F<\/sign>/.test(xml); }), true);

  /* ------------------------------------------------------------------ */
  console.log('\n6. an edited score is drawn instead of the generator’s');
  is('nothing is overridden until something is saved', await p.evaluate(() => {
    jazzClearEdited('2.1');
    const gen = jazzScoreXml(jazzExercise('2.1'), 'C', {});
    return jazzScoreFor('2.1', jazzExercise('2.1'), 'C', {}) === gen; }), true);
  is('  a saved score takes over', await p.evaluate(() => {
    const model = jazzXmlToScore(jazzScoreXml(jazzExercise('2.1'), 'C', {}), '2.1', 'C');
    model.staffConfig = 'bass';
    jazzSetEdited('2.1', model);
    const out = jazzScoreFor('2.1', jazzExercise('2.1'), 'C', {});
    return /<sign>F<\/sign>/.test(out) && !/<staves>2<\/staves>/.test(out); }), true);
  yes('  and the page says so', await p.evaluate(() =>
    /edited this score/.test(jazzEditedBannerHTML('2.1'))));
  is('  and it can be put back', await p.evaluate(() => {
    jazzClearEdited('2.1');
    const gen = jazzScoreXml(jazzExercise('2.1'), 'C', {});
    return jazzScoreFor('2.1', jazzExercise('2.1'), 'C', {}) === gen; }), true);

  console.log('\n6b. a score edited in one key is right in the others');
  is('the notes move with the key', await p.evaluate(() => {
    const model = jazzXmlToScore(jazzScoreXml(jazzExercise('2.1'), 'C', {}), '2.1', 'C');
    jazzSetEdited('2.1', model);
    const inC = T.pitches(jazzScoreToXml(model, 'C'))[0];
    const inEb = T.pitches(jazzScoreToXml(model, 'Eb'))[0];
    jazzClearEdited('2.1');
    /* same number of notes, every one of them three semitones up */
    const moved = inC.length === inEb.length && inC.length > 0 &&
      inC.every((m, i) => inEb[i] - m === 3);
    return [inC.length === inEb.length, moved]; }), [true, true]);

  /* ------------------------------------------------------------------ */
  console.log('\n— errors —');
  is('no page errors', errs, []);
  console.log(bad ? `\n${bad} FAILED` : '\nall good');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
