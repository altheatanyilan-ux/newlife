/* ============================================================
   THE PURPOSE SPINE — the model

   One sheet that the rest of the inward half answers to: a life purpose
   statement, the zone of genius, the impact, the domain of mastery and the
   ideal medium, each a dated list of versions in the same shape a value's
   questions already use. Around it, the things that make it a practice and
   not a document: the strict ninety-day imprint, the add-only practice log,
   the screening of goals, visions, habits and skills against the sheet.

   The four kinds of thing, kept differently (as in the rest of the house):
     words      the five artefacts, a strength's gloss and shadow — versioned
     readings   an expression reading, a rung — kept as given
     positions  rank history, challenge rows, release rows — add-only
     marks      the practice log and the imprint counters — a record of
                having practised, and not correctable by hand

   Nothing here is a score. Nothing leaves the device.
   ============================================================ */

const PURPOSE_KEYS = ['statement', 'genius', 'impact', 'domain', 'medium'];
const PURPOSE_FIELDS = {
  statement: {label: 'Life purpose statement', short: 'purpose',
    q: 'What is the work of your life, said in under fifteen words?',
    help: 'Under fifteen words. About your career and life work, not family or hobbies. Short sentences, concrete verbs, nothing flowery. It should trigger you emotionally, because that is what drives you.',
    example: 'to use my big picture thinking to give people deep insights about life, making them wiser'},
  genius: {label: 'Zone of genius', short: 'genius',
    q: 'What is the top unique ability you are suited to — the work only you do this way?',
    help: 'The work you are uniquely suited to, using your greatest strengths and gifts. You grow into it. It is supposed to be lofty enough to frighten you.',
    example: ''},
  impact: {label: 'Impact statement', short: 'impact',
    q: 'Who do you want to affect, and what changes for them?',
    help: 'Name a recipient and a change. The test: could you say you made the most important difference you could?',
    example: ''},
  domain: {label: 'Domain of mastery', short: 'domain',
    q: 'Which one field will the ten thousand hours go into?',
    help: 'One field. It links to Skill Tree categories, so the tree can mark which branches serve it.',
    example: ''},
  medium: {label: 'Ideal medium', short: 'medium',
    q: 'What is the vehicle — video, prose, songs, a platform, a classroom?',
    help: 'This one is exploratory: finding a medium is research and a litmus test, not a decision. It carries a confidence rung for that reason.',
    example: ''},
};
/* the course's own warning about vague, abstract language */
const PURPOSE_VAGUE = [
  ['facilitate', 'a vague verb — what, exactly, do you do?'],
  ['process', 'an abstract noun — say what actually happens'],
  ['processes', 'an abstract noun — say what actually happens'],
  ['leverage', 'a consultant’s verb — use the plain one'],
  ['empower', 'abstract — who does what differently afterwards?'],
  ['impact', 'as a verb it hides the change; as a noun, name the change'],
  ['synergy', 'abstract — say what combines with what'],
  ['help people', 'which people, and helped to do what?'],
  ['make a difference', 'what difference, to whom?'],
  ['change the world', 'too large to steer by — which part of it?'],
  ['be successful', 'successful at what, by whose measure?'],
  ['be happy', 'a feeling, not a work — what would you be doing?'],
];
const PURPOSE_RUNGS = CONF;   // hunch, exploring, plan, committed, in motion, lived
/* the three morning questions the course asks of strengths and values */
const PURPOSE_CLOSERS = [
  'What does this mean to you, in your own words?',
  'How much better would your life be if you lived this more?',
  'How can you live this more, today?',
];
const IMPRINT_KINDS = ['affirmation', 'contemplation', 'visualization', 'purposereview'];

/* ---------- state ---------- */
function purposeState(){
  const p = S.purpose = S.purpose && typeof S.purpose === 'object' ? S.purpose : {};
  PURPOSE_KEYS.concat(['niche']).forEach(k => { if(!Array.isArray(p[k])) p[k] = []; });
  ['reviewedAt', 'printedAt', 'openedAt'].forEach(k => { if(p[k] === undefined) p[k] = ''; });
  if(!p.mode) p.mode = 'read';
  if(p.foldVersions === undefined) p.foldVersions = true;
  if(!p.closerSeen || typeof p.closerSeen !== 'object') p.closerSeen = {};
  return p;
}
function imprintState(which){
  const key = which === 'values' ? 'valuesImprint' : 'purposeImprint';
  const target = which === 'values' ? 30 : 90;
  const i = S[key] = S[key] && typeof S[key] === 'object' ? S[key] : {};
  if(!i.target) i.target = target;
  ['startedOn', 'lastDay'].forEach(k => { if(i[k] === undefined) i[k] = ''; });
  ['run', 'bestRun', 'restarts'].forEach(k => { if(!(i[k] >= 0)) i[k] = 0; });
  if(which === 'values' && !(i.seasonalResets >= 0)) i.seasonalResets = 0;
  return i;
}
function lifeArray(k){ return Array.isArray(S[k]) ? S[k] : (S[k] = []); }
function migratePurpose(){
  purposeState(); imprintState('purpose'); imprintState('values');
  ['practiceLog', 'strengths', 'strengthSnapshots', 'strengthRankHistory', 'affirmations', 'beliefs', 'bets', 'retreats',
   'negativeValues', 'masterValues', 'zoneItems', 'flowClues', 'breaks', 'habitsToDrop', 'alignmentChecks', 'convergence'].forEach(lifeArray);
  /* kinds that exist only to be read somewhere better than the sidebar */
  LIFE_KINDS.forEach(([t, n, ic]) => {
    if(!ENTRY_TYPES.some(x => x[0] === t)) ENTRY_TYPES.push([t, n, ic]);
    if(Array.isArray(S.journals) && !S.journals.some(j => j.type === t)) S.journals.push({type: t, name: n});
  });
}
/* Affirmation and Memento are read in the Theatre and in the sacred space.
   Contemplation, Belief and Resistance (later modules) are journals. */
const LIFE_KINDS = [['affirmation', 'Affirmation', '“'], ['memento', 'Memento', '⌛'],
  ['contemplation', 'Contemplation', '◎'], ['belief', 'Belief', '⚓'], ['resistance', 'Resistance', '↺'], ['betlog', 'Bet log', '⚄']];
['affirmation', 'memento', 'betlog'].forEach(t => { if(typeof JOURNAL_HIDDEN !== 'undefined' && !JOURNAL_HIDDEN.includes(t)) JOURNAL_HIDDEN.push(t); });
LIFE_KINDS.forEach(([t, n, ic]) => { if(!ENTRY_TYPES.some(x => x[0] === t)) ENTRY_TYPES.push([t, n, ic]); });

/* ---------- versions: words, never overwritten ----------
   One helper serves the purpose artefacts, a strength's gloss and shadow, and
   a value's definition. The stage-story rule decides whether an edit is a new
   version or a correction: fewer than 85% of the old distinct words surviving,
   or the length changing by more than a fifth. A typo is not a version. */
const verLatest = list => (list && list.length) ? list[list.length - 1] : null;
const verText = list => (verLatest(list) || {}).text || '';
function verIsNewWording(oldV, newV){
  const words = t => new Set(String(t || '').toLowerCase().split(/\W+/).filter(Boolean));
  const a = words(oldV), b = words(newV);
  if(!a.size) return true;
  let shared = 0; a.forEach(w => { if(b.has(w)) shared++; });
  return shared / a.size < .85 || Math.abs(String(oldV).length - String(newV).length) > String(oldV).length * .2;
}
/* returns 'same' | 'corrected' | 'version' | 'first' */
function verSave(list, text, {force = false, note = '', extra = null} = {}){
  text = String(text || '').trim();
  const cur = verLatest(list);
  if(!text) return 'same';
  if(cur && cur.text === text && !force) return 'same';
  const row = Object.assign({text, at: new Date().toISOString(), note, via: 'direct'}, extra || {});
  if(!cur){ list.push(row); return 'first'; }
  if(force || verIsNewWording(cur.text, text)){ list.push(row); return 'version'; }
  cur.text = text; if(extra) Object.assign(cur, extra); cur.correctedAt = row.at;
  return 'corrected';
}
function purposeSave(k, text, opts){
  const p = purposeState();
  const how = verSave(p[k], text, opts);
  if(how !== 'same'){ p.openedAt = p.openedAt || new Date().toISOString(); saveNow(); }
  return how;
}
const purposeText = k => verText(purposeState()[k]);
const purposeHas = k => k === 'values' ? (S.valueOrder || []).length > 0 : !!purposeText(k).trim();
const purposeAny = () => PURPOSE_KEYS.some(k => purposeHas(k));
const purposeWords = t => String(t || '').trim() ? String(t).trim().split(/\s+/).length : 0;
function purposeVagueIn(text){
  const t = ' ' + String(text || '').toLowerCase().replace(/[^a-z' ]+/g, ' ') + ' ';
  return PURPOSE_VAGUE.filter(([w]) => t.includes(' ' + w + ' '));
}
/* the course's figure is the stored one divided by ten, to one decimal */
const congruenceCourse = n => (Math.round((+n || 0) / 10 * 10) / 10).toFixed(1);

/* ---------- the practice log: add-only marks of practice ----------
   Not a score: a record that the week's shape can read back. */
function practiceLogAdd(kind, {minutes = 0, subjectRef = '', at} = {}){
  const row = {id: uid(), date: today(), at: at || new Date().toISOString(), kind, minutes: +minutes || 0, subjectRef: subjectRef || ''};
  lifeArray('practiceLog').push(row);
  return row;
}
const practiceOn = d => lifeArray('practiceLog').filter(r => r.date === d && r.kind !== 'imprint-restart');
/* the strict counter. A day counts if at least one contact was made; one row
   is enough and four do not count as four. Consecutive or it restarts. */
function imprintAdvance(which, T){
  const imp = imprintState(which);
  T = T || today();
  if(imp.lastDay === T) return {changed: false, run: imp.run};
  let restarted = false;
  if(imp.lastDay && imp.lastDay === addDays(T, -1)) imp.run++;
  else {
    restarted = !!imp.lastDay;
    imp.run = 1; imp.startedOn = T;
    if(restarted){ imp.restarts++; practiceLogAdd('imprint-restart', {subjectRef: which}); }
  }
  imp.lastDay = T;
  if(imp.run > imp.bestRun) imp.bestRun = imp.run;
  return {changed: true, run: imp.run, restarted};
}
/* A day that has gone by without contact is a restart whether or not anybody
   opens the app that day, so the run is read, not stored: yesterday or today
   keeps it alive, anything older reads as run 0. */
function imprintRun(which){
  const imp = imprintState(which), T = today();
  if(!imp.lastDay) return 0;
  return (imp.lastDay === T || imp.lastDay === addDays(T, -1)) ? imp.run : 0;
}
function imprintLine(which){
  const imp = imprintState(which), run = imprintRun(which), T = today();
  const done = imp.lastDay === T;
  const seas = which === 'values' ? imp.seasonalResets : 0;
  const restarted = imp.restarts ? `restarted ${imp.restarts === 1 ? 'once' : imp.restarts + ' times'}` : '';
  const seasonal = seas ? `reset ${seas === 1 ? 'once' : seas + ' times'} by season` : '';
  const best = imp.bestRun > run ? `best run ${imp.bestRun} days` : '';
  return {run, target: imp.target, done, text: run
      ? `day ${Math.min(run, imp.target)}${run > imp.target ? '+' : ''} of ${imp.target}${done ? '' : ' · today still to come'}`
      : (imp.lastDay ? 'a day was missed — day one begins at the next contact' : 'not begun'),
    notes: [restarted, seasonal, best].filter(Boolean).join(' · ')};
}
/* a contact with the purpose: a practice, or the morning review. Logs the
   row, advances the strict counter, and (for the three practices) marks the
   twenty-one-day tracker. */
function purposeContact(kind, opts = {}){
  const row = practiceLogAdd(kind, opts);
  let adv = null;
  if(IMPRINT_KINDS.includes(kind)){
    const before = imprintState('purpose').run;
    adv = imprintAdvance('purpose');
    if(adv.restarted) toast(`The ninety days have to be consecutive, so this is day one again. (Best run: ${imprintState('purpose').bestRun} day${imprintState('purpose').bestRun === 1 ? '' : 's'}.)`, 6500);
    else if(adv.changed && before === 0 && adv.run === 1) toast('Day one of the ninety.', 3500);
  }
  if(['affirmation', 'contemplation', 'visualization'].includes(kind) && typeof theatreMark === 'function') theatreMark();
  saveNow();
  return row;
}

/* ---------- the add-only guard ----------
   Called from persist(). A top-level row in an add-only store, or a nested
   row in an add-only array, that was written stays written: if anything
   changed or removed it, it is put back and the person is told. Without
   this the protection would cover the Knowledge Tree and not the more
   personal half of the record. */
const LIFE_ADD_ONLY = [
  {store: 'practiceLog'}, {store: 'strengthRankHistory'},
  {store: 'beliefs', field: 'challenges'}, {store: 'negativeValues', field: 'releases'}, {store: 'bets', field: 'verdicts'},
];
function lifeGuard(rows, lastWritten){
  let broke = 0;
  LIFE_ADD_ONLY.forEach(({store, field}) => {
    if(!lastWritten[store] || !rows[store]) return;
    let prev; try { prev = JSON.parse(lastWritten[store]); } catch(e){ return; }
    if(!Array.isArray(prev)) return;
    const cur = new Map(rows[store].map(r => [r.id, r]));
    const fixed = rows[store].slice();
    prev.forEach(old => {
      const now = cur.get(old.id);
      if(old.seeded === 'tutorial' && !now) return;
      if(!field){
        if(now && JSON.stringify(now) === JSON.stringify(old)) return;
        broke++;
        const frozen = Object.freeze(Object.assign({}, old));
        const i = fixed.findIndex(r => r.id === old.id);
        if(i > -1) fixed[i] = frozen; else fixed.push(frozen);
        return;
      }
      if(!now) return;   // the whole belief/bet/value may be removed; its rows go with it
      const was = Array.isArray(old[field]) ? old[field] : [], is = Array.isArray(now[field]) ? now[field] : [];
      const kept = was.every((r, i) => JSON.stringify(is[i]) === JSON.stringify(r));
      if(!kept){ broke++; now[field] = was.concat(is.filter(r => !was.some(w => w.id && w.id === r.id))); }
    });
    if(!field && (fixed.length !== rows[store].length || broke)){ S[store] = fixed; rows[store] = fixed; }
  });
  if(broke){
    console.warn(`${broke} add-only record(s) were changed or removed; they have been put back.`);
    if(typeof toast === 'function') toast('A practice record, ranking, challenge or release cannot be changed once saved. It has been put back.', 5000);
  }
  return broke;
}

/* ---------- screening: what has been put to the sheet ---------- */
const purposeRefs = o => (o && Array.isArray(o.purposeRef)) ? o.purposeRef.filter(k => k === 'values' || PURPOSE_KEYS.includes(k)) : [];
const purposeScreened = o => purposeRefs(o).some(purposeHas);
function purposeToggleRef(o, key){
  if(!Array.isArray(o.purposeRef)) o.purposeRef = [];
  const i = o.purposeRef.indexOf(key);
  if(i >= 0) o.purposeRef.splice(i, 1); else o.purposeRef.push(key);
  saveNow();
}
/* what the screening looks at: each group is {kind, label, items:[{o,label,go}]} */
function purposeScreenGroups(){
  const g = [];
  const visions = (S.visions || []).filter(v => !v.archived && v.status !== 'completed');
  g.push({kind: 'vision', label: 'visions', items: visions.map(o => ({o, label: o.name || o.title || 'A vision', go: '#/purpose/vision/' + o.id}))});
  const goals = (typeof perfGoals === 'function' ? perfGoals() : []).filter(x => x.status === 'active');
  g.push({kind: 'goal', label: 'performance goals', items: goals.map(o => ({o, label: o.text || o.title || o.name || 'A goal', go: '#/today/time/goals'}))});
  const habits = (S.habits || []).filter(h => !h.archived && !h.negative);
  g.push({kind: 'habit', label: 'habits', items: habits.map(o => ({o, label: o.name, go: '#/today/habits'}))});
  const skills = (S.skills || []).filter(s => (typeof skillHorizon === 'function' ? skillHorizon(s) : s.horizon) === 'focus');
  g.push({kind: 'skill', label: 'in-focus skills', items: skills.map(o => ({o, label: o.name, go: '#/identity/skills'}))});
  const bets = (S.bets || []).filter(b => !b.closedAt);
  if(bets.length) g.push({kind: 'bet', label: 'small bets', items: bets.map(o => ({o, label: o.hypothesis || 'A bet', go: '#/purpose/real'}))});
  return g;
}
function purposeScreening(){
  const groups = purposeScreenGroups();
  return groups.map(gr => ({kind: gr.kind, label: gr.label, total: gr.items.length,
    screened: gr.items.filter(i => purposeScreened(i.o)).length,
    open: gr.items.filter(i => !purposeScreened(i.o))}));
}

/* ---------- entries: every practice that makes words makes an entry ---------- */
function lifeEntryNew({type, title = '', body = '', extra = {}, tags = [], links = {}, occurredAt}){
  const e = {id: uid(), type, title, body, occurredAt: occurredAt || today(), createdAt: new Date().toISOString(), media: [],
    links: Object.assign({stages: [], substages: [], threads: [], values: [], visions: [], skills: [], projects: [], people: []}, links),
    people: [], places: [], emotions: [], tags, confidence: '', extra};
  S.entries.push(e);
  return e;
}

/* ---------- the affirmation set: a short managed list ---------- */
const affirmationsAll = () => lifeArray('affirmations');
function affirmationNew(text, source = 'manual', sourceId = ''){
  text = String(text || '').trim(); if(!text) return null;
  const a = {id: uid(), text, source, sourceId, lastUsedAt: '', uses: 0, at: new Date().toISOString()};
  affirmationsAll().push(a); saveNow(); return a;
}
/* least recently used; ties by creation order. The user may override and the
   override does not move the pointer for the others. */
function affirmationNext(){
  const xs = affirmationsAll(); if(!xs.length) return null;
  return xs.map((a, i) => ({a, i})).sort((x, y) => (x.a.lastUsedAt || '').localeCompare(y.a.lastUsedAt || '') || x.i - y.i)[0].a;
}
/* the offered shapes: not prefilled, never the system's own words */
function affirmationOffers(){
  const out = [];
  const st = purposeText('statement');
  if(st) out.push({text: 'I am ' + st.replace(/^to\s+/i, 'someone who is here to ').replace(/\.$/, '') + '.', source: 'purpose', label: 'from your purpose statement'});
  (S.valueOrder || []).slice(0, 3).forEach(id => { const v = byId(S.values, id); if(!v) return;
    const d = verText((v.fields || {}).definition) || v.tagline;
    if(d) out.push({text: `${v.name}: ${d}`, source: 'value', sourceId: v.id, label: 'from your value ' + v.name}); });
  return out;
}

/* ---------- strengths: a model, not a skill ---------- */
const strengthsAll = () => lifeArray('strengths');
function strengthNew({name, surveyText = '', source = 'manual'}){
  name = String(name || '').trim(); if(!name) return null;
  const s = {id: uid(), name, surveyText: String(surveyText || '').trim(), gloss: [], shadow: [],
    links: {skillIds: [], valueIds: [], zoneItemIds: [], beliefIds: []}, at: new Date().toISOString(), lastReviewedAt: '', source};
  strengthsAll().push(s);
  strengthRankLog('added ' + name);
  saveNow(); return s;
}
function strengthRankLog(reason){
  lifeArray('strengthRankHistory').push({id: uid(), at: new Date().toISOString(), order: strengthsAll().map(s => s.id), names: strengthsAll().map(s => s.name), reason: reason || ''});
}
function strengthMove(id, to){
  const xs = strengthsAll(), from = xs.findIndex(s => s.id === id);
  if(from < 0 || to < 0 || to >= xs.length || to === from) return;
  const [s] = xs.splice(from, 1); xs.splice(to, 0, s);
  strengthRankLog(`moved ${s.name} to ${to + 1}`);
  saveNow();
}
function strengthLinkCount(s){
  const l = s.links || {};
  const skills = (l.skillIds || []).filter(id => byId(S.skills, id)).length;
  const zone = (l.zoneItemIds || []).filter(id => byId(S.zoneItems || [], id)).length;
  const vals = (l.valueIds || []).filter(id => byId(S.values, id)).length;
  return {skills, zone, vals, any: skills + zone + vals + ((l.beliefIds || []).length)};
}
/* a stable hash of the day and the strength, so the same strength does not get
   the same question two mornings running and the rotation is reproducible */
function strengthCloser(s, T){
  T = T || today();
  const h = str => { let x = 0; for(let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0; return x; };
  const day = Math.floor(parseDay(T).getTime() / 86400000);
  return (h(s.id) + day) % PURPOSE_CLOSERS.length;
}
/* the annual retake: exists only when the newest ranking is a year old */
function strengthsRetakeDue(){
  const hist = lifeArray('strengthRankHistory'); if(!hist.length) return false;
  const last = hist[hist.length - 1].at.slice(0, 10);
  return daysBetween(last, today()) >= 365;
}

/* ---------- a missing point becomes a goal ----------
   The way the compass steers and not only reports: what you said would take a
   value from seven to ten becomes a thirty-day performance goal, with the
   value and the sheet already named as what it serves. */
function purposeMakeGoal({text, valueId, refs}){
  const v = byId(S.values, valueId);
  const g = perfNormalize({level: 'month', title: String(text || '').trim(), relevant: v ? `It would move ${v.name} closer to ten.` : ''});
  g.purposeRef = ['values'].concat(refs || []);
  g.valueIds = v ? [v.id] : [];
  perfGoals().push(g); saveNow();
  return g;
}

/* ---------- the shared spine ----------
   The self-image script, scripting and a scene entered point at nothing in
   common unless something says so. One read-only line at the head of each:
   the purpose statement, and the vision currently in focus. */
function purposeFocusVision(){
  if(S._thSession && typeof thStepVision === 'function'){ const v = thStepVision(Math.max(0, S._thSession.i)); if(v) return v; }
  return typeof thRotation === 'function' ? (thRotation()[0] || null) : null;
}
function purposeSpineHTML(){
  const st = purposeText('statement'), v = purposeFocusVision();
  if(!st && !v) return '';
  return `<div class="pp-spine">${st ? `<span class="mono faint">purpose</span> <span class="serif">${esc(st)}</span>` : ''}${st && v ? ' <span class="faint">\u00B7</span> ' : ''}${v ? `<span class="mono faint">vision in focus</span> <span class="serif">${esc(v.name || v.title || '')}</span>` : ''}</div>`;
}
