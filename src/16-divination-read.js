/* ============================================================
   READING A CARD

   The deck in 16-divination.js identifies the cards; the deck in
   16-divination-cards.js says what they mean at length. This file is what
   joins them and turns the result into something to look at: one card as a
   card rather than as a line of text, and a spread as a reading rather
   than as a list.

   Nothing here calls anything. The narrative at the end of a spread is
   assembled out of the cards' own themes and essences by template — it is
   not meant to be profound, only to join the dots far enough that the
   person reading has somewhere to start. The part that matters is the box
   underneath it, which is theirs.
   ============================================================ */

/* one card, whole: the short identification joined to the long meaning */
function tarotCard(i){
  const c = TAROT[i]; if(!c) return null;
  const r = (typeof TAROT_RICH !== 'undefined' && TAROT_RICH[i]) || null;
  const side = (k, plain) => r && r[k] ? {
    summary: r[k].s, themes: r[k].t || [], inDepth: r[k].d || '',
    questions: r[k].q || [], advice: r[k].a || '', plain,
  } : {summary: plain, themes: (c.k || []).slice(0, 4), inDepth: '', questions: [], advice: '', plain};
  return {
    id: i, name: c.n, suit: c.s, number: c.r,
    arcana: c.s === 'major' ? 'major' : 'minor',
    keywords: c.k || [],
    imagery: r ? r.im : '', essence: r ? r.es : '',
    element: r ? r.el : (SUIT_ELEM[c.s] || null),
    planet: r ? r.pl : null,
    numerology: r ? {number: c.r, meaning: r.nu} : null,
    relatedCards: r ? (r.rel || []) : [],
    upright: side('u', c.u), reversed: side('v', c.v),
    positionGuidance: r && r.pg ? {past: r.pg[0], present: r.pg[1], future: r.pg[2],
      advice: r.pg[3], obstacle: r.pg[4], outcome: r.pg[5]} : null,
  };
}
const tarotSide = pick => { const c = tarotCard(pick.card); return c && (pick.rev ? c.reversed : c.upright); };

/* Which of the six kinds of position a slot in a spread is — the Tower in
   the past is not the Tower in the outcome, and the card carries a line for
   each. It used to be a table keyed by spread id; it lives on the spread's
   own positions now (see tarotSlot in 16-divination-spreads.js), which is
   the only thing that survives twenty spreads instead of five. */

/* ---------- the face of a card ----------
   The face is Smith's drawing; this is what stands in for it if the
   pictures are ever not there — a sigil that is the card's own, and the
   name. Nothing here is illustrative, but it is a card, and it is
   different from every other card in the deck.

   Major Arcana get a star polygon of their own number of points, drawn by
   stepping round the circle: twenty-two figures, each geometrically
   distinct, none of them decided by hand. Minor Arcana get their suit's
   mark, as many times as the card's number, which is how a pip card has
   always said what it is. */
function tarotSigilSVG(card, size = 64){
  const R = size / 2 - 2, C = size / 2;
  const col = SUIT_COLOR[card.suit] || '#8f7bb0';
  const pt = (a, r) => `${(C + Math.cos(a - Math.PI/2) * r).toFixed(2)},${(C + Math.sin(a - Math.PI/2) * r).toFixed(2)}`;
  if(card.arcana === 'major'){
    const n = card.number;
    const p = 3 + (n % 9);                       /* 3 to 11 points */
    const step = 1 + (Math.floor(n / 3) % Math.max(Math.floor(p / 2), 1)); /* how far round each stroke reaches */
    let d = '';
    if(step === 1){
      d = `M${pt(0, R)} ` + Array.from({length: p}, (_, i) => `L${pt(2*Math.PI*i/p, R)}`).join(' ') + ' Z';
    } else {
      /* a star polygon {p/step}: keep stepping until the path closes */
      const seen = new Set(); let cur = 0; const parts = [];
      while(!seen.has(cur)){ seen.add(cur); parts.push(pt(2*Math.PI*cur/p, R)); cur = (cur + step) % p; }
      d = `M${parts[0]} ` + parts.slice(1).map(q => `L${q}`).join(' ') + ' Z';
    }
    const inner = (n % 2) ? `<circle cx="${C}" cy="${C}" r="${(R*.34).toFixed(1)}" fill="none" stroke="${col}" stroke-width="1" opacity=".55"/>` : '';
    const bar = (n >= 11) ? `<line x1="${(C-R*.8).toFixed(1)}" y1="${C}" x2="${(C+R*.8).toFixed(1)}" y2="${C}" stroke="${col}" stroke-width=".8" opacity=".35"/>` : '';
    return `<svg class="tc-sig" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${C}" cy="${C}" r="${R.toFixed(1)}" fill="none" stroke="${col}" stroke-width=".8" opacity=".35"/>
      ${bar}<path d="${d}" fill="none" stroke="${col}" stroke-width="1.3" stroke-linejoin="round" opacity=".9"/>${inner}</svg>`;
  }
  /* pips: the suit's mark, as many as the number, laid out in a courtly
     column for the four faces and in rows for the rest */
  const gl = SUIT_GLYPH[card.suit] || '✦';
  const court = ['', '', '', '', '', '', '', '', '', '', '', 'P', 'N', 'Q', 'K'][card.number] || '';
  if(court) return `<svg class="tc-sig" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${C}" cy="${C}" r="${R.toFixed(1)}" fill="none" stroke="${col}" stroke-width=".8" opacity=".35"/>
    <text x="${C}" y="${(C - R*.12).toFixed(1)}" text-anchor="middle" font-size="${(size*.30).toFixed(0)}" fill="${col}" opacity=".9">${gl}</text>
    <text x="${C}" y="${(C + R*.62).toFixed(1)}" text-anchor="middle" font-size="${(size*.22).toFixed(0)}" fill="${col}" opacity=".7" font-family="var(--serif)">${court}</text></svg>`;
  const n = Math.max(card.number, 1), cols = n <= 3 ? 1 : n <= 8 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  let g = '';
  for(let i = 0; i < n; i++){
    const r = Math.floor(i / cols), c2 = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const x = C + (c2 - (inRow - 1) / 2) * (size * .26);
    const y = C - (rows - 1) / 2 * (size * .24) + r * (size * .24) + size * .07;
    g += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="${(size*.20).toFixed(0)}" fill="${col}" opacity=".85">${gl}</text>`;
  }
  return `<svg class="tc-sig" viewBox="0 0 ${size} ${size}" aria-hidden="true">${g}</svg>`;
}

/* the back: the same for every card, so that a spread face-down is a spread
   and not a row of different things */
function tarotBackHTML(){
  return `<div class="tc-back"><svg viewBox="0 0 60 90" aria-hidden="true">
    <rect x="3" y="3" width="54" height="84" rx="5" fill="none" stroke="currentColor" stroke-width=".7" opacity=".45"/>
    <rect x="7" y="7" width="46" height="76" rx="3" fill="none" stroke="currentColor" stroke-width=".4" opacity=".3"/>
    ${[0,1,2,3,4,5,6,7].map(i => { const a = i * Math.PI / 4;
      return `<line x1="30" y1="45" x2="${(30 + Math.cos(a) * 15).toFixed(1)}" y2="${(45 + Math.sin(a) * 15).toFixed(1)}" stroke="currentColor" stroke-width=".5" opacity=".5"/>`; }).join('')}
    <circle cx="30" cy="45" r="15" fill="none" stroke="currentColor" stroke-width=".6" opacity=".55"/>
    <circle cx="30" cy="45" r="8" fill="none" stroke="currentColor" stroke-width=".5" opacity=".45"/>
    <circle cx="30" cy="45" r="2.4" fill="currentColor" opacity=".7"/>
    <text x="30" y="22" text-anchor="middle" font-size="7" fill="currentColor" opacity=".6">✦</text>
    <text x="30" y="72" text-anchor="middle" font-size="7" fill="currentColor" opacity=".6">✦</text>
  </svg></div>`;
}

/* a whole card, face and back, ready to be turned */
/* a whole card, face and back, ready to be turned.

   The face is Pamela Colman Smith's drawing in the colours Rider printed
   it in, which is the card: it carries
   its own title along the bottom and its own numeral at the top, the way a
   tarot card has since 1909, so nothing needs printing over it. The name
   goes under the card instead, where it can arrive out of noise without
   covering the picture — and a reversed card is simply the card the other
   way up, title and all, which is how a reversed card has always been read.

   The paper stays paper in either theme. A card is a printed object; it
   does not turn dark because the room did. */
/* The images are stored as bare base64 to save writing the same prefix
   seventy-eight times; this puts it back. */
function tarotArtURL(i){
  const b = typeof TAROT_ART !== 'undefined' ? TAROT_ART[i] : null;
  return b ? 'data:image/webp;base64,' + b : '';
}
function tarotFaceHTML(card){
  const art = tarotArtURL(card.id);
  return art
    ? `<img class="tc-art" src="${art}" alt="" draggable="false" decoding="async">`
    : `<div class="tc-sigwrap">${tarotSigilSVG(card, 64)}</div>
       <div class="tc-name serif">${esc(card.name)}</div>`;
}
function tarotCardHTML(pick, pos, faceUp){
  const card = tarotCard(pick.card); if(!card) return '';
  const col = SUIT_COLOR[card.suit] || '#8f7bb0';
  return `<div class="tc ${faceUp ? 'up' : ''} ${pick.rev ? 'rev' : ''}" data-tc="${pos}" style="--sc:${col}">
    <div class="tc-inner">
      ${tarotBackHTML()}
      <div class="tc-face sheen">${tarotFaceHTML(card)}</div>
    </div></div>`;
}

/* the caption under a card: the name, arriving as the card turns, and the
   word that says which way up it landed */
function tarotCaptionHTML(pick){
  const card = tarotCard(pick.card); if(!card) return '';
  return `<div class="tc-cap"><span class="tc-cap-name serif"></span>${
    pick.rev ? '<span class="tc-cap-rev mono">reversed</span>' : ''}</div>`;
}

/* ---------- the reading ----------
   The old result was a list: position, name, three keywords, one line. That
   asks a person to interpret cards they may never have met from a
   comma-separated summary. This gives them the card: what it shows, what it
   says in one line, at length, in the position it landed in, and two or
   three questions to put to themselves. Then the box, which is the point. */
function tarotCardReadHTML(pick, posName, slot){
  const card = tarotCard(pick.card); if(!card) return '';
  const s = pick.rev ? card.reversed : card.upright;
  const col = SUIT_COLOR[card.suit] || '#8f7bb0';
  const guide = card.positionGuidance ? card.positionGuidance[slot] : '';
  const paras = (s.inDepth || '').split('\n\n').filter(Boolean);
  return `<section class="dv-card-read" style="--sc:${col}">
    <h4 class="dv-cr-h">${posName ? `<span class="dv-cr-pos">${esc(posName)}</span>` : ''}
      <span class="dv-cr-name">${esc(card.name)}${pick.rev ? ' (reversed)' : ''}</span></h4>
    ${card.essence ? `<blockquote class="dv-cr-ess">${esc(card.essence)}<cite>the card's essence</cite></blockquote>` : ''}
    ${s.themes.length ? `<div class="dv-cr-themes mono">${esc(s.themes.join('  ·  '))}</div>` : ''}
    ${s.summary ? `<p class="dv-cr-sum">${esc(s.summary)}</p>` : ''}
    ${paras.map(t => `<p class="dv-cr-t">${esc(t)}</p>`).join('')}
    ${guide ? `<div class="dv-cr-guide"><span class="mono">in a ${esc(slot)} position</span><p>${esc(guide)}</p></div>` : ''}
    ${s.questions.length ? `<ul class="dv-cr-q">${s.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
    ${s.advice ? `<p class="dv-cr-adv">${esc(s.advice)}</p>` : ''}
    ${card.imagery ? `<details class="dv-cr-im"><summary>what the card shows</summary><p>${esc(card.imagery)}</p></details>` : ''}
  </section>`;
}

/* ---------- the story ----------
   Three cards on a table are three cards until something reads them as one
   sentence. This is a template, not a divination: it takes the themes and
   the essences the cards already carry and joins them into a paragraph, so
   that the person has a first sentence to disagree with. The disagreeing is
   where the reading actually happens. */
function tarotNarrative(picks, sp){
  if(!sp) return '';
  /* the one spread whose answer is a word: say the word, then take it back
     a little, because a card is not a coin */
  if(sp.id === 'yesno' && picks.length){
    const c = tarotCard(picks[0].card), s2 = tarotSide(picks[0]) || {themes: []};
    const t = (s2.themes[0] || '').toLowerCase();
    return `${picks[0].rev ? 'Leaning no' : 'Leaning yes'} — ${c.name}${picks[0].rev ? ' reversed' : ''}. `
      + `But the lean is the smaller half of it: what the card actually puts in front of you is ${t || 'the thing you asked about'}, `
      + `and that is the answer you can do something with. ${(c.essence || '').replace(/[.!]$/, '')}.`;
  }
  if(picks.length < 3) return '';
  const side = i => tarotSide(picks[i]) || {themes: []};
  const card = i => tarotCard(picks[i].card) || {name: '', essence: ''};
  const nm = i => card(i).name + (picks[i].rev ? ' reversed' : '');
  const th = (i, n = 0) => (side(i).themes[n] || side(i).themes[0] || 'something unnamed').toLowerCase();
  const ess = i => (card(i).essence || '').replace(/[.!]$/, '');
  const lower = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  if(sp.id === 'ppf'){
    return `Behind you is ${th(0)} and ${th(0, 1)} — ${nm(0)}. That is what has brought you to a present `
      + `marked by ${th(1)} (${nm(1)}), and the movement from here runs toward ${th(2)} and ${th(2, 1)} (${nm(2)}). `
      + `Read as one line: from ${lower(ess(0))}, through ${lower(ess(1))}, to ${lower(ess(2))}.`;
  }
  if(sp.id === 'sao'){
    return `The situation is one of ${th(0)} — ${nm(0)}. What it asks of you is ${th(1)} (${nm(1)}), `
      + `and where that leads is ${th(2)} and ${th(2, 1)} (${nm(2)}). In short: ${lower(ess(1))}, `
      + `and ${lower(ess(2))}.`;
  }
  if(sp.id === 'relationship'){
    return `You are carrying ${th(0)} into this (${nm(0)}) and they are carrying ${th(1)} (${nm(1)}). `
      + `What is actually between you is ${th(2)} — ${nm(2)}. The difficulty is ${th(3)} (${nm(3)}), `
      + `and the counsel is plain enough: ${lower(ess(4))} (${nm(4)}).`;
  }
  if(sp.id === 'celtic_cross'){
    return `At the heart of it is ${th(0)} (${nm(0)}), crossed by ${th(1)} (${nm(1)}). `
      + `It is rooted in ${th(2)} and it came out of ${th(3)}. What could be is ${th(4)}; what comes next is ${th(5)}. `
      + `You are in it as ${th(6)}, surrounded by ${th(7)}, hoping for and fearing ${th(8)} — `
      + `and where it lands is ${th(9)}: ${lower(ess(9))} (${nm(9)}).`;
  }
  /* the rest of the twenty, by shape rather than by name — a spread whose
     positions are a sequence reads as a sequence, one built around a centre
     reads outward from the centre, and the others read end to end */
  const last = picks.length - 1;
  if(sp.layout === 'cross' || sp.layout === 'pyramid'){
    return `At the centre of this is ${th(0)} — ${nm(0)}. Around it: ${th(1)} (${nm(1)}), `
      + `${th(2)} (${nm(2)})${picks.length > 3 ? `, and under all of it ${th(picks.length - 1)} (${nm(last)})` : ''}. `
      + `Read from the middle out: ${lower(ess(0))}, and then ${lower(ess(last))}.`;
  }
  if(sp.layout === 'column' || sp.layout === 'circle'){
    return `Laid round, the weight of this falls on ${sp.pos[0]} and ${sp.pos[last]}: ${nm(0)} at one end `
      + `and ${nm(last)} at the other, with ${th(Math.floor(picks.length / 2))} in the middle of it. `
      + `The whole of it is ${lower(ess(0))} becoming ${lower(ess(last))}.`;
  }
  if(sp.layout === 'grid' || sp.layout === 'horseshoe'){
    return `It opens on ${th(0)} (${nm(0)}), turns on ${th(Math.floor(picks.length / 2))} `
      + `(${nm(Math.floor(picks.length / 2))}) and closes on ${th(last)} (${nm(last)}). `
      + `The line through it: ${lower(ess(0))}, then ${lower(ess(last))}.`;
  }
  const names = picks.map((_, i) => nm(i));
  return `Taken together, these run from ${th(0)} through ${th(1)} to ${th(last)} — `
    + `${names.join(', ')}. The line through them is ${lower(ess(0))}, arriving at ${lower(ess(last))}.`;
}

/* The whole reading, under the spread. Built once, when the last card has
   been turned. */
function tarotReadingHTML(picks, sp){
  const story = tarotNarrative(picks, sp);
  return `<div class="dv-reading">
    ${picks.map((pk, i) => tarotCardReadHTML(pk, sp.pos[i], tarotSlot(sp.id, i))).join('')}
    ${story ? `<section class="dv-story"><h4 class="dv-sec-h">The story</h4><p>${esc(story)}</p>
      <div class="mono faint">Read as one line. Where it is wrong is where your own reading starts.</div></section>` : ''}
  </div>`;
}

/* ---------- the text that arrives rather than appearing ----------
   A name that fades in has been displayed. A name that resolves out of
   noise has been received, which is closer to what a card is for. Two
   hundred milliseconds of characters settling, left to right; nothing at
   all if the reader has asked for less motion. */
/* Marks and characters, not letters. A name coming out of scrambled Latin
   reads as a loading state; a name coming out of 道夢光風空心 and a handful of
   marks reads as something being deciphered, which is what the moment is. */
const SCRAMBLE_GLYPHS = '✦✧◇◈○●△▽☰☷⚹✶⁂※∴∵⌖道夢光風空心';
function scrambleInto(el, text, ms = 900){
  if(!el) return;
  if(typeof reduced === 'function' && reduced()){ el.textContent = text; return; }
  const chars = [...text];
  const settleAt = chars.map((_, i) => (i + 1) / chars.length * ms * .82 + Math.random() * ms * .18);
  const t0 = performance.now();
  const tick = now => {
    const t = now - t0;
    el.textContent = chars.map((c, i) => {
      if(t >= settleAt[i] || c === ' ') return c;
      return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
    }).join('');
    if(t < ms) requestAnimationFrame(tick);
    else el.textContent = text;
  };
  requestAnimationFrame(tick);
}

/* ============================================================
   THE HEXAGRAM, DRAWN AND READ

   Six lines three pixels thick with a small × beside the moving ones is an
   accurate diagram and it is not a hexagram — the thing is meant to be
   looked at. The lines here are the width of the column and thick enough
   to read across a room, numbered up the side in the order they were cast,
   with the changing ones breathing.

   And the coin method exists in order to single out particular lines. A
   reading that names the moving lines and then does not say what they say
   has thrown away the only reason to use coins rather than pick a hexagram
   out of a hat. So the moving lines are given, in full, in their place.
   ============================================================ */
/* The eight are written out once, in TRIGRAM_FULL — symbol, sound,
   character, attributes, image, element and quarter of the compass. There
   used to be a second, shorter copy here; two copies of eight things is
   two copies that drift. */
const ichingRich = n => (typeof ICHING_RICH !== 'undefined' && ICHING_RICH[n - 1]) || null;

/* The six lines, bottom to top. The figure itself is drawn by
   ichingFigureHTML in 16-divination-ichingcast.js — this is the name the
   rest of the app already calls it by, kept so a hexagram is one drawing
   wherever it appears rather than two that drift apart. */
function ichingLinesHTML(lines, cls = ''){
  return ichingFigureHTML(lines, {small: /small/.test(cls), cls});
}

/* the trigrams a hexagram is made of, which is how it is named and how
   anyone who reads the book actually recognises it */
function ichingTrigramsHTML(bin){
  const lower = hexLower(bin), upper = hexUpper(bin);
  if(!lower || !upper) return '';
  const plain = t => t.en.split(' · ')[0];
  return `<div class="ic-tri mono">${trigramMark(upper)} ${esc(plain(upper))} above · ${trigramMark(lower)} ${esc(plain(lower))} below</div>`;
}

/* The coin is drawn in 16-divination-ichingcast.js, where the cast is —
   it has two faces and a tumble now, which is more than a render helper. */

/* What the movement between the two hexagrams is, said rather than only
   drawn. Template-built out of the two names and the lines actually in
   motion, like the tarot's story paragraph and for the same reason: to get
   the reader as far as a first sentence of their own. */
function ichingMovementText(h, rel, moving){
  const where = moving.length === 1
    ? `Line ${moving[0] + 1} is the one in motion`
    : `Lines ${moving.map(i => i + 1).join(', ').replace(/, (\d+)$/, ' and $1')} are in motion`;
  const rh = typeof ichingRich === 'function' ? ichingRich(h.i) : null;
  const rr2 = typeof ichingRich === 'function' ? ichingRich(rel.i) : null;
  const first = t => t ? (t.split(/(?<=\.)\s/)[0] || t) : '';
  const lower = t => t.replace(/^[A-Z]/, c => c.toLowerCase()).replace(/\.$/, '');
  return `This reading moves from ${h.c} ${h.n} toward ${rel.c} ${rel.n}. ${where}, `
    + `which is where the situation is already giving way. `
    + (rh ? `What you have is ${lower(first(rh.d))} — ` : '')
    + (rr2 ? `what it is becoming is ${lower(first(rr2.d))}.` : `${rel.n} is what it becomes.`);
}

/* the whole reading: judgment and what it is saying, the image, every
   changing line in its place, what the reading is turning into, and
   questions to put to yourself */
function ichingReadingHTML(lines, h, rel){
  const r = ichingRich(h.i), rr = rel ? ichingRich(rel.i) : null;
  const moving = lines.map((l, i) => l.moving ? i : -1).filter(i => i >= 0);
  const paras = r ? r.d.split('\n\n').filter(Boolean) : [];
  return `<div class="ic-reading">
    <section class="ic-sec"><h4 class="dv-sec-h">Judgment</h4>
      <blockquote class="ic-quote">${esc(h.j)}</blockquote>
      ${paras.map(t => `<p class="dv-cr-t">${esc(t)}</p>`).join('')}</section>
    <section class="ic-sec"><h4 class="dv-sec-h">Image</h4>
      <blockquote class="ic-quote">${esc(h.m)}</blockquote>
      ${r ? `<p class="dv-cr-t">${esc(r.mi)}</p>` : ''}</section>
    ${moving.length ? `<section class="ic-sec"><h4 class="dv-sec-h">Changing line${moving.length === 1 ? '' : 's'}</h4>
      ${moving.map(i => `<div class="ic-lineread"><span class="mono">line ${i + 1}</span>
        <p>${esc(r ? r.L[i] : '')}</p></div>`).join('')}
      <p class="mono faint">A changing line is the part of the situation that is already in motion. It is why the reading has a second hexagram.</p>
      </section>` : `<p class="mono faint">No changing lines: the situation is not, for the moment, in motion.</p>`}
    ${rel ? `<section class="ic-sec ic-moving"><h4 class="dv-sec-h">The movement</h4>
      <p class="dv-cr-t">${esc(ichingMovementText(h, rel, moving))}</p>
      <div class="ic-relhead"><b class="serif">${rel.i}. ${esc(rel.n)}</b> <span class="mono faint">${esc(rel.c)}</span></div>
      ${ichingLinesHTML(lines.map(l => ({v: l.moving ? (l.v ? 0 : 1) : l.v, moving: false,
        total: (l.moving ? (l.v ? 0 : 1) : l.v) ? 7 : 8})), 'small')}
      <blockquote class="ic-quote">${esc(rel.j)}</blockquote>
      ${rr ? `<p class="dv-cr-t">${esc(rr.d.split('\n\n')[0])}</p>` : ''}
      <p class="mono faint">The second hexagram is not a prediction. It is what this situation becomes if the
        lines already in motion finish moving — which they may not.</p></section>` : ''}
    ${r && r.q.length ? `<section class="ic-sec"><h4 class="dv-sec-h">Questions</h4>
      <ul class="dv-cr-q">${r.q.map(q => `<li>${esc(q)}</li>`).join('')}</ul></section>` : ''}
  </div>`;
}
