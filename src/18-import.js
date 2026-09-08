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

/* ---------- where a piece of text can land ----------
   The intake used to have one destination: a journal entry, in one of ten
   types. But most of what a person pastes in is not a journal entry — it is a
   wanted future, a person, a book, a thing to do. Each chunk is routed to the
   room it actually belongs in, and that room's own fields are filled in as a
   considered guess, so what lands is a whole record rather than a stub. */
const IMP_DESTS = {
  entry:   ['Journal entry',    '✎',  'var(--rose)'],
  skill:   ['Skill',            '◈',  'var(--ment)'],
  person:  ['Person',           '☺',  '#6b7f8e'],
  project: ['Project',          '🎨', 'var(--terra)'],
  media:   ['Library entry',    '▤',  'var(--gold)'],
  task:    ['Task',             '▫',  'var(--muted)'],
  habit:   ['Habit',            '◍',  'var(--terra)'],
  stream:  ['Income stream',    '◇',  '#c9975c'],
  stage:   ['Timeline chapter', '◆',  '#cba85a'],
};
/* [key, label, control, options-or-placeholder] */
const IMP_FIELDS = {
  entry:   [],
  skill:   [['cat','Category','txt','craft, language, body…'],
            ['why','Why this one','ta',''],
            ['horizon','Horizon','sel','focus,active,next,someday,paused'],
            ['beginnerDesc','What beginner looks like','ta','']],
  person:  [['relationship','Relationship','txt','friend, mentor, sister…'],
            ['circle','Circle','sel','core,close,warm,orbit,aspirational'],
            ['notes','What matters about them','ta','']],
  project: [['description','What it is','ta',''],
            ['nextAction','Next action','txt','']],
  media:   [['kind','Kind','sel','book,film,documentary,podcast,article,series,album,lecture,exhibition,game,other'],
            ['creator','Creator','txt',''],
            ['status','Status','sel','want,progress,finished,abandoned,reexperiencing'],
            ['capture','What it really says','ta','']],
  task:    [['day','Do it on','date','']],
  habit:   [['cue','The cue','txt','after coffee, before bed…'],
            ['timeOfDay','Time of day','sel','morning,afternoon,evening,anytime'],
            ['min','Minimum version','txt','the version you can always do']],
  stream:  [['model','Revenue model','txt','freelance, product, subscriptions…'],
            ['target','Target / month','txt','']],
  stage:   [['char','One character','txt','一'],
            ['yearFrom','From','txt',''],
            ['yearTo','To','txt',''],
            ['narrative','The story of it','ta','']],
};
const impDestMeta = d => IMP_DESTS[d] || IMP_DESTS.entry;

/* Without a key there is no rewriting, but the routing guess is still worth
   making — it saves the reclassifying by hand that the queue is there for. */
const IMP_DEST_RULES = [
  [/\b(learn(?:ing)?|practis|practice|get better at|master|study|become fluent|teach myself)\b/i, 'skill'],
  [/\b(read|reading|re-?read|watch(?:ed|ing)?|listen(?:ed|ing) to|finished the book|the film|podcast|album|documentary)\b/i, 'media'],
  [/\b(need to|have to|must|remember to|don'?t forget|todo|to-do|by (?:monday|tuesday|wednesday|thursday|friday|tomorrow|next week))\b/i, 'task'],
  [/\b(every day|every morning|daily|each morning|habit|routine|streak|stop (?:smoking|scrolling))\b/i, 'habit'],
  [/\b(client|invoice|freelance|revenue|income|retainer|per month|got paid|charge)\b/i, 'stream'],
  [/\b(shipping|launch(?:ing)?|building (?:a|the)|working on (?:a|the)|the project)\b/i, 'project'],
  [/\b(my (?:friend|mentor|mum|mom|dad|sister|brother|partner)|introduced me|i met [A-Z])\b/, 'person'],
  [/\b(chapter of my life|those years|that whole period|the years when)\b/i, 'stage'],
];
function impDetectDest(text){ for(const [re, d] of IMP_DEST_RULES) if(re.test(text)) return d; return 'entry'; }

let _impQueue = [];

function impMakeItem(body) {
  const dest = impDetectDest(body);
  return { id: uid(), dest, type: impDetectType(body), title: impTitle(body), body: body.trim(),
           date: today(), keep: true, fields: {}, tags: [], why: '', enriched: false };
}

function impTypeColor(type) { return (IMP_TYPES.find(([k]) => k === type) || IMP_TYPES[0])[2]; }

const IMP_SYSTEM = `You are the intake for someone's personal life-tracking instrument. They have pasted in raw text — notes, fragments, brain dumps, pages of an old journal. For each chunk, work out WHERE in the instrument it belongs, and make it worth keeping.

The rooms:
· entry   — a journal entry. Anything reflective, remembered, felt or noticed. Sub-types: reflection, gratitude, dream, memory, synchronicity, visualization, question, progress, interaction, snippet.
· skill   — a capability they are building or want to build.
· person  — a human being who matters to them.
· project — a concrete piece of work with an end.
· media   — a book, film, album, article, talk or game consumed or wanted.
· task    — one small thing to be done.
· habit   — something they want to do repeatedly.
· stream  — a way they make, or could make, money.
· stage   — a chapter of their life, for the timeline.

For EACH chunk return:
{"dest":<room key>,"type":<journal sub-type, only when dest is "entry">,"title":<natural specific title, <=80 chars>,"body":<rewritten, see below>,"date":<"YYYY-MM-DD" if stated or clearly implied, else null>,"tags":[<=4 lowercase single words],"fields":{<room-specific, see below>},"why":<one short clause: why it belongs there>}

REWRITING THE BODY — the part that matters:
- Fix grammar, punctuation and flow. Keep their voice, their register, first person, their tense.
- If the chunk is a fragment, EXPAND it into something whole: finish the thought the way they were plainly going, make implicit context explicit, and give it enough body to be worth re-reading in a year.
- You may add connective tissue that follows from what is there. Do NOT invent facts they did not imply — no new names, places, dates, numbers or events.
- Never make it more literary than they are. No moralising, no summarising back at them.

The "fields" object, by room. Infer each as a considered best guess from the text; leave a value as "" only when you genuinely have nothing to go on:
· skill:   {"cat":<one category word>,"why":<why this one matters to them>,"horizon":"focus"|"active"|"next"|"someday"|"paused","beginnerDesc":<what the beginner level looks like>}
· person:  {"relationship":<friend|mentor|sister|colleague|…>,"circle":"core"|"close"|"warm"|"orbit"|"aspirational","notes":<what matters about them>}
· project: {"description":<what it is>,"nextAction":<the next move>}
· media:   {"kind":"book"|"film"|"documentary"|"podcast"|"article"|"series"|"album"|"lecture"|"exhibition"|"game"|"other","creator":<who made it>,"status":"want"|"progress"|"finished"|"abandoned"|"reexperiencing","capture":<what it really says>}
· task:    {"day":<"YYYY-MM-DD" or "">}
· habit:   {"cue":<what triggers it>,"timeOfDay":"morning"|"afternoon"|"evening"|"anytime","min":<the smallest version that still counts>}
· stream:  {"model":<how the money arrives>,"target":<a bare monthly number as a string, or "">}
· stage:   {"char":<a single CJK character suiting the chapter>,"yearFrom":<"YYYY" or "">,"yearTo":<"YYYY" or "">,"narrative":<the story of it>}
· entry:   {}

Return ONLY a JSON array, same length and order as the input. No preamble, no markdown fence.`;

async function impProcess(raw) {
  const chunks = impSplit(raw);
  if (!chunks.length) return false;
  _impQueue = chunks.map(impMakeItem);
  if (!aiReady()) return true;
  const USER = JSON.stringify(chunks.map((c, i) => ({i, text: c.slice(0, 1400)})));
  try {
    const resp = await askClaude(IMP_SYSTEM, USER, {maxTokens: Math.min(8000, 900 + chunks.length * 700)});
    const parsed = JSON.parse(resp.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    if (Array.isArray(parsed)) {
      parsed.slice(0, _impQueue.length).forEach((r, i) => {
        const it = _impQueue[i]; if (!r || typeof r !== 'object') return;
        if (r.dest && IMP_DESTS[r.dest]) it.dest = r.dest;
        if (r.type && IMP_TYPES.some(([k]) => k === r.type)) it.type = r.type;
        if (r.title) it.title = String(r.title).slice(0, 80);
        if (r.body && String(r.body).trim()) it.body = String(r.body).trim();
        if (r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) it.date = r.date;
        if (Array.isArray(r.tags)) it.tags = normTags(r.tags).slice(0, 4);
        if (r.why) it.why = String(r.why).slice(0, 120);
        if (r.fields && typeof r.fields === 'object') it.fields = r.fields;
        it.enriched = true;
      });
    }
  } catch(e) { /* the local routing guess stands */ }
  return true;
}

function impFieldHTML(item, [key, label, kind, opt]) {
  const v = item.fields?.[key] ?? '';
  const id = `${item.id}:${key}`;
  const ctl = kind === 'ta'   ? `<textarea class="ta iq-f-ta" rows="2" placeholder="${esc(opt)}" data-iq-field="${id}">${esc(v)}</textarea>`
            : kind === 'sel'  ? `<select class="sel" data-iq-field="${id}">${opt.split(',').map(o => `<option value="${o}"${v === o ? ' selected' : ''}>${o}</option>`).join('')}</select>`
            : kind === 'date' ? `<input type="date" class="inp mono" value="${esc(v)}" data-iq-field="${id}">`
            : `<input class="inp" value="${esc(v)}" placeholder="${esc(opt)}" data-iq-field="${id}">`;
  return `<div class="iq-field"><label>${esc(label)}</label>${ctl}</div>`;
}

function impCardHTML(item) {
  const [dLabel, dIcon, dColor] = impDestMeta(item.dest);
  const fields = IMP_FIELDS[item.dest] || [];
  return `<div class="iq-card${item.keep ? '' : ' iq-discarded'}" data-iqid="${item.id}" style="--c:${dColor}">
    <div class="iq-head">
      <select class="sel iq-dest-sel" data-iq-dest="${item.id}" style="--c:${dColor};color:${dColor}">
        ${Object.entries(IMP_DESTS).map(([k, [l, ic]]) => `<option value="${k}"${item.dest === k ? ' selected' : ''}>${ic} ${l}</option>`).join('')}
      </select>
      ${item.dest === 'entry' ? `<select class="sel iq-type-sel" data-iq-type="${item.id}" style="--c:${impTypeColor(item.type)}">
        ${IMP_TYPES.map(([k, l]) => `<option value="${k}"${item.type === k ? ' selected' : ''}>${l}</option>`).join('')}
      </select>` : ''}
      <input class="inp iq-title-inp" value="${esc(item.title)}" placeholder="title…" data-iq-title="${item.id}">
      <input type="date" class="inp mono iq-date-inp" value="${item.date}" data-iq-date="${item.id}">
      <button class="btn sm ghost iq-disc-btn" data-iq-disc="${item.id}" title="${item.keep ? 'Discard' : 'Restore'}">${item.keep ? '\xd7' : '↩'}</button>
    </div>
    ${item.why ? `<div class="iq-why mono">${esc(item.why)}</div>` : ''}
    <textarea class="ta iq-body-ta" data-iq-body="${item.id}" rows="3">${esc(item.body)}</textarea>
    ${item.tags.length ? `<div class="iq-tags">${item.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>` : ''}
    ${fields.length ? `<details class="iq-extra"${item.enriched ? ' open' : ''}><summary class="mono">${esc(dLabel.toLowerCase())} details${item.enriched ? ' · drafted for you' : ''}</summary>
      <div class="iq-fields">${fields.map(f => impFieldHTML(item, f)).join('')}</div></details>` : ''}
  </div>`;
}

/* ---------- committing: each room takes its own shape ---------- */
const impF = (it, k, d = '') => String(it.fields?.[k] ?? d).trim();
const IMP_COMMIT = {
  entry(it){
    S.entries.push({id: uid(), type: it.type, title: it.title, body: it.body,
      occurredAt: it.date, createdAt: new Date().toISOString(), media: [],
      links: emptyLinks(), people: [], places: [], emotions: [], tags: it.tags,
      confidence: '', extra: {}});
    return 'Journals';
  },
  skill(it){
    const hz = ['focus','active','next','someday','paused'].includes(impF(it,'horizon')) ? impF(it,'horizon') : 'active';
    S.skills.push({id: uid(), name: it.title, cat: impF(it,'cat'), horizon: hz, priority: 'P3',
      why: impF(it,'why') || it.body, startBy: '', tags: it.tags,
      levels: [
        {number:1, label:'Beginner',  description: impF(it,'beginnerDesc'), criteria:[], resources:[], estimatedTime:'', targetDate:null},
        {number:2, label:'Competent', description:'', criteria:[], resources:[], estimatedTime:'', targetDate:null},
        {number:3, label:'Proficient',description:'', criteria:[], resources:[], estimatedTime:'', targetDate:null},
      ],
      currentLevel: hz === 'someday' ? 0 : 1, milestones: [], prereqs: [], planned: hz === 'someday'});
    return 'the Skill Tree';
  },
  person(it){
    const p = typeof newPerson === 'function' ? newPerson(it.title) : {id: uid(), name: it.title, details: {}};
    if(impF(it,'relationship')) p.relationship = impF(it,'relationship');
    if(['core','close','warm','orbit','aspirational'].includes(impF(it,'circle'))) p.circle = impF(it,'circle');
    p.details = p.details || {}; p.details.notes = impF(it,'notes') || it.body;
    S.people.push(p);
    return 'People';
  },
  project(it){
    S.projects.push({id: uid(), name: it.title, description: impF(it,'description') || it.body, tags: it.tags,
      status: 'idea', priority: 'P3', startDate: today(), targetDate: '', phases: [], resources: [],
      linkedSkills: [], linkedVisionEra: null, notes: impF(it,'nextAction') ? `Next: ${impF(it,'nextAction')}` : '',
      link: '', income: {model:'', current:0, target:0, milestones:[]}, createdAt: today()});
    return 'Projects';
  },
  media(it){
    S.mediaQueue = Array.isArray(S.mediaQueue) ? S.mediaQueue : [];
    S.mediaQueue.push({id: uid(), kind: (typeof MEDIA_KINDS !== 'undefined' && MEDIA_KINDS[impF(it,'kind')]) ? impF(it,'kind') : 'book',
      title: it.title, creator: impF(it,'creator'), year: null,
      status: ['want','progress','finished','abandoned','reexperiencing'].includes(impF(it,'status')) ? impF(it,'status') : 'want',
      rating: null, finishedAt: '', startedAt: '', capture: impF(it,'capture') || it.body, review: '', highlights: [],
      links: emptyLinks(), createdAt: new Date().toISOString()});
    return 'the Library';
  },
  task(it){
    S.tasks = Array.isArray(S.tasks) ? S.tasks : [];
    S.tasks.push({id: uid(), text: it.title, day: /^\d{4}-\d{2}-\d{2}$/.test(impF(it,'day')) ? impF(it,'day') : it.date,
      done: false, doneAt: null, notes: it.body, order: Date.now(),
      createdAt: new Date().toISOString(), links: {projects:[], skills:[]}});
    return 'your tasks';
  },
  habit(it){
    S.habits.push({id: uid(), name: it.title, freq: {type:'daily', days:[], count:3},
      timeOfDay: ['morning','afternoon','evening','anytime'].includes(impF(it,'timeOfDay')) ? impF(it,'timeOfDay') : 'morning',
      dimension: 'physical', kind: 'expenditure', links: {values:[], visions:[], skills:[]},
      min: impF(it,'min'), ideal: '', prompt: '', negative: false, archived: false,
      stackAfter: null, relational: '', order: S.habits.length});
    return 'Rhythm';
  },
  stream(it){
    const inc = {model: impF(it,'model'), current: 0, target: parseFloat(impF(it,'target').replace(/[^\d.]/g,'')) || 0};
    if(typeof migrateIncomeShape === 'function') migrateIncomeShape(inc);
    S.incomeStreams = Array.isArray(S.incomeStreams) ? S.incomeStreams : [];
    S.incomeStreams.push(Object.assign({id: uid(), name: it.title}, inc));
    return 'Finance';
  },
  stage(it){
    const hues = typeof STAGE_HUES !== 'undefined' ? STAGE_HUES : ['#6b7f8e','#7f916a','#b08968','#a0727e','#d4a44c','#8a7f9e'];
    const f = impF(it,'yearFrom'), t = impF(it,'yearTo');
    S.stages.push({id: uid(), num: 0, char: impF(it,'char') || '章', name: it.title, tagline: '',
      hue: hues[S.stages.length % hues.length], years: f && t ? `${f}–${t}` : f ? `${f}–` : '',
      narrative: impF(it,'narrative') || it.body, narrativeHistory: [], substages: [], photos: [],
      soundtrack: [], artifacts: [], letters: {to:'', from:''}, retroValues: {}, notyet: false});
    if(typeof renumberStages === 'function') renumberStages();
    return 'the Timeline';
  },
};

function impCommit() {
  const toAdd = _impQueue.filter(i => i.keep);
  if (!toAdd.length) { toast('Nothing marked to keep.'); return; }
  const rooms = {};
  toAdd.forEach(item => {
    const fn = IMP_COMMIT[item.dest] || IMP_COMMIT.entry;
    const room = fn(item);
    rooms[room] = (rooms[room] || 0) + 1;
  });
  saveNow();
  const n = toAdd.length;
  _impQueue = [];
  S._impRaw = '';
  const parts = Object.entries(rooms).map(([r, c]) => `${c} to ${r}`);
  toast(`${n} ${n === 1 ? 'thing' : 'things'} filed — ${parts.join(', ')}.`, 5200);
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
  /* changing the room changes which fields the card offers, so redraw it */
  root.querySelectorAll('[data-iq-dest]').forEach(sel => {
    const item = _impQueue.find(i => i.id === sel.dataset.iqDest); if (!item) return;
    sel.onchange = () => {
      item.dest = sel.value;
      const card = root.querySelector(`[data-iqid="${item.id}"]`);
      if (card){ card.outerHTML = impCardHTML(item); bindImpQueue(root); }
    };
  });
  root.querySelectorAll('[data-iq-field]').forEach(n => {
    const [id, key] = n.dataset.iqField.split(':');
    const item = _impQueue.find(i => i.id === id); if (!item) return;
    const set = () => { item.fields = item.fields || {}; item.fields[key] = n.value; };
    n.oninput = set; n.onchange = set;
  });
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
    ${aiReady() ? '' : '<p class="subtitle faint">Without an API key in Settings the routing is guessed locally and nothing is rewritten.</p>'}</div>
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
