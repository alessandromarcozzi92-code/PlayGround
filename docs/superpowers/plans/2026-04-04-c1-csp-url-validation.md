# C1 — URL Validation + Content Security Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Content Security Policy meta tag and fix the remaining unsanitized URL assignment in the lightbox.

**Architecture:** Two surgical edits on existing files. CSP meta tag in `index.html` restricts resource origins at the browser level. Lightbox URL sanitization in `gallery.js` closes the last gap left by B2.

**Tech Stack:** Vanilla HTML, vanilla JS (ES modules)

---

### Task 1: Add CSP meta tag to `index.html`

**Files:**
- Modify: `index.html:21-22` (insert between OG meta and preconnect)

- [ ] **Step 1: Add the CSP meta tag**

In `index.html`, insert the following line after line 21 (`<meta property="og:locale" content="it_IT">`) and before line 22 (`<link rel="preconnect" href="https://fonts.googleapis.com">`):

```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' https: data:; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self';">
```

- [ ] **Step 2: Verify in browser**

Run: open the site locally (e.g. `npx serve .` or equivalent).

Check DevTools Console: no CSP violation errors during normal navigation (home, trip page, map, lightbox). Verify:
- Google Fonts loads (text renders in DM Sans / Playfair Display)
- Leaflet map renders with tiles
- Images from external URLs load
- No `Refused to load` errors in console

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(security): add Content Security Policy meta tag

Restricts resource origins: scripts to self + unpkg (Leaflet),
styles to self + Google Fonts + unsafe-inline (Leaflet needs it),
images to self + https + data:, fonts to gstatic, connections to self."
```

---

### Task 2: Sanitize lightbox URL assignment in `gallery.js`

**Files:**
- Modify: `js/gallery.js:270`

- [ ] **Step 1: Fix the unsanitized URL assignment**

In `js/gallery.js`, inside the `updateLightboxContent` function (line 270), change:

```js
  image.src = photo.src;
```

to:

```js
  image.src = sanitizeMediaUrl(photo.src);
```

`sanitizeMediaUrl` is already imported at line 2 of the file:
```js
import { escapeHtml, escapeAttr, sanitizeMediaUrl } from './utils/sanitize.js';
```

- [ ] **Step 2: Verify in browser**

Open a trip page, click a photo to open the lightbox. Verify:
- Image loads correctly in the lightbox
- Navigate with prev/next arrows — images continue to load
- No console errors

- [ ] **Step 3: Commit**

```bash
git add js/gallery.js
git commit -m "fix(security): sanitize lightbox image URL before assignment

photo.src comes from localStorage (user-editable via admin/import).
Pass it through sanitizeMediaUrl to reject javascript: and other
dangerous schemes, consistent with all other URL interpolations."
```

---

### Task 3: Final verification

- [ ] **Step 1: Full navigation test**

Open DevTools Console and navigate through:
1. Home page (hero slideshow, trip cards, moments strip)
2. A trip page (hero, sections, gallery, map)
3. Lightbox (open, navigate, close)
4. Search (search for a trip, click result)
5. About page
6. Admin panel (login, dashboard)

Expected: zero CSP violation warnings/errors in console for all pages.

- [ ] **Step 2: CSP enforcement test**

In DevTools Console, run:
```js
const img = new Image();
img.src = 'javascript:alert(1)';
document.body.appendChild(img);
```

Expected: CSP blocks the `javascript:` URI. Console shows a `Refused to load` error.

- [ ] **Step 3: Update PLAN-1.0.md to mark C1 as done**

In `PLAN-1.0.md`, change the C1 heading from:
```
### Step C1 — Sanitizzazione URL e Content Security Policy
```
to:
```
### Step C1 — [DONE] Sanitizzazione URL e Content Security Policy
```

Add implementation note after the verification section:
```
**Nota implementazione:** CSP aggiunta come meta tag in `index.html` con `default-src 'self'`, script limitati a self + unpkg, stili a self + unsafe-inline + Google Fonts, font a gstatic, connessioni a self. `sanitizeMediaUrl` applicato anche all'assegnamento `image.src` nella lightbox (`gallery.js`). Nessun SRI per Google Fonts (CSS varia per User-Agent). La validazione URL (`isValidMediaUrl`, `sanitizeMediaUrl`) era gia' completa da B2.
```

- [ ] **Step 4: Commit**

```bash
git add PLAN-1.0.md
git commit -m "docs: mark step C1 as done in PLAN-1.0"
```
