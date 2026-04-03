/* global L */
import { escapeHtml } from './utils/sanitize.js';

const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

const ICON_COLORS = {
  temple: '#E63946',
  city: '#457B9D',
  nature: '#2A9D8F',
  food: '#E9C46A',
  default: '#6C63FF',
};

const FIT_BOUNDS_PADDING = [40, 40];

/** @type {L.Map|null} */
let mapInstance = null;

/** @type {L.TileLayer|null} */
let tileLayer = null;

/** @type {MutationObserver|null} */
let themeObserver = null;

/**
 * Detects the current theme from the document root attribute.
 *
 * @returns {'dark' | 'light'} The active theme.
 */
const getCurrentTheme = () =>
  document.documentElement.getAttribute('data-theme') || 'light';

/**
 * Creates a colored circle marker icon for a POI category.
 *
 * @param {string} category - The POI icon/category name.
 * @param {string} tripColor - The trip accent color (fallback).
 * @returns {L.DivIcon} A Leaflet DivIcon.
 */
const createMarkerIcon = (category, tripColor) => {
  const color = ICON_COLORS[category] || tripColor || ICON_COLORS.default;

  return L.divIcon({
    className: 'trip-map__marker',
    html: `<span class="trip-map__marker-dot" style="background:${color};box-shadow:0 0 0 4px ${color}33"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
};

/**
 * Builds the HTML content for a POI popup.
 *
 * @param {Object} poi - The point of interest data.
 * @param {string} poi.name - POI name.
 * @param {string} [poi.note] - Optional description note.
 * @param {string} [poi.icon] - Optional category icon.
 * @returns {string} HTML string for the popup.
 */
const buildPopupContent = (poi) => `
  <div class="trip-map__popup">
    <strong class="trip-map__popup-name">${escapeHtml(poi.name)}</strong>
    ${poi.note ? `<p class="trip-map__popup-note">${escapeHtml(poi.note)}</p>` : ''}
  </div>
`;

/**
 * Sets the tile layer on the map matching the current theme.
 */
const applyTileTheme = () => {
  if (!mapInstance) return;

  const theme = getCurrentTheme();
  const url = theme === 'dark' ? TILE_DARK : TILE_LIGHT;

  if (tileLayer) {
    tileLayer.setUrl(url);
  } else {
    tileLayer = L.tileLayer(url, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 18,
    }).addTo(mapInstance);
  }
};

/**
 * Renders an interactive Leaflet map with POI markers inside the given container.
 * The map is only created if the trip has at least one POI.
 *
 * @param {HTMLElement} container - The DOM element to hold the map.
 * @param {Object[]} pois - Array of POI objects ({ lat, lng, name, icon, note }).
 * @param {string} tripColor - The trip accent color for marker fallback.
 */
export const renderMap = (container, pois, tripColor) => {
  if (!pois || pois.length === 0 || typeof L === 'undefined') return;

  destroyMap();

  const mapEl = document.createElement('div');
  mapEl.id = 'trip-map-canvas';
  mapEl.className = 'trip-map__canvas';
  container.appendChild(mapEl);

  mapInstance = L.map(mapEl, {
    scrollWheelZoom: false,
    zoomControl: true,
  });

  applyTileTheme();

  const markers = pois.map(poi => {
    const marker = L.marker([poi.lat, poi.lng], {
      icon: createMarkerIcon(poi.icon, tripColor),
    }).addTo(mapInstance);

    marker.bindPopup(buildPopupContent(poi), {
      className: 'trip-map__popup-wrapper',
      maxWidth: 240,
    });

    return marker;
  });

  const group = L.featureGroup(markers);
  mapInstance.fitBounds(group.getBounds(), { padding: FIT_BOUNDS_PADDING });

  /* Watch for theme changes and swap tile layer */
  themeObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'data-theme') {
        applyTileTheme();
      }
    });
  });

  themeObserver.observe(document.documentElement, { attributes: true });
};

/**
 * Destroys the current map instance and cleans up observers.
 * Safe to call even if no map exists.
 */
export const destroyMap = () => {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    tileLayer = null;
  }
};
