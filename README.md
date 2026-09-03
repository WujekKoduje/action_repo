# Wujek Baca — Łukasz Matysiak Portfolio

Photography portfolio for **Łukasz Matysiak** (`@wujekbaca`), automotive &
portrait photographer based in Kraków, Poland.

Built from the Claude Design handoff (`Wujek Baca Photography.dc.html` +
`Gallery.dc.html`) as a static site with [Vite](https://vitejs.dev/). No
framework — plain HTML, CSS and small vanilla-JS modules.

## Pages

| Page                          | What it is                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `index.html`                  | Portfolio — hero, "every frame matters", animated stats, brand marquee, then five preview sections (**01 Automotive** with a randomized hero shot, **02 Portraits**, **03 Cars & People**, **04 Products**, **05 Pets**), each ending in a *See all photos* card, then contact. |
| `gallery.html?section=<key>`  | Full gallery for one section (`automotive`, `portraits`, `automotive-portraits`, `products`, `pets`). Masonry grid, EXIF chips on automotive, client-side section switching from the nav. |

## Stack

| Concern    | Choice                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Bundler    | Vite 8, multi-page (`index.html` + `gallery.html`), `base: './'` so it runs from any path       |
| Styles     | `src/styles.css` (shared)                                                                       |
| Behaviour  | `src/main.js` (portfolio) + `src/gallery.js` (gallery); shared `cursor.js`, `menu.js`, `lightbox.js` |
| Data       | `src/gallery-data.js` — **generated** from `scripts/photo-manifest.mjs`; every photo, alt, EXIF and dimension |
| Images     | `public/images/*` — web-sized WebP (`<slug>.webp` grid + `<slug>-full.webp` lightbox) + optimized logos |
| Fonts      | Google Fonts (Archivo, Bricolage Grotesque, Instrument Serif)                                    |
| Deploy     | GitHub Actions → GitHub Pages, custom domain `lukaszmatysiak.art` (`public/CNAME`)               |

Intro overlay, scroll-reactive nav with active-section links + mobile drawer,
custom cursor, reveal-on-scroll, parallax hero, kinetic headline, count-up
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
npm run build      # -> dist/  (index.html + gallery.html)
npm run preview    # serve the production build locally
npm test           # build + scripts/smoke.mjs — HEAD-checks every asset /
                   # image on both pages and a few data invariants
```

## Images

The ~500 MB of originals from the design handoff are **not** committed.
`public/images/` holds the optimized derivatives the site loads (~16 MB, ~70
photos × 2 sizes + logos) and `src/gallery-data.js` is generated alongside them.

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
