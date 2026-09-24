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
  /* the vocal-technique text the golden tips cite for warming up, cooling
     down and mental practice — the research named the author and the
     chapters, not the title, and this is the identification */
  'Peckham': 'The Contemporary Singer',
  'Design Doc': 'Jazz Practice Studio — design notes',
  /* the sources Curriculum v3 adds to the room's shelf */
  'Dobbins': 'Jazz Arranging and Composing: A Linear Approach',
  'Barry Harris': 'Barry Harris workshops',
  'Gemini Research': 'Pedagogical Roadmap for Classical-to-Jazz Transition',
  'Gordon': 'Music Learning Theory',
  'Werner': 'Effortless Mastery',
  'Curriculum v3': 'Jazz Studio — Complete Curriculum v3, Master Build Document'
};

/* [book, chapter, pages, what to look for when you get there] */
const JAZZ_REFERENCES = {
  /* ---- P0: this stage is the studio's own, not a book's ---- */
  'P0.*': ['Design Doc', 'Stage P0', '—',
    'Stage P0 is this studio’s own addition rather than a chapter of anybody’s book: the twelve distances, drilled from every root, before the chord work in Siskind Book 1 Unit 1 begins.'],

  /* ---- the improvisation exercises ----
     These carried their unit and pages in their own catalogue from the day
     they arrived, but nothing mapped them into a citation, so thirteen
     exercises sat in the room with no address on them. The page ranges are
     the ones their own records give. */
  'IMP-B1-01': ['Siskind Book 1', 'Unit 1', 'pp.9–10',
    'The drone improvisation: a low open fifth held in the left hand, and the right hand wandering the major scale over it. The page gives the points of focus — listening, phrase endings, rhythmic variety.'],
  'IMP-B1-02': ['Siskind Book 1', 'Unit 2', 'p.23',
    'The second drone improvisation, on hand positions and call-and-response: play a phrase, then answer it with a different one.'],
  'IMP-B1-03': ['Siskind Book 1', 'Unit 3', 'pp.35–36',
    'Drone improvisation moved into F and B flat, introducing grace notes and sequences as ways of shaping a phrase.'],
  'IMP-B1-04': ['Siskind Book 1', 'Unit 4', 'pp.49–50',
    'Building rhythmic vocabulary: phrases that begin on different beats of the bar, so that not everything lands on beat one.'],
  'IMP-B1-05': ['Siskind Book 1', 'Unit 5', 'pp.62–63',
    'Improvising over the two-five-one rather than over a drone, with the focus prompts the unit sets for it.'],
  'IMP-B1-06A': ['Siskind Book 1', 'Unit 6', 'pp.81–82',
    'The second rhythmic vocabulary exercise: mixing quarter notes and eighth notes within a phrase instead of running the scale.'],
  'IMP-B1-06B': ['Siskind Book 1', 'Unit 6', 'pp.82–83',
    'The 3-5-7-9 arpeggio exercise, ascending and descending through all twelve keys.'],
  'IMP-B1-07': ['Siskind Book 1', 'Unit 7', 'p.113',
    'Improvising on the blues with the blues scale, in the AAB shape the unit describes.'],
  'IMP-B1-08': ['Siskind Book 1', 'Unit 8', 'p.113',
    'Call-and-response phrasing over the blues form, mixing the blues scale with arpeggios.'],
  'IMP-B1-09': ['Siskind Book 1', 'Unit 9', 'p.150',
    'Play One Rest One and Play Two Rest Two: leaving space deliberately, counted rather than felt.'],
  'IMP-B1-10': ['Siskind Book 1', 'Unit 10', 'pp.151–152',
    'Play What You Sing — sing a phrase over the drone or the two-five-one, then find it on the keyboard. The inner-ear exercise.'],
  'IMP-B1-11': ['Siskind Book 1', 'Unit 11', 'p.165',
    'Neighbour tones and chromatic enclosure as improvisational devices.'],
  'IMP-B1-12': ['Siskind Book 1', 'Unit 12', 'pp.183–184',
    'Improvising with altered dominants, using the altered scale over the V chord.'],

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
    'Metric modulation, in the same unit as the odd-meter work.'],

  /* ---- Stage 6A: chord-scale theory (Levine, The Jazz Theory Book) ---- */
  '6A.1': ['Levine', 'Ch.3 “The Modes”', '—',
    'One mode of the major scale, ascending and descending. The chapter opens with D Dorian as its first example, then instructs the reader to practise all seven modes from every root.'],
  '6A.2': ['Levine', 'Ch.3 “The Modes”', '—',
    'All seven modes generated from a single parent major key, played one after another. Each mode has its own chord quality listed beside it.'],
  '6A.3': ['Levine', 'Ch.7 “The Melodic Minor Scale”', '—',
    'One mode of the melodic minor scale. Levine introduces the parent as “the major scale with a flatted third” and names all seven resulting modes with their associated chord types.'],
  '6A.4': ['Levine', 'Ch.7 “The Melodic Minor Scale”', '—',
    'All seven melodic minor modes in sequence from one parent key. The altered scale — mode VII, used over V7alt — is the one Levine circles back to throughout the chapter.'],
  '6A.5': ['Levine', 'Ch.8 “The Diminished Scale”', '—',
    'The half-whole pattern (H-W repeating), used over V7(b9) chords. The chapter opens with the observation that only three distinct diminished scales exist.'],
  '6A.6': ['Levine', 'Ch.8 “The Diminished Scale”', '—',
    'The whole-half pattern (W-H repeating), used over dim7 chords. Levine prints both forms together so the relationship between them is immediately visible.'],
  '6A.7': ['Levine', 'Ch.8 “The Diminished Scale”', '—',
    'A four-note motif moved down in minor thirds — the diminished-scale symmetry means one hand shape repeats three times in an octave.'],
  '6A.8': ['Levine', 'Ch.9 “The Whole Tone Scale”', '—',
    'Six equal whole steps, used over dominant 7(#5) chords. Only two whole-tone scales exist; the chapter notes there is no leading tone and therefore no strong pull to a tonic.'],

  /* ---- Stage 13: Mantooth generic and miracle voicings ---- */
  '13.1.1': ['Mantooth', 'Ch.2 “Generic Voicings”', '—',
    'Generic Major from tonic: a 6/9 sonority built by stacking four perfect fourths down from the root. The chapter establishes this as the quartal approach’s home base.'],
  '13.1.2': ['Mantooth', 'Ch.2 “Generic Voicings”', '—',
    'Generic Major from the fifth: the identical four-fourth stack displaced to start on the fifth. The melody note is now the ninth of the chord.'],
  '13.1.3': ['Mantooth', 'Ch.2 “Generic Voicings”', '—',
    'Generic Minor: the same quartal stack started on the minor third, producing min7, min9, or min11 depending on how the bass is voiced.'],
  '13.1.4': ['Mantooth', 'Ch.2 “Generic Voicings”', '—',
    'Generic Dominant from tonic: left hand plays the structural tritone (3rd and b7th), right hand stacks two perfect fourths up from the root.'],
  '13.1.5': ['Mantooth', 'Ch.2 “Generic Voicings”', '—',
    'Generic Dominant from the fifth: the same split, with the tritone inverted in the left hand and the right-hand quartal stack starting on the fifth.'],
  '13.1.6': ['Mantooth', 'Ch.2 “Generic Voicings”', '—',
    'ii-V-I workout using only generic shapes. The chapter shows this three-chord chain as the first extended application of the quartal vocabulary.'],
  '13.2.1': ['Mantooth', 'Ch.4 “Miracle Voicings”', '—',
    'Miracle Voicing I: one major third on top of three perfect fourths. The chapter names the five chord functions this one shape serves and leaves the choice to the player’s ear.'],
  '13.2.2': ['Mantooth', 'Ch.4 “Miracle Voicings”', '—',
    'Miracle Voicing II: four perfect fourths throughout — the most symmetrical jazz voicing. Another five chord functions served by a single finger position.'],
  '13.2.3': ['Mantooth', 'Ch.4 “Miracle Voicings”', '—',
    'ii-V-I using Miracle Voicings I and II in alternation. The chapter shows the path where only one note moves between adjacent chords.'],

  /* ---- Stage 13: Mantooth polychord fractions ---- */
  '13.3.1': ['Mantooth', 'Ch.6–7 “Polychord Fractions”', '—',
    'A polychord fraction for dominant chords: left hand holds the tritone (3 and b7) while the right hand plays a major triad built a specified interval above the root.'],
  '13.3.2': ['Mantooth', 'Ch.6–7 “Polychord Fractions”', '—',
    'ii-V7(b9)-I with the bII fraction: a major triad a minor second above the root gives the b9 colour. Mantooth calls this the most common altered dominant sound.'],
  '13.3.3': ['Mantooth', 'Ch.6–7 “Polychord Fractions”', '—',
    'ii-V7(#9/#5)-I with the bVI fraction: a triad a minor sixth above the root supplies both the sharp-nine and sharp-five colours at once.'],
  '13.3.4': ['Mantooth', 'Ch.6–7 “Polychord Fractions”', '—',
    'ii-V7(b9/b5)-I: the maximally altered dominant, combining the diminished fifth and minor ninth in the same voicing.'],
  '13.3.5': ['Mantooth', 'Ch.6–7 “Polychord Fractions”', '—',
    'The same polychord fraction through all twelve keys in the cycle of fifths. The right-hand triad shape stays fixed; only the left-hand tritone moves chromatically.'],

  /* ---- Stage 13: Berklee guide tones, 4-way close, hybrid, polychord, quartal ---- */
  '13.4.1': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', '—',
    '3-note guide-tone voicings through ii-V-I: the third and seventh with cycle-of-fifths voice leading, so the third of one chord becomes the seventh of the next.'],
  '13.4.2': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', '—',
    '4-note guide-tone voicings: third, seventh, and one added tension. The chapter rule: “when 3 is on top add 13; when 7 is on top add 9.”'],
  '13.4.3': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', '—',
    '4-way close voicings: all four chord tones within one octave, bass note separate below. The chapter calls this the “big-band saxophone-section sound.”'],
  '13.4.4': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', '—',
    '4-way close with tension substitutions: ninth replaces root, thirteenth replaces fifth. Modernises the voicing without changing its function.'],
  '13.5.1': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', 'pp.218–225',
    'Hybrid voicing: left hand plays one bass note; right hand plays a major triad built from the fifth (Maj7) or the minor third (min7).'],
  '13.5.2': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', 'pp.218–225',
    'Hybrid voicings through I-vi-IV-V. Each chord uses the same split: single bass note in the left hand, quality-defining triad in the right.'],
  '13.6.1': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', 'pp.215–218',
    'Upper-structure polychord voicing: lower chord tones in the left hand, a triad chosen from the chord scale in the right. The chapter shows how to select the triad by its tensions.'],
  '13.6.2': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', 'pp.215–218',
    'iii-vi-ii-V-I with polychord voicings. Extended turnaround showing upper-structure voice leading across five chord changes.'],
  '13.7.1': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', 'pp.226–229',
    'Quartal voicing: perfect fourths stacked from the third (major or dominant) or the seventh (minor). The chapter traces this to McCoy Tyner and modal jazz.'],
  '13.7.2': ['Berklee Harmony', 'Ch.11 “Modern Voicing Techniques”', 'pp.226–229',
    'ii-V-I with quartal voicings throughout: fourth from b7 on the ii chord, fourth from 3 on V and I.'],

  /* ---- Stage 15: constant structures (Berklee Harmony, Ch.10) ---- */
  '15.1': ['Berklee Harmony', 'Ch.10 “Non-Functional Harmony”', '—',
    'Maj7 chords ascending by half step. The chapter defines non-functional harmony as movement by equal intervals, with no progression toward a tonal centre.'],
  '15.2': ['Berklee Harmony', 'Ch.10 “Non-Functional Harmony”', '—',
    'Maj7 chords descending by minor thirds. Four chords in a loop; the diminished-scale symmetry means the series closes on itself after four steps.'],
  '15.3': ['Berklee Harmony', 'Ch.10 “Non-Functional Harmony”', '—',
    'min7 chords approaching a diatonic target by chromatic half steps — the same quality and voicing, slid upward until it reaches its destination.'],
  '15.4': ['Berklee Harmony', 'Ch.10 “Non-Functional Harmony”', '—',
    'The zigzag descent: down a minor third, up a minor second, repeating. A net descent of a major second per pair, creating a controlled chromatic fall.'],
  '15.5': ['Berklee Harmony', 'Ch.10 “Non-Functional Harmony”', '—',
    'Coltrane changes: three tonal centres a major third apart, each approached by its own V7. The chapter shows how “Giant Steps” divides the octave into three equal parts.'],

  /* ---- Vocal V1: scat syllables and rhythm ---- */
  'V1.3': ['Stoloff', 'Ch.1 “The Basics”', 'p.26',
    'Straight-eighth warm-up on a single pitch using ba, da, la, na. The page shows each syllable’s consonant articulation and asks you to ascend chromatically bar by bar.'],
  'V1.4': ['Stoloff', 'Ch.1 “The Basics”', 'pp.16–24',
    'Rhythm etudes 1–4: written-out rhythmic patterns with scat syllables assigned, progressing from simple quarter-note figures to syncopated eighth-note lines.'],

  /* ---- Vocal V2: melodic patterns and chord scales ---- */
  'V2.1a': ['Stoloff', 'Ch.2 “Melodic Patterns”', 'pp.28–36',
    'Ascending diatonic scale pattern sung on scat syllables. The chapter opens with stepwise motion as the simplest melodic material in improvisation.'],
  'V2.1b': ['Stoloff', 'Ch.2 “Melodic Patterns”', 'pp.28–36',
    'Descending diatonic scale pattern. Same pages as the ascending form; the instruction is to practise both directions in every key.'],
  'V2.1c': ['Stoloff', 'Ch.2 “Melodic Patterns”', 'pp.28–36',
    'Diatonic seventh-chord arpeggios in 3/4. A jazz-waltz version of the melodic pattern exercises, developing metric flexibility alongside scale fluency.'],
  'V2.2a': ['Stoloff', 'Ch.3 “ii-V Patterns”', 'pp.37–41',
    'One-measure ii-V scat pattern: Dorian ascending on the ii chord, Mixolydian descending on the V. The chapter’s opening exercise.'],
  'V2.2b': ['Stoloff', 'Ch.3 “ii-V Patterns”', 'pp.37–41',
    'Two-measure ii-V scat pattern extending the modal approach across a longer phrase — two bars of ii followed by two bars of V.'],
  'V2.3': ['Stoloff', 'Ch.4 “Embellishment”', 'pp.42–45',
    'Triplet embellishment on the ii chord resolving to V. The chapter introduces the “du-ee-a” triplet syllable and how it colours the line.'],
  'V2.4': ['Stoloff', 'Ch.4 “Embellishment”', 'p.48',
    'Extended ii-V arpeggio cycle through descending fifths: root-b3-5-b7 for the ii chord, root-3-5-b7 for the V, moving down a fifth each bar.'],
  'V2.6a': ['Stoloff', 'Ch.6 “Chord Scales”', 'pp.54–77',
    'Ionian scale (major) sung over Maj7 chords. The chapter surveys all seven modal chord scales; major is the reference from which the others are derived.'],
  'V2.6b': ['Stoloff', 'Ch.6 “Chord Scales”', 'pp.54–77',
    'Dorian scale over min7 chords. The default minor scale in jazz — same as the major scale but starting from its second degree.'],
  'V2.6c': ['Stoloff', 'Ch.6 “Chord Scales”', 'pp.54–77',
    'Mixolydian scale over dom7 chords. Identical to the major scale except for the flatted seventh.'],
  'V2.6d': ['Stoloff', 'Ch.6 “Chord Scales”', 'pp.54–77',
    'Altered dominant scale over V7alt chords: melodic minor a half step above the dominant root, supplying every possible alteration (b9, #9, #11, b13).'],

  /* ---- Vocal V3: walking and singing the bass ---- */
  'V3.5a': ['Stoloff', 'Ch.9 “Vocal Bass”', 'pp.90–102',
    'Roots and fifths through the cycle of fifths. The chapter opens with the syllable “doon” as the archetypal bass sound and this two-note cell as the starting vocabulary.'],
  'V3.5b': ['Stoloff', 'Ch.9 “Vocal Bass”', 'pp.90–102',
    'Roots, fifths and sevenths: adding the chord seventh creates stronger harmonic motion and a wider melodic range through the cycle.'],
  'V3.5c': ['Stoloff', 'Ch.9 “Vocal Bass”', 'pp.90–102',
    'Roots, thirds and sevenths: the three essential chord tones, outlining the chord quality clearly with each bar.'],
  'V3.5d': ['Stoloff', 'Ch.9 “Vocal Bass”', 'pp.90–102',
    'Walking bass with chromatic approach notes: root, third, fifth, then a half-step from below into the next root.'],

  /* ---- Vocal V4: bebop lines and hearing changes (Weir) ---- */
  'V4.1a': ['Weir', 'Part I “The Language”', '—',
    'Simple ascending diatonic line on quarter notes. The book opens by establishing stepwise motion as the raw material from which all bebop lines are constructed.'],
  'V4.1b': ['Weir', 'Part I “The Language”', '—',
    'Simple descending diatonic line. Descending motion is more common in jazz improvisation; the early exercises build comfort with both directions.'],
  'V4.1c': ['Weir', 'Part I “The Language”', '—',
    'Wave-pattern diatonic line: up a third, down a second, repeating. A more interesting contour than straight ascent or descent.'],
  'V4.2a': ['Weir', 'Part II “Bebop Vocabulary”', '—',
    'Chromatic passing tone: a half step below a chord tone, resolving up onto the beat. The fundamental bebop approach gesture.'],
  'V4.2b': ['Weir', 'Part II “Bebop Vocabulary”', '—',
    'Enclosure: a note from above and a note from below surrounding the target chord tone. The book calls this the essential bebop approach figure.'],
  'V4.2c': ['Weir', 'Part II “Bebop Vocabulary”', '—',
    'Bebop lick over ii-V: Dorian material with chromatic passing tones on the ii chord, Mixolydian with a leading-tone resolution onto the I.'],
  'V4.3a': ['Weir', 'Part III “Hearing the Changes”', '—',
    'Hearing the changes — roots: sing the root of each chord in real time over a backing track, developing harmonic awareness before melodic elaboration.'],
  'V4.3b': ['Weir', 'Part III “Hearing the Changes”', '—',
    'Hearing the changes — arpeggios: outline each chord with its arpeggio while the progression moves, developing the ability to track harmony in real time.'],
  'V4.3c': ['Weir', 'Part III “Hearing the Changes”', '—',
    'Hearing the changes — guide tones: sing the third and seventh of each chord, following the voice-leading path through the changes.'],

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
