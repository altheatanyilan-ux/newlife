#!/bin/sh
# ============================================================
#   THE GRAND PIANO
#
#   Every note the house plays on a piano — a score played back, the
#   Jazz Studio's comping, a chord or a voicing heard, the ambient slow
#   piano — is a recording of a real instrument: the Salamander Grand
#   Piano V3, a Yamaha C5 sampled by Alexander Holm and released under
#   Creative Commons Attribution 3.0 (vendor/salamander/LICENSE.md).
#
#   This is the set the Tone.js project hosts: one velocity, every minor
#   third from A0 to C8 — thirty notes, about two megabytes — which the
#   player pitches by at most a semitone and a half to reach the keys in
#   between. build.js embeds the files in index.html as a payload the
#   browser stores and does not parse, the way it embeds the engraver, so
#   the piano works offline and from a file on disk.
#
#   Run it by hand when the set should be fetched again; the files are
#   committed, so a normal build never needs it:
#
#     sh tools/fetch-grand-piano.sh
# ============================================================
set -e
cd "$(dirname "$0")/.."
DIR=vendor/salamander
BASE=https://raw.githubusercontent.com/Tonejs/audio/master/salamander
mkdir -p "$DIR"
for o in 0 1 2 3 4 5 6 7; do
  for n in C Ds Fs A; do
    f="$n$o"
    case "$f" in C0|Ds0|Fs0) continue;; esac
    curl -sSfL --retry 3 -o "$DIR/$f.mp3" "$BASE/$f.mp3"
  done
done
curl -sSfL --retry 3 -o "$DIR/C8.mp3" "$BASE/C8.mp3"
echo "fetched $(ls "$DIR"/*.mp3 | wc -l) samples into $DIR ($(du -sh "$DIR" | cut -f1))"
