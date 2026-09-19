import './camera.css';
import { CAMERA_SHOTS } from './gallery-data.js';

/* ============================================================
   Camera Experience — a scroll/swipe-driven 3D Canon EOS 5D Mark IV.
   Hand-written WebGL 1.0 renderer, ported from the Claude Design
   prototype (Camera Experience.dc.html).

   Turn the camera with scroll / horizontal drag. Once its back faces
   you, three real controls become clickable:
     START/STOP  → wakes the monitor (settings menu)
     PLAY        → opens the card (photo playback)
     DIAL / SET  → next frame
   PLAY again returns to the menu; START/STOP again resets.

   The shader constants, SCREEN_BOX and MARKERS are measured values from the
   design handoff — don't "simplify" or round them.
   ============================================================ */

const ACCENT = '#d9a25c';
const MESH_URL = './camera/camera-mesh.json';
const TEXTURE_URLS = [
  './camera/camera-diffuse.png',
  './camera/camera-normal.jpg',
  './camera/camera-specgloss.png',
];
const HINTS = ['PRESS START/STOP', 'NOW PRESS PLAY', 'PRESS DIAL/SET FOR THE NEXT FRAME'];
const LCD_W = 1536;
const LCD_H = 1024;

const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const VS_SOURCE = [
  'attribute vec3 aPos;', 'attribute vec3 aNrm;', 'attribute vec4 aTan;', 'attribute vec2 aUv;',
  'uniform mat4 uMV;', 'uniform mat4 uP;', 'uniform vec4 uLens;',
  'varying vec3 vRad;', 'varying vec3 vN;', 'varying vec3 vT;', 'varying vec3 vB;', 'varying vec3 vV;', 'varying vec2 vUv;', 'varying vec3 vPos;',
  'void main() {',
  '  vec4 mv = uMV * vec4(aPos, 1.0);',
  '  mat3 nm = mat3(uMV[0].xyz, uMV[1].xyz, uMV[2].xyz);',
  '  vN = nm * aNrm;', '  vT = nm * aTan.xyz;', '  vB = cross(vN, vT) * aTan.w;', '  vV = -mv.xyz;',
  '  vRad = nm * vec3((aPos.xy - uLens.xy) / uLens.z, 0.0);',
  '  vUv = aUv;', '  vPos = aPos;', '  gl_Position = uP * mv;', '}',
].join('\n');

const FS_SOURCE = [
  'precision highp float;',
  'varying vec3 vRad;', 'varying vec3 vN;', 'varying vec3 vT;', 'varying vec3 vB;', 'varying vec3 vV;', 'varying vec2 vUv;', 'varying vec3 vPos;',
  'uniform sampler2D uDif;', 'uniform sampler2D uNrmMap;', 'uniform sampler2D uSG;', 'uniform sampler2D uMenu;',
  'uniform vec4 uScreenBox;', 'uniform float uScreenZ;', 'uniform vec3 uWarm;', 'uniform float uOn;', 'uniform float uNrmAmt;', 'uniform vec2 uGain;', 'uniform vec4 uLens;',
  'void main() {',
  '  vec3 GN = normalize(vN);', '  vec3 N = GN;', '  vec3 T = normalize(vT);', '  vec3 B = normalize(vB);', '  vec3 V = normalize(vV);',
  '  vec3 nt = texture2D(uNrmMap, vUv).rgb * 2.0 - 1.0;', '  nt.xy *= uNrmAmt;', '  N = normalize(mat3(T, B, N) * nt);',
  '  vec3 albS = texture2D(uDif, vUv, -0.6).rgb;', '  vec3 alb = albS * albS * (albS * 0.305 + 0.682);',
  '  vec3 sgT = texture2D(uSG, vUv).rgb;', '  vec2 sg = sgT.rg;', '  float specLevel = sg.r * 1.05 + 0.02;', '  float gloss = clamp(sg.g, 0.0, 1.0);',
  '  float lr = length(vPos.xy - uLens.xy);',
  '  float glass = smoothstep(uLens.z + 2.0, uLens.z - 2.0, lr) * step(uLens.w, vPos.z);',
  '  N = normalize(mix(N, normalize(GN + vRad * 0.62), glass));',
  '  alb = mix(alb, vec3(0.00055, 0.00072, 0.00135), glass);',
  '  specLevel = mix(specLevel, 0.03, glass);', '  gloss = mix(gloss, 1.0, glass);',
  '  vec3 R = reflect(-V, N);',
  '  vec3 KEY = normalize(vec3(-0.42, 0.72, 0.55));',
  '  vec3 RIMC = normalize(vec3(0.82, 0.24, -0.50));',
  '  vec3 RIMW = normalize(vec3(-0.80, 0.18, -0.56));',
  '  float base = smoothstep(-0.7, 0.95, R.y);',
  '  vec3 envc = mix(vec3(0.012, 0.014, 0.019), vec3(0.20, 0.22, 0.27), base * base);',
  '  float kk = pow(max(dot(R, KEY), 0.0), mix(2.5, 70.0, gloss));',
  '  envc += vec3(1.00, 0.97, 0.92) * kk * mix(0.55, 3.0, gloss);',
  '  float sc2 = pow(max(dot(R, RIMC), 0.0), mix(3.0, 95.0, gloss));',
  '  envc += vec3(0.55, 0.68, 0.95) * sc2 * mix(0.30, 1.9, gloss);',
  '  float wc = pow(max(dot(R, RIMW), 0.0), mix(3.0, 85.0, gloss));',
  '  envc += uWarm * wc * mix(0.32, 2.1, gloss);',
  '  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);',
  '  vec3 spec = envc * (specLevel + fr * 0.9) * uGain.y;',
  '  float sky = pow(N.y * 0.5 + 0.5, 1.25);',
  '  vec3 irr = mix(vec3(0.46, 0.47, 0.52), vec3(1.08, 1.10, 1.16), sky);',
  '  irr += vec3(1.0, 0.98, 0.94) * max(dot(N, KEY), 0.0) * 0.17;',
  '  irr += vec3(0.58, 0.68, 0.92) * max(dot(N, RIMC), 0.0) * 0.16;',
  '  vec3 col = alb * irr * uGain.x + spec;',
  '  if (vPos.x > uScreenBox.x && vPos.x < uScreenBox.z &&',
  '      vPos.y > uScreenBox.y && vPos.y < uScreenBox.w &&',
  '      abs(vPos.z - uScreenZ) < 2.0) {',
  '    vec2 mu = vec2((uScreenBox.z - vPos.x) / (uScreenBox.z - uScreenBox.x),',
  '                   (vPos.y - uScreenBox.y) / (uScreenBox.w - uScreenBox.y));',
  '    vec3 menu = texture2D(uMenu, mu).rgb;',
  '    vec3 off = vec3(0.010, 0.011, 0.014) + envc * fr * 0.10;',
  '    col = mix(off, menu * menu * 1.15, uOn);',
  '  }',
  '  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));',
  '  col *= (lum / (1.0 + lum)) / max(lum, 1e-4);',
  '  float mx = max(max(col.r, col.g), col.b);',
  '  if (mx > 1.0) col /= mx;',
  '  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);', '}',
].join('\n');

function b64(str, Type) {
  const bin = atob(str);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Type(u8.buffer);
}

function hexRgb(h) {
  let s = (h || '').replace('#', '');
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const n = parseInt(s, 16);
  if (Number.isNaN(n)) return [0.85, 0.63, 0.36];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`failed to load ${url}`));
    im.src = url;
  });
}

async function loadMesh() {
  const j = await (await fetch(MESH_URL)).json();
  const qp = b64(j.pos, Int16Array);
  const qn = b64(j.nrm, Int8Array);
  const qt = b64(j.tan, Int8Array);
  const qu = b64(j.uv, Uint16Array);
  const qi = b64(j.idx, Uint16Array);
  const nv = j.counts.verts;
  const pos = new Float32Array(nv * 3);
  const nrm = new Float32Array(nv * 3);
  const tan = new Float32Array(nv * 4);
  const uv = new Float32Array(nv * 2);
  const ps = j.posScale;
  for (let i = 0; i < nv * 3; i++) { pos[i] = qp[i] * ps; nrm[i] = qn[i] / 127; }
  for (let i = 0; i < nv * 4; i++) tan[i] = qt[i] / 127;
  for (let i = 0; i < nv * 2; i++) uv[i] = qu[i] / 65535;
  return {
    pos, nrm, tan, uv, idx: qi, n: qi.length,
    bbox: j.bbox,
    screenBox: [-20.25, -58.14, 76.17, 6.14, -131.1],
    // startStop / play y are 1.3 units below the handoff's measured values:
    // rendered pixels showed those two rings sitting ~1.3 model units above
    // their button centres at every viewport size (dial was exact).
    markers: {
      startStop: [-30.82, 26.41, -133.0],
      play: [90.70, -42.05, -133.0],
      dial: [-52.108, -43.852, -134.364],
    },
  };
}

class CameraExperience {
  constructor() {
    this.canvas = $('camCanvas');
    this.lcd = $('lcdTex');
    this.el = {
      loading: $('camLoading'),
      failed: $('camFailed'),
      hero: $('camHero'),
      hint: $('camHint'),
      hintText: $('camHintText'),
      cue: $('camCue'),
      advance: $('camAdvance'),
      start: $('hotStart'),
      play: $('hotPlay'),
      set: $('hotSet'),
    };

    this.s = {
      progress: 0, disp: 0, stage: 0, shot: 0,
      glFailed: false, ready: false, back: false,
      pPower: [0, 0], pPlay: [0, 0], pDial: [0, 0], pDialR: 48,
    };

    this.gl = null;
    this.data = null;
    this.raf = null;
    this.drag = null;
    this.screenKey = null;
    this.screenDirty = false;
    this.shotImgs = [];
    this.applied = new Map();

    this.tick = this.tick.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
  }

  /* ---------- lifecycle ---------- */
  async init() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll);
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('pointerleave', this.onUp);

    this.el.start.addEventListener('click', () => this.pressStart());
    this.el.play.addEventListener('click', () => this.pressPlay());
    this.el.set.addEventListener('click', () => this.pressSet());
    this.el.advance.addEventListener('click', () => this.advance());

    // The LCD is drawn with canvas text, which won't trigger a web-font load
    // by itself — load Space Mono, then redraw the screen.
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('400 12px "Space Mono"'),
        document.fonts.load('700 12px "Space Mono"'),
      ]).then(() => { this.screenDirty = true; }).catch(() => {});
    }

    this.onScroll();
    this.render();

    try {
      const [data, ...imgs] = await Promise.all([loadMesh(), ...TEXTURE_URLS.map(loadImage)]);
      this.data = data;
      if (!this.initGL(this.canvas, imgs)) { this.fail(); return; }
      this.s.ready = true;
      this.render();
      this.raf = requestAnimationFrame(this.tick);
    } catch {
      this.fail();
    }
  }

  fail() {
    this.s.glFailed = true;
    this.render();
  }

  /* ---------- input ---------- */
  onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.s.progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
  }

  onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    this.drag = { x: e.clientX, y: e.clientY, sy: window.scrollY, live: false, id: e.pointerId };
  }

  onMove(e) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.live) {
      if (Math.abs(dx) < 10 || Math.abs(dx) <= Math.abs(dy)) return;
      d.live = true;
      if (e.target && e.target.setPointerCapture) {
        try { e.target.setPointerCapture(d.id); } catch { /* ignore */ }
      }
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const span = Math.max(260, Math.min(window.innerWidth * 1.15, 900));
    window.scrollTo(0, clamp(d.sy - (dx / span) * max, 0, max));
  }

  onUp() {
    this.drag = null;
  }

  advance() {
    window.scrollTo({ top: window.scrollY + Math.max(320, window.innerHeight * 0.75), behavior: 'smooth' });
  }

  pressStart() {
    const lit = this.s.stage > 0;
    if (lit) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.s.stage = 0;
      this.s.shot = 0;
    } else {
      this.loadShots();
      this.s.stage = 1;
    }
  }

  pressPlay() {
    if (this.s.stage === 2) {
      this.s.stage = 1;
    } else {
      this.s.stage = 2;
      this.s.shot = 0;
    }
  }

  pressSet() {
    this.s.shot += 1;
  }

  /* ---------- LCD frames + 2D screen texture ---------- */
  loadShots() {
    if (this.shotImgs.length) return;
    CAMERA_SHOTS.forEach((shot, i) => {
      const im = new Image();
      im.onload = () => { this.screenDirty = true; };
      im.src = shot.src;
      this.shotImgs[i] = im;
    });
  }

  screenCanvas(stage, shot) {
    const el = this.lcd;
    const c = el.getContext('2d');
    if (!c) return null;
    const W = LCD_W;
    const H = LCD_H;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    if (stage === 2) { this.drawPlayback(c, W, H, shot); return el; }
    c.setTransform(W / 72, 0, 0, H / 48, 0, 0);
    c.fillStyle = '#0b131d';
    c.fillRect(0, 0, 72, 48);
    if (stage === 0) { c.setTransform(1, 0, 0, 1, 0, 0); return el; }

    c.fillStyle = '#121b26';
    c.fillRect(0, 0, 72, 8.2);
    const tabs = ['#e0b23c', '#2f3946', '#2f3946', '#2f3946', '#2f3946'];
    for (let i = 0; i < tabs.length; i++) { c.fillStyle = tabs[i]; c.fillRect(3.5 + i * 6.5, 2.4, 4.6, 3.4); }
    c.fillStyle = '#8199b3';
    c.font = '600 2.7px "Space Mono", monospace';
    c.textAlign = 'right';
    c.fillText('wujekbaca', 68.5, 5.8);
    c.textAlign = 'left';
    const rows = [['Image quality', 'RAW'], ['ISO speed', '400'], ['White balance', 'AUTO'], ['Drive mode', 'H'], ['Card / folder', '100']];
    for (let r = 0; r < rows.length; r++) {
      const y = 10.4 + r * 7.4;
      if (r === 0) { c.fillStyle = '#e0b23c'; c.fillRect(2.5, y, 67, 6.4); }
      c.fillStyle = r === 0 ? '#14181d' : '#cddcf0';
      c.font = '3.8px "Space Mono", monospace';
      c.fillText(rows[r][0], 4.5, y + 4.6);
      c.textAlign = 'right';
      c.fillText(rows[r][1], 67, y + 4.6);
      c.textAlign = 'left';
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    return el;
  }

  drawPlayback(c, W, H, shot) {
    const n = CAMERA_SHOTS.length;
    const idx = ((shot % n) + n) % n;
    const meta = CAMERA_SHOTS[idx];
    const img = this.shotImgs[idx];
    c.fillStyle = '#05080c';
    c.fillRect(0, 0, W, H);
    if (img && img.complete && img.naturalWidth) {
      c.drawImage(img, 0, 0, W, H);
    } else {
      c.fillStyle = '#6d7686';
      c.font = '600 26px "Space Mono", monospace';
      c.textAlign = 'center';
      c.fillText(`LOADING ${idx + 1} / ${n}`, W / 2, H / 2);
      c.textAlign = 'left';
    }
    const s = W / 72;
    c.fillStyle = 'rgba(6, 10, 15, 0.62)';
    c.fillRect(0, 0, W, 6.6 * s);
    c.fillRect(0, H - 6.6 * s, W, 6.6 * s);
    c.font = `600 ${2.9 * s}px "Space Mono", monospace`;
    c.fillStyle = '#eef3fa';
    c.textAlign = 'left';
    c.fillText(meta.label, 3 * s, 4.4 * s);
    c.fillStyle = '#e0b23c';
    c.fillRect(3 * s, H - 4.9 * s, 1.5 * s, 1.5 * s);
    c.fillStyle = '#eef3fa';
    c.fillText(meta.ex, 5.6 * s, H - 2.6 * s);
    c.textAlign = 'right';
    c.fillStyle = '#9fb2c8';
    c.fillText('RAW  ·  wujekbaca', 69 * s, 4.4 * s);
    c.fillStyle = '#eef3fa';
    c.fillText(`${idx + 1} / ${n}`, 69 * s, H - 2.6 * s);
    c.textAlign = 'left';
  }

  /* ---------- WebGL ---------- */
  initGL(el, imgs) {
    let gl = null;
    try {
      gl = el.getContext('webgl', { antialias: true, alpha: true, depth: true })
        || el.getContext('experimental-webgl', { antialias: true, alpha: true, depth: true });
    } catch { gl = null; }
    if (!gl) return false;

    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = mk(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = mk(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return false;
    const pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr);

    const d = this.data;
    const buf = (data, size, name) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, name);
      if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); }
    };
    buf(d.pos, 3, 'aPos');
    buf(d.nrm, 3, 'aNrm');
    buf(d.tan, 4, 'aTan');
    buf(d.uv, 2, 'aUv');
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, d.idx, gl.STATIC_DRAW);

    const aniso = gl.getExtension('EXT_texture_filter_anisotropic')
      || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
      || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
    const maxAniso = aniso ? Math.min(16, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 0;
    const mkTex = (src, unit, mip, flip) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !!flip);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      if (mip) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, maxAniso);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    // glTF uv (0,0) is the image's top-left, so the camera textures upload
    // un-flipped; only the 2D menu canvas wants the flip.
    mkTex(imgs[0], 0, true, false);
    mkTex(imgs[1], 1, true, false);
    mkTex(imgs[2], 2, true, false);
    this.texMenu = mkTex(this.screenCanvas(0, 0), 3, false, true);
    this.screenKey = '0:0';

    gl.uniform1i(gl.getUniformLocation(pr, 'uDif'), 0);
    gl.uniform1i(gl.getUniformLocation(pr, 'uNrmMap'), 1);
    gl.uniform1i(gl.getUniformLocation(pr, 'uSG'), 2);
    gl.uniform1i(gl.getUniformLocation(pr, 'uMenu'), 3);
    const sb = d.screenBox;
    gl.uniform4f(gl.getUniformLocation(pr, 'uScreenBox'), sb[0], sb[1], sb[2], sb[3]);
    gl.uniform1f(gl.getUniformLocation(pr, 'uScreenZ'), sb[4]);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 0);

    this.gl = gl;
    this.uMV = gl.getUniformLocation(pr, 'uMV');
    this.uP = gl.getUniformLocation(pr, 'uP');
    this.uWarm = gl.getUniformLocation(pr, 'uWarm');
    this.uOn = gl.getUniformLocation(pr, 'uOn');
    this.uNrmAmt = gl.getUniformLocation(pr, 'uNrmAmt');
    this.uGain = gl.getUniformLocation(pr, 'uGain');
    gl.uniform4f(gl.getUniformLocation(pr, 'uLens'), 21.34, -17.89, 49.0, 120.0);
    return true;
  }

  draw(rotY, zoom, stage, shot) {
    const el = this.canvas;
    const gl = this.gl;
    if (!el || !this.data || !gl) return null;

    const W = el.clientWidth;
    const H = el.clientHeight;
    if (!W || !H) return null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(W * dpr);
    const ch = Math.round(H * dpr);
    if (el.width !== cw || el.height !== ch) { el.width = cw; el.height = ch; }
    gl.viewport(0, 0, cw, ch);

    const key = `${stage}:${shot}`;
    if (this.screenKey !== key || this.screenDirty) {
      const src = this.screenCanvas(stage, shot);
      if (src) {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.texMenu);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      }
      this.screenKey = key;
      this.screenDirty = false;
    }

    const D = 560;
    const tilt = -0.05;
    const cy = Math.cos(rotY);
    const sy = Math.sin(rotY);
    const cx = Math.cos(tilt);
    const sx = Math.sin(tilt);
    const MV = new Float32Array([
      cy, sy * sx, -sy * cx, 0,
      0, cx, sx, 0,
      sy, -cy * sx, cy * cx, 0,
      0, 0, -D, 1,
    ]);

    const bb = this.data.bbox;
    const mh = bb.hi[1] - bb.lo[1];
    const mw = Math.max(bb.hi[0] - bb.lo[0], bb.hi[2] - bb.lo[2]);
    const narrow = W < 680;
    const fpx = Math.min(H * (narrow ? 0.34 : 0.44) / mh, W * (narrow ? 0.80 : 0.47) / mw) * zoom * D;
    const fy = (H / 2) / fpx;
    const near = 120;
    const far = 1600;
    const P = new Float32Array(16);
    P[0] = 1 / (fy * (W / H));
    P[5] = 1 / fy;
    P[10] = (far + near) / (near - far);
    P[11] = -1;
    P[13] = -0.02;
    P[14] = (2 * far * near) / (near - far);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.uMV, false, MV);
    gl.uniformMatrix4fv(this.uP, false, P);
    const warm = hexRgb(ACCENT);
    gl.uniform3f(this.uWarm, warm[0], warm[1], warm[2]);
    gl.uniform1f(this.uOn, stage > 0 ? 1 : 0);
    gl.uniform1f(this.uNrmAmt, 0.55);
    gl.uniform2f(this.uGain, 16.0, 0.45);
    gl.drawElements(gl.TRIANGLES, this.data.n, gl.UNSIGNED_SHORT, 0);

    const project = (p) => {
      const ex = MV[0] * p[0] + MV[4] * p[1] + MV[8] * p[2] + MV[12];
      const ey = MV[1] * p[0] + MV[5] * p[1] + MV[9] * p[2] + MV[13];
      const ez = MV[2] * p[0] + MV[6] * p[1] + MV[10] * p[2] + MV[14];
      const w = Math.max(1, -ez);
      const nx = (P[0] * ex) / w;
      // P[13] is a clip-space offset, so it goes in before the perspective
      // divide (as gl_Position does). Adding it after shifted every ring ~1% of
      // the viewport height below its button.
      const ny = (P[5] * ey + P[13]) / w;
      return [(nx * 0.5 + 0.5) * W, (1 - (ny * 0.5 + 0.5)) * H];
    };
    const mk = this.data.markers;
    const dialC = project(mk.dial);
    // The dial ring is sized off the model: 19.5 model units is its outer radius.
    const dialEdge = project([mk.dial[0] + 19.5, mk.dial[1], mk.dial[2]]);
    const dialR = Math.max(38, Math.abs(dialEdge[0] - dialC[0]) * 1.3);
    return {
      power: project(mk.startStop),
      play: project(mk.play),
      dial: dialC,
      dialR,
      back: cy < -0.12,
    };
  }

  /* ---------- frame loop ---------- */
  tick(t) {
    const s = this.s;
    s.disp += (s.progress - s.disp) * 0.075;
    const rotP = Math.min(1, s.disp / 0.66);
    const idle = reducedMotion ? 0 : Math.sin((t || 0) / 1900) * 0.05 * (1 - rotP);
    const rotY = -0.30 + rotP * 3.4416 + idle;
    const r = this.draw(rotY, 1 + rotP * 0.24, s.stage, s.shot);

    if (r) {
      const moved = (a, b) => Math.abs(a[0] - b[0]) > 0.4 || Math.abs(a[1] - b[1]) > 0.4;
      if (moved(r.power, s.pPower) || moved(r.play, s.pPlay) || moved(r.dial, s.pDial) || r.back !== s.back) {
        s.pPower = r.power;
        s.pPlay = r.play;
        s.pDial = r.dial;
        s.pDialR = r.dialR;
        s.back = r.back;
      }
    }
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  }

  /* ---------- DOM ---------- */
  // Write a style/attribute only when it changed — render() runs every frame.
  put(el, prop, value) {
    const key = `${el.id}|${prop}`;
    if (this.applied.get(key) === value) return;
    this.applied.set(key, value);
    if (prop === 'text') el.textContent = value;
    else if (prop === 'hidden') el.hidden = value;
    else if (prop === 'label') el.setAttribute('aria-label', value);
    else if (prop === 'tab') el.tabIndex = value;
    else el.style[prop] = value;
  }

  render() {
    const s = this.s;
    const p = s.disp;
    const revealP = clamp((p - 0.70) / 0.14, 0, 1);
    const showHot = revealP > 0.03 && s.back && s.ready && !s.glFailed;
    const st = s.stage;
    const usable = s.ready && !s.glFailed;

    const dot = (on, next) => ({
      o: on ? (next ? 0.9 : 0.42) : 0,
      on,
      pulse: on && next ? 0.85 : 0,
    });
    const ss = dot(showHot, st === 0);
    const pl = dot(showHot && st >= 1, st === 1);
    const sd = dot(showHot && st === 2, st === 2);

    const e = this.el;
    this.put(e.loading, 'hidden', s.ready || s.glFailed);
    this.put(e.failed, 'hidden', !s.glFailed);
    this.put(e.hero, 'opacity', String(usable ? Math.max(0, 1 - p / 0.2) : 0));
    this.put(e.hint, 'opacity', String(showHot ? revealP : 0));
    this.put(e.hintText, 'text', HINTS[st] || HINTS[0]);
    this.put(e.cue, 'opacity', String(usable ? Math.max(0, 1 - p / 0.55) : 0));
    this.put(e.cue, 'pointerEvents', p < 0.5 && usable ? 'auto' : 'none');
    this.put(e.advance, 'tab', p < 0.5 && usable ? 0 : -1);

    const hot = (btn, pos, d, label) => {
      this.put(btn, 'left', `${pos[0].toFixed(1)}px`);
      this.put(btn, 'top', `${pos[1].toFixed(1)}px`);
      this.put(btn, 'opacity', String(d.o));
      this.put(btn, 'pointerEvents', d.on ? 'auto' : 'none');
      this.put(btn, 'tab', d.on ? 0 : -1);
      if (label) this.put(btn, 'label', label);
      btn.lastElementChild.style.opacity = String(d.pulse);
    };
    hot(e.start, s.pPower, ss,
      st > 0
        ? 'Start/stop button — reset and turn the camera back round'
        : 'Start/stop button — wake the monitor');
    hot(e.play, s.pPlay, pl,
      st === 2
        ? 'Playback button — back to the menu'
        : 'Playback button — open the card');
    hot(e.set, s.pDial, sd);
    this.put(e.set, 'width', `${(s.pDialR * 2).toFixed(1)}px`);
    this.put(e.set, 'height', `${(s.pDialR * 2).toFixed(1)}px`);
    this.put(e.set, 'margin', `${(-s.pDialR).toFixed(1)}px 0 0 ${(-s.pDialR).toFixed(1)}px`);
  }
}

new CameraExperience().init();
