/**
 * HTML sanitization and URL validation utilities.
 *
 * All user-supplied data must be escaped before interpolation into innerHTML
 * templates. This module provides the shared helpers used across both the
 * public site and the admin panel.
 *
 * @module utils/sanitize
 */

/** Characters that must be escaped inside HTML text content. */
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_ESCAPE_RE = /[&<>"']/g;

/**
 * Escapes a string for safe interpolation inside HTML text nodes.
 *
 * @param {string} str - The raw string to escape.
 * @returns {string} HTML-safe string.
 */
const escapeHtml = (str) =>
  String(str ?? '').replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch]);

/**
 * Escapes a string for safe use inside HTML attribute values.
 * Covers the same characters as escapeHtml (attributes need all of them).
 *
 * @param {string} str - The raw string to escape.
 * @returns {string} Attribute-safe string.
 */
const escapeAttr = (str) => escapeHtml(str);

/**
 * Allowed URL protocols for image/media sources.
 * Relative paths (no protocol) are always accepted.
 */
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

/**
 * Validates a URL for use as an image or media source.
 * Accepts relative paths, https/http URLs, and data:image/* URIs.
 * Rejects javascript:, data:text/html, and other dangerous schemes.
 *
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if the URL is safe for use in src/background-image.
 */
const isValidMediaUrl = (url) => {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return false;

  /* Relative paths are always safe */
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }

  /* data:image/* is allowed */
  if (trimmed.startsWith('data:image/')) return true;

  /* Block other data: URIs (data:text/html, etc.) */
  if (trimmed.startsWith('data:')) return false;

  /* Block javascript: and other dangerous schemes */
  try {
    const parsed = new URL(trimmed, window.location.origin);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    /* If URL parsing fails, treat as relative path — safe */
    return true;
  }
};

/**
 * Returns the URL if valid for media use, otherwise returns an empty string.
 * Use this in templates to safely interpolate image/video URLs.
 *
 * @param {string} url - The URL to sanitize.
 * @returns {string} The original URL or empty string.
 */
const sanitizeMediaUrl = (url) => isValidMediaUrl(url) ? String(url ?? '').trim() : '';

export { escapeHtml, escapeAttr, isValidMediaUrl, sanitizeMediaUrl };
