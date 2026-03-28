import { trips } from './data.js';

/**
 * Calculates aggregate statistics from published trips.
 *
 * @returns {{ trips: number, countries: number, photos: number }}
 */
const calcStats = () => {
  const published = trips.filter(t => t.published);
  return {
    trips: published.length,
    countries: published.length,
    photos: published.reduce((sum, t) => sum + t.photos.length, 0)
  };
};

/**
 * Animates a counter from 0 to the target value.
 *
 * @param {HTMLElement} el       - The element whose textContent will be updated.
 * @param {number}      target   - The final value.
 * @param {number}      duration - Animation duration in ms.
 */
const animateCount = (el, target, duration = 1600) => {
  const start = performance.now();

  const step = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

/**
 * Renders the stats counters into the given container and triggers
 * count-up animation when they scroll into view.
 *
 * @param {HTMLElement} container - The parent element to append stats to.
 */
export const renderStats = (container) => {
  const stats = calcStats();

  const section = document.createElement('div');
  section.className = 'hero-stats';

  const items = [
    { value: stats.trips, label: 'Viaggi' },
    { value: stats.countries, label: 'Paesi' },
    { value: stats.photos, label: 'Foto' }
  ];

  items.forEach(({ value, label }) => {
    const item = document.createElement('div');
    item.className = 'hero-stats__item';
    item.innerHTML = `
      <span class="hero-stats__number" data-target="${value}">0</span>
      <span class="hero-stats__label">${label}</span>
    `;
    section.appendChild(item);
  });

  container.appendChild(section);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      section.querySelectorAll('.hero-stats__number').forEach(el => {
        animateCount(el, parseInt(el.dataset.target, 10));
      });
      observer.disconnect();
    });
  }, { threshold: 0.5 });

  observer.observe(section);
};
