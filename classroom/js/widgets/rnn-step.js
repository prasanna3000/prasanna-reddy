/* Lab: a vanilla RNN unrolled through time, h_t = tanh(Whh h_{t-1} + Whx x_t + b),
   plus parameter counts for RNN, GRU and LSTM.
   config: { Whx: "…", Whh: "…", b: "0, 0", xs: "x1; x2; x3", Who: "" } */
(function () {
  'use strict';
  const { esc, fmt, parseNums, parseMatrix, matrix } = CU;
  const mv = (W, v) => W.map((r) => r.reduce((s, w, j) => s + w * v[j], 0));

  Widgets.register('rnn-step', {
    mount(el, cfg) {
      const f = (k, label, val) => `<label class="field" style="min-width:200px"><span>${label}</span><input data-k="${k}" type="text" value="${esc(val)}"></label>`;
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <p class="small muted" style="margin-top:0">Rows separated by <code>;</code>. Each row of a weight matrix belongs to one hidden unit.</p>
            <div class="field-row">${f('Whx', 'W_hx (h × d)', cfg.Whx ?? '0.5 0.3; 0.2 0.4')}${f('Whh', 'W_hh (h × h)', cfg.Whh ?? '0.1 0.2; 0.3 0.1')}${f('b', 'b_h', cfg.b ?? '0, 0')}</div>
            <div class="field-row">${f('xs', 'inputs x₁; x₂; … (one per step)', cfg.xs ?? '1, 0; 0, 1; 1, 1')}${f('Who', 'W_ho (optional, V × h)', cfg.Who ?? '')}</div>
            <p class="lab-msg" data-k="msg"></p>
          </div>
          <div class="board trace-board"><div class="board-title">Unrolled through time (h₀ = 0)</div><div class="trace" data-k="out"></div></div>
          <div class="paper lab-controls">
            <h4 style="margin:0 0 6px">Parameter counter</h4>
            <div class="field-row">
              <label class="field"><span>input d</span><input data-k="d" type="number" min="1" value="100"></label>
              <label class="field"><span>hidden h</span><input data-k="h" type="number" min="1" value="256"></label>
              <label class="field"><span>output V (0 = none)</span><input data-k="V" type="number" min="0" value="0"></label>
            </div>
            <div data-k="pc"></div>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      function render() {
        const m = q('msg'); const bad = (t) => { m.textContent = t; m.className = 'lab-msg bad'; q('out').innerHTML = ''; };
        const A = parseMatrix(q('Whx').value, 'W_hx'), B = parseMatrix(q('Whh').value, 'W_hh'), X = parseMatrix(q('xs').value, 'Inputs');
        const b = parseNums(q('b').value); const Ostr = q('Who').value.trim(); const O = Ostr ? parseMatrix(Ostr, 'W_ho') : null;
        let ok = true;
        if (A.error || B.error || X.error) { bad(A.error || B.error || X.error); ok = false; }
        else if (O && O.error) { bad(O.error); ok = false; }
        else {
          const h = A.m.length, d = A.m[0].length;
          if (B.m.length !== h || B.m[0].length !== h) { bad(`W_hh must be ${h} × ${h}.`); ok = false; }
          else if (!b || b.length !== h) { bad(`b_h needs ${h} values.`); ok = false; }
          else if (X.m[0].length !== d) { bad(`Each input needs ${d} values (W_hx has ${d} columns).`); ok = false; }
          else if (O && O.m[0].length !== h) { bad(`W_ho needs ${h} columns.`); ok = false; }
          if (ok) {
            m.textContent = `d = ${d}, h = ${h}, T = ${X.m.length} steps. The same weights are used at every step.`; m.className = 'lab-msg good';
            let hp = new Array(h).fill(0); const rows = [];
            X.m.forEach((x, t) => {
              const a = mv(B.m, hp), c = mv(A.m, x); const z = a.map((v, i) => v + c[i] + b[i]); const hn = z.map(Math.tanh);
              rows.push(`<div class="trace-row" style="margin-bottom:10px"><div class="trace-item"><div class="lbl">t = ${t + 1}: W_hh h${t}</div>${matrix(a.map((v) => [v]), { dp: 3 })}</div>
                <div class="trace-item"><div class="lbl">+ W_hx x${t + 1}</div>${matrix(c.map((v) => [v]), { dp: 3 })}</div>
                <div class="trace-item"><div class="lbl">+ b = z${t + 1}</div>${matrix(z.map((v) => [v]), { dp: 3 })}</div>
                <div class="trace-item"><div class="lbl">h${t + 1} = tanh(z)</div>${matrix(hn.map((v) => [v]), { dp: 3 })}</div>
                ${O ? `<div class="trace-item"><div class="lbl">o${t + 1} = W_ho h${t + 1}</div>${matrix(mv(O.m, hn).map((v) => [v]), { dp: 3 })}</div>` : ''}</div>`);
              hp = hn;
            });
            q('out').innerHTML = rows.join('');
          }
        }
        const d = +q('d').value || 0, h = +q('h').value || 0, V = +q('V').value || 0; const out = V ? V * h + V : 0;
        const core = h * d + h * h + h;
        q('pc').innerHTML = `<table class="ruled" style="text-align:left"><thead><tr><th style="text-align:left">Cell</th><th>Recurrent part</th><th>+ output layer</th><th>Total</th></tr></thead><tbody>
          <tr><td style="text-align:left">Vanilla RNN</td><td>hd + h² + h = ${core.toLocaleString()}</td><td>${out.toLocaleString()}</td><td><b>${(core + out).toLocaleString()}</b></td></tr>
          <tr><td style="text-align:left">GRU (3 blocks)</td><td>3(hd + h² + h) = ${(3 * core).toLocaleString()}</td><td>${out.toLocaleString()}</td><td><b>${(3 * core + out).toLocaleString()}</b></td></tr>
          <tr><td style="text-align:left">LSTM (4 blocks)</td><td>4(hd + h² + h) = ${(4 * core).toLocaleString()}</td><td>${out.toLocaleString()}</td><td><b>${(4 * core + out).toLocaleString()}</b></td></tr>
          <tr><td style="text-align:left">Bidirectional RNN</td><td>2(hd + h² + h) = ${(2 * core).toLocaleString()}</td><td>${V ? (V * 2 * h + V).toLocaleString() : 0}</td><td><b>${(2 * core + (V ? V * 2 * h + V : 0)).toLocaleString()}</b></td></tr></tbody></table>`;
      }
      el.addEventListener('input', render); render();
    }
  });
})();
