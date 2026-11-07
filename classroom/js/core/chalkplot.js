/* ChalkPlot: a tiny canvas plotter styled like chalk on a board.
   ChalkPlot.draw(canvas, {
     series: [{ points: [[x,y],...], kind: 'dots'|'line'|'path', color, width, dash, label }],
     xlim: [min,max], ylim: [min,max],   // optional, auto otherwise
     xlabel, ylabel, height              // height in CSS px (default 260)
   })
*/
(function () {
  'use strict';

  const CHALK = {
    white: '#f4f1e8', yellow: '#f3e38a', pink: '#f5a8b8', blue: '#a9d4f5', green: '#b6e3a8', orange: '#f7c08a',
    faint: 'rgba(244,241,232,0.16)', axis: 'rgba(244,241,232,0.7)'
  };

  function niceStep(range, target) {
    const raw = range / Math.max(1, target);
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / pow;
    const m = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
    return m * pow;
  }

  function extent(series, idx) {
    let lo = Infinity, hi = -Infinity;
    series.forEach((s) => (s.points || []).forEach((p) => {
      const v = p[idx];
      if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }));
    if (!Number.isFinite(lo)) return [0, 1];
    if (lo === hi) { lo -= 1; hi += 1; }
    const padv = (hi - lo) * 0.08;
    return [lo - padv, hi + padv];
  }

  function tickLabel(v, step) {
    const dp = Math.max(0, -Math.floor(Math.log10(step)));
    return CU.fmt(Number(v.toFixed(Math.min(dp, 6))), Math.min(dp, 6));
  }

  function draw(canvas, opts) {
    const series = opts.series || [];
    const cssW = canvas.clientWidth || canvas.parentElement.clientWidth || 400;
    const cssH = opts.height || 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const pad = { l: 52, r: 14, t: 14, b: 40 };
    const W = cssW - pad.l - pad.r, H = cssH - pad.t - pad.b;
    const [x0, x1] = opts.xlim || extent(series, 0);
    const [y0, y1] = opts.ylim || extent(series, 1);
    const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * W;
    const Y = (y) => pad.t + H - ((y - y0) / (y1 - y0)) * H;

    ctx.font = '13px "Patrick Hand", "Comic Sans MS", cursive';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // grid + ticks
    const xs = niceStep(x1 - x0, Math.max(3, Math.floor(W / 70)));
    const ys = niceStep(y1 - y0, Math.max(3, Math.floor(H / 45)));
    ctx.strokeStyle = CHALK.faint; ctx.lineWidth = 1; ctx.fillStyle = CHALK.axis;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let v = Math.ceil(x0 / xs) * xs; v <= x1 + 1e-9; v += xs) {
      ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), pad.t + H); ctx.stroke();
      ctx.fillText(tickLabel(v, xs), X(v), pad.t + H + 6);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = Math.ceil(y0 / ys) * ys; v <= y1 + 1e-9; v += ys) {
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + W, Y(v)); ctx.stroke();
      ctx.fillText(tickLabel(v, ys), pad.l - 6, Y(v));
    }
    // axes
    ctx.strokeStyle = CHALK.axis; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + H); ctx.lineTo(pad.l + W, pad.t + H); ctx.stroke();
    // labels
    ctx.fillStyle = CHALK.white; ctx.font = '15px "Patrick Hand", cursive';
    if (opts.xlabel) { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(opts.xlabel, pad.l + W / 2, cssH - 2); }
    if (opts.ylabel) {
      ctx.save(); ctx.translate(13, pad.t + H / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(opts.ylabel, 0, 0); ctx.restore();
    }

    // clip to plot area
    ctx.save();
    ctx.beginPath(); ctx.rect(pad.l, pad.t, W, H); ctx.clip();
    series.forEach((s) => {
      const pts = (s.points || []).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
      const color = CHALK[s.color] || s.color || CHALK.white;
      ctx.strokeStyle = color; ctx.fillStyle = color;
      ctx.lineWidth = s.width || 2.4;
      ctx.setLineDash(s.dash || []);
      if (s.kind === 'dots' || s.kind === 'path') {
        if (s.kind === 'path' && pts.length > 1) {
          ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.stroke();
        }
        pts.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(X(p[0]), Y(p[1]), s.radius || (s.kind === 'path' && i === pts.length - 1 ? 6 : 4.5), 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (pts.length > 1) {
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.stroke();
      }
      ctx.setLineDash([]);
    });
    ctx.restore();

    // legend
    const labelled = series.filter((s) => s.label);
    if (labelled.length) {
      ctx.font = '14px "Patrick Hand", cursive'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      let lx = pad.l + 10; const ly = pad.t + 12;
      labelled.forEach((s) => {
        const color = CHALK[s.color] || s.color || CHALK.white;
        ctx.fillStyle = color; ctx.fillRect(lx, ly - 2, 14, 4);
        ctx.fillStyle = CHALK.white; ctx.fillText(s.label, lx + 19, ly);
        lx += 30 + ctx.measureText(s.label).width;
      });
    }
  }

  window.ChalkPlot = { draw, CHALK };
})();
