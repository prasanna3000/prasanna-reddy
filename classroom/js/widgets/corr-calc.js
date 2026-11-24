/* Lab: covariance, Pearson's r, and autocovariance / autocorrelation, with working in the slide notation.
   config: { mode: "pearson" | "auto" | "spearman",
             x: "5, 4, 7", y: "20, 18, 23", at: 4.5   (pearson; also fits the regression line; spearman takes ranks or raw values)
             series: "4, 6, 5, 7, 8", lags: 2       (auto) } */
(function () {
  'use strict';
  const { esc, fmt, parseNums } = CU;

  function strength(r) {
    const a = Math.abs(r);
    if (a > 0.9999) return r > 0 ? 'perfect positive' : 'perfect negative';
    if (a === 0) return 'zero';
    const band = a >= 0.76 ? 'strong' : a >= 0.26 ? 'moderate' : 'weak';
    return `${band} ${r > 0 ? 'positive' : 'negative'}`;
  }

  Widgets.register('corr-calc', {
    mount(el, cfg) {
      const mode = cfg.mode === 'auto' ? 'auto' : cfg.mode === 'spearman' ? 'spearman' : 'pearson';
      const inputs = mode !== 'auto'
        ? `<label class="field"><span>X values (commas or spaces)</span><input data-k="x" type="text" value="${esc(cfg.x ?? '5, 4, 7, 10, 8, 8')}"></label>
           <label class="field"><span>Y values (same count as X)</span><input data-k="y" type="text" value="${esc(cfg.y ?? '20, 18, 23, 32, 26, 25')}"></label>${mode === 'pearson' ? `<label class="field"><span>Predict Y at X =</span><input data-k="at" type="number" step="any" value="${esc(cfg.at ?? '')}"></label>` : ''}`
        : `<label class="field"><span>Series values in time order</span><input data-k="s" type="text" value="${esc(cfg.series ?? '4, 6, 5, 7, 8')}"></label>
           <label class="field"><span>Largest lag to show</span><input data-k="lags" type="number" min="1" step="1" value="${esc(cfg.lags ?? 2)}"></label>`;
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">${inputs}<p class="lab-msg" data-k="msg"></p></div>
          <div class="lab-boards"><div class="board mini"><div class="board-title">Working</div><div class="trace" data-k="trace"></div></div></div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      const bad = (m) => { q('trace').innerHTML = `<p class="lab-msg bad">${esc(m)}</p>`; };

      function renderPearson() {
        const x = parseNums(q('x').value), y = parseNums(q('y').value);
        if (!x || !y || x.length < 2) return bad('Enter at least two numbers for X and for Y.');
        if (x.length !== y.length) return bad(`X has ${x.length} values but Y has ${y.length}. They must be pairs.`);
        const n = x.length, sx = x.reduce((a, b) => a + b, 0), sy = y.reduce((a, b) => a + b, 0);
        const sxy = x.reduce((a, v, i) => a + v * y[i], 0), sxx = x.reduce((a, v) => a + v * v, 0), syy = y.reduce((a, v) => a + v * v, 0);
        const mx = sx / n, my = sy / n;
        const prods = x.map((v, i) => (v - mx) * (y[i] - my)), sp = prods.reduce((a, b) => a + b, 0);
        const cov = sp / (n - 1);
        const num = n * sxy - sx * sy, b1 = n * sxx - sx * sx, b2 = n * syy - sy * sy;
        const rows = x.map((v, i) => `<tr><td>${fmt(v)}</td><td>${fmt(y[i])}</td><td>${fmt(v - mx, 3)}</td><td>${fmt(y[i] - my, 3)}</td><td>${fmt(prods[i], 3)}</td><td>${fmt(v * y[i])}</td><td>${fmt(v * v)}</td><td>${fmt(y[i] * y[i])}</td></tr>`).join('');
        let tail;
        if (b1 <= 0 || b2 <= 0) {
          tail = `<p class="chalk-line"><b>r is undefined:</b> one variable never changes (its bracket is 0), so r = 0/0. The covariance is ${fmt(cov, 4)}.</p>`;
        } else {
          const r = num / Math.sqrt(b1 * b2);
          const vx = b1 / (n * (n - 1)), vy = b2 / (n * (n - 1));
          tail = `<p class="chalk-line">Var(X) = Σ(X − X̄)²/(n − 1) = ${fmt(vx, 4)}, s<sub>X</sub> = <b>${fmt(Math.sqrt(vx), 4)}</b>. Var(Y) = ${fmt(vy, 4)}, s<sub>Y</sub> = <b>${fmt(Math.sqrt(vy), 4)}</b></p>
            <p class="chalk-line">r = Cov(X, Y) / (s<sub>X</sub> · s<sub>Y</sub>) = ${fmt(cov, 4)} / (${fmt(Math.sqrt(vx), 4)} × ${fmt(Math.sqrt(vy), 4)}) = <b>${fmt(r, 4)}</b> (${strength(r)})</p>
            <p class="chalk-line">Check with the sums form: Numerator = nΣXY − ΣXΣY = ${n}(${fmt(sxy)}) − ${fmt(sx)}(${fmt(sy)}) = <b>${fmt(num)}</b></p>
            <p class="chalk-line">Brackets: nΣX² − (ΣX)² = <b>${fmt(b1)}</b> and nΣY² − (ΣY)² = <b>${fmt(b2)}</b></p>
            <p class="chalk-line">r = ${fmt(num)} / √(${fmt(b1)} × ${fmt(b2)}) = ${fmt(r, 4)}</p>`;
        }
        let reg = '';
        if (b1 > 0) {
          const sxxd = b1 / n, sxyd = num / n, slope = sxyd / sxxd, icpt = my - slope * mx;
          const sst = b2 / n, ssr = slope * sxyd, sse = sst - ssr, r2 = sst > 0 ? ssr / sst : NaN;
          const atv = q('at') && q('at').value !== '' ? Number(q('at').value) : null;
          reg = `<p class="chalk-line"><b>Regression of Y on X</b></p>
            <p class="chalk-line">Σ(X − X̄)(Y − Ȳ) = ${fmt(sxyd * 1, 4)}, Σ(X − X̄)² = ${fmt(sxxd, 4)}</p>
            <p class="chalk-line">b̂ = Cov(X, Y) / Var(X) = ${fmt(cov, 4)} / ${fmt(sxxd / (n - 1), 4)} = <b>${fmt(slope, 4)}</b> (the n − 1 cancels, so this equals Σxy / Σx² = ${fmt(sxyd, 4)} / ${fmt(sxxd, 4)})</p>
            <p class="chalk-line">â = Ȳ − b̂X̄ = ${fmt(my, 4)} − ${fmt(slope, 4)} × ${fmt(mx, 4)} = <b>${fmt(icpt, 4)}</b></p>
            <p class="chalk-line">Ŷ = ${fmt(icpt, 4)} ${slope < 0 ? '−' : '+'} ${fmt(Math.abs(slope), 4)} X</p>
            <p class="chalk-line">SST = ${fmt(sst, 4)}, SSR = ${fmt(ssr, 4)}, SSE = ${fmt(sse, 4)}, r² = SSR/SST = <b>${fmt(r2, 4)}</b></p>
            ${atv !== null && isFinite(atv) ? `<p class="chalk-line">Ŷ(${fmt(atv)}) = ${fmt(icpt, 4)} ${slope < 0 ? '−' : '+'} ${fmt(Math.abs(slope), 4)} × ${fmt(atv)} = <b>${fmt(icpt + slope * atv, 4)}</b>${(atv < Math.min(...x) || atv > Math.max(...x)) ? ' (outside the data range: extrapolation, less reliable)' : ''}</p>` : ''}`;
        }
        q('trace').innerHTML = `
          <div class="table-wrap"><table class="chalk-table"><thead><tr><th>X</th><th>Y</th><th>X − X̄</th><th>Y − Ȳ</th><th>product</th><th>XY</th><th>X²</th><th>Y²</th></tr></thead><tbody>${rows}</tbody></table></div>
          <p class="chalk-line">n = ${n}, X̄ = ${fmt(mx, 4)}, Ȳ = ${fmt(my, 4)}</p>
          <p class="chalk-line">Cov(X, Y) = Σ(X − X̄)(Y − Ȳ)/(n − 1) = ${fmt(sp, 4)} / ${n - 1} = <b>${fmt(cov, 4)}</b> (${cov > 0 ? 'positive: same direction' : cov < 0 ? 'negative: opposite directions' : 'zero: no linear pattern'})</p>
          <p class="chalk-line">ΣX = ${fmt(sx)}, ΣY = ${fmt(sy)}, ΣXY = ${fmt(sxy)}, ΣX² = ${fmt(sxx)}, ΣY² = ${fmt(syy)}</p>
          ${tail}
          ${reg}`;
      }

      function ranks(v) {
        const idx = v.map((val, i) => [val, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length);
        for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k][1]] = avg; i = j + 1; }
        return r;
      }
      function renderSpearman() {
        const x = parseNums(q('x').value), y = parseNums(q('y').value);
        if (!x || !y || x.length < 3) return bad('Enter at least three values for each list.');
        if (x.length !== y.length) return bad(`X has ${x.length} values but Y has ${y.length}. They must be pairs.`);
        const n = x.length, rx = ranks(x), ry = ranks(y), mx = (n + 1) / 2;
        const dx = rx.map((v) => v - mx), dy = ry.map((v) => v - mx);
        const sxy = dx.reduce((a, v, i) => a + v * dy[i], 0), sxx = dx.reduce((a, v) => a + v * v, 0), syy = dy.reduce((a, v) => a + v * v, 0);
        const d2 = rx.reduce((a, v, i) => a + (v - ry[i]) ** 2, 0);
        const rows = x.map((v, i) => `<tr><td>${fmt(v)}</td><td>${fmt(y[i])}</td><td>${fmt(rx[i], 3)}</td><td>${fmt(ry[i], 3)}</td><td>${fmt(dx[i], 3)}</td><td>${fmt(dy[i], 3)}</td><td>${fmt(dx[i] * dy[i], 3)}</td><td>${fmt(rx[i] - ry[i], 3)}</td></tr>`).join('');
        const tie = new Set(x).size < n || new Set(y).size < n;
        let tail;
        if (sxx === 0 || syy === 0) tail = '<p class="chalk-line"><b>r<sub>s</sub> is undefined:</b> one ranking is constant.</p>';
        else { const r = sxy / Math.sqrt(sxx * syy);
          tail = `<p class="chalk-line">Pearson on the ranks: r<sub>s</sub> = ${fmt(sxy, 4)} / √(${fmt(sxx, 4)} × ${fmt(syy, 4)}) = <b>${fmt(r, 4)}</b> (${strength(r)})</p>
            <p class="chalk-line">Shortcut: r<sub>s</sub> = 1 − 6Σd² / [n(n² − 1)] = 1 − 6(${fmt(d2, 4)}) / ${n * (n * n - 1)} = <b>${fmt(1 - 6 * d2 / (n * (n * n - 1)), 4)}</b>${tie ? ' (only approximate because of ties, so do not use it as the answer)' : ' (exact: no ties)'}</p>`; }
        const verdict = tie ? '<p class="chalk-line"><b>Ties found</b> (a value repeats inside X or inside Y): the answer is the covariance method, Pearson on the ranks. The d² formula is only approximate.</p>'
          : '<p class="chalk-line"><b>No ties:</b> the d² formula is exact and is all you need. Pearson on the ranks gives the same value.</p>';
        q('trace').innerHTML = verdict + `<div class="table-wrap"><table class="chalk-table"><thead><tr><th>X</th><th>Y</th><th>rank X</th><th>rank Y</th><th>rank X − mean</th><th>rank Y − mean</th><th>product</th><th>d</th></tr></thead><tbody>${rows}</tbody></table></div>
          <p class="chalk-line">n = ${n}. Ties get the average of their positions. Mean rank = ${fmt(mx, 3)}.</p>
          <p class="chalk-line">Σd² = ${fmt(d2, 4)}</p>${tail}`;
      }

      function renderAuto() {
        const s = parseNums(q('s').value);
        if (!s || s.length < 3) return bad('Enter at least three numbers for the series.');
        const n = s.length, maxLag = Math.max(1, Math.min(n - 1, Math.round(Number(q('lags').value) || 1)));
        const m = s.reduce((a, b) => a + b, 0) / n, d = s.map((v) => v - m);
        const den = d.reduce((a, b) => a + b * b, 0);
        if (den === 0) return bad('Every value is the same, so the variance is 0 and the autocorrelation is undefined.');
        const lagRows = [];
        for (let h = 0; h <= maxLag; h++) {
          let sum = 0; for (let i = 0; i < n - h; i++) sum += d[i + h] * d[i];
          lagRows.push(`<tr><td>${h}</td><td>${n - h}</td><td>${fmt(sum, 4)}</td><td>${fmt(sum / n, 4)}</td><td>${fmt(sum / den, 4)}</td></tr>`);
        }
        q('trace').innerHTML = `
          <p class="chalk-line">n = ${n}, mean X̄ = ${fmt(m, 4)}</p>
          <p class="chalk-line">Deviations (X − X̄): ${d.map((v) => fmt(v, 3)).join(', ')}</p>
          <p class="chalk-line">Σ(X − X̄)² = ${fmt(den, 4)}</p>
          <div class="table-wrap"><table class="chalk-table"><thead><tr><th>lag h</th><th>pairs (n − h)</th><th>Σ products</th><th>γ̂(h) = Σ/n</th><th>r<sub>k</sub> = Σ / Σ(X − X̄)²</th></tr></thead><tbody>${lagRows.join('')}</tbody></table></div>
          <p class="chalk-line">Pair each deviation with the one h places later, multiply, add. γ̂(0) is the variance of the series, and r<sub>k</sub> = γ̂(k)/γ̂(0).</p>`;
      }

      const render = () => { q('msg').textContent = ''; (mode === 'pearson' ? renderPearson : mode === 'spearman' ? renderSpearman : renderAuto)(); };
      el.querySelectorAll('input').forEach((i) => i.addEventListener('input', render));
      render();
    }
  });
})();
