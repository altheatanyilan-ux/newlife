/* ============================================================
   VOICE & AI — speaking, tidying, and one honest report.

   Dictation uses the browser's own speech recogniser. No audio is
   recorded, stored or uploaded; the browser hands back text and
   the text is all that exists.

   Polishing and the pattern report work in two modes:
     · local   — always available, no key, nothing leaves the page.
                 Rule-based cleanup and real statistics.
     · Claude  — if you paste an Anthropic API key in Settings, the
                 same material is sent to the API for a better pass.
   A Claude Pro/Max or ChatGPT subscription cannot be used here:
   those are consumer products and do not issue API credentials.
   API usage is billed separately, pay as you go.
   ============================================================ */

/* ---------- 1. dictation ---------- */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const dictationSupported = () => !!SpeechRec;
let activeDictation = null;
function startDictation(target, {onText, onEnd} = {}){
  if(!SpeechRec){ toast('This browser has no speech recogniser. Chrome, Edge and Safari have one.'); return null; }
  stopDictation();
  const rec = new SpeechRec();
  rec.lang = S.settings.dictationLang || navigator.language || 'en-US';
  rec.continuous = true; rec.interimResults = true;
  let settled = '';
  rec.onresult = ev => {
    let interim = '';
    for(let i = ev.resultIndex; i < ev.results.length; i++){
      const r = ev.results[i];
      if(r.isFinal) settled += (settled && !/\s$/.test(settled) ? ' ' : '') + r[0].transcript.trim();
      else interim += r[0].transcript;
    }
    onText && onText(settled, interim);
  };
  rec.onerror = ev => { if(ev.error === 'not-allowed') toast('Microphone permission was refused.'); else if(ev.error !== 'aborted' && ev.error !== 'no-speech') toast(`Dictation stopped: ${ev.error}`); stopDictation(); };
  rec.onend = () => { if(activeDictation && activeDictation.rec === rec){ activeDictation = null; onEnd && onEnd(settled); } };
  activeDictation = {rec, target};
  try { rec.start(); } catch(e){ activeDictation = null; toast('Could not start the microphone.'); return null; }
  return rec;
}
function stopDictation(){ const a = activeDictation; activeDictation = null; if(a){ try { a.rec.stop(); } catch(e){} } }

/* ---------- 2. tidying raw speech ---------- */
const FILLERS = /\b(um+|uh+|erm+|er|like|you know|i mean|sort of|kind of|basically|actually|literally|just kinda)\b[,]?\s*/gi;
/* a local pass: spoken text has no punctuation and too many fillers. This
   fixes the mechanics without inventing anything you did not say. */
function tidyLocally(raw){
  let t = String(raw || '').replace(/\s+/g, ' ').trim();
  if(!t) return '';
  t = t.replace(FILLERS, '');
  // spoken punctuation words people actually say
  t = t.replace(/\s*\b(full stop|period)\b\s*/gi, '. ')
       .replace(/\s*\bcomma\b\s*/gi, ', ')
       .replace(/\s*\b(question mark)\b\s*/gi, '? ')
       .replace(/\s*\b(exclamation (mark|point))\b\s*/gi, '! ')
       .replace(/\s*\b(new paragraph|paragraph break)\b\s*/gi, '\n\n')
       .replace(/\s*\b(new line)\b\s*/gi, '\n');
  // sentence breaks before common openers when none exist
  t = t.replace(/([a-z0-9])\s+(?=(?:And then|But then|So then|And so)\b)/g, '$1. ');
  t = t.replace(/\s+([,.;:!?])/g, '$1').replace(/([,.;:!?])(?=[^\s\d])/g, '$1 ');
  if(!/[.!?]$/.test(t)) t += '.';
  // capitalise sentence starts and the standalone I
  t = t.replace(/(^|[.!?]\s+|\n\s*)([a-z])/g, (m,a,b) => a + b.toUpperCase()).replace(/\bi\b/g, 'I');
  t = t.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ');
  return t.trim();
}

/* ---------- 3. the optional Claude connection ---------- */
const AI_KEY_LS = 'anthropicKey';
const AI_MODEL = 'claude-sonnet-5';
function aiKey(){ try { return localStorage.getItem(AI_KEY_LS) || ''; } catch(e){ return ''; } }
function setAiKey(k){ try { k ? localStorage.setItem(AI_KEY_LS, k.trim()) : localStorage.removeItem(AI_KEY_LS); } catch(e){} }
const aiReady = () => !!aiKey();
async function askClaude(system, user, {maxTokens = 1200} = {}){
  const key = aiKey(); if(!key) throw new Error('no key');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'content-type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true'},
    body: JSON.stringify({model: AI_MODEL, max_tokens: maxTokens, system, messages:[{role:'user', content:user}]}),
  });
  if(!res.ok){
    const body = await res.text().catch(()=> '');
    throw new Error(res.status === 401 ? 'That key was refused. Check it in Settings.' : res.status === 429 ? 'Rate limited — try again in a minute.' : `Claude returned ${res.status}. ${body.slice(0,140)}`);
  }
  const data = await res.json();
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
}
const POLISH_SYSTEM = `You clean up dictated personal-journal text for its own author. Rules, without exception:
- Preserve meaning, facts, names and voice exactly. Never add an idea, image, feeling or detail that is not already there.
- Remove filler words and false starts. Add punctuation, sentence and paragraph breaks.
- Keep the author's own words wherever they work. Do not raise the register or make it literary.
- Keep first person and the original tense. Keep any #hashtags verbatim.
- Return only the cleaned text. No preamble, no commentary, no quotation marks around it.`;
async function polishText(raw){
  const local = tidyLocally(raw);
  if(!aiReady()) return {text: local, via: 'local'};
  try { const out = await askClaude(POLISH_SYSTEM, `Clean up this dictation:\n\n${raw}`, {maxTokens: Math.min(4000, 400 + raw.length)}); return {text: out || local, via: 'claude'}; }
  catch(e){ return {text: local, via: 'local', error: e.message}; }
}

/* ---------- 4. the microphone button that sits on a long field ---------- */
function attachDictation(textarea, {compact = false} = {}){
  if(!textarea || textarea.dataset.dictated) return;
  textarea.dataset.dictated = '1';
  const wrap = document.createElement('div'); wrap.className = 'dictate' + (compact ? ' compact' : '');
  wrap.innerHTML = `<button type="button" class="dict-btn" title="${dictationSupported() ? 'Dictate — speak and it types' : 'This browser has no speech recogniser'}" ${dictationSupported()?'':'disabled'}>🎙<span>speak</span></button>
    <button type="button" class="dict-btn tidy" title="Tidy up what is written: fillers out, punctuation in">✧<span>tidy</span></button>
    <span class="dict-state mono"></span>`;
  textarea.insertAdjacentElement('afterend', wrap);
  const btn = wrap.querySelector('.dict-btn'), tidyBtn = wrap.querySelector('.tidy'), state = wrap.querySelector('.dict-state');
  const base = () => textarea.dataset.dictBase || '';
  const fire = () => textarea.dispatchEvent(new Event('input', {bubbles:true}));
  btn.onclick = () => {
    if(activeDictation && activeDictation.target === textarea){ stopDictation(); return; }
    textarea.dataset.dictBase = textarea.value ? textarea.value.replace(/\s*$/, '') + ' ' : '';
    const rec = startDictation(textarea, {
      onText: (settled, interim) => { textarea.value = base() + settled + (interim ? (settled ? ' ' : '') + interim : ''); fire(); textarea.scrollTop = textarea.scrollHeight; },
      onEnd: () => { btn.classList.remove('rec'); btn.querySelector('span').textContent = 'speak'; state.textContent = textarea.value.length > base().length ? 'dictated — press ✧ to tidy it' : ''; },
    });
    if(rec){ btn.classList.add('rec'); btn.querySelector('span').textContent = 'stop'; state.textContent = 'listening — audio is never stored'; }
  };
  tidyBtn.onclick = async () => {
    const raw = textarea.value.trim(); if(!raw){ toast('Nothing to tidy yet.'); return; }
    tidyBtn.disabled = true; state.textContent = aiReady() ? 'Claude is tidying…' : 'tidying…';
    const prev = raw;
    const {text, via, error} = await polishText(raw);
    textarea.value = text; fire();
    tidyBtn.disabled = false;
    state.innerHTML = `${via === 'claude' ? 'tidied by Claude' : 'tidied locally'} · <button type="button" class="linkish" data-undo>undo</button>`;
    state.querySelector('[data-undo]').onclick = () => { textarea.value = prev; fire(); state.textContent = 'reverted'; };
    if(error) toast(error);
    sound('success');
  };
}
/* every long field in a modal, panel or page gets the pair of buttons */
function attachDictationIn(root){ $$('textarea.ta, textarea.write-area', root || document).forEach(t => attachDictation(t, {compact: t.classList.contains('write-area')})); }

/* ---------- 5. the pattern report ---------- */
/* Real numbers first. These are computed here and are true whether or not
   a key is present; Claude is only ever asked to interpret them. */
function gatherPatterns({days = 90} = {}){
  const T = today(); const from = addDays(T, -days);
  const es = S.entries.filter(e => (e.createdAt||e.occurredAt||'').slice(0,10) >= from);
  const snaps = allSnapshotsWithRetro();
  const words = {}; const STOP = new Set('the a an and or but if then than that this these those i me my myself we our you your he she it they them is are was were be been being have has had do does did of in on at to for with about into over after under again more most other some such no nor not only own same so too very can will just should now it\'s i\'m don\'t there here what when where who how out up down as by from'.split(' '));
  es.forEach(e => `${e.title||''} ${e.body||''}`.toLowerCase().replace(/[^\p{L}\p{N}\s#]/gu,' ').split(/\s+/).forEach(w => { if(w.length > 3 && !STOP.has(w)) words[w] = (words[w]||0)+1; }));
  const topWords = Object.entries(words).sort((a,b)=>b[1]-a[1]).slice(0,14);
  const tagCounts = {}; es.forEach(e => entryTags(e).forEach(t => tagCounts[t] = (tagCounts[t]||0)+1));
  const valueTrends = S.valueOrder.map(id => {
    const v = byId(S.values, id); if(!v) return null;
    const series = snaps.map(s => s.ratings[id]).filter(x => x != null);
    if(series.length < 2) return {name: v.name, series, run: 0};
    let run = 0; for(let i = series.length-1; i > 0; i--){ const d = series[i] - series[i-1]; if(run === 0) run = d < 0 ? -1 : d > 0 ? 1 : 0; else if((d < 0 && run < 0) || (d > 0 && run > 0)) run += Math.sign(d); else break; }
    return {name: v.name, series, latest: series[series.length-1], first: series[0], run};
  }).filter(Boolean);
  const states = lastDays(days).map(d => dayState(d)).filter(v => v !== null);
  const byWeekday = [0,1,2,3,4,5,6].map(i => { const vals = lastDays(days).filter(d => parseDay(d).getDay() === i).map(d => dayState(d)).filter(v => v !== null); return {day: DOW[i], n: vals.length, avg: vals.length ? Math.round(avg(vals)) : null}; });
  const habitRates = S.habits.filter(h => !h.archived && !h.negative).map(h => { const r = habitWeekRates(h); const last = r[r.length-1]; return {name: h.name, recent: last ? Math.round(last.done/Math.max(last.due,1)*100) : 0, streak: habitStreak(h).cur}; });
  const skillsCold = S.skills.filter(s => skillIsAtrophying(s)).map(s => ({name: s.name, days: daysSince(skillLastPracticed(s))})).sort((a,b)=>(b.days===Infinity?0:b.days)-(a.days===Infinity?0:a.days));
  const people = {}; es.forEach(e => (e.people||[]).forEach(p => people[p] = (people[p]||0)+1));
  const cadence = {};
  es.forEach(e => { const wk = weekStart((e.createdAt||e.occurredAt||T).slice(0,10)); cadence[wk] = (cadence[wk]||0)+1; });
  return {days, entryCount: es.length, byType: ENTRY_TYPES.map(([t,n]) => ({type:n, n: es.filter(e=>e.type===t).length})).filter(x=>x.n), topWords,
    tags: Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,12), valueTrends,
    state: {n: states.length, avg: states.length ? Math.round(avg(states)) : null, first: states.length ? Math.round(avg(states.slice(0, Math.ceil(states.length/2)))) : null, second: states.length ? Math.round(avg(states.slice(Math.ceil(states.length/2)))) : null},
    byWeekday, habitRates, skillsCold, people: Object.entries(people).sort((a,b)=>b[1]-a[1]).slice(0,8),
    cadence: Object.entries(cadence).sort(), visions: S.visions.filter(v=>v.confidence!=='lived').map(v=>({name:v.name, vividness: vividness(v).score})).slice(0,10)};
}
/* the local report: statements that are simply true, phrased plainly */
function localPatternReport(p){
  const out = [];
  out.push(`In the last ${p.days} days you wrote **${p.entryCount}** ${p.entryCount === 1 ? 'entry' : 'entries'}${p.byType.length ? ` — ${p.byType.sort((a,b)=>b.n-a.n).slice(0,2).map(t=>`${t.n} ${t.type.toLowerCase()}${t.n===1?'':'s'}`).join(', ')}` : ''}.`);
  if(p.tags.length) out.push(`The tag you reach for most is **#${p.tags[0][0]}** (${p.tags[0][1]} entries)${p.tags[1] ? `, then #${p.tags[1][0]}` : ''}.`);
  if(p.topWords.length > 2){ const w = p.topWords.slice(0,5).map(([x,n])=>`${x} (${n})`).join(', '); out.push(`Words that keep coming back: ${w}.`); }
  const falling = p.valueTrends.filter(v => v.run <= -3);
  falling.forEach(v => out.push(`**${v.name}** congruence has fallen ${Math.abs(v.run)} readings in a row, now at ${v.latest}.`));
  const rising = p.valueTrends.filter(v => v.run >= 3);
  rising.forEach(v => out.push(`**${v.name}** has risen ${v.run} readings in a row, now at ${v.latest}.`));
  if(p.state.n > 6 && p.state.first !== null){ const d = p.state.second - p.state.first;
    out.push(`Your overall state averaged **${p.state.avg}/100** across ${p.state.n} logged days, ${Math.abs(d) < 4 ? 'level across the period' : d > 0 ? `up ${d} points in the second half` : `down ${Math.abs(d)} points in the second half`}.`); }
  const wd = p.byWeekday.filter(w => w.avg !== null && w.n >= 2);
  if(wd.length >= 4){ const best = [...wd].sort((a,b)=>b.avg-a.avg)[0], worst = [...wd].sort((a,b)=>a.avg-b.avg)[0];
    if(best.avg - worst.avg >= 12) out.push(`**${best.day}s** run brightest (${best.avg}) and **${worst.day}s** heaviest (${worst.avg}).`); }
  p.skillsCold.slice(0,3).forEach(s => out.push(s.days === Infinity ? `**${s.name}** has never been practised — it is on the tree but not in your week.` : `**${s.name}** has not been practised in ${s.days} days.`));
  const weak = p.habitRates.filter(h => h.recent < 40);
  if(weak.length) out.push(`${weak.length === 1 ? 'One habit is' : `${weak.length} habits are`} under 40% this week: ${weak.slice(0,3).map(h=>h.name).join(', ')}.`);
  if(p.people.length) out.push(`The people who appear most in what you write: ${p.people.slice(0,3).map(([n,c])=>`${n} (${c})`).join(', ')}.`);
  if(out.length < 3) out.push('There is not much here yet. A few weeks of entries and check-ins and the patterns start to show.');
  return out;
}
const REPORT_SYSTEM = `You are reading one person's private journal statistics and writing them a short monthly reflection. You are talking to them, not about them.
Rules:
- Ground every observation in the numbers you are given. Never invent an event, a person or a feeling.
- Say what the pattern is, then what it might mean, then one concrete thing they could try. Be specific.
- Notice tension between what they say matters and what the numbers show.
- Warm, direct, unsentimental. No therapy-speak, no praise padding, no bullet-point listicles of advice.
- 4 to 6 short paragraphs. Plain markdown. Address them as "you". Do not open with a greeting or a summary of your task.`;
async function generatePatternReport({days = 90} = {}){
  const p = gatherPatterns({days});
  const local = localPatternReport(p);
  if(!aiReady()) return {mode:'local', lines: local, data: p};
  const text = await askClaude(REPORT_SYSTEM, `Here are the statistics from my last ${days} days. Write my reflection.\n\n${JSON.stringify(p, null, 1)}`, {maxTokens: 1600});
  return {mode:'claude', text, lines: local, data: p};
}
