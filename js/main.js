/* ═══════════════════════════════════════════
   VOLATILE SOLUTIONS — MAIN JS
   All interactions, no dependencies
   ═══════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── Helpers ── */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ─────────────────────────────────────────
       LUCIDE ICONS
       ───────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
        if (window.lucide) lucide.createIcons();
        initNavbar();
        initAccordion();
        initPricingTabs();
        initPricingExpand();
        initPortfolioFilters();
        initContactForm();
        initRevealAnimations();
        initPageTransitions();
        highlightActiveNav();
    });

    /* ─────────────────────────────────────────
       NAVBAR
       ───────────────────────────────────────── */
    function initNavbar() {
        const navbar = $('.navbar');
        const toggle = $('.navbar__toggle');
        const mobile = $('.navbar__mobile');
        const close = $('.navbar__close');
        const overlay = $('.navbar__overlay');

        if (!navbar) return;

        // Scroll effect
        const onScroll = () => {
            navbar.classList.toggle('is-scrolled', window.scrollY > 50);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // Mobile menu
        if (toggle && mobile) {
            const openMenu = () => {
                mobile.classList.add('is-open');
                toggle.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
                // Focus first link
                const firstLink = $('.navbar__mobile-link', mobile);
                if (firstLink) setTimeout(() => firstLink.focus(), 100);
            };
            const closeMenu = () => {
                mobile.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                toggle.focus();
            };

            toggle.addEventListener('click', openMenu);
            if (close) close.addEventListener('click', closeMenu);
            if (overlay) overlay.addEventListener('click', closeMenu);

            // ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mobile.classList.contains('is-open')) {
                    closeMenu();
                }
            });

            // Focus trap
            mobile.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;
                const focusable = $$('a, button', mobile).filter(el => el.offsetParent !== null);
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault(); last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault(); first.focus();
                }
            });
        }
    }

    /* ─────────────────────────────────────────
       ACTIVE NAV HIGHLIGHTING
       ───────────────────────────────────────── */
    function highlightActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        $$('.navbar__link, .navbar__mobile-link').forEach(link => {
            const href = link.getAttribute('href') || '';
            const linkPage = href.split('#')[0];
            if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('is-active');
            }
        });

        // Intersection-based for homepage sections
        if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
            const sections = $$('section[id]');
            if (!sections.length) return;
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        $$('.navbar__link').forEach(l => {
                            const h = l.getAttribute('href') || '';
                            if (h === '#' + id || h === 'index.html#' + id) {
                                l.classList.add('is-active');
                            } else if (h.startsWith('#') || (h.startsWith('index.html#'))) {
                                l.classList.remove('is-active');
                            }
                        });
                    }
                });
            }, { rootMargin: '-30% 0px -60% 0px' });
            sections.forEach(s => observer.observe(s));
        }
    }

    /* ─────────────────────────────────────────
       ACCORDION
       ───────────────────────────────────────── */
    function initAccordion() {
        $$('.accordion__trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const item = trigger.closest('.accordion__item');
                const body = $('.accordion__body', item);
                const isOpen = item.classList.contains('is-open');

                // Close others in same accordion
                const accordion = item.closest('.accordion');
                if (accordion) {
                    $$('.accordion__item.is-open', accordion).forEach(openItem => {
                        if (openItem !== item) {
                            openItem.classList.remove('is-open');
                            const openBody = $('.accordion__body', openItem);
                            if (openBody) openBody.style.maxHeight = null;
                            const openTrigger = $('.accordion__trigger', openItem);
                            if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
                        }
                    });
                }

                // Toggle current
                item.classList.toggle('is-open', !isOpen);
                trigger.setAttribute('aria-expanded', String(!isOpen));
                if (body) {
                    body.style.maxHeight = isOpen ? null : body.scrollHeight + 'px';
                }
            });

            // Keyboard
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    trigger.click();
                }
            });
        });
    }

    /* ─────────────────────────────────────────
       PRICING TABS
       ───────────────────────────────────────── */
    function initPricingTabs() {
        const tabs = $$('.pricing__tab');
        const panels = $$('.pricing__panel');
        if (!tabs.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                tabs.forEach(t => {
                    t.classList.toggle('is-active', t === tab);
                    t.setAttribute('aria-selected', String(t === tab));
                });
                panels.forEach(p => {
                    p.classList.toggle('is-active', p.id === target);
                });
            });
        });
    }

    /* ─────────────────────────────────────────
       PRICING EXPAND
       ───────────────────────────────────────── */
    function initPricingExpand() {
        $$('.pricing-card__expand').forEach(btn => {
            btn.addEventListener('click', () => {
                const more = btn.previousElementSibling;
                if (!more) return;
                const isOpen = more.classList.contains('is-open');
                more.classList.toggle('is-open');
                btn.classList.toggle('is-open');

                if (!isOpen) {
                    more.style.maxHeight = more.scrollHeight + 'px';
                } else {
                    more.style.maxHeight = null;
                }

                const label = btn.querySelector('span');
                if (label) label.textContent = isOpen ? 'See all features' : 'Show fewer';
            });
        });
    }

    /* ─────────────────────────────────────────
       PORTFOLIO FILTERS
       ───────────────────────────────────────── */
    function initPortfolioFilters() {
        const filters = $$('.portfolio__filter');
        const cards = $$('.project-card');
        if (!filters.length) return;

        filters.forEach(filter => {
            filter.addEventListener('click', () => {
                const cat = filter.dataset.filter;

                filters.forEach(f => {
                    f.classList.toggle('is-active', f === filter);
                    f.setAttribute('aria-pressed', String(f === filter));
                });

                cards.forEach(card => {
                    const tags = (card.dataset.tags || '').split(',').map(t => t.trim());
                    const match = cat === 'all' || tags.includes(cat);
                    card.classList.toggle('is-hidden', !match);
                });
            });
        });
    }

    /* ─────────────────────────────────────────
       CONTACT FORM
       ───────────────────────────────────────── */
    function initContactForm() {
        const form = $('#contactForm');
        if (!form) return;

        // Querystring prefill
        const params = new URLSearchParams(window.location.search);
        if (params.get('package')) {
            const projectType = form.querySelector('[name="project-type"]');
            if (projectType) {
                // Try to match the package name to an option
                const pkg = params.get('package');
                for (const opt of projectType.options) {
                    if (opt.value.toLowerCase().includes(pkg.toLowerCase())) {
                        opt.selected = true;
                        break;
                    }
                }
            }
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let valid = true;

            // Clear previous errors
            $$('.is-error', form).forEach(el => el.classList.remove('is-error'));

            // Check required fields
            $$('[required]', form).forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('is-error');
                    valid = false;
                }
            });

            // Email format
            const email = form.querySelector('[name="email"]');
            if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                email.classList.add('is-error');
                valid = false;
            }

            if (valid) {
                // Show success
                const formContent = $('.contact__form-content', form.closest('.contact__form-card'));
                const success = $('.contact__success', form.closest('.contact__form-card'));
                if (formContent) formContent.style.display = 'none';
                if (success) success.classList.add('is-visible');
            }
        });

        // Clear error on input
        form.addEventListener('input', (e) => {
            e.target.classList.remove('is-error');
        });
    }

    /* ─────────────────────────────────────────
       REVEAL ANIMATIONS
       ───────────────────────────────────────── */
    function initRevealAnimations() {
        if (prefersReducedMotion) {
            $$('.reveal').forEach(el => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

        $$('.reveal').forEach(el => observer.observe(el));
    }

    /* ─────────────────────────────────────────
       PAGE TRANSITIONS
       ───────────────────────────────────────── */
    function initPageTransitions() {
        if (prefersReducedMotion) return;

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            if (link.target === '_blank') return;
            if (link.hasAttribute('data-no-transition')) return;
            if (link.getAttribute('href').startsWith('#')) return;
            if (link.hostname !== window.location.hostname) return;

            e.preventDefault();
            document.body.classList.add('is-leaving');
            setTimeout(() => { window.location = link.href; }, 250);
        });
    }

})();
