/* Lab: regression metrics calculator (MSE, RMSE, MAE, R²) with the working shown.
   config: { y: "4, 4.5, 8", yhat: "3, 5, 7" } */
(function () {
  'use strict';
  const { esc, fmt, parseNums } = CU;

  Widgets.register('metrics-calc', {
    mount(el, cfg) {
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <label class="field"><span>Actual y</span><input data-k="y" type="text" value="${esc(cfg.y || '4, 4.5, 8, 8, 10.5')}"></label>
            <label class="field"><span>Predicted ŷ</span><input data-k="yh" type="text" value="${esc(cfg.yhat || '3, 5, 7, 9, 11')}"></label>
            <p class="small muted">Tip: work the table out by hand first, then check it here.</p>
            <p class="lab-msg" data-k="msg"></p>
          </div>
          <div class="board"><div class="board-title">Working</div><div data-k="out" class="trace"></div></div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      function render() {
        const y = parseNums(q('y').value), yh = parseNums(q('yh').value);
        const m = q('msg');
        if (!y || !yh || !y.length) { m.textContent = 'Enter numbers separated by commas.'; m.className = 'lab-msg bad'; q('out').innerHTML = ''; return; }
        if (y.length !== yh.length) { m.textContent = `y has ${y.length} values but ŷ has ${yh.length}.`; m.className = 'lab-msg bad'; q('out').innerHTML = ''; return; }
        m.textContent = ''; m.className = 'lab-msg';
        const N = y.length, ybar = y.reduce((a, b) => a + b, 0) / N;
        const rows = y.map((v, i) => { const r = v - yh[i]; return { y: v, yh: yh[i], r, r2: r * r, ar: Math.abs(r), d2: (v - ybar) ** 2 }; });
        const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
        const ssr = sum('r2'), sst = sum('d2'), mse = ssr / N, mae = sum('ar') / N;
        const r2 = sst === 0 ? NaN : 1 - ssr / sst;
        q('out').innerHTML = `
          <table class="chalk-table"><thead><tr><th>i</th><th>y</th><th>ŷ</th><th>y − ŷ</th><th>(y − ŷ)²</th><th>|y − ŷ|</th><th>(y − ȳ)²</th></tr></thead>
          <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${fmt(r.y)}</td><td>${fmt(r.yh)}</td><td>${fmt(r.r)}</td><td>${fmt(r.r2)}</td><td>${fmt(r.ar)}</td><td>${fmt(r.d2)}</td></tr>`).join('')}
          <tr class="sum"><td>Σ</td><td>${fmt(sum('y'))}</td><td></td><td>${fmt(sum('r'))}</td><td>${fmt(ssr)}</td><td>${fmt(sum('ar'))}</td><td>${fmt(sst)}</td></tr></tbody></table>
          <div class="metric-grid">
            <div class="metric"><span>MSE</span><b>${fmt(mse)}</b><small>SS_res / N = ${fmt(ssr)} / ${N}</small></div>
            <div class="metric"><span>RMSE</span><b>${fmt(Math.sqrt(mse))}</b><small>√MSE, same units as y</small></div>
            <div class="metric"><span>MAE</span><b>${fmt(mae)}</b><small>Σ|y − ŷ| / N</small></div>
            <div class="metric"><span>R²</span><b>${fmt(r2)}</b><small>1 − ${fmt(ssr)} / ${fmt(sst)}, with ȳ = ${fmt(ybar)}</small></div>
          </div>
          <p class="chalk-line small">Baseline "always predict ȳ": MSE = ${fmt(sst / N)}, R² = 0. ${Number.isFinite(r2) ? (r2 < 0 ? 'This model is worse than the baseline.' : `This model explains ${fmt(r2 * 100, 1)}% of the variance of y.`) : ''}</p>`;
      }
      el.addEventListener('input', render);
      render();
    }
  });
})();
