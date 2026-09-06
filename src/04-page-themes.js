
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
  journals: {name:'Commonplace Book',      accent:['#d9a441','#b07f27'], ink:'#1a1816', gradient:['#d9a441','#c46b7a'], mood:'reflective, warm',       motion:'calm',      glyph:'記', icon:'📖'},
  projects: {name:'Creative Projects',     accent:['#7f97c9','#4d68a3'], ink:'#1a1816', gradient:['#6b7fa8','#8ec5e8'], mood:'structured, focused',    motion:'crisp',     glyph:'作', icon:'🎨'},
  rituals:  {name:'Rituals & Habits',      accent:['#6fa39a','#457d74'], ink:'#1a1816', gradient:['#5f968d','#b7c9a0'], mood:'steady, rhythmic',       motion:'calm',      glyph:'儀', icon:'✨'},
  values:   {name:'Values',      accent:['#ab93cf','#7a60a8'], ink:'#1a1816', gradient:['#b7a2d8','#a3798f'], mood:'introspective, calm',    motion:'calm',      glyph:'心', icon:'🧭'},
  skills:   {name:'Skill Tree',   accent:['#3fae7a','#25835a'], ink:'#1a1816', gradient:['#2f9e6e','#2aa7a0'], mood:'growth, energy',         motion:'energetic', glyph:'技', icon:'🛠'},
  vision:   {name:'Vision Tree',  accent:['#7b7de3','#4d50b6'], ink:'#f6f4ff', gradient:['#4b4fb0','#8a5fc9'], mood:'expansive, dreamy',      motion:'calm',      glyph:'夢', icon:'🌳'},
  timeline: {name:'Timeline',       accent:['#cba85a','#96762a'], ink:'#1a1816', gradient:['#c9a55a','#8a6a4a'], mood:'nostalgic, warm',        motion:'calm',      glyph:'憶', icon:'⏳'},
  home:     {name:'Home',         accent:['#94a6b5','#5b7082'], ink:'#1a1816', gradient:['#8a9aa6','#6c8299'], mood:'analytical, clear',      motion:'calm',      glyph:'家', icon:'⌂'},
  settings: {name:'Settings',     accent:['#a3978a','#776a5c'], ink:'#1a1816', gradient:['#a3978a','#c9b8a4'], mood:'quiet, practical',       motion:'crisp',     glyph:'設', icon:'⚙'},
};
/* routes that live inside another room's theme */
const PAGE_THEME_ALIASES = {stage:'timeline', value:'values'};
function pageThemeKey(){ const {name} = parseHash(); const k = PAGE_THEME_ALIASES[name] || name; return PAGE_THEMES[k] ? k : 'home'; }
function pageTheme(key){ return PAGE_THEMES[key] || PAGE_THEMES.home; }
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
  const meta = document.querySelector('meta[name="theme-color"]'); if(meta) meta.content = light ? t.accent[1] : t.accent[0];
}
/* parallax for the banner glyph on calm pages */
window.addEventListener('scroll', () => { if(document.documentElement.dataset.motion === 'calm') document.documentElement.style.setProperty('--page-par', String(Math.min(240, window.scrollY))); }, {passive:true});
/* a small mood line in the banner: icon + the room's mood, in the page accent */
function decoratePageHead(main){ const t = pageTheme(pageThemeKey()); const h = main.querySelector('.page-head'); if(!h || h.querySelector('.ph-mood')) return; const flex = ['flex','grid'].includes(getComputedStyle(h).display); const target = flex ? (h.firstElementChild || h) : h; target.insertAdjacentHTML('afterbegin', `<div class="ph-mood">${t.icon} ${esc(t.mood)}</div>`); }
