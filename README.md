# prasanna-reddy

Personal website of Prasanna Reddy, live at **[prasannareddy.com](https://prasannareddy.com)**.

The site is styled like a Reddit community (r/PrasannaReddy): career, projects, writing and life posts
in a feed, plus **The Classroom**, an interactive study site for my M.Tech AIML courses.

Plain HTML, CSS and JavaScript. No build step, no framework, no server. Every page also works
opened straight from disk (double-click `index.html`).

## What's here

| Path | What it is |
|---|---|
| `index.html` | The homepage: a Reddit-style feed (intro, career megathread, one post per project, AMA, education, Substack posts, gym, contact) |
| `reddit.css` | All homepage styles, including light/dark theme and the phone/tablet layouts |
| `script.js` | Homepage behaviour: Hot/New/Top sort, flair filter, search, votes, save, share, dark mode, mobile menu |
| `assets/` | Images: `profile.jpeg` (avatar), `1.jpeg`, `2.jpeg`, `3.jpeg` |
| `classroom/` | The Classroom. See [classroom/README.md](classroom/README.md) |
| `CNAME` | Custom domain for GitHub Pages (`prasannareddy.com`) |

The other `.css` files in the root (`styles.css`, `comic.css`, `history.css`, `neural.css`,
`particles.css`, `personal.css`, `project-visuals.css`, `refresh.css`) are from the earlier design.
Nothing loads them, so they can be deleted.

## Edit the homepage

- **Add a post:** copy an `<article class="card post">` block in `index.html`. Set `data-flair`
  (used by the flair filter), `data-date` (YYYY-MM-DD, for "New") and `data-score` (for "Top").
- **Add a project:** copy one of the project link posts and change the title, description, tags and GitHub link.
  Update the project count in the sidebar ("About community") too.
- **Profile picture:** replace `assets/profile.jpeg`.

Votes, saved posts and the theme choice are kept in the visitor's browser (`localStorage`) only.

## Edit The Classroom

Lessons are `.json` files in `classroom/content/`. After adding or editing one, rebuild the bundle so
the page can load it without a server:

```bash
cd classroom
python3 build-content.py
```

Full authoring guide: [classroom/README.md](classroom/README.md).

## Preview locally

Open `index.html` in a browser. No server needed.

Check phone layouts with your browser's device toolbar (Chrome: F12, then Ctrl+Shift+M). The site
has been checked from 360px phones to 1440px desktops.

## Publish

The site is served by **GitHub Pages** from the `master` branch of
[prasanna3000/prasanna-reddy](https://github.com/prasanna3000/prasanna-reddy), root folder.
Pushing to `master` updates the live site within a minute or two:

```bash
git add -A
git commit -m "Describe the change"
git push
```

The custom domain is set by the `CNAME` file and in **Settings → Pages**. DNS is managed at GoDaddy:

- `www`: a `CNAME` record pointing to `prasanna3000.github.io`
- the root domain: GitHub's `A` records, as listed on the Pages settings page

GitHub Pages turns on HTTPS automatically once DNS is set up.
