/* Small shared helpers. Everything hangs off window.CU ("classroom utils"). */
(function () {
  'use strict';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  /* Tiny inline markup for content files:
       **bold**   *italic*   `code`   [text](url)   ==highlight==   new lines -> <br>
       | a | b | lines -> a real table    "- " / "1. " lines -> a list
     (a * glued to a letter is left alone: formulas use w*, J* and p*q*) */
  function md(s) {
    let t = esc(s);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    /* *italic* only when the first * follows a space or bracket, so p*, w* and p*q* stay as they are */
    t = t.replace(/(^|[\s(])\*(?=\S)([^*\n]*?\S)\*(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
    t = t.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = mathMarkup(t);
    /* a block of lines that start and end with | becomes a table (first row = heading, a line of only --- is ignored) */
    t = t.replace(/(?:^|\n)((?:\|[^\n]*\|[ ]*(?:\n|$))+)/g, (m, blk) => {
      const rows = blk.trim().split('\n').filter((r) => !/^\|[\s|:-]+\|$/.test(r.trim())).map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      const cell = (tag, c) => `<${tag}>${c}</${tag}>`;
      const head = rows[0].map((c) => cell('th', c)).join('');
      const isTotal = (r) => /^(<strong>)?\s*(total|sum|Σ)/i.test(r[0] || '');
      const body = rows.slice(1).map((r) => `<tr${isTotal(r) ? ' class="total"' : ''}>${r.map((c) => cell('td', c)).join('')}</tr>`).join('');
      return `<div class="md-table-wrap"><table class="md-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    });
    /* runs of lines starting "- " become a bullet list; "1. ", "2. " a numbered list */
    t = t.replace(/(?:^|\n)((?:- [^\n]*(?:\n|$))+)/g, (m, blk) =>
      `<ul class="md-list">${blk.trim().split('\n').map((l) => `<li>${l.replace(/^- /, '')}</li>`).join('')}</ul>`);
    t = t.replace(/(?:^|\n)((?:\d+\. [^\n]*(?:\n|$))+)/g, (m, blk) => {
      const lines = blk.trim().split('\n');
      return `<ol class="md-list" start="${parseInt(lines[0], 10)}">${lines.map((l) => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('')}</ol>`;
    });
    t = t.replace(/\n/g, '<br>');
    return t;
  }

  /* Readable maths for content files (written after esc, so it only sees plain text):
       {{ top // bottom }}      stacked fraction with a bar
       {{sqrt: expression}}     square root with a bar over the expression
       x_{t+1}   x^{2}          subscript / superscript
     Fractions and roots can be nested. Everything else is left alone. */
  function mathMarkup(t) {
    t = t.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>').replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>');
    /* calculator-style powers: e^(−μ) and e^(−(x − μ)²) -> superscript of the bracket; p^x, W^Q, e^2.6 -> superscript of the token */
    t = t.replace(/\^\(((?:[^()]|\([^()]*\))*)\)/g, '<sup>$1</sup>');
    t = t.replace(/\^([A-Za-z0-9Ͱ-Ͽ̀-ͯᴀ-ᶿ⁰-₟′]+(?:\.\d+)?)/g, '<sup>$1</sup>');
    let prev;
    do {
      prev = t;
      t = t.replace(/\{\{([^{}]*)\}\}/g, (m, inner) => {
        const s = inner.trim();
        if (s.startsWith('sqrt:')) return `<span class="rad"><span class="rsym">\u221a</span><span class="rbody">${s.slice(5).trim()}</span></span>`;
        const i = s.indexOf(' // ');
        if (i < 0) return m;
        return `<span class="fr"><span class="fn">${s.slice(0, i).trim()}</span><span class="fd">${s.slice(i + 4).trim()}</span></span>`;
      });
    } while (t !== prev);
    return t;
  }

  /* Number formatting: up to `dp` decimals, trailing zeros stripped, no "-0". */
  function fmt(v, dp = 4) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞';
    if (Math.abs(v) < 1e-12) v = 0; // hide floating-point dust like -2.2e-16
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

  /* "1 2; 3 4" or "1, 2\n3, 4" -> [[1,2],[3,4]]; returns {error} on bad input */
  function parseMatrix(str, name = 'Matrix') {
    const rows = String(str ?? '').trim().split(/[;\n]+/).map((r) => r.trim()).filter(Boolean);
    if (!rows.length) return { error: `${name} is empty.` };
    const m = rows.map(parseNums);
    if (m.some((r) => r === null)) return { error: `${name}: every entry must be a number.` };
    if (m.some((r) => r.length !== m[0].length)) return { error: `${name}: every row needs the same number of values.` };
    return { m };
  }

  const sigmoid = (z) => 1 / (1 + Math.exp(-z));
  function softmax(z) {
    const mx = Math.max(...z); const e = z.map((v) => Math.exp(v - mx)); const s = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / s);
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

  window.CU = { esc, md, fmt, parseNums, parseMatrix, sigmoid, softmax, store, shuffle, matrix };
})();
