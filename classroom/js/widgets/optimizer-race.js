/* Lab: optimizers on the deck's elongated bowl L(w1, w2) = a·w1² + b·w2² (default 1 and 4).
   Shows a step table for the chosen optimizer and every optimizer's path on one plot.
   config: { a: 1, b: 4, w: "4, 2", eta: 0.05, beta: 0.9, gamma: 0.9, beta2: 0.999, steps: 4, opt: "momentum" } */
(function () {
  'use strict';
  const { esc, fmt, parseNums } = CU;
  const NAMES = { gd: 'Gradient descent', momentum: 'Momentum', adagrad: 'AdaGrad', rmsprop: 'RMSprop', adam: 'Adam' };
  const COLORS = { gd: 'white', momentum: 'yellow', adagrad: 'green', rmsprop: 'blue', adam: 'pink' };

  function run(opt, P, steps) {
    const L = (w) => P.a * w[0] ** 2 + P.b * w[1] ** 2; const G = (w) => [2 * P.a * w[0], 2 * P.b * w[1]];
    let w = P.w.slice(); let v = [0, 0], s = [0, 0], m = [0, 0]; const rows = [];
    for (let t = 1; t <= steps; t++) {
      const g = G(w); const row = { t: t - 1, w: w.slice(), L: L(w), g };
      if (opt === 'gd') { w = w.map((x, i) => x - P.eta * g[i]); row.note = `w − η·g`; }
      if (opt === 'momentum') { v = v.map((x, i) => P.beta * x + g[i]); w = w.map((x, i) => x - P.eta * v[i]); row.v = v.slice(); }
      if (opt === 'adagrad') { s = s.map((x, i) => x + g[i] ** 2); const e = s.map((x) => P.eta / Math.sqrt(x + 1e-8)); w = w.map((x, i) => x - e[i] * g[i]); row.s = s.slice(); row.e = e; }
      if (opt === 'rmsprop') { s = s.map((x, i) => P.gamma * x + (1 - P.gamma) * g[i] ** 2); const e = s.map((x) => P.eta / Math.sqrt(x + 1e-8)); w = w.map((x, i) => x - e[i] * g[i]); row.s = s.slice(); row.e = e; }
      if (opt === 'adam') {
        m = m.map((x, i) => P.beta * x + (1 - P.beta) * g[i]); s = s.map((x, i) => P.beta2 * x + (1 - P.beta2) * g[i] ** 2);
        const mh = m.map((x) => x / (1 - P.beta ** t)), vh = s.map((x) => x / (1 - P.beta2 ** t));
        w = w.map((x, i) => x - P.eta * mh[i] / (Math.sqrt(vh[i]) + 1e-8)); row.m = m.slice(); row.s = s.slice(); row.mh = mh; row.vh = vh;
      }
      row.wNew = w.slice(); row.LNew = L(w); rows.push(row);
      if (!Number.isFinite(row.LNew) || Math.abs(row.LNew) > 1e9) break;
    }
    return rows;
  }

  Widgets.register('optimizer-race', {
    mount(el, cfg) {
      const num = (k, label, val, step = 'any') => `<label class="field" style="min-width:110px"><span>${label}</span><input data-k="${k}" type="number" step="${step}" value="${esc(val)}"></label>`;
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <div class="field-row">
              <label class="field"><span>Optimizer for the table</span><select data-k="opt">${Object.entries(NAMES).map(([k, n]) => `<option value="${k}" ${k === (cfg.opt || 'momentum') ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
              ${num('a', 'L = a·w₁² …  a', cfg.a ?? 1)}${num('b', '… + b·w₂²  b', cfg.b ?? 4)}
              <label class="field" style="min-width:110px"><span>start (w₁, w₂)</span><input data-k="w" type="text" value="${esc(cfg.w ?? '4, 2')}"></label>
            </div>
            <div class="field-row">${num('eta', 'η', cfg.eta ?? 0.05)}${num('beta', 'β / β₁', cfg.beta ?? 0.9)}${num('gamma', 'γ (RMSprop)', cfg.gamma ?? 0.9)}${num('beta2', 'β₂ (Adam)', cfg.beta2 ?? 0.999)}${num('steps', 'steps', cfg.steps ?? 4, 1)}</div>
            <p class="small muted">Momentum (deck): v ← βv + g, w ← w − ηv. RMSprop: s ← γs + (1 − γ)g². AdaGrad: s ← s + g². Adam: bias-corrected m̂/√v̂.</p>
          </div>
          <div class="lab-boards">
            <div class="board mini"><div class="board-title">Paths on the contour bowl (all optimizers)</div><canvas data-k="plot"></canvas><p class="board-note" data-k="leg"></p></div>
            <div class="board mini"><div class="board-title">Loss after each step</div><canvas data-k="loss"></canvas></div>
          </div>
          <div class="board trace-board"><div class="board-title" data-k="tt">Step table</div><div class="trace" data-k="tab" style="overflow-x:auto"></div></div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      function render() {
        const w = parseNums(q('w').value);
        const P = { a: +q('a').value || 1, b: +q('b').value || 4, w: w && w.length === 2 ? w : [4, 2], eta: +q('eta').value || 0.05, beta: +q('beta').value, gamma: +q('gamma').value, beta2: +q('beta2').value };
        const steps = Math.max(1, Math.min(200, Math.round(+q('steps').value || 4)));
        const opt = q('opt').value; const all = {};
        Object.keys(NAMES).forEach((k) => { all[k] = run(k, P, Math.max(steps, 30)); });
        const rows = run(opt, P, steps);
        const pts = (r) => [r[0].w, ...r.map((x) => x.wNew)].filter((p) => p.every(Number.isFinite) && Math.abs(p[0]) < 50 && Math.abs(p[1]) < 50);
        const R = Math.max(Math.abs(P.w[0]), Math.abs(P.w[1]) * 1.6, 1) * 1.15;
        const series = [];
        [0.25, 0.5, 1, 2, 4].forEach((f) => { const c = P.a * P.w[0] ** 2 * f / 2; const ring = []; for (let i = 0; i <= 80; i++) { const th = (2 * Math.PI * i) / 80; ring.push([Math.sqrt(c / P.a) * Math.cos(th), Math.sqrt(c / P.b) * Math.sin(th)]); } series.push({ points: ring, kind: 'line', color: 'faint', width: 1 }); });
        Object.keys(NAMES).forEach((k) => series.push({ points: pts(all[k]), kind: 'path', color: COLORS[k], width: k === opt ? 3 : 1.6, radius: k === opt ? 3.5 : 2 }));
        ChalkPlot.draw(q('plot'), { series, xlim: [-R, R], ylim: [-R * 0.75, R * 0.75], xlabel: 'w₁', ylabel: 'w₂', height: 280 });
        q('leg').innerHTML = Object.keys(NAMES).map((k) => `<span style="color:${ChalkPlot.CHALK[COLORS[k]]}">● ${NAMES[k]} (${fmt(all[k][Math.min(steps, all[k].length) - 1]?.LNew, 3)} after ${steps})</span>`).join(' &nbsp; ');
        const lossSeries = Object.keys(NAMES).map((k) => ({ points: [[0, all[k][0].L], ...all[k].slice(0, steps).map((r, i) => [i + 1, r.LNew])].filter((p) => Number.isFinite(p[1])), kind: 'path', color: COLORS[k], width: k === opt ? 3 : 1.5, radius: 2 }));
        const top = all.gd[0].L * 1.3;
        ChalkPlot.draw(q('loss'), { series: lossSeries, xlim: [0, steps], ylim: [0, top], xlabel: 'step', ylabel: 'L', height: 280 });
        q('tt').textContent = `${NAMES[opt]}: step table`;
        const pair = (p) => (p ? `(${fmt(p[0], 3)}, ${fmt(p[1], 3)})` : '');
        const cols = { gd: ['t', 'w', 'L', 'g', 'w new'], momentum: ['t', 'w', 'L', 'g', 'v', 'w new'], adagrad: ['t', 'w', 'L', 'g', 's', 'η_eff', 'w new'], rmsprop: ['t', 'w', 'L', 'g', 's', 'η_eff', 'w new'], adam: ['t', 'w', 'L', 'g', 'm', 'v', 'm̂', 'v̂', 'w new'] }[opt];
        q('tab').innerHTML = `<table class="chalk-table"><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => {
          const cells = { t: r.t, w: pair(r.w), L: fmt(r.L, 3), g: pair(r.g), v: pair(r.v), s: pair(r.s), 'η_eff': pair(r.e), m: pair(r.m), 'm̂': pair(r.mh), 'v̂': pair(r.vh), 'w new': pair(r.wNew) };
          if (opt === 'adam') cells.v = pair(r.s);
          return `<tr>${cols.map((c) => `<td>${cells[c]}</td>`).join('')}</tr>`; }).join('')}</tbody></table>
          <p class="chalk-line small">Loss after ${rows.length} step${rows.length > 1 ? 's' : ''}: <b>${fmt(rows[rows.length - 1].LNew, 4)}</b>.</p>`;
      }
      el.addEventListener('input', render); el.addEventListener('change', render);
      let lastW = 0; new ResizeObserver(() => { const w = el.clientWidth; if (Math.abs(w - lastW) > 2) { lastW = w; render(); } }).observe(el);
    }
  });
})();
