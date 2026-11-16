/* Lab: z / t hypothesis tests with working, critical value, p-value and the rejection region drawn.
   config: { kind: "mean" | "prop" | "mean2" | "prop2" | "paired", tail: "right" | "left" | "two", alpha: 0.05, ...inputs }
     mean   : xbar, mu0, s, n, dist ("z" | "t")
     prop   : x, n, p0
     mean2  : x1, s1, n1, x2, s2, n2, dist ("z" unpooled | "t" pooled, df = n1 + n2 − 2)
     prop2  : x1, n1, x2, n2, pooled (true/false)
     paired : pairs ("before, after" per line), d = after − before, one-sample t on d */
(function () {
  'use strict';
  const { esc, fmt, parseNums } = CU;
  const SM = StatMath;

  const FIELDS = {
    mean: [['xbar', 'Sample mean x̄', 17352], ['mu0', 'Claimed mean μ₀', 18580], ['s', 'Sample SD s (or known σ)', 2012], ['n', 'Sample size n', 10]],
    prop: [['x', 'Successes x', 18], ['n', 'Sample size n', 20], ['p0', 'Claimed proportion P₀', 0.85]],
    mean2: [['x1', 'Mean 1', 78], ['s1', 'SD 1', 10], ['n1', 'n₁', 40], ['x2', 'Mean 2', 74], ['s2', 'SD 2', 12], ['n2', 'n₂', 35]],
    prop2: [['x1', 'Successes 1', 90], ['n1', 'n₁', 3000], ['x2', 'Successes 2', 48], ['n2', 'n₂', 2500]]
  };
  const DEFAULT_DIST = { mean: 't', mean2: 'z' };
  const SYMBOL = { mean: 'μ', prop: 'P', mean2: 'μ₁ − μ₂', prop2: 'P₁ − P₂', paired: 'μ_d' };

  function hyps(kind, tail, ref) {
    const s = SYMBOL[kind];
    if (tail === 'two') return [`H₀: ${s} = ${ref}`, `H₁: ${s} ≠ ${ref}`];
    if (tail === 'right') return [`H₀: ${s} ≤ ${ref}`, `H₁: ${s} > ${ref}`];
    return [`H₀: ${s} ≥ ${ref}`, `H₁: ${s} < ${ref}`];
  }

  Widgets.register('htest-calc', {
    mount(el, cfg) {
      const kind = FIELDS[cfg.kind] || cfg.kind === 'paired' ? cfg.kind : 'mean';
      const dist0 = cfg.dist || DEFAULT_DIST[kind] || 'z';
      const fields = (FIELDS[kind] || []).map(([k, label, def]) => `
        <label class="field"><span>${label}</span><input data-k="${k}" type="number" step="any" value="${esc(cfg[k] ?? def)}"></label>`).join('');
      const extra =
        kind === 'mean' || kind === 'mean2'
          ? `<label class="field"><span>Test with</span><select data-k="dist">
               <option value="z" ${dist0 === 'z' ? 'selected' : ''}>z (σ known, or n ≥ 30)</option>
               <option value="t" ${dist0 === 't' ? 'selected' : ''}>t (σ unknown, small n${kind === 'mean2' ? ', pooled' : ''})</option></select></label>`
          : kind === 'prop2'
            ? `<label class="field"><span><input data-k="pooled" type="checkbox" ${cfg.pooled === false ? '' : 'checked'}> pooled p* (use when H₀ says P₁ = P₂)</span></label>`
            : kind === 'paired'
              ? `<label class="field"><span>Pairs "before, after" (one per line); d = after − before</span>
                   <textarea data-k="pairs" rows="9">${esc(cfg.pairs ?? '75, 70\n70, 77\n46, 57\n68, 60\n68, 79\n43, 64\n55, 55\n68, 77\n77, 76')}</textarea></label>`
              : '';
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <div class="field-row">${fields}</div>
            ${extra}
            <div class="field-row">
              <label class="field"><span>Tail (from the wording of H₁)</span><select data-k="tail">
                <option value="right" ${cfg.tail === 'right' ? 'selected' : ''}>right-tailed (H₁: >)</option>
                <option value="left" ${cfg.tail === 'left' ? 'selected' : ''}>left-tailed (H₁: <)</option>
                <option value="two" ${(cfg.tail ?? 'two') === 'two' ? 'selected' : ''}>two-tailed (H₁: ≠)</option></select></label>
              <label class="field"><span>Level of significance α</span><input data-k="alpha" type="number" step="any" min="0.0001" max="0.5" value="${esc(cfg.alpha ?? 0.05)}"></label>
            </div>
            <p class="lab-msg" data-k="msg"></p>
          </div>
          <div class="lab-boards">
            <div class="board mini"><div class="board-title">Working</div><div class="trace" data-k="trace"></div></div>
            <div class="board mini"><div class="board-title">Where the statistic lands under H₀</div><canvas data-k="plot"></canvas></div>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      const num = (k) => Number(q(k).value);
      const bad = (m) => { q('trace').innerHTML = `<p class="lab-msg bad">${m}</p>`; q('msg').textContent = ''; const c = q('plot'); c.getContext('2d').clearRect(0, 0, c.width, c.height); };

      function compute() {
        let stat, df = null, useT = false, lines = [], ref = 0;
        if (kind === 'mean') {
          const xb = num('xbar'), mu = num('mu0'), s = num('s'), n = num('n');
          if (![xb, mu, s, n].every(Number.isFinite) || s <= 0 || n < 2) return { err: 'Enter numbers, with s > 0 and n ≥ 2.' };
          useT = q('dist').value === 't'; df = useT ? n - 1 : null; ref = fmt(mu);
          const se = s / Math.sqrt(n); stat = (xb - mu) / se;
          lines = [`SE = s/√n = ${fmt(s)}/√${fmt(n)} = <b>${fmt(se)}</b>`, `${useT ? 't' : 'z'} = (x̄ − μ₀)/SE = (${fmt(xb)} − ${fmt(mu)})/${fmt(se)} = <b>${fmt(stat)}</b>` + (useT ? `, df = n − 1 = ${fmt(df)}` : '')];
        } else if (kind === 'paired') {
          const rows = String(q('pairs').value).split(/\n+/).map((r) => parseNums(r)).filter((r) => r && r.length === 2);
          if (rows.length < 2) return { err: 'Give at least two lines, each "before, after".' };
          const d = rows.map(([b, a]) => a - b), n = d.length, mean = d.reduce((a, b) => a + b, 0) / n;
          const ss = d.reduce((a, b) => a + (b - mean) ** 2, 0), s = Math.sqrt(ss / (n - 1)); if (s === 0) return { err: 'All differences are equal, so s_d = 0.' };
          useT = true; df = n - 1; ref = 0; const se = s / Math.sqrt(n); stat = mean / se;
          lines = [`d = after − before = ${d.map((v) => fmt(v)).join(', ')}`, `d̄ = ${fmt(mean)}, Σ(d − d̄)² = ${fmt(ss)}, s_d = √(${fmt(ss)}/${n - 1}) = ${fmt(s)}`, `t = d̄/(s_d/√n) = ${fmt(mean)}/${fmt(se)} = <b>${fmt(stat)}</b>, df = n − 1 = ${df}`];
        } else if (kind === 'prop') {
          const x = num('x'), n = num('n'), p0 = num('p0');
          if (![x, n, p0].every(Number.isFinite) || n < 1 || x < 0 || x > n || p0 <= 0 || p0 >= 1) return { err: 'Need 0 ≤ x ≤ n and 0 < P₀ < 1.' };
          const ph = x / n, se = Math.sqrt(p0 * (1 - p0) / n); stat = (ph - p0) / se; ref = fmt(p0);
          lines = [`p̂ = x/n = ${fmt(x)}/${fmt(n)} = ${fmt(ph)}`, `SE under H₀ = √(P₀Q₀/n) = √(${fmt(p0)}×${fmt(1 - p0)}/${fmt(n)}) = ${fmt(se)}`, `z = (p̂ − P₀)/SE = <b>${fmt(stat)}</b>`];
        } else if (kind === 'mean2') {
          const [x1, s1, n1, x2, s2, n2] = ['x1', 's1', 'n1', 'x2', 's2', 'n2'].map(num);
          if (![x1, s1, n1, x2, s2, n2].every(Number.isFinite) || s1 <= 0 || s2 <= 0 || n1 < 2 || n2 < 2) return { err: 'Enter numbers, with SDs > 0 and n ≥ 2.' };
          useT = q('dist').value === 't';
          if (useT) {
            df = n1 + n2 - 2; const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / df, se = Math.sqrt(sp2 * (1 / n1 + 1 / n2)); stat = (x1 - x2) / se;
            lines = [`pooled s_p² = [(n₁−1)s₁² + (n₂−1)s₂²]/(n₁+n₂−2) = ${fmt(sp2)}`, `SE = s_p√(1/n₁ + 1/n₂) = ${fmt(se)}`, `t = (x̄₁ − x̄₂)/SE = (${fmt(x1)} − ${fmt(x2)})/${fmt(se)} = <b>${fmt(stat)}</b>, df = ${df}`];
          } else {
            const se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2); stat = (x1 - x2) / se;
            lines = [`SE = √(s₁²/n₁ + s₂²/n₂) = √(${fmt(s1 * s1 / n1)} + ${fmt(s2 * s2 / n2)}) = ${fmt(se)}`, `z = (x̄₁ − x̄₂)/SE = (${fmt(x1)} − ${fmt(x2)})/${fmt(se)} = <b>${fmt(stat)}</b>`];
          }
        } else {
          const [x1, n1, x2, n2] = ['x1', 'n1', 'x2', 'n2'].map(num);
          if (![x1, n1, x2, n2].every(Number.isFinite) || n1 < 1 || n2 < 1 || x1 < 0 || x2 < 0 || x1 > n1 || x2 > n2) return { err: 'Need 0 ≤ x ≤ n for both samples.' };
          const p1 = x1 / n1, p2 = x2 / n2, pooled = q('pooled').checked, ps = (x1 + x2) / (n1 + n2);
          const v = pooled ? ps * (1 - ps) * (1 / n1 + 1 / n2) : p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2;
          if (v === 0) return { err: 'The standard error is 0 (all or none succeeded in both samples).' };
          const se = Math.sqrt(v); stat = (p1 - p2) / se;
          lines = [`p̂₁ = ${fmt(p1)}, p̂₂ = ${fmt(p2)}` + (pooled ? `, pooled p* = (x₁+x₂)/(n₁+n₂) = ${fmt(ps)}` : ''),
            `SE = ${pooled ? '√[p*q*(1/n₁ + 1/n₂)]' : '√(p̂₁q̂₁/n₁ + p̂₂q̂₂/n₂)'} = ${fmt(se)}`, `z = (p̂₁ − p̂₂)/SE = <b>${fmt(stat)}</b>`];
        }
        return { stat, df, useT, lines, ref };
      }

      function render() {
        const r = compute();
        if (r.err) return bad(r.err);
        const alpha = num('alpha'), tail = q('tail').value;
        if (!(alpha > 0 && alpha < 0.5)) return bad('α should be between 0 and 0.5 (usually 0.05 or 0.01).');
        const { stat, df, useT } = r;
        const cdf = useT ? (x) => SM.tCdf(x, df) : SM.normCdf, pdf = useT ? (x) => SM.tPdf(x, df) : SM.normPdf;
        const inv = useT ? (p) => SM.tInv(p, df) : SM.normInv, name = useT ? `t(${df})` : 'z';
        const crit = tail === 'two' ? inv(1 - alpha / 2) : tail === 'right' ? inv(1 - alpha) : inv(alpha);
        const p = tail === 'two' ? 2 * (1 - cdf(Math.abs(stat))) : tail === 'right' ? 1 - cdf(stat) : cdf(stat);
        const reject = tail === 'two' ? Math.abs(stat) > crit : tail === 'right' ? stat > crit : stat < crit;
        const [h0, h1] = hyps(kind, tail, r.ref);
        const critTxt = tail === 'two' ? `±${fmt(crit, 3)}` : fmt(crit, 3);
        q('trace').innerHTML = `
          <p class="chalk-line">${h0} &nbsp;vs&nbsp; ${h1} &nbsp; (${tail === 'two' ? 'two' : 'one'}-tailed, α = ${fmt(alpha)})</p>
          ${r.lines.map((l) => `<p class="chalk-line">${l}</p>`).join('')}
          <p class="chalk-line">Critical value (${name}, ${tail === 'two' ? `α/2 = ${fmt(alpha / 2)} in each tail` : `α = ${fmt(alpha)} in one tail`}): <b>${critTxt}</b></p>
          <p class="chalk-line">p-value = <b>${p < 1e-4 ? p.toExponential(2) : fmt(p, 4)}</b> ${p <= alpha ? '≤' : '>'} α</p>`;
        const m = q('msg');
        m.className = 'lab-msg ' + (reject ? 'good' : 'warn');
        m.textContent = reject
          ? `Reject H₀: the statistic is in the rejection region (p ≤ α). There is enough evidence for H₁.`
          : `Fail to reject H₀: not enough evidence for H₁. (That is not the same as proving H₀ true.)`;

        const L = Math.min(9, Math.max(4.2, Math.abs(stat) + 0.8, Math.abs(crit) + 0.8));
        const xs = []; for (let i = 0; i <= 240; i++) xs.push(-L + (2 * L * i) / 240);
        const curve = xs.map((x) => [x, pdf(x)]);
        const series = [{ points: curve, color: 'white', label: `${name} curve under H₀` }];
        const tailPts = (a, b) => xs.filter((x) => x >= a && x <= b).map((x) => [x, pdf(x)]);
        const top = pdf(0) * 1.12;
        if (tail !== 'left') series.push({ points: [[crit < 0 ? -crit : crit, 0], ...tailPts(Math.abs(crit), L)], color: 'pink', width: 5, label: 'rejection region' });
        if (tail === 'left') series.push({ points: [...tailPts(-L, crit), [crit, 0]], color: 'pink', width: 5, label: 'rejection region' });
        if (tail === 'two') series.push({ points: [...tailPts(-L, -Math.abs(crit)), [-Math.abs(crit), 0]], color: 'pink', width: 5 });
        const cl = tail === 'two' ? [-Math.abs(crit), Math.abs(crit)] : [crit];
        cl.forEach((c, i) => series.push({ points: [[c, 0], [c, top]], color: 'yellow', dash: [6, 5], width: 2, label: i === 0 ? 'critical value' : undefined }));
        series.push({ points: [[stat, 0], [stat, top]], color: 'blue', width: 3.2, label: `statistic = ${fmt(stat, 3)}` });
        ChalkPlot.draw(q('plot'), { series, xlim: [-L, L], ylim: [0, top * 1.05], xlabel: name, height: 250 });
      }
      el.addEventListener('input', render); el.addEventListener('change', render); render();
    }
  });
})();
