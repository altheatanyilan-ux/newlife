/* ============================================================
   WHAT I WANT — the deal for each thing in my life (#/purpose/wants)

   Most of what takes a share of a life is taken without being chosen. This is
   where each thing — a club role, a class you teach, a job, a project — is
   written down as a *deal*, once, so that it does not have to be worked out
   again on every anxious evening:

     its share       how much of my care it gets, as a proportion only. Not hours,
                     not tasks, not a target. Shares are weights; what is shown is
                     each as a part of the whole.
     what I want     the things I actually get from it, and are why I am in it.
     what I give     the price, said plainly. Knowing the price is what makes it
                     a deal rather than a burden.
     what I leave    everything else about it that I do not need to care about —
                     either left to other people, or something I will not do.
                     Said once here, it can be let go of without a fight later.
     its own time    when I think about it, and only then. The rest of the week a
                     thought about it is not mine to chew on; it can wait for its time.
     what makes it   one line: if this went well, what would have been worth it?
     worth it

   Nothing here is scored or trended, and nothing is a duty. It is read in three
   places: the weekly review (did I get what I wanted, did something I had let go
   creep back), the overwhelm rescue page (a thought about something I decided to
   leave is named as such, and a thought about a thing with its own time can be
   saved for it), and Today (a line on the days a thing has its time).
   ============================================================ */
purposeTabAdd({id: 'wants', label: 'What I want', order: 45, render: (body, rest) => wantsRender(body, rest)});

const WANTS_DAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];
const WANTS_HOW = {others: 'leave it to others', no: 'I won’t do it'};
const WANTS_STOP = new Set(['the', 'and', 'for', 'with', 'about', 'doing', 'making', 'that', 'this', 'from', 'into', 'any', 'all', 'more', 'some', 'worrying', 'stressing']);
let _wantsOpen = '';

/* ---------- the data ---------- */
function wantsFix(t){
  t.id = t.id || uid(); t.name = t.name || ''; t.aka = typeof t.aka === 'string' ? t.aka : '';
  t.color = t.color || (typeof PLAN_COLORS !== 'undefined' ? PLAN_COLORS[0] : '#b08968');
  t.share = isFinite(+t.share) ? Math.max(0, Math.min(100, +t.share)) : 20;
  t.status = ['active', 'resting', 'ended'].includes(t.status) ? t.status : 'active';
  ['gets', 'gives', 'letgo'].forEach(k => { if(!Array.isArray(t[k])) t[k] = []; });
  t.worth = typeof t.worth === 'string' ? t.worth : '';
  if(!t.slot || typeof t.slot !== 'object') t.slot = {};
  t.slot.days = Array.isArray(t.slot.days) ? t.slot.days : []; t.slot.from = t.slot.from || ''; t.slot.to = t.slot.to || ''; t.slot.note = t.slot.note || '';
  return t;
}
function wantsState(){
  const p = purposeState();
  const w = p.wants = p.wants && typeof p.wants === 'object' ? p.wants : {};
  w.things = Array.isArray(w.things) ? w.things : []; w.things.forEach(wantsFix);
  return w;
}
const wantsThings = () => wantsState().things.filter(t => t.status === 'active');
const wantsThing = id => wantsState().things.find(t => t.id === id) || null;
/* shares as proportions of the whole, whole numbers that add to 100 (largest remainder) */
function wantsShares(){
  const list = wantsThings().filter(t => t.share > 0), total = list.reduce((n, t) => n + t.share, 0);
  if(!total) return [];
  const raw = list.map(t => ({t, x: 100 * t.share / total})), out = raw.map(r => ({t: r.t, pct: Math.floor(r.x), rem: r.x - Math.floor(r.x)}));
  let left = 100 - out.reduce((n, o) => n + o.pct, 0);
  out.slice().sort((a, b) => b.rem - a.rem).forEach(o => { if(left > 0){ o.pct++; left--; } });
  return out.map(o => ({t: o.t, pct: o.pct}));
}
const wantsPct = id => { const s = wantsShares().find(x => x.t.id === id); return s ? s.pct : 0; };

/* ---------- its own time ---------- */
const wantsDaysSay = days => WANTS_DAYS.filter(([d]) => days.includes(d)).map(([, n]) => n).join(' · ');
function wantsSlotSay(t){
  const s = t.slot; if(!s.days.length) return '';
  return wantsDaysSay(s.days) + (s.from ? ' · ' + s.from + (s.to ? '–' + s.to : '') : '');
}
/* the next time it comes round — today, if its time has not yet passed */
function wantsSlotNext(t){
  const s = t.slot; if(!s.days.length) return null;
  const now = new Date(), hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  for(let i = 0; i < 14; i++){
    const d = new Date(now.getTime() + i * 864e5), day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if(!s.days.includes(d.getDay())) continue;
    if(i === 0 && s.from && s.from <= hm) continue;
    return {day, time: s.from || '', label: (i === 0 ? 'today' : i === 1 ? 'tomorrow' : wantsDaysSay([d.getDay()])) + (s.from ? ' ' + s.from : '')};
  }
  return null;
}
const wantsToday = () => { const dow = new Date().getDay(); return wantsThings().filter(t => t.slot.days.includes(dow)); };
function wantsTodayHTML(){
  const list = wantsToday(); if(!list.length) return '';
  return `<div class="wn-today rv"><span class="mono">its own time today</span>${list.map(t => `<a class="wn-tchip" href="#/purpose/wants/${esc(t.id)}" style="--c:${esc(t.color)}" title="${esc(t.slot.note || 'think about it now, and not the rest of the week')}"><i></i>${esc(t.name)}${t.slot.from ? ` <b class="mono">${esc(t.slot.from)}${t.slot.to ? '–' + esc(t.slot.to) : ''}</b>` : ''}</a>`).join('')}</div>`;
}

/* ---------- reading words against the things (the rescue page uses these) ---------- */
function wantsWordsMatch(text, phrase){
  const stem = w => w.slice(0, 5);
  const ws = String(phrase || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4 && !WANTS_STOP.has(w));
  if(!ws.length) return false;
  const have = new Set(String(text || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4).map(stem));
  return ws.filter(w => have.has(stem(w))).length >= Math.min(2, ws.length);
}
function wantsMentions(text){
  const out = [];
  wantsThings().forEach(t => {
    const names = [t.name].concat(String(t.aka || '').split(/[,;，、]/).map(x => x.trim()).filter(Boolean));
    if(names.some(n => typeof _rsHas === 'function' && _rsHas(text, n))) out.push({type: 'want', id: t.id, label: t.name});
    t.letgo.forEach(i => { if(wantsWordsMatch(text, i.text)) out.push({type: 'letgo', id: t.id + ':' + i.id, label: i.text}); });
  });
  return out;
}
function wantsKnows(ref){
  if(ref.type === 'want'){
    const t = wantsThing(ref.id); if(!t) return null;
    const slot = wantsSlotSay(t);
    return {line: `${wantsPct(t.id)}% of my care${slot ? ' · its time: ' + slot : ' · no time of its own yet'}`, go: () => navigate('#/purpose/wants/' + t.id)};
  }
  if(ref.type === 'letgo'){
    const [tid, iid] = String(ref.id).split(':'), t = wantsThing(tid), i = t && t.letgo.find(x => x.id === iid); if(!i) return null;
    return {line: `you decided: ${WANTS_HOW[i.how] || WANTS_HOW.others} (${t.name})`, go: () => navigate('#/purpose/wants/' + t.id)};
  }
  return null;
}

/* ---------- the tab ---------- */
function wantsBarHTML(){
  const sh = wantsShares();
  if(!sh.length) return '';
  return `<div class="wn-bar" role="img" aria-label="${esc(sh.map(s => s.t.name + ' ' + s.pct + '%').join(', '))}">${sh.map(s => `<button class="wn-seg" data-wnopen="${esc(s.t.id)}" style="flex:${s.pct};--c:${esc(s.t.color)}" title="${esc(s.t.name)} — ${s.pct}%"><span>${s.pct >= 9 ? esc(s.t.name) : ''}</span></button>`).join('')}</div>
    <div class="wn-legend">${sh.map(s => `<span class="wn-lg" style="--c:${esc(s.t.color)}"><i></i>${esc(s.t.name)} <b class="mono" data-wnpct="${esc(s.t.id)}">${s.pct}%</b></span>`).join('')}</div>`;
}
function wantsListHTML(t, key, label, ph){
  return `<div class="wn-col"><span class="sc">${esc(label)}</span>
    <ul class="wn-items">${t[key].map(i => `<li><span>${esc(i.text)}</span>${key === 'letgo' ? `<button class="chip sm" data-wnhow="${esc(i.id)}" title="press to change">${esc(WANTS_HOW[i.how] || WANTS_HOW.others)}</button>` : ''}<button class="wn-x" data-wnrm="${key}|${esc(i.id)}" aria-label="take this out">×</button></li>`).join('')}</ul>
    <input class="inp sm" data-wnadd="${key}" placeholder="${esc(ph)}" maxlength="200"></div>`;
}
function wantsEditorHTML(t){
  const colors = typeof PLAN_COLORS !== 'undefined' ? PLAN_COLORS : ['#b08968', '#7f916a', '#a0727e', '#d4a44c', '#6b7d9c', '#8a6f9e'];
  return `<div class="wn-edit">
    <div class="wn-row"><label class="pd-q grow"><span class="k">what it is</span><input class="inp" data-wnf="name" value="${esc(t.name)}" maxlength="80" placeholder="e.g. the club exco, GP tuition, my job"></label>
      <label class="pd-q grow"><span class="k">other words I use for it (so the rescue page recognises it)</span><input class="inp" data-wnf="aka" value="${esc(t.aka)}" maxlength="120" placeholder="exco, the committee, the concert"></label></div>
    <div class="wn-row"><div class="wn-sw" role="group" aria-label="colour">${colors.map(c => `<button class="wn-c${t.color === c ? ' on' : ''}" data-wnc="${esc(c)}" style="--c:${esc(c)}" aria-label="colour"></button>`).join('')}</div>
      <span class="grow"></span>${['active', 'resting', 'ended'].map(s => `<button class="chip sm${t.status === s ? ' on' : ''}" data-wnst="${s}">${s}</button>`).join('')}</div>
    <div class="wn-grid">
      ${wantsListHTML(t, 'gets', 'What I want from it', 'a thing I really get — a place, a say, a chance, someone’s time…')}
      ${wantsListHTML(t, 'gives', 'What I give for it', 'the price: the admin, the evenings, the effort…')}
      ${wantsListHTML(t, 'letgo', 'What I leave alone', 'something about it I do not need to care about — decided once')}
    </div>
    <p class="faint sm" style="margin:2px 0 0">Under <i>what I leave alone</i>, each line is either <b>left to others</b> (they decide, and I let them) or <b>I won’t do it</b> (I say no). Press the grey tag to change which.</p>
    <label class="pd-q"><span class="k">if this goes well, what will have been worth it?</span><input class="inp" data-wnf="worth" value="${esc(t.worth)}" maxlength="200" placeholder="one line"></label>
    <div class="wn-slot"><span class="k">its own time — the only time I think about it</span>
      <div class="wn-row">${WANTS_DAYS.map(([d, n]) => `<button class="chip sm${t.slot.days.includes(d) ? ' on' : ''}" data-wnday="${d}">${n}</button>`).join('')}
        <input class="inp sm" type="time" data-wnf="slot.from" value="${esc(t.slot.from)}" style="width:7.5rem"><span class="faint">to</span><input class="inp sm" type="time" data-wnf="slot.to" value="${esc(t.slot.to)}" style="width:7.5rem"></div>
      <input class="inp sm" data-wnf="slot.note" value="${esc(t.slot.note)}" maxlength="160" placeholder="the rule, e.g. ‘only think about it then — otherwise it waits’">
    </div>
    <div class="row between" style="margin-top:6px"><span class="faint sm">${t.slot.days.length ? 'On these days it shows on Today, and a thought about it on the rescue page can be saved for its time.' : 'With no time set, a thought about it has nowhere to wait.'}</span>
      <button class="btn sm ghost danger" data-wndel="${esc(t.id)}">delete this thing</button></div></div>`;
}
function wantsCardHTML(t, open){
  const pct = wantsPct(t.id);
  return `<article class="wn-card${open ? ' open' : ''}${t.status !== 'active' ? ' dim' : ''}" data-wnid="${esc(t.id)}" style="--c:${esc(t.color)}">
    <div class="wn-head"><button class="wn-name" data-wntoggle="${esc(t.id)}" aria-expanded="${open}"><i></i><b>${esc(t.name || 'a new thing')}</b>${t.status !== 'active' ? `<span class="mono faint"> · ${esc(t.status)}</span>` : ''}</button>
      <span class="wn-sum faint sm">${t.gets.length} wanted · ${t.letgo.length} left alone${wantsSlotSay(t) ? ' · ' + esc(wantsSlotSay(t)) : ''}</span>
      <span class="grow"></span>
      ${t.status === 'active' ? `<input type="range" class="wn-range" min="0" max="100" step="1" value="${t.share}" data-wnshare="${esc(t.id)}" aria-label="its share of my care"><b class="mono wn-pct" data-wnpct="${esc(t.id)}">${pct}%</b>` : ''}</div>
    ${open ? wantsEditorHTML(t) : (t.worth ? `<p class="wn-worth serif">${esc(t.worth)}</p>` : '')}</article>`;
}
function wantsLeftHTML(){
  const rows = wantsThings().flatMap(t => t.letgo.map(i => ({t, i})));
  if(!rows.length) return '';
  const grp = how => rows.filter(r => (r.i.how || 'others') === how);
  const col = (how, title) => grp(how).length ? `<div class="wn-col"><span class="sc">${esc(title)}</span><ul class="wn-items">${grp(how).map(r => `<li><span>${esc(r.i.text)}</span><em class="faint">${esc(r.t.name)}</em></li>`).join('')}</ul></div>` : '';
  return `<section class="wn-left"><h3 class="serif">What I have decided not to carry</h3>${'<div class="wn-grid two">' + col('others', 'Left to other people') + col('no', 'Things I will not do') + '</div>'}</section>`;
}
function wantsHTML(){
  const w = wantsState(), things = w.things, live = things.filter(t => t.status === 'active'), other = things.filter(t => t.status !== 'active');
  return `<div class="wn-wrap">
    <p class="muted" style="max-width:64ch;line-height:1.55;margin:4px 0 0">Everything that takes a share of your life, and what you want from it — so that the rest can be let go of. Each thing is only a <b>proportion</b> here: a part of the whole, not hours, not a target.</p>
    ${wantsBarHTML()}
    ${things.length ? '' : `<div class="wn-empty"><p class="serif">Nothing written yet.</p><p class="muted sm">Start with one thing that takes a share of you — a role, a class, a job — and say what you want from it, what it costs, and what you do not need to care about. For example: a club committee you ran for — <i>want</i>: a room to live in, programming the concert, choosing the pieces and partners, a stage, coaching on my pieces; <i>give</i>: the admin; <i>leave to others</i>: the programme booklet; <i>won’t do</i>: the bonding suppers.</p>
      <div class="row" style="gap:8px"><button class="btn primary" data-wnnew>＋ the first thing</button><button class="btn" data-wnexample title="the club exco and the GP tuition, as described — editable">fill in my two examples</button></div></div>`}
    <div class="wn-cards">${live.map(t => wantsCardHTML(t, _wantsOpen === t.id)).join('')}</div>
    ${things.length ? `<div class="row" style="margin:8px 0 14px"><button class="btn sm" data-wnnew>＋ another thing</button></div>` : ''}
    ${other.length ? `<div class="wn-cards wn-other"><span class="sc">resting or ended</span>${other.map(t => wantsCardHTML(t, _wantsOpen === t.id)).join('')}</div>` : ''}
    ${wantsLeftHTML()}
  </div>`;
}
function wantsExample(){
  const w = wantsState(), mk = (text, how) => ({id: uid(), text, how});
  w.things.push(wantsFix({id: uid(), name: 'The club exco', aka: 'exco, the committee, the concert', color: '#b08968', share: 40,
    gets: ['somewhere to live — the accommodation', 'the job of programming a concert', 'choosing what I play, and who I partner with', 'a concert slot in the YST Concert Hall', 'private coaching with Dr Choi on the pieces I want to play'].map(text => ({id: uid(), text})),
    gives: [{id: uid(), text: 'the admin work'}],
    letgo: [mk('arranging the programme booklet', 'others'), mk('team-building suppers and the socialising that is only socialising', 'no')],
    worth: 'Playing the pieces I want, in that hall, coached by Dr Choi.'}));
  w.things.push(wantsFix({id: uid(), name: 'GP tuition', aka: 'tuition, my student', color: '#7f916a', share: 15,
    gets: [{id: uid(), text: 'my student improves'}], gives: [{id: uid(), text: 'the teaching hours and the preparing for them'}],
    letgo: [mk('worrying about it day to day', 'no')],
    worth: 'My student is visibly better at the end of it.', slot: {days: [], from: '', to: '', note: 'only think about it in the time I have set for it'}}));
  saveNow();
}

/* ---------- the tab, alive ---------- */
function wantsRender(body, rest){
  _wantsOpen = rest && rest[0] && wantsThing(rest[0]) ? rest[0] : _wantsOpen;
  const draw = (focusSel) => {
    const y = window.scrollY; body.innerHTML = wantsHTML(); wire();
    if(focusSel){ const f = body.querySelector(focusSel); if(f) f.focus(); }
    window.scrollTo(0, y);
  };
  const paintShares = () => { wantsShares().forEach(s => body.querySelectorAll(`[data-wnpct="${s.t.id}"]`).forEach(n => n.textContent = s.pct + '%'));
    const bar = body.querySelector('.wn-bar'); if(bar){ const live = wantsShares(); if(bar.children.length === live.length) [...bar.children].forEach((c, i) => { c.style.flex = live[i].pct; const sp = c.firstElementChild; if(sp) sp.textContent = live[i].pct >= 9 ? live[i].t.name : ''; }); } };
  const wire = () => {
    body.querySelectorAll('[data-wnnew]').forEach(b => b.onclick = () => { const w = wantsState(), colors = typeof PLAN_COLORS !== 'undefined' ? PLAN_COLORS : [];
      const t = wantsFix({id: uid(), name: '', color: colors.length ? colors[w.things.length % colors.length] : '', share: 20}); w.things.push(t); _wantsOpen = t.id; saveNow(); draw('[data-wnf="name"]'); });
    body.querySelectorAll('[data-wnexample]').forEach(b => b.onclick = () => { wantsExample(); _wantsOpen = ''; draw(); toast('Written in — change any of it.', 3500); });
    body.querySelectorAll('[data-wntoggle]').forEach(b => b.onclick = () => { _wantsOpen = _wantsOpen === b.dataset.wntoggle ? '' : b.dataset.wntoggle; draw(); });
    body.querySelectorAll('[data-wnopen]').forEach(b => b.onclick = () => { _wantsOpen = b.dataset.wnopen; draw(); const c = body.querySelector(`[data-wnid="${_wantsOpen}"]`); if(c) c.scrollIntoView({block: 'nearest', behavior: 'smooth'}); });
    body.querySelectorAll('[data-wnshare]').forEach(r => { const t = wantsThing(r.dataset.wnshare);
      r.oninput = () => { if(t){ t.share = +r.value; paintShares(); } }; r.onchange = () => { if(t) saveNow(); }; });
    body.querySelectorAll('[data-wnf]').forEach(f => { const card = f.closest('[data-wnid]'), t = card && wantsThing(card.dataset.wnid); if(!t) return;
      f.oninput = () => { const k = f.dataset.wnf; if(k.startsWith('slot.')) t.slot[k.slice(5)] = f.value; else t[k] = f.value; save();
        if(k === 'name'){ const b = card.querySelector('.wn-name b'); if(b) b.textContent = f.value || 'a new thing'; } }; });
    body.querySelectorAll('[data-wnc]').forEach(b => b.onclick = () => { const t = wantsThing(b.closest('[data-wnid]').dataset.wnid); if(!t) return; t.color = b.dataset.wnc; saveNow(); draw(); });
    body.querySelectorAll('[data-wnst]').forEach(b => b.onclick = () => { const t = wantsThing(b.closest('[data-wnid]').dataset.wnid); if(!t) return; t.status = b.dataset.wnst; saveNow(); draw(); });
    body.querySelectorAll('[data-wnday]').forEach(b => b.onclick = () => { const t = wantsThing(b.closest('[data-wnid]').dataset.wnid); if(!t) return; const d = +b.dataset.wnday;
      t.slot.days = t.slot.days.includes(d) ? t.slot.days.filter(x => x !== d) : t.slot.days.concat(d); saveNow(); draw(); });
    body.querySelectorAll('[data-wnadd]').forEach(i => i.onkeydown = e => { if(e.key !== 'Enter') return; const v = i.value.trim(); if(!v) return;
      const t = wantsThing(i.closest('[data-wnid]').dataset.wnid), k = i.dataset.wnadd; if(!t) return;
      t[k].push(k === 'letgo' ? {id: uid(), text: v, how: 'others'} : {id: uid(), text: v}); saveNow(); draw(`[data-wnid="${t.id}"] [data-wnadd="${k}"]`); });
    body.querySelectorAll('[data-wnrm]').forEach(b => b.onclick = () => { const t = wantsThing(b.closest('[data-wnid]').dataset.wnid), [k, id] = b.dataset.wnrm.split('|'); if(!t) return;
      const back = spliceOut(t[k], x => x.id === id); saveNow(); draw(); toast('Taken out.', 4500, {label: 'undo', fn: () => { back(); saveNow(); draw(); }}); });
    body.querySelectorAll('[data-wnhow]').forEach(b => b.onclick = () => { const t = wantsThing(b.closest('[data-wnid]').dataset.wnid); const i = t && t.letgo.find(x => x.id === b.dataset.wnhow); if(!i) return;
      i.how = (i.how || 'others') === 'others' ? 'no' : 'others'; saveNow(); draw(); });
    body.querySelectorAll('[data-wndel]').forEach(b => b.onclick = () => { const t = wantsThing(b.dataset.wndel); if(!t) return;
      const back = spliceOut(wantsState().things, x => x.id === t.id); _wantsOpen = ''; saveNow(); draw(); toast(`“${esc(t.name || 'it')}” deleted.`, 6000, {label: 'undo', fn: () => { back(); saveNow(); draw(); }}); });
  };
  draw();
}

/* ---------- the weekly review's step ---------- */
const WANTS_VERDICTS = [['got', 'I got what I wanted'], ['part', 'partly'], ['no', 'not really']];
function wantsWeekNotes(wk, make){
  const n = wwNotes(wk, make); if(!n.wants || typeof n.wants !== 'object'){ if(!make) return {}; n.wants = {}; } return n.wants;
}
function wantsReviewHTML(wk){
  const notes = wantsWeekNotes(wk, false), list = wantsThings();
  return `${wantsBarHTML()}<div class="wn-rcards">${list.map(t => { const n = notes[t.id] || {}, slot = wantsSlotSay(t);
    return `<div class="wn-rcard" data-wnrid="${esc(t.id)}" style="--c:${esc(t.color)}">
      <div class="row between" style="align-items:baseline"><b class="serif"><i class="wn-dot"></i>${esc(t.name)}</b><span class="mono faint">${wantsPct(t.id)}%${slot ? ' · its time: ' + esc(slot) : ''}</span></div>
      ${t.gets.length ? `<p class="wn-rwant"><span class="mono faint">I want</span> ${t.gets.map(i => esc(i.text)).join(' · ')}</p>` : '<p class="faint sm" style="margin:2px 0">No wants written for it.</p>'}
      ${t.letgo.length ? `<p class="wn-rwant"><span class="mono faint">I leave</span> ${t.letgo.map(i => esc(i.text)).join(' · ')}</p>` : ''}
      <div class="ww-ref"><span class="ww-v">${WANTS_VERDICTS.map(([id, tx]) => `<button class="chip sm${n.v === id ? ' on' : ''}" data-wnrv="${esc(t.id)}|${id}">${esc(tx)}</button>`).join('')}</span>
        <input class="inp sm ww-note" data-wnrn="${esc(t.id)}" value="${esc(n.note || '')}" placeholder="did anything I had decided to leave alone creep back? did I keep to its time?" maxlength="400"></div>
      <label class="wn-rshare"><span class="faint sm">is this still the right share?</span><input type="range" min="0" max="100" value="${t.share}" data-wnrs="${esc(t.id)}"></label></div>`; }).join('')}</div>`;
}
function weekWantsStep(){
  return {title: 'What I want from each thing.', hint: 'Not how much you did — whether each thing gave you what you took it on for, and whether you stayed out of what you decided to leave alone.',
    body: () => wantsReviewHTML(_ww ? _ww.wk : wwDefaultWeek()),
    bind: b => {
      const wk = () => _ww ? _ww.wk : wwDefaultWeek();
      b.querySelectorAll('[data-wnrv]').forEach(x => x.onclick = () => { const [id, v] = x.dataset.wnrv.split('|'), n = wantsWeekNotes(wk(), true); n[id] = n[id] || {}; n[id].v = n[id].v === v ? '' : v; save();
        x.parentNode.querySelectorAll('[data-wnrv]').forEach(c => c.classList.toggle('on', c === x && !!n[id].v)); sound('click'); });
      b.querySelectorAll('[data-wnrn]').forEach(x => x.oninput = () => { const n = wantsWeekNotes(wk(), true), id = x.dataset.wnrn; n[id] = n[id] || {}; n[id].note = x.value; save(); });
      b.querySelectorAll('[data-wnrs]').forEach(x => { const t = wantsThing(x.dataset.wnrs);
        x.oninput = () => { if(!t) return; t.share = +x.value;
          wantsShares().forEach(s => { const c = b.querySelector(`[data-wnrid="${s.t.id}"] .mono.faint`); if(c) c.textContent = s.pct + '%' + (wantsSlotSay(s.t) ? ' · its time: ' + wantsSlotSay(s.t) : ''); });
          const bar = b.querySelector('.wn-bar'), live = wantsShares(); if(bar && bar.children.length === live.length) [...bar.children].forEach((c, i) => { c.style.flex = live[i].pct; }); };
        x.onchange = () => saveNow(); });
    }};
}
