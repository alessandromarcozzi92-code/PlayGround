import { trips } from './data.js';
import { initTheme, toggleTheme } from './theme.js';
import { initMenu, updateNavFromHash } from './menu.js';

function renderLanding() {
  const main = document.getElementById('main-content');

  const hero = document.createElement('section');
  hero.className = 'hero';
  hero.innerHTML = `
    <h1 class="hero__title">Surprise</h1>
    <p class="hero__subtitle">Travel Photography</p>
  `;

  const grid = document.createElement('section');
  grid.className = 'trips-grid';

  trips.filter(t => t.published).forEach(trip => {
    const card = document.createElement('article');
    card.className = 'trip-card';
    card.style.setProperty('--trip-color', trip.color);
    card.innerHTML = `
      <div class="trip-card__image-wrapper">
        <img src="${trip.cover}" alt="${trip.name}" class="trip-card__image">
      </div>
      <div class="trip-card__info">
        <h2 class="trip-card__name">${trip.name}</h2>
        <p class="trip-card__description">${trip.description}</p>
        <time class="trip-card__date">${trip.date}</time>
      </div>
    `;
    grid.appendChild(card);
  });

  main.innerHTML = '';
  main.appendChild(hero);
  main.appendChild(grid);
}

function onHashChange() {
  const hash = window.location.hash;
  updateNavFromHash(hash);
  // Routing will be expanded in future steps
  renderLanding();
}

function init() {
  initTheme();
  initMenu();
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
  window.addEventListener('hashchange', onHashChange);
  renderLanding();
}

document.addEventListener('DOMContentLoaded', init);
