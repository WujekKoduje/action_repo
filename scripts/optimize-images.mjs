/**
 * Asset pipeline for the Wujek Baca portfolio.
 *
 * Reads the original full-resolution photos from the Claude Design handoff
 * bundle (4000-8000 px, up to 17 MB each) and writes:
 *   - web-sized WebP derivatives into `public/images/`
 *   - `src/gallery-data.js` (the data the portfolio + gallery pages import)
 *
 * The optimized outputs and `gallery-data.js` are committed; the ~500 MB of
 * originals are not.
 *
 * Usage:
 *   node scripts/optimize-images.mjs [path-to-uploads-dir]
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile, copyFile, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SECTIONS, SECTION_ORDER, HERO, LOGOS } from './photo-manifest.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'public', 'images');
const DATA_FILE = join(REPO_ROOT, 'src', 'gallery-data.js');

const DATA_ONLY = process.argv.includes('--data-only');

const SRC_DIR =
  process.argv.find((a) => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]) ||
  process.env.WB_UPLOADS ||
  'C:/Users/LukaszMatysiak/Downloads/Wujek Baca portfolio website-handoff (2)/wujek-baca-portfolio-website/project/uploads';

// Per-role output sizing. `display` feeds the on-page grids; `full` feeds the
// lightbox. Automotive shots double as the full-bleed portfolio hero, so they
// get a larger display size.
const SIZING = {
  automotive: { display: 1800, displayQ: 78, full: 2200, fullQ: 80 },
  default: { display: 1200, displayQ: 76, full: 2000, fullQ: 78 },
};

async function makeWebp(srcPath, outPath, width, quality) {
  const info = await sharp(srcPath)
    .rotate() // bake in EXIF orientation
    .resize({ width, withoutEnlargement: true, fit: 'inside' })
    .webp({ quality })
    .toFile(outPath);
  return { w: info.width, h: info.height };
}

function chipText(item) {
  return item.camera && item.settings ? `${item.camera} · ${item.settings}` : undefined;
}

/**
 * Rebuild a logo that was baked onto an opaque dark background as a real
 * transparent PNG: key the (dark) background out on luminance, brighten the
 * mark, trim, resize. Two passes so the geometry ops run on a normal pipeline.
 */
async function keyLogo(srcPath, outPath, k) {
  let base = sharp(srcPath).removeAlpha();
  if (k.extract) base = base.extract(k.extract);

  const rgbPng = await base.clone().linear(...(k.rgbLin || [1, 0])).png().toBuffer();
  let mp = base.clone().greyscale();
  mp = k.threshold != null ? mp.threshold(k.threshold) : mp.linear(...(k.maskLin || [1, 0]));
  if (k.blur) mp = mp.blur(k.blur);
  const maskPng = await mp.png().toBuffer();

  const rgba = await sharp(rgbPng).joinChannel(maskPng).png().toBuffer();
  await sharp(rgba)
    .trim({ threshold: 18 })
    .resize({ width: k.width || 360, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function run() {
  if (!existsSync(SRC_DIR)) {
    console.error(`\nSource uploads dir not found:\n  ${SRC_DIR}\n`);
    console.error('Pass it explicitly:  node scripts/optimize-images.mjs "<path-to>/uploads"');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Source : ${DATA_ONLY ? '(data-only — reading existing outputs)' : SRC_DIR}`);
  console.log(`Output : ${OUT_DIR}\n`);

  // Track every file we (re)generate so stale outputs can be pruned.
  const produced = new Set();
  const missing = [];

  // ---- Hero -------------------------------------------------------------
  if (!DATA_ONLY) {
    const src = join(SRC_DIR, HERO.file);
    if (existsSync(src)) {
      await makeWebp(src, join(OUT_DIR, 'hero.webp'), 2560, 82);
      produced.add('hero.webp');
      console.log('  ok    hero.webp');
    } else missing.push(HERO.file);
  }

  // ---- Section photos -------------------------------------------------
  const data = {};
  for (const key of SECTION_ORDER) {
    const section = SECTIONS[key];
    const sizing = SIZING[key] || SIZING.default;
    const items = [];
    for (const item of section.items) {
      const display = `${item.slug}.webp`;
      const full = `${item.slug}-full.webp`;
      let dim;
      if (DATA_ONLY) {
        if (!existsSync(join(OUT_DIR, display))) { missing.push(display); continue; }
        const m = await sharp(join(OUT_DIR, display)).metadata();
        dim = { w: m.width, h: m.height };
      } else {
        const src = join(SRC_DIR, item.file);
        if (!existsSync(src)) { missing.push(item.file); continue; }
        dim = await makeWebp(src, join(OUT_DIR, display), sizing.display, sizing.displayQ);
        await makeWebp(src, join(OUT_DIR, full), sizing.full, sizing.fullQ);
      }
      produced.add(display);
      produced.add(full);
      items.push({
        src: `./images/${display}`,
        full: `./images/${full}`,
        w: dim.w,
        h: dim.h,
        alt: item.alt,
        ...(chipText(item) ? { chip: chipText(item) } : {}),
        ...(item.camera ? { camera: item.camera } : {}),
        ...(item.settings ? { settings: item.settings } : {}),
        ...(item.caption ? { caption: item.caption } : {}),
      });
    }
    data[key] = { title: section.title, items };
    console.log(`  ok    ${key}  (${items.length} photos)`);
  }

  // ---- Logos --------------------------------------------------------
  for (const logo of LOGOS) {
    if (DATA_ONLY) { produced.add(logo.out); continue; }
    const src = join(SRC_DIR, logo.file);
    if (!existsSync(src)) {
      missing.push(logo.file);
      continue;
    }
    const dst = join(OUT_DIR, logo.out);
    if (logo.out.endsWith('.svg')) {
      await copyFile(src, dst);
    } else if (logo.mode === 'key') {
      await keyLogo(src, dst, logo.key);
    } else {
      await sharp(src)
        .resize({ width: logo.width, withoutEnlargement: true, fit: 'inside' })
        .png({ compressionLevel: 9, palette: true })
        .toFile(dst);
    }
    produced.add(logo.out);
    console.log(`  ok    ${logo.out}`);
  }

  // ---- Favicon -----------------------------------------------------
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0d0c0a"/>
  <g fill="none" stroke="#d98a4b" stroke-width="2">
    <circle cx="16" cy="16" r="9"/>
    <path d="M16 7l4.5 7.8M25 16l-9 0M20.5 24.2l-4.5-7.8M7 16l9 0M11.5 24.2l4.5-7.8M11.5 7.8l4.5 7.8"/>
  </g>
</svg>\n`;
  if (!DATA_ONLY) {
    await writeFile(join(REPO_ROOT, 'public', 'favicon.svg'), favicon, 'utf8');
    produced.add('favicon.svg');
    console.log('  ok    favicon.svg');
  }

  // ---- Prune stale outputs ---------------------------------------
  if (!DATA_ONLY) {
    for (const f of await readdir(OUT_DIR)) {
      if (!produced.has(f)) {
        await rm(join(OUT_DIR, f));
        console.log(`  rm    ${f}  (stale)`);
      }
    }
  }

  // ---- Emit gallery-data.js ------------------------------------
  const banner =
    '// GENERATED by scripts/optimize-images.mjs from scripts/photo-manifest.mjs — do not edit.\n';
  const body = `export const SECTIONS = ${JSON.stringify(data, null, 2)};\n\n` +
    `export const SECTION_ORDER = ${JSON.stringify(SECTION_ORDER)};\n\n` +
    'export default SECTIONS;\n';
  await writeFile(DATA_FILE, banner + '\n' + body, 'utf8');
  console.log(`\n  ok    ${DATA_FILE}`);

  if (missing.length) {
    console.warn(`\n  WARNING: ${missing.length} source file(s) not found:`);
    missing.forEach((f) => console.warn(`    - ${f}`));
  }
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
