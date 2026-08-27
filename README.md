# Wujek Baca — Łukasz Matysiak Portfolio

Single-page portfolio for **Łukasz Matysiak** (`@wujekbaca`), automotive &
portrait photographer based in Kraków, Poland.

Built from the Claude Design handoff (`Wujek Baca Photography.dc.html`) as a
static site with [Vite](https://vitejs.dev/). No framework — plain HTML, CSS and
a single vanilla-JS module.

Sections: hero · "every frame matters" · stats · brand marquee ·
**01 Automotive** (5 full-bleed shots + EXIF) · **02 Portraits** (17-image
masonry) · **03 Cars & People** · **04 BYLD** · contact.

## Stack

| Concern      | Choice                                                        |
| ------------ | ----------------------------------------------------------------- |
| Bundler      | Vite 8 (`base: './'` so the build runs from any path)            |
| Markup       | `index.html`                                                     |
| Styles       | `src/styles.css`                                                 |
| Behaviour    | `src/main.js` — intro overlay, sticky nav w/ active-section links, custom cursor, reveal-on-scroll, parallax, kinetic headline, brand marquee, lightbox |
| Images       | `public/images/*` — web-sized WebP + optimized logos             |
| Fonts        | Google Fonts (Archivo, Bricolage Grotesque, Instrument Serif)    |
| Deploy       | GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`)   |

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build      # -> dist/
npm run preview     # serve the production build locally
```

## Images

The originals from the design handoff (4000–7600 px, up to 17 MB each) are **not**
committed. `public/images/` holds the optimized derivatives that the site
actually loads (~11 MB total for ~30 photos + logos).

To regenerate them you need the original `uploads/` folder from the handoff
bundle:

```bash
npm run optimize:images -- "/path/to/handoff/.../project/uploads"
```

The script (`scripts/optimize-images.mjs`) writes web-sized `.webp` (plus
`-full.webp` lightbox versions for the portraits) and shrinks the brand logos.

## Deployment

Every push to `main` builds the site and publishes `dist/` to GitHub Pages.
Enable it once under **Settings → Pages → Build and deployment → Source:
GitHub Actions**. The site is served at
`https://wujekkoduje.github.io/action_repo/`.
