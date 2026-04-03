# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- `js/utils/sanitize.js` module with `escapeHtml`, `escapeAttr`, `isValidMediaUrl`, and `sanitizeMediaUrl` utilities for XSS prevention (Step B2).
- URL validation on JSON import in admin dashboard — rejects `javascript:`, `data:text/html`, and other dangerous URL schemes (Step B2).

### Changed
- All user-supplied data (trip names, descriptions, tags, captions, POI names/notes) is now HTML-escaped before `innerHTML` interpolation across `gallery.js`, `app.js`, `search.js`, `menu.js`, and `map.js` (Step B2).
- All image/media URLs are sanitized via `sanitizeMediaUrl()` before rendering in `src` attributes and CSS `background-image` (Step B2).
- `search.js` `highlight()` function now escapes HTML before wrapping matches in `<mark>` tags, preventing stored XSS via search results (Step B2).
- `admin/helpers.js` `escAttr()` now delegates to the shared `escapeAttr()` which covers all five dangerous characters (`&`, `<`, `>`, `"`, `'`) instead of only two (Step B2).
- Split `admin.js` (1152 lines) into 7 sub-modules under `js/admin/`: `index.js` (orchestrator), `helpers.js` (shared utilities, icons, trip picker), `dashboard.js` (stats, trip list, trip editor, data management), `section-editor.js`, `photo-organizer.js`, `poi-editor.js`, `tag-manager.js` (Step B1).
- `app.js` now imports from `js/admin/index.js` instead of `js/admin.js`.
- Split `style.css` (4125 lines) into 11 thematic CSS modules loaded via `@import`: reset, tokens, layout, hero, components, pages, gallery, lightbox, search, admin, responsive (Step A1).
- `style.css` is now an index file with only `@import` statements.

### Added
- Favicon (SVG emoji camera icon) and Apple touch icon (Step 19).
- SEO meta tags: `<meta name="description">`, `<meta name="author">`, Open Graph tags (`og:type`, `og:title`, `og:description`, `og:site_name`, `og:locale`) (Step 19).
- Responsive breakpoint for small mobile (375px): compact hero, stacked stats, smaller moments items, adjusted typography (Step 19).
- Responsive breakpoint for widescreen (1440px): wider max-width, larger cards/moments items, 4-column gallery grid (Step 19).

### Changed
- Admin dashboard with stats cards (published, drafts, photos, tags) and trip list with status badges (Step 14).
- Trip editor: create/edit trips with name, date, color picker, description, cover/hero URLs, tags, and published toggle (Step 14).
- `admin.js` module: dashboard rendering, trip list with inline actions (edit, toggle publish, delete), trip editor form (Step 14).
- localStorage persistence for trip data — admin changes survive browser sessions without export (Step 14).
- Admin login form at `#admin` with SHA-256 credential verification and sessionStorage-based session (Step 13).
- `auth.js` module: SHA-256 hashing via Web Crypto API, credential verification, session create/destroy, login form rendering.
- Admin panel placeholder with logout button — full dashboard coming in Step 14.
- Full-text search view (`#search`) with live results, debounced input, grouped results by type (trips, photos, sections/POI), search term highlighting, and suggestion chips (Step 10).
- `search.js` module: search logic across trip names, descriptions, tags, photo captions, section texts, and POI names. Click on photo results opens the lightbox.
- Search button in bottom nav now navigates to `#search`.
- Interactive Leaflet map on trip pages with POI markers, popups, auto-zoom, and theme-aware tiles (Step 9).
- `map.js` module: Leaflet initialization, colored circle markers by POI category, popup with name/note, `fitBounds()` auto-zoom, dark/light tile switching via MutationObserver.
- Map cleanup on route change to prevent memory leaks.
- Editorial home page with hero slideshow, featured latest trip, moments strip, animated stat counters, and about teaser (Step 5).
- Narrative trip page with full-screen hero, parallax background, split text+media sections with scroll animations, and video support (Step 6).
- 404 page for unknown routes, dynamic `document.title`, and fade transitions between views (Step 6).
- Filter bar with tag buttons and date sort toggle on the landing page (Step 8).
- `filters.js` module: tag filtering, date sorting, and filter bar rendering.
- Card entrance animation with staggered fade-in on filter/sort change.
- Fullscreen lightbox with prev/next navigation, keyboard controls (arrows, Escape), counter, caption, and focus trap (Step 7).
- Hash-based routing: `#trip/<id>` opens the trip gallery view with deep linking support (Step 6).
- Trip gallery view with colored header, back button, photo grid, and captions (Step 6).
- Trip cards with image overlay gradient, colored glow on hover, and tag pills (Step 5).
- `gallery.js` module: rendering logic for trip cards and trip gallery (Steps 5–6).
- Dark/light theme toggle with localStorage persistence and OS preference detection (Step 3).
- Bottom nav pill-style with floating trips panel and hover animations (Step 4).
- 3 sample trips (Giappone, Islanda, Marocco) with picsum.photos placeholders (Step 2).
- Project scaffolding with `lite-server` dev server and ES modules (Step 1).

### Changed
- Refactored all JS to follow coding standards: JSDoc on all functions, `const` by default, optional chaining, `aria-hidden` on decorative SVGs.
- Converted CSS to native nesting throughout.
- Adopted `[DONE]` markers in PLAN.md for completed steps.
