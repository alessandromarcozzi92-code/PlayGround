/**
 * Shared helpers, icons, and utilities for the admin panel modules.
 *
 * @module admin/helpers
 */

/* ─── Utility functions ─── */

/**
 * Collects all unique tags from every trip, sorted alphabetically.
 *
 * @param {Object[]} trips - Array of trip objects.
 * @returns {string[]} Sorted array of unique tags.
 */
const getAllTags = (trips) => {
  const tags = new Set();
  trips.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
  return [...tags].sort();
};

/**
 * Converts a human-readable name to a URL-safe kebab-case id.
 *
 * @param {string} name - The name to convert.
 * @returns {string} URL-safe id.
 */
const nameToId = (name) =>
  name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Escapes a string for safe use inside HTML attributes.
 *
 * @param {string} str - The string to escape.
 * @returns {string} Escaped string.
 */
const escAttr = (str) => String(str ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Available POI icon categories */
const POI_ICONS = ['temple', 'city', 'nature', 'food', 'beach', 'hotel', 'museum', 'default'];

/**
 * Shows a temporary toast notification inside a container.
 *
 * @param {HTMLElement} parent  - Container to prepend the toast to.
 * @param {string}      message - Message to display.
 * @param {boolean}     isError - Whether this is an error toast.
 */
const showToast = (parent, message, isError = false) => {
  const existing = parent.querySelector('.admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `admin-toast ${isError ? 'admin-toast--error' : ''}`;
  toast.textContent = message;
  parent.prepend(toast);
  setTimeout(() => toast.remove(), 3500);
};

/* ─── SVG icon helpers ─── */

/** @type {Record<string, string>} SVG path data keyed by icon name */
const icons = {
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/>',
  up: '<polyline points="18 15 12 9 6 15"/>',
  down: '<polyline points="6 9 12 15 18 9"/>',
  photo: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  sections: '<line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  chevDown: '<polyline points="6 9 12 15 18 9"/>',
  chevRight: '<polyline points="9 18 15 12 9 6"/>',
  grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
};

/**
 * Generates an inline SVG element string for a given icon name.
 *
 * @param {string} name - Icon name (key in the icons map).
 * @param {number} size - Width and height of the SVG.
 * @returns {string} SVG markup string.
 */
const svg = (name, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

/* ─── Trip Picker (shared widget) ─── */

/**
 * Renders a horizontal chip picker for selecting a trip within a tab.
 *
 * @param {Object[]}    trips      - Array of trip objects.
 * @param {string|null} selectedId - Currently selected trip id.
 * @param {string}      tabKey     - Tab identifier (sections, photos, pois).
 * @returns {string} HTML markup.
 */
const renderTripPicker = (trips, selectedId, tabKey) => `
  <div class="tp-picker">
    ${trips.map(t => `
      <button class="tp-chip ${t.id === selectedId ? 'tp-chip--active' : ''}" data-pick-trip="${t.id}">
        <span class="tp-chip__dot" style="background:${t.color}"></span>
        <span class="tp-chip__name">${escAttr(t.name)}</span>
        <span class="tp-chip__meta">${
          tabKey === 'sections' ? `${t.sections?.length || 0} sez.` :
          tabKey === 'photos' ? `${t.photos?.length || 0} foto` :
          `${t.pois?.length || 0} POI`
        }</span>
      </button>
    `).join('')}
  </div>
`;

/**
 * Binds click events on trip picker chips to select a trip and render content.
 *
 * @param {HTMLElement}  tabEl         - Tab content container.
 * @param {string}       tabKey        - Tab identifier.
 * @param {Object}       selectedTrip  - Mutable selected trip state object.
 * @param {Object[]}     trips         - Array of trip objects.
 * @param {HTMLElement}  rootContainer - Root admin container for full re-renders.
 * @param {Function}     onDataChange  - Callback after data mutation.
 * @param {Function}     renderContent - Content renderer for the selected trip.
 */
const bindTripPicker = (tabEl, tabKey, selectedTrip, trips, rootContainer, onDataChange, renderContent) => {
  tabEl.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-pick-trip]');
    if (!chip) return;
    selectedTrip[tabKey] = chip.dataset.pickTrip;
    const trip = trips.find(t => t.id === selectedTrip[tabKey]);
    if (!trip) return;

    tabEl.querySelectorAll('.tp-chip').forEach(c => c.classList.remove('tp-chip--active'));
    chip.classList.add('tp-chip--active');

    const contentArea = tabEl.querySelector('.tp-content');
    renderContent(contentArea, trip, rootContainer, onDataChange);
  });
};

export {
  getAllTags,
  nameToId,
  escAttr,
  POI_ICONS,
  showToast,
  icons,
  svg,
  renderTripPicker,
  bindTripPicker,
};
