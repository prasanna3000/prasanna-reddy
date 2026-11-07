/* Widget registry.
   A widget is an interactive "lab" that content files can drop in by name:
     { "type": "widget", "widget": "lr-bowl", "config": { ... } }
   To add one: create js/widgets/<name>.js that calls Widgets.register(...),
   then add a <script> tag for it in index.html. */
(function () {
  'use strict';
  const registry = {};

  window.Widgets = {
    register(name, def) {
      if (!def || typeof def.mount !== 'function') throw new Error('Widget ' + name + ' needs a mount(el, config) function');
      registry[name] = def;
    },
    has(name) { return !!registry[name]; },
    list() { return Object.keys(registry); },
    mount(name, el, config) {
      const def = registry[name];
      if (!def) {
        el.innerHTML = `<div class="widget-missing">Lab "<code>${CU.esc(name)}</code>" isn't installed yet. Add <code>js/widgets/${CU.esc(name)}.js</code> and a script tag in index.html.</div>`;
        return;
      }
      try { def.mount(el, config || {}); }
      catch (err) {
        console.error(err);
        el.innerHTML = `<div class="widget-missing">This lab hit an error: ${CU.esc(err.message)}</div>`;
      }
    }
  };
})();
