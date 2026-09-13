/* ============================================================
   THE MARK OVER EACH DOOR

   One small drawing per room, set beside its title: a sun and a moon for
   Today, an hourglass for the Timeline, a balance for Finance. Line art in
   the room's own accent, drawn rather than set — an emoji would be somebody
   else's drawing in somebody else's style, and a font glyph would be a tofu
   box on a machine without the font.

   Every one is built from the same stroke, so the set reads as one hand:
   a hair over a pixel wide, round at every end and corner, nothing filled
   except where a mark means something (the day kept in the ring of seven).
   ============================================================ */
const MARK_STROKE = "fill='none' stroke='currentColor' stroke-width='1.15' stroke-linecap='round' stroke-linejoin='round'";
/* n copies of one shape, turned evenly about a centre */
const markRing = (n, body, cx = 20, cy = 20, from = 0) => Array.from({length: n}, (_, i) =>
  `<g transform="rotate(${(from + i * 360 / n).toFixed(1)} ${cx} ${cy})">${body}</g>`).join('');

const ROOM_MARKS = {
  /* the day and the night it sits between */
  today: `<circle cx="15.5" cy="17" r="5.6"/>${markRing(8, '<path d="M15.5 8.6V5.6"/>', 15.5, 17)}
    <path d="M33.6 21.4a6.6 6.6 0 1 1-7.7 9.6 7.8 7.8 0 0 0 7.7-9.6Z"/>`,
  /* a book held open, which is what a record is */
  journals: `<path d="M7 28.8c4.2-2.7 8.5-2.7 13 0V13.4C15.5 10.7 11.2 10.7 7 13.4Z"/>
    <path d="M33 28.8c-4.2-2.7-8.5-2.7-13 0V13.4c4.5-2.7 8.8-2.7 13 0Z"/>
    <path d="M20 13.4v15.4"/><path d="M10.5 17.4h6M23.5 17.4h6M10.5 21.4h6M23.5 21.4h6"/>`,
  /* dividers, set to a span and braced */
  projects: `<path d="M20 8.4 11.8 31M20 8.4 28.2 31"/><circle cx="20" cy="7.4" r="1.9"/>
    <path d="M14.6 22.6h10.8"/>`,
  /* seven days in a ring, and the one that was kept */
  rituals: `<circle cx="20" cy="20" r="12.6" stroke-dasharray="1.4 3.6" opacity=".55"/>
    ${markRing(7, '<circle cx="20" cy="8.2" r="2.1"/>')}
    <circle cx="20" cy="8.2" r="2.1" fill="currentColor" stroke="none"/>`,
  /* a rose, pointing at something */
  values: `<circle cx="20" cy="20" r="12.4"/>
    <path d="M20 5.4 22.5 17.5 34.6 20 22.5 22.5 20 34.6 17.5 22.5 5.4 20 17.5 17.5Z"/>
    <circle cx="20" cy="20" r="2"/>`,
  /* what rests on what */
  needs: `<path d="M20 6.2 33 32.4H7Z"/><path d="M14.2 20.6h11.6"/><path d="M10.6 27h18.8"/>`,
  /* five petals and a stem: the thing the tree is made of */
  skills: `${markRing(5, '<ellipse cx="20" cy="12.6" rx="4.2" ry="6.4"/>')}
    <circle cx="20" cy="20" r="2.4"/><path d="M20 26.6q1.6 4 0 8"/>`,
  /* the sand that has already gone through */
  timeline: `<path d="M11.5 6.4h17M11.5 33.6h17"/>
    <path d="M13.2 6.4c0 7 6.8 10.6 6.8 13.6s-6.8 6.6-6.8 13.6"/>
    <path d="M26.8 6.4c0 7-6.8 10.6-6.8 13.6s6.8 6.6 6.8 13.6"/>
    <path d="M16.4 30.8q3.6-3 7.2 0"/><path d="M20 20v4.6"/>`,
  /* the house the rest of the rooms are in */
  compass: `<path d="M6.4 20.6 20 8.4l13.6 12.2"/><path d="M10.4 20v12.6h19.2V20"/>
    <path d="M16.8 32.6V25h6.4v7.6"/>`,
  /* a day measured off along its own length */
  lifetape: `<rect x="5.4" y="14.4" width="29.2" height="11.2" rx="2.4"/>
    <path d="M11 14.4v5M16 14.4v3M21 14.4v5M26 14.4v3M31 14.4v5"/>`,
  /* the month, with the days that have been lived filled in */
  calendar: `<rect x="6.4" y="10.4" width="27.2" height="23.2" rx="3"/>
    <path d="M6.4 17.6h27.2"/><path d="M13 10.4V6.6M27 10.4V6.6"/>
    <circle cx="13.6" cy="23" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="20" cy="23" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="26.4" cy="23" r="1.5"/><circle cx="13.6" cy="29" r="1.5"/><circle cx="20" cy="29" r="1.5"/>`,
  /* what a thing is worth, against what else */
  finance: `<path d="M20 9.6v22.4"/><path d="M12 32h16"/><path d="M6.6 13.6h26.8"/>
    <circle cx="20" cy="11" r="1.7"/>
    <path d="M6.6 13.6 2.8 21.6a4.4 4.4 0 0 0 7.6 0Z"/>
    <path d="M33.4 13.6 29.6 21.6a4.4 4.4 0 0 0 7.6 0Z"/>`,
  /* who is joined to whom */
  people: `<circle cx="10" cy="13.4" r="2.1"/><circle cx="22" cy="8.6" r="2.1"/>
    <circle cx="31.4" cy="18.4" r="2.1"/><circle cx="15.6" cy="26.4" r="2.1"/><circle cx="28" cy="30.4" r="2.1"/>
    <path d="M11.7 14.6 20.2 10.2M23.9 9.8 29.9 16.5M30.4 20.3 28.7 28.3M26.2 30.9 17.6 27M14.4 24.6 11 15.4"/>`,
  /* three things named, and one of them done */
  plan: `<path d="M8.4 12.6h16M8.4 20h16M8.4 27.4h9.6"/><path d="M22.6 27.2l3.2 3.2 7.6-8.6"/>`,
  /* looking at it again, closely */
  reviews: `<circle cx="18" cy="18" r="9.2"/><path d="M24.6 24.6 33 33"/>
    <path d="M13.6 15.6h8.8M13.6 19.6h8.8"/>`,
  /* the nib, and the drop about to leave it */
  writing: `<path d="M14 7h12l-3.4 19L20 32.6 17.4 26Z"/><path d="M14 12.6h12"/>
    <path d="M20 13.4v9.8"/><circle cx="20" cy="24.6" r="1.5"/>`,
  /* what has been read, and read by */
  commonplace: `<path d="M7.6 33.4h24.8"/>
    <rect x="9.4" y="26.4" width="21.2" height="5.2" rx="1.2"/>
    <rect x="11.4" y="21.2" width="17.2" height="5.2" rx="1.2"/>
    <rect x="13.4" y="16" width="13.2" height="5.2" rx="1.2"/>
    <path d="M20 5.6c2.3 2.1 3.4 3.8 3.4 5.4a3.4 3.4 0 0 1-6.8 0c0-1.6 1.1-3.3 3.4-5.4Z"/>`,
  /* the page, and the idea that has not landed on it yet */
  content: `<path d="M10.6 6.6h11.8l6.6 6.6v20.2H10.6Z"/><path d="M22.4 6.6v6.6H29"/>
    <path d="M15.4 20h9M15.4 25h9M15.4 29.6h5.6"/>
    <path d="M32.4 19.4l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3Z"/>`,
  /* the one room that is a mechanism */
  settings: `<circle cx="20" cy="20" r="5.4"/><circle cx="20" cy="20" r="9.8"/>
    ${markRing(8, '<path d="M17.8 10.8 18.3 6.2h3.4l.5 4.6Z"/>')}`,
};

/* A few rooms have a page of their own but borrow another room's colours, so
   the mark is looked up by route first and only then by the theme the route
   resolved to. Planning is the one that matters: it is themed as the house
   because nothing ever claimed the name, and it should still get its own
   list rather than the house's roof. */
const ROOM_MARK_ALIASES = {planning:'plan', rhythm:'lifetape', home:'compass',
  stage:'timeline', value:'values', tag:'journals', import:'settings'};
function roomMarkHTML(){
  const name = (typeof parseHash === 'function' ? parseHash().name : '') || '';
  const key = ROOM_MARK_ALIASES[name] || name;
  const body = ROOM_MARKS[key]
    || ROOM_MARKS[typeof pageThemeKey === 'function' ? pageThemeKey() : 'compass'];
  if(!body) return '';
  return `<svg class="ph-mark" viewBox="0 0 40 40" aria-hidden="true" ${MARK_STROKE}>${body}</svg>`;
}
