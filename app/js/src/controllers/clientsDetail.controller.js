(() => {
    angular.module("app").controller("clientsDetailCtrl", clientsDetailCtrl);

    function clientsDetailCtrl(
        $scope,
        $timeout,
        authFactory,
        $state,
        $stateParams,
        apiFactory,
        Notification,
        NgMap,
        globals,
        localStorageService

    ){
        let vm = this;

        const { logout,userStore } = globals;
        if (!authFactory.checkUser()) {
            logout();
          }
          vm.userData = userStore.get();

  
          vm.logout = () => {
            logout();
          };

          globals.getCountryCode().then(resp => {
            vm.getCountryCode = resp.data;
           
            vm.loadCountryCode = $query => {
              return new Promise((resolve, reject) => {
                resolve(resp.data);
              });
            };
          });
          vm.clientId = $stateParams.id;
          $scope.getClientDetail = () => {
            apiFactory
              .getClientById(vm.clientId)
              .then(resp => {
                vm.ClientData = resp.data;
                console.log("client: ",vm.ClientData);
              })
            };

            $scope.getClientDetail();

            vm.saveStaffMember=function(staff){
              console.log(staff);

              apiFactory.addStaffMember(staff,vm.clientId)
              .then(resp=>{
                $('#add_member').modal("hide");
                $scope.getClientDetail();
                Notification.success("Member added successfully.");
              }).catch(e=>{
                Notification.error("could not add staff member.");

              })
            };
        
    }

})();