const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};

$('#year').textContent = new Date().getFullYear();

/* Toast */
const toast = $('.toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* Theme */
$('.theme-btn').addEventListener('click', () => {
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('pr-theme', next); } catch (e) { /* ignore */ }
});

/* Mobile nav drawer */
const nav = $('#leftnav');
const scrim = $('.nav-scrim');
const menuBtn = $('.menu-btn');
function setNav(open) {
  nav.classList.toggle('is-open', open);
  scrim.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
}
menuBtn.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
scrim.addEventListener('click', () => setNav(false));
$$('a', nav).forEach((a) => a.addEventListener('click', () => setNav(false)));

/* Votes */
const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));
const votes = store.get('pr-votes', {});
$$('.post').forEach((post) => {
  const box = $('.vote', post);
  const base = Number(post.dataset.score || 0);
  const render = () => {
    const v = votes[post.id] || 0;
    $('.score', box).textContent = fmt(base + v);
    box.classList.toggle('up-on', v === 1);
    box.classList.toggle('down-on', v === -1);
    $('.up', box).setAttribute('aria-pressed', String(v === 1));
    $('.down', box).setAttribute('aria-pressed', String(v === -1));
  };
  const cast = (dir) => {
    votes[post.id] = votes[post.id] === dir ? 0 : dir;
    store.set('pr-votes', votes);
    render();
  };
  $('.up', box).addEventListener('click', () => cast(1));
  $('.down', box).addEventListener('click', () => cast(-1));
  render();
});

/* Save */
const saved = store.get('pr-saved', {});
$$('.save').forEach((btn) => {
  const id = btn.closest('.post').id;
  const render = () => {
    btn.classList.toggle('is-saved', !!saved[id]);
    $('span', btn).textContent = saved[id] ? 'Saved' : 'Save';
  };
  btn.addEventListener('click', () => {
    saved[id] = !saved[id];
    store.set('pr-saved', saved);
    render();
    showToast(saved[id] ? 'Post saved' : 'Post unsaved');
  });
  render();
});

/* Share: copy permalink */
$$('.share').forEach((btn) => btn.addEventListener('click', async () => {
  const url = location.href.split('#')[0] + '#' + btn.closest('.post').id;
  try { await navigator.clipboard.writeText(url); showToast('Link copied'); } catch (e) { location.hash = btn.closest('.post').id; }
}));

/* Collapse comments */
$$('.comment .thread').forEach((t) => t.addEventListener('click', () => {
  const c = t.closest('.comment');
  const collapsed = c.classList.toggle('is-collapsed');
  t.setAttribute('aria-label', collapsed ? 'Expand comment' : 'Collapse comment');
}));

/* Sort, flair filter, search */
const feed = $('#feed');
const posts = $$('.post', feed);
const pinned = posts.filter((p) => p.classList.contains('is-pinned'));
const empty = $('.empty');
const chip = $('.filter-chip');
const search = $('#search');
const state = { sort: 'hot', flair: null, q: '' };
const hotOrder = posts.slice();
const moreRepos = $('.more-repos');

function apply() {
  let list = hotOrder.filter((p) => !pinned.includes(p));
  if (state.sort === 'new') list.sort((a, b) => b.dataset.date.localeCompare(a.dataset.date));
  if (state.sort === 'top') list.sort((a, b) => (Number(b.dataset.score) + (votes[b.id] || 0)) - (Number(a.dataset.score) + (votes[a.id] || 0)));
  [...pinned, ...list].forEach((p) => feed.appendChild(p));

  const q = state.q.trim().toLowerCase();
  let shown = 0;
  posts.forEach((p) => {
    const flairOk = !state.flair || p.dataset.flair === state.flair;
    const textOk = !q || p.textContent.toLowerCase().includes(q);
    const show = flairOk && textOk;
    p.classList.toggle('is-hidden', !show);
    if (show) shown++;
  });
  empty.hidden = shown > 0;

  // Keep the "browse all repositories" card right after the last visible project.
  const lastProject = [...feed.querySelectorAll('.post[data-flair="projects"]:not(.is-hidden)')].pop();
  moreRepos.hidden = !lastProject;
  if (lastProject) lastProject.after(moreRepos);
  chip.hidden = !state.flair;
  if (state.flair) {
    const btn = $(`[data-flair-btn="${state.flair}"]`);
    $('b', chip).textContent = btn ? btn.textContent : state.flair;
  }
}

$$('.sort').forEach((b) => b.addEventListener('click', () => {
  $$('.sort').forEach((x) => x.classList.toggle('is-active', x === b));
  state.sort = b.dataset.sort;
  apply();
}));

function setFlair(flair) {
  state.flair = flair;
  apply();
  $('.sortbar').scrollIntoView({ block: 'start' });
}
$$('[data-flair-btn]').forEach((b) => b.addEventListener('click', () => setFlair(b.dataset.flairBtn)));
$('button', chip).addEventListener('click', () => { state.flair = null; apply(); });

search.addEventListener('input', () => { state.q = search.value; apply(); });
search.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const first = posts.find((p) => !p.classList.contains('is-hidden')); if (first) first.scrollIntoView({ block: 'start' }); }
  if (e.key === 'Escape') { search.value = ''; state.q = ''; apply(); }
});

/* Clear filters when jumping to a hidden post via nav links */
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  // Links like "Projects" or "r/DevSecOps" filter the feed by flair instead of jumping.
  if (a.dataset.flairLink) {
    e.preventDefault();
    state.q = ''; search.value = '';
    setFlair(a.dataset.flairLink);
    return;
  }
  const target = document.getElementById(a.getAttribute('href').slice(1));
  const post = target && target.closest('.post');
  if (post && post.classList.contains('is-hidden')) { state.flair = null; state.q = ''; search.value = ''; apply(); }
}));

apply();

/* Highlight current section in the left nav */
const navLinks = $$('.leftnav .nav-item[href^="#"]:not([data-flair-link])');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + id || (id === 'post-intro' && l.getAttribute('href') === '#top') || (id === 'post-beyond' && l.getAttribute('href') === '#post-gym') || (id === 'post-moon' && l.getAttribute('href') === '#post-gym')));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
posts.forEach((p) => spy.observe(p));
