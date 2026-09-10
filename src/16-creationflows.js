/* ============================================================
   GUIDED CREATION FLOWS — step-by-step entry for the six
   structural objects that shape a life instrument.
   Each flow uses guidedFlow() and collects data in next()
   callbacks. onDone() commits only when required fields are
   present — a silent no-op otherwise.
   ============================================================ */

function guidedNewSkill(pre = {}){
  const _gd = { name: pre.name || '', cat: SKILL_CATS[0], horizon: pre.horizon || 'active', why: '', beginnerDesc: '' };
  guidedFlow('New skill', [
    {
      title: 'Name the skill.',
      hint: 'Specific beats vague. "Portuguese B2" lands better than "learn a language".',
      body: () => `
        <div class="stack">
          <input class="inp serif-lg" id="gsName" placeholder="e.g. Conversational Portuguese" value="${esc(_gd.name)}">
          <div class="field"><label>Category</label>
            <select class="sel" id="gsCat">${SKILL_CATS.map(c=>`<option${_gd.cat===c?' selected':''}>${esc(c)}</option>`).join('')}</select>
          </div>
        </div>`,
      bind: body => setTimeout(() => body.querySelector('#gsName')?.focus(), 40),
      next: body => {
        _gd.name = body.querySelector('#gsName').value.trim();
        _gd.cat = body.querySelector('#gsCat').value;
      },
    },
    {
      title: 'Why this one?',
      hint: 'One line. It is what you will read when you have forgotten.',
      body: () => `<input class="inp" id="gsWhy" placeholder="Because…" value="${esc(_gd.why)}">`,
      bind: body => setTimeout(() => body.querySelector('#gsWhy')?.focus(), 40),
      next: body => { _gd.why = body.querySelector('#gsWhy').value.trim(); },
    },
    {
      title: 'Horizon.',
      hint: 'Where does this skill live in your calendar right now?',
      body: () => `
        <div class="stack" style="gap:8px">
          ${Object.entries(SKILL_HORIZONS).map(([k,[ico,label]])=>`
          <button class="choice ${_gd.horizon===k?'on':''}" data-gsh="${k}">
            <span class="ico">${ico}</span>
            <span><b>${esc(label)}</b></span>
          </button>`).join('')}
        </div>`,
      bind: body => {
        body.querySelectorAll('[data-gsh]').forEach(b => b.onclick = () => {
          _gd.horizon = b.dataset.gsh;
          body.querySelectorAll('[data-gsh]').forEach(x => x.classList.toggle('on', x === b));
        });
      },
    },
    {
      title: 'Level 1 — what does beginner look like?',
      hint: "The concrete first rung. You'll add higher levels from the skill panel.",
      body: () => `<textarea class="ta" id="gsBeg" rows="4" placeholder="Can introduce myself and hold a 2-minute conversation on familiar topics…">${esc(_gd.beginnerDesc)}</textarea>`,
      bind: body => setTimeout(() => body.querySelector('#gsBeg')?.focus(), 40),
      next: body => { _gd.beginnerDesc = body.querySelector('#gsBeg').value.trim(); },
    },
  ], () => {
    if(!_gd.name){ toast('A skill needs a name.'); return; }
    const s = {
      id: uid(), name: _gd.name, cat: _gd.cat, horizon: _gd.horizon, priority: 'P3',
      why: _gd.why, startBy: '', tags: [],
      levels: [
        {number:1, label:'Beginner', description:_gd.beginnerDesc, criteria:[], resources:[], estimatedTime:'', targetDate:null},
        {number:2, label:'Competent', description:'', criteria:[], resources:[], estimatedTime:'', targetDate:null},
        {number:3, label:'Proficient', description:'', criteria:[], resources:[], estimatedTime:'', targetDate:null},
      ],
      currentLevel: _gd.horizon === 'someday' ? 0 : 1,
      milestones: [], prereqs: [], planned: _gd.horizon === 'someday',
    };
    S.skills.push(s); saveNow(); sound('success');
    if(currentRoute !== 'skills') navigate('#/skills'); else rerender();
    if(_gd.horizon !== 'someday') setTimeout(() => openSkillPanel(s.id), 260);
    toast(`"${s.name}" added to your Skill Tree.`);
  });
}

/* ---------- 3. New Person — 4 steps ---------- */
function guidedNewPerson(){
  const _gd = { name: '', relationship: 'friend', circle: 'orbit', notes: '', desiredFrequency: null };
  guidedFlow('New person', [
    {
      title: 'Who is this person, and how do they relate to you?',
      hint: "Their name, and the word you'd use to introduce them.",
      body: () => `
        <div class="stack">
          <input class="inp serif-lg" id="gpName" placeholder="Name">
          ${relSelect('gpRel', _gd.relationship)}
        </div>`,
      bind: body => {
        bindRelSelect(body.querySelector('#gpRel'));
        setTimeout(() => body.querySelector('#gpName')?.focus(), 40);
      },
      next: body => {
        _gd.name = body.querySelector('#gpName').value.trim();
        _gd.relationship = body.querySelector('#gpRel').value;
      },
    },
    {
      title: 'Circle of closeness.',
      hint: 'Placement is a reflective act — not permanent, and easily moved.',
      body: () => `
        <div class="stack" style="gap:8px">
          ${Object.entries(CIRCLES).map(([k,[ico,label,desc,,color]])=>`
          <button class="choice ${_gd.circle===k?'on':''}" data-gpc="${k}" style="--c:${color}">
            <span class="ico">${ico}</span><span><b>${esc(label)}</b><div class="d">${esc(desc)}</div></span>
          </button>`).join('')}
        </div>`,
      bind: body => {
        body.querySelectorAll('[data-gpc]').forEach(b => b.onclick = () => {
          _gd.circle = b.dataset.gpc;
          body.querySelectorAll('[data-gpc]').forEach(x => x.classList.toggle('on', x === b));
        });
      },
    },
    {
      title: 'What do you love or admire about them?',
      hint: 'Optional — but worth writing while you can.',
      body: () => `<textarea class="ta" id="gpNotes" rows="4" placeholder="The way they notice small things. Their laugh. How they listen.">${esc(_gd.notes)}</textarea>`,
      bind: body => setTimeout(() => body.querySelector('#gpNotes')?.focus(), 40),
      next: body => { _gd.notes = body.querySelector('#gpNotes').value.trim(); },
    },
    {
      title: 'How do you want to stay in touch?',
      hint: 'Sets the cadence the Relationship Audit will track.',
      body: () => `
        <div class="stack" style="gap:8px">
          <button class="choice ${!_gd.desiredFrequency?'on':''}" data-gpf="">
            <span class="ico">·</span><span><b>No set cadence</b></span>
          </button>
          ${Object.entries(FREQUENCIES).map(([k,days])=>`
          <button class="choice ${_gd.desiredFrequency===days?'on':''}" data-gpf="${days}">
            <span class="ico">◉</span><span><b>${k.charAt(0).toUpperCase()+k.slice(1)}</b><div class="d">every ${days} days</div></span>
          </button>`).join('')}
        </div>`,
      bind: body => {
        body.querySelectorAll('[data-gpf]').forEach(b => b.onclick = () => {
          _gd.desiredFrequency = b.dataset.gpf ? +b.dataset.gpf : null;
          body.querySelectorAll('[data-gpf]').forEach(x => x.classList.toggle('on', x === b));
        });
      },
    },
  ], () => {
    if(!_gd.name){ toast('A name, at least.'); return; }
    const p = newPerson(_gd.name);
    p.relationship = _gd.relationship;
    p.circle = _gd.circle;
    p.desiredFrequency = _gd.desiredFrequency;
    p.details.notes = _gd.notes;
    S.people.push(p); saveNow(); sound('success');
    if(currentRoute !== 'people') navigate('#/people'); else rerender();
    setTimeout(() => openPersonModal(p), currentRoute === 'people' ? 0 : 400);
    toast(`${p.name} added to your constellation.`);
  });
}

/* ---------- 4. New Media Entry — 4 steps ---------- */
function guidedNewMedia(){
  const _gd = { title: '', kind: 'book', creator: '', year: '', status: 'want', capture: '' };
  guidedFlow('New library entry', [
    {
      title: 'What are you bringing in?',
      hint: 'The title, and what kind of thing it is.',
      body: () => `
        <div class="stack">
          <input class="inp serif-lg" id="gmTitle" placeholder="Title" value="${esc(_gd.title)}">
          <div class="field"><label>Kind</label>
            <select class="sel" id="gmKind">${Object.entries(MEDIA_KINDS).map(([k,v])=>`<option value="${k}"${_gd.kind===k?' selected':''}>${esc(v.label||k)}</option>`).join('')}</select>
          </div>
        </div>`,
      bind: body => setTimeout(() => body.querySelector('#gmTitle')?.focus(), 40),
      next: body => {
        _gd.title = body.querySelector('#gmTitle').value.trim();
        _gd.kind = body.querySelector('#gmKind').value;
      },
    },
    {
      title: 'Who made it, and when?',
      hint: 'Author, director, artist — whoever. Year is optional.',
      body: () => `
        <div class="grid c2" style="gap:10px">
          <div class="field"><label>Creator</label><input class="inp" id="gmCreator" placeholder="Author / director…" value="${esc(_gd.creator)}"></div>
          <div class="field"><label>Year</label><input class="inp mono" id="gmYear" placeholder="2019" inputmode="numeric" value="${esc(_gd.year)}"></div>
        </div>`,
      bind: body => setTimeout(() => body.querySelector('#gmCreator')?.focus(), 40),
      next: body => {
        _gd.creator = body.querySelector('#gmCreator').value.trim();
        _gd.year = body.querySelector('#gmYear').value.trim();
      },
    },
    {
      title: 'Where are you with it?',
      hint: 'Your current status — you can change it any time.',
      body: () => `
        <div class="stack" style="gap:8px">
          ${(MEDIA_STATUS||['want','progress','finished','abandoned','reexperiencing']).map(k=>`
          <button class="choice ${_gd.status===k?'on':''}" data-gms="${k}">
            <span class="ico">${{want:'📌',progress:'▶',finished:'✓',abandoned:'✕',reexperiencing:'↩'}[k]||'·'}</span>
            <span><b>${k.charAt(0).toUpperCase()+k.slice(1)}</b></span>
          </button>`).join('')}
        </div>`,
      bind: body => {
        body.querySelectorAll('[data-gms]').forEach(b => b.onclick = () => {
          _gd.status = b.dataset.gms;
          body.querySelectorAll('[data-gms]').forEach(x => x.classList.toggle('on', x === b));
        });
      },
    },
    {
      title: 'In one sentence — what is this about at its deepest level?',
      hint: "Optional but powerful. You'll thank yourself later.",
      body: () => `<textarea class="ta" id="gmCapture" rows="3" placeholder="What it really asks of you, or says about the world…">${esc(_gd.capture)}</textarea>`,
      bind: body => setTimeout(() => body.querySelector('#gmCapture')?.focus(), 40),
      next: body => { _gd.capture = body.querySelector('#gmCapture').value.trim(); },
    },
  ], () => {
    if(!_gd.title){ toast('It needs a title.'); return; }
    const e = {
      id: uid(), kind: _gd.kind, title: _gd.title,
      creator: _gd.creator, year: _gd.year ? +_gd.year : null,
      status: _gd.status, rating: null, finishedAt: '', startedAt: '',
      capture: _gd.capture, review: '', highlights: [],
      links: {stages:[], threads:[], values:[], visions:[], skills:[], projects:[], people:[]},
      createdAt: new Date().toISOString(),
    };
    S.mediaQueue = Array.isArray(S.mediaQueue) ? S.mediaQueue : [];
    S.mediaQueue.push(e); saveNow(); sound('success');
    if(currentRoute !== 'commonplace') navigate('#/commonplace'); else rerender();
    toast(`"${e.title}" added to the Library.`);
  });
}

/* ---------- 5. New Income Stream — 3 steps ---------- */
function guidedNewStream(){
  const _gd = { name: '', current: 0, currency: (S.finance?.currency) || 'SGD', visionId: null };
  guidedFlow('New income stream', [
    {
      title: 'Name this income stream.',
      hint: 'What do you call this way of making money?',
      body: () => `<input class="inp serif-lg" id="gnName" placeholder="e.g. Freelance copywriting" value="${esc(_gd.name)}">`,
      bind: body => setTimeout(() => body.querySelector('#gnName')?.focus(), 40),
      next: body => { _gd.name = body.querySelector('#gnName').value.trim(); },
    },
    {
      title: 'Numbers now.',
      hint: "What does it earn currently, per month? Leave zero if it's still an idea.",
      body: () => `
        <div class="grid c2" style="gap:10px">
          <div class="field"><label>Current / month</label>
            <input class="inp mono" id="gnCurrent" placeholder="0" inputmode="decimal" value="${_gd.current||''}">
          </div>
          <div class="field"><label>Currency</label>
            <select class="sel" id="gnCur">${CURRENCIES.map(c=>`<option${_gd.currency===c?' selected':''}>${c}</option>`).join('')}</select>
          </div>
        </div>`,
      bind: body => setTimeout(() => body.querySelector('#gnCurrent')?.focus(), 40),
      next: body => {
        _gd.current = parseFloat(String(body.querySelector('#gnCurrent').value).replace(/[^\d.]/g,'')) || 0;
        _gd.currency = body.querySelector('#gnCur').value;
      },
    },
  ], () => {
    if(!_gd.name){ toast('Give it a name.'); return; }
    const income = {
      model: '', current: _gd.current, target: 0, currency: _gd.currency,
      milestones: [], status: _gd.current > 0 ? 'earning' : 'idea',
      hoursPerWeek: 0, peopleIds: [], revenueLog: [],
    };
    S.incomeStreams.push({id: uid(), name: _gd.name, ...income});
    saveNow(); sound('success');
    if(currentRoute !== 'finance') navigate('#/finance'); else rerender();
    toast(`"${_gd.name}" added to your income streams.`);
  });
}

/* ---------- 6. New Timeline Stage — 4 steps ---------- */
function guidedNewStage(){
  const _gd = { name: '', char: '✦', yearFrom: '', yearTo: '', narrative: '', notyet: false };
  guidedFlow('New chapter', [
    {
      title: 'Name this chapter.',
      hint: "The room you'll walk back into when you read the timeline.",
      body: () => `
        <div class="grid c2" style="gap:10px">
          <div class="field"><label>Character</label>
            <input class="inp mono" id="gsChar" maxlength="2" placeholder="✦" value="${esc(_gd.char)}" style="font-size:1.4rem;text-align:center">
          </div>
          <div class="field"><label>Name</label>
            <input class="inp serif-lg" id="gsName" placeholder="e.g. The Singapore years" value="${esc(_gd.name)}">
          </div>
        </div>`,
      bind: body => setTimeout(() => body.querySelector('#gsName')?.focus(), 40),
      next: body => {
        _gd.name = body.querySelector('#gsName').value.trim();
        _gd.char = body.querySelector('#gsChar').value.trim() || '✦';
      },
    },
    {
      title: 'When?',
      hint: 'A year range. Leave "until" blank if you\'re still in it, or check "not yet" for a future chapter.',
      body: () => `
        <div class="stack" style="gap:12px">
          <div class="grid c2" style="gap:10px">
            <div class="field"><label>From</label>
              <input class="inp mono" id="gsYFrom" placeholder="2018" inputmode="numeric" value="${esc(_gd.yearFrom)}">
            </div>
            <div class="field"><label>Until</label>
              <input class="inp mono" id="gsYTo" placeholder="2022 or blank if present" value="${esc(_gd.yearTo)}">
            </div>
          </div>
          <label class="row" style="gap:8px;cursor:pointer">
            <input type="checkbox" id="gsNotyet" ${_gd.notyet?'checked':''}>
            <span>This is a future chapter (not yet)</span>
          </label>
        </div>`,
      bind: body => setTimeout(() => body.querySelector('#gsYFrom')?.focus(), 40),
      next: body => {
        const f = body.querySelector('#gsYFrom').value.trim();
        const t = body.querySelector('#gsYTo').value.trim();
        _gd.yearFrom = f; _gd.yearTo = t;
        _gd.notyet = body.querySelector('#gsNotyet').checked;
      },
    },
    {
      title: 'The essence.',
      hint: 'What made this chapter itself? A few sentences you\'d say to someone who asked.',
      body: () => `<textarea class="ta" id="gsNarrative" rows="5" placeholder="This was the chapter I…">${esc(_gd.narrative)}</textarea>`,
      bind: body => setTimeout(() => body.querySelector('#gsNarrative')?.focus(), 40),
      next: body => { _gd.narrative = body.querySelector('#gsNarrative').value.trim(); },
    },
    {
      title: 'Status.',
      hint: 'Is this a chapter you\'re living, or one you\'re looking back on?',
      body: () => {
        const isNotyet = _gd.notyet;
        const active = !isNotyet && !_gd.yearTo;
        return `
        <div class="stack" style="gap:8px">
          ${[['past','📦','Past','a chapter closed'],['active','◉','Active',"you're living it now"],['notyet','◌','Not yet','a future chapter, planned']].map(([k,ico,label,d])=>`
          <button class="choice ${(k==='notyet'?isNotyet:k==='active'?active:(!isNotyet&&_gd.yearTo))?'on':''}" data-gss="${k}">
            <span class="ico">${ico}</span><span><b>${esc(label)}</b><div class="d">${esc(d)}</div></span>
          </button>`).join('')}
        </div>`;
      },
      bind: body => {
        body.querySelectorAll('[data-gss]').forEach(b => b.onclick = () => {
          _gd.notyet = b.dataset.gss === 'notyet';
          body.querySelectorAll('[data-gss]').forEach(x => x.classList.toggle('on', x === b));
        });
      },
    },
  ], () => {
    if(!_gd.name){ toast('A chapter needs a name.'); return; }
    const hues = typeof STAGE_HUES !== 'undefined' ? STAGE_HUES : ['#6b7f8e','#7f916a','#b08968','#a0727e','#d4a44c','#8a7f9e'];
    const f = _gd.yearFrom, t = _gd.yearTo;
    const years = f && t ? `${f}–${t}` : f ? `${f}–` : '';
    const s = {
      id: uid(), num: 0, char: _gd.char, name: _gd.name, tagline: '',
      hue: hues[S.stages.length % hues.length],
      years, narrative: _gd.narrative, narrativeHistory: [],
      substages: [], photos: [], soundtrack: [], artifacts: [],
      letters: {to:'', from:''}, retroValues: {}, notyet: _gd.notyet,
    };
    const ny = S.stages.findIndex(x => x.notyet);
    if(ny >= 0) S.stages.splice(ny, 0, s); else S.stages.push(s);
    renumberStages(); saveNow(); sound('success');
    if(parseHash().name !== 'journals') navigate('#/journals/timeline'); else rerender();
    toast(`"${s.name}" added to your Timeline.`);
  });
}
