(function ($) {
  'use strict';

  var $navCollapse = $('#navbarNav');
  var $navbar = $('.site-navbar');

  function setNavOpenState(isOpen) {
    $('body').toggleClass('nav-open', isOpen).css('overflow', isOpen ? 'hidden' : '');
    $navbar.toggleClass('menu-open', isOpen);
    $('.navbar-toggler').attr('aria-expanded', isOpen ? 'true' : 'false');
  }

  function closeMobileNav(restoreFocus) {
    if (!$navCollapse.length || window.innerWidth >= 992 || !$navCollapse.hasClass('show')) {
      setNavOpenState(false);
      return;
    }

    var bsCollapse = bootstrap.Collapse.getInstance($navCollapse[0]);
    if (!bsCollapse) {
      bsCollapse = new bootstrap.Collapse($navCollapse[0], { toggle: false });
    }

    if (restoreFocus) {
      $navCollapse.one('hidden.bs.collapse', function () {
        $('.navbar-toggler').trigger('focus');
      });
    }

    bsCollapse.hide();
  }

  /* ─── Sticky nav ─── */
  $(window).on('scroll', function () {
    var scrollTop = $(window).scrollTop();
    if (scrollTop > 250) {
      $('body').addClass('sticky-active');
    } else {
      $('body').removeClass('sticky-active');
    }
  });

  /* ─── Mobile nav: ESC key closes + focus trap ─── */
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      if ($navCollapse.hasClass('show')) {
        closeMobileNav(true);
      }
    }
  });

  if ($navCollapse.length) {
    $navCollapse.on('show.bs.collapse', function () {
      setNavOpenState(true);
    });

    /* Keep focus inside open mobile nav */
    $navCollapse.on('shown.bs.collapse', function () {
      var $focusable = $(this).find('a, button').filter(':visible');
      if ($focusable.length) $focusable.first().focus();
    });

    $navCollapse.on('hidden.bs.collapse', function () {
      setNavOpenState(false);
    });
  }

  $(window).on('resize', function () {
    if (window.innerWidth >= 992) {
      setNavOpenState(false);
      if ($navCollapse.length) {
        $navCollapse.removeClass('show').attr('style', '');
      }
    }
  });

  $(document).on('click', '.navbar-nav .nav-link, .site-navbar__cta', function () {
    if (window.innerWidth < 992) {
      var href = $(this).attr('href') || '';
      if (href.charAt(0) !== '#') {
        setNavOpenState(false);
      }
      if (!$navCollapse.length || !$navCollapse.hasClass('show')) return;
      if (href.charAt(0) !== '#') {
        closeMobileNav(false);
      }
    }
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

  /* ─── Portfolio filtering ─── */
  $(document).on('click', '.portfolio-filter-btn', function () {
    var $btn = $(this);
    var filter = $btn.data('filter');

    // Toggle active button
    $('.portfolio-filter-btn').removeClass('active').attr('aria-pressed', 'false');
    $btn.addClass('active').attr('aria-pressed', 'true');

    // Show / hide cards
    $('.portfolio-grid > [data-cats]').each(function () {
      var cats = ($(this).data('cats') || '').toString().split(/\s+/).filter(Boolean);
      var isMatch = filter === 'all' || cats.indexOf(filter) !== -1;
      $(this).toggleClass('d-none', !isMatch);
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
        var $submitBtn = $(form).find('button[type="submit"]');
        var originalText = $submitBtn.text();
        $submitBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...');

        var templateParams = {
          from_name:    $(form).find('#contact-name').val().trim(),
          from_email:   $(form).find('#contact-email').val().trim(),
          project_type: $(form).find('#project-type').val() || 'Not specified',
          budget:       $(form).find('#budget').val() || 'Not specified',
          message:      $(form).find('#contact-message').val().trim()
        };

        emailjs.send('service_7yk7d1s', 'template_i4hq8r5', templateParams)
          .then(function () {
            $(form).find('.row').fadeOut(200, function () {
              $('#formSuccess').fadeIn(300);
            });
          })
          .catch(function (error) {
            console.error('EmailJS error:', error);
            alert('There was an issue sending your request. Please email volatile-solutions@outlook.com directly.');
            $submitBtn.prop('disabled', false).text(originalText);
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

  /* ─── Packages Page: Starting Scope Estimator ─── */
  var $estimatorForm = $('#packages-estimator-form');
  if ($estimatorForm.length) {
    var packageOrder = ['starter', 'standard', 'premium'];
    var packageConfig = {
      starter: {
        label: 'Starter',
        subtitle: 'Simple starting scope',
        timeline: '1-2 weeks',
        weeksMin: 1,
        weeksMax: 2,
        siteType: 'Focused website',
        context: 'Best fit for businesses getting online with a focused website and a clear first contact path.',
        features: [
          'Clear message and contact path',
          'Professional design that builds trust',
          'A strong first online presence'
        ],
        nextStep: 'Book a Discovery Call and we will confirm the exact pages you need and what content is already ready.'
      },
      standard: {
        label: 'Standard',
        subtitle: 'Flexible starting scope',
        timeline: '4-6 weeks',
        weeksMin: 4,
        weeksMax: 6,
        siteType: 'Multi-page website',
        context: 'Best fit for businesses ready to grow and improve lead flow with a clearer multi-page structure.',
        features: [
          'Multi-page site built around your services',
          'Stronger lead paths and clearer structure',
          'Room to grow as your business grows'
        ],
        nextStep: 'Book a Discovery Call and we will confirm the exact page structure, content needs, and what should happen first.'
      },
      premium: {
        label: 'Premium',
        subtitle: 'Tailored to scope',
        timeline: '6-8 weeks',
        weeksMin: 6,
        weeksMax: 8,
        siteType: 'Advanced website or custom build',
        context: 'Best fit for businesses that need more structure, custom requirements, or a larger build from the start.',
        features: [
          'Larger site structure or custom features',
          'Built around how your business works',
          'Designed to support growth over time'
        ],
        nextStep: 'Book a Discovery Call so we can sort the custom requirements, decide what should be phased, and define the right first build.'
      }
    };

    var goalConfig = {
      'getting-online': {
        package: 'starter',
        detail: 'The project is centered on getting the business online with a clear first impression.'
      },
      'ready-grow': {
        package: 'standard',
        detail: 'The project needs a stronger structure and clearer paths for visitors to become leads.'
      },
      'custom-build': {
        package: 'premium',
        detail: 'The project likely needs more custom planning, structure, or special requirements.'
      }
    };

    var structureConfig = {
      focused: {
        package: 'starter',
        detail: 'A focused website with a few key pages is the best fit.'
      },
      multi: {
        package: 'standard',
        detail: 'A multi-page service site with clearer structure is the best fit.'
      },
      advanced: {
        package: 'premium',
        detail: 'A larger site or custom build with more moving parts is the best fit.'
      }
    };

    var contentConfig = {
      ready: {
        addMin: 0,
        addMax: 0,
        detail: 'Content is mostly ready, so the project can move faster.'
      },
      refine: {
        addMin: 0,
        addMax: 1,
        detail: 'Some message refinement will likely be part of the scope.'
      },
      guided: {
        addMin: 1,
        addMax: 2,
        detail: 'The project will need more guidance around message and page direction.'
      }
    };

    var supportConfig = {
      none: {
        detail: 'No ongoing support has been added beyond launch planning.'
      },
      light: {
        detail: 'A short post-launch support window would be helpful after launch.'
      },
      ongoing: {
        detail: 'Ongoing updates after launch should be part of the conversation.'
      }
    };

    function formatTimeline(minWeeks, maxWeeks) {
      return minWeeks + '-' + maxWeeks + ' weeks';
    }

    function resolvePackageKey() {
      var goalKey = goalConfig[$('#est-goal').val()].package;
      var structureKey = structureConfig[$('#est-structure').val()].package;
      var score = Math.max(packageOrder.indexOf(goalKey), packageOrder.indexOf(structureKey));

      if ($('#est-content').val() === 'guided' && score < 2) {
        score += 1;
      }

      return packageOrder[Math.min(score, packageOrder.length - 1)];
    }

    function renderSummaryItem(text) {
      return '<li><i class="bi bi-check2"></i><span class="summary-text">' + text + '</span></li>';
    }

    function updateEstimator() {
      var packageKey = resolvePackageKey();
      var selectedPackage = packageConfig[packageKey];
      var selectedGoal = goalConfig[$('#est-goal').val()];
      var selectedStructure = structureConfig[$('#est-structure').val()];
      var selectedContent = contentConfig[$('#est-content').val()];
      var selectedSupport = supportConfig[$('#est-support').val()];

      var minWeeks = selectedPackage.weeksMin + selectedContent.addMin;
      var maxWeeks = selectedPackage.weeksMax + selectedContent.addMax;

      if ($('#est-support').val() === 'ongoing') {
        maxWeeks += 1;
      }

      $('#calc-package-name').text(selectedPackage.label);
      $('#calc-package-subtitle').text(selectedPackage.subtitle);
      $('#calc-timeline').text(formatTimeline(minWeeks, maxWeeks));
      $('#calc-site-type').text(selectedPackage.siteType);
      $('#calc-context').text(selectedPackage.context);
      $('#calc-next-step').text(selectedPackage.nextStep);

      var $summaryList = $('#calc-summary-list');
      $summaryList.empty();
      selectedPackage.features.forEach(function (feature) {
        $summaryList.append(renderSummaryItem(feature));
      });
      $summaryList.append(renderSummaryItem(selectedGoal.detail));
      $summaryList.append(renderSummaryItem(selectedStructure.detail));
      $summaryList.append(renderSummaryItem(selectedContent.detail));
      $summaryList.append(renderSummaryItem(selectedSupport.detail));
    }

    function presetPackage(packageKey) {
      if (packageKey === 'starter') {
        $('#est-goal').val('getting-online');
        $('#est-structure').val('focused');
        $('#est-content').val('ready');
        $('#est-support').val('none');
      }

      if (packageKey === 'standard') {
        $('#est-goal').val('ready-grow');
        $('#est-structure').val('multi');
        $('#est-content').val('refine');
        $('#est-support').val('light');
      }

      if (packageKey === 'premium') {
        $('#est-goal').val('custom-build');
        $('#est-structure').val('advanced');
        $('#est-content').val('guided');
        $('#est-support').val('ongoing');
      }
    }

    $estimatorForm.on('change input', 'select', function () {
      updateEstimator();
    });

    $('.select-package-btn').on('click', function (e) {
      e.preventDefault();
      presetPackage($(this).data('package'));
      updateEstimator();

      $('html, body').animate({
        scrollTop: $('#scope-estimator').offset().top - 80
      }, 500);
    });

    updateEstimator();
  }

  /* ─── Global Print Invoice Hook ─── */
  window.printEstimate = function () {
    if (!$('#packages-estimator-form').length) return;

    var dateString = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var packageText = $('#calc-package-name').text();
    var subtitleText = $('#calc-package-subtitle').text();
    var timelineText = $('#calc-timeline').text();
    var siteTypeText = $('#calc-site-type').text();

    var summaryHtml = '';
    $('#calc-summary-list .summary-text').each(function () {
      summaryHtml += '<tr><td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; color: #495057;">' + $(this).text() + '</td></tr>';
    });

    $('#print-date').text(dateString);
    $('#print-package').text(packageText);
    $('#print-timeline').text(timelineText);
    $('#print-site-type').text(siteTypeText);
    $('#print-package-repeat').text(packageText);
    $('#print-package-subtitle').text(subtitleText);
    $('#print-package-meta').text(siteTypeText);
    $('#print-summary-body').html(summaryHtml);

    window.print();
  };

  window.emailEstimate = function () {
    if (!$('#packages-estimator-form').length) return;

    var packageText = $('#calc-package-name').text();
    var subtitleText = $('#calc-package-subtitle').text();
    var timelineText = $('#calc-timeline').text();
    var siteTypeText = $('#calc-site-type').text();
    var nextStepText = $('#calc-next-step').text();
    var summaryLines = [];

    $('#calc-summary-list .summary-text').each(function () {
      summaryLines.push('- ' + $(this).text());
    });

    var subject = 'Starting scope request - ' + packageText;
    var body = [
      'Hi Volatile Solutions,',
      '',
      'I built a starting scope on your packages page and would like to talk through it.',
      '',
      'Recommended package: ' + packageText,
      'Starting scope: ' + subtitleText,
      'Estimated timeline: ' + timelineText,
      'Website type: ' + siteTypeText,
      '',
      'Summary:',
      summaryLines.join('\n'),
      '',
      'Next step:',
      nextStepText,
      '',
      'Thanks,'
    ].join('\n');

    window.location.href = 'mailto:volatile-solutions@outlook.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  };

})(jQuery);
