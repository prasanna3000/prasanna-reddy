/* StatMath: the distribution functions the hypothesis-testing labs need.
   Normal, Student's t and chi-square: pdf, cdf and inverse cdf (bisection).
   No dependencies. Accuracy is about 1e-10, far better than any printed table. */
(function () {
  'use strict';

  // ln Γ(x), Lanczos approximation
  const LG = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  function lgamma(x) {
    let y = x; const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += LG[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }

  // regularised lower incomplete gamma P(a, x)
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) {
      let ap = a, del = 1 / a, sum = del;
      for (let n = 0; n < 500; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
      return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) {
      const an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }

  // regularised incomplete beta I_x(a, b), continued fraction
  function betacf(a, b, x) {
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
    for (let m = 1; m <= 500; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  function betaInc(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }

  const normPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  function normCdf(x) {
    const e = gammaP(0.5, x * x / 2); // = erf(|x|/√2)
    return x >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e);
  }
  const tPdf = (x, df) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) / Math.sqrt(df * Math.PI) * Math.pow(1 + x * x / df, -(df + 1) / 2);
  function tCdf(x, df) {
    const p = 0.5 * betaInc(df / 2, 0.5, df / (df + x * x)); // tail probability beyond |x|
    return x >= 0 ? 1 - p : p;
  }
  const chi2Pdf = (x, k) => (x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2)));
  const chi2Cdf = (x, k) => (x <= 0 ? 0 : gammaP(k / 2, x / 2));

  // inverse of an increasing cdf on [lo, hi] by bisection
  function invert(cdf, p, lo, hi) {
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (cdf(mid) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  const normInv = (p) => invert(normCdf, p, -40, 40);
  const tInv = (p, df) => invert((x) => tCdf(x, df), p, -1e4, 1e4);
  const chi2Inv = (p, k) => invert((x) => chi2Cdf(x, k), p, 0, 1e4);

  window.StatMath = { lgamma, gammaP, betaInc, normPdf, normCdf, normInv, tPdf, tCdf, tInv, chi2Pdf, chi2Cdf, chi2Inv };
})();
