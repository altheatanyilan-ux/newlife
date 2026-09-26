#!/usr/bin/env python3
"""Score Study companion — an OPTIONAL second opinion, run by you, on your machine.

The site never calls this and never needs it. Study mode works out keys, Roman
numerals, cadences and form by itself, from rules, in the browser. This script
exists for when you want a different reading to compare against: it runs a
trained model (AugmentedNet, by Néstor Nápoles López) over a MusicXML file and
writes what it thinks as RomanText, which you then import in Study →
Compare → "Import .rntxt" with the origin "companion". Nothing it writes is
accepted automatically; it arrives as a separate version, and the diff shows
you where it disagrees with the rules and with you.

Usage
    python3 tools/analyze.py piece.musicxml            # writes piece.rntxt and piece.csv
    python3 tools/analyze.py piece.musicxml --out dir  # somewhere else
    python3 tools/analyze.py piece.musicxml --rules    # no model: music21's own
                                                       # chord-by-chord reading

Setup (once, and only if you want the model)
    python3 -m pip install music21
    git clone https://github.com/napulen/AugmentedNet   # follow its README for
                                                        # the weights and TensorFlow
    export AUGMENTEDNET=/path/to/AugmentedNet

Without AUGMENTEDNET set, or with --rules, it falls back to music21's
chordify + romanNumeralFromChord against the key music21 estimates per
section (Krumhansl-Schmuckler). That reading is plainer than the site's own and
is useful mainly as a sanity check.

Output
    <name>.rntxt  RomanText (Tymoczko et al.), the format Study imports
    <name>.csv    measure, beat, key, numeral, and the model's confidence where
                  it gives one — one row per label

Everything stays on your machine. This script makes no network requests.
"""
import argparse
import csv
import os
import subprocess
import sys


def die(msg):
    sys.stderr.write(msg.rstrip() + "\n")
    sys.exit(1)


def key_token(k):
    """music21 key -> RomanText key token: C: for major, c: for minor, b for flat."""
    name = k.tonic.name.replace("-", "b")
    return (name if k.mode == "major" else name.lower()) + ":"


def beat_str(b):
    v = round(float(b), 3)
    return str(int(v)) if v == int(v) else str(v)


def rules_reading(path):
    """Chord by chord, against music21's windowed key estimate. No model."""
    try:
        import music21 as m21
    except ImportError:
        die("music21 is needed: python3 -m pip install music21")
    score = m21.converter.parse(path)
    chords = score.chordify()
    rows = []
    # a key per eight bars, the same idea as the site's Viterbi smoothing, cruder
    measures = list(chords.getElementsByClass("Measure"))
    keys = {}
    for i in range(0, len(measures), 8):
        chunk = m21.stream.Stream()
        for m in measures[i:i + 8]:
            for n in m.recurse().notes:
                chunk.append(n)
        try:
            k = chunk.analyze("key")
        except Exception:
            k = score.analyze("key")
        for m in measures[i:i + 8]:
            keys[m.number] = k
    for m in measures:
        k = keys.get(m.number) or score.analyze("key")
        for c in m.recurse().getElementsByClass("Chord"):
            if len(c.pitches) < 2:
                continue
            try:
                rn = m21.roman.romanNumeralFromChord(c, k)
                fig = rn.figure
            except Exception:
                continue
            rows.append({"measure": m.number, "beat": c.beat, "key": k, "numeral": fig, "confidence": ""})
    # drop repeats of the same numeral inside a bar: the site labels changes, not onsets
    out, last = [], None
    for r in rows:
        sig = (r["measure"], r["numeral"], key_token(r["key"]))
        if last and last == sig:
            continue
        out.append(r)
        last = sig
    return out


def model_reading(path, home, workdir):
    """Run AugmentedNet's inference script and read its annotated output."""
    script = os.path.join(home, "AugmentedNet", "inference.py")
    if not os.path.exists(script):
        script = os.path.join(home, "inference.py")
    if not os.path.exists(script):
        die(f"Could not find AugmentedNet's inference.py under {home}")
    cmd = [sys.executable, "-m", "AugmentedNet.inference", path] if os.path.isdir(os.path.join(home, "AugmentedNet")) else [sys.executable, script, path]
    r = subprocess.run(cmd, cwd=home, capture_output=True, text=True)
    if r.returncode != 0:
        die("AugmentedNet failed:\n" + r.stderr[-2000:])
    base = os.path.splitext(os.path.basename(path))[0]
    # AugmentedNet writes <name>_annotated.rntxt (and .csv) next to the input
    cand = [os.path.join(os.path.dirname(path), base + "_annotated.rntxt"), os.path.join(home, base + "_annotated.rntxt")]
    found = next((c for c in cand if os.path.exists(c)), None)
    if not found:
        die("AugmentedNet ran but its .rntxt was not found; looked for:\n  " + "\n  ".join(cand))
    return open(found, encoding="utf-8").read()


def to_rntxt(rows, title, composer, analyst):
    lines = [f"Composer: {composer}", f"Title: {title}", f"Analyst: {analyst}", "Proposed By: companion", ""]
    by_m = {}
    for r in rows:
        by_m.setdefault(r["measure"], []).append(r)
    last_key = None
    for m in sorted(by_m):
        parts = [f"m{m}"]
        for r in sorted(by_m[m], key=lambda x: float(x["beat"])):
            parts.append("b" + beat_str(r["beat"]))
            kt = key_token(r["key"])
            if kt != last_key:
                parts.append(kt)
                last_key = kt
            parts.append(r["numeral"])
        line = " ".join(parts)
        if line.startswith(f"m{m} b1 "):
            line = f"m{m} " + line[len(f"m{m} b1 "):]
        lines.append(line)
    return "\n".join(lines) + "\n"


def rntxt_rows(text):
    """Read RomanText back into rows, for the CSV."""
    rows, key = [], ""
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("m") or not line[1:2].isdigit() or "=" in line:
            continue
        head, *toks = line.split()
        measure = int("".join(ch for ch in head[1:] if ch.isdigit()) or 0)
        beat = "1"
        for t in toks:
            if t in ("|", "||"):
                continue
            if t.startswith("b") and t[1:].replace(".", "").isdigit():
                beat = t[1:]
                continue
            if t.endswith(":"):
                key = t[:-1]
                continue
            if ":" in t:
                key, t = t.split(":", 1)
            rows.append({"measure": measure, "beat": beat, "key": key, "numeral": t, "confidence": ""})
    return rows


def main():
    ap = argparse.ArgumentParser(description="Optional second opinion for Score Study: MusicXML in, RomanText out.")
    ap.add_argument("score", help=".musicxml, .xml or .mxl")
    ap.add_argument("--out", default=None, help="folder for the .rntxt and .csv (default: next to the score)")
    ap.add_argument("--rules", action="store_true", help="skip the model; use music21's own reading")
    ap.add_argument("--title", default=None)
    ap.add_argument("--composer", default="")
    a = ap.parse_args()
    if not os.path.exists(a.score):
        die(f"No such file: {a.score}")
    base = os.path.splitext(os.path.basename(a.score))[0]
    out = a.out or os.path.dirname(os.path.abspath(a.score))
    os.makedirs(out, exist_ok=True)
    title = a.title or base
    home = os.environ.get("AUGMENTEDNET")
    if home and not a.rules:
        text = model_reading(os.path.abspath(a.score), home, out)
        rows = rntxt_rows(text)
        if "Proposed By:" not in text:
            text = text.replace("\n\n", "\nProposed By: companion\n\n", 1)
    else:
        if not a.rules:
            sys.stderr.write("AUGMENTEDNET is not set: using music21's reading instead (--rules).\n")
        r = rules_reading(a.score)
        text = to_rntxt(r, title, a.composer, "music21 (rules), via tools/analyze.py")
        rows = [dict(x, key=key_token(x["key"])[:-1], beat=beat_str(x["beat"])) for x in r]
    rp, cp = os.path.join(out, base + ".rntxt"), os.path.join(out, base + ".csv")
    with open(rp, "w", encoding="utf-8") as f:
        f.write(text)
    with open(cp, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["measure", "beat", "key", "numeral", "confidence"])
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"{len(rows)} labels -> {rp}\n{' ' * len(str(len(rows)))}         {cp}")


if __name__ == "__main__":
    main()
