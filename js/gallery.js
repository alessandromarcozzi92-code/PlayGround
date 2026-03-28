import { trips } from './data.js';

const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

// ── Trip Cards (landing) ────────────────────────────────────────

/**
 * Renders published trip cards into the given container.
 *
 * @param {HTMLElement} container - The parent element to append the grid to.
 */
export const renderTripCards = (container) => {
  const grid = document.createElement('section');
  grid.className = 'trips-grid';

  trips.filter(t => t.published).forEach(trip => {
    const card = document.createElement('article');
    card.className = 'trip-card';
    card.style.setProperty('--trip-color', trip.color);
    card.innerHTML = `
      <a href="#trip/${trip.id}" class="trip-card__link">
        <div class="trip-card__image-wrapper">
          <img src="${trip.cover}" alt="${trip.name}" class="trip-card__image" loading="lazy">
          <div class="trip-card__overlay">
            <h2 class="trip-card__name">${trip.name}</h2>
            <time class="trip-card__date">${formatDate(trip.date)}</time>
          </div>
        </div>
        <div class="trip-card__info">
          <p class="trip-card__description">${trip.description}</p>
          <div class="trip-card__tags">
            ${trip.tags.map(tag => `<span class="trip-card__tag">${tag}</span>`).join('')}
          </div>
        </div>
      </a>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
};

// ── Trip Gallery (single trip view) ─────────────────────────────

/**
 * Renders the full gallery view for a single trip.
 *
 * @param {HTMLElement} container - The main content element.
 * @param {Object}      trip      - The trip data object.
 */
export const renderTripGallery = (container, trip) => {
  container.innerHTML = '';
  container.style.setProperty('--trip-color', trip.color);

  const header = document.createElement('header');
  header.className = 'gallery-header';
  header.innerHTML = `
    <a href="#" class="gallery-header__back" aria-label="Torna ai viaggi">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
      <span>Tutti i viaggi</span>
    </a>
    <div class="gallery-header__info">
      <h1 class="gallery-header__title">${trip.name}</h1>
      <p class="gallery-header__description">${trip.description}</p>
      <time class="gallery-header__date">${formatDate(trip.date)}</time>
      <span class="gallery-header__count">${trip.photos.length} foto</span>
    </div>
  `;

  const grid = document.createElement('section');
  grid.className = 'gallery-grid';

  trip.photos.forEach((photo, index) => {
    const item = document.createElement('figure');
    item.className = 'gallery-item';
    item.dataset.index = index;
    item.innerHTML = `
      <img src="${photo.src}" alt="${photo.caption}" class="gallery-item__image" loading="lazy">
      <figcaption class="gallery-item__caption">${photo.caption}</figcaption>
    `;
    grid.appendChild(item);
  });

  container.appendChild(header);
  container.appendChild(grid);
};

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Formats a "YYYY-MM" date string into a human-readable Italian label.
 *
 * @param {string} dateStr - Date in "YYYY-MM" format.
 * @returns {string} Formatted date (e.g. "Apr 2024").
 */
const formatDate = (dateStr) => {
  const [year, month] = dateStr.split('-');
  return `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year}`;
};
