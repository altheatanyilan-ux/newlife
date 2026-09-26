/* ============================================================
   SONGWRITING STUDIO — SONGS
   The Song Desk (a song's brief, plot, boxes and sections; Stolpe's Ten
   Steps for a capstone song; the Rewrite Room, where the checklist is run
   against the lyric), the Songbook shelf, the Listening Room, and a print
   view. A song: {id, title, brief, status 'draft'|'finished', plot {type,
   steps[]}, boxes[], sections [{id, type, feel, lines [{text, stress?}],
   prog?, melodyId?}], rewrite {item: true}, versions [{at, lines}],
   capstone?, tenStep?, tenNotes {}, createdAt, updatedAt}.
   ============================================================ */
const SNG_PLOTS = [[1, 'Plot 1: the situation, then how it feels, then what it means', ['What is happening (external)', 'How it feels (internal)', 'What it means now']],
  [2, 'Plot 2: then, now, next', ['Then (the past)', 'Now (the present)', 'Next (the future, or what changes)']]];
SNG_TOOL_VIEWS['song-desk'] = {
  html(){
    const st = sngState(), u = sngUi();
    const song = u.songId ? st.songs.find(s => s.id === u.songId) : null;
    if(!song) return `<div class="card"><div class="sng-row"><input class="inp serif" id="sdTitle" placeholder="a working title…"><button class="btn primary" id="sdNew">New song</button></div>
        <textarea class="inp sng-ta" rows="2" id="sdBrief" placeholder="The brief: what is it about? Who is singing, to whom, where, when, and why now?"></textarea></div>
      ${st.songs.length ? `<div class="sng-exlist">${st.songs.map(s => `<a class="sng-ex${s.status === 'finished' ? ' done' : ''}" href="#/songwriting/song/${esc(s.id)}"><span class="mono">${s.status === 'finished' ? '✓' : '…'}</span>
        <span class="sng-ex-t"><b>${esc(s.title)}</b><span class="muted">${esc(s.brief || 'no brief yet')}</span></span><span class="mono faint">${s.sections.length} section${s.sections.length === 1 ? '' : 's'}${s.capstone ? ' · Ten-Step' : ''}</span></a>`).join('')}</div>`
        : `<p class="empty">No songs yet. Start one — a bad one is the point of 0.4.</p>`}`;
    sngSongDefaults(song);
    const lines = song.sections.flatMap(s => s.lines.map(l => l.text || '')).filter(Boolean);
    const checks = sngRewriteChecks(song);
    return `<div class="sng-row"><a class="tbtn" href="#/songwriting/tool/song-desk" data-sdback>← all songs</a><span class="grow"></span>
      <button class="tbtn" id="sdPrint">print</button><button class="tbtn" id="sdSheet">open in the Lyric Sheet</button>
      <select class="inp" id="sdStatus">${[['draft', 'draft'], ['finished', 'finished — in the Songbook']].map(([k, n]) => `<option value="${k}" ${song.status === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button class="del-x inline" id="sdDel" aria-label="throw the song away">×</button></div>
    <div class="card"><input class="inp serif sng-songtitle" id="sdT" value="${esc(song.title)}">
      <textarea class="inp sng-ta" rows="2" id="sdB" placeholder="The brief: who, to whom, where, when, why now?">${esc(song.brief)}</textarea>
      <div class="sng-grid2"><label>Point of view <select class="inp" id="sdPov">${['', 'first person', 'second person (direct address)', 'third person'].map(p => `<option ${song.pov === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
        <label>Tense <select class="inp" id="sdTense">${['', 'present', 'past', 'future'].map(p => `<option ${song.tense === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label></div></div>
    ${song.capstone ? sngTenStepHTML(song) : ''}
    <div class="card"><div class="sng-card-h"><b>Plot</b><span class="mono faint">Stolpe</span></div>
      <div class="sng-row">${SNG_PLOTS.map(([k, n]) => `<button class="tbtn${(song.plot.type || 1) === k ? ' on' : ''}" data-sdplot="${k}">${esc(n)}</button>`).join('')}</div>
      ${(SNG_PLOTS.find(p => p[0] === (song.plot.type || 1)) || SNG_PLOTS[0])[2].map((lab, i) => `<label class="sng-field"><span>${esc(lab)}</span><input class="inp" data-sdplotstep="${i}" value="${esc(song.plot.steps[i] || '')}"></label>`).join('')}</div>
    <div class="card"><div class="sng-card-h"><b>Boxes</b><span class="mono faint">one sentence each — Pattison, WBL</span></div>
      ${[0, 1, 2].map(i => `<label class="sng-field"><span>${['Verse 1 box', 'Verse 2 box', 'Bridge box'][i]}</span><input class="inp" data-sdbox="${i}" value="${esc(song.boxes[i] || '')}"></label>`).join('')}
      <p class="muted">Check: does the chorus mean more after each box?</p></div>
    <div class="card"><div class="sng-card-h"><b>Sections</b><span class="grow"></span><button class="tbtn" id="sdAddSec">＋ section</button></div>
      ${song.sections.map((sec, i) => `<div class="sng-sdsec"><div class="sng-row"><select class="inp" data-sdsectype="${i}">${SNG_SECTION_TYPES.map(t => `<option ${sec.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <span class="mono faint">${sec.prog ? esc(sec.prog.join('–')) : 'no chords yet'}</span><button class="tbtn" data-sdprog="${i}">use the Chord Lab's</button>
          ${sec.prog ? `<button class="tbtn" data-sdplay="${i}">▶</button>` : ''}<span class="grow"></span><button class="del-x inline" data-sdsecdel="${i}">×</button></div>
        <textarea class="inp sng-ta serif" rows="${Math.max(3, sec.lines.length)}" data-sdlines="${i}">${esc(sec.lines.map(l => l.text || '').join('\n'))}</textarea></div>`).join('') || '<p class="muted">No sections yet.</p>'}</div>
    <div class="card sng-rewrite"><div class="sng-card-h"><b>Rewrite Room</b><span class="mono faint">the checklist, with what the room can measure measured</span>
      <span class="grow"></span><button class="tbtn" id="sdSnap">keep this version</button></div>
      <ul>${SNG_CAPSTONE.rewriteChecklist.map((item, i) => { const auto = checks[i];
        return `<li><label><input type="checkbox" data-sdrw="${i}" ${song.rewrite[i] ? 'checked' : ''}> ${esc(item)}</label>${auto ? `<span class="sng-auto ${auto.ok ? 'ok' : 'no'}">${esc(auto.say)}</span>` : ''}</li>`; }).join('')}</ul>
      ${(song.versions || []).length ? `<details><summary class="mono faint">earlier versions (${song.versions.length})</summary>${song.versions.slice().reverse().map(v => `<div class="sng-version"><span class="mono faint">${esc(v.at.slice(0, 16).replace('T', ' '))}</span><pre class="serif">${esc(v.text)}</pre></div>`).join('')}</details>` : ''}
      ${lines.length ? '' : '<p class="muted">Write some lines and the room will measure them.</p>'}</div>`;
  },
  bind(host){
    const st = sngState(), u = sngUi(), q = s => host.querySelector(s);
    const song = u.songId ? st.songs.find(s => s.id === u.songId) : null;
    const touch = () => { if(song) song.updatedAt = new Date().toISOString(); saveNow(); };
    if(!song){
      q('#sdNew').onclick = () => { const s = sngSongDefaults({title: q('#sdTitle').value.trim() || 'Untitled', brief: q('#sdBrief').value.trim(),
        sections: [{type: 'verse', feel: 'unstable', lines: [{text: ''}, {text: ''}, {text: ''}, {text: ''}]}, {type: 'chorus', feel: 'stable', lines: [{text: ''}, {text: ''}, {text: ''}, {text: ''}]}]});
        st.songs.unshift(s); sngLogSession('song', s.id); sngBadgeCheck(); saveNow(); navigate('#/songwriting/song/' + s.id); };
      return;
    }
    const b = q('[data-sdback]'); if(b) b.onclick = () => { u.songId = null; };
    q('#sdT').onchange = e => { song.title = e.target.value.trim() || 'Untitled'; touch(); };
    q('#sdB').onchange = e => { song.brief = e.target.value; touch(); };
    q('#sdPov').onchange = e => { song.pov = e.target.value; touch(); };
    q('#sdTense').onchange = e => { song.tense = e.target.value; touch(); };
    q('#sdStatus').onchange = e => { song.status = e.target.value; touch(); sngBadgeCheck(); if(song.status === 'finished'){ sound('success'); toast(`${esc(song.title)} is in the Songbook.`); } rerender(); };
    q('#sdDel').onclick = () => requestDelete({label: song.title, node: host, after: () => navigate('#/songwriting/tool/song-desk'), remove: () => { const back = spliceOut(st.songs, x => x.id === song.id); u.songId = null; saveNow(); return back; }});
    q('#sdSheet').onclick = () => { u.sheetSong = song.id; navigate('#/songwriting/tool/lyric-sheet'); };
    q('#sdPrint').onclick = () => sngPrintSong(song);
    $$('[data-sdplot]', host).forEach(x => x.onclick = () => { song.plot.type = +x.dataset.sdplot; touch(); rerender(); });
    $$('[data-sdplotstep]', host).forEach(x => x.onchange = () => { song.plot.steps[+x.dataset.sdplotstep] = x.value; touch(); });
    $$('[data-sdbox]', host).forEach(x => x.onchange = () => { song.boxes[+x.dataset.sdbox] = x.value; touch(); });
    q('#sdAddSec').onclick = () => { song.sections.push({id: uid(), type: 'verse', feel: 'unstable', lines: [{text: ''}]}); touch(); rerender(); };
    $$('[data-sdsectype]', host).forEach(x => x.onchange = () => { song.sections[+x.dataset.sdsectype].type = x.value; touch(); });
    $$('[data-sdsecdel]', host).forEach(x => x.onclick = () => { song.sections.splice(+x.dataset.sdsecdel, 1); touch(); rerender(); });
    $$('[data-sdlines]', host).forEach(x => x.onchange = () => { const sec = song.sections[+x.dataset.sdlines];
      const old = sec.lines; sec.lines = x.value.split('\n').map(t => { const was = old.find(l => l.text === t); return was || {text: t}; }); touch(); rerender(); });
    $$('[data-sdprog]', host).forEach(x => x.onclick = () => { const L = sngLabState(); const sec = song.sections[+x.dataset.sdprog]; sec.prog = L.prog.slice(); sec.keyPc = L.keyPc; sec.colour = L.colour; sec.styleId = L.styleId; sec.bpm = L.bpm; touch(); rerender(); });
    $$('[data-sdplay]', host).forEach(x => x.onclick = () => { const sec = song.sections[+x.dataset.sdplay]; if(!sec.prog) return;
      sngPlaySeed({chords: sec.prog.map(r => sngParseRoman(r)).filter(Boolean), keyPc: sec.keyPc || 0, colour: sec.colour, styleId: sec.styleId, bpm: sec.bpm}); });
    $$('[data-sdrw]', host).forEach(x => x.onchange = () => { song.rewrite[+x.dataset.sdrw] = x.checked; touch(); });
    q('#sdSnap').onclick = () => { song.versions = song.versions || []; song.versions.push({at: new Date().toISOString(), text: sngSongText(song)}); if(song.versions.length > 30) song.versions.shift(); touch(); toast('This version is kept.'); rerender(); };
    if(song.capstone) bindSngTenStep(host, song);
  }
};
const sngSongText = s => s.sections.map(sec => `[${sec.type}]\n` + sec.lines.map(l => l.text || '').join('\n')).join('\n\n');
/* the checks the room can run, one for each item of the rewrite checklist
   it can measure (by index); the others are the writer's to tick */
function sngRewriteChecks(song){
  const secs = song.sections.filter(s => s.lines.some(l => (l.text || '').trim()));
  if(!secs.length) return {};
  const out = {};
  /* 0: show before tell */
  const all = secs.flatMap(s => s.lines.map(l => l.text || '').filter(Boolean));
  const firstAbs = all.findIndex(l => sngShowTell(l).abstract.length);
  const firstCon = all.findIndex(l => !sngShowTell(l).abstract.length && sngShowTell(l).concreteish > 0);
  out[0] = firstAbs < 0 ? {ok: true, say: 'no abstract words at all'} : {ok: firstCon >= 0 && firstCon < firstAbs, say: firstCon >= 0 && firstCon < firstAbs ? 'an image comes before the first abstract word' : `line ${firstAbs + 1} tells before anything shows`};
  /* 2: trigger line */
  const ci = song.sections.findIndex(s => s.type === 'chorus');
  if(ci > 0){ const pre = song.sections[ci - 1], last = [...pre.lines].reverse().find(l => (l.text || '').trim()); out[2] = {ok: !!last, say: last ? `trigger: “${last.text}”` : 'no line before the chorus'}; }
  /* 4: POV and tense */
  const pt = sngPovTense(all.join(' ')), povs = [pt.pov.first, pt.pov.second, pt.pov.third].filter(Boolean).length;
  out[4] = {ok: povs <= 2 && pt.tense !== 'mixed', say: `${povs} point${povs === 1 ? '' : 's'} of view, tense ${pt.tense}`};
  /* 5: clichés */
  const cl = sngClicheFlags(all); out[5] = {ok: !cl.length, say: cl.length ? `worn: ${cl.join('; ')}` : 'no worn rhymes or phrases found'};
  /* 6: stability matches the emotion */
  const mism = secs.filter(s => { const sc = sngStability(s).score; return s.feel && ((sc >= 0.6) !== (s.feel === 'stable')); });
  out[6] = {ok: !mism.length, say: mism.length ? `${mism.map(s => s.type).join(', ')} not as stable as meant` : 'each section as stable as meant'};
  /* 9: contrast between neighbouring sections */
  const pairs = []; for(let i = 1; i < secs.length; i++) if(secs[i].type !== secs[i - 1].type) pairs.push(sngContrast(secs[i - 1], secs[i]).diff.length);
  if(pairs.length) out[9] = {ok: pairs.every(n => n >= 3), say: `elements that differ between sections: ${pairs.join(', ')} (of 5)`};
  return out;
}
/* the Ten Steps, as a wizard on a capstone song */
function sngTenStepHTML(song){
  const i = Math.min(9, song.tenStep || 0), notes = song.tenNotes || {};
  return `<div class="card sng-ten"><div class="sng-card-h"><b>Ten Steps</b><span class="mono faint">Stolpe · step ${i + 1} of 10</span></div>
    <ol class="sng-ten-list">${SNG_CAPSTONE.tenSteps.map((s, k) => `<li class="${k < i ? 'done' : k === i ? 'now' : ''}"><button class="tbtn" data-tenstep="${k}">${esc(s)}</button></li>`).join('')}</ol>
    <label class="sng-field"><span>${esc(SNG_CAPSTONE.tenSteps[i])}</span><textarea class="inp sng-ta" rows="4" id="tenNote">${esc(notes[i] || '')}</textarea></label>
    <div class="sng-row"><button class="btn sm" id="tenNext">${i < 9 ? 'Done — next step' : 'All ten done'}</button></div></div>`;
}
function bindSngTenStep(host, song){
  const q = s => host.querySelector(s);
  $$('[data-tenstep]', host).forEach(b => b.onclick = () => { song.tenStep = +b.dataset.tenstep; saveNow(); rerender(); });
  q('#tenNote').onchange = e => { song.tenNotes = song.tenNotes || {}; song.tenNotes[Math.min(9, song.tenStep || 0)] = e.target.value; saveNow(); };
  q('#tenNext').onclick = () => { const n = q('#tenNote'); song.tenNotes = song.tenNotes || {}; song.tenNotes[Math.min(9, song.tenStep || 0)] = n.value;
    if((song.tenStep || 0) < 9) song.tenStep = (song.tenStep || 0) + 1; else { song.status = 'finished'; sngBadgeCheck(); toast('Ten steps — a whole song. It is in the Songbook.'); }
    saveNow(); rerender(); };
}

/* ---------- the Songbook ---------- */
function sngSongbookHTML(){
  const st = sngState(), fin = st.songs.filter(s => s.status === 'finished'), drafts = st.songs.filter(s => s.status !== 'finished');
  return `<div class="sng-row"><a class="btn primary" href="#/songwriting/tool/song-desk">＋ A song</a><span class="grow"></span>${fin.length ? `<button class="tbtn" id="sbPrint">print the songbook</button>` : ''}</div>
    <h3 class="serif">Finished</h3>${fin.length ? `<div class="sng-shelf">${fin.map(s => `<a class="sng-spine" href="#/songwriting/song/${esc(s.id)}"><b class="serif">${esc(s.title)}</b><span class="muted">${esc((s.updatedAt || '').slice(0, 10))}</span></a>`).join('')}</div>`
      : `<p class="empty">No finished songs yet — mark one finished on the Song Desk and it goes on this shelf.</p>`}
    ${drafts.length ? `<h3 class="serif">On the desk</h3><div class="sng-exlist">${drafts.map(s => `<a class="sng-ex" href="#/songwriting/song/${esc(s.id)}"><span class="mono">…</span><span class="sng-ex-t"><b>${esc(s.title)}</b><span class="muted">${esc(s.brief || '')}</span></span></a>`).join('')}</div>` : ''}`;
}
/* a print view: the lyric with its chords, and nothing else */
function sngPrintSong(song){ sngPrint([song]); }
function sngPrint(songs){
  const w = window.open('', '_blank'); if(!w){ toast('The browser blocked the print window.'); return; }
  w.document.write(`<!doctype html><title>${esc(songs.length === 1 ? songs[0].title : 'Songbook')}</title><style>
    body{font-family:Georgia,'Times New Roman',serif;max-width:40em;margin:2em auto;color:#111;line-height:1.5}h1{font-weight:400;margin:0 0 .2em}
    .brief{color:#555;font-style:italic;margin-bottom:1.4em}.sec{margin:1.2em 0}.sec h3{font:600 .8em/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#777;margin:0 0 .4em}
    .chords{font:.8em ui-monospace,monospace;color:#555}.song{page-break-after:always}</style>` +
    songs.map(s => `<div class="song"><h1>${esc(s.title)}</h1>${s.brief ? `<div class="brief">${esc(s.brief)}</div>` : ''}${s.sections.map(sec => `<div class="sec"><h3>${esc(sec.type)}</h3>${sec.prog ? `<div class="chords">${esc(sec.prog.join(' – '))}</div>` : ''}${sec.lines.map(l => `<div>${esc(l.text || '') || '&nbsp;'}</div>`).join('')}</div>`).join('')}</div>`).join(''));
  w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch(e){} }, 300);
}

/* ---------- the Listening Room ---------- */
function sngListeningHTML(){
  const st = sngState(), u = sngUi();
  const cur = u.listenId ? st.listening.find(x => x.id === u.listenId) : null;
  return `<p class="muted">Analyse songs you love: the sections and their lengths, the chords as Roman numerals, where the title falls, the power positions, what to borrow. No lyrics are copied here — note what the song does.</p>
    <div class="sng-row"><input class="inp" id="lrNew" placeholder="song — artist"><button class="btn primary" id="lrAdd">Analyse</button></div>
    ${cur ? `<div class="card"><div class="sng-card-h"><b class="serif">${esc(cur.song)}</b><span class="grow"></span><button class="del-x inline" id="lrDel">×</button></div>
      ${SNG_LISTEN_FIELDS.map(([k, lab, ph]) => `<label class="sng-field"><span>${esc(lab)}</span><textarea class="inp sng-ta" rows="2" data-lrf="${k}" placeholder="${esc(ph)}">${esc((cur.fields || {})[k] || '')}</textarea></label>`).join('')}
      <button class="tbtn" id="lrSeed">Keep “what to borrow” in the Seedbank</button></div>` : ''}
    ${st.listening.length ? `<div class="sng-exlist">${st.listening.map(x => `<button class="sng-ex${x.id === u.listenId ? ' on' : ''}" data-lr="${esc(x.id)}"><span class="mono">🎧</span><span class="sng-ex-t"><b>${esc(x.song)}</b><span class="muted">${esc(((x.fields || {}).borrow || '').slice(0, 90))}</span></span><span class="mono faint">${esc((x.createdAt || '').slice(0, 10))}</span></button>`).join('')}</div>` : ''}`;
}
function bindSngMore(root){
  const st = sngState(), u = sngUi(), q = s => root.querySelector(s);
  const add = q('#lrAdd'); if(add) add.onclick = () => { const v = q('#lrNew').value.trim(); if(!v) return; const x = {id: uid(), song: v, fields: {}, createdAt: new Date().toISOString()};
    st.listening.unshift(x); u.listenId = x.id; sngLogSession('listening'); saveNow(); rerender(); };
  $$('[data-lr]', root).forEach(b => b.onclick = () => { u.listenId = b.dataset.lr; rerender(); });
  const cur = u.listenId ? st.listening.find(x => x.id === u.listenId) : null;
  if(cur){
    $$('[data-lrf]', root).forEach(t => t.onchange = () => { cur.fields[t.dataset.lrf] = t.value; saveNow(); });
    const d = q('#lrDel'); if(d) d.onclick = () => { spliceOut(st.listening, x => x.id === cur.id); u.listenId = null; saveNow(); rerender(); };
    const s = q('#lrSeed'); if(s) s.onclick = () => { if(sngSeed({type: 'line', content: `${cur.song}: ${(cur.fields || {}).borrow || ''}`, source: 'Listening Room', tags: ['borrow']})){ sound('success'); toast('In the Seedbank.'); } };
  }
  const sp = q('#sbPrint'); if(sp) sp.onclick = () => sngPrint(st.songs.filter(s => s.status === 'finished'));
}
