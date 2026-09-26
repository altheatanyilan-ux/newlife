/* Eight bars of a violin concerto, written for the orchestra claims
   (smoke259) and for listening: a solo violin in front of a classical
   orchestra — flute, oboe, clarinet, bassoon, horn, trumpet, timpani and
   the five string sections — in D major at ♩=96. It has what makes an
   orchestra sound played or not: held chords under a hairpin, a slurred
   run of sixteenths in the first violins, pizzicato in the lower strings
   and arco again, staccato winds, the dynamics from p to ff. Sounding
   pitch throughout (no transposing instruments), so every part is exactly
   the notes it plays. */
const STEP = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'], ALT = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
const pitch = m => `<pitch><step>${STEP[m % 12]}</step>${ALT[m % 12] ? '<alter>1</alter>' : ''}<octave>${Math.floor(m / 12) - 1}</octave></pitch>`;
const TYPE = {16: 'whole', 8: 'half', 4: 'quarter', 2: 'eighth', 1: '16th', 12: 'half', 6: 'quarter'};
/* a note: midi (null for a rest), length in sixteenths, and what is written on it */
const note = (m, len, o = {}) => {
  const nots = [];
  if(o.slur) nots.push(`<slur type="${o.slur}" number="1"/>`);
  if(o.stac) nots.push('<articulations><staccato/></articulations>');
  return `<note>${m == null ? '<rest/>' : pitch(m)}<duration>${len}</duration><voice>1</voice><type>${TYPE[len] || 'quarter'}</type>${
    len === 12 || len === 6 ? '<dot/>' : ''}${nots.length ? `<notations>${nots.join('')}</notations>` : ''}</note>`;
};
const chord = (ms, len) => ms.map((m, i) => i ? note(m, len).replace('<note>', '<note><chord/>') : note(m, len)).join('');
const dyn = d => !d ? '' : `<direction placement="below"><direction-type><dynamics><${d}/></dynamics></direction-type></direction>`;
const words = w => `<direction placement="above"><direction-type><words>${w}</words></direction-type></direction>`;
const wedge = t => `<direction placement="below"><direction-type><wedge type="${t}"/></direction-type></direction>`;
const G = '<clef><sign>G</sign><line>2</line></clef>', F = '<clef><sign>F</sign><line>4</line></clef>', C = '<clef><sign>C</sign><line>3</line></clef>';
const attrs = (clef, first) => `<attributes><divisions>4</divisions><key><fifths>2</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time>${clef}</attributes>`
  + (first ? '<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>96</per-minute></metronome></direction-type><sound tempo="96"/></direction>' : '');

/* the chords, bar by bar: D  G  A7  D  Bm  G  A  D */
const ROOT = [50, 43, 45, 50, 47, 43, 45, 50];
const TRIAD = [[62, 66, 69], [62, 67, 71], [61, 64, 67], [62, 66, 69], [62, 66, 71], [62, 67, 71], [61, 64, 69], [62, 66, 69]];
const run = [69, 71, 73, 74, 76, 78, 79, 81, 79, 78, 76, 74, 73, 71, 69, 67];

const PARTS = [
  ['P1', 'Solo Violin', 41, G, b => [
    dyn('mf') + note(74, 4, {slur: 'start'}) + note(76, 4) + note(78, 4) + note(81, 4, {slur: 'stop'}),
    note(83, 8) + note(81, 4) + note(79, 4),
    note(76, 2, {slur: 'start'}) + note(78, 2) + note(79, 2) + note(81, 2) + note(79, 2) + note(78, 2) + note(76, 2) + note(73, 2, {slur: 'stop'}),
    note(74, 16),
    dyn('p') + note(78, 6) + note(76, 2) + note(74, 8),
    note(71, 4) + note(74, 4) + note(79, 8),
    note(76, 4, {stac: 1}) + note(78, 4, {stac: 1}) + note(79, 4, {stac: 1}) + note(81, 4, {stac: 1}),
    dyn('f') + note(86, 16)][b]],
  ['P2', 'Flute', 74, G, b => [dyn('p') + note(81, 16), note(83, 16), note(81, 16), note(78, 16),
    note(null, 16), note(null, 16), dyn('mf') + note(81, 2, {stac: 1}) + note(83, 2, {stac: 1}) + note(85, 2, {stac: 1}) + note(86, 2, {stac: 1}) + note(88, 8), dyn('ff') + note(86, 16)][b]],
  ['P3', 'Oboe', 69, G, b => [dyn('p') + note(78, 16), note(79, 16), note(76, 16), note(78, 16), note(null, 16), note(null, 16), dyn('mf') + note(76, 16), dyn('ff') + note(78, 16)][b]],
  ['P4', 'Clarinet', 72, G, b => [dyn('p') + note(69, 16), note(71, 16), note(73, 16), note(69, 16), note(71, 8) + note(74, 8), note(71, 16), dyn('mf') + note(73, 16), dyn('ff') + note(74, 16)][b]],
  ['P5', 'Bassoon', 71, F, b => [dyn('p') + note(50, 16), note(43, 16), note(45, 16), note(50, 16), note(47, 16), note(43, 16), dyn('mf') + note(45, 16), dyn('ff') + note(38, 16)][b]],
  ['P6', 'Horn in F', 61, F, b => [dyn('p') + wedge('crescendo') + note(57, 16), note(59, 16), note(57, 16), wedge('stop') + dyn('f') + note(57, 16),
    dyn('mp') + note(54, 16), note(55, 16), wedge('crescendo') + note(57, 16), wedge('stop') + dyn('ff') + note(57, 16)][b]],
  ['P7', 'Trumpet', 57, G, b => [note(null, 16), note(null, 16), note(null, 16),
    dyn('f') + note(69, 2, {stac: 1}) + note(69, 2, {stac: 1}) + note(74, 12), note(null, 16), note(null, 16), note(null, 16),
    dyn('ff') + note(69, 2, {stac: 1}) + note(69, 2, {stac: 1}) + note(74, 12)][b]],
  ['P8', 'Timpani', 48, F, b => [note(null, 16), note(null, 16), note(null, 16), dyn('f') + note(45, 4) + note(50, 4) + note(50, 8),
    note(null, 16), note(null, 16), note(null, 16), dyn('ff') + note(45, 4) + note(50, 4) + note(50, 8)][b]],
  ['P9', 'Violin I', 41, G, b => [dyn('p') + wedge('crescendo') + note(TRIAD[0][2] + 12, 16), note(TRIAD[1][2] + 12, 16),
    run.map((m, i) => note(m, 1, {slur: i === 0 ? 'start' : i === 15 ? 'stop' : null})).join(''), wedge('stop') + dyn('f') + note(81, 16),
    dyn('mp') + note(78, 4, {stac: 1}) + note(78, 4, {stac: 1}) + note(83, 4, {stac: 1}) + note(83, 4, {stac: 1}),
    note(79, 4, {stac: 1}) + note(79, 4, {stac: 1}) + note(83, 4, {stac: 1}) + note(83, 4, {stac: 1}),
    wedge('crescendo') + [81, 83, 85, 86, 88, 86, 85, 83, 81, 79, 78, 76, 73, 74, 76, 78].map(m => note(m, 1)).join(''), wedge('stop') + dyn('ff') + note(86, 16)][b]],
  ['P10', 'Violin II', 41, G, b => dyn(b === 0 ? 'p' : b === 3 ? 'f' : b === 4 ? 'mp' : b === 7 ? 'ff' : '') + note(TRIAD[b][1] + 12, 16)],
  ['P11', 'Viola', 42, C, b => (b === 0 ? dyn('p') : b === 4 ? dyn('mp') + words('pizz.') : b === 6 ? words('arco') + dyn('mf') : b === 7 ? dyn('ff') : '')
    + (b === 4 || b === 5 ? note(TRIAD[b][0], 4) + note(null, 4) + note(TRIAD[b][0], 4) + note(null, 4) : note(TRIAD[b][0], 16))],
  ['P12', 'Violoncello', 43, F, b => (b === 0 ? dyn('p') : b === 4 ? dyn('mp') + words('pizz.') : b === 6 ? words('arco') + dyn('mf') : b === 7 ? dyn('ff') : '')
    + (b === 4 || b === 5 ? note(ROOT[b], 4) + note(null, 4) + note(ROOT[b] + 7, 4) + note(null, 4) : note(ROOT[b], 8) + note(ROOT[b] + 7, 8))],
  ['P13', 'Contrabass', 44, F, b => (b === 0 ? dyn('p') : b === 4 ? dyn('mp') + words('pizz.') : b === 6 ? words('arco') + dyn('mf') : b === 7 ? dyn('ff') : '')
    + (b === 4 || b === 5 ? note(ROOT[b] - 12, 4) + note(null, 12) : note(ROOT[b] - 12, 16))],
];

function concertoExcerpt(){
  const list = PARTS.map(([id, name, prog]) => `<score-part id="${id}"><part-name>${name}</part-name><score-instrument id="${id}-I1"><instrument-name>${name}</instrument-name></score-instrument>`
    + `<midi-instrument id="${id}-I1"><midi-channel>${(+id.slice(1)) >= 10 ? +id.slice(1) + 1 : +id.slice(1)}</midi-channel><midi-program>${prog}</midi-program></midi-instrument></score-part>`).join('');
  const body = PARTS.map(([id, name, prog, clef, bar]) => `<part id="${id}">${[...Array(8)].map((_, b) =>
    `<measure number="${b + 1}">${b === 0 ? attrs(clef, id === 'P1') : ''}${bar(b)}</measure>`).join('')}</part>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Concerto (excerpt)</work-title></work><part-list>${list}</part-list>${body}</score-partwise>`;
}
module.exports = {concertoExcerpt};
