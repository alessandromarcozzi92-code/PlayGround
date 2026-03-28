import { trips } from './data.js';
import { openLightbox } from './gallery.js';

const DEBOUNCE_MS = 300;
const SUGGESTIONS = ['Giappone', 'aurora', 'tempio', 'deserto', 'natura', 'cascata'];

/** @type {number|null} Debounce timer ID */
let debounceTimer = null;

/**
 * Escapes special regex characters in a string.
 *
 * @param {string} str - The raw string to escape.
 * @returns {string} Regex-safe string.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Wraps matched substrings in <mark> tags for visual highlighting.
 *
 * @param {string} text    - The source text.
 * @param {RegExp} pattern - The regex pattern to highlight.
 * @returns {string} HTML string with matches wrapped in <mark>.
 */
const highlight = (text, pattern) => text.replace(pattern, '<mark class="search-highlight">$&</mark>');

/**
 * Truncates text around the first match, returning a snippet with context.
 *
 * @param {string} text    - The full text to excerpt.
 * @param {RegExp} pattern - The regex pattern to find.
 * @param {number} [radius=60] - Number of characters to show around the match.
 * @returns {string} Truncated snippet with ellipses.
 */
const excerpt = (text, pattern, radius = 60) => {
  const match = text.match(pattern);
  if (!match) return text.slice(0, radius * 2);

  const start = Math.max(0, match.index - radius);
  const end = Math.min(text.length, match.index + match[0].length + radius);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = `\u2026${snippet}`;
  if (end < text.length) snippet = `${snippet}\u2026`;

  return snippet;
};

/**
 * Searches all published trips and returns results grouped by type.
 *
 * @param {string} query - The search query string.
 * @returns {{ trips: Object[], photos: Object[], sections: Object[] }} Grouped results.
 */
const search = (query) => {
  const trimmed = query.trim();
  if (!trimmed) return { trips: [], photos: [], sections: [] };

  const pattern = new RegExp(escapeRegex(trimmed), 'gi');
  const published = trips.filter(t => t.published);

  const tripResults = [];
  const photoResults = [];
  const sectionResults = [];

  published.forEach(trip => {
    /* ── Trip-level match: name, description, tags ── */
    const nameMatch = pattern.test(trip.name);
    pattern.lastIndex = 0;
    const descMatch = pattern.test(trip.description);
    pattern.lastIndex = 0;
    const tagMatch = trip.tags.some(tag => { const m = pattern.test(tag); pattern.lastIndex = 0; return m; });

    if (nameMatch || descMatch || tagMatch) {
      tripResults.push({ trip, nameMatch, descMatch, tagMatch });
    }

    /* ── Photo-level match: caption ── */
    trip.photos.forEach((photo, index) => {
      if (pattern.test(photo.caption)) {
        photoResults.push({ photo, index, trip });
      }
      pattern.lastIndex = 0;
    });

    /* ── Section-level match: title, text ── */
    if (trip.sections) {
      trip.sections.forEach(section => {
        const titleMatch = pattern.test(section.title);
        pattern.lastIndex = 0;
        const textMatch = pattern.test(section.text);
        pattern.lastIndex = 0;

        if (titleMatch || textMatch) {
          sectionResults.push({ section, trip, titleMatch, textMatch });
        }
      });
    }

    /* ── POI-level match: name, note — grouped with sections ── */
    if (trip.pois) {
      trip.pois.forEach(poi => {
        const poiNameMatch = pattern.test(poi.name);
        pattern.lastIndex = 0;
        const poiNoteMatch = poi.note ? pattern.test(poi.note) : false;
        pattern.lastIndex = 0;

        if (poiNameMatch || poiNoteMatch) {
          sectionResults.push({
            section: { title: poi.name, text: poi.note || '' },
            trip,
            titleMatch: poiNameMatch,
            textMatch: poiNoteMatch,
            isPoi: true
          });
        }
      });
    }
  });

  return { trips: tripResults, photos: photoResults, sections: sectionResults };
};

/**
 * Renders search results grouped by type into the given container.
 *
 * @param {HTMLElement} container - The results container element.
 * @param {string}      query    - The raw search query (for highlighting).
 * @param {{ trips: Object[], photos: Object[], sections: Object[] }} results - Grouped results.
 */
const renderResults = (container, query, results) => {
  const pattern = new RegExp(escapeRegex(query.trim()), 'gi');
  const total = results.trips.length + results.photos.length + results.sections.length;

  if (total === 0) {
    container.innerHTML = `
      <div class="search-empty">
        <p class="search-empty__message">Nessun risultato per "<strong>${escapeHtml(query)}</strong>"</p>
        <p class="search-empty__hint">Prova con termini diversi o controlla l'ortografia</p>
      </div>
    `;
    return;
  }

  let html = '';

  /* ── Trip results ── */
  if (results.trips.length > 0) {
    html += `<div class="search-group">
      <h3 class="search-group__title">Viaggi <span class="search-group__count">${results.trips.length}</span></h3>
      <div class="search-group__list">
        ${results.trips.map(({ trip }) => `
          <a href="#trip/${trip.id}" class="search-result search-result--trip">
            <img src="${trip.cover}" alt="${trip.name}" class="search-result__thumb" loading="lazy"
                 onerror="this.style.display='none'">
            <div class="search-result__info">
              <span class="search-result__name">${highlight(trip.name, pattern)}</span>
              <span class="search-result__desc">${highlight(trip.description, pattern)}</span>
              <div class="search-result__tags">
                ${trip.tags.map(tag => `<span class="search-result__tag">${highlight(tag, pattern)}</span>`).join('')}
              </div>
            </div>
            <span class="search-result__dot" style="background-color: ${trip.color}"></span>
          </a>
        `).join('')}
      </div>
    </div>`;
  }

  /* ── Photo results ── */
  if (results.photos.length > 0) {
    html += `<div class="search-group">
      <h3 class="search-group__title">Foto <span class="search-group__count">${results.photos.length}</span></h3>
      <div class="search-group__list search-group__list--photos">
        ${results.photos.map(({ photo, index, trip }) => `
          <button class="search-result search-result--photo"
                  data-trip-id="${trip.id}" data-photo-index="${index}"
                  type="button">
            <img src="${photo.src}" alt="${photo.caption}" class="search-result__photo-thumb" loading="lazy"
                 onerror="this.style.display='none';this.parentElement.classList.add('search-result--broken')">
            <div class="search-result__photo-info">
              <span class="search-result__photo-caption">${highlight(photo.caption, pattern)}</span>
              <span class="search-result__photo-trip" style="--dot-color: ${trip.color}">${trip.name}</span>
            </div>
          </button>
        `).join('')}
      </div>
    </div>`;
  }

  /* ── Section & POI results ── */
  if (results.sections.length > 0) {
    html += `<div class="search-group">
      <h3 class="search-group__title">Contenuti <span class="search-group__count">${results.sections.length}</span></h3>
      <div class="search-group__list">
        ${results.sections.map(({ section, trip, textMatch, isPoi }) => `
          <a href="#trip/${trip.id}" class="search-result search-result--section">
            <div class="search-result__info">
              <span class="search-result__section-badge ${isPoi ? 'search-result__section-badge--poi' : ''}">
                ${isPoi ? 'POI' : 'Sezione'} &middot; ${trip.name}
              </span>
              <span class="search-result__name">${highlight(section.title, pattern)}</span>
              ${textMatch && section.text
                ? `<span class="search-result__excerpt">${highlight(excerpt(section.text, pattern), pattern)}</span>`
                : ''}
            </div>
            <span class="search-result__dot" style="background-color: ${trip.color}"></span>
          </a>
        `).join('')}
      </div>
    </div>`;
  }

  container.innerHTML = html;

  /* ── Photo click → open lightbox ── */
  container.querySelectorAll('.search-result--photo').forEach(btn => {
    btn.addEventListener('click', () => {
      const tripId = btn.dataset.tripId;
      const photoIndex = Number(btn.dataset.photoIndex);
      const trip = trips.find(t => t.id === tripId);
      if (trip) openLightbox(trip.photos, photoIndex);
    });
  });
};

/**
 * Escapes HTML special characters to prevent XSS in rendered output.
 *
 * @param {string} str - The raw string.
 * @returns {string} HTML-safe string.
 */
const escapeHtml = (str) => str.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

/**
 * Renders the full search view into the given container.
 * Sets up the input, suggestions, and live result rendering.
 *
 * @param {HTMLElement} container - The main content element.
 */
export const renderSearchView = (container) => {
  container.innerHTML = `
    <section class="search-view">
      <div class="search-view__header">
        <h1 class="search-view__title">Cerca</h1>
        <div class="search-view__input-wrapper">
          <svg class="search-view__icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" class="search-view__input" placeholder="Cerca viaggi, foto, luoghi\u2026"
                 autocomplete="off" aria-label="Campo di ricerca">
          <button class="search-view__clear" type="button" aria-label="Cancella ricerca" hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="search-view__results"></div>
      <div class="search-view__suggestions">
        <p class="search-view__suggestions-label">Prova a cercare</p>
        <div class="search-view__suggestions-list">
          ${SUGGESTIONS.map(s => `<button class="search-view__suggestion" type="button">${s}</button>`).join('')}
        </div>
      </div>
    </section>
  `;

  const input = container.querySelector('.search-view__input');
  const clearBtn = container.querySelector('.search-view__clear');
  const resultsEl = container.querySelector('.search-view__results');
  const suggestionsEl = container.querySelector('.search-view__suggestions');

  /**
   * Runs the search and updates UI visibility.
   */
  const doSearch = () => {
    const query = input.value;
    clearBtn.hidden = !query;

    if (!query.trim()) {
      resultsEl.innerHTML = '';
      suggestionsEl.hidden = false;
      return;
    }

    suggestionsEl.hidden = true;
    const results = search(query);
    renderResults(resultsEl, query, results);
  };

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doSearch, DEBOUNCE_MS);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.focus();
    doSearch();
  });

  /* Suggestion chip click → fill input and search */
  container.querySelectorAll('.search-view__suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.textContent;
      doSearch();
    });
  });

  /* Auto-focus input */
  requestAnimationFrame(() => input.focus());
};
