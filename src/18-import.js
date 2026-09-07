/* ============================================================
   IMPORT STATION — paste anything in, pull structure out
   Route: #/import
   ============================================================ */

const IMP_TYPES = [
  ['reflection',    'Reflection',    'var(--ment)'],
  ['gratitude',     'Gratitude',     'var(--gold)'],
  ['dream',         'Dream',         'var(--rose)'],
  ['memory',        'Memory',        'var(--terra)'],
  ['synchronicity', 'Synchronicity', 'var(--sage)'],
  ['visualization', 'Visualization', 'var(--ment)'],
  ['question',      'Open question', 'var(--faint)'],
  ['progress',      'Progress',      'var(--sage)'],
  ['interaction',   'Interaction',   'var(--rose)'],
  ['snippet',       'Snippet',       'var(--terra)'],
];

const IMP_RULES = [
  [/\b(dream(?:ed|t)?|nightmare|in my dream|last night i|i dreamed|i dreamt)\b/i, 'dream'],
  [/\b(i(?:'m| am) grateful|grateful for|thankful|i appreciate|what a blessing|so blessed)\b/i, 'gratitude'],
  [/\b(i remember|back when|when i was (?:young|a kid|little|twelve|ten|eight)|years ago|childhood|as a child|as a teenager)\b/i, 'memory'],
  [/\b(coincidence|synchronicity|no accident|sign from|the universe|meant to (?:be|happen)|felt like a sign)\b/i, 'synchronicity'],
  [/\b(i see myself|i(?:'m| am) (?:standing|living|working|writing|leading)|visuali[zs]|future self|in my mind(?:'s eye)?|i imagine myself)\b/i, 'visualization'],
  [/\b(i (?:completed|finished|achieved|shipped|launched|hit|reached)|milestone reached|made it through|level up|i did it)\b/i, 'progress'],
  [/\b(talked to|met with|(?:phone|video) called?|messaged|ran into|had (?:coffee|lunch|dinner) with|spoke with|session with)\b/i, 'interaction'],
];

function impDetectType(text) {
  const t = text.trim();
  for (const [re, type] of IMP_RULES) { if (re.test(t)) return type; }
  if (/^[""“].*[""”]\s*$/s.test(t)) return 'snippet';
  if (/\?$/.test(t.split('\n')[0])) return 'question';
  return 'reflection';
}

function impSplit(raw) {
  if (!raw.trim()) return [];
  // Hard dividers: ---, ===, ***
  if (/^(?:---+|===+|\*\*\*+)\s*$/m.test(raw)) {
    const cs = raw.split(/^(?:---+|===+|\*\*\*+)\s*$/m).map(s => s.trim()).filter(s => s.length >= 15);
    if (cs.length > 1) return cs;
  }
  // Markdown headers start new chunks
  if (/^#{1,3} /m.test(raw)) {
    const cs = raw.split(/(?=^#{1,3} )/m).map(s => s.trim()).filter(s => s.length >= 15);
    if (cs.length > 1) return cs;
  }
  // Double blank lines
  const dbl = raw.split(/\n{3,}/).map(s => s.trim()).filter(s => s.length >= 15);
  if (dbl.length > 1) return dbl;
  // Bullet list (3+ items each get their own entry)
  const bullets = raw.split(/\n(?=[-*•] )/).map(s => s.replace(/^[-*•]\s*/, '').trim()).filter(s => s.length >= 10);
  if (bullets.length >= 3) return bullets;
  return [raw.trim()];
}

function impTitle(text, max = 80) {
  const line = (text.split('\n')[0] || '').replace(/^#{1,3}\s*/, '').replace(/^[-*•]\s*/, '').replace(/^[""“]/, '').trim();
  return line.length <= max ? line : line.slice(0, max - 1) + '…';
}

let _impQueue = [];

function impMakeItem(body) {
  return { id: uid(), type: impDetectType(body), title: impTitle(body), body: body.trim(), date: today(), keep: true };
}

function impTypeColor(type) { return (IMP_TYPES.find(([k]) => k === type) || IMP_TYPES[0])[2]; }

async function impProcess(raw) {
  const chunks = impSplit(raw);
  if (!chunks.length) return false;
  _impQueue = chunks.map(impMakeItem);
  if (aiReady() && chunks.length > 0) {
    const SYSTEM = `You classify personal journal text chunks for a life-tracking app. Return a JSON array (same length as input) where each element is: {"type":"reflection|gratitude|dream|memory|synchronicity|visualization|question|progress|interaction|snippet","title":"natural title ≤80 chars","date":"YYYY-MM-DD if detectable, else null"}. Return ONLY valid JSON. No preamble.`;
    const USER = JSON.stringify(chunks.map((c, i) => ({i, text: c.slice(0, 600)})));
    try {
      const resp = await askClaude(SYSTEM, USER, {maxTokens: 1200});
      const parsed = JSON.parse(resp);
      if (Array.isArray(parsed) && parsed.length === _impQueue.length) {
        parsed.forEach((r, i) => {
          if (r.type && IMP_TYPES.some(([k]) => k === r.type)) _impQueue[i].type = r.type;
          if (r.title) _impQueue[i].title = String(r.title).slice(0, 80);
          if (r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) _impQueue[i].date = r.date;
        });
      }
    } catch(e) { /* fall back to local classification */ }
  }
  return true;
}

function impCardHTML(item) {
  return `<div class="iq-card${item.keep ? '' : ' iq-discarded'}" data-iqid="${item.id}">
    <div class="iq-head">
      <select class="sel iq-type-sel" data-iq-type="${item.id}" style="--c:${impTypeColor(item.type)}">
        ${IMP_TYPES.map(([k, l]) => `<option value="${k}"${item.type === k ? ' selected' : ''}>${l}</option>`).join('')}
      </select>
      <input class="inp iq-title-inp" value="${esc(item.title)}" placeholder="title…" data-iq-title="${item.id}">
      <input type="date" class="inp mono iq-date-inp" value="${item.date}" data-iq-date="${item.id}">
      <button class="btn sm ghost iq-disc-btn" data-iq-disc="${item.id}" title="${item.keep ? 'Discard' : 'Restore'}">${item.keep ? '\xd7' : '↩'}</button>
    </div>
    <textarea class="ta iq-body-ta" data-iq-body="${item.id}" rows="3">${esc(item.body)}</textarea>
  </div>`;
}

function impCommit() {
  const toAdd = _impQueue.filter(i => i.keep);
  if (!toAdd.length) { toast('No entries marked to keep.'); return; }
  toAdd.forEach(item => {
    S.entries.push({id: uid(), type: item.type, title: item.title, body: item.body,
      occurredAt: item.date, createdAt: new Date().toISOString(), media: [],
      links: {stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:[],people:[]},
      people: [], places: [], emotions: [], tags: [], confidence: '', extra: {}});
  });
  saveNow();
  const n = toAdd.length;
  _impQueue = [];
  S._impRaw = '';
  toast(`${n} ${n === 1 ? 'entry' : 'entries'} added to your journals.`);
  sound('success');
  rerender();
}

function impQueueBarHTML() {
  const kept = _impQueue.filter(i => i.keep).length;
  return `<div class="import-queue-bar">
    <span class="mono imp-kept-count">${kept} of ${_impQueue.length} ${_impQueue.length === 1 ? 'entry' : 'entries'} to commit</span>
    <div class="row" style="gap:8px">
      <button class="btn sm ghost" id="impClear">Clear queue</button>
      <button class="btn primary" id="impCommit">Commit ${kept} →</button>
    </div>
  </div>`;
}

function bindImpQueue(root) {
  const updateBar = () => {
    const kept = _impQueue.filter(i => i.keep).length;
    const cnt = root.querySelector('.imp-kept-count');
    if (cnt) cnt.textContent = `${kept} of ${_impQueue.length} ${_impQueue.length === 1 ? 'entry' : 'entries'} to commit`;
    const cb = root.querySelector('#impCommit');
    if (cb) cb.textContent = `Commit ${kept} →`;
  };
  root.querySelectorAll('[data-iq-type]').forEach(sel => {
    const item = _impQueue.find(i => i.id === sel.dataset.iqType); if (!item) return;
    sel.onchange = () => { item.type = sel.value; sel.style.setProperty('--c', impTypeColor(item.type)); };
  });
  root.querySelectorAll('[data-iq-title]').forEach(inp => {
    const item = _impQueue.find(i => i.id === inp.dataset.iqTitle); if (!item) return;
    inp.oninput = () => { item.title = inp.value; };
  });
  root.querySelectorAll('[data-iq-body]').forEach(ta => {
    const item = _impQueue.find(i => i.id === ta.dataset.iqBody); if (!item) return;
    ta.oninput = () => { item.body = ta.value; };
  });
  root.querySelectorAll('[data-iq-date]').forEach(inp => {
    const item = _impQueue.find(i => i.id === inp.dataset.iqDate); if (!item) return;
    inp.onchange = () => { item.date = inp.value; };
  });
  root.querySelectorAll('[data-iq-disc]').forEach(btn => {
    const item = _impQueue.find(i => i.id === btn.dataset.iqDisc); if (!item) return;
    btn.onclick = () => {
      item.keep = !item.keep;
      const card = root.querySelector(`[data-iqid="${item.id}"]`);
      if (card) card.classList.toggle('iq-discarded', !item.keep);
      btn.textContent = item.keep ? '\xd7' : '↩';
      btn.title = item.keep ? 'Discard' : 'Restore';
      updateBar();
    };
  });
  root.querySelector('#impClear')?.addEventListener('click', () => { _impQueue = []; rerender(); });
  root.querySelector('#impCommit')?.addEventListener('click', impCommit);
}

routes.import = function(root) {
  const raw = S._impRaw || '';
  root.innerHTML = `<div class="page-head"><h1>Import Station</h1>
    <p class="subtitle">Pour anything in — notes, brain dumps, old journals, bullet lists. We'll sort it into entries.</p></div>
  <div class="import-intake">
    <textarea class="ta import-ta" id="impRaw" placeholder="Paste text here… Supports plain text, Markdown, bullet lists, separated sections." rows="10">${esc(raw)}</textarea>
    <div class="row between" style="margin-top:8px;flex-wrap:wrap;gap:8px">
      <div class="row" style="gap:8px">
        <button class="btn sm ghost" id="impUpload">📂 file</button>
        <input type="file" id="impFile" accept=".txt,.md,.text" style="display:none">
        <button class="btn sm ghost" id="impDictate">🎙 dictate</button>
        <button class="btn sm ghost" id="impClearRaw">\xd7 clear</button>
      </div>
      <button class="btn primary" id="impProcess">⚡ Process →</button>
    </div>
    <p class="mono faint" style="font-size:.72rem;margin-top:6px">${aiReady() ? 'Claude will classify your entries.' : 'Local pattern matching active — add an Anthropic API key in Settings for smarter classification.'}</p>
  </div>
  ${_impQueue.length ? impQueueBarHTML() + `<div class="import-queue" id="impQueue">${_impQueue.map(impCardHTML).join('')}</div>` : ''}`;

  const ta = root.querySelector('#impRaw');
  ta.oninput = () => { S._impRaw = ta.value; };

  root.querySelector('#impUpload').onclick = () => root.querySelector('#impFile').click();
  root.querySelector('#impFile').onchange = ev => {
    const f = ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = e => { ta.value = e.target.result; S._impRaw = ta.value; ta.focus(); };
    r.readAsText(f);
  };

  const dictBtn = root.querySelector('#impDictate');
  dictBtn.onclick = () => {
    if (activeDictation && activeDictation.target === ta) { stopDictation(); dictBtn.textContent = '🎙 dictate'; return; }
    ta.dataset.dictBase = ta.value ? ta.value.replace(/\s*$/, '') + ' ' : '';
    const base = () => ta.dataset.dictBase || '';
    const rec = startDictation(ta, {
      onText: (settled, interim) => { ta.value = base() + settled + (interim ? (settled ? ' ' : '') + interim : ''); S._impRaw = ta.value; ta.scrollTop = ta.scrollHeight; },
      onEnd: () => { dictBtn.textContent = '🎙 dictate'; },
    });
    if (rec) dictBtn.textContent = '⏹ stop';
  };

  root.querySelector('#impClearRaw').onclick = () => { ta.value = ''; S._impRaw = ''; ta.focus(); };

  root.querySelector('#impProcess').onclick = async () => {
    const rawText = ta.value.trim();
    if (!rawText) { toast('Nothing to process yet.'); return; }
    S._impRaw = rawText;
    const btn = root.querySelector('#impProcess');
    btn.disabled = true; btn.textContent = aiReady() ? '… asking Claude' : '… processing';
    const ok = await impProcess(rawText);
    btn.disabled = false; btn.textContent = '⚡ Process →';
    if (!ok) { toast('Nothing to extract — try a longer paste.'); return; }
    // Inject queue into page without full rerender
    root.querySelector('.import-queue-bar')?.remove();
    root.querySelector('.import-queue')?.remove();
    const frag = document.createElement('div');
    frag.innerHTML = impQueueBarHTML() + `<div class="import-queue" id="impQueue">${_impQueue.map(impCardHTML).join('')}</div>`;
    [...frag.children].forEach(c => root.appendChild(c));
    bindImpQueue(root);
    root.querySelector('.import-queue-bar')?.scrollIntoView({behavior:'smooth', block:'start'});
    toast(`Found ${_impQueue.length} ${_impQueue.length === 1 ? 'entry' : 'entries'}.`);
  };

  if (_impQueue.length) bindImpQueue(root);
};
