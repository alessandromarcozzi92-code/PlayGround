/**
 * POI tab — point-of-interest editor with mini Leaflet map preview.
 *
 * @module admin/poi-editor
 */

/* global L */

import { trips, saveTrips } from '../data.js';
import { escAttr, svg, POI_ICONS, renderTripPicker, bindTripPicker } from './helpers.js';

/** AbortController to prevent stacked event listeners on re-render */
let poiAbort = null;

/** Leaflet map instance for the POI mini-map */
let poiMapInstance = null;

/**
 * Renders the POI tab with trip picker and POI list.
 *
 * @param {HTMLElement} tabEl         - Tab content container.
 * @param {Object}      selectedTrip  - Mutable selected trip state.
 * @param {HTMLElement} rootContainer - Root admin container.
 * @param {Function}    onDataChange  - Callback after data mutation.
 */
const renderPoisTab = (tabEl, selectedTrip, rootContainer, onDataChange) => {
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

  bindTripPicker(tabEl, 'pois', selectedTrip, trips, rootContainer, onDataChange, renderPoiContent);

  if (selectedTrip.pois) {
    const trip = trips.find(t => t.id === selectedTrip.pois);
    if (trip) renderPoiContent(tabEl.querySelector('.tp-content'), trip, rootContainer, onDataChange);
  }
};

/**
 * Initializes or re-initializes the Leaflet mini-map for POI preview.
 *
 * @param {HTMLElement} mapEl - Map container element.
 * @param {Object[]}    pois  - Array of POI objects.
 * @param {string}      color - Trip accent color for markers.
 */
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

/**
 * Renders the POI list, fields, and mini-map for a selected trip.
 *
 * @param {HTMLElement} area          - Content area inside the tab.
 * @param {Object}      trip          - Selected trip object.
 * @param {HTMLElement} rootContainer - Root admin container.
 * @param {Function}    onDataChange  - Callback after data mutation.
 */
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

export { renderPoisTab };
