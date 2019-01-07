(() => {
  angular.module("app").controller("projectCtrl", projectCtrl);

  function projectCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    NgMap
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

    apiFactory
      .listAllProjects()
      .then(resp => {
        console.log(resp.data);
      })
      .catch(e => {
        console.log(e);
      });

    vm.logout = () => {
      logout();
    };
  }
})();
