/* The Classroom: a static, content-driven study site.
   Routes (hash based, so it works on any static host incl. GitHub Pages):
     #/                                   corridor: all semesters and courses
     #/<sem>/<course>                     a classroom: the course's syllabus board
     #/<sem>/<course>/<chapter>/<tab>[/n] a lesson: lesson | worked | lab | cards | quiz | sheet
   All content comes from content/catalog.js and the chapter content files it points to. */
(function () {
  'use strict';
  const { esc, md, fmt, store, shuffle } = CU;
  const app = document.getElementById('app');
  const crumbs = document.getElementById('crumbs');

  const CATALOG_URL = 'content/catalog.js';
  const PKEY = 'classroom.progress.v1';
  const TABS = [
    { id: 'lesson', label: 'Chalkboard', icon: '✎', has: (c) => c.lesson?.length },
    { id: 'worked', label: 'Worked problems', icon: '✓', has: (c) => c.worked?.length },
    { id: 'lab', label: 'Lab bench', icon: '⚗', has: (c) => c.labs?.length },
    { id: 'cards', label: 'Flashcards', icon: '❏', has: (c) => c.flashcards?.length },
    { id: 'quiz', label: 'Pop quiz', icon: '?', has: (c) => c.quiz?.length },
    { id: 'sheet', label: 'Cheat sheet', icon: '≡', has: (c) => c.formulas?.length }
  ];

  let catalog = null;
  const chapterCache = {};
  let progress = store.get(PKEY, {});

  /* ---------- progress ---------- */
  const P = {
    of(key) { return (progress[key] ||= { seen: [], worked: [], known: [], quizBest: null }); },
    save() { store.set(PKEY, progress); },
    mark(key, field, idx) { const p = P.of(key); if (!p[field].includes(idx)) { p[field].push(idx); P.save(); } },
    unmark(key, field, idx) { const p = P.of(key); p[field] = p[field].filter((i) => i !== idx); P.save(); },
    /* 0..1 completion of a chapter, averaged over the parts it has */
    score(key, ch) {
      const p = progress[key]; if (!p || !ch) return 0;
      const parts = [];
      if (ch.lesson?.length) parts.push(p.seen.length / ch.lesson.length);
      if (ch.worked?.length) parts.push(p.worked.length / ch.worked.length);
      if (ch.flashcards?.length) parts.push(p.known.length / ch.flashcards.length);
      if (ch.quiz?.length) parts.push(p.quizBest ? p.quizBest.score / p.quizBest.total : 0);
      return parts.length ? Math.min(1, parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
    }
  };
  const stars = (s) => {
    const n = s >= 0.95 ? 3 : s >= 0.6 ? 2 : s >= 0.25 ? 1 : 0;
    return `<span class="stars" title="${Math.round(s * 100)}% done" aria-label="${n} of 3 stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(3 - n)}</span></span>`;
  };

  /* ---------- data ---------- */
  /* Content files are scripts that call ClassroomContent({...}). Loading them with a <script> tag
     (instead of fetch) means the site works when opened straight from disk, with no server. */
  const contentStore = {};
  window.ClassroomContent = (data) => {
    const key = document.currentScript && document.currentScript.dataset.key;
    if (key) contentStore[key] = data;
  };
  function getJSON(url) {
    if (contentStore[url]) return Promise.resolve(contentStore[url]);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.dataset.key = url;
      s.onload = () => (contentStore[url] ? resolve(contentStore[url]) : reject(new Error(`${url} did not call ClassroomContent(...)`)));
      s.onerror = () => { s.remove(); reject(new Error(`Could not load ${url}`)); };
      document.head.appendChild(s);
    });
  }
  async function loadCatalog() {
    if (!catalog) {
      catalog = await getJSON(CATALOG_URL);
      if (catalog.school?.name) { document.getElementById('school-name').textContent = catalog.school.name; }
      if (catalog.school?.tagline) document.getElementById('school-tag').textContent = catalog.school.tagline;
    }
    return catalog;
  }
  async function loadChapter(meta) {
    if (!meta.file) return null;
    if (!chapterCache[meta.file]) chapterCache[meta.file] = await getJSON(meta.file);
    return chapterCache[meta.file];
  }
  function find(semId, courseId, chId) {
    const sem = catalog.semesters.find((s) => s.id === semId);
    const course = sem?.courses.find((c) => c.id === courseId);
    const ch = course?.chapters.find((c) => c.id === chId);
    return { sem, course, ch };
  }

  /* ---------- rendering helpers ---------- */
  function setCrumbs(items) {
    crumbs.innerHTML = items.map((it, i) => (i < items.length - 1 && it.href
      ? `<a href="${it.href}">${esc(it.label)}</a>` : `<span aria-current="page">${esc(it.label)}</span>`)).join('<span class="sep">›</span>');
  }
  function setTitle(t) { document.title = t ? `${t} · ${catalog?.school?.name || 'The Classroom'}` : (catalog?.school?.name || 'The Classroom'); }

  /* Content blocks -> HTML. Widgets become placeholders that are mounted after insertion. */
  function renderBlocks(blocks, widgets) {
    return (blocks || []).map((b) => {
      switch (b.type) {
        case 'p': return `<p>${md(b.text)}</p>`;
        case 'h': return `<h3 class="chalk-h">${md(b.text)}</h3>`;
        case 'list': return `<ul class="chalk-list">${b.items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>`;
        case 'steps': return `<ol class="chalk-list">${b.items.map((i) => `<li>${md(i)}</li>`).join('')}</ol>`;
        case 'formula': return `<div class="formula">${md(b.text)}${b.caption ? `<div class="formula-cap">${md(b.caption)}</div>` : ''}</div>`;
        case 'note': return `<aside class="sticky ${b.color || ''}"><div class="sticky-label">${esc(b.label || 'Note')}</div>${md(b.text)}</aside>`;
        case 'trap': return `<aside class="trap"><div class="trap-label">${esc(b.label || 'Exam trap')}</div>${md(b.text)}</aside>`;
        case 'table': return `<div class="table-wrap"><table class="chalk-table"><thead><tr>${b.head.map((h) => `<th>${md(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        case 'widget': { widgets.push(b); return `<div class="widget-slot" data-wi="${widgets.length - 1}"></div>`; }
        default: return b.text ? `<p>${md(b.text)}</p>` : '';
      }
    }).join('');
  }
  function mountWidgets(root, widgets) {
    root.querySelectorAll('.widget-slot').forEach((slot) => {
      const w = widgets[+slot.dataset.wi];
      Widgets.mount(w.widget, slot, w.config);
    });
  }

  /* ---------- views ---------- */
  function viewError(err) {
    app.innerHTML = `<section class="board big-board"><div class="board-inner">
      <h2 class="chalk-title">Oops: the board is blank</h2>
      <p>${esc(err.message || err)}</p>
      <p>Check that the file path in <code>content/catalog.js</code> is right and the file is valid.</p>
      <p><a class="btn btn-chalk" href="#/">Back to the corridor</a></p></div></section>`;
  }

  function viewHome() {
    setCrumbs([{ label: 'Corridor' }]); setTitle('');
    const sems = catalog.semesters.map((sem) => `
      <section class="floor">
        <div class="floor-sign"><span class="pin"></span><h2>${esc(sem.title)}</h2>${sem.subtitle ? `<p>${esc(sem.subtitle)}</p>` : ''}</div>
        <div class="doors">
          ${sem.courses.map((c) => {
            const ready = c.chapters.filter((ch) => ch.file && !ch.comingSoon);
            const scores = ready.map((ch) => P.score(`${sem.id}/${c.id}/${ch.id}`, chapterCache[ch.file]));
            const pct = ready.length ? scores.reduce((a, b) => a + b, 0) / ready.length : 0;
            return `<a class="door" href="#/${sem.id}/${c.id}" style="--door:${esc(c.color || '#b5523b')}">
              <span class="door-plate">${esc(c.room || c.code || '')}</span>
              <span class="door-window"></span>
              <span class="door-title">${esc(c.title)}</span>
              <span class="door-code">${esc(c.code || '')}</span>
              <span class="door-meta">${ready.length} of ${c.chapters.length} chapters ready</span>
              <span class="door-bar"><span style="width:${Math.round(pct * 100)}%"></span></span>
              <span class="door-knob"></span>
            </a>`;
          }).join('')}
        </div>
      </section>`).join('');
    app.innerHTML = `
      <section class="hero board"><div class="board-inner">
        <h1 class="chalk-title">${esc(catalog.school?.welcome || 'Welcome to class')}</h1>
        <p class="chalk-sub">${esc(catalog.school?.intro || 'Pick a classroom. Every chapter has a chalkboard lesson, worked problems, a lab bench, flashcards, a pop quiz and a cheat sheet.')}</p>
        <div class="chalk-tray"><span class="chalk c1"></span><span class="chalk c2"></span><span class="chalk c3"></span><span class="duster"></span></div>
      </div></section>
      ${sems}`;
    // warm the cache so the door progress bars fill in
    catalog.semesters.forEach((s) => s.courses.forEach((c) => c.chapters.forEach((ch) => {
      if (ch.file && !ch.comingSoon && !chapterCache[ch.file]) loadChapter(ch).then(() => { if (location.hash.replace(/^#\/?/, '') === '') viewHome(); }).catch(() => {});
    })));
  }

  function viewCourse(sem, course) {
    setCrumbs([{ label: 'Corridor', href: '#/' }, { label: course.title }]); setTitle(course.title);
    app.innerHTML = `
      <section class="room-head">
        <div class="room-plate" style="--door:${esc(course.color || '#b5523b')}">${esc(course.room || course.code || '')}</div>
        <div><h1 class="room-title">${esc(course.title)}</h1>
        <p class="room-sub">${esc([course.code, course.teacher && `Teacher: ${course.teacher}`, sem.title].filter(Boolean).join(' · '))}</p></div>
      </section>
      ${course.description ? `<p class="room-desc">${md(course.description)}</p>` : ''}
      <section class="corkboard">
        <h2 class="cork-title">Syllabus board</h2>
        <div class="pinned">
          ${course.chapters.map((ch, i) => {
            const ready = ch.file && !ch.comingSoon;
            const key = `${sem.id}/${course.id}/${ch.id}`;
            const tilt = ((i * 37) % 5) - 2;
            const inner = `<span class="pin red"></span>
              <span class="card-num">Chapter ${esc(ch.number ?? i + 1)}</span>
              <span class="card-title">${esc(ch.title)}</span>
              ${ch.blurb ? `<span class="card-blurb">${esc(ch.blurb)}</span>` : ''}
              ${ready ? `<span class="card-foot">${stars(P.score(key, chapterCache[ch.file]))}<span class="go">Enter →</span></span>` : '<span class="stamp">Coming soon</span>'}`;
            return ready
              ? `<a class="index-card" style="--tilt:${tilt}deg" href="#/${sem.id}/${course.id}/${ch.id}/lesson">${inner}</a>`
              : `<div class="index-card soon" style="--tilt:${tilt}deg">${inner}</div>`;
          }).join('')}
        </div>
      </section>`;
    course.chapters.forEach((ch) => {
      if (ch.file && !ch.comingSoon && !chapterCache[ch.file]) loadChapter(ch).then(() => {
        const parts = location.hash.replace(/^#\/?/, '').split('/');
        if (parts.length === 2 && parts[1] === course.id) viewCourse(sem, course);
      }).catch(() => {});
    });
  }

  async function viewChapter(sem, course, meta, tab, sub) {
    const ch = await loadChapter(meta);
    const key = `${sem.id}/${course.id}/${meta.id}`;
    const base = `#/${sem.id}/${course.id}/${meta.id}`;
    const tabs = TABS.filter((t) => t.has(ch));
    if (!tabs.find((t) => t.id === tab)) tab = tabs[0]?.id;
    setCrumbs([{ label: 'Corridor', href: '#/' }, { label: course.title, href: `#/${sem.id}/${course.id}` }, { label: `Ch ${meta.number ?? ''} · ${ch.title || meta.title}` }]);
    setTitle(ch.title || meta.title);

    app.innerHTML = `
      <section class="lesson-head">
        <div>
          <p class="eyebrow">${esc(course.code || course.title)} · Chapter ${esc(meta.number ?? '')}</p>
          <h1 class="room-title">${esc(ch.title || meta.title)}</h1>
          ${ch.subtitle ? `<p class="room-sub">${md(ch.subtitle)}</p>` : ''}
        </div>
        <div class="report-card" title="Your progress on this chapter">
          <span class="rc-label">Report card</span>${stars(P.score(key, ch))}
          <span class="rc-pct">${Math.round(P.score(key, ch) * 100)}%</span>
        </div>
      </section>
      <nav class="desk-tabs" role="tablist">
        ${tabs.map((t) => `<a role="tab" class="desk-tab ${t.id === tab ? 'on' : ''}" aria-selected="${t.id === tab}" href="${base}/${t.id}"><span class="ti">${t.icon}</span>${t.label}</a>`).join('')}
      </nav>
      <section id="tab-body" class="tab-body"></section>`;
    const body = document.getElementById('tab-body');
    const ctx = { ch, key, base, body, sub };
    ({ lesson: tabLesson, worked: tabWorked, lab: tabLab, cards: tabCards, quiz: tabQuiz, sheet: tabSheet })[tab](ctx);
  }

  function refreshReportCard(ctx) {
    const rc = document.querySelector('.report-card');
    if (!rc) return;
    const s = P.score(ctx.key, ctx.ch);
    rc.innerHTML = `<span class="rc-label">Report card</span>${stars(s)}<span class="rc-pct">${Math.round(s * 100)}%</span>`;
  }

  /* --- Chalkboard lesson --- */
  function tabLesson(ctx) {
    const { ch, key, base, body } = ctx;
    const n = ch.lesson.length;
    let i = Math.min(Math.max(0, parseInt(ctx.sub, 10) || 0), n - 1);
    const seen = P.of(key).seen;
    const widgets = [];
    const sec = ch.lesson[i];
    body.innerHTML = `
      <div class="lesson-layout">
        <details class="clipboard" ${window.innerWidth > 860 ? 'open' : ''}>
          <div class="clip"></div>
          <summary><h3>Lesson plan <small class="muted">(${seen.length}/${n} seen)</small></h3></summary>
          <ol>${ch.lesson.map((s, j) => `<li class="${j === i ? 'on' : ''} ${seen.includes(j) ? 'done' : ''}"><a href="${base}/lesson/${j}">${esc(s.title)}</a></li>`).join('')}</ol>
        </details>
        <article class="board big-board">
          <div class="board-inner">
            <div class="board-count">Board ${i + 1} / ${n}</div>
            <h2 class="chalk-title">${md(sec.title)}</h2>
            ${sec.lead ? `<p class="chalk-sub">${md(sec.lead)}</p>` : ''}
            <div class="board-content">${renderBlocks(sec.blocks, widgets)}</div>
          </div>
          <div class="board-ledge">
            ${i > 0 ? `<a class="btn" href="${base}/lesson/${i - 1}">← Previous board</a>` : '<span></span>'}
            ${i < n - 1 ? `<a class="btn btn-chalk" href="${base}/lesson/${i + 1}">Next board →</a>`
              : `<a class="btn btn-chalk" href="${base}/${ch.worked?.length ? 'worked' : ch.quiz?.length ? 'quiz' : 'lesson'}">Lesson done: practise →</a>`}
          </div>
        </article>
      </div>`;
    mountWidgets(body, widgets);
    P.mark(key, 'seen', i); refreshReportCard(ctx);
    document.querySelector('.clipboard li.on')?.classList.add('done');
    ctx.keys = (e) => {
      if (e.key === 'ArrowRight' && i < n - 1) location.hash = `${base}/lesson/${i + 1}`;
      if (e.key === 'ArrowLeft' && i > 0) location.hash = `${base}/lesson/${i - 1}`;
    };
    keyHandler = ctx.keys;
  }

  /* --- Worked problems: reveal one step at a time --- */
  function tabWorked(ctx) {
    const { ch, key, body } = ctx;
    const done = P.of(key).worked;
    const widgets = [];
    body.innerHTML = `<p class="tab-intro">Try each step on paper first, then reveal it. A problem counts as done once every step is revealed.</p>
      <div class="notebooks">
      ${ch.worked.map((w, i) => `
        <article class="notebook" data-i="${i}">
          <header><span class="nb-num">Problem ${i + 1}</span>${done.includes(i) ? '<span class="tick">✓ done</span>' : ''}
            ${(w.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</header>
          <h3>${md(w.title)}</h3>
          <div class="nb-problem">${renderBlocks(w.problem, widgets)}</div>
          <ol class="nb-steps">
            ${w.steps.map((s, j) => `<li class="nb-step" data-j="${j}" hidden><span class="step-label">${md(s.label || `Step ${j + 1}`)}</span><div>${md(s.text)}</div></li>`).join('')}
          </ol>
          ${w.answer ? `<div class="nb-answer" hidden><b>Answer:</b> ${md(w.answer)}</div>` : ''}
          <div class="btn-row">
            <button class="btn btn-chalk" data-act="next" type="button">Reveal next step</button>
            <button class="btn" data-act="all" type="button">Show all</button>
            <button class="btn" data-act="hide" type="button">Hide again</button>
          </div>
        </article>`).join('')}
      </div>`;
    mountWidgets(body, widgets);
    body.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-act]'); if (!btn) return;
      const nb = btn.closest('.notebook'); const i = +nb.dataset.i;
      const steps = [...nb.querySelectorAll('.nb-step')]; const ans = nb.querySelector('.nb-answer');
      if (btn.dataset.act === 'next') { const s = steps.find((x) => x.hidden); if (s) { s.hidden = false; s.classList.add('chalk-in'); } }
      if (btn.dataset.act === 'all') steps.forEach((s) => { s.hidden = false; });
      if (btn.dataset.act === 'hide') { steps.forEach((s) => { s.hidden = true; }); if (ans) ans.hidden = true; }
      const all = steps.every((s) => !s.hidden);
      if (all && ans) ans.hidden = false;
      btn.closest('.btn-row').querySelector('[data-act="next"]').disabled = all;
      if (all && !P.of(key).worked.includes(i)) {
        P.mark(key, 'worked', i); refreshReportCard(ctx);
        nb.querySelector('header').insertAdjacentHTML('beforeend', '<span class="tick">✓ done</span>');
      }
    });
  }

  /* --- Lab bench --- */
  function tabLab(ctx) {
    const { ch, body } = ctx;
    const widgets = [];
    body.innerHTML = `<div class="labs">${ch.labs.map((l) => `
      <section class="lab-card">
        <h2 class="lab-title">${md(l.title)}</h2>
        ${l.intro ? `<p class="tab-intro">${md(l.intro)}</p>` : ''}
        ${l.tryThis ? `<aside class="sticky"><div class="sticky-label">Try this</div><ul>${l.tryThis.map((t) => `<li>${md(t)}</li>`).join('')}</ul></aside>` : ''}
        ${renderBlocks([{ type: 'widget', widget: l.widget, config: l.config }], widgets)}
      </section>`).join('')}</div>`;
    mountWidgets(body, widgets);
  }

  /* --- Flashcards --- */
  function tabCards(ctx) {
    const { ch, key, body } = ctx;
    let order = ch.flashcards.map((_, i) => i);
    let pos = 0; let onlyLeft = false;
    const known = () => P.of(key).known;
    function deck() { return onlyLeft ? order.filter((i) => !known().includes(i)) : order; }
    function render() {
      const d = deck();
      if (!d.length) {
        body.innerHTML = `<div class="cards-wrap"><div class="flashcard done-card"><div class="face front"><p class="fc-q">You know every card in this deck. ★</p></div></div>
          <div class="btn-row center"><button class="btn btn-chalk" data-act="all" type="button">Study all cards again</button><button class="btn" data-act="clear" type="button">Forget my marks</button></div></div>`;
        return;
      }
      pos = Math.min(pos, d.length - 1);
      const c = ch.flashcards[d[pos]];
      body.innerHTML = `
        <div class="cards-wrap">
          <div class="cards-top"><span>Card ${pos + 1} of ${d.length}${onlyLeft ? ' (still learning)' : ''}</span><span>${known().length} / ${ch.flashcards.length} known</span></div>
          <button class="flashcard" type="button" aria-label="Flip card">
            <span class="face front"><span class="fc-tag">${esc(c.tag || 'Question')}</span><span class="fc-q">${md(c.front)}</span><span class="fc-hint">tap or press space to flip</span></span>
            <span class="face back"><span class="fc-tag">Answer</span><span class="fc-a">${md(c.back)}</span></span>
          </button>
          <div class="btn-row center">
            <button class="btn" data-act="prev" type="button">←</button>
            <button class="btn btn-again" data-act="again" type="button">Still learning</button>
            <button class="btn btn-chalk" data-act="know" type="button">Got it ✓</button>
            <button class="btn" data-act="next" type="button">→</button>
          </div>
          <div class="btn-row center small">
            <button class="linkish" data-act="shuffle" type="button">Shuffle</button>
            <button class="linkish" data-act="left" type="button">${onlyLeft ? 'Show all cards' : 'Only cards I am still learning'}</button>
          </div>
        </div>`;
    }
    body.onclick = (ev) => {
      if (ev.target.closest('.flashcard')) { body.querySelector('.flashcard').classList.toggle('flipped'); return; }
      const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return;
      const d = deck(); const idx = d[pos];
      if (a === 'next') pos = (pos + 1) % d.length;
      if (a === 'prev') pos = (pos - 1 + d.length) % d.length;
      if (a === 'know') { P.mark(key, 'known', idx); refreshReportCard(ctx); if (!onlyLeft) pos = (pos + 1) % d.length; }
      if (a === 'again') { P.unmark(key, 'known', idx); refreshReportCard(ctx); pos = (pos + 1) % d.length; }
      if (a === 'shuffle') { order = shuffle(order); pos = 0; }
      if (a === 'left') { onlyLeft = !onlyLeft; pos = 0; }
      if (a === 'all') { onlyLeft = false; pos = 0; }
      if (a === 'clear') { P.of(key).known = []; P.save(); refreshReportCard(ctx); onlyLeft = false; pos = 0; }
      render();
    };
    keyHandler = (e) => {
      if (e.key === ' ' && !e.target.closest('input,textarea')) { e.preventDefault(); body.querySelector('.flashcard')?.classList.toggle('flipped'); }
      if (e.key === 'ArrowRight') body.querySelector('[data-act="next"]')?.click();
      if (e.key === 'ArrowLeft') body.querySelector('[data-act="prev"]')?.click();
    };
    render();
  }

  /* --- Pop quiz --- */
  function tabQuiz(ctx) {
    const { ch, key, body } = ctx;
    let qs = ch.quiz.map((q, i) => ({ ...q, _i: i, _opts: q.options ? q.options.map((o, j) => ({ o, j })) : null }));
    function render(shuffled) {
      if (shuffled) qs = shuffle(qs).map((q) => ({ ...q, _opts: q._opts ? shuffle(q._opts) : null }));
      const best = P.of(key).quizBest;
      body.innerHTML = `
        <form class="exam-paper" novalidate>
          <header class="exam-head"><div><b>Pop quiz</b>: ${esc(ch.title)}</div><div>Name: ____________ &nbsp; Marks: ___ / ${qs.length}</div></header>
          ${best ? `<p class="small muted">Your best so far: ${best.score} / ${best.total}</p>` : ''}
          ${qs.map((q, n) => `
            <fieldset class="exam-q" data-n="${n}">
              <legend><span class="qn">Q${n + 1}.</span> ${md(q.q)}</legend>
              ${q.type === 'numeric'
                ? `<label class="num-ans">Answer: <input type="text" inputmode="decimal" name="q${n}" autocomplete="off">${q.unit ? ` <span>${esc(q.unit)}</span>` : ''}</label>`
                : q._opts.map((o) => `<label class="opt"><input type="radio" name="q${n}" value="${o.j}"> <span>${md(o.o)}</span></label>`).join('')}
              <div class="feedback" hidden></div>
            </fieldset>`).join('')}
          <div class="btn-row"><button class="btn btn-chalk" type="submit">Hand in my paper</button>
            <button class="btn" type="button" data-act="shuffle">New paper (shuffled)</button></div>
          <div class="grade" hidden></div>
        </form>`;
    }
    body.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const form = ev.target; let score = 0;
      qs.forEach((q, n) => {
        const fs = form.querySelector(`[data-n="${n}"]`); const fb = fs.querySelector('.feedback');
        let ok = false; let given = '';
        if (q.type === 'numeric') {
          const raw = fs.querySelector('input').value.trim().replace('−', '-');
          const v = Number(raw); given = raw;
          const tol = q.tolerance ?? Math.max(Math.abs(q.answer) * 0.01, 0.005);
          ok = raw !== '' && Number.isFinite(v) && Math.abs(v - q.answer) <= tol;
        } else {
          const sel = fs.querySelector('input:checked'); given = sel ? sel.value : '';
          ok = sel && Number(sel.value) === q.answer;
          fs.querySelectorAll('.opt').forEach((lab) => {
            const v = Number(lab.querySelector('input').value);
            lab.classList.toggle('right', v === q.answer);
            lab.classList.toggle('wrong', sel && v === Number(sel.value) && v !== q.answer);
          });
        }
        if (ok) score++;
        fs.classList.toggle('is-right', !!ok); fs.classList.toggle('is-wrong', !ok);
        fb.hidden = false;
        fb.innerHTML = `<b>${ok ? '✓ Correct.' : given === '' ? '✗ Left blank.' : '✗ Not quite.'}</b> ${q.type === 'numeric' ? `Answer: <b>${fmt(q.answer)}</b>${q.unit ? ' ' + esc(q.unit) : ''}. ` : ''}${md(q.explain || '')}`;
      });
      const total = qs.length;
      const prev = P.of(key).quizBest;
      if (!prev || score > prev.score) { P.of(key).quizBest = { score, total, at: Date.now() }; P.save(); refreshReportCard(ctx); }
      const g = form.querySelector('.grade'); g.hidden = false;
      const pct = score / total;
      g.innerHTML = `<div class="grade-circle">${score}/${total}</div><p>${pct === 1 ? 'Full marks! Gold star.' : pct >= 0.7 ? 'Good work. Read the red feedback and try a new paper.' : 'Back to the chalkboard for the red ones, then try again.'}</p>`;
      g.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    body.addEventListener('click', (ev) => { if (ev.target.closest('[data-act="shuffle"]')) { render(true); window.scrollTo({ top: body.offsetTop - 20, behavior: 'smooth' }); } });
    render(false);
  }

  /* --- Cheat sheet --- */
  function tabSheet(ctx) {
    const { ch, body } = ctx;
    body.innerHTML = `
      <div class="cheat-sheet">
        <div class="cs-head"><b>Cheat sheet</b> · ${esc(ch.title)} <button class="btn small-btn" type="button" onclick="window.print()">Print</button></div>
        <table class="cs-table"><tbody>
        ${ch.formulas.map((f) => `<tr><th>${md(f.name)}</th><td><div class="cs-f">${md(f.formula)}</div>${f.note ? `<div class="cs-note">${md(f.note)}</div>` : ''}</td></tr>`).join('')}
        </tbody></table>
      </div>`;
  }

  /* ---------- router ---------- */
  let keyHandler = null;
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    keyHandler && keyHandler(e);
  });

  async function route() {
    keyHandler = null;
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    try {
      await loadCatalog();
      const [semId, courseId, chId, tab, sub] = parts;
      if (!semId) return viewHome();
      const { sem, course, ch } = find(semId, courseId, chId);
      if (!sem || !course) return viewHome();
      if (!chId) return viewCourse(sem, course);
      if (!ch || !ch.file || ch.comingSoon) return viewCourse(sem, course);
      await viewChapter(sem, course, ch, tab || 'lesson', sub);
    } catch (err) {
      console.error(err); viewError(err);
    } finally {
      window.scrollTo({ top: 0 });
    }
  }

  /* two-click reset (no browser dialogs: they are blocked in some embeds) */
  const resetBtn = document.getElementById('reset-progress');
  let resetArmed = null;
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
      resetBtn.textContent = 'Click again to wipe all stars, cards and quiz scores';
      resetArmed = setTimeout(() => { resetArmed = null; resetBtn.textContent = 'Reset my progress'; }, 4000);
      return;
    }
    clearTimeout(resetArmed); resetArmed = null;
    progress = {}; store.remove(PKEY);
    resetBtn.textContent = 'Progress cleared ✓';
    setTimeout(() => { resetBtn.textContent = 'Reset my progress'; }, 2500);
    route();
  });
  window.addEventListener('hashchange', route);
  route();
})();
