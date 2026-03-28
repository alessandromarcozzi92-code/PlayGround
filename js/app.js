import { trips } from './data.js';
import { initTheme, toggleTheme } from './theme.js';
import { initMenu, updateNavFromHash } from './menu.js';
import { renderTripCards, renderTripGallery } from './gallery.js';

/** @type {HTMLElement} */
let mainContent;

/**
 * Renders the landing page with hero section and trip cards.
 */
function renderLanding() {
  mainContent.innerHTML = '';

  const hero = document.createElement('section');
  hero.className = 'hero';
  hero.innerHTML = `
    <h1 class="hero__title">Surprise</h1>
    <p class="hero__subtitle">Travel Photography</p>
  `;

  mainContent.appendChild(hero);
  renderTripCards(mainContent);
}

/**
 * Reads the current hash and renders the matching view.
 * Supports: landing (default), trip gallery (#trip/<id>).
 */
function route() {
  const hash = window.location.hash;
  updateNavFromHash(hash);
  window.scrollTo(0, 0);

  const tripMatch = hash.match(/^#trip\/(.+)$/);

  if (tripMatch) {
    const trip = trips.find(t => t.id === tripMatch[1] && t.published);
    if (trip) {
      renderTripGallery(mainContent, trip);
      return;
    }
  }

  renderLanding();
}

/**
 * Bootstraps the application: theme, menu, routing.
 */
function init() {
  mainContent = document.getElementById('main-content');

  initTheme();
  initMenu();

  mainContent.closest('body')
    .querySelector('.theme-toggle')
    .addEventListener('click', toggleTheme);

  window.addEventListener('hashchange', route);
  route();
}

document.addEventListener('DOMContentLoaded', init);
