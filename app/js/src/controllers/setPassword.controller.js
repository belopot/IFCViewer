(() => {
  angular.module("app").controller("setPasswordCtrl", setPasswordCtrl);

  function setPasswordCtrl(
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

    const { token } = $location.search();

    if (!token) {
      return;
    }

    apiFactory
      .isTokenValid({ token })
      .then(resp => {
        console.log(resp.data);
        if (resp.data.tokenValid) {
          vm.user = resp.data.user;
          $(".forgotPassModal").modal("show");
        } else {
          console.log("asdad");
          $(".tokenInvalid").modal("show");
        }
      })
      .catch(e => {
        console.log(e);
      });

    vm.resetPass = (isValid, data) => {
      $(".forgotPassModal").modal("hide");
      if (vm.resetPass.password === vm.resetPass.c_password) {
        var data = {
          password: vm.resetPass.password,
          user: vm.user
        };
        console.log(data);
        apiFactory
          .setPassword(data)
          .then(resp => {
            Notification.success(resp.data.message);
            $state.go("preLogin");
          })
          .catch(e => {
            console.log(e);
          });
      } else {
        Notification.error("Password Mismatch, Please enter same password");
      }
    };
    vm.back = () => {
      $(".tokenInvalid").modal("hide");
      $timeout(() => {
        $state.go("preLogin");
      });
    };
  }
})();
