import { trips } from './data.js';

/** @type {string|null} Currently active tag filter (null = show all) */
let activeTag = null;

/** @type {'desc'|'asc'} Sort direction by date */
let sortOrder = 'desc';

/** @type {Function|null} Callback invoked when filters change */
let onChangeCallback = null;

/**
 * Extracts all unique tags from published trips, sorted alphabetically.
 *
 * @returns {string[]} Array of unique tag strings.
 */
const collectTags = () => {
  const tags = new Set();
  trips.filter(t => t.published).forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return [...tags].sort();
};

/**
 * Returns published trips filtered by active tag and sorted by date.
 *
 * @returns {Object[]} Filtered and sorted trips array.
 */
export const getFilteredTrips = () => {
  let result = trips.filter(t => t.published);

  if (activeTag) {
    result = result.filter(t => t.tags.includes(activeTag));
  }

  result.sort((a, b) => {
    const diff = a.date.localeCompare(b.date);
    return sortOrder === 'desc' ? -diff : diff;
  });

  return result;
};

/**
 * Renders the filter bar (tag buttons + sort toggle) into the given container.
 *
 * @param {HTMLElement} container - The parent element to append the filter bar to.
 * @param {Function}    onChange  - Callback invoked when filters change.
 */
export const renderFilterBar = (container, onChange) => {
  onChangeCallback = onChange;
  const tags = collectTags();

  const bar = document.createElement('div');
  bar.className = 'filter-bar';

  const tagsWrapper = document.createElement('div');
  tagsWrapper.className = 'filter-bar__tags';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-bar__tag filter-bar__tag--active';
  allBtn.textContent = 'Tutti';
  allBtn.dataset.tag = '';
  allBtn.setAttribute('aria-label', 'Mostra tutti i viaggi');
  allBtn.setAttribute('aria-pressed', 'true');
  tagsWrapper.appendChild(allBtn);

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-bar__tag';
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.setAttribute('aria-label', `Filtra per ${tag}`);
    btn.setAttribute('aria-pressed', 'false');
    tagsWrapper.appendChild(btn);
  });

  const sortBtn = document.createElement('button');
  sortBtn.className = 'filter-bar__sort';
  sortBtn.setAttribute('aria-label', 'Ordina per data');
  updateSortButton(sortBtn);

  bar.appendChild(tagsWrapper);
  bar.appendChild(sortBtn);
  container.appendChild(bar);

  // Event delegation for tag buttons
  tagsWrapper.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-bar__tag');
    if (!btn) return;

    const tag = btn.dataset.tag || null;
    activeTag = tag;

    tagsWrapper.querySelectorAll('.filter-bar__tag').forEach(b => {
      const isActive = b === btn;
      b.classList.toggle('filter-bar__tag--active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });

    notifyChange();
  });

  sortBtn.addEventListener('click', () => {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    updateSortButton(sortBtn);
    notifyChange();
  });
};

/**
 * Resets filters to their default state (all tags, newest first).
 */
export const resetFilters = () => {
  activeTag = null;
  sortOrder = 'desc';
};

/**
 * Updates the sort button label and icon to reflect the current sort order.
 *
 * @param {HTMLButtonElement} btn - The sort button element.
 */
const updateSortButton = (btn) => {
  const isDesc = sortOrder === 'desc';
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="${isDesc ? '19 12 12 19 5 12' : '5 12 12 5 19 12'}"/>
    </svg>
    <span>${isDesc ? 'Recenti' : 'Meno recenti'}</span>
  `;
  btn.setAttribute('aria-label', `Ordina per data: ${isDesc ? 'più recenti prima' : 'meno recenti prima'}`);
};

/**
 * Invokes the onChange callback if registered.
 */
const notifyChange = () => {
  onChangeCallback?.();
};
