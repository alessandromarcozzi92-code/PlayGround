/**
 * Dashboard tab — stats overview, trip list, trip editor form, and data management.
 *
 * @module admin/dashboard
 */

import { trips, saveTrips, defaultTrips } from '../data.js';
import { escAttr, nameToId, svg, showToast, getAllTags } from './helpers.js';
import { isValidMediaUrl } from '../utils/sanitize.js';

/* ─── Trip row ─── */

/**
 * Renders a single trip row in the admin trip list.
 *
 * @param {Object} trip - Trip object.
 * @returns {string} HTML markup for the trip row.
 */
const renderTripRow = (trip) => {
  const badge = trip.published
    ? '<span class="admin-badge admin-badge--pub">Pubblicato</span>'
    : '<span class="admin-badge admin-badge--draft">Bozza</span>';

  return `
    <li class="admin-trips__item">
      <span class="admin-trips__color" style="background: ${trip.color}"></span>
      <div class="admin-trips__info">
        <span class="admin-trips__name">${escAttr(trip.name)}</span>
        <span class="admin-trips__meta">${trip.date} · ${trip.photos?.length || 0} foto</span>
      </div>
      ${badge}
      <div class="admin-trips__actions">
        <button class="admin-trips__btn" data-action="toggle" data-id="${trip.id}" aria-label="${trip.published ? 'Metti in bozza' : 'Pubblica'}">
          ${trip.published ? svg('eyeOff') : svg('eye')}
        </button>
        <button class="admin-trips__btn" data-action="edit" data-id="${trip.id}" aria-label="Modifica ${escAttr(trip.name)}">
          ${svg('edit')}
        </button>
        <button class="admin-trips__btn admin-trips__btn--danger" data-action="delete" data-id="${trip.id}" aria-label="Elimina ${escAttr(trip.name)}">
          ${svg('trash')}
        </button>
      </div>
    </li>
  `;
};

/* ─── Trip editor ─── */

/**
 * Opens the inline trip editor form for creating or editing a trip.
 *
 * @param {HTMLElement} tabEl         - Dashboard tab container.
 * @param {string|null} tripId       - Trip id to edit, or null for new trip.
 * @param {Function}    onDataChange - Callback after data mutation.
 * @param {HTMLElement} rootContainer - Root admin container for full re-renders.
 * @param {Function}    renderPanel  - Function to re-render the entire admin panel.
 */
const showEditor = (tabEl, tripId, onDataChange, rootContainer, renderPanel) => {
  const trip = tripId ? trips.find(t => t.id === tripId) : null;
  const editorEl = tabEl.querySelector('#admin-editor');
  const isNew = !trip;

  editorEl.hidden = false;
  editorEl.innerHTML = `
    <div class="admin-editor__card">
      <div class="admin-editor__head">
        <h2 class="admin-editor__title">${isNew ? 'Nuovo viaggio' : `Modifica: ${escAttr(trip.name)}`}</h2>
        <button class="admin-editor__close" aria-label="Chiudi editor">${svg('close', 20)}</button>
      </div>
      <form class="admin-editor__form" novalidate>
        <div class="admin-editor__row">
          <div class="admin-editor__field admin-editor__field--grow">
            <label for="trip-name" class="admin-editor__label">Nome</label>
            <input type="text" id="trip-name" class="admin-editor__input" value="${escAttr(trip?.name)}" required>
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
          <input type="text" id="trip-desc" class="admin-editor__input" value="${escAttr(trip?.description)}">
        </div>
        <div class="admin-editor__row">
          <div class="admin-editor__field admin-editor__field--grow">
            <label for="trip-cover" class="admin-editor__label">Cover URL</label>
            <input type="text" id="trip-cover" class="admin-editor__input" value="${escAttr(trip?.cover)}" placeholder="https://...">
          </div>
          <div class="admin-editor__field admin-editor__field--grow">
            <label for="trip-hero" class="admin-editor__label">Hero Image URL</label>
            <input type="text" id="trip-hero" class="admin-editor__input" value="${escAttr(trip?.heroImage)}" placeholder="https://...">
          </div>
        </div>
        <div class="admin-editor__field">
          <label for="trip-tags" class="admin-editor__label">Tag (separati da virgola)</label>
          <input type="text" id="trip-tags" class="admin-editor__input" value="${escAttr(trip?.tags?.join(', '))}" placeholder="natura, europa, avventura">
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

  editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const closeEditor = () => { editorEl.hidden = true; editorEl.innerHTML = ''; };
  editorEl.querySelector('.admin-editor__close').addEventListener('click', closeEditor);
  editorEl.querySelector('.admin-editor__cancel').addEventListener('click', closeEditor);

  editorEl.querySelector('.admin-editor__form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = editorEl.querySelector('#trip-name').value.trim();
    const date = editorEl.querySelector('#trip-date').value;
    const color = editorEl.querySelector('#trip-color').value;
    const description = editorEl.querySelector('#trip-desc').value.trim();
    const cover = editorEl.querySelector('#trip-cover').value.trim();
    const heroImage = editorEl.querySelector('#trip-hero').value.trim();
    const tags = editorEl.querySelector('#trip-tags').value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const published = editorEl.querySelector('#trip-published').checked;

    if (!name || !date) return;

    if (isNew) {
      const id = nameToId(name);
      if (trips.some(t => t.id === id)) { alert(`Un viaggio con id "${id}" esiste gia.`); return; }
      trips.push({ id, name, date, color, cover, heroImage, description, tags, published, sections: [], pois: [], photos: [] });
    } else {
      Object.assign(trips.find(t => t.id === tripId), { name, date, color, description, cover, heroImage, tags, published });
    }

    saveTrips();
    onDataChange();
    renderPanel(rootContainer, onDataChange);
  });
};

/* ─── Dashboard tab renderer ─── */

/**
 * Renders the dashboard tab content: stats cards, trip list, data management, and editor.
 *
 * @param {HTMLElement} tabEl         - Tab content container.
 * @param {HTMLElement} container     - Root admin container.
 * @param {Function}    onDataChange - Callback after data mutation.
 * @param {Function}    renderPanel  - Function to re-render the entire admin panel.
 */
const renderDashboardTab = (tabEl, container, onDataChange, renderPanel) => {
  const published = trips.filter(t => t.published);
  const drafts = trips.filter(t => !t.published);
  const totalPhotos = trips.reduce((sum, t) => sum + (t.photos?.length || 0), 0);
  const allTags = getAllTags(trips);

  tabEl.innerHTML = `
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

    <div class="admin-trips">
      <div class="admin-trips__head">
        <h2 class="admin-trips__title">Viaggi</h2>
        <button class="admin-trips__add" aria-label="Nuovo viaggio">
          ${svg('plus', 18)} Nuovo viaggio
        </button>
      </div>
      <ul class="admin-trips__list">
        ${trips.map(t => renderTripRow(t)).join('')}
      </ul>
    </div>

    <div class="admin-data">
      <h2 class="admin-data__title">Gestione dati</h2>
      <div class="admin-data__actions">
        <button class="admin-data__btn" id="btn-export" aria-label="Esporta backup JSON">
          ${svg('download', 18)} Esporta JSON
        </button>
        <button class="admin-data__btn" id="btn-import" aria-label="Importa backup JSON">
          ${svg('upload', 18)} Importa JSON
        </button>
        <button class="admin-data__btn admin-data__btn--danger" id="btn-reset" aria-label="Ripristina dati originali">
          ${svg('refresh', 18)} Reset default
        </button>
      </div>
      <input type="file" id="import-file" accept=".json" hidden>
    </div>

    <div class="admin-editor" id="admin-editor" hidden></div>
  `;

  /* ─── Data management handlers ─── */

  tabEl.querySelector('#btn-export').addEventListener('click', () => {
    const json = JSON.stringify(trips, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `trips-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(tabEl, 'Backup esportato con successo');
  });

  const fileInput = tabEl.querySelector('#import-file');
  tabEl.querySelector('#btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('Il file deve contenere un array');
        for (const item of data) {
          if (!item.id || !item.name || !item.date) {
            throw new Error(`Viaggio non valido: mancano campi obbligatori (id, name, date)`);
          }

          /* Validate media URLs to block javascript: and dangerous schemes */
          const urlFields = [item.cover, item.heroImage].filter(Boolean);
          item.photos?.forEach(p => { if (p.src) urlFields.push(p.src); });
          item.sections?.forEach(s => { if (s.media?.src) urlFields.push(s.media.src); });

          const badUrl = urlFields.find(u => !isValidMediaUrl(u));
          if (badUrl) {
            throw new Error(`URL non valido o pericoloso in "${item.name}": ${badUrl}`);
          }
        }
        if (!confirm(`Importare ${data.length} viaggi? I dati attuali verranno sovrascritti.`)) return;
        trips.length = 0;
        trips.push(...data);
        saveTrips();
        onDataChange();
        renderPanel(container, onDataChange);
        showToast(container.querySelector('#admin-tab-content'), `${data.length} viaggi importati con successo`);
      } catch (err) {
        showToast(tabEl, `Errore importazione: ${err.message}`, true);
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  tabEl.querySelector('#btn-reset').addEventListener('click', () => {
    if (!confirm('Ripristinare i dati originali? I dati attuali verranno persi.')) return;
    trips.length = 0;
    trips.push(...structuredClone(defaultTrips));
    saveTrips();
    onDataChange();
    renderPanel(container, onDataChange);
    showToast(container.querySelector('#admin-tab-content'), 'Dati ripristinati ai valori originali');
  });

  tabEl.querySelector('.admin-trips__add').addEventListener('click', () => {
    showEditor(tabEl, null, onDataChange, container, renderPanel);
  });

  tabEl.querySelector('.admin-trips__list').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    const toggleBtn = e.target.closest('[data-action="toggle"]');

    if (editBtn) showEditor(tabEl, editBtn.dataset.id, onDataChange, container, renderPanel);

    if (toggleBtn) {
      const trip = trips.find(t => t.id === toggleBtn.dataset.id);
      if (trip) {
        trip.published = !trip.published;
        saveTrips();
        onDataChange();
        renderPanel(container, onDataChange);
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const trip = trips.find(t => t.id === id);
      if (trip && confirm(`Eliminare "${trip.name}"?`)) {
        trips.splice(trips.findIndex(t => t.id === id), 1);
        saveTrips();
        onDataChange();
        renderPanel(container, onDataChange);
      }
    }
  });
};

export { renderDashboardTab };
