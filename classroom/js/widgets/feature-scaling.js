/* Lab: min-max and z-score scaling of feature columns, plus the curvature (1/N)Σx²
   that explains why unscaled features slow gradient descent.
   config: { columns: [{ name: "Area (sq ft)", values: "1000, 1500" }, ...] } */
(function () {
  'use strict';
  const { esc, fmt, parseNums } = CU;

  Widgets.register('feature-scaling', {
    mount(el, cfg) {
      const cols = cfg.columns || [{ name: 'Area (sq ft)', values: '1000, 1500, 2000, 2500' }, { name: 'Bedrooms', values: '1, 2, 2, 4' }];
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            ${cols.map((c, i) => `<label class="field"><span>${esc(c.name)}</span><input data-col="${i}" type="text" value="${esc(c.values)}"></label>`).join('')}
            <p class="small muted">The z-score uses the population σ (divide by N), as on the slides.</p>
          </div>
          <div class="board"><div class="board-title">Scaled columns</div><div data-k="out" class="trace"></div></div>
        </div>`;
      function render() {
        const parts = []; const curv = [];
        el.querySelectorAll('[data-col]').forEach((inp) => {
          const c = cols[+inp.dataset.col]; const v = parseNums(inp.value);
          if (!v || v.length < 2) { parts.push(`<p class="lab-msg bad">${esc(c.name)}: enter two or more numbers.</p>`); return; }
          const N = v.length, mn = Math.min(...v), mx = Math.max(...v), mu = v.reduce((a, b) => a + b, 0) / N;
          const varp = v.reduce((s, x) => s + (x - mu) ** 2, 0) / N, sd = Math.sqrt(varp);
          const sdS = Math.sqrt(v.reduce((s, x) => s + (x - mu) ** 2, 0) / (N - 1));
          const k = v.reduce((s, x) => s + x * x, 0) / N; curv.push([c.name, k]);
          parts.push(`<h4 class="chalk-h">${esc(c.name)}</h4>
            <table class="chalk-table"><thead><tr><th>x</th><th>min-max (x − ${fmt(mn)}) / ${fmt(mx - mn)}</th><th>z = (x − ${fmt(mu)}) / ${fmt(sd)}</th></tr></thead>
            <tbody>${v.map((x) => `<tr><td>${fmt(x)}</td><td>${mx === mn ? '—' : fmt((x - mn) / (mx - mn))}</td><td>${sd === 0 ? '—' : fmt((x - mu) / sd)}</td></tr>`).join('')}</tbody></table>
            <p class="chalk-line small">μ = ${fmt(mu)}, σ² = ${fmt(varp)}, σ = ${fmt(sd)}. (With N − 1 you would get ${fmt(sdS)}, which is the wrong one for this course.) Curvature (1/N)Σx² = ${fmt(k)}.</p>`);
        });
        if (curv.length >= 2) {
          const big = curv.reduce((a, b) => (b[1] > a[1] ? b : a)), small = curv.reduce((a, b) => (b[1] < a[1] ? b : a));
          const ratio = big[1] / small[1];
          parts.push(`<p class="chalk-line"><b>Why scale?</b> Raw curvature ratio = ${fmt(big[1])} / ${fmt(small[1])} ≈ <b>${fmt(ratio, 1)}</b>.
            The largest safe η for "${esc(big[0])}" is about 2/${fmt(big[1])} = ${fmt(2 / big[1])}. At that η, "${esc(small[0])}" shrinks its gap by only ${fmt(1 - (2 / big[1]) * small[1], 6)} per step, so gradient descent zig-zags across one axis and crawls along the other. After z-scoring both curvatures are 1 and one η suits both.</p>`);
        }
        el.querySelector('[data-k="out"]').innerHTML = parts.join('');
      }
      el.addEventListener('input', render);
      render();
    }
  });
})();
