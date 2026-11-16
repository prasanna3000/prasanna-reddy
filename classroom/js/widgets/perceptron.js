/* Lab: the perceptron learning rule on logic gates, traced epoch by epoch.
   Rule (deck convention, outputs {0,1}): h = w0 + Σ wi xi ; ŷ = 1 if h ≥ 0 else 0
   Update when wrong: wi ← wi + η (t − ŷ) xi   (x0 = 1 for the bias)
   config: { gate: "AND" | "OR" | "NAND" | "NOR" | "XOR" | "NOT", eta: 1, w: "0, 0, 0", maxEpochs: 20 } */
(function () {
  'use strict';
  const { esc, fmt, parseNums } = CU;
  const GATES = {
    AND: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]],
    OR: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]],
    NAND: [[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 0]],
    NOR: [[0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 0]],
    XOR: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]],
    NOT: [[0, 1], [1, 0]]
  };

  Widgets.register('perceptron', {
    mount(el, cfg) {
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <div class="field-row">
              <label class="field"><span>Gate</span><select data-k="gate">${Object.keys(GATES).map((g) => `<option ${g === (cfg.gate || 'AND') ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
              <label class="field"><span>Learning rate η</span><input data-k="eta" type="number" step="any" value="${esc(cfg.eta ?? 1)}"></label>
              <label class="field"><span>Start weights (w₀ bias first)</span><input data-k="w" type="text" value="${esc(cfg.w ?? '')}" placeholder="zeros"></label>
            </div>
            <div class="btn-row">
              <button class="btn" data-act="reset" type="button">↺ Reset</button>
              <button class="btn btn-chalk" data-act="epoch" type="button">Run 1 epoch ▸</button>
              <button class="btn" data-act="all" type="button">Run until it converges</button>
            </div>
            <p class="lab-msg" data-k="msg"></p>
            <p class="small muted">ŷ = 1 if h = w₀ + Σwᵢxᵢ ≥ 0, else 0. If ŷ ≠ t: wᵢ ← wᵢ + η(t − ŷ)xᵢ, with x₀ = 1.</p>
          </div>
          <div class="lab-boards">
            <div class="board mini"><div class="board-title">Truth table and decision line</div><canvas data-k="plot"></canvas><p class="board-note">Filled = target 1, small = target 0. Yellow line: w₀ + w₁x₁ + w₂x₂ = 0.</p></div>
            <div class="board mini"><div class="board-title" data-k="tt">Trace</div><div class="trace" data-k="trace" style="max-height:330px;overflow:auto"></div></div>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      let st = null;
      const msg = (t, k) => { q('msg').textContent = t; q('msg').className = 'lab-msg ' + (k || ''); };

      function reset() {
        const data = GATES[q('gate').value]; const n = data[0].length - 1;
        let w = parseNums(q('w').value); const eta = Number(q('eta').value);
        if (w === null) return msg('Weights must be numbers.', 'bad');
        if (!w.length) w = new Array(n + 1).fill(0);
        if (w.length !== n + 1) return msg(`This gate needs ${n + 1} weights: w₀ (bias)${n === 2 ? ', w₁, w₂' : ', w₁'}.`, 'bad');
        if (!(eta > 0)) return msg('η must be positive.', 'bad');
        st = { data, n, w, eta, epoch: 0, log: [], done: false };
        msg('Press "Run 1 epoch".', ''); render();
      }

      function epoch() {
        if (!st) reset(); if (!st || st.done) return;
        st.epoch += 1; let errors = 0;
        st.data.forEach((row) => {
          const x = [1, ...row.slice(0, st.n)], t = row[st.n];
          const h = x.reduce((s, v, i) => s + v * st.w[i], 0);
          const yh = h >= 0 ? 1 : 0; const before = st.w.slice();
          if (yh !== t) { errors += 1; st.w = st.w.map((wi, i) => wi + st.eta * (t - yh) * x[i]); }
          st.log.push({ epoch: st.epoch, x: row.slice(0, st.n), t, h, yh, ok: yh === t, before, after: st.w.slice() });
        });
        if (errors === 0) { st.done = true; msg(`Converged in epoch ${st.epoch}: a full pass with no mistakes. Final w = [${st.w.map((v) => fmt(v)).join(', ')}].`, 'good'); }
        else msg(`Epoch ${st.epoch}: ${errors} mistake${errors > 1 ? 's' : ''}, weights updated.`, 'warn');
        render();
      }

      function runAll() {
        if (!st) reset(); if (!st) return;
        let guard = 0; while (!st.done && guard < (cfg.maxEpochs || 20)) { epoch(); guard += 1; }
        if (!st.done) msg(`No convergence after ${st.epoch} epochs. ${q('gate').value === 'XOR' ? 'XOR is not linearly separable, so no single line can ever classify all four points.' : 'Try more epochs.'}`, 'bad');
      }

      function render() {
        if (!st) return;
        const sub = ['₀', '₁', '₂'];
        q('tt').textContent = `Trace (${st.epoch} epoch${st.epoch === 1 ? '' : 's'})`;
        q('trace').innerHTML = `<table class="chalk-table"><thead><tr><th>ep</th><th>x</th><th>t</th><th>h</th><th>ŷ</th><th>w after</th></tr></thead><tbody>
          ${st.log.map((r) => `<tr><td>${r.epoch}</td><td>(${r.x.join(', ')})</td><td>${r.t}</td><td>${fmt(r.h)}</td><td>${r.yh}${r.ok ? ' ✓' : ' ✗'}</td><td>${r.ok ? '<span style="opacity:.6">no change</span>' : '[' + r.after.map((v) => fmt(v)).join(', ') + ']'}</td></tr>`).join('') || '<tr><td colspan="6">Start weights: [' + st.w.map((v, i) => 'w' + sub[i] + '=' + fmt(v)).join(', ') + ']</td></tr>'}
          </tbody></table>`;
        const series = [];
        if (st.n === 2) {
          series.push({ points: st.data.filter((r) => r[2] === 1).map((r) => [r[0], r[1]]), kind: 'dots', color: 'yellow', radius: 9 });
          series.push({ points: st.data.filter((r) => r[2] === 0).map((r) => [r[0], r[1]]), kind: 'dots', color: 'white', radius: 4 });
          const [w0, w1, w2] = st.w;
          if (Math.abs(w2) > 1e-12) series.push({ points: [[-0.5, (-w0 - w1 * -0.5) / w2], [1.5, (-w0 - w1 * 1.5) / w2]], kind: 'line', color: 'yellow' });
          else if (Math.abs(w1) > 1e-12) series.push({ points: [[-w0 / w1, -0.5], [-w0 / w1, 1.5]], kind: 'line', color: 'yellow' });
          ChalkPlot.draw(q('plot'), { series, xlim: [-0.5, 1.5], ylim: [-0.5, 1.5], xlabel: 'x₁', ylabel: 'x₂' });
        } else {
          series.push({ points: st.data.map((r) => [r[0], r[1]]), kind: 'dots', color: 'yellow', radius: 7 });
          const [w0, w1] = st.w;
          if (Math.abs(w1) > 1e-12) series.push({ points: [[-w0 / w1, -0.5], [-w0 / w1, 1.5]], kind: 'line', color: 'pink' });
          ChalkPlot.draw(q('plot'), { series, xlim: [-0.5, 1.5], ylim: [-0.5, 1.5], xlabel: 'x', ylabel: 'target t' });
        }
      }

      el.addEventListener('click', (e) => { const a = e.target.closest('[data-act]')?.dataset.act; if (a === 'reset') reset(); if (a === 'epoch') epoch(); if (a === 'all') runAll(); });
      el.addEventListener('change', (e) => { if (e.target.matches('input, select')) reset(); });
      let lastW = 0;
      new ResizeObserver(() => { const w = el.clientWidth; if (Math.abs(w - lastW) > 2) { lastW = w; render(); } }).observe(el);
      reset();
    }
  });
})();
