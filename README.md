# Wujek Baca — Łukasz Matysiak Portfolio

Photography portfolio for **Łukasz Matysiak** (`@wujekbaca`), automotive &
portrait photographer based in Kraków, Poland.

Built from the Claude Design handoff (`Wujek Baca Photography.dc.html`,
`Gallery.dc.html`, `Contact.dc.html`, `Camera Experience.dc.html`) as a static
site with [Vite](https://vitejs.dev/). No
framework — plain HTML, CSS and small vanilla-JS modules.

## Pages

| Page                          | What it is                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `index.html`                  | Portfolio — hero, "every frame matters", animated stats, brand marquee, then five preview sections (**01 Automotive** with a randomized hero shot, **02 Portraits**, **03 Cars & People**, **04 Products**, **05 Pets**), each ending in a *See all photos* card, then **06 Camera Experience**, contact and a footer. |
| `gallery.html?section=<key>`  | Full gallery for one section (`automotive`, `portraits`, `automotive-portraits`, `products`, `pets`). Masonry grid, EXIF chips on automotive, client-side section switching from the nav. |
| `contact.html`                | Contact form (name / email / phone / message) that delivers by email through [Web3Forms](https://web3forms.com). Works without JS too (plain POST, redirected back to `contact.html?sent=1`). The nav's CONTACT link tracks the visitor's scroll position (`?from=<section>`) so *Back to portfolio* returns them where they were. |
| `camera.html`                 | **Camera Experience** — a scroll/swipe-driven 3D Canon EOS 5D Mark IV on a hand-written WebGL 1.0 renderer. Turn it with scroll or a sideways drag; once its back faces you, START/STOP → PLAY → SET drive the rear monitor through a menu and 13 frames. Standalone styles (`src/camera.css`) — doesn't load the shared sheet. |

## Stack

| Concern    | Choice                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Bundler    | Vite 8, multi-page (`index` / `gallery` / `contact` / `camera`), `base: './'` so it runs from any path |
| Styles     | `src/styles.css` (shared by index / gallery / contact) + `src/camera.css` (camera page)         |
| Behaviour  | `src/main.js` (portfolio), `src/gallery.js`, `src/contact.js`, `src/camera.js`; shared `menu.js`, `lightbox.js` |
| Data       | `src/gallery-data.js` — **generated** from `scripts/photo-manifest.mjs`; every photo, alt, EXIF and dimension, plus the camera-LCD frame list |
| Images     | `public/images/*` — web-sized WebP (`<slug>.webp` grid + `<slug>-full.webp` lightbox), optimized logos, and the 13 camera-LCD frames (`camera-N.webp`, 1536×1024) |
| 3D model   | `public/camera/*` — mesh + textures for the Camera Experience, copied **verbatim** from the handoff (the textures are tuned; don't re-encode) |
| Fonts      | Google Fonts (Archivo, Bricolage Grotesque, Instrument Serif; Space Grotesk + Space Mono on the camera page) |
| Deploy     | GitHub Actions → GitHub Pages, custom domain `lukaszmatysiak.art` (`public/CNAME`)               |

Intro overlay, scroll-reactive nav with active-section links + mobile drawer,
reveal-on-scroll, parallax hero, kinetic headline, count-up
stats, brand marquee and a section-scoped lightbox. Responsive to 375 px,
honours `prefers-reduced-motion`, works without JS (previews + a note on the
gallery).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build & test

```bash
npm run build      # -> dist/  (all four pages)
npm run preview    # serve the production build locally
npm test           # build + scripts/smoke.mjs — HEAD-checks every asset /
                   # image on every page, the camera model files, the CC BY
                   # credit, and a few data invariants
```

## Images

The ~500 MB of originals from the design handoff are **not** committed.
`public/images/` holds the optimized derivatives the site loads (~19 MB, ~70
photos × 2 sizes + logos + camera frames) and `src/gallery-data.js` is generated
alongside them.

Regenerating needs the handoff `uploads/` folder:

```bash
npm run optimize:images -- "/path/to/handoff/.../project/uploads"
# data only (no re-encode), e.g. after editing photo-manifest.mjs:
npm run optimize:images -- --data-only
```

Edit photo metadata / ordering in `scripts/photo-manifest.mjs`, never in the
generated `src/gallery-data.js`.

## Deployment

`.github/workflows/deploy.yml` runs `npm test` on every push **and pull request**
to `main`; pushes to `main` also publish `dist/` to GitHub Pages.

- Enable once: **Settings → Pages → Source: GitHub Actions**.
- Custom domain: `public/CNAME` holds `lukaszmatysiak.art`, so it ships in the
  build artifact and the domain survives every deploy.

## Credits & licences

The 3D camera on `camera.html` is **"Canon EOS 5D Mark IV" by RAW
(sketchfab.com/ocbsketch), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**.
The credit lives in `camera.html` (`.attr`, bottom-left) and **must stay in the
page**: it is deliberately very quiet, and comes up to full contrast on hover /
keyboard focus — quiet is fine, hidden is not (`npm test` fails if it goes
missing). All photographs are Łukasz Matysiak's own work.
