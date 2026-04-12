/**
 * @file cookie-consent.js
 * @description GDPR/PECR-compliant cookie consent banner for Volatile Solutions.
 *              Gates Netlify Analytics client-side script injection behind explicit
 *              user consent. Manages consent state in localStorage. Provides a
 *              globally accessible resetConsentBanner() for the footer preference link.
 *
 * @author      Volatile Solutions
 * @dependencies None — vanilla JS only, no external libraries.
 *
 * @public-api
 *   window.resetConsentBanner() — Clears stored consent and re-shows the banner.
 *
 * @localStorage-keys
 *   app:analytics_consent  →  'granted' | 'denied'
 *
 * @notes
 *   - Analytics script is NEVER injected before explicit acceptance.
 *   - localStorage failures (private browsing, quota) are caught and handled
 *     gracefully — the site remains fully usable without consent storage.
 *   - Netlify standard analytics is server-side (no JS snippet needed).
 *     ASSUMPTION: If you use Netlify's client-side event tracking add-on,
 *     replace the ANALYTICS_SCRIPT_SRC constant below with its real URL.
 *     If you have no client-side analytics, this module still correctly gates
 *     consent and the readConsent() helper is available for future use.
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     CONFIGURATION
     ───────────────────────────────────────────────────────── */

  /** localStorage key (namespaced to avoid collision) */
  var CONSENT_KEY = 'app:analytics_consent';

  /**
   * Netlify client-side analytics snippet URL.
   * ASSUMPTION: Replace with actual script URL if using Netlify's
   * client-side event tracking. Remove or leave as-is if using
   * standard (server-side) Netlify Analytics only.
   */
  var ANALYTICS_SCRIPT_SRC = 'https://cdn.zapier.com/packages/partner-sdk/v0/zapier-elements/zapier-elements.esm.js';
  // ^ PLACEHOLDER — set to your real client-side analytics URL.

  /** IDs used in the DOM */
  var BANNER_ID    = 'vs-cookie-banner';
  var ACCEPT_ID    = 'vs-cookie-accept';
  var DECLINE_ID   = 'vs-cookie-decline';
  var PREFS_ID     = 'vs-cookie-prefs-link';

  /* ─────────────────────────────────────────────────────────
     STORAGE HELPERS — always wrapped in try/catch
     ───────────────────────────────────────────────────────── */

  function readConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY); // 'granted' | 'denied' | null
    } catch (e) {
      console.warn('[CookieConsent] localStorage unavailable:', e);
      return null;
    }
  }

  function writeConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (e) {
      console.warn('[CookieConsent] Could not write consent to localStorage:', e);
    }
  }

  function clearConsent() {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch (e) {
      console.warn('[CookieConsent] Could not clear consent from localStorage:', e);
    }
  }

  /* ─────────────────────────────────────────────────────────
     ANALYTICS INJECTION — only ever called after 'granted'
     ───────────────────────────────────────────────────────── */

  function injectAnalytics() {
    // Guard: never inject twice
    if (document.getElementById('vs-analytics-script')) return;

    var script = document.createElement('script');
    script.id    = 'vs-analytics-script';
    script.src   = ANALYTICS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    // Fail silently — network errors must not surface to the user
    script.onerror = function () {
      console.warn('[CookieConsent] Analytics script failed to load — this is non-fatal.');
    };

    document.head.appendChild(script);
  }

  /* ─────────────────────────────────────────────────────────
     BANNER DOM CONSTRUCTION
     ───────────────────────────────────────────────────────── */

  function buildBanner() {
    var banner = document.createElement('div');
    banner.id            = BANNER_ID;
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.setAttribute('aria-modal', 'false'); // non-blocking

    banner.innerHTML = [
      '<div id="vs-cookie-banner__card">',
      '  <div id="vs-cookie-banner__icon" aria-hidden="true">',
      '    <i class="bi bi-shield-check"></i>',
      '  </div>',
      '  <div id="vs-cookie-banner__copy">',
      '    <p id="vs-cookie-banner__heading">We use cookies</p>',
      '    <p id="vs-cookie-banner__body">',
      '      We\'d like to use analytics to understand how visitors use this site.',
      '      No personal data is sold or shared.',
      '      <a href="cookies.html" data-no-transition>Cookie Policy</a>',
      '    </p>',
      '  </div>',
      '  <div id="vs-cookie-banner__actions">',
      '    <button id="' + DECLINE_ID + '" class="vs-cookie-btn" type="button">Decline</button>',
      '    <button id="' + ACCEPT_ID  + '" class="vs-cookie-btn" type="button">Accept</button>',
      '  </div>',
      '</div>'
    ].join('');

    return banner;
  }

  /* ─────────────────────────────────────────────────────────
     BANNER LIFECYCLE
     ───────────────────────────────────────────────────────── */

  function showBanner() {
    // Remove any stale banner first
    var existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();

    var banner   = buildBanner();
    // Inject into <html> (documentElement) rather than <body>.
    // This prevents body-level transforms (pageFadeIn animation, flex layout)
    // from creating a new stacking context that breaks position:fixed.
    document.documentElement.appendChild(banner);

    // Focus-trap: move focus to the first button so keyboard users are aware
    var acceptBtn  = document.getElementById(ACCEPT_ID);
    var declineBtn = document.getElementById(DECLINE_ID);

    if (acceptBtn) {
      // Small delay lets the slide-up animation begin before focus moves
      setTimeout(function () { acceptBtn.focus(); }, 100);
    }

    // ── Event listeners (no inline handlers per spec) ── //

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        writeConsent('granted');
        injectAnalytics();
        hideBanner();
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', function () {
        writeConsent('denied');
        hideBanner();
      });
    }

    // Keyboard trap: Tab cycles only between the two buttons while banner is open
    banner.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = [declineBtn, acceptBtn].filter(Boolean);
      if (focusable.length < 2) return;

      var first = focusable[0];
      var last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  function hideBanner() {
    var banner = document.getElementById(BANNER_ID);
    if (!banner) return;

    // Slide back down before removal
    banner.style.animation  = 'none';
    banner.style.transform  = 'translateY(0)';
    banner.style.transition = 'transform 250ms cubic-bezier(0.65, 0, 0.35, 1), opacity 200ms ease';

    requestAnimationFrame(function () {
      banner.style.transform = 'translateY(100%)';
      banner.style.opacity   = '0';
    });

    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 260);
  }

  /* ─────────────────────────────────────────────────────────
     FOOTER PREFERENCE LINK
     ───────────────────────────────────────────────────────── */

  function wirePrefsLink() {
    var link = document.getElementById(PREFS_ID);
    if (!link) return;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      window.resetConsentBanner();
    });
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC API
     ───────────────────────────────────────────────────────── */

  /**
   * Clears stored consent and re-shows the banner.
   * Wired to the "Cookie Preferences" footer link on every page.
   */
  window.resetConsentBanner = function () {
    clearConsent();
    showBanner();
  };

  /* ─────────────────────────────────────────────────────────
     INIT — runs on every page load
     ───────────────────────────────────────────────────────── */

  function init() {
    var consent = readConsent();

    if (consent === 'granted') {
      // Silent re-injection — user already accepted
      injectAnalytics();
      // DO NOT re-show banner
    } else if (consent === 'denied') {
      // Respect prior decline — do nothing, no banner, no script
    } else {
      // First visit or key was cleared — show the banner
      showBanner();
    }

    // Always wire the footer link (it's present on every page)
    wirePrefsLink();
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
