
  (function ($) {
  
  "use strict";

    // MENU
    $('.navbar-collapse a').on('click',function(){
      $(".navbar-collapse").collapse('hide');
    });
    
    // CUSTOM LINK
    $('.smoothscroll').click(function(){
      var el = $(this).attr('href');
      var elWrapped = $(el);
      var header_height = $('.navbar').height();
  
      scrollToDiv(elWrapped,header_height);
      return false;
  
      function scrollToDiv(element,navheight){
        var offset = element.offset();
        var offsetTop = offset.top;
        var totalScroll = offsetTop-navheight;
  
        $('body,html').animate({
        scrollTop: totalScroll
        }, 300);
      }
    });

    $(window).on('scroll', function(){
      function isScrollIntoView(elem, index) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(window).height()*.5;
        if(elemBottom <= docViewBottom && elemTop >= docViewTop) {
          $(elem).addClass('active');
        }
        if(!(elemBottom <= docViewBottom)) {
          $(elem).removeClass('active');
        }
        var MainTimelineContainer = $('#vertical-scrollable-timeline')[0];
        var MainTimelineContainerBottom = MainTimelineContainer.getBoundingClientRect().bottom - $(window).height()*.5;
        $(MainTimelineContainer).find('.inner').css('height',MainTimelineContainerBottom+'px');
      }
      var timeline = $('#vertical-scrollable-timeline li');
      Array.from(timeline).forEach(isScrollIntoView);
    });
  
  })(window.jQuery);



// Simple social share handlers
(function ($) {
  'use strict';

  function popup(url) {
    var w = 600, h = 520;
    var y = window.top.outerHeight / 2 + window.top.screenY - ( h / 2);
    var x = window.top.outerWidth / 2 + window.top.screenX - ( w / 2);
    window.open(url, 'share', 'toolbar=0,status=0,width=' + w + ',height=' + h + ',top=' + y + ',left=' + x);
  }

  $(document).on('click', '.social-icon-link', function (e) {
    var href = $(this).attr('href');
    if (href === '#') {
      e.preventDefault();
      var page = encodeURIComponent(window.location.href);
      var text = encodeURIComponent(document.title);
      if ($(this).hasClass('bi-twitter')) {
        popup('https://twitter.com/intent/tweet?url=' + page + '&text=' + text);
      } else if ($(this).hasClass('bi-facebook')) {
        popup('https://www.facebook.com/sharer/sharer.php?u=' + page);
      } else if ($(this).hasClass('bi-pinterest')) {
        popup('https://pinterest.com/pin/create/button/?url=' + page + '&description=' + text);
      }
    }
  });

  // Bookmark icon toggler (visual only)
  $(document).on('click', '.custom-icon.bi-bookmark', function (e) {
    e.preventDefault();
    $(this).toggleClass('active');
  });

})(window.jQuery);
