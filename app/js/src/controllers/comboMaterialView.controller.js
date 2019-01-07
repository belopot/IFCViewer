(() => {
  angular
    .module("app")
    .controller("comboMaterialViewCtrl", comboMaterialViewCtrl);

  function comboMaterialViewCtrl(
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
    
    vm.editFlag = false
    vm.comboId = $stateParams.id;
    vm.mUnits = globals.mUnits;
    vm.removedFiles = [];
    vm.comboMaterialList = [];
    vm.materialTotal = 0;
    vm.rooferTotal = 0

    vm.userData = userStore.get();
    apiFactory
      .getCompanyById(vm.userData.companyId)
      .then(resp => {
        vm.companyData = resp.data;
        vm.companyCurrency = angular.copy(vm.companyData.currentCurrency.currencyCode);
      })
      .then(e => {
        console.log(e);
      });

    function getComboMatDetail() {
      apiFactory.getComboMaterialById(vm.comboId).then(resp => {
        vm.comboData = resp.data.data;
        vm.comboMmatrialName = vm.comboData.name
        vm.description = vm.comboData.description
        vm.uom = vm.comboData.unit
        
        console.log(vm.comboData)
        angular.forEach(vm.comboData.comboMaterialList, function (item) {
          vm.materialCost = item.materialId.currentRate.materialCost.value * item.quantity;
          vm.materialTotal = vm.materialTotal + vm.materialCost
          vm.rooferCost = item.materialId.currentRate.rooferCost.value * item.quantity;
          vm.rooferTotal = vm.rooferTotal + vm.rooferCost
        });
        console.log(vm.comboData);
        $timeout(imgSlider, 1500);
      }).catch(e => {
        console.log(e);
      });
    }
    getComboMatDetail()

    vm.removeImg = (img, type) => {
      if (type == 'materialDocument') {
        vm.removedFiles.push(vm.materialImg[img]._id)
        vm.materialImg.splice(img, 1)
      } else {
        vm.removedFiles.push(vm.materialFiles[img]._id)
        vm.materialFiles.splice(img, 1)
      }
    }

    vm.deleteFile = (indexVal, type, newFile) => {
      if (type == "image") {
        vm.uploadImg.splice(indexVal, 1);
      } else {
        vm.uploadFiles.splice(indexVal, 1);
      }
    };

    vm.editComboMaterialList = (item) => {
      vm.materialList = vm.comboData.comboMaterialList[item]
      vm.materialQty = vm.materialList.quantity
      vm.selectedMaterialCost = vm.materialQty * vm.materialList.materialId.currentRate.materialCost.value
      vm.selectedMaterialRooferCost = vm.materialQty * vm.materialList.materialId.currentRate.rooferCost.value
      if (vm.materialList.percentageAdditions.length != 0 && vm.materialList.percentageAdditions.length != undefined) {
        vm.percentageAddition = vm.materialList.percentageAdditions
      } else {
        vm.percentageAddition = []
      }
      vm.materialIndex = item
      $('#editComboMaterial').modal('show');
      if(item == 'new') {
        $('#editComboMaterial .modal-header h5').text('Add Combo Material Details');
      } else {
        $('#editComboMaterial .modal-header h5').text('Update Combo Material Details');
      }
    }

    vm.materialCombination = material => {
      let data = JSON.parse(material);
      console.log("material--", data);
      if (data != "") {
        vm.comboMaterialList.push({
          materialId: data._id,
          name: data.name,
          quantity: vm.comboList.quantity,
          materialCost: vm.comboList.materialCost,
          rooferCost: vm.comboList.rooferCost,
          percentageAdditions: vm.percentageAddition
        });
        vm.percentageAddition = [];
        vm.comboList = {
          quantity: 1,
          materialCost: 0,
          rooferCost: 0
        };

        vm.editComboMaterial.comboMaterial = "";
        $(".select2-choice .select2-chosen").text("");
      }
    };

    vm.addPercentageValue = () => {
      vm.percentageAddition.push({
        percentageType: "",
        value: ""
      });
    };
    vm.removePercentageAddition = index => {
      vm.percentageAddition.splice(index, 1);
    };

    vm.fileUpdated = (files, event, modal) => {
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
    };
    
    vm.tabChange = (val, flag) => {
      if (val == 1) {
        if (!vm.editComboMaterial.name) {
          Notification.error("Please enter material name");
        } else if (!vm.selectedUnit) {
          Notification.error("Please select material unit");
        /* } else if (!vm.editComboMaterial.description) {
          Notification.error("Please enter description"); */
        } else {
          nextPrevTab(val)
        }
      } else if (val == 2) {
        if (vm.comboMaterialList.length == 0 && vm.editComboMaterial.comboMaterialList.length == 0) {
          Notification.error("Please add Combination list");
        } else {
          nextPrevTab(val)
        }
      } else {
        nextPrevTab(val);
      }
      function nextPrevTab(val) {
        $(".dcp_modal .nav-tabs li .nav-link").removeClass("active");
        $(".dcp_modal .nav-tabs li .nav-link").eq(val).addClass("active");
        
        $(".dcp_modal .tab-content .tab-pane").removeClass("active");
        $(".dcp_modal .tab-content .tab-pane").removeClass("show");
        $(".dcp_modal .tab-content .tab-pane").eq(val).addClass("show");
        $(".dcp_modal .tab-content .tab-pane").eq(val).addClass("active");
      }

    };
    vm.unitSelect = data => {
      vm.selectedUnit = data.name;
    };

    vm.editCombo = (val) => {
      if (val == 1) { // edit Material
        vm.editFlag = true
        vm.editComboMaterial = angular.copy(vm.comboData)
        vm.selectedUnit = vm.editComboMaterial.unit
        vm.materialImg = vm.editComboMaterial.files.images;
        vm.materialFiles = vm.editComboMaterial.files.docs;
        vm.percentageAddition = []
        vm.uploadImg = []
        vm.uploadFiles = []
        $('#todo_modal.dcp_modal').modal('show')
        /* $('.materialDetail textarea, .materialDetail input, .materialDetail select').attr('disabled', false)
        console.log(vm.comboData.comboMaterialList) */
      } else if (val == 2) {
        // $('.materialDetail textarea, .materialDetail input, .materialDetail select').attr('disabled', true)
        $scope.imgAndFiles = [].concat(vm.uploadImg, vm.uploadFiles);
        $scope.uploadallFiles = [].concat(vm.uploadImg, vm.uploadFiles, vm.materialImg, vm.materialFiles);
        
        let description = [];
        if (vm.uploadImg.length > 0 || vm.uploadFiles.length > 0) {
          $scope.imgAndFiles.map((x, i) => {
            description.push({
              assetDescription: x.description
            })
          })
        }
        
        let combainedCMList = [].concat(vm.comboMaterialList, vm.editComboMaterial.comboMaterialList);
        console.log(combainedCMList)
        
        var cmList = [];
        combainedCMList.forEach(x => {
          console.log('x====', x)
          cmList.push({
            _id: x._id,
            materialId: x.materialId,
            quantity: x.quantity,
            percentageAdditions: x.percentageAdditions
          });
        });

        var data = {
          name: vm.editComboMaterial.name,
          unit: vm.selectedUnit,
          comboMaterialList: cmList,
          files: $scope.imgAndFiles,
          assetObj: description
        };

        var comboListData = {
          comboListArray: cmList,
          deletedComboList: vm.deletedComboList
        };
        
        console.log(data, '===data')

        apiFactory.updateComboMaterialList(vm.comboData._id, comboListData).then(resp => {
          apiFactory.updateComboMaterial(vm.comboData._id, data).then(resp => {
            Notification.success(resp.data.message);
            $('#todo_modal.dcp_modal').modal('hide')
            getComboMatDetail()
            vm.fileNames = []
            $timeout(imgSlider, 1000);
          }).catch(e => {
            console.log(e);
          });
        }).catch(e => {
          console.log(e);
        });

        // var comboMaterialData = {
        //   name: $scope.rateAnalysisOBJ.name,
        //   description: $scope.rateAnalysisOBJ.description,
        //   unitSymbol: $scope.rateAnalysisOBJ.unitSymbol,
        //   removedFiles: $scope.removedFiles,
        //   files: vm.newFiles
        // };
      }
    }

    vm.updateCombo = (item, data) => {
      vm.comboData.comboMaterialList[item].quantity = vm.materialQty
      vm.comboData.comboMaterialList[item].percentageAdditions = data
      console.log(vm.comboData.comboMaterialList[item].percentageAdditions)
      $('#editComboMaterial').modal('hide')
    }

    function imgSlider() {
      $("#comboCarousel").flexslider({
        animation: "slide",
        controlNav: false,
        animationLoop: false,
        slideshow: false,
        itemWidth: 75,
        itemMargin: 5,
        asNavFor: "#comboSlider"
      });

      $("#comboSlider").flexslider({
        animation: "slide",
        controlNav: false,
        animationLoop: false,
        slideshow: false,
        sync: "#comboCarousel"
      });
    }

    apiFactory
      .listAllMaterials()
      .then(resp => {
        vm.allmaterilaList = resp.data.list;
        vm.comboList = {
          quantity: 1,
          materialCost: 0,
          rooferCost: 0
        };
      })
      .catch(e => {
        console.log(e);
      });
    // material on change function
    vm.getMaterialInfo = material => {
      let materialInfo = JSON.parse(material);
      
      if (material) {
        vm.comboList.materialCost = parseFloat(
          Math.round(
            vm.comboList.quantity *
            materialInfo.currentRate.materialCost.value *
            100
          ) / 100
        );
        vm.comboList.rooferCost = parseFloat(
          Math.round(
            vm.comboList.quantity *
            materialInfo.currentRate.rooferCost.value *
            100
          ) / 100
        );
        $("a.item-selected span").removeClass("glyphicon glyphicon-remove");
        $("a.item-selected span").addClass("fas fa-times mr-3");
      }
    };
    vm.deletedComboList = []
    vm.removeMateril = (item,flag) => {
      if(flag == 'new') {
        vm.comboMaterialList.splice(item, 1);
      } else {
        vm.deletedComboList.push(vm.editComboMaterial.comboMaterialList[item]._id)
        vm.editComboMaterial.comboMaterialList.splice(item, 1)
      }
    };
  }
})();
