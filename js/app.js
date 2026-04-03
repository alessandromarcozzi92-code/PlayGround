import { trips } from './data.js';
import { initTheme, toggleTheme } from './theme.js';
import { initMenu, updateNavFromHash } from './menu.js';
import { renderTripCards, renderTripGallery } from './gallery.js';
import { renderFilterBar, getFilteredTrips, resetFilters } from './filters.js';
import { renderStats } from './stats.js';
import { destroyMap } from './map.js';
import { renderSearchView } from './search.js';
import { isAuthenticated, renderLoginForm } from './auth.js';
import { renderAdminPanel } from './admin/index.js';
import { escapeHtml, escapeAttr, sanitizeMediaUrl } from './utils/sanitize.js';

const BASE_TITLE = 'Surprise — Travel Photography';

/** @type {HTMLElement} */
let mainContent;

/** @type {number|null} Slideshow interval ID */
let slideshowTimer = null;

/**
 * Collects hero images from all published trips for the slideshow.
 *
 * @returns {string[]} Array of image URLs.
 */
const getHeroImages = () => {
  const published = trips.filter(t => t.published);
  const images = [];

  published.forEach(trip => {
    if (trip.heroImage) images.push(trip.heroImage);
    else if (trip.cover) images.push(trip.cover);
  });

  return images.length > 0 ? images : ['https://picsum.photos/seed/fallback-hero/1920/1080'];
};

/**
 * Starts the hero slideshow, cycling through images.
 *
 * @param {HTMLElement} heroEl - The hero section element.
 * @param {string[]}    images - Array of image URLs.
 */
const startSlideshow = (heroEl, images) => {
  if (images.length <= 1) return;

  let currentIndex = 0;
  const slidesContainer = heroEl.querySelector('.hero__slides');

  slideshowTimer = setInterval(() => {
    currentIndex = (currentIndex + 1) % images.length;
    const slides = slidesContainer.querySelectorAll('.hero__slide');
    slides.forEach((slide, i) => {
      slide.classList.toggle('hero__slide--active', i === currentIndex);
    });
  }, 5000);
};

/**
 * Stops the hero slideshow.
 */
const stopSlideshow = () => {
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
};

/**
 * Transitions the main content with a fade-out/fade-in animation.
 *
 * @param {Function} renderFn - The function that renders the new view.
 */
const transitionView = (renderFn) => {
  mainContent.classList.add('view-exit');

  const afterExit = () => {
    mainContent.removeEventListener('animationend', afterExit);
    renderFn();
    mainContent.classList.remove('view-exit');
    mainContent.classList.add('view-enter');

    const afterEnter = () => {
      mainContent.removeEventListener('animationend', afterEnter);
      mainContent.classList.remove('view-enter');
    };
    mainContent.addEventListener('animationend', afterEnter, { once: true });
  };

  mainContent.addEventListener('animationend', afterExit, { once: true });
};

/**
 * Renders the latest trip in a featured editorial layout.
 *
 * @param {HTMLElement} container - Parent element.
 */
const renderLatestTrip = (container) => {
  const published = trips
    .filter(t => t.published)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (published.length === 0) return;

  const trip = published[0];
  const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const [year, month] = trip.date.split('-');
  const dateStr = `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year}`;

  const section = document.createElement('section');
  section.className = 'featured-trip';
  section.style.setProperty('--trip-color', trip.color);

  section.innerHTML = `
    <div class="featured-trip__label">Ultimo viaggio</div>
    <div class="featured-trip__content">
      <a href="#trip/${trip.id}" class="featured-trip__image-wrapper">
        <img src="${sanitizeMediaUrl(trip.heroImage || trip.cover)}" alt="${escapeAttr(trip.name)}" class="featured-trip__image" loading="lazy">
        <div class="featured-trip__image-overlay"></div>
      </a>
      <div class="featured-trip__info">
        <time class="featured-trip__date">${dateStr}</time>
        <h2 class="featured-trip__name">${escapeHtml(trip.name)}</h2>
        <p class="featured-trip__description">${escapeHtml(trip.description)}</p>
        <div class="featured-trip__tags">
          ${trip.tags.map(tag => `<span class="featured-trip__tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <a href="#trip/${trip.id}" class="featured-trip__cta">
          Scopri il viaggio
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
      </div>
    </div>
  `;

  container.appendChild(section);
};

/**
 * Renders the moments strip — a horizontal scrollable row of selected photos.
 *
 * @param {HTMLElement} container - Parent element.
 */
const renderMomentsStrip = (container) => {
  const published = trips.filter(t => t.published);
  const moments = [];

  published.forEach(trip => {
    trip.photos.slice(0, 3).forEach(photo => {
      moments.push({ ...photo, tripName: trip.name, tripColor: trip.color, tripId: trip.id });
    });
  });

  if (moments.length === 0) return;

  const section = document.createElement('section');
  section.className = 'moments';

  section.innerHTML = `
    <h2 class="moments__title">Momenti</h2>
    <div class="moments__strip">
      ${moments.map(m => `
        <a href="#trip/${m.tripId}" class="moments__item">
          <img src="${sanitizeMediaUrl(m.src)}" alt="${escapeAttr(m.caption)}" class="moments__image" loading="lazy">
          <div class="moments__overlay">
            <span class="moments__trip-name" style="--dot-color: ${escapeAttr(m.tripColor)}">${escapeHtml(m.tripName)}</span>
          </div>
        </a>
      `).join('')}
    </div>
  `;

  container.appendChild(section);
};

/**
 * Renders the mini about teaser section.
 *
 * @param {HTMLElement} container - Parent element.
 */
const renderAboutTeaser = (container) => {
  const section = document.createElement('section');
  section.className = 'about-teaser';
  section.innerHTML = `
    <div class="about-teaser__content">
      <div class="about-teaser__avatar">
        <img src="https://picsum.photos/seed/avatar-surprise/200/200" alt="Alessandro" class="about-teaser__avatar-img" loading="lazy">
      </div>
      <div class="about-teaser__text">
        <p class="about-teaser__quote">Viaggio per raccogliere storie, una foto alla volta.</p>
        <a href="#about" class="about-teaser__link">Scopri di piu &rarr;</a>
      </div>
    </div>
  `;
  container.appendChild(section);
};

/**
 * Renders the About page with bio, profile photo and social links.
 *
 * @param {HTMLElement} container - Parent element.
 */
function renderAboutView(container) {
  const published = trips.filter(t => t.published);
  const totalPhotos = published.reduce((sum, t) => sum + t.photos.length, 0);
  const countries = new Set(published.flatMap(t => t.tags)).size;

  container.innerHTML = `
    <section class="about">
      <div class="about__hero">
        <div class="about__avatar-wrapper">
          <img src="https://picsum.photos/seed/avatar-surprise/400/400" alt="Alessandro" class="about__avatar">
        </div>
        <h1 class="about__name">Alessandro Marcozzi</h1>
        <p class="about__role">Travel Photographer</p>
      </div>

      <div class="about__body">
        <div class="about__section">
          <h2 class="about__heading">Chi sono</h2>
          <p class="about__text">
            Fotografo per passione, viaggiatore per vocazione. Credo che ogni luogo abbia una storia da raccontare
            e che la fotografia sia il modo piu autentico per catturarla. Dai templi dorati del Giappone ai ghiacciai
            dell'Islanda, cerco la luce giusta per trasformare un momento in un ricordo eterno.
          </p>
          <p class="about__text">
            Surprise nasce come diario visivo dei miei viaggi: una raccolta di immagini, storie e punti di interesse
            che spero possano ispirare altri a esplorare il mondo con occhi curiosi.
          </p>
        </div>

        <div class="about__stats">
          <div class="about__stat">
            <span class="about__stat-value">${published.length}</span>
            <span class="about__stat-label">Viaggi</span>
          </div>
          <div class="about__stat">
            <span class="about__stat-value">${totalPhotos}</span>
            <span class="about__stat-label">Foto</span>
          </div>
          <div class="about__stat">
            <span class="about__stat-value">${countries}</span>
            <span class="about__stat-label">Tag</span>
          </div>
        </div>

        <div class="about__section">
          <h2 class="about__heading">Contatti</h2>
          <p class="about__text">
            Vuoi collaborare, chiedere informazioni su un viaggio o semplicemente fare due chiacchiere?
            Scrivimi o seguimi sui social.
          </p>
          <div class="about__socials">
            <a href="#" class="about__social" aria-label="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              <span>Instagram</span>
            </a>
            <a href="#" class="about__social" aria-label="GitHub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              <span>GitHub</span>
            </a>
            <a href="mailto:hello@surprise.travel" class="about__social" aria-label="Email">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>

      <div class="about__back">
        <a href="#" class="about__back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Torna alla home
        </a>
      </div>
    </section>
  `;
}

/**
 * Renders the admin view — login form or admin panel depending on session state.
 */
function renderAdminView() {
  stopSlideshow();
  document.title = 'Admin — Surprise';

  if (isAuthenticated()) {
    renderAdminPanel(mainContent, () => {
      /* Refresh public data that depends on trips (footer, etc.) */
      populateFooterTrips();
    });
    return;
  }

  renderLoginForm(mainContent, () => {
    renderAdminView();
  });
}

/**
 * Renders the 404 not-found page.
 */
function render404() {
  document.title = 'Pagina non trovata — Surprise';
  mainContent.innerHTML = `
    <section class="not-found">
      <h1 class="not-found__code">404</h1>
      <p class="not-found__message">La pagina che cerchi non esiste o e' stata spostata.</p>
      <a href="#" class="not-found__link">Torna alla home</a>
    </section>
  `;
}

/**
 * Renders the landing page with editorial layout.
 */
function renderLanding() {
  stopSlideshow();
  document.title = BASE_TITLE;
  mainContent.innerHTML = '';
  resetFilters();

  /* ── Hero slideshow ── */
  const heroImages = getHeroImages();
  const hero = document.createElement('section');
  hero.className = 'hero';

  hero.innerHTML = `
    <div class="hero__slides">
      ${heroImages.map((src, i) => `
        <div class="hero__slide ${i === 0 ? 'hero__slide--active' : ''}" style="background-image: url('${sanitizeMediaUrl(src)}')"></div>
      `).join('')}
    </div>
    <div class="hero__overlay"></div>
    <div class="hero__content">
      <h1 class="hero__title">Surprise</h1>
      <p class="hero__subtitle">Travel Photography</p>
    </div>
    <button class="hero__cta" aria-label="Scorri verso i viaggi">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  `;

  mainContent.appendChild(hero);

  /* Stats counters inside hero */
  const heroContent = hero.querySelector('.hero__content');
  renderStats(heroContent);

  startSlideshow(hero, heroImages);

  /* CTA scroll */
  hero.querySelector('.hero__cta').addEventListener('click', () => {
    const target = mainContent.querySelector('.featured-trip') || mainContent.querySelector('.trips-section');
    target?.scrollIntoView({ behavior: 'smooth' });
  });

  /* ── Latest trip featured ── */
  renderLatestTrip(mainContent);

  /* ── Moments strip ── */
  renderMomentsStrip(mainContent);

  /* ── Section title + Filter bar + Trip cards ── */
  const tripsSection = document.createElement('div');
  tripsSection.className = 'trips-section';
  tripsSection.innerHTML = '<h2 class="trips-section__title">Tutti i viaggi</h2>';
  mainContent.appendChild(tripsSection);

  renderFilterBar(tripsSection, () => {
    renderTripCards(tripsSection, getFilteredTrips());
  });
  renderTripCards(tripsSection, getFilteredTrips());

  /* ── About teaser ── */
  renderAboutTeaser(mainContent);
}

/**
 * Reads the current hash and renders the matching view.
 * Supports: landing (default), trip gallery (#trip/<id>), 404 for unknown routes.
 */
function route() {
  const hash = window.location.hash;
  updateNavFromHash(hash);
  window.scrollTo(0, 0);

  const render = () => {
    destroyMap();
    const tripMatch = hash.match(/^#trip\/(.+)$/);

    if (tripMatch) {
      const trip = trips.find(t => t.id === tripMatch[1] && t.published);
      if (trip) {
        stopSlideshow();
        document.title = `${trip.name} — Surprise`;
        renderTripGallery(mainContent, trip);
        return;
      }
      render404();
      return;
    }

    if (hash === '#search') {
      stopSlideshow();
      document.title = 'Cerca — Surprise';
      renderSearchView(mainContent);
      return;
    }

    if (hash === '#about') {
      stopSlideshow();
      document.title = 'Chi sono — Surprise';
      renderAboutView(mainContent);
      return;
    }

    if (hash === '#admin') {
      renderAdminView();
      return;
    }

    if (!hash || hash === '#' || hash === '') {
      renderLanding();
      return;
    }

    /* Unknown route → 404 */
    render404();
  };

  transitionView(render);
}

/**
 * Populates the footer "Viaggi recenti" list with the latest published trips.
 */
function populateFooterTrips() {
  const list = document.getElementById('footer-recent-trips');
  if (!list) return;

  const recent = trips
    .filter(t => t.published)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  list.innerHTML = recent.map(trip => `
    <li>
      <a href="#trip/${trip.id}" class="site-footer__link">
        <span class="site-footer__link-dot" style="background: ${escapeAttr(trip.color)}"></span>
        ${escapeHtml(trip.name)}
      </a>
    </li>
  `).join('');
}

/**
 * Bootstraps the application: theme, menu, routing.
 */
function init() {
  mainContent = document.getElementById('main-content');

  initTheme();
  initMenu();
  populateFooterTrips();

  mainContent.closest('body')
    .querySelector('.theme-toggle')
    .addEventListener('click', toggleTheme);

  document.querySelector('[data-skip-link]').addEventListener('click', (e) => {
    e.preventDefault();
    mainContent.focus();
    mainContent.scrollIntoView({ behavior: 'smooth' });
  });

  window.addEventListener('hashchange', route);

  /* First load: render directly without transition */
  const hash = window.location.hash;
  updateNavFromHash(hash);

  const tripMatch = hash.match(/^#trip\/(.+)$/);
  if (tripMatch) {
    const trip = trips.find(t => t.id === tripMatch[1] && t.published);
    if (trip) {
      document.title = `${trip.name} — Surprise`;
      renderTripGallery(mainContent, trip);
    } else {
      render404();
    }
  } else if (hash === '#search') {
    document.title = 'Cerca — Surprise';
    renderSearchView(mainContent);
  } else if (hash === '#about') {
    document.title = 'Chi sono — Surprise';
    renderAboutView(mainContent);
  } else if (hash === '#admin') {
    renderAdminView();
  } else if (!hash || hash === '#' || hash === '') {
    renderLanding();
  } else {
    render404();
  }
}

document.addEventListener('DOMContentLoaded', init);
