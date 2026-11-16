/* Lab: 2-D convolution (cross-correlation) → ReLU → max-pool, with the output-size formula,
   plus a parameter counter for conv layers.
   config: { input: "rows; separated", kernel: "...", stride: 1, padding: 0, pool: 2 } */
(function () {
  'use strict';
  const { esc, fmt, parseMatrix, matrix } = CU;

  Widgets.register('conv-calc', {
    mount(el, cfg) {
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <div class="field-row">
              <label class="field" style="min-width:240px"><span>Input image (rows separated by ; or new lines)</span><textarea data-k="in" rows="6" spellcheck="false">${esc(cfg.input ?? '1 0 0 0 0 1\n0 1 0 0 1 0\n0 0 1 1 0 0\n1 0 0 0 1 0\n0 1 0 0 1 0\n0 0 1 0 1 0')}</textarea></label>
              <label class="field" style="min-width:160px"><span>Kernel / filter</span><textarea data-k="k" rows="6" spellcheck="false">${esc(cfg.kernel ?? '1 -1 -1\n-1 1 -1\n-1 -1 1')}</textarea></label>
            </div>
            <div class="field-row">
              <label class="field"><span>stride s</span><input data-k="s" type="number" min="1" step="1" value="${esc(cfg.stride ?? 1)}"></label>
              <label class="field"><span>padding p (zeros)</span><input data-k="p" type="number" min="0" step="1" value="${esc(cfg.padding ?? 0)}"></label>
              <label class="field"><span>bias b</span><input data-k="b" type="number" step="any" value="${esc(cfg.bias ?? 0)}"></label>
              <label class="field"><span>max-pool k = s (0 = none)</span><input data-k="pool" type="number" min="0" step="1" value="${esc(cfg.pool ?? 2)}"></label>
            </div>
            <p class="lab-msg" data-k="msg"></p>
          </div>
          <div class="board trace-board"><div class="board-title">Convolution → ReLU → max-pool</div><div class="trace" data-k="out"></div></div>
          <div class="paper lab-controls">
            <h4 style="margin:0 0 6px">Parameter counter for a conv layer</h4>
            <div class="field-row">
              <label class="field"><span>kernel K (K × K)</span><input data-k="K" type="number" min="1" value="3"></label>
              <label class="field"><span>input channels Cᵢₙ</span><input data-k="Cin" type="number" min="1" value="64"></label>
              <label class="field"><span>filters Cₒᵤₜ</span><input data-k="Cout" type="number" min="1" value="128"></label>
            </div>
            <p data-k="params" class="chalk-line"></p>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      function render() {
        const I = parseMatrix(q('in').value, 'Input'), K = parseMatrix(q('k').value, 'Kernel');
        const s = Math.max(1, Math.round(+q('s').value || 1)), p = Math.max(0, Math.round(+q('p').value || 0)), b = +q('b').value || 0, pk = Math.max(0, Math.round(+q('pool').value || 0));
        const m = q('msg');
        if (I.error || K.error) { m.textContent = I.error || K.error; m.className = 'lab-msg bad'; q('out').innerHTML = ''; }
        else {
          const n = I.m.length, nw = I.m[0].length, k = K.m.length, kw = K.m[0].length;
          const P = Array.from({ length: n + 2 * p }, (_, i) => Array.from({ length: nw + 2 * p }, (_, j) => (i >= p && i < n + p && j >= p && j < nw + p ? I.m[i - p][j - p] : 0)));
          const oh = Math.floor((n + 2 * p - k) / s) + 1, ow = Math.floor((nw + 2 * p - kw) / s) + 1;
          if (oh < 1 || ow < 1) { m.textContent = 'The kernel is bigger than the (padded) input.'; m.className = 'lab-msg bad'; q('out').innerHTML = ''; }
          else {
            m.textContent = `Output size = ⌊(n + 2p − k)/s⌋ + 1 = ⌊(${n} + ${2 * p} − ${k})/${s}⌋ + 1 = ${oh}${ow !== oh ? ' × ' + ow : ' × ' + ow}`; m.className = 'lab-msg good';
            const O = Array.from({ length: oh }, (_, i) => Array.from({ length: ow }, (_, j) => {
              let sum = b; for (let a = 0; a < k; a++) for (let c = 0; c < kw; c++) sum += P[i * s + a][j * s + c] * K.m[a][c]; return sum; }));
            const R = O.map((r) => r.map((v) => Math.max(0, v)));
            let pooled = null;
            if (pk >= 1 && R.length >= pk && R[0].length >= pk) {
              const ph = Math.floor((R.length - pk) / pk) + 1, pw = Math.floor((R[0].length - pk) / pk) + 1;
              pooled = Array.from({ length: ph }, (_, i) => Array.from({ length: pw }, (_, j) => {
                let mx = -Infinity; for (let a = 0; a < pk; a++) for (let c = 0; c < pk; c++) mx = Math.max(mx, R[i * pk + a][j * pk + c]); return mx; }));
            }
            const first = []; for (let a = 0; a < k; a++) for (let c = 0; c < kw; c++) first.push(`${fmt(P[a][c])}·${fmt(K.m[a][c])}`);
            q('out').innerHTML = `<div class="trace-row">
              ${p ? `<div class="trace-item"><div class="lbl">padded input (${n + 2 * p} × ${nw + 2 * p})</div>${matrix(P)}</div>` : ''}
              <div class="trace-item"><div class="lbl">feature map (${oh} × ${ow})</div>${matrix(O, { dp: 3 })}</div>
              <div class="trace-item"><div class="lbl">ReLU</div>${matrix(R, { dp: 3 })}</div>
              ${pooled ? `<div class="trace-item"><div class="lbl">max-pool ${pk}×${pk}, s=${pk}</div>${matrix(pooled, { dp: 3 })}</div>` : ''}</div>
              <p class="chalk-line small">Top-left entry: ${first.join(' + ')}${b ? ' + ' + fmt(b) : ''} = <b>${fmt(O[0][0])}</b>. Slide right by s, then down by s. The kernel must fit fully inside, never partly.</p>`;
          }
        }
        const Kk = +q('K').value || 0, Ci = +q('Cin').value || 0, Co = +q('Cout').value || 0;
        q('params').innerHTML = `(K × K × Cᵢₙ + 1) × Cₒᵤₜ = (${Kk}×${Kk}×${Ci} + 1) × ${Co} = <b>${((Kk * Kk * Ci + 1) * Co).toLocaleString()}</b> parameters. Pooling layers have 0.`;
      }
      el.addEventListener('input', render); render();
    }
  });
})();
