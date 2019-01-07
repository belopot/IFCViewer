(() => {
  angular.module("app").controller("payrollCtrl", payrollCtrl);

  function payrollCtrl(
    $scope,
    $timeout,
    $location,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals
  ) {
    /* Requiring vars */
    let vm = this;
    const { logout, userStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    /* Get project list */
    vm.userData = userStore.get();
    vm.logout = () => { logout(); };


    var url = $location.path();
    
    
    $('.payrollMenu').css('display', 'block !important');
    
    $('.payrollList').DataTable();
    
    
  }
})();
