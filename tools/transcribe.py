#!/usr/bin/env python3
"""Piano transcription helper — OPTIONAL, run by you, on your own computer.

The site transcribes microphone takes itself, in the browser, with its own
signal processing (19-listen-f-transcribe.js). This script is the upgrade the
Transcribe Engine leaves room for: ByteDance's high-resolution piano
transcription (piano_transcription_inference), a trained model that also
hears the sustain pedal. It writes a MIDI file; in Jazz Studio → Play to
compose, "Import MIDI" reads it as a take (the pedal included), and the
clean-up writes it out as notation like any other take.

Nothing is uploaded. The model's weights are downloaded once by the library
itself, to your machine, the first time you run it — that is the network
step the site will not take, which is why this lives outside it.

Usage
    python3 -m pip install piano_transcription_inference librosa
    python3 tools/transcribe.py take.wav            # writes take.mid next to it
    python3 tools/transcribe.py take.wav --out dir  # somewhere else
    python3 tools/transcribe.py take.wav --cpu      # no GPU
"""
import argparse
import os
import sys


def main():
    ap = argparse.ArgumentParser(description="Transcribe a piano recording to MIDI (with pedal) for Play to compose.")
    ap.add_argument("audio", help="a recording: .wav, .flac, .mp3, .m4a")
    ap.add_argument("--out", default=None, help="folder for the .mid (default: next to the recording)")
    ap.add_argument("--cpu", action="store_true", help="run on the CPU even if a GPU is there")
    a = ap.parse_args()
    if not os.path.exists(a.audio):
        sys.exit(f"No such file: {a.audio}")
    try:
        import librosa
        from piano_transcription_inference import PianoTranscription, sample_rate
    except ImportError:
        sys.exit("Needs: python3 -m pip install piano_transcription_inference librosa")
    device = "cpu"
    if not a.cpu:
        try:
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            pass
    audio, _ = librosa.core.load(a.audio, sr=sample_rate, mono=True)
    out_dir = a.out or os.path.dirname(os.path.abspath(a.audio))
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(a.audio))[0]
    out = os.path.join(out_dir, base + " (transcribed).mid")
    tr = PianoTranscription(device=device, checkpoint_path=None)
    res = tr.transcribe(audio, out)
    n = len(res.get("est_note_events", [])) if isinstance(res, dict) else 0
    p = len(res.get("est_pedal_events", [])) if isinstance(res, dict) else 0
    print(f"{n} notes, {p} pedal presses -> {out}")
    print("Import it in Jazz Studio › Play to compose › Import MIDI.")


if __name__ == "__main__":
    main()
