/* ============================================================
   REVIEWS THAT COME TO YOU
   A review is useful the night a cycle ends, while the period is
   still in the room. So the instrument stops keeping a hub of
   rituals you have to remember to visit: on the last day of each
   cycle the review surfaces on Today, carrying the period's own
   numbers with it, and a reading of that period's entries — and
   only that period's entries.
   ============================================================ */

const monthEnd = d => { const x = parseDay(d); return x.getDate() === new Date(x.getFullYear(), x.getMonth()+1, 0).getDate(); };
const monthOf  = d => parseDay(d).getMonth();          /* 0–11 */

/* Each cycle names the last day it occupies. That day's evening is when the
   review appears — the night before the next one starts. */
const CYCLES = [
  {key:'daily',     flow:'lastEvening',  name:'Daily review',     len:'5 minutes',
   isEnd: () => true,
   from:  d => d,
   blurb: 'The day you are closing — what happened in it, and what it cost.'},
  {key:'weekly',    flow:'lastWeekly',   name:'Weekly review',    len:'15 minutes',
   isEnd: d => parseDay(d).getDay() === 0,
   from:  d => addDays(d, -6),
   blurb: 'Seven days, before Monday takes them.'},
  {key:'monthly',   flow:'lastMonthly',  name:'Monthly review',   len:'15 minutes',
   isEnd: d => monthEnd(d),
   from:  d => d.slice(0,8) + '01',
   blurb: 'The month at once: what moved, what went quiet.'},
  {key:'quarterly', flow:'lastSeasonal', name:'Quarterly review', len:'30 minutes',
   isEnd: d => monthEnd(d) && [2,5,8,11].includes(monthOf(d)),
   from:  d => { const x = parseDay(d); return isoDay(new Date(x.getFullYear(), x.getMonth()-2, 1)); },
   blurb: 'A season. Long enough that the shape is visible.'},
  {key:'half',      flow:'lastHalf',     name:'Half-year review', len:'45 minutes',
   isEnd: d => monthEnd(d) && [5,11].includes(monthOf(d)),
   from:  d => { const x = parseDay(d); return isoDay(new Date(x.getFullYear(), x.getMonth()-5, 1)); },
   blurb: 'Six months side by side.'},
  {key:'annual',    flow:'lastAnnual',   name:'Annual rite',      len:'1–2 hours',
   isEnd: d => monthEnd(d) && monthOf(d) === 11,
   from:  d => d.slice(0,4) + '-01-01',
   blurb: 'The whole year on one screen, then the narrative.'},
];

/* A review is answered for its period if the flow was last run inside it. A
   dismissal is remembered against the same period, so "not tonight" is not
   forgotten by the next re-render — and is not carried into the next cycle. */
function cyclePeriodId(c, d){ return `${c.key}:${d}`; }
function cycleDismissed(c, d){ return !!(S.reviews?.dismissed || {})[cyclePeriodId(c, d)]; }
function dismissCycle(c, d){ S.reviews = S.reviews || {}; S.reviews.dismissed = S.reviews.dismissed || {};
  S.reviews.dismissed[cyclePeriodId(c, d)] = new Date().toISOString(); saveNow(); }
function cycleAnswered(c, d){ const last = (S.reviews || {})[c.flow]; return !!last && last.slice(0,10) >= c.from(d); }

/* What is due tonight — plus anything whose cycle ended in the last few days
   and was never answered, because a review missed is not a review cancelled. */
function reviewsDue(d = today(), {grace = 3} = {}){
  const out = [];
  CYCLES.forEach(c => {
    for(let back = 0; back <= (c.key === 'daily' ? 0 : grace); back++){
      const end = addDays(d, -back);
      if(!c.isEnd(end)) continue;
      if(cycleAnswered(c, end) || cycleDismissed(c, end)) break;
      out.push({c, end, from: c.from(end), late: back});
      break;
    }
  });
  return out;
}

/* ---------- the period's own numbers ---------- */
function cycleStats(from, to){
  const days = []; { let d = from, g = 0; while(d <= to && g++ < 400){ days.push(d); d = addDays(d, 1); } }
  const habits = S.habits.filter(h => !h.archived && !h.negative);
  const perDay = days.map(d => {
    const due = habits.filter(h => habitDue(h, d));
    const done = due.filter(h => habitDone(h, d));
    return {d, due: due.length, done: done.length, rate: due.length ? done.length / due.length : null};
  });
  const habDue = sum(perDay.map(x => x.due)), habDone = sum(perDay.map(x => x.done));
  const tasks = days.flatMap(d => tasksForDay(d));
  const items = typeof tapeItems === 'function' ? tapeItems(from, to) : [];
  const entries = items.filter(it => it.kind !== 'habit');
  const byKind = {}; entries.forEach(it => byKind[it.kind] = (byKind[it.kind] || 0) + 1);
  const entriesPerDay = days.map(d => entries.filter(it => it.date === d).length);
  const setpoints = days.map(d => S.checkins?.[d]?.setpoint).filter(x => x > 0);
  return {days, perDay, entriesPerDay, items, entries, byKind,
    habits: {due: habDue, done: habDone, rate: habDue ? Math.round(habDone / habDue * 100) : null},
    tasks: {total: tasks.length, done: tasks.filter(t => t.done).length},
    setpoint: setpoints.length ? Math.round(avg(setpoints)) : null};
}

/* one figure, two series: the entries written each day as bars, the habit
   completion of each day as a line over them */
function cycleGraphHTML(st){
  const n = st.days.length; if(!n) return '';
  const W = Math.max(160, n * (n > 60 ? 5 : n > 14 ? 12 : 26)), H = 56, pad = 6;
  const maxE = Math.max(1, ...st.entriesPerDay);
  const bw = Math.max(2, (W / n) * .62);
  const x = i => (i + .5) * (W / n);
  const bars = st.entriesPerDay.map((v, i) => {
    if(!v) return '';
    const h = (v / maxE) * (H - pad * 2);
    return `<rect x="${(x(i) - bw/2).toFixed(1)}" y="${(H - pad - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="var(--page-accent)" opacity=".42"><title>${esc(fmtDate(st.days[i],'short'))} · ${v} entr${v===1?'y':'ies'}</title></rect>`;
  }).join('');
  const pts = st.perDay.map((r, i) => r.rate == null ? null : `${x(i).toFixed(1)},${(H - pad - r.rate * (H - pad*2)).toFixed(1)}`).filter(Boolean);
  const line = pts.length > 1 ? `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--sage)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>` : '';
  const dots = st.perDay.map((r, i) => r.rate == null ? '' : `<circle cx="${x(i).toFixed(1)}" cy="${(H - pad - r.rate*(H-pad*2)).toFixed(1)}" r="${n > 40 ? 1.2 : 2}" fill="var(--sage)"><title>${esc(fmtDate(r.d,'short'))} · ${r.done}/${r.due} habits</title></circle>`).join('');
  return `<div class="cyc-graph"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none">${bars}${line}${dots}</svg>
    <div class="cyc-legend mono"><span><i style="background:var(--page-accent);opacity:.5"></i>entries a day</span><span><i style="background:var(--sage)"></i>habits kept</span></div></div>`;
}

function cycleCardHTML(due){
  const {c, end, from, late} = due;
  const st = cycleStats(from, end);
  const span = from === end ? fmtDate(end, 'med') : `${fmtDate(from,'short')} – ${fmtDate(end,'short')}`;
  const kinds = Object.entries(st.byKind).sort((a,b) => b[1]-a[1]).slice(0,4);
  return `<article class="cyc-card ${late ? 'late' : ''}" data-cyc="${c.key}" data-cycend="${end}">
    <div class="row between" style="align-items:baseline;gap:10px;flex-wrap:wrap">
      <b class="serif" style="font-size:1.08rem">${esc(c.name)}</b>
      <span class="mono faint">${esc(span)}${late ? ` · ${late} day${late===1?'':'s'} late` : ''} · ${esc(c.len)}</span>
    </div>
    <p class="muted" style="font-size:.85rem;margin:5px 0 10px">${esc(c.blurb)}</p>
    <div class="cyc-figs">
      <div><span class="k">habits</span><b>${st.habits.rate === null ? '—' : st.habits.rate + '%'}</b><span class="mono">${st.habits.done}/${st.habits.due}</span></div>
      <div><span class="k">tasks</span><b>${st.tasks.total ? Math.round(st.tasks.done/st.tasks.total*100) + '%' : '—'}</b><span class="mono">${st.tasks.done}/${st.tasks.total}</span></div>
      <div><span class="k">entries</span><b>${st.entries.length}</b><span class="mono">${kinds.map(([k,v]) => `${esc(k)} ${v}`).join(' · ') || 'nothing written'}</span></div>
      ${st.setpoint ? `<div><span class="k">set-point</span><b>${st.setpoint}</b><span class="mono">${esc(hicksName(st.setpoint))}</span></div>` : ''}
    </div>
    ${cycleGraphHTML(st)}
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
      <button class="btn sm primary" data-cycstart="${c.key}:${end}">Begin the review</button>
      <button class="btn sm ghost" data-cycask="${c.key}:${end}">✦ Ask Claude about this ${esc(c.key === 'daily' ? 'day' : c.key === 'annual' ? 'year' : c.key.replace('ly',''))}</button>
      <button class="btn sm ghost" data-cycskip="${c.key}:${end}">not tonight</button>
    </div>
    <div class="cyc-answer" hidden></div>
  </article>`;
}

function reviewsDueHTML(d = today()){
  const due = reviewsDue(d); if(!due.length) return '';
  return `<section class="section rv cyc-block" id="t-reviews">
    <div class="row between" style="align-items:baseline">
      <span class="sc lg" style="margin:0">${due.length === 1 ? 'A cycle closes tonight' : 'Cycles close tonight'}</span>
      <span class="mono faint">${due.length} review${due.length===1?'':'s'} waiting</span>
    </div>
    <p class="muted" style="font-size:.85rem;margin:6px 0 0">A review lands the night the period ends, while it is still in the room.</p>
    ${due.map(cycleCardHTML).join('')}
  </section>`;
}

function bindReviewsDue(root){
  const box = root.querySelector('.cyc-block'); if(!box) return;
  const find = v => { const [key, end] = v.split(':'); const c = CYCLES.find(x => x.key === key); return c ? {c, end, from: c.from(end)} : null; };
  box.querySelectorAll('[data-cycstart]').forEach(b => b.onclick = () => {
    const d = find(b.dataset.cycstart); if(!d) return;
    const fn = (REVIEW_FLOWS.find(f => f[0] === d.c.flow) || [])[4];
    if(fn) fn(); else toast('That review is not wired up.');
  });
  box.querySelectorAll('[data-cycskip]').forEach(b => b.onclick = () => {
    const d = find(b.dataset.cycskip); if(!d) return;
    dismissCycle(d.c, d.end); sound('click'); rerender();
  });
  box.querySelectorAll('[data-cycask]').forEach(b => b.onclick = () => {
    const d = find(b.dataset.cycask); if(!d) return;
    askAboutPeriod(d.c, d.from, d.end, b.closest('.cyc-card').querySelector('.cyc-answer'), b);
  });
}

/* ---------- the reading ----------
   Claude is given this period and nothing else: the entries written between
   the two dates, the habits kept in them, the tasks. No other window of the
   life is in the prompt, so the reading cannot quietly become a reading of
   the whole instrument. */
const PERIOD_SYSTEM = `You are reading one bounded stretch of somebody's own journal, on their request, so they can review that period.

Absolute rules:
- Only the material given is in scope. It is one time period. Never generalise to their whole life, their character, or periods you were not shown.
- Do not invent events, feelings, people or causes. If the material is thin, say it is thin.
- Speak to them as "you". Plain, warm, unsentimental. No therapy voice, no cheerleading, no advice they did not ask for.
- Notice what is actually repeated: themes, the language they reach for, what appears and then stops appearing, tension between what they planned and what they wrote.

Return four short parts, each as a heading followed by two or three sentences:
What this period was actually about
What repeated
What is missing that you would expect
One question worth sitting with`;

function periodDigest(from, to, st){
  const lines = [];
  lines.push(`Period: ${from} to ${to} (${st.days.length} day${st.days.length===1?'':'s'}).`);
  lines.push(`Habits: ${st.habits.done} of ${st.habits.due} kept${st.habits.rate === null ? '' : ` (${st.habits.rate}%)`}. Tasks: ${st.tasks.done} of ${st.tasks.total} done.`);
  if(st.setpoint) lines.push(`Average emotional set-point: ${st.setpoint} — ${hicksName(st.setpoint)}.`);
  lines.push('');
  lines.push('ENTRIES IN THIS PERIOD (nothing outside it is included):');
  if(!st.entries.length) lines.push('(none — the period was not written in)');
  st.entries.forEach(it => {
    const body = String(it.body || '').replace(/\s+/g, ' ').trim().slice(0, 700);
    lines.push(`- [${it.date}] (${it.kind}) ${String(it.title || '').trim()}${body ? ': ' + body : ''}`);
  });
  const intentions = st.days.map(d => [d, (typeof dayPlan === 'function' ? dayPlan(d).intentions : []) || []])
    .filter(([, xs]) => xs.filter(Boolean).length);
  if(intentions.length){
    lines.push('', 'WHAT WAS PLANNED, DAY BY DAY:');
    intentions.forEach(([d, xs]) => lines.push(`- [${d}] ${xs.filter(Boolean).join(' / ')}`));
  }
  return lines.join('\n');
}

/* a reading without a key: real counts, no invented interpretation */
function localPeriodReading(from, to, st){
  const kinds = Object.entries(st.byKind).sort((a,b) => b[1]-a[1]);
  const busiest = st.days[st.entriesPerDay.indexOf(Math.max(...st.entriesPerDay))];
  const silent = st.days.filter((d,i) => !st.entriesPerDay[i]).length;
  const bits = [];
  bits.push(`<b>${st.entries.length}</b> entr${st.entries.length===1?'y':'ies'} across <b>${st.days.length}</b> day${st.days.length===1?'':'s'}${kinds.length ? `, mostly ${esc(kinds[0][0])} (${kinds[0][1]})` : ''}.`);
  if(silent) bits.push(`<b>${silent}</b> day${silent===1?'':'s'} went unwritten.`);
  if(st.entries.length && busiest) bits.push(`The fullest day was ${esc(fmtDate(busiest,'med'))}.`);
  if(st.habits.rate !== null) bits.push(`Habits held at <b>${st.habits.rate}%</b>.`);
  if(st.tasks.total) bits.push(`You finished <b>${st.tasks.done}</b> of <b>${st.tasks.total}</b> planned task${st.tasks.total===1?'':'s'}.`);
  return `<p>${bits.join(' ')}</p><p class="faint" style="font-size:.82rem">These are counts, not a reading. A reading needs an Anthropic API key — Settings has the field, and only this period's entries are ever sent.</p>`;
}

async function askAboutPeriod(c, from, to, out, btn){
  const st = cycleStats(from, to);
  out.hidden = false;
  if(!aiReady()){ out.innerHTML = localPeriodReading(from, to, st); return; }
  const was = btn.textContent; btn.disabled = true; btn.textContent = 'reading…';
  out.innerHTML = `<p class="faint">Reading ${st.entries.length} entr${st.entries.length===1?'y':'ies'} from ${esc(fmtDate(from,'short'))} to ${esc(fmtDate(to,'short'))} — and nothing else.</p>`;
  try {
    const text = await askClaude(PERIOD_SYSTEM, periodDigest(from, to, st), {maxTokens: 1400});
    out.innerHTML = `<div class="cyc-reading">${mdInline(text)}</div>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm ghost" data-cyckeep>keep this as a reflection</button></div>`;
    out.querySelector('[data-cyckeep]').onclick = () => {
      S.entries.push({id:uid(), type:'reflection', title:`${c.name} — ${fmtDate(from,'short')} to ${fmtDate(to,'short')}`, body:text,
        occurredAt:to, createdAt:new Date().toISOString(), media:[],
        links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[]},
        people:[], places:[], emotions:[], confidence:'', extra:{}});
      saveNow(); sound('success'); toast('Kept in Journals.');
    };
    sound('chime');
  } catch(e){
    out.innerHTML = `<p class="muted">${esc(e.message)}</p>` + localPeriodReading(from, to, st);
  }
  btn.disabled = false; btn.textContent = was;
}

/* a very small markdown: headings and paragraphs, nothing else */
function mdInline(t){
  return String(t || '').split(/\n{2,}/).map(p => {
    const line = p.trim(); if(!line) return '';
    if(/^#{1,4}\s/.test(line)) return `<h4>${esc(line.replace(/^#{1,4}\s*/, ''))}</h4>`;
    if(line.length < 60 && !/[.!?]$/.test(line) && !/^[-*]/.test(line)) return `<h4>${esc(line)}</h4>`;
    return `<p>${esc(line).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
