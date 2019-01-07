(() => {
    angular.module("app").controller("employeesCtrl", employeesCtrl);

    function employeesCtrl(
        $scope,
        $timeout,
        authFactory,
        $state,
        apiFactory,
        Notification,
        NgMap,
        globals,
        localStorageService,
      ) {
        let vm = this;

        const { logout } = globals;
    
        if (!authFactory.checkUser()) {
          logout();
        }


        vm.logout = () => {
          logout();
        };
      }
      

})();