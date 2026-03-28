/**
 * Admin panel module — dashboard and trip editor.
 *
 * Provides a visual interface for managing trips with localStorage persistence.
 *
 * @module admin
 */

import { trips, saveTrips } from './data.js';
import { destroySession } from './auth.js';

/** Currently edited trip id (null = new trip form) */
let editingTripId = null;

/**
 * Collects all unique tags across every trip.
 *
 * @returns {string[]} Sorted array of unique tags.
 */
const getAllTags = () => {
  const tags = new Set();
  trips.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
  return [...tags].sort();
};

/**
 * Generates a URL-safe id from a trip name.
 *
 * @param {string} name - The trip name.
 * @returns {string} A lowercase, hyphenated id.
 */
const nameToId = (name) =>
  name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Renders the full admin panel (dashboard + trip list + editor).
 *
 * @param {HTMLElement} container - The parent element.
 * @param {Function}    onDataChange - Callback when trip data is modified.
 */
const renderAdminPanel = (container, onDataChange) => {
  editingTripId = null;
  const published = trips.filter(t => t.published);
  const drafts = trips.filter(t => !t.published);
  const totalPhotos = trips.reduce((sum, t) => sum + (t.photos?.length || 0), 0);
  const allTags = getAllTags();

  container.innerHTML = `
    <section class="admin-panel">
      <div class="admin-panel__header">
        <h1 class="admin-panel__title">Pannello Admin</h1>
        <button class="admin-panel__logout" aria-label="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>

      <!-- Dashboard -->
      <div class="admin-dash">
        <div class="admin-dash__card">
          <span class="admin-dash__value">${published.length}</span>
          <span class="admin-dash__label">Pubblicati</span>
        </div>
        <div class="admin-dash__card">
          <span class="admin-dash__value">${drafts.length}</span>
          <span class="admin-dash__label">Bozze</span>
        </div>
        <div class="admin-dash__card">
          <span class="admin-dash__value">${totalPhotos}</span>
          <span class="admin-dash__label">Foto</span>
        </div>
        <div class="admin-dash__card">
          <span class="admin-dash__value">${allTags.length}</span>
          <span class="admin-dash__label">Tag</span>
        </div>
      </div>

      <!-- Trip list -->
      <div class="admin-trips">
        <div class="admin-trips__head">
          <h2 class="admin-trips__title">Viaggi</h2>
          <button class="admin-trips__add" aria-label="Nuovo viaggio">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuovo viaggio
          </button>
        </div>
        <ul class="admin-trips__list">
          ${trips.map(t => renderTripRow(t)).join('')}
        </ul>
      </div>

      <!-- Editor area (shown when editing/creating) -->
      <div class="admin-editor" id="admin-editor" hidden></div>
    </section>
  `;

  /* Logout */
  container.querySelector('.admin-panel__logout').addEventListener('click', () => {
    destroySession();
    window.location.hash = '#';
  });

  /* New trip button */
  container.querySelector('.admin-trips__add').addEventListener('click', () => {
    showEditor(container, null, onDataChange);
  });

  /* Trip row actions via event delegation */
  container.querySelector('.admin-trips__list').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    const toggleBtn = e.target.closest('[data-action="toggle"]');

    if (editBtn) {
      showEditor(container, editBtn.dataset.id, onDataChange);
    }

    if (toggleBtn) {
      const trip = trips.find(t => t.id === toggleBtn.dataset.id);
      if (trip) {
        trip.published = !trip.published;
        saveTrips();
        onDataChange();
        renderAdminPanel(container, onDataChange);
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const trip = trips.find(t => t.id === id);
      if (trip && confirm(`Eliminare "${trip.name}"?`)) {
        const index = trips.findIndex(t => t.id === id);
        trips.splice(index, 1);
        saveTrips();
        onDataChange();
        renderAdminPanel(container, onDataChange);
      }
    }
  });
};

/**
 * Renders a single trip row for the admin list.
 *
 * @param {Object} trip - The trip object.
 * @returns {string} HTML string for the list item.
 */
const renderTripRow = (trip) => {
  const badge = trip.published
    ? '<span class="admin-badge admin-badge--pub">Pubblicato</span>'
    : '<span class="admin-badge admin-badge--draft">Bozza</span>';

  const photoCount = trip.photos?.length || 0;

  return `
    <li class="admin-trips__item">
      <span class="admin-trips__color" style="background: ${trip.color}"></span>
      <div class="admin-trips__info">
        <span class="admin-trips__name">${trip.name}</span>
        <span class="admin-trips__meta">${trip.date} · ${photoCount} foto</span>
      </div>
      ${badge}
      <div class="admin-trips__actions">
        <button class="admin-trips__btn" data-action="toggle" data-id="${trip.id}" aria-label="${trip.published ? 'Metti in bozza' : 'Pubblica'}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            ${trip.published
              ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/>'
              : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'}
          </svg>
        </button>
        <button class="admin-trips__btn" data-action="edit" data-id="${trip.id}" aria-label="Modifica ${trip.name}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="admin-trips__btn admin-trips__btn--danger" data-action="delete" data-id="${trip.id}" aria-label="Elimina ${trip.name}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </li>
  `;
};

/**
 * Shows the trip editor form for creating or editing a trip.
 *
 * @param {HTMLElement} container  - The admin panel container.
 * @param {string|null} tripId    - The trip id to edit, or null for a new trip.
 * @param {Function}    onDataChange - Callback when data is saved.
 */
const showEditor = (container, tripId, onDataChange) => {
  editingTripId = tripId;
  const trip = tripId ? trips.find(t => t.id === tripId) : null;
  const editorEl = container.querySelector('#admin-editor');
  const isNew = !trip;

  editorEl.hidden = false;
  editorEl.innerHTML = `
    <div class="admin-editor__card">
      <div class="admin-editor__head">
        <h2 class="admin-editor__title">${isNew ? 'Nuovo viaggio' : `Modifica: ${trip.name}`}</h2>
        <button class="admin-editor__close" aria-label="Chiudi editor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <form class="admin-editor__form" novalidate>
        <div class="admin-editor__row">
          <div class="admin-editor__field admin-editor__field--grow">
            <label for="trip-name" class="admin-editor__label">Nome</label>
            <input type="text" id="trip-name" class="admin-editor__input" value="${trip?.name || ''}" required>
          </div>
          <div class="admin-editor__field">
            <label for="trip-date" class="admin-editor__label">Data</label>
            <input type="month" id="trip-date" class="admin-editor__input" value="${trip?.date || ''}" required>
          </div>
          <div class="admin-editor__field">
            <label for="trip-color" class="admin-editor__label">Colore</label>
            <input type="color" id="trip-color" class="admin-editor__color" value="${trip?.color || '#E63946'}">
          </div>
        </div>

        <div class="admin-editor__field">
          <label for="trip-desc" class="admin-editor__label">Descrizione</label>
          <input type="text" id="trip-desc" class="admin-editor__input" value="${trip?.description || ''}">
        </div>

        <div class="admin-editor__row">
          <div class="admin-editor__field admin-editor__field--grow">
            <label for="trip-cover" class="admin-editor__label">Cover URL</label>
            <input type="text" id="trip-cover" class="admin-editor__input" value="${trip?.cover || ''}" placeholder="https://...">
          </div>
          <div class="admin-editor__field admin-editor__field--grow">
            <label for="trip-hero" class="admin-editor__label">Hero Image URL</label>
            <input type="text" id="trip-hero" class="admin-editor__input" value="${trip?.heroImage || ''}" placeholder="https://...">
          </div>
        </div>

        <div class="admin-editor__field">
          <label for="trip-tags" class="admin-editor__label">Tag (separati da virgola)</label>
          <input type="text" id="trip-tags" class="admin-editor__input" value="${trip?.tags?.join(', ') || ''}" placeholder="natura, europa, avventura">
        </div>

        <div class="admin-editor__field admin-editor__field--toggle">
          <label for="trip-published" class="admin-editor__label">Pubblicato</label>
          <label class="admin-toggle">
            <input type="checkbox" id="trip-published" ${trip?.published !== false ? 'checked' : ''}>
            <span class="admin-toggle__slider"></span>
          </label>
        </div>

        <div class="admin-editor__actions">
          <button type="button" class="admin-editor__cancel">Annulla</button>
          <button type="submit" class="admin-editor__save">${isNew ? 'Crea viaggio' : 'Salva modifiche'}</button>
        </div>
      </form>
    </div>
  `;

  /* Scroll editor into view */
  editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* Close / Cancel */
  const closeEditor = () => {
    editorEl.hidden = true;
    editorEl.innerHTML = '';
    editingTripId = null;
  };

  editorEl.querySelector('.admin-editor__close').addEventListener('click', closeEditor);
  editorEl.querySelector('.admin-editor__cancel').addEventListener('click', closeEditor);

  /* Save */
  editorEl.querySelector('.admin-editor__form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = editorEl.querySelector('#trip-name').value.trim();
    const date = editorEl.querySelector('#trip-date').value;
    const color = editorEl.querySelector('#trip-color').value;
    const description = editorEl.querySelector('#trip-desc').value.trim();
    const cover = editorEl.querySelector('#trip-cover').value.trim();
    const heroImage = editorEl.querySelector('#trip-hero').value.trim();
    const tagsRaw = editorEl.querySelector('#trip-tags').value;
    const published = editorEl.querySelector('#trip-published').checked;
    const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    if (!name || !date) return;

    if (isNew) {
      const id = nameToId(name);
      /* Prevent duplicate id */
      if (trips.some(t => t.id === id)) {
        alert(`Un viaggio con id "${id}" esiste gia.`);
        return;
      }
      trips.push({
        id,
        name,
        date,
        color,
        cover,
        heroImage,
        description,
        tags,
        published,
        sections: [],
        pois: [],
        photos: []
      });
    } else {
      const existing = trips.find(t => t.id === tripId);
      if (existing) {
        existing.name = name;
        existing.date = date;
        existing.color = color;
        existing.description = description;
        existing.cover = cover;
        existing.heroImage = heroImage;
        existing.tags = tags;
        existing.published = published;
      }
    }

    saveTrips();
    onDataChange();
    renderAdminPanel(container, onDataChange);
  });
};

export { renderAdminPanel };
