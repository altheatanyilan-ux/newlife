/* ============================================================
   TEXT THAT ARRIVES

   Five ways for words to reach the page, and a rule for each about where
   it is allowed. That rule is the whole of the design: text that moves for
   no reason is text that is harder to read, and an app where everything
   animates is an app where nothing means anything.

     reveal      a block arriving word by word, as if being written
     typewriter  a line being typed at you, one character at a time
     breathe     text belonging to something that is actually breathing
     flow        firelight moving across engraved letters
     morph       one string dissolving into another in the same place

   The first belongs to both rooms. The rest, apart from breathing, belong
   to the dark one: a writing desk in daylight is still, and a page that
   shimmers on white paper reads as a fault rather than as atmosphere.

   Everything here is off entirely under prefers-reduced-motion, where the
   final text is simply there.

   Built as one observer and one selector list rather than a constructor
   per element. This app rebuilds #main wholesale on nearly every edit, so
   per-element instances would have to be re-made hundreds of times a page
   and would hold references to nodes already thrown away.
   ============================================================ */
const Kinetic = (() => {
  const soft = () => typeof reduced === 'function' && reduced();
  const dark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  /* ---------- 1. a block of text, arriving ----------
     Words, not characters: a character-by-character fade over a paragraph
     is a hundred and fifty transitions and reads as static. Thirty
     milliseconds a word is about the speed of a hand writing. */
  const REVEAL = [
    '.page-head h1', '.page-head .sub',
    '.dv-sec-h', '.sec-h', 'section > h2', '.prose blockquote',
    '.th-quote', '.quote.pull', '.gentle-prompt', '.tl-story p', '.vt-desc',
    '.dv-story p', '.cc-lead', '.cd-pat', '.cc-pat',
  ].join(',');

  function prepare(node){
    if(node.dataset.reveal) return;
    /* only plain text: a block with markup in it would lose the markup, and
       a block with a form in it would lose the form */
    if(node.children.length || !node.textContent.trim()) { node.dataset.reveal = 'skip'; return; }
    const words = node.textContent.trim().split(/\s+/);
    if(words.length > 90){ node.dataset.reveal = 'skip'; return; }   /* an essay is not an arrival */
    node.dataset.reveal = 'ready';
    node.innerHTML = words.map((w, i) =>
      `<span class="wd" style="--i:${i}">${esc(w)}</span>`).join(' ');
  }

  let io = null;
  function observer(){
    if(io) return io;
    io = new IntersectionObserver(entries => {
      entries.forEach(e => { if(!e.isIntersecting) return;
        e.target.classList.add('shown'); io.unobserve(e.target); });
    }, {threshold: .15, rootMargin: '0px 0px -6% 0px'});
    return io;
  }

  /* called after every render, on whatever was just drawn */
  function scan(root){
    if(soft()) return;
    (root || document).querySelectorAll(REVEAL).forEach(n => {
      prepare(n);
      if(n.dataset.reveal !== 'ready') return;
      /* already on screen when the page was drawn: show it now rather than
         waiting for a scroll that may never come */
      const r = n.getBoundingClientRect();
      if(r.top < innerHeight * .94 && r.bottom > 0){ n.classList.add('shown'); return; }
      observer().observe(n);
      /* A block whose words are never shown is a block that has disappeared,
         and the ways that can happen are not all foreseeable — a section
         folded shut, a panel that never scrolls, a tab nobody opens. So
         there is a floor: eight seconds later it is shown regardless. The
         effect is worth having; it is not worth losing a paragraph over. */
      setTimeout(() => { if(n.isConnected) n.classList.add('shown'); }, 8000);
    });
  }

  /* ---------- 2. typed at you ----------
     For the handful of lines that are addressed to the person rather than
     describing something to them: the script they read to themselves in the
     morning, the aim they say out loud, the line before a reading. */
  function type(node, text, opt){
    opt = opt || {};
    if(!node) return Promise.resolve();
    const str = text !== undefined ? text : node.textContent;
    if(soft() || !dark()){ node.textContent = str; return Promise.resolve(); }
    const speed = opt.speed || 35, hold = opt.pause || 200;
    node.textContent = '';
    const cur = document.createElement('span');
    cur.className = 'tw-cursor'; cur.textContent = '│';
    node.appendChild(cur);
    let i = 0;
    return new Promise(done => {
      const step = () => {
        if(i >= str.length){
          cur.classList.add('blink');
          setTimeout(() => { cur.style.opacity = '0'; }, 2000);
          return done();
        }
        const ch = str[i++];
        node.insertBefore(document.createTextNode(ch), cur);
        /* a sentence ends with a breath in it, not at the same rate as the
           middle of a word */
        const d = speed + ('.!?'.includes(ch) ? hold : ',;:—'.includes(ch) ? hold * .5 : 0);
        setTimeout(step, d);
      };
      step();
    });
  }

  /* ---------- 3. one string becoming another ----------
     Not a swap: the old one dissolves upward and out of focus while the new
     one gathers below and comes into it. */
  function morph(node, next){
    if(!node) return;
    if(soft() || !dark()){ node.textContent = next; return; }
    if(node.textContent === next) return;
    node.classList.remove('in'); node.classList.add('out');
    setTimeout(() => {
      node.textContent = next;
      node.classList.remove('out'); node.classList.add('in');
      setTimeout(() => node.classList.remove('in'), 500);
    }, 420);
  }
  /* a run of strings, one after another, on a slow clock. Returns the stop
     function, because a cycle left running against a node that has been
     re-rendered away is a leak with a timer on it. */
  function cycle(node, strings, ms){
    if(!node || !strings.length) return () => {};
    let i = 0;
    node.textContent = strings[0];
    if(soft() || !dark() || strings.length < 2) return () => {};
    const t = setInterval(() => {
      if(!node.isConnected){ clearInterval(t); return; }
      i = (i + 1) % strings.length;
      morph(node, strings[i]);
    }, ms || 8000);
    return () => clearInterval(t);
  }

  /* ---------- 4. the two that are only a class ----------
     Breathing belongs to something that is breathing; the gradient belongs
     to a title in the dark room. Both are CSS; these only decide who gets
     them, so the answer to "why is this moving" is one grep. */
  /* Titles, the Chinese characters, and the name of the house. Today's
     heading is its own element rather than a .page-head h1, and the brand is
     .brand .name — the spec guessed at both. */
  const FLOW = '.page-head h1, .today-date, .ic-hcn, .tl-glyph, .cd-hexbig + .cd-head-t .ic-hcn, .brand .name';
  function flourish(root){
    if(soft()) return;
    (root || document).querySelectorAll(FLOW).forEach(n => n.classList.add('flow'));
  }

  return {scan, type, morph, cycle, flourish,
    /* exposed so a page can ask for the effect on something it just made */
    reveal: prepare};
})();
