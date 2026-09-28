/* ============================================================
   TAKE A READING ELSEWHERE

   A reading is a question held up against a life, and a reader who has only
   the cards has half of it. So any reading can be written out as one file:
   the question, what was drawn, what each card (or hexagram, or charm) means
   in the deck's own words, what you made of it — and as much of the life
   around it as you choose to send with it. The file is plain Markdown, which
   reads as well to a person as it pastes into another reader, an AI included.

   How wide the life around it is, is yours to say: that day, that week, that
   month, or three months. And which parts of it go: your plans and
   intentions (the day's and the week's), the work done, due and coming with
   the milestones ahead, how you have been (check-ins, sleep, the evening
   notes), the other readings in that span and the cards that keep coming
   back, your journal, what you are building toward, your habits. Each part
   says how much it holds before you tick it. The journal and the habits
   start unticked, because they are the most yours.

   Nothing here reads, sends or asks anything: the file is made on this
   device, from what is already on it, and goes only where you take it — a
   download, or the clipboard. Nothing about the reading is changed by
   writing it out. Your choices are remembered for next time.
   ============================================================ */

const RB_WINDOWS = [['day', 'that day', 1], ['week', 'that week', 7], ['month', 'that month', 30], ['season', 'three months', 91]];
const RB_PARTS = [
  ['plan',     'Plans and intentions',      true],
  ['work',     'Tasks and milestones',      true],
  ['state',    'How I have been',           true],
  ['readings', 'Other readings',            true],
  ['journal',  'Journal entries',           false],
  ['compass',  'What I am building toward', true],
  ['habits',   'Habits',                    false],
];
const RB_NOTE = 'Please give me a personal reading of this. Read the cards against what is actually going on for me, which is below — tell me what you notice, what it might be pointing at, and what question it leaves me with, rather than only what the cards mean in general.';

function rbPrefs(){
  const st = S.settings = S.settings || {};
  const p = st.readingBrief = st.readingBrief && typeof st.readingBrief === 'object' ? st.readingBrief : {};
  if(!RB_WINDOWS.some(w => w[0] === p.win)) p.win = 'week';
  p.inc = Object.assign(Object.fromEntries(RB_PARTS.map(x => [x[0], x[2]])), p.inc || {});
  p.depth = p.depth === 'short' ? 'short' : 'full';
  if(typeof p.note !== 'string') p.note = RB_NOTE;
  p.jx = Array.isArray(p.jx) ? p.jx : [];
  return p;
}

/* A reading to write out is either one already kept (an entry) or one on the
   table right now, not kept yet (the record divinationSave would be given). */
function rbSource(src){
  if(src && src.entryId){
    const e = (S.entries || []).find(x => x.id === src.entryId); if(!e) return null;
    const d = (typeof divinationOf === 'function' && divinationOf(e)) || {};
    return {entryId: e.id, day: (e.occurredAt || '').slice(0, 10) || today(), at: e.createdAt || '',
      title: e.title || '', d, reading: e.body || ''};
  }
  const r = (src && src.rec) || {};
  return {entryId: null, day: (src && src.day) || today(), at: new Date().toISOString(), title: r.title || '',
    d: {system: r.system || 'tarot', question: r.question || '', spread: r.spread || '', cards: r.cards || [],
      lines: r.lines || null, hexagram: r.hexagram || null, relating: r.relating || null, charms: r.charms || null,
      deck: r.deck || '', method: r.method || null, source: r.source || 'digital'},
    reading: r.reading || ''};
}

/* ---------- small writing helpers ---------- */
const rbDay = d => fmtDate(d);                              /* Monday, 28 September 2026 */
const rbShort = d => { const x = parseDay(d); return `${DOW[x.getDay()].slice(0, 3)} ${fmtDate(d, 'short')}`; };
const rbClock = iso => { if(!iso) return ''; const x = new Date(iso); if(isNaN(x)) return '';
  let h = x.getHours(); const m = String(x.getMinutes()).padStart(2, '0'); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${m} ${ap}`; };
const rbHM = hm => { if(!hm || !/^\d{1,2}:\d{2}/.test(hm)) return ''; let [h, m] = hm.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
/* text the person wrote goes in as it is, but quoted, so a stray "#" at the
   start of a line cannot turn their words into a heading */
const rbQuote = t => String(t || '').trim().split('\n').map(l => '> ' + l).join('\n');
const rbLine = t => String(t || '').replace(/\s+/g, ' ').trim();
function rbDays(from, to){ const out = []; for(let d = from; d <= to; d = addDays(d, 1)) out.push(d); return out; }
function rbSpan(day, win){
  const n = (RB_WINDOWS.find(w => w[0] === win) || RB_WINDOWS[1])[2];
  return {from: addDays(day, -(n - 1)), to: day, n};
}
const rbSysName = s => ({tarot: 'Tarot', iching: 'I Ching', oracle: 'Oracle', charms: 'Charms'})[s] || 'A reading';

/* ---------- what was drawn, and what it means ---------- */
function rbTarotMD(d, depth){
  const morning = d.spread === 'morning';
  const sp = morning ? {name: 'The morning card (one card, for the day)'} : (typeof spreadById === 'function' ? spreadById(d.spread) : {name: d.spread || ''});
  const out = [`**Spread:** ${sp.name}${d.source === 'physical' ? ' — laid out with a real deck and entered by hand' : ''}`, ''];
  (d.cards || []).forEach((pick, i) => {
    const c = typeof tarotCard === 'function' ? tarotCard(pick.card) : null; if(!c) return;
    const side = pick.rev ? c.reversed : c.upright;
    const slot = morning ? 'present' : (typeof tarotSlot === 'function' ? tarotSlot(d.spread, i) : 'present');
    out.push(`### ${(d.cards.length > 1 ? (i + 1) + '. ' : '')}${pick.pos ? pick.pos + ' — ' : ''}${c.name}${pick.rev ? ', reversed' : ''}`);
    const facts = [c.arcana === 'major' ? 'Major Arcana' : `Minor Arcana, ${c.suit}`,
      c.element ? `element ${c.element}` : '', c.planet ? `${c.planet}` : '',
      c.numerology && c.numerology.meaning ? `number ${c.numerology.number}: ${c.numerology.meaning}` : ''].filter(Boolean);
    out.push(`- ${facts.join(' · ')}`);
    if(c.essence) out.push(`- **Essence:** ${c.essence}`);
    if(side.themes && side.themes.length) out.push(`- **${pick.rev ? 'Reversed' : 'Upright'}, its themes:** ${side.themes.join(', ')}`);
    else if(c.keywords.length) out.push(`- **Keywords:** ${c.keywords.join(', ')}`);
    if(depth === 'full' && c.imagery) out.push(`- **What the card shows:** ${c.imagery}`);
    out.push('', `**What it means ${pick.rev ? 'reversed' : 'upright'}:** ${side.summary || side.plain || ''}`);
    if(depth === 'full'){
      (side.inDepth || '').split('\n\n').filter(Boolean).forEach(p => out.push('', p));
      const g = c.positionGuidance ? c.positionGuidance[slot] : '';
      if(g) out.push('', `**In a ${slot} position:** ${g}`);
      if(side.questions && side.questions.length) out.push('', '**Questions it asks:**', ...side.questions.map(q => `- ${q}`));
      if(side.advice) out.push('', `**Counsel:** ${side.advice}`);
      const rel = (c.relatedCards || []).map(n => TAROT[n] && TAROT[n].n).filter(Boolean);
      if(rel.length) out.push('', `*Cards that speak to it:* ${rel.join(', ')}`);
    }
    out.push('');
  });
  return out.join('\n');
}
function rbIChingMD(d, depth){
  const out = [];
  if(d.method) out.push(`**Cast with:** ${d.method === 'yarrow' ? 'yarrow stalks' : 'three coins'}`);
  if(Array.isArray(d.lines) && d.lines.length){
    out.push('', '**The lines, from the bottom up:**');
    d.lines.forEach((l, i) => out.push(`- line ${i + 1}: ${l.v ? 'yang (unbroken)' : 'yin (broken)'}${l.moving ? ', moving' : ''}${l.total ? ` — ${l.total}` : ''}`));
  }
  const one = (ref, role) => {
    const h = ref && typeof ICHING !== 'undefined' ? ICHING.find(x => x.i === ref.i) : null; if(!h) return;
    const rich = typeof ichingRich === 'function' ? ichingRich(h.i) : null;
    out.push('', `### ${role}: hexagram ${h.i}, ${h.n} (${h.c})`);
    if(h.k && h.k.length) out.push(`- **Keywords:** ${h.k.join(', ')}`);
    out.push(`- **The judgement:** ${h.j}`, `- **The image:** ${h.m}`);
    if(depth === 'full' && rich){
      (rich.d || '').split('\n\n').filter(Boolean).forEach(p => out.push('', p));
      if(rich.mi) out.push('', rich.mi);
      if(role === 'As cast'){
        const moving = (d.lines || []).map((l, i) => l.moving ? i : -1).filter(i => i >= 0);
        moving.forEach(i => rich.L && rich.L[i] && out.push('', `**Moving line ${i + 1}:** ${rich.L[i]}`));
      }
      if(rich.q && rich.q.length) out.push('', '**Questions it asks:**', ...rich.q.map(q => `- ${q}`));
    }
  };
  one(d.hexagram, 'As cast');
  one(d.relating, 'As it becomes');
  return out.join('\n') + '\n';
}
function rbOracleMD(d){
  const deck = typeof ORACLE_DECKS !== 'undefined' ? ORACLE_DECKS.find(k => k.id === d.deck) : null;
  const out = [deck ? `**Deck:** ${deck.name}` : ''];
  (d.cards || []).forEach(c => { out.push('', `### ${c.name || 'The card'}`); if(c.text) out.push(c.text); });
  return out.filter((x, i) => x || i).join('\n') + '\n';
}
function rbCharmsMD(d, depth){
  if(typeof castAnalyse !== 'function') return '';
  const a = castAnalyse(d.charms || []);
  const out = [];
  if(typeof castNarrative === 'function') out.push(`**What the cast says, read off the cloth:** ${castNarrative(a)}`);
  out.push('', '**Where each charm came down (face up):**');
  a.readable.slice().sort((x, y) => x.d - y.d).forEach(m => {
    out.push(`- **${m.charm.name}**${a.sig && m === a.sig ? ' (at the heart of the cast)' : ''} — ${m.ring.name.toLowerCase()}, toward ${m.quarter.name.toLowerCase()}${
      m.charm.k && m.charm.k.length ? ` · ${m.charm.k.join(', ')}` : ''}${depth === 'full' && m.charm.m ? `. ${m.charm.m}` : ''}`);
  });
  if(a.clusters.length) out.push('', `**Fell together:** ${a.clusters.map(c => c.map(m => m.charm.name).join(' + ')).join('; ')}`);
  if(a.hidden.length) out.push('', `**Still face down:** ${a.hidden.length}`);
  return out.join('\n') + '\n';
}
function rbDrawnMD(src, depth){
  const d = src.d;
  if(d.system === 'iching') return rbIChingMD(d, depth);
  if(d.system === 'oracle') return rbOracleMD(d);
  if(d.system === 'charms') return rbCharmsMD(d, depth);
  return rbTarotMD(d, depth);
}

/* ---------- the life around it: one function per part ----------
   Each returns {n, said, md}: how much it holds, that said in a few words for
   the checkbox, and the Markdown itself. */
function rbPlanPart(ctx){
  const days = rbDays(ctx.from, ctx.to).filter(d => {
    const p = S.plans && S.plans[d], c = S.checkins && S.checkins[d];
    return (c && (c.intention || '').trim()) || (p && (p.planned || (p.intentions || []).some(x => (x || '').trim()) || p.why || p.firstMove || p.protect || p.risk || p.letGo));
  });
  const md = [];
  days.forEach(d => {
    const p = (S.plans && S.plans[d]) || {}, c = (S.checkins && S.checkins[d]) || {};
    const rows = [];
    if((c.intention || '').trim()) rows.push(`- **Intention:** ${rbLine(c.intention)}`);
    const ints = (p.intentions || []).map(rbLine).filter(Boolean);
    if(ints.length) rows.push(`- **What I meant to do:** ${ints.join('; ')}`);
    [['why', 'Why the day exists'], ['firstMove', 'First move'], ['protect', 'What I was protecting'],
     ['energyHigh', 'When I expected energy'], ['energyLow', 'When I expected it low'],
     ['risk', 'What I knew would get in the way'], ['ifThen', 'If–then'], ['letGo', 'What I was letting go of']]
      .forEach(([k, lab]) => { if((p[k] || '').trim()) rows.push(`- **${lab}:** ${rbLine(p[k])}`); });
    if(rows.length) md.push(`**${rbShort(d)}**`, ...rows, '');
  });
  /* the week's plan, for every week the span touches */
  const weeks = [...new Set(rbDays(ctx.from, ctx.to).map(d => isoWeek(d)))];
  let wkN = 0;
  weeks.forEach(wk => {
    const p = S.weekPlans && S.weekPlans[wk]; if(!p) return;
    const goals = (p.outcomes || []).filter(o => (o.text || '').trim());
    const wins = typeof weekWins === 'function' ? weekWins(p) : [];
    const risks = typeof weekRisks === 'function' ? weekRisks(p) : [];
    const periods = typeof weekPeriods === 'function' ? weekPeriods(p) : [];
    if(!(p.theme || '').trim() && !goals.length && !wins.length && !risks.length && !periods.length) return;
    wkN++;
    md.push(`**The week's plan (${wk})**`);
    if((p.theme || '').trim()) md.push(`- **Theme:** ${rbLine(p.theme)}`);
    goals.forEach(o => {
      const l = o.linkType === 'list' && typeof planList === 'function' ? planList(o.linkId) : null;
      const ts = (o.taskIds || []).map(id => (S.tasks || []).find(t => t.id === id)).filter(Boolean);
      md.push(`- **Goal:** ${rbLine(o.text)}${l ? ` (${l.name})` : ''}${ts.length ? ` — ${ts.filter(t => t.done).length} of ${ts.length} of its tasks done` : ''}`);
    });
    /* each stage of the week, with the work it was given and how much is done */
    periods.forEach(x => { const ts = (x.taskIds || []).map(id => (S.tasks || []).find(t => t.id === id)).filter(Boolean);
      md.push(`- **Stage, ${rbShort(x.from)}–${rbShort(x.to)}${x.name ? ', ' + rbLine(x.name) : ''}:** ${rbLine(x.focus || '')}${
        ts.length ? `${(x.focus || '').trim() ? ' — ' : ''}${ts.filter(t => t.done).length} of ${ts.length} of its tasks done (${ts.map(t => rbLine(t.text)).join('; ')})` : ''}`); });
    wins.forEach(w => md.push(`- **A win would be:** ${rbLine(w.text)}${(w.why || '').trim() ? ` — because ${rbLine(w.why)}` : ''}`));
    risks.forEach(r => md.push(`- **What could take it away:** ${rbLine(r.text)}${(r.prevent || '').trim() ? ` — heading it off by ${rbLine(r.prevent)}` : ''}`));
    md.push('');
  });
  const n = days.length + wkN;
  return {n, said: n ? [days.length ? `${days.length} day${days.length === 1 ? '' : 's'} planned` : '', wkN ? `the week's plan` : ''].filter(Boolean).join(', ') : 'nothing written', md: md.join('\n')};
}
function rbWorkPart(ctx){
  const refs = typeof allTaskRefs === 'function' ? allTaskRefs() : [];
  const where = r => r.where || (r.task && r.task.listId && typeof planList === 'function' && planList(r.task.listId)?.name) || '';
  const inSpan = d => d && d >= ctx.from && d <= ctx.to;
  const done = refs.filter(r => r.done && inSpan((r.task.doneAt || '').slice(0, 10)));
  const open = refs.filter(r => !r.done && r.task.day && r.task.day <= ctx.to && (ctx.n > 1 ? r.task.day >= addDays(ctx.from, -30) : true));
  const ahead = addDays(ctx.to, 7);
  const coming = refs.filter(r => !r.done && r.task.day && r.task.day > ctx.to && r.task.day <= ahead);
  const byDay = (a, b) => (a.task.day || '').localeCompare(b.task.day || '');
  open.sort(byDay); coming.sort(byDay);
  const lists = typeof planLists === 'function' ? planLists() : [];
  const ms = lists.flatMap(l => (typeof planListMilestones === 'function' ? planListMilestones(l) : []).map(m => ({m, l})))
    .filter(({m}) => m.date && (m.done ? inSpan(m.doneAt ? m.doneAt.slice(0, 10) : m.date) : m.date >= ctx.from && m.date <= addDays(ctx.to, 30)))
    .sort((a, b) => a.m.date.localeCompare(b.m.date));
  const cap = (xs, k) => xs.length > k ? [...xs.slice(0, k), {more: xs.length - k}] : xs;
  const row = (r, box) => r.more ? `- …and ${r.more} more` : `- [${box}] ${rbLine(r.text)}${where(r) ? ` (${where(r)})` : ''}${r.task.day && !r.done ? ` — due ${rbShort(r.task.day)}${r.task.day < ctx.to ? ', overdue' : ''}` : ''}`;
  const md = [];
  if(done.length) md.push(`**Done ${ctx.n === 1 ? 'that day' : 'in this span'} (${done.length})**`, ...cap(done, 40).map(r => row(r, 'x')), '');
  if(open.length) md.push(`**Still open, due by ${rbShort(ctx.to)} (${open.length})**`, ...cap(open, 30).map(r => row(r, ' ')), '');
  if(coming.length) md.push(`**Coming in the week after (${coming.length})**`, ...cap(coming, 25).map(r => row(r, ' ')), '');
  if(ms.length){
    md.push('**Milestones**');
    ms.forEach(({m, l}) => { const pr = typeof planMilestoneProgress === 'function' ? planMilestoneProgress(m.id) : {total: 0};
      md.push(`- ${rbShort(m.date)} — ${rbLine(m.name)} (${l.name})${m.done ? ', met' : pr.total ? ` · ${pr.left} of ${pr.total} of its tasks still to do` : ''}${(m.note || '').trim() ? ` — ${rbLine(m.note)}` : ''}`); });
    md.push('');
  }
  const n = done.length + open.length + coming.length + ms.length;
  return {n, said: n ? [`${done.length} done`, `${open.length} open`, coming.length ? `${coming.length} coming` : '', ms.length ? `${ms.length} milestone${ms.length === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ') : 'nothing dated', md: md.join('\n')};
}
function rbStatePart(ctx){
  const md = [];
  let n = 0;
  rbDays(ctx.from, ctx.to).forEach(d => {
    const c = (S.checkins && S.checkins[d]) || {}, r = (S.dailyRhythm && S.dailyRhythm[d]) || {}, rv = (S.reviewLog && S.reviewLog[d]) || {};
    const bits = [];
    const woke = r.wakeTime || (c.wakeAt ? isoToHM(c.wakeAt) : '');
    const prev = S.dailyRhythm && S.dailyRhythm[addDays(d, -1)];
    const slept = prev && prev.sleepTime ? prev.sleepTime : '';
    if(slept) bits.push(`to bed ${rbHM(slept)} the night before`);
    if(woke) bits.push(`woke ${rbHM(woke)}`);
    if(c.setpoint) bits.push(`emotional set-point ${c.setpoint}/22 (${hicksName(c.setpoint)})`);
    if(rv.moods && rv.moods.length) bits.push(`felt ${rv.moods.join(', ').toLowerCase()}`);
    const lines = [];
    if((c.sentence || '').trim()) lines.push(`  - How the day was going: “${rbLine(c.sentence)}”`);
    if((rv.note || '').trim()) lines.push(`  - At the end of it: “${rbLine(rv.note)}”`);
    if(!bits.length && !lines.length) return;
    n++;
    md.push(`- **${rbShort(d)}**${bits.length ? ' — ' + bits.join(' · ') : ''}`, ...lines);
  });
  return {n, said: n ? `${n} day${n === 1 ? '' : 's'} with something noted` : 'nothing noted', md: md.join('\n') + (md.length ? '\n' : '')};
}
function rbReadingsPart(ctx, src){
  const inSpan = e => { const d = (e.occurredAt || '').slice(0, 10); return d >= ctx.from && d <= ctx.to; };
  const others = (S.entries || []).filter(e => e.type === 'divination' && e.id !== src.entryId && inSpan(e))
    .sort((a, b) => (a.occurredAt || '').localeCompare(b.occurredAt || '') || (a.createdAt || '').localeCompare(b.createdAt || ''));
  const md = [];
  others.forEach(e => { const d = divinationOf(e) || {};
    md.push(`- **${rbShort(e.occurredAt.slice(0, 10))}**, ${rbSysName(d.system).toLowerCase()}: ${rbLine(divinationLine(e) || e.title)}${d.question ? ` — asked “${rbLine(d.question)}”` : ''}`);
    if((e.body || '').trim()) md.push(`  - What I made of it: ${rbLine(e.body)}`); });
  /* the cards that keep coming back — over three months whatever the span,
     because a pattern needs more than a week to be one */
  const from90 = addDays(ctx.to, -90);
  const tally = {};
  const count = cards => (cards || []).forEach(c => { if(typeof c.card === 'number') tally[c.card] = (tally[c.card] || 0) + 1; });
  (S.entries || []).filter(e => e.type === 'divination' && e.id !== src.entryId && (e.occurredAt || '') >= from90 && (e.occurredAt || '').slice(0, 10) <= ctx.to)
    .forEach(e => { const d = divinationOf(e); if(d && d.system === 'tarot') count(d.cards); });
  if(src.d.system === 'tarot') count(src.d.cards);
  const again = Object.entries(tally).filter(([, k]) => k > 1).sort((a, b) => b[1] - a[1]).slice(0, 12);
  if(again.length) md.push('', `**Cards that have come up more than once in the last three months:** ${again.map(([c, k]) => `${TAROT[c].n} ×${k}`).join(', ')}`);
  return {n: others.length, said: `${others.length} other${others.length === 1 ? '' : 's'}${again.length ? ', and the cards that recur' : ''}`, md: md.join('\n') + (md.length ? '\n' : '')};
}
/* a journal's own name, custom journals included, before the built-in type's */
const rbTypeName = t => ((S.journals || []).find(j => j.type === t) || {}).name
  || ((typeof ENTRY_TYPES !== 'undefined' && ENTRY_TYPES.find(x => x[0] === t)) || [, t])[1];
function rbJournalTypes(ctx){
  const inSpan = e => { const d = (e.occurredAt || e.createdAt || '').slice(0, 10); return d >= ctx.from && d <= ctx.to; };
  const es = (S.entries || []).filter(e => e.type !== 'divination' && inSpan(e));
  const by = {};
  es.forEach(e => { by[e.type || 'uncategorized'] = (by[e.type || 'uncategorized'] || 0) + 1; });
  return {es, by};
}
function rbJournalPart(ctx, prefs){
  const {es} = rbJournalTypes(ctx);
  const keep = es.filter(e => !prefs.jx.includes(e.type || 'uncategorized'))
    .sort((a, b) => (a.occurredAt || a.createdAt || '').localeCompare(b.occurredAt || b.createdAt || ''));
  const md = [];
  keep.forEach(e => {
    md.push(`**${rbShort((e.occurredAt || e.createdAt).slice(0, 10))} · ${rbTypeName(e.type)}${(e.title || '').trim() ? ' — ' + rbLine(e.title) : ''}**`);
    if((e.body || '').trim()) md.push(rbQuote(e.body));
    md.push('');
  });
  return {n: keep.length, said: `${keep.length} entr${keep.length === 1 ? 'y' : 'ies'}`, md: md.join('\n')};
}
function rbCompassPart(){
  const vals = (S.valueOrder || []).map(id => byId(S.values || [], id)).filter(Boolean);
  const vis = (S.visions || []).filter(v => !v.archived && v.status !== 'released' && (v.title || v.name || '').trim());
  const th = (S.threads || []).filter(t => t.status !== 'archived' && t.status !== 'done' && (t.name || '').trim());
  const md = [];
  if(vals.length) md.push(`**My values, in the order I hold them:** ${vals.map(v => rbLine(v.name)).join(', ')}`);
  if(vis.length) md.push('', '**What I am working toward:**', ...vis.slice(0, 20).map(v => `- ${rbLine(v.title || v.name)}`));
  if(th.length) md.push('', `**The threads running through my life now:** ${th.slice(0, 20).map(t => rbLine(t.name)).join(', ')}`);
  const n = vals.length + vis.length + th.length;
  return {n, said: [vals.length ? `${vals.length} values` : '', vis.length ? `${vis.length} vision${vis.length === 1 ? '' : 's'}` : '', th.length ? `${th.length} thread${th.length === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ') || 'nothing set', md: md.join('\n') + (md.length ? '\n' : '')};
}
function rbHabitsPart(ctx){
  const hs = (S.habits || []).filter(h => !h.archived && !h.negative);
  const days = rbDays(ctx.from, ctx.to);
  const md = [];
  hs.forEach(h => {
    const due = days.filter(d => typeof habitDue === 'function' && habitDue(h, d));
    if(!due.length) return;
    const kept = due.filter(d => typeof habitDone === 'function' && habitDone(h, d)).length;
    md.push(`- ${rbLine(h.name)} — kept ${kept} of the ${due.length} day${due.length === 1 ? '' : 's'} it was due`);
  });
  return {n: md.length, said: `${md.length} habit${md.length === 1 ? '' : 's'}`, md: md.join('\n') + (md.length ? '\n' : '')};
}
function rbParts(src, prefs){
  const ctx = Object.assign({}, rbSpan(src.day, prefs.win));
  return {ctx, parts: {
    plan: rbPlanPart(ctx), work: rbWorkPart(ctx), state: rbStatePart(ctx), readings: rbReadingsPart(ctx, src),
    journal: rbJournalPart(ctx, prefs), compass: rbCompassPart(), habits: rbHabitsPart(ctx)}};
}

/* ---------- the whole file ---------- */
function readingBriefMD(srcIn, prefsIn){
  const src = srcIn && srcIn.d ? srcIn : rbSource(srcIn); if(!src) return '';
  const prefs = Object.assign({}, rbPrefs(), prefsIn || {});
  prefs.inc = Object.assign({}, rbPrefs().inc, (prefsIn && prefsIn.inc) || {});
  const {ctx, parts} = rbParts(src, prefs);
  const d = src.d;
  const winLabel = (RB_WINDOWS.find(w => w[0] === prefs.win) || RB_WINDOWS[1])[1];
  const what = d.system === 'tarot' ? (d.spread === 'morning' ? 'Tarot — the morning card' : `Tarot — ${typeof spreadById === 'function' ? spreadById(d.spread).name : 'a spread'}`)
    : rbSysName(d.system);
  const chosen = RB_PARTS.filter(([k]) => prefs.inc[k] && parts[k].md.trim());
  const out = [
    `# A reading, and what surrounds it`, '',
    `- **Drawn:** ${rbDay(src.day)}${rbClock(src.at) ? ', ' + rbClock(src.at) : ''}`,
    `- **What:** ${what}`,
    `- **The life around it:** ${winLabel}${ctx.n > 1 ? ` (${fmtDate(ctx.from, 'short')} – ${fmtDate(ctx.to, 'med')})` : ''}${chosen.length ? ' — ' + chosen.map(x => x[1].toLowerCase().replace(/\bi\b/g, 'I')).join(', ') : ''}`,
    `- Written out from my own records on ${fmtDate(today(), 'med')}. The meanings are the deck's standard text; everything else I wrote myself.`,
    ''];
  if((prefs.note || '').trim()) out.push(`## What I would like from you`, '', prefs.note.trim(), '');
  out.push(`## The question`, '', d.question ? rbQuote(d.question) : '*No question was written down — the reading was drawn to see what came.*', '');
  out.push(`## ${d.system === 'iching' ? 'The hexagram' : d.system === 'charms' ? 'The cast' : (d.cards || []).length > 1 ? 'The cards' : 'The card'}`, '', rbDrawnMD(src, prefs.depth).trim(), '');
  out.push(`## What I made of it`, '', (src.reading || '').trim() ? rbQuote(src.reading) : '*Nothing written yet.*', '');
  if(chosen.length){
    out.push('---', '', `# Around it: ${winLabel}`, '');
    chosen.forEach(([k, label]) => out.push(`## ${label}`, '', parts[k].md.trim(), ''));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
function readingBriefName(src){
  const d = src.d; const bits = d.system === 'tarot'
    ? (d.cards || []).slice(0, 3).map(c => TAROT[c.card] ? TAROT[c.card].n : '').filter(Boolean).join(' ')
    : d.system === 'iching' && d.hexagram ? 'hexagram ' + d.hexagram.i : d.system;
  const slug = String((d.spread === 'morning' ? 'morning card ' : '') + bits).toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `reading-${src.day}${slug ? '-' + slug : ''}.md`;
}
function rbDownload(text, name){
  const blob = new Blob([text], {type: 'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function rbCopy(text){
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch(e){} ta.remove(); return ok; };
  try {
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => fallback());
  } catch(e){}
  return Promise.resolve(fallback());
}

/* ---------- the composer ---------- */
function openReadingBrief(srcIn){
  const src = rbSource(srcIn);
  if(!src){ toast('That reading is not there any more.'); return null; }
  const prefs = rbPrefs();
  const sum = (typeof divinationLine === 'function' && src.entryId)
    ? divinationLine((S.entries || []).find(e => e.id === src.entryId)) : (src.title || rbSysName(src.d.system));
  const m = openModal(`<div class="rb">
    <h2 class="serif">Take this reading elsewhere</h2>
    <p class="muted rb-lede">One file with the reading in it — the question, what came up and what it means — and as much of the life around it as you choose to send with it, for another reader: a person, or an AI. It is made here, on this device, and goes only where you take it.</p>
    <div class="rb-what"><span class="mono faint">${esc(rbSysName(src.d.system))} · ${esc(fmtDate(src.day, 'med'))}</span><b class="serif">${esc(sum || '')}</b></div>
    <div class="field"><label>The life around it</label>
      <div class="seg rb-win" role="radiogroup" aria-label="how much of the life around it">${RB_WINDOWS.map(([k, lab]) =>
        `<button type="button" role="radio" data-rbwin="${k}" aria-checked="${prefs.win === k}" class="${prefs.win === k ? 'on' : ''}">${esc(lab)}</button>`).join('')}</div></div>
    <div class="field"><label>What goes with it</label><div class="rb-parts" id="rbParts"></div></div>
    <div class="field"><label>The meanings</label>
      <div class="seg rb-depth" role="radiogroup" aria-label="how much of each meaning">
        <button type="button" role="radio" data-rbdepth="full" class="${prefs.depth === 'full' ? 'on' : ''}" aria-checked="${prefs.depth === 'full'}">in full</button>
        <button type="button" role="radio" data-rbdepth="short" class="${prefs.depth === 'short' ? 'on' : ''}" aria-checked="${prefs.depth === 'short'}">in brief</button></div></div>
    <div class="field"><label>A note to whoever reads it <button type="button" class="dp-lnk rb-reset" id="rbNoteReset">as it was</button></label>
      <textarea class="ta" id="rbNote" rows="3">${esc(prefs.note)}</textarea></div>
    <details class="rb-prev"><summary><span>What the file says</span> <span class="mono faint" id="rbSize"></span></summary><pre class="rb-pre" id="rbPre"></pre></details>
    <div class="row between rb-acts">
      <button class="btn ghost" id="rbCopy">Copy it</button>
      <button class="btn primary" id="rbSave">⤓ Download the file</button></div>
  </div>`, 'narrow');
  let text = '';
  const draw = () => {
    const {parts} = rbParts(src, prefs);
    const {by} = rbJournalTypes(rbSpan(src.day, prefs.win));
    m.querySelector('#rbParts').innerHTML = RB_PARTS.map(([k, lab]) => {
      const p = parts[k]; const on = !!prefs.inc[k];
      return `<label class="rb-part${on ? ' on' : ''}${p.n ? '' : ' empty'}"><input type="checkbox" data-rbpart="${k}"${on ? ' checked' : ''}>
        <span class="rb-part-t">${esc(lab)}</span><span class="mono faint rb-part-n">${esc(p.said)}</span></label>
        ${k === 'journal' && on && Object.keys(by).length ? `<div class="rb-jtypes" aria-label="which kinds of entry">${Object.entries(by).map(([t, n]) =>
          `<button type="button" class="chip click${prefs.jx.includes(t) ? '' : ' on'}" data-rbjt="${esc(t)}" aria-pressed="${!prefs.jx.includes(t)}">${esc(rbTypeName(t))} <span class="mono">${n}</span></button>`).join('')}</div>` : ''}`;
    }).join('');
    text = readingBriefMD(src, prefs);
    m.querySelector('#rbPre').textContent = text;
    const words = (text.match(/\S+/g) || []).length;
    m.querySelector('#rbSize').textContent = `${words.toLocaleString()} words`;
    m.querySelectorAll('[data-rbpart]').forEach(c => c.onchange = () => { prefs.inc[c.dataset.rbpart] = c.checked; saveNow(); draw(); });
    m.querySelectorAll('[data-rbjt]').forEach(b => b.onclick = () => { const t = b.dataset.rbjt;
      prefs.jx = prefs.jx.includes(t) ? prefs.jx.filter(x => x !== t) : [...prefs.jx, t]; saveNow(); draw(); });
  };
  m.querySelectorAll('[data-rbwin]').forEach(b => b.onclick = () => { prefs.win = b.dataset.rbwin;
    m.querySelectorAll('[data-rbwin]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
    saveNow(); draw(); });
  m.querySelectorAll('[data-rbdepth]').forEach(b => b.onclick = () => { prefs.depth = b.dataset.rbdepth;
    m.querySelectorAll('[data-rbdepth]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
    saveNow(); draw(); });
  const note = m.querySelector('#rbNote');
  note.oninput = () => { prefs.note = note.value; text = readingBriefMD(src, prefs); m.querySelector('#rbPre').textContent = text; };
  note.onchange = () => saveNow();
  m.querySelector('#rbNoteReset').onclick = () => { note.value = RB_NOTE; prefs.note = RB_NOTE; saveNow(); draw(); };
  m.querySelector('#rbSave').onclick = () => { rbDownload(text, readingBriefName(src)); if(typeof sound === 'function') sound('success');
    toast('Saved as a file. Nothing was sent anywhere.'); };
  m.querySelector('#rbCopy').onclick = () => rbCopy(text).then(ok => toast(ok ? 'Copied — paste it wherever you are taking it.' : 'Could not copy here; download the file instead.'));
  draw();
  return m;
}

/* the button that opens it, beside "keep" on every reading as it is dealt */
const divTakeHTML = () => `<button type="button" class="btn sm ghost" id="dvTake" title="write this reading, and what surrounds it, into a file to take to another reader">⤓ take it elsewhere</button>`;
function bindDivTake(root, recNow, day){
  const b = root.querySelector('#dvTake'); if(!b) return;
  b.onclick = () => openReadingBrief({rec: recNow(), day: day || today()});
}
/* and on every reading already kept, wherever it is shown: one listener, in
   the capture phase, so the card it sits on does not also open */
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-rbexport]'); if(!b) return;
  ev.preventDefault(); ev.stopPropagation();
  openReadingBrief({entryId: b.dataset.rbexport});
}, true);
