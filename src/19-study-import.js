/* ============================================================
   A DECK FROM ANYWHERE — importing, and the format that makes it possible.

   The useful thing about a language model is that it will write you two
   hundred cards on Ottoman tax law at two in the morning. The useless thing
   is that you then have to type them in. So the deck has a written format,
   the room hands you the prompt that asks for it, and pasting the reply back
   is the whole of the import.

   The format is deliberately small and deliberately forgiving. A model that
   writes "question" instead of "front", or wraps the object in a code fence,
   or returns a bare array of cards, has still done what you asked, and a
   parser that says no to any of that is a parser that makes you do the work
   by hand anyway. What it will not do is guess at a card with no front, or a
   gap-fill with no gap in it — those it names and leaves out, because a card
   that is wrong in the deck is worse than a card that never arrived.
   ============================================================ */

/* Enough for a whole textbook's worth in one paste and small enough that a
   runaway generation cannot fill the save. */
const STUDY_IMPORT_MAX = 500;

/* What to ask for. It is held here as one string rather than typed into the
   modal's markup because it is the actual interface: this is the text that
   has to agree with the parser below, and the two are easier to keep honest
   side by side. */
const STUDY_IMPORT_PROMPT = `Make me a study deck about [WHAT YOU WANT TO LEARN].

Reply with one JSON object and nothing else — no explanation around it.

{
  "deck": {"name": "…", "emoji": "📗", "about": "one line on what is in it"},
  "cards": [
    {"type": "text_recall", "front": "the question", "back": "the answer", "tags": ["a-tag"]},
    {"type": "production", "front": "a meaning, in English", "back": "what I should be able to produce"},
    {"type": "cloze", "front": "a sentence with the {{hidden part}} in double braces", "back": "a note, optional"},
    {"type": "action", "front": "a thing to do, not say", "reference": "what to check myself against"}
  ]
}

Rules:
- "type" is one of text_recall, production, cloze, action.
- Every card needs a "front". text_recall and production also need a "back".
- A cloze hides exactly one thing: put it in {{double braces}} inside the front. Add "options": ["…","…","…","…"] to make it multiple choice.
- "tags" is optional.
- One question per card. A card asking two things is two cards.
- Make the back the shortest complete answer, not a paragraph.
- Aim for [HOW MANY] cards.`;

/* A model's idea of a card type and ours. Anything unrecognised becomes a
   plain question, which is the shape that is never wrong — a card you can
   answer is worth more than a card with the right label on it. */
const STUDY_TYPE_ALIASES = {
  text_recall:'text_recall', text:'text_recall', basic:'text_recall', qa:'text_recall',
  q_a:'text_recall', recall:'text_recall', fact:'text_recall', definition:'text_recall',
  production:'production', produce:'production', speak:'production', translate:'production',
  cloze:'cloze', gap:'cloze', fill:'cloze', fill_in_the_blank:'cloze', blank:'cloze',
  action:'action', do:'action', practice:'action', exercise:'action',
  image_recall:'image_recall', image:'image_recall', picture:'image_recall'};

const studyImportStr = v => v == null ? '' : String(Array.isArray(v) ? v.join('\n') : v).trim();
function studyImportList(v){
  if(Array.isArray(v)) return v.map(x => String(x).trim().replace(/^#/, '')).filter(Boolean);
  const s = studyImportStr(v);
  return s ? s.split(/[\s,]+/).map(x => x.replace(/^#/, '')).filter(Boolean) : [];
}
const studyImportType = v => STUDY_TYPE_ALIASES[
  String(v || '').trim().toLowerCase().replace(/[\s-]+/g, '_')] || 'text_recall';

/* Pull the object out of whatever it arrived wrapped in. Models fence their
   JSON, and they preface it with a sentence about how happy they are to
   help; neither is a reason to refuse the cards underneath. */
function studyImportJSON(text){
  const raw = String(text || '').trim();
  if(!raw) return {empty:true};
  const tries = [raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()];
  const a = raw.search(/[[{]/);
  const b = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  if(a > -1 && b > a) tries.push(raw.slice(a, b + 1));
  let last = '';
  for(const t of tries){
    try { return {data: JSON.parse(t)}; } catch(e){ last = e.message; }
  }
  return {error:`That is not valid JSON — ${last}`};
}

/* Read a paste into something that can be shown before it is committed. It
   never writes anything: the point of a preview you can trust is that it has
   not already happened. */
function studyImportRead(text){
  const got = studyImportJSON(text);
  if(got.empty || got.error) return {rows:[], problems:[], error: got.error || '', empty: !!got.empty};
  const data = got.data;
  const list = Array.isArray(data) ? data
    : data && typeof data === 'object' && Array.isArray(data.cards) ? data.cards : null;
  if(!list) return {rows:[], problems:[], error:'No cards in it — the object wants a "cards" array.'};
  if(!list.length) return {rows:[], problems:[], error:'The cards list is empty.'};

  let deck = null;
  if(!Array.isArray(data)){
    const d = data.deck && typeof data.deck === 'object' ? data.deck
      : {name: data.deck || data.deckName || data.name || ''};
    const name = studyImportStr(d.name || d.title);
    if(name) deck = {name, emoji: studyImportStr(d.emoji).slice(0, 4) || '📗',
      about: studyImportStr(d.about || d.description)};
  }

  const rows = [], problems = [];
  list.slice(0, STUDY_IMPORT_MAX).forEach((c, i) => {
    const at = i + 1;
    if(!c || typeof c !== 'object'){ problems.push({at, why:'not a card'}); return; }
    const front = studyImportStr(c.front ?? c.question ?? c.q ?? c.prompt);
    const back = studyImportStr(c.back ?? c.answer ?? c.a ?? c.meaning);
    if(!front){ problems.push({at, why:'nothing on the front'}); return; }
    const type = studyImportType(c.type);
    const gap = studyImportStr(c.cloze ?? c.clozeAnswer ?? c.blank ?? c.hidden);
    if(type === 'cloze' && !gap && !/\{\{[^}]+\}\}/.test(front)){
      problems.push({at, why:'a gap-fill with no gap — the hidden part goes in {{ }}'}); return; }
    if((type === 'text_recall' || type === 'production' || type === 'image_recall') && !back){
      problems.push({at, why:'nothing on the back'}); return; }
    rows.push({type, front, back,
      clozeAnswer: type === 'cloze' && gap ? gap : null,
      clozeOptions: type === 'cloze' ? (studyImportList(c.options ?? c.clozeOptions).slice(0, 8) || null) : null,
      reference: type === 'action' ? (studyImportStr(c.reference ?? c.check) || back || null) : null,
      tags: studyImportList(c.tags ?? c.tag).slice(0, 12)});
  });
  rows.forEach(r => { if(r.clozeOptions && !r.clozeOptions.length) r.clozeOptions = null; });
  return {deck, rows, problems, total: list.length,
    over: Math.max(0, list.length - STUDY_IMPORT_MAX), error:''};
}

/* Commit it. A named deck that already exists is filled rather than
   duplicated — importing twice into "Kanji" should give you one Kanji deck,
   not two with the same name and half the cards each. */
function studyImportApply(parsed, opts = {}){
  const st = studyState();
  let deckId = opts.deckId || '';
  if(!deckId && parsed.deck){
    const want = parsed.deck.name.toLowerCase();
    const found = st.decks.find(d => String(d.name || '').trim().toLowerCase() === want);
    if(found) deckId = found.id;
    else {
      const d = {id:uid(), name:parsed.deck.name, emoji:parsed.deck.emoji || '📗',
        color:'#6b7d8e', about:parsed.deck.about || '', parentId:null, isDefault:false};
      st.decks.push(d);
      deckId = d.id;
    }
  }
  if(!deckId || !studyDeck(deckId)) deckId = 'mindsets';
  /* every imported card says so and says when, because six months from now
     "where did this come from" is the only question you will have about it */
  const say = `Imported ${fmtDate(today(), 'med')}`;
  const made = parsed.rows.map(r => addStudyCard(Object.assign({}, r, {deckId,
    status: opts.hold ? 'inbox' : 'active', due: today(),
    sourceType:'import', sourceLabel: say, sourceGo:'#/study'})));
  saveNow();
  return {deckId, made};
}

/* The same format, backwards. It is here so the format is never a claim: you
   can take a deck you already have, hand it to a model, and say "more like
   this" — which is a better brief than any description of the schema. */
function studyDeckExport(deckId){
  const d = studyDeck(deckId);
  if(!d) return '';
  const ids = new Set(studyDeckIds(deckId));
  const cards = studyCards().filter(c => ids.has(c.deckId) && c.status !== 'inbox').map(c => {
    const o = {type:c.type, front:c.front};
    if(c.back) o.back = c.back;
    if(c.type === 'cloze' && c.clozeAnswer) o.cloze = c.clozeAnswer;
    if(c.type === 'cloze' && (c.clozeOptions || []).length) o.options = c.clozeOptions;
    if(c.type === 'action' && c.reference) o.reference = c.reference;
    if((c.tags || []).length) o.tags = c.tags;
    return o;
  });
  return JSON.stringify({deck:{name:d.name, emoji:d.emoji, about:d.about || ''}, cards}, null, 2);
}

/* Clipboard, with the fallback that matters: this is a file on disk as often
   as it is a page on a server, and the modern API is not always allowed to
   run there. */
function studyCopy(text, said = 'Copied.'){
  const fall = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const won = document.execCommand('copy');
      ta.remove();
      toast(won ? said : 'Could not copy — select it and copy by hand.');
    } catch(e){ toast('Could not copy — select it and copy by hand.'); }
  };
  try {
    if(navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text).then(() => toast(said), fall);
    else fall();
  } catch(e){ fall(); }
}

/* ---------- the room ---------- */
function openStudyImport(){
  const decks = studyDecks();
  const m = openModal(`<h2>A deck from anywhere</h2>
    <p class="muted" style="font-size:.86rem;max-width:64ch">Ask a model for a deck on whatever you are learning, paste its answer here, and the cards arrive with their scheduling already set. Nothing is written until you have seen what it found.</p>

    <details class="sd-imp-fold" open>
      <summary><span class="sc">1 · what to ask for</span></summary>
      <div class="sd-imp-body">
        <p class="muted" style="font-size:.8rem">Copy this, fill in the two brackets, and send it wherever you talk to a model.</p>
        <pre class="sd-imp-prompt mono" id="sdImpPrompt">${esc(STUDY_IMPORT_PROMPT)}</pre>
        <div class="row" style="gap:8px;justify-content:flex-end">
          <button class="btn sm ghost" id="sdImpCopy">Copy the prompt</button></div>
      </div>
    </details>

    <details class="sd-imp-fold">
      <summary><span class="sc">or: show it a deck you already have</span></summary>
      <div class="sd-imp-body">
        <p class="muted" style="font-size:.8rem">"More like this" is a better brief than any description of a format.</p>
        <div class="row" style="gap:8px">
          <select class="sel sm" id="sdImpFrom">${decks.map(d =>
            `<option value="${esc(d.id)}">${esc(d.emoji)} ${esc(d.name)} — ${studyDeckCount(d.id).total} cards</option>`).join('')}</select>
          <button class="btn sm ghost" id="sdImpExport">Copy it as JSON</button></div>
      </div>
    </details>

    <label class="pd-q" style="margin-top:14px"><span class="k">2 · paste what came back</span>
      <textarea class="inp sd-ta mono" id="sdImpText" rows="8" autofocus spellcheck="false"
        placeholder='{"deck": {"name": "…"}, "cards": [ … ]}'></textarea></label>

    <div id="sdImpOut"></div>

    <div class="row" style="justify-content:flex-end;margin-top:14px;gap:8px">
      <button class="btn primary" id="sdImpGo" disabled>Bring them in</button></div>`, 'sd-modal sd-import');

  const out = m.querySelector('#sdImpOut');
  const go = m.querySelector('#sdImpGo');
  const ta = m.querySelector('#sdImpText');
  let read = {rows:[], problems:[], empty:true};

  const paint = () => {
    read = studyImportRead(ta.value);
    const n = read.rows.length;
    go.disabled = !n;
    go.textContent = n ? `Bring in ${n} card${n === 1 ? '' : 's'}` : 'Bring them in';
    if(read.empty){ out.innerHTML = ''; return; }
    if(read.error){ out.innerHTML = `<div class="sd-imp-bad">${esc(read.error)}</div>`; return; }
    const where = read.deck
      ? (() => { const want = read.deck.name.toLowerCase();
          const found = decks.find(d => String(d.name || '').trim().toLowerCase() === want);
          return found ? `into <b>${esc(found.emoji)} ${esc(found.name)}</b>, which you already have`
            : `into a new deck, <b>${esc(read.deck.emoji)} ${esc(read.deck.name)}</b>`; })()
      : `into a deck you choose — the paste did not name one`;
    out.innerHTML = `<div class="sd-imp-out">
      <div class="sd-imp-n"><b>${n}</b> card${n === 1 ? '' : 's'} ready, ${where}.</div>
      ${read.problems.length ? `<div class="sd-imp-skip">
        <span class="k mono">${read.problems.length} left out</span>
        ${read.problems.slice(0, 6).map(p => `<div class="mono">card ${p.at} — ${esc(p.why)}</div>`).join('')}
        ${read.problems.length > 6 ? `<div class="mono faint">…and ${read.problems.length - 6} more</div>` : ''}
      </div>` : ''}
      ${read.over ? `<div class="mono faint">${read.over} beyond the first ${STUDY_IMPORT_MAX} were not read. Bring them in a second paste.</div>` : ''}
      ${read.deck ? '' : `<label class="pd-q" style="margin-top:8px"><span class="k">put them in</span>
        <select class="sel" id="sdImpDeck">${decks.map(d =>
          `<option value="${esc(d.id)}">${esc(d.emoji)} ${esc(d.name)}</option>`).join('')}</select></label>`}
      <label class="sd-family" style="margin-top:8px"><input type="checkbox" id="sdImpHold">
        <span>Hold them in the inbox first<em>nothing enters the rotation until you have read it — worth it for a long generation you have not checked</em></span></label>
      <div class="sd-imp-peek">${read.rows.slice(0, 3).map(r => `
        <div class="sd-imp-card"><span class="mono">${esc(r.type.replace('_', ' '))}</span>
          <b>${esc(r.front.replace(/\s+/g, ' ').slice(0, 90))}</b>
          <span>${esc((r.back || r.reference || r.clozeAnswer || '').replace(/\s+/g, ' ').slice(0, 70))}</span></div>`).join('')}
        ${n > 3 ? `<div class="mono faint">…and ${n - 3} more</div>` : ''}</div>
    </div>`;
  };

  ta.oninput = debounce(paint, 260);
  m.querySelector('#sdImpCopy').onclick = () => studyCopy(STUDY_IMPORT_PROMPT, 'The prompt is on your clipboard.');
  m.querySelector('#sdImpExport').onclick = () => {
    const id = m.querySelector('#sdImpFrom').value;
    const json = studyDeckExport(id);
    studyCopy(json, `${studyDeckName(id)} copied as JSON.`);
  };
  go.onclick = () => {
    if(!read.rows.length) return;
    const pick = m.querySelector('#sdImpDeck');
    const hold = m.querySelector('#sdImpHold');
    const res = studyImportApply(read, {deckId: pick ? pick.value : '', hold: hold ? hold.checked : false});
    m.remove(); sound('success');
    toast(`${res.made.length} card${res.made.length === 1 ? '' : 's'} into ${studyDeckName(res.deckId)}${
      hold && hold.checked ? ' — waiting in the inbox' : ''}.`);
    rerender();
  };
  return m;
}
