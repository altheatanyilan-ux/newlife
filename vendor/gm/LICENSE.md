# Fluid (R3) General MIDI instruments

The instrument samples in this folder — acoustic bass, violin, cello, flute
and string ensemble — are from the **Fluid (R3) General MIDI SoundFont** by
**Frank Wen**, as rendered to MP3 by the **midi-js-soundfonts** project
(Benjamin Gleitzman).

- Source: <https://github.com/gleitz/midi-js-soundfonts> (`FluidR3_GM/`)
- Licence of the sounds: **Creative Commons Attribution 3.0 (CC BY 3.0)** —
  <https://creativecommons.org/licenses/by/3.0/us/>
- The midi-js-soundfonts code is MIT-licensed (Copyright © 2012 Benjamin
  Gleitzman).

Only every minor third across each instrument's range is kept, extracted
unchanged from the published files. `tools/fetch-gm-instruments.sh` fetches
them again; `build.js` embeds them in `index.html`, and the app credits them
where they are played (every play bar's ⋯ options and Settings → Sound).
