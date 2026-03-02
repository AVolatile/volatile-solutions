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

  /* ─── Packages Page: Pricing Estimator ─── */
  var $estimatorForm = $('#pricing-estimator-form');
  if ($estimatorForm.length) {

    // Configuration object
    var pricingConfig = {
      base: {
        launch: { min: 2500, max: 4000, weeksMin: 1, weeksMax: 3, label: 'Launch' },
        business: { min: 5000, max: 8000, weeksMin: 3, weeksMax: 6, label: 'Business' },
        growth: { min: 8000, max: 15000, weeksMin: 6, weeksMax: 10, label: 'Growth' },
        enterprise: { min: 15000, max: 25000, weeksMin: 10, weeksMax: 16, label: 'Enterprise' }
      },
      perPage: { min: 100, max: 200 }, // added to base after 5 pages
      copywriting: {
        client: { min: 0, max: 0, wMin: 0, wMax: 0, list: 'Client-provided copy' },
        assisted: { min: 800, max: 1500, wMin: 1, wMax: 2, list: 'Assisted copywriting' },
        full: { min: 2000, max: 4500, wMin: 2, wMax: 4, list: 'Full copywriting' }
      },
      cms: {
        none: { min: 0, max: 0, wMin: 0, wMax: 0, list: 'Static pages (No CMS)' },
        basic: { min: 600, max: 1200, wMin: 1, wMax: 2, list: 'Basic CMS mapping' },
        full: { min: 1500, max: 3500, wMin: 2, wMax: 4, list: 'Full CMS integration' }
      },
      ecommerce: { min: 2500, max: 6000, wMin: 2, wMax: 4, list: 'E-commerce setup' },
      seo: { min: 800, max: 1800, wMin: 1, wMax: 2, list: 'Advanced SEO' },
      a11y: { min: 1000, max: 2500, wMin: 1, wMax: 2, list: 'Enhanced ADA/WCAG' },
      support: {
        none: { list: 'Standard warranty' },
        monthly: { list: 'Monthly Retainer' },
        quarterly: { list: 'Quarterly Audits' }
      }
    };

    function updateEstimator() {
      // Read values
      var type = $('#est-site-type').val();
      var pages = parseInt($('#est-pages').val(), 10);
      var copy = $('#est-copywriting').val();
      var cms = $('#est-cms').val();
      var isEcom = $('#est-ecommerce').is(':checked');
      var isSeo = $('#est-seo').is(':checked');
      var isA11y = $('#est-a11y').is(':checked');
      var support = $('#est-support').val();

      // UI Sync
      $('#est-pages-display').text(pages);

      // Calculations
      var base = pricingConfig.base[type];
      var mPrice = base.min;
      var maxPrice = base.max;
      var mWeeks = base.weeksMin;
      var maxWeeks = base.weeksMax;

      // Add pages scaling
      if (pages > 5) {
        var extraPages = pages - 5;
        mPrice += extraPages * pricingConfig.perPage.min;
        maxPrice += extraPages * pricingConfig.perPage.max;
        if (extraPages > 10) { mWeeks += 1; maxWeeks += 2; }
      }

      // Add logic objects
      var copyObj = pricingConfig.copywriting[copy];
      mPrice += copyObj.min; maxPrice += copyObj.max;
      mWeeks += copyObj.wMin; maxWeeks += copyObj.wMax;

      var cmsObj = pricingConfig.cms[cms];
      mPrice += cmsObj.min; maxPrice += cmsObj.max;
      mWeeks += cmsObj.wMin; maxWeeks += cmsObj.wMax;

      var summaryItems = [];
      summaryItems.push(`Up to ${pages} Pages`);
      summaryItems.push(copyObj.list);
      summaryItems.push(cmsObj.list);

      if (isEcom) {
        mPrice += pricingConfig.ecommerce.min; maxPrice += pricingConfig.ecommerce.max;
        mWeeks += pricingConfig.ecommerce.wMin; maxWeeks += pricingConfig.ecommerce.wMax;
        summaryItems.push(pricingConfig.ecommerce.list);
      }
      if (isSeo) {
        mPrice += pricingConfig.seo.min; maxPrice += pricingConfig.seo.max;
        mWeeks += pricingConfig.seo.wMin; maxWeeks += pricingConfig.seo.wMax;
        summaryItems.push(pricingConfig.seo.list);
      }
      if (isA11y) {
        mPrice += pricingConfig.a11y.min; maxPrice += pricingConfig.a11y.max;
        mWeeks += pricingConfig.a11y.wMin; maxWeeks += pricingConfig.a11y.wMax;
        summaryItems.push(pricingConfig.a11y.list);
      }

      summaryItems.push(pricingConfig.support[support].list);

      // Pricing mapped to descriptive strings
      var priceString = "Flexible options available";
      if (mPrice < 5000) {
        priceString = "Cost-effective options";
      } else if (mPrice >= 5000 && mPrice < 10000) {
        priceString = "Standard growth options";
      } else if (mPrice >= 10000 && mPrice < 20000) {
        priceString = "Tailored project scope";
      } else {
        priceString = "Custom enterprise quote";
      }

      // Updates
      $('#calc-price-range').fadeOut(150, function () {
        $(this).text(priceString).fadeIn(150);
      });

      $('#calc-timeline').text(mWeeks + '–' + maxWeeks + ' Weeks');
      $('#calc-tier-badge').text(base.label);

      // Update Summary List Elements cleanly
      var $summaryList = $('#calc-summary-list');
      $summaryList.empty();
      summaryItems.forEach(function (item) {
        $summaryList.append('<li class="mb-2"><i class="bi bi-arrow-right-short text-primary fs-6 me-1"></i> <span class="summary-text">' + item + '</span></li>');
      });
    }

    // Attach listeners
    $estimatorForm.on('change input', 'select, input', function () {
      updateEstimator();
    });

    // Handle "Customize this package" buttons from Tier Section
    $('.select-tier-btn').on('click', function (e) {
      e.preventDefault();
      var tier = $(this).data('tier');
      $('#est-site-type').val(tier);

      // Auto-adjust pages based on tier preset logic
      if (tier === 'launch') { $('#est-pages').val(2); $('#est-cms').val('none'); }
      if (tier === 'business') { $('#est-pages').val(8); $('#est-cms').val('basic'); }
      if (tier === 'growth') { $('#est-pages').val(15); $('#est-cms').val('full'); }
      if (tier === 'enterprise') { $('#est-pages').val(25); $('#est-cms').val('full'); }

      updateEstimator();

      // Scroll to estimator smoothly
      $('html, body').animate({
        scrollTop: $('#estimator').offset().top - 80
      }, 500);
    });

    // Initialize to default selected state on load
    updateEstimator();
  }

  /* ─── Global Print Invoice Hook ─── */
  window.printEstimate = function () {
    var dateString = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var tierText = $('#calc-tier-badge').text();
    var timelineText = $('#calc-timeline').text();
    var priceText = $('#calc-price-range').text();

    var summaryHtml = '';
    $('#calc-summary-list .summary-text').each(function () {
      summaryHtml += '<tr><td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; color: #495057;">' + $(this).text() + '</td></tr>';
    });

    $('#print-date').text(dateString);
    $('#print-tier').text(tierText);
    $('#print-timeline').text(timelineText);
    $('#print-price').text(priceText);
    $('#print-summary-body').html(summaryHtml);

    window.print();
  };

})(jQuery);
