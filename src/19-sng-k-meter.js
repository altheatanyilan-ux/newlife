/* ============================================================
   THE METRONOME, WHEREVER YOU ARE IN THE STUDIO

   It used to be a desk of its own — a place to go to, away from the thing
   you were writing. It is a slim bar now, under the tabs on every page of
   the Songwriting Studio (Today, the Path, an exercise, any tool, the
   Seedbank, the Songbook): start it, change the tempo (the − and + keys, the
   box, or tapping it in), pick the beats in a bar, and carry on writing. It keeps
   going as you move between the studio's pages, and stops when you leave
   the studio. The tempo and the bar are remembered with the profile.
   ============================================================ */
let _sngMetro = null;
const sngMetBpm = () => Math.max(30, Math.min(260, +sngState().profile.metBpm || 90));
const sngMetPer = () => [2, 3, 4, 6].includes(+sngState().profile.metPer) ? +sngState().profile.metPer : 4;
function sngMetBarHTML(){
  const on = !!_sngMetro, bpm = sngMetBpm(), per = sngMetPer();
  return `<div class="sng-metbar${on ? ' on' : ''}" id="sngMetBar" role="group" aria-label="metronome">
    <button class="sng-met-go${on ? ' on' : ''}" data-met="go" aria-label="${on ? 'stop' : 'start'} the metronome" title="${on ? 'stop' : 'start'} the metronome">${on ? '■' : '▶'}</button>
    <span class="mono faint sng-met-l">metronome</span>
    <button class="sng-met-b" data-met="dn" aria-label="slower" title="slower">−</button>
    <input class="sng-met-n mono" id="sngMetBpm" type="number" min="30" max="260" value="${bpm}" aria-label="beats per minute" title="beats per minute">
    <button class="sng-met-b" data-met="up" aria-label="faster" title="faster">+</button>
    <button class="tbtn" data-met="tap" title="tap the tempo in">tap</button>
    <span class="sng-met-dots" id="sngMetDots" aria-hidden="true">${[...Array(per)].map((_, i) => `<i data-d="${i}"></i>`).join('')}</span>
    <select class="sel sm" id="sngMetPer" aria-label="beats in a bar" title="beats in a bar">${[2, 3, 4, 6].map(n => `<option value="${n}" ${n === per ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="mono faint">in a bar</span>
  </div>`;
}
function sngMetStop(){ if(_sngMetro){ clearInterval(_sngMetro.timer); _sngMetro = null; } const b = document.getElementById('sngMetBar'); if(b){ b.classList.remove('on'); const g = b.querySelector('[data-met="go"]'); if(g){ g.classList.remove('on'); g.textContent = '▶'; g.setAttribute('aria-label', 'start the metronome'); } } }
function sngMetStart(){
  const ctx = sngCtx(); if(!ctx) return;
  if(ctx.state === 'suspended') try { ctx.resume(); } catch(e){}
  let next = ctx.currentTime + 0.06, n = 0;
  _sngMetro = {timer: setInterval(() => {
    const per = sngMetPer();
    while(next < ctx.currentTime + 0.12){
      const beat = n % per;
      sngDrum(ctx, ctx.destination, beat === 0 ? 'clave' : 'rimclick', next, beat === 0 ? 0.9 : 0.6);
      setTimeout(() => { const d = document.querySelector('#sngMetDots i[data-d="' + beat + '"]'); if(!d) return; d.classList.add('hit'); setTimeout(() => d.classList.remove('hit'), 110); }, Math.max(0, (next - ctx.currentTime) * 1000));
      next += 60 / sngMetBpm(); n++;
    }
  }, 25)};
  const b = document.getElementById('sngMetBar'); if(b){ b.classList.add('on'); const g = b.querySelector('[data-met="go"]'); if(g){ g.classList.add('on'); g.textContent = '■'; g.setAttribute('aria-label', 'stop the metronome'); } }
}
function sngMetBind(root){
  const bar = root.querySelector('#sngMetBar'); if(!bar) return;
  const p = sngState().profile, inp = bar.querySelector('#sngMetBpm');
  const setBpm = v => { p.metBpm = Math.max(30, Math.min(260, Math.round(+v) || 90)); inp.value = p.metBpm; save(); };
  bar.querySelector('[data-met="go"]').onclick = () => { if(_sngMetro) sngMetStop(); else sngMetStart(); };
  bar.querySelector('[data-met="dn"]').onclick = () => setBpm(sngMetBpm() - 1);
  bar.querySelector('[data-met="up"]').onclick = () => setBpm(sngMetBpm() + 1);
  inp.onchange = () => setBpm(inp.value);
  inp.onkeydown = e => { if(e.key === 'ArrowUp'){ e.preventDefault(); setBpm(sngMetBpm() + (e.shiftKey ? 5 : 1)); } else if(e.key === 'ArrowDown'){ e.preventDefault(); setBpm(sngMetBpm() - (e.shiftKey ? 5 : 1)); } };
  bar.querySelector('#sngMetPer').onchange = e => { p.metPer = +e.target.value; save(); bar.querySelector('#sngMetDots').innerHTML = [...Array(sngMetPer())].map((_, i) => `<i data-d="${i}"></i>`).join(''); };
  if(typeof studioTapTempo === 'function') studioTapTempo(bar.querySelector('[data-met="tap"]'), b => setBpm(b));
}
/* leaving the studio stops it */
window.addEventListener('hashchange', () => { if(_sngMetro && parseHash().name !== 'songwriting') sngMetStop(); });
