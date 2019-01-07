(() => {
    angular.module("app").controller("ARCtrl", ARCtrl);
  
    function ARCtrl(
      $scope,
      $timeout,
      authFactory,
      $state,
      apiFactory,
      Notification,
      globals,
      NgMap,
      Upload
    ) {
  
    
      /* Requiring vars */
      let vm = this;
      const { logout, userStore } = globals;
      if (!authFactory.checkUser()) {
        logout();
        return;
      }
      vm.logout = () => {
          logout();
      };
      /* Get project list */
      vm.userData = userStore.get();
  
      
    }
  })();
  