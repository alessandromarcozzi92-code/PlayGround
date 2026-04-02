/**
 * Photos tab — grid-based photo organizer with drag-and-drop, caption editing,
 * cover selection, and broken image checker.
 *
 * @module admin/photo-organizer
 */

import { trips, saveTrips } from '../data.js';
import { escAttr, svg, renderTripPicker, bindTripPicker } from './helpers.js';

/** Drag-and-drop source index */
let dragSrcIndex = null;

/** AbortController to prevent stacked event listeners on re-render */
let photoAbort = null;

/**
 * Renders the photos tab with trip picker and photo grid.
 *
 * @param {HTMLElement} tabEl         - Tab content container.
 * @param {Object}      selectedTrip  - Mutable selected trip state.
 * @param {HTMLElement} rootContainer - Root admin container.
 * @param {Function}    onDataChange  - Callback after data mutation.
 */
const renderPhotosTab = (tabEl, selectedTrip, rootContainer, onDataChange) => {
  tabEl.innerHTML = `
    <div class="admin-sub">
      <div class="admin-sub__header">
        <h2 class="admin-sub__title">${svg('photo', 20)} Photo Organizer</h2>
        <p class="admin-sub__desc">Riordina, organizza e gestisci le foto di ogni viaggio</p>
      </div>
      ${renderTripPicker(trips, selectedTrip.photos, 'photos')}
      <div class="tp-content"></div>
    </div>
  `;

  bindTripPicker(tabEl, 'photos', selectedTrip, trips, rootContainer, onDataChange, renderPhotoContent);

  if (selectedTrip.photos) {
    const trip = trips.find(t => t.id === selectedTrip.photos);
    if (trip) renderPhotoContent(tabEl.querySelector('.tp-content'), trip, rootContainer, onDataChange);
  }
};

/**
 * Renders the photo grid and controls for a selected trip.
 *
 * @param {HTMLElement} area          - Content area inside the tab.
 * @param {Object}      trip          - Selected trip object.
 * @param {HTMLElement} rootContainer - Root admin container.
 * @param {Function}    onDataChange  - Callback after data mutation.
 */
const renderPhotoContent = (area, trip, rootContainer, onDataChange) => {
  if (photoAbort) photoAbort.abort();
  photoAbort = new AbortController();
  const { signal } = photoAbort;

  if (!trip.photos) trip.photos = [];
  const photos = trip.photos;

  area.innerHTML = `
    <div class="photo-org">
      <div class="photo-org__toolbar">
        <span class="photo-org__count">${photos.length} foto</span>
        <div class="photo-org__btns">
          <button class="photo-org__check-btn" id="photo-check-btn">${svg('alert', 14)} Verifica</button>
          <button class="photo-org__add-btn" id="photo-add-btn">${svg('plus', 14)} Aggiungi</button>
        </div>
      </div>

      ${photos.length === 0 ? `
        <div class="admin-empty-state">
          <div class="admin-empty-state__icon">${svg('photo', 40)}</div>
          <p class="admin-empty-state__text">Nessuna foto</p>
          <p class="admin-empty-state__hint">Aggiungi foto per creare la galleria di questo viaggio</p>
        </div>
      ` : ''}

      <div class="photo-org__grid" id="photo-grid">
        ${photos.map((photo, i) => `
          <div class="photo-card ${trip.cover === photo.src ? 'photo-card--cover' : ''}" data-idx="${i}" draggable="true">
            <div class="photo-card__img-wrap">
              <img src="${escAttr(photo.src)}" alt="${escAttr(photo.caption)}" class="photo-card__img" loading="lazy"
                onerror="this.classList.add('photo-card__img--broken')">
              <div class="photo-card__overlay">
                <span class="photo-card__idx">${i + 1}</span>
                ${trip.cover === photo.src ? `<span class="photo-card__cover-tag">${svg('star', 11)} Cover</span>` : ''}
              </div>
              <div class="photo-card__drag-handle" aria-hidden="true">${svg('grip', 14)}</div>
            </div>
            <div class="photo-card__footer">
              <input type="text" class="photo-card__caption" data-idx="${i}" value="${escAttr(photo.caption)}" placeholder="Aggiungi caption...">
              <div class="photo-card__actions">
                <button class="photo-card__btn ${trip.cover === photo.src ? 'photo-card__btn--active' : ''}" data-photo-action="cover" data-idx="${i}" title="Cover">${svg('star', 13)}</button>
                <button class="photo-card__btn" data-photo-action="up" data-idx="${i}" ${i === 0 ? 'disabled' : ''} title="Su">${svg('up', 13)}</button>
                <button class="photo-card__btn" data-photo-action="down" data-idx="${i}" ${i === photos.length - 1 ? 'disabled' : ''} title="Giu">${svg('down', 13)}</button>
                <button class="photo-card__btn photo-card__btn--danger" data-photo-action="delete" data-idx="${i}" title="Elimina">${svg('trash', 13)}</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  /* Caption editing */
  area.addEventListener('input', (e) => {
    const input = e.target.closest('.photo-card__caption');
    if (!input) return;
    const idx = Number(input.dataset.idx);
    if (photos[idx]) {
      photos[idx].caption = input.value;
      clearTimeout(input._saveTimer);
      input._saveTimer = setTimeout(() => { saveTrips(); onDataChange(); }, 400);
    }
  }, { signal });

  /* Button actions */
  area.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-photo-action]');
    if (!btn) return;
    const action = btn.dataset.photoAction;
    const idx = Number(btn.dataset.idx);

    if (action === 'up' && idx > 0) [photos[idx - 1], photos[idx]] = [photos[idx], photos[idx - 1]];
    else if (action === 'down' && idx < photos.length - 1) [photos[idx], photos[idx + 1]] = [photos[idx + 1], photos[idx]];
    else if (action === 'delete') { if (!confirm('Eliminare questa foto?')) return; photos.splice(idx, 1); }
    else if (action === 'cover') trip.cover = photos[idx].src;
    else return;

    saveTrips();
    onDataChange();
    renderPhotoContent(area, trip, rootContainer, onDataChange);
  }, { signal });

  /* Add photo */
  area.querySelector('#photo-add-btn').addEventListener('click', () => {
    const src = prompt('URL della foto:');
    if (!src) return;
    const caption = prompt('Caption (opzionale):') || '';
    photos.push({ src: src.trim(), caption: caption.trim() });
    saveTrips();
    onDataChange();
    renderPhotoContent(area, trip, rootContainer, onDataChange);
  }, { signal });

  /* Broken checker */
  area.querySelector('#photo-check-btn').addEventListener('click', () => {
    let brokenCount = 0;
    area.querySelectorAll('.photo-card__img').forEach(img => {
      if (img.naturalWidth === 0 || img.classList.contains('photo-card__img--broken')) {
        img.closest('.photo-card').classList.add('photo-card--broken');
        brokenCount++;
      }
    });
    alert(brokenCount === 0 ? 'Tutte le immagini sono valide!' : `${brokenCount} immagine/i rotta/e evidenziata/e.`);
  }, { signal });

  /* Drag & drop */
  const grid = area.querySelector('#photo-grid');
  if (!grid) return;

  grid.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.photo-card');
    if (!card) return;
    dragSrcIndex = Number(card.dataset.idx);
    card.classList.add('photo-card--dragging');
    e.dataTransfer.effectAllowed = 'move';
  }, { signal });

  grid.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.photo-card');
    if (card) card.classList.add('photo-card--dragover');
  }, { signal });

  grid.addEventListener('dragleave', (e) => {
    const card = e.target.closest('.photo-card');
    if (card) card.classList.remove('photo-card--dragover');
  }, { signal });

  grid.addEventListener('drop', (e) => {
    e.preventDefault();
    const card = e.target.closest('.photo-card');
    if (!card) return;
    card.classList.remove('photo-card--dragover');
    const dropIdx = Number(card.dataset.idx);
    if (dragSrcIndex === null || dragSrcIndex === dropIdx) return;

    const [moved] = photos.splice(dragSrcIndex, 1);
    photos.splice(dropIdx, 0, moved);
    dragSrcIndex = null;
    saveTrips();
    onDataChange();
    renderPhotoContent(area, trip, rootContainer, onDataChange);
  }, { signal });

  grid.addEventListener('dragend', () => {
    dragSrcIndex = null;
    grid.querySelectorAll('.photo-card--dragging').forEach(c => c.classList.remove('photo-card--dragging'));
  }, { signal });
};

export { renderPhotosTab };
