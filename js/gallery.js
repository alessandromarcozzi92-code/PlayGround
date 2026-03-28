const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

// ── Trip Cards (landing) ────────────────────────────────────────

/**
 * Renders trip cards into the given container.
 * If a grid already exists inside the container it is replaced.
 *
 * @param {HTMLElement} container  - The parent element that holds the grid.
 * @param {Object[]}    tripsList - Array of trip objects to render.
 */
export const renderTripCards = (container, tripsList) => {
  let grid = container.querySelector('.trips-grid');

  if (!grid) {
    grid = document.createElement('section');
    grid.className = 'trips-grid';
    container.appendChild(grid);
  }

  grid.innerHTML = '';

  tripsList.forEach((trip, index) => {
    const card = document.createElement('article');
    card.className = 'trip-card';
    card.style.setProperty('--trip-color', trip.color);
    card.style.setProperty('--card-index', index);
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
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Apri foto: ${photo.caption}`);
    item.innerHTML = `
      <img src="${photo.src}" alt="${photo.caption}" class="gallery-item__image" loading="lazy">
      <figcaption class="gallery-item__caption">${photo.caption}</figcaption>
    `;
    grid.appendChild(item);
  });

  // Event delegation for opening lightbox on click or Enter
  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    openLightbox(trip.photos, Number(item.dataset.index));
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    openLightbox(trip.photos, Number(item.dataset.index));
  });

  container.appendChild(header);
  container.appendChild(grid);
};

// ── Lightbox ───────────────────────────────────────────────────

/** @type {HTMLElement|null} */
let lightboxEl = null;

/** @type {Object[]} Current trip photos array */
let lightboxPhotos = [];

/** @type {number} Currently displayed photo index */
let lightboxIndex = 0;

/**
 * Creates the lightbox DOM structure once and appends it to <body>.
 *
 * @returns {HTMLElement} The lightbox root element.
 */
const createLightbox = () => {
  const el = document.createElement('div');
  el.className = 'lightbox';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Visualizzatore foto');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="lightbox__backdrop"></div>
    <div class="lightbox__content">
      <img class="lightbox__image" src="" alt="">
      <p class="lightbox__caption"></p>
      <span class="lightbox__counter"></span>
    </div>
    <button class="lightbox__close" aria-label="Chiudi">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <button class="lightbox__prev" aria-label="Foto precedente">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <button class="lightbox__next" aria-label="Foto successiva">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 6 15 12 9 18"/>
      </svg>
    </button>
  `;

  el.querySelector('.lightbox__backdrop').addEventListener('click', closeLightbox);
  el.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  el.querySelector('.lightbox__prev').addEventListener('click', () => navigateLightbox(-1));
  el.querySelector('.lightbox__next').addEventListener('click', () => navigateLightbox(1));

  document.body.appendChild(el);
  return el;
};

/**
 * Updates the lightbox image, caption, and counter to match the current index.
 */
const updateLightboxContent = () => {
  const photo = lightboxPhotos[lightboxIndex];
  const image = lightboxEl.querySelector('.lightbox__image');
  const caption = lightboxEl.querySelector('.lightbox__caption');
  const counter = lightboxEl.querySelector('.lightbox__counter');

  image.src = photo.src;
  image.alt = photo.caption;
  caption.textContent = photo.caption;
  counter.textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;

  // Hide arrows when at boundaries
  lightboxEl.querySelector('.lightbox__prev').style.visibility =
    lightboxIndex === 0 ? 'hidden' : 'visible';
  lightboxEl.querySelector('.lightbox__next').style.visibility =
    lightboxIndex === lightboxPhotos.length - 1 ? 'hidden' : 'visible';
};

/**
 * Opens the lightbox for the given photos array at the specified index.
 *
 * @param {Object[]} photos - Array of photo objects ({ src, caption }).
 * @param {number}   index  - The index of the photo to display first.
 */
export const openLightbox = (photos, index) => {
  if (!lightboxEl) lightboxEl = createLightbox();

  // Re-attach if previously removed from DOM
  if (!lightboxEl.parentNode) {
    document.body.appendChild(lightboxEl);
  }

  lightboxPhotos = photos;
  lightboxIndex = index;

  updateLightboxContent();

  // Force reflow so the browser renders the hidden state before transitioning
  lightboxEl.offsetHeight; // eslint-disable-line no-unused-expressions

  lightboxEl.classList.add('lightbox--open');
  document.body.style.overflow = 'hidden';

  document.addEventListener('keydown', handleLightboxKey);

  // Move focus into the lightbox for a11y
  lightboxEl.querySelector('.lightbox__close').focus();
};

/**
 * Closes the lightbox and restores page scroll.
 */
const closeLightbox = () => {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('lightbox--open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleLightboxKey);

  // Remove from DOM after transition to avoid blocking interaction on the page
  lightboxEl.addEventListener('transitionend', () => {
    if (!lightboxEl.classList.contains('lightbox--open')) {
      lightboxEl.remove();
    }
  }, { once: true });
};

/**
 * Navigates the lightbox by the given direction.
 *
 * @param {number} direction - +1 for next, -1 for previous.
 */
const navigateLightbox = (direction) => {
  const next = lightboxIndex + direction;
  if (next < 0 || next >= lightboxPhotos.length) return;
  lightboxIndex = next;
  updateLightboxContent();
};

/**
 * Keyboard handler for lightbox navigation and close.
 *
 * @param {KeyboardEvent} e - The keyboard event.
 */
const handleLightboxKey = (e) => {
  switch (e.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowLeft':
      navigateLightbox(-1);
      break;
    case 'ArrowRight':
      navigateLightbox(1);
      break;
    case 'Tab':
      trapFocus(e);
      break;
  }
};

/**
 * Traps keyboard focus inside the lightbox when Tab is pressed.
 *
 * @param {KeyboardEvent} e - The Tab keydown event.
 */
const trapFocus = (e) => {
  const focusable = lightboxEl.querySelectorAll(
    'button:not([style*="visibility: hidden"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
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
