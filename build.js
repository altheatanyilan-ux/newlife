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
fs.writeFileSync(path.join(__dirname, 'index.html'), out);
console.log(`index.html written (${(out.length/1024).toFixed(0)} KB) — database layer: ${dexie ? 'Dexie (inlined)' : 'built-in MiniDexie fallback'}`);
