/* Lab: four pictures of convexity, each with a convex example (left) and a non-convex one (right).
   1. Sets: the rubber band between two points stays inside a circle, but leaves a C shape.
   2. Functions: the bowl x² stays under the string (chord); the wavy x⁴ − 3x² pops above it.
   3. Gradient test: the bowl stays above every tangent ruler; the wavy curve dips below some.
   4. Why it matters: gradient descent always finds the bowl's one bottom, but can get stuck
      in a fake bottom of the bumpy x⁴ − 3x² + x.
   config: { start: 'set' | 'chord' | 'ruler' | 'roll' } */
(function () {
  'use strict';
  const { fmt } = CU;

  const bowl = (x) => x * x, dBowl = (x) => 2 * x;
  const wavy = (x) => x ** 4 - 3 * x * x, dWavy = (x) => 4 * x ** 3 - 6 * x;
  const bump = (x) => x ** 4 - 3 * x * x + x, dBump = (x) => 4 * x ** 3 - 6 * x + 1;
  const curve = (f, a = -2, b = 2) => Array.from({ length: 161 }, (_, i) => { const x = a + ((b - a) * i) / 160; return [x, f(x)]; });

  const CPOLY = [[0, 0], [3, 0], [3, 0.8], [1, 0.8], [1, 2.2], [3, 2.2], [3, 3], [0, 3], [0, 0]];
  function inPoly(x, y) {
    let c = false;
    for (let i = 0, j = CPOLY.length - 2; i < CPOLY.length - 1; j = i++) {
      const [xi, yi] = CPOLY[i], [xj, yj] = CPOLY[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  const STATIONS = {
    set: { name: '1 · Sets', slider: ['θ (where the dot is on the band)', 0, 1, 0.01, 0.5], left: 'Circle: convex', right: 'C shape: not convex' },
    chord: { name: '2 · Bowl vs string', slider: ['θ (where you look along the string)', 0, 1, 0.01, 0.5], left: 'Bowl f = x²', right: 'Wavy f = x⁴ − 3x²' },
    ruler: { name: '3 · Ruler (tangent)', slider: ['Touch point x', -1.8, 1.8, 0.05, 0], left: 'Bowl f = x²', right: 'Wavy f = x⁴ − 3x²' },
    roll: { name: '4 · Roll a ball', slider: ['Start x', -1.9, 1.9, 0.05, 1.6], left: 'Bowl: one bottom', right: 'Bumpy f = x⁴ − 3x² + x' }
  };

  Widgets.register('convexity', {
    mount(el, cfg) {
      let st = STATIONS[cfg.start] ? cfg.start : 'set';
      let timer = null;
      el.innerHTML = `
        <div class="lab">
          <div class="lab-controls paper">
            <div class="btn-row" data-k="tabs">${Object.entries(STATIONS).map(([k, s]) => `<button class="btn" type="button" data-st="${k}">${s.name}</button>`).join('')}</div>
            <label class="field"><span><span data-k="slab"></span> = <b data-k="sval"></b></span>
              <input data-k="s" type="range"></label>
            <div class="btn-row" data-k="rollrow" style="display:none"><button class="btn btn-chalk" type="button" data-k="roll">Roll the ball</button></div>
            <div class="readout" data-k="read"></div>
          </div>
          <div class="lab-boards">
            <div class="board mini"><div class="board-title" data-k="lt"></div><canvas data-k="L"></canvas></div>
            <div class="board mini"><div class="board-title" data-k="rt"></div><canvas data-k="R"></canvas></div>
          </div>
        </div>`;
      const q = (k) => el.querySelector(`[data-k="${k}"]`);
      const ok = (t) => `<p class="lab-msg good">${t}</p>`, bad = (t) => `<p class="lab-msg bad">${t}</p>`;

      function setStation(k) {
        st = k; clearInterval(timer);
        const s = STATIONS[k], sl = q('s');
        q('slab').textContent = s.slider[0];
        sl.min = s.slider[1]; sl.max = s.slider[2]; sl.step = s.slider[3]; sl.value = s.slider[4];
        q('lt').textContent = s.left; q('rt').textContent = s.right;
        q('rollrow').style.display = k === 'roll' ? '' : 'none';
        q('tabs').querySelectorAll('[data-st]').forEach((b) => b.classList.toggle('btn-chalk', b.dataset.st === k));
        render();
      }

      function render(trail) {
        const v = Number(q('s').value);
        q('sval').textContent = fmt(v, 2);
        const L = q('L'), R = q('R');
        if (st === 'set') {
          const circ = Array.from({ length: 121 }, (_, i) => [Math.cos((i / 60) * Math.PI), Math.sin((i / 60) * Math.PI)]);
          const A = [-0.7, 0.45], B = [0.6, -0.55], P = [2.5, 0.4], Q = [2.5, 2.6];
          const a = [v * A[0] + (1 - v) * B[0], v * A[1] + (1 - v) * B[1]], b = [v * P[0] + (1 - v) * Q[0], v * P[1] + (1 - v) * Q[1]];
          const inA = Math.hypot(a[0], a[1]) <= 1, inB = inPoly(b[0], b[1]);
          ChalkPlot.draw(L, { height: 230, xlim: [-1.5, 1.5], ylim: [-1.3, 1.3], series: [
            { points: circ, kind: 'line', color: 'blue', width: 2 },
            { points: [A, B], kind: 'line', color: 'pink', dash: [5, 4] },
            { points: [A, B], kind: 'dots', color: 'pink' },
            { points: [a], kind: 'dots', color: inA ? 'green' : 'orange', radius: 7 }] });
          ChalkPlot.draw(R, { height: 230, xlim: [-0.4, 3.4], ylim: [-0.3, 3.3], series: [
            { points: CPOLY, kind: 'line', color: 'blue', width: 2 },
            { points: [P, Q], kind: 'line', color: 'pink', dash: [5, 4] },
            { points: [P, Q], kind: 'dots', color: 'pink' },
            { points: [b], kind: 'dots', color: inB ? 'green' : 'orange', radius: 7 }] });
          q('read').innerHTML = `<p>Every point on the band is <b>θx + (1 − θ)y</b>. Slide θ from 0 to 1 to walk along it.</p>
            ${ok('Circle: the dot is inside for every θ, so the circle is convex.')}
            ${inB ? ok('C shape: inside here, but keep sliding…') : bad('C shape: the dot is outside the shape, so the C shape is not convex.')}`;
        } else if (st === 'chord') {
          const pane = (cv, f, x1, x2, ylim) => {
            const x = v * x1 + (1 - v) * x2, fc = f(x), fs = v * f(x1) + (1 - v) * f(x2);
            ChalkPlot.draw(cv, { height: 230, xlim: [-2, 2], ylim, series: [
              { points: curve(f), kind: 'line', color: 'white', width: 2 },
              { points: [[x1, f(x1)], [x2, f(x2)]], kind: 'line', color: 'pink', width: 2 },
              { points: [[x1, f(x1)], [x2, f(x2)]], kind: 'dots', color: 'pink' },
              { points: [[x, fc], [x, fs]], kind: 'line', color: 'faint', dash: [3, 3] },
              { points: [[x, fs]], kind: 'dots', color: 'pink', radius: 6 },
              { points: [[x, fc]], kind: 'dots', color: 'yellow', radius: 6 }] });
            return [fc, fs];
          };
          const [ac, as] = pane(L, bowl, -1.5, 1, [-0.5, 4.5]);
          const [bc, bs] = pane(R, wavy, -1.6, 1.6, [-2.6, 4.5]);
          q('read').innerHTML = `<p><b>f(θx + (1 − θ)y) ≤ θf(x) + (1 − θ)f(y)</b>: yellow dot (curve) must be on or under the pink dot (string).</p>
            ${ok(`Bowl: curve ${fmt(ac, 2)} ≤ string ${fmt(as, 2)} for every θ, so x² is convex.`)}
            ${bc <= bs + 1e-9 ? ok(`Wavy: curve ${fmt(bc, 2)} ≤ string ${fmt(bs, 2)} here, but slide θ towards the middle…`) : bad(`Wavy: curve ${fmt(bc, 2)} > string ${fmt(bs, 2)}: the curve pops above the string, so it is not convex.`)}`;
        } else if (st === 'ruler') {
          const pane = (cv, f, df, ylim) => {
            const fa = f(v), m = df(v), T = (x) => fa + m * (x - v);
            ChalkPlot.draw(cv, { height: 230, xlim: [-2, 2], ylim, series: [
              { points: curve(f), kind: 'line', color: 'white', width: 2 },
              { points: curve(T).filter((p) => p[1] >= ylim[0] && p[1] <= ylim[1]), kind: 'line', color: 'blue', width: 2 },
              { points: [[v, fa]], kind: 'dots', color: 'blue', radius: 6 }] });
            let min = Infinity; for (let i = 0; i <= 200; i++) { const x = -2 + (4 * i) / 200; min = Math.min(min, f(x) - T(x)); }
            return min > -1e-6;
          };
          pane(L, bowl, dBowl, [-0.5, 4.5]);
          const wOk = pane(R, wavy, dWavy, [-2.6, 4.5]);
          q('read').innerHTML = `<p><b>f(y) ≥ f(x) + ∇f(x)(y − x)</b>: the curve must stay on or above the blue ruler (tangent) everywhere.</p>
            ${ok('Bowl: wherever you put the ruler, the curve stays above it, so x² is convex.')}
            ${wOk ? ok('Wavy: above the ruler at this touch point, but try x near 0…') : bad('Wavy: the curve dips below the ruler, so it is not convex.')}`;
        } else {
          const pane = (cv, f, ylim, pts) => ChalkPlot.draw(cv, { height: 230, xlim: [-2, 2], ylim, series: [
            { points: curve(f), kind: 'line', color: 'white', width: 2 },
            { points: pts.map((x) => [x, f(x)]), kind: 'path', color: 'yellow' }] });
          const t = trail || { a: [v], b: [v] };
          pane(L, bowl, [-0.5, 4.5], t.a);
          pane(R, bump, [-4, 6.5], t.b);
          if (!trail || !trail.done) {
            q('read').innerHTML = `<p>Gradient descent from x = ${fmt(v, 2)}: always step downhill. Press <b>Roll the ball</b>.</p>`;
          } else {
            const xa = t.a[t.a.length - 1], xb = t.b[t.b.length - 1];
            q('read').innerHTML = ok(`Bowl: stopped at x = ${fmt(xa, 2)}, the one and only bottom. Any start gives the same answer.`) +
              (xb > 0 ? bad(`Bumpy: stuck at x = ${fmt(xb, 2)}, height ${fmt(bump(xb), 2)}: a fake bottom. The true bottom is −3.51 at x = −1.30.`)
                : ok(`Bumpy: reached x = ${fmt(xb, 2)}, height ${fmt(bump(xb), 2)}: the true bottom, this time. Start at 1.6 to get stuck.`)) +
              '<p class="small">Convex problem ⇒ no fake bottoms: the bottom you find is the true one (slide p. 27).</p>';
          }
        }
      }

      q('tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (b) setStation(b.dataset.st); });
      q('s').addEventListener('input', () => { clearInterval(timer); render(); });
      q('roll').addEventListener('click', () => {
        clearInterval(timer);
        const x0 = Number(q('s').value); const t = { a: [x0], b: [x0] }; let k = 0;
        timer = setInterval(() => {
          const a = t.a[t.a.length - 1], b = t.b[t.b.length - 1];
          t.a.push(a - 0.06 * dBowl(a)); t.b.push(b - 0.02 * dBump(b));
          if (++k >= 70) { clearInterval(timer); t.done = true; }
          render(t);
        }, 40);
      });
      setStation(st);
    }
  });
})();
