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

/* The layers that can sit over the notation, each with its own ink so two of
   them at once are still tellable apart, and each a different distance from
   the staff so they do not land on each other. */
const SCORE_OVERLAYS = [
  ['names',      'Note names',    'the letter of each note',              '#7f916a'],
  ['degrees',    'Scale degrees', 'where each note sits in the key',      '#5c7c8a'],
  ['chords',     'Chords',        'the harmony under each beat',          '#b0705e'],
  ['beats',      'Beat counts',   'what to count under the bar',          '#8a7f9e'],
  ['fingerings', 'Fingerings',    'yours \u2014 with it on, a press on a note sets one', '#a0727e']];
/* Degrees of the scale, and the spelling a musician would use for the notes
   between them. */
const SCALE_DEGREES = ['1','♭2','2','♭3','3','4','♯4','5','♭6','6','♭7','7'];

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
/* How a sitting went. Not the same vocabulary as a section's standing: that
   is where the passage is after weeks, this is how the last twenty-five
   minutes felt, and conflating them loses the only thing a practice journal
   is for — noticing that three rough days in a row means something is wrong
   with how you are practising it rather than with the passage. */
const SCORE_QUALITY = [
  ['rough',     'Rough'],
  ['shaky',     'Shaky'],
  ['improving', 'Improving'],
  ['solid',     'Solid'],
  ['flowing',   'Flowing']];
const scoreQualityName = k => (SCORE_QUALITY.find(q => q[0] === k) || [, '\u2014'])[1];
const scoreQualityAt = k => SCORE_QUALITY.findIndex(q => q[0] === k);
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
/* ---------- what a piece IS, as against how it is going ----------
   The shelf and the standing answer "how far have I got". These answer "what
   is it" — the question you ask when you are choosing what to pick up, and
   the one the file cannot answer, because MusicXML carries a title and a
   composer and nothing else. A period is not decoration: practising four
   Romantic pieces and no counterpoint for three months is a thing you cannot
   see until the shelf can be asked. */
/* ---------- how well you know a piece ----------
   This is yours to say, and it is deliberately not the same question as the
   one the sections answer. A section's standing is about a passage you have
   marked up and worked on; this is about your relationship with the whole
   piece over years, and the two genuinely differ — a piece can have no
   sections marked at all and still be one you could play tomorrow, and a
   piece can be marked up in detail precisely because it is the one you
   cannot play.

   The last two are not further along the ladder; they are off it. Rusty is
   not a stage between learning and ready, it is having been ready and lost
   it, which is a different problem with a different cure: the notes are
   still in your head and the hands have forgotten, so what it needs is
   slow playing rather than learning. Put down is a decision rather than a
   condition. Both are how musicians actually talk about pieces, and a list
   that only went up would have nowhere to put either. */
const SCORE_FAMILIAR = [
  ['unplayed', 'Not played',        'on the shelf, not opened at the piano', '#8a8d8f'],
  ['read',     'Sight-read',        'played through, nothing learnt yet',    '#8a7f9e'],
  ['learning', 'Learning',          'working through it now, not whole yet', '#b0705e'],
  ['fingers',  'Under the fingers', 'can play it through, roughly',          '#c47832'],
  ['polish',   'Needs polish',      'all there, and not ready to be heard',  '#c9a96e'],
  ['ready',    'Performance ready', 'holds together with somebody listening','#7f916a'],
  ['rusty',    'Rusty',             'learnt once, and the hands have forgotten', '#5c7c8a'],
  ['retired',  'Put down',          'played properly once, and not coming back for now', '#7a7a7a'],
];
const scoreFamiliarOf = x => (SCORE_FAMILIAR.find(v => v[0] === (x && x.familiar)) || SCORE_FAMILIAR[0]);
const scoreFamiliarName = k => (SCORE_FAMILIAR.find(v => v[0] === k) || SCORE_FAMILIAR[0])[1];
/* Where it sits on the ladder, for sorting. The two that are off the ladder
   are put at the end rather than given a false rung. */
const scoreFamiliarAt = k => { const i = SCORE_FAMILIAR.findIndex(v => v[0] === k);
  return i < 0 ? 0 : i; };
/* What the record says about what you said. Not a correction — you know
   whether you can play it and this room does not — but a piece you called
   performance ready and have not touched since the spring is the honest
   definition of one that has gone rusty, and saying so is the only use a
   practice log has that a diary does not. */
const SCORE_STALE_AFTER = 90;
function scoreFamiliarDoubt(x){
  const last = scoreLastPractised(x);
  const at = scoreFamiliarAt(x.familiar);
  if(!last) return at >= 4 ? 'never practised in this room, so nothing here can vouch for it' : '';
  const days = daysSince(last);
  if(at >= 5 && x.familiar !== 'rusty' && days > SCORE_STALE_AFTER)
    return `called ${scoreFamiliarName(x.familiar).toLowerCase()}, not practised in ${Math.round(days / 30)} months`;
  if(x.familiar === 'rusty' && days <= 21) return 'called rusty, and you have been at it this month';
  return '';
}

const SCORE_PERIODS = [
  ['medieval',     'Medieval'],
  ['renaissance',  'Renaissance'],
  ['baroque',      'Baroque'],
  ['classical',    'Classical'],
  ['romantic',     'Romantic'],
  ['impressionist','Impressionist'],
  ['modern',       'Modern'],
  ['contemporary', 'Contemporary'],
  ['jazz',         'Jazz'],
  ['traditional',  'Folk and traditional'],
  ['screen',       'Film and game'],
  ['other',        'Something else']];
const scorePeriodName = k => (SCORE_PERIODS.find(v => v[0] === k) || [,''])[1];
/* A first guess from the composer's name, for the hundred or so names that
   account for most of what anybody imports. It is a guess and says so: the
   period is stored only once you have looked at it, so a wrong guess is never
   silently written down as a fact. */
const SCORE_PERIOD_BY_NAME = [
  [/machaut|hildegard|perotin|landini/i, 'medieval'],
  [/palestrina|byrd|tallis|josquin|dowland|gesualdo|victoria|monteverdi/i, 'renaissance'],
  [/bach|handel|h(ä|ae)ndel|vivaldi|scarlatti|telemann|purcell|rameau|couperin|corelli|albinoni|pachelbel|buxtehude/i, 'baroque'],
  [/mozart|haydn|clementi|salieri|boccherini|czerny|kuhlau|diabelli|burgm(ü|ue)ller/i, 'classical'],
  [/beethoven|schubert|chopin|schumann|brahms|liszt|mendelssohn|tchaikovsky|grieg|dvo(ř|r)(á|a)k|rachmanin|wagner|verdi|paganini|rossini|bruckner|mahler|franck|faur(é|e)|saint-sa(ë|e)ns|bizet|borodin|mussorgsky|rimsky|sibelius|elgar|albéniz|albeniz|granados|smetana|field|alkan|moszkowski|scriabin/i, 'romantic'],
  [/debussy|ravel|satie|delius|respighi|griffes/i, 'impressionist'],
  [/bart(ó|o)k|stravinsky|prokofiev|shostakovich|hindemith|schoenberg|sch(ö|oe)nberg|berg|webern|poulenc|milhaud|gershwin|copland|villa-lobos|janáček|janacek|kod(á|a)ly|ives|britten|barber|messiaen|piazzolla/i, 'modern'],
  [/glass|reich|p(ä|ae)rt|adams|ligeti|takemitsu|gubaidulina|kapustin|einaudi|yiruma|sakamoto|richter|(ó|o)lafur|arnalds/i, 'contemporary'],
  [/ellington|monk|parker|coltrane|evans|peterson|brubeck|jobim|hancock|corea|tatum|powell|garner|silver|mingus|shorter|joplin/i, 'jazz'],
  [/williams|zimmer|shore|elfman|morricone|hisaishi|uematsu|shimomura|kondo|desplat|g(ó|o)ransson/i, 'screen']];
function scorePeriodGuess(composer){
  const n = String(composer || '').trim();
  if(!n) return null;
  const hit = SCORE_PERIOD_BY_NAME.find(([re]) => re.test(n));
  return hit ? hit[1] : null;
}
/* What the room will show for a piece: what you said, or failing that what it
   guessed. The two are kept apart so the inventory can say which it is. */
const scorePeriodOf = x => x && x.period ? x.period : scorePeriodGuess(x && x.composer);

function scoreDefaults(x){
  x.id = x.id || uid();
  x.title = x.title || 'Untitled';
  x.composer = x.composer || '';
  /* Null until you say so, which is different from 'other': null means nobody
     has decided and the guess stands, 'other' means you looked and none of
     them fitted. */
  x.period = SCORE_PERIODS.some(v => v[0] === x.period) ? x.period : null;
  /* How well you know it, said by you. Nothing in the room writes this: it
     is the one thing here only the person at the piano can know. */
  x.familiar = SCORE_FAMILIAR.some(v => v[0] === x.familiar) ? x.familiar : 'unplayed';
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
  /* How far the piece is moved, in semitones. It belongs to the score rather
     than to the room because it is a property of how you are working on this
     piece this month — singing it down a third, reading it up a tone — and it
     should still be there tomorrow. The file itself is never touched. */
  x.transpose = clamp(Math.round(+x.transpose || 0), -12, 12);
  /* How you last had it played to you: the tempo, the loop, the count-in,
     which hands you were hearing (19-score-play.js). */
  x.playback = x.playback && typeof x.playback === 'object' ? x.playback : {};
  /* Chord symbols you have written over the room's reading. Keyed by bar and
     beat, so they stay put through a transposition, a re-engraving or a
     change of how many bars go on a line. An empty string is "say nothing
     here", which is different from having no opinion. */
  x.chordOverrides = (x.chordOverrides && typeof x.chordOverrides === 'object') ? x.chordOverrides : {};
  /* Fingerings, keyed by bar, beat, staff and place in the chord. An object
     rather than a list because every redraw looks up every note and a list
     would be a scan per note head; the data is the same either way. */
  x.fingerings = (x.fingerings && typeof x.fingerings === 'object' && !Array.isArray(x.fingerings))
    ? x.fingerings : {};
  x.sections = Array.isArray(x.sections) ? x.sections : [];
  x.sections.forEach(s => scoreSectionDefaults(s, x));
  x.pins = Array.isArray(x.pins) ? x.pins : [];
  x.pins.forEach(scorePinDefaults);
  x.practice = Array.isArray(x.practice) ? x.practice : [];
  x.practice.forEach(scorePracticeDefaults);
  /* The tempo belongs to the piece: coming back to a score tomorrow and
     finding the metronome at somebody else's number is a small thing that
     happens every single time. The beats a bar are read off the notation and
     only stored so a piece can override a wrong reading. */
  /* Which of the layers over the notation are on. All off to begin with: the
     notation is the thing, and every layer over it is a crutch you should be
     able to put down. */
  x.overlays = Object.assign({names:false, degrees:false, beats:false, chords:false,
    fingerings:true}, x.overlays || {});
  x.metronome = Object.assign({bpm:90, perBar:null, accent:true}, x.metronome || {});
  /* whether beat 1 is heard differently from the rest: on unless you say
     otherwise, and it governs every click the piece gets — the metronome,
     and the play bar's click and count-in */
  x.metronome.accent = x.metronome.accent !== false;
  x.metronome.bpm = clamp(+x.metronome.bpm || 90, 20, 300);
  x.metronome.perBar = x.metronome.perBar == null ? null : clamp(+x.metronome.perBar, 1, 16);
  x.createdAt = x.createdAt || new Date().toISOString();
  x.lastOpened = x.lastOpened || null;
  /* who plays what when the room plays along (19-score-ensemble.js) */
  if(typeof ensembleDefaults === 'function') ensembleDefaults(x);
  /* the recordings synced to it (19-sync-d-page.js) */
  if(typeof syncRecDefaults === 'function') syncRecDefaults(x);
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
/* A sitting at the piano. The old rows named one section and nothing else;
   the new ones name what you worked on, what you were after, how fast you got
   it and what you found out — which is the difference between a log that
   tells you that you practised and one that tells you what happened. */
function scorePracticeDefaults(r){
  r.id = r.id || uid();
  r.date = r.date || today();
  r.minutes = Math.max(0, Math.round(+r.minutes || 0));
  /* one section became several, and the old rows still have to read */
  r.sections = Array.isArray(r.sections) ? r.sections : (r.sectionId ? [r.sectionId] : []);
  r.sectionId = r.sections[0] || null;
  r.focus = r.focus || '';
  r.tempo = +r.tempo || null;
  r.quality = SCORE_QUALITY.some(q => q[0] === r.quality) ? r.quality : null;
  r.discoveries = r.discoveries || '';
  /* a sitting with the room playing the other part: whether, how fast as a
     share of the score's tempo, how loud your own guide was by the end, and
     how many times round. Absent on the sittings from before there was a
     partner to play with. */
  r.withPartnerPlayback = !!r.withPartnerPlayback;
  r.tempoPercent = +r.tempoPercent > 0 ? Math.round(+r.tempoPercent) : null;
  r.finalGuideLevel = r.finalGuideLevel == null || r.finalGuideLevel === '' || !isFinite(+r.finalGuideLevel)
    ? null : clamp(+r.finalGuideLevel, 0, 1);
  r.loopsCompleted = r.loopsCompleted == null || r.loopsCompleted === '' || !isFinite(+r.loopsCompleted)
    ? null : Math.max(0, Math.round(+r.loopsCompleted));
  r.at = r.at || new Date().toISOString();
  return r;
}
function scorePinDefaults(p){
  p.id = p.id || uid();
  p.measure = Math.max(1, +p.measure || 1);
  p.text = p.text || '';
  p.color = SCORE_COLORS.some(c => c[0] === p.color) ? p.color : SCORE_COLORS[0][0];
  /* A pin that is also an unwritten rule keeps the rule's id, so the bar and
     the library know about each other. It stays a pin either way: being true
     of every piece does not make it less true of this bar. */
  p.ruleId = p.ruleId || null;
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
  /* its recordings go with it (they were only ever copies kept for this
     piece) — once the undo has run out, not before */
  const keep = typeof syncDropScoreAudio === 'function' ? syncDropScoreAudio(id) : () => {};
  const gone = spliceOut(scoreState(), x => x.id === id);
  saveNow();
  return () => { keep(); gone(); };
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
  const o = opts || {};
  const ids = (Array.isArray(o.sections) && o.sections.length) ? o.sections.slice()
    : (sectionId ? [sectionId] : []);
  const s = sectionId ? scoreSection(x, sectionId) : null;
  const rec = scorePracticeDefaults({sections: ids, minutes,
    focus: o.focus, tempo: o.tempo, quality: o.quality, discoveries: o.discoveries,
    withPartnerPlayback: o.withPartnerPlayback, tempoPercent: o.tempoPercent,
    finalGuideLevel: o.finalGuideLevel, loopsCompleted: o.loopsCompleted});
  x.practice.push(rec);
  ids.forEach(id => { const sec = scoreSection(x, id); if(!sec) return;
    sec.practiceCount = (+sec.practiceCount || 0) + 1; sec.lastPracticedDate = today(); });
  if(s && +o.comfort > 0) s.comfortTempo = Math.round(+o.comfort);
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

/* ---------- the notebook ----------
   What the log adds up to. The two numbers worth drawing are the tempo over
   time — the only hard evidence that slow practice is working — and how the
   sittings are spread across the sections, because the thing a practice log
   reveals that nothing else does is the section you have been quietly
   avoiding for a month. */
const scorePracticeOf = (x, sectionId) =>
  (x.practice || []).filter(r => (r.sections || []).includes(sectionId));
/* the fastest a section has been logged at, which is a fact about the log
   rather than a number kept by hand and left stale */
function scoreSectionBest(x, sectionId){
  const t = scorePracticeOf(x, sectionId).map(r => +r.tempo || 0).filter(Boolean);
  return t.length ? Math.max(...t) : null;
}
function scoreNotebook(x){
  const rows = (x.practice || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const old = rows.slice().reverse();
  const tempos = old.filter(r => r.tempo);
  const graded = old.filter(r => r.quality);
  const last10 = graded.slice(-10);
  const targets = (x.sections || []).map(s => +s.targetTempo || 0).filter(Boolean);
  return {
    rows,
    sessions: rows.length,
    minutes: sum(rows.map(r => +r.minutes || 0)),
    tempos: tempos.map(r => ({date: r.date, tempo: r.tempo, partner: !!r.withPartnerPlayback})),
    from: tempos.length ? tempos[0].tempo : null,
    to: tempos.length ? tempos[tempos.length - 1].tempo : null,
    best: tempos.length ? Math.max(...tempos.map(r => r.tempo)) : null,
    target: targets.length ? Math.max(...targets) : null,
    /* the average of the last ten, because one bad day is not a trend and a
       lifetime average stops moving after a month */
    mood: last10.length ? last10.reduce((a, r) => a + scoreQualityAt(r.quality), 0) / last10.length : null,
    heat: (x.sections || []).map(s => ({section: s, sessions: scorePracticeOf(x, s.id).length,
      minutes: sum(scorePracticeOf(x, s.id).map(r => +r.minutes || 0)),
      best: scoreSectionBest(x, s.id)})),
  };
}
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
