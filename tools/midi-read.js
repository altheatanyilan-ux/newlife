/* midi-read — a Standard MIDI File, as notes in seconds.

   For the recording-sync harness: the ASAP performances are MIDI files
   recorded from a Disklavier at the piano competition, with every key's
   timing and velocity and the sustain pedal. This reads formats 0 and 1:
   note on/off (a note-on at velocity 0 is an off), controller 64 (the
   sustain pedal), the tempo map, running status; everything else is
   skipped over.

   read(bytes) → {notes: [{t, off, midi, vel (0–127), ch}], pedal: [{t, down}], duration}
   pianoEvents(midi) → the harness's events for the piano, each note held
   by the pedal until the pedal lifts, as a real damper would.

   Usable from Node (module.exports) and a page (window.midiRead). */
(function(root){
'use strict';
function read(bytes){
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let p = 0;
  const u32 = () => { const v = (b[p] << 24 | b[p + 1] << 16 | b[p + 2] << 8 | b[p + 3]) >>> 0; p += 4; return v; };
  const u16 = () => { const v = b[p] << 8 | b[p + 1]; p += 2; return v; };
  const vlq = () => { let v = 0, c; do { c = b[p++]; v = (v << 7) | (c & 0x7f); } while(c & 0x80); return v; };
  const tag = () => String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
  if(tag() !== 'MThd') throw new Error('not a MIDI file');
  p += 4; const hlen = u32(); const hstart = p;
  const format = u16(), ntr = u16(), div = u16(); p = hstart + hlen;
  if(div & 0x8000) throw new Error('SMPTE time is not read');
  const raw = [];   /* {tick, kind, ...} across tracks */
  for(let tr = 0; tr < ntr && p < b.length; tr++){
    while(p < b.length && tag() !== 'MTrk'){ p += 4; const l = u32(); p += l; }
    if(p >= b.length) break;
    p += 4; const len = u32(), end = p + len;
    let tick = 0, status = 0;
    while(p < end){
      tick += vlq();
      let st = b[p];
      if(st & 0x80){ p++; status = st; } else st = status;
      if(st === 0xff){ const type = b[p++], l = vlq();
        if(type === 0x51 && l === 3) raw.push({tick, kind: 'tempo', us: b[p] << 16 | b[p + 1] << 8 | b[p + 2]});
        p += l; continue; }
      if(st === 0xf0 || st === 0xf7){ const l = vlq(); p += l; continue; }
      const hi = st & 0xf0, ch = st & 0x0f;
      if(hi === 0x90 || hi === 0x80){ const k = b[p++], v = b[p++]; raw.push({tick, kind: hi === 0x90 && v > 0 ? 'on' : 'off', k, v, ch}); }
      else if(hi === 0xb0){ const c = b[p++], v = b[p++]; if(c === 64) raw.push({tick, kind: 'ped', v, ch}); }
      else if(hi === 0xc0 || hi === 0xd0) p += 1;
      else p += 2;
    }
    p = end;
  }
  /* ticks → seconds through the tempo map */
  raw.sort((a, c) => a.tick - c.tick || (a.kind === 'tempo' ? -1 : 0));
  let lastTick = 0, lastSec = 0, us = 500000;
  const sec = tick => lastSec + (tick - lastTick) * us / 1e6 / div;
  const notes = [], open = new Map(), pedal = [];
  raw.forEach(e => {
    const t = sec(e.tick);
    if(e.kind === 'tempo'){ lastSec = t; lastTick = e.tick; us = e.us; return; }
    if(e.kind === 'on'){ const key = e.ch * 128 + e.k; if(open.has(key)){ const n = open.get(key); n.off = t; } const n = {t, off: null, midi: e.k, vel: e.v, ch: e.ch}; notes.push(n); open.set(key, n); }
    else if(e.kind === 'off'){ const key = e.ch * 128 + e.k, n = open.get(key); if(n){ n.off = t; open.delete(key); } }
    else if(e.kind === 'ped') pedal.push({t, down: e.v >= 64});
  });
  const endT = raw.length ? sec(raw[raw.length - 1].tick) : 0;
  notes.forEach(n => { if(n.off == null) n.off = Math.max(n.t + 0.1, endT); });
  /* seconds back to quarter notes, through the same tempo map */
  const tempi = [{tick: 0, sec: 0, us: 500000}];
  { let lt = 0, ls = 0, u = 500000; raw.filter(e => e.kind === 'tempo').forEach(e => { ls += (e.tick - lt) * u / 1e6 / div; lt = e.tick; u = e.us; tempi.push({tick: lt, sec: ls, us: u}); }); }
  const quarters = s => { let k = 0; while(k + 1 < tempi.length && tempi[k + 1].sec <= s) k++; const T = tempi[k]; return (T.tick + (s - T.sec) * 1e6 / T.us * div) / div; };
  return {format, division: div, notes: notes.sort((a, c) => a.t - c.t), pedal, duration: endT, quarters};
}
/* the piano's events: a note sounds until its key is released, or, if
   the pedal is down then, until the pedal lifts */
function pianoEvents(m, o = {}){
  const ups = [], ped = m.pedal.slice().sort((a, b) => a.t - b.t);
  let down = false;
  const spans = []; let from = 0;
  ped.forEach(e => { if(e.down && !down){ down = true; from = e.t; } else if(!e.down && down){ down = false; spans.push([from, e.t]); } });
  if(down) spans.push([from, m.duration + 5]);
  const release = off => { for(const [a, z] of spans) if(off >= a && off < z) return z; return off; };
  return m.notes.map(n => ({inst: o.inst || 'piano', t: n.t + (o.offset || 0), dur: Math.max(0.05, release(n.off) - n.t), midi: n.midi, vel: n.vel / 127}));
}
const api = {read, pianoEvents};
if(typeof module !== 'undefined' && module.exports) module.exports = api;
else root.midiRead = api;
})(typeof window !== 'undefined' ? window : this);
