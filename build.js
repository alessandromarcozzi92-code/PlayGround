'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// ── Helpers ──────────────────────────────────────────────

function cleanDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// ── CSS: resolve @import, concatenate, minify ────────────

function resolveImports(cssContent, baseDir) {
  return cssContent.replace(
    /@import\s+url\(["']?([^"')]+)["']?\)\s*;?/g,
    (_match, filePath) => {
      const fullPath = path.join(baseDir, filePath);
      const imported = fs.readFileSync(fullPath, 'utf8');
      return resolveImports(imported, path.dirname(fullPath));
    }
  );
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // remove comments
    .replace(/\s+/g, ' ')               // collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1')  // remove space around delimiters
    .replace(/;}/g, '}')                // remove last semicolon before }
    .trim();
}

function buildCss() {
  console.log('CSS: concatenating and minifying...');
  const entryPath = path.join(ROOT, 'css', 'style.css');
  const raw = fs.readFileSync(entryPath, 'utf8');
  const concatenated = resolveImports(raw, path.join(ROOT, 'css'));
  const minified = minifyCss(concatenated);

  const outDir = path.join(DIST, 'css');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'style.min.css');
  fs.writeFileSync(outPath, minified, 'utf8');

  const ratio = ((1 - minified.length / concatenated.length) * 100).toFixed(1);
  console.log(`  -> css/style.min.css (${ratio}% smaller)`);
}

// ── JS: minify each module with terser ───────────────────

async function buildJs() {
  const { minify } = require('terser');
  console.log('JS: minifying modules...');

  const srcDir = path.join(ROOT, 'js');
  const outDir = path.join(DIST, 'js');
  let count = 0;
  let savedBytes = 0;

  async function processDir(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await processDir(fullPath);
      } else if (entry.endsWith('.js')) {
        const relPath = path.relative(srcDir, fullPath);
        const destPath = path.join(outDir, relPath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });

        const source = fs.readFileSync(fullPath, 'utf8');
        const result = await minify(source, {
          module: true,
          compress: { passes: 2 },
          mangle: true,
        });

        if (result.error) throw result.error;
        fs.writeFileSync(destPath, result.code, 'utf8');
        savedBytes += source.length - result.code.length;
        count++;
      }
    }
  }

  await processDir(srcDir);
  console.log(`  -> ${count} JS files minified (${(savedBytes / 1024).toFixed(1)} KB saved)`);
}

// ── Vendor: copy Leaflet ─────────────────────────────────

function buildVendor() {
  console.log('Vendor: copying Leaflet...');
  const srcDir = path.join(ROOT, 'vendor');
  const outDir = path.join(DIST, 'vendor');

  if (!fs.existsSync(srcDir)) {
    throw new Error('vendor/ not found. Run "npm run vendor" first.');
  }

  copyRecursive(srcDir, outDir);
  console.log('  -> vendor/leaflet.js, vendor/leaflet.css');
}

// ── HTML: copy and update references ─────────────────────

function buildHtml() {
  console.log('HTML: transforming index.html...');
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  // Replace CSS reference
  html = html.replace(
    'href="css/style.css"',
    'href="css/style.min.css"'
  );

  // Replace Leaflet JS: CDN -> local vendor
  html = html.replace(
    /<script\s+src="https:\/\/unpkg\.com\/leaflet@[^"]*\/dist\/leaflet\.js"[^>]*><\/script>/,
    '<script src="vendor/leaflet.js"></script>'
  );

  // Replace Leaflet CSS: CDN -> local vendor
  html = html.replace(
    /<link\s+rel="stylesheet"\s+href="https:\/\/unpkg\.com\/leaflet@[^"]*\/dist\/leaflet\.css"[^>]*>/,
    '<link rel="stylesheet" href="vendor/leaflet.css">'
  );

  // Update CSP: remove unpkg.com
  html = html.replace(
    /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]*)(">)/,
    (_match, pre, csp, post) => {
      const updated = csp
        .replace(/\s*https:\/\/unpkg\.com/g, '');
      return pre + updated + post;
    }
  );

  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
  console.log('  -> index.html (refs updated, CSP tightened)');
}

// ── Assets: copy recursively ─────────────────────────────

function buildAssets() {
  const srcDir = path.join(ROOT, 'assets');
  if (!fs.existsSync(srcDir)) {
    console.log('Assets: no assets/ directory, skipping.');
    return;
  }
  console.log('Assets: copying...');
  copyRecursive(srcDir, path.join(DIST, 'assets'));
  console.log('  -> assets/');
}

// ── Version: write build metadata ────────────────────────

function buildVersion() {
  console.log('Version: writing build metadata...');
  const hash = crypto.createHash('sha256');

  function hashDir(dir) {
    for (const entry of fs.readdirSync(dir).sort()) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        hashDir(fullPath);
      } else if (entry !== 'version.txt') {
        hash.update(fs.readFileSync(fullPath));
      }
    }
  }

  hashDir(DIST);
  const digest = hash.digest('hex').slice(0, 12);
  const timestamp = new Date().toISOString();
  const content = `Build: ${digest}\nDate:  ${timestamp}\n`;

  fs.writeFileSync(path.join(DIST, 'version.txt'), content, 'utf8');
  console.log(`  -> version.txt (${digest})`);
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  console.log('Building Surprise for production...\n');

  cleanDir(DIST);
  buildCss();
  await buildJs();
  buildVendor();
  buildHtml();
  buildAssets();
  buildVersion();

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\nBuild complete in ${elapsed}s -> dist/`);
}

main().catch((err) => {
  console.error('\nBuild failed:', err.message);
  process.exit(1);
});
