/* Lab: chi-square test of independence (r × c table) and goodness of fit, with working.
   config: { mode: "independence" | "gof", alpha: 0.05,
             table: "80, 120; 70, 50; 50, 30"         (independence: rows by ; or new line)
             observed: "…", expected: "…" | probs: "…" | (blank = all equal)   (gof)
             params: 0   (gof: parameters estimated from the data, df = k − 1 − params) } */
(function () {
  'use strict';
  const { esc, fmt, parseNums } = CU;
  const SM = StatMath;

  function parseRows(str) {
    const rows = String(str ?? '').split(/[;\n]+/).map((r) => r.trim()).filter(Boolean).map(parseNums);
    if (!rows.length || rows.some((r) => !r || !r.length)) return null;
    if (rows.some((r) => r.length !== rows[0].length)) return null;
    return rows;
  }

  Widgets.register('chisq-calc', {
    mount(el, cfg) {
      const mode = cfg.mode === 'gof' ? 'gof' : 'independence';
      const body = mode === 'independence'
        ? `<label class="field"><span>Observed counts (rows separated by ; or a new line, columns by commas)</span>
             <textarea data-k="table" rows="5">${esc(cfg.table ?? '80, 120\n70, 50\n50, 30')}</textarea></label>`
        : `<label class="field"><span>Observed counts O</span><input data-k="obs" type="text" value="${esc(cfg.observed ?? '1026, 1107, 997, 966, 1075, 933, 1107, 972, 954, 853')}"></label>
           <label class="field"><span>Expected counts E (leave blank for "all equal")</span><input data-k="exp" type="text" value="${esc(cfg.expected ?? '')}"></label>
           <label class="field"><span>…or H₀ probabilities p (E = n·p)</span><input data-k="probs" type="text" value="${esc(cfg.probs ?? '')}"></label>
           <label class="field"><span>Parameters estimated from the data (each costs 1 df)</span><input data-k="params" type="number" min="0" step="1" value="${esc(cfg.params ?? 0)}"></label>`;
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            ${body}
            <label class="field"><span>Level of significance α</span><input data-k="alpha" type="number" step="any" min="0.0001" max="0.5" value="${esc(cfg.alpha ?? 0.05)}"></label>
            <p class="lab-msg" data-k="msg"></p>
          </div>
          <div class="lab-boards">
            <div class="board mini"><div class="board-title">Working</div><div class="trace" data-k="trace"></div></div>
            <div class="board mini"><div class="board-title">χ² distribution under H₀</div><canvas data-k="plot"></canvas></div>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      const bad = (m) => { q('trace').innerHTML = `<p class="lab-msg bad">${m}</p>`; q('msg').textContent = ''; const c = q('plot'); c.getContext('2d').clearRect(0, 0, c.width, c.height); };

      function render() {
        const alpha = Number(q('alpha').value);
        if (!(alpha > 0 && alpha < 0.5)) return bad('α should be between 0 and 0.5.');
        let O, E, df, head, grid = null;
        if (mode === 'independence') {
          const t = parseRows(q('table').value);
          if (!t || t.length < 2 || t[0].length < 2) return bad('Need a rectangular table of counts with at least 2 rows and 2 columns.');
          if (t.some((r) => r.some((v) => v < 0))) return bad('Counts cannot be negative.');
          const rt = t.map((r) => r.reduce((a, b) => a + b, 0)), ct = t[0].map((_, j) => t.reduce((a, r) => a + r[j], 0)), N = rt.reduce((a, b) => a + b, 0);
          if (N === 0 || rt.includes(0) || ct.includes(0)) return bad('A row or column total is 0, so its expected counts are 0.');
          E = t.map((r, i) => r.map((_, j) => rt[i] * ct[j] / N)); O = t; df = (t.length - 1) * (t[0].length - 1);
          head = `<p class="chalk-line">H₀: the two variables are independent &nbsp;vs&nbsp; H₁: they are associated</p>
            <p class="chalk-line">Row totals ${rt.map(fmt).join(', ')} · column totals ${ct.map(fmt).join(', ')} · N = ${fmt(N)}</p>
            <p class="chalk-line">E = (row total × column total)/N, df = (r−1)(c−1) = ${df}</p>`;
          grid = true;
        } else {
          const o = parseNums(q('obs').value);
          if (!o || o.length < 2 || o.some((v) => v < 0)) return bad('Enter at least two observed counts (numbers ≥ 0).');
          const n = o.reduce((a, b) => a + b, 0), k = o.length;
          const ex = q('exp').value.trim(), pr = q('probs').value.trim(); let e;
          if (ex) { e = parseNums(ex); if (!e || e.length !== k || e.some((v) => v <= 0)) return bad(`Expected counts must be ${k} positive numbers.`); }
          else if (pr) { const p = parseNums(pr); if (!p || p.length !== k || p.some((v) => v < 0)) return bad(`Give ${k} probabilities.`); const sp = p.reduce((a, b) => a + b, 0); if (Math.abs(sp - 1) > 0.01) return bad(`The probabilities add to ${fmt(sp)}, not 1.`); e = p.map((v) => v * n); }
          else e = o.map(() => n / k);
          const m = Math.max(0, Math.round(Number(q('params').value) || 0)); df = k - 1 - m;
          if (df < 1) return bad('Degrees of freedom would be below 1: too few categories.');
          O = [o]; E = [e];
          head = `<p class="chalk-line">H₀: the data follow the stated distribution &nbsp;vs&nbsp; H₁: they do not</p>
            <p class="chalk-line">n = ${fmt(n)}, k = ${k} categories, df = k − 1${m ? ` − ${m} estimated` : ''} = ${df}</p>`;
        }
        let chi = 0, minE = Infinity; const contrib = O.map((r, i) => r.map((v, j) => { const e = E[i][j]; minE = Math.min(minE, e); const c = (v - e) ** 2 / e; chi += c; return c; }));
        const crit = SM.chi2Inv(1 - alpha, df), p = 1 - SM.chi2Cdf(chi, df), reject = chi > crit;
        const cell = (i, j) => `${fmt(O[i][j])} / ${fmt(E[i][j], 2)}`;
        const rows = O.map((r, i) => `<tr>${r.map((_, j) => `<td>${cell(i, j)}<br><small>${fmt(contrib[i][j], 3)}</small></td>`).join('')}</tr>`).join('');
        q('trace').innerHTML = `${head}
          <table class="chalk-table"><thead><tr><th colspan="${O[0].length}">O / E, and (O−E)²/E underneath</th></tr></thead><tbody>${rows}</tbody></table>
          <p class="chalk-line">χ² = Σ(O−E)²/E = <b>${fmt(chi, 4)}</b></p>
          <p class="chalk-line">Critical χ²(${df}) at α = ${fmt(alpha)}: <b>${fmt(crit, 3)}</b> (right tail only) · p-value = <b>${p < 1e-4 ? p.toExponential(2) : fmt(p, 4)}</b></p>
          ${minE < 5 ? `<p class="chalk-line"><b>Warning:</b> the smallest expected count is ${fmt(minE, 2)} (< 5). The χ² approximation is unreliable here; merge categories or use an exact test.</p>` : ''}`;
        const m = q('msg');
        m.className = 'lab-msg ' + (reject ? 'good' : 'warn');
        m.textContent = reject
          ? (mode === 'independence' ? 'Reject H₀: there is evidence of an association.' : 'Reject H₀: the data do not fit the stated distribution.')
          : (mode === 'independence' ? 'Fail to reject H₀: no evidence of association (not proof of independence).' : 'Fail to reject H₀: the data are consistent with the stated distribution.');

        const hi = Math.max(crit * 1.6, chi * 1.25, df + 4 * Math.sqrt(2 * df), 8);
        const xs = []; for (let i = 0; i <= 260; i++) xs.push(0.0001 + (hi * i) / 260);
        const pdf = (x) => SM.chi2Pdf(x, df), ymax = Math.min(1.2, Math.max(...xs.map(pdf)) * 1.15);
        const series = [{ points: xs.map((x) => [x, Math.min(pdf(x), ymax)]), color: 'white', label: `χ²(${df}) under H₀` },
          { points: [[crit, 0], ...xs.filter((x) => x >= crit).map((x) => [x, Math.min(pdf(x), ymax)])], color: 'pink', width: 5, label: 'rejection region' },
          { points: [[crit, 0], [crit, ymax]], color: 'yellow', dash: [6, 5], width: 2, label: `critical ${fmt(crit, 3)}` },
          { points: [[Math.min(chi, hi), 0], [Math.min(chi, hi), ymax]], color: 'blue', width: 3.2, label: `χ² = ${fmt(chi, 3)}` }];
        ChalkPlot.draw(q('plot'), { series, xlim: [0, hi], ylim: [0, ymax * 1.05], xlabel: 'χ²', height: 250 });
      }
      el.addEventListener('input', render); render();
    }
  });
})();
