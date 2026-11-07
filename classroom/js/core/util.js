/* Small shared helpers. Everything hangs off window.CU ("classroom utils"). */
(function () {
  'use strict';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  /* Tiny inline markup for content files:
       **bold**   `code`   [text](url)   ==highlight==   new lines -> <br>
     (single * is left alone on purpose: formulas use w* and J*) */
  function md(s) {
    let t = esc(s);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\n/g, '<br>');
    return t;
  }

  /* Number formatting: up to `dp` decimals, trailing zeros stripped, no "-0". */
  function fmt(v, dp = 4) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞';
    const a = Math.abs(v);
    if (a !== 0 && (a >= 1e7 || a < 1e-4)) return v.toExponential(2).replace('-', '−');
    let s = v.toFixed(dp);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s.replace('-', '−');
  }

  /* "1, 2, 3" or "1 2 3" -> [1,2,3]; returns null if anything is not a number */
  function parseNums(str) {
    const parts = String(str ?? '').trim().split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return [];
    const out = parts.map(Number);
    return out.every(Number.isFinite) ? out : null;
  }

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage blocked: ignore */ }
    },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Render a matrix / column vector as an HTML grid with brackets. */
  function matrix(rows, opts = {}) {
    const dp = opts.dp ?? 4;
    const body = rows.map((r) => '<tr>' + (Array.isArray(r) ? r : [r])
      .map((v) => `<td>${typeof v === 'number' ? fmt(v, dp) : esc(v)}</td>`).join('') + '</tr>').join('');
    return `<span class="mat"><table>${body}</table></span>`;
  }

  window.CU = { esc, md, fmt, parseNums, store, shuffle, matrix };
})();
