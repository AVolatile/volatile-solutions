(function ($) {
  'use strict';

  /* ─── Sticky nav ─── */
  $(window).on('scroll', function () {
    var scrollTop = $(window).scrollTop();
    if (scrollTop > 250) {
      $('body').addClass('sticky-active');
    } else {
      $('body').removeClass('sticky-active');
    }
  });

  /* ─── Smooth scroll for anchor links ─── */
  $('a.click-scroll').on('click', function (e) {
    var target = $(this.hash);
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 72 }, 600);
    }
  });

  /* ─── Mobile nav: ESC key closes + focus trap ─── */
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      var $navCollapse = $('#navbarNav');
      if ($navCollapse.hasClass('show')) {
        var bsCollapse = bootstrap.Collapse.getInstance($navCollapse[0]);
        if (bsCollapse) bsCollapse.hide();
        $('.navbar-toggler').focus();
      }
    }
  });

  /* Keep focus inside open mobile nav */
  $('#navbarNav').on('shown.bs.collapse', function () {
    var $focusable = $(this).find('a, button').filter(':visible');
    if ($focusable.length) $focusable.first().focus();
  });

  /* ─── Active nav link highlighting ─── */
  (function highlightNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === '') currentPage = 'index.html';
    
    $('.navbar-nav .nav-link').each(function () {
      var href = $(this).attr('href') || '';
      var linkPage = href.split('#')[0];
      
      // Only auto-highlight on sub-pages (not index anchors)
      if (currentPage !== 'index.html' && linkPage === currentPage) {
        $(this).addClass('active');
      }
    });
  })();

  /* ─── Timeline scroll animation ─── */
  var items = document.querySelectorAll('.vertical-scrollable-timeline li');
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.25 });

  items.forEach(function (item) {
    observer.observe(item);
  });

  /* ─── Portfolio filtering ─── */
  $(document).on('click', '.portfolio-filter-btn', function () {
    var $btn = $(this);
    var filter = $btn.data('filter');

    // Toggle active button
    $('.portfolio-filter-btn').removeClass('active').attr('aria-pressed', 'false');
    $btn.addClass('active').attr('aria-pressed', 'true');

    // Show / hide cards
    $('.portfolio-grid .col').each(function () {
      var cats = ($(this).data('cats') || '').toString();
      if (filter === 'all' || cats.indexOf(filter) !== -1) {
        $(this).removeClass('d-none');
      } else {
        $(this).addClass('d-none');
      }
    });
  });

  /* ─── Contact form validation ─── */
  var $contactForm = $('#contactForm');
  if ($contactForm.length) {
    $contactForm.on('submit', function (e) {
      e.preventDefault();

      var form = this;
      var valid = true;

      // Clear previous errors
      $(form).find('.is-invalid').removeClass('is-invalid');

      // Required field checks
      $(form).find('[required]').each(function () {
        if (!this.value.trim()) {
          $(this).addClass('is-invalid');
          valid = false;
        }
      });

      // Email format check
      var $email = $(form).find('#contact-email');
      if ($email.length && $email.val()) {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test($email.val())) {
          $email.addClass('is-invalid');
          valid = false;
        }
      }

      if (valid) {
        // Show success state
        $(form).find('.row').fadeOut(200, function () {
          $('#formSuccess').fadeIn(300);
        });
      }
    });

    // Clear error on input
    $contactForm.on('input change', '.form-control', function () {
      $(this).removeClass('is-invalid');
    });
  }

  /* ─── Page fade transitions ─── */
  $('a[href]').not('[href^="#"]').not('[target="_blank"]').not('[data-no-transition]').on('click', function (e) {
    var url = this.href;
    if (url.indexOf(window.location.hostname) === -1) return; // external links
    e.preventDefault();
    $('body').addClass('is-page-transitioning');
    setTimeout(function () {
      window.location = url;
    }, 300);
  });

})(jQuery);
