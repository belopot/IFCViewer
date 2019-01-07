(() => {
  angular.module("app").controller("materialCtrl", materialCtrl);

  function materialCtrl(
    $scope,
    $timeout,
    authFactory,
    $state,
    apiFactory,
    Notification,
    globals,
    NgMap,
    Upload,
    moment
  ) {
    /* Requiring vars */
    let vm = this;
    const { logout, userStore, debounce } = globals;
    if (!authFactory.checkUser()) {
      logout();
      return;
    }

    /* Get project list */
    vm.userData = userStore.get();

    console.log(vm.userData);
    vm.logout = () => {
      logout();
    };

    vm.timecheck = function(file) {
      console.log(file); //defined in browser, undefined on mobile
    };

    vm.inputImg = [];
    vm.uploadImg = [];
    vm.inputFiles = [];
    vm.uploadFiles = [];
    /* Data table setup **************************/
    vm.dtOptions = {
      retrieve: true,
      paging: false,
      info: false,
      ordering: false
    };

    // $(".materialList").DataTable();

    /* Setting up inventory state */
    const inventoryState = globals.inventoryState();
    vm.activeTab = inventoryState.get().tab;
    $(".tab-content .tab-pane")
      .eq(inventoryState.get().tab)
      .addClass("show");
    vm.currentPage = 1;

    vm.toggleTab = val => {
      inventoryState.setTab(val);
    };

    vm.toggleObj = {
      material: {
        systemTag: true,
        materialCost: false,
        rooferCost: false,
        createdAt: true,
        name: false
      },
      combo: {
        systemTag: true,
        materialCost: false,
        rooferCost: false,
        createdAt: true,
        name: false
      }
    };

    apiFactory
      .getAllSuppliers()
      .then(resp => {
        vm.suppliers = resp.data.list;
      })
      .catch(e => {
        console.log(e);
      });

    vm.searchText = inventoryState.get().searchText;

    $scope.$watch(
      "vm.searchText",
      text => {
        inventoryState.text(text);
      },
      true
    );

    vm.unitSelect = data => {
      vm.selectedUnit = data.name;
    };

    vm.sortDisplay = (type, resource) => {
      if (type && resource) {
        return `Sorted By: ${type} - ${
          vm.toggleObj[resource][type] ? "ASC" : "DSC"
        }`;
      }
    };

    vm.sortMaterials = (type, resource) => {
      /* For toggling ascending and descending order */
      vm.toggleObj[resource][type] === undefined
        ? (vm.toggleObj[resource][type] = true)
        : (vm.toggleObj[resource][type] = !vm.toggleObj[resource][type]);
      let apiName =
        resource === "material" ? "listAllMaterials" : "listAllComboMaterials";

      apiFactory[apiName]({
        page: inventoryState.get().page[resource],
        chunk: 10,
        sort: type,
        search: inventoryState.get().searchText,
        sortType: vm.toggleObj[resource][type]
      })
        .then(resp => {
          vm[resource] = resp.data.list;
          vm[resource + "Count"] = resp.data.total;
          $timeout(() => {
            $("#" + resource + "Pagination").pagination({
              items: vm[resource + "Count"],
              itemsOnPage: 10,
              cssStyle: "light-theme",
              hrefTextPrefix: "#",
              ordering: false,
              currentPage: inventoryState.get().page[resource],
              onPageClick: function(page, event) {
                event.preventDefault();
                inventoryState.setPage(resource, page);

                apiFactory[apiName]({
                  page: page,
                  chunk: 10,
                  sort: type,
                  search: inventoryState.get().searchText,
                  sortType: vm.toggleObj[resource][type]
                })
                  .then(resp => {
                    vm[resource] = resp.data.list;
                  })
                  .catch(e => {
                    console.log(e);
                  });
              }
            });
          });
        })
        .catch(e => {
          console.log(e);
        });
    };

    const searchDebounce = debounce(250); /* Passing in the debounce rate */
    vm.searchMaterials = (text, resource) => {
      /**
       * @param {function} fn - pass the function which you want to debounce
       * @param {Array} args - pass the arguments from the view as an array
       */
      searchDebounce(
        () => {
          let apiName =
            resource === "material"
              ? "listAllMaterials"
              : "listAllComboMaterials";

          apiFactory[apiName]({
            page: 1,
            chunk: 10,
            search: text,
            sort: "createdDate",
            sortType: false
          })
            .then(resp => {
              vm[resource] = resp.data.list;
              vm[resource + "Count"] = resp.data.total;
              $timeout(() => {
                $("#" + resource + "Pagination").pagination({
                  items: vm[resource + "Count"],
                  itemsOnPage: 10,
                  cssStyle: "light-theme",
                  hrefTextPrefix: "#",
                  ordering: false,
                  currentPage: 1,
                  onPageClick: function(page, event) {
                    event.preventDefault();
                    apiFactory[apiName]({
                      page: page,
                      chunk: 10,
                      sort: type,
                      sortType: vm.toggleObj[resource][type]
                    })
                      .then(resp => {
                        vm.materials = resp.data.list;
                      })
                      .catch(e => {
                        console.log(e);
                      });
                  }
                });
              });
            })
            .catch(e => {
              console.log(e);
            });
        },
        [text, resource]
      );
    };

    /* Initially getting the values of material and combo materials */
    vm.sortMaterials("createdAt", "material");
    vm.sortMaterials("createdAt", "combo");
    /* End of  Data table setup **********************/

    /* Add material functionality */
    let defaultMaintenancePeriod = 90;
    vm.addMaterial = {
      conversionFactor: 1,
      maintenancePeriod: defaultMaintenancePeriod,
      maintenanceDate: moment()
        .add(defaultMaintenancePeriod, "days")
        .format()
    };
    vm.changeMaintenancePeriod = days => {
      vm.addMaterial.maintenanceDate = moment()
        .add(days, "days")
        .format();
    };

    vm.tabSettings = { disable: true };

    vm.tabChange = (val, flag) => {
      if (flag == "combo") {
        if (val == 0) {
          vm.tabChangeFun(val);
        } else if (val == 1) {
          if (!vm.addComboMaterialForm.name) {
            Notification.error("Please enter combo material name");
            return;
          } else if (!vm.selectedUnit) {
            Notification.error("Please select unit");
            return;
          } else if (!vm.addComboMaterialForm.description) {
            Notification.error("Please enter combo description");
            return;
          } else {
            vm.tabChangeFun(val);
          }
        } else if (val == 2) {
          if (vm.comboMaterialList.length == 0) {
            Notification.error("Please add Combination list");
            return;
          } else {
            vm.TotalMC = 0;
            vm.TotalRC = 0;
            angular.forEach(vm.comboMaterialList, function(value) {
              vm.TotalMC =
                parseFloat(vm.TotalMC) + parseFloat(value.materialCost);
              vm.TotalRC =
                parseFloat(vm.TotalRC) + parseFloat(value.rooferCost);
            });
            vm.TotalMC = parseFloat(Math.round(vm.TotalMC * 100) / 100);
            vm.TotalRC = parseFloat(Math.round(vm.TotalRC * 100) / 100);
            vm.tabChangeFun(val);
          }
        }
      } else {
        if (val == 0) {
          vm.tabChangeFun1(val);
        }
        if (val == 1) {
          if (!vm.addMaterial.materialName) {
            Notification.error("Please enter material name");
            return;
          } else if (!vm.selectedUnit) {
            Notification.error("Please select material unit");
            return;
            /* } else if (!vm.addMaterial.currency) {
              Notification.error("Please select currency");
              return; */
          } else {
            vm.tabChangeFun1(val);
          }
        }
      }
    };
    vm.tabChangeFun = val => {
      $(".dcp_modal .nav-tabs li .nav-link").removeClass("active");
      $(".dcp_modal .nav-tabs li .nav-link")
        .eq(val)
        .addClass("active");

      $(".dcp_modal .tab-content .tab-pane").removeClass("active");
      $(".dcp_modal .tab-content .tab-pane").removeClass("show");
      $(".dcp_modal .tab-content .tab-pane")
        .eq(val)
        .addClass("show");
      $(".dcp_modal .tab-content .tab-pane")
        .eq(val)
        .addClass("active");
    };

    vm.tabChangeFun1 = val => {
      $(".material_modal .nav-tabs li .nav-link").removeClass("active");
      $(".material_modal .nav-tabs li .nav-link")
        .eq(val)
        .addClass("active");

      $(".material_modal .tab-content .tab-pane").removeClass("active");
      $(".material_modal .tab-content .tab-pane").removeClass("show");
      $(".material_modal .tab-content .tab-pane")
        .eq(val)
        .addClass("show");
      $(".material_modal .tab-content .tab-pane")
        .eq(val)
        .addClass("active");
    };

    apiFactory
      .getCompanyById(vm.userData.companyId)
      .then(resp => {
        vm.companyData = resp.data;
        vm.addMaterial.currency = angular.copy(
          vm.companyData.currentCurrency.currencyCode
        );
        vm.companyCurrency = angular.copy(
          vm.companyData.currentCurrency.currencyCode
        );
        console.log(vm.addMaterial.currency);
        $("#currency")
          .val(vm.addMaterial.currency)
          .trigger("change.select2");
      })
      .then(e => {
        console.log(e);
      });

    $scope.$watch("vm.addMaterial.currency", function(value) {
      $("a.item-selected span").removeClass("glyphicon glyphicon-remove");
      $("a.item-selected span").addClass("fas fa-times mr-3");
    });

    vm.showConversionRate = (from, to) => {
      $(".loader").show();
      let currencyData = {
        from,
        to
      };
      if (from && to) {
        apiFactory
          .showConversionRate(currencyData)
          .then(resp => {
            vm.addMaterial.conversionFactor = resp.data.conversionFactor;

            $timeout(function() {
              $(".loader").hide();
            }, 500);
          })
          .catch(e => {
            console.log(e);
          });
      }
    };

    vm.addMaterialNext = () => {
      console.log(vm.addMaterial.materialUnit);
      if (
        vm.addMaterial.materialName == undefined &&
        vm.addMaterial.materialName == ""
      ) {
        Notification.error("Please enter material name");
        return;
      }

      if (!vm.addMaterial.materialUnit && vm.addMaterial.materialUnit == "") {
        Notification.error("Please select material Unit");
        return;
      }

      if (
        vm.addMaterial.currency == undefined &&
        vm.addMaterial.currency == ""
      ) {
        Notification.error("Please select Currency");
        return;
      }

      $scope.activeJustified = 1;
    };

    vm.changeCost = (type, cost) => {
      if (type == "both") {
        vm.addMaterial.materialCostValue =
          vm.addMaterial.materialCostValue * vm.addMaterial.conversionFactor;
        vm.addMaterial.rooferCostValue =
          vm.addMaterial.rooferCostValue * vm.addMaterial.conversionFactor;
      } else {
        return cost / vm.addMaterial.conversionFactor;
      }
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
    vm.clearData = val => {
      if (val == "dcp") {
        vm.addComboMaterialForm = {};
        vm.inputImg = [];
        vm.uploadImg = [];
        vm.inputFiles = [];
        vm.uploadFiles = [];
        vm.selectedUnit = "";
      } else {
        vm.addMaterial = {
          conversionFactor: 1,
          maintenancePeriod: 90,
          currency: angular.copy(vm.companyData.currentCurrency.currencyCode)
        };
        console.log(vm.addMaterial);
        vm.inputImg = [];
        vm.uploadImg = [];
        vm.inputFiles = [];
        vm.uploadFiles = [];
        vm.selectedUnit = "";
        $("#profile-tab, #dcp1").removeClass("active");
        $("#home-tab, #material1").addClass("active");
        $("#material1").addClass("show");
        vm.changeMaintenancePeriod(vm.addMaterial.maintenancePeriod);
      }
    };
    vm.addMaterialDetails = () => {
      if (!vm.selectedUnit) {
        Notification.error("Please Select Unit");
        return;
      } else if (!vm.addMaterial.materialCostValue) {
        Notification.error("Please Select material cost value");
        return;
      } else if (!vm.addMaterial.rooferCostValue) {
        Notification.error("Please Select roofer cost value");
        return;
      } else {
        $scope.imgAndFiles = [].concat(vm.uploadImg, vm.uploadFiles);
        console.log($scope.imgAndFiles);
        var formData = {
          name: vm.addMaterial.materialName,
          unit: vm.selectedUnit,
          materialCost: {
            value: vm.changeCost("material", vm.addMaterial.materialCostValue),
            currencyCode: vm.addMaterial.currency
          },
          rooferCost: {
            value: vm.changeCost("roofer", vm.addMaterial.rooferCostValue),
            currencyCode: vm.addMaterial.currency
          },
          maintenancePeriod: vm.addMaterial.maintenancePeriod,
          suppliers: vm.addMaterial.suppliers,
          files: $scope.imgAndFiles,
          assetObj: $scope.imgAndFiles.map((x, i) => {
            return {
              assetDescription: x.description
            };
          })
        };
        console.log(formData);
        apiFactory
          .createMaterials(formData)
          .then(resp => {
            $scope.tab = 1;
            Notification.success(resp.data.message);
            $("#todo_modal").modal("hide");
            $("#profile-tab, #dcp1").removeClass("active");
            $("#home-tab, #material1").addClass("active");
            $("#material1").addClass("show");
            vm.inputImg = [];
            vm.uploadImg = [];
            vm.inputFiles = [];
            vm.uploadFiles = [];
            vm.selectedUnit = "";

            /* Setting below prop true to force decending order on material add instead of toggling states */
            vm.toggleObj.material.createdAt = true;
            vm.sortMaterials("createdAt", "material");
            vm.addMaterial = {
              conversionFactor: 1
            };
          })
          .catch(e => {
            console.log(e);
          });
      }
    };

    vm.getMaterialById = id => {
      apiFactory
        .getMaterialById(id)
        .then(resp => {
          console.log(resp);
        })
        .catch(e => {
          console.log(e);
        });
    };

    /* Event handler to reset add material modal */
    $("#addMaterial").on("hide.bs.modal", function() {
      $scope.activeJustified = 0;
      vm.addMaterial = {
        conversionFactor: 1
      };
    });

    /* Add Combo Material */
    vm.comboMaterialList = [];
    vm.addComboMaterialForm = {};
    vm.percentageAddition = [];

    /* get all material List */
    vm.mUnits = globals.mUnits;
    globals.getCurrency().then(resp => {
      vm.currencies = resp.data;
      vm.loadCurrencies = $query => {
        return new Promise((resolve, reject) => {
          resolve(resp.data);
        });
      };
    });

    apiFactory
      .listAllMaterials()
      .then(resp => {
        vm.allmaterilaList = resp.data.list;
      })
      .catch(e => {
        console.log(e);
      });

    vm.comboList = {
      quantity: 1,
      materialCost: 0,
      rooferCost: 0
    };

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

    vm.QtyChange = (val, data) => {
      let material = JSON.parse(data);
      if (val == "" || val == 0) {
        vm.comboList.quantity = 1;
        val = 1;
        vm.comboList.materialCost = parseFloat(
          Math.round(val * material.currentRate.materialCost.value * 100) / 100
        );
        vm.comboList.rooferCost = parseFloat(
          Math.round(val * material.currentRate.rooferCost.value * 100) / 100
        );
      } else {
        vm.comboList.materialCost = parseFloat(
          Math.round(val * material.currentRate.materialCost.value * 100) / 100
        );
        vm.comboList.rooferCost = parseFloat(
          Math.round(val * material.currentRate.rooferCost.value * 100) / 100
        );
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

        vm.addComboMaterialForm.comboMaterial = "";
        $(".select2-choice .select2-chosen").text("");
      }
    };

    vm.fileUpdated = (files, event, modal) => {
      console.log(vm.inputImg);
      let fileObj = event.target.files;
      vm.fileNames = Object.keys(fileObj).map(x => fileObj[x].name);
      angular.forEach(files, function(x, index) {
        x.description = "";
        if (modal == "image") {
          if (vm.uploadImg.length == 0) {
            vm.uploadImg.push(x);
          } else {
            let duplicateImg = false;
            angular.forEach(vm.uploadImg, function(y) {
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
            angular.forEach([].concat(vm.uploadFiles, vm.uploadImg), function(
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

    vm.createComboMaterialList = () => {
      var cmList = [];
      $scope.imgAndFiles = [].concat(vm.uploadImg, vm.uploadFiles);
      vm.comboMaterialList.forEach(x => {
        cmList.push({
          materialId: x.materialId,
          quantity: x.quantity,
          percentageAdditions: x.percentageAdditions
        });
      });

      var data = {
        name: vm.addComboMaterialForm.name,
        unit: vm.selectedUnit,
        comboMaterialList: cmList,
        files: $scope.imgAndFiles,
        assetObj: $scope.imgAndFiles.map((x, i) => {
          return {
            assetDescription: x.description
          };
        })
      };

      apiFactory
        .getSystemTag()
        .then(resp => {
          data.systemTag = resp.data.comboTag;
          apiFactory
            .createComboMaterial(data)
            .then(resp => {
              Notification.success(resp.data.message);
              $("#todo_modal.dcp_modal").modal("hide");
              $("#summary-tab, #dcp2-tab, #home-tab, #material2, #dcp2, #summary").removeClass("active");
              $("#material2, #dcp2, #summary").removeClass("show");
              $("#home-tab, #material2").addClass("active");
              $("#material1").addClass("show");
              vm.inputImg = [];
              vm.uploadImg = [];
              vm.inputFiles = [];
              vm.uploadFiles = [];
              vm.selectedUnit = "";
              vm.addComboMaterialForm = '';
            })
            .catch(e => {
              Notification.error(e.data.message);
            });
        })
        .catch(e => {
          Notification.error(e.data.message);
        });
    };

    vm.removeMateril = item => {
      vm.comboMaterialList.splice(item, 1);
    };
  }
})();
