/* ============================================================
   WHERE TO GO AND LOOK IT UP.

   This room's whole claim on your time is that the exercises are somebody's
   teaching rather than somebody's invention. That claim is worth nothing
   unless you can check it, and you cannot check it against "Siskind, Book 1,
   p.36" when the notation you are looking at is on page 37 and the exercise
   it belongs to runs from 37 to 40.

   So every exercise carries a citation you could hand to a librarian: the
   book, its full title, the unit, the page range where the notation actually
   appears, and a sentence saying what to look for when you get there — which
   is the part that turns a page number into something usable, because a page
   of a jazz method has four things on it and only one of them is the
   exercise.

   THE IDS IN THE SOURCE TABLE AND THE IDS IN THIS CATALOGUE HAVE DRIFTED
   APART, so nothing here is mapped by number. The table's 2.2 is the
   whole-step descents, which are 2.4a and 2.4b here; its 2.3 is the shell
   voicings, which are 2.2; its 2.4 is the minor two-five-one, which is four
   entries. Mapping those by id would have put a page number about shell
   voicings on the descents and nobody would have noticed until they opened
   the book. Each one below is matched by what the exercise IS.

   AND THE ACCURACY COLUMN IS NOT COPIED. The table was written before the
   corrections and marks things approximate that have since been checked note
   by note against the printed notation. The accuracy each exercise carries
   is its own, in the catalogue, where the corrections put it. A citation
   says where to look; it does not get to say how far the notes are trusted.
   ============================================================ */

const JAZZ_BOOKS = {
  'Siskind Book 1': 'Jazz Piano Fundamentals, Book 1',
  'Siskind Book 2': 'Jazz Piano Fundamentals, Book 2',
  'Siskind Book 3': 'Jazz Piano Fundamentals, Book 3',
  'Levine': 'The Jazz Theory Book',
  'Mantooth': 'Voicings for Jazz Keyboard',
  'Berklee Harmony': 'The Berklee Book of Jazz Harmony',
  'Stoloff': 'Scat! Vocal Improvisation Techniques',
  'Weir': 'The Jazz Singer’s Handbook',
  'Design Doc': 'Jazz Practice Studio — design notes'
};

/* [book, chapter, pages, what to look for when you get there] */
const JAZZ_REFERENCES = {
  /* ---- P0: this stage is the studio's own, not a book's ---- */
  'P0.*': ['Design Doc', 'Stage P0', '—',
    'Stage P0 is this studio’s own addition rather than a chapter of anybody’s book: the twelve distances, drilled from every root, before the chord work in Siskind Book 1 Unit 1 begins.'],

  /* ---- Stage 1: chord construction ---- */
  '1.1': ['Siskind Book 1', 'Unit 1', 'pp.14–17',
    '"Three Ways to Find It", then the chart of every major seventh chord in root position.'],
  '1.2': ['Siskind Book 1', 'Unit 1', 'pp.15–16',
    'The dominant chart — "not quite as resolved… wants to go somewhere".'],
  '1.3': ['Siskind Book 1', 'Unit 1', 'pp.16–17',
    'The minor chart — "a little ambivalent or undecided".'],
  '1.4': ['Siskind Book 1', 'Unit 1', 'p.17',
    'The half-diminished formula, at the foot of the page under the three basic types \u2014 a minor seventh with its fifth lowered.'],
  '1.5': ['Siskind Book 1', 'Unit 1', 'p.17',
    'The diminished seventh formula, printed beside the half-diminished so the one flattened note between them is visible.'],

  /* ---- Stage 2: the two-five-one ---- */
  '2.1': ['Siskind Book 1', 'Unit 3', 'p.37',
    'Bass clef, whole-note chords: ii-V-I in C, F and B♭, root position and second inversion printed side by side.'],
  '2.1b': ['Siskind Book 1', 'Unit 3', 'p.37',
    'The right-hand column of the same page: every chord with its fifth on the bottom.'],
  '2.1c': ['Siskind Book 1', 'Unit 3', 'p.37',
    'The instruction under the two columns: "either the bottom two notes move and the top two notes hold or the top two notes move and the bottom two hold". Play across the two columns, not down them.'],
  '2.2': ['Siskind Book 1', 'Unit 3', 'p.42',
    'The shell chords — third and seventh only — under Coordination Exercise 3.'],
  '2.3': ['Siskind Book 2', 'Unit 3', 'pp.44–51',
    'The minor two-five-one, introduced before the three formulas that follow it.'],
  '2.3b': ['Siskind Book 2', 'Unit 3', 'pp.49–51',
    'Formula HN, the higher ninth, written out in full for four-note and five-note versions. This is the one with printed notation for every chord.'],
  '2.3c': ['Siskind Book 2', 'Unit 3', 'pp.49–51',
    'Formula LN, the lower ninth, with the natural fifth on the V and a minor-major seventh tonic. Read the voicing charts rather than the prose — this is the one worth checking against what this room draws.'],
  '2.3d': ['Siskind Book 2', 'Unit 3', 'pp.49–51',
    'Formula R, where the root takes the ninth’s place on the half-diminished chord. Again, the charts rather than the prose.'],
  '2.4a': ['Siskind Book 1', 'Unit 3', 'pp.39–40',
    'Two full pages of descents. Set A is C→B♭→A♭→G♭→E→D, written as one continuous exercise, with the transformation at each join marked.'],
  '2.4b': ['Siskind Book 1', 'Unit 3', 'pp.39–40',
    'Set B on the same two pages: D♭→B→A→G→F→E♭. It is printed below Set A and almost everybody stops before it.'],

  /* ---- Stage 3: Type A/B ---- */
  '3.1': ['Siskind Book 1', 'Unit 6', 'pp.86–91',
    'The formulas are on p.86 (Type A = 3, 7, 9, 5; Type B = 7, 3, 5, 9), the written-out voicings on pp.87–88, and the twelve-key exercises on pp.89–91. The register rule — lowest note between the C below middle C and middle C — is on p.89.'],
  '3.2': ['Siskind Book 1', 'Unit 6', 'pp.91–93',
    'The same exercises beginning on Type B: Sets C and D.'],
  '3.3': ['Siskind Book 1', 'Unit 6', 'p.94',
    'The diminished seventh with Type A and Type B shown together.'],

  /* ---- Stage 4: one hand, and a bass ---- */
  '4.1a': ['Siskind Book 1', 'Unit 8', 'pp.118–122',
    'The three-note formulas on p.118 (Type A = 3rd, 7th, 9th), then the twelve-key exercises, Sets A to D, on pp.119–122.'],
  '4.1b': ['Siskind Book 1', 'Unit 8', 'pp.118–122',
    'The same pages, reading the Type B column: 7th, 3rd, 5th. Sets C and D of the twelve-key exercises begin on this shape.'],
  '4.1c': ['Siskind Book 1', 'Unit 8', 'pp.123–130',
    '"Blues for Sammie", written out in full: one-handed voicings in the right hand and a bass in two in the left, on a grand staff. This is the exercise both halves exist for.'],
  '4.2': ['Siskind Book 1', 'Unit 8', 'pp.115–116',
    'The three bass formulas — root and fifth, root and third, root and a chromatic neighbour of the next root — with the note about playing them an octave lower than written and about the lowest string of the bass being the lowest E on the piano.'],

  /* ---- Stage 5: the blues ---- */
  '5.1': ['Siskind Book 1', 'Unit 7', 'pp.101–103',
    'The twelve-bar jazz blues in C, and the AAB phrase structure that goes with it.'],
  '5.1b': ['Siskind Book 1', 'Unit 7', 'pp.103–105',
    'The blues with Type A/B voicings, and the ii-V exercises that lead into it.'],
  '5.2': ['Siskind Book 1', 'Unit 7', 'pp.101–102',
    'The "minor" blues scale — root, ♭3, 4, ♯4, 5, ♭7 — printed beside the sweet scale.'],
  '5.3': ['Siskind Book 1', 'Unit 7', 'pp.101–102',
    'The "major" or sweet scale — root, 2, ♭3, 3, 5, 6 — on the same page as the blues scale.'],

  /* ---- Stage 6: licks ---- */
  '6.1': ['Siskind Book 1', 'Unit 3', 'pp.43–44',
    'Short-form lick. Treble clef, a single melodic line over Dm7–G7–Cmaj7, with the articulation version and the scat syllables on p.44. The scale degrees are labelled "3rd, 5th, 7th, 2nd/9th".'],
  '6.2': ['Siskind Book 1', 'Unit 4', 'p.57',
    'Long-form lick, "designed to remind you of the parent scale for a ii-V-I progression".'],
  '6.3': ['Siskind Book 1', 'Unit 5', 'p.61',
    'Short-form. "Notice the interesting shape created by the leap on the ‘and of three’."'],
  '6.4': ['Siskind Book 1', 'Unit 6', 'pp.84–85',
    'Long-form, first two measures. "Designed to practice a 3-5-7-9 arpeggio, a turn, and a fingering maneuver." Printed in C, B♭ and D♭, with the cross-over fingering marked.'],
  '6.5': ['Siskind Book 1', 'Unit 7', 'p.102',
    'Blues style. "Double notes and turns are typical in the blues style." Uses the sweet scale; fingering given for C.'],
  '6.6': ['Siskind Book 1', 'Unit 8', 'p.114',
    '"Written to fit with the V chord of a long-form ii-V-I." Sweet scale, borrowing the fourth from the blues scale.'],
  '6.7': ['Siskind Book 1', 'Unit 9', 'p.136',
    'Short-form. "Designed to solidify the work you did with arpeggios." The thirteenth substitutes for the fifth on the dominant; cross-over fingering in three keys.'],
  '6.8': ['Siskind Book 1', 'Unit 10', 'p.153',
    'Short-form. A variation on Lick 7 with altered tones on the V chord.'],
  '6.9': ['Siskind Book 1', 'Unit 11', 'p.168',
    'In the "More Altered Dominants" material.'],
  '6.10': ['Siskind Book 1', 'Unit 12', 'p.185',
    'In the "Improvising with Alternate Dominants" material.'],
  '6.11': ['Siskind Book 1', 'Unit 6', 'pp.82–84',
    '"The most common arpeggio in jazz starts on the third." Written out for a ii-V-I in F: Gm7–C7–Fmaj7.'],
  '6.12': ['Siskind Book 1', 'Unit 3', 'p.42',
    'Coordination Exercise 3: swung eighths in the right hand over shell chords in the left, under a Charleston rhythm.'],

  /* ---- Stage 7: altered dominants ---- */
  '7.1a': ['Siskind Book 1', 'Unit 10', 'pp.154–158',
    'The flat nine replacing the natural ninth in Type A and Type B, with the written practice on p.157 and the twelve-key ii-V-I on p.158.'],
  '7.1b': ['Siskind Book 1', 'Unit 10', 'pp.154–158',
    'The same pages, reading the Type B column \u2014 where the flat nine is the TOP note rather than the third from the bottom, which is the thing to check.'],
  '7.1c': ['Siskind Book 1', 'Unit 10', 'pp.155–159',
    'The flat thirteen replacing the natural fifth, and the ii-V-I exercise on pp.158–159.'],
  '7.2': ['Siskind Book 1', 'Unit 11', 'pp.170–173',
    'Dm7–D♭7–Cmaj7, in both the two-handed and the one-hand-and-bass versions, with the instruction that "the smoothest voice leading is created by using three consecutive voicings of the SAME type".'],
  '7.3': ['Siskind Book 1', 'Unit 11', 'pp.168–173',
    'The altered scale under the altered dominants. Levine’s fuller treatment is in The Jazz Theory Book, Ch.5, pp.55–80, as the seventh mode of melodic minor.'],
  '7.4': ['Siskind Book 1', 'Unit 11', 'p.173',
    'Alterations combined, immediately before the resolution example.'],
  '7.5': ['Siskind Book 1', 'Unit 11', 'p.173',
    'G7alt→Cmaj7, where every altered note resolves stepwise into a five-note tonic chord with the thirteenth in it.'],

  /* ---- Stage 8: modal ---- */
  '8.1': ['Siskind Book 3', 'Unit 1', 'pp.9–10',
    'All seven modes with the suggested fingerings.'],
  '8.2': ['Siskind Book 3', 'Unit 1', 'pp.9–10',
    'The drone exercises beside the mode fingerings. The practice instruction — "select two different three-note modal voicings each day, practice playing each up and down all twelve major scales" — is on pp.24–25.'],
  '8.3a': ['Siskind Book 3', 'Unit 3', 'pp.66–72',
    'The P4-P4-P4-M3 voicing, with the written examples for many chord types collected on p.72. The warning about the voicings on the third and sixth degrees containing minor ninths is in the same unit.'],
  '8.3b': ['Siskind Book 3', 'Unit 3', 'pp.66–72',
    'Three-note quartal voicings among the stacked-fourth examples; the specific ones are on p.72.'],
  '8.3c': ['Siskind Book 3', 'Unit 3', 'pp.66–72',
    'Five-note quartal voicings, on the same pages.'],
  '8.3d': ['Siskind Book 3', 'Unit 3', 'pp.70–72',
    'Cluster voicings — mixed seconds and thirds — printed after the quartals.'],
  '8.4': ['Siskind Book 3', 'Unit 4', 'pp.80–88',
    'Triads placed above a bass note to make extended harmony.'],
  '8.5': ['Siskind Book 3', 'Unit 5', 'pp.92–104',
    'The pentatonics for each chord type, including the melodic minor, dominant and flat-sixth pentatonics.'],
  '8.6': ['Siskind Book 3', 'Unit 5', 'pp.92–104',
    'The voicings built from those pentatonics, later in the same unit.'],
  '8.7a': ['Siskind Book 3', 'Unit 9', 'pp.192–193',
    'Seven quartal formulas for a tonal ii-V-I. Formula 1 is the first of them, written for Cm7–F7–B♭maj7.'],
  '8.7b': ['Siskind Book 3', 'Unit 9', 'pp.192–193',
    'Formula 2, directly beneath Formula 1 on the same page.'],
  '8.8a': ['Siskind Book 3', 'Unit 10', 'pp.217–221',
    'Four quartal formulas for the minor ii-V-i. This is Formula 1 with the V coloured from the minor scales.'],
  '8.8b': ['Siskind Book 3', 'Unit 10', 'pp.217–221',
    'The same formula with the V taken from the major modes, which the book calls the more consonant of the two.'],

  /* ---- Stage 9: reharmonisation ---- */
  '9.1': ['Siskind Book 1', 'Unit 12', 'pp.186–188',
    'V/vi, V/ii and V/iii with Type A/B voicings.'],
  '9.2': ['Siskind Book 1', 'Unit 12', 'p.190',
    'The backdoor: ♭VIIm7–♭VII7–I as an alternative arrival at the tonic.'],
  '9.3': ['Siskind Book 1', 'Unit 12', 'p.189',
    'The diminished walk-up, with ♯iv°7 as a passing chord between IV and V.'],
  '9.4': ['Siskind Book 1', 'Unit 12', 'pp.186–188',
    'The I-vi-ii-V turnaround, written out with Type A/B voicings alongside the secondary dominants of the same unit.'],
  '9.5': ['Siskind Book 1', 'Unit 12', 'pp.186–188',
    'The iii-vi-ii-V variation, printed with the shorter turnaround.'],
  '9.6': ['Siskind Book 3', 'Unit 11', 'pp.248–258',
    'The major-third cycle, with the instruction to "practice improvising over Coltrane Changes using arpeggios, guidetone lines, continuous scales".'],

  /* ---- Stage 10: interchange and outside ---- */
  '10.1': ['Siskind Book 3', 'Unit 8', 'pp.140–142',
    'Changing modes over the same root, which is where borrowing begins.'],
  '10.2': ['Siskind Book 3', 'Unit 6', 'pp.106–115',
    'Tonicising non-diatonic chords and resolving them, with written improvisation examples over Cm7.'],
  '10.3': ['Siskind Book 3', 'Unit 6', 'pp.106–115',
    'The sidestep, in the same unit as the tonicisations.'],
  '10.4': ['Siskind Book 3', 'Unit 8', 'pp.169–180',
    'Planing: moving a melodic cell by a consistent interval — half steps, whole steps, minor thirds, major thirds.'],
  '10.5': ['Siskind Book 3', 'Unit 8', 'pp.140–142',
    'Modal interchange over a static chord, at the front of the unit.'],

  /* ---- Stage 11: modal blues ---- */
  '11.1': ['Siskind Book 3', 'Unit 10', 'pp.206–210',
    'The Mixolydian blues, with the non-chord-tone patterns that go with it.'],
  '11.2': ['Siskind Book 2', 'Unit 7', 'pp.133–134',
    'The minor blues form in C, F and B♭, printed beside the Bird blues.'],
  '11.3': ['Siskind Book 2', 'Unit 7', 'pp.133–134',
    'The same pages — the Aeolian colouring is the darker of the minor forms shown.'],
  '11.4': ['Siskind Book 2', 'Unit 7', 'pp.133–134',
    'The minor two-five-i inside the blues form, in bars nine to eleven.'],
  '11.5': ['Siskind Book 3', 'Unit 10', 'pp.217–221',
    'The reharmonised blues, with the four quartal formulas and the So What alternatives.'],

  /* ---- Stage 12: odd time ---- */
  '12.1': ['Siskind Book 3', 'Unit 11', 'pp.240–253',
    'The clave patterns for 5/4, and scales played with and against them.'],
  '12.2': ['Siskind Book 3', 'Unit 11', 'pp.240–253',
    'The 7/4 patterns, and standards rewritten in seven.'],
  '12.3': ['Siskind Book 3', 'Unit 11', 'p.248',
    'Groupings that do not evenly match the beat.'],
  '12.4': ['Siskind Book 3', 'Unit 11', 'pp.240–253',
    'The writing exercises at the end of the unit, after the clave material.'],
  '12.5': ['Siskind Book 3', 'Unit 11', 'pp.240–253',
    'Metric modulation, in the same unit as the odd-meter work.']
};

/**
 * The citation for one exercise. P0 shares a single entry, because the whole
 * stage has one source and twelve separate identical citations would be
 * twelve places for it to go stale.
 */
function jazzReference(id){
  const row = JAZZ_REFERENCES[id]
    || (String(id).indexOf('P0.') === 0 ? JAZZ_REFERENCES['P0.*'] : null);
  if(!row) return null;
  return {book: row[0], bookFull: JAZZ_BOOKS[row[0]] || row[0],
    chapter: row[1], pageNumbers: row[2], description: row[3]};
}
/** What you would write in a notebook, or paste into a message. */
function jazzCitation(ref){
  if(!ref) return '';
  const bits = [ref.book === 'Design Doc' ? ref.bookFull
    : `${ref.book.replace(/ Book \d$/, '')}, “${ref.bookFull}”`];
  if(ref.chapter && ref.chapter !== '—') bits.push(ref.chapter);
  if(ref.pageNumbers && ref.pageNumbers !== '—') bits.push(ref.pageNumbers);
  return bits.join(', ');
}
