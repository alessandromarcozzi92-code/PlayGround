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
          <img src="${trip.cover}" alt="${trip.name}" class="trip-card__image" loading="lazy"
               onerror="this.style.display='none';this.parentElement.classList.add('trip-card__image-wrapper--broken')">
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

// ── Trip Gallery (narrative trip page) ─────────────────────────

/**
 * Renders the full narrative page for a single trip:
 * hero → split sections → photo gallery.
 *
 * @param {HTMLElement} container - The main content element.
 * @param {Object}      trip      - The trip data object.
 */
export const renderTripGallery = (container, trip) => {
  container.innerHTML = '';
  container.style.setProperty('--trip-color', trip.color);

  /* ── Trip Hero ── */
  const heroSrc = trip.heroImage || trip.cover;
  const hero = document.createElement('section');
  hero.className = 'trip-hero';
  hero.innerHTML = `
    <div class="trip-hero__bg" style="background-image: url('${heroSrc}')"></div>
    <div class="trip-hero__overlay"></div>
    <a href="#" class="trip-hero__back" aria-label="Torna ai viaggi">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
      <span>Tutti i viaggi</span>
    </a>
    <div class="trip-hero__content">
      <h1 class="trip-hero__title">${trip.name}</h1>
      <p class="trip-hero__description">${trip.description}</p>
      <div class="trip-hero__meta">
        <time>${formatDate(trip.date)}</time>
        <span>&middot;</span>
        <span>${trip.photos.length} foto</span>
      </div>
    </div>
  `;
  container.appendChild(hero);

  /* ── Split Sections ── */
  if (trip.sections && trip.sections.length > 0) {
    const sectionsWrapper = document.createElement('div');
    sectionsWrapper.className = 'trip-sections';

    trip.sections.forEach(section => {
      const el = document.createElement('section');
      el.className = `split-section split-section--${section.type}`;

      const mediaHTML = section.media.type === 'video'
        ? `<video class="split-section__video" poster="${section.media.poster || ''}" controls preload="none" loading="lazy">
             <source src="${section.media.src}" type="video/mp4">
           </video>`
        : `<img src="${section.media.src}" alt="${section.media.caption || section.title}" class="split-section__image" loading="lazy"
               onerror="this.style.display='none';this.parentElement.classList.add('split-section__media--broken')">`;

      el.innerHTML = `
        <div class="split-section__media">
          ${mediaHTML}
          ${section.media.caption ? `<p class="split-section__caption">${section.media.caption}</p>` : ''}
        </div>
        <div class="split-section__text">
          <h2 class="split-section__title">${section.title}</h2>
          <p class="split-section__body">${section.text}</p>
        </div>
      `;

      sectionsWrapper.appendChild(el);
    });

    container.appendChild(sectionsWrapper);
    observeSections(sectionsWrapper);
  }

  /* ── Gallery Header ── */
  const galleryLabel = document.createElement('div');
  galleryLabel.className = 'gallery-label';
  galleryLabel.innerHTML = '<h2 class="gallery-label__title">Galleria</h2>';
  container.appendChild(galleryLabel);

  /* ── Photo Grid ── */
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
      <img src="${photo.src}" alt="${photo.caption}" class="gallery-item__image" loading="lazy"
           onerror="this.style.display='none';this.parentElement.classList.add('gallery-item--broken')">
      <figcaption class="gallery-item__caption">${photo.caption}</figcaption>
    `;
    grid.appendChild(item);
  });

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

  container.appendChild(grid);
};

/**
 * Sets up IntersectionObserver to animate split sections on scroll.
 *
 * @param {HTMLElement} wrapper - The sections wrapper element.
 */
const observeSections = (wrapper) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('split-section--visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  wrapper.querySelectorAll('.split-section').forEach(el => observer.observe(el));
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

  if (!lightboxEl.parentNode) {
    document.body.appendChild(lightboxEl);
  }

  lightboxPhotos = photos;
  lightboxIndex = index;

  updateLightboxContent();

  lightboxEl.offsetHeight; // eslint-disable-line no-unused-expressions

  lightboxEl.classList.add('lightbox--open');
  document.body.style.overflow = 'hidden';

  document.addEventListener('keydown', handleLightboxKey);

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
