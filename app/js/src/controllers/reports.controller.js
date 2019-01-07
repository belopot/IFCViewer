(() => {
    angular.module("app").controller("reportsCtrl", reportsCtrl);

    function reportsCtrl(
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

        const { logout, userStore } = globals;
     
        if (!authFactory.checkUser()) {
          logout();
        }
        $scope.currentUser = localStorageService.get("userData")
        
        $scope.reportCategory = ['issueReport', 'safetyReport', 'qaReport'];
        apiFactory.listAllUsers().then(resp => {
          vm.allAdminUsers = resp.data.list;
        });
        apiFactory
        .listAllProjects()
        .then(resp => {
          vm.projectList = resp.data;
          /* Initially load the first project as default */
         
        })
        .catch(e => {
          console.log(e);
        });
        vm.logout = () => {
          logout();
        };
      }
      (function($) {
        $(window).on("load", function() {
          $("#reportModal .modal-body").mCustomScrollbar({
            setHeight: 340,
            theme: "minimal-dark"
          });
        });
      });

})();