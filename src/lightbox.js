/* Fullscreen image lightbox with prev / next / esc, shared by both pages.

   `getGroup(clickedImg)` returns the ordered list of <img> the arrows should
   cycle through for that click (e.g. just the current section, or the grid). */

export function initLightbox({ root = document, getGroup }) {
  const box = document.getElementById('lightbox');
  const boxImg = document.getElementById('lbImg');
  if (!box || !boxImg) return;

  let group = [];
  let index = -1;
  let lastFocus = null;

  const hiRes = (img) => img.dataset.full || img.currentSrc || img.src;

  const render = () => {
    const img = group[index];
    if (!img) return;
    boxImg.src = hiRes(img);
    boxImg.alt = img.alt || '';
  };

  const open = (img) => {
    group = getGroup(img).filter(Boolean);
    index = group.indexOf(img);
    if (index < 0) return;
    lastFocus = document.activeElement;
    render();
    box.hidden = false;
    document.body.dataset.prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose')?.focus();
  };

  const close = () => {
    box.hidden = true;
    document.body.style.overflow = document.body.dataset.prevOverflow || '';
    delete document.body.dataset.prevOverflow;
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
    index = -1;
  };

  const step = (dir) => {
    if (index < 0 || !group.length) return;
    index = (index + dir + group.length) % group.length;
    render();
  };

  root.addEventListener('click', (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.closest('[data-lightbox]')) open(img);
  });

  box.addEventListener('click', close);
  boxImg.addEventListener('click', (e) => e.stopPropagation());
  document.getElementById('lbClose')?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
  document.getElementById('lbPrev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    step(-1);
  });
  document.getElementById('lbNext')?.addEventListener('click', (e) => {
    e.stopPropagation();
    step(1);
  });
  addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
}
