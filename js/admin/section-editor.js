/**
 * Sections tab — narrative split-section editor with collapse, reorder, and inline editing.
 *
 * @module admin/section-editor
 */

import { trips, saveTrips } from '../data.js';
import { escAttr, svg, renderTripPicker, bindTripPicker } from './helpers.js';

/** Collapsed section indexes (persisted across re-renders within the session) */
const collapsedSections = new Set();

/** AbortController to prevent stacked event listeners on re-render */
let sectionAbort = null;

/**
 * Renders the sections tab with trip picker and section list.
 *
 * @param {HTMLElement} tabEl         - Tab content container.
 * @param {Object}      selectedTrip  - Mutable selected trip state.
 * @param {HTMLElement} rootContainer - Root admin container.
 * @param {Function}    onDataChange  - Callback after data mutation.
 */
const renderSectionsTab = (tabEl, selectedTrip, rootContainer, onDataChange) => {
  tabEl.innerHTML = `
    <div class="admin-sub">
      <div class="admin-sub__header">
        <h2 class="admin-sub__title">${svg('sections', 20)} Sezioni narrative</h2>
        <p class="admin-sub__desc">Gestisci le sezioni split testo+media per ogni viaggio</p>
      </div>
      ${renderTripPicker(trips, selectedTrip.sections, 'sections')}
      <div class="tp-content"></div>
    </div>
  `;

  bindTripPicker(tabEl, 'sections', selectedTrip, trips, rootContainer, onDataChange, renderSectionContent);

  if (selectedTrip.sections) {
    const trip = trips.find(t => t.id === selectedTrip.sections);
    if (trip) renderSectionContent(tabEl.querySelector('.tp-content'), trip, rootContainer, onDataChange);
  }
};

/**
 * Renders the section list and form fields for a selected trip.
 *
 * @param {HTMLElement} area          - Content area inside the tab.
 * @param {Object}      trip          - Selected trip object.
 * @param {HTMLElement} rootContainer - Root admin container.
 * @param {Function}    onDataChange  - Callback after data mutation.
 */
const renderSectionContent = (area, trip, rootContainer, onDataChange) => {
  if (sectionAbort) sectionAbort.abort();
  sectionAbort = new AbortController();
  const { signal } = sectionAbort;

  if (!trip.sections) trip.sections = [];
  const sections = trip.sections;

  area.innerHTML = `
    <div class="sec-editor">
      <div class="sec-editor__toolbar">
        <span class="sec-editor__count">${sections.length} sezione/i</span>
        <button class="sec-editor__add-btn" id="sec-add-btn">${svg('plus', 14)} Nuova sezione</button>
      </div>

      ${sections.length === 0 ? `
        <div class="admin-empty-state">
          <div class="admin-empty-state__icon">${svg('sections', 40)}</div>
          <p class="admin-empty-state__text">Nessuna sezione ancora</p>
          <p class="admin-empty-state__hint">Le sezioni creano un racconto visivo alternando testo e media</p>
        </div>
      ` : ''}

      <div class="sec-editor__list">
        ${sections.map((sec, i) => {
          const isCollapsed = collapsedSections.has(`${trip.id}-${i}`);

          return `
          <div class="sec-card ${isCollapsed ? 'sec-card--collapsed' : ''}" data-idx="${i}">
            <div class="sec-card__header" data-sec-toggle="${i}">
              <span class="sec-card__num">${i + 1}</span>
              <div class="sec-card__layout-preview">
                ${sec.type === 'text-image'
                  ? `<div class="sec-lp"><div class="sec-lp__text">T</div><div class="sec-lp__media">${svg('image', 10)}</div></div>`
                  : `<div class="sec-lp sec-lp--rev"><div class="sec-lp__media">${svg('image', 10)}</div><div class="sec-lp__text">T</div></div>`
                }
              </div>
              <div class="sec-card__info">
                <span class="sec-card__title">${escAttr(sec.title || 'Senza titolo')}</span>
                ${sec.media?.src ? `<span class="sec-card__media-hint">${sec.media.type === 'video' ? svg('video', 12) : svg('image', 12)} ${sec.media.type}</span>` : ''}
              </div>
              <div class="sec-card__actions">
                <button class="admin-trips__btn" data-sec-action="up" data-idx="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Sposta su">${svg('up')}</button>
                <button class="admin-trips__btn" data-sec-action="down" data-idx="${i}" ${i === sections.length - 1 ? 'disabled' : ''} aria-label="Sposta giu">${svg('down')}</button>
                <button class="admin-trips__btn admin-trips__btn--danger" data-sec-action="delete" data-idx="${i}" aria-label="Elimina">${svg('trash')}</button>
                <button class="admin-trips__btn sec-card__chevron" data-sec-toggle="${i}" aria-label="Espandi/comprimi">
                  ${isCollapsed ? svg('chevRight') : svg('chevDown')}
                </button>
              </div>
            </div>
            <div class="sec-card__body" ${isCollapsed ? 'hidden' : ''}>
              <div class="sec-card__fields">
                <div class="sec-card__row">
                  <div class="admin-editor__field admin-editor__field--grow">
                    <label class="admin-editor__label">Titolo</label>
                    <input type="text" class="admin-editor__input sec-field" data-idx="${i}" data-field="title" value="${escAttr(sec.title)}">
                  </div>
                  <div class="admin-editor__field">
                    <label class="admin-editor__label">Layout</label>
                    <select class="admin-editor__input sec-field" data-idx="${i}" data-field="type">
                      <option value="text-image" ${sec.type === 'text-image' ? 'selected' : ''}>Testo | Media</option>
                      <option value="image-text" ${sec.type === 'image-text' ? 'selected' : ''}>Media | Testo</option>
                    </select>
                  </div>
                </div>
                <div class="admin-editor__field">
                  <label class="admin-editor__label">Testo narrativo</label>
                  <textarea class="admin-editor__input admin-editor__textarea sec-field" data-idx="${i}" data-field="text" rows="4">${escAttr(sec.text)}</textarea>
                </div>
                <div class="sec-card__media-section">
                  <span class="sec-card__media-label">${svg('image', 14)} Media</span>
                  <div class="sec-card__row">
                    <div class="admin-editor__field">
                      <label class="admin-editor__label">Tipo</label>
                      <select class="admin-editor__input sec-field" data-idx="${i}" data-field="media.type">
                        <option value="image" ${sec.media?.type === 'image' ? 'selected' : ''}>Immagine</option>
                        <option value="video" ${sec.media?.type === 'video' ? 'selected' : ''}>Video</option>
                      </select>
                    </div>
                    <div class="admin-editor__field admin-editor__field--grow">
                      <label class="admin-editor__label">URL sorgente</label>
                      <input type="text" class="admin-editor__input sec-field" data-idx="${i}" data-field="media.src" value="${escAttr(sec.media?.src)}" placeholder="https://...">
                    </div>
                    <div class="admin-editor__field admin-editor__field--grow">
                      <label class="admin-editor__label">Didascalia</label>
                      <input type="text" class="admin-editor__input sec-field" data-idx="${i}" data-field="media.caption" value="${escAttr(sec.media?.caption)}" placeholder="Caption...">
                    </div>
                  </div>
                  ${sec.media?.src ? `
                    <div class="sec-card__media-preview">
                      ${sec.media.type === 'video'
                        ? `<div class="sec-card__video-thumb">${svg('video', 24)}</div>`
                        : `<img src="${escAttr(sec.media.src)}" alt="" class="sec-card__img-preview" onerror="this.style.display='none'">`
                      }
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `}).join('')}
      </div>
    </div>
  `;

  /* Collapse / expand */
  area.addEventListener('click', (e) => {
    const toggleEl = e.target.closest('[data-sec-toggle]');
    if (toggleEl && !e.target.closest('[data-sec-action]')) {
      const idx = Number(toggleEl.dataset.secToggle);
      const key = `${trip.id}-${idx}`;
      if (collapsedSections.has(key)) collapsedSections.delete(key);
      else collapsedSections.add(key);
      renderSectionContent(area, trip, rootContainer, onDataChange);
      return;
    }

    const btn = e.target.closest('[data-sec-action]');
    if (!btn) return;
    const action = btn.dataset.secAction;
    const idx = Number(btn.dataset.idx);

    if (action === 'up' && idx > 0) {
      [sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]];
    } else if (action === 'down' && idx < sections.length - 1) {
      [sections[idx], sections[idx + 1]] = [sections[idx + 1], sections[idx]];
    } else if (action === 'delete') {
      if (!confirm('Eliminare questa sezione?')) return;
      sections.splice(idx, 1);
    } else {
      return;
    }

    saveTrips();
    onDataChange();
    renderSectionContent(area, trip, rootContainer, onDataChange);
  }, { signal });

  /* Field changes */
  let saveTimer = null;
  const debouncedSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTrips(); onDataChange(); }, 400);
  };

  area.addEventListener('input', (e) => {
    const field = e.target.closest('.sec-field');
    if (!field) return;
    const idx = Number(field.dataset.idx);
    const key = field.dataset.field;
    const sec = sections[idx];
    if (!sec) return;

    if (key.startsWith('media.')) {
      if (!sec.media) sec.media = { type: 'image', src: '', caption: '' };
      sec.media[key.split('.')[1]] = field.value;
    } else {
      sec[key] = field.value;
    }
    debouncedSave();
  }, { signal });

  area.addEventListener('change', (e) => {
    const field = e.target.closest('.sec-field');
    if (!field) return;
    const idx = Number(field.dataset.idx);
    const key = field.dataset.field;
    const sec = sections[idx];
    if (!sec) return;

    if (key.startsWith('media.')) {
      if (!sec.media) sec.media = { type: 'image', src: '', caption: '' };
      sec.media[key.split('.')[1]] = field.value;
    } else {
      sec[key] = field.value;
    }
    saveTrips();
    onDataChange();
    renderSectionContent(area, trip, rootContainer, onDataChange);
  }, { signal });

  /* Add section */
  area.querySelector('#sec-add-btn')?.addEventListener('click', () => {
    sections.push({ type: 'text-image', title: '', text: '', media: { type: 'image', src: '', caption: '' } });
    saveTrips();
    onDataChange();
    renderSectionContent(area, trip, rootContainer, onDataChange);
  }, { signal });
};

export { renderSectionsTab };
