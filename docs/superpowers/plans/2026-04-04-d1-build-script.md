# D1 — Build Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Node.js build script that produces an optimized production version of the site in `dist/`.

**Architecture:** Single `build.js` script using Node.js built-in `fs`, `path`, `crypto` modules + `terser` for JS minification. CSS concatenated from `@import` chain and minified via regex. Leaflet vendored locally via a separate download script. No bundler — ES modules preserved as-is.

**Tech Stack:** Node.js (fs, path, crypto), terser (devDependency)

**Spec:** `docs/superpowers/specs/2026-04-04-d1-build-script-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `scripts/vendor-leaflet.js` | Download Leaflet 1.9.4 JS+CSS to `vendor/` |
| Create | `build.js` | Main build script: clean, CSS concat+minify, JS minify, vendor copy, HTML transform, assets copy, version |
| Modify | `package.json` | Add `terser` devDependency, `vendor` and `build` npm scripts |
| Modify | `.gitignore` | Add `dist/` |

---

### Task 1: Setup — package.json, .gitignore, install terser

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Add terser devDependency and npm scripts to package.json**

Update `package.json` to:

```json
{
  "name": "surprise-travel-photography",
  "version": "1.0.0",
  "description": "Sito web personale per raccogliere le fotografie dei viaggi",
  "scripts": {
    "start": "lite-server",
    "vendor": "node scripts/vendor-leaflet.js",
    "build": "node build.js"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/alessandromarcozzi92-code/PlayGround.git"
  },
  "keywords": ["travel", "photography", "portfolio"],
  "author": "Alessandro Marcozzi",
  "license": "ISC",
  "devDependencies": {
    "lite-server": "^2.6.1",
    "terser": "^5.39.0"
  }
}
```

- [ ] **Step 2: Add dist/ to .gitignore**

Append `dist/` to `.gitignore`:

```
node_modules/
.DS_Store
dist/
```

- [ ] **Step 3: Install terser**

Run: `npm install`
Expected: terser installed in node_modules, package-lock.json updated.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add terser devDependency and build scripts to package.json"
```

---

### Task 2: Vendor Leaflet script

**Files:**
- Create: `scripts/vendor-leaflet.js`

- [ ] **Step 1: Create scripts/vendor-leaflet.js**

```js
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENDOR_DIR = join(ROOT, 'vendor');
const LEAFLET_VERSION = '1.9.4';
const BASE_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist`;

const files = [
  { url: `${BASE_URL}/leaflet.js`, dest: join(VENDOR_DIR, 'leaflet.js') },
  { url: `${BASE_URL}/leaflet.css`, dest: join(VENDOR_DIR, 'leaflet.css') },
];

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return res.text();
}

async function main() {
  mkdirSync(VENDOR_DIR, { recursive: true });

  for (const { url, dest } of files) {
    console.log(`Downloading ${url}...`);
    const content = await download(url);
    writeFileSync(dest, content, 'utf8');
    console.log(`  -> ${dest}`);
  }

  console.log(`\nLeaflet ${LEAFLET_VERSION} vendored to vendor/`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

Note: this script uses ESM syntax. Add `"type": "module"` to `package.json` is NOT needed because the project uses `type="module"` in the HTML script tag but not in package.json. The script files use `.js` extension. Since `package.json` does not have `"type": "module"`, we must use CommonJS or rename to `.mjs`. **Use CommonJS** to match existing project style (no `"type": "module"` in package.json):

Actually, let me correct — the project's JS files in `js/` use ES module syntax (`import`/`export`) and are loaded via `<script type="module">` in the browser. But Node.js scripts (`build.js`, `scripts/vendor-leaflet.js`) run in Node.js, not the browser. Since `package.json` doesn't have `"type": "module"`, Node.js defaults to CommonJS. We have two options:

1. Add `"type": "module"` to `package.json` (affects all `.js` files)
2. Use CommonJS in build scripts

**Choice: CommonJS for build scripts** — this avoids any side effects on the browser-loaded ES modules and on lite-server.

Corrected `scripts/vendor-leaflet.js`:

```js
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const VENDOR_DIR = path.join(ROOT, 'vendor');
const LEAFLET_VERSION = '1.9.4';
const BASE_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist`;

const files = [
  { url: `${BASE_URL}/leaflet.js`, dest: path.join(VENDOR_DIR, 'leaflet.js') },
  { url: `${BASE_URL}/leaflet.css`, dest: path.join(VENDOR_DIR, 'leaflet.css') },
];

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return res.text();
}

async function main() {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });

  for (const { url, dest } of files) {
    console.log(`Downloading ${url}...`);
    const content = await download(url);
    fs.writeFileSync(dest, content, 'utf8');
    console.log(`  -> ${dest}`);
  }

  console.log(`\nLeaflet ${LEAFLET_VERSION} vendored to vendor/`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run vendor script**

Run: `npm run vendor`
Expected: `vendor/leaflet.js` and `vendor/leaflet.css` created with Leaflet 1.9.4 content.

- [ ] **Step 3: Verify vendor files**

Run: `head -3 vendor/leaflet.js`
Expected: Leaflet copyright header with version 1.9.4.

- [ ] **Step 4: Commit**

```bash
git add scripts/vendor-leaflet.js vendor/
git commit -m "chore: add vendor-leaflet script, vendor Leaflet 1.9.4 locally"
```

---

### Task 3: Build script — clean + CSS concat/minify

**Files:**
- Create: `build.js`

- [ ] **Step 1: Create build.js with clean and CSS phases**

```js
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

module.exports = { cleanDir, copyRecursive, resolveImports, minifyCss, buildCss };
```

Note: we export for now so we can test. The `main()` will be added in Task 5.

- [ ] **Step 2: Test CSS build manually**

Run: `node -e "const b = require('./build.js'); b.cleanDir('./dist'); b.buildCss();"`
Expected: `dist/css/style.min.css` created, no `@import` in output, size reported.

- [ ] **Step 3: Verify output has no @import**

Run: `grep -c '@import' dist/css/style.min.css`
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add build.js
git commit -m "feat(build): add CSS concatenation and minification"
```

---

### Task 4: Build script — JS minification with terser

**Files:**
- Modify: `build.js`

- [ ] **Step 1: Add JS minification phase to build.js**

Add after the CSS section, before `module.exports`:

```js
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
```

Update `module.exports` to include `buildJs`:

```js
module.exports = { cleanDir, copyRecursive, resolveImports, minifyCss, buildCss, buildJs };
```

- [ ] **Step 2: Test JS minification**

Run: `node -e "const b = require('./build.js'); b.buildJs().then(() => console.log('done'))"`
Expected: `dist/js/` contains all 19 JS files in same directory structure, all minified.

- [ ] **Step 3: Verify import paths preserved**

Run: `grep -c "import" dist/js/app.js`
Expected: Non-zero (import statements still present, though minified).

- [ ] **Step 4: Commit**

```bash
git add build.js
git commit -m "feat(build): add JS minification with terser"
```

---

### Task 5: Build script — vendor, HTML transform, assets, version, main()

**Files:**
- Modify: `build.js`

- [ ] **Step 1: Add vendor copy phase**

Add after `buildJs` function:

```js
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
```

- [ ] **Step 2: Add HTML transform phase**

Add after `buildVendor`:

```js
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
```

- [ ] **Step 3: Add assets copy phase**

Add after `buildHtml`:

```js
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
```

- [ ] **Step 4: Add version file phase**

Add after `buildAssets`:

```js
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
```

- [ ] **Step 5: Add main() and replace module.exports**

Remove the `module.exports` line. Add at the end of the file:

```js
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
```

- [ ] **Step 6: Run full build**

Run: `npm run build`
Expected output similar to:
```
Building Surprise for production...

CSS: concatenating and minifying...
  -> css/style.min.css (XX.X% smaller)
JS: minifying modules...
  -> 19 JS files minified (X.X KB saved)
Vendor: copying Leaflet...
  -> vendor/leaflet.js, vendor/leaflet.css
HTML: transforming index.html...
  -> index.html (refs updated, CSP tightened)
Assets: copying...
  -> assets/
Version: writing build metadata...
  -> version.txt (xxxxxxxxxxxx)

Build complete in X.XXs -> dist/
```

- [ ] **Step 7: Commit**

```bash
git add build.js
git commit -m "feat(build): add vendor, HTML transform, assets, version phases and main()"
```

---

### Task 6: Verification

**Files:** none (read-only checks)

- [ ] **Step 1: Verify dist/ structure**

Run: `find dist -type f | sort`
Expected: matches the structure from the spec (index.html, css/style.min.css, js/\*.js with subdirs, vendor/leaflet.js, vendor/leaflet.css, assets/, version.txt).

- [ ] **Step 2: Verify CSS has no @import**

Run: `grep -c '@import' dist/css/style.min.css`
Expected: `0`

- [ ] **Step 3: Verify JS imports preserved**

Run: `grep -c 'import' dist/js/app.js`
Expected: Non-zero (minified but imports still present).

- [ ] **Step 4: Verify HTML references updated**

Run: `grep 'unpkg' dist/index.html`
Expected: No output (no unpkg references).

Run: `grep 'style.min.css' dist/index.html`
Expected: One match.

Run: `grep 'vendor/leaflet' dist/index.html`
Expected: Two matches (JS and CSS).

- [ ] **Step 5: Verify CSP updated**

Run: `grep 'Content-Security-Policy' dist/index.html`
Expected: CSP string without `unpkg.com`.

- [ ] **Step 6: Verify version.txt**

Run: `cat dist/version.txt`
Expected: Build hash and ISO date.

- [ ] **Step 7: Serve dist/ and test manually**

Run: `npx lite-server --baseDir dist`
Expected: Site loads identically to dev version. Leaflet map works. No console errors. CSS fully applied.

---

### Task 7: Update PLAN-1.0.md

**Files:**
- Modify: `PLAN-1.0.md`

- [ ] **Step 1: Mark D1 as done in PLAN-1.0.md**

Change `### Step D1 — Build script con minificazione` to `### Step D1 — [DONE] Build script con minificazione`.

Add implementation note after the verification section:

```
**Nota implementazione:** Build script puro Node.js (`build.js`) + `terser` come unica devDependency aggiunta. CSS: tutti gli `@import` risolti e concatenati in un singolo `style.min.css` minificato via regex. JS: ogni modulo minificato separatamente con terser, ES modules preservati. Leaflet 1.9.4 vendorato localmente (`vendor/`) via `scripts/vendor-leaflet.js` — rimosso da CDN in prod, CSP aggiornata senza `unpkg.com`. Output in `dist/` con `version.txt` (SHA-256 + timestamp).
```

- [ ] **Step 2: Commit**

```bash
git add PLAN-1.0.md
git commit -m "docs: mark step D1 as done in PLAN-1.0"
```
