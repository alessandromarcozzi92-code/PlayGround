# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
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
