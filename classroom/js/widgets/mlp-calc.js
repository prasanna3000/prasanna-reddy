/* Lab: one forward pass, one backward pass and one update on a 2-layer network.
   Convention of the M5 numerical deck: z = W a + b, with each ROW of W belonging to one neuron.
   config: { x, W1, b1, W2, b2, y, hidden: "relu"|"sigmoid"|"tanh", output: "sigmoid"|"softmax"|"identity", lr } */
(function () {
  'use strict';
  const { esc, fmt, parseNums, parseMatrix, matrix, sigmoid, softmax } = CU;
  const ACT = {
    relu: { f: (z) => Math.max(0, z), d: (z, a) => (z > 0 ? 1 : 0), name: 'ReLU' },
    sigmoid: { f: sigmoid, d: (z, a) => a * (1 - a), name: 'sigmoid' },
    tanh: { f: Math.tanh, d: (z, a) => 1 - a * a, name: 'tanh' }
  };
  const mv = (W, v) => W.map((r) => r.reduce((s, w, j) => s + w * v[j], 0));
  const outer = (a, b) => a.map((ai) => b.map((bj) => ai * bj));
  const T = (W) => W[0].map((_, j) => W.map((r) => r[j]));

  Widgets.register('mlp-calc', {
    mount(el, cfg) {
      const f = (k, label, val, wide) => `<label class="field" ${wide ? 'style="min-width:260px"' : ''}><span>${label}</span><input data-k="${k}" type="text" value="${esc(val)}"></label>`;
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <p class="small muted" style="margin-top:0">Rows of a matrix are separated by <code>;</code>. Each row of W is one neuron's weights, so z = W·a + b.</p>
            <div class="field-row">${f('x', 'input x', cfg.x ?? '1, 0.5')}${f('y', 'target y', cfg.y ?? '1, 0')}
              <label class="field"><span>learning rate α</span><input data-k="lr" type="number" step="any" value="${esc(cfg.lr ?? 0.1)}"></label></div>
            <div class="field-row">${f('W1', 'W⁽¹⁾ (hidden × input)', cfg.W1 ?? '0.5 0.2; -0.3 0.8; 0.1 -0.4', true)}${f('b1', 'b⁽¹⁾', cfg.b1 ?? '0.1, -0.2, 0.3')}</div>
            <div class="field-row">${f('W2', 'W⁽²⁾ (output × hidden)', cfg.W2 ?? '0.4 -0.1 0.6; 0.2 0.7 -0.3', true)}${f('b2', 'b⁽²⁾', cfg.b2 ?? '0.2, -0.1')}</div>
            <div class="field-row">
              <label class="field"><span>hidden activation</span><select data-k="hidden">${['relu', 'sigmoid', 'tanh'].map((a) => `<option value="${a}" ${a === (cfg.hidden || 'relu') ? 'selected' : ''}>${ACT[a].name}</option>`).join('')}</select></label>
              <label class="field"><span>output + loss</span><select data-k="output">
                ${[['sigmoid', 'sigmoid + BCE (mean over outputs)'], ['softmax', 'softmax + cross-entropy'], ['identity', 'identity + MSE (½Σ)']].map(([v, l]) => `<option value="${v}" ${v === (cfg.output || 'sigmoid') ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            </div>
            <p class="lab-msg" data-k="msg"></p>
          </div>
          <div class="board trace-board"><div class="board-title">Forward pass</div><div class="trace" data-k="fw"></div></div>
          <div class="board trace-board"><div class="board-title">Backward pass and update</div><div class="trace" data-k="bw"></div></div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      const vec = (v) => matrix(v.map((a) => [a]), { dp: 3 });
      const mat = (m) => matrix(m, { dp: 3 });

      function render() {
        const bad = (t) => { q('msg').textContent = t; q('msg').className = 'lab-msg bad'; q('fw').innerHTML = ''; q('bw').innerHTML = ''; };
        const x = parseNums(q('x').value), y = parseNums(q('y').value), b1 = parseNums(q('b1').value), b2 = parseNums(q('b2').value);
        const P1 = parseMatrix(q('W1').value, 'W⁽¹⁾'), P2 = parseMatrix(q('W2').value, 'W⁽²⁾'); const lr = Number(q('lr').value);
        if (P1.error) return bad(P1.error); if (P2.error) return bad(P2.error);
        if (!x || !y || !b1 || !b2) return bad('x, y, b⁽¹⁾ and b⁽²⁾ must be lists of numbers.');
        const W1 = P1.m, W2 = P2.m;
        if (W1[0].length !== x.length) return bad(`W⁽¹⁾ has ${W1[0].length} columns but x has ${x.length} values.`);
        if (b1.length !== W1.length) return bad(`b⁽¹⁾ needs ${W1.length} values (one per hidden neuron).`);
        if (W2[0].length !== W1.length) return bad(`W⁽²⁾ needs ${W1.length} columns (one per hidden neuron).`);
        if (b2.length !== W2.length || y.length !== W2.length) return bad(`b⁽²⁾ and y need ${W2.length} values (one per output).`);
        q('msg').textContent = `Network ${x.length} → ${W1.length} → ${W2.length}: ${W1.length * x.length + W1.length + W2.length * W1.length + W2.length} parameters.`; q('msg').className = 'lab-msg good';
        const H = ACT[q('hidden').value], out = q('output').value;
        const z1 = mv(W1, x).map((v, i) => v + b1[i]); const a1 = z1.map(H.f);
        const z2 = mv(W2, a1).map((v, i) => v + b2[i]);
        const a2 = out === 'sigmoid' ? z2.map(sigmoid) : out === 'softmax' ? softmax(z2) : z2.slice();
        const n = y.length; let L;
        if (out === 'sigmoid') L = -y.reduce((s, yi, i) => s + yi * Math.log(a2[i]) + (1 - yi) * Math.log(1 - a2[i]), 0) / n;
        else if (out === 'softmax') L = -y.reduce((s, yi, i) => s + (yi ? yi * Math.log(a2[i]) : 0), 0);
        else L = 0.5 * y.reduce((s, yi, i) => s + (a2[i] - yi) ** 2, 0);
        q('fw').innerHTML = `<div class="trace-row">
          <div class="trace-item"><div class="lbl">z⁽¹⁾ = W⁽¹⁾x + b⁽¹⁾</div>${vec(z1)}</div>
          <div class="trace-item"><div class="lbl">a⁽¹⁾ = ${H.name}(z⁽¹⁾)</div>${vec(a1)}</div>
          <div class="trace-item"><div class="lbl">z⁽²⁾ = W⁽²⁾a⁽¹⁾ + b⁽²⁾</div>${vec(z2)}</div>
          <div class="trace-item"><div class="lbl">ŷ = a⁽²⁾ (${out})</div>${vec(a2)}</div></div>
          <p class="chalk-line">Loss = <b>${fmt(L)}</b> ${out === 'sigmoid' ? '(BCE averaged over the outputs, as in the deck)' : out === 'softmax' ? '(−Σ y log ŷ)' : '(½Σ(ŷ − y)²)'}
          ${H.name === 'ReLU' && z1.some((v) => v <= 0) ? `<br><span class="small">Hidden neuron ${z1.map((v, i) => (v <= 0 ? i + 1 : null)).filter(Boolean).join(', ')} is "dead" here (z ≤ 0): its gradient will be 0.</span>` : ''}</p>`;
        const d2 = a2.map((v, i) => v - y[i]);
        const dW2 = outer(d2, a1), db2 = d2;
        const back = mv(T(W2), d2); const gp = z1.map((z, i) => H.d(z, a1[i]));
        const d1 = back.map((v, i) => v * gp[i]); const dW1 = outer(d1, x), db1 = d1;
        const nW2 = W2.map((r, i) => r.map((w, j) => w - lr * dW2[i][j])), nb2 = b2.map((b, i) => b - lr * db2[i]);
        const nW1 = W1.map((r, i) => r.map((w, j) => w - lr * dW1[i][j])), nb1 = b1.map((b, i) => b - lr * db1[i]);
        q('bw').innerHTML = `<div class="trace-row">
          <div class="trace-item"><div class="lbl">δ⁽²⁾ = ŷ − y</div>${vec(d2)}</div>
          <div class="trace-item"><div class="lbl">∂L/∂W⁽²⁾ = δ⁽²⁾a⁽¹⁾ᵀ</div>${mat(dW2)}</div>
          <div class="trace-item"><div class="lbl">W⁽²⁾ᵀδ⁽²⁾</div>${vec(back)}</div>
          <div class="trace-item"><div class="lbl">g′(z⁽¹⁾)</div>${vec(gp)}</div>
          <div class="trace-item"><div class="lbl">δ⁽¹⁾ = (W⁽²⁾ᵀδ⁽²⁾) ⊙ g′</div>${vec(d1)}</div>
          <div class="trace-item"><div class="lbl">∂L/∂W⁽¹⁾ = δ⁽¹⁾xᵀ</div>${mat(dW1)}</div></div>
          <p class="chalk-line small">∂L/∂b = δ for each layer. The output delta ŷ − y holds for all three pairings (sigmoid + BCE, softmax + CE, identity + MSE).</p>
          <div class="trace-row" style="margin-top:10px">
          <div class="trace-item"><div class="lbl">W⁽²⁾ new = W − α∂W</div>${mat(nW2)}</div>
          <div class="trace-item"><div class="lbl">b⁽²⁾ new</div>${vec(nb2)}</div>
          <div class="trace-item"><div class="lbl">W⁽¹⁾ new</div>${mat(nW1)}</div>
          <div class="trace-item"><div class="lbl">b⁽¹⁾ new</div>${vec(nb1)}</div></div>`;
      }
      el.addEventListener('input', render); el.addEventListener('change', render); render();
    }
  });
})();
