import './styles.css';
import { SECTIONS, SECTION_ORDER } from './gallery-data.js';
import { initCursor } from './cursor.js';
import { initMenu } from './menu.js';
import { initLightbox } from './lightbox.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const grid = $('#galleryGrid');
const titleEl = $('#galleryTitle');
const countEl = $('#galleryCount');
const backTop = $('#backTop');
const backBottom = $('#backBottom');
const navLinks = $$('#navLinks .nav__link');

function sectionFromUrl() {
  const key = new URLSearchParams(location.search).get('section');
  return SECTIONS[key] ? key : SECTION_ORDER[0];
}

function buildItem(item) {
  const fig = document.createElement('figure');
  fig.className = 'g-item';

  const img = document.createElement('img');
  img.src = item.src;
  if (item.full) img.dataset.full = item.full;
  img.alt = item.alt || '';
  if (item.w) img.width = item.w;
  if (item.h) img.height = item.h;
  img.loading = 'lazy';
  img.decoding = 'async';
  fig.appendChild(img);

  if (item.chip) {
    const chip = document.createElement('figcaption');
    chip.className = 'g-chip';
    chip.textContent = item.chip;
    fig.appendChild(chip);
  } else if (item.caption) {
    const cap = document.createElement('figcaption');
    cap.className = 'cap';
    cap.textContent = item.caption;
    fig.appendChild(cap);
  }
  return fig;
}

function render(key) {
  const section = SECTIONS[key];
  document.title = `${section.title} — Łukasz Matysiak Photography`;
  titleEl.textContent = section.title;
  countEl.textContent = `${section.items.length} PHOTOS`;

  grid.replaceChildren(...section.items.map(buildItem));

  const back = `index.html#${key}`;
  if (backTop) backTop.href = back;
  if (backBottom) backBottom.href = back;

  navLinks.forEach((a) =>
    a.classList.toggle('nav__link--active', a.dataset.target === key)
  );
}

function go(key, { push = true } = {}) {
  if (push) history.replaceState(null, '', `gallery.html?section=${key}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
  render(key);
}

// Intercept in-page section links (nav + drawer) for instant switching;
// they keep working as plain links if this script fails to load.
$$('a[href*="gallery.html?section="]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const key = new URL(a.href).searchParams.get('section');
    if (!SECTIONS[key]) return;
    e.preventDefault();
    go(key);
  });
});

window.addEventListener('popstate', () => go(sectionFromUrl(), { push: false }));

initCursor();
initMenu();
initLightbox({ getGroup: () => $$('#galleryGrid img') });

render(sectionFromUrl());
