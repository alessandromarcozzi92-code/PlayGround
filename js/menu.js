import { trips } from './data.js';

const ICONS = {
  home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  trips: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
  search: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  admin: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
};

const NAV_ITEMS = [
  { id: 'home',    label: 'Home',    icon: ICONS.home },
  { id: 'trips',   label: 'Trips',   icon: ICONS.trips, hasSubmenu: true },
  { id: 'search',  label: 'Search',  icon: ICONS.search },
  { id: 'admin',   label: 'Admin',   icon: ICONS.admin }
];

let tripsPanel = null;

function buildBottomNav() {
  const nav = document.querySelector('.bottomnav');

  NAV_ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'bottomnav__item';
    if (item.id === 'home') btn.classList.add('bottomnav__item--active');
    btn.dataset.nav = item.id;
    btn.setAttribute('aria-label', item.label);
    btn.innerHTML = item.icon;

    // Hover submenu behavior
    if (item.hasSubmenu) {
      btn.classList.add('bottomnav__item--has-submenu');
      btn.addEventListener('mouseenter', () => openTripsPanel());
      btn.addEventListener('mouseleave', () => {
        // Don't close if moving to the panel
        setTimeout(() => {
          if (!tripsPanel.matches(':hover') && !btn.matches(':hover')) {
            closeTripsPanel();
          }
        }, 100);
      });
    }

    nav.appendChild(btn);
  });

  // Trips floating panel
  tripsPanel = document.createElement('div');
  tripsPanel.className = 'trips-panel';
  tripsPanel.innerHTML = trips.filter(t => t.published).map(trip => `
    <a href="#trip/${trip.id}" class="trips-panel__link">
      <span class="trips-panel__dot" style="background-color: ${trip.color}"></span>
      ${trip.name}
    </a>
  `).join('');

  // Close panel when mouse leaves it
  tripsPanel.addEventListener('mouseleave', () => {
    const tripsBtn = nav.querySelector('[data-nav="trips"]');
    setTimeout(() => {
      if (!tripsPanel.matches(':hover') && !tripsBtn.matches(':hover')) {
        closeTripsPanel();
      }
    }, 100);
  });

  nav.appendChild(tripsPanel);

  nav.addEventListener('click', handleNavClick);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.bottomnav')) closeTripsPanel();
  });
}

function handleNavClick(e) {
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
  } else if (id === 'admin') {
    window.location.hash = 'admin';
  }
  // search: handled in future step
}

function setActiveNav(id) {
  document.querySelectorAll('.bottomnav__item').forEach(btn => {
    btn.classList.toggle('bottomnav__item--active', btn.dataset.nav === id);
  });
}

function openTripsPanel() {
  if (tripsPanel) {
    tripsPanel.classList.add('trips-panel--open');
    setActiveNav('trips');
  }
}

function toggleTripsPanel() {
  const open = tripsPanel.classList.toggle('trips-panel--open');
  if (open) setActiveNav('trips');
}

function closeTripsPanel() {
  if (tripsPanel) tripsPanel.classList.remove('trips-panel--open');
}

// --- Public API ---
export function updateNavFromHash(hash) {
  closeTripsPanel();
  if (!hash || hash === '#' || hash === '') {
    setActiveNav('home');
  } else if (hash.startsWith('#trip/')) {
    setActiveNav('trips');
  } else if (hash === '#admin') {
    setActiveNav('admin');
  }
}

export function initMenu() {
  buildBottomNav();
  updateNavFromHash(window.location.hash);
}
