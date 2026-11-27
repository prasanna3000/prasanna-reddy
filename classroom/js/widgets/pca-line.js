/* Lab: turn a line through the centred data and watch the spread of the projections.
   Left board: centred points, the line u = (cos θ, sin θ), and where each point lands on it.
   Right board: the projected variance V(θ) = uᵀSu for every angle; its top is λ₁ (PC1),
   its bottom is λ₂ (PC2), exactly 90° apart.
   config: { data: 'pp' | 'y2023' | 'companion' | 'mar2026', theta: degrees } */
(function () {
  'use strict';
  const { fmt } = CU;

  const SETS = {
    pp: { name: 'Practice Paper Q5', pts: [[2, 0], [0, 2], [3, 3], [-1, -1]] },
    y2023: { name: '2023 Q4', pts: [[1, 0], [2, 3], [4, 1], [5, 4]] },
    companion: { name: 'Companion §12', pts: [[1, 2], [4, 5], [7, 8], [8, 4], [10, 6]] },
    mar2026: { name: 'Mar 2026 Q5', pts: [[0, 3], [1, 5], [2, 7]] }
  };

  function stats(pts) {
    const N = pts.length;
    const mu = [0, 1].map((d) => pts.reduce((a, p) => a + p[d], 0) / N);
    const c = pts.map((p) => [p[0] - mu[0], p[1] - mu[1]]);
    const sxx = c.reduce((a, p) => a + p[0] * p[0], 0) / N;
    const syy = c.reduce((a, p) => a + p[1] * p[1], 0) / N;
    const sxy = c.reduce((a, p) => a + p[0] * p[1], 0) / N;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, r = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + r, l2 = tr / 2 - r;
    let th1 = Math.abs(sxy) < 1e-12 ? (sxx >= syy ? 0 : Math.PI / 2) : Math.atan2(l1 - sxx, sxy);
    if (th1 < 0) th1 += Math.PI;
    if (th1 >= Math.PI) th1 -= Math.PI;
    return { mu, c, sxx, syy, sxy, l1, l2, th1 };
  }

  Widgets.register('pca-line', {
    mount(el, cfg) {
      let set = SETS[cfg.data] ? cfg.data : 'pp';
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <div class="btn-row" data-k="sets">${Object.entries(SETS).map(([k, s]) => `<button class="btn" type="button" data-set="${k}">${s.name}</button>`).join('')}</div>
            <label class="field"><span>Angle of the line θ = <b data-k="tv"></b>°</span>
              <input data-k="t" type="range" min="0" max="179" step="1"></label>
            <div class="btn-row"><button class="btn btn-chalk" type="button" data-k="snap">Snap to PC1</button><button class="btn" type="button" data-k="snap2">Snap to PC2</button></div>
            <div class="readout" data-k="read"></div>
          </div>
          <div class="lab-boards">
            <div class="board mini"><div class="board-title">Centred points and their shadows on the line</div><canvas data-k="L"></canvas></div>
            <div class="board mini"><div class="board-title">Spread of the shadows V(θ) for every angle</div><canvas data-k="R"></canvas></div>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      let S = stats(SETS[set].pts);
      q('t').value = cfg.theta ?? 0;

      function render() {
        const deg = Number(q('t').value), th = (deg * Math.PI) / 180;
        q('tv').textContent = deg;
        const u = [Math.cos(th), Math.sin(th)];
        const z = S.c.map((p) => p[0] * u[0] + p[1] * u[1]);
        const V = z.reduce((a, v) => a + v * v, 0) / z.length;
        const R = Math.max(...S.c.map((p) => Math.hypot(p[0], p[1]))) * 1.25 + 0.5;
        const feet = z.map((v) => [v * u[0], v * u[1]]);
        const series = [
          { points: [[-3 * R * u[0], -3 * R * u[1]], [3 * R * u[0], 3 * R * u[1]]], kind: 'line', color: 'blue', width: 2 }
        ];
        S.c.forEach((p, i) => series.push({ points: [p, feet[i]], kind: 'line', color: 'faint', dash: [3, 3] }));
        series.push({ points: S.c, kind: 'dots', color: 'white', radius: 5 });
        series.push({ points: feet, kind: 'dots', color: 'pink', radius: 5 });
        const ar = Math.max(1, (q('L').parentElement.clientWidth || 250) / 250);
        ChalkPlot.draw(q('L'), { height: 250, xlim: [-R * ar, R * ar], ylim: [-R, R], series });

        const curve = Array.from({ length: 181 }, (_, d) => { const a = (d * Math.PI) / 180; const w = [Math.cos(a), Math.sin(a)]; return [d, S.sxx * w[0] * w[0] + 2 * S.sxy * w[0] * w[1] + S.syy * w[1] * w[1]]; });
        const d1 = (S.th1 * 180) / Math.PI, d2 = (d1 + 90) % 180;
        ChalkPlot.draw(q('R'), { height: 250, xlim: [0, 180], ylim: [0, S.l1 * 1.15 + 0.1], series: [
          { points: curve, kind: 'line', color: 'white', width: 2 },
          { points: [[d1, 0], [d1, S.l1]], kind: 'line', color: 'green', dash: [4, 4] },
          { points: [[d2, 0], [d2, S.l2]], kind: 'line', color: 'orange', dash: [4, 4] },
          { points: [[deg, V]], kind: 'dots', color: 'pink', radius: 7 }] });

        const share = S.l1 / (S.l1 + S.l2);
        const atTop = Math.abs(V - S.l1) < 1e-3 * Math.max(1, S.l1);
        q('read').innerHTML = `<p>u = (${fmt(u[0], 3)}, ${fmt(u[1], 3)}) · shadows z = ${z.map((v) => fmt(v, 2)).join(', ')}</p>
          <p>Spread of the shadows V = mean of z² = <b>${fmt(V, 3)}</b>. Largest possible λ₁ = <b>${fmt(S.l1, 3)}</b> at θ ≈ ${fmt(d1, 1)}°; smallest λ₂ = ${fmt(S.l2, 3)} at ${fmt(d2, 1)}°.</p>
          ${atTop ? `<p class="lab-msg good">This line is PC1: no other line spreads the shadows more. It keeps ${fmt(share * 100, 1)}% of the total variance λ₁ + λ₂ = ${fmt(S.l1 + S.l2, 3)}.</p>`
            : `<p class="lab-msg bad">Not the best line yet: the shadows spread ${fmt(V, 3)}, but PC1 reaches ${fmt(S.l1, 3)}. Turn the line, or press Snap to PC1.</p>`}
          <p class="small">S = [[${fmt(S.sxx, 3)}, ${fmt(S.sxy, 3)}], [${fmt(S.sxy, 3)}, ${fmt(S.syy, 3)}]] with 1/N. The top and bottom of the right-hand curve are the two eigenvalues of S, and the angles where they happen are its eigenvectors.</p>`;
      }

      function setData(k) {
        set = k; S = stats(SETS[k].pts);
        q('sets').querySelectorAll('[data-set]').forEach((b) => b.classList.toggle('btn-chalk', b.dataset.set === k));
        render();
      }
      q('sets').addEventListener('click', (e) => { const b = e.target.closest('[data-set]'); if (b) setData(b.dataset.set); });
      q('t').addEventListener('input', render);
      q('snap').addEventListener('click', () => { q('t').value = Math.round((S.th1 * 180) / Math.PI) % 180; render(); });
      q('snap2').addEventListener('click', () => { q('t').value = Math.round((S.th1 * 180) / Math.PI + 90) % 180; render(); });
      setData(set);
    }
  });
})();
