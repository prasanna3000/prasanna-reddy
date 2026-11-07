# The Classroom

An interactive, classroom-themed study site for my courses. Each chapter has:

| Tab | What it is |
| --- | --- |
| **Chalkboard** | The lesson, one board at a time (← → keys work) |
| **Worked problems** | Notebook pages where you reveal one step at a time |
| **Lab bench** | Interactive labs (e.g. step-by-step gradient descent) |
| **Flashcards** | Flip cards; mark "Got it" or "Still learning" |
| **Pop quiz** | Multiple-choice and numeric questions, graded with explanations |
| **Cheat sheet** | A printable formula sheet |

Your progress (stars, seen boards, known cards, best quiz score) is saved in your browser's `localStorage`.

It is a plain static site: HTML, CSS and JavaScript with no build step and no dependencies. Content lives in `.js` files that hold plain JSON wrapped in `ClassroomContent( ... );`, so the site works when `index.html` is opened straight from disk, with no server.

---

## Run it locally

Just open `index.html` in a browser. No server needed.

---

## Folder layout

```
index.html                 the shell (header, footer, script tags)
css/style.css              the whole classroom theme
js/core/util.js            helpers (escaping, number formatting, storage)
js/core/widgets.js         the lab/widget registry
js/core/chalkplot.js       tiny chalk-style canvas plotter
js/widgets/*.js            one file per interactive lab
js/app.js                  router + every view (corridor, room, chapter tabs)
content/catalog.js         semesters → courses → chapters (the table of contents)
content/<sem>/<course>/*.js     one file per chapter
content/_templates/chapter-template.js     copy this to start a new chapter
```

---

## Add content

### A new chapter

1. Copy `content/_templates/chapter-template.js` to e.g. `content/sem1/aiml-zg511/ch04-classification.js` and fill it in. Keep the `ClassroomContent(` ... `);` wrapper; everything inside is ordinary JSON. Leave out any section you don't need (for example no `labs`) and its tab disappears.
2. In `content/catalog.js`, point the chapter at the file and remove `"comingSoon"`:

```json
{ "id": "ch04", "number": 4, "title": "Linear Neural Networks for Classification",
  "blurb": "One neuron that answers \"which one\".",
  "file": "content/sem1/aiml-zg511/ch04-classification.js" }
```

### A new course

Add an object to a semester's `courses` array:

```json
{ "id": "aiml-zg512", "code": "AIML ZG512", "title": "Machine Learning",
  "room": "Room 512", "color": "#3b6fb5", "teacher": "optional",
  "description": "optional, supports **bold**",
  "chapters": [ { "id": "ch01", "number": 1, "title": "Intro", "comingSoon": true } ] }
```

`color` is the colour of the classroom door. Keep `id`s URL-safe (lowercase, dashes).

### A new semester

Add an object to `semesters`:

```json
{ "id": "sem2", "title": "Semester 2", "subtitle": "M.Tech AIML · 2027", "courses": [] }
```

### Content blocks (lesson boards and worked-problem statements)

| `type` | Fields |
| --- | --- |
| `p` | `text` |
| `h` | `text` (small chalk heading) |
| `list` / `steps` | `items` (bullets / numbered) |
| `formula` | `text`, optional `caption` |
| `note` | `text`, optional `label`, optional `color`: `pink` or `blue` (sticky note) |
| `trap` | `text`, optional `label` (exam-trap box) |
| `table` | `head` (array), `rows` (array of arrays) |
| `widget` | `widget` (name), `config` (object): embeds a lab inside a board |

Inline text supports `**bold**`, `` `code` ``, `==highlight==` and `[link](https://…)`. Write maths in Unicode (ŷ, wᵀx, Σ, η, ∇, ², ₁). A single `*` is left alone, so `w*` is safe.

Quiz questions: `mcq` (`options`, `answer` = index of the right option) or `numeric` (`answer`, `tolerance`, optional `unit`). Both take `explain`.

### Labs available

| Name | Config |
| --- | --- |
| `gd-linear` | `data` ("x1, …, xd, y" per line), `eta`, `w0` ("bias, w1, …"), `lossScale` (`"half"` default, or `"mean"`) |
| `lr-bowl` | `c`, `wstar`, `w0`, `eta`, `steps` |
| `metrics-calc` | `y`, `yhat` (comma-separated) |
| `feature-scaling` | `columns`: `[{ "name", "values" }]` |

### A new lab

Create `js/widgets/my-lab.js`:

```js
Widgets.register('my-lab', {
  mount(el, config) {
    el.innerHTML = '<div class="lab"><div class="paper lab-controls">…</div><div class="board">…</div></div>';
    // wire up events; ChalkPlot.draw(canvas, { series: [...] }) draws chalk charts
  }
});
```

Then add `<script src="js/widgets/my-lab.js"></script>` to `index.html` above `js/app.js`, and use `"widget": "my-lab"` in any chapter.

---

## Publish on GitHub Pages with your own domain

1. Create a GitHub repository and push this folder:
   ```bash
   git init
   git add .
   git commit -m "The Classroom: first chapter"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then pick `main` and `/ (root)`. The `.nojekyll` file is already included, so files are served as they are.
3. Custom domain: in the same Pages screen, enter your domain (e.g. `learn.example.com`). GitHub commits a `CNAME` file for you. At your DNS provider:
   - for a subdomain, add a `CNAME` record pointing `learn` to `<you>.github.io`;
   - for an apex domain (`example.com`), add `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`.
4. Tick **Enforce HTTPS** once the certificate is issued.

Netlify, Cloudflare Pages or Vercel work too: deploy the folder as a static site with no build command.

Routes use `#/…` hashes, so deep links work on any static host with no server rewrite rules.

---

## A note on course material

The lesson text here is written in my own words from my course material. Don't commit the textbook PDFs, slide decks or lecture recordings to a public repository.
