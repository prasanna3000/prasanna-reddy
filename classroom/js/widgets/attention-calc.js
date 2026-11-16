/* Lab: scaled dot-product attention by hand.
   Attention(Q, K, V) = softmax(QKᵀ/√d_k + mask) V
   config: { Q: "rows; …", K: "…", V: "…", scale: true, mask: false } */
(function () {
  'use strict';
  const { esc, fmt, parseMatrix, matrix, softmax } = CU;

  Widgets.register('attention-calc', {
    mount(el, cfg) {
      const f = (k, label, val) => `<label class="field" style="min-width:200px"><span>${label}</span><input data-k="${k}" type="text" value="${esc(val)}"></label>`;
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <p class="small muted" style="margin-top:0">One row per token; rows separated by <code>;</code>. Q and K need the same width d_k.</p>
            <div class="field-row">${f('Q', 'Queries Q (m × d_k)', cfg.Q ?? '1 0; 0 1; 1 1')}${f('K', 'Keys K (n × d_k)', cfg.K ?? '1 0; 0 1; 1 1')}${f('V', 'Values V (n × d_v)', cfg.V ?? '1 2; 3 4; 5 6')}</div>
            <div class="field-row">
              <label class="field"><span><input data-k="scale" type="checkbox" ${cfg.scale === false ? '' : 'checked'}> divide by √d_k</span></label>
              <label class="field"><span><input data-k="mask" type="checkbox" ${cfg.mask ? 'checked' : ''}> causal mask (row i sees keys ≤ i)</span></label>
            </div>
            <p class="lab-msg" data-k="msg"></p>
          </div>
          <div class="board trace-board"><div class="board-title">softmax(QKᵀ/√d_k) V</div><div class="trace" data-k="out"></div></div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      function render() {
        const m = q('msg'); const bad = (t) => { m.textContent = t; m.className = 'lab-msg bad'; q('out').innerHTML = ''; };
        const Q = parseMatrix(q('Q').value, 'Q'), K = parseMatrix(q('K').value, 'K'), V = parseMatrix(q('V').value, 'V');
        if (Q.error || K.error || V.error) return bad(Q.error || K.error || V.error);
        const dk = Q.m[0].length;
        if (K.m[0].length !== dk) return bad(`Q rows have ${dk} values but K rows have ${K.m[0].length}.`);
        if (V.m.length !== K.m.length) return bad(`V needs one row per key (${K.m.length}).`);
        const scale = q('scale').checked ? Math.sqrt(dk) : 1; const mask = q('mask').checked;
        if (mask && Q.m.length !== K.m.length) return bad('A causal mask needs the same number of queries and keys (self-attention).');
        const raw = Q.m.map((qr) => K.m.map((kr) => qr.reduce((s, v, j) => s + v * kr[j], 0)));
        const S = raw.map((r, i) => r.map((v, j) => (mask && j > i ? -Infinity : v / scale)));
        const A = S.map((r) => softmax(r));
        const Z = A.map((ar) => V.m[0].map((_, c) => ar.reduce((s, a, j) => s + a * V.m[j][c], 0)));
        m.textContent = `d_k = ${dk}, scale = ${q('scale').checked ? '√' + dk + ' = ' + fmt(scale) : 'none'}. Each row of the weights sums to 1.`; m.className = 'lab-msg good';
        const show = (M) => matrix(M.map((r) => r.map((v) => (v === -Infinity ? '−∞' : v))), { dp: 3 });
        q('out').innerHTML = `<div class="trace-row">
          <div class="trace-item"><div class="lbl">raw scores QKᵀ</div>${matrix(raw, { dp: 3 })}</div>
          <div class="trace-item"><div class="lbl">÷ √d_k${mask ? ' + mask' : ''}</div>${show(S)}</div>
          <div class="trace-item"><div class="lbl">weights α = softmax(row)</div>${matrix(A, { dp: 3 })}</div>
          <div class="trace-item"><div class="lbl">output Z = αV</div>${matrix(Z, { dp: 3 })}</div></div>
          <p class="chalk-line small">Row 1 output = ${A[0].map((a, j) => `${fmt(a, 3)}·v${j + 1}`).join(' + ')}. Without the √d_k scaling, large d_k makes scores huge, softmax nearly one-hot, and its gradient ≈ 0.</p>`;
      }
      el.addEventListener('input', render); el.addEventListener('change', render); render();
    }
  });
})();
