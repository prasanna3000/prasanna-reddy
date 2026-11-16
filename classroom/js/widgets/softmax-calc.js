/* Lab: sigmoid + binary cross-entropy, and softmax + categorical cross-entropy, with working.
   config: { z: 0.5, y: 1, logits: "2, 1, 0.1", cls: 1 }   (cls is 1-based) */
(function () {
  'use strict';
  const { esc, fmt, parseNums, sigmoid } = CU;

  Widgets.register('softmax-calc', {
    mount(el, cfg) {
      el.innerHTML = `
        <div class="lab">
          <div class="lab-boards">
            <div class="paper lab-controls">
              <h4 style="margin:0 0 6px">Sigmoid neuron (binary)</h4>
              <div class="field-row">
                <label class="field"><span>z = wᵀx</span><input data-k="z" type="number" step="any" value="${esc(cfg.z ?? 0.5)}"></label>
                <label class="field"><span>true label y (0 or 1)</span><input data-k="y" type="number" min="0" max="1" step="1" value="${esc(cfg.y ?? 1)}"></label>
              </div>
              <div class="trace board" style="border-width:6px" data-k="sig"></div>
            </div>
            <div class="paper lab-controls">
              <h4 style="margin:0 0 6px">Softmax (multi-class)</h4>
              <div class="field-row">
                <label class="field"><span>logits z</span><input data-k="logits" type="text" value="${esc(cfg.logits ?? '2, 1, 0.1')}"></label>
                <label class="field"><span>true class (1, 2, …)</span><input data-k="cls" type="number" min="1" step="1" value="${esc(cfg.cls ?? 1)}"></label>
              </div>
              <div class="trace board" style="border-width:6px" data-k="sm"></div>
            </div>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      function render() {
        const z = Number(q('z').value), y = Number(q('y').value);
        if (Number.isFinite(z) && (y === 0 || y === 1)) {
          const p = sigmoid(z); const L = -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
          q('sig').innerHTML = `
            <p class="chalk-line">ŷ = σ(${fmt(z)}) = 1 / (1 + e^${fmt(-z)}) = <b>${fmt(p)}</b> → predict class <b>${p >= 0.5 ? 1 : 0}</b> (threshold 0.5, i.e. z ≥ 0)</p>
            <p class="chalk-line">BCE = −[y log ŷ + (1 − y) log(1 − ŷ)] = ${y === 1 ? `−log(${fmt(p)})` : `−log(1 − ${fmt(p)})`} = <b>${fmt(L)}</b></p>
            <p class="chalk-line">∂L/∂z = ŷ − y = <b>${fmt(p - y)}</b> &nbsp; · &nbsp; σ′(z) = σ(1 − σ) = ${fmt(p * (1 - p))} (max 0.25)</p>`;
        } else q('sig').innerHTML = '<p class="lab-msg bad">Enter a number for z and 0 or 1 for y.</p>';
        const zs = parseNums(q('logits').value); const k = Math.round(Number(q('cls').value));
        if (!zs || zs.length < 2 || !(k >= 1 && k <= zs.length)) { q('sm').innerHTML = '<p class="lab-msg bad">Enter two or more logits and a class between 1 and their count.</p>'; return; }
        const mx = Math.max(...zs); const ex = zs.map((v) => Math.exp(v)); const S = ex.reduce((a, b) => a + b, 0);
        const p = ex.map((v) => v / S); const L = -Math.log(p[k - 1]);
        q('sm').innerHTML = `
          <table class="chalk-table"><thead><tr><th>class</th><th>z</th><th>eᶻ</th><th>ŷ = eᶻ/Σ</th><th>y</th><th>∂L/∂z = ŷ − y</th></tr></thead><tbody>
          ${zs.map((v, i) => `<tr><td>${i + 1}${p[i] === Math.max(...p) ? ' ★' : ''}</td><td>${fmt(v)}</td><td>${fmt(ex[i])}</td><td>${fmt(p[i])}</td><td>${i === k - 1 ? 1 : 0}</td><td>${fmt(p[i] - (i === k - 1 ? 1 : 0))}</td></tr>`).join('')}
          <tr class="sum"><td>Σ</td><td></td><td>${fmt(S)}</td><td>${fmt(p.reduce((a, b) => a + b, 0))}</td><td>1</td><td>0</td></tr></tbody></table>
          <p class="chalk-line">Cross-entropy = −log ŷ_${k} = −log(${fmt(p[k - 1])}) = <b>${fmt(L)}</b>. Predicted class = argmax = <b>${p.indexOf(Math.max(...p)) + 1}</b>.</p>
          <p class="chalk-line small">Stable trick: subtract max z (${fmt(mx)}) before exponentiating. The probabilities don't change.</p>`;
      }
      el.addEventListener('input', render); render();
    }
  });
})();
