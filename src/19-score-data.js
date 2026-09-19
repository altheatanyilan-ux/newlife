/* ============================================================
   SCORE PRACTICE — the notation, and what you have written on it.

   A practice companion rather than a notation editor. The score is engraved
   from a MusicXML file you bring; everything this room adds sits on top of it
   and is the part worth keeping: which measures are a section, what you have
   written about each one, how it is going, and the pins where a fingering has
   caught you out three times.

   The reason it is score-first rather than list-first is that "the left-hand
   octave leaps need isolated work" is a sentence about bar 60, and a sentence
   about bar 60 belongs at bar 60. Kept in a practice diary it is a note you
   will read in three weeks; kept on the notation it is a note you cannot
   avoid reading the next time you play that page.
   ============================================================ */

/* Warm, and off the house's own palette — a score is black on cream, and a
   neon band over it makes the notes harder to read, which is the one thing a
   practice annotation must never do. */
const SCORE_COLORS = [
  ['#b0705e', 'Terracotta'], ['#7f916a', 'Sage'],      ['#a0727e', 'Dusty rose'],
  ['#5c7c8a', 'Slate'],      ['#c9a96e', 'Warm gold'], ['#7f6a8e', 'Iris']];
/* Five degrees of ready, which is the vocabulary a piece is actually talked
   about in. Solid is not polished: solid is that it holds together alone,
   polished is that it holds together with somebody listening. */
const SCORE_STATUS = [
  ['not_started', 'Not started', 'read, not played'],
  ['rough',       'Rough',       'the notes are there and nothing else is'],
  ['working',     'Working',     'playable slowly, falls apart at tempo'],
  ['solid',       'Solid',       'holds together on its own'],
  ['polished',    'Polished',    'holds together with somebody listening']];
const scoreStatusName = k => (SCORE_STATUS.find(s => s[0] === k) || SCORE_STATUS[0])[1];
const scoreStatusDots = k => {
  const n = Math.max(1, SCORE_STATUS.findIndex(s => s[0] === k) + 1);
  return '●'.repeat(n) + '○'.repeat(5 - n);
};

/* ---------- storage ----------
   Its own store, because these rows are the heaviest in the database by an
   order of magnitude and the save pass writes only the stores that changed:
   keeping a score out of the store the day's tasks live in means editing a
   task does not rewrite a megabyte of Chopin. */
function scoreState(){
  if(!Array.isArray(S.scores)) S.scores = [];
  S.scores.forEach(scoreDefaults);
  return S.scores;
}
function scoreDefaults(x){
  x.id = x.id || uid();
  x.title = x.title || 'Untitled';
  x.composer = x.composer || '';
  x.musicXml = typeof x.musicXml === 'string' ? x.musicXml : '';
  x.instruments = Array.isArray(x.instruments) ? x.instruments : [];
  x.hidden = Array.isArray(x.hidden) ? x.hidden : [];      // part indices switched off
  x.totalMeasures = +x.totalMeasures || 0;
  x.zoom = +x.zoom || 1;
  /* How many bars to a line. Left alone the engraver fits as many as the
     width allows, which on a narrow column is two or three — fine for looking
     something up and useless for reading, because the eye reads a phrase and
     a phrase is rarely two bars long. Zero means let it decide. */
  x.barsPerLine = clamp(+x.barsPerLine || 0, 0, 16);
  x.sections = Array.isArray(x.sections) ? x.sections : [];
  x.sections.forEach(s => scoreSectionDefaults(s, x));
  x.pins = Array.isArray(x.pins) ? x.pins : [];
  x.pins.forEach(scorePinDefaults);
  x.practice = Array.isArray(x.practice) ? x.practice : [];
  /* The tempo belongs to the piece: coming back to a score tomorrow and
     finding the metronome at somebody else's number is a small thing that
     happens every single time. The beats a bar are read off the notation and
     only stored so a piece can override a wrong reading. */
  x.metronome = Object.assign({bpm:90, perBar:null}, x.metronome || {});
  x.metronome.bpm = clamp(+x.metronome.bpm || 90, 20, 300);
  x.metronome.perBar = x.metronome.perBar == null ? null : clamp(+x.metronome.perBar, 1, 16);
  x.createdAt = x.createdAt || new Date().toISOString();
  x.lastOpened = x.lastOpened || null;
  return x;
}
function scoreSectionDefaults(s, score){
  s.id = s.id || uid();
  s.name = s.name || 'A section';
  s.startMeasure = Math.max(1, +s.startMeasure || 1);
  s.endMeasure = Math.max(s.startMeasure, +s.endMeasure || s.startMeasure);
  /* a range that runs off the end of the piece is a range nothing can be
     drawn for — clamp it to the notation that actually exists */
  const last = score && score.totalMeasures ? score.totalMeasures : s.endMeasure;
  s.startMeasure = Math.min(s.startMeasure, last);
  s.endMeasure = Math.min(s.endMeasure, last);
  s.color = SCORE_COLORS.some(c => c[0] === s.color) ? s.color : SCORE_COLORS[0][0];
  s.status = SCORE_STATUS.some(x => x[0] === s.status) ? s.status : 'not_started';
  s.notes = s.notes || '';
  /* Two tempos rather than one, because the useful number is the distance
     between them. A target alone is a wish; a target beside what you can
     actually hold today is a plan, and the gap closing is the only evidence
     that the slow practice is working. */
  s.targetTempo = +s.targetTempo || null;
  s.comfortTempo = +s.comfortTempo || null;
  s.lastPracticedDate = s.lastPracticedDate || null;
  s.practiceCount = +s.practiceCount || 0;
  s.createdAt = s.createdAt || new Date().toISOString();
  return s;
}
function scorePinDefaults(p){
  p.id = p.id || uid();
  p.measure = Math.max(1, +p.measure || 1);
  p.text = p.text || '';
  p.color = SCORE_COLORS.some(c => c[0] === p.color) ? p.color : SCORE_COLORS[0][0];
  p.createdAt = p.createdAt || new Date().toISOString();
  return p;
}
const scores = () => scoreState();
const scoreById = id => byId(scoreState(), id);
const scoreSection = (score, id) => byId(score.sections || [], id);

/* ---------- what it costs ----------
   Said out loud, in the room. A library that grows quietly until the browser
   refuses to save is the failure mode of every offline instrument, and the
   cure is not a limit — it is a number you can see before you hit one. */
const scoreWeight = x => (x.musicXml || '').length;
const scoreLibraryWeight = () => sum(scoreState().map(scoreWeight));
const scoreSaid = n => n < 1024 ? `${n} bytes`
  : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;
/* Browsers give an origin a few hundred megabytes and refuse without warning
   past it. Well before that, every save is rewriting the whole library, so the
   honest place to say something is much earlier than the hard limit. */
const SCORE_HEAVY = 6 * 1024 * 1024;
const scoreLibraryHeavy = () => scoreLibraryWeight() > SCORE_HEAVY;

/* ---------- adding one ---------- */
function addScore(fields){
  const x = scoreDefaults(Object.assign({id:uid(), createdAt:new Date().toISOString()}, fields));
  scoreState().push(x);
  saveNow();
  return x;
}
function removeScore(id){
  const gone = spliceOut(scoreState(), x => x.id === id);
  saveNow();
  return gone;
}

/* ---------- MusicXML, compressed and not ----------
   An .mxl is a zip with the score inside it and a container file pointing at
   which entry is the score. Reading one needs no library: the browser can
   inflate a raw deflate stream on its own, and the zip's own directory says
   where each entry begins. A plain .musicxml is text and needs none of this. */
const MXL_SIG = 0x04034b50;
async function readMusicXmlFile(file){
  const name = (file.name || '').toLowerCase();
  if(name.endsWith('.mxl')) return readCompressedMusicXml(await file.arrayBuffer());
  const text = await file.text();
  /* a .mxl renamed to .xml is still a zip, and a zip read as text is nonsense
     rather than an error — catch it by its signature rather than its name */
  if(text.charCodeAt(0) === 0x50 && text.charCodeAt(1) === 0x4b)
    return readCompressedMusicXml(await file.arrayBuffer());
  return text;
}
async function readCompressedMusicXml(buf){
  const entries = zipEntries(buf);
  if(!entries.length) throw new Error('that file is not a readable archive');
  /* the container names the real score; without one, the first .xml that is
     not the container and not Apple's metadata is the score */
  const container = entries.find(e => /^meta-inf\/container\.xml$/i.test(e.name));
  let want = null;
  if(container){
    const xml = new TextDecoder().decode(await zipRead(buf, container));
    const m = /full-path\s*=\s*"([^"]+)"/i.exec(xml);
    if(m) want = m[1];
  }
  const pick = (want && entries.find(e => e.name === want))
    || entries.find(e => /\.(musicxml|xml)$/i.test(e.name) && !/^meta-inf\//i.test(e.name));
  if(!pick) throw new Error('no score inside that archive');
  return new TextDecoder().decode(await zipRead(buf, pick));
}
/* Walk the local file headers. Enough of the format to find the entries and
   no more — this reads archives, it does not write them. */
function zipEntries(buf){
  const dv = new DataView(buf);
  const out = [];
  let at = 0;
  while(at + 30 <= dv.byteLength && dv.getUint32(at, true) === MXL_SIG){
    const method = dv.getUint16(at + 8, true);
    const packed = dv.getUint32(at + 18, true);
    const plain = dv.getUint32(at + 22, true);
    const nameLen = dv.getUint16(at + 26, true);
    const extraLen = dv.getUint16(at + 28, true);
    const name = new TextDecoder().decode(new Uint8Array(buf, at + 30, nameLen));
    const body = at + 30 + nameLen + extraLen;
    out.push({name, method, packed, plain, body});
    /* a streamed entry writes its sizes after the data rather than before it,
       and walking past one without them is walking into the middle of a file */
    if(!packed && (dv.getUint16(at + 6, true) & 0x08)) break;
    at = body + packed;
  }
  return out;
}
async function zipRead(buf, entry){
  const bytes = new Uint8Array(buf, entry.body, entry.packed);
  if(entry.method === 0) return bytes;
  if(entry.method !== 8) throw new Error('that archive uses a compression this cannot read');
  if(typeof DecompressionStream !== 'function')
    throw new Error('this browser cannot open a compressed score — export it as .musicxml instead');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
/* The title and composer off the file itself, so a score arrives named. A
   MusicXML carries both in its work and identification blocks; where it does
   not, the file name is a better guess than "Untitled". */
function musicXmlTitle(xml, fallback){
  const pick = re => { const m = re.exec(xml); return m ? m[1].replace(/<[^>]+>/g, '').trim() : ''; };
  const title = pick(/<work-title>([\s\S]*?)<\/work-title>/i)
    || pick(/<movement-title>([\s\S]*?)<\/movement-title>/i);
  const composer = pick(/<creator[^>]*type="composer"[^>]*>([\s\S]*?)<\/creator>/i)
    || pick(/<creator[^>]*>([\s\S]*?)<\/creator>/i);
  return {title: title || String(fallback || '').replace(/\.(musicxml|mxl|xml)$/i, '') || 'Untitled',
    composer};
}

/* ---------- sections ---------- */
function addScoreSection(scoreId, fields){
  const x = scoreById(scoreId); if(!x) return null;
  const s = scoreSectionDefaults(Object.assign({id:uid(), createdAt:new Date().toISOString()}, fields), x);
  x.sections.push(s);
  x.sections.sort((a, b) => a.startMeasure - b.startMeasure);
  saveNow();
  return s;
}
function removeScoreSection(scoreId, id){
  const x = scoreById(scoreId); if(!x) return;
  spliceOut(x.sections, s => s.id === id);
  saveNow();
}
/* Practising a section is the one thing that moves it: the count, the date,
   and the piece's own log all follow from it rather than being kept by hand. */
function logScorePractice(scoreId, sectionId, minutes, opts){
  const x = scoreById(scoreId); if(!x) return null;
  const s = sectionId ? scoreSection(x, sectionId) : null;
  const rec = {id:uid(), date:today(), sectionId: sectionId || null,
    minutes: Math.max(0, Math.round(+minutes || 0)), at:new Date().toISOString()};
  x.practice.push(rec);
  if(s){ s.practiceCount = (+s.practiceCount || 0) + 1; s.lastPracticedDate = today(); }
  if(s && opts && +opts.comfort > 0) s.comfortTempo = Math.round(+opts.comfort);
  /* minutes at the instrument are hours on the skill, if there is a skill to
     put them on. Nothing is invented — a skill that appears because you
     practised is a skill you did not choose to track. */
  if(rec.minutes) scoreCreditSkill(rec.minutes);
  saveNow();
  return rec;
}
function scoreCreditSkill(mins){
  const sk = (S.skills || []).find(s => !s.archived
    && /piano|music|keyboard|klavier/i.test((s.name || '') + ' ' + (s.cat || '')));
  if(!sk) return null;
  sk.hours = +(((+sk.hours || 0) + mins / 60).toFixed(2));
  sk.lastPracticed = today();
  return sk;
}
const scoreMinutesOn = (x, day) => sum((x.practice || []).filter(r => r.date === day).map(r => +r.minutes || 0));
/* which section a measure falls in, for the pin popover and the measure click */
function sectionAtMeasure(x, m){
  return (x.sections || []).find(s => m >= s.startMeasure && m <= s.endMeasure) || null;
}
/* What the weekly review wants to know. Silent for somebody who has never
   opened the room: a review that invents a line about a room you have never
   been in is a review you stop reading. */
function scoreReviewLines(from, to){
  if(!Array.isArray(S.scores) || !S.scores.length) return [];
  const out = [];
  const rows = S.scores.flatMap(x => (x.practice || []).filter(r => r.date >= from && r.date <= to));
  if(rows.length){
    const mins = sum(rows.map(r => +r.minutes || 0));
    out.push(`${rows.length} section${rows.length === 1 ? '' : 's'} practised at the score${
      mins ? `, ${fmtHM(mins)} in all` : ''}.`);
  }
  const all = S.scores.flatMap(x => (x.sections || []).map(s => ({s, x})));
  const cold = all.filter(({s}) => s.status !== 'polished' && s.status !== 'solid'
    && s.lastPracticedDate && daysBetween(s.lastPracticedDate, to) >= 21);
  if(cold.length) out.push(`${cold[0].s.name} in ${cold[0].x.title} has not been touched in three weeks.`);
  const untouched = all.filter(({s}) => !s.lastPracticedDate).length;
  if(untouched) out.push(`${untouched} section${untouched === 1 ? ' has' : 's have'} never been practised.`);
  return out;
}
