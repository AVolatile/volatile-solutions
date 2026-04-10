// Click + scroll behavior for in-page anchors based on href, not index.
(function ($) {
  'use strict';

  function getHeaderOffset() {
    var navHeight = $('.site-navbar__shell').outerHeight() || $('.navbar').outerHeight() || 75;
    return navHeight + 16;
  }

  function closeMobileNav(callback) {
    var $navCollapse = $('#navbarNav');

    if (window.innerWidth >= 992 || !$navCollapse.length || !$navCollapse.hasClass('show')) {
      if (callback) callback();
      return;
    }

    var bsCollapse = bootstrap.Collapse.getInstance($navCollapse[0]);
    if (!bsCollapse) {
      bsCollapse = new bootstrap.Collapse($navCollapse[0], { toggle: false });
    }

    $navCollapse.one('hidden.bs.collapse', function () {
      if (callback) callback();
    });

    bsCollapse.hide();
  }

  function setActiveLink(targetId) {
    var $links = $('.navbar-nav .nav-item .nav-link[href^="#"]');
    $links.removeClass('active').addClass('inactive');
    $links.filter('[href="#' + targetId + '"]').addClass('active').removeClass('inactive');
  }

  // Smooth scroll on click for links with .click-scroll and hash href
  $(document).on('click', '.click-scroll', function (e) {
    var href = $(this).attr('href') || '';
    if (href.indexOf('#') === 0) {
      var $target = $(href);
      if ($target.length) {
        e.preventDefault();
        closeMobileNav(function () {
          $('html, body').animate({ scrollTop: $target.offset().top - getHeaderOffset() }, 360);
          setActiveLink(href.replace('#', ''));
        });
      }
    }
  });

  // Scroll spy: highlight the last section passed
  var sections = ['section_1', 'section_2', 'section_3', 'section_4', 'section_5'];
  $(document).on('scroll', function () {
    var docScroll = $(document).scrollTop() + 1;
    var headerOffset = getHeaderOffset();
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      var id = sections[i];
      var $el = $('#' + id);
      if ($el.length && docScroll >= ($el.offset().top - headerOffset)) {
        current = id;
      }
    }
    if (current) setActiveLink(current);
  });

  // Initialize states
  $(function () {
    var $links = $('.navbar-nav .nav-item .nav-link[href^="#"]');
    $links.addClass('inactive');
    // Set Home active on load if nothing else matches
    $('.navbar-nav .nav-item .nav-link[href="#section_1"]').addClass('active').removeClass('inactive');
  });

})(window.jQuery);
