# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
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
