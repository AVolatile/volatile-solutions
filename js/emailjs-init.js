/*
Investigation Summary (pre-fix scan, 2026-04-12)
- EmailJS SDK <script>: Loaded from `https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js` (no `async`/`defer`), included at the end of `contact.html` just before other local scripts.
- `emailjs.init()`: Previously called via an inline `<script>` immediately after the SDK tag in `contact.html` using a hardcoded Public Key string literal (redacted).
- `emailjs.send*()`: `js/custom.js` uses `emailjs.send(serviceID, templateID, templateParams)` inside the form submit handler; service/template IDs are hardcoded string literals (redacted). The form element reference is taken from `this` inside the handler; `templateParams` are built inside the handler (not at parse time).
- Error catch/UI: The `.catch()` branch in `js/custom.js` shows `#contactFormError` (the user-facing fallback message) and re-enables the submit button.
- Form HTML: `<form id="contactForm" ... novalidate>` has no `method` or `action`. Inputs use `name` attributes `name`, `email`, `projectType`, `budget`, `message`.
- Submit button: Disabled in `js/custom.js` during an in-flight submission to reduce double-submits on iOS.
- Browser-specific paths: No UA sniffing or Safari-specific branches in submission logic (only optional RateLimiter).
*/

(function () {
  'use strict';

  // ASSUMPTION: iOS Safari + production CSP can be stricter about inline script execution,
  // so initializing EmailJS from a same-origin JS file is more reliable than an inline <script>.
  function initEmailJS() {
    if (!window.emailjs || typeof window.emailjs.init !== 'function') return;

    window.emailjs.init({
      publicKey: 'QkYLIjv5ekuBu2-qK'
    });
  }

  // Run after DOM is ready (and safely if this script executes after DOMContentLoaded).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmailJS);
  } else {
    initEmailJS();
  }
})();
