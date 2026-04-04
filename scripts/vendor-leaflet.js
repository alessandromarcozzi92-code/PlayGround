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
