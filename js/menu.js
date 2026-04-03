import { trips } from './data.js';
import { escapeHtml, escapeAttr } from './utils/sanitize.js';

const ICONS = {
  home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  trips: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
  search: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  about: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  admin: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
};

const NAV_ITEMS = [
  { id: 'home',   label: 'Home',   icon: ICONS.home },
  { id: 'trips',  label: 'Trips',  icon: ICONS.trips, hasSubmenu: true },
  { id: 'search', label: 'Search', icon: ICONS.search },
  { id: 'about',  label: 'About',  icon: ICONS.about },
  { id: 'admin',  label: 'Admin',  icon: ICONS.admin }
];

const PANEL_CLOSE_DELAY_MS = 100;

/** @type {HTMLElement|null} */
let tripsPanel = null;

/** @type {HTMLElement|null} */
let nav = null;

/**
 * Builds the bottom navigation bar and the trips floating panel.
 */
const buildBottomNav = () => {
  nav = document.querySelector('.bottomnav');

  NAV_ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'bottomnav__item';
    if (item.id === 'home') btn.classList.add('bottomnav__item--active');
    btn.dataset.nav = item.id;
    btn.setAttribute('aria-label', item.label);
    btn.innerHTML = item.icon;

    if (item.hasSubmenu) {
      btn.classList.add('bottomnav__item--has-submenu');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'trips-panel');
      btn.addEventListener('mouseenter', openTripsPanel);
      btn.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!tripsPanel?.matches(':hover') && !btn.matches(':hover')) {
            closeTripsPanel();
          }
        }, PANEL_CLOSE_DELAY_MS);
      });
    }

    nav.appendChild(btn);
  });

  tripsPanel = document.createElement('div');
  tripsPanel.className = 'trips-panel';
  tripsPanel.id = 'trips-panel';
  tripsPanel.setAttribute('role', 'menu');
  tripsPanel.setAttribute('aria-label', 'Lista viaggi');
  tripsPanel.innerHTML = trips.filter(t => t.published).map(trip => `
    <a href="#trip/${trip.id}" class="trips-panel__link" role="menuitem">
      <span class="trips-panel__dot" style="background-color: ${escapeAttr(trip.color)}"></span>
      ${escapeHtml(trip.name)}
    </a>
  `).join('');

  tripsPanel.addEventListener('mouseleave', () => {
    const tripsBtn = nav.querySelector('[data-nav="trips"]');
    setTimeout(() => {
      if (!tripsPanel?.matches(':hover') && !tripsBtn?.matches(':hover')) {
        closeTripsPanel();
      }
    }, PANEL_CLOSE_DELAY_MS);
  });

  nav.appendChild(tripsPanel);
  nav.addEventListener('click', handleNavClick);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.bottomnav')) closeTripsPanel();
  });
};

/**
 * Handles click events within the bottom nav using event delegation.
 *
 * @param {MouseEvent} e - The click event.
 */
const handleNavClick = (e) => {
  const link = e.target.closest('.trips-panel__link');
  if (link) {
    closeTripsPanel();
    return;
  }

  const item = e.target.closest('.bottomnav__item');
  if (!item) return;

  const id = item.dataset.nav;

  if (id === 'trips') {
    toggleTripsPanel();
    return;
  }

  closeTripsPanel();
  setActiveNav(id);

  if (id === 'home') {
    window.location.hash = '';
  } else if (id === 'search') {
    window.location.hash = 'search';
  } else if (id === 'about') {
    window.location.hash = 'about';
  } else if (id === 'admin') {
    window.location.hash = 'admin';
  }
};

/**
 * Highlights the active nav item matching the given id.
 *
 * @param {string} id - The nav item identifier.
 */
const setActiveNav = (id) => {
  nav?.querySelectorAll('.bottomnav__item').forEach(btn => {
    btn.classList.toggle('bottomnav__item--active', btn.dataset.nav === id);
  });
};

/**
 * Opens the trips floating panel.
 */
const openTripsPanel = () => {
  tripsPanel?.classList.add('trips-panel--open');
  updateTripsExpanded(true);
  setActiveNav('trips');
};

/**
 * Toggles the trips floating panel open/closed.
 */
const toggleTripsPanel = () => {
  const isOpen = tripsPanel?.classList.toggle('trips-panel--open');
  updateTripsExpanded(!!isOpen);
  if (isOpen) setActiveNav('trips');
};

/**
 * Closes the trips floating panel.
 */
const closeTripsPanel = () => {
  tripsPanel?.classList.remove('trips-panel--open');
  updateTripsExpanded(false);
};

/**
 * Syncs the aria-expanded attribute on the trips toggle button.
 *
 * @param {boolean} expanded - Whether the panel is open.
 */
const updateTripsExpanded = (expanded) => {
  nav?.querySelector('[data-nav="trips"]')?.setAttribute('aria-expanded', String(expanded));
};

/**
 * Updates the active nav item based on the current URL hash.
 *
 * @param {string} hash - The current location hash.
 */
export const updateNavFromHash = (hash) => {
  closeTripsPanel();
  if (!hash || hash === '#' || hash === '') {
    setActiveNav('home');
  } else if (hash.startsWith('#trip/')) {
    setActiveNav('trips');
  } else if (hash === '#search') {
    setActiveNav('search');
  } else if (hash === '#about') {
    setActiveNav('about');
  } else if (hash === '#admin') {
    setActiveNav('admin');
  }
};

/**
 * Initializes the navigation: builds the DOM and syncs with the current hash.
 */
export const initMenu = () => {
  buildBottomNav();
  updateNavFromHash(window.location.hash);
};
