/* Lab: the learning rate on a 1-D bowl J(w) = (c/2)(w − w*)².
   Each step multiplies the gap (w − w*) by (1 − ηc).
   config: { c: 4, wstar: 2, w0: -2, eta: 0.15, steps: 8 } */
(function () {
  'use strict';
  const { fmt } = CU;

  function verdict(m) {
    const a = Math.abs(m);
    if (Math.abs(m) < 1e-9) return ['One perfect jump: η = 1/c lands on the minimum in a single step.', 'good'];
    if (m >= 1) return ['Not moving (η ≤ 0).', 'bad'];
    if (m > 0.75) return ['Crawling: η is too small, so progress is slow.', 'warn'];
    if (m > 0) return ['Converging smoothly from one side.', 'good'];
    if (a < 1) return ['Overshoots and bounces, but each bounce is smaller, so it still converges.', 'warn'];
    if (Math.abs(a - 1) < 1e-9) return ['Stuck bouncing forever: η = 2/c exactly.', 'bad'];
    return ['Diverging: η > 2/c, so every step lands further away. The loss explodes.', 'bad'];
  }

  Widgets.register('lr-bowl', {
    mount(el, cfg) {
      const c0 = cfg.c ?? 4, ws = cfg.wstar ?? 2, w00 = cfg.w0 ?? -2, steps = cfg.steps ?? 8;
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <div class="field-row">
              <label class="field"><span>Curvature c</span><input data-k="c" type="number" step="any" min="0.1" value="${c0}"></label>
              <label class="field"><span>Start w⁽⁰⁾</span><input data-k="w0" type="number" step="any" value="${w00}"></label>
            </div>
            <label class="field"><span>Learning rate η = <b data-k="etav"></b></span>
              <input data-k="eta" type="range" min="0.001" max="1" step="0.001" value="${cfg.eta ?? 0.15}"></label>
            <div class="btn-row" data-k="presets">
              <button class="btn" type="button" data-m="0.9">Crawl</button>
              <button class="btn" type="button" data-m="0.5">Halve</button>
              <button class="btn" type="button" data-m="0">One jump</button>
              <button class="btn" type="button" data-m="-0.8">Bounce</button>
              <button class="btn" type="button" data-m="-1.2">Explode</button>
            </div>
            <div class="readout" data-k="read"></div>
          </div>
          <div class="lab-boards">
            <div class="board mini"><div class="board-title">The bowl and the steps</div><canvas data-k="bowl"></canvas></div>
            <div class="board mini"><div class="board-title">w at each step</div><canvas data-k="path"></canvas></div>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);

      function setRange() {
        const c = Math.max(0.1, Number(q('c').value) || c0);
        const slider = q('eta');
        slider.max = String(+(2.6 / c).toFixed(4));
        slider.step = String(+(2.6 / c / 500).toFixed(6));
      }

      function render() {
        const c = Math.max(0.1, Number(q('c').value) || c0);
        const w0 = Number(q('w0').value); const start = Number.isFinite(w0) ? w0 : w00;
        const eta = Number(q('eta').value);
        q('etav').textContent = fmt(eta, 4);
        const m = 1 - eta * c;
        const J = (w) => (c / 2) * (w - ws) ** 2;
        const ws_ = [start];
        for (let i = 0; i < steps; i++) ws_.push(ws + m * (ws_[i] - ws));
        const [v, kind] = verdict(m);
        q('read').innerHTML = `
          <p><b>Multiplier 1 − ηc = ${fmt(m, 3)}</b>: each step the gap to w* = ${fmt(ws)} is multiplied by this.</p>
          <p class="lab-msg ${kind}">${v}</p>
          <p class="small">Converges when 0 < η < 2/c = <b>${fmt(2 / c, 4)}</b>. One-step η = 1/c = <b>${fmt(1 / c, 4)}</b>. The loss shrinks by (1 − ηc)² = ${fmt(m * m, 4)} per step.</p>`;
        const span = Math.max(Math.abs(start - ws) * 1.4, 1);
        const lim = Math.min(span, Math.max(...ws_.map((w) => Math.abs(w - ws))) * 1.1 + 0.5);
        const curve = [];
        for (let i = 0; i <= 120; i++) { const w = ws - lim + (2 * lim * i) / 120; curve.push([w, J(w)]); }
        const visible = ws_.filter((w) => Math.abs(w - ws) <= lim * 1.01);
        ChalkPlot.draw(q('bowl'), {
          series: [
            { points: curve, kind: 'line', color: 'white', width: 2 },
            { points: visible.map((w) => [w, J(w)]), kind: 'path', color: 'yellow' }
          ],
          xlim: [ws - lim, ws + lim], ylim: [0, J(ws + lim) * 1.05], xlabel: 'w', ylabel: 'J(w)'
        });
        const pmax = Math.max(...ws_.map((w) => Math.abs(w - ws)), 1) * 1.15;
        ChalkPlot.draw(q('path'), {
          series: [
            { points: [[0, ws], [steps, ws]], kind: 'line', color: 'blue', dash: [6, 6], label: 'w*' },
            { points: ws_.map((w, i) => [i, w]), kind: 'path', color: 'pink' }
          ],
          xlim: [0, steps], ylim: [ws - pmax, ws + pmax], xlabel: 'step', ylabel: 'w'
        });
      }

      el.addEventListener('input', (ev) => {
        if (ev.target === q('c')) setRange();
        render();
      });
      q('presets').addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-m]'); if (!b) return;
        const c = Math.max(0.1, Number(q('c').value) || c0);
        q('eta').value = String((1 - Number(b.dataset.m)) / c);
        render();
      });
      let lastW = 0;
      new ResizeObserver(() => { const w = el.clientWidth; if (Math.abs(w - lastW) > 2) { lastW = w; render(); } }).observe(el);
      setRange(); render();
    }
  });
})();
