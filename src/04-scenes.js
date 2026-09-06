/* ============================================================
   SCENES — a vision board behind the glass.
   Each room gets its own drawn scene in the ambient layer: Japan,
   a bar at night, a piano in a quiet house, hills and rain. They
   sit at a few per cent opacity in the page's own colours, so
   they read as atmosphere rather than decoration.
   Detail pages (one project, one skill, one stage) get a motif
   generated from their own id, so no two look alike.
   ============================================================ */
const SC_W = 1200, SC_H = 760;
const scWrap = inner => `<svg viewBox="0 0 ${SC_W} ${SC_H}" preserveAspectRatio="xMidYMax slice" class="scene-svg">${inner}</svg>`;
/* shared pieces */
const hill = (y, amp, col, op) => `<path d="M0,${SC_H} L0,${y} ${Array.from({length:13},(_,i)=>{const x=i*100; return `Q${x+50},${(y - amp*Math.sin(i*1.1)).toFixed(0)} ${x+100},${(y - amp*.4*Math.sin(i*.7)).toFixed(0)}`;}).join(' ')} L${SC_W},${SC_H} Z" fill="${col}" opacity="${op}"/>`;
const cloud = (x, y, s, col, op) => `<g opacity="${op}" fill="${col}" transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="90" ry="16"/><ellipse cx="-45" cy="-9" rx="52" ry="13"/><ellipse cx="48" cy="-6" rx="60" ry="12"/></g>`;
const moon = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${col}" stroke-width="2" opacity=".55"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity=".1"/>`;
const rays = (x, y, r, col, n=14) => Array.from({length:n},(_,i)=>{ const a = -Math.PI + i*Math.PI/(n-1); return `<line x1="${(x+Math.cos(a)*r*.55).toFixed(0)}" y1="${(y+Math.sin(a)*r*.55).toFixed(0)}" x2="${(x+Math.cos(a)*r*1.5).toFixed(0)}" y2="${(y+Math.sin(a)*r*1.5).toFixed(0)}" stroke="${col}" stroke-width="1.4" opacity=".3"/>`; }).join('');
const A = 'var(--page-accent)', G1 = 'var(--page-gradient-start)', G2 = 'var(--page-gradient-end)';

const PAGE_SCENES = {
  /* a house, the hills behind it, smoke from the chimney */
  home: () => scWrap(`${hill(470,42,G2,.28)}${hill(560,30,G1,.34)}
    <g stroke="${A}" fill="none" stroke-width="2.4" opacity=".7">
      <path d="M420,640 L600,520 L780,640"/><path d="M470,612 v128 h260 v-128"/>
      <path d="M560,740 v-74 h80 v74"/><rect x="500" y="640" width="46" height="40"/><rect x="660" y="640" width="46" height="40"/>
      <path d="M700,560 v-56 h30 v34"/></g>
    <path d="M715,500 q-22,-34 4,-60 q26,-26 4,-58" stroke="${A}" fill="none" stroke-width="1.8" opacity=".35"/>
    ${cloud(240,190,1,G2,.28)}${cloud(950,140,.8,G1,.24)}`),

  /* morning: a low sun over still water, two birds */
  today: () => scWrap(`${rays(600,470,150,A)}<circle cx="600" cy="470" r="98" fill="${A}" opacity=".16"/><circle cx="600" cy="470" r="98" fill="none" stroke="${A}" stroke-width="2" opacity=".5"/>
    ${hill(540,26,G2,.26)}
    <g stroke="${A}" opacity=".4" stroke-width="1.6" fill="none">${Array.from({length:9},(_,i)=>`<line x1="${380+i*8}" y1="${590+i*18}" x2="${820-i*8}" y2="${590+i*18}"/>`).join('')}</g>
    <path d="M300,250 q22,-18 44,0 q22,-18 44,0" stroke="${A}" fill="none" stroke-width="2" opacity=".45"/>
    <path d="M880,190 q16,-13 32,0 q16,-13 32,0" stroke="${A}" fill="none" stroke-width="1.8" opacity=".35"/>
    ${cloud(880,320,.7,G1,.22)}`),

  /* a week on squared paper, one corner turned up */
  plan: () => scWrap(`<g stroke="${A}" opacity=".16" stroke-width="1">${Array.from({length:16},(_,i)=>`<line x1="0" y1="${i*52}" x2="${SC_W}" y2="${i*52}"/>`).join('')}${Array.from({length:24},(_,i)=>`<line x1="${i*52}" y1="0" x2="${i*52}" y2="${SC_H}"/>`).join('')}</g>
    <g opacity=".5" stroke="${A}" fill="none" stroke-width="2.2">${Array.from({length:7},(_,i)=>`<rect x="${140+i*130}" y="330" width="106" height="240" rx="8"/>`).join('')}</g>
    <g opacity=".3" stroke="${A}" stroke-width="2">${Array.from({length:7},(_,i)=>Array.from({length:2+(i%3)},(_,j)=>`<line x1="${160+i*130}" y1="${380+j*34}" x2="${226+i*130}" y2="${380+j*34}"/>`).join('')).join('')}</g>
    <path d="M1060,0 L1200,0 L1200,140 Z" fill="${G2}" opacity=".25"/>`),

  /* rain on the window, a ginkgo leaf caught on the glass */
  journals: () => scWrap(`<g stroke="${A}" opacity=".3" stroke-width="1.6">${Array.from({length:34},(_,i)=>{const x=(i*77)%SC_W, y=(i*133)%520; return `<line x1="${x}" y1="${y}" x2="${x-14}" y2="${y+96}"/>`;}).join('')}</g>
    <g opacity=".28" fill="${A}">${Array.from({length:18},(_,i)=>`<circle cx="${(i*211)%SC_W}" cy="${(i*97)%600+60}" r="${3+(i%4)}"/>`).join('')}</g>
    <g transform="translate(880,470) rotate(24)" opacity=".4"><path d="M0,0 q-70,-16 -86,-84 q46,-40 86,-40 q40,0 86,40 q-16,68 -86,84 Z" fill="${G2}" opacity=".6"/><path d="M0,0 v-118" stroke="${A}" stroke-width="2" fill="none"/><path d="M0,0 v52" stroke="${A}" stroke-width="2.4"/></g>
    <rect x="60" y="60" width="${SC_W-120}" height="${SC_H-40}" fill="none" stroke="${A}" stroke-width="3" opacity=".28"/>
    <line x1="${SC_W/2}" y1="60" x2="${SC_W/2}" y2="${SC_H}" stroke="${A}" stroke-width="3" opacity=".22"/>`),

  /* a stack of books and the lamp that keeps you up */
  commonplace: () => scWrap(`<g stroke="${A}" fill="none" stroke-width="2.4" opacity=".6">
      <rect x="380" y="620" width="290" height="34" rx="4"/><rect x="400" y="580" width="250" height="40" rx="4"/><rect x="366" y="536" width="300" height="44" rx="4"/><rect x="410" y="492" width="220" height="44" rx="4"/>
      <path d="M760,654 v-150 M700,504 q60,-56 120,0" /><path d="M700,504 h120"/></g>
    <circle cx="760" cy="470" r="120" fill="${A}" opacity=".12"/>
    <g opacity=".45" stroke="${A}" stroke-width="1.6">${Array.from({length:5},(_,i)=>`<line x1="${396+i*4}" y1="${544+i*44}" x2="${640-i*6}" y2="${544+i*44}"/>`).join('')}</g>
    ${cloud(220,200,.8,G2,.16)}`),

  /* the desk at night: a window, a lamp, a cup still warm */
  writing: () => scWrap(`<rect x="120" y="90" width="380" height="330" fill="none" stroke="${A}" stroke-width="2.6" opacity=".45"/>
    <line x1="310" y1="90" x2="310" y2="420" stroke="${A}" stroke-width="2" opacity=".35"/><line x1="120" y1="255" x2="500" y2="255" stroke="${A}" stroke-width="2" opacity=".35"/>
    ${moon(410,170,38,A)}
    <line x1="60" y1="620" x2="1140" y2="620" stroke="${A}" stroke-width="3" opacity=".5"/>
    <g stroke="${A}" fill="none" stroke-width="2.4" opacity=".55"><path d="M840,620 v-90 M800,530 q40,-46 80,0"/><path d="M800,530 h80"/>
      <path d="M560,620 v-40 h70 v40 Z"/><path d="M630,592 q22,-12 22,-22 q0,-10 -22,-12"/></g>
    <circle cx="840" cy="500" r="96" fill="${A}" opacity=".13"/>
    <path d="M590,556 q-10,-22 2,-38 M612,556 q-10,-22 2,-38" stroke="${A}" fill="none" stroke-width="1.6" opacity=".35"/>
    <g opacity=".4" stroke="${A}" stroke-width="1.6">${Array.from({length:5},(_,i)=>`<line x1="${300}" y1="${586+i*0}" x2="${520}" y2="${586}"/>`).join('')}</g>`),

  /* a small bar at night: noren, lanterns, rooftops */
  projects: () => scWrap(`<g opacity=".3" fill="${G2}">${Array.from({length:9},(_,i)=>`<rect x="${i*140}" y="${380+((i*53)%90)}" width="118" height="${SC_H}" />`).join('')}</g>
    <path d="M300,470 h600 l-40,-60 h-520 Z" fill="${A}" opacity=".22"/>
    <path d="M300,470 h600" stroke="${A}" stroke-width="3" opacity=".55" fill="none"/>
    <g opacity=".5" fill="none" stroke="${A}" stroke-width="2.4"><rect x="340" y="470" width="520" height="90" rx="4"/>
      ${Array.from({length:5},(_,i)=>`<line x1="${340+i*104}" y1="470" x2="${340+i*104}" y2="560"/>`).join('')}</g>
    <g opacity=".55">${[420,600,780].map(x=>`<g><line x1="${x}" y1="380" x2="${x}" y2="410" stroke="${A}" stroke-width="2"/><ellipse cx="${x}" cy="435" rx="26" ry="32" fill="${A}" opacity=".28"/><ellipse cx="${x}" cy="435" rx="26" ry="32" fill="none" stroke="${A}" stroke-width="2"/><line x1="${x-26}" y1="435" x2="${x+26}" y2="435" stroke="${A}" stroke-width="1.2" opacity=".6"/></g>`).join('')}</g>
    <g opacity=".4" stroke="${A}" stroke-width="2" fill="none">${Array.from({length:11},(_,i)=>`<line x1="${350+i*50}" y1="${560}" x2="${350+i*50}" y2="${640}"/>`).join('')}</g>`),

  /* sun and moon on the same arc: the day, repeating */
  rituals: () => scWrap(`<path d="M120,640 A480,480 0 0 1 1080,640" fill="none" stroke="${A}" stroke-width="2.4" opacity=".45" stroke-dasharray="10 12"/>
    <circle cx="380" cy="300" r="52" fill="${A}" opacity=".18"/><circle cx="380" cy="300" r="52" fill="none" stroke="${A}" stroke-width="2.2" opacity=".55"/>${rays(380,300,72,A,10)}
    ${moon(820,300,46,A)}
    <g opacity=".35" stroke="${A}" stroke-width="2" fill="none">${Array.from({length:12},(_,i)=>`<circle cx="${140+i*80}" cy="690" r="${10+(i%3)*5}"/>`).join('')}</g>
    ${hill(600,20,G1,.2)}`),

  /* a still lake: everything above it, again below */
  reviews: () => scWrap(`${hill(400,44,G2,.3)}
    <line x1="0" y1="470" x2="${SC_W}" y2="470" stroke="${A}" stroke-width="2.5" opacity=".5"/>
    <g transform="translate(0,940) scale(1,-1)" opacity=".4">${hill(400,44,G1,.3)}</g>
    <g stroke="${A}" fill="none" stroke-width="2.6" opacity=".55"><path d="M520,470 v-96 M680,470 v-96"/><path d="M486,382 h228 M498,352 q102,-26 204,0"/><path d="M470,338 q130,-34 260,0"/></g>
    <g stroke="${A}" opacity=".2" stroke-width="1.4">${Array.from({length:8},(_,i)=>`<line x1="${300-i*20}" y1="${520+i*26}" x2="${900+i*20}" y2="${520+i*26}"/>`).join('')}</g>
    ${moon(940,220,40,A)}`),

  /* a compass rose, and the needle that does not quite agree */
  values: () => scWrap(`<g transform="translate(600,430)">
      ${[240,180,120].map((r,i)=>`<circle r="${r}" fill="none" stroke="${A}" stroke-width="${i===0?2.6:1.6}" opacity="${.5-i*.1}"/>`).join('')}
      <g opacity=".4" stroke="${A}" stroke-width="1.4">${Array.from({length:16},(_,i)=>{const a=i*Math.PI/8; return `<line x1="${(Math.cos(a)*120).toFixed(0)}" y1="${(Math.sin(a)*120).toFixed(0)}" x2="${(Math.cos(a)*240).toFixed(0)}" y2="${(Math.sin(a)*240).toFixed(0)}"/>`;}).join('')}</g>
      <path d="M0,-210 L34,0 L0,210 L-34,0 Z" fill="${A}" opacity=".2"/>
      <path d="M0,-210 L34,0 L0,210 L-34,0 Z" fill="none" stroke="${A}" stroke-width="2.4" opacity=".6"/>
      <g transform="rotate(24)"><path d="M0,-180 L20,0 L0,60 L-20,0 Z" fill="${G2}" opacity=".5"/></g>
      <circle r="9" fill="${A}" opacity=".7"/></g>`),

  /* a bamboo grove */
  skills: () => scWrap(`<g opacity=".45">${Array.from({length:11},(_,i)=>{ const x = 70+i*108, w = 12+(i%3)*5; return `<g stroke="${A}" fill="none" stroke-width="${w/5}"><line x1="${x}" y1="${SC_H}" x2="${x+((i%2)?14:-14)}" y2="${60+(i%4)*40}"/>${Array.from({length:6},(_,j)=>`<line x1="${x-w/2}" y1="${640-j*106}" x2="${x+w/2}" y2="${640-j*106}"/>`).join('')}</g>`; }).join('')}</g>
    <g opacity=".3" fill="${G2}">${Array.from({length:14},(_,i)=>`<ellipse cx="${90+i*84}" cy="${140+((i*67)%260)}" rx="${34+(i%3)*8}" ry="7" transform="rotate(${-30+(i*23)%60} ${90+i*84} ${140+((i*67)%260)})"/>`).join('')}</g>`),

  /* mountains, a moon, a path that keeps going */
  vision: () => scWrap(`${cloud(300,150,1.1,G2,.24)}${cloud(900,220,.9,G1,.2)}${moon(940,140,54,A)}
    <path d="M0,620 L240,360 L400,520 L560,300 L760,560 L900,430 L1200,660 L1200,${SC_H} L0,${SC_H} Z" fill="${G1}" opacity=".28"/>
    <path d="M0,620 L240,360 L400,520 L560,300 L760,560 L900,430 L1200,660" fill="none" stroke="${A}" stroke-width="2.4" opacity=".5"/>
    <path d="M520,340 L560,300 L604,346 q-44,20 -84,-6 Z" fill="${A}" opacity=".3"/>
    <path d="M600,${SC_H} q40,-120 -20,-200 q-60,-80 10,-160" fill="none" stroke="${A}" stroke-width="2.6" opacity=".4" stroke-dasharray="14 16"/>`),

  /* hills receding into the past, one behind another */
  timeline: () => scWrap(`${[[560,.34],[470,.26],[380,.2],[300,.14]].map(([y,o],i)=>hill(y, 30+i*10, i%2?G1:G2, o)).join('')}
    <g opacity=".45" stroke="${A}" stroke-width="2" fill="none">${Array.from({length:8},(_,i)=>`<line x1="${100+i*140}" y1="700" x2="${100+i*140}" y2="660"/><circle cx="${100+i*140}" cy="645" r="7"/>`).join('')}</g>
    <line x1="60" y1="700" x2="1140" y2="700" stroke="${A}" stroke-width="2.4" opacity=".5"/>
    ${moon(200,180,34,A)}`),

  /* plain tools */
  settings: () => scWrap(`<g opacity=".3" stroke="${A}" fill="none" stroke-width="2.4">
      <circle cx="420" cy="420" r="120"/><circle cx="420" cy="420" r="52"/>
      ${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6; return `<line x1="${(420+Math.cos(a)*120).toFixed(0)}" y1="${(420+Math.sin(a)*120).toFixed(0)}" x2="${(420+Math.cos(a)*152).toFixed(0)}" y2="${(420+Math.sin(a)*152).toFixed(0)}" stroke-width="14"/>`;}).join('')}
      <circle cx="790" cy="530" r="76"/><circle cx="790" cy="530" r="32"/>
      ${Array.from({length:10},(_,i)=>{const a=i*Math.PI/5; return `<line x1="${(790+Math.cos(a)*76).toFixed(0)}" y1="${(530+Math.sin(a)*76).toFixed(0)}" x2="${(790+Math.cos(a)*98).toFixed(0)}" y2="${(530+Math.sin(a)*98).toFixed(0)}" stroke-width="10"/>`;}).join('')}</g>`),
};
PAGE_SCENES.calendar = () => scWrap(`<g stroke="${A}" opacity=".22" stroke-width="1.4">${Array.from({length:9},(_,i)=>`<line x1="120" y1="${120+i*72}" x2="1080" y2="${120+i*72}"/>`).join('')}${Array.from({length:8},(_,i)=>`<line x1="${120+i*137}" y1="120" x2="${120+i*137}" y2="696"/>`).join('')}</g>
    <g opacity=".4" fill="${A}">${Array.from({length:26},(_,i)=>`<circle cx="${188+((i*3)%7)*137}" cy="${156+Math.floor(i/7)*72}" r="${4+(i%4)*2}"/>`).join('')}</g>
    ${cloud(300,80,.9,G2,.2)}${moon(980,90,34,A)}`);
PAGE_SCENES.people = () => scWrap(`${hill(560,26,G2,.22)}
    <g stroke="${A}" fill="none" stroke-width="2.4" opacity=".55">${[[380,520,1],[520,540,1.25],[680,530,1.1],[820,545,.9]].map(([x,y,s])=>`<g transform="translate(${x},${y}) scale(${s})"><circle cx="0" cy="-58" r="26"/><path d="M-34,42 q0,-56 34,-56 q34,0 34,56"/></g>`).join('')}</g>
    <g opacity=".3" stroke="${A}" stroke-width="1.4" stroke-dasharray="5 7" fill="none"><path d="M380,470 q70,-60 140,-32"/><path d="M520,468 q80,-46 160,-8"/><path d="M680,478 q70,-30 140,10"/></g>
    ${cloud(300,170,.9,G1,.2)}`);
PAGE_SCENES.board = () => scWrap(`<g opacity=".5" stroke="${A}" fill="none" stroke-width="2.2">${[[180,180,220,150,-3],[440,140,180,240,2],[660,200,250,170,-2],[300,400,200,180,3],[560,430,170,150,-4],[790,420,190,220,2]].map(([x,y,w,h,r])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" transform="rotate(${r} ${x+w/2} ${y+h/2})"/>`).join('')}</g>
    <g opacity=".3" fill="${G2}">${[[180,180,220,150],[660,200,250,170],[300,400,200,180]].map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`).join('')}</g>
    <g opacity=".45" fill="${A}">${[[290,180],[530,140],[785,200],[400,400],[645,430],[885,420]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>`);
PAGE_SCENES.finance = () => scWrap(`${hill(600,18,G2,.2)}
    <g opacity=".5" stroke="${A}" fill="none" stroke-width="2.6">${[[240,560],[380,470],[520,500],[660,380],[800,300],[940,210]].map(([x,y],i,a)=>i?`<line x1="${a[i-1][0]}" y1="${a[i-1][1]}" x2="${x}" y2="${y}"/>`:'').join('')}</g>
    <g opacity=".45" fill="${A}">${[[240,560],[380,470],[520,500],[660,380],[800,300],[940,210]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>
    <g opacity=".28" fill="${G1}">${[0,1,2,3,4].map(i=>`<rect x="${200+i*150}" y="${640-i*46}" width="72" height="${60+i*46}" rx="4"/>`).join('')}</g>
    <line x1="120" y1="700" x2="1080" y2="700" stroke="${A}" stroke-width="2" opacity=".4"/>`);
PAGE_SCENES.chronicle = () => scWrap(`<g stroke="${A}" fill="none" stroke-width="2.6" opacity=".5">
      <path d="M600,250 v380"/><path d="M600,250 q-160,-46 -300,-14 v380 q140,-32 300,14"/><path d="M600,250 q160,-46 300,-14 v380 q-140,-32 -300,14"/></g>
    <g opacity=".28" stroke="${A}" stroke-width="1.4">${Array.from({length:9},(_,i)=>`<line x1="340" y1="${300+i*36}" x2="560" y2="${292+i*36}"/><line x1="640" y1="${292+i*36}" x2="860" y2="${300+i*36}"/>`).join('')}</g>
    ${cloud(280,140,.8,G2,.18)}`);
PAGE_SCENES.rhythm = () => scWrap(`<g stroke="${A}" opacity=".2" stroke-width="1.3">${Array.from({length:13},(_,i)=>`<line x1="150" y1="${110+i*46}" x2="1050" y2="${110+i*46}"/>`).join('')}${Array.from({length:8},(_,i)=>`<line x1="${150+i*129}" y1="110" x2="${150+i*129}" y2="662"/>`).join('')}</g>
    <g opacity=".4">${[[1,2,3,2.5],[2,4,2,2],[3,1,4,3],[4,5,2.5,2],[5,3,3,2.5],[0,6,2,1.5]].map(([c,r,h,w],i)=>`<rect x="${162+c*129}" y="${118+r*46}" width="${w*44}" height="${h*46-8}" rx="5" fill="${i%2?G1:G2}" opacity=".55"/>`).join('')}</g>
    <line x1="150" y1="386" x2="1050" y2="386" stroke="#e07a5f" stroke-width="2" opacity=".55"/><circle cx="150" cy="386" r="5" fill="#e07a5f" opacity=".7"/>`);
PAGE_SCENES.tag = PAGE_SCENES.journals;

/* ---------- a motif no other record has ---------- */
function hashSeed(str){ let h = 2166136261; for(let i=0;i<String(str).length;i++){ h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* an emblem built from the record's own id: arcs, strokes and points that
   land the same way every time you open it, and differently for anything else */
function recordMotifSVG(seedStr, color){
  const r = mulberry32(hashSeed(seedStr)); const c = color || A;
  const cx = 600 + (r()-.5)*160, cy = 380 + (r()-.5)*120;
  let g = '';
  const rings = 3 + Math.floor(r()*3);
  for(let i=0;i<rings;i++){
    const rad = 90 + i*(50 + r()*46); const a0 = r()*Math.PI*2, sweep = .8 + r()*4.2;
    const x0 = cx + Math.cos(a0)*rad, y0 = cy + Math.sin(a0)*rad;
    const x1 = cx + Math.cos(a0+sweep)*rad, y1 = cy + Math.sin(a0+sweep)*rad;
    g += `<path d="M${x0.toFixed(0)},${y0.toFixed(0)} A${rad.toFixed(0)},${rad.toFixed(0)} 0 ${sweep>Math.PI?1:0} 1 ${x1.toFixed(0)},${y1.toFixed(0)}" fill="none" stroke="${c}" stroke-width="${(1.4+r()*2.6).toFixed(1)}" opacity="${(.28+r()*.34).toFixed(2)}" stroke-linecap="round"/>`;
  }
  const strokes = 3 + Math.floor(r()*4);
  for(let i=0;i<strokes;i++){
    const a = r()*Math.PI*2, len = 120 + r()*300;
    const x0 = cx + Math.cos(a)*(60+r()*140), y0 = cy + Math.sin(a)*(60+r()*140);
    g += `<path d="M${x0.toFixed(0)},${y0.toFixed(0)} q${(Math.cos(a+1)*len*.5).toFixed(0)},${(Math.sin(a+1)*len*.5).toFixed(0)} ${(Math.cos(a)*len).toFixed(0)},${(Math.sin(a)*len).toFixed(0)}" fill="none" stroke="${c}" stroke-width="${(1.2+r()*2).toFixed(1)}" opacity="${(.2+r()*.28).toFixed(2)}" stroke-linecap="round"/>`;
  }
  const dots = 5 + Math.floor(r()*9);
  for(let i=0;i<dots;i++){
    const a = r()*Math.PI*2, rad = 60 + r()*330;
    g += `<circle cx="${(cx+Math.cos(a)*rad).toFixed(0)}" cy="${(cy+Math.sin(a)*rad).toFixed(0)}" r="${(2+r()*7).toFixed(1)}" fill="${c}" opacity="${(.2+r()*.35).toFixed(2)}"/>`;
  }
  const seal = 92 + r()*40;
  g += `<rect x="${(cx-seal/2).toFixed(0)}" y="${(cy-seal/2).toFixed(0)}" width="${seal.toFixed(0)}" height="${seal.toFixed(0)}" rx="${(6+r()*12).toFixed(0)}" fill="none" stroke="${c}" stroke-width="3" opacity=".5" transform="rotate(${(r()*20-10).toFixed(1)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
  return scWrap(g);
}
/* which record, if any, this route is about */
function routeRecord(){
  const {name, params} = parseHash(); const id = params[0]; if(!id) return null;
  const pick = (list, colorKey) => { const rec = byId(list||[], id); return rec ? {id, color: colorKey ? (rec[colorKey] || null) : null, name: rec.name || rec.title} : null; };
  switch(name){
    case 'stage':    return pick(S.stages, 'hue');
    case 'value':    return pick(S.values, 'color');
    case 'vision':   return pick(S.visions);
    case 'skills':   { const s = byId(S.skills, id); return s ? {id, color: catColor(s.cat), name:s.name} : null; }
    case 'projects': return pick(S.projects);
    case 'writing':  { const w = byId(S.entries, id); return w ? {id, color:null, name:w.title} : null; }
    case 'commonplace': { const m = byId(S.entries, id); return m ? {id, color:(MEDIA_KINDS[m.extra?.kind]||[])[2]||null, name:m.title} : null; }
    case 'tag':      return {id:'tag:'+id, color:null, name:id};
    default: return null;
  }
}
let _sceneKey = null, _sceneLayer = 0;
function applyPageScene(){
  const layers = [document.getElementById('scA'), document.getElementById('scB')];
  if(!layers[0] || !layers[1]) return;
  const {name} = parseHash(); const rec = routeRecord();
  const key = rec ? `rec:${rec.id}` : `page:${pageThemeKey()}`;
  if(key === _sceneKey) return;
  const svg = rec ? recordMotifSVG(rec.id, rec.color || A) : (PAGE_SCENES[pageThemeKey()] || PAGE_SCENES.home)();
  const next = 1 - _sceneLayer;
  layers[next].innerHTML = svg; layers[next].classList.add('on'); layers[_sceneLayer].classList.remove('on');
  _sceneLayer = next; _sceneKey = key;
}
