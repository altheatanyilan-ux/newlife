/* ============================================================
   THE KNOWLEDGE TREE — what paper cannot do.

   EXPERIMENTS. Trials, hits and the rate chance would give. The hit rate,
   and the exact one-sided binomial p-value — the chance of at least this
   many hits if only chance were at work — summed in log space, so a
   thousand trials do not overflow. Shown with the method and the misses,
   because a hit rate without its misses is how people fool themselves.

   SEALED PREDICTIONS. A statement, a confidence, a date to know by, and a
   SHA-256 of all of it, taken when it is saved. crypto.subtle where the
   browser has it; otherwise the small implementation below, which gives the
   same digest (the tests compare them). A sealed prediction cannot be
   changed. Later it is resolved true or false — once — and the calibration
   view shows the Brier score and how often you were right at each level of
   confidence.
   ============================================================ */

/* ---------- the binomial, in logs ---------- */
/* ln n!, summed once and kept: trials and hits are whole numbers, so this is
   exact to rounding, where the usual gamma approximations drift in the
   eighth digit */
const _treeLF = [0];
function treeLnFact(n){ for(let i = _treeLF.length; i <= n; i++) _treeLF[i] = _treeLF[i - 1] + Math.log(i); return _treeLF[n]; }
function treeLnChoose(n, k){ return treeLnFact(n) - treeLnFact(k) - treeLnFact(n - k); }
/* P(X ≥ k) for X ~ Binomial(n, p) */
function treeBinomTail(k, n, p){
  if(k <= 0) return 1; if(k > n) return 0;
  if(p <= 0) return 0; if(p >= 1) return 1;
  const lp = Math.log(p), lq = Math.log1p(-p);
  let max = -Infinity; const terms = [];
  for(let i = k; i <= n; i++){ const l = treeLnChoose(n, i) + i * lp + (n - i) * lq; terms.push(l); if(l > max) max = l; }
  let s = 0; for(const l of terms) s += Math.exp(l - max);
  return Math.min(1, Math.exp(max + Math.log(s)));
}
function treeExperimentResult(x){
  const n = Math.max(0, Math.round(+x.trials)), k = Math.max(0, Math.min(n, Math.round(+x.hits))), p = +x.chanceRate;
  const pv = treeBinomTail(k, n, p);
  return {n, k, p, misses: n - k, rate: n ? k / n : 0, expected: n * p, pValue: pv};
}
function treeFmtP(p){ return p < 1e-4 ? p.toExponential(2) : p < 0.001 ? p.toFixed(5) : p.toFixed(4); }
function treeAddExperiment(nodeId, o){
  const trials = Math.round(+o.trials), hits = Math.round(+o.hits), chance = +o.chanceRate;
  if(!(trials > 0)) return {error: 'How many trials?'};
  if(!(hits >= 0 && hits <= trials)) return {error: 'Hits must be between 0 and the number of trials.'};
  if(!(chance > 0 && chance < 1)) return {error: 'The chance rate is a fraction between 0 and 1 — 0.25 for one in four.'};
  if(!String(o.method || '').trim()) return {error: 'Say how it was done; a result without its method means little.'};
  const r = {id: uid(), nodeId, date: o.date || treeToday(), trials, hits, chanceRate: chance, method: String(o.method).trim(), notes: String(o.notes || '').trim(), createdAt: treeNow()};
  S.treeExperiments.push(r); treeTouch(nodeId); treeDirty(); save(); return {experiment: r};
}

/* ---------- SHA-256 ---------- */
/* The fallback: FIPS 180-4 over the UTF-8 bytes, for browsers where
   crypto.subtle is missing (an insecure context). Same input, same digest. */
function treeSha256Fallback(str){
  const bytes = new TextEncoder().encode(str);
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const len = bytes.length, padLen = ((len + 9 + 63) >> 6) << 6, m = new Uint8Array(padLen);
  m.set(bytes); m[len] = 0x80;
  const bits = len * 8, dv = new DataView(m.buffer);
  dv.setUint32(padLen - 8, Math.floor(bits / 0x100000000)); dv.setUint32(padLen - 4, bits >>> 0);
  const W = new Uint32Array(64), rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for(let o = 0; o < padLen; o += 64){
    for(let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for(let i = 16; i < 64; i++){ const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10); W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for(let i = 0; i < 64; i++){
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0; H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return [...H].map(x => x.toString(16).padStart(8, '0')).join('');
}
async function treeSha256(str){
  try {
    if(globalThis.crypto && crypto.subtle && crypto.subtle.digest){
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return {hex: [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''), via: 'crypto.subtle'};
    }
  } catch(e){}
  return {hex: treeSha256Fallback(str), via: 'fallback'};
}
/* what is sealed: the statement, the confidence, when, by when, and where */
function treeSealText(p){ return JSON.stringify(['life-instrument/prediction/v1', p.nodeId, p.createdAt, p.statement, p.confidence, p.resolveBy || '']); }

/* ---------- predictions: sealed, then resolved once ---------- */
async function treeSealPrediction(nodeId, statement, confidence, resolveBy){
  const st = String(statement || '').trim(); if(!st) return {error: 'A prediction needs a statement that can turn out true or false.'};
  const c = Math.round(+confidence); if(!(c >= 0 && c <= 100)) return {error: 'Confidence is 0–100.'};
  const base = {id: uid(), nodeId, createdAt: treeNow(), statement: st, confidence: c, resolveBy: resolveBy || ''};
  const h = await treeSha256(treeSealText(base));
  const row = Object.freeze(Object.assign(base, {hash: h.hex, algo: 'SHA-256', via: h.via, resolvedAt: null, outcome: null}));
  S.treePredictions.push(row); treeTouch(nodeId); save();
  return {prediction: row};
}
function treeResolvePrediction(id, outcome, note){
  const i = S.treePredictions.findIndex(p => p.id === id); if(i < 0) return 'No such prediction.';
  const p = S.treePredictions[i]; if(p.resolvedAt) return 'That prediction is already resolved; its outcome cannot change.';
  if(outcome !== true && outcome !== false) return 'True or false?';
  S.treePredictions[i] = Object.freeze(Object.assign({}, p, {resolvedAt: treeNow(), outcome, resolutionNote: String(note || '').trim()}));
  save(); return null;
}
async function treeVerifySeal(p){ const h = await treeSha256(treeSealText(p)); return h.hex === p.hash; }
function treeCalibration(list){
  const done = (list || S.treePredictions).filter(p => p.resolvedAt && (p.outcome === true || p.outcome === false));
  if(!done.length) return null;
  const brier = done.reduce((a, p) => a + Math.pow(p.confidence / 100 - (p.outcome ? 1 : 0), 2), 0) / done.length;
  const bins = [];
  for(let lo = 0; lo < 100; lo += 10){
    const hi = lo === 90 ? 100.1 : lo + 10, inb = done.filter(p => p.confidence >= lo && p.confidence < hi);
    if(inb.length) bins.push({lo, hi: Math.min(100, hi), n: inb.length, stated: inb.reduce((a, p) => a + p.confidence, 0) / inb.length / 100, actual: inb.filter(p => p.outcome).length / inb.length});
  }
  return {n: done.length, brier, bins, right: done.filter(p => (p.confidence >= 50) === p.outcome).length};
}
function treeCalibrationSVG(c){
  const S2 = 220, P = 26, sc = v => P + v * (S2 - 2 * P);
  return `<svg class="tr-calib" viewBox="0 0 ${S2} ${S2}" role="img" aria-label="Calibration: stated confidence against how often it came true">
    <rect x="${P}" y="${P}" width="${S2 - 2 * P}" height="${S2 - 2 * P}" class="bg"/>
    <line x1="${sc(0)}" y1="${S2 - sc(0)}" x2="${sc(1)}" y2="${S2 - sc(1)}" class="diag"/>
    ${[0, .5, 1].map(v => `<text x="${sc(v)}" y="${S2 - 8}" text-anchor="middle">${v * 100}%</text><text x="${P - 4}" y="${S2 - sc(v) + 3}" text-anchor="end">${v * 100}</text>`).join('')}
    ${c.bins.map(b => `<circle cx="${sc(b.stated).toFixed(1)}" cy="${(S2 - sc(b.actual)).toFixed(1)}" r="${Math.min(11, 3 + Math.sqrt(b.n) * 2).toFixed(1)}" class="pt"><title>stated ${Math.round(b.stated * 100)}%, came true ${Math.round(b.actual * 100)}% (${b.n})</title></circle>`).join('')}
    <text x="${S2 / 2}" y="12" text-anchor="middle">came true</text></svg>`;
}

/* ---------- on a page ---------- */
function treeProofOnPageHTML(n){
  const ex = S.treeExperiments.filter(x => x.nodeId === n.id).sort((a, b) => b.date.localeCompare(a.date));
  const pr = S.treePredictions.filter(x => x.nodeId === n.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if(!ex.length && !pr.length) return '';
  return `<section class="tr-sec"><div class="tr-sechead"><h2>Evidence</h2><span class="faint">experiments and sealed predictions</span></div>
    ${ex.map(treeExperimentHTML).join('')}${pr.map(treePredictionHTML).join('')}</section>`;
}
function treeExperimentHTML(x){
  const r = treeExperimentResult(x);
  return `<div class="tr-exp"><div class="tr-exprow"><b>${r.k} of ${r.n}</b><span>hit rate ${(r.rate * 100).toFixed(1)}% against ${(r.p * 100).toFixed(1)}% by chance</span><span>${r.misses} misses</span>
    <span class="tr-p ${r.pValue < 0.01 ? 'low' : ''}">p = ${treeFmtP(r.pValue)}</span><span class="faint">${esc(x.date)}</span></div>
    <p class="faint">Method: ${esc(x.method)}${x.notes ? ` · ${esc(x.notes)}` : ''}</p>
    <p class="faint">If only chance were at work, ${r.k} or more hits in ${r.n} would happen with probability ${treeFmtP(r.pValue)} (exact one-sided binomial; ${r.expected.toFixed(1)} expected).</p></div>`;
}
function treePredictionHTML(p){
  return `<div class="tr-pred${p.resolvedAt ? (p.outcome ? ' true' : ' false') : ''}" data-trpred="${p.id}"><div class="tr-exprow"><span class="tr-seal" title="SHA-256 ${esc(p.hash)} (${esc(p.via)})">⬢ sealed</span><b>${esc(p.statement)}</b><span>${p.confidence}%</span>
    ${p.resolveBy ? `<span class="faint">by ${esc(p.resolveBy)}</span>` : ''}</div>
    <p class="faint mono tr-hash">${esc(p.hash.slice(0, 16))}… · ${esc(fmtDate(p.createdAt.slice(0, 10), 'med'))}</p>
    ${p.resolvedAt ? `<p>Came out <b>${p.outcome ? 'true' : 'false'}</b> (${esc(fmtDate(p.resolvedAt.slice(0, 10), 'med'))})${p.resolutionNote ? ` — ${esc(p.resolutionNote)}` : ''}</p>`
      : `<div class="row" style="gap:6px"><button class="tbtn sm" data-trpo="1">It came true</button><button class="tbtn sm" data-trpo="0">It did not</button><button class="tbtn sm" data-trpv>Check the seal</button></div>`}</div>`;
}
function treeBindProof(root, n){
  root.querySelectorAll('[data-trpred]').forEach(el => {
    const p = S.treePredictions.find(x => x.id === el.dataset.trpred);
    el.querySelectorAll('[data-trpo]').forEach(b => b.onclick = async () => { const note = await treeAsk(`It ${b.dataset.trpo === '1' ? 'came true' : 'did not'} — a note on how you know? (optional)`, ''); if(note === null) return;
      const err = treeResolvePrediction(p.id, b.dataset.trpo === '1', note); if(err) toast(err); rerender(); });
    const v = el.querySelector('[data-trpv]'); if(v) v.onclick = async () => toast(await treeVerifySeal(p) ? 'The seal is intact: nothing has changed since it was saved.' : 'The seal does not match. This prediction has been altered.', 5000);
  });
  void n;
}
function treePredictDialog(n, after){
  const m = openModal(`<h2 class="serif">Seal a prediction</h2><p class="faint">Something that will turn out true or false. Once sealed it cannot be changed — only resolved.</p>
    <label class="tr-f"><span>The prediction</span><textarea class="inp" id="tdS" rows="3"></textarea></label>
    <div class="tr-frow"><label class="tr-f"><span>How sure <b id="tdV">70</b>%</span><input type="range" min="0" max="100" value="70" id="tdC"></label><label class="tr-f"><span>Known by</span><input class="inp" type="date" id="tdBy"></label></div>
    <p class="tr-err" id="tdErr"></p><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="tdNo">Cancel</button><button class="btn primary" id="tdOk">Seal it</button></div>`, 'narrow');
  const $m = id => m.querySelector(id);
  $m('#tdC').oninput = () => $m('#tdV').textContent = $m('#tdC').value;
  $m('#tdNo').onclick = () => m.remove();
  $m('#tdOk').onclick = async () => { const r = await treeSealPrediction(n.id, $m('#tdS').value, $m('#tdC').value, $m('#tdBy').value); if(r.error){ $m('#tdErr').textContent = r.error; return; } m.remove(); toast('Sealed.'); after && after(); };
}
function treeExperimentDialog(n, after){
  const m = openModal(`<h2 class="serif">Record an experiment</h2>
    <div class="tr-frow"><label class="tr-f"><span>Trials</span><input class="inp" type="number" min="1" id="txN"></label><label class="tr-f"><span>Hits</span><input class="inp" type="number" min="0" id="txK"></label>
      <label class="tr-f"><span>Chance rate</span><input class="inp" type="number" min="0.001" max="0.999" step="0.001" id="txP" value="0.25"></label><label class="tr-f"><span>Date</span><input class="inp" type="date" id="txD" value="${treeToday()}"></label></div>
    <label class="tr-f"><span>Method <small>required — targets, blinding, who judged, how chance was set</small></span><textarea class="inp" id="txM" rows="3"></textarea></label>
    <label class="tr-f"><span>Notes</span><input class="inp" id="txNo"></label>
    <div class="tr-expprev" id="txPrev"></div>
    <p class="tr-err" id="txErr"></p><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" id="txCancel">Cancel</button><button class="btn primary" id="txOk">Record</button></div>`, 'narrow');
  const $m = id => m.querySelector(id);
  const prev = () => { const n2 = +$m('#txN').value, k = +$m('#txK').value, p = +$m('#txP').value;
    $m('#txPrev').innerHTML = n2 > 0 && k >= 0 && k <= n2 && p > 0 && p < 1 ? (() => { const r = treeExperimentResult({trials: n2, hits: k, chanceRate: p}); return `hit rate ${(r.rate * 100).toFixed(1)}% · ${r.misses} misses · p = ${treeFmtP(r.pValue)}`; })() : ''; };
  ['#txN', '#txK', '#txP'].forEach(id => $m(id).oninput = prev);
  $m('#txCancel').onclick = () => m.remove();
  $m('#txOk').onclick = () => { const r = treeAddExperiment(n.id, {trials: $m('#txN').value, hits: $m('#txK').value, chanceRate: $m('#txP').value, date: $m('#txD').value, method: $m('#txM').value, notes: $m('#txNo').value});
    if(r.error){ $m('#txErr').textContent = r.error; return; } m.remove(); after && after(); };
}

/* ---------- the proof page ---------- */
function treeProofRoute(root){
  const c = treeCalibration();
  const open = S.treePredictions.filter(p => !p.resolvedAt).sort((a, b) => String(a.resolveBy || '9').localeCompare(String(b.resolveBy || '9')));
  const done = S.treePredictions.filter(p => p.resolvedAt).sort((a, b) => b.resolvedAt.localeCompare(a.resolvedAt));
  const ex = S.treeExperiments.slice().sort((a, b) => b.date.localeCompare(a.date));
  const tot = ex.reduce((a, x) => ({n: a.n + x.trials, k: a.k + x.hits}), {n: 0, k: 0});
  root.innerHTML = `<div class="page tr-page">${treeNav('proof')}
    <header class="tr-head"><h1 class="serif">Proof</h1><p class="tr-lede">What the tree has put to the test: sealed predictions and how well-calibrated they were, and the experiments with their misses.</p></header>
    <section class="tr-sec"><div class="tr-sechead"><h2>Calibration</h2><span class="faint">${c ? `${c.n} resolved` : 'nothing resolved yet'}</span></div>
      ${c ? `<div class="tr-calgrid">${treeCalibrationSVG(c)}<div><p>Brier score <b>${c.brier.toFixed(3)}</b> <span class="faint">(0 is perfect; always saying 50% scores 0.25)</span></p>
        <p>Right on ${c.right} of ${c.n} (${Math.round(c.right / c.n * 100)}%), counting 50% and over as a yes.</p>
        <table class="tr-caltable"><thead><tr><th>Stated</th><th>Predictions</th><th>Came true</th></tr></thead><tbody>${c.bins.map(b => `<tr><td>${b.lo}–${Math.round(b.hi)}%</td><td>${b.n}</td><td>${Math.round(b.actual * 100)}%</td></tr>`).join('')}</tbody></table></div></div>`
        : '<p class="faint">Seal predictions on a page (its ⋯ menu), resolve them when you know, and this fills in.</p>'}</section>
    <section class="tr-sec"><div class="tr-sechead"><h2>Open predictions</h2><span class="faint">${open.length}</span></div>${open.map(p => { const n = treeNode(p.nodeId); return `<div class="tr-predwrap"><a class="faint" href="${n ? treeUrl(n) : '#'}">${esc(n ? n.title : '')}</a>${treePredictionHTML(p)}</div>`; }).join('') || '<p class="faint">None.</p>'}</section>
    ${done.length ? `<details class="tr-earlier"><summary>Resolved (${done.length})</summary>${done.map(treePredictionHTML).join('')}</details>` : ''}
    <section class="tr-sec"><div class="tr-sechead"><h2>Experiments</h2><span class="faint">${ex.length ? `${ex.length} · ${tot.k} hits in ${tot.n} trials in all` : 'none recorded'}</span></div>
      ${ex.map(x => { const n = treeNode(x.nodeId); return `<div class="tr-predwrap"><a class="faint" href="${n ? treeUrl(n) : '#'}">${esc(n ? n.title : '')}</a>${treeExperimentHTML(x)}</div>`; }).join('')}</section>
  </div>`;
  treeBindNav(root); treeBindProof(root, null);
}
