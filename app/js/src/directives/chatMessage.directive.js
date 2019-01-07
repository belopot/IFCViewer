(() => {
  angular.module("app").directive("chatMessage", chatMessage);

  function chatMessage(
    $rootScope,
    apiFactory,
    $timeout,
    globals,
    Notification
  ) {
    return {
      restrict: "E",
      scope: {
        m: "=",
        type: "@"
      },
      template: '<ng-include src="type"></ng-include>',
      link: function($scope, elem, attrs) {
        const { projectStore } = globals;
        $scope.showPreview = format => {
          return /png|jpeg|gif|jpg/.test(format);
        };
      }
    };
  }
})();
