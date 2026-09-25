#!/bin/sh
# ============================================================
#   THE OTHER INSTRUMENTS
#
#   A duet, a sonata, a concerto reduction and the Jazz Studio's rhythm
#   section need more than a piano. These are five instruments from the
#   Fluid (R3) General MIDI SoundFont (Frank Wen), as rendered to MP3 by
#   the midi-js-soundfonts project (Benjamin Gleitzman), released under
#   Creative Commons Attribution 3.0 (vendor/gm/LICENSE.md):
#
#     acoustic bass, violin, cello, flute, string ensemble
#
#   The published files carry all 88 keys at about three megabytes an
#   instrument. Like the piano, only every minor third is kept, and only
#   across the range each instrument is played in; the player pitches the
#   notes between by at most a semitone and a half. That is about eighty
#   notes in all. Anything a score asks for that is not one of these is
#   played on the grand.
#
#   Run it by hand when the set should be fetched again; the files are
#   committed, so a normal build never needs it:
#
#     sh tools/fetch-gm-instruments.sh
# ============================================================
set -e
cd "$(dirname "$0")/.."
BASE=https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# instrument  lowest-kept  highest-kept  (MIDI numbers on the minor-third grid C, Eb, Gb, A)
for spec in "acoustic_bass 27 69" "violin 48 99" "cello 36 81" "flute 60 96" "string_ensemble_1 36 93"; do
  set -- $spec
  curl -sSfL --retry 3 -o "$TMP/$1.js" "$BASE/$1-mp3.js"
  node -e '
    const fs = require("fs"), path = require("path");
    const [file, name, lo, hi] = process.argv.slice(1);
    const src = fs.readFileSync(file, "utf8");
    const notes = {};
    for(const m of src.matchAll(/"([A-G]b?\d)":\s*"data:audio\/mp3;base64,([^"]+)"/g)) notes[m[1]] = m[2];
    const pcOf = {C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11};
    const dir = path.join("vendor", "gm", name);
    fs.mkdirSync(dir, {recursive: true});
    let n = 0;
    for(const [k, b64] of Object.entries(notes)){
      const m = /^([A-G]b?)(\d)$/.exec(k); const midi = 12 * (+m[2] + 1) + pcOf[m[1]];
      if(midi < +lo || midi > +hi || midi % 3 !== 0) continue;
      fs.writeFileSync(path.join(dir, k + ".mp3"), Buffer.from(b64, "base64")); n++;
    }
    console.log(name + ": " + n + " notes");
  ' "$TMP/$1.js" "$1" "$2" "$3"
done
curl -sSfL --retry 3 -o "$TMP/LICENSE.txt" "https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/LICENSE.txt"
echo "fetched into vendor/gm ($(du -sh vendor/gm | cut -f1))"
