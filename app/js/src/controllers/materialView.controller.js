(() => {
  angular.module("app").controller("materialViewCtrl", materialViewCtrl);

  function materialViewCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    $stateParams,
    apiFactory,
    Notification,
    globals,
    $location,
    Upload
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
    vm.logout = () => {
      logout();
    };
    vm.inputImg=[];
    vm.inputFiles =[];
    vm.clearData = () => {
      vm.inputImg = []
      vm.inputFiles = []
      vm.selectedUnit = ''
      $('#profile-tab, #dcp1').removeClass('active')
      $('#home-tab, #material1').addClass('active')
      $('#material1').addClass('show')
    }

    apiFactory
      .getCompanyById(vm.userData.companyId)
      .then(resp => {
        vm.companyData = resp.data;
        vm.currentCurrency = vm.companyData.currentCurrency.currencyCode;
        console.log(vm.currentCurrency, '---currentCurrency')
      })
      .then(e => {
        console.log(e);
      });

    vm.materialId = $stateParams.id;
    vm.mUnits = globals.mUnits;
    globals.getCurrency().then(resp => {
      vm.currencies = resp.data;
      vm.loadCurrencies = $query => {
        return new Promise((resolve, reject) => {
          resolve(resp.data);
        });
      };
    });
    
    vm.changeCost = (type, cost) => {
      if(type == 'both') {
        vm.materialCostValue = vm.materialCostValue / vm.editMaterial.conversionFactor;
        vm.rooferCostValue = vm.rooferCostValue / vm.editMaterial.conversionFactor
      } else {
        return cost / vm.editMaterial.conversionFactor;
      }
    };

    vm.showConversionRate = (from, to) => {
      $(".loader").show();
      let currencyData = {
        from,
        to
      };
      if (from) {
        apiFactory
          .showConversionRate(currencyData)
          .then(resp => {
            vm.editMaterial.conversionFactor = resp.data.conversionFactor;
            
            /* if (vm.materialCostValue) {
              vm.materialCostValue = vm.materialCostValue * vm.editMaterial.conversionFactor
            }
            if (vm.rooferCostValue) {
              vm.rooferCostValue = vm.rooferCostValue * vm.editMaterial.conversionFactor
            } */
            
            $timeout(function () {
              $(".loader").hide();
            }, 500);
          })
          .catch(e => {
            console.log(e);
          });
      }
      
    };

    vm.tabChange = (val) => {
      if (val == 0) {
        changeTab(val)
      } else if (val == 1) {
        if (!vm.editMaterial.name) {
          Notification.error("Please enter material name");
        } else if (!vm.selectedUnit) {
          Notification.error("Please select material unit");
          /* } else if (!vm.editMaterial.currency) {
            Notification.error("Please select currency"); */
        } else {
          changeTab(val)
        }
      }

      function changeTab(val) {
        $(".material_modal .nav-tabs li .nav-link").removeClass("active");
        $(".material_modal .nav-tabs li .nav-link").eq(val).addClass("active");

        $(".material_modal .tab-content .tab-pane").removeClass("active");
        $(".material_modal .tab-content .tab-pane").removeClass("show");
        $(".material_modal .tab-content .tab-pane").eq(val).addClass("show");
        $(".material_modal .tab-content .tab-pane").eq(val).addClass("active");
      }
      
    };
    apiFactory
      .getAllSuppliers()
      .then(resp => {
        vm.suppliers = resp.data.list;
        console.log(vm.suppliers, '=---suppliers')
      })
      .catch(e => {
        console.log(e);
      });

    vm.editFlag = false;
    vm.removedFiles = [];
    $scope.getMatDetail = () => {
      apiFactory
        .getMaterialById(vm.materialId)
        .then(resp => {
          vm.matrialData = resp.data;
          console.log(vm.matrialData)
          vm.matrialName = vm.matrialData.name;
          vm.matrialUnit = vm.matrialData.unit;
          vm.matrialCost = Number(
            vm.matrialData.currentRate.materialCost.value
          ).toFixed(2);
          vm.matrialCurrencyCode =
            vm.matrialData.currentRate.materialCost.currencyCode;
          vm.matrialRooferCost = Number(
            vm.matrialData.currentRate.rooferCost.value
          ).toFixed(2);
          vm.matrialRooferCurrencyCode = vm.matrialData.currentRate.rooferCost.currencyCode;
          vm.matrialCreatedBy = vm.matrialData.providerData.updatedBy.name;
          vm.matrialCreatedAt = vm.matrialData.createdAt;
          vm.matrialUpdatedAt = vm.matrialData.createdAt;
          $scope.gray_box = [
            { 'img': '/assets/images/Unit-Icon.png', 'title': 'Unit', 'value': vm.matrialUnit },
            { 'img': '/assets/images/Dollar-Icon.png', 'title': 'Material Cost', 'value': vm.matrialCost, 'currencyCode': vm.matrialCurrencyCode },
            { 'img': '/assets/images/Dollar-Icon.png', 'title': 'Worker Cost', 'value': vm.matrialRooferCost, 'currencyCode': vm.matrialRooferCurrencyCode }
          ]
          $scope.nextMaintanceDateCalc(vm.matrialData.createdAt, vm.matrialData.maintenancePeriod);
          
        })
        .catch(e => {
          console.log(e);
        });
    }
    $scope.getMatDetail();
    $scope.nextMaintanceDateCalc = (createdAt, maintenancePeriod) => {
      let createdDate = moment(createdAt).format("X");
      let nextMaintanceDate = moment(createdAt).add(maintenancePeriod, "days").format("X");
      if (createdDate < nextMaintanceDate) {
        vm.nextMaintenanceDate = moment(createdAt).add(maintenancePeriod, "days").format("MMM DD, YYYY");
      } else {
        alert()
        let createdDate1 = moment.utc(createdAt).add(maintenancePeriod, "days").format()
        $scope.nextMaintanceDateCalc(createdDate1, maintenancePeriod)
      }
    }

    vm.removeImg = (indexVal, type) => {
      if (type == 'materialImg') {
        vm.removedFiles.push(vm.matrialData.files.images[indexVal]._id);
        vm.materialImg.splice(indexVal, 1);
      } else if (type == 'image') {
        vm.inputImg.splice(indexVal, 1);
      } else if (type == 'materialDocument') {
        vm.removedFiles.push(vm.matrialData.files.docs[indexVal]._id);
        vm.materialFiles.splice(indexVal, 1);
      } else if (type == 'document') {
        vm.inputFiles.splice(indexVal, 1);
      }
    };
    vm.descriptionPopover = (indexVal, type) => {
      $scope.fileType = type;
      $scope.fileIndex = indexVal;
    }
    vm.addDescription = (index, data) => {
      if ($scope.fileType == 'materialImg') {
        vm.materialImg[index].description = data;
        vm.materialImg[index].assetDescription = data;
      } else if ($scope.fileType == 'image') {
        vm.inputImg[index].description = data;
      } else if ($scope.fileType == 'materialDocument') {
        vm.materialFiles[index].description = data;
        vm.materialFiles[index].assetDescription = data;
      } else if ($scope.fileType == 'document') {
        vm.inputFiles[index].description = data;
      }
    }
    vm.changeMaintenancePeriod = days => {
      vm.editMaterial.maintenanceDate = moment(vm.editMaterial.createdAt)
        .add(days, "days")
        .format();
    };
    
    vm.editMaterialFunction = val => {
      if (val == 1) {
        // edit Material
        vm.editFlag = true;
        vm.editMaterial = angular.copy(vm.matrialData);
        vm.changeMaintenancePeriod(vm.matrialData.maintenancePeriod);
        vm.selectedUnit = vm.editMaterial.unit;
        vm.materialImg = vm.editMaterial.files.images;
        vm.materialFiles = vm.editMaterial.files.docs;
        vm.materialCostValue = vm.editMaterial.currentRate.materialCost.value;
        vm.rooferCostValue = vm.editMaterial.currentRate.rooferCost.value;
        vm.editMaterial.conversionFactor = 1
        vm.showConversionRate(vm.currentCurrency, vm.editMaterial.currency);
        angular.forEach(vm.materialImg, function (x, index) {
          x.description = '';
        });
        angular.forEach(vm.materialFiles, function (x, index) {
          x.description = '';
        });
        let suppliers = vm.editMaterial.suppliers.map(x => x._id)
        
        console.log(vm.editMaterial, '----editMaterial');
        $('#currency').val(vm.currentCurrency).trigger('change.select2');
        $('#suppliers').val(suppliers).trigger('change.select2');
        $('#todo_modal.material_modal').modal('show');
        $('#profile-tab, #dcp1').removeClass('active');
        $('#home-tab, #material1').addClass('active');
        $('#material1').addClass('show');
      } else if (val == 2) {
        console.log(vm.inputImg, vm.inputFiles);
        $scope.uploadFiles = [].concat(vm.inputImg,vm.inputFiles);
        $scope.uploadallFiles = [].concat(vm.inputImg, vm.inputFiles, vm.materialImg, vm.materialFiles);
        console.log($scope.uploadallFiles);
        // update Material
        vm.editFlag = false;
        let description = [];
        if (vm.inputImg.length > 0 || vm.inputFiles.length > 0) {
          $scope.uploadallFiles.map((x, i) => {
            description.push({
              assetDescription: x.description
            })
          })
        }
        var materialupdatedata = {
          name: vm.editMaterial.name,
          unit: vm.selectedUnit,
          removedFiles: vm.removedFiles,
          suppliers: vm.editMaterial.suppliers,
          maintenancePeriod: vm.editMaterial.maintenancePeriod,
          currentRate: {
            materialCost: {
              value: vm.changeCost('material', vm.materialCostValue),
              currencyCode: vm.editMaterial.currency //$scope.checkNull($scope.materialObj.materialCostcurrencyCode)["cc"]
            },
            rooferCost: {
              value: vm.changeCost('roofer', vm.rooferCostValue),
              currencyCode: vm.editMaterial.currency //$scope.checkNull($scope.materialObj.rooferCostcurrencyCode)["cc"]
            }
          },
          files: $scope.uploadFiles,
          assetObj: description
        };
        apiFactory
          .updateMaterialById(vm.materialId, materialupdatedata)
          .then(resp => {
            Notification.success(resp.data.message);
            $('#todo_modal.material_modal').modal('hide');
            $scope.getMatDetail();
            vm.fileNames=[];
          })
          .catch(e => {
            console.log(e);
          });
      }
    };

    vm.fileUpdated = (files, event) => {
      let fileObj = event.target.files;
      vm.fileNames = Object.keys(fileObj).map(x => fileObj[x].name);
      angular.forEach(files, function (x, index) {
        x.description = ''
      })
    };

    function imgSlider() {
      $("#carousel").flexslider({
        animation: "slide",
        controlNav: false,
        animationLoop: false,
        slideshow: false,
        itemWidth: 75,
        itemMargin: 5,
        asNavFor: "#slider"
      });

      $("#slider").flexslider({
        animation: "slide",
        controlNav: false,
        animationLoop: false,
        slideshow: false,
        sync: "#carousel"
      });
    }

    


  }
  
  
})();
