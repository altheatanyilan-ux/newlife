/* ============================================================
   PROOF — the collection of wins

   A journal kind for what has actually been done: finished, survived, got right,
   was trusted with. Each entry is one piece of proof, said plainly — what
   happened, what it shows about me, how big it was, who saw it or said so (so
   it is outside my own head). Together they are the answer on the days the head
   says otherwise.

   It is a journal like any other (the sidebar has it, entries are written in the
   same dialog), plus three small things:
     read me some proof     one piece at a time, shuffled, on the Proof journal —
                            for the moment of doubt
     keep as proof          from the weekly review (a goal or a win that happened)
                            and from the overwhelm rescue page (a card, "a win to keep")
     in the rescue page     now and then one of the proofs is what leans in at the
                            edge, in place of a line to keep

   Nothing is scored or counted against anyone: there is no target number of wins.
   ============================================================ */
const PROOF_SIZES = [['small', 'small'], ['solid', 'solid'], ['big', 'big'], ['landmark', 'landmark']];
const proofAll = () => (S.entries || []).filter(e => e.type === 'proof');
function proofKeep({title = '', body = '', shows = '', saw = '', size = '', day = null, source = ''} = {}){
  const t = String(title || '').trim(); if(!t && !String(body || '').trim()) return null;
  const e = lifeEntryNew({type: 'proof', title: t.slice(0, 140), body: String(body || '').trim(), occurredAt: day || today(), tags: ['proof'],
    extra: Object.assign({}, shows ? {proofShows: shows} : {}, saw ? {proofSaw: saw} : {}, size ? {proofSize: size} : {}, source ? {proofFrom: source} : {})});
  saveNow(); return e;
}
function proofLine(e){ const x = e.extra || {}; return (e.title || (e.body || '').split('\n')[0] || 'a win').slice(0, 160) + (x.proofShows ? ' — ' + x.proofShows : ''); }
/* the banner at the top of the Proof journal */
function proofBannerHTML(){
  const n = proofAll().length;
  return `<div class="pf-banner rv"><p class="serif">Proof that I can. ${n ? `<b>${n}</b> piece${n === 1 ? '' : 's'} so far.` : 'Nothing yet — the first one is easy: what is something you did this week that you would have doubted a year ago?'}</p>
    ${n ? `<div class="row" style="gap:8px"><button class="btn primary" data-proofread>Read me some proof</button></div>` : ''}</div>`;
}
function proofRead(){
  const all = proofAll(); if(!all.length){ toast('No proof written yet.'); return; }
  let order = all.slice().sort(() => Math.random() - 0.5), i = 0;
  const m = openModal('<div id="pfCard"></div>', 'narrow');
  const draw = () => { const e = order[i % order.length], x = e.extra || {};
    m.querySelector('#pfCard').innerHTML = `<p class="mono faint">${esc(fmtDate(e.occurredAt, 'med'))}${x.proofSize ? ' · ' + esc(x.proofSize) : ''}</p>
      <h2 class="serif" style="font-style:italic;font-weight:400">${esc(e.title || 'A win')}</h2>
      ${e.body ? `<div class="prose">${md(e.body)}</div>` : ''}
      ${x.proofShows ? `<p><span class="mono faint">what it shows about me</span><br>${esc(x.proofShows)}</p>` : ''}
      ${x.proofSaw ? `<p class="muted"><span class="mono faint">who saw it, or said so</span><br>${esc(x.proofSaw)}</p>` : ''}
      <div class="row between" style="margin-top:14px"><span class="faint sm">${(i % order.length) + 1} of ${order.length}</span><span class="row" style="gap:8px"><button class="btn ghost" id="pfOpen">open it</button><button class="btn primary" id="pfNext">another</button></span></div>`;
    m.querySelector('#pfNext').onclick = () => { i++; sound('click'); draw(); };
    m.querySelector('#pfOpen').onclick = () => { m.remove(); openEntryModal({entryId: e.id}); }; };
  draw();
}
function bindProofBanner(root){ root.querySelectorAll('[data-proofread]').forEach(b => b.onclick = proofRead); }
