/**
 * Admin panel module — dashboard, trip editor, section editor,
 * photo organizer, POI editor, and tag manager.
 *
 * @module admin
 */

/* global L */

import { trips, saveTrips, defaultTrips } from './data.js';
import { destroySession } from './auth.js';

/** Currently edited trip id (null = new trip form) */
let editingTripId = null;

/** Active admin tab */
let activeTab = 'dashboard';

/** Selected trip per tab (persisted across re-renders) */
const selectedTrip = { sections: null, photos: null, pois: null };

/** Collapsed section indexes */
const collapsedSections = new Set();

/** Drag-and-drop state for photo organizer */
let dragSrcIndex = null;

/** AbortControllers to prevent stacked event listeners on re-render */
let sectionAbort = null;
let photoAbort = null;
let poiAbort = null;
let tagAbort = null;

/* ─── Helpers ─── */

const getAllTags = () => {
  const tags = new Set();
  trips.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
  return [...tags].sort();
};

const nameToId = (name) =>
  name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const escAttr = (str) => String(str ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const POI_ICONS = ['temple', 'city', 'nature', 'food', 'beach', 'hotel', 'museum', 'default'];

/** Show a temporary toast notification inside a container */
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

const svg = (name, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

/* ─── Trip Picker (shared across tabs) ─── */

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

const bindTripPicker = (tabEl, tabKey, rootContainer, onDataChange, renderContent) => {
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

/* ════════════════════════════════════════════
   Main render
   ════════════════════════════════════════════ */

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
          ${svg('logout', 18)} Logout
        </button>
      </div>

      <!-- Tabs -->
      <nav class="admin-tabs">
        <button class="admin-tabs__btn ${activeTab === 'dashboard' ? 'admin-tabs__btn--active' : ''}" data-tab="dashboard">Dashboard</button>
        <button class="admin-tabs__btn ${activeTab === 'sections' ? 'admin-tabs__btn--active' : ''}" data-tab="sections">${svg('sections')} Sezioni</button>
        <button class="admin-tabs__btn ${activeTab === 'photos' ? 'admin-tabs__btn--active' : ''}" data-tab="photos">${svg('photo')} Foto</button>
        <button class="admin-tabs__btn ${activeTab === 'pois' ? 'admin-tabs__btn--active' : ''}" data-tab="pois">${svg('map')} POI</button>
        <button class="admin-tabs__btn ${activeTab === 'tags' ? 'admin-tabs__btn--active' : ''}" data-tab="tags">${svg('tag')} Tag</button>
      </nav>

      <!-- Tab content -->
      <div class="admin-tab-content" id="admin-tab-content"></div>
    </section>
  `;

  container.querySelector('.admin-panel__logout').addEventListener('click', () => {
    destroySession();
    window.location.hash = '#';
  });

  container.querySelector('.admin-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    activeTab = btn.dataset.tab;
    renderAdminPanel(container, onDataChange);
  });

  const tabEl = container.querySelector('#admin-tab-content');

  switch (activeTab) {
    case 'dashboard':
      renderDashboardTab(tabEl, container, onDataChange, { published, drafts, totalPhotos, allTags });
      break;
    case 'sections':
      renderSectionsTab(tabEl, container, onDataChange);
      break;
    case 'photos':
      renderPhotosTab(tabEl, container, onDataChange);
      break;
    case 'pois':
      renderPoisTab(tabEl, container, onDataChange);
      break;
    case 'tags':
      renderTagsTab(tabEl, container, onDataChange);
      break;
  }
};

/* ════════════════════════════════════════════
   Dashboard tab
   ════════════════════════════════════════════ */

const renderDashboardTab = (tabEl, container, onDataChange, { published, drafts, totalPhotos, allTags }) => {
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
        }
        if (!confirm(`Importare ${data.length} viaggi? I dati attuali verranno sovrascritti.`)) return;
        trips.length = 0;
        trips.push(...data);
        saveTrips();
        onDataChange();
        renderAdminPanel(container, onDataChange);
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
    renderAdminPanel(container, onDataChange);
    showToast(container.querySelector('#admin-tab-content'), 'Dati ripristinati ai valori originali');
  });

  tabEl.querySelector('.admin-trips__add').addEventListener('click', () => {
    showEditor(tabEl, null, onDataChange, container);
  });

  tabEl.querySelector('.admin-trips__list').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    const toggleBtn = e.target.closest('[data-action="toggle"]');

    if (editBtn) showEditor(tabEl, editBtn.dataset.id, onDataChange, container);

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
        trips.splice(trips.findIndex(t => t.id === id), 1);
        saveTrips();
        onDataChange();
        renderAdminPanel(container, onDataChange);
      }
    }
  });
};

/* ─── Trip row ─── */

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

const showEditor = (tabEl, tripId, onDataChange, rootContainer) => {
  editingTripId = tripId;
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

  const closeEditor = () => { editorEl.hidden = true; editorEl.innerHTML = ''; editingTripId = null; };
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
    renderAdminPanel(rootContainer, onDataChange);
  });
};

/* ════════════════════════════════════════════
   Sections tab
   ════════════════════════════════════════════ */

const renderSectionsTab = (tabEl, rootContainer, onDataChange) => {
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

  bindTripPicker(tabEl, 'sections', rootContainer, onDataChange, renderSectionContent);

  if (selectedTrip.sections) {
    const trip = trips.find(t => t.id === selectedTrip.sections);
    if (trip) renderSectionContent(tabEl.querySelector('.tp-content'), trip, rootContainer, onDataChange);
  }
};

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
          const layoutIcon = sec.type === 'text-image'
            ? '<span class="sec-layout-icon" title="Testo | Media"><span class="sec-layout-icon__t">T</span><span class="sec-layout-icon__m">${svg("image", 12)}</span></span>'
            : '<span class="sec-layout-icon sec-layout-icon--reversed" title="Media | Testo"><span class="sec-layout-icon__m">${svg("image", 12)}</span><span class="sec-layout-icon__t">T</span></span>';

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
    /* Re-render to update header preview */
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

/* ════════════════════════════════════════════
   Photos tab
   ════════════════════════════════════════════ */

const renderPhotosTab = (tabEl, rootContainer, onDataChange) => {
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

  bindTripPicker(tabEl, 'photos', rootContainer, onDataChange, renderPhotoContent);

  if (selectedTrip.photos) {
    const trip = trips.find(t => t.id === selectedTrip.photos);
    if (trip) renderPhotoContent(tabEl.querySelector('.tp-content'), trip, rootContainer, onDataChange);
  }
};

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

/* ════════════════════════════════════════════
   POI tab
   ════════════════════════════════════════════ */

const renderPoisTab = (tabEl, rootContainer, onDataChange) => {
  tabEl.innerHTML = `
    <div class="admin-sub">
      <div class="admin-sub__header">
        <h2 class="admin-sub__title">${svg('pin', 20)} Punti di Interesse</h2>
        <p class="admin-sub__desc">Aggiungi punti sulla mappa per ogni viaggio</p>
      </div>
      ${renderTripPicker(trips, selectedTrip.pois, 'pois')}
      <div class="tp-content"></div>
    </div>
  `;

  bindTripPicker(tabEl, 'pois', rootContainer, onDataChange, renderPoiContent);

  if (selectedTrip.pois) {
    const trip = trips.find(t => t.id === selectedTrip.pois);
    if (trip) renderPoiContent(tabEl.querySelector('.tp-content'), trip, rootContainer, onDataChange);
  }
};

let poiMapInstance = null;

const renderPoiContent = (area, trip, rootContainer, onDataChange) => {
  if (poiAbort) poiAbort.abort();
  poiAbort = new AbortController();
  const { signal } = poiAbort;

  if (!trip.pois) trip.pois = [];
  const pois = trip.pois;

  area.innerHTML = `
    <div class="poi-editor">
      <div class="poi-editor__layout">
        <div class="poi-editor__map-col">
          <div class="poi-editor__map" id="poi-mini-map"></div>
          <div class="poi-editor__map-info">
            <span>${svg('pin', 13)} ${pois.filter(p => p.lat && p.lng).length} punto/i sulla mappa</span>
          </div>
        </div>
        <div class="poi-editor__list-col">
          <div class="poi-editor__toolbar">
            <span class="poi-editor__count">${pois.length} POI</span>
            <button class="poi-editor__add-btn" id="poi-add-btn">${svg('plus', 14)} Aggiungi</button>
          </div>

          ${pois.length === 0 ? `
            <div class="admin-empty-state admin-empty-state--compact">
              <div class="admin-empty-state__icon">${svg('pin', 32)}</div>
              <p class="admin-empty-state__text">Nessun POI</p>
            </div>
          ` : ''}

          <div class="poi-editor__items">
            ${pois.map((poi, i) => `
              <div class="poi-item" data-idx="${i}">
                <div class="poi-item__header">
                  <span class="poi-item__num" style="background:${trip.color}">${i + 1}</span>
                  <span class="poi-item__name-display">${escAttr(poi.name || 'Senza nome')}</span>
                  <span class="poi-item__icon-badge">${escAttr(poi.icon || 'default')}</span>
                  <button class="admin-trips__btn admin-trips__btn--danger" data-poi-action="delete" data-idx="${i}" aria-label="Elimina">${svg('trash')}</button>
                </div>
                <div class="poi-item__fields">
                  <div class="poi-item__row">
                    <div class="admin-editor__field admin-editor__field--grow">
                      <label class="admin-editor__label">Nome</label>
                      <input type="text" class="admin-editor__input poi-field" data-idx="${i}" data-field="name" value="${escAttr(poi.name)}">
                    </div>
                    <div class="admin-editor__field">
                      <label class="admin-editor__label">Icona</label>
                      <select class="admin-editor__input poi-field" data-idx="${i}" data-field="icon">
                        ${POI_ICONS.map(ic => `<option value="${ic}" ${poi.icon === ic ? 'selected' : ''}>${ic}</option>`).join('')}
                      </select>
                    </div>
                  </div>
                  <div class="poi-item__row">
                    <div class="admin-editor__field">
                      <label class="admin-editor__label">Latitudine</label>
                      <input type="number" step="any" class="admin-editor__input poi-field" data-idx="${i}" data-field="lat" value="${poi.lat ?? ''}" placeholder="es. 35.6762">
                    </div>
                    <div class="admin-editor__field">
                      <label class="admin-editor__label">Longitudine</label>
                      <input type="number" step="any" class="admin-editor__input poi-field" data-idx="${i}" data-field="lng" value="${poi.lng ?? ''}" placeholder="es. 139.6503">
                    </div>
                    <div class="admin-editor__field admin-editor__field--grow">
                      <label class="admin-editor__label">Nota</label>
                      <input type="text" class="admin-editor__input poi-field" data-idx="${i}" data-field="note" value="${escAttr(poi.note)}" placeholder="Descrizione breve...">
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  /* Mini map */
  initPoiMiniMap(area.querySelector('#poi-mini-map'), pois, trip.color);

  /* Field edits */
  let saveTimer = null;
  const debouncedSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTrips();
      onDataChange();
      initPoiMiniMap(area.querySelector('#poi-mini-map'), pois, trip.color);
    }, 600);
  };

  area.addEventListener('input', (e) => {
    const field = e.target.closest('.poi-field');
    if (!field) return;
    const idx = Number(field.dataset.idx);
    const key = field.dataset.field;
    const poi = pois[idx];
    if (!poi) return;
    poi[key] = (key === 'lat' || key === 'lng') ? (parseFloat(field.value) || 0) : field.value;
    debouncedSave();
  }, { signal });

  area.addEventListener('change', (e) => {
    const field = e.target.closest('.poi-field');
    if (!field) return;
    const idx = Number(field.dataset.idx);
    const key = field.dataset.field;
    const poi = pois[idx];
    if (!poi) return;
    poi[key] = (key === 'lat' || key === 'lng') ? (parseFloat(field.value) || 0) : field.value;
    saveTrips();
    onDataChange();
    renderPoiContent(area, trip, rootContainer, onDataChange);
  }, { signal });

  /* Delete */
  area.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-poi-action="delete"]');
    if (!btn) return;
    if (!confirm('Eliminare questo POI?')) return;
    pois.splice(Number(btn.dataset.idx), 1);
    saveTrips();
    onDataChange();
    renderPoiContent(area, trip, rootContainer, onDataChange);
  }, { signal });

  /* Add */
  area.querySelector('#poi-add-btn').addEventListener('click', () => {
    pois.push({ lat: 0, lng: 0, name: '', icon: 'default', note: '' });
    saveTrips();
    onDataChange();
    renderPoiContent(area, trip, rootContainer, onDataChange);
  }, { signal });
};

const initPoiMiniMap = (mapEl, pois, color) => {
  if (!mapEl || typeof L === 'undefined') return;

  if (poiMapInstance) { poiMapInstance.remove(); poiMapInstance = null; }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  poiMapInstance = L.map(mapEl, { zoomControl: true, attributionControl: false });
  L.tileLayer(tileUrl).addTo(poiMapInstance);

  const validPois = pois.filter(p => p.lat && p.lng);
  if (validPois.length === 0) {
    poiMapInstance.setView([20, 0], 2);
    return;
  }

  const markerColor = color || '#6C63FF';
  validPois.forEach((poi, i) => {
    const markerIcon = L.divIcon({
      className: 'poi-mini-marker',
      html: `<div style="width:24px;height:24px;background:${markerColor};border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700">${i + 1}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker([poi.lat, poi.lng], { icon: markerIcon })
      .bindPopup(`<strong>${escAttr(poi.name)}</strong>${poi.note ? `<br>${escAttr(poi.note)}` : ''}`)
      .addTo(poiMapInstance);
  });

  const bounds = L.latLngBounds(validPois.map(p => [p.lat, p.lng]));
  poiMapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
};

/* ════════════════════════════════════════════
   Tags tab
   ════════════════════════════════════════════ */

const renderTagsTab = (tabEl, rootContainer, onDataChange) => {
  if (tagAbort) tagAbort.abort();
  tagAbort = new AbortController();
  const { signal } = tagAbort;

  const tagCounts = {};
  trips.forEach(t => t.tags?.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const totalTrips = trips.length;
  const maxCount = Math.max(...sortedTags.map(([, c]) => c), 1);

  tabEl.innerHTML = `
    <div class="admin-sub">
      <div class="admin-sub__header">
        <h2 class="admin-sub__title">${svg('tag', 20)} Tag Manager</h2>
        <p class="admin-sub__desc">${sortedTags.length} tag in ${totalTrips} viaggi</p>
      </div>

      ${sortedTags.length === 0 ? `
        <div class="admin-empty-state">
          <div class="admin-empty-state__icon">${svg('tag', 40)}</div>
          <p class="admin-empty-state__text">Nessun tag</p>
          <p class="admin-empty-state__hint">I tag vengono creati automaticamente nei viaggi</p>
        </div>
      ` : `
        <!-- Tag cloud -->
        <div class="tag-cloud">
          ${sortedTags.map(([tag, count]) => {
            const size = 0.8 + (count / maxCount) * 0.6;
            return `<span class="tag-cloud__pill" style="font-size:${size}rem" data-tag-cloud="${escAttr(tag)}">${escAttr(tag)} <span class="tag-cloud__num">${count}</span></span>`;
          }).join('')}
        </div>

        <!-- Tag list detail -->
        <div class="tag-detail-list">
          ${sortedTags.map(([tag, count]) => {
            const pct = Math.round((count / totalTrips) * 100);
            const tripsWithTag = trips.filter(t => t.tags?.includes(tag)).map(t => t.name);
            return `
              <div class="tag-row">
                <div class="tag-row__main">
                  <span class="tag-row__name">${escAttr(tag)}</span>
                  <div class="tag-row__bar-wrap">
                    <div class="tag-row__bar" style="width:${pct}%"></div>
                  </div>
                  <span class="tag-row__count">${count}/${totalTrips}</span>
                </div>
                <div class="tag-row__trips">${tripsWithTag.map(n => `<span class="tag-row__trip-chip">${escAttr(n)}</span>`).join('')}</div>
                <div class="tag-row__actions">
                  <button class="admin-trips__btn" data-tag-action="rename" data-tag="${escAttr(tag)}" aria-label="Rinomina">${svg('edit')}</button>
                  <button class="admin-trips__btn admin-trips__btn--danger" data-tag-action="delete" data-tag="${escAttr(tag)}" aria-label="Elimina">${svg('trash')}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  tabEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tag-action]');
    if (!btn) return;
    const action = btn.dataset.tagAction;
    const tag = btn.dataset.tag;

    if (action === 'rename') {
      const newName = prompt(`Rinomina "${tag}" in:`, tag);
      if (!newName || newName.trim() === tag) return;
      const cleaned = newName.trim().toLowerCase();
      trips.forEach(t => {
        if (!t.tags) return;
        const idx = t.tags.indexOf(tag);
        if (idx !== -1) t.tags[idx] = cleaned;
        t.tags = [...new Set(t.tags)];
      });
      saveTrips();
      onDataChange();
      renderTagsTab(tabEl, rootContainer, onDataChange);
    }

    if (action === 'delete') {
      if (!confirm(`Eliminare il tag "${tag}" da tutti i viaggi?`)) return;
      trips.forEach(t => { if (t.tags) t.tags = t.tags.filter(tg => tg !== tag); });
      saveTrips();
      onDataChange();
      renderTagsTab(tabEl, rootContainer, onDataChange);
    }
  }, { signal });
};

export { renderAdminPanel };
