(() => {
  angular.module("app").controller("createProjectCtrl", createProjectCtrl);

  function createProjectCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    NgMap,
    globals
  ) {
    /* Requiring vars */

    let vm = this;

    const {
      logout,
      userStore,
      companyStore
    } = globals;

    if (!authFactory.checkUser()) {
      logout();
    }

    if (!authFactory.checkPrivilege("project", "createProject")) {
      Notification.warning("Insufficient permissions");
      $state.go("dashboard");
      return;
    }
    vm.clients = [];
    // apiFactory.listAllClients().then(resp => {
    //   vm.clients = resp.data.list;
    // });

    $scope.$watch("vm.projectData.client", function (value) {
      $("a.item-selected span").removeClass("glyphicon glyphicon-remove");
      $("a.item-selected span").addClass("fas fa-times mr-3");
    });

    Promise.all([
        apiFactory.listAllClients(),
        apiFactory.getHierarchyTemplate()
      ])
      .then(resp => {
        vm.clients = resp[0].data.list;
        vm.templateList = resp[1].data.data;
        let sampleTemplate = vm.templateList.filter((item) => {
          return item._id == "5b8910fbdd6fa81a20bfe745";
        })
        vm.filemanagerTemplate = "5b8910fbdd6fa81a20bfe745";

      })
      .catch(e => {
        console.log(e);
      });

    vm.gmap = {
      url: "https://maps.googleapis.com/maps/api/js?key=AIzaSyA3MIA-mKWq_60q1K0zOHguraxT-1QPxNU&libraries=places",
      markers: [],
      styles: [],
      center: "41,-87",
      zoom: 3
    };

    vm.projectData = {
      address: {}
    };

    $scope.select2Options = {
      allowClear: true
    };

    vm.placeMarker = function (map) {
      const placeData = this.getPlace().geometry.location;
      vm.gmap.markers = [
        [placeData.lat(), placeData.lng()]
      ];
      vm.gmap.zoom = 15;
      vm.gmap.center = `${placeData.lat()},${placeData.lng()}`;
      vm.projectData.address.loc = {
        coordinates: [placeData.lat(), placeData.lng()]
      };
    };

    vm.addProject = formData => {
      formData.client = formData.client._id;
      apiFactory
        .createProject(formData)
        .then(resp => {
          Notification.success("Project has been created successfully");

          let payload = {
            projectId: resp.data._id,
            templateId: resp.data._id &&
              (vm.filemanagerTemplate && vm.filemanagerTemplate != "false") ?
              vm.filemanagerTemplate : "5b8910fbdd6fa81a20bfe745"
          };
          apiFactory
            .loadHierarchyTree(payload)
            .then(resp => {
              console.log(resp.data.message);
            })
            .catch(e => {
              console.log(e);
            });

          console.log("projectid", resp.data._id);
          $state.go("dashboard");
        })
        .catch(e => {
          console.log(e);
          Notification.error("Something went wrong");
        });
    };

    vm.updateMarker = function () {
      let pos = this.getPosition();
      vm.projectData.address.loc = {
        coordinates: [pos.lat(), pos.lng()]
      };
    };

    NgMap.getMap().then(map => {
      vm.map = map;
      map.setOptions({
        styles: vm.gmap.styles,
        disableDefaultUI: true,
        zoomControl: true,
        zoom: 1,
        center: {
          lat: 0,
          lng: 0
        }
      });
    });

    vm.logout = () => {
      logout();
    };

    vm.assignTemplate = () => {
      vm.filemanagerTemplate = vm.selectedTemplate._id;
      $('#assignTemplateModal').modal('hide')
    }
  }
})();