
/* ============================================================
   PAGE THEMES — cohesive but distinct
   One visual personality per room. Everything shared (buttons,
   inputs, chips, cards, toggles, bars) reads the CSS custom
   properties set here, so it adapts on its own:
     --page-accent, --page-accent-ink, --page-gradient-start,
     --page-gradient-end, --page-motion-speed, --page-ease, --page-glyph
   ============================================================ */
const MOTION_PROFILES = {
  calm:      {speed:1.45, ease:'cubic-bezier(.22,.61,.36,1)',  lift:'translateY(-2px)',            desc:'slow floats, gentle fades, parallax'},
  energetic: {speed:.85,  ease:'cubic-bezier(.34,1.56,.64,1)', lift:'translateY(-4px) scale(1.012)', desc:'spring physics, bouncy'},
  crisp:     {speed:.7,   ease:'cubic-bezier(.2,0,0,1)',       lift:'translateY(-2px)',            desc:'crisp slide transitions'},
  snappy:    {speed:.55,  ease:'cubic-bezier(.3,0,.1,1)',      lift:'translateY(-3px)',            desc:'snappy micro-interactions'},
};
/* accent: [dark-theme colour, light-theme colour]; ink: text on the accent;
   gradient: [start, end] (rendered at 5–10% opacity as an ambient wash);
   glyph: the Han character that illustrates the header banner. */
const PAGE_THEMES = {
  today:    {name:'Today',        accent:['#e07a5f','#c25d40'], ink:'#1a1816', gradient:['#e07a5f','#f2b28c'], mood:'present, inviting',      motion:'snappy',    glyph:'今', icon:'🏠'},
  journals: {name:'Journals',      accent:['#d9a441','#b07f27'], ink:'#1a1816', gradient:['#d9a441','#c46b7a'], mood:'reflective, warm',       motion:'calm',      glyph:'記', icon:'📖'},
  projects: {name:'Projects',     accent:['#7f97c9','#4d68a3'], ink:'#1a1816', gradient:['#6b7fa8','#8ec5e8'], mood:'structured, focused',    motion:'crisp',     glyph:'作', icon:'🎨'},
  rituals:  {name:'Rituals & Habits',      accent:['#6fa39a','#457d74'], ink:'#1a1816', gradient:['#5f968d','#b7c9a0'], mood:'steady, rhythmic',       motion:'calm',      glyph:'儀', icon:'✨'},
  values:   {name:'Values',      accent:['#ab93cf','#7a60a8'], ink:'#1a1816', gradient:['#b7a2d8','#a3798f'], mood:'introspective, calm',    motion:'calm',      glyph:'心', icon:'🧭'},
  needs:    {name:'Needs',        accent:['#c9806a','#9a4f3a'], ink:'#1a1816', gradient:['#b96a54','#d9a98f'], mood:'structural, plain',  motion:'calm',      glyph:'需', icon:'🔺'},
  skills:   {name:'Skill Tree',   accent:['#3fae7a','#25835a'], ink:'#1a1816', gradient:['#2f9e6e','#2aa7a0'], mood:'growth, energy',         motion:'energetic', glyph:'技', icon:'🛠'},
  timeline: {name:'Timeline',       accent:['#cba85a','#96762a'], ink:'#1a1816', gradient:['#c9a55a','#8a6a4a'], mood:'nostalgic, warm',        motion:'calm',      glyph:'憶', icon:'⏳'},
  compass:  {name:'Compass',      accent:['#94a6b5','#5b7082'], ink:'#1a1816', gradient:['#8a9aa6','#6c8299'], mood:'analytical, clear',      motion:'calm',      glyph:'家', icon:'⌂'},
  lifetape: {name:'Life Tape',     accent:['#d99a6a','#a8623a'], ink:'#1a1816', gradient:['#c98a5e','#e3bf94'], mood:'present, ordered',       motion:'snappy',    glyph:'律', icon:'◷'},
  calendar: {name:'Calendar',      accent:['#8fa9c4','#4f7093'], ink:'#1a1816', gradient:['#7d97b3','#c2cfdb'], mood:'wide, seasonal',         motion:'calm',      glyph:'暦', icon:'▦'},
  finance:  {name:'Finance',       accent:['#8fae86','#4d7a4a'], ink:'#1a1816', gradient:['#6f9a68','#c3cf9f'], mood:'plain, countable',       motion:'crisp',     glyph:'財', icon:'▤'},
  people:   {name:'People',        accent:['#d99a9a','#a5605f'], ink:'#1a1816', gradient:['#c98a8a','#e6c3b4'], mood:'warm, particular',       motion:'calm',      glyph:'人', icon:'☺'},
  plan:     {name:'Plan',          accent:['#d98f6a','#a8613e'], ink:'#1a1816', gradient:['#c97f5e','#e0b48a'], mood:'ordered, near',          motion:'crisp',     glyph:'週', icon:'▤'},
  reviews:  {name:'Reviews',       accent:['#8fb0a8','#4f7d73'], ink:'#1a1816', gradient:['#6f9a91','#a9bfa2'], mood:'measured, honest',       motion:'calm',      glyph:'省', icon:'◷'},
  writing:  {name:'Writing',       accent:['#c8b79a','#8a7452'], ink:'#1a1816', gradient:['#b6a184','#d9c9ae'], mood:'quiet, unhurried',   motion:'calm',      glyph:'文', icon:'✒'},
  commonplace:{name:'Commonplace Book', accent:['#b98aa6','#8a5476'], ink:'#1a1816', gradient:['#a3789a','#d0aebd'], mood:'curious, collected', motion:'calm',    glyph:'典', icon:'📖'},
  content:  {name:'Content',      accent:['#c08a6a','#8f5c3e'], ink:'#1a1816', gradient:['#b57a5c','#e0b899'], mood:'making, unfinished',     motion:'crisp',     glyph:'創', icon:'✍'},
  settings: {name:'Settings',     accent:['#a3978a','#776a5c'], ink:'#1a1816', gradient:['#a3978a','#c9b8a4'], mood:'quiet, practical',       motion:'crisp',     glyph:'設', icon:'⚙'},
};
/* routes that live inside another room's theme */
const PAGE_THEME_ALIASES = {stage:'timeline', value:'values', home:'compass', rhythm:'lifetape'};
function pageThemeKey(){ const {name} = parseHash(); const k = PAGE_THEME_ALIASES[name] || name; return PAGE_THEMES[k] ? k : 'compass'; }
function pageTheme(key){ return PAGE_THEMES[key] || PAGE_THEMES.compass; }
function pageGradientCSS(t){ return `linear-gradient(135deg, ${t.gradient[0]} 0%, ${t.gradient[1]} 100%)`; }
let _pageThemeKey = null, _gradLayer = 0;
function applyPageTheme(){
  const key = pageThemeKey(); const t = pageTheme(key); const light = document.documentElement.dataset.theme === 'light';
  const m = MOTION_PROFILES[t.motion] || MOTION_PROFILES.calm; const r = document.documentElement.style;
  r.setProperty('--page-accent', light ? t.accent[1] : t.accent[0]);
  r.setProperty('--page-accent-ink', t.ink);
  r.setProperty('--page-gradient-start', t.gradient[0]);
  r.setProperty('--page-gradient-end', t.gradient[1]);
  r.setProperty('--page-motion-speed', String(m.speed));
  r.setProperty('--page-ease', m.ease);
  r.setProperty('--page-lift', m.lift);
  r.setProperty('--page-glyph', JSON.stringify(t.glyph));
  document.documentElement.dataset.page = key; document.documentElement.dataset.motion = t.motion;
  // crossfade the ambient gradient: paint the hidden layer, then swap which one is visible (350ms in CSS)
  if(key !== _pageThemeKey){
    const layers = [$('#pgA'), $('#pgB')]; if(layers[0] && layers[1]){ const next = 1 - _gradLayer; layers[next].style.backgroundImage = pageGradientCSS(t); layers[next].classList.add('on'); layers[_gradLayer].classList.remove('on'); _gradLayer = next; }
    _pageThemeKey = key;
  }
  if(typeof applyPageScene === 'function') applyPageScene();
  if(typeof applyInk === 'function') applyInk();
  const meta = document.querySelector('meta[name="theme-color"]'); if(meta) meta.content = light ? t.accent[1] : t.accent[0];
}
/* parallax for the banner glyph on calm pages */
window.addEventListener('scroll', () => { if(document.documentElement.dataset.motion === 'calm') document.documentElement.style.setProperty('--page-par', String(Math.min(240, window.scrollY))); }, {passive:true});
/* page banners carry the room's glyph and colour; no descriptive line */
/* the banner's hairline is an element rather than a pseudo-element so it can
   redraw itself on each arrival; every page gets one without knowing about it */
function decoratePageHead(main){
  const key = pageThemeKey();
  $$('.page-head', main).forEach(h => {
    if(h.querySelector(':scope > .ph-rule')) return;
    h.insertBefore(el('<i class="ph-rule" aria-hidden="true"></i>'), h.firstChild);
    /* and whatever blooms on this room's banner — plum for Values, buds for
       Journals, a doubled peony for Writing. Flowers only, in the room's own
       accent, and only in the gaps the words leave. */
    if(typeof bannerBloomsHTML === 'function'){
      const w = el('<div class="ph-plant" aria-hidden="true"></div>');
      h.insertBefore(w, h.firstChild);
      plantBlooms(h, w, key);
    }
  });
}

/* ---------- keeping the flowers off the words ----------
   Not a guess about where a title ends: the actual line boxes of every run of
   text in the banner, plus every control in it, measured and handed to the
   scatter as ground it may not use. A two-line title therefore pushes the
   flowers out rather than getting flowers on top of it. */
function phWordRects(h, plant){
  const hb = h.getBoundingClientRect();
  if(!hb.width || !hb.height) return null;
  const rects = [];
  const add = r => { if(r.width > 1 && r.height > 1) rects.push(r); };
  const walk = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.nodeValue.trim() && !plant.contains(n))
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const range = document.createRange();
  let n; while((n = walk.nextNode())){ range.selectNodeContents(n); Array.from(range.getClientRects()).forEach(add); }
  /* a button or a chart in the head is as much "the words" as the title is */
  h.querySelectorAll('button,input,select,textarea,a,svg,img,.toggle,.btn').forEach(e => {
    if(!plant.contains(e)) add(e.getBoundingClientRect()); });
  if(!rects.length) return {box:{w:hb.width, h:hb.height}, keep:[]};
  /* wider clearance beside a word than above it: a banner is short, and the
     shallow band under a one-line title is usable room a 14px cushion would
     spend entirely on itself */
  const mx = 16, my = 9;
  return {box:{w: hb.width, h: hb.height}, keep: rects.map(r => ({
    x0: (r.left  - hb.left - mx) / hb.width,  x1: (r.right  - hb.left + mx) / hb.width,
    y0: (r.top   - hb.top  - my) / hb.height, y1: (r.bottom - hb.top  + my) / hb.height}))};
}
function plantBlooms(h, plant, key){
  const m = phWordRects(h, plant);
  if(!m) return;                                   // laid out to nothing yet; the observer will call back
  const sig = Math.round(m.box.w) + 'x' + Math.round(m.box.h) + ':' + m.keep.length;
  if(plant.dataset.sig === sig) return;            // same shape, same flowers — don't restart them
  plant.dataset.sig = sig;
  plant.innerHTML = bannerBloomsHTML(key, m.keep, m.box);
  /* a banner reflows when the window does, or when its own content settles a
     frame later; re-measure once rather than leaving flowers where the words
     have since moved to */
  if(!plant._ro && typeof ResizeObserver === 'function'){
    plant._ro = new ResizeObserver(() => { if(h.isConnected) plantBlooms(h, plant, key); });
    plant._ro.observe(h);
  }
}
