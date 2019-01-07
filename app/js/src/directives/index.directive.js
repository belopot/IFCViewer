(() => {
    angular.module('app').directive('autoComplete', function($timeout) {
      return function(scope, iElement, iAttrs) {
        iElement.autocomplete({
          source: scope[iAttrs.uiItems],
          select: function() {
            $timeout(function() {
              iElement.trigger('input');
            }, 0);
          }
        });
      };
    });
  })();
  
  (() => {
    angular.module('app').directive('errSrc', function() {
    return {
      link: function(scope, element, attrs) {
        element.bind('error', function() {
          if (attrs.src != attrs.errSrc) {
            attrs.$set('src', attrs.errSrc);
          }
        });
      }
    }
  });
  
})();