(() => {
    angular.module("app").controller("_3dDashboardCtrl", _3dDashboardCtrl);

    function _3dDashboardCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    localStorageService,
    globals,
    NgMap
  ) {
    /* Requiring vars */

    let vm = this;
      vm.loggedIn = true
    const { logout, userStore, throttler } = globals;

    if (!authFactory.checkUser()) {
      logout();
      vm.loggedIn = false
      return;
    }

    

    vm.logout = () => {
      logout();
    };
  }
})();
