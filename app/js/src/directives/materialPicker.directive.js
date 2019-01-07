(() => {
  angular.module("app").directive("materialPicker", materialPicker);

  function materialPicker(
    $rootScope,
    apiFactory,
    $timeout,
    globals,
    Notification
  ) {
    return {
      restrict: "E",
      templateUrl: "/partials/materialPicker.html",
      scope: {
        materialType: "=",
        selectedMaterial: "=",
        currentShape: "=",
        associations: "="
      },
      link: function($scope, elem, attrs) {
        // let materialType = angular.copy(materialType.type);

        /* $scope.$watch('materialType',(newVal, oldVal) => {
          if(oldVal.type === newVal.type) return;
          // get Material List
          if (newVal.type == 'material') {
            $scope.materialList = []
            apiFactory.listAllMaterials().then(resp => {
              $scope.materialList = resp.data.list;
            }).catch(e => { });

          } else if (newVal.type == 'DCP') {
            $scope.materialList = []
            apiFactory.listAllComboMaterials().then(resp => {
              $scope.materialList = resp.data.list;
            }).catch(e => { });

          } else {
            $scope.materialList = []
            apiFactory.listAllEquipments().then(resp => {
              $scope.materialList = resp.data.list;
            }).catch(e => { });

          }
        }, true) */

        // get Material List
        $scope.materialList = [];
        $scope.entityType = 1;
        apiFactory
          .listAllMaterials()
          .then(resp => {
            $scope.materialList = resp.data.list;
            $scope.selectedMaterial = angular.copy($scope.materialList[0]);
          })
          .catch(e => {});

        // get DCP List
        $scope.dcpList = [];
        apiFactory
          .listAllComboMaterials()
          .then(resp => {
            $scope.dcpList = resp.data.list;
          })
          .catch(e => {});

        // get Equioment List
        $scope.equipmentList = [];
        apiFactory
          .listAllEquipments()
          .then(resp => {
            $scope.equipmentList = resp.data.list;
          })
          .catch(e => {});

        $scope.selectedMaterialInfo = material => {
          $rootScope.$broadcast("selectedMaterial", material);
          console.log(material);
          $scope.materialImages = material;
        };

        $scope.materialSelection = item => {
          $scope.selectedMaterial = item;
        };

        $scope.resetSelectedMaterial = val => {
          if (!$scope.selectedMaterial) {
            return;
          }
          console.log($scope.currentShape);
          if (val == 0) {
            $scope.selectedMaterial = angular.copy($scope.materialList[0]);
            $scope.entityType = val + 1;
          } else if (val == 1) {
            $scope.selectedMaterial = angular.copy($scope.dcpList[0]);
            $scope.entityType = val + 1;
          } else {
            $scope.selectedMaterial = angular.copy($scope.equipmentList[0]);
            $scope.entityType = val + 1;
          }
        };

        $scope.assignMaterial = (shapeId, entityId, type) => {
          $("#loadMaterial").modal("hide");
          $scope.associations.createAssociation(shapeId, entityId, type);
         
        };
      }
    };
  }
})();
