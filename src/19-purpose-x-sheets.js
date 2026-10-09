/* ============================================================
   PRINTABLE QUESTION SHEETS (#/purpose/sheets)

   Every question the inner-life modules ask, gathered in one place so the
   wording can be reviewed together and the sets taken away on paper — to a
   quiet place, a walk, a retreat. Printing is local: the browser prints the
   page; nothing is generated or uploaded.

   Questions drawn from the Life Purpose Course are marked LPC; the ones
   written for this house are marked new.
   ============================================================ */

purposeTabAdd({id: 'sheets', label: 'Printable sheets', order: 80, render: body => sheetsRender(body)});

const SHEETS = [
  {id: 'bigleap', title: 'The Big Leap worksheet', lede: 'List many answers to each question before settling on one.', groups: [
    {h: 'Part one — many answers per question', qs: [['What do I love to do so much that I can do it for long stretches of time without getting tired or bored?', 'LPC'], ['What work do I do that does not seem like work?', 'LPC'],
      ['What would I be doing if I did not have to account for how?', 'new'], ['What is my unique ability which, fully realised and put to work, could provide enormous benefit to me and to any organisation I serve? Include abilities I only have potential in.', 'LPC']]},
    {h: 'Part two — sentence completions', qs: [['I am at my best when I am…', 'LPC'], ['When I am at my best, the exact thing I am doing is…', 'LPC'], ['When I am doing that, the thing I love most about it is…', 'LPC']]}],
    note: 'The zone of genius is especially revealed by part one question four and part two question two.'},
  {id: 'assessment', title: 'The life purpose assessment', intro: 'Set aside a comfortable chunk of time. Force your mind to think. Silence all negative thoughts and fears for the duration. Allow yourself to dream without practical worries about money, family or know-how. Do not worry if your answers overlap — that is a good sign.',
    lede: 'A representative selection from the course’s roughly hundred questions.', questions: true, groups: [{h: '', qs: [
      'My entire life I have struggled with, and then I finally overcame…', 'The theme of my life is…', 'What am I most proud of about my life?', 'Which five activities come effortlessly to me?', 'Which five activities am I great at?',
      'Which three actions do I enjoy taking regardless of the reward — which actions are their own reward?', 'I am absolutely happiest when I am doing or being…', 'When I feel most authentic I am doing…', 'List five creative endeavours that are truly meaningful to humanity.',
      'What three things, if I could magically manifest them, would dramatically change the world for the better?', 'If I were asked to pour my heart and soul into a work project, what aspects of me would show up in the final creation?', 'Which activities do I like doing excellently?',
      'What would my life look like if my only priority were one hundred per cent authentic self-expression?', 'Given my experiences, abilities and inclinations, what are three things I could accomplish that no one else could?', 'How am I intelligent — what is my unique type of intelligence?',
      'How can I make myself proud?', 'What absorbs me the most?', 'What is my art? How am I an artist?', 'What do I want to see more of in the world?', 'What is going to be my purple cow — the thing that is genuinely remarkable?'].map(q => [q, 'LPC'])}]},
  {id: 'hour', title: 'The vision hour', intro: 'This is imagination time. For the next hour there is no worrying, no how, and no accounting for money, family or know-how. Be idealistic and realistic at the same time. Watch for the fears and set them down at the door; there is a place to put them afterwards.', groups: [
    {h: 'Dream — one field, fill the page', qs: [['Where could this take me if I went all out with it?', 'LPC']]},
    {h: 'Specify — one question at a time', qs: HOUR_QS.map(q => [q, 'LPC'])},
    {h: 'Compress', qs: [['Write it as a future memory — first person, present tense, as though it has already happened.', 'new'], ['Now write where you actually are. Honestly, without softening.', 'existing']]}]},
  {id: 'visualise', title: 'Purpose visualisation prompts', lede: 'One at a time, every ninety seconds or on tap.', groups: Object.keys(PV_HORIZONS).map(k => ({h: PV_HORIZONS[k].name, qs: (PV_HORIZONS[k].prompts || []).map(q => [q, 'new'])}))},
  {id: 'belief', title: 'Challenging a limiting belief', groups: [{h: '', qs: [['What makes this look true? List the evidence for. Expect this list to come easily — the mind cherry-picks the negative.', 'LPC'], ['What makes it look false? List the evidence against. The asymmetry between the two lists is itself the finding.', 'LPC'],
    ['Who told you this? Did their life turn out well? Are they an expert in this?', 'LPC'], ['Where did it come from — repetition, childhood, society, or something that happened?', 'LPC'],
    ['Write it again, in a more positive form that is still honest. Not a denial of reality — a different reading of it.', 'LPC'], ['How strongly does it still grip you, one to five?', 'new']]}]},
  {id: 'badresults', title: 'Finding a belief from a bad result', groups: [{h: '', qs: [['Where in your life are you getting bad results? Any area producing bad results is an area holding a limiting belief.', 'LPC'],
    ['Look at what is going quiet: values below forty, skills untouched for ninety days, habits below half, goals past their date. Pick the ones that feel true.', 'new'], ['What would you have to believe about reality to produce this result?', 'LPC'], ['Write it as a flat sentence beginning “I believe” or “I cannot”.', 'new']]}]},
  {id: 'release', title: 'The negative-value release', note: 'A release is a session, not a cure. Do it again every season.', groups: [{h: '', qs: [['Which value is working against you?', 'LPC'], ['What is the common theme across the negative ones — and which were established earliest in your life?', 'LPC'], ['What is the earliest incident you can find?', 'LPC'],
    ['What was the defence protecting? It was useful then. Where is it self-sabotaging now?', 'LPC'], ['Is there anything you do where not doing it makes you feel something bad will happen? It does not have to be stereotypically traumatic.', 'LPC'], ['What shifted?', 'new']]}]},
  {id: 'resistance', title: 'The resistance log', groups: [{h: '', qs: [['What did you avoid?', 'new'], ['What form did it take? A legitimate-looking other task. Research instead of making. A tool or a setup you needed first. A person or an obligation. Entertainment. Planning instead of doing. Tiredness. Waiting for the right conditions.', 'LPC'],
    ['What was it protecting?', 'new'], ['What is the smallest next action? If you genuinely do not know how, the answer is research. If you do know, it is procrastination.', 'LPC']]}]},
  {id: 'fear', title: 'The fear inventory', groups: [{h: '', qs: [['What direction are you afraid of?', 'LPC'], ['Is this a fear about safety, or a fear about the cost and limitation of something grand? Only the second kind is a bearing.', 'LPC'],
    ['If you decided not to label it as bad — what would be exciting about this?', 'LPC'], ['What does it point at?', 'new']]}]},
  {id: 'funnel', title: 'The goal funnel', groups: [{h: '', qs: [['Write thirty or more goals for next year. Breadth first; the filter only works if there is something to filter.', 'LPC'], ['Order them. You are really supposed to accomplish about a fifth of these.', 'LPC'],
    ['Does this serve the statement, the genius, the impact, the domain, the medium? Which values does it serve?', 'LPC'], ['This hits none of the sheet. Why are you still making it?', 'LPC'],
    ['What are the major obstacles? For each one, what is the specific action — the five books, the three people to interview, the thing to cancel?', 'LPC'], ['Five minutes visualising yourself taking the first step.', 'LPC']]}]},
  {id: 'bets', title: 'Small bets', groups: [{h: '', qs: [['What is the passion hypothesis, in one sentence?', 'new'], ['Which parts of the sheet does this test?', 'LPC'], ['What did you make this week, and what did it feel like to make it?', 'new'],
    ['The verdict: this is mine; this is not mine; this is mine but not as the medium I tried; the bet did not actually test the hypothesis.', 'new'], ['What did this tell you about yourself?', 'new']]}]},
  {id: 'finitude', title: 'Finitude', groups: [{h: 'Urgency', qs: [['You will die. Probably not today. The window in which anything can be built is short. Sit with one question: what would you stop doing if you took that seriously?', 'LPC']]},
    {h: 'Grounding', qs: [['Whatever you build will be forgotten. Everyone ends in the same place. This is a source of strength rather than despair. Nothing to answer. Sit.', 'LPC']]},
    {h: 'The annual question', qs: [['Grounding in emptiness is supposed to embolden a purpose that is yours and dissolve one that is not. After this year, does the statement feel more yours, or less?', 'LPC']]}]},
  {id: 'morning', title: 'The two-minute morning sheet', groups: [{h: '', qs: [['Your purpose, before you look.', 'new'], ['Your zone of genius, before you look.', 'new'], ['Your impact, your domain, your medium.', 'new'],
    ['Then one of three, rotating: what does this value or strength actually mean? How much better would my life be if I lived it more? How can I live it more today?', 'LPC']]}]},
];

function sheetsRender(body){
  body.innerHTML = `<div class="sh-wrap"><p class="faint dm-lede">Every question the inner-life modules ask, on paper if you would rather. Printing is local: your browser prints this page and nothing is generated or sent anywhere. LPC marks questions from the Life Purpose Course; “new” marks the ones written for this house.</p>
    ${SHEETS.map(s => `<details class="sh-sheet" data-sh="${s.id}"><summary><b class="serif">${esc(s.title)}</b></summary>
      <div class="sh-body">${sheetHTML(s)}</div>
      <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" data-shprint="${s.id}">Print</button>${s.questions ? '<button class="btn sm ghost" data-shq="1">Put these in my Questions journal</button>' : ''}</div></details>`).join('')}</div>`;
  body.querySelectorAll('[data-shprint]').forEach(b => b.onclick = () => sheetPrint(b.dataset.shprint));
  const q = body.querySelector('[data-shq]'); if(q) q.onclick = sheetsToQuestions;
}
function sheetHTML(s){
  return `${s.intro ? `<p class="sh-intro">${esc(s.intro)}</p>` : ''}${s.lede ? `<p class="faint">${esc(s.lede)}</p>` : ''}
    ${s.groups.map(g => `${g.h ? `<h4>${esc(g.h)}</h4>` : ''}<ol class="sh-qs">${g.qs.map(([q, src]) => `<li>${esc(q)} <span class="mono faint">(${esc(src)})</span></li>`).join('')}</ol>`).join('')}
    ${s.note ? `<p class="faint"><i>${esc(s.note)}</i></p>` : ''}`;
}
function sheetPrint(id){
  const s = SHEETS.find(x => x.id === id); if(!s) return;
  const old = document.getElementById('ppPrintOnly'); if(old) old.remove();
  const box = document.createElement('div'); box.id = 'ppPrintOnly';
  box.innerHTML = `<div class="ppp"><h1>${esc(s.title)}</h1>${sheetHTML(s).replace(/<ol class="sh-qs">/g, '<ol class="sh-qs print">').replace(/<\/li>/g, '<div class="sh-line"></div></li>')}<p class="ppp-foot">${esc(fmtDate(today(), 'med'))}</p></div>`;
  document.body.appendChild(box); document.body.classList.add('pp-printing');
  const clean = () => { document.body.classList.remove('pp-printing'); box.remove(); window.removeEventListener('afterprint', clean); };
  window.addEventListener('afterprint', clean);
  try { window.print(); } catch(e){ clean(); }
}
/* the assessment as open questions: they never archive, collect answers over
   time, and come back in the reviews — and the convergence report reads them */
function sheetsToQuestions(){
  const s = SHEETS.find(x => x.id === 'assessment'), have = new Set((S.entries || []).filter(e => e.type === 'question').map(e => (e.title || '').trim()));
  const fresh = s.groups[0].qs.map(x => x[0]).filter(q => !have.has(q));
  if(!fresh.length){ toast('They are all in the Questions journal already.'); return; }
  const m = openModal(`<h2>Into the Questions journal</h2><p class="muted">${fresh.length} open question${fresh.length === 1 ? '' : 's'}. They never archive; each collects tentative answers over time and comes back in the reviews, and the convergence report reads the answers. Nothing is answered for you.</p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="shqNo">Not now</button><button class="btn primary" id="shqYes">Add ${fresh.length}</button></div>`, 'narrow');
  m.querySelector('#shqNo').onclick = () => m.remove();
  m.querySelector('#shqYes').onclick = () => { fresh.forEach(q => lifeEntryNew({type: 'question', title: q, body: '', tags: ['purpose'], extra: {status: 'open', answers: [], source: 'assessment'}})); saveNow(); m.remove(); sound('success'); toast(fresh.length + ' questions added.'); };
}
