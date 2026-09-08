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
assertNothingStrayed();

fs.writeFileSync(path.join(__dirname, 'index.html'), out);
console.log(`index.html written (${(out.length/1024).toFixed(0)} KB) — database layer: ${dexie ? 'Dexie (inlined)' : 'built-in MiniDexie fallback'}`);
