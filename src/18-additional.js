/* ============================================================
   ADDITIONAL — one more box, on every kind of entry.

   Each kind of record asks its own questions: a dream its symbols and its
   waking interpretation, a gratitude why it matters, a person the gift and
   the wound. What was written somewhere else was not written to those
   questions, and something always has no box of its own. This is that box:
   free, multi-line, markdown, on journal entries of every type, Library
   works, people, skills, projects, habits, tasks, values and the chapters of
   the Timeline. A spreadsheet brought in by the importer puts every column
   that matched nothing here, under the column's own name, so nothing that
   was in the file is left behind.

   Stored as `extra.additional` on a journal entry or Library work and as
   `additional` on every other record; absent means empty, so nothing that
   was saved before this box existed needs changing.
   ============================================================ */
const ADDITIONAL_LABEL = 'Additional';
const ADDITIONAL_HINT = 'Anything that has no box of its own. What a spreadsheet brought in without a place of its own lands here, under its column’s name.';

/* the box, where a record is edited through the inline editor */
function additionalEdHTML(path, o = {}){
  return `<div class="${o.cls || 'vp-sec'} add-sec"><span class="sc">${ADDITIONAL_LABEL}</span>
    <div class="faint" style="font-size:.78rem;margin-bottom:6px">${esc(ADDITIONAL_HINT)}</div>
    ${ed(path, {multi: true, mdr: true, cls: 'prose', ph: 'Anything else.'})}</div>`;
}
/* read, where a record is read */
function additionalReadHTML(text){
  return text && String(text).trim() ? `<div class="add-read"><span class="mono">additional</span><div class="prose">${md(String(text))}</div></div>` : '';
}
/* One more piece added under its label, after what is there — never over it. */
function additionalAppend(prev, label, value){
  const v = String(value == null ? '' : value).trim();
  if(!v) return prev || '';
  const block = label ? `**${String(label).trim()}**\n${v}` : v;
  return prev && String(prev).trim() ? String(prev).trim() + '\n\n' + block : block;
}
