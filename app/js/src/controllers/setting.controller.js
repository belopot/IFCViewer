(() => {
  angular.module("app").controller("settingCtrl", settingCtrl);

  function settingCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    Upload
  ) {
    /* Requiring vars */

    let vm = this;
    const { logout, userStore, companyStore } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    vm.userData = userStore.get();
    if (companyStore.get()) {
      vm.companyData = companyStore.get();
      vm.privileges = vm.companyData.privileges;
    } else {
      apiFactory
        .getCompanyById(vm.userData.companyId)
        .then(resp => {
          vm.companyData = resp.data;
          vm.privileges = vm.companyData.privileges;
        })
        .catch(e => {
          console.log(e);
        });
    }

    vm.submitRoleSettings = formData => {
      apiFactory
        .updateRoleBasedAccess(formData)
        .then(resp => {
          Notification.success(resp.data.message);
          companyStore.refetch(vm.userData.companyId);
        })
        .catch(e => {
          Notification.error("Something went wrong");
          console.log(e);
        });
    };

    vm.goToDashboard = () => {
      $state.go("dashboard");
    };

    vm.logout = () => {
      logout();
    };
  }
})();
