import './styles.css';
import { SECTIONS } from './gallery-data.js';
import { initCursor } from './cursor.js';
import { initMenu } from './menu.js';
import { initLightbox } from './lightbox.js';

/* ============================================================
   Wujek Baca portfolio — behaviour
   Ported from the Claude Design prototype (support.js / DCLogic).
   ============================================================ */

const PARALLAX_INTENSITY = 0.4;
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// A real in-page section fragment, e.g. "#products" (not "#" or "#!x").
const sectionHash = () => /^#[A-Za-z][\w-]*$/.test(location.hash) && location.hash;

/* ---------- Intro overlay ---------- */
function initIntro() {
  const intro = $('#intro');
  if (!intro) return;

  // Arriving with a section hash (e.g. back from the gallery) skips the intro.
  if (sectionHash()) {
    intro.remove();
    return;
  }

  document.body.style.overflow = 'hidden';
  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    intro.classList.add('intro--hidden');
    document.body.style.overflow = '';
    window.setTimeout(() => intro.remove(), 650);
    window.removeEventListener('wheel', dismiss);
    window.removeEventListener('touchstart', dismiss);
    window.removeEventListener('keydown', dismiss);
    window.removeEventListener('click', dismiss);
  };

  window.addEventListener('wheel', dismiss, { passive: true });
  window.addEventListener('touchstart', dismiss, { passive: true });
  window.addEventListener('keydown', dismiss);
  window.addEventListener('click', dismiss);
}

/* ---------- Hash scroll on load (nav-height aware) ---------- */
function initHashScroll() {
  const hash = sectionHash();
  if (!hash) return;
  const doScroll = () => {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    const nav = $('#nav');
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    const y = target.getBoundingClientRect().top + window.scrollY - navH - 16;
    // `instant` — the retry cascade must not fight the global smooth scroll-behavior.
    window.scrollTo({ top: Math.max(y, 0), behavior: 'instant' });
  };
  requestAnimationFrame(doScroll);
  [50, 200, 500, 1000].forEach((ms) => setTimeout(doScroll, ms));
  window.addEventListener('load', doScroll, { once: true });
}

/* ---------- Hero text entrance ---------- */
function initHeroText() {
  const heroText = $('#heroText');
  if (!heroText) return;
  requestAnimationFrame(() => heroText.classList.add('hero__text--in'));
}

/* ---------- Brand name → smooth scroll to top ---------- */
function initScrollTop() {
  $$('[data-scrolltop]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  );
}

/* ---------- "See all" card counts (kept in sync with the data) ---------- */
function initSeeAllCounts() {
  $$('[data-count-for]').forEach((el) => {
    const key = el.dataset.countFor;
    const n = SECTIONS[key]?.items.length;
    if (n) el.textContent = `${n} PHOTOS`;
  });
}

/* ---------- Automotive: randomized hero + preview ---------- */
function initAutomotive() {
  const heroImg = $('#autoHeroImg');
  const heroExif = $('#autoHeroExif');
  const grid = $('#autoGrid');
  if (!heroImg || !grid) return;

  // The prototype's random pool is every automotive shot except index 4.
  const pool = SECTIONS.automotive.items.filter((_, i) => i !== 4);
  if (pool.length < 5) return;

  const heroIdx = Math.floor(Math.random() * pool.length);
  const hero = pool[heroIdx];
  const rest = pool.filter((_, i) => i !== heroIdx).slice(0, 4);

  heroImg.src = hero.src;
  heroImg.dataset.full = hero.full;
  heroImg.alt = hero.alt;
  if (heroExif && hero.camera) {
    heroExif.innerHTML = `${hero.camera}<br>${hero.settings || ''}`;
  }

  $$('.masonry__item img', grid).forEach((img, i) => {
    const item = rest[i];
    if (!item) return;
    img.src = item.src;
    img.dataset.full = item.full;
    img.alt = item.alt;
    const cap = img.parentElement.querySelector('.cap');
    if (cap) cap.textContent = item.camera || '';
  });
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = $$('[data-reveal]');
  if (!els.length) return;

  const reveal = (el) => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  };

  if (prefersReducedMotion) {
    els.forEach(reveal);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: '300px 0px 300px 0px' }
  );
  els.forEach((el) => io.observe(el));

  const forcePassed = () => {
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        reveal(el);
        io.unobserve(el);
      }
    });
  };
  window.addEventListener('scroll', forcePassed, { passive: true });
  forcePassed();
}

/* ---------- Stats count-up ---------- */
function initStats() {
  const els = $$('.stat__num[data-count]');
  if (!els.length) return;

  // Reset to 0 up front (HTML ships the final value for the no-JS case) so the
  // numbers don't visibly snap back when they scroll into view.
  if (!prefersReducedMotion) els.forEach((el) => (el.textContent = '0+'));

  const run = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (prefersReducedMotion) {
      el.textContent = `${target}+`;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${Math.round(eased * target)}+`;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = `${target}+`;
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Scroll-driven effects: nav, active link, kinetic, parallax ---------- */
function initScrollFx() {
  const nav = $('#nav');
  const navLinks = $$('#navLinks .nav__link');
  const parallaxEls = $$('[data-parallax]');
  const kineticEls = $$('[data-kinetic]');

  if (prefersReducedMotion) {
    kineticEls.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    if (nav) nav.classList.toggle('nav--scrolled', window.scrollY > 60);

    if (navLinks.length) {
      let active = null;
      navLinks.forEach((a) => {
        const sec = document.getElementById(a.dataset.target);
        if (sec && sec.getBoundingClientRect().top <= vh * 0.4) active = a.dataset.target;
      });
      navLinks.forEach((a) =>
        a.classList.toggle('nav__link--active', a.dataset.target === active)
      );
    }

    if (!prefersReducedMotion) {
      kineticEls.forEach((el) => {
        if (el.dataset.kineticDone) return;
        const dir = parseFloat(el.dataset.kinetic);
        const rect = el.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / (vh * 0.5)));
        el.style.opacity = String(progress);
        el.style.transform = `translateX(${(1 - progress) * dir * 160}px)`;
        if (progress >= 1) el.dataset.kineticDone = '1';
      });

      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) * PARALLAX_INTENSITY;
        const rect = el.getBoundingClientRect();
        let offset = (rect.top - vh / 2) * speed;
        offset = Math.max(-80, Math.min(80, offset));
        const rest = el.style.transform.replace(/translateY\([^)]*\)/, '').trim();
        el.style.transform = `translateY(${-offset}px) ${rest}`.trim();
      });
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

/* ---------- Boot ---------- */
function boot() {
  initIntro();
  initHashScroll();
  initHeroText();
  initScrollTop();
  initSeeAllCounts();
  initAutomotive();
  initCursor();
  initMenu();
  initReveal();
  initStats();
  initScrollFx();
  initLightbox({
    getGroup: (img) => $$('img', img.closest('[data-lightbox]') || document),
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
