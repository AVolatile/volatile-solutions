/**
 * @file rate-limiter.js
 * @description Standalone client-side rate-limiting utility using a localStorage-backed
 *              sliding window. Designed to be a drop-in UX guardrail for form submissions
 *              and other high-frequency actions. Architected as a swappable module — the
 *              public API surface (.check() / .record()) can be backed by a server-side
 *              implementation with zero UI changes.
 *
 * @author      Volatile Solutions
 * @dependencies None — vanilla JS only, no external libraries.
 *
 * @public-api
 *   new RateLimiter(actionName, maxRequests, windowMs)
 *     .check()   → { allowed: boolean, remaining: number, retryAfterMs: number }
 *     .record()  → void  (logs current timestamp into the sliding window)
 *
 * @localStorage-keys
 *   app:ratelimit:{actionName}  →  JSON array of Unix timestamp (ms) strings
 *
 * @security-note
 *   Client-side rate limiting is a UX guardrail only. A determined user can bypass it
 *   by clearing localStorage. For real resource protection, enforce limits server-side.
 *
 * @example
 *   var limiter = new RateLimiter('contact_submit', 5, 60000);
 *   var status  = limiter.check();
 *   if (status.allowed) {
 *     limiter.record();
 *     // proceed with submission
 *   } else {
 *     // show lockout UI — retryAfterMs until next slot opens
 *   }
 */

(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     CONSTANTS
     ───────────────────────────────────────────────────────── */

  /** Namespace prefix for all rate-limiter keys */
  var KEY_PREFIX = 'app:ratelimit:';

  /* ─────────────────────────────────────────────────────────
     STORAGE HELPERS
     ───────────────────────────────────────────────────────── */

  /**
   * Read the timestamp array for a given action key.
   * Treats missing, unreadable, or corrupted entries as a clean slate.
   * @param {string} storageKey
   * @returns {number[]} Array of Unix timestamps (ms)
   */
  function readTimestamps(storageKey) {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return [];

      var parsed = JSON.parse(raw);

      // Guard against corrupted values (must be an array of numbers)
      if (!Array.isArray(parsed)) {
        console.warn('[RateLimiter] Corrupted entry for key "' + storageKey + '" — resetting.');
        return [];
      }

      return parsed.filter(function (v) { return typeof v === 'number' && isFinite(v); });

    } catch (e) {
      if (e instanceof SyntaxError) {
        console.warn('[RateLimiter] JSON parse error for key "' + storageKey + '" — resetting.');
      } else {
        console.warn('[RateLimiter] localStorage unavailable:', e);
      }
      return [];
    }
  }

  /**
   * Write a timestamp array back to localStorage.
   * @param {string} storageKey
   * @param {number[]} timestamps
   */
  function writeTimestamps(storageKey, timestamps) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(timestamps));
    } catch (e) {
      console.warn('[RateLimiter] Could not write to localStorage:', e);
    }
  }

  /* ─────────────────────────────────────────────────────────
     RATELIMITER CONSTRUCTOR
     ───────────────────────────────────────────────────────── */

  /**
   * @constructor
   * @param {string} actionName   - Unique name for this action (e.g. 'contact_submit')
   * @param {number} maxRequests  - Maximum number of requests allowed within the window
   * @param {number} windowMs     - Rolling window duration in milliseconds
   */
  function RateLimiter(actionName, maxRequests, windowMs) {
    if (typeof actionName !== 'string' || !actionName) {
      throw new TypeError('[RateLimiter] actionName must be a non-empty string.');
    }
    if (typeof maxRequests !== 'number' || maxRequests < 1) {
      throw new TypeError('[RateLimiter] maxRequests must be a positive number.');
    }
    if (typeof windowMs !== 'number' || windowMs < 1) {
      throw new TypeError('[RateLimiter] windowMs must be a positive number.');
    }

    this._key        = KEY_PREFIX + actionName;
    this._max        = maxRequests;
    this._windowMs   = windowMs;
  }

  /* ─────────────────────────────────────────────────────────
     SLIDING WINDOW LOGIC
     ───────────────────────────────────────────────────────── */

  /**
   * Returns the current state of the rate limit without modifying storage.
   *
   * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
   *   allowed       — true if a new request can proceed right now
   *   remaining     — how many more requests are allowed in the current window
   *   retryAfterMs  — milliseconds until the oldest request expires (0 if allowed)
   */
  RateLimiter.prototype.check = function () {
    var now        = Date.now();
    var cutoff     = now - this._windowMs;
    var timestamps = readTimestamps(this._key);

    // Prune timestamps outside the sliding window
    var active = timestamps.filter(function (ts) { return ts > cutoff; });

    var count    = active.length;
    var allowed   = count < this._max;
    var remaining = Math.max(0, this._max - count);

    var retryAfterMs = 0;
    if (!allowed && active.length > 0) {
      // Oldest timestamp in window + windowMs = when the next slot opens
      var oldest = active.reduce(function (min, ts) { return ts < min ? ts : min; }, active[0]);
      retryAfterMs = Math.max(0, (oldest + this._windowMs) - now);
    }

    return { allowed: allowed, remaining: remaining, retryAfterMs: retryAfterMs };
  };

  /**
   * Records the current timestamp into the sliding window.
   * Call this only after .check() returns { allowed: true }.
   */
  RateLimiter.prototype.record = function () {
    var now        = Date.now();
    var cutoff     = now - this._windowMs;
    var timestamps = readTimestamps(this._key);

    // Prune stale entries before writing
    var active = timestamps.filter(function (ts) { return ts > cutoff; });
    active.push(now);

    writeTimestamps(this._key, active);
  };

  /* ─────────────────────────────────────────────────────────
     INLINE LOCKOUT UI HELPER
     ───────────────────────────────────────────────────────── */

  /**
   * Renders or updates a .vs-rate-error element adjacent to a triggering element.
   * Uses Bootstrap Icons (bi-exclamation-triangle) already loaded on every page.
   *
   * @param {HTMLElement} triggerEl  - The button or input that triggered the limit
   * @param {number}      retryMs    - Milliseconds until retry is allowed
   * @param {Function}    [onExpire] - Optional callback called when lockout expires
   * @returns {{ clear: Function }} - Object with a clear() method to remove the UI
   *
   * ASSUMPTION: Bootstrap Icons CSS is loaded on every page (it is — bootstrap-icons.css).
   */
  RateLimiter.showLockoutUI = function (triggerEl, retryMs, onExpire) {
    if (!triggerEl) return { clear: function () {} };

    // Disable the triggering element
    triggerEl.disabled = true;
    triggerEl.setAttribute('aria-disabled', 'true');

    // Find or create the error element immediately after triggerEl's parent
    var containerId = 'vs-rl-error-' + (triggerEl.id || 'el');
    var errorEl     = document.getElementById(containerId);

    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id        = containerId;
      errorEl.className = 'vs-rate-error';
      errorEl.setAttribute('role', 'alert');
      errorEl.setAttribute('aria-live', 'polite');

      errorEl.innerHTML = [
        '<span class="vs-rate-error__icon" aria-hidden="true">',
        '  <i class="bi bi-exclamation-triangle-fill"></i>',
        '</span>',
        '<span class="vs-rate-error__text">',
        '  Too many submissions. Please wait ',
        '  <span class="vs-rate-error__countdown"></span>',
        '  before trying again.',
        '</span>'
      ].join('');

      // Insert after the triggering element's closest parent wrapper
      var parent = triggerEl.parentNode;
      if (parent) parent.insertAdjacentElement('afterend', errorEl);
    }

    errorEl.removeAttribute('hidden');

    // Countdown ticker
    var countdownEl = errorEl.querySelector('.vs-rate-error__countdown');
    var remaining   = Math.ceil(retryMs / 1000);

    function updateCountdown() {
      if (countdownEl) countdownEl.textContent = remaining + 's';
    }

    updateCountdown();

    var ticker = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        clearInterval(ticker);
        clear(); // auto-clear on expiry
        if (typeof onExpire === 'function') onExpire();
      } else {
        updateCountdown();
      }
    }, 1000);

    function clear() {
      clearInterval(ticker);
      if (triggerEl) {
        triggerEl.disabled = false;
        triggerEl.removeAttribute('aria-disabled');
      }
      if (errorEl && errorEl.parentNode) {
        errorEl.setAttribute('hidden', '');
      }
    }

    return { clear: clear };
  };

  /* ─────────────────────────────────────────────────────────
     EXPORT
     ───────────────────────────────────────────────────────── */

  /** Exposed globally so it can be used inline or imported later */
  global.RateLimiter = RateLimiter;

})(window);
