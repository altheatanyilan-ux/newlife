/* ============================================================
   CONSULTING THE BOOK OF CHANGES

   The old version tossed three coins by writing three characters into a
   box and calling it a cast. This is the ceremony: the coins go up, they
   tumble, they come down one after another and not together, and the line
   they make draws itself into a figure that is built from the bottom up
   because that is the direction a hexagram grows.

   Two methods, because there are two. Three coins is what most people use
   and it is quick. Fifty yarrow stalks is the older one, it takes longer,
   and — this is the part that matters and is usually got wrong — it does
   not produce the same distribution. Under the coins every line is equally
   likely to be moving; under the stalks a moving yang is three times more
   likely than a moving yin. The readings have a different character, and a
   simulation that pretends otherwise is a simulation of the wrong thing.
   ============================================================ */

/* ---------- the eight trigrams, at length ----------
   A hexagram is two of these stacked, and anyone learning the book learns
   the trigrams first. The short version lives in TRIGRAMS, keyed by the
   three bits bottom-to-top; this is the same eight with everything else
   the reader wants. */
const TRIGRAM_FULL = {
  '111': {sym:'☰', pin:'Qián', cn:'乾', en:'Heaven · the Creative',
    attr:'Strong, active, initiating, firm', img:'The sky. The father. The dragon.',
    el:'Metal', dir:'Northwest'},
  '000': {sym:'☷', pin:'Kūn', cn:'坤', en:'Earth · the Receptive',
    attr:'Yielding, devoted, nourishing, patient', img:'The earth. The mother. The mare.',
    el:'Earth', dir:'Southwest'},
  '101': {sym:'☲', pin:'Lí', cn:'離', en:'Fire · the Clinging',
    attr:'Radiant, clear-sighted, dependent on what it burns', img:'Fire. The sun. Lightning.',
    el:'Fire', dir:'South'},
  '010': {sym:'☵', pin:'Kǎn', cn:'坎', en:'Water · the Abysmal',
    attr:'Dangerous, flowing, deep, brave by necessity', img:'Water. The moon. Rain in a ravine.',
    el:'Water', dir:'North'},
  '100': {sym:'☳', pin:'Zhèn', cn:'震', en:'Thunder · the Arousing',
    attr:'Shocking, decisive, sudden, setting things in motion', img:'Thunder. The eldest son. Spring.',
    el:'Wood', dir:'East'},
  '011': {sym:'☴', pin:'Xùn', cn:'巽', en:'Wind · the Gentle',
    attr:'Penetrating, flexible, persistent, working by degrees', img:'Wind. Wood. The eldest daughter.',
    el:'Wood', dir:'Southeast'},
  '001': {sym:'☶', pin:'Gèn', cn:'艮', en:'Mountain · Keeping Still',
    attr:'Still, resting, immovable, turned inward', img:'The mountain. The youngest son. The hand.',
    el:'Earth', dir:'Northeast'},
  '110': {sym:'☱', pin:'Duì', cn:'兌', en:'Lake · the Joyous',
    attr:'Open, glad, reflective, pleasing', img:'The lake. The youngest daughter. An open mouth.',
    el:'Metal', dir:'West'},
};
const trigramOf = bits => TRIGRAM_FULL[bits] || TRIGRAM_FULL['111'];
/* ☰ ☱ ☲ ☳ ☴ ☵ ☶ ☷ are in Unicode and in almost no font this app loads, so
   they came out as dotted boxes. A trigram is three lines; drawing the
   three lines is both more reliable and more honest than hoping. */
function trigramGlyph(bits, size){
  const w = size || 13, h = w * .82, t = Math.max(1.4, w * .13), gap = (h - 3 * t) / 2;
  return `<svg class="ic-tg" viewBox="0 0 ${w} ${h.toFixed(1)}" width="${w}" height="${h.toFixed(1)}" aria-hidden="true">${
    [2, 1, 0].map((i, row) => {
      const y = (row * (t + gap)).toFixed(2);
      return bits[i] === '1'
        ? `<rect x="0" y="${y}" width="${w}" height="${t}" rx="${(t / 2).toFixed(1)}"/>`
        : `<rect x="0" y="${y}" width="${(w * .38).toFixed(1)}" height="${t}" rx="${(t / 2).toFixed(1)}"/>`
          + `<rect x="${(w * .62).toFixed(1)}" y="${y}" width="${(w * .38).toFixed(1)}" height="${t}" rx="${(t / 2).toFixed(1)}"/>`;
    }).join('')}</svg>`;
}
/* the bits a trigram was built from, so a drawn glyph can be asked for by
   the same object everything else passes around */
Object.keys(TRIGRAM_FULL).forEach(b => { TRIGRAM_FULL[b].bits = b; });
const trigramMark = t => trigramGlyph(t.bits, 13);
const hexLower = bin => trigramOf(bin.slice(0, 3));
const hexUpper = bin => trigramOf(bin.slice(3, 6));

/* what the four totals are called, and the colour each is given */
const IC_LINE_KIND = {
  6: {id:'oldyin',   name:'old yin',     short:'moving yin',   moving:true,  c:'#a0727e'},
  7: {id:'youngyang',name:'young yang',  short:'yang',         moving:false, c:'#d4a44c'},
  8: {id:'youngyin', name:'young yin',   short:'yin',          moving:false, c:'#7f916a'},
  9: {id:'oldyang',  name:'old yang',    short:'moving yang',  moving:true,  c:'#b08968'},
};

/* ============================================================
   THE TWO METHODS
   ============================================================ */
/* Three coins. Two heads and a tail is seven, three of a kind moves. Every
   total but seven and eight is equally likely, which is why a coin cast
   throws moving lines about as often either way. */
function ichingTossCoins(){
  const coins = [0, 0, 0].map(() => Math.random() < .5 ? 2 : 3);
  return {coins, total: coins[0] + coins[1] + coins[2], method: 'coins'};
}

/* Fifty stalks, one set aside, three divisions of what is left. The count
   only ever depends on the size of the left heap modulo four — and a
   division drawn uniformly across the whole heap does NOT give uniform
   residues, which drags old yin from a sixteenth down to about a
   twentieth. Drawn from a window whose length is a multiple of four and
   centred in the heap, the classical figures come out exactly: old yin
   1/16, young yang 5/16, young yin 7/16, old yang 3/16. Which is also
   what a person dividing a bundle roughly in half is doing. */
function ichingYarrowSplit(stalks){
  const span = 4 * Math.floor((stalks - 3) / 4);
  const lo = 1 + Math.floor((stalks - 2 - span) / 2);
  return lo + Math.floor(Math.random() * span);
}
function ichingTossYarrow(){
  let stalks = 49;
  const rounds = [];
  for(let i = 0; i < 3; i++){
    const left = ichingYarrowSplit(stalks);
    const right = stalks - left - 1;              /* one held between the fingers */
    const lr = ((left - 1) % 4) + 1;
    const rr = ((right - 1) % 4) + 1;
    const taken = 1 + lr + rr;                    /* 5 or 9 first, then 4 or 8 */
    rounds.push({left, right, taken, was: stalks});
    stalks -= taken;
  }
  return {rounds, total: stalks / 4, method: 'yarrow'};
}
const ichingToss = method => method === 'yarrow' ? ichingTossYarrow() : ichingTossCoins();
const ichingLineOf = total => ({v: total % 2 ? 1 : 0, moving: total === 6 || total === 9, total});

/* ============================================================
   THE COIN

   方孔圓錢 — a round coin with a square hole, which is what a Chinese coin
   is and has been for two thousand years. Two faces: three raised dots for
   yang, two bars for yin, with 天 above the hole and 地 below. The two
   faces are the two sides of one object in 3D, so the tumble in the air is
   a real tumble and the coin lands showing whichever side is up.
   ============================================================ */
function ichingCoinFace(kind){
  const marks = kind === 'yang'
    /* three points: the value is three */
    ? `<circle cx="30" cy="15" r="2.6"/><circle cx="22.5" cy="45.5" r="2.6"/><circle cx="37.5" cy="45.5" r="2.6"/>`
    /* two bars, a broken line in miniature: the value is two */
    : `<rect x="18" y="13" width="10" height="2.6" rx="1.3"/><rect x="32" y="13" width="10" height="2.6" rx="1.3"/>
       <rect x="18" y="44.4" width="10" height="2.6" rx="1.3"/><rect x="32" y="44.4" width="10" height="2.6" rx="1.3"/>`;
  return `<svg class="ic-face ${kind}" viewBox="0 0 60 60" aria-hidden="true">
    <circle class="ic-c-body" cx="30" cy="30" r="27"/>
    <circle class="ic-c-rim" cx="30" cy="30" r="27"/>
    <circle class="ic-c-rim in" cx="30" cy="30" r="22.5"/>
    <path class="ic-c-pat" d="M10 35 Q20 20 40 28"/>
    <path class="ic-c-pat" d="M20 46 Q35 41 49 30"/>
    <rect class="ic-c-hole" x="24" y="24" width="12" height="12" rx="1.2"/>
    <g class="ic-c-mark">${marks}</g>
    <text class="ic-c-ch" x="14.5" y="33.5">天</text>
    <text class="ic-c-ch" x="45.5" y="33.5">地</text></svg>`;
}
function ichingCoinHTML(face, i){
  /* `face` is 3 (yang) or 2 (yin); the rest turns it up the right way */
  return `<span class="ic-coin" data-coin="${i}" style="--i:${i}">
    <span class="ic-coin-sh"></span>
    <span class="ic-coin-in" style="transform:rotateX(${face === 3 ? 0 : 180}deg)">
      ${ichingCoinFace('yang')}${ichingCoinFace('yin')}</span>
    <span class="ic-coin-v mono">${face}</span></span>`;
}

/* ============================================================
   THE FIGURE

   Six lines, bottom to top, at a size that reads as a hexagram rather than
   as a barcode: full width, ten pixels of weight, a real gap in the broken
   ones. The two trigrams are separated by a dotted rule and named at the
   side, because a hexagram is recognised by its trigrams before it is
   recognised by its number.
   ============================================================ */
function ichingFigureHTML(lines, opt){
  opt = opt || {};
  const done = lines.filter(Boolean).length === 6;
  const bin = done ? lines.map(l => l.v).join('') : null;
  const rows = [5, 4, 3, 2, 1, 0].map(i => {
    const l = lines[i];
    const divider = i === 2 ? '<div class="ic-div" aria-hidden="true"></div>' : '';
    if(!l) return `<div class="ic-row empty" data-row="${i}">
      <span class="ic-n mono">${i + 1}</span><span class="ic-bar"></span></div>${divider}`;
    const kind = IC_LINE_KIND[l.total] || (l.moving
      ? IC_LINE_KIND[l.v ? 9 : 6] : IC_LINE_KIND[l.v ? 7 : 8]);
    return `<div class="ic-row ${l.v ? 'yang' : 'yin'}${l.moving ? ' moving' : ''}"
      data-row="${i}" style="--lc:${kind.c};--d:${(i * .06).toFixed(2)}s">
      <span class="ic-n mono">${i + 1}</span>
      <span class="ic-bar">${l.v ? '<i class="full"></i>' : '<i class="half"></i><i class="half"></i>'}</span>
      <span class="ic-mk mono">${l.moving ? '×' : ''}</span></div>${divider}`;
  }).join('');
  const tri = bin ? `<div class="ic-trilab up mono">${trigramMark(hexUpper(bin))} ${esc(hexUpper(bin).pin)}</div>
    <div class="ic-trilab lo mono">${trigramMark(hexLower(bin))} ${esc(hexLower(bin).pin)}</div>` : '';
  return `<div class="ic-fig${opt.small ? ' small' : ''}${opt.cls ? ' ' + opt.cls : ''}">
    <div class="ic-rows">${rows}</div>${tri}</div>`;
}

/* the named head under a figure: number, the character, the sound of it,
   and what it is called in English */
function ichingHeadHTML(h, opt){
  opt = opt || {};
  return `<div class="ic-head${opt.small ? ' small' : ''}">
    <span class="ic-hnum mono">hexagram ${h.i}</span>
    <span class="ic-hcn">${esc(h.c)}</span>
    <span class="ic-hnm serif">${opt.scramble ? '' : esc(h.n)}</span>
    ${h.b ? `<span class="ic-htri mono">${trigramMark(hexUpper(h.b))} ${esc(hexUpper(h.b).en.split(' · ')[0])} above ·
      ${trigramMark(hexLower(h.b))} ${esc(hexLower(h.b).en.split(' · ')[0])} below</span>` : ''}</div>`;
}

/* the collapsible note on the two trigrams, for anyone learning the book */
function ichingTrigramNoteHTML(bin){
  const lo = hexLower(bin), up = hexUpper(bin);
  const one = (t, where) => `<div class="ic-trinote">
    <div class="ic-trinote-h"><span class="ic-trisym">${trigramGlyph(t.bits, 20)}</span>
      <b class="serif">${esc(t.pin)} ${esc(t.cn)}</b>
      <span class="mono">${esc(where)} · ${esc(t.en)}</span></div>
    <p class="dv-cr-t">${esc(t.attr)}. ${esc(t.img)}</p>
    <p class="mono faint">${esc(t.el)} · ${esc(t.dir)}</p></div>`;
  return `<details class="dv-read-more ic-trinotes"><summary>about these two trigrams</summary>
    ${one(lo, 'below')}${one(up, 'above')}
    <p class="dv-cr-t faint">A hexagram is these two, stacked. What it means is largely what happens when
      ${esc(lo.pin)} is underneath ${esc(up.pin)} — whether they meet, pass each other, or pull apart.</p>
  </details>`;
}

/* ============================================================
   THE TOSS, ANIMATED

   Up, a moment at the top, down, and a small bounce. The three coins do
   not move in unison — each gets its own peak, its own delay and its own
   number of turns, and the middle one lands first — because three coins
   thrown together landing in perfect time is the one thing that never
   happens and the thing that most makes an animation look like a machine.
   ============================================================ */
function ichingFlyCoins(box, faces, done){
  const soft = typeof reduced === 'function' && reduced();
  const coins = [...box.querySelectorAll('.ic-coin')];
  if(soft){ coins.forEach(c => c.classList.add('landed')); if(done) setTimeout(done, 0); return; }
  dvMoment('ching');
  /* the middle coin first, then the outer two a beat later */
  const order = [1, 0, 2];
  let last = 0;
  coins.forEach((coin, i) => {
    const inner = coin.querySelector('.ic-coin-in');
    const up = 118 + (Math.random() - .5) * 30;
    const lift = 340 + Math.random() * 60;
    const hang = 170;
    const fall = 420 + order.indexOf(i) * 70;
    const turns = 3 + Math.floor(Math.random() * 3);          /* whole tumbles */
    const rest = faces[i] === 3 ? 0 : 180;
    const start = Math.random() * 60;
    const drift = (i - 1) * (4 + Math.random() * 5);
    coin.animate([
      {transform: 'translate(0,0) scale(1)', offset: 0},
      {transform: `translate(${(drift * .6).toFixed(1)}px,${(-up).toFixed(0)}px) scale(1.15)`, offset: .42},
      {transform: `translate(${drift.toFixed(1)}px,${(-up).toFixed(0)}px) scale(1.15)`, offset: .58},
      {transform: `translate(${(drift * .4).toFixed(1)}px,8px) scale(1)`, offset: .93},
      {transform: 'translate(0,0) scale(1)', offset: 1},
    ], {duration: lift + hang + fall, delay: start,
        easing: 'cubic-bezier(.33,.02,.5,1)', fill: 'backwards'});
    /* the tumble: whole turns in the air, then whichever face is up */
    inner.animate([
      {transform: 'rotateX(0deg)'},
      {transform: `rotateX(${turns * 360 + rest}deg)`},
    ], {duration: lift + hang + fall, delay: start, easing: 'cubic-bezier(.2,.55,.35,1)', fill: 'forwards'});
    /* the shadow shrinks as the coin goes up, the way a shadow does */
    const sh = coin.querySelector('.ic-coin-sh');
    if(sh) sh.animate([
      {transform: 'scale(1)', opacity: .22, offset: 0},
      {transform: 'scale(.45)', opacity: .07, offset: .5},
      {transform: 'scale(1.06)', opacity: .26, offset: .95},
      {transform: 'scale(1)', opacity: .22, offset: 1},
    ], {duration: lift + hang + fall, delay: start, easing: 'cubic-bezier(.33,.02,.5,1)', fill: 'backwards'});

    const at = start + lift + hang + fall;
    last = Math.max(last, at);
    setTimeout(() => { coin.classList.add('landed'); dvMoment('clink'); }, at);
  });
  setTimeout(() => { dvMoment('softchime'); if(done) done(); }, last + 200);
}

/* ---------- the yarrow bundle ----------
   Fifty thin sticks. One is set aside for the observer, the rest divide
   into two heaps, and the heaps are counted down in fours three times
   over. The arithmetic has already happened; this shows it happening. */
function ichingYarrowHTML(){
  return `<div class="ic-yar" id="icYar">
    <div class="ic-yar-set" title="the stalk that is set aside and stays aside"><i></i></div>
    <div class="ic-yar-bundle">${Array.from({length: 49}, (_, i) =>
      `<i style="--i:${i};--r:${((i * 37) % 11) - 5}deg"></i>`).join('')}</div>
    <div class="ic-yar-say quote" id="icYarSay"></div>
  </div>`;
}
function ichingDivideStalks(box, roll, done){
  const soft = typeof reduced === 'function' && reduced();
  const say = box.querySelector('#icYarSay');
  const bundle = box.querySelector('.ic-yar-bundle');
  const set = box.querySelector('.ic-yar-set');
  const lines = [
    'One stalk is set aside, and stays aside.',
    ...roll.rounds.map((r, i) => `The ${['first','second','third'][i]} division: ${r.left} and ${r.right}, `
      + `and ${r.taken} are counted out.`),
    `What is left is ${roll.total * 4} — which is ${roll.total}.`,
  ];
  if(soft){ say.textContent = lines[lines.length - 1]; if(done) setTimeout(done, 0); return; }
  const sticks = [...bundle.querySelectorAll('i')];
  set.classList.add('gone');
  dvMoment('clack');
  /* Six lines at four and a half seconds each is forty seconds of watching a
     button stay disabled, which is not ceremony, it is waiting. Two and a
     half seconds a line keeps the method slower than the coins — which it
     should be — without making it a chore. */
  let t = 0;
  lines.forEach((txt, step) => {
    setTimeout(() => {
      say.textContent = txt;
      if(step > 0 && step <= 3){
        const r = roll.rounds[step - 1];
        dvMoment('clack');
        /* the count comes off the near end of the bundle, and what is gone
           stays visibly gone — which is the whole of what the method is */
        bundle.classList.add('split');
        const gone = sticks.filter(s => !s.classList.contains('gone'));
        gone.slice(0, r.taken).forEach((s, k) =>
          setTimeout(() => { s.classList.add('gone'); dvMoment('tick'); }, k * 55));
      }
    }, t);
    t += step === 0 ? 380 : 620;
  });
  setTimeout(() => { if(done) done(); }, t + 120);
}

/* ============================================================
   THE WHOLE CONSULTATION
   ============================================================ */
/* Phase one, the same shape as the tarot's but in its own words, with a
   wash of ink drifting behind it. */
function ichingCentering(then){
  const lines = ['Hold your question.', 'Let it settle into the body.', 'The book has been asked this before.'];
  const soft = typeof reduced === 'function' && reduced();
  const veil = el(`<div class="dv-veil ic-veil" role="dialog" aria-label="a moment before the coins">
    <svg class="ic-wash" viewBox="0 0 100 60" aria-hidden="true" preserveAspectRatio="none">
      <path d="M-20 34 C 10 22, 34 42, 58 30 S 104 20, 128 32 L128 60 L-20 60Z"/>
      <path class="two" d="M-20 22 C 16 34, 40 14, 66 24 S 108 34, 130 22 L130 0 L-20 0Z"/>
    </svg>
    <div class="dv-veil-in">
      ${lines.map((l, i) => `<p class="dv-veil-l" style="--i:${i}">${esc(l)}</p>`).join('')}
      <button class="btn primary dv-ready" ${soft ? '' : 'hidden'}>I am ready</button>
      <button class="dv-skip mono">skip</button>
    </div></div>`);
  document.body.appendChild(veil);
  const go = () => { veil.classList.add('out'); setTimeout(() => veil.remove(), soft ? 0 : 420); then(); };
  veil.querySelector('.dv-ready').onclick = go;
  veil.querySelector('.dv-skip').onclick = go;
  if(!soft) setTimeout(() => { const b = veil.querySelector('.dv-ready'); b.hidden = false; b.focus(); },
    lines.length * 700 + 1400);
  else veil.querySelector('.dv-ready').focus();
  veil.addEventListener('keydown', e => { if(e.key === 'Escape') go(); });
  return veil;
}
