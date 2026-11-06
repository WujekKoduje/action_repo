/* Opt-in diagnostics for "the first tap on a link does nothing" on real phones.

   Open the site with ?debug=taps and a small log pins to the bottom of the
   screen (it never intercepts touches). Reproduce the problem, then screenshot
   it. It records what the browser actually delivers for each touch: which
   element got it, what was under the finger, whether a click followed, whether
   the page was still scrolling, and the viewport state. A tap that produces no
   click is flagged with "!!". Loaded on demand only — see main.js. */

const MAX_LINES = 18;
const TAP_MAX_MS = 500;
const TAP_MAX_MOVE = 12;
const CLICK_WAIT_MS = 600;

function describe(el) {
  if (!el || !el.tagName) return String(el);
  let s = el.tagName.toLowerCase();
  if (el.id) s += `#${el.id}`;
  else if (typeof el.className === 'string' && el.className.trim()) s += `.${el.className.trim().split(/\s+/)[0]}`;
  if (el.tagName === 'A') s += ` [${el.getAttribute('href')}]`;
  return s.slice(0, 46);
}

export function startTapDebug() {
  const t0 = performance.now();
  const lines = [];
  const panel = document.createElement('pre');
  panel.setAttribute('aria-hidden', 'true');
  panel.style.cssText =
    'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;margin:0;padding:6px 8px;' +
    'background:rgba(0,0,0,.85);color:#7dffa1;font:10px/1.35 ui-monospace,Menlo,Consolas,monospace;' +
    'white-space:pre-wrap;word-break:break-all;pointer-events:none;';
  document.body.appendChild(panel);

  const log = (msg) => {
    const line = `${((performance.now() - t0) / 1000).toFixed(1)}s ${msg}`;
    lines.push(line);
    if (lines.length > MAX_LINES) lines.shift();
    panel.textContent = lines.join('\n');
    console.log('[tap-debug]', line);
  };

  const vv = () => {
    const v = window.visualViewport;
    return v ? `vv=${v.scale.toFixed(2)}x top=${Math.round(v.offsetTop)} h=${Math.round(v.height)}/${innerHeight}` : `h=${innerHeight}`;
  };
  const introUp = () => !!document.getElementById('intro');

  let lastScrollAt = -1e9;
  let scrolling = false;
  let scrollTimer = 0;
  let lastClickAt = -1e9;
  let touch = null;

  log(`ready  ${navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 58)}`);
  log(`intro=${introUp()} ${vv()} scrollY=${Math.round(scrollY)} dpr=${devicePixelRatio}`);

  const opts = { capture: true, passive: true };

  addEventListener('scroll', () => {
    lastScrollAt = performance.now();
    if (!scrolling) {
      scrolling = true;
      log(`scroll start y=${Math.round(scrollY)}`);
    }
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      scrolling = false;
      log(`scroll stop  y=${Math.round(scrollY)}`);
    }, 250);
  }, opts);

  addEventListener('touchstart', (e) => {
    const p = e.changedTouches[0];
    const hit = document.elementFromPoint(p.clientX, p.clientY);
    const ok = hit === e.target || (e.target.contains && e.target.contains(hit)) || (hit && hit.contains && hit.contains(e.target));
    touch = { at: performance.now(), x: p.clientX, y: p.clientY, moved: 0, target: e.target };
    const sinceScroll = Math.round(performance.now() - lastScrollAt);
    log(`T-down ${describe(e.target)}  under=${describe(hit)}${ok ? '' : '  !!MISMATCH'}  sinceScroll=${sinceScroll > 99999 ? '-' : sinceScroll + 'ms'} intro=${introUp()} ${vv()}`);
  }, opts);

  addEventListener('touchmove', (e) => {
    if (!touch) return;
    const p = e.changedTouches[0];
    touch.moved = Math.max(touch.moved, Math.hypot(p.clientX - touch.x, p.clientY - touch.y));
  }, opts);

  addEventListener('touchend', (e) => {
    if (!touch) return;
    const t = touch;
    touch = null;
    const dt = Math.round(performance.now() - t.at);
    log(`T-up   dt=${dt}ms moved=${Math.round(t.moved)}px  ${describe(t.target)}`);
    if (dt < TAP_MAX_MS && t.moved < TAP_MAX_MOVE) {
      const tapAt = performance.now();
      setTimeout(() => {
        if (lastClickAt < tapAt - 50) {
          log(`!! TAP BUT NO CLICK on ${describe(t.target)}  scrolling=${scrolling} intro=${introUp()}`);
        }
      }, CLICK_WAIT_MS);
    }
  }, opts);

  addEventListener('touchcancel', () => {
    touch = null;
    log('T-CANCEL (browser took the touch, e.g. to scroll)');
  }, opts);

  addEventListener('pointercancel', (e) => log(`P-CANCEL ${e.pointerType}`), opts);

  addEventListener('click', (e) => {
    lastClickAt = performance.now();
    log(`CLICK  ${describe(e.target)}  prevented=${e.defaultPrevented}`);
  }, opts);

  addEventListener('pagehide', () => log('pagehide (navigating away)'), opts);
}
