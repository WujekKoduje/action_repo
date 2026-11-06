/* iPhone Safari: after the page is opened by typing its URL, the first tap on a
   link was seen to produce no click (the page still receives the touch events).
   Whatever the browser-side cause, if a clear tap on something clickable ends
   and no click follows, deliver the click ourselves.

   Guards against double activation: a click the browser delivers late (after
   ours) is swallowed, and nothing fires when the real click arrived in time —
   which is every normal tap. */

const TAP_MAX_MS = 500; // longer is a press, not a tap
const TAP_MAX_MOVE = 12; // px; more is a scroll/swipe
const CLICK_WAIT_MS = 300; // a real click follows touchend almost immediately
const GUARD_MS = 800; // swallow a late real click this long after ours
const CLICKABLE = 'a[href], button, [data-lightbox] img';

export function initTapFallback(enabled = /iPhone|iPod/.test(navigator.userAgent)) {
  if (!enabled) return;

  const passive = { capture: true, passive: true };
  let touch = null;
  let lastClickAt = -Infinity;
  let delivered = null; // { el, at } — the click we sent last

  addEventListener('touchstart', (e) => {
    const p = e.touches[0];
    touch = e.touches.length === 1
      ? { at: performance.now(), x: p.clientX, y: p.clientY, moved: 0, target: e.target }
      : null;
  }, passive);

  addEventListener('touchmove', (e) => {
    if (!touch) return;
    const p = e.touches[0];
    touch.moved = Math.max(touch.moved, Math.hypot(p.clientX - touch.x, p.clientY - touch.y));
  }, passive);

  addEventListener('touchcancel', () => { touch = null; }, passive);

  addEventListener('touchend', (e) => {
    const t = touch;
    touch = null;
    if (!t || e.defaultPrevented) return;
    if (performance.now() - t.at > TAP_MAX_MS || t.moved > TAP_MAX_MOVE) return;
    const el = t.target instanceof Element ? t.target.closest(CLICKABLE) : null;
    if (!el || el.disabled) return;

    const tapAt = performance.now();
    setTimeout(() => {
      if (lastClickAt >= tapAt - 20 || !el.isConnected) return; // the browser clicked, or the page moved on
      delivered = { el, at: performance.now() };
      console.info('[tap-fallback] tap with no click — delivering one to', el);
      window.dispatchEvent(new CustomEvent('wb-tap-fallback', { detail: { el } }));
      el.click();
    }, CLICK_WAIT_MS);
  }, passive);

  addEventListener('click', (e) => {
    const now = performance.now();
    if (e.isTrusted && delivered && now - delivered.at < GUARD_MS && delivered.el.contains(e.target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    lastClickAt = now;
  }, true);
}
