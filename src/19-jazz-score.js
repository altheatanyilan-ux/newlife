/* ============================================================
   THE TWELVE KEYS.

   All that is left here is the vocabulary: which twelve keys an exercise is
   asked for, how they are spelled, and how to say one out loud.

   What used to be here was a second engraver — a little language of scale
   degrees that wrote a chord out in any key, with the spelling worked out
   from which degree a note was rather than from a table of twelve names. It
   was good at that one thing and it knew four voicings. The curriculum that
   arrived knows seventy-seven exercises across thirteen stages, with the
   page of the book each one comes from, and it brings its own generator. Two
   engravers is one more than a room needs, so the one that could draw less
   went. Its idea survives where it can be reached: the generator picks a
   sharp or a flat spelling from the key it is writing in, rather than
   writing every black note as a flat.

   Six flat keys, five naturals and G flat rather than F sharp, because that
   is how the books print it.
   [name, letter 0-6 from C, alteration, fifths for the key signature] */
const JAZZ_KEYS = [
  ['C',  0,  0,  0], ['Db', 1, -1, -5], ['D',  1,  0,  2], ['Eb', 2, -1, -3],
  ['E',  2,  0,  4], ['F',  3,  0, -1], ['Gb', 4, -1, -6], ['G',  4,  0,  1],
  ['Ab', 5, -1, -4], ['A',  5,  0,  3], ['Bb', 6, -1, -2], ['B',  6,  0,  5]];
const JAZZ_KEY_NAMES = JAZZ_KEYS.map(k => k[0]);
const jazzKey = name => JAZZ_KEYS.find(k => k[0] === name) || JAZZ_KEYS[0];
/* the letters, and what each sounds like on its own */
const JAZZ_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const JAZZ_NATURAL = [0, 2, 4, 5, 7, 9, 11];
/* a key as a musician writes it rather than as a filename spells it */
const jazzPretty = n => String(n || '').replace(/b$/, '♭').replace(/#$/, '♯');
/* and the interval names the first stage asks for, said the same way */
const jazzSayInterval = n => String(n || '').replace(/([a-z])([A-Z0-9])/g, '$1 $2')
  .replace(/(\d)(st|nd|rd|th)/, '$1$2').toLowerCase();
