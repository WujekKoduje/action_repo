import './styles.css';

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

/* ---------- Intro overlay ---------- */
function initIntro() {
  const intro = $('#intro');
  if (!intro) return;

  document.body.style.overflow = 'hidden';
  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    intro.classList.add('intro--hidden');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      intro.hidden = true;
      intro.style.display = 'none';
    }, 650);
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

/* ---------- Hero text entrance ---------- */
function initHeroText() {
  const heroText = $('#heroText');
  if (!heroText) return;
  requestAnimationFrame(() => heroText.classList.add('hero__text--in'));
}

/* ---------- Custom cursor ---------- */
function initCursor() {
  if (prefersReducedMotion) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = $('#cursorDot');
  const glow = $('#cursorGlow');
  if (!dot || !glow) return;

  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim() || '#f3f0ea';

  document.body.style.cursor = 'none';

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const cur = { x: pos.x, y: pos.y };
  const gl = { x: pos.x, y: pos.y };

  window.addEventListener('mousemove', (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    dot.style.opacity = '1';
    glow.style.opacity = '0.35';
    const onImage = e.target instanceof Element && e.target.tagName === 'IMG';
    dot.style.width = dot.style.height = onImage ? '16px' : '10px';
    dot.style.background = onImage ? accent : '#f3f0ea';
    glow.style.width = glow.style.height = onImage ? '110px' : '70px';
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    glow.style.opacity = '0';
  });

  const tick = () => {
    cur.x += (pos.x - cur.x) * 0.35;
    cur.y += (pos.y - cur.y) * 0.35;
    gl.x += (pos.x - gl.x) * 0.15;
    gl.y += (pos.y - gl.y) * 0.15;
    dot.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%)`;
    glow.style.transform = `translate3d(${gl.x}px, ${gl.y}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };
  tick();
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

  // Safety net: reveal anything already scrolled past on load.
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

/* ---------- Scroll-driven effects: nav, parallax, kinetic text ---------- */
function initScrollFx() {
  const nav = $('#nav');
  const navLinks = $$('#navLinks .nav__link');
  const sections = navLinks
    .map((a) => document.getElementById(a.dataset.target))
    .filter(Boolean);
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
      sections.forEach((sec) => {
        if (sec.getBoundingClientRect().top <= vh * 0.4) active = sec.id;
      });
      navLinks.forEach((a) => {
        a.classList.toggle('nav__link--active', a.dataset.target === active);
      });
    }

    if (!prefersReducedMotion) {
      kineticEls.forEach((el) => {
        const dir = parseFloat(el.dataset.kinetic);
        const rect = el.getBoundingClientRect();
        const progress = Math.min(
          1,
          Math.max(0, (vh * 0.85 - rect.top) / (vh * 0.5))
        );
        el.style.opacity = String(progress);
        el.style.transform = `translateX(${(1 - progress) * dir * 160}px)`;
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

/* ---------- Lightbox ---------- */
function initLightbox() {
  const box = $('#lightbox');
  const boxImg = $('#lbImg');
  if (!box || !boxImg) return;

  const gallery = $$(
    '.hero__bg, .auto-shot img, .masonry__item img, .ap__item img'
  );
  if (!gallery.length) return;

  let index = -1;
  let lastFocus = null;
  const bodyOverflow = () => document.body.style.overflow;

  const srcFor = (img) => img.dataset.full || img.currentSrc || img.src;

  const show = (i) => {
    index = (i + gallery.length) % gallery.length;
    const img = gallery[index];
    boxImg.src = srcFor(img);
    boxImg.alt = img.alt || '';
  };

  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.dataset.prevOverflow = bodyOverflow();
    document.body.style.overflow = 'hidden';
    $('#lbClose', box)?.focus();
  };

  const close = () => {
    box.hidden = true;
    document.body.style.overflow = document.body.dataset.prevOverflow || '';
    delete document.body.dataset.prevOverflow;
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
    index = -1;
  };

  const step = (dir) => {
    if (index < 0) return;
    show(index + dir);
  };

  gallery.forEach((img, i) => {
    img.addEventListener('click', () => open(i));
  });

  box.addEventListener('click', close);
  boxImg.addEventListener('click', (e) => e.stopPropagation());
  $('#lbClose', box)?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
  $('#lbPrev', box)?.addEventListener('click', (e) => {
    e.stopPropagation();
    step(-1);
  });
  $('#lbNext', box)?.addEventListener('click', (e) => {
    e.stopPropagation();
    step(1);
  });

  window.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
}

/* ---------- Boot ---------- */
function boot() {
  initIntro();
  initHeroText();
  initCursor();
  initReveal();
  initScrollFx();
  initLightbox();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
