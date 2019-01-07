(() => {
  angular.module("app").controller("equipmentViewCtrl", equipmentViewCtrl);

  function equipmentViewCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    $stateParams,
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
    vm.mUnits = globals.mUnits;
    globals.getCurrency().then(resp => {
      vm.currencies = resp.data;
    });
    vm.addEquipment = {
      conversionFactor: 1
    };

    apiFactory
      .getCompanyById(vm.userData.companyId)
      .then(resp => {
        vm.companyData = resp.data;
        vm.addEquipment.currency = angular.copy(
          vm.companyData.currentCurrency.currencyCode
        );
        vm.companyCurrency = angular.copy(
          vm.companyData.currentCurrency.currencyCode
        );
        console.log(vm.addEquipment.currency);
        $("#currency")
          .val(vm.addEquipment.currency)
          .trigger("change.select2");
      })
      .then(e => {
        console.log(e);
      });

    let gAryLocation = [];
    vm.placeMarker = function(map) {
      console.log(this.getPlace());
      const placeData = this.getPlace().geometry.location;
      vm.gmap.markers = [[placeData.lat(), placeData.lng()]];
      vm.gmap.zoom = 15;
      vm.gmap.center = `${placeData.lat()},${placeData.lng()}`;
      // vm.event.location =  [placeData.lat(), placeData.lng()]
      gAryLocation = [placeData.lat(), placeData.lng()];
    };

    vm.showConversionRate = (from, to) => {
      console.log(from, to);
      $(".loader").show();
      let currencyData = {
        from,
        to
      };
      if (from && to) {
        apiFactory
          .showConversionRate(currencyData)
          .then(resp => {
            vm.equipment.conversionFactor = resp.data.conversionFactor;

            $timeout(function() {
              $(".loader").hide();
            }, 500);
          })
          .catch(e => {
            console.log(e);
          });
      }
    };
    vm.gmap = {
      url:
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyA3MIA-mKWq_60q1K0zOHguraxT-1QPxNU&libraries=places",
      markers: [],
      styles: [],
      center: "",
      zoom: 8
    };
    vm.equipmentId = $stateParams.id;
    
    apiFactory
      .getEquipmentById(vm.equipmentId)
      .then(resp => {
        console.log(resp.data);
        $(".select2-choice .select2-chosen").text("");
        vm.equipment = resp.data;
        vm.equipment.equipmentCost = resp.data.currentRate.equipmentCost.value;
        vm.equipment.rooferCost = resp.data.currentRate.rooferCost.value;
        vm.equipment.unit = resp.data.unit;
        vm.addEquipment.currency =
          resp.data.currentRate.equipmentCost.currencyCode;
        vm.showConversionRate(
          resp.data.currentRate.equipmentCost.currencyCode,
          resp.data.currentRate.equipmentCost.currencyCode
        );
        vm.gmap.center = resp.data.loc.coordinates;
        vm.uploadImg = resp.data.files.images;
        vm.uploadFiles = resp.data.files.docs;
        //$scope.$apply();
      })
      .catch(e => {
        console.log(e);
      });

    vm.editEquipment = (companyCurrency, currentCurrency) => {
      $("#equipment_modal").modal();
      vm.showConversionRate(companyCurrency, currentCurrency)
    }
    
    vm.unitSelect = data => {
      vm.equipment.unit = data.name;
    };
    

    vm.fileUpdated = (files, event, modal) => {
      console.log(vm.inputImg);
      let fileObj = event.target.files;
      vm.fileNames = Object.keys(fileObj).map(x => fileObj[x].name);
      angular.forEach(files, function (x, index) {
        x.description = "";
        if (modal == "image") {
          if (vm.uploadImg.length == 0) {
            vm.uploadImg.push(x);
          } else {
            let duplicateImg = false;
            angular.forEach(vm.uploadImg, function (y) {
              if (x.name == y.name) {
                duplicateImg = true;
                return;
              }
            });
            if (!duplicateImg) {
              vm.uploadImg.push(x);
            } else {
              Notification.error("File name already exist");
            }
          }
        } else {
          if (vm.uploadFiles.length == 0) {
            if (/image/.test(x.type)) {
              vm.uploadImg.push(x);
            } else {
              vm.uploadFiles.push(x);
            }
          } else {
            let duplicateImg = false;
            angular.forEach([].concat(vm.uploadFiles, vm.uploadImg), function (
              y
            ) {
              if (x.name == y.name) {
                duplicateImg = true;
                return;
              }
            });
            if (!duplicateImg) {
              if (/image/.test(x.type)) {
                vm.uploadImg.push(x);
              } else {
                vm.uploadFiles.push(x);
              }
            } else {
              Notification.error("File name already exist");
            }
          }
        }
      });
      console.log(vm.uploadImg);
    };
    
    vm.deleteFile = (indexVal, type) => {
      if (type == "image") {
        vm.uploadImg.splice(indexVal, 1);
      } else {
        vm.uploadFiles.splice(indexVal, 1);
      }
    };
    vm.descriptionPopover = (indexVal, type) => {
      $scope.fileType = type;
      $scope.fileIndex = indexVal;
    };
    vm.addDescription = (index, data) => {
      if ($scope.fileType == "image") {
        vm.uploadImg[index].description = data;
        if (inventoryState.get().tab == 0) {
          $("#closePopoverImg_" + index).trigger("click");
        } else {
          $("#closePopoverDcpImg_" + index).trigger("click");
        }
      } else {
        vm.uploadFiles[index].description = data;
        if (inventoryState.get().tab == 0) {
          $("#closePopoverFile_" + index).trigger("click");
        } else {
          $("#closePopoverDcpFile_" + index).trigger("click");
        }
      }
    };

    vm.updateEquipment = function(Equipments) {
      let files = ($scope.imgAndFiles = [].concat(
        vm.uploadImg,
        vm.uploadFiles
      ));
      console.log("Equipments: ", Equipments);
      var formData = {
        name: Equipments.name,
        unit: Equipments.unit,
        files: files,
        equipmentCost: {
          value: vm.changeCost(
            Equipments.equipmentCost,
            Equipments.conversionFactor
          ),
          currencyCode: vm.companyData.currentCurrency.currencyCode
        },
        workers: Equipments.workers,
        rooferCost: {
          value: vm.changeCost(
            Equipments.rooferCost,
            Equipments.conversionFactor
          ),
          currencyCode: vm.companyData.currentCurrency.currencyCode
        },
        location: gAryLocation
      };
      console.log(formData);
      $("#equipment_modal").modal("hide");
      apiFactory
        .updateEquipment(Equipments._id, formData)
        .then(resp => {
          Notification.success(resp.data.message);
          vm.sortEquipment("createdAt");
        })
        .catch(e => {
          console.log(e);
        });
    };

    // add equipment -end
    let gAryCompanyMembers = [];
    apiFactory
      .getAllMembersInCurrentCompany(vm.userData.companyId)
      .then(data1 => {
        console.log(data1);
        gAryCompanyMembers = data1.data.data;
        vm.companyMembers = gAryCompanyMembers;
      })
      .catch(err => {
        console.log(err);
        Notification.error(err.data.message);
      });

    $scope.slider2 = [
      { img: "/assets/images/equipment2.jpg" },
      { img: "/assets/images/equipment2.jpg" },
      { img: "/assets/images/equipment2.jpg" }
    ];
    /* $scope.equip_table = [
      { unit: 'Currency', mt: 'Danish Krone' },
      { unit: 'Conversion Factor', mt: '1' },
      { unit: 'Equipment Cost (DKK)', mt: '---' },
      { unit: 'Worker Cost (DKK)', mt: '---' },
      { unit: 'Worker ID', mt: 'NNS1 - Kim Mosegaard' }
    ] */
  }
})();
