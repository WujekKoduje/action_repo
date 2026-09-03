/* Custom cursor — a soft accent glow + a small dot that lerp toward the
   pointer, both growing when hovering an image. Fine-pointer devices only. */

export function initCursor() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.getElementById('cursorDot');
  const glow = document.getElementById('cursorGlow');
  if (!dot || !glow) return;

  const accent =
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ||
    '#f3f0ea';

  document.body.style.cursor = 'none';

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const cur = { ...pos };
  const gl = { ...pos };

  addEventListener('mousemove', (e) => {
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
