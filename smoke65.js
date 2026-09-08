const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(500);

  const res = await page.evaluate(async () => {
    const SR = 44100, LEN = 3;
    const BOWL_MODES = [1, 2.75, 5.18, 8.16, 11.9];

    // faithful re-implementations of the two primitives, rendered offline
    function render(recipe){
      const ctx = new OfflineAudioContext(1, SR*LEN, SR);
      const master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      const out = () => master;
      function bowl({freq, dur=1.2, gain=.05, beat=7, modes=BOWL_MODES, size=1, at=0, attack=0}){
        const t = at;
        const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(out());
        modes.forEach((m, i) => {
          const amp = gain * Math.pow(.52, i) * (i ? 1 : 1.25);
          const d = Math.max(.09, dur * Math.pow(.62, i) * (i ? size : 1));
          const f = freq * m * (1 + (i ? (i % 2 ? .004 : -.003) : 0));
          [-1, 1].forEach(side => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(f, t);
            o.detune.setValueAtTime(side * beat * (1 + i * .5), t);
            g.gain.setValueAtTime(.0001, t);
            g.gain.linearRampToValueAtTime(amp/2, t + .006 + i*.002 + attack);
            g.gain.exponentialRampToValueAtTime(.0001, t + d);
            o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + .05);
          });
        });
      }
      function noise({dur=.08, freq=1200, q=1.2, gain=.05, type='bandpass', at=0, sweep=null}){
        const t = at;
        const len = Math.max(1, Math.floor(SR*(dur+.05)));
        const buf = ctx.createBuffer(1, len, SR); const d = buf.getChannelData(0);
        for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
        const src = ctx.createBufferSource(); src.buffer = buf;
        const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
        if(sweep) f.frequency.exponentialRampToValueAtTime(sweep, t+dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(gain,t+.006); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
        src.connect(f); f.connect(g); g.connect(out()); src.start(t); src.stop(t+dur+.05);
      }
      const mallet = ({freq=900,dur=.05,gain=.02,q=.8,at=0}) => noise({dur,freq,q,gain,sweep:freq*.45,at});
      recipe({bowl, mallet, noise});
      return ctx.startRendering();
    }

    const OLD = ({bowl,mallet}) => { mallet({freq:1500,dur:.028,gain:.014}); bowl({freq:523.25,dur:.55,gain:.034,beat:9,size:.6}); };
    const NEW = ({bowl}) => bowl({freq:440,dur:.9,gain:.026,beat:3,size:1,modes:[1,2],attack:.01});

    function analyse(buf){
      const d = buf.getChannelData(0);
      let peak = 0, peakAt = 0;
      for(let i=0;i<d.length;i++){ const a=Math.abs(d[i]); if(a>peak){ peak=a; peakAt=i; } }
      const attackMs = peakAt / SR * 1000;
      const thr = peak*0.01; let end = d.length-1;
      for(let i=d.length-1;i>0;i--){ if(Math.abs(d[i])>thr){ end=i; break; } }
      const decayS = end/SR;

      /* a correct DFT over a Hann-windowed 4096-sample window (93 ms) from the
         onset — no decimation, every sample summed for every bin */
      const N = 4096;
      const w = new Float64Array(N), win = new Float64Array(N);
      for(let n=0;n<N;n++){ win[n] = 0.5 - 0.5*Math.cos(2*Math.PI*n/(N-1)); w[n] = (d[n]||0) * win[n]; }
      const mag = new Float64Array(N/2);
      for(let k=1;k<N/2;k++){
        let re=0, im=0;
        const c = -2*Math.PI*k/N;
        for(let n=0;n<N;n++){ const a=c*n; re += w[n]*Math.cos(a); im += w[n]*Math.sin(a); }
        mag[k] = Math.sqrt(re*re+im*im);
      }
      let num=0, den=0, hi=0, tot=0, pk=0, pkF=0;
      for(let k=1;k<N/2;k++){
        const f = k*SR/N, m = mag[k];
        num += f*m; den += m; tot += m; if(f>2000) hi += m;
        if(m>pk){ pk=m; pkF=f; }
      }
      /* how much of the energy sits on the fundamental and its octave versus
         everywhere else — a pure tone concentrates, a noisy strike spreads */
      const near = (f0) => { let s2=0; for(let k=1;k<N/2;k++){ const f=k*SR/N; if(Math.abs(f-f0) < 25) s2 += mag[k]; } return s2; };
      const tonal = (near(pkF) + near(pkF*2)) / (tot || 1);
      return {peak:+peak.toFixed(4), attackMs:+attackMs.toFixed(1), decayS:+decayS.toFixed(2),
              centroidHz:Math.round(den?num/den:0), above2kHz:+(tot?hi/tot*100:0).toFixed(1),
              loudestHz:Math.round(pkF), tonalPct:+(tonal*100).toFixed(1)};
    }

    return {old: analyse(await render(OLD)), neu: analyse(await render(NEW))};
  });

  const row = (k, o, n, unit='') => console.log(('  '+k).padEnd(22), String(o).padStart(9), '→', String(n).padStart(9), unit);
  console.log('                          OLD click     NEW click');
  row('peak amplitude', res.old.peak, res.neu.peak);
  row('time to peak', res.old.attackMs, res.neu.attackMs, 'ms   (higher = arrives, not hits)');
  row('decay to −40dB', res.old.decayS, res.neu.decayS, 's');
  row('spectral centroid', res.old.centroidHz, res.neu.centroidHz, 'Hz   (lower = warmer)');
  row('energy above 2 kHz', res.old.above2kHz, res.neu.above2kHz, '%    (the clicky part)');
  row('loudest partial', res.old.loudestHz, res.neu.loudestHz, 'Hz');
  row('energy on tone+8ve', res.old.tonalPct, res.neu.tonalPct, '%    (higher = purer)');
  await browser.close();
})();
