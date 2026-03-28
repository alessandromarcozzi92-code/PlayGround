/**
 * Admin authentication module.
 *
 * Provides cosmetic/deterrent login via SHA-256 hash comparison.
 * Credentials and hash live client-side — this is NOT real security.
 *
 * Default credentials: Admin / Admin
 *
 * @module auth
 */

/** SHA-256 hash of "Admin:Admin" */
const CREDENTIALS_HASH = 'd4a590f8fda89eb1a12cdca75d20c991a26a6b9e3f086bbe64f368868da3410b';

/** Session key used in sessionStorage */
const SESSION_KEY = 'surprise_admin_session';

/**
 * Computes the SHA-256 hex digest of a string.
 *
 * @param {string} text - The input string.
 * @returns {Promise<string>} The hex-encoded hash.
 */
const sha256 = async (text) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Checks whether the provided credentials match the stored hash.
 *
 * @param {string} username - The username to verify.
 * @param {string} password - The password to verify.
 * @returns {Promise<boolean>} True if credentials are valid.
 */
const verifyCredentials = async (username, password) => {
  const hash = await sha256(`${username}:${password}`);
  return hash === CREDENTIALS_HASH;
};

/**
 * Returns true if an admin session is currently active.
 *
 * @returns {boolean}
 */
const isAuthenticated = () => sessionStorage.getItem(SESSION_KEY) !== null;

/**
 * Creates an admin session after successful login.
 */
const createSession = () => {
  sessionStorage.setItem(SESSION_KEY, Date.now().toString());
};

/**
 * Destroys the admin session (logout).
 */
const destroySession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

/**
 * Renders the admin login form inside the given container.
 * On successful login, calls `onSuccess`.
 *
 * @param {HTMLElement} container - The element to render the form into.
 * @param {Function}    onSuccess - Callback invoked after successful login.
 */
const renderLoginForm = (container, onSuccess) => {
  container.innerHTML = `
    <section class="admin-login">
      <div class="admin-login__card">
        <div class="admin-login__header">
          <svg class="admin-login__icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h1 class="admin-login__title">Admin</h1>
          <p class="admin-login__subtitle">Accedi per gestire i contenuti</p>
        </div>
        <form class="admin-login__form" novalidate>
          <div class="admin-login__field">
            <label for="admin-username" class="admin-login__label">Username</label>
            <input type="text" id="admin-username" class="admin-login__input" autocomplete="username" required>
          </div>
          <div class="admin-login__field">
            <label for="admin-password" class="admin-login__label">Password</label>
            <div class="admin-login__password-wrapper">
              <input type="password" id="admin-password" class="admin-login__input" autocomplete="current-password" required>
              <button type="button" class="admin-login__toggle-pw" aria-label="Mostra password">
                <svg class="admin-login__eye-open" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg class="admin-login__eye-closed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" hidden>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>
          <p class="admin-login__error" aria-live="assertive" hidden></p>
          <button type="submit" class="admin-login__submit">Accedi</button>
        </form>
      </div>
    </section>
  `;

  const form = container.querySelector('.admin-login__form');
  const errorEl = container.querySelector('.admin-login__error');
  const usernameInput = container.querySelector('#admin-username');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = form.querySelector('#admin-username').value.trim();
    const password = form.querySelector('#admin-password').value;

    if (!username || !password) {
      errorEl.textContent = 'Inserisci username e password.';
      errorEl.hidden = false;
      return;
    }

    const valid = await verifyCredentials(username, password);

    if (valid) {
      createSession();
      onSuccess();
    } else {
      errorEl.textContent = 'Credenziali non valide. Riprova.';
      errorEl.hidden = false;
    }
  });

  usernameInput.focus();

  /* Password visibility toggle */
  const toggleBtn = container.querySelector('.admin-login__toggle-pw');
  const pwInput = container.querySelector('#admin-password');
  const eyeOpen = toggleBtn.querySelector('.admin-login__eye-open');
  const eyeClosed = toggleBtn.querySelector('.admin-login__eye-closed');

  toggleBtn.addEventListener('click', () => {
    const isVisible = pwInput.type === 'text';
    pwInput.type = isVisible ? 'password' : 'text';
    eyeOpen.hidden = isVisible ? false : true;
    eyeClosed.hidden = isVisible ? true : false;
    toggleBtn.setAttribute('aria-label', isVisible ? 'Mostra password' : 'Nascondi password');
    pwInput.focus();
  });
};

export { isAuthenticated, createSession, destroySession, renderLoginForm };
