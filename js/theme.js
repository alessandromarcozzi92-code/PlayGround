const STORAGE_KEY = 'surprise-theme';

/**
 * Detects the user's OS-level color scheme preference.
 *
 * @returns {'dark' | 'light'} The detected preference.
 */
const getSystemPreference = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

/**
 * Applies the given theme to the document and updates the toggle icon.
 *
 * @param {'dark' | 'light'} theme - The theme to apply.
 */
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('.theme-toggle__icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro');
  }
};

/**
 * Initializes the theme system.
 * Reads saved preference from localStorage, falls back to OS preference,
 * and listens for OS preference changes.
 */
export const initTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  applyTheme(saved ?? getSystemPreference());

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
};

/**
 * Toggles between dark and light theme and persists the choice.
 */
export const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
};
