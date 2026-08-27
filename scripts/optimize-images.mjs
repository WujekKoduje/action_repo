/**
 * One-off asset pipeline for the Wujek Baca portfolio.
 *
 * Reads the original full-resolution photos from the Claude Design handoff
 * bundle (4000-7600px, up to 17 MB each) and writes web-sized WebP + optimized
 * PNG logos into `public/images/`. The optimized outputs are committed; the
 * multi-hundred-MB originals are not.
 *
 * Usage:
 *   node scripts/optimize-images.mjs [path-to-uploads-dir]
 *
 * The source dir defaults to the handoff location and can be overridden with
 * the first CLI arg or the WB_UPLOADS env var.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'public', 'images');

const SRC_DIR =
  process.argv[2] ||
  process.env.WB_UPLOADS ||
  'C:/Users/LukaszMatysiak/Downloads/Wujek Baca portfolio website-handoff (1)/wujek-baca-portfolio-website/project/uploads';

/**
 * @typedef {Object} PhotoJob
 * @property {string} src       source filename in the uploads dir
 * @property {string} out       output basename (no extension)
 * @property {number} display   max width of the in-page WebP
 * @property {number} [full]    max width of the lightbox WebP (omit to skip)
 */

/** @type {PhotoJob[]} */
const PHOTOS = [
  // Hero — full-bleed background, doubles as its own lightbox source.
  { src: '20251209-DSCF9901-b064a99d.jpeg', out: 'hero', display: 2560 },

  // 01 — Automotive. Full-width shots; display res is already lightbox-worthy.
  { src: 'photos-1787779904041-6lbn.jpg', out: 'auto-1', display: 2560 },
  { src: 'photos-1787779939849-jwso.jpg', out: 'auto-2', display: 2560 },
  { src: 'photos-1787780007208-panh.jpg', out: 'auto-3', display: 2560 },
  { src: 'photos-1787780139200-x8s1.jpg', out: 'auto-4', display: 2560 },
  { src: 'photos-1787779910064-h07n.jpg', out: 'auto-5', display: 2560 },

  // 02 — Portraits. Small on-page (masonry columns), bigger for the lightbox.
  { src: 'photos-1787780218754-i1us.jpg', out: 'portrait-1', display: 1400, full: 2560 },
  { src: 'photos-1787780336071-mvna.jpg', out: 'portrait-2', display: 1400, full: 2560 },
  { src: 'photos-1787780269681-6lxs.jpg', out: 'portrait-3', display: 1400, full: 2560 },
  { src: 'photos-1787780382813-x7am.jpg', out: 'portrait-4', display: 1400, full: 2560 },
  { src: 'photos-1787780204983-fbq3.jpg', out: 'portrait-5', display: 1400, full: 2560 },
  { src: 'photos-1787780325563-aeoi.jpg', out: 'portrait-6', display: 1400, full: 2560 },
  { src: 'photos-1787780015524-50br.jpg', out: 'portrait-7', display: 1400, full: 2560 },
  { src: '20260613-DSCF4919.jpeg', out: 'portrait-8', display: 1400, full: 2560 },
  { src: '20260613-DSCF5057.jpeg', out: 'portrait-9', display: 1400, full: 2560 },
  { src: '20260704-DSCF6010.jpeg', out: 'portrait-10', display: 1400, full: 2560 },
  { src: '20260704-DSCF6067.jpeg', out: 'portrait-11', display: 1400, full: 2560 },
  { src: '20260708-DSCF6304.jpeg', out: 'portrait-12', display: 1400, full: 2560 },
  { src: '20260708-DSCF6347.jpeg', out: 'portrait-13', display: 1400, full: 2560 },
  { src: '20260708-DSCF6490.jpeg', out: 'portrait-14', display: 1400, full: 2560 },
  { src: '20260708-DSCF6523.jpeg', out: 'portrait-15', display: 1400, full: 2560 },
  { src: '20260708-DSCF6544-3.jpeg', out: 'portrait-16', display: 1400, full: 2560 },
  { src: '20260708-DSCF6555.jpeg', out: 'portrait-17', display: 1400, full: 2560 },

  // 03 — Cars & People.
  { src: 'photos-1787779976063-y6kn.jpg', out: 'autoportrait-1', display: 1600, full: 2560 },
  { src: 'photos-1787780287260-mq7k.jpg', out: 'autoportrait-2', display: 1600, full: 2560 },
  { src: 'photos-1787780248177-52ls.jpg', out: 'autoportrait-3', display: 1600, full: 2560 },

  // 04 — BYLD.
  { src: '20260714-DSCF6895-a4c0d101.jpeg', out: 'byld-1', display: 1600, full: 2560 },
  { src: '20260714-DSCF6838-3cd498ae.jpeg', out: 'byld-2', display: 1600, full: 2560 },
  { src: '20260714-DSCF6851-5c3167ea.jpeg', out: 'byld-3', display: 1600, full: 2560 },
  { src: '20260714-DSCF6843.jpeg', out: 'byld-4', display: 1600, full: 2560 },
  { src: '20260714-DSCF6855-002171b7.jpeg', out: 'byld-5', display: 1600, full: 2560 },
];

/** @type {{src: string, out: string, width: number}[]} */
const LOGOS = [
  { src: 'pasted-1787818080325-0.png', out: 'logo-workstations.png', width: 600 },
  { src: 'pasted-1787818173222-0.png', out: 'logo-kpr.png', width: 320 },
  { src: 'pasted-1787818294729-0.png', out: 'logo-elitecars.png', width: 360 },
  { src: 'PXN_White@4x.png', out: 'logo-pxn.png', width: 584 },
  { src: 'pasted-1787818717609-0.png', out: 'logo-naruczaju.png', width: 320 },
  { src: 'pasted-1787818782197-0.png', out: 'logo-sassy.png', width: 360 },
  { src: 'LOGO_KEMPSON_white.avif', out: 'logo-kempson.png', width: 480 },
];

const SVG_LOGOS = [{ src: 'byld-pro-logo.svg', out: 'logo-byld.svg' }];

async function makeWebp(srcPath, outPath, width, quality) {
  await sharp(srcPath)
    .rotate() // bake in EXIF orientation
    .resize({ width, withoutEnlargement: true, fit: 'inside' })
    .webp({ quality })
    .toFile(outPath);
}

async function run() {
  if (!existsSync(SRC_DIR)) {
    console.error(`\nSource uploads dir not found:\n  ${SRC_DIR}\n`);
    console.error('Pass it explicitly:  node scripts/optimize-images.mjs "<path-to>/uploads"');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Source : ${SRC_DIR}`);
  console.log(`Output : ${OUT_DIR}\n`);

  for (const job of PHOTOS) {
    const srcPath = join(SRC_DIR, job.src);
    if (!existsSync(srcPath)) {
      console.warn(`  skip  ${job.src} (missing)`);
      continue;
    }
    await makeWebp(srcPath, join(OUT_DIR, `${job.out}.webp`), job.display, 80);
    console.log(`  ok    ${job.out}.webp  (<= ${job.display}px)`);
    if (job.full) {
      await makeWebp(srcPath, join(OUT_DIR, `${job.out}-full.webp`), job.full, 80);
      console.log(`  ok    ${job.out}-full.webp  (<= ${job.full}px)`);
    }
  }

  for (const logo of LOGOS) {
    const srcPath = join(SRC_DIR, logo.src);
    if (!existsSync(srcPath)) {
      console.warn(`  skip  ${logo.src} (missing)`);
      continue;
    }
    await sharp(srcPath)
      .resize({ width: logo.width, withoutEnlargement: true, fit: 'inside' })
      .png({ compressionLevel: 9, palette: true })
      .toFile(join(OUT_DIR, logo.out));
    console.log(`  ok    ${logo.out}`);
  }

  for (const logo of SVG_LOGOS) {
    const srcPath = join(SRC_DIR, logo.src);
    if (!existsSync(srcPath)) {
      console.warn(`  skip  ${logo.src} (missing)`);
      continue;
    }
    await copyFile(srcPath, join(OUT_DIR, logo.out));
    console.log(`  ok    ${logo.out}`);
  }

  // Simple aperture favicon in the site accent colour.
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0d0c0a"/>
  <g fill="none" stroke="#d98a4b" stroke-width="2">
    <circle cx="16" cy="16" r="9"/>
    <path d="M16 7l4.5 7.8M25 16l-9 0M20.5 24.2l-4.5-7.8M7 16l9 0M11.5 24.2l4.5-7.8M11.5 7.8l4.5 7.8"/>
  </g>
</svg>\n`;
  await writeFile(join(REPO_ROOT, 'public', 'favicon.svg'), favicon, 'utf8');
  console.log('  ok    favicon.svg');

  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
