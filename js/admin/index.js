/**
 * Admin panel orchestrator — manages tab switching, logout, and delegates
 * rendering to sub-modules.
 *
 * @module admin/index
 */

import { destroySession } from '../auth.js';
import { svg } from './helpers.js';
import { renderDashboardTab } from './dashboard.js';
import { renderSectionsTab } from './section-editor.js';
import { renderPhotosTab } from './photo-organizer.js';
import { renderPoisTab } from './poi-editor.js';
import { renderTagsTab } from './tag-manager.js';

/** Active admin tab */
let activeTab = 'dashboard';

/** Selected trip per tab (persisted across re-renders) */
const selectedTrip = { sections: null, photos: null, pois: null };

/**
 * Renders the full admin panel: header, tab navigation, and active tab content.
 *
 * @param {HTMLElement} container    - Root container to render into.
 * @param {Function}    onDataChange - Callback after any data mutation.
 */
const renderAdminPanel = (container, onDataChange) => {
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
      renderDashboardTab(tabEl, container, onDataChange, renderAdminPanel);
      break;
    case 'sections':
      renderSectionsTab(tabEl, selectedTrip, container, onDataChange);
      break;
    case 'photos':
      renderPhotosTab(tabEl, selectedTrip, container, onDataChange);
      break;
    case 'pois':
      renderPoisTab(tabEl, selectedTrip, container, onDataChange);
      break;
    case 'tags':
      renderTagsTab(tabEl, container, onDataChange);
      break;
  }
};

export { renderAdminPanel };
