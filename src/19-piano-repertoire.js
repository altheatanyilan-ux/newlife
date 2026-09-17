/* ============================================================
   THE REPERTOIRE — what is on the music stand.
   ============================================================ */
const pianoRepView = () => S._pianoRep || 'list';
function setPianoRepView(v){ S._pianoRep = v; rerender(); }

function pianoPieceFilter(){
  S._pianoFilter = S._pianoFilter || {genre:'', status:'', q:''};
  return S._pianoFilter;
}
function pianoFilteredPieces(){
  const f = pianoPieceFilter(), q = (f.q || '').toLowerCase();
  return pianoPieces().filter(x => {
    if(f.genre && x.genre !== f.genre) return false;
    if(f.status && pianoShownStatus(x) !== f.status) return false;
    /* Archived is out of the way by default, but asking for it by name has to
       find it — a filter that names a state and then shows nothing is worse
       than not offering the state at all. */
    if(x.status === 'archived' && f.status !== 'archived') return false;
    if(q && !`${x.title} ${x.composer} ${x.arranger} ${x.tags.join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title));
}
/* "45 days ago" is the number you act on; the date is not. */
function pianoWhenLast(id){
  const n = pianoDaysSince(id);
  if(n == null) return 'never logged';
  return n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`;
}
function pianoStatusDotHTML(x){
  const st = pianoStatus(pianoShownStatus(x));
  return `<span class="pn-dot pn-${st[0]}" title="${esc(st[3])}">${st[2]}</span>`;
}

function pianoListHTML(){
  const rows = pianoFilteredPieces();
  const f = pianoPieceFilter();
  const pick = (id, val, opts, blank) => `<select class="sel sm" id="${id}">
    <option value="">${blank}</option>
    ${opts.map(([v, name]) => `<option value="${v}" ${val === v ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select>`;
  return `<div class="pn-toolbar">
      ${pick('pnGenre', f.genre, PIANO_GENRES, 'every genre')}
      ${pick('pnStatus', f.status, PIANO_STATUSES.map(s => [s[0], s[1]]), 'every state')}
      <input class="inp sm pn-search" id="pnQ" placeholder="title, composer, tag" value="${esc(f.q || '')}">
      <span class="grow"></span>
      <button class="btn sm primary" id="pnAdd">＋ piece</button>
    </div>
    ${rows.length ? `<div class="pn-table" role="table">
      <div class="pn-head" role="row"><span>Title</span><span>Composer</span><span>State</span><span>Last practised</span></div>
      ${rows.map(x => { const rusty = pianoIsRusty(x);
        return `<button class="pn-row${rusty ? ' rusty' : ''}" role="row" data-pnopen="${esc(x.id)}">
        <span class="pn-title serif">${esc(x.title || 'Untitled')}${x.arranger ? `<em class="pn-arr"> arr. ${esc(x.arranger)}</em>` : ''}</span>
        <span class="pn-comp">${esc(x.composer || '—')}</span>
        <span class="pn-state">${pianoStatusDotHTML(x)} ${esc(pianoStatus(pianoShownStatus(x))[1])}${rusty ? '<i class="pn-warn" title="past the rust threshold">⚠</i>' : ''}</span>
        <span class="pn-last mono">${esc(pianoWhenLast(x.id))}</span>
      </button>`; }).join('')}</div>`
    : `<div class="empty">${pianoPieces().length
        ? 'Nothing matches that. Widen the filter.'
        : 'Nothing on the stand yet. A piece here is anything you play, are learning, or mean to learn.'}</div>`}`;
}

/* ---------- the readiness dashboard ----------
   One question: if somebody asked you to play, right now, what would you
   play? Everything else on this page is about work in progress; this is the
   only view that is about what is finished. */
function pianoReadyHTML(){
  const all = pianoPieces().filter(x => x.status !== 'archived');
  const ready = all.filter(x => pianoIsReady(x) && !pianoIsRusty(x))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  const rusty = all.filter(pianoIsRusty)
    .sort((a, b) => (pianoDaysSince(b.id) || 0) - (pianoDaysSince(a.id) || 0));
  const learning = all.filter(x => x.status === 'learning');
  const mins = sum(ready.map(x => +x.duration || 0));
  const line = (x, tail) => `<button class="pn-mini" data-pnopen="${esc(x.id)}">
    <span class="pn-mini-t serif">${esc(x.title || 'Untitled')}</span>
    <span class="pn-mini-c">${esc(x.composer || '')}</span>
    <span class="pn-mini-x mono">${esc(tail)}</span></button>`;
  return `<div class="grid c2 pn-ready">
    <div class="card no-tilt">
      <div class="k">Could play right now <span class="mono faint">${ready.length}</span></div>
      ${ready.length ? `<div class="stack" style="gap:2px">${ready.map(x =>
        line(x, x.duration ? `${x.duration} min` : '—')).join('')}</div>
        <div class="pn-total mono">${mins ? `about ${mins} minutes of music` : 'no lengths written down yet'}</div>`
        : '<div class="empty sm">Nothing is marked performance-ready or polished yet.</div>'}
    </div>
    <div class="stack" style="gap:14px">
      <div class="card no-tilt">
        <div class="k">Going rusty <span class="mono faint">${rusty.length}</span></div>
        <p class="muted" style="font-size:.8rem">Untouched for more than ${pianoState().settings.rustThresholdDays} days. These are the ones you lose without noticing.</p>
        ${rusty.length ? `<div class="stack" style="gap:2px">${rusty.map(x =>
          line(x, `${pianoDaysSince(x.id)} days`)).join('')}</div>`
          : '<div class="empty sm">Nothing has slipped. Good.</div>'}
      </div>
      <div class="card no-tilt">
        <div class="k">Under the hands <span class="mono faint">${learning.length}</span></div>
        ${learning.length ? `<div class="stack" style="gap:2px">${learning.map(x => { const pr = pianoSectionProgress(x);
          return line(x, pr == null ? 'no sections yet' : `${Math.round(pr * 100)}% through its sections`); }).join('')}</div>`
          : '<div class="empty sm">Nothing being learned. That is either rest or drift.</div>'}
      </div>
    </div>
  </div>`;
}

/* ---------- what to practise today ---------- */
function pianoSuggestHTML(){
  const mins = S._pianoBudget || pianoState().settings.defaultPracticeMinutes || 30;
  const {items, free} = pianoSuggestPractice(mins);
  const ICON = {maintenance:'◌', learning:'◐', runthrough:'●'};
  const WORD = {maintenance:'Maintenance', learning:'Learning', runthrough:'Run-through'};
  return `<div class="card no-tilt pn-suggest">
    <div class="row between" style="align-items:baseline">
      <span class="k">If you have <input class="inp sm mono pn-budget" id="pnBudget" type="number" min="5" max="240" step="5" value="${mins}"> minutes</span>
      <span class="mono faint">${items.length ? `${items.length} things` : 'nothing to suggest yet'}</span>
    </div>
    ${items.length ? `<div class="stack" style="gap:8px;margin-top:10px">${items.map(it => `
      <button class="pn-sugg pn-sugg-${it.kind}" data-pnopen="${esc(it.piece.id)}">
        <span class="pn-sugg-i">${ICON[it.kind]}</span>
        <span class="pn-sugg-b">
          <span class="pn-sugg-h"><b class="serif">${esc(it.piece.title)}</b> <span class="mono faint">${WORD[it.kind]} · ${it.minutes} min</span></span>
          <span class="pn-sugg-w">${esc(it.why)}</span></span>
      </button>`).join('')}
      ${free >= 2 ? `<div class="pn-free mono">＋ ${free} minutes free — sight-reading, or whatever you actually want to play</div>` : ''}
      </div>
      <button class="btn sm primary" id="pnSuggGo" style="margin-top:12px">start the clock on the first one</button>`
    : `<div class="empty sm">Add a piece or two and this will tell you where the time should go.</div>`}
  </div>`;
}

/* ---------- one piece, in full ---------- */
function pianoPieceHTML(x){
  const logs = pianoLogsFor(x.id);
  const total = pianoTotalMinutes(x.id);
  const st = pianoStatus(pianoShownStatus(x));
  const meta = [pianoGenreName(x.genre), x.key, x.tempo,
    x.duration ? `about ${x.duration} min` : '', x.timeSignature].filter(Boolean);
  return `<div class="pn-piece">
    <button class="btn sm ghost" id="pnBack">← the whole stand</button>
    <h2 class="serif pn-h">${esc(x.title || 'Untitled')}</h2>
    <div class="pn-sub">${esc(x.composer || 'composer unknown')}${x.arranger ? ` · arr. ${esc(x.arranger)}` : ''}
      ${meta.length ? ` · ${esc(meta.join(' · '))}` : ''}</div>
    <div class="pn-badges">
      <span class="pn-badge">${pianoStatusDotHTML(x)} ${esc(st[1])}</span>
      <span class="pn-badge">${esc((PIANO_DIFFICULTIES.find(d => d[0] === x.difficulty) || [,''])[1])}</span>
      ${total ? `<span class="pn-badge mono">${total} minutes logged</span>` : ''}
      <span class="pn-badge mono">last played ${esc(pianoWhenLast(x.id))}</span>
      ${x.emotionalTag ? `<span class="pn-badge">${esc(x.emotionalTag)}</span>` : ''}
    </div>

    <div class="grid c2" style="gap:16px;margin-top:16px">
      <div class="card no-tilt">
        <div class="row between"><span class="k">Sections</span>
          <button class="pl-mini" id="pnSecAdd">＋ section</button></div>
        <p class="muted" style="font-size:.8rem">A piece is not uniformly learned. Naming the passages is how you find out which twenty bars are costing you the performance.</p>
        ${(x.sections || []).length ? `<div class="stack" style="gap:4px;margin-top:8px">${x.sections.map(s => {
          const r = pianoReadiness(s.readiness);
          return `<div class="pn-sec" data-pnsec="${esc(s.id)}">
            <input class="pn-secname" value="${esc(s.name)}" data-pnsecname="${esc(s.id)}" placeholder="Exposition · the bridge · mm. 32–48">
            <span class="pn-pips" role="group" aria-label="how ready this passage is">${PIANO_READINESS.map(([rid, , n]) =>
              `<button class="pn-pip${n <= r[2] ? ' on' : ''}" data-pnready="${esc(s.id)}|${rid}" title="${esc(PIANO_READINESS[n][1])}"></button>`).join('')}</span>
            <span class="pn-secr mono">${esc(r[1])}</span>
            <button class="del-x inline" data-pnsecdel="${esc(s.id)}" title="remove this section">×</button>
            <input class="pn-secnote" value="${esc(s.notes)}" data-pnsecnote="${esc(s.id)}" placeholder="what is actually wrong with it">
          </div>`; }).join('')}</div>`
          : '<div class="empty sm">No sections yet.</div>'}
      </div>

      <div class="card no-tilt">
        <div class="row between"><span class="k">Practice history</span>
          <button class="btn sm primary" id="pnLog">＋ log practice</button></div>
        ${pianoHeatHTML(x.id)}
        ${logs.length ? `<div class="stack pn-logs" style="gap:2px;margin-top:10px">${logs.slice(0, 12).map(l => `
          <div class="pn-log">
            <span class="mono pn-log-d">${esc(l.date === today() ? 'today' : fmtDate(l.date, 'short'))}</span>
            <span class="mono pn-log-m">${l.durationMinutes} min</span>
            <span class="pn-log-f">${esc(l.focusArea || (l.sections || []).map(id =>
              (byId(x.sections, id) || {}).name).filter(Boolean).join(', ') || 'the whole of it')}</span>
            <span class="pn-log-q">${esc((PIANO_QUALITIES.find(q => q[0] === l.quality) || [,'—'])[1].toLowerCase())}</span>
            ${l.currentBpm ? `<span class="mono pn-log-b">♩=${l.currentBpm}</span>` : ''}
            <button class="del-x inline" data-pnlogdel="${esc(l.id)}" title="delete this entry">×</button>
          </div>`).join('')}
          ${logs.length > 12 ? `<div class="faint mono" style="font-size:.72rem">…and ${logs.length - 12} earlier</div>` : ''}</div>`
          : '<div class="empty sm">Nothing logged yet.</div>'}
      </div>
    </div>

    ${pianoTempoHTML(x)}

    <div class="card no-tilt" style="margin-top:16px">
      <div class="k">The piece itself</div>
      <div class="grid c2" style="gap:10px;margin-top:8px">
        <label class="pd-q"><span class="k">title</span><input class="inp" data-pnf="title" value="${esc(x.title)}"></label>
        <label class="pd-q"><span class="k">composer</span><input class="inp" data-pnf="composer" value="${esc(x.composer)}"></label>
        <label class="pd-q"><span class="k">arranger</span><input class="inp" data-pnf="arranger" value="${esc(x.arranger)}"></label>
        <label class="pd-q"><span class="k">genre</span><select class="sel" data-pnf="genre">${PIANO_GENRES.map(([v, n]) =>
          `<option value="${v}" ${x.genre === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label class="pd-q"><span class="k">state</span><select class="sel" data-pnf="status">${PIANO_STATUSES.map(([v, n]) =>
          `<option value="${v}" ${x.status === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label class="pd-q"><span class="k">difficulty</span><select class="sel" data-pnf="difficulty">${PIANO_DIFFICULTIES.map(([v, n]) =>
          `<option value="${v}" ${x.difficulty === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label class="pd-q"><span class="k">key</span><input class="inp" data-pnf="key" value="${esc(x.key)}" placeholder="Db major"></label>
        <label class="pd-q"><span class="k">tempo</span><input class="inp" data-pnf="tempo" value="${esc(x.tempo)}" placeholder="♩= 72, Andante"></label>
        <label class="pd-q"><span class="k">target ♩=</span><input class="inp mono" type="number" data-pnf="targetBpm" value="${x.targetBpm ?? ''}"></label>
        <label class="pd-q"><span class="k">time</span><input class="inp" data-pnf="timeSignature" value="${esc(x.timeSignature)}" placeholder="3/4"></label>
        <label class="pd-q"><span class="k">minutes</span><input class="inp mono" type="number" data-pnf="duration" value="${x.duration ?? ''}"></label>
        <label class="pd-q"><span class="k">feels like</span><input class="inp" data-pnf="emotionalTag" value="${esc(x.emotionalTag)}" placeholder="reflective · triumphant"></label>
        <label class="pd-q"><span class="k">sheet music</span>${linkBoxHTML(
          `<input class="inp" data-pnf="sheetUrl" value="${esc(x.sheetUrl)}" placeholder="where the score is">`, x.sheetUrl)}</label>
        <!-- A piece is rarely only yours: somebody taught it to you, somebody
             sings it with you, somebody asked for it at a wedding. And an
             original belongs to the project it came out of. -->
        <label class="pd-q"><span class="k">project</span><select class="sel" data-pnf="projectId">
          <option value="">— none —</option>
          ${(S.projects || []).map(pr => `<option value="${esc(pr.id)}" ${x.projectId === pr.id ? 'selected' : ''}>${esc(pr.name)}</option>`).join('')}</select></label>
      </div>
      ${(S.people || []).length ? `<div style="margin-top:10px"><span class="k mono">who this piece has people in it</span>
        <div class="pn-keypick">${(S.people || []).map(pp =>
          `<button class="pn-kp${x.peopleIds.includes(pp.id) ? ' on' : ''}" data-pnperson="${esc(pp.id)}">${esc(pp.name)}</button>`).join('')}</div></div>` : ''}
      <label class="pd-q" style="margin-top:10px"><span class="k">notes</span>
        <textarea class="inp" rows="4" data-pnf="notes" placeholder="Anything about it: who taught it to you, what it is for, the bar that never works.">${esc(x.notes)}</textarea></label>
      <!-- Scores, transcription audio and the records you are learning it
           from are library entries like any other: they are things you have
           read or listened to, and they belong where the rest of that lives.
           A media entry that points at a piece shows up here, on the piece. -->
      ${pianoLibraryHTML(x)}
      <div class="row" style="margin-top:12px;gap:8px">
        <button class="btn sm ghost" id="pnTimer">sit down with it</button>
        <button class="btn sm ghost" id="pnLib">file something in the Library</button>
        <span class="grow"></span>
        <button class="btn sm ghost danger" id="pnDel">delete this piece</button>
      </div>
    </div>
  </div>`;
}

/* Thirty days of dots, the same grid the habits use — one glance says whether
   this is a piece you are actually working on or one you think you are. */
function pianoHeatHTML(id){
  const by = {};
  pianoLogsFor(id).forEach(l => { by[l.date] = (by[l.date] || 0) + (+l.durationMinutes || 0); });
  const days = Array.from({length:30}, (_, i) => addDays(today(), i - 29));
  return `<div class="pn-heat" role="img" aria-label="the last thirty days">${days.map(d => {
    const m = by[d] || 0;
    const lvl = !m ? 0 : m < 15 ? 1 : m < 35 ? 2 : 3;
    return `<i class="pn-hd l${lvl}" title="${esc(fmtDate(d, 'med'))}${m ? ` — ${m} min` : ' — nothing'}"></i>`;
  }).join('')}</div>`;
}
/* The tempo climb. It is the one chart here that is genuinely a chart: a
   number that is supposed to go up over months, with a line across it for
   the tempo the piece is actually marked at. */
function pianoTempoHTML(x){
  const series = pianoBpmSeries(x.id);
  if(series.length < 2) return '';
  const target = +x.targetBpm || Math.max(...series.map(s => s.bpm));
  return `<div class="card no-tilt pn-tempo" style="margin-top:16px">
    <div class="row between" style="align-items:baseline"><span class="k">Tempo</span>
      <span class="mono faint">${series[0].bpm} → ${series[series.length - 1].bpm}${x.targetBpm ? ` · target ♩=${x.targetBpm}` : ''}</span></div>
    <div class="pn-spark">${sparkline(series.map(s => s.bpm), {h:64, color:'var(--sage)',
      min:Math.min(...series.map(s => s.bpm)) - 4, max:Math.max(target, ...series.map(s => s.bpm)) + 4})}</div>
    <div class="mono faint" style="font-size:.72rem">${esc(fmtDate(series[0].date, 'short'))} — ${esc(fmtDate(series[series.length - 1].date, 'short'))}</div>
  </div>`;
}

/* ---------- setlists ---------- */
function pianoSetlistsHTML(){
  const sls = pianoSetlists();
  const cur = S._pianoSet ? pianoSetlist(S._pianoSet) : null;
  if(cur) return pianoOneSetlistHTML(cur);
  return `<div class="row between" style="align-items:baseline">
      <span class="k">Sets</span><button class="btn sm primary" id="pnSlAdd">＋ set</button></div>
    <p class="muted" style="font-size:.85rem">A named order of pieces, for a night. The total tells you whether it is a set or half of one.</p>
    ${sls.length ? `<div class="grid c3" style="gap:12px;margin-top:12px">${sls.map(sl => {
      const warn = setlistWarnings(sl);
      return `<button class="card no-tilt pn-slcard" data-pnset="${esc(sl.id)}">
        <div class="serif pn-sl-h">${esc(sl.name || 'Untitled set')}</div>
        <div class="mono faint">${(sl.pieces || []).length} ${(sl.pieces || []).length === 1 ? 'piece' : 'pieces'} · ${setlistMinutes(sl)} min</div>
        ${warn.length ? `<div class="pn-slwarn">⚠ ${esc(warn.join(', '))}</div>` : '<div class="pn-slok">all of it ready</div>'}
      </button>`; }).join('')}</div>`
      : '<div class="empty">No sets yet.</div>'}`;
}
function pianoOneSetlistHTML(sl){
  const warn = setlistWarnings(sl);
  const rows = (sl.pieces || []).map((p, i) => ({p, i, x:pianoPiece(p.pieceId)})).filter(r => r.x);
  const pool = pianoPieces().filter(x => x.status !== 'archived' && !(sl.pieces || []).some(p => p.pieceId === x.id));
  return `<button class="btn sm ghost" id="pnSlBack">← every set</button>
    <div class="row between" style="align-items:baseline;margin-top:10px">
      <input class="inp serif-lg pn-slname" id="pnSlName" value="${esc(sl.name)}" placeholder="Bar night set">
      <span class="mono">${setlistMinutes(sl)} min</span></div>
    ${warn.length ? `<div class="pn-slwarn big">⚠ ${esc(warn.join(' · '))}</div>` : ''}
    <div class="stack pn-slrows" style="gap:4px;margin-top:12px">${rows.length ? rows.map(({p, i, x}) => `
      <div class="pn-slrow" data-pnslrow="${i}">
        <span class="mono pn-sln">${i + 1}.</span>
        <span class="serif pn-slt">${esc(x.title)}</span>
        <span class="pn-slc">${esc(x.composer || '')}</span>
        <span class="mono pn-slm">${x.duration ? x.duration + ' min' : '—'}</span>
        <span class="pn-sls">${pianoStatusDotHTML(x)} ${esc(pianoStatus(pianoShownStatus(x))[1])}</span>
        <input class="pn-slnote" value="${esc(p.notes || '')}" data-pnslnote="${i}" placeholder="start rubato, pick it up in the bridge">
        <button class="pl-mini" data-pnslup="${i}" ${i === 0 ? 'disabled' : ''} title="earlier">↑</button>
        <button class="pl-mini" data-pnsldn="${i}" ${i === rows.length - 1 ? 'disabled' : ''} title="later">↓</button>
        <button class="del-x inline" data-pnslrm="${i}" title="take it out">×</button>
      </div>`).join('') : '<div class="empty sm">Nothing in the set yet.</div>'}</div>
    ${pool.length ? `<div class="row" style="margin-top:12px;gap:8px">
      <select class="sel" id="pnSlPick"><option value="">— add a piece —</option>
        ${pool.map(x => `<option value="${esc(x.id)}">${esc(x.title)}${x.composer ? ' — ' + esc(x.composer) : ''}</option>`).join('')}</select>
      <span class="grow"></span>
      <button class="btn sm ghost" id="pnSlPrint">print view</button>
      <button class="btn sm ghost danger" id="pnSlDel">delete the set</button></div>`
      : `<div class="row" style="margin-top:12px;gap:8px"><span class="grow"></span>
        <button class="btn sm ghost" id="pnSlPrint">print view</button>
        <button class="btn sm ghost danger" id="pnSlDel">delete the set</button></div>`}`;
}
/* A programme, not a screen: black on white, serif, and the apparatus — the
   states, the notes to self, the buttons — left out, because none of it is
   anybody else's business. */
function openSetlistPrint(sl){
  const rows = (sl.pieces || []).map(p => pianoPiece(p.pieceId)).filter(Boolean);
  openModal(`<div class="pn-print">
    <h1 class="serif">${esc(sl.name || 'Programme')}</h1>
    <div class="pn-print-rule"></div>
    <ol class="pn-print-list">${rows.map(x => `<li>
      <span class="pn-print-t serif">${esc(x.title)}</span>
      <span class="pn-print-c">${esc(x.composer || '')}</span></li>`).join('')}</ol>
    <div class="pn-print-rule"></div>
    <div class="pn-print-foot">${rows.length} ${rows.length === 1 ? 'piece' : 'pieces'}${
      setlistMinutes(sl) ? ` · about ${setlistMinutes(sl)} minutes` : ''}</div>
  </div>`, 'narrow pn-print-modal');
}

/* Everything in the Library that points back at this piece. The link is a
   field on the entry, so the Library keeps being one shelf rather than
   growing a second one for music. */
function pianoLibraryFor(id){
  return (S.entries || []).filter(e => e.type === 'media' && e.pieceId === id);
}
function pianoLibraryHTML(x){
  const rows = pianoLibraryFor(x.id);
  if(!rows.length) return '';
  return `<div class="pn-lib"><span class="k mono">in the Library</span>
    ${rows.map(e => `<a class="pn-tune" href="#/journals/library">${esc(e.title || 'untitled')}</a>`).join('')}</div>`;
}
