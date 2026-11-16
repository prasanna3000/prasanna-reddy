# The Classroom: rules for editing

## It must open straight from disk (no server)

The owner opens `index.html` directly in the browser (a `file://` URL). Browsers block `fetch()` there,
so lessons are loaded from a generated bundle instead. Keep all three pieces of this setup:

1. `index.html` loads `<script src="content/content-bundle.js"></script>` **before** `js/app.js`.
2. `getJSON()` in `js/app.js` reads `window.CLASSROOM_CONTENT[url]` on `file:`, and on http(s)
   fetches the live `.json` first, falling back to the bundle.
3. After adding or editing anything in `content/`, run `python3 build-content.py` to regenerate
   `content/content-bundle.js`. Never edit the bundle by hand.

Do **not** tell the owner to run a local server (`python3 -m http.server`), and do not remove the
bundle script tag or the bundle fallback. Content is authored as `.json`. Do not create `.js`
copies of content files (e.g. `content/catalog.js`).

When you add a new widget file, add its `<script>` line in `index.html` above the bundle and
`app.js` lines, without touching those two.
