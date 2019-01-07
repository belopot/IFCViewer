(function() {
    angular.module('angular.chips')
        .directive('chipTmpl', ChipTmpl);

    function ChipTmpl() {
        return {
            restrict: 'E',
            transclude: true,
            link: function(scope, iElement, iAttrs, contrl, transcludefn) {
                transcludefn(scope, function(clonedTranscludedContent) {
                    iElement.append(clonedTranscludedContent);
                });
                iElement.on('keydown', function(event) {
                    if (event.keyCode === 8) {
                        scope.$broadcast('chip:delete');
                        event.preventDefault();
                    }
                });
            }
        }
    }
})();
