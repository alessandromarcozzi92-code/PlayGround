/**
 * Tags tab — tag cloud, usage stats, rename, and delete across all trips.
 *
 * @module admin/tag-manager
 */

import { trips, saveTrips } from '../data.js';
import { escAttr, svg } from './helpers.js';

/** AbortController to prevent stacked event listeners on re-render */
let tagAbort = null;

/**
 * Renders the tags tab with cloud visualization, bar chart, and management actions.
 *
 * @param {HTMLElement} tabEl         - Tab content container.
 * @param {HTMLElement} rootContainer - Root admin container.
 * @param {Function}    onDataChange  - Callback after data mutation.
 */
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

export { renderTagsTab };
