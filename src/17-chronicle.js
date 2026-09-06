/* ============================================================
   CHRONICLE — the whole thing as a document you can hold.
   Renders the record into a printable book: stages and their
   narratives, the chapters ahead, values, people, the memories
   worth keeping. Print it, or save it as a PDF from the print
   dialogue — no library, nothing sent anywhere.
   ============================================================ */
const CHRONICLE_SECTIONS = [
  ['cover',    'Title page',        'Your name, the date, one line.'],
  ['stages',   'The chapters lived','Each life stage with its narrative and years.'],
  ['memories', 'Memories',          'Formative events and the entries you marked as memories.'],
  ['threads',  'Threads',           'The motifs that run through more than one chapter.'],
  ['vision',   'What comes next',   'The chapters ahead and the goals inside them.'],
  ['values',   'The compass',       'Your values, their order, and where they stand.'],
  ['people',   'The people',        'Who is in the inner rings, and what they gave you.'],
  ['letters',  'Letters',           'Letters to yourself that have been opened.'],
  ['closing',  'A closing page',    'One page left blank for a hand-written line.'],
];
function chronicleConfig(){
  const c = S.settings.chronicle = Object.assign({sections:CHRONICLE_SECTIONS.map(s=>s[0]), images:true, title:'', subtitle:'', author:''}, S.settings.chronicle || {});
  return c;
}
routes.chronicle = function(root){
  const c = chronicleConfig();
  const on = k => c.sections.includes(k);
  registerPageEntry({pageName:'Chronicle', addLabel:'Print or save as PDF', defaultEntryType:'none', prefilledFields:{}, options:[
    {icon:'⎙', label:'Print or save as PDF', desc:'Opens your print dialogue; choose "Save as PDF" there.', run:()=>window.print()}]});
  const stages = S.stages.filter(s => !s.notyet);
  const memories = sortEntries(S.entries.filter(e => ['memory','lifeevent','artifact'].includes(e.type) && !letterIsSealed(e)));
  const eras = typeof erasList === 'function' ? erasList() : [];
  const openedLetters = S.entries.filter(e => e.type === 'letter' && e.extra?.openedAt);
  root.innerHTML = `<div class="page chronicle-page">
    <div class="page-head no-print"><h1>Life Chronicle</h1><div class="sub">The record set as a book. Choose what goes in, then print it — or choose “Save as PDF” in the print dialogue and it becomes a file you can keep, send, or put on a shelf.</div></div>

    <div class="card rv no-print" style="margin-bottom:24px">
      <div class="grid c2" style="gap:14px;align-items:start">
        <div><span class="sc">What to include</span>
          <div class="chron-picks">${CHRONICLE_SECTIONS.map(([k,label,desc])=>`<label class="chron-pick ${on(k)?'on':''}"><input type="checkbox" data-cs="${k}" ${on(k)?'checked':''}><span><b>${esc(label)}</b><span class="d">${esc(desc)}</span></span></label>`).join('')}</div>
          <label class="toggle ${c.images?'on':''}" id="chImages" style="margin-top:10px"><span class="sw"></span><span>include photographs</span></label>
        </div>
        <div><span class="sc">The title page</span>
          <div class="stack" style="gap:8px;margin-top:8px">
            <input class="inp serif-lg" id="chTitle" value="${esc(c.title)}" placeholder="A Life, So Far">
            <input class="inp" id="chSub" value="${esc(c.subtitle)}" placeholder="a subtitle, if you want one">
            <input class="inp" id="chAuthor" value="${esc(c.author)}" placeholder="your name">
          </div>
          <div class="row" style="margin-top:14px;gap:8px"><button class="btn primary" id="chPrint">⎙ Print · Save as PDF</button></div>
          <div class="faint" style="font-size:.76rem;margin-top:8px">Everything below is what will print. In the dialogue, choose “Save as PDF” as the destination; turn on background graphics for the coloured pieces.</div>
        </div>
      </div>
    </div>

    <article class="chronicle" id="chronicle">
      ${on('cover') ? `<section class="ch-cover ch-break">
        <div class="ch-mark">生</div>
        <h1 class="ch-title">${esc(c.title || 'A Life, So Far')}</h1>
        ${c.subtitle ? `<div class="ch-sub">${esc(c.subtitle)}</div>` : ''}
        <div class="ch-rule"></div>
        <div class="ch-author">${esc(c.author || '')}</div>
        <div class="ch-date">${esc(fmtDate(today()))}</div>
        <div class="ch-counts mono">${stages.length} chapters · ${S.entries.length} entries · ${S.values.length} values · ${(S.people||[]).length} people</div>
      </section>` : ''}

      ${on('stages') && stages.length ? `<section class="ch-section ch-break"><h2 class="ch-h">The chapters lived</h2>
        ${stages.map(s => `<div class="ch-stage">
          <div class="ch-stage-head"><span class="ch-han">${esc(s.char||'')}</span><div><h3>${esc(s.name)}</h3><div class="mono">${esc(s.years||'')}${s.tagline?` · ${esc(s.tagline)}`:''}</div></div></div>
          ${s.narrative ? `<div class="ch-prose">${md(s.narrative)}</div>` : '<div class="ch-empty">Not yet written.</div>'}
          ${(s.substages||[]).filter(x=>x.desc).length ? `<div class="ch-sub-list">${s.substages.filter(x=>x.desc).map(x=>`<div class="ch-substage"><b>${esc(x.name)}</b> — ${esc(x.desc)}</div>`).join('')}</div>` : ''}
          ${c.images && (s.photos||[]).length ? `<div class="ch-photos">${s.photos.slice(0,6).map(p=>`<img src="${esc(p.src)}" alt="">`).join('')}</div>` : ''}
        </div>`).join('')}</section>` : ''}

      ${on('memories') && memories.length ? `<section class="ch-section ch-break"><h2 class="ch-h">Memories</h2>
        ${memories.slice(0,60).map(e => `<div class="ch-entry"><div class="ch-when mono">${esc(fmtDate(e.occurredAt,'med'))}</div>
          <div>${e.title?`<div class="ch-entry-title">${esc(e.title)}</div>`:''}<div class="ch-prose">${md(e.body||'')}</div>
          ${c.images && (e.media||[]).length ? `<div class="ch-photos">${e.media.slice(0,3).map(m=>`<img src="${esc(m.src)}" alt="">`).join('')}</div>` : ''}</div></div>`).join('')}</section>` : ''}

      ${on('threads') && S.threads.length ? `<section class="ch-section ch-break"><h2 class="ch-h">Threads</h2>
        ${S.threads.map(t => `<div class="ch-thread"><h3 style="color:${esc(t.color||'inherit')}">${esc(t.name)}</h3>${t.note?`<div class="ch-prose">${md(t.note)}</div>`:''}</div>`).join('')}</section>` : ''}

      ${on('vision') && eras.length ? `<section class="ch-section ch-break"><h2 class="ch-h">What comes next</h2>
        ${eras.map(era => { const goals = S.visions.filter(v => v.era === era.id && !v.archived);
          return `<div class="ch-era"><h3>${esc(era.name)}${era.startYear||era.endYear?` <span class="mono">${esc(era.startYear||'')}–${esc(era.endYear||'')}</span>`:''}</h3>
          ${era.subtitle?`<div class="ch-era-sub">${esc(era.subtitle)}</div>`:''}
          ${goals.length ? `<ul class="ch-goals">${goals.map(v=>`<li><b>${esc(v.name)}</b>${v.successCriteria?` — ${esc(v.successCriteria)}`:''}</li>`).join('')}</ul>` : '<div class="ch-empty">Nothing written for this chapter yet.</div>'}</div>`; }).join('')}</section>` : ''}

      ${on('values') && S.valueOrder.length ? `<section class="ch-section ch-break"><h2 class="ch-h">The compass</h2>
        <ol class="ch-values">${S.valueOrder.map(id => { const v = byId(S.values,id); if(!v) return ''; const cur = valueCurrent(id);
          return `<li><b style="color:${esc(v.color)}">${esc(v.name)}</b> <span class="mono">${cur}/100</span>${(v.fields?.embody||[]).slice(-1)[0]?.text ? `<div class="ch-prose">${esc((v.fields.embody||[]).slice(-1)[0].text)}</div>` : ''}</li>`; }).join('')}</ol></section>` : ''}

      ${on('people') && (S.people||[]).length ? `<section class="ch-section ch-break"><h2 class="ch-h">The people</h2>
        ${(S.people||[]).filter(p => ['inner','close'].includes(p.tier)).map(p => `<div class="ch-person"><h3>${esc(p.name)}${p.relation?` <span class="mono">${esc(p.relation)}</span>`:''}</h3>
          ${p.met?`<div class="ch-prose"><em>How we met.</em> ${esc(p.met)}</div>`:''}
          ${p.gave?`<div class="ch-prose"><em>What they gave me.</em> ${esc(p.gave)}</div>`:''}</div>`).join('') || '<div class="ch-empty">No one in the inner rings yet.</div>'}</section>` : ''}

      ${on('letters') && openedLetters.length ? `<section class="ch-section ch-break"><h2 class="ch-h">Letters</h2>
        ${openedLetters.map(e => `<div class="ch-letter"><div class="mono">written ${esc(fmtDate((e.createdAt||'').slice(0,10),'med'))} · opened ${esc(fmtDate(e.extra.openedAt,'med'))}</div>
          ${e.title?`<h3>${esc(e.title)}</h3>`:''}<div class="ch-prose">${md(e.body)}</div>
          ${e.extra.reply?`<div class="ch-reply"><em>Reading it back.</em> ${md(e.extra.reply)}</div>`:''}</div>`).join('')}</section>` : ''}

      ${on('closing') ? `<section class="ch-closing ch-break"><div class="ch-rule"></div><p class="ch-closing-line">The rest is not written yet.</p><div class="ch-blank"></div></section>` : ''}
    </article>
  </div>`;
  $('#chPrint').onclick = () => { sound('open'); setTimeout(() => window.print(), 120); };
  $$('[data-cs]',root).forEach(cb => cb.onchange = () => {
    const k = cb.dataset.cs;
    c.sections = cb.checked ? [...new Set([...c.sections, k])] : c.sections.filter(x => x !== k);
    saveNow(); rerender();
  });
  $('#chImages').onclick = () => { c.images = !c.images; saveNow(); rerender(); };
  ['chTitle:title','chSub:subtitle','chAuthor:author'].forEach(pair => {
    const [id, key] = pair.split(':'); const el_ = $('#'+id);
    el_.addEventListener('input', debounce(() => { c[key] = el_.value; saveNow(); const t = document.querySelector('.ch-title'); if(key==='title' && t) t.textContent = c.title || 'A Life, So Far'; }, 400));
  });
};
