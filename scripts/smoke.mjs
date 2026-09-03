/**
 * Post-build smoke test — no browser required.
 *
 * Builds nothing itself; run `npm run build` first (or use `npm test`, which
 * chains them). Serves `dist/` with `vite preview`, then:
 *   - fetches index.html + gallery.html and every gallery.html?section=<key>
 *   - extracts asset URLs from the HTML and from src/gallery-data.js
 *   - HEAD-checks every image / script / stylesheet resolves (200/304)
 *   - sanity-checks a few invariants (CNAME present, section counts, etc.)
 *
 * Exits non-zero on the first failure.
 */
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4183;
const BASE = `http://localhost:${PORT}`;

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

function startPreview() {
  // Run vite's JS entry directly with the current node — avoids the Windows
  // `.cmd` shim (spawn EINVAL since Node's CVE-2024-27980 fix) and any shell.
  const viteBin = resolve(ROOT, 'node_modules/vite/bin/vite.js');
  const proc = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  return new Promise((res, rej) => {
    let out = '';
    const to = setTimeout(
      () => rej(new Error(`preview server did not start in 30s. Output:\n${out}`)),
      30000
    );
    const onData = (d) => {
      out += d.toString().replace(/\x1b\[[0-9;]*m/g, ''); // strip ANSI colour
      if (out.includes(`localhost:${PORT}`) || /ready in/i.test(out)) {
        clearTimeout(to);
        setTimeout(() => res(proc), 400); // let it bind the socket
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (c) => rej(new Error(`preview exited early (${c}). Output:\n${out}`)));
  });
}

async function head(url) {
  try {
    const r = await fetch(url, { method: 'GET' });
    return r.status;
  } catch (e) {
    return `ERR ${e.message}`;
  }
}

function assetUrls(html) {
  const urls = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const u = m[1];
    if (!/\.(webp|png|svg|jpe?g|css|js|ico|woff2?)(\?|$)/i.test(u)) continue; // assets only
    urls.add('/' + u.replace(/^\.?\//, ''));
  }
  return [...urls];
}

async function run() {
  if (!existsSync(resolve(ROOT, 'dist/index.html'))) {
    console.error('dist/ missing — run `npm run build` first.');
    process.exit(1);
  }

  const server = await startPreview();
  try {
    // ---- CNAME shipped ----
    console.log('build output:');
    existsSync(resolve(ROOT, 'dist/CNAME'))
      ? ok('dist/CNAME present (custom domain preserved on deploy)')
      : fail('dist/CNAME missing — GitHub Pages will drop the custom domain');

    // ---- index.html ----
    console.log('\nindex.html:');
    const index = await (await fetch(`${BASE}/index.html`)).text();
    for (const u of assetUrls(index)) {
      const s = await head(BASE + u);
      s === 200 || s === 304 ? ok(`${u} → ${s}`) : fail(`${u} → ${s}`);
    }

    // ---- gallery.html + every section ----
    const { SECTIONS, SECTION_ORDER } = await import(
      pathToFileURL(resolve(ROOT, 'src/gallery-data.js')).href + `?t=${Date.now()}`
    );
    console.log('\ngallery.html:');
    const gallery = await (await fetch(`${BASE}/gallery.html`)).text();
    for (const u of assetUrls(gallery)) {
      const s = await head(BASE + u);
      s === 200 || s === 304 ? ok(`${u} → ${s}`) : fail(`${u} → ${s}`);
    }

    // ---- every image referenced by the gallery data ----
    console.log('\ngallery-data images:');
    let imgCount = 0;
    for (const key of SECTION_ORDER) {
      for (const it of SECTIONS[key].items) {
        for (const p of [it.src, it.full]) {
          imgCount++;
          const s = await head(BASE + p.replace(/^\.\//, '/'));
          if (s !== 200 && s !== 304) fail(`${key}: ${p} → ${s}`);
        }
      }
    }
    ok(`${imgCount} gallery images all resolve`);

    // ---- invariants ----
    console.log('\ninvariants:');
    const expected = { automotive: 14, portraits: 17, 'automotive-portraits': 15, products: 15, pets: 8 };
    for (const [k, n] of Object.entries(expected)) {
      SECTIONS[k]?.items.length === n
        ? ok(`${k}: ${n} photos`)
        : fail(`${k}: expected ${n}, got ${SECTIONS[k]?.items.length}`);
    }
    for (const m of index.matchAll(/data-count-for="([^"]+)">(\d+) PHOTOS/g)) {
      const [, key, shown] = m;
      Number(shown) === expected[key]
        ? ok(`"see all" card for ${key} shows ${shown}`)
        : fail(`"see all" card for ${key} shows ${shown}, data has ${expected[key]}`);
    }
    SECTIONS.automotive.items.every((i) => i.chip)
      ? ok('every automotive item has an EXIF chip')
      : fail('some automotive items missing chip');
    (index.match(/<img /g) || []).length >= 40
      ? ok(`index.html has ${(index.match(/<img /g) || []).length} <img> tags`)
      : fail('index.html has too few <img> tags');

    console.log(
      failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`
    );
  } finally {
    server.kill();
  }
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
