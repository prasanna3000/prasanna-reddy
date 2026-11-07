/* Lab: batch gradient descent for linear regression, one step at a time.
   config: {
     data: "x1, ..., xd, y  (one example per line)",
     eta: 0.1,
     w0: "0, 0"          // optional initial weights (bias first); blank = zeros
     lossScale: "half"   // "half" -> J = (1/2N)||e||^2 (slides). "mean" -> J = (1/N)||e||^2
   }
   Shows X, ŷ = Xw, e = ŷ − y, J, Xᵀe, ∇J and the update for every step. */
(function () {
  'use strict';
  const { esc, fmt, parseNums, matrix } = CU;

  function parseData(text) {
    const rows = String(text).trim().split(/\n+/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    if (!rows.length) return { error: 'Type at least one example: x, y' };
    const nums = rows.map(parseNums);
    if (nums.some((r) => r === null)) return { error: 'Every value must be a number (use commas or spaces between values).' };
    const width = nums[0].length;
    if (width < 2) return { error: 'Each line needs at least one feature and a target: x, y' };
    if (nums.some((r) => r.length !== width)) return { error: 'Every line needs the same number of values.' };
    const X = nums.map((r) => [1, ...r.slice(0, -1)]);
    const y = nums.map((r) => r[r.length - 1]);
    return { X, y, d: width - 1 };
  }

  const matVec = (A, v) => A.map((r) => r.reduce((s, a, j) => s + a * v[j], 0));
  const transpose = (A) => A[0].map((_, j) => A.map((r) => r[j]));

  function solve(A, b) { // Gaussian elimination with partial pivoting
    const n = A.length; const M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c] / M[c][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    return M.map((r, i) => r[n] / r[i]);
  }

  function snapshot(X, y, w, half) {
    const N = y.length;
    const yhat = matVec(X, w);
    const e = yhat.map((v, i) => v - y[i]);
    const sse = e.reduce((s, v) => s + v * v, 0);
    const J = half ? sse / (2 * N) : sse / N;
    const Xte = transpose(X).map((col) => col.reduce((s, v, i) => s + v * e[i], 0));
    const grad = Xte.map((v) => (half ? v / N : (2 * v) / N));
    return { yhat, e, sse, J, Xte, grad };
  }

  Widgets.register('gd-linear', {
    mount(el, cfg) {
      const half = cfg.lossScale !== 'mean';
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <label class="field"><span>Data: one example per line <code>x₁, …, x_d, y</code></span>
              <textarea rows="5" data-k="data" spellcheck="false">${esc(cfg.data || '1, 2\n2, 4\n3, 5')}</textarea></label>
            <div class="field-row">
              <label class="field"><span>Learning rate η</span><input data-k="eta" type="number" step="any" value="${esc(cfg.eta ?? 0.1)}"></label>
              <label class="field"><span>Start weights w⁽⁰⁾ (bias first)</span><input data-k="w0" type="text" placeholder="zeros" value="${esc(cfg.w0 ?? '')}"></label>
            </div>
            <div class="btn-row">
              <button class="btn" data-act="reset" type="button">↺ Reset</button>
              <button class="btn btn-chalk" data-act="step" type="button">Step ▸</button>
              <button class="btn" data-act="run" type="button">Run ×10</button>
              <button class="btn" data-act="opt" type="button">Show optimum</button>
            </div>
            <p class="lab-msg" data-k="msg" role="status"></p>
            <p class="small muted">Loss used: ${half ? 'J = (1/2N)‖Xw − y‖², gradient (1/N)Xᵀ(Xw − y), as on the slides' : 'J = (1/N)‖Xw − y‖², gradient (2/N)Xᵀ(Xw − y)'}.</p>
          </div>
          <div class="lab-boards">
            <div class="board mini"><div class="board-title">The fit</div><canvas data-k="fit"></canvas><p class="board-note" data-k="fitnote"></p></div>
            <div class="board mini"><div class="board-title">Loss J per iteration</div><canvas data-k="loss"></canvas></div>
          </div>
          <div class="board trace-board"><div class="board-title" data-k="tracetitle">Working</div><div class="trace" data-k="trace"></div></div>
          <details class="paper history"><summary>History table</summary><div data-k="hist"></div></details>
        </div>`;

      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      let st = null; let optimum = null;

      function msg(t, kind) { const m = q('msg'); m.textContent = t || ''; m.className = 'lab-msg ' + (kind || ''); }

      function reset() {
        optimum = null;
        const parsed = parseData(q('data').value);
        if (parsed.error) { st = null; msg(parsed.error, 'bad'); render(); return; }
        const eta = Number(q('eta').value);
        if (!Number.isFinite(eta) || eta <= 0) { st = null; msg('η must be a positive number.', 'bad'); render(); return; }
        let w = parseNums(q('w0').value);
        const p = parsed.d + 1;
        if (w === null) { st = null; msg('Start weights must be numbers.', 'bad'); render(); return; }
        if (!w.length) w = new Array(p).fill(0);
        if (w.length !== p) { st = null; msg(`You need ${p} start weights (w₀ for the bias + ${parsed.d} feature weight${parsed.d > 1 ? 's' : ''}).`, 'bad'); render(); return; }
        st = { ...parsed, eta, w, t: 0, hist: [], last: null, diverged: false };
        st.hist.push({ t: 0, w: w.slice(), J: snapshot(st.X, st.y, w, half).J });
        msg(`N = ${st.y.length} examples, d = ${st.d} feature${st.d > 1 ? 's' : ''}. X is ${st.y.length} × ${p}. Press Step.`, '');
        render();
      }

      function step(n = 1) {
        if (!st) reset();
        if (!st || st.diverged) return;
        for (let i = 0; i < n; i++) {
          const s = snapshot(st.X, st.y, st.w, half);
          const wNew = st.w.map((v, j) => v - st.eta * s.grad[j]);
          const after = snapshot(st.X, st.y, wNew, half);
          st.last = { t: st.t, wOld: st.w, s, wNew, after };
          st.w = wNew; st.t += 1;
          st.hist.push({ t: st.t, w: wNew.slice(), J: after.J });
          if (!Number.isFinite(after.J) || after.J > 1e12) {
            st.diverged = true;
            msg('Diverged! The loss blew up, so η is too large. Lower η and reset.', 'bad');
            break;
          }
        }
        if (!st.diverged) {
          const J0 = st.hist[st.hist.length - 2].J, J1 = st.hist[st.hist.length - 1].J;
          const pct = J0 > 0 ? ((J0 - J1) / J0) * 100 : 0;
          msg(J1 <= J0 ? `Loss fell ${fmt(pct, 1)}% on the last step.` : `Loss ROSE on the last step (${fmt(J0)} → ${fmt(J1)}). η may be too large.`, J1 <= J0 ? 'good' : 'bad');
        }
        render();
      }

      function showOptimum() {
        if (!st) reset();
        if (!st) return;
        const Xt = transpose(st.X);
        const XtX = Xt.map((r) => Xt.map((c) => r.reduce((s, v, i) => s + v * c[i], 0)));
        const Xty = Xt.map((r) => r.reduce((s, v, i) => s + v * st.y[i], 0));
        const w = solve(XtX, Xty);
        if (!w) { msg('XᵀX is not invertible here (features are linearly dependent), so there is no unique optimum.', 'bad'); return; }
        optimum = { w, J: snapshot(st.X, st.y, w, half).J };
        msg(`Normal equation w* = (XᵀX)⁻¹Xᵀy = [${w.map((v) => fmt(v)).join(', ')}], J* = ${fmt(optimum.J)}`, 'good');
        render();
      }

      function vec(v) { return matrix(v.map((x) => [x])); }

      function render() {
        // plots
        const fit = q('fit'); const loss = q('loss');
        if (!st) {
          ChalkPlot.draw(fit, { series: [] }); ChalkPlot.draw(loss, { series: [] });
          q('trace').innerHTML = ''; q('hist').innerHTML = ''; q('fitnote').textContent = '';
          return;
        }
        if (st.d === 1) {
          const xs = st.X.map((r) => r[1]);
          const lo = Math.min(...xs), hi = Math.max(...xs), span = (hi - lo) || 1;
          const a = lo - span * 0.15, b = hi + span * 0.15;
          const line = (w) => [[a, w[0] + w[1] * a], [b, w[0] + w[1] * b]];
          const ys = st.y;
          const ylo = Math.min(...ys), yhi = Math.max(...ys), ysp = (yhi - ylo) || 1;
          const series = [
            { points: xs.map((x, i) => [x, ys[i]]), kind: 'dots', color: 'white', label: 'data' },
            { points: line(st.w), kind: 'line', color: 'yellow', label: `ŷ = ${fmt(st.w[0], 3)} + ${fmt(st.w[1], 3)}x` }
          ];
          if (optimum) series.push({ points: line(optimum.w), kind: 'line', color: 'blue', dash: [6, 6], label: 'optimum' });
          ChalkPlot.draw(fit, { series, xlim: [a, b], ylim: [Math.min(ylo, 0) - ysp * 0.2, yhi + ysp * 0.3], xlabel: 'x', ylabel: 'y' });
          q('fitnote').textContent = '';
        } else {
          ChalkPlot.draw(fit, { series: [{ points: st.y.map((v, i) => [v, snapshot(st.X, st.y, st.w, half).yhat[i]]), kind: 'dots', color: 'yellow' },
            { points: [[Math.min(...st.y), Math.min(...st.y)], [Math.max(...st.y), Math.max(...st.y)]], kind: 'line', color: 'faint', dash: [5, 5] }],
          xlabel: 'actual y', ylabel: 'predicted ŷ' });
          q('fitnote').textContent = 'With more than one feature, each dot is one example: actual vs predicted. Perfect = on the dashed line.';
        }
        const Js = st.hist.map((h) => [h.t, h.J]);
        const lossSeries = [{ points: Js, kind: 'path', color: 'pink' }];
        if (optimum) lossSeries.push({ points: [[0, optimum.J], [Math.max(1, st.t), optimum.J]], kind: 'line', color: 'blue', dash: [6, 6], label: 'J*' });
        const Jmax = Math.max(...Js.map((p) => p[1]).filter(Number.isFinite), 1e-9);
        ChalkPlot.draw(loss, { series: lossSeries, xlim: [0, Math.max(5, st.t)], ylim: [0, Jmax * 1.1], xlabel: 'iteration t', ylabel: 'J' });

        // trace
        const N = st.y.length;
        if (!st.last) {
          const s = snapshot(st.X, st.y, st.w, half);
          q('tracetitle').textContent = 'Iteration 0: before any update';
          q('trace').innerHTML = `
            <div class="trace-row">
              <div class="trace-item"><div class="lbl">X (N × (d+1))</div>${matrix(st.X)}</div>
              <div class="trace-item"><div class="lbl">y</div>${vec(st.y)}</div>
              <div class="trace-item"><div class="lbl">w⁽⁰⁾</div>${vec(st.w)}</div>
              <div class="trace-item"><div class="lbl">ŷ = Xw</div>${vec(s.yhat)}</div>
              <div class="trace-item"><div class="lbl">e = ŷ − y</div>${vec(s.e)}</div>
            </div>
            <p class="chalk-line">J(w⁽⁰⁾) = ${half ? `‖e‖² / 2N = ${fmt(s.sse)} / ${2 * N}` : `‖e‖² / N = ${fmt(s.sse)} / ${N}`} = <b>${fmt(s.J)}</b></p>`;
        } else {
          const L = st.last;
          q('tracetitle').textContent = `Iteration ${L.t + 1}: w⁽${L.t}⁾ → w⁽${L.t + 1}⁾`;
          q('trace').innerHTML = `
            <div class="trace-row">
              <div class="trace-item"><div class="lbl">w⁽${L.t}⁾</div>${vec(L.wOld)}</div>
              <div class="trace-item"><div class="lbl">ŷ = Xw</div>${vec(L.s.yhat)}</div>
              <div class="trace-item"><div class="lbl">e = ŷ − y</div>${vec(L.s.e)}</div>
              <div class="trace-item"><div class="lbl">Xᵀe</div>${vec(L.s.Xte)}</div>
              <div class="trace-item"><div class="lbl">∇J = ${half ? 'Xᵀe / N' : '2Xᵀe / N'}</div>${vec(L.s.grad)}</div>
              <div class="trace-item"><div class="lbl">w⁽${L.t + 1}⁾ = w − η∇J</div>${vec(L.wNew)}</div>
            </div>
            <p class="chalk-line">J before = <b>${fmt(L.s.J)}</b> &nbsp;→&nbsp; J after = <b>${fmt(L.after.J)}</b>
              &nbsp;(η = ${fmt(st.eta)}, N = ${N})</p>
            <p class="chalk-line small">Row 1 of Xᵀe is the sum of the errors (it drives the bias). Row j+1 is the sum of error × feature j.</p>`;
        }
        q('hist').innerHTML = `<table class="ruled"><thead><tr><th>t</th>${st.w.map((_, j) => `<th>w${'₀₁₂₃₄₅₆₇₈₉'[j] || j}</th>`).join('')}<th>J</th></tr></thead><tbody>
          ${st.hist.map((h) => `<tr><td>${h.t}</td>${h.w.map((v) => `<td>${fmt(v)}</td>`).join('')}<td>${fmt(h.J)}</td></tr>`).join('')}</tbody></table>`;
      }

      el.addEventListener('click', (ev) => {
        const act = ev.target.closest('[data-act]')?.dataset.act;
        if (act === 'reset') reset();
        else if (act === 'step') step(1);
        else if (act === 'run') step(10);
        else if (act === 'opt') showOptimum();
      });
      el.addEventListener('change', (ev) => { if (ev.target.matches('textarea, input')) reset(); });
      let lastW = 0;
      new ResizeObserver(() => { const w = el.clientWidth; if (Math.abs(w - lastW) > 2) { lastW = w; render(); } }).observe(el);
      reset();
    }
  });
})();
