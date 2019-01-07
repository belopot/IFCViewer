(() => {
  angular.module("app").directive("canvasPdf", canvasPdf);

  function canvasPdf($rootScope, apiFactory, $timeout, globals, Notification) {
    return {
      restrict: "A",
      scope: {
        current: "="
      },
      link: function($scope, elem, attrs) {
        globals.renderPage($scope.current, elem[0]);
        $timeout(() => {
          $scope.$apply();
        });
      }
    };
  }
})();
