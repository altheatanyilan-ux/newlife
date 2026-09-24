#!/usr/bin/env node
/* Concatenates src/ into the single-file index.html.
   If dexie is installed (npm install), its UMD build is inlined before db.js
   so the database layer uses real Dexie; otherwise db.js falls back to its
   built-in MiniDexie (same API subset over IndexedDB). */
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src');
const parts = fs.readdirSync(src).filter(f => /^\d\d-.*\.(html|js)$/.test(f)).sort();
let dexie = '';
for(const p of ['node_modules/dexie/dist/dexie.min.js', 'node_modules/dexie/dist/dexie.js']){
  const f = path.join(__dirname, p); if(fs.existsSync(f)){ dexie = fs.readFileSync(f, 'utf8'); break; }
}
/* OpenSheetMusicDisplay engraves the scores in the practice room. It is a
   megabyte of somebody else's code, and a megabyte of JavaScript parsed at
   boot to serve one room most days go by without opening is a tax on every
   other room. So it does not go in the script the app lives in: it is written
   to the end of the document inside a <script type="text/plain">, which the
   browser stores and does not parse, and the room compiles it the first time
   somebody opens a score. Without it the room still keeps its notes and says
   plainly that the engraver is missing. */
let osmd = '';
{ const f = path.join(__dirname, 'node_modules/opensheetmusicdisplay/build/opensheetmusicdisplay.min.js');
  if(fs.existsSync(f)) osmd = fs.readFileSync(f, 'utf8'); }
if(osmd.includes('</script')){
  console.error('BUILD FAILED — the OSMD bundle contains a closing script tag and cannot be embedded as a payload.');
  process.exit(1);
}
let out = '';
for(const f of parts){
  if(f.startsWith('06-db') && dexie) out += `/* ---- dexie (inlined by build.js, Apache-2.0, https://dexie.org) ---- */\n${dexie}\n/* ---- end dexie ---- */\n`;
  out += fs.readFileSync(path.join(src, f), 'utf8');
}
/* Stylesheet and script partials end in a closing tag, so anything appended to
   the bottom of one lands outside it and renders as raw text on every page.
   That shipped once; catch it here instead of in the browser. */
function assertNothingStrayed(){
  const problems = [];
  for(const f of parts){
    if(!f.endsWith('.html')) continue;
    const body = fs.readFileSync(path.join(src, f), 'utf8');
    for(const close of ['</style>', '</head>', '</script>']){
      const at = body.lastIndexOf(close);
      if(at < 0) continue;
      const after = body.slice(at + close.length).replace(/<\/(head|body|html)>/g, '').trim();
      if(after) problems.push(`${f}: ${after.length} chars after the last ${close} — "${after.slice(0,60).replace(/\s+/g,' ')}…"`);
    }
  }
  if(problems.length){
    console.error('BUILD FAILED — content sits outside its enclosing tag:\n  ' + problems.join('\n  '));
    console.error('\nMove it above the closing tag. Appending to the end of these files does not work.');
    process.exit(1);
  }
}
/* A half-finished merge is the other way to ship a blank page: conflict
   markers inside src/ concatenate straight into the one <script> the app lives
   in, and the browser reports a syntax error nobody sees. Refuse to build. */
function assertNoConflictMarkers(){
  const bad = [];
  for(const f of parts){
    const body = fs.readFileSync(path.join(src, f), 'utf8');
    body.split('\n').forEach((line, i) => {
      if(/^(<{7}|={7}|>{7})(\s|$)/.test(line)) bad.push(`${f}:${i + 1}  ${line.slice(0, 60)}`);
    });
  }
  if(bad.length){
    console.error('BUILD FAILED — an unfinished merge is still in src/:\n  ' + bad.join('\n  '));
    console.error('\nResolve those files, then build again. Never hand-edit index.html to fix it.');
    process.exit(1);
  }
}
/* Every file in src/ shares one global scope, and a function declaration
   later in the bundle silently replaces an identical name earlier in it.
   Nothing warns you: the losing function simply never runs, and the caller
   gets a different shape back than it wrote. That has now cost two
   afternoons — dayRecord, then dayBlocks — so it is a build error.

   Only top-level declarations count. A name declared inside a function is
   somebody's local variable and is nobody else's business. */
function assertNoClashingNames(){
  const seen = new Map(), clash = [];
  for(const f of parts){
    if(!f.endsWith('.js')) continue;
    const text = fs.readFileSync(path.join(src, f), 'utf8');
    const names = new Set();
    for(const line of text.split('\n')){
      const m = /^(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=)/.exec(line);
      if(m) names.add(m[1] || m[2]);
    }
    for(const n of names){
      if(seen.has(n) && seen.get(n) !== f) clash.push(`${n}  (${seen.get(n)} and ${f})`);
      else seen.set(n, f);
    }
  }
  if(clash.length){
    console.error('BUILD FAILED — two files declare the same top-level name.\n' +
      'One global scope: the later file wins and the earlier one never runs.\n  ' +
      clash.join('\n  '));
    process.exit(1);
  }
}
/* ---------- every room's state has somewhere to be saved ----------
   The save pass walks META_KEYS and ARRAY_STORES, not the state object. A
   room that keeps its things under a top-level key nobody added to either
   list is a room whose things are written on every change and stored by
   nothing: it works perfectly all session and is empty the next morning.

   That happened to four rooms at once and was invisible, because everything
   in the app reads the state and not the database — the only way to see it
   is to reload, and by then the evidence is gone. So it is checked here
   instead. A key beginning with an underscore is the room's own scratch: a
   filter, a scroll position, which tab is open, none of which should
   outlive the session. */
function assertEverythingIsSaved(){
  const db = fs.readFileSync(path.join(src, '06-db.js'), 'utf8');
  const listed = name => {
    const m = new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];').exec(db);
    return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
  };
  const kept = new Set([...listed('META_KEYS'), ...listed('ARRAY_STORES'), 'habitLog', 'checkins']);
  const lost = new Map();
  for(const f of parts){
    if(!f.endsWith('.js')) continue;
    const text = fs.readFileSync(path.join(src, f), 'utf8');
    for(const m of text.matchAll(/\bS\.([A-Za-z][A-Za-z0-9_]*)\s*=(?!=)/g)){
      const k = m[1];
      if(kept.has(k) || lost.has(k)) continue;
      lost.set(k, f);
    }
  }
  if(lost.size){
    console.error('BUILD FAILED — state that nothing saves.\n' +
      'These are written to the state and are in neither META_KEYS nor ARRAY_STORES,\n' +
      'so everything they hold is thrown away on reload. Add the key to one of those\n' +
      'lists in src/06-db.js, or rename it with a leading underscore if it is scratch.\n  ' +
      [...lost].map(([k, f]) => `S.${k}  (${f})`).join('\n  '));
    process.exit(1);
  }
}
assertNoConflictMarkers();
assertNothingStrayed();
assertNoClashingNames();
assertEverythingIsSaved();

/* The engraver goes in last, after the script the app lives in has closed,
   where it is bytes rather than code until somebody asks for it. */
if(osmd){
  const tag = `<script type="text/plain" id="osmdSrc">\n${osmd}\n<\/script>\n`;
  const at = out.lastIndexOf('</body>');
  out = at > -1 ? out.slice(0, at) + tag + out.slice(at) : out + tag;
}

/* The grand piano: thirty recorded notes of the Salamander Grand Piano V3
   (vendor/salamander, CC BY 3.0 — see its LICENSE.md), in the same kind of
   payload as the engraver: text the browser stores and never parses, turned
   into sound the first time a room with music in it asks for it. */
let piano = null;
const pianoDir = path.join(__dirname, 'vendor', 'salamander');
if(fs.existsSync(pianoDir)){
  const files = fs.readdirSync(pianoDir).filter(f => /\.mp3$/i.test(f)).sort();
  if(files.length){
    piano = {};
    files.forEach(f => { piano[f.replace(/\.mp3$/i, '')] = fs.readFileSync(path.join(pianoDir, f)).toString('base64'); });
  }
}
let pianoBytes = 0;
if(piano){
  const body = JSON.stringify(piano);
  pianoBytes = body.length;
  const tag = `<script type="text/plain" id="grandPianoSrc">${body}<\/script>\n`;
  const at = out.lastIndexOf('</body>');
  out = at > -1 ? out.slice(0, at) + tag + out.slice(at) : out + tag;
}

fs.writeFileSync(path.join(__dirname, 'index.html'), out);

/* The service worker holds a copy of index.html for offline use, and the only
   signal a browser uses to fetch a new worker is the worker file's own bytes
   changing. Stamping the build's hash into it is what makes a deploy actually
   reach a phone that already has the app installed — without this line the
   first version anyone installs is the version they keep. */
function stampServiceWorker(){
  const swPath = path.join(__dirname, 'sw.js');
  if(!fs.existsSync(swPath)) return '';
  const hash = require('crypto').createHash('sha256').update(out).digest('hex').slice(0, 12);
  const sw = fs.readFileSync(swPath, 'utf8');
  const stamped = sw.replace(/^const BUILD = '[^']*';/m, `const BUILD = '${hash}';`);
  if(stamped === sw && !sw.includes(`const BUILD = '${hash}';`)){
    console.error("BUILD FAILED — sw.js has no `const BUILD = '…';` line to stamp.");
    process.exit(1);
  }
  if(stamped !== sw) fs.writeFileSync(swPath, stamped);
  return hash;
}
const build = stampServiceWorker();
console.log(`index.html written (${(out.length/1024).toFixed(0)} KB) — database layer: ${dexie ? 'Dexie (inlined)' : 'built-in MiniDexie fallback'}`
  + ` — score engraver: ${osmd ? `OSMD (${(osmd.length/1024).toFixed(0)} KB, parsed on first use)` : 'not installed'}`
  + ` — grand piano: ${piano ? `${Object.keys(piano).length} samples (${(pianoBytes/1024).toFixed(0)} KB)` : 'not fetched (sh tools/fetch-grand-piano.sh)'}`
  + `${build ? ` — build ${build}` : ''}`);
