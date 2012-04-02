/**
 * @author Henri MEDOT
 * @version last revision 2009-12-01
 * revised and bugs fixed by Max Franz
 */

$.fn.extend({
  scrollbarPaper: function() {
    this.each(function(i) {
      var $this = $(this);
      var paper = $this.data('paper');
      if (paper == null) {

        var barWidth = function() {
          var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div></div>');
          $('body').append(div);
          var w1 = $('div', div).innerWidth();
          div.css('overflow-y', 'scroll');
          var w2 = $('div', div).innerWidth();
          div.remove();
          return Math.max(w1 - w2, 17);
        }.call();

        $this.before('<div class="scrollbarpaper-container" style="width:' + barWidth + 'px"><div class="scrollbarpaper-track"><div class="scrollbarpaper-drag"><div class="scrollbarpaper-drag-top"></div><div class="scrollbarpaper-drag-bottom"></div></div></div></div>');
        paper = $this.prev();
        $this.append('<div style="clear:both;"></div>');
        var content = $('> :first', $this);
        content.css('overflow', 'hidden');

        $this.data('barWidth',   barWidth);
        $this.data('paper',      paper);
        $this.data('track',      $('.scrollbarpaper-track', paper));
        $this.data('drag',       $('.scrollbarpaper-drag', paper));
        $this.data('dragTop',    $('.scrollbarpaper-drag-top', paper));
        $this.data('dragBottom', $('.scrollbarpaper-drag-bottom', paper));
        $this.data('content',    content);
        $this.data('clearer',    $('> :last', $this));
        paper.hide();
      }

      var barWidth =   $this.data('barWidth');
      var track =      $this.data('track');
      var drag =       $this.data('drag');
      var dragTop =    $this.data('dragTop');
      var dragBottom = $this.data('dragBottom');
      var content =    $this.data('content');
      var clearer =    $this.data('clearer');

      var contentHeight = clearer.position().top - content.position().top;      
      $this.data('height', $this.innerHeight());
      $this.data('contentHeight', contentHeight);
      $this.data('offset', $this.position());

      $this.unbind();
      var ratio = $this.innerHeight() / contentHeight;

      if ((!$.browser.mozilla && ratio < 1) || ($.browser.mozilla && ratio < 0.99)) {

        paper.show();
        content.addClass('scrollbarpaper-visible');
        content.width( Math.ceil($this.width() - content.innerWidth() + content.width() - barWidth) );
        paper.height($this.innerHeight());
        var offset = $this.position();
        paper.css('left', (offset.left + $this.innerWidth() - paper.width()) + 'px').css('top', offset.top);

        var dragHeight = Math.max(Math.round($this.innerHeight() * ratio), dragTop.innerHeight() + dragBottom.innerHeight());
        drag.height(dragHeight);
        var updateDragTop = function() {
          drag.css('top', Math.min(Math.round($this.scrollTop() * ratio), $this.innerHeight() - dragHeight) + 'px');
        };
        updateDragTop();

        $this.scroll(function(event) {
          updateDragTop();
        });

        var unbindMousemove = function() {
          $('html').unbind('mousemove.scrollbarpaper');
        };
        drag.mousedown(function(event) {
          drag.addClass("scrollbarpaper-mousedown");
          unbindMousemove();
          var offsetTop = event.pageY - drag.position().top;
          $('html').bind('mousemove.scrollbarpaper', function(event) {
            $this.scrollTop((event.pageY - $this.position().top - offsetTop) / ratio);
            drag.addClass("scrollbarpaper-dragging");
            return false;
          }).mouseup(function(){
        	  drag.removeClass("scrollbarpaper-mousedown");
        	  drag.removeClass("scrollbarpaper-dragging");
        	  unbindMousemove();
          });
          return false;
        });
      }
      else {
        $this.unbind();
        paper.hide();
        content.removeClass('scrollbarpaper-visible');
        content.width(Math.ceil($this.width() - content.innerWidth() + content.width()));
      }

      var lastWidth = $this.outerWidth();
      var setTimeout = function() {
        window.setTimeout(function() {
          var offset = $this.position();
          var newWidth = $this.outerWidth();
          var dataOffset = $this.data('offset');
          if (($this.innerHeight() != $this.data('height') || newWidth != lastWidth)
           || (clearer.position().top - content.position().top != $this.data('contentHeight'))
           || (offset.top != dataOffset.top)
           || (offset.left != dataOffset.left)) {
            $this.scrollbarPaper();
            lastWidth = newWidth;
          }
          else {
            setTimeout();
          }
        }, 60);
      };
      setTimeout();
    });
  }
});
